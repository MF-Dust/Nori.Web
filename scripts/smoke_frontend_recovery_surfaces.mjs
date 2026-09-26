import { mkdir } from "node:fs/promises";
import { createServer as createNetServer } from "node:net";
import { resolve } from "node:path";
import { createServer } from "vite";
import { chromium } from "playwright";
import { probeLaunchOptions } from "./probe_launch.mjs";

const groups = {
  "debug-labs": ["./frontend_debug_probe.mjs", "verifyDebugLabs"],
  "boot-corruption": [
    "./frontend_boot_corruption_probe.mjs",
    "verifyBootCorruption",
  ],
  "boot-matrix": [
    "./frontend_boot_corruption_probe.mjs",
    "verifyBootLifecycleMatrix",
  ],
  "cold-open": ["./frontend_nori_scene_probe.mjs", "verifyNoriScene"],
  messenger: ["./frontend_messenger_probe.mjs", "verifyMessenger"],
  "datasea-games": ["./frontend_datasea_games_probe.mjs", "verifyDataseaGames"],
  "memory-datasea": [
    "./frontend_memory_datasea_probe.mjs",
    "verifyMemoryDatasea",
  ],
  "datasea-device": [
    "./frontend_datasea_device_matrix_probe.mjs",
    "verifyDataseaDeviceMatrix",
  ],
  "farewell-ending": [
    "./frontend_farewell_ending_probe.mjs",
    "verifyFarewellEnding",
  ],
  cult: ["./frontend_cult_probe.mjs", "verifyCultFlash"],
};
const selected = process.argv[2];
if (!Object.hasOwn(groups, selected))
  throw new Error(`Unknown recovery surface: ${selected}`);
const output = resolve("frontend-surfaces-smoke", selected);
await mkdir(output, { recursive: true });
// A leaked probe server can still hold the house port, and probing whatever
// answers there is worse than moving: ask the OS for a free port instead.
const freePort = (port) =>
  new Promise((resolvePort, reject) => {
    const probe = createNetServer();
    probe.on("error", () => {
      if (port) return resolvePort(freePort(0));
      reject(new Error("no free port for the recovery-surface server"));
    });
    probe.listen(port, "127.0.0.1", () => {
      const { port: found } = probe.address();
      probe.close(() => resolvePort(found));
    });
  });
const port = await freePort(47174);
const server = await createServer({
  configFile: "frontend-src/app.vite.config.ts",
  server: { host: "127.0.0.1", port, strictPort: true, hmr: false },
});
let browser;
try {
  await server.listen();
  browser = await chromium.launch(probeLaunchOptions());
  const [path, name] = groups[selected];
  const probe = await import(path);
  await probe[name](browser, output, `http://127.0.0.1:${port}`);
} finally {
  await browser?.close();
  await server.close();
}
