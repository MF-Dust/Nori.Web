const __vite__mapDeps = (
  i,
  m = __vite__mapDeps,
  d = m.f ||
    (m.f = [
      "assets/MarkdownBody-Ct_BWFHm.js",
      "assets/index-CyHAbkO5.js",
      "assets/i18n-DtIC1LRi.js",
      "assets/index-FU-0vwSE.css",
      "assets/openUrlInBrowser-VWrl1VvA.js",
      "assets/browserIntent-DuTqin6R.js",
      "assets/NormalApp-Cn6agT0F.js",
      "assets/NormalApp-B2xPBQgm.css",
      "assets/index-6t0U9yuc.js",
      "assets/QfrDock-D2m-2E_A.js",
      "assets/xterm-HnSM_fe4.js",
      "assets/xterm-DFuMZ0ql.css",
      "assets/fs-DU_Hg0ss.js",
    ]),
) => i.map((i) => d[i]);
import { j as e, _ as we } from "./index-CyHAbkO5.js";
import { r as i, u as U } from "./i18n-DtIC1LRi.js";
import {
  f as te,
  i as M,
  Q as oe,
  R as Z,
  Z as Se,
  _ as ce,
  b6 as de,
  b7 as ue,
  b8 as qe,
  b9 as Fe,
  I as Ue,
  z as He,
  U as Me,
  B as J,
  p as G,
  aE as De,
  ba as $e,
  bb as Ke,
  bc as Ge,
  aS as Qe,
  E as fe,
  aM as Xe,
  y as Ye,
  V as X,
  bd as Ze,
  be as me,
  L as xe,
  m as Je,
  W as et,
  aI as tt,
  A as st,
  Y as he,
} from "./NormalApp-Cn6agT0F.js";
import { r as nt, c as rt } from "./tree-BwnCy3ce.js";
import {
  c as se,
  d as ze,
  M as Ce,
  e as ee,
  L as Ee,
  f as Re,
  P as Ae,
  I as at,
  h as Te,
  g as _e,
  u as lt,
  a as it,
  F as ot,
  B as ct,
  b as dt,
  S as ut,
} from "./SealedVolumeAlert-CLn2CcA9.js";
import { L as ne } from "./lock-eIU2WcCi.js";
import { a as ft } from "./use-animation-B4di4aFs.js";
import { I as mt } from "./input-izesiKpE.js";
import { L as ie } from "./loader-circle-DfbEUp82.js";
import { P as xt } from "./panel-left-CHud9p7N.js";
import { A as ht, a as pt } from "./arrow-right-Ch5wSBwP.js";
import "./SidebarNavButton-jUmo5l7D.js";
import "./download-BfBW5oEI.js";
const gt = [
    ["rect", { width: "8", height: "5", x: "14", y: "17", rx: "1", key: "19aais" }],
    [
      "path",
      {
        d: "M10 20H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H20a2 2 0 0 1 2 2v2.5",
        key: "1w6v7t",
      },
    ],
    ["path", { d: "M20 17v-2a2 2 0 1 0-4 0v2", key: "pwaxnr" }],
  ],
  bt = te("folder-lock", gt);
const vt = [
    ["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }],
    ["path", { d: "M12 16v-4", key: "1dtifu" }],
    ["path", { d: "M12 8h.01", key: "e9boi3" }],
  ],
  jt = te("info", vt);
const kt = [
    ["rect", { width: "7", height: "7", x: "3", y: "3", rx: "1", key: "1g98yp" }],
    ["rect", { width: "7", height: "7", x: "14", y: "3", rx: "1", key: "6d4xhi" }],
    ["rect", { width: "7", height: "7", x: "14", y: "14", rx: "1", key: "nxv5o0" }],
    ["rect", { width: "7", height: "7", x: "3", y: "14", rx: "1", key: "1bb6yr" }],
  ],
  Nt = te("layout-grid", kt);
const yt = [
    ["path", { d: "M3 5h.01", key: "18ugdj" }],
    ["path", { d: "M3 12h.01", key: "nlz23k" }],
    ["path", { d: "M3 19h.01", key: "noohij" }],
    ["path", { d: "M8 5h13", key: "1pao27" }],
    ["path", { d: "M8 12h13", key: "1za7za" }],
    ["path", { d: "M8 19h13", key: "m83p4d" }],
  ],
  wt = te("list", yt);
function pe(r) {
  if (!r) return 1;
  const s = r.querySelectorAll("button");
  if (s.length <= 1) return 1;
  const t = s[0].offsetTop;
  let l = 1;
  for (let a = 1; a < s.length && s[a].offsetTop === t; a++) l += 1;
  return l;
}
function St(r) {
  if (!(r instanceof HTMLElement)) return !1;
  const s = r.tagName;
  return s === "INPUT" || s === "TEXTAREA" || s === "SELECT" || r.isContentEditable;
}
function Ft({
  entries: r,
  selectedKey: s,
  containerRef: t,
  onSelect: l,
  onOpen: a,
  onClear: o,
  onNavigateUp: u,
}) {
  return i.useCallback(
    (m) => {
      if (St(m.target)) return;
      const f = r.length,
        d = s ? r.findIndex((h) => h.key === s) : -1,
        c = (h) => {
          const w = r[h]?.key;
          w !== void 0 && (l(w), t.current?.querySelectorAll("button")[h]?.focus());
        };
      switch (m.key) {
        case "ArrowRight":
          if (!f) return;
          (m.preventDefault(), c(d < 0 ? 0 : Math.min(f - 1, d + 1)));
          return;
        case "ArrowLeft":
          if (!f) return;
          (m.preventDefault(), c(d < 0 ? 0 : Math.max(0, d - 1)));
          return;
        case "ArrowDown":
          if (!f) return;
          (m.preventDefault(), c(d < 0 ? 0 : Math.min(f - 1, d + pe(t.current))));
          return;
        case "ArrowUp":
          if (!f) return;
          (m.preventDefault(), c(d < 0 ? f - 1 : Math.max(0, d - pe(t.current))));
          return;
        case "Home":
          if (!f) return;
          (m.preventDefault(), c(0));
          return;
        case "End":
          if (!f) return;
          (m.preventDefault(), c(f - 1));
          return;
        case "Enter":
          if (d < 0) return;
          (m.preventDefault(), a(r[d].key));
          return;
        case "Escape":
          if (!s) return;
          (m.preventDefault(), o());
          return;
        case "Backspace":
          (m.preventDefault(), u());
          return;
      }
    },
    [r, s, t, l, a, o, u],
  );
}
const Mt = "grid grid-cols-[minmax(0,1fr)_88px_120px_104px_84px] items-center gap-3",
  Dt = "grid grid-cols-[minmax(0,1fr)_104px_84px] items-center gap-3";
function Ie(r) {
  return r ? Mt : Dt;
}
const zt = { text: ce, image: at, pdf: Ae, "training-log": Re };
function Q({ selected: r, showCipher: s, onSelect: t, onOpen: l, children: a }) {
  return e.jsx("button", {
    type: "button",
    onClick: t,
    onDoubleClick: l,
    className: M(
      "w-full border-b border-border/40 border-l-2 border-l-transparent px-4 py-2 text-left transition-colors",
      "hover:bg-muted/40 focus:bg-muted/40 focus:outline-none",
      r && "border-l-primary bg-primary/10 hover:bg-primary/15",
    ),
    children: e.jsx("div", { className: Ie(s), children: a }),
  });
}
const Ct = i.memo(function ({ name: s, selected: t, showCipher: l, onSelect: a, onOpen: o }) {
    return e.jsxs(Q, {
      selected: t,
      showCipher: l,
      onSelect: a,
      onOpen: o,
      children: [
        e.jsxs("div", {
          className: "flex min-w-0 items-center gap-2",
          children: [
            e.jsx(se, { className: "size-4 shrink-0 fill-sky-400/10 text-sky-400/90" }),
            e.jsx("span", { className: "truncate text-sm text-foreground", children: s }),
          ],
        }),
        l && e.jsx("div", {}),
        l && e.jsx("div", {}),
        e.jsx("div", { className: "text-xs text-muted-foreground" }),
        e.jsx("div", { className: "text-right text-xs text-muted-foreground", children: "—" }),
      ],
    });
  }),
  Et = i.memo(function ({
    label: s,
    sealed: t,
    selected: l,
    showCipher: a,
    onSelect: o,
    onOpen: u,
  }) {
    return e.jsxs(Q, {
      selected: l,
      showCipher: a,
      onSelect: o,
      onOpen: u,
      children: [
        e.jsxs("div", {
          className: "flex min-w-0 items-center gap-2",
          children: [
            t
              ? e.jsx(ze, { className: "size-4 shrink-0" })
              : e.jsx(Ce, { className: "size-4 shrink-0" }),
            e.jsx("span", { className: "truncate text-sm text-foreground", children: s }),
          ],
        }),
        a && e.jsx("div", {}),
        a && e.jsx("div", {}),
        e.jsx("div", { className: "text-xs text-muted-foreground" }),
        e.jsx("div", { className: "text-right text-xs text-muted-foreground", children: "—" }),
      ],
    });
  }),
  Rt = i.memo(function ({
    title: s,
    vaultKind: t = "folder",
    unlocked: l = !1,
    selected: a,
    showCipher: o,
    onSelect: u,
    onOpen: m,
  }) {
    const f = t === "file" ? ee : se,
      d = l ? Ee : ne;
    return e.jsxs(Q, {
      selected: a,
      showCipher: o,
      onSelect: u,
      onOpen: m,
      children: [
        e.jsxs("div", {
          className: "flex min-w-0 items-center gap-2",
          children: [
            e.jsxs("span", {
              className: "relative shrink-0",
              children: [
                e.jsx(f, { className: "size-4 text-muted-foreground" }),
                e.jsx(d, {
                  className: M(
                    "absolute -bottom-0.5 -right-0.5 size-2.5",
                    l ? "text-muted-foreground" : "text-amber-500",
                  ),
                }),
              ],
            }),
            e.jsx("span", { className: "truncate text-sm text-foreground", children: s }),
          ],
        }),
        o && e.jsx("div", {}),
        o && e.jsx("div", {}),
        e.jsx("div", { className: "text-xs text-muted-foreground" }),
        e.jsx("div", { className: "text-right text-xs text-muted-foreground", children: "—" }),
      ],
    });
  }),
  At = i.memo(function ({ file: s, selected: t, showCipher: l, onSelect: a, onOpen: o }) {
    if (oe(s) && !Z(s))
      return e.jsx(Tt, { file: s, selected: t, showCipher: l, onSelect: a, onOpen: o });
    const u = s.launch === "qfr" ? Se : zt[s.kind];
    return e.jsxs(Q, {
      selected: t,
      showCipher: l,
      onSelect: a,
      onOpen: o,
      children: [
        e.jsxs("div", {
          className: "flex min-w-0 items-center gap-2",
          children: [
            e.jsx(u, {
              className: M(
                "size-4 shrink-0",
                s.launch === "qfr" ? "text-[#4ee0c8]" : "text-muted-foreground",
              ),
            }),
            e.jsx("span", { className: "truncate text-sm text-foreground", children: s.name }),
          ],
        }),
        l && e.jsx("div", {}),
        l && e.jsx("div", {}),
        e.jsx("div", { className: "text-xs text-muted-foreground", children: Te(s.modifiedAt) }),
        e.jsx("div", {
          className: "text-right text-xs text-muted-foreground",
          children: _e(s.sizeBytes),
        }),
      ],
    });
  }),
  Tt = i.memo(function ({ file: s, selected: t, showCipher: l, onSelect: a, onOpen: o }) {
    const { t: u } = U(),
      m = de(s),
      { pct: f, stalled: d } = ue(s.threshold),
      c = d ? "#f1b24a" : "var(--nori-teal, #5eead4)";
    return e.jsxs(Q, {
      selected: t,
      showCipher: l,
      onSelect: a,
      onOpen: o,
      children: [
        e.jsxs("div", {
          className: "flex min-w-0 items-center gap-2",
          children: [
            e.jsxs("span", {
              className: "relative shrink-0",
              children: [
                e.jsx(ce, { className: "size-4 text-muted-foreground" }),
                e.jsx(ne, { className: "absolute -bottom-0.5 -right-0.5 size-2.5 text-amber-500" }),
              ],
            }),
            e.jsx("span", { className: "truncate text-sm text-foreground", children: s.name }),
          ],
        }),
        l &&
          e.jsx("div", {
            className: "font-mono text-[11px] text-muted-foreground",
            children: s.cipher,
          }),
        l &&
          e.jsx("div", {
            className: "flex items-center gap-1.5",
            children: m
              ? e.jsx("span", {
                  className: "font-mono text-[11px] text-muted-foreground",
                  children: u("files.lockedDialog.requiredUnknown"),
                })
              : d
                ? e.jsx("span", {
                    className: "text-[11px] text-amber-500",
                    children: u("files.recovery.stalled"),
                  })
                : e.jsxs(e.Fragment, {
                    children: [
                      e.jsx("span", {
                        className:
                          "relative h-[3px] w-10 overflow-hidden rounded-full bg-foreground/10",
                        children: e.jsx("span", {
                          className: "absolute inset-y-0 left-0 rounded-full",
                          style: { width: `${f}%`, background: c },
                        }),
                      }),
                      e.jsxs("span", {
                        className: "font-mono text-[10px] tabular-nums",
                        style: { color: c },
                        children: [f, "%"],
                      }),
                    ],
                  }),
          }),
        e.jsx("div", { className: "text-xs text-muted-foreground", children: Te(s.modifiedAt) }),
        e.jsx("div", {
          className: "text-right text-xs text-muted-foreground",
          children: _e(s.sizeBytes),
        }),
      ],
    });
  }),
  ge = "0123456789ABCDEF";
function be(r) {
  return ge[(r >> 4) & 15] + ge[r & 15];
}
function _t(r, s) {
  let t = (r * 2654435761 + s * 40503) >>> 0;
  return ((t = ((t ^ (t >>> 15)) * 739982445) >>> 0), (t = (t ^ (t >>> 12)) >>> 0), t & 255);
}
function Le({ seed: r, pct: s, stalled: t, paused: l, cols: a = 8, rows: o = 7, className: u }) {
  const m = i.useRef(null),
    f = qe(),
    d = i.useRef({ pct: s, stalled: t, paused: !!l || f });
  d.current = { pct: s, stalled: t, paused: !!l || f };
  const c = i.useRef(!0);
  return (
    (c.current = !0),
    i.useEffect(() => {
      const h = m.current;
      if (!h) return;
      const w = h.getContext("2d");
      if (!w) return;
      const N = Math.min(window.devicePixelRatio || 1, 2),
        j = a * o,
        C = new Array(j).fill(0);
      function A() {
        return Math.max(0, Math.min(1, d.current.pct / 100));
      }
      function b() {
        const p = w,
          k = h,
          S = k.clientWidth,
          E = k.clientHeight;
        if (S === 0 || E === 0) return;
        const { stalled: D } = d.current,
          P = A();
        p.clearRect(0, 0, S, E);
        const W = 8,
          L = 7,
          v = (S - W * 2) / a,
          q = (E - L * 2) / o,
          O = Math.round(P * j);
        ((p.font =
          "600 " + Math.min(11, q * 0.72).toFixed(1) + "px ui-monospace,Menlo,Consolas,monospace"),
          (p.textBaseline = "middle"),
          (p.textAlign = "center"));
        for (let z = 0; z < o; z++)
          for (let y = 0; y < a; y++) {
            const R = z * a + y,
              K = W + v * (y + 0.5),
              B = L + q * (z + 0.5);
            R < O
              ? ((p.fillStyle = "rgba(132,196,206,0.66)"), p.fillText(be(_t(r, R)), K, B))
              : ((p.fillStyle = D ? "rgba(190,160,96,0.42)" : "rgba(140,172,182,0.30)"),
                p.fillText(be(C[R]), K, B));
          }
        if (P > 0.001) {
          const z = L + q * Math.min(o, O / a),
            y = D ? "241,178,74" : "119,198,212",
            R = p.createLinearGradient(0, z - 3, 0, z + 3);
          (R.addColorStop(0, "rgba(" + y + ",0)"),
            R.addColorStop(0.5, "rgba(" + y + ",0.85)"),
            R.addColorStop(1, "rgba(" + y + ",0)"),
            (p.fillStyle = R),
            p.fillRect(W - 2, z - 2, S - W * 2 + 4, 3));
        }
      }
      function T() {
        const p = h,
          k = p.clientWidth,
          S = p.clientHeight;
        ((p.width = Math.max(1, Math.round(k * N))),
          (p.height = Math.max(1, Math.round(S * N))),
          w.setTransform(N, 0, 0, N, 0, 0),
          b());
      }
      function V() {
        const p = Math.round(A() * j);
        for (let k = p; k < j; k++) C[k] = (C[k] + 1 + ((k * 73 + (C[k] << 3)) & 7)) & 255;
        b();
      }
      const _ = new ResizeObserver(() => T());
      (_.observe(h), T());
      let I = 0,
        H = 0;
      const ae = 125;
      function $(p) {
        ((I = requestAnimationFrame($)),
          !d.current.paused && A() < 1
            ? p - H >= ae && ((H = p), V(), (c.current = !1))
            : c.current && (b(), (c.current = !1)));
      }
      return (
        (I = requestAnimationFrame($)),
        () => {
          (cancelAnimationFrame(I), _.disconnect());
        }
      );
    }, [r, a, o]),
    e.jsx("canvas", { ref: m, className: u, "aria-hidden": !0 })
  );
}
function Oe(r) {
  let s = 2166136261;
  for (let t = 0; t < r.length; t++) ((s ^= r.charCodeAt(t)), (s = Math.imul(s, 16777619)));
  return s >>> 0;
}
function re({ label: r, selected: s, onSelect: t, onOpen: l, children: a }) {
  return e.jsxs("button", {
    type: "button",
    onClick: t,
    onDoubleClick: l,
    title: r,
    className: M(
      "group flex flex-col items-center gap-2 rounded-xl p-3 transition-[background-color,box-shadow] duration-200",
      "focus:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-primary/40",
      s ? "bg-primary/10 ring-1 ring-inset ring-primary/30" : "hover:bg-muted/40",
    ),
    children: [
      e.jsx("div", {
        className:
          "flex h-20 w-full items-center justify-center transition-transform duration-200 group-hover:scale-[1.04] group-active:scale-95",
        children: a,
      }),
      e.jsx("span", {
        className: M(
          "line-clamp-2 max-w-full break-words rounded px-1 text-center text-xs",
          s ? "font-medium text-primary" : "text-foreground/90",
        ),
        children: r,
      }),
    ],
  });
}
const It = i.memo(function ({ name: s, selected: t, onSelect: l, onOpen: a }) {
    return e.jsx(re, {
      label: s,
      selected: t,
      onSelect: l,
      onOpen: a,
      children: e.jsx(se, {
        className: "size-14 fill-sky-400/10 text-sky-400/90",
        strokeWidth: 1.25,
      }),
    });
  }),
  Lt = i.memo(function ({ label: s, sealed: t, selected: l, onSelect: a, onOpen: o }) {
    return e.jsx(re, {
      label: s,
      selected: l,
      onSelect: a,
      onOpen: o,
      children: t ? e.jsx(ze, { className: "size-14" }) : e.jsx(Ce, { className: "size-14" }),
    });
  }),
  Ot = i.memo(function ({
    title: s,
    vaultKind: t = "folder",
    unlocked: l = !1,
    selected: a,
    onSelect: o,
    onOpen: u,
  }) {
    const m = t === "file" ? ee : se,
      f = l ? Ee : ne;
    return e.jsx(re, {
      label: s,
      selected: a,
      onSelect: o,
      onOpen: u,
      children: e.jsxs("span", {
        className: "relative",
        children: [
          e.jsx(m, { className: "size-14 text-muted-foreground/70", strokeWidth: 1.25 }),
          e.jsx(f, {
            className: M(
              "absolute bottom-0 right-0 size-5",
              l ? "text-muted-foreground" : "text-amber-500",
            ),
            strokeWidth: 2,
          }),
        ],
      }),
    });
  }),
  Bt = i.memo(function ({ file: s, selected: t, onSelect: l, onOpen: a }) {
    return oe(s) && !Z(s)
      ? e.jsx(Vt, { file: s, selected: t, onSelect: l, onOpen: a })
      : e.jsx(re, {
          label: s.name,
          selected: t,
          onSelect: l,
          onOpen: a,
          children:
            s.kind === "image"
              ? e.jsx("img", {
                  src: s.imageSrc,
                  alt: s.alt,
                  className:
                    "max-h-20 max-w-full rounded-md object-contain shadow-sm ring-1 ring-border/40",
                  draggable: !1,
                })
              : s.kind === "pdf"
                ? e.jsx(Ae, { className: "size-14 text-muted-foreground" })
                : s.kind === "training-log"
                  ? e.jsx(Re, { className: "size-14 text-muted-foreground", strokeWidth: 1.25 })
                  : s.launch === "qfr"
                    ? e.jsx(Se, { className: "size-14 text-[#4ee0c8]", strokeWidth: 1.25 })
                    : e.jsx(ce, { className: "size-14 text-muted-foreground", strokeWidth: 1.25 }),
        });
  }),
  Vt = i.memo(function ({ file: s, selected: t, onSelect: l, onOpen: a }) {
    const { t: o } = U(),
      u = Fe(),
      m = de(s),
      { pct: f, stalled: d } = ue(s.threshold);
    return e.jsxs("button", {
      type: "button",
      onClick: l,
      onDoubleClick: a,
      title: s.name,
      className: M(
        "group flex flex-col items-center gap-1.5 rounded-xl p-3 transition-[background-color,box-shadow] duration-200",
        "focus:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-primary/40",
        t ? "bg-primary/10 ring-1 ring-inset ring-primary/30" : "hover:bg-muted/40",
      ),
      children: [
        e.jsxs("div", {
          className:
            "relative h-20 w-full overflow-hidden rounded-lg border border-border/50 bg-[#0a1119]",
          children: [
            e.jsx(Le, {
              seed: Oe(s.id),
              pct: m ? 0 : f,
              stalled: m ? !1 : d,
              paused: !!u,
              className: "block h-full w-full",
            }),
            e.jsx("span", {
              className:
                "absolute bottom-1 right-1 flex size-4 items-center justify-center rounded bg-background/60 text-amber-500",
              children: e.jsx(ne, { className: "size-2.5", strokeWidth: 2.5 }),
            }),
          ],
        }),
        e.jsxs("div", {
          className: "flex w-full items-center gap-1.5",
          children: [
            e.jsx("span", {
              className: "shrink-0 font-mono text-[9px] text-muted-foreground",
              children: s.cipher,
            }),
            m
              ? e.jsx("span", {
                  className: "flex-1 text-center font-mono text-[10px] text-muted-foreground",
                  children: o("files.lockedDialog.requiredUnknown"),
                })
              : e.jsxs(e.Fragment, {
                  children: [
                    e.jsx("span", {
                      className:
                        "relative h-[3px] flex-1 overflow-hidden rounded-full bg-foreground/10",
                      children: e.jsx("span", {
                        className:
                          "absolute inset-y-0 left-0 rounded-full transition-[width] duration-500 ease-out",
                        style: {
                          width: `${f}%`,
                          background: d ? "#f1b24a" : "var(--nori-teal, #5eead4)",
                        },
                      }),
                    }),
                    e.jsxs("span", {
                      className: "shrink-0 font-mono text-[10px] tabular-nums",
                      style: { color: d ? "#f1b24a" : "var(--nori-teal, #5eead4)" },
                      children: [f, "%"],
                    }),
                  ],
                }),
          ],
        }),
        e.jsx("span", {
          className: "line-clamp-2 max-w-full break-words text-center text-xs text-foreground/90",
          children: s.name,
        }),
      ],
    });
  });
async function Pt(r, s, t, l) {
  const a = await Ue(r, s, { puzzleId: t, tokens: l });
  return a.ok ? { ok: (a.result ?? {}).ok === !0 } : { ok: !1 };
}
const Wt = i.lazy(() =>
  we(() => import("./MarkdownBody-Ct_BWFHm.js"), __vite__mapDeps([0, 1, 2, 3, 4, 5, 6, 7, 8])),
);
function qt({ vault: r, onCancel: s, onUnlocked: t }) {
  const { t: l } = U(),
    a = He(),
    o = i.useRef(null),
    u = ft(),
    [m, f] = i.useState(!1),
    [d, c] = i.useState("idle"),
    h = d === "submitting",
    w = d === "wrong" || d === "error",
    N = r.vaultPath.split("/").filter(Boolean).at(-1) ?? r.title,
    j = (b) => {
      (c(b),
        G("webapps-files-vault-wrong-pass"),
        o.current && (o.current.value = ""),
        f(!1),
        u.start({ x: [0, -8, 8, -6, 6, -3, 0], transition: { duration: 0.42, ease: "easeInOut" } }),
        o.current?.focus());
    },
    C = async (b) => {
      b.preventDefault();
      const T = o.current?.value ?? "";
      if (!(!a || h || T.trim().length === 0)) {
        c("submitting");
        try {
          if ((await Pt(a, r.command, r.puzzleId, [T])).ok) {
            (G("webapps-files-vault-unlock"), t(r));
            return;
          }
          (await new Promise((_) => setTimeout(_, 900)), j("wrong"));
        } catch (V) {
          (console.warn("[Files] Vault unlock failed:", V), j("error"));
        }
      }
    },
    A = d === "wrong" ? l("files.vault.wrong") : d === "error" ? l("files.vault.error") : "";
  return e.jsx(Me, {
    frameClassName: "w-[min(23rem,calc(100%-1rem))]",
    onEscape: h ? void 0 : s,
    surfaceAnimate: u,
    role: "alertdialog",
    ariaLabel: N,
    children: e.jsxs("form", {
      onSubmit: C,
      children: [
        e.jsxs("div", {
          className: "flex gap-4",
          children: [
            e.jsx(bt, {
              className: "mt-0.5 size-10 shrink-0 text-muted-foreground",
              strokeWidth: 1.25,
            }),
            e.jsxs("div", {
              className: "min-w-0 flex-1",
              children: [
                e.jsx("h2", {
                  className: "text-sm font-semibold leading-snug text-foreground",
                  children: l("files.vault.title", { name: N }),
                }),
                e.jsxs("div", {
                  className: "mt-3.5 space-y-2",
                  children: [
                    e.jsx(mt, {
                      ref: o,
                      type: "text",
                      autoComplete: "off",
                      spellCheck: !1,
                      onChange: (b) => {
                        (f(b.currentTarget.value.trim().length > 0), w && c("idle"));
                      },
                      disabled: h,
                      placeholder: r.placeholder ?? l("files.vault.placeholder"),
                      autoFocus: !0,
                      "aria-label": l("files.vault.placeholder"),
                      "aria-invalid": w,
                    }),
                    r.hint &&
                      e.jsx("div", {
                        className: "text-[12px] leading-relaxed text-muted-foreground",
                        children: e.jsx(i.Suspense, {
                          fallback: e.jsx("p", {
                            children: (l("files.vault.hintLabel") + r.hint).replaceAll("**", ""),
                          }),
                          children: e.jsx(Wt, { source: l("files.vault.hintLabel") + r.hint }),
                        }),
                      }),
                    e.jsx("p", {
                      className: M(
                        "min-h-4 text-[12px] leading-tight",
                        w ? "text-destructive" : "text-transparent",
                      ),
                      "aria-live": "polite",
                      children: A || " ",
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
        e.jsxs("div", {
          className: "mt-2 flex justify-end gap-2",
          children: [
            e.jsx(J, {
              type: "button",
              variant: "ghost",
              onClick: s,
              disabled: h,
              children: l("files.vault.cancel"),
            }),
            e.jsx(J, {
              type: "submit",
              disabled: h || !m,
              children: h
                ? e.jsxs(e.Fragment, {
                    children: [
                      e.jsx(ie, { className: "size-4 animate-spin" }),
                      l("files.vault.submitting"),
                    ],
                  })
                : l("files.vault.submit"),
            }),
          ],
        }),
      ],
    }),
  });
}
function ve(r) {
  return "1e" + Math.round(Math.log10(r));
}
function Ut({ file: r, onClose: s }) {
  const { t } = U(),
    l = De(),
    a = de(r),
    { pct: o, stalled: u } = ue(r.threshold),
    m = $e((h) => Ke(Math.min(h.state.maxComputeThisRun, Ge(h.state)))),
    f = r.cipher ?? "RSA-2048",
    d = u ? "#f1b24a" : "var(--nori-teal, #5eead4)",
    c = () => {
      (l({ appId: "idle", mode: "activate" }), s());
    };
  return e.jsxs(Me, {
    frameClassName: "w-[min(30rem,calc(100%-1rem))]",
    onScrimClick: s,
    onEscape: s,
    sfx: !1,
    children: [
      e.jsxs("div", {
        className: "min-w-0",
        children: [
          e.jsx("h2", {
            className: "truncate text-sm font-semibold leading-snug text-foreground",
            children: r.name,
          }),
          e.jsxs("div", {
            className: "mt-1.5 flex items-center gap-2 text-[11px]",
            children: [
              e.jsx("span", {
                className:
                  "rounded-md border border-border/60 bg-muted/40 px-1.5 py-0.5 font-mono text-muted-foreground",
                children: f,
              }),
              e.jsx("span", {
                className: M(
                  a
                    ? "font-mono text-muted-foreground"
                    : u
                      ? "text-amber-500"
                      : "text-[var(--nori-teal,#5eead4)]",
                ),
                children: t(
                  a
                    ? "files.lockedDialog.requiredUnknown"
                    : u
                      ? "files.recovery.stalled"
                      : "files.recovery.recovering",
                ),
              }),
            ],
          }),
        ],
      }),
      e.jsxs("div", {
        className:
          "relative mt-4 overflow-hidden rounded-xl border border-border/50 bg-[#0a1119] px-4 pb-3.5 pt-3.5",
        children: [
          e.jsx(Le, {
            seed: Oe(r.id),
            pct: a ? 0 : o,
            stalled: a ? !1 : u,
            cols: 20,
            rows: 6,
            className: "absolute inset-0 h-full w-full opacity-30",
          }),
          e.jsxs("div", {
            className: "relative",
            children: [
              e.jsx("div", {
                className: "text-[11px] tracking-[0.16em] text-muted-foreground",
                children: t("files.lockedDialog.required"),
              }),
              e.jsx("div", {
                className:
                  "mt-0.5 font-mono text-[40px] font-bold leading-[1.1] text-[var(--nori-teal,#5eead4)]",
                children:
                  r.threshold != null ? ve(r.threshold) : t("files.lockedDialog.requiredUnknown"),
              }),
              r.threshold != null &&
                e.jsxs(e.Fragment, {
                  children: [
                    e.jsxs("div", {
                      className: "mt-3 flex items-baseline justify-between text-xs",
                      children: [
                        e.jsxs("span", {
                          className: "text-foreground/90",
                          children: [
                            t("files.lockedDialog.currentCompute"),
                            " ",
                            e.jsx("b", {
                              className: M("font-mono tabular-nums", u && "text-amber-500"),
                              children: m,
                            }),
                          ],
                        }),
                        e.jsxs("span", {
                          className: "font-mono tabular-nums text-muted-foreground",
                          children: [o, "%"],
                        }),
                      ],
                    }),
                    e.jsx("div", {
                      className: "mt-2 h-1.5 overflow-hidden rounded-full bg-foreground/10",
                      children: e.jsx("div", {
                        className: "h-full rounded-full transition-[width] duration-500 ease-out",
                        style: { width: `${o}%`, background: d },
                      }),
                    }),
                    e.jsxs("div", {
                      className:
                        "mt-1 flex justify-between font-mono text-[10px] text-muted-foreground/60",
                      children: [
                        e.jsx("span", { children: "1" }),
                        e.jsx("span", { children: ve(r.threshold) }),
                      ],
                    }),
                  ],
                }),
            ],
          }),
        ],
      }),
      !a &&
        u &&
        e.jsx("p", {
          className: "mt-2.5 text-[11.5px] leading-relaxed text-amber-500/90",
          children: t("files.recovery.stalledHint"),
        }),
      e.jsxs("div", {
        className:
          "mt-4 flex flex-wrap gap-x-6 gap-y-2 border-t border-border/40 pt-3 font-mono text-[11px] text-muted-foreground",
        children: [
          e.jsx(je, { k: t("files.lockedDialog.chain"), v: `${f} → VMK → FVEK` }),
          e.jsx(je, { k: t("files.lockedDialog.volume"), v: "AES-256-XTS" }),
        ],
      }),
      e.jsxs("div", {
        className: "mt-4 flex justify-end gap-2",
        children: [
          e.jsx(J, {
            type: "button",
            variant: "ghost",
            onClick: s,
            children: t("files.lockedDialog.close"),
          }),
          !a &&
            e.jsx(J, {
              type: "button",
              onClick: c,
              children: t("files.lockedDialog.raiseCompute"),
            }),
        ],
      }),
    ],
  });
}
function je({ k: r, v: s }) {
  return e.jsxs("span", {
    className: "flex flex-col gap-0.5",
    children: [
      e.jsx("span", {
        className: "text-[9.5px] uppercase tracking-wider text-muted-foreground/70",
        children: r,
      }),
      e.jsx("span", { className: "text-foreground/90", children: s }),
    ],
  });
}
const Ht = "/app-icons/files/icon-a.png",
  $t = 36;
function Kt(r) {
  return 38 + ((r * 53) % 46);
}
function Gt(r) {
  return (r * 137) % 1400;
}
function Qt() {
  const { t: r } = U();
  return e.jsxs("div", {
    className:
      "relative flex h-full flex-col items-center justify-center overflow-hidden px-8 text-center",
    children: [
      e.jsx("div", {
        "aria-hidden": !0,
        className:
          "pointer-events-none absolute inset-0 select-none p-3 [contain:layout_paint_style] [mask-image:radial-gradient(ellipse_at_center,transparent_26%,black_80%)]",
        children: e.jsx("div", {
          className: "grid grid-cols-[repeat(auto-fill,minmax(108px,1fr))] gap-1.5",
          children: Array.from({ length: $t }, (s, t) =>
            e.jsxs(
              "div",
              {
                className:
                  "flex flex-col items-center gap-2 rounded-xl p-3 motion-safe:animate-pulse [animation-duration:2.8s]",
                style: { animationDelay: `${Gt(t)}ms` },
                children: [
                  e.jsx("div", {
                    className: "flex h-20 w-full items-center justify-center",
                    children: e.jsx("div", {
                      className: "size-14 rounded-lg bg-muted-foreground/10",
                    }),
                  }),
                  e.jsx("div", {
                    className: "h-2 rounded-full bg-muted-foreground/10",
                    style: { width: `${Kt(t)}%` },
                  }),
                ],
              },
              t,
            ),
          ),
        }),
      }),
      e.jsxs("div", {
        className: "relative z-10 flex flex-col items-center gap-3",
        children: [
          e.jsx("img", {
            src: Ht,
            alt: "",
            draggable: !1,
            className: "size-16 opacity-80 grayscale",
          }),
          e.jsxs("div", {
            className: "space-y-1",
            children: [
              e.jsx("div", {
                className: "text-sm font-medium text-foreground",
                children: r("files.syncError.title"),
              }),
              e.jsx("div", {
                className: "max-w-xs text-xs text-muted-foreground",
                children: r("files.syncError.body"),
              }),
            ],
          }),
        ],
      }),
    ],
  });
}
const Xt = i.lazy(() =>
  we(() => import("./QfrDock-D2m-2E_A.js"), __vite__mapDeps([9, 1, 2, 3, 10, 11, 12, 6, 7])).then(
    (r) => ({ default: r.QfrDock }),
  ),
);
function Yt(r) {
  const s = rt(r).map((a) => ({ kind: "folder", key: `folder:${a.path}`, node: a })),
    t = r.vaults.map((a) => ({ kind: "vault", key: `vault:${a.id}`, vault: a })),
    l = [...r.files]
      .sort((a, o) => {
        const u = he(a),
          m = he(o);
        if (u !== m) return u - m;
        const f = a.tierOrder ?? 0,
          d = o.tierOrder ?? 0;
        if (f !== d) return f - d;
        const c = a.sortMs != null,
          h = o.sortMs != null;
        return c !== h
          ? c
            ? -1
            : 1
          : a.sortMs != null && o.sortMs != null
            ? o.sortMs - a.sortMs
            : new Date(o.modifiedAt).getTime() - new Date(a.modifiedAt).getTime();
      })
      .map((a) => ({ kind: "file", key: `file:${a.id}`, file: a }));
  return [...s, ...t, ...l];
}
const ke = "inline-flex items-center rounded-lg bg-muted/40 p-0.5 ring-1 ring-inset ring-border/60",
  Y =
    "flex size-7 items-center justify-center rounded-[7px] text-muted-foreground transition-colors hover:bg-background/50 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-muted-foreground",
  Ne = "bg-background/80 text-foreground shadow-sm ring-1 ring-inset ring-border/50",
  ye =
    "flex size-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent",
  Zt = 224,
  Jt = 600,
  es = [0.32, 0.72, 0, 1],
  ts = "下载",
  hs = i.memo(function (s) {
    const { t } = U(),
      l = De(),
      a = Qe(),
      o = fe("system.repaired"),
      u = fe("qfr.installed"),
      m = Xe(),
      { tree: f, isLoading: d } = lt(),
      c = it(""),
      [h, w] = i.useState("grid"),
      [N, j] = i.useState(null),
      [C, A] = i.useState(null),
      [b, T] = i.useState(null),
      [V, _] = i.useState(!1),
      [I, H] = i.useState(!0),
      ae = Fe();
    Ye(
      C
        ? `vault:${C.id}`
        : b
          ? `file:${b.id}`
          : N?.startsWith("file:") || N?.startsWith("vault:")
            ? N
            : "file:root",
    );
    const $ = i.useRef(null),
      p = i.useRef(null),
      k = i.useRef(!1);
    i.useEffect(() => {
      const n = $.current;
      if (!n) return;
      const x = new ResizeObserver((g) => {
        const le = (g[0]?.contentRect.width ?? 0) < Jt;
        le !== k.current && ((k.current = le), H(!le));
      });
      return (x.observe(n), () => x.disconnect());
    }, []);
    const S = i.useMemo(() => nt(f, c.path), [f, c.path]),
      E = i.useMemo(() => {
        if (!S) return [];
        const n = Yt(S);
        if (c.path !== "") return n;
        const x = n.filter((F) => !(F.kind === "folder" && F.node.path === X));
        return [{ kind: "device", key: "device:cold-volume", sealed: !u }, ...x];
      }, [S, c.path, u]),
      D = c.path === X,
      P = i.useMemo(() => S?.files ?? [], [S]),
      W = Ze((n) => n.decrypting),
      L = c.path === ts && !d && E.length === 0,
      v = i.useCallback(
        (n) => {
          (c.go(n), j(null));
        },
        [c],
      ),
      q = i.useRef(c.path),
      O = i.useRef(!1);
    i.useEffect(() => {
      const n = q.current;
      if (c.path === n) return;
      if (((q.current = c.path), O.current)) {
        O.current = !1;
        return;
      }
      const x = (g) => g.split("/").filter(Boolean).length;
      G("webapps-files-open-folder", x(c.path) < x(n) ? { pitch: 0.92 } : void 0);
    }, [c.path]);
    const z = i.useCallback(() => {
        (G("webapps-files-locked-file"), _(!0));
      }, []),
      y = me((n) => n.pending),
      R = me((n) => n.clear);
    i.useEffect(() => {
      y &&
        (A(null),
        T(null),
        _(!1),
        v(y.payload.folderPath),
        y.payload.selectKey && j(y.payload.selectKey),
        R());
    }, [y, v, R]);
    const K = i.useCallback(
        (n) => {
          l({ appId: "preview", mode: "launch", args: { fileId: n } });
        },
        [l],
      ),
      B = i.useCallback(
        (n) => {
          if (n.kind === "folder") v(n.node.path);
          else if (n.kind === "device") n.sealed ? z() : v(X);
          else if (n.kind === "vault")
            n.vault.unlocked
              ? xe({
                  appId: "files",
                  icon: ee,
                  title: t("os.files.alreadyUnpacked"),
                  subtitle: n.vault.title,
                  autoDismissMs: 4e3,
                })
              : A(n.vault);
          else if (n.file.launch === "qfr")
            u
              ? v(X)
              : a("client.emitFact", { factId: "qfr.installing" }).catch((x) => {
                  console.error("[Files] emit qfr.installing failed", x);
                });
          else if (oe(n.file) && !Z(n.file)) (G("webapps-files-locked-file"), T(n.file));
          else if (n.file.openEmitsFact !== void 0) {
            if (n.file.openSentinelFact && m.has(n.file.openSentinelFact)) {
              xe({
                appId: "files",
                icon: ee,
                title: t("os.files.alreadyUnpacked"),
                subtitle: n.file.name,
                autoDismissMs: 4e3,
              });
              return;
            }
            const x = n.file.openEmitsFact;
            a("client.emitFact", { factId: x }).catch((g) => {
              console.error(`[Files] emit ${x} failed`, g);
            });
          } else K(n.file.id);
        },
        [v, z, K, a, u, m, t],
      ),
      Be = i.useCallback(() => {
        const n = c.path.split("/").slice(0, -1).join("/");
        v(n);
      }, [c.path, v]),
      Ve = i.useCallback((n) => {
        n.target.closest("button") || (j(null), p.current?.focus({ preventScroll: !0 }));
      }, []),
      Pe = Ft({
        entries: E,
        selectedKey: N,
        containerRef: p,
        onSelect: j,
        onOpen: i.useCallback(
          (n) => {
            const x = E.find((g) => g.key === n);
            x && B(x);
          },
          [E, B],
        ),
        onClear: i.useCallback(() => j(null), []),
        onNavigateUp: Be,
      });
    (i.useEffect(() => {
      if (!o) return;
      const n = p.current;
      if (!n) return;
      const x = document.activeElement;
      (x === null || x === document.body) && n.focus({ preventScroll: !0 });
    }, [o, c.path]),
      i.useEffect(() => {
        if (!b) return;
        const n = P.find((x) => x.id === b.id);
        n && Z(n) && T(null);
      }, [b, P]));
    const We = i.useCallback(
      (n) => {
        (A(null),
          n.vaultKind === "file"
            ? n.unpackTo && ((O.current = !0), v(n.unpackTo))
            : ((O.current = !0), v(n.vaultPath)));
      },
      [v],
    );
    return o
      ? e.jsxs("div", {
          ref: $,
          className: "relative flex h-full overflow-hidden animate-in fade-in duration-700",
          children: [
            e.jsx(Je.div, {
              initial: !1,
              animate: { width: I ? Zt : 0 },
              transition: ae ? { duration: 0 } : { duration: 0.24, ease: es },
              className: "shrink-0 overflow-hidden",
              children: e.jsx("div", {
                className: "h-full w-56",
                children: e.jsx(ot, {
                  currentPath: c.path,
                  onSelectFolder: v,
                  qfrInstalled: u,
                  onSealedClick: z,
                }),
              }),
            }),
            e.jsxs("div", {
              className: "flex min-w-0 flex-1 flex-col",
              children: [
                e.jsxs("div", {
                  className:
                    "flex items-center gap-2 border-b border-border/50 bg-muted/15 px-3 py-2",
                  children: [
                    e.jsx("button", {
                      type: "button",
                      className: ye,
                      onClick: () => H((n) => !n),
                      "aria-label": t(
                        I ? "files.toolbar.hideSidebar" : "files.toolbar.showSidebar",
                      ),
                      title: t(I ? "files.toolbar.hideSidebar" : "files.toolbar.showSidebar"),
                      "aria-pressed": I,
                      children: e.jsx(xt, { className: "size-4" }),
                    }),
                    e.jsxs("div", {
                      className: ke,
                      children: [
                        e.jsx("button", {
                          type: "button",
                          className: Y,
                          onClick: c.back,
                          disabled: !c.canBack,
                          "aria-label": t("files.nav.back"),
                          title: t("files.nav.back"),
                          children: e.jsx(ht, { className: "size-4" }),
                        }),
                        e.jsx("span", {
                          className: "mx-px h-4 w-px bg-border/60",
                          "aria-hidden": !0,
                        }),
                        e.jsx("button", {
                          type: "button",
                          className: Y,
                          onClick: c.forward,
                          disabled: !c.canForward,
                          "aria-label": t("files.nav.forward"),
                          title: t("files.nav.forward"),
                          children: e.jsx(pt, { className: "size-4" }),
                        }),
                      ],
                    }),
                    e.jsx("button", {
                      type: "button",
                      className: ye,
                      onClick: () => v(""),
                      disabled: c.path === "",
                      "aria-label": t("files.nav.up"),
                      title: t("files.nav.up"),
                      children: e.jsx(et, { className: "size-4" }),
                    }),
                    e.jsx("div", {
                      className: "min-w-0 flex-1",
                      children: e.jsx(ct, { path: c.path, onNavigate: v }),
                    }),
                    e.jsxs("div", {
                      className: ke,
                      children: [
                        e.jsx("button", {
                          type: "button",
                          className: M(Y, h === "grid" && Ne),
                          onClick: () => w("grid"),
                          "aria-label": t("files.view.grid"),
                          title: t("files.view.grid"),
                          children: e.jsx(Nt, { className: "size-4" }),
                        }),
                        e.jsx("button", {
                          type: "button",
                          className: M(Y, h === "list" && Ne),
                          onClick: () => w("list"),
                          "aria-label": t("files.view.list"),
                          title: t("files.view.list"),
                          children: e.jsx(wt, { className: "size-4" }),
                        }),
                      ],
                    }),
                  ],
                }),
                c.path === "" &&
                  e.jsxs("div", {
                    className:
                      "flex items-center gap-2 border-b border-amber-500/25 bg-amber-500/10 px-4 py-2 text-[12px] leading-snug text-amber-600 dark:text-amber-400",
                    children: [
                      e.jsx(tt, { className: "size-3.5 shrink-0" }),
                      e.jsx("span", { children: t("files.warning.serverCorrupt") }),
                    ],
                  }),
                L &&
                  e.jsxs("div", {
                    className:
                      "flex items-center gap-2 border-b border-border/50 bg-muted/20 px-4 py-2 text-[12px] leading-snug text-muted-foreground",
                    children: [
                      e.jsx(jt, { className: "size-3.5 shrink-0" }),
                      e.jsx("span", { children: t("files.downloadsEmpty") }),
                    ],
                  }),
                h === "list" &&
                  !L &&
                  e.jsxs("div", {
                    className: M(
                      Ie(D),
                      "border-b border-border/50 bg-muted/10 px-4 py-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70",
                    ),
                    children: [
                      e.jsx("div", { children: t("files.columns.name") }),
                      D && e.jsx("div", { children: t("files.columns.cipher") }),
                      D && e.jsx("div", { children: t("files.columns.recovery") }),
                      e.jsx("div", { children: t("files.columns.modified") }),
                      e.jsx("div", { className: "text-right", children: t("files.columns.size") }),
                    ],
                  }),
                e.jsx("div", {
                  ref: p,
                  tabIndex: -1,
                  onKeyDown: Pe,
                  onClick: Ve,
                  className: "flex-1 overflow-auto outline-none",
                  children:
                    D && W
                      ? e.jsxs("div", {
                          className:
                            "flex h-full flex-col items-center justify-center gap-3 text-center",
                          children: [
                            e.jsx(ie, {
                              className: "size-5 animate-spin text-[var(--nori-teal,#5eead4)]",
                            }),
                            e.jsx("div", {
                              className: "text-sm text-muted-foreground",
                              children: t("files.decrypting"),
                            }),
                          ],
                        })
                      : d
                        ? e.jsx("div", {
                            className: "flex h-full items-center justify-center",
                            children: e.jsx(ie, {
                              className: "size-5 animate-spin text-muted-foreground/70",
                            }),
                          })
                        : !S || E.length === 0
                          ? L
                            ? null
                            : e.jsxs("div", {
                                className:
                                  "flex h-full flex-col items-center justify-center gap-3 text-center",
                                children: [
                                  e.jsx(dt, {
                                    className: "size-10 text-muted-foreground/40",
                                    strokeWidth: 1.25,
                                  }),
                                  e.jsx("div", {
                                    className: "text-sm text-muted-foreground",
                                    children: t("files.empty"),
                                  }),
                                ],
                              })
                          : h === "grid"
                            ? e.jsx("div", {
                                className:
                                  "grid grid-cols-[repeat(auto-fill,minmax(108px,1fr))] gap-1.5 p-3",
                                children: E.map((n) => {
                                  const x = n.key === N,
                                    g = () => j(n.key),
                                    F = () => B(n);
                                  return n.kind === "folder"
                                    ? e.jsx(
                                        It,
                                        { name: n.node.name, selected: x, onSelect: g, onOpen: F },
                                        n.key,
                                      )
                                    : n.kind === "device"
                                      ? e.jsx(
                                          Lt,
                                          {
                                            label: t("files.sidebar.coldVolume"),
                                            sealed: n.sealed,
                                            selected: x,
                                            onSelect: g,
                                            onOpen: F,
                                          },
                                          n.key,
                                        )
                                      : n.kind === "vault"
                                        ? e.jsx(
                                            Ot,
                                            {
                                              title: n.vault.title,
                                              vaultKind: n.vault.vaultKind,
                                              unlocked: n.vault.unlocked ?? !1,
                                              selected: x,
                                              onSelect: g,
                                              onOpen: F,
                                            },
                                            n.key,
                                          )
                                        : e.jsx(
                                            Bt,
                                            { file: n.file, selected: x, onSelect: g, onOpen: F },
                                            n.key,
                                          );
                                }),
                              })
                            : E.map((n) => {
                                const x = n.key === N,
                                  g = () => j(n.key),
                                  F = () => B(n);
                                return n.kind === "folder"
                                  ? e.jsx(
                                      Ct,
                                      {
                                        name: n.node.name,
                                        selected: x,
                                        showCipher: D,
                                        onSelect: g,
                                        onOpen: F,
                                      },
                                      n.key,
                                    )
                                  : n.kind === "device"
                                    ? e.jsx(
                                        Et,
                                        {
                                          label: t("files.sidebar.coldVolume"),
                                          sealed: n.sealed,
                                          selected: x,
                                          showCipher: D,
                                          onSelect: g,
                                          onOpen: F,
                                        },
                                        n.key,
                                      )
                                    : n.kind === "vault"
                                      ? e.jsx(
                                          Rt,
                                          {
                                            title: n.vault.title,
                                            vaultKind: n.vault.vaultKind,
                                            unlocked: n.vault.unlocked ?? !1,
                                            selected: x,
                                            showCipher: D,
                                            onSelect: g,
                                            onOpen: F,
                                          },
                                          n.key,
                                        )
                                      : e.jsx(
                                          At,
                                          {
                                            file: n.file,
                                            selected: x,
                                            showCipher: D,
                                            onSelect: g,
                                            onOpen: F,
                                          },
                                          n.key,
                                        );
                              }),
                }),
              ],
            }),
            D && e.jsx(i.Suspense, { fallback: null, children: e.jsx(Xt, { files: P }) }),
            e.jsxs(st, {
              children: [
                C && e.jsx(qt, { vault: C, onCancel: () => A(null), onUnlocked: We }, "vault"),
                b && e.jsx(Ut, { file: b, onClose: () => T(null) }, "locked"),
                V && e.jsx(ut, { onClose: () => _(!1) }, "sealed"),
              ],
            }),
          ],
        })
      : e.jsx(Qt, {});
  });
export { hs as FilesScreen };
