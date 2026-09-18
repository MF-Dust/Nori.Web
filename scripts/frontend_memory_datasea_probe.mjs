import assert from "node:assert/strict";
import { resolve } from "node:path";

export async function verifyMemoryDatasea(browser, output, origin = "http://127.0.0.1:47175") {
  const page = await browser.newPage({ viewport: { width: 1100, height: 760 } });
  page.setDefaultTimeout(60000);
  const errors = [], shaderErrors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => { if (message.type() === "error" && /WebGL|shader|THREE/i.test(message.text())) shaderErrors.push(message.text()); });
  await page.clock.install({ time: Date.now() });
  await page.route("**/memory-datasea-harness*", (route) => route.fulfill({ contentType: "text/html", body: `<html class="dark theme-nori"><body style="margin:0;background:#000"><div id="root"></div><script type="module">import RefreshRuntime from "/@react-refresh";RefreshRuntime.injectIntoGlobalHook(window);window.$RefreshReg$=()=>{};window.$RefreshSig$=()=>type=>type;window.__vite_plugin_react_preamble_installed__=true;</script><script type="module" src="/@fs/${resolve("tests/frontend-memory-datasea-harness.tsx")}"></script></body></html>` }));
  const events = () => page.evaluate(() => window.memoryDataseaProbe.events);
  try {
    await page.goto(`${origin}/memory-datasea-harness?scene=memory`);
    await page.clock.runFor(2600);
    for (let windowIndex = 0; windowIndex < 5; windowIndex++) {
      const active = page.locator('[data-mem-active="true"]'); await active.waitFor();
      const expectedItems = [4, 5, 4, 5, 6][windowIndex];
      for (let item = 1; item < expectedItems; item++) { await active.click(); await page.clock.runFor(40); assert.equal(await active.locator(".memory-record").count(), item + 1); }
      if (windowIndex < 4) { await active.click(); await page.clock.runFor(350); }
    }
    await page.screenshot({ path: resolve(output, "memory-five-windows.png") });
    await page.clock.runFor(4900);
    assert.equal(await page.locator('[data-story-scene="memory"]').getAttribute("data-phase"), "flood");
    await page.clock.runFor(17000); await page.screenshot({ path: resolve(output, "memory-lockdown.png") });
    await page.clock.runFor(21000); assert.deepEqual((await events()).completions, ["memory"]);
    await page.evaluate(() => window.memoryDataseaProbe.cancel()); await page.clock.runFor(100);
    assert.equal((await events()).leases, 0); assert.equal(await page.locator('[data-story-scene="memory"]').count(), 0);

    let failGlb = true;
    const rejectGlb = (route) => failGlb ? route.abort() : route.continue();
    await page.route("**/datasea/cosmicweb.min.glb", rejectGlb);
    await page.evaluate(() => window.memoryDataseaProbe.mount("datasea"));
    await page.getByRole("alert").waitFor(); assert.equal((await events()).leases, 0);
    failGlb = false; const glbResponse = page.waitForResponse((response) => response.url().endsWith("cosmicweb.min.glb") && response.ok(), { timeout: 60000 }); await page.getByRole("button", { name: "Retry" }).click();
    await page.locator("canvas.datasea-canvas").waitFor();
    await glbResponse;
    await page.locator('[data-story-scene="datasea"][data-ready="true"]').waitFor(); assert.equal((await events()).leases, 1);
    await page.clock.runFor(90500); await page.locator(".datasea-waves").waitFor();
    await page.screenshot({ path: resolve(output, "datasea-route-gate.png") });
    for (let wave = 0; wave < 3; wave++) {
      const games = page.locator(".datasea-game"); await games.first().waitFor();
      for (let index = 0; index < 4; index++) {
        const game = games.nth(index), id = await game.getAttribute("data-game"), ranges = game.locator('input[type="range"]');
        if (await ranges.count()) { const values = id === "resonance" ? [62, 34, 78] : id === "ripple" ? [45, 70, 28] : [50, 50, 50]; for (let axis = 0; axis < 3; axis++) await ranges.nth(axis).fill(String(values[axis])); }
        else { const field = game.getByRole("button"); for (let tap = 0; tap < 8; tap++) await field.click(); }
      }
      await page.clock.runFor(wave === 2 ? 1500 : 2700);
    }
    await page.clock.runFor(12000);
    assert.equal(await page.locator('[data-story-scene="datasea"]').getAttribute("data-phase"), "cosmic");
    await page.screenshot({ path: resolve(output, "datasea-cosmic.png") });
    await page.clock.runFor(82000); assert.ok((await events()).completions.includes("datasea"));
    await page.evaluate(() => window.memoryDataseaProbe.cancel()); await page.clock.runFor(100);
    assert.equal((await events()).leases, 0); assert.equal(await page.locator("canvas.datasea-canvas").count(), 0);
    assert.deepEqual(errors, []); assert.deepEqual(shaderErrors, []);
    console.log("Memory/Datasea probe passed: five read gates, completion/cancel, GLB retry, route gate, cosmic render and cleanup");
  } catch (error) {
    await page.screenshot({ path: resolve(output, "memory-datasea-failure.png") });
    throw error;
  } finally { await page.close(); }
}
