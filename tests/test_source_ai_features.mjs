// Full source-app transport integration with a deterministic local model stub.
// Verifies wiring and answer isolation, not a live provider's recognition accuracy.
import assert from "node:assert/strict";
import { createServer as httpServer } from "node:http";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { createServer } from "vite";
import { chromium } from "playwright";
import { probeLaunchOptions } from "../scripts/lib/probe_launch.mjs";
import { startBackend } from "../scripts/lib/backend_launch.mjs";

const build = spawnSync("cargo", ["build", "--locked", "--manifest-path", "rust/Cargo.toml", "-p", "nori-local"], { stdio: "inherit" });
assert.equal(build.status, 0, "build the current source backend before the probe");
process.env.NORI_BACKEND_BIN ??= resolve("rust/target/debug", process.platform === "win32" ? "nori-web.exe" : "nori-web");
const requests = [];
let answer = "cat";
const model = httpServer(async (req, res) => {
  let raw = ""; for await (const chunk of req) raw += chunk;
  const body = JSON.parse(raw); requests.push(body);
  const vision = Array.isArray(body.messages.at(-1).content);
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ choices: [{ message: { content: vision ? answer : "This is an AI analysis of the visible mail window." } }] }));
});
await new Promise(resolve => model.listen(47281, "127.0.0.1", resolve));
process.env.NORI_BACKEND_ORIGIN = "http://127.0.0.1:47282";
let backend, vite, browser;
try {
  backend = await startBackend({ port: 47282, env: { NORI_DISABLE_LIVE_PACK: "1", OPENAI_API_KEY: "", ANTHROPIC_API_KEY: "" }, stdio: "ignore", readyTimeoutMs: 15000 });
  vite = await createServer({ configFile: "frontend-src/app.vite.config.ts", server: { host: "127.0.0.1", port: 47283, strictPort: true, hmr: false } });
  await vite.listen(); browser = await chromium.launch(probeLaunchOptions());
  const page = await browser.newPage({ viewport: { width: 1100, height: 800 }, locale: "en-US" });
  const errors = []; page.on("pageerror", error => errors.push(error.message));
  await page.addInitScript(() => {
    const Native = window.WebSocket;
    window.aiProbe = { sockets: [], sent: [] };
    window.WebSocket = class extends Native {
      constructor(...args) { super(...args); window.aiProbe.sockets.push(this); }
      send(data) {
        if (typeof data === "string") try {
          const frame = JSON.parse(data);
          if (window.aiProbe.conflictOnce && frame.type === "dispatch" && frame.cartridgeId === "chat" && frame.cmd?.type === "playerMessage") {
            window.aiProbe.conflictOnce = false; frame.expectedHeadVersion = 999999; data = JSON.stringify(frame);
          }
          window.aiProbe.sent.push(frame);
        } catch {}
        super.send(data);
      }
    };
    localStorage.setItem("arcade-language", "en");
  });
  await page.goto("http://127.0.0.1:47283", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Wake Nori", exact: true }).click({ timeout: 90000 });
  await page.locator('[data-story-scene="boot"]').waitFor({ state: "detached", timeout: 30000 });
  await page.waitForFunction(() => Boolean(window.NoriAISettings));
  await page.evaluate(() => {
    window.NoriAISettings.save({ enabled: true, provider: "openai-compatible", baseUrl: "http://127.0.0.1:47281/v1", model: "test-vision", apiKey: "test-only-key" });
    const socket = window.aiProbe.sockets.find(s => s.url.endsWith("/api/arcade/web/v1") && s.readyState === 1);
    socket.send(JSON.stringify({ type: "event", channel: "manifold.command.request", requestId: "repair", payload: { command: "client.emitFact", payload: { factId: "system.repaired" } } }));
  });
  await page.locator('[data-nori-dock] [data-app-id="mail"]').click();
  await page.locator('.chip-button').waitFor();
  await page.waitForFunction(() => document.querySelector('.chip-button')?.getAttribute('aria-disabled') === 'false');
  await page.locator('.chip-button').click();
  await page.locator('.chip-target[data-chip-target^="mail:"]').click();
  await page.locator('.chip-readout').getByText("This is an AI analysis of the visible mail window.").waitFor({ timeout: 35000 });
  assert.equal(requests.length, 1);
  assert.equal(typeof requests[0].messages.at(-1).content, "string");
  const scan = await page.evaluate(() => window.aiProbe.sent.find(m => m.channel === "manifold.chip.scan"));
  assert.ok(scan.payload.content.length > 0);
  assert.equal(scan.noriAiConfig.apiKey, "test-only-key");
  assert.ok(!JSON.stringify(scan.payload).includes("test-only-key"));
  console.log("[ok] chip: rendered window text -> configured provider -> readable AI result");

  await page.locator('[data-nori-dock] [data-app-id="pictionary"]').click();
  const game = page.locator('.source-pictionary');
  await game.getByRole("button", { name: "Play", exact: true }).click();
  await game.getByRole("button", { name: "Start session", exact: true }).click();
  const canvas = game.locator('.source-pictionary-canvas canvas');
  await canvas.waitFor();
  answer = (await game.locator('[data-pictionary-hint]').textContent()).trim();
  const box = await canvas.boundingBox(); assert.ok(box);
  await page.mouse.move(box.x + box.width * .25, box.y + box.height * .3); await page.mouse.down();
  await page.mouse.move(box.x + box.width * .65, box.y + box.height * .7, { steps: 15 }); await page.mouse.up();
  await game.locator('.source-pictionary-round-result').getByText("Correct!", { exact: true }).waitFor({ timeout: 35000 });
  const vision = requests.find(body => Array.isArray(body.messages.at(-1).content)); assert.ok(vision);
  const image = vision.messages.at(-1).content.find(block => block.type === "image_url");
  assert.ok(image.image_url.url.startsWith("data:image/png;base64,"));
  assert.ok(!JSON.stringify(vision.messages).includes(`\"word\"`));
  assert.ok(!JSON.stringify(vision.messages).includes(`\"drawingId\"`));
  assert.equal(vision.messages.at(-1).content[0].text, "What object is drawn in this image?");
  const snapshot = await page.evaluate(() => window.aiProbe.sent.find(m => m.channel === "pictionary.snapshot"));
  assert.ok(snapshot.payload.revision > 0); assert.ok(snapshot.payload.width <= 512);
  assert.equal(snapshot.noriAiConfig.apiKey, "test-only-key");
  assert.ok(!JSON.stringify(snapshot.payload).includes("test-only-key"));
  console.log("[ok] pictionary: real canvas PNG -> vision provider -> validated guess and solved round; answer absent from request");
  await page.locator('.nori-window-exclusive').getByRole('button', { name: 'Exit', exact: true }).click();
  await page.evaluate(() => { window.aiProbe.conflictOnce = true; });
  const composer = page.locator('.conversation-composer input');
  await composer.fill('version conflict check'); await composer.press('Enter');
  await page.waitForFunction(() => window.aiProbe.sent.filter(frame => frame.type === 'dispatch' && frame.cmd?.text === 'version conflict check').length === 2, undefined, { timeout: 10000 });
  const attempts = await page.evaluate(() => window.aiProbe.sent.filter(frame => frame.type === 'dispatch' && frame.cmd?.text === 'version conflict check'));
  assert.equal(attempts[0].expectedHeadVersion, 999999);
  assert.ok(attempts[1].expectedHeadVersion < 999999);
  await page.waitForFunction(() => document.querySelector('.conversation-composer input')?.value === '', undefined, { timeout: 10000 });
  assert.equal(await page.locator('.conversation-error').count(), 0);
  assert.deepEqual(errors, []);
  console.log('[ok] chat: an explicit version rejection refreshes state and retries the original message once, without exposing the protocol error');
} finally {
  await browser?.close(); await vite?.close(); await backend?.stop();
  await new Promise(resolve => model.close(resolve));
}
