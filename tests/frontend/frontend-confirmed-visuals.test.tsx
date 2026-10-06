import React from "react";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import test from "node:test";
import * as jsx from "react/jsx-runtime";
import { renderToStaticMarkup } from "react-dom/server";
import { ChessBoardPiece } from "../../frontend-src/screens/chess-board-piece";
import { ChessPiece } from "../../frontend-src/screens/chess-piece";
import { ChessScreen } from "../../frontend-src/screens/chess-screen";
import { CakeDuelStartScreen } from "../../frontend-src/screens/cakeduel-start-screen";
import { IdleUpgradeList } from "../../frontend-src/screens/idle-upgrade-list";
import { PictionaryCover } from "../../frontend-src/screens/pictionary-cover";
import { createSourceTranslate } from "../../frontend-src/i18n/translate";
import { createSourceIdleRuntimeEngine } from "../../frontend-src/state/idle-runtime-engine";
import { createCakeDuelPresentationAssets } from "../../frontend-src/apps/cakeduel-assets";

const chessBundle = readFileSync("public/assets/ChessScreen-D3ynrc3S.js", "utf8");
const start = chessBundle.indexOf("  xi = {") + "  xi = ".length;
const boardPieces = vm.runInNewContext(`(${chessBundle.slice(start, chessBundle.indexOf("\nfunction zn(", start)).trim().replace(/;$/, "")})`, { r: jsx });
const glyphFunction = chessBundle.slice(chessBundle.indexOf("function dt("), chessBundle.indexOf("\nfunction Td("));
const shippedGlyph = vm.runInNewContext(`(${glyphFunction})`, { r: jsx });

test("all twelve board SVGs retain the exact shipped detail paths, transforms, and materials", () => {
  for (const color of ["white", "black"] as const) {
    for (const piece of ["p", "n", "b", "r", "q", "k"]) {
      const actual = renderToStaticMarkup(<ChessBoardPiece piece={piece} color={color} size={70} />);
      const expected = renderToStaticMarkup(boardPieces[(color === "white" ? "w" : "b") + piece.toUpperCase()]);
      assert.equal(actual, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="1 1 43 43" width="70" height="70" aria-hidden="true" style="display:block"><g>${expected}</g></svg>`, `${color} ${piece}`);
    }
  }
});

test("small Chess setup glyphs use the separate shipped light/dark palette and shadow layers", () => {
  for (const color of ["white", "black"] as const) {
    for (const piece of ["p", "n", "b", "r", "q", "k"]) {
      assert.equal(renderToStaticMarkup(<ChessPiece piece={piece} color={color} size={16} />),
        renderToStaticMarkup(shippedGlyph({ piece, color, size: 16 })), `${color} ${piece}`);
    }
  }
});

test("Chess initial rail restores subtitle, five difficulty glyphs/ELO labels, and the tutorial pawn", () => {
  const snapshot = { mounted: true, pending: false, connected: true, state: {
    settings: { playerSide: "white", difficulty: "casual" }, gameState: null, tutorial: null, drawOffer: null, takebackRequest: null,
  } };
  const controller = { snapshot: () => snapshot, subscribe: () => () => {}, retain: () => () => {} };
  for (const locale of ["en", "zh-CN"]) {
    const translate = createSourceTranslate(locale);
    const html = renderToStaticMarkup(<ChessScreen controller={controller as never} translate={translate} />);
    assert.ok(html.includes(translate("chess.subtitle")));
    assert.equal(html.match(/\d+ ELO/g)?.length, 5);
    const difficulties = html.match(/class="source-chess-difficulties">(.*?)<\/div>/)?.[1] ?? "";
    assert.equal(difficulties.match(/<svg /g)?.length, 5);
    const tutorial = html.match(/class="source-chess-tutorial-start"(.*?)<\/button>/)?.[1] ?? "";
    assert.ok(tutorial.includes(translate("chess.start.tutorial")));
    assert.ok(tutorial.includes('width="14"') && tutorial.includes('fill="#1a1a1a"'), "bundle uses a dark pawn, not a speculative lock/disabled state");
    assert.ok(html.includes('class="source-chess-board-column" data-setup="true"'));
  }
});

test("Idle initial empty upgrades retain the shipped affordable header and separator", () => {
  const runtime = createSourceIdleRuntimeEngine();
  try {
    const html = renderToStaticMarkup(<IdleUpgradeList runtime={runtime} snapshot={runtime.snapshot()} />);
    assert.ok(html.includes("可购"));
    assert.ok(html.includes("尚未浮现，继续点击。"));
    assert.ok(html.indexOf("可购") < html.indexOf("尚未浮现"));
    assert.ok(html.includes('h-[2px] flex-1 bg-[var(--px-amber)]/40'));
  } finally {
    runtime.dispose();
  }
});

test("Cake Duel keeps its already-matching shipped panel gradient instead of inventing opacity", () => {
  const html = renderToStaticMarkup(<CakeDuelStartScreen {...createCakeDuelPresentationAssets("en")}
    difficulty="soldier" mounted translate={createSourceTranslate("en")} onDifficultyChange={() => {}}
    onStart={() => {}} onTutorial={() => {}} onHelp={() => {}} />);
  const panel = html.match(/<div[^>]*data-cakeduel-start-panel="true"[^>]*>/)?.[0] ?? "";
  assert.ok(panel.includes("backdrop-blur-md"));
  assert.ok(panel.includes("linear-gradient(180deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.40) 50%, rgba(255,255,255,0.55) 100%)"));
});

test("Pictionary initial cover has the two shipped mode cards without the extra pencil decoration", () => {
  const html = renderToStaticMarkup(<PictionaryCover locale="en" open={false} durationSec={180} disabled={false}
    onDuration={() => {}} onToggle={() => {}} onStart={() => {}} onHelp={() => {}} />);
  assert.equal(html.match(/<article>/g)?.length, 2);
  assert.ok(html.includes("DRAW") && html.includes("GUESS"));
  assert.equal(html.includes("source-pictionary-cover-pencil"), false);
});
