import { spawn } from "node:child_process";
import { access } from "node:fs/promises";
import { resolve } from "node:path";
import { repoRoot } from "./paths.mjs";

let cargoBuild;

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

function buildBackend() {
  return new Promise((resolveBuild, rejectBuild) => {
    let settled = false;
    const finish = (error) => {
      if (settled) return;
      settled = true;
      error ? rejectBuild(error) : resolveBuild();
    };
    const build = spawn(
      "cargo",
      ["build", "--release", "-p", "nori-local", "--manifest-path", "rust/Cargo.toml"],
      { cwd: repoRoot, stdio: "inherit", windowsHide: true },
    );
    build.once("error", (error) => {
      finish(error.code === "ENOENT"
        ? new Error("Rust backend is missing and Cargo is unavailable; install Rust/Cargo to build it.")
        : new Error(`Could not run Cargo to build the Rust backend: ${error.message}`));
    });
    build.once("close", (code) => {
      if (code === 0) finish();
      else finish(new Error(`Cargo failed to build the Rust backend (exit code ${code}).`));
    });
  });
}

async function resolveBackendBinary() {
  const override = process.env.NORI_BACKEND_BIN;
  const binary = override
    ? resolve(override)
    : resolve(repoRoot, "rust", "target", "release", process.platform === "win32" ? "nori-web.exe" : "nori-web");
  if (await exists(binary)) return binary;
  if (override) throw new Error(`NORI_BACKEND_BIN does not exist: ${binary}`);
  cargoBuild ??= buildBackend();
  await cargoBuild;
  if (!(await exists(binary))) throw new Error(`Cargo completed but the Rust backend was not found: ${binary}`);
  return binary;
}

function capture(child, onOutput) {
  let text = "";
  for (const stream of [child.stdout, child.stderr]) {
    stream?.on("data", (chunk) => {
      text = (text + chunk).slice(-16_000);
      onOutput?.(chunk);
    });
  }
  return () => text;
}

function hasExited(child) {
  return child.exitCode !== null || child.signalCode !== null;
}

async function stopTree(child) {
  if (!child?.pid) return;
  if (process.platform === "win32") {
    await new Promise((done) => {
      const killer = spawn("taskkill", ["/PID", String(child.pid), "/T", "/F"], {
        stdio: "ignore",
        windowsHide: true,
      });
      killer.once("error", () => {
        child.kill();
        done();
      });
      killer.once("close", done);
    });
    return;
  }

  try {
    process.kill(-child.pid, "SIGTERM");
  } catch {
    child.kill("SIGTERM");
  }
  await new Promise((done) => {
    const timer = setTimeout(done, 1000);
    child.once("close", () => {
      clearTimeout(timer);
      done();
    });
  });
  try {
    process.kill(-child.pid, "SIGKILL");
  } catch {
    // The process group has already exited.
  }
}

async function waitForReady(url, child, getLog, getSpawnError, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  let lastStatus;
  while (Date.now() < deadline) {
    const spawnError = getSpawnError();
    if (spawnError) throw new Error(`Could not start backend: ${spawnError.message}\n${getLog()}`);
    if (hasExited(child)) throw new Error(`Backend exited before ${url} responded:\n${getLog()}`);
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(1000) });
      lastStatus = response.status;
      if (response.status === 200) return;
    } catch {
      // The server is not listening yet.
    }
    await new Promise((done) => setTimeout(done, 100));
  }
  throw new Error(`Timed out waiting for ${url}${lastStatus ? ` (last HTTP status ${lastStatus})` : ""}:\n${getLog()}`);
}

/** Start the configured backend and wait for its entry-status endpoint. */
export async function startBackend({
  port,
  host = "127.0.0.1",
  env = {},
  publicDir,
  dataDir,
  stdio = ["ignore", "pipe", "pipe"],
  readyTimeoutMs = 60_000,
  onOutput,
  pythonCommand = process.env.NORI_TEST_PYTHON ?? process.env.PYTHON ?? "python",
  pythonArgs,
} = {}) {
  if (port == null) throw new Error("startBackend requires a port");
  const usePython = process.env.NORI_BACKEND === "python";
  const command = usePython ? pythonCommand : await resolveBackendBinary();
  const args = usePython
    ? pythonArgs ?? ["-m", "uvicorn", "server:app", "--host", host, "--port", String(port)]
    : [];
  const address = host === "0.0.0.0" || host === "::" ? "127.0.0.1" : host;
  const originHost = address.includes(":") ? `[${address}]` : address;
  const origin = `http://${originHost}:${port}`;
  const backendEnv = { ...process.env, ...env, HOST: host, PORT: String(port) };
  if (publicDir != null) backendEnv.NORI_PUBLIC_DIR = resolve(repoRoot, publicDir);
  if (dataDir != null) backendEnv.NORI_DATA_DIR = resolve(repoRoot, dataDir);

  let child;
  try {
    child = spawn(command, args, {
      cwd: repoRoot,
      env: backendEnv,
      stdio,
      detached: process.platform !== "win32",
      windowsHide: true,
    });
    let spawnError;
    child.once("error", (error) => { spawnError = error; });
    const log = capture(child, onOutput);
    await waitForReady(`${origin}/api/entry-status`, child, log, () => spawnError, readyTimeoutMs);
    let stopping;
    return {
      child,
      origin,
      log,
      stop: () => stopping ??= stopTree(child),
    };
  } catch (error) {
    await stopTree(child);
    throw error;
  }
}
