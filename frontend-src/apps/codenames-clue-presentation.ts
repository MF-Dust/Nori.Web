import type { CodenamesUiStateType } from "./codenames-board-presentation";
import type { CodenamesClueCount } from "./codenames-chat";

export const CODENAMES_CLUE_REVEAL_DELAY_MS = 300;
export const CODENAMES_CLUE_REVEAL_STEP_MS = 120;
export const CODENAMES_CLUE_COUNT_REVEAL_DELAY_MS = 300;
export const CODENAMES_CLUE_COUNT_OPTIONS: readonly CodenamesClueCount[] = [
  0,
  1,
  2,
  3,
  4,
  5,
  6,
  7,
  8,
  9,
  "infinity",
];

export type CodenamesBoardOverlayType =
  | "your-turn"
  | "agent-turn"
  | "sudden-death"
  | "win"
  | "lose";

export const CODENAMES_BOARD_OVERLAY_DURATION_MS: Readonly<Record<CodenamesBoardOverlayType, number>> = {
  "your-turn": 2_000,
  "agent-turn": 2_000,
  "sudden-death": 3_000,
  win: 4_000,
  lose: 4_000,
};

export interface CodenamesBoardOverlayPresentation {
  translationKeyBase: string;
  accentColor: string;
  background: string;
}

export const CODENAMES_BOARD_OVERLAY_PRESENTATION: Readonly<
  Record<CodenamesBoardOverlayType, CodenamesBoardOverlayPresentation>
> = {
  "your-turn": {
    translationKeyBase: "codenames.overlay.yourTurn",
    accentColor: "hsl(45 70% 55%)",
    background: "radial-gradient(ellipse 120% 80% at 50% 120%, hsla(45,60%,50%,.2) 0%, transparent 60%)",
  },
  "agent-turn": {
    translationKeyBase: "codenames.overlay.noriTurn",
    accentColor: "hsl(35 45% 55%)",
    background: "radial-gradient(ellipse 120% 80% at 50% 120%, hsla(35,40%,45%,.15) 0%, transparent 60%)",
  },
  "sudden-death": {
    translationKeyBase: "codenames.overlay.suddenDeath",
    accentColor: "hsl(25 65% 55%)",
    background: "radial-gradient(ellipse 120% 80% at 50% 120%, hsla(25,55%,45%,.25) 0%, transparent 60%)",
  },
  win: {
    translationKeyBase: "codenames.overlay.win",
    accentColor: "hsl(85 50% 48%)",
    background: "radial-gradient(ellipse 120% 80% at 50% 120%, hsla(85,45%,45%,.25) 0%, transparent 60%)",
  },
  lose: {
    translationKeyBase: "codenames.overlay.lose",
    accentColor: "hsl(195 40% 45%)",
    background: "radial-gradient(ellipse 120% 80% at 50% 120%, hsla(195,35%,35%,.3) 0%, transparent 60%)",
  },
};

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

export interface ParsedCodenamesClueSubmission {
  word: string;
  count?: CodenamesClueCount;
}

export function normalizeCodenamesClueWord(word: string): string {
  return word.toUpperCase();
}

export function formatCodenamesClueCount(count: CodenamesClueCount): string {
  return count === "infinity" ? "∞" : String(count);
}

/** Mirrors the shipped inline clue syntax accepted by the ChatPanel composer. */
export function parseCodenamesClueSubmission(value: string): ParsedCodenamesClueSubmission {
  const trimmed = value.trim();
  const match = trimmed.match(/^(.+?)[,\s]+(\d+|∞|infinity)$/i);
  if (!match) return { word: normalizeCodenamesClueWord(trimmed) };

  const rawCount = match[2].toLowerCase();
  const count: CodenamesClueCount =
    rawCount === "∞" || rawCount === "infinity" || rawCount === "inf"
      ? "infinity"
      : Number.parseInt(rawCount, 10);
  return {
    word: normalizeCodenamesClueWord(match[1].trim()),
    count,
  };
}

/** Source-owned equivalent of the clue/waiting state shown in the shipped header. */
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
