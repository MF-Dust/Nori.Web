import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdir } from "node:fs/promises";
import { join, resolve } from "node:path";
import { chromium } from "playwright";
import { createServer } from "vite";
import { probeLaunchOptions } from "./probe_launch.mjs";
import en from "../frontend-src/i18n/en.ts";
import zhCN from "../frontend-src/i18n/zh-CN.ts";

/**
 * Real source-app game lifecycle gate.
 *
 * Chess / Codenames / Pictionary / Cake Duel are four independent pinned dock
 * apps (frontend-src/apps/production-catalog.ts) — there is no aggregate
 * "games" launcher. Each is driven through
 * start -> play -> close -> reopen -> reconnect against the source app served by
 * vite plus the local python backend, in en-US and zh-CN, plus a reduced-motion
 * pass. Labels are resolved from the real dictionaries so the two locale runs
 * assert the strings the source actually renders.
 */

const output = resolve("frontend-games-lifecycle");
await mkdir(output, { recursive: true });

const isCI = Boolean(process.env.CI || process.env.GITHUB_ACTIONS);
const modelReadyTimeout = isCI ? 90000 : 60000;
const backendPort = 47181;
const sourcePort = 47186;
const sourceOrigin = `http://127.0.0.1:${sourcePort}`;

const dictionaries = { "en-US": en, "zh-CN": zhCN };
/** The label the source app renders for `key` in `locale`. */
const text = (locale, key) => {
  const value = key.split(".").reduce((table, part) => table?.[part], dictionaries[locale]);
  assert.equal(typeof value, "string", `missing ${locale} translation for ${key}`);
  return value;
};

function startBackend() {
  const backend = spawn(
    process.env.NORI_TEST_PYTHON ?? "python",
    ["-m", "uvicorn", "server:app", "--host", "127.0.0.1", "--port", String(backendPort)],
    {
      env: {
        ...process.env,
        NORI_DISABLE_LIVE_PACK: "1",
        OPENAI_API_KEY: "",
        ANTHROPIC_API_KEY: "",
      },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );

  let log = "";
  for (const stream of [backend.stdout, backend.stderr])
    stream.on("data", (data) => (log = (log + data).slice(-8000)));

  const origin = `http://127.0.0.1:${backendPort}`;
  return (async () => {
    for (let attempt = 0; attempt < 150; attempt++) {
      try {
        if ((await fetch(`${origin}/api/auth/get-session`)).ok) return { backend, log: () => log };
      } catch {}
      if (backend.exitCode !== null) throw new Error(`Backend exited: ${log}`);
      await new Promise((done) => setTimeout(done, 100));
    }
    throw new Error(`Backend did not start: ${log}`);
  })();
}

/**
 * Records every Arcade frame the app reads and writes, so mount/unmount/
 * dispatch and world (re)open are asserted on the real transport instead of on
 * paint.
 */
function installTransportProbe() {
  const Native = window.WebSocket;
  window.lifecycle = { sockets: [], sent: [], received: [] };
  window.WebSocket = class extends Native {
    constructor(...args) {
      super(...args);
      window.lifecycle.sockets.push(this);
      this.addEventListener("message", (event) => {
        if (typeof event.data !== "string") return;
        try {
          const frame = JSON.parse(event.data);
          window.lifecycle.received.push({
            type: frame.type,
            cartridgeId: frame.cartridgeId,
            version: frame.version,
          });
        } catch {}
      });
    }
    send(data) {
      if (typeof data === "string") {
        try {
          const frame = JSON.parse(data);
          window.lifecycle.sent.push({
            type: frame.type,
            cartridgeId: frame.cartridgeId,
            command: frame.cmd?.type,
          });
        } catch {}
      }
      super.send(data);
    }
  };
}

const frames = (page, type, cartridgeId, source = "sent") =>
  page.evaluate(
    ({ type, cartridgeId, source }) =>
      window.lifecycle[source].filter(
        (frame) => frame.type === type && (!cartridgeId || frame.cartridgeId === cartridgeId),
      ).length,
    { type, cartridgeId, source },
  );

/** Wait until at least `count` matching frames have been written. */
async function waitForFrames(page, type, cartridgeId, count, timeout = 30000, source = "sent") {
  await page.waitForFunction(
    ({ type, cartridgeId, count, source }) =>
      window.lifecycle[source].filter(
        (frame) => frame.type === type && (!cartridgeId || frame.cartridgeId === cartridgeId),
      ).length >= count,
    { type, cartridgeId, count, source },
    { timeout },
  );
}

/** The one exclusive game window, opened from the real dock. */
const gameWindow = (page) => page.locator(".nori-window-exclusive:visible");

async function openFromDock(page, appId) {
  await page.locator(`[data-nori-dock] [data-app-id="${appId}"]`).click();
  const host = gameWindow(page);
  await host.waitFor();
  assert.equal(await host.count(), 1, `${appId} must own exactly one exclusive window`);
  return host;
}

/** Exit is the chrome label for closing an exclusive window. */
async function closeWindow(page, appId) {
  const host = gameWindow(page);
  await host.getByRole("button", { name: "Exit", exact: true }).click();
  await host.waitFor({ state: "detached" });
  assert.equal(await gameWindow(page).count(), 0, `${appId} window survived close`);
}

/** Kill the Arcade socket and wait for the app to re-open its world. */
async function dropArcade(page) {
  const before = await frames(page, "open_my_web_world");
  const dropped = await page.evaluate(() => {
    const socket = window.lifecycle.sockets.find(
      (item) => item.url.includes("/api/arcade/web/v1") && item.readyState === 1,
    );
    if (!socket) return false;
    socket.close();
    return true;
  });
  assert.equal(dropped, true, "the Arcade socket must be open before it can be closed");
  await waitForFrames(page, "open_my_web_world", null, before + 1, 60000);
}

/**
 * Per-game entry points, all discovered from the source.
 *
 *   chess       dock "chess" -> setup rail -> "Start Game" -> [aria-label="Move history"]
 *   codenames   dock "codenames" -> "Enter Forest" -> "Start Adventure" -> [data-codenames-board]
 *   pictionary  dock "pictionary" -> cover "Play" -> "Start session" -> [aria-label="Drawing canvas"]
 *   cakeduel    dock "cakeduel" -> "Start Duel" -> [data-cakeduel-action-panel]
 */
const GAMES = [
  {
    id: "chess",
    root: '[data-chess-board]',
    playing: page => page.locator('[aria-label="Move history"]'),
    async start(page, locale) {
      await page.getByRole("button", { name: text(locale, "chess.start.startGame"), exact: true }).click();
    },
    async play(page) {
      await page.locator('[data-chess-square="e2"]').click();
      await page.locator('[data-chess-square="e4"]').click();
      // The player move plus the local engine's deterministic reply.
      const history = page.locator('[aria-label="Move history"] button');
      await history.first().waitFor();
      await page.waitForFunction(
        () => document.querySelectorAll('[aria-label="Move history"] button').length >= 2,
        undefined,
        { timeout: 30000 },
      );
      return `move history ${await history.count()} plies`;
    },
  },
  {
    id: "codenames",
    root: ".source-codenames-app",
    playing: page => page.locator("[data-codenames-board]"),
    async start(page, locale) {
      await page.getByRole("button", { name: text(locale, "codenames.buttons.newMission"), exact: true }).click();
      await page.getByRole("button", { name: text(locale, "codenames.buttons.startMission"), exact: true }).click();
    },
    async play(page, locale) {
      const board = page.locator("[data-codenames-board]");
      await board.waitFor();
      assert.equal(await page.locator("[data-card-cell] button").count(), 25, "the board is a 5x5 grid");
      // TEAM_A (the human side) gives the first clue of a normal game.
      await page
        .getByRole("combobox", { name: text(locale, "codenames.chat.selectCount"), exact: true })
        .selectOption("2");
      const clue = page.getByPlaceholder(text(locale, "codenames.chat.cluePlaceholder"));
      await clue.waitFor();
      await clue.fill("lantern");
      await page.getByRole("button", { name: "Send guess", exact: true }).click();
      return "clue submitted";
    },
  },
  {
    id: "pictionary",
    root: ".source-pictionary",
    // The cover literals are inline in frontend-src/screens/pictionary-cover.tsx.
    coverPlay: { "en-US": "Play", "zh-CN": "开始" },
    coverStart: { "en-US": "Start session", "zh-CN": "开始游戏" },
    playing: page => page.getByLabel("Drawing canvas"),
    async start(page, locale) {
      const play = page.getByRole("button", { name: this.coverPlay[locale], exact: true });
      await play.waitFor();
      await play.click();
      await page.getByRole("button", { name: this.coverStart[locale], exact: true }).click();
    },
    async play(page) {
      const canvas = page.getByLabel("Drawing canvas");
      await canvas.waitFor();
      const box = await canvas.boundingBox();
      assert.ok(box && box.width > 100 && box.height > 100, "the drawing canvas needs real geometry");
      await page.mouse.move(box.x + 30, box.y + 30);
      await page.mouse.down();
      await page.mouse.move(box.x + 150, box.y + 100, { steps: 12 });
      await page.mouse.up();
      return "stroke submitted";
    },
  },
  {
    id: "cakeduel",
    root: "[data-cakeduel-screen]",
    playing: page => page.locator("[data-cakeduel-action-panel]"),
    async start(page, locale) {
      await page.getByRole("button", { name: text(locale, "cakeduel.start.startGame"), exact: true }).click();
    },
    async play(page, locale) {
      const panel = page.locator("[data-cakeduel-action-panel]");
      await panel.waitFor();
      // A real pointer tap on a hand card; the fanned hand also reorders on drag.
      const card = page.locator("[data-cakeduel-player-hand] [data-cakeduel-card]").first();
      await card.waitFor();
      await card.click();
      const pill = page.locator("[data-cakeduel-claim-pill]:not([disabled])").first();
      if (await pill.count()) await pill.click();
      assert.equal(
        await card.getAttribute("data-selected"),
        "true",
        `${locale}: a pointer tap on a Cake Duel hand card must select it`,
      );
      const action = page.locator("[data-cakeduel-action-button]:not([disabled])").first();
      await action.waitFor();
      assert.equal(await action.count(), 1, "exactly one Cake Duel action must be legal");
      const label = (await action.textContent())?.trim();
      await action.click();
      return `played ${label}`;
    },
  },
];

async function runLifecycle(page, game, locale) {
  const label = `${game.id} (${locale})`;
  const step = (what) => console.log(`    · ${label}: ${what}`);

  // --- start -----------------------------------------------------------------
  const mountsBefore = await frames(page, "mount_cartridge", game.id);
  await openFromDock(page, game.id);
  step("window opened from the dock");
  await page.locator(game.root).waitFor();
  const startDispatches = await frames(page, "dispatch", game.id);
  await game.start(page, locale);
  await game.playing(page).waitFor();
  await waitForFrames(page, "mount_cartridge", game.id, mountsBefore + 1);
  await waitForFrames(page, "dispatch", game.id, startDispatches + 1);
  step(`playing surface up (${await game.playing(page).count()} marker(s))`);
  await page.screenshot({ path: join(output, `${game.id}-${locale}-play.png`) });

  // --- play ------------------------------------------------------------------
  const before = await frames(page, "dispatch", game.id);
  const played = await game.play(page, locale);
  await waitForFrames(page, "dispatch", game.id, before + 1);
  step(`played: ${played}`);

  // --- close -----------------------------------------------------------------
  const beforeClose = await frames(page, "unmount_cartridge", game.id);
  const beforeDrop = await frames(page, "cartridge_unmounted", game.id, "received");
  await closeWindow(page, game.id);
  assert.equal(await page.locator(game.root).count(), 0, `${label}: surface survived close`);
  // Every game must release its cartridge: the window's unmount frame is on the
  // wire and the world really dropped the cartridge behind it.
  await waitForFrames(page, "unmount_cartridge", game.id, beforeClose + 1);
  await waitForFrames(page, "cartridge_unmounted", game.id, beforeDrop + 1, 30000, "received");
  step("surface detached and the cartridge was released");
  await page.screenshot({ path: join(output, `${game.id}-${locale}-closed.png`) });

  // --- reopen ----------------------------------------------------------------
  const mountsAfterClose = await frames(page, "mount_cartridge", game.id);
  await openFromDock(page, game.id);
  await page.locator(game.root).waitFor();
  await waitForFrames(page, "mount_cartridge", game.id, mountsAfterClose + 1);
  await game.start(page, locale);
  await game.playing(page).waitFor();
  step("reopened and the playing surface is back");
  await page.screenshot({ path: join(output, `${game.id}-${locale}-reopened.png`) });

  // --- reconnect -------------------------------------------------------------
  await dropArcade(page);
  assert.equal(
    await page.locator(game.root).count(),
    1,
    `${label}: the world came back without its game surface`,
  );
  await game.playing(page).waitFor();
  step("survived an Arcade websocket drop");
  await page.screenshot({ path: join(output, `${game.id}-${locale}-reconnected.png`) });

  await closeWindow(page, game.id);
  step("closed cleanly");
}

async function runReducedMotion(browser) {
  console.log("  reduced-motion pass");
  const context = await browser.newContext({
    viewport: { width: 1100, height: 720 },
    reducedMotion: "reduce",
  });
  try {
    const page = await context.newPage();
    page.setDefaultTimeout(30000);
    await page.addInitScript(installTransportProbe);
    await page.addInitScript((value) => localStorage.setItem("arcade-language", value), "en-US");
    await page.goto(sourceOrigin, { waitUntil: "domcontentloaded" });
    await page.locator('[data-live2d-status="ready"]').waitFor({ timeout: modelReadyTimeout });
    assert.equal(
      await page.evaluate(() => matchMedia("(prefers-reduced-motion: reduce)").matches),
      true,
      "the reduced-motion pass must actually see the media query",
    );
    for (const game of GAMES) {
      await openFromDock(page, game.id);
      await page.locator(game.root).waitFor();
      await game.start(page, "en-US");
      await game.playing(page).waitFor();
      console.log(`    · ${game.id}: start -> play under prefers-reduced-motion`);
      await page.screenshot({ path: join(output, `reduced-motion-${game.id}.png`) });
      await closeWindow(page, game.id);
    }
    await page.close();
  } finally {
    await context.close();
  }
}

async function runLocale(browser, locale) {
  console.log(`\n  ${locale}`);
  const context = await browser.newContext({ viewport: { width: 1100, height: 720 } });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  try {
    page.setDefaultTimeout(30000);
    await page.addInitScript(installTransportProbe);
    // The host's navigator.language is not en-US, so pin the source's own
    // arcade-language switch instead of relying on the browser default.
    await page.addInitScript((value) => localStorage.setItem("arcade-language", value), locale);
    await page.goto(sourceOrigin, { waitUntil: "domcontentloaded" });
    await page.locator('[data-live2d-status="ready"]').waitFor({ timeout: modelReadyTimeout });
    assert.equal(
      await page.evaluate(() => document.documentElement.lang),
      locale === "en-US" ? "en" : "zh-CN",
      `${locale}: the source app did not boot in the requested locale`,
    );
    for (const game of GAMES) await runLifecycle(page, game, locale);
    assert.deepEqual(errors, [], `${locale}: the source app raised browser errors`);
  } catch (error) {
    await page.screenshot({ path: join(output, `failure-${locale}.png`) }).catch(() => {});
    throw error;
  } finally {
    await page.close();
    await context.close();
  }
}

async function main() {
  const { backend } = await startBackend();
  process.env.NORI_BACKEND_ORIGIN = `http://127.0.0.1:${backendPort}`;

  let browser;
  let vite;
  try {
    vite = await createServer({
      configFile: "frontend-src/app.vite.config.ts",
      server: { host: "127.0.0.1", port: sourcePort, strictPort: true, hmr: false },
    });
    await vite.listen();
    browser = await chromium.launch(probeLaunchOptions());

    console.log("Game lifecycle through the source app and the local backend\n");
    await runLocale(browser, "en-US");
    await runLocale(browser, "zh-CN");
    await runReducedMotion(browser);

    console.log(`\nPASS: all four games started, played, closed, reopened and reconnected in en-US and zh-CN, plus a reduced-motion pass. Artifacts in ${output}/`);
  } finally {
    await browser?.close();
    await vite?.close();
    backend.kill();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
