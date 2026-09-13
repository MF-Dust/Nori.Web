import test from "node:test";
import "./frontend-audio.test";
import "./frontend-chip.test";
import "./frontend-signal-story.test";
import { ConversationTimeline } from "../frontend-src/apps/conversation-presentation";
import assert from "node:assert/strict";
import { ArcadeClient } from "../frontend-src/runtime/arcade-client";
import { ArcadeMediaClient } from "../frontend-src/runtime/media-client";
import {
  decodeChatAudioFrame,
  sanitizeChatText,
  type ChatAudioFrame,
} from "../frontend-src/runtime/chat-media";
import { SpeechPlayer } from "../frontend-src/runtime/speech-player";
import { WorldStore } from "../frontend-src/runtime/world-store";
import { ChatRuntimeController } from "../frontend-src/apps/chat-runtime";
import { ManifoldService } from "../frontend-src/services/manifold";
import { createTerminalLocalFileSystem } from "../frontend-src/apps/terminal-filesystem";
import { NoriFrontendRuntime } from "../frontend-src/runtime/frontend-runtime";
import {
  requestSystemReply,
  SystemService,
} from "../frontend-src/services/system";

class Socket extends EventTarget {
  static OPEN = 1;
  static sockets: Socket[] = [];
  readyState = 0;
  sent: any[] = [];
  binaryType = "";
  constructor(
    public url: string,
    public protocols: string[],
  ) {
    super();
    Socket.sockets.push(this);
  }
  open() {
    this.readyState = 1;
    this.dispatchEvent(new Event("open"));
  }
  send(text: string) {
    if (this.readyState !== 1) throw new Error("closed");
    this.sent.push(JSON.parse(text));
  }
  message(data: any) {
    this.dispatchEvent(new MessageEvent("message", { data }));
  }
  close() {
    this.readyState = 3;
    this.dispatchEvent(new Event("close"));
  }
}
const tick = () => new Promise((resolve) => setImmediate(resolve));
function environment(t: any) {
  Socket.sockets = [];
  t.mock.method(
    globalThis,
    "fetch",
    async (url: any) =>
      new Response(
        JSON.stringify(
          String(url).includes("get-session")
            ? { user: { id: "fixture" }, session: { id: "fixture" } }
            : { ticket: "fixture" },
        ),
      ),
  );
  const windowDescriptor = Object.getOwnPropertyDescriptor(
    globalThis,
    "window",
  );
  const socketDescriptor = Object.getOwnPropertyDescriptor(
    globalThis,
    "WebSocket",
  );
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: { location: { href: "http://localhost/" } },
  });
  Object.defineProperty(globalThis, "WebSocket", {
    configurable: true,
    value: Socket,
  });
  t.after(() => {
    if (windowDescriptor)
      Object.defineProperty(globalThis, "window", windowDescriptor);
    else delete (globalThis as any).window;
    if (socketDescriptor)
      Object.defineProperty(globalThis, "WebSocket", socketDescriptor);
    else delete (globalThis as any).WebSocket;
  });
}

test("media frames decode LE PCM and network-order UUIDs, rejecting truncated/other channels", () => {
  const bytes = new ArrayBuffer(54),
    view = new DataView(bytes);
  view.setUint8(0, 1);
  view.setUint8(1, 1);
  view.setUint16(2, 1, true);
  view.setUint32(4, 9, true);
  view.setUint32(8, 2, true);
  view.setUint32(12, 3, true);
  for (let i = 0; i < 16; i++) view.setUint8(16 + i, i);
  view.setInt16(48, -32768, true);
  view.setInt16(50, 0, true);
  view.setInt16(52, 32767, true);
  const frame = decodeChatAudioFrame(bytes)!;
  assert.equal(frame.operationId, "00010203-0405-0607-0809-0a0b0c0d0e0f");
  assert.deepEqual(
    [frame.sequence, frame.blockId, frame.chunkId, frame.complete],
    [9, 2, 3, true],
  );
  assert.deepEqual([...frame.samples], [-1, 0, 32767 / 32768]);
  assert.equal(decodeChatAudioFrame(bytes.slice(0, 47)), null);
  assert.equal(decodeChatAudioFrame(bytes.slice(0, 53)), null);
  view.setUint8(1, 2);
  assert.equal(decodeChatAudioFrame(bytes), null);
  assert.equal(sanitizeChatText(" hello\n\x00world "), "hello world");
  assert.equal(Array.from(sanitizeChatText("🌱".repeat(105))).length, 100);
});

for (const kind of ["main", "media"] as const)
  test(`${kind}: close fences a late HTTP ticket`, async (t) => {
    environment(t);
    let release!: (response: Response) => void;
    t.mock.method(
      globalThis,
      "fetch",
      () =>
        new Promise<Response>((resolve) => {
          release = resolve;
        }),
    );
    const client =
      kind === "main"
        ? new ArcadeClient({ reconnect: false })
        : new ArcadeMediaClient();
    const pending =
      kind === "main"
        ? (client as ArcadeClient).connect()
        : (client as ArcadeMediaClient).connect("grant");
    client.close();
    release(new Response('{"ticket":"late"}'));
    await pending;
    assert.equal(Socket.sockets.length, 0);
    assert.equal(client.connectionState, "closed");
  });

test("media captures the very first frame and rejects a socket that closes before open", async (t) => {
  environment(t);
  const client = new ArcadeMediaClient();
  t.after(() => client.close());
  const frames: ArrayBuffer[] = [];
  client.onFrame((frame) => frames.push(frame));
  const opening = client.connect("grant");
  await tick();
  const socket = Socket.sockets.at(-1)!;
  socket.open();
  const data = new ArrayBuffer(48);
  socket.message(data);
  await opening;
  assert.equal(frames[0], data);
  assert.deepEqual(socket.sent[0], { type: "open_media", grant: "grant" });
  const failure = client.connect("new-grant");
  const rejected = assert.rejects(failure, /closed before/);
  await tick();
  Socket.sockets.at(-1)!.close();
  await rejected;
});

test("frontend rejoins its world once per socket and disposal fences startup", async (t) => {
  environment(t);
  const frontend = new NoriFrontendRuntime({
    reconnectMinMs: 1,
    reconnectMaxMs: 1,
  });
  t.after(() => frontend.dispose());
  const opening = frontend.start("zh-CN");
  await tick();
  await tick();
  const first = Socket.sockets.at(-1)!;
  first.open();
  await opening;
  assert.equal(
    first.sent.filter((item) => item.type === "open_my_web_world").length,
    1,
  );
  first.close();
  await new Promise((resolve) => setTimeout(resolve, 15));
  const second = Socket.sockets.at(-1)!;
  assert.notEqual(second, first);
  second.open();
  assert.equal(
    second.sent.filter((item) => item.type === "open_my_web_world").length,
    1,
  );
  frontend.dispose();
  await tick();
  assert.equal(frontend.arcade.connectionState, "closed");
});

test("chat serializes commands on the updated head and disconnect cancels pending sends", async () => {
  const world = new WorldStore(),
    sent: any[] = [],
    listeners: any[] = [];
  const arcade = {
    connectionState: "open",
    onState(fn: any) {
      listeners.push(fn);
      fn("open");
      return () => {};
    },
    send(message: any) {
      sent.push(message);
    },
    dispatch(cartridge: string, version: number, command: any) {
      const id = "request-" + sent.length;
      sent.push({ cartridge, version, command, id });
      return id;
    },
  };
  const chat = new ChatRuntimeController(world, arcade as any);
  world.consume({
    type: "world_joined",
    world: {
      worldId: "world",
      mountedCartridges: [
        {
          cartridgeId: "chat",
          runtimes: [
            {
              visibilityFenceId: "ui",
              headVersion: 1,
              visibleVersion: 1,
              state: { lines: [], presentationMode: "text" },
            },
          ],
        },
      ],
    },
  } as any);
  const started = chat.audioStarted("operation", 0),
    done = chat.audioDone("operation", 0);
  assert.equal(sent.length, 1);
  world.consume({
    type: "runtime_transition",
    cartridgeId: "chat",
    version: 2,
    transition: { patches: [] },
  } as any);
  world.consume({
    type: "dispatch_ack",
    requestId: sent[0].id,
    success: true,
  } as any);
  assert.equal(await started, true);
  assert.equal(sent.at(-1).version, 2);
  arcade.connectionState = "closed";
  listeners.forEach((fn) => fn("closed"));
  assert.equal(await done, false);
  assert.equal(chat.snapshot().connected, false);
  chat.dispose();
});

class AudioNode {
  onended: (() => void) | null = null;
  playbackRate = { value: 1 };
  buffer: any;
  stopped = false;
  connect() {}
  disconnect() {}
  start() {}
  stop() {
    this.stopped = true;
  }
  finish() {
    this.onended?.();
  }
}
class AudioFixture {
  static instances: AudioFixture[] = [];
  state = "running";
  currentTime = 0;
  destination = {};
  nodes: AudioNode[] = [];
  constructor() {
    AudioFixture.instances.push(this);
  }
  async resume() {}
  async close() {
    this.state = "closed";
  }
  createGain() {
    return { gain: { value: 1 }, connect() {}, disconnect() {} };
  }
  createAnalyser() {
    return {
      fftSize: 256,
      connect() {},
      disconnect() {},
      getFloatTimeDomainData(data: Float32Array) {
        data.fill(0);
      },
    };
  }
  createBuffer(_channels: number, length: number, rate: number) {
    return { duration: length / rate, copyToChannel() {} };
  }
  createBufferSource() {
    const node = new AudioNode();
    this.nodes.push(node);
    return node;
  }
}
test("speech orders chunks, deduplicates blocks and acknowledges only after the final sample", async (t) => {
  const descriptor = Object.getOwnPropertyDescriptor(
    globalThis,
    "AudioContext",
  );
  Object.defineProperty(globalThis, "AudioContext", {
    configurable: true,
    value: AudioFixture,
  });
  t.after(() => {
    if (descriptor)
      Object.defineProperty(globalThis, "AudioContext", descriptor);
    else delete (globalThis as any).AudioContext;
  });
  const events: string[] = [];
  const player = new SpeechPlayer({
    started: () => events.push("started"),
    done: () => events.push("done"),
    error: (error) => assert.fail(error),
  });
  t.after(() => player.dispose());
  const frame = (chunkId: number, complete: boolean): ChatAudioFrame => ({
    sequence: 0,
    operationId: "op",
    messageId: "msg",
    blockId: 0,
    chunkId,
    complete,
    samples: new Float32Array(320),
    sampleRate: 32000,
  });
  player.receive(frame(1, true));
  player.receive(frame(0, false));
  assert.deepEqual(events, []);
  await player.unlock();
  const context = AudioFixture.instances.at(-1)!;
  assert.equal(context.nodes.length, 2);
  assert.deepEqual(events, ["started"]);
  context.nodes[0].finish();
  assert.deepEqual(events, ["started"]);
  context.nodes[1].finish();
  assert.deepEqual(events, ["started", "done"]);
  player.receive(frame(0, false));
  player.receive(frame(1, true));
  assert.equal(context.nodes.length, 2);
  player.reset();
  player.receive(frame(0, true));
  const node = context.nodes.at(-1)!;
  player.reset();
  assert.equal(node.stopped, true);
  node.finish();
  assert.equal(events.filter((event) => event === "done").length, 1);
});

test("command result does not confuse transport success with business failure", async () => {
  const manifold = new ManifoldService({
    call: async () => ({ ok: true, result: { ok: false } }),
  } as any);
  assert.deepEqual(await manifold.commandResult("fixture"), { ok: false });
  const failed = new ManifoldService({
    call: async () => ({ ok: false, error: "denied" }),
  } as any);
  await assert.rejects(failed.commandResult("fixture"), /denied/);
});

test("terminal resolves nested files and rejects reading binary files", async () => {
  const fs = createTerminalLocalFileSystem({
    presentation: async () => ({
      files: [
        {
          id: "a",
          name: "notes.txt",
          folderPath: "文稿/nested",
          kind: "text",
          content: "hello",
        },
        { id: "b", name: "image.png", folderPath: "图片", kind: "image" },
      ],
    }),
  } as any);
  assert.deepEqual(await fs.list("/文稿"), {
    ok: true,
    entries: [{ name: "nested", kind: "dir" }],
  });
  assert.equal((await fs.readText("/文稿/nested/notes.txt")).text, "hello");
  assert.equal((await fs.resolveFile("/图片/image.png"))?.id, "b");
  assert.equal((await fs.readText("/图片/image.png")).ok, false);
  assert.equal((await fs.list("/missing")).ok, false);
});

test("system requests wait for the matching ack and reject on timeout, abort and disconnect", async (t) => {
  environment(t);
  const arcade = new ArcadeClient({ reconnect: false });
  const opening = arcade.connect();
  await tick();
  const socket = Socket.sockets[0];
  socket.open();
  await opening;
  const system = new SystemService(arcade);
  const reset = system.resetWorld("en");
  assert.equal(
    system.resetWorld("en"),
    reset,
    "deduplicate reset from concurrent windows",
  );
  assert.equal(
    socket.sent.filter((item) => item.type === "reset_my_web_world").length,
    1,
  );
  socket.message(JSON.stringify({ type: "pong" }));
  let finished = false;
  void reset.then(() => {
    finished = true;
  });
  await tick();
  assert.equal(finished, false);
  socket.message(
    JSON.stringify({ type: "web_world_reset_ack", worldId: "new-world" }),
  );
  assert.equal((await reset).worldId, "new-world");
  const controller = new AbortController();
  const cancelled = requestSystemReply(
    arcade,
    { type: "ping" },
    "pong",
    100,
    controller.signal,
  );
  controller.abort();
  await assert.rejects(cancelled, /cancelled/);
  await assert.rejects(
    requestSystemReply(arcade, { type: "ping" }, "pong", 5),
    /timed out/,
  );
  const disconnected = requestSystemReply(
    arcade,
    { type: "ping" },
    "pong",
    100,
  );
  arcade.close();
  await assert.rejects(disconnected, /closed/);
  await assert.rejects(system.resetWorld("en"), /unavailable/);
});

test("conversation bubbles ignore mount history, retain block identities and expire on receipt time", () => {
  const timeline = new ConversationTimeline();
  const line = (messageId: string, extra = {}) => ({
    messageId,
    sender: "agent" as const,
    content: messageId,
    ...extra,
  });
  assert.deepEqual(timeline.update(1, [line("history")], 1000), []);
  const lines = [
    line("history"),
    line("new", { blockId: 0 }),
    line("new", { blockId: 1 }),
    line("other"),
    line("fourth"),
    line("hidden", { isSpeech: false }),
  ];
  assert.deepEqual(
    timeline.update(1, lines, 2000).map((bubble) => bubble.id),
    ["new:1", "other", "fourth"],
  );
  assert.equal(
    timeline.update(
      1,
      lines.map((item) => ({ ...item, content: "stream updated" })),
      25000,
    )[0].receivedAt,
    2000,
  );
  assert.equal(
    timeline.visible(32001).length,
    0,
    "stream updates must not extend the 30 second expiry",
  );
  assert.deepEqual(
    timeline.update(2, lines, 33000),
    [],
    "reconnect must not replay history",
  );
  assert.deepEqual(
    timeline
      .update(2, [...lines, line("fresh")], 34000)
      .map((bubble) => bubble.id),
    ["fresh"],
  );
});
