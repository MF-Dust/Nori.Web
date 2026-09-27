import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

/** Actual source desktop, Arcade transport, Python reducer and local opponent. */
export async function verifyChessTutorial(page, output) {
  const steps = JSON.parse(await readFile("shared/chess-tutorial.json", "utf8"));
  const dock = page.locator('[data-nori-dock] [data-app-id="chess"]');
  await dock.click();
  await page.getByRole("button", { name: "Learn from Nori", exact: true }).click();
  for (const step of steps) {
    if (step.mover !== "player") continue;
    await page.locator(`[data-chess-tutorial="${step.id}"]`).waitFor();
    assert.equal(await page.getByRole("button", { name: "Resign", exact: true }).isDisabled(), true);
    await page.locator(`[data-chess-square="${step.move.from}"]`).click();
    await page.locator(`[data-chess-square="${step.move.to}"]`).click();
  }
  await page.locator('[data-chess-tutorial="free_play"]').waitFor();
  assert.equal(await page.getByRole("button", { name: "Resign", exact: true }).isEnabled(), true);
  assert.equal(await page.locator('[aria-label="Move history"] button').count(), 22);
  await page.screenshot({ path: resolve(output, "chess-tutorial-local-backend.png") });
  await page.locator('[data-chess-square="a2"]').click();
  await page.locator('[data-chess-square="a3"]').click();
  await page.waitForFunction(() => document.querySelectorAll('[aria-label="Move history"] button').length === 24);
  await page.getByRole("button", { name: "Resign", exact: true }).click();
  const results = page.locator('[data-chess-result="loss"]');
  await results.waitFor();
  await results.getByRole("button", { name: /Play Again$/i }).click();
  await page.getByRole("button", { name: "Learn from Nori", exact: true }).click();
  await page.locator(`[data-chess-tutorial="${steps[0].id}"]`).waitFor();
  assert.equal(await page.locator('[aria-label="Move history"] button').count(), 0);
  await page.getByRole("button", { name: "Exit", exact: true }).click();
  await dock.click();
  await page.getByRole("button", { name: "Learn from Nori", exact: true }).waitFor();
  assert.equal(await page.locator("[data-chess-tutorial]").count(), 0);
  await page.getByRole("button", { name: "Exit", exact: true }).click();
  console.log("PASS: Chess tutorial through the source desktop and local backend: 22 plies, free play, restart and clean reopen.");
}
