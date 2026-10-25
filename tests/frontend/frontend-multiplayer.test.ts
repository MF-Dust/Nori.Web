import test from "node:test";
import assert from "node:assert/strict";
import { GameCartridgeController } from "../../frontend-src/apps/game-cartridge-controller";
import { chessStateSchema } from "../../frontend-src/apps/chess-schema";
import { GameService } from "../../frontend-src/services/games";
import { GuestArcade, HostBridge } from "../../frontend-src/multiplayer/session";
import { GUEST_COMMANDS, hostCommandBlocked, parsePeerMessage, topLevelPatch } from "../../frontend-src/multiplayer/protocol";
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
