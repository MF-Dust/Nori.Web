import test from "node:test";
import assert from "node:assert/strict";
import {
  NoriExpressionController,
  NoriEmotionObserver,
} from "../frontend-src/live2d/expression-controller";
import {
  NoriIdleController,
  noriIdleFromFacts,
  noriLipExpressionBlend,
} from "../frontend-src/live2d/idle-controller";
import { NoriSceneStore } from "../frontend-src/state/nori-scene";

test("Nori expressions hold for three seconds, retain the latest request and clear after speech", (t) => {
  t.mock.timers.enable({ apis: ["setTimeout", "Date"], now: 1000 });
  const changes: Array<string | null> = [];
  const controller = new NoriExpressionController((_previous, next) =>
    changes.push(next),
  );
  t.after(() => controller.dispose());
  controller.request("07_Smile");
  controller.request("03_Angry");
  t.mock.timers.tick(2000);
  controller.request("14_Surprised");
  t.mock.timers.tick(999);
  assert.deepEqual(changes, ["07_Smile"]);
  t.mock.timers.tick(1);
  assert.deepEqual(changes, ["07_Smile", "14_Surprised"]);
  controller.blockStarted("op:0");
  t.mock.timers.tick(13000);
  assert.equal(changes.at(-1), "14_Surprised");
  controller.blockFinished("op:0");
  t.mock.timers.tick(9999);
  assert.equal(changes.at(-1), "14_Surprised");
  t.mock.timers.tick(1);
  assert.equal(changes.at(-1), null);
  controller.request("03_Angry");
  controller.request("07_Smile");
  controller.suppress(true);
  t.mock.timers.tick(15000);
  assert.equal(changes.at(-1), null);
  controller.request("07_Smile");
  assert.equal(changes.at(-1), null);
});

test("Nori history observer ignores mounts, duplicate blocks, non-speech and older reseeds", () => {
  const observer = new NoriEmotionObserver(),
    changes: Array<string | null> = [];
  const emit = (expression: string | null) => changes.push(expression);
  const line = (id: string, time: number, emotion = "happy") => ({
    messageId: id,
    blockId: 0,
    sender: "agent" as const,
    isSpeech: true,
    emotion,
    content: "test",
    createdAt: time,
  });
  observer.observe(1, [line("old", 1)], emit);
  observer.observe(1, [line("old", 1), line("new", 2)], emit);
  observer.observe(1, [line("old", 1), line("new", 2)], emit);
  observer.observe(1, [line("old", 1)], emit);
  observer.observe(1, [line("old", 1), line("new", 2)], emit);
  assert.deepEqual(changes, ["07_Smile"]);
  observer.observe(2, [line("reseed", 100, "angry")], emit);
  observer.observe(
    2,
    [
      line("reseed", 100),
      { ...line("silent", 101), isSpeech: false },
      line("neutral", 102, "neutral"),
    ],
    emit,
  );
  assert.deepEqual(changes, ["07_Smile", null]);
});

test("Nori inactivity and story facts select original idle poses and lip blend weights", () => {
  let now = 0;
  const played: any[] = [];
  const idle = new NoriIdleController(
    (step, sleep) => played.push({ step, sleep }),
    () => now,
  );
  assert.equal(idle.update("idle", false, 0, false), "idle");
  now = 15001;
  assert.equal(idle.update("idle", false, 0, false), "sleep");
  assert.equal(played.at(-1).step.fadeIn, 10);
  idle.activity();
  assert.equal(idle.update("idle", false, 0, false), "idle");
  now += 16000;
  assert.equal(idle.update("idle", false, 0.1, false), "idle");
  now += 16000;
  assert.equal(idle.update("idle", false, 0, true), "idle");
  assert.equal(idle.update("kneel", true, 0, true), "sleep");
  assert.equal(played.at(-1).step.fadeIn, 1.5);
  assert.equal(
    noriIdleFromFacts(
      new Set(["corrupt.doc1.read", "corrupt.doc2.read", "corrupt.doc3.read"]),
    ),
    "glitch",
  );
  assert.equal(noriIdleFromFacts(new Set(["arg.memory.shown"])), "kneel");
  assert.equal(
    noriIdleFromFacts(new Set(["arg.manifold_unlocked"])),
    "kneelCalm",
  );
  assert.equal(
    noriIdleFromFacts(new Set(["arg.manifold_unlocked", "arg.finale.shown"])),
    "idle",
  );
  assert.equal(noriLipExpressionBlend(["07_Smile", "03_Angry"]), 0.75);
});

test("Scene leases reject stale writes and never restore a released or previous-world owner", () => {
  const scene = new NoriSceneStore(),
    first = scene.acquire();
  first.set({ active: true, noriTexture: "corrupt" });
  const second = scene.acquire();
  second.set({ blur: 5 });
  first.set({ whiteFlash: 1 });
  assert.equal(scene.snapshot().whiteFlash, 0);
  second.release();
  assert.equal(scene.snapshot().noriTexture, "corrupt");
  const third = scene.acquire();
  third.set({ vignette: 2 });
  first.release();
  third.release();
  assert.equal(scene.snapshot().active, false);
  const stale = scene.acquire();
  scene.reset();
  stale.set({ noriSleep: true });
  assert.equal(scene.snapshot().noriSleep, false);
});

test("Cinematic face overrides and expressions release cleanly; thinking light blends without a jump", async () => {
  const { createCinematicFacePlugin, createThinkingLightPlugin } =
    await import("../frontend-src/live2d/scene-plugins");
  const ids = [
    "ParamEyeLOpen",
    "ParamEyeROpen",
    "ParamMouthOpenY",
    "ParamBreathLight",
  ];
  const values = new Map<number, number>(),
    expressions = new Set<string>();
  const model: any = {
    model: {
      getParameterCount: () => ids.length,
      getParameterId: (i: number) => ({ getString: () => ({ s: ids[i] }) }),
      setParameterValueByIndex: (i: number, value: number) =>
        values.set(i, value),
    },
    addExpression: (id: string) => expressions.add(id),
    removeExpression: (id: string) => expressions.delete(id),
  };
  const scene = new NoriSceneStore(),
    lease = scene.acquire();
  const face = createCinematicFacePlugin(scene).install!(model);
  const tick = { model, deltaTimeSeconds: 0, motionUpdated: false };
  lease.set({ eyeOpen: 0.3, mouthOpen: 0.2, noriSmile: true, noriSleep: true });
  face.update(tick);
  assert.deepEqual([...values.values()], [0.3, 0.3, 0.2]);
  assert.deepEqual([...expressions], ["13_Happy", "Sleep"]);
  lease.release();
  values.clear();
  face.update(tick);
  assert.equal(expressions.size, 0);
  assert.equal(values.size, 0);
  let thinking = false;
  const light = createThinkingLightPlugin(() => thinking).install!(model);
  light.update(tick);
  assert.equal(values.get(3), 0.7);
  thinking = true;
  light.update(tick);
  assert.equal(values.get(3), 0.7);
  light.update({ ...tick, deltaTimeSeconds: 0.3 });
  assert.ok(Math.abs(values.get(3)! - (0.55 + 0.45 * Math.sin(1.8))) < 1e-10);
  light.setEnabled!(false);
  values.clear();
  light.update(tick);
  assert.equal(values.size, 0);
  face.dispose();
  light.dispose();
});
