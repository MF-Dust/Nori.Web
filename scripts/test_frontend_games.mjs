import { build } from "esbuild";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
const directory = await mkdtemp(join(tmpdir(), "nori-games-"));
try {
  const outfile = join(directory, "games.test.mjs");
  await build({ entryPoints: ["tests/frontend-games.test.ts"], outfile, bundle: true, platform: "node", format: "esm", target: "node22" });
  const result = spawnSync(process.execPath, ["--test", outfile], { stdio: "inherit" });
  if (result.status !== 0) process.exitCode = result.status ?? 1;
} finally { await rm(directory, { recursive: true, force: true }); }
