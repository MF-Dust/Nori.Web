import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { NoriFrontendRuntime } from "../runtime/frontend-runtime";
import { HeadPatAudio } from "../live2d/head-pat-audio";
import {
  HEAD_PAT_DEFAULT_TUNING,
  HEAD_PAT_TUNING_RANGES,
  type HeadPatTuning,
} from "../live2d/head-pat";

const LABELS: Readonly<Record<keyof HeadPatTuning, string>> = {
  requiredMs: "Required pat time",
  horizontalDominance: "Horizontal dominance",
  minSpeedX: "Min stroke speed",
  maxSampleGapMs: "Max sample gap",
  skullTopBand: "Head-top zone",
  leashHeadWidths: "Armed leash",
  vxToYawDeg: "Velocity to yaw",
  maxYawDeg: "Max yaw",
  rollPerYaw: "Roll per yaw",
  pressPitchDeg: "Press-down pitch",
  springStiffness: "Spring stiffness",
  springDamping: "Spring damping",
  strokeSmoothTau: "Stroke smoothing tau",
  strokeReleaseTau: "Stroke release tau",
  soundLevel: "Sound level",
  soundFreqScale: "Sound frequency scale",
  soundBodyGain: "Sound body gain",
};

const GROUPS: ReadonlyArray<{
  title: string;
  keys: readonly (keyof HeadPatTuning)[];
}> = [
  {
    title: "Gesture",
    keys: [
      "requiredMs", "horizontalDominance", "minSpeedX", "maxSampleGapMs",
      "skullTopBand", "leashHeadWidths", "strokeSmoothTau", "strokeReleaseTau",
    ],
  },
  {
    title: "Physical response",
    keys: [
      "vxToYawDeg", "maxYawDeg", "rollPerYaw", "pressPitchDeg",
      "springStiffness", "springDamping",
    ],
  },
  { title: "Pat sound", keys: ["soundLevel", "soundFreqScale", "soundBodyGain"] },
];

export function PatDebugTab({ frontend }: { frontend: NoriFrontendRuntime }) {
  const [, redraw] = useState(0);
  const [tuning, setTuning] = useState(() => frontend.headPat.tuning());
  const audition = useRef<HeadPatAudio | null>(null);
  const auditionFrame = useRef(0);
  const story = useSyncExternalStore(frontend.story.subscribe, frontend.story.snapshot);
  const blocked = story !== null;
  useEffect(() => {
    const timer = setInterval(() => redraw((value) => value + 1), 100);
    return () => clearInterval(timer);
  }, []);
  useEffect(
    () => () => {
      cancelAnimationFrame(auditionFrame.current);
      audition.current?.dispose();
    },
    [],
  );
  const update = (key: keyof HeadPatTuning, value: number) => {
    frontend.headPat.setTuning({ [key]: value });
    setTuning(frontend.headPat.tuning());
  };
  const stopAudition = () => {
    cancelAnimationFrame(auditionFrame.current);
    auditionFrame.current = 0;
    audition.current?.stop();
  };
  const startAudition = async (speed: number) => {
    if (blocked) return;
    stopAudition();
    await frontend.audio.unlock();
    audition.current ??= new HeadPatAudio(
      () => frontend.audio.sfxRoute(),
      () => frontend.headPat.tuning(),
    );
    const started = performance.now();
    const render = (now: number) => {
      if (now - started >= 2_000) {
        stopAudition();
        return;
      }
      audition.current?.update(
        Math.sin(((now - started) / 1_000) * Math.PI * 4) * speed * 3,
        true,
      );
      auditionFrame.current = requestAnimationFrame(render);
    };
    auditionFrame.current = requestAnimationFrame(render);
  };
  return (
    <section aria-label="Pat debug">
      <h2>Pat</h2>
      {blocked && <p role="status">Production story active; audition disabled.</p>}
      <h3>Live state</h3>
      <dl>
        <dt>Progress</dt>
        <dd>
          {(frontend.headPat.progress / 1_000).toFixed(1)} /{" "}
          {(tuning.requiredMs / 1_000).toFixed(1)} s
        </dd>
        <dt>Armed (touched head)</dt>
        <dd>{frontend.headPat.armed ? "yes" : "no"}</dd>
        <dt>Stroking now</dt>
        <dd>{frontend.headPat.pressing ? "yes" : "no"}</dd>
        <dt>Stroke velocity</dt>
        <dd>{frontend.headPat.velocity.toFixed(2)} head-widths/s</dd>
        <dt>Completions</dt>
        <dd>{frontend.headPat.completions}</dd>
        <dt>Last pointer phase</dt>
        <dd>{frontend.headPat.lastPhase || "—"}</dd>
        <dt>Pattable (state gate)</dt>
        <dd>{frontend.headPat.lastPattable ? "yes" : "no"}</dd>
        <dt>Drag pressed on desktop</dt>
        <dd>{frontend.headPat.lastOnSurface ? "yes" : "no"}</dd>
        <dt>In head-top zone</dt>
        <dd>{frontend.headPat.lastInZone ? "yes" : "no"}</dd>
        <dt>Pointer (model)</dt>
        <dd>
          {frontend.headPat.lastModelX.toFixed(2)},{" "}
          {frontend.headPat.lastModelY.toFixed(2)}
        </dd>
      </dl>
      <p>
        Gate rows update on pointer drags. Armed means the active drag has
        touched the projected head-top zone and remains valid until release.
      </p>
      {GROUPS.map((group) => (
        <div key={group.title}>
          <h3>{group.title}</h3>
          <div className="source-scene-channel-grid">
            {group.keys.map((key) => {
              const range = HEAD_PAT_TUNING_RANGES[key];
              return (
                <label key={key}>
                  {LABELS[key]}
                  <input
                    aria-label={`Pat ${LABELS[key]}`}
                    type="range"
                    min={range.min}
                    max={range.max}
                    step={range.step}
                    value={tuning[key]}
                    onChange={(event) => update(key, event.target.valueAsNumber)}
                  />
                  <output>{tuning[key]}</output>
                </label>
              );
            })}
          </div>
        </div>
      ))}
      <div className="source-debug-lab-actions">
        <button type="button" disabled={blocked} onClick={() => void startAudition(0.1)}>Slow rub 2s</button>
        <button type="button" disabled={blocked} onClick={() => void startAudition(0.5)}>Medium rub 2s</button>
        <button type="button" disabled={blocked} onClick={() => void startAudition(1)}>Fast rub 2s</button>
        <button type="button" onClick={stopAudition}>Stop rub</button>
        <button
          type="button"
          onClick={() => {
            frontend.headPat.resetTuning();
            setTuning({ ...HEAD_PAT_DEFAULT_TUNING });
          }}
        >
          Reset pat defaults
        </button>
      </div>
      <p>
        These controls and telemetry read from the production recognizer, projected
        model surface, spring and friction synth used by the real pat gesture.
      </p>
    </section>
  );
}
