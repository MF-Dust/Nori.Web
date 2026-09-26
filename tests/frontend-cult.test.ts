import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  CULT_FRAGMENT,
  CULT_POST_FRAGMENT,
  CULT_VERTEX,
} from "../frontend-src/story/cult-shaders.js";

/**
 * The cult flash against the shipped client, the same static comparison the
 * boot/ending constants were re-derived with (docs section "Original-constant
 * comparison").
 *
 * The trap that pass documents: the shipped module declares the cult markers as
 * a module-level DEFAULT object that `build()` overwrites at runtime, so a
 * source constant that equals the shipped default is the correct value even
 * though it never looks like a live value. The markers are interpolated into the
 * GLSL, so comparing the three shader sources byte-for-byte checks every marker
 * at once, and the timeline/audio literals are checked against the shipped
 * algebra instead of against a guess.
 */
const bundle = readFileSync("public/assets/NormalApp-Cn6agT0F.js", "utf8");
const scene = readFileSync("frontend-src/story/story-scenes.tsx", "utf8");
const block = bundle.slice(
  bundle.indexOf("ws = { read0:"),
  bundle.indexOf('id: "cult-flash"'),
);
const MARKERS = ["read0", "read1", "open0", "open1", "crush0", "black"] as const;
const shipped = Object.fromEntries(
  MARKERS.map((key) => [
    key,
    Number(block.match(new RegExp(`${key}: ([0-9.]+)`))![1]),
  ]),
) as Record<(typeof MARKERS)[number], number>;

/** Shipped GLSL is a template literal over the markers; resolve and normalize. */
const shippedShader = (name: string) => {
  const marker = `${name} = \``,
    start = bundle.indexOf(marker) + marker.length;
  return bundle
    .slice(start, bundle.indexOf("`", start))
    .replace(/\r\n/g, "\n")
    .replace(
      /\$\{Js\.(\w+)\.toFixed\(4\)\}/g,
      (_, key: string) => shipped[key as keyof typeof shipped].toFixed(4),
    );
};

test("cult shaders are the shipped GLSL, markers included", () => {
  assert.deepEqual(shipped, {
    read0: 0.08,
    read1: 0.52,
    open0: 0.6,
    open1: 0.655,
    crush0: 0.74,
    black: 0.78,
  });
  assert.equal(
    Number(block.match(/WU = ([0-9.]+)/)![1]),
    0.95,
    "drone window scale",
  );
  assert.equal(shippedShader("fXe"), CULT_VERTEX);
  assert.equal(shippedShader("hXe"), CULT_FRAGMENT);
  assert.equal(shippedShader("pXe"), CULT_POST_FRAGMENT);
});

test("cult timeline, drone window and scene projection match the shipped layer", () => {
  const flashDur = Number(block.match(/flashDur: \{ default: ([0-9.]+)/)![1]);
  assert.equal(flashDur, 7, "shipped pulse flash length");
  // The shipped six phases telescope across the same 7s; the source collapses
  // them into one phase, so the scene clock must still run the full 7s.
  assert.equal(
    scene.includes(`new StoryClock([{ id: "cult", duration: ${flashDur} }])`),
    true,
    "source segment clock must span the shipped flash length",
  );
  assert.equal(
    scene.includes("lease.set({ active: true, darkness: 1 })"),
    true,
    "shipped project() darkness",
  );
  // until = WU * flashDur, fadeOut = (WU - black) * flashDur. The source keeps
  // the authored decimals, so compare at the authored precision: 0.95 * 7 is
  // 6.6499999999999995 in IEEE-754, not 6.65.
  const wu = Number(block.match(/WU = ([0-9.]+)/)![1]);
  const until = Number(scene.match(/until: ([0-9.]+)/)![1]);
  const fadeOut = Number(scene.match(/fadeOut: ([0-9.]+)/)![1]);
  assert.equal(until, Number((wu * flashDur).toFixed(6)));
  assert.equal(fadeOut, Number(((wu - shipped.black) * flashDur).toFixed(6)));
  assert.equal(scene.includes("gain: 0.6"), true, "shipped drone gain");
  assert.equal(
    scene.includes('src: "/audio/cult/drone.ogg"'),
    true,
    "shipped drone source",
  );
});

test("cult keeps its own recovery surface registered", () => {
  const surfaces = readFileSync(
    "scripts/smoke_frontend_recovery_surfaces.mjs",
    "utf8",
  );
  assert.match(
    surfaces,
    /cult: \["\.\/frontend_cult_probe\.mjs", "verifyCultFlash"\]/,
    "the cult surface must be runnable: node scripts/smoke_frontend_recovery_surfaces.mjs cult",
  );
  const workflow = readFileSync(
    ".github/workflows/frontend-recovery-surfaces.yml",
    "utf8",
  );
  assert.match(workflow, /^\s+cult,$/m, "the cult surface must run in CI");
});
