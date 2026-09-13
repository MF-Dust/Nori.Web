import assert from "node:assert/strict";
import { resolve } from "node:path";
export async function verifySceneTools(browser, output) {
  const page = await browser.newPage({ viewport: { width: 900, height: 650 } });
  const errors = [],
    audio = [];
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
    await page.evaluate(() => window.sceneTools.closeDebug());
    await page.waitForFunction(() => !window.sceneTools.state().corruptVoice);
    await page.evaluate(() => window.sceneTools.start());
    await page.waitForFunction(
      () =>
        Number(document.querySelector("[data-story-scene]")?.dataset.progress) >
        0.2,
    );
    assert.equal(
      await page.evaluate(() => window.sceneTools.state().active),
      true,
    );
    await page.screenshot({ path: resolve(output, "cult-flash.png") });
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
    console.log(
      "Scene tools probe passed: Debug controls, scoped overrides, cult shader/audio, completion and cancellation",
    );
  } catch (error) {
    console.log("Scene tools errors", errors);
    await page.screenshot({ path: resolve(output, "scene-tools-failure.png") });
    throw error;
  } finally {
    await page.close();
  }
}
