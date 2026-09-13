import type { AudioRoute } from "../runtime/audio-mixer";

/** One mounted model owns its noise source. No autoplay or module-global audio nodes. */
export class HeadPatAudio {
  private source: AudioBufferSourceNode | null = null;
  private nodes: AudioNode[] = [];
  private gain: GainNode | null = null;
  private lowpass: BiquadFilterNode | null = null;
  private context: AudioContext | null = null;
  private disposed = false;
  constructor(private route: () => AudioRoute | null) {}

  private initialize() {
    if (this.disposed || this.source) return;
    const route = this.route();
    if (!route) return;
    const context = route.context;
    this.context = context;
    try {
      const source = context.createBufferSource();
      this.source = source;
      this.nodes.push(source);
      const buffer = context.createBuffer(
        1,
        context.sampleRate * 2,
        context.sampleRate,
      );
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      source.buffer = buffer;
      source.loop = true;
      const filter = (type: BiquadFilterType, frequency: number, q = -3) => {
        const node = context.createBiquadFilter();
        this.nodes.push(node);
        node.type = type;
        node.frequency.value = frequency * 0.4;
        node.Q.value = q;
        return node;
      };
      const gain = (value: number) => {
        const node = context.createGain();
        this.nodes.push(node);
        node.gain.value = value;
        return node;
      };
      const high1 = filter("highpass", 1200),
        high2 = filter("highpass", 3200);
      const peak = filter("peaking", 5200, 0.9);
      peak.gain.value = 4;
      this.lowpass = filter("lowpass", 8000);
      this.gain = gain(0);
      source
        .connect(high1)
        .connect(high2)
        .connect(peak)
        .connect(this.lowpass)
        .connect(this.gain);
      source
        .connect(filter("lowpass", 350))
        .connect(filter("lowpass", 350))
        .connect(gain(0.5))
        .connect(this.gain);
      this.gain.connect(gain(0.05)).connect(route.input);
      source.start();
    } catch (error) {
      this.release();
      throw error;
    }
  }
  update(velocity: number, pressing: boolean) {
    if (this.disposed) return;
    if (pressing) this.initialize();
    if (!this.context || !this.gain || !this.lowpass) return;
    const strength =
      pressing && Number.isFinite(velocity)
        ? Math.min(1, Math.abs(velocity) / 3)
        : 0;
    const now = this.context.currentTime;
    this.gain.gain.setTargetAtTime(
      strength ** 1.4,
      now,
      pressing ? 0.03 : 0.06,
    );
    this.lowpass.frequency.setTargetAtTime(
      (8000 + 3500 * strength) * 0.4,
      now,
      0.05,
    );
  }
  stop() {
    this.update(0, false);
  }
  private release() {
    try {
      this.source?.stop();
    } catch {
      /* A partially initialized source may not have started. */
    }
    this.nodes.forEach((node) => node.disconnect());
    this.nodes = [];
    this.source = null;
    this.gain = null;
    this.lowpass = null;
    this.context = null;
  }
  dispose() {
    if (!this.disposed) {
      this.disposed = true;
      this.release();
    }
  }
}
