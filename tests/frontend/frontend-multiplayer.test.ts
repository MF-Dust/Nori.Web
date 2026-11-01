import test, { mock } from "node:test";
import assert from "node:assert/strict";
import { GameCartridgeController } from "../../frontend-src/apps/game-cartridge-controller";
import { chessStateSchema } from "../../frontend-src/apps/chess-schema";
import { GameService } from "../../frontend-src/services/games";
import { GuestArcade, HostBridge, sendStrokes, type StrokeUpdate } from "../../frontend-src/multiplayer/session";
import { PictionaryDrawingBridge } from "../../frontend-src/apps/pictionary-runtime";
import type { DrawingStroke } from "../../frontend-src/apps/pictionary-model";
import { GUEST_COMMANDS, hostCommandBlocked, parsePeerMessage, PEER_PROTOCOL_VERSION, topLevelPatch } from "../../frontend-src/multiplayer/protocol";
import { decodeSignal, encodeSignal, Emitter, type PeerLink, type PeerLinkState } from "../../frontend-src/multiplayer/transport";
import { webRtcConfig } from "../../frontend-src/multiplayer/webrtc-transport";
import { DEFAULT_MULTIPLAYER_SETTINGS } from "../../frontend-src/state/multiplayer-settings-store";
import type { ArcadeChannel } from "../../frontend-src/runtime/arcade-client";
import type { ArcadeServerMessage, JsonValue } from "../../frontend-src/runtime/protocol";

class MemoryLink implements PeerLink {
  readonly transport = "webrtc" as const;
  route = "direct" as const;
  state: PeerLinkState = "open";
  peer!: MemoryLink;
  sent: string[] = [];
  private messages = new Emitter<string>();
  private states = new Emitter<PeerLinkState>();
  send(message: string) { this.sent.push(message); const peer = this.peer; queueMicrotask(() => peer.messages.emit(message)); }
  onMessage(listener: (message: string) => void) { return this.messages.on(listener); }
  onState(listener: (state: PeerLinkState) => void) { return this.states.on(listener); }
  close() { if (this.state === "closed") return; this.state = "closed"; this.states.emit("closed"); }
  static pair(): [MemoryLink, MemoryLink] {
    const a = new MemoryLink(), b = new MemoryLink();
    a.peer = b; b.peer = a;
    return [a, b];
  }
}

class FakeHostArcade implements ArcadeChannel {
  connectionState = "open" as const;
  dispatched: Array<{ id: string; cartridgeId: string; actor: string; cmd: Record<string, JsonValue>; head: number }> = [];
  events: Array<{ id: string; channel: string; payload: JsonValue }> = [];
  private listeners = new Set<(message: ArcadeServerMessage) => void>();
  onMessage(listener: (message: ArcadeServerMessage) => void) { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; }
  onState(listener: (state: "open") => void) { listener("open"); return () => {}; }
  send() {}
  sendEvent(channel: string, payload: JsonValue = {}) { const id = `event-${this.events.length}`; this.events.push({ id, channel, payload }); return id; }
  dispatch(cartridgeId: string, head: number, cmd: { type: string; [key: string]: JsonValue }, actor = "player") {
    const id = `host-${this.dispatched.length}`; this.dispatched.push({ id, cartridgeId, actor, cmd, head }); return id;
  }
  emit(message: Record<string, unknown>) { for (const listener of this.listeners) listener(message as ArcadeServerMessage); }
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));
const t = (key: string) => key;

function chessRuntime(version: number, extra: Record<string, JsonValue> = {}) {
  return {
    visibilityFenceId: "ui", headVersion: version, visibleVersion: version,
    state: {
      gameState: { fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", turn: "white", status: "playing", winner: null, moveHistory: [] },
      drawOffer: null, takebackRequest: null, tutorial: null,
      settings: { playerSide: "black", difficulty: "casual", locale: "en" }, ...extra,
    } as Record<string, JsonValue>,
  };
}

function connect() {
  const [hostLink, guestLink] = MemoryLink.pair();
  const arcade = new FakeHostArcade();
  const ended: string[] = [];
  const host = new HostBridge("chess", hostLink, arcade, "room", t, { onRtt() {}, onEnd: (reason) => ended.push(`host:${reason}`) });
  const guest = new GuestArcade("chess", guestLink, "room", t, { onRtt() {}, onEnd: (reason) => ended.push(`guest:${reason}`) });
  const controller = new GameCartridgeController("chess", new GameService(guest, guest.world), guest.world, guest, (raw) => chessStateSchema.parse(raw));
  return { arcade, host, guest, controller, ended, hostLink, guestLink };
}

test("signal codes round-trip and reject foreign text", async () => {
  const value = { v: 1, kind: "offer", sdp: "v=0\r\n".repeat(50), meta: { game: "chess", room: "abc" } };
  const code = await encodeSignal(value);
  assert.match(code, /^NORI-MP1\.[zj]/);
  assert.deepEqual(await decodeSignal(code), value);
  await assert.rejects(decodeSignal("hello"));
});

test("WebRTC config offers direct STUN paths with TURN fallback, or relay only", () => {
  const settings = { ...DEFAULT_MULTIPLAYER_SETTINGS, turn: { urls: "turn:turn.example:3478 http://bad", username: "u", credential: "p" } };
  const both = webRtcConfig(settings);
  assert.equal(both.iceTransportPolicy, "all");
  assert.equal(both.iceServers.length, 2);
  assert.deepEqual(both.iceServers[1], { urls: ["turn:turn.example:3478"], username: "u", credential: "p" });
  const relay = webRtcConfig({ ...settings, forceRelay: true });
  assert.equal(relay.iceTransportPolicy, "relay");
  assert.equal(relay.iceServers.length, 1);
  // Relay-only without TURN would never connect; keep the normal policy.
  assert.equal(webRtcConfig({ ...DEFAULT_MULTIPLAYER_SETTINGS, forceRelay: true }).iceTransportPolicy, "all");
});

test("protocol guards: allowlists, host-only commands, bounded parsing, top-level patches", () => {
  assert.ok(GUEST_COMMANDS.chess.has("move"));
  assert.ok(!GUEST_COMMANDS.chess.has("startGame"));
  assert.ok(!GUEST_COMMANDS.cakeduel.has("reset"));
  assert.ok(hostCommandBlocked("chess", { type: "startGame", mode: "tutorial" }));
  assert.ok(!hostCommandBlocked("chess", { type: "startGame", mode: "normal" }));
  assert.equal(parsePeerMessage("{\"t\":\"dispatch\",\"requestId\":\"x\",\"expectedHeadVersion\":-1,\"cmd\":{\"type\":\"move\"}}"), null);
  assert.equal(parsePeerMessage("not json"), null);
  assert.deepEqual(topLevelPatch({ a: 1, b: 2 }, { b: 3, c: 4 }), [
    { op: "remove", path: "/a" }, { op: "replace", path: "/b", value: 3 }, { op: "add", path: "/c", value: 4 },
  ]);
});

test("guest mirrors the host's agent view and relays moves as the agent seat", async () => {
  const { arcade, host, guest, controller, ended } = connect();
  const release = controller.retain();
  // The host leased Nori's seat and forwards the agent-perspective snapshot.
  const lease = arcade.events.find((event) => event.channel === "multiplayer.remote_opponent");
  assert.deepEqual(lease?.payload, { cartridgeId: "chess", enabled: true, leaseMs: 120_000 });
  arcade.emit({ type: "event", channel: "multiplayer.remote_opponent.result", requestId: lease!.id, payload: { ok: true, cartridgeId: "chess", enabled: true, runtime: chessRuntime(3) } });
  await flush();
  assert.equal(guest.connectionState, "open");
  assert.equal(controller.snapshot().state?.settings.playerSide, "black");

  const move = controller.dispatch({ type: "move", from: "e7", to: "e5" });
  await flush();
  assert.equal(arcade.dispatched.length, 1);
  assert.equal(arcade.dispatched[0].actor, "agent");
  assert.equal(arcade.dispatched[0].head, 3);
  arcade.emit({ type: "event", channel: "multiplayer.remote_view", payload: { cartridgeId: "chess", version: 4, runtime: chessRuntime(4, { drawOffer: "white" }), transition: { actor: "player", events: [] } } });
  arcade.emit({ type: "dispatch_ack", requestId: "host-0", cartridgeId: "chess", success: true, headVersion: 4, runtimes: [{ secret: true }] });
  assert.equal(await move, true);
  assert.equal(controller.snapshot().state?.drawOffer, "white");

  // Host-only commands never reach the host world.
  const start = await controller.dispatch({ type: "startGame", mode: "normal" });
  assert.equal(start, false);
  assert.equal(controller.snapshot().error, "multiplayer.error.hostOnly");
  assert.equal(arcade.dispatched.length, 1);

  release();
  host.close();
  await flush();
  assert.ok(arcade.events.some((event) => event.channel === "multiplayer.remote_opponent" && (event.payload as { enabled: boolean }).enabled === false));
  assert.ok(ended.includes("host:closed") && ended.includes("guest:closed"));
  controller.dispose();
});

test("version-mismatch acks never leak the host's runtimes and trigger a fresh view", async () => {
  const { arcade, host, guest, guestLink, hostLink } = connect();
  const lease = arcade.events[0];
  arcade.emit({ type: "event", channel: "multiplayer.remote_opponent.result", requestId: lease.id, payload: { ok: true, runtime: chessRuntime(1) } });
  await flush();
  guest.dispatch("chess", 0, { type: "move", from: "e7", to: "e5" });
  await flush();
  arcade.emit({ type: "dispatch_ack", requestId: "host-0", cartridgeId: "chess", success: false, errorCode: "version_mismatch", headVersion: 1, runtimes: [chessRuntime(1, { settings: { playerSide: "white", difficulty: "casual", locale: "en" } })] });
  const ack = hostLink.sent.map((raw) => JSON.parse(raw)).find((message) => message.t === "ack");
  assert.equal(ack.success, false);
  assert.equal("runtimes" in ack, false);
  assert.equal(arcade.events.filter((event) => event.channel === "multiplayer.remote_opponent").length, 2);
  host.close(); guest.close(); guestLink.close();
});

test("names travel in hello, and the guest's turn clock lets Nori cover one move", async () => {
  const [hostLink, guestLink] = MemoryLink.pair();
  const arcade = new FakeHostArcade();
  const names: Array<string | undefined> = [];
  const host = new HostBridge("chess", hostLink, arcade, "room", t, {
    onRtt() {}, onEnd() {}, onPeerName: (name) => names.push(name),
  }, undefined, { name: "  Alice\n ", turnTimeoutMs: 30 });
  const guestClocks: Array<number | null> = [];
  const guest = new GuestArcade("chess", guestLink, "room", t, {
    onRtt() {}, onEnd() {}, onPeerName: (name) => names.push(name), onClock: (deadline) => guestClocks.push(deadline),
  }, "Bob");
  await flush();
  assert.deepEqual(names.sort(), ["Alice", "Bob"]);
  arcade.emit({ type: "event", channel: "multiplayer.remote_opponent.result", requestId: arcade.events[0].id, payload: { ok: true, runtime: chessRuntime(1), agentTurn: false } });
  arcade.emit({ type: "event", channel: "multiplayer.remote_view", payload: { cartridgeId: "chess", version: 2, runtime: chessRuntime(2), transition: { actor: "agent", events: [] }, agentTurn: true } });
  await flush();
  assert.ok(guestClocks.some((deadline) => typeof deadline === "number"), "the guest sees its countdown");
  await new Promise((resolve) => setTimeout(resolve, 60));
  assert.ok(arcade.events.some((event) => event.channel === "multiplayer.agent_step"), "Nori covers the idle seat");
  host.close(); guest.close();
});

test("a vanished guest keeps the seat leased; a goodbye releases it", async () => {
  const released = (arcade: FakeHostArcade) => arcade.events.some((event) => event.channel === "multiplayer.remote_opponent" && (event.payload as { enabled: boolean }).enabled === false);
  const lost = connect();
  lost.guestLink.close();
  lost.hostLink.close();
  await flush();
  assert.ok(lost.ended.includes("host:failed"));
  assert.equal(released(lost.arcade), false);
  const clean = connect();
  clean.guest.close();
  await flush();
  assert.ok(clean.ended.includes("host:closed"));
  assert.equal(released(clean.arcade), true);
});

test("peer names are bounded single-line text", () => {
  const hello = parsePeerMessage(JSON.stringify({ t: "hello", v: 1, game: "chess", role: "host", room: "r", name: "a\u0007b\n  c".padEnd(80, "x") }));
  assert.ok(hello && hello.t === "hello");
  assert.equal(hello.name?.startsWith("ab c"), true);
  assert.equal(hello.name!.length <= 24, true);
});

const peerMessages = (link: MemoryLink) => link.sent.map((raw) => JSON.parse(raw) as Record<string, any>);

test("lease renewals extend the seat without remounting the guest's game", async () => {
  mock.timers.enable({ apis: ["setInterval"] });
  try {
    const { arcade, host, guest, controller, hostLink } = connect();
    const release = controller.retain();
    arcade.emit({ type: "event", channel: "multiplayer.remote_opponent.result", requestId: arcade.events[0].id, payload: { ok: true, runtime: chessRuntime(2) } });
    await flush();
    const epoch = controller.snapshot().presentationEpoch;
    const views = () => peerMessages(hostLink).filter((message) => message.t === "view").length;
    assert.equal(views(), 1);

    mock.timers.tick(30_000);
    const renewal = arcade.events.at(-1)!;
    assert.deepEqual(renewal.payload, { cartridgeId: "chess", enabled: true, leaseMs: 120_000, view: false });
    // Even if a backend still attached a snapshot, a renewal is not forwarded.
    arcade.emit({ type: "event", channel: "multiplayer.remote_opponent.result", requestId: renewal.id, payload: { ok: true, runtime: chessRuntime(2) } });
    await flush();
    assert.equal(views(), 1);
    assert.equal(controller.snapshot().presentationEpoch, epoch, "no remount, no aborted animation");

    // A fresh view at the version the guest already has is a no-op too.
    arcade.emit({ type: "dispatch_ack", requestId: "unrelated", cartridgeId: "chess", success: true, headVersion: 2 });
    arcade.emit({ type: "world_joined", world: { worldId: "w", mountedCartridges: [] } });
    arcade.emit({ type: "event", channel: "multiplayer.remote_opponent.result", requestId: arcade.events.at(-1)!.id, payload: { ok: true, runtime: chessRuntime(2) } });
    await flush();
    assert.equal(views(), 2);
    assert.equal(controller.snapshot().presentationEpoch, epoch);
    release(); host.close(); guest.close(); controller.dispose();
  } finally { mock.timers.reset(); }
});

test("a host world reset (lower version) replaces the guest's mirror", async () => {
  const { arcade, host, guest, controller } = connect();
  const release = controller.retain();
  arcade.emit({ type: "event", channel: "multiplayer.remote_opponent.result", requestId: arcade.events[0].id, payload: { ok: true, runtime: chessRuntime(9, { drawOffer: "white" }) } });
  await flush();
  assert.equal(controller.snapshot().state?.drawOffer, "white");
  arcade.emit({ type: "world_created", world: { worldId: "w2", mountedCartridges: [] } });
  arcade.emit({ type: "event", channel: "multiplayer.remote_opponent.result", requestId: arcade.events.at(-1)!.id, payload: { ok: true, runtime: chessRuntime(1) } });
  await flush();
  assert.equal(guest.world.runtime("chess")?.headVersion, 1);
  assert.equal(controller.snapshot().state?.drawOffer, null);
  // Later commits of the new world apply normally.
  arcade.emit({ type: "event", channel: "multiplayer.remote_view", payload: { cartridgeId: "chess", version: 2, runtime: chessRuntime(2, { drawOffer: "black" }), transition: { actor: "agent", events: [] } } });
  await flush();
  assert.equal(controller.snapshot().state?.drawOffer, "black");
  release(); host.close(); guest.close(); controller.dispose();
});

test("a guest mount before the host opened the game is acknowledged by the first view", async () => {
  const { arcade, host, guest, controller } = connect();
  arcade.emit({ type: "event", channel: "multiplayer.remote_opponent.result", requestId: arcade.events[0].id, payload: { ok: true, runtime: null } });
  await flush();
  const mounted = controller.ensureMounted();
  assert.equal(controller.snapshot().pending, true);
  arcade.emit({ type: "cartridge_mounted_ack", cartridgeId: "chess", requestId: "host-mount" });
  arcade.emit({ type: "event", channel: "multiplayer.remote_opponent.result", requestId: arcade.events.at(-1)!.id, payload: { ok: true, runtime: chessRuntime(0) } });
  assert.equal(await mounted, true);
  assert.equal(controller.snapshot().pending, false);
  host.close(); guest.close(); controller.dispose();
});

test("the turn clock waits for an in-flight guest move and never steps a stale head", async () => {
  const [hostLink, guestLink] = MemoryLink.pair();
  const arcade = new FakeHostArcade();
  const host = new HostBridge("chess", hostLink, arcade, "room", t, { onRtt() {}, onEnd() {} }, undefined, { turnTimeoutMs: 20 });
  const guest = new GuestArcade("chess", guestLink, "room", t, { onRtt() {}, onEnd() {} });
  arcade.emit({ type: "event", channel: "multiplayer.remote_opponent.result", requestId: arcade.events[0].id, payload: { ok: true, runtime: chessRuntime(4), agentTurn: true } });
  await flush();
  guest.dispatch("chess", 4, { type: "move", from: "e7", to: "e5" });
  await new Promise((resolve) => setTimeout(resolve, 60));
  assert.equal(arcade.events.some((event) => event.channel === "multiplayer.agent_step"), false, "the guest's move is pending");
  // The guest's move lands; the host's turn follows, then the guest idles on its next turn.
  arcade.emit({ type: "event", channel: "multiplayer.remote_view", payload: { cartridgeId: "chess", version: 5, runtime: chessRuntime(5), transition: { actor: "player", events: [] }, agentTurn: false } });
  arcade.emit({ type: "dispatch_ack", requestId: "host-0", cartridgeId: "chess", success: true, headVersion: 5 });
  arcade.emit({ type: "event", channel: "multiplayer.remote_view", payload: { cartridgeId: "chess", version: 6, runtime: chessRuntime(6), transition: { actor: "agent", events: [] }, agentTurn: true } });
  await new Promise((resolve) => setTimeout(resolve, 60));
  const step = arcade.events.find((event) => event.channel === "multiplayer.agent_step");
  assert.deepEqual(step?.payload, { cartridgeId: "chess", expectedHeadVersion: 6 });
  host.close(); guest.close();
});

test("peers on another protocol version are refused and the seat goes back to Nori", async () => {
  const [hostLink, guestLink] = MemoryLink.pair();
  const arcade = new FakeHostArcade();
  const ended: string[] = [];
  new HostBridge("chess", hostLink, arcade, "room", t, { onRtt() {}, onEnd: (reason) => ended.push(reason) });
  guestLink.send(JSON.stringify({ t: "hello", v: PEER_PROTOCOL_VERSION - 1, game: "chess", role: "guest", room: "room" }));
  await flush();
  assert.deepEqual(ended, ["version"]);
  assert.ok(arcade.events.some((event) => event.channel === "multiplayer.remote_opponent" && (event.payload as { enabled: boolean }).enabled === false));
  const [a, b] = MemoryLink.pair();
  const guestEnded: string[] = [];
  new GuestArcade("chess", b, "room", t, { onRtt() {}, onEnd: (reason) => guestEnded.push(reason) });
  a.send(JSON.stringify({ t: "hello", v: PEER_PROTOCOL_VERSION + 1, game: "chess", role: "host", room: "room" }));
  await flush();
  assert.deepEqual(guestEnded, ["version"]);
});

test("guest stroke batches are acknowledged locally, without a host round trip", async () => {
  const [hostLink, guestLink] = MemoryLink.pair();
  const arcade = new FakeHostArcade();
  const host = new HostBridge("pictionary", hostLink, arcade, "room", t, { onRtt() {}, onEnd() {} });
  const guest = new GuestArcade("pictionary", guestLink, "room", t, { onRtt() {}, onEnd() {} });
  arcade.emit({ type: "event", channel: "multiplayer.remote_opponent.result", requestId: arcade.events[0].id, payload: { ok: true, runtime: { visibilityFenceId: "ui", headVersion: 1, visibleVersion: 1, state: {} } } });
  await flush();
  const acks: Array<Record<string, unknown>> = [];
  guest.onMessage((message) => { if (message.type === "dispatch_ack") acks.push(message as unknown as Record<string, unknown>); });
  const before = guestLink.sent.length;
  const id = guest.dispatch("pictionary", 1, { type: "submitStrokeBatch", batch: [] });
  await flush();
  assert.equal(acks[0]?.requestId, id);
  assert.equal(acks[0]?.success, true);
  assert.equal(guestLink.sent.slice(before).some((raw) => JSON.parse(raw).t === "dispatch"), false);
  host.close(); guest.close();
});

function fakeDrawingController(roundId: string) {
  const listeners = new Set<() => void>();
  let snapshot = { state: { gameState: { round: { roundId, status: "active", roles: { drawer: "player", guesser: "agent" } } } }, pending: false };
  return {
    snapshot: () => snapshot,
    subscribe: (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; },
    setRound(next: string, drawer: "player" | "agent" = "player") {
      snapshot = { state: { gameState: { round: { roundId: next, status: "active", roles: { drawer, guesser: drawer === "player" ? "agent" : "player" } } } }, pending: false };
      listeners.forEach((listener) => listener());
    },
  };
}

const fakeArcade = { onMessage: () => () => {}, sendEvent: () => "event" } as unknown as ArcadeChannel;
const stroke = (index: number, points = 3): DrawingStroke => ({
  points: Array.from({ length: points }, (_, point) => ({ x: (index + point / 7) / 1000 + 0.123456789, y: 0.987654321 })), color: "#000000", width: 3,
});
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

test("Pictionary strokes travel as quantized deltas and survive undo and races", async () => {
  const drawer = fakeDrawingController("r1"), viewer = fakeDrawingController("r1");
  const local = new PictionaryDrawingBridge(drawer as any, fakeArcade);
  const remote = new PictionaryDrawingBridge(viewer as any, fakeArcade);
  const wire: StrokeUpdate[] = [];
  remote.setPeerSink(() => {});
  local.setPeerSink((update) => { wire.push(update); remote.receivePeerStrokes(JSON.parse(JSON.stringify(update))); });

  const canvas: DrawingStroke[] = [stroke(0), stroke(1)];
  local.strokesChanged(canvas);
  await wait(130);
  canvas.push(stroke(2));
  local.strokesChanged(canvas);
  await wait(130);
  assert.deepEqual(wire.map((update) => [update.from, update.strokes.length]), [[0, 2], [2, 1]], "only the new stroke is sent");
  assert.equal(JSON.stringify(wire[0].strokes).includes("0.123456789"), false, "coordinates are quantized");
  assert.equal(remote.peerSnapshot().strokes.length, 3);

  canvas.pop();
  local.strokesChanged(canvas);
  await wait(130);
  assert.deepEqual([wire.at(-1)!.from, wire.at(-1)!.strokes.length], [2, 0], "undo truncates");
  assert.equal(remote.peerSnapshot().strokes.length, 2);

  // Next round: the first strokes may arrive before the viewer's round transition.
  drawer.setRound("r2");
  local.strokesChanged([stroke(9)]);
  await wait(130);
  assert.equal(remote.peerSnapshot().roundId, "r2");
  viewer.setRound("r2", "agent");
  assert.equal(remote.peerSnapshot().strokes.length, 1, "early strokes are kept");
  assert.deepEqual(local.localStrokes("r2").length, 1, "the drawer's canvas can be restored after a remount");
  local.dispose(); remote.dispose();
});

test("a re-invited peer receives the drawing so far; large deltas are chunked", async () => {
  const drawer = fakeDrawingController("r1");
  const local = new PictionaryDrawingBridge(drawer as any, fakeArcade);
  const canvas = Array.from({ length: 80 }, (_, index) => stroke(index, 128));
  local.strokesChanged(canvas);
  const updates: StrokeUpdate[] = [];
  local.setPeerSink((update) => updates.push(update));
  await wait(130);
  assert.equal(updates.length, 1);
  assert.equal(updates[0].strokes.length, 80);

  const [a, b] = MemoryLink.pair();
  sendStrokes(a, updates[0]);
  const messages = a.sent.map((raw) => parsePeerMessage(raw));
  assert.ok(messages.length > 1, "split into several messages");
  assert.ok(a.sent.every((raw) => raw.length < 64 * 1024));
  assert.ok(messages.every((message) => message?.t === "strokes"));
  const viewer = new PictionaryDrawingBridge(fakeDrawingController("r1") as any, fakeArcade);
  viewer.setPeerSink(() => {});
  for (const message of messages) if (message?.t === "strokes") viewer.receivePeerStrokes(message);
  assert.equal(viewer.peerSnapshot().strokes.length, 80);
  b.close(); local.dispose(); viewer.dispose();
});
