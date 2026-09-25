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

async function waitForDataseaReady(page) {
  const ready = page.getByText("Datasea renderer: ready", { exact: true });
  const failure = page.getByText(/^Datasea preview failed:/);
  const failureText = await Promise.race([
    ready.waitFor().then(() => null),
    failure.waitFor().then(() => failure.innerText()),
  ]);
  if (failureText) throw new Error(failureText);
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
      ["codenames:sudden_death_both"],
    );

    await page.getByRole("button", { name: "Live2D", exact: true }).click();
    const physics = page.getByRole("button", { name: "Physics", exact: true });
    assert.equal(await physics.getAttribute("aria-pressed"), "true");
    await physics.click();
    assert.equal(
      await page.evaluate(() => window.debugLabProbe.live2d().plugins.physics),
      false,
    );
    await page.getByRole("button", { name: "Rest Pose", exact: true }).click();
    assert.equal(await page.evaluate(() => window.debugLabProbe.live2d().rest), true);
    await page.getByRole("button", { name: "13_Happy", exact: true }).click();
    assert.deepEqual(
      await page.evaluate(() => window.debugLabProbe.live2d().expressions),
      ["13_Happy"],
    );
    await page.getByRole("button", { name: "Play Idle 0", exact: true }).click();
    assert.equal(
      await page.evaluate(() => window.debugLabProbe.live2d().motions.length),
      1,
    );

    const live2dPanel = page.locator('section[aria-label="Live2D debug"]');
    await live2dPanel
      .getByRole("button", { name: "Glitch", exact: true })
      .click();
    assert.equal(
      await page.evaluate(
        () => window.debugLabProbe.live2d().tuning.idleStateOverride,
      ),
      "glitch",
    );
    await page.getByLabel("Sleep fade-in", { exact: true }).evaluate((element) => {
      const setter = Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        "value",
      ).set;
      setter.call(element, "2.5");
      element.dispatchEvent(new Event("input", { bubbles: true }));
      element.dispatchEvent(new Event("change", { bubbles: true }));
    });
    assert.equal(
      await page.evaluate(() => window.debugLabProbe.live2d().tuning.sleepFadeIn),
      2.5,
    );
    await page
      .getByLabel("Intensity (mouth-open gain)", { exact: true })
      .evaluate((element) => {
        const setter = Object.getOwnPropertyDescriptor(
          HTMLInputElement.prototype,
          "value",
        ).set;
        setter.call(element, "0.85");
        element.dispatchEvent(new Event("input", { bubbles: true }));
        element.dispatchEvent(new Event("change", { bubbles: true }));
      });
    assert.equal(
      await page.evaluate(() => window.debugLabProbe.live2d().tuning.lipIntensity),
      0.85,
    );
    await page.getByLabel("Mouth form: constant mode", { exact: true }).check();
    await page.getByLabel("Mouth form (constant)", { exact: true }).evaluate((element) => {
      const setter = Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        "value",
      ).set;
      setter.call(element, "-0.4");
      element.dispatchEvent(new Event("input", { bubbles: true }));
      element.dispatchEvent(new Event("change", { bubbles: true }));
    });
    assert.equal(
      await page.evaluate(
        () => window.debugLabProbe.live2d().tuning.lipFormConstant,
      ),
      -0.4,
    );
    await page
      .getByLabel("13_Happy lip-sync share", { exact: true })
      .evaluate((element) => {
        const setter = Object.getOwnPropertyDescriptor(
          HTMLInputElement.prototype,
          "value",
        ).set;
        setter.call(element, "0.8");
        element.dispatchEvent(new Event("input", { bubbles: true }));
        element.dispatchEvent(new Event("change", { bubbles: true }));
      });
    assert.equal(
      await page.evaluate(
        () => window.debugLabProbe.live2d().tuning.expressionBlends["13_Happy"],
      ),
      0.8,
    );
    await live2dPanel
      .getByRole("button", { name: "▶ Sleep", exact: true })
      .click();
    assert.deepEqual(
      await page.evaluate(() => window.debugLabProbe.live2d().motions.at(-1)),
      {
        steps: { group: "Idle", index: 1, loop: true, fadeIn: 2.5 },
      },
    );

    await page.getByRole("button", { name: "Pat", exact: true }).click();
    await page.getByLabel("Pat Required pat time").evaluate((element) => {
      const setter = Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        "value",
      ).set;
      setter.call(element, "500");
      element.dispatchEvent(new Event("input", { bubbles: true }));
      element.dispatchEvent(new Event("change", { bubbles: true }));
    });
    assert.equal(await page.getByLabel("Pat Required pat time").inputValue(), "500");

    await page.getByRole("button", { name: "Reactions", exact: true }).click();
    await page
      .getByRole("button", { name: "Player guesses correctly", exact: true })
      .click();
    await page
      .getByText("Player guesses correctly: No Live2D model mounted", { exact: true })
      .waitFor();

    await page.getByRole("button", { name: "Inject Talk", exact: true }).click();
    await page
      .getByText(/does not implement debug\.chat_inject_talk\.request/)
      .waitFor();
    await page.getByRole("button", { name: "Nori Context", exact: true }).click();
    await page
      .getByText(/does not implement debug\.chat_context\.stats/)
      .waitFor();
    await page.getByRole("button", { name: "Notifications", exact: true }).click();
    assert.equal(
      await page.getByRole("button", { name: "Push from server", exact: true }).isDisabled(),
      true,
    );
    await page.getByRole("button", { name: "Audio", exact: true }).click();
    await page.getByLabel("Master", { exact: true }).evaluate((element) => {
      const setter = Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        "value",
      ).set;
      setter.call(element, "65");
      element.dispatchEvent(new Event("input", { bubbles: true }));
      element.dispatchEvent(new Event("change", { bubbles: true }));
    });
    assert.equal(
      await page.evaluate(() => window.debugLabProbe.audio().masterVolume),
      65,
    );
    await page
      .getByRole("button", { name: "Game scenarios", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Acting forks Counterpart", exact: true })
      .click();
    await page
      .getByText("Loaded acting-forked-counterpart", { exact: true })
      .waitFor();
    await page
      .getByRole("button", { name: "Attack phase", exact: true })
      .click();
    await page.getByText("Loaded attack-phase", { exact: true }).waitFor();
    assert.deepEqual(
      await page.evaluate(() => window.debugLabProbe.scenarios),
      [
        "codenames:sudden_death_both",
        "chess:acting-forked-counterpart",
        "cakeduel:attack-phase",
      ],
    );

    await page.getByRole("button", { name: "Glitch", exact: true }).click();
    await page.getByRole("button", { name: "Slam", exact: true }).click();
    assert.equal(await page.getByLabel("Glitch Max shift").inputValue(), "90");
    await page.getByRole("button", { name: "Start", exact: true }).click();
    await page.waitForFunction(() =>
      document.documentElement.style.filter.includes("nori-corruption-glitch"),
    );
    await page.getByRole("button", { name: "Stop", exact: true }).click();
    assert.equal(
      await page.evaluate(() => document.documentElement.style.filter),
      "",
      "stopping the production glitch must restore the page filter",
    );
    await page.getByRole("button", { name: "Start", exact: true }).click();
    await page.evaluate(() => window.debugLabProbe.takeover());
    await page
      .getByText("Production story active; glitch released.", { exact: true })
      .waitFor();
    assert.equal(
      await page.evaluate(() => document.documentElement.style.filter),
      "",
      "story takeover must release the production glitch",
    );
    await page.evaluate(() => window.debugLabProbe.releaseTakeover());
    await page.getByRole("button", { name: "Start", exact: true }).click();
    await page.waitForFunction(() =>
      document.documentElement.style.filter.includes("nori-corruption-glitch"),
    );
    await page
      .getByRole("button", { name: "Connection", exact: true })
      .click();
    await page.waitForFunction(() => document.documentElement.style.filter === "");
    assert.equal(
      await page.evaluate(() => document.documentElement.style.filter),
      "",
      "leaving the Glitch tab must dispose the whole-page filter",
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
    await waitForDataseaReady(page);
    await page.getByLabel("Datasea phase").selectOption("cosmic");
    await page.getByLabel("Datasea Scene time").fill("42");
    assert.equal(
      await page.getByLabel("Datasea Scene time").inputValue(),
      "42",
    );
    await page.getByLabel("Datasea Bloom", { exact: true }).fill("99");
    assert.equal(
      await page.getByLabel("Datasea Bloom", { exact: true }).inputValue(),
      "1.5",
      "Datasea material controls must enforce renderer ranges",
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
  } catch (error) {
    await page.screenshot({
      path: resolve(output, "debug-labs-failure.png"),
      animations: "disabled",
      fullPage: true,
    });
    throw error;
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
    await waitForDataseaReady(failed.page);
    await failed.page.evaluate(() => window.debugLabProbe.unmountTuners());
    await failed.page.locator("canvas").waitFor({ state: "detached" });
    assert.deepEqual(failed.errors, []);
  } finally {
    await failed.page.close();
  }
}
