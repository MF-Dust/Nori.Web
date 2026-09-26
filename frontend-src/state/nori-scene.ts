export interface ColdOpenState {
  ocean: boolean;
  oceanFade: number;
  oceanDepth: number;
  oceanGodray: number;
  oceanEdge: number;
  glyphDraw: number;
  glyphGlow: number;
  morph: number;
  noriForm: number;
  noriWash: number;
}
export interface NoriSceneState {
  coldOpen: ColdOpenState | null;
  plankton: number;
  burst: number;
  burstAge: number;
  active: boolean;
  camera: { x: number; y: number; z: number } | null;
  cameraRot: { x: number; y: number; z: number } | null;
  fov: number | null;
  cameraFar: number | null;
  lerp: number;
  shake: number;
  darkness: number;
  noriDolly: number | null;
  memoryComputeDrain: number;
  /**
   * Cumulative Memory `drain-burst` plays. Stays 0 until the drain window,
   * then 1 at the opening frame and one more every 180ms of scene time.
   * The count holds after the window so sprites already in flight can fade.
   */
  drainBurstSeq: number;
  noriTint: number;
  noriDim: number;
  noriReveal: number;
  redLight: number;
  alertLoop: number;
  alertClock: number;
  manifoldEnv: number | null;
  voidEnv: number | null;
  fogNear: number;
  fogFar: number;
  corruptVoice: boolean;
  chatMode: "normal" | "bubbles" | "hidden";
  /**
   * `"auto"` is the shipped `"fact"` channel value, not a synonym for "nothing".
   * The shipped music host resolves it as `n === "silent" ? null : n === "fact" ?
   * factTrack : ...`, i.e. "use the track the facts imply". `source-app` therefore
   * skips the override for `"auto"` and lets `desktopMusicTarget(facts)` pick.
   * Do not add a literal `"fact"` track id: there is no such asset.
   */
  bgm: "auto" | "silent" | "bgm1" | "bgm_manifold" | "bgm_void";
  noriSleep: boolean;
  noriTexture: "corrupt" | null;
  noriRestPose: boolean;
  eyeOpen: number | null;
  mouthOpen: number | null;
  noriSmile: boolean | null;
  noriExpression: string | null;
  noriIdleMotion: { group: string; index: number } | null;
  vignette: number;
  blur: number;
  whiteFlash: number;
}
const defaults = (): NoriSceneState => ({
  coldOpen: null,
  plankton: 0,
  burst: 0,
  burstAge: 0,
  active: false,
  camera: null,
  cameraRot: null,
  fov: null,
  cameraFar: null,
  lerp: 0.08,
  shake: 0,
  darkness: 0,
  noriDolly: null,
  memoryComputeDrain: 0,
  drainBurstSeq: 0,
  noriTint: 0,
  noriDim: 0,
  noriReveal: 1,
  redLight: 0,
  alertLoop: 0,
  alertClock: 0,
  manifoldEnv: null,
  voidEnv: null,
  fogNear: 20,
  fogFar: 220,
  corruptVoice: false,
  chatMode: "normal",
  bgm: "auto",
  noriSleep: false,
  noriTexture: null,
  noriRestPose: false,
  eyeOpen: null,
  mouthOpen: null,
  noriSmile: null,
  noriExpression: null,
  noriIdleMotion: null,
  vignette: 0,
  blur: 0,
  whiteFlash: 0,
});
/** Nested scene owners cannot overwrite or restore a released owner's state. */
export class NoriSceneStore {
  private state = defaults();
  private serial = 0;
  private layers: Array<{ id: number; state: NoriSceneState }> = [];
  private listeners = new Set<() => void>();
  snapshot = () => this.state;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  private publish() {
    this.state = this.layers.at(-1)?.state ?? defaults();
    this.listeners.forEach((listener) => listener());
  }
  acquire() {
    const id = ++this.serial;
    this.layers.push({ id, state: defaults() });
    this.publish();
    return {
      set: (patch: Partial<NoriSceneState>) => {
        const layer = this.layers.at(-1);
        if (layer?.id !== id) return;
        layer.state = { ...layer.state, ...patch };
        this.publish();
      },
      release: () => {
        const length = this.layers.length;
        this.layers = this.layers.filter((layer) => layer.id !== id);
        if (length !== this.layers.length) this.publish();
      },
    };
  }
  reset() {
    this.layers = [];
    this.publish();
  }
}
