import assert from "node:assert/strict";
import test from "node:test";
import { ArtifactService } from "../../frontend-src/services/artifacts";
import { subscribeArtifactInvalidations } from "../../frontend-src/runtime/manifold-subscription";
import { WorldStore } from "../../frontend-src/runtime/world-store";
import { NoriSceneStore } from "../../frontend-src/state/nori-scene";
import { createSignalLocalReadFactsStore } from "../../frontend-src/apps/messenger-interactions";

test("artifact requests coalesce, but invalidation starts a fresh request and fences old cleanup", async () => {
  const requests: Array<{ resolve(value: unknown): void; reject(error: Error): void }> = [];
  const service = new ArtifactService({
    call: () => new Promise((resolve, reject) => requests.push({ resolve, reject })),
  } as any);
  const world = new WorldStore();
  const release = subscribeArtifactInvalidations(world, () => service.invalidate());
  try {
    const first = service.files();
    const shared = service.files();
    assert.equal(requests.length, 1);
    world.consume({ type: "event", channel: "manifold.artifacts.invalidated", payload: {} });
    const fresh = service.files();
    assert.equal(requests.length, 2);
    requests[0].resolve({ ok: true, artifacts: [{ id: "old" }] });
    const [a, b] = await Promise.all([first, shared]);
    assert.notEqual(a, b); // sorting one consumer's array must not affect another
    const sharedFresh = service.files();
    assert.equal(requests.length, 2); // old settlement did not remove the new flight
    requests[1].resolve({ ok: true, artifacts: [{ id: "new" }] });
    assert.equal((await fresh)[0].id, "new");
    assert.equal((await sharedFresh)[0].id, "new");
    const failed = service.files();
    requests[2].reject(new Error("offline"));
    await assert.rejects(failed, /offline/);
    const retry = service.files();
    assert.equal(requests.length, 4);
    requests[3].resolve({ ok: true, artifacts: [] });
    await retry;
  } finally {
    release();
  }
});

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
