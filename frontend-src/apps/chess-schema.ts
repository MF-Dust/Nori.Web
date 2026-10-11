import { z } from "zod";

/**
 * Chess cartridge state contract. Kept free of chess.js and the tutorial data so the
 * desktop entry can validate cartridge state without bundling the chess engine; the
 * engine-backed helpers stay in `chess-model.ts`, which only the lazy Chess screen loads.
 */
export const CHESS_START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
export const chessSide = z.enum(["white", "black"]);
export type ChessSide = z.infer<typeof chessSide>;
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
