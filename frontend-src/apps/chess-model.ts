import tutorialSteps from "../../shared/chess-tutorial.json";
import { Chess, type Square } from "chess.js";
import { CHESS_START_FEN, type ChessHistoryMove, type ChessSide } from "./chess-schema";

export {
  CHESS_START_FEN,
  chessSide,
  chessStateSchema,
  type ChessHistoryMove,
  type ChessSide,
  type ChessState,
} from "./chess-schema";
export const CHESS_DIFFICULTIES = [
  { id: "sleepy", elo: 400 }, { id: "casual", elo: 700 }, { id: "normal", elo: 1000 },
  { id: "focused", elo: 1300 }, { id: "serious", elo: 1600 },
] as const;

export function chessHistory(startFen: string, moves: readonly ChessHistoryMove[]) {
  const board = new Chess(startFen);
  const fens = [startFen];
  const san: string[] = [];
  for (const item of moves) {
    const moved = board.move(item.move);
    san.push(moved.san);
    fens.push(board.fen());
  }
  return { fens, san };
}
export function chessCaptures(moves: readonly ChessHistoryMove[], side: ChessSide) {
  const player: Record<string, number> = {};
  const opponent: Record<string, number> = {};
  const values: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9 };
  let advantage = 0;
  for (const item of moves) {
    if (!item.captured) continue;
    const piece = item.captured.toLowerCase();
    const target = item.by === side ? player : opponent;
    target[piece] = (target[piece] ?? 0) + 1;
    advantage += (item.by === side ? 1 : -1) * (values[piece] ?? 0);
  }
  return { player, opponent, advantage };
}
export function chessLayout(width: number, height: number) {
  const measured = width > 0 && height > 0;
  const board = measured ? Math.round(Math.max(220, Math.min(560, height - 116, width - 72 - 212))) : 560;
  return {
    board, rail: measured ? Math.round(Math.min(280, Math.max(212, width - 72 - board))) : 280,
    compact: measured && height < 520,
  };
}
export function legalChessMoves(fen: string, square: string) {
  if (!/^[a-h][1-8]$/.test(square)) return [];
  return new Chess(fen).moves({ square: square as Square, verbose: true });
}

/** Shared protocol sequence; both runtimes advance to free_play after the final move. */
export const CHESS_TUTORIAL_STEPS = tutorialSteps;
