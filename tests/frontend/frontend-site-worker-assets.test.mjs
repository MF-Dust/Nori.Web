import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { findFrontendWorkerAssetLeaks } from "../../scripts/verify/verify_frontend_site_worker_assets.mjs";

test("Worker asset guard allows shared license names but catches renamed payloads", async () => {
  const root = await mkdtemp(join(tmpdir(), "nori-worker-assets-"));
  const site = join(root, "site"),
    worker = join(root, "worker");
  try {
    await mkdir(site);
    await mkdir(worker);
    await writeFile(join(site, "LICENSE"), "shared dependency notice");
    await writeFile(join(worker, "LICENSE"), "shared dependency notice");
    await writeFile(
      join(site, "index.js"),
      "frontend application payload",
    );
    await writeFile(join(worker, "index.js"), "backend worker entry");
    assert.deepEqual(await findFrontendWorkerAssetLeaks(site, worker), []);
    await writeFile(join(worker, "renamed.js"), "frontend application payload");
    assert.deepEqual(await findFrontendWorkerAssetLeaks(site, worker), [
      { asset: "index.js", module: "renamed.js" },
    ]);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
