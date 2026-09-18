import assert from "node:assert/strict";
import test from "node:test";
import { DATASEA_PHASES, dataseaCamera } from "../frontend-src/story/datasea-scene";
import { MEMORY_PHASES, memoryProjection } from "../frontend-src/story/memory-scene";
import { StoryClock } from "../frontend-src/story/story-clock";

test("memory retains all five ordered interaction gates", () => {
  const clock = new StoryClock(MEMORY_PHASES);
  clock.advance(0); clock.advance(2500);
  for (let index = 1; index <= 5; index++) {
    assert.equal(clock.snapshot().parkedAt, `win${index}`);
    assert.equal(clock.wake(`win${index}`, 2500 + index), true);
    clock.advance(2800 + index);
  }
  assert.equal(clock.snapshot().phase, "flood");
});

test("memory projection orders attack, sweep, drain, and void", () => {
  assert.equal(memoryProjection(20).attack, false);
  assert.equal(memoryProjection(21).attack, true);
  assert.equal(memoryProjection(28).sweep, true);
  assert.equal(memoryProjection(30).drain, true);
  assert.equal(memoryProjection(40).voidProgress > 0, true);
});

test("datasea parks only for route alignment and descends to evidence camera target", () => {
  assert.deepEqual(DATASEA_PHASES.filter((phase) => phase.pauseAtStart).map((phase) => phase.id), ["waves"]);
  assert.deepEqual(dataseaCamera(0).camera, { x: 0, y: 0, z: 7.4 });
  assert.equal(dataseaCamera(27).camera.y, -190);
  assert.ok(Math.abs(dataseaCamera(13).cameraRot.x + Math.PI / 2) < 1e-9);
});
