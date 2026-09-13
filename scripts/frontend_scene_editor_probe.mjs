import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

// Runs after the real-time cult probe and the existing clock-controlled antivirus probe.
export async function verifySceneEditor(page, output) {
  await page.clock.pauseAt(await page.evaluate(() => Date.now() + 1000));
  const before = await page.evaluate(
    () => window.sceneTools.completions.length,
  );
  const editor = page.getByLabel("Scene project JSON", { exact: true });
  const file = page.getByLabel("Import scene project file", { exact: true });
  try {
    await page
      .getByRole("button", { name: "Scene editor", exact: true })
      .click();
    const original = await editor.inputValue();
    await file.setInputFiles({
      name: "invalid.json",
      mimeType: "application/json",
      buffer: Buffer.from("{broken"),
    });
    await page.getByRole("alert").waitFor();
    assert.equal(await editor.inputValue(), original);
    await file.setInputFiles({
      name: "large.json",
      mimeType: "application/json",
      buffer: Buffer.alloc(100001, " "),
    });
    await page
      .getByText("Project exceeds 100 KB of UTF-8 text", { exact: true })
      .waitFor();
    assert.equal(await editor.inputValue(), original);
    const project = JSON.parse(original);
    project.name = "Camera round trip";
    project.initial.fov = 60;
    project.initial.cameraRot = { x: 0, y: 0, z: 0 };
    await file.setInputFiles({
      name: "camera.json",
      mimeType: "application/json",
      buffer: Buffer.from("\uFEFF" + JSON.stringify(project)),
    });
    await page.waitForFunction(() =>
      document
        .querySelector('[aria-label="Scene project JSON"]')
        .value.includes("Camera round trip"),
    );
    assert.equal(
      await page.evaluate(() => window.sceneTools.state().active),
      false,
    );
    await page
      .getByText("Camera and environment channels", { exact: true })
      .click();
    await page.getByLabel("Scene Field of view", { exact: true }).fill("70");
    await page.getByLabel("Scene Field of view", { exact: true }).press("Tab");
    assert.equal(JSON.parse(await editor.inputValue()).initial.fov, 70);
    await page.getByLabel("Scene Model dim", { exact: true }).fill("2.8");
    await page.getByLabel("Scene Model dim", { exact: true }).press("Tab");
    await page.getByLabel("Scene noriSmile", { exact: true }).selectOption("false");
    await page.getByLabel("Scene chatMode", { exact: true }).selectOption("bubbles");
    assert.equal(JSON.parse(await editor.inputValue()).initial.noriDim, 2.8);
    assert.equal(JSON.parse(await editor.inputValue()).initial.noriSmile, false);
    assert.equal(JSON.parse(await editor.inputValue()).initial.chatMode, "bubbles");
    await page.getByText("Phases and audio tracks", { exact: true }).click();
    await page.getByRole("button", { name: "Add phase", exact: true }).click();
    await page.getByLabel("Phase 4 ID", { exact: true }).fill("exit");
    await page.getByLabel("Phase 4 ID", { exact: true }).press("Tab");
    await page.getByRole("button", { name: "Move exit earlier", exact: true }).click();
    assert.equal(JSON.parse(await editor.inputValue()).phases[2].id, "exit");
    await page.getByRole("button", { name: "Move exit later", exact: true }).click();
    await page.getByLabel("Phase 4 input gate", { exact: true }).check();
    assert.equal(JSON.parse(await editor.inputValue()).phases[3].pauseAtStart, true);
    await page.getByLabel("Phase 4 duration", { exact: true }).fill("-1");
    await page.getByLabel("Phase 4 duration", { exact: true }).press("Tab");
    assert.equal(await page.getByLabel("Phase 4 duration", { exact: true }).inputValue(), "1");
    await page.getByRole("button", { name: "Remove phase exit", exact: true }).click();
    await page.getByRole("button", { name: "Add audio track", exact: true }).click();
    await page.getByLabel("Track 1 srcStart", { exact: true }).fill("44");
    await page.getByLabel("Track 1 srcStart", { exact: true }).press("Tab");
    assert.equal(JSON.parse(await editor.inputValue()).audio[0].srcStart, 44);
    await page.getByLabel("Track 1 source", { exact: true }).fill("https://example.invalid/audio.mp3");
    await page.getByLabel("Track 1 source", { exact: true }).press("Tab");
    assert.equal(await page.getByLabel("Track 1 source", { exact: true }).inputValue(), "/audio/cult/drone.ogg");
    await page.screenshot({ path: resolve(output, "scene-editor-structure.png"), animations: "disabled" });
    await page.getByRole("button", { name: "Remove track track1", exact: true }).click();
    await page.getByText("Phases and audio tracks", { exact: true }).click();
    const downloadPromise = page.waitForEvent("download");
    await page
      .getByRole("button", { name: "Export project", exact: true })
      .click();
    const download = await downloadPromise;
    assert.equal(
      download.suggestedFilename(),
      "nori-scene-Camera-round-trip.json",
    );
    const exported = resolve(output, "scene-editor-roundtrip.json");
    await download.saveAs(exported);
    assert.deepEqual(
      JSON.parse(await readFile(exported, "utf8")),
      JSON.parse(await editor.inputValue()),
    );
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({
      path: resolve(output, "scene-editor-compact.png"),
      animations: "disabled",
    });
    assert.equal(
      await page
        .locator(".source-scene-editor")
        .evaluate((element) => element.scrollWidth <= element.clientWidth + 1),
      true,
    );
    await page.setViewportSize({ width: 900, height: 650 });
    await page
      .getByRole("button", { name: "Play preview", exact: true })
      .click();
    await page.clock.runFor(2100);
    assert.equal(
      await page.evaluate(() => window.sceneTools.state().darkness),
      0.65,
    );
    await page
      .getByRole("button", { name: "Seek to dim", exact: true })
      .click();
    await page
      .getByLabel("Scene preview position", { exact: true })
      .evaluate((element) => {
        Object.getOwnPropertyDescriptor(
          HTMLInputElement.prototype,
          "value",
        ).set.call(element, "1");
        element.dispatchEvent(new Event("input", { bubbles: true }));
      });
    assert.equal(
      await page.evaluate(() => window.sceneTools.state().darkness),
      0.325,
    );
    await page.clock.runFor(2000);
    assert.equal(
      await page.getByLabel("Scene preview position").inputValue(),
      "1",
    );
    await page.screenshot({
      path: resolve(output, "scene-editor-scrub.png"),
      animations: "disabled",
    });
    await page
      .getByRole("button", { name: "Resume preview", exact: true })
      .click();
    await page.clock.runFor(1100);
    await page.locator('[data-scene-preview-phase="inspect"]').waitFor();
    await page
      .getByRole("button", { name: "Seek to restore", exact: true })
      .click();
    await page.locator('[data-scene-preview-phase="restore"]').waitFor();
    assert.equal(
      await page
        .getByRole("button", { name: "Continue phase", exact: true })
        .isDisabled(),
      true,
    );
    await page
      .getByRole("button", { name: "Resume preview", exact: true })
      .click();
    await page.clock.runFor(2200);
    assert.equal(
      await page.evaluate(() => window.sceneTools.state().active),
      false,
    );
    assert.equal(
      await page.evaluate(() => window.sceneTools.completions.length),
      before,
    );

    // Exact inspection must not merge instantaneous changes sharing a timestamp.
    await editor.fill(
      JSON.stringify({
        name: "Instant phases",
        initial: {},
        audio: [],
        phases: [
          { id: "arrive", duration: 1, to: {} },
          { id: "red", duration: 0, to: { redLight: 0.4 } },
          { id: "flash", duration: 0, to: { redLight: 1 } },
          { id: "confirm", duration: 0, pauseAtStart: true, to: {} },
          { id: "leave", duration: 1, to: {} },
        ],
      }),
    );
    await page
      .getByRole("button", { name: "Play preview", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Seek to red", exact: true })
      .click();
    await page.clock.runFor(100);
    await page.locator('[data-scene-preview-phase="red"]').waitFor();
    assert.equal(
      await page.evaluate(() => window.sceneTools.state().redLight),
      0.4,
    );
    await page
      .getByRole("button", { name: "Seek to flash", exact: true })
      .click();
    assert.equal(
      await page.evaluate(() => window.sceneTools.state().redLight),
      1,
    );
    await page
      .getByRole("button", { name: "Resume preview", exact: true })
      .click();
    await page.locator('[data-scene-preview-phase="confirm"]').waitFor();
    await page
      .getByRole("button", { name: "Stop preview", exact: true })
      .click();

    // Replacement snapshots invalidate a preview even when the world ID is unchanged.
    await page.evaluate(() => window.sceneTools.joinWorld("editor-world"));
    await page
      .getByRole("button", { name: "Play preview", exact: true })
      .click();
    await page.clock.runFor(100);
    assert.equal(
      await page.evaluate(() => window.sceneTools.state().active),
      true,
    );
    await page.evaluate(() => window.sceneTools.joinWorld("editor-world"));
    assert.equal(
      await page.evaluate(() => window.sceneTools.state().active),
      false,
    );
    await page
      .getByRole("button", { name: "Play preview", exact: true })
      .click();
    await page.clock.runFor(100);
    await page.evaluate(() => window.sceneTools.start("editor-takeover"));
    await page.locator("[data-story-scene]").waitFor();
    assert.equal(
      await page
        .getByRole("button", { name: "Stop preview", exact: true })
        .isDisabled(),
      true,
    );
    await page.evaluate(() => window.sceneTools.cancel());
    await page.locator("[data-story-scene]").waitFor({ state: "detached" });
    assert.equal(
      await page.evaluate(() => window.sceneTools.completions.length),
      before,
    );
    await page.evaluate(() => window.sceneTools.closeDebug());
    assert.equal(
      await page.evaluate(() => window.sceneTools.state().active),
      false,
    );
    console.log(
      "Scene editor probe passed: file round-trip, invalid/oversized input, channels, precise scrubbing, gates, compact layout, same-world replacement and production takeover",
    );
  } finally {
    await page.clock.resume();
    await page.setViewportSize({ width: 900, height: 650 });
  }
}
