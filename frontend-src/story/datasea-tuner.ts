import type { DataseaRenderFrame } from "./datasea-renderer";

export interface DataseaTunerValues {
  time: number;
  phase: "descent" | "converge" | "cosmic";
  cameraX: number;
  cameraY: number;
  cameraZ: number;
  rotX: number;
  rotY: number;
  rotZ: number;
  fov: number;
}
type NumericTunerKey = Exclude<keyof DataseaTunerValues, "phase">;
export const DATASEA_TUNER_PARAMETERS: Record<
  NumericTunerKey,
  { label: string; min: number; max: number; step: number; default: number }
> = {
  time: { label: "Scene time", min: 0, max: 180.6, step: 0.1, default: 0 },
  cameraX: { label: "Camera X", min: -240, max: 240, step: 0.1, default: 0 },
  cameraY: { label: "Camera Y", min: -240, max: 40, step: 0.1, default: 0 },
  cameraZ: { label: "Camera Z", min: -40, max: 240, step: 0.1, default: 7.4 },
  rotX: { label: "Pitch", min: -Math.PI, max: Math.PI, step: 0.01, default: 0 },
  rotY: { label: "Yaw", min: -Math.PI, max: Math.PI, step: 0.01, default: 0 },
  rotZ: { label: "Roll", min: -Math.PI, max: Math.PI, step: 0.01, default: 0 },
  fov: { label: "Field of view", min: 20, max: 100, step: 0.5, default: 60 },
};
export function dataseaTunerDefaults(
  partial: Partial<DataseaTunerValues> = {},
): DataseaTunerValues {
  return {
    time: DATASEA_TUNER_PARAMETERS.time.default,
    phase: "descent",
    cameraX: DATASEA_TUNER_PARAMETERS.cameraX.default,
    cameraY: DATASEA_TUNER_PARAMETERS.cameraY.default,
    cameraZ: DATASEA_TUNER_PARAMETERS.cameraZ.default,
    rotX: DATASEA_TUNER_PARAMETERS.rotX.default,
    rotY: DATASEA_TUNER_PARAMETERS.rotY.default,
    rotZ: DATASEA_TUNER_PARAMETERS.rotZ.default,
    fov: DATASEA_TUNER_PARAMETERS.fov.default,
    ...partial,
  };
}
export function dataseaTunerFrame(
  values: DataseaTunerValues,
): DataseaRenderFrame {
  return {
    time: values.time,
    phase: values.phase,
    camera: { x: values.cameraX, y: values.cameraY, z: values.cameraZ },
    cameraRot: { x: values.rotX, y: values.rotY, z: values.rotZ },
    fov: values.fov,
  };
}
