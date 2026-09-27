import assert from "node:assert/strict";
import test from "node:test";
import { NoriReactionDirector } from "../../frontend-src/live2d/reaction-director";
import {
  DEBUG_REACTION_GROUPS,
  debugReactionLabel,
  playDebugReaction,
} from "../../frontend-src/screens/debug-reactions-tab";

test("reaction debug groups expose every production-bound reaction", () => {
  assert.deepEqual(
    DEBUG_REACTION_GROUPS.map(({ game, entries }) => [game, entries.length]),
    [
      ["pictionary", 10],
      ["chess", 11],
      ["codenames", 7],
      ["cakeduel", 9],
    ],
  );
  assert.equal(debugReactionLabel("skipNoriDrawing"), "Skip Nori Drawing");
  assert.equal(
    DEBUG_REACTION_GROUPS[0].entries[1].label,
    "She solves fast (<30s)",
  );
  assert.equal(
    new Set(
      DEBUG_REACTION_GROUPS.flatMap(({ entries }) =>
        entries.map(({ game, id }) => `${game}:${id}`),
      ),
    ).size,
    37,
  );
});

test("reaction model listeners fire when a model is bound and released", () => {
  const reactions = new NoriReactionDirector(() => 0, () => 0);
  const seen: boolean[] = [];
  const unsubscribe = reactions.subscribeModel(() => seen.push(reactions.hasModel()));
  assert.equal(reactions.hasModel(), false);
  const model = { id: "mounted" } as never;
  const release = reactions.bindModel(model);
  release();
  unsubscribe();
  reactions.bindModel(model);
  assert.deepEqual(seen, [true, false]);
});

test("reaction debug dispatch uses the mounted production director", () => {
  const reactions = new NoriReactionDirector(
    () => 0,
    () => 0,
  );
  const result = playDebugReaction(
    { reactions },
    DEBUG_REACTION_GROUPS[0].entries[0],
  );
  assert.equal(result.outcome, "no_model");
  const forced = playDebugReaction(
    { reactions },
    DEBUG_REACTION_GROUPS[3].entries[0],
    { ignoreChance: true, ignoreCooldown: true, variantIndex: 1 },
  );
  assert.equal(forced.outcome, "no_model");
});
