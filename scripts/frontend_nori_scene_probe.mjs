import assert from "node:assert/strict";
import { resolve } from "node:path";

export async function verifyNoriScene(browser, output) {
  const page = await browser.newPage({
    viewport: { width: 1000, height: 800 },
  });
  page.setDefaultTimeout(30000);
  const errors = [];
  const textures = [];
  page.on("response", (response) => {
    if (response.url().endsWith("texture_00_corrupt.png") && response.ok())
      textures.push(response.url());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  await page.clock.install();
  await page.route("**/nori-scene-harness", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: `<html><body style="margin:0;background:#161a1e"><div id="root"></div><script src="/cubism_sdk/Core/live2dcubismcore.js"></script><script type="module">import RefreshRuntime from "/@react-refresh"; RefreshRuntime.injectIntoGlobalHook(window); window.$RefreshReg$=()=>{}; window.$RefreshSig$=()=>type=>type; window.__vite_plugin_react_preamble_installed__=true;</script><script type="module" src="/@fs/${resolve("tests/frontend-nori-scene-harness.tsx")}"></script></body></html>`,
    }),
  );
  const expectState = async (values) =>
    page.waitForFunction((values) => {
      const host = document.querySelector(".nori-stage");
      return (
        host &&
        Object.entries(values).every(
          ([key, value]) => host.dataset[key] === value,
        )
      );
    }, values);
  try {
    console.log("Nori scene harness loading");
    await page.goto("http://127.0.0.1:47174/nori-scene-harness");
    await expectState({
      live2dStatus: "ready",
      noriIdle: "idle",
      noriLipSync: "true",
    });
    console.log("Nori scene model ready/wake");
    await page.evaluate(() => window.noriSceneProbe.emotion("happy"));
    await expectState({ noriExpression: "07_Smile" });
    await page.screenshot({ path: resolve(output, "nori-expression.png") });
    await page.evaluate(() => window.noriSceneProbe.emotion("surprised"));
    await expectState({ noriExpression: "07_Smile" });
    await page.clock.fastForward(3100);
    await expectState({ noriExpression: "14_Surprised" });
    await page.evaluate(() =>
      window.noriSceneProbe.chat({ phase: "executing" }),
    );
    await page.clock.fastForward(16000);
    await expectState({ noriThinking: "true", noriIdle: "idle" });
    await page.evaluate(() => window.noriSceneProbe.chat({ phase: "idle" }));
    await page.clock.fastForward(16000);
    await expectState({
      noriThinking: "false",
      noriIdle: "sleep",
      noriExpression: "neutral",
    });
    await page.clock.runFor(11000); // Let the original ten-second sleep fade become visible.
    await page.screenshot({ path: resolve(output, "nori-sleep.png") });
    console.log("Nori scene model ready/wake");
    await page.evaluate(() => window.noriSceneProbe.emotion("happy"));
    await expectState({ noriIdle: "idle", noriExpression: "07_Smile" });
    for (const [facts, idle, lip] of [
      [
        ["corrupt.doc1.read", "corrupt.doc2.read", "corrupt.doc3.read"],
        "glitch",
        "true",
      ],
      [["arg.memory.shown"], "kneel", "false"],
      [["arg.manifold_unlocked"], "kneelCalm", "false"],
      [["arg.manifold_unlocked", "arg.finale.shown"], "idle", "true"],
    ]) {
      await page.evaluate((facts) => window.noriSceneProbe.facts(facts), facts);
      await expectState({ noriIdle: idle, noriLipSync: lip });
    }
    await page.evaluate(() =>
      window.noriSceneProbe.acquire({
        active: true,
        noriTexture: "corrupt",
        noriRestPose: true,
        eyeOpen: 0.4,
        mouthOpen: 0.1,
        vignette: 2,
        blur: 1,
      }),
    );
    await expectState({
      noriTexture: "corrupt",
      noriRestPose: "true",
      noriExpression: "neutral",
    });
    assert.equal(textures.length, 1);
    assert.equal(await page.locator("[data-scene-effect]").count(), 2);
    assert.equal(
      await page
        .locator('[data-scene-effect="blur"]')
        .evaluate((node) => getComputedStyle(node).pointerEvents),
      "none",
    );
    await page.screenshot({ path: resolve(output, "nori-scene-corrupt.png") });
    await page.evaluate(() => {
      window.noriSceneProbe.emotion("angry");
      window.noriSceneProbe.acquire({ active: true, noriSleep: true });
    });
    await expectState({
      noriIdle: "sleep",
      noriTexture: "default",
      noriExpression: "neutral",
    });
    await page.evaluate(() => window.noriSceneProbe.release());
    await expectState({ noriTexture: "corrupt", noriRestPose: "true" });
    await page.evaluate(() => window.noriSceneProbe.reset());
    await expectState({
      noriIdle: "idle",
      noriTexture: "default",
      noriRestPose: "false",
    });
    assert.equal(await page.locator("[data-scene-effect]").count(), 0);
    await page.evaluate(() => window.noriSceneProbe.unmount());
    await page.clock.fastForward(30000);
    assert.equal(await page.locator("canvas").count(), 0);
    assert.deepEqual(errors, []);
    console.log(
      "Nori scene probe passed: expressions, sleep/wake, thinking, story poses, scene layers and cleanup",
    );
  } catch (error) {
    console.log(
      "Scene probe failure",
      errors,
      await page.locator("body").innerText(),
      await page
        .locator(".nori-stage")
        .evaluateAll((nodes) => nodes.map((node) => ({ ...node.dataset }))),
    );
    await page.screenshot({ path: resolve(output, "nori-scene-failure.png") });
    throw error;
  } finally {
    await page.close();
  }
}
