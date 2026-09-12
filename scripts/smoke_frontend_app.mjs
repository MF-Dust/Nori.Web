import assert from "node:assert/strict";
import { chromium } from "playwright";
import { createServer } from "vite";
import { spawn } from "node:child_process";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

const output = resolve("frontend-app-smoke");
await mkdir(output, { recursive: true });
const backendPort = 47173;
const backendOrigin = `http://127.0.0.1:${backendPort}`;
process.env.NORI_BACKEND_ORIGIN = backendOrigin;
const backend = spawn(
  process.env.NORI_TEST_PYTHON ?? "python",
  [
    "-m",
    "uvicorn",
    "server:app",
    "--host",
    "127.0.0.1",
    "--port",
    String(backendPort),
  ],
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
let backendLog = "";
backend.stdout.on("data", (data) => {
  backendLog = (backendLog + data).slice(-4000);
});
backend.stderr.on("data", (data) => {
  backendLog = (backendLog + data).slice(-4000);
});
let vite, browser;
try {
  let ready = false;
  for (let attempt = 0; attempt < 100; attempt++) {
    try {
      if ((await fetch(`${backendOrigin}/api/auth/get-session`)).ok) {
        ready = true;
        break;
      }
    } catch {}
    if (backend.exitCode !== null)
      throw new Error("Backend exited: " + backendLog);
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
  assert.ok(ready, "local backend did not start");
  vite = await createServer({
    configFile: "frontend-src/app.vite.config.ts",
    server: { host: "127.0.0.1", port: 47174, strictPort: true },
  });
  await vite.listen();
  browser = await chromium.launch({
    headless: true,
    executablePath: process.env.NORI_TEST_CHROMIUM || undefined,
    args: [
      "--use-gl=angle",
      "--use-angle=swiftshader",
      "--enable-unsafe-swiftshader",
    ],
  });
  const page = await browser.newPage({
    viewport: { width: 1366, height: 900 },
    locale: "en-US",
  });
  page.setDefaultTimeout(20000);
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  const historicalRequests = [];
  page.on("request", (request) => {
    if (/\/(?:NormalApp-.*\.(?:js|css)|index-CyHAbkO5\.js|index-FU-0vwSE\.css)/.test(request.url()))
      historicalRequests.push(request.url());
  });
  await page.addInitScript(() => {
    const Native = window.WebSocket;
    window.sourceSmoke = { sockets: [], sent: [] };
    window.WebSocket = class extends Native {
      constructor(...args) {
        super(...args);
        window.sourceSmoke.sockets.push(this);
      }
      send(data) {
        if (typeof data === "string") {
          try {
            const item = JSON.parse(data);
            window.sourceSmoke.sent.push({
              type: item.type,
              command: item.command?.type ?? item.cmd?.type,
            });
          } catch {}
        }
        super.send(data);
      }
    };
  });
  await page.goto("http://127.0.0.1:47174", { waitUntil: "domcontentloaded" });
  console.log("Page loaded");
  await page
    .locator('[data-live2d-status="ready"]')
    .waitFor({ timeout: 60000 });
  console.log("Model ready");
  const input = page.getByRole("textbox", { name: "Message", exact: true });
  await input.fill("Source recovery smoke");
  await page.getByRole("button", { name: "Send", exact: true }).click();
  await page.locator('.conversation-lines [data-sender="player"]').waitFor();
  await page.locator('.conversation-lines [data-sender="agent"]').waitFor();
  console.log("Text response received");
  await page.screenshot({ path: resolve(output, "desktop-chat-live2d.png") });
  const icon = page.locator(".topbar-icon");
  assert.ok((await icon.boundingBox()).width <= 20, "TopBar CSS is missing");
  assert.equal(
    await page
      .locator(".dock-ic__a")
      .first()
      .evaluate((element) => getComputedStyle(element).position),
    "absolute",
  );

  await page
    .getByRole("button", { name: "Enable speech", exact: true })
    .click();
  await page.getByRole("button", { name: "Speech on", exact: true }).waitFor();
  await input.fill("Voice recovery smoke");
  await page.getByRole("button", { name: "Send", exact: true }).click();
  await page
    .waitForFunction(
      () =>
        window.sourceSmoke.sent.some((item) => item.command === "audioDone"),
      undefined,
      { timeout: 15000 },
    )
    .catch(async (error) => {
      console.log("Trace", await page.evaluate(() => window.sourceSmoke.sent));
      throw error;
    });
  const before = await page.evaluate(
    () =>
      window.sourceSmoke.sent.filter(
        (item) => item.type === "open_my_web_world",
      ).length,
  );
  await page.evaluate(() =>
    window.sourceSmoke.sockets
      .find(
        (socket) =>
          socket.url.includes("/api/arcade/web/v1") && socket.readyState === 1,
      )
      .close(),
  );
  await page.waitForFunction(
    (count) =>
      window.sourceSmoke.sent.filter(
        (item) => item.type === "open_my_web_world",
      ).length ===
      count + 1,
    before,
  );
  await input.fill("After reconnect");
  await page.getByRole("button", { name: "Send", exact: true }).click();
  await page
    .getByRole("log")
    .getByText("After reconnect", { exact: false })
    .waitFor();

  await page.locator('[data-nori-dock] [data-app-id="terminal"]').click();
  await page.locator(".xterm-helper-textarea").pressSequentially("help");
  await page.locator(".xterm-helper-textarea").press("Enter");
  await page.locator(".xterm").waitFor();
  await page.screenshot({ path: resolve(output, "terminal-desktop.png") });
  assert.deepEqual(historicalRequests, [], "source app loaded historical JS or CSS");
  assert.deepEqual(errors, [], "source app raised browser errors");
  console.log(
    "Source app smoke passed: desktop, Live2D, text chat, PCM playback acknowledgement, reconnect and Terminal.",
  );
} finally {
  await browser?.close();
  await vite?.close();
  backend.kill();
}
