/**
 * GSAP easing ports for the story scenes.
 *
 * Formulas are taken from the GSAP core vendored in
 * `public/assets/NormalApp-Cn6agT0F.js` (line 81190+), not from a docs
 * recollection. That bundle's `fd(name, easeIn, easeOut, easeInOut)` builds
 * `easeOut = 1 - easeIn(1 - t)` and the half/half `easeInOut`, and
 * `Ai("Linear,Quad,Cubic,Quart,Quint,Strong", ...)` registers each power ease
 * as `easeIn = t^n`, `easeOut = 1 - (1 - t)^n`,
 * `easeInOut = t < 0.5 ? (2t)^n / 2 : 1 - (2(1 - t))^n / 2` with
 * Quad = Power1 (n=2), Cubic = Power2 (n=3), Quart = Power3 (n=4),
 * Quint = Power4 (n=5).
 *
 * Only the eases the shipped Corruption/Memory/Datasea/Farewell layers actually
 * name in a `build()` body are exported. `none` is the identity and stays
 * inline as a plain linear ramp.
 */
const easeIn = (n: number, t: number) => Math.pow(t, n);
const easeOut = (n: number, t: number) => 1 - Math.pow(1 - t, n);
const easeInOut = (n: number, t: number) =>
  t < 0.5 ? Math.pow(t * 2, n) / 2 : 1 - Math.pow((1 - t) * 2, n) / 2;

/** `power1.inOut` -- Corruption `wJ` second vVignette keyframe. */
export const power1InOut = (t: number) => easeInOut(2, t);
/** `power2.in` -- Corruption `cXe` redLight/tint rise. */
export const power2In = (t: number) => easeIn(3, t);
/** `power2.out` -- the dominant shipped ease (see the recovery report). */
export const power2Out = (t: number) => easeOut(3, t);
/** `power2.inOut` -- Corruption `MJ`/`TJ`/`SJ`, Datasea `Sg`. */
export const power2InOut = (t: number) => easeInOut(3, t);
/** `power3.out` -- Corruption `SJ` heal vReveal return. */
export const power3Out = (t: number) => easeOut(4, t);

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

/**
 * The shipped composition, not a plausible-looking stand-in:
 * `gsap.to(target, { p: to, duration, ease })` over a starting value `from`
 * evaluates `from + (to - from) * ease(clamp01((time - start) / duration))`.
 * Every property of one shipped multi-property tween shares this same eased t,
 * so callers pass one `ramp(...)` result to all of them.
 */
export const ramp = (
  time: number,
  start: number,
  duration: number,
  from: number,
  to: number,
  ease: (t: number) => number,
) => from + (to - from) * ease(clamp01((time - start) / duration));
