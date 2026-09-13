import test from "node:test";
import assert from "node:assert/strict";
import { advancePictionaryHint, createPictionaryHint, pictionaryHintDelay, pictionaryHintText, pictionaryHintTiming } from "../frontend-src/apps/pictionary-hints";
import { pictionaryStateSchema } from "../frontend-src/apps/pictionary-model";

test("English hints preserve punctuation, reveal repeated letters together, and defer the initial", () => {
  const original = createPictionaryHint("Balloon, moon!");
  assert.equal(pictionaryHintText(original), "_ _ _ _ _ _ _ ,  _ _ _ _ !");
  const next = advancePictionaryHint(original, .1, () => 0);
  assert.equal(original.revealed.size, 0);
  assert.equal(next.revealed.has(0), false);
  assert.deepEqual([...next.revealed], [4, 5, 10, 11]);
  assert.equal(pictionaryHintText(next), "_ _ _ _ O O _ ,  _ O O _ !");
  assert.equal(advancePictionaryHint(original, .92, () => 0).revealed.has(0), true);
  let complete = original;
  for (let step = 0; step < 10; step++) complete = advancePictionaryHint(complete, 1, () => 0);
  assert.equal(pictionaryHintText(complete), "B A L L O O N ,  M O O N !");
  assert.equal(advancePictionaryHint(complete, 1), complete);
  const punctuation = createPictionaryHint("123-!");
  assert.equal(advancePictionaryHint(punctuation, 1), punctuation);
});

test("Chinese hints accept null initials and expose initials without disclosing characters", () => {
  const pinyin: [string | null, string][] = [["p", "ing"], ["g", "uo"], [null, "an"]];
  const value = pictionaryStateSchema.parse({ settings: { sessionDurationMs: 180000, inferenceMode: "fast", locale: "zh-CN" },
    gameState: { phase: "PLAYING", score: { solved: 0, skipped: 0 }, history: [], round: {
      roundId: "chinese", startedAtMs: 0, word: "苹果安", drawingId: "apple", pinyin,
      roles: { drawer: "agent", guesser: "player" }, status: "active",
    } } });
  assert.deepEqual(value.gameState!.round.pinyin, pinyin);
  const initial = createPictionaryHint("苹果安", "zh-CN", pinyin);
  assert.equal(pictionaryHintText(initial), "__ __ __");
  assert.equal(pictionaryHintText(advancePictionaryHint(initial, .1, () => 0)), "__ __ a");
  assert.equal(pictionaryHintText(advancePictionaryHint(initial, 1, () => 0)), "p_ g_ a");
  const missing = createPictionaryHint("苹果", "zh-CN");
  assert.equal(pictionaryHintText(advancePictionaryHint(missing, 1)), "__ __");
});

test("Hint cadence adapts to word difficulty and accelerates cubically within shipped bounds", () => {
  const easy = createPictionaryHint("idea"), hard = createPictionaryHint("quizzically");
  assert.ok(pictionaryHintTiming(hard).initialDelay < pictionaryHintTiming(easy).initialDelay);
  for (const hint of [easy, hard, createPictionaryHint("", "zh-CN", [])]) {
    const timing = pictionaryHintTiming(hint);
    assert.ok(timing.initialDelay >= 2500 && timing.initialDelay <= 6000);
    assert.equal(pictionaryHintDelay(hint, -1), timing.maxDelay);
    assert.equal(pictionaryHintDelay(hint, 2), timing.minDelay);
    assert.equal(pictionaryHintDelay(hint, .5), timing.maxDelay - (timing.maxDelay - timing.minDelay) / 8);
  }
});
