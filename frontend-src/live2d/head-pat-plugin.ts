import type { Live2DPlugin } from "./engine.js";
import { HeadPat } from "./head-pat";

export function createHeadPatPlugin(gesture: HeadPat): Live2DPlugin {
  return { id: "headPat", install(model) {
    const core = model.model;
    const indices = ["ParamAngleX", "ParamAngleY", "ParamAngleZ"].map(name => {
      for (let i = 0; core && i < core.getParameterCount(); i++)
        if (core.getParameterId(i).getString().s === name) return i;
      return -1;
    });
    const position = [0, 0, 0], velocity = [0, 0, 0];
    return { update({ deltaTimeSeconds }) {
      if (!core) return;
      if (!gesture.enabled) { position.fill(0); velocity.fill(0); return; }
      const tuning = gesture.tuning();
      const dt = Math.min(.05, Math.max(0, deltaTimeSeconds));
      const yaw = Math.max(-tuning.maxYawDeg, Math.min(tuning.maxYawDeg, gesture.velocity * tuning.vxToYawDeg));
      const target = [yaw, gesture.pressing ? tuning.pressPitchDeg : 0, -yaw * tuning.rollPerYaw];
      for (let i = 0; i < 3; i++) {
        velocity[i] += (tuning.springStiffness * (target[i] - position[i]) - tuning.springDamping * velocity[i]) * dt;
        position[i] += velocity[i] * dt;
        if (indices[i] >= 0) core.setParameterValueByIndex(indices[i], core.getParameterValueByIndex(indices[i]) + position[i]);
      }
    }, dispose() { gesture.end(); } };
  } };
}
