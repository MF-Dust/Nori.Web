export type CodenamesSide = "A" | "B";
export type CodenamesCardRole = "AGENT" | "BYSTANDER" | "ASSASSIN" | string;
export type CodenamesUiStateType =
  | "HUMAN_GIVING_CLUE"
  | "AI_GIVING_CLUE"
  | "HUMAN_GUESSING"
  | "AI_GUESSING"
  | "SUDDEN_DEATH_HUMAN_TURN"
  | "SUDDEN_DEATH_AI_TURN"
  | "SUDDEN_DEATH_BOTH"
  | string;

export interface CodenamesPresentationCell {
  solvedBy: CodenamesSide | null;
  assassinatedBy?: CodenamesSide | null;
}

export interface CodenamesBoardPresentationCell extends CodenamesPresentationCell {
  bystanderMarks: readonly [CodenamesSide | null, CodenamesSide | null];
}

export interface CodenamesPresentationState {
  key: Record<CodenamesSide, readonly CodenamesCardRole[]>;
  cells: readonly CodenamesPresentationCell[];
}

export interface CodenamesRemainingTargets {
  A: number;
  B: number;
  total: number;
}

export interface CodenamesCardInteractionInput {
  solved: boolean;
  assassinated: boolean;
  isSelected: boolean;
  isPending: boolean;
  isShaking: boolean;
  isDisabled: boolean;
  isClickable: boolean;
  canSelect: boolean;
  isHovered: boolean;
}

export interface CodenamesCardInteractionPresentation {
  interactive: boolean;
  wrapperClassName: string;
  buttonClassName: string;
}

export interface CodenamesBoardCellEligibilityInput {
  index: number;
  uiStateType: CodenamesUiStateType;
  counterpartSide: CodenamesSide;
  counterpartRole: CodenamesCardRole | null;
  tutorialGuessCell: number | null;
  cell: CodenamesBoardPresentationCell;
}

export type CodenamesBoardClickAction = "select" | "guess" | "none";

export interface CodenamesBoardCellEligibility {
  isDisabled: boolean;
  isClickable: boolean;
  canSelect: boolean;
  showUnrevealedOutline: boolean;
  showMonsterOutline: boolean;
  clickAction: CodenamesBoardClickAction;
}

const CARD_COUNT = 25;
const CARD_BASE_WIDTH = 160;
const BOARD_COLUMNS = 5;
const BOARD_GAP_TOTAL = 16;
const BOARD_PADDING_TOTAL = 32;
const CARD_WORD_TARGET_WIDTH = 134;
const CARD_WORD_MIN_SIZE = 13;
const CARD_WORD_MAX_SIZE = 24;
const LETTER_SPACING_EM = 0.08;
const CJK_ADVANCE = 1.05;
const FALLBACK_ADVANCE = 0.85;
const CJK_CHARACTER = /[\u2E80-\u9FFF\u3040-\u30FF\uAC00-\uD7AF\uF900-\uFAFF\uFF01-\uFF60]/;

const LATIN_ADVANCE: Readonly<Record<string, number>> = {
  A: 0.774,
  B: 0.762,
  C: 0.734,
  D: 0.83,
  E: 0.683,
  F: 0.683,
  G: 0.821,
  H: 0.837,
  I: 0.372,
  J: 0.372,
  K: 0.775,
  L: 0.637,
  M: 0.995,
  N: 0.837,
  O: 0.85,
  P: 0.733,
  Q: 0.85,
  R: 0.77,
  S: 0.68,
  T: 0.703,
  U: 0.812,
  V: 0.774,
  W: 1.103,
  X: 0.771,
  Y: 0.724,
  Z: 0.725,
  " ": 0.348,
  ".": 0.38,
  "-": 0.415,
  "'": 0.306,
};

const wordSizeCache = new Map<string, number>();

/**
 * Counts the still-unsolved agent cards for both sides exactly as the shipped
 * Codenames header does. The board contract is fixed at 25 cells.
 */
export function countRemainingCodenamesTargets(
  state: CodenamesPresentationState | null | undefined,
): CodenamesRemainingTargets {
  if (!state) return { A: 0, B: 0, total: 0 };

  let A = 0;
  let B = 0;
  for (let index = 0; index < CARD_COUNT; index += 1) {
    const cell = state.cells[index];
    if (!cell || cell.solvedBy !== null) continue;
    if (state.key.A[index] === "AGENT") A += 1;
    if (state.key.B[index] === "AGENT") B += 1;
  }

  return { A, B, total: A + B };
}

/**
 * Recreates the shipped ResizeObserver scale calculation for the fixed 5x5
 * board. The constants account for the board's four 8px gaps and 16px padding
 * on each side before normalizing against the 160px card canvas.
 */
export function getCodenamesCardScale(boardWidth: number): number {
  return (boardWidth - BOARD_GAP_TOTAL - BOARD_PADDING_TOTAL) / BOARD_COLUMNS / CARD_BASE_WIDTH;
}

/**
 * Recreates the shipped card-word sizing heuristic instead of relying on DOM
 * measurement, keeping Latin, CJK and unknown-character behavior stable.
 */
export function getCodenamesCardWordFontSize(word: string): number {
  const cached = wordSizeCache.get(word);
  if (cached !== undefined) return cached;

  let width = 0;
  for (const character of word.toUpperCase()) {
    const advance = LATIN_ADVANCE[character] ?? (CJK_CHARACTER.test(character) ? CJK_ADVANCE : FALLBACK_ADVANCE);
    width += advance + LETTER_SPACING_EM;
  }

  const fontSize = Math.floor(
    Math.min(CARD_WORD_MAX_SIZE, Math.max(CARD_WORD_MIN_SIZE, CARD_WORD_TARGET_WIDTH / width)),
  );
  wordSizeCache.set(word, fontSize);
  return fontSize;
}

/**
 * Source-owns the per-cell eligibility calculation performed by the shipped
 * Codenames board before it renders GameCardCell. This keeps clue-giver
 * selection, human guessing, sudden death and tutorial restrictions aligned.
 */
export function deriveCodenamesBoardCellEligibility(
  input: CodenamesBoardCellEligibilityInput,
): CodenamesBoardCellEligibility {
  const isGivingClue = input.uiStateType === "HUMAN_GIVING_CLUE";
  const canGuess =
    input.uiStateType === "HUMAN_GUESSING" ||
    input.uiStateType === "SUDDEN_DEATH_HUMAN_TURN" ||
    input.uiStateType === "SUDDEN_DEATH_BOTH";
  const solved = input.cell.solvedBy !== null;
  const markedByCounterpart =
    input.cell.bystanderMarks[0] === input.counterpartSide ||
    input.cell.bystanderMarks[1] === input.counterpartSide;
  const tutorialAllowsCell = input.tutorialGuessCell === null || input.index === input.tutorialGuessCell;
  const isAgent = input.counterpartRole === "AGENT";
  const isAssassin = input.counterpartRole === "ASSASSIN";

  const canSelect = isGivingClue && isAgent && !solved;
  const isClickable = !isGivingClue && canGuess && tutorialAllowsCell && !solved && !markedByCounterpart;
  const isDisabled = solved || (canGuess && markedByCounterpart) || !tutorialAllowsCell;
  const showUnrevealedOutline = canSelect || (input.tutorialGuessCell === input.index && !solved);
  const showMonsterOutline = isGivingClue && isAssassin && input.cell.assassinatedBy === null;

  const clickAction: CodenamesBoardClickAction = canSelect
    ? "select"
    : isClickable
      ? "guess"
      : "none";

  return {
    isDisabled,
    isClickable,
    canSelect,
    showUnrevealedOutline,
    showMonsterOutline,
    clickAction,
  };
}

/**
 * Source-owned equivalent of the shipped GameCard class/interaction decision.
 * Solved cards remain non-selectable even when the parent says they are clickable.
 */
export function deriveCodenamesCardInteraction(
  input: CodenamesCardInteractionInput,
): CodenamesCardInteractionPresentation {
  const interactive = (input.isClickable || input.canSelect) && !input.solved;

  let wrapperClassName = "relative overflow-visible";
  if (input.isPending) wrapperClassName += " z-20";
  if (input.isShaking) wrapperClassName += " z-[100]";

  let buttonClassName = "game-card-btn";
  if (interactive) buttonClassName += " cursor-pointer";
  else if (input.solved) buttonClassName += " cursor-not-allowed";
  else buttonClassName += " cursor-default";

  if (input.isDisabled && !input.solved) buttonClassName += " opacity-50";
  if (input.isHovered && !input.isPending && !input.isShaking) buttonClassName += " game-card-hover";
  if (input.isPending || input.isShaking) buttonClassName += " game-card-active";
  if (
    input.isSelected &&
    !input.solved &&
    !input.assassinated &&
    !input.isPending &&
    !input.isShaking
  ) {
    buttonClassName += " game-card-selected";
  }

  return { interactive, wrapperClassName, buttonClassName };
}
