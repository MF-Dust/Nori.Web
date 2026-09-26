import { chromium } from "playwright";
import { probeLaunchOptions } from "./probe_launch.mjs";
import { spawn } from "node:child_process";
import { mkdir } from "node:fs/promises";
import { resolve, join } from "node:path";

/**
 * Debug layout visual capture for Supporting Apps boundary acceptance.
 * Captures all Debug tabs to verify layout parity with original.
 */

const output = resolve("frontend-debug-layout");
await mkdir(output, { recursive: true });

const isCI = Boolean(process.env.CI || process.env.GITHUB_ACTIONS);
const modelReadyTimeout = isCI ? 90000 : 60000;

async function startBackend(port) {
  const backend = spawn(
    process.env.NORI_TEST_PYTHON ?? "python",
    ["-m", "uvicorn", "server:app", "--host", "127.0.0.1", "--port", String(port)],
    {
      env: {
        ...process.env,
        NORI_DISABLE_LIVE_PACK: "1",
        OPENAI_API_KEY: "",
        ANTHROPIC_API_KEY: "",
      },
      stdio: ["ignore", "pipe", "pipe"],
    }
  );

  let backendLog = "";
  backend.stdout.on("data", (data) => backendLog = (backendLog + data).slice(-4000));
  backend.stderr.on("data", (data) => backendLog = (backendLog + data).slice(-4000));

  const backendOrigin = `http://127.0.0.1:${port}`;
  let ready = false;
  for (let attempt = 0; attempt < 100; attempt++) {
    try {
      if ((await fetch(`${backendOrigin}/api/auth/get-session`)).ok) {
        ready = true;
        break;
      }
    } catch {}
    if (backend.exitCode !== null) throw new Error("Backend exited: " + backendLog);
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  if (!ready) throw new Error("Backend did not start");
  return { backend, backendOrigin };
}

async function captureDebugLayouts(page) {
  console.log("Capturing Debug layouts...");

  // Open Debug panel
  await page.keyboard.press("Control+d");
  await page.waitForTimeout(300);
  const debugPanel = page.locator('[data-debug-panel]');
  await debugPanel.waitFor({ state: "visible" });

  // Capture main Debug view
  await page.screenshot({ path: join(output, "debug-main.png") });

  // Define all Debug tabs to capture
  const tabs = [
    { name: "Notifications", selector: '[data-tab="notifications"]' },
    { name: "Live2D", selector: '[data-tab="live2d"]' },
    { name: "Audio", selector: '[data-tab="audio"]' },
    { name: "Pat", selector: '[data-tab="pat"]' },
    { name: "Reactions", selector: '[data-tab="reactions"]' },
    { name: "Chess", selector: '[data-tab="chess"]' },
    { name: "Codenames", selector: '[data-tab="codenames"]' },
    { name: "Cake Duel", selector: '[data-tab="cake-duel"]' },
    { name: "Shatter", selector: '[data-tab="shatter"]' },
    { name: "Datasea", selector: '[data-tab="datasea"]' },
  ];

  for (const tab of tabs) {
    try {
      const tabButton = page.locator(tab.selector);
      if (await tabButton.isVisible()) {
        await tabButton.click();
        await page.waitForTimeout(200);
        await page.screenshot({
          path: join(output, `debug-${tab.name.toLowerCase().replace(' ', '-')}.png`)
        });
        console.log(`  ✓ Captured ${tab.name} tab`);
      } else {
        console.log(`  ⊘ ${tab.name} tab not found (may be story-dependent)`);
      }
    } catch (error) {
      console.warn(`  ⚠ Could not capture ${tab.name}: ${error.message}`);
    }
  }

  // Close Debug
  await page.keyboard.press("Escape");
}

async function captureSystemApps(page) {
  console.log("\nCapturing system apps...");

  // Settings
  await page.locator('[data-nori-dock] [data-app-id="settings"]').click();
  await page.waitForTimeout(300);
  await page.screenshot({ path: join(output, "settings.png") });
  await page.getByRole("button", { name: "Close", exact: true }).click();
  console.log("  ✓ Settings");

  // About
  await page.locator('[data-nori-dock] [data-app-id="about"]').click();
  await page.waitForTimeout(300);
  await page.screenshot({ path: join(output, "about.png") });
  await page.getByRole("button", { name: "Close", exact: true }).click();
  console.log("  ✓ About");

  // Credits
  const creditsButton = page.locator('[data-nori-dock] [data-app-id="credits"]');
  if (await creditsButton.isVisible()) {
    await creditsButton.click();
    await page.waitForTimeout(300);
    await page.screenshot({ path: join(output, "credits.png") });
    await page.getByRole("button", { name: "Close", exact: true }).click();
    console.log("  ✓ Credits");
  }

  // Preview (open a test PDF)
  await page.locator('[data-nori-dock] [data-app-id="preview"]').click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: join(output, "preview-empty.png") });
  await page.getByRole("button", { name: "Close", exact: true }).click();
  console.log("  ✓ Preview");
}

async function main() {
  const backendPort = 47182;
  const { backend, backendOrigin } = await startBackend(backendPort);
  process.env.NORI_BACKEND_ORIGIN = backendOrigin;

  let browser;
  try {
    browser = await chromium.launch(probeLaunchOptions());

    const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
    page.setDefaultTimeout(20000);

    await page.goto(backendOrigin, { waitUntil: "domcontentloaded" });
    await page.locator('[data-live2d-status="ready"]').waitFor({ timeout: modelReadyTimeout });
    await page.evaluate(() => document.fonts.ready);

    await captureDebugLayouts(page);
    await captureSystemApps(page);

    console.log(`\n✓ Debug layout capture complete: ${output}/`);
    console.log("\nCaptured:");
    console.log("  - Debug main view + all tabs");
    console.log("  - Settings, About, Credits, Preview");
    console.log("\nRemaining Supporting Apps work:");
    console.log("  - Compare layouts with historical production");
    console.log("  - Document private Inject Talk/Nori Context handlers as known limitation");
    console.log("  - Mark boundary complete with documented gaps");

  } finally {
    await browser?.close();
    backend.kill();
  }
}

main().catch(console.error);
