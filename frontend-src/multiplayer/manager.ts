import type { ArcadeChannel } from "../runtime/arcade-client";
import type { WorldStore } from "../runtime/world-store";
import type { JsonValue } from "../runtime/protocol";
import { GameService, type BuiltInGame } from "../services/games";
import { multiplayerSettings, useMultiplayerSettings, type MultiplayerSettingsValues } from "../state/multiplayer-settings-store";
import { easyTierAvailable, EasyTierLink } from "./easytier-transport";
import { hostCommandBlocked, MULTIPLAYER_GAMES } from "./protocol";
import { GuestArcade, HostBridge, leaseSeat, type MultiplayerTranslate, type StrokeRelay } from "./session";
import { decodeSignal, encodeSignal, type PeerLink, type PeerRoute } from "./transport";
import { WebRtcLink, webRtcConfig, type SignalEnvelope } from "./webrtc-transport";

export type MultiplayerRole = "host" | "guest";
export type MultiplayerPhase =
  | "idle"
  /** Host: invite code ready, waiting for the guest's reply code. */
  | "inviting"
  /** Guest: reply code ready, waiting for the host to apply it. */
  | "replying"
  | "connecting"
  | "connected"
  /** Host: the guest vanished; its seat stays reserved for a re-invite until `graceUntil`. */
  | "peerLost"
  | "ended"
  | "error";

/** How long a vanished guest's seat is held before Nori takes over. */
export const SEAT_GRACE_MS = 90_000;
const HOLD_RENEW_MS = 30_000;

export interface MultiplayerSessionSnapshot {
  game: BuiltInGame;
  role: MultiplayerRole | null;
  phase: MultiplayerPhase;
  transport: "webrtc" | "easytier" | null;
  route: PeerRoute;
  inviteCode: string | null;
  replyCode: string | null;
  rttMs: number | null;
  error: string | null;
  /** The other player's nickname, when it sent one. */
  peerName: string | null;
  /** Epoch-ms deadline of the guest's turn clock, when one runs. */
  turnDeadline: number | null;
  /** The guest seat has a move to make. */
  guestTurn: boolean;
  /** Host, phase `peerLost`: when the held seat returns to Nori. */
  graceUntil: number | null;
  /** Bumps whenever the guest controllers are created or dropped; screens remount on it. */
  epoch: number;
}

interface InviteMeta {
  game: BuiltInGame;
  room: string;
}

interface EasyTierInvite {
  v: 1;
  kind: "easytier";
  meta: InviteMeta;
  networkName: string;
  networkSecret: string;
  peers: string;
}

/** Guest-side controllers built on the mirrored world; `dispose` releases them. */
export interface GuestControllers {
  controller: unknown;
  drawing?: StrokeRelay & { dispose(): void };
  dispose(): void;
}

export type GuestControllerFactory = (game: BuiltInGame, deps: { games: GameService; world: WorldStore; arcade: ArcadeChannel }) => GuestControllers;

export interface MultiplayerManagerOptions {
  arcade: ArcadeChannel;
  games: GameService;
  translate: MultiplayerTranslate;
  createGuestControllers: GuestControllerFactory;
  /** The host's own Pictionary drawing bridge (peer strokes are mirrored on it). */
  hostStrokes?: () => StrokeRelay;
  /** The host world, for forfeiting on behalf of a vanished guest. */
  world?: WorldStore;
  settings?: () => MultiplayerSettingsValues;
}

/** Forfeit commands the host may submit for the guest seat (competitive games only). */
const FORFEIT: Partial<Record<BuiltInGame, { type: string; [key: string]: JsonValue }>> = {
  chess: { type: "resign" },
  cakeduel: { type: "play", action: { type: "concede" } },
};

interface SessionRecord {
  snapshot: MultiplayerSessionSnapshot;
  link: PeerLink | null;
  webrtc: WebRtcLink | null;
  host: HostBridge | null;
  guest: GuestArcade | null;
  controllers: GuestControllers | null;
  token: number;
}

function blank(game: BuiltInGame, epoch = 0): MultiplayerSessionSnapshot {
  return {
    game, role: null, phase: "idle", transport: null, route: "unknown", inviteCode: null, replyCode: null, rttMs: null, error: null,
    peerName: null, turnDeadline: null, guestTurn: false, graceUntil: null, epoch,
  };
}

function roomId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(9));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

/** One peer session per game window; owns transports, bridges and guest controllers. */
export class MultiplayerManager {
  private readonly sessions = new Map<BuiltInGame, SessionRecord>();
  private readonly listeners = new Set<() => void>();
  private readonly settings: () => MultiplayerSettingsValues;
  private tokens = 0;
  private releaseSettings: () => void;
  private readonly holds = new Map<BuiltInGame, { until: number; renew: ReturnType<typeof setInterval>; expire: ReturnType<typeof setTimeout> }>();

  constructor(private readonly options: MultiplayerManagerOptions) {
    this.settings = options.settings ?? multiplayerSettings;
    for (const game of MULTIPLAYER_GAMES) this.sessions.set(game, this.record(game));
    options.games.setCommandGuard((game, cmd) =>
      this.sessions.get(game)?.snapshot.role === "host" && this.isLive(game) && hostCommandBlocked(game, cmd)
        ? options.translate("multiplayer.error.notInMultiplayer") : null);
    // Turning multiplayer off in Settings ends every session and hands seats back to Nori.
    this.releaseSettings = options.settings ? () => {} : useMultiplayerSettings.subscribe((state, previous) => {
      if (previous.enabled && !state.enabled) for (const game of MULTIPLAYER_GAMES) if (this.sessions.get(game)?.snapshot.role) this.leave(game);
    });
  }

  get enabled() { return this.settings().enabled; }

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  };

  snapshot = (game: BuiltInGame): MultiplayerSessionSnapshot => this.sessions.get(game)!.snapshot;

  /** The mirrored controller while this browser is a guest for `game`. */
  guestController<T>(game: BuiltInGame): T | null {
    return (this.sessions.get(game)?.controllers?.controller as T | undefined) ?? null;
  }

  guestDrawing<T>(game: BuiltInGame): T | null {
    return (this.sessions.get(game)?.controllers?.drawing as T | undefined) ?? null;
  }

  isLive(game: BuiltInGame): boolean {
    const phase = this.sessions.get(game)?.snapshot.phase;
    return phase === "connected" || phase === "connecting" || phase === "inviting" || phase === "replying" || phase === "peerLost" || this.holds.has(game);
  }

  /** Replaces "Nori" in labels while another person holds (or is reserved) the seat. */
  opponentName(game: BuiltInGame): string | null {
    const session = this.sessions.get(game)?.snapshot;
    if (!session || (session.phase !== "connected" && session.phase !== "peerLost")) return null;
    return session.peerName ?? this.options.translate("multiplayer.opponent");
  }

  /** Host: may the guest seat be forfeited now (chess any time, Cake Duel on its turn)? */
  canForfeit(game: BuiltInGame): boolean {
    const session = this.sessions.get(game)?.snapshot;
    if (!session || session.role !== "host" || !FORFEIT[game] || !this.options.world) return false;
    if (session.phase !== "peerLost" && session.phase !== "connected" && !this.holds.has(game)) return false;
    return game === "chess" ? this.options.world.runtime(game)?.state.gameState != null : session.guestTurn;
  }

  /** Host: record a loss for the guest seat, then hand the seat back. */
  forfeit(game: BuiltInGame) {
    const cmd = FORFEIT[game], runtime = this.options.world?.runtime(game);
    if (!cmd || !runtime || !this.canForfeit(game)) return;
    try { this.options.arcade.dispatch(game, runtime.headVersion, cmd, "agent"); } catch { /* Connection lost. */ }
    this.leave(game);
  }

  /** Host: create an invite code for `game`. */
  async host(game: BuiltInGame): Promise<void> {
    const settings = this.settings();
    if (!settings.enabled) throw new Error(this.options.translate("multiplayer.error.disabled"));
    const record = this.reset(game);
    const token = record.token;
    const meta: InviteMeta = { game, room: roomId() };
    this.patch(game, { role: "host", phase: "connecting", transport: settings.transport, graceUntil: this.holds.get(game)?.until ?? null });
    try {
      if (settings.transport === "easytier") {
        if (!easyTierAvailable(settings.easyTier, settings.easyTierExperimental)) throw new Error(this.options.translate("multiplayer.error.easyTierUnavailable"));
        const invite: EasyTierInvite = { v: 1, kind: "easytier", meta, networkName: settings.easyTier.networkName, networkSecret: settings.easyTier.networkSecret, peers: settings.easyTier.peers };
        const code = await encodeSignal(invite);
        if (token !== record.token) return;
        this.attachLink(game, EasyTierLink.open(settings.easyTier, meta.room, "host"), "host", meta.room);
        this.patch(game, { phase: "inviting", inviteCode: code });
        return;
      }
      const config = webRtcConfig(settings);
      const { link, code } = await WebRtcLink.offer(config, meta);
      if (token !== record.token) { link.close(); return; }
      record.webrtc = link;
      this.attachLink(game, link, "host", meta.room);
      this.patch(game, { phase: "inviting", inviteCode: code });
    } catch (error) {
      if (token === record.token) this.fail(game, error);
    }
  }

  /** Host: apply the guest's reply code. */
  async acceptReply(game: BuiltInGame, code: string): Promise<void> {
    const record = this.sessions.get(game)!;
    if (record.snapshot.role !== "host" || !record.webrtc) throw new Error(this.options.translate("multiplayer.error.noInvite"));
    try {
      const answer = await WebRtcLink.decode<InviteMeta>(code);
      if (answer.meta?.game !== game) throw new Error(this.options.translate("multiplayer.error.wrongGame"));
      await record.webrtc.accept(answer);
      this.patch(game, { phase: "connecting" });
    } catch (error) { this.patch(game, { error: this.message(error) }); }
  }

  /** Guest: join with an invite code; WebRTC invites produce a reply code. */
  async join(game: BuiltInGame, code: string): Promise<void> {
    const settings = this.settings();
    if (!settings.enabled) throw new Error(this.options.translate("multiplayer.error.disabled"));
    const record = this.reset(game);
    const token = record.token;
    this.patch(game, { role: "guest", phase: "connecting" });
    try {
      const invite = await decodeSignal<SignalEnvelope<InviteMeta> | EasyTierInvite>(code);
      if (invite?.meta?.game !== game) throw new Error(this.options.translate("multiplayer.error.wrongGame"));
      if (invite.kind === "easytier") {
        if (!settings.easyTierExperimental || !settings.easyTier.moduleUrl.trim()) throw new Error(this.options.translate("multiplayer.error.easyTierUnavailable"));
        const link = EasyTierLink.open({ ...settings.easyTier, networkName: invite.networkName, networkSecret: invite.networkSecret, peers: invite.peers }, invite.meta.room, "guest");
        this.patch(game, { transport: "easytier" });
        this.attachLink(game, link, "guest", invite.meta.room);
        return;
      }
      const { link, code: reply } = await WebRtcLink.answer(webRtcConfig(settings), invite, invite.meta);
      if (token !== record.token) { link.close(); return; }
      record.webrtc = link;
      this.patch(game, { transport: "webrtc" });
      this.attachLink(game, link, "guest", invite.meta.room);
      if (link.state === "connecting") this.patch(game, { phase: "replying", replyCode: reply });
    } catch (error) {
      if (token === record.token) this.fail(game, error);
    }
  }

  /** Ends the session. A host also hands the seat (held or not) back to Nori. */
  leave(game: BuiltInGame) {
    const wasHost = this.sessions.get(game)?.snapshot.role === "host";
    this.reset(game);
    if (this.stopHold(game) || wasHost) leaseSeat(this.options.arcade, game, false);
    this.emit();
  }

  /** Keeps a vanished guest's seat leased so a re-invite resumes the same game. */
  private startHold(game: BuiltInGame) {
    this.stopHold(game);
    const until = Date.now() + SEAT_GRACE_MS;
    const renew = setInterval(() => leaseSeat(this.options.arcade, game, true), HOLD_RENEW_MS);
    const expire = setTimeout(() => {
      this.stopHold(game);
      leaseSeat(this.options.arcade, game, false);
      const record = this.sessions.get(game)!;
      if (record.snapshot.phase === "peerLost")
        this.patch(game, { phase: "ended", graceUntil: null, error: this.options.translate("multiplayer.error.noriTookOver") });
      else if (record.snapshot.phase === "inviting") this.patch(game, { graceUntil: null });
    }, SEAT_GRACE_MS);
    this.holds.set(game, { until, renew, expire });
    return until;
  }

  private stopHold(game: BuiltInGame): boolean {
    const hold = this.holds.get(game);
    if (!hold) return false;
    clearInterval(hold.renew);
    clearTimeout(hold.expire);
    this.holds.delete(game);
    return true;
  }

  dispose() {
    this.releaseSettings();
    for (const game of MULTIPLAYER_GAMES) this.stopHold(game);
    for (const game of MULTIPLAYER_GAMES) this.reset(game);
    this.options.games.setCommandGuard(null);
    this.listeners.clear();
  }

  private attachLink(game: BuiltInGame, link: PeerLink, role: MultiplayerRole, room: string) {
    const record = this.sessions.get(game)!;
    const token = record.token;
    record.link = link;
    const events = {
      onRtt: (rttMs: number) => { if (record.token === token) this.patch(game, { rttMs }); },
      onEnd: (reason: "closed" | "silent" | "failed") => {
        if (record.token !== token) return;
        this.dropGuest(record);
        const hosted = record.host !== null;
        record.host = null;
        // Keep `guestTurn`: forfeiting a Cake Duel needs to know whose turn was pending.
        const clock = { turnDeadline: null };
        if (hosted && reason !== "closed") {
          this.patch(game, { ...clock, phase: "peerLost", graceUntil: this.startHold(game), error: this.options.translate("multiplayer.error.peerLost") });
          return;
        }
        this.patch(game, {
          ...clock,
          phase: reason === "closed" ? "ended" : "error",
          error: reason === "closed" ? null : this.options.translate(
            role === "guest" ? "multiplayer.error.hostLost" : reason === "silent" ? "multiplayer.error.silent" : "multiplayer.error.failed"),
        });
      },
      onPeerName: (name: string | undefined) => { if (record.token === token) this.patch(game, { peerName: name ?? null }); },
      onClock: (turnDeadline: number | null, guestTurn: boolean) => { if (record.token === token) this.patch(game, { turnDeadline, guestTurn }); },
    };
    link.onState((state) => {
      if (record.token !== token) return;
      if (state === "open") {
        this.patch(game, { phase: "connected", route: link.route, inviteCode: null, replyCode: null, error: null });
      } else if (state === "failed" && !record.host && !record.guest) {
        this.patch(game, { phase: "error", error: this.options.translate("multiplayer.error.failed") });
      }
    });
    if (role === "host") {
      // The bridge waits for the link to open before it leases Nori's seat.
      const start = () => {
        if (record.token !== token || record.host) return;
        // The new bridge leases the seat itself; a held seat needs no further renewal.
        this.stopHold(game);
        const settings = this.settings();
        record.host = new HostBridge(game, link, this.options.arcade, room, this.options.translate, events,
          game === "pictionary" ? this.options.hostStrokes?.() : undefined,
          { name: settings.nickname.trim() || undefined, turnTimeoutMs: settings.turnTimeoutSec * 1000 });
      };
      if (link.state === "open") start();
      else link.onState((state) => { if (state === "open") start(); });
      return;
    }
    const guest = new GuestArcade(game, link, room, this.options.translate, events, this.settings().nickname.trim() || undefined);
    record.guest = guest;
    const controllers = this.options.createGuestControllers(game, {
      games: new GameService(guest, guest.world), world: guest.world, arcade: guest,
    });
    record.controllers = controllers;
    if (controllers.drawing) guest.attachStrokes(controllers.drawing);
    this.patch(game, { epoch: record.snapshot.epoch + 1 });
  }

  private dropGuest(record: SessionRecord) {
    if (!record.controllers && !record.guest) return;
    const controllers = record.controllers;
    record.controllers = null;
    record.guest?.attachStrokes(null);
    record.guest = null;
    record.snapshot = { ...record.snapshot, epoch: record.snapshot.epoch + 1 };
    // Screens remount on the epoch first, then the old controllers are released.
    queueMicrotask(() => controllers?.dispose());
  }

  private record(game: BuiltInGame, epoch = 0): SessionRecord {
    return { snapshot: blank(game, epoch), link: null, webrtc: null, host: null, guest: null, controllers: null, token: ++this.tokens };
  }

  private reset(game: BuiltInGame): SessionRecord {
    const old = this.sessions.get(game);
    if (old) {
      old.token = -1;
      old.host?.close();
      old.guest?.close();
      this.dropGuest(old);
      old.link?.close();
    }
    const next = this.record(game, old?.snapshot.epoch ?? 0);
    this.sessions.set(game, next);
    return next;
  }

  private fail(game: BuiltInGame, error: unknown) {
    const record = this.sessions.get(game)!;
    record.link?.close();
    this.dropGuest(record);
    this.patch(game, { phase: "error", error: this.message(error) });
  }

  private message(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }

  private patch(game: BuiltInGame, patch: Partial<MultiplayerSessionSnapshot>) {
    const record = this.sessions.get(game)!;
    record.snapshot = { ...record.snapshot, ...patch };
    this.emit();
  }

  private emit() {
    for (const listener of [...this.listeners]) listener();
  }
}
