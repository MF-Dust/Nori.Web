import assert from "node:assert/strict";
import test from "node:test";
import {
  MEMORY_PHASES,
  memoryProjection,
} from "../../frontend-src/story/memory-scene";
import { power2In, power2Out } from "../../frontend-src/story/story-ease";

const phaseStart = (id: string) =>
  MEMORY_PHASES.slice(
    0,
    MEMORY_PHASES.findIndex((phase) => phase.id === id),
  ).reduce((sum, phase) => sum + phase.duration, 0);

test("memory alert and tint follow the shipped DJ rise, hold, and fall", () => {
  const attack = phaseStart("attack");
  const voidAt = phaseStart("void");
  const voidDur = MEMORY_PHASES.find((phase) => phase.id === "void")!.duration;
  const fallDelay = Math.min(1, voidDur * 0.45);
  const fallDur = voidDur - fallDelay;
  // DJ: f = min(1, voidDur * 0.45) = 1, fall = voidDur - f = 1.4.
  assert.equal(fallDelay, 1);
  assert.equal(fallDur, 1.4);
  assert.equal(power2In(0.5), 0.125);

  const exact: Array<[number, number]> = [
    [attack, 0],
    [attack + 1.2, 1],
    [voidAt, 1],
    [voidAt + 1, 1],
    [voidAt + 1 + 1.4, 0],
  ];
  for (const [time, alert] of exact) {
    const projected = memoryProjection(time);
    assert.equal(projected.alert, alert);
    assert.equal(projected.tint, 0.55 * projected.alert);
  }
  // 0.6s into the 1.2s rise is t = 0.5, and power2.in is t^3. Phase-start
  // addition leaves t one ulp off 0.5, so this is the cubic, not a bit-identical 0.125.
  const risen = memoryProjection(attack + 0.6);
  assert.ok(Math.abs(risen.alert - power2In(0.5)) < 1e-9);
  assert.equal(risen.tint, 0.55 * risen.alert);
  // Halfway down the power2.out fall is 1 - 0.875, not a linear 0.5.
  const falling = memoryProjection(voidAt + 1 + 0.7);
  assert.ok(Math.abs(falling.alert - (1 - power2Out(0.5))) < 1e-9);
  assert.equal(falling.tint, 0.55 * falling.alert);
});
