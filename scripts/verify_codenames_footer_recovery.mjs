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
  const source = await fs.readFile(path.join(ROOT, "frontend-src", "apps", "codenames-footer-presentation.ts"), "utf8");
  const composition = await fs.readFile(path.join(ROOT, "frontend-src", "screens", "codenames-footer.tsx"), "utf8");

  for (const marker of [
    "codenames.footer.giveClue",
    "codenames.footer.yourTurn",
    "codenames.footer.noriThinking",
    "codenames.footer.noriGuessing",
    "codenames.footer.suddenDeathYou",
    "codenames.footer.suddenDeathNori",
    "codenames.footer.suddenDeathBoth",
    "codenames.footer.doneGuessing",
    "codenames-end-turn-pulse",
  ]) {
    assert(shipped.includes(marker), `shipped Codenames footer marker changed: ${marker}`);
  }

  for (const marker of [
    'case "HUMAN_GIVING_CLUE"',
    'case "HUMAN_GUESSING"',
    'case "AI_GIVING_CLUE"',
    'case "AI_GUESSING"',
    'case "SUDDEN_DEATH_HUMAN_TURN"',
    'case "SUDDEN_DEATH_AI_TURN"',
    'case "SUDDEN_DEATH_BOTH"',
    'translationKey: "codenames.footer.giveClue"',
    'translationKey: "codenames.footer.noriThinking"',
    'translationKey: "codenames.footer.suddenDeathNori"',
    'showSpinner: true',
    'input.uiStateType === "HUMAN_GUESSING" && input.canEndTurn && input.hasEndTurnHandler',
  ]) {
    assert(source.includes(marker), `source Codenames footer presentation missing marker: ${marker}`);
  }

  for (const marker of [
    'className="shrink-0 p-3 min-h-[52px]"',
    "data-codenames-footer",
    "translate(presentation.status.translationKey)",
    "presentation.status.showSpinner",
    "presentation.showEndTurn",
    'shouldPulse ? "codenames-end-turn-pulse" : ""',
    'translate("codenames.footer.doneGuessing")',
  ]) {
    assert(composition.includes(marker), `source Codenames footer composition missing marker: ${marker}`);
  }

  console.log("[ok] Codenames turn footer matches shipped GameScreen contracts");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
