import test from "node:test";
import assert from "node:assert/strict";
import {
  getIdleMarginalGrowthPhase,
  getIdleMarginalGrowthSteps,
} from "../frontend-src/apps/idle-economy";
import { DEFAULT_IDLE_GENERATORS } from "../frontend-src/apps/idle-default-data";
import type { IdleGeneratorDefinition } from "../frontend-src/apps/idle";

/** Shipped marginalGrowthStore + NormalApp exports av/aw/ax. */
const K_REF = 410;
const EXPONENT = 6;
const STEP_OFFSET = 90;
const MAX_STEPS = 700;

const GENERATORS = DEFAULT_IDLE_GENERATORS as readonly IdleGeneratorDefinition[];

function ownEach(count: number): Record<string, number> {
  return Object.fromEntries(GENERATORS.map((generator) => [generator.id, count]));
}

function stepsAtEach(count: number): number {
  const phase = getIdleMarginalGrowthPhase({
    generators: GENERATORS,
    owned: ownEach(count),
    kRef: K_REF,
    exponent: EXPONENT,
  });
  return getIdleMarginalGrowthSteps({ phase, stepOffset: STEP_OFFSET, maxSteps: MAX_STEPS });
}

/**
 * The shipped generator table is the only growth input; a drifted weight would
 * silently move every pinned number below.
 */
test("shipped generator table is 24 rows totalling 22.5 growthWeight", () => {
  assert.equal(GENERATORS.length, 24);
  assert.ok(
    Math.abs(
      GENERATORS.reduce((total, generator) => total + generator.growthWeight, 0) -
        22.5,
    ) < 1e-12,
  );
});

test("phase is the shipped log-of-owns curve, not a linear share", () => {
  const phase = getIdleMarginalGrowthPhase({
    generators: GENERATORS,
    owned: ownEach(1),
    kRef: K_REF,
    exponent: EXPONENT,
  });
  // 22.5 * ln(2) / 410, then the exponent-6 shaping.
  const raw = (22.5 * Math.log(2)) / K_REF;
  assert.ok(Math.abs(phase - (1 - (1 - raw) ** 6)) < 1e-12);
  assert.ok(phase > raw, "exponent 6 must ease small progress upward");
  assert.ok(phase < 0.5, "one of each is still early on the curve");
});

test("pinned step counts reproduce the shipped Idle ribbon", () => {
  assert.equal(stepsAtEach(0), STEP_OFFSET, "nothing owned rests on stepOffset");
  assert.equal(Math.round(stepsAtEach(1)), 217);
  assert.equal(Math.round(stepsAtEach(10)), 438);
  assert.equal(Math.round(stepsAtEach(100)), 594);
  // Saturates at maxSteps once the weighted log total passes kRef.
  assert.equal(
    stepsAtEach(Math.ceil(Math.exp(K_REF / 22.5) - 1)),
    MAX_STEPS,
  );
  assert.equal(stepsAtEach(Number.MAX_SAFE_INTEGER), MAX_STEPS);
});

test("kRef <= 0 pins the phase to zero instead of dividing by it", () => {
  for (const kRef of [0, -1]) {
    assert.equal(
      getIdleMarginalGrowthPhase({
        generators: GENERATORS,
        owned: ownEach(1_000),
        kRef,
        exponent: EXPONENT,
      }),
      0,
    );
  }
});

test("exponent 1 is the shipped linear bypass, sub-0.01 exponents are floored", () => {
  const owned = ownEach(10);
  const total = GENERATORS.reduce(
    (sum, generator) => sum + generator.growthWeight * Math.log(1 + 10),
    0,
  );
  assert.equal(
    getIdleMarginalGrowthPhase({
      generators: GENERATORS,
      owned,
      kRef: K_REF,
      exponent: 1,
    }),
    total / K_REF,
  );
  assert.equal(
    getIdleMarginalGrowthPhase({
      generators: GENERATORS,
      owned,
      kRef: K_REF,
      exponent: 0,
    }),
    getIdleMarginalGrowthPhase({
      generators: GENERATORS,
      owned,
      kRef: K_REF,
      exponent: 0.01,
    }),
  );
});

test("steps clamp stepOffset below maxSteps and ignore a degenerate maxSteps", () => {
  assert.equal(
    getIdleMarginalGrowthSteps({ phase: 1, stepOffset: 5_000, maxSteps: 700 }),
    700,
  );
  assert.equal(
    getIdleMarginalGrowthSteps({ phase: 0, stepOffset: 90, maxSteps: 700 }),
    90,
  );
  assert.equal(
    getIdleMarginalGrowthSteps({ phase: 1, stepOffset: 90, maxSteps: 0 }),
    1,
  );
  assert.equal(
    getIdleMarginalGrowthSteps({ phase: -5, stepOffset: 90, maxSteps: 700 }),
    90,
  );
  assert.equal(
    getIdleMarginalGrowthSteps({ phase: 5, stepOffset: 90, maxSteps: 700 }),
    700,
  );
});
