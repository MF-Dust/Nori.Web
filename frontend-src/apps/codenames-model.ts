import { z } from "zod";
import { countRemainingCodenamesTargets, type CodenamesSide } from "./codenames-board-presentation";
import type { CodenamesClueUiState } from "./codenames-clue-presentation";
import type { CodenamesRawChatMessage, CodenamesTranslate } from "./codenames-chat";

const side = z.enum(["A", "B"]), role = z.enum(["AGENT", "BYSTANDER", "ASSASSIN"]);
const clue = z.object({ word: z.string(), count: z.union([z.number().int().nonnegative(), z.literal("infinity")]) });
export const codenamesStateSchema = z.object({
  counterpartSide: side, agentSide: side,
  settings: z.object({ tokens: z.number().int(), wordLocale: z.string() }),
  tutorial: z.object({ step: z.string() }).nullable().default(null),
  gameState: z.object({
    board: z.array(z.object({ id: z.string().optional(), text: z.string() })).length(25),
    key: z.object({ A: z.array(role).length(25), B: z.array(role).length(25) }),
    cells: z.array(z.object({ solvedBy: side.nullable(), assassinatedBy: side.nullable(),
      bystanderMarks: z.tuple([side.nullable(), side.nullable()]) })).length(25),
    tokensRemaining: z.number().int().nonnegative(), whoseTurnToGive: side,
    phase: z.enum(["NORMAL", "SUDDEN_DEATH", "GAME_OVER"]), winner: z.literal("TEAM").nullable(),
    history: z.array(z.object({ clueGiver: side, clue, guesses: z.array(z.object({
      cell: z.number().int().min(0).max(24), result: role, at: z.number(),
    })), endedBy: z.string().nullable() })),
  }).nullable(),
});
export type CodenamesState = z.infer<typeof codenamesStateSchema>;
export type CodenamesGame = NonNullable<CodenamesState["gameState"]>;

/** NormalApp gPe: each player's guesses use the opposite key. */
export function codenamesUiState(game: CodenamesGame | null, player: CodenamesSide): CodenamesClueUiState {
  if (!game) return { type: "HUMAN_GIVING_CLUE" };
  if (game.phase === "GAME_OVER") return { type: "GAME_OVER" };
  if (game.phase === "SUDDEN_DEATH") {
    const targets = countRemainingCodenamesTargets(game);
    const human = targets[player === "A" ? "B" : "A"] > 0, agent = targets[player] > 0;
    return { type: human && agent ? "SUDDEN_DEATH_BOTH" : human ? "SUDDEN_DEATH_HUMAN_TURN" : "SUDDEN_DEATH_AI_TURN" };
  }
  const turn = game.history.at(-1);
  if (!turn || turn.endedBy !== null) return { type: game.whoseTurnToGive === player ? "HUMAN_GIVING_CLUE" : "AI_GIVING_CLUE" };
  return { type: turn.clueGiver === player ? "AI_GUESSING" : "HUMAN_GUESSING", clue: turn.clue };
}
const cjk = /[\u3040-\u30FF\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF]/;
const positionHints = [
  /^[A-Z]-\d+$/,
  /\b(ROW|COL|COLUMN|POSITION|TOP|BOTTOM|LEFT|RIGHT|MIDDLE|CENTER)\b/i,
  /\b(FIRST|SECOND|THIRD|FOURTH|FIFTH|STARTS|ENDS|LETTER)\b/i,
];
/** NormalApp j$: return the shipped translation suffix for a rejected clue. */
export function codenamesClueError(game: CodenamesGame, word: string, count: number | "infinity"): string | null {
  const normalized = word.trim().toUpperCase();
  if (count !== "infinity" && (!Number.isInteger(count) || count < 0)) return "countInvalid";
  if (!normalized) return "empty";
  if (/\s/.test(normalized)) return "phrase";
  if (normalized.length > (cjk.test(normalized) ? 10 : 24)) return "tooLong";
  if (/\d/.test(normalized)) return "containsNumbers";
  if (positionHints.some(pattern => pattern.test(normalized))) return "positionHint";
  const words = game.board.map(item => item.text.toUpperCase());
  if (words.includes(normalized)) return "wordOnBoard";
  if (words.some(item =>
    (item.length >= (cjk.test(item) ? 1 : 3) && normalized.includes(item)) ||
    (normalized.length >= (cjk.test(normalized) ? 1 : 3) && item.includes(normalized)))) return "substring";
  return null;
}
/** Rebuild durable turn messages when reopening a game; no duplicate transcript on reseed. */
export function codenamesHistoryMessages(game: CodenamesGame, player: CodenamesSide, translate: CodenamesTranslate): CodenamesRawChatMessage[] {
  const messages: CodenamesRawChatMessage[] = [];
  const sender = (side: CodenamesSide) => side === player ? "You" : "Nori";
  game.history.forEach((turn, index) => {
    messages.push({ id: index + ":clue", sender: sender(turn.clueGiver), message: { type: "clue", ...turn.clue } });
    const guesser = turn.clueGiver === "A" ? "B" : "A";
    turn.guesses.forEach((guess, step) => messages.push({ id: index + ":guess:" + step, sender: sender(guesser),
      message: { type: "guess", word: game.board[guess.cell].text, result: guess.result === "AGENT" ? "agent" : guess.result === "BYSTANDER" ? "bystander" : "assassin" } }));
    if (turn.endedBy) messages.push({ id: index + ":end", sender: sender(guesser), message: { type: "turnEnded",
      reason: turn.endedBy === "ALL_FOUND" ? "all_found" : turn.endedBy === "BYSTANDER" ? "bystander" : "voluntary" } });
  });
  if (game.phase === "SUDDEN_DEATH") messages.push({ id: "sudden-death", sender: "", message: { type: "suddenDeath" } });
  if (game.phase === "GAME_OVER") messages.push({ id: "result", sender: "", message: { type: "system",
    text: translate(game.winner === "TEAM" ? "codenames.results.victory" : "codenames.results.defeat"), tone: game.winner === "TEAM" ? "success" : "warning" } });
  return messages;
}
