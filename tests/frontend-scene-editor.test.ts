import test from "node:test";
import assert from "node:assert/strict";
import {
  SCENE_EDITOR_SAMPLE,
  projectScene,
  sceneProjectSchema,
} from "../frontend-src/story/scene-project";
import {
  parseSceneProject,
  readSceneProjectFile,
  sceneProjectFilename,
  serializeSceneProject,
} from "../frontend-src/story/scene-project-io";
import { ScenePreview } from "../frontend-src/story/scene-preview";
import { NoriSceneStore } from "../frontend-src/state/nori-scene";
const mixer = { canPlay: () => false, playSceneAudio: () => () => {} };

test("scene model channels reject nonexistent assets and preserve valid JSON round trips", () => {
  const project = { ...SCENE_EDITOR_SAMPLE, initial: { noriExpression: "14_Surprised", noriIdleMotion: { group: "Reactions", index: 5 }, memoryComputeDrain: 0.5 } };
  const parsed = sceneProjectSchema.parse(project);
  assert.deepEqual(parseSceneProject(serializeSceneProject(parsed)), parsed);
  for (const initial of [
    { noriExpression: "missing" },
    { noriIdleMotion: { group: "Reactions", index: 6 } },
    { noriIdleMotion: { group: "missing", index: 0 } },
    { memoryComputeDrain: 1.1 },
  ]) assert.equal(sceneProjectSchema.safeParse({ ...SCENE_EDITOR_SAMPLE, initial }).success, false);
});

test("project JSON import and export round-trip Unicode, BOM, gates and audio", async () => {
  const project = {
    ...SCENE_EDITOR_SAMPLE,
    name: "场景测试",
    audio: [
      {
        id: "drone",
        src: "/audio/cult/drone.ogg",
        at: 0,
        until: 4,
        loop: true,
      },
    ],
  };
  const encoded = serializeSceneProject(project);
  assert.deepEqual(parseSceneProject("\uFEFF" + encoded), project);
  assert.deepEqual(
    await readSceneProjectFile({
      size: encoded.length,
      text: async () => encoded,
    }),
    project,
  );
  assert.equal(
    sceneProjectFilename("../CON : camera?"),
    "nori-scene-CON-camera.json",
  );
  assert.equal(sceneProjectFilename("..."), "nori-scene-project.json");
  assert.equal(sceneProjectFilename("场景测试"), "nori-scene-场景测试.json");
});
test("project imports enforce actual UTF-8 bytes before parsing or reading oversized files", async () => {
  const oversized = JSON.stringify({
    ...SCENE_EDITOR_SAMPLE,
    name: "界".repeat(34000),
  });
  assert.ok(oversized.length < 100000);
  assert.throws(() => parseSceneProject(oversized), /100 KB/);
  let reads = 0;
  await assert.rejects(
    readSceneProjectFile({
      size: 100001,
      text: async () => {
        reads++;
        return "{}";
      },
    }),
    /100 KB/,
  );
  assert.equal(reads, 0);
  await assert.rejects(
    readSceneProjectFile({ size: 10, text: async () => oversized }),
    /100 KB/,
  );
  assert.throws(() => parseSceneProject("{broken"), /valid JSON/);
});
test("project imports reject unknown nested channels and external or traversal audio", () => {
  for (const initial of [
    { camera: { x: 0, y: 0, z: 8, extra: 1 } },
    { cameraRot: { x: 0, y: 0, z: 0, extra: 1 } },
    { fov: 0 },
    { cameraFar: Infinity },
    { manifoldEnv: 2 },
    { emitFact: "boot.completed" },
  ])
    assert.equal(
      sceneProjectSchema.safeParse({ ...SCENE_EDITOR_SAMPLE, initial }).success,
      false,
    );
  for (const src of [
    "https://example.com/voice.wav",
    "//example.com/audio.wav",
    "/audio/../voice.wav",
    "/audio/%2e%2e/voice.wav",
    "data:audio/wav;base64,eA==",
  ])
    assert.throws(() =>
      parseSceneProject(
        JSON.stringify({
          ...SCENE_EDITOR_SAMPLE,
          audio: [{ id: "voice", src, at: 0, until: 1 }],
        }),
      ),
    );
});
test("camera rotation, environments and explicit FOV interpolate with replay-safe projection", () => {
  const project = sceneProjectSchema.parse({
    name: "channels",
    initial: { cameraRot: { x: 0, y: 0, z: -1 }, fov: 40, manifoldEnv: 0 },
    phases: [
      {
        id: "move",
        duration: 2,
        to: { cameraRot: { x: 2, y: -2, z: 1 }, fov: 80, manifoldEnv: 1 },
      },
    ],
  });
  assert.deepEqual(projectScene(project, 1).cameraRot, { x: 1, y: -1, z: 0 });
  assert.equal(projectScene(project, 1).fov, 60);
  assert.equal(projectScene(project, 1).manifoldEnv, 0.5);
  projectScene(project, 2);
  assert.equal(projectScene(project, 1).fov, 60);
  assert.equal(project.initial.fov, 40);
});
test("automatic camera channels never interpolate from an invalid zero FOV", () => {
  const project = sceneProjectSchema.parse({
    name: "auto",
    initial: {},
    phases: [
      { id: "explicit", duration: 2, to: { fov: 60, cameraFar: 200 } },
      { id: "auto", duration: 1, to: { fov: null, cameraFar: null } },
    ],
  });
  assert.equal(projectScene(project, 0).fov, 60);
  assert.equal(projectScene(project, 1).cameraFar, 200);
  assert.equal(projectScene(project, 2).fov, null);
});
test("fog validation checks inherited endpoints without rejecting valid interpolation", () => {
  const base = {
    ...SCENE_EDITOR_SAMPLE,
    initial: { fogNear: 10, fogFar: 100 },
  };
  assert.equal(
    sceneProjectSchema.safeParse({
      ...base,
      phases: [{ id: "bad", duration: 2, to: { fogNear: 100 } }],
    }).success,
    false,
  );
  const project = sceneProjectSchema.parse({
    ...base,
    phases: [{ id: "good", duration: 2, to: { fogNear: 50, fogFar: 150 } }],
  });
  assert.equal(projectScene(project, 1).fogNear, 30);
  assert.equal(projectScene(project, 1).fogFar, 125);
});
test("preview scrubbing is paused, replays gates and releases only its own scene layer", () => {
  const scene = new NoriSceneStore();
  const parent = scene.acquire();
  parent.set({ darkness: 0.1 });
  const preview = new ScenePreview(SCENE_EDITOR_SAMPLE, scene, mixer);
  preview.advance(0);
  assert.equal(preview.advance(3000).parkedAt, "inspect");
  preview.seek(1, 4000);
  assert.equal(preview.paused, true);
  assert.equal(scene.snapshot().darkness, 0.325);
  assert.equal(preview.advance(50000).time, 1);
  preview.setPaused(false, 50000);
  assert.equal(preview.advance(52000).parkedAt, "inspect");
  preview.seekPhase("restore", 53000);
  assert.equal(preview.snapshot().parkedAt, null);
  preview.seek(4, 54000);
  assert.equal(preview.snapshot().complete, true);
  assert.equal(scene.snapshot().active, true);
  preview.setPaused(false, 55000);
  assert.equal(preview.snapshot().time, 0);
  preview.dispose();
  preview.seek(2, 60000);
  preview.advance(70000);
  assert.equal(scene.snapshot().darkness, 0.1);
  assert.equal(scene.snapshot().active, false);
  parent.release();
});
test("hidden previews cannot consume input or undo an explicit pause", () => {
  const preview = new ScenePreview(
    SCENE_EDITOR_SAMPLE,
    new NoriSceneStore(),
    mixer,
  );
  preview.advance(0);
  preview.advance(2100);
  preview.setHidden(true, 2200);
  preview.wake(2300);
  assert.equal(preview.snapshot().parkedAt, "inspect");
  preview.setPaused(true, 2400);
  preview.setHidden(false, 30000);
  preview.wake(31000);
  assert.equal(preview.snapshot().playing, false);
  assert.equal(preview.advance(40000).time, 2);
  preview.setPaused(false, 40000);
  assert.equal(preview.advance(41000).time, 3);
  preview.dispose();
});
test("invalid preview projects fail before acquiring or changing a scene", () => {
  const scene = new NoriSceneStore();
  const before = scene.snapshot();
  assert.throws(
    () =>
      new ScenePreview({ ...SCENE_EDITOR_SAMPLE, phases: [] }, scene, mixer),
  );
  assert.equal(scene.snapshot(), before);
});
test("exact phase inspection isolates instantaneous changes before coincident gates", () => {
  const scene = new NoriSceneStore();
  const preview = new ScenePreview(
    {
      name: "instantaneous phases",
      initial: {},
      audio: [],
      phases: [
        { id: "arrive", duration: 1, to: {} },
        { id: "red", duration: 0, to: { redLight: 0.4 } },
        { id: "flash", duration: 0, to: { redLight: 1 } },
        { id: "confirm", duration: 0, pauseAtStart: true, to: {} },
        { id: "leave", duration: 1, to: { redLight: 0 } },
      ],
    },
    scene,
    mixer,
  );
  assert.equal(preview.seekPhase("red", 0).phase, "red");
  assert.equal(preview.snapshot().parkedAt, null);
  assert.equal(scene.snapshot().redLight, 0.4);
  preview.advance(20000);
  assert.equal(scene.snapshot().redLight, 0.4);
  preview.seekPhase("flash", 20000);
  assert.equal(scene.snapshot().redLight, 1);
  preview.setPaused(false, 20000);
  assert.equal(preview.snapshot().parkedAt, "confirm");
  preview.dispose();
});
