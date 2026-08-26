import { j as y } from "./index-CyHAbkO5.js";
import { r as q } from "./i18n-DtIC1LRi.js";
const ft = { PLAYING: "PLAYING", RESULTS: "RESULTS" },
  Yt = 5e3;
function Kt(r) {
  const { round: t, history: s } = r;
  if (t.status !== "solved" && t.status !== "skipped") return null;
  if (t.solvedAtMs !== void 0) return t.solvedAtMs;
  const e = s.at(-1);
  return e ? t.startedAtMs + e.elapsedMs : null;
}
function Jt(r, t) {
  return r
    ? r.phase === ft.PLAYING || r.history.length === 0 || (t && t.phase !== ft.RESULTS)
      ? "game"
      : "results"
    : t
      ? "game"
      : "start";
}
const v = {
    cover: "#1A1A1A",
    coverHighlight: "#2A2A2A",
    coverEdge: "#0D0D0D",
    elastic: "#C23B22",
    elasticDark: "#9A2E1A",
    elasticHighlight: "#D94A30",
    paper: "#FFF8E7",
    paperShadow: "#F5EED8",
    paperEdge: "#E8E0CC",
    graphite: "#2B2B2B",
    graphiteLight: "#6B6B6B",
    graphiteFaint: "#A0A0A0",
    dotGrid: "rgba(180, 170, 155, 0.4)",
    inkGreen: "#2D5A3D",
    inkRed: "#8B3A3A",
    washiMint: "#B8D4C8",
    washiPink: "#E8C4C4",
    washiYellow: "#F5E6B8",
    coffeeRing: "rgba(139, 90, 43, 0.08)",
  },
  Xt = {
    handwriting: '"Kalam", "Segoe Print", cursive',
    display: '"Cormorant Garamond", "Palatino Linotype", Georgia, serif',
  };
function et(r, t, s) {
  if (r && r.length) {
    const [e, n] = t,
      a = (Math.PI / 180) * s,
      i = Math.cos(a),
      o = Math.sin(a);
    for (const h of r) {
      const [c, l] = h;
      ((h[0] = (c - e) * i - (l - n) * o + e), (h[1] = (c - e) * o + (l - n) * i + n));
    }
  }
}
function Lt(r, t) {
  return r[0] === t[0] && r[1] === t[1];
}
function Ct(r, t, s, e = 1) {
  const n = s,
    a = Math.max(t, 0.1),
    i = r[0] && r[0][0] && typeof r[0][0] == "number" ? [r] : r,
    o = [0, 0];
  if (n) for (const c of i) et(c, o, n);
  const h = (function (c, l, d) {
    const f = [];
    for (const b of c) {
      const m = [...b];
      (Lt(m[0], m[m.length - 1]) || m.push([m[0][0], m[0][1]]), m.length > 2 && f.push(m));
    }
    const p = [];
    l = Math.max(l, 0.1);
    const u = [];
    for (const b of f)
      for (let m = 0; m < b.length - 1; m++) {
        const w = b[m],
          S = b[m + 1];
        if (w[1] !== S[1]) {
          const T = Math.min(w[1], S[1]);
          u.push({
            ymin: T,
            ymax: Math.max(w[1], S[1]),
            x: T === w[1] ? w[0] : S[0],
            islope: (S[0] - w[0]) / (S[1] - w[1]),
          });
        }
      }
    if (
      (u.sort((b, m) =>
        b.ymin < m.ymin
          ? -1
          : b.ymin > m.ymin
            ? 1
            : b.x < m.x
              ? -1
              : b.x > m.x
                ? 1
                : b.ymax === m.ymax
                  ? 0
                  : (b.ymax - m.ymax) / Math.abs(b.ymax - m.ymax),
      ),
      !u.length)
    )
      return p;
    let g = [],
      k = u[0].ymin,
      M = 0;
    for (; g.length || u.length;) {
      if (u.length) {
        let b = -1;
        for (let m = 0; m < u.length && !(u[m].ymin > k); m++) b = m;
        u.splice(0, b + 1).forEach((m) => {
          g.push({ s: k, edge: m });
        });
      }
      if (
        ((g = g.filter((b) => !(b.edge.ymax <= k))),
        g.sort((b, m) =>
          b.edge.x === m.edge.x ? 0 : (b.edge.x - m.edge.x) / Math.abs(b.edge.x - m.edge.x),
        ),
        (d !== 1 || M % l == 0) && g.length > 1)
      )
        for (let b = 0; b < g.length; b += 2) {
          const m = b + 1;
          if (m >= g.length) break;
          const w = g[b].edge,
            S = g[m].edge;
          p.push([
            [Math.round(w.x), k],
            [Math.round(S.x), k],
          ]);
        }
      ((k += d),
        g.forEach((b) => {
          b.edge.x = b.edge.x + d * b.edge.islope;
        }),
        M++);
    }
    return p;
  })(i, a, e);
  if (n) {
    for (const c of i) et(c, o, -n);
    (function (c, l, d) {
      const f = [];
      (c.forEach((p) => f.push(...p)), et(f, l, d));
    })(h, o, -n);
  }
  return h;
}
function G(r, t) {
  var s;
  const e = t.hachureAngle + 90;
  let n = t.hachureGap;
  (n < 0 && (n = 4 * t.strokeWidth), (n = Math.round(Math.max(n, 0.1))));
  let a = 1;
  return (
    t.roughness >= 1 &&
      (((s = t.randomizer) === null || s === void 0 ? void 0 : s.next()) || Math.random()) > 0.7 &&
      (a = n),
    Ct(r, n, e, a || 1)
  );
}
class lt {
  constructor(t) {
    this.helper = t;
  }
  fillPolygons(t, s) {
    return this._fillPolygons(t, s);
  }
  _fillPolygons(t, s) {
    const e = G(t, s);
    return { type: "fillSketch", ops: this.renderLines(e, s) };
  }
  renderLines(t, s) {
    const e = [];
    for (const n of t) e.push(...this.helper.doubleLineOps(n[0][0], n[0][1], n[1][0], n[1][1], s));
    return e;
  }
}
function tt(r) {
  const t = r[0],
    s = r[1];
  return Math.sqrt(Math.pow(t[0] - s[0], 2) + Math.pow(t[1] - s[1], 2));
}
class jt extends lt {
  fillPolygons(t, s) {
    let e = s.hachureGap;
    (e < 0 && (e = 4 * s.strokeWidth), (e = Math.max(e, 0.1)));
    const n = G(t, Object.assign({}, s, { hachureGap: e })),
      a = (Math.PI / 180) * s.hachureAngle,
      i = [],
      o = 0.5 * e * Math.cos(a),
      h = 0.5 * e * Math.sin(a);
    for (const [c, l] of n)
      tt([c, l]) && i.push([[c[0] - o, c[1] + h], [...l]], [[c[0] + o, c[1] - h], [...l]]);
    return { type: "fillSketch", ops: this.renderLines(i, s) };
  }
}
class Dt extends lt {
  fillPolygons(t, s) {
    const e = this._fillPolygons(t, s),
      n = Object.assign({}, s, { hachureAngle: s.hachureAngle + 90 }),
      a = this._fillPolygons(t, n);
    return ((e.ops = e.ops.concat(a.ops)), e);
  }
}
class It {
  constructor(t) {
    this.helper = t;
  }
  fillPolygons(t, s) {
    const e = G(t, (s = Object.assign({}, s, { hachureAngle: 0 })));
    return this.dotsOnLines(e, s);
  }
  dotsOnLines(t, s) {
    const e = [];
    let n = s.hachureGap;
    (n < 0 && (n = 4 * s.strokeWidth), (n = Math.max(n, 0.1)));
    let a = s.fillWeight;
    a < 0 && (a = s.strokeWidth / 2);
    const i = n / 4;
    for (const o of t) {
      const h = tt(o),
        c = h / n,
        l = Math.ceil(c) - 1,
        d = h - l * n,
        f = (o[0][0] + o[1][0]) / 2 - n / 4,
        p = Math.min(o[0][1], o[1][1]);
      for (let u = 0; u < l; u++) {
        const g = p + d + u * n,
          k = f - i + 2 * Math.random() * i,
          M = g - i + 2 * Math.random() * i,
          b = this.helper.ellipse(k, M, a, a, s);
        e.push(...b.ops);
      }
    }
    return { type: "fillSketch", ops: e };
  }
}
class Nt {
  constructor(t) {
    this.helper = t;
  }
  fillPolygons(t, s) {
    const e = G(t, s);
    return { type: "fillSketch", ops: this.dashedLine(e, s) };
  }
  dashedLine(t, s) {
    const e =
        s.dashOffset < 0 ? (s.hachureGap < 0 ? 4 * s.strokeWidth : s.hachureGap) : s.dashOffset,
      n = s.dashGap < 0 ? (s.hachureGap < 0 ? 4 * s.strokeWidth : s.hachureGap) : s.dashGap,
      a = [];
    return (
      t.forEach((i) => {
        const o = tt(i),
          h = Math.floor(o / (e + n)),
          c = (o + n - h * (e + n)) / 2;
        let l = i[0],
          d = i[1];
        l[0] > d[0] && ((l = i[1]), (d = i[0]));
        const f = Math.atan((d[1] - l[1]) / (d[0] - l[0]));
        for (let p = 0; p < h; p++) {
          const u = p * (e + n),
            g = u + e,
            k = [
              l[0] + u * Math.cos(f) + c * Math.cos(f),
              l[1] + u * Math.sin(f) + c * Math.sin(f),
            ],
            M = [
              l[0] + g * Math.cos(f) + c * Math.cos(f),
              l[1] + g * Math.sin(f) + c * Math.sin(f),
            ];
          a.push(...this.helper.doubleLineOps(k[0], k[1], M[0], M[1], s));
        }
      }),
      a
    );
  }
}
class Rt {
  constructor(t) {
    this.helper = t;
  }
  fillPolygons(t, s) {
    const e = s.hachureGap < 0 ? 4 * s.strokeWidth : s.hachureGap,
      n = s.zigzagOffset < 0 ? e : s.zigzagOffset,
      a = G(t, (s = Object.assign({}, s, { hachureGap: e + n })));
    return { type: "fillSketch", ops: this.zigzagLines(a, n, s) };
  }
  zigzagLines(t, s, e) {
    const n = [];
    return (
      t.forEach((a) => {
        const i = tt(a),
          o = Math.round(i / (2 * s));
        let h = a[0],
          c = a[1];
        h[0] > c[0] && ((h = a[1]), (c = a[0]));
        const l = Math.atan((c[1] - h[1]) / (c[0] - h[0]));
        for (let d = 0; d < o; d++) {
          const f = 2 * d * s,
            p = 2 * (d + 1) * s,
            u = Math.sqrt(2 * Math.pow(s, 2)),
            g = [h[0] + f * Math.cos(l), h[1] + f * Math.sin(l)],
            k = [h[0] + p * Math.cos(l), h[1] + p * Math.sin(l)],
            M = [g[0] + u * Math.cos(l + Math.PI / 4), g[1] + u * Math.sin(l + Math.PI / 4)];
          n.push(
            ...this.helper.doubleLineOps(g[0], g[1], M[0], M[1], e),
            ...this.helper.doubleLineOps(M[0], M[1], k[0], k[1], e),
          );
        }
      }),
      n
    );
  }
}
const A = {};
class Wt {
  constructor(t) {
    this.seed = t;
  }
  next() {
    return this.seed
      ? ((2 ** 31 - 1) & (this.seed = Math.imul(48271, this.seed))) / 2 ** 31
      : Math.random();
  }
}
const _t = 0,
  st = 1,
  dt = 2,
  Q = {
    A: 7,
    a: 7,
    C: 6,
    c: 6,
    H: 1,
    h: 1,
    L: 2,
    l: 2,
    M: 2,
    m: 2,
    Q: 4,
    q: 4,
    S: 4,
    s: 4,
    T: 2,
    t: 2,
    V: 1,
    v: 1,
    Z: 0,
    z: 0,
  };
function nt(r, t) {
  return r.type === t;
}
function ct(r) {
  const t = [],
    s = (function (i) {
      const o = new Array();
      for (; i !== "";)
        if (i.match(/^([ \t\r\n,]+)/)) i = i.substr(RegExp.$1.length);
        else if (i.match(/^([aAcChHlLmMqQsStTvVzZ])/))
          ((o[o.length] = { type: _t, text: RegExp.$1 }), (i = i.substr(RegExp.$1.length)));
        else {
          if (!i.match(/^(([-+]?[0-9]+(\.[0-9]*)?|[-+]?\.[0-9]+)([eE][-+]?[0-9]+)?)/)) return [];
          ((o[o.length] = { type: st, text: `${parseFloat(RegExp.$1)}` }),
            (i = i.substr(RegExp.$1.length)));
        }
      return ((o[o.length] = { type: dt, text: "" }), o);
    })(r);
  let e = "BOD",
    n = 0,
    a = s[n];
  for (; !nt(a, dt);) {
    let i = 0;
    const o = [];
    if (e === "BOD") {
      if (a.text !== "M" && a.text !== "m") return ct("M0,0" + r);
      (n++, (i = Q[a.text]), (e = a.text));
    } else nt(a, st) ? (i = Q[e]) : (n++, (i = Q[a.text]), (e = a.text));
    if (!(n + i < s.length)) throw new Error("Path data ended short");
    for (let h = n; h < n + i; h++) {
      const c = s[h];
      if (!nt(c, st)) throw new Error("Param not a number: " + e + "," + c.text);
      o[o.length] = +c.text;
    }
    if (typeof Q[e] != "number") throw new Error("Bad segment: " + e);
    {
      const h = { key: e, data: o };
      (t.push(h), (n += i), (a = s[n]), e === "M" && (e = "L"), e === "m" && (e = "l"));
    }
  }
  return t;
}
function Tt(r) {
  let t = 0,
    s = 0,
    e = 0,
    n = 0;
  const a = [];
  for (const { key: i, data: o } of r)
    switch (i) {
      case "M":
        (a.push({ key: "M", data: [...o] }), ([t, s] = o), ([e, n] = o));
        break;
      case "m":
        ((t += o[0]), (s += o[1]), a.push({ key: "M", data: [t, s] }), (e = t), (n = s));
        break;
      case "L":
        (a.push({ key: "L", data: [...o] }), ([t, s] = o));
        break;
      case "l":
        ((t += o[0]), (s += o[1]), a.push({ key: "L", data: [t, s] }));
        break;
      case "C":
        (a.push({ key: "C", data: [...o] }), (t = o[4]), (s = o[5]));
        break;
      case "c": {
        const h = o.map((c, l) => (l % 2 ? c + s : c + t));
        (a.push({ key: "C", data: h }), (t = h[4]), (s = h[5]));
        break;
      }
      case "Q":
        (a.push({ key: "Q", data: [...o] }), (t = o[2]), (s = o[3]));
        break;
      case "q": {
        const h = o.map((c, l) => (l % 2 ? c + s : c + t));
        (a.push({ key: "Q", data: h }), (t = h[2]), (s = h[3]));
        break;
      }
      case "A":
        (a.push({ key: "A", data: [...o] }), (t = o[5]), (s = o[6]));
        break;
      case "a":
        ((t += o[5]),
          (s += o[6]),
          a.push({ key: "A", data: [o[0], o[1], o[2], o[3], o[4], t, s] }));
        break;
      case "H":
        (a.push({ key: "H", data: [...o] }), (t = o[0]));
        break;
      case "h":
        ((t += o[0]), a.push({ key: "H", data: [t] }));
        break;
      case "V":
        (a.push({ key: "V", data: [...o] }), (s = o[0]));
        break;
      case "v":
        ((s += o[0]), a.push({ key: "V", data: [s] }));
        break;
      case "S":
        (a.push({ key: "S", data: [...o] }), (t = o[2]), (s = o[3]));
        break;
      case "s": {
        const h = o.map((c, l) => (l % 2 ? c + s : c + t));
        (a.push({ key: "S", data: h }), (t = h[2]), (s = h[3]));
        break;
      }
      case "T":
        (a.push({ key: "T", data: [...o] }), (t = o[0]), (s = o[1]));
        break;
      case "t":
        ((t += o[0]), (s += o[1]), a.push({ key: "T", data: [t, s] }));
        break;
      case "Z":
      case "z":
        (a.push({ key: "Z", data: [] }), (t = e), (s = n));
    }
  return a;
}
function vt(r) {
  const t = [];
  let s = "",
    e = 0,
    n = 0,
    a = 0,
    i = 0,
    o = 0,
    h = 0;
  for (const { key: c, data: l } of r) {
    switch (c) {
      case "M":
        (t.push({ key: "M", data: [...l] }), ([e, n] = l), ([a, i] = l));
        break;
      case "C":
        (t.push({ key: "C", data: [...l] }), (e = l[4]), (n = l[5]), (o = l[2]), (h = l[3]));
        break;
      case "L":
        (t.push({ key: "L", data: [...l] }), ([e, n] = l));
        break;
      case "H":
        ((e = l[0]), t.push({ key: "L", data: [e, n] }));
        break;
      case "V":
        ((n = l[0]), t.push({ key: "L", data: [e, n] }));
        break;
      case "S": {
        let d = 0,
          f = 0;
        (s === "C" || s === "S" ? ((d = e + (e - o)), (f = n + (n - h))) : ((d = e), (f = n)),
          t.push({ key: "C", data: [d, f, ...l] }),
          (o = l[0]),
          (h = l[1]),
          (e = l[2]),
          (n = l[3]));
        break;
      }
      case "T": {
        const [d, f] = l;
        let p = 0,
          u = 0;
        s === "Q" || s === "T" ? ((p = e + (e - o)), (u = n + (n - h))) : ((p = e), (u = n));
        const g = e + (2 * (p - e)) / 3,
          k = n + (2 * (u - n)) / 3,
          M = d + (2 * (p - d)) / 3,
          b = f + (2 * (u - f)) / 3;
        (t.push({ key: "C", data: [g, k, M, b, d, f] }), (o = p), (h = u), (e = d), (n = f));
        break;
      }
      case "Q": {
        const [d, f, p, u] = l,
          g = e + (2 * (d - e)) / 3,
          k = n + (2 * (f - n)) / 3,
          M = p + (2 * (d - p)) / 3,
          b = u + (2 * (f - u)) / 3;
        (t.push({ key: "C", data: [g, k, M, b, p, u] }), (o = d), (h = f), (e = p), (n = u));
        break;
      }
      case "A": {
        const d = Math.abs(l[0]),
          f = Math.abs(l[1]),
          p = l[2],
          u = l[3],
          g = l[4],
          k = l[5],
          M = l[6];
        d === 0 || f === 0
          ? (t.push({ key: "C", data: [e, n, k, M, k, M] }), (e = k), (n = M))
          : (e !== k || n !== M) &&
            (wt(e, n, k, M, d, f, p, u, g).forEach(function (b) {
              t.push({ key: "C", data: b });
            }),
            (e = k),
            (n = M));
        break;
      }
      case "Z":
        (t.push({ key: "Z", data: [] }), (e = a), (n = i));
    }
    s = c;
  }
  return t;
}
function F(r, t, s) {
  return [r * Math.cos(s) - t * Math.sin(s), r * Math.sin(s) + t * Math.cos(s)];
}
function wt(r, t, s, e, n, a, i, o, h, c) {
  const l = ((d = i), (Math.PI * d) / 180);
  var d;
  let f = [],
    p = 0,
    u = 0,
    g = 0,
    k = 0;
  if (c) [p, u, g, k] = c;
  else {
    (([r, t] = F(r, t, -l)), ([s, e] = F(s, e, -l)));
    const L = (r - s) / 2,
      P = (t - e) / 2;
    let D = (L * L) / (n * n) + (P * P) / (a * a);
    D > 1 && ((D = Math.sqrt(D)), (n *= D), (a *= D));
    const W = n * n,
      _ = a * a,
      Ot = W * _ - W * P * P - _ * L * L,
      Et = W * P * P + _ * L * L,
      pt = (o === h ? -1 : 1) * Math.sqrt(Math.abs(Ot / Et));
    ((g = (pt * n * P) / a + (r + s) / 2),
      (k = (pt * -a * L) / n + (t + e) / 2),
      (p = Math.asin(parseFloat(((t - k) / a).toFixed(9)))),
      (u = Math.asin(parseFloat(((e - k) / a).toFixed(9)))),
      r < g && (p = Math.PI - p),
      s < g && (u = Math.PI - u),
      p < 0 && (p = 2 * Math.PI + p),
      u < 0 && (u = 2 * Math.PI + u),
      h && p > u && (p -= 2 * Math.PI),
      !h && u > p && (u -= 2 * Math.PI));
  }
  let M = u - p;
  if (Math.abs(M) > (120 * Math.PI) / 180) {
    const L = u,
      P = s,
      D = e;
    ((u = h && u > p ? p + ((120 * Math.PI) / 180) * 1 : p + ((120 * Math.PI) / 180) * -1),
      (f = wt((s = g + n * Math.cos(u)), (e = k + a * Math.sin(u)), P, D, n, a, i, 0, h, [
        u,
        L,
        g,
        k,
      ])));
  }
  M = u - p;
  const b = Math.cos(p),
    m = Math.sin(p),
    w = Math.cos(u),
    S = Math.sin(u),
    T = Math.tan(M / 4),
    E = (4 / 3) * n * T,
    j = (4 / 3) * a * T,
    B = [r, t],
    C = [r + E * m, t - j * b],
    N = [s + E * S, e - j * w],
    ut = [s, e];
  if (((C[0] = 2 * B[0] - C[0]), (C[1] = 2 * B[1] - C[1]), c)) return [C, N, ut].concat(f);
  {
    f = [C, N, ut].concat(f);
    const L = [];
    for (let P = 0; P < f.length; P += 3) {
      const D = F(f[P][0], f[P][1], l),
        W = F(f[P + 1][0], f[P + 1][1], l),
        _ = F(f[P + 2][0], f[P + 2][1], l);
      L.push([D[0], D[1], W[0], W[1], _[0], _[1]]);
    }
    return L;
  }
}
const $t = {
  randOffset: function (r, t) {
    return x(r, t);
  },
  randOffsetWithRange: function (r, t, s) {
    return Y(r, t, s);
  },
  ellipse: function (r, t, s, e, n) {
    const a = Pt(s, e, n);
    return ot(r, t, n, a).opset;
  },
  doubleLineOps: function (r, t, s, e, n) {
    return I(r, t, s, e, n, !0);
  },
};
function St(r, t, s, e, n) {
  return { type: "path", ops: I(r, t, s, e, n) };
}
function H(r, t, s) {
  const e = (r || []).length;
  if (e > 2) {
    const n = [];
    for (let a = 0; a < e - 1; a++) n.push(...I(r[a][0], r[a][1], r[a + 1][0], r[a + 1][1], s));
    return (
      t && n.push(...I(r[e - 1][0], r[e - 1][1], r[0][0], r[0][1], s)),
      { type: "path", ops: n }
    );
  }
  return e === 2 ? St(r[0][0], r[0][1], r[1][0], r[1][1], s) : { type: "path", ops: [] };
}
function Ft(r, t, s, e, n) {
  return (function (a, i) {
    return H(a, !0, i);
  })(
    [
      [r, t],
      [r + s, t],
      [r + s, t + e],
      [r, t + e],
    ],
    n,
  );
}
function gt(r, t) {
  if (r.length) {
    const s = typeof r[0][0] == "number" ? [r] : r,
      e = V(s[0], 1 * (1 + 0.2 * t.roughness), t),
      n = t.disableMultiStroke ? [] : V(s[0], 1.5 * (1 + 0.22 * t.roughness), Mt(t));
    for (let a = 1; a < s.length; a++) {
      const i = s[a];
      if (i.length) {
        const o = V(i, 1 * (1 + 0.2 * t.roughness), t),
          h = t.disableMultiStroke ? [] : V(i, 1.5 * (1 + 0.22 * t.roughness), Mt(t));
        for (const c of o) c.op !== "move" && e.push(c);
        for (const c of h) c.op !== "move" && n.push(c);
      }
    }
    return { type: "path", ops: e.concat(n) };
  }
  return { type: "path", ops: [] };
}
function Pt(r, t, s) {
  const e = Math.sqrt(2 * Math.PI * Math.sqrt((Math.pow(r / 2, 2) + Math.pow(t / 2, 2)) / 2)),
    n = Math.ceil(Math.max(s.curveStepCount, (s.curveStepCount / Math.sqrt(200)) * e)),
    a = (2 * Math.PI) / n;
  let i = Math.abs(r / 2),
    o = Math.abs(t / 2);
  const h = 1 - s.curveFitting;
  return ((i += x(i * h, s)), (o += x(o * h, s)), { increment: a, rx: i, ry: o });
}
function ot(r, t, s, e) {
  const [n, a] = mt(e.increment, r, t, e.rx, e.ry, 1, e.increment * Y(0.1, Y(0.4, 1, s), s), s);
  let i = K(n, null, s);
  if (!s.disableMultiStroke && s.roughness !== 0) {
    const [o] = mt(e.increment, r, t, e.rx, e.ry, 1.5, 0, s),
      h = K(o, null, s);
    i = i.concat(h);
  }
  return { estimatedPoints: a, opset: { type: "path", ops: i } };
}
function kt(r, t, s, e, n, a, i, o, h) {
  const c = r,
    l = t;
  let d = Math.abs(s / 2),
    f = Math.abs(e / 2);
  ((d += x(0.01 * d, h)), (f += x(0.01 * f, h)));
  let p = n,
    u = a;
  for (; p < 0;) ((p += 2 * Math.PI), (u += 2 * Math.PI));
  u - p > 2 * Math.PI && ((p = 0), (u = 2 * Math.PI));
  const g = (2 * Math.PI) / h.curveStepCount,
    k = Math.min(g / 2, (u - p) / 2),
    M = xt(k, c, l, d, f, p, u, 1, h);
  if (!h.disableMultiStroke) {
    const b = xt(k, c, l, d, f, p, u, 1.5, h);
    M.push(...b);
  }
  return (
    i &&
      (o
        ? M.push(
            ...I(c, l, c + d * Math.cos(p), l + f * Math.sin(p), h),
            ...I(c, l, c + d * Math.cos(u), l + f * Math.sin(u), h),
          )
        : M.push(
            { op: "lineTo", data: [c, l] },
            { op: "lineTo", data: [c + d * Math.cos(p), l + f * Math.sin(p)] },
          )),
    { type: "path", ops: M }
  );
}
function bt(r, t) {
  const s = vt(Tt(ct(r))),
    e = [];
  let n = [0, 0],
    a = [0, 0];
  for (const { key: i, data: o } of s)
    switch (i) {
      case "M":
        ((a = [o[0], o[1]]), (n = [o[0], o[1]]));
        break;
      case "L":
        (e.push(...I(a[0], a[1], o[0], o[1], t)), (a = [o[0], o[1]]));
        break;
      case "C": {
        const [h, c, l, d, f, p] = o;
        (e.push(...zt(h, c, l, d, f, p, a, t)), (a = [f, p]));
        break;
      }
      case "Z":
        (e.push(...I(a[0], a[1], n[0], n[1], t)), (a = [n[0], n[1]]));
    }
  return { type: "path", ops: e };
}
function rt(r, t) {
  const s = [];
  for (const e of r)
    if (e.length) {
      const n = t.maxRandomnessOffset || 0,
        a = e.length;
      if (a > 2) {
        s.push({ op: "move", data: [e[0][0] + x(n, t), e[0][1] + x(n, t)] });
        for (let i = 1; i < a; i++)
          s.push({ op: "lineTo", data: [e[i][0] + x(n, t), e[i][1] + x(n, t)] });
      }
    }
  return { type: "fillPath", ops: s };
}
function $(r, t) {
  return (function (s, e) {
    let n = s.fillStyle || "hachure";
    if (!A[n])
      switch (n) {
        case "zigzag":
          A[n] || (A[n] = new jt(e));
          break;
        case "cross-hatch":
          A[n] || (A[n] = new Dt(e));
          break;
        case "dots":
          A[n] || (A[n] = new It(e));
          break;
        case "dashed":
          A[n] || (A[n] = new Nt(e));
          break;
        case "zigzag-line":
          A[n] || (A[n] = new Rt(e));
          break;
        default:
          ((n = "hachure"), A[n] || (A[n] = new lt(e)));
      }
    return A[n];
  })(t, $t).fillPolygons(r, t);
}
function Mt(r) {
  const t = Object.assign({}, r);
  return ((t.randomizer = void 0), r.seed && (t.seed = r.seed + 1), t);
}
function At(r) {
  return (r.randomizer || (r.randomizer = new Wt(r.seed || 0)), r.randomizer.next());
}
function Y(r, t, s, e = 1) {
  return s.roughness * e * (At(s) * (t - r) + r);
}
function x(r, t, s = 1) {
  return Y(-r, r, t, s);
}
function I(r, t, s, e, n, a = !1) {
  const i = a ? n.disableMultiStrokeFill : n.disableMultiStroke,
    o = it(r, t, s, e, n, !0, !1);
  if (i) return o;
  const h = it(r, t, s, e, n, !0, !0);
  return o.concat(h);
}
function it(r, t, s, e, n, a, i) {
  const o = Math.pow(r - s, 2) + Math.pow(t - e, 2),
    h = Math.sqrt(o);
  let c = 1;
  c = h < 200 ? 1 : h > 500 ? 0.4 : -0.0016668 * h + 1.233334;
  let l = n.maxRandomnessOffset || 0;
  l * l * 100 > o && (l = h / 10);
  const d = l / 2,
    f = 0.2 + 0.2 * At(n);
  let p = (n.bowing * n.maxRandomnessOffset * (e - t)) / 200,
    u = (n.bowing * n.maxRandomnessOffset * (r - s)) / 200;
  ((p = x(p, n, c)), (u = x(u, n, c)));
  const g = [],
    k = () => x(d, n, c),
    M = () => x(l, n, c),
    b = n.preserveVertices;
  return (
    i
      ? g.push({ op: "move", data: [r + (b ? 0 : k()), t + (b ? 0 : k())] })
      : g.push({ op: "move", data: [r + (b ? 0 : x(l, n, c)), t + (b ? 0 : x(l, n, c))] }),
    i
      ? g.push({
          op: "bcurveTo",
          data: [
            p + r + (s - r) * f + k(),
            u + t + (e - t) * f + k(),
            p + r + 2 * (s - r) * f + k(),
            u + t + 2 * (e - t) * f + k(),
            s + (b ? 0 : k()),
            e + (b ? 0 : k()),
          ],
        })
      : g.push({
          op: "bcurveTo",
          data: [
            p + r + (s - r) * f + M(),
            u + t + (e - t) * f + M(),
            p + r + 2 * (s - r) * f + M(),
            u + t + 2 * (e - t) * f + M(),
            s + (b ? 0 : M()),
            e + (b ? 0 : M()),
          ],
        }),
    g
  );
}
function V(r, t, s) {
  if (!r.length) return [];
  const e = [];
  (e.push([r[0][0] + x(t, s), r[0][1] + x(t, s)]), e.push([r[0][0] + x(t, s), r[0][1] + x(t, s)]));
  for (let n = 1; n < r.length; n++)
    (e.push([r[n][0] + x(t, s), r[n][1] + x(t, s)]),
      n === r.length - 1 && e.push([r[n][0] + x(t, s), r[n][1] + x(t, s)]));
  return K(e, null, s);
}
function K(r, t, s) {
  const e = r.length,
    n = [];
  if (e > 3) {
    const a = [],
      i = 1 - s.curveTightness;
    n.push({ op: "move", data: [r[1][0], r[1][1]] });
    for (let o = 1; o + 2 < e; o++) {
      const h = r[o];
      ((a[0] = [h[0], h[1]]),
        (a[1] = [
          h[0] + (i * r[o + 1][0] - i * r[o - 1][0]) / 6,
          h[1] + (i * r[o + 1][1] - i * r[o - 1][1]) / 6,
        ]),
        (a[2] = [
          r[o + 1][0] + (i * r[o][0] - i * r[o + 2][0]) / 6,
          r[o + 1][1] + (i * r[o][1] - i * r[o + 2][1]) / 6,
        ]),
        (a[3] = [r[o + 1][0], r[o + 1][1]]),
        n.push({ op: "bcurveTo", data: [a[1][0], a[1][1], a[2][0], a[2][1], a[3][0], a[3][1]] }));
    }
  } else
    e === 3
      ? (n.push({ op: "move", data: [r[1][0], r[1][1]] }),
        n.push({ op: "bcurveTo", data: [r[1][0], r[1][1], r[2][0], r[2][1], r[2][0], r[2][1]] }))
      : e === 2 && n.push(...it(r[0][0], r[0][1], r[1][0], r[1][1], s, !0, !0));
  return n;
}
function mt(r, t, s, e, n, a, i, o) {
  const h = [],
    c = [];
  if (o.roughness === 0) {
    ((r /= 4), c.push([t + e * Math.cos(-r), s + n * Math.sin(-r)]));
    for (let l = 0; l <= 2 * Math.PI; l += r) {
      const d = [t + e * Math.cos(l), s + n * Math.sin(l)];
      (h.push(d), c.push(d));
    }
    (c.push([t + e * Math.cos(0), s + n * Math.sin(0)]),
      c.push([t + e * Math.cos(r), s + n * Math.sin(r)]));
  } else {
    const l = x(0.5, o) - Math.PI / 2;
    c.push([x(a, o) + t + 0.9 * e * Math.cos(l - r), x(a, o) + s + 0.9 * n * Math.sin(l - r)]);
    const d = 2 * Math.PI + l - 0.01;
    for (let f = l; f < d; f += r) {
      const p = [x(a, o) + t + e * Math.cos(f), x(a, o) + s + n * Math.sin(f)];
      (h.push(p), c.push(p));
    }
    (c.push([
      x(a, o) + t + e * Math.cos(l + 2 * Math.PI + 0.5 * i),
      x(a, o) + s + n * Math.sin(l + 2 * Math.PI + 0.5 * i),
    ]),
      c.push([x(a, o) + t + 0.98 * e * Math.cos(l + i), x(a, o) + s + 0.98 * n * Math.sin(l + i)]),
      c.push([
        x(a, o) + t + 0.9 * e * Math.cos(l + 0.5 * i),
        x(a, o) + s + 0.9 * n * Math.sin(l + 0.5 * i),
      ]));
  }
  return [c, h];
}
function xt(r, t, s, e, n, a, i, o, h) {
  const c = a + x(0.1, h),
    l = [];
  l.push([x(o, h) + t + 0.9 * e * Math.cos(c - r), x(o, h) + s + 0.9 * n * Math.sin(c - r)]);
  for (let d = c; d <= i; d += r)
    l.push([x(o, h) + t + e * Math.cos(d), x(o, h) + s + n * Math.sin(d)]);
  return (
    l.push([t + e * Math.cos(i), s + n * Math.sin(i)]),
    l.push([t + e * Math.cos(i), s + n * Math.sin(i)]),
    K(l, null, h)
  );
}
function zt(r, t, s, e, n, a, i, o) {
  const h = [],
    c = [o.maxRandomnessOffset || 1, (o.maxRandomnessOffset || 1) + 0.3];
  let l = [0, 0];
  const d = o.disableMultiStroke ? 1 : 2,
    f = o.preserveVertices;
  for (let p = 0; p < d; p++)
    (p === 0
      ? h.push({ op: "move", data: [i[0], i[1]] })
      : h.push({ op: "move", data: [i[0] + (f ? 0 : x(c[0], o)), i[1] + (f ? 0 : x(c[0], o))] }),
      (l = f ? [n, a] : [n + x(c[p], o), a + x(c[p], o)]),
      h.push({
        op: "bcurveTo",
        data: [r + x(c[p], o), t + x(c[p], o), s + x(c[p], o), e + x(c[p], o), l[0], l[1]],
      }));
  return h;
}
function z(r) {
  return [...r];
}
function yt(r, t = 0) {
  const s = r.length;
  if (s < 3) throw new Error("A curve must have at least three points.");
  const e = [];
  if (s === 3) e.push(z(r[0]), z(r[1]), z(r[2]), z(r[2]));
  else {
    const n = [];
    n.push(r[0], r[0]);
    for (let o = 1; o < r.length; o++) (n.push(r[o]), o === r.length - 1 && n.push(r[o]));
    const a = [],
      i = 1 - t;
    e.push(z(n[0]));
    for (let o = 1; o + 2 < n.length; o++) {
      const h = n[o];
      ((a[0] = [h[0], h[1]]),
        (a[1] = [
          h[0] + (i * n[o + 1][0] - i * n[o - 1][0]) / 6,
          h[1] + (i * n[o + 1][1] - i * n[o - 1][1]) / 6,
        ]),
        (a[2] = [
          n[o + 1][0] + (i * n[o][0] - i * n[o + 2][0]) / 6,
          n[o + 1][1] + (i * n[o][1] - i * n[o + 2][1]) / 6,
        ]),
        (a[3] = [n[o + 1][0], n[o + 1][1]]),
        e.push(a[1], a[2], a[3]));
    }
  }
  return e;
}
function U(r, t) {
  return Math.pow(r[0] - t[0], 2) + Math.pow(r[1] - t[1], 2);
}
function Gt(r, t, s) {
  const e = U(t, s);
  if (e === 0) return U(r, t);
  let n = ((r[0] - t[0]) * (s[0] - t[0]) + (r[1] - t[1]) * (s[1] - t[1])) / e;
  return ((n = Math.max(0, Math.min(1, n))), U(r, R(t, s, n)));
}
function R(r, t, s) {
  return [r[0] + (t[0] - r[0]) * s, r[1] + (t[1] - r[1]) * s];
}
function ht(r, t, s, e) {
  const n = e || [];
  if (
    (function (o, h) {
      const c = o[h + 0],
        l = o[h + 1],
        d = o[h + 2],
        f = o[h + 3];
      let p = 3 * l[0] - 2 * c[0] - f[0];
      p *= p;
      let u = 3 * l[1] - 2 * c[1] - f[1];
      u *= u;
      let g = 3 * d[0] - 2 * f[0] - c[0];
      g *= g;
      let k = 3 * d[1] - 2 * f[1] - c[1];
      return ((k *= k), p < g && (p = g), u < k && (u = k), p + u);
    })(r, t) < s
  ) {
    const o = r[t + 0];
    (n.length ? ((a = n[n.length - 1]), (i = o), Math.sqrt(U(a, i)) > 1 && n.push(o)) : n.push(o),
      n.push(r[t + 3]));
  } else {
    const h = r[t + 0],
      c = r[t + 1],
      l = r[t + 2],
      d = r[t + 3],
      f = R(h, c, 0.5),
      p = R(c, l, 0.5),
      u = R(l, d, 0.5),
      g = R(f, p, 0.5),
      k = R(p, u, 0.5),
      M = R(g, k, 0.5);
    (ht([h, f, g, M], 0, s, n), ht([M, k, u, d], 0, s, n));
  }
  var a, i;
  return n;
}
function Bt(r, t) {
  return J(r, 0, r.length, t);
}
function J(r, t, s, e, n) {
  const a = n || [],
    i = r[t],
    o = r[s - 1];
  let h = 0,
    c = 1;
  for (let l = t + 1; l < s - 1; ++l) {
    const d = Gt(r[l], i, o);
    d > h && ((h = d), (c = l));
  }
  return (
    Math.sqrt(h) > e
      ? (J(r, t, c + 1, e, a), J(r, c, s, e, a))
      : (a.length || a.push(i), a.push(o)),
    a
  );
}
function at(r, t = 0.15, s) {
  const e = [],
    n = (r.length - 1) / 3;
  for (let a = 0; a < n; a++) ht(r, 3 * a, t, e);
  return s && s > 0 ? J(e, 0, e.length, s) : e;
}
const O = "none";
class X {
  constructor(t) {
    ((this.defaultOptions = {
      maxRandomnessOffset: 2,
      roughness: 1,
      bowing: 1,
      stroke: "#000",
      strokeWidth: 1,
      curveTightness: 0,
      curveFitting: 0.95,
      curveStepCount: 9,
      fillStyle: "hachure",
      fillWeight: -1,
      hachureAngle: -41,
      hachureGap: -1,
      dashOffset: -1,
      dashGap: -1,
      zigzagOffset: -1,
      seed: 0,
      disableMultiStroke: !1,
      disableMultiStrokeFill: !1,
      preserveVertices: !1,
      fillShapeRoughnessGain: 0.8,
    }),
      (this.config = t || {}),
      this.config.options && (this.defaultOptions = this._o(this.config.options)));
  }
  static newSeed() {
    return Math.floor(Math.random() * 2 ** 31);
  }
  _o(t) {
    return t ? Object.assign({}, this.defaultOptions, t) : this.defaultOptions;
  }
  _d(t, s, e) {
    return { shape: t, sets: s || [], options: e || this.defaultOptions };
  }
  line(t, s, e, n, a) {
    const i = this._o(a);
    return this._d("line", [St(t, s, e, n, i)], i);
  }
  rectangle(t, s, e, n, a) {
    const i = this._o(a),
      o = [],
      h = Ft(t, s, e, n, i);
    if (i.fill) {
      const c = [
        [t, s],
        [t + e, s],
        [t + e, s + n],
        [t, s + n],
      ];
      i.fillStyle === "solid" ? o.push(rt([c], i)) : o.push($([c], i));
    }
    return (i.stroke !== O && o.push(h), this._d("rectangle", o, i));
  }
  ellipse(t, s, e, n, a) {
    const i = this._o(a),
      o = [],
      h = Pt(e, n, i),
      c = ot(t, s, i, h);
    if (i.fill)
      if (i.fillStyle === "solid") {
        const l = ot(t, s, i, h).opset;
        ((l.type = "fillPath"), o.push(l));
      } else o.push($([c.estimatedPoints], i));
    return (i.stroke !== O && o.push(c.opset), this._d("ellipse", o, i));
  }
  circle(t, s, e, n) {
    const a = this.ellipse(t, s, e, e, n);
    return ((a.shape = "circle"), a);
  }
  linearPath(t, s) {
    const e = this._o(s);
    return this._d("linearPath", [H(t, !1, e)], e);
  }
  arc(t, s, e, n, a, i, o = !1, h) {
    const c = this._o(h),
      l = [],
      d = kt(t, s, e, n, a, i, o, !0, c);
    if (o && c.fill)
      if (c.fillStyle === "solid") {
        const f = Object.assign({}, c);
        f.disableMultiStroke = !0;
        const p = kt(t, s, e, n, a, i, !0, !1, f);
        ((p.type = "fillPath"), l.push(p));
      } else
        l.push(
          (function (f, p, u, g, k, M, b) {
            const m = f,
              w = p;
            let S = Math.abs(u / 2),
              T = Math.abs(g / 2);
            ((S += x(0.01 * S, b)), (T += x(0.01 * T, b)));
            let E = k,
              j = M;
            for (; E < 0;) ((E += 2 * Math.PI), (j += 2 * Math.PI));
            j - E > 2 * Math.PI && ((E = 0), (j = 2 * Math.PI));
            const B = (j - E) / b.curveStepCount,
              C = [];
            for (let N = E; N <= j; N += B) C.push([m + S * Math.cos(N), w + T * Math.sin(N)]);
            return (C.push([m + S * Math.cos(j), w + T * Math.sin(j)]), C.push([m, w]), $([C], b));
          })(t, s, e, n, a, i, c),
        );
    return (c.stroke !== O && l.push(d), this._d("arc", l, c));
  }
  curve(t, s) {
    const e = this._o(s),
      n = [],
      a = gt(t, e);
    if (e.fill && e.fill !== O)
      if (e.fillStyle === "solid") {
        const i = gt(
          t,
          Object.assign(Object.assign({}, e), {
            disableMultiStroke: !0,
            roughness: e.roughness ? e.roughness + e.fillShapeRoughnessGain : 0,
          }),
        );
        n.push({ type: "fillPath", ops: this._mergedShape(i.ops) });
      } else {
        const i = [],
          o = t;
        if (o.length) {
          const h = typeof o[0][0] == "number" ? [o] : o;
          for (const c of h)
            c.length < 3
              ? i.push(...c)
              : c.length === 3
                ? i.push(...at(yt([c[0], c[0], c[1], c[2]]), 10, (1 + e.roughness) / 2))
                : i.push(...at(yt(c), 10, (1 + e.roughness) / 2));
        }
        i.length && n.push($([i], e));
      }
    return (e.stroke !== O && n.push(a), this._d("curve", n, e));
  }
  polygon(t, s) {
    const e = this._o(s),
      n = [],
      a = H(t, !0, e);
    return (
      e.fill && (e.fillStyle === "solid" ? n.push(rt([t], e)) : n.push($([t], e))),
      e.stroke !== O && n.push(a),
      this._d("polygon", n, e)
    );
  }
  path(t, s) {
    const e = this._o(s),
      n = [];
    if (!t) return this._d("path", n, e);
    t = (t || "").replace(/\n/g, " ").replace(/(-\s)/g, "-").replace("/(ss)/g", " ");
    const a = e.fill && e.fill !== "transparent" && e.fill !== O,
      i = e.stroke !== O,
      o = !!(e.simplification && e.simplification < 1),
      h = (function (l, d, f) {
        const p = vt(Tt(ct(l))),
          u = [];
        let g = [],
          k = [0, 0],
          M = [];
        const b = () => {
            (M.length >= 4 && g.push(...at(M, d)), (M = []));
          },
          m = () => {
            (b(), g.length && (u.push(g), (g = [])));
          };
        for (const { key: S, data: T } of p)
          switch (S) {
            case "M":
              (m(), (k = [T[0], T[1]]), g.push(k));
              break;
            case "L":
              (b(), g.push([T[0], T[1]]));
              break;
            case "C":
              if (!M.length) {
                const E = g.length ? g[g.length - 1] : k;
                M.push([E[0], E[1]]);
              }
              (M.push([T[0], T[1]]), M.push([T[2], T[3]]), M.push([T[4], T[5]]));
              break;
            case "Z":
              (b(), g.push([k[0], k[1]]));
          }
        if ((m(), !f)) return u;
        const w = [];
        for (const S of u) {
          const T = Bt(S, f);
          T.length && w.push(T);
        }
        return w;
      })(t, 1, o ? 4 - 4 * (e.simplification || 1) : (1 + e.roughness) / 2),
      c = bt(t, e);
    if (a)
      if (e.fillStyle === "solid")
        if (h.length === 1) {
          const l = bt(
            t,
            Object.assign(Object.assign({}, e), {
              disableMultiStroke: !0,
              roughness: e.roughness ? e.roughness + e.fillShapeRoughnessGain : 0,
            }),
          );
          n.push({ type: "fillPath", ops: this._mergedShape(l.ops) });
        } else n.push(rt(h, e));
      else n.push($(h, e));
    return (
      i &&
        (o
          ? h.forEach((l) => {
              n.push(H(l, !1, e));
            })
          : n.push(c)),
      this._d("path", n, e)
    );
  }
  opsToPath(t, s) {
    let e = "";
    for (const n of t.ops) {
      const a = typeof s == "number" && s >= 0 ? n.data.map((i) => +i.toFixed(s)) : n.data;
      switch (n.op) {
        case "move":
          e += `M${a[0]} ${a[1]} `;
          break;
        case "bcurveTo":
          e += `C${a[0]} ${a[1]}, ${a[2]} ${a[3]}, ${a[4]} ${a[5]} `;
          break;
        case "lineTo":
          e += `L${a[0]} ${a[1]} `;
      }
    }
    return e.trim();
  }
  toPaths(t) {
    const s = t.sets || [],
      e = t.options || this.defaultOptions,
      n = [];
    for (const a of s) {
      let i = null;
      switch (a.type) {
        case "path":
          i = { d: this.opsToPath(a), stroke: e.stroke, strokeWidth: e.strokeWidth, fill: O };
          break;
        case "fillPath":
          i = { d: this.opsToPath(a), stroke: O, strokeWidth: 0, fill: e.fill || O };
          break;
        case "fillSketch":
          i = this.fillSketch(a, e);
      }
      i && n.push(i);
    }
    return n;
  }
  fillSketch(t, s) {
    let e = s.fillWeight;
    return (
      e < 0 && (e = s.strokeWidth / 2),
      { d: this.opsToPath(t), stroke: s.fill || O, strokeWidth: e, fill: O }
    );
  }
  _mergedShape(t) {
    return t.filter((s, e) => e === 0 || s.op !== "move");
  }
}
class qt {
  constructor(t, s) {
    ((this.canvas = t), (this.ctx = this.canvas.getContext("2d")), (this.gen = new X(s)));
  }
  draw(t) {
    const s = t.sets || [],
      e = t.options || this.getDefaultOptions(),
      n = this.ctx,
      a = t.options.fixedDecimalPlaceDigits;
    for (const i of s)
      switch (i.type) {
        case "path":
          (n.save(),
            (n.strokeStyle = e.stroke === "none" ? "transparent" : e.stroke),
            (n.lineWidth = e.strokeWidth),
            e.strokeLineDash && n.setLineDash(e.strokeLineDash),
            e.strokeLineDashOffset && (n.lineDashOffset = e.strokeLineDashOffset),
            this._drawToContext(n, i, a),
            n.restore());
          break;
        case "fillPath": {
          (n.save(), (n.fillStyle = e.fill || ""));
          const o =
            t.shape === "curve" || t.shape === "polygon" || t.shape === "path"
              ? "evenodd"
              : "nonzero";
          (this._drawToContext(n, i, a, o), n.restore());
          break;
        }
        case "fillSketch":
          this.fillSketch(n, i, e);
      }
  }
  fillSketch(t, s, e) {
    let n = e.fillWeight;
    (n < 0 && (n = e.strokeWidth / 2),
      t.save(),
      e.fillLineDash && t.setLineDash(e.fillLineDash),
      e.fillLineDashOffset && (t.lineDashOffset = e.fillLineDashOffset),
      (t.strokeStyle = e.fill || ""),
      (t.lineWidth = n),
      this._drawToContext(t, s, e.fixedDecimalPlaceDigits),
      t.restore());
  }
  _drawToContext(t, s, e, n = "nonzero") {
    t.beginPath();
    for (const a of s.ops) {
      const i = typeof e == "number" && e >= 0 ? a.data.map((o) => +o.toFixed(e)) : a.data;
      switch (a.op) {
        case "move":
          t.moveTo(i[0], i[1]);
          break;
        case "bcurveTo":
          t.bezierCurveTo(i[0], i[1], i[2], i[3], i[4], i[5]);
          break;
        case "lineTo":
          t.lineTo(i[0], i[1]);
      }
    }
    s.type === "fillPath" ? t.fill(n) : t.stroke();
  }
  get generator() {
    return this.gen;
  }
  getDefaultOptions() {
    return this.gen.defaultOptions;
  }
  line(t, s, e, n, a) {
    const i = this.gen.line(t, s, e, n, a);
    return (this.draw(i), i);
  }
  rectangle(t, s, e, n, a) {
    const i = this.gen.rectangle(t, s, e, n, a);
    return (this.draw(i), i);
  }
  ellipse(t, s, e, n, a) {
    const i = this.gen.ellipse(t, s, e, n, a);
    return (this.draw(i), i);
  }
  circle(t, s, e, n) {
    const a = this.gen.circle(t, s, e, n);
    return (this.draw(a), a);
  }
  linearPath(t, s) {
    const e = this.gen.linearPath(t, s);
    return (this.draw(e), e);
  }
  polygon(t, s) {
    const e = this.gen.polygon(t, s);
    return (this.draw(e), e);
  }
  arc(t, s, e, n, a, i, o = !1, h) {
    const c = this.gen.arc(t, s, e, n, a, i, o, h);
    return (this.draw(c), c);
  }
  curve(t, s) {
    const e = this.gen.curve(t, s);
    return (this.draw(e), e);
  }
  path(t, s) {
    const e = this.gen.path(t, s);
    return (this.draw(e), e);
  }
}
const Z = "http://www.w3.org/2000/svg";
class Qt {
  constructor(t, s) {
    ((this.svg = t), (this.gen = new X(s)));
  }
  draw(t) {
    const s = t.sets || [],
      e = t.options || this.getDefaultOptions(),
      n = this.svg.ownerDocument || window.document,
      a = n.createElementNS(Z, "g"),
      i = t.options.fixedDecimalPlaceDigits;
    for (const o of s) {
      let h = null;
      switch (o.type) {
        case "path":
          ((h = n.createElementNS(Z, "path")),
            h.setAttribute("d", this.opsToPath(o, i)),
            h.setAttribute("stroke", e.stroke),
            h.setAttribute("stroke-width", e.strokeWidth + ""),
            h.setAttribute("fill", "none"),
            e.strokeLineDash &&
              h.setAttribute("stroke-dasharray", e.strokeLineDash.join(" ").trim()),
            e.strokeLineDashOffset &&
              h.setAttribute("stroke-dashoffset", `${e.strokeLineDashOffset}`));
          break;
        case "fillPath":
          ((h = n.createElementNS(Z, "path")),
            h.setAttribute("d", this.opsToPath(o, i)),
            h.setAttribute("stroke", "none"),
            h.setAttribute("stroke-width", "0"),
            h.setAttribute("fill", e.fill || ""),
            (t.shape !== "curve" && t.shape !== "polygon") ||
              h.setAttribute("fill-rule", "evenodd"));
          break;
        case "fillSketch":
          h = this.fillSketch(n, o, e);
      }
      h && a.appendChild(h);
    }
    return a;
  }
  fillSketch(t, s, e) {
    let n = e.fillWeight;
    n < 0 && (n = e.strokeWidth / 2);
    const a = t.createElementNS(Z, "path");
    return (
      a.setAttribute("d", this.opsToPath(s, e.fixedDecimalPlaceDigits)),
      a.setAttribute("stroke", e.fill || ""),
      a.setAttribute("stroke-width", n + ""),
      a.setAttribute("fill", "none"),
      e.fillLineDash && a.setAttribute("stroke-dasharray", e.fillLineDash.join(" ").trim()),
      e.fillLineDashOffset && a.setAttribute("stroke-dashoffset", `${e.fillLineDashOffset}`),
      a
    );
  }
  get generator() {
    return this.gen;
  }
  getDefaultOptions() {
    return this.gen.defaultOptions;
  }
  opsToPath(t, s) {
    return this.gen.opsToPath(t, s);
  }
  line(t, s, e, n, a) {
    const i = this.gen.line(t, s, e, n, a);
    return this.draw(i);
  }
  rectangle(t, s, e, n, a) {
    const i = this.gen.rectangle(t, s, e, n, a);
    return this.draw(i);
  }
  ellipse(t, s, e, n, a) {
    const i = this.gen.ellipse(t, s, e, n, a);
    return this.draw(i);
  }
  circle(t, s, e, n) {
    const a = this.gen.circle(t, s, e, n);
    return this.draw(a);
  }
  linearPath(t, s) {
    const e = this.gen.linearPath(t, s);
    return this.draw(e);
  }
  polygon(t, s) {
    const e = this.gen.polygon(t, s);
    return this.draw(e);
  }
  arc(t, s, e, n, a, i, o = !1, h) {
    const c = this.gen.arc(t, s, e, n, a, i, o, h);
    return this.draw(c);
  }
  curve(t, s) {
    const e = this.gen.curve(t, s);
    return this.draw(e);
  }
  path(t, s) {
    const e = this.gen.path(t, s);
    return this.draw(e);
  }
}
var Vt = {
  canvas: (r, t) => new qt(r, t),
  svg: (r, t) => new Qt(r, t),
  generator: (r) => new X(r),
  newSeed: () => X.newSeed(),
};
function te({
  icon: r,
  size: t = 24,
  color: s = v.graphite,
  strokeWidth: e = 1.3,
  roughness: n = 0.5,
  className: a,
  style: i,
}) {
  const o = q.useRef(null),
    h = q.useRef(null),
    c = q.useId();
  return (
    q.useEffect(() => {
      const l = o.current?.querySelector("svg"),
        d = h.current;
      if (!l || !d) return;
      const f = Vt.svg(d);
      d.querySelectorAll("[data-rough]").forEach((u) => u.remove());
      const p = { stroke: s, strokeWidth: e, roughness: n, bowing: 1, seed: c.charCodeAt(0) };
      l.querySelectorAll("path, circle, rect, line, polyline, polygon").forEach((u) => {
        let g = null;
        if (u.tagName === "path") {
          const k = u.getAttribute("d");
          k && (g = f.path(k, p));
        } else if (u.tagName === "circle") {
          const k = Number.parseFloat(u.getAttribute("cx") || "0"),
            M = Number.parseFloat(u.getAttribute("cy") || "0"),
            b = Number.parseFloat(u.getAttribute("r") || "0");
          g = f.circle(k, M, b * 2, p);
        } else if (u.tagName === "rect") {
          const k = Number.parseFloat(u.getAttribute("x") || "0"),
            M = Number.parseFloat(u.getAttribute("y") || "0"),
            b = Number.parseFloat(u.getAttribute("width") || "0"),
            m = Number.parseFloat(u.getAttribute("height") || "0");
          g = f.rectangle(k, M, b, m, p);
        } else if (u.tagName === "line") {
          const k = Number.parseFloat(u.getAttribute("x1") || "0"),
            M = Number.parseFloat(u.getAttribute("y1") || "0"),
            b = Number.parseFloat(u.getAttribute("x2") || "0"),
            m = Number.parseFloat(u.getAttribute("y2") || "0");
          g = f.line(k, M, b, m, p);
        } else if (u.tagName === "polyline") {
          const k = u.getAttribute("points");
          if (k) {
            const M = k
              .trim()
              .split(/\s+/)
              .map((b) => {
                const [m, w] = b.split(",").map(Number);
                return [m, w];
              });
            g = f.linearPath(M, p);
          }
        }
        g && (g.setAttribute("data-rough", "true"), d.append(g));
      });
    }, [r, s, e, n, c]),
    y.jsxs(y.Fragment, {
      children: [
        y.jsx("span", {
          ref: o,
          style: { display: "none" },
          children: y.jsx(r, { size: 24, strokeWidth: 2 }),
        }),
        y.jsx("svg", {
          ref: h,
          viewBox: "0 0 24 24",
          width: t,
          height: t,
          fill: "none",
          className: a,
          style: i,
        }),
      ],
    })
  );
}
function ee({ className: r, ...t }) {
  return y.jsxs("svg", {
    viewBox: "0 0 24 24",
    fill: "none",
    className: r,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    ...t,
    children: [
      y.jsx("path", {
        d: "M3.5 20.5c-.2.1 0 .3.1.2l4.2-1.1c.1 0 .2-.1.3-.1L19.3 8.2c.8-.8.8-2 0-2.8l-1.7-1.7c-.8-.8-2-.8-2.8 0L3.6 15c-.1.1-.1.2-.2.3l-1 4.2c0 .1 0 .2.1.1z",
        stroke: "currentColor",
        strokeWidth: "1.5",
        style: { filter: "url(#sketchy)" },
      }),
      y.jsx("path", { d: "M14.5 4.5l4 4", stroke: "currentColor", strokeWidth: "1.5" }),
      y.jsx("path", {
        d: "M3 21l1.5-5.5",
        stroke: "currentColor",
        strokeWidth: "1",
        opacity: "0.5",
      }),
      y.jsx("defs", {
        children: y.jsxs("filter", {
          id: "sketchy",
          children: [
            y.jsx("feTurbulence", {
              type: "fractalNoise",
              baseFrequency: "0.04",
              numOctaves: "1",
              result: "noise",
            }),
            y.jsx("feDisplacementMap", { in: "SourceGraphic", in2: "noise", scale: "0.5" }),
          ],
        }),
      }),
    ],
  });
}
function se({ className: r, ...t }) {
  return y.jsxs("svg", {
    viewBox: "0 0 24 24",
    fill: "none",
    className: r,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    ...t,
    children: [
      y.jsx("path", {
        d: "M2.5 12c1.5-4 5-7 9.5-7s8 3 9.5 7c-1.5 4-5 7-9.5 7s-8-3-9.5-7z",
        stroke: "currentColor",
        strokeWidth: "1.5",
      }),
      y.jsx("circle", { cx: "12.2", cy: "12", r: "3", stroke: "currentColor", strokeWidth: "1.5" }),
      y.jsx("circle", { cx: "12.2", cy: "12", r: "1.2", fill: "currentColor" }),
      y.jsx("circle", { cx: "13.5", cy: "10.8", r: "0.6", fill: "white", opacity: "0.8" }),
    ],
  });
}
function ne({ className: r, size: t = 80, opacity: s = 0.7 }) {
  return y.jsx("div", {
    className: r,
    style: {
      width: t,
      height: t,
      borderRadius: "50%",
      background: `radial-gradient(ellipse at center,
          transparent 55%,
          ${v.coffeeRing} 60%,
          ${v.coffeeRing} 65%,
          transparent 70%,
          ${v.coffeeRing} 72%,
          transparent 78%
        )`,
      transform: "rotate(-15deg)",
      opacity: s,
    },
  });
}
function re({ color: r, rotation: t = 0, width: s = 60, className: e }) {
  return y.jsx("div", {
    className: e,
    style: {
      width: s,
      height: 18,
      background: r,
      transform: `rotate(${t}deg)`,
      opacity: 0.85,
      boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
      maskImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 100 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0,0 Q2,2 4,0 T8,0 T12,0 T16,0 T20,0 T24,0 T28,0 T32,0 T36,0 T40,0 T44,0 T48,0 T52,0 T56,0 T60,0 T64,0 T68,0 T72,0 T76,0 T80,0 T84,0 T88,0 T92,0 T96,0 T100,0 V20 Q98,18 96,20 T92,20 T88,20 T84,20 T80,20 T76,20 T72,20 T68,20 T64,20 T60,20 T56,20 T52,20 T48,20 T44,20 T40,20 T36,20 T32,20 T28,20 T24,20 T20,20 T16,20 T12,20 T8,20 T4,20 T0,20 Z' fill='white'/%3E%3C/svg%3E")`,
      WebkitMaskImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 100 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0,0 Q2,2 4,0 T8,0 T12,0 T16,0 T20,0 T24,0 T28,0 T32,0 T36,0 T40,0 T44,0 T48,0 T52,0 T56,0 T60,0 T64,0 T68,0 T72,0 T76,0 T80,0 T84,0 T88,0 T92,0 T96,0 T100,0 V20 Q98,18 96,20 T92,20 T88,20 T84,20 T80,20 T76,20 T72,20 T68,20 T64,20 T60,20 T56,20 T52,20 T48,20 T44,20 T40,20 T36,20 T32,20 T28,20 T24,20 T20,20 T16,20 T12,20 T8,20 T4,20 T0,20 Z' fill='white'/%3E%3C/svg%3E")`,
      maskSize: "100% 100%",
      WebkitMaskSize: "100% 100%",
    },
    children: y.jsx("div", {
      className: "w-full h-full",
      style: {
        backgroundImage: `repeating-linear-gradient(
            90deg,
            transparent,
            transparent 4px,
            rgba(255,255,255,0.3) 4px,
            rgba(255,255,255,0.3) 5px
          )`,
      },
    }),
  });
}
function ae({ position: r = "top-right" }) {
  const t = r === "top-right";
  return y.jsxs("div", {
    className: "absolute pointer-events-none",
    style: { [t ? "top" : "bottom"]: 0, right: 0, width: 20, height: 20 },
    children: [
      y.jsx("div", {
        style: {
          position: "absolute",
          [t ? "top" : "bottom"]: 0,
          right: 0,
          width: 0,
          height: 0,
          borderStyle: "solid",
          borderWidth: t ? "20px 20px 0 0" : "0 20px 20px 0",
          borderColor: t
            ? `${v.paperShadow} ${v.cover} transparent transparent`
            : `transparent ${v.cover} ${v.paperShadow} transparent`,
        },
      }),
      y.jsx("div", {
        style: {
          position: "absolute",
          [t ? "top" : "bottom"]: 0,
          right: 0,
          width: 20,
          height: 20,
          background: `linear-gradient(${t ? "135deg" : "45deg"}, transparent 50%, rgba(0,0,0,0.1) 50%)`,
        },
      }),
    ],
  });
}
function oe({ className: r }) {
  return y.jsxs("svg", {
    viewBox: "0 0 30 30",
    className: r,
    style: { opacity: 0.15 },
    children: [
      y.jsx("circle", { cx: "15", cy: "15", r: "3", fill: v.graphite }),
      y.jsx("circle", { cx: "20", cy: "12", r: "1.5", fill: v.graphite }),
      y.jsx("circle", { cx: "10", cy: "18", r: "1", fill: v.graphite }),
      y.jsx("circle", { cx: "22", cy: "17", r: "0.8", fill: v.graphite }),
      y.jsx("circle", { cx: "8", cy: "13", r: "0.6", fill: v.graphite }),
    ],
  });
}
function ie({ width: r = 100, className: t }) {
  return y.jsx("svg", {
    viewBox: "0 0 100 8",
    className: t,
    style: { width: r, height: 8 },
    preserveAspectRatio: "none",
    children: y.jsx("path", {
      d: "M0,4 Q10,2 20,4 T40,4 T60,5 T80,3 T100,4",
      stroke: v.graphite,
      strokeWidth: "2",
      fill: "none",
      strokeLinecap: "round",
      opacity: "0.6",
    }),
  });
}
function Zt() {
  return y.jsxs(y.Fragment, {
    children: [
      y.jsx("div", {
        className: "absolute inset-0 pointer-events-none",
        style: {
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='grain'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23grain)'/%3E%3C/svg%3E")`,
          opacity: 0.06,
          mixBlendMode: "overlay",
        },
      }),
      y.jsx("div", {
        className: "absolute inset-0 pointer-events-none",
        style: {
          background: `linear-gradient(135deg,
            rgba(255,255,255,0.03) 0%,
            transparent 40%,
            transparent 60%,
            rgba(255,255,255,0.02) 100%)`,
        },
      }),
    ],
  });
}
function he({ children: r, isOpen: t = !1 }) {
  return y.jsxs("div", {
    className: "relative",
    children: [
      y.jsx("div", {
        className:
          "absolute -bottom-4 left-4 right-4 h-8 max-xl:-bottom-1 max-xl:h-6 rounded-[6px]",
        style: {
          background: "radial-gradient(ellipse at center, rgba(0,0,0,0.3) 0%, transparent 70%)",
          filter: "blur(8px)",
        },
      }),
      y.jsxs("div", {
        className: "relative",
        style: {
          borderRadius: "6px",
          background: v.cover,
          boxShadow: `
            0 1px 0 ${v.coverHighlight},
            0 -1px 0 ${v.coverEdge},
            0 20px 40px rgba(0,0,0,0.4),
            0 8px 16px rgba(0,0,0,0.3)
          `,
        },
        children: [
          y.jsx(Zt, {}),
          y.jsx("div", { className: "relative z-10 rounded-[6px] overflow-hidden", children: r }),
          y.jsx("div", {
            className: "absolute bottom-0 left-[3px] right-[3px] h-[6px] rounded-b-[4px]",
            style: {
              background: `linear-gradient(to bottom,
              ${v.paperEdge} 0%,
              ${v.paper} 20%,
              ${v.paperEdge} 40%,
              ${v.paper} 60%,
              ${v.paperEdge} 80%,
              ${v.paperShadow} 100%
            )`,
              boxShadow: "inset 0 1px 2px rgba(0,0,0,0.1)",
            },
          }),
        ],
      }),
    ],
  });
}
export {
  ne as C,
  ae as D,
  Xt as F,
  oe as I,
  he as M,
  Zt as O,
  ie as P,
  Yt as R,
  ee as S,
  re as W,
  v as a,
  se as b,
  ft as c,
  Jt as d,
  te as e,
  Kt as r,
};
