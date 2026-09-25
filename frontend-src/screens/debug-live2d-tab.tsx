import { useEffect, useState, useSyncExternalStore } from "react";
import type { NoriFrontendRuntime } from "../runtime/frontend-runtime";
import { LIVE2D_DEBUG_PLUGINS } from "../live2d/debug-runtime";
import type { NoriIdleState } from "../live2d/idle-controller";

const PLUGIN_LABELS: Readonly<Record<string, string>> = {
  dragToLook: "Drag to Look",
  breath: "Breath",
  eyeBlink: "Eye Blink",
  physics: "Physics",
  lipSync: "Lip Sync",
  thinkingLight: "Thinking Light",
};

const IDLE_STATES: ReadonlyArray<{ id: NoriIdleState; label: string }> = [
  { id: "idle", label: "Idle" },
  { id: "glitch", label: "Glitch" },
  { id: "kneel", label: "Kneel" },
  { id: "kneelCalm", label: "Kneel Calm" },
];

const TALK_TRACE_MS = 48;
const TALK_TRACE = [0,0,0.00122,0.00384,0.00166,0.06662,0.07272,0.0344,0.0188,0.02647,0.03784,0.06691,0.06208,0.05719,0.06938,0.03144,0.00316,0.00174,0.00256,0.00144,0.00153,0.00142,0.00071,0.02458,0.06837,0.02372,0.0214,0.03008,0.03871,0.04529,0.01474,0.04756,0.05204,0.04466,0.00788,0.00832,0.03955,0.05874,0.02771,0.03044,0.02894,0.04228,0.07022,0.09584,0.08827,0.08815,0.1182,0.10199,0.04946,0.01695,0.00504,0.01897,0.07106,0.08065,0.0691,0.00734,0.04076,0.05867,0.04933,0.00476,0.00322,0.00186,0.0012,0.00147,0.00103,0.00221,0.00248,0.00188,0.00508,0.05125,0.04488,0.01605,0.00769,0.02604,0.03416,0.04241,0.04886,0.0388,0.02351,0.01777,0.04663,0.05579,0.02318,0.0257,0.06338,0.04254,0.01833,0.05408,0.0461,0.02414,0.02402,0.01885,0.0424,0.04731,0.04671,0.05246,0.0582,0.05554,0.07946,0.07873,0.06153,0.01938,0.04646,0.06792,0.05078,0.06019,0.07686,0.07549,0.06516,0.02658,0.00622,0.03171,0.08674,0.10143,0.04172,0.00407,0.00194,0.00128,0.00136,0.00148,0.00151,0.00144,0.00143,0.03398,0.05043,0.01195,0.02792,0.07444,0.07008,0.05729,0.09363,0.07582,0.09954,0.10024,0.08483,0.0408,0.00686,0.00656,0.04507,0.06265,0.08752,0.07583,0.00626,0.00518,0.0289,0.04407,0.02634,0.02132,0.03014,0.04133,0.05537,0.05108,0.04059,0.04545,0.00721,0.00779,0.0344,0.05931,0.10794,0.03866,0.01829,0.06465,0.02779,0.01505,0.00623,0.00423,0.00191,0,0] as const;

function Range({
  label,
  min,
  max,
  step,
  value,
  disabled,
  onChange,
  format = (next: number) => next.toFixed(2),
}: {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  disabled?: boolean;
  onChange(value: number): void;
  format?(value: number): string;
}) {
  return (
    <label>
      {label}
      <input
        aria-label={label}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.valueAsNumber)}
      />
      <output>{format(value)}</output>
    </label>
  );
}

export function Live2DDebugTab({
  frontend,
}: {
  frontend: NoriFrontendRuntime;
}) {
  const state = useSyncExternalStore(
    frontend.live2dDebug.subscribe,
    frontend.live2dDebug.snapshot,
  );
  const story = useSyncExternalStore(
    frontend.story.subscribe,
    frontend.story.snapshot,
  );
  const [simulating, setSimulating] = useState(false);
  const blocked = story !== null;
  const lipEnabled = Boolean(state.plugins.lipSync);

  useEffect(() => {
    if (!simulating || blocked || !lipEnabled) {
      frontend.live2dDebug.setLipAmplitudeOverride(null);
      return;
    }
    let index = 0;
    let zeroFrames = 0;
    const tick = () => {
      if (zeroFrames > 0) {
        zeroFrames--;
        frontend.live2dDebug.setLipAmplitudeOverride(0);
        return;
      }
      frontend.live2dDebug.setLipAmplitudeOverride(TALK_TRACE[index] ?? 0);
      index++;
      if (index >= TALK_TRACE.length) {
        index = 0;
        zeroFrames = 6 + Math.floor(Math.random() * 12);
      }
    };
    tick();
    const timer = window.setInterval(tick, TALK_TRACE_MS);
    return () => {
      window.clearInterval(timer);
      frontend.live2dDebug.setLipAmplitudeOverride(null);
    };
  }, [blocked, frontend, lipEnabled, simulating]);

  if (!state.ready)
    return (
      <section aria-label="Live2D debug">
        <h2>Live2D</h2>
        <p role="status">Production model is not mounted.</p>
      </section>
    );

  const tuning = state.tuning;
  return (
    <section aria-label="Live2D debug">
      <h2>Live2D</h2>
      {blocked && <p role="status">Production story active; controls disabled.</p>}

      <h3>Plugins</h3>
      <div className="source-debug-lab-actions">
        {LIVE2D_DEBUG_PLUGINS.map((id) => (
          <button
            type="button"
            key={id}
            aria-pressed={state.plugins[id]}
            disabled={blocked}
            onClick={() => {
              const enabled = !state.plugins[id];
              frontend.live2dDebug.setPlugin(id, enabled);
              if (id === "lipSync" && !enabled) setSimulating(false);
            }}
          >
            {PLUGIN_LABELS[id]}
          </button>
        ))}
      </div>

      <h3>Pose</h3>
      <button
        type="button"
        aria-pressed={state.restPose}
        disabled={blocked}
        onClick={() => frontend.live2dDebug.setRestPose(!state.restPose)}
      >
        Rest Pose
      </button>

      <h3>Idle state</h3>
      <div className="source-debug-lab-actions">
        {IDLE_STATES.map((item) => (
          <button
            type="button"
            key={item.id}
            aria-pressed={tuning.idleStateOverride === item.id}
            disabled={blocked}
            onClick={() => frontend.live2dDebug.setIdleStateOverride(item.id)}
          >
            {item.label}
          </button>
        ))}
        <button
          type="button"
          disabled={blocked || tuning.idleStateOverride === null}
          onClick={() => frontend.live2dDebug.setIdleStateOverride(null)}
        >
          Follow story facts
        </button>
      </div>
      <p>
        Glitch and kneel states stay awake; the source runtime continues to
        derive the normal state from production facts when no override is set.
      </p>

      <h3>Idle / Sleep crossfade</h3>
      <Range
        label="Sleep fade-in"
        min={0}
        max={10}
        step={0.1}
        value={tuning.sleepFadeIn}
        disabled={blocked}
        onChange={(value) => frontend.live2dDebug.setSleepFadeIn(value)}
        format={(value) => `${value.toFixed(1)} s`}
      />
      <Range
        label="Idle fade-in (wake)"
        min={0}
        max={10}
        step={0.1}
        value={tuning.idleFadeIn}
        disabled={blocked}
        onChange={(value) => frontend.live2dDebug.setIdleFadeIn(value)}
        format={(value) => `${value.toFixed(1)} s`}
      />
      <div className="source-debug-lab-actions">
        <button
          type="button"
          disabled={blocked}
          onClick={() => frontend.live2dDebug.playIdle("idle")}
        >
          ▶ Idle (wake)
        </button>
        <button
          type="button"
          disabled={blocked}
          onClick={() => frontend.live2dDebug.playIdle("sleep")}
        >
          ▶ Sleep
        </button>
      </div>

      <h3>Lip Sync Test</h3>
      <label>
        <input
          type="checkbox"
          checked={simulating}
          disabled={blocked || !lipEnabled}
          onChange={(event) => setSimulating(event.target.checked)}
        />
        Simulate talking
      </label>
      <Range
        label="Amplitude"
        min={0}
        max={1}
        step={0.01}
        value={tuning.lipAmplitudeOverride ?? 0}
        disabled={blocked || !lipEnabled || simulating}
        onChange={(value) => frontend.live2dDebug.setLipAmplitudeOverride(value)}
        format={(value) => `${Math.round(value * 100)}%`}
      />
      <div className="source-debug-lab-actions">
        <button
          type="button"
          disabled={
            blocked ||
            !lipEnabled ||
            simulating ||
            tuning.lipAmplitudeOverride === null
          }
          onClick={() => frontend.live2dDebug.setLipAmplitudeOverride(null)}
        >
          Use audio amplitude
        </button>
        <span>
          {simulating
            ? "Simulating speech"
            : tuning.lipAmplitudeOverride === null
              ? "Using audio amplitude"
              : `Debug: ${Math.round(tuning.lipAmplitudeOverride * 100)}%`}
        </span>
      </div>
      <Range
        label="Intensity (mouth-open gain)"
        min={0}
        max={1.5}
        step={0.05}
        value={tuning.lipIntensity}
        disabled={blocked || !lipEnabled}
        onChange={(value) => frontend.live2dDebug.setLipIntensity(value)}
        format={(value) => `${value.toFixed(2)}×`}
      />
      <label>
        <input
          type="checkbox"
          checked={tuning.lipFormMode === "constant"}
          disabled={blocked || !lipEnabled}
          onChange={(event) =>
            frontend.live2dDebug.setLipFormMode(
              event.target.checked ? "constant" : "amplitude",
            )
          }
        />
        Mouth form: constant mode
      </label>
      {tuning.lipFormMode === "constant" ? (
        <Range
          label="Mouth form (constant)"
          min={-1}
          max={1}
          step={0.05}
          value={tuning.lipFormConstant}
          disabled={blocked || !lipEnabled}
          onChange={(value) => frontend.live2dDebug.setLipFormConstant(value)}
        />
      ) : (
        <Range
          label="Mouth form (width gain)"
          min={-1}
          max={1}
          step={0.05}
          value={tuning.lipFormIntensity}
          disabled={blocked || !lipEnabled}
          onChange={(value) => frontend.live2dDebug.setLipFormIntensity(value)}
          format={(value) => `${value.toFixed(2)}×`}
        />
      )}

      <h3>Expressions ({state.expressions.length})</h3>
      <div className="source-debug-lab-actions">
        {state.expressions.map((expression) => (
          <div key={expression.name}>
            <button
              type="button"
              aria-pressed={expression.active}
              disabled={blocked}
              onClick={() =>
                frontend.live2dDebug.toggleExpression(expression.name)
              }
            >
              {expression.name}
            </button>
            <Range
              label={`${expression.name} lip-sync share`}
              min={0}
              max={1}
              step={0.05}
              value={frontend.live2dDebug.expressionBlend(expression.name)}
              disabled={blocked || !lipEnabled}
              onChange={(value) =>
                frontend.live2dDebug.setExpressionBlend(expression.name, value)
              }
              format={(value) => `${Math.round(value * 100)}%`}
            />
          </div>
        ))}
      </div>

      <h3>Motions ({state.motions.length})</h3>
      <div className="source-debug-lab-actions">
        {state.motions.map((motion) => (
          <button
            type="button"
            key={`${motion.group}:${motion.index}`}
            disabled={blocked}
            title={motion.file}
            onClick={() =>
              frontend.live2dDebug.playMotion(motion.group, motion.index)
            }
          >
            Play {motion.group} {motion.index}
          </button>
        ))}
      </div>

      <button
        type="button"
        disabled={blocked}
        onClick={() => {
          setSimulating(false);
          frontend.live2dDebug.resetTuning();
        }}
      >
        Reset Live2D tuning
      </button>
    </section>
  );
}
