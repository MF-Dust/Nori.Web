import type { CodenamesClueUiState } from "./codenames-clue-presentation";

export type CodenamesTutorialGate = { kind: "off" | "wait" | "free_clue" | "free_guess" } | { kind: "guess"; cell: number };
export const CODENAMES_TUTORIAL_STEPS = [
  "nori_opening_clue",
  "player_first_treasure",
  "player_second_treasure",
  "player_berry_lesson",
  "player_real_clue",
  "nori_real_guessing",
  "nori_canine_clue",
  "player_free_guessing",
  "load_monster_lesson",
  "nori_chime_clue",
  "player_monster_touch",
  "load_sudden_death",
  "player_finale_guess",
] as const;
export type CodenamesTutorialStep = typeof CODENAMES_TUTORIAL_STEPS[number];

export interface CodenamesTutorialInstruction {
  step: number;
  total: number;
  actor: "player" | "nori" | "system";
  title: string;
  body: string;
}

const tutorialCopy: Record<CodenamesTutorialStep, { actor: CodenamesTutorialInstruction["actor"]; en: [string, string]; zh: [string, string] }> = {
  nori_opening_clue: { actor: "nori", en: ["Watch Nori's hint", "Nori begins with a two-card hint. The matching cards will be yours to find."], zh: ["观察 Nori 的提示", "Nori 会先给出一个对应两张卡片的提示。接下来由你找出它们。"] },
  player_first_treasure: { actor: "player", en: ["Find the first treasure", "Choose the highlighted card, then choose it again to confirm."], zh: ["找到第一个宝箱", "点亮高亮卡片，再点一次确认。"] },
  player_second_treasure: { actor: "player", en: ["Continue the search", "The hint covers one more treasure. Confirm the next highlighted card."], zh: ["继续寻找", "这个提示还对应另一个宝箱。确认下一张高亮卡片。"] },
  player_berry_lesson: { actor: "player", en: ["Learn the berry rule", "Try the highlighted card. A berry is safe, but it ends the current search turn."], zh: ["认识浆果规则", "试试高亮卡片。浆果不会立刻输掉游戏，但会结束本次寻找。"] },
  player_real_clue: { actor: "player", en: ["Give your own hint", "Enter one word and a count to guide Nori toward the treasures on your map."], zh: ["给出自己的提示", "输入一个词和数量，引导 Nori 找到你地图上的宝箱。"] },
  nori_real_guessing: { actor: "nori", en: ["Nori is searching", "Wait while Nori follows your hint."], zh: ["Nori 正在寻找", "请等待 Nori 根据你的提示进行选择。"] },
  nori_canine_clue: { actor: "nori", en: ["Read the next hint", "Nori gives another two-card hint. Use it to plan your search."], zh: ["阅读下一个提示", "Nori 会再给出一个对应两张卡片的提示。根据提示规划选择。"] },
  player_free_guessing: { actor: "player", en: ["Search freely", "Choose cards that match the hint. You may stop after at least one guess."], zh: ["自由寻找", "选择符合提示的卡片。至少猜一次后，可以主动结束本回合。"] },
  load_monster_lesson: { actor: "system", en: ["Monster lesson", "The board is being prepared to demonstrate the one card that ends the adventure."], zh: ["怪兽教学", "地图正在准备，用来展示会立即结束探险的危险卡片。"] },
  nori_chime_clue: { actor: "nori", en: ["Follow the chime hint", "Nori gives a one-card hint for the final rule demonstration."], zh: ["跟随钟声提示", "Nori 会给出一个对应一张卡片的提示，展示最后一条规则。"] },
  player_monster_touch: { actor: "player", en: ["Reveal the monster", "Confirm the highlighted card to see why the monster must always be avoided."], zh: ["翻开怪兽", "确认高亮卡片，看看为什么必须避开怪兽。"] },
  load_sudden_death: { actor: "system", en: ["Final search", "With no rounds left, hints stop. One wrong card now ends the adventure."], zh: ["最后冲刺", "回合耗尽后不再给提示。此时选错一张卡片就会结束探险。"] },
  player_finale_guess: { actor: "player", en: ["Complete the lesson", "Confirm the highlighted treasure to finish the guided adventure."], zh: ["完成教学", "确认高亮宝箱，完成引导探险。"] },
};

/** Deterministic UI instruction for the shipped script. This is not agent dialogue. */
export function codenamesTutorialInstruction(step: string | undefined, locale = "en"): CodenamesTutorialInstruction | null {
  if (!step || step === "free_play") return null;
  const index = CODENAMES_TUTORIAL_STEPS.indexOf(step as CodenamesTutorialStep);
  if (index < 0) return null;
  const item = tutorialCopy[CODENAMES_TUTORIAL_STEPS[index]];
  const [title, body] = locale.toLowerCase().startsWith("zh") ? item.zh : item.en;
  return { step: index + 1, total: CODENAMES_TUTORIAL_STEPS.length, actor: item.actor, title, body };
}
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
