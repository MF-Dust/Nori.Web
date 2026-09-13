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
      body: `<html><head><link rel="stylesheet" href="/styles/app.css"></head><body style="margin:0;background:#161a1e"><div id="root"></div><script src="/cubism_sdk/Core/live2dcubismcore.js"></script><script type="module">import RefreshRuntime from "/@react-refresh"; RefreshRuntime.injectIntoGlobalHook(window); window.$RefreshReg$=()=>{}; window.$RefreshSig$=()=>type=>type; window.__vite_plugin_react_preamble_installed__=true;</script><script type="module" src="/@fs/${resolve("tests/frontend-nori-scene-harness.tsx")}"></script></body></html>`,
    }),
  );
  const expectState = async (values) => {
    await page.clock.runFor(220);
    return page.waitForFunction((values) => {
      const host = document.querySelector(".nori-stage");
      return (
        host &&
        Object.entries(values).every(
          ([key, value]) => host.dataset[key] === value,
        )
      );
    }, values);
  };
  try {
    console.log("Nori scene harness loading");
    await page.goto("http://127.0.0.1:47174/nori-scene-harness");
    await expectState({
      live2dStatus: "ready",
      noriIdle: "idle",
      noriLipSync: "true",
    });
    await page.clock.pauseAt(await page.evaluate(() => Date.now() + 1000));
    console.log("Nori scene model ready/wake");
    assert.equal(await page.locator(".nori-stage").getAttribute("data-scene-renderer"), "three");
    const rubbing = await page.evaluate(async url => {
      const { HeadPatAudio } = await import(url);
      const render = async pressing => {
        const context = new OfflineAudioContext(1, 24000, 48000);
        const audio = new HeadPatAudio(() => ({ context, input: context.destination }));
        audio.update(3, pressing);
        const buffer = await context.startRendering();
        audio.dispose();
        const samples = buffer.getChannelData(0);
        let energy = 0, peak = 0;
        for (const value of samples) { if (!Number.isFinite(value)) throw Error("Nonfinite rubbing output"); energy += value * value; peak = Math.max(peak, Math.abs(value)); }
        return { rms: Math.sqrt(energy / samples.length), peak };
      };
      return { active: await render(true), silent: await render(false) };
    }, `/@fs/${resolve("frontend-src/live2d/head-pat-audio.ts")}`);
    assert.ok(rubbing.active.rms > 0.0001 && rubbing.active.peak < 0.2);
    assert.equal(rubbing.silent.rms, 0);
    const pat = page.getByRole("button", { name: "Pat Nori's head", exact: true });
    await page.clock.runFor(220);
    await pat.focus();
    await page.keyboard.down("Space");
    await page.clock.runFor(1100);
    assert.equal(await pat.getAttribute("data-completions"), "1");
    assert.deepEqual(await page.evaluate(() => window.noriSceneProbe.reactions), ["pat"]);
    assert.ok(await page.locator(".nori-pat-spark").count() > 0);
    await page.screenshot({ path: resolve(output, "nori-head-gesture.png") });
    await page.keyboard.up("Space");
    await page.clock.runFor(220);
    assert.equal(await pat.getAttribute("data-progress"), "0");
    await page.evaluate(() => window.noriSceneProbe.acquire({ active: true }));
    await page.clock.runFor(220);
    assert.equal(await pat.isHidden(), true);
    assert.equal(await page.locator(".nori-pat-spark").count(), 0);
    await page.evaluate(() => window.noriSceneProbe.release());
    await page.clock.runFor(220);
    const initialBounds = await page.evaluate(() => window.noriSceneProbe.bounds());
    await page.evaluate(() => window.noriSceneProbe.acquire({ camera: { x: 0, y: 0, z: 10 }, lerp: 1 }));
    await page.clock.runFor(220);
    const distantBounds = await page.evaluate(() => window.noriSceneProbe.bounds());
    assert.ok(distantBounds.width < initialBounds.width * 0.85, "camera movement must update chip scan projection");
    assert.equal(await page.evaluate(() => window.noriSceneProbe.spatial.position.z), 10);
    await page.evaluate(() => window.noriSceneProbe.release());
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
    await page.clock.fastForward(11000); // Advance the model clock through the ten-second sleep fade.
    await page.clock.runFor(220);
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
    const input = page.locator(".conversation-composer input");
    await input.fill("preserve draft");
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
    await page.waitForFunction(
      () => document.querySelector(".conversation-panel")?.inert === true,
    );
    assert.equal(
      await input.evaluate((node) => document.activeElement === node),
      false,
    );
    await page.keyboard.press("Control+k");
    assert.equal(
      await input.evaluate((node) => document.activeElement === node),
      false,
    );
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
    assert.equal(await input.inputValue(), "preserve draft");
    const cuesBefore = await page.evaluate(
      () => window.noriSceneProbe.cues.length,
    );
    await page.evaluate(() =>
      window.noriSceneProbe.acquire({
        active: true,
        chatMode: "bubbles",
        noriTexture: "corrupt",
      }),
    );
    await page.locator(".conversation-panel[data-bubbles-only]").waitFor();
    assert.equal(
      await page.getByRole("textbox", { name: "Message", exact: true }).count(),
      0,
    );
    await page.evaluate(() => window.noriSceneProbe.emotion("serious"));
    const corrupt = page.locator(".conversation-bubble[data-corrupt]").last();
    await corrupt.waitFor();
    assert.equal(
      await corrupt.evaluate(
        (node) => getComputedStyle(node).borderTopLeftRadius,
      ),
      "3px",
    );
    assert.equal(
      await corrupt.locator(".sr-only").textContent(),
      "Model check",
    );
    await page.clock.runFor(600);
    assert.equal(
      await page.evaluate(() => window.noriSceneProbe.cues.length),
      cuesBefore,
    );
    await page.screenshot({ path: resolve(output, "nori-corrupt-chat.png") });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.waitForFunction(() =>
      [
        ...document.querySelectorAll(
          ".conversation-bubble[data-corrupt] > span > span[aria-hidden]",
        ),
      ].every((node) => node.textContent === "Model check"),
    );
    await page.evaluate(() => window.noriSceneProbe.reset());
    await input.waitFor();
    assert.equal(await input.inputValue(), "preserve draft");
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
