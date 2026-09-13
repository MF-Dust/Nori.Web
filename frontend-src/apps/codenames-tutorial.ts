import type { CodenamesClueUiState } from "./codenames-clue-presentation";

export type CodenamesTutorialGate = { kind: "off" | "wait" | "free_clue" | "free_guess" } | { kind: "guess"; cell: number };
const cells: Record<string, number> = {
  player_first_treasure: 0, player_second_treasure: 10, player_berry_lesson: 17,
  player_monster_touch: 23, player_finale_guess: 12,
};
export function codenamesTutorialGate(step?: string): CodenamesTutorialGate {
  if (!step || step === "free_play") return { kind: "off" };
  if (Object.hasOwn(cells, step)) return { kind: "guess", cell: cells[step] };
  if (step === "player_real_clue") return { kind: "free_clue" };
  if (step === "player_free_guessing") return { kind: "free_guess" };
  return { kind: "wait" };
}
export function codenamesTutorialAllows(gate: CodenamesTutorialGate, command: "submitGuess" | "submitClue" | "endTurn", cell?: number): boolean {
  switch (gate.kind) {
    case "off": return true;
    case "wait": return false;
    case "guess": return command === "submitGuess" && cell === gate.cell;
    case "free_clue": return command === "submitClue";
    case "free_guess": return command === "submitGuess" || command === "endTurn";
  }
}
export function codenamesTutorialUi(ui: CodenamesClueUiState, gate: CodenamesTutorialGate): CodenamesClueUiState {
  if (gate.kind !== "wait") return ui;
  if (ui.type === "HUMAN_GIVING_CLUE") return { type: "AI_GIVING_CLUE" };
  if (ui.type === "HUMAN_GUESSING") return { ...ui, type: "AI_GUESSING" };
  if (ui.type === "SUDDEN_DEATH_HUMAN_TURN" || ui.type === "SUDDEN_DEATH_BOTH") return { type: "SUDDEN_DEATH_AI_TURN" };
  return ui;
}
