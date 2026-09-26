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
      body: `<html><head><link rel="stylesheet" href="/styles/app.css"></head><body style="margin:0;background:#05080d"><div id="root"></div><script src="/cubism_sdk/Core/live2dcubismcore.js"></script><script type="module">import RefreshRuntime from "/@react-refresh";RefreshRuntime.injectIntoGlobalHook(window);window.$RefreshReg$=()=>{};window.$RefreshSig$=()=>type=>type;window.__vite_plugin_react_preamble_installed__=true;</script><script type="module" src="/@fs/${resolve("tests/frontend-farewell-ending-harness.tsx")}"></script></body></html>`,
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
    await page.evaluate(() => {
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
    });

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
    assert.deepEqual(errors, []);
    console.log(
      "Farewell/Ending probe passed: Finale actor/WebGL, ack ordering, cancellation, resource retry, wake gate and desktop-state residue (scene/audio/model/graphics/timers/RAF/story callback)",
    );
  } finally {
    await page
      .evaluate(() => window.farewellEndingProbe?.unmount())
      .catch(() => {});
    await page.close();
  }
}
