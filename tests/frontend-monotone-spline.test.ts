import test from "node:test";
import assert from "node:assert/strict";
import { monotoneCubicSpline } from "../frontend-src/story/story-monotone-spline";
import { dataseaCamera } from "../frontend-src/story/datasea-scene";

/**
 * Shipped `iUe` (public/assets/NormalApp-Cn6agT0F.js:69212-69224) is
 * `ZBe` (:69163-69205) over these 11 knots. Every expectation below was read
 * off the shipped function by extracting `ZBe` from the bundle and evaluating
 * it, not off this port: 27,007 samples over [0, 27] at 0.001 steps, maximum
 * deviation 0.
 */
const KNOTS = [
  [0, 0],
  [1, -2],
  [3, -30],
  [5, -80],
  [7, -122],
  [9, -146],
  [12, -163],
  [16, -175],
  [20, -183],
  [24, -188],
  [27, -190],
] as const;
const cameraY = monotoneCubicSpline(KNOTS);

test("monotone spline reproduces the shipped ZBe at the knots and inside them", () => {
  for (const [x, y] of KNOTS) assert.equal(cameraY(x), y);
  const interiors: readonly [number, number][] = [
    [2, -12.580213750217997],
    [4, -54.125],
    [6, -102.625],
    [8, -135.91666666666666],
    [10, -153.37037037037035],
    [13.5, -168.45703125],
    [17, -177.3515625],
    [19, -181.3046875],
    [23, -186.984375],
    [26, -189.39814814814815],
  ];
  for (const [x, y] of interiors) assert.equal(cameraY(x), y);
  // Clamped outside the knot range, like the shipped early returns.
  assert.equal(cameraY(-3), 0);
  assert.equal(cameraY(40), -190);
});

test("the clamp is the behaviour: no segment leaves its own value range", () => {
  for (let i = 0; i < KNOTS.length - 1; i++) {
    const [x0, y0] = KNOTS[i],
      [x1, y1] = KNOTS[i + 1];
    for (let step = 0; step <= 64; step++) {
      const y = cameraY(x0 + ((x1 - x0) * step) / 64);
      assert.ok(
        y <= Math.max(y0, y1) + 1e-9 && y >= Math.min(y0, y1) - 1e-9,
        `segment [${x0}, ${x1}] left its range at ${y}`,
      );
    }
  }
  // The curve it replaces did not: linear + smoothstep sat 5.006 units below
  // the shipped track at x = 2.425, and an unclamped Catmull-Rom 1.394 away.
  assert.equal(cameraY(2.425), -19.381155237661304);
});

test("datasea camera Y runs the spline, not per-segment linear + smoothstep", () => {
  assert.equal(dataseaCamera(0).camera.y, 0);
  assert.equal(dataseaCamera(27).camera.y, -190);
  assert.equal(dataseaCamera(2).camera.y, -12.580213750217997);
  assert.equal(dataseaCamera(13.5).camera.y, -168.45703125);
  // The replaced smoothstep reached the same knot 0.5s short and stopped there
  // until the next knot: -163 at 13.5, not -168.457.
  assert.notEqual(dataseaCamera(13.5).camera.y, -163);
});
