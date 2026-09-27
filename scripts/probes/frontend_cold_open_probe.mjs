import assert from "node:assert/strict";
import { resolve } from "node:path";

// Uses the real Cubism canvas and production Three renderer in the scene harness.
export async function verifyColdOpen(page, output) {
  const shaderErrors = [];
  const pageErrors = [];
  const textureUrl = "**/ocean/gradient-noise.jpg";
  let textureRequests = 0;
  const onTexture = (route) => {
    textureRequests++;
    return route.continue();
  };
  const onConsole = (message) => {
    if (
      message.type() === "error" &&
      /THREE|WebGL|shader/i.test(message.text())
    )
      shaderErrors.push(message.text());
  };
  const onPageError = (error) => pageErrors.push(error.message);
  page.on("console", onConsole);
  page.on("pageerror", onPageError);
  const cold = {
    ocean: true,
    oceanFade: 1,
    oceanDepth: 0,
    oceanGodray: 0.8,
    oceanEdge: 0,
    glyphDraw: 0,
    glyphGlow: 0,
    morph: 0,
    noriForm: 0,
    noriWash: 0,
  };
  const enter = (target) =>
    target.evaluate(
      (coldOpen) =>
        window.noriSceneProbe.acquire({
          active: true,
          chatMode: "hidden",
          plankton: 1,
          coldOpen,
          camera: { x: 0, y: 89.6, z: 51 },
          cameraRot: { x: 0, y: 0, z: 0 },
          lerp: 1,
        }),
      cold,
    );
  const state = (target) =>
    target.locator(".nori-stage").getAttribute("data-cold-open");
  const until = async (target, value) => {
    const deadline = Date.now() + 60000;
    do {
      await target.clock.runFor(40);
      if ((await state(target)) === value) return;
    } while (Date.now() < deadline);
    assert.fail(`Cold open did not reach ${value}; got ${await state(target)}`);
  };
  const openIsolatedPage = async (onIsolatedTexture) => {
    const browser = page.context().browser();
    assert.ok(browser, "cold-open fault probe requires a browser");
    const context = await browser.newContext({
      viewport: { width: 1000, height: 800 },
    });
    const isolated = await context.newPage();
    isolated.setDefaultTimeout(30000);
    isolated.on("console", onConsole);
    isolated.on("pageerror", onPageError);
    const installedAt = Date.now();
    await isolated.clock.install({ time: installedAt });
    await isolated.clock.pauseAt(installedAt + 60000);
    await isolated.route(textureUrl, onIsolatedTexture);
    await isolated.route("**/nori-scene-harness", (route) =>
      route.fulfill({
        contentType: "text/html",
        body: `<html><head><link rel="stylesheet" href="/styles/app.css"></head><body style="margin:0;background:#161a1e"><div id="root"></div><script src="/cubism_sdk/Core/live2dcubismcore.js"></script><script type="module">import RefreshRuntime from "/@react-refresh"; RefreshRuntime.injectIntoGlobalHook(window); window.$RefreshReg$=()=>{}; window.$RefreshSig$=()=>type=>type; window.__vite_plugin_react_preamble_installed__=true;</script><script type="module" src="/@fs/${resolve("tests/frontend/harness/frontend-nori-scene-harness.tsx")}"></script></body></html>`,
      }),
    );
    await isolated.goto(page.url());
    const deadline = Date.now() + 60000;
    do {
      await isolated.clock.runFor(220);
      if (
        (await isolated
          .locator(".nori-stage")
          .getAttribute("data-live2d-status")) === "ready"
      )
        return { context, page: isolated };
    } while (Date.now() < deadline);
    await context.close();
    assert.fail("Isolated cold-open harness did not load the Live2D model");
  };
  // Install interception before the successful load. Chromium may otherwise
  // satisfy later Image requests from its decoded-image cache without giving
  // Playwright's newly registered route a request to fail or defer.
  await page.route(textureUrl, onTexture);
  try {
    await enter(page);
    await until(page, "ready");
    assert.equal(textureRequests, 1, "initial ocean texture request");
    await page.screenshot({ path: resolve(output, "cold-open-ocean.png") });
    await page.evaluate(
      (cold) =>
        window.noriSceneProbe.patch({
          camera: { x: 0, y: 1.1, z: 13.5 },
          coldOpen: { ...cold, oceanDepth: 1, glyphDraw: 0.7, glyphGlow: 1 },
        }),
      cold,
    );
    await page.clock.runFor(80);
    await page.screenshot({ path: resolve(output, "cold-open-glyph.png") });
    await page.evaluate(
      (cold) =>
        window.noriSceneProbe.patch({
          coldOpen: {
            ...cold,
            oceanDepth: 1,
            glyphDraw: 1,
            glyphGlow: 1,
            morph: 0.65,
            noriWash: 1,
          },
        }),
      cold,
    );
    await page.clock.runFor(80);
    await page.screenshot({ path: resolve(output, "cold-open-morph.png") });
    await page.evaluate(
      (cold) =>
        window.noriSceneProbe.patch({
          coldOpen: {
            ...cold,
            oceanDepth: 1,
            glyphDraw: 1,
            glyphGlow: 1,
            morph: 1,
            noriForm: 1,
            noriWash: 0,
          },
        }),
      cold,
    );
    await page.clock.runFor(80);
    await page.screenshot({ path: resolve(output, "cold-open-formed.png") });
    await page.evaluate(() =>
      window.noriSceneProbe.patch({ burst: 1, burstAge: 0.3 }),
    );
    await page.clock.runFor(80);
    await page.screenshot({ path: resolve(output, "cold-open-wake.png") });
    await page.setViewportSize({ width: 640, height: 480 });
    await page.clock.runFor(80);
    assert.equal(await state(page), "ready");
    await page.evaluate(() => window.noriSceneProbe.release());
    await until(page, "inactive");
    await page.setViewportSize({ width: 1000, height: 800 });
    await page.clock.runFor(80);
    assert.deepEqual(
      shaderErrors,
      [],
      "all ocean, bloom, FXAA and silhouette passes must compile",
    );

    // A missing texture is an explicit failure, not an unhandled rejection or stuck promise.
    let isolatedMode = "abort";
    let isolatedRequests = 0;
    const failure = await openIsolatedPage((route) => {
      isolatedRequests++;
      return isolatedMode === "abort" ? route.abort() : route.continue();
    });
    try {
      await enter(failure.page);
      await until(failure.page, "error");
      assert.equal(
        isolatedRequests,
        1,
        "missing-texture injection must intercept the isolated ocean instance",
      );
      await failure.page.evaluate(() => window.noriSceneProbe.release());
      await until(failure.page, "inactive");

      // A failed instance must not poison a later cold-open retry.
      isolatedMode = "continue";
      await enter(failure.page);
      await until(failure.page, "ready");
      assert.equal(
        isolatedRequests,
        2,
        "retry must create and load a fresh ocean instance",
      );
      await failure.page.evaluate(() => window.noriSceneProbe.release());
      await until(failure.page, "inactive");
    } finally {
      await failure.context.close();
    }

    // Stop while the image is in flight, then let its callback arrive.
    let isolatedPending;
    const cancellation = await openIsolatedPage((route) => {
      isolatedPending = route;
    });
    try {
      await enter(cancellation.page);
      const deadline = Date.now() + 15000;
      while (!isolatedPending && Date.now() < deadline)
        await cancellation.page.clock.runFor(40);
      assert.ok(isolatedPending, "deferred ocean texture request");
      await cancellation.page.evaluate(() => window.noriSceneProbe.release());
      await until(cancellation.page, "inactive");
      await isolatedPending.continue();
      isolatedPending = undefined;
      await cancellation.page.clock.runFor(200);
      assert.equal(
        await state(cancellation.page),
        "inactive",
        "late load cannot restore a released ocean",
      );
    } finally {
      if (isolatedPending) await isolatedPending.abort().catch(() => {});
      await cancellation.context.close();
    }
    assert.deepEqual(shaderErrors, []);
    assert.deepEqual(pageErrors, []);
    console.log(
      "Cold open probe passed: real model, ocean/glyph/morph, resize, missing texture, cancellation and late load cleanup",
    );
  } finally {
    await page.unroute(textureUrl, onTexture);
    page.off("console", onConsole);
    page.off("pageerror", onPageError);
  }
}
