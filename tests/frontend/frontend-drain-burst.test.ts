import assert from "node:assert/strict";
import test from "node:test";
import {
  DRAIN_BURST_INTERVAL_MS,
  drainBurstPlays,
} from "../../frontend-src/live2d/particles/drain-burst";

test("drain-burst re-fires every 180ms of scene time", () => {
  assert.equal(DRAIN_BURST_INTERVAL_MS, 180);
  assert.equal(drainBurstPlays(0), 1);
  assert.equal(drainBurstPlays(0.179), 1);
  const drain = 28.7;
  assert.equal(drainBurstPlays(drain + 0.18 - drain), 2);
  assert.equal(drainBurstPlays(0.36), 3);
});
