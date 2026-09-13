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
      const dt = Math.min(.05, Math.max(0, deltaTimeSeconds));
      const yaw = Math.max(-14, Math.min(14, gesture.velocity * 7));
      const target = [yaw, gesture.pressing ? -12.5 : 0, -yaw * .6];
      for (let i = 0; i < 3; i++) {
        velocity[i] += (70 * (target[i] - position[i]) - 9 * velocity[i]) * dt;
        position[i] += velocity[i] * dt;
        if (indices[i] >= 0) core.setParameterValueByIndex(indices[i], core.getParameterValueByIndex(indices[i]) + position[i]);
      }
    }, dispose() { gesture.end(); } };
  } };
}
