import assert from "node:assert/strict";
import { resolve } from "node:path";

const transparentPng = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "base64",
);

export async function verifyMessenger(browser, output) {
  const page = await browser.newPage({ viewport: { width: 980, height: 700 } });
  page.setDefaultTimeout(20000);
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.route("**/messenger-good.png", (route) =>
    route.fulfill({ contentType: "image/png", body: transparentPng }),
  );
  await page.route("**/messenger-missing.png", (route) =>
    route.abort("failed"),
  );
  await page.route("**/messenger-harness*", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: `<html class="dark theme-nori"><body style="margin:0;background:#161a1e"><div id="root" style="width:100vw;height:100dvh"></div><script type="module">import RefreshRuntime from "/@react-refresh"; RefreshRuntime.injectIntoGlobalHook(window); window.$RefreshReg$=()=>{}; window.$RefreshSig$=()=>type=>type; window.__vite_plugin_react_preamble_installed__=true;</script><script type="module" src="/@fs/${resolve("tests/frontend-messenger-harness.tsx")}"></script></body></html>`,
    }),
  );

  try {
    await page.goto("http://127.0.0.1:47174/messenger-harness");
    const search = page.getByRole("textbox", { name: "Search", exact: true });
    await search.fill("searchable final");
    await page.getByRole("button", { name: /Quiet Thread/ }).waitFor();
    await search.fill("absent thread");
    await page
      .getByText("No results for “absent thread”", { exact: true })
      .waitFor();
    await page
      .getByRole("button", { name: "Clear search", exact: true })
      .click();
    await page.getByRole("button", { name: /Fixture Service/ }).click();

    const viewport = page.locator(".flex-1.overflow-y-auto.px-4.py-3");
    await viewport.evaluate((node) => {
      node.scrollTop = 0;
      node.dispatchEvent(new Event("scroll", { bubbles: true }));
    });
    await page.waitForFunction(
      () =>
        document.querySelector(".flex-1.overflow-y-auto.px-4.py-3")
          ?.scrollTop === 0,
    );
    const scrollBefore = await viewport.evaluate((node) => node.scrollTop);
    await page.evaluate(() => window.messengerProbe.appendMessage());
    await page.waitForFunction(() =>
      document.body.textContent.includes("Newest fixture message"),
    );
    assert.equal(
      await viewport.evaluate((node) => node.scrollTop),
      scrollBefore,
      "a reader who scrolled up must not be pulled to the newest message",
    );

    await page
      .getByRole("img", { name: "Broken fixture photo", exact: true })
      .waitFor();
    const photo = page
      .getByRole("button", { name: "View photo", exact: true })
      .first();
    await photo.click();
    const dialog = page.getByRole("dialog", {
      name: "View photo",
      exact: true,
    });
    await dialog.waitFor();
    assert.equal(
      await dialog.evaluate((node) => document.activeElement === node),
      true,
    );
    await page.keyboard.press("Escape");
    await dialog.waitFor({ state: "detached" });
    assert.equal(
      await photo.evaluate((node) => document.activeElement === node),
      true,
    );

    const serviceInput = page.getByRole("textbox", {
      name: "Message service account",
      exact: true,
    });
    await serviceInput.fill("composing");
    await serviceInput.dispatchEvent("compositionstart");
    await serviceInput.press("Enter");
    assert.deepEqual(
      await page.evaluate(() => window.messengerProbe.serviceSends),
      [],
    );
    await serviceInput.dispatchEvent("compositionend");
    await serviceInput.fill("fail");
    await serviceInput.press("Enter");
    await page.waitForTimeout(120);
    assert.equal(await serviceInput.inputValue(), "fail");
    assert.equal(
      await serviceInput.evaluate((node) => document.activeElement === node),
      true,
    );

    const failedDownload = page.getByRole("button", {
      name: "Download attachment",
      exact: true,
    });
    await failedDownload.click();
    await page.waitForTimeout(1900);
    await failedDownload.click();
    await page.waitForTimeout(1900);
    assert.deepEqual(
      await page.evaluate(() => window.messengerProbe.downloads),
      ["download.fail", "download.fail"],
    );
    await page.screenshot({ path: resolve(output, "messenger.png") });

    await page.goto("http://127.0.0.1:47174/messenger-harness?mode=floating");
    const input = page.getByRole("textbox", { name: "Message", exact: true });
    await input.fill("composing");
    await input.dispatchEvent("compositionstart");
    await input.press("Enter");
    assert.deepEqual(
      await page.evaluate(() => window.messengerProbe.floatingSends),
      [],
    );
    await input.dispatchEvent("compositionend");
    await input.fill("fail");
    await input.press("Enter");
    await page.waitForTimeout(120);
    assert.equal(await input.inputValue(), "fail");
    await input.fill("🌱".repeat(105));
    assert.equal(await input.getAttribute("maxlength"), "100");
    const boundedInput = await input.inputValue();
    assert.equal(boundedInput.length, 100);
    assert.equal(Array.from(boundedInput).length, 50);
    await page.evaluate(() => window.messengerProbe.showFloatingLines());
    await page.locator(".conversation-bubble").first().waitFor();
    await page.setViewportSize({ width: 390, height: 260 });
    const panel = await page.locator(".conversation-panel").boundingBox();
    assert.ok(
      panel.y >= 0 && panel.y + panel.height <= 260,
      "floating chat must fit a short viewport",
    );
    await page.screenshot({
      path: resolve(output, "conversation-short-viewport.png"),
    });

    assert.deepEqual(errors, []);
    console.log(
      "Messenger probe passed: search, scroll hold, media failure, preview focus, IME, failed-send retry, attachment retry and short floating layout.",
    );
  } catch (error) {
    console.error(
      "Messenger probe errors",
      errors,
      await page.locator("body").innerText(),
    );
    await page.screenshot({ path: resolve(output, "messenger-failure.png") });
    throw error;
  } finally {
    await page.close();
  }
}
