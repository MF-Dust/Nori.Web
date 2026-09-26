import assert from "node:assert/strict";
import { mkdir, readdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { spawn } from "node:child_process";
import { preview } from "vite";
import { chromium } from "playwright";
import { probeLaunchOptions } from "./probe_launch.mjs";

// Exercise emitted files through a static server, without Vite source transforms.
const output = resolve("frontend-candidate-smoke");
await mkdir(output, { recursive: true });
const backendOrigin = "http://127.0.0.1:47177";
const historical = new Set((await readdir("public/assets")).filter(name => /\.(js|css)$/.test(name)));
const backend = spawn(process.env.NORI_TEST_PYTHON ?? "python", ["-m", "uvicorn", "server:app", "--host", "127.0.0.1", "--port", "47177"], {
  env: { ...process.env, NORI_DISABLE_LIVE_PACK: "1", OPENAI_API_KEY: "", ANTHROPIC_API_KEY: "" },
  stdio: ["ignore", "pipe", "pipe"],
});
let backendLog = "", server, browser;
for (const stream of [backend.stdout, backend.stderr]) stream.on("data", data => { backendLog = (backendLog + data).slice(-8000); });
try {
  let ready = false;
  for (let i = 0; i < 100; i++) {
    try { if ((await fetch(backendOrigin + "/api/auth/get-session")).ok) { ready = true; break; } } catch {}
    if (backend.exitCode !== null) throw new Error("Candidate backend exited: " + backendLog);
    await new Promise(resolve => setTimeout(resolve, 150));
  }
  assert.ok(ready, "candidate backend did not start");
  server = await preview({ configFile: false, root: process.cwd(), build: { outDir: resolve(".frontend-app-build/cutover-candidate") }, preview: {
    host: "127.0.0.1", port: 47178, strictPort: true, proxy: { "/api": { target: backendOrigin, ws: true } },
  } });
  browser = await chromium.launch(probeLaunchOptions());
  const page = await browser.newPage({ viewport: { width: 1366, height: 900 }, locale: "en-US" });
  page.setDefaultTimeout(30000);
  const errors = [], legacyRequests = [], failedAssets = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("request", request => { if (historical.has(new URL(request.url()).pathname.split("/").at(-1))) legacyRequests.push(request.url()); });
  page.on("response", response => { if (response.status() >= 400 && !new URL(response.url()).pathname.startsWith("/api/")) failedAssets.push([response.status(), response.url()]); });
  await page.goto("http://127.0.0.1:47178", { waitUntil: "domcontentloaded" });
  await page.locator('[data-live2d-status="ready"]').waitFor({ timeout: 90000 });
  const input = page.getByRole("textbox", { name: "Message", exact: true });
  await input.fill("Candidate entry verification");
  await page.getByRole("button", { name: "Send", exact: true }).click();
  await page.locator('.conversation-lines [data-sender="agent"]').waitFor();
  await page.locator('[data-nori-dock] [data-app-id="terminal"]').click();
  await page.locator(".xterm-helper-textarea").pressSequentially("help");
  await page.locator(".xterm-helper-textarea").press("Enter");
  await page.screenshot({ path: resolve(output, "candidate-desktop-terminal.png") });
  await page.getByRole("button", { name: "Close", exact: true }).click();
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.locator('[data-live2d-status="ready"]').waitFor({ timeout: 90000 });
  await page.setViewportSize({ width: 390, height: 700 });
  await page.screenshot({ path: resolve(output, "candidate-narrow-restored.png") });
  assert.deepEqual(errors, [], "built candidate runtime errors");
  assert.deepEqual(failedAssets, [], "built candidate missing static assets");
  assert.deepEqual(legacyRequests, [], "built candidate executed historical application assets");
  await writeFile(resolve(output, "result.json"), JSON.stringify({ passed: true, entry: "materialized source build", errors, failedAssets, legacyRequests }, null, 2));
  console.log("Built candidate passed: static entry, local world, Live2D, chat, Terminal, reload and narrow viewport.");
} finally {
  await browser?.close();
  await new Promise(resolve => server ? server.httpServer.close(resolve) : resolve());
  backend.kill();
  await writeFile(resolve(output, "backend.log"), backendLog);
}
