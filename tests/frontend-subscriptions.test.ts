import assert from "node:assert/strict";
import test from "node:test";
import { WorldStore } from "../frontend-src/runtime/world-store";
import { NoriSceneStore } from "../frontend-src/state/nori-scene";
import { createSignalLocalReadFactsStore } from "../frontend-src/apps/messenger-interactions";

test("source subscriptions return void cleanup functions", () => {
  const world = new WorldStore();
  const worldCleanup = world.subscribe(() => {});
  assert.equal(typeof worldCleanup, "function");
  assert.equal(worldCleanup(), undefined);

  const scene = new NoriSceneStore();
  const sceneCleanup = scene.subscribe(() => {});
  assert.equal(sceneCleanup(), undefined);

  const reads = createSignalLocalReadFactsStore();
  const readsCleanup = reads.subscribe(() => {});
  assert.equal(readsCleanup(), undefined);
});
