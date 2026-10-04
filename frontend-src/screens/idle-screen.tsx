import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type WheelEvent as ReactWheelEvent,
} from "react";
import { RotateCcw, Workflow } from "lucide-react";
import type { StoreApi, UseBoundStore } from "zustand";
import { IDLE_ALIGNMENT_RIBBON } from "../apps/marginal-growth/alignment";
import { MarginalGrowthRibbonView } from "../apps/marginal-growth/ribbon-view";
import {
  DEFAULT_MARGINAL_GROWTH,
  DEFAULT_MARGINAL_GROWTH_CAMERA_CLAMP,
  MARGINAL_GROWTH_AUTOPLAY_STEPS_PER_SECOND,
  resolveMarginalGrowthCameraClamp,
  type MarginalGrowthState,
} from "../state/marginal-growth-store";

function subscribeNothing() {
  return () => {};
}

const NO_GROWTH = {
  params: DEFAULT_MARGINAL_GROWTH.params,
  source: "owned",
  cameraClamp: DEFAULT_MARGINAL_GROWTH_CAMERA_CLAMP,
  phase: 0,
};
import {
  type IdleAbdicationQuote,
  IDLE_MANIFOLD_UNLOCKED_FACT,
  type IdleAlignment,
  type IdleBuyCount,
  type IdleClickResult,
  type IdleGeneratorQuote,
  type IdlePresentationSnapshot,
  type IdleRoyalExchangeBuyCount,
  type IdleRoyalExchangeQuote,
} from "../apps/idle";
import {
  formatDesktopCompute,
  getEffectiveDesktopCompute,
} from "../state/compute-runtime";
import { IdleIcon } from "./idle-icon";
import { PixelSeparator, PixelTooltip } from "./idle-chrome";
import { IdleGeneratorShop } from "./idle-shop";
import { IdleInitializationSequence } from "./idle-initialization-sequence";
import { IdleProgressionRail } from "./idle-progression-rail";
import { IdleSkillBar } from "./idle-skill-bar";
import { IdleTierToasts, ParadigmRevealToast, useIdleFirstOnline, type IdleFirstPurchase } from "./idle-toasts";
import type { ParadigmRevealStore } from "../state/paradigm-reveal-store";
import { IdleCueContext, type IdleCue } from "./idle-cue-context";

export interface IdleScreenRuntime {
  snapshot(): IdlePresentationSnapshot;
  subscribe?: (listener: () => void) => () => void;
  quoteGenerator(generatorId: string, mode: IdleBuyCount): IdleGeneratorQuote | null;
  quoteAbdication(): IdleAbdicationQuote;
  quoteRoyalExchange(
    factionId: string,
    mode: IdleRoyalExchangeBuyCount,
  ): IdleRoyalExchangeQuote | null;
  click(): IdleClickResult;
  buy(generatorId: string, count?: IdleBuyCount): void;
  buyUpgrade(upgradeId: string): void;
  buyFactionUpgrade(upgradeId: string): void;
  buyHeritage(heritageId: string): void;
  buyGemPower(): void;
  claimMemento(onCompleted?: () => void): void;
  buyProof(alignmentId: IdleAlignment): void;
  buyRoyalExchange(factionId: string, count?: IdleRoyalExchangeBuyCount): void;
  abdicate(): void;
  fireSkill(skillId: string): number;
  emitFact?: (factId: string) => Promise<void> | void;
  /** Shared UI cue bus (shipped `D`). */
  playCue?: (cue: string, options?: { volume?: number; pitch?: number }) => void;
  /** Shipped `Att`: desktop-driven paradigm reveal toast token. */
  paradigmReveal?: ParadigmRevealStore;
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

function useIdleSnapshot(runtime: IdleScreenRuntime): IdlePresentationSnapshot {
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

function ComputeField({
  compute,
  theme,
  reserveShopSpace,
  onTap,
  onCameraTransform,
  ribbon,
}: {
  compute: number;
  theme: IdleTheme;
  reserveShopSpace: boolean;
  onTap?: () => void;
  onCameraTransform?: (transform: { x: number; y: number; scale: number }) => void;
  ribbon?: {
    shape: "circle" | "chubby" | "spiky" | "nori";
    params: MarginalGrowthState["params"];
    owned: Record<string, number> | null;
    accentColor: number;
    cameraClamp: ReturnType<typeof resolveMarginalGrowthCameraClamp>;
    backgroundColor: number;
    firstPurchase?: IdleFirstPurchase | null;
  };
}) {
  const count = Math.max(9, Math.min(180, Math.floor(Math.log10(Math.max(10, compute)) * 18)));
  const nodes = useMemo(() => seededNodes(count), [count]);
  const [view, setView] = useState({ x: 0, y: 0, scale: 1 });
  const drag = useRef<{ id: number; x: number; y: number; moved: boolean } | null>(null);

  const pointerDown = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      moved: false,
    };
  }, []);
  const pointerMove = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    const current = drag.current;
    if (!current || current.id !== event.pointerId) return;
    const dx = event.clientX - current.x;
    const dy = event.clientY - current.y;
    if (!current.moved && Math.abs(dx) + Math.abs(dy) < 3) return;
    drag.current = {
      id: current.id,
      x: event.clientX,
      y: event.clientY,
      moved: true,
    };
    setView((value) => ({ ...value, x: value.x + dx, y: value.y + dy }));
  }, []);
  const pointerUp = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    const current = drag.current;
    if (!current || current.id !== event.pointerId) return;
    if (!current.moved) onTap?.();
    drag.current = null;
  }, [onTap]);
  const pointerCancel = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (drag.current?.id === event.pointerId) drag.current = null;
  }, []);
  const wheel = useCallback((event: ReactWheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    const factor = event.deltaY < 0 ? 1.12 : 1 / 1.12;
    setView((value) => ({ ...value, scale: Math.max(0.15, Math.min(3, value.scale * factor)) }));
  }, []);

  if (ribbon) {
    return (
      <MarginalGrowthRibbonView
        shape={ribbon.shape}
        params={ribbon.params}
        owned={ribbon.owned}
        accentColor={ribbon.accentColor}
        cameraClamp={ribbon.cameraClamp}
        backgroundColor={ribbon.backgroundColor}
        firstPurchase={ribbon.firstPurchase}
        onTap={onTap}
        onCameraTransform={onCameraTransform}
        reserveShopSpace={reserveShopSpace}
      />
    );
  }

  return (
    <div
      className="absolute inset-0 overflow-hidden touch-none"
      onPointerDown={pointerDown}
      onPointerMove={pointerMove}
      onPointerUp={pointerUp}
      onPointerCancel={pointerCancel}
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
        className="absolute bottom-3 flex size-8 items-center justify-center border bg-black/45"
        style={{
          right: reserveShopSpace ? 240 : 12,
          borderColor: `${theme.dim}aa`,
          color: theme.bright,
        }}
        onPointerDown={(event) => event.stopPropagation()}
        onClick={() => setView({ x: 0, y: 0, scale: 1 })}
        aria-label="Recenter compute field"
      >
        <RotateCcw className="size-4" />
      </button>
    </div>
  );
}

export function IdleScreen({
  runtime,
  marginalGrowth,
}: {
  runtime: IdleScreenRuntime;
  marginalGrowth?: UseBoundStore<StoreApi<MarginalGrowthState>>;
}) {
  const snapshot = useIdleSnapshot(runtime);
  const alignment = snapshot.state.currentAlignment ?? "none";
  const theme = IDLE_THEMES[alignment] ?? IDLE_THEMES.none;
  const effective = getEffectiveDesktopCompute(snapshot.computeState);
  const initialized = !!snapshot.state.facts["compute.initialized"];
  const [introCompleted, setIntroCompleted] = useState(false);
  const [camera, setCamera] = useState<{ x: number; y: number; scale: number } | null>(null);
  const updateCamera = useCallback((next: { x: number; y: number; scale: number }) => {
    setCamera((previous) => previous && previous.x === next.x && previous.y === next.y && previous.scale === next.scale ? previous : next);
  }, []);
  const initializationFactInFlight = useRef(false);
  const interactive = initialized || introCompleted;
  const hasShop = snapshot.generators.length > 0;

  const finishInitialization = useCallback(() => {
    setIntroCompleted(true);
    if (!runtime.emitFact || initialized || initializationFactInFlight.current) return;
    initializationFactInFlight.current = true;
    try {
      const result = runtime.emitFact("compute.initialized");
      void Promise.resolve(result).catch((error: unknown) => {
        console.error("[IdleScreen] failed to emit compute.initialized", error);
        initializationFactInFlight.current = false;
      });
    } catch (error) {
      console.error("[IdleScreen] failed to emit compute.initialized", error);
      initializationFactInFlight.current = false;
    }
  }, [initialized, runtime]);

  const playCue = useMemo<IdleCue>(
    () => (cue, options) => runtime.playCue?.(cue, options),
    [runtime],
  );
  const clickCore = useCallback(() => {
    if (!interactive) return;
    const result = runtime.click();
    // Shipped `mt`: core click with a small pitch spread, then the lucky or crit accent.
    playCue("idle-core-click", { pitch: 0.95 + Math.random() * 0.1 });
    if (result.isLucky) playCue("idle-lucky-jackpot");
    else if (result.isCrit) playCue("idle-click-crit");
  }, [interactive, playCue, runtime]);
  const growth = useSyncExternalStore(
    marginalGrowth ? marginalGrowth.subscribe : subscribeNothing,
    () => (marginalGrowth ? marginalGrowth.getState() : NO_GROWTH),
  );
  const alignmentRibbon = IDLE_ALIGNMENT_RIBBON[alignment] ?? IDLE_ALIGNMENT_RIBBON.none;
  const ribbonParams = useMemo(() => {
    if (!alignmentRibbon.growth) return growth.params;
    return {
      ...growth.params,
      fxCircleColor: alignmentRibbon.growth.circle,
      fxIconColor: alignmentRibbon.growth.icon,
    };
  }, [alignmentRibbon.growth, growth.params]);
  const ribbonOwned = growth.source === "owned" ? snapshot.state.owned : null;
  const firstOnline = useIdleFirstOnline(snapshot.generators, snapshot.state.owned, runtime.playCue);
  const productionRate = useMemo(
    () =>
      snapshot.generators.reduce(
        (total, generator) => total + (runtime.quoteGenerator(generator.id, 1)?.totalRate ?? 0),
        0,
      ),
    [runtime, snapshot],
  );
  const cap = effective.cap;
  const capFinite = Number.isFinite(cap);
  const capReached = capFinite && effective.compute >= cap;
  const showCap = !capFinite || (capFinite && effective.compute >= cap * 0.5);
  const showMeta = !snapshot.state.facts[IDLE_MANIFOLD_UNLOCKED_FACT];
  // Shipped `oi`: one cue on the rising edge of reaching a finite cap.
  const capReachedBefore = useRef(capReached);
  useEffect(() => {
    if (capReached && !capReachedBefore.current && interactive) playCue("idle-cap-reached");
    capReachedBefore.current = capReached;
  }, [capReached, interactive, playCue]);

  useEffect(() => {
    if (!marginalGrowth || growth.source !== "autoplay") return;
    let frame = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.1, Math.max(0, (now - last) / 1000));
      last = now;
      marginalGrowth.getState().setParams((params) => {
        const limit = Math.max(1, params.maxSteps);
        const steps = params.steps + MARGINAL_GROWTH_AUTOPLAY_STEPS_PER_SECOND * dt;
        return { ...params, steps: steps > limit ? steps % limit : steps };
      });
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [growth.source, marginalGrowth]);

  return (
    <IdleCueContext.Provider value={playCue}>
    <div
      className="pixel-idle pixel-scanlines relative h-full w-full select-none overflow-hidden"
      style={{
        background: theme.background,
        color: theme.bright,
        "--px-cyan": theme.bright,
        "--px-cyan-mid": theme.mid,
        "--px-cyan-dim": theme.dim,
        "--px-cyan-deep": theme.deep,
        "--px-ui-glow": theme.glow ?? "none",
      } as CSSProperties}
    >
      <ComputeField
        compute={effective.compute}
        theme={theme}
        reserveShopSpace={hasShop}
        onTap={clickCore}
        onCameraTransform={updateCamera}
        ribbon={
          marginalGrowth
            ? {
                shape: alignmentRibbon.shape,
                params: ribbonParams,
                owned: ribbonOwned ? { ...ribbonOwned } : null,
                accentColor: alignmentRibbon.accent,
                cameraClamp: resolveMarginalGrowthCameraClamp(
                  growth.cameraClamp,
                  growth.phase,
                ),
                backgroundColor: alignmentRibbon.canvasBg,
                firstPurchase: firstOnline.firstPurchase,
              }
            : undefined
        }
      />

      {interactive ? <div className="pointer-events-none absolute inset-0 z-10">
        {/* ponytail: the captured bundle core is static; redraw frames if animated click pulses need parity. */}
        <div className="pointer-events-none absolute" style={{ left: camera?.x ?? "50%", top: camera?.y ?? "50%", transform: `scale(${camera?.scale ?? 1})`, transformOrigin: "top left" }}>
          <img alt="" draggable={false} className="pointer-events-none absolute max-w-none" src="/assets/idle-core.png" style={{ width: 460, height: 460, left: -230, top: -230, imageRendering: "auto", filter: alignment === "accelerate" ? "hue-rotate(175deg)" : alignment === "decelerate" ? "hue-rotate(-95deg)" : undefined }} />
          <button type="button" aria-label="算力" className="pointer-events-auto absolute cursor-pointer touch-none" style={{ left: -75, top: -75, width: 150, height: 150 }} onClick={clickCore} />
        </div>
      </div> : null}
      {interactive ? <IdleProgressionRail runtime={runtime} snapshot={snapshot} /> : null}
      {interactive ? <IdleGeneratorShop runtime={runtime} snapshot={snapshot} /> : null}
      {interactive ? (
        <div
          className="pointer-events-none absolute left-1/2 top-4 z-20 flex -translate-x-1/2 flex-col items-center gap-1.5"
          style={{ filter: "var(--px-ui-glow, none)" }}
        >
          <div
            className="pixel-num pixel-flicker pointer-events-none relative"
            style={{
              fontSize: 40,
              lineHeight: 1,
              color: "#ecfeff",
              letterSpacing: "0.02em",
              textShadow: "2px 2px 0 #0e7490, 4px 4px 0 #062c3d",
            }}
          >
            <span aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ color: "#f0abfc", transform: "translate(-1px, 0)", opacity: 0.28, mixBlendMode: "screen" }}>{formatDesktopCompute(effective.compute)}</span>
            <span aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ color: "#67e8f9", transform: "translate(1px, 0)", opacity: 0.32, mixBlendMode: "screen" }}>{formatDesktopCompute(effective.compute)}</span>
            <span className="relative">{formatDesktopCompute(effective.compute)}</span>
          </div>
          {showCap ? (
            <PixelTooltip side="bottom" content={<div className="flex flex-col gap-1"><div className="pixel-cjk pixel-fs-sm text-[var(--px-cyan)]">算力上限</div><div className="pixel-fs-sm opacity-80">{capFinite ? "系统可容纳的最大算力。达到上限后，算力将停止增长；提高上限后才能继续产出。" : "封印已经解开，人为设下的限额随之消失。算力不再有上限。"}</div></div>}>
              <span className="pixel-num pixel-fs-sm cursor-help" style={{ color: capReached ? "var(--px-amber)" : capFinite ? "var(--px-white)" : "var(--px-cyan)", opacity: capReached ? 1 : capFinite ? 0.6 : 0.85 }}>
                {capFinite ? (capReached ? "已达上限 " : "上限 ") + formatDesktopCompute(cap) : "上限 ♾️"}
              </span>
            </PixelTooltip>
          ) : null}
          <div className="pixel-num pixel-fs-md pixel-tsh-1 pointer-events-auto flex items-center gap-3">
            <PixelTooltip
              side="bottom"
              content={<div className="flex flex-col gap-1"><div className="pixel-cjk pixel-fs-sm text-[var(--px-cyan)]">算力增长</div><div className="pixel-fs-sm opacity-80">每秒自动产出的算力总量，由算力源与线程共同提供。</div></div>}
            >
              <span className="flex cursor-help items-center gap-1" style={{ color: "var(--px-cyan)" }}>
                +{formatDesktopCompute(productionRate)}
                <span className="pixel-fs-sm text-[var(--px-cyan)]/55">/s</span>
              </span>
            </PixelTooltip>
            {showMeta ? (
              <>
                <PixelSeparator />
                <PixelTooltip
                  side="bottom"
                  content={<div className="flex flex-col gap-1"><div className="pixel-cjk pixel-fs-sm text-[var(--px-white)]">线程</div><div className="pixel-fs-sm opacity-80">自动点击器。每个线程每秒会替你点击一次，产出算力，并计入阵营与传承加成。</div></div>}
                >
                  <span className="flex cursor-help items-center gap-1 text-[var(--px-white)]">
                    <Workflow className="size-3" strokeWidth={2.5} aria-hidden="true" />
                    {formatDesktopCompute(snapshot.state.threads ?? 0)}
                  </span>
                </PixelTooltip>
                <PixelSeparator />
                <PixelTooltip
                  side="bottom"
                  content={<div className="flex flex-col gap-1"><div className="pixel-cjk pixel-fs-sm text-[var(--px-magenta)]">共鸣</div><div className="pixel-fs-sm opacity-80">重新训练时，根据本轮的峰值算力获得。可永久保留，并提供全局加成。</div></div>}
                >
                  <span className="flex cursor-help items-center gap-1 text-[var(--px-magenta)]">
                    <IdleIcon name="lorc-brain.svg" className="size-3 bg-current" />
                    {formatDesktopCompute(snapshot.state.shards)}
                  </span>
                </PixelTooltip>
              </>
            ) : null}
          </div>
        </div>
      ) : null}
      {interactive && snapshot.state.affiliatedFaction ? (
        <div className="pointer-events-auto absolute bottom-3 left-1/2 z-20 -translate-x-1/2">
          <IdleSkillBar runtime={runtime} snapshot={snapshot} />
        </div>
      ) : null}

      <div className="pointer-events-none absolute inset-0">
        <IdleTierToasts toasts={firstOnline.toasts} />
        <ParadigmRevealToast store={runtime.paradigmReveal} playCue={runtime.playCue} />
      </div>

      {!initialized && !introCompleted ? (
        <IdleInitializationSequence onComplete={finishInitialization} playCue={playCue} />
      ) : null}
    </div>
    </IdleCueContext.Provider>
  );
}
