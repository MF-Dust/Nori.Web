import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));

/** Repository root. This file lives at scripts/lib/. */
export const repoRoot = resolve(here, "../..");

/**
 * A gitignored run artifact directory.
 * `NORI_ARTIFACTS_DIR` relocates the whole tree; `NORI_ARTIFACT_<NAME>` relocates one.
 */
export function artifactDir(name) {
  const override = process.env[`NORI_ARTIFACT_${name.toUpperCase().replace(/[^A-Z0-9]/g, "_")}`];
  if (override) return resolve(override);
  const root = process.env.NORI_ARTIFACTS_DIR
    ? resolve(process.env.NORI_ARTIFACTS_DIR)
    : resolve(repoRoot, ".artifacts");
  return resolve(root, name);
}

/** A Playwright harness under tests/frontend/harness/. */
export function harnessPath(name) {
  return resolve(repoRoot, "tests", "frontend", "harness", name);
}
