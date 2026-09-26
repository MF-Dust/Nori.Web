import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { basename, join, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";

// Dependency notices are legitimate in both distributions. A shared basename
// (especially LICENSE) does not prove that a frontend asset became a module.
const legalNotice = /^(?:licen[cs]e|notice|copying)(?:[.-].*)?$/i;

async function files(directory) {
  const result = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) result.push(...(await files(path)));
    else if (entry.isFile() && !legalNotice.test(entry.name)) result.push(path);
  }
  return result;
}

export async function findFrontendWorkerAssetLeaks(candidate, worker) {
  const hashes = new Map();
  for (const path of await files(candidate)) {
    const bytes = await readFile(path);
    if (!bytes.length) continue;
    const hash = createHash("sha256").update(bytes).digest("hex");
    hashes.set(hash, relative(candidate, path));
  }
  const leaks = [];
  for (const path of await files(worker)) {
    const bytes = await readFile(path);
    const hash = createHash("sha256").update(bytes).digest("hex");
    if (hashes.has(hash))
      leaks.push({ asset: hashes.get(hash), module: relative(worker, path) });
  }
  return leaks;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  const candidate = resolve(
    process.argv[2] || ".artifacts/build/app/cutover-candidate",
  );
  const worker = resolve(process.argv[3] || ".candidate-worker-dist");
  const leaks = await findFrontendWorkerAssetLeaks(candidate, worker);
  assert.deepEqual(
    leaks,
    [],
    "Frontend asset contents leaked into Worker modules",
  );
  console.log(
    `No frontend asset contents found in ${basename(worker)} modules`,
  );
}
