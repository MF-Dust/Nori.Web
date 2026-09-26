import assert from "node:assert/strict";
import { resolve } from "node:path";

export async function verifyFarewellEnding(
  browser,
  output,
  origin = "http://127.0.0.1:47175",
) {
  let page = await browser.newPage({ viewport: { width: 1000, height: 800 } });
  page.setDefaultTimeout(60000);
  const errors = [];
  const consoleErrors = [];
  const harnessRoute = (route) =>
    route.fulfill({
      contentType: "text/html",
      body: `<html><head><link rel="stylesheet" href="/styles/app.css"></head><body style="margin:0;background:#05080d"><div id="root"></div><script src="/cubism_sdk/Core/live2dcubismcore.js"></script><script type="module">import RefreshRuntime from "/@react-refresh";RefreshRuntime.injectIntoGlobalHook(window);window.$RefreshReg$=()=>{};window.$RefreshSig$=()=>type=>type;window.__vite_plugin_react_preamble_installed__=true;</script><script type="module" src="/@fs/${resolve("tests/frontend/harness/frontend-farewell-ending-harness.tsx")}"></script></body></html>`,
    });
  const preparePage = async () => {
    page.setDefaultTimeout(60000);
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    const installedAt = Date.now();
    await page.clock.install({ time: installedAt });
    await page.clock.pauseAt(installedAt + 60000);
    await page.route("**/farewell-ending-harness", harnessRoute);
  };
  await preparePage();
  const run = (milliseconds) => page.clock.runFor(milliseconds);
  const advanceUntil = async (description, predicate, timeout = 60000) => {
    const deadline = Date.now() + timeout;
    do {
      await page.clock.runFor(40);
      if (await predicate()) return;
    } while (Date.now() < deadline);
    const diagnostics = await page.evaluate(() => {
      const stage = document.querySelector(".nori-stage");
      return {
        scene:
          document
            .querySelector("[data-story-scene]")
            ?.getAttribute("data-story-scene") ?? null,
        live2d: stage?.getAttribute("data-live2d-status") ?? null,
        renderer: stage?.getAttribute("data-scene-renderer") ?? null,
        coldOpen: stage?.getAttribute("data-cold-open") ?? null,
        visibility: document.visibilityState,
        body: document.body.innerText.slice(0, 240),
      };
    });
    assert.fail(
      `Timed out waiting for ${description}: ${JSON.stringify({ ...diagnostics, consoleErrors: consoleErrors.slice(-5) })}`,
    );
  };
  const waitForCold = (value) =>
    advanceUntil(`cold-open ${value}`, () =>
      page
        .locator(".nori-stage")
        .getAttribute("data-cold-open")
        .then((state) => state === value),
    );
  try {
    await page.goto(`${origin}/farewell-ending-harness`);

    // Production Finale model + WebGL compositor; completion must not reload before ack.
    await page.evaluate(() => window.farewellEndingProbe.mount("farewell"));
    const farewell = page.locator('[data-story-scene="farewell"]');
    await advanceUntil(
      "Farewell actor",
      async () =>
        (await farewell.getAttribute("data-ready")) === "true" &&
        (await farewell.locator("canvas").count()) === 2,
    );
    await page.clock.fastForward(9000);
    await run(40);
    assert.equal(await farewell.getAttribute("data-speaking"), "true");
    assert.ok(
      await farewell
        .locator("canvas")
        .first()
        .evaluate((canvas) => canvas.width > 1 && canvas.height > 1),
    );
    const farewellPixels = await farewell
      .locator("canvas")
      .nth(1)
      .evaluate((canvas) => {
        const gl = canvas.getContext("webgl2"),
          pixels = new Uint8Array(canvas.width * canvas.height * 4);
        gl.readPixels(
          0,
          0,
          canvas.width,
          canvas.height,
          gl.RGBA,
          gl.UNSIGNED_BYTE,
          pixels,
        );
        let count = 0,
          minX = canvas.width,
          maxX = 0;
        for (let index = 0; index < pixels.length; index += 16) {
          if (
            pixels[index] > 245 &&
            pixels[index + 1] > 245 &&
            pixels[index + 2] > 245
          )
            continue;
          const pixel = index / 4,
            x = pixel % canvas.width;
          count++;
          minX = Math.min(minX, x);
          maxX = Math.max(maxX, x);
        }
        return { count, minX: minX / canvas.width, maxX: maxX / canvas.width };
      });
    assert.ok(
      farewellPixels.count > 1000,
      "Farewell compositor must contain a visible actor/shadow",
    );
    assert.ok(
      farewellPixels.minX < 0.46 && farewellPixels.maxX > 0.46,
      "Farewell actor must straddle its authored 46% center",
    );
    await page.screenshot({ path: resolve(output, "farewell-production.png") });
    await page.clock.fastForward(114000);
    await run(40);
    assert.deepEqual(
      await page.evaluate(() => window.farewellEndingProbe.events),
      ["complete-requested"],
    );
    await page.evaluate(() => window.farewellEndingProbe.acknowledge());
    assert.deepEqual(
      await page.evaluate(() => window.farewellEndingProbe.events),
      ["complete-requested", "acknowledged", "reload"],
    );

    // Replacing the world releases the actor, renderer, audio and scene lease.
    await page.evaluate(() => window.farewellEndingProbe.mount("farewell"));
    await advanceUntil("replacement Farewell actor", () =>
      farewell.getAttribute("data-ready").then((value) => value === "true"),
    );
    await run(40);
    await page.evaluate(() => window.farewellEndingProbe.cancel());
    await page.clock.fastForward(125000);
    await run(40);
    assert.equal(
      await page.locator('[data-story-scene="farewell"]').count(),
      0,
    );
    assert.equal(
      await page.evaluate(() => window.farewellEndingProbe.state().active),
      false,
    );
    assert.deepEqual(
      await page.evaluate(() => window.farewellEndingProbe.events),
      ["cancel"],
    );

    // Farewell's acknowledged production path reloads the document. Use a fresh page so the
    // Ending half of the probe starts from that same document-lifecycle boundary.
    await page.close();
    page = await browser.newPage({ viewport: { width: 1000, height: 800 } });
    await preparePage();
    await page.bringToFront();
    await page.goto(`${origin}/farewell-ending-harness`);
    await advanceUntil("visible Ending page", () =>
      page.evaluate(() => document.visibilityState === "visible"),
    );
    await advanceUntil("fresh story harness", () =>
      page.evaluate(() => Boolean(window.farewellEndingProbe)),
    );

    // Residue instrumentation, installed on the idle desktop before the Ending
    // takes anything. The harness only renders the stage from mount()/cancel(),
    // so the desktop baseline itself is captured after the first handoff.
    // Re-runnable: a reload replaces the document the instrumentation lived in.
    const instrumentResidue = () => {
      // Timer/RAF ownership: tag every registration with the module that made
      // it, so residue checks can name the owner instead of guessing.
      const native = {
        setTimeout: window.setTimeout,
        clearTimeout: window.clearTimeout,
        setInterval: window.setInterval,
        clearInterval: window.clearInterval,
        requestAnimationFrame: window.requestAnimationFrame,
        cancelAnimationFrame: window.cancelAnimationFrame,
      };
      const live = new Map();
      const registrations = new Map();
      const site = () => {
        const frames = (new Error().stack ?? "").split("\n").slice(1);
        return (
          frames.find((frame) => frame.includes(location.origin)) ??
          frames[0] ??
          "unknown"
        ).trim();
      };
      const own = (handle, owner) => {
        live.set(handle, owner);
        registrations.set(owner, (registrations.get(owner) ?? 0) + 1);
      };
      window.setTimeout = (callback, delay, ...args) => {
        const handle = native.setTimeout(
          (...inner) => {
            live.delete(handle);
            callback(...inner);
          },
          delay,
          ...args,
        );
        own(handle, site());
        return handle;
      };
      window.clearTimeout = (handle) => {
        live.delete(handle);
        return native.clearTimeout(handle);
      };
      window.setInterval = (callback, delay, ...args) => {
        const handle = native.setInterval(callback, delay, ...args);
        own(handle, site());
        return handle;
      };
      window.clearInterval = (handle) => {
        live.delete(handle);
        return native.clearInterval(handle);
      };
      window.requestAnimationFrame = (callback) => {
        const handle = native.requestAnimationFrame((time) => {
          live.delete(handle);
          callback(time);
        });
        own(handle, site());
        return handle;
      };
      window.cancelAnimationFrame = (handle) => {
        live.delete(handle);
        return native.cancelAnimationFrame(handle);
      };
      // Audio ownership: the mixer's debug view cannot see music-kind scene
      // tracks, so every buffer source is recorded from start to stop and
      // tagged with the asset it was decoded from.
      const decoded = new WeakMap();
      const sources = [];
      const requested = [];
      let peak = 0;
      const fetchPage = window.fetch;
      window.fetch = async (input, init) => {
        const response = await fetchPage.call(window, input, init);
        const url =
          typeof input === "string" ? input : (input?.url ?? String(input));
        requested.push(url);
        const read = response.arrayBuffer.bind(response);
        response.arrayBuffer = async () => {
          const data = await read();
          decoded.set(data, url);
          return data;
        };
        return response;
      };
      const audio = (window.AudioContext ?? window.webkitAudioContext)
        ?.prototype;
      if (audio) {
        const decode = audio.decodeAudioData;
        audio.decodeAudioData = function (data, ...rest) {
          const url = decoded.get(data);
          return decode.call(this, data, ...rest).then((buffer) => {
            if (url) decoded.set(buffer, url);
            return buffer;
          });
        };
        const create = audio.createBufferSource;
        audio.createBufferSource = function () {
          const node = create.call(this);
          const record = {
            url: null,
            started: false,
            stopped: false,
            stoppedBy: null,
            offset: null,
            duration: null,
          };
          sources.push(record);
          const start = node.start.bind(node);
          const stop = node.stop.bind(node);
          node.start = (...args) => {
            record.started = true;
            record.offset = args[1] ?? 0;
            record.duration = node.buffer?.duration ?? null;
            record.url = decoded.get(node.buffer) ?? null;
            // Starting is being live: remember the high-water mark so the probe
            // never has to sample a short window to prove audibility.
            peak = Math.max(
              peak,
              sources.filter((other) => other.started && !other.stopped).length,
            );
            return start(...args);
          };
          node.stop = (...args) => {
            if (!record.stopped) {
              record.stopped = true;
              // Name whoever released the source, so a leaked-track report
              // points at the owner instead of only saying "it stopped".
              record.stoppedBy = (new Error().stack ?? "")
                .split("\n")
                .slice(1)
                .filter((frame) => frame.includes(location.origin))
                .slice(0, 3)
                .map((frame) => frame.trim());
            }
            return stop(...args);
          };
          return node;
        };
      }
      Object.assign(window, {
        __noriResidue: {
          liveOwners: (owner) =>
            [...live.values()].filter((value) => value.includes(owner)),
          registrations: (owner) =>
            [...registrations]
              .filter(([site]) => site.includes(owner))
              .reduce((total, [, count]) => total + count, 0),
          tracks: () =>
            sources
              .filter((source) => source.started)
              .map((source) => ({ ...source })),
          peak: () => peak,
          requested: () => [...requested],
          playing: () =>
            sources
              .filter((source) => source.started && !source.stopped)
              .map((source) => source.url),
        },
      });
    };
    const installResidueInstrumentation = () => page.evaluate(instrumentResidue);
    await installResidueInstrumentation();

    // A failed cold-open resource exposes Retry; retry reconstructs a fresh renderer.
    const cdp = await page.context().newCDPSession(page);
    await cdp.send("Network.enable");
    await cdp.send("Network.clearBrowserCache");
    await cdp.detach();
    let failOcean = true,
      gradientRequests = 0;
    const oceanRoute = (route) => {
      if (!route.request().url().includes("/ocean/gradient-noise.jpg"))
        return route.continue();
      gradientRequests++;
      return failOcean ? route.abort() : route.continue();
    };
    // Route the directory before mounting so decoded-image caching cannot bypass the injected
    // gradient failure. Non-target ocean resources still load normally.
    await page.route("**/ocean/**", oceanRoute);
    await page.evaluate(() => window.farewellEndingProbe.mount("ending"));
    const ending = page.locator('[data-story-scene="ending"]');
    const retry = page.getByRole("button", { name: "Retry" });
    await advanceUntil(
      "Ending mount",
      async () =>
        (await ending.count()) === 1 &&
        (await page
          .locator(".nori-stage")
          .getAttribute("data-live2d-status")) === "ready" &&
        (await page
          .locator(".nori-stage")
          .getAttribute("data-scene-renderer")) === "three",
    );
    assert.equal(
      await page.evaluate(() => window.farewellEndingProbe.state().active),
      true,
    );
    await advanceUntil(
      "Ending gradient request",
      async () => gradientRequests === 1,
    );
    await advanceUntil("Ending resource failure", () =>
      retry.count().then((count) => count === 1),
    );
    assert.equal(
      await page.evaluate(() => window.farewellEndingProbe.state().active),
      false,
    );
    failOcean = false;
    await retry.click();
    await waitForCold("ready");
    assert.equal(
      gradientRequests,
      2,
      "retry must request a fresh ocean gradient",
    );
    await page.unroute("**/ocean/**", oceanRoute);

    // The zero-duration ready phase remains parked until the real wake control is used.
    await page.clock.fastForward(32650);
    await run(40);
    const wake = page.getByRole("button", { name: "Wake Nori" });
    await advanceUntil("Ending wake gate", () =>
      wake.count().then((count) => count === 1),
    );
    assert.equal(await ending.getAttribute("data-parked"), "true");
    const face = await page.evaluate(() => window.farewellEndingProbe.state());
    assert.ok(
      Math.abs(face.camera.x) < 1e-6 &&
        Math.abs(face.camera.y - 1.75) < 1e-3 &&
        Math.abs(face.camera.z - 7.4) < 1e-3,
    );
    assert.ok(
      Math.abs(face.fov - 15) < 1e-3,
      "Ending wake gate must frame the evidenced face camera",
    );
    // Non-vacuity for the residue checks below: while parked, the scene really
    // does hold a lease, the cinematic face overrides and a live render loop.
    const parkedResidue = await page.evaluate(() => ({
      scene: window.farewellEndingProbe.state(),
      stage: { ...document.querySelector(".nori-stage").dataset },
      liveOwners: window.__noriResidue.liveOwners("ending-scene"),
      registrations: window.__noriResidue.registrations("ending-scene"),
    }));
    assert.equal(parkedResidue.scene.active, true);
    assert.equal(parkedResidue.scene.chatMode, "hidden");
    assert.equal(parkedResidue.scene.bgm, "silent");
    assert.notEqual(parkedResidue.scene.coldOpen, null);
    assert.equal(parkedResidue.scene.noriSleep, true);
    assert.equal(parkedResidue.scene.eyeOpen, 0);
    assert.ok(parkedResidue.scene.noriDim > 0);
    assert.equal(parkedResidue.stage.coldOpen, "ready");
    assert.equal(parkedResidue.stage.noriIdle, "sleep");
    assert.ok(
      parkedResidue.liveOwners.length >= 1,
      "a parked Ending must still run its own render loop",
    );
    assert.ok(
      parkedResidue.registrations >= 1,
      "a parked Ending must have registered its own frame callbacks",
    );
    await page.clock.fastForward(3000);
    await run(40);
    assert.equal(await ending.getAttribute("data-parked"), "true");
    await page.screenshot({ path: resolve(output, "ending-wake-gate.png") });
    await wake.click();
    await page.clock.fastForward(3500);
    await run(40);
    const desktop = await page.evaluate(() =>
      window.farewellEndingProbe.state(),
    );
    assert.ok(
      Math.abs(desktop.camera.y) < 1e-3 &&
        Math.abs(desktop.camera.z - 7.4) < 1e-3,
    );
    assert.ok(
      Math.abs(desktop.fov - 60) < 1e-3,
      "Ending settle must return to the desktop camera",
    );
    assert.deepEqual(
      await page.evaluate(() => window.farewellEndingProbe.events),
      ["complete-requested"],
    );

    // ---- desktop-state residue ---------------------------------------------
    // One snapshot shape for every residue check: the scene lease, every
    // .nori-stage attribute, the graphics choice and Ending-owned callbacks.
    const residue = () =>
      page.evaluate(() => ({
        scene: window.farewellEndingProbe.state(),
        stage: { ...document.querySelector(".nori-stage").dataset },
        graphics: localStorage.getItem("graphics-store"),
        liveOwners: window.__noriResidue.liveOwners("ending-scene"),
        registrations: window.__noriResidue.registrations("ending-scene"),
      }));
    // The settle stops requesting frames on its own; everything else has to be
    // released by the handoff that unmounts the scene and drops its lease.
    await run(40);
    const completed = await residue();
    assert.deepEqual(
      completed.liveOwners,
      [],
      "a completed Ending must leave no render loop pending",
    );
    // The real director clears the story once the sentinel is acknowledged; the
    // harness expresses the same handoff by replacing the story instance.
    await page.evaluate(() => window.farewellEndingProbe.cancel());
    await run(40);
    assert.equal(
      await page.locator('[data-story-scene="ending"]').count(),
      0,
      "the handoff must unmount the Ending scene",
    );
    const restored = await residue();
    // Hold the live snapshot inside the page: a different object later means the
    // idle desktop republished instead of sitting still.
    await page.evaluate(() => {
      window.__noriHeld = window.farewellEndingProbe.state();
    });
    // 1. Scene override released: no cinematic camera/fov/darkness/dim/coldOpen.
    assert.equal(
      restored.scene.active,
      false,
      "the Ending lease must be released",
    );
    assert.equal(restored.scene.camera, null);
    assert.equal(restored.scene.cameraRot, null);
    assert.equal(restored.scene.fov, null);
    assert.equal(restored.scene.cameraFar, null);
    assert.equal(restored.scene.darkness, 0);
    assert.equal(restored.scene.noriDim, 0);
    assert.equal(restored.scene.coldOpen, null);
    assert.equal(restored.scene.chatMode, "normal");
    assert.equal(restored.scene.bgm, "auto");
    // 3. Model override released: fact-derived idle, no scene-forced face.
    assert.equal(restored.scene.noriSleep, false);
    assert.equal(restored.scene.eyeOpen, null);
    assert.equal(restored.scene.mouthOpen, null);
    assert.equal(restored.scene.noriSmile, null);
    assert.equal(restored.scene.noriExpression, null);
    assert.equal(restored.scene.noriIdleMotion, null);
    assert.equal(
      restored.stage.coldOpen,
      "inactive",
      "the cold-open renderer must be released",
    );
    assert.equal(
      restored.stage.noriIdle,
      "idle",
      "Nori must be back to the fact-derived idle",
    );
    // 4. Graphics budget is the auto mode again, not a scene-chosen one.
    assert.equal(
      restored.stage.live2dFps,
      "60",
      "an ultra-performance budget must not survive the Ending",
    );
    assert.equal(
      restored.graphics === null
        ? "auto"
        : JSON.parse(restored.graphics).state.source,
      "auto",
      "graphics mode must still be auto-selected",
    );
    // 5/6. No stale timers and no pending frames: nothing Ending-owned stays
    // live, nothing new is registered, and idle time moves no state at all.
    assert.deepEqual(
      restored.liveOwners,
      [],
      "no Ending render loop may survive the handoff",
    );
    await run(5000);
    const idled = await residue();
    assert.equal(
      idled.registrations,
      completed.registrations,
      "the Ending must not register new timers after the handoff",
    );
    assert.equal(
      await page.evaluate(
        () => window.farewellEndingProbe.state() === window.__noriHeld,
      ),
      true,
      "an idle desktop must not republish scene state",
    );
    assert.deepEqual(
      idled.scene,
      restored.scene,
      "an idle desktop must not mutate scene state",
    );
    assert.deepEqual(
      idled.stage,
      restored.stage,
      "no .nori-stage attribute may drift while the desktop idles",
    );
    // 7. No stale story callback: a late ack or a later cancel must not
    // re-complete the story, and nothing may bring the scene back.
    assert.deepEqual(
      await page.evaluate(() => window.farewellEndingProbe.events),
      ["complete-requested", "cancel"],
    );
    await page.evaluate(() => window.farewellEndingProbe.acknowledge());
    await run(10000);
    assert.deepEqual(
      await page.evaluate(() => window.farewellEndingProbe.events),
      ["complete-requested", "cancel"],
      "acknowledging after the handoff must not re-complete the story",
    );
    assert.equal(await page.locator('[data-story-scene="ending"]').count(), 0);
    // The desktop is demonstrably clean now, so it is the baseline the second
    // handoff has to reproduce field for field.
    const desktopBaseline = await residue();

    // 2. Audio override released. ENDING_AUDIO only plays while the shared
    // mixer has a running context, so unlock it before the second run and
    // prove the scene's own tracks really start before requiring them stopped.
    await page.mouse.click(500, 16);
    const mixer = await page.evaluate(
      async (timeline) => {
        const { ENDING_AUDIO } = await import(timeline);
        const audio = window.farewellEndingProbe.audio();
        return {
          unlocked: await audio.unlock(),
          contextState: audio.debugSnapshot().contextState,
          srcs: ENDING_AUDIO.map((track) => track.src),
        };
      },
      `/@fs/${resolve("frontend-src/story/ending-timeline.ts")}`,
    );
    assert.equal(
      mixer.unlocked,
      true,
      "Ending audio residue needs a running AudioContext",
    );
    assert.equal(mixer.contextState, "running");
    assert.ok(mixer.srcs.length >= 1);
    await page.evaluate(() => window.farewellEndingProbe.mount("ending"));
    await waitForCold("ready");
    // Step the clock until the scene asks for its first track, then let real
    // time alone carry the fetch and decode: advancing the story while they run
    // would skip the track's own authored window and make this vacuous.
    const askedFor = (srcs) =>
      page.evaluate(
        (tracks) =>
          window.__noriResidue.requested().some((url) => tracks.includes(url)),
        srcs,
      );
    for (let step = 0; step < 40; step++) {
      if (await askedFor(mixer.srcs)) break;
      await run(200);
    }
    assert.ok(
      await askedFor(mixer.srcs),
      "the Ending must request its own audio asset",
    );
    for (let step = 0; step < 60; step++) {
      if (await page.evaluate(() => window.__noriResidue.peak() >= 1)) break;
      await new Promise((done) => setTimeout(done, 50));
    }
    const heard = await page.evaluate(() => window.__noriResidue.tracks());
    assert.ok(
      heard.length >= 1,
      "the Ending must have started an authored track to release",
    );
    assert.ok(
      heard.every((track) => mixer.srcs.includes(track.url)),
      `unexpected audio source: ${JSON.stringify(heard)}`,
    );
    // Observe and hand off in the same page task, so the reading cannot race
    // the unmount that stops the scene's own audio.
    await page.evaluate(() => {
      window.farewellEndingProbe.cancel();
    });
    await run(40);
    assert.deepEqual(
      await page.evaluate(() => window.__noriResidue.playing()),
      [],
      `Ending audio must not survive the handoff: ${JSON.stringify(heard)}`,
    );
    assert.ok(
      (await page.evaluate(() => window.__noriResidue.tracks())).every(
        (track) => track.stopped,
      ),
      "every Ending track must be stopped after the handoff",
    );
    // Positive control: this observation has to call a genuinely live source
    // live and its stop a stop, in this environment, at handoff time.
    const control = await page.evaluate(async () => {
      const { context } = await window.farewellEndingProbe
        .audio()
        .speechRoute();
      const probe = context.createBufferSource();
      probe.buffer = context.createBuffer(
        1,
        context.sampleRate * 5,
        context.sampleRate,
      );
      probe.start();
      const live = window.__noriResidue.playing().length;
      probe.stop();
      return { live, after: window.__noriResidue.playing().length };
    });
    assert.equal(
      control.live,
      1,
      "the audio observation must report a live source as live",
    );
    assert.equal(
      control.after,
      0,
      "the audio observation must report a stopped source as stopped",
    );
    // A cancelled handoff has to land on exactly the same desktop.
    const cancelled = await residue();
    assert.deepEqual(
      cancelled.scene,
      desktopBaseline.scene,
      "scene state must return to the captured desktop baseline",
    );
    assert.deepEqual(
      cancelled.stage,
      desktopBaseline.stage,
      "every .nori-stage attribute must return to the desktop baseline",
    );
    assert.equal(cancelled.graphics, desktopBaseline.graphics);
    assert.equal(cancelled.scene.active, false);
    assert.deepEqual(cancelled.liveOwners, []);
    assert.deepEqual(
      await page.evaluate(() => window.farewellEndingProbe.events),
      ["cancel"],
    );

    // ---- interruption: the same residue contract, mid-flight ----------------
    // The clean handoff above asserts the seven residue classes inline. Every
    // interruption below is held to that same contract through one helper, so a
    // cancel can never land on a greener desktop than a completion does.
    const assertIdleDesktop = (snapshot, label) => {
      const because = (message) => `${label}: ${message}`;
      // 1. Scene override released.
      assert.equal(
        snapshot.scene.active,
        false,
        because("the Ending lease must be released"),
      );
      assert.equal(
        snapshot.scene.camera,
        null,
        because("the cinematic camera must be released"),
      );
      assert.equal(
        snapshot.scene.cameraRot,
        null,
        because("the cinematic camera rotation must be released"),
      );
      assert.equal(
        snapshot.scene.fov,
        null,
        because("the cinematic fov must be released"),
      );
      assert.equal(
        snapshot.scene.cameraFar,
        null,
        because("the cinematic far plane must be released"),
      );
      assert.equal(
        snapshot.scene.darkness,
        0,
        because("the cinematic darkness must be released"),
      );
      assert.equal(
        snapshot.scene.noriDim,
        0,
        because("the Nori dim must be released"),
      );
      assert.equal(
        snapshot.scene.coldOpen,
        null,
        because("the cold-open override must be released"),
      );
      assert.equal(
        snapshot.scene.chatMode,
        "normal",
        because("chat mode must be back to normal"),
      );
      assert.equal(
        snapshot.scene.bgm,
        "auto",
        because("bgm must be back to auto"),
      );
      // 3. Model override released: fact-derived idle, no scene-forced face.
      assert.equal(
        snapshot.scene.noriSleep,
        false,
        because("the forced sleep pose must be released"),
      );
      assert.equal(
        snapshot.scene.eyeOpen,
        null,
        because("the forced eye override must be released"),
      );
      assert.equal(
        snapshot.scene.mouthOpen,
        null,
        because("the forced mouth override must be released"),
      );
      assert.equal(
        snapshot.scene.noriSmile,
        null,
        because("the forced smile must be released"),
      );
      assert.equal(
        snapshot.scene.noriExpression,
        null,
        because("the forced expression must be released"),
      );
      assert.equal(
        snapshot.scene.noriIdleMotion,
        null,
        because("the forced idle motion must be released"),
      );
      // 4. Graphics budget is the auto mode again, not a scene-chosen one.
      assert.equal(
        snapshot.stage.coldOpen,
        "inactive",
        because("the cold-open renderer must be released"),
      );
      assert.equal(
        snapshot.stage.noriIdle,
        "idle",
        because("Nori must be back to the fact-derived idle"),
      );
      assert.equal(
        snapshot.stage.live2dFps,
        "60",
        because("an ultra-performance budget must not survive the Ending"),
      );
      assert.equal(
        snapshot.graphics === null
          ? "auto"
          : JSON.parse(snapshot.graphics).state.source,
        "auto",
        because("graphics mode must still be auto-selected"),
      );
      // 5/6. No Ending-owned timer or frame callback is still alive.
      assert.deepEqual(
        snapshot.liveOwners,
        [],
        because("no Ending-owned timer or frame callback may stay alive"),
      );
    };
    const assertNoDrift = async (held, label, span = 5000) => {
      await run(span);
      const idled = await residue();
      assert.equal(
        idled.registrations,
        held.registrations,
        `${label}: the Ending must not register new timers after the handoff`,
      );
      assert.deepEqual(
        idled.scene,
        held.scene,
        `${label}: an idle desktop must not mutate scene state`,
      );
      assert.deepEqual(
        idled.stage,
        held.stage,
        `${label}: no .nori-stage attribute may drift while the desktop idles`,
      );
      return idled;
    };
    const startEnding = async () => {
      await page.evaluate(() => window.farewellEndingProbe.mount("ending"));
      await waitForCold("ready");
    };
    const toWakeGate = async () => {
      await page.clock.fastForward(32650);
      await run(40);
      const control = page.getByRole("button", { name: "Wake Nori" });
      await advanceUntil("Ending wake gate", () =>
        control.count().then((count) => count === 1),
      );
      return control;
    };
    // One cancel path, three distinct interruption points.
    const interrupt = async (label, at, expected) => {
      await startEnding();
      await at();
      // Non-vacuity: the Ending really owned the desktop at the cancel point.
      const held = await residue();
      assert.equal(
        held.scene.active,
        true,
        `${label}: the Ending must own the desktop before the cancel`,
      );
      assert.equal(
        held.scene.chatMode,
        "hidden",
        `${label}: the Ending must hide chat before the cancel`,
      );
      assert.equal(
        held.scene.bgm,
        "silent",
        `${label}: the Ending must silence bgm before the cancel`,
      );
      assert.ok(
        held.liveOwners.length >= 1,
        `${label}: the Ending must own a live frame callback before the cancel`,
      );
      expected(held);
      await page.evaluate(() => window.farewellEndingProbe.cancel());
      await run(40);
      assert.equal(
        await page.locator('[data-story-scene="ending"]').count(),
        0,
        `${label}: the cancel must unmount the Ending scene`,
      );
      const after = await residue();
      assertIdleDesktop(after, label);
      assert.deepEqual(
        await page.evaluate(() => window.farewellEndingProbe.events),
        ["cancel"],
        `${label}: the sentinel must not have fired before the cancel`,
      );
      // 7. No stale story callback and no new Ending registration survive it.
      await assertNoDrift(after, label);
      assert.deepEqual(
        await page.evaluate(() => window.farewellEndingProbe.events),
        ["cancel"],
        `${label}: a stale frame callback must not complete the story after the cancel`,
      );
    };

    // 1a. During the void ascent, with the camera still down in the dark.
    await interrupt(
      "cancel during the void ascent",
      async () => {
        await run(1200);
      },
      (held) => {
        assert.equal(held.scene.coldOpen.ocean, true);
        assert.ok(
          held.scene.darkness > 0.9,
          "the void ascent must still be dark when it is cancelled",
        );
        assert.ok(
          held.scene.camera.y < -40,
          "the void ascent must still be deep when it is cancelled",
        );
        assert.equal(
          held.scene.noriSleep,
          true,
          "the void ascent must still hold Nori asleep when it is cancelled",
        );
      },
    );

    // 1b. During the ready wake gate, where the clock is parked and no amount of
    // elapsed time can move the scene on its own.
    await interrupt(
      "cancel at the ready wake gate",
      async () => {
        await toWakeGate();
        assert.equal(
          await ending.getAttribute("data-parked"),
          "true",
          "the gate must be parked before it is cancelled",
        );
        const parked = await residue();
        await page.clock.fastForward(3000);
        await run(40);
        assert.equal(await ending.getAttribute("data-parked"), "true");
        const still = await residue();
        assert.deepEqual(
          still.scene.camera,
          parked.scene.camera,
          "a parked Ending must not move its camera",
        );
        assert.equal(
          still.scene.fov,
          parked.scene.fov,
          "a parked Ending must not change its fov",
        );
        assert.ok(
          parked.liveOwners.length >= 1,
          "a parked Ending must still own a live frame callback",
        );
      },
      (held) => {
        assert.ok(
          Math.abs(held.scene.camera.y - 1.75) < 1e-3 &&
            Math.abs(held.scene.camera.z - 7.4) < 1e-3 &&
            Math.abs(held.scene.fov - 15) < 1e-3,
          "the cancel must land on the parked face camera",
        );
      },
    );

    // 1c. During the final settle, with the wake return still in progress.
    await interrupt(
      "cancel during the final settle",
      async () => {
        await (await toWakeGate()).click();
        await page.clock.fastForward(1200);
        await run(40);
        assert.equal(
          await ending.getAttribute("data-parked"),
          null,
          "the settle must have released the wake gate",
        );
      },
      (held) => {
        assert.ok(
          held.scene.fov > 15 && held.scene.fov < 60,
          "the cancel must land while the fov is still moving",
        );
        assert.ok(
          held.scene.camera.y > 0 && held.scene.camera.y < 1.75,
          "the cancel must land while the camera is still returning",
        );
        // Shipped sJ holds noriDim at the formed 2.8 and sets it to 0 only when
        // the shroud finishes (wake + 0.25 + 1.9 = 2.15s). 1.2s after the gate
        // is age 0.9s, so the dim has not cleared; the lift in progress is noriReveal.
        assert.equal(
          held.scene.noriDim,
          2.8,
          "the shroud must still be holding the formed dim",
        );
        assert.ok(
          held.scene.noriReveal > 0 && held.scene.noriReveal < 1,
          "the cancel must land while the shroud is still lifting",
        );
        assert.ok(held.scene.burst > 0, "the wake burst must still be running");
      },
    );

    // ---- interruption: reload while the Ending is mid-flight ----------------
    await startEnding();
    await (await toWakeGate()).click();
    await page.clock.fastForward(1200);
    await run(40);
    const midFlight = await residue();
    assert.equal(
      midFlight.scene.active,
      true,
      "the reload must land while the Ending still owns the desktop",
    );
    assert.ok(
      midFlight.scene.fov > 15 && midFlight.scene.fov < 60,
      "the reload must land mid-settle, not before the gate or after the story",
    );
    assert.ok(
      midFlight.liveOwners.length >= 1,
      "a mid-flight Ending must still own a live frame callback",
    );
    assert.equal(
      await page.evaluate(() =>
        window.farewellEndingProbe.events.includes("complete-requested"),
      ),
      false,
      "the Ending must not have completed before the reload",
    );
    // sessionStorage is the only witness that outlives the navigation, so the
    // story state is sampled as the document goes away, not after it.
    await page.evaluate(() =>
      addEventListener("pagehide", () => {
        sessionStorage.setItem(
          "farewell-ending-unload",
          JSON.stringify(window.farewellEndingProbe.events),
        );
      }),
    );
    await page.reload();
    await advanceUntil("reloaded visible page", () =>
      page.evaluate(() => document.visibilityState === "visible"),
    );
    await advanceUntil("reloaded harness", () =>
      page.evaluate(() => Boolean(window.farewellEndingProbe)),
    );
    await advanceUntil("reloaded idle desktop", () =>
      page
        .locator(".nori-stage")
        .getAttribute("data-cold-open")
        .then((state) => state === "inactive"),
    );
    await installResidueInstrumentation();
    assert.equal(
      await page.locator('[data-story-scene="ending"]').count(),
      0,
      "no Ending scene element may survive the reload",
    );
    const unloaded = JSON.parse(
      (await page.evaluate(() =>
        sessionStorage.getItem("farewell-ending-unload"),
      )) ?? "null",
    );
    assert.ok(Array.isArray(unloaded), "the unload witness must have been recorded");
    assert.equal(
      unloaded.includes("complete-requested"),
      false,
      `the story sentinel must not fire on the way out: ${JSON.stringify(unloaded)}`,
    );
    const reloadBaseline = await residue();
    assertIdleDesktop(reloadBaseline, "reload mid-ending");
    assert.deepEqual(
      await page.evaluate(() => window.farewellEndingProbe.events),
      [],
      "the reloaded document must start with an unreached story",
    );
    // The acknowledged path, on the fresh document: the sentinel is acknowledged,
    // the story stays up until the director's own 1500 ms release, and that
    // release is what unmounts the Ending. A wedged director fails every step.
    await startEnding();
    await (await toWakeGate()).click();
    await page.clock.fastForward(3500);
    await run(40);
    assert.deepEqual(
      await page.evaluate(() => window.farewellEndingProbe.events),
      ["complete-requested"],
      "the Ending must complete on the fresh page after a mid-flight reload",
    );
    await page.evaluate(() => window.farewellEndingProbe.acknowledge());
    assert.deepEqual(
      await page.evaluate(() => window.farewellEndingProbe.events),
      ["complete-requested", "acknowledged"],
    );
    await run(1400);
    assert.deepEqual(
      await page.evaluate(() => window.farewellEndingProbe.events),
      ["complete-requested", "acknowledged"],
      "the story must not be released before the director's post-ack timer",
    );
    assert.equal(
      await page.locator('[data-story-scene="ending"]').count(),
      1,
      "the Ending must stay mounted until the director releases the story",
    );
    await run(200);
    assert.deepEqual(
      await page.evaluate(() => window.farewellEndingProbe.events),
      ["complete-requested", "acknowledged", "released"],
      "the director must release the story 1500 ms after the acknowledgement",
    );
    assert.equal(
      await page.locator('[data-story-scene="ending"]').count(),
      0,
      "the post-ack release must unmount the Ending",
    );
    const afterReload = await residue();
    assertIdleDesktop(afterReload, "second Ending after a mid-flight reload");
    assert.deepEqual(
      afterReload.scene,
      reloadBaseline.scene,
      "the reloaded desktop must return to its own scene baseline",
    );
    assert.deepEqual(
      afterReload.stage,
      reloadBaseline.stage,
      "every .nori-stage attribute must return to the reloaded baseline",
    );
    await assertNoDrift(afterReload, "second Ending after a mid-flight reload");
    assert.deepEqual(
      await page.evaluate(() => window.farewellEndingProbe.events),
      ["complete-requested", "acknowledged", "released"],
      "a late callback must not re-complete the story after the release",
    );

    // ---- interruption: resize while the Ending is mid-flight ----------------
    await startEnding();
    // Mid-rise: void parks the camera at y=-42.9, so the ascent is the first
    // place a resize can land on a camera that is genuinely moving.
    await page.clock.fastForward(6000);
    await run(40);
    const drawable = () =>
      page.evaluate(() => {
        const stage = document.querySelector(".nori-stage");
        const canvas = stage.querySelector('canvas[data-scene-canvas="true"]');
        return {
          css: [stage.clientWidth, stage.clientHeight],
          buffer: [canvas.width, canvas.height],
        };
      });
    for (const [width, height] of [
      [1920, 1080],
      [390, 740],
      [1366, 900],
    ]) {
      const before = await residue();
      await page.setViewportSize({ width, height });
      let seen = null;
      for (let attempt = 0; attempt < 12; attempt++) {
        // The cold-open renderer resizes from a ResizeObserver callback, which
        // the browser delivers on a real frame; the fake clock only carries the
        // scene clock, so give the compositor a real moment per attempt.
        await new Promise((done) => setTimeout(done, 50));
        await run(200);
        seen = await drawable();
        if (seen.buffer[0] === seen.css[0] && seen.buffer[1] === seen.css[1])
          break;
      }
      assert.equal(
        seen.css[0],
        width,
        `the stage must lay out at ${width}px wide`,
      );
      assert.deepEqual(
        seen.buffer,
        seen.css,
        `the cold-open renderer must resize its backing store to ${width}x${height}`,
      );
      assert.ok(
        seen.buffer[0] > 1 && seen.buffer[1] > 1,
        `the cold-open renderer must keep a real drawable at ${width}x${height}`,
      );
      const after = await residue();
      assert.equal(
        after.scene.active,
        true,
        `a resize to ${width}x${height} must not end the Ending`,
      );
      assert.equal(
        after.scene.chatMode,
        "hidden",
        `a resize to ${width}x${height} must not release chat mode`,
      );
      assert.equal(
        after.scene.bgm,
        "silent",
        `a resize to ${width}x${height} must not release bgm`,
      );
      assert.ok(
        after.scene.plankton > before.scene.plankton,
        `the scene must keep advancing across a resize to ${width}x${height}`,
      );
      assert.ok(
        after.scene.camera.y > before.scene.camera.y,
        `the camera must keep rising across a resize to ${width}x${height}`,
      );
    }
    const resizeWake = await toWakeGate();
    assert.equal(
      await ending.getAttribute("data-parked"),
      "true",
      "the wake gate must stay reachable after three viewports",
    );
    assert.ok(
      Math.abs((await residue()).scene.fov - 15) < 1e-3,
      "the wake gate must still frame the face camera after resizing",
    );
    await resizeWake.click();
    await page.clock.fastForward(3500);
    await run(40);
    assert.deepEqual(
      await page.evaluate(() => window.farewellEndingProbe.events),
      ["complete-requested"],
      "the Ending must complete at the resized viewport",
    );
    await page.evaluate(() => window.farewellEndingProbe.cancel());
    await run(40);
    assert.equal(
      await page.locator('[data-story-scene="ending"]').count(),
      0,
      "the resize handoff must unmount the Ending scene",
    );
    const afterResize = await residue();
    assertIdleDesktop(afterResize, "resize during the Ending");
    await assertNoDrift(afterResize, "resize during the Ending");
    assert.deepEqual(
      await page.evaluate(() => window.farewellEndingProbe.events),
      ["complete-requested", "cancel"],
      "a late callback must not re-complete the story after the resize handoff",
    );
    assert.deepEqual(errors, []);
    console.log(
      "Farewell/Ending probe passed: Finale actor/WebGL, ack ordering, cancellation, resource retry, wake gate, desktop-state residue (scene/audio/model/graphics/timers/RAF/story callback) and the interruption matrix (cancel at void/wake-gate/settle, mid-ending reload + acknowledged re-entry, mid-ending resize)",
    );
  } finally {
    await page
      .evaluate(() => window.farewellEndingProbe?.unmount())
      .catch(() => {});
    await page.close();
  }
}
