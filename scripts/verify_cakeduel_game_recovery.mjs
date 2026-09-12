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

async function findCakeDuelChunk() {
  const assets = await fs.readdir(path.join(ROOT, "public", "assets"));
  for (const file of assets.filter((name) => name.startsWith("GameScreen-") && name.endsWith(".js"))) {
    const content = await read(path.join("public", "assets", file));
    if (content.includes("cakeduel.game.turn_") && content.includes("cakeduel.game.action.callBluff")) {
      return content;
    }
  }
  throw new Error("missing shipped Cake Duel GameScreen chunk");
}

async function main() {
  const shipped = await findCakeDuelChunk();
  const model = await read("frontend-src/apps/cakeduel-game-presentation.ts");
  const card = await read("frontend-src/screens/cakeduel-card.tsx");
  const hand = await read("frontend-src/screens/cakeduel-hand.tsx");
  const hud = await read("frontend-src/screens/cakeduel-hud.tsx");
  const table = await read("frontend-src/screens/cakeduel-table.tsx");
  const actions = await read("frontend-src/screens/cakeduel-action-panel.tsx");
  const board = await read("frontend-src/screens/cakeduel-game-board.tsx");
  const banner = await read("frontend-src/screens/cakeduel-banner.tsx");
  const overlays = await read("frontend-src/screens/cakeduel-overlays.tsx");
  const screen = await read("frontend-src/screens/cakeduel-screen.tsx");

  for (const marker of [
    '"data-card-id"',
    '"data-pile-target"',
    '"cakeduel.game.turn_"',
    '"cakeduel.game.action.respondHint"',
    '"cakeduel.game.action.passAttackConfirm"',
    '"cakeduel.game.action.callBluff"',
    '"cakeduel.banner.victory"',
    '"cakeduel.banner.defeat"',
    '"wolfy-taunt"',
    "const jr = 3500",
    "const De = 7",
    "rr = 14",
    "Or = 1100",
  ]) {
    assert(shipped.includes(marker), `shipped Cake Duel game marker changed: ${marker}`);
  }

  for (const marker of [
    "CAKEDUEL_MAX_VISIBLE_CAKE_TOKENS = 7",
    "CAKEDUEL_ATTACK_PASS_CONFIRM_MS = 3_500",
    "CAKEDUEL_REVEALED_PILE_GAP_PX = 14",
    "deriveCakeDuelHudPresentation",
    "deriveCakeDuelActionPanelMode",
    "deriveCakeDuelPileLayout",
    "mapCakeDuelSelectedEntityIdsToHandIndices",
    "resolveCakeDuelDefaultClaim",
    "isCakeDuelTutorialClaimSelectionReady",
    "deriveCakeDuelCakeTokenLayout",
  ]) {
    assert(model.includes(marker), `Cake Duel game model missing marker: ${marker}`);
  }

  const sourceContracts = [
    [card, ["CakeDuelCard", "data-cakeduel-card", "rotateY", "getCakeDuelCardShadow"]],
    [hand, ["CakeDuelHand", "setPointerCapture", "reorderCakeDuelCards", "data-cakeduel-hand"]],
    [hud, ["CakeDuelHud", "data-cakeduel-turn-banner", "deriveCakeDuelHudPresentation"]],
    [table, ["CakeDuelPile", "CakeDuelPiles", "CakeDuelDeck", "CakeDuelCakeRail", "data-pile-target"]],
    [actions, ["CakeDuelActionPanel", "block_response", "attack_pass", "CAKEDUEL_ATTACK_PASS_CONFIRM_MS"]],
    [board, ["CakeDuelGameBoard", "CakeDuelActionPanel", "CakeDuelPiles", "CakeDuelDeck", "CakeDuelCakeRail"]],
    [banner, ["CakeDuelBanner", "cakeduel.banner.victory", "cakeduel.banner.defeat", "data-cakeduel-banner"]],
    [overlays, ["CakeDuelWolfyTaunt", "WOLFY_FRAME_CYCLE_MS = 1_100", "CakeDuelActionError"]],
    [screen, ["CakeDuelScreen", "CakeDuelMeasuredLayout", 'data-cakeduel-screen={effectiveStage}']],
  ];

  for (const [source, markers] of sourceContracts) {
    for (const marker of markers) {
      assert(source.includes(marker), `Cake Duel source presentation missing marker: ${marker}`);
    }
  }

  console.log("[ok] Cake Duel cards, hands, HUD, table, actions, banners and game screen match shipped contracts");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
