import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  CULT_FRAGMENT,
  CULT_POST_FRAGMENT,
  CULT_VERTEX,
} from "../../frontend-src/story/cult-shaders.js";

/**
 * Cult flash constants recorded from the shipped NormalApp chunk. The shipped
 * module declares the cult markers as a module-level DEFAULT object (`Js`) that
 * `build()` overwrites at runtime, so a source constant equal to the shipped
 * default is the correct value even though it never looks like a live value.
 * The markers are interpolated into the GLSL with `toFixed(4)`.
 */
const scene = readFileSync("frontend-src/story/story-scenes.tsx", "utf8");
const SHIPPED_MARKERS = { read0: 0.08, read1: 0.52, open0: 0.6, open1: 0.655, crush0: 0.74, black: 0.78 };
const SHIPPED_FLASH_DURATION = 7;
const SHIPPED_DRONE_WINDOW = 0.95;

test("cult shaders interpolate the shipped markers", () => {
  const shaders = CULT_VERTEX + CULT_FRAGMENT + CULT_POST_FRAGMENT;
  for (const value of Object.values(SHIPPED_MARKERS))
    assert.ok(shaders.includes(value.toFixed(4)), `marker ${value.toFixed(4)}`);
});

test("cult timeline, drone window and scene projection match the shipped layer", () => {
  const flashDur = SHIPPED_FLASH_DURATION;
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
  const wu = SHIPPED_DRONE_WINDOW;
  const until = Number(scene.match(/until: ([0-9.]+)/)![1]);
  const fadeOut = Number(scene.match(/fadeOut: ([0-9.]+)/)![1]);
  assert.equal(until, Number((wu * flashDur).toFixed(6)));
  assert.equal(fadeOut, Number(((wu - SHIPPED_MARKERS.black) * flashDur).toFixed(6)));
  assert.equal(scene.includes("gain: 0.6"), true, "shipped drone gain");
  assert.equal(
    scene.includes('src: "/audio/cult/drone.ogg"'),
    true,
    "shipped drone source",
  );
});

test("cult keeps its own recovery surface registered", () => {
  const surfaces = readFileSync(
    "scripts/smoke/smoke_frontend_recovery_surfaces.mjs",
    "utf8",
  );
  assert.match(
    surfaces,
    /cult: \["\.\.\/probes\/frontend_cult_probe\.mjs", "verifyCultFlash"\]/,
    "the cult surface must be runnable: node scripts/smoke/smoke_frontend_recovery_surfaces.mjs cult",
  );
  const workflow = readFileSync(
    ".github/workflows/frontend-recovery-surfaces.yml",
    "utf8",
  );
  assert.match(workflow, /^\s+cult,$/m, "the cult surface must run in CI");
});
