import assert from "node:assert/strict";
import { resolve } from "node:path";

const SHAPES = ["circle", "chubby", "spiky", "nori"];

/**
 * The four shipped ribbon shapes, through the same view IdleScreen mounts.
 * Each shape must draw, keep changing while the Pixi ticker runs, and leave
 * no canvas behind when the view unmounts.
 */
export async function verifyIdleRibbon(browser, output, origin) {
  const page = await browser.newPage({ viewport: { width: 900, height: 700 } });
  page.setDefaultTimeout(30000);
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error" || message.type() === "warning")
      errors.push(`${message.type()}: ${message.text()}`);
  });
  page.on("requestfailed", (request) => errors.push(`failed ${request.url()}`));
  await page.route("**/idle-ribbon-harness", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: `<html><body style="margin:0;background:#000"><div id="root"></div><script type="module">import RefreshRuntime from "/@react-refresh";RefreshRuntime.injectIntoGlobalHook(window);window.$RefreshReg$=()=>{};window.$RefreshSig$=()=>type=>type;window.__vite_plugin_react_preamble_installed__=true;</script><script type="module" src="/@fs/${resolve("tests/frontend/harness/frontend-idle-ribbon-harness.tsx")}"></script></body></html>`,
    }),
  );
  const shot = async (name) => {
    const buffer = await page.screenshot({
      path: name ? resolve(output, name) : undefined,
      caret: "hide",
    });
    return buffer.toString("base64");
  };
  try {
    await page.goto(`${origin}/idle-ribbon-harness`);
    await page.waitForFunction(() => document.querySelector("canvas"));
    const frames = [];
    for (const shape of SHAPES) {
      await page.evaluate((next) => window.idleRibbonProbe.setShape(next), shape);
      await page.waitForFunction(
        (next) => window.idleRibbonProbe.shape === next && document.querySelector("canvas"),
        shape,
      );
      await page.waitForTimeout(800);
      await page.evaluate(() => window.idleRibbonProbe.setSteps(120));
      await page.waitForTimeout(400);
      const early = await shot();
      await page.evaluate(() => window.idleRibbonProbe.setSteps(620));
      await page.waitForTimeout(400);
      const grown = await shot(`idle-ribbon-${shape}.png`);
      if (early === grown) {
        const info = await page.evaluate(() => ({
          canvases: [...document.querySelectorAll("canvas")].map((canvas) => ({
            width: canvas.width,
            height: canvas.height,
            layout: canvas.getBoundingClientRect().toJSON(),
          })),
        }));
        assert.notEqual(
          early,
          grown,
          `${shape} did not redraw. canvas=${JSON.stringify(info)} log=${errors.join(" | ")}`,
        );
      }
      frames.push(grown);
    }
    assert.equal(new Set(frames).size, SHAPES.length, "the four shapes must not render the same frame");
    await page.evaluate(() => window.idleRibbonProbe.setMounted(false));
    await page.waitForFunction(() => document.querySelectorAll("canvas").length === 0);
    const unexpected = errors.filter((line) => !line.includes("vite") && !line.includes("WebSocket"));
    assert.deepEqual(unexpected, []);
    console.log("Idle ribbon probe passed: four shapes draw, tick, and release");
  } finally {
    await page.close();
  }
}
