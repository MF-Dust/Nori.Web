import assert from "node:assert/strict";
import { resolve } from "node:path";
import { writeFile } from "node:fs/promises";
import { solveDataseaCoreGame } from "./frontend_datasea_core_game_inputs.mjs";
import { solveDataseaGame } from "./frontend_datasea_game_inputs.mjs";

async function waitWithClock(page, locator, timeout = 60000) {
  for (let elapsed = 0; elapsed < timeout; elapsed += 40) {
    if (await locator.count()) return locator;
    await page.clock.runFor(40);
  }
  throw new Error(`Timed out waiting for ${locator}`);
}

async function captureWebglFramebuffer(page, path) {
  const capture = await page
    .locator("canvas.datasea-canvas")
    .evaluate(async (canvas) => {
      const gl = canvas.getContext("webgl2");
      if (!gl) throw new Error("Datasea WebGL2 context is unavailable");
      const width = canvas.width,
        height = canvas.height,
        pixels = new Uint8Array(width * height * 4);
      gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
      let painted = 0;
      for (let offset = 0; offset < pixels.length; offset += 4) {
        if (pixels[offset] + pixels[offset + 1] + pixels[offset + 2] > 12)
          painted++;
      }
      const flipped = new Uint8ClampedArray(pixels.length);
      for (let row = 0; row < height; row++) {
        const source = row * width * 4,
          target = (height - row - 1) * width * 4;
        flipped.set(pixels.subarray(source, source + width * 4), target);
      }
      const output = document.createElement("canvas");
      output.width = width;
      output.height = height;
      const context = output.getContext("2d");
      if (!context) throw new Error("PNG staging context is unavailable");
      context.putImageData(new ImageData(flipped, width, height), 0, 0);
      const blob = await new Promise((resolve, reject) =>
        output.toBlob(
          (value) =>
            value ? resolve(value) : reject(new Error("PNG encoding failed")),
          "image/png",
        ),
      );
      const bytes = new Uint8Array(await blob.arrayBuffer());
      let binary = "";
      for (let offset = 0; offset < bytes.length; offset += 32768)
        binary += String.fromCharCode(...bytes.subarray(offset, offset + 32768));
      return { width, height, painted, png: btoa(binary) };
    });
  assert.equal(capture.width, 1090);
  assert.equal(capture.height, 760);
  assert.ok(
    capture.painted > capture.width * capture.height * 0.01,
    "cosmic framebuffer must contain visible rendered pixels",
  );
  await writeFile(path, Buffer.from(capture.png, "base64"));
}

export async function verifyMemoryDatasea(
  browser,
  output,
  origin = "http://127.0.0.1:47175",
) {
  const page = await browser.newPage({
    viewport: { width: 1100, height: 760 },
  });
  page.setDefaultTimeout(60000);
  await page.addInitScript(() => {
    window.dataseaGpuDraws = 0;
    for (const method of [
      "drawArrays",
      "drawElements",
      "drawArraysInstanced",
      "drawElementsInstanced",
    ]) {
      const original = WebGL2RenderingContext.prototype[method];
      WebGL2RenderingContext.prototype[method] = function (...args) {
        if (
          this.canvas instanceof HTMLCanvasElement &&
          this.canvas.classList.contains("datasea-canvas")
        )
          window.dataseaGpuDraws++;
        return Reflect.apply(original, this, args);
      };
    }
  });
  const errors = [],
    shaderErrors = [],
    consoleErrors = [],
    requests = [];
  let currentStage = "initialization";
  const stage = (name) => {
    currentStage = name;
    console.log(`[Memory/Datasea ${new Date().toISOString()}] ${name}`);
  };
  page.on("requestfailed", (request) =>
    requests.push({
      url: new URL(request.url()).pathname,
      failure: request.failure()?.errorText,
    }),
  );
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (
      message.type() === "error" &&
      /WebGL|shader|THREE/i.test(message.text())
    )
      shaderErrors.push(message.text());
  });
  const installedAt = Date.now();
  await page.clock.install({ time: installedAt });
  // Pointer decisions inspect one rendered state; wall-clock CPU/GPU latency
  // must not move a timing target between that observation and the input.
  await page.clock.pauseAt(installedAt + 1000);
  await page.route("**/memory-datasea-harness*", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: `<html class="dark theme-nori"><body style="margin:0;background:#000"><div id="root"></div><script type="module">import RefreshRuntime from "/@react-refresh";RefreshRuntime.injectIntoGlobalHook(window);window.$RefreshReg$=()=>{};window.$RefreshSig$=()=>type=>type;window.__vite_plugin_react_preamble_installed__=true;</script><script type="module" src="/@fs/${resolve("tests/frontend-memory-datasea-harness.tsx")}"></script></body></html>`,
    }),
  );
  const events = () => page.evaluate(() => window.memoryDataseaProbe.events);
  try {
    stage("Memory load and ordered read gates");
    await page.goto(`${origin}/memory-datasea-harness?scene=memory`);
    await page.clock.runFor(2600);
    for (let windowIndex = 0; windowIndex < 5; windowIndex++) {
      const active = page.locator('[data-mem-active="true"]');
      await waitWithClock(page, active);
      const expectedItems = [4, 5, 4, 5, 6][windowIndex];
      for (let item = 1; item < expectedItems; item++) {
        await active.click();
        await page.clock.runFor(40);
        assert.equal(await active.locator(".memory-record").count(), item + 1);
      }
      if (windowIndex < 4) {
        await active.click();
        await page.clock.runFor(350);
      }
    }
    await page.screenshot({ path: resolve(output, "memory-five-windows.png") });
    // Final record holds for 4.8s, then its 0.3s phase tail precedes flood.
    await page.clock.runFor(5200);
    assert.equal(
      await page
        .locator('[data-story-scene="memory"]')
        .getAttribute("data-phase"),
      "flood",
    );
    await page.clock.runFor(17000);
    await page.screenshot({ path: resolve(output, "memory-lockdown.png") });
    await page.clock.runFor(21000);
    assert.deepEqual((await events()).completions, ["memory"]);
    await page.evaluate(() => window.memoryDataseaProbe.cancel());
    await page.clock.runFor(100);
    assert.equal((await events()).leases, 0);
    assert.equal(await page.locator('[data-story-scene="memory"]').count(), 0);

    stage("Datasea intentional GLB failure");
    let failGlb = true;
    let failedGlbRequests = 0,
      retriedGlbRequests = 0;
    const rejectGlb = (route) => {
      if (failGlb) {
        failedGlbRequests++;
        return route.abort();
      }
      retriedGlbRequests++;
      return route.continue();
    };
    await page.route("**/datasea/cosmicweb.min.glb", rejectGlb);
    await page.evaluate(() => window.memoryDataseaProbe.mount("datasea"));
    await waitWithClock(page, page.getByRole("alert"));
    assert.equal((await events()).leases, 0);
    assert.ok(failedGlbRequests > 0, "failure must reach the real GLB request");
    stage("Datasea asset retry");
    failGlb = false;
    await page.getByRole("button", { name: "Retry" }).click();
    await waitWithClock(
      page,
      page.locator('[data-story-scene="datasea"][data-ready="true"]'),
    );
    assert.ok(retriedGlbRequests > 0, "retry must issue a fresh GLB request");
    assert.equal((await events()).leases, 1);
    stage("Datasea loaded; advancing to first wave");
    await page.clock.fastForward(90500);
    await page.clock.runFor(80);
    await waitWithClock(page, page.locator(".datasea-waves"));
    await page.screenshot({ path: resolve(output, "datasea-route-gate.png") });
    stage("Verifying parked backdrop convergence and resize invalidation");
    await page.clock.runFor(1900);
    const settledDraws = await page.evaluate(() => window.dataseaGpuDraws);
    await page.clock.runFor(320);
    assert.equal(
      await page.evaluate(() => window.dataseaGpuDraws),
      settledDraws,
      "unchanged parked backdrop must reuse its converged frame",
    );
    await page.setViewportSize({ width: 1090, height: 760 });
    await page.clock.runFor(180);
    assert.ok(
      (await page.evaluate(() => window.dataseaGpuDraws)) > settledDraws,
      "resizing must invalidate the parked backdrop frame",
    );
    for (let wave = 0; wave < 3; wave++) {
      const games = page.locator(".datasea-game");
      await waitWithClock(page, games.first());
      assert.equal(await games.count(), 4);
      await page.clock.runFor(650);
      for (const id of [
        ["denoise", "sweep", "unknot", "relay"],
        ["discern", "echo", "steady", "balance"],
        ["current", "lure", "resonance", "ripple"],
      ][wave]) {
        stage(`Wave ${wave + 1}: ${id} input start`);
        const began = Date.now();
        const handled =
          (await solveDataseaCoreGame(page, id)) ||
          (await solveDataseaGame(page, id));
        assert.ok(handled, `a real-input solver exists for ${id}`);
        stage(`Wave ${wave + 1}: ${id} solved in ${Date.now() - began}ms`);
      }
      if (wave < 2)
        await waitWithClock(
          page,
          page.locator(
            `.datasea-waves[aria-label="Signal wave ${wave + 2} of 3"] .datasea-game`,
          ),
        );
      else await page.clock.runFor(1500);
    }
    stage("All twelve games solved; cosmic rendering");
    await page.clock.fastForward(12000);
    await page.clock.runFor(160);
    assert.equal(
      await page
        .locator('[data-story-scene="datasea"]')
        .getAttribute("data-phase"),
      "cosmic",
    );
    // Chromium's page screenshot path can stall after prolonged SwiftShader
    // work. Read the production WebGL framebuffer and encode those exact pixels
    // without asking Chromium to copy its display surface.
    await captureWebglFramebuffer(
      page,
      resolve(output, "datasea-cosmic.png"),
    );
    assert.equal(
      await page.locator('[data-story-scene="datasea"]').getAttribute("data-phase"),
      "cosmic",
    );
    stage("Cosmic captured; completion and resource cleanup");
    await page.clock.fastForward(105000);
    await page.clock.runFor(40);
    assert.ok((await events()).completions.includes("datasea"));
    await page.evaluate(() => window.memoryDataseaProbe.cancel());
    await page.clock.runFor(100);
    assert.equal((await events()).leases, 0);
    assert.equal(await page.locator("canvas.datasea-canvas").count(), 0);
    assert.deepEqual(errors, []);
    assert.deepEqual(shaderErrors, []);
    console.log(
      "Memory/Datasea probe passed: five read gates, completion/cancel, GLB retry, route gate, cosmic render and cleanup",
    );
  } catch (error) {
    const state = await page
      .evaluate(() => ({
        story: document
          .querySelector("[data-story-scene]")
          ?.outerHTML.slice(0, 1600),
        games: [...document.querySelectorAll(".datasea-game")].map((game) => ({
          id: game.getAttribute("data-game"),
          solved: game.getAttribute("data-solved"),
          bounds: game.getBoundingClientRect().toJSON(),
        })),
        text: document.body.innerText.slice(0, 1200),
      }))
      .catch((diagnosticError) => ({
        diagnosticError: String(diagnosticError),
      }));
    const diagnostic = {
      stage: currentStage,
      error: String(error),
      state,
      errors,
      shaderErrors,
      consoleErrors: consoleErrors.slice(-10),
      requests,
    };
    console.error(
      "Memory/Datasea failure diagnostics:",
      JSON.stringify(diagnostic),
    );
    await writeFile(
      resolve(output, "memory-datasea-failure.json"),
      JSON.stringify(diagnostic, null, 2),
    );
    await page
      .screenshot({
        path: resolve(output, "memory-datasea-failure.png"),
        timeout: 15000,
      })
      .catch(() => {});
    throw error;
  } finally {
    await page.close();
  }
}
