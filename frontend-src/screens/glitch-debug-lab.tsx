import { useEffect, useRef, useState } from "react";
import type { NoriFrontendRuntime } from "../runtime/frontend-runtime";
import {
  CORRUPTION_GLITCH_DEFAULTS,
  createCorruptionGlitch,
  type CorruptionGlitchParams,
} from "../story/corruption-glitch.js";

type Glitch = ReturnType<typeof createCorruptionGlitch>;
type GlitchMode = "idle" | "running" | "frozen";

// Exact shipped Debug ranges and presets from Debug-D6AtxpLT/NormalApp-Cn6agT0F.
const GLITCH_PARAMETERS: Readonly<
  Record<
    keyof CorruptionGlitchParams,
    { label: string; min: number; max: number; step: number }
  >
> = {
  maxShiftPx: { label: "Max shift", min: 0, max: 120, step: 1 },
  sliceCount: { label: "Slices", min: 1, max: 24, step: 1 },
  blockiness: { label: "Blockiness", min: 0, max: 1, step: 0.05 },
  verticalAmount: { label: "Vertical", min: 0, max: 1, step: 0.05 },
  rgbSplitPx: { label: "RGB split", min: 0, max: 20, step: 1 },
  joltPx: { label: "Jolt", min: 0, max: 40, step: 1 },
  moshCells: { label: "Mosh cells", min: 0, max: 16, step: 1 },
  deepFry: { label: "Deep fry", min: 0, max: 1, step: 0.05 },
  noise: { label: "Static", min: 0, max: 1, step: 0.05 },
  invertChance: { label: "Invert chance", min: 0, max: 1, step: 0.05 },
  tickMs: { label: "Tick", min: 30, max: 300, step: 10 },
  density: { label: "Density", min: 0, max: 1, step: 0.05 },
};

const GLITCH_PRESETS: Readonly<
  Record<string, Readonly<CorruptionGlitchParams>>
> = {
  Mild: {
    maxShiftPx: 10,
    sliceCount: 4,
    blockiness: 0.35,
    verticalAmount: 0,
    rgbSplitPx: 2,
    joltPx: 2,
    tickMs: 120,
    density: 0.45,
    moshCells: 0,
    deepFry: 0,
    noise: 0,
    invertChance: 0,
  },
  Heavy: {
    maxShiftPx: 36,
    sliceCount: 10,
    blockiness: 0.6,
    verticalAmount: 0.12,
    rgbSplitPx: 7,
    joltPx: 10,
    tickMs: 80,
    density: 0.9,
    moshCells: 2,
    deepFry: 0.15,
    noise: 0.12,
    invertChance: 0,
  },
  Slam: {
    maxShiftPx: 90,
    sliceCount: 16,
    blockiness: 0.7,
    verticalAmount: 0.25,
    rgbSplitPx: 14,
    joltPx: 28,
    tickMs: 50,
    density: 1,
    moshCells: 7,
    deepFry: 0.55,
    noise: 0.35,
    invertChance: 0.18,
  },
  Mosh: {
    maxShiftPx: 55,
    sliceCount: 3,
    blockiness: 0.5,
    verticalAmount: 0.2,
    rgbSplitPx: 6,
    joltPx: 4,
    tickMs: 70,
    density: 0.95,
    moshCells: 12,
    deepFry: 0.1,
    noise: 0.15,
    invertChance: 0,
  },
  Fried: {
    maxShiftPx: 10,
    sliceCount: 3,
    blockiness: 0.5,
    verticalAmount: 0,
    rgbSplitPx: 3,
    joltPx: 3,
    tickMs: 110,
    density: 0.9,
    moshCells: 0,
    deepFry: 1,
    noise: 0.5,
    invertChance: 0.08,
  },
};

/** Shipped whole-page glitch controls backed by the Corruption production filter. */
export function GlitchDebugLab({
  frontend,
}: {
  frontend: NoriFrontendRuntime;
}) {
  const glitch = useRef<Glitch | null>(null);
  const frame = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [params, setParams] = useState<CorruptionGlitchParams>(() => ({
    ...CORRUPTION_GLITCH_DEFAULTS,
  }));
  const [mode, setMode] = useState<GlitchMode>("idle");
  const [blocked, setBlocked] = useState(() => frontend.story.snapshot() !== null);

  const stop = () => {
    cancelAnimationFrame(frame.current);
    clearTimeout(timer.current);
    frame.current = 0;
    timer.current = undefined;
    glitch.current?.freeze(false);
    glitch.current?.update(performance.now(), false);
    setMode("idle");
  };

  useEffect(() => {
    const instance = createCorruptionGlitch();
    glitch.current = instance;
    instance.setParams(params);
    const offStory = frontend.story.subscribe(() => {
      const active = frontend.story.snapshot() !== null;
      setBlocked(active);
      if (active) stop();
    });
    const offWorld = frontend.world.subscribe((_state, message) => {
      if (
        message.type === "world_joined" ||
        message.type === "world_created" ||
        message.type === "world_left"
      )
        stop();
    });
    return () => {
      offStory();
      offWorld();
      cancelAnimationFrame(frame.current);
      clearTimeout(timer.current);
      instance.dispose();
      if (glitch.current === instance) glitch.current = null;
    };
    // The instance owns its parameter copy after construction.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frontend]);

  const start = (duration?: number) => {
    if (blocked || !glitch.current) return;
    stop();
    setMode("running");
    const render = (now: number) => {
      glitch.current?.update(now, true);
      frame.current = requestAnimationFrame(render);
    };
    frame.current = requestAnimationFrame(render);
    if (duration !== undefined) timer.current = setTimeout(stop, duration);
  };

  const freeze = () => {
    if (blocked || !glitch.current) return;
    cancelAnimationFrame(frame.current);
    clearTimeout(timer.current);
    frame.current = 0;
    timer.current = undefined;
    glitch.current.freeze(false);
    glitch.current.renderOnce();
    glitch.current.freeze(true);
    setMode("frozen");
  };

  const apply = (next: CorruptionGlitchParams) => {
    glitch.current?.setParams(next);
    setParams(glitch.current?.params() ?? next);
    if (mode === "frozen") glitch.current?.renderOnce();
  };

  const update = (key: keyof CorruptionGlitchParams, value: number) => {
    if (!Number.isFinite(value)) return;
    apply({ ...params, [key]: value });
  };

  return (
    <section aria-label="Glitch tuner">
      <h2>Glitch</h2>
      <p role="status">
        {blocked
          ? "Production story active; glitch released."
          : mode === "idle"
            ? "Idle."
            : mode === "running"
              ? "Glitching."
              : "Holding one torn frame; Stop clears it."}
      </p>
      <div className="source-debug-lab-actions">
        <button type="button" disabled={blocked} onClick={() => start(400)}>
          Burst 400 ms
        </button>
        <button type="button" disabled={blocked} onClick={() => start(1500)}>
          Burst 1.5 s
        </button>
        <button type="button" disabled={blocked || mode === "running"} onClick={() => start()}>
          Start
        </button>
        <button type="button" disabled={mode === "idle"} onClick={stop}>
          Stop
        </button>
        <button type="button" disabled={blocked} onClick={freeze}>
          Freeze frame
        </button>
      </div>
      <h3>Presets</h3>
      <div className="source-debug-lab-actions">
        {Object.entries(GLITCH_PRESETS).map(([label, preset]) => (
          <button type="button" key={label} onClick={() => apply({ ...preset })}>
            {label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => apply({ ...CORRUPTION_GLITCH_DEFAULTS })}
        >
          Reset
        </button>
      </div>
      <h3>Tuning</h3>
      <div className="source-scene-channel-grid">
        {Object.entries(GLITCH_PARAMETERS).map(([name, metadata]) => {
          const key = name as keyof CorruptionGlitchParams;
          return (
            <label key={key}>
              {metadata.label}
              <input
                type="range"
                aria-label={`Glitch ${metadata.label}`}
                min={metadata.min}
                max={metadata.max}
                step={metadata.step}
                value={params[key]}
                onChange={(event) => update(key, event.target.valueAsNumber)}
              />
              <output>{params[key]}</output>
            </label>
          );
        })}
      </div>
    </section>
  );
}
