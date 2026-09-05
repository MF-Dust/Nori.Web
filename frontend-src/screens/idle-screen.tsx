import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type WheelEvent as ReactWheelEvent,
} from "react";
import { Compass, RotateCcw, Zap } from "lucide-react";
import {
  formatDesktopCompute,
  getEffectiveDesktopCompute,
  type DesktopComputeState,
} from "../state/compute-runtime";

export type IdleAlignment = "none" | "accelerate" | "decelerate" | "equilibrium";

export interface IdleScreenSnapshot {
  computeState: DesktopComputeState;
  maxComputeThisRun?: number;
  currentAlignment?: IdleAlignment | null;
  facts: ReadonlySet<string>;
}

export interface IdleScreenRuntime {
  snapshot(): IdleScreenSnapshot;
  subscribe?: (listener: () => void) => () => void;
  emitFact?: (factId: string) => Promise<void> | void;
}

interface IdleTheme {
  deep: string;
  dim: string;
  mid: string;
  bright: string;
  background: string;
  glow?: string;
}

const IDLE_THEMES: Record<IdleAlignment, IdleTheme> = {
  none: {
    deep: "#062c3d",
    dim: "#0e7490",
    mid: "#22d3ee",
    bright: "#67e8f9",
    background: "#000000",
  },
  accelerate: {
    deep: "#2e0707",
    dim: "#991b1b",
    mid: "#ef4444",
    bright: "#f87171",
    background: "#140404",
  },
  decelerate: {
    deep: "#1a2e05",
    dim: "#4d7c0f",
    mid: "#84cc16",
    bright: "#a3e635",
    background: "#0a1414",
  },
  equilibrium: {
    deep: "#083344",
    dim: "#0891b2",
    mid: "#22d3ee",
    bright: "#a5f3fc",
    background: "#04161d",
    glow: "drop-shadow(0 0 2px rgba(165,243,252,.7)) drop-shadow(0 0 8px rgba(34,211,238,.45))",
  },
};

function useIdleSnapshot(runtime: IdleScreenRuntime): IdleScreenSnapshot {
  const [, setVersion] = useState(0);
  useEffect(() => {
    if (!runtime.subscribe) return;
    return runtime.subscribe(() => setVersion((value) => value + 1));
  }, [runtime]);
  return runtime.snapshot();
}

function seededNodes(count: number) {
  let seed = 42;
  const random = () => {
    seed = Math.imul(seed ^ (seed >>> 15), seed | 1);
    seed ^= seed + Math.imul(seed ^ (seed >>> 7), seed | 61);
    return ((seed ^ (seed >>> 14)) >>> 0) / 4294967296;
  };
  return Array.from({ length: count }, (_, index) => {
    const ring = Math.floor(Math.sqrt(index + 1));
    const angle = random() * Math.PI * 2;
    const radius = 34 + ring * 28 + random() * 18;
    return {
      id: index,
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
      size: 2 + (index % 3),
    };
  });
}

function ComputeField({ compute, theme }: { compute: number; theme: IdleTheme }) {
  const count = Math.max(9, Math.min(180, Math.floor(Math.log10(Math.max(10, compute)) * 18)));
  const nodes = useMemo(() => seededNodes(count), [count]);
  const [view, setView] = useState({ x: 0, y: 0, scale: 1 });
  const drag = useRef<{ id: number; x: number; y: number } | null>(null);

  const pointerDown = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY };
  }, []);
  const pointerMove = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    const current = drag.current;
    if (!current || current.id !== event.pointerId) return;
    const dx = event.clientX - current.x;
    const dy = event.clientY - current.y;
    drag.current = { id: current.id, x: event.clientX, y: event.clientY };
    setView((value) => ({ ...value, x: value.x + dx, y: value.y + dy }));
  }, []);
  const pointerUp = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (drag.current?.id === event.pointerId) drag.current = null;
  }, []);
  const wheel = useCallback((event: ReactWheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    const factor = event.deltaY < 0 ? 1.12 : 1 / 1.12;
    setView((value) => ({ ...value, scale: Math.max(0.15, Math.min(3, value.scale * factor)) }));
  }, []);

  return (
    <div
      className="absolute inset-0 overflow-hidden touch-none"
      onPointerDown={pointerDown}
      onPointerMove={pointerMove}
      onPointerUp={pointerUp}
      onPointerCancel={pointerUp}
      onWheel={wheel}
    >
      <div
        className="absolute left-1/2 top-1/2 size-0"
        style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})` }}
      >
        {nodes.map((node) => (
          <span
            key={node.id}
            className="absolute rounded-sm"
            style={{
              left: node.x,
              top: node.y,
              width: node.size,
              height: node.size,
              background: theme.mid,
              boxShadow: `0 0 8px ${theme.dim}`,
              opacity: 0.45 + (node.id % 5) * 0.1,
            }}
          />
        ))}
        <span
          className="absolute -left-5 -top-5 size-10 rounded-full border"
          style={{
            borderColor: theme.bright,
            background: theme.deep,
            boxShadow: `0 0 28px ${theme.dim}`,
            filter: theme.glow,
          }}
        />
      </div>
      <button
        type="button"
        className="absolute bottom-3 right-3 flex size-8 items-center justify-center border bg-black/45"
        style={{ borderColor: `${theme.dim}aa`, color: theme.bright }}
        onClick={() => setView({ x: 0, y: 0, scale: 1 })}
        aria-label="Recenter compute field"
      >
        <RotateCcw className="size-4" />
      </button>
    </div>
  );
}

export function IdleScreen({ runtime }: { runtime: IdleScreenRuntime }) {
  const snapshot = useIdleSnapshot(runtime);
  const alignment = snapshot.currentAlignment ?? "none";
  const theme = IDLE_THEMES[alignment] ?? IDLE_THEMES.none;
  const effective = getEffectiveDesktopCompute(snapshot.computeState);
  const initialized = snapshot.facts.has("compute.initialized");
  const [initializing, setInitializing] = useState(false);

  const initialize = useCallback(async () => {
    if (!runtime.emitFact || initializing || initialized) return;
    setInitializing(true);
    try {
      await runtime.emitFact("compute.initialized");
    } finally {
      setInitializing(false);
    }
  }, [initialized, initializing, runtime]);

  return (
    <div
      className="pixel-idle relative h-full w-full select-none overflow-hidden font-mono"
      style={{
        background: theme.background,
        color: theme.bright,
        "--px-cyan": theme.bright,
        "--px-cyan-mid": theme.mid,
        "--px-cyan-dim": theme.dim,
        "--px-cyan-deep": theme.deep,
      } as CSSProperties}
    >
      <ComputeField compute={effective.compute} theme={theme} />

      <div className="pointer-events-none absolute inset-0">
        <div
          className="pointer-events-auto absolute left-3 top-3 min-w-56 border bg-black/55 p-3 backdrop-blur-sm"
          style={{ borderColor: `${theme.dim}99` }}
        >
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] opacity-70">
            <Zap className="size-3.5" />
            COMPUTE
          </div>
          <div className="mt-1 text-2xl tabular-nums" style={{ filter: theme.glow }}>
            {formatDesktopCompute(effective.compute)}
          </div>
          <div className="mt-1 flex justify-between text-[10px] opacity-65">
            <span>CAP {formatDesktopCompute(effective.cap)}</span>
            <span>{effective.draining ? "DRAIN" : "STABLE"}</span>
          </div>
        </div>

        <div
          className="absolute bottom-3 left-3 flex items-center gap-2 border bg-black/55 px-3 py-2 text-[10px] uppercase tracking-[0.14em] backdrop-blur-sm"
          style={{ borderColor: `${theme.dim}99` }}
        >
          <Compass className="size-3.5" />
          <span>{alignment}</span>
          {snapshot.maxComputeThisRun != null ? (
            <span className="opacity-60">
              PEAK {formatDesktopCompute(snapshot.maxComputeThisRun)}
            </span>
          ) : null}
        </div>
      </div>

      {!initialized ? (
        <div className="absolute inset-0 z-40 grid place-items-center bg-black/80 p-6">
          <div
            className="w-[min(28rem,100%)] border bg-black/85 p-5"
            style={{ borderColor: theme.mid, boxShadow: `0 0 40px ${theme.deep}` }}
          >
            <div className="text-xs uppercase tracking-[0.3em] opacity-60">NORI COMPUTE CORE</div>
            <div className="mt-3 text-lg">Compute field initialization</div>
            <div className="mt-2 text-xs leading-5 opacity-70">
              Topology online. Local field renderer ready. Initialization is recorded as a world fact.
            </div>
            <button
              type="button"
              disabled={!runtime.emitFact || initializing}
              onClick={() => void initialize()}
              className="mt-5 border px-3 py-2 text-xs uppercase tracking-[0.2em] disabled:opacity-40"
              style={{ borderColor: theme.mid, color: theme.bright }}
            >
              {initializing ? "INITIALIZING" : "INITIALIZE"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
