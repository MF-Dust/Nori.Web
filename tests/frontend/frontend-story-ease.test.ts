import assert from "node:assert/strict";
import test from "node:test";
import {
  power1In,
  power1InOut,
  power1Out,
  power2In,
  power2InOut,
  power2Out,
  power3Out,
  ramp,
} from "../../frontend-src/story/story-ease";
import {
  CORRUPTION_MARKERS,
  corruptionScene,
} from "../../frontend-src/story/corruption-timeline";
import { memoryProjection } from "../../frontend-src/story/memory-scene";
import { dataseaCamera } from "../../frontend-src/story/datasea-scene";

// Expected values read off the vendored GSAP core in
// public/assets/NormalApp-Cn6agT0F.js: easeIn = t^n, easeOut = 1 - (1-t)^n,
// easeInOut = t<0.5 ? (2t)^n/2 : 1 - (2(1-t))^n/2, with Power1 n=2, Power2 n=3,
// Power3 n=4. Every t below is an exact binary fraction, so these are exact.
test("gsap power eases are the shipped fd formulas, not smoothstep", () => {
  assert.equal(power2In(0), 0);
  assert.equal(power2In(0.25), 0.015625);
  assert.equal(power2In(0.5), 0.125);
  assert.equal(power2In(1), 1);
  assert.equal(power2Out(0), 0);
  assert.equal(power2Out(0.25), 0.578125);
  assert.equal(power2Out(0.5), 0.875);
  assert.equal(power2Out(1), 1);
  assert.equal(power2InOut(0.25), 0.0625);
  assert.equal(power2InOut(0.5), 0.5);
  assert.equal(power2InOut(0.75), 0.9375);
  assert.equal(power3Out(0.25), 0.68359375);
  assert.equal(power3Out(0.5), 0.9375);
  assert.equal(power1In(0), 0);
  assert.equal(power1In(0.25), 0.0625);
  assert.equal(power1In(0.5), 0.25);
  assert.equal(power1In(1), 1);
  assert.equal(power1Out(0), 0);
  assert.equal(power1Out(0.25), 0.4375);
  assert.equal(power1Out(0.5), 0.75);
  assert.equal(power1Out(1), 1);
  assert.equal(power1InOut(0.25), 0.125);
  assert.equal(power1InOut(0.5), 0.5);
  assert.equal(power1InOut(0.75), 0.875);
  // The smoothstep these replace agrees at 0, 0.5 and 1 and nowhere else.
  for (const ease of [power1In, power1Out, power1InOut, power2In, power2Out, power2InOut, power3Out]) {
    assert.notEqual(ease(0.25), 0.25 * 0.25 * (3 - 2 * 0.25));
  }
});

test("ramp reproduces the shipped from/to composition and clamps outside the window", () => {
  assert.equal(ramp(2.5, 0, 10, 0, 1, power2Out), 0.578125);
  assert.equal(ramp(5, 0, 10, 0, 1, power2Out), 0.875);
  assert.equal(ramp(5, 0, 10, 0.38, 1, power3Out), 0.38 + 0.62 * 0.9375);
  assert.equal(ramp(0, 0, 10, 0, 1, power2In), 0);
  assert.equal(ramp(10, 0, 10, 0, 1, power2In), 1);
  assert.equal(ramp(-4, 0, 10, 1, 0, power2Out), 1);
  assert.equal(ramp(14, 0, 10, 1, 0, power2Out), 0);
  // A held segment (shipped `ease: "none"` keyframe) is just a zero-width ramp.
  assert.equal(ramp(0.4, 0.55, 0.45, 0.78, 1, power2InOut), 0.78);
});

test("corruption channels run the shipped per-layer eases", () => {
  const at = (marker: string, fraction: number, duration: number) =>
    corruptionScene({
      time: CORRUPTION_MARKERS[marker]! + duration * fraction,
      phase: marker,
      parkedAt: null,
      paused: false,
      complete: false,
    } as never);
  // cXe redLight/tint are power2.in; MJ camY is power2.out, so at a quarter
  // of the 0.7s pan the tint leads and the camera lags.
  assert.ok(Math.abs(at("panUp", 0.25, 0.7).redLight! - 0.015625) < 1e-9);
  assert.ok(Math.abs(at("panUp", 0.25, 0.7).camera!.y - 1.6 * 0.578125) < 1e-9);
  // TJ exitDark: redLight falls with power2.out, darkness climbs with power2.inOut.
  const dark = at("exitDark", 0.25, 0.9);
  assert.ok(Math.abs(dark.redLight! - (1 - 0.578125)) < 1e-9);
  assert.ok(Math.abs(dark.darkness! - 0.85 * 0.0625) < 1e-9);
  // SJ heal: vReveal drops with power2.in over the first 30%, returns power3.out.
  assert.ok(
    Math.abs(at("heal", 0.15, 17).noriReveal! - (1 - 0.62 * 0.125)) < 1e-9,
  );
  assert.ok(
    Math.abs(at("heal", 0.65, 17).noriReveal! - (0.38 + 0.62 * 0.9375)) < 1e-9,
  );
  // iJ wake: eyeOpen is power2.out over 1.3s, not a linear clamp.
  assert.ok(
    Math.abs(
      corruptionScene({
        time: CORRUPTION_MARKERS.settle! + 0.3 + 1.3 * 0.25,
        phase: "settle",
        parkedAt: null,
        paused: false,
        complete: false,
      } as never).eyeOpen! - 0.578125,
    ) < 1e-9,
  );
  // iJ wake burst from the same instant: rise power2.out over 0.18, hold to
  // 3.1, fall power2.in over 0.5, burstAge linear to 3.6.
  const wake = (offset: number) =>
    corruptionScene({
      time: CORRUPTION_MARKERS.settle! + 0.3 + offset,
      phase: "settle",
      parkedAt: null,
      paused: false,
      complete: false,
    } as never);
  assert.equal(wake(-0.01).burst, 0);
  assert.equal(wake(-0.01).burstAge, 0);
  assert.ok(Math.abs(wake(0.045).burst - 0.578125) < 1e-9);
  assert.equal(wake(1).burst, 1);
  assert.equal(wake(2).burstAge, 2);
  assert.ok(Math.abs(wake(3.1).burst - 1) < 1e-9);
  // power2.in at a quarter of the 0.5s fall: 1 - 0.015625.
  assert.ok(Math.abs(wake(3.225).burst - 0.984375) < 1e-9);
  assert.equal(wake(3.6).burst, 0);
  assert.equal(wake(3.6).burstAge, 3.6);
  // SJ parks vVignette at 0.08 and no later tween touches it, so it must still
  // be 0.08 once the settle is over -- not faded to 0.
  assert.ok(Math.abs(wake(0).vignette! - 0.08) < 1e-9);
  assert.ok(Math.abs(wake(2.4).vignette! - 0.08) < 1e-9);
  assert.ok(Math.abs(wake(20).vignette! - 0.08) < 1e-9);
});

test("memory quake and voidEnv carry their shipped eases", () => {
  // DJ: shake quakePeak -> 0 over 2s with power2.out.
  assert.ok(Math.abs(memoryProjection(21).quake - 0.7 * 0.421875) < 1e-9);
  assert.equal(memoryProjection(20.5).quake, 0.7);
  assert.equal(memoryProjection(22.5).quake, 0);
  // DJ: voidEnv -> 1 over min(1, 2.4 * 0.45) = 1s with power2.inOut.
  assert.ok(Math.abs(memoryProjection(38.7 + 0.25).voidProgress - 0.0625) < 1e-9);
  assert.ok(Math.abs(memoryProjection(38.7 + 0.5).voidProgress - 0.5) < 1e-9);
  assert.equal(memoryProjection(38.7).voidProgress, 0);
  assert.equal(memoryProjection(39.7).voidProgress, 1);
});

test("datasea camera tilt is the shipped Sg cubic, not a smoothstep", () => {
  // Sg(0.25) = 4 * 0.25^3 = 0.0625; a smoothstep would have given 0.15625.
  assert.ok(
    Math.abs(
      dataseaCamera(7).cameraRot.x - -(Math.PI / 2) * 0.0625,
    ) < 1e-9,
  );
  assert.ok(Math.abs(dataseaCamera(13).cameraRot.x + Math.PI / 2) < 1e-9);
});
