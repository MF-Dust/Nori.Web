import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { IdleGeneratorDefinition } from "../apps/idle";
import type { ParadigmRevealStore } from "../state/paradigm-reveal-store";

/** Shipped IdleScreen `wt[*].primary.bright` and the universal `Aa` grey. */
const GENERATOR_ALIGNMENT_ACCENT: Record<string, string> = {
  none: "#67e8f9",
  accelerate: "#f87171",
  decelerate: "#a3e635",
  equilibrium: "#a5f3fc",
  universal: "#94a3b8",
};

/** Shipped `qe`: the accent of a generator's alignment. */
export function idleGeneratorAccent(generator: Pick<IdleGeneratorDefinition, "alignment">): string {
  return GENERATOR_ALIGNMENT_ACCENT[generator.alignment] ?? GENERATOR_ALIGNMENT_ACCENT.none;
}

export interface IdleTierToast {
  id: number;
  text: string;
  isFirst: boolean;
  accent: string;
}

export interface IdleFirstPurchase {
  generatorId: string;
  color: number;
  key: number;
}

/** Shipped `Vt`: the paradigm reveal toast lifetime. */
export const PARADIGM_REVEAL_TOAST_MS = 4_200;
/** Shipped first-online toast lifetime (`Nr`). */
export const IDLE_FIRST_ONLINE_TOAST_MS = 3_200;

/**
 * Shipped `Qs` first-purchase effect plus `Nr`: when a generator goes from
 * zero to owned, pulse the ribbon, raise a "<name> 上线" toast and play one
 * `idle-generator-first-online` cue 150ms later for the whole batch.
 */
export function useIdleFirstOnline(
  generators: readonly IdleGeneratorDefinition[],
  owned: Readonly<Record<string, number>>,
  playCue?: (cue: string) => void,
) {
  const [toasts, setToasts] = useState<IdleTierToast[]>([]);
  const [firstPurchase, setFirstPurchase] = useState<IdleFirstPurchase | null>(null);
  const previous = useRef<Readonly<Record<string, number>> | null>(null);
  const nextId = useRef(0);
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>());
  const cueRef = useRef(playCue);
  cueRef.current = playCue;
  const later = useCallback((callback: () => void, ms: number) => {
    const timer = setTimeout(() => {
      timers.current.delete(timer);
      callback();
    }, ms);
    timers.current.add(timer);
  }, []);
  useEffect(() => () => {
    for (const timer of timers.current) clearTimeout(timer);
    timers.current.clear();
  }, []);
  useEffect(() => {
    const before = previous.current;
    previous.current = owned;
    if (before === null || before === owned) return;
    let cued = false;
    for (const generator of generators) {
      if ((before[generator.id] ?? 0) >= 1 || (owned[generator.id] ?? 0) < 1) continue;
      const accent = idleGeneratorAccent(generator);
      setFirstPurchase((current) => ({
        generatorId: generator.id,
        color: Number.parseInt(accent.slice(1), 16),
        key: (current?.key ?? 0) + 1,
      }));
      const id = nextId.current++;
      setToasts((current) => [...current.slice(-3), { id, text: `${generator.name} 上线`, isFirst: true, accent }]);
      later(() => setToasts((current) => current.filter((toast) => toast.id !== id)), IDLE_FIRST_ONLINE_TOAST_MS);
      if (!cued) {
        cued = true;
        later(() => cueRef.current?.("idle-generator-first-online"), 150);
      }
    }
  }, [generators, later, owned]);
  return { toasts, firstPurchase };
}

function Blink({ side, accent }: { side: "left" | "right"; accent: string }) {
  return (
    <span
      aria-hidden="true"
      className={`absolute ${side === "left" ? "-left-3" : "-right-3"} top-1/2 -translate-y-1/2`}
      style={{ width: 8, height: 8, background: accent, animation: "tier-toast-blink 600ms steps(2) infinite" }}
    />
  );
}

/** Shipped `Tr`. */
export function IdleTierToasts({ toasts }: { toasts: readonly IdleTierToast[] }) {
  return (
    <div
      className="pointer-events-none absolute left-1/2 z-30 flex -translate-x-1/2 flex-col items-center gap-2"
      style={{ top: 110, filter: "var(--px-ui-glow, none)" }}
    >
      <style>{`
          @keyframes tier-toast-in {
            0%   { opacity: 0; transform: translateY(-4px); }
            10%  { opacity: 1; transform: translateY(0); }
            85%  { opacity: 1; transform: translateY(0); }
            100% { opacity: 0; transform: translateY(-4px); }
          }
          @keyframes tier-toast-blink {
            0%, 49% { opacity: 1; }
            50%, 100% { opacity: 0.35; }
          }
        `}</style>
      {toasts.map((toast) => (
        <div
          key={toast.id}
          data-test="idle-tier-toast"
          className="relative px-3 py-1.5 pixel-cjk pixel-fs-md tracking-[0.05em] pixel-rgb-soft"
          style={{
            animation: `tier-toast-in ${toast.isFirst ? 3200 : 2400}ms steps(6) forwards`,
            background: "#050811",
            color: toast.isFirst ? "#fff" : toast.accent,
            border: `2px solid ${toast.accent}`,
            boxShadow: `inset 0 0 0 2px #050811, 0 0 0 2px #050811, 4px 4px 0 0 ${toast.accent}33`,
          }}
        >
          <Blink side="left" accent={toast.accent} />
          {toast.text}
          <Blink side="right" accent={toast.accent} />
        </div>
      ))}
    </div>
  );
}

const PARADIGM_ACCENT = "#67e8f9";
const subscribeNothing = () => () => {};
const NO_REVEAL = { token: 0, muteNextSound: false };

/** Shipped `Ir`: the in-screen "高维范式 已解锁" toast. */
export function ParadigmRevealToast({
  store,
  playCue,
}: {
  store?: ParadigmRevealStore;
  playCue?: (cue: string) => void;
}) {
  const token = useSyncExternalStore(
    store ? store.subscribe : subscribeNothing,
    () => (store ? store.snapshot() : NO_REVEAL).token,
  );
  const [visible, setVisible] = useState(false);
  const mountedAt = useRef(performance.now());
  const cued = useRef(false);
  const cueTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const cueRef = useRef(playCue);
  cueRef.current = playCue;
  useEffect(() => () => clearTimeout(cueTimer.current), []);
  useEffect(() => {
    if (!store || token === 0) return;
    if (!cued.current) {
      cued.current = true;
      if (!store.consumeSoundMute()) {
        const delay = Math.max(0, 340 - (performance.now() - mountedAt.current));
        cueTimer.current = setTimeout(() => cueRef.current?.("idle-paradigm-reveal-toast"), delay);
      }
    }
    setVisible(true);
    const timer = setTimeout(() => {
      setVisible(false);
      cued.current = false;
      store.clear(token);
    }, PARADIGM_REVEAL_TOAST_MS);
    return () => clearTimeout(timer);
  }, [store, token]);
  if (!visible) return null;
  return (
    <div
      className="pointer-events-none absolute left-1/2 z-30 flex -translate-x-1/2 justify-center"
      style={{ top: 110, filter: "var(--px-ui-glow, none)" }}
    >
      <style>{`
          @keyframes paradigm-reveal-in {
            0%   { opacity: 0; transform: translateY(-4px); }
            6%   { opacity: 1; transform: translateY(0); }
            90%  { opacity: 1; transform: translateY(0); }
            100% { opacity: 0; transform: translateY(-4px); }
          }
        `}</style>
      <div
        data-test="paradigm-reveal-toast"
        className="relative px-3 py-1.5 pixel-cjk pixel-fs-md tracking-[0.05em] pixel-rgb-soft"
        style={{
          animation: `paradigm-reveal-in ${PARADIGM_REVEAL_TOAST_MS}ms steps(8) forwards`,
          background: "#050811",
          color: "#fff",
          border: `2px solid ${PARADIGM_ACCENT}`,
          boxShadow: `inset 0 0 0 2px #050811, 0 0 0 2px #050811, 4px 4px 0 0 ${PARADIGM_ACCENT}33`,
        }}
      >
        <Blink side="left" accent={PARADIGM_ACCENT} />
        高维范式 已解锁
        <Blink side="right" accent={PARADIGM_ACCENT} />
      </div>
    </div>
  );
}
