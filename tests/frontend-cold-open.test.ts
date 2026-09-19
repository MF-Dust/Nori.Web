import test from "node:test";
import assert from "node:assert/strict";
import {
  Scene,
  PerspectiveCamera,
  Texture,
  TextureLoader,
  Color,
  RedFormat,
  DataUtils,
  type WebGLRenderer,
} from "three";
import {
  createOceanStage,
  createGlyphKit,
} from "../frontend-src/live2d/cold-open-materials.js";
import { NoriSceneStore } from "../frontend-src/state/nori-scene";
import {
  sceneProjectSchema,
  projectScene,
} from "../frontend-src/story/scene-project";

const settle = () => new Promise((resolve) => setImmediate(resolve));
const tracked = () => {
  const texture = new Texture();
  let disposals = 0;
  texture.addEventListener("dispose", () => disposals++);
  return { texture, count: () => disposals };
};
test("ocean cancellation disposes late textures once and cannot restore an old background", async (t) => {
  const pending: Array<(texture: Texture) => void> = [];
  t.mock.method(
    TextureLoader.prototype,
    "loadAsync",
    () => new Promise<Texture>((resolve) => pending.push(resolve)),
  );
  const scene = new Scene(),
    original = new Color(0x123456),
    replacement = new Color(0xabcdef);
  scene.background = original;
  const stage = createOceanStage(
    scene,
    {} as WebGLRenderer,
    new PerspectiveCamera(),
  );
  assert.equal(pending.length, 3);
  assert.equal(stage.status, "loading");
  stage.dispose();
  stage.dispose();
  assert.equal(scene.background, original);
  scene.background = replacement;
  const images = pending.map((resolve) => {
    const image = tracked();
    resolve(image.texture);
    return image;
  });
  await settle();
  assert.deepEqual(
    images.map((image) => image.count()),
    [1, 1, 1],
  );
  assert.equal(scene.children.length, 0);
  assert.equal(scene.background, replacement);
  assert.equal(stage.status, "disposed");
});
test("one failed ocean texture releases the successful siblings and exposes a terminal error", async (t) => {
  const images = [tracked(), tracked()];
  let request = 0;
  t.mock.method(TextureLoader.prototype, "loadAsync", () =>
    request++ === 0
      ? Promise.reject(new Error("missing"))
      : Promise.resolve(images[request - 2].texture),
  );
  const scene = new Scene();
  const stage = createOceanStage(
    scene,
    {} as WebGLRenderer,
    new PerspectiveCamera(),
  );
  await settle();
  assert.equal(stage.status, "error");
  assert.equal(scene.children.length, 0);
  assert.deepEqual(
    images.map((image) => image.count()),
    [1, 1],
  );
  stage.dispose();
  assert.deepEqual(
    images.map((image) => image.count()),
    [1, 1],
  );
  assert.equal(stage.render({ cine: new NoriSceneStore().snapshot() }), false);
});

test("glyph SDF has one signed half-float per texel and a matching red-channel texture", async (t) => {
  t.mock.method(globalThis, "fetch", async () => ({
    ok: true,
    json: async () => ({
      petals: [
        {
          label: "TL",
          outline: [
            [-0.8, 0.2],
            [-0.8, 0.8],
            [-0.2, 0.8],
            [-0.2, 0.2],
          ],
        },
      ],
    }),
  }));
  // Node has no Image; exercise the outline fallback as well as the upload layout.
  const kit = await createGlyphKit();
  try {
    assert.equal(kit.cloverSdfTex.format, RedFormat);
    const image = kit.cloverSdfTex.image as {
      data: Uint16Array;
      width: number;
      height: number;
    };
    assert.equal(image.data.length, image.width * image.height);
    let min = Infinity,
      max = -Infinity;
    for (const encoded of image.data) {
      const value = DataUtils.fromHalfFloat(encoded);
      assert.ok(Number.isFinite(value));
      min = Math.min(min, value);
      max = Math.max(max, value);
    }
    assert.ok(
      min < 0 && max > 0,
      "the field must contain both interior and exterior distances",
    );
  } finally {
    kit.fieldTex.dispose();
    kit.cloverSdfTex.dispose();
  }
});

test("scene projects validate and interpolate cold-open channels without changing either endpoint", () => {
  const cold = {
    ocean: true,
    oceanFade: 1,
    oceanDepth: 0,
    oceanGodray: 0.8,
    oceanEdge: 0,
    glyphDraw: 0,
    glyphGlow: 0,
    morph: 0,
    noriForm: 0,
    noriWash: 0,
  };
  const project = sceneProjectSchema.parse({
    name: "Ocean",
    initial: { coldOpen: cold },
    phases: [
      {
        id: "draw",
        duration: 2,
        to: { coldOpen: { ...cold, glyphDraw: 1, oceanEdge: 3.5 } },
      },
      { id: "off", duration: 1, to: { coldOpen: null } },
    ],
  });
  assert.equal(projectScene(project, 1).coldOpen?.glyphDraw, 0.5);
  assert.equal(projectScene(project, 1).coldOpen?.oceanEdge, 1.75);
  assert.equal(projectScene(project, 2).coldOpen, null);
  assert.equal(project.initial.coldOpen?.glyphDraw, 0);
  assert.equal(
    sceneProjectSchema.safeParse({
      ...project,
      initial: { coldOpen: { ...cold, morph: NaN } },
    }).success,
    false,
  );
});
