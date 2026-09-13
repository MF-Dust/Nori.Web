import assert from "node:assert/strict";
import { build } from "esbuild";
import { chromium } from "playwright";
import { createServer } from "node:http";
import { mkdir, readFile } from "node:fs/promises";
import { resolve, join } from "node:path";

const output = resolve("frontend-games-smoke");
const appHtml = await readFile(".frontend-app-build/index.html", "utf8");
const appStyles = [...appHtml.matchAll(/href="(\/assets\/[^" ]+\.css)"/g)].map(match => match[1]);
if (!appStyles.length) throw new Error("Run npm run frontend:app:build before the games smoke test");
const sourceCss = (await Promise.all(appStyles.map(path => readFile(".frontend-app-build" + path, "utf8")))).join("\n");
await mkdir(output, { recursive: true });
const compiled = await build({
  entryPoints: ["tests/frontend-games-browser.tsx"], bundle: true, write: false,
  outfile: "fixture.js", format: "esm", jsx: "automatic", define: { "process.env.NODE_ENV": '"production"' },
});
const files = new Map(compiled.outputFiles.map(file => [file.path.endsWith(".css") ? "/fixture.css" : "/fixture.js", file.contents]));
const server = createServer(async (req, res) => {
  const path = new URL(req.url, "http://localhost").pathname;
  if (path === "/pictionary/drawings.json") {
    res.setHeader("Content-Type", "application/json");
    res.end(await readFile("public/pictionary/drawings.json")); return;
  }
  if (path === "/source.css") {
    res.setHeader("Content-Type", "text/css");
    res.end(sourceCss); return;
  }
  if (files.has(path)) {
    res.setHeader("Content-Type", path.endsWith(".css") ? "text/css" : "text/javascript");
    res.end(files.get(path)); return;
  }
  res.setHeader("Content-Type", "text/html");
  res.end('<!doctype html><meta charset="utf-8"><link rel="stylesheet" href="/source.css"><link rel="stylesheet" href="/fixture.css"><style>html,body,#root{margin:0;width:100%;height:100%;overflow:hidden}*{box-sizing:border-box}</style><div id="root"></div><script type="module" src="/fixture.js"></script>');
});
await new Promise(done => server.listen(0, "127.0.0.1", done));
const origin = "http://127.0.0.1:" + server.address().port;
let browser;
try {
  browser = await chromium.launch({ headless: true, executablePath: process.env.NORI_TEST_CHROMIUM || undefined });
  const page = await browser.newPage({ viewport: { width: 1100, height: 720 } });
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(origin);
  await page.locator("[data-chess-board]").waitFor();
  assert.equal(await page.evaluate(() => {
    const probe = document.createElement("div"); probe.className = "bg-primary"; document.body.append(probe);
    const background = getComputedStyle(probe).backgroundColor; probe.remove(); return background === "rgba(0, 0, 0, 0)";
  }), false, "semantic theme colors must compile into actual utilities");
  assert.equal(await page.locator("[data-chess-square]").count(), 64);
  await page.evaluate(() => window.fixture.chess());
  await page.locator('[data-chess-square="e2"]').click();
  await page.locator('[data-chess-square="e5"]').click();
  assert.equal(await page.evaluate(() => window.fixture.commands.length), 0, "illegal move must not dispatch");
  await page.locator('[data-chess-square="e2"]').click();
  await page.locator('[data-chess-square="e4"]').click();
  assert.deepEqual(await page.evaluate(() => window.fixture.commands.at(-1)), { type: "move", from: "e2", to: "e4" });
  await page.screenshot({ path: join(output, "chess-desktop.png") });
  await page.evaluate(() => window.fixture.chess("4k3/P7/8/8/8/8/8/4K3 w - - 0 1"));
  await page.locator('[data-chess-square="a7"]').click();
  await page.locator('[data-chess-square="a8"]').click();
  const promotion = page.getByRole("dialog");
  await promotion.waitFor();
  assert.equal(await promotion.getByRole("button", { name: /^Promote to/ }).count(), 4);
  await promotion.getByRole("button", { name: "Promote to q", exact: true }).click();
  assert.equal(await page.evaluate(() => window.fixture.commands.at(-1).promotion), "q");
  await page.setViewportSize({ width: 640, height: 480 });
  await page.screenshot({ path: join(output, "chess-compact.png") });

  await page.setViewportSize({ width: 1100, height: 720 });
  await page.clock.install();
  await page.goto(origin + "/pictionary#pictionary");
  await page.getByRole("button", { name: "Play", exact: true }).click();
  await page.getByRole("button", { name: "5 min", exact: true }).click();
  await page.getByRole("button", { name: "Start session", exact: true }).click();
  const start = await page.evaluate(() => window.fixture.commands.at(-1));
  assert.equal(start.type, "startSession"); assert.equal(start.settings.sessionDurationMs, 300000);
  await page.evaluate(() => window.fixture.round());
  const canvas = page.getByLabel("Drawing canvas");
  await canvas.waitFor();
  const box = await canvas.boundingBox();
  assert.ok(box && box.width > 100 && box.height > 100);
  await page.mouse.move(box.x + 30, box.y + 30); await page.mouse.down();
  await page.mouse.move(box.x + 150, box.y + 100, { steps: 12 }); await page.mouse.up();
  const stroke = await page.evaluate(() => window.fixture.strokes.at(-1));
  assert.ok(stroke.points.length >= 2);
  assert.ok(stroke.points.every(point => point.x >= 0 && point.x <= 1 && point.y >= 0 && point.y <= 1));
  assert.equal(stroke.width, 6);
  const drawn = await page.evaluate(() => window.fixture.snapshot());
  assert.equal(Math.max(drawn.width, drawn.height), 256);
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  assert.notEqual(await page.evaluate(() => window.fixture.snapshot().image), drawn.image);
  await page.getByRole("button", { name: "Eraser", exact: true }).click();
  await page.mouse.move(box.x + 35, box.y + 35); await page.mouse.down();
  await page.mouse.move(box.x + 120, box.y + 90, { steps: 6 }); await page.mouse.up();
  assert.equal(await page.evaluate(() => window.fixture.strokes.at(-1).width), 54);
  await page.screenshot({ path: join(output, "pictionary-drawing.png") });
  // A pointer still held while the replicated round changes must never submit into the new round.
  const count = await page.evaluate(() => window.fixture.strokes.length);
  await page.mouse.move(box.x + 30, box.y + 30); await page.mouse.down();
  await page.mouse.move(box.x + 140, box.y + 90, { steps: 4 });
  await page.evaluate(() => window.fixture.round("two"));
  await page.mouse.up();
  assert.equal(await page.evaluate(() => window.fixture.strokes.length), count);
  await page.evaluate(() => window.fixture.round("three", "agent"));
  await page.getByLabel("Your guess").fill("apple");
  await page.getByRole("button", { name: "Send", exact: true }).click();
  assert.equal(await page.evaluate(() => window.fixture.commands.at(-1).text), "apple");
  await page.getByRole("button", { name: "Skip round", exact: true }).click();
  assert.equal(await page.evaluate(() => window.fixture.commands.at(-1).type), "skipRound");
  await page.screenshot({ path: join(output, "pictionary-guessing.png") });
  const hint = page.locator("[data-pictionary-hint]");
  await page.evaluate(() => window.fixture.round("hint-one", "agent"));
  assert.equal(await hint.textContent(), "_ _ _ _ _");
  await page.clock.runFor(6100);
  assert.match(await hint.textContent(), /[A-Z]/);
  assert.ok(await page.evaluate(() => window.fixture.sounds.includes("partygames-pictionary-hint-reveal")));
  await page.screenshot({ path: join(output, "pictionary-progressive-hint.png") });
  await page.evaluate(() => window.fixture.round("hint-two", "agent"));
  assert.equal(await hint.textContent(), "_ _ _ _ _", "the same word in a new round must reset hints");
  await page.evaluate(() => {
    const state = structuredClone(window.fixture.pictionaryState());
    state.gameState.round.status = "solved";
    state.gameState.round.solvedAtMs = Date.now();
    state.gameState.round.lastGuess = { by: "player", text: "apple", correct: true, atMs: Date.now() };
    window.fixture.setPictionary(state);
  });
  assert.equal(await hint.textContent(), "apple");
  const hintSounds = await page.evaluate(() => window.fixture.sounds.filter(cue => cue.endsWith("hint-reveal")).length);
  for (let second = 0; second < 8; second++) { await page.clock.runFor(1000); await hint.textContent(); }
  assert.equal(await page.evaluate(() => window.fixture.sounds.filter(cue => cue.endsWith("hint-reveal")).length), hintSounds);
  assert.equal(await page.evaluate(() => window.fixture.sounds.filter(cue => cue.endsWith("correct-answer")).length), 1);
  assert.ok(await page.evaluate(() => window.fixture.sounds.includes("partygames-pictionary-next-round-countdown")));
  assert.equal(await page.evaluate(() => window.fixture.loops()), 0, "a solved round must stop pen audio");
  await page.evaluate(() => {
    window.fixture.round("hint-zh", "agent");
    const state = structuredClone(window.fixture.pictionaryState());
    state.settings.locale = "zh-CN";
    state.gameState.round.word = "苹果";
    state.gameState.round.pinyin = [["p", "ing"], ["g", "uo"]];
    window.fixture.setPictionary(state);
  });
  assert.equal(await hint.textContent(), "__ __");
  await page.clock.runFor(6100);
  assert.equal(await hint.textContent(), "__ g_");
  await page.screenshot({ path: join(output, "pictionary-chinese-hint.png") });
  await page.evaluate(() => {
    window.fixture.round("low-time", "player");
    const state = structuredClone(window.fixture.pictionaryState());
    state.settings.sessionDurationMs = 25000;
    window.fixture.setPictionary(state);
  });
  await page.clock.runFor(1200);
  assert.ok(await page.evaluate(() => window.fixture.sounds.includes("partygames-pictionary-timer-low")));
  await page.mouse.move(box.x + 30, box.y + 30); await page.mouse.down();
  await page.clock.runFor(50);
  assert.equal(await page.evaluate(() => window.fixture.loops()), 1);
  await page.clock.runFor(200);
  assert.equal(await page.evaluate(() => window.fixture.loops()), 0, "a stationary pointer stops scratching after 180 ms");
  await page.mouse.up();
  await page.evaluate(() => { window.fixture.round("disconnect-hint", "agent"); window.fixture.pictionaryConnection(false); });
  assert.equal(await hint.textContent(), "_ _ _ _ _");
  await page.clock.runFor(6100);
  assert.equal(await hint.textContent(), "_ _ _ _ _", "disconnection must stop hints without disclosing the word");
  assert.equal(await page.evaluate(() => window.fixture.loops()), 0);
  await page.clock.resume();
  await page.goto(origin + "/codenames#codenames");
  await page.getByRole("button", { name: "Start Adventure", exact: true }).click();
  assert.equal(await page.evaluate(() => window.fixture.commands.at(-1).settings.tokens), 9);
  await page.evaluate(() => window.fixture.codenames(true));
  const firstCard = page.locator('[data-card-cell="0"] button');
  assert.match(await firstCard.evaluate(element => getComputedStyle(element).backgroundImage), /gradient/, "the source build must include the card face stylesheet");
  await firstCard.click();
  assert.equal(await page.evaluate(() => window.fixture.commands.length), 1, "first card tap is confirmation only");
  await firstCard.click();
  assert.deepEqual(await page.evaluate(() => window.fixture.commands.at(-1)), { type: "submitGuess", cell: 0 });
  await page.screenshot({ path: join(output, "codenames-game.png") });
  await page.evaluate(() => window.fixture.revealCodenames());
  assert.equal(await page.locator('[data-card-cell="0"] [data-codenames-revealed-agent]').count(), 0);
  await page.locator('[data-codenames-flying-card="agent"]').waitFor();
  await page.screenshot({ path: join(output, "codenames-card-flight.png") });
  await page.locator('[data-card-cell="0"] [data-codenames-revealed-agent]').waitFor();
  assert.ok(await page.evaluate(() => window.fixture.sounds.includes("boardgames-codenames-agent-card-land")));
  await page.evaluate(() => window.fixture.revealCodenames(1, "bystander"));
  await page.locator('[data-codenames-flying-card="bystander"]').waitFor();
  await page.locator('[data-card-cell="1"] [data-codenames-bystander-mark]').waitFor();
  await page.evaluate(() => { window.fixture.revealCodenames(2); window.fixture.codenames(true); });
  await page.waitForTimeout(2800);
  assert.equal(await page.locator('[data-codenames-flying-card]').count(), 0);
  assert.equal(await page.locator('[data-codenames-revealed-agent]').count(), 0, "a reseed must cancel old reveal work");
  await page.evaluate(() => window.fixture.codenamesTutorial("player_first_treasure"));
  const tutorialCommands = await page.evaluate(() => window.fixture.commands.length);
  assert.equal(await page.locator('[data-card-cell="1"] button').isDisabled(), true);
  await page.locator('[data-card-cell="0"] button').click();
  await page.locator('[data-card-cell="0"] button').click();
  assert.equal(await page.evaluate(() => window.fixture.commands.length), tutorialCommands + 1);
  await page.evaluate(() => window.fixture.codenamesTutorial("nori_opening_clue"));
  assert.equal(await page.locator('[data-card-cell="0"] button').isDisabled(), true);
  assert.deepEqual(errors, [], "source screens must not throw browser errors");
  console.log("PASS: Chess moves/promotion; Pictionary drawing/snapshots, English/Chinese hints, cancellation and audio; Codenames guesses, flight/reveal pacing and reseed cancellation.");
} finally {
  await browser?.close();
  await new Promise(done => server.close(done));
}
