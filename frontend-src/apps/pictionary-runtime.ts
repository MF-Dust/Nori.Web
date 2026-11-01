import type { ArcadeChannel } from "../runtime/arcade-client";
import type { JsonValue } from "../runtime/protocol";
import type { GameCartridgeController } from "./game-cartridge-controller";
import type { DrawingStroke, PictionaryState } from "./pictionary-model";
import { MAX_PEER_STROKES } from "../multiplayer/protocol";
import type { StrokeUpdate } from "../multiplayer/session";

export interface DrawingSnapshot { revision: number; image: string; width: number; height: number }
/** The other human's canvas in a multiplayer round; `null` strokes = nothing drawn yet. */
export interface PeerDrawing { active: boolean; roundId: string | null; strokes: readonly DrawingStroke[] }
type PeerSink = (update: StrokeUpdate) => void;

const PEER_SEND_INTERVAL_MS = 100;

/** 1/10000 of the canvas is far below a pixel; it cuts each point from ~40 to ~20 bytes. */
function quantize(stroke: DrawingStroke): JsonValue {
  const round = (value: number) => Math.round(value * 10_000) / 10_000;
  return { ...stroke, points: stroke.points.map(point => ({ x: round(point.x), y: round(point.y) })) } as unknown as JsonValue;
}

function peerStroke(value: unknown): DrawingStroke | null {
  if (!value || typeof value !== "object") return null;
  const stroke = value as Partial<DrawingStroke>;
  if (!Array.isArray(stroke.points) || stroke.points.length > 512) return null;
  const points = stroke.points.filter(point => point && Number.isFinite(point.x) && Number.isFinite(point.y))
    .map(point => ({ x: Math.min(1, Math.max(0, point.x)), y: Math.min(1, Math.max(0, point.y)) }));
  if (!points.length) return null;
  const color = typeof stroke.color === "string" && /^#[0-9a-f]{3,8}$/i.test(stroke.color) ? stroke.color : "#000000";
  const width = Number.isFinite(stroke.width) ? Math.min(64, Math.max(0.5, Number(stroke.width))) : 3;
  return { ...stroke, points, color, width } as DrawingStroke;
}

/** Strokes are ephemeral: round/epoch fencing prevents a queued old drawing reaching a new round. */
export class PictionaryDrawingBridge {
  private queue: Array<{ roundId: string; epoch: number; batch: DrawingStroke[] }> = [];
  private draining = false;
  private epoch = 0;
  private roundId: string | null = null;
  private revision = 0;
  private capture: (() => DrawingSnapshot | null) | null = null;
  private disposed = false;
  private recognizedRevision = -1;
  private visionState = { status: "waiting" };
  private listeners = new Set<() => void>();
  private peerSink: PeerSink | null = null;
  private peer: PeerDrawing = { active: false, roundId: null, strokes: [] };
  /** Received strokes by sender index (`null` = rejected), so later deltas stay aligned. */
  private peerSlots: Array<DrawingStroke | null> = [];
  private peerListeners = new Set<() => void>();
  /** This canvas's strokes for the current round (also restores the canvas after a remount). */
  private local: { roundId: string; strokes: readonly DrawingStroke[] } | null = null;
  /** What the peer already has: deltas are computed against it by stroke identity. */
  private sent: { roundId: string | null; strokes: readonly DrawingStroke[] } = { roundId: null, strokes: [] };
  private outgoingTimer: ReturnType<typeof setTimeout> | null = null;
  subscribePeer = (listener: () => void) => { this.peerListeners.add(listener); return () => { this.peerListeners.delete(listener); }; };
  peerSnapshot = () => this.peer;
  private setPeer(peer: PeerDrawing) { this.peer = peer; this.peerListeners.forEach(listener => listener()); }
  /** Multiplayer: mirror local strokes to the other human instead of Nori's samples. */
  setPeerSink(sink: PeerSink | null) {
    this.peerSink = sink;
    if (this.outgoingTimer) clearTimeout(this.outgoingTimer);
    this.outgoingTimer = null;
    this.sent = { roundId: null, strokes: [] };
    this.peerSlots = [];
    this.setPeer({ active: sink !== null, roundId: null, strokes: [] });
    // A peer joining mid-round (a re-invite) gets the drawing so far, not just later strokes.
    if (sink && this.local?.strokes.length) this.scheduleSend();
  }
  receivePeerStrokes({ roundId, from, strokes }: StrokeUpdate) {
    if (!this.peerSink) return;
    // Kept even if this round has not started here yet: the round transition and the first
    // strokes may race, and a dropped delta could never be repaired.
    const base = this.peer.roundId === roundId ? this.peerSlots : [];
    if (from > base.length) return;
    this.peerSlots = [...base.slice(0, from), ...strokes.map(peerStroke)].slice(0, MAX_PEER_STROKES);
    this.setPeer({ active: true, roundId, strokes: this.peerSlots.filter((stroke): stroke is DrawingStroke => stroke !== null) });
  }
  /** The canvas's strokes for `roundId`, to redraw it after a remount. */
  localStrokes(roundId: string): readonly DrawingStroke[] {
    return this.local?.roundId === roundId ? this.local.strokes : [];
  }
  /** Called with the full local stroke list after each change; sends are coalesced. */
  strokesChanged(strokes: readonly DrawingStroke[]) {
    const round = this.controller.snapshot().state?.gameState?.round;
    if (round?.status !== "active" || round.roles.drawer !== "player") return;
    this.local = { roundId: round.roundId, strokes: strokes.slice(-MAX_PEER_STROKES) };
    if (this.peerSink) this.scheduleSend();
  }
  private scheduleSend() {
    if (this.outgoingTimer) return;
    this.outgoingTimer = setTimeout(() => { this.outgoingTimer = null; this.sendDelta(); }, PEER_SEND_INTERVAL_MS);
  }
  /** Sends only what changed since the last send: the common prefix is skipped. */
  private sendDelta() {
    const local = this.local;
    if (!local || !this.peerSink || local.roundId !== this.roundId) return;
    const base = this.sent.roundId === local.roundId ? this.sent.strokes : [];
    let from = 0;
    while (from < base.length && from < local.strokes.length && base[from] === local.strokes[from]) from++;
    if (this.sent.roundId === local.roundId && from === base.length && from === local.strokes.length) return;
    this.sent = { roundId: local.roundId, strokes: local.strokes };
    this.peerSink({ roundId: local.roundId, from, strokes: local.strokes.slice(from).map(quantize) });
  }
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; };
  snapshot = () => this.visionState;
  private setVision(status: string) { this.visionState = { status }; this.listeners.forEach(listener => listener()); }
  retryRecognition() { this.recognizedRevision = -1; this.revision++; this.setVision("waiting"); }
  private cleanup: Array<() => void> = [];
  constructor(private controller: GameCartridgeController<PictionaryState>, private arcade: ArcadeChannel) {
    this.roundId = controller.snapshot().state?.gameState?.round.roundId ?? null;
    this.cleanup.push(controller.subscribe(() => {
      const roundId = controller.snapshot().state?.gameState?.round.roundId ?? null;
      if (roundId !== this.roundId) {
        this.roundId = roundId; this.epoch++; this.queue = []; this.revision = 0; this.recognizedRevision = -1; this.setVision("waiting");
        this.local = null;
        // Strokes of the new round may already have arrived; keep those.
        if (this.peer.active && this.peer.roundId !== roundId) { this.peerSlots = []; this.setPeer({ active: true, roundId, strokes: [] }); }
      }
      if (!controller.snapshot().pending) void this.drain();
    }));
    this.cleanup.push(arcade.onMessage(message => {
      const raw = message as unknown as { type: string; channel?: string; cartridgeId?: string; requestId?: string; payload?: { roundId?: string; status?: string; revision?: number } };
      if (raw.type === "event" && raw.channel === "pictionary.vision.status" && raw.payload?.roundId === this.roundId) {
        this.setVision(raw.payload.status ?? "failed");
        if (raw.payload.status !== "analyzing" && typeof raw.payload.revision === "number") this.recognizedRevision = raw.payload.revision;
        return;
      }
      if (raw.type !== "event" || raw.channel !== "pictionary.snapshot.request" || (raw.cartridgeId && raw.cartridgeId !== "pictionary")) return;
      const round = this.controller.snapshot().state?.gameState?.round;
      if (round?.status !== "active" || round.roles.drawer !== "player" || raw.payload?.roundId !== round.roundId) return;
      if (this.revision === 0 || this.revision <= this.recognizedRevision) return;
      const image = this.capture?.();
      if (image) try { this.arcade.sendEvent("pictionary.snapshot", {
        ...image, revision: this.revision, roundId: round.roundId, atMs: Date.now(),
      }, { cartridgeId: "pictionary", ...(raw.requestId ? { requestId: raw.requestId } : {}) }); } catch { this.setVision("failed"); }
    }));
  }
  setCapture(capture: (() => DrawingSnapshot | null) | null) { this.capture = capture; }
  changed() {
    const game = this.controller.snapshot().state?.gameState;
    if (game?.phase !== "PLAYING" || game.round.status !== "active" || game.round.roles.drawer !== "player") return;
    this.revision++;
    try { this.arcade.sendEvent("pictionary.revision", { roundId: game.round.roundId, revision: this.revision, atMs: Date.now() }, { cartridgeId: "pictionary" }); }
    catch { /* Connection status is surfaced by the controller. */ }
  }
  submit(stroke: DrawingStroke) {
    const round = this.controller.snapshot().state?.gameState?.round;
    if (round?.status !== "active" || round.roles.drawer !== "player") return;
    this.queue.push({ roundId: round.roundId, epoch: this.epoch, batch: [stroke] });
    if (this.queue.length > 12) this.queue.shift();
    void this.drain();
  }
  private async drain() {
    if (this.draining || this.disposed || this.controller.snapshot().pending) return;
    this.draining = true;
    try {
      while (this.queue.length && !this.disposed && !this.controller.snapshot().pending) {
        const next = this.queue.shift()!;
        const round = this.controller.snapshot().state?.gameState?.round;
        if (next.epoch !== this.epoch || next.roundId !== round?.roundId || round.status !== "active") continue;
        await this.controller.dispatch({ type: "submitStrokeBatch", atMs: Date.now(), batch: next.batch as unknown as JsonValue });
      }
    } finally { this.draining = false; }
  }
  dispose() {
    this.disposed = true; this.epoch++; this.queue = []; this.capture = null; this.peerSink = null; this.local = null;
    if (this.outgoingTimer) clearTimeout(this.outgoingTimer);
    this.outgoingTimer = null;
    this.cleanup.forEach(fn => fn()); this.listeners.clear(); this.peerListeners.clear();
  }
}
