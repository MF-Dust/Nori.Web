import assert from "node:assert/strict";
import test from "node:test";
import type { Live2DModel, MotionStep } from "../frontend-src/live2d/engine.js";
import {
  NORI_REACTIONS,
  NoriReactionDirector,
} from "../frontend-src/live2d/reaction-director";

function modelFixture() {
  const motions: MotionStep[] = [];
  const expressions: string[] = [];
  const removed: string[] = [];
  const model = {
    startMotion({ steps }: { steps: MotionStep | MotionStep[] }) {
      motions.push(Array.isArray(steps) ? steps[0] : steps);
    },
    addExpression(name: string) {
      expressions.push(name);
    },
    removeExpression(name: string) {
      removed.push(name);
    },
  } as Live2DModel;
  return { model, motions, expressions, removed };
}

test("reaction director preserves shipped semantic catalogs", () => {
  assert.deepEqual(Object.keys(NORI_REACTIONS.pictionary), [
    "playerCorrect",
    "noriCorrectFast",
    "noriCorrectSlow",
    "playerWrong",
    "noriWrong",
    "skipNoriDrawing",
    "skipPlayerDrawing",
    "sessionGreat",
    "sessionOk",
    "sessionPoor",
  ]);
  assert.deepEqual(Object.keys(NORI_REACTIONS.chess), [
    "captureMinor",
    "captureMajor",
    "lostMajorPiece",
    "checked",
    "givesCheck",
    "playerPromotes",
    "acceptsRequest",
    "declinesRequest",
    "wins",
    "loses",
    "draw",
  ]);
  assert.deepEqual(Object.keys(NORI_REACTIONS.codenames), [
    "guessAlly",
    "guessStreak",
    "guessBystander",
    "herClueMissed",
    "assassin",
    "win",
    "loss",
  ]);
});

test("reaction director applies chance before variant selection and exact assets", () => {
  const fixture = modelFixture();
  let values = [0.9, 0, 0.99];
  const director = new NoriReactionDirector(
    () => 10_000,
    () => values.shift() ?? 0,
  );
  director.bindModel(fixture.model);
  assert.equal(
    director.play("pictionary", "playerCorrect").outcome,
    "skipped_chance",
  );
  assert.equal(director.play("chess", "captureMinor").outcome, "played");
  assert.deepEqual(fixture.motions, []);
  assert.deepEqual(fixture.expressions, ["07_Smile"]);
  director.reset();
  assert.deepEqual(fixture.removed, ["07_Smile"]);
});

test("reaction director enforces shipped motion cooldowns only for motion variants", () => {
  const fixture = modelFixture();
  let now = 10_000;
  const director = new NoriReactionDirector(
    () => now,
    () => 0,
  );
  director.bindModel(fixture.model);
  assert.equal(director.play("chess", "captureMinor").outcome, "played");
  now += 6_999;
  assert.equal(
    director.play("pictionary", "playerCorrect").outcome,
    "skipped_cooldown",
  );
  assert.equal(director.play("chess", "checked").outcome, "played");
  now += 1;
  assert.equal(director.play("pictionary", "playerCorrect").outcome, "played");
  assert.deepEqual(fixture.motions, [
    { group: "Reactions", index: 0 },
    { group: "Reactions", index: 0 },
  ]);
  assert.deepEqual(fixture.expressions, ["01_KiraKira", "14_Surprised"]);
  assert.deepEqual(fixture.removed, ["01_KiraKira"]);
  director.reset();
  assert.deepEqual(fixture.removed, ["01_KiraKira", "14_Surprised"]);
});

test("reaction director blocks lifecycle conflicts and stale model unbinds", () => {
  const first = modelFixture();
  const second = modelFixture();
  const director = new NoriReactionDirector(() => 10_000, () => 0);
  assert.equal(director.play("codenames", "assassin").outcome, "no_model");
  const unbindFirst = director.bindModel(first.model);
  director.setBlocked(true);
  assert.equal(director.play("codenames", "assassin").outcome, "blocked");
  director.setBlocked(false);
  director.bindModel(second.model);
  unbindFirst();
  assert.equal(director.play("codenames", "assassin").outcome, "played");
  assert.deepEqual(first.motions, []);
  assert.deepEqual(second.motions, [{ group: "Reactions", index: 4 }]);
  assert.deepEqual(second.expressions, ["05_Dark"]);
  director.setBlocked(true);
  assert.deepEqual(second.removed, ["05_Dark"]);
});

test("reaction cleanup is owned and cannot detach a replacement model", () => {
  const first = modelFixture();
  const second = modelFixture();
  const director = new NoriReactionDirector(() => 10_000, () => 0);
  const unbindFirst = director.bindModel(first.model);
  assert.equal(director.play("chess", "checked").outcome, "played");
  director.bindModel(second.model);
  assert.deepEqual(first.removed, ["14_Surprised"]);
  assert.equal(director.play("chess", "checked").outcome, "played");
  unbindFirst();
  assert.deepEqual(second.removed, []);
  director.reset();
  assert.deepEqual(second.removed, ["14_Surprised"]);
});
