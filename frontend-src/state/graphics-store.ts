import { create } from "zustand";
import { persist } from "zustand/middleware";

export type GraphicsMode = "quality" | "performance" | "ultra-performance";
export function isGraphicsMode(value: unknown): value is GraphicsMode {
  return (
    value === "quality" ||
    value === "performance" ||
    value === "ultra-performance"
  );
}
interface GraphicsSettings {
  mode: GraphicsMode;
  source: "auto" | "user";
  setMode(mode: GraphicsMode): void;
  setModeAuto(mode: GraphicsMode): void;
}

/** Retains the shipped graphics-store v1 and v0 user-choice migration. */
export const useGraphicsSettings = create<GraphicsSettings>()(
  persist(
    (set) => ({
      mode: "quality",
      source: "auto",
      setMode: (mode) => {
        if (isGraphicsMode(mode)) set({ mode, source: "user" });
      },
      setModeAuto: (mode) => {
        if (isGraphicsMode(mode))
          set((state) => (state.source === "auto" ? { mode } : {}));
      },
    }),
    {
      name: "graphics-store",
      version: 1,
      migrate: (saved, version) => {
        const state = saved as Partial<GraphicsSettings>;
        return {
          ...state,
          source:
            version === 0 && state.mode !== undefined ? "user" : state.source,
        };
      },
      merge: (saved, current) => {
        const state = saved as Partial<GraphicsSettings> | null;
        return {
          ...current,
          mode: isGraphicsMode(state?.mode) ? state.mode : "quality",
          source: state?.source === "user" ? "user" : "auto",
        };
      },
    },
  ),
);

/** Shipped tier ladder and ultra-performance half-scale/30 fps rule. */
export function live2DRenderBudget(
  mode: GraphicsMode,
  height: number,
  dpr: number,
  lowGpu = false,
) {
  const ultra = mode === "ultra-performance";
  const requested = Math.max(1, height) * Math.min(dpr || 1, 2) * 1.25;
  const cap = mode !== "quality" && lowGpu ? 2048 : 3072;
  const bucket = Math.min(
    cap,
    [1024, 1536, 2048, 3072].find((size) => size >= requested) ?? 3072,
  );
  return {
    fps: ultra ? 30 : 60,
    resolution: Math.round(bucket * (ultra ? 0.5 : 1)),
  };
}

/** Grow immediately; wait four stable seconds before reducing the texture budget. */
export class ResolutionHysteresis {
  private current = 0;
  private pending: { value: number; since: number } | null = null;
  update(
    requested: number,
    now: number,
  ): { resolution: number; delay: number | null } {
    if (requested >= this.current || this.current === 0) {
      this.current = requested;
      this.pending = null;
    } else {
      if (this.pending?.value !== requested)
        this.pending = { value: requested, since: now };
      if (now - this.pending.since >= 4000) {
        this.current = requested;
        this.pending = null;
      }
    }
    return {
      resolution: this.current,
      delay: this.pending
        ? Math.max(1, 4000 - (now - this.pending.since))
        : null,
    };
  }
  reset() {
    this.current = 0;
    this.pending = null;
  }
}
