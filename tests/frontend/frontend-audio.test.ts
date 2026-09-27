import test from "node:test";
import assert from "node:assert/strict";
import {
  AudioMixer,
  desktopMusicTarget,
  trimCueSilence,
} from "../../frontend-src/runtime/audio-mixer";
import { SpeechPlayer } from "../../frontend-src/runtime/speech-player";
import {
  automaticGraphicsMode,
  classifyGpu,
} from "../../frontend-src/runtime/graphics-detection";
import {
  live2DRenderBudget,
  useGraphicsSettings,
  ResolutionHysteresis,
} from "../../frontend-src/state/graphics-store";
import { BrowserPodcastRuntime } from "../../frontend-src/apps/browser-page-runtime";

const tick = () => new Promise((resolve) => setImmediate(resolve));
class Parameter {
  value = 1;
  events: number[] = [];
  setValueAtTime(value: number) {
    this.value = value;
    this.events.push(value);
  }
  linearRampToValueAtTime(value: number) {
    this.value = value;
    this.events.push(value);
  }
  cancelScheduledValues() {}
}
class Node {
  output: Node | null = null;
  gain = new Parameter();
  playbackRate = new Parameter();
  positionX = new Parameter();
  positionY = new Parameter();
  positionZ = new Parameter();
  frequency = new Parameter(1000);
  Q = new Parameter(1);
  type = "";
  distanceModel = "inverse";
  refDistance = 50;
  maxDistance = 10000;
  rolloffFactor = 1;
  buffer: any;
  loop = false;
  started = false;
  offset = 0;
  stopped = false;
  onended: (() => void) | null = null;
  connect(output: Node) {
    this.output = output;
  }
  disconnect() {
    this.output = null;
  }
  start(_when = 0, offset = 0) {
    this.started = true;
    this.offset = offset;
  }
  stop() {
    this.stopped = true;
  }
  getFloatTimeDomainData(data: Float32Array) {
    data.fill(0);
  }
}
function buffer(channels = 1, length = 1000, sampleRate = 1000) {
  const data = Array.from({ length: channels }, () => new Float32Array(length));
  return {
    numberOfChannels: channels,
    length,
    sampleRate,
    duration: length / sampleRate,
    getChannelData: (channel: number) => data[channel],
    copyToChannel: (values: Float32Array, channel: number) =>
      data[channel].set(values),
  };
}
class Context {
  currentTime = 0;
  state = "running";
  sampleRate = 1000;
  destination = new Node();
  sources: Node[] = [];
  decoded = 0;
  async resume() {
    this.state = "running";
  }
  async suspend() {
    this.state = "suspended";
  }
  async close() {
    this.state = "closed";
  }
  createGain() {
    return new Node();
  }
  createPanner() {
    return new Node();
  }
  createBiquadFilter() {
    return new Node();
  }
  createConvolver() {
    return new Node();
  }
  createAnalyser() {
    return new Node();
  }
  createBuffer = buffer;
  async decodeAudioData() {
    this.decoded++;
    return buffer();
  }
  createBufferSource() {
    const node = new Node();
    this.sources.push(node);
    return node;
  }
}
test("window focus re-arms audio unlock and disposal removes the listener", () => {
  const documentTarget = new EventTarget();
  const windowTarget = new EventTarget();
  const documentDescriptor = Object.getOwnPropertyDescriptor(
    globalThis,
    "document",
  );
  const windowDescriptor = Object.getOwnPropertyDescriptor(globalThis, "window");
  Object.defineProperty(globalThis, "document", {
    configurable: true,
    value: documentTarget,
  });
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: windowTarget,
  });
  const context = new Context();
  let resumes = 0;
  context.resume = async () => {
    resumes++;
  };
  const mixer = new AudioMixer(() => context as any);
  try {
    mixer.installUnlock();
    windowTarget.dispatchEvent(new Event("focus"));
    assert.equal(resumes, 1);
    mixer.dispose();
    windowTarget.dispatchEvent(new Event("focus"));
    assert.equal(resumes, 1);
  } finally {
    mixer.dispose();
    if (documentDescriptor)
      Object.defineProperty(globalThis, "document", documentDescriptor);
    else delete (globalThis as any).document;
    if (windowDescriptor)
      Object.defineProperty(globalThis, "window", windowDescriptor);
    else delete (globalThis as any).window;
  }
});

const settings = {
  masterVolume: 80,
  musicVolume: 10,
  sfxVolume: 80,
  voiceVolume: 100,
  isMuted: false,
  musicMuted: false,
  sfxMuted: false,
  voiceMuted: false,
  spatialVoice: false,
};

test("audio debug snapshot exposes context transport and spatial state", async (t) => {
  t.mock.method(
    globalThis,
    "fetch",
    async () => new Response(new Uint8Array(8)),
  );
  const context = new Context() as any;
  context.listener = {
    positionX: new Parameter(),
    positionY: new Parameter(),
    positionZ: new Parameter(),
    forwardX: new Parameter(),
    forwardY: new Parameter(),
    forwardZ: new Parameter(),
    upX: new Parameter(),
    upY: new Parameter(),
    upZ: new Parameter(),
  };
  const mixer = new AudioMixer(() => context);
  t.after(() => mixer.dispose());
  assert.equal(mixer.debugSnapshot().contextState, "uninitialized");
  await mixer.debugResume();
  assert.equal(mixer.debugSnapshot().contextState, "running");
  mixer.sync({ ...settings, spatialVoice: true });
  mixer.setSpatialTransform(
    { x: 0, y: 1, z: 5 },
    { x: 0, y: 0, z: -1 },
    { x: 0, y: 1, z: 0 },
    { x: 1, y: 0.7, z: 0 },
  );
  const spatial = mixer.debugSnapshot();
  assert.equal(spatial.speechHasPanner, true);
  assert.deepEqual(spatial.listenerPos, { x: 0, y: 1, z: 5 });
  assert.deepEqual(spatial.speechPos, { x: 1, y: 0.7, z: 0 });
  assert.equal(spatial.distanceParams?.model, "inverse");
  assert.equal(await mixer.debugSuspend(), true);
  assert.equal(mixer.debugSnapshot().contextState, "suspended");
  assert.equal(await mixer.debugResume(), true);
});

test("audio debug music transport loads, pauses, seeks, resumes and stops the production BGM source", async (t) => {
  t.mock.method(
    globalThis,
    "fetch",
    async () => new Response(new Uint8Array(8)),
  );
  const context = new Context();
  t.mock.method(context, "decodeAudioData", async () => buffer(1, 10_000, 1000));
  const mixer = new AudioMixer(() => context as any);
  t.after(() => mixer.dispose());
  await mixer.debugLoadMusic();
  assert.deepEqual(
    [...mixer.debugSnapshot().loadedMusic].sort(),
    ["bgm1", "bgm_manifold", "bgm_void"],
  );
  mixer.debugPlayMusic("bgm1", 0);
  await tick();
  context.currentTime = 2;
  assert.equal(mixer.debugSnapshot().musicCurrentTime, 2);
  assert.equal(mixer.debugPauseMusic(), true);
  assert.equal(mixer.debugSnapshot().musicPaused, true);
  assert.equal(mixer.debugSeekMusic(6), true);
  assert.equal(mixer.debugSnapshot().musicCurrentTime, 6);
  assert.equal(mixer.debugResumeMusic(), true);
  context.currentTime = 3;
  assert.equal(mixer.debugSnapshot().musicCurrentTime, 7);
  assert.equal(mixer.debugStopMusic(0), true);
  assert.equal(mixer.debugSnapshot().musicTrackId, null);
});

test("per-track audio effects mirror shipped reverb and filter controls", async (t) => {
  const context = new Context();
  const mixer = new AudioMixer(() => context as any);
  t.after(() => mixer.dispose());
  await mixer.debugResume();
  assert.equal(
    await mixer.debugSetReverb("music", "room", 0.4),
    true,
  );
  assert.equal(
    mixer.debugSetFilter("music", "lowpass", 1200, 2),
    true,
  );
  let effects = mixer.debugSnapshot().effects.music;
  assert.equal(effects.reverb, "room");
  assert.ok(Math.abs(effects.wetness - 0.4) < 1e-8);
  assert.equal(effects.filter, "lowpass");
  assert.equal(effects.frequency, 500);
  assert.equal(effects.q, 2);
  mixer.debugSetWetness("music", 0.6);
  mixer.debugSetFilterFrequency("music", 250);
  mixer.debugSetFilterQ("music", 3.5);
  effects = mixer.debugSnapshot().effects.music;
  assert.ok(Math.abs(effects.wetness - 0.6) < 1e-8);
  assert.equal(effects.frequency, 250);
  assert.equal(effects.q, 3.5);
  await mixer.debugSetReverb("music", "none");
  mixer.debugSetFilter("music", "none");
  effects = mixer.debugSnapshot().effects.music;
  assert.equal(effects.reverb, "none");
  assert.equal(effects.filter, "none");
});

test("scene source offsets are independent of fade time and wrap only looping files", async (t) => {
  t.mock.method(
    globalThis,
    "fetch",
    async () => new Response(new Uint8Array(8)),
  );
  const context = new Context();
  t.mock.method(context, "decodeAudioData", async () => buffer(1, 60000, 1000));
  const mixer = new AudioMixer(() => context as any);
  t.after(() => mixer.dispose());
  await mixer.unlock();
  mixer.playSceneAudio("/audio/bgm_landing.m4a", {
    duration: 10,
    srcStart: 44,
    elapsed: () => 2,
    fadeIn: 4,
  });
  await tick();
  assert.equal(context.sources.at(-1)?.offset, 46);
  assert.equal(context.sources.at(-1)?.started, true);
  mixer.playSceneAudio("/audio/bgm_landing.m4a", {
    duration: 10,
    srcStart: 59,
    elapsed: () => 2,
    loop: true,
  });
  await tick();
  assert.equal(context.sources.at(-1)?.offset, 1);
  mixer.playSceneAudio("/audio/bgm_landing.m4a", {
    duration: 10,
    srcStart: 59,
    elapsed: () => 2,
  });
  await tick();
  assert.equal(context.sources.at(-1)?.started, false);
  assert.equal(context.sources.at(-1)?.stopped, true);
});
function pathGain(node: Node, destination: Node): number {
  let gain = 1;
  for (let step = 0; step < 20; step++) {
    if (node === destination) return gain;
    gain *= node.gain.value;
    if (!node.output) return 0;
    node = node.output;
  }
  throw Error("cycle");
}

test("shared speech and SFX buses apply master exactly once and dispose independently", async (t) => {
  t.mock.method(
    globalThis,
    "fetch",
    async () => new Response(new Uint8Array(8)),
  );
  const context = new Context(),
    mixer = new AudioMixer(() => context as any);
  t.after(() => mixer.dispose());
  mixer.sync(settings);
  let done = 0;
  const speech = new SpeechPlayer(
    {
      started() {},
      done() {
        done++;
      },
      error(message) {
        throw Error(message);
      },
    },
    () => mixer.speechRoute(),
  );
  await speech.unlock();
  speech.receive({
    operationId: "a",
    blockId: 0,
    chunkId: 0,
    messageId: "a",
    sequence: 0,
    sampleRate: 1000,
    samples: new Float32Array(100),
    complete: true,
  });
  const voice = context.sources[0];
  assert.equal(pathGain(voice, context.destination), 0.8);
  mixer.playCue("comms-norichat-focus");
  await tick();
  const effect = context.sources[1];
  assert.ok(Math.abs(pathGain(effect, context.destination) - 0.512) < 1e-8);
  mixer.sync({ ...settings, masterVolume: 50, voiceVolume: 20 });
  assert.equal(pathGain(voice, context.destination), 0.1);
  mixer.sync({ ...settings, voiceMuted: true });
  assert.equal(pathGain(voice, context.destination), 0);
  assert.ok(pathGain(effect, context.destination) > 0);
  mixer.sync({ ...settings, isMuted: true });
  assert.equal(pathGain(effect, context.destination), 0);
  voice.onended?.();
  assert.equal(done, 1, "muting must not suppress playback acknowledgements");
  speech.dispose();
  assert.equal(context.state, "running");
  mixer.dispose();
  assert.equal(context.state, "closed");
  assert.equal(effect.stopped, true);
});

test("audio loading deduplicates assets, bounds polyphony and fences late completions", async (t) => {
  let release!: (response: Response) => void;
  let requests = 0;
  t.mock.method(globalThis, "fetch", () => {
    requests++;
    return new Promise<Response>((resolve) => {
      release = resolve;
    });
  });
  const context = new Context(),
    mixer = new AudioMixer(() => context as any);
  await mixer.unlock();
  for (let i = 0; i < 40; i++) mixer.playCue("comms-norichat-focus");
  assert.equal(requests, 1);
  release(new Response(new Uint8Array(8)));
  await tick();
  assert.equal(context.sources.filter((node) => !node.stopped).length, 32);
  const previous = requests;
  mixer.playCue("comms-norichat-send");
  mixer.playCue("unknown-cue");
  assert.equal(
    requests,
    previous,
    "silent and unknown cues must never fetch or play",
  );
  mixer.playCue("comms-signal-auth-error");
  mixer.dispose();
  release(new Response(new Uint8Array(8)));
  await tick();
  assert.equal(context.sources.length, 40);
  assert.ok(context.sources.every((node) => node.stopped));
});

test("loop cues cancel before decode, follow SFX mute and release their nodes on stop", async (t) => {
  let release!: (response: Response) => void;
  t.mock.method(
    globalThis,
    "fetch",
    () =>
      new Promise<Response>((resolve) => {
        release = resolve;
      }),
  );
  const context = new Context(),
    mixer = new AudioMixer(() => context as any);
  t.after(() => mixer.dispose());
  await mixer.unlock();
  mixer.sync(settings);
  const cancel = mixer.startCueLoop("partygames-pictionary-pen-scratch");
  cancel();
  release(new Response(new Uint8Array(8)));
  await tick();
  assert.equal(
    context.sources.length,
    0,
    "a cancelled pen must not start after loading",
  );
  const stop = mixer.startCueLoop("partygames-pictionary-pen-scratch");
  await tick();
  const pen = context.sources[0];
  assert.ok(pen.started && pen.loop);
  assert.ok(Math.abs(pathGain(pen, context.destination) - 0.32) < 1e-8);
  mixer.sync({ ...settings, sfxMuted: true });
  assert.equal(pathGain(pen, context.destination), 0);
  stop();
  stop();
  assert.equal(pen.stopped, true);
  assert.equal(pen.output, null);
});

test("a cancelled desktop music load cannot replace the latest fact-selected track", async (t) => {
  const pending: Array<(response: Response) => void> = [];
  t.mock.method(
    globalThis,
    "fetch",
    () => new Promise<Response>((resolve) => pending.push(resolve)),
  );
  const context = new Context(),
    mixer = new AudioMixer(() => context as any);
  t.after(() => mixer.dispose());
  await mixer.unlock();
  mixer.setDesktopMusic("bgm1");
  mixer.setDesktopMusic("bgm_void");
  pending[1](new Response(new Uint8Array(8)));
  await tick();
  pending[0](new Response(new Uint8Array(8)));
  await tick();
  assert.equal(context.sources.length, 1);
  assert.equal(context.sources[0].loop, true);
  mixer.setDesktopMusic(null);
  assert.equal(context.sources[0].stopped, true);
});

test("cue silence trimming considers all channels and retains the earliest audible sample", () => {
  const input = buffer(2);
  input.getChannelData(0)[100] = 0.01;
  input.getChannelData(1)[25] = 0.5;
  const output = trimCueSilence(new Context() as any, input as any);
  assert.equal(output.length, 975);
  assert.equal(output.getChannelData(1)[0], 0.5);
});

test("desktop music facts preserve suppression and ending precedence", () => {
  const choose = (...facts: string[]) => desktopMusicTarget(new Set(facts));
  assert.deepEqual(choose(), { track: "bgm1", fade: 2.5 });
  assert.equal(choose("act3.void_open").track, "bgm_void");
  assert.equal(
    choose("act3.void_open", "arg.manifold_unlocked").track,
    "bgm_manifold",
  );
  assert.equal(
    choose("arg.manifold_unlocked", "arg.ending.started").track,
    "bgm1",
  );
  assert.equal(choose("qfr.installing").track, null);
  assert.equal(choose("qfr.installing", "qfr.installed").track, "bgm1");
  assert.deepEqual(
    choose("corrupt.doc1.read", "corrupt.doc2.read", "corrupt.doc3.read"),
    { track: null, fade: 5 },
  );
  assert.equal(
    choose(
      "corrupt.doc1.read",
      "corrupt.doc2.read",
      "corrupt.doc3.read",
      "virus.cleared",
    ).track,
    "bgm1",
  );
});

test("GPU classification and half-scale resolution retain shipped fallbacks and manual choice", () => {
  for (const [renderer, mode] of [
    ["", "quality"],
    ["AMD Radeon RX 580", "quality"],
    ["Intel Arc A770", "quality"],
    ["Intel UHD Graphics 620", "ultra-performance"],
    ["SwiftShader", "ultra-performance"],
    ["Mali G76", "performance"],
  ])
    assert.equal(automaticGraphicsMode(classifyGpu(renderer)), mode);
  assert.deepEqual(live2DRenderBudget("ultra-performance", 900, 2, true), {
    fps: 30,
    resolution: 1024,
  });
  assert.deepEqual(live2DRenderBudget("ultra-performance", 400, 1, true), {
    fps: 30,
    resolution: 512,
  });
  const before = useGraphicsSettings.getState();
  try {
    useGraphicsSettings.setState({ source: "user", mode: "quality" });
    useGraphicsSettings.getState().setModeAuto("ultra-performance");
    assert.equal(useGraphicsSettings.getState().mode, "quality");
  } finally {
    useGraphicsSettings.setState(before);
  }
});

test("texture downsizing waits for stability and a renewed large viewport cancels it", () => {
  const budget = new ResolutionHysteresis();
  assert.equal(budget.update(2048, 0).resolution, 2048);
  assert.deepEqual(budget.update(1024, 100), { resolution: 2048, delay: 4000 });
  assert.equal(budget.update(1024, 4000).resolution, 2048);
  assert.equal(budget.update(3072, 4050).resolution, 3072);
  assert.deepEqual(budget.update(1024, 5000), {
    resolution: 3072,
    delay: 4000,
  });
  assert.equal(budget.update(1024, 9000).resolution, 1024);
  budget.reset();
  assert.equal(
    budget.update(512, 9100).resolution,
    512,
    "an explicit mode change takes effect immediately",
  );
});

test("podcast pause and owner release cancel playback while mixer connection is pending", async (t) => {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, "Audio");
  class Media extends EventTarget {
    dataset: Record<string, string> = {};
    src = "";
    currentTime = 0;
    duration = 10;
    playbackRate = 1;
    paused = true;
    buffered = { length: 0 };
    plays = 0;
    async play() {
      this.plays++;
      this.paused = false;
    }
    pause() {
      this.paused = true;
    }
    removeAttribute() {}
    load() {}
  }
  Object.defineProperty(globalThis, "Audio", {
    configurable: true,
    value: Media,
  });
  t.after(() =>
    descriptor
      ? Object.defineProperty(globalThis, "Audio", descriptor)
      : delete (globalThis as any).Audio,
  );
  let finish!: (disconnect: () => void) => void,
    media!: Media,
    disconnected = false;
  const podcast = new BrowserPodcastRuntime((element) => {
    if (media)
      return Promise.resolve(() => {
        disconnected = true;
      });
    media = element as unknown as Media;
    return new Promise((resolve) => {
      finish = resolve;
    });
  });
  const playing = podcast.invoke(
    "podcast.play",
    { src: "/webAssets/test.mp3" },
    "page",
  );
  await podcast.invoke("podcast.pause", { src: "/webAssets/test.mp3" }, "page");
  finish(() => {
    disconnected = true;
  });
  assert.deepEqual(await playing, { ok: false, reason: "cancelled" });
  assert.equal(media.plays, 0);
  assert.deepEqual(
    await podcast.invoke(
      "podcast.play",
      { src: "/webAssets/test.mp3" },
      "page",
    ),
    { ok: true },
  );
  podcast.releaseOwner("page");
  assert.equal(media.paused, true);
  podcast.dispose();
  assert.equal(disconnected, true);
  assert.deepEqual(
    await podcast.invoke(
      "podcast.play",
      { src: "/webAssets/test.mp3" },
      "page",
    ),
    { ok: false, reason: "disposed" },
  );
});
