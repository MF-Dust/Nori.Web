import type { ArcadeChannel } from "../runtime/arcade-client";
import type { WorldStore } from "../runtime/world-store";
import { GameService, type BuiltInGame } from "../services/games";
import { multiplayerSettings, useMultiplayerSettings, type MultiplayerSettingsValues } from "../state/multiplayer-settings-store";
import { easyTierAvailable, EasyTierLink } from "./easytier-transport";
import { hostCommandBlocked, MULTIPLAYER_GAMES } from "./protocol";
import { GuestArcade, HostBridge, type MultiplayerTranslate, type StrokeRelay } from "./session";
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
  | "ended"
  | "error";

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
  settings?: () => MultiplayerSettingsValues;
}

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
  return { game, role: null, phase: "idle", transport: null, route: "unknown", inviteCode: null, replyCode: null, rttMs: null, error: null, epoch };
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
    return phase === "connected" || phase === "connecting" || phase === "inviting" || phase === "replying";
  }

  /** Host: create an invite code for `game`. */
  async host(game: BuiltInGame): Promise<void> {
    const settings = this.settings();
    if (!settings.enabled) throw new Error(this.options.translate("multiplayer.error.disabled"));
    const record = this.reset(game);
    const token = record.token;
    const meta: InviteMeta = { game, room: roomId() };
    this.patch(game, { role: "host", phase: "connecting", transport: settings.transport });
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

  leave(game: BuiltInGame) {
    this.reset(game);
    this.emit();
  }

  dispose() {
    this.releaseSettings();
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
        record.host = null;
        this.patch(game, {
          phase: reason === "closed" ? "ended" : "error",
          error: reason === "closed" ? null : this.options.translate(reason === "silent" ? "multiplayer.error.silent" : "multiplayer.error.failed"),
        });
      },
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
        record.host = new HostBridge(game, link, this.options.arcade, room, this.options.translate, events,
          game === "pictionary" ? this.options.hostStrokes?.() : undefined);
      };
      if (link.state === "open") start();
      else link.onState((state) => { if (state === "open") start(); });
      return;
    }
    const guest = new GuestArcade(game, link, room, this.options.translate, events);
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
