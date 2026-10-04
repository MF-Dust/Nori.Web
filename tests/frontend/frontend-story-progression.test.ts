import assert from "node:assert/strict";
import test from "node:test";
import { bindSourceStoryProgression, corruptionDocument } from "../../frontend-src/story/story-progression";
import { createSourceIdleRuntimeEngine } from "../../frontend-src/state/idle-runtime-engine";
import type { ManagedWindow } from "../../frontend-src/state/window-types";

const flush = async () => { await Promise.resolve(); await Promise.resolve(); };
const popup = (id: string) => ({
  appId: "browser", windowType: "popup", minimized: false,
  props: { url: `https://[2001:db8:f7c0::1a]/file/d/${id}/view` },
}) as ManagedWindow;

function fixture() {
  let world: string | null = "one";
  const facts = new Set<string>();
  const desktop = { windows: {} as Record<string, ManagedWindow>, focusedWindowId: null as string | null };
  const listeners = new Set<() => void>();
  const emitted: string[] = [];
  const subscribe = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; };
  const release = bindSourceStoryProgression({
    getWorldId: () => world, getFacts: () => facts, getDesktop: () => desktop,
    subscribeFacts: subscribe, subscribeWindows: subscribe,
    emitFact: async (fact) => { emitted.push(`${world}:${fact}`); facts.add(fact); },
  });
  return { facts, desktop, emitted, release,
    update: () => { for (const listener of listeners) listener(); },
    switchWorld: (id: string) => { world = id; facts.clear(); desktop.windows = {}; desktop.focusedWindowId = null; for (const listener of listeners) listener(); },
  };
}

test("help-mail repair and QFR installation have producers and cancel on world change", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const f = fixture();
  f.facts.add("mail.help.read"); f.update();
  t.mock.timers.tick(2199); assert.equal(f.emitted.length, 0);
  t.mock.timers.tick(1); await flush();
  assert.deepEqual(f.emitted, ["one:system.repaired"]);
  f.facts.add("qfr.installing"); f.update();
  t.mock.timers.tick(9999); assert.equal(f.emitted.length, 1);
  t.mock.timers.tick(1); await flush();
  assert.equal(f.emitted.at(-1), "one:qfr.installed");
  f.switchWorld("two"); f.facts.add("mail.help.read"); f.update();
  f.switchWorld("three"); t.mock.timers.tick(20_000); await flush();
  assert.equal(f.emitted.length, 2);
  f.release();
});

test("three corrupt documents arm only after the reader reveals the desktop", async () => {
  const f = fixture();
  for (const [index, id] of ["1z9Kq7AfR2xMcL0d", "1m4Pb8wYtC3zRnQe", "1n5Dc2KsHqE6vJf7"].entries()) {
    f.desktop.windows.doc = popup(id); f.desktop.focusedWindowId = "doc"; f.update(); await flush();
    assert(f.facts.has(`corrupt.doc${index + 1}.read`));
  }
  assert(!f.facts.has("corrupt.climax_pending"));
  f.desktop.focusedWindowId = null; f.update(); await flush();
  assert(f.facts.has("corrupt.climax_pending"));
  f.update(); await flush();
  assert.equal(f.emitted.filter((fact) => fact.endsWith("corrupt.climax_pending")).length, 1);
  f.release();
});

test("minimized and unrelated documents do not count as corrupt reads", () => {
  assert.equal(corruptionDocument({ ...popup("1z9Kq7AfR2xMcL0d"), minimized: true }), null);
  assert.equal(corruptionDocument(popup("other")), null);
});

test("idle sync contains recovery peaks and clears the previous world's lifetime peak", () => {
  let world = "one";
  let changed = () => {};
  const synced: Array<{ maxCompute: number; maxComputeThisRun: number; claimedMementoCount: number }> = [];
  const engine = createSourceIdleRuntimeEngine({
    getWorldId: () => world, getFacts: () => new Set(["compute.initialized"]),
    subscribeFacts: (listener) => { changed = listener; return () => {}; },
    storage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
    onComputeSync: (state) => synced.push(state),
  });
  try {
    engine.start(); engine.click();
    assert(synced.at(-1)!.maxCompute >= 0);
    const state = engine.snapshot().state;
    const syncCount = synced.length;
    for (let i = 0; i < 3; i++) changed();
    assert.deepEqual(engine.snapshot().state, state, "unchanged facts preserve the Idle state");
    assert.equal(synced.length, syncCount, "idle.sync acknowledgements must not trigger another idle.sync");
    engine.debug.grant(1e8);
    assert.equal(synced.at(-1)!.maxComputeThisRun, engine.snapshot().state.maxComputeThisRun);
    engine.abdicate();
    assert(synced.at(-1)!.maxCompute >= 1e8);
    world = "two"; changed();
    assert.equal(synced.at(-1)!.maxCompute, 0);
    assert.equal(synced.at(-1)!.claimedMementoCount, 0);
  } finally { engine.dispose(); }
});
