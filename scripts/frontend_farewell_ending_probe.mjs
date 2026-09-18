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
    await page.goto(`${origin}/farewell-ending-harness`);
    await advanceUntil("fresh story harness", () =>
      page.evaluate(() => Boolean(window.farewellEndingProbe)),
    );

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
    assert.deepEqual(errors, []);
    console.log(
      "Farewell/Ending probe passed: Finale actor/WebGL, ack ordering, cancellation, resource retry and wake gate",
    );
  } finally {
    await page
      .evaluate(() => window.farewellEndingProbe?.unmount())
      .catch(() => {});
    await page.close();
  }
}
