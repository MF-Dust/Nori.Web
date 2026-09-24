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
    await page.getByLabel("1 unread", { exact: true }).waitFor();
    const emptyIcon = page.locator("[data-signal-empty-icon] .dock-ic");
    await emptyIcon.waitFor();
    const emptyIconMetrics = await emptyIcon.evaluate((node) => {
      const rect = node.getBoundingClientRect();
      const parent = node.parentElement?.getBoundingClientRect();
      return { width: rect.width, parentWidth: parent?.width ?? 0 };
    });
    assert.ok(
      Math.abs(emptyIconMetrics.width / emptyIconMetrics.parentWidth - 0.88) < 0.01,
      "Signal empty-state icon must use the shipped static AppIcon 88% fill",
    );

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
    const zeroCountThread = page.getByRole("button", { name: /Zero Count Thread/ });
    await zeroCountThread.click();
    assert.deepEqual(
      await page.evaluate(() => window.messengerProbe.readThreads),
      ["zero-count"],
      "a pending read fact must persist even when its unread window contains zero messages",
    );

    await page.getByRole("button", { name: /Fixture Service/ }).click();

    const avatarButton = page
      .locator('button.rounded-full:has(> img.rounded-full)')
      .first();
    await avatarButton.waitFor();
    await avatarButton.hover();
    await page.waitForFunction(
      (node) => Math.abs(Number.parseFloat(getComputedStyle(node).opacity) - 0.9) < 0.001,
      await avatarButton.elementHandle(),
    );
    assert.ok(
      Math.abs(
        Number.parseFloat(
          await avatarButton.evaluate((node) => getComputedStyle(node).opacity),
        ) - 0.9,
      ) < 0.001,
      "photo avatar hover opacity must match the shipped Messenger surface",
    );

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

    const quietThread = page.getByRole("button", { name: /Quiet Thread/ });
    await quietThread.click();
    assert.deepEqual(
      await page.evaluate(() => window.messengerProbe.readThreads),
      ["zero-count", "quiet"],
      "initial unread thread must dispatch signal.read exactly once",
    );
    await page.getByLabel("1 unread", { exact: true }).waitFor({ state: "detached" });
    await page.evaluate(() => window.messengerProbe.triggerQuietReread());
    await page.getByLabel("1 unread", { exact: true }).waitFor();
    await quietThread.click();
    await page.getByLabel("1 unread", { exact: true }).waitFor({ state: "detached" });
    assert.deepEqual(
      await page.evaluate(() => window.messengerProbe.readThreads),
      ["zero-count", "quiet", "quiet"],
      "reread window must become unread after its trigger and clear through signal.read",
    );

    const sealedSend = page.getByRole("button", { name: "Send", exact: true });
    await sealedSend.click();
    const alert = page.getByRole("alert");
    await alert.waitFor();
    const alertAnimation = await alert.evaluate((node) => {
      const style = getComputedStyle(node);
      return {
        name: style.animationName,
        duration: style.animationDuration,
        timing: style.animationTimingFunction,
      };
    });
    assert.equal(alertAnimation.name, "messenger-sealed-error-enter");
    assert.equal(alertAnimation.duration, "0.18s");
    assert.ok(
      alertAnimation.timing.includes("0.32") &&
        alertAnimation.timing.includes("0.72"),
      "sealed composer alert must use the shipped easing curve",
    );

    const detailsButton = page.getByRole("button", {
      name: "Details",
      exact: true,
    });
    await detailsButton.click();
    const details = alert.locator("pre");
    await details.waitFor();
    await page.waitForFunction(
      () =>
        document.querySelector("pre[data-messenger-sealed-details-state]")?.dataset
          .messengerSealedDetailsState === "open",
    );
    assert.equal(
      await details.evaluate(
        (node) => node.dataset.messengerSealedDetailsState,
      ),
      "open",
    );

    await detailsButton.click();
    await page.waitForFunction(
      () =>
        document.querySelector("pre[data-messenger-sealed-details-state]")?.dataset
          .messengerSealedDetailsState === "exiting",
    );
    assert.equal(
      await details.count(),
      1,
      "details content must remain mounted while the exit animation runs",
    );
    await details.waitFor({ state: "detached" });

    const dismiss = page.getByRole("button", {
      name: "Dismiss",
      exact: true,
    });
    await dismiss.click();
    await page.waitForFunction(
      () =>
        document.querySelector('[data-messenger-sealed-alert="true"]')?.dataset
          .messengerSealedExiting === "true",
    );
    assert.equal(
      await alert.count(),
      1,
      "sealed alert must remain mounted while its exit animation runs",
    );
    await alert.waitFor({ state: "detached" });

    await page.setViewportSize({ width: 600, height: 700 });
    const backButton = page.getByRole("button", { name: "Back", exact: true });
    await backButton.waitFor();
    await backButton.click();
    await backButton.evaluate((node) => {
      node.dispatchEvent(
        new TransitionEvent("transitionend", {
          bubbles: true,
          propertyName: "color",
        }),
      );
    });
    await page.waitForTimeout(30);
    assert.equal(
      await backButton.count(),
      1,
      "a descendant transition must not complete the mobile pane slide",
    );
    await page.evaluate(() => {
      const track = Array.from(document.querySelectorAll("div")).find((node) =>
        node.classList.contains("w-[200%]"),
      );
      if (!track) throw new Error("Messenger mobile track not found");
      track.dispatchEvent(
        new TransitionEvent("transitionend", {
          bubbles: true,
          propertyName: "transform",
        }),
      );
    });
    await backButton.waitFor({ state: "detached" });

    await page.goto("http://127.0.0.1:47174/messenger-harness?mode=pending");
    await page.getByText("Searchable final body", { exact: true }).waitFor();
    assert.deepEqual(
      await page.evaluate(() => window.messengerProbe.readThreads),
      ["quiet"],
      "pending focus must still persist the target thread read state",
    );
    assert.deepEqual(
      await page.evaluate(() => window.messengerProbe.pendingCues),
      [],
      "pending-focus activation must not play the manual open-thread cue",
    );
    assert.equal(
      await page.evaluate(() => window.messengerProbe.pendingFocusConsumed()),
      true,
      "pending-focus target must be consumed after activation",
    );

    await page.goto("http://127.0.0.1:47174/messenger-harness?mode=daniel");
    await page.getByRole("button", { name: /Daniel Fixture/ }).click();
    await page.getByText("Resume fixture", { exact: false }).waitFor();
    assert.deepEqual(
      await page.evaluate(() => window.messengerProbe.danielCommands),
      [{ command: "signal.daniel.verify" }],
      "opening an interactive Daniel thread must resume the shipped verification flow once",
    );

    const evidenceFile = page.getByText("handoff.pdf", { exact: true });
    await evidenceFile.waitFor();
    const danielInput = page.getByRole("textbox", {
      name: "Message service account",
      exact: true,
    });
    await danielInput.fill("verify me");
    await danielInput.press("Enter");

    const typing = page.getByText("Typing", { exact: true });
    await typing.waitFor();
    assert.equal(
      await evidenceFile.count(),
      0,
      "Daniel evidence media must stay hidden while the assistant is typing",
    );
    await page.getByText("First verified reply", { exact: false }).waitFor();
    assert.equal(
      await typing.count(),
      1,
      "typing remains visible between sequential Daniel replies",
    );
    assert.equal(
      await evidenceFile.count(),
      0,
      "evidence media must remain hidden until the reply sequence completes",
    );
    await page.getByText("Second verified reply", { exact: false }).waitFor();
    await typing.waitFor({ state: "detached" });
    await evidenceFile.waitFor();

    const storyText = await page
      .locator(".flex-1.overflow-y-auto.px-4.py-3")
      .innerText();
    assert.ok(
      storyText.indexOf("Second verified reply") < storyText.indexOf("handoff.pdf"),
      "the evidence attachment must reveal after the final local verification reply",
    );
    assert.deepEqual(
      await page.evaluate(() => window.messengerProbe.danielCues),
      [
        "comms-signal-open-thread",
        "comms-signal-verify-send",
        "comms-signal-typing",
        "comms-signal-bot-reply",
        "comms-signal-bot-reply",
      ],
      "Daniel send, typing and reply cues must preserve shipped order",
    );

    await danielInput.fill("interrupt");
    await danielInput.press("Enter");
    await typing.waitFor();
    assert.equal(await evidenceFile.count(), 0);
    await page.evaluate(() => window.messengerProbe.jumpDanielWorld());
    await typing.waitFor({ state: "detached" });
    await evidenceFile.waitFor();
    await page.waitForTimeout(1100);
    const interruptedStoryText = await page
      .locator(".flex-1.overflow-y-auto.px-4.py-3")
      .innerText();
    assert.equal(
      interruptedStoryText.includes("Obsolete delayed reply"),
      false,
      "a world jump must fence a reply that was already waiting for its reveal delay",
    );
    assert.equal(
      interruptedStoryText.includes("interrupt"),
      false,
      "a world jump must clear the interrupted local Daniel turn",
    );

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
      "Messenger probe passed: search, scroll hold, media failure, preview focus, avatar shipped states, IME, failed-send retry, attachment retry, sealed-composer choreography, mobile pane fencing, thread read/reread windows, Daniel reply/media/interrupt choreography and short floating layout.",
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
