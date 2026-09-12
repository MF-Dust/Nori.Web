#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function read(relativePath) {
  return fs.readFile(path.join(ROOT, relativePath), "utf8");
}

async function findRouteChunk(prefix, markers) {
  const assets = await fs.readdir(path.join(ROOT, "public", "assets"));
  for (const file of assets.filter((name) => name.startsWith(prefix) && name.endsWith(".js"))) {
    const content = await read(path.join("public", "assets", file));
    if (markers.every((marker) => content.includes(marker))) return content;
  }
  throw new Error(`missing shipped Cake Duel ${prefix} chunk`);
}

async function main() {
  const [shippedStart, shippedResults, decor, start, results, presentation, assets] = await Promise.all([
    findRouteChunk("StartScreen-", ["cakeduel.start.difficulty", "cakeduel.start.startGame", "cakeduel.title"]),
    findRouteChunk("ResultsScreen-", ["cakeduel.results.youWin", "cakeduel.results.playAgain", "cakeduel.results.playerLabel"]),
    read("frontend-src/screens/cakeduel-route-decor.tsx"),
    read("frontend-src/screens/cakeduel-start-screen.tsx"),
    read("frontend-src/screens/cakeduel-results-screen.tsx"),
    read("frontend-src/apps/cakeduel-presentation.tsx"),
    read("frontend-src/apps/cakeduel-assets.ts"),
  ]);

  for (const marker of [
    "Array.from({ length: 12 }",
    "0.55 + 0.45 * i",
    'max-w-[310px]',
    "cakeduel.start.difficulty_soldier_caption",
    "cakeduel.start.difficulty_wizard_caption",
    "cakeduel.start.difficulty_assassin_caption",
    "cakeduel.start.tutorial",
    "cakeduel.help.button",
  ]) {
    assert(shippedStart.includes(marker), `shipped Cake Duel Start decoration marker changed: ${marker}`);
  }

  for (const marker of [
    "Array.from({ length: 18 }",
    'max-w-[280px]',
    "cakeduel.results.playerLabel",
    "cakeduel.results.noriLabel",
    "cakeduel.results.playAgain",
    'shimmerDelay: 1.5',
  ]) {
    assert(shippedResults.includes(marker), `shipped Cake Duel Results decoration marker changed: ${marker}`);
  }

  for (const marker of [
    "const HERO_CARDS",
    '{ card: "defender", x: -100, y: 12, rotate: -22, delayMs: 350 }',
    '{ card: "soldier", x: -48, y: -8, rotate: -10, delayMs: 250 }',
    '{ card: "archer", x: 48, y: -8, rotate: 10, delayMs: 300 }',
    '{ card: "wizard", x: 100, y: 12, rotate: 22, delayMs: 400 }',
    'const count = mode === "start" ? 12 : 18',
    "width: 72 * scale",
    "height: 99 * scale",
    "width: 88 * scale",
    "height: 121 * scale",
    "CakeDuelRouteDivider",
    "CakeDuelRoutePrimaryButton",
    "cakeduel-route-shimmer",
  ]) {
    assert(decor.includes(marker), `source Cake Duel shared route decoration missing marker: ${marker}`);
  }

  for (const marker of [
    '<CakeDuelAmbientParticles mode="start" />',
    "<CakeDuelHeroFan",
    "scale={heroScale}",
    "cardBackImage={cardBackImage}",
    "resolveCardFront={resolveCardFront}",
    "<CakeDuelRouteDivider compact={compact} image={cakeImage} />",
    "<CakeDuelRoutePrimaryButton",
    "fontSize={compact ? 16 : 20}",
    "data-cakeduel-difficulty={item}",
    "grayscale(0.6) brightness(0.8)",
  ]) {
    assert(start.includes(marker), `source Cake Duel Start decoration missing marker: ${marker}`);
  }

  for (const marker of [
    '<CakeDuelAmbientParticles mode={victory ? "victory" : "defeat"} />',
    "<CakeDuelHeroFan",
    "overlayImage={victory ? trophyImage : undefined}",
    "const scoreSlots = Math.max(roundsToWin, playerWins, noriWins)",
    "slots={scoreSlots}",
    "<CakeDuelRouteDivider compact={compact} image={cakeImage} />",
    "shimmerDelaySec={1.5}",
    "fontSize={compact ? 15 : 18}",
  ]) {
    assert(results.includes(marker), `source Cake Duel Results decoration missing marker: ${marker}`);
  }

  for (const marker of [
    "trophyImage: string",
    "cardBackImage={runtime.assets.cardBackImage}",
    "cakeImage={runtime.assets.cakeImage}",
    "trophyImage={runtime.assets.trophyImage}",
    "resolveCardFront={runtime.assets.resolveCardFront}",
  ]) {
    assert(presentation.includes(marker), `Cake Duel route asset binding missing marker: ${marker}`);
  }

  assert(assets.includes("trophyImage: CAKEDUEL_TROPHY_IMAGE"), "Cake Duel trophy must come from shipped production asset mapping");

  console.log("[ok] Cake Duel Start and Results decorative presentation is source-owned against shipped contracts");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
