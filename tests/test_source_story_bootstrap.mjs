// Natural first-boot interaction against the source app: no seeded story facts.
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "vite";
import { chromium } from "playwright";
import { probeLaunchOptions } from "../scripts/lib/probe_launch.mjs";

const origin = "http://127.0.0.1:47273";
process.env.NORI_BACKEND_ORIGIN = origin;
const backend = spawn(process.env.PYTHON ?? "python", [
  "-m", "uvicorn", "server:app", "--host", "127.0.0.1", "--port", "47273",
], {
  env: { ...process.env, NORI_DISABLE_LIVE_PACK: "1", OPENAI_API_KEY: "", ANTHROPIC_API_KEY: "" },
  stdio: "ignore",
});
let vite, browser;
try {
  let ready = false;
  for (let i = 0; i < 100; i++) {
    try {
      ready = (await fetch(`${origin}/api/auth/get-session`)).ok;
      if (ready) break;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  assert(ready, "source story backend did not start");
  vite = await createServer({
    configFile: "frontend-src/app.vite.config.ts",
    server: { host: "127.0.0.1", port: 47274, strictPort: true, hmr: false },
  });
  await vite.listen();
  browser = await chromium.launch(probeLaunchOptions());
  const page = await browser.newPage({ viewport: { width: 1000, height: 800 }, locale: "en-US" });
  const errors = [], historical = [], sockets = [], messages = [];
  page.on("pageerror", (error) => errors.push(error.stack));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("request", (request) => {
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
  assert.deepEqual(historical, [], "source app loaded historical bundles");
  assert.deepEqual(errors, [], "source story raised browser errors");
  console.log("[ok] fresh source app: natural wake -> boot.completed -> advisory mail; Live2D and both sockets ready");
} finally {
  await browser?.close();
  await vite?.close();
  backend.kill();
}
