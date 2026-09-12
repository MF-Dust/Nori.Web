#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import ts from "typescript";

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

async function findNormalAppChunk() {
  const assets = await fs.readdir(path.join(ROOT, "public", "assets"));
  const file = assets.find((name) => name.startsWith("NormalApp-") && name.endsWith(".js"));
  if (!file) throw new Error("missing shipped NormalApp chunk");
  return { file, content: await read(path.join("public", "assets", file)) };
}

function exportedDeclaration(sourceText, fileName, exportedName) {
  const sourceFile = ts.createSourceFile(
    fileName,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.JS,
  );
  let localName = null;
  for (const statement of sourceFile.statements) {
    if (!ts.isExportDeclaration(statement) || !statement.exportClause || !ts.isNamedExports(statement.exportClause)) continue;
    for (const element of statement.exportClause.elements) {
      if (element.name.text === exportedName) {
        localName = element.propertyName?.text ?? element.name.text;
        break;
      }
    }
    if (localName) break;
  }
  if (!localName) return { localName: null, snippet: "<export alias not found>" };

  let snippet = null;
  const visit = (node) => {
    if (snippet) return;
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text === localName
    ) {
      snippet = node.getText(sourceFile).slice(0, 600);
      return;
    }
    if (
      (ts.isFunctionDeclaration(node) || ts.isClassDeclaration(node)) &&
      node.name?.text === localName
    ) {
      snippet = node.getText(sourceFile).slice(0, 600);
      return;
    }
    if (ts.isImportSpecifier(node) && node.name.text === localName) {
      let parent = node.parent;
      while (parent && !ts.isImportDeclaration(parent)) parent = parent.parent;
      snippet = parent ? parent.getText(sourceFile).slice(0, 600) : node.getText(sourceFile);
      return;
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return { localName, snippet: snippet ?? "<local declaration not found>" };
}

async function main() {
  const [shippedStart, shippedResults, shippedPrimary, normalApp, decor, start, results, presentation, assets] = await Promise.all([
    findRouteChunk("StartScreen-", ["cakeduel.start.difficulty", "cakeduel.start.startGame", "cakeduel.title"]),
    findRouteChunk("ResultsScreen-", ["cakeduel.results.youWin", "cakeduel.results.playAgain", "cakeduel.results.playerLabel"]),
    findRouteChunk("CakeDuelPrimaryButton-", ["repeatDelay: 2", "stiffness: 130", "stiffness: 140"]),
    findNormalAppChunk(),
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
    'entryDelay: 0.7',
    "src: f ? E : z",
    "width: 48 + 32 * r",
    "height: 48 + 32 * r",
  ]) {
    assert(shippedResults.includes(marker), `shipped Cake Duel Results decoration marker changed: ${marker}`);
  }

  for (const marker of [
    "transition: { delay: 0.5, duration: 0.4 }",
    "transition: { duration: 3, repeat: 1 / 0, repeatDelay: 2, delay: d }",
    "transition: { delay: n, duration: 0.4 }",
    'transition: { delay: 0.1, type: "spring", stiffness: 140, damping: 16 }',
    'transition: { delay: n, type: "spring", stiffness: 130, damping: 14 }',
  ]) {
    assert(shippedPrimary.includes(marker), `shipped Cake Duel shared route effect marker changed: ${marker}`);
  }

  const victoryAsset = exportedDeclaration(normalApp.content, normalApp.file, "T");
  const defeatAsset = exportedDeclaration(normalApp.content, normalApp.file, "s");
  assert(
    victoryAsset.snippet.includes('"/cakeduel/trophy.png"'),
    `shipped Cake Duel victory overlay export T changed: ${victoryAsset.localName} ${victoryAsset.snippet}`,
  );
  assert(
    defeatAsset.snippet.includes('"/cakeduel/cake.png"'),
    `shipped Cake Duel defeat overlay export s changed: ${defeatAsset.localName} ${defeatAsset.snippet}`,
  );

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
    "overlaySizePx?: number",
    "const overlaySize = overlaySizePx ?? 80 * scale",
    "cakeduel-route-divider 400ms 500ms",
    "entryDelaySec?: number",
    "cakeduel-route-entry 400ms",
    "60% { transform: translateX(200%); }",
    "animation: `cakeduel-route-shimmer 5s ${shimmerDelaySec}s linear infinite`",
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
    "const outcomeOverlaySize = 48 + 32 * interpolation",
    "overlayImage={victory ? trophyImage : cakeImage}",
    "overlaySizePx={outcomeOverlaySize}",
    "const scoreSlots = Math.max(roundsToWin, playerWins, noriWins)",
    "slots={scoreSlots}",
    "<CakeDuelRouteDivider compact={compact} image={cakeImage} />",
    "shimmerDelaySec={1.5}",
    "entryDelaySec={0.7}",
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
  assert(assets.includes('CAKEDUEL_CAKE_IMAGE = "/cakeduel/cake.png"'), "Cake Duel defeat overlay must reuse the shipped cake asset");

  console.log("[ok] Cake Duel Start and Results decorative presentation and shipped effect pacing are source-owned");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
