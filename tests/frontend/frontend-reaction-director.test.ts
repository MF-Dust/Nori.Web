import assert from "node:assert/strict";
import test from "node:test";
import type { Live2DModel, MotionStep } from "../../frontend-src/live2d/engine.js";
import {
  CAKE_DUEL_TELL_WEIGHTS,
  NORI_PHASE_MOODS,
  NORI_REACTIONS,
  NoriReactionDirector,
  sampleCakeDuelTell,
} from "../../frontend-src/live2d/reaction-director";

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
  assert.deepEqual(Object.keys(NORI_REACTIONS.cakeduel), [
    "challenged",
    "bluffCaught",
    "vindicated",
    "challengeWins",
    "challengeFails",
    "losesCake",
    "wolfyTaunt",
    "wins",
    "loses",
  ]);
  assert.deepEqual(
    NORI_PHASE_MOODS.map((mood) => [mood.id, mood.expression]),
    [
      ["codenames.sudden_death", "12_Serious"],
      ["cakeduel.last_cake", "08_Tears"],
    ],
  );
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


test("debug reaction options force exact variants and can bypass cooldown", () => {
  const fixture = modelFixture();
  let now = 1_000;
  const director = new NoriReactionDirector(() => now, () => 0.99);
  director.bindModel(fixture.model);
  const forced = director.play("pictionary", "playerCorrect", {
    ignoreChance: true,
    ignoreCooldown: true,
    variantIndex: 2,
  });
  assert.equal(forced.outcome, "played");
  assert.equal(forced.variant?.expression, "07_Smile");
  assert.deepEqual(fixture.motions, []);
  director.interrupt();

  assert.equal(
    director.play("chess", "captureMajor", {
      ignoreChance: true,
      ignoreCooldown: true,
      variantIndex: 0,
    }).outcome,
    "played",
  );
  now += 1;
  assert.equal(
    director.play("pictionary", "playerCorrect", {
      ignoreChance: true,
      variantIndex: 0,
    }).outcome,
    "skipped_cooldown",
  );
  assert.ok(director.cooldownRemaining("minor") > 0);
  assert.equal(
    director.play("pictionary", "playerCorrect", {
      ignoreChance: true,
      ignoreCooldown: true,
      variantIndex: 0,
    }).outcome,
    "played",
  );
  director.reset();
});

test("persistent phase moods layer with temporary reactions and clean up ownership", () => {
  const fixture = modelFixture();
  const director = new NoriReactionDirector(() => 5_000, () => 0);
  director.bindModel(fixture.model);
  assert.equal(director.setMood("08_Tears"), true);
  assert.equal(director.mood(), "08_Tears");
  assert.equal(
    director.play("chess", "checked", {
      ignoreChance: true,
      variantIndex: 0,
    }).outcome,
    "played",
  );
  assert.deepEqual(fixture.expressions, ["08_Tears", "14_Surprised"]);
  director.interrupt();
  assert.deepEqual(fixture.removed, ["14_Surprised"]);
  assert.equal(director.mood(), "08_Tears");
  assert.equal(director.clearMood(), true);
  assert.deepEqual(fixture.removed, ["14_Surprised", "08_Tears"]);
  director.reset();
});

test("Cake Duel tell sampling preserves shipped soft-correlation thresholds", () => {
  assert.deepEqual(CAKE_DUEL_TELL_WEIGHTS, {
    bluff: { confident: 0.15, nervous: 0.25 },
    honest: { confident: 0.25, nervous: 0.15 },
  });
  assert.equal(sampleCakeDuelTell("bluff", 0.149), "confident");
  assert.equal(sampleCakeDuelTell("bluff", 0.15), "nervous");
  assert.equal(sampleCakeDuelTell("bluff", 0.399), "nervous");
  assert.equal(sampleCakeDuelTell("bluff", 0.4), "none");
  assert.equal(sampleCakeDuelTell("honest", 0.249), "confident");
  assert.equal(sampleCakeDuelTell("honest", 0.25), "nervous");
  assert.equal(sampleCakeDuelTell("honest", 0.4), "none");
});

test("Cake Duel tell reactions use the production director and bypass motion cooldown", () => {
  const fixture = modelFixture();
  const values = [0.1];
  const director = new NoriReactionDirector(
    () => 0,
    () => values.shift() ?? 0,
  );
  director.bindModel(fixture.model);
  const result = director.playCakeDuelTell("honest");
  assert.equal(result.tell, "confident");
  assert.equal(result.reaction?.outcome, "played");
  assert.deepEqual(fixture.expressions, ["07_Smile"]);
  director.reset();
});
