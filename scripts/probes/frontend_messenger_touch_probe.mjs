import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { chromium } from "playwright";
import { createServer } from "vite";
import { probeLaunchOptions } from "../lib/probe_launch.mjs";

/**
 * Messenger window lifecycle on the source desktop, plus a touch/narrow pass
 * over the four games. Agent dialogue stays out of scope: the local backend
 * still answers nori_talk.request with noop.
 */

const output = resolve(".artifacts/messenger-touch");
await mkdir(output, { recursive: true });
const backendPort = 47211;
const sourcePort = 47212;
const origin = `http://127.0.0.1:${sourcePort}`;

function installTransportProbe() {
  const Native = window.WebSocket;
  window.lifecycle = { sockets: [], sent: [] };
  window.WebSocket = class extends Native {
    constructor(...args) {
      super(...args);
      window.lifecycle.sockets.push(this);
    }
    send(data) {
      if (typeof data === "string") {
        try {
          const frame = JSON.parse(data);
          window.lifecycle.sent.push(frame.type);
        } catch {}
      }
      super.send(data);
    }
  };
}

async function startBackend() {
  const backend = spawn(
    process.env.NORI_TEST_PYTHON ?? "python",
    ["-m", "uvicorn", "server:app", "--host", "127.0.0.1", "--port", String(backendPort)],
    {
      env: { ...process.env, NORI_DISABLE_LIVE_PACK: "1", OPENAI_API_KEY: "", ANTHROPIC_API_KEY: "" },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  let log = "";
  backend.stdout.on("data", (data) => (log = (log + data).slice(-4000)));
  backend.stderr.on("data", (data) => (log = (log + data).slice(-4000)));
  const backendOrigin = `http://127.0.0.1:${backendPort}`;
  for (let attempt = 0; attempt < 150; attempt++) {
    try {
      if ((await fetch(`${backendOrigin}/api/auth/get-session`)).ok) return backend;
    } catch {}
    if (backend.exitCode !== null) throw new Error(log);
    await new Promise((done) => setTimeout(done, 100));
  }
  throw new Error(log);
}

async function boot(page) {
  await page.addInitScript(installTransportProbe);
  await page.addInitScript(() => localStorage.setItem("arcade-language", "en-US"));
  await page.goto(origin, { waitUntil: "domcontentloaded" });
  await page.locator('[data-live2d-status="ready"]').waitFor({ timeout: 60000 });
}

async function messengerLifecycle(browser) {
  const page = await browser.newPage({ viewport: { width: 1100, height: 720 } });
  page.setDefaultTimeout(30000);
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  try {
    await boot(page);
    const open = async () => {
      await page.locator('[data-nori-dock] [data-app-id="signal"]').click();
      const host = page.locator(".nori-window-glass").filter({
        has: page.getByPlaceholder("Enter password", { exact: true }),
      });
      await host.waitFor();
      return host;
    };
    const host = await open();
    const password = host.getByPlaceholder("Enter password", { exact: true });
    await password.fill("lifecycle-draft");
    await host.getByRole("button", { name: "Close", exact: true }).click();
    await host.waitFor({ state: "detached" });
    const reopened = await open();
    assert.equal(
      await reopened.getByPlaceholder("Enter password", { exact: true }).inputValue(),
      "",
      "a closed Signal window must not resurrect the previous password draft",
    );
    const before = await page.evaluate(
      () => window.lifecycle.sent.filter((type) => type === "open_my_web_world").length,
    );
    const dropped = await page.evaluate(() => {
      const socket = window.lifecycle.sockets.find(
        (item) => item.url.endsWith("/api/arcade/web/v1") && item.readyState === 1,
      );
      if (!socket) return false;
      socket.close();
      return true;
    });
    assert.equal(dropped, true, "the Arcade socket must be open before reconnect");
    await page.waitForFunction(
      (count) => window.lifecycle.sent.filter((type) => type === "open_my_web_world").length > count,
      before,
      { timeout: 60000 },
    );
    await reopened.getByPlaceholder("Enter password", { exact: true }).waitFor();
    assert.deepEqual(errors, []);
    await page.screenshot({ path: resolve(output, "messenger-reconnected.png") });
    console.log("Messenger lifecycle passed: close, reopen, reconnect");
  } finally {
    await page.close();
  }
}

async function touchMatrix(browser) {
  const context = await browser.newContext({
    viewport: { width: 390, height: 740 },
    hasTouch: true,
  });
  const page = await context.newPage();
  page.setDefaultTimeout(30000);
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const client = await context.newCDPSession(page);
  const stroke = async (box) => {
    const start = { x: box.x + 24, y: box.y + 24 };
    const end = { x: box.x + Math.min(140, box.width - 8), y: box.y + Math.min(80, box.height - 8) };
    await client.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ x: start.x, y: start.y }],
    });
    await client.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ x: end.x, y: end.y }],
    });
    await client.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  };
  try {
    await boot(page);
    const open = async (appId) => {
      await page.locator(`[data-nori-dock] [data-app-id="${appId}"]`).dispatchEvent("click");
      const host = page.locator(".nori-window-exclusive, .nori-window-glass").last();
      await host.waitFor();
      const box = await host.boundingBox();
      assert.ok(box && box.width > 0 && box.height > 120, `${appId} must open on the narrow viewport`);
      return host;
    };
    const close = async () => {
      const host = page.locator(".nori-window-exclusive, .nori-window-glass").last();
      const exit = host.getByRole("button", { name: "Exit", exact: true });
      if (await exit.count()) await exit.click({ force: true });
      else await host.getByRole("button", { name: "Close", exact: true }).click({ force: true });
      await host.waitFor({ state: "detached" });
    };

    const chess = await open("chess");
    await chess.getByRole("button", { name: "Start Game", exact: true }).click();
    const e2 = chess.locator('[data-chess-square="e2"]');
    await e2.waitFor();
    const from = await e2.boundingBox();
    await page.touchscreen.tap(from.x + from.width / 2, from.y + from.height / 2);
    const e4 = chess.locator('[data-chess-square="e4"]');
    const to = await e4.boundingBox();
    await page.touchscreen.tap(to.x + to.width / 2, to.y + to.height / 2);
    await chess.locator('[aria-label="Move history"] button').first().waitFor();
    await close();

    const codenames = await open("codenames");
    await codenames.getByRole("button", { name: "Enter Forest", exact: true }).click();
    await codenames.getByRole("button", { name: "Start Adventure", exact: true }).click();
    const card = codenames.locator("[data-card-cell] button").first();
    await card.waitFor();
    const cardBox = await card.boundingBox();
    await page.touchscreen.tap(cardBox.x + cardBox.width / 2, cardBox.y + cardBox.height / 2);
    await close();

    const draw = await open("pictionary");
    await draw.getByRole("button", { name: "Play", exact: true }).click();
    await draw.getByRole("button", { name: "Start session", exact: true }).click();
    const canvas = draw.getByLabel("Drawing canvas");
    await canvas.waitFor();
    await stroke(await canvas.boundingBox());
    await close();

    const duel = await open("cakeduel");
    await duel.getByRole("button", { name: "Start Duel", exact: true }).click();
    const hand = duel.locator("[data-cakeduel-player-hand] [data-cakeduel-card]").first();
    await hand.waitFor();
    const handBox = await hand.boundingBox();
    await page.touchscreen.tap(handBox.x + handBox.width / 2, handBox.y + handBox.height / 2);
    await duel.locator("[data-cakeduel-card][data-selected='true']").waitFor();
    await close();

    assert.deepEqual(errors, []);
    console.log("Touch matrix passed: four games on a 390x740 touch viewport");
  } finally {
    await context.close();
  }
}

const backend = await startBackend();
process.env.NORI_BACKEND_ORIGIN = `http://127.0.0.1:${backendPort}`;
const vite = await createServer({
  configFile: "frontend-src/app.vite.config.ts",
  server: { host: "127.0.0.1", port: sourcePort, strictPort: true, hmr: false },
});
const browser = await chromium.launch(probeLaunchOptions());
try {
  await vite.listen();
  await messengerLifecycle(browser);
  await touchMatrix(browser);
} finally {
  await browser.close();
  await vite.close();
  backend.kill();
}
