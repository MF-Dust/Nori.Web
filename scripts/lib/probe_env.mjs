import { spawn } from "node:child_process";
import { createServer as createNetServer } from "node:net";
import { mkdir, appendFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createServer } from "vite";
import { chromium } from "playwright";
import { probeLaunchOptions } from "./probe_launch.mjs";
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

async function waitForHttp(url, child, log, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error(`process exited before ${url} responded:\n${log()}`);
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // The server is not listening yet.
    }
    await new Promise((done) => setTimeout(done, 100));
  }
  throw new Error(`timed out waiting for ${url}:\n${log()}`);
}

function capture(child, logFile) {
  let text = "";
  const onData = (chunk) => {
    text = (text + chunk).slice(-12_000);
    if (logFile) appendFile(logFile, chunk).catch(() => {});
  };
  child.stdout?.on("data", onData);
  child.stderr?.on("data", onData);
  return () => text;
}

/**
 * Start the local Python backend on a free port and resolve once it answers.
 * The returned `stop` kills the process tree.
 */
export async function startBackend(options = {}) {
  const port = options.port ?? (await freePort());
  const origin = `http://127.0.0.1:${port}`;
  const logFile = options.logFile;
  if (logFile) await mkdir(resolve(logFile, ".."), { recursive: true });
  const child = spawn(
    options.python ?? process.env.NORI_TEST_PYTHON ?? "python",
    ["-m", "uvicorn", "server:app", "--host", "127.0.0.1", "--port", String(port)],
    {
      cwd: repoRoot,
      env: {
        ...process.env,
        NORI_DISABLE_LIVE_PACK: "1",
        OPENAI_API_KEY: "",
        ANTHROPIC_API_KEY: "",
        ...options.env,
      },
      stdio: ["ignore", "pipe", "pipe"],
      detached: process.platform !== "win32",
      windowsHide: true,
    },
  );
  const log = capture(child, logFile);
  try {
    await waitForHttp(`${origin}/api/auth/get-session`, child, log, options.timeoutMs ?? 20_000);
  } catch (error) {
    await killTree(child);
    throw error;
  }
  return {
    port,
    origin,
    log,
    stop: () => killTree(child),
  };
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
