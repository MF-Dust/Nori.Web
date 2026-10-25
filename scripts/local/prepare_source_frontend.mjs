import { spawnSync } from "node:child_process";
import { existsSync, statSync, readdirSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { repoRoot } from "../lib/paths.mjs";

/**
 * Local start helper: build the source frontend (frontend-src/) and stage the
 * same cutover candidate Cloudflare deploys, so the local server serves the
 * current source app instead of the historical public/index.html entry.
 *
 * Prints the candidate directory on the last stdout line. Exit code 0 only when
 * the candidate is ready. `--if-stale` skips the build when nothing under
 * frontend-src/ is newer than the last candidate.
 */
const candidate = resolve(repoRoot, ".artifacts/build/app/cutover-candidate");
const marker = join(candidate, "index.html");
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

function run(label, command, args, shell = false) {
  console.error(`[frontend] ${label}...`);
  const result = spawnSync(command, args, { cwd: repoRoot, stdio: ["ignore", 2, 2], shell: shell && process.platform === "win32" });
  return result.status === 0;
}

const stale = !existsSync(marker) || newestMtime(resolve(repoRoot, "frontend-src")) > statSync(marker).mtimeMs;
if (ifStale && !stale) {
  console.error("[frontend] source frontend is up to date");
  console.log(relative(repoRoot, candidate));
  process.exit(0);
}
if (!existsSync(resolve(repoRoot, "node_modules")) && !run("installing npm dependencies", "npm", ["ci"], true)) process.exit(1);
if (!run("building source frontend", "npm", ["run", "-s", "frontend:app:build"], true)) process.exit(1);
// Windows may briefly lock a just-removed directory (indexer/antivirus): retry the swap.
for (let attempt = 1; attempt <= 4; attempt++) {
  if (run(`staging candidate (attempt ${attempt})`, process.execPath, ["scripts/recovery/prepare_frontend_cutover_candidate.mjs"])) {
    console.log(relative(repoRoot, candidate));
    process.exit(0);
  }
  await new Promise((done) => setTimeout(done, 2000 * attempt));
}
process.exit(1);
