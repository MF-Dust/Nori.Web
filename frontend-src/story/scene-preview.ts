import type { AudioMixer } from "../runtime/audio-mixer";
import type { NoriSceneStore } from "../state/nori-scene";
import { StoryClock } from "./story-clock";
import { StoryAudio } from "./story-audio";
import {
  projectScene,
  sceneProjectSchema,
  type SceneProject,
} from "./scene-project";

/** Scoped authoring transport. It has no director, RPC or story-completion capability. */
export class ScenePreview {
  private project: SceneProject;
  private clock: StoryClock;
  private audio: StoryAudio;
  private lease: ReturnType<NoriSceneStore["acquire"]>;
  private hidden = false;
  private disposed = false;
  private manualPause = false;
  private inspectionPhase: string | null = null;
  get paused() {
    return this.manualPause;
  }
  constructor(
    project: SceneProject,
    scene: NoriSceneStore,
    mixer: Pick<AudioMixer, "playSceneAudio" | "canPlay">,
  ) {
    this.project = sceneProjectSchema.parse(project);
    this.clock = new StoryClock(this.project.phases);
    this.audio = new StoryAudio(mixer, this.project.audio);
    this.lease = scene.acquire();
  }
  snapshot = () => this.clock.snapshot();
  private publish() {
    const state = this.snapshot();
    if (!this.disposed) {
      this.lease.set({
        ...projectScene(
          this.project,
          state.time,
          state.parkedAt,
          this.inspectionPhase,
        ),
        active: true,
        lerp: 1,
      });
      this.audio.sync(state);
    }
    return state;
  }
  advance(now: number) {
    this.clock.advance(now);
    return this.publish();
  }
  private suspension(now: number) {
    if (this.hidden || this.manualPause) this.clock.suspend(now);
    else this.clock.resume(now);
    return this.publish();
  }
  setHidden(hidden: boolean, now: number) {
    if (this.disposed) return this.snapshot();
    this.hidden = hidden;
    return this.suspension(now);
  }
  setPaused(paused: boolean, now: number) {
    if (this.disposed) return this.snapshot();
    this.manualPause = paused;
    if (!paused) this.inspectionPhase = null;
    if (!paused && this.snapshot().complete) this.clock.seek(0, now);
    return this.suspension(now);
  }
  seek(time: number, now: number) {
    if (this.disposed || !Number.isFinite(time) || !Number.isFinite(now))
      return this.snapshot();
    this.manualPause = true;
    this.inspectionPhase = null;
    this.clock.suspend(now);
    this.clock.seek(time, now);
    this.audio.seek(this.snapshot());
    return this.publish();
  }
  seekPhase(id: string, now: number) {
    if (
      this.disposed ||
      !Number.isFinite(now) ||
      !this.project.phases.some((phase) => phase.id === id)
    )
      return this.snapshot();
    this.manualPause = true;
    this.inspectionPhase = id;
    this.clock.suspend(now);
    this.clock.seekPhase(id, now);
    this.audio.seek(this.snapshot());
    return this.publish();
  }
  wake(now: number) {
    const gate = this.snapshot().parkedAt;
    if (!this.disposed && !this.hidden && gate) {
      this.inspectionPhase = null;
      this.clock.wake(gate, now);
    }
    return this.publish();
  }
  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.audio.dispose();
    this.clock.dispose();
    this.lease.release();
  }
}
