import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve, join } from "node:path";
import { spawn } from "node:child_process";

/**
 * Visual comparison utility for frontend restoration acceptance.
 * Captures screenshots from both historical production and source builds
 * for side-by-side visual verification.
 */

const output = resolve("frontend-visual-comparison");
await mkdir(output, { recursive: true });

// Detect CI environment for adaptive timeouts
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
  backend.stdout.on("data", (data) => {
    backendLog = (backendLog + data).slice(-4000);
  });
  backend.stderr.on("data", (data) => {
    backendLog = (backendLog + data).slice(-4000);
  });

  // Wait for backend ready
  const backendOrigin = `http://127.0.0.1:${port}`;
  let ready = false;
  for (let attempt = 0; attempt < 100; attempt++) {
    try {
      if ((await fetch(`${backendOrigin}/api/auth/get-session`)).ok) {
        ready = true;
        break;
      }
    } catch {}
    if (backend.exitCode !== null) {
      throw new Error("Backend exited: " + backendLog);
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  if (!ready) throw new Error("Backend did not start");

  return { backend, backendOrigin };
}

/**
 * Capture Messenger visual states
 */
export async function captureMessengerVisuals(browser, origin, outputPrefix) {
  const page = await browser.newPage({
    viewport: { width: 1366, height: 900 },
    locale: "en-US",
  });
  page.setDefaultTimeout(20000);

  await page.goto(origin, { waitUntil: "domcontentloaded" });
  await page.locator('[data-live2d-status="ready"]').waitFor({ timeout: modelReadyTimeout });

  // Wait for fonts to load
  await page.evaluate(() => document.fonts.ready);

  // Capture initial state
  await page.screenshot({ path: join(output, `${outputPrefix}-messenger-initial.png`) });

  // Send a message and capture conversation state
  const input = page.getByRole("textbox", { name: "Message", exact: true });
  await input.fill("Visual comparison test message");
  await page.getByRole("button", { name: "Send", exact: true }).click();
  await page.locator('.conversation-lines [data-sender="player"]').waitFor();
  await page.locator('.conversation-lines [data-sender="agent"]').waitFor();

  // Wait for bubble opacity transitions
  await page.waitForFunction(() =>
    [...document.querySelectorAll(".conversation-bubble")].every(
      (element) => Number(getComputedStyle(element).opacity) > 0.99
    )
  );

  await page.screenshot({ path: join(output, `${outputPrefix}-messenger-conversation.png`) });

  // Capture focused state
  await page.keyboard.press("Control+k");
  await page.screenshot({ path: join(output, `${outputPrefix}-messenger-focused.png`) });

  // Test responsive layouts
  for (const width of [390, 1024, 1366]) {
    await page.setViewportSize({ width, height: 900 });
    await page.screenshot({
      path: join(output, `${outputPrefix}-messenger-${width}w.png`)
    });
  }

  await page.close();
  console.log(`✓ Captured Messenger visuals: ${outputPrefix}`);
}

/**
 * Capture game visual states
 */
export async function captureGameVisuals(browser, origin, outputPrefix) {
  const page = await browser.newPage({
    viewport: { width: 1100, height: 720 },
  });

  await page.goto(origin, { waitUntil: "domcontentloaded" });
  await page.locator('[data-live2d-status="ready"]').waitFor({ timeout: modelReadyTimeout });

  // Open games app
  await page.locator('[data-nori-dock] [data-app-id="games"]').click();

  // Capture each game's initial state
  const games = ["Chess", "Codenames", "Pictionary", "Cake Duel"];
  for (const game of games) {
    try {
      await page.getByRole("button", { name: game, exact: true }).click();
      await page.waitForTimeout(500); // Let game initialize
      await page.screenshot({
        path: join(output, `${outputPrefix}-game-${game.toLowerCase().replace(' ', '-')}.png`)
      });
      await page.getByRole("button", { name: "Close", exact: true }).click();
    } catch (error) {
      console.warn(`Could not capture ${game}: ${error.message}`);
    }
  }

  await page.close();
  console.log(`✓ Captured game visuals: ${outputPrefix}`);
}

/**
 * Capture Live2D story visual states
 */
export async function captureStoryVisuals(browser, origin, outputPrefix) {
  const page = await browser.newPage({
    viewport: { width: 1366, height: 900 },
  });

  await page.goto(origin, { waitUntil: "domcontentloaded" });

  // Wait for Live2D model ready
  await page.locator('[data-live2d-status="ready"]').waitFor({ timeout: modelReadyTimeout });

  // Capture model in default state
  await page.screenshot({ path: join(output, `${outputPrefix}-live2d-default.png`) });

  // Capture with different expressions if available
  try {
    // Try to trigger different model states through Debug if available
    await page.keyboard.press("Control+d");
    await page.waitForTimeout(300);
    const debugPanel = page.locator('[data-debug-panel]');
    if (await debugPanel.isVisible()) {
      await page.screenshot({ path: join(output, `${outputPrefix}-live2d-debug.png`) });
      await page.keyboard.press("Escape");
    }
  } catch {}

  await page.close();
  console.log(`✓ Captured story visuals: ${outputPrefix}`);
}

/**
 * Main comparison workflow
 */
async function main() {
  const backendPort = 47180;
  const { backend, backendOrigin } = await startBackend(backendPort);
  process.env.NORI_BACKEND_ORIGIN = backendOrigin;

  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
      executablePath: process.env.NORI_TEST_CHROMIUM || undefined,
      args: [
        "--use-gl=angle",
        "--use-angle=swiftshader",
        "--enable-unsafe-swiftshader",
      ],
    });

    console.log("📸 Capturing source build visuals...");

    // For now, capture from source build
    // In future, we'll also capture from historical production build for comparison
    const sourceOrigin = "http://127.0.0.1:47174"; // Assumes vite dev server running

    await captureMessengerVisuals(browser, backendOrigin, "source");
    await captureGameVisuals(browser, backendOrigin, "source");
    await captureStoryVisuals(browser, backendOrigin, "source");

    console.log(`\n✓ Visual comparison captures complete: ${output}/`);
    console.log("\nNext steps:");
    console.log("1. Compare source-* screenshots with historical production");
    console.log("2. Document any visual differences in FRONTEND_REMAINING_WORK.md");
    console.log("3. Mark boundaries complete when visual parity is confirmed");

  } finally {
    await browser?.close();
    backend.kill();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
