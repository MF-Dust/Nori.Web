import type { ArcadeClient } from "../runtime/arcade-client";
import type { JsonValue } from "../runtime/protocol";
import type { GameCartridgeController } from "./game-cartridge-controller";
import type { DrawingStroke, PictionaryState } from "./pictionary-model";

export interface DrawingSnapshot { revision: number; image: string; width: number; height: number }

/** Strokes are ephemeral: round/epoch fencing prevents a queued old drawing reaching a new round. */
export class PictionaryDrawingBridge {
  private queue: Array<{ roundId: string; epoch: number; batch: DrawingStroke[] }> = [];
  private draining = false;
  private epoch = 0;
  private roundId: string | null = null;
  private revision = 0;
  private capture: (() => DrawingSnapshot | null) | null = null;
  private disposed = false;
  private cleanup: Array<() => void> = [];
  constructor(private controller: GameCartridgeController<PictionaryState>, private arcade: ArcadeClient) {
    this.cleanup.push(controller.subscribe(() => {
      const roundId = controller.snapshot().state?.gameState?.round.roundId ?? null;
      if (roundId !== this.roundId) {
        this.roundId = roundId; this.epoch++; this.queue = []; this.revision = 0;
      }
      if (!controller.snapshot().pending) void this.drain();
    }));
    this.cleanup.push(arcade.onMessage(message => {
      const raw = message as unknown as { type: string; channel?: string; cartridgeId?: string; requestId?: string; payload?: { roundId?: string } };
      if (raw.type !== "event" || raw.channel !== "pictionary.snapshot.request" || (raw.cartridgeId && raw.cartridgeId !== "pictionary")) return;
      const round = this.controller.snapshot().state?.gameState?.round;
      if (round?.status !== "active" || round.roles.drawer !== "player" || raw.payload?.roundId !== round.roundId) return;
      const image = this.capture?.();
      if (image) this.arcade.sendEvent("pictionary.snapshot", {
        ...image, revision: this.revision, roundId: round.roundId, atMs: Date.now(),
      }, { cartridgeId: "pictionary", ...(raw.requestId ? { requestId: raw.requestId } : {}) });
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
  dispose() { this.disposed = true; this.epoch++; this.queue = []; this.capture = null; this.cleanup.forEach(fn => fn()); }
}
