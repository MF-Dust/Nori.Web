import assert from "node:assert/strict";
import { createServer } from "node:http";
import test from "node:test";
import { build } from "esbuild";
import { chromium } from "playwright";
import { probeLaunchOptions } from "../../scripts/lib/probe_launch.mjs";
import { repoRoot } from "../../scripts/lib/paths.mjs";

// BrowserApp-BM1_j6Y4.js:3815,4344 installs one titlebar slot and portals live tabs into it.
test("Browser portals tabs in normal/maximized windows, updates without publication loops, and clears on unmount", async (t) => {
  const compiled = await build({
    absWorkingDir: repoRoot,
    entryPoints: ["tests/frontend/harness/frontend-browser-titlebar.tsx"],
    bundle: true, write: false, outfile: "fixture.js", format: "esm", jsx: "automatic",
    define: { "process.env.NODE_ENV": '"production"' },
  });
  const script = compiled.outputFiles.find(file => file.path.endsWith(".js")).contents;
  const server = createServer((request, response) => {
    if (request.url === "/fixture.js") {
      response.setHeader("Content-Type", "text/javascript");
      response.end(script);
    } else {
      response.setHeader("Content-Type", "text/html");
      response.end('<!doctype html><div id="root"></div><script type="module" src="/fixture.js"></script>');
    }
  });
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const browser = await chromium.launch(probeLaunchOptions());
  t.after(() => browser.close());
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  const titlebarTabs = page.locator("#titlebar [data-tab-id]");
  await titlebarTabs.first().waitFor();
  assert.equal(await page.locator("#content [data-tab-id]").count(), 0, "normal windows must not have an extra tab row");
  const publications = await page.evaluate(() => window.fixture.metrics.publishes);

  await page.locator('#titlebar button[aria-label="browser.newTab"]').click();
  await page.waitForFunction(() => document.querySelectorAll("#titlebar [data-tab-id]").length === 2);
  await titlebarTabs.first().dblclick();
  assert.equal(await page.evaluate(() => window.fixture.metrics.titlebarMouseDowns), 0, "tabs must not start titlebar dragging");
  assert.equal(await page.evaluate(() => window.fixture.metrics.titlebarDoubleClicks), 0, "tabs must not maximize the window");
  await page.locator('#titlebar button[aria-label="browser.closeTab"]').first().click();
  await page.waitForFunction(() => document.querySelectorAll("#titlebar [data-tab-id]").length === 1);

  for (const maximized of [true, false]) {
    await page.evaluate(value => window.fixture.maximize(value), maximized);
    await page.evaluate(() => window.fixture.rerender());
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    assert.equal(await titlebarTabs.count(), 1);
    assert.equal(await page.locator("#content [data-tab-id]").count(), 0);
    assert.equal(await page.evaluate(() => window.fixture.metrics.publishes), publications, "tab changes, maximize, and recreated context/translate wrappers must not republish the slot");
  }

  await page.evaluate(() => window.fixture.title("浏览器"));
  await page.waitForFunction(() => document.querySelector("#titlebar").textContent.includes("浏览器"));
  assert.equal(await titlebarTabs.count(), 1, "translated title replacement must reconnect the portal");
  await page.evaluate(() => window.fixture.mounted(false));
  await page.waitForFunction(() => document.querySelector("#titlebar").childElementCount === 0);
  assert.equal(await page.locator("[data-tab-id]").count(), 0);
  assert.equal(await page.evaluate(() => window.fixture.metrics.clears), 2, "cleanup runs for title replacement and final unmount, not every tab update");

  await page.evaluate(() => { window.fixture.presentation(false); window.fixture.mounted(true); });
  await page.locator("#content [data-tab-id]").waitFor();
  assert.equal(await titlebarTabs.count(), 0, "standalone rendering retains the in-content fallback only without titlebar context");
  assert.deepEqual(errors, []);
});
