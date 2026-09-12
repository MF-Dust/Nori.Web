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

async function main() {
  const assets = await fs.readdir(path.join(ROOT, "public", "assets"));
  const gameScreenFile = assets.find((file) => file.startsWith("GameScreen-") && file.endsWith(".js"));
  const helpOverlayFile = assets.find((file) => file.startsWith("HelpOverlay-") && file.endsWith(".js"));
  assert(gameScreenFile, "missing shipped Codenames GameScreen chunk");
  assert(helpOverlayFile, "missing shipped Codenames HelpOverlay chunk");

  const shipped = await read(path.join("public", "assets", gameScreenFile));
  const shippedHelp = await read(path.join("public", "assets", helpOverlayFile));
  const clue = await read("frontend-src/apps/codenames-clue-presentation.ts");
  const clueOverlay = await read("frontend-src/screens/codenames-clue-overlay.tsx");
  const header = await read("frontend-src/screens/codenames-header.tsx");
  const keyCard = await read("frontend-src/screens/codenames-key-card.tsx");
  const board = await read("frontend-src/screens/codenames-board.tsx");
  const help = await read("frontend-src/screens/codenames-help-overlay.tsx");
  const flyingCard = await read("frontend-src/screens/codenames-flying-card.tsx");
  const screen = await read("frontend-src/screens/codenames-screen.tsx");
  const cutover = await read("frontend-src/migration/cutover-status.ts");

  for (const marker of [
    "const Pe = 300",
    "et = 120",
    's.word.toUpperCase()',
    's.count === "infinity" ? "∞"',
    "codenames.game.waitingForYou",
    "codenames.game.waitingForNori",
    "codenames.game.norisClue",
    "codenames.game.yourClue",
    '"your-turn": 2e3',
    '"agent-turn": 2e3',
    '"sudden-death": 3e3',
    "win: 4e3",
    "lose: 4e3",
    "codenames.overlay.yourTurn",
    "codenames.overlay.noriTurn",
    "codenames.overlay.suddenDeath",
    "codenames.overlay.win",
    "codenames.overlay.lose",
  ]) {
    assert(shipped.includes(marker), `shipped Codenames clue/overlay marker changed: ${marker}`);
  }

  for (const marker of [
    'className:\n      "shrink-0 h-16 px-3 @[820px]/game:h-20 @[820px]/game:px-4 border-b bg-card/50 backdrop-blur-sm relative z-20"',
    'className: "grid grid-cols-3 items-center gap-4 h-full"',
    "codenames.game.roundsLeft",
    "codenames.game.treasuresLeft",
    "codenames.keyCard.yourKey",
    'className: "grid grid-cols-5 gap-1"',
    'isSelectable: o && c === B.AGENT',
    'const u = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, "infinity"]',
    'f.type === "HUMAN_GIVING_CLUE"',
    'f.type !== "GAME_OVER"',
    "codenames.chat.cluePlaceholder",
    "codenames.chat.messagePlaceholder",
    "codenames.chat.waiting",
    "codenames.chat.noTurns",
  ]) {
    assert(shipped.includes(marker), `shipped Codenames header/key/chat marker changed: ${marker}`);
  }

  for (const marker of [
    'className: "h-full flex flex-col bg-background/50 relative @container/game"',
    '"flex-1 min-h-0 p-2 gap-2 @[820px]/game:p-3 @[820px]/game:gap-3 flex bg-muted/50"',
    '"flex-1 min-w-0 flex flex-col gap-2 @[820px]/game:gap-3"',
    '"w-48 @[820px]/game:w-60 shrink-0 min-h-0 flex flex-col gap-2 @[820px]/game:gap-3"',
    "e.jsx(wt, {",
    "e.jsx(Qt, { activeOverlay: L, clueHighlight: Ce })",
    "e.jsx(Ct, {",
    "e.jsx(At, { keySide: d.key[N] })",
    "children: e.jsx(Ke, {",
    'className: "fixed pointer-events-none z-50"',
    "onAnimationComplete: () =>",
    "rotate: c ? 180 : 0",
    "e.jsx(Lt, {})",
  ]) {
    assert(shipped.includes(marker), `shipped Codenames screen composition changed: ${marker}`);
  }

  for (const marker of [
    'a.key === "Escape"',
    'role: "dialog"',
    "codenames.help.title",
    "codenames.help.goal.title",
    "codenames.help.goal.body",
    "codenames.help.maps.title",
    "codenames.help.maps.body",
    "codenames.help.hints.title",
    "codenames.help.hints.body",
    "codenames.help.search.title",
    "codenames.help.search.treasure",
    "codenames.help.search.berry",
    "codenames.help.search.monster",
    "codenames.help.rounds.title",
    "codenames.help.rounds.body",
  ]) {
    assert(shippedHelp.includes(marker), `shipped Codenames help marker changed: ${marker}`);
  }

  for (const marker of [
    "CODENAMES_CLUE_REVEAL_DELAY_MS = 300",
    "CODENAMES_CLUE_REVEAL_STEP_MS = 120",
    "CODENAMES_CLUE_COUNT_REVEAL_DELAY_MS = 300",
    "CODENAMES_CLUE_COUNT_OPTIONS",
    '"infinity"',
    "parseCodenamesClueSubmission",
    '/^(.+?)[,\\s]+(\\d+|∞|infinity)$/i',
    '"your-turn": 2_000',
    '"agent-turn": 2_000',
    '"sudden-death": 3_000',
    "win: 4_000",
    "lose: 4_000",
    'translationKeyBase: "codenames.overlay.yourTurn"',
    'translationKeyBase: "codenames.overlay.noriTurn"',
  ]) {
    assert(clue.includes(marker), `source Codenames clue presentation missing marker: ${marker}`);
  }

  for (const marker of [
    "CodenamesClueDisplay",
    "CodenamesCompactClue",
    "CODENAMES_CLUE_REVEAL_DELAY_MS",
    "CODENAMES_CLUE_REVEAL_STEP_MS",
    "data-codenames-clue-reveal",
    "data-codenames-board-overlay",
    "CODENAMES_BOARD_OVERLAY_DURATION_MS[activeOverlay]",
    "CODENAMES_BOARD_OVERLAY_PRESENTATION[activeOverlay]",
  ]) {
    assert(clueOverlay.includes(marker), `source Codenames clue overlay missing marker: ${marker}`);
  }

  for (const marker of [
    'className="shrink-0 h-16 px-3 @[820px]/game:h-20 @[820px]/game:px-4 border-b bg-card/50 backdrop-blur-sm relative z-20"',
    'className="grid grid-cols-3 items-center gap-4 h-full"',
    "countRemainingCodenamesTargets(gameState)",
    'translate("codenames.game.roundsLeft")',
    'translate("codenames.game.treasuresLeft")',
    "<CodenamesClueDisplay",
  ]) {
    assert(header.includes(marker), `source Codenames header missing marker: ${marker}`);
  }

  for (const marker of [
    "data-codenames-key-card",
    'className="grid grid-cols-5 gap-1"',
    'const selectable = active && role === "AGENT"',
    "selectedCards?.has(index)",
    "onMouseEnter",
    "onSelect?.(index)",
  ]) {
    assert(keyCard.includes(marker), `source Codenames key card missing marker: ${marker}`);
  }

  for (const marker of [
    "data-codenames-revealed-agent",
    "data-codenames-revealed-assassin",
    "data-codenames-bystander-mark",
    "data-codenames-card-shake",
    'translate?.("codenames.game.tapToConfirm")',
    "game-card-tooltip",
  ]) {
    assert(board.includes(marker), `source Codenames card reveal missing marker: ${marker}`);
  }

  for (const marker of [
    "data-codenames-help-overlay",
    "KeyboardEvent",
    'event.key !== "Escape"',
    'role="dialog"',
    "codenames.help.title",
    "codenames.help.goal.title",
    "codenames.help.maps.title",
    "codenames.help.hints.title",
    "codenames.help.search.title",
    "codenames.help.search.treasure",
    "codenames.help.search.berry",
    "codenames.help.search.monster",
    "codenames.help.rounds.title",
    "onClick={onClose}",
  ]) {
    assert(help.includes(marker), `source Codenames help overlay missing marker: ${marker}`);
  }

  for (const marker of [
    "createPortal",
    "element.animate(",
    "card.sourceRect",
    "card.targetRect",
    "card.rotate180",
    "animation.onfinish",
    "onLanded?.()",
    "data-codenames-flying-card",
  ]) {
    assert(flyingCard.includes(marker), `source Codenames flying-card transition missing marker: ${marker}`);
  }

  for (const marker of [
    'className="h-full flex flex-col bg-background/50 relative @container/game"',
    'className="flex-1 min-h-0 p-2 gap-2 @[820px]/game:p-3 @[820px]/game:gap-3 flex bg-muted/50"',
    'className="flex-1 min-w-0 flex flex-col gap-2 @[820px]/game:gap-3"',
    'className="w-48 @[820px]/game:w-60 shrink-0 min-h-0 flex flex-col gap-2 @[820px]/game:gap-3"',
    "<CodenamesHeader",
    "<CodenamesBoard",
    "<CodenamesClueOverlay",
    "<CodenamesFooter",
    "<CodenamesKeyCard",
    "<ChatPanel",
    "<CodenamesFlyingCard",
    "<CodenamesHelpOverlay",
    "useState(false)",
    "onHelp={openHelp}",
    "recoverCodenamesChatMessages(messages, translate)",
    "parseCodenamesClueSubmission(value)",
    "CODENAMES_CLUE_COUNT_OPTIONS.map",
    'uiState.type === "HUMAN_GIVING_CLUE"',
    'uiState.type !== "GAME_OVER"',
    'translate("codenames.chat.cluePlaceholder")',
    'translate("codenames.chat.messagePlaceholder")',
    'disabledPlaceholder={translate("codenames.chat.waiting")}',
    'emptyMessage={translate("codenames.chat.noTurns")}',
  ]) {
    assert(screen.includes(marker), `source Codenames GameScreen missing marker: ${marker}`);
  }

  assert(
    cutover.includes('Codenames presentation is source-owned') &&
      cutover.includes('flying-card transition behavior') &&
      cutover.includes('Cake Duel, Chess and Pictionary still need migration'),
    "cutover status must record Codenames complete while keeping Games incomplete",
  );

  console.log("[ok] Codenames GameScreen presentation is source-owned against shipped contracts");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
