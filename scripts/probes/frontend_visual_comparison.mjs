/**
 * Deterministic visual capture for the seven story scenes.
 *
 * ARTIFACT CAPTURE ONLY. There is no approved pixel baseline for these frames,
 * so this script deliberately implements no pixel diff, no scoring and no
 * pass/fail: a human reviews the PNGs. What makes the set reviewable is
 * `manifest.json`, which records for every frame the scene, the phase, the story
 * time read out of the scene's own StoryClock, and the exact fake-clock offset
 * that produced it.
 *
 * Mechanism is reused, not invented: the shipped harnesses in tests/ expose
 * window probes (`storyProbe`, `farewellEndingProbe`, `memoryDataseaProbe`,
 * `sceneTools`), and `page.clock.install()` + `fastForward`/`runFor` drive the
 * story clock exactly, so no frame depends on wall-clock timing or on a race
 * with a load. A frame that cannot be reached that way is skipped and the reason
 * is recorded; frames are never faked or approximated.
 *
 * Run: node scripts/probes/frontend_visual_comparison.mjs
 */
import { chromium } from "playwright";
import { probeLaunchOptions } from "../lib/probe_launch.mjs";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { spawn } from "node:child_process";
import { solveDataseaCoreGame } from "../lib/frontend_datasea_core_game_inputs.mjs";
import { solveDataseaGame } from "../lib/frontend_datasea_game_inputs.mjs";

const output = resolve(
  process.env.NORI_VISUAL_OUTPUT ?? ".artifacts/visual-comparison",
);
const port = Number(process.env.NORI_VISUAL_PORT ?? 47176);
const origin = `http://127.0.0.1:${port}`;
const viewport = { width: 1100, height: 800 };
/** cult-flash keeps its StoryClock inside the effect and only publishes progress. */
const CULT_FLASH_DURATION = 7;

const manifest = {
  version: 1,
  purpose:
    "reviewable story-scene frame artifacts; no pixel baseline, no diff, no pass/fail",
  generatedAt: new Date().toISOString(),
  viewport,
  driver:
    "playwright page.clock fake clock; story time is read from each scene's own StoryClock, never estimated",
  frames: [],
  skipped: [],
};

await mkdir(output, { recursive: true });

/** Same static fixture document the story probes serve, per harness needs. */
const harnessDocument = ({
  source,
  stylesheet = false,
  cubism = false,
  background = "#161a1e",
}) =>
  `<html><head>${
    stylesheet ? '<link rel="stylesheet" href="/styles/app.css">' : ""
  }</head><body style="margin:0;background:${background}"><div id="root"></div>${
    cubism ? '<script src="/cubism_sdk/Core/live2dcubismcore.js"></script>' : ""
  }<script type="module">import RefreshRuntime from "/@react-refresh";RefreshRuntime.injectIntoGlobalHook(window);window.$RefreshReg$=()=>{};window.$RefreshSig$=()=>type=>type;window.__vite_plugin_react_preamble_installed__=true;</script><script type="module" src="/@fs/${resolve(
    source,
  )}"></script></body></html>`;

/**
 * Read a scene's own StoryClock out of its React fiber, the same read-only
 * observation the in-repo minigame solvers use. Scenes that also publish
 * `data-time` are cross-checked against this in shoot(), so a recorded time can
 * never drift away from what the frame actually shows.
 */
const clockProbe = ({ scene, cultDuration }) => {
  const host = document.querySelector(`[data-story-scene="${scene}"]`);
  if (!host) return null;
  const published = host.dataset.time ? Number(host.dataset.time) : null;
  let fiber = host[Object.keys(host).find((name) => name.startsWith("__reactFiber$"))];
  while (fiber && !fiber.memoizedProps?.story) fiber = fiber.return;
  for (let hook = fiber?.memoizedState; hook; hook = hook.next) {
    const clock = hook.memoizedState?.current;
    if (clock && typeof clock.snapshot === "function") {
      const { time, phase, parkedAt, complete, duration } = clock.snapshot();
      return { time, phase, parkedAt, complete, duration, published, source: "scene StoryClock" };
    }
  }
  if (host.dataset.progress)
    return {
      time: Number(host.dataset.progress) * cultDuration,
      phase: "cult",
      parkedAt: null,
      complete: false,
      duration: cultDuration,
      published,
      source: "data-progress",
    };
  return null;
};

async function openHarness(
  browser,
  { path, source, query = "", stylesheet, cubism, background, pauseIn = 1000 },
) {
  const page = await browser.newPage({ viewport });
  page.setDefaultTimeout(60000);
  const installedAt = Date.now();
  await page.clock.install({ time: installedAt });
  await page.clock.pauseAt(installedAt + pauseIn);
  await page.route(`**/${path}*`, (route) =>
    route.fulfill({
      contentType: "text/html",
      body: harnessDocument({ source, stylesheet, cubism, background }),
    }),
  );
  await page.goto(`${origin}/${path}${query}`);
  return {
    page,
    installedAt,
    /** Fake-clock ms elapsed since install, so solver-driven advances stay exact. */
    now: () => page.evaluate(() => Date.now()),
    step: (milliseconds) => page.clock.runFor(milliseconds),
    /**
     * Set only for the one scene that keeps its clock inside the effect and
     * publishes no progress: the story time is then the fake-clock offset from
     * the frame the scene announced itself ready.
     */
    anchor: null,
  };
}

const readClock = async (ctx, scene) =>
  (await ctx.page.evaluate(clockProbe, { scene, cultDuration: CULT_FLASH_DURATION })) ??
  (ctx.anchor === null
    ? null
    : {
        time: ((await ctx.now()) - ctx.anchor) / 1000,
        phase: scene,
        parkedAt: null,
        complete: false,
        published: null,
        source: "fake-clock offset from the scene's own start signal (±1 frame)",
      });

/** Step the fake clock until `predicate` holds for a DOM query in the page. */
async function until(ctx, description, predicate, arg, timeout = 90000) {
  const deadline = Date.now() + timeout;
  do {
    await ctx.step(40);
    if (await ctx.page.evaluate(predicate, arg)) return;
  } while (Date.now() < deadline);
  throw new Error(`Timed out waiting for ${description}`);
}

/** Step the fake clock until `predicate` holds for the scene's StoryClock. */
async function untilClock(ctx, scene, description, predicate, timeout = 90000) {
  const deadline = Date.now() + timeout;
  do {
    await ctx.step(40);
    const clock = await readClock(ctx, scene);
    if (clock && predicate(clock)) return clock;
  } while (Date.now() < deadline);
  throw new Error(`Timed out waiting for ${description}`);
}

/** Drive the scene clock to an exact story time; large jumps skip rendering frames. */
async function advanceTo(ctx, scene, seconds) {
  let clock = await readClock(ctx, scene);
  if (!clock) throw new Error(`${scene}: no mounted scene clock to drive`);
  const remaining = Math.round((seconds - clock.time) * 1000);
  if (remaining > 500) {
    await ctx.page.clock.fastForward(remaining - 250);
    await ctx.step(40);
  }
  // Close the gap on the animation-frame grid.
  for (let attempt = 0; attempt < 400; attempt++) {
    clock = await readClock(ctx, scene);
    if (clock.time >= seconds) return clock;
    // A pending gate (the antivirus QTE) releases on its own frames; one that
    // is still holding after that is a frame we cannot reach, not a rough one.
    if (clock.parkedAt && attempt > 8)
      throw new Error(
        `${scene}: parked at phase ${clock.parkedAt} and cannot reach ${seconds}s`,
      );
    await ctx.step(Math.max(40, Math.ceil((seconds - clock.time) * 1000)));
  }
  throw new Error(`${scene}: could not reach story time ${seconds}s`);
}

async function shoot(ctx, { id, scene, note, clip }) {
  const clock = await readClock(ctx, scene);
  if (!clock || clock.time === null) throw new Error(`${id}: scene clock unavailable`);
  if (clock.published !== null && Math.abs(clock.published - clock.time) > 0.05)
    throw new Error(
      `${id}: rendered data-time ${clock.published} disagrees with the story clock ${clock.time}`,
    );
  const file = `${id}.png`;
  await ctx.page.screenshot({
    path: resolve(output, file),
    ...(clip ? { clip } : {}),
  });
  const clockOffsetMs = (await ctx.now()) - ctx.installedAt;
  manifest.frames.push({
    id,
    file,
    scene,
    phase: clock.phase,
    storyTimeSeconds: Number(clock.time.toFixed(3)),
    parkedAt: clock.parkedAt,
    storyTimeSource: clock.source,
    clockOffsetMs,
    note: note ?? null,
  });
  console.log(
    `  ✓ ${id}  phase=${clock.phase}  t=${clock.time.toFixed(2)}s  clock +${clockOffsetMs}ms`,
  );
}

/**
 * Clears the six in-scene Antivirus games through their own input handlers, as
 * scripts/probes/frontend_antivirus_probe.mjs does for the same component. The QTE is a
 * hard gate: without this the heal/exitSnap/wake phases cannot be reached.
 */
async function clearAntivirusQte(ctx) {
  const { page } = ctx,
    panel = (name) => page.locator(`[data-antivirus-game="${name}"]`);
  for (const button of await panel("terminal")
    .locator('button[data-hostile="true"]')
    .all())
    await button.click();
  await ctx.step(300);
  for (const button of await panel("surgery")
    .locator('button[data-hostile="true"]')
    .all())
    await button.click();
  for (let attempt = 0; attempt < 160; attempt++) {
    if ((await panel("rhythm").getAttribute("data-solved")) === "true") break;
    await ctx.step(30);
    await page.evaluate(() => {
      const beat = document.querySelector("[data-beat-position]");
      const position = Number(beat?.dataset.beatPosition);
      if (position >= 0.58 && position <= 0.66)
        document.querySelector(".antivirus-pulse").click();
    });
  }
  if ((await panel("rhythm").getAttribute("data-solved")) !== "true")
    throw new Error("antivirus rhythm panel did not clear");
  for (const [key, value] of [
    ["frequency", "2"],
    ["phase", "1.57"],
    ["gain", "1"],
  ])
    await page.getByLabel(key, { exact: true }).fill(value);
  await ctx.step(750);
  const anchor = panel("preference");
  for (const choice of [0, 1, 1, 0, 0]) {
    await anchor.getByRole("button").nth(choice).click();
    await ctx.step(650);
  }
  const steering = page.getByRole("application", {
    name: "通信链路校准",
    exact: true,
  });
  await steering.scrollIntoViewIfNeeded();
  const box = await steering.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  for (let attempt = 0; attempt < 300; attempt++) {
    if ((await panel("steer").getAttribute("data-solved")) === "true") break;
    const target = await steering.evaluate((element) => ({
      x: Number(element.dataset.targetX),
      y: Number(element.dataset.targetY),
    }));
    await page.mouse.move(
      box.x + ((1 + target.x) * box.width) / 2,
      box.y + ((1 + target.y) * box.height) / 2,
    );
    await ctx.step(50);
  }
  await page.mouse.up();
  const cleared = Number(
    await page
      .locator("[data-antivirus-cleared]")
      .getAttribute("data-antivirus-cleared"),
  );
  if (cleared !== 6) throw new Error(`antivirus QTE cleared ${cleared}/6`);
}

/** Boot: cold open, fracture, dive, glyph draw, formed model, wake gate. */
async function captureBoot(browser) {
  const scene = "boot";
  const ctx = await openHarness(browser, {
    path: "boot-corruption-harness",
    source: "tests/frontend/harness/frontend-boot-corruption-harness.tsx",
    stylesheet: true,
    cubism: true,
  });
  try {
    await until(
      ctx,
      "Live2D model",
      () => document.querySelector(".nori-stage")?.dataset.live2dStatus === "ready",
    );
    await ctx.page.evaluate(() => window.storyProbe.start("boot"));
    // Boot only starts consuming the clock once cold-open resources are ready.
    await until(
      ctx,
      "cold-open resources",
      () => document.querySelector(".nori-stage")?.dataset.coldOpen === "ready",
    );
    for (const [id, at, note] of [
      ["boot-01-initial", 0.6, "fracture opening"],
      ["boot-02-fracture", 11.8, "same story time the story probe captures"],
      ["boot-03-ocean", 15.0, "surface break, ocean depth ramp"],
      ["boot-04-glyph", 31.5, "glyph draw"],
      ["boot-05-formed", 41.4, "Nori fully formed, authored formed camera, still short of the face"],
      ["boot-06-wake", 43.7, "parked at the ready gate, TAP TO WAKE visible"],
    ]) {
      await advanceTo(ctx, scene, at);
      await shoot(ctx, { id, scene, note });
    }
  } finally {
    await ctx.page.close();
  }
}

/** Ending: void, ascent, glyph, arrived face at the wake gate, desktop return. */
async function captureEnding(browser) {
  const scene = "ending";
  const ctx = await openHarness(browser, {
    path: "farewell-ending-harness",
    source: "tests/frontend/harness/frontend-farewell-ending-harness.tsx",
    stylesheet: true,
    cubism: true,
    background: "#05080d",
  });
  try {
    await ctx.page.evaluate(() => window.farewellEndingProbe.mount("ending"));
    await until(
      ctx,
      "Ending cold-open resources",
      () =>
        document.querySelector('[data-story-scene="ending"]') !== null &&
        document.querySelector(".nori-stage")?.dataset.coldOpen === "ready",
    );
    for (const [id, at, note] of [
      ["ending-01-void", 1.2, "void, the ocean has not risen yet"],
      ["ending-02-ascent", 12.0, "ascent through the water column"],
      ["ending-03-glyph", 20.0, "glyph draw"],
      ["ending-04-final", 32.6, "arrived face camera, parked at the ready gate"],
    ]) {
      await advanceTo(ctx, scene, at);
      await shoot(ctx, { id, scene, note });
    }
    await untilClock(ctx, scene, "Ending wake gate", (clock) => clock.parkedAt === "ready");
    await ctx.page.getByRole("button", { name: "Wake Nori" }).click();
    await advanceTo(ctx, scene, 35.5);
    await shoot(ctx, {
      id: "ending-05-desktop-return",
      scene,
      note: "after the wake control, camera settled back to the desktop view",
    });
  } finally {
    await ctx.page.close();
  }
}

/** Corruption: entry console, QTE, all-clear, heal, exit snap, wake gate. */
async function captureCorruption(browser) {
  const scene = "nori-corruption-climax";
  const ctx = await openHarness(browser, {
    path: "boot-corruption-harness",
    source: "tests/frontend/harness/frontend-boot-corruption-harness.tsx",
    stylesheet: true,
    cubism: true,
  });
  try {
    await until(
      ctx,
      "Live2D model",
      () => document.querySelector(".nori-stage")?.dataset.live2dStatus === "ready",
    );
    await ctx.page.evaluate(() => window.storyProbe.start("nori-corruption-climax"));
    await untilClock(ctx, scene, "voice gate", (clock) => clock.parkedAt === "awaitVoice");
    await ctx.page.evaluate(() => window.storyProbe.voiceDone());
    await advanceTo(ctx, scene, 9.0);
    await shoot(ctx, { id: "corruption-01-entry", scene, note: "entry console, vignette peak" });
    await advanceTo(ctx, scene, 11.21);
    await until(
      ctx,
      "antivirus panels",
      () => document.querySelectorAll("[data-antivirus-game]").length === 6,
    );
    await shoot(ctx, {
      id: "corruption-02-qte",
      scene,
      note: "QTE gate, six antivirus panels unsolved",
    });
    await clearAntivirusQte(ctx);
    await shoot(ctx, {
      id: "corruption-03-qte-all-clear",
      scene,
      note: "6/6 panels cleared, captured before the gate releases",
    });
    for (const [id, at, note] of [
      ["corruption-04-recovery", 18.0, "heal, first third"],
      ["corruption-05-recovery-late", 28.0, "heal, closing in on the snap"],
      ["corruption-06-exit-snap", 30.0, "exitSnap push-in"],
      ["corruption-07-wake", 31.12, "parked at the wake gate"],
    ]) {
      await advanceTo(ctx, scene, at);
      await shoot(ctx, { id, scene, note });
    }
  } finally {
    await ctx.page.close();
  }
}

/** Memory: the five ordered read gates, then the flood and the attack phases. */
async function captureMemory(browser) {
  const scene = "memory";
  const ctx = await openHarness(browser, {
    path: "memory-datasea-harness",
    query: "?scene=memory",
    source: "tests/frontend/harness/frontend-memory-datasea-harness.tsx",
  });
  const { page } = ctx;
  try {
    const expectedItems = [4, 5, 4, 5, 6];
    for (let index = 0; index < expectedItems.length; index++) {
      const gate = `win${index + 1}`;
      await untilClock(ctx, scene, `memory ${gate}`, (clock) => clock.parkedAt === gate);
      const active = page.locator('[data-mem-active="true"]');
      for (let item = 1; item < expectedItems[index]; item++) {
        await active.click();
        await ctx.step(40);
      }
      await shoot(ctx, {
        id: `memory-0${index + 1}-${gate}`,
        scene,
        note: `all ${expectedItems[index]} records revealed`,
      });
      await active.click();
    }
    // The last record holds for 4.8s before the gate releases itself.
    await advanceTo(ctx, scene, 6.0);
    await shoot(ctx, { id: "memory-06-flood", scene, note: "flood of incoming archives" });
    for (const [id, at, note] of [
      ["memory-07-attack", 21.0, "attack, red tint and shake"],
      ["memory-08-sweep", 28.0, "sweep"],
      ["memory-09-drain", 30.0, "drain"],
      ["memory-10-void", 39.0, "void"],
    ]) {
      await advanceTo(ctx, scene, at);
      await shoot(ctx, { id, scene, note });
    }
  } finally {
    await page.close();
  }
}

/** Datasea: descent, messages, the three wave gates and a wave transition. */
async function captureDatasea(browser) {
  const scene = "datasea";
  const ctx = await openHarness(browser, {
    path: "memory-datasea-harness",
    source: "tests/frontend/harness/frontend-memory-datasea-harness.tsx",
  });
  const { page } = ctx;
  try {
    await until(
      ctx,
      "Datasea renderer",
      () => document.querySelector('[data-story-scene="datasea"][data-ready="true"]') !== null,
    );
    for (const [id, at, note] of [
      ["datasea-01-descent", 2.0, "descent; the authored descent is near-black past 2s, this is the last stretch with the water texture visible"],
      ["datasea-02-messages", 50.0, "messages, mid narrative"],
    ]) {
      await advanceTo(ctx, scene, at);
      await shoot(ctx, { id, scene, note });
    }
    // The wave gate parks the story clock, so every wave frame reports this time.
    await advanceTo(ctx, scene, 88.8);
    await until(ctx, "wave gate", () => document.querySelector(".datasea-waves") !== null);
    for (const [id, transitionId, wave, games] of [
      ["datasea-03-wave1", "datasea-06-wave1-transition", 1, ["denoise", "sweep", "unknot", "relay"]],
      ["datasea-05-wave2", "datasea-07-wave2-transition", 2, ["discern", "echo", "steady", "balance"]],
      ["datasea-08-wave3", null, 3, ["current", "lure", "resonance", "ripple"]],
    ]) {
      await until(
        ctx,
        `wave ${wave}`,
        (next) =>
          document.querySelector(
            `.datasea-waves[aria-label="Signal wave ${next} of 3"] .datasea-game`,
          ) !== null,
        wave,
      );
      await ctx.step(600);
      await shoot(ctx, {
        id,
        scene,
        note: `Signal wave ${wave} of 3, four minigame windows`,
      });
      if (wave === 1) {
        const box = await page
          .locator('.datasea-game[data-game="denoise"]')
          .first()
          .boundingBox();
        await shoot(ctx, {
          id: "datasea-04-game-denoise",
          scene,
          note: "representative wave-1 minigame, cropped to its window",
          clip: {
            x: Math.max(0, box.x - 8),
            y: Math.max(0, box.y - 40),
            width: Math.min(viewport.width, box.width + 16),
            height: Math.min(viewport.height, box.height + 48),
          },
        });
      }
      for (const gameId of games) {
        const solved =
          (await solveDataseaCoreGame(page, gameId)) ||
          (await solveDataseaGame(page, gameId));
        if (!solved) throw new Error(`no real-input solver for ${gameId}`);
      }
      if (transitionId) {
        await until(
          ctx,
          `wave ${wave} transmission`,
          () => {
            const transmission = document.querySelector(".datasea-wave-break");
            // Wait for landed lines, not the empty typing indicator.
            return (
              transmission !== null &&
              Number(transmission.getAttribute("aria-label").split(" ")[1]) >= 2
            );
          },
        );
        await shoot(ctx, {
          id: transitionId,
          scene,
          note: `wave ${wave} cleared, transmission before wave ${wave + 1}`,
        });
      }
    }
  } finally {
    await page.close();
  }
}

/** Farewell: the actor, three scripted expressions, and the hard cut. */
async function captureFarewell(browser) {
  const scene = "farewell";
  const ctx = await openHarness(browser, {
    path: "farewell-ending-harness",
    source: "tests/frontend/harness/frontend-farewell-ending-harness.tsx",
    stylesheet: true,
    cubism: true,
    background: "#05080d",
  });
  try {
    await ctx.page.evaluate(() => window.farewellEndingProbe.mount("farewell"));
    // The farewell scene starts its clock on the same frame the actor reports
    // ready, and keeps the clock inside its effect, so that frame is the anchor.
    await until(ctx, "Farewell actor", () => {
      const host = document.querySelector('[data-story-scene="farewell"]');
      if (
        host?.dataset.ready !== "true" ||
        host.querySelectorAll("canvas").length !== 2
      )
        return false;
      window.farewellStart ??= Date.now();
      return true;
    });
    ctx.anchor = await ctx.page.evaluate(() => window.farewellStart);
    for (const [id, at, note] of [
      ["farewell-01-actor", 9.0, "actor and compositor, first cue; presence only reaches full strength at 7.4s"],
      ["farewell-02-expression-smile", 16.9, "cue aghhjs, smile"],
      ["farewell-03-expression-sad", 34.5, "cue 6mawbk, sad"],
      ["farewell-04-expression-eyes-closed", 111.9, "cue p72jpq, eyes-closed smile"],
      ["farewell-05-final-visible", 117.0, "last frame before the authored hard cut at 117.41s"],
      ["farewell-06-final-transition", 117.8, "after the hard cut, black"],
    ]) {
      await advanceTo(ctx, scene, at);
      await shoot(ctx, { id, scene, note });
    }
  } finally {
    await ctx.page.close();
  }
}

/** cult-flash: shader flash, driven by the same StoryClock as every other scene. */
async function captureCultFlash(browser) {
  const scene = "cult-flash";
  const ctx = await openHarness(browser, {
    path: "scene-tools-harness",
    source: "tests/frontend/harness/frontend-scene-tools-harness.tsx",
    stylesheet: true,
  });
  try {
    await until(ctx, "scene tools probe", () => Boolean(window.sceneTools));
    await ctx.page.evaluate(() => {
      window.sceneTools.closeDebug();
      window.sceneTools.start();
    });
    await until(
      ctx,
      "cult flash",
      () => document.querySelector('[data-story-scene="cult-flash"]') !== null,
    );
    for (const [id, at, note] of [
      ["cult-flash-01", 2.5, "shader flash, first third"],
      ["cult-flash-02", 5.0, "shader flash, closing"],
    ]) {
      await advanceTo(ctx, scene, at);
      await shoot(ctx, { id, scene, note });
    }
  } finally {
    await ctx.page.close();
  }
}

const SCENES = [
  ["Boot", captureBoot],
  ["Ending", captureEnding],
  ["Corruption", captureCorruption],
  ["Memory", captureMemory],
  ["Datasea", captureDatasea],
  ["Farewell", captureFarewell],
  ["cult-flash", captureCultFlash],
];

const vite = spawn(
  process.execPath,
  [
    "node_modules/vite/bin/vite.js",
    "--config",
    "frontend-src/app.vite.config.ts",
    "--host",
    "127.0.0.1",
    "--port",
    String(port),
    "--strictPort",
  ],
  { stdio: ["ignore", "pipe", "pipe"] },
);
let viteLog = "";
for (const stream of [vite.stdout, vite.stderr])
  stream.on("data", (data) => {
    viteLog = (viteLog + data).slice(-8000);
  });

let browser;
const started = Date.now();
try {
  const deadline = Date.now() + 90000;
  let ready = false;
  while (Date.now() < deadline && !ready) {
    try {
      ready = (await fetch(origin)).ok;
    } catch {}
    if (!ready) {
      if (vite.exitCode !== null)
        throw new Error(`Story Vite server exited: ${viteLog}`);
      await new Promise((resolve) => setTimeout(resolve, 150));
    }
  }
  if (!ready) throw new Error(`Story Vite server did not start: ${viteLog}`);

  browser = await chromium.launch(probeLaunchOptions());
  for (const [index, [label, capture]] of SCENES.entries()) {
    console.log(`[${index + 1}/${SCENES.length}] ${label}`);
    const before = manifest.frames.length;
    try {
      await capture(browser);
    } catch (error) {
      // A scene that cannot be reached deterministically is recorded, not faked.
      const reason = String(error && error.message ? error.message : error);
      manifest.skipped.push({ scene: label.toLowerCase(), reason });
      console.warn(`  ! ${label} skipped: ${reason}`);
    }
    console.log(`  -> ${manifest.frames.length - before} frame(s)`);
  }
} finally {
  await browser?.close();
  vite.kill("SIGTERM");
  // A leaked dev server is what kept an earlier run alive for 40 minutes.
  await Promise.race([
    new Promise((resolve) => vite.once("exit", resolve)),
    new Promise((resolve) => setTimeout(resolve, 3000)),
  ]);
  if (vite.exitCode === null) vite.kill("SIGKILL");
  manifest.completedAt = new Date().toISOString();
  manifest.runtimeSeconds = Math.round((Date.now() - started) / 1000);
  manifest.frameCount = manifest.frames.length;
  await writeFile(
    resolve(output, "manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );
}

console.log(
  `\n${manifest.frameCount} frame(s) in ${output}/ (${manifest.runtimeSeconds}s)`,
);
for (const entry of manifest.skipped)
  console.log(`skipped ${entry.scene}: ${entry.reason}`);
