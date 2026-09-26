import assert from "node:assert/strict";
import { chromium } from "playwright";
import { probeLaunchOptions } from "./probe_launch.mjs";
import { resolve } from "node:path";

const BOOT = '[data-story-scene="boot"]';
const BOOT_ALERT = `${BOOT} [role="alert"]`;

/** One fixture document, shared by the 1100x800 pass and every matrix case. */
const HARNESS_DOCUMENT = `<html><link rel="stylesheet" href="/styles/app.css"><body style="margin:0;background:#161a1e"><div id="root"></div><script src="/cubism_sdk/Core/live2dcubismcore.js"></script><script type="module">import RefreshRuntime from "/@react-refresh"; RefreshRuntime.injectIntoGlobalHook(window); window.$RefreshReg$=()=>{}; window.$RefreshSig$=()=>type=>type; window.__vite_plugin_react_preamble_installed__=true;</script><script type="module" src="/@fs/${resolve("tests/frontend-boot-corruption-harness.tsx")}"></script></body></html>`;

const SCENE = '[data-story-scene="nori-corruption-climax"]';
/** Shipped `TUNE_LIMITS` target/tolerance, keyed by the shipped slider labels. */
const TUNE_TARGET = { frequency: 2, phase: Math.PI / 2, gain: 1 };
const TUNE_TOLERANCE = { frequency: 0.06, phase: 0.11, gain: 0.08 };
/** Scene channels the corruption scene owns, so a release is observable. */
const CHANNELS = [
  "active",
  "noriDim",
  "darkness",
  "redLight",
  "vignette",
  "noriTint",
  "noriReveal",
  "noriTexture",
  "corruptVoice",
  "noriSleep",
  "noriSmile",
  "chatMode",
  "eyeOpen",
  "plankton",
  "camera",
];
const pick = (state, keys) =>
  Object.fromEntries(keys.map((key) => [key, state[key]]));

/** Holds matching requests open until released; later requests pass straight through. */
function routeLatch() {
  const waiters = [];
  let open = true,
    held = 0;
  return {
    get held() {
      return held;
    },
    async pass(handler) {
      if (open) return handler();
      held++;
      await new Promise((resolveWaiter) => waiters.push(resolveWaiter));
      held--;
      return handler();
    },
    hold() {
      open = false;
    },
    release() {
      open = true;
      waiters.splice(0).forEach((resolveWaiter) => resolveWaiter());
    },
  };
}

const coldOpen = (page) =>
  page.locator(".nori-stage").getAttribute("data-cold-open");
const bootPhase = (page) => page.locator(BOOT).getAttribute("data-phase");
const completions = (page) =>
  page.evaluate(() => window.storyProbe.completions);
const sceneActive = (page) =>
  page.evaluate(() => window.storyProbe.state().active);
const bootHost = (page) =>
  page.evaluate(() => {
    const host = document.querySelector('[data-story-scene="boot"]');
    return host ? { phase: host.dataset.phase, time: host.dataset.time } : null;
  });
/** The story overlay owns the whole viewport; `null` means the desktop is clickable. */
const ownsViewport = () =>
  document.elementFromPoint(innerWidth / 2, innerHeight / 2)
    ?.closest("[data-story-scene]")
    ?.getAttribute("data-story-scene") ?? null;

/**
 * Pixel deltas between two page screenshots, decoded in-page to keep the transfer
 * small. `changed` counts pixels past a 15/255 channel delta, `lit` counts pixels over
 * 60, `dim` over 20, and `ink` counts pixels differing from the harness page background.
 */
const changedPixels = (page, [first, second]) =>
  page.evaluate(
    async ([one, two]) => {
      const decode = async (base64) => {
        const image = new Image();
        image.src = "data:image/png;base64," + base64;
        await image.decode();
        const canvas = document.createElement("canvas");
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(image, 0, 0);
        return ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      };
      const [x, y] = await Promise.all([
        decode(one),
        two ? decode(two) : Promise.resolve(null),
      ]);
      let changed = 0,
        bright = 0,
        dim = 0,
        ink = 0;
      for (let i = 0; i < x.length; i += 4) {
        const peak = Math.max(x[i], x[i + 1], x[i + 2]);
        if (peak > 60) bright++;
        if (peak > 20) dim++;
        if (
          Math.max(
            Math.abs(x[i] - 22),
            Math.abs(x[i + 1] - 26),
            Math.abs(x[i + 2] - 30),
          ) > 12
        )
          ink++;
        if (
          y &&
          Math.max(
            Math.abs(x[i] - y[i]),
            Math.abs(x[i + 1] - y[i + 1]),
            Math.abs(x[i + 2] - y[i + 2]),
          ) > 15
        )
          changed++;
      }
      return { changed, bright, dim, ink, total: x.length / 4 };
    },
    [first, second ?? null],
  );

/**
 * Scene audio is only observable once a track has decoded into a live mixer
 * handle, which takes real time the faked clock does not provide.
 */
async function awaitLiveSceneAudio(page) {
  let live = 0;
  for (let i = 0; i < 40 && !live; i++) {
    await page.clock.runFor(40);
    live = await page.evaluate(() => window.storyProbe.audioSources());
  }
  return live;
}

/** Backing stores against their layout boxes, with the pixel ratio each owner uses. */
const canvasSizes = (page) =>
  page.evaluate(() => {
    const box = (element) => ({
      backing: [element.width, element.height],
      layout: [
        element.parentElement.clientWidth,
        element.parentElement.clientHeight,
      ],
    });
    return {
      shatter: box(document.querySelector('[data-story-scene="boot"] canvas')),
      scene: box(
        document.querySelector('.nori-stage canvas[data-scene-canvas]'),
      ),
      pixelRatio: Math.min(window.devicePixelRatio || 1, 2),
    };
  });

function assertCanvasSizes(sizes, label) {
  for (const name of ["shatter", "scene"]) {
    const { backing, layout } = sizes[name];
    assert.ok(
      backing[0] > 1 && backing[1] > 1,
      `${label}: ${name} canvas must have a drawable target, got ${backing}`,
    );
    assert.notEqual(
      backing.join("x"),
      "300x150",
      `${label}: ${name} canvas kept the default backing store`,
    );
    assert.deepEqual(
      backing,
      layout.map((value) => Math.floor(value * sizes.pixelRatio)),
      `${label}: ${name} canvas backing store must match its layout box`,
    );
  }
}

/** A real hidden tab runs no rAF; the faked clock keeps firing them regardless. */
const hiddenTabFrames = () => {
  const raf = window.requestAnimationFrame.bind(window);
  window.requestAnimationFrame = (callback) =>
    raf((now) =>
      document.hidden ? window.requestAnimationFrame(callback) : callback(now),
    );
};

const scenePhase = (page) => page.locator(SCENE).getAttribute("data-phase");
const sceneTime = (page) => Number(page.locator(SCENE).getAttribute("data-time"));
const channels = (page) =>
  page.evaluate(
    (keys) => Object.fromEntries(keys.map((key) => [key, window.storyProbe.state()[key]])),
    CHANNELS,
  );
const panel = (page, game) => page.locator(`[data-antivirus-game="${game}"]`);
const solved = async (page, game) =>
  (await panel(page, game).getAttribute("data-solved")) === "true";
/** The fake clock only ticks frames on runFor, so every jump is paired with one. */
const jump = async (page, ms) => {
  await page.clock.fastForward(ms);
  await page.clock.runFor(40);
};

async function pollUntil(page, predicate, label) {
  const deadline = Date.now() + 90000;
  do {
    await page.clock.runFor(40);
    if (await page.evaluate(predicate)) return;
  } while (Date.now() < deadline);
  assert.fail(label);
}

async function openHarness(
  browser,
  origin,
  { viewport = { width: 1100, height: 800 }, reducedMotion = false } = {},
) {
  const page = await browser.newPage({ viewport }),
    errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (
      message.type() === "error" &&
      /Shader Error|VALIDATE_STATUS|ReferenceError|TypeError/.test(message.text())
    )
      errors.push(message.text());
  });
  const time = Date.now();
  await page.clock.install({ time });
  await page.clock.pauseAt(time + 1000);
  if (reducedMotion) await page.emulateMedia({ reducedMotion: "reduce" });
  await page.route("**/boot-corruption-harness", (route) =>
    route.fulfill({ contentType: "text/html", body: HARNESS_DOCUMENT }),
  );
  await page.goto(origin + "/boot-corruption-harness");
  await pollUntil(
    page,
    () => document.querySelector(".nori-stage")?.dataset.live2dStatus === "ready",
    "model load",
  );
  return { page, errors };
}

/** Enter the scene and park on the voice gate. No reply is invented anywhere. */
async function enterCorruption(page, label) {
  await page.evaluate(() => window.storyProbe.start("nori-corruption-climax"));
  await page.clock.runFor(1200);
  assert.equal(await page.locator("[data-antivirus-game]").count(), 0, `${label}: panels must not exist before the QTE`);
  assert.equal(await scenePhase(page), "awaitVoice", `${label}: must park on the voice gate`);
}

/** The shipped 12s local fallback, not a simulated agent/speech reply. */
async function releaseVoiceGate(page, label) {
  await jump(page, 12500);
  assert.notEqual(
    await scenePhase(page),
    "awaitVoice",
    `${label}: the shipped 12s wake fallback must release the voice gate without a backend reply`,
  );
}

async function reachQte(page, label, onEntry) {
  await jump(page, 7500);
  if (onEntry) await onEntry();
  await jump(page, 3500);
  assert.equal(await scenePhase(page), "qte", `${label}: must park on the production QTE gate`);
  assert.equal(await page.locator("[data-antivirus-game]").count(), 6, `${label}: all six antivirus panels must be present`);
}

/** The QTE gate is input-gated: wall time alone must never release it. */
async function assertQteGateHolds(page, label) {
  const parked = await sceneTime(page);
  await page.clock.runFor(4000);
  assert.equal(await sceneTime(page), parked, `${label}: a parked QTE clock must not advance on its own`);
  assert.equal(await scenePhase(page), "qte", `${label}: the QTE gate must still hold after 4s of foreground time`);
}

async function waitSolved(page, game, label) {
  for (let i = 0; i < 80; i++) {
    if (await solved(page, game)) return;
    await page.clock.runFor(50);
  }
  assert.fail(`${label}: ${game} never reported solved`);
}

async function solveTerminal(page, label) {
  const rows = panel(page, "terminal").locator('button[data-hostile="true"]');
  assert.equal(await rows.count(), 4, `${label}: four hostile processes must be offered`);
  // A row already killed or in flight stays disabled, so click what is offered.
  for (let round = 0; round < 20 && !(await solved(page, "terminal")); round++) {
    for (let i = 0; i < 4; i++)
      if (await rows.nth(i).isEnabled()) await rows.nth(i).click();
    await page.clock.runFor(300);
  }
  assert.ok(await solved(page, "terminal"), `${label}: four kills must solve the terminal game`);
}

async function solveSurgery(page, label) {
  const nodes = panel(page, "surgery").locator(".antivirus-nodes button[data-hostile=\"true\"]");
  assert.equal(await nodes.count(), 4, `${label}: four hostile nodes must be offered`);
  for (let i = 0; i < 4; i++)
    if (await nodes.nth(i).isEnabled()) await nodes.nth(i).click();
  assert.ok(await solved(page, "surgery"), `${label}: four cleared nodes must solve the surgery game`);
}

async function solveRhythm(page, label) {
  const beat = panel(page, "rhythm").locator(".antivirus-beat"),
    pulse = panel(page, "rhythm").locator(".antivirus-pulse");
  let windowed = false;
  for (let i = 0; i < 400 && !(await solved(page, "rhythm")); i++) {
    const position = Number(await beat.getAttribute("data-beat-position"));
    const inWindow = position >= 0.53 && position <= 0.71;
    if (inWindow && !windowed) await pulse.click();
    windowed = inWindow;
    await page.clock.runFor(25);
  }
  assert.ok(await solved(page, "rhythm"), `${label}: four in-window hits must solve the rhythm game`);
}

/** Real keyboard only: focus the slider and step it onto the shipped target. */
async function alignTune(page, label) {
  for (const [key, target] of Object.entries(TUNE_TARGET)) {
    const input = panel(page, "tune").locator(`input[aria-label="${key}"]`);
    // The shipped sliders step by 0.01, so a whole run is batched per pass.
    const { step } = await input.evaluate((el) => ({ step: Number(el.step) }));
    for (let pass = 0; pass < 8; pass++) {
      const press = Math.round((target - Number(await input.inputValue())) / step);
      for (let n = 0; n < Math.abs(press); n++)
        await input.press(press > 0 ? "ArrowRight" : "ArrowLeft");
      if (press === 0) break;
    }
    assert.ok(
      Math.abs(Number(await input.inputValue()) - target) <= TUNE_TOLERANCE[key],
      `${label}: ${key} must land on the shipped target channel, got ${await input.inputValue()}`,
    );
  }
  await waitSolved(page, "tune", label);
}

const anchorCount = async (page) =>
  Number(
    (await panel(page, "preference").locator("p").last().textContent()).split("/")[0].trim(),
  );

/** No shipped table is read: wrong choices are simply rejected and retried. */
async function solvePreference(page, label) {
  const buttons = panel(page, "preference").locator("button");
  assert.equal(await buttons.count(), 2, `${label}: two anchor choices must be offered`);
  for (let round = 0; round < 40 && !(await solved(page, "preference")); round++) {
    if (await buttons.nth(0).isDisabled()) {
      await page.clock.runFor(200);
      continue;
    }
    const before = await anchorCount(page);
    await buttons.nth(0).click();
    await page.clock.runFor(700);
    if ((await anchorCount(page)) !== before) continue;
    if (await buttons.nth(1).isDisabled()) {
      await page.clock.runFor(200);
      continue;
    }
    await buttons.nth(1).click();
    await page.clock.runFor(700);
  }
  assert.ok(await solved(page, "preference"), `${label}: five verified anchor checks must pass`);
}

const steerState = (page) =>
  panel(page, "steer").locator(".antivirus-steer").evaluate((el) => {
    const dot = el.querySelector("i");
    const style = (node) => Number.parseFloat(String(node.style.left || "50%"));
    const styleY = (node) => Number.parseFloat(String(node.style.top || "50%"));
    return {
      x: (style(dot) - 50) / 50,
      y: (styleY(dot) - 50) / 50,
      tx: Number(el.dataset.targetX),
      ty: Number(el.dataset.targetY),
      radius: Number.parseFloat(el.querySelector(".antivirus-target").style.width) / 100,
    };
  });

/** Real pointer only: a held drag is the attractor; the pointer is released after. */
async function solveSteerPointer(page, label) {
  const box = panel(page, "steer").locator(".antivirus-steer");
  await box.scrollIntoViewIfNeeded();
  const rect = await box.boundingBox();
  const aim = (value, target) => Math.max(-0.97, Math.min(0.97, value + (target - value) * 1.6));
  await page.mouse.move(rect.x + rect.width / 2, rect.y + rect.height / 2);
  await page.mouse.down();
  try {
    for (let i = 0; i < 300 && !(await solved(page, "steer")); i++) {
      const s = await steerState(page);
      await page.mouse.move(
        rect.x + (rect.width * (aim(s.x, s.tx) + 1)) / 2,
        rect.y + (rect.height * (aim(s.y, s.ty) + 1)) / 2,
      );
      await page.clock.runFor(100);
    }
  } finally {
    await page.mouse.up();
  }
  assert.ok(await solved(page, "steer"), `${label}: a held pointer drag must solve the signal game`);
}

/** Real keyboard only: arrow keys walk the same attractor; nothing is pointed at. */
async function solveSteerKeyboard(page, label) {
  await panel(page, "steer").locator(".antivirus-steer").focus();
  for (let i = 0; i < 400 && !(await solved(page, "steer")); i++) {
    const s = await steerState(page);
    const dx = s.tx - s.x,
      dy = s.ty - s.y;
    const distance = Math.hypot(dx, dy);
    // Inside the ring the attractor stays put and the dot damps out, so only
    // tap short corrections: a held key injects the velocity stability rejects.
    if (distance <= s.radius * 0.8) {
      await page.clock.runFor(200);
      continue;
    }
    const keys = [
      dx > 0.01 ? "ArrowRight" : dx < -0.01 ? "ArrowLeft" : null,
      dy > 0.01 ? "ArrowDown" : dy < -0.01 ? "ArrowUp" : null,
    ].filter(Boolean);
    for (const key of keys) await page.keyboard.down(key);
    await page.clock.runFor(
      Math.round(Math.max(40, Math.min(220, distance * 500))),
    );
    for (const key of keys) await page.keyboard.up(key);
    await page.clock.runFor(200);
  }
  assert.ok(await solved(page, "steer"), `${label}: arrow keys alone must solve the signal game`);
}

/** Solve the production QTE through real input, then assert the all-clear. */
async function solveQte(page, { steer, label }) {
  await solveTerminal(page, label);
  await solveSurgery(page, label);
  await solveRhythm(page, label);
  await alignTune(page, label);
  await solvePreference(page, label);
  if (steer === "pointer") await solveSteerPointer(page, label);
  else await solveSteerKeyboard(page, label);
  assert.equal(
    await page.locator("section.antivirus").getAttribute("data-antivirus-cleared"),
    "6",
    `${label}: all-clear must be reported as 6/6 (${steer} input)`,
  );
  await page.clock.runFor(900);
  const allClear = {
    panels: await page.locator("[data-antivirus-game]").count(),
    phase: await scenePhase(page),
  };
  console.log(`  matrix ${label}: all-clear ${JSON.stringify(allClear)}`);
  assert.equal(
    allClear.panels,
    0,
    `${label}: all-clear must unmount the six panels (${steer} input), got ${JSON.stringify(allClear)}`,
  );
  // The clock must be ordered PAST the QTE, not merely different from it. Reading
  // data-time here raced the scene's own teardown: once the director released the
  // story React dropped the attribute and the read returned null, so the
  // redundant numeric check failed on every case. Phase order is the deterministic
  // expression of the same fact, and the QTE gate itself is already proven by the
  // parked-clock assertions before the solvers run.
  const order = ["minimize", "awaitVoice", "panUp", "dread", "entry", "qte", "exitDark", "heal", "exitSnap", "wake", "settle"];
  const reached = order.indexOf(allClear.phase ?? "");
  assert.ok(
    reached > order.indexOf("qte"),
    `${label}: the scene clock must resume past the QTE marker (${steer} input), got ${JSON.stringify(allClear)}`,
  );
}

async function assertWakeGate(page, label) {
  await jump(page, 20000);
  assert.equal(await scenePhase(page), "wake", `${label}: heal, exitSnap and settle must reach the wake gate`);
  const button = page.getByRole("button", { name: "Wake Nori", exact: true });
  assert.equal(await button.count(), 1, `${label}: the wake gate must offer its control`);
  assert.ok(await button.isEnabled(), `${label}: the wake gate must be operable`);
  assert.ok(await button.isVisible(), `${label}: the wake gate must be visible`);
  return button;
}

/** Two captures of the same surface: lit, and still changing. */
async function frameStats(page, stepMs) {
  await page.screenshot();
  await page.clock.runFor(stepMs);
  const one = (await page.screenshot()).toString("base64");
  await page.clock.runFor(stepMs);
  const two = (await page.screenshot()).toString("base64");
  return page.evaluate(async ([a, b]) => {
    const decode = async (base64) => {
      const image = new Image();
      image.src = "data:image/png;base64," + base64;
      await image.decode();
      const canvas = document.createElement("canvas");
      canvas.width = image.width;
      canvas.height = image.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(image, 0, 0);
      return ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    };
    const [left, right] = await Promise.all([decode(a), decode(b)]);
    let changed = 0,
      lit = 0;
    for (let i = 0; i < left.length; i += 4) {
      if (left[i] + left[i + 1] + left[i + 2] > 60) lit++;
      if (
        Math.max(
          Math.abs(left[i] - right[i]),
          Math.abs(left[i + 1] - right[i + 1]),
          Math.abs(left[i + 2] - right[i + 2]),
        ) > 15
      )
        changed++;
    }
    return { changed, lit, total: left.length / 4 };
  }, [one, two]);
}

/**
 * Every control inside the scene must be reachable and hittable.
 *
 * The six antivirus panels are a responsive DOM grid roughly 2000px tall, so at
 * a 390x740 viewport they cannot all be simultaneously on screen under any
 * layout. "Individually operable" therefore means reachable by scrolling, not
 * simultaneously visible: each control is scrolled into view first and the
 * "off screen" branch only fires for what stays unreachable afterwards, or for a
 * genuine horizontal/negative-origin overflow. The scene root scrolls (see
 * corruption-scene.tsx); before that it was a fixed inset-0 box with no overflow,
 * which made the lower panels genuinely unreachable.
 */
const reachability = () => {
  const root = document.querySelector('[data-story-scene="nori-corruption-climax"]');
  if (!root) return { count: 0, blocked: ["scene root is missing"] };
  const controls = [
    ...root.querySelectorAll('button, input, [role="application"], canvas'),
  ];
  const blocked = [];
  const scrollable = root.scrollHeight > root.clientHeight + 1;
  for (const el of controls) {
    const name =
      el.getAttribute("aria-label") ?? el.textContent?.trim().slice(0, 18) ?? el.tagName;
    el.scrollIntoView({ block: "center", inline: "center" });
    const rect = el.getBoundingClientRect();
    if (!rect.width || !rect.height) {
      blocked.push(`${name}: not rendered`);
      continue;
    }
    // Horizontal overflow and a negative origin are layout faults at any size.
    if (rect.left < -0.5 || rect.right > innerWidth + 0.5) {
      blocked.push(
        `${name}: ${Math.round(rect.left)}..${Math.round(rect.right)}px across a ${innerWidth}px viewport`,
      );
      continue;
    }
    if (rect.top < -0.5 || rect.bottom > innerHeight + 0.5) {
      blocked.push(
        `${name}: ${Math.round(rect.top)}..${Math.round(rect.bottom)}px in a ${innerHeight}px viewport after scrolling (scene scrollable: ${scrollable})`,
      );
      continue;
    }
    const hit = document.elementFromPoint(
      rect.left + rect.width / 2,
      rect.top + rect.height / 2,
    );
    if (!hit || !(hit === el || el.contains(hit) || hit.contains(el)))
      blocked.push(`${name}: covered by ${hit ? hit.tagName : "nothing"}`);
  }
  return { count: controls.length, blocked, scrollable };
};

export async function verifyBootCorruption(
  browser,
  output,
  origin = "http://127.0.0.1:47175",
) {
  const page = await browser.newPage({
      viewport: { width: 1100, height: 800 },
    }),
    errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (
      message.type() === "error" &&
      /Shader Error|VALIDATE_STATUS|ReferenceError|TypeError/.test(
        message.text(),
      )
    )
      errors.push(message.text());
  });
  const time = Date.now();
  await page.clock.install({ time });
  await page.clock.pauseAt(time + 1000);
  let failOcean = false;
  // Register before the successful load, so decoded-image cache cannot bypass
  // the subsequent failure injection.
  await page.route("**/ocean/gradient-noise.jpg", (route) =>
    failOcean ? route.abort() : route.continue(),
  );
  await page.route("**/boot-corruption-harness", (route) =>
    route.fulfill({ contentType: "text/html", body: HARNESS_DOCUMENT }),
  );
  const until = async (predicate, label) => {
    const deadline = Date.now() + 90000;
    do {
      await page.clock.runFor(40);
      if (await page.evaluate(predicate)) return;
    } while (Date.now() < deadline);
    assert.fail(label);
  };
  try {
    await page.goto(origin + "/boot-corruption-harness");
    await until(
      () =>
        document.querySelector(".nori-stage")?.dataset.live2dStatus === "ready",
      "model load",
    );
    await page.evaluate(() => window.storyProbe.start("boot"));
    await until(
      () => document.querySelector(".nori-stage")?.dataset.coldOpen === "ready",
      "cold resources",
    );
    await page.clock.fastForward(11800);
    await page.clock.runFor(40);
    await page.screenshot({ path: resolve(output, "boot-fracture.png") });
    await page.clock.fastForward(2400);
    await page.clock.runFor(40);
    await page.screenshot({ path: resolve(output, "boot-shatter-dive.png") });
    await page.clock.fastForward(33000);
    await page.clock.runFor(40);
    assert.equal(
      await page
        .locator('[data-story-scene="boot"]')
        .getAttribute("data-phase"),
      "ready",
    );
    assert.deepEqual(
      await page.evaluate(() => window.storyProbe.completions),
      [],
    );
    await page.screenshot({ path: resolve(output, "boot-wake-gate.png") });
    // Compare rendered pixels with only the actor coverage toggled, catching a
    // backward-facing camera even when timeline and wake button both work.
    await page.evaluate(() => window.storyProbe.actorCapture(false));
    await page.clock.runFor(40);
    const withActor = (await page.screenshot()).toString("base64");
    await page.evaluate(() => window.storyProbe.actorCapture(true));
    await page.clock.runFor(40);
    const withoutActor = (await page.screenshot()).toString("base64");
    const actorPixels = await page.evaluate(
      async ([a, b]) => {
        const decode = async (base64) => {
          const image = new Image();
          image.src = "data:image/png;base64," + base64;
          await image.decode();
          const canvas = document.createElement("canvas");
          canvas.width = image.width;
          canvas.height = image.height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(image, 0, 0);
          return ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        };
        const [one, two] = await Promise.all([decode(a), decode(b)]);
        let changed = 0;
        for (let i = 0; i < one.length; i += 4)
          if (
            Math.max(
              Math.abs(one[i] - two[i]),
              Math.abs(one[i + 1] - two[i + 1]),
              Math.abs(one[i + 2] - two[i + 2]),
            ) > 15
          )
            changed++;
        return changed;
      },
      [withActor, withoutActor],
    );
    assert.ok(
      actorPixels > 5000,
      `wake actor must occupy rendered pixels; changed ${actorPixels}`,
    );
    await page.evaluate(() => window.storyProbe.actorCapture(null));
    await page.clock.runFor(40);
    await page.clock.fastForward(100000);
    assert.deepEqual(
      await page.evaluate(() => window.storyProbe.completions),
      [],
    );
    await page.getByRole("button", { name: "Wake Nori", exact: true }).click();
    await page.clock.fastForward(3600);
    await page.clock.runFor(40);
    assert.deepEqual(await page.evaluate(() => window.storyProbe.completions), [
      "boot.completed",
    ]);
    await page.clock.fastForward(1600);
    await page.clock.runFor(40);
    assert.equal(
      await page.evaluate(() => window.storyProbe.state().active),
      false,
    );

    failOcean = true;
    await page.evaluate(() => window.storyProbe.start("boot"));
    await until(
      () =>
        Boolean(
          document.querySelector('[data-story-scene="boot"] [role="alert"]'),
        ),
      "Boot resource failure must offer retry",
    );
    assert.equal(
      await page.evaluate(() => window.storyProbe.state().active),
      false,
    );
    failOcean = false;
    await page.getByRole("button", { name: "Retry", exact: true }).click();
    await until(
      () => document.querySelector(".nori-stage")?.dataset.coldOpen === "ready",
      "Boot retry must create fresh resources",
    );
    await page.evaluate(() => window.storyProbe.cancel());
    await page.clock.runFor(40);
    assert.deepEqual(await page.evaluate(() => window.storyProbe.completions), [
      "boot.completed",
    ]);

    await page.evaluate(() =>
      window.storyProbe.start("nori-corruption-climax"),
    );
    await page.clock.runFor(1200);
    assert.equal(await page.evaluate(() => window.storyProbe.minimized()), 1);
    assert.equal(
      await page
        .locator('[data-story-scene="nori-corruption-climax"]')
        .getAttribute("data-phase"),
      "awaitVoice",
    );
    await page.evaluate(() => window.storyProbe.visibility(true));
    await page.clock.fastForward(20000);
    assert.equal(
      await page
        .locator('[data-story-scene="nori-corruption-climax"]')
        .getAttribute("data-phase"),
      "awaitVoice",
    );
    await page.evaluate(() => {
      window.storyProbe.visibility(false);
      window.storyProbe.voiceDone();
    });
    await page.clock.fastForward(7300);
    await page.clock.runFor(40);
    await page.screenshot({
      path: resolve(output, "corruption-entry-console.png"),
    });
    await page.clock.fastForward(4000);
    await page.clock.runFor(40);
    assert.equal(await page.locator("[data-antivirus-game]").count(), 6);
    assert.ok(
      (await page.evaluate(() => window.storyProbe.events)).some(
        (e) =>
          e[0] === "nori_talk.request" && e[1].talkId === "corruption_scare",
      ),
    );
    await page.screenshot({
      path: resolve(output, "corruption-production-qte.png"),
    });
    await page.evaluate(() => window.storyProbe.cancel());
    await page.clock.runFor(40);
    assert.equal(await page.locator("[data-antivirus-game]").count(), 0);
    assert.equal(
      await page.evaluate(() => window.storyProbe.state().active),
      false,
    );
    assert.deepEqual(await page.evaluate(() => window.storyProbe.completions), [
      "boot.completed",
    ]);
    await page.evaluate(() => window.storyProbe.unmount());
    assert.deepEqual(errors, []);
    console.log(
      "Boot/Corruption production probe: fracture, dive, wake completion, request, voice gate, QTE and cancellation passed",
    );

    // ------------------------------------------------------------------
    // Corruption interaction matrix. Purely additive: the 1100x800 pass
    // above is untouched, and every case below re-enters the same shipped
    // scene on its own page, always through the shipped 12s voice fallback.
    // ------------------------------------------------------------------
    const matrix = [];
    const strays = [];
    // A GPU/browser loss rejects in-flight Playwright waits; record it and keep going.
    const onStray = (reason) =>
      strays.push(`unhandled rejection: ${reason?.message ?? reason}`);
    process.on("unhandledRejection", onStray);
    let browserLost = null;
    browser.on("disconnected", () => {
      browserLost = browserLost ?? "the browser disconnected mid-matrix";
    });
    const attempt = async (label, body) => {
      if (browserLost) {
        matrix.push(`FAIL ${label}: ${browserLost}`);
        console.log(`  matrix FAIL ${label}: ${browserLost}`);
        return;
      }
      const started = Date.now();
      try {
        await body();
        const line = `PASS ${label} (${Date.now() - started}ms)`;
        matrix.push(line);
        console.log(`  matrix ${line}`);
      } catch (error) {
        const line = `FAIL ${label}: ${error.message}`;
        matrix.push(line);
        console.log(`  matrix ${line}`);
      }
    };
    const withPage = async (options, body) => {
      // One browser per case, not one page. Each case mounts a real Cubism model
      // plus the cold-open renderer; reusing a single browser for eight live2d
      // pages exhausted the WebGL contexts, the page died mid-case, and every
      // case after the first reported a null scene time.
      const scoped = await chromium.launch(probeLaunchOptions());
      try {
        const { page: fresh, errors: freshErrors } = await openHarness(
          scoped,
          origin,
          options,
        );
        try {
          await body(fresh);
          assert.deepEqual(freshErrors, []);
        } finally {
          await fresh.close();
        }
      } finally {
        await scoped.close();
      }
    };
    /** Nothing from the previous document may survive, and nothing may complete. */
    const assertReloadedClean = async (page, label, baseline) => {
      assert.equal(await page.locator("[data-story-scene]").count(), 0, `${label}: no scene element may survive the reload`);
      assert.equal(await page.locator("[data-antivirus-game]").count(), 0, `${label}: no antivirus panel may survive the reload`);
      assert.equal(await page.locator("[data-scene-effect]").count(), 0, `${label}: no scene effect may survive the reload`);
      assert.equal(await page.locator(SCENE).count(), 0, `${label}: the corruption scene must be gone`);
      assert.equal(await page.evaluate(() => document.documentElement.style.filter), "", `${label}: the corruption glitch filter must be released`);
      assert.equal(
        await page.evaluate(() => document.querySelectorAll('svg filter[id^="nori-corruption-glitch"]').length),
        0,
        `${label}: the corruption glitch filter element must be released`,
      );
      assert.deepEqual(await page.evaluate(() => window.storyProbe.state()), baseline, `${label}: the desktop must be back at baseline`);
      assert.deepEqual(await page.evaluate(() => window.storyProbe.completions), [], `${label}: no completion may fire on the way out`);
    };
    const assertEntryOverlay = async (page, label) => {
      const overlay = page.locator(`${SCENE} canvas`).first();
      assert.equal(await overlay.count(), 1, `${label}: the entry console must be mounted`);
      const box = await overlay.boundingBox();
      assert.ok(
        box && box.width >= 390 && box.height >= 740,
        `${label}: the entry overlay must cover the viewport, got ${JSON.stringify(box)}`,
      );
      assert.equal(
        await page.locator('[data-scene-effect="vignette"]').count(),
        1,
        `${label}: the entry vignette must be mounted`,
      );
    };
    /** Every shipped control must be on screen and unoccluded, and clickable. */
    const assertReachable = async (page, label) => {
      const sweep = await page.evaluate(reachability);
      const blocked = [...sweep.blocked];
      for (const selector of [
        '[data-antivirus-game="terminal"] button[data-hostile="true"]',
        '[data-antivirus-game="surgery"] .antivirus-nodes button[data-hostile="true"]',
        '[data-antivirus-game="rhythm"] .antivirus-pulse',
        '[data-antivirus-game="tune"] input[aria-label="frequency"]',
        '[data-antivirus-game="preference"] button',
        '[data-antivirus-game="steer"] .antivirus-steer',
      ]) {
        try {
          await page.locator(selector).first().click({ timeout: 2500 });
        } catch (error) {
          blocked.push(`${selector}: ${error.message.split("\n")[0]}`);
        }
      }
      console.log(
        `  matrix ${label}: ${sweep.count} controls, ${blocked.length} unreachable`,
      );
      assert.equal(blocked.length, 0, `${label}: every antivirus panel must be present and individually operable:\n    - ${blocked.join("\n    - ")}`);
    };

    await attempt("narrow viewport 390x740", () =>
      withPage({ viewport: { width: 390, height: 740 } }, async (narrow) => {
        const label = "narrow 390x740";
        await enterCorruption(narrow, label);
        await releaseVoiceGate(narrow, label);
        await reachQte(narrow, label, () => assertEntryOverlay(narrow, label));
        await assertReachable(narrow, label);
        await assertQteGateHolds(narrow, label);
        assert.equal(
          await narrow.locator("section.antivirus").getAttribute("data-antivirus-cleared"),
          "0",
          `${label}: the QTE must still be unsolved at the narrow width`,
        );
      }),
    );

    await attempt("wide viewport 1366x900", () =>
      withPage({ viewport: { width: 1366, height: 900 } }, async (wide) => {
        const label = "wide 1366x900";
        await enterCorruption(wide, label);
        await releaseVoiceGate(wide, label);
        await reachQte(wide, label, () => assertEntryOverlay(wide, label));
        await assertReachable(wide, label);
        await assertQteGateHolds(wide, label);
        await solveQte(wide, { steer: "pointer", label });
        await assertWakeGate(wide, label);
      }),
    );

    await attempt("QTE keyboard-only, and a wrong/slow gate input", () =>
      withPage({}, async (keys) => {
        const label = "QTE keyboard-only";
        await enterCorruption(keys, label);
        await releaseVoiceGate(keys, label);
        await reachQte(keys, label);
        // Wrong input: a system process is not a kill order.
        const terminal = panel(keys, "terminal");
        await terminal.locator('button[data-hostile="false"]').first().click();
        await keys.clock.runFor(400);
        assert.equal(
          Number(await terminal.locator("progress").getAttribute("value")),
          0,
          `${label}: a system process must not count as terminated`,
        );
        assert.equal(
          await terminal.locator('button[data-hostile="false"]').first().isDisabled(),
          false,
          `${label}: the rejected row must stay operable`,
        );
        // Slow input: a press outside the shipped window is rejected.
        const beat = panel(keys, "rhythm").locator(".antivirus-beat"),
          pulse = panel(keys, "rhythm").locator(".antivirus-pulse");
        for (let i = 0; i < 200; i++) {
          if (Number(await beat.getAttribute("data-beat-position")) < 0.4) {
            await pulse.click();
            break;
          }
          await keys.clock.runFor(25);
        }
        await keys.clock.runFor(400);
        assert.match(
          await panel(keys, "rhythm").locator('[role="status"]').textContent(),
          /错过/,
          `${label}: an off-window press must be rejected`,
        );
        await assertQteGateHolds(keys, label);
        assert.equal(
          await keys.locator("section.antivirus").getAttribute("data-antivirus-cleared"),
          "0",
          `${label}: wrong and slow input must leave the gate closed, so it is not merely time-based`,
        );
        await solveQte(keys, { steer: "keyboard", label });
        await assertWakeGate(keys, label);
      }),
    );

    await attempt("QTE pointer-only, same gate and same all-clear", () =>
      withPage({}, async (pointer) => {
        const label = "QTE pointer-only";
        await enterCorruption(pointer, label);
        await releaseVoiceGate(pointer, label);
        await reachQte(pointer, label);
        await solveQte(pointer, { steer: "pointer", label });
        assert.equal(
          await pointer.locator('[data-scene-effect="vignette"]').count(),
          1,
          `${label}: the heal vignette must be mounted`,
        );
        await jump(pointer, 2000);
        const live = await channels(pointer);
        assert.ok(
          live.noriDim > 2.9 && live.darkness > 0.8,
          `${label}: heal must own noriDim/darkness before the takeover, got ${JSON.stringify(pick(live, ["noriDim", "darkness", "vignette"]))}`,
        );
        // Takeover: a different story starts while corruption is mid-run.
        await pointer.evaluate(() => window.storyProbe.start("boot"));
        await pollUntil(
          pointer,
          () =>
            !document.querySelector('[data-story-scene="nori-corruption-climax"]') &&
            Boolean(document.querySelector('[data-story-scene="boot"]')),
          `${label}: the takeover must replace the scene`,
        );
        await pointer.clock.runFor(200);
        const after = await channels(pointer);
        assert.deepEqual(
          pick(after, ["noriDim", "darkness", "vignette", "redLight", "noriTint", "corruptVoice", "noriTexture", "chatMode", "noriSmile", "plankton"]),
          {
            noriDim: 0,
            darkness: 0.04,
            vignette: 0,
            redLight: 0,
            noriTint: 0,
            corruptVoice: false,
            noriTexture: null,
            chatMode: "hidden",
            noriSmile: null,
            plankton: 0.18,
          },
          `${label}: the takeover must release every corruption channel`,
        );
        assert.ok(after.camera.y > 10, `${label}: only the new story may own the camera, got y=${after.camera.y}`);
        assert.equal(
          await pointer.locator('[data-scene-effect="vignette"]').count(),
          0,
          `${label}: the released vignette must be unmounted`,
        );
        assert.equal(await pointer.locator(SCENE).count(), 0, `${label}: the corruption scene must be gone`);
        assert.equal(
          await pointer.locator('[data-story-scene="boot"]').count(),
          1,
          `${label}: only the new story may remain`,
        );
        await jump(pointer, 5000);
        assert.deepEqual(
          await pointer.evaluate(() => window.storyProbe.completions),
          [],
          `${label}: a stale corruption callback must not fire`,
        );
        assert.equal(await pointer.locator(SCENE).count(), 0, `${label}: the corruption scene must not come back`);
      }),
    );

    await attempt("takeover while the six panels are live", () =>
      withPage({}, async (takeover) => {
        const label = "takeover@QTE";
        await enterCorruption(takeover, label);
        await releaseVoiceGate(takeover, label);
        await reachQte(takeover, label);
        const live = await channels(takeover);
        assert.deepEqual(
          pick(live, ["redLight", "noriTint", "corruptVoice", "noriTexture", "chatMode", "noriSmile", "eyeOpen"]),
          {
            redLight: 1,
            noriTint: 1,
            corruptVoice: true,
            noriTexture: "corrupt",
            chatMode: "bubbles",
            noriSmile: true,
            eyeOpen: 1,
          },
          `${label}: the QTE must own its corruption channels before the takeover`,
        );
        await takeover.evaluate(() => window.storyProbe.start("boot"));
        await pollUntil(
          takeover,
          () =>
            !document.querySelector('[data-story-scene="nori-corruption-climax"]') &&
            Boolean(document.querySelector('[data-story-scene="boot"]')),
          `${label}: the takeover must replace the scene`,
        );
        await takeover.clock.runFor(200);
        const after = await channels(takeover);
        assert.deepEqual(
          pick(after, ["redLight", "noriTint", "corruptVoice", "noriTexture", "chatMode", "noriSmile", "eyeOpen", "noriDim", "darkness", "vignette", "plankton"]),
          {
            redLight: 0,
            noriTint: 0,
            corruptVoice: false,
            noriTexture: null,
            chatMode: "hidden",
            noriSmile: null,
            eyeOpen: 0,
            noriDim: 0,
            darkness: 0.04,
            vignette: 0,
            plankton: 0.18,
          },
          `${label}: the takeover must release redLight/vignette/noriDim/darkness and the corrupt texture`,
        );
        assert.equal(
          await takeover.locator("[data-antivirus-game]").count(),
          0,
          `${label}: the six panels must be gone after the takeover`,
        );
        assert.equal(
          await takeover.locator("section.antivirus").count(),
          0,
          `${label}: the antivirus session must be torn down`,
        );
        assert.equal(await takeover.locator(SCENE).count(), 0, `${label}: the corruption scene must be gone`);
        assert.equal(
          await takeover.locator('[data-story-scene="boot"]').count(),
          1,
          `${label}: only the new story may remain`,
        );
        await jump(takeover, 5000);
        assert.deepEqual(
          await takeover.evaluate(() => window.storyProbe.completions),
          [],
          `${label}: a stale corruption completion must not fire`,
        );
      }),
    );

    await attempt("reload while parked on the voice gate", () =>
      withPage({}, async (voice) => {
        const label = "reload@voice";
        const baseline = await voice.evaluate(() => window.storyProbe.state());
        await enterCorruption(voice, label);
        await jump(voice, 3000);
        assert.equal(
          await scenePhase(voice),
          "awaitVoice",
          `${label}: the scene must still be parked on the voice gate`,
        );
        await voice.reload();
        await pollUntil(
          voice,
          () => document.querySelector(".nori-stage")?.dataset.live2dStatus === "ready",
          `${label}: the desktop must reload`,
        );
        await assertReloadedClean(voice, label, baseline);
        const again = `${label} re-entry`;
        await enterCorruption(voice, again);
        await releaseVoiceGate(voice, again);
        await reachQte(voice, again);
        await solveQte(voice, { steer: "pointer", label: again });
        const button = await assertWakeGate(voice, again);
        await button.click();
        await jump(voice, 4000);
        assert.deepEqual(
          await voice.evaluate(() => window.storyProbe.completions),
          ["virus.cleared"],
          `${again}: the shipped 12s fallback must carry the scene to completion with no backend reply`,
        );
        await jump(voice, 2000);
        assert.equal(await voice.locator(SCENE).count(), 0, `${again}: the completed scene must unmount`);
        assert.deepEqual(
          await voice.evaluate(() => window.storyProbe.state()),
          baseline,
          `${again}: the desktop must be back at baseline after completion`,
        );
      }),
    );

    await attempt("reload after the QTE cleared, before the wake gate", () =>
      withPage({}, async (heal) => {
        const label = "reload@heal";
        const baseline = await heal.evaluate(() => window.storyProbe.state());
        await enterCorruption(heal, label);
        await releaseVoiceGate(heal, label);
        await reachQte(heal, label);
        await solveQte(heal, { steer: "pointer", label });
        await jump(heal, 2000);
        assert.equal(await scenePhase(heal), "heal", `${label}: the scene must be in heal before the reload`);
        assert.ok(
          (await channels(heal)).noriDim > 2.9,
          `${label}: the corruption lease must be live before the reload`,
        );
        await heal.reload();
        await pollUntil(
          heal,
          () => document.querySelector(".nori-stage")?.dataset.live2dStatus === "ready",
          `${label}: the desktop must reload`,
        );
        await assertReloadedClean(heal, label, baseline);
        const again = `${label} re-entry`;
        await enterCorruption(heal, again);
        await releaseVoiceGate(heal, again);
        await reachQte(heal, again);
        await solveQte(heal, { steer: "keyboard", label: again });
        await assertWakeGate(heal, again);
      }),
    );

    await attempt("reduced motion", () =>
      withPage({ reducedMotion: true }, async (reduced) => {
        const label = "reduced motion";
        assert.equal(
          await reduced.evaluate(() => matchMedia("(prefers-reduced-motion: reduce)").matches),
          true,
          `${label}: the media override must be active`,
        );
        await enterCorruption(reduced, label);
        await releaseVoiceGate(reduced, label);
        await reachQte(reduced, label, async () => {
          const stats = await frameStats(reduced, 260);
          console.log(
            `  matrix ${label}: lit ${stats.lit}/${stats.total}, changed ${stats.changed}`,
          );
          assert.ok(
            stats.lit / stats.total > 0.1,
            `${label}: the corruption surface must stay lit, not black (${stats.lit}/${stats.total})`,
          );
          assert.ok(
            stats.changed > 5000,
            `${label}: the corruption surface must still change, changed ${stats.changed}`,
          );
          await reduced.screenshot({
            path: resolve(output, "corruption-reduced-motion.png"),
          });
        });
        await assertQteGateHolds(reduced, label);
        await solveQte(reduced, { steer: "pointer", label });
        await assertWakeGate(reduced, label);
      }),
    );

    // The 1100x800 pass is finished with its page, so release that WebGL context
    // before eight more live2d pages run.
    await page.close();
    const matrixFailures = matrix.filter((line) => line.startsWith("FAIL"));
    const problems = [...matrixFailures, ...strays];
    process.off("unhandledRejection", onStray);
    console.log(
      `Corruption interaction matrix: ${matrix.length - matrixFailures.length}/${matrix.length} cases passed${strays.length ? `, ${strays.length} stray rejections` : ""}`,
    );
    assert.equal(
      problems.length,
      0,
      `Corruption interaction matrix failures:\n    - ${problems.join("\n    - ")}`,
    );
  } finally {
    await page.close();
  }
}

/**
 * Boot lifecycle matrix: clean re-entry, mid-playback close, story takeover, late
 * asset completion, reduced motion, viewports and hidden-tab readiness. Each case
 * gets its own page, so no case can pass on another case's leftovers.
 */
export async function verifyBootLifecycleMatrix(
  browser,
  output,
  origin = "http://127.0.0.1:47175",
) {
  const ocean = routeLatch();
  const openPage = async ({
    viewport = { width: 1100, height: 800 },
    reducedMotion = false,
    initScript = null,
  } = {}) => {
    const page = await browser.newPage({ viewport }),
      own = [];
    page.on("pageerror", (error) => own.push(error.message));
    page.on("console", (message) => {
      if (
        message.type() === "error" &&
        /Shader Error|VALIDATE_STATUS|ReferenceError|TypeError/.test(
          message.text(),
        )
      )
        own.push(message.text());
    });
    const time = Date.now();
    await page.clock.install({ time });
    await page.clock.pauseAt(time + 1000);
    if (reducedMotion) await page.emulateMedia({ reducedMotion: "reduce" });
    if (initScript) await page.addInitScript(initScript);
    await page.route("**/ocean/gradient-noise.jpg", (route) =>
      ocean.pass(() => route.continue()),
    );
    await page.route("**/boot-corruption-harness", (route) =>
      route.fulfill({ contentType: "text/html", body: HARNESS_DOCUMENT }),
    );
    await page.goto(origin + "/boot-corruption-harness");
    await pollUntil(
      page,
      () =>
        document.querySelector(".nori-stage")?.dataset.live2dStatus ===
        "ready",
      "model load",
    );
    // Record every cold-open status change, so a transient "loading" (a brand new
    // renderer) cannot slip between two polls.
    await page.evaluate(() => {
      const stage = document.querySelector(".nori-stage");
      window.__cold = [stage.dataset.coldOpen];
      new MutationObserver(() => window.__cold.push(stage.dataset.coldOpen)).observe(
        stage,
        { attributes: true, attributeFilter: ["data-cold-open"] },
      );
    });
    return page;
  };
  const enterBoot = async (page) => {
    await page.evaluate(() => window.storyProbe.start("boot"));
    await pollUntil(
      page,
      () => Boolean(document.querySelector('[data-story-scene="boot"]')),
      "Boot must mount",
    );
    await pollUntil(
      page,
      () => document.querySelector(".nori-stage")?.dataset.coldOpen === "ready",
      "cold resources",
    );
  };
  const wake = async (page) => {
    await page.clock.fastForward(44000);
    await page.clock.runFor(40);
    const parked = await bootHost(page);
    assert.equal(
      parked?.phase,
      "ready",
      "the wake gate must park the clock",
    );
    assert.ok(
      Number(parked.time) > 43,
      `the wake gate must sit at the shipped 43.7s marker, got ${parked.time}`,
    );
    const button = page.getByRole("button", { name: "Wake Nori", exact: true });
    assert.equal(await button.count(), 1, "the wake gate must offer its control");
    await button.click();
    // The first jump carries the clock past the gate and emits the completion; the
    // director only releases the scene 1500ms after that acknowledgement, and a timer
    // armed during a jump does not fire inside the same jump.
    await page.clock.fastForward(3600);
    await page.clock.runFor(40);
    await page.clock.fastForward(1600);
    await page.clock.runFor(40);
    return parked;
  };
  /** A disposed mixer is only observable if it held something first. */
  const assertLiveSceneAudio = async (page, label) => {
    const live = await awaitLiveSceneAudio(page);
    assert.ok(
      live > 0,
      `${label}: the mixer must hold live scene audio (context ${await page.evaluate(() => window.storyProbe.audioState())}, sources ${live})`,
    );
  };
  /** The route handler runs on the Node side, so a held request appears a beat after the page asks for it. */
  const awaitHeldRequest = async (page, label) => {
    const deadline = Date.now() + 15000;
    while (ocean.held === 0 && Date.now() < deadline)
      await page.clock.runFor(40);
    assert.ok(ocean.held > 0, `${label}: the ocean request must actually be held`);
  };
  /**
   * Production installs the mixer's gesture listeners in source-app; the harness does
   * not, so the context stays dormant until the probe resumes it like a real click.
   */
  const unlockMixer = async (page, label) => {
    await page.mouse.click(4, 4);
    await page.evaluate(() => window.storyProbe.unlockAudio());
    await pollUntil(
      page,
      () => window.storyProbe.audioState() === "running",
      `${label}: a real gesture must leave the mixer running`,
    );
  };
  const results = [];
  const run = async (label, options, body) => {
    const at = Date.now();
    const page = await openPage(options);
    try {
      await body(page);
      const line = `PASS ${label} (${Date.now() - at}ms)`;
      results.push(line);
      console.log(`  boot-matrix ${line}`);
    } finally {
      await page.close();
    }
  };

  // 1. Clean re-entry. A completed Boot must mount, rebuild its cold-open
  //    resources, restart its clock and complete again.
  await run("clean re-entry", {}, async (page) => {
    await enterBoot(page);
    const finished = await wake(page);
    assert.deepEqual(
      await completions(page),
      ["boot.completed"],
      "re-entry: the first run must complete",
    );
    assert.equal(
      await sceneActive(page),
      false,
      "re-entry: the completed scene must release its lease",
    );
    await pollUntil(
      page,
      () => document.querySelector(".nori-stage")?.dataset.coldOpen === "inactive",
      "re-entry: the completed run must release its cold-open resources",
    );
    const mark = await page.evaluate(() => window.__cold.length);
    await page.evaluate(() => window.storyProbe.start("boot"));
    await pollUntil(
      page,
      () => document.querySelector(".nori-stage")?.dataset.coldOpen === "ready",
      "re-entry: the second run must rebuild cold-open resources",
    );
    const rebuilt = (await page.evaluate(() => window.__cold)).slice(mark);
    assert.ok(
      rebuilt.includes("loading"),
      `re-entry: a new cold-open renderer must load again, saw ${rebuilt.join(",")}`,
    );
    assert.equal(
      rebuilt.at(-1),
      "ready",
      `re-entry: the rebuilt renderer must reach ready, saw ${rebuilt.join(",")}`,
    );
    // The finished run parked at the gate; nothing of it may leak into this one.
    const restarted = await bootHost(page);
    assert.ok(restarted, "re-entry: the second run must be mounted");
    assert.equal(
      restarted.phase,
      "shatter",
      `re-entry: the phase must restart, not inherit ${finished.phase}`,
    );
    assert.ok(
      Number(restarted.time) < 1,
      `re-entry: the clock must restart at 0, not inherit ${finished.time}`,
    );
    assert.notDeepEqual(
      restarted,
      finished,
      "re-entry: no stale phase or time may leak from the previous run",
    );
    await wake(page);
    assert.deepEqual(
      await completions(page),
      ["boot.completed", "boot.completed"],
      "re-entry: both runs must complete",
    );
    assert.equal(
      await sceneActive(page),
      false,
      "re-entry: the second run must release its lease",
    );
  });

  // 2. Mid-playback close. Cancelling a running scene must tear the whole thing down.
  await run("mid-playback close", {}, async (page) => {
    await unlockMixer(page, "close");
    await enterBoot(page);
    await page.clock.fastForward(30000);
    await assertLiveSceneAudio(page, "close");
    assert.equal(
      await bootPhase(page),
      "draw",
      "close: the scene must be mid-playback, not parked",
    );
    assert.equal(
      await page.evaluate(ownsViewport),
      "boot",
      "close: a running story must own the viewport",
    );
    const before = await completions(page);
    await page.evaluate(() => window.storyProbe.cancel());
    await page.clock.runFor(40);
    assert.equal(
      await page.locator(BOOT).count(),
      0,
      "close: the scene element must be removed",
    );
    assert.equal(
      await sceneActive(page),
      false,
      "close: the lease must be released",
    );
    assert.equal(
      await page.evaluate(() => window.storyProbe.audioSources()),
      0,
      "close: the audio handles must be disposed",
    );
    assert.equal(
      await coldOpen(page),
      "inactive",
      "close: the cold-open resources must be released",
    );
    assert.equal(
      await page.evaluate(ownsViewport),
      null,
      "close: the desktop must be usable again",
    );
    await page.clock.fastForward(60000);
    await page.clock.runFor(40);
    assert.deepEqual(
      await completions(page),
      before,
      "close: a closed scene must never complete",
    );
    assert.equal(
      await page.locator(BOOT).count(),
      0,
      "close: a closed scene must stay closed",
    );
    assert.equal(
      await page.locator(".nori-stage").getAttribute("data-live2d-status"),
      "ready",
      "close: the desktop must keep rendering",
    );
  });

  // 3. Story takeover. A second activation replaces the instance; nothing of the
  //    replaced scene may survive, and no stale callback may reach the director.
  await run("story takeover", {}, async (page) => {
    await unlockMixer(page, "takeover");
    await enterBoot(page);
    await page.clock.fastForward(6000);
    await assertLiveSceneAudio(page, "takeover");
    const before = await completions(page);
    await page.evaluate(() =>
      window.storyProbe.start("nori-corruption-climax"),
    );
    await page.clock.runFor(80);
    assert.equal(
      await page.locator(BOOT).count(),
      0,
      "takeover: the replaced scene must leave no DOM",
    );
    assert.equal(
      await page.locator(`${BOOT} canvas`).count(),
      0,
      "takeover: the replaced scene must release its renderer canvas",
    );
    assert.equal(
      await page.locator(SCENE).count(),
      1,
      "takeover: only the new story may remain",
    );
    assert.equal(
      await page.evaluate(() => window.storyProbe.state().coldOpen),
      null,
      "takeover: the replaced lease must release its cold-open state",
    );
    assert.equal(
      await page.evaluate(() => window.storyProbe.audioSources()),
      0,
      "takeover: the replaced scene must dispose its audio",
    );
    assert.equal(
      await sceneActive(page),
      true,
      "takeover: the new story must own the lease",
    );
    await page.clock.fastForward(50000);
    await page.clock.runFor(200);
    assert.deepEqual(
      await completions(page),
      before,
      "takeover: a stale callback from the replaced instance must not fire",
    );
    assert.equal(
      await page.locator(BOOT).count(),
      0,
      "takeover: the replaced scene must not come back",
    );
  });

  // 4. Late asset completion. A request held open either completes inside the
  //    visible budget (no failure at all) or after it (a real failure whose late
  //    decode must be ignored by the released scene).
  await run("late asset inside the visible budget", {}, async (page) => {
    ocean.hold();
    await page.evaluate(() => window.storyProbe.start("boot"));
    await pollUntil(
      page,
      () => Boolean(document.querySelector('[data-story-scene="boot"]')),
      "late asset: a held request must still mount the scene",
    );
    await page.clock.fastForward(20000);
    await page.clock.runFor(40);
    await awaitHeldRequest(page, "late asset");
    assert.equal(
      await page.locator(BOOT_ALERT).count(),
      0,
      "late asset: a slow asset inside the visible budget is not a failure",
    );
    assert.equal(
      await coldOpen(page),
      "loading",
      "late asset: the ocean must still be loading",
    );
    ocean.release();
    await pollUntil(
      page,
      () => document.querySelector(".nori-stage")?.dataset.coldOpen === "ready",
      "late asset: a late ocean must still complete",
    );
    assert.equal(
      await page.locator(BOOT_ALERT).count(),
      0,
      "late asset: finishing late is not a failure",
    );
    await wake(page);
    assert.deepEqual(
      await completions(page),
      ["boot.completed"],
      "late asset: a late asset must still reach completion",
    );
  });

  // The complementary half needs its own page: Chromium answers a second request for
  // the same image from its decoded-image cache, and a cached read never reaches the
  // route, so there would be no in-flight request for a late decode to be ignored.
  await run("late asset past the visible budget", {}, async (page) => {
    ocean.hold();
    await page.evaluate(() => window.storyProbe.start("boot"));
    await pollUntil(
      page,
      () => document.querySelector(".nori-stage")?.dataset.coldOpen === "loading",
      "late asset: the over-budget run must have an ocean request in flight",
    );
    await awaitHeldRequest(page, "late asset");
    await page.clock.fastForward(70000);
    await pollUntil(
      page,
      () =>
        Boolean(
          document.querySelector(
            '[data-story-scene="boot"] [role="alert"]',
          ),
        ),
      "late asset: a request held past the visible budget must fail visibly",
    );
    assert.equal(
      await coldOpen(page),
      "inactive",
      "late asset: a failed scene must release its cold-open resources",
    );
    ocean.release();
    await page.clock.runFor(600);
    assert.equal(
      await coldOpen(page),
      "inactive",
      "late asset: a late decode must not revive a released scene",
    );
    assert.equal(
      await page.getByRole("button", { name: "Retry", exact: true }).count(),
      1,
      "late asset: a late decode must not take away the retry path",
    );
    await page.getByRole("button", { name: "Retry", exact: true }).click();
    await pollUntil(
      page,
      () => document.querySelector(".nori-stage")?.dataset.coldOpen === "ready",
      "late asset: a retry after a late decode must build fresh resources",
    );
    assert.equal(
      await page.locator(BOOT_ALERT).count(),
      0,
      "late asset: the retry must clear the failure",
    );
  });

  // 5. Reduced motion. The scene zeroes glitch/shock/filigree, never the canvas.
  await run(
    "reduced motion",
    { reducedMotion: true },
    async (page) => {
      assert.equal(
        await page.evaluate(() =>
          matchMedia("(prefers-reduced-motion: reduce)").matches,
        ),
        true,
        "reduced motion: the media override must be active before the scene mounts",
      );
      await enterBoot(page);
      /**
       * Two captures across the shatter break. The control repeats the same pair on
       * the same timeline with the shatter canvas hidden, so the desktop stage behind
       * it (which animates on its own) is measured instead of assumed away.
       */
      const shatterPair = async (hidden) => {
        await page.evaluate((hide) => {
          document.querySelector('[data-story-scene="boot"] canvas').style.display =
            hide ? "none" : "";
        }, hidden);
        await page.clock.fastForward(12000);
        await page.clock.runFor(80);
        const first = (await page.screenshot()).toString("base64");
        await page.clock.fastForward(3500);
        await page.clock.runFor(80);
        const second = (await page.screenshot()).toString("base64");
        return changedPixels(page, [first, second]);
      };
      const live = await shatterPair(false);
      await page.screenshot({ path: resolve(output, "boot-reduced-motion.png") });
      await page.evaluate(() => window.storyProbe.cancel());
      await page.clock.runFor(40);
      await pollUntil(
        page,
        () => document.querySelector(".nori-stage")?.dataset.coldOpen === "inactive",
        "reduced motion: release between captures",
      );
      await page.evaluate(() => window.storyProbe.start("boot"));
      await pollUntil(
        page,
        () => document.querySelector(".nori-stage")?.dataset.coldOpen === "ready",
        "reduced motion: cold resources after re-entry",
      );
      const backdrop = await shatterPair(true);
      await page.evaluate(() => {
        document.querySelector('[data-story-scene="boot"] canvas').style.display =
          "";
      });
      console.log(
        `  boot-matrix reduced motion pixels: live changed ${live.changed}/lit ${live.bright}/dim ${live.dim}/ink ${live.ink}, backdrop changed ${backdrop.changed}/dim ${backdrop.dim}`,
      );
      assert.ok(
        live.changed > 1000,
        `reduced motion: the shatter canvas must still change, changed ${live.changed}`,
      );
      assert.ok(
        live.changed > backdrop.changed * 3,
        `reduced motion: the shatter canvas must be the thing changing, live ${live.changed} vs backdrop ${backdrop.changed}`,
      );
      // Not a blank canvas: it painted over the page background, and it is not black.
      assert.ok(
        live.ink > live.total * 0.5,
        `reduced motion: the shatter canvas must paint, ink ${live.ink}/${live.total}`,
      );
      assert.ok(
        live.dim > live.total * 0.02,
        `reduced motion: the shatter canvas must not be a black canvas, dim ${live.dim}/${live.total}`,
      );
      await page.clock.fastForward(40000);
      await page.clock.runFor(80);
      assert.equal(
        await bootPhase(page),
        "ready",
        "reduced motion: the scene must still reach the wake gate",
      );
      assert.equal(
        await page.getByRole("button", { name: "Wake Nori", exact: true }).count(),
        1,
        "reduced motion: the wake gate must be offered",
      );
    }, );

  // 6. Compact and normal viewports, including a resize in the middle of a scene.
  await run("compact and normal viewports", {}, async (page) => {
    const done = [];
    for (const [index, viewport] of [
      { width: 390, height: 740 },
      { width: 1920, height: 1080 },
    ].entries()) {
      const label = `${viewport.width}x${viewport.height}`;
      const other = index === 0 ? { width: 1920, height: 1080 } : { width: 390, height: 740 };
      await page.setViewportSize(viewport);
      await enterBoot(page);
      await page.clock.runFor(120);
      assertCanvasSizes(await canvasSizes(page), `${label} at mount`);
      const opened = await bootPhase(page);
      await page.clock.fastForward(14000);
      await page.clock.runFor(120);
      const moved = await bootPhase(page);
      assert.ok(
        opened && moved && moved !== opened,
        `${label}: data-phase must advance, went ${opened} -> ${moved}`,
      );
      // Resize mid-scene: the renderer's backing store has to follow the box.
      const before = (await canvasSizes(page)).shatter.backing.join("x");
      await page.setViewportSize(other);
      await page.clock.runFor(240);
      const resized = await canvasSizes(page);
      assertCanvasSizes(resized, `${label} resized to ${other.width}x${other.height}`);
      assert.notEqual(
        resized.shatter.backing.join("x"),
        before,
        `${label}: a mid-scene resize must reach the renderer`,
      );
      await page.setViewportSize(viewport);
      await page.clock.runFor(240);
      assertCanvasSizes(await canvasSizes(page), `${label} restored`);
      await wake(page);
      done.push("boot.completed");
      assert.deepEqual(
        await completions(page),
        done.slice(),
        `${label}: the scene must complete at this size`,
      );
      await pollUntil(
        page,
        () => document.querySelector(".nori-stage")?.dataset.coldOpen === "inactive",
        `${label}: the completed scene must release its cold-open resources`,
      );
    }
  });

  // 7. Hidden-tab readiness. Background time must not spend the visible budget, and
  //    returning to the tab restarts it instead of reporting a false failure.
  await run(
    "hidden-tab readiness",
    { initScript: hiddenTabFrames },
    async (page) => {
      await page.evaluate(() => window.storyProbe.visibility(true));
      await page.evaluate(() => window.storyProbe.start("boot"));
      await page.clock.fastForward(90000);
      assert.ok(
        (await page.evaluate(() => performance.now())) > 60000,
        "hidden: the hidden wait must exceed the 60s visible readiness budget",
      );
      assert.equal(
        await page.locator(BOOT).count(),
        1,
        "hidden: the scene must still be mounted",
      );
      assert.equal(
        await page.locator(BOOT_ALERT).count(),
        0,
        "hidden: a hidden tab must not spend the readiness budget",
      );
      assert.equal(
        await page.getByText("Scene resources could not be loaded.").count(),
        0,
        "hidden: no false asset failure may be reported",
      );
      await page.evaluate(() => window.storyProbe.visibility(false));
      await page.clock.runFor(200);
      assert.equal(
        await page.locator(BOOT_ALERT).count(),
        0,
        "hidden: returning to the tab must restart the budget, not fail",
      );
      assert.equal(
        await page.getByText("Scene resources could not be loaded.").count(),
        0,
        "hidden: the scene must not report 'Scene resources could not be loaded'",
      );
      await pollUntil(
        page,
        () => document.querySelector(".nori-stage")?.dataset.coldOpen === "ready",
        "hidden: the scene must become ready after the tab returns",
      );
      await page.clock.fastForward(44000);
      await page.clock.runFor(80);
      assert.equal(
        await bootPhase(page),
        "ready",
        "hidden: the scene must still reach the wake gate",
      );
      assert.equal(
        await page.getByRole("button", { name: "Wake Nori", exact: true }).count(),
        1,
        "hidden: the wake gate must be offered",
      );
    }, );

  console.log(
    `Boot lifecycle matrix: ${results.length}/${results.length} cases passed`,
  );
}
