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
) {
  const ultra = mode === "ultra-performance";
  const requested =
    Math.max(1, height) *
    Math.min(dpr || 1, ultra ? 1 : 2) *
    1.25 *
    (ultra ? 0.5 : 1);
  return {
    fps: ultra ? 30 : 60,
    resolution:
      [1024, 1536, 2048, 3072].find((size) => size >= requested) ?? 3072,
  };
}
