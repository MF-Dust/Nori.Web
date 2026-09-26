import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  RIBBON_FRAGMENT_GLSL,
  RIBBON_GPU_WGSL,
  RIBBON_VERTEX_GLSL,
} from "../../frontend-src/apps/marginal-growth/shaders";

const shipped = readFileSync("public/assets/IdleScreen-DCDB640k.js", "utf8");

test("exported marginal-growth GLSL occurs verbatim in the shipped Idle screen", () => {
  const glsl = {
    RIBBON_VERTEX_GLSL,
    RIBBON_FRAGMENT_GLSL,
  };
  for (const [name, source] of Object.entries(glsl)) {
    assert.equal(typeof source, "string", name);
    assert.ok(source.startsWith("#version 300 es"), name);
    assert.ok(shipped.includes(source), `${name} drifted from IdleScreen-DCDB640k.js`);
  }
  assert.ok(RIBBON_VERTEX_GLSL.includes("gl_Position"));
  assert.ok(RIBBON_VERTEX_GLSL.trimEnd().endsWith("}"));
  assert.ok(RIBBON_FRAGMENT_GLSL.includes("uRenderOpacity"));
  assert.ok(RIBBON_FRAGMENT_GLSL.includes("${K}"));
  assert.ok(RIBBON_FRAGMENT_GLSL.trimEnd().endsWith("}"));
});

test("exported marginal-growth WGSL occurs verbatim in the shipped Idle screen", () => {
  assert.equal(typeof RIBBON_GPU_WGSL, "string");
  assert.ok(RIBBON_GPU_WGSL.includes("fn mainVertex"));
  assert.ok(RIBBON_GPU_WGSL.includes("fn mainFragment"));
  assert.ok(RIBBON_GPU_WGSL.includes("${K}"));
  assert.ok(shipped.includes(RIBBON_GPU_WGSL), "RIBBON_GPU_WGSL drifted from IdleScreen-DCDB640k.js");
});
