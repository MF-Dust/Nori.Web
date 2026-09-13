import type { ChatAudioFrame } from "./chat-media";
import type { AudioRoute } from "./audio-mixer";

interface SpeechBlock {
  operationId: string;
  blockId: number;
  chunks: Map<number, { samples: Float32Array; rate: number }>;
  next: number;
  last: number | null;
  active: number;
  started: boolean;
}
export interface SpeechCallbacks {
  started(operationId: string, blockId: number): void;
  done(operationId: string, blockId: number): void;
  error(message: string): void;
}
export type SpeechEvent =
  | { type: "started" | "done"; operationId: string; blockId: number }
  | { type: "cut"; operationId: string; blockId: number }
  | { type: "reset" };
/** PCM streaming with block/chunk deduplication and a gesture-owned AudioContext. */
export class SpeechPlayer {
  private context: AudioContext | null = null;
  private gain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private nodes = new Map<
    AudioBufferSourceNode,
    { block: SpeechBlock; samples: number; end: number }
  >();
  private cuts = new Map<string, number>();
  private listeners = new Set<(event: SpeechEvent) => void>();
  private blocks = new Map<string, SpeechBlock>();
  private completed = new Set<string>();
  private cursor = 0;
  private epoch = 0;
  private disposed = false;
  private bufferedSamples = 0;
  private volume = 1;
  private rate = 1;
  private unlocked = false;
  constructor(
    private callbacks: SpeechCallbacks,
    private route?: () => Promise<AudioRoute>,
  ) {}
  subscribe = (listener: (event: SpeechEvent) => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  private emit(event: SpeechEvent) {
    for (const listener of this.listeners) listener(event);
  }
  async unlock() {
    if (this.disposed) throw new Error("Speech player is disposed");
    const epoch = this.epoch;
    const route = await this.route?.();
    if (this.disposed || epoch !== this.epoch) return;
    this.context ??= route?.context ?? new AudioContext();
    if (!this.gain) {
      this.gain = this.context.createGain();
      this.gain.gain.value = this.volume;
      this.analyser = this.context.createAnalyser();
      this.analyser.fftSize = 256;
      this.gain.connect(this.analyser);
      this.analyser.connect(route?.input ?? this.context.destination);
    }
    await this.context.resume();
    if (this.disposed || epoch !== this.epoch) return;
    this.unlocked = true;
    this.drain();
  }
  setVolume(value: number, rate = 1) {
    this.volume = Math.max(0, Math.min(1, value));
    this.rate = Math.max(0.5, Math.min(2, rate));
    if (this.gain) this.gain.gain.value = this.volume;
  }
  level(): number {
    if (!this.analyser || !this.nodes.size) return 0;
    const samples = new Float32Array(this.analyser.fftSize);
    this.analyser.getFloatTimeDomainData(samples);
    return Math.min(
      1,
      Math.sqrt(samples.reduce((sum, n) => sum + n * n, 0) / samples.length) *
        5,
    );
  }
  receive(frame: ChatAudioFrame) {
    if (this.disposed) return;
    const cut = this.cuts.get(frame.operationId);
    if (cut !== undefined && frame.blockId > cut) return;
    const key = frame.operationId + ":" + frame.blockId;
    if (this.completed.has(key)) return;
    let block = this.blocks.get(key);
    if (!block) {
      if (this.blocks.size >= 32) {
        this.callbacks.error("Speech buffer is full");
        return;
      }
      block = {
        operationId: frame.operationId,
        blockId: frame.blockId,
        chunks: new Map(),
        next: 0,
        last: null,
        active: 0,
        started: false,
      };
      this.blocks.set(key, block);
    }
    if (frame.chunkId < block.next || block.chunks.has(frame.chunkId)) return;
    if (frame.chunkId > block.next + 1024 || frame.samples.length > 32000 * 120)
      return;
    if (this.bufferedSamples + frame.samples.length > 32000 * 120) {
      this.callbacks.error("Speech buffer is full");
      return;
    }
    this.bufferedSamples += frame.samples.length;
    block.chunks.set(frame.chunkId, {
      samples: frame.samples,
      rate: frame.sampleRate,
    });
    if (frame.complete) block.last = frame.chunkId;
    this.drain();
  }
  async receiveEncoded(operationId: string, blockId: number, base64: string) {
    if (this.disposed) return;
    const epoch = this.epoch;
    try {
      if (base64.length > 32 * 1024 * 1024)
        throw new Error("Speech payload is too large");
      if (!this.context) {
        if (this.route) await this.unlock();
        else this.context = new AudioContext();
      }
      if (!this.context || this.disposed || epoch !== this.epoch) return;
      const bytes = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
      const audio = await this.context.decodeAudioData(bytes.buffer);
      if (epoch !== this.epoch) return;
      const samples = new Float32Array(audio.length);
      for (let channel = 0; channel < audio.numberOfChannels; channel++) {
        const data = audio.getChannelData(channel);
        for (let i = 0; i < samples.length; i++)
          samples[i] += data[i] / audio.numberOfChannels;
      }
      this.receive({
        operationId,
        blockId,
        samples,
        sampleRate: audio.sampleRate,
        chunkId: 0,
        complete: true,
        messageId: operationId,
        sequence: 0,
      });
    } catch (error) {
      if (epoch === this.epoch) this.callbacks.error(String(error));
    }
  }
  private drain() {
    const context = this.context;
    if (!context || !this.gain || !this.unlocked || context.state !== "running")
      return;
    for (const [key, block] of this.blocks) {
      let chunk;
      while ((chunk = block.chunks.get(block.next))) {
        if (!block.started) {
          block.started = true;
          this.emit({
            type: "started",
            operationId: block.operationId,
            blockId: block.blockId,
          });
          this.callbacks.started(block.operationId, block.blockId);
        }
        if (!this.blocks.has(key)) break;
        block.chunks.delete(block.next++);
        if (!chunk.samples.length) continue;
        const audio = context.createBuffer(1, chunk.samples.length, chunk.rate);
        audio.copyToChannel(new Float32Array(chunk.samples), 0);
        const node = context.createBufferSource();
        node.buffer = audio;
        node.playbackRate.value = this.rate;
        node.connect(this.gain);
        const epoch = this.epoch;
        const sampleCount = chunk.samples.length;
        this.cursor = Math.max(this.cursor, context.currentTime + 0.025);
        node.start(this.cursor);
        this.cursor += audio.duration / this.rate;
        block.active++;
        this.nodes.set(node, { block, samples: sampleCount, end: this.cursor });
        node.onended = () => {
          this.nodes.delete(node);
          node.disconnect();
          block.active--;
          if (epoch === this.epoch) {
            this.bufferedSamples -= sampleCount;
            this.finishBlock(key, block);
            this.drain();
          }
        };
      }
      this.finishBlock(key, block);
      // Do not interleave another block while this one is waiting for a chunk or playing.
      if (this.blocks.has(key)) break;
    }
  }
  private finishBlock(key: string, block: SpeechBlock) {
    if (
      block.last === null ||
      block.next <= block.last ||
      block.active ||
      !this.blocks.has(key)
    )
      return;
    this.blocks.delete(key);
    this.completed.add(key);
    if (this.completed.size > 512)
      this.completed.delete(this.completed.values().next().value!);
    this.callbacks.done(block.operationId, block.blockId);
    this.emit({
      type: "done",
      operationId: block.operationId,
      blockId: block.blockId,
    });
  }
  /** Keep the cut block itself, discard everything later, including delayed media/decode work. */
  cut(operationId: string, blockId: number) {
    if (this.disposed || !Number.isInteger(blockId)) return;
    const previous = this.cuts.get(operationId);
    if (previous !== undefined && previous <= blockId) return;
    this.cuts.set(operationId, blockId);
    if (this.cuts.size > 512) this.cuts.delete(this.cuts.keys().next().value!);
    for (const [node, playing] of this.nodes) {
      if (
        playing.block.operationId !== operationId ||
        playing.block.blockId <= blockId
      )
        continue;
      node.onended = null;
      try {
        node.stop();
      } catch {}
      node.disconnect();
      this.nodes.delete(node);
      playing.block.active--;
      this.bufferedSamples -= playing.samples;
    }
    for (const [key, block] of this.blocks) {
      if (block.operationId !== operationId || block.blockId <= blockId)
        continue;
      for (const chunk of block.chunks.values())
        this.bufferedSamples -= chunk.samples.length;
      this.blocks.delete(key);
    }
    this.bufferedSamples = Math.max(0, this.bufferedSamples);
    this.cursor = Math.max(
      this.context?.currentTime ?? 0,
      ...[...this.nodes.values()].map((node) => node.end),
    );
    this.emit({ type: "cut", operationId, blockId });
    this.drain();
  }
  reset() {
    this.epoch++;
    for (const node of this.nodes.keys()) {
      node.onended = null;
      try {
        node.stop();
      } catch {}
      node.disconnect();
    }
    this.nodes.clear();
    this.blocks.clear();
    this.completed.clear();
    this.cuts.clear();
    this.cursor = 0;
    this.bufferedSamples = 0;
    this.emit({ type: "reset" });
  }
  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.reset();
    this.listeners.clear();
    this.gain?.disconnect();
    this.analyser?.disconnect();
    if (!this.route) void this.context?.close();
    this.context = null;
    this.gain = null;
    this.analyser = null;
  }
}
