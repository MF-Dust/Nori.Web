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


async function artifactWorld() {
  const { WorldStore } = await import("../../frontend-src/runtime/world-store");
  const world = new WorldStore();
  const join = (worldId: string) =>
    world.consume({
      type: "world_joined",
      world: {
        worldId,
        mountedCartridges: [
          {
            cartridgeId: "manifold.web",
            runtimes: [{ visibilityFenceId: "player", headVersion: 0, visibleVersion: 0, state: {} }],
          },
        ],
      },
    } as any);
  join("world-a");
  let version = 0;
  const commit = (transition: Record<string, unknown>) =>
    world.consume({
      type: "runtime_transition",
      cartridgeId: "manifold.web",
      version: ++version,
      transition,
    } as any);
  return { world, join, commit };
}
const factEvents = (factId: string, hint?: string[]) => [
  { type: "factEmitted", factId },
  {
    type: "manifold.facts.changed",
    emitted: [factId],
    retracted: [],
    snapshot: { [factId]: true },
    ...(hint ? { changedArtifactTypes: hint } : {}),
  },
];
const factCommit = (factId: string, hint?: string[]) => ({
  cmd: { type: "client.emitFact", factId },
  patches: [{ op: "replace", path: "/facts", value: { [factId]: {} } }],
  events: factEvents(factId, hint),
});
/** Longer than the 50 ms coalescing window. */
const coalesceWindow = () => new Promise((resolve) => setTimeout(resolve, 70));

test("artifact subscriptions reload only for their hinted types, and for everything the server cannot rule out", async () => {
  const { subscribeArtifactTypes } = await import("../../frontend-src/runtime/manifold-subscription");
  const { world, join, commit } = await artifactWorld();
  const reloads = { mail: 0, file: 0, signal: 0 };
  const releases = [
    subscribeArtifactTypes(world, ["mail"], () => reloads.mail++),
    subscribeArtifactTypes(world, ["file", "app"], () => reloads.file++),
    subscribeArtifactTypes(world, ["signal_thread", "signal_message"], () => reloads.signal++),
  ];
  const counts = async () => {
    await coalesceWindow();
    return [reloads.mail, reloads.file, reloads.signal];
  };
  assert.deepEqual(await counts(), [0, 0, 0], "the join before subscribing is not replayed");

  commit(factCommit("mail.help.read", ["mail"]));
  assert.deepEqual(await counts(), [1, 0, 0]);
  commit(factCommit("recover.trainlog", ["file"]));
  assert.deepEqual(await counts(), [1, 1, 0]);
  commit(factCommit("signal.daniel.read", ["signal_thread", "signal_message"]));
  assert.deepEqual(await counts(), [1, 1, 1]);

  // `qfr.downloaded` carries no hint yet reveals a file: an unhinted fact may change any artifact.
  commit(factCommit("qfr.downloaded"));
  assert.deepEqual(await counts(), [2, 2, 2]);

  // Chip scans and the 500 ms Idle sync only rewrite /variables.
  commit({
    cmd: { type: "chip.scan" },
    patches: [{ op: "replace", path: "/variables", value: {} }],
    events: [{ type: "chip.status.changed" }],
  });
  commit({
    cmd: { type: "idle.sync" },
    patches: [{ op: "replace", path: "/variables", value: { idle: {} } }],
    events: [{ type: "idleSynced" }],
  });
  assert.deepEqual(await counts(), [2, 2, 2]);

  // A burst is one reload per window.
  commit(factCommit("mail.a.read", ["mail"]));
  commit(factCommit("mail.b.read", ["mail"]));
  commit(factCommit("mail.c.read", ["mail"]));
  assert.deepEqual(await counts(), [3, 2, 2]);

  // A commit that cannot be proven variables-only counts as every type.
  commit({ patches: [] });
  assert.deepEqual(await counts(), [4, 3, 3]);

  // One batch hints the union of its facts; one unhinted fact widens it to everything.
  commit({
    patches: [{ op: "replace", path: "/facts", value: { "mail.x.read": {}, "recover.x": {} } }],
    events: [...factEvents("mail.x.read", ["mail"]), ...factEvents("recover.x", ["file"])],
  });
  assert.deepEqual(await counts(), [5, 4, 3]);
  commit({
    patches: [{ op: "replace", path: "/facts", value: { "mail.y.read": {}, "arg.y": {} } }],
    events: [...factEvents("mail.y.read", ["mail"]), ...factEvents("arg.y")],
  });
  assert.deepEqual(await counts(), [6, 5, 4]);

  // Events outside a transition: a hinted facts.changed, `artifacts.invalidated`, and RPC responses.
  world.consume({ type: "event", channel: "manifold.facts.changed", payload: { changedArtifactTypes: ["file"] } } as any);
  assert.deepEqual(await counts(), [6, 6, 4]);
  world.consume({ type: "event", channel: "manifold.artifacts.invalidated", payload: { reason: "pack" } } as any);
  assert.deepEqual(await counts(), [7, 7, 5]);
  world.consume({ type: "event", channel: "manifold.artifacts.response", payload: { ok: true, artifacts: [] } } as any);
  assert.deepEqual(await counts(), [7, 7, 5]);

  // A new world replaces every artifact.
  join("world-b");
  assert.deepEqual(await counts(), [8, 8, 6]);

  // Releasing cancels a notification that is still waiting for its window.
  commit(factCommit("mail.z.read", ["mail"]));
  releases[0]();
  assert.deepEqual(await counts(), [8, 8, 6]);
  for (const release of releases) release();
});

test("one shared artifact load serves every consumer of a change", async () => {
  const { createArtifactLoader } = await import("../../frontend-src/runtime/manifold-subscription");
  const { world, commit } = await artifactWorld();
  const resolvers: Array<(value: string) => void> = [];
  let loads = 0;
  const loader = createArtifactLoader(world, ["signal_thread", "signal_message"], () => {
    loads++;
    return new Promise<string>((resolve) => resolvers.push(resolve));
  });

  const first = loader.load();
  assert.equal(loader.load(), first, "concurrent callers share the in-flight request");
  assert.equal(loads, 1);
  resolvers[0]("v1");
  assert.equal(await first, "v1");
  const second = loader.load();
  assert.equal(loads, 2, "a settled request is not cached");
  resolvers[1]("v2");
  await second;

  const results: string[] = [];
  const worldListeners = () => (world as unknown as { listeners: Set<unknown> }).listeners.size;
  const unsubscribed = worldListeners();
  const releaseDock = loader.subscribe(() => void loader.load().then((value) => results.push(`dock:${value}`)));
  const releaseWindow = loader.subscribe(() => void loader.load().then((value) => results.push(`window:${value}`)));
  assert.equal(worldListeners(), unsubscribed + 1, "both consumers share one world subscription");
  commit(factCommit("mail.help.read", ["mail"]));
  await coalesceWindow();
  assert.equal(loads, 2, "another artifact type does not reload signal consumers");
  commit(factCommit("signal.daniel.read", ["signal_thread", "signal_message"]));
  await coalesceWindow();
  assert.equal(loads, 3, "two consumers, one change, one load");
  resolvers[2]("v3");
  await tick();
  assert.deepEqual(results, ["dock:v3", "window:v3"]);

  // A request that started before a change is never handed to a consumer reacting to it.
  const early = loader.load();
  assert.equal(loads, 4);
  commit(factCommit("qfr.downloaded"));
  await coalesceWindow();
  assert.equal(loads, 5);
  resolvers[4]("v5");
  resolvers[3]("v4");
  await tick();
  assert.equal(await early, "v4");
  assert.deepEqual(results.slice(2), ["dock:v5", "window:v5"]);

  releaseDock();
  assert.equal(worldListeners(), unsubscribed + 1, "the subscription outlives a single consumer");
  releaseWindow();
  assert.equal(worldListeners(), unsubscribed, "the subscription ends with its last consumer");
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
