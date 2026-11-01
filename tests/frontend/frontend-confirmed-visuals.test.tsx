import React from "react";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
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

/**
 * SHA-256 of the rendered markup, captured while each piece still matched the
 * shipped ChessScreen chunk (`xi` board pieces, `dt` setup glyphs) exactly.
 */
const SHIPPED_BOARD_PIECES: Record<string, string> = {
  wp: "440cc9b8ceeb3648da0f0936128e8d704c3e70d2d04da58cbccf71fb275d4e35",
  wn: "811301b9dd801741cba506fa0fe4aa1e57e85b07ed7efc67e45ab2636ee6773c",
  wb: "e81eea9edd9774e6c45532ed129ccd157908daba051c346ef6aab228572430c9",
  wr: "f47f1ccb1f67f3edc062f7b851c1361156c284774f8162c74463b784365bd1fe",
  wq: "2a70aa8f5dcdaf8c1cd17f81325178acf555cbeb7e4f3fdf983e20891d5194c2",
  wk: "7d2180aba23c68476d92af92051e1d6158c703e69cf77b557974dfebecfad362",
  bp: "3f1de8caedfbd1d1ec2c0a785c9f3449570bf033a4be4872d08e16bfdfa71de0",
  bn: "d3d5bc2b131dd26b2d335bb45a842dcb4040003f1f88cea13a131b39e493e6e9",
  bb: "c7d72393c64af58dec7ac92c25362861ab19cb3aed15a4cb007b3bf0860a96e7",
  br: "0ab8031e9d285b5647aa2e823869046d439657c01cb0b6a0d1896fb07b6968a6",
  bq: "644924bcea2c60dfddfd0c7e26b51172e50cce21afc6105d67bac430141c3a6d",
  bk: "dd5ac721a07fd1642a894ff6ff6c88d7d4dbf74bec0def788edcb057f36f64c3",
};
const SHIPPED_SETUP_GLYPHS: Record<string, string> = {
  wp: "3de9696c1a491e8487d71187e83b30ad176cd1d6e49620293ad34d8883a9ceff",
  wn: "b8c973386222c979b24f09c625bbafb4e61f0b87ca8615fa63c96a5cba0b01c3",
  wb: "a06db933927ff4e3714af842883cfc38835659531f90cdabf145a87b74164b14",
  wr: "e65b3c9017b7ae529e805133a600d6c1c9d636c854e8126302264018bca3bc68",
  wq: "ea4534c94ed657d52e73b0af22f325fc24d7ef6b64622cd1a1fc9149a7563f79",
  wk: "d39764aec65bcb054f8e36c5a3b1a35f5073aaffaca117dd540b144f13961ada",
  bp: "465cbf656b3a3a5b4ca317d136e86a8498f2925e284b8ac5e66ede6e777c882c",
  bn: "918420800e544fab93efcf2a4931e871de6ebf25dba9a87ce0ef26ec9ddcfc2f",
  bb: "b01960f8d1038aa5e6c11f10b7d07516023396adb4ebd4688fe1080f4f805534",
  br: "211eb5e554c5d72b7cc093bb9c86b789167d99a6fbd3ded107aee2be5e01f49b",
  bq: "8786e1b6ca2d301127b1ceb668f8c33a4ea5ee890120cc1e54041a2583e45f79",
  bk: "6975944e3d2c41157c90abb798b49edbd3559b77a8b8e805289d5e122fe2cd00",
};
const sha256 = (markup: string) => createHash("sha256").update(markup).digest("hex");

test("all twelve board SVGs retain the exact shipped detail paths, transforms, and materials", () => {
  for (const color of ["white", "black"] as const) {
    for (const piece of ["p", "n", "b", "r", "q", "k"]) {
      const markup = renderToStaticMarkup(<ChessBoardPiece piece={piece} color={color} size={70} />);
      assert.equal(sha256(markup), SHIPPED_BOARD_PIECES[color[0] + piece], `${color} ${piece}`);
    }
  }
});

test("small Chess setup glyphs use the separate shipped light/dark palette and shadow layers", () => {
  for (const color of ["white", "black"] as const) {
    for (const piece of ["p", "n", "b", "r", "q", "k"]) {
      const markup = renderToStaticMarkup(<ChessPiece piece={piece} color={color} size={16} />);
      assert.equal(sha256(markup), SHIPPED_SETUP_GLYPHS[color[0] + piece], `${color} ${piece}`);
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
