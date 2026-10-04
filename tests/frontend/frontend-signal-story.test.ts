import test from "node:test";
import assert from "node:assert/strict";
import {
  SignalDanielConversationRuntime,
  SIGNAL_DANIEL_DEADMAN_FACT,
} from "../../frontend-src/apps/signal-daniel";
import type { SignalThread } from "../../frontend-src/apps/messenger";
import {
  parseSignalTimestamp,
  signalStoryDate,
} from "../../frontend-src/apps/signal-story-clock";
const thread = { threadId: "daniel", service: true } as SignalThread;
const tick = async () => {
  for (let i = 0; i < 8; i++) await Promise.resolve();
};

test("Daniel reset discards replies already waiting for their reveal delay", async () => {
  let finishDelay!: () => void;
  const cues: string[] = [];
  const runtime = new SignalDanielConversationRuntime({
    manifold: {
      command: async () => ({
        ok: true,
        result: { reply: ["A delayed reply"] },
      }),
    },
    hasFact: (fact) => fact === SIGNAL_DANIEL_DEADMAN_FACT,
    sleep: () =>
      new Promise((resolve) => {
        finishDelay = resolve;
      }),
    playCue: (cue) => cues.push(cue),
    initialJumpEpoch: "world-a",
  });
  const sending = runtime.send(thread, "Test");
  await tick();
  assert.equal(runtime.snapshot().typing, true);
  runtime.syncJumpEpoch("world-b");
  finishDelay();
  await sending;
  assert.equal(runtime.snapshot().messages.length, 0);
  assert.equal(runtime.snapshot().typing, false);
  assert.deepEqual(cues, []);
  runtime.dispose();
});
test("Daniel disposal fences pending resume replies and locked sends", async () => {
  let reply!: (value: any) => void;
  let commands = 0;
  const runtime = new SignalDanielConversationRuntime({
    manifold: {
      command: () => {
        commands++;
        return new Promise((resolve) => {
          reply = resolve;
        });
      },
    },
    hasFact: () => false,
  });
  await runtime.send(thread, "Locked");
  assert.equal(commands, 0);
  const pending = runtime.resumeOnce();
  runtime.dispose();
  reply({ ok: true, result: { reply: ["Obsolete resume"] } });
  await pending;
  assert.equal(runtime.snapshot().messages.length, 0);
});

test("artifact subscriptions react to manifold revisions without reloading on their own replies", async () => {
  const { WorldStore } = await import("../../frontend-src/runtime/world-store");
  const { subscribeManifoldChanges } =
    await import("../../frontend-src/runtime/manifold-subscription");
  const world = new WorldStore();
  let reloads = 0;
  const unsubscribe = subscribeManifoldChanges(world, () => reloads++);
  world.consume({
    type: "world_joined",
    world: {
      worldId: "world-a",
      mountedCartridges: [
        {
          cartridgeId: "manifold.web",
          runtimes: [
            {
              visibilityFenceId: "player",
              headVersion: 0,
              visibleVersion: 0,
              state: {},
            },
          ],
        },
      ],
    },
  } as any);
  assert.equal(reloads, 1);
  world.consume({
    type: "event",
    channel: "manifold.artifacts.response",
    payload: { ok: true, artifacts: [] },
  } as any);
  assert.equal(reloads, 1);
  world.consume({
    type: "runtime_transition",
    cartridgeId: "manifold.web",
    version: 1,
    transition: { patches: [] },
  } as any);
  assert.equal(reloads, 2);
  // The 500 ms Idle compute sync only rewrites variables: no artifact reload.
  world.consume({
    type: "runtime_transition",
    cartridgeId: "manifold.web",
    version: 2,
    transition: {
      actor: "player",
      cmd: { type: "idle.sync", compute: 12 },
      patches: [{ op: "replace", path: "/variables", value: { idle: { compute: 12 } } }],
      events: [],
    },
  } as any);
  assert.equal(reloads, 2);
  // Facts emitted by the same tick arrive as their own commit and do reload.
  world.consume({
    type: "runtime_transition",
    cartridgeId: "manifold.web",
    version: 3,
    transition: {
      actor: "system",
      cmd: { type: "client.emitFacts", factIds: ["recover.trainlog"] },
      patches: [{ op: "replace", path: "/facts", value: { "recover.trainlog": {} } }],
      events: [],
    },
  } as any);
  assert.equal(reloads, 3);
  // Do not suppress other variable commands or an Idle revision that adds facts.
  for (const [index, transition] of [
    {
      cmd: { type: "browser.bookmark" },
      patches: [{ op: "replace", path: "/variables", value: {} }],
    },
    {
      cmd: { type: "idle.sync" },
      patches: [
        { op: "replace", path: "/variables/idle", value: { compute: 15 } },
        { op: "replace", path: "/facts", value: { "compute.cap_hit": true } },
      ],
    },
  ].entries()) {
    world.consume({
      type: "runtime_transition",
      cartridgeId: "manifold.web",
      version: 4 + index,
      transition,
    } as any);
    assert.equal(reloads, 4 + index);
  }
  unsubscribe();
});


test("Signal calendar parsing and current-day comparisons stay on the shipped story date", () => {
  const parsed = parseSignalTimestamp("2026-08-31T23:45:12Z");
  assert.deepEqual(
    [
      parsed.getFullYear(),
      parsed.getMonth(),
      parsed.getDate(),
      parsed.getHours(),
      parsed.getMinutes(),
      parsed.getSeconds(),
    ],
    [2026, 7, 31, 23, 45, 12],
  );
  const storyNow = signalStoryDate(new Date(2030, 0, 2, 9, 8, 7, 6));
  assert.deepEqual(
    [
      storyNow.getFullYear(),
      storyNow.getMonth(),
      storyNow.getDate(),
      storyNow.getHours(),
      storyNow.getMinutes(),
      storyNow.getSeconds(),
      storyNow.getMilliseconds(),
    ],
    [2026, 7, 31, 9, 8, 7, 6],
  );
});
