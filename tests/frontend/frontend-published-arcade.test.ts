import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import vm from "node:vm";

const repoRoot = process.cwd();
// Exercise the shipped code, not the source frontend that Vite builds elsewhere.
const html = readFileSync(resolve(repoRoot, "public/index.html"), "utf8");
const entry = html.match(/<script type="module" crossorigin src="\/([^"]+)"/)![1];
const entryCode = readFileSync(resolve(repoRoot, "public", entry), "utf8");
const bundlePath = entryCode.match(/assets\/NormalApp-[\w-]+\.js/)![0];
const bundle = readFileSync(resolve(repoRoot, "public", bundlePath), "utf8");
function section(start: string, end: string) {
  const from = bundle.indexOf(start), to = bundle.indexOf(end, from);
  assert.ok(from >= 0 && to > from, `missing shipped declaration: ${start}`);
  return bundle.slice(from, to);
}
const code = [
  section("const Nme = 2,", "function Kme("),
  section("class _a extends Error", "class t0e"),
  section("class t0e {", "const n0e ="),
  section("const n0e =", "const s0e ="),
  section("const s0e =", "function h0e("),
  section("class x0e {", "class w0e"),
  section("class w0e extends Error", "const S0e ="),
  section("function A0e(", "function P0e("),
  section("async function ige(", "let age ="),
].join("\n");
const flush = async () => { for (let i = 0; i < 20; i++) await Promise.resolve(); };
function deferred<T>() {
  let resolve!: (value: T) => void, reject!: (error: Error) => void;
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
function harness() {
  let now = 0, next = 0;
  const timers = new Map<number, { callback: () => void; at: number; delay: number }>();
  const sockets: Socket[] = [];
  class Socket extends EventTarget {
    static OPEN = 1;
    readyState = 0;
    sent: any[] = [];
    constructor(public url: string, public protocols?: string[]) { super(); sockets.push(this); }
    open() { this.readyState = 1; this.dispatchEvent(new Event("open")); }
    close(code = 1000, reason = "") {
      if (this.readyState === 3) return;
      this.readyState = 3;
      const event = new Event("close");
      Object.assign(event, { code, reason, wasClean: true });
      this.dispatchEvent(event);
    }
    send(raw: string) { this.sent.push(JSON.parse(raw)); }
    message(value: unknown) { this.dispatchEvent(new MessageEvent("message", { data: JSON.stringify(value) })); }
  }
  class Store {
    value = { world: { ref: null as null | { worldId: string } } };
    getState() { return this.value; }
    setConnectionStatus() {}
    subscribeRuntimeGap() {}
    resetServerState() { this.value.world.ref = null; }
  }
  const context = vm.createContext({
    AbortController, Error, console: { info() {}, warn() {}, error() {} }, WebSocket: Socket,
    Date: { now: () => now }, Math,
    setTimeout(callback: () => void, delay: number) {
      timers.set(++next, { callback, at: now + delay, delay });
      return next;
    },
    clearTimeout(id: number) { timers.delete(id); },
    clearInterval(id: number) { timers.delete(id); },
    gme: Store, Rme: class { clear() { return []; } list() { return []; } },
    bte: (data: any) => ({ success: data.type === "pong", data }),
    Yme: (error: Error) => error instanceof Error && error.name === "ReauthRequired",
    kme: () => false, zR: (_handler: unknown, _source: string, error: unknown) => { throw error; },
    Ef: { wrongMachine: 4001, entryGated: 4003, deployRestart: 4010, mediaGrantInvalid: 4005 },
    Xme: () => 250,
    ai: () => ({ emit() {}, on() { return () => {}; } }),
    dr() {}, W_: (a: unknown, b: unknown) => a === b,
    b0e: 15_000, _0e: 5_000, Eo: () => undefined, ya: (promise: Promise<unknown>) => promise,
    wb: (signal: AbortSignal) => { if (signal.aborted) throw signal.reason; },
    nE: (error: Error) => error.name === "AbortError", y0e: () => false,
    p0e: (options: unknown) => options,
    fetch: async () => Response.json({ ticket: "fixture" }),
  });
  vm.runInContext(code, context, { filename: bundlePath });
  const api = vm.runInContext("({ transport: i0e, Client: t0e, Session: x0e, media: f0e, ticket: oge, ticketOptions: A0e })", context);
  const transport = (options = {}) => api.transport({ wsUrl: "ws://fixture/api/arcade/web/v1", ...options });
  const client = (options = {}) => new api.Client({
    transport: transport(), reconnectMode: "open_my_web_world",
    reconnect: { baseDelayMs: 100, maxDelayMs: 1000, maxAttempts: 2, jitter: false }, ...options,
  });
  return {
    api, context, sockets, timers, transport, client,
    async advance(ms: number) {
      const end = now + ms;
      for (let steps = 0; ; steps++) {
        assert.ok(steps < 100, "timer loop did not terminate");
        const due = [...timers].filter(([, timer]) => timer.at <= end).sort((a, b) => a[1].at - b[1].at)[0];
        if (!due) break;
        now = due[1].at;
        timers.delete(due[0]);
        due[1].callback();
        await flush();
      }
      now = end;
      await flush();
    },
  };
}

test("published transport shares ticket failures and can retry after a constructor failure", async () => {
  const h = harness(), ticket = deferred<string[]>();
  const transport = h.transport({ fetchSubprotocols: () => ticket.promise });
  const first = transport.connect(), second = transport.connect();
  assert.equal(first, second);
  const rejected = assert.rejects(first, /ticket failed/);
  ticket.reject(new Error("ticket failed"));
  await rejected;
  assert.equal(transport.state(), "closed");
  assert.equal(h.timers.size, 0);
  const native = h.context.WebSocket;
  h.context.WebSocket = class { constructor() { throw new Error("socket constructor failed"); } };
  ticket.resolve([]);
  const retry = h.transport();
  await assert.rejects(retry.connect(), /constructor failed/);
  h.context.WebSocket = native;
  const success = retry.connect();
  await flush();
  h.sockets.at(-1)!.open();
  await success;
  retry.close();
  assert.equal(h.timers.size, 0);
});

for (const phase of ["ticket", "handshake"] as const) {
  test(`published close cancels a pending ${phase} and fences late results`, async () => {
    const h = harness(), ticket = deferred<string[]>();
    let signal!: AbortSignal;
    const transport = h.transport({ fetchSubprotocols: (s: AbortSignal) => { signal = s; return ticket.promise; } });
    const opening = transport.connect();
    const rejected = assert.rejects(opening, /Closed while connecting/);
    if (phase === "handshake") { ticket.resolve(["arcade.v1"]); await flush(); }
    transport.close();
    await rejected;
    assert.equal(signal.aborted, true);
    ticket.resolve(["arcade.v1"]);
    await flush();
    assert.equal(transport.state(), "closed");
    assert.equal(h.sockets.length, phase === "ticket" ? 0 : 1);
    assert.equal(h.timers.size, 0);
  });

  test(`published timeout covers ${phase} and does not resurrect a late attempt`, async () => {
    const h = harness(), ticket = deferred<string[]>();
    let signal!: AbortSignal;
    const transport = h.transport({ fetchSubprotocols: (s: AbortSignal) => { signal = s; return ticket.promise; } });
    const opening = transport.connect();
    const rejected = assert.rejects(opening, /connection timed out/);
    if (phase === "handshake") { ticket.resolve(["arcade.v1"]); await flush(); }
    await h.advance(10_000);
    await rejected;
    assert.equal(signal.aborted, true);
    ticket.resolve(["arcade.v1"]);
    await flush();
    assert.equal(transport.state(), "closed");
    assert.equal(h.timers.size, 0);
  });
}

test("published ticket callback forwards cancellation and classifies authentication failures", async () => {
  const h = harness();
  for (const status of [401, 403, 503]) {
    let received!: AbortSignal;
    h.context.fetch = async (_url: string, init: RequestInit) => {
      received = init.signal as AbortSignal;
      return Response.json({}, { status });
    };
    const controller = new AbortController();
    const options = h.api.ticketOptions({ fetchWsTicket: h.api.ticket });
    await assert.rejects(options.fetchSubprotocols(controller.signal), (error: Error) =>
      status === 503 ? error.name === "Error" : error.name === "ReauthRequired");
    assert.equal(received, controller.signal);
  }
});

for (const joined of [false, true]) {
  test(`published short-lived sockets exhaust backoff even with world joined=${joined}`, async () => {
    const h = harness(), client = h.client();
    if (joined) {
      client.store.value.world.ref = { worldId: "fixture" };
      client.reopenMyWebWorld = async () => {};
    }
    const opening = client.connect();
    await flush();
    h.sockets.at(-1)!.open();
    await opening;
    for (const delay of [100, 200]) {
      h.sockets.at(-1)!.close(1011, "arcade_runtime_error");
      assert.equal(client.lastReconnectDelayMs, delay);
      await h.advance(delay);
      h.sockets.at(-1)!.open();
      await flush();
    }
    h.sockets.at(-1)!.close(1011, "arcade_runtime_error");
    assert.equal(client.reconnectExhausted, true);
    assert.equal(h.sockets.length, 3);
    assert.equal(h.timers.size, 0);
    const retry = client.connect();
    await flush();
    h.sockets.at(-1)!.open();
    await retry;
    client.close();
  });
}

test("published only a stable connection resets the retry budget", async () => {
  const h = harness(), client = h.client();
  const opening = client.connect();
  await flush(); h.sockets.at(-1)!.open(); await opening;
  h.sockets.at(-1)!.close();
  await h.advance(100); h.sockets.at(-1)!.open(); await flush();
  assert.equal(client.reconnectAttempt, 1);
  await h.advance(30_000);
  assert.equal(client.reconnectAttempt, 0);
  h.sockets.at(-1)!.close();
  assert.equal(client.lastReconnectDelayMs, 100);
  client.close();
  assert.equal(h.timers.size, 0);
});

test("published deploy-restart retries also respect the retry budget", async () => {
  const h = harness(), client = h.client();
  const opening = client.connect();
  await flush(); h.sockets.at(-1)!.open(); await opening;
  for (let i = 0; i < 2; i++) {
    h.sockets.at(-1)!.close(4010, "deploy_restart");
    await h.advance(2500); h.sockets.at(-1)!.open(); await flush();
  }
  h.sockets.at(-1)!.close(4010, "deploy_restart");
  assert.equal(client.reconnectExhausted, true);
  assert.equal(h.timers.size, 0);
});

test("published session_invalid and ticket 401 stop automatic reconnect", async () => {
  const h = harness(), client = h.client();
  const opening = client.connect();
  await flush(); h.sockets.at(-1)!.open(); await opening;
  h.sockets.at(-1)!.close(1008, "session_invalid");
  assert.equal(client.invalidSessionReason, "session_invalid");
  assert.equal(client.closedExplicitly, true);
  assert.equal(h.timers.size, 0);
  h.context.fetch = async () => Response.json({}, { status: 401 });
  const unauthorized = h.client({ transport: h.transport({ fetchSubprotocols: h.api.ticket }) });
  await assert.rejects(unauthorized.connect());
  assert.equal(unauthorized.connectionState, "offline");
  assert.equal(unauthorized.reconnectAttempt, 0);
  assert.equal(h.timers.size, 0);
});

test("published failed initial world open closes the client and cancels scheduled reconnect", async () => {
  const h = harness(), client = h.client();
  const session = new h.api.Session({ createClient: () => client, bootstrap: { kind: "open_my_web_world" } });
  session.installClientHandlers = () => {};
  const starting = session.start();
  const rejected = assert.rejects(starting, /WS closed/);
  await flush(); h.sockets.at(-1)!.open(); await flush();
  assert.equal(h.sockets[0].sent[0].type, "open_my_web_world");
  h.sockets[0].close(1011, "arcade_runtime_error");
  await rejected;
  assert.equal(session.state.phase, "fatal");
  assert.equal(client.closedExplicitly, true);
  assert.equal(h.timers.size, 0);
  await h.advance(60_000);
  assert.equal(h.sockets.length, 1);
});

test("published media cancels hung tickets and caps short open-close loops", async () => {
  const h = harness(), ticket = deferred<string[]>();
  let signal!: AbortSignal;
  const media = h.api.media({ mediaWsUrl: "ws://fixture/media", createWebSocket: (...args: any[]) => new h.context.WebSocket(...args),
    fetchSubprotocols: (s: AbortSignal) => { signal = s; return ticket.promise; },
    reconnect: { maxAttempts: 2, baseDelayMs: 100, maxDelayMs: 1000 } });
  media.setGrant("fixture");
  await h.advance(10_000);
  assert.equal(signal.aborted, true);
  media.close();
  ticket.resolve(["arcade.v1"]);
  await flush();
  assert.equal(h.sockets.length, 0);
  assert.equal(h.timers.size, 0);
  const active = h.api.media({ mediaWsUrl: "ws://fixture/media", createWebSocket: (...args: any[]) => new h.context.WebSocket(...args),
    reconnect: { maxAttempts: 2, baseDelayMs: 100, maxDelayMs: 1000 } });
  active.setGrant("fixture"); await flush(); h.sockets.at(-1)!.open();
  for (const delay of [100, 200]) {
    h.sockets.at(-1)!.close(1011, "arcade_runtime_error");
    await h.advance(delay); h.sockets.at(-1)!.open();
  }
  h.sockets.at(-1)!.close(1011, "arcade_runtime_error");
  assert.equal(active.getState(), "exhausted");
  assert.equal(h.timers.size, 0);
  active.close();
});
