import type { ArcadeChannel, ArcadeConnectionState, ArcadeMessageListener, ArcadeStateListener } from "../runtime/arcade-client";
import type { ArcadeClientMessage, ArcadeServerMessage, EventMessage, JsonValue } from "../runtime/protocol";
import { WorldStore, type CartridgeSnapshot } from "../runtime/world-store";
import type { BuiltInGame } from "../services/games";
import { GUEST_COMMANDS, PEER_PROTOCOL_VERSION, parsePeerMessage, topLevelPatch, type GameCommand, type PeerMessage } from "./protocol";
import type { PeerLink } from "./transport";

export const REMOTE_LEASE_MS = 120_000;
const LEASE_RENEW_MS = 30_000;
const PING_MS = 5_000;
const PEER_SILENCE_MS = 20_000;
const HOST_ACK_TIMEOUT_MS = 20_000;
/** An expired turn clock waits this long for a guest command that is already in flight. */
const CLOCK_GRACE_MS = 3_000;
/** Stroke deltas are split so no single peer message nears the transport limit. */
const STROKE_CHUNK_CHARS = 48 * 1024;

export type MultiplayerTranslate = (key: string, values?: Readonly<Record<string, string | number>>) => string;

/** `version`: the peers run incompatible builds. */
export type SessionEndReason = "closed" | "silent" | "failed" | "version";

function send(link: PeerLink, message: PeerMessage): boolean {
  try { link.send(JSON.stringify(message)); return true; }
  catch (error) {
    // A closed link is reported by its state change; anything else (size) would silently desync.
    if (link.state === "open") console.warn("[multiplayer] peer message dropped", message.t, error);
    return false;
  }
}

/** Keeps the link alive and notices a silent peer (a closed laptop never sends `close`). */
function heartbeat(link: PeerLink, onSilent: () => void, onRtt: (ms: number) => void) {
  let lastSeen = Date.now();
  const timer = setInterval(() => {
    if (link.state !== "open") return;
    if (Date.now() - lastSeen > PEER_SILENCE_MS) { clearInterval(timer); onSilent(); return; }
    send(link, { t: "ping", at: Date.now() });
  }, PING_MS);
  const stop = () => clearInterval(timer);
  const unsubscribe = link.onState((state) => { if (state === "closed" || state === "failed") stop(); });
  return {
    /** Consumes heartbeat traffic; `false` for every other message. */
    handle(message: PeerMessage): boolean {
      lastSeen = Date.now();
      if (message.t === "ping") { send(link, { t: "pong", at: message.at }); return true; }
      if (message.t === "pong") { onRtt(Math.max(0, Date.now() - message.at)); return true; }
      return false;
    },
    stop() { stop(); unsubscribe(); },
  };
}

/** A change to one canvas: drop everything from index `from`, then append `strokes`. */
export interface StrokeUpdate {
  roundId: string;
  from: number;
  strokes: readonly JsonValue[];
}

export interface StrokeRelay {
  /** Local strokes of the current round, to mirror on the peer canvas. */
  setPeerSink(sink: ((update: StrokeUpdate) => void) | null): void;
  receivePeerStrokes(update: StrokeUpdate): void;
}

/** Sends a stroke delta, chunked; every chunk is itself a valid delta, applied in order. */
export function sendStrokes(link: PeerLink, update: StrokeUpdate) {
  let from = update.from, chunk: JsonValue[] = [], size = 0;
  for (const stroke of update.strokes) {
    const length = JSON.stringify(stroke).length;
    if (chunk.length && size + length > STROKE_CHUNK_CHARS) {
      send(link, { t: "strokes", roundId: update.roundId, from, strokes: chunk });
      from += chunk.length; chunk = []; size = 0;
    }
    chunk.push(stroke); size += length;
  }
  send(link, { t: "strokes", roundId: update.roundId, from, strokes: chunk });
}

export interface BridgeEvents {
  onRtt(ms: number): void;
  onEnd(reason: SessionEndReason): void;
  /** The other side introduced itself. */
  onPeerName?(name: string | undefined): void;
  /** Local epoch-ms deadline of the guest's turn, or `null` when no clock runs. */
  onClock?(deadline: number | null, agentTurn: boolean): void;
}

/**
 * Lease (or release) the agent seat for a remote human; returns the event request id.
 * `view: false` (renewals) skips the agent-perspective snapshot in the reply.
 */
export function leaseSeat(arcade: ArcadeChannel, game: BuiltInGame, enabled: boolean, view = true): string | null {
  if (arcade.connectionState !== "open") return null;
  try {
    return arcade.sendEvent("multiplayer.remote_opponent", {
      cartridgeId: game, enabled, leaseMs: REMOTE_LEASE_MS, ...(enabled && !view ? { view: false } : {}),
    }, { cartridgeId: game });
  } catch { return null; }
}

export interface HostBridgeOptions {
  /** Display name sent to the guest. */
  name?: string;
  /** Idle time on the guest's turn before Nori plays one move for it; 0 disables. */
  turnTimeoutMs?: number;
}

/**
 * Host side: relays the guest's commands into the host world as actor
 * `"agent"`, and forwards the backend's agent-perspective views. The guest
 * never reaches the backend, so the host world stays the single authority.
 */
export class HostBridge {
  private cleanup: Array<() => void> = [];
  private pending = new Map<string, { guestId: string; timer: ReturnType<typeof setTimeout> }>();
  private leaseRequest: string | null = null;
  private renewTimer: ReturnType<typeof setInterval> | null = null;
  private closed = false;
  private agentTurn = false;
  private deadline: number | null = null;
  private clockTimer: ReturnType<typeof setTimeout> | null = null;
  /** Latest host head seen for this game; a stale `agent_step` is refused by the backend. */
  private headVersion = -1;

  constructor(
    readonly game: BuiltInGame,
    private readonly link: PeerLink,
    private readonly arcade: ArcadeChannel,
    private readonly room: string,
    private readonly translate: MultiplayerTranslate,
    private readonly events: BridgeEvents,
    private readonly strokes?: StrokeRelay,
    private readonly options: HostBridgeOptions = {},
  ) {
    const beat = heartbeat(link, () => this.end("silent"), events.onRtt);
    this.cleanup.push(() => beat.stop());
    this.cleanup.push(link.onMessage((raw) => {
      const message = parsePeerMessage(raw);
      if (!message || beat.handle(message)) return;
      this.onPeer(message);
    }));
    this.cleanup.push(link.onState((state) => {
      // Only a goodbye is a clean leave; a vanished channel keeps the seat for a re-invite.
      if (state === "closed" || state === "failed") this.end("failed");
    }));
    this.cleanup.push(arcade.onMessage((message) => this.onArcade(message)));
    this.cleanup.push(arcade.onState((state) => {
      if (state === "open") return;
      for (const [hostId, entry] of this.pending) this.fail(hostId, entry.guestId, this.translate("multiplayer.error.hostOffline"));
    }));
    if (strokes) {
      strokes.setPeerSink((update) => sendStrokes(this.link, update));
      this.cleanup.push(() => strokes.setPeerSink(null));
    }
    send(link, { t: "hello", v: PEER_PROTOCOL_VERSION, game, role: "host", room, ...(options.name ? { name: options.name } : {}) });
    this.lease(true);
    // Renewals only extend the lease: commits already reach the guest as transitions, and a
    // fresh view would remount the guest's game (aborting animations) for no change.
    this.renewTimer = setInterval(() => leaseSeat(this.arcade, this.game, true, false), LEASE_RENEW_MS);
  }

  /** Leases the seat and forwards the reply's snapshot to the guest. */
  private lease(enabled: boolean) {
    // A lost reconnect is fine: world_joined re-leases.
    const requestId = leaseSeat(this.arcade, this.game, enabled);
    if (enabled && requestId) this.leaseRequest = requestId;
  }

  /**
   * AFK protection for the host: the guest's turn runs on a clock that restarts
   * whenever the guest acts. On expiry Nori plays exactly one move for the seat.
   */
  private updateClock(agentTurn: boolean, guestActed: boolean) {
    const timeout = this.options.turnTimeoutMs ?? 0;
    const restart = agentTurn && (!this.agentTurn || guestActed || this.deadline === null);
    this.agentTurn = agentTurn;
    if (!timeout || !agentTurn) this.setDeadline(null);
    else if (restart) this.setDeadline(Date.now() + timeout);
  }

  private setDeadline(deadline: number | null) {
    if (this.clockTimer) clearTimeout(this.clockTimer);
    this.clockTimer = null;
    this.deadline = deadline;
    if (deadline !== null) {
      this.clockTimer = setTimeout(() => {
        this.clockTimer = null;
        // The guest moved just in time: its command is on the way, so give it a moment.
        if (this.pending.size) { this.setDeadline(Date.now() + CLOCK_GRACE_MS); return; }
        this.deadline = null;
        if (this.arcade.connectionState === "open") {
          const payload = { cartridgeId: this.game, ...(this.headVersion >= 0 ? { expectedHeadVersion: this.headVersion } : {}) };
          try { this.arcade.sendEvent("multiplayer.agent_step", payload, { cartridgeId: this.game }); }
          catch { /* The next transition restarts the clock. */ }
        }
        this.publishClock();
      }, Math.max(0, deadline - Date.now()));
    }
    this.publishClock();
  }

  private publishClock() {
    send(this.link, { t: "clock", remainingMs: this.deadline === null ? null : Math.max(0, this.deadline - Date.now()) });
    this.events.onClock?.(this.deadline, this.agentTurn);
  }

  private onArcade(message: ArcadeServerMessage) {
    const raw = message as Record<string, unknown>;
    if (raw.type === "world_joined" || raw.type === "world_created" ||
      (raw.cartridgeId === this.game && (raw.type === "cartridge_mounted" || raw.type === "cartridge_mounted_ack"))) {
      this.lease(true);
      return;
    }
    if (raw.type === "cartridge_unmounted" && raw.cartridgeId === this.game) {
      this.headVersion = -1;
      send(this.link, { t: "view", runtime: null });
      return;
    }
    if (raw.type === "event") {
      const payload = raw.payload as Record<string, JsonValue> | undefined;
      if (raw.channel === "multiplayer.remote_opponent.result" && raw.requestId === this.leaseRequest) {
        this.leaseRequest = null;
        if (payload?.ok === true) {
          const runtime = (payload.runtime ?? null) as CartridgeSnapshot | null;
          // Assigned, not maxed: a host world reset restarts the versions.
          this.headVersion = runtime ? runtime.headVersion : -1;
          send(this.link, { t: "view", runtime });
          this.updateClock(payload.agentTurn === true, false);
        }
        return;
      }
      if (raw.channel === "multiplayer.remote_view" && payload?.cartridgeId === this.game) {
        const transition = (payload.transition ?? {}) as Record<string, JsonValue>;
        const version = Number(payload.version);
        if (Number.isFinite(version)) this.headVersion = Math.max(this.headVersion, version);
        send(this.link, {
          t: "transition",
          version,
          runtime: payload.runtime as unknown as CartridgeSnapshot,
          transition,
        });
        // Agent-perspective transition: actor "player" is the guest.
        this.updateClock(payload.agentTurn === true, transition.actor === "player");
      }
      return;
    }
    if (raw.type === "dispatch_ack" && typeof raw.requestId === "string") {
      const entry = this.pending.get(raw.requestId);
      if (!entry) return;
      clearTimeout(entry.timer);
      this.pending.delete(raw.requestId);
      if (typeof raw.headVersion === "number") this.headVersion = Math.max(this.headVersion, raw.headVersion);
      // Never forward `runtimes`: a version-mismatch resync carries the host's private view.
      send(this.link, {
        t: "ack", requestId: entry.guestId, success: raw.success === true,
        headVersion: Number(raw.headVersion ?? 0),
        ...(typeof raw.error === "string" ? { error: raw.error } : {}),
        ...(typeof raw.errorCode === "string" ? { errorCode: raw.errorCode } : {}),
      });
      if (raw.errorCode === "version_mismatch") this.lease(true);
    }
  }

  private onPeer(message: PeerMessage) {
    if (message.t === "bye") { this.end("closed"); return; }
    if (message.t === "hello") {
      if (message.v !== PEER_PROTOCOL_VERSION || message.role !== "guest" || message.game !== this.game) {
        // An incompatible build: hand the seat back instead of holding it for a re-invite.
        send(this.link, { t: "bye" });
        this.end("version");
        this.link.close();
        return;
      }
      this.events.onPeerName?.(message.name);
      return;
    }
    if (message.t === "strokes") {
      if (this.game === "pictionary") this.strokes?.receivePeerStrokes(message);
      return;
    }
    if (message.t !== "dispatch") return;
    const { requestId, cmd, expectedHeadVersion } = message;
    if (!GUEST_COMMANDS[this.game].has(cmd.type)) {
      send(this.link, { t: "ack", requestId, success: false, headVersion: expectedHeadVersion, error: this.translate("multiplayer.error.hostOnly"), errorCode: "command_rejected" });
      return;
    }
    // Strokes travel peer to peer; the reducer accepts them from the player seat only.
    if (cmd.type === "submitStrokeBatch") {
      send(this.link, { t: "ack", requestId, success: true, headVersion: expectedHeadVersion });
      return;
    }
    if (this.arcade.connectionState !== "open") {
      send(this.link, { t: "ack", requestId, success: false, headVersion: expectedHeadVersion, error: this.translate("multiplayer.error.hostOffline"), errorCode: "dispatch_error" });
      return;
    }
    try {
      const hostId = this.arcade.dispatch(this.game, expectedHeadVersion, sanitize(cmd), "agent");
      this.pending.set(hostId, {
        guestId: requestId,
        timer: setTimeout(() => this.fail(hostId, requestId, this.translate("multiplayer.error.timeout")), HOST_ACK_TIMEOUT_MS),
      });
    } catch (error) {
      send(this.link, { t: "ack", requestId, success: false, headVersion: expectedHeadVersion, error: error instanceof Error ? error.message : String(error), errorCode: "dispatch_error" });
    }
  }

  private fail(hostId: string, guestId: string, error: string) {
    const entry = this.pending.get(hostId);
    if (entry) clearTimeout(entry.timer);
    this.pending.delete(hostId);
    send(this.link, { t: "ack", requestId: guestId, success: false, headVersion: 0, error, errorCode: "dispatch_error" });
  }

  private end(reason: SessionEndReason) {
    if (this.closed) return;
    this.closed = true;
    if (this.renewTimer) clearInterval(this.renewTimer);
    if (this.clockTimer) clearTimeout(this.clockTimer);
    this.clockTimer = null;
    for (const entry of this.pending.values()) clearTimeout(entry.timer);
    this.pending.clear();
    // A clean goodbye hands the seat back to Nori. A lost link keeps the lease so the
    // host can re-invite; the manager holds it for a grace period, then releases it.
    if (reason === "closed" || reason === "version") this.lease(false);
    this.cleanup.splice(0).forEach((fn) => fn());
    this.events.onEnd(reason);
  }

  close() {
    if (this.closed) return;
    send(this.link, { t: "bye" });
    this.end("closed");
    this.link.close();
  }

  get roomId() { return this.room; }
}

/** Only a plain JSON command object of bounded depth reaches the host world. */
function sanitize(cmd: GameCommand): GameCommand {
  return JSON.parse(JSON.stringify(cmd)) as GameCommand;
}

/**
 * Guest side: an `ArcadeChannel` over the peer link. It feeds the host's
 * agent-perspective snapshots into a private `WorldStore`, so the normal game
 * controllers and screens run unchanged and believe they are the player.
 */
export class GuestArcade implements ArcadeChannel {
  readonly world = new WorldStore();
  private state: ArcadeConnectionState = "connecting";
  private readonly messageListeners = new Set<ArcadeMessageListener>();
  private readonly stateListeners = new Set<ArcadeStateListener>();
  private readonly pending = new Set<string>();
  private readonly worldId: string;
  private joined = false;
  /** Last host version applied here; acks may advertise a head the view has not reached. */
  private applied = -1;
  private cleanup: Array<() => void> = [];
  private closed = false;
  private strokes: StrokeRelay | null = null;
  /** A mount asked for before the host had the cartridge; acknowledged by the next view. */
  private pendingMount: string | null = null;

  constructor(
    readonly game: BuiltInGame,
    private readonly link: PeerLink,
    room: string,
    private readonly translate: MultiplayerTranslate,
    private readonly events: BridgeEvents,
    name?: string,
  ) {
    this.worldId = `multiplayer-${room}`;
    const beat = heartbeat(link, () => this.end("silent"), events.onRtt);
    this.cleanup.push(() => beat.stop());
    this.cleanup.push(link.onMessage((raw) => {
      const message = parsePeerMessage(raw);
      if (!message || beat.handle(message)) return;
      this.onPeer(message);
    }));
    this.cleanup.push(link.onState((state) => {
      if (state === "closed" || state === "failed") this.end(state === "failed" ? "failed" : "closed");
    }));
    send(link, { t: "hello", v: PEER_PROTOCOL_VERSION, game, role: "guest", room, ...(name ? { name } : {}) });
  }

  get connectionState() { return this.state; }

  attachStrokes(relay: StrokeRelay | null) {
    this.strokes?.setPeerSink(null);
    this.strokes = relay;
    relay?.setPeerSink((update) => sendStrokes(this.link, update));
  }

  onMessage(listener: ArcadeMessageListener) {
    this.messageListeners.add(listener);
    return () => { this.messageListeners.delete(listener); };
  }

  onState(listener: ArcadeStateListener) {
    this.stateListeners.add(listener);
    listener(this.state);
    return () => { this.stateListeners.delete(listener); };
  }

  send(message: ArcadeClientMessage) {
    if (this.closed) throw new Error(this.translate("multiplayer.error.disconnected"));
    // Mounting is owned by the host; fences are local presentation bookkeeping.
    if (message.type === "advance_visibility_fence") {
      const runtime = this.world.runtime(message.cartridgeId);
      this.deliver({
        type: "visibility_fence_advanced_ack", worldId: this.worldId, cartridgeId: message.cartridgeId,
        visibilityFenceId: message.visibilityFenceId, requestId: message.requestId,
        visibleVersion: Math.min(message.version, runtime?.headVersion ?? message.version),
        headVersion: runtime?.headVersion ?? message.version,
      });
    } else if (message.type === "mount_cartridge" && message.cartridgeId === this.game) {
      const runtime = this.world.runtime(message.cartridgeId);
      // The host has not opened the game yet: answer once its view arrives instead of
      // letting the controller time out.
      if (!runtime) { this.pendingMount = message.requestId; return; }
      this.deliver({
        type: "cartridge_mounted_ack", worldId: this.worldId, cartridgeId: message.cartridgeId, requestId: message.requestId,
        runtimes: [{ visibilityFenceId: runtime.visibilityFenceId, headVersion: runtime.headVersion, visibleVersion: runtime.visibleVersion, state: runtime.state }],
      });
    }
  }

  sendEvent(_channel: string, _payload: JsonValue = {}, extra: Partial<EventMessage> = {}): string {
    // Drawing revisions/snapshots feed Nori's vision on the host; there is no Nori seat here.
    return typeof extra.requestId === "string" ? extra.requestId : `event-${crypto.randomUUID()}`;
  }

  dispatch(cartridgeId: string, expectedHeadVersion: number, cmd: GameCommand): string {
    if (this.state !== "open") throw new Error(this.translate("multiplayer.error.disconnected"));
    if (cartridgeId !== this.game) throw new Error(this.translate("multiplayer.error.hostOnly"));
    const requestId = `dispatch-${crypto.randomUUID()}`;
    // Answer asynchronously, like a real ack, so the controller sees its request id first.
    const answer = (success: boolean) => queueMicrotask(() => this.deliver({
      type: "dispatch_ack", worldId: this.worldId, cartridgeId, requestId, success, headVersion: expectedHeadVersion,
      ...(success ? {} : { error: this.translate("multiplayer.error.hostOnly"), errorCode: "command_rejected" }),
    }));
    if (!GUEST_COMMANDS[this.game].has(cmd.type)) { answer(false); return requestId; }
    // Strokes reach the host canvas as peer deltas; the host would only ack the batch, and
    // the round trip would block the guest's next action (one request at a time).
    if (cmd.type === "submitStrokeBatch") { answer(true); return requestId; }
    this.pending.add(requestId);
    send(this.link, { t: "dispatch", requestId, expectedHeadVersion, cmd });
    return requestId;
  }

  private onPeer(message: PeerMessage) {
    switch (message.t) {
      case "bye": this.end("closed"); return;
      case "hello":
        if (message.v !== PEER_PROTOCOL_VERSION) { send(this.link, { t: "bye" }); this.end("version"); this.link.close(); return; }
        if (message.role !== "host" || message.game !== this.game) { this.end("failed"); this.link.close(); return; }
        this.events.onPeerName?.(message.name);
        return;
      case "clock":
        this.events.onClock?.(message.remainingMs === null ? null : Date.now() + message.remainingMs, message.remainingMs !== null);
        return;
      case "view": this.applyView(message.runtime); return;
      case "transition": this.applyTransition(message.version, message.runtime, message.transition); return;
      case "strokes": if (this.game === "pictionary") this.strokes?.receivePeerStrokes(message); return;
      case "ack":
        if (!this.pending.delete(message.requestId)) return;
        this.deliver({
          type: "dispatch_ack", worldId: this.worldId, cartridgeId: this.game, requestId: message.requestId,
          success: message.success, headVersion: message.headVersion,
          ...(message.error ? { error: message.error } : {}),
          ...(message.errorCode ? { errorCode: message.errorCode } : {}),
        });
        return;
      default: return;
    }
  }

  private applyView(runtime: CartridgeSnapshot | null) {
    const settled = { ...runtime, visibleVersion: runtime?.headVersion ?? 0 } as CartridgeSnapshot;
    const current = this.joined ? this.world.runtime(this.game) : undefined;
    // Same version, same state: a remount would only abort the guest's animations.
    if (runtime && current && runtime.headVersion === this.applied) { this.ackPendingMount(); return; }
    const regressed = !!runtime && !!current && runtime.headVersion < this.applied;
    this.applied = runtime?.headVersion ?? -1;
    if (!this.joined) {
      this.joined = true;
      this.deliver({
        type: "world_joined",
        world: { worldId: this.worldId, mountedCartridges: runtime ? [{ cartridgeId: this.game, runtimes: [settled] }] : [] },
        session: { isAdmin: false },
      } as unknown as ArcadeServerMessage);
      this.setState("open");
      return;
    }
    // A lower version means the host reset its world: the store would ignore it as stale.
    if (!runtime || regressed) this.deliver({ type: "cartridge_unmounted", worldId: this.worldId, cartridgeId: this.game });
    if (!runtime) return;
    const mount = this.pendingMount;
    this.pendingMount = null;
    this.deliver({
      type: mount ? "cartridge_mounted_ack" : "cartridge_mounted", worldId: this.worldId, cartridgeId: this.game,
      ...(mount ? { requestId: mount } : {}), runtimes: [settled],
    } as unknown as ArcadeServerMessage);
  }

  private ackPendingMount() {
    const runtime = this.world.runtime(this.game);
    if (!this.pendingMount || !runtime) return;
    const requestId = this.pendingMount;
    this.pendingMount = null;
    this.deliver({
      type: "cartridge_mounted_ack", worldId: this.worldId, cartridgeId: this.game, requestId,
      runtimes: [{ visibilityFenceId: runtime.visibilityFenceId, headVersion: runtime.headVersion, visibleVersion: runtime.visibleVersion, state: runtime.state }],
    });
  }

  private applyTransition(version: number, runtime: CartridgeSnapshot, transition: Record<string, JsonValue>) {
    const current = this.world.runtime(this.game);
    if (!this.joined || !current) { this.applyView(runtime); return; }
    if (version <= this.applied) return;
    this.applied = version;
    this.deliver({
      type: "runtime_transition", worldId: this.worldId, cartridgeId: this.game, version,
      transition: { ...transition, patches: topLevelPatch(current.state, runtime.state) as unknown as JsonValue },
    });
    this.deliver({
      type: "visibility_fence_advanced", worldId: this.worldId, cartridgeId: this.game,
      visibilityFenceId: runtime.visibilityFenceId, visibleVersion: version, headVersion: version,
    });
  }

  private deliver(message: ArcadeServerMessage) {
    this.world.consume(message);
    for (const listener of [...this.messageListeners]) listener(message);
  }

  private setState(state: ArcadeConnectionState) {
    if (this.state === state) return;
    this.state = state;
    for (const listener of [...this.stateListeners]) listener(state);
  }

  private end(reason: SessionEndReason) {
    if (this.closed) return;
    this.closed = true;
    this.pending.clear();
    this.pendingMount = null;
    this.strokes?.setPeerSink(null);
    this.cleanup.splice(0).forEach((fn) => fn());
    this.setState("closed");
    this.events.onEnd(reason);
  }

  close() {
    if (this.closed) return;
    send(this.link, { t: "bye" });
    this.end("closed");
    this.link.close();
  }
}
