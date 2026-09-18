import test from "node:test";
import assert from "node:assert/strict";
import { StoryClock } from "../frontend-src/story/story-clock";
import { StoryDirector } from "../frontend-src/story/story-director";
import {
  BOOT_PHASES,
  BOOT_MARKERS,
  bootScene,
} from "../frontend-src/story/boot-timeline";
import { CORRUPTION_PHASES } from "../frontend-src/story/corruption-timeline";
import {
  createFractureGraph,
  shatterDefaults,
} from "../frontend-src/story/boot-shatter-renderer.js";

test("boot traverses source camera and formation channels but cannot complete before waking", () => {
  const clock = new StoryClock(BOOT_PHASES);
  clock.advance(0);
  const surface = bootScene(clock.advance(13600));
  assert.equal(surface.camera?.z, 51);
  assert.ok((surface.camera?.y ?? 0) > 89);
  const glyph = bootScene(clock.advance((BOOT_MARKERS.morph + 1) * 1000));
  assert.ok(glyph.coldOpen!.glyphDraw > 0.99);
  assert.ok(glyph.coldOpen!.morph > 0);
  const parked = clock.advance(999000);
  assert.equal(parked.parkedAt, "ready");
  assert.equal(parked.complete, false);
  assert.equal(bootScene(parked).eyeOpen, 0);
  assert.equal(clock.wake("wrong", 999001), false);
  clock.wake("ready", 999001);
  const complete = clock.advance(1003001);
  assert.equal(complete.complete, true);
  assert.equal(bootScene(complete).noriSleep, false);
  assert.equal(bootScene(complete).camera, null);
});
test("recovered fracture graph has reproducible bodies, connected cracks and impact events", () => {
  const a = createFractureGraph(shatterDefaults({})) as any,
    b = createFractureGraph(shatterDefaults({})) as any;
  assert.ok(a.faces.length > 30);
  assert.ok(a.edges.length > 100);
  assert.ok(a.events.length > 20);
  assert.deepEqual(a.faces, b.faces);
  assert.deepEqual(a.damageCurve, b.damageCurve);
});
test("corruption completion requires voice, all-clear and wake gates independently", () => {
  const clock = new StoryClock(CORRUPTION_PHASES);
  clock.advance(0);
  assert.equal(clock.advance(999999).parkedAt, "awaitVoice");
  clock.wake("awaitVoice", 999999);
  assert.equal(clock.advance(1999999).parkedAt, "qte");
  assert.equal(clock.wake("wake", 1999999), false);
  clock.wake("qte", 1999999);
  assert.equal(clock.advance(2999999).parkedAt, "wake");
  clock.wake("wake", 2999999);
  assert.equal(clock.advance(3002999).complete, true);
});
test("acknowledgement handoff waits and is fenced across a same-world replacement", async () => {
  let resolve!: () => void;
  const pending = () =>
    new Promise<void>((r) => {
      resolve = r;
    });
  let handoffs = 0;
  const director = new StoryDirector(new Set(["farewell"]), pending);
  director.sync("same", new Set(["arg.farewell.started"]));
  director.complete(director.snapshot(), () => {
    handoffs++;
  });
  assert.equal(handoffs, 0);
  director.sync("same", new Set(["arg.farewell.started"]), true);
  resolve();
  await Promise.resolve();
  assert.equal(handoffs, 0);
  director.complete(director.snapshot(), () => {
    handoffs++;
  });
  resolve();
  await Promise.resolve();
  assert.equal(handoffs, 1);
  director.dispose();
});
