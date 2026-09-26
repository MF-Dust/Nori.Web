import { build } from "esbuild";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";

/**
 * Every `tests/frontend-*.test.ts` suite, in one runner.
 *
 * The suites below had no entry in any `package.json` script and no CI job, so
 * they were green but never executed. Anything added here must stay listed in
 * exactly one runner; `tests/frontend-recovery-gaps.test.ts` re-runs the
 * scene-transport and scene-editor cases, which is deliberate duplication
 * rather than a missed count.
 */
const SUITES = [
  "frontend-antivirus",
  "frontend-audio",
  "frontend-chip",
  "frontend-cold-open",
  "frontend-debug-reactions-tab",
  "frontend-debug-system-tabs",
  "frontend-debug-tools",
  "frontend-head-pat-audio",
  "frontend-live2d-debug",
  "frontend-messenger-interactions",
  "frontend-messenger-model",
  "frontend-nori-scene",
  "frontend-pictionary-hints",
  "frontend-reaction-director",
  "frontend-recovery-gaps",
  "frontend-scene-editor",
  "frontend-scene-transport",
  "frontend-signal-story",
  "frontend-story-feedback",
  "frontend-voice-corruption",
  "frontend-window-localization",
];

const directory = await mkdtemp(join(tmpdir(), "nori-frontend-suites-"));
try {
  const outfiles = [];
  for (const suite of SUITES) {
    const outfile = join(directory, `${suite}.test.mjs`);
    await build({
      entryPoints: [`tests/${suite}.test.ts`],
      outfile,
      bundle: true,
      platform: "node",
      format: "esm",
      target: "node22",
    });
    outfiles.push(outfile);
  }
  const result = spawnSync(process.execPath, ["--test", ...outfiles], {
    stdio: "inherit",
  });
  if (result.status !== 0) process.exitCode = result.status ?? 1;
} finally {
  await rm(directory, { recursive: true, force: true });
}
