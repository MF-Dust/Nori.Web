/**
 * Fritsch–Carlson monotone cubic Hermite interpolation.
 *
 * Ported from the shipped Datasea camera spline `ZBe`
 * (`public/assets/NormalApp-Cn6agT0F.js:69163-69205`), built once at module
 * load as `iUe` (:69225-69237) and read by `sUe` (:69238-69241). This is not a
 * GSAP ease and not a smoothstep: the shipped bundle interpolates the camera Y
 * track through a real spline, so the tangent estimate and the monotonicity
 * clamp are the behaviour. Both are kept verbatim below — a plain Catmull-Rom
 * overshoots between the closely spaced knots and the shipped curve does not.
 */
export type MonotoneKnot = readonly [x: number, y: number];

/**
 * @param knots strictly increasing `[x, y]` pairs, at least two.
 * @returns a function clamped to the first/last knot outside their range.
 */
export function monotoneCubicSpline(
  knots: readonly MonotoneKnot[],
): (x: number) => number {
  const count = knots.length,
    xs = knots.map(([x]) => x),
    ys = knots.map(([, y]) => y),
    slopes = new Array<number>(count - 1),
    tangents = new Array<number>(count);
  for (let i = 0; i < count - 1; i++)
    slopes[i] = (ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]);
  (tangents[0] = slopes[0]), (tangents[count - 1] = slopes[count - 2]);
  for (let i = 1; i < count - 1; i++)
    tangents[i] =
      slopes[i - 1] * slopes[i] <= 0 ? 0 : (slopes[i - 1] + slopes[i]) * 0.5;
  // Fritsch–Carlson: bound every tangent to three times its own secant, so the
  // Hermite basis cannot leave the segment's value range.
  for (let i = 0; i < count - 1; i++) {
    if (slopes[i] === 0) {
      ((tangents[i] = 0), (tangents[i + 1] = 0));
      continue;
    }
    const a = tangents[i] / slopes[i],
      b = tangents[i + 1] / slopes[i],
      sum = a * a + b * b;
    if (sum > 9) {
      const scale = 3 / Math.sqrt(sum);
      ((tangents[i] = scale * a * slopes[i]),
        (tangents[i + 1] = scale * b * slopes[i]));
    }
  }
  return (x: number) => {
    if (x <= xs[0]) return ys[0];
    if (x >= xs[count - 1]) return ys[count - 1];
    // Last index whose knot is at or below x.
    let lo = 0,
      hi = count - 2;
    for (; lo < hi; ) {
      const mid = (lo + hi + 1) >> 1;
      xs[mid] <= x ? (lo = mid) : (hi = mid - 1);
    }
    const span = xs[lo + 1] - xs[lo],
      t = (x - xs[lo]) / span,
      t2 = t * t,
      t3 = t2 * t;
    return (
      (2 * t3 - 3 * t2 + 1) * ys[lo] +
      (t3 - 2 * t2 + t) * span * tangents[lo] +
      (-2 * t3 + 3 * t2) * ys[lo + 1] +
      (t3 - t2) * span * tangents[lo + 1]
    );
  };
}
