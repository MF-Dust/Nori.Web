import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  DRAIN_BURST_FRAGMENT_GLSL,
  DRAIN_BURST_INTERVAL_MS,
  DRAIN_BURST_VERTEX_GLSL,
  drainBurstPlays,
  stepDrainBurst,
} from "../../frontend-src/live2d/particles/drain-burst";

const shipped = readFileSync("public/assets/index-CyHAbkO5.js", "utf8");

test("drain-burst GLSL occurs verbatim in the shipped particle bundle", () => {
  assert.equal(typeof DRAIN_BURST_VERTEX_GLSL, "string");
  assert.equal(typeof DRAIN_BURST_FRAGMENT_GLSL, "string");
  assert.ok(
    shipped.includes(DRAIN_BURST_VERTEX_GLSL),
    "vertex shader drifted from index-CyHAbkO5.js",
  );
  assert.ok(
    shipped.includes(DRAIN_BURST_FRAGMENT_GLSL),
    "fragment shader drifted from index-CyHAbkO5.js",
  );
});

test("drain-burst re-fires every 180ms of scene time", () => {
  assert.equal(DRAIN_BURST_INTERVAL_MS, 180);
  assert.equal(drainBurstPlays(0), 1);
  assert.equal(drainBurstPlays(0.179), 1);
  const drain = 28.7;
  assert.equal(drainBurstPlays(drain + 0.18 - drain), 2);
  assert.equal(drainBurstPlays(0.36), 3);
});

test("a drain burst spawns 55 sprites and integrates them downward", () => {
  let seed = 1;
  const step = stepDrainBurst(0.25, () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  });
  assert.equal(step.count, 55);
  assert.equal(step.moved.length, 55);
  assert.ok(step.moved.every((sprite, index) => sprite.y < step.spawned[index].y));
});
