import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import {
  VoiceCorruption,
  roomImpulse,
} from "../../frontend-src/runtime/voice-corruption";
import {
  CORRUPTION_PRESETS,
  corruptionPreset,
  corruptionCurve,
} from "../../frontend-src/runtime/voice-corruption-presets";

function processor(path: string) {
  let Type: any;
  runInNewContext(readFileSync(path, "utf8"), {
    sampleRate: 32000,
    registerProcessor(_name: string, type: any) {
      Type = type;
    },
  });
  const instance = new Type();
  let seed = 123;
  instance.rand = () =>
    (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 2 ** 32;
  return instance;
}
/** SHA-256 of 800 rendered blocks per mode, captured while the source matched the shipped worklet sample for sample. */
const SHIPPED_OUTPUT: Record<string, string> = {
  unstable: "68658a3bae505efcc95bbae145a933cd5faa16429de81a46ced3dafba47582a7",
  glitch: "fafb8621c7d3923980a0acebaecd850b0a0ffa1b3e620e17704dcef3b01e68fa",
  robot: "1b2f5eb77ea766200111497c30840710edfa0284f66c3b125ff46f5c7d765d35",
  ghost: "bf06fd462c752f9450a64bec45c692b568508f289888e2c6edd159064196ede6",
  demon: "7238af83a65bef685c3c36afa52a1c1107a7aea8854e1e05a50af8f85c016b77",
  haywire: "3f8e757e03cc512d4fa4c71e03c5f7007d4ca7eb845a99e2fdeb955db95df4dd",
};
test("all six source corruption modes match the shipped processor sample for sample", () => {
  for (const preset of CORRUPTION_PRESETS) {
    const source = processor("frontend-src/runtime/corruption-processor.worklet.js");
    source.applyConfig({ ...corruptionPreset(preset, 0.7).worklet, bypass: false });
    const output = new Float32Array(800 * 128);
    for (let block = 0; block < 800; block++) {
      const input = Float32Array.from(
        { length: 128 },
        (_, i) => 0.3 * Math.sin((block * 128 + i) * 0.043),
      );
      const actual = new Float32Array(128);
      source.process([[input]], [[actual]]);
      output.set(actual, block * 128);
    }
    const digest = createHash("sha256").update(new Uint8Array(output.buffer)).digest("hex");
    assert.equal(digest, SHIPPED_OUTPUT[preset], preset);
  }
});
test("bypassing corruption clears captured audio before reactivation and passes dry audio exactly", () => {
  const source = processor(
    "frontend-src/runtime/corruption-processor.worklet.js",
  );
  source.applyConfig({
    ...corruptionPreset("unstable", 0.7).worklet,
    bypass: false,
  });
  for (let i = 0; i < 12; i++)
    source.process(
      [[new Float32Array(128).fill(0.4)]],
      [[new Float32Array(128)]],
    );
  source.applyConfig({ bypass: true });
  assert.ok(source.hist.every((value: number) => value === 0));
  const dry = new Float32Array(128).fill(0.2),
    output = new Float32Array(128);
  source.process([[dry]], [[output]]);
  assert.deepEqual(output, dry);
  source.applyConfig({
    bypass: false,
    spectral: "off",
    decimHold: 1,
    stutterRate: 0,
    dropoutRate: 0,
    burstRate: 0,
  });
  source.process([], [[output]]);
  assert.ok(output.every((value) => value === 0));
});
class Param {
  value = 1;
  setValueAtTime(value: number) {
    this.value = value;
  }
  linearRampToValueAtTime(value: number) {
    this.value = value;
  }
  setTargetAtTime(value: number) {
    this.value = value;
  }
  cancelScheduledValues() {}
}
class Node {
  gain = new Param();
  frequency = new Param();
  Q = new Param();
  delayTime = new Param();
  threshold = new Param();
  knee = new Param();
  ratio = new Param();
  attack = new Param();
  release = new Param();
  connections = new Set<any>();
  stopped = false;
  started = false;
  curve: any;
  buffer: any;
  connect(node: any) {
    this.connections.add(node);
    return node;
  }
  disconnect() {
    this.connections.clear();
  }
  start() {
    this.started = true;
  }
  stop() {
    this.stopped = true;
  }
}
class Context {
  sampleRate = 32000;
  currentTime = 0;
  nodes: Node[] = [];
  loads = 0;
  audioWorklet = {
    addModule: async (_url: string) => {
      this.loads++;
    },
  };
  node = () => {
    const node = new Node();
    this.nodes.push(node);
    return node;
  };
  createGain = this.node;
  createWaveShaper = this.node;
  createOscillator = this.node;
  createBiquadFilter = this.node;
  createDelay = this.node;
  createDynamicsCompressor = this.node;
  createConvolver = this.node;
  createBuffer(channels: number, length: number, sampleRate: number) {
    const data = Array.from(
      { length: channels },
      () => new Float32Array(length),
    );
    return {
      length,
      sampleRate,
      numberOfChannels: channels,
      getChannelData: (index: number) => data[index],
    };
  }
}
test("corruption worklet initialization is shared, uses current scene state and fences disposal", async () => {
  const context = new Context();
  let resolve!: () => void,
    made = 0;
  context.audioWorklet.addModule = () => {
    context.loads++;
    return new Promise<void>((done) => {
      resolve = done;
    });
  };
  const first = new VoiceCorruption(context as any),
    second = new VoiceCorruption(context as any);
  const configs: any[] = [],
    port = { postMessage: (value: any) => configs.push(value), close() {} };
  const factory = () => {
    made++;
    return Object.assign(new Node(), { port }) as any;
  };
  first.setActive(true);
  second.setActive(true);
  const a = first.init("fixture", factory),
    b = second.init("fixture", factory);
  assert.equal(context.loads, 1);
  assert.equal(first.init("fixture", factory), a);
  first.dispose();
  second.setActive(false);
  resolve();
  assert.equal(await a, false);
  assert.equal(await b, true);
  assert.equal(made, 1);
  assert.equal(configs.at(-1).config.bypass, true);
  second.dispose();
  assert.ok(context.nodes.every((node) => node.connections.size === 0));
  assert.ok(
    context.nodes.filter((node) => node.started).every((node) => node.stopped),
  );
});
test("worklet failure keeps native processing usable and room impulse preserves original timing", async () => {
  const context = new Context();
  context.audioWorklet.addModule = () => {
    throw Error("unavailable");
  };
  const fx = new VoiceCorruption(context as any);
  fx.setActive(true);
  assert.equal(await fx.init("missing"), false);
  assert.equal(fx.active, true);
  assert.equal(fx.workletReady, false);
  context.audioWorklet.addModule = async () => {};
  assert.equal(
    await fx.init(
      "missing",
      () =>
        Object.assign(new Node(), {
          port: { postMessage() {}, close() {} },
        }) as any,
    ),
    true,
    "a synchronous module failure must allow a later retry",
  );
  fx.setActive(false);
  fx.dispose();
  const impulse = roomImpulse(context as any, () => 0.75);
  assert.equal(impulse.length, 25600);
  const left = impulse.getChannelData(0);
  assert.ok(left.subarray(0, 320).every((value) => value === 0));
  assert.ok(Math.max(...left) <= 1);
  assert.ok(left.some((value) => value !== 0));
  const curve = corruptionCurve(2, 24);
  assert.equal(curve.length, 4097);
  assert.equal(curve[2048], 0);
  assert.equal(curve[0], -curve[4096]);
});
