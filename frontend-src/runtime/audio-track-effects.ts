export type AudioReverbPreset = "none" | "room" | "hall" | "cave";
export type AudioFilterType =
  | "none"
  | "lowpass"
  | "highpass"
  | "bandpass";

export interface AudioTrackEffectSnapshot {
  reverb: AudioReverbPreset;
  wetness: number;
  filter: AudioFilterType;
  frequency: number;
  q: number;
}

export const DEFAULT_AUDIO_TRACK_EFFECTS: AudioTrackEffectSnapshot = {
  reverb: "none",
  wetness: 0,
  filter: "none",
  frequency: 1000,
  q: 1,
};

const REVERB_PRESETS: Readonly<
  Record<
    Exclude<AudioReverbPreset, "none">,
    { duration: number; decay: number; damping: number; preDelay: number }
  >
> = {
  room: { duration: 0.8, decay: 3, damping: 0.5, preDelay: 0.01 },
  hall: { duration: 2.5, decay: 2, damping: 0.3, preDelay: 0.02 },
  cave: { duration: 4, decay: 1.5, damping: 0.2, preDelay: 0.05 },
};

const impulseCache = new WeakMap<
  BaseAudioContext,
  Map<Exclude<AudioReverbPreset, "none">, AudioBuffer>
>();

function createImpulse(
  context: BaseAudioContext,
  config: { duration: number; decay: number; damping: number; preDelay: number },
) {
  const rate = context.sampleRate;
  const length = Math.floor(rate * config.duration);
  const delay = Math.floor(rate * config.preDelay);
  const buffer = context.createBuffer(2, length, rate);
  const left = buffer.getChannelData(0);
  const right = buffer.getChannelData(1);
  for (let i = 0; i < length; i++) {
    const progress = i / length;
    const decay = Math.exp(-config.decay * progress);
    const damping = 1 - config.damping * progress;
    const l = (Math.random() * 2 - 1) * decay * damping;
    const r = (Math.random() * 2 - 1) * decay * damping;
    if (i < delay) {
      left[i] = 0;
      right[i] = 0;
    } else {
      const early =
        i < rate * 0.1 ? Math.sin(i * 0.1) * decay * 0.3 : 0;
      left[i] = l + early;
      right[i] = r + early * 0.8;
    }
  }
  let leftPeak = 0;
  let rightPeak = 0;
  for (let i = 0; i < length; i++) {
    leftPeak = Math.max(leftPeak, Math.abs(left[i]));
    rightPeak = Math.max(rightPeak, Math.abs(right[i]));
  }
  const peak = Math.max(leftPeak, rightPeak, 0.001);
  for (let i = 0; i < length; i++) {
    left[i] /= peak;
    right[i] /= peak;
  }
  return buffer;
}

function reverbImpulse(
  context: BaseAudioContext,
  preset: Exclude<AudioReverbPreset, "none">,
) {
  let cache = impulseCache.get(context);
  if (!cache) impulseCache.set(context, (cache = new Map()));
  let impulse = cache.get(preset);
  if (!impulse) {
    impulse = createImpulse(context, REVERB_PRESETS[preset]);
    cache.set(preset, impulse);
  }
  return impulse;
}

/** Clean-room reconstruction of the shipped per-track equal-power reverb/filter chain. */
export class AudioTrackEffects {
  readonly input: GainNode;
  readonly output: GainNode;
  private dry: GainNode;
  private wet: GainNode;
  private filter: BiquadFilterNode;
  private convolver: ConvolverNode | null = null;
  private reverb: AudioReverbPreset = "none";
  private filterType: AudioFilterType = "none";
  private reverbRequest = 0;
  private nyquist: number;

  constructor(private context: BaseAudioContext) {
    this.nyquist = context.sampleRate / 2;
    this.input = context.createGain();
    this.dry = context.createGain();
    this.wet = context.createGain();
    this.output = context.createGain();
    this.filter = context.createBiquadFilter();
    this.dry.gain.value = 1;
    this.wet.gain.value = 0;
    this.filter.type = "allpass";
    this.filter.frequency.value = this.nyquist;
    this.input.connect(this.dry);
    this.dry.connect(this.filter);
    this.filter.connect(this.output);
  }

  snapshot(): AudioTrackEffectSnapshot {
    const wet = Math.max(-1, Math.min(1, this.wet.gain.value));
    return {
      reverb: this.reverb,
      wetness: (Math.asin(wet) * 2) / Math.PI,
      filter: this.filterType,
      frequency: this.filter.frequency.value,
      q: this.filter.Q.value,
    };
  }

  async setReverb(preset: AudioReverbPreset, wetness = 0.3) {
    const request = ++this.reverbRequest;
    const wet = Math.max(0, Math.min(1, wetness));
    if (preset === "none") {
      this.dry.gain.value = 1;
      this.wet.gain.value = 0;
      this.convolver?.disconnect();
      this.convolver = null;
      this.reverb = "none";
      return;
    }
    const impulse = reverbImpulse(this.context, preset);
    if (request !== this.reverbRequest) return;
    if (!this.convolver) {
      this.convolver = this.context.createConvolver();
      this.input.connect(this.convolver);
      this.convolver.connect(this.wet);
      this.wet.connect(this.filter);
    }
    this.convolver.buffer = impulse;
    this.dry.gain.value = Math.cos((wet * Math.PI) / 2);
    this.wet.gain.value = Math.sin((wet * Math.PI) / 2);
    this.reverb = preset;
  }

  setWetness(value: number) {
    const wet = Math.max(0, Math.min(1, value));
    this.dry.gain.value = Math.cos((wet * Math.PI) / 2);
    this.wet.gain.value = Math.sin((wet * Math.PI) / 2);
  }

  setFilter(type: AudioFilterType, frequency = 1000, q = 1) {
    if (type === "none") {
      this.filter.type = "allpass";
      this.filter.frequency.value = this.nyquist;
      this.filterType = "none";
      return;
    }
    this.filter.type = type;
    this.filter.frequency.value = Math.max(
      0,
      Math.min(this.nyquist, frequency),
    );
    this.filter.Q.value = q;
    this.filterType = type;
  }

  setFilterFrequency(value: number) {
    this.filter.frequency.value = Math.max(
      0,
      Math.min(this.nyquist, value),
    );
  }

  setFilterQ(value: number) {
    this.filter.Q.value = value;
  }

  disconnect() {
    this.input.disconnect();
    this.dry.disconnect();
    this.wet.disconnect();
    this.filter.disconnect();
    this.output.disconnect();
    this.convolver?.disconnect();
  }
}
