import type { Live2DModel } from "./engine.js";
import {
  NORI_IDLE_FADE_DEFAULTS,
  noriLipExpressionBlendValue,
  type NoriIdleState,
} from "./idle-controller";

export const LIVE2D_DEBUG_PLUGINS = [
  "dragToLook",
  "breath",
  "eyeBlink",
  "physics",
  "lipSync",
  "thinkingLight",
] as const;

export type Live2DLipFormMode = "amplitude" | "constant";

export interface Live2DDebugTuningSnapshot {
  idleStateOverride: NoriIdleState | null;
  sleepFadeIn: number;
  idleFadeIn: number;
  lipAmplitudeOverride: number | null;
  lipIntensity: number;
  lipFormIntensity: number;
  lipFormMode: Live2DLipFormMode;
  lipFormConstant: number;
  expressionBlends: Readonly<Record<string, number>>;
}

export interface Live2DDebugSnapshot {
  ready: boolean;
  restPose: boolean;
  plugins: Readonly<Record<string, boolean>>;
  expressions: readonly { name: string; active: boolean }[];
  motions: readonly { group: string; index: number; file: string }[];
  tuning: Live2DDebugTuningSnapshot;
}

const DEFAULT_TUNING: Live2DDebugTuningSnapshot = {
  idleStateOverride: null,
  sleepFadeIn: NORI_IDLE_FADE_DEFAULTS.sleepFadeIn,
  idleFadeIn: NORI_IDLE_FADE_DEFAULTS.idleFadeIn,
  lipAmplitudeOverride: null,
  lipIntensity: 0.4,
  lipFormIntensity: 1,
  lipFormMode: "amplitude",
  lipFormConstant: 0,
  expressionBlends: {},
};

const EMPTY_MODEL = {
  ready: false,
  restPose: false,
  plugins: {},
  expressions: [],
  motions: [],
} as const;

function finiteClamp(value: number, min: number, max: number, fallback: number) {
  return Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;
}

/** Mount diagnostics when the host runtime exposes them; rendering does not depend on Debug. */
export function attachLive2DDebug(
  runtime: Live2DDebugRuntime | undefined,
  model: Live2DModel,
) {
  return runtime?.attach(model);
}

/** Narrow developer facade over the currently mounted production Cubism model. */
export class Live2DDebugRuntime {
  private model: Live2DModel | null = null;
  private tuningValue: Live2DDebugTuningSnapshot = {
    ...DEFAULT_TUNING,
    expressionBlends: {},
  };
  private value: Live2DDebugSnapshot = {
    ...EMPTY_MODEL,
    tuning: this.tuningValue,
  };
  private listeners = new Set<() => void>();

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  snapshot = () => this.value;
  tuning = () => this.tuningValue;

  attach(model: Live2DModel) {
    this.model = model;
    this.refresh();
    return () => {
      if (this.model !== model) return;
      this.model = null;
      this.value = { ...EMPTY_MODEL, tuning: this.tuningValue };
      this.emit();
    };
  }

  setPlugin(id: (typeof LIVE2D_DEBUG_PLUGINS)[number], enabled: boolean) {
    if (!this.model) return false;
    this.model.setPluginEnabled(id, enabled);
    this.refresh();
    return true;
  }

  setRestPose(enabled: boolean) {
    if (!this.model) return false;
    this.model.setRestPose(enabled);
    this.refresh();
    return true;
  }

  toggleExpression(name: string) {
    if (!this.model || !this.value.expressions.some((item) => item.name === name))
      return false;
    if (this.model.getActiveExpressions().includes(name))
      this.model.removeExpression(name);
    else this.model.addExpression(name);
    this.refresh();
    return true;
  }

  playMotion(group: string, index: number) {
    if (
      !this.model ||
      !this.value.motions.some(
        (motion) => motion.group === group && motion.index === index,
      )
    )
      return false;
    this.model.startMotion({ steps: { group, index } });
    return true;
  }

  playIdle(kind: "idle" | "sleep") {
    if (!this.model) return false;
    this.model.startMotion({
      steps: {
        group: "Idle",
        index: kind === "sleep" ? 1 : 0,
        loop: true,
        fadeIn:
          kind === "sleep"
            ? this.tuningValue.sleepFadeIn
            : this.tuningValue.idleFadeIn,
      },
    });
    return true;
  }

  setIdleStateOverride(value: NoriIdleState | null) {
    this.patchTuning({ idleStateOverride: value });
  }

  setSleepFadeIn(value: number) {
    this.patchTuning({
      sleepFadeIn: finiteClamp(
        value,
        0,
        10,
        this.tuningValue.sleepFadeIn,
      ),
    });
  }

  setIdleFadeIn(value: number) {
    this.patchTuning({
      idleFadeIn: finiteClamp(value, 0, 10, this.tuningValue.idleFadeIn),
    });
  }

  setLipAmplitudeOverride(value: number | null) {
    this.patchTuning({
      lipAmplitudeOverride:
        value === null
          ? null
          : finiteClamp(value, 0, 1, this.tuningValue.lipAmplitudeOverride ?? 0),
    });
  }

  lipAmplitude(fallback: number) {
    return this.tuningValue.lipAmplitudeOverride ?? fallback;
  }

  setLipIntensity(value: number) {
    this.patchTuning({
      lipIntensity: finiteClamp(value, 0, 1.5, this.tuningValue.lipIntensity),
    });
  }

  setLipFormIntensity(value: number) {
    this.patchTuning({
      lipFormIntensity: finiteClamp(
        value,
        -1,
        1,
        this.tuningValue.lipFormIntensity,
      ),
    });
  }

  setLipFormMode(value: Live2DLipFormMode) {
    this.patchTuning({ lipFormMode: value });
  }

  setLipFormConstant(value: number) {
    this.patchTuning({
      lipFormConstant: finiteClamp(
        value,
        -1,
        1,
        this.tuningValue.lipFormConstant,
      ),
    });
  }

  setExpressionBlend(name: string, value: number) {
    if (!this.value.expressions.some((item) => item.name === name)) return false;
    this.patchTuning({
      expressionBlends: {
        ...this.tuningValue.expressionBlends,
        [name]: finiteClamp(
          value,
          0,
          1,
          this.expressionBlend(name),
        ),
      },
    });
    return true;
  }

  expressionBlend(name: string) {
    return (
      this.tuningValue.expressionBlends[name] ??
      noriLipExpressionBlendValue(name)
    );
  }

  resetTuning() {
    this.tuningValue = { ...DEFAULT_TUNING, expressionBlends: {} };
    this.publishTuning();
  }

  private patchTuning(patch: Partial<Live2DDebugTuningSnapshot>) {
    this.tuningValue = { ...this.tuningValue, ...patch };
    this.publishTuning();
  }

  private publishTuning() {
    this.value = { ...this.value, tuning: this.tuningValue };
    this.emit();
  }

  private refresh() {
    const model = this.model;
    if (!model) return;
    try {
      const active = new Set(model.getActiveExpressions());
      const setting = model.getSetting();
      const motions: Array<{ group: string; index: number; file: string }> = [];
      for (
        let groupIndex = 0;
        groupIndex < setting.getMotionGroupCount();
        groupIndex++
      ) {
        const group = setting.getMotionGroupName(groupIndex);
        for (let index = 0; index < setting.getMotionCount(group); index++)
          motions.push({
            group,
            index,
            file: setting.getMotionFileName(group, index) || `motion_${index}`,
          });
      }
      this.value = {
        ready: true,
        restPose: model.isRestPose(),
        plugins: Object.fromEntries(
          LIVE2D_DEBUG_PLUGINS.map((id) => [id, model.getPluginEnabled(id)]),
        ),
        expressions: model
          .getExpressionNames()
          .map((name) => ({ name, active: active.has(name) })),
        motions,
        tuning: this.tuningValue,
      };
      this.emit();
    } catch {
      this.value = { ...EMPTY_MODEL, tuning: this.tuningValue };
      this.emit();
    }
  }

  private emit() {
    for (const listener of this.listeners) listener();
  }
}
