import type { Scene, Points, IUniform } from "three";
import type { NoriSceneState } from "../state/nori-scene";
export function createPlankton(
  count: number,
  bounds?: {
    yLo: number;
    yHi: number;
    xHalf: number;
    zLo: number;
    zHi: number;
  },
): {
  points: Points;
  uniforms: Record<string, IUniform>;
  dispose(): void;
};
export function createWakeBurst(scene: Scene): {
  update(frame: {
    cine: NoriSceneState;
    billboard: { x: number; y: number; z: number; width: number };
  }): void;
  dispose(): void;
};
