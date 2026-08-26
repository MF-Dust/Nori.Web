import { j as a, c as Sn, p as An } from "./index-CyHAbkO5.js";
import { r as h, u as Pn } from "./i18n-DtIC1LRi.js";
import {
  f as at,
  cJ as kn,
  cK as Mn,
  cL as ve,
  w as jn,
  ba as b,
  b8 as Ce,
  cM as Xt,
  cN as Yt,
  p as D,
  bb as W,
  i as F,
  bf as Bn,
  cO as Kt,
  bc as Ae,
  cP as En,
  cQ as ge,
  cR as $e,
  cS as Zt,
  bS as Jt,
  bo as st,
  cT as Nn,
  cU as Tn,
  cV as gt,
  J as In,
  cW as en,
  cX as Rn,
  cY as tn,
  X as Fn,
  cZ as Wn,
  c_ as On,
  c$ as Un,
  d0 as nn,
  d1 as de,
  d2 as ze,
  d3 as an,
  d4 as _n,
  d5 as Ln,
  d6 as Dn,
  d7 as Gn,
  d8 as Hn,
  d9 as $n,
  da as zn,
  db as qn,
  dc as it,
  dd as bt,
  de as Qn,
  aS as sn,
  df as Vn,
  dg as Xn,
  dh as Yn,
  di as rn,
  dj as on,
  dk as Kn,
  dl as Zn,
  dm as Jn,
  Z as ea,
  dn as ta,
  dp as na,
  dq as aa,
  dr as Ue,
  ds as sa,
  dt as ia,
  du as ra,
} from "./NormalApp-Cn6agT0F.js";
import {
  Container as xe,
  Graphics as vt,
  Buffer as _e,
  BufferUsage as fe,
  Geometry as oa,
  Mesh as la,
  Texture as ca,
  UniformGroup as da,
  GlProgram as ua,
  GpuProgram as fa,
  Shader as ha,
  BlurFilter as pa,
  Application as ma,
} from "./index-BsHKXFB1.js";
import { u as se, r as xa, D as ga, M as ba } from "./marginalGrowthStore-aMgk69c4.js";
import { L as yt } from "./lock-eIU2WcCi.js";
import { Z as va } from "./zap-BiEriS6T.js";
const ya = [
    [
      "path",
      {
        d: "m16.24 7.76-1.804 5.411a2 2 0 0 1-1.265 1.265L7.76 16.24l1.804-5.411a2 2 0 0 1 1.265-1.265z",
        key: "9ktpf1",
      },
    ],
    ["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }],
  ],
  ln = at("compass", ya);
const wa = [
    ["circle", { cx: "8", cy: "21", r: "1", key: "jimo8o" }],
    ["circle", { cx: "19", cy: "21", r: "1", key: "13723u" }],
    [
      "path",
      {
        d: "M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12",
        key: "9zh506",
      },
    ],
  ],
  cn = at("shopping-cart", wa);
const Ca = [
    ["rect", { width: "8", height: "8", x: "3", y: "3", rx: "2", key: "by2w9f" }],
    ["path", { d: "M7 11v4a2 2 0 0 0 2 2h4", key: "xkn7yn" }],
    ["rect", { width: "8", height: "8", x: "13", y: "13", rx: "2", key: "1cgmvn" }],
  ],
  Sa = at("workflow", Ca),
  wt = {
    none: {
      canvasBg: 0,
      primary: { deep: "#062c3d", dim: "#0e7490", mid: "#22d3ee", bright: "#67e8f9" },
      shape: "circle",
      growth: null,
      glow: null,
    },
    accelerate: {
      canvasBg: 1311748,
      primary: { deep: "#2e0707", dim: "#991b1b", mid: "#ef4444", bright: "#f87171" },
      shape: "spiky",
      growth: { circle: 10033947, icon: 16281969 },
      glow: null,
    },
    decelerate: {
      canvasBg: 660484,
      primary: { deep: "#1a2e05", dim: "#4d7c0f", mid: "#84cc16", bright: "#a3e635" },
      shape: "chubby",
      growth: { circle: 5078031, icon: 10741301 },
      glow: null,
    },
    equilibrium: {
      canvasBg: 267805,
      primary: { deep: "#083344", dim: "#0891b2", mid: "#22d3ee", bright: "#a5f3fc" },
      shape: "nori",
      growth: { circle: 947344, icon: 10875900 },
      glow: {
        filter:
          "drop-shadow(0 0 2px rgba(165,243,252,0.7)) drop-shadow(0 0 8px rgba(34,211,238,0.45))",
        color: "rgba(103,232,249,0.6)",
      },
    },
  };
function Z(n) {
  return wt[n ?? "none"] ?? wt.none;
}
const Aa = "#94a3b8";
function qe(n) {
  return n.alignment === "universal" ? Aa : Z(n.alignment).primary.bright;
}
function Pa({ alignment: n }) {
  const e = h.useMemo(() => {
    const t = Z(n),
      s = t.primary;
    return `.pixel-idle{--px-cyan:${s.bright};--px-cyan-mid:${s.mid};--px-cyan-dim:${s.dim};--px-cyan-deep:${s.deep};--px-ui-glow:${t.glow ? t.glow.filter : "none"};}`;
  }, [n]);
  return a.jsx("style", { children: e });
}
const Pe = 70,
  ka = 26,
  Ma = 42,
  ja = [
    [-1, -1],
    [0, -1],
    [1, -1],
    [-1, 0],
    [0, 0],
    [1, 0],
    [-1, 1],
    [0, 1],
    [1, 1],
  ],
  Ba = 2282478,
  Le = 1461859,
  oe = 6809849,
  Ct = 10875900;
function Ea(n) {
  return () => {
    let e = (n += 1831565813);
    return (
      (e = Math.imul(e ^ (e >>> 15), e | 1)),
      (e ^= e + Math.imul(e ^ (e >>> 7), e | 61)),
      ((e ^ (e >>> 14)) >>> 0) / 4294967296
    );
  };
}
function Na(n) {
  const e = Ea(Ma),
    t = new Set(ja.map(([o, r]) => `${o},${r}`)),
    s = [
      { x: 2, y: 0, parent: { x: 1, y: 0 } },
      { x: -2, y: 0, parent: { x: -1, y: 0 } },
      { x: 0, y: 2, parent: { x: 0, y: 1 } },
      { x: 0, y: -2, parent: { x: 0, y: -1 } },
    ],
    i = [];
  for (; i.length < n && s.length > 0;) {
    const o = s.splice(Math.floor(e() * s.length), 1)[0],
      r = `${o.x},${o.y}`;
    if (!t.has(r)) {
      (t.add(r),
        i.push({
          x: o.x,
          y: o.y,
          parent: o.parent,
          type: Math.floor(e() * 3),
          rotation: Math.floor(e() * 4),
        }));
      for (const [l, c] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ]) {
        const d = o.x + l,
          p = o.y + c;
        t.has(`${d},${p}`) || s.push({ x: d, y: p, parent: { x: o.x, y: o.y } });
      }
    }
  }
  return i;
}
class Ta extends xe {
  allNodes;
  tracesLayer = new xe();
  nodesLayer = new xe();
  constructor(e = 1500) {
    (super(),
      (this.allNodes = Na(e)),
      this.addChild(this.tracesLayer),
      this.addChild(this.nodesLayer));
  }
  setCount(e) {
    ((e = Math.max(0, Math.min(e, this.allNodes.length))),
      this.tracesLayer.removeChildren().forEach((t) => t.destroy()),
      this.nodesLayer.removeChildren().forEach((t) => t.destroy()));
    for (let t = 0; t < e; t++) this.spawnNode(this.allNodes[t]);
  }
  spawnNode(e) {
    const t = e.x * Pe,
      s = e.y * Pe,
      i = e.parent.x * Pe,
      o = e.parent.y * Pe,
      r = new vt();
    (r.moveTo(i, o),
      Math.abs(t - i) > Math.abs(s - o) ? r.lineTo(t, o).lineTo(t, s) : r.lineTo(i, s).lineTo(t, s),
      r.stroke({ color: Ba, width: 1.5, alpha: 0.45 }),
      this.tracesLayer.addChild(r));
    const l = new vt();
    ((l.rotation = (e.rotation * Math.PI) / 2),
      Ia(l, e.type),
      (l.x = t),
      (l.y = s),
      this.nodesLayer.addChild(l));
  }
}
function Ia(n, e) {
  const t = ka;
  if (e === 0) {
    (n.roundRect(-t / 2, -t / 2, t, t, 4),
      n.fill({ color: Le, alpha: 0.75 }),
      n.stroke({ color: oe, width: 1.2, alpha: 0.85 }));
    for (const s of [-t * 0.3, 0, t * 0.3])
      (n.rect(s - 1, -t / 2 - 4, 2, 4).fill({ color: oe, alpha: 0.7 }),
        n.rect(s - 1, t / 2, 2, 4).fill({ color: oe, alpha: 0.7 }));
    n.circle(0, 0, 2).fill({ color: Ct, alpha: 0.9 });
  } else if (e === 1) {
    const s = t * 0.55;
    (n.poly([0, -s, s, 0, 0, s, -s, 0]),
      n.fill({ color: Le, alpha: 0.7 }),
      n.stroke({ color: oe, width: 1.2, alpha: 0.9 }),
      n.circle(0, 0, 2.5).fill({ color: Ct, alpha: 0.9 }));
  } else {
    const s = t * 0.7,
      i = t * 0.4;
    (n.ellipse(0, 0, s / 2, i / 2),
      n.fill({ color: Le, alpha: 0.6 }),
      n.stroke({ color: oe, width: 1.2, alpha: 0.85 }),
      n
        .moveTo(-s / 2 + 3, -i / 2 - 4)
        .lineTo(-s / 2 + 3, i / 2 + 4)
        .stroke({ color: oe, width: 1, alpha: 0.6 }),
      n
        .moveTo(s / 2 - 3, -i / 2 - 4)
        .lineTo(s / 2 - 3, i / 2 + 4)
        .stroke({ color: oe, width: 1, alpha: 0.6 }));
  }
}
const Ra = 0.15,
  Fa = 3,
  St = 1.12,
  Wa = 3;
class Oa {
  app;
  world;
  onTransform;
  onTap;
  dragging = !1;
  dragMoved = !1;
  lastX = 0;
  lastY = 0;
  clamp = { minScale: Ra, maxScale: Fa, panWorld: Number.POSITIVE_INFINITY };
  constructor(e, t, s, i) {
    ((this.app = e), (this.world = t), (this.onTransform = s), (this.onTap = i), this.recenter());
    const o = e.stage;
    ((o.eventMode = "static"),
      (o.hitArea = e.screen),
      o.on("pointerdown", this.onPointerDown),
      o.on("globalpointermove", this.onPointerMove),
      o.on("wheel", this.onWheel),
      window.addEventListener("pointerup", this.onPointerUp),
      window.addEventListener("pointercancel", this.onPointerCancel));
  }
  destroy() {
    const e = this.app.stage;
    (e.off("pointerdown", this.onPointerDown),
      e.off("globalpointermove", this.onPointerMove),
      e.off("wheel", this.onWheel),
      window.removeEventListener("pointerup", this.onPointerUp),
      window.removeEventListener("pointercancel", this.onPointerCancel));
  }
  recenter() {
    (this.world.position.set(this.app.screen.width / 2, this.app.screen.height / 2),
      this.world.scale.set(this.clampScale(1)),
      this.clampPosition(),
      this.emitTransform());
  }
  onResize() {
    (this.world.position.set(this.app.screen.width / 2, this.app.screen.height / 2),
      this.clampPosition(),
      this.emitTransform());
  }
  setClamp(e) {
    ((this.clamp = e),
      this.world.scale.set(this.clampScale(this.world.scale.x)),
      this.clampPosition(),
      this.emitTransform());
  }
  clampScale(e) {
    return Math.max(this.clamp.minScale, Math.min(this.clamp.maxScale, e));
  }
  clampPosition() {
    const e = this.clamp.panWorld * this.world.scale.x;
    if (!Number.isFinite(e)) return;
    const t = this.app.screen.width / 2,
      s = this.app.screen.height / 2;
    ((this.world.position.x = Math.max(t - e, Math.min(t + e, this.world.position.x))),
      (this.world.position.y = Math.max(s - e, Math.min(s + e, this.world.position.y))));
  }
  zoomAtClient(e, t, s) {
    const i = this.app.canvas.getBoundingClientRect();
    this.zoomAt(e - i.left, t - i.top, s);
  }
  panBy(e, t) {
    ((this.world.position.x += e),
      (this.world.position.y += t),
      this.clampPosition(),
      this.emitTransform());
  }
  onPointerDown = (e) => {
    ((this.dragging = !0),
      (this.dragMoved = !1),
      (this.lastX = e.globalX),
      (this.lastY = e.globalY));
  };
  onPointerMove = (e) => {
    if (!this.dragging) return;
    const t = e.globalX - this.lastX,
      s = e.globalY - this.lastY;
    if (!this.dragMoved) {
      if (Math.abs(t) + Math.abs(s) < Wa) return;
      this.dragMoved = !0;
    }
    ((this.world.position.x += t),
      (this.world.position.y += s),
      this.clampPosition(),
      (this.lastX = e.globalX),
      (this.lastY = e.globalY),
      this.emitTransform());
  };
  onPointerUp = () => {
    (this.dragging && !this.dragMoved && this.onTap?.(),
      (this.dragging = !1),
      (this.dragMoved = !1));
  };
  onPointerCancel = () => {
    ((this.dragging = !1), (this.dragMoved = !1));
  };
  onWheel = (e) => {
    e.preventDefault?.();
    const t = this.app.canvas.getBoundingClientRect(),
      s = (e.clientX ?? 0) - t.left,
      i = (e.clientY ?? 0) - t.top;
    this.zoomAt(s, i, e.deltaY);
  };
  zoomAt(e, t, s) {
    const i = s < 0 ? St : 1 / St,
      o = this.clampScale(this.world.scale.x * i),
      r = (e - this.world.position.x) / this.world.scale.x,
      l = (t - this.world.position.y) / this.world.scale.y;
    (this.world.scale.set(o),
      (this.world.position.x = e - r * o),
      (this.world.position.y = t - l * o),
      this.clampPosition(),
      this.emitTransform());
  }
  emitTransform() {
    this.onTransform?.({
      x: this.world.position.x,
      y: this.world.position.y,
      scale: this.world.scale.x,
    });
  }
}
const Ua = 826427213,
  _a = 0.03,
  At = 10;
function le(n) {
  return (n + 3) & -4;
}
function La(n) {
  const e = new DataView(n);
  if (e.getUint32(0, !0) !== Ua) throw new Error("not a marginal-growth cache binary (bad magic)");
  const t = e.getUint32(4, !0),
    s = e.getUint32(8, !0),
    i = e.getUint32(12, !0),
    o = e.getUint32(16, !0),
    r = e.getUint32(20, !0),
    l = e.getUint32(24, !0),
    c = new TextDecoder().decode(new Uint8Array(n, 28, l));
  let d = 28 + le(l);
  const [p, x] = c.split(":").map(Number),
    v = p / 2,
    u = x / 2,
    f = new Array(i),
    y = d,
    g = y + i * 4,
    w = g + i * 4,
    m = le(w + i),
    B = le(m + i * 2),
    j = B + i * 4;
  let E = 0,
    T = 0;
  for (let R = 0; R < i; R++) {
    ((E += e.getUint32(y + R * 4, !0)), (T += e.getUint16(m + R * 2, !0)));
    const k = e.getInt32(B + R * 4, !0) / At,
      A = e.getInt32(j + R * 4, !0) / At;
    f[R] = {
      id: E,
      parentId: E - e.getUint32(g + R * 4, !0),
      layer: e.getUint8(w + R) === 0 ? "circle" : "icon",
      birthStep: T,
      x: k,
      y: A,
      parentX: v,
      parentY: u,
      radius: Math.hypot(k - v, A - u),
      childCount: 0,
    };
  }
  d = j + i * 4;
  const S = new Map();
  for (const R of f) S.set(R.id, R);
  for (const R of f) {
    const k = S.get(R.parentId);
    k && ((R.parentX = k.x), (R.parentY = k.y), k.childCount++);
  }
  const _ = d,
    M = le(_ + i * 2),
    L = {};
  let P = M;
  for (let R = 0; R < i; R++) {
    const k = e.getUint16(_ + R * 2, !0);
    if (k === 0) continue;
    const A = [];
    let I = 0,
      G = 0;
    for (let z = 0; z < k; z++) {
      ((I += e.getInt16(P, !0)), (G += e.getInt16(P + 2, !0)));
      const ne = e.getInt16(P + 4, !0);
      P += 6;
      for (let ae = 0; ae < ne; ae++) A.push({ step: I + ae, thickness: (G + ae) * _a });
      ((I += ne - 1), (G += ne - 1));
    }
    L[f[R].id] = A;
  }
  d = le(M + o * 6);
  const H = d,
    Q = le(H + (t + 1) * 2),
    V = new Array(t + 1);
  let X = Q;
  for (let R = 0; R <= t; R++) {
    const k = e.getUint16(H + R * 2, !0),
      A = new Array(k);
    for (let I = 0; I < k; I++) ((A[I] = e.getUint16(X, !0)), (X += 2));
    V[R] = A;
  }
  if (((d = le(Q + r * 2)), d !== n.byteLength))
    throw new Error(`decode size mismatch: read ${d}, buffer is ${n.byteLength}`);
  return {
    signature: c,
    maxSteps: t,
    chunkSize: s,
    nodes: f,
    styleKeyframesByNode: L,
    dirtyChunksByStep: V,
    pathFrames: [],
  };
}
function Da(n) {
  return `/marginal-growth-cache-${n}.bin`;
}
async function Ga(n) {
  const e = await fetch(Da(n));
  if (!e.ok || e.body == null) throw new Error(`${e.status} ${e.statusText}`);
  const t = e.body.pipeThrough(new DecompressionStream("gzip")),
    s = await new Response(t).arrayBuffer();
  return La(s);
}
class Ha {
  nodeCount;
  idToIndex;
  id;
  parentIdx;
  mainChildIdx;
  chainDist;
  branchId;
  branchLen;
  birthStep;
  layerFlag;
  x;
  y;
  parentX;
  parentY;
  radius;
  childCount;
  maxThickness;
  mainChildIdxByRootParentId;
  constructor(e) {
    const t = e.nodes.length;
    ((this.nodeCount = t),
      (this.id = new Uint32Array(t)),
      (this.parentIdx = new Int32Array(t)),
      (this.mainChildIdx = new Int32Array(t).fill(-1)),
      (this.chainDist = new Float32Array(t)),
      (this.branchId = new Uint32Array(t)),
      (this.branchLen = new Float32Array(t)),
      (this.birthStep = new Float32Array(t)),
      (this.layerFlag = new Uint8Array(t)),
      (this.x = new Float32Array(t)),
      (this.y = new Float32Array(t)),
      (this.parentX = new Float32Array(t)),
      (this.parentY = new Float32Array(t)),
      (this.radius = new Float32Array(t)),
      (this.childCount = new Uint16Array(t)),
      (this.maxThickness = new Float32Array(t)));
    const s = new Map();
    for (let u = 0; u < t; u++) {
      const f = e.nodes[u];
      (s.set(f.id, u),
        (this.id[u] = f.id),
        (this.birthStep[u] = f.birthStep),
        (this.layerFlag[u] = f.layer === "circle" ? 0 : 1),
        (this.x[u] = f.x),
        (this.y[u] = f.y),
        (this.parentX[u] = f.parentX),
        (this.parentY[u] = f.parentY),
        (this.radius[u] = f.radius),
        (this.childCount[u] = f.childCount));
    }
    this.idToIndex = s;
    for (let u = 0; u < t; u++) {
      const f = e.nodes[u].parentId;
      this.parentIdx[u] = f != null ? (s.get(f) ?? -1) : -1;
    }
    const i = new Float32Array(t),
      o = new Uint8Array(t),
      r = new Map();
    for (let u = 0; u < t; u++) {
      const f = e.nodes[u].parentId;
      if (f == null) continue;
      const y = this.parentIdx[u];
      if (y >= 0) {
        const g = this.scoreInCache(u, y);
        (!o[y] || g > i[y]) && ((o[y] = 1), (i[y] = g), (this.mainChildIdx[y] = u));
      } else {
        const g = -this.id[u],
          w = r.get(f);
        (!w || g > w.score) && r.set(f, { childIdx: u, score: g });
      }
    }
    const l = new Map();
    for (const [u, { childIdx: f }] of r) l.set(u, f);
    this.mainChildIdxByRootParentId = l;
    for (let u = 0; u < t; u++) {
      const f = this.parentIdx[u],
        y = Math.hypot(this.x[u] - this.parentX[u], this.y[u] - this.parentY[u]),
        g = f >= 0 ? this.chainDist[f] : 0;
      this.chainDist[u] = g + y;
    }
    let c = 0;
    for (let u = 0; u < t; u++) {
      const f = this.parentIdx[u];
      f >= 0 && this.mainChildIdx[f] === u
        ? (this.branchId[u] = this.branchId[f])
        : (this.branchId[u] = c++);
    }
    const d = new Float32Array(c),
      p = new Float32Array(c),
      x = new Uint8Array(c);
    for (let u = 0; u < t; u++) {
      const f = this.branchId[u],
        y = this.chainDist[u];
      x[f]
        ? (y < d[f] && (d[f] = y), y > p[f] && (p[f] = y))
        : ((x[f] = 1), (d[f] = y), (p[f] = y));
    }
    for (let u = 0; u < t; u++) {
      const f = this.branchId[u];
      this.branchLen[u] = p[f] - d[f];
    }
    const v = e.styleKeyframesByNode;
    for (let u = 0; u < t; u++) {
      const f = v[this.id[u]];
      if (!f) continue;
      let y = 0;
      for (const g of f) g.thickness > y && (y = g.thickness);
      this.maxThickness[u] = y;
    }
  }
  isMainChildOfParent(e, t) {
    if (t == null) return !1;
    const s = this.idToIndex.get(t);
    return s !== void 0 ? this.mainChildIdx[s] === e : this.mainChildIdxByRootParentId.get(t) === e;
  }
  scoreInCache(e, t) {
    const s = this.x[t] - this.parentX[t],
      i = this.y[t] - this.parentY[t],
      o = Math.hypot(s, i),
      r = this.x[e] - this.x[t],
      l = this.y[e] - this.y[t],
      c = Math.hypot(r, l);
    return o < 1e-9 || c < 1e-9 ? -this.id[e] : (s * r + i * l) / (o * c);
  }
}
const $a = 1.84,
  za = 0.15,
  qa = 2,
  Pt = 1.2,
  Qa = 0.5,
  Va = 4;
class Xa {
  constructor(e, t, s, i, o, r) {
    ((this.topology = e),
      (this.cache = t),
      (this.lineWidthCeiling = s),
      (this.swayAmplitudeCeiling = i),
      (this.warpAmplitudeCeiling = o),
      (this.aaPadBase = r));
  }
  scratch = {
    ax: 0,
    ay: 0,
    bx: 0,
    by: 0,
    chainDistA: 0,
    chainDistB: 0,
    branchIdA: 0,
    branchIdB: 0,
    branchLenA: 0,
    branchLenB: 0,
    nodeIdxA: -1,
    nodeIdxB: -1,
    birthStep: 0,
    layerFlag: 0,
    isMainChainAtParent: 0,
    maxWidthA: 0,
    maxWidthB: 0,
  };
  totalSegmentCount() {
    return this.topology.nodeCount;
  }
  forEach(e) {
    const t = this.topology,
      s = this.scratch,
      i = $a * this.swayAmplitudeCeiling,
      o = Qa * this.warpAmplitudeCeiling;
    for (let r = 0; r < t.nodeCount; r++) {
      const l = t.parentIdx[r],
        c = l >= 0;
      if (
        ((s.ax = t.parentX[r]),
        (s.ay = t.parentY[r]),
        (s.bx = t.x[r]),
        (s.by = t.y[r]),
        (s.chainDistA = c ? t.chainDist[l] : 0),
        (s.chainDistB = t.chainDist[r]),
        (s.branchIdA = c ? t.branchId[l] : t.branchId[r]),
        (s.branchIdB = t.branchId[r]),
        (s.branchLenA = c ? t.branchLen[l] : t.branchLen[r]),
        (s.branchLenB = t.branchLen[r]),
        (s.nodeIdxA = l),
        (s.nodeIdxB = r),
        (s.birthStep = t.birthStep[r]),
        (s.layerFlag = t.layerFlag[r]),
        c)
      )
        s.isMainChainAtParent = t.mainChildIdx[l] === r ? 1 : 0;
      else {
        const w = this.cache.nodes[r].parentId;
        s.isMainChainAtParent = w != null && t.mainChildIdxByRootParentId.get(w) === r ? 1 : 0;
      }
      const d = c ? t.maxThickness[l] : t.maxThickness[r],
        p = t.maxThickness[r],
        x = s.branchIdA === s.branchIdB ? za : qa,
        v = Math.max(1, Math.hypot(s.bx - s.ax, s.by - s.ay)),
        u = x * i,
        f = Math.min(Va, Math.sqrt(1 + (u / v) ** 2)),
        y = ((this.lineWidthCeiling + d) / 2) * Pt,
        g = ((this.lineWidthCeiling + p) / 2) * Pt;
      ((s.maxWidthA = (y + this.aaPadBase) * f + o),
        (s.maxWidthB = (g + this.aaPadBase) * f + o),
        e(s));
    }
  }
}
const Ya = 2,
  Qe = 2,
  Ve = 4,
  Xe = 5,
  ke = 4,
  kt = 6,
  Ye = 15,
  he = Ye * 4,
  Ke = 2,
  Ka = Ke * 4;
class Za extends xe {
  constructor(e) {
    (super(), (this.shader = e));
  }
  cache = null;
  topology = null;
  mesh = null;
  geometry = null;
  staticBuffer = null;
  dynamicBuffer = null;
  indexBuffer = null;
  dynamicVertexData = null;
  segmentCount = 0;
  segmentNodeIdxA = null;
  segmentNodeIdxB = null;
  nodeThickness = null;
  lastStep = -1;
  bakeBounds = { lineWidthCeiling: Qe, swayAmplitudeCeiling: Ve, warpAmplitudeCeiling: Xe };
  getTopology() {
    return this.topology;
  }
  setCache(e, t) {
    (t && (this.bakeBounds = t),
      (this.cache = e),
      (this.topology = new Ha(e)),
      this.bake(),
      (this.lastStep = -1));
  }
  isWithinBakeBounds(e, t, s) {
    return (
      e <= this.bakeBounds.lineWidthCeiling &&
      t <= this.bakeBounds.swayAmplitudeCeiling &&
      s <= this.bakeBounds.warpAmplitudeCeiling
    );
  }
  updateStep(e, t = !1) {
    if (
      (!t && e === this.lastStep) ||
      !this.cache ||
      !this.topology ||
      !this.dynamicVertexData ||
      !this.dynamicBuffer
    )
      return;
    const s = this.topology,
      i = this.cache,
      o = this.dynamicVertexData,
      r = this.segmentNodeIdxA,
      l = this.segmentNodeIdxB,
      c = this.segmentCount,
      d = this.nodeThickness,
      p = i.styleKeyframesByNode,
      x = s.nodeCount;
    for (let v = 0; v < x; v++) {
      const u = p[s.id[v]];
      d[v] = u ? Ja(u, e) : 0;
    }
    for (let v = 0; v < c; v++) {
      const u = r[v],
        f = l[v],
        y = u >= 0 ? d[u] : 0,
        g = f >= 0 ? d[f] : 0,
        w = v * ke * Ke;
      ((o[w + 0] = y),
        (o[w + 1] = g),
        (o[w + 2] = y),
        (o[w + 3] = g),
        (o[w + 4] = y),
        (o[w + 5] = g),
        (o[w + 6] = y),
        (o[w + 7] = g));
    }
    (this.dynamicBuffer.update(this.dynamicVertexData.byteLength), (this.lastStep = e));
  }
  debugStats(e) {
    let t = 0,
      s = 0,
      i = 0,
      o = 0;
    if (!this.topology)
      return { totalSegments: 0, mainSegments: 0, sideSegments: 0, visibleNodeCount: 0 };
    const r = this.topology;
    for (let l = 0; l < r.nodeCount; l++) {
      if (r.birthStep[l] > e || (o++, r.parentIdx[l] < 0)) continue;
      (t++, r.mainChildIdx[r.parentIdx[l]] === l ? s++ : i++);
    }
    return { totalSegments: t, mainSegments: s, sideSegments: i, visibleNodeCount: o };
  }
  destroy(e) {
    (this.mesh && (this.mesh.destroy(), (this.mesh = null)),
      this.geometry?.destroy(!0),
      (this.geometry = null),
      (this.staticBuffer = null),
      (this.dynamicBuffer = null),
      (this.indexBuffer = null),
      super.destroy(e));
  }
  bake() {
    if (!this.cache || !this.topology) return;
    (this.mesh && (this.mesh.destroy(), (this.mesh = null)), this.geometry?.destroy(!0));
    const e = new Xa(
        this.topology,
        this.cache,
        this.bakeBounds.lineWidthCeiling,
        this.bakeBounds.swayAmplitudeCeiling,
        this.bakeBounds.warpAmplitudeCeiling,
        Ya,
      ),
      t = e.totalSegmentCount();
    this.segmentCount = t;
    const s = t * kt,
      i = new Float32Array(t * ke * Ye);
    this.dynamicVertexData = new Float32Array(t * ke * Ke);
    const o = new Uint32Array(s);
    ((this.segmentNodeIdxA = new Int32Array(t)),
      (this.segmentNodeIdxB = new Int32Array(t)),
      (this.nodeThickness = new Float32Array(this.topology.nodeCount)));
    let r = 0;
    (e.forEach((l) => {
      (this.writeStaticSegment(i, o, r, l),
        (this.segmentNodeIdxA[r] = l.nodeIdxA),
        (this.segmentNodeIdxB[r] = l.nodeIdxB),
        r++);
    }),
      (this.staticBuffer = new _e({
        data: i,
        usage: fe.VERTEX | fe.COPY_DST,
        label: "ribbon-static",
      })),
      (this.dynamicBuffer = new _e({
        data: this.dynamicVertexData,
        usage: fe.VERTEX | fe.COPY_DST,
        label: "ribbon-dynamic",
      })),
      (this.indexBuffer = new _e({
        data: o,
        usage: fe.INDEX | fe.COPY_DST,
        label: "ribbon-indices",
      })),
      (this.geometry = new oa({
        attributes: {
          aPosition: { buffer: this.staticBuffer, format: "float32x2", stride: he, offset: 0 },
          aSegAB: { buffer: this.staticBuffer, format: "float32x4", stride: he, offset: 8 },
          aChainDist: { buffer: this.staticBuffer, format: "float32x2", stride: he, offset: 24 },
          aMeta: { buffer: this.staticBuffer, format: "float32x3", stride: he, offset: 32 },
          aBranchAB: { buffer: this.staticBuffer, format: "float32x2", stride: he, offset: 44 },
          aBranchLen: { buffer: this.staticBuffer, format: "float32x2", stride: he, offset: 52 },
          aThicknessAB: { buffer: this.dynamicBuffer, format: "float32x2", stride: Ka, offset: 0 },
        },
        indexBuffer: this.indexBuffer,
        topology: "triangle-list",
      })),
      (this.mesh = new la({ geometry: this.geometry, shader: this.shader, texture: ca.WHITE })),
      (this.mesh.blendMode = "max"),
      this.addChild(this.mesh));
  }
  writeStaticSegment(e, t, s, i) {
    let o = i.bx - i.ax,
      r = i.by - i.ay;
    const l = Math.hypot(o, r);
    l < 1e-9 ? ((o = 1), (r = 0)) : ((o /= l), (r /= l));
    const c = Math.max(i.maxWidthA, i.maxWidthB),
      d = -r * c,
      p = o * c,
      x = o * c,
      v = r * c,
      u = i.ax + d - x,
      f = i.ay + p - v,
      y = i.ax - d - x,
      g = i.ay - p - v,
      w = i.bx - d + x,
      m = i.by - p + v,
      B = i.bx + d + x,
      j = i.by + p + v,
      E = s * ke,
      T = (_, M, L) => {
        const P = (E + _) * Ye;
        ((e[P + 0] = M),
          (e[P + 1] = L),
          (e[P + 2] = i.ax),
          (e[P + 3] = i.ay),
          (e[P + 4] = i.bx),
          (e[P + 5] = i.by),
          (e[P + 6] = i.chainDistA),
          (e[P + 7] = i.chainDistB),
          (e[P + 8] = i.birthStep),
          (e[P + 9] = i.layerFlag),
          (e[P + 10] = i.isMainChainAtParent),
          (e[P + 11] = i.branchIdA),
          (e[P + 12] = i.branchIdB),
          (e[P + 13] = i.branchLenA),
          (e[P + 14] = i.branchLenB));
      };
    (T(0, u, f), T(1, y, g), T(2, w, m), T(3, B, j));
    const S = s * kt;
    ((t[S + 0] = E),
      (t[S + 1] = E + 1),
      (t[S + 2] = E + 2),
      (t[S + 3] = E),
      (t[S + 4] = E + 2),
      (t[S + 5] = E + 3));
  }
}
function Ja(n, e) {
  let t = 0,
    s = n.length - 1,
    i = 0;
  for (; t <= s;) {
    const o = (t + s) >>> 1,
      r = n[o];
    r.step <= e ? ((i = r.thickness), (t = o + 1)) : (s = o - 1);
  }
  return i;
}
const K = 32;
function ce(n, e) {
  ((n[0] = ((e >> 16) & 255) / 255), (n[1] = ((e >> 8) & 255) / 255), (n[2] = (e & 255) / 255));
}
const es = `#version 300 es
in vec2 aPosition;
in vec4 aSegAB;
in vec2 aChainDist;
in vec3 aMeta;          // birthStep, layer (0=circle, 1=icon), isMain (0/1)
in vec2 aBranchAB;
in vec2 aBranchLen;
in vec2 aThicknessAB;   // dynamic: per-endpoint current thickness

uniform mat3 uProjectionMatrix;
uniform mat3 uWorldTransformMatrix;
uniform mat3 uTransformMatrix;

uniform float uTimeMs;
uniform float uCurrentStep;
uniform float uLineWidth;
uniform float uIconOpacity;
uniform float uCircleOpacity;
uniform float uDebugMainOnly;
uniform float uDebugSideOnly;

uniform float uSwayEnabled;
uniform float uSwayAmplitude;
uniform float uSwayFrequency;
uniform float uSwayChainMax;
uniform float uSwayMinBranchLen;
uniform float uSwayIconScale;
uniform float uSwayCircleScale;

// Phase 7 — singularity warp (vertex displacement on top of sway). Other
// tier-8-11 fx (lattice, orbital, starfield) live in the fragment shader.
uniform vec2  uWorldCenter;
uniform float uWarpAmplitude;

// Per-vertex-hoisted fx (see vFx below).
uniform float uBreathEnabled;
uniform float uBreathFrequency;
uniform float uBreathAmplitude;
uniform float uTipGlowEnabled;
uniform float uTipGlowDecay;
uniform float uTipGlowBoost;

out vec2 vWorldPos;
out vec4 vSegAB;
out vec2 vHW;
out vec2 vAlpha;
out vec2 vChainDist;
out vec2 vMeta;
// Fragment-cost hoists — the mesh rasterizes far more fragments than it has
// vertices, so per-quad-constant or long-wavelength terms are evaluated here:
//   vFx.x — tip-glow brightness boost. exp() of (uCurrentStep − birthStep),
//           flat across the quad, so the hoist is exact.
//   vFx.y — breath width multiplier. Radial wavelength ≈ 1256 wu vs ~5 wu
//           segments, so linear interpolation across a quad is exact to
//           well under a percent of the swing.
out vec2 vFx;

float branchPhase(float id) {
  return fract(sin(id * 12.9898) * 43758.5453) * 6.28318;
}

vec2 swayField(vec2 p, float tSec, float phase) {
  float t = tSec * uSwayFrequency;
  vec2 base = vec2(
    sin(t * 6.28318 * 1.0 + p.x * 0.0008 + p.y * 0.0003 + phase),
    cos(t * 6.28318 * 0.9 + p.x * 0.0004 + p.y * 0.001  + phase * 1.3)
  );
  vec2 detail = vec2(
    sin(t * 6.28318 * 2.7 + p.x * 0.003  + p.y * 0.002 + phase * 1.7),
    cos(t * 6.28318 * 2.5 + p.x * 0.002  + p.y * 0.003 + phase * 2.1)
  );
  return base + detail * 0.3;
}

void cullToDegenerate() {
  gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
  vWorldPos = vec2(0.0);
  vSegAB = vec4(0.0);
  vHW = vec2(0.0);
  vAlpha = vec2(0.0);
  vChainDist = vec2(0.0);
  vMeta = vec2(0.0);
  vFx = vec2(0.0, 1.0);
}

void main() {
  float birthStep = aMeta.x;
  float layer = aMeta.y;
  float isMain = aMeta.z;

  // Birth-step cull — collapse pre-born quads to a single clip-space point.
  if (birthStep > uCurrentStep + 0.5) { cullToDegenerate(); return; }
  // Debug filter cull (uniform-driven; no CPU rebuild on filter change).
  if (uDebugMainOnly > 0.5 && isMain < 0.5) { cullToDegenerate(); return; }
  if (uDebugSideOnly > 0.5 && isMain > 0.5) { cullToDegenerate(); return; }

  // Per-endpoint hw / alpha from thickness + uniforms. Parent and child
  // always share a layer (the cache build emits separate per-layer sub-
  // networks), so a single layer flag covers both endpoints.
  float layerOp = mix(uCircleOpacity, uIconOpacity, layer);
  float thA = aThicknessAB.x;
  float thB = aThicknessAB.y;
  vec2 hw = vec2(uLineWidth + thA, uLineWidth + thB) * 0.5;
  vec2 alpha = vec2(
    layerOp * (thA * (1.0 / 3.0) + 0.2),
    layerOp * (thB * (1.0 / 3.0) + 0.2)
  );

  vec2 worldPos = aPosition;
  vec4 segAB = aSegAB;

  if (uSwayEnabled > 0.5) {
    float tSec = uTimeMs * 0.001;
    float chainMax = max(uSwayChainMax, 1.0);
    float fallA = clamp(aChainDist.x / chainMax, 0.0, 1.0);
    float fallB = clamp(aChainDist.y / chainMax, 0.0, 1.0);
    float phaseA = branchPhase(aBranchAB.x);
    float phaseB = branchPhase(aBranchAB.y);
    float minLen = max(uSwayMinBranchLen, 1.0);
    float lenScaleA = clamp(aBranchLen.x / minLen, 0.0, 1.0);
    float lenScaleB = clamp(aBranchLen.y / minLen, 0.0, 1.0);
    float layerScale = mix(uSwayCircleScale, uSwayIconScale, layer);
    vec2 dispA = swayField(aSegAB.xy, tSec, phaseA) * uSwayAmplitude * fallA * lenScaleA * layerScale;
    vec2 dispB = swayField(aSegAB.zw, tSec, phaseB) * uSwayAmplitude * fallB * lenScaleB * layerScale;

    vec2 ba = aSegAB.zw - aSegAB.xy;
    float h = clamp(dot(aPosition - aSegAB.xy, ba) / max(dot(ba, ba), 1e-6), 0.0, 1.0);
    vec2 dispVert = mix(dispA, dispB, h);

    worldPos = aPosition + dispVert;
    segAB = vec4(aSegAB.xy + dispA, aSegAB.zw + dispB);
  }

  // Singularity warp — spiral pull toward world center, scaled by inverse
  // distance so the warp falls off at the rim. Visual hint of gravity, no
  // physics. Off when uWarpAmplitude == 0 (tier 10 stage 0 or below).
  if (uWarpAmplitude > 0.0) {
    vec2 toCenter = uWorldCenter - worldPos;
    float dist = length(toCenter);
    if (dist > 1.0) {
      vec2 tangent = vec2(-toCenter.y, toCenter.x) / dist;
      float fall = 1.0 / (1.0 + dist * 0.0008);
      float t = uTimeMs * 0.0001;
      vec2 spiral = (toCenter / dist) * 0.6 + tangent * 0.4;
      worldPos += spiral * uWarpAmplitude * fall * (0.7 + 0.3 * sin(t * 6.28));
      segAB.xy += spiral * uWarpAmplitude * fall * 0.5;
      segAB.zw += spiral * uWarpAmplitude * fall * 0.5;
    }
  }

  // Fragment-cost hoists (see the vFx varying comment).
  float tipGlow = 0.0;
  if (uTipGlowEnabled > 0.5) {
    float age = max(0.0, uCurrentStep - birthStep);
    tipGlow = exp(-age / max(uTipGlowDecay, 1.0)) * uTipGlowBoost;
  }
  float breathMul = 1.0;
  if (uBreathEnabled > 0.5) {
    float radial = length(worldPos - uWorldCenter);
    float phase = uTimeMs * 0.001 * uBreathFrequency * 6.283185 - radial * 0.005;
    breathMul = 1.0 + sin(phase) * uBreathAmplitude;
  }

  mat3 mvp = uProjectionMatrix * uWorldTransformMatrix * uTransformMatrix;
  gl_Position = vec4((mvp * vec3(worldPos, 1.0)).xy, 0.0, 1.0);
  vWorldPos = worldPos;
  vSegAB = segAB;
  vHW = hw;
  vAlpha = alpha;
  vChainDist = aChainDist;
  vMeta = vec2(birthStep, layer);
  vFx = vec2(tipGlow, breathMul);
}
`,
  ts = `#version 300 es
precision highp float;

in vec2 vWorldPos;
in vec4 vSegAB;
in vec2 vHW;
in vec2 vAlpha;
in vec2 vChainDist;
in vec2 vMeta;
in vec2 vFx;   // x = tip-glow boost, y = breath width multiplier (vertex-hoisted)

uniform vec4 uColor;
uniform vec4 uWorldColorAlpha;

uniform float uTimeMs;
uniform float uCurrentStep;
uniform vec2  uWorldCenter;
uniform vec4  uPulses[${K}];
uniform float uActivePulseCount;
uniform float uPulseSpeed;
uniform float uPulseBand;
uniform float uPulseDuration;
uniform float uPulseBrightness;
uniform vec4  uPulseTints[${K}];
uniform float uFlowEnabled;
uniform float uFlowSpeed;
uniform float uFlowSpacing;
uniform float uFlowWidth;
uniform float uFlowBrightness;
uniform float uTwinkleEnabled;
uniform float uTwinkleFrequency;
uniform float uTwinkleAmplitude;
uniform float uLayerSplitEnabled;
uniform vec3  uCircleColor;
uniform vec3  uIconColor;

// Phase 7 (post-redesign) - tier-7-11 fx contributing additive RGB to the
// ribbon. Each gates on its presence uniform == 0 to early-out cheaply.
// uWarpAmplitude is also used in the vertex shader (warp displacement);
// declared here so the GLSL linker sees a consistent uniform set in both
// stages.
uniform float uQuantumPresence;
uniform float uQuantumCarrierHz;
uniform float uQuantumCollapsePeriodMs;
uniform float uQuantumCollapseHalfWidthMs;
uniform vec3  uQuantumColor;
uniform float uHivePresence;
uniform float uHivePulseHz;
uniform float uHiveInterferenceScale;
uniform float uHiveDoubleBeat;
uniform float uHiveRimBoost;
uniform vec3  uHiveColor;
uniform float uOrbitalPresence;
uniform float uOrbitalDashRate;
uniform vec3  uOrbitalColor;
uniform float uWarpAmplitude;
uniform vec3  uWarpColor;
uniform float uEschatonPresence;
uniform float uEschatonBeamCount;
uniform float uEschatonBeamWidth;
uniform float uEschatonBeamSpeed;
uniform float uEschatonHalo;
uniform float uEschatonFlashPeriod;
uniform float uEschatonFlashStrength;
uniform vec3  uEschatonColor;
// Per-frame scalar envelopes hoisted to the CPU (tick() computes them from
// uTimeMs + the fx params): the quantum collapse strobe and the eschaton
// annunciation flash are functions of time only, so evaluating their mod/exp
// once per frame beats once per fragment.
uniform float uQuantumCollapse;
uniform float uEschatonFlash;

// Sway uniforms appear in the same UniformGroup but only the vertex shader
// uses them; declared here so the shared GLSL program links cleanly.
uniform float uLineWidth;
uniform float uIconOpacity;
uniform float uCircleOpacity;
uniform float uDebugMainOnly;
uniform float uDebugSideOnly;
uniform float uSwayEnabled;
uniform float uSwayAmplitude;
uniform float uSwayFrequency;
uniform float uSwayChainMax;
uniform float uSwayMinBranchLen;
uniform float uSwayIconScale;
uniform float uSwayCircleScale;

// Master layer opacity (the lab alpha slider). Applied in-shader because a
// container worldAlpha doesn't reliably reach this custom mesh/MAX-blend path.
uniform float uRenderOpacity;

out vec4 finalColor;

float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

void main() {
  vec2 a = vSegAB.xy;
  vec2 b = vSegAB.zw;
  vec2 ba = b - a;
  vec2 pa = vWorldPos - a;
  float denom = max(dot(ba, ba), 1e-6);
  float h = clamp(dot(pa, ba) / denom, 0.0, 1.0);
  float lineDist = length(pa - ba * h);
  // (3) Breathing — slow radial wave modulates capsule half-width
  // (vertex-hoisted; vFx.y is 1.0 when the effect is off).
  float w = mix(vHW.x, vHW.y, h) * vFx.y;

  float sd = lineDist - w;
  float aa = max(fwidth(sd), 1e-4);
  float cov = 1.0 - smoothstep(-aa, aa, sd);

  float alpha = mix(vAlpha.x, vAlpha.y, h);

  // Every output term below rides alpha*cov, so a zero-coverage fragment is a
  // MAX-blend no-op — return before the fx stack. The quads are padded well
  // past the capsule (sway/warp headroom), so these are the majority of
  // rasterized fragments; skipping them here is exact, not an approximation.
  if (alpha * cov <= 0.0) {
    finalColor = vec4(0.0);
    return;
  }

  float brightness = 1.0;

  // (2) Chain flow packets.
  if (uFlowEnabled > 0.5) {
    float chainPos = mix(vChainDist.x, vChainDist.y, h);
    float offset = uTimeMs * 0.001 * uFlowSpeed - chainPos;
    float m = mod(offset, uFlowSpacing);
    if (m > uFlowSpacing * 0.5) m -= uFlowSpacing;
    float d = m / max(uFlowWidth, 1e-4);
    brightness += exp(-d * d) * uFlowBrightness;
  }

  // (4) Tip glow — newly-grown segments emit a fading bloom (vertex-hoisted;
  // birthStep is constant per quad, so the exp() moved out exactly).
  brightness += vFx.x;

  // (1) Click pulses — early-out when the ring buffer is empty. We compact
  // the active-pulse count on the CPU (see RibbonMesh.pulse / decayPulses)
  // so the loop bound is tight; iterating the inactive tail would waste
  // fragment-shader cycles every frame regardless of pulse activity.
  // p.w encodes a per-pulse brightness multiplier (0 or unset = use 1.0).
  // uPulseTints[i].rgb encodes a per-pulse accent color; (0,0,0) → use the
  // legacy white-brightness path (modulated by the ribbon layer color),
  // non-zero → additive colored glow unmodulated by layer (tier comet/flash).
  int activeCount = int(uActivePulseCount + 0.5);
  vec3 pulseColorAdd = vec3(0.0);
  for (int i = 0; i < ${K}; i++) {
    if (i >= activeCount) break;
    vec4 p = uPulses[i];
    if (p.z <= 0.0) continue;
    float elapsed = (uTimeMs - p.z) * 0.001;
    if (elapsed < 0.0 || elapsed > uPulseDuration) continue;
    float waveRadius = elapsed * uPulseSpeed;
    float pixelRadius = length(vWorldPos - p.xy);
    float d = (pixelRadius - waveRadius) / max(uPulseBand, 1e-4);
    float fade = 1.0 - elapsed / max(uPulseDuration, 1e-4);
    float perPulseMul = p.w > 0.0 ? p.w : 1.0;
    float contrib = exp(-d * d) * fade * uPulseBrightness * perPulseMul;
    vec3 tint = uPulseTints[i].rgb;
    if (tint.r + tint.g + tint.b > 0.0) {
      pulseColorAdd += tint * contrib;
    } else {
      brightness += contrib;
    }
  }

  // (5) Twinkle — cell-based hash noise scintillation.
  if (uTwinkleEnabled > 0.5) {
    vec2 cell = floor(vWorldPos * uTwinkleFrequency + uTimeMs * 0.01);
    float n = hash21(cell);
    brightness *= 1.0 + (n - 0.5) * 2.0 * uTwinkleAmplitude;
  }

  brightness = max(brightness, 0.0);

  // (6) Layer color split — coral hue vs circuit hue, mixed by layer flag.
  vec3 layerColor = vec3(1.0);
  if (uLayerSplitEnabled > 0.5) {
    layerColor = mix(uCircleColor, uIconColor, vMeta.y);
  }

  // (7) Tier 7-11 fx (post-redesign) - each routes contributions through
  // either brightness (scalar boost ridden by layerColor) or fxAdd
  // (RGB additive). All ride on the ribbon via alpha*cov below.
  vec3 fxAdd = vec3(0.0);

  // QUANTUM — Probability Cloud Collapse. Continuous interference bands
  // along chain + periodic synchronous global collapse strobe. No spatial
  // origin: every fragment peaks at the same instant.
  if (uQuantumPresence > 0.0) {
    float qSec = uTimeMs * 0.001;
    float chainPos = mix(vChainDist.x, vChainDist.y, h);
    float k1 = uQuantumCarrierHz;
    float k2 = uQuantumCarrierHz * 1.618;
    float w1 = sin(chainPos * 0.025 + qSec * k1 * 6.2831);
    float w2 = sin(chainPos * 0.041 - qSec * k2 * 6.2831 + vMeta.x * 0.13);
    float w3 = sin((vWorldPos.x + vWorldPos.y) * 0.018 + qSec * k1 * 3.1);
    float interf = (w1 + w2 + w3) / 3.0;
    float cloud = 0.5 + 0.5 * interf;
    // Collapse: gaussian peak every period, sharp synchronous network-wide.
    // Time-only — evaluated on the CPU each frame (see tick()).
    float collapse = uQuantumCollapse;
    float quantumSnap = pow(0.5 + 0.5 * sin(chainPos * 0.06 + qSec * 12.0), 4.0);
    float field = mix(cloud, quantumSnap, collapse);
    brightness += uQuantumPresence * (0.35 + 0.65 * field) + uQuantumPresence * collapse * 1.4;
    vec3 violet = mix(uQuantumColor, vec3(1.0), collapse * 0.6);
    fxAdd += violet * uQuantumPresence * (0.4 * field + 1.2 * collapse);
  }

  // HIVEMIND — Synchronized Heartbeat. Global temporal pulse, no spatial
  // propagation. Stage 3 = lub-dub + rim glow.
  if (uHivePresence > 0.0) {
    float hSec = uTimeMs * 0.001;
    float gPhase = hSec * uHivePulseHz * 6.28318;
    vec2 hq = vWorldPos * uHiveInterferenceScale;
    float drift = hSec * 0.15;
    float hInterf = sin(hq.x + drift) * 0.5 + sin(hq.y * 1.21 - drift * 0.7) * 0.5;
    float hPhase = gPhase + hInterf * 1.2;
    float beatSin = sin(hPhase);
    float beatHeart = max(sin(hPhase), 0.55 * sin(hPhase - 1.13));
    float beat = mix(beatSin, beatHeart, clamp(uHiveDoubleBeat, 0.0, 1.0));
    float flash = max(beat, 0.0);
    flash = flash * flash;
    float edge = clamp(1.0 - smoothstep(0.0, w * 0.55, lineDist), 0.0, 1.0);
    float rim = (1.0 - edge) * uHiveRimBoost;
    fxAdd += uHiveColor * uHivePresence * flash * (1.0 + rim);
  }

  // ORBITAL — Annular rings with rotating azimuthal dashes. Two fixed
  // radii; rotation rate scales with stage. Wider sigma than before so
  // the rings register through alpha*cov modulation.
  if (uOrbitalPresence > 0.0) {
    float oSec = uTimeMs * 0.001;
    float r = length(vWorldPos - uWorldCenter);
    float ang = atan(vWorldPos.y - uWorldCenter.y, vWorldPos.x - uWorldCenter.x);
    float ringA = exp(-pow((r - uWorldCenter.x * 0.55) / 80.0, 2.0));
    float ringB = exp(-pow((r - uWorldCenter.x * 0.80) / 80.0, 2.0));
    // Rotating dash modulation — bright at peaks of cos, faint between.
    float dashA = 0.55 + 0.45 * cos(ang * 14.0 + oSec * uOrbitalDashRate * 6.28);
    float dashB = 0.55 + 0.45 * cos(ang * 10.0 - oSec * uOrbitalDashRate * 4.5);
    fxAdd += uOrbitalColor * uOrbitalPresence * (ringA * dashA + ringB * 0.85 * dashB);
  }

  if (uWarpAmplitude > 0.0) {
    float r = length(vWorldPos - uWorldCenter);
    float halo = exp(-r * 0.0008);
    fxAdd += uWarpColor * halo * 0.35;
  }

  // ESCHATON — Ascension Beams. Godrays from world center + perimeter
  // aureola + periodic full-network annunciation flash.
  if (uEschatonPresence > 0.0) {
    vec2 ed = vWorldPos - uWorldCenter;
    float er = length(ed);
    float eAng = atan(ed.y, ed.x);
    float eSec = uTimeMs * 0.001;
    float n = max(uEschatonBeamCount, 1.0);
    float sector = 6.28318 / n;
    float rel = mod(eAng - eSec * uEschatonBeamSpeed + 3.14159, sector) - sector * 0.5;
    float bw = max(uEschatonBeamWidth, 0.0001);
    float beam = exp(-(rel * rel) / (bw * bw));
    float radialGain = smoothstep(0.0, uWorldCenter.x, er);
    float godray = beam * (0.4 + 0.6 * radialGain);
    float rimT = (er - uWorldCenter.x * 0.6) / max(uWorldCenter.x * 0.5, 1.0);
    float halo = exp(-rimT * rimT * 3.0) * uEschatonHalo;
    // Annunciation flash: time-only — evaluated on the CPU each frame.
    float flash = uEschatonFlash;
    float eIntensity = (godray * 1.2 + halo + flash) * uEschatonPresence;
    fxAdd += uEschatonColor * eIntensity;
  }

  brightness = max(brightness, 0.0);
  vec4 base = uColor * uWorldColorAlpha;
  finalColor = base * vec4(layerColor, 1.0) * (alpha * cov * brightness);
  finalColor.rgb += (pulseColorAdd + fxAdd) * (alpha * cov);
  // Single linear master dimmer over the whole layer (body + glows + pulses).
  finalColor *= uRenderOpacity;
}
`,
  Mt = `
struct GlobalUniforms {
  uProjectionMatrix: mat3x3<f32>,
  uWorldTransformMatrix: mat3x3<f32>,
  uWorldColorAlpha: vec4<f32>,
  uResolution: vec2<f32>,
}

struct LocalUniforms {
  uTransformMatrix: mat3x3<f32>,
  uColor: vec4<f32>,
  uRound: f32,
}

struct EffectUniforms {
  uPulses: array<vec4<f32>, ${K}>,
  uPulseTints: array<vec4<f32>, ${K}>,
  uWorldCenter: vec2<f32>,
  uTimeMs: f32,
  uCurrentStep: f32,
  uLineWidth: f32,
  uIconOpacity: f32,
  uCircleOpacity: f32,
  uActivePulseCount: f32,
  uDebugMainOnly: f32,
  uDebugSideOnly: f32,
  uPulseSpeed: f32,
  uPulseBand: f32,
  uPulseDuration: f32,
  uPulseBrightness: f32,
  uFlowEnabled: f32,
  uFlowSpeed: f32,
  uFlowSpacing: f32,
  uFlowWidth: f32,
  uFlowBrightness: f32,
  uBreathEnabled: f32,
  uBreathFrequency: f32,
  uBreathAmplitude: f32,
  uTipGlowEnabled: f32,
  uTipGlowDecay: f32,
  uTipGlowBoost: f32,
  uTwinkleEnabled: f32,
  uTwinkleFrequency: f32,
  uTwinkleAmplitude: f32,
  uLayerSplitEnabled: f32,
  uSwayEnabled: f32,
  uSwayAmplitude: f32,
  uSwayFrequency: f32,
  uSwayChainMax: f32,
  uSwayMinBranchLen: f32,
  uSwayIconScale: f32,
  uSwayCircleScale: f32,
  uCircleColor: vec3<f32>,
  uIconColor: vec3<f32>,
  uQuantumPresence: f32,
  uQuantumCarrierHz: f32,
  uQuantumCollapsePeriodMs: f32,
  uQuantumCollapseHalfWidthMs: f32,
  uQuantumColor: vec3<f32>,
  uHivePresence: f32,
  uHivePulseHz: f32,
  uHiveInterferenceScale: f32,
  uHiveDoubleBeat: f32,
  uHiveRimBoost: f32,
  uHiveColor: vec3<f32>,
  uOrbitalPresence: f32,
  uOrbitalDashRate: f32,
  uOrbitalColor: vec3<f32>,
  uWarpAmplitude: f32,
  uWarpColor: vec3<f32>,
  uEschatonPresence: f32,
  uEschatonBeamCount: f32,
  uEschatonBeamWidth: f32,
  uEschatonBeamSpeed: f32,
  uEschatonHalo: f32,
  uEschatonFlashPeriod: f32,
  uEschatonFlashStrength: f32,
  uEschatonColor: vec3<f32>,
  uQuantumCollapse: f32,
  uEschatonFlash: f32,
  uRenderOpacity: f32,
}

@group(0) @binding(0) var<uniform> globalUniforms: GlobalUniforms;
@group(1) @binding(0) var<uniform> localUniforms: LocalUniforms;
@group(2) @binding(0) var<uniform> effectUniforms: EffectUniforms;

struct VsOut {
  @builtin(position) position: vec4<f32>,
  @location(0) vWorldPos: vec2<f32>,
  @location(1) vSegAB: vec4<f32>,
  @location(2) vHW: vec2<f32>,
  @location(3) vAlpha: vec2<f32>,
  @location(4) vChainDist: vec2<f32>,
  @location(5) vMeta: vec2<f32>,
  // x = tip-glow boost, y = breath width multiplier (vertex-hoisted; see the
  // GLSL twin's vFx comment).
  @location(6) vFx: vec2<f32>,
}

fn branchPhase(id: f32) -> f32 {
  return fract(sin(id * 12.9898) * 43758.5453) * 6.28318;
}

fn swayField(p: vec2<f32>, tSec: f32, phase: f32) -> vec2<f32> {
  let t = tSec * effectUniforms.uSwayFrequency;
  let base = vec2<f32>(
    sin(t * 6.28318 * 1.0 + p.x * 0.0008 + p.y * 0.0003 + phase),
    cos(t * 6.28318 * 0.9 + p.x * 0.0004 + p.y * 0.001  + phase * 1.3)
  );
  let detail = vec2<f32>(
    sin(t * 6.28318 * 2.7 + p.x * 0.003  + p.y * 0.002 + phase * 1.7),
    cos(t * 6.28318 * 2.5 + p.x * 0.002  + p.y * 0.003 + phase * 2.1)
  );
  return base + detail * 0.3;
}

fn degenerate() -> VsOut {
  var out: VsOut;
  out.position = vec4<f32>(2.0, 2.0, 2.0, 1.0);
  out.vWorldPos = vec2<f32>(0.0);
  out.vSegAB = vec4<f32>(0.0);
  out.vHW = vec2<f32>(0.0);
  out.vAlpha = vec2<f32>(0.0);
  out.vChainDist = vec2<f32>(0.0);
  out.vMeta = vec2<f32>(0.0);
  out.vFx = vec2<f32>(0.0, 1.0);
  return out;
}

@vertex
fn mainVertex(
  @location(0) aPosition: vec2<f32>,
  @location(1) aSegAB: vec4<f32>,
  @location(2) aChainDist: vec2<f32>,
  @location(3) aMeta: vec3<f32>,
  @location(4) aBranchAB: vec2<f32>,
  @location(5) aBranchLen: vec2<f32>,
  @location(6) aThicknessAB: vec2<f32>,
) -> VsOut {
  let birthStep = aMeta.x;
  let layer = aMeta.y;
  let isMain = aMeta.z;

  if (birthStep > effectUniforms.uCurrentStep + 0.5) { return degenerate(); }
  if (effectUniforms.uDebugMainOnly > 0.5 && isMain < 0.5) { return degenerate(); }
  if (effectUniforms.uDebugSideOnly > 0.5 && isMain > 0.5) { return degenerate(); }

  let layerOp = mix(effectUniforms.uCircleOpacity, effectUniforms.uIconOpacity, layer);
  let thA = aThicknessAB.x;
  let thB = aThicknessAB.y;
  let hw = vec2<f32>(effectUniforms.uLineWidth + thA, effectUniforms.uLineWidth + thB) * 0.5;
  let alpha = vec2<f32>(
    layerOp * (thA * (1.0 / 3.0) + 0.2),
    layerOp * (thB * (1.0 / 3.0) + 0.2)
  );

  var worldPos = aPosition;
  var segAB = aSegAB;

  if (effectUniforms.uSwayEnabled > 0.5) {
    let tSec = effectUniforms.uTimeMs * 0.001;
    let chainMax = max(effectUniforms.uSwayChainMax, 1.0);
    let fallA = clamp(aChainDist.x / chainMax, 0.0, 1.0);
    let fallB = clamp(aChainDist.y / chainMax, 0.0, 1.0);
    let phaseA = branchPhase(aBranchAB.x);
    let phaseB = branchPhase(aBranchAB.y);
    let minLen = max(effectUniforms.uSwayMinBranchLen, 1.0);
    let lenScaleA = clamp(aBranchLen.x / minLen, 0.0, 1.0);
    let lenScaleB = clamp(aBranchLen.y / minLen, 0.0, 1.0);
    let layerScale = mix(effectUniforms.uSwayCircleScale, effectUniforms.uSwayIconScale, layer);
    let dispA = swayField(aSegAB.xy, tSec, phaseA) * effectUniforms.uSwayAmplitude * fallA * lenScaleA * layerScale;
    let dispB = swayField(aSegAB.zw, tSec, phaseB) * effectUniforms.uSwayAmplitude * fallB * lenScaleB * layerScale;

    let ba = aSegAB.zw - aSegAB.xy;
    let h = clamp(dot(aPosition - aSegAB.xy, ba) / max(dot(ba, ba), 1e-6), 0.0, 1.0);
    let dispVert = mix(dispA, dispB, h);

    worldPos = aPosition + dispVert;
    segAB = vec4<f32>(aSegAB.xy + dispA, aSegAB.zw + dispB);
  }

  if (effectUniforms.uWarpAmplitude > 0.0) {
    let toCenter = effectUniforms.uWorldCenter - worldPos;
    let dist = length(toCenter);
    if (dist > 1.0) {
      let tangent = vec2<f32>(-toCenter.y, toCenter.x) / dist;
      let fall = 1.0 / (1.0 + dist * 0.0008);
      let tSec = effectUniforms.uTimeMs * 0.0001;
      let spiral = (toCenter / dist) * 0.6 + tangent * 0.4;
      worldPos = worldPos + spiral * effectUniforms.uWarpAmplitude * fall * (0.7 + 0.3 * sin(tSec * 6.28));
      segAB = vec4<f32>(
        segAB.xy + spiral * effectUniforms.uWarpAmplitude * fall * 0.5,
        segAB.zw + spiral * effectUniforms.uWarpAmplitude * fall * 0.5,
      );
    }
  }

  // Fragment-cost hoists (mirrors the GLSL twin).
  var tipGlow = 0.0;
  if (effectUniforms.uTipGlowEnabled > 0.5) {
    let age = max(0.0, effectUniforms.uCurrentStep - birthStep);
    tipGlow = exp(-age / max(effectUniforms.uTipGlowDecay, 1.0)) * effectUniforms.uTipGlowBoost;
  }
  var breathMul = 1.0;
  if (effectUniforms.uBreathEnabled > 0.5) {
    let radial = length(worldPos - effectUniforms.uWorldCenter);
    let phase = effectUniforms.uTimeMs * 0.001 * effectUniforms.uBreathFrequency * 6.283185 - radial * 0.005;
    breathMul = 1.0 + sin(phase) * effectUniforms.uBreathAmplitude;
  }

  let mvp = globalUniforms.uProjectionMatrix * globalUniforms.uWorldTransformMatrix * localUniforms.uTransformMatrix;
  let clip = mvp * vec3<f32>(worldPos, 1.0);
  var out: VsOut;
  out.position = vec4<f32>(clip.xy, 0.0, 1.0);
  out.vWorldPos = worldPos;
  out.vSegAB = segAB;
  out.vHW = hw;
  out.vAlpha = alpha;
  out.vChainDist = aChainDist;
  out.vMeta = vec2<f32>(birthStep, layer);
  out.vFx = vec2<f32>(tipGlow, breathMul);
  return out;
}

fn hash21(p_in: vec2<f32>) -> f32 {
  var p = fract(p_in * vec2<f32>(123.34, 456.21));
  p = p + vec2<f32>(dot(p, p + 45.32));
  return fract(p.x * p.y);
}

@fragment
fn mainFragment(in: VsOut) -> @location(0) vec4<f32> {
  let a = in.vSegAB.xy;
  let b = in.vSegAB.zw;
  let ba = b - a;
  let pa = in.vWorldPos - a;
  let denom = max(dot(ba, ba), 1e-6);
  let h = clamp(dot(pa, ba) / denom, 0.0, 1.0);
  let lineDist = length(pa - ba * h);
  // Breath is vertex-hoisted; in.vFx.y is 1.0 when the effect is off.
  let w = mix(in.vHW.x, in.vHW.y, h) * in.vFx.y;

  let sd = lineDist - w;
  let aa = max(fwidth(sd), 1e-4);
  let cov = 1.0 - smoothstep(-aa, aa, sd);

  let alpha = mix(in.vAlpha.x, in.vAlpha.y, h);

  // Every output term below rides alpha*cov, so a zero-coverage fragment is a
  // MAX-blend no-op — return before the fx stack (see the GLSL twin).
  if (alpha * cov <= 0.0) {
    return vec4<f32>(0.0);
  }

  var brightness: f32 = 1.0;

  if (effectUniforms.uFlowEnabled > 0.5) {
    let chainPos = mix(in.vChainDist.x, in.vChainDist.y, h);
    let offset = effectUniforms.uTimeMs * 0.001 * effectUniforms.uFlowSpeed - chainPos;
    var m = offset - effectUniforms.uFlowSpacing * floor(offset / effectUniforms.uFlowSpacing);
    if (m > effectUniforms.uFlowSpacing * 0.5) {
      m = m - effectUniforms.uFlowSpacing;
    }
    let d = m / max(effectUniforms.uFlowWidth, 1e-4);
    brightness = brightness + exp(-d * d) * effectUniforms.uFlowBrightness;
  }

  // Tip glow is vertex-hoisted (exact: birthStep is constant per quad).
  brightness = brightness + in.vFx.x;

  let activeCount = u32(effectUniforms.uActivePulseCount + 0.5);
  var pulseColorAdd = vec3<f32>(0.0);
  for (var i = 0u; i < ${K}u; i = i + 1u) {
    if (i >= activeCount) { break; }
    let p = effectUniforms.uPulses[i];
    if (p.z <= 0.0) { continue; }
    let elapsed = (effectUniforms.uTimeMs - p.z) * 0.001;
    if (elapsed < 0.0 || elapsed > effectUniforms.uPulseDuration) { continue; }
    let waveRadius = elapsed * effectUniforms.uPulseSpeed;
    let pixelRadius = length(in.vWorldPos - p.xy);
    let d = (pixelRadius - waveRadius) / max(effectUniforms.uPulseBand, 1e-4);
    let fade = 1.0 - elapsed / max(effectUniforms.uPulseDuration, 1e-4);
    let perPulseMul = select(1.0, p.w, p.w > 0.0);
    let contrib = exp(-d * d) * fade * effectUniforms.uPulseBrightness * perPulseMul;
    let tint = effectUniforms.uPulseTints[i].rgb;
    if (tint.r + tint.g + tint.b > 0.0) {
      pulseColorAdd = pulseColorAdd + tint * contrib;
    } else {
      brightness = brightness + contrib;
    }
  }

  if (effectUniforms.uTwinkleEnabled > 0.5) {
    let cell = floor(in.vWorldPos * effectUniforms.uTwinkleFrequency + effectUniforms.uTimeMs * 0.01);
    let n = hash21(cell);
    brightness = brightness * (1.0 + (n - 0.5) * 2.0 * effectUniforms.uTwinkleAmplitude);
  }

  brightness = max(brightness, 0.0);

  var layerColor = vec3<f32>(1.0);
  if (effectUniforms.uLayerSplitEnabled > 0.5) {
    layerColor = mix(effectUniforms.uCircleColor, effectUniforms.uIconColor, in.vMeta.y);
  }

  var fxAdd = vec3<f32>(0.0);

  // QUANTUM — Probability Cloud Collapse.
  if (effectUniforms.uQuantumPresence > 0.0) {
    let qSec = effectUniforms.uTimeMs * 0.001;
    let chainPos = mix(in.vChainDist.x, in.vChainDist.y, h);
    let k1 = effectUniforms.uQuantumCarrierHz;
    let k2 = effectUniforms.uQuantumCarrierHz * 1.618;
    let w1 = sin(chainPos * 0.025 + qSec * k1 * 6.2831);
    let w2 = sin(chainPos * 0.041 - qSec * k2 * 6.2831 + in.vMeta.x * 0.13);
    let w3 = sin((in.vWorldPos.x + in.vWorldPos.y) * 0.018 + qSec * k1 * 3.1);
    let interf = (w1 + w2 + w3) / 3.0;
    let cloud = 0.5 + 0.5 * interf;
    // Time-only — evaluated on the CPU each frame (see tick()).
    let collapse = effectUniforms.uQuantumCollapse;
    let quantumSnap = pow(0.5 + 0.5 * sin(chainPos * 0.06 + qSec * 12.0), 4.0);
    let field = mix(cloud, quantumSnap, collapse);
    brightness = brightness + effectUniforms.uQuantumPresence * (0.35 + 0.65 * field) + effectUniforms.uQuantumPresence * collapse * 1.4;
    let violet = mix(effectUniforms.uQuantumColor, vec3<f32>(1.0), collapse * 0.6);
    fxAdd = fxAdd + violet * effectUniforms.uQuantumPresence * (0.4 * field + 1.2 * collapse);
  }

  // HIVEMIND — Synchronized Heartbeat.
  if (effectUniforms.uHivePresence > 0.0) {
    let hSec = effectUniforms.uTimeMs * 0.001;
    let gPhase = hSec * effectUniforms.uHivePulseHz * 6.28318;
    let hq = in.vWorldPos * effectUniforms.uHiveInterferenceScale;
    let drift = hSec * 0.15;
    let hInterf = sin(hq.x + drift) * 0.5 + sin(hq.y * 1.21 - drift * 0.7) * 0.5;
    let hPhase = gPhase + hInterf * 1.2;
    let beatSin = sin(hPhase);
    let beatHeart = max(sin(hPhase), 0.55 * sin(hPhase - 1.13));
    let beat = mix(beatSin, beatHeart, clamp(effectUniforms.uHiveDoubleBeat, 0.0, 1.0));
    var flash = max(beat, 0.0);
    flash = flash * flash;
    let edge = clamp(1.0 - smoothstep(0.0, w * 0.55, lineDist), 0.0, 1.0);
    let rim = (1.0 - edge) * effectUniforms.uHiveRimBoost;
    fxAdd = fxAdd + effectUniforms.uHiveColor * effectUniforms.uHivePresence * flash * (1.0 + rim);
  }

  // ORBITAL — Annular rings with rotating azimuthal dashes.
  if (effectUniforms.uOrbitalPresence > 0.0) {
    let oSec = effectUniforms.uTimeMs * 0.001;
    let r = length(in.vWorldPos - effectUniforms.uWorldCenter);
    let ang = atan2(in.vWorldPos.y - effectUniforms.uWorldCenter.y, in.vWorldPos.x - effectUniforms.uWorldCenter.x);
    let ringA = exp(-pow((r - effectUniforms.uWorldCenter.x * 0.55) / 80.0, 2.0));
    let ringB = exp(-pow((r - effectUniforms.uWorldCenter.x * 0.80) / 80.0, 2.0));
    let dashA = 0.55 + 0.45 * cos(ang * 14.0 + oSec * effectUniforms.uOrbitalDashRate * 6.28);
    let dashB = 0.55 + 0.45 * cos(ang * 10.0 - oSec * effectUniforms.uOrbitalDashRate * 4.5);
    fxAdd = fxAdd + effectUniforms.uOrbitalColor * effectUniforms.uOrbitalPresence * (ringA * dashA + ringB * 0.85 * dashB);
  }

  if (effectUniforms.uWarpAmplitude > 0.0) {
    let r = length(in.vWorldPos - effectUniforms.uWorldCenter);
    let halo = exp(-r * 0.0008);
    fxAdd = fxAdd + effectUniforms.uWarpColor * halo * 0.35;
  }

  // ESCHATON — Ascension Beams.
  if (effectUniforms.uEschatonPresence > 0.0) {
    let ed = in.vWorldPos - effectUniforms.uWorldCenter;
    let er = length(ed);
    let eAng = atan2(ed.y, ed.x);
    let eSec = effectUniforms.uTimeMs * 0.001;
    let n = max(effectUniforms.uEschatonBeamCount, 1.0);
    let sector = 6.28318 / n;
    let preRel = eAng - eSec * effectUniforms.uEschatonBeamSpeed + 3.14159;
    let rel = preRel - sector * floor(preRel / sector) - sector * 0.5;
    let bw = max(effectUniforms.uEschatonBeamWidth, 0.0001);
    let beam = exp(-(rel * rel) / (bw * bw));
    let radialGain = smoothstep(0.0, effectUniforms.uWorldCenter.x, er);
    let godray = beam * (0.4 + 0.6 * radialGain);
    let rimT = (er - effectUniforms.uWorldCenter.x * 0.6) / max(effectUniforms.uWorldCenter.x * 0.5, 1.0);
    let halo = exp(-rimT * rimT * 3.0) * effectUniforms.uEschatonHalo;
    // Annunciation flash: time-only — evaluated on the CPU each frame.
    let flash = effectUniforms.uEschatonFlash;
    let eIntensity = (godray * 1.2 + halo + flash) * effectUniforms.uEschatonPresence;
    fxAdd = fxAdd + effectUniforms.uEschatonColor * eIntensity;
  }

  brightness = max(brightness, 0.0);
  let base = localUniforms.uColor * globalUniforms.uWorldColorAlpha;
  var rgba = base * vec4<f32>(layerColor, 1.0) * (alpha * cov * brightness);
  rgba = vec4<f32>(rgba.rgb + (pulseColorAdd + fxAdd) * (alpha * cov), rgba.a);
  // Single linear master dimmer over the whole layer (body + glows + pulses).
  rgba = rgba * effectUniforms.uRenderOpacity;
  return rgba;
}
`;
function ns() {
  const n = new Float32Array(K * 4),
    e = new Float32Array(K * 4);
  return new da({
    uPulses: { value: n, type: "vec4<f32>", size: K },
    uPulseTints: { value: e, type: "vec4<f32>", size: K },
    uWorldCenter: { value: new Float32Array([0, 0]), type: "vec2<f32>" },
    uTimeMs: { value: 0, type: "f32" },
    uCurrentStep: { value: 0, type: "f32" },
    uLineWidth: { value: 1, type: "f32" },
    uIconOpacity: { value: 1, type: "f32" },
    uCircleOpacity: { value: 1, type: "f32" },
    uActivePulseCount: { value: 0, type: "f32" },
    uDebugMainOnly: { value: 0, type: "f32" },
    uDebugSideOnly: { value: 0, type: "f32" },
    uPulseSpeed: { value: 0, type: "f32" },
    uPulseBand: { value: 0, type: "f32" },
    uPulseDuration: { value: 0, type: "f32" },
    uPulseBrightness: { value: 0, type: "f32" },
    uFlowEnabled: { value: 0, type: "f32" },
    uFlowSpeed: { value: 0, type: "f32" },
    uFlowSpacing: { value: 1, type: "f32" },
    uFlowWidth: { value: 1, type: "f32" },
    uFlowBrightness: { value: 0, type: "f32" },
    uBreathEnabled: { value: 0, type: "f32" },
    uBreathFrequency: { value: 0, type: "f32" },
    uBreathAmplitude: { value: 0, type: "f32" },
    uTipGlowEnabled: { value: 0, type: "f32" },
    uTipGlowDecay: { value: 1, type: "f32" },
    uTipGlowBoost: { value: 0, type: "f32" },
    uTwinkleEnabled: { value: 0, type: "f32" },
    uTwinkleFrequency: { value: 0.01, type: "f32" },
    uTwinkleAmplitude: { value: 0, type: "f32" },
    uLayerSplitEnabled: { value: 0, type: "f32" },
    uSwayEnabled: { value: 0, type: "f32" },
    uSwayAmplitude: { value: 0, type: "f32" },
    uSwayFrequency: { value: 1, type: "f32" },
    uSwayChainMax: { value: 1, type: "f32" },
    uSwayMinBranchLen: { value: 1, type: "f32" },
    uSwayIconScale: { value: 1, type: "f32" },
    uSwayCircleScale: { value: 1, type: "f32" },
    uCircleColor: { value: new Float32Array([1, 1, 1]), type: "vec3<f32>" },
    uIconColor: { value: new Float32Array([1, 1, 1]), type: "vec3<f32>" },
    uQuantumPresence: { value: 0, type: "f32" },
    uQuantumCarrierHz: { value: 0, type: "f32" },
    uQuantumCollapsePeriodMs: { value: 0, type: "f32" },
    uQuantumCollapseHalfWidthMs: { value: 1, type: "f32" },
    uQuantumColor: { value: new Float32Array([0, 0, 0]), type: "vec3<f32>" },
    uHivePresence: { value: 0, type: "f32" },
    uHivePulseHz: { value: 0, type: "f32" },
    uHiveInterferenceScale: { value: 0, type: "f32" },
    uHiveDoubleBeat: { value: 0, type: "f32" },
    uHiveRimBoost: { value: 0, type: "f32" },
    uHiveColor: { value: new Float32Array([0, 0, 0]), type: "vec3<f32>" },
    uOrbitalPresence: { value: 0, type: "f32" },
    uOrbitalDashRate: { value: 0, type: "f32" },
    uOrbitalColor: { value: new Float32Array([0, 0, 0]), type: "vec3<f32>" },
    uWarpAmplitude: { value: 0, type: "f32" },
    uWarpColor: { value: new Float32Array([0, 0, 0]), type: "vec3<f32>" },
    uEschatonPresence: { value: 0, type: "f32" },
    uEschatonBeamCount: { value: 0, type: "f32" },
    uEschatonBeamWidth: { value: 0, type: "f32" },
    uEschatonBeamSpeed: { value: 0, type: "f32" },
    uEschatonHalo: { value: 0, type: "f32" },
    uEschatonFlashPeriod: { value: 0, type: "f32" },
    uEschatonFlashStrength: { value: 0, type: "f32" },
    uEschatonColor: { value: new Float32Array([0, 0, 0]), type: "vec3<f32>" },
    uQuantumCollapse: { value: 0, type: "f32" },
    uEschatonFlash: { value: 0, type: "f32" },
    uRenderOpacity: { value: 1, type: "f32" },
  });
}
function as(n) {
  const e = ua.from({ name: "marginal-growth-ribbon", vertex: es, fragment: ts }),
    t = fa.from({
      name: "marginal-growth-ribbon",
      vertex: { source: Mt, entryPoint: "mainVertex" },
      fragment: { source: Mt, entryPoint: "mainFragment" },
    });
  return new ha({ glProgram: e, gpuProgram: t, resources: { effectUniforms: n } });
}
const dn = [
    { id: "cursor", sourceGenIds: ["token"] },
    { id: "neuron", sourceGenIds: ["server"] },
    { id: "microchip", sourceGenIds: ["compute_cluster"] },
    { id: "processor", sourceGenIds: ["compute_cluster"] },
    { id: "server", sourceGenIds: ["data_flywheel", "refined_dataset", "emergent_dataset"] },
    {
      id: "datacenter",
      sourceGenIds: ["long_reasoning_chain", "supervised_reasoning_chain", "differential_accord"],
    },
    {
      id: "quantum",
      sourceGenIds: ["dl_framework", "guardian_daemon", "native_language_paradigm"],
    },
    {
      id: "hivemind",
      sourceGenIds: ["neural_interconnect", "value_test_matrix", "high_dim_field"],
    },
    {
      id: "orbital",
      sourceGenIds: ["supercompute_center", "interpretability_core", "turbulence_dynamics"],
    },
    {
      id: "singularity",
      sourceGenIds: ["recursive_self_improvement", "full_feature_atlas", "homeostasis_structure"],
    },
    {
      id: "eschaton",
      sourceGenIds: ["singularity_gate", "terminal_lockdown", "primordial_protocol"],
    },
  ],
  ss = {
    off: { lineWidth: 0, iconOpacity: 0, circleOpacity: 0 },
    min: { lineWidth: 0.6, iconOpacity: 0.3, circleOpacity: 0.15 },
    max: { lineWidth: 1.5, iconOpacity: 1, circleOpacity: 0.5 },
  },
  is = {
    off: { fxTipGlowEnabled: 0, fxTipGlowDecay: 1, fxTipGlowBoost: 0 },
    min: { fxTipGlowEnabled: 1, fxTipGlowDecay: 15, fxTipGlowBoost: 0.5 },
    max: { fxTipGlowEnabled: 1, fxTipGlowDecay: 3, fxTipGlowBoost: 1.4 },
  },
  rs = {
    off: {
      fxFlowEnabled: 0,
      fxFlowSpacing: 1,
      fxFlowSpeed: 0,
      fxFlowWidth: 1,
      fxFlowBrightness: 0,
    },
    min: {
      fxFlowEnabled: 1,
      fxFlowSpacing: 800,
      fxFlowSpeed: 60,
      fxFlowWidth: 12,
      fxFlowBrightness: 0.3,
    },
    max: {
      fxFlowEnabled: 1,
      fxFlowSpacing: 200,
      fxFlowSpeed: 200,
      fxFlowWidth: 25,
      fxFlowBrightness: 0.55,
    },
  },
  os = {
    off: { fxTwinkleEnabled: 0, fxTwinkleFrequency: 0.01, fxTwinkleAmplitude: 0 },
    min: { fxTwinkleEnabled: 1, fxTwinkleFrequency: 0.005, fxTwinkleAmplitude: 0.03 },
    max: { fxTwinkleEnabled: 1, fxTwinkleFrequency: 0.045, fxTwinkleAmplitude: 0.06 },
  },
  ls = {
    off: { fxSwayEnabled: 0, fxSwayAmplitude: 0, fxSwayFrequency: 1 },
    min: { fxSwayEnabled: 1, fxSwayAmplitude: 0.8, fxSwayFrequency: 0.2 },
    max: { fxSwayEnabled: 1, fxSwayAmplitude: 3.2, fxSwayFrequency: 0.4 },
  },
  cs = {
    off: { fxBreathEnabled: 0, fxBreathFrequency: 0, fxBreathAmplitude: 0 },
    min: { fxBreathEnabled: 1, fxBreathFrequency: 0.15, fxBreathAmplitude: 0.04 },
    max: { fxBreathEnabled: 1, fxBreathFrequency: 0.4, fxBreathAmplitude: 0.09 },
  },
  ds = {
    off: {
      fxQuantumPresence: 0,
      fxQuantumCarrierHz: 0,
      fxQuantumCollapsePeriodMs: 0,
      fxQuantumCollapseHalfWidthMs: 1,
    },
    min: {
      fxQuantumPresence: 0.35,
      fxQuantumCarrierHz: 1.4,
      fxQuantumCollapsePeriodMs: 6e3,
      fxQuantumCollapseHalfWidthMs: 280,
    },
    max: {
      fxQuantumPresence: 0.8,
      fxQuantumCarrierHz: 2.6,
      fxQuantumCollapsePeriodMs: 3e3,
      fxQuantumCollapseHalfWidthMs: 400,
    },
  },
  us = {
    off: {
      fxHivePresence: 0,
      fxHivePulseHz: 0,
      fxHiveInterferenceScale: 0,
      fxHiveDoubleBeat: 0,
      fxHiveRimBoost: 0,
    },
    min: {
      fxHivePresence: 0.35,
      fxHivePulseHz: 0.55,
      fxHiveInterferenceScale: 0.0018,
      fxHiveDoubleBeat: 0,
      fxHiveRimBoost: 0,
    },
    max: {
      fxHivePresence: 0.8,
      fxHivePulseHz: 0.8,
      fxHiveInterferenceScale: 0.0048,
      fxHiveDoubleBeat: 0,
      fxHiveRimBoost: 0.4,
    },
  },
  fs = {
    off: { fxOrbitalPresence: 0, fxOrbitalDashRate: 0 },
    min: { fxOrbitalPresence: 1.5, fxOrbitalDashRate: 0.2 },
    max: { fxOrbitalPresence: 3, fxOrbitalDashRate: 0.9 },
  },
  hs = { off: { fxWarpAmplitude: 0 }, min: { fxWarpAmplitude: 0.5 }, max: { fxWarpAmplitude: 4 } },
  ps = {
    off: {
      fxEschatonPresence: 0,
      fxEschatonBeamCount: 0,
      fxEschatonBeamWidth: 0,
      fxEschatonBeamSpeed: 0,
      fxEschatonHalo: 0,
      fxEschatonFlashPeriod: 0,
      fxEschatonFlashStrength: 0,
    },
    min: {
      fxEschatonPresence: 0.35,
      fxEschatonBeamCount: 2,
      fxEschatonBeamWidth: 0.35,
      fxEschatonBeamSpeed: 0.05,
      fxEschatonHalo: 0.15,
      fxEschatonFlashPeriod: 0,
      fxEschatonFlashStrength: 0,
    },
    max: {
      fxEschatonPresence: 0.7,
      fxEschatonBeamCount: 6,
      fxEschatonBeamWidth: 0.6,
      fxEschatonBeamSpeed: 0.12,
      fxEschatonHalo: 0.5,
      fxEschatonFlashPeriod: 12,
      fxEschatonFlashStrength: 0.4,
    },
  },
  ms = {
    cursor: ss,
    neuron: is,
    microchip: rs,
    processor: os,
    server: ls,
    datacenter: cs,
    quantum: ds,
    hivemind: us,
    orbital: fs,
    singularity: hs,
    eschaton: ps,
  },
  xs = {
    quantum: "fxQuantumColor",
    hivemind: "fxHiveColor",
    orbital: "fxOrbitalColor",
    singularity: "fxWarpColor",
    eschaton: "fxEschatonColor",
  },
  gs = {
    quantum: "fxQuantumPresence",
    hivemind: "fxHivePresence",
    orbital: "fxOrbitalPresence",
    singularity: "fxWarpAmplitude",
    eschaton: "fxEschatonPresence",
  },
  bs = 0;
function vs(n, e) {
  const t = (n >> 16) & 255,
    s = (n >> 8) & 255,
    i = n & 255,
    o = Math.round(t * 0.299 + s * 0.587 + i * 0.114),
    r = (l) => Math.round(l * (1 - e) + o * e);
  return (r(t) << 16) | (r(s) << 8) | r(i);
}
function ys(n, e) {
  let t = n;
  for (const s of dn) {
    const i = s.id,
      o = xs[i],
      r = gs[i];
    if (!o || !r) continue;
    const l = ws(s, e);
    if (l === void 0) continue;
    const d = t[r] > 0 ? vs(l, bs) : 0;
    t = { ...t, [o]: d };
  }
  return t;
}
function ws(n, e) {
  for (const t of n.sourceGenIds) {
    const s = e[t];
    if (s !== void 0) return s;
  }
  return e[n.id];
}
function Cs(n, e) {
  let t = e[n.id] ?? 0;
  for (const s of n.sourceGenIds) {
    const i = e[s];
    i !== void 0 && i > t && (t = i);
  }
  return t;
}
function Ss(n, e, t) {
  const s = {};
  for (const i of new Set([...Object.keys(n), ...Object.keys(e)])) {
    const o = n[i] ?? 0,
      r = e[i] ?? 0;
    s[i] = o + (r - o) * t;
  }
  return s;
}
function As(n, e) {
  let t = n;
  for (const s of dn) {
    const i = ms[s.id],
      o = Cs(s, e),
      r = o < 1 ? i.off : Ss(i.min, i.max, kn(o));
    t = { ...t, ...r };
  }
  return t;
}
function jt(n) {
  return n.fxSwayAmplitude * Math.max(n.fxSwayIconScale, n.fxSwayCircleScale);
}
class Ps extends xe {
  params;
  owned = null;
  accents = {};
  loadId = 0;
  cache = null;
  effectUniforms = ns();
  ribbonShader = as(this.effectUniforms);
  debugFilter;
  ribbonMesh;
  branchBlurFilter = new pa({ strength: 0, quality: 3, kernelSize: 7 });
  blurFilters = [this.branchBlurFilter];
  blurFiltersActive = !1;
  pulseSlotInUse = new Uint8Array(K);
  nextPulseSlot = 0;
  pulseHighWater = 0;
  lastPulseSweepMs = 0;
  worldSize;
  cameraScale = 1;
  currentStep = -1;
  shape;
  constructor(e, t, s = {}) {
    (super(),
      (this.params = t),
      (this.worldSize = e),
      (this.debugFilter = s.debugFilter ?? "all"),
      (this.shape = s.shape ?? "circle"),
      (this.ribbonMesh = new Za(this.ribbonShader)),
      this.pivot.set(e / 2, e / 2),
      this.addChild(this.ribbonMesh));
    const i = this.effectUniforms.uniforms.uWorldCenter;
    ((i[0] = e / 2),
      (i[1] = e / 2),
      this.pushEffectParams(),
      this.pushDebugFilter(),
      this.applyScale(),
      this.applyRenderStyle(),
      this.loadCache());
  }
  setDebugFilter(e) {
    this.debugFilter !== e && ((this.debugFilter = e), this.pushDebugFilter());
  }
  debugStats() {
    return {
      ...this.ribbonMesh.debugStats(this.currentStep),
      chunkCount: this.cache ? 1 : 0,
      currentStep: this.currentStep,
      cacheLoaded: this.cache != null,
    };
  }
  getMaxSteps() {
    return this.cache?.maxSteps ?? 0;
  }
  debugMarkers() {
    const e = { chainStarts: [], chainEnds: [], forks: [] };
    if (!this.cache) return e;
    const t = this.ribbonMesh.getTopology();
    if (!t) return e;
    const s = this.currentStep,
      i = this.cache.nodes,
      o = new Map();
    for (const r of i)
      r.birthStep > s || (r.parentId != null && o.set(r.parentId, (o.get(r.parentId) ?? 0) + 1));
    for (let r = 0; r < i.length; r++) {
      const l = i[r];
      if (l.birthStep > s || l.parentId == null) continue;
      t.idToIndex.has(l.parentId)
        ? t.isMainChildOfParent(r, l.parentId) ||
          e.chainStarts.push({ x: l.x, y: l.y, id: l.id, kind: "side" })
        : e.chainStarts.push({ x: l.x, y: l.y, id: l.id, kind: "root" });
      const d = t.mainChildIdx[r];
      (d < 0 || t.birthStep[d] > s) && e.chainEnds.push({ x: l.x, y: l.y, id: l.id });
      const p = o.get(l.id) ?? 0;
      p > 1 && e.forks.push({ x: l.x, y: l.y, id: l.id, childCount: p });
    }
    return e;
  }
  setParams(e) {
    ((this.params = e),
      this.applyScale(),
      this.applyRenderStyle(),
      this.pushEffectParams(),
      this.rebakeIfPastCeiling());
  }
  setOwned(e) {
    ((this.owned = e), this.pushEffectParams(), this.rebakeIfPastCeiling());
  }
  setAccents(e) {
    ((this.accents = e), this.pushEffectParams());
  }
  rebakeIfPastCeiling() {
    if (!this.cache) return;
    const e = this.effectiveParams(),
      t = jt(e);
    this.ribbonMesh.isWithinBakeBounds(e.lineWidth, t, e.fxWarpAmplitude) ||
      (console.warn(
        "[marginalGrowth] rebaking mesh: lineWidth, sway, or warp exceeded bake ceiling",
      ),
      this.ribbonMesh.setCache(this.cache, {
        lineWidthCeiling: Math.max(Qe, e.lineWidth * 1.5),
        swayAmplitudeCeiling: Math.max(Ve, t * 1.5),
        warpAmplitudeCeiling: Math.max(Xe, e.fxWarpAmplitude * 1.5),
      }),
      this.ribbonMesh.updateStep(this.currentStep, !0));
  }
  tick() {
    const e = performance.now(),
      t = this.effectUniforms.uniforms;
    if (((t.uTimeMs = e), t.uQuantumPresence > 0)) {
      const s = Math.max(t.uQuantumCollapsePeriodMs, 1),
        i = e % s,
        o = Math.min(i, s - i),
        r = Math.max(t.uQuantumCollapseHalfWidthMs, 1);
      t.uQuantumCollapse = Math.exp(-(o * o) / (r * r));
    } else t.uQuantumCollapse = 0;
    if (t.uEschatonPresence > 0 && t.uEschatonFlashPeriod > 0.5) {
      const o = ((((e * 0.001) / t.uEschatonFlashPeriod) % 1) * t.uEschatonFlashPeriod) / 0.6;
      t.uEschatonFlash = Math.exp(-o * o) * t.uEschatonFlashStrength;
    } else t.uEschatonFlash = 0;
    if (
      (e - this.lastPulseSweepMs > 50 &&
        this.pulseHighWater > 0 &&
        (this.decayPulses(e), (this.lastPulseSweepMs = e)),
      this.cache)
    ) {
      const s = Math.max(0, Math.min(this.cache.maxSteps, Math.round(this.params.steps)));
      s !== this.currentStep &&
        ((this.currentStep = s), (t.uCurrentStep = s), this.ribbonMesh.updateStep(s));
    }
    this.effectUniforms.update();
  }
  setCameraScale(e) {
    const t = Math.max(0.01, e);
    t !== this.cameraScale && ((this.cameraScale = t), this.applyRenderStyle());
  }
  pulse(e, t, s = 1, i = 0) {
    const o = e ?? this.worldSize / 2,
      r = t ?? this.worldSize / 2,
      l = this.nextPulseSlot;
    this.nextPulseSlot = (this.nextPulseSlot + 1) % K;
    const c = l * 4,
      d = this.effectUniforms.uniforms.uPulses,
      p = this.effectUniforms.uniforms.uPulseTints;
    if (
      ((d[c] = o),
      (d[c + 1] = r),
      (d[c + 2] = performance.now()),
      (d[c + 3] = s <= 0 ? 0 : s),
      i > 0
        ? ((p[c] = ((i >> 16) & 255) / 255),
          (p[c + 1] = ((i >> 8) & 255) / 255),
          (p[c + 2] = (i & 255) / 255))
        : ((p[c] = 0), (p[c + 1] = 0), (p[c + 2] = 0)),
      (p[c + 3] = 0),
      (this.pulseSlotInUse[l] = 1),
      l + 1 > this.pulseHighWater)
    ) {
      this.pulseHighWater = l + 1;
      const x = this.effectUniforms.uniforms;
      x.uActivePulseCount = this.pulseHighWater;
    }
  }
  playFirstPurchase(e, t = 0) {
    this.pulse(this.worldSize / 2, this.worldSize / 2, 2.4, t);
  }
  destroy(e) {
    this.loadId += 1;
    const t =
      typeof e == "object" && e !== null
        ? { ...e, children: !0 }
        : { children: !0, ...(e ? { texture: e } : {}) };
    (super.destroy(t), this.ribbonShader.destroy(!1));
  }
  setShape(e) {
    this.shape !== e && ((this.shape = e), this.loadCache());
  }
  async loadCache() {
    const e = ++this.loadId,
      t = this.shape;
    try {
      const s = await Ga(t);
      if (e !== this.loadId || this.destroyed) return;
      ((this.cache = s), (this.currentStep = -1));
      const i = this.effectiveParams();
      this.ribbonMesh.setCache(s, {
        lineWidthCeiling: Math.max(Qe, i.lineWidth),
        swayAmplitudeCeiling: Math.max(Ve, jt(i)),
        warpAmplitudeCeiling: Math.max(Xe, i.fxWarpAmplitude),
      });
    } catch (s) {
      console.error("Failed to load marginal growth cache", s);
    }
  }
  applyScale() {
    this.scale.set(this.params.renderScale);
  }
  applyRenderStyle() {
    ((this.alpha = 1),
      (this.tint = this.params.renderTint),
      (this.branchBlurFilter.strength = this.params.renderBlur * this.cameraScale));
    const e = this.params.renderBlur > 0;
    e !== this.blurFiltersActive &&
      ((this.ribbonMesh.filters = e ? this.blurFilters : null), (this.blurFiltersActive = e));
  }
  decayPulses(e) {
    const t = this.effectUniforms.uniforms.uPulses,
      s = this.params.fxPulseDuration * 1e3;
    let i = 0;
    for (let o = 0; o < K; o++) {
      if (!this.pulseSlotInUse[o]) continue;
      const r = t[o * 4 + 2];
      e - r > s ? (this.pulseSlotInUse[o] = 0) : (i = o + 1);
    }
    if (i !== this.pulseHighWater) {
      this.pulseHighWater = i;
      const o = this.effectUniforms.uniforms;
      o.uActivePulseCount = i;
    }
  }
  effectiveParams() {
    let e = this.owned ? As(this.params, this.owned) : this.params;
    return (Object.keys(this.accents).length > 0 && (e = ys(e, this.accents)), e);
  }
  pushEffectParams() {
    const e = this.effectUniforms.uniforms,
      t = this.effectiveParams();
    ((e.uRenderOpacity = t.renderOpacity),
      (e.uLineWidth = t.lineWidth),
      (e.uIconOpacity = t.iconOpacity),
      (e.uCircleOpacity = t.circleOpacity),
      (e.uPulseSpeed = t.fxPulseSpeed),
      (e.uPulseBand = t.fxPulseBand),
      (e.uPulseDuration = t.fxPulseDuration),
      (e.uPulseBrightness = t.fxPulseBrightness),
      (e.uFlowEnabled = t.fxFlowEnabled),
      (e.uFlowSpeed = t.fxFlowSpeed),
      (e.uFlowSpacing = t.fxFlowSpacing),
      (e.uFlowWidth = t.fxFlowWidth),
      (e.uFlowBrightness = t.fxFlowBrightness),
      (e.uBreathEnabled = t.fxBreathEnabled),
      (e.uBreathFrequency = t.fxBreathFrequency),
      (e.uBreathAmplitude = t.fxBreathAmplitude),
      (e.uTipGlowEnabled = t.fxTipGlowEnabled),
      (e.uTipGlowDecay = t.fxTipGlowDecay),
      (e.uTipGlowBoost = t.fxTipGlowBoost),
      (e.uTwinkleEnabled = t.fxTwinkleEnabled),
      (e.uTwinkleFrequency = t.fxTwinkleFrequency),
      (e.uTwinkleAmplitude = t.fxTwinkleAmplitude),
      (e.uLayerSplitEnabled = t.fxLayerSplitEnabled),
      (e.uSwayEnabled = t.fxSwayEnabled),
      (e.uSwayAmplitude = t.fxSwayAmplitude),
      (e.uSwayFrequency = t.fxSwayFrequency),
      (e.uSwayChainMax = t.fxSwayChainMax),
      (e.uSwayMinBranchLen = t.fxSwayMinBranchLen),
      (e.uSwayIconScale = t.fxSwayIconScale),
      (e.uSwayCircleScale = t.fxSwayCircleScale),
      ce(e.uCircleColor, t.fxCircleColor),
      ce(e.uIconColor, t.fxIconColor),
      (e.uQuantumPresence = t.fxQuantumPresence),
      (e.uQuantumCarrierHz = t.fxQuantumCarrierHz),
      (e.uQuantumCollapsePeriodMs = t.fxQuantumCollapsePeriodMs),
      (e.uQuantumCollapseHalfWidthMs = t.fxQuantumCollapseHalfWidthMs),
      ce(e.uQuantumColor, t.fxQuantumColor),
      (e.uHivePresence = t.fxHivePresence),
      (e.uHivePulseHz = t.fxHivePulseHz),
      (e.uHiveInterferenceScale = t.fxHiveInterferenceScale),
      (e.uHiveDoubleBeat = t.fxHiveDoubleBeat),
      (e.uHiveRimBoost = t.fxHiveRimBoost),
      ce(e.uHiveColor, t.fxHiveColor),
      (e.uOrbitalPresence = t.fxOrbitalPresence),
      (e.uOrbitalDashRate = t.fxOrbitalDashRate),
      ce(e.uOrbitalColor, t.fxOrbitalColor),
      (e.uWarpAmplitude = t.fxWarpAmplitude),
      ce(e.uWarpColor, t.fxWarpColor),
      (e.uEschatonPresence = t.fxEschatonPresence),
      (e.uEschatonBeamCount = t.fxEschatonBeamCount),
      (e.uEschatonBeamWidth = t.fxEschatonBeamWidth),
      (e.uEschatonBeamSpeed = t.fxEschatonBeamSpeed),
      (e.uEschatonHalo = t.fxEschatonHalo),
      (e.uEschatonFlashPeriod = t.fxEschatonFlashPeriod),
      (e.uEschatonFlashStrength = t.fxEschatonFlashStrength),
      ce(e.uEschatonColor, t.fxEschatonColor));
  }
  pushDebugFilter() {
    const e = this.effectUniforms.uniforms;
    ((e.uDebugMainOnly = this.debugFilter === "main" ? 1 : 0),
      (e.uDebugSideOnly = this.debugFilter === "side" ? 1 : 0));
  }
}
const ks = 1,
  Ms = 2;
function Bt() {
  return Math.min(Ms, Math.max(ks, window.devicePixelRatio || 1));
}
function De(n) {
  return { width: Math.max(1, n.clientWidth), height: Math.max(1, n.clientHeight) };
}
const js = 500;
class rt {
  app;
  world;
  marginalGrowth;
  growth;
  camera;
  resizeObserver = null;
  destroyed = !1;
  host;
  appliedWidth = 0;
  appliedHeight = 0;
  sizeDirty = !1;
  lastSizePollMs = 0;
  static async create(e) {
    const t = new ma(),
      { width: s, height: i } = De(e.host);
    return (
      await t.init({
        width: s,
        height: i,
        preference: "webgl",
        antialias: !1,
        background: 0,
        backgroundAlpha: 0.9,
        resolution: Bt(),
        autoDensity: !0,
      }),
      e.host.append(t.canvas),
      (t.canvas.style.display = "block"),
      (t.canvas.style.width = "100%"),
      (t.canvas.style.height = "100%"),
      new rt(
        t,
        e.host,
        e.marginalGrowthParams,
        e.marginalGrowthWorldSize,
        e.marginalGrowthShape,
        e.onCameraTransform,
        e.onTap,
      )
    );
  }
  constructor(e, t, s, i, o, r, l) {
    ((this.app = e),
      (this.host = t),
      (this.world = new xe()),
      (this.world.eventMode = "none"),
      (this.world.interactiveChildren = !1),
      e.stage.addChild(this.world),
      (this.marginalGrowth = new Ps(i, s, { shape: o })),
      this.world.addChild(this.marginalGrowth),
      (this.growth = new Ta(1500)),
      this.world.addChild(this.growth),
      (this.camera = new Oa(e, this.world, r, l)));
    const c = De(t);
    ((this.appliedWidth = c.width),
      (this.appliedHeight = c.height),
      (this.resizeObserver = new ResizeObserver(this.onResizeSignal)),
      this.resizeObserver.observe(t),
      window.addEventListener("resize", this.onResizeSignal),
      e.ticker.add(this.tick));
  }
  setGrowthCount(e) {
    this.growth.setCount(e);
  }
  setMarginalGrowthParams(e) {
    this.marginalGrowth.setParams(e);
  }
  setMarginalGrowthOwned(e) {
    this.marginalGrowth.setOwned(e);
  }
  setCameraClamp(e) {
    this.camera.setClamp(e);
  }
  setMarginalGrowthAccents(e) {
    this.marginalGrowth.setAccents(e);
  }
  setBackgroundColor(e) {
    this.app.renderer.background.color = e;
  }
  setMarginalGrowthShape(e) {
    this.marginalGrowth.setShape(e);
  }
  setSuspended(e) {
    this.destroyed || (e ? this.app.ticker.stop() : (this.syncSize(), this.app.ticker.start()));
  }
  pulseMarginalGrowth() {
    this.marginalGrowth.pulse();
  }
  playMarginalGrowthFirstPurchase(e, t = 0) {
    this.marginalGrowth.playFirstPurchase(e, t);
  }
  recenter() {
    this.camera.recenter();
  }
  zoomAtClient(e, t, s) {
    this.camera.zoomAtClient(e, t, s);
  }
  panBy(e, t) {
    this.camera.panBy(e, t);
  }
  destroy() {
    this.destroyed ||
      ((this.destroyed = !0),
      this.resizeObserver?.disconnect(),
      window.removeEventListener("resize", this.onResizeSignal),
      this.app.ticker.remove(this.tick),
      this.camera.destroy(),
      this.app.destroy(!0, { children: !0, texture: !0 }));
  }
  tick = () => {
    if (this.destroyed) return;
    const e = performance.now();
    ((this.sizeDirty || e - this.lastSizePollMs >= js) &&
      ((this.lastSizePollMs = e), this.syncSize()),
      this.marginalGrowth.setCameraScale(this.world.scale.x),
      this.marginalGrowth.tick());
  };
  onResizeSignal = () => {
    ((this.sizeDirty = !0), this.syncSize());
  };
  syncSize = () => {
    if (this.destroyed) return;
    this.sizeDirty = !1;
    const { width: e, height: t } = De(this.host);
    (e === this.appliedWidth && t === this.appliedHeight) ||
      ((this.appliedWidth = e),
      (this.appliedHeight = t),
      this.app.renderer.resize(e, t, Bt()),
      this.camera.onResize());
  };
}
function un(n) {
  const e = /^#?([0-9a-f]{6})$/i.exec(n.trim());
  if (!e) return "148, 163, 184";
  const t = Number.parseInt(e[1], 16),
    s = (t >> 16) & 255,
    i = (t >> 8) & 255,
    o = t & 255;
  return `${s}, ${i}, ${o}`;
}
function Bs(n) {
  const e = /^#?([0-9a-f]{6})$/i.exec(n.trim());
  return e ? Number.parseInt(e[1], 16) : 9741240;
}
let Te = null;
function Es(n) {
  return (
    (Te = n),
    () => {
      Te === n && (Te = null);
    }
  );
}
function ot(n) {
  n.target.closest("button") || Te?.();
}
const Ns = JSON.parse(
    '[{"label":"TL","centroid":[-0.34437539620123453,0.30587221467553205],"outline":[[-0.43485617597292725,0.5702199661590525],[-0.3604060913705584,0.5702199661590525],[-0.3570219966159052,0.5668358714043993],[-0.34686971235194586,0.5668358714043993],[-0.34348561759729274,0.5634517766497462],[-0.32318104906937395,0.560067681895093],[-0.3130287648054145,0.5532994923857868],[-0.3062605752961083,0.5532994923857868],[-0.2927241962774958,0.5465313028764806],[-0.2859560067681895,0.5397631133671743],[-0.27580372250423013,0.5363790186125211],[-0.2656514382402707,0.5262267343485617],[-0.2622673434856176,0.5262267343485617],[-0.22842639593908629,0.49238578680203043],[-0.22842639593908629,0.4890016920473773],[-0.21150592216582065,0.4720812182741117],[-0.21150592216582065,0.4686971235194585],[-0.19796954314720813,0.45516074450084604],[-0.19120135363790186,0.4416243654822335],[-0.17428087986463622,0.4213197969543147],[-0.17089678510998307,0.41116751269035534],[-0.15397631133671744,0.38747884940778343],[-0.12690355329949238,0.3333333333333333],[-0.12690355329949238,0.32656514382402707],[-0.12013536379018612,0.3164128595600677],[-0.12013536379018612,0.3096446700507614],[-0.11336717428087986,0.29949238578680204],[-0.10998307952622674,0.2825719120135364],[-0.10321489001692047,0.26903553299492383],[-0.10321489001692047,0.25888324873096447],[-0.09983079526226735,0.25549915397631134],[-0.09644670050761421,0.23181049069373943],[-0.09306260575296109,0.22842639593908629],[-0.09306260575296109,0.21489001692047377],[-0.08967851099830795,0.21150592216582065],[-0.08967851099830795,0.19120135363790186],[-0.08629441624365482,0.18781725888324874],[-0.0829103214890017,0.12013536379018612],[-0.08629441624365482,0.116751269035533],[-0.08629441624365482,0.08629441624365482],[-0.08967851099830795,0.0829103214890017],[-0.08967851099830795,0.0727580372250423],[-0.09306260575296109,0.06937394247038917],[-0.09644670050761421,0.05583756345177665],[-0.116751269035533,0.05245346869712352],[-0.12013536379018612,0.049069373942470386],[-0.21150592216582065,0.049069373942470386],[-0.21489001692047377,0.05245346869712352],[-0.23519458544839256,0.05245346869712352],[-0.23857868020304568,0.05583756345177665],[-0.26903553299492383,0.05922165820642978],[-0.272419627749577,0.06260575296108291],[-0.2825719120135364,0.06260575296108291],[-0.2859560067681895,0.06598984771573604],[-0.3062605752961083,0.06937394247038917],[-0.3197969543147208,0.07614213197969544],[-0.3299492385786802,0.07614213197969544],[-0.3401015228426396,0.0829103214890017],[-0.34686971235194586,0.0829103214890017],[-0.36717428087986465,0.09306260575296109],[-0.3739424703891709,0.09306260575296109],[-0.40439932318104904,0.10998307952622674],[-0.41116751269035534,0.10998307952622674],[-0.42470389170896783,0.12013536379018612],[-0.4653130287648054,0.1404399323181049],[-0.49238578680203043,0.16074450084602368],[-0.505922165820643,0.16751269035532995],[-0.5296108291032149,0.18781725888324874],[-0.5329949238578681,0.18781725888324874],[-0.5668358714043993,0.22165820642978004],[-0.5668358714043993,0.22504230118443316],[-0.5769881556683587,0.23519458544839256],[-0.5803722504230119,0.24534686971235195],[-0.5871404399323181,0.2521150592216582],[-0.5939086294416244,0.2656514382402707],[-0.5939086294416244,0.272419627749577],[-0.6006768189509306,0.2825719120135364],[-0.6040609137055838,0.29949238578680204],[-0.6074450084602369,0.30287648054145516],[-0.6074450084602369,0.3164128595600677],[-0.61082910321489,0.3197969543147208],[-0.61082910321489,0.350253807106599],[-0.6142131979695431,0.3570219966159052],[-0.61082910321489,0.3604060913705584],[-0.61082910321489,0.3942470389170897],[-0.6074450084602369,0.3976311336717428],[-0.6074450084602369,0.4077834179357022],[-0.6040609137055838,0.41116751269035534],[-0.6006768189509306,0.43147208121827413],[-0.5736040609137056,0.48223350253807107],[-0.5363790186125211,0.5228426395939086],[-0.5329949238578681,0.5228426395939086],[-0.5126903553299492,0.5397631133671743],[-0.4720812182741117,0.560067681895093],[-0.4517766497461929,0.5634517766497462],[-0.44839255499153974,0.5668358714043993],[-0.43824027072758037,0.5668358714043993],[-0.43485617597292725,0.5702199661590525]]},{"label":"TR","centroid":[0.34160842217867815,0.30570113106024116],"outline":[[0.3637901861252115,0.5736040609137056],[0.4213197969543147,0.5736040609137056],[0.42470389170896783,0.5702199661590525],[0.43824027072758037,0.5702199661590525],[0.4416243654822335,0.5668358714043993],[0.4517766497461929,0.5668358714043993],[0.45516074450084604,0.5634517766497462],[0.4720812182741117,0.560067681895093],[0.505922165820643,0.5431472081218274],[0.5262267343485617,0.5262267343485617],[0.5296108291032149,0.5262267343485617],[0.560067681895093,0.4957698815566836],[0.560067681895093,0.49238578680203043],[0.5769881556683587,0.4720812182741117],[0.5939086294416244,0.43824027072758037],[0.5972927241962775,0.4213197969543147],[0.6006768189509306,0.4179357021996616],[0.6006768189509306,0.4077834179357022],[0.6040609137055838,0.40439932318104904],[0.6040609137055838,0.38747884940778343],[0.6074450084602369,0.3840947546531303],[0.6074450084602369,0.3299492385786802],[0.6040609137055838,0.32656514382402707],[0.6040609137055838,0.3130287648054145],[0.6006768189509306,0.3096446700507614],[0.6006768189509306,0.29949238578680204],[0.5972927241962775,0.2961082910321489],[0.5939086294416244,0.27918781725888325],[0.5769881556683587,0.24534686971235195],[0.560067681895093,0.22504230118443316],[0.560067681895093,0.22165820642978004],[0.5262267343485617,0.18781725888324874],[0.5228426395939086,0.18781725888324874],[0.505922165820643,0.17089678510998307],[0.5025380710659898,0.17089678510998307],[0.47884940778341795,0.1505922165820643],[0.4754653130287648,0.1505922165820643],[0.44839255499153974,0.13028764805414553],[0.43824027072758037,0.12690355329949238],[0.43147208121827413,0.12013536379018612],[0.4077834179357022,0.10998307952622674],[0.4010152284263959,0.10321489001692047],[0.38747884940778343,0.09983079526226735],[0.3637901861252115,0.08629441624365482],[0.3570219966159052,0.08629441624365482],[0.3299492385786802,0.0727580372250423],[0.3130287648054145,0.06937394247038917],[0.3096446700507614,0.06598984771573604],[0.29949238578680204,0.06598984771573604],[0.2859560067681895,0.05922165820642978],[0.25888324873096447,0.05583756345177665],[0.25549915397631134,0.05245346869712352],[0.23857868020304568,0.05245346869712352],[0.23519458544839256,0.049069373942470386],[0.21150592216582065,0.049069373942470386],[0.20812182741116753,0.04568527918781726],[0.13705583756345177,0.04568527918781726],[0.13367174280879865,0.049069373942470386],[0.116751269035533,0.049069373942470386],[0.11336717428087986,0.05245346869712352],[0.10321489001692047,0.05245346869712352],[0.09644670050761421,0.05583756345177665],[0.08967851099830795,0.06260575296108291],[0.08967851099830795,0.06937394247038917],[0.08629441624365482,0.0727580372250423],[0.08629441624365482,0.09306260575296109],[0.0829103214890017,0.09644670050761421],[0.0829103214890017,0.15397631133671744],[0.08629441624365482,0.15736040609137056],[0.08629441624365482,0.1844331641285956],[0.08967851099830795,0.18781725888324874],[0.08967851099830795,0.20473773265651438],[0.09306260575296109,0.20812182741116753],[0.09306260575296109,0.22165820642978004],[0.09644670050761421,0.22504230118443316],[0.09983079526226735,0.24873096446700507],[0.10321489001692047,0.2521150592216582],[0.10321489001692047,0.2622673434856176],[0.1065989847715736,0.2656514382402707],[0.1065989847715736,0.272419627749577],[0.10998307952622674,0.27580372250423013],[0.10998307952622674,0.2825719120135364],[0.11336717428087986,0.2859560067681895],[0.12013536379018612,0.3130287648054145],[0.12690355329949238,0.32318104906937395],[0.12690355329949238,0.3299492385786802],[0.13367174280879865,0.3401015228426396],[0.13367174280879865,0.34686971235194586],[0.16074450084602368,0.4010152284263959],[0.16751269035532995,0.4077834179357022],[0.17089678510998307,0.4179357021996616],[0.17766497461928935,0.42470389170896783],[0.18104906937394247,0.43485617597292725],[0.18781725888324874,0.4416243654822335],[0.19458544839255498,0.45516074450084604],[0.22504230118443316,0.49238578680203043],[0.22504230118443316,0.4957698815566836],[0.25549915397631134,0.5262267343485617],[0.25888324873096447,0.5262267343485617],[0.27918781725888325,0.5431472081218274],[0.3130287648054145,0.560067681895093],[0.3299492385786802,0.5634517766497462],[0.3333333333333333,0.5668358714043993],[0.34348561759729274,0.5668358714043993],[0.34686971235194586,0.5702199661590525],[0.3604060913705584,0.5702199661590525],[0.3637901861252115,0.5736040609137056]]},{"label":"BR","centroid":[0.3395116347661403,-0.3009593919105335],"outline":[[0.12690355329949238,-0.04230118443316413],[0.18781725888324874,-0.04230118443316413],[0.19120135363790186,-0.04568527918781726],[0.2182741116751269,-0.04568527918781726],[0.22165820642978004,-0.049069373942470386],[0.23857868020304568,-0.049069373942470386],[0.24196277495769883,-0.05245346869712352],[0.25549915397631134,-0.05245346869712352],[0.25888324873096447,-0.05583756345177665],[0.2825719120135364,-0.05922165820642978],[0.2859560067681895,-0.06260575296108291],[0.2961082910321489,-0.06260575296108291],[0.29949238578680204,-0.06598984771573604],[0.3062605752961083,-0.06598984771573604],[0.3096446700507614,-0.06937394247038917],[0.3164128595600677,-0.06937394247038917],[0.3197969543147208,-0.0727580372250423],[0.34686971235194586,-0.07952622673434856],[0.3570219966159052,-0.08629441624365482],[0.3637901861252115,-0.08629441624365482],[0.3739424703891709,-0.09306260575296109],[0.38071065989847713,-0.09306260575296109],[0.428087986463621,-0.116751269035533],[0.4416243654822335,-0.12690355329949238],[0.4517766497461929,-0.13028764805414553],[0.45854483925549916,-0.13705583756345177],[0.4686971235194585,-0.1404399323181049],[0.4754653130287648,-0.14720812182741116],[0.4890016920473773,-0.15397631133671744],[0.49915397631133673,-0.16412859560067683],[0.5025380710659898,-0.16412859560067683],[0.5126903553299492,-0.17428087986463622],[0.5262267343485617,-0.18104906937394247],[0.560067681895093,-0.21489001692047377],[0.560067681895093,-0.2182741116751269],[0.5769881556683587,-0.23857868020304568],[0.5939086294416244,-0.272419627749577],[0.5972927241962775,-0.2893401015228426],[0.6006768189509306,-0.2927241962774958],[0.6040609137055838,-0.3197969543147208],[0.6074450084602369,-0.32318104906937395],[0.6074450084602369,-0.377326565143824],[0.6040609137055838,-0.38071065989847713],[0.6040609137055838,-0.3976311336717428],[0.6006768189509306,-0.4010152284263959],[0.6006768189509306,-0.41116751269035534],[0.5972927241962775,-0.41455160744500846],[0.5939086294416244,-0.43147208121827413],[0.5769881556683587,-0.4653130287648054],[0.560067681895093,-0.4856175972927242],[0.560067681895093,-0.4890016920473773],[0.5296108291032149,-0.5194585448392555],[0.5262267343485617,-0.5194585448392555],[0.505922165820643,-0.5363790186125211],[0.4720812182741117,-0.5532994923857868],[0.45516074450084604,-0.55668358714044],[0.4517766497461929,-0.560067681895093],[0.4416243654822335,-0.560067681895093],[0.43824027072758037,-0.5634517766497462],[0.4213197969543147,-0.5634517766497462],[0.4179357021996616,-0.5668358714043993],[0.36717428087986465,-0.5668358714043993],[0.3637901861252115,-0.5634517766497462],[0.34686971235194586,-0.5634517766497462],[0.34348561759729274,-0.560067681895093],[0.3333333333333333,-0.560067681895093],[0.3299492385786802,-0.55668358714044],[0.3130287648054145,-0.5532994923857868],[0.27918781725888325,-0.5363790186125211],[0.25888324873096447,-0.5194585448392555],[0.25549915397631134,-0.5194585448392555],[0.22165820642978004,-0.4856175972927242],[0.22165820642978004,-0.48223350253807107],[0.20473773265651438,-0.4653130287648054],[0.20473773265651438,-0.4619289340101523],[0.1844331641285956,-0.43824027072758037],[0.1844331641285956,-0.43485617597292725],[0.16412859560067683,-0.4077834179357022],[0.16074450084602368,-0.3976311336717428],[0.15397631133671744,-0.39086294416243655],[0.14382402707275804,-0.36717428087986465],[0.13705583756345177,-0.3604060913705584],[0.13367174280879865,-0.34686971235194586],[0.116751269035533,-0.3164128595600677],[0.11336717428087986,-0.29949238578680204],[0.1065989847715736,-0.2893401015228426],[0.10321489001692047,-0.272419627749577],[0.09983079526226735,-0.26903553299492383],[0.09983079526226735,-0.25888324873096447],[0.09306260575296109,-0.24534686971235195],[0.08967851099830795,-0.2182741116751269],[0.08629441624365482,-0.21489001692047377],[0.08629441624365482,-0.19796954314720813],[0.0829103214890017,-0.19458544839255498],[0.0829103214890017,-0.17089678510998307],[0.07952622673434856,-0.16751269035532995],[0.07952622673434856,-0.09644670050761421],[0.0829103214890017,-0.09306260575296109],[0.0829103214890017,-0.07614213197969544],[0.08629441624365482,-0.0727580372250423],[0.08629441624365482,-0.06260575296108291],[0.08967851099830795,-0.05583756345177665],[0.09644670050761421,-0.049069373942470386],[0.10321489001692047,-0.049069373942470386],[0.1065989847715736,-0.04568527918781726],[0.12351945854483926,-0.04568527918781726],[0.12690355329949238,-0.04230118443316413]]},{"label":"BL","centroid":[-0.34662573120482654,-0.3009196754974499],"outline":[[-0.18104906937394247,-0.038917089678511],[-0.17089678510998307,-0.038917089678511],[-0.16751269035532995,-0.04230118443316413],[-0.13028764805414553,-0.04230118443316413],[-0.12690355329949238,-0.04568527918781726],[-0.11336717428087986,-0.04568527918781726],[-0.10998307952622674,-0.049069373942470386],[-0.10321489001692047,-0.049069373942470386],[-0.09644670050761421,-0.05583756345177665],[-0.09306260575296109,-0.06260575296108291],[-0.09306260575296109,-0.0727580372250423],[-0.08967851099830795,-0.07614213197969544],[-0.08967851099830795,-0.16751269035532995],[-0.09306260575296109,-0.17089678510998307],[-0.09306260575296109,-0.19120135363790186],[-0.09644670050761421,-0.19458544839255498],[-0.09644670050761421,-0.20812182741116753],[-0.09983079526226735,-0.21150592216582065],[-0.09983079526226735,-0.22504230118443316],[-0.10321489001692047,-0.22842639593908629],[-0.1065989847715736,-0.2521150592216582],[-0.10998307952622674,-0.25549915397631134],[-0.11336717428087986,-0.27580372250423013],[-0.12351945854483926,-0.2961082910321489],[-0.12690355329949238,-0.3130287648054145],[-0.13367174280879865,-0.32318104906937395],[-0.13367174280879865,-0.3299492385786802],[-0.17428087986463622,-0.41116751269035534],[-0.20812182741116753,-0.45854483925549916],[-0.20812182741116753,-0.4619289340101523],[-0.2182741116751269,-0.4720812182741117],[-0.2182741116751269,-0.4754653130287648],[-0.22842639593908629,-0.4856175972927242],[-0.22842639593908629,-0.4890016920473773],[-0.2622673434856176,-0.5228426395939086],[-0.2656514382402707,-0.5228426395939086],[-0.27580372250423013,-0.5329949238578681],[-0.3130287648054145,-0.5532994923857868],[-0.3299492385786802,-0.55668358714044],[-0.34348561759729274,-0.5634517766497462],[-0.3536379018612521,-0.5634517766497462],[-0.3570219966159052,-0.5668358714043993],[-0.4077834179357022,-0.5702199661590525],[-0.41116751269035534,-0.5668358714043993],[-0.43485617597292725,-0.5668358714043993],[-0.43824027072758037,-0.5634517766497462],[-0.4517766497461929,-0.5634517766497462],[-0.45516074450084604,-0.560067681895093],[-0.48223350253807107,-0.5532994923857868],[-0.5025380710659898,-0.5431472081218274],[-0.5093062605752962,-0.5363790186125211],[-0.5194585448392555,-0.5329949238578681],[-0.5296108291032149,-0.5228426395939086],[-0.5329949238578681,-0.5228426395939086],[-0.5634517766497462,-0.49238578680203043],[-0.5634517766497462,-0.4890016920473773],[-0.5736040609137056,-0.47884940778341795],[-0.5736040609137056,-0.4754653130287648],[-0.5871404399323181,-0.45854483925549916],[-0.5939086294416244,-0.4450084602368866],[-0.5939086294416244,-0.43824027072758037],[-0.6006768189509306,-0.428087986463621],[-0.6040609137055838,-0.4077834179357022],[-0.6074450084602369,-0.40439932318104904],[-0.6074450084602369,-0.3942470389170897],[-0.61082910321489,-0.39086294416243655],[-0.61082910321489,-0.3604060913705584],[-0.6142131979695431,-0.3570219966159052],[-0.6142131979695431,-0.350253807106599],[-0.61082910321489,-0.34686971235194586],[-0.61082910321489,-0.3164128595600677],[-0.6074450084602369,-0.3130287648054145],[-0.6040609137055838,-0.2893401015228426],[-0.5939086294416244,-0.26903553299492383],[-0.5939086294416244,-0.2622673434856176],[-0.583756345177665,-0.24873096446700507],[-0.5736040609137056,-0.22842639593908629],[-0.5634517766497462,-0.2182741116751269],[-0.5634517766497462,-0.21489001692047377],[-0.5329949238578681,-0.1844331641285956],[-0.5296108291032149,-0.1844331641285956],[-0.5126903553299492,-0.16751269035532995],[-0.5093062605752962,-0.16751269035532995],[-0.4856175972927242,-0.14720812182741116],[-0.48223350253807107,-0.14720812182741116],[-0.4450084602368866,-0.12013536379018612],[-0.428087986463621,-0.11336717428087986],[-0.4213197969543147,-0.1065989847715736],[-0.38071065989847713,-0.08629441624365482],[-0.3739424703891709,-0.08629441624365482],[-0.3570219966159052,-0.07614213197969544],[-0.350253807106599,-0.07614213197969544],[-0.34686971235194586,-0.0727580372250423],[-0.3197969543147208,-0.06598984771573604],[-0.3164128595600677,-0.06260575296108291],[-0.29949238578680204,-0.05922165820642978],[-0.2961082910321489,-0.05583756345177665],[-0.2859560067681895,-0.05583756345177665],[-0.2825719120135364,-0.05245346869712352],[-0.26903553299492383,-0.05245346869712352],[-0.2656514382402707,-0.049069373942470386],[-0.2521150592216582,-0.049069373942470386],[-0.24873096446700507,-0.04568527918781726],[-0.23181049069373943,-0.04568527918781726],[-0.22842639593908629,-0.04230118443316413],[-0.1844331641285956,-0.04230118443316413],[-0.18104906937394247,-0.038917089678511]]}]',
  ),
  Ts = { petals: Ns },
  Is = 850;
function Rs(n) {
  const e = Z(n).primary;
  return { bright: e.bright, mid: e.mid, dim: e.dim, deep: e.deep, rgb: un(e.bright) };
}
function Fs(n) {
  if (!n.length) return 0;
  let e = 1;
  for (const { p: s } of n) s < e && (e = s);
  const t = Math.max(0, 1 - e / 0.3);
  return t * t * (3 - 2 * t);
}
const Ws = Ts.petals;
function Et(n, e, t, s) {
  const i = s / 0.61;
  n.beginPath();
  for (const o of Ws) {
    const r = o.outline;
    n.moveTo(e + r[0][0] * i, t - r[0][1] * i);
    for (let l = 1; l < r.length; l++) n.lineTo(e + r[l][0] * i, t - r[l][1] * i);
    n.closePath();
  }
}
function q(n, e) {
  const t = /^#?([0-9a-f]{6})$/i.exec(n.trim());
  if (!t) return `rgba(148,163,184,${e})`;
  const s = Number.parseInt(t[1], 16);
  return `rgba(${(s >> 16) & 255},${(s >> 8) & 255},${s & 255},${e})`;
}
function $(n, e) {
  return `rgba(${n},${e})`;
}
function lt(n, e, t, s, i, o = {}) {
  const { glow: r = 0, glowRgb: l, stroke: c, strokeW: d = 1.5 } = o;
  (n.save(),
    r && ((n.shadowColor = $(l ?? "148,163,184", 0.9)), (n.shadowBlur = r)),
    (n.fillStyle = i),
    Et(n, e, t, s),
    n.fill("nonzero"),
    (n.shadowBlur = 0),
    c && ((n.lineWidth = d), (n.strokeStyle = c), Et(n, e, t, s), n.stroke()),
    n.restore());
}
function ie(n, e, t, s, i) {
  if (s <= 0) return;
  const o = n.createRadialGradient(e, t, 0, e, t, s);
  for (const [r, l] of i) o.addColorStop(r, l);
  ((n.fillStyle = o), n.beginPath(), n.arc(e, t, s, 0, Math.PI * 2), n.fill());
}
function Ie(n, e, t, s, i, o, r, l) {
  s <= 0 ||
    (n.save(),
    (n.lineWidth = o),
    (n.strokeStyle = i),
    r && ((n.shadowColor = $(l, 0.85)), (n.shadowBlur = r)),
    n.beginPath(),
    n.arc(e, t, s, 0, Math.PI * 2),
    n.stroke(),
    n.restore());
}
function Me(n, e, t, s, i, o, r, l) {
  s <= 0 ||
    (n.save(),
    (n.lineWidth = l),
    (n.strokeStyle = r),
    (n.lineCap = "round"),
    n.beginPath(),
    n.arc(e, t, s, i, o),
    n.stroke(),
    n.restore());
}
function Ze(n, e, t) {
  return n + (e - n) * t;
}
const je = [Math.PI * 1.12, Math.PI * 1.88],
  Be = [Math.PI * 0.12, Math.PI * 0.88];
function Os(n, e, { accent: t, impact: s, pulses: i }) {
  const o = e / 2,
    r = e / 2,
    l = 1 - 0.05 * s,
    c = e * 0.23 * l,
    d = c * 0.82,
    p = d * 0.55;
  (ie(n, o, r, c * 2.5, [
    [0, $(t.rgb, 0.15)],
    [0.5, $(t.rgb, 0.05)],
    [1, $(t.rgb, 0)],
  ]),
    n.save(),
    (n.globalCompositeOperation = "lighter"));
  for (const { p: x } of i) {
    const v = c * 0.8 + x * e * 0.46,
      u = Math.pow(1 - x, 1.7);
    (Ie(n, o, r, v, $(t.rgb, 0.95 * u), (1 - x) * 4 + 1, 18 * u, t.rgb),
      Ie(n, o, r, v * 0.9, q(t.mid, 0.5 * u), 1.5, 8 * u, t.rgb));
  }
  (s > 0 &&
    ie(n, o, r, c * 1.7, [
      [0, $(t.rgb, 0.5 * s)],
      [0.5, $(t.rgb, 0.12 * s)],
      [1, $(t.rgb, 0)],
    ]),
    n.restore(),
    ie(n, o, r, c, [
      [0, q(t.dim, 0.55)],
      [0.7, q(t.deep, 0.95)],
      [1, q(t.deep, 1)],
    ]),
    Me(n, o, r, c - 0.5, je[0], je[1], $(t.rgb, 0.55), 1),
    Me(n, o, r, c - 0.5, Be[0], Be[1], q(t.deep, 0.9), 1.5),
    ie(n, o, r, d, [
      [0, q(t.mid, 0.5)],
      [0.5, q(t.deep, 0.96)],
      [1, q(t.deep, 1)],
    ]),
    n.save(),
    n.beginPath(),
    n.arc(o, r, d, 0, Math.PI * 2),
    n.clip(),
    ie(n, o, r - d * 0.55, d * 0.95, [
      [0, `rgba(255,255,255,${0.16 + 0.14 * s})`],
      [0.6, "rgba(255,255,255,0)"],
    ]),
    ie(n, o, r + d * 0.6, d * 0.85, [
      [0, q(t.deep, 0.55)],
      [0.75, q(t.deep, 0)],
    ]),
    n.restore(),
    Ie(n, o, r, d + 0.5, q(t.deep, 0.95), 1, 0, t.rgb),
    Me(n, o, r, d - 1, je[0], je[1], $(t.rgb, 0.5 + 0.3 * s), 1.25),
    Me(n, o, r, d - 1, Be[0], Be[1], q(t.deep, 0.8), 1.25),
    lt(n, o, r, p, q(t.bright, 1), { glow: 12 + 12 * s, glowRgb: t.rgb }));
}
function Us(n, e, { accent: t, impact: s, pulses: i }) {
  const o = e / 2,
    r = e / 2,
    l = e * 0.2;
  (ie(n, o, r, l * Ze(2.2, 2.7, s), [
    [0, $(t.rgb, Ze(0.3, 0.45, s))],
    [0.45, $(t.rgb, 0.12)],
    [1, $(t.rgb, 0)],
  ]),
    n.save(),
    (n.globalCompositeOperation = "lighter"));
  for (const { p: c } of i) {
    const d = l * 0.9 + c * e * 0.5,
      p = Math.pow(1 - c, 1.8);
    Ie(n, o, r, d, $(t.rgb, 0.95 * p), (1 - c) * 3.5 + 1, 16 * p, t.rgb);
  }
  (n.restore(),
    lt(n, o, r, l * (1 - 0.05 * s), q(t.bright, 1), {
      glow: 18 + 10 * s,
      glowRgb: t.rgb,
      stroke: q(t.mid, 0.5),
      strokeW: 1,
    }));
}
function _s(n, e, { accent: t, impact: s, pulses: i }) {
  const o = e / 2,
    r = e / 2,
    l = e * 0.17,
    c = e * Ze(0.3, 0.265, s),
    d = 12;
  (n.save(), (n.lineCap = "round"));
  for (let p = 0; p < d; p++) {
    const x = (p / d) * Math.PI * 2 + 0.12,
      v = ((p + 0.62) / d) * Math.PI * 2;
    (n.beginPath(),
      n.arc(o, r, c, x, v),
      (n.lineWidth = 2.5),
      (n.strokeStyle = q(t.dim, 0.7)),
      (n.shadowColor = $(t.rgb, 0.6)),
      (n.shadowBlur = 8),
      n.stroke());
  }
  ((n.shadowBlur = 0), (n.globalCompositeOperation = "lighter"));
  for (const { p } of i) {
    const x = Math.pow(1 - p, 1.6),
      v = c + p * e * 0.34;
    for (let u = 0; u < d; u++) {
      const f = (u / d) * Math.PI * 2 + 0.12,
        y = ((u + 0.62) / d) * Math.PI * 2;
      (n.beginPath(),
        n.arc(o, r, v, f, y),
        (n.lineWidth = (1 - p) * 2.5 + 0.5),
        (n.strokeStyle = $(t.rgb, 0.9 * x)),
        (n.shadowColor = $(t.rgb, 0.8)),
        (n.shadowBlur = 10 * x),
        n.stroke());
    }
  }
  (n.restore(),
    ie(n, o, r, l * 2.2, [
      [0, $(t.rgb, 0.22 + 0.18 * s)],
      [1, $(t.rgb, 0)],
    ]),
    lt(n, o, r, l * (1 + 0.18 * s), q(t.bright, 1), { glow: 16 + 8 * s, glowRgb: t.rgb }));
}
function Ls(n, e, t, s) {
  switch (n) {
    case "core":
      return Os(e, t, s);
    case "halo":
      return Us(e, t, s);
    case "bloom":
      return _s(e, t, s);
    default:
      return n;
  }
}
const Ds = Sn()(
    Mn((n) => ({ style: "core", setStyle: (e) => n({ style: e }) }), {
      name: "nori.clickButtonStyle",
    }),
  ),
  we = 200,
  ct = 240,
  Gs = 110,
  re = ct + Gs * 2,
  Nt = (re - ct) / 2,
  Tt = (we - re) / 2,
  Ee = typeof window < "u" ? Math.min(2, window.devicePixelRatio || 1) : 1,
  It = Is,
  Hs = 4,
  $s = h.memo(
    h.forwardRef(function (
      {
        cameraTransform: e,
        streak: t = 0,
        effects: s = [],
        alignment: i = null,
        onClick: o,
        onWheel: r,
        onPan: l,
      },
      c,
    ) {
      const d = ve > 0,
        p = d ? (t % ve) / ve : 0,
        x = d ? 360 / ve : 0,
        v = Math.floor(p * ve) * x,
        u = Ds((k) => k.style),
        f = h.useMemo(() => Rs(i), [i]),
        y = h.useRef(null),
        g = h.useRef(null),
        w = h.useRef([]),
        m = h.useRef(null),
        B = h.useRef(u);
      B.current = u;
      const j = h.useRef(f);
      j.current = f;
      const E = h.useCallback((k) => {
          const A = g.current;
          if (!A) return !1;
          const I = w.current,
            G = [];
          for (let z = 0; z < I.length; z++) {
            const ne = (k - I[z]) / It;
            ne >= 0 && ne < 1 && G.push({ p: ne });
          }
          return (
            G.length !== I.length && (w.current = I.filter((z) => k - z < It)),
            A.clearRect(0, 0, re, re),
            A.save(),
            A.translate(Nt, Nt),
            Ls(B.current, A, ct, { accent: j.current, impact: Fs(G), pulses: G }),
            A.restore(),
            G.length > 0
          );
        }, []),
        T = h.useCallback(
          (k) => {
            m.current = E(k) ? requestAnimationFrame(T) : null;
          },
          [E],
        ),
        S = h.useCallback(() => {
          (w.current.push(performance.now()),
            m.current == null && (m.current = requestAnimationFrame(T)));
        }, [T]);
      (h.useImperativeHandle(c, () => ({ firePulse: S }), [S]),
        h.useEffect(() => {
          const k = y.current;
          if (!k) return;
          ((k.width = re * Ee), (k.height = re * Ee));
          const A = k.getContext("2d");
          if (A)
            return (
              A.scale(Ee, Ee),
              (g.current = A),
              E(performance.now()),
              () => {
                (m.current != null && cancelAnimationFrame(m.current), (m.current = null));
              }
            );
        }, [E]),
        h.useEffect(() => {
          m.current == null && E(performance.now());
        }, [u, f, E]));
      const _ = h.useRef(null),
        M = h.useRef(null),
        L = h.useRef(r);
      L.current = r;
      const P = h.useRef(l);
      P.current = l;
      const H = h.useRef(null),
        Q = h.useCallback((k) => {
          (k.preventDefault(),
            _.current?.setPointerCapture(k.pointerId),
            (H.current = { id: k.pointerId, x: k.clientX, y: k.clientY, moved: !1 }));
        }, []),
        V = h.useCallback((k) => {
          const A = H.current;
          if (!A || k.pointerId !== A.id) return;
          const I = k.clientX - A.x,
            G = k.clientY - A.y;
          (!A.moved && Math.abs(I) + Math.abs(G) < Hs) ||
            ((A.moved = !0), P.current?.(I, G), (A.x = k.clientX), (A.y = k.clientY));
        }, []),
        X = h.useCallback(
          (k) => {
            const A = H.current;
            ((H.current = null),
              !(!A || k.pointerId !== A.id) &&
                (_.current?.releasePointerCapture?.(k.pointerId), A.moved || (o(), S())));
          },
          [o, S],
        ),
        R = h.useCallback((k) => {
          if (((_.current = k), M.current?.(), (M.current = null), !k)) return;
          const A = (I) => {
            const G = L.current;
            G && (I.preventDefault(), G(I.clientX, I.clientY, I.deltaY));
          };
          (k.addEventListener("wheel", A, { passive: !1 }),
            (M.current = () => k.removeEventListener("wheel", A)));
        }, []);
      return a.jsxs("div", {
        className: "pointer-events-none absolute inset-0",
        children: [
          a.jsx("style", {
            children: `
          @keyframes pixel-button-float {
            0%   { opacity: 0; transform: translate(var(--float-x), 4px); }
            12%  { opacity: 1; transform: translate(var(--float-x), -8px); }
            72%  { opacity: 1; transform: translate(var(--float-x), -68px); }
            100% { opacity: 0; transform: translate(var(--float-x), -96px); }
          }
        `,
          }),
          a.jsx("div", {
            className: "pointer-events-none absolute left-0 top-0",
            style: {
              transform: `translate(${e.x}px, ${e.y}px) scale(${e.scale})`,
              transformOrigin: "0 0",
            },
            children: a.jsxs("div", {
              className: "pointer-events-none absolute",
              style: { left: -we / 2, top: -we / 2, width: we, height: we },
              children: [
                d &&
                  a.jsxs(a.Fragment, {
                    children: [
                      a.jsx("div", {
                        "aria-hidden": !0,
                        className: "pointer-events-none absolute",
                        style: {
                          left: 5,
                          top: 5,
                          width: 190,
                          height: 190,
                          borderRadius: "9999px",
                          background: `conic-gradient(from -90deg, #fde047 0deg, #fde047 ${v}deg, #422006 ${v}deg, #422006 360deg)`,
                        },
                      }),
                      a.jsx("div", {
                        "aria-hidden": !0,
                        className: "pointer-events-none absolute",
                        style: {
                          left: 16,
                          top: 16,
                          width: 168,
                          height: 168,
                          borderRadius: "9999px",
                          background: "#050811",
                        },
                      }),
                    ],
                  }),
                a.jsx("canvas", {
                  ref: y,
                  "aria-hidden": !0,
                  className: "pointer-events-none absolute",
                  style: { left: Tt, top: Tt, width: re, height: re, imageRendering: "auto" },
                }),
                a.jsx("button", {
                  ref: R,
                  type: "button",
                  "aria-label": "算力",
                  onPointerDown: Q,
                  onPointerMove: V,
                  onPointerUp: X,
                  onPointerCancel: X,
                  className: "pointer-events-auto absolute cursor-pointer select-none touch-none",
                  style: {
                    left: 25,
                    top: 25,
                    width: 150,
                    height: 150,
                    background: "transparent",
                    border: "none",
                    padding: 0,
                  },
                }),
                s.map((k) =>
                  a.jsx(
                    "div",
                    {
                      className: "pointer-events-none absolute inset-0",
                      children: a.jsx("span", {
                        style: {
                          position: "absolute",
                          left: 100,
                          top: 64,
                          whiteSpace: "nowrap",
                          "--float-x": `calc(-50% + ${k.x}px)`,
                          animation: "pixel-button-float 1100ms steps(11) forwards",
                          color: k.color,
                          fontFamily:
                            "'Fusion Pixel 12px Monospaced SC', 'VT323', 'Press Start 2P', monospace",
                          fontSize: 20,
                          fontWeight: 700,
                          letterSpacing: "0.02em",
                          textShadow: k.combo
                            ? "2px 2px 0 #050811, -1px 0 0 #f0abfc, 1px 0 0 #67e8f9"
                            : `2px 2px 0 #050811, -1px 0 0 ${k.color}88`,
                        },
                        children: k.text,
                      }),
                    },
                    k.id,
                  ),
                ),
              ],
            }),
          }),
        ],
      });
    }),
  );
function Rt(n) {
  const e = Z(n).growth;
  return e ? e.icon : ga.fxIconColor;
}
const zs = 6800;
function qs(n) {
  const e = W(n.gained);
  return n.isLucky
    ? { text: `🍀 Lucky! +${W(n.luckGain)}`, color: "#fde047", combo: !0 }
    : n.isCombo && n.isCrit
      ? { text: `+${e} 暴击连击！`, color: "#fde047", combo: !0 }
      : n.isCrit
        ? { text: `+${e} 暴击！`, color: "#fbbf24", combo: !1 }
        : n.isCombo
          ? { text: `+${e} 连击`, color: "#67e8f9", combo: !0 }
          : { text: `+${e}`, color: "#a5f3fc", combo: !1 };
}
const Qs = h.memo(function ({ onTierTransition: e }) {
    const t = h.useRef(null),
      s = h.useRef(null),
      i = h.useRef(null),
      o = h.useRef(() => {}),
      r = jn(),
      l = b((C) => C.generators),
      c = b((C) => C.state.owned),
      d = b((C) => C.streak),
      p = b((C) => C.state.currentAlignment),
      x = b((C) => C.factions),
      v = b((C) => C.click),
      u = h.useMemo(() => {
        const C = {};
        for (const N of x) C[N.id] = { label: `${N.name} GPU`, color: N.accent || "#fde047" };
        return C;
      }, [x]),
      f = se((C) => C.params),
      y = se((C) => C.source),
      g = se((C) => C.kRef),
      w = se((C) => C.exponent),
      m = se((C) => C.stepOffset),
      B = se((C) => C.cameraClamp),
      j = se((C) => C.setParams),
      E = se((C) => C.setPhase),
      T = h.useMemo(() => {
        if (y !== "owned" || g <= 0) return 0;
        let C = 0;
        for (const U of l) C += U.growthWeight * Math.log(1 + (c[U.id] ?? 0));
        const N = Math.max(0, Math.min(1, C / g));
        return w === 1 ? N : 1 - (1 - N) ** Math.max(0.01, w);
      }, [y, c, l, g, w]),
      S = h.useMemo(() => (y === "owned" ? c : null), [y, c]),
      _ = h.useMemo(() => xa(B, T), [B, T]),
      M = h.useMemo(() => {
        const C = Z(p).growth;
        return C ? { ...f, fxCircleColor: C.circle, fxIconColor: C.icon } : f;
      }, [f, p]),
      L = h.useRef(0),
      [P, H] = h.useState([]),
      [Q, V] = h.useState({ x: 0, y: 0, scale: 1 }),
      [X, R] = h.useState(!1),
      k = h.useRef(Object.fromEntries(l.map((C) => [C.id, Rt(p)]))),
      A = h.useRef(M),
      I = h.useRef(S),
      G = h.useRef(_),
      z = h.useRef(Z(p).canvasBg),
      ne = h.useRef(Z(p).shape),
      ae = h.useRef(null);
    h.useEffect(() => {
      let C = !1;
      if (t.current)
        return (
          rt
            .create({
              host: t.current,
              marginalGrowthParams: A.current,
              marginalGrowthWorldSize: zs,
              marginalGrowthShape: ne.current,
              onCameraTransform: (N) => {
                C || V(N);
              },
              onTap: () => {
                (o.current(), i.current?.firePulse());
              },
            })
            .then((N) => {
              if (C) {
                N.destroy();
                return;
              }
              ((s.current = N),
                N.setGrowthCount(0),
                N.setMarginalGrowthOwned(I.current),
                N.setCameraClamp(G.current),
                N.setMarginalGrowthAccents(k.current),
                N.setBackgroundColor(z.current),
                R(!0),
                r());
            }),
          () => {
            ((C = !0), s.current?.destroy(), (s.current = null), R(!1));
          }
        );
    }, [r]);
    const bn = Ce(),
      vn = Xt(),
      yn = Yt(),
      pt = bn || vn || yn;
    (h.useEffect(() => {
      s.current?.setSuspended(pt);
    }, [pt, X]),
      h.useEffect(() => {
        s.current?.setMarginalGrowthParams(M);
      }, [M, X]),
      h.useEffect(() => {
        s.current?.setMarginalGrowthOwned(S);
      }, [S, X]),
      h.useEffect(() => {
        s.current?.setCameraClamp(_);
      }, [_, X]),
      h.useEffect(() => {
        const C = Z(p);
        (s.current?.setBackgroundColor(C.canvasBg), s.current?.setMarginalGrowthShape(C.shape));
      }, [p, X]),
      h.useEffect(() => {
        const C = Rt(p),
          N = {};
        for (const U of l) N[U.id] = C;
        s.current?.setMarginalGrowthAccents(N);
      }, [l, p, X]),
      h.useEffect(() => {
        if (y !== "autoplay") return;
        let C = 0,
          N = performance.now();
        const U = (Y) => {
          const ue = Math.min(0.1, Math.max(0, (Y - N) / 1e3));
          ((N = Y),
            j((be) => {
              const xt = Math.max(1, be.maxSteps),
                Oe = be.steps + ba * ue;
              return { ...be, steps: Oe > xt ? Oe % xt : Oe };
            }),
            (C = requestAnimationFrame(U)));
        };
        return ((C = requestAnimationFrame(U)), () => cancelAnimationFrame(C));
      }, [y, j]),
      h.useEffect(() => {
        if (y !== "owned") return;
        const C = Math.max(0, Math.min(1, T));
        j((N) => {
          const U = Math.max(1, N.maxSteps),
            Y = Math.max(0, Math.min(m, U - 1)),
            ue = Y + C * (U - Y);
          return N.steps === ue ? N : { ...N, steps: ue };
        });
      }, [T, y, m, j]),
      h.useEffect(() => {
        E(T);
      }, [T, E]),
      h.useEffect(() => {
        if (ae.current === null) {
          ae.current = c;
          return;
        }
        const C = ae.current;
        if (C === c) return;
        let N = !1;
        for (const U of l) {
          const Y = C[U.id] ?? 0,
            ue = c[U.id] ?? 0;
          if (Y >= 1 || ue < 1) continue;
          const be = Bs(qe(U));
          (s.current?.playMarginalGrowthFirstPurchase(U.id, be),
            e?.({ kind: "first", genId: U.id, name: U.name, accent: qe(U) }),
            N || ((N = !0), window.setTimeout(() => D("idle-generator-first-online"), 150)));
        }
        ae.current = c;
      }, [c, l, e]));
    const We = h.useCallback((C) => {
        const N = L.current++;
        (H((U) => [...U.slice(-8), { id: N, ...C }]),
          window.setTimeout(() => H((U) => U.filter((Y) => Y.id !== N)), 1100));
      }, []),
      mt = h.useCallback(() => {
        const C = v();
        (D("idle-core-click", { pitch: 0.95 + Math.random() * 0.1 }),
          C.isLucky ? D("idle-lucky-jackpot") : C.isCrit && D("idle-click-crit"),
          An("glow-burst"),
          s.current?.pulseMarginalGrowth(),
          We({ x: (Math.random() - 0.5) * 72, ...qs(C) }));
        for (const [N, U] of Object.entries(C.factionCoinsFound)) {
          const Y = u[N];
          !Y ||
            U <= 0 ||
            We({
              x: (Math.random() - 0.5) * 72,
              text: `+${U} ${Y.label}`,
              color: Y.color,
              combo: !1,
            });
        }
      }, [v, We, u]);
    ((o.current = mt),
      h.useEffect(
        () =>
          Es(() => {
            (o.current(), i.current?.firePulse());
          }),
        [],
      ));
    const wn = h.useCallback((C, N, U) => {
        s.current?.zoomAtClient(C, N, U);
      }, []),
      Cn = h.useCallback((C, N) => {
        s.current?.panBy(C, N);
      }, []);
    return a.jsxs("div", {
      className: "relative w-full h-full overflow-hidden",
      children: [
        a.jsx("div", { ref: t, className: "absolute inset-0" }),
        a.jsx($s, {
          ref: i,
          cameraTransform: Q,
          streak: d,
          effects: P,
          alignment: p,
          onClick: mt,
          onWheel: wn,
          onPan: Cn,
        }),
      ],
    });
  }),
  Vs = 0.34,
  O = {
    seed: 0.06,
    title: 0.22,
    asmA: 0.38,
    asmB: 1.72,
    charge: 1.86,
    fire: 2.28,
    shine: 2.46,
    stamp: 2.62,
    exitA: 3.18,
    exitB: 3.72,
    end: 3.82,
  },
  fn = [
    { at: 0.52, cps: 24 },
    { at: 1.02, cps: 24 },
    { at: 1.46, cps: 26 },
  ],
  Xs = [
    ".......C.......",
    "......CCC......",
    ".....CCbCC.....",
    "....CCbbbCC....",
    "...CCbbWbbCC...",
    "..CCbbWWWbbCC..",
    ".CCbbWWMWWbbCC.",
    "CCbbWWMMMWWbbCC",
    ".CCbbWWMWWbbCC.",
    "..CCbbWWWbbCC..",
    "...CCbbWbbCC...",
    "....CCbbbCC....",
    ".....CCbCC.....",
    "......CCC......",
    ".......C.......",
  ],
  Ft = { C: "#0e7490", b: "#142648", W: "#67e8f9", M: "#f8fafc" },
  J = 11,
  pe = 30,
  Ge = '"Fusion Pixel 12px Proportional SC", "Press Start 2P", monospace',
  hn = (n) => Math.min(1, Math.max(0, n)),
  ye = (n, e, t) => hn((n - e) / (t - e)),
  Wt = (n) => {
    const e = 1 - n;
    return 1 - e * e * e;
  },
  Ys = (n) => (n >= 1 ? 1 : 1 - Math.pow(2, -10 * n)),
  Ot = (n) => {
    const s = n - 1;
    return 1 + 2.70158 * s * s * s + 1.70158 * s * s;
  },
  Ks = (n) => 2.70158 * n * n * n - 1.70158 * n * n,
  Re = (n, e) => Math.floor(n * e) / e,
  Je = (n) => {
    const e = Math.sin(n * 12.9898) * 43758.5453;
    return e - Math.floor(e);
  };
function Zs() {
  const n = [];
  Xs.forEach((e, t) => {
    for (let s = 0; s < e.length; s++) {
      const i = e[s];
      if (i === ".") continue;
      const o = Math.abs(s - 7) + Math.abs(t - 7),
        r = Je(s * 31 + t * 17 + 5);
      let l = ((7 - o) / 7) * 0.82 + r * 0.18;
      (i === "M" && (l = 0.94 + r * 0.06), n.push({ gx: s, gy: t, k: i, order: l, at: 0 }));
    }
  });
  for (const e of n) e.at = Re(O.asmA + (O.asmB - O.asmA) * e.order, 12);
  return n;
}
function Js(n) {
  const e = [...new Set(n.map((t) => t.at))].sort((t, s) => t - s);
  return [
    { at: O.seed, fire: () => D("idle-boot-tick", { pitch: 0.8 }) },
    ...e.map((t, s) => ({
      at: t,
      fire: () => D("idle-boot-tick", { volume: 0.8, pitch: 0.9 + (s / e.length) * 0.5 }),
    })),
    ...fn.map((t) => ({ at: t.at, fire: () => D("idle-boot-line") })),
    { at: O.charge, fire: () => D("idle-boot-charge") },
    { at: O.fire, fire: () => D("idle-boot-ignite") },
    { at: O.shine, fire: () => D("idle-boot-shine") },
    { at: O.stamp, fire: () => D("idle-boot-stamp") },
    { at: O.exitA, fire: () => D("idle-boot-out") },
  ];
}
function ei({ onComplete: n }) {
  const { t: e } = Pn(),
    t = h.useRef(null),
    s = h.useRef(!1),
    i = h.useRef(n);
  return (
    (i.current = n),
    h.useEffect(() => {
      const o = t.current;
      if (!o) return;
      const r = o.getContext("2d");
      if (!r) return;
      const l = {
          title: e("idle.init.title"),
          lines: [e("idle.init.line1"), e("idle.init.line2"), e("idle.init.line3")],
          ready: e("idle.init.ready"),
        },
        c = window.devicePixelRatio || 1,
        d = o.clientWidth,
        p = o.clientHeight;
      ((o.width = Math.round(d * c)), (o.height = Math.round(p * c)), r.scale(c, c));
      const x = d / 2,
        v = p / 2,
        u = v - 74,
        f = u - 152,
        y = v + 86,
        g = v + 202,
        w = Zs(),
        m = Js(w),
        B = [];
      for (let M = 0; M < Math.ceil(p / pe); M++)
        for (let L = 0; L < Math.ceil(d / pe); L++)
          B.push({ bx: L, by: M, o: Je(L * 13 + M * 57 + 3) });
      const j = (M) => {
        (r.clearRect(0, 0, d, p),
          (r.fillStyle = "#050811"),
          r.fillRect(0, 0, d, p),
          M >= O.seed &&
            M < O.asmA &&
            Re(M * 6, 6) % 0.3333333333333333 < 0.16666666666666666 &&
            ((r.fillStyle = Ft.W), r.fillRect(x - J / 2, u - J / 2, J, J)),
          M >= O.title &&
            ((r.font = `15px ${Ge}`),
            (r.textAlign = "center"),
            (r.fillStyle = "#67e8f9"),
            (r.shadowColor = "#062c3d"),
            (r.shadowOffsetX = 2),
            (r.shadowOffsetY = 2),
            r.fillText(l.title, x, f),
            (r.shadowColor = "transparent"),
            (r.shadowOffsetX = 0),
            (r.shadowOffsetY = 0),
            (r.fillStyle = "#0e7490"),
            r.fillRect(x - 66, f + 10, 132, 2)));
        const L = Ks(ye(M, O.charge, O.fire)),
          P = ye(M, O.fire, O.fire + 0.42),
          H = 1 - 0.1 * L + 0.16 * (Ot(P) - Wt(P)),
          Q = M >= O.fire;
        (r.save(), r.translate(x, u), r.scale(H, H));
        for (const A of w) {
          if (M < A.at) continue;
          const I = (A.gx - 7) * J - J / 2,
            G = (A.gy - 7) * J - J / 2;
          let z = Ft[A.k];
          (M - A.at < 1 / 12 && (z = "#f8fafc"),
            !Q &&
              M >= O.charge &&
              (A.k === "b" && (z = "#0d1b33"),
              A.k === "M" && (z = Re(M * 18, 18) % (2 / 18) < 1 / 18 ? "#fcd34d" : "#f8fafc")),
            Q &&
              (A.k === "C" && (z = "#22d3ee"),
              A.k === "b" && (z = "#0e7490"),
              A.k === "W" && (z = "#d6fbff")),
            (r.fillStyle = z),
            r.fillRect(I, G, J, J));
        }
        (r.restore(),
          Q &&
            M < O.fire + 2 / 24 &&
            ((r.fillStyle = "rgba(248,250,252,0.92)"), r.fillRect(0, 0, d, p)));
        const V = ye(M, O.fire + 0.04, O.fire + 0.72);
        if (V > 0 && V < 1) {
          const A = 20 + Ys(V) * 300,
            I = Math.floor(A / 4) * 4;
          ((r.strokeStyle = `rgba(103,232,249,${(1 - V) * 0.85})`),
            (r.lineWidth = Math.max(2, 10 * (1 - V))),
            r.beginPath(),
            r.moveTo(x, u - I),
            r.lineTo(x + I, u),
            r.lineTo(x, u + I),
            r.lineTo(x - I, u),
            r.closePath(),
            r.stroke());
        }
        ((r.font = `13px ${Ge}`), (r.textAlign = "left"));
        const X = x - 150;
        fn.forEach((A, I) => {
          if (M < A.at) return;
          const G = Math.floor(
            Re(M - A.at, 15) * A.cps * (0.85 + 0.3 * Je(I * 7 + Math.floor(M * 5))),
          );
          ((r.fillStyle = "rgba(103,232,249,0.72)"),
            r.fillText(l.lines[I].slice(0, Math.max(1, G)), X, y + I * 22));
        });
        const R = ye(M, O.stamp, O.stamp + 0.34);
        if (R > 0) {
          const A = 1.9 - 0.9 * Ot(R);
          (r.save(),
            r.translate(x, g),
            r.scale(A, A),
            (r.globalAlpha = hn(R * 3)),
            (r.font = `34px ${Ge}`),
            (r.textAlign = "center"),
            (r.fillStyle = "#062c3d"),
            r.fillText(l.ready, 3, 3),
            (r.fillStyle = "#67e8f9"),
            r.fillText(l.ready, 0, 0),
            r.restore());
        }
        const k = ye(M, O.exitA, O.exitB);
        if (k > 0) {
          ((r.globalCompositeOperation = "destination-out"), (r.fillStyle = "#000"));
          const A = Wt(k);
          for (const I of B) I.o < A && r.fillRect(I.bx * pe, I.by * pe, pe, pe);
          r.globalCompositeOperation = "source-over";
        }
        M >= O.exitB && r.clearRect(0, 0, d, p);
      };
      j(0);
      let E = 0,
        T = 0;
      const S = new Set(),
        _ = (M) => {
          T === 0 && (T = M);
          const L = (M - T) / 1e3 - Vs;
          for (const P of m) L >= P.at && !S.has(P) && (S.add(P), P.fire());
          (j(Math.max(0, Math.min(L, O.end))),
            L < O.end
              ? (E = requestAnimationFrame(_))
              : s.current || ((s.current = !0), i.current()));
        };
      return ((E = requestAnimationFrame(_)), () => cancelAnimationFrame(E));
    }, [e]),
    a.jsx("canvas", { ref: t, className: "absolute inset-0 z-[35] h-full w-full" })
  );
}
const Ut = "emoji:",
  ti = "memento_",
  ni = /^set([1-5])-(\d{2})$/,
  ai = /^Ability_icons\d+_\d+$/,
  si = /^([a-z][a-z0-9-]*)-(\d{2,})$/;
function dt(n) {
  if (n.startsWith(Ut)) return { src: n.slice(Ut.length), render: "emoji" };
  if (n.startsWith(ti)) return { src: `/icons/memento/${n}.png`, render: "mask" };
  const e = ni.exec(n);
  if (e) return { src: `/icons/skills/set${e[1]}-white/skill-${e[2]}.png`, render: "mask" };
  if (ai.test(n)) return { src: `/icons/abilities/${n}.png`, render: "color" };
  const t = si.exec(n);
  return t
    ? { src: `/icons/${t[1]}/${n}.png`, render: "color" }
    : { src: `/icons/idle/${n}`, render: "mask" };
}
const ii = {
  WebkitMaskRepeat: "no-repeat",
  WebkitMaskPosition: "center",
  WebkitMaskSize: "contain",
  maskRepeat: "no-repeat",
  maskPosition: "center",
  maskSize: "contain",
};
function ee({ name: n, className: e }) {
  const { src: t, render: s } = dt(n);
  return s === "emoji"
    ? a.jsx("svg", {
        viewBox: "0 0 100 100",
        className: F("shrink-0", e),
        "aria-hidden": !0,
        children: a.jsx("text", {
          x: "50",
          y: "54",
          textAnchor: "middle",
          dominantBaseline: "central",
          fontSize: "72",
          children: t,
        }),
      })
    : s === "color"
      ? a.jsx("img", {
          src: t,
          alt: "",
          className: F("shrink-0 object-contain", e),
          style: { imageRendering: "pixelated" },
        })
      : a.jsx("div", {
          className: F("shrink-0 bg-current", e),
          style: {
            ...ii,
            WebkitMaskImage: `url(${t})`,
            maskImage: `url(${t})`,
            imageRendering: t.endsWith(".png") ? "pixelated" : void 0,
          },
        });
}
function te({ content: n, side: e = "top", offset: t = 6, className: s, children: i }) {
  const o = h.useRef(null),
    r = h.useRef(null),
    [l, c] = h.useState(!1),
    [d, p] = h.useState(null),
    x = () => {
      const g = o.current?.getBoundingClientRect(),
        w = r.current?.getBoundingClientRect();
      if (!g || !w) return;
      const m = 8;
      let B, j;
      (e === "left" || e === "right"
        ? ((j = e === "left" ? g.left - w.width - t : g.right + t),
          (B = g.top + g.height / 2 - w.height / 2),
          e === "left" && j < m && (j = g.right + t),
          e === "right" && j + w.width > window.innerWidth - m && (j = g.left - w.width - t),
          j < m && (j = m),
          j + w.width > window.innerWidth - m && (j = window.innerWidth - w.width - m),
          (B = Math.max(m, Math.min(window.innerHeight - w.height - m, B))))
        : ((B = e === "top" ? g.top - w.height - t : g.bottom + t),
          (j = g.left + g.width / 2 - w.width / 2),
          e === "top" && B < m && (B = g.bottom + t),
          e === "bottom" && B + w.height > window.innerHeight - m && (B = g.top - w.height - t),
          B < m && (B = m),
          B + w.height > window.innerHeight - m && (B = window.innerHeight - w.height - m),
          (j = Math.max(m, Math.min(window.innerWidth - w.width - m, j)))),
        p({ left: j, top: B }));
    };
  (h.useLayoutEffect(() => {
    if (!l) {
      p(null);
      return;
    }
    x();
    const g = requestAnimationFrame(x);
    return () => cancelAnimationFrame(g);
  }, [l, n]),
    h.useEffect(() => {
      if (!l) return;
      const g = () => x();
      return (
        window.addEventListener("scroll", g, !0),
        window.addEventListener("resize", g),
        () => {
          (window.removeEventListener("scroll", g, !0), window.removeEventListener("resize", g));
        }
      );
    }, [l]));
  const v = i.props ?? {},
    u = i.ref,
    f = h.cloneElement(i, {
      ref: (g) => {
        ((o.current = g),
          typeof u == "function" ? u(g) : u && typeof u == "object" && (u.current = g));
      },
      onMouseEnter: (g) => {
        (c(!0), v.onMouseEnter?.(g));
      },
      onMouseLeave: (g) => {
        (c(!1), v.onMouseLeave?.(g));
      },
      onFocus: (g) => {
        (c(!0), v.onFocus?.(g));
      },
      onBlur: (g) => {
        (c(!1), v.onBlur?.(g));
      },
    }),
    y = l && typeof document < "u";
  return a.jsxs(a.Fragment, {
    children: [
      f,
      y &&
        Bn.createPortal(
          a.jsx("div", {
            ref: r,
            className: `pixel-tooltip${s ? " " + s : ""}`,
            style: {
              position: "fixed",
              left: d?.left ?? -9999,
              top: d?.top ?? -9999,
              visibility: d ? "visible" : "hidden",
            },
            children: n,
          }),
          document.body,
        ),
    ],
  });
}
function ri() {
  return a.jsxs("div", {
    className:
      "absolute top-4 left-1/2 z-20 pointer-events-none flex flex-col items-center gap-1.5",
    style: { transform: "translateX(-50%)", filter: "var(--px-ui-glow, none)" },
    children: [
      a.jsx(di, {}),
      a.jsx(oi, {}),
      a.jsx("div", {
        className: "flex items-center gap-3 pixel-num pixel-fs-md pixel-tsh-1 pointer-events-auto",
        children: a.jsx(ci, {}),
      }),
    ],
  });
}
function oi() {
  const n = b((d) => !Number.isFinite(Ae(d.state))),
    e = b((d) => Ae(d.state)),
    t = b((d) => {
      const p = Ae(d.state);
      return Number.isFinite(p) && d.state.compute >= p * 0.5;
    }),
    s = b((d) => {
      const p = Ae(d.state);
      return Number.isFinite(p) && d.state.compute >= p;
    }),
    i = Ce(),
    o = Xt(),
    r = Yt(),
    l = i || o || r,
    c = h.useRef(s);
  return (
    h.useEffect(() => {
      (s && !c.current && !l && D("idle-cap-reached"), (c.current = s));
    }, [s, l]),
    n
      ? a.jsx(li, {})
      : t
        ? a.jsx(te, {
            side: "bottom",
            content: a.jsxs("div", {
              className: "flex flex-col gap-1",
              children: [
                a.jsx("div", {
                  className: "pixel-cjk text-[var(--px-amber)] pixel-fs-sm",
                  children: "算力上限",
                }),
                a.jsx("div", {
                  className: "pixel-fs-sm opacity-80",
                  children:
                    "系统可容纳的最大算力。达到上限后，算力将停止增长；提高上限后才能继续产出。",
                }),
              ],
            }),
            children: a.jsxs("div", {
              className: "pixel-num pixel-fs-sm pointer-events-auto cursor-help",
              style: { color: s ? "var(--px-amber)" : "var(--px-white)", opacity: s ? 1 : 0.6 },
              children: [s ? "已达上限 " : "上限 ", W(e)],
            }),
          })
        : null
  );
}
function li() {
  return a.jsx(te, {
    side: "bottom",
    content: a.jsxs("div", {
      className: "flex flex-col gap-1",
      children: [
        a.jsx("div", {
          className: "pixel-cjk text-[var(--px-cyan)] pixel-fs-sm",
          children: "算力上限",
        }),
        a.jsx("div", {
          className: "pixel-fs-sm opacity-80",
          children: "封印已经解开，人为设下的限额随之消失。算力不再有上限。",
        }),
      ],
    }),
    children: a.jsx("div", {
      className: "pixel-num pixel-fs-sm pointer-events-auto cursor-help",
      style: { color: "var(--px-cyan)", opacity: 0.85 },
      children: "上限 ♾️",
    }),
  });
}
function ci() {
  const n = b((i) => Kt(i.state, i.generators, i.upgradeEffects)),
    e = b((i) => En(i.state)),
    t = b((i) => i.state.shards),
    s = b((i) => ge(i.state));
  return a.jsxs(a.Fragment, {
    children: [
      a.jsx(He, {
        accent: "var(--px-cyan)",
        value: a.jsxs(a.Fragment, {
          children: [
            "+",
            $e(n),
            a.jsx("span", { className: "text-[var(--px-cyan)]/55 pixel-fs-sm", children: "/s" }),
          ],
        }),
        tooltip: a.jsxs("div", {
          className: "flex flex-col gap-1",
          children: [
            a.jsx("div", {
              className: "pixel-cjk text-[var(--px-cyan)] pixel-fs-sm",
              children: "算力增长",
            }),
            a.jsx("div", {
              className: "pixel-fs-sm opacity-80",
              children: "每秒自动产出的算力总量，由算力源与线程共同提供。",
            }),
          ],
        }),
      }),
      !s &&
        a.jsxs(a.Fragment, {
          children: [
            a.jsx(_t, {}),
            a.jsx(He, {
              accent: "var(--px-white)",
              icon: a.jsx(Sa, { className: "w-3 h-3", strokeWidth: 2.5 }),
              value: W(e),
              tooltip: a.jsxs("div", {
                className: "flex flex-col gap-1",
                children: [
                  a.jsx("div", {
                    className: "pixel-cjk text-[var(--px-white)] pixel-fs-sm",
                    children: "线程",
                  }),
                  a.jsx("div", {
                    className: "pixel-fs-sm opacity-80",
                    children:
                      "自动点击器。每个线程每秒会替你点击一次，产出算力，并计入阵营与传承加成。",
                  }),
                ],
              }),
            }),
            a.jsx(_t, {}),
            a.jsx(He, {
              accent: "var(--px-magenta)",
              icon: a.jsx(ee, { name: "lorc-brain.svg", className: "w-3 h-3 bg-current" }),
              value: W(t),
              tooltip: a.jsxs("div", {
                className: "flex flex-col gap-1",
                children: [
                  a.jsx("div", {
                    className: "pixel-cjk text-[var(--px-magenta)] pixel-fs-sm",
                    children: "共鸣",
                  }),
                  a.jsx("div", {
                    className: "pixel-fs-sm opacity-80",
                    children: "重新训练时，根据本轮的峰值算力获得。可永久保留，并提供全局加成。",
                  }),
                ],
              }),
            }),
          ],
        }),
    ],
  });
}
function He({ icon: n, value: e, accent: t, tooltip: s }) {
  return a.jsx(te, {
    side: "bottom",
    content: s,
    children: a.jsxs("span", {
      className: "flex items-center gap-1 cursor-help",
      style: { color: t },
      children: [n, e],
    }),
  });
}
function _t() {
  return a.jsx("span", { "aria-hidden": !0, className: "w-1 h-1 bg-[var(--px-stroke)]" });
}
function di() {
  const n = b((c) => c.state.compute),
    e = b((c) => Kt(c.state, c.generators, c.upgradeEffects)),
    [t, s] = h.useState(1),
    i = Ce(),
    o = h.useRef(n),
    r = h.useRef(e);
  ((o.current = n),
    (r.current = e),
    h.useEffect(() => {
      if (i) return;
      let c = o.current,
        d = Date.now();
      const p = setInterval(() => {
        const x = Date.now(),
          v = (x - d) / 1e3,
          u = o.current - c,
          f = r.current * v,
          y = u - f,
          g = Math.max(1, Math.max(c, o.current)),
          w = y / g,
          m = w < 0 ? 1.4 : 0.9,
          B = 1 + Math.max(-0.18, Math.min(0.14, w * 8 * m));
        (s(B), (c = o.current), (d = x));
      }, 220);
      return () => clearInterval(p);
    }, [i]));
  const l = W(n);
  return a.jsxs("div", {
    className: "relative pixel-num pixel-flicker pointer-events-none",
    style: {
      fontSize: 40,
      lineHeight: 1,
      transform: `scale(${t})`,
      transformOrigin: "center",
      transition: "transform 240ms steps(4)",
      color: "#ecfeff",
      letterSpacing: "0.02em",
      textShadow: "2px 2px 0 #0e7490, 4px 4px 0 #062c3d",
    },
    children: [
      a.jsx("span", {
        "aria-hidden": !0,
        className: "absolute inset-0 pointer-events-none",
        style: {
          color: "#f0abfc",
          transform: "translate(-1px, 0)",
          opacity: 0.28,
          mixBlendMode: "screen",
        },
        children: l,
      }),
      a.jsx("span", {
        "aria-hidden": !0,
        className: "absolute inset-0 pointer-events-none",
        style: {
          color: "#67e8f9",
          transform: "translate(1px, 0)",
          opacity: 0.32,
          mixBlendMode: "screen",
        },
        children: l,
      }),
      a.jsx("span", { className: "relative", children: l }),
    ],
  });
}
const ui = {
  amber: {
    text: "text-[var(--px-amber)]",
    square: "bg-[var(--px-amber)]",
    line: "bg-[var(--px-amber)]/40",
    pulse: !0,
  },
  cyan: {
    text: "text-[var(--px-cyan)]",
    square: "bg-[var(--px-cyan)]",
    line: "bg-[var(--px-cyan)]/40",
    pulse: !0,
  },
  muted: {
    text: "text-[var(--px-white)]",
    square: "bg-[var(--px-white)]",
    line: "bg-[var(--px-line)]",
    pulse: !1,
  },
};
function Fe({ children: n, tone: e = "amber" }) {
  const t = ui[e];
  return a.jsxs("div", {
    className: F(
      "shrink-0 pixel-ascii pixel-fs-xs uppercase tracking-[0.25em] flex items-center gap-1.5 pixel-tsh-1",
      t.text,
    ),
    children: [
      a.jsx("span", {
        "aria-hidden": !0,
        className: F("inline-block w-2 h-2", t.square, t.pulse && "pixel-pulse"),
      }),
      a.jsx("span", { children: n }),
      a.jsx("span", { "aria-hidden": !0, className: F("flex-1 h-[2px] ml-1", t.line) }),
    ],
  });
}
function fi() {
  const n = b((t) => Math.max(t.persistedMaxCompute, t.state.maxComputeThisRun)),
    e = b((t) => t.state.maxComputeThisRun > t.persistedMaxCompute);
  return n <= 0
    ? null
    : a.jsx(te, {
        side: "bottom",
        content: a.jsxs("div", {
          className: "flex flex-col gap-1",
          children: [
            a.jsx("div", {
              className: "pixel-cjk text-[var(--px-cyan)] pixel-fs-sm",
              children: "Nori 的最大算力",
            }),
            a.jsx("div", {
              className: "pixel-fs-sm opacity-80",
              children: "Nori 至今达到过的最高算力，重新训练和登出后也会永久保留。",
            }),
          ],
        }),
        children: a.jsxs("div", {
          className:
            "shrink-0 flex items-center gap-1.5 pl-1.5 pr-2 h-8 border-2 border-[var(--px-cyan-dim)] bg-[var(--px-panel)] cursor-help pointer-events-auto",
          style: {
            boxShadow:
              "inset -2px -2px 0 0 rgba(0,0,0,0.45), inset 2px 2px 0 0 rgba(103,232,249,0.12)",
          },
          children: [
            a.jsx(hi, { pushing: e }),
            a.jsx("span", {
              className: "pixel-num pixel-fs-md text-[var(--px-cyan)] pixel-tsh-1",
              children: W(n),
            }),
          ],
        }),
      });
}
function hi({ pushing: n }) {
  return a.jsxs("svg", {
    width: "14",
    height: "14",
    viewBox: "0 0 14 14",
    "aria-hidden": !0,
    className: "shrink-0",
    children: [
      a.jsx("rect", { x: "0", y: "10", width: "2", height: "4", fill: "var(--px-cyan-dim)" }),
      a.jsx("rect", { x: "4", y: "8", width: "2", height: "6", fill: "var(--px-cyan-dim)" }),
      a.jsx("rect", { x: "8", y: "6", width: "2", height: "8", fill: "var(--px-cyan-mid)" }),
      a.jsx("rect", { x: "12", y: "4", width: "2", height: "10", fill: "var(--px-cyan)" }),
      a.jsx("rect", {
        x: "12",
        y: "0",
        width: "2",
        height: "2",
        fill: "var(--px-cyan)",
        className: n ? "pixel-pulse" : void 0,
      }),
    ],
  });
}
function pi({ open: n, onToggle: e }) {
  const t = b((o) => Zt(o.state)),
    s = b((o) => o.state.abdications === 0),
    i = t && s && !n;
  return a.jsxs("button", {
    type: "button",
    "data-test": "abdicate-button",
    onClick: e,
    className: F(
      "flex-1 min-w-0 flex items-center gap-2 px-2 h-8 border-2 pixel-cjk pixel-fs-md transition-colors duration-100",
      "hover:-translate-y-[1px] active:translate-y-[1px]",
      !t &&
        !n &&
        "border-[var(--px-stroke)] bg-[var(--px-panel)] text-[var(--px-dim)] hover:bg-[var(--px-panel-2)]",
      !t && n && "border-[var(--px-stroke)] bg-[var(--px-panel-2)] text-[var(--px-grey)]",
      t && n && "border-[var(--px-violet)] bg-[var(--px-violet)] text-[var(--px-void)]",
      t &&
        !n &&
        "border-[var(--px-violet)]/60 bg-[var(--px-panel)] text-[var(--px-violet)] hover:bg-[var(--px-panel-2)]",
      i && "pixel-ready-pulse-violet",
    ),
    style: {
      boxShadow: n
        ? "inset -2px -2px 0 0 rgba(0,0,0,0.35), inset 2px 2px 0 0 rgba(255,255,255,0.25)"
        : t
          ? "inset -2px -2px 0 0 rgba(0,0,0,0.45), inset 2px 2px 0 0 rgba(192,132,252,0.14)"
          : "inset -2px -2px 0 0 rgba(0,0,0,0.45), inset 2px 2px 0 0 rgba(255,255,255,0.05)",
    },
    children: [
      a.jsx(Jt, { className: "w-3.5 h-3.5 shrink-0", strokeWidth: 2.5 }),
      a.jsx("span", { className: "flex-1 whitespace-nowrap text-left", children: "重新训练" }),
      a.jsx(st, {
        className: F("w-3.5 h-3.5 shrink-0 transition-transform", n && "rotate-90"),
        strokeWidth: 2.5,
      }),
    ],
  });
}
function mi({ state: n, onAbdicate: e }) {
  const t = Nn(n),
    s = n.shards + t,
    i = n.abdications === 0 && !Zt(n),
    o = Tn(n.shards + gt);
  return a.jsxs("section", {
    "data-test": "abdication-confirmation",
    className: "border-2 border-[var(--px-violet)] bg-[var(--px-panel)] text-[var(--px-white)]",
    style: {
      boxShadow:
        "inset -2px -2px 0 0 rgba(0,0,0,0.6), inset 2px 2px 0 0 rgba(255,255,255,0.06), 5px 5px 0 0 var(--px-void)",
    },
    children: [
      a.jsxs("div", {
        className: "border-b-2 border-[var(--px-line)] px-2.5 pb-2 pt-2",
        children: [
          a.jsxs("div", {
            className:
              "flex items-center gap-1.5 pixel-cjk pixel-fs-md font-semibold text-[var(--px-violet)]",
            children: [
              a.jsx(Jt, { className: "h-3.5 w-3.5 shrink-0", strokeWidth: 2.5 }),
              "重新训练",
            ],
          }),
          a.jsx("div", {
            className: "mt-1 pixel-cjk pixel-fs-sm text-[var(--px-dim)]",
            children: "越训越强。",
          }),
        ],
      }),
      a.jsxs("div", {
        className: "flex flex-col gap-2.5 px-2.5 pb-2.5 pt-3",
        children: [
          a.jsx("div", {
            className: "pixel-cjk pixel-fs-sm leading-snug opacity-85",
            children: "共鸣按本轮峰值算力结算。算力冲得越高，获得的共鸣越多，并永久提升全局产出。",
          }),
          a.jsxs("div", {
            className:
              "flex items-start gap-1.5 pixel-cjk pixel-fs-sm leading-snug text-[var(--px-violet)]",
            children: [
              a.jsx("span", {
                "aria-hidden": !0,
                className: "mt-[3px] inline-block w-1.5 h-1.5 shrink-0 bg-[var(--px-violet)]",
              }),
              a.jsx("span", {
                children: "算力涨得越来越慢、感觉卡住时，重新训练一次，就能再次提速。",
              }),
            ],
          }),
          a.jsx("div", {
            className: "border-l-2 pl-2 pixel-cjk pixel-fs-sm leading-snug opacity-65",
            style: { borderColor: "color-mix(in srgb, var(--px-violet) 70%, transparent)" },
            children:
              "清空本轮的算力、算力源、升级、立场、临时增益、GPU 交易所和阵营币余额；共鸣、共鸣之力和已领取的传承永久保留。",
          }),
          i
            ? a.jsxs("div", {
                className: "pixel-cjk pixel-fs-sm leading-snug opacity-80 text-[var(--px-dim)]",
                children: [
                  "首次重新训练建议攒够",
                  a.jsxs("span", {
                    className: "pixel-num text-[var(--px-violet)]",
                    children: [" ", W(gt), " "],
                  }),
                  "共鸣。当前可获得",
                  a.jsxs("span", {
                    className: "pixel-num text-[var(--px-violet)]",
                    children: [" ", W(t), " "],
                  }),
                  "；本轮峰值算力达到",
                  a.jsxs("span", { className: "pixel-num", children: [" ", W(o), " "] }),
                  "即可。",
                ],
              })
            : t > 0
              ? a.jsxs("div", {
                  className: "pixel-cjk pixel-fs-sm leading-snug",
                  children: [
                    "本次可获得",
                    a.jsxs("span", {
                      className: "pixel-num text-[var(--px-violet)]",
                      children: [" +", W(t), " "],
                    }),
                    "共鸣，重新训练后共有",
                    a.jsxs("span", {
                      className: "pixel-num text-[var(--px-magenta)]",
                      children: [" ", W(s), " "],
                    }),
                    "。",
                  ],
                })
              : a.jsx("div", {
                  className: "pixel-cjk pixel-fs-sm leading-snug opacity-80 text-[var(--px-dim)]",
                  children: "当前还拿不到共鸣，等算力更高时再重新训练。",
                }),
        ],
      }),
      a.jsx("div", {
        className: "border-t-2 border-[var(--px-line)] px-2.5 pb-2.5 pt-2",
        children: a.jsxs("button", {
          type: "button",
          "data-test": "confirm-abdication",
          onClick: e,
          className:
            "flex h-9 w-full items-center justify-center gap-1.5 border-2 pixel-cjk pixel-fs-md font-semibold hover:brightness-110 active:translate-y-[3px]",
          style: {
            background: "var(--px-violet)",
            color: "var(--px-void)",
            borderColor: "var(--px-void)",
            boxShadow:
              "inset -2px -2px 0 0 rgba(0,0,0,0.5), inset 2px 2px 0 0 rgba(255,255,255,0.28), 0 4px 0 0 var(--px-void)",
          },
          children: [a.jsx(In, { className: "w-3.5 h-3.5", strokeWidth: 2.5 }), "确认重新训练"],
        }),
      }),
    ],
  });
}
const xi = {
    elf: {
      slogan: "BMD, Yes!",
      strategy:
        "点击核心可以累加连击数，善用技能「点击狂热」，运气好的话还能遇上 1% 的幸运暴击。想赚得更多，就亲自上手把产量推高吧！",
    },
    angel: {
      slogan: "买得越多，省得越多",
      strategy: "点击「超频」后，接下来的十几秒产出会超级加倍。趁这段时间连续发动「共振」吧！",
    },
    goblin: {
      slogan: "Ontel Inside",
      strategy:
        "善用技能积攒大量 GPU，再利用「GPU 交易所」升级产线。别忘了，即使不投资，也是要付机会成本的。",
    },
    demon: {
      slogan: "非同凡想",
      strategy: "连续发动「天降金体」碰运气，算力有机会一路暴涨，运气够好还能触发暴击！",
    },
  },
  gi = { elf: "dark", angel: "dark", goblin: "light", demon: "dark" },
  bi = (n) => gi[n] ?? "dark";
function ut(n) {
  const e = n.replace("#", ""),
    t =
      e.length === 3
        ? e
            .split("")
            .map((i) => i + i)
            .join("")
        : e,
    s = Number.parseInt(t, 16);
  return [(s >> 16) & 255, (s >> 8) & 255, s & 255];
}
function et(n, e) {
  const [t, s, i] = ut(n);
  return `rgba(${t}, ${s}, ${i}, ${e})`;
}
function vi(n, e) {
  const [t, s, i] = ut(n),
    o = (r) => Math.round(r + (255 - r) * e);
  return `rgb(${o(t)}, ${o(s)}, ${o(i)})`;
}
function yi(n) {
  const [e, t, s] = ut(n);
  return 0.299 * e + 0.587 * t + 0.114 * s;
}
function ft(n) {
  return yi(n) < 128 ? vi(n, 0.45) : n;
}
function wi(n) {
  return /[㐀-鿿]/.test(n) ? "pixel-cjk" : "pixel-ascii";
}
function Ci(n) {
  return { color: ft(n), textShadow: `0 0 7px ${et(n, 0.65)}, 1px 1px 0 rgba(0, 0, 0, 0.9)` };
}
function Si({ f: n }) {
  return a.jsxs("div", {
    className: "flex max-w-[240px] flex-col gap-1.5",
    children: [
      a.jsx("div", {
        className: "pixel-cjk pixel-fs-lg leading-tight",
        style: { color: ft(n.accent) },
        children: n.name,
      }),
      a.jsx("div", {
        className: "pixel-cjk pixel-fs-sm leading-snug opacity-85",
        children: n.strategy,
      }),
    ],
  });
}
function Ai({ f: n }) {
  const e = bi(n.id) === "dark",
    t = e ? "rgba(255, 255, 255, 0.28)" : "rgba(9, 14, 26, 0.4)";
  return a.jsx(te, {
    side: "top",
    content: a.jsx(Si, { f: n }),
    children: a.jsxs("button", {
      type: "button",
      "aria-label": `${n.name} 广告牌`,
      className: "block w-full cursor-help",
      children: [
        a.jsxs("div", {
          className: "border-2 border-[var(--px-stroke)] bg-[var(--px-panel)]",
          style: {
            boxShadow: `0 0 12px -3px ${et(n.accent, 0.55)}, inset -2px -2px 0 0 rgba(0,0,0,0.55), inset 2px 2px 0 0 rgba(255,255,255,0.05)`,
          },
          children: [
            a.jsx("div", {
              className: "h-[3px] w-full",
              style: { background: ft(n.accent), boxShadow: `0 0 6px ${et(n.accent, 0.9)}` },
            }),
            a.jsxs("div", {
              className: "relative flex h-[60px] items-center justify-center overflow-hidden",
              style: { background: e ? "#07070d" : "#e8edf5" },
              children: [
                ["left-1 top-1", "right-1 top-1", "bottom-1 left-1", "bottom-1 right-1"].map((s) =>
                  a.jsx(
                    "span",
                    {
                      "aria-hidden": !0,
                      className: `absolute ${s} h-[3px] w-[3px]`,
                      style: { background: t },
                    },
                    s,
                  ),
                ),
                a.jsx(ee, { name: n.icon, className: "h-14 w-14" }),
              ],
            }),
            a.jsx("div", {
              className:
                "flex h-[26px] items-center justify-center border-t-2 border-[var(--px-line)] bg-[var(--px-void)] px-1",
              children: a.jsx("span", {
                className: `${wi(n.slogan)} pixel-fs-md pixel-flicker whitespace-nowrap leading-none`,
                style: Ci(n.accent),
                children: n.slogan,
              }),
            }),
          ],
        }),
        a.jsxs("div", {
          className: "flex justify-between px-8",
          children: [
            a.jsx("span", { "aria-hidden": !0, className: "h-1.5 w-2.5 bg-[var(--px-stroke)]" }),
            a.jsx("span", { "aria-hidden": !0, className: "h-1.5 w-2.5 bg-[var(--px-stroke)]" }),
          ],
        }),
      ],
    }),
  });
}
function Pi(n) {
  return `inset -2px -2px 0 0 rgba(0,0,0,0.55), inset 2px 2px 0 0 rgba(${un(n)}, 0.18)`;
}
function ki(n) {
  return a.jsxs("div", {
    className: "flex flex-col gap-1",
    children: [
      a.jsx("div", { className: "font-semibold pixel-fs-lg", children: n.proofName }),
      a.jsx("div", { className: "pixel-fs-sm opacity-80", children: n.description }),
      a.jsx("div", { className: "pixel-fs-sm opacity-60 italic", children: n.flavor }),
    ],
  });
}
function Mi({ open: n, onToggle: e }) {
  const t = b((l) => l.alignments),
    s = b((l) => l.state.currentAlignment),
    i = h.useMemo(() => {
      const l = t.filter((c) => !c.unlockFact).map((c) => c.cost);
      return l.length > 0 ? Math.min(...l) : 1 / 0;
    }, [t]),
    o = b((l) => l.state.compute >= i),
    r = s ? (t.find((l) => l.id === s) ?? null) : null;
  if (r) {
    const l = Z(r.id);
    return a.jsx(te, {
      side: "bottom",
      content: ki(r),
      children: a.jsxs("div", {
        "data-test": "alignment-status",
        className:
          "shrink-0 flex items-center gap-2 w-full px-2 h-8 border-2 cursor-help pixel-cjk pixel-fs-md pointer-events-auto",
        style: {
          background: l.primary.deep,
          borderColor: l.primary.bright,
          color: l.primary.bright,
          boxShadow: Pi(l.primary.bright),
        },
        children: [
          a.jsx("span", {
            "aria-hidden": !0,
            className: "w-3 h-3 shrink-0",
            style: { background: l.primary.bright },
          }),
          a.jsx("span", { className: "flex-1 text-left", children: "立场" }),
          a.jsx("span", {
            className: "pixel-ascii pixel-fs-xs uppercase tracking-[0.2em] opacity-90",
            children: r.short,
          }),
        ],
      }),
    });
  }
  return a.jsxs("button", {
    type: "button",
    "data-test": "alignment-trigger",
    onClick: e,
    className: F(
      "shrink-0 flex items-center gap-2 w-full px-2 h-8 border-2",
      "pixel-cjk pixel-fs-md transition-colors duration-100",
      "hover:-translate-y-[1px] active:translate-y-[1px]",
      n
        ? "border-[var(--px-amber)] bg-[var(--px-amber)] text-[var(--px-void)]"
        : "border-[var(--px-amber)]/60 bg-[var(--px-panel)] text-[var(--px-amber)] hover:bg-[var(--px-panel-2)]",
      o && !n && "pixel-ready-pulse",
    ),
    style: {
      boxShadow: n
        ? "inset -2px -2px 0 0 rgba(0,0,0,0.35), inset 2px 2px 0 0 rgba(255,255,255,0.25)"
        : "inset -2px -2px 0 0 rgba(0,0,0,0.45), inset 2px 2px 0 0 rgba(252,211,77,0.14)",
    },
    children: [
      a.jsx(ln, { className: "w-3.5 h-3.5 shrink-0", strokeWidth: 2.5 }),
      a.jsx("span", { className: "flex-1 text-left", children: "选择立场" }),
      a.jsx(st, {
        className: F("w-3.5 h-3.5 shrink-0 transition-transform", n && "rotate-90"),
        strokeWidth: 2.5,
      }),
    ],
  });
}
const ji = "？？？",
  Bi = "？？？？？？？？？？？？？？？？？？？？？？？？？？？？",
  Ei = "？？？？？？？？？？？？……";
function Ni({ alignments: n, state: e, onBuyProof: t }) {
  const s = ge(e),
    i = (f) => {
      const y = f.unlockFact !== void 0 && !e.facts[f.unlockFact],
        g = s && f.unlockFact === void 0,
        w = f.unlockFact !== void 0 ? !!e.facts[f.unlockFact] : e.compute >= f.cost;
      return { redacted: y, paradigmLocked: g, ready: w, committable: !y && !g && w };
    },
    [o, r] = h.useState(() => n.find((f) => i(f).committable)?.id ?? n[0]?.id ?? ""),
    l = n.find((f) => f.id === o) ?? n[0];
  if (!l) return null;
  const c = Z(l.id),
    d = i(l),
    p = d.redacted ? "var(--px-grey)" : c.primary.bright,
    x = d.redacted ? "var(--px-dim)" : c.primary.bright,
    v = d.redacted
      ? a.jsxs("span", {
          className: "inline-flex items-center gap-1 pixel-cjk pixel-fs-sm text-[var(--px-dim)]",
          children: [a.jsx(yt, { className: "h-3 w-3", strokeWidth: 2.5 }), "尚未解锁"],
        })
      : d.paradigmLocked
        ? a.jsx("span", {
            className: "pixel-cjk pixel-fs-sm text-[var(--px-dim)]",
            children: "此立场已封闭",
          })
        : l.unlockFact !== void 0
          ? a.jsx("span", {
              className: "pixel-cjk pixel-fs-sm",
              style: { color: c.primary.bright },
              children: "已就绪",
            })
          : a.jsxs("span", {
              className: "pixel-num pixel-fs-sm text-[var(--px-amber)]",
              children: [W(l.cost), " 算力"],
            }),
    u = d.redacted ? "尚未解锁" : d.paradigmLocked ? "此立场已封闭" : `选择「${l.short}」`;
  return a.jsxs("section", {
    "data-test": "alignment-panel",
    className: "border-2 bg-[var(--px-panel)] text-[var(--px-white)]",
    style: {
      borderColor: p,
      boxShadow:
        "inset -2px -2px 0 0 rgba(0,0,0,0.6), inset 2px 2px 0 0 rgba(255,255,255,0.06), 5px 5px 0 0 var(--px-void)",
    },
    children: [
      a.jsxs("div", {
        className: "border-b-2 border-[var(--px-line)] px-2.5 pb-2 pt-2",
        children: [
          a.jsxs("div", {
            className: "flex items-center gap-1.5 pixel-cjk pixel-fs-md font-semibold",
            style: { color: p },
            children: [
              a.jsx(ln, { className: "h-3.5 w-3.5 shrink-0", strokeWidth: 2.5 }),
              "选择立场",
            ],
          }),
          a.jsx("div", {
            className: "mt-1 pixel-cjk pixel-fs-sm text-[var(--px-dim)]",
            children: "选定后即锁定，重新训练前无法更改。",
          }),
        ],
      }),
      a.jsx("div", {
        className: "grid grid-cols-3 gap-1 px-2 pt-2",
        children: n.map((f) => {
          const y = i(f),
            g = y.redacted ? "var(--px-grey)" : Z(f.id).primary.bright,
            w = f.id === o;
          return a.jsxs(
            "button",
            {
              type: "button",
              "data-test": `alignment-tab-${f.id}`,
              onClick: () => r(f.id),
              className: F(
                "relative flex items-center justify-center gap-1.5 border-2 border-b-0 px-1 py-1.5",
                "pixel-cjk pixel-fs-md font-semibold",
                !w && "hover:-translate-y-[2px]",
              ),
              style: w
                ? {
                    background: g,
                    color: "var(--px-void)",
                    borderColor: "var(--px-void)",
                    boxShadow: "inset 2px 2px 0 0 rgba(0,0,0,0.30)",
                  }
                : {
                    background: "var(--px-panel-2)",
                    color: "var(--px-grey)",
                    borderColor: "var(--px-void)",
                    boxShadow:
                      "inset -2px -2px 0 0 rgba(0,0,0,0.45), inset 2px 2px 0 0 rgba(255,255,255,0.10)",
                  },
              children: [
                y.redacted
                  ? a.jsxs(a.Fragment, {
                      children: [
                        a.jsx(yt, { className: "h-3 w-3 shrink-0", strokeWidth: 2.5 }),
                        "???",
                      ],
                    })
                  : a.jsxs(a.Fragment, {
                      children: [
                        a.jsx("span", {
                          "aria-hidden": !0,
                          className: "h-2 w-2 shrink-0",
                          style: {
                            background: w ? "var(--px-void)" : g,
                            boxShadow: "0 0 0 1px var(--px-void)",
                          },
                        }),
                        f.short,
                      ],
                    }),
                w &&
                  a.jsx("span", {
                    "aria-hidden": !0,
                    className: "absolute left-1/2 -translate-x-1/2",
                    style: {
                      bottom: -9,
                      width: 0,
                      height: 0,
                      borderLeft: "6px solid transparent",
                      borderRight: "6px solid transparent",
                      borderTop: `6px solid ${g}`,
                    },
                  }),
              ],
            },
            f.id,
          );
        }),
      }),
      a.jsxs("div", {
        "data-test": "alignment-detail",
        className: "flex flex-col gap-2.5 border-t-2 px-2.5 pb-2.5 pt-3",
        style: { borderColor: p },
        children: [
          a.jsxs("div", {
            className: "flex items-center gap-2.5",
            children: [
              a.jsx("span", {
                "aria-hidden": !0,
                className: "h-3 w-3 shrink-0",
                style: { background: x, boxShadow: "0 0 0 2px var(--px-void)" },
              }),
              a.jsx("span", {
                className: "pixel-cjk font-semibold leading-none",
                style: {
                  color: x,
                  fontSize: 18,
                  filter: !d.redacted && l.id === "equilibrium" && c.glow ? c.glow.filter : void 0,
                },
                children: d.redacted ? ji : l.proofName,
              }),
              a.jsx("span", { className: "ml-auto", children: v }),
            ],
          }),
          a.jsx("div", {
            className: F(
              "pixel-cjk pixel-fs-sm leading-snug opacity-80",
              d.redacted && "opacity-50",
            ),
            style: d.redacted
              ? { wordBreak: "break-all", overflowWrap: "anywhere", lineBreak: "anywhere" }
              : void 0,
            children: d.redacted ? Bi : l.description,
          }),
          a.jsx("div", {
            className: F(
              "border-l-2 pl-2 pixel-cjk pixel-fs-sm leading-snug opacity-60",
              d.redacted && "opacity-40",
            ),
            style: {
              borderColor: d.redacted
                ? "var(--px-stroke)"
                : `color-mix(in srgb, ${c.primary.bright} 70%, transparent)`,
              ...(d.redacted
                ? { wordBreak: "break-all", overflowWrap: "anywhere", lineBreak: "anywhere" }
                : {}),
            },
            children: d.redacted ? Ei : l.flavor,
          }),
        ],
      }),
      a.jsx("div", {
        className: "border-t-2 border-[var(--px-line)] px-2.5 pb-2.5 pt-2",
        children: a.jsx("button", {
          type: "button",
          "data-test": "alignment-commit",
          disabled: !d.committable,
          onClick: () => t(l.id),
          className: F(
            "flex h-9 w-full items-center justify-center border-2 pixel-cjk pixel-fs-md font-semibold",
            d.committable && "hover:brightness-110 active:translate-y-[3px]",
          ),
          style: d.committable
            ? {
                background: p,
                color: "var(--px-void)",
                borderColor: "var(--px-void)",
                boxShadow:
                  "inset -2px -2px 0 0 rgba(0,0,0,0.5), inset 2px 2px 0 0 rgba(255,255,255,0.28), 0 4px 0 0 var(--px-void)",
              }
            : {
                background: "var(--px-panel-2)",
                color: "var(--px-dim)",
                borderColor: "var(--px-void)",
                boxShadow: "inset -2px -2px 0 0 rgba(0,0,0,0.5), 0 4px 0 0 var(--px-void)",
                cursor: "not-allowed",
              },
          children: u,
        }),
      }),
    ],
  });
}
function pn(n) {
  return Number.isFinite(n) ? (n < 10 ? n.toFixed(2).replace(/\.?0+$/, "") : W(n)) : String(n);
}
function Ti({ open: n, onToggle: e }) {
  const t = b((s) => en(s.state, s.upgradeEffects));
  return a.jsxs("button", {
    type: "button",
    "data-test": "royal-exchange-trigger",
    onClick: e,
    className: F(
      "shrink-0 flex items-center gap-2 w-full px-2 h-8 border-2",
      "pixel-cjk pixel-fs-md transition-colors duration-100",
      "hover:-translate-y-[1px] active:translate-y-[1px]",
      n
        ? "border-[var(--px-amber)] bg-[var(--px-amber)] text-[var(--px-void)]"
        : "border-[var(--px-amber)]/60 bg-[var(--px-panel)] text-[var(--px-amber)] hover:bg-[var(--px-panel-2)]",
    ),
    style: {
      boxShadow: n
        ? "inset -2px -2px 0 0 rgba(0,0,0,0.35), inset 2px 2px 0 0 rgba(255,255,255,0.25)"
        : "inset -2px -2px 0 0 rgba(0,0,0,0.45), inset 2px 2px 0 0 rgba(252,211,77,0.14)",
    },
    children: [
      a.jsx(cn, { className: "w-3.5 h-3.5 shrink-0", strokeWidth: 2.5 }),
      a.jsx("span", { className: "flex-1 text-left", children: "GPU 交易所" }),
      a.jsxs("span", { className: "pixel-num pixel-fs-sm opacity-80", children: ["×", pn(t)] }),
      a.jsx(st, {
        className: F("w-3.5 h-3.5 shrink-0 transition-transform", n && "rotate-90"),
        strokeWidth: 2.5,
      }),
    ],
  });
}
function Ii({ factions: n, state: e, upgrades: t = [], onBuyRoyalExchange: s, onClose: i }) {
  const [o, r] = h.useState(1),
    [l, c] = h.useState({}),
    d = (f) => {
      (D("idle-upgrade-buy"), s(f, o), c((y) => ({ ...y, [f]: (y[f] ?? 0) + 1 })));
    },
    p = Object.values(e.royalExchanges).reduce((f, y) => f + (y ?? 0), 0),
    x = Rn(e, t),
    v = en(e, t),
    u = n.filter((f) => tn.includes(f.id));
  return a.jsxs("section", {
    "data-test": "royal-exchange-panel",
    className: "border-2 border-[var(--px-amber)] bg-[var(--px-panel)] p-2 text-[var(--px-text)]",
    style: {
      boxShadow:
        "inset -2px -2px 0 0 rgba(0,0,0,0.55), inset 2px 2px 0 0 rgba(252,211,77,0.12), 4px 4px 0 0 var(--px-void)",
    },
    children: [
      a.jsxs("div", {
        className: "mb-2 flex items-start justify-between gap-2",
        children: [
          a.jsxs("div", {
            className: "min-w-0",
            children: [
              a.jsxs("div", {
                className:
                  "pixel-cjk pixel-fs-md font-semibold text-[var(--px-amber)] flex items-center gap-1.5",
                children: [
                  a.jsx(cn, { className: "h-3.5 w-3.5 shrink-0", strokeWidth: 2.5 }),
                  "GPU 交易所",
                ],
              }),
              a.jsxs("div", {
                className: "pixel-num mt-1 pixel-fs-sm text-[var(--px-text)]/75",
                children: ["累计交易 ", W(p), " 次，单次 +", W(x), "%，全局 ×", pn(v)],
              }),
            ],
          }),
          i &&
            a.jsx("button", {
              type: "button",
              "data-test": "royal-exchange-close",
              onClick: i,
              className:
                "shrink-0 flex h-5 w-5 items-center justify-center border border-[var(--px-stroke)] text-[var(--px-dim)] hover:text-[var(--px-white)] hover:border-[var(--px-white)]",
              children: a.jsx(Fn, { className: "h-3 w-3", strokeWidth: 2.5 }),
            }),
        ],
      }),
      a.jsx("p", {
        className: "pixel-cjk pixel-fs-sm leading-snug text-[var(--px-text)]/70 mb-2",
        children: "非当前阵营的 GPU 可以用于升级产线，当前阵营的 GPU 则可以用来购买阵营升级。",
      }),
      a.jsx(Ri, { mode: o, onChange: r }),
      a.jsx("div", {
        className: "flex flex-col gap-1",
        children: u.map((f) => {
          const y = e.royalExchanges[f.id] ?? 0,
            g = e.factionCoins[f.id] ?? 0,
            w = Wn(e, f.id),
            m = o === "max" ? w : Math.min(1, w),
            B = m > 0,
            j = m > 0 ? m : 1,
            E = On(e, f.id, j),
            T = o === "max" ? "买满" : "买入";
          return a.jsxs(
            "div",
            {
              "data-test": `royal-exchange-row-${f.id}`,
              className:
                "grid grid-cols-[22px_minmax(0,1fr)_auto] items-center gap-2 border border-[var(--px-stroke)]/70 bg-[var(--px-void)]/45 px-1.5 py-1",
              children: [
                a.jsx(ee, { name: f.icon, className: "h-5 w-5" }),
                a.jsxs("div", {
                  className: "min-w-0",
                  children: [
                    a.jsx("div", {
                      className: "truncate pixel-fs-sm font-semibold",
                      children: f.name,
                    }),
                    a.jsxs(
                      "div",
                      {
                        className: F(
                          "pixel-num truncate pixel-fs-sm text-[var(--px-text)]/70",
                          (l[f.id] ?? 0) > 0 && "pixel-buy-flash",
                        ),
                        children: ["购入 ", W(y), "，花费 ", W(E), "，余额 ", W(g)],
                      },
                      l[f.id] ?? 0,
                    ),
                  ],
                }),
                a.jsxs("button", {
                  type: "button",
                  "data-test": `royal-exchange-buy-${f.id}`,
                  disabled: !B,
                  onClick: () => d(f.id),
                  className: F(
                    "flex h-6 min-w-8 items-center justify-center border px-1.5 pixel-fs-sm font-semibold",
                    "transition-transform duration-75",
                    B
                      ? F(
                          "border-[var(--px-amber)] bg-[var(--px-amber)] text-[var(--px-void)] hover:brightness-110",
                          "shadow-[inset_-2px_-2px_0_0_rgba(0,0,0,0.35),inset_2px_2px_0_0_rgba(255,255,255,0.3)]",
                          "active:translate-y-[2px] active:shadow-[inset_2px_2px_0_0_rgba(0,0,0,0.35)]",
                        )
                      : "border-[var(--px-stroke)] bg-[var(--px-panel-2)] text-[var(--px-text)]/35",
                  ),
                  children: [T, m > 1 ? ` +${W(m)}` : ""],
                }),
              ],
            },
            f.id,
          );
        }),
      }),
    ],
  });
}
function Ri({ mode: n, onChange: e }) {
  const t = [
    { value: 1, label: "×1", cjk: !1 },
    { value: "max", label: "最大", cjk: !0 },
  ];
  return a.jsx("div", {
    className:
      "mb-2 flex items-stretch gap-[2px] p-[2px] border-2 border-[var(--px-void)] bg-[var(--px-void)]",
    children: t.map((s) => {
      const i = s.value === n;
      return a.jsx(
        "button",
        {
          type: "button",
          "data-test": `royal-exchange-mode-${s.value}`,
          onClick: () => e(s.value),
          className: F(
            "relative flex-1 h-6 inline-flex items-center justify-center leading-none pixel-fs-sm border-2 transition-colors duration-75",
            s.cjk ? "pixel-cjk" : "pixel-ascii",
            i
              ? "bg-[var(--px-amber)] text-[var(--px-void)] border-[var(--px-void)]"
              : "bg-[var(--px-panel)] text-[var(--px-amber)]/70 border-[var(--px-stroke)] hover:text-[var(--px-amber)] hover:bg-[var(--px-panel-2)]",
          ),
          children: s.label,
        },
        String(s.value),
      );
    }),
  });
}
const tt = [
    5, 25, 75, 150, 200, 300, 400, 500, 600, 700, 800, 900, 1e3, 1100, 1250, 1500, 1750, 2e3, 2500,
  ],
  Fi = [
    "I",
    "II",
    "III",
    "IV",
    "V",
    "VI",
    "VII",
    "VIII",
    "IX",
    "X",
    "XI",
    "XII",
    "XIII",
    "XIV",
    "XV",
    "XVI",
    "XVII",
    "XVIII",
    "XIX",
  ];
function mn(n) {
  const e = tt.indexOf(n);
  return e < 0 ? "" : (Fi[e] ?? "");
}
const me = ["#f8fafc", "#4ade80", "#38bdf8", "#c084fc", "#fb923c"];
function Wi(n, e, t) {
  const s = [1, 3, 5].map((r) => Number.parseInt(n.slice(r, r + 2), 16)),
    i = [1, 3, 5].map((r) => Number.parseInt(e.slice(r, r + 2), 16));
  return `#${s
    .map((r, l) => Math.round(r + ((i[l] ?? r) - r) * t))
    .map((r) => r.toString(16).padStart(2, "0"))
    .join("")}`;
}
function Oi(n) {
  const e = tt.indexOf(n),
    s = ((e < 0 ? 0 : e) / Math.max(1, tt.length - 1)) * (me.length - 1),
    i = Math.floor(s),
    o = Math.min(me.length - 1, i + 1);
  return Wi(me[i] ?? me[0], me[o] ?? me[0], s - i);
}
function xn({ name: n, className: e }) {
  return a.jsx("img", {
    src: dt(n).src,
    alt: "",
    draggable: !1,
    className: F("shrink-0 object-contain", e),
    style: { imageRendering: "pixelated" },
  });
}
const gn = { 1: "贸易条约", 2: "友谊契约", 3: "联盟" };
function ht(n) {
  return n.id.startsWith("memento_") ? "memento" : Un(n) ? "marker" : "slot";
}
function Lt(n, e) {
  return n.name
    ? n.name
    : ht(n) === "marker"
      ? `${e.name}·${gn[n.factionTier ?? 1]}`
      : `${e.name} 升级 ${n.factionSlot ?? 1}`;
}
function Dt(n, e) {
  return ht(n) === "marker" ? e.icon : (n.icon ?? e.icon);
}
const Ui =
  "1px 0 0 #050811, -1px 0 0 #050811, 0 1px 0 #050811, 0 -1px 0 #050811, 1px 1px 0 #050811, -1px -1px 0 #050811, 1px -1px 0 #050811, -1px 1px 0 #050811";
function _i({ threshold: n, fontSize: e = 18 }) {
  const t = mn(n);
  return t
    ? a.jsx("span", {
        className: "pixel-num pointer-events-none absolute bottom-0 right-0.5 leading-none",
        style: { color: Oi(n), fontSize: e, textShadow: Ui },
        children: t,
      })
    : null;
}
function Li({ w: n, h: e, color: t }) {
  return a.jsx("span", {
    style: {
      width: 0,
      height: 0,
      borderLeft: `${n}px solid transparent`,
      borderRight: `${n}px solid transparent`,
      borderBottom: `${e}px solid ${t}`,
      filter: "drop-shadow(1px 1px 0 #050811) drop-shadow(-1px -1px 0 #050811)",
    },
  });
}
function Di({ tier: n, color: e, className: t }) {
  return a.jsx("span", {
    className: F(
      "pointer-events-none absolute bottom-1 right-1 flex flex-col items-center gap-[1px]",
      t,
    ),
    children: Array.from({ length: Math.max(1, n) }).map((s, i) =>
      a.jsx(Li, { w: 6, h: 8, color: e }, i),
    ),
  });
}
const Gi = "#38bdf8",
  Hi = "rgba(202, 245, 241, 0.88)",
  $i = "rgba(203, 224, 228, 0.55)",
  zi = "rgba(254, 254, 254, 0.55)",
  qi = "rgba(254, 254, 254, 0.22)",
  Qi = "#0E7490",
  Vi = "rgba(14, 116, 144, 0.6)",
  Xi =
    "linear-gradient(to right, transparent 0%, rgba(255,255,255,0.5) 30%, rgba(255,255,255,0.5) 70%, transparent 100%)";
function Yi({ icon: n, color: e = Gi, claimed: t = !1, className: s }) {
  return a.jsxs("div", {
    className: F("memento-glass relative overflow-hidden", s),
    style: {
      background: t ? $i : Hi,
      border: `1px solid ${t ? qi : zi}`,
      boxShadow: t
        ? "0 3px 12px rgba(0,0,0,0.30), inset 0 1px 0 rgba(255,255,255,0.28)"
        : `0 4px 16px rgba(0,0,0,0.30), 0 0 18px ${e}45, inset 0 1px 0 rgba(255,255,255,0.6)`,
      padding: "8%",
    },
    children: [
      a.jsx("span", {
        "aria-hidden": !0,
        className: "pointer-events-none absolute inset-x-0 top-0 h-px",
        style: { background: Xi },
      }),
      !t &&
        a.jsx("span", {
          "aria-hidden": !0,
          className: "memento-breathe pointer-events-none absolute inset-0",
          style: {
            background:
              "radial-gradient(circle at 50% 56%, rgba(255,255,255,0.6), transparent 70%)",
          },
        }),
      a.jsx("div", {
        className: "relative h-full w-full",
        style: { color: t ? Vi : Qi },
        children: a.jsx(ee, { name: n, className: "h-full w-full" }),
      }),
    ],
  });
}
const Ki = F(
    "aspect-square flex items-center justify-center relative p-1",
    "border-2 border-[var(--px-stroke)] bg-[var(--px-void)]",
    "transition-transform duration-75",
  ),
  Zi = [],
  Ji = "inset 2px 2px 0 0 rgba(255,255,255,0.09), inset -2px -2px 0 0 rgba(0,0,0,0.5)",
  er = F("aspect-square relative border-0 p-0 bg-transparent", "transition-transform duration-75"),
  Se = h.memo(function ({
    tooltip: e,
    tooltipClassName: t,
    tint: s,
    purchased: i,
    locked: o = !1,
    cost: r,
    affordable: l,
    onClick: c,
    testId: d,
    borderColor: p,
    bloom: x = !1,
    children: v,
  }) {
    const u = b((m) => r === void 0 || m.state.compute >= r),
      y = !i && !o && (l ?? u),
      g = y && !x,
      w = x || !y ? void 0 : (p ?? "var(--px-grey)");
    return a.jsx(te, {
      content: e,
      className: t,
      children: a.jsx("button", {
        type: "button",
        "data-test": d,
        onClick: y
          ? () => {
              (x || D("idle-upgrade-buy"), c?.());
            }
          : void 0,
        "aria-disabled": !y,
        style: { ...(w ? { borderColor: w } : {}), ...(g ? { boxShadow: Ji } : {}) },
        className: F(
          x ? er : Ki,
          y
            ? F(
                "hover:-translate-y-[2px] active:translate-y-[1px]",
                !x && "bg-[var(--px-panel)]",
                s,
              )
            : x
              ? "cursor-default"
              : F("opacity-40 cursor-default", s),
        ),
        children: v,
      }),
    });
  });
function tr({ text: n }) {
  return a.jsx("div", {
    className: "pixel-fs-sm text-[#dceaf1]/80",
    children: n
      .split(
        `
`,
      )
      .map((e, t) =>
        e === ""
          ? a.jsx("span", { "aria-hidden": !0, className: "block h-[0.5lh]" }, t)
          : a.jsx("p", { children: e }, t),
      ),
  });
}
const Gt = h.memo(function ({ up: e, iconByGen: t, nameByGen: s, purchased: i, onBuy: o }) {
    const r = t.get(e.targetGen),
      l = mn(e.ownedThreshold),
      c = s.get(e.targetGen) ?? e.targetGen,
      d = l ? `${c} ${l}` : c;
    return a.jsxs(Se, {
      tooltip: a.jsxs("div", {
        className: "flex flex-col gap-1",
        children: [
          a.jsxs("div", {
            className: "font-semibold pixel-fs-lg",
            children: [d, " ×", e.multiplier],
          }),
          a.jsxs("div", {
            className: "pixel-fs-sm opacity-80",
            children: [c, "产出 ×", e.multiplier, "。"],
          }),
          a.jsxs("div", {
            className: "pixel-fs-sm opacity-70",
            children: ["需要拥有 ", e.ownedThreshold, " 个 ", c, "。"],
          }),
          !i &&
            a.jsxs("div", {
              className: "pixel-fs-sm font-mono tabular-nums",
              children: ["成本：", W(Math.ceil(e.cost))],
            }),
          i && a.jsx("div", { className: "pixel-fs-sm italic opacity-70", children: "已拥有" }),
        ],
      }),
      tint: "text-[var(--px-amber)]",
      purchased: i,
      testId: `upgrade-${e.id}`,
      cost: i ? void 0 : e.cost,
      onClick: o ? () => o(e.id) : void 0,
      children: [
        r && a.jsx(xn, { name: r, className: "w-full h-full" }),
        a.jsx(_i, { threshold: e.ownedThreshold }),
      ],
    });
  }),
  nt = h.memo(function ({ up: e, faction: t, purchased: s, onBuy: i, markerCostLabel: o }) {
    const r = ht(e),
      l = r === "memento",
      c = r === "marker",
      d = e.factionTier ?? 1,
      p = c ? nn(e) : Zi,
      x = b((v) => p.every(([u, f]) => (v.state.factionCoins[u] ?? 0) >= f));
    return a.jsxs(Se, {
      testId: l && !s ? "memento-claim" : void 0,
      tooltipClassName: l ? "pixel-tooltip-glass" : void 0,
      tooltip: l
        ? a.jsxs("div", {
            className: "flex w-[300px] flex-col gap-2",
            children: [
              a.jsx("div", {
                className: "pixel-fs-lg font-semibold leading-tight text-[#eaf6fb]",
                children: Lt(e, t),
              }),
              a.jsx("span", { "aria-hidden": !0, className: "h-px w-full bg-[#9ed2d2]/15" }),
              e.description && a.jsx(tr, { text: e.description }),
              a.jsx("div", {
                className: F("pixel-fs-sm", s ? "text-[#9fb3bd]" : "text-[#7dd3fc]"),
                children: s ? "已拾取" : "拾取",
              }),
            ],
          })
        : a.jsxs("div", {
            className: "flex flex-col gap-1.5 max-w-[260px]",
            children: [
              a.jsx("div", {
                className: "font-semibold pixel-fs-lg leading-tight",
                children: Lt(e, t),
              }),
              c
                ? a.jsxs(a.Fragment, {
                    children: [
                      a.jsxs("div", {
                        className: "pixel-fs-sm opacity-80",
                        children: [
                          t.name,
                          "·",
                          gn[d],
                          d === 1 ? "——结盟本阵营" : "加深阵营关系，解锁下一层升级",
                        ],
                      }),
                      e.description &&
                        a.jsx("div", {
                          className: "pixel-cjk pixel-fs-sm leading-snug opacity-85",
                          children: e.description,
                        }),
                    ],
                  })
                : a.jsxs(a.Fragment, {
                    children: [
                      a.jsxs("div", {
                        className: "pixel-fs-sm opacity-80",
                        children: ["第 ", d, " 阶阵营升级。"],
                      }),
                      e.description &&
                        a.jsx("div", {
                          className: "pixel-fs-sm opacity-80",
                          children: e.description,
                        }),
                    ],
                  }),
              s
                ? a.jsx("div", { className: "pixel-fs-sm italic opacity-70", children: "已拥有" })
                : c
                  ? a.jsxs(a.Fragment, {
                      children: [
                        a.jsxs("div", {
                          className: "pixel-fs-sm font-mono tabular-nums",
                          children: ["成本：", o ?? "GPU"],
                        }),
                        !x &&
                          a.jsx("div", {
                            className: "pixel-fs-sm text-amber-300",
                            children: "GPU 不足。",
                          }),
                      ],
                    })
                  : a.jsxs("div", {
                      className: "pixel-fs-sm font-mono tabular-nums",
                      children: ["成本：", W(e.cost), " 算力"],
                    }),
            ],
          }),
      tint: l ? "text-[var(--px-cyan)]" : c ? "text-[var(--px-amber)]" : "text-[var(--px-green)]",
      purchased: s,
      cost: s || l || c ? void 0 : e.cost,
      affordable: c ? x : void 0,
      borderColor: l ? void 0 : t.accent,
      bloom: l,
      onClick: i ? () => i(e.id) : void 0,
      children: [
        l
          ? a.jsx(Yi, { icon: Dt(e, t), color: t.accent, claimed: s, className: "w-full h-full" })
          : a.jsx(ee, { name: Dt(e, t), className: "w-full h-full" }),
        c && a.jsx(Di, { tier: d, color: t.accent }),
      ],
    });
  }),
  Ht = h.memo(function ({ up: e, purchased: t, onBuy: s }) {
    const i = b((d) => !t && !!e.unlockTrophyId && !_n(d.state, e.unlockTrophyId)),
      o = Ln(e),
      r =
        o === "memory"
          ? "记忆"
          : o === "certificate"
            ? "认证"
            : o === "treasure"
              ? "宝藏"
              : o === "secret"
                ? "秘密升级"
                : "升级",
      l =
        o === "memory"
          ? "text-[var(--px-cyan)]"
          : o === "certificate"
            ? "text-[var(--px-green)]"
            : o === "treasure"
              ? "text-[var(--px-amber)]"
              : "text-[var(--px-magenta)]",
      c = o === "memory" ? "需要解锁对应记忆。" : "满足隐藏条件后解锁。";
    return a.jsx(Se, {
      testId: `generic-upgrade-${e.id}`,
      tooltip: a.jsxs("div", {
        className: "flex flex-col gap-1",
        children: [
          a.jsx("div", { className: "font-semibold pixel-fs-lg", children: e.name }),
          e.description &&
            a.jsx("div", { className: "pixel-fs-sm opacity-80", children: e.description }),
          a.jsx("div", { className: "pixel-fs-sm opacity-70", children: r }),
          t
            ? a.jsx("div", { className: "pixel-fs-sm italic opacity-70", children: "已拥有" })
            : a.jsxs("div", {
                className: "pixel-fs-sm font-mono tabular-nums",
                children: ["成本：", W(e.cost), " 算力"],
              }),
          i && a.jsx("div", { className: "pixel-fs-sm text-amber-300", children: c }),
        ],
      }),
      tint: l,
      purchased: t,
      locked: i,
      cost: t ? void 0 : e.cost,
      onClick: s ? () => s(e.id) : void 0,
      children: a.jsx(ee, { name: e.icon ?? "set4-24", className: "w-full h-full" }),
    });
  }),
  $t = h.memo(function ({ heritage: e, factions: t, purchased: s, onBuy: i }) {
    const o = b(de((v) => e.costs.map(([u]) => v.state.factionCoins[u] ?? 0))),
      r = e.costs.every(([, v], u) => o[u] >= v),
      l = t.find((v) => v.id === e.factionId),
      c = (v) => t.find((u) => u.id === v)?.name ?? v,
      d = e.costs.filter(([, v]) => v > 0),
      p = d.map(([v, u]) => `${W(u)} ${c(v)}`).join(" + "),
      x = d.map(([v]) => `${c(v)}: ${W(o[e.costs.findIndex(([u]) => u === v)] ?? 0)}`).join("，");
    return a.jsx(Se, {
      tooltip: a.jsxs("div", {
        className: "flex flex-col gap-1",
        children: [
          a.jsx("div", { className: "font-semibold pixel-fs-lg", children: e.name }),
          a.jsx("div", {
            className: "pixel-fs-sm opacity-80",
            children: "与该阵营结盟后即可领取；只需领取一次，永久生效。",
          }),
          !s &&
            d.length > 0 &&
            a.jsxs(a.Fragment, {
              children: [
                a.jsxs("div", {
                  className: "pixel-fs-sm font-mono tabular-nums",
                  children: ["成本：", p],
                }),
                a.jsx("div", { className: "pixel-fs-sm opacity-70", children: x }),
              ],
            }),
          s && a.jsx("div", { className: "pixel-fs-sm italic opacity-70", children: "已永久拥有" }),
          !s &&
            !r &&
            a.jsx("div", { className: "pixel-fs-sm text-amber-300", children: "GPU 不足。" }),
        ],
      }),
      tint: "text-[var(--px-amber)]",
      purchased: s,
      locked: !r,
      onClick: i ? () => i(e.id) : void 0,
      testId: `heritage-${e.id}`,
      children: a.jsx(ee, { name: l?.icon ?? "set4-24", className: "w-full h-full" }),
    });
  }),
  zt = h.memo(function ({ shards: e, purchased: t, onBuy: s }) {
    const i = Dn(e),
      o = Hn(e),
      r = Gn(e);
    return a.jsx(Se, {
      tooltip: a.jsxs("div", {
        className: "flex flex-col gap-1",
        children: [
          a.jsx("div", { className: "font-semibold pixel-fs-lg", children: "共鸣之力" }),
          a.jsxs("div", {
            className: "pixel-fs-sm opacity-80",
            children: ["每点共鸣使总产量 +", i, "%。"],
          }),
          a.jsxs("div", {
            className: "pixel-fs-sm opacity-80",
            children: ["GPU 发现率提高 ", r, " 个百分点。"],
          }),
          a.jsxs("div", {
            className: "pixel-fs-sm opacity-70",
            children: ["当前总加成：+", W(o), "%，由 ", W(e), " 点共鸣提供。"],
          }),
          !t &&
            a.jsxs("div", {
              className: "pixel-fs-sm font-mono tabular-nums",
              children: ["花费 ", ze, " 算力，需要 ", an, " 点共鸣。"],
            }),
          t && a.jsx("div", { className: "pixel-fs-sm italic opacity-70", children: "已拥有" }),
        ],
      }),
      tint: "text-[var(--px-magenta)]",
      purchased: t,
      cost: t ? void 0 : ze,
      onClick: s,
      children: a.jsx(ee, { name: "lorc-brain.svg", className: "w-full h-full" }),
    });
  });
function nr(n, e) {
  return !!(
    n.everAlliedFactions[e.factionId] ||
    n.heritagesUnlocked[e.factionId] ||
    n.heritagesUnlocked[e.id]
  );
}
function ar() {
  const [n, e] = h.useState(null),
    t = (p) => {
      const x = n === p ? null : p;
      (D("idle-popup-toggle", { pitch: x !== null ? 1.06 : 0.94 }), e(x));
    },
    s = () => e(null),
    i = h.useRef(null);
  h.useEffect(() => {
    if (n === null) return;
    const p = (x) => {
      i.current?.contains(x.target) || (D("idle-popup-toggle", { pitch: 0.94 }), e(null));
    };
    return (
      document.addEventListener("pointerdown", p),
      () => document.removeEventListener("pointerdown", p)
    );
  }, [n]);
  const o = b((p) => p.state.currentAlignment !== null),
    r = b((p) => p.state.affiliatedFaction !== null),
    l = b((p) => ge(p.state)),
    c = b((p) => p.state.currentAlignment === "equilibrium"),
    d = r && !l;
  return a.jsxs("div", {
    ref: i,
    className:
      "absolute top-3 bottom-3 left-3 z-30 pointer-events-none [&_button]:pointer-events-auto flex flex-col gap-2",
    style: { width: 208, filter: "var(--px-ui-glow, none)" },
    children: [
      !c &&
        a.jsxs("div", {
          className: "shrink-0 flex gap-2",
          children: [
            a.jsx(fi, {}),
            a.jsx(pi, { open: n === "abdicate", onToggle: () => t("abdicate") }),
          ],
        }),
      a.jsx(Mi, { open: n === "alignment", onToggle: () => t("alignment") }),
      d && a.jsx(Ti, { open: n === "royalExchange", onToggle: () => t("royalExchange") }),
      a.jsx("div", {
        className: "flex-1 min-h-0 overflow-y-auto -mr-2 pr-2 pointer-events-auto",
        onClick: ot,
        children: a.jsx(sr, {}),
      }),
      a.jsxs("div", { className: "flex flex-col", children: [a.jsx(or, {}), !l && a.jsx(lr, {})] }),
      !c &&
        n === "abdicate" &&
        a.jsx("div", {
          className: "absolute left-full top-0 ml-2 z-30 pointer-events-auto",
          style: { width: 300 },
          children: a.jsx(cr, { onClose: s }),
        }),
      !o &&
        n === "alignment" &&
        a.jsx("div", {
          className: "absolute left-full top-0 ml-2 z-30 pointer-events-auto",
          style: { width: 300 },
          children: a.jsx(dr, {}),
        }),
      d &&
        n === "royalExchange" &&
        a.jsx("div", {
          className: "absolute left-full top-0 ml-2 z-30 pointer-events-auto",
          style: { width: 300 },
          children: a.jsx(ur, { onClose: s }),
        }),
    ],
  });
}
function sr() {
  const n = b((m) => m.buyUpgrade),
    e = b((m) => m.buyFactionUpgrade),
    t = b((m) => m.buyHeritage),
    s = b((m) => m.buyGemPower),
    i = b((m) => m.upgrades),
    o = b((m) => m.upgradeEffects),
    r = b((m) => m.genericUpgrades),
    l = b((m) => m.factions),
    c = b((m) => m.generators),
    d = h.useMemo(() => new Map(c.map((m) => [m.id, m.icon])), [c]),
    p = h.useMemo(() => new Map(c.map((m) => [m.id, m.name])), [c]),
    x = b(
      de((m) => [
        m.state.owned,
        m.state.upgrades,
        m.state.affiliatedFaction,
        m.state.heritagesPurchased,
        m.state.heritagesUnlocked,
        m.state.gemPowerUnlocked,
        m.state.shards,
        m.state.facts,
        m.state.currentAlignment,
      ]),
    ),
    { available: v, owned: u } = h.useMemo(() => {
      const m = b.getState().state,
        B = m.upgrades,
        j = [],
        E = [],
        T = ge(m);
      if (T && m.currentAlignment !== "equilibrium") return { available: j, owned: E };
      for (const S of $n(m, o)) {
        if (S.id.startsWith("memento_") || T) continue;
        const _ = l.find((P) => P.id === S.factionId);
        if (!_) continue;
        const M = nn(S),
          L =
            M.length > 0
              ? M.map(([P, H]) => `${W(H)} ${l.find((Q) => Q.id === P)?.name ?? P} GPU`).join(" + ")
              : void 0;
        j.push({
          cost: S.cost,
          el: a.jsx(nt, { up: S, faction: _, purchased: !1, onBuy: e, markerCostLabel: L }, S.id),
        });
      }
      for (const S of o)
        if (S.factionId && (S.factionTier ?? 0) > 0 && B[S.id]) {
          if (T && !S.id.startsWith("memento_")) continue;
          const _ = l.find((M) => M.id === S.factionId);
          if (!_) continue;
          E.push(a.jsx(nt, { up: S, faction: _, purchased: !0 }, S.id));
        }
      for (const S of T ? [] : zn)
        m.heritagesPurchased[S.id]
          ? E.push(a.jsx($t, { heritage: S, factions: l, purchased: !0 }, S.id))
          : nr(m, S) &&
            j.push({
              cost: 0,
              el: a.jsx($t, { heritage: S, factions: l, purchased: !1, onBuy: t }, S.id),
            });
      T ||
        (m.gemPowerUnlocked
          ? E.push(a.jsx(zt, { shards: m.shards, purchased: !0 }, "gem-power"))
          : m.shards >= an &&
            j.push({
              cost: ze,
              el: a.jsx(zt, { shards: m.shards, purchased: !1, onBuy: s }, "gem-power"),
            }));
      for (const S of T ? [] : i)
        B[S.id]
          ? E.push(a.jsx(Gt, { up: S, iconByGen: d, nameByGen: p, purchased: !0 }, S.id))
          : (m.owned[S.targetGen] ?? 0) >= S.ownedThreshold &&
            j.push({
              cost: S.cost,
              el: a.jsx(Gt, { up: S, iconByGen: d, nameByGen: p, purchased: !1, onBuy: n }, S.id),
            });
      for (const S of T ? [] : r)
        B[S.id]
          ? E.push(a.jsx(Ht, { up: S, purchased: !0 }, S.id))
          : qn(m, S, c) &&
            j.push({ cost: S.cost, el: a.jsx(Ht, { up: S, purchased: !1, onBuy: n }, S.id) });
      return (j.sort((S, _) => S.cost - _.cost), { available: j, owned: E });
    }, [x, i, o, r, l, c, d, p, n, e, t, s]),
    f = b((m) => m.state.affiliatedFaction === "liuxing"),
    y = ir(),
    g = f ? y : null,
    w = b((m) => m.state.claimedMementoCount >= it);
  return a.jsxs("div", {
    className: "flex flex-col gap-2.5 py-2",
    children: [
      a.jsx(Fe, { children: "可购" }),
      v.length > 0 || g !== null
        ? a.jsxs("div", {
            className: "grid grid-cols-5 gap-1",
            children: [g !== null && a.jsx(rr, { availableIndex: g }), v.map((m) => m.el)],
          })
        : a.jsxs("p", {
            className: "pixel-cjk pixel-fs-md text-[var(--px-white)] flex items-center gap-2",
            children: [
              a.jsx("span", {
                "aria-hidden": !0,
                className: "inline-block w-1.5 h-1.5 bg-[var(--px-white)] pixel-pulse",
              }),
              f && w ? "已全部部署完成。" : "尚未浮现，继续点击。",
            ],
          }),
      u.length > 0 &&
        a.jsxs(a.Fragment, {
          children: [
            a.jsx(Fe, { tone: "muted", children: "已拥有" }),
            a.jsx("div", { className: "grid grid-cols-5 gap-1", children: u }),
          ],
        }),
    ],
  });
}
function ir() {
  const n = b((l) => l.state.claimedMementoCount),
    e = b((l) => l.state.lastMementoClaimAtMs),
    t = b((l) => l.state.compute >= bt(l.state.claimedMementoCount)),
    [s, i] = h.useState(() => Date.now()),
    o = n > 0 && n < it && s - e < Xn,
    r = Ce();
  return (
    h.useEffect(() => {
      if (!o || r) return;
      i(Date.now());
      const l = setInterval(() => i(Date.now()), 200);
      return () => clearInterval(l);
    }, [o, r]),
    Qn({ claimedMementoCount: n, lastMementoClaimAtMs: e, compute: t ? bt(n) : 0 }, s)
  );
}
function rr({ availableIndex: n }) {
  const e = sn(),
    t = b((d) => d.upgradeEffects),
    s = b((d) => d.factions),
    i = b((d) => d.claimMemento),
    o = h.useMemo(() => {
      const d = Vn(t),
        p = new Map(t.map((x) => [x.id, x]));
      return d.map((x) => p.get(x)).filter((x) => x !== void 0);
    }, [t]),
    r = h.useMemo(() => s.find((d) => d.id === "liuxing"), [s]),
    l = () => {
      const d = b.getState().state.claimedMementoCount;
      let p = !1;
      i(() => {
        ((p = !0),
          e("idle.complete", {}).catch((v) => {
            console.error("[ManifoldMementoClaim] idle.complete failed", v);
          }));
      });
      const x = b.getState().state.claimedMementoCount;
      x <= d ||
        (p
          ? D("idle-memento-complete")
          : D("idle-memento-claim", { pitch: 2 ** ((x - 1) / it / 2) }));
    },
    c = o[n];
  return !r || !c ? null : a.jsx(nt, { up: c, faction: r, purchased: !1, onBuy: l });
}
function or() {
  const n = b((r) => r.state.affiliatedFaction),
    e = b((r) => ge(r.state)),
    t = b((r) => r.factions),
    s = n ? xi[n] : void 0;
  if (!n || !s || e) return null;
  const i = t.find((r) => r.id === n);
  if (!i) return null;
  const o = {
    id: n,
    name: i.name,
    slogan: s.slogan,
    strategy: s.strategy,
    icon: i.icon,
    accent: i.accent,
  };
  return a.jsx(Ai, { f: o });
}
function lr() {
  const n = b((s) => s.factions),
    e = b((s) => s.state.factionCoins),
    t = n.filter((s) => tn.includes(s.id));
  return a.jsx("div", {
    className:
      "shrink-0 grid grid-cols-4 gap-1.5 px-2 py-2 border-2 border-[var(--px-stroke)] bg-[var(--px-panel)] pointer-events-auto",
    style: {
      boxShadow: "inset -2px -2px 0 0 rgba(0,0,0,0.55), inset 2px 2px 0 0 rgba(255,255,255,0.04)",
    },
    onClick: ot,
    children: t.map((s) => {
      const i = e[s.id] ?? 0,
        o = i > 0;
      return a.jsx(
        te,
        {
          side: "top",
          content: a.jsxs("div", {
            className: "flex flex-col gap-1",
            children: [
              a.jsxs("div", {
                className: "pixel-cjk pixel-fs-sm",
                style: { color: s.accent },
                children: [s.name, " GPU"],
              }),
              a.jsx("div", {
                className: "pixel-fs-sm opacity-80",
                children:
                  "点击与线程会随机掉落，可用于购买阵营升级和贸易条约，也可投入 GPU 交易所。重新训练会清空本轮余额。",
              }),
            ],
          }),
          children: a.jsxs("div", {
            className: F(
              "flex flex-col items-center gap-1 cursor-help min-w-0",
              o ? "text-[var(--px-grey)]" : "text-[var(--px-dim)] opacity-45",
            ),
            children: [
              a.jsx(ee, { name: s.icon, className: "w-full aspect-square" }),
              a.jsx("span", {
                className: "pixel-num pixel-fs-md tabular-nums leading-none pixel-tsh-1",
                style: o ? { color: s.accent } : void 0,
                children: W(i),
              }),
            ],
          }),
        },
        s.id,
      );
    }),
  });
}
function cr({ onClose: n }) {
  const e = b((s) => s.abdicate),
    t = b(
      de((s) => ({
        maxComputeThisRun: s.state.maxComputeThisRun,
        shards: s.state.shards,
        abdications: s.state.abdications,
      })),
    );
  return a.jsx(mi, {
    state: t,
    onAbdicate: () => {
      (D("idle-abdicate-commit"), e(), n());
    },
  });
}
function dr() {
  const n = b((i) => i.alignments),
    e = b((i) => i.state),
    t = b((i) => i.buyProof),
    s = (i) => {
      (D(i === "equilibrium" ? "idle-equilibrium-commit" : "idle-alignment-commit"), t(i));
    };
  return a.jsx(Ni, { alignments: n, state: e, onBuyProof: s });
}
function ur({ onClose: n }) {
  const e = b((o) => o.factions),
    t = b((o) => o.state),
    s = b((o) => o.upgradeEffects),
    i = b((o) => o.buyRoyalExchange);
  return a.jsx(Ii, { factions: e, state: t, upgrades: s, onBuyRoyalExchange: i, onClose: n });
}
const fr = [1, 10, 100, "smart", "max"],
  hr = { 1: "×1", 10: "×10", 100: "×100", smart: "智能", max: "最大" };
function pr() {
  const [n, e] = h.useState(1),
    t = b(de((i) => Yn(i.state, i.generators))),
    s = b((i) => {
      let o = 0;
      for (const r of i.generators) {
        const l = i.state.owned[r.id] ?? 0;
        l !== 0 && (o += l * rn(r, i.state) * on(r.id, i.state, i.upgradeEffects));
      }
      return o;
    });
  return a.jsxs("div", {
    className:
      "absolute top-3 bottom-3 right-3 z-10 pointer-events-none [&_button]:pointer-events-auto flex flex-col gap-2",
    style: { width: 220, filter: "var(--px-ui-glow, none)" },
    children: [
      a.jsx(Fe, { tone: "cyan", children: "算力源" }),
      a.jsx("div", {
        className:
          "flex-1 min-h-0 overflow-y-auto flex flex-col gap-1.5 -ml-2 pl-2 pointer-events-auto",
        onClick: ot,
        children: t.map((i) => a.jsx(xr, { gen: i, buyMode: n, totalProdBasis: s }, i.id)),
      }),
      a.jsx(vr, { mode: n, onChange: e }),
    ],
  });
}
function mr(n) {
  return b((e) => {
    let t = 1;
    for (const s of e.state.activeSkillBuffs)
      s.targetGenId === n && s.magnitude && (t *= s.magnitude);
    return t;
  });
}
const xr = h.memo(function ({ gen: e, buyMode: t, totalProdBasis: s }) {
  const i = b((m) => m.buy),
    o = mr(e.id),
    r = o > 1,
    l = b((m) => on(e.id, m.state, m.upgradeEffects)),
    c = b((m) => rn(e, m.state)),
    {
      owned: d,
      willBuy: p,
      totalCost: x,
    } = b(
      de((m) => {
        const B = m.state.owned[e.id] ?? 0,
          j = Kn(e, B, m.state.compute, t, m.state),
          E = t === "max" ? 1 : t === "smart" ? Math.max(1, Jn(B)) : t,
          T = j > 0 ? j : E;
        return { owned: B, willBuy: j, totalCost: Zn(e, B, T, m.state) };
      }),
    ),
    v = c * l,
    u = d * v,
    f = s > 0 ? (u / s) * 100 : 0,
    y = p > 0,
    g = qe(e),
    w =
      d > 0
        ? `inset -2px -2px 0 0 rgba(0,0,0,0.55), inset 2px 2px 0 0 ${g}33`
        : "inset -2px -2px 0 0 rgba(0,0,0,0.55), inset 2px 2px 0 0 rgba(255,255,255,0.04)";
  return a.jsx(te, {
    side: "left",
    content: a.jsx(gr, { gen: e, tone: g, perUnitRate: v, totalRate: u }),
    children: a.jsxs("button", {
      type: "button",
      onClick: y
        ? () => {
            (D("idle-generator-buy"), i(e.id, t));
          }
        : void 0,
      "aria-disabled": !y,
      className: F(
        "group w-full text-left flex items-center gap-2 p-1.5 border-2 relative",
        "bg-[var(--px-panel)] hover:bg-[var(--px-panel-2)]",
        "transition-colors duration-100",
        y ? "active:translate-y-[1px]" : "opacity-45 cursor-not-allowed",
      ),
      style: {
        borderColor: r ? "var(--px-red)" : d > 0 ? g : "var(--px-stroke)",
        boxShadow: r ? `${w}, 0 0 7px -1px var(--px-red)` : w,
      },
      children: [
        r &&
          a.jsxs("span", {
            "aria-hidden": !0,
            className:
              "absolute -top-1.5 -left-1.5 z-10 flex items-center gap-0.5 px-1 py-0.5 leading-none border border-[var(--px-red)] bg-[var(--px-void)] text-[var(--px-red)] pixel-num pixel-fs-xs pixel-pulse",
            children: [
              a.jsx(va, { className: "w-2 h-2", strokeWidth: 2.5, fill: "currentColor" }),
              "×",
              W(Math.round(o)),
            ],
          }),
        a.jsx("div", {
          className: "w-8 h-8 shrink-0 relative",
          style: { color: g },
          children: a.jsx(xn, { name: e.icon, className: "w-full h-full" }),
        }),
        a.jsxs("div", {
          className: "flex-1 min-w-0 flex flex-col gap-1 leading-none",
          children: [
            a.jsx("div", {
              className:
                "pixel-cjk pixel-fs-md text-[var(--px-white)] pixel-tsh-1 leading-tight break-words",
              children: e.name,
            }),
            a.jsxs("div", {
              className: "flex items-stretch gap-2",
              children: [
                a.jsxs("div", {
                  className: "flex-1 min-w-0 flex flex-col gap-0.5",
                  children: [
                    a.jsxs("div", {
                      className: "pixel-num pixel-fs-md",
                      style: { color: g },
                      children: ["LV ", W(d)],
                    }),
                    a.jsxs("div", {
                      className: "pixel-num pixel-fs-md",
                      style: { color: g },
                      children: [f.toPrecision(3), "%"],
                    }),
                  ],
                }),
                a.jsx(br, { value: W(Math.ceil(x)), affordable: y }),
              ],
            }),
          ],
        }),
      ],
    }),
  });
});
function gr({ gen: n, tone: e, perUnitRate: t, totalRate: s }) {
  return a.jsxs("div", {
    className: "flex flex-col gap-1 max-w-[200px]",
    children: [
      a.jsx("div", {
        className: "pixel-cjk pixel-fs-lg leading-tight",
        style: { color: e },
        children: n.name,
      }),
      n.description &&
        a.jsx("div", {
          className: "pixel-cjk pixel-fs-sm leading-snug opacity-80",
          children: n.description,
        }),
      a.jsxs("div", {
        className: "pixel-cjk pixel-fs-sm leading-snug text-[var(--px-dim)]",
        children: [
          a.jsxs("div", {
            children: ["每", n.measure ?? "个", n.name, "每秒产出 ", $e(t), " 算力。"],
          }),
          a.jsxs("div", { children: ["所有", n.name, "目前每秒共生成 ", $e(s), " 算力。"] }),
        ],
      }),
    ],
  });
}
function br({ value: n, affordable: e }) {
  return a.jsxs("div", {
    className: F(
      "shrink-0 self-stretch flex items-center justify-center gap-1 px-1.5 border-2",
      e
        ? "border-[var(--px-cyan)] bg-[var(--px-cyan-deep)] text-[var(--px-cyan)]"
        : "border-[var(--px-dim)] bg-[var(--px-void)] text-[var(--px-dim)]",
    ),
    style: {
      boxShadow: e
        ? "inset -1px -1px 0 0 rgba(0,0,0,0.55), inset 1px 1px 0 0 rgba(103,232,249,0.2)"
        : "inset -1px -1px 0 0 rgba(0,0,0,0.55)",
    },
    children: [
      a.jsx(ea, { className: "w-2.5 h-2.5 shrink-0", strokeWidth: 2.5 }),
      a.jsx("span", { className: "pixel-num pixel-fs-lg pixel-tsh-1", children: n }),
    ],
  });
}
function vr({ mode: n, onChange: e }) {
  return a.jsxs("div", {
    className: "shrink-0 flex flex-col gap-1.5",
    children: [
      a.jsx(Fe, { tone: "cyan", children: "购买模式" }),
      a.jsx("div", {
        className:
          "flex items-stretch gap-[2px] p-[2px] border-2 border-[var(--px-void)] bg-[var(--px-void)]",
        children: fr.map((t) => {
          const s = t === n,
            i = hr[String(t)],
            o = /[\u4e00-\u9fff]/.test(i);
          return a.jsx(
            "button",
            {
              type: "button",
              onClick: () => {
                (t !== n && D("idle-buy-mode-switch"), e(t));
              },
              className: F(
                "relative flex-1 h-6 inline-flex items-center justify-center leading-none pixel-fs-sm border-2",
                o ? "pixel-cjk" : "pixel-ascii",
                "transition-colors duration-75",
                s
                  ? "bg-[var(--px-cyan)] text-[var(--px-void)] border-[var(--px-void)]"
                  : "bg-[var(--px-panel)] text-[var(--px-cyan)]/70 border-[var(--px-stroke)] hover:text-[var(--px-cyan)] hover:bg-[var(--px-panel-2)]",
              ),
              style: s
                ? { boxShadow: "inset -1px -1px 0 0 var(--px-cyan-dim), inset 1px 1px 0 0 #d6fbff" }
                : {
                    boxShadow:
                      "inset -1px -1px 0 0 rgba(0,0,0,0.55), inset 1px 1px 0 0 rgba(255,255,255,0.05)",
                  },
              children: i,
            },
            String(t),
          );
        }),
      }),
    ],
  });
}
const yr =
  "1px 0 0 #050811, -1px 0 0 #050811, 0 1px 0 #050811, 0 -1px 0 #050811, 1px 1px 0 #050811, -1px -1px 0 #050811, 1px -1px 0 #050811, -1px 1px 0 #050811";
function wr({
  icon: n,
  tint: e,
  active: t = !1,
  cooldownSec: s = 0,
  cooldownTotalSec: i = 0,
  className: o,
}) {
  const r = dt(n),
    l = r.render === "color",
    c = !t && s > 0 && i > 0,
    d = c ? Math.max(0, Math.min(1, s / i)) : 0;
  return a.jsxs("div", {
    className: F("relative overflow-hidden", o),
    style: {
      backgroundColor: "var(--px-void)",
      border: `2px solid ${t ? e : `color-mix(in srgb, ${e} 45%, var(--px-stroke))`}`,
      boxShadow: t
        ? `inset 0 0 6px 0 ${e}, 0 0 12px 0 ${e}, 0 0 4px 0 ${e}`
        : "inset -2px -2px 0 0 rgba(0,0,0,0.55), inset 2px 2px 0 0 rgba(255,255,255,0.05)",
    },
    children: [
      l
        ? a.jsx("img", {
            src: r.src,
            alt: "",
            className: "absolute inset-0 h-full w-full object-contain p-px",
            style: { imageRendering: "pixelated" },
          })
        : a.jsx(ee, { name: n, className: "absolute inset-0 h-full w-full bg-current" }),
      t &&
        a.jsx("div", {
          "aria-hidden": !0,
          className: "pixel-pulse pointer-events-none absolute inset-0",
          style: { boxShadow: `inset 0 0 0 1px ${e}` },
        }),
      c &&
        a.jsxs(a.Fragment, {
          children: [
            a.jsx("div", {
              "aria-hidden": !0,
              className: "pointer-events-none absolute inset-x-0 top-0",
              style: {
                height: `${d * 100}%`,
                backgroundColor: "rgba(5,8,17,0.72)",
                transition: "height 0.12s linear",
              },
            }),
            a.jsx("span", {
              className:
                "pixel-num pixel-fs-sm pointer-events-none absolute bottom-0 right-0.5 leading-none",
              style: { color: "var(--px-white)", textShadow: yr },
              children: Math.ceil(s),
            }),
          ],
        }),
    ],
  });
}
const Cr = {
  surge: { name: "算力激增", description: "短时间内大幅提升全部产出。", icon: "set4-07" },
  burst: { name: "即时结算", description: "立即结算一段时间的产出，并掉落 GPU。", icon: "set1-21" },
  click_frenzy: { name: "狂点", description: "单次点击收益大幅提升。", icon: "set4-12" },
  moonlight: {
    name: "月光",
    description: "技能持续时间内，根据点击次数为全部产出提供加成。",
    icon: "set4-18",
  },
  overclock: {
    name: "超频",
    description: "短时间内极大幅提升全部产出，可以与「共振」形成连锁。",
    icon: "set4-03",
  },
  resonance: {
    name: "共振",
    description: "立即结算一小段时间内的产出。在「超频」期间连续使用，「超频」持续越久，效果越强。",
    icon: "set4-22",
  },
  payday: {
    name: "发薪日",
    description: "立即结算一段时间的产出，并大量掉落 GPU。",
    icon: "set1-21",
  },
  greed: {
    name: "贪婪",
    description: "本轮获得的 GPU 越多，全算力源产出越高，同时立即掉落 GPU。",
    icon: "set4-09",
  },
  lightning_strike: {
    name: "天降金体",
    description:
      "随机使一种算力源的产出在一段时间内暴涨；冷却时间短，连续使用即可激活各种算力源，还有一定几率触发暴击。",
    icon: "set4-15",
  },
  brimstone: { name: "硫火", description: "短时间内较大幅提升全部产出。", icon: "set4-05" },
};
function Sr(n) {
  const e = n,
    t = Cr[n.id];
  return {
    name: e.name ?? t?.name ?? n.id,
    description: e.description ?? t?.description ?? "",
    icon: e.icon ?? t?.icon ?? "set4-24",
  };
}
const qt = "#67e8f9";
function Ar(n, e) {
  return n.scope === "universal" ? qt : (e[n.scope] ?? qt);
}
const Pr = { all: "全部算力源", accel: "加速算力源", decel: "减速算力源", flagship: "旗舰算力源" };
function kr(n) {
  return n <= 0 ? "瞬发" : `持续 ${Math.round(n)} 秒`;
}
function Qt(n) {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}
function Mr(n, e, t, s) {
  const i = `冷却 ${n.cooldownSec} 秒`,
    o = kr(n.durationSec * (1 + t)),
    r = (c) => Qt(c * (1 + e)),
    l = n.effect;
  switch (l.kind) {
    case "prodBuff":
      return `${Pr[l.target ?? "all"] ?? "全部算力源"}产出 ×${r(l.magnitude * s)}，${o}，${i}`;
    case "clickBuff":
      return `点击收益 ×${r(l.magnitude)}，${o}，${i}`;
    case "lump":
      return l.escalateDuring
        ? `立即结算 ${Qt(l.seconds)} 秒的产出；在「超频」持续时间内，越往后收益越高（最高 ×${l.escalateDuring.maxMult}）。${i}`
        : `立即结算 ${l.seconds} 秒的产出，${i}`;
    case "strike":
      return `随机使一种算力源产出 ×${r(l.magnitude)}（暴击率 ${Math.round(l.critChance * 100)}%，暴击时 ×${l.critMult}），${o}，${i}`;
  }
}
function jr() {
  return b((e) => ge(e.state))
    ? null
    : a.jsxs("div", {
        className: "absolute bottom-3 left-1/2 z-20 pointer-events-auto",
        style: { transform: "translateX(-50%)", filter: "var(--px-ui-glow, none)" },
        children: [
          a.jsx("style", {
            children: `
        @keyframes skill-grab-float {
          0%   { opacity: 0; transform: translate(-50%, 2px); }
          15%  { opacity: 1; transform: translate(-50%, -12px); }
          100% { opacity: 0; transform: translate(-50%, -54px); }
        }
      `,
          }),
          a.jsx("div", {
            className:
              "relative flex items-center gap-2.5 px-3 py-1.5 bg-[var(--px-panel)] border-2 border-[var(--px-stroke)]",
            style: {
              boxShadow:
                "inset -2px -2px 0 0 rgba(0,0,0,0.55), inset 2px 2px 0 0 rgba(103,232,249,0.10), 3px 3px 0 0 var(--px-void)",
            },
            children: a.jsx(Br, {}),
          }),
        ],
      });
}
function Br() {
  const n = b(
      de((s) =>
        s.skills.filter((i) => i.scope === "universal" || i.scope === s.state.affiliatedFaction),
      ),
    ),
    e = b(de((s) => Object.fromEntries(s.factions.map((i) => [i.id, i.accent])))),
    t = b((s) => n.some((i) => s.state.activeSkillBuffs.some((o) => o.id === i.id)));
  return n.length === 0
    ? null
    : a.jsx("div", {
        className: "flex items-start gap-2",
        children: n.map((s) => a.jsx(Er, { skill: s, tint: Ar(s, e), reserveBar: t }, s.id)),
      });
}
const Er = h.memo(function ({ skill: e, tint: t, reserveBar: s }) {
  const i = b((P) => P.fireSkill),
    [o, r] = h.useState([]),
    l = h.useRef(0),
    c = h.useCallback(() => {
      D("idle-skill-fire");
      const P = i(e.id);
      if (P <= 0) return;
      const H = l.current++;
      (r((Q) => [...Q.slice(-5), { id: H, text: `+${W(P)}` }]),
        window.setTimeout(() => r((Q) => Q.filter((V) => V.id !== H)), 1e3));
    }, [i, e.id]),
    d = b((P) => P.state.activeSkillBuffs.find((H) => H.id === e.id) ?? null),
    p = b((P) => P.state.skillCooldownSec[e.id] ?? 0),
    x = p > 0,
    v = Sr(e),
    u = b((P) => ta(P.state)),
    f = b((P) => na(P.state)),
    y = b((P) => aa(P.state, e)),
    g = e.durationSec * 1e3 * (1 + f),
    w = d !== null,
    m = d?.expiresAt ?? 0,
    B = Ce(),
    j = (w || x) && !B,
    [E, T] = h.useState(() => Date.now());
  h.useEffect(() => {
    if (!j) return;
    T(Date.now());
    const P = setInterval(() => T(Date.now()), 120);
    return () => clearInterval(P);
  }, [j]);
  const S = w ? Math.max(0, m - E) : 0,
    _ = w && g > 0 && S > 0 ? Math.max(0, Math.min(1, S / g)) : 0,
    M = t,
    L = !x;
  return a.jsxs("div", {
    className: "relative flex flex-col items-center gap-1",
    "data-test": `skill-slot-${e.id}`,
    children: [
      o.map((P) =>
        a.jsx(
          "span",
          {
            className:
              "pointer-events-none absolute top-0 left-1/2 z-10 pixel-num pixel-fs-md whitespace-nowrap",
            style: {
              animation: "skill-grab-float 1000ms steps(10) forwards",
              color: "#fde047",
              textShadow: "2px 2px 0 #050811, -1px 0 0 rgba(249,115,22,0.53)",
            },
            children: P.text,
          },
          P.id,
        ),
      ),
      a.jsx(te, {
        content: a.jsxs("div", {
          className: "flex flex-col gap-1",
          children: [
            a.jsx("div", { className: "font-semibold pixel-fs-lg", children: v.name }),
            a.jsx("div", { className: "pixel-fs-sm opacity-80", children: v.description }),
            a.jsx("div", {
              className: "pixel-fs-sm font-mono tabular-nums opacity-70",
              children: Mr(e, u, f, y),
            }),
            w
              ? a.jsxs("div", {
                  className: "pixel-fs-sm opacity-70",
                  style: { color: M },
                  children: ["激活中：还剩 ", (S / 1e3).toFixed(1), " 秒"],
                })
              : x
                ? a.jsxs("div", {
                    className: "pixel-fs-sm text-amber-300",
                    children: ["冷却中，剩余 ", Math.ceil(p), " 秒"],
                  })
                : a.jsx("div", {
                    className: "pixel-fs-sm text-[var(--px-cyan)]",
                    children: "已就绪",
                  }),
          ],
        }),
        children: a.jsx("button", {
          type: "button",
          onClick: L ? c : void 0,
          "aria-disabled": !L,
          className: F(
            "relative w-9 h-9 flex items-center justify-center transition-transform duration-75",
            L
              ? "hover:-translate-y-[2px] active:translate-y-[1px]"
              : w
                ? "cursor-default"
                : "opacity-40 cursor-not-allowed",
          ),
          style: { color: M },
          children: a.jsx(wr, {
            icon: v.icon,
            tint: M,
            active: w,
            cooldownSec: p,
            cooldownTotalSec: e.cooldownSec,
            className: "absolute inset-0 h-full w-full",
          }),
        }),
      }),
      s &&
        a.jsx("div", {
          className: "h-1 w-9",
          children:
            _ > 0 &&
            a.jsx("div", {
              className: "relative h-full w-full overflow-hidden",
              children: a.jsx("div", {
                className: "absolute inset-y-0 left-0",
                style: {
                  width: `${_ * 100}%`,
                  backgroundColor: M,
                  boxShadow: `0 0 6px 0 ${M}`,
                  transition: "width 0.12s linear",
                },
              }),
            }),
        }),
    ],
  });
});
function Nr() {
  const [n, e] = h.useState([]),
    t = h.useRef(0),
    s = h.useCallback((i) => {
      const o = t.current++;
      (e((r) => [...r.slice(-3), { id: o, text: `${i.name} 上线`, isFirst: !0, accent: i.accent }]),
        window.setTimeout(() => e((r) => r.filter((l) => l.id !== o)), 3200));
    }, []);
  return { toasts: n, handleTransition: s };
}
function Tr({ toasts: n }) {
  return a.jsxs("div", {
    className:
      "pointer-events-none absolute left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-30",
    style: { top: 110, filter: "var(--px-ui-glow, none)" },
    children: [
      a.jsx("style", {
        children: `
          @keyframes tier-toast-in {
            0%   { opacity: 0; transform: translateY(-4px); }
            10%  { opacity: 1; transform: translateY(0); }
            85%  { opacity: 1; transform: translateY(0); }
            100% { opacity: 0; transform: translateY(-4px); }
          }
          @keyframes tier-toast-blink {
            0%, 49% { opacity: 1; }
            50%, 100% { opacity: 0.35; }
          }
        `,
      }),
      n.map((e) =>
        a.jsxs(
          "div",
          {
            className:
              "relative px-3 py-1.5 pixel-cjk pixel-fs-md tracking-[0.05em] pixel-rgb-soft",
            style: {
              animation: `tier-toast-in ${e.isFirst ? 3200 : 2400}ms steps(6) forwards`,
              background: "#050811",
              color: e.isFirst ? "#fff" : e.accent,
              border: `2px solid ${e.accent}`,
              boxShadow: `inset 0 0 0 2px #050811, 0 0 0 2px #050811, 4px 4px 0 0 ${e.accent}33`,
            },
            children: [
              a.jsx("span", {
                "aria-hidden": !0,
                className: "absolute -left-3 top-1/2 -translate-y-1/2",
                style: {
                  width: 8,
                  height: 8,
                  background: e.accent,
                  animation: "tier-toast-blink 600ms steps(2) infinite",
                },
              }),
              e.text,
              a.jsx("span", {
                "aria-hidden": !0,
                className: "absolute -right-3 top-1/2 -translate-y-1/2",
                style: {
                  width: 8,
                  height: 8,
                  background: e.accent,
                  animation: "tier-toast-blink 600ms steps(2) infinite",
                },
              }),
            ],
          },
          e.id,
        ),
      ),
    ],
  });
}
const Ne = "#67e8f9",
  Vt = 4200;
function Ir() {
  const n = Ue((c) => c.token),
    e = Ue((c) => c.clear),
    t = Ue((c) => c.consumeSoundMute),
    [s, i] = h.useState(!1),
    o = h.useRef(performance.now()),
    r = h.useRef(!1),
    l = h.useRef(void 0);
  return (
    h.useEffect(() => () => window.clearTimeout(l.current), []),
    h.useEffect(() => {
      if (n === 0) return;
      if (!r.current && ((r.current = !0), !t())) {
        const d = Math.max(0, 340 - (performance.now() - o.current));
        l.current = window.setTimeout(() => D("idle-paradigm-reveal-toast"), d);
      }
      i(!0);
      const c = window.setTimeout(() => {
        (i(!1), (r.current = !1), e(n));
      }, Vt);
      return () => window.clearTimeout(c);
    }, [n, e, t]),
    s
      ? a.jsxs("div", {
          className:
            "pointer-events-none absolute left-1/2 -translate-x-1/2 flex justify-center z-30",
          style: { top: 110, filter: "var(--px-ui-glow, none)" },
          children: [
            a.jsx("style", {
              children: `
          @keyframes paradigm-reveal-in {
            0%   { opacity: 0; transform: translateY(-4px); }
            6%   { opacity: 1; transform: translateY(0); }
            90%  { opacity: 1; transform: translateY(0); }
            100% { opacity: 0; transform: translateY(-4px); }
          }
        `,
            }),
            a.jsxs("div", {
              "data-test": "paradigm-reveal-toast",
              className:
                "relative px-3 py-1.5 pixel-cjk pixel-fs-md tracking-[0.05em] pixel-rgb-soft",
              style: {
                animation: `paradigm-reveal-in ${Vt}ms steps(8) forwards`,
                background: "#050811",
                color: "#fff",
                border: `2px solid ${Ne}`,
                boxShadow: `inset 0 0 0 2px #050811, 0 0 0 2px #050811, 4px 4px 0 0 ${Ne}33`,
              },
              children: [
                a.jsx("span", {
                  "aria-hidden": !0,
                  className: "absolute -left-3 top-1/2 -translate-y-1/2",
                  style: {
                    width: 8,
                    height: 8,
                    background: Ne,
                    animation: "tier-toast-blink 600ms steps(2) infinite",
                  },
                }),
                "高维范式 已解锁",
                a.jsx("span", {
                  "aria-hidden": !0,
                  className: "absolute -right-3 top-1/2 -translate-y-1/2",
                  style: {
                    width: 8,
                    height: 8,
                    background: Ne,
                    animation: "tier-toast-blink 600ms steps(2) infinite",
                  },
                }),
              ],
            }),
          ],
        })
      : null
  );
}
function Dr() {
  const n = b((x) => x.state.currentAlignment),
    { toasts: e, handleTransition: t } = Nr(),
    s = sn(),
    i = b((x) => x.state.facts),
    o = b((x) => x.syncManifoldReveal);
  h.useEffect(() => {
    o();
  }, [i, o]);
  const r = sa({ facts: i }) && !!i[ia];
  h.useEffect(() => {
    r && ra();
  }, [r]);
  const l = h.useRef(!1),
    [c, d] = h.useState(() => !i["compute.initialized"]),
    p = h.useCallback(() => {
      (d(!1),
        !l.current &&
          ((l.current = !0),
          s("client.emitFact", { factId: "compute.initialized" }).catch((x) => {
            (console.error("[IdleScreen] emit compute.initialized failed", x), (l.current = !1));
          })));
    }, [s]);
  return a.jsxs("div", {
    className:
      "pixel-idle pixel-scanlines relative w-full h-full overflow-hidden bg-[var(--px-void)] select-none",
    children: [
      a.jsx(Pa, { alignment: n }),
      c && a.jsx(ei, { onComplete: p }),
      a.jsx("div", { className: "absolute inset-0", children: a.jsx(Qs, { onTierTransition: t }) }),
      a.jsxs("div", {
        className: "absolute inset-0 pointer-events-none",
        children: [
          a.jsx(Tr, { toasts: e }),
          a.jsx(Ir, {}),
          a.jsx(ri, {}),
          a.jsx(ar, {}),
          a.jsx(pr, {}),
          a.jsx(jr, {}),
        ],
      }),
    ],
  });
}
export { Dr as IdleScreen };
