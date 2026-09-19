import type { Object3D, IUniform, WebGLRenderer, Texture } from "three";
export interface SceneMaterialStage {
  mesh: Object3D;
  uniforms: Record<string, IUniform>;
  dispose(): void;
}
export function createBackground(): SceneMaterialStage;
export function createGrid(): SceneMaterialStage;
export function createParticles(count: number): {
  points: Object3D;
  dispose(): void;
};
export function createBokeh(count: number): {
  points: Object3D;
  dispose(): void;
};
export function createShadow(): SceneMaterialStage;
export function createModelSurface(): SceneMaterialStage;
export function createDebugGeometry(): {
  shadowWire: Object3D;
  groundLine: Object3D;
  aboveLine: Object3D;
  belowLine: Object3D;
  dispose(): void;
};
export function createShadowPrepass(renderer: WebGLRenderer): {
  texture: Texture;
  update(texture: Texture, blur: number): void;
  dispose(): void;
};
export function updateSceneMaterials(
  scene: unknown,
  frame: unknown,
  input: { t: number; live2DTexture: Texture; glyphActive: boolean },
): void;
