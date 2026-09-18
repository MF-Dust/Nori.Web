import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { spawn, spawnSync } from "node:child_process";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { chromium } from "playwright";
import { preview } from "vite";

const root = resolve(process.cwd());
const publicDir = resolve(root, "public");
const candidateDir = resolve(root, ".frontend-app-build/cutover-candidate");
const output = resolve(
  process.env.NORI_VISUAL_OUTPUT ?? "frontend-visual-reference",
);
const backendPort = Number(process.env.NORI_VISUAL_BACKEND_PORT ?? 47179);
const referencePort = Number(process.env.NORI_VISUAL_REFERENCE_PORT ?? 47180);
const candidatePort = Number(process.env.NORI_VISUAL_CANDIDATE_PORT ?? 47181);
const backendOrigin = `http://127.0.0.1:${backendPort}`;
const viewport = { width: 1366, height: 900 };
const captureLocale = "zh-CN";
const ui = {
  about: "关于...",
  settings: "系统设置...",
  creditsHeading: "谢谢你",
};
const browserOptions = {
  viewport,
  deviceScaleFactor: 1,
  locale: captureLocale,
  colorScheme: "dark",
  reducedMotion: "reduce",
};
const legacyNames = new Set(
  (await readdir(resolve(publicDir, "assets"))).filter((name) =>
    /\.(?:js|css)$/.test(name),
  ),
);
const marker = JSON.parse(
  await readFile(
    resolve(candidateDir, ".frontend-cutover-candidate.json"),
    "utf8",
  ),
);
assert.equal(marker.kind, "frontend-cutover-candidate");
assert.equal(
  marker.stagingMode,
  "materialized-copy",
  "visual evidence requires a materialized candidate",
);

await mkdir(output, { recursive: true });

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
for (const stream of [backend.stdout, backend.stderr])
  stream.on("data", (data) => {
    backendLog = (backendLog + data).slice(-12_000);
  });

const manifest = {
  version: 1,
  purpose: "paired visual review; no pixel-parity claim",
  revision:
    spawnSync("git", ["rev-parse", "HEAD"], {
      encoding: "utf8",
    }).stdout?.trim() || null,
  generatedAt: new Date().toISOString(),
  viewport,
  deviceScaleFactor: browserOptions.deviceScaleFactor,
  locale: browserOptions.locale,
  colorScheme: browserOptions.colorScheme,
  reducedMotion: browserOptions.reducedMotion,
  candidateMarker: marker,
  captures: {},
};

let referenceServer;
let candidateServer;
let browser;

async function waitForBackend() {
  for (let attempt = 0; attempt < 100; attempt++) {
    try {
      if ((await fetch(`${backendOrigin}/api/auth/get-session`)).ok) return;
    } catch {}
    if (backend.exitCode !== null)
      throw new Error(`Visual-reference backend exited: ${backendLog}`);
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
  throw new Error("Visual-reference backend did not start");
}

async function startPreview(outDir, port) {
  return preview({
    configFile: false,
    root,
    build: { outDir },
    preview: {
      host: "127.0.0.1",
      port,
      strictPort: true,
      proxy: { "/api": { target: backendOrigin, ws: true } },
    },
  });
}

async function closePreview(server) {
  await new Promise((resolve) =>
    server ? server.httpServer.close(resolve) : resolve(),
  );
}

async function settle(page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(resolve)),
    );
  });
}

async function screenshot(page, directory, name, states) {
  await settle(page);
  const bytes = await page.screenshot({ animations: "disabled" });
  const file = `${name}.png`;
  await writeFile(resolve(directory, file), bytes);
  states[name] = {
    file,
    bytes: bytes.byteLength,
    sha256: createHash("sha256").update(bytes).digest("hex"),
    title: await page.title(),
    activeElement: await page.evaluate(() => ({
      tag: document.activeElement?.tagName ?? null,
      ariaLabel: document.activeElement?.getAttribute("aria-label") ?? null,
    })),
  };
}

async function openSystemItem(page, name) {
  await page.locator(".topbar-system-trigger").click();
  await page.getByRole("menuitem", { name, exact: true }).click();
}

async function closeWindow(page) {
  await page.getByRole("button", { name: "Close", exact: true }).last().click();
}

async function findFloatingChatInput(page, label) {
  // The shipped composer input has neither an accessible name nor a native
  // placeholder; its visible prompt is a separate sibling. Locate the common
  // form control structure without changing either application under test.
  const inputs = page.locator('form input[type="text"]:visible');
  await inputs.first().waitFor();
  assert.equal(
    await inputs.count(),
    1,
    `${label} must expose one visible text input before windows are opened`,
  );
  return inputs.first();
}

async function unlockCredits(page) {
  const credits = page.locator('[data-app-id="credits"]');
  if (await credits.isVisible().catch(() => false)) return;
  await page.waitForFunction(
    () =>
      window.visualReference.sockets.some(
        (socket) =>
          socket.url.endsWith("/api/arcade/web/v1") && socket.readyState === 1,
      ),
    undefined,
    { timeout: 30_000 },
  );
  await page.evaluate(() => {
    const socket = window.visualReference.sockets.find(
      (item) =>
        item.url.endsWith("/api/arcade/web/v1") && item.readyState === 1,
    );
    socket.send(
      JSON.stringify({
        type: "event",
        channel: "manifold.command.request",
        requestId: `visual-reference-credits-${Date.now()}`,
        payload: {
          command: "client.emitFact",
          payload: { factId: "arg.farewell.shown" },
        },
      }),
    );
  });
  await credits.waitFor({ timeout: 30_000 });
}

async function captureTarget({ label, origin, historical }) {
  const directory = resolve(output, label);
  await mkdir(directory, { recursive: true });
  const context = await browser.newContext(browserOptions);
  await context.addInitScript(() => {
    localStorage.setItem("arcade-language", "zh-CN");
    const Native = window.WebSocket;
    window.visualReference = { sockets: [] };
    window.WebSocket = class extends Native {
      constructor(...args) {
        super(...args);
        window.visualReference.sockets.push(this);
      }
    };
  });
  const page = await context.newPage();
  page.setDefaultTimeout(30_000);
  const pageErrors = [];
  const consoleErrors = [];
  const failedAssets = [];
  const legacyRequests = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("request", (request) => {
    const name = new URL(request.url()).pathname.split("/").at(-1);
    if (legacyNames.has(name)) legacyRequests.push(request.url());
  });
  page.on("response", (response) => {
    const url = new URL(response.url());
    if (response.status() >= 400 && !url.pathname.startsWith("/api/"))
      failedAssets.push({ status: response.status(), url: response.url() });
  });

  const states = {};
  let chatControl;
  let masterVolumeControl;
  try {
    const response = await page.goto(origin, {
      waitUntil: "domcontentloaded",
      timeout: 60_000,
    });
    assert.ok(response?.ok(), `${label} entry returned ${response?.status()}`);
    const bypass = page.getByText("仍要进入", { exact: true });
    if (await bypass.count()) await bypass.click();
    await page.locator(".topbar-system-trigger").waitFor({ timeout: 90_000 });
    const input = await findFloatingChatInput(page, label);
    chatControl = await input.evaluate((element) => ({
      tag: element.tagName,
      type: element.getAttribute("type"),
      ariaLabel: element.getAttribute("aria-label"),
      placeholder: element.getAttribute("placeholder"),
      maxLength: element.maxLength,
    }));
    if (historical)
      await page.waitForFunction(
        () =>
          [...document.querySelectorAll("canvas")].some(
            (canvas) => canvas.width > 0 && canvas.height > 0,
          ),
        undefined,
        { timeout: 90_000 },
      );
    else
      await page
        .locator('[data-live2d-status="ready"]')
        .waitFor({ timeout: 90_000 });
    await unlockCredits(page);

    await screenshot(page, directory, "01-desktop", states);

    await input.fill("Visual reference");
    await input.focus();
    await screenshot(page, directory, "02-chat-focused", states);
    await input.fill("");
    await input.press("Escape");

    await page.locator(".topbar-app-name").first().click();
    await page.getByRole("menuitem", { name: ui.about, exact: true }).click();
    await page.getByRole("heading", { name: "NoriOS", exact: true }).waitFor();
    await screenshot(page, directory, "03-about", states);
    await closeWindow(page);

    await openSystemItem(page, ui.settings);
    // The shipped Radix slider thumb is not labelled by the adjacent visible
    // text. Both implementations present master volume first in the same four
    // sound controls, so preserve that structural order for the paired state.
    const volumeSliders = page.getByRole("slider");
    await volumeSliders.first().waitFor();
    assert.equal(
      await volumeSliders.count(),
      4,
      `${label} settings must expose four visible sound sliders`,
    );
    masterVolumeControl = await volumeSliders.first().evaluate((element) => ({
      tag: element.tagName,
      type: element.getAttribute("type"),
      ariaLabel: element.getAttribute("aria-label"),
      ariaValueNow: element.getAttribute("aria-valuenow"),
    }));
    await screenshot(page, directory, "04-settings", states);
    await closeWindow(page);

    await page.locator('[data-app-id="credits"]').click();
    await page
      .getByRole("heading", { name: ui.creditsHeading, exact: true })
      .waitFor();
    await screenshot(page, directory, "05-credits", states);

    const runtime = await page.evaluate(() => ({
      href: location.href,
      lang: document.documentElement.lang,
      classes: document.documentElement.className,
      userAgent: navigator.userAgent,
      devicePixelRatio,
      scripts: [...document.scripts]
        .map((script) => script.src)
        .filter(Boolean),
      styles: [...document.querySelectorAll('link[rel="stylesheet"]')]
        .map((link) => link.href)
        .filter(Boolean),
    }));
    if (historical)
      assert.ok(
        legacyRequests.length > 0,
        "reference did not execute a historical application asset",
      );
    else
      assert.deepEqual(
        legacyRequests,
        [],
        "source candidate executed a historical application asset",
      );
    assert.deepEqual(pageErrors, [], `${label} raised browser page errors`);

    const result = {
      status: "complete",
      label,
      entry: historical
        ? "shipped public/index.html"
        : "materialized source cutover candidate",
      origin,
      runtime,
      chatControl,
      masterVolumeControl,
      states,
      legacyRequests,
      pageErrors,
      consoleErrors,
      failedAssets,
    };
    await writeFile(
      resolve(directory, "metadata.json"),
      `${JSON.stringify(result, null, 2)}\n`,
    );
    return { result, error: null };
  } catch (error) {
    await screenshot(page, directory, "capture-failure", states).catch(
      () => {},
    );
    const failure = {
      status: "failed",
      label,
      entry: historical
        ? "shipped public/index.html"
        : "materialized source cutover candidate",
      origin,
      error: {
        name: error instanceof Error ? error.name : "Error",
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      chatControl,
      masterVolumeControl,
      states,
      legacyRequests,
      pageErrors,
      consoleErrors,
      failedAssets,
    };
    await writeFile(
      resolve(directory, "metadata.json"),
      `${JSON.stringify(failure, null, 2)}\n`,
    );
    return { result: failure, error };
  } finally {
    await context.close();
  }
}

try {
  await waitForBackend();
  referenceServer = await startPreview(publicDir, referencePort);
  candidateServer = await startPreview(candidateDir, candidatePort);
  browser = await chromium.launch({
    headless: true,
    executablePath: process.env.NORI_TEST_CHROMIUM || undefined,
    args: [
      "--use-gl=angle",
      "--use-angle=swiftshader",
      "--enable-unsafe-swiftshader",
    ],
  });
  const failures = [];
  for (const target of [
    {
      label: "reference",
      origin: `http://127.0.0.1:${referencePort}`,
      historical: true,
    },
    {
      label: "candidate",
      origin: `http://127.0.0.1:${candidatePort}`,
      historical: false,
    },
  ]) {
    const outcome = await captureTarget(target);
    manifest.captures[target.label] = outcome.result;
    if (outcome.error) failures.push(outcome.error);
  }
  manifest.completedAt = new Date().toISOString();
  manifest.reviewStatus = failures.length
    ? "paired capture incomplete; inspect partial metadata and failure screenshots"
    : "paired captures generated; human image review pending";
  if (failures.length)
    throw new AggregateError(
      failures,
      `${failures.length} visual-reference target capture(s) failed`,
    );
  console.log(
    `Visual reference generated at ${output}: five paired states; image review remains pending.`,
  );
} finally {
  await browser?.close();
  await Promise.all([
    closePreview(referenceServer),
    closePreview(candidateServer),
  ]);
  backend.kill("SIGTERM");
  await writeFile(resolve(output, "backend.log"), backendLog);
  await writeFile(
    resolve(output, "manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );
}
