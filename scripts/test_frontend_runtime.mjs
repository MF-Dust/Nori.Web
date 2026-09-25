import { build } from "esbuild";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";

const directory = await mkdtemp(join(tmpdir(), "nori-runtime-"));
try {
  const entries = [
    "tests/frontend-runtime.test.ts",
    "tests/frontend-notifications.test.ts",
    "tests/frontend-subscriptions.test.ts",
    "tests/frontend-browser-extension.test.ts",
    "tests/frontend-browser-bounty.test.ts",
  ];
  for (const [index, entry] of entries.entries()) {
    const outfile = join(directory, `runtime-${index}.test.mjs`);
    await build({
      entryPoints: [entry],
      outfile,
      bundle: true,
      platform: "node",
      format: "esm",
      target: "node22",
    });
    const result = spawnSync(process.execPath, ["--test", outfile], {
      stdio: "inherit",
    });
    if (result.status !== 0) process.exitCode = result.status ?? 1;
  }
} finally {
  await rm(directory, { recursive: true, force: true });
}
