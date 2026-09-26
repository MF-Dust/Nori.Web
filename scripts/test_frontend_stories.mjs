import { build } from "esbuild";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
const directory = await mkdtemp(join(tmpdir(), "nori-stories-"));
try {
  const files = [];
  for (const entry of [
    "frontend-production-stories",
    "frontend-memory-datasea",
    "frontend-monotone-spline",
    "frontend-story-clock",
    "frontend-story-ease",
    "farewell-ending",
    "frontend-cult",
  ]) {
    const outfile = join(directory, entry + ".test.mjs");
    await build({
      entryPoints: [`tests/${entry}.test.ts`],
      outfile,
      bundle: true,
      platform: "node",
      format: "esm",
      target: "node22",
    });
    files.push(outfile);
  }
  const result = spawnSync(process.execPath, ["--test", ...files], {
    stdio: "inherit",
  });
  if (result.status !== 0) process.exitCode = result.status ?? 1;
} finally {
  await rm(directory, { recursive: true, force: true });
}
