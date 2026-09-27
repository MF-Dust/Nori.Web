import assert from "node:assert/strict";
import { resolve } from "node:path";

export async function verifyAntivirus(page, output) {
  const completionsBefore = await page.evaluate(
    () => window.sceneTools.completions.length,
  );
  await page.setViewportSize({ width: 1280, height: 1050 });
  await page.bringToFront();
  await page.getByRole("button", { name: "Corruption", exact: true }).click();
  const installedAt = await page.evaluate(() => Date.now());
  await page.clock.install({ time: installedAt });
  // Keep driver/CI latency out of the 560 ms all-clear transition.
  await page.clock.pauseAt(await page.evaluate(() => Date.now() + 1000));
  await page
    .getByRole("button", { name: "Open corruption study", exact: true })
    .click();
  await page.clock.runFor(1300);
  await page.locator('[data-corruption-phase="awaitVoice"]').waitFor();
  await page.getByRole("button", { name: "Pause study", exact: true }).click();
  const time = await page
    .locator("[data-corruption-time]")
    .getAttribute("data-corruption-time");
  await page.clock.runFor(1000);
  assert.equal(
    await page
      .locator("[data-corruption-time]")
      .getAttribute("data-corruption-time"),
    time,
  );
  assert.equal(
    await page
      .getByRole("button", { name: "Continue voice gate" })
      .isDisabled(),
    true,
  );
  await page.getByRole("button", { name: "Resume study", exact: true }).click();
  await page.getByRole("button", { name: "Continue voice gate" }).click();
  await page.clock.fastForward(11000);
  await page.clock.runFor(200);
  await page.locator('[data-corruption-phase="qte"]').waitFor();
  await page.screenshot({
    path: resolve(output, "antivirus-six-panels.png"),
    animations: "disabled",
  });
  assert.equal(await page.locator("[data-antivirus-game]").count(), 6);
  await page
    .locator('[data-antivirus-game="terminal"] button[data-hostile="false"]')
    .first()
    .click();
  assert.equal(
    await page
      .locator('[data-antivirus-game="terminal"]')
      .getAttribute("data-solved"),
    "false",
  );
  for (const button of await page
    .locator('[data-antivirus-game="terminal"] button[data-hostile="true"]')
    .all())
    await button.click();
  await page.clock.runFor(300);
  for (const button of await page
    .locator('[data-antivirus-game="surgery"] button[data-hostile="true"]')
    .all())
    await button.click();
  assert.equal(
    await page
      .locator("[data-antivirus-cleared]")
      .getAttribute("data-antivirus-cleared"),
    "2",
  );
  await page.getByRole("button", { name: "Pause study", exact: true }).click();
  const beat = await page
    .locator("[data-beat-position]")
    .getAttribute("data-beat-position");
  await page.clock.runFor(1000);
  assert.equal(
    await page
      .locator("[data-beat-position]")
      .getAttribute("data-beat-position"),
    beat,
  );
  await page.getByRole("button", { name: "Resume study", exact: true }).click();
  await page.evaluate(() => window.sceneTools.visibility(true));
  const hiddenBeat = await page
    .locator("[data-beat-position]")
    .getAttribute("data-beat-position");
  await page.clock.runFor(1000);
  assert.equal(
    await page
      .locator("[data-beat-position]")
      .getAttribute("data-beat-position"),
    hiddenBeat,
  );
  await page.evaluate(() => window.sceneTools.visibility(false));
  for (let step = 0; step < 160; step++) {
    if (
      (await page
        .locator('[data-antivirus-game="rhythm"]')
        .getAttribute("data-solved")) === "true"
    )
      break;
    await page.clock.runFor(30);
    await page.evaluate(() => {
      const position = Number(
        document.querySelector("[data-beat-position]").dataset.beatPosition,
      );
      if (position >= 0.58 && position <= 0.66)
        document.querySelector(".antivirus-pulse").click();
    });
  }
  assert.equal(
    await page
      .locator('[data-antivirus-game="rhythm"]')
      .getAttribute("data-solved"),
    "true",
  );
  for (const [key, value] of [
    ["frequency", "2"],
    ["phase", "1.57"],
    ["gain", "1"],
  ])
    await page.getByLabel(key, { exact: true }).fill(value);
  await page.clock.runFor(750);
  assert.equal(
    await page
      .locator('[data-antivirus-game="tune"]')
      .getAttribute("data-solved"),
    "true",
  );
  const anchor = page.locator('[data-antivirus-game="preference"]');
  await anchor.getByRole("button").nth(1).click();
  assert.equal(await anchor.getAttribute("data-solved"), "false");
  for (const choice of [0, 1, 1, 0, 0]) {
    await anchor.getByRole("button").nth(choice).click();
    await page.clock.runFor(650);
  }
  assert.equal(await anchor.getAttribute("data-solved"), "true");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: resolve(output, "antivirus-compact.png"),
    animations: "disabled",
  });
  assert.equal(
    await page
      .locator(".corruption-preview-overlay")
      .evaluate((element) => element.scrollWidth <= element.clientWidth),
    true,
  );
  await page.setViewportSize({ width: 1280, height: 1050 });
  const steering = page.getByRole("application", {
    name: "通信链路校准",
    exact: true,
  });
  await steering.scrollIntoViewIfNeeded();
  const box = await steering.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  for (let step = 0; step < 300; step++) {
    if (
      (await page
        .locator('[data-antivirus-game="steer"]')
        .getAttribute("data-solved")) === "true"
    )
      break;
    const target = await steering.evaluate((element) => ({
      x: Number(element.dataset.targetX),
      y: Number(element.dataset.targetY),
    }));
    await page.mouse.move(
      box.x + ((1 + target.x) * box.width) / 2,
      box.y + ((1 + target.y) * box.height) / 2,
    );
    await page.clock.runFor(50);
  }
  await page.mouse.up();
  assert.equal(
    await page
      .locator('[data-antivirus-game="steer"]')
      .getAttribute("data-solved"),
    "true",
  );
  assert.equal(
    await page
      .locator("[data-antivirus-cleared]")
      .getAttribute("data-antivirus-cleared"),
    "6",
  );
  await page.screenshot({
    path: resolve(output, "antivirus-all-clear.png"),
    animations: "disabled",
  });
  await page.clock.runFor(800);
  assert.equal(await page.locator('[data-corruption-phase="qte"]').count(), 0);
  await page.clock.fastForward(23000);
  await page.clock.runFor(100);
  await page.locator('[data-corruption-phase="wake"]').waitFor();
  assert.equal(
    await page.evaluate(() => window.sceneTools.state().noriSleep),
    true,
  );
  await page.getByRole("button", { name: "Wake model", exact: true }).click();
  await page.clock.runFor(3000);
  await page.locator("[data-corruption-phase]").waitFor({ state: "detached" });
  assert.equal(
    await page.evaluate(() => window.sceneTools.state().active),
    false,
  );
  assert.equal(
    await page.evaluate(() => window.sceneTools.completions.length),
    completionsBefore,
  );
  await page
    .getByRole("button", { name: "Open corruption study", exact: true })
    .click();
  await page.clock.runFor(100);
  await page.keyboard.press("Escape");
  assert.equal(
    await page.evaluate(() => window.sceneTools.state().active),
    false,
  );
  assert.equal(
    await page
      .getByRole("button", { name: "Open corruption study", exact: true })
      .evaluate((element) => document.activeElement === element),
    true,
  );
  await page.clock.resume();
  await page.setViewportSize({ width: 900, height: 650 });
  console.log(
    "Antivirus probe passed: six games, protected targets, timing gates, pause/visibility, compact layout and cleanup without facts",
  );
}
