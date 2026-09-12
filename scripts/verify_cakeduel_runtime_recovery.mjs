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

async function findNormalAppChunk() {
  const assets = await fs.readdir(path.join(ROOT, "public", "assets"));
  const file = assets.find((name) => name.startsWith("NormalApp-") && name.endsWith(".js"));
  if (!file) throw new Error("missing shipped NormalApp chunk");
  return read(path.join("public", "assets", file));
}

async function findCakeDuelStartChunk() {
  const assets = await fs.readdir(path.join(ROOT, "public", "assets"));
  for (const file of assets.filter((name) => name.startsWith("StartScreen-") && name.endsWith(".js"))) {
    const content = await read(path.join("public", "assets", file));
    if (content.includes("cakeduel.start.difficulty") && content.includes("cakeduel.start.startGame")) {
      return content;
    }
  }
  throw new Error("missing shipped Cake Duel StartScreen chunk");
}

async function findCakeDuelResultsChunk() {
  const assets = await fs.readdir(path.join(ROOT, "public", "assets"));
  for (const file of assets.filter((name) => name.startsWith("ResultsScreen-") && name.endsWith(".js"))) {
    const content = await read(path.join("public", "assets", file));
    if (content.includes("cakeduel.results.youWin") && content.includes("cakeduel.results.playAgain")) {
      return content;
    }
  }
  throw new Error("missing shipped Cake Duel ResultsScreen chunk");
}

async function main() {
  const [normalApp, shippedStart, shippedResults, assets, runtime, presentation, recovered, sourceApp, cutover] = await Promise.all([
    findNormalAppChunk(),
    findCakeDuelStartChunk(),
    findCakeDuelResultsChunk(),
    read("frontend-src/apps/cakeduel-assets.ts"),
    read("frontend-src/apps/cakeduel-runtime.ts"),
    read("frontend-src/apps/cakeduel-presentation.tsx"),
    read("frontend-src/apps/recovered-presentation.ts"),
    read("frontend-src/source-app.tsx"),
    read("frontend-src/migration/cutover-status.ts"),
  ]);

  for (const marker of [
    "/cakeduel/cards/",
    "/cakeduel/cards-hd/",
    "/cakeduel/heads/",
    "/cakeduel/card-back.jpg",
    "/cakeduel/cake.png",
    "/cakeduel/trophy.png",
    "/cakeduel/playmat.jpg",
    "/cakeduel/waggle/waggle0.png",
  ]) {
    assert(normalApp.includes(marker), `shipped Cake Duel asset contract changed: ${marker}`);
  }

  for (const marker of ["cakeduel.start.difficulty", "startGame", 'mode: "normal"', 'mode: "tutorial"']) {
    assert(shippedStart.includes(marker), `shipped Cake Duel start-flow marker changed: ${marker}`);
  }
  for (const marker of ["cakeduel.results.youWin", "cakeduel.results.noriWins", "cakeduel.results.playAgain", ".reset()"]){
    assert(shippedResults.includes(marker), `shipped Cake Duel results-flow marker changed: ${marker}`);
  }

  for (const marker of [
    "normalizeCakeDuelAssetLocale",
    'return "zh-CN"',
    'return "ja"',
    'return "en"',
    '"/cakeduel/playmat.jpg"',
    '"/cakeduel/card-back.jpg"',
    '"/cakeduel/cake.png"',
    '"/cakeduel/trophy.png"',
    '"/cakeduel/waggle/waggle3.png"',
    'highResolution ? "cards-hd" : "cards"',
    'return `/cakeduel/heads/${CAKEDUEL_CARD_HEADS[name] ?? "soldier"}.png`',
  ]) {
    assert(assets.includes(marker), `Cake Duel source asset mapping missing marker: ${marker}`);
  }

  for (const marker of [
    "export class CakeDuelRuntimeController",
    'this.games.mount("cakeduel")',
    'this.games.dispatch("cakeduel", cmd)',
    "startNormal(difficulty: CakeDuelDifficulty)",
    'startTutorial(): void',
    'reset(): void',
    'play(action: CakeDuelPlayerCommandAction)',
    "dispose(): void",
  ]) {
    assert(runtime.includes(marker), `Cake Duel source controller missing marker: ${marker}`);
  }

  for (const marker of [
    "createCakeDuelProductionWindowBinding",
    "runtime.controller.ensureMounted()",
    'start: { component: StartRoute, transition: "fade" }',
    'game: { component: GameRoute, transition: "slide-left" }',
    'results: { component: ResultsRoute, transition: "slide-up" }',
    "runtime.controller.startNormal(difficulty)",
    "runtime.controller.startTutorial()",
    "runtime.controller.reset()",
    "runtime.controller.play(action)",
  ]) {
    assert(presentation.includes(marker), `Cake Duel production presentation missing marker: ${marker}`);
  }

  for (const marker of [
    "type CakeDuelPresentationRuntime",
    "cakeduel?: CakeDuelPresentationRuntime",
    "bindings.cakeduel",
    "createCakeDuelProductionWindowBinding(options.cakeduel)",
    "cakeduel: options.cakeduel",
  ]) {
    assert(recovered.includes(marker), `recovered desktop Cake Duel binding missing marker: ${marker}`);
  }

  for (const marker of [
    "new CakeDuelRuntimeController(",
    "createCakeDuelPresentationAssets(navigator.language)",
    "controller: cakeduel",
    "source.cakeduel.dispose()",
  ]) {
    assert(sourceApp.includes(marker), `SourceApp Cake Duel integration missing marker: ${marker}`);
  }

  assert(cutover.includes('{ id: "games", complete: false'), "games cutover boundary must remain incomplete");

  console.log("[ok] Cake Duel production runtime, route binding and shipped asset contracts are source-owned");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
