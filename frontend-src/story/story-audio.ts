import type { AudioMixer } from "../runtime/audio-mixer";
import type { StoryClockState } from "./story-clock";
export interface StoryAudioTrack {
  id: string;
  src: string;
  at: number;
  until: number;
  gain?: number;
  srcStart?: number;
  fadeIn?: number;
  fadeOut?: number;
  loop?: boolean;
  kind?: "music" | "sfx" | "voice";
}
type TimelineMixer = Pick<AudioMixer, "playSceneAudio" | "canPlay">;
/** Each scene owns its track handles, including pending decode work. */
export class StoryAudio {
  private active = new Map<string, () => void>();
  private state: StoryClockState | null = null;
  private disposed = false;
  constructor(
    private mixer: TimelineMixer,
    private tracks: readonly StoryAudioTrack[],
  ) {
    const ids = new Set<string>();
    for (const track of tracks) {
      if (
        ids.has(track.id) ||
        !Number.isFinite(track.at) ||
        !Number.isFinite(track.until) ||
        track.at < 0 ||
        track.until <= track.at ||
        (track.srcStart !== undefined &&
          (!Number.isFinite(track.srcStart) || track.srcStart < 0))
      )
        throw new Error(
          "Story audio requires unique IDs and valid time ranges",
        );
      ids.add(track.id);
    }
  }
  sync(state: StoryClockState) {
    if (this.disposed) return;
    this.state = state;
    const audible = state.playing && this.mixer.canPlay();
    for (const track of this.tracks) {
      const wanted =
        audible && state.time >= track.at && state.time < track.until;
      const stop = this.active.get(track.id);
      if (!wanted && stop) {
        stop();
        this.active.delete(track.id);
      }
      if (wanted && !stop)
        this.active.set(
          track.id,
          this.mixer.playSceneAudio(track.src, {
            duration: track.until - track.at,
            gain: track.gain,
            srcStart: track.srcStart,
            fadeIn: track.fadeIn,
            fadeOut: track.fadeOut,
            loop: track.loop,
            track: track.kind,
            elapsed: () =>
              Math.max(0, (this.state?.time ?? track.at) - track.at),
          }),
        );
    }
  }
  /** Recreate even a still-active interval: an existing buffer cannot follow a scrub. */
  seek(state: StoryClockState) {
    if (this.disposed) return;
    this.stopTracks();
    this.sync(state);
  }
  private stopTracks() {
    this.active.forEach((stop) => stop());
    this.active.clear();
  }
  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.stopTracks();
    this.state = null;
  }
}
