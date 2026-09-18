import assert from "node:assert/strict";
import { resolve } from "node:path";

export async function verifyDebugLabs(browser, output, baseUrl) {
  const page = await browser.newPage({
    viewport: { width: 1000, height: 800 },
  });
  page.setDefaultTimeout(30000);
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.route("**/debug-labs-harness", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: `<html><head><link rel="stylesheet" href="/styles/app.css"></head><body><div id="root"></div><script type="module">import RefreshRuntime from "/@react-refresh"; RefreshRuntime.injectIntoGlobalHook(window); window.$RefreshReg$=()=>{}; window.$RefreshSig$=()=>type=>type; window.__vite_plugin_react_preamble_installed__=true;</script><script type="module" src="/@fs/${resolve("tests/frontend-debug-harness.tsx")}"></script></body></html>`,
    }),
  );
  try {
    await page.goto(`${baseUrl}/debug-labs-harness`);
    await page.getByRole("heading", { name: "Network lab" }).waitFor();

    await page.getByRole("button", { name: "Severe", exact: true }).click();
    assert.deepEqual(await page.evaluate(() => window.debugLabProbe.profile()), {
      enabled: true,
      log: true,
      minLatencyMs: 200,
      maxLatencyMs: 1000,
      dropIncomingRate: 0.1,
      dropOutgoingRate: 0.1,
      randomDisconnectChance: 0.3,
      randomDisconnectIntervalMs: 5000,
    });
    await page
      .getByRole("button", { name: "Apply & reload", exact: true })
      .click();
    assert.equal(await page.evaluate(() => window.debugLabProbe.reloads()), 1);

    await page.getByRole("button", { name: "Target 1e+6" }).click();
    assert.equal(
      await page.evaluate(() => window.debugLabProbe.idle().compute),
      1e6,
    );
    await page.getByRole("button", { name: "+1h", exact: true }).click();
    assert.equal(
      await page.evaluate(() => window.debugLabProbe.idle().currentEraSeconds),
      3600,
    );
    await page.getByRole("button", { name: "+100", exact: true }).click();
    assert.deepEqual(
      await page.evaluate(() => window.debugLabProbe.idle().factionCoins),
      { elf: 100, angel: 100, goblin: 100, demon: 100 },
    );
    await page.getByRole("button", { name: "Max all", exact: true }).click();
    assert.equal(
      await page.evaluate(() => window.debugLabProbe.idle().productiveClicks),
      50,
    );

    await page
      .getByRole("button", { name: "Run qualifying pat", exact: true })
      .click();
    await page.getByText("Production recognizer completed", { exact: true }).waitFor();
    await page.getByRole("button", { name: "happy", exact: true }).click();
    assert.deepEqual(
      await page.evaluate(() => window.debugLabProbe.reactions),
      ["happy"],
    );
    await page
      .getByRole("button", { name: "Sudden death (both guessers)" })
      .click();
    await page.getByText("Loaded sudden_death_both", { exact: true }).waitFor();
    assert.deepEqual(
      await page.evaluate(() => window.debugLabProbe.scenarios),
      ["sudden_death_both"],
    );
    await page.screenshot({
      path: resolve(output, "debug-labs.png"),
      animations: "disabled",
      fullPage: true,
    });

    await page.reload();
    await page.getByText("Flaky WebSocket profile: severe", { exact: true }).waitFor();
    assert.deepEqual(errors, []);
    await page.evaluate(() => window.debugLabProbe.dispose());
  } finally {
    await page.close();
  }
}
