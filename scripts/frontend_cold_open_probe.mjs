import assert from "node:assert/strict";
import { resolve } from "node:path";

// Uses the real Cubism canvas and production Three renderer in the scene harness.
export async function verifyColdOpen(page, output) {
  const shaderErrors = [];
  const textureUrl = "**/ocean/gradient-noise.jpg";
  let textureMode = "continue";
  let textureRequests = 0;
  let pendingTexture;
  const onTexture = (route) => {
    textureRequests++;
    if (textureMode === "abort") return route.abort();
    if (textureMode === "defer") {
      pendingTexture = route;
      return;
    }
    return route.continue();
  };
  const onConsole = (message) => {
    if (
      message.type() === "error" &&
      /THREE|WebGL|shader/i.test(message.text())
    )
      shaderErrors.push(message.text());
  };
  page.on("console", onConsole);
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
  const enter = () =>
    page.evaluate(
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
  const state = () =>
    page.locator(".nori-stage").getAttribute("data-cold-open");
  const until = async (value) => {
    const deadline = Date.now() + 60000;
    do {
      await page.clock.runFor(40);
      if ((await state()) === value) return;
    } while (Date.now() < deadline);
    assert.fail(`Cold open did not reach ${value}; got ${await state()}`);
  };
  // Install interception before the successful load. Chromium may otherwise
  // satisfy later Image requests from its decoded-image cache without giving
  // Playwright's newly registered route a request to fail or defer.
  await page.route(textureUrl, onTexture);
  try {
    await enter();
    await until("ready");
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
    assert.equal(await state(), "ready");
    await page.evaluate(() => window.noriSceneProbe.release());
    await until("inactive");
    await page.setViewportSize({ width: 1000, height: 800 });
    await page.clock.runFor(80);
    assert.deepEqual(
      shaderErrors,
      [],
      "all ocean, bloom, FXAA and silhouette passes must compile",
    );

    // A missing texture is an explicit failure, not an unhandled rejection or stuck promise.
    textureMode = "abort";
    const requestsBeforeFailure = textureRequests;
    await enter();
    await until("error");
    assert.equal(
      textureRequests,
      requestsBeforeFailure + 1,
      "missing-texture injection must intercept the new ocean instance",
    );
    await page.evaluate(() => window.noriSceneProbe.release());
    await until("inactive");

    // A failed instance must not poison a later cold-open retry.
    textureMode = "continue";
    const requestsBeforeRetry = textureRequests;
    await enter();
    await until("ready");
    assert.equal(
      textureRequests,
      requestsBeforeRetry + 1,
      "retry must create and load a fresh ocean instance",
    );
    await page.evaluate(() => window.noriSceneProbe.release());
    await until("inactive");

    // Stop while the image is in flight, then let its callback arrive.
    textureMode = "defer";
    await enter();
    const deadline = Date.now() + 15000;
    while (!pendingTexture && Date.now() < deadline) await page.clock.runFor(40);
    assert.ok(pendingTexture, "deferred ocean texture request");
    await page.evaluate(() => window.noriSceneProbe.release());
    await until("inactive");
    await pendingTexture.continue();
    pendingTexture = undefined;
    await page.clock.runFor(200);
    assert.equal(
      await state(),
      "inactive",
      "late load cannot restore a released ocean",
    );
    assert.deepEqual(shaderErrors, []);
    console.log(
      "Cold open probe passed: real model, ocean/glyph/morph, resize, missing texture, cancellation and late load cleanup",
    );
  } finally {
    if (pendingTexture) await pendingTexture.abort().catch(() => {});
    await page.unroute(textureUrl, onTexture);
    page.off("console", onConsole);
  }
}
