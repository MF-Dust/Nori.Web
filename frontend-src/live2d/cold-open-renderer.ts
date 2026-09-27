import type { PerspectiveCamera, Scene, Texture, WebGLRenderer } from "three";
import type { NoriSceneState } from "../state/nori-scene";
import type { SceneMaterialStage } from "./scene-materials.js";
import { createPlankton } from "./cold-open-particles.js";
import {
  createGlyphKit,
  createLiveSilhouette,
  createOceanStage,
  updateGlyphAntialiasing,
  type GlyphKit,
} from "./cold-open-materials.js";

/** One ocean/glyph owner; late loads cannot mutate a replacement scene. */
export class ColdOpenRenderer {
  private ocean;
  private plankton = createPlankton(3000);
  private silhouette: ReturnType<typeof createLiveSilhouette> | null = null;
  private kit: GlyphKit | null = null;
  private loading = false;
  private glyphError = false;
  private disposed = false;
  private abort = new AbortController();
  constructor(
    scene: Scene,
    private renderer: WebGLRenderer,
    private camera: PerspectiveCamera,
    private background: SceneMaterialStage,
    private model: SceneMaterialStage,
  ) {
    this.ocean = createOceanStage(scene, renderer, camera);
    scene.add(this.plankton.points);
  }
  get status() {
    if (this.disposed) return "disposed";
    if (this.glyphError || this.ocean.status === "error") return "error";
    return this.ocean.status === "ready" && this.kit ? "ready" : "loading";
  }
  update(
    time: number,
    state: NoriSceneState,
    texture: Texture,
    height: number,
  ) {
    if (this.disposed) return false;
    const cold = state.coldOpen;
    const particles = this.plankton.uniforms;
    particles.time.value = time;
    particles.opacity.value = state.plankton;
    particles.uDepth.value = cold?.oceanDepth ?? 0;
    particles.uFogNear.value = state.fogNear;
    particles.uFogFar.value = state.fogFar;
    this.plankton.points.visible = state.plankton > 0.001;
    const fade = Math.min(1, Math.max(0, cold?.oceanFade ?? 0));
    this.background.mesh.visible = fade < 1;
    this.background.uniforms.uReveal.value = 1 - fade;
    if (cold && !this.loading && !this.kit && !this.glyphError) {
      this.loading = true;
      void createGlyphKit(this.abort.signal)
        .then((kit) => {
          if (this.disposed) {
            kit.fieldTex.dispose();
            kit.cloverSdfTex.dispose();
            return;
          }
          this.kit = kit;
          kit.applyUniforms(this.model.uniforms);
        })
        .catch(() => {
          if (!this.disposed) this.glyphError = true;
        });
    }
    const glyphActive = Boolean(
      this.kit &&
      cold?.ocean &&
      (cold.glyphDraw > 0.0001 ||
        cold.morph > 0.0001 ||
        cold.noriWash > 0.0001) &&
      !(cold.morph >= 0.999 && cold.noriWash <= 0.001),
    );
    const uniforms = this.model.uniforms;
    uniforms.uDraw.value = cold?.glyphDraw ?? 0;
    uniforms.uGlow.value = cold?.glyphGlow ?? 0;
    uniforms.uMorph.value = cold?.morph ?? 0;
    uniforms.uWash.value = cold?.noriWash ?? 0;
    if (glyphActive) {
      this.silhouette ??= createLiveSilhouette(this.renderer);
      uniforms.uNoriSDF.value = this.silhouette.update(texture);
      updateGlyphAntialiasing(
        uniforms,
        this.camera,
        height,
        this.model.mesh.position,
      );
    }
    this.ocean.update({ t: time, cine: state });
    return glyphActive;
  }
  render(state: NoriSceneState) {
    return !this.disposed && this.ocean.render({ cine: state });
  }
  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.abort.abort();
    this.ocean.dispose();
    this.plankton.points.removeFromParent();
    this.plankton.dispose();
    this.silhouette?.dispose();
    this.kit?.fieldTex.dispose();
    this.kit?.cloverSdfTex.dispose();
    this.kit = null;
    for (const key of ["uField", "uCloverSDF", "uNoriSDF"])
      this.model.uniforms[key].value = null;
    for (const key of ["uDraw", "uGlow", "uMorph", "uWash", "uGlyphActive"])
      this.model.uniforms[key].value = 0;
    this.background.mesh.visible = true;
    this.background.uniforms.uReveal.value = 1;
  }
}
