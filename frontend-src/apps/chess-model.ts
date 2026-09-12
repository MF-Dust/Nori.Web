import { Chess, type Square } from "chess.js";
import { z } from "zod";

export const CHESS_START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
export const chessSide = z.enum(["white", "black"]);
export type ChessSide = z.infer<typeof chessSide>;
export const CHESS_DIFFICULTIES = [
  { id: "sleepy", elo: 400 }, { id: "casual", elo: 700 }, { id: "normal", elo: 1000 },
  { id: "focused", elo: 1300 }, { id: "serious", elo: 1600 },
] as const;
const moveSchema = z.object({
  by: chessSide,
  move: z.object({ from: z.string(), to: z.string(), promotion: z.enum(["q", "r", "b", "n"]).optional() }),
  captured: z.string().optional(), san: z.string().optional(),
  isCheck: z.boolean().optional(), isCheckmate: z.boolean().optional(),
  isCastling: z.boolean().optional(), isPromotion: z.boolean().optional(),
});
export const chessStateSchema = z.object({
  settings: z.object({ playerSide: chessSide, difficulty: z.string(), locale: z.string().optional() }),
  gameState: z.object({
    fen: z.string(), startFen: z.string().default(CHESS_START_FEN),
    turn: chessSide, status: z.string(), phase: z.string().optional(),
    winner: z.union([chessSide, z.literal("draw")]).nullable(),
    isCheck: z.boolean().optional(), moveHistory: z.array(moveSchema),
  }).nullable(),
  drawOffer: chessSide.nullable().default(null),
  takebackRequest: chessSide.nullable().default(null),
  tutorial: z.object({ step: z.string() }).nullable().default(null),
});
export type ChessState = z.infer<typeof chessStateSchema>;
export type ChessHistoryMove = z.infer<typeof moveSchema>;

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

/** Shipped guided opening; free_play is the local backend handoff. */
export const CHESS_TUTORIAL_STEPS = [
    { id: "player_pawn_opens", mover: "player", move: { from: "e2", to: "e4" } },
    { id: "agent_pawn_mirrors", mover: "agent", move: { from: "e7", to: "e5" } },
    { id: "player_knight_develops", mover: "player", move: { from: "g1", to: "f3" } },
    { id: "agent_knight_defends", mover: "agent", move: { from: "b8", to: "c6" } },
    { id: "player_bishop_aims", mover: "player", move: { from: "f1", to: "c4" } },
    { id: "agent_bishop_mirrors", mover: "agent", move: { from: "f8", to: "c5" } },
    { id: "player_pawn_supports", mover: "player", move: { from: "c2", to: "c3" } },
    { id: "agent_knight_counters", mover: "agent", move: { from: "g8", to: "f6" } },
    { id: "player_pawn_strikes", mover: "player", move: { from: "d2", to: "d4" } },
    { id: "agent_pawn_captures", mover: "agent", move: { from: "e5", to: "d4" } },
    { id: "player_pawn_recaptures", mover: "player", move: { from: "c3", to: "d4" } },
    { id: "agent_bishop_checks", mover: "agent", move: { from: "c5", to: "b4" } },
    { id: "player_blocks_check", mover: "player", move: { from: "c1", to: "d2" } },
    { id: "agent_trades_bishops", mover: "agent", move: { from: "b4", to: "d2" } },
    { id: "player_knight_recaptures", mover: "player", move: { from: "b1", to: "d2" } },
    { id: "agent_frees_bishop", mover: "agent", move: { from: "d7", to: "d6" } },
    { id: "player_castles", mover: "player", move: { from: "e1", to: "g1" } },
    { id: "agent_castles", mover: "agent", move: { from: "e8", to: "g8" } },
    { id: "player_rook_guards", mover: "player", move: { from: "f1", to: "e1" } },
    { id: "agent_rook_mirrors", mover: "agent", move: { from: "f8", to: "e8" } },
    { id: "player_queen_develops", mover: "player", move: { from: "d1", to: "b3" } },
    { id: "agent_queen_connects", mover: "agent", move: { from: "d8", to: "d7" } },
  ] as const;
