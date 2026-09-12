import type { CodenamesUiStateType } from "./codenames-board-presentation";
import type { CodenamesClueCount } from "./codenames-chat";

export const CODENAMES_CLUE_REVEAL_DELAY_MS = 300;
export const CODENAMES_CLUE_REVEAL_STEP_MS = 120;
export const CODENAMES_CLUE_COUNT_REVEAL_DELAY_MS = 300;

export interface CodenamesClue {
  word: string;
  count: CodenamesClueCount;
}

export interface CodenamesClueUiState {
  type: CodenamesUiStateType;
  clue?: CodenamesClue | null;
}

export type CodenamesClueOverlayState =
  | { type: "off" }
  | { type: "waiting"; translationKey: string }
  | { type: "display"; clue: CodenamesClue; translationKey: string };

export interface CodenamesClueHighlight {
  clue: CodenamesClue;
  label: string;
}

export function normalizeCodenamesClueWord(word: string): string {
  return word.toUpperCase();
}

export function formatCodenamesClueCount(count: CodenamesClueCount): string {
  return count === "infinity" ? "∞" : String(count);
}

/**
 * Source-owned equivalent of the shipped GameScreen clue/waiting-state switch.
 */
export function deriveCodenamesClueOverlayState(
  uiState: CodenamesClueUiState,
): CodenamesClueOverlayState {
  switch (uiState.type) {
    case "HUMAN_GIVING_CLUE":
      return { type: "waiting", translationKey: "codenames.game.waitingForYou" };
    case "AI_GIVING_CLUE":
      return { type: "waiting", translationKey: "codenames.game.waitingForNori" };
    case "HUMAN_GUESSING":
      return uiState.clue
        ? { type: "display", clue: uiState.clue, translationKey: "codenames.game.norisClue" }
        : { type: "off" };
    case "AI_GUESSING":
      return uiState.clue
        ? { type: "display", clue: uiState.clue, translationKey: "codenames.game.yourClue" }
        : { type: "off" };
    default:
      return { type: "off" };
  }
}
