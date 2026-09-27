import assert from "node:assert/strict";
import { resolve } from "node:path";

/**
 * Cult flash, the last story producer without its own recovery surface.
 *
 * Reuses `tests/frontend/harness/frontend-scene-tools-harness.tsx` — the same harness
 * `scripts/probes/frontend_visual_comparison.mjs` enters this segment with — and the
 * fake clock the other story probes drive, so the 7s reveal is reached
 * deterministically and every captured frame is the renderer's own output.
 * `StoryClock` here lives inside the effect and publishes only `data-progress`,
 * so progress is the segment's timeline, not an estimate.
 */
export async function verifyCultFlash(
  browser,
  output,
  origin = "http://127.0.0.1:47175",
) {
  const page = await browser.newPage({
    viewport: { width: 1000, height: 760 },
  });
  page.setDefaultTimeout(60000);
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  // Vite's CSS helper still imports its client when server.hmr is false. Keep
  // the style helpers, but omit the dev-only socket in this static fixture.
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
  const installedAt = Date.now();
  await page.clock.install({ time: installedAt });
  await page.clock.pauseAt(installedAt + 1000);
  await page.route("**/cult-flash-harness", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: `<html><head><link rel="stylesheet" href="/styles/app.css"></head><body style="margin:0;background:#161a1e"><div id="root"></div><script type="module">import RefreshRuntime from "/@react-refresh"; RefreshRuntime.injectIntoGlobalHook(window); window.$RefreshReg$=()=>{}; window.$RefreshSig$=()=>type=>type; window.__vite_plugin_react_preamble_installed__=true;</script><script type="module" src="/@fs/${resolve("tests/frontend/harness/frontend-scene-tools-harness.tsx")}"></script></body></html>`,
    }),
  );
  const host = page.locator('[data-story-scene="cult-flash"]');
  const progress = async () => {
    const value = await host.count().then(async (count) =>
      count ? host.getAttribute("data-progress") : null,
    );
    return value === null ? null : Number(value);
  };
  /** Step the fake clock until the segment's own clock reaches `seconds`. */
  const advanceTo = async (seconds) => {
    const deadline = Date.now() + 60000;
    do {
      await page.clock.runFor(40);
      const value = await progress();
      if (value === null)
        throw new Error(`cult-flash unmounted before ${seconds}s`);
      if (value * 7 >= seconds) return value;
    } while (Date.now() < deadline);
    throw new Error(`cult-flash never reached ${seconds}s`);
  };
  const until = async (description, predicate) => {
    const deadline = Date.now() + 60000;
    do {
      await page.clock.runFor(40);
      if (await predicate()) return;
    } while (Date.now() < deadline);
    assert.fail(`Timed out waiting for ${description}`);
  };
  const frame = async (name) =>
    (await page.screenshot({ path: resolve(output, name) })).toString("base64");
  /** Lit pixels catch a dead/black shader; changed pixels catch a frozen one. */
  const compareFrames = ([a, b]) => {
    const decode = async (base64) => {
      const image = new Image();
      image.src = "data:image/png;base64," + base64;
      await image.decode();
      const canvas = document.createElement("canvas");
      canvas.width = image.width;
      canvas.height = image.height;
      const context = canvas.getContext("2d");
      context.drawImage(image, 0, 0);
      return context.getImageData(0, 0, canvas.width, canvas.height).data;
    };
    return (async () => {
      const [one, two] = await Promise.all([decode(a), decode(b)]);
      let lit = 0,
        changed = 0,
        peak = 0;
      for (let index = 0; index < one.length; index += 4) {
        const first = Math.max(one[index], one[index + 1], one[index + 2]),
          second = Math.max(two[index], two[index + 1], two[index + 2]);
        if (first > 12) lit++;
        if (first > peak) peak = first;
        if (Math.abs(first - second) > 15) changed++;
      }
      return { lit, changed, peak, total: one.length / 4 };
    })();
  };
  try {
    await page.goto(`${origin}/cult-flash-harness`);
    await until("scene tools probe", () =>
      page.evaluate(() => Boolean(window.sceneTools)),
    );
    await page.evaluate(() => window.sceneTools.closeDebug());

    // The segment takes the scene lease over (shipped `project: darkness 1`).
    await page.evaluate(() => window.sceneTools.start("cult-world"));
    await until("cult flash mount", () =>
      page
        .locator('[data-story-scene="cult-flash"]')
        .count()
        .then((count) => count === 1),
    );
    assert.equal(await page.evaluate(() => window.sceneTools.state().active), true);
    assert.equal(await page.evaluate(() => window.sceneTools.state().darkness), 1);
    const context = await page.evaluate(() => {
      const canvas = document.querySelector(
        '[data-story-scene="cult-flash"] canvas',
      );
      const gl = canvas.getContext("webgl2");
      // Hold the renderer's own context: dispose() must be able to lose it.
      window.__cultContext = gl;
      return {
        webgl2: gl instanceof WebGL2RenderingContext,
        lost: gl.isContextLost(),
        width: gl.drawingBufferWidth,
        height: gl.drawingBufferHeight,
      };
    });
    assert.equal(context.webgl2, true, "cult flash must be a WebGL2 two-pass scene");
    assert.equal(context.lost, false);
    assert.ok(
      context.width > 1 && context.height > 1,
      `cult canvas must have a real drawing buffer, got ${context.width}x${context.height}`,
    );

    // Two frames inside the timed reveal: the shader must draw and must change.
    const first = await advanceTo(2.5);
    assert.ok(
      Math.abs(first - 2.5 / 7) < 0.05,
      `progress must track the 7s segment clock, got ${first}`,
    );
    const firstFrame = await frame("cult-flash-01.png");
    const second = await advanceTo(5);
    const secondFrame = await frame("cult-flash-02.png");
    const pixels = await page.evaluate(compareFrames, [firstFrame, secondFrame]);
    console.log("Cult flash frames", first, second, pixels);
    assert.ok(
      pixels.lit > 10000,
      `cult flash must light the frame, only ${pixels.lit}/${pixels.total} pixels above black`,
    );
    assert.ok(
      pixels.changed > 20000,
      `cult flash must change across the reveal, only ${pixels.changed} pixels moved`,
    );
    assert.ok(
      second > first,
      "the reveal must keep advancing after the first captured frame",
    );

    // Running out the reveal completes the segment and releases everything.
    await advanceTo(7);
    await page.clock.runFor(2000);
    await until("cult flash completion", () =>
      page
        .evaluate(() => window.sceneTools.completions)
        .then((facts) => facts.length === 1),
    );
    assert.deepEqual(await page.evaluate(() => window.sceneTools.completions), [
      "arg.cult_truth",
    ]);
    await until("cult flash unmount", async () =>
      (await page.locator('[data-story-scene="cult-flash"]').count()) === 0,
    );
    assert.equal(await page.evaluate(() => window.sceneTools.state().active), false);
    assert.equal(
      await page.evaluate(() => window.__cultContext.isContextLost()),
      true,
      "completing the segment must lose its WebGL2 context",
    );

    // A second entry rebuilds the renderer from scratch.
    await page.evaluate(() => window.sceneTools.start("cult-world-2"));
    await until("second cult flash mount", () =>
      page
        .locator('[data-story-scene="cult-flash"]')
        .count()
        .then((count) => count === 1),
    );
    const restarted = await advanceTo(1);
    assert.ok(
      restarted > 0 && restarted < 0.3,
      `a fresh entry restarts the timeline, got ${restarted}`,
    );
    const reentry = await page.evaluate(compareFrames, [
      firstFrame,
      await frame("cult-flash-reentry.png"),
    ]);
    assert.ok(
      reentry.lit > 10000,
      `the second entry must draw, only ${reentry.lit}/${reentry.total} pixels above black`,
    );

    // Cancelling mid-flash unmounts and releases the context without completing.
    const secondContext = await page.evaluate(() => {
      const gl = document
        .querySelector('[data-story-scene="cult-flash"] canvas')
        .getContext("webgl2");
      window.__cultContext = gl;
      return gl.isContextLost();
    });
    assert.equal(secondContext, false);
    await page.evaluate(() => window.sceneTools.cancel());
    await until("cancelled cult flash", async () =>
      (await page.locator('[data-story-scene="cult-flash"]').count()) === 0,
    );
    assert.equal(await page.evaluate(() => window.sceneTools.state().active), false);
    assert.equal(
      await page.evaluate(() => window.__cultContext.isContextLost()),
      true,
      "cancelling must lose the WebGL2 context",
    );
    assert.deepEqual(await page.evaluate(() => window.sceneTools.completions), [
      "arg.cult_truth",
    ]);
    await page.evaluate(() => window.sceneTools.dispose());
    assert.deepEqual(errors, []);
    console.log(
      "Cult flash probe passed: two-pass WebGL2 reveal, live pixels, completion, context release and re-entry",
    );
  } catch (error) {
    console.log("Cult flash probe errors", errors, error);
    await page.screenshot({ path: resolve(output, "cult-flash-failure.png") });
    throw error;
  } finally {
    await page.close();
  }
}
