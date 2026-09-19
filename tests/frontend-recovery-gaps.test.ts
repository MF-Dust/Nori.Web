import "./frontend-scene-transport.test";
import "./frontend-scene-editor.test";
import test from "node:test";
import assert from "node:assert/strict";
import { HeadPat } from "../frontend-src/live2d/head-pat";
import {
  sceneProjectSchema,
  projectScene,
  SCENE_EDITOR_SAMPLE,
} from "../frontend-src/story/scene-project";

test("Head strokes require sustained horizontal motion and complete once per gesture", () => {
  const gesture = new HeadPat();
  gesture.start(0, 0, 0);
  for (let time = 100; time <= 1000; time += 100)
    assert.equal(gesture.move(time, 0, time / 100), false);
  assert.equal(gesture.progress, 0);
  assert.equal(
    gesture.move(1500, 0.4, 10),
    false,
    "long sampling gaps add no progress",
  );
  for (let i = 1; i <= 10; i++)
    assert.equal(gesture.move(1500 + i * 100, i % 2 ? 0.6 : 0.4, 10), i === 10);
  assert.equal(gesture.move(2600, 0.6, 10), false);
  gesture.end();
  assert.equal(gesture.progress, 0);
  assert.equal(gesture.pressing, false);
  gesture.enabled = false;
  gesture.start(3000, 0, 0);
  assert.equal(gesture.move(3100, 0.5, 0), false);
});

test("Head pat debug tuning clamps values and changes the production recognizer", () => {
  const gesture = new HeadPat();
  gesture.setTuning({ requiredMs: 500, minSpeedX: 0.9, maxYawDeg: 99 });
  assert.equal(gesture.tuning().requiredMs, 500);
  assert.equal(gesture.tuning().maxYawDeg, 30);
  gesture.start(0, 0, 0);
  for (let time = 100; time <= 500; time += 100)
    assert.equal(
      gesture.move(time, time % 200 ? 0.02 : 0, 0),
      false,
      "slow strokes must respect the tuned production threshold",
    );
  gesture.setTuning({ minSpeedX: 0 });
  gesture.end();
  gesture.start(1_000, 0, 0);
  for (let time = 1_100; time <= 1_500; time += 100)
    assert.equal(gesture.move(time, time % 200 ? 0.2 : 0, 0), time === 1_500);
  assert.equal(gesture.completions, 1);
  gesture.resetTuning();
  assert.equal(gesture.tuning().requiredMs, 1_000);
});

test("Scene projection interpolates numeric targets and holds before a gated phase", () => {
  const project = sceneProjectSchema.parse(SCENE_EDITOR_SAMPLE);
  assert.equal(projectScene(project, 1).darkness, 0.325);
  assert.equal(projectScene(project, 2, "inspect").darkness, 0.65);
  assert.equal(projectScene(project, 3).darkness, 0.325);
  assert.equal(projectScene(project, 4).darkness, 0);
  const camera = sceneProjectSchema.parse({
    name: "Camera",
    initial: { camera: { x: 0, y: 0, z: 8 } },
    phases: [
      { id: "move", duration: 2, to: { camera: { x: 2, y: 2, z: 10 } } },
    ],
    audio: [],
  });
  assert.deepEqual(projectScene(camera, 1).camera, { x: 1, y: 1, z: 9 });
});

test("Scene editor rejects unbounded projects, duplicate IDs and nonlocal audio", () => {
  for (const patch of [
    { phases: [{ id: "x", duration: -1, to: {} }] },
    {
      phases: [
        { id: "x", duration: 1, to: {} },
        { id: "x", duration: 1, to: {} },
      ],
    },
    { initial: { emitFact: "boot.completed" } },
    {
      audio: [
        { id: "a", src: "https://example.com/voice.wav", at: 0, until: 2 },
      ],
    },
    { audio: [{ id: "a", src: "/audio/cult/drone.ogg", at: 3, until: 2 }] },
    { audio: [{ id: "a", src: "/audio/cult/drone.ogg", at: 0, until: 8 }] },
  ])
    assert.equal(
      sceneProjectSchema.safeParse({ ...SCENE_EDITOR_SAMPLE, ...patch })
        .success,
      false,
    );
});
