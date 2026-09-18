import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { createServer } from "vite";
import { chromium } from "playwright";

const groups = {
  "debug-labs": ["./frontend_debug_probe.mjs", "verifyDebugLabs"],
  "boot-corruption": [
    "./frontend_boot_corruption_probe.mjs",
    "verifyBootCorruption",
  ],
  "cold-open": ["./frontend_nori_scene_probe.mjs", "verifyNoriScene"],
  messenger: ["./frontend_messenger_probe.mjs", "verifyMessenger"],
  "datasea-games": ["./frontend_datasea_games_probe.mjs", "verifyDataseaGames"],
  "memory-datasea": [
    "./frontend_memory_datasea_probe.mjs",
    "verifyMemoryDatasea",
  ],
  "farewell-ending": [
    "./frontend_farewell_ending_probe.mjs",
    "verifyFarewellEnding",
  ],
};
const selected = process.argv[2];
if (!Object.hasOwn(groups, selected))
  throw new Error(`Unknown recovery surface: ${selected}`);
const output = resolve("frontend-surfaces-smoke", selected);
await mkdir(output, { recursive: true });
const server = await createServer({
  configFile: "frontend-src/app.vite.config.ts",
  server: { host: "127.0.0.1", port: 47174, strictPort: true, hmr: false },
});
let browser;
try {
  await server.listen();
  browser = await chromium.launch({
    headless: true,
    executablePath: process.env.NORI_TEST_CHROMIUM || undefined,
    args: [
      "--use-gl=angle",
      "--use-angle=swiftshader",
      "--enable-unsafe-swiftshader",
    ],
  });
  const [path, name] = groups[selected];
  const probe = await import(path);
  await probe[name](browser, output, "http://127.0.0.1:47174");
} finally {
  await browser?.close();
  await server.close();
}
