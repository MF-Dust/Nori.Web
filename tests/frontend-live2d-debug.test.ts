import test from "node:test";
import assert from "node:assert/strict";
import type { Live2DModel } from "../frontend-src/live2d/engine.js";
import {
  attachLive2DDebug,
  Live2DDebugRuntime,
} from "../frontend-src/live2d/debug-runtime";

test("Live2D debug runtime mutates only the attached production model", () => {
  const plugins = new Map<string, boolean>([["physics", true]]);
  const active = new Set<string>();
  const motions: unknown[] = [];
  let rest = false;
  const model = {
    getSetting: () => ({
      getMotionGroupCount: () => 1,
      getMotionGroupName: () => "Idle",
      getMotionCount: () => 1,
      getMotionFileName: () => "idle.motion3.json",
    }),
    getExpressionNames: () => ["Happy"],
    getActiveExpressions: () => [...active],
    addExpression: (name: string) => active.add(name),
    removeExpression: (name: string) => active.delete(name),
    getPluginEnabled: (id: string) => plugins.get(id) ?? false,
    setPluginEnabled: (id: string, enabled: boolean) => plugins.set(id, enabled),
    isRestPose: () => rest,
    setRestPose: (enabled: boolean) => {
      rest = enabled;
    },
    startMotion: (motion: unknown) => motions.push(motion),
  } as unknown as Live2DModel;
  const runtime = new Live2DDebugRuntime();
  const detach = runtime.attach(model);
  assert.equal(runtime.snapshot().ready, true);
  assert.equal(runtime.snapshot().motions[0]?.file, "idle.motion3.json");
  assert.equal(runtime.setPlugin("physics", false), true);
  assert.equal(plugins.get("physics"), false);
  assert.equal(runtime.setRestPose(true), true);
  assert.equal(runtime.snapshot().restPose, true);
  assert.equal(runtime.toggleExpression("Happy"), true);
  assert.equal(runtime.snapshot().expressions[0]?.active, true);
  assert.equal(runtime.playMotion("Idle", 0), true);
  assert.equal(motions.length, 1);
  assert.equal(runtime.playMotion("Missing", 0), false);
  detach();
  assert.equal(runtime.snapshot().ready, false);
  assert.equal(runtime.toggleExpression("Happy"), false);
});

test("a stage without Debug diagnostics can still mount its production model", () => {
  const model = {} as Live2DModel;
  assert.equal(attachLive2DDebug(undefined, model), undefined);
});
