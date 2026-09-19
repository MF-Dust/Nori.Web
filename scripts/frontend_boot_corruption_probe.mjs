import assert from "node:assert/strict";
import { resolve } from "node:path";

export async function verifyBootCorruption(
  browser,
  output,
  origin = "http://127.0.0.1:47175",
) {
  const page = await browser.newPage({
      viewport: { width: 1100, height: 800 },
    }),
    errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (
      message.type() === "error" &&
      /Shader Error|VALIDATE_STATUS|ReferenceError|TypeError/.test(
        message.text(),
      )
    )
      errors.push(message.text());
  });
  const time = Date.now();
  await page.clock.install({ time });
  await page.clock.pauseAt(time + 1000);
  let failOcean = false;
  // Register before the successful load, so decoded-image cache cannot bypass
  // the subsequent failure injection.
  await page.route("**/ocean/gradient-noise.jpg", (route) =>
    failOcean ? route.abort() : route.continue(),
  );
  await page.route("**/boot-corruption-harness", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: `<html><link rel="stylesheet" href="/styles/app.css"><body style="margin:0;background:#161a1e"><div id="root"></div><script src="/cubism_sdk/Core/live2dcubismcore.js"></script><script type="module">import RefreshRuntime from "/@react-refresh"; RefreshRuntime.injectIntoGlobalHook(window); window.$RefreshReg$=()=>{}; window.$RefreshSig$=()=>type=>type; window.__vite_plugin_react_preamble_installed__=true;</script><script type="module" src="/@fs/${resolve("tests/frontend-boot-corruption-harness.tsx")}"></script></body></html>`,
    }),
  );
  const until = async (predicate, label) => {
    const deadline = Date.now() + 90000;
    do {
      await page.clock.runFor(40);
      if (await page.evaluate(predicate)) return;
    } while (Date.now() < deadline);
    assert.fail(label);
  };
  try {
    await page.goto(origin + "/boot-corruption-harness");
    await until(
      () =>
        document.querySelector(".nori-stage")?.dataset.live2dStatus === "ready",
      "model load",
    );
    await page.evaluate(() => window.storyProbe.start("boot"));
    await until(
      () => document.querySelector(".nori-stage")?.dataset.coldOpen === "ready",
      "cold resources",
    );
    await page.clock.fastForward(11800);
    await page.clock.runFor(40);
    await page.screenshot({ path: resolve(output, "boot-fracture.png") });
    await page.clock.fastForward(2400);
    await page.clock.runFor(40);
    await page.screenshot({ path: resolve(output, "boot-shatter-dive.png") });
    await page.clock.fastForward(33000);
    await page.clock.runFor(40);
    assert.equal(
      await page
        .locator('[data-story-scene="boot"]')
        .getAttribute("data-phase"),
      "ready",
    );
    assert.deepEqual(
      await page.evaluate(() => window.storyProbe.completions),
      [],
    );
    await page.screenshot({ path: resolve(output, "boot-wake-gate.png") });
    // Compare rendered pixels with only the actor coverage toggled, catching a
    // backward-facing camera even when timeline and wake button both work.
    await page.evaluate(() => window.storyProbe.actorCapture(false));
    await page.clock.runFor(40);
    const withActor = (await page.screenshot()).toString("base64");
    await page.evaluate(() => window.storyProbe.actorCapture(true));
    await page.clock.runFor(40);
    const withoutActor = (await page.screenshot()).toString("base64");
    const actorPixels = await page.evaluate(
      async ([a, b]) => {
        const decode = async (base64) => {
          const image = new Image();
          image.src = "data:image/png;base64," + base64;
          await image.decode();
          const canvas = document.createElement("canvas");
          canvas.width = image.width;
          canvas.height = image.height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(image, 0, 0);
          return ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        };
        const [one, two] = await Promise.all([decode(a), decode(b)]);
        let changed = 0;
        for (let i = 0; i < one.length; i += 4)
          if (
            Math.max(
              Math.abs(one[i] - two[i]),
              Math.abs(one[i + 1] - two[i + 1]),
              Math.abs(one[i + 2] - two[i + 2]),
            ) > 15
          )
            changed++;
        return changed;
      },
      [withActor, withoutActor],
    );
    assert.ok(
      actorPixels > 5000,
      `wake actor must occupy rendered pixels; changed ${actorPixels}`,
    );
    await page.evaluate(() => window.storyProbe.actorCapture(null));
    await page.clock.runFor(40);
    await page.clock.fastForward(100000);
    assert.deepEqual(
      await page.evaluate(() => window.storyProbe.completions),
      [],
    );
    await page.getByRole("button", { name: "Wake Nori", exact: true }).click();
    await page.clock.fastForward(3600);
    await page.clock.runFor(40);
    assert.deepEqual(await page.evaluate(() => window.storyProbe.completions), [
      "boot.completed",
    ]);
    await page.clock.fastForward(1600);
    await page.clock.runFor(40);
    assert.equal(
      await page.evaluate(() => window.storyProbe.state().active),
      false,
    );

    failOcean = true;
    await page.evaluate(() => window.storyProbe.start("boot"));
    await until(
      () =>
        Boolean(
          document.querySelector('[data-story-scene="boot"] [role="alert"]'),
        ),
      "Boot resource failure must offer retry",
    );
    assert.equal(
      await page.evaluate(() => window.storyProbe.state().active),
      false,
    );
    failOcean = false;
    await page.getByRole("button", { name: "Retry", exact: true }).click();
    await until(
      () => document.querySelector(".nori-stage")?.dataset.coldOpen === "ready",
      "Boot retry must create fresh resources",
    );
    await page.evaluate(() => window.storyProbe.cancel());
    await page.clock.runFor(40);
    assert.deepEqual(await page.evaluate(() => window.storyProbe.completions), [
      "boot.completed",
    ]);

    await page.evaluate(() =>
      window.storyProbe.start("nori-corruption-climax"),
    );
    await page.clock.runFor(1200);
    assert.equal(await page.evaluate(() => window.storyProbe.minimized()), 1);
    assert.equal(
      await page
        .locator('[data-story-scene="nori-corruption-climax"]')
        .getAttribute("data-phase"),
      "awaitVoice",
    );
    await page.evaluate(() => window.storyProbe.visibility(true));
    await page.clock.fastForward(20000);
    assert.equal(
      await page
        .locator('[data-story-scene="nori-corruption-climax"]')
        .getAttribute("data-phase"),
      "awaitVoice",
    );
    await page.evaluate(() => {
      window.storyProbe.visibility(false);
      window.storyProbe.voiceDone();
    });
    await page.clock.fastForward(7300);
    await page.clock.runFor(40);
    await page.screenshot({
      path: resolve(output, "corruption-entry-console.png"),
    });
    await page.clock.fastForward(4000);
    await page.clock.runFor(40);
    assert.equal(await page.locator("[data-antivirus-game]").count(), 6);
    assert.ok(
      (await page.evaluate(() => window.storyProbe.events)).some(
        (e) =>
          e[0] === "nori_talk.request" && e[1].talkId === "corruption_scare",
      ),
    );
    await page.screenshot({
      path: resolve(output, "corruption-production-qte.png"),
    });
    await page.evaluate(() => window.storyProbe.cancel());
    await page.clock.runFor(40);
    assert.equal(await page.locator("[data-antivirus-game]").count(), 0);
    assert.equal(
      await page.evaluate(() => window.storyProbe.state().active),
      false,
    );
    assert.deepEqual(await page.evaluate(() => window.storyProbe.completions), [
      "boot.completed",
    ]);
    await page.evaluate(() => window.storyProbe.unmount());
    assert.deepEqual(errors, []);
    console.log(
      "Boot/Corruption production probe: fracture, dive, wake completion, request, voice gate, QTE and cancellation passed",
    );
  } finally {
    await page.close();
  }
}
