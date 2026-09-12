import assert from "node:assert/strict";
import { build } from "esbuild";
import { chromium } from "playwright";
import { createServer } from "node:http";
import { mkdir, readFile, rm } from "node:fs/promises";
import { resolve, join } from "node:path";

const output = resolve("frontend-games-smoke");
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
  if (files.has(path)) {
    res.setHeader("Content-Type", path.endsWith(".css") ? "text/css" : "text/javascript");
    res.end(files.get(path)); return;
  }
  res.setHeader("Content-Type", "text/html");
  res.end('<!doctype html><meta charset="utf-8"><link rel="stylesheet" href="/fixture.css"><style>html,body,#root{margin:0;width:100%;height:100%;overflow:hidden}*{box-sizing:border-box}</style><div id="root"></div><script type="module" src="/fixture.js"></script>');
});
await new Promise(done => server.listen(0, "127.0.0.1", done));
const origin = "http://127.0.0.1:" + server.address().port;
let browser;
try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1100, height: 720 } });
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(origin);
  await page.locator("[data-chess-board]").waitFor();
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
  assert.equal(await promotion.getByRole("button").count(), 4);
  await promotion.getByRole("button").first().click();
  assert.equal(await page.evaluate(() => window.fixture.commands.at(-1).promotion), "q");
  await page.setViewportSize({ width: 640, height: 480 });
  await page.screenshot({ path: join(output, "chess-compact.png") });

  await page.setViewportSize({ width: 1100, height: 720 });
  await page.goto(origin + "/#pictionary");
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
  assert.deepEqual(errors, [], "source screens must not throw browser errors");
  console.log("PASS: Chess legal/illegal moves and promotion; Pictionary duration, drawing, undo, eraser, round cancellation, snapshot and guesses.");
} finally {
  await browser?.close();
  await new Promise(done => server.close(done));
}
