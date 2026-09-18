import assert from "node:assert/strict";
import { resolve } from "node:path";

export async function verifyFarewellEnding(browser, output, origin = "http://127.0.0.1:47175") {
  const page = await browser.newPage({ viewport: { width: 1000, height: 800 } });
  page.setDefaultTimeout(60000);
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const installedAt = Date.now();
  await page.clock.install({ time: installedAt });
  await page.clock.pauseAt(installedAt + 60000);
  await page.route("**/farewell-ending-harness", (route) => route.fulfill({
    contentType: "text/html",
    body: `<html><head><link rel="stylesheet" href="/styles/app.css"></head><body style="margin:0;background:#05080d"><div id="root"></div><script src="/cubism_sdk/Core/live2dcubismcore.js"></script><script type="module">import RefreshRuntime from "/@react-refresh";RefreshRuntime.injectIntoGlobalHook(window);window.$RefreshReg$=()=>{};window.$RefreshSig$=()=>type=>type;window.__vite_plugin_react_preamble_installed__=true;</script><script type="module" src="/@fs/${resolve("tests/frontend-farewell-ending-harness.tsx")}"></script></body></html>`,
  }));
  const run = (milliseconds) => page.clock.runFor(milliseconds);
  const advanceUntil = async (description, predicate, timeout = 60000) => {
    const deadline = Date.now() + timeout;
    do {
      await page.clock.runFor(40);
      if (await predicate()) return;
    } while (Date.now() < deadline);
    assert.fail(`Timed out waiting for ${description}`);
  };
  const waitForCold = (value) => advanceUntil(`cold-open ${value}`, () =>
    page.locator(".nori-stage").getAttribute("data-cold-open").then((state) => state === value));
  try {
    await page.goto(`${origin}/farewell-ending-harness`);

    // Production Finale model + WebGL compositor; completion must not reload before ack.
    await page.evaluate(() => window.farewellEndingProbe.mount("farewell"));
    const farewell = page.locator('[data-story-scene="farewell"]');
    await advanceUntil("Farewell actor", async () =>
      await farewell.getAttribute("data-ready") === "true" && await farewell.locator("canvas").count() === 2);
    await page.clock.fastForward(9000); await run(40);
    assert.equal(await farewell.getAttribute("data-speaking"), "true");
    assert.ok(await farewell.locator("canvas").first().evaluate((canvas) => canvas.width > 1 && canvas.height > 1));
    await page.screenshot({ path: resolve(output, "farewell-production.png") });
    await page.clock.fastForward(114000); await run(40);
    assert.deepEqual(await page.evaluate(() => window.farewellEndingProbe.events), ["complete-requested"]);
    await page.evaluate(() => window.farewellEndingProbe.acknowledge());
    assert.deepEqual(await page.evaluate(() => window.farewellEndingProbe.events), ["complete-requested", "acknowledged", "reload"]);

    // Replacing the world releases the actor, renderer, audio and scene lease.
    await page.evaluate(() => window.farewellEndingProbe.mount("farewell"));
    await advanceUntil("replacement Farewell actor", () => farewell.getAttribute("data-ready").then((value) => value === "true"));
    await run(40);
    await page.evaluate(() => window.farewellEndingProbe.cancel());
    await page.clock.fastForward(125000); await run(40);
    assert.equal(await page.locator('[data-story-scene="farewell"]').count(), 0);
    assert.equal(await page.evaluate(() => window.farewellEndingProbe.state().active), false);
    assert.deepEqual(await page.evaluate(() => window.farewellEndingProbe.events), ["cancel"]);

    // A failed cold-open resource exposes Retry; retry reconstructs a fresh renderer.
    let failOcean = true;
    const oceanRoute = (route) => failOcean ? route.abort() : route.continue();
    await page.route("**/ocean/gradient-noise.jpg", oceanRoute);
    await page.evaluate(() => window.farewellEndingProbe.mount("ending"));
    const ending = page.locator('[data-story-scene="ending"]');
    const retry = page.getByRole("button", { name: "Retry" });
    await advanceUntil("Ending resource failure", () => retry.count().then((count) => count === 1));
    assert.equal(await page.evaluate(() => window.farewellEndingProbe.state().active), false);
    failOcean = false;
    await retry.click();
    await waitForCold("ready");
    await page.unroute("**/ocean/gradient-noise.jpg", oceanRoute);

    // The zero-duration ready phase remains parked until the real wake control is used.
    await page.clock.fastForward(32650); await run(40);
    const wake = page.getByRole("button", { name: "Wake Nori" });
    await advanceUntil("Ending wake gate", () => wake.count().then((count) => count === 1));
    assert.equal(await ending.getAttribute("data-parked"), "true");
    await page.clock.fastForward(3000); await run(40);
    assert.equal(await ending.getAttribute("data-parked"), "true");
    await page.screenshot({ path: resolve(output, "ending-wake-gate.png") });
    await wake.click(); await page.clock.fastForward(3500); await run(40);
    assert.deepEqual(await page.evaluate(() => window.farewellEndingProbe.events), ["complete-requested"]);
    assert.deepEqual(errors, []);
    console.log("Farewell/Ending probe passed: Finale actor/WebGL, ack ordering, cancellation, resource retry and wake gate");
  } finally {
    await page.evaluate(() => window.farewellEndingProbe?.unmount()).catch(() => {});
    await page.close();
  }
}
