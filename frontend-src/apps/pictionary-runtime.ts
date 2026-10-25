import type { ArcadeChannel } from "../runtime/arcade-client";
import type { JsonValue } from "../runtime/protocol";
import type { GameCartridgeController } from "./game-cartridge-controller";
import type { DrawingStroke, PictionaryState } from "./pictionary-model";

export interface DrawingSnapshot { revision: number; image: string; width: number; height: number }
/** The other human's canvas in a multiplayer round; `null` strokes = nothing drawn yet. */
export interface PeerDrawing { active: boolean; roundId: string | null; strokes: readonly DrawingStroke[] }
type PeerSink = (roundId: string, strokes: readonly JsonValue[]) => void;

const MAX_PEER_STROKES = 512;
const PEER_SEND_INTERVAL_MS = 100;

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
  private peerListeners = new Set<() => void>();
  private outgoing: { roundId: string; strokes: readonly JsonValue[] } | null = null;
  private outgoingTimer: ReturnType<typeof setTimeout> | null = null;
  subscribePeer = (listener: () => void) => { this.peerListeners.add(listener); return () => { this.peerListeners.delete(listener); }; };
  peerSnapshot = () => this.peer;
  private setPeer(peer: PeerDrawing) { this.peer = peer; this.peerListeners.forEach(listener => listener()); }
  /** Multiplayer: mirror local strokes to the other human instead of Nori's samples. */
  setPeerSink(sink: PeerSink | null) {
    this.peerSink = sink;
    if (this.outgoingTimer) clearTimeout(this.outgoingTimer);
    this.outgoingTimer = null; this.outgoing = null;
    this.setPeer({ active: sink !== null, roundId: null, strokes: [] });
  }
  receivePeerStrokes(roundId: string, strokes: readonly JsonValue[]) {
    if (!this.peerSink || roundId !== this.roundId) return;
    const parsed = strokes.slice(-MAX_PEER_STROKES).map(peerStroke).filter((stroke): stroke is DrawingStroke => stroke !== null);
    this.setPeer({ active: true, roundId, strokes: parsed });
  }
  /** Called with the full local stroke list after each change; sends are coalesced. */
  strokesChanged(strokes: readonly DrawingStroke[]) {
    const round = this.controller.snapshot().state?.gameState?.round;
    if (!this.peerSink || round?.status !== "active" || round.roles.drawer !== "player") return;
    this.outgoing = { roundId: round.roundId, strokes: strokes.slice(-MAX_PEER_STROKES) as unknown as JsonValue[] };
    if (this.outgoingTimer) return;
    this.outgoingTimer = setTimeout(() => {
      this.outgoingTimer = null;
      const next = this.outgoing; this.outgoing = null;
      if (next && next.roundId === this.roundId) this.peerSink?.(next.roundId, next.strokes);
    }, PEER_SEND_INTERVAL_MS);
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
        if (this.peer.active) this.setPeer({ active: true, roundId, strokes: [] });
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
    this.disposed = true; this.epoch++; this.queue = []; this.capture = null; this.peerSink = null;
    if (this.outgoingTimer) clearTimeout(this.outgoingTimer);
    this.outgoingTimer = null;
    this.cleanup.forEach(fn => fn()); this.listeners.clear(); this.peerListeners.clear();
  }
}
