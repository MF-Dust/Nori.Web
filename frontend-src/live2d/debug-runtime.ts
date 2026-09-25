import type { Live2DModel } from "./engine.js";

export const LIVE2D_DEBUG_PLUGINS = [
  "dragToLook",
  "breath",
  "eyeBlink",
  "physics",
  "lipSync",
  "thinkingLight",
] as const;

export interface Live2DDebugSnapshot {
  ready: boolean;
  restPose: boolean;
  plugins: Readonly<Record<string, boolean>>;
  expressions: readonly { name: string; active: boolean }[];
  motions: readonly { group: string; index: number; file: string }[];
}

/** Mount diagnostics when the host runtime exposes them; rendering does not depend on Debug. */
export function attachLive2DDebug(
  runtime: Live2DDebugRuntime | undefined,
  model: Live2DModel,
) {
  return runtime?.attach(model);
}

const EMPTY: Live2DDebugSnapshot = {
  ready: false,
  restPose: false,
  plugins: {},
  expressions: [],
  motions: [],
};

/** Narrow developer facade over the currently mounted production Cubism model. */
export class Live2DDebugRuntime {
  private model: Live2DModel | null = null;
  private value = EMPTY;
  private listeners = new Set<() => void>();

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  snapshot = () => this.value;

  attach(model: Live2DModel) {
    this.model = model;
    this.refresh();
    return () => {
      if (this.model !== model) return;
      this.model = null;
      this.value = EMPTY;
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

  private refresh() {
    const model = this.model;
    if (!model) return;
    try {
      const active = new Set(model.getActiveExpressions());
      const setting = model.getSetting();
      const motions: Array<{ group: string; index: number; file: string }> = [];
      for (let groupIndex = 0; groupIndex < setting.getMotionGroupCount(); groupIndex++) {
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
      };
      this.emit();
    } catch {
      this.value = EMPTY;
      this.emit();
    }
  }

  private emit() {
    for (const listener of this.listeners) listener();
  }
}
