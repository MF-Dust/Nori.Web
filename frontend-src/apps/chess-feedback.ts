import type { ChessState } from "./chess-model";
export type ChessNotice =
  | "noriAcceptedDraw"
  | "noriDeclinedDraw"
  | "noriAcceptedTakeback"
  | "noriDeclinedTakeback";
/** Transition-only feedback; snapshots and reconnects never replay historical move sounds. */
export class ChessFeedback {
  private previous: ChessState | null = null;
  private epoch: number | undefined;
  private timers = new Set<ReturnType<typeof setTimeout>>();
  private cancelled = new Set<string>();
  constructor(
    private sound: (sound: string) => void,
    private notify: (notice: ChessNotice) => void,
  ) {}
  suppressCancellation(kind: "draw" | "takeback") {
    this.cancelled.add(kind);
  }
  cancellationFailed(kind: "draw" | "takeback") {
    this.cancelled.delete(kind);
  }
  update(state: ChessState | null, epoch: number, connected: boolean) {
    if (epoch !== this.epoch || !connected || !state?.gameState) {
      this.reset();
      this.epoch = epoch;
      this.previous = connected ? state : null;
      return;
    }
    const previous = this.previous;
    this.previous = state;
    if (!previous?.gameState) return;
    const before = previous.gameState,
      game = state.gameState,
      side = state.settings.playerSide;
    for (const move of game.moveHistory.slice(before.moveHistory.length)) {
      this.sound(
        move.isCheckmate || move.isCheck
          ? "check"
          : move.captured
            ? "capture"
            : move.isCastling
              ? "castle"
              : move.isPromotion
                ? "promote"
                : move.by === side
                  ? "moveSelf"
                  : "moveOpponent",
      );
      if (move.isCheckmate) {
        const timer = setTimeout(() => {
          this.timers.delete(timer);
          this.sound("gameEnd");
        }, 200);
        this.timers.add(timer);
      }
    }
    if (
      before.status === "playing" &&
      game.status !== "playing" &&
      game.status !== "checkmate"
    )
      this.sound("gameEnd");
    if (previous.drawOffer === side && state.drawOffer === null) {
      if (this.cancelled.has("draw")) this.cancelled.delete("draw");
      else if (game.status === "draw") this.notify("noriAcceptedDraw");
      else if (game.status === "playing") {
        this.sound("response");
        this.notify("noriDeclinedDraw");
      }
    }
    if (previous.takebackRequest === side && state.takebackRequest === null) {
      if (this.cancelled.has("takeback")) this.cancelled.delete("takeback");
      else {
        this.sound("response");
        this.notify(
          game.moveHistory.length < before.moveHistory.length
            ? "noriAcceptedTakeback"
            : "noriDeclinedTakeback",
        );
      }
    }
  }
  reset() {
    this.timers.forEach(clearTimeout);
    this.timers.clear();
    this.previous = null;
    this.cancelled.clear();
  }
}
