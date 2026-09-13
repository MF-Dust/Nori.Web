export interface NoriSceneState {
  active: boolean;
  noriSleep: boolean;
  noriTexture: "corrupt" | null;
  noriRestPose: boolean;
  eyeOpen: number | null;
  mouthOpen: number | null;
  noriSmile: boolean | null;
  vignette: number;
  blur: number;
  whiteFlash: number;
}
const defaults = (): NoriSceneState => ({
  active: false,
  noriSleep: false,
  noriTexture: null,
  noriRestPose: false,
  eyeOpen: null,
  mouthOpen: null,
  noriSmile: null,
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
