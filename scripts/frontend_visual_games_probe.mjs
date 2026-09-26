import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { spawn, spawnSync } from "node:child_process";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { chromium } from "playwright";
import { probeLaunchOptions } from "./probe_launch.mjs";
import { preview } from "vite";

const root = resolve(process.cwd());
const publicDir = resolve(root, "public");
const candidateDir = resolve(root, ".frontend-app-build/cutover-candidate");
const output = resolve(process.env.NORI_VISUAL_GAMES_OUTPUT ?? "frontend-visual-reference/games");
const viewport = { width: 1366, height: 900 };
const browserOptions = {
  viewport,
  deviceScaleFactor: 1,
  locale: "zh-CN",
  colorScheme: "dark",
  reducedMotion: "reduce",
};
const games = [
  { id: "codenames", heading: "森林寻宝" },
  { id: "pictionary", heading: "你画我猜" },
  { id: "chess", heading: "与 Nori 下棋" },
  { id: "cakeduel", heading: "蛋糕对决" },
];
const legacyNames = new Set(
  (await readdir(resolve(publicDir, "assets"))).filter((name) => /\.(?:js|css)$/.test(name)),
);
const marker = JSON.parse(
  await readFile(resolve(candidateDir, ".frontend-cutover-candidate.json"), "utf8"),
);
assert.equal(marker.kind, "frontend-cutover-candidate");
assert.equal(marker.stagingMode, "materialized-copy");
await mkdir(output, { recursive: true });

const manifest = {
  version: 1,
  purpose: "paired game start-screen review; no pixel-parity or private-agent claim",
  revision: spawnSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).stdout?.trim() || null,
  generatedAt: new Date().toISOString(),
  viewport,
  locale: browserOptions.locale,
  reducedMotion: browserOptions.reducedMotion,
  isolation: "fresh local backend process per target",
  candidateMarker: marker,
  captures: {},
};

async function waitForBackend(process, origin, log) {
  for (let attempt = 0; attempt < 100; attempt++) {
    try {
      if ((await fetch(`${origin}/api/auth/get-session`)).ok) return;
    } catch {}
    if (process.exitCode !== null) throw new Error(`Backend exited: ${log()}`);
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
  throw new Error("Game visual backend did not start");
}

async function closePreview(server) {
  await new Promise((resolve) => server ? server.httpServer.close(resolve) : resolve());
}

async function settle(page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  });
}

async function captureTarget({ label, outDir, historical, backendPort, previewPort }, browser) {
  const directory = resolve(output, label);
  await mkdir(directory, { recursive: true });
  const backendOrigin = `http://127.0.0.1:${backendPort}`;
  let backendLog = "";
  const backend = spawn(
    process.env.NORI_TEST_PYTHON ?? "python",
    ["-m", "uvicorn", "server:app", "--host", "127.0.0.1", "--port", String(backendPort)],
    {
      env: { ...process.env, NORI_DISABLE_LIVE_PACK: "1", OPENAI_API_KEY: "", ANTHROPIC_API_KEY: "" },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  for (const stream of [backend.stdout, backend.stderr])
    stream.on("data", (data) => { backendLog = (backendLog + data).slice(-12_000); });
  let server;
  let context;
  let page;
  const states = {};
  const pageErrors = [];
  const consoleErrors = [];
  const failedAssets = [];
  const legacyRequests = [];
  try {
    await waitForBackend(backend, backendOrigin, () => backendLog);
    server = await preview({
      configFile: false,
      root,
      build: { outDir },
      preview: {
        host: "127.0.0.1",
        port: previewPort,
        strictPort: true,
        proxy: { "/api": { target: backendOrigin, ws: true } },
      },
    });
    context = await browser.newContext(browserOptions);
    await context.addInitScript(() => localStorage.setItem("arcade-language", "zh-CN"));
    page = await context.newPage();
    page.setDefaultTimeout(45_000);
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
    const response = await page.goto(`http://127.0.0.1:${previewPort}`, {
      waitUntil: "domcontentloaded",
      timeout: 60_000,
    });
    assert.ok(response?.ok(), `${label} entry returned ${response?.status()}`);
    const bypass = page.getByText("仍要进入", { exact: true });
    if (await bypass.count()) await bypass.click();
    await page.locator(".topbar-system-trigger").waitFor({ timeout: 90_000 });
    if (historical)
      await page.waitForFunction(
        () => [...document.querySelectorAll("canvas")].some((canvas) => canvas.width > 0 && canvas.height > 0),
        undefined,
        { timeout: 90_000 },
      );
    else
      await page.locator('[data-live2d-status="ready"]').waitFor({ timeout: 90_000 });

    for (const [index, game] of games.entries()) {
      const dock = page.locator(`[data-app-id="${game.id}"]`);
      await dock.waitFor();
      await dock.click();
      // Both implementations keep this exclusive chrome class for the full
      // window lifetime. Source-only host ids and animation attributes are
      // deliberately excluded from the paired selector.
      const host = page.locator(".nori-window-glass.nori-window-exclusive:visible");
      await host.waitFor();
      assert.equal(await host.count(), 1, `${label} ${game.id} must expose one exclusive window`);
      await page.waitForFunction(
        ({ heading }) => {
          const chrome = document.querySelector(".nori-window-glass.nori-window-exclusive");
          if (!(chrome instanceof HTMLElement)) return false;
          for (let element = chrome; element; element = element.parentElement) {
            if (Number.parseFloat(getComputedStyle(element).opacity) < 0.99) return false;
          }
          return [...chrome.querySelectorAll("h1")].some(
            (element) => element.getClientRects().length > 0 && element.textContent?.trim() === heading,
          );
        },
        { heading: game.heading },
      );
      await settle(page);
      const geometry = await host.boundingBox();
      assert.ok(geometry, `${label} ${game.id} window has no geometry`);
      const bytes = await page.screenshot({ animations: "disabled" });
      const file = `${String(index + 1).padStart(2, "0")}-${game.id}-start.png`;
      await writeFile(resolve(directory, file), bytes);
      states[game.id] = {
        file,
        bytes: bytes.byteLength,
        sha256: createHash("sha256").update(bytes).digest("hex"),
        heading: game.heading,
        geometry,
      };
      const exit = page.getByRole("button", { name: /^(?:Exit|退出)$/ }).last();
      await exit.waitFor();
      await exit.click();
      await host.waitFor({ state: "hidden" });
    }
    if (historical) assert.ok(legacyRequests.length > 0, "reference did not execute historical assets");
    else assert.deepEqual(legacyRequests, [], "candidate executed a historical JS/CSS asset");
    assert.deepEqual(pageErrors, [], `${label} raised browser page errors`);
    const result = {
      status: "complete",
      label,
      entry: historical ? "shipped public/index.html" : "materialized source cutover candidate",
      isolatedBackend: true,
      states,
      legacyRequests,
      pageErrors,
      consoleErrors,
      failedAssets,
    };
    await writeFile(resolve(directory, "metadata.json"), `${JSON.stringify(result, null, 2)}\n`);
    return { result, error: null };
  } catch (error) {
    if (page) {
      const bytes = await page.screenshot({ animations: "disabled" }).catch(() => null);
      if (bytes) await writeFile(resolve(directory, "capture-failure.png"), bytes);
    }
    const failure = {
      status: "failed",
      label,
      entry: historical ? "shipped public/index.html" : "materialized source cutover candidate",
      isolatedBackend: true,
      error: {
        name: error instanceof Error ? error.name : "Error",
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      states,
      legacyRequests,
      pageErrors,
      consoleErrors,
      failedAssets,
    };
    await writeFile(resolve(directory, "metadata.json"), `${JSON.stringify(failure, null, 2)}\n`);
    return { result: failure, error };
  } finally {
    await context?.close();
    await closePreview(server);
    backend.kill("SIGTERM");
    await writeFile(resolve(directory, "backend.log"), backendLog);
  }
}

let browser;
try {
  browser = await chromium.launch(probeLaunchOptions());
  const targets = [
    { label: "reference", outDir: publicDir, historical: true, backendPort: 47182, previewPort: 47183 },
    { label: "candidate", outDir: candidateDir, historical: false, backendPort: 47184, previewPort: 47185 },
  ];
  const failures = [];
  for (const target of targets) {
    const outcome = await captureTarget(target, browser);
    manifest.captures[target.label] = outcome.result;
    if (outcome.error) failures.push(outcome.error);
  }
  if (failures.length === 0) {
    for (const game of games) {
      const reference = manifest.captures.reference.states[game.id].geometry;
      const candidate = manifest.captures.candidate.states[game.id].geometry;
      try {
        assert.ok(
          Math.abs(reference.width - candidate.width) <= 1 && Math.abs(reference.height - candidate.height) <= 1,
          `${game.id} paired outer window sizes differ: ${reference.width}x${reference.height} vs ${candidate.width}x${candidate.height}`,
        );
      } catch (error) {
        failures.push(error);
      }
    }
  }
  manifest.completedAt = new Date().toISOString();
  manifest.reviewStatus = failures.length
    ? "paired capture incomplete; inspect partial metadata and failure screenshots"
    : "paired captures generated; human image review pending";
  if (failures.length)
    throw new AggregateError(failures, `${failures.length} game visual target capture(s) failed`);
  console.log(`Game visual reference generated at ${output}: four isolated paired start states.`);
} finally {
  await browser?.close();
  await writeFile(resolve(output, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
}
