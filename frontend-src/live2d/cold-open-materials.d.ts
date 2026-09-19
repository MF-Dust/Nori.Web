import type {
  Scene,
  WebGLRenderer,
  PerspectiveCamera,
  Texture,
  IUniform,
  Vector3,
} from "three";
import type { NoriSceneState } from "../state/nori-scene";
export interface OceanStage {
  readonly status: "loading" | "ready" | "error" | "disposed";
  update(frame: { t: number; cine: NoriSceneState }): void;
  render(frame: { cine: NoriSceneState }): boolean;
  dispose(): void;
}
export function createOceanStage(
  scene: Scene,
  renderer: WebGLRenderer,
  camera: PerspectiveCamera,
): OceanStage;
export function createLiveSilhouette(renderer: WebGLRenderer): {
  update(texture: Texture): Texture;
  dispose(): void;
};
export interface GlyphKit {
  fieldTex: Texture;
  cloverSdfTex: Texture;
  applyUniforms(uniforms: Record<string, IUniform>): void;
}
export function createGlyphKit(signal?: AbortSignal): Promise<GlyphKit>;
export function updateGlyphAntialiasing(
  uniforms: Record<string, IUniform>,
  camera: PerspectiveCamera,
  height: number,
  position: Vector3,
): void;
