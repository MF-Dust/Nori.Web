import { spawn } from "node:child_process";
import { createServer as createNetServer } from "node:net";
import { mkdir, appendFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createServer } from "vite";
import { chromium } from "playwright";
import { probeLaunchOptions } from "./probe_launch.mjs";
import { startBackend as launchBackend } from "./backend_launch.mjs";
import { artifactDir, repoRoot } from "./paths.mjs";

/** Ask the OS for an unused localhost port. */
export function freePort() {
  return new Promise((resolvePort, reject) => {
    const probe = createNetServer();
    probe.on("error", reject);
    probe.listen(0, "127.0.0.1", () => {
      const { port } = probe.address();
      probe.close(() => resolvePort(port));
    });
  });
}

/** Kill a spawned process and every process it started. */
export function killTree(child) {
  if (!child?.pid || child.exitCode !== null) return Promise.resolve();
  if (process.platform === "win32") {
    return new Promise((done) => {
      const killer = spawn("taskkill", ["/PID", String(child.pid), "/T", "/F"], {
        stdio: "ignore",
        windowsHide: true,
      });
      killer.on("exit", () => done());
      killer.on("error", () => done());
    });
  }
  try {
    process.kill(-child.pid, "SIGTERM");
  } catch {
    child.kill("SIGTERM");
  }
  return Promise.resolve();
}

function capture(logFile) {
  let text = "";
  return {
    log: () => text,
    onOutput(chunk) {
      text = (text + chunk).slice(-12_000);
      if (logFile) appendFile(logFile, chunk).catch(() => {});
    },
  };
}

/**
 * Start the local Python backend on a free port and resolve once it answers.
 * The returned `stop` kills the process tree.
 */
export async function startBackend(options = {}) {
  const port = options.port ?? (await freePort());
  const logFile = options.logFile;
  if (logFile) await mkdir(resolve(logFile, ".."), { recursive: true });
  const captureOutput = capture(logFile);
  const backend = await launchBackend({
    port,
    host: "127.0.0.1",
    env: {
      NORI_DISABLE_LIVE_PACK: "1",
      OPENAI_API_KEY: "",
      ANTHROPIC_API_KEY: "",
      ...options.env,
    },
    stdio: ["ignore", "pipe", "pipe"],
    readyTimeoutMs: options.timeoutMs ?? 20_000,
    onOutput: captureOutput.onOutput,
    pythonCommand: options.python ?? process.env.NORI_TEST_PYTHON ?? "python",
  });
  return { port, origin: backend.origin, log: captureOutput.log, stop: backend.stop };
}

/** Start the source app's Vite dev server on a free port. */
export async function startVite(options = {}) {
  const port = options.port ?? (await freePort());
  const server = await createServer({
    configFile: resolve(repoRoot, options.configFile ?? "frontend-src/app.vite.config.ts"),
    server: { host: "127.0.0.1", port, strictPort: true, hmr: false },
  });
  await server.listen();
  return {
    port,
    origin: `http://127.0.0.1:${port}`,
    close: () => server.close(),
  };
}

/** Launch Chromium with the shared WebGL policy. */
export function launchBrowser(options = {}) {
  return chromium.launch({ ...probeLaunchOptions(), ...options });
}

const isCi = Boolean(process.env.CI || process.env.GITHUB_ACTIONS);
const softwareRenderer = (process.env.NORI_TEST_ANGLE ?? (process.platform === "win32" ? "d3d11" : "swiftshader")) === "swiftshader";

/**
 * How many GPU-heavy probes may run at once.
 * A software renderer saturates the host well before a real GPU does.
 */
export function probeConcurrency() {
  if (process.env.NORI_PROBE_CONCURRENCY) return Number(process.env.NORI_PROBE_CONCURRENCY);
  return softwareRenderer || isCi ? 2 : 4;
}

/**
 * Run `fn({ output, timings })` and always release the resources it returns.
 * Failures keep a Playwright trace when `page` was published through the context.
 */
export async function withProbeEnv(name, fn) {
  const output = artifactDir(name);
  await mkdir(output, { recursive: true });
  const timings = [];
  const cleanups = [];
  const started = Date.now();
  let failed = false;
  try {
    await fn({
      output,
      timings,
      defer(cleanup) {
        cleanups.push(cleanup);
      },
      async time(label, step) {
        const mark = Date.now();
        const value = await step();
        timings.push({ label, seconds: (Date.now() - mark) / 1000 });
        return value;
      },
    });
  } catch (error) {
    failed = true;
    throw error;
  } finally {
    for (const cleanup of cleanups.reverse()) {
      try {
        await cleanup();
      } catch (error) {
        console.error(`[${name}] cleanup failed:`, error);
      }
    }
    timings.push({ label: "total", seconds: (Date.now() - started) / 1000, failed });
    const file = resolve(artifactDir("timings"), `${name}.json`);
    await mkdir(resolve(file, ".."), { recursive: true });
    const { writeFile } = await import("node:fs/promises");
    await writeFile(file, JSON.stringify({ name, failed, timings }, null, 2));
  }
}
