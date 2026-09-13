import type { CodenamesGame } from "./codenames-model";
import type { CodenamesFlyingCardType } from "../screens/codenames-flying-card";

export interface CodenamesReveal {
  cell: number; type: CodenamesFlyingCardType; rotate180: boolean; slot?: number;
}
export function codenamesReveals(previous: CodenamesGame, next: CodenamesGame): CodenamesReveal[] {
  // New boards/reseeds are baselines, not a reveal of the previous game's cards.
  if (previous.board.some((word, index) => word.text !== next.board[index]?.text) || next.history.length < previous.history.length) return [];
  return next.cells.flatMap<CodenamesReveal>((cell, index) => {
    const before = previous.cells[index];
    if (!before) return [];
    if (cell.solvedBy && !before.solvedBy) return [{ cell: index, type: "agent" as const, rotate180: cell.solvedBy === "B" }];
    if (cell.assassinatedBy && !before.assassinatedBy) return [{ cell: index, type: "assassin" as const, rotate180: cell.assassinatedBy === "B" }];
    return cell.bystanderMarks.flatMap((side, slot) => side && !before.bystanderMarks[slot]
      ? [{ cell: index, type: "bystander" as const, slot, rotate180: side === "B" }] : []);
  });
}
export function waitForCodenamesAnimation(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise(resolve => {
    if (signal.aborted) { resolve(); return; }
    const finish = () => { clearTimeout(timer); signal.removeEventListener("abort", finish); resolve(); };
    const timer = setTimeout(finish, ms);
    signal.addEventListener("abort", finish, { once: true });
  });
}
