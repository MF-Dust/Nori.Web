import assert from "node:assert/strict";
import { resolve } from "node:path";
import { verifyAntivirus } from "./frontend_antivirus_probe.mjs";
export async function verifySceneTools(browser, output) {
  const page = await browser.newPage({ viewport: { width: 900, height: 650 } });
  const errors = [],
    audio = [],
    sockets = [];
  page.on("websocket", (socket) => sockets.push(socket.url()));
  // Vite's CSS helper still imports its client when server.hmr is false.
  // Keep style/module helpers, but omit the dev-only socket in this static fixture.
  await page.route("**/@vite/client", async (route) => {
    const response = await route.fetch();
    const source = await response.text();
    const connect = "transport.connect(createHMRHandler(handleMessage));";
    assert.ok(source.includes(connect), "Vite client bootstrap changed");
    await route.fulfill({
      response,
      body: source.replace(
        connect,
        "/* Static smoke fixture: no HMR transport. */",
      ),
    });
  });
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("response", (response) => {
    if (response.ok() && response.url().endsWith("/audio/cult/drone.ogg"))
      audio.push(response.url());
  });
  await page.route("**/scene-tools-harness", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: `<html><head><link rel="stylesheet" href="/styles/app.css"></head><body style="margin:0;background:#161a1e"><div id="root"></div><script type="module">import RefreshRuntime from "/@react-refresh"; RefreshRuntime.injectIntoGlobalHook(window); window.$RefreshReg$=()=>{}; window.$RefreshSig$=()=>type=>type; window.__vite_plugin_react_preamble_installed__=true;</script><script type="module" src="/@fs/${resolve("tests/frontend-scene-tools-harness.tsx")}"></script></body></html>`,
    }),
  );
  try {
    await page.goto("http://127.0.0.1:47174/scene-tools-harness");
    await page
      .getByRole("heading", { name: "Connection", exact: true })
      .waitFor();
    await page.getByRole("button", { name: "Scene", exact: true }).click();
    await page.getByLabel("Camera z", { exact: true }).fill("9");
    assert.equal(
      await page.evaluate(() => window.sceneTools.state().camera.z),
      9,
    );
    await page.getByRole("button", { name: "Release overrides" }).click();
    assert.equal(
      await page.evaluate(() => window.sceneTools.state().camera),
      null,
    );
    await page.getByRole("button", { name: "Audio", exact: true }).click();
    await page.getByRole("button", { name: "Play cue" }).click();
    await page.getByLabel("Corrupt voice", { exact: true }).check();
    assert.equal(
      await page.evaluate(() => window.sceneTools.state().corruptVoice),
      true,
    );
    await page.screenshot({ path: resolve(output, "debug-audio.png") });
    await page.getByRole("button", { name: "Scene editor", exact: true }).click();
    await page.getByRole("button", { name: "Play preview", exact: true }).click();
    await page.locator('[data-scene-preview-phase="inspect"]').waitFor();
    assert.equal(await page.evaluate(() => window.sceneTools.state().darkness), .65);
    await page.waitForTimeout(150);
    assert.equal(await page.evaluate(() => window.sceneTools.completions.length), 0);
    await page.screenshot({ path: resolve(output, "scene-editor-gate.png") });
    await page.getByRole("button", { name: "Continue phase", exact: true }).click();
    await page.getByRole("button", { name: "Play preview", exact: true }).waitFor({ state: "visible" });
    await page.waitForFunction(() => !window.sceneTools.state().active);
    assert.equal(await page.evaluate(() => window.sceneTools.state().darkness), 0);
    assert.equal(await page.evaluate(() => window.sceneTools.completions.length), 0);
    await page.getByLabel("Scene project JSON").fill('{"name":"invalid"}');
    await page.getByRole("button", { name: "Play preview", exact: true }).click();
    await page.getByRole("alert").waitFor();
    assert.equal(await page.evaluate(() => window.sceneTools.state().active), false);
    await verifyAntivirus(page, output);
    await page.evaluate(() => window.sceneTools.closeDebug());
    await page.waitForFunction(() => !window.sceneTools.state().corruptVoice);
    await page.evaluate(() => window.sceneTools.start());
    await page.waitForFunction(() => {
      const progress = Number(
        document.querySelector("[data-story-scene]")?.dataset.progress,
      );
      if (progress <= 0.2 || !Number.isFinite(progress)) return false;
      // Freeze in the browser before returning to the slower screenshot driver.
      window.sceneTools.visibility(true);
      return true;
    });
    assert.equal(
      await page.evaluate(() => window.sceneTools.state().active),
      true,
    );
    await page.screenshot({ path: resolve(output, "cult-flash.png") });
    await page.waitForTimeout(100);
    const paused = await page
      .locator("[data-story-scene]")
      .getAttribute("data-progress");
    await page.waitForTimeout(350);
    assert.equal(
      await page.locator("[data-story-scene]").getAttribute("data-progress"),
      paused,
      "hidden scenes must retain their timeline position",
    );
    assert.equal(
      await page.evaluate(() => window.sceneTools.completions.length),
      0,
    );
    await page.evaluate(() => window.sceneTools.visibility(false));
    await page
      .locator("[data-story-scene]")
      .waitFor({ state: "detached", timeout: 20000 });
    assert.deepEqual(await page.evaluate(() => window.sceneTools.completions), [
      "arg.cult_truth",
    ]);
    assert.equal(audio.length, 1);
    assert.equal(
      await page.evaluate(() => window.sceneTools.state().active),
      false,
    );
    await page.evaluate(() => window.sceneTools.start("second"));
    await page.locator("[data-story-scene]").waitFor();
    await page.evaluate(() => window.sceneTools.cancel());
    await page.locator("[data-story-scene]").waitFor({ state: "detached" });
    assert.equal(
      await page.evaluate(() => window.sceneTools.completions.length),
      1,
    );
    await page.evaluate(() => window.sceneTools.dispose());
    assert.deepEqual(errors, []);
    assert.deepEqual(
      sockets,
      [],
      "static scene fixture must not open a development socket",
    );
    console.log(
      "Scene tools probe passed: Debug controls, scoped overrides, cult shader/audio, completion and cancellation",
    );
  } catch (error) {
    console.log("Scene tools errors", errors, error);
    await page.screenshot({ path: resolve(output, "scene-tools-failure.png") });
    throw error;
  } finally {
    await page.close();
  }
}
