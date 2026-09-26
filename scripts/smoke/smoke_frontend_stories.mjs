import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { verifyBootCorruption } from "../probes/frontend_boot_corruption_probe.mjs";
import { verifyMemoryDatasea } from "../probes/frontend_memory_datasea_probe.mjs";
import { verifyFarewellEnding } from "../probes/frontend_farewell_ending_probe.mjs";
import { verifyCultFlash } from "../probes/frontend_cult_probe.mjs";
import { probeLaunchOptions } from "../lib/probe_launch.mjs";
const output = resolve(".artifacts/stories-smoke"),
  origin = "http://127.0.0.1:47175";
await mkdir(output, { recursive: true });
const vite = spawn(
  process.execPath,
  [
    "node_modules/vite/bin/vite.js",
    "--config",
    "frontend-src/app.vite.config.ts",
    "--host",
    "127.0.0.1",
    "--port",
    "47175",
    "--strictPort",
  ],
  { stdio: ["ignore", "pipe", "pipe"] },
);
let log = "";
vite.stdout.on("data", (b) => {
  log += b;
});
vite.stderr.on("data", (b) => {
  log += b;
});
const launchOptions = probeLaunchOptions();
let browser;
try {
  const deadline = Date.now() + 60000;
  let ready = false;
  while (Date.now() < deadline) {
    try {
      ready = (await fetch(origin)).ok;
      if (ready) break;
    } catch {}
    await new Promise((r) => setTimeout(r, 100));
  }
  if (!ready) throw Error("Story Vite server did not start: " + log);
  browser = await chromium.launch(launchOptions);
  for (const verify of [
    verifyBootCorruption,
    verifyMemoryDatasea,
    verifyFarewellEnding,
    verifyCultFlash,
  ]) {
    await verify(browser, output, origin);
  }
} finally {
  await browser?.close();
  vite.kill("SIGTERM");
}
