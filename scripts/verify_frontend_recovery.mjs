#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUTPUT = path.join(ROOT, ".frontend-recovery-ci");

function run(script, args = []) {
  const result = spawnSync(process.execPath, [path.join(ROOT, "scripts", script), ...args], {
    cwd: ROOT,
    stdio: "inherit",
  });
  if (result.status !== 0) throw new Error(`${script} failed with exit code ${result.status}`);
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function main() {
  await fs.rm(OUTPUT, { recursive: true, force: true });
  try {
    run("run_frontend_recovery.mjs", ["--metadata-only", "--output", ".frontend-recovery-ci"]);

    const manifest = JSON.parse(await fs.readFile(path.join(OUTPUT, "manifest.json"), "utf8"));
    const symbols = JSON.parse(await fs.readFile(path.join(OUTPUT, "SYMBOL_INDEX.json"), "utf8"));
    const styles = JSON.parse(await fs.readFile(path.join(OUTPUT, "style-manifest.json"), "utf8"));
    const files = new Set(manifest.chunks.map((chunk) => chunk.file));

    assert(manifest.bundleCount >= 40, `expected at least 40 shipped JS chunks, got ${manifest.bundleCount}`);
    assert(symbols.chunks.length === manifest.bundleCount, "symbol inventory must cover every analyzed JS chunk");
    assert(styles.count > 0, "style recovery must cover shipped CSS chunks");

    const requiredPrefixes = [
      "NormalApp-",
      "LoginPage-",
      "BrowserApp-",
      "MailScreen-",
      "FilesScreen-",
      "MessengerScreen-",
      "ChatPanel-",
      "GameScreen-",
      "ChessScreen-",
    ];
    for (const prefix of requiredPrefixes) {
      assert([...files].some((file) => file.startsWith(prefix)), `missing expected shipped chunk ${prefix}*`);
    }

    for (const feature of ["auth", "arcade", "chat", "browser", "mail", "files", "messenger", "chess"]) {
      assert(Array.isArray(symbols.byFeature[feature]) && symbols.byFeature[feature].length > 0, `missing recovered feature group: ${feature}`);
    }

    // Keep the shared source-owned ChatPanel pinned to subtle contracts in the
    // shipped chunks. These are easy to lose while replacing Radix/motion
    // presentation helpers with maintainable source components.
    const chatPanelChunk = manifest.chunks.find((chunk) => chunk.file.startsWith("ChatPanel-"));
    assert(chatPanelChunk, "missing shipped ChatPanel chunk for parity checks");
    const shippedChatPanel = await fs.readFile(path.join(ROOT, "public", "assets", chatPanelChunk.file), "utf8");
    const sourceChatPanel = await fs.readFile(path.join(ROOT, "frontend-src", "components", "chat-panel.tsx"), "utf8");

    assert(
      shippedChatPanel.includes("gradientDeps: [e]"),
      "shipped ChatPanel must recalculate fade gradients when messages change",
    );
    assert(
      sourceChatPanel.includes("gradientDeps={[messages]}"),
      "source ChatPanel must preserve message-dependent fade recalculation",
    );
    assert(
      shippedChatPanel.includes('className: "px-3 pt-3 pb-3"'),
      "shipped ChatPanel content viewport marker changed; re-check viewportRef recovery",
    );
    assert(
      sourceChatPanel.includes('ref={viewportRef} className="px-3 pt-3 pb-3"'),
      "source ChatPanel viewportRef must target the shipped message-content container",
    );
    assert(
      shippedChatPanel.includes("return String(r);"),
      "shipped ChatPanel unknown-content fallback changed; re-check normalization recovery",
    );
    assert(
      sourceChatPanel.includes("return String(content);"),
      "source ChatPanel must stringify unsupported message content like the shipped chunk",
    );

    const scrollAreaChunk = manifest.chunks.find((chunk) => chunk.file.startsWith("scroll-area-"));
    assert(scrollAreaChunk, "missing shipped scroll-area chunk for ChatPanel parity checks");
    const shippedScrollArea = await fs.readFile(path.join(ROOT, "public", "assets", scrollAreaChunk.file), "utf8");
    assert(
      shippedScrollArea.includes("scrollbar-width:none") &&
        shippedScrollArea.includes("::-webkit-scrollbar{display:none}"),
      "shipped ScrollArea viewport must hide native scrollbars",
    );
    assert(
      sourceChatPanel.includes("[scrollbar-width:none]") &&
        sourceChatPanel.includes("[&::-webkit-scrollbar]:hidden"),
      "source ChatPanel viewport must preserve the shipped hidden-native-scrollbar presentation",
    );

    // Recover the Codenames chat presentation as a source-owned consumer of
    // ChatPanel. The shipped GameScreen formatter has several story-visible
    // branches, including a colored word badge for guesses and special
    // normalization for infinity clues and turn-ending reasons.
    const gameScreenChunk = manifest.chunks.find((chunk) => chunk.file.startsWith("GameScreen-"));
    assert(gameScreenChunk, "missing shipped Codenames GameScreen chunk for parity checks");
    const shippedGameScreen = await fs.readFile(path.join(ROOT, "public", "assets", gameScreenChunk.file), "utf8");
    const sourceCodenamesChat = await fs.readFile(path.join(ROOT, "frontend-src", "apps", "codenames-chat.ts"), "utf8");
    const sourceCodenamesBoard = await fs.readFile(
      path.join(ROOT, "frontend-src", "apps", "codenames-board-presentation.ts"),
      "utf8",
    );

    for (const marker of [
      "codenames.messages.invalidMessage",
      "codenames.messages.gaveClue",
      "codenames.messages.tapped",
      "codenames.messages.hitBystanderTurnEnded",
      "codenames.messages.foundAllTurnEnded",
      "codenames.messages.endedGuessing",
      "codenames.messages.hitAssassin",
      "codenames.messages.suddenDeath",
    ]) {
      assert(shippedGameScreen.includes(marker), `shipped Codenames chat marker changed: ${marker}`);
      assert(sourceCodenamesChat.includes(marker), `source Codenames chat presentation missing: ${marker}`);
    }
    assert(
      shippedGameScreen.includes('s.count === "infinity" ? "∞" : String(s.count)') ||
        shippedGameScreen.includes('s.count === "infinity" ? "∞" : s.count.toString()'),
      "shipped Codenames infinity clue normalization changed",
    );
    assert(
      sourceCodenamesChat.includes('message.count === "infinity" ? "∞" : String(message.count)'),
      "source Codenames chat must preserve infinity clue normalization",
    );
    assert(
      sourceCodenamesChat.includes('type: "textWithBadge"') &&
        sourceCodenamesChat.includes('type: "wordBadge"') &&
        sourceCodenamesChat.includes("cardColor: result"),
      "source Codenames guesses must preserve the shipped colored word-badge presentation",
    );
    assert(
      sourceCodenamesChat.includes('item.message?.type === "system" && item.message.tone !== "info"'),
      "source Codenames chat must preserve shipped system-tone normalization",
    );

    // Pin the next GameScreen slice: board/header presentation helpers. These
    // decisions are visible in every Codenames turn and are independent enough
    // to source-own before the complete screen composition is recovered.
    assert(
      shippedGameScreen.includes("for (let l = 0; l < 25; l++)") &&
        shippedGameScreen.includes("s.key.A[l] === B.AGENT") &&
        shippedGameScreen.includes("s.key.B[l] === B.AGENT") &&
        shippedGameScreen.includes("s.cells[l].solvedBy === null"),
      "shipped Codenames remaining-target counting changed",
    );
    assert(
      sourceCodenamesBoard.includes("const CARD_COUNT = 25") &&
        sourceCodenamesBoard.includes('state.key.A[index] === "AGENT"') &&
        sourceCodenamesBoard.includes('state.key.B[index] === "AGENT"') &&
        sourceCodenamesBoard.includes("cell.solvedBy !== null"),
      "source Codenames board must preserve the shipped 25-cell remaining-target contract",
    );

    for (const marker of [
      "A: 0.774",
      "I: 0.372",
      "M: 0.995",
      "W: 1.103",
      '" ": 0.348',
      '"-": 0.415',
    ]) {
      assert(shippedGameScreen.includes(marker), `shipped Codenames word-width marker changed: ${marker}`);
      assert(sourceCodenamesBoard.includes(marker), `source Codenames word sizing missing marker: ${marker}`);
    }
    assert(
      shippedGameScreen.includes("pt = 134") && shippedGameScreen.includes("mt = 24") && shippedGameScreen.includes("yt = 13"),
      "shipped Codenames card-word sizing bounds changed",
    );
    assert(
      sourceCodenamesBoard.includes("const CARD_WORD_TARGET_WIDTH = 134") &&
        sourceCodenamesBoard.includes("const CARD_WORD_MAX_SIZE = 24") &&
        sourceCodenamesBoard.includes("const CARD_WORD_MIN_SIZE = 13"),
      "source Codenames word sizing must preserve shipped width and font-size bounds",
    );

    for (const marker of [
      "game-card-btn",
      "cursor-pointer",
      "cursor-not-allowed",
      "cursor-default",
      "opacity-50",
      "game-card-hover",
      "game-card-active",
      "game-card-selected",
      "z-[100]",
    ]) {
      assert(shippedGameScreen.includes(marker), `shipped Codenames card-state marker changed: ${marker}`);
      assert(sourceCodenamesBoard.includes(marker), `source Codenames card interaction missing marker: ${marker}`);
    }

    console.log(`[ok] frontend recovery covers ${manifest.bundleCount} JavaScript and ${styles.count} CSS chunks`);
  } finally {
    await fs.rm(OUTPUT, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});