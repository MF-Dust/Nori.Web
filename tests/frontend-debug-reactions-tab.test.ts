import assert from "node:assert/strict";
import test from "node:test";
import { NoriReactionDirector } from "../frontend-src/live2d/reaction-director";
import {
  DEBUG_REACTION_GROUPS,
  debugReactionLabel,
  playDebugReaction,
} from "../frontend-src/screens/debug-reactions-tab";

test("reaction debug groups expose every production-bound reaction", () => {
  assert.deepEqual(
    DEBUG_REACTION_GROUPS.map(({ game, entries }) => [game, entries.length]),
    [
      ["pictionary", 10],
      ["chess", 11],
      ["codenames", 7],
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
    28,
  );
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
});
