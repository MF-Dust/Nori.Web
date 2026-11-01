import { spawnSync } from "node:child_process";
import { existsSync, statSync, readdirSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { repoRoot } from "../lib/paths.mjs";

/**
 * Local start helper: build the source frontend (frontend-src/) into
 * .artifacts/build/app, which nori-local serves layered over public/.
 *
 * Prints the build directory on the last stdout line. Exit code 0 only when
 * the build is ready. `--if-stale` skips the build when nothing under
 * frontend-src/ is newer than the last build.
 */
const build = resolve(repoRoot, ".artifacts/build/app");
const marker = join(build, "index.html");
const ifStale = process.argv.includes("--if-stale");

function newestMtime(directory) {
  let newest = 0;
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) newest = Math.max(newest, newestMtime(path));
    else newest = Math.max(newest, statSync(path).mtimeMs);
  }
  return newest;
}

function run(label, command, args) {
  console.error(`[frontend] ${label}...`);
  const result = spawnSync(command, args, { cwd: repoRoot, stdio: ["ignore", 2, 2], shell: process.platform === "win32" });
  return result.status === 0;
}

const stale = !existsSync(marker) || newestMtime(resolve(repoRoot, "frontend-src")) > statSync(marker).mtimeMs;
if (ifStale && !stale) {
  console.error("[frontend] source frontend is up to date");
} else {
  if (!existsSync(resolve(repoRoot, "node_modules")) && !run("installing npm dependencies", "npm", ["ci"])) process.exit(1);
  if (!run("building source frontend", "npm", ["run", "-s", "frontend:app:build"])) process.exit(1);
}
console.log(relative(repoRoot, build));
