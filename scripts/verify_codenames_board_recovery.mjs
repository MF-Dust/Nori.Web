#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function main() {
  const assets = await fs.readdir(path.join(ROOT, "public", "assets"));
  const gameScreenFile = assets.find((file) => file.startsWith("GameScreen-") && file.endsWith(".js"));
  assert(gameScreenFile, "missing shipped Codenames GameScreen chunk");

  const shipped = await fs.readFile(path.join(ROOT, "public", "assets", gameScreenFile), "utf8");
  const source = await fs.readFile(
    path.join(ROOT, "frontend-src", "apps", "codenames-board-presentation.ts"),
    "utf8",
  );

  for (const marker of [
    'a.type === "HUMAN_GIVING_CLUE"',
    'a.type === "HUMAN_GUESSING"',
    'a.type === "SUDDEN_DEATH_HUMAN_TURN"',
    'a.type === "SUDDEN_DEATH_BOTH"',
    'v.bystanderMarks[0] === l || v.bystanderMarks[1] === l',
    'c !== null && v !== c',
    'A === "AGENT"',
    'A === "ASSASSIN"',
    'c === g && E.solvedBy === null',
  ]) {
    assert(shipped.includes(marker), `shipped Codenames board eligibility marker changed: ${marker}`);
  }

  for (const marker of [
    'input.uiStateType === "HUMAN_GIVING_CLUE"',
    'input.uiStateType === "HUMAN_GUESSING"',
    'input.uiStateType === "SUDDEN_DEATH_HUMAN_TURN"',
    'input.uiStateType === "SUDDEN_DEATH_BOTH"',
    'input.cell.bystanderMarks[0] === input.counterpartSide',
    'input.cell.bystanderMarks[1] === input.counterpartSide',
    'input.tutorialGuessCell === null || input.index === input.tutorialGuessCell',
    'input.counterpartRole === "AGENT"',
    'input.counterpartRole === "ASSASSIN"',
    'const clickAction: CodenamesBoardClickAction = canSelect',
    '? "select"',
    '? "guess"',
    ': "none"',
  ]) {
    assert(source.includes(marker), `source Codenames board eligibility missing marker: ${marker}`);
  }

  assert(
    shipped.includes("const U = (E.contentRect.width - 16 - 32) / 5 / me") ||
      shipped.includes("const U = (E.contentRect.width - 16 - 32) / 5 / me;"),
    "shipped Codenames board scale calculation changed",
  );
  assert(
    source.includes("const CARD_BASE_WIDTH = 160") &&
      source.includes("const BOARD_COLUMNS = 5") &&
      source.includes("const BOARD_GAP_TOTAL = 16") &&
      source.includes("const BOARD_PADDING_TOTAL = 32") &&
      source.includes("(boardWidth - BOARD_GAP_TOTAL - BOARD_PADDING_TOTAL) / BOARD_COLUMNS / CARD_BASE_WIDTH"),
    "source Codenames board scale calculation must preserve shipped geometry",
  );

  assert(
    shipped.includes('className: "h-full grid grid-cols-5 grid-rows-5 gap-2 p-2"') &&
      shipped.includes('"data-codenames-board": !0'),
    "shipped Codenames 5x5 board composition changed",
  );

  console.log("[ok] Codenames board eligibility and scale recovery match shipped GameScreen contracts");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
