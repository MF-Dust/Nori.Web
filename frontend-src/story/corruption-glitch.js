/** Source-owned slice/RGB/jolt filter recovered from the shipped corruption effect. */
export const CORRUPTION_GLITCH_DEFAULTS = Object.freeze({
  maxShiftPx: 28,
  sliceCount: 7,
  blockiness: 0.5,
  verticalAmount: 0.1,
  rgbSplitPx: 4,
  joltPx: 6,
  tickMs: 90,
  density: 0.8,
  moshCells: 0,
  deepFry: 0,
  noise: 0,
  invertChance: 0,
});
export const CORRUPTION_GLITCH_PARAMETERS = Object.freeze({
  maxShiftPx: { min: 0, max: 200, step: 1 },
  sliceCount: { min: 0, max: 64, step: 1 },
  blockiness: { min: 0, max: 1, step: 0.01 },
  verticalAmount: { min: 0, max: 1, step: 0.01 },
  rgbSplitPx: { min: 0, max: 60, step: 0.5 },
  joltPx: { min: 0, max: 100, step: 1 },
  tickMs: { min: 16, max: 1000, step: 1 },
  density: { min: 0, max: 1, step: 0.01 },
  moshCells: { min: 0, max: 64, step: 1 },
  deepFry: { min: 0, max: 1, step: 0.01 },
  noise: { min: 0, max: 1, step: 0.01 },
  invertChance: { min: 0, max: 1, step: 0.01 },
});
let serial = 0;
export function createCorruptionGlitch(target = document.documentElement) {
  const d$e = { ...CORRUPTION_GLITCH_DEFAULTS };
  const oJ = Object.freeze({
    bands: Object.freeze([]),
    scalePx: 0,
    splitDx: 0,
    joltDx: 0,
    joltDy: 0,
    fry: 0,
    noise: 0,
    invert: !1,
  });
  function aJ(t, e = Math.random) {
    if (e() >= t.density) return oJ;
    const n = [];
    for (let d = 0; d < t.sliceCount; d++) {
      const f = 0.004 + e() * 0.05,
        h = e() * (1 - f),
        _ = e() < t.blockiness,
        m = _ ? 0.15 + e() * 0.45 : 1,
        p = _ ? e() * (1 - m) : 0,
        v = (e() < 0.5 ? -1 : 1) * (0.3 + 0.7 * e()),
        y = t.verticalAmount > 0 ? (e() * 2 - 1) * t.verticalAmount : 0;
      n.push({ x0: p, x1: p + m, y0: h, y1: h + f, dx: v, dy: y });
    }
    for (let d = 0; d < t.moshCells; d++) {
      const f = 0.08 + e() * 0.22,
        h = 0.06 + e() * 0.18,
        _ = e() * (1 - f),
        m = e() * (1 - h),
        p = (e() < 0.5 ? -1 : 1) * (0.4 + 0.6 * e()),
        v = (e() < 0.5 ? -1 : 1) * (0.3 + 0.7 * e());
      n.push({ x0: _, x1: _ + f, y0: m, y1: m + h, dx: p, dy: v });
    }
    const r = 2 * t.maxShiftPx * (0.6 + 0.4 * e()),
      i =
        t.rgbSplitPx === 0
          ? 0
          : (e() < 0.5 ? -1 : 1) * t.rgbSplitPx * (0.4 + 0.6 * e()),
      s = e() < 0.35,
      o = s ? (e() * 2 - 1) * t.joltPx : 0,
      a = s ? (e() * 2 - 1) * t.joltPx : 0,
      l = t.deepFry === 0 ? 0 : Math.min(1, t.deepFry * (0.85 + 0.3 * e())),
      c = t.noise === 0 ? 0 : Math.min(1, t.noise * (0.7 + 0.6 * e())),
      u = e() < t.invertChance;
    return {
      bands: n,
      scalePx: r,
      splitDx: i,
      joltDx: o,
      joltDy: a,
      fry: l,
      noise: c,
      invert: u,
    };
  }
  const lJ = `nori-corruption-glitch-${++serial}`;
  const Oo = "http://www.w3.org/2000/svg";
  const f$e = "1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0";
  const h$e = "0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0";
  const p$e = "0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0";
  const m$e = "0.22";
  const g$e = 3.5;
  let rm = null;
  function v$e() {
    if (rm) return rm;
    const t = document.createElementNS(Oo, "svg");
    (t.setAttribute("width", "0"),
      t.setAttribute("height", "0"),
      t.setAttribute("aria-hidden", "true"),
      (t.style.position = "fixed"));
    const e = document.createElementNS(Oo, "filter");
    (e.setAttribute("id", lJ),
      e.setAttribute("x", "0%"),
      e.setAttribute("y", "0%"),
      e.setAttribute("width", "100%"),
      e.setAttribute("height", "100%"),
      e.setAttribute("color-interpolation-filters", "sRGB"),
      t.append(e));
    const n = (S, T) => {
        const R = document.createElementNS(Oo, S);
        for (const [E, M] of Object.entries(T)) R.setAttribute(E, M);
        return (e.append(R), R);
      },
      r = document.createElementNS(Oo, "feMerge");
    r.setAttribute("result", "displaced");
    const i = document.createElementNS(Oo, "feMergeNode");
    (i.setAttribute("in", "SourceGraphic"),
      r.append(i),
      e.append(r),
      n("feColorMatrix", {
        in: "displaced",
        type: "matrix",
        values: f$e,
        result: "chR",
      }));
    const s = n("feOffset", { in: "chR", dx: "0", dy: "0", result: "chROff" });
    (n("feColorMatrix", {
      in: "displaced",
      type: "matrix",
      values: h$e,
      result: "chG",
    }),
      n("feColorMatrix", {
        in: "displaced",
        type: "matrix",
        values: p$e,
        result: "chB",
      }));
    const o = n("feOffset", { in: "chB", dx: "0", dy: "0", result: "chBOff" });
    (n("feBlend", {
      in: "chROff",
      in2: "chG",
      mode: "screen",
      result: "splitRG",
    }),
      n("feBlend", {
        in: "splitRG",
        in2: "chBOff",
        mode: "screen",
        result: "split",
      }));
    const a = n("feOffset", {
        in: "split",
        dx: "0",
        dy: "0",
        result: "jolted",
      }),
      l = (S) =>
        ["feFuncR", "feFuncG", "feFuncB"].map((T) => {
          const R = document.createElementNS(Oo, T);
          return (R.setAttribute("type", "identity"), S.append(R), R);
        }),
      c = n("feComponentTransfer", { in: "jolted", result: "inverted" }),
      u = l(c),
      d = n("feColorMatrix", {
        in: "inverted",
        type: "saturate",
        values: "1",
        result: "saturated",
      }),
      f = n("feComponentTransfer", { in: "saturated", result: "contrasted" }),
      h = l(f),
      _ = n("feComponentTransfer", { in: "contrasted", result: "fried" }),
      m = l(_),
      p = n("feTurbulence", {
        type: "fractalNoise",
        baseFrequency: m$e,
        numOctaves: "2",
        seed: "0",
        x: "0",
        y: "0",
        width: "0",
        height: "0",
        result: "turb",
      });
    n("feColorMatrix", {
      in: "turb",
      type: "saturate",
      values: "0",
      result: "turbGray",
    });
    const v = n("feComponentTransfer", {
        in: "turbGray",
        result: "staticNoise",
      }),
      y = ["feFuncR", "feFuncG", "feFuncB"].map((S) => {
        const T = document.createElementNS(Oo, S);
        return (
          T.setAttribute("type", "linear"),
          T.setAttribute("slope", "0"),
          T.setAttribute("intercept", "0.5"),
          v.append(T),
          T
        );
      }),
      x = document.createElementNS(Oo, "feFuncA");
    (x.setAttribute("type", "linear"),
      x.setAttribute("slope", "0"),
      x.setAttribute("intercept", "0"),
      v.append(x));
    const w = n("feBlend", { in: "staticNoise", in2: "fried", mode: "normal" });
    return (
      document.body.append(t),
      (rm = {
        svg: t,
        filter: e,
        bandMerge: r,
        bandPool: [],
        feSplitR: s,
        feSplitB: o,
        feJolt: a,
        feInvertFuncs: u,
        feSaturate: d,
        feContrastFuncs: h,
        fePosterFuncs: m,
        feTurbulence: p,
        feNoiseFuncs: y,
        feNoiseAlpha: x,
        feNoiseBlend: w,
      }),
      rm
    );
  }
  function b$e(t, e) {
    for (; t.bandPool.length < e;) {
      const n = t.bandPool.length,
        r = document.createElementNS(Oo, "feOffset");
      (r.setAttribute("in", "SourceGraphic"),
        r.setAttribute("dx", "0"),
        r.setAttribute("dy", "0"),
        r.setAttribute("x", "0"),
        r.setAttribute("y", "0"),
        r.setAttribute("width", "0"),
        r.setAttribute("height", "0"),
        r.setAttribute("result", `band${n}`),
        t.filter.insertBefore(r, t.bandMerge));
      const i = document.createElementNS(Oo, "feMergeNode");
      (i.setAttribute("in", `band${n}`),
        t.bandMerge.append(i),
        t.bandPool.push(r));
    }
  }
  const iU = new Map();
  function _$e(t) {
    let e = iU.get(t);
    return (
      e ||
        ((e = Array.from({ length: t }, (n, r) =>
          (r / (t - 1)).toFixed(3),
        ).join(" ")),
        iU.set(t, e)),
      e
    );
  }
  function GI(t) {
    const e = v$e();
    b$e(e, t.bands.length);
    const n = document.documentElement.clientWidth,
      r = document.documentElement.clientHeight,
      i = t.scalePx / 2;
    for (let a = 0; a < e.bandPool.length; a++) {
      const l = e.bandPool[a],
        c = t.bands[a];
      c
        ? (l.setAttribute("x", (c.x0 * n).toFixed(1)),
          l.setAttribute("y", (c.y0 * r).toFixed(1)),
          l.setAttribute("width", ((c.x1 - c.x0) * n).toFixed(1)),
          l.setAttribute("height", ((c.y1 - c.y0) * r).toFixed(1)),
          l.setAttribute("dx", (c.dx * i).toFixed(1)),
          l.setAttribute("dy", (c.dy * i).toFixed(1)))
        : (l.setAttribute("width", "0"),
          l.setAttribute("height", "0"),
          l.setAttribute("dx", "0"),
          l.setAttribute("dy", "0"));
    }
    (e.feSplitR.setAttribute("dx", t.splitDx.toFixed(1)),
      e.feSplitB.setAttribute("dx", (-t.splitDx).toFixed(1)),
      e.feJolt.setAttribute("dx", t.joltDx.toFixed(1)),
      e.feJolt.setAttribute("dy", t.joltDy.toFixed(1)));
    for (const a of e.feInvertFuncs)
      t.invert
        ? (a.setAttribute("type", "table"),
          a.setAttribute("tableValues", "1 0"))
        : a.setAttribute("type", "identity");
    e.feSaturate.setAttribute("values", (1 + 2.2 * t.fry).toFixed(3));
    const s = 1 + 1.4 * t.fry;
    for (const a of e.feContrastFuncs)
      (a.setAttribute("type", "linear"),
        a.setAttribute("slope", s.toFixed(3)),
        a.setAttribute("intercept", ((1 - s) / 2).toFixed(3)));
    const o = t.fry > 0.3 ? Math.round(14 - 9 * ((t.fry - 0.3) / 0.7)) : 0;
    for (const a of e.fePosterFuncs)
      o >= 2
        ? (a.setAttribute("type", "discrete"),
          a.setAttribute("tableValues", _$e(o)))
        : a.setAttribute("type", "identity");
    if (t.noise > 0) {
      (e.feTurbulence.setAttribute("width", String(n)),
        e.feTurbulence.setAttribute("height", String(r)),
        e.feTurbulence.setAttribute(
          "seed",
          String(Math.floor(Math.random() * 1e6)),
        ));
      const a = g$e * t.noise;
      for (const l of e.feNoiseFuncs)
        (l.setAttribute("slope", a.toFixed(3)),
          l.setAttribute("intercept", ((1 - a) / 2).toFixed(3)));
      (e.feNoiseAlpha.setAttribute("intercept", "1"),
        e.feNoiseBlend.setAttribute("mode", "overlay"));
    } else {
      (e.feTurbulence.setAttribute("width", "0"),
        e.feTurbulence.setAttribute("height", "0"));
      for (const a of e.feNoiseFuncs)
        (a.setAttribute("slope", "0"), a.setAttribute("intercept", "0.5"));
      (e.feNoiseAlpha.setAttribute("intercept", "0"),
        e.feNoiseBlend.setAttribute("mode", "normal"));
    }
  }
  const previous = target.style.filter;
  const filter = `url("#${lJ}")`;
  let disposed = false,
    active = false,
    frozen = false,
    tick = -Infinity;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const renderOnce = () => {
    if (disposed || reduced.matches) return;
    GI(aJ(d$e));
    target.style.filter = filter;
    active = true;
  };
  return {
    params() {
      return { ...d$e };
    },
    setParams(patch) {
      if (disposed) return;
      for (const [key, value] of Object.entries(patch)) {
        const range = CORRUPTION_GLITCH_PARAMETERS[key];
        if (!range || typeof value !== "number" || !Number.isFinite(value))
          continue;
        const bounded = Math.max(range.min, Math.min(range.max, value));
        d$e[key] = range.step === 1 ? Math.round(bounded) : bounded;
      }
      tick = -Infinity;
    },
    freeze(value = true) {
      frozen = value;
    },
    renderOnce,
    update(milliseconds, enabled) {
      if (disposed) return;
      enabled = enabled && !reduced.matches;
      if (!enabled) {
        if (active && target.style.filter === filter)
          target.style.filter = previous;
        active = false;
        return;
      }
      if (frozen || (milliseconds - tick < d$e.tickMs && active)) return;
      tick = milliseconds;
      renderOnce();
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      if (active && target.style.filter === filter)
        target.style.filter = previous;
      rm?.svg.remove();
      rm = null;
    },
  };
}
