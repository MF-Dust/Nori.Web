import assert from "node:assert/strict";
import { resolve } from "node:path";

const harnessHtml = () =>
  `<html><head><link rel="stylesheet" href="/styles/app.css"></head><body><div id="root"></div><script type="module">import RefreshRuntime from "/@react-refresh"; RefreshRuntime.injectIntoGlobalHook(window); window.$RefreshReg$=()=>{}; window.$RefreshSig$=()=>type=>type; window.__vite_plugin_react_preamble_installed__=true;</script><script type="module" src="/@fs/${resolve("tests/frontend-debug-harness.tsx")}"></script></body></html>`;

async function openHarness(browser, baseUrl, assetRoute) {
  const page = await browser.newPage({
    viewport: { width: 1000, height: 800 },
  });
  page.setDefaultTimeout(60000);
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  if (assetRoute) await page.route("**/datasea/cosmicweb.min.glb", assetRoute);
  await page.route("**/debug-labs-harness", (route) =>
    route.fulfill({ contentType: "text/html", body: harnessHtml() }),
  );
  await page.goto(`${baseUrl}/debug-labs-harness`);
  await page
    .getByRole("button", { name: "Network lab", exact: true })
    .waitFor();
  return { page, errors };
}

export async function verifyDebugLabs(browser, output, baseUrl) {
  const { page, errors } = await openHarness(browser, baseUrl);
  try {
    await page
      .getByRole("button", { name: "Network lab", exact: true })
      .click();
    await page.getByRole("button", { name: "Severe", exact: true }).click();
    assert.deepEqual(
      await page.evaluate(() => window.debugLabProbe.profile()),
      {
        enabled: true,
        log: true,
        minLatencyMs: 200,
        maxLatencyMs: 1000,
        dropIncomingRate: 0.1,
        dropOutgoingRate: 0.1,
        randomDisconnectChance: 0.3,
        randomDisconnectIntervalMs: 5000,
      },
    );

    await page
      .getByRole("button", { name: "Compute lab", exact: true })
      .click();
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
      .getByRole("button", { name: "Gesture lab", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Run qualifying pat", exact: true })
      .click();
    await page
      .getByText("Production recognizer completed", { exact: true })
      .waitFor();

    await page
      .getByRole("button", { name: "Reaction lab", exact: true })
      .click();
    await page.getByRole("button", { name: "happy", exact: true }).click();
    assert.equal(
      await page.evaluate(() => window.debugLabProbe.scene().noriExpression),
      "13_Happy",
    );
    await page.getByRole("button", { name: "Scene", exact: true }).click();
    await page.getByLabel("Camera x", { exact: true }).fill("2");
    await page.waitForTimeout(3_200);
    assert.equal(
      await page.evaluate(() => window.debugLabProbe.scene().camera?.x),
      2,
      "a stale reaction timer released a later scene override",
    );

    await page
      .getByRole("button", { name: "Game scenarios", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Sudden death (both guessers)" })
      .click();
    await page.getByText("Loaded sudden_death_both", { exact: true }).waitFor();
    assert.deepEqual(
      await page.evaluate(() => window.debugLabProbe.scenarios),
      ["sudden_death_both"],
    );

    await page
      .getByRole("button", { name: "Shatter tuner", exact: true })
      .click();
    await page.locator("[data-shatter-preview]").waitFor();
    await page.getByLabel("Shatter preview progress").evaluate((element) => {
      const setter = Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        "value",
      ).set;
      setter.call(element, "0.72");
      element.dispatchEvent(new Event("input", { bubbles: true }));
      element.dispatchEvent(new Event("change", { bubbles: true }));
    });
    assert.equal(
      await page.getByLabel("Shatter preview progress").inputValue(),
      "0.72",
    );
    await page.getByLabel("Shatter glitch", { exact: true }).fill("0.5");
    assert.equal(
      await page.getByLabel("Shatter glitch", { exact: true }).inputValue(),
      "0.5",
    );
    await page.evaluate(() => window.debugLabProbe.takeover());
    await page
      .getByText("Production story active; preview released.", { exact: true })
      .waitFor();
    await page.evaluate(() => window.debugLabProbe.releaseTakeover());

    await page
      .getByRole("button", { name: "Datasea tuner", exact: true })
      .click();
    await page.getByText("Datasea renderer: ready", { exact: true }).waitFor();
    await page.getByLabel("Datasea phase").selectOption("cosmic");
    await page.getByLabel("Datasea Scene time").fill("42");
    assert.equal(
      await page.getByLabel("Datasea Scene time").inputValue(),
      "42",
    );
    await page.screenshot({
      path: resolve(output, "debug-labs.png"),
      animations: "disabled",
      fullPage: true,
    });
    await page.evaluate(() => window.debugLabProbe.takeover());
    await page
      .getByText("Production story active; preview released.", { exact: true })
      .waitFor();
    await page.evaluate(() => window.debugLabProbe.releaseTakeover());

    await page.reload();
    await page
      .getByRole("button", { name: "Network lab", exact: true })
      .click();
    await page
      .getByText("Flaky WebSocket profile: severe", { exact: true })
      .waitFor();
    assert.deepEqual(errors, []);
  } finally {
    await page.close();
  }

  let assetMode = "abort";
  const failed = await openHarness(browser, baseUrl, (route) =>
    assetMode === "abort" ? route.abort() : route.continue(),
  );
  try {
    await failed.page
      .getByRole("button", { name: "Datasea tuner", exact: true })
      .click();
    await failed.page
      .getByRole("button", { name: "Retry Datasea preview" })
      .waitFor();
    assetMode = "continue";
    await failed.page
      .getByRole("button", { name: "Retry Datasea preview" })
      .click();
    await failed.page
      .getByText("Datasea renderer: ready", { exact: true })
      .waitFor();
    await failed.page.evaluate(() => window.debugLabProbe.unmountTuners());
    await failed.page.locator("canvas").waitFor({ state: "detached" });
    assert.deepEqual(failed.errors, []);
  } finally {
    await failed.page.close();
  }
}
