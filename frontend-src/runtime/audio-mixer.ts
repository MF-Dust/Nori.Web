import type { AudioSettingsState } from "../state/audio-store";
import { UI_SOUND_CATALOG } from "./ui-sound-catalog";

export interface AudioRoute {
  context: AudioContext;
  input: AudioNode;
}
type Track = "music" | "sfx" | "voice";
type MixerSettings = Pick<
  AudioSettingsState,
  | "masterVolume"
  | "musicVolume"
  | "sfxVolume"
  | "voiceVolume"
  | "isMuted"
  | "musicMuted"
  | "sfxMuted"
  | "voiceMuted"
  | "spatialVoice"
>;
const unit = (value: number, fallback = 0) =>
  Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : fallback;

export const DESKTOP_MUSIC = {
  bgm1: "/audio/bgm1.m4a",
  bgm_manifold: "/audio/nori_daily_manifold.mp3",
  bgm_void: "/audio/bgm_void.m4a",
} as const;
export type DesktopMusic = keyof typeof DESKTOP_MUSIC;
export function desktopMusicTarget(facts: ReadonlySet<string>): {
  track: DesktopMusic | null;
  fade: number;
} {
  const corruption =
    !facts.has("virus.cleared") &&
    [1, 2, 3].every((n) => facts.has(`corrupt.doc${n}.read`));
  const track =
    (facts.has("qfr.installing") && !facts.has("qfr.installed")) || corruption
      ? null
      : facts.has("arg.ending.started")
        ? "bgm1"
        : facts.has("arg.manifold_unlocked")
          ? "bgm_manifold"
          : facts.has("act3.void_open")
            ? "bgm_void"
            : "bgm1";
  return { track, fade: corruption ? 5 : 2.5 };
}

/** Trim the shipped maximum 120 ms leading silence, using the 0.001 threshold. */
export function trimCueSilence(context: AudioContext, buffer: AudioBuffer) {
  let offset = Math.min(buffer.length, Math.floor(buffer.sampleRate * 0.12));
  for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
    const samples = buffer.getChannelData(channel);
    for (let i = 0; i < offset; i++)
      if (Math.abs(samples[i]) > 0.001) {
        offset = i;
        break;
      }
  }
  if (offset <= 0 || offset >= buffer.length) return buffer;
  const result = context.createBuffer(
    buffer.numberOfChannels,
    buffer.length - offset,
    buffer.sampleRate,
  );
  for (let channel = 0; channel < buffer.numberOfChannels; channel++)
    result.copyToChannel(
      buffer.getChannelData(channel).subarray(offset),
      channel,
    );
  return result;
}

interface PlayingSource {
  node: AudioBufferSourceNode;
  gain: GainNode;
  stop(): void;
}

/** One session-owned context and master/music/SFX/voice buses; no module-global audio lifetime. */
export class AudioMixer {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private tracks: Record<Track, GainNode> | null = null;
  private voiceInput: GainNode | null = null;
  private panner: PannerNode | null = null;
  private musicDuck: GainNode | null = null;
  private duckReleaseAt = 0;
  private settings: MixerSettings = {
    masterVolume: 80,
    musicVolume: 10,
    sfxVolume: 80,
    voiceVolume: 100,
    isMuted: false,
    musicMuted: false,
    sfxMuted: false,
    voiceMuted: false,
    spatialVoice: true,
  };
  private buffers = new Map<string, Promise<AudioBuffer>>();
  private effects = new Set<PlayingSource>();
  private musicSources = new Set<PlayingSource>();
  private media = new Map<HTMLMediaElement, MediaElementAudioSourceNode>();
  private abort = new AbortController();
  private disposed = false;
  private musicVersion = 0;
  private musicTarget: DesktopMusic | null = null;
  private musicFade = 2.5;
  private music: PlayingSource | null = null;
  private musicStarted: DesktopMusic | null = null;
  private detachUnlock: (() => void) | null = null;

  constructor(
    private createContext: () => AudioContext = () => new AudioContext(),
  ) {}

  private ensureContext() {
    if (this.disposed) throw new Error("Audio mixer is disposed");
    if (this.context) return this.context;
    const context = this.createContext();
    this.context = context;
    this.master = context.createGain();
    this.master.connect(context.destination);
    this.tracks = {
      music: context.createGain(),
      sfx: context.createGain(),
      voice: context.createGain(),
    };
    for (const track of Object.values(this.tracks)) track.connect(this.master);
    this.musicDuck = context.createGain();
    this.musicDuck.connect(this.tracks.music);
    this.voiceInput = context.createGain();
    this.sync(this.settings);
    return context;
  }

  installUnlock(target: EventTarget = document) {
    if (this.detachUnlock || this.disposed) return;
    const events = ["pointerdown", "pointerup", "touchend", "keydown", "click"];
    const unlock = () => {
      void this.unlock().catch(() => {});
    };
    for (const name of events)
      target.addEventListener(name, unlock, { capture: true, passive: true });
    this.detachUnlock = () => {
      for (const name of events) target.removeEventListener(name, unlock, true);
      this.detachUnlock = null;
    };
  }

  async unlock() {
    const context = this.ensureContext();
    await context.resume();
    if (this.disposed || context.state !== "running") return false;
    // Keep gesture listeners available after browser-initiated suspension.
    void this.startMusic().catch(() => {});
    return true;
  }

  async speechRoute(): Promise<AudioRoute> {
    if (!(await this.unlock())) throw new Error("Audio output is suspended");
    return { context: this.context!, input: this.voiceInput! };
  }

  sync(settings: MixerSettings) {
    this.settings = settings;
    if (!this.master || !this.tracks || !this.context || !this.voiceInput)
      return;
    this.master.gain.value = settings.isMuted
      ? 0
      : unit(settings.masterVolume / 100);
    for (const track of ["music", "sfx", "voice"] as const)
      this.tracks[track].gain.value = settings[`${track}Muted`]
        ? 0
        : unit(settings[`${track}Volume`] / 100);
    if (settings.spatialVoice && !this.panner) {
      const panner = this.context.createPanner();
      panner.panningModel = "HRTF";
      panner.distanceModel = "inverse";
      panner.positionY.value = 0.7;
      this.voiceInput.disconnect();
      this.voiceInput.connect(panner);
      panner.connect(this.tracks.voice);
      this.panner = panner;
    } else if (!settings.spatialVoice || !this.panner) {
      this.voiceInput.disconnect();
      this.panner?.disconnect();
      this.panner = null;
      this.voiceInput.connect(this.tracks.voice);
    }
  }

  private load(url: string, trim = false): Promise<AudioBuffer> {
    const key = `${trim}:${url}`;
    const cached = this.buffers.get(key);
    if (cached) return cached;
    const context = this.ensureContext();
    const pending = (async () => {
      const response = await fetch(url, { signal: this.abort.signal });
      if (
        !response.ok ||
        response.headers.get("content-type")?.includes("text/html")
      )
        throw new Error(`Audio asset unavailable: ${url}`);
      const decoded = await context.decodeAudioData(
        await response.arrayBuffer(),
      );
      if (this.disposed) throw new Error("Audio mixer is disposed");
      return trim ? trimCueSilence(context, decoded) : decoded;
    })();
    this.buffers.set(key, pending);
    void pending.catch(() => {
      if (this.buffers.get(key) === pending) this.buffers.delete(key);
    });
    return pending;
  }

  readonly playCue = (
    cue: string,
    options: { volume?: number; pitch?: number; duckMusic?: boolean } = {},
  ) => {
    const entry = UI_SOUND_CATALOG[cue];
    if (
      !entry ||
      this.disposed ||
      !this.context ||
      this.context.state !== "running"
    )
      return;
    const requestedAt = this.context.currentTime;
    void this.load(entry.url, true)
      .then((buffer) => {
        // A slow asset must not replay an old click after a tab resumes or a network stall ends.
        if (
          this.disposed ||
          this.context?.state !== "running" ||
          this.context.currentTime - requestedAt > 0.5
        )
          return;
        if (this.effects.size >= 32) this.effects.values().next().value?.stop();
        const source = this.createSource(
          buffer,
          this.tracks!.sfx,
          this.effects,
        );
        source.gain.gain.value = Math.max(
          0,
          Math.min(
            2,
            entry.gain *
              (Number.isFinite(options.volume) ? options.volume! : 1),
          ),
        );
        source.node.playbackRate.value = Number.isFinite(options.pitch)
          ? Math.max(0.1, Math.min(4, options.pitch!))
          : 1;
        source.node.start();
        if (options.duckMusic)
          this.duckMusic(buffer.duration / source.node.playbackRate.value);
      })
      .catch(() => {});
  };

  /** The caller owns cancellation, including while the asset is still loading. */
  readonly startCueLoop = (cue: string): (() => void) => {
    let cancelled = false;
    let source: PlayingSource | null = null;
    const stop = () => { cancelled = true; source?.stop(); source = null; };
    const entry = UI_SOUND_CATALOG[cue];
    if (!entry || this.disposed || this.context?.state !== "running") return stop;
    void this.load(entry.url, true).then(buffer => {
      if (cancelled || this.disposed || this.context?.state !== "running") return;
      if (this.effects.size >= 32) this.effects.values().next().value?.stop();
      source = this.createSource(buffer, this.tracks!.sfx, this.effects);
      source.gain.gain.value = entry.gain;
      source.node.loop = true;
      source.node.start();
    }).catch(() => {});
    return stop;
  };

  private createSource(
    buffer: AudioBuffer,
    destination: AudioNode,
    owner: Set<PlayingSource>,
  ): PlayingSource {
    const context = this.ensureContext();
    const node = context.createBufferSource(),
      gain = context.createGain();
    node.buffer = buffer;
    node.connect(gain);
    gain.connect(destination);
    let stopped = false;
    const source: PlayingSource = {
      node,
      gain,
      stop: () => {
        if (stopped) return;
        stopped = true;
        node.onended = null;
        try {
          node.stop();
        } catch {}
        node.disconnect();
        gain.disconnect();
        owner.delete(source);
      },
    };
    owner.add(source);
    node.onended = source.stop;
    return source;
  }

  duckMusic(hold: number, depth = 0.08, attack = 0.08, release = 0.6) {
    if (!this.context || !this.musicDuck || !Number.isFinite(hold)) return;
    const now = this.context.currentTime,
      parameter = this.musicDuck.gain;
    this.duckReleaseAt = Math.max(
      now + attack + Math.max(0, hold),
      this.duckReleaseAt,
    );
    parameter.cancelScheduledValues(now);
    parameter.setValueAtTime(parameter.value, now);
    parameter.linearRampToValueAtTime(unit(depth), now + attack);
    parameter.setValueAtTime(unit(depth), this.duckReleaseAt);
    parameter.linearRampToValueAtTime(1, this.duckReleaseAt + release);
  }

  setDesktopMusic(track: DesktopMusic | null, fade = 2.5) {
    if (this.disposed || this.musicTarget === track) return;
    this.musicTarget = track;
    this.musicFade = fade;
    this.musicVersion++;
    if (!track) {
      this.fadeMusic(fade);
      return;
    }
    if (this.context?.state === "running")
      void this.startMusic().catch(() => {});
  }

  private async startMusic() {
    const track = this.musicTarget,
      version = this.musicVersion;
    if (!track || track === this.musicStarted || this.disposed) return;
    const buffer = await this.load(DESKTOP_MUSIC[track]);
    if (
      this.disposed ||
      version !== this.musicVersion ||
      track === this.musicStarted
    )
      return;
    this.fadeMusic(this.musicFade);
    const source = this.createSource(
      buffer,
      this.musicDuck!,
      this.musicSources,
    );
    source.node.loop = true;
    source.gain.gain.setValueAtTime(0, this.context!.currentTime);
    source.gain.gain.linearRampToValueAtTime(
      1,
      this.context!.currentTime + this.musicFade,
    );
    source.node.start();
    this.music = source;
    this.musicStarted = track;
  }

  private fadeMusic(seconds: number) {
    // Only the current and fading track may remain alive during a crossfade.
    for (const source of this.musicSources)
      if (source !== this.music) source.stop();
    if (this.music && this.context) {
      const source = this.music,
        now = this.context.currentTime;
      source.gain.gain.cancelScheduledValues(now);
      source.gain.gain.setValueAtTime(source.gain.gain.value, now);
      source.gain.gain.linearRampToValueAtTime(0, now + seconds);
      source.node.stop(now + seconds);
    }
    this.music = null;
    this.musicStarted = null;
  }

  /** Shipped BrowserPageView routes podcasts through the SFX bus. */
  async connectMediaElement(element: HTMLMediaElement): Promise<() => void> {
    if (!(await this.unlock())) throw new Error("Audio output is suspended");
    let node = this.media.get(element);
    if (!node) {
      node = this.context!.createMediaElementSource(element);
      node.connect(this.tracks!.sfx);
      this.media.set(element, node);
    }
    const connection = node;
    return () => {
      connection.disconnect();
      this.media.delete(element);
    };
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.musicVersion++;
    this.abort.abort();
    this.detachUnlock?.();
    for (const source of [...this.effects, ...this.musicSources]) source.stop();
    for (const node of this.media.values()) node.disconnect();
    this.media.clear();
    this.buffers.clear();
    this.voiceInput?.disconnect();
    this.panner?.disconnect();
    this.musicDuck?.disconnect();
    if (this.tracks)
      for (const track of Object.values(this.tracks)) track.disconnect();
    this.master?.disconnect();
    void this.context?.close().catch(() => {});
    this.context = null;
  }
}
