import {
  CanvasTexture,
  LinearFilter,
  PerspectiveCamera,
  Scene,
  Vector3,
  WebGLRenderer,
} from "three";
import {
  createBackground,
  createGrid,
  createParticles,
  createBokeh,
  createShadow,
  createModelSurface,
  createDebugGeometry,
  createShadowPrepass,
  updateSceneMaterials,
} from "./scene-materials.js";
import type { NoriSceneState } from "../state/nori-scene";
import type { AudioMixer } from "../runtime/audio-mixer";
import { ColdOpenRenderer } from "./cold-open-renderer";

export const NORI_BILLBOARD = { x: 0, y: -0.6, z: 0, width: 4, height: 8 };
export const NORI_CAMERAS = {
  desktop: { x: 0, y: 0, z: 7.4 },
  exclusive: { x: -1.5, y: 1.2, z: 2 },
};

/** Owns the Three.js scene and the source Cubism texture for one mounted session. */
export class NoriSceneRenderer {
  readonly renderer: WebGLRenderer;
  readonly camera = new PerspectiveCamera(60, 1, 0.1, 1000);
  readonly scene = new Scene();
  private bg = createBackground();
  private grid = createGrid();
  private particles = createParticles(150);
  private bokeh = createBokeh(60);
  private shadow = createShadow();
  private effect = createModelSurface();
  private debug = createDebugGeometry();
  private shadowPrepass: ReturnType<typeof createShadowPrepass>;
  private texture: CanvasTexture;
  private width = 1;
  private height = 1;
  private manifold = 0;
  private voidPhase = 0;
  private disposed = false;
  private coldOpen: ColdOpenRenderer | null = null;
  get coldOpenStatus() {
    return this.coldOpen?.status ?? "inactive";
  }
  private forward = new Vector3();
  private up = new Vector3();
  private projected = new Vector3();
  private top = new Vector3();
  constructor(
    canvas: HTMLCanvasElement,
    modelCanvas: HTMLCanvasElement,
    private audio: AudioMixer,
  ) {
    this.renderer = new WebGLRenderer({
      canvas,
      alpha: true,
      antialias: false,
    });
    this.camera.position.set(0, 0, 7.4);
    this.camera.rotation.order = "YXZ";
    this.shadowPrepass = createShadowPrepass(this.renderer);
    this.shadow.uniforms.silhouetteMap.value = this.shadowPrepass.texture;
    this.texture = new CanvasTexture(modelCanvas);
    this.texture.flipY = false;
    this.texture.minFilter = this.texture.magFilter = LinearFilter;
    this.scene.add(
      this.bg.mesh,
      this.grid.mesh,
      this.particles.points,
      this.bokeh.points,
      this.shadow.mesh,
      this.effect.mesh,
      this.debug.shadowWire,
      this.debug.groundLine,
      this.debug.aboveLine,
      this.debug.belowLine,
    );
    this.bg.mesh.renderOrder = -3;
    this.grid.mesh.renderOrder = 0;
    this.shadow.mesh.renderOrder = 9;
    this.effect.mesh.renderOrder = 10;
  }
  resize(width: number, height: number, pixelRatio: number) {
    if (this.disposed) return;
    this.width = Math.max(1, width);
    this.height = Math.max(1, height);
    this.renderer.setPixelRatio(pixelRatio);
    this.renderer.setSize(this.width, this.height, false);
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
  }
  render(
    time: number,
    state: NoriSceneState,
    options: {
      exclusive: boolean;
      pointer: { x: number; y: number };
      facts: ReadonlySet<string>;
      reducedMotion: boolean;
    },
  ) {
    if (this.disposed) return;
    const target =
      state.camera ?? NORI_CAMERAS[options.exclusive ? "exclusive" : "desktop"];
    const factor = state.camera ? Math.max(0, Math.min(1, state.lerp)) : 0.08;
    const parallax =
      state.camera || options.exclusive || options.reducedMotion ? 0 : 0.15;
    const ox = options.pointer.x * parallax,
      oy = options.pointer.y * parallax;
    this.camera.position.x +=
      (target.x + ox * 0.8 - this.camera.position.x) * factor;
    this.camera.position.y +=
      (target.y + oy * 0.4 - this.camera.position.y) * factor;
    this.camera.position.z += (target.z - this.camera.position.z) * factor;
    for (const axis of ["x", "y", "z"] as const)
      this.camera.rotation[axis] +=
        ((state.cameraRot?.[axis] ?? 0) - this.camera.rotation[axis]) * factor;
    if (!options.reducedMotion && state.shake > 0) {
      this.camera.position.x +=
        Math.sin(time * 47) * 0.06 * state.shake +
        Math.sin(time * 71.3) * 0.03 * state.shake;
      this.camera.position.y +=
        Math.cos(time * 53) * 0.05 * state.shake +
        Math.cos(time * 89.7) * 0.025 * state.shake;
      this.camera.rotation.z += Math.sin(time * 41) * 0.006 * state.shake;
    }
    const fov = Math.max(1, Math.min(150, state.fov ?? 60)),
      far = Math.max(1, state.cameraFar ?? 1000);
    if (this.camera.fov !== fov || this.camera.far !== far) {
      this.camera.fov = fov;
      this.camera.far = far;
      this.camera.updateProjectionMatrix();
    }
    const manifold = options.facts.has("arg.manifold_unlocked") ? 1 : 0;
    const voidPhase =
      options.facts.has("arg.memory.shown") &&
      !options.facts.has("arg.manifold_unlocked")
        ? 1
        : 0;
    this.manifold =
      state.manifoldEnv ?? this.manifold + (manifold - this.manifold) * 0.04;
    this.voidPhase =
      state.voidEnv ?? this.voidPhase + (voidPhase - this.voidPhase) * 0.04;
    const billboard = { ...NORI_BILLBOARD, z: state.noriDolly ?? 0 };
    const frame = {
      cine: state,
      lit: 1 - state.darkness,
      alert: state.alertLoop,
      alertT: state.alertClock,
      manifold: this.manifold,
      voidPhase: this.voidPhase,
      ox,
      oy,
      noriZ: billboard.z,
      debug: {
        debugBillboard: billboard,
        debugShadow: {
          opacity: 0.3,
          blurRadius: 0.025,
          lightDir: { x: 0, y: -0.95, z: -0.5 },
        },
        showShadow: true,
        shadowDepthTest: false,
        isDebug: false,
      },
    };
    this.texture.needsUpdate = true;
    if (state.coldOpen) {
      this.coldOpen ??= new ColdOpenRenderer(
        this.scene,
        this.renderer,
        this.camera,
        this.bg,
        this.effect,
      );
    } else if (this.coldOpen) {
      this.coldOpen.dispose();
      this.coldOpen = null;
    }
    const glyphActive =
      this.coldOpen?.update(time, state, this.texture, this.height) ?? false;
    this.shadowPrepass.update(this.texture, 0.025);
    updateSceneMaterials(this, frame, {
      t: time,
      live2DTexture: this.texture,
      glyphActive,
    });
    this.audio.setSpatialTransform(
      this.camera.position,
      this.forward.set(0, 0, -1).applyEuler(this.camera.rotation),
      this.up.set(0, 1, 0).applyEuler(this.camera.rotation),
      billboard,
    );
    if (!this.coldOpen?.render(state))
      this.renderer.render(this.scene, this.camera);
    this.projected
      .set(billboard.x, billboard.y, billboard.z)
      .project(this.camera);
    this.top
      .set(billboard.x, billboard.y + billboard.height / 2, billboard.z)
      .project(this.camera);
    const height = Math.abs(this.top.y - this.projected.y) * this.height;
    return {
      x: ((this.projected.x + 1) * this.width) / 2,
      y: ((1 - this.projected.y) * this.height) / 2,
      width: (height * billboard.width) / billboard.height,
      height,
    };
  }
  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.coldOpen?.dispose();
    this.coldOpen = null;
    for (const stage of [
      this.bg,
      this.grid,
      this.particles,
      this.bokeh,
      this.shadow,
      this.effect,
      this.debug,
      this.shadowPrepass,
    ])
      stage.dispose();
    this.texture.dispose();
    this.renderer.dispose();
    this.renderer.forceContextLoss();
    this.scene.clear();
  }
}
