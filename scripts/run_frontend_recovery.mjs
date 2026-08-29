#!/usr/bin/env node

import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
let output = ".frontend-recovery";
for (let i = 0; i < args.length; i += 1) {
  if (args[i] === "--output" && args[i + 1]) {
    output = args[i + 1];
    i += 1;
  }
}

function run(script, scriptArgs) {
  const result = spawnSync(process.execPath, [path.join(ROOT, "scripts", script), ...scriptArgs], {
    cwd: ROOT,
    stdio: "inherit",
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

run("recover_frontend.mjs", args);
run("inventory_frontend_symbols.mjs", [output]);
