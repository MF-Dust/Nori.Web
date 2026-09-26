import { build } from "esbuild";
import { mkdtemp, rm } from "node:fs/promises";
import { availableParallelism } from "node:os";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { repoRoot } from "../lib/paths.mjs";
import { groups } from "../../tests/frontend/manifest.mjs";

/**
 * Bundle every frontend node test in one esbuild call, then run them in one
 * `node --test` process. Each file still executes in its own test process.
 *
 * Usage: node scripts/test/run_node_tests.mjs [group ...]
 * Groups: games, runtime, stories, suites, or `all`.
 */
const requested = process.argv.slice(2);
const selected = requested.length === 0 || requested.includes("all")
  ? Object.keys(groups)
  : requested;
for (const name of selected) {
  if (!Object.hasOwn(groups, name)) {
    throw new Error(`unknown test group ${name}; expected ${Object.keys(groups).join(", ")}`);
  }
}

const directory = await mkdtemp(join(tmpdir(), "nori-frontend-tests-"));
try {
  const entryPoints = {};
  for (const name of selected) {
    for (const entry of groups[name]) {
      entryPoints[entry.replace(/^tests\//, "").replace(/\.[^.]+$/, "")] = entry;
    }
  }
  await build({
    absWorkingDir: repoRoot,
    entryPoints,
    outdir: directory,
    bundle: true,
    platform: "node",
    format: "esm",
    target: "node22",
    sourcemap: "inline",
    outExtension: { ".js": ".mjs" },
  });
  const files = Object.keys(entryPoints).map((key) => join(directory, `${key}.mjs`));
  const concurrency = Math.max(1, (availableParallelism?.() ?? 4) - 1);
  const result = spawnSync(
    process.execPath,
    ["--test", `--test-concurrency=${concurrency}`, ...files],
    { stdio: "inherit", cwd: repoRoot },
  );
  if (result.status !== 0) process.exitCode = result.status ?? 1;
} finally {
  await rm(directory, { recursive: true, force: true });
}
