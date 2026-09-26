import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { gunzipSync } from "node:zlib";
import { decodeMarginalGrowthCache } from "../../frontend-src/apps/marginal-growth/decode";
import {
  MarginalGrowthSegments,
  MarginalGrowthTopology,
} from "../../frontend-src/apps/marginal-growth/topology";

const SHAPES = ["circle", "chubby", "spiky", "nori"] as const;

function inflateCache(shape: (typeof SHAPES)[number]): ArrayBuffer {
  const compressed = readFileSync(`public/marginal-growth-cache-${shape}.bin`);
  const raw = gunzipSync(compressed);
  const buffer = new ArrayBuffer(raw.byteLength);
  new Uint8Array(buffer).set(raw);
  return buffer;
}

test("shipped marginal-growth caches decode into topology and one segment per node", () => {
  for (const shape of SHAPES) {
    const cache = decodeMarginalGrowthCache(inflateCache(shape));
    assert.equal(typeof cache.signature, "string", shape);
    assert.ok(cache.signature.length > 0, shape);
    assert.ok(Number.isInteger(cache.maxSteps) && cache.maxSteps > 0, shape);
    assert.ok(cache.nodes.length > 0, shape);
    assert.equal(cache.dirtyChunksByStep.length, cache.maxSteps + 1, shape);

    const topology = new MarginalGrowthTopology(cache);
    assert.equal(topology.nodeCount, cache.nodes.length, shape);
    for (let index = 0; index < topology.nodeCount; index++) {
      const parentIdx = topology.parentIdx[index];
      assert.ok(
        parentIdx === -1 || (parentIdx >= 0 && parentIdx < topology.nodeCount),
        `${shape} parentIdx ${parentIdx} at ${index}`,
      );
      assert.ok(Number.isFinite(topology.chainDist[index]), `${shape} chainDist ${index}`);
      assert.ok(
        Number.isFinite(topology.branchLen[index]) && topology.branchLen[index] >= 0,
        `${shape} branchLen ${index}`,
      );
    }

    const segments = new MarginalGrowthSegments(topology, cache, 8, 20, 20, 1);
    let visits = 0;
    segments.forEach((scratch) => {
      visits += 1;
      assert.ok(Number.isFinite(scratch.ax) && Number.isFinite(scratch.ay), shape);
      assert.ok(Number.isFinite(scratch.bx) && Number.isFinite(scratch.by), shape);
    });
    assert.equal(visits, topology.nodeCount, shape);
  }
});

test("decode rejects a buffer that is not a marginal-growth cache", () => {
  assert.throws(() => decodeMarginalGrowthCache(new ArrayBuffer(16)), /bad magic/);
});
