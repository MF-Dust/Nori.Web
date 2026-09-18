import type { PictionaryState } from "./pictionary-model";

export type PictionaryReaction =
  | "playerCorrect" | "noriCorrectFast" | "noriCorrectSlow"
  | "playerWrong" | "noriWrong" | "skipNoriDrawing" | "skipPlayerDrawing"
  | "sessionGreat" | "sessionOk" | "sessionPoor";

export const PICTIONARY_FAST_SOLVE_MS = 30_000;
export const PICTIONARY_GREAT_SESSION_SCORE = 16;
export const PICTIONARY_POOR_SESSION_SCORE = 4;

/** Maps replicated transitions to the shipped reaction director's semantic cue. */
export function pictionaryReaction(previous: PictionaryState | null, next: PictionaryState | null): PictionaryReaction | null {
  const before = previous?.gameState, after = next?.gameState;
  if (!before || !after) return null;
  if (before.phase !== "RESULTS" && after.phase === "RESULTS")
    return after.score.solved >= PICTIONARY_GREAT_SESSION_SCORE ? "sessionGreat"
      : after.score.solved <= PICTIONARY_POOR_SESSION_SCORE ? "sessionPoor" : "sessionOk";
  if (after.history.length > before.history.length) {
    const result = after.history.at(-1)!;
    if (result.outcome === "solved") {
      if (result.roles.guesser === "player") return "playerCorrect";
      return result.elapsedMs < PICTIONARY_FAST_SOLVE_MS ? "noriCorrectFast" : "noriCorrectSlow";
    }
    if (result.outcome === "skipped") return result.roles.drawer === "agent" ? "skipNoriDrawing" : "skipPlayerDrawing";
  }
  const oldGuess = before.round.lastGuess, guess = after.round.lastGuess;
  if (guess && !guess.correct && (guess.atMs !== oldGuess?.atMs || guess.by !== oldGuess?.by || guess.text !== oldGuess?.text))
    return guess.by === "player" ? "playerWrong" : "noriWrong";
  return null;
}
