import assert from "node:assert/strict";
import { resolve } from "node:path";
import { writeFile } from "node:fs/promises";
import { solveDataseaCoreGame } from "./frontend_datasea_core_game_inputs.mjs";
import { solveDataseaGame } from "./frontend_datasea_game_inputs.mjs";

const WAVES = [
  ["denoise", "sweep", "unknot", "relay"],
  ["discern", "echo", "steady", "balance"],
  ["current", "lure", "resonance", "ripple"],
];

export async function verifyDataseaGames(
  browser,
  output,
  origin = "http://127.0.0.1:47175",
) {
  const page = await browser.newPage({
    viewport: { width: 1280, height: 980 },
  });
  page.setDefaultTimeout(20000);
  const errors = [],
    consoleErrors = [],
    results = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  const installedAt = Date.now();
  await page.clock.install({ time: installedAt });
  await page.clock.pauseAt(installedAt + 1000);
  await page.route("**/datasea-games-harness", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: `<html class="dark theme-nori"><body style="margin:0;min-height:980px;background:#050f1d"><div id="root"></div><script type="module">import RefreshRuntime from "/@react-refresh";RefreshRuntime.injectIntoGlobalHook(window);window.$RefreshReg$=()=>{};window.$RefreshSig$=()=>type=>type;window.__vite_plugin_react_preamble_installed__=true;</script><script type="module" src="/@fs/${resolve("tests/frontend-datasea-games-harness.tsx")}"></script></body></html>`,
    }),
  );
  try {
    await page.goto(`${origin}/datasea-games-harness`);
    for (let wave = 0; wave < WAVES.length; wave++) {
      const ids = WAVES[wave];
      await page.evaluate(
        (values) => window.dataseaGamesProbe.mount(values),
        ids,
      );
      for (let elapsed = 0; elapsed < 10000; elapsed += 40) {
        if ((await page.locator(".datasea-game").count()) === 4) break;
        await page.clock.runFor(40);
      }
      assert.equal(
        await page.locator(".datasea-game").count(),
        4,
        `wave ${wave + 1} mounted`,
      );
      await page.clock.runFor(700);
      for (const id of ids) {
        const started = Date.now();
        console.log(`Datasea standalone wave ${wave + 1}: ${id} input start`);
        try {
          const handled =
            (await solveDataseaCoreGame(page, id)) ||
            (await solveDataseaGame(page, id));
          assert.ok(handled, `real-input solver exists for ${id}`);
          for (let elapsed = 0; elapsed < 10000; elapsed += 40) {
            if (
              (await page
                .locator(`.datasea-game[data-game="${id}"]`)
                .getAttribute("data-solved")) === "true"
            )
              break;
            await page.clock.runFor(40);
          }
          assert.equal(
            await page
              .locator(`.datasea-game[data-game="${id}"]`)
              .getAttribute("data-solved"),
            "true",
            `${id} production onSolved state`,
          );
          results.push({
            id,
            wave: wave + 1,
            ok: true,
            elapsedMs: Date.now() - started,
          });
        } catch (error) {
          results.push({
            id,
            wave: wave + 1,
            ok: false,
            elapsedMs: Date.now() - started,
            error: String(error),
          });
          await page
            .screenshot({
              path: resolve(output, `datasea-game-${id}-failure.png`),
              timeout: 10000,
            })
            .catch(() => {});
        } finally {
          await page.mouse.up().catch(() => {});
        }
        console.log(
          "Datasea standalone result:",
          JSON.stringify(results.at(-1)),
        );
        await writeFile(
          resolve(output, "datasea-games-results.json"),
          JSON.stringify({ results, errors, consoleErrors }, null, 2),
        );
      }
      await page.screenshot({
        path: resolve(output, `datasea-games-wave-${wave + 1}.png`),
      });
    }
    const report = { results, errors, consoleErrors };
    await writeFile(
      resolve(output, "datasea-games-results.json"),
      JSON.stringify(report, null, 2),
    );
    const failures = results.filter((result) => !result.ok);
    assert.equal(
      failures.length,
      0,
      `Datasea game failures: ${failures.map((item) => `${item.id}: ${item.error}`).join(" | ")}`,
    );
    assert.equal(results.length, 12);
    assert.deepEqual(errors, []);
    console.log(
      `Datasea games probe passed: ${results.map((result) => result.id).join(", ")}`,
    );
  } finally {
    await page
      .evaluate(() => window.dataseaGamesProbe?.unmount())
      .catch(() => {});
    await page.close();
  }
}
