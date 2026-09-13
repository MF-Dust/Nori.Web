import { verifyNoriScene } from "./frontend_nori_scene_probe.mjs";
import { verifyPreview, verifyChip } from "./frontend_preview_chip_probe.mjs";
import assert from "node:assert/strict";
import { chromium } from "playwright";
import { createServer } from "vite";
import { spawn } from "node:child_process";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import {
  installAudioProbe,
  verifyPodcastMixer,
} from "./frontend_audio_probe.mjs";

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
    if (
      /\/(?:NormalApp-.*\.(?:js|css)|index-CyHAbkO5\.js|index-FU-0vwSE\.css)/.test(
        request.url(),
      )
    )
      historicalRequests.push(request.url());
  });
  await page.addInitScript(() => {
    const Native = window.WebSocket;
    window.sourceSmoke = { sockets: [], sent: [] };
    window.WebSocket = class extends Native {
      constructor(...args) {
        super(...args);
        window.sourceSmoke.sockets.push(this);
        this.addEventListener("message", (event) => {
          if (typeof event.data !== "string") return;
          try {
            const message = JSON.parse(event.data);
            if (message.type === "web_world_reset_ack")
              sessionStorage.setItem("source-smoke-reset-ack", message.worldId);
          } catch {}
        });
      }
      send(data) {
        if (typeof data === "string") {
          try {
            const item = JSON.parse(data);
            window.sourceSmoke.sent.push({
              type: item.type,
              channel: item.channel,
              ...(item.channel === "manifold.chip.scan" ? { payload: item.payload } : {}),
              command: item.command?.type ?? item.cmd?.type,
            });
          } catch {}
        }
        super.send(data);
      }
    };
  });
  await page.addInitScript(installAudioProbe);
  await page.goto("http://127.0.0.1:47174", { waitUntil: "domcontentloaded" });
  console.log("Page loaded");
  await page
    .locator('[data-live2d-status="ready"]')
    .waitFor({ timeout: 60000 });
  console.log("Model ready");
  assert.equal(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem("graphics-store")).state.source,
    ),
    "auto",
  );
  await page.locator('[data-live2d-fps="30"]').waitFor();
  const input = page.getByRole("textbox", { name: "Message", exact: true });
  await input.fill("Source recovery smoke");
  await page.getByRole("button", { name: "Send", exact: true }).click();
  await page.locator('.conversation-lines [data-sender="player"]').waitFor();
  await page.locator('.conversation-lines [data-sender="agent"]').waitFor();
  console.log("Text response received");
  await page.waitForFunction(() =>
    window.audioProbe.starts.some((item) => item.loop),
  );
  // Warm the focus cue, then verify a real decoded effect reaches the shared output.
  await input.focus();
  await page.waitForFunction(() =>
    window.audioProbe.starts.some((item) => !item.loop && item.gain > 0),
  );
  await input.press("Escape");
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(() =>
    [...document.querySelectorAll(".conversation-bubble")].every(
      (element) => Number(getComputedStyle(element).opacity) > 0.99,
    ),
  );
  const panel = await page
    .locator(".conversation-panel")
    .evaluate((element) => {
      const style = getComputedStyle(element),
        box = element.getBoundingClientRect();
      return {
        width: box.width,
        background: style.backgroundColor,
        border: style.borderTopWidth,
        font: style.fontFamily,
      };
    });
  assert.equal(panel.width, 280);
  assert.equal(panel.background, "rgba(0, 0, 0, 0)");
  assert.equal(panel.border, "0px");
  assert.ok(panel.font.includes("Nunito"));
  const devtools = await page.context().newCDPSession(page);
  await devtools.send("DOM.enable");
  await devtools.send("CSS.enable");
  const { root } = await devtools.send("DOM.getDocument");
  const { nodeId } = await devtools.send("DOM.querySelector", {
    nodeId: root.nodeId,
    selector: '.conversation-bubble[data-sender="player"] span',
  });
  const { fonts } = await devtools.send("CSS.getPlatformFontsForNode", {
    nodeId,
  });
  assert.ok(
    fonts.some(
      (font) => font.postScriptName.startsWith("Nunito") && font.isCustomFont,
    ),
    "chat Latin text must render the actual Nunito font",
  );
  const agentNode = await devtools.send("DOM.querySelector", {
    nodeId: root.nodeId,
    selector: '.conversation-bubble[data-sender="agent"] span',
  });
  const agentFonts = await devtools.send("CSS.getPlatformFontsForNode", {
    nodeId: agentNode.nodeId,
  });
  assert.ok(
    agentFonts.fonts.some(
      (font) => font.postScriptName.includes("Sarasa") && font.isCustomFont,
    ),
    "Chinese chat text must use the bundled CJK fallback",
  );
  await devtools.detach();
  await page.keyboard.press("Control+k");
  assert.equal(
    await input.evaluate((element) => document.activeElement === element),
    true,
  );
  await page.screenshot({ path: resolve(output, "conversation-focused.png") });
  await input.press("Escape");
  assert.equal(
    await input.evaluate((element) => document.activeElement === element),
    false,
  );
  for (const width of [390, 1024, 1366]) {
    await page.setViewportSize({ width, height: 900 });
    const rect = await page.locator(".conversation-composer").boundingBox();
    assert.ok(
      rect.x >= 0 && rect.x + rect.width <= width,
      "composer must remain inside the viewport",
    );
  }
  await page.setViewportSize({ width: 1366, height: 900 });
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

  await page.locator(".topbar-system-trigger").click();
  await page
    .getByRole("menuitem", { name: "System Settings...", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Enable speech", exact: true })
    .click();
  await page.getByRole("button", { name: "Speech on", exact: true }).waitFor();
  await page.getByRole("button", { name: "Close", exact: true }).click();
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
  await page.getByRole("button", { name: "Close", exact: true }).click();
  await page.locator(".topbar-app-name").click();
  await page.getByRole("menuitem", { name: "About...", exact: true }).click();
  await page.getByRole("heading", { name: "NoriOS", exact: true }).waitFor();
  const logo = page.locator(".about-logo");
  await logo.hover({ position: { x: 70, y: 10 } });
  await page.waitForFunction(
    () =>
      Math.abs(
        parseFloat(
          document
            .querySelector(".about-logo")
            .style.getPropertyValue("--tilt-y"),
        ),
      ) > 1,
  );
  await page.mouse.move(20, 80);
  await page.waitForFunction(
    () =>
      Math.abs(
        parseFloat(
          document
            .querySelector(".about-logo")
            .style.getPropertyValue("--tilt-y"),
        ),
      ) < 0.1,
  );
  await page.screenshot({ path: resolve(output, "about.png") });
  await page.getByRole("button", { name: "Close", exact: true }).click();

  await page.locator(".topbar-system-trigger").click();
  await page
    .getByRole("menuitem", { name: "System Settings...", exact: true })
    .click();
  const master = page.getByRole("slider", {
    name: "Master Volume",
    exact: true,
  });
  await master.fill("37");
  const musicGain = () =>
    page.evaluate(() => {
      const probe = window.audioProbe;
      return probe.gain(probe.starts.find((item) => item.loop).node);
    });
  assert.ok(
    Math.abs((await musicGain()) - 0.037) < 0.001,
    "music must use master and music gain once",
  );
  assert.equal(
    await page.evaluate(() => window.audioProbe.contexts.length),
    1,
    "BGM, cues and PCM speech share one context",
  );
  assert.equal(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem("audio-store")).state.masterVolume,
    ),
    37,
  );
  await page.getByRole("switch", { name: "Sound", exact: true }).click();
  assert.equal(await master.isDisabled(), true);
  assert.equal(await musicGain(), 0);
  await page.getByRole("switch", { name: "Sound", exact: true }).click();
  await page.getByRole("slider", { name: "Music", exact: true }).fill("25");
  assert.ok(Math.abs((await musicGain()) - 0.0925) < 0.001);
  await page.getByRole("switch", { name: "Mute Music", exact: true }).click();
  assert.equal(await musicGain(), 0);
  await page.getByRole("switch", { name: "Unmute Music", exact: true }).click();
  const podcastAudio = await verifyPodcastMixer(page);
  assert.equal(podcastAudio.played.ok, true);
  assert.ok(
    Math.abs(podcastAudio.gain - 0.2) < 0.001,
    "podcasts use SFX and master, independently of music volume",
  );
  assert.equal(podcastAudio.muted, 0);
  assert.equal(podcastAudio.rate, 1.5);
  assert.equal(podcastAudio.paused, true);
  assert.equal(podcastAudio.disconnected, true);
  assert.equal(podcastAudio.closed, true);
  await page.getByRole("button", { name: "Graphics", exact: true }).click();
  await page
    .getByRole("combobox", { name: "Graphics", exact: true })
    .selectOption("ultra-performance");
  await page.locator('[data-live2d-fps="30"]').waitFor();
  assert.equal(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem("graphics-store")).state.source,
    ),
    "user",
  );
  await page.getByRole("button", { name: "Network", exact: true }).click();
  await page.getByRole("button", { name: "Check line", exact: true }).click();
  await page
    .getByRole("status")
    .filter({ hasText: /^Average \d+ ms$/ })
    .waitFor();
  await page.screenshot({ path: resolve(output, "settings-network.png") });
  await page.getByRole("button", { name: "System", exact: true }).click();
  await page
    .getByRole("button", { name: "Reset system...", exact: true })
    .click();
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  assert.equal(
    await page.evaluate(() =>
      window.sourceSmoke.sent.some(
        (item) => item.type === "reset_my_web_world",
      ),
    ),
    false,
  );
  // Restore a Settings window and its persistent audio/graphics choices.
  await page.reload({ waitUntil: "domcontentloaded" });
  await page
    .locator('[data-live2d-status="ready"][data-live2d-fps="30"]')
    .waitFor({ timeout: 60000 });
  assert.equal(
    await page
      .getByRole("slider", { name: "Master Volume", exact: true })
      .inputValue(),
    "37",
  );
  await page.getByRole("button", { name: "Close", exact: true }).click();

  await verifyNoriScene(browser, output);
  await verifyPreview(browser, output);
  await verifyChip(page, output);

  // Make the shipped Credits Dock condition true in the disposable local world.
  await page.evaluate(() => {
    const socket = window.sourceSmoke.sockets.find(
      (item) =>
        item.url.endsWith("/api/arcade/web/v1") && item.readyState === 1,
    );
    socket.send(
      JSON.stringify({
        type: "event",
        channel: "manifold.command.request",
        requestId: "smoke-credits-fact",
        payload: {
          command: "client.emitFact",
          payload: { factId: "arg.farewell.shown" },
        },
      }),
    );
  });
  await page.locator('[data-nori-dock] [data-app-id="credits"]').click();
  await page
    .getByRole("heading", { name: "Thanks for playing", exact: true })
    .waitFor();
  await page.waitForFunction(() =>
    [...document.querySelectorAll(".credits-reveal")].every(
      (element) => Number(getComputedStyle(element).opacity) >= 0.99,
    ),
  );
  await page.screenshot({ path: resolve(output, "credits.png") });
  await page.getByRole("button", { name: "Close", exact: true }).click();

  // Exercise the confirmed destructive flow only against the backend spawned above.
  await page.evaluate(() =>
    localStorage.setItem("idle.run:source-smoke-old", "fixture"),
  );
  await page.locator(".topbar-system-trigger").click();
  await page
    .getByRole("menuitem", { name: "System Settings...", exact: true })
    .click();
  await page.getByRole("button", { name: "System", exact: true }).click();
  await page
    .getByRole("button", { name: "Reset system...", exact: true })
    .click();
  await Promise.all([
    page.waitForEvent("framenavigated", (frame) => frame === page.mainFrame()),
    page
      .getByRole("button", { name: "Erase and restart", exact: true })
      .click(),
  ]);
  assert.ok(
    await page.evaluate(() => sessionStorage.getItem("source-smoke-reset-ack")),
    "reset must be acknowledged before reboot",
  );
  assert.equal(
    await page.evaluate(() =>
      localStorage.getItem("idle.run:source-smoke-old"),
    ),
    null,
  );
  assert.deepEqual(
    historicalRequests,
    [],
    "source app loaded historical JS or CSS",
  );
  assert.deepEqual(errors, [], "source app raised browser errors");
  console.log(
    "Source app smoke passed: desktop, Live2D, text chat, PCM playback acknowledgement, reconnect, Terminal, About, Settings persistence/graphics/network/reset and Credits.",
  );
} finally {
  await browser?.close();
  await vite?.close();
  backend.kill();
}
