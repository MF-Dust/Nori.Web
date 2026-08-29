#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUTPUT = path.join(ROOT, ".frontend-recovery-ci");

function run(script, args = []) {
  const result = spawnSync(process.execPath, [path.join(ROOT, "scripts", script), ...args], {
    cwd: ROOT,
    stdio: "inherit",
  });
  if (result.status !== 0) throw new Error(`${script} failed with exit code ${result.status}`);
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function main() {
  await fs.rm(OUTPUT, { recursive: true, force: true });
  try {
    run("recover_frontend.mjs", ["--metadata-only", "--output", ".frontend-recovery-ci"]);
    run("inventory_frontend_symbols.mjs", [".frontend-recovery-ci"]);

    const manifest = JSON.parse(await fs.readFile(path.join(OUTPUT, "manifest.json"), "utf8"));
    const symbols = JSON.parse(await fs.readFile(path.join(OUTPUT, "SYMBOL_INDEX.json"), "utf8"));
    const files = new Set(manifest.chunks.map((chunk) => chunk.file));

    assert(manifest.bundleCount >= 40, `expected at least 40 shipped JS chunks, got ${manifest.bundleCount}`);
    assert(symbols.chunks.length === manifest.bundleCount, "symbol inventory must cover every analyzed chunk");

    const requiredPrefixes = [
      "NormalApp-",
      "LoginPage-",
      "BrowserApp-",
      "MailScreen-",
      "FilesScreen-",
      "MessengerScreen-",
      "ChatPanel-",
      "ChessScreen-",
    ];
    for (const prefix of requiredPrefixes) {
      assert([...files].some((file) => file.startsWith(prefix)), `missing expected shipped chunk ${prefix}*`);
    }

    for (const feature of ["auth", "arcade", "chat", "browser", "mail", "files", "messenger", "chess"]) {
      assert(Array.isArray(symbols.byFeature[feature]) && symbols.byFeature[feature].length > 0, `missing recovered feature group: ${feature}`);
    }

    console.log(`[ok] frontend recovery covers ${manifest.bundleCount} shipped JavaScript chunks`);
  } finally {
    await fs.rm(OUTPUT, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
