import {
  corruptionCurve,
  corruptionPreset,
  type CorruptionPreset,
} from "./voice-corruption-presets";

const modules = new WeakMap<BaseAudioContext, Map<string, Promise<void>>>();
async function loadModule(context: BaseAudioContext, url: string) {
  let cache = modules.get(context);
  if (!cache) modules.set(context, (cache = new Map()));
  let task = cache.get(url);
  if (!task) {
    task = context.audioWorklet.addModule(url);
    cache.set(url, task);
    void task.catch(() => {
      if (cache!.get(url) === task) cache!.delete(url);
    });
  }
  return task;
}
export function roomImpulse(context: BaseAudioContext, random = Math.random) {
  const rate = context.sampleRate,
    length = Math.floor(rate * 0.8),
    delay = Math.floor(rate * 0.01);
  const buffer = context.createBuffer(2, length, rate),
    left = buffer.getChannelData(0),
    right = buffer.getChannelData(1);
  let peak = 0.001;
  for (let i = 0; i < length; i++) {
    const progress = i / length,
      decay = Math.exp(-3 * progress),
      damping = 1 - 0.5 * progress;
    const a = (random() * 2 - 1) * decay * damping,
      b = (random() * 2 - 1) * decay * damping;
    if (i < delay) continue;
    const early = i < rate * 0.1 ? Math.sin(i * 0.1) * decay * 0.3 : 0;
    left[i] = a + early;
    right[i] = b + early * 0.8;
    peak = Math.max(peak, Math.abs(left[i]), Math.abs(right[i]));
  }
  for (let i = 0; i < length; i++) {
    left[i] /= peak;
    right[i] /= peak;
  }
  return buffer;
}

/** Native fallback remains available when the source worklet cannot load. */
export class VoiceCorruption {
  readonly input: GainNode;
  readonly output: GainNode;
  private nodes: AudioNode[] = [];
  private dry: GainNode;
  private wet: GainNode;
  private wetHead: GainNode;
  private shaper: WaveShaperNode;
  private ring: GainNode;
  private ringOsc: OscillatorNode;
  private ringDepth: GainNode;
  private band: BiquadFilterNode;
  private delay: DelayNode;
  private warble: OscillatorNode;
  private warbleDepth: GainNode;
  private processor: AudioWorkletNode | null = null;
  private loading: Promise<boolean> | null = null;
  private disposed = false;
  private enabled = false;
  private preset: CorruptionPreset = "unstable";
  private intensity = 0.7;
  constructor(private context: BaseAudioContext) {
    const keep = <T extends AudioNode>(node: T): T => {
      this.nodes.push(node);
      return node;
    };
    const gain = () => keep(context.createGain());
    this.input = gain();
    this.output = gain();
    this.dry = gain();
    this.wet = gain();
    this.wetHead = gain();
    this.input.connect(this.dry).connect(this.output);
    this.input.connect(this.wetHead);
    this.shaper = keep(context.createWaveShaper());
    this.shaper.oversample = "none";
    this.ring = gain();
    this.ringOsc = keep(context.createOscillator());
    this.ringDepth = gain();
    this.band = keep(context.createBiquadFilter());
    this.delay = keep(context.createDelay(0.05));
    this.delay.delayTime.value = 0.008;
    this.warble = keep(context.createOscillator());
    this.warbleDepth = gain();
    const compressor = keep(context.createDynamicsCompressor());
    compressor.threshold.value = -14;
    compressor.knee.value = 10;
    compressor.ratio.value = 6;
    compressor.attack.value = 0.003;
    compressor.release.value = 0.12;
    this.wetHead
      .connect(this.shaper)
      .connect(this.ring)
      .connect(this.band)
      .connect(this.delay)
      .connect(compressor);
    const convolver = keep(context.createConvolver());
    convolver.buffer = roomImpulse(context);
    const reverbDry = gain(),
      reverbWet = gain();
    reverbDry.gain.value = Math.cos((0.3 * Math.PI) / 2);
    reverbWet.gain.value = Math.sin((0.3 * Math.PI) / 2);
    compressor.connect(reverbDry).connect(this.wet);
    compressor.connect(convolver).connect(reverbWet).connect(this.wet);
    this.wet.connect(this.output);
    this.ringOsc.type = "sine";
    this.ringOsc.connect(this.ringDepth).connect(this.ring.gain);
    this.ringOsc.start();
    this.warble.type = "sine";
    this.warble.connect(this.warbleDepth).connect(this.delay.delayTime);
    this.warble.start();
    this.apply(true);
  }
  get active() {
    return this.enabled;
  }
  get workletReady() {
    return this.processor !== null;
  }
  setActive(value: boolean) {
    if (this.disposed || value === this.enabled) return;
    this.enabled = value;
    this.apply(false);
  }
  configure(preset: CorruptionPreset, intensity = 0.7) {
    if (this.disposed) return;
    this.preset = preset;
    this.intensity = intensity;
    this.apply(false);
  }
  init(
    url = new URL("./corruption-processor.worklet.js", import.meta.url).href,
    factory = (context: BaseAudioContext) =>
      new AudioWorkletNode(context, "corruption-processor", {
        numberOfInputs: 1,
        numberOfOutputs: 1,
        outputChannelCount: [1],
      }),
  ) {
    if (this.disposed) return Promise.resolve(false);
    if (this.processor) return Promise.resolve(true);
    if (this.loading) return this.loading;
    this.loading = (async () => {
      try {
        await loadModule(this.context, url);
        if (this.disposed) return false;
        const processor = factory(this.context);
        this.wetHead.disconnect();
        this.wetHead.connect(processor);
        processor.connect(this.shaper);
        this.processor = processor;
        this.pushConfig();
        return true;
      } catch {
        return false;
      } finally {
        // Native stages continue without the optional processor.
        this.loading = null;
      }
    })();
    return this.loading;
  }
  private pushConfig() {
    this.processor?.port.postMessage({
      type: "config",
      config: {
        ...corruptionPreset(this.preset, this.intensity).worklet,
        bypass: !this.enabled,
      },
    });
  }
  private apply(immediate: boolean) {
    const config = corruptionPreset(this.preset, this.intensity),
      now = this.context.currentTime;
    const target = (parameter: AudioParam, value: number) => {
      if (immediate) parameter.value = value;
      else parameter.setTargetAtTime(value, now, 0.05);
    };
    this.shaper.curve = config.shaper
      ? corruptionCurve(config.shaper.drive, config.shaper.quantLevels)
      : null;
    target(this.ringOsc.frequency, config.ring.freqHz);
    target(this.ring.gain, 1 - config.ring.depth);
    target(this.ringDepth.gain, config.ring.depth);
    this.band.type = config.band ? "bandpass" : "allpass";
    target(
      this.band.frequency,
      config.band?.freqHz ?? this.context.sampleRate / 2,
    );
    target(this.band.Q, config.band?.q ?? 1);
    target(this.warble.frequency, config.warble.freqHz);
    target(this.warbleDepth.gain, config.warble.depthS);
    const wet = this.enabled ? config.wet : 0;
    for (const [node, value] of [
      [this.dry, Math.cos((wet * Math.PI) / 2)],
      [this.wet, 0.9 * Math.sin((wet * Math.PI) / 2)],
    ] as const) {
      if (immediate) node.gain.value = value;
      else {
        node.gain.cancelScheduledValues(now);
        node.gain.setValueAtTime(node.gain.value, now);
        node.gain.linearRampToValueAtTime(value, now + 0.12);
      }
    }
    this.pushConfig();
  }
  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.ringOsc.stop();
    this.warble.stop();
    this.processor?.port.close();
    this.processor?.disconnect();
    this.processor = null;
    for (const node of this.nodes) node.disconnect();
    this.nodes = [];
  }
}
