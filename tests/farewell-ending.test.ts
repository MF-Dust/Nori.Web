import assert from "node:assert/strict";
import test from "node:test";
import { StoryClock } from "../frontend-src/story/story-clock";
import { FAREWELL_CUES, FAREWELL_CUT_AT, FAREWELL_DURATION, farewellFrame } from "../frontend-src/story/farewell-timeline";
import { ENDING_PHASES, endingCamera, endingFrame } from "../frontend-src/story/ending-timeline";

test("farewell preserves cue boundaries and hard cut", () => {
  assert.equal(FAREWELL_CUES.length, 21);
  assert.equal(FAREWELL_CUES[0].at, 8.4);
  assert.ok(FAREWELL_CUES.every((cue, index) => index === 0 || cue.at >= FAREWELL_CUES[index - 1].until));
  assert.equal(farewellFrame(FAREWELL_CUT_AT - 0.001).black, false);
  assert.equal(farewellFrame(FAREWELL_CUT_AT).black, true);
  assert.equal(FAREWELL_DURATION - FAREWELL_CUT_AT, 5);
});

test("ending remains parked until the matching wake action", () => {
  const clock = new StoryClock(ENDING_PHASES);
  clock.advance(0);
  const parked = clock.advance(1_000_000);
  assert.equal(parked.parkedAt, "ready");
  assert.equal(parked.complete, false);
  assert.equal(clock.wake("wrong", 1_000_001), false);
  assert.equal(clock.wake("ready", 1_000_001), true);
  assert.equal(clock.advance(1_004_200).complete, true);
});

test("ending wake projection closes the ocean and emits a burst", () => {
  const before = endingFrame(35, false);
  const after = endingFrame(35, true);
  assert.equal(before.coldOpen.oceanFade, 1);
  assert.ok(after.coldOpen.oceanFade < before.coldOpen.oceanFade);
  assert.ok(after.burst > 0);
});

test("ending camera reaches the evidenced arrival, face and desktop views", () => {
  const arrival = endingCamera(17.6).camera;
  assert.ok(Math.abs(arrival.y - 1.1) < 1e-9);
  assert.ok(Math.abs(arrival.z - 13.5) < 1e-9);
  assert.deepEqual(endingCamera(32.6).camera, { x: 0, y: 1.75, z: 7.4 });
  const desktop = endingCamera(35.4);
  assert.deepEqual(desktop.camera, { x: 0, y: 0, z: 7.4 });
  assert.equal(desktop.fov, 60);
});
