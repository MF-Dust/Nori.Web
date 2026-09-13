import type { Live2DModel, Live2DPlugin } from "./engine.js";
import type { NoriSceneStore } from "../state/nori-scene";

function parameters(model: Live2DModel) {
  const result = new Map<string, number>(),
    core = model.model;
  if (core)
    for (let index = 0; index < core.getParameterCount(); index++)
      result.set(core.getParameterId(index).getString().s, index);
  return result;
}
export function createCinematicFacePlugin(scene: NoriSceneStore): Live2DPlugin {
  return {
    id: "cinematicFace",
    install(model) {
      const ids = parameters(model);
      let smile: boolean | null = null,
        sleep = false;
      return {
        update() {
          const state = scene.snapshot();
          const apply = (name: string, value: number | null) => {
            const index = ids.get(name);
            if (value !== null && Number.isFinite(value) && index !== undefined)
              model.model?.setParameterValueByIndex(index, value);
          };
          apply("ParamEyeLOpen", state.eyeOpen);
          apply("ParamEyeROpen", state.eyeOpen);
          apply("ParamMouthOpenY", state.mouthOpen);
          if (state.noriSmile !== smile) {
            if (state.noriSmile) model.addExpression("13_Happy");
            else if (smile) model.removeExpression("13_Happy");
            smile = state.noriSmile;
          }
          if (state.noriSleep !== sleep) {
            if (state.noriSleep) model.addExpression("Sleep");
            else model.removeExpression("Sleep");
            sleep = state.noriSleep;
          }
        },
        dispose() {
          if (smile) model.removeExpression("13_Happy");
          if (sleep) model.removeExpression("Sleep");
        },
      };
    },
  };
}
export function createThinkingLightPlugin(
  thinking: () => boolean,
): Live2DPlugin {
  return {
    id: "thinkingLight",
    install(model) {
      const parameter = parameters(model).get("ParamBreathLight");
      const resting = { offset: 0.7, amplitude: 0.2, speed: 2 },
        working = { offset: 0.55, amplitude: 0.45, speed: 6 };
      let state = thinking(),
        current = { ...(state ? working : resting) },
        from = current,
        target = current,
        blend = 1,
        phase = 0,
        enabled = true;
      return {
        get enabled() {
          return enabled;
        },
        setEnabled(value) {
          enabled = value;
        },
        update({ deltaTimeSeconds: dt }) {
          if (!enabled || parameter === undefined) return;
          const next = thinking();
          if (next !== state) {
            state = next;
            from = { ...current };
            target = next ? working : resting;
            blend = 0;
          }
          if (blend < 1) {
            blend = Math.min(1, blend + dt / 0.3);
            const ease =
              blend < 0.5 ? 2 * blend * blend : 1 - (-2 * blend + 2) ** 2 / 2;
            for (const key of ["offset", "amplitude", "speed"] as const)
              current[key] = from[key] + (target[key] - from[key]) * ease;
          }
          phase += dt * current.speed;
          model.model?.setParameterValueByIndex(
            parameter,
            current.offset + current.amplitude * Math.sin(phase),
          );
        },
        dispose() {},
      };
    },
  };
}
