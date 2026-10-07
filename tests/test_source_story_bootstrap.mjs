// Natural first-boot interaction against the source app: no seeded story facts.
import assert from "node:assert/strict";
import { createServer } from "vite";
import { chromium } from "playwright";
import { probeLaunchOptions } from "../scripts/lib/probe_launch.mjs";
import { startBackend } from "../scripts/lib/backend_launch.mjs";

const origin = "http://127.0.0.1:47273";
process.env.NORI_BACKEND_ORIGIN = origin;
const backend = await startBackend({
  port: 47273,
  env: { NORI_DISABLE_LIVE_PACK: "1", OPENAI_API_KEY: "", ANTHROPIC_API_KEY: "" },
  stdio: "ignore",
  readyTimeoutMs: 10_000,
});
let vite, browser;
try {
  vite = await createServer({
    configFile: "frontend-src/app.vite.config.ts",
    server: { host: "127.0.0.1", port: 47274, strictPort: true, hmr: false },
  });
  await vite.listen();
  browser = await chromium.launch(probeLaunchOptions());
  const page = await browser.newPage({ viewport: { width: 1100, height: 800 }, locale: "en-US" });
  const errors = [], historical = [], sockets = [], messages = [], bootDownloads = [], gameScreens = [];
  page.on("pageerror", (error) => errors.push(error.stack));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("request", (request) => {
    const path = new URL(request.url()).pathname;
    if (request.headers()["x-asset-loader"] === "1") bootDownloads.push(path);
    if (/\/screens\/(?:chess-screen|codenames-app|pictionary-screen|cakeduel-screen)\.tsx$/.test(path)) gameScreens.push(path);
    if (/\/(?:NormalApp-.*\.(?:js|css)|index-CyHAbkO5\.js|index-FU-0vwSE\.css)/.test(request.url()))
      historical.push(request.url());
  });
  page.on("websocket", (socket) => {
    sockets.push(socket.url());
    socket.on("framereceived", ({ payload }) => {
      try { messages.push(JSON.parse(String(payload))); } catch {}
    });
  });
  assert((await page.goto("http://127.0.0.1:47274", { waitUntil: "domcontentloaded" })).ok());
  await page.locator('[data-story-scene="boot"]').waitFor({ timeout: 30000 });
  // A real click catches a non-interactive cutscene inherited from the desktop overlay.
  await page.getByRole("button", { name: "Wake Nori", exact: true }).click({ timeout: 90000 });
  await page.locator('[data-story-scene="boot"]').waitFor({ state: "detached", timeout: 30000 });
  await page.locator('[data-live2d-status="ready"]').waitFor({ timeout: 30000 });
  assert(sockets.some((url) => url.endsWith("/api/arcade/web/v1")), "main socket missing");
  assert(sockets.some((url) => url.endsWith("/api/arcade/web/v1/media")), "media socket missing");
  const wire = JSON.stringify(messages);
  assert(wire.includes("boot.completed"), "natural wake did not publish boot.completed");
  assert(wire.includes("mail.advisory.unlocked"), "boot did not unlock advisory mail");
  assert.ok(bootDownloads.length > 0, "boot gate did not download its first-screen pack");
  assert.ok(bootDownloads.every((path) => /^(\/ARGNori_web\/|\/ocean\/|\/cubism_sdk\/|\/icon\.png$)/.test(path)), "non-first-screen assets still block boot");
  assert.deepEqual(gameScreens, [], "boot eagerly loaded game UI");
  assert.deepEqual(historical, [], "source app loaded historical bundles");
  assert.deepEqual(errors, [], "source story raised browser errors");
  console.log("[ok] fresh source app: natural wake -> boot.completed -> advisory mail; first-screen pack only, game UI deferred");

  await page.locator(".topbar-system-trigger").click();
  await page.getByRole("menuitem", { name: "System Settings...", exact: true }).click();
  const language = page.getByLabel("Language", { exact: true });
  await language.waitFor();
  assert.equal(await language.inputValue(), "en");
  const savedLanguage = await page.evaluate(() => localStorage.getItem("arcade-language"));
  page.once("dialog", (dialog) => dialog.dismiss());
  await language.selectOption("zh-CN");
  assert.equal(await page.evaluate(() => localStorage.getItem("arcade-language")), savedLanguage, "cancel must not save a language change");
  assert.equal(await language.inputValue(), "en");
  page.once("dialog", (dialog) => dialog.accept());
  await Promise.all([
    page.waitForEvent("domcontentloaded"),
    language.selectOption("zh-CN"),
  ]);
  await page.waitForFunction(() => document.documentElement.lang === "zh-CN");
  await page.locator('[data-live2d-status="ready"]').waitFor({ timeout: 30000 });
  assert.equal(await page.evaluate(() => localStorage.getItem("arcade-language")), "zh-CN");
  await page.locator(".topbar-system-trigger").click();
  await page.getByRole("menuitem", { name: "系统设置...", exact: true }).click();
  assert.equal(await page.getByLabel("语言", { exact: true }).inputValue(), "zh-CN");
  assert.deepEqual(errors, [], "language restart raised browser errors");
  console.log("[ok] settings language switch: cancel preserves the selection; confirm persists Chinese and restarts with translated UI");

  await page.locator(".settings-nav-pane").getByRole("button", { name: "调试", exact: true }).click();
  const debug = page.locator(".source-debug");
  await debug.getByRole("heading", { name: "连接", exact: true }).waitFor();
  assert.equal(await debug.locator("nav button").count(), 21);
  assert.equal(await debug.getByRole("button", { name: "网络测试", exact: true }).count(), 1);
  await debug.getByRole("button", { name: "场景", exact: true }).click();
  const texture = debug.getByLabel("模型贴图");
  assert.equal(await texture.inputValue(), "default");
  await texture.selectOption("corrupt");
  assert.equal(await texture.inputValue(), "corrupt", "translated option labels must not change model texture values");
  await debug.getByRole("button", { name: "恢复剧情控制", exact: true }).click();
  assert.equal(await texture.inputValue(), "default");
  await debug.getByRole("button", { name: "网络测试", exact: true }).click();
  assert.equal(await debug.getByRole("button", { name: "应用并重新加载", exact: true }).count(), 1);
  await debug.getByRole("button", { name: "场景编辑器", exact: true }).click();
  assert.equal(await debug.getByRole("button", { name: "导入项目", exact: true }).count(), 1);
  assert.deepEqual(errors, [], "Chinese Debug controls raised browser errors");
  console.log("[ok] Chinese Debug: localized tabs, scene/network/editor controls and unchanged model texture values");
} finally {
  await browser?.close();
  await vite?.close();
  await backend.stop();
}
