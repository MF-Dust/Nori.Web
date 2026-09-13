export interface StoryPhase {
  id: string;
  duration: number;
  pauseAtStart?: boolean;
}
export interface StoryClockState {
  time: number;
  duration: number;
  phase: string | null;
  parkedAt: string | null;
  playing: boolean;
  complete: boolean;
}
/** A monotonic scene clock. Wall time spent parked never advances the timeline. */
export class StoryClock {
  private phases: Array<StoryPhase & { start: number; end: number }>;
  private consumed = new Set<string>();
  private anchor: number | null = null;
  private suspended = false;
  private disposed = false;
  private value: StoryClockState;
  constructor(phases: readonly StoryPhase[]) {
    let duration = 0;
    const ids = new Set<string>();
    this.phases = phases.map((phase) => {
      if (
        !phase.id ||
        ids.has(phase.id) ||
        !Number.isFinite(phase.duration) ||
        phase.duration < 0 ||
        !Number.isFinite(duration + phase.duration)
      )
        throw new Error(
          "Story phases require unique IDs and finite nonnegative durations",
        );
      ids.add(phase.id);
      const start = duration;
      duration += phase.duration;
      return { ...phase, start, end: duration };
    });
    this.value = {
      time: 0,
      duration,
      phase: null,
      parkedAt: null,
      playing: true,
      complete: false,
    };
    this.move(0);
  }
  snapshot = () => this.value;
  private move(target: number) {
    const gate = this.phases.find(
      (phase) =>
        phase.pauseAtStart &&
        !this.consumed.has(phase.id) &&
        phase.start <= target,
    );
    const time = gate?.start ?? Math.min(target, this.value.duration);
    const complete = !gate && time >= this.value.duration;
    const phase =
      gate ?? this.phases.find((item) => item.end > time) ?? this.phases.at(-1);
    this.value = {
      ...this.value,
      time,
      phase: phase?.id ?? null,
      parkedAt: gate?.id ?? null,
      complete,
      playing: !gate && !complete && !this.suspended,
    };
  }
  advance(now: number) {
    if (this.disposed || !Number.isFinite(now)) return this.value;
    const previous = this.anchor;
    this.anchor = previous === null ? now : Math.max(previous, now);
    if (previous !== null && this.value.playing)
      this.move(this.value.time + Math.max(0, now - previous) / 1000);
    return this.value;
  }
  /** Authoring-only discontinuity. Gates before the target are skipped, not completed.
   * Gates at/after the target are rearmed, including consecutive zero-length gates.
   * Production playback uses advance/wake and never calls this method. */
  seek(time: number, now: number) {
    if (this.disposed || !Number.isFinite(time) || !Number.isFinite(now))
      return this.value;
    const target = Math.max(0, Math.min(time, this.value.duration));
    this.consumed = new Set(
      this.phases
        .filter((phase) => phase.pauseAtStart && phase.start < target)
        .map((phase) => phase.id),
    );
    this.anchor = now;
    this.move(target);
    return this.value;
  }
  /** Select a phase exactly, even when several input gates share one timestamp. */
  seekPhase(id: string, now: number) {
    const index = this.phases.findIndex((phase) => phase.id === id);
    if (this.disposed || index < 0 || !Number.isFinite(now)) return this.value;
    this.consumed = new Set(
      this.phases
        .slice(0, index)
        .filter((phase) => phase.pauseAtStart)
        .map((phase) => phase.id),
    );
    this.anchor = now;
    this.move(this.phases[index].start);
    const selected = this.phases[index];
    const complete =
      !selected.pauseAtStart && selected.start === this.value.duration;
    this.value = {
      ...this.value,
      phase: selected.id,
      parkedAt: selected.pauseAtStart ? selected.id : null,
      complete,
      playing: !selected.pauseAtStart && !complete && !this.suspended,
    };
    return this.value;
  }
  wake(phase: string, now: number) {
    if (this.disposed || this.value.parkedAt !== phase || !Number.isFinite(now))
      return false;
    this.consumed.add(phase);
    this.anchor = now;
    this.move(this.value.time);
    return true;
  }
  suspend(now: number) {
    if (this.disposed || this.suspended) return;
    this.advance(now);
    this.suspended = true;
    this.value = { ...this.value, playing: false };
  }
  resume(now: number) {
    if (this.disposed || !this.suspended || !Number.isFinite(now)) return;
    this.suspended = false;
    this.anchor = now;
    this.move(this.value.time);
  }
  dispose() {
    this.disposed = true;
    this.value = { ...this.value, playing: false };
  }
}
