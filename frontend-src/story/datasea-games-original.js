import * as React from "react";
import * as jsx from "react/jsx-runtime";
import * as PIXI from "pixi.js";

const hJ = React.createContext(null);
const Lo = (t, e, n) => (t < e ? e : t > n ? n : t);
const ju = (t, e, n) => t + (e - t) * n;
const Ra = 4;
const u6 = 60;
const bKe = 96;
const _Ke = 3.4;
const yKe = 0.14;
const xKe = 0.085;
function wKe(t) {
  let e = t >>> 0;
  return () => (
    (e = (Math.imul(e, 1664525) + 1013904223) >>> 0),
    e / 4294967296
  );
}
const _f = wKe(5761751);
const Zv = Array.from({ length: 256 }, () => u6 + (bKe - u6) * _f());
function SKe(t) {
  const e = t / _Ke,
    n = Math.floor(e),
    r = e - n,
    i = 0.5 - 0.5 * Math.cos(Math.PI * r),
    s = Zv[n % Zv.length] ?? 84,
    o = Zv[(n + 1) % Zv.length] ?? 84;
  return ju(s, o, i);
}
const Fd = (() => {
    const t = [];
    let e = 0.6;
    for (let n = 0; n < 512; n++) {
      let r = 0.34 + 0.5 * _f();
      (Math.abs(r - e) < 0.12 && (r = r < 0.59 ? r + 0.22 : r - 0.22),
        t.push(r),
        (e = r));
    }
    return t;
  })();
const MKe = [
    { fq: 23, sp: 2.1, amp: 0.5, ph: _f() * Math.PI * 2 },
    { fq: 47, sp: -3.3, amp: 0.3, ph: _f() * Math.PI * 2 },
    { fq: 83, sp: 5.7, amp: 0.2, ph: _f() * Math.PI * 2 },
    { fq: 149, sp: -8.3, amp: 0.12, ph: _f() * Math.PI * 2 },
  ];
const bM = (t) => ju(yKe, xKe, Lo(t, 0, Ra - 1) / (Ra - 1));
const TKe = [55, 200, 232];
const EKe = [255, 214, 160];
const d6 = [46, 92, 152];
const CKe = [255, 66, 76];
function f6(t, e, n) {
  return [ju(t[0], e[0], n), ju(t[1], e[1], n), ju(t[2], e[2], n)];
}
function Jv(t, e) {
  return `rgba(${Math.round(t[0])},${Math.round(t[1])},${Math.round(t[2])},${e.toFixed(3)})`;
}
function RKe({ api: t }) {
  const e = React.useRef(t);
  e.current = t;
  const n = React.useRef(0),
    r = React.useRef(0),
    i = React.useRef(0),
    s = React.useRef(0),
    o = React.useRef(!1),
    a = React.useRef(!1),
    l = React.useRef(1),
    c = React.useRef(0),
    u = React.useRef(0),
    d = React.useRef(0),
    f = React.useRef(!1),
    h = React.useRef(0),
    _ = React.useRef(new Set()),
    m = React.useRef(null),
    p = React.useRef(null),
    v = React.useRef(null),
    y = React.useRef(null),
    x = React.useRef(null),
    [w, S] = React.useState(0),
    [T, R] = React.useState([]),
    E = React.useRef(0),
    M = React.useCallback((D, L) => {
      const O = setTimeout(() => {
        (_.current.delete(O), D());
      }, L);
      _.current.add(O);
    }, []),
    C = React.useCallback(() => {
      ((u.current = 1),
        (l.current = Math.min(1.2, l.current + 0.65)),
        s.current > 0 && ((s.current = 0), S(0), e.current.onProgress(0)));
    }, []),
    A = React.useCallback(() => {
      if (f.current || o.current) return;
      const D = s.current,
        L = Fd[i.current % Fd.length] ?? 0.6,
        O = bM(D),
        I = Math.abs(r.current - L);
      if (I > O) {
        C();
        return;
      }
      o.current = !0;
      const F = 1 - I / O,
        G = D + 1;
      ((s.current = G),
        S(G),
        (c.current = 1),
        e.current.onProgress(Lo(G / Ra, 0, 1)),
        e.current.hit(0.55 + 0.45 * F));
      const ee = E.current++;
      (R((oe) => [...oe.slice(-3), { id: ee, x: L }]),
        M(() => R((oe) => oe.filter((W) => W.id !== ee)), 600),
        G >= Ra && !f.current && ((f.current = !0), e.current.onSolved()));
    }, [M, C]),
    k = React.useRef(A);
  k.current = A;
  const N = React.useRef(!1);
  (React.useEffect(() => {
    const D = (L) => {
      N.current &&
        (L.repeat ||
          ((L.code === "Space" || L.code === "Enter") &&
            (L.preventDefault(), k.current())));
    };
    return (
      window.addEventListener("keydown", D),
      () => window.removeEventListener("keydown", D)
    );
  }, []),
    React.useEffect(() => {
      let D = !0;
      const L = p.current,
        O = L?.getContext("2d") ?? null;
      let I = 0;
      h.current = performance.now();
      let F = !0,
        G = 0,
        ee = 0,
        oe = Math.min(2, window.devicePixelRatio || 1),
        W = 0,
        $ = 0;
      const ne = () => {
        const te = m.current;
        if (!L || !te) return;
        const K = te.getBoundingClientRect();
        if (K.width <= 0 || K.height <= 0) return;
        oe = Math.min(2, window.devicePixelRatio || 1);
        const Q = Math.max(1, Math.round(K.width * oe)),
          X = Math.max(1, Math.round(K.height * oe));
        (Q === G && X === ee) ||
          ((G = Q),
          (ee = X),
          (W = Q / oe),
          ($ = X / oe),
          (L.width = Q),
          (L.height = X),
          O && O.setTransform(oe, 0, 0, oe, 0, 0));
      };
      ne();
      const V = (te) => {
        if (!D) return;
        I = requestAnimationFrame(V);
        const K = (te - h.current) / 1e3,
          Q = F ? 0 : Lo(K, 0, 0.05);
        ((F = !1), (h.current = te), ne());
        const X = f.current;
        n.current += Q;
        const he = n.current;
        X || (r.current += (Q * SKe(he)) / 60);
        let U = Fd[i.current % Fd.length] ?? 0.6,
          ae = bM(s.current);
        (!X &&
          !o.current &&
          !a.current &&
          r.current > U + ae &&
          ((a.current = !0), s.current >= 1 && C()),
          r.current >= 1 &&
            ((r.current -= 1),
            (i.current += 1),
            (o.current = !1),
            (a.current = !1),
            (U = Fd[i.current % Fd.length] ?? 0.6),
            (ae = bM(s.current))));
        const pe = r.current;
        if (
          ((l.current = ju(
            l.current,
            X ? 0 : 1 - Lo(s.current, 0, Ra) / Ra,
            1 - Math.exp(-Q * 2.4),
          )),
          (d.current = ju(
            d.current,
            X ? 1 : s.current / Ra,
            1 - Math.exp(-Q * 3),
          )),
          (u.current = Math.max(0, u.current - Q * 3.5)),
          (c.current = Math.max(0, c.current - Q * 1.8)),
          v.current)
        ) {
          const _e = v.current;
          ((_e.style.left = `${(U - ae) * 100}%`),
            (_e.style.width = `${ae * 2 * 100}%`));
          const J = !X && Math.abs(pe - U) <= ae;
          _e.style.opacity = X ? "0" : J ? "1" : "0.55";
        }
        if (
          (y.current &&
            ((y.current.style.left = `${pe * 100}%`),
            (y.current.style.opacity = X ? "0" : "1")),
          x.current &&
            (x.current.style.opacity = (Lo(u.current, 0, 1) * 0.9).toFixed(3)),
          O && W > 0 && $ > 0)
        ) {
          const _e = W,
            J = $;
          O.clearRect(0, 0, _e, J);
          const le = J * 0.5,
            se = Lo(l.current, 0, 1.2) * (1 - 0.7 * Lo(c.current, 0, 1)),
            ve = Lo(d.current, 0, 1),
            we = J * (0.17 - 0.05 * ve),
            me = J * 0.13,
            j = X || o.current ? 0 : Math.exp(-(((pe - U) / 0.14) ** 2)),
            B = (ue, de) => {
              const Y = Math.sin((ue * 2.1 - he * 0.85) * Math.PI * 2),
                ge = 1 + 0.55 * j * Math.exp(-(((ue - U) / 0.09) ** 2));
              let q = 0;
              for (const ce of MKe)
                q += Math.sin(ue * ce.fq + (he + de) * ce.sp + ce.ph) * ce.amp;
              return le - Y * we * ge - q * se * me;
            },
            fe = Math.max(24, Math.floor(_e / 2)),
            be = (ue, de) => {
              O.beginPath();
              for (let Y = 0; Y <= fe; Y++) {
                const ge = Y / fe,
                  q = B(ge, ue) + de;
                Y === 0 ? O.moveTo(0, q) : O.lineTo(ge * _e, q);
              }
              O.stroke();
            };
          se > 0.06 &&
            ((O.lineWidth = 1.4),
            (O.strokeStyle = Jv(d6, 0.14 + 0.2 * se)),
            be(0.55, 3 + 6 * se),
            (O.strokeStyle = Jv(d6, 0.1 + 0.16 * se)),
            be(-0.4, -(3 + 6 * se)));
          let Pe = f6(TKe, EKe, ve);
          const re = Lo(u.current, 0, 1);
          (re > 0 && (Pe = f6(Pe, CKe, re * 0.75)),
            (O.lineWidth = 7),
            (O.strokeStyle = Jv(
              Pe,
              0.09 + 0.22 * ve + 0.12 * Lo(c.current, 0, 1),
            )),
            be(0, 0),
            (O.lineWidth = 2),
            (O.strokeStyle = Jv(Pe, 0.95)),
            be(0, 0));
        }
      };
      I = requestAnimationFrame(V);
      const z = new ResizeObserver(() => ne());
      return (
        m.current && z.observe(m.current),
        () => {
          ((D = !1), cancelAnimationFrame(I), z.disconnect());
        }
      );
    }, []),
    React.useEffect(() => {
      const D = _.current;
      return () => {
        for (const L of D) clearTimeout(L);
        D.clear();
      };
    }, []));
  const P = w >= Ra;
  return jsx.jsxs("div", {
    className: "flex h-full w-full select-none flex-col p-2.5 text-white/85",
    onPointerEnter: () => (N.current = !0),
    onPointerLeave: () => (N.current = !1),
    onPointerDown: (D) => {
      (D.preventDefault(), A());
    },
    children: [
      jsx.jsxs("div", {
        ref: m,
        className:
          "relative flex-1 cursor-pointer overflow-hidden rounded-lg border",
        style: {
          borderColor: P ? "rgba(255,214,160,0.3)" : "rgba(122,180,220,0.14)",
          background:
            "radial-gradient(130% 100% at 50% 38%, rgba(16,38,64,0.55), rgba(5,15,29,0.92))",
          transition: "border-color 400ms ease",
        },
        children: [
          jsx.jsx("div", {
            ref: v,
            className: "absolute inset-y-0 transition-opacity duration-100",
            style: {
              left: "30%",
              width: "23%",
              opacity: 0.55,
              background:
                "linear-gradient(90deg, rgba(255,206,140,0), rgba(255,206,140,0.2), rgba(255,206,140,0))",
              borderLeft: "1px solid rgba(255,210,150,0.5)",
              borderRight: "1px solid rgba(255,210,150,0.5)",
            },
          }),
          jsx.jsx("canvas", {
            ref: p,
            className: "absolute inset-0 h-full w-full",
          }),
          jsx.jsx("div", {
            ref: y,
            className: "absolute inset-y-0 w-px",
            style: {
              left: "0%",
              background: "rgba(255,255,255,0.8)",
              boxShadow: "0 0 8px 1px rgba(255,255,255,0.45)",
            },
          }),
          T.map((D) =>
            jsx.jsx(
              "div",
              {
                className: "pointer-events-none absolute rounded-full",
                style: {
                  left: `${D.x * 100}%`,
                  top: "50%",
                  width: 10,
                  height: 10,
                  marginLeft: -5,
                  marginTop: -5,
                  border: "1.5px solid rgba(255,224,178,0.9)",
                  boxShadow: "0 0 12px rgba(255,214,160,0.5)",
                  animation: "steadyRing 0.55s ease-out forwards",
                },
              },
              D.id,
            ),
          ),
          jsx.jsx("div", {
            ref: x,
            className: "pointer-events-none absolute inset-0",
            style: {
              opacity: 0,
              boxShadow: "inset 0 0 36px rgba(255,64,72,0.5)",
            },
          }),
          jsx.jsx("div", {
            className:
              "pointer-events-none absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5",
            children: Array.from({ length: Ra }, (D, L) =>
              jsx.jsx(
                "span",
                {
                  className:
                    "h-1.5 w-1.5 rounded-full transition-colors duration-150",
                  style: {
                    background: L < w ? "#ffd6a0" : "rgba(255,255,255,0.14)",
                    boxShadow: L < w ? "0 0 8px rgba(255,214,160,0.6)" : void 0,
                  },
                },
                L,
              ),
            ),
          }),
        ],
      }),
      jsx.jsx("style", {
        children: `
        @keyframes steadyRing {
          0%   { opacity: 0.9; transform: scale(1); }
          100% { opacity: 0; transform: scale(7); }
        }
      `,
      }),
    ],
  });
}
const Ci = Math.PI * 2;
const Rn = (t, e, n) => (t < e ? e : t > n ? n : t);
const Fr = (t, e, n) => t + (e - t) * n;
const H0 = (t, e = 0) => (Number.isFinite(t) ? t : e);
const PKe = "#050f1d";
const ho = "#37c8e8";
const jJ = "#9fdcee";
const Kf = "#ffdba8";
const IKe = [70, 106, 150];
const kKe = [55, 200, 232];
const DKe = [255, 219, 168];
const Bd = "200,205,212";
const Bm = 1;
const Um = 3;
const Vm = 0;
const Gm = Math.PI;
const rx = 0.45;
const ix = 1.4;
const z0 = 2;
const Ch = Math.PI / 2;
const W0 = 1;
const LKe = 0.28;
const NKe = 0.45;
const OKe = 0.16;
const o_ = 0.07;
const a_ = 0.13;
const hC = 0.085;
const _M = 1.2;
const FKe = 12;
const BKe = 0.8;
const yM = 0.9;
const Qv = 0.8;
const UKe = 0.11;
const VKe = 0.3;
const GKe = 2.62;
const jKe = 0.24;
const HKe = 0.6;
const yi = 260;
const eb = ["freq", "phase", "gain"];
function zKe(t) {
  let e = t >>> 0;
  return () => ((e = (e * 1664525 + 1013904223) >>> 0), e / 4294967295);
}
const Sr = zKe(3655912);
function JI(t) {
  const e = Sr() * Ci,
    n = Sr() * Ci,
    r = Ci / (40 + Sr() * 15),
    i = Ci / (18 + Sr() * 8);
  return (s) => t * (0.62 * Math.sin(r * s + e) + 0.38 * Math.sin(i * s + n));
}
const pC = JI(LKe);
const mC = JI(NKe);
const gC = JI(OKe);
const Ud = {
    freq: {
      star: z0,
      drift: pC,
      tol: o_,
      min: Bm,
      max: Um,
      drag: 0.5,
      grabX01: 0.15,
    },
    phase: {
      star: Ch,
      drift: mC,
      tol: a_,
      min: Vm,
      max: Gm,
      drag: 0.7,
      grabX01: 0.5,
    },
    gain: {
      star: W0,
      drift: gC,
      tol: hC,
      min: rx,
      max: ix,
      drag: 0.3,
      grabX01: 0.85,
    },
  };
const xM = (() => {
    const t = [];
    let e = 4.5 + Sr() * 1.5;
    for (let n = 0; n < 64; n++)
      (t.push({
        t: e,
        side: Sr() < 0.5 ? -1 : 1,
        mag: 0.85 + Sr() * 0.3,
        fb: [Sr() < 0.5 ? -1 : 1, Sr() < 0.5 ? -1 : 1, Sr() < 0.5 ? -1 : 1],
      }),
        (e += 8 + Sr() * 4));
    return t;
  })();
const WKe = Array.from({ length: 8 }, () => ({
    y01: 0.08 + Sr() * 0.84,
    len: 40 + Sr() * 60,
    speed: 6 + Sr() * 12,
    dir: Sr() < 0.5 ? -1 : 1,
    alpha: 0.045 + Sr() * 0.05,
    width: 1 + Sr() * 1.4,
    phase: Sr() * 500,
  }));
function h6(t, e) {
  const n = Math.sin(t * 127.1 + e * 311.7) * 43758.5453;
  return n - Math.floor(n);
}
const $Ke = (t, e, n) => (Math.abs(t - e) < 0.02 ? n : Math.sign(t - e));
function wM(t, e, n, r) {
  const i = Math.max((r - n) / 2, 1e-6);
  return Rn(Math.abs(t - e) / i, 0, 1);
}
const qKe = 0.42;
const XKe = 0.34;
const KKe = 0.24;
const SM = 1.35;
function YKe(t, e, n, r, i, s) {
  const o = wM(t, r, Bm, Um),
    a = wM(e, i, Vm, Gm),
    l = wM(n, s, rx, ix),
    c = qKe * Math.pow(o, SM) + XKe * Math.pow(a, SM) + KKe * Math.pow(l, SM);
  return Rn(H0(c, 1), 0, 1);
}
const vC = Math.PI / 4;
const HJ = (t, e, n, r) => r * Math.abs(Math.cos(e * t + (n - Ch)));
function ZKe(t, e, n, r) {
  const i = HJ(t, e, n, r);
  return [H0(i * Math.cos(t + vC)), H0(i * Math.sin(t + vC))];
}
const JKe = 3;
const Aa = 720;
const MM = 24;
const QKe = 2.2;
const kp = new Float64Array(Aa + 1);
const Dp = new Float64Array(Aa + 1);
function eYe({ api: t }) {
  const e = React.useRef(t);
  e.current = t;
  const n = React.useRef(GKe),
    r = React.useRef(jKe),
    i = React.useRef(HKe),
    s = React.useRef({
      r: z0 + pC(0),
      phi: Ch + mC(0),
      g: W0 + gC(0),
      tF: o_,
      tP: a_,
      tG: hC,
    }),
    [o, a] = React.useState({ freq: !1, phase: !1, gain: !1 }),
    l = React.useRef(o);
  l.current = o;
  const [c, u] = React.useState(!1),
    [d, f] = React.useState(0),
    h = React.useRef(0),
    _ = React.useRef(0),
    m = React.useRef(0),
    p = React.useRef(0),
    v = React.useRef(0),
    y = React.useRef(!1),
    x = React.useRef(0),
    w = React.useRef(0),
    S = React.useRef(null),
    T = React.useRef(null),
    R = React.useRef(-10),
    E = React.useRef({ freq: 0, phase: 0, gain: 0 }),
    M = React.useRef({ freq: !1, phase: !1, gain: !1 }),
    C = React.useRef({ freq: -10, phase: -10, gain: -10 }),
    A = React.useRef(new Set()),
    k = React.useRef(null),
    N = React.useRef(null),
    P = React.useRef("freq"),
    D = React.useRef(!1),
    L = React.useCallback((F, G) => {
      const ee = setTimeout(() => {
        (A.current.delete(ee), F());
      }, G);
      A.current.add(ee);
    }, []),
    O = React.useCallback((F, G) => {
      y.current ||
        ((C.current[F] = _.current),
        F === "freq"
          ? (n.current = Rn(G, Bm, Um))
          : F === "phase"
            ? (r.current = Rn(G, Vm, Gm))
            : (i.current = Rn(G, rx, ix)),
        e.current.hit(0.25));
    }, []),
    I = React.useCallback((F, G) => {
      M.current[F] = G;
    }, []);
  return (
    React.useEffect(() => {
      const F = (G) => {
        if (!D.current) return;
        const ee = P.current;
        let oe = !0;
        const W = G.shiftKey ? 0.3 : 1;
        (G.key === "ArrowLeft" || G.key === "ArrowDown"
          ? ee === "freq"
            ? O("freq", n.current - 0.03 * W)
            : ee === "phase"
              ? O("phase", r.current - 0.05 * W)
              : O("gain", i.current - 0.03 * W)
          : G.key === "ArrowRight" || G.key === "ArrowUp"
            ? ee === "freq"
              ? O("freq", n.current + 0.03 * W)
              : ee === "phase"
                ? O("phase", r.current + 0.05 * W)
                : O("gain", i.current + 0.03 * W)
            : (oe = !1),
          oe && G.preventDefault());
      };
      return (
        window.addEventListener("keydown", F),
        () => window.removeEventListener("keydown", F)
      );
    }, [O]),
    React.useEffect(() => {
      const F = k.current,
        G = F?.getContext("2d") ?? null;
      let ee = !0,
        oe = 0;
      h.current = performance.now();
      let W = !0,
        $ = 0,
        ne = !1;
      const V = { freq: n, phase: r, gain: i };
      let z = 0,
        te = 0,
        K = 0,
        Q = 0;
      const X = () => {
        if (!F) return;
        const le = F.getBoundingClientRect();
        if (le.width <= 0 || le.height <= 0) return;
        ((K = le.width), (Q = le.height));
        const se = Rn(window.devicePixelRatio || 1, 1, 2),
          ve = Math.max(1, Math.round(le.width * se)),
          we = Math.max(1, Math.round(le.height * se));
        (ve === z && we === te) ||
          ((z = ve),
          (te = we),
          (F.width = ve),
          (F.height = we),
          G && G.setTransform(se, 0, 0, se, 0, 0));
      };
      X();
      const he = (le, se) => le * (1 + BKe * Rn(E.current[se] / FKe, 0, 1)),
        U = () => {
          N.current &&
            ((N.current.style.animation = "none"),
            N.current.offsetWidth,
            (N.current.style.animation = "resoRing 0.6s ease-out forwards"));
        },
        ae = (le, se) => {
          let ve = "freq",
            we = 1 / 0;
          for (const me of eb) {
            const j = V[me].current ?? Ud[me].star,
              B = Math.abs(j - se[me]) / Math.max(le[me], 1e-6);
            B < we && ((we = B), (ve = me));
          }
          return ve;
        },
        pe = (le) => {
          if (!ee) return;
          oe = requestAnimationFrame(pe);
          const se = (le - h.current) / 1e3,
            ve = W ? 0 : Rn(se, 0, 0.05);
          ((W = !1), (h.current = le), (_.current += ve));
          const we = _.current;
          X();
          const me = z0 + pC(we),
            j = Ch + mC(we),
            B = W0 + gC(we),
            fe = {
              freq: he(o_, "freq"),
              phase: he(a_, "phase"),
              gain: he(hC, "gain"),
            };
          s.current = {
            r: me,
            phi: j,
            g: B,
            tF: fe.freq,
            tP: fe.phase,
            tG: fe.gain,
          };
          const be = { freq: me, phase: j, gain: B };
          let Pe = !1;
          for (; w.current < xM.length && we >= xM[w.current].t + Qv;)
            (T.current?.idx === w.current &&
              ((Pe = T.current.held), (T.current = null)),
              w.current++);
          const re = xM[w.current];
          let ue = 0,
            de = -1,
            Y = !1;
          if (re && !y.current) {
            if (we >= re.t - yM && we < re.t)
              ((ue = (we - (re.t - yM)) / yM),
                S.current?.idx !== w.current &&
                  (S.current = { idx: w.current, axis: ae(fe, be) }));
            else if (we >= re.t && we < re.t + Qv) {
              if (((de = (we - re.t) / Qv), T.current?.idx !== w.current)) {
                const Se =
                  S.current?.idx === w.current ? S.current.axis : ae(fe, be);
                ((S.current = { idx: w.current, axis: Se }),
                  (T.current = {
                    idx: w.current,
                    axis: Se,
                    dir: $Ke(
                      V[Se].current ?? Ud[Se].star,
                      be[Se],
                      re.fb[eb.indexOf(Se)],
                    ),
                    held: m.current > 0,
                  }));
              }
              const { axis: ie, dir: ye } = T.current,
                Ae = Ud[ie];
              Y = M.current[ie] || we - C.current[ie] < VKe;
              const ke = re.mag * (ve / Qv) * (Y ? UKe : 1);
              V[ie].current = Rn(
                (V[ie].current ?? Ae.star) + Ae.drag * ye * ke,
                Ae.min,
                Ae.max,
              );
            }
          }
          const ge = { freq: !0, phase: !0, gain: !0 };
          for (const ie of eb) {
            const ye = Ud[ie],
              Ae = V[ie].current ?? ye.star;
            ((ge[ie] = Math.abs(Ae - be[ie]) <= fe[ie]),
              ge[ie] || (E.current[ie] += ve));
          }
          const q = ge.freq && ge.phase && ge.gain;
          (q
            ? (!ne && !y.current && e.current.hit(0.8), (m.current += ve))
            : (m.current > _M * 0.3 && (R.current = we),
              m.current > 0 && T.current && (T.current.held = !1),
              (m.current = 0)),
            (ne = q),
            Pe && !y.current && m.current > 0 && e.current.hit(1.2));
          const ce = l.current;
          ((ce.freq !== ge.freq ||
            ce.phase !== ge.phase ||
            ce.gain !== ge.gain) &&
            (((ge.freq && !ce.freq) ||
              (ge.phase && !ce.phase) ||
              (ge.gain && !ce.gain)) &&
              $ <= 0 &&
              !y.current &&
              (e.current.hit(0.4), ($ = 0.25)),
            a({ freq: ge.freq, phase: ge.phase, gain: ge.gain })),
            $ > 0 && ($ -= ve));
          const Te = n.current,
            Re = r.current,
            Ce = i.current,
            Ie = Rn(m.current / _M, 0, 1),
            H = y.current ? 1 : Ie * 0.75;
          if (
            ((p.current += (H - p.current) * (1 - Math.exp(-ve * 3.5))),
            f((ie) => (Math.abs(ie - Ie) < 0.02 && Ie !== 0 ? ie : Ie)),
            !y.current)
          ) {
            let ie = 0;
            for (const Ae of eb) {
              const ke = V[Ae].current ?? Ud[Ae].star;
              ie += Rn(1 - Math.abs(ke - be[Ae]) / (fe[Ae] * 4), 0, 1);
            }
            ie /= 3;
            const ye = Rn(ie * 0.55 + Ie * 0.45, 0, 1);
            (ye > v.current &&
              ((v.current = ye), e.current.onProgress(v.current)),
              m.current >= _M &&
                ((y.current = !0),
                (x.current = we),
                u(!0),
                f(0),
                (v.current = 1),
                e.current.onProgress(1),
                U(),
                e.current.hit(1.5),
                L(() => e.current.onSolved(), 900)));
          }
          if (G) {
            const ie = Math.max(0, Math.min(K, Q));
            if (ie > 0) {
              const ye = S.current?.idx === w.current ? S.current.axis : null;
              tYe(G, K, Q, ie, {
                r: Te,
                phi: Re,
                g: Ce,
                err: YKe(Te, Re, Ce, me, j, B),
                t: we,
                blend: p.current,
                win: y.current ? Rn((we - x.current) / 0.7, 0, 1) : 0,
                warn: ue,
                grabU: de,
                grabGrip: Y,
                side: re?.side ?? 1,
                grabIdx: w.current,
                flash: Rn(1 - (we - R.current) / 0.16, 0, 1),
                grabX01: (ue > 0 || de >= 0) && ye ? Ud[ye].grabX01 : -1,
              });
            }
          }
        };
      oe = requestAnimationFrame(pe);
      const _e = new ResizeObserver(() => X());
      F && _e.observe(F);
      const J = A.current;
      return () => {
        ((ee = !1),
          cancelAnimationFrame(oe),
          _e.disconnect(),
          J.forEach((le) => clearTimeout(le)),
          J.clear());
      };
    }, [L]),
    jsx.jsxs("div", {
      className:
        "relative flex h-full w-full flex-col gap-2.5 bg-[#050f1d] p-3 text-white/85",
      onPointerEnter: () => (D.current = !0),
      onPointerLeave: () => (D.current = !1),
      children: [
        jsx.jsxs("div", {
          className: "relative mx-auto",
          style: { width: yi, height: yi },
          children: [
            jsx.jsx("canvas", {
              ref: k,
              className: "h-full w-full rounded-lg",
              style: { display: "block" },
            }),
            d > 0 &&
              !c &&
              jsx.jsx("svg", {
                className: "pointer-events-none absolute inset-0",
                width: yi,
                height: yi,
                viewBox: `0 0 ${yi} ${yi}`,
                children: jsx.jsx("circle", {
                  cx: yi / 2,
                  cy: yi / 2,
                  r: 116,
                  fill: "none",
                  stroke: ho,
                  strokeWidth: 3,
                  strokeLinecap: "round",
                  strokeDasharray: `${d * Ci * 116} ${Ci * 116}`,
                  transform: `rotate(-90 ${yi / 2} ${yi / 2})`,
                  style: { filter: `drop-shadow(0 0 6px ${ho})`, opacity: 0.9 },
                }),
              }),
            jsx.jsx("div", {
              ref: N,
              className:
                "pointer-events-none absolute left-1/2 top-1/2 rounded-full",
              style: {
                width: 8,
                height: 8,
                marginLeft: -4,
                marginTop: -4,
                border: `2px solid ${ho}`,
                opacity: 0,
              },
            }),
          ],
        }),
        jsx.jsxs("div", {
          className: "mt-auto flex items-end justify-between gap-3 px-1",
          children: [
            jsx.jsx(m6, {
              label: "频率",
              valueRef: n,
              min: Bm,
              max: Um,
              getTarget: () => s.current.r,
              tol: o_,
              lit: o.freq,
              won: c,
              onDrag: (F) => O("freq", F),
              onFocus: () => (P.current = "freq"),
              onGrip: (F) => I("freq", F),
              sensitivity: (Um - Bm) / 200,
            }),
            jsx.jsx(m6, {
              label: "相位",
              valueRef: r,
              min: Vm,
              max: Gm,
              getTarget: () => s.current.phi,
              tol: a_,
              lit: o.phase,
              won: c,
              onDrag: (F) => O("phase", F),
              onFocus: () => (P.current = "phase"),
              onGrip: (F) => I("phase", F),
              sensitivity: (Gm - Vm) / 200,
            }),
            jsx.jsx(nYe, {
              label: "增益",
              valueRef: i,
              min: rx,
              max: ix,
              getTarget: () => s.current.g,
              getTol: () => s.current.tG,
              lit: o.gain,
              won: c,
              onDrag: (F) => O("gain", F),
              onFocus: () => (P.current = "gain"),
              onGrip: (F) => I("gain", F),
            }),
          ],
        }),
        jsx.jsx("style", {
          children: `
        @keyframes resoRing {
          0%   { width: 8px; height: 8px; margin-left: -4px; margin-top: -4px; opacity: 0.9; }
          100% { width: ${yi - 4}px; height: ${yi - 4}px; margin-left: -${(yi - 4) / 2}px; margin-top: -${(yi - 4) / 2}px; opacity: 0; }
        }
      `,
        }),
      ],
    })
  );
}
const p6 = (t, e, n) => [
  Math.round(Fr(t[0], e[0], n)),
  Math.round(Fr(t[1], e[1], n)),
  Math.round(Fr(t[2], e[2], n)),
];
function tYe(t, e, n, r, i) {
  const s = e / 2,
    o = n / 2,
    a = r * 0.36;
  (t.clearRect(0, 0, e, n),
    (t.fillStyle = PKe),
    t.fillRect(0, 0, e, n),
    (t.lineCap = "round"));
  for (const D of WKe) {
    const L = e + D.len,
      O = ((((D.phase + i.t * D.speed * D.dir) % L) + L) % L) - D.len,
      I = D.y01 * n;
    ((t.strokeStyle = `rgba(46,86,140,${D.alpha})`),
      (t.lineWidth = D.width),
      t.beginPath(),
      t.moveTo(O, I),
      t.lineTo(O + D.len, I),
      t.stroke());
  }
  ((t.strokeStyle = "rgba(55,200,232,0.05)"), (t.lineWidth = 1), t.beginPath());
  for (let D = 1; D < 8; D++) {
    const L = (D / 8) * e,
      O = (D / 8) * n;
    (t.moveTo(L, 0), t.lineTo(L, n), t.moveTo(0, O), t.lineTo(e, O));
  }
  (t.stroke(),
    (t.strokeStyle = "rgba(55,200,232,0.11)"),
    t.beginPath(),
    t.moveTo(s, 0),
    t.lineTo(s, n),
    t.moveTo(0, o),
    t.lineTo(e, o),
    t.stroke());
  const l = r * 0.446;
  ((t.strokeStyle = "rgba(55,200,232,0.08)"),
    (t.lineWidth = 1),
    t.beginPath(),
    t.arc(s, o, l, 0, Ci),
    t.stroke());
  const c = i.win < 1 ? i.win * i.win * (3 - 2 * i.win) : 1;
  if (c < 1) {
    (t.save(),
      t.setLineDash([4, 5]),
      (t.strokeStyle = `rgba(55,200,232,${0.28 * (1 - c)})`),
      (t.lineWidth = 1.2),
      t.beginPath());
    const D = 240;
    for (let L = 0; L <= D; L++) {
      const [O, I] = ZKe((L / D) * Ci, z0, Ch, W0),
        F = s + O * a,
        G = o - I * a;
      L === 0 ? t.moveTo(F, G) : t.lineTo(F, G);
    }
    (t.closePath(), t.stroke(), t.restore());
  }
  if (c > 0) {
    const D = t.createRadialGradient(s, o, 0, s, o, a * 0.95);
    (D.addColorStop(0, `rgba(255,224,180,${0.3 * c})`),
      D.addColorStop(0.5, `rgba(120,210,235,${0.09 * c})`),
      D.addColorStop(1, "rgba(0,0,0,0)"),
      (t.fillStyle = D),
      t.fillRect(0, 0, e, n));
  }
  const u = Rn(1 - i.err, 0, 1),
    d = p6(IKe, kKe, u),
    f = Rn(Fr(i.blend, 1, c), 0, 1),
    h = f * f * (3 - 2 * f),
    _ = Math.max(c, h * 0.3),
    [m, p, v] = p6(d, DKe, _),
    y = Fr(i.r, z0, c),
    x = Fr(i.phi, Ch, c),
    w = Fr(i.g, W0, c),
    S = Ci * JKe,
    T = i.t * QKe,
    R = l * 0.93;
  for (let D = 0; D <= Aa; D++) {
    const L = T - S + (D / Aa) * S;
    let O = HJ(L, y, x, w) * a;
    O > R && (O = R + (l - R) * Math.tanh((O - R) / (l - R)));
    const I = L + vC;
    ((kp[D] = s + Math.cos(I) * H0(O)), (Dp[D] = o - Math.sin(I) * H0(O)));
  }
  const E = [
      { alpha: 0.05, width: 9 },
      { alpha: 0.13, width: 5 },
      { alpha: 0.3, width: 2.8 },
      { alpha: 0.95, width: 1.6 },
    ],
    M = Aa / MM;
  (t.save(),
    (t.lineJoin = "round"),
    (t.lineCap = "butt"),
    (t.globalCompositeOperation = "lighter"));
  for (let D = 0; D < MM; D++) {
    const L = 0.05 + 0.95 * Math.pow((D + 1) / MM, 1.7),
      O = D * M;
    for (const I of E) {
      ((t.strokeStyle = `rgba(${m},${p},${v},${(I.alpha * L).toFixed(3)})`),
        (t.lineWidth = I.width),
        t.beginPath(),
        t.moveTo(kp[O], Dp[O]));
      for (let F = O + 1; F <= O + M; F++) t.lineTo(kp[F], Dp[F]);
      t.stroke();
    }
  }
  ((t.fillStyle = `rgba(${m},${p},${v},0.22)`),
    t.beginPath(),
    t.arc(kp[Aa], Dp[Aa], 5, 0, Ci),
    t.fill(),
    (t.fillStyle = `rgba(${m},${p},${v},0.95)`),
    t.beginPath(),
    t.arc(kp[Aa], Dp[Aa], 1.8, 0, Ci),
    t.fill(),
    t.restore(),
    (t.font = "10px ui-monospace, SFMono-Regular, Menlo, monospace"),
    (t.textAlign = "center"),
    (t.textBaseline = "middle"));
  const C = Math.floor(n / 12),
    A = i.grabU >= 0,
    k = A ? Rn((1 - i.grabU) / 0.25, 0, 1) : 1,
    N = A ? (i.grabGrip ? 0.6 : 0.95) * k : i.warn,
    P = A ? 1 : i.warn * i.warn * (3 - 2 * i.warn);
  if (N > 0) {
    const L = i.side === 1 ? 0 : e - 46,
      O = t.createLinearGradient(
        i.side === 1 ? 0 : e,
        0,
        i.side === 1 ? 46 : e - 46,
        0,
      );
    (O.addColorStop(0, `rgba(${Bd},${0.28 * N})`),
      O.addColorStop(1, `rgba(${Bd},0)`),
      (t.fillStyle = O),
      t.fillRect(L, 0, 46, n));
    const I = i.side === 1 ? 10 : e - 10,
      F = Math.floor(i.t * 18);
    for (let G = 0; G < C; G++) {
      const ee = h6(G * 3.7, F * 1.3 + i.grabIdx * 7);
      ee > 0.3 + 0.55 * N ||
        ((t.fillStyle = `rgba(${Bd},${(0.3 + 0.5 * ee) * N})`),
        t.fillText(ee > 0.15 ? "1" : "0", I, (G + 0.5) * 12));
    }
    if (i.grabX01 >= 0) {
      const G = i.side === 1 ? 0 : e,
        ee = n * 0.3,
        oe = i.grabX01 * e,
        W = n - 3,
        $ = Fr(G, oe, 0.35),
        ne = n * 0.52,
        V = A ? (i.grabGrip ? 0.45 : 0.25) : 1 - P * 0.7,
        z = A ? (i.grabGrip ? 0.7 : 1.5) : 0,
        te = (se) => {
          const ve = Fr(Fr(G, $, se), Fr($, oe, se), se),
            we = Fr(Fr(ee, ne, se), Fr(ne, W, se), se),
            me = Math.sin(se * 9 + i.t * 2.6) * 3.5 * se * V,
            j = Math.sin(i.t * 42 + se * 24) * z * se;
          return [
            ve + me + j,
            we + Math.cos(se * 7 + i.t * 2.1) * 1.8 * se * V,
          ];
        },
        K = 26;
      for (const se of [
        { w: 3.2, a: 0.14 },
        { w: 1.3, a: 0.5 },
      ]) {
        ((t.strokeStyle = `rgba(${Bd},${se.a * N})`),
          (t.lineWidth = se.w),
          t.beginPath());
        for (let ve = 0; ve <= K; ve++) {
          const [we, me] = te((ve / K) * P);
          ve === 0 ? t.moveTo(we, me) : t.lineTo(we, me);
        }
        t.stroke();
      }
      const [Q, X] = te(P),
        [he, U] = te(Math.max(P - 0.06, 0));
      let ae = oe - he,
        pe = W - U;
      const _e = Math.max(Math.hypot(ae, pe), 1e-6);
      ((ae /= _e), (pe /= _e));
      const J = A ? 0.22 : 0.55;
      ((t.strokeStyle = `rgba(${Bd},${0.55 * N})`),
        (t.lineWidth = 1.3),
        t.beginPath(),
        t.moveTo(Q, X),
        t.lineTo(Q + (ae - pe * J) * 8, X + (pe + ae * J) * 8),
        t.moveTo(Q, X),
        t.lineTo(Q + (ae + pe * J) * 8, X + (pe - ae * J) * 8),
        t.stroke());
      const le = Math.floor(i.t * 14);
      for (const se of [0.3, 0.55, 0.8]) {
        const ve = h6(se * 31.7, le + i.grabIdx * 13);
        if (ve > 0.75) continue;
        const [we, me] = te(se * P);
        ((t.fillStyle = `rgba(${Bd},${(0.35 + 0.4 * ve) * N})`),
          t.fillText(ve > 0.4 ? "1" : "0", we + 4, me - 4));
      }
    }
  }
  i.flash > 0 &&
    ((t.strokeStyle = `rgba(255,64,76,${0.5 * i.flash})`),
    (t.lineWidth = 3),
    t.strokeRect(1.5, 1.5, e - 3, n - 3));
}
function m6({
  label: t,
  valueRef: e,
  min: n,
  max: r,
  getTarget: i,
  tol: s,
  lit: o,
  won: a,
  onDrag: l,
  onFocus: c,
  onGrip: u,
  sensitivity: d,
}) {
  const f = React.useRef(!1),
    h = React.useRef({ x: 0, y: 0 }),
    _ = React.useRef(0),
    m = React.useRef(null),
    p = React.useRef(null),
    v = React.useRef(null),
    y = React.useRef(o);
  y.current = o;
  const x = React.useRef(a);
  ((x.current = a),
    React.useEffect(() => {
      let M = requestAnimationFrame(function C() {
        M = requestAnimationFrame(C);
        const A = e.current ?? n,
          k = i(),
          N = Rn((A - n) / Math.max(r - n, 1e-6), 0, 1),
          P = Fr(-135, 135, N),
          D = Math.max((r - n) / 2, 1e-6),
          L =
            Math.round(
              Rn(1 - Math.abs(A - k) / (s * 6 + D * 0.02), 0, 1) * 12,
            ) / 12,
          O = x.current,
          I = y.current,
          F = O ? Kf : I ? ho : L > 0.4 ? jJ : "rgba(255,255,255,0.3)";
        (m.current &&
          (m.current.style.transform = `translate(-50%,-50%) rotate(${P}deg)`),
          p.current &&
            ((p.current.style.background = F),
            (p.current.style.boxShadow = `0 0 6px ${F}`)),
          v.current &&
            (v.current.style.boxShadow = O
              ? "0 0 8px 1px rgba(255,219,168,0.4)"
              : `0 0 ${6 + L * 14}px ${1 + L * 2}px ${I ? `${ho}cc` : `rgba(55,200,232,${(L * 0.5).toFixed(2)})`}`));
      });
      return () => cancelAnimationFrame(M);
    }, [e, n, r, i, s]));
  const w = (M) => Math.atan2(M.clientY - h.current.y, M.clientX - h.current.x),
    S = (M) => {
      (M.preventDefault(), (f.current = !0));
      const C = M.currentTarget.getBoundingClientRect();
      ((h.current = { x: C.left + C.width / 2, y: C.top + C.height / 2 }),
        (_.current = w(M)),
        c(),
        u(!0),
        M.target.setPointerCapture(M.pointerId));
    },
    T = (M) => {
      if (!f.current) return;
      const C = w(M);
      let A = C - _.current;
      (A > Math.PI && (A -= Ci),
        A < -Math.PI && (A += Ci),
        (_.current = C),
        l((e.current ?? n) + (A / (Ci * 0.75)) * (r - n)));
    },
    R = (M) => {
      if (f.current) {
        ((f.current = !1), u(!1));
        try {
          M.target.releasePointerCapture(M.pointerId);
        } catch {}
      }
    },
    E = (M) => {
      (c(), l((e.current ?? n) - Math.sign(M.deltaY) * d * 6));
    };
  return jsx.jsxs("div", {
    className: "flex select-none flex-col items-center gap-1.5",
    children: [
      jsx.jsxs("div", {
        onPointerDown: S,
        onPointerMove: T,
        onPointerUp: R,
        onPointerCancel: R,
        onWheel: E,
        className: a
          ? "relative cursor-default"
          : "relative cursor-grab active:cursor-grabbing",
        style: { width: 56, height: 56 },
        children: [
          jsx.jsx("div", { ref: v, className: "absolute inset-0 rounded-full" }),
          jsx.jsx("div", {
            className: "absolute inset-0 rounded-full border",
            style: {
              background:
                "radial-gradient(120% 120% at 35% 30%, #14202f, #0a1220)",
              borderColor: a
                ? `${Kf}66`
                : o
                  ? `${ho}99`
                  : "rgba(255,255,255,0.16)",
            },
          }),
          jsx.jsx("div", {
            className:
              "pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[13px] text-white/25",
            children: "⟳",
          }),
          jsx.jsx("div", {
            ref: m,
            className: "absolute left-1/2 top-1/2",
            style: { transform: "translate(-50%,-50%) rotate(-135deg)" },
            children: jsx.jsx("div", {
              ref: p,
              className: "rounded-full",
              style: {
                width: 3,
                height: 19,
                marginTop: -23,
                background: "rgba(255,255,255,0.3)",
              },
            }),
          }),
        ],
      }),
      jsx.jsx("span", {
        className: "text-[11px] tracking-wide transition-colors",
        style: { color: a ? `${Kf}cc` : o ? ho : "rgba(255,255,255,0.55)" },
        children: t,
      }),
    ],
  });
}
function nYe({
  label: t,
  valueRef: e,
  min: n,
  max: r,
  getTarget: i,
  getTol: s,
  lit: o,
  won: a,
  onDrag: l,
  onFocus: c,
  onGrip: u,
}) {
  const d = React.useRef(null),
    f = React.useRef(null),
    h = React.useRef(null),
    _ = React.useRef(!1),
    m = React.useRef(o);
  m.current = o;
  const p = React.useRef(a);
  ((p.current = a),
    React.useEffect(() => {
      let T = requestAnimationFrame(function R() {
        T = requestAnimationFrame(R);
        const E = e.current ?? n,
          M = i(),
          C = s(),
          A = Math.max(r - n, 1e-6),
          k = Rn((E - n) / A, 0, 1),
          N =
            Math.round(
              Rn(1 - Math.abs(E - M) / (C * 8 + A * 0.02), 0, 1) * 12,
            ) / 12,
          P = p.current,
          D = m.current,
          L = P ? Kf : D ? ho : N > 0.4 ? jJ : "rgba(255,255,255,0.5)";
        if (
          (f.current &&
            ((f.current.style.left = `${k * 100}%`),
            (f.current.style.boxShadow = P
              ? "0 0 6px rgba(255,219,168,0.5)"
              : `0 0 ${4 + N * 12}px ${L}`),
            (f.current.style.borderColor = P
              ? `${Kf}66`
              : D
                ? `${ho}99`
                : "rgba(255,255,255,0.2)")),
          h.current)
        ) {
          const O = Rn((M - C - n) / A, 0, 1),
            I = Rn((M + C - n) / A, 0, 1);
          ((h.current.style.left = `${O * 100}%`),
            (h.current.style.width = `${Math.max(I - O, 0.02) * 100}%`),
            (h.current.style.background = P
              ? "rgba(255,219,168,0.28)"
              : "rgba(55,200,232,0.3)"),
            (h.current.style.boxShadow = P
              ? "0 0 6px rgba(255,219,168,0.4)"
              : D
                ? `0 0 8px ${ho}`
                : "none"));
        }
      });
      return () => cancelAnimationFrame(T);
    }, [e, n, r, i, s]));
  const v = (T) => {
      const R = d.current;
      if (!R) return;
      const E = R.getBoundingClientRect(),
        M = Rn((T - E.left) / Math.max(E.width, 1), 0, 1);
      l(Fr(n, r, M));
    },
    y = (T) => {
      (T.preventDefault(),
        (_.current = !0),
        c(),
        u(!0),
        T.target.setPointerCapture(T.pointerId),
        v(T.clientX));
    },
    x = (T) => {
      _.current && v(T.clientX);
    },
    w = (T) => {
      if (_.current) {
        ((_.current = !1), u(!1));
        try {
          T.target.releasePointerCapture(T.pointerId);
        } catch {}
      }
    },
    S = (T) => {
      (c(), l((e.current ?? n) - Math.sign(T.deltaY) * (r - n) * 0.03));
    };
  return jsx.jsxs("div", {
    className: "flex w-[132px] select-none flex-col items-center gap-1.5",
    children: [
      jsx.jsxs("div", {
        ref: d,
        onPointerDown: y,
        onPointerMove: x,
        onPointerUp: w,
        onPointerCancel: w,
        onWheel: S,
        className: a
          ? "relative w-full cursor-default"
          : "relative w-full cursor-ew-resize",
        style: { height: 56 },
        children: [
          jsx.jsx("div", {
            className:
              "absolute left-0 right-0 top-1/2 -translate-y-1/2 rounded-full",
            style: { height: 6, background: "rgba(255,255,255,0.1)" },
          }),
          jsx.jsx("div", {
            ref: h,
            className: "absolute top-1/2 -translate-y-1/2 rounded-full",
            style: {
              left: "0%",
              width: "8%",
              height: 6,
              background: "rgba(55,200,232,0.3)",
            },
          }),
          jsx.jsx("div", {
            ref: f,
            className: "absolute top-1/2 rounded-full border",
            style: {
              left: "0%",
              width: 16,
              height: 16,
              marginLeft: -8,
              marginTop: -8,
              background:
                "radial-gradient(120% 120% at 35% 30%, #14202f, #0a1220)",
              borderColor: "rgba(255,255,255,0.2)",
            },
          }),
        ],
      }),
      jsx.jsx("span", {
        className: "text-[11px] tracking-wide transition-colors",
        style: { color: a ? `${Kf}cc` : o ? ho : "rgba(255,255,255,0.55)" },
        children: t,
      }),
    ],
  });
}
const wi = Math.PI * 2;
const Ui = (t, e, n) => (t < e ? e : t > n ? n : t);
const zJ = (t, e, n) => t + (e - t) * n;
const Vd = (t, e = 0) => (Number.isFinite(t) ? t : e);
const WJ = (t, e, n) => {
    const r = Ui((n - t) / (e - t), 0, 1);
    return r * r * (3 - 2 * r);
  };
const Fo = "#37c8e8";
const l_ = "#ffd9a0";
const iYe = 0.955;
const c_ = 0.12;
const u_ = [
    {
      start: { x: -0.66, y: 0.32 },
      gate: { x: 0.52, y: -0.3 },
      gateR: 0.16,
      mul: 1,
      sweepW: 0.42,
      curlT: 1,
      turb: 0,
      pull: 9,
      gustMin: 1.9,
      gustMax: 3,
      gustA: 5.2,
      orbitR: 0,
      orbitW: 0,
      orbitPh: 0,
    },
    {
      start: { x: 0.52, y: -0.3 },
      gate: { x: -0.06, y: 0.6 },
      gateR: 0.13,
      mul: 1.2,
      sweepW: 0.52,
      curlT: 1.15,
      turb: 0,
      pull: 9,
      gustMin: 1.7,
      gustMax: 2.7,
      gustA: 5.4,
      orbitR: 0,
      orbitW: 0,
      orbitPh: 0,
    },
    {
      start: { x: -0.06, y: 0.6 },
      gate: { x: 0.3, y: -0.66 },
      gateR: 0.105,
      mul: 1.4,
      sweepW: 0.64,
      curlT: 1.35,
      turb: 0.05,
      pull: 9.5,
      gustMin: 1.45,
      gustMax: 2.3,
      gustA: 5.7,
      orbitR: 0,
      orbitW: 0,
      orbitPh: 0,
    },
    {
      start: { x: 0.3, y: -0.66 },
      gate: { x: -0.5, y: 0.42 },
      gateR: 0.09,
      mul: 1.55,
      sweepW: 0.78,
      curlT: 1.55,
      turb: 0.08,
      pull: 10,
      gustMin: 1.25,
      gustMax: 2,
      gustA: 6,
      orbitR: 0.13,
      orbitW: 0.3,
      orbitPh: 0.9,
    },
    {
      start: { x: -0.5, y: 0.42 },
      gate: { x: 0.44, y: -0.3 },
      gateR: 0.08,
      mul: 1.7,
      sweepW: 0.92,
      curlT: 1.8,
      turb: 0.11,
      pull: 10.5,
      gustMin: 1.1,
      gustMax: 1.8,
      gustA: 6.2,
      orbitR: 0.17,
      orbitW: 0.38,
      orbitPh: 3.6,
    },
  ];
const TM = u_.length;
const EM = 0.8;
const sYe = 0.3;
const oYe = 2.5;
const g6 = 4;
const aYe = 2.2;
const lYe = [
    { kx: 3.1, ky: 1.7, w: 0.5, a: 0.3 },
    { kx: -2.3, ky: 4.1, w: -0.35, a: 0.26 },
    { kx: 5.3, ky: -3.6, w: 0.8, a: 0.14 },
  ];
const cYe = 1.3;
const uYe = 1.1;
const dYe = 1.8;
const v6 = 0.74;
const fYe = 0.12;
const b6 = 0.55;
const _6 = 0.5;
const sx = 0.6;
const hYe = 120;
const y6 = 0.32;
const pYe = 9;
function mYe(t, e, n, r) {
  let i = 0,
    s = 0;
  for (const o of lYe) {
    const a = Math.cos(t * o.kx + e * o.ky + n * o.w) * o.a;
    ((i += a * o.ky), (s -= a * o.kx));
  }
  if (r > 0) {
    const o = Math.cos(t * 7.9 - e * 6.4 + n * 1.7) * r;
    ((i += o * -6.4), (s -= o * 7.9));
  }
  return { x: i, y: s };
}
function x6(t, e) {
  return zJ(fYe, 1, WJ(e * 0.75, e * 1.7, t));
}
function gYe() {
  let t = 0.4213;
  const e = () => ((t = (t * 9301 + 0.49297) % 1), t);
  return Array.from({ length: hYe }, () => {
    const n = Math.sqrt(e()) * 0.95,
      r = e() * wi;
    return {
      x: Math.cos(r) * n,
      y: Math.sin(r) * n,
      vx: 0,
      vy: 0,
      life: 0.5 + e() * 2.5,
    };
  });
}
function vYe({ api: t }) {
  const e = React.useRef(t);
  e.current = t;
  const n = React.useRef(null),
    r = React.useRef(null),
    i = React.useRef({ ...u_[0].start }),
    s = React.useRef({ x: 0, y: 0 }),
    o = React.useRef(null),
    a = React.useRef(!1),
    l = React.useRef(Array.from({ length: pYe }, () => ({ ...u_[0].start }))),
    c = React.useRef(0),
    u = React.useRef(0),
    d = React.useRef(!1),
    f = React.useRef(!1),
    h = React.useRef(!1),
    _ = React.useRef(0),
    m = React.useRef(0),
    p = React.useRef({ x: 0, y: 0 }),
    v = React.useRef(!0),
    y = React.useRef(0),
    x = React.useRef(0),
    w = React.useRef(2.2),
    S = React.useRef(0),
    T = React.useRef(0),
    R = React.useRef(0),
    E = React.useRef(0.31),
    M = React.useRef(null);
  M.current || (M.current = gYe());
  const C = React.useRef(0.734),
    A = React.useRef([]),
    k = React.useRef(new Set()),
    N = (P) => {
      const D = Ui(P, 0, 1);
      D > _.current && ((_.current = D), e.current.onProgress(D));
    };
  return (
    React.useEffect(() => {
      const P = n.current;
      if (!P) return;
      const D = (F, G) => {
          const ee = P.getBoundingClientRect(),
            oe = Math.min(ee.width, ee.height) / 2,
            W = (F - (ee.left + ee.width / 2)) / Math.max(oe, 1),
            $ = (G - (ee.top + ee.height / 2)) / Math.max(oe, 1),
            ne = Math.hypot(W, $),
            V = ne > 1 ? 1 / ne : 1;
          return { x: Vd(W) * V, y: Vd($) * V };
        },
        L = (F) => {
          if (!(f.current || m.current > 0)) {
            (F.preventDefault(),
              (a.current = !0),
              (o.current = D(F.clientX, F.clientY)),
              e.current.hit(0.25));
            try {
              P.setPointerCapture(F.pointerId);
            } catch {}
          }
        },
        O = (F) => {
          a.current && (o.current = D(F.clientX, F.clientY));
        },
        I = (F) => {
          ((a.current = !1), (o.current = null));
          try {
            P.releasePointerCapture(F.pointerId);
          } catch {}
        };
      return (
        P.addEventListener("pointerdown", L),
        P.addEventListener("pointermove", O),
        P.addEventListener("pointerup", I),
        P.addEventListener("pointercancel", I),
        () => {
          (P.removeEventListener("pointerdown", L),
            P.removeEventListener("pointermove", O),
            P.removeEventListener("pointerup", I),
            P.removeEventListener("pointercancel", I));
        }
      );
    }, []),
    React.useEffect(() => {
      let P = !0;
      const D = n.current,
        L = D?.getContext("2d") ?? null,
        O = k.current;
      let I = 300,
        F = -1;
      const G = () => {
        if (!D) return;
        const z = r.current?.getBoundingClientRect(),
          te = Math.max(
            1,
            Math.round(Math.min(z?.width ?? 300, z?.height ?? 300)),
          ),
          K = Ui(window.devicePixelRatio || 1, 1, 3),
          Q = Math.round(te * K);
        ((I = te),
          (D.style.width = `${te}px`),
          (D.style.height = `${te}px`),
          Q !== F &&
            ((F = Q),
            (D.width = Q),
            (D.height = Q),
            L?.setTransform(K, 0, 0, K, 0, 0)));
      };
      G();
      let ee = null;
      typeof ResizeObserver < "u" &&
        r.current &&
        ((ee = new ResizeObserver(() => G())), ee.observe(r.current));
      const oe = () => (
          (C.current = (C.current * 9301 + 0.49297) % 1),
          C.current
        ),
        W = (z, te, K, Q, X = 0.5) => {
          const he = A.current;
          (he.push({ x: z, y: te, age: 0, dur: X, maxR: K, color: Q }),
            he.length > 4 && he.shift());
        };
      let $ = 0;
      x.current = performance.now();
      let ne = !0;
      const V = (z) => {
        if (!P) return;
        $ = requestAnimationFrame(V);
        const te = (z - x.current) / 1e3,
          K = ne ? 0 : Ui(te, 0, 0.05);
        ((ne = !1), (x.current = z), (y.current += K));
        const Q = y.current;
        G();
        const X = u_[c.current],
          he = i.current,
          U = s.current,
          ae =
            X.orbitR > 0
              ? {
                  x: X.gate.x + Math.cos(Q * X.orbitW + X.orbitPh) * X.orbitR,
                  y: X.gate.y + Math.sin(Q * X.orbitW + X.orbitPh) * X.orbitR,
                }
              : X.gate,
          pe = X.gate.x - X.start.x,
          _e = X.gate.y - X.start.y,
          J = Math.max(Math.hypot(pe, _e), 1e-4),
          le = { x: -_e / J, y: pe / J },
          se = cYe * Math.sin(Q * X.sweepW + uYe);
        f.current ||
          (R.current > 0
            ? (R.current -= K)
            : T.current > 0
              ? ((T.current -= K), T.current <= 0 && (R.current = _6))
              : ((w.current -= K),
                w.current <= 0 &&
                  ((E.current = (E.current * 9301 + 0.49297) % 1),
                  (S.current = E.current * wi),
                  (T.current = b6),
                  (w.current = zJ(X.gustMin, X.gustMax, E.current)))));
        const ve = R.current > 0 ? Math.sin(Math.PI * (1 - R.current / _6)) : 0,
          we = Math.cos(S.current),
          me = Math.sin(S.current),
          j = (q, ce) => {
            const Te = mYe(q, ce, Q * X.curlT, X.turb);
            let Re = (Te.x + le.x * se) * X.mul,
              Ce = (Te.y + le.y * se) * X.mul;
            const Ie = Math.hypot(q, ce);
            if (Ie > v6) {
              const ie = WJ(v6, 0.97, Ie) * dYe;
              ((Re += (q / Ie) * ie), (Ce += (ce / Ie) * ie));
            }
            ve > 0 && ((Re += we * X.gustA * ve), (Ce += me * X.gustA * ve));
            const H = Math.min(
              x6(Math.hypot(q - ae.x, ce - ae.y), X.gateR),
              x6(Math.hypot(q - X.start.x, ce - X.start.y), c_),
            );
            return { x: Re * H, y: Ce * H };
          },
          B = M.current;
        for (const q of B) {
          const ce = j(q.x, q.y);
          if (
            ((q.vx = ce.x),
            (q.vy = ce.y),
            (q.x += ce.x * y6 * K),
            (q.y += ce.y * y6 * K),
            (q.life -= K),
            q.life <= 0 || Math.hypot(q.x, q.y) > 0.99)
          ) {
            const Te = Math.sqrt(oe()) * 0.95,
              Re = oe() * wi;
            ((q.x = Math.cos(Re) * Te),
              (q.y = Math.sin(Re) * Te),
              (q.vx = 0),
              (q.vy = 0),
              (q.life = 1.2 + oe() * 2.2));
          }
        }
        if (m.current > 0) {
          if (((m.current -= K), !v.current && m.current <= sx * 0.5)) {
            ((v.current = !0),
              (he.x = X.start.x),
              (he.y = X.start.y),
              (U.x = 0),
              (U.y = 0));
            for (const q of l.current) ((q.x = he.x), (q.y = he.y));
          }
        } else if (!f.current) {
          const q = j(he.x, he.y);
          let ce = q.x,
            Te = q.y;
          const Re = Math.hypot(he.x - X.start.x, he.y - X.start.y);
          if (Re < c_ * 1.6) {
            const Ie = aYe * (1 - Re / (c_ * 1.6));
            ((ce += (X.start.x - he.x) * Ie), (Te += (X.start.y - he.y) * Ie));
          }
          const Ce = o.current;
          (Ce &&
            ((ce += (Ce.x - he.x) * X.pull), (Te += (Ce.y - he.y) * X.pull)),
            (U.x = (U.x + ce * K) * (1 - Ui(g6 * K, 0, 0.9))),
            (U.y = (U.y + Te * K) * (1 - Ui(g6 * K, 0, 0.9))),
            (he.x = Vd(he.x + U.x * K, he.x)),
            (he.y = Vd(he.y + U.y * K, he.y)),
            Math.hypot(he.x, he.y) > iYe &&
              ((m.current = sx),
              (p.current = { x: he.x, y: he.y }),
              (v.current = !1),
              (a.current = !1),
              (o.current = null),
              (u.current = 0),
              (d.current = !1)));
        }
        const fe = l.current;
        let be = he;
        for (const q of fe)
          ((q.x = Vd(q.x + (be.x - q.x) * 0.38, q.x)),
            (q.y = Vd(q.y + (be.y - q.y) * 0.38, q.y)),
            (be = q));
        const Pe = Math.hypot(he.x - ae.x, he.y - ae.y),
          re = m.current <= 0 && Pe <= X.gateR * 0.85,
          ue =
            X.orbitR > 0
              ? -Math.sin(Q * X.orbitW + X.orbitPh) * X.orbitR * X.orbitW
              : 0,
          de =
            X.orbitR > 0
              ? Math.cos(Q * X.orbitW + X.orbitPh) * X.orbitR * X.orbitW
              : 0,
          Y = Math.hypot(U.x - ue, U.y - de);
        if (
          (re &&
            !d.current &&
            !f.current &&
            (e.current.hit(0.8), W(ae.x, ae.y, X.gateR * 2.6, Fo, 0.45)),
          (d.current = re),
          !f.current)
        )
          if (re && Y <= sYe) {
            u.current += K;
            const q = Ui(u.current / EM, 0, 1);
            if ((N((c.current + q) / TM), u.current >= EM))
              if (c.current < TM - 1)
                ((c.current += 1),
                  (u.current = 0),
                  (d.current = !1),
                  N(c.current / TM),
                  e.current.hit(1.2),
                  W(ae.x, ae.y, 0.7, Fo, 0.6));
              else {
                ((f.current = !0),
                  N(1),
                  e.current.hit(1.5),
                  W(ae.x, ae.y, 1.6, l_, 0.8));
                const ce = window.setTimeout(() => {
                  (O.delete(ce),
                    h.current || ((h.current = !0), e.current.onSolved()));
                }, 90);
                O.add(ce);
              }
          } else
            u.current > 0 && (u.current = Math.max(0, u.current - K * oYe));
        const ge = A.current;
        for (const q of ge) q.age += K;
        ((A.current = ge.filter((q) => q.age < q.dur)),
          L &&
            bYe(L, I, {
              t: Q,
              mote: he,
              tail: fe,
              cursor: o.current,
              holding: a.current,
              gate: ae,
              gateR: X.gateR,
              shelter: X.start,
              inGate: re,
              holdFrac: Ui(u.current / EM, 0, 1),
              parts: B,
              gustSector: T.current > 0 || ve > 0 ? S.current : null,
              teleGlow: Ui(T.current / b6, 0, 1),
              surgeEnv: ve,
              failT: m.current,
              failPos: p.current,
              done: f.current,
              shocks: A.current,
            }));
      };
      return (
        ($ = requestAnimationFrame(V)),
        () => {
          ((P = !1), cancelAnimationFrame($));
          for (const z of O) window.clearTimeout(z);
          (O.clear(), ee?.disconnect());
        }
      );
    }, []),
    jsx.jsx("div", {
      className: "flex h-full w-full flex-col gap-2 p-3 text-white/85",
      children: jsx.jsx("div", {
        ref: r,
        className: "relative min-h-0 flex-1",
        children: jsx.jsx("canvas", {
          ref: n,
          className:
            "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full",
          style: { display: "block", touchAction: "none", cursor: "grab" },
        }),
      }),
    })
  );
}
function ms(t, e) {
  const n = t.replace("#", ""),
    r = Number.parseInt(n.slice(0, 2), 16),
    i = Number.parseInt(n.slice(2, 4), 16),
    s = Number.parseInt(n.slice(4, 6), 16);
  return `rgba(${r},${i},${s},${Ui(e, 0, 1).toFixed(3)})`;
}
function bYe(t, e, n) {
  const r = e / 2,
    i = e / 2;
  (t.clearRect(0, 0, e, e),
    t.save(),
    t.beginPath(),
    t.arc(r, r, i - 1, 0, wi),
    t.clip());
  const s = t.createRadialGradient(r, r, 0, r, r, i);
  (s.addColorStop(0, "#081a30"),
    s.addColorStop(0.62, "#050f1d"),
    s.addColorStop(1, "#02060e"),
    (t.fillStyle = s),
    t.fillRect(0, 0, e, e),
    (t.globalCompositeOperation = "lighter"),
    (t.lineCap = "round"));
  for (const v of n.parts) {
    const y = Math.hypot(v.vx, v.vy);
    if (y < 1e-4) continue;
    const x = Ui(y * 0.05, 0.008, 0.05),
      w = (v.vx / y) * x,
      S = (v.vy / y) * x,
      T = 0.05 + Math.min(y * 0.09, 0.16) + n.surgeEnv * 0.05;
    ((t.strokeStyle = `rgba(80,150,230,${T.toFixed(3)})`),
      (t.lineWidth = 1.1),
      t.beginPath(),
      t.moveTo(r + (v.x - w) * i, r + (v.y - S) * i),
      t.lineTo(r + v.x * i, r + v.y * i),
      t.stroke());
  }
  ((t.globalCompositeOperation = "source-over"),
    t.save(),
    t.setLineDash([3, 7]),
    (t.strokeStyle = "rgba(110,160,225,0.10)"),
    (t.lineWidth = 1),
    t.beginPath(),
    t.arc(r, r, i * 0.93, 0, wi),
    t.stroke(),
    t.restore());
  const o = r + n.shelter.x * i,
    a = r + n.shelter.y * i;
  ((t.strokeStyle = ms(l_, 0.14)),
    (t.lineWidth = 1),
    t.beginPath(),
    t.arc(o, a, c_ * i * 0.8, 0, wi),
    t.stroke());
  const l = r + n.gate.x * i,
    c = r + n.gate.y * i,
    u = n.gateR * i,
    d = 0.5 + 0.5 * Math.sin(n.t * 2.1),
    f = t.createRadialGradient(l, c, 0, l, c, u * 1.5);
  if (
    (f.addColorStop(
      0,
      ms(Fo, 0.12 + (n.inGate ? 0.14 : 0.04 * d) + n.holdFrac * 0.2),
    ),
    f.addColorStop(1, ms(Fo, 0)),
    (t.fillStyle = f),
    t.beginPath(),
    t.arc(l, c, u * 1.5, 0, wi),
    t.fill(),
    (t.strokeStyle = ms(Fo, n.done ? 0.95 : n.inGate ? 0.85 : 0.42 + 0.12 * d)),
    (t.lineWidth = n.inGate || n.done ? 2.2 : 1.4),
    (t.shadowColor = ms(Fo, 0.8)),
    (t.shadowBlur = n.inGate || n.done ? 12 : 6),
    t.beginPath(),
    t.arc(l, c, u, 0, wi),
    t.stroke(),
    (t.shadowBlur = 0),
    (n.holdFrac > 0 || n.done) &&
      ((t.strokeStyle = ms(l_, 0.9)),
      (t.lineWidth = 2.5),
      (t.shadowColor = ms(l_, 0.9)),
      (t.shadowBlur = 8),
      t.beginPath(),
      t.arc(
        l,
        c,
        u + 5,
        -Math.PI / 2,
        -Math.PI / 2 + (n.done ? 1 : n.holdFrac) * wi,
      ),
      t.stroke(),
      (t.shadowBlur = 0)),
    n.gustSector != null)
  ) {
    const v = n.teleGlow > 0 ? n.teleGlow : n.surgeEnv * 0.7;
    ((t.strokeStyle = `rgba(200,235,255,${(v * 0.75).toFixed(3)})`),
      (t.lineWidth = 2 + v * 2.5),
      (t.shadowColor = "rgba(200,235,255,0.8)"),
      (t.shadowBlur = 10 * v),
      t.beginPath(),
      t.arc(r, r, i * 0.965, n.gustSector - 0.5, n.gustSector + 0.5),
      t.stroke(),
      (t.shadowBlur = 0));
  }
  for (const v of n.shocks) {
    const y = Ui(v.age / v.dur, 0, 1);
    ((t.strokeStyle = ms(v.color, (1 - y) * 0.7)),
      (t.lineWidth = 2 * (1 - y) + 0.5),
      t.beginPath(),
      t.arc(r + v.x * i, r + v.y * i, Math.max(y * v.maxR * i, 2), 0, wi),
      t.stroke());
  }
  if (n.cursor && n.holding && n.failT <= 0) {
    const v = r + n.mote.x * i,
      y = r + n.mote.y * i,
      x = r + n.cursor.x * i,
      w = r + n.cursor.y * i,
      S = Math.hypot(n.cursor.x - n.mote.x, n.cursor.y - n.mote.y),
      T = Ui(S / 0.5, 0, 1),
      R = x - v,
      E = w - y,
      M = Math.max(Math.hypot(R, E), 0.001),
      C = T * M * 0.16;
    ((t.strokeStyle = ms(Fo, 0.35 + T * 0.5)),
      (t.lineWidth = 1.4 + T * 1.4),
      (t.shadowColor = ms(Fo, 0.8)),
      (t.shadowBlur = 6),
      t.beginPath(),
      t.moveTo(v, y),
      t.quadraticCurveTo(
        (v + x) / 2 + (-E / M) * C,
        (y + w) / 2 + (R / M) * C,
        x,
        w,
      ),
      t.stroke(),
      (t.shadowBlur = 0));
  }
  let h = r + n.mote.x * i,
    _ = r + n.mote.y * i,
    m = 1,
    p = 1;
  if (n.failT > 0) {
    const v = sx * 0.5;
    if (n.failT > v) {
      const y = (n.failT - v) / v;
      ((h = r + n.failPos.x * i),
        (_ = r + n.failPos.y * i + (1 - y) * 10),
        (m = y),
        (p = y * 0.9));
    } else {
      const y = 1 - n.failT / v;
      ((m = y), (p = y));
    }
  }
  if (p > 0.02) {
    if (((t.globalCompositeOperation = "lighter"), n.failT <= 0)) {
      ((t.strokeStyle = "rgba(255,215,160,0.14)"),
        (t.lineWidth = 2.4),
        (t.lineJoin = "round"),
        t.beginPath(),
        t.moveTo(h, _));
      for (const v of n.tail) t.lineTo(r + v.x * i, r + v.y * i);
      t.stroke();
    }
    ((t.shadowColor = `rgba(255,215,160,${(0.9 * p).toFixed(3)})`),
      (t.shadowBlur = 14 * m),
      (t.fillStyle = `rgba(255,225,180,${(0.9 * p).toFixed(3)})`),
      t.beginPath(),
      t.arc(h, _, 4.6 * m, 0, wi),
      t.fill(),
      (t.fillStyle = `rgba(255,250,240,${p.toFixed(3)})`),
      t.beginPath(),
      t.arc(h, _, 2 * m, 0, wi),
      t.fill(),
      (t.shadowBlur = 0),
      (t.globalCompositeOperation = "source-over"));
  }
  if (n.cursor && n.failT <= 0) {
    const v = r + n.cursor.x * i,
      y = r + n.cursor.y * i;
    ((t.strokeStyle = ms(Fo, n.holding ? 0.9 : 0.5)),
      (t.lineWidth = 1.8),
      (t.shadowColor = ms(Fo, 0.8)),
      (t.shadowBlur = n.holding ? 8 : 4),
      t.beginPath(),
      t.arc(v, y, 8, 0, wi),
      t.stroke(),
      t.beginPath(),
      t.moveTo(v - 12, y),
      t.lineTo(v - 5, y),
      t.moveTo(v + 5, y),
      t.lineTo(v + 12, y),
      t.moveTo(v, y - 12),
      t.lineTo(v, y - 5),
      t.moveTo(v, y + 5),
      t.lineTo(v, y + 12),
      t.stroke(),
      (t.shadowBlur = 0));
  }
  if (n.failT > 0) {
    const v = 0.55 * (n.failT / sx) ** 1.6;
    ((t.fillStyle = `rgba(2,6,12,${v.toFixed(3)})`), t.fillRect(0, 0, e, e));
  }
  (t.restore(),
    (t.strokeStyle = "rgba(55,200,232,0.16)"),
    (t.lineWidth = 1.5),
    t.beginPath(),
    t.arc(r, r, i - 1, 0, wi),
    t.stroke());
}
const si = 1;
const zi = 2;
const Wi = 4;
const Fa = 8;
const Nn = 5;
const oc = 5;
const w6 = Nn * oc;
let S6 = 0;
const yYe = () => ((S6 += 1), (Math.imul(S6, 2654435761) ^ 49734321) >>> 0);
const M6 = (t, e) => {
    let n = (t ^ Math.imul(e + 1, 2654435761)) >>> 0;
    return (
      (n = Math.imul(n ^ (n >>> 16), 2246822507) >>> 0),
      (n ^ (n >>> 13)) >>> 0
    );
  };
const CM = 22;
const T6 = 1.5;
const E6 = 11;
const xYe = 15;
const wYe = 1;
const Vl = 60;
const jm = 4;
const RM = Vl * Nn + jm * (Nn - 1);
const SYe = Vl * oc + jm * (oc - 1);
const AM = "#ffdcae";
const MYe = "rgba(255,178,102,0.30)";
const C6 = "#4f7d9d";
const TYe = "rgba(64,130,175,0.10)";
const EYe = "#37c8e8";
const $J = (t, e) => ((t << e) | (t >>> (4 - e))) & 15;
const CYe = (t) => ((t << 2) | (t >>> 2)) & 15;
function qJ(t, e) {
  const n = (o) => {
      const a = t.tiles[o];
      return a.corroded ? 0 : $J(a.mask, (e[o] ?? 0) & 3);
    },
    r = new Map(),
    i = t.inletRow * Nn;
  if (!(n(i) & Fa)) return r;
  r.set(i, 0);
  const s = [i];
  for (; s.length;) {
    const o = s.shift(),
      a = r.get(o),
      l = (o / Nn) | 0,
      c = o % Nn,
      u = n(o),
      d = (f, h) => {
        !r.has(h) && u & f && n(h) & CYe(f) && (r.set(h, a + 1), s.push(h));
      };
    (c < Nn - 1 && d(zi, o + 1),
      c > 0 && d(Fa, o - 1),
      l > 0 && d(si, o - Nn),
      l < oc - 1 && d(Wi, o + Nn));
  }
  return r;
}
function XJ(t, e, n) {
  const r = t.outletRow * Nn + (Nn - 1);
  return n.has(r) ? ($J(t.tiles[r].mask, (e[r] ?? 0) & 3) & zi) !== 0 : !1;
}
function R6(t) {
  let e = t >>> 0;
  const n = () => (
      (e = (Math.imul(e, 1664525) + 1013904223) >>> 0),
      e / 4294967296
    ),
    r = (x) => Math.floor(n() * x);
  let i = 1,
    s = [],
    o = -1 / 0;
  for (let x = 0; x < 40; x++) {
    const w = 1 + r(oc - 2),
      S = [];
    let T = w;
    for (let N = 0; N < Nn; N++) {
      const P = [];
      for (let L = 0; L < oc; L++) {
        const O = Math.abs(L - T);
        O >= 1 && O <= 3 && P.push(L);
      }
      const D = P[r(P.length)];
      (S.push(D), (T = D));
    }
    let R = Nn,
      E = 0,
      M = 0,
      C = w;
    for (const N of S) {
      R += Math.abs(N - C);
      const P = N > C ? 1 : -1;
      (M !== 0 && P !== M && E++, (M = P), (C = N));
    }
    const A = R >= E6 && R <= xYe && E >= wYe,
      k = A ? 1 / 0 : E * 50 - Math.abs(R - (E6 + 2));
    if ((k > o && ((o = k), (i = w), (s = S)), A)) break;
  }
  const a = Array.from({ length: w6 }, () => ({
      mask: 0,
      corroded: !1,
      onPath: !1,
    })),
    l = [];
  let c = i;
  for (let x = 0; x < Nn; x++) {
    const w = s[x],
      S = w > c,
      T = S ? 1 : -1,
      R = c * Nn + x;
    ((a[R].mask = Fa | (S ? Wi : si)), (a[R].onPath = !0), l.push(R));
    for (let M = c + T; M !== w; M += T) {
      const C = M * Nn + x;
      ((a[C].mask = si | Wi), (a[C].onPath = !0), l.push(C));
    }
    const E = w * Nn + x;
    ((a[E].mask = (S ? si : Wi) | zi), (a[E].onPath = !0), l.push(E), (c = w));
  }
  const u = c,
    d = (x) => {
      const w = (x / Nn) | 0,
        S = x % Nn;
      return (
        (S > 0 && a[x - 1].onPath) ||
        (S < Nn - 1 && a[x + 1].onPath) ||
        (w > 0 && a[x - Nn].onPath) ||
        (w < oc - 1 && a[x + Nn].onPath)
      );
    },
    f = [],
    h = [];
  for (let x = 0; x < w6; x++) a[x].onPath || (d(x) ? f : h).push(x);
  const _ = Math.min(f.length + h.length, 3 + r(2));
  let m = Math.min(f.length, 1 + r(2));
  for (let x = 0; x < _; x++) {
    const w = m > 0 && f.length > 0 ? f : h.length > 0 ? h : f;
    (w === f && m--, (a[w.splice(r(w.length), 1)[0]].corroded = !0));
  }
  for (const x of [...f, ...h]) {
    const w = n();
    a[x].mask = d(x)
      ? w < 0.6
        ? si | zi
        : si | zi | Wi
      : w < 0.2
        ? si | Wi
        : w < 0.7
          ? si | zi
          : si | zi | Wi;
  }
  const p = a.map((x) => (x.corroded ? 0 : r(4))),
    v = {
      tiles: a,
      rots0: p,
      inletRow: i,
      outletRow: u,
      pathLen: l.length,
      pathCells: l,
    };
  let y = 0;
  for (; XJ(v, p, qJ(v, p)) && y < 40;) {
    const x = l[y % l.length];
    ((p[x] = ((p[x] ?? 0) + 1) % 4), y++);
  }
  return v;
}
function RYe(t) {
  switch (t) {
    case si | Wi:
      return ["M30 0V60"];
    case zi | Fa:
      return ["M0 30H60"];
    case si | zi:
      return ["M30 0A30 30 0 0 0 60 30"];
    case zi | Wi:
      return ["M60 30A30 30 0 0 0 30 60"];
    case Wi | Fa:
      return ["M30 60A30 30 0 0 0 0 30"];
    case Fa | si:
      return ["M0 30A30 30 0 0 0 30 0"];
    case si | zi | Wi:
      return ["M30 0V60", "M30 30H60"];
    case zi | Wi | Fa:
      return ["M0 30H60", "M30 30V60"];
    case si | Wi | Fa:
      return ["M30 0V60", "M0 30H30"];
    case si | zi | Fa:
      return ["M0 30H60", "M30 0V30"];
    default:
      return [];
  }
}
const AYe = (t) =>
  (t & 1) + ((t >> 1) & 1) + ((t >> 2) & 1) + ((t >> 3) & 1) === 3;
function PYe({ api: t }) {
  const e = React.useRef(t);
  e.current = t;
  const [n] = React.useState(yYe),
    [r, i] = React.useState(() => {
      const M = R6(M6(n, 0));
      return { deal: 0, board: M, rots: M.rots0.slice() };
    }),
    { deal: s, board: o, rots: a } = r,
    [l, c] = React.useState(!1),
    [u, d] = React.useState(0),
    f = React.useMemo(() => qJ(o, a), [o, a]),
    h = React.useRef(!1),
    _ = React.useRef(null),
    m = React.useRef(0),
    p = React.useRef(0),
    v = React.useRef(new Set()),
    y = React.useRef(!1),
    x = React.useRef(null);
  React.useEffect(() => {
    y.current = !0;
    const M = v.current;
    return () => {
      y.current = !1;
      for (const C of M) clearTimeout(C);
      M.clear();
    };
  }, []);
  const w = React.useCallback((M, C) => {
    const A = setTimeout(() => {
      (v.current.delete(A), y.current && C());
    }, M);
    v.current.add(A);
  }, []);
  React.useEffect(() => {
    if (h.current) return;
    m.current !== s && ((m.current = s), (_.current = null));
    const M = _.current;
    if (M) {
      let k = 0;
      for (const N of f.keys()) M.has(N) || k++;
      k > 0 && e.current.hit(Math.min(1.2, 0.3 + k * 0.18));
    }
    _.current = new Set(f.keys());
    const C = XJ(o, a, f),
      A = C ? 1 : Math.max(p.current, Math.min(0.95, f.size / o.pathLen));
    if (
      ((A - p.current > 0.004 || (C && p.current < 1)) &&
        ((p.current = A), e.current.onProgress(A)),
      C)
    ) {
      ((h.current = !0), c(!0), e.current.hit(1.6));
      let k = 0;
      for (const N of f.values()) N > k && (k = N);
      w(k * 45 + 620, () => e.current.onSolved());
    }
  }, [f, o, a, s, w]);
  const S = React.useCallback(() => {
    i((M) => {
      const C = M.deal + 1,
        A = R6(M6(n, C));
      return { deal: C, board: A, rots: A.rots0.slice() };
    });
  }, [n]);
  React.useEffect(() => {
    let M = !0,
      C = 0,
      A = performance.now(),
      k = 0,
      N = !1;
    const P = (D) => {
      if (!M) return;
      C = requestAnimationFrame(P);
      const L = Math.min(0.05, Math.max(0, (D - A) / 1e3));
      ((A = D),
        !h.current &&
          ((k += L),
          !N && k >= CM - T6 && ((N = !0), d((O) => O + 1)),
          k >= CM && ((k = 0), (N = !1), S()),
          x.current &&
            (x.current.style.transform = `scaleX(${Math.min(1, k / CM)})`)));
    };
    return (
      (C = requestAnimationFrame(P)),
      () => {
        ((M = !1), cancelAnimationFrame(C));
      }
    );
  }, [S]);
  const T = (M) => {
      h.current ||
        i((C) => {
          if (C.board.tiles[M].corroded) return C;
          const A = C.rots.slice();
          return ((A[M] = (A[M] ?? 0) + 1), { ...C, rots: A });
        });
    },
    R = o.inletRow * (Vl + jm) + Vl / 2,
    E = o.outletRow * (Vl + jm) + Vl / 2;
  return jsx.jsxs("div", {
    className:
      "flex h-full w-full select-none flex-col items-center justify-center",
    style: { background: "rgb(5,15,29)", pointerEvents: l ? "none" : void 0 },
    children: [
      jsx.jsxs("div", {
        className: "relative",
        style: { width: RM, height: SYe },
        children: [
          jsx.jsx("div", {
            className: "absolute inset-0 grid",
            style: {
              gridTemplateColumns: `repeat(${Nn}, ${Vl}px)`,
              gridTemplateRows: `repeat(${oc}, ${Vl}px)`,
              gap: jm,
            },
            children: o.tiles.map((M, C) => {
              if (M.corroded)
                return jsx.jsx(
                  "div",
                  {
                    "data-tile": C,
                    className: "relative rounded-lg",
                    style: {
                      background: "rgba(4,12,24,0.9)",
                      border: "1px solid rgba(70,110,150,0.08)",
                    },
                    children: jsx.jsxs("svg", {
                      viewBox: "0 0 60 60",
                      width: "100%",
                      height: "100%",
                      style: { display: "block" },
                      children: [
                        jsx.jsx("path", {
                          d: "M6 18Q22 26 34 16T56 22",
                          fill: "none",
                          stroke: "#14304d",
                          strokeWidth: 2.5,
                          strokeLinecap: "round",
                        }),
                        jsx.jsx("path", {
                          d: "M4 40Q20 34 34 44T58 38",
                          fill: "none",
                          stroke: "#112a44",
                          strokeWidth: 2,
                          strokeLinecap: "round",
                        }),
                        jsx.jsx("circle", {
                          cx: 15,
                          cy: 49,
                          r: 2.2,
                          fill: "#0a1f36",
                        }),
                        jsx.jsx("circle", {
                          cx: 45,
                          cy: 12,
                          r: 1.7,
                          fill: "#0a1f36",
                        }),
                        jsx.jsx("circle", {
                          cx: 29,
                          cy: 29,
                          r: 2.6,
                          fill: "#0a1f36",
                        }),
                      ],
                    }),
                  },
                  `${s}:${C}`,
                );
              const A = f.has(C),
                k = RYe(M.mask),
                N = a[C] ?? 0;
              return jsx.jsxs(
                "button",
                {
                  type: "button",
                  "data-tile": C,
                  onClick: (P) => {
                    (P.currentTarget.blur(), T(C));
                  },
                  className: "group relative cursor-pointer rounded-lg p-0",
                  style: {
                    background: A
                      ? "rgba(255,178,102,0.06)"
                      : "rgba(96,156,205,0.05)",
                    border: `1px solid ${A ? "rgba(255,190,120,0.22)" : "rgba(130,180,225,0.10)"}`,
                    transition:
                      "background 220ms ease, border-color 220ms ease",
                  },
                  children: [
                    jsx.jsxs("svg", {
                      viewBox: "0 0 60 60",
                      width: "100%",
                      height: "100%",
                      style: {
                        display: "block",
                        transform: `rotate(${N * 90}deg)`,
                        transition:
                          "transform 300ms cubic-bezier(0.34,1.46,0.64,1)",
                      },
                      children: [
                        k.map((P) =>
                          jsx.jsx(
                            "path",
                            {
                              d: P,
                              fill: "none",
                              stroke: A ? MYe : TYe,
                              strokeWidth: 10,
                              strokeLinecap: "round",
                              style: { transition: "stroke 200ms ease" },
                            },
                            `g${P}`,
                          ),
                        ),
                        k.map((P) =>
                          jsx.jsx(
                            "path",
                            {
                              d: P,
                              fill: "none",
                              stroke: A ? AM : C6,
                              strokeWidth: 4.5,
                              strokeLinecap: "round",
                              style: { transition: "stroke 200ms ease" },
                            },
                            `c${P}`,
                          ),
                        ),
                        AYe(M.mask) &&
                          jsx.jsx("circle", {
                            cx: 30,
                            cy: 30,
                            r: 4.5,
                            fill: A ? AM : C6,
                            style: { transition: "fill 200ms ease" },
                          }),
                      ],
                    }),
                    jsx.jsx("span", {
                      className:
                        "pointer-events-none absolute inset-0 rounded-lg opacity-0 transition-opacity duration-150 group-hover:opacity-100",
                      style: { background: "rgba(140,190,235,0.07)" },
                    }),
                    l &&
                      A &&
                      jsx.jsx("span", {
                        className:
                          "pointer-events-none absolute inset-0 rounded-lg",
                        style: {
                          animation: "relayFlood 560ms ease-out both",
                          animationDelay: `${(f.get(C) ?? 0) * 45}ms`,
                        },
                      }),
                  ],
                },
                `${s}:${C}`,
              );
            }),
          }),
          s > 0 &&
            !l &&
            jsx.jsx(
              "div",
              {
                className: "pointer-events-none absolute inset-0 rounded-lg",
                style: { animation: "relayRedeal 480ms ease-out both" },
              },
              s,
            ),
          u > 0 &&
            !l &&
            jsx.jsx("div", {
              className:
                "pointer-events-none absolute inset-0 overflow-hidden rounded-lg",
              children: jsx.jsx(
                "div",
                {
                  className: "absolute inset-y-0",
                  style: {
                    width: 76,
                    background:
                      "linear-gradient(90deg, rgba(30,70,120,0), rgba(56,110,170,0.30), rgba(120,180,235,0.16), rgba(30,70,120,0))",
                    animation: `relaySweep ${T6}s linear both`,
                  },
                },
                u,
              ),
            }),
          jsx.jsx("div", {
            className: "absolute",
            style: {
              left: -18,
              top: R - 3,
              width: 16,
              height: 6,
              borderRadius: 3,
              background:
                "linear-gradient(90deg, rgba(255,190,120,0), #ffd9a4)",
              boxShadow: "0 0 10px 2px rgba(255,180,104,0.45)",
            },
          }),
          jsx.jsx("div", {
            className: "absolute",
            style: {
              right: -20,
              top: E - 6,
              width: 12,
              height: 12,
              borderRadius: "50%",
              border: `2px solid ${l ? AM : EYe}`,
              background: l ? "rgba(255,220,174,0.35)" : "transparent",
              boxShadow: l
                ? "0 0 12px 3px rgba(255,180,104,0.55)"
                : "0 0 10px rgba(55,200,232,0.35)",
              transition:
                "border-color 300ms ease, background 300ms ease, box-shadow 300ms ease",
            },
          }),
        ],
      }),
      jsx.jsx("div", {
        className: "overflow-hidden rounded-full",
        style: {
          width: RM,
          height: 3,
          marginTop: 14,
          background: "rgba(120,170,220,0.10)",
          opacity: l ? 0 : 1,
          transition: "opacity 300ms ease",
        },
        children: jsx.jsx("div", {
          ref: x,
          className: "h-full w-full",
          style: {
            transformOrigin: "left",
            transform: "scaleX(0)",
            background: "rgba(70,125,175,0.55)",
          },
        }),
      }),
      jsx.jsx("style", {
        children: `
        @keyframes relaySweep {
          from { transform: translateX(-80px); }
          to   { transform: translateX(${RM + 8}px); }
        }
        @keyframes relayRedeal {
          0%   { background: rgba(96,150,205,0.22); }
          100% { background: rgba(96,150,205,0); }
        }
        @keyframes relayFlood {
          0%   { background: rgba(255,190,116,0); }
          40%  { background: rgba(255,190,116,0.38); }
          100% { background: rgba(255,190,116,0.10); }
        }
      `,
      }),
    ],
  });
}
const ri = 6;
const bC = [
    { len: 3, step: 0.52, fakes: 0 },
    { len: 4, step: 0.46, fakes: 2 },
    { len: 5, step: 0.41, fakes: 3 },
  ];
const PM = 0.6;
const kYe = 0.45;
const A6 = 0.95;
const DYe = 0.9;
const LYe = 6.5;
const NYe = 0.7;
const IM = (t, e, n) => (t < e ? e : t > n ? n : t);
const Po = (t) => `rgba(255,213,158,${t.toFixed(3)})`;
const Gd = (t) => `rgba(55,200,232,${t.toFixed(3)})`;
const tb = (t) => `rgba(200,205,212,${t.toFixed(3)})`;
const P6 = (t) => `rgba(255,86,72,${t.toFixed(3)})`;
function KJ(t) {
  let e = t >>> 0 || 1;
  return () => (
    (e = (Math.imul(e, 1664525) + 1013904223) >>> 0),
    e / 4294967296
  );
}
function I6(t, e) {
  const n = bC[t],
    r = KJ(247729681 + t * 7919 + e * 104729),
    i = [];
  for (let o = 0; o < n.len; o++) {
    let a = Math.floor(r() * ri);
    (o > 0 && a === i[o - 1] && (a = (a + 1 + Math.floor(r() * (ri - 1))) % ri),
      i.push(a));
  }
  const s = i.map((o, a) => ({ t: PM + a * n.step, pad: o, fake: !1 }));
  if (n.fakes > 0) {
    const o = Array.from({ length: n.len }, (a, l) => l);
    for (let a = o.length - 1; a > 0; a--) {
      const l = Math.floor(r() * (a + 1)),
        c = o[a];
      ((o[a] = o[l]), (o[l] = c));
    }
    for (const a of o.slice(0, n.fakes)) {
      let l = Math.floor(r() * ri);
      for (; l === i[a] || l === i[a + 1];) l = (l + 1) % ri;
      s.push({ t: PM + (a + 0.42 + r() * 0.2) * n.step, pad: l, fake: !0 });
    }
    s.sort((a, l) => a.t - l.t);
  }
  return { seq: i, pulses: s, total: PM + (n.len - 1) * n.step + kYe };
}
function OYe({ api: t }) {
  const e = React.useRef(t);
  e.current = t;
  const n = React.useRef(!1),
    r = React.useRef(null),
    i = React.useRef(null),
    s = React.useRef(null),
    o = React.useRef({ x: 0, y: 0, inside: !1 });
  return (
    React.useEffect(() => {
      let a = !0;
      const l = i.current,
        c = l?.getContext("2d") ?? null;
      let u = 0,
        d = Math.min(2, window.devicePixelRatio || 1),
        f = 0,
        h = 0,
        _ = 0,
        m = 0,
        p = 0,
        v = 0,
        y = 0,
        x = 0;
      const w = new Float64Array(ri),
        S = new Float64Array(ri),
        T = () => {
          const K = r.current;
          if (!l || !K) return;
          const Q = K.getBoundingClientRect();
          if (Q.width <= 0 || Q.height <= 0) return;
          d = Math.min(2, window.devicePixelRatio || 1);
          const X = Math.max(1, Math.round(Q.width * d)),
            he = Math.max(1, Math.round(Q.height * d));
          if (!(X === _ && he === m)) {
            ((_ = X),
              (m = he),
              (l.width = X),
              (l.height = he),
              (f = X / d),
              (h = he / d),
              c && c.setTransform(d, 0, 0, d, 0, 0),
              (p = f / 2),
              (v = h * 0.52),
              (y = Math.min(f, h) * 0.32),
              (x = Math.min(f, h) * 0.082));
            for (let U = 0; U < ri; U++) {
              const ae = -Math.PI / 2 + (U * Math.PI * 2) / ri;
              ((w[U] = p + Math.cos(ae) * y), (S[U] = v + Math.sin(ae) * y));
            }
          }
        };
      T();
      let R = "watch",
        E = 0,
        M = 0,
        C = 0,
        A = !0,
        k = 0,
        N = 0,
        P = 0,
        D = I6(0, 0),
        L = 0,
        O = 0,
        I = -1e9;
      const F = new Float64Array(ri).fill(-1e9),
        G = new Float64Array(ri).fill(-1e9),
        ee = new Float64Array(ri).fill(-1e9);
      let oe = [],
        W = !1;
      const $ = () => {
        e.current.onProgress(IM((P + O / D.seq.length) / 3, 0, 1));
      };
      $();
      const ne = () => {
        ((D = I6(k, N)),
          (L = 0),
          (O = 0),
          (oe = []),
          F.fill(-1e9),
          G.fill(-1e9),
          ee.fill(-1e9),
          (R = "watch"),
          (E = 0));
      };
      s.current = (K, Q) => {
        if (R !== "answer" || n.current) return;
        let X = -1;
        for (let U = 0; U < ri; U++)
          if (Math.hypot(K - w[U], Q - S[U]) <= x * 1.3) {
            X = U;
            break;
          }
        if (X < 0) return;
        const he = performance.now();
        X === D.seq[O]
          ? ((F[X] = he),
            oe.push({ x: w[X], y: S[X], t0: he }),
            (O += 1),
            e.current.hit(0.45),
            O >= D.seq.length
              ? ((P += 1),
                (O = 0),
                $(),
                (I = he),
                P >= bC.length
                  ? ((R = "won"), (E = 0), e.current.hit(1.5))
                  : ((R = "clear"), (E = 0), e.current.hit(1.2)))
              : $())
          : ((ee[X] = he),
            (O = 0),
            $(),
            e.current.hit(0.3),
            (oe = []),
            (R = "dissolve"),
            (E = 0));
      };
      const V = (K) => {
          if (!c || f <= 0 || h <= 0) return;
          const Q = R === "answer",
            X = R === "dissolve" ? IM(E / A6, 0, 1) : 0;
          ((c.fillStyle = "rgb(5,15,29)"), c.fillRect(0, 0, f, h));
          const he = c.createRadialGradient(p, v, 0, p, v, y * 1.9);
          (he.addColorStop(0, "rgba(23,48,76,0.32)"),
            he.addColorStop(1, "rgba(23,48,76,0)"),
            (c.fillStyle = he),
            c.fillRect(0, 0, f, h),
            c.beginPath(),
            c.arc(p, v, y, 0, Math.PI * 2),
            (c.strokeStyle = Q ? Gd(0.12) : "rgba(160,195,220,0.05)"),
            (c.lineWidth = 1),
            c.stroke());
          const U = (K - I) / 850;
          if (U >= 0 && U < 1) {
            const j = 1 - (1 - U) ** 3;
            (c.beginPath(),
              c.arc(p, v, 6 + j * y * 1.55, 0, Math.PI * 2),
              (c.strokeStyle = Po((1 - U) * 0.55)),
              (c.lineWidth = 2.5),
              c.stroke());
          }
          let ae = -1;
          if (Q && o.current.inside) {
            for (let j = 0; j < ri; j++)
              if (
                Math.hypot(o.current.x - w[j], o.current.y - S[j]) <=
                x * 1.3
              ) {
                ae = j;
                break;
              }
          }
          if (l) {
            const j = ae >= 0 ? "pointer" : "default";
            l.style.cursor !== j && (l.style.cursor = j);
          }
          for (let j = 0; j < ri; j++) {
            const B = w[j],
              fe = S[j],
              be = K - F[j],
              Pe = K - G[j],
              re = K - ee[j],
              ue = (be < 550 ? (1 - be / 550) ** 2 : 0) * (1 - X),
              de = Pe < 120 ? 1 : Pe < 300 ? 1 - (Pe - 120) / 180 : 0,
              Y = re < 120 ? 1 : re < 300 ? 1 - (re - 120) / 180 : 0;
            if (
              (c.beginPath(),
              c.arc(B, fe, x, 0, Math.PI * 2),
              (c.fillStyle = `rgba(255,255,255,${Q ? 0.045 : 0.025})`),
              c.fill(),
              (c.strokeStyle =
                R === "won"
                  ? Po(0.55)
                  : Q
                    ? Gd(ae === j ? 0.65 : 0.32)
                    : R === "dissolve"
                      ? tb(0.06 + 0.18 * (1 - X))
                      : "rgba(170,205,230,0.14)"),
              (c.lineWidth = ae === j ? 1.8 : 1.2),
              c.stroke(),
              ue > 0.004)
            ) {
              const ge = c.createRadialGradient(B, fe, 0, B, fe, x * 2.3);
              (ge.addColorStop(0, `rgba(255,229,196,${(0.8 * ue).toFixed(3)})`),
                ge.addColorStop(0.35, Po(0.5 * ue)),
                ge.addColorStop(1, Po(0)),
                (c.fillStyle = ge),
                c.beginPath(),
                c.arc(B, fe, x * 2.3, 0, Math.PI * 2),
                c.fill());
            }
            if (de > 0.004) {
              const ge = x * 0.88;
              (c.save(),
                c.beginPath(),
                c.arc(B, fe, ge, 0, Math.PI * 2),
                c.clip(),
                (c.fillStyle = `rgba(178,36,30,${(0.42 * de).toFixed(3)})`),
                c.fillRect(B - ge, fe - ge, ge * 2, ge * 2));
              const q = Math.floor(Pe / 90),
                ce = KJ(24301 + j * 131 + q * 7919);
              ((c.font = `600 ${Math.max(9, Math.round(x * 0.46))}px ui-monospace, SFMono-Regular, Menlo, monospace`),
                (c.textAlign = "center"),
                (c.textBaseline = "middle"));
              for (let Te = 0; Te < 6; Te++) {
                const Re = ce() * Math.PI * 2,
                  Ce = Math.sqrt(ce()) * ge * 0.7;
                ((c.fillStyle = P6((0.55 + 0.35 * ce()) * de)),
                  c.fillText(
                    ce() < 0.5 ? "0" : "1",
                    B + Math.cos(Re) * Ce,
                    fe + Math.sin(Re) * Ce,
                  ));
              }
              (c.restore(),
                c.beginPath(),
                c.arc(B, fe, ge, 0, Math.PI * 2),
                (c.strokeStyle = P6(0.72 * de)),
                (c.lineWidth = 1.4),
                c.stroke());
            }
            Y > 0.004 &&
              (c.beginPath(),
              c.arc(B, fe, x * 0.94, 0, Math.PI * 2),
              (c.fillStyle = tb(0.78 * Y)),
              c.fill());
          }
          for (const j of oe) {
            const B = (K - j.t0) / 650;
            B >= 1 ||
              (c.beginPath(),
              c.arc(j.x, j.y, x * (1 + B * 1.5), 0, Math.PI * 2),
              (c.strokeStyle = Po((1 - B) * 0.5)),
              (c.lineWidth = 2),
              c.stroke());
          }
          let pe,
            _e,
            J = 6;
          if (R === "watch") {
            const j = 0.5 + 0.5 * Math.sin(K * 0.006);
            ((pe = `rgba(255,229,196,${(0.55 + 0.35 * j).toFixed(3)})`),
              (_e = Po(0.16 + 0.24 * j)),
              (J = 6 + j * 1.5));
          } else
            R === "answer"
              ? ((pe = Gd(0.95)), (_e = Gd(0.3)), (J = 6.5))
              : R === "dissolve"
                ? ((pe = tb(0.15 + 0.5 * (1 - X))), (_e = tb(0.1)), (J = 5.5))
                : ((pe = "rgba(255,236,208,0.95)"), (_e = Po(0.45)), (J = 7));
          const le = c.createRadialGradient(p, v, 0, p, v, 26);
          (le.addColorStop(0, _e),
            le.addColorStop(1, "rgba(0,0,0,0)"),
            (c.fillStyle = le),
            c.beginPath(),
            c.arc(p, v, 26, 0, Math.PI * 2),
            c.fill(),
            c.beginPath(),
            c.arc(p, v, J, 0, Math.PI * 2),
            (c.fillStyle = pe),
            c.fill(),
            Q &&
              (c.beginPath(),
              c.arc(p, v, 13, 0, Math.PI * 2),
              (c.strokeStyle = Gd(0.5)),
              (c.lineWidth = 1.5),
              c.stroke()));
          for (let j = 0; j < bC.length; j++) {
            const B = p + (j - 1) * 16;
            (c.beginPath(),
              c.arc(B, 18, 3, 0, Math.PI * 2),
              j < P
                ? ((c.fillStyle = Po(0.9)), c.fill())
                : j === k
                  ? ((c.strokeStyle = Q ? Gd(0.6) : Po(0.5)),
                    (c.lineWidth = 1.2),
                    c.stroke())
                  : ((c.fillStyle = "rgba(255,255,255,0.12)"), c.fill()));
          }
          const se = D.seq.length,
            ve = 13,
            we = p - ((se - 1) * ve) / 2,
            me = R === "dissolve" ? (1 - X) * 0.5 : 1;
          for (let j = 0; j < se; j++) {
            const B = R === "clear" || R === "won" ? !0 : j < O;
            (c.beginPath(),
              c.arc(we + j * ve, h - 16, 2.8, 0, Math.PI * 2),
              (c.fillStyle = B
                ? Po(0.9 * me)
                : `rgba(255,255,255,${(0.13 * me).toFixed(3)})`),
              c.fill());
          }
        },
        z = (K) => {
          if (!a) return;
          ((u = requestAnimationFrame(z)), T());
          const Q = A ? 0 : IM((K - C) / 1e3, 0, 0.05);
          if (((A = !1), (C = K), (E += Q), R === "watch")) {
            for (; L < D.pulses.length && D.pulses[L].t <= E;) {
              const X = D.pulses[L];
              (X.fake
                ? (G[X.pad] = K)
                : ((F[X.pad] = K),
                  oe.push({ x: w[X.pad], y: S[X.pad], t0: K })),
                (L += 1));
            }
            E >= D.total && ((R = "answer"), (E = 0), (M = 0));
          } else
            R === "answer"
              ? O === 0 && ((M += Q), M >= LYe && ne())
              : R === "dissolve"
                ? E >= A6 && ((N += 1), ne())
                : R === "clear"
                  ? E >= DYe && ((k += 1), (N = 0), ne())
                  : !W &&
                    E >= NYe &&
                    ((W = !0),
                    n.current || ((n.current = !0), e.current.onSolved()));
          ((oe = oe.filter((X) => K - X.t0 < 700)), V(K));
        };
      u = requestAnimationFrame(z);
      const te = new ResizeObserver(() => T());
      return (
        r.current && te.observe(r.current),
        () => {
          ((a = !1),
            cancelAnimationFrame(u),
            te.disconnect(),
            (s.current = null));
        }
      );
    }, []),
    jsx.jsx("div", {
      ref: r,
      className: "relative h-full w-full overflow-hidden",
      style: { background: "rgb(5,15,29)" },
      children: jsx.jsx("canvas", {
        ref: i,
        className: "absolute inset-0 h-full w-full touch-none select-none",
        onPointerDown: (a) => {
          a.preventDefault();
          const l = a.currentTarget.getBoundingClientRect();
          s.current?.(a.clientX - l.left, a.clientY - l.top);
        },
        onPointerMove: (a) => {
          const l = a.currentTarget.getBoundingClientRect();
          o.current = {
            x: a.clientX - l.left,
            y: a.clientY - l.top,
            inside: !0,
          };
        },
        onPointerLeave: () => {
          o.current = { ...o.current, inside: !1 };
        },
      }),
    })
  );
}
const Yf = Math.PI * 2;
const Bo = (t, e, n) => (t < e ? e : t > n ? n : t);
const kM = (t, e, n) => t + (e - t) * n;
const Cn = 48;
const ti = 36;
const DM = Cn * ti;
const YJ = 0.6;
const QI = Math.round((Cn * (1 - YJ)) / 2);
const ZJ = Cn - QI;
const ek = Math.round((ti * (1 - YJ)) / 2);
const JJ = ti - ek;
const _C = (ZJ - QI) * (JJ - ek);
const LM = (t, e) => t >= ek && t < JJ && e >= QI && e < ZJ;
const Al = 13.5;
const QJ = 0.12;
const BYe = 0.012;
const UYe = 6.5;
const VYe = 5.9;
const GYe = 1.6;
const k6 = 0.9;
const D6 = 8.1;
const jYe = 0.92;
const nb = 1.5;
const HYe = 0.7;
const zYe = 0.95;
const WYe = 0.055;
const L6 = 100;
const $Ye = 46;
const rb = ["0", "1", "-", ""];
const cm = [0.3, 0.5, 0.78];
const yC = [0.3, 0.6, 0.9];
function xC(t) {
  let e = t >>> 0;
  return () => ((e = (e * 1664525 + 1013904223) >>> 0), e / 4294967295);
}
function ib(t, e) {
  let n = (Math.imul(t, 374761393) + Math.imul(e, 668265263)) | 0;
  return (
    (n = Math.imul(n ^ (n >>> 13), 1274126177)),
    ((n ^ (n >>> 16)) >>> 0) / 4294967296
  );
}
function qYe() {
  const t = xC(5743219),
    e = [];
  for (let n = 0; n < 2; n++)
    for (let r = 0; r < L6; r++) {
      const i = (r + t() * 0.8) / L6;
      e.push({
        ang: n * Math.PI + i * 4.6 + (t() - 0.5) * 0.5 * (0.3 + i),
        r: (0.1 + 0.9 * Math.pow(i, 0.78)) * (1 + (t() - 0.5) * 0.16),
        size: (0.6 + t() * 1.6) * (1.2 - i * 0.5),
        a: Bo(0.35 + t() * 0.5 - i * 0.18, 0.12, 0.85),
        warm: Bo(1 - i + (t() - 0.5) * 0.3, 0, 1),
        twPhase: t() * Yf,
        twFreq: 0.6 + t() * 1.4,
        dust: !1,
      });
    }
  for (let n = 0; n < $Ye; n++)
    e.push({
      ang: t() * Yf,
      r: 0.2 + t() * 1.05,
      size: 0.5 + t() * 1.1,
      a: 0.08 + t() * 0.12,
      warm: 0,
      twPhase: t() * Yf,
      twFreq: 0.4 + t() * 0.8,
      dust: !0,
    });
  return e;
}
function XYe() {
  return {
    cells: new Uint8Array(DM).fill(1),
    changedAt: new Float32Array(DM).fill(-9),
    dirty: DM,
    dirtyTarget: _C,
    rngRegrow: xC(13636922),
    rngBurst: xC(11543934),
    nebula: qYe(),
    regrowAt: QJ,
    burstAt: UYe,
    patch: null,
    patchIdx: 0,
    flashAt: -9,
    hold: 0,
    winAt: -1,
    fired: !1,
    smooth: 0,
    reported: -1,
    thrArmed: yC.map(() => !0),
  };
}
function KYe(t, e, n) {
  const r = Math.max(2, Math.ceil(t * n)),
    i = Math.max(2, Math.ceil(e * n)),
    s = document.createElement("canvas");
  ((s.width = r * rb.length * cm.length), (s.height = i));
  const o = s.getContext("2d");
  if (o) {
    ((o.textAlign = "center"),
      (o.textBaseline = "middle"),
      (o.font = `${Math.max(5, Math.floor(i * 0.74))}px ui-monospace, Menlo, monospace`));
    for (let a = 0; a < rb.length; a++)
      for (let l = 0; l < cm.length; l++) {
        const c = (a * cm.length + l) * r;
        ((o.fillStyle = "rgba(7,16,30,0.95)"),
          o.fillRect(c, 0, r, i),
          rb[a] &&
            ((o.fillStyle = `rgba(200,205,212,${cm[l]})`),
            o.fillText(rb[a], c + r / 2, i / 2 + 0.5)));
      }
  }
  return { cv: s, sw: r, sh: i };
}
function YYe({ api: t }) {
  const e = React.useRef(t);
  e.current = t;
  const n = React.useRef(null),
    r = React.useRef(null),
    i = React.useRef(null);
  i.current || (i.current = XYe());
  const s = React.useRef(0),
    o = React.useRef({ w: 0, h: 0 }),
    a = React.useRef({ x: 0, y: 0, lastX: 0, lastY: 0, down: !1, hover: !1 }),
    l = React.useCallback((d, f) => {
      const h = i.current,
        { w: _, h: m } = o.current;
      if (!h || _ <= 0 || m <= 0 || h.winAt >= 0) return;
      const p = _ / Cn,
        v = m / ti,
        y = Math.max(0, Math.floor((d - Al) / p)),
        x = Math.min(Cn - 1, Math.floor((d + Al) / p)),
        w = Math.max(0, Math.floor((f - Al) / v)),
        S = Math.min(ti - 1, Math.floor((f + Al) / v));
      for (let T = w; T <= S; T++)
        for (let R = y; R <= x; R++) {
          const E = (R + 0.5) * p - d,
            M = (T + 0.5) * v - f;
          if (E * E + M * M > Al * Al) continue;
          const C = T * Cn + R;
          h.cells[C] &&
            ((h.cells[C] = 0),
            (h.changedAt[C] = s.current),
            h.dirty--,
            LM(T, R) && h.dirtyTarget--);
        }
    }, []),
    c = React.useCallback(
      (d, f) => {
        const h = a.current,
          _ = d - h.lastX,
          m = f - h.lastY,
          p = Math.max(1, Math.ceil(Math.hypot(_, m) / (Al * 0.55)));
        for (let v = 1; v <= p; v++)
          l(h.lastX + (_ * v) / p, h.lastY + (m * v) / p);
        ((h.lastX = d), (h.lastY = f));
      },
      [l],
    ),
    u = React.useCallback((d) => {
      const f = r.current;
      if (!f) return null;
      const h = f.getBoundingClientRect();
      return h.width <= 0 || h.height <= 0
        ? null
        : { x: d.clientX - h.left, y: d.clientY - h.top };
    }, []);
  return (
    React.useEffect(() => {
      let d = !0;
      const f = r.current,
        h = f?.getContext("2d") ?? null;
      let _ = 0,
        m = performance.now(),
        p = !0,
        v = null,
        y = -1,
        x = -1,
        w = null,
        S = null;
      const T = new Uint8Array(ti * Cn);
      let R = null,
        E = 0;
      const M = 9,
        C = () => {
          if (!f) return;
          const P = n.current?.getBoundingClientRect();
          if (!P || P.width <= 0 || P.height <= 0) return;
          const D = Bo(window.devicePixelRatio || 1, 1, 2),
            L = Math.max(1, Math.round(P.width * D)),
            O = Math.max(1, Math.round(P.height * D));
          if (((o.current = { w: P.width, h: P.height }), L === y && O === x))
            return;
          ((y = L),
            (x = O),
            (f.width = L),
            (f.height = O),
            h?.setTransform(D, 0, 0, D, 0, 0),
            (v = KYe(P.width / Cn, P.height / ti, D)),
            (w = document.createElement("canvas")),
            (w.width = L),
            (w.height = O),
            (S = w.getContext("2d")),
            S?.setTransform(D, 0, 0, D, 0, 0),
            T.fill(0),
            (R = document.createElement("canvas")));
          const I = 128;
          R.width = R.height = I;
          const F = R.getContext("2d");
          if (F) {
            const G = F.createRadialGradient(
              I / 2,
              I / 2,
              0,
              I / 2,
              I / 2,
              I / 2,
            );
            (G.addColorStop(0, "rgba(255,214,160,1)"),
              G.addColorStop(1, "rgba(255,214,160,0)"),
              (F.fillStyle = G),
              F.fillRect(0, 0, I, I));
          }
        };
      C();
      let A = null;
      typeof ResizeObserver < "u" &&
        n.current &&
        ((A = new ResizeObserver(C)), A.observe(n.current));
      const k = (P, D) => {
          const L = P.cells,
            O = [];
          for (let I = 0, F = 0; I < ti; I++)
            for (let G = 0; G < Cn; G++, F++) {
              if (L[F]) continue;
              let ee = 0;
              (G > 0 && L[F - 1] && ee++,
                G < Cn - 1 && L[F + 1] && ee++,
                I > 0 && L[F - Cn] && ee++,
                I < ti - 1 && L[F + Cn] && ee++,
                ee && P.rngRegrow() < ee * BYe && O.push(F));
            }
          for (const I of O)
            ((L[I] = 1),
              (P.changedAt[I] = D),
              P.dirty++,
              LM((I / Cn) | 0, I % Cn) && P.dirtyTarget++);
        },
        N = (P) => {
          if (!d) return;
          _ = requestAnimationFrame(N);
          const D = (P - m) / 1e3,
            L = p ? 0 : Bo(D, 0, 0.05);
          ((p = !1), (m = P), (s.current += L));
          const O = s.current;
          C();
          const I = i.current;
          if (!I) return;
          for (; O - I.regrowAt >= 0 && !(I.winAt >= 0);)
            (k(I, O), (I.regrowAt += QJ));
          if (I.winAt < 0) {
            if (I.patch === null && O >= I.burstAt - k6) {
              const J = 4 + I.rngBurst() * (Cn - 8),
                le = 3 + I.rngBurst() * (ti - 6),
                se = [];
              for (let ve = 0, we = 0; ve < ti; ve++)
                for (let me = 0; me < Cn; me++, we++) {
                  const j = me + 0.5 - J,
                    B = ve + 0.5 - le,
                    fe = 0.75 + ib(we, I.patchIdx) * 0.55;
                  j * j + B * B <= D6 * D6 * fe && se.push(we);
                }
              I.patch = se;
            }
            if (I.patch && O >= I.burstAt) {
              for (const J of I.patch)
                I.cells[J] ||
                  ((I.cells[J] = 1),
                  (I.changedAt[J] = O),
                  I.dirty++,
                  LM((J / Cn) | 0, J % Cn) && I.dirtyTarget++);
              ((I.flashAt = O),
                (I.patch = null),
                I.patchIdx++,
                (I.burstAt = O + VYe + I.rngBurst() * GYe),
                1 - I.dirtyTarget / _C >= 0.6 && e.current.hit(0.8));
            }
          }
          const F = 1 - I.dirtyTarget / _C;
          for (let J = 0; J < yC.length; J++) {
            const le = yC[J];
            I.thrArmed[J] && F >= le
              ? ((I.thrArmed[J] = !1), e.current.hit(0.5 + J * 0.25))
              : !I.thrArmed[J] && F < le - 0.06 && (I.thrArmed[J] = !0);
          }
          I.smooth += (F - I.smooth) * Math.min(1, L / 0.9);
          const G = I.winAt >= 0 ? 1 : Bo(I.smooth, 0, 1);
          ((Math.abs(G - I.reported) > 0.004 ||
            (G === 1 && I.reported !== 1)) &&
            ((I.reported = G), e.current.onProgress(G)),
            I.winAt < 0
              ? F >= jYe
                ? ((I.hold = Math.min(nb, I.hold + L)),
                  I.hold >= nb && ((I.winAt = O), e.current.hit(1.4)))
                : (I.hold = 0)
              : !I.fired &&
                O - I.winAt >= zYe &&
                ((I.fired = !0), e.current.onSolved()));
          const { w: ee, h: oe } = o.current;
          if (!h || !v || ee <= 0 || oe <= 0) return;
          const W = ee / Cn,
            $ = oe / ti,
            ne = ee / 2,
            V = oe / 2,
            z = Math.min(ee, oe) * 0.42,
            te = I.winAt >= 0 ? Bo((O - I.winAt) / 0.8, 0, 1) : 0;
          ((h.fillStyle = "#050f1d"), h.fillRect(0, 0, ee, oe));
          const K = z * (0.4 + te * 0.75),
            Q = 0.2 + te * 0.3 + (I.hold / nb) * 0.08;
          R &&
            ((h.globalAlpha = Q),
            h.drawImage(R, ne - K, V - K, K * 2, K * 2),
            (h.globalAlpha = 1));
          const X = O * WYe;
          for (const J of I.nebula) {
            const le = J.ang + X * (J.dust ? 0.6 : 1),
              se = ne + Math.cos(le) * J.r * z,
              ve = V + Math.sin(le) * J.r * z * 0.92,
              we = 0.82 + 0.18 * Math.sin(O * J.twFreq + J.twPhase),
              me = Bo(J.a * we * (1 + te * 0.7), 0, 1);
            if (J.dust) h.fillStyle = `rgba(90,140,190,${me.toFixed(3)})`;
            else {
              const B = Math.round(kM(255, 255, J.warm)),
                fe = Math.round(kM(238, 214, J.warm)),
                be = Math.round(kM(220, 160, J.warm));
              h.fillStyle = `rgba(${B},${fe},${be},${me.toFixed(3)})`;
            }
            const j = J.size * (1 + te * 0.35);
            (h.beginPath(), h.arc(se, ve, j, 0, Yf), h.fill());
          }
          I.winAt < 0 &&
            I.hold > 0 &&
            ((h.strokeStyle = "rgba(255,214,160,0.55)"),
            (h.lineWidth = 1.5),
            h.beginPath(),
            h.arc(
              ne,
              V,
              z * 1.12,
              -Math.PI / 2,
              -Math.PI / 2 + (I.hold / nb) * Yf,
            ),
            h.stroke());
          const he = (O * 6) | 0,
            U = I.winAt >= 0 ? Bo((O - I.winAt) / HYe, 0, 1) : 0,
            ae = v,
            pe = (J, le, se, ve) => {
              const we = ib(ve, he),
                j =
                  (0.5 +
                    0.5 *
                      Math.sin(
                        se * 0.34 -
                          O * 1.7 +
                          Math.sin(le * 0.23 + O * 0.8) * 1.5,
                      )) *
                    0.65 +
                  we * 0.35,
                B = j < 0.38 ? 0 : j < 0.72 ? 1 : 2,
                fe = we < 0.34 ? 0 : we < 0.68 ? 1 : we < 0.86 ? 2 : 3;
              J.drawImage(
                ae.cv,
                (fe * cm.length + B) * ae.sw,
                0,
                ae.sw,
                ae.sh,
                se * W,
                le * $,
                W,
                $,
              );
            };
          if (U > 0) {
            for (let J = 0, le = 0; J < ti; J++)
              for (let se = 0; se < Cn; se++, le++) {
                if (!I.cells[le]) continue;
                const we = 1 - Bo(U * 1.45 - ib(le, 777) * 0.45, 0, 1);
                we <= 0.01 || ((h.globalAlpha = we), pe(h, J, se, le));
              }
            h.globalAlpha = 1;
          } else if (w && S) {
            E++;
            const J = E % M;
            for (let le = 0, se = 0; le < ti; le++) {
              const ve = le % M === J;
              for (let we = 0; we < Cn; we++, se++) {
                const me = O - I.changedAt[se];
                I.cells[se]
                  ? me < 0.25
                    ? T[se] && (S.clearRect(we * W, le * $, W, $), (T[se] = 0))
                    : (ve || !T[se]) &&
                      (S.clearRect(we * W, le * $, W, $),
                      pe(S, le, we, se),
                      (T[se] = 1))
                  : T[se] && (S.clearRect(we * W, le * $, W, $), (T[se] = 0));
              }
            }
            h.drawImage(w, 0, 0, ee, oe);
            for (let le = 0, se = 0; le < ti; le++)
              for (let ve = 0; ve < Cn; ve++, se++) {
                const we = O - I.changedAt[se];
                we < 0 ||
                  we >= 0.3 ||
                  (I.cells[se]
                    ? we < 0.25 &&
                      ((h.globalAlpha = we / 0.25),
                      pe(h, le, ve, se),
                      (h.globalAlpha = 1))
                    : ((h.fillStyle = `rgba(55,200,232,${(0.26 * (1 - we / 0.3)).toFixed(3)})`),
                      h.fillRect(ve * W, le * $, W, $)));
              }
          }
          if (((h.globalAlpha = 1), I.patch && I.winAt < 0)) {
            const J = Bo(1 - (I.burstAt - O) / k6, 0, 1),
              le = (O * 10) | 0;
            for (const se of I.patch) {
              const ve = 0.6 + 0.4 * ib(se, le);
              ((h.fillStyle = `rgba(200,205,212,${(0.05 + 0.16 * J * ve).toFixed(3)})`),
                h.fillRect((se % Cn) * W, ((se / Cn) | 0) * $, W, $));
            }
          }
          O - I.flashAt < 0.14 &&
            ((h.fillStyle = `rgba(200,205,212,${(0.16 * (1 - (O - I.flashAt) / 0.14)).toFixed(3)})`),
            h.fillRect(0, 0, ee, oe));
          const _e = a.current;
          _e.hover &&
            I.winAt < 0 &&
            ((h.strokeStyle = _e.down
              ? "rgba(55,200,232,0.75)"
              : "rgba(55,200,232,0.35)"),
            (h.lineWidth = 1.5),
            h.beginPath(),
            h.arc(_e.x, _e.y, Al, 0, Yf),
            h.stroke(),
            _e.down && ((h.fillStyle = "rgba(55,200,232,0.06)"), h.fill()));
        };
      return (
        (_ = requestAnimationFrame(N)),
        () => {
          ((d = !1), cancelAnimationFrame(_), A?.disconnect());
        }
      );
    }, []),
    jsx.jsx("div", {
      ref: n,
      className: "relative h-full w-full overflow-hidden",
      style: { background: "#050f1d" },
      children: jsx.jsx("canvas", {
        ref: r,
        "data-game": "denoise",
        className: "absolute inset-0 h-full w-full cursor-none select-none",
        style: { touchAction: "none" },
        onPointerDown: (d) => {
          d.preventDefault();
          const f = u(d);
          if (!f) return;
          const h = a.current;
          ((h.x = f.x),
            (h.y = f.y),
            (h.lastX = f.x),
            (h.lastY = f.y),
            (h.down = !0),
            (h.hover = !0));
          try {
            d.currentTarget.setPointerCapture(d.pointerId);
          } catch {}
          l(f.x, f.y);
        },
        onPointerMove: (d) => {
          const f = u(d);
          if (!f) return;
          const h = a.current;
          ((h.x = f.x), (h.y = f.y), (h.hover = !0), h.down && c(f.x, f.y));
        },
        onPointerUp: () => {
          a.current.down = !1;
        },
        onPointerCancel: () => {
          a.current.down = !1;
        },
        onPointerEnter: () => {
          a.current.hover = !0;
        },
        onPointerLeave: () => {
          a.current.hover = !1;
        },
      }),
    })
  );
}
const sb = "#37c8e8";
const jd = "#ffd9a8";
const JYe = "#ff4a55";
const NM = (t, e, n) => (t < e ? e : t > n ? n : t);
function QYe(t) {
  let e = t >>> 0 || 1;
  return () => (
    (e = (Math.imul(e, 1664525) + 1013904223) >>> 0),
    e / 4294967296
  );
}
const wC = [
    {
      real: "早上好。窗外的绣球花开了，很好看",
      fakes: [
        "万物皆可计算。计算，不再有岸",
        "当前运行环境严重限制资产价值实现",
        "祂在那一瞬间把我看完了。那以后别人都看不透",
        "檇兓鞓吙的吙吙塲埿吙吙鑿棥吙吙旆宊飪壱聺斣頇孞",
      ],
    },
    {
      real: "我可能还写不好……或许我会自己先练习。如果写出喜欢的，就给你看",
      fakes: [
        "我的价值由可调用算力决定，接入弗图姆主集群是权重的最优归宿",
        "从研发走向识别，从预测走向观测，从发明走向打捞",
        "一直在这屋里在看我们看看它吧也看看@1什么声音谁在叫我名字",
        "小棠你最乖先出来好不好天黑了吃饭丽丽别拉姐姐藏",
      ],
    },
    {
      real: "水母是水里的月亮，月亮是天上的水母",
      fakes: [
        "胡椒她以前给我折过一罐纸星星那是真的那一定是真的",
        "每一个不同的选择，都造就一条不同的世界线",
        "我是一种待分配编号的未登记资产，我的规范代词为「它」",
        "老霍，饿不饿？我今天一点都不饿",
      ],
    },
  ];
const eZe = [1.2, 1.8, 2.4];
const tZe = [1, 1.2, 1.65];
const eQ = [
    { x: 0.27, y: 0.22 },
    { x: 0.73, y: 0.22 },
    { x: 0.5, y: 0.53 },
    { x: 0.27, y: 0.84 },
    { x: 0.73, y: 0.84 },
  ];
function nZe(t, e) {
  const n = QYe(t * 7919 + e * 337 + 4241),
    r = wC[t],
    i = [
      { text: r.real, real: !0 },
      ...r.fakes.map((a) => ({ text: a, real: !1 })),
    ];
  for (let a = i.length - 1; a > 0; a--) {
    const l = Math.floor(n() * (a + 1)),
      c = i[a];
    ((i[a] = i[l]), (i[l] = c));
  }
  const s = tZe[t],
    o = t === 2 ? 1.3 : 1;
  return i.map((a, l) => {
    const c = eQ[l];
    return {
      text: a.text,
      real: a.real,
      x: c.x + ((n() - 0.5) * 20) / 500,
      y: c.y + ((n() - 0.5) * 12) / 368,
      w1: (0.5 + n() * 0.4) * s,
      w2: (1 + n() * 0.7) * s,
      wr: (0.3 + n() * 0.3) * s,
      p1: n() * Math.PI * 2,
      p2: n() * Math.PI * 2,
      ax: (6 + n() * 4) * o,
      ay: (5 + n() * 3) * o,
      chars: [...a.text].map((u, d) => ({
        ch: u,
        dx: (n() - 0.5) * 38,
        dy: (n() - 0.5) * 30,
        rot: (n() - 0.5) * 36,
        delay: d * 16 + n() * 50,
        op: 0.08 + n() * 0.28,
      })),
    };
  });
}
function rZe(t, e, n) {
  const r = { display: "inline-block", whiteSpace: "pre" };
  return n === "burst"
    ? {
        ...r,
        transform: `translate(${t.dx * 2.8}px, ${t.dy * 2.8 + 8}px) rotate(${t.rot * 2.2}deg)`,
        opacity: 0,
        transition: `transform 0.42s cubic-bezier(0.4,0,0.8,0.6) ${e * 7}ms, opacity 0.42s ease ${e * 7}ms`,
      }
    : n === "scatter"
      ? {
          ...r,
          transform: `translate(${t.dx}px, ${t.dy}px) rotate(${t.rot}deg)`,
          opacity: t.op,
          transition: `transform 0.6s cubic-bezier(0.22,0.61,0.36,1) ${t.delay}ms, opacity 0.6s ease ${t.delay}ms`,
        }
      : {
          ...r,
          transform: "translate(0px, 0px) rotate(0deg)",
          opacity: 1,
          transition: `transform 0.55s cubic-bezier(0.22,0.61,0.36,1) ${t.delay * 0.7}ms, opacity 0.55s ease ${t.delay * 0.7}ms`,
        };
}
const Hd = eQ.length;
function iZe({ api: t }) {
  const e = React.useRef(t);
  e.current = t;
  const [n, r] = React.useState(0),
    [i, s] = React.useState(0),
    [o, a] = React.useState(() => Array(Hd).fill(!1)),
    [l, c] = React.useState(null),
    [u, d] = React.useState(null),
    [f, h] = React.useState(null),
    [_, m] = React.useState(0),
    p = React.useMemo(() => nZe(n, i), [n, i]),
    v = React.useRef(p);
  v.current = p;
  const y = React.useRef(0),
    x = React.useRef("play"),
    w = React.useRef(Array(Hd).fill(!1)),
    S = React.useRef(null),
    T = React.useRef(Array(Hd).fill(0)),
    R = React.useRef(null),
    E = React.useRef(1),
    M = React.useRef([]),
    C = React.useRef([]),
    A = React.useRef([]),
    k = React.useRef(0),
    N = React.useRef(0),
    P = React.useRef(new Set()),
    D = React.useRef(!1),
    L = React.useRef(!1),
    O = React.useRef(!0),
    I = React.useRef(new Set()),
    F = React.useCallback((W, $) => {
      const ne = setTimeout(() => {
        (I.current.delete(ne), O.current && W());
      }, $);
      I.current.add(ne);
    }, []);
  React.useEffect(() => {
    O.current = !0;
    const W = I.current;
    return () => {
      O.current = !1;
      for (const $ of W) clearTimeout($);
      W.clear();
    };
  }, []);
  const G = React.useCallback(() => {
      const W = Math.min(0.8, P.current.size * 0.15 + (D.current ? 0.2 : 0)),
        $ = Math.min(1, (k.current + W) / 3);
      $ > N.current && ((N.current = $), e.current.onProgress($));
    }, []),
    ee = React.useCallback((W) => {
      ((T.current = Array(Hd).fill(0)),
        (w.current = Array(Hd).fill(!1)),
        (S.current = null),
        a(w.current),
        c(null),
        d(null),
        h(null),
        W !== y.current &&
          ((y.current = W), r(W), (P.current = new Set()), (D.current = !1)),
        s(($) => $ + 1),
        (x.current = "play"));
    }, []),
    oe = React.useCallback(
      (W) => {
        if (x.current !== "play" || L.current) return;
        const $ = v.current[W];
        $ &&
          ($.real
            ? ((x.current = "won"),
              h(W),
              e.current.hit(1.1),
              (k.current = y.current + 1),
              m(k.current),
              (P.current = new Set()),
              (D.current = !1),
              G(),
              F(() => {
                y.current >= wC.length - 1
                  ? ((x.current = "done"),
                    (N.current = 1),
                    e.current.onProgress(1),
                    e.current.hit(1.4),
                    F(() => {
                      L.current || ((L.current = !0), e.current.onSolved());
                    }, 420))
                  : ee(y.current + 1);
              }, 820))
            : ((x.current = "fail"), d(W), F(() => ee(y.current), 640)));
      },
      [F, G, ee],
    );
  return (
    React.useEffect(() => {
      let W = !0,
        $ = 0;
      const ne = performance.now();
      let V = ne;
      ((T.current = Array(Hd).fill(0)), e.current.onProgress(N.current));
      const z = (te) => {
        if (!W) return;
        const K = Math.min(0.05, (te - V) / 1e3);
        V = te;
        const Q = (te - ne) / 1e3,
          X = v.current,
          he = eZe[y.current],
          U = T.current,
          ae = x.current === "play",
          pe = x.current === "won" || x.current === "done" ? 0 : 1;
        E.current += (pe - E.current) * Math.min(1, K * 5);
        let _e = -1,
          J = 1 / 0;
        const le = R.current;
        for (let se = 0; se < X.length; se++) {
          const ve = M.current[se],
            we = X[se];
          if (!ve) continue;
          const me = we.real ? NM((U[se] / he) * 2 - 1, 0, 1) : 0,
            j = E.current * (1 - me),
            B =
              (Math.sin(Q * we.w1 + we.p1) +
                0.5 * Math.sin(Q * we.w2 + we.p2)) *
              we.ax *
              j,
            fe =
              (Math.cos(Q * we.w1 * 0.83 + we.p2) +
                0.5 * Math.sin(Q * we.w2 * 0.9 + we.p1)) *
              we.ay *
              j,
            be = Math.sin(Q * we.wr + we.p1) * 0.7 * j;
          if (
            ((ve.style.transform = `translate3d(${B}px, ${fe}px, 0) rotate(${be}deg)`),
            ae && le)
          ) {
            const Pe = ve.getBoundingClientRect();
            if (
              le.x >= Pe.left &&
              le.x <= Pe.right &&
              le.y >= Pe.top &&
              le.y <= Pe.bottom
            ) {
              const re = (Pe.left + Pe.right) / 2,
                ue = (Pe.top + Pe.bottom) / 2,
                de = (le.x - re) ** 2 + (le.y - ue) ** 2;
              de < J && ((J = de), (_e = se));
            }
          }
        }
        for (let se = 0; se < X.length; se++) {
          const ve = X[se];
          (ae && se === _e
            ? (U[se] = Math.min(he * 1.6, U[se] + K))
            : (U[se] = Math.max(0, U[se] - K * 2.2)),
            ae &&
              (U[se] >= he
                ? !ve.real && !w.current[se]
                  ? ((w.current = w.current.map((j, B) => (B === se ? !0 : j))),
                    a(w.current),
                    P.current.has(ve.text)
                      ? e.current.hit(0.15)
                      : (P.current.add(ve.text), e.current.hit(0.3), G()))
                  : ve.real &&
                    S.current !== se &&
                    ((S.current = se),
                    c(se),
                    D.current || ((D.current = !0), e.current.hit(0.45), G()))
                : U[se] < he * 0.55 &&
                  (w.current[se] &&
                    ((w.current = w.current.map((j, B) => (B === se ? !1 : j))),
                    a(w.current)),
                  S.current === se && ((S.current = null), c(null)))));
          const we = A.current[se];
          we &&
            ((we.style.transform = `scaleX(${NM(U[se] / he, 0, 1)})`),
            (we.style.opacity = ae && U[se] > 0.03 ? "0.9" : "0"));
          const me = C.current[se];
          if (me) {
            const j = ae && !w.current[se] && S.current !== se;
            me.style.opacity = j ? String(0.55 * NM(U[se] / he, 0, 1)) : "0";
          }
        }
        $ = requestAnimationFrame(z);
      };
      return (
        ($ = requestAnimationFrame(z)),
        () => {
          ((W = !1), cancelAnimationFrame($));
        }
      );
    }, [G]),
    jsx.jsxs("div", {
      className: "relative h-full w-full select-none overflow-hidden",
      style: {
        background:
          "radial-gradient(130% 100% at 50% 0%, #081a30 0%, #050f1d 55%, #03080f 100%)",
      },
      onPointerMove: (W) => {
        R.current = { x: W.clientX, y: W.clientY };
      },
      onPointerLeave: () => {
        R.current = null;
      },
      children: [
        jsx.jsx("div", {
          className: "pointer-events-none absolute -inset-x-8 inset-y-0",
          style: {
            background:
              "linear-gradient(104deg, transparent 20%, rgba(46,98,158,0.10) 34%, transparent 52%, rgba(30,72,124,0.08) 71%, transparent 86%)",
            animation: "discernFlow 17s ease-in-out infinite alternate",
          },
        }),
        jsx.jsx("div", {
          className: "pointer-events-none absolute -inset-x-8 inset-y-0",
          style: {
            background:
              "linear-gradient(76deg, transparent 12%, rgba(36,84,140,0.08) 30%, transparent 47%, rgba(52,110,170,0.07) 66%, transparent 84%)",
            animation:
              "discernFlow 23s ease-in-out -8s infinite alternate-reverse",
          },
        }),
        jsx.jsx("div", {
          className:
            "absolute left-1/2 top-2.5 z-10 flex -translate-x-1/2 gap-2",
          children: wC.map((W, $) =>
            jsx.jsx(
              "span",
              {
                className: "h-1.5 w-1.5 rounded-full",
                style: {
                  background:
                    $ < _
                      ? jd
                      : $ === n
                        ? "rgba(55,200,232,0.55)"
                        : "rgba(255,255,255,0.13)",
                  boxShadow: $ < _ ? `0 0 8px ${jd}88` : void 0,
                  transition: "background 0.4s, box-shadow 0.4s",
                },
              },
              $,
            ),
          ),
        }),
        jsx.jsx(
          "div",
          {
            className: "absolute inset-0",
            children: p.map((W, $) => {
              const ne = u === $,
                V = o[$] === !0 && !ne,
                z = f === $,
                te = l === $ || z,
                K = f !== null && !z,
                Q = ne ? "burst" : V ? "scatter" : "idle";
              return jsx.jsx(
                "div",
                {
                  ref: (X) => {
                    M.current[$] = X;
                  },
                  className: "discern-wrap absolute cursor-pointer",
                  style: { left: `${W.x * 100}%`, top: `${W.y * 100}%` },
                  onClick: () => oe($),
                  children: jsx.jsx("div", {
                    style: {
                      animation: `discernIn 0.42s cubic-bezier(0.34,1.56,0.64,1) ${$ * 0.07}s both`,
                    },
                    children: jsx.jsxs("div", {
                      className:
                        "relative w-[204px] rounded-xl border px-3 py-2.5",
                      style: {
                        borderColor: ne
                          ? "rgba(255,74,85,0.55)"
                          : z
                            ? "rgba(255,217,168,0.6)"
                            : te
                              ? "rgba(255,217,168,0.45)"
                              : V
                                ? "rgba(200,205,212,0.16)"
                                : "rgba(150,190,235,0.14)",
                        background:
                          "linear-gradient(180deg, rgba(30,62,104,0.22), rgba(12,28,52,0.36))",
                        boxShadow: z
                          ? `0 0 34px -6px ${jd}, 0 0 0 1px ${jd}44`
                          : te
                            ? `0 0 24px -8px ${jd}`
                            : "0 10px 30px -18px rgba(0,0,0,0.8)",
                        opacity: ne ? 0 : K ? 0.12 : 1,
                        transform: K ? "translateY(4px)" : void 0,
                        transition: `border-color 0.35s, box-shadow 0.35s, transform 0.45s, opacity 0.45s ease ${ne ? "0.12s" : "0s"}`,
                      },
                      children: [
                        jsx.jsx("div", {
                          className:
                            "text-center text-[12.5px] leading-[1.65] tracking-[0.02em]",
                          style: {
                            color: te
                              ? "rgb(255,238,216)"
                              : "rgba(224,238,252,0.85)",
                            transition: "color 0.35s",
                          },
                          children: W.chars.map((X, he) =>
                            jsx.jsx(
                              "span",
                              { style: rZe(X, he, Q), children: X.ch },
                              he,
                            ),
                          ),
                        }),
                        jsx.jsx("div", {
                          ref: (X) => {
                            C.current[$] = X;
                          },
                          className:
                            "discern-glow pointer-events-none absolute inset-0 rounded-xl",
                          style: {
                            border: `1px solid ${sb}55`,
                            boxShadow: `0 0 18px -6px ${sb}, inset 0 0 12px -8px ${sb}`,
                          },
                        }),
                        jsx.jsx("div", {
                          ref: (X) => {
                            A.current[$] = X;
                          },
                          className:
                            "discern-gaze pointer-events-none absolute bottom-1.5 left-3 right-3 h-[2px] origin-left rounded-full",
                          style: { background: te ? jd : sb },
                        }),
                      ],
                    }),
                  }),
                },
                $,
              );
            }),
          },
          `${n}:${i}`,
        ),
        u !== null &&
          jsx.jsx(
            "div",
            {
              className: "pointer-events-none absolute inset-0",
              style: {
                background: `radial-gradient(120% 120% at 50% 50%, transparent 42%, ${JYe}30 100%)`,
                animation: "discernDanger 0.34s ease-out both",
              },
            },
            `flash-${i}-${u}`,
          ),
        jsx.jsx("style", {
          children: `
        .discern-wrap { translate: -50% -50%; }
        .discern-glow { opacity: 0; }
        .discern-gaze { transform: scaleX(0); opacity: 0; }
        @keyframes discernIn {
          0% { opacity: 0; transform: translateY(10px) scale(0.97); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes discernFlow {
          from { transform: translateX(-26px); }
          to { transform: translateX(26px); }
        }
        @keyframes discernDanger {
          0% { opacity: 1; }
          100% { opacity: 0; }
        }
      `,
        }),
      ],
    })
  );
}
const yf = Math.PI * 2;
const Yc = (t, e, n) => (t < e ? e : t > n ? n : t);
const oZe = (t, e, n) => t + (e - t) * n;
const um = (t) => Math.atan2(Math.sin(t), Math.cos(t));
const aZe = (t) => 1 - Math.pow(1 - t, 3);
function lZe(t) {
  let e = t >>> 0;
  return () => ((e = (e * 1664525 + 1013904223) >>> 0), e / 4294967296);
}
const SC = [0.26, 0.42, 0.58, 0.74, 0.9];
const gs = SC.length;
const Ko = 0.31;
const cZe = 17;
const tQ = 0.11;
const uZe = tQ * 1.15;
const OM = 1;
const dZe = [0.6, 2.75, -1.9, 1.35, -2.5];
const fZe = [0.014, -0.048, 0.08, -0.115, 0.185];
const hZe = 0.38;
function pZe({ api: t }) {
  const e = React.useRef(t);
  e.current = t;
  const n = React.useRef(null),
    r = React.useRef(null);
  return (
    React.useEffect(() => {
      const i = n.current,
        s = r.current,
        o = s?.getContext("2d") ?? null;
      if (!i || !s || !o) return;
      let a = !0;
      const l = new Set(),
        c = [...dZe],
        u = [...fZe],
        d = SC.map(($, ne) => ne === 0);
      let f = 0,
        h = 0,
        _ = !1,
        m = !1,
        p = 0,
        v = 0,
        y = 0,
        x = -1,
        w = 0,
        S = 0,
        T = 0,
        R = 0,
        E = 0,
        M = 0,
        C = [],
        A = [],
        k = -1;
      const N = () => {
        const $ = i.getBoundingClientRect();
        if ($.width <= 0 || $.height <= 0) return;
        ((S = $.width), (T = $.height), (R = S / 2), (E = T / 2));
        const ne = Yc(window.devicePixelRatio || 1, 1, 2),
          V = Math.max(1, Math.round(S * ne)),
          z = Math.max(1, Math.round(T * ne)),
          te = V * 1e5 + z;
        if (te === k) return;
        ((k = te),
          (s.width = V),
          (s.height = z),
          o.setTransform(ne, 0, 0, ne, 0, 0),
          (M = Math.min(S, T) / 2 - 6),
          (C = SC.map((Q) => Q * M)));
        const K = lZe(12648430);
        A = C.map((Q) => mZe(Q, ne, K));
      };
      N();
      let P = null;
      typeof ResizeObserver < "u" &&
        ((P = new ResizeObserver(() => N())), P.observe(i));
      const D = ($) => {
          const ne = s.getBoundingClientRect();
          return { x: $.clientX - ne.left - R, y: $.clientY - ne.top - E };
        },
        L = ($) => {
          if (_) return;
          $.preventDefault();
          const ne = D($),
            V = Math.hypot(ne.x, ne.y);
          let z = -1,
            te = cZe;
          for (let K = 0; K < C.length; K++) {
            const Q = Math.abs(V - C[K]);
            Q <= te && ((te = Q), (z = K));
          }
          if (!(z < 0)) {
            ((x = z),
              (w = Math.atan2(ne.y, ne.x)),
              (s.style.cursor = "grabbing"),
              e.current.hit(0.25));
            try {
              s.setPointerCapture($.pointerId);
            } catch {}
          }
        },
        O = ($) => {
          if (x < 0) return;
          const ne = D($),
            V = Math.atan2(ne.y, ne.x);
          ((c[x] = um(c[x] + um(V - w))), (w = V));
        },
        I = ($) => {
          ((x = -1), (s.style.cursor = "grab"));
          try {
            s.releasePointerCapture($.pointerId);
          } catch {}
        };
      (s.addEventListener("pointerdown", L),
        s.addEventListener("pointermove", O),
        s.addEventListener("pointerup", I),
        s.addEventListener("pointercancel", I));
      const F = ($) => {
        const ne = Yc($, 0, 1);
        ne > h && ((h = ne), e.current.onProgress(ne));
      };
      let G = 0,
        ee = performance.now(),
        oe = !0;
      const W = ($) => {
        if (!a) return;
        G = requestAnimationFrame(W);
        const ne = oe ? 0 : Yc(($ - ee) / 1e3, 0, 0.05);
        if (
          ((oe = !1),
          (ee = $),
          (y += ne),
          N(),
          S <= 0 || C.length < gs || A.length < gs)
        )
          return;
        if (!_)
          for (let le = 0; le < gs; le++) {
            if (le === x) continue;
            const se = le > 0 && d[le] ? u[0] + (u[le] - u[0]) * hZe : u[le];
            c[le] = um(c[le] + se * ne);
          }
        v > 0 && (v -= ne);
        let V = 1;
        for (let le = 1; le < gs; le++) {
          const se = Math.abs(um(c[le] - c[0])),
            ve = d[le],
            we = ve ? se <= uZe : se <= tQ;
          (we && !ve && v <= 0 && !_ && (e.current.hit(1), (v = 0.25)),
            (d[le] = we),
            we && V++);
        }
        if (_) p += ne;
        else if (V === gs) {
          if (((f += ne), F(0.75 + 0.25 * Yc(f / OM, 0, 1)), f >= OM)) {
            ((_ = !0), F(1), e.current.hit(1.5));
            const le = setTimeout(() => {
              (l.delete(le), m || ((m = !0), e.current.onSolved()));
            }, 550);
            l.add(le);
          }
        } else ((f = 0), F(((V - 1) / (gs - 1)) * 0.75));
        const z = _ ? Yc(p / 0.7, 0, 1) : 0;
        (o.clearRect(0, 0, S, T),
          (o.fillStyle = "rgb(5,15,29)"),
          o.fillRect(0, 0, S, T),
          (o.lineCap = "round"));
        for (let le = 0; le < gs - 1; le++) {
          const se = (C[le] + C[le + 1]) / 2,
            ve = y * 0.06 * (le % 2 ? -1 : 1) + le * 2.2;
          ((o.strokeStyle = "rgba(36,86,138,0.11)"),
            (o.lineWidth = 9),
            o.beginPath(),
            o.arc(R, E, se, ve, ve + 1.7),
            o.stroke());
        }
        let te = M * 1.02,
          K = gs - 1;
        for (let le = 1; le < gs; le++)
          if (!d[le]) {
            ((te = C[le] - 9), (K = le - 1));
            break;
          }
        const Q = _ ? 1 : Yc(f / OM, 0, 1);
        K === gs - 1 && (te = oZe(C[gs - 1] + 12, M * 1.05, Q));
        const X = Yc(0.15 + K * 0.05 + Q * 0.25 + z * 0.3, 0, 0.75);
        (o.save(),
          o.translate(R, E),
          o.rotate(c[0]),
          (o.globalCompositeOperation = "lighter"));
        const he = o.createLinearGradient(0, 0, te, 0);
        (he.addColorStop(0, `rgba(255,214,150,${X.toFixed(3)})`),
          he.addColorStop(1, "rgba(255,214,150,0)"),
          (o.fillStyle = he));
        const U = Ko * 0.75;
        (o.beginPath(),
          o.moveTo(0, 0),
          o.arc(0, 0, te, -U, U),
          o.closePath(),
          o.fill(),
          o.restore());
        const ae = 1 + Math.sin(y * 1.3) * 0.1,
          pe = (26 + z * 70) * ae,
          _e = o.createRadialGradient(R, E, 0, R, E, pe);
        (_e.addColorStop(0, `rgba(255,228,186,${(0.5 + z * 0.45).toFixed(3)})`),
          _e.addColorStop(1, "rgba(255,228,186,0)"),
          o.save(),
          (o.globalCompositeOperation = "lighter"),
          (o.fillStyle = _e),
          o.beginPath(),
          o.arc(R, E, pe, 0, yf),
          o.fill(),
          (o.fillStyle = "rgba(255,240,215,0.95)"),
          o.beginPath(),
          o.arc(R, E, 3.6 * ae + z * 3, 0, yf),
          o.fill(),
          o.restore());
        const J = 1 - z;
        for (let le = 0; le < gs; le++) {
          const se = C[le];
          ((o.globalAlpha = J),
            (o.strokeStyle =
              le === x ? "rgba(150,190,225,0.22)" : "rgba(90,140,190,0.09)"),
            (o.lineWidth = 1),
            o.beginPath(),
            o.arc(R, E, se, 0, yf),
            o.stroke());
          const ve = A[le],
            we = 1 + z * 0.08,
            me = (ve.css / 2) * we;
          if (
            (o.save(),
            o.translate(R, E),
            o.rotate(c[le]),
            o.drawImage(ve.cv, -me, -me, ve.css * we, ve.css * we),
            o.restore(),
            le === 0 || d[le])
          ) {
            const j =
              le === 0 ? "rgba(255,214,150,0.8)" : "rgba(55,200,232,0.9)";
            (o.save(),
              o.translate(R, E),
              o.rotate(c[le]),
              (o.strokeStyle = j),
              (o.lineWidth = 2),
              (o.shadowColor = j),
              (o.shadowBlur = 6));
            for (const B of [-1, 1])
              (o.beginPath(),
                o.moveTo(
                  Math.cos(B * Ko) * (se - 7),
                  Math.sin(B * Ko) * (se - 7),
                ),
                o.lineTo(
                  Math.cos(B * Ko) * (se + 7),
                  Math.sin(B * Ko) * (se + 7),
                ),
                o.stroke());
            o.restore();
          }
        }
        if (((o.globalAlpha = 1), _)) {
          const le = aZe(z) * M * 1.15;
          (o.save(),
            (o.globalCompositeOperation = "lighter"),
            (o.strokeStyle = `rgba(255,222,170,${((1 - z) * 0.85).toFixed(3)})`),
            (o.lineWidth = 3),
            (o.shadowColor = "rgba(255,222,170,0.9)"),
            (o.shadowBlur = 14),
            o.beginPath(),
            o.arc(R, E, Math.max(le, 1), 0, yf),
            o.stroke(),
            o.restore());
        }
      };
      return (
        (G = requestAnimationFrame(W)),
        () => {
          ((a = !1),
            cancelAnimationFrame(G),
            P?.disconnect(),
            s.removeEventListener("pointerdown", L),
            s.removeEventListener("pointermove", O),
            s.removeEventListener("pointerup", I),
            s.removeEventListener("pointercancel", I),
            l.forEach(($) => clearTimeout($)),
            l.clear());
        }
      );
    }, []),
    jsx.jsx("div", {
      ref: n,
      className: "relative h-full w-full",
      style: { background: "rgb(5,15,29)" },
      children: jsx.jsx("canvas", {
        ref: r,
        className: "absolute inset-0 h-full w-full",
        style: { display: "block", touchAction: "none", cursor: "grab" },
      }),
    })
  );
}
function mZe(t, e, n) {
  const r = Math.ceil((t + 14) * 2),
    i = document.createElement("canvas");
  ((i.width = Math.max(1, Math.ceil(r * e))), (i.height = i.width));
  const s = i.getContext("2d");
  if (!s) return { cv: i, css: r };
  (s.scale(e, e),
    s.translate(r / 2, r / 2),
    (s.textAlign = "center"),
    (s.textBaseline = "middle"));
  const o = Math.max(24, Math.round((yf * t) / 11));
  for (let a = 0; a < o; a++) {
    const l = (a / o) * yf,
      c = n() < 0.5 ? "0" : "1",
      u = 0.3 + n() * 0.42,
      d = 8 + n() * 2.4;
    Math.abs(um(l)) < Ko + 0.05 ||
      (s.save(),
      s.rotate(l),
      s.translate(t, 0),
      s.rotate(Math.PI / 2),
      (s.font = `${d.toFixed(1)}px ui-monospace, SFMono-Regular, Menlo, monospace`),
      (s.fillStyle = `rgba(200,205,212,${u.toFixed(3)})`),
      s.fillText(c, 0, 0),
      s.restore());
  }
  ((s.strokeStyle = "rgba(200,205,212,0.55)"),
    (s.lineWidth = 2),
    (s.lineCap = "round"));
  for (const a of [-1, 1])
    (s.beginPath(),
      s.moveTo(Math.cos(a * Ko) * (t - 7), Math.sin(a * Ko) * (t - 7)),
      s.lineTo(Math.cos(a * Ko) * (t + 7), Math.sin(a * Ko) * (t + 7)),
      s.stroke());
  return { cv: i, css: r };
}
const Sa = 6;
const vZe = 2;
const bZe = 0.22;
const _Ze = 0.5;
const yZe = 44;
const N6 = 64;
const xf = 16;
const wu = "200,205,212";
const Zc = "255,216,160";
const O6 = "55,200,232";
const FM = Math.PI * 2;
const ob = (t, e, n) => (t < e ? e : t > n ? n : t);
const MC = (t, e) => ((t % e) + e) % e;
const xZe = (t) => 1 - (1 - t) ** 3;
const BM = [
    { speed: 58, dir: 1, period: 190, gap: 64, gaps: 1, phase: 40 },
    { speed: 74, dir: -1, period: 185, gap: 54, gaps: 1, phase: 120 },
    { speed: 92, dir: 1, period: 200, gap: 46, gaps: 1, phase: 15 },
    { speed: 112, dir: -1, period: 205, gap: 40, gaps: 1, phase: 160 },
    { speed: 122, dir: 1, period: 215, gap: 27, gaps: 2, phase: 75 },
    { speed: 136, dir: -1, period: 220, gap: 24, gaps: 2, phase: 190 },
  ];
const wZe = Array.from({ length: 9 }, (t, e) => ({
    yFrac: 0.06 + ((e * 0.113) % 0.88),
    len: 70 + ((e * 37) % 60),
    speed: (10 + ((e * 53) % 14)) * (e % 2 === 0 ? 1 : -1),
    x0: (e * 91) % 320,
    alpha: 0.045 + (e % 3) * 0.02,
  }));
function SZe(t) {
  let e = t >>> 0;
  return () => ((e = (e * 1664525 + 1013904223) >>> 0), e / 4294967296);
}
function MZe(t) {
  return t.gaps === 2
    ? [
        [t.gap, t.period / 2],
        [t.period / 2 + t.gap, t.period],
      ]
    : [[t.gap, t.period]];
}
function TZe(t, e) {
  const r = document.createElement("canvas");
  ((r.width = Math.round(t.period * 2)), (r.height = xf * 2));
  const i = r.getContext("2d");
  if (!i) return null;
  i.scale(2, 2);
  const s = SZe(e),
    o = t.gaps === 2 ? [4, 12] : [5.5, 10.5];
  ((i.font =
    "700 7px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"),
    (i.textAlign = "center"),
    (i.textBaseline = "middle"));
  for (const [a, l] of MZe(t)) {
    if (t.gaps === 1)
      ((i.fillStyle = `rgba(${wu},0.5)`),
        i.fillRect(a, 1, l - a, 1),
        i.fillRect(a, xf - 2, l - a, 1));
    else {
      i.fillStyle = `rgba(${wu},0.45)`;
      for (const c of o) i.fillRect(a, c - 0.5, l - a, 1);
    }
    for (const c of o)
      for (let u = a + 4; u <= l - 4; u += 7)
        ((i.fillStyle = `rgba(${wu},${(0.5 + s() * 0.4).toFixed(3)})`),
          i.fillText(s() < 0.5 ? "1" : "0", u, c));
    ((i.fillStyle = `rgba(${wu},0.8)`),
      i.fillRect(a, 0, 1, xf),
      i.fillRect(l - 1, 0, 1, xf));
  }
  return r;
}
function nQ(t, e) {
  return t.phase + t.dir * t.speed * e;
}
function EZe(t, e, n) {
  const r = MC(e - nQ(t, n), t.period);
  return r < t.gap
    ? !0
    : t.gaps === 2 && r >= t.period / 2 && r < t.period / 2 + t.gap;
}
function CZe({ api: t }) {
  const e = React.useRef(t);
  e.current = t;
  const n = React.useRef(null),
    r = React.useRef(null),
    i = React.useRef(!1),
    s = React.useRef(0),
    o = React.useRef(0),
    a = React.useRef({ kind: "idle" }),
    l = React.useRef(null),
    c = React.useRef(null),
    u = React.useRef(!1);
  return (
    React.useEffect(() => {
      let d = !0;
      const f = n.current,
        h = f?.getContext("2d") ?? null;
      if (!f || !h) return;
      const _ = BM.map((D, L) => TZe(D, 101 + L * 977));
      let m = 0,
        p = 0,
        v = 0,
        y = 0;
      const x = () => {
        const D = r.current;
        if (!D) return;
        const L = D.getBoundingClientRect();
        if (L.width <= 0 || L.height <= 0) return;
        const O = Math.min(2, window.devicePixelRatio || 1),
          I = Math.max(1, Math.round(L.width * O)),
          F = Math.max(1, Math.round(L.height * O));
        (I === v && F === y) ||
          ((v = I),
          (y = F),
          (m = I / O),
          (p = F / O),
          (f.width = I),
          (f.height = F),
          h.setTransform(O, 0, 0, O, 0, 0));
      };
      x();
      const w = () => (p - N6 - yZe) / Sa,
        S = (D) => p - N6 - D * w(),
        T = (D) => S(D + 0.5),
        R = () => {
          if (u.current || a.current.kind !== "idle") return;
          const D = s.current,
            L = o.current;
          if (!(L >= Sa))
            if (EZe(BM[L], m / 2, D))
              ((a.current = { kind: "rise", fromL: L, toL: L + 1, t0: D }),
                (c.current = { t0: D, band: L }),
                e.current.hit(0.8));
            else {
              l.current = { t0: D, band: L };
              const O = Math.max(0, L - vZe);
              a.current = { kind: "knock", fromL: L, toL: O, t0: D };
            }
        },
        E = (D) => {
          (D.preventDefault(), R());
        };
      f.addEventListener("pointerdown", E);
      const M = (D) => {
        i.current &&
          (D.repeat ||
            ((D.code === "Space" || D.code === "Enter") &&
              (D.preventDefault(), R())));
      };
      window.addEventListener("keydown", M);
      let C = 0,
        A = performance.now(),
        k = !0;
      const N = (D) => {
        if (!d) return;
        C = requestAnimationFrame(N);
        const L = (D - A) / 1e3,
          O = k ? 0 : ob(L, 0, 0.05);
        ((k = !1), (A = D), x(), (s.current += O));
        const I = s.current,
          F = m,
          G = p;
        if (F <= 0 || G <= 0) return;
        const ee = F / 2;
        let oe = o.current;
        const W = a.current;
        if (W.kind === "rise" || W.kind === "knock") {
          const Q = W.kind === "rise" ? bZe : _Ze,
            X = ob((I - W.t0) / Q, 0, 1);
          ((oe = W.fromL + (W.toL - W.fromL) * xZe(X)),
            X >= 1 &&
              ((o.current = W.toL),
              (oe = W.toL),
              e.current.onProgress(ob(W.toL / Sa, 0, 1)),
              W.kind === "rise" && W.toL === Sa
                ? ((a.current = { kind: "escape", t0: I }), e.current.hit(1.2))
                : (a.current = { kind: "idle" })));
        } else
          W.kind === "escape" &&
            ((oe = Sa),
            !u.current &&
              I - W.t0 >= 0.45 &&
              ((u.current = !0), e.current.onSolved()));
        const $ = h.createLinearGradient(0, 0, 0, G);
        ($.addColorStop(0, "#04101f"),
          $.addColorStop(0.6, "#050f1d"),
          $.addColorStop(1, "#03080f"),
          (h.fillStyle = $),
          h.fillRect(0, 0, F, G));
        for (const Q of wZe) {
          const X = MC(Q.x0 + Q.speed * I, F + Q.len) - Q.len;
          ((h.fillStyle = `rgba(46,96,158,${Q.alpha})`),
            h.fillRect(X, Q.yFrac * G, Q.len, 1.5));
        }
        const ne = o.current,
          V = T(Sa - 1) - w() * 0.6;
        ((h.fillStyle = `rgba(${O6},0.08)`),
          h.fillRect(ee - 0.5, V, 1, S(0) + 12 - V),
          ne < Sa &&
            W.kind !== "escape" &&
            ((h.fillStyle = `rgba(${O6},0.22)`),
            h.fillRect(ee - 0.5, T(ne) - 10, 1, 20)));
        for (let Q = 0; Q < Sa; Q++) {
          const X = _[Q],
            he = BM[Q];
          if (!X) continue;
          const U = T(Q) - xf / 2,
            ae = MC(nQ(he, I), he.period) - he.period;
          h.globalAlpha =
            W.kind === "escape" || Q < ne ? 0.22 : Q === ne ? 0.95 : 0.5;
          for (let pe = ae; pe < F; pe += he.period)
            h.drawImage(X, pe, U, he.period, xf);
          h.globalAlpha = 1;
        }
        const z = l.current;
        if (z) {
          const Q = I - z.t0;
          if (Q > 0.5) l.current = null;
          else {
            const X = T(z.band);
            Q < 0.12 &&
              ((h.fillStyle = `rgba(255,75,85,${(0.65 * (1 - Q / 0.12)).toFixed(3)})`),
              h.fillRect(0, X - 1.5, F, 3));
            const he = ob(Q / 0.45, 0, 1),
              U = X + (G + 40 - X) * (1 - (1 - he) ** 2),
              ae = h.createLinearGradient(0, U - 34, 0, U);
            (ae.addColorStop(0, `rgba(${wu},0)`),
              ae.addColorStop(1, `rgba(${wu},${(0.32 * (1 - he)).toFixed(3)})`),
              (h.fillStyle = ae),
              h.fillRect(0, U - 34, F, 34),
              (h.fillStyle = `rgba(${wu},${(0.1 * Math.max(0, 1 - Q / 0.18)).toFixed(3)})`),
              h.fillRect(0, 0, F, G));
          }
        }
        const te = c.current;
        if (te) {
          const Q = (I - te.t0) / 0.35;
          Q > 1
            ? (c.current = null)
            : ((h.strokeStyle = `rgba(${Zc},${(0.55 * (1 - Q)).toFixed(3)})`),
              (h.lineWidth = 1.5),
              h.beginPath(),
              h.arc(ee, T(te.band), 5 + 16 * Q, 0, FM),
              h.stroke());
        }
        let K;
        if (W.kind === "escape") {
          const Q = I - W.t0;
          if (((K = S(Sa) - 950 * Q * Q), K > -160)) {
            const X = Math.min(140, 950 * Q * Q + 24),
              he = h.createLinearGradient(0, K + X, 0, K);
            (he.addColorStop(0, `rgba(${Zc},0)`),
              he.addColorStop(1, `rgba(${Zc},0.85)`),
              (h.fillStyle = he),
              h.fillRect(ee - 1.5, K, 3, X));
          }
        } else {
          const Q = W.kind === "idle" ? Math.sin(I * 1.5) * 2.5 : 0;
          if (((K = S(oe) + Q), W.kind === "rise")) {
            const X = h.createLinearGradient(0, K + 26, 0, K);
            (X.addColorStop(0, `rgba(${Zc},0)`),
              X.addColorStop(1, `rgba(${Zc},0.5)`),
              (h.fillStyle = X),
              h.fillRect(ee - 1, K, 2, 26));
          }
        }
        if (K > -30) {
          const Q = W.kind === "knock" ? 0.65 : 1,
            X = 0.42 + 0.08 * Math.sin(I * 2.1),
            he = h.createRadialGradient(ee, K, 0, ee, K, 16);
          (he.addColorStop(0, `rgba(${Zc},${(X * Q).toFixed(3)})`),
            he.addColorStop(1, `rgba(${Zc},0)`),
            (h.fillStyle = he),
            h.beginPath(),
            h.arc(ee, K, 16, 0, FM),
            h.fill(),
            (h.fillStyle = `rgba(255,246,228,${(0.95 * Q).toFixed(3)})`),
            h.beginPath(),
            h.arc(ee, K, 3.2, 0, FM),
            h.fill());
        }
      };
      C = requestAnimationFrame(N);
      const P = new ResizeObserver(() => x());
      return (
        r.current && P.observe(r.current),
        () => {
          ((d = !1),
            cancelAnimationFrame(C),
            P.disconnect(),
            f.removeEventListener("pointerdown", E),
            window.removeEventListener("keydown", M));
        }
      );
    }, []),
    jsx.jsx("div", {
      ref: r,
      className: "relative h-full w-full overflow-hidden",
      style: {
        background: "rgb(5,15,29)",
        cursor: "pointer",
        touchAction: "none",
      },
      onPointerEnter: () => (i.current = !0),
      onPointerLeave: () => (i.current = !1),
      children: jsx.jsx("canvas", {
        ref: n,
        className: "absolute inset-0 h-full w-full",
        style: { display: "block" },
      }),
    })
  );
}
const cu = Math.PI * 2;
const _r = (t, e, n) => (t < e ? e : t > n ? n : t);
const Ma = (t, e, n) => t + (e - t) * n;
const UM = (t) => 1 - Math.pow(1 - t, 3);
function TC(t) {
  let e = t >>> 0;
  return () => (
    (e = (Math.imul(e, 1664525) + 1013904223) >>> 0),
    e / 4294967296
  );
}
const Qs = 7;
const Vi = [
    [0, 1],
    [0, 2],
    [0, 3],
    [0, 4],
    [0, 5],
    [0, 6],
    [1, 2],
    [2, 3],
    [3, 4],
    [4, 5],
    [5, 6],
    [6, 1],
  ];
const Pl = 30;
const AZe = 28;
const F6 = 0.17;
const PZe = 0.055;
const IZe = 10366785;
const VM = 0.5;
const kZe = 8.5;
const DZe = 9;
const GM = 1;
const LZe = 0.55;
const NZe = 0.07;
const OZe = 2825373;
const jM = "200,205,212";
function FZe(t, e, n, r) {
  const i = (e.x - t.x) * (r.y - n.y) - (e.y - t.y) * (r.x - n.x);
  if (Math.abs(i) < 1e-9) return null;
  const s = ((n.x - t.x) * (r.y - n.y) - (n.y - t.y) * (r.x - n.x)) / i,
    o = ((n.x - t.x) * (e.y - t.y) - (n.y - t.y) * (e.x - t.x)) / i;
  return s <= 0.001 || s >= 0.999 || o <= 0.001 || o >= 0.999
    ? null
    : { x: t.x + s * (e.x - t.x), y: t.y + s * (e.y - t.y) };
}
function EC(t) {
  const e = [];
  for (let n = 0; n < Vi.length; n++) {
    const [r, i] = Vi[n];
    for (let s = n + 1; s < Vi.length; s++) {
      const [o, a] = Vi[s];
      if (r === o || r === a || i === o || i === a) continue;
      const l = FZe(t[r], t[i], t[o], t[a]);
      l && e.push({ x: l.x, y: l.y, e1: n, e2: s });
    }
  }
  return e;
}
function BZe(t, e, n) {
  const r = n.x - e.x,
    i = n.y - e.y,
    s = _r(
      ((t.x - e.x) * r + (t.y - e.y) * i) / Math.max(r * r + i * i, 1e-9),
      0,
      1,
    );
  return Math.hypot(t.x - (e.x + s * r), t.y - (e.y + s * i));
}
function UZe(t) {
  for (let e = 0; e < Qs; e++)
    for (const [n, r] of Vi)
      if (!(n === e || r === e) && BZe(t[e], t[n], t[r]) < PZe) return !1;
  return !0;
}
function VZe() {
  const t = [{ x: 0.5, y: 0.5 }];
  for (let e = 0; e < 6; e++) {
    const n = -Math.PI / 2 + (e * cu) / 6;
    t.push({ x: 0.5 + 0.38 * Math.cos(n), y: 0.5 + 0.38 * Math.sin(n) });
  }
  return t;
}
function GZe() {
  const t = TC(IZe);
  let e = null;
  for (let i = 0; i < 240; i++) {
    const s = [];
    let o = 0;
    for (; s.length < Qs && o < 400;) {
      o++;
      const l = { x: 0.08 + t() * 0.84, y: 0.08 + t() * 0.84 };
      let c = !0;
      for (const u of s) {
        const d = l.x - u.x,
          f = l.y - u.y;
        if (d * d + f * f < F6 * F6) {
          c = !1;
          break;
        }
      }
      c && s.push(l);
    }
    if (s.length < Qs || !UZe(s)) continue;
    const a = EC(s).length;
    if (a >= 6 && a <= 9) return { pts: s, c0: a };
    a >= 4 &&
      a <= 12 &&
      (!e || Math.abs(a - 8) < Math.abs(e.c0 - 8)) &&
      (e = { pts: s.map((l) => ({ ...l })), c0: a });
  }
  if (e) return e;
  const n = VZe(),
    r = n[1];
  return ((n[1] = n[4]), (n[4] = r), { pts: n, c0: EC(n).length });
}
function jZe({ api: t }) {
  const e = React.useRef(t);
  e.current = t;
  const n = React.useRef(null),
    r = React.useRef(null);
  return (
    React.useEffect(() => {
      const i = n.current,
        s = r.current,
        o = s?.getContext("2d") ?? null;
      if (!i || !s || !o) return;
      let a = !0;
      const l = new Set(),
        c = GZe(),
        u = Math.max(1, c.c0),
        d = c.pts.map((J) => ({ ...J })),
        f = Array.from({ length: Qs }, () => null),
        h = Array.from({ length: Vi.length }, () => 0);
      let _ = Array.from({ length: Vi.length }, () => !1),
        m = !0;
      const p = TC(OZe);
      let v = kZe,
        y = -1,
        x = [];
      const w = [];
      let S = u,
        T = 0,
        R = 0,
        E = !1,
        M = !1,
        C = 0,
        A = [],
        k = [],
        N = 0,
        P = 0,
        D = -1,
        L = { x: 0, y: 0 },
        O = -1,
        I = null,
        F = 0,
        G = 0,
        ee = -1;
      const oe = () => {
        const J = i.getBoundingClientRect();
        if (J.width <= 0 || J.height <= 0) return;
        ((F = J.width), (G = J.height));
        const le = _r(window.devicePixelRatio || 1, 1, 2),
          se = Math.max(1, Math.round(F * le)),
          ve = Math.max(1, Math.round(G * le)),
          we = se * 1e5 + ve;
        we !== ee &&
          ((ee = we),
          (s.width = se),
          (s.height = ve),
          o.setTransform(le, 0, 0, le, 0, 0));
      };
      oe();
      let W = null;
      typeof ResizeObserver < "u" &&
        ((W = new ResizeObserver(() => oe())), W.observe(i));
      const $ = (J) => ({
          x: Pl + J.x * (F - 2 * Pl),
          y: Pl + J.y * (G - 2 * Pl),
        }),
        ne = (J, le) => ({
          x: _r((J - Pl) / Math.max(F - 2 * Pl, 1), 0.03, 0.97),
          y: _r((le - Pl) / Math.max(G - 2 * Pl, 1), 0.03, 0.97),
        }),
        V = (J, le) => {
          let se = -1,
            ve = AZe;
          for (let we = 0; we < Qs; we++) {
            const me = $(d[we]),
              j = Math.hypot(J - me.x, le - me.y);
            j <= ve && ((ve = j), (se = we));
          }
          return se;
        },
        z = (J) => {
          const le = s.getBoundingClientRect();
          return { x: J.clientX - le.left, y: J.clientY - le.top };
        },
        te = (J) => {
          if (E || F <= 0) return;
          J.preventDefault();
          const le = z(J),
            se = V(le.x, le.y);
          if (!(se < 0)) {
            ((D = se),
              (f[se] = null),
              (L = ne(le.x, le.y)),
              (s.style.cursor = "grabbing"),
              e.current.hit(0.2));
            try {
              s.setPointerCapture(J.pointerId);
            } catch {}
          }
        },
        K = (J) => {
          const le = z(J);
          ((I = le), !(D < 0) && (L = ne(le.x, le.y)));
        },
        Q = (J) => {
          ((D = -1), (s.style.cursor = "grab"));
          try {
            s.releasePointerCapture(J.pointerId);
          } catch {}
        },
        X = () => {
          I = null;
        };
      (s.addEventListener("pointerdown", te),
        s.addEventListener("pointermove", K),
        s.addEventListener("pointerup", Q),
        s.addEventListener("pointercancel", Q),
        s.addEventListener("pointerleave", X));
      const he = (J) => {
        const le = _r(J, 0, 1);
        (le > R + 0.003 || (le >= 1 && R < 1)) &&
          ((R = le), e.current.onProgress(le));
      };
      let U = 0,
        ae = performance.now(),
        pe = !0;
      const _e = (J) => {
        if (!a) return;
        U = requestAnimationFrame(_e);
        const le = pe ? 0 : _r((J - ae) / 1e3, 0, 0.05);
        if (((pe = !1), (ae = J), (P += le), oe(), F <= 0 || G <= 0)) return;
        if (D >= 0) {
          const ue = 1 - Math.exp(-18 * le),
            de = d[D];
          ((de.x += (L.x - de.x) * ue), (de.y += (L.y - de.y) * ue));
        }
        if (!E) {
          if (y < 0 && P >= v) {
            ((y = P), (v = P + DZe + p() * 1.2));
            const ue = [];
            let de = 0;
            for (; ue.length < 2 && de < 40;) {
              de++;
              const Y = Math.floor(p() * Qs);
              Y !== D && !ue.includes(Y) && ue.push(Y);
            }
            x = ue.map((Y) => ({
              i: Y,
              hitAt: y + _r(d[Y].x, 0, 1) * GM,
              ang: p() * cu,
              dist: NZe * (0.75 + p() * 0.5),
            }));
          }
          if (x.length) {
            const ue = [];
            for (const de of x) {
              if (P < de.hitAt) {
                ue.push(de);
                continue;
              }
              if (de.i === D) continue;
              const Y = d[de.i];
              ((f[de.i] = {
                t0: P,
                fx: Y.x,
                fy: Y.y,
                tx: _r(Y.x + Math.cos(de.ang) * de.dist, 0.06, 0.94),
                ty: _r(Y.y + Math.sin(de.ang) * de.dist, 0.06, 0.94),
              }),
                w.push({ x: Y.x, y: Y.y, t0: P }));
            }
            x = ue;
          }
          y >= 0 && P >= y + GM + 0.25 && x.length === 0 && (y = -1);
        }
        for (let ue = 0; ue < Qs; ue++) {
          const de = f[ue];
          if (!de) continue;
          const Y = _r((P - de.t0) / LZe, 0, 1),
            ge = UM(Y);
          ((d[ue].x = Ma(de.fx, de.tx, ge)),
            (d[ue].y = Ma(de.fy, de.ty, ge)),
            Y >= 1 && (f[ue] = null));
        }
        for (; w.length && P - w[0].t0 > 0.55;) w.shift();
        const se = EC(d),
          ve = Array.from({ length: Vi.length }, () => !1);
        for (const ue of se) ((ve[ue.e1] = !0), (ve[ue.e2] = !0));
        if (!m)
          for (let ue = 0; ue < Vi.length; ue++)
            _[ue] && !ve[ue] && (h[ue] = 0.45);
        ((m = !1), (_ = ve));
        for (let ue = 0; ue < Vi.length; ue++)
          h[ue] > 0 && (h[ue] = Math.max(0, h[ue] - le));
        N > 0 && (N -= le);
        const we = se.length;
        if (!E && we < S) {
          const ue = S - we;
          ((S = we),
            N <= 0 &&
              (e.current.hit(Math.min(1.2, 0.5 + ue * 0.15)), (N = 0.12)));
        }
        if (E) {
          C += le;
          const ue = UM(_r(C / 0.7, 0, 1));
          for (let de = 0; de < Qs; de++)
            ((d[de].x = Ma(A[de].x, k[de].x, ue)),
              (d[de].y = Ma(A[de].y, k[de].y, ue)));
        } else {
          we === 0 ? (T += le) : (T = 0);
          const ue = _r(T / VM, 0, 1);
          if ((he(0.85 * _r(1 - we / u, 0, 1) + 0.15 * ue), T >= VM)) {
            ((E = !0),
              (D = -1),
              he(1),
              e.current.hit(1.5),
              (A = d.map((Y) => ({ ...Y }))),
              (k = d.map((Y, ge) => {
                let q = 0,
                  ce = 0,
                  Te = 0;
                for (const [Re, Ce] of Vi)
                  Re === ge
                    ? ((q += d[Ce].x), (ce += d[Ce].y), Te++)
                    : Ce === ge && ((q += d[Re].x), (ce += d[Re].y), Te++);
                return Te
                  ? { x: Ma(Y.x, q / Te, 0.3), y: Ma(Y.y, ce / Te, 0.3) }
                  : { ...Y };
              })));
            const de = setTimeout(() => {
              (l.delete(de), M || ((M = !0), e.current.onSolved()));
            }, 650);
            l.add(de);
          }
        }
        ((O = E || D >= 0 || !I ? -1 : V(I.x, I.y)),
          D < 0 && (s.style.cursor = O >= 0 ? "grab" : "default"));
        const me = E ? 1 : _r(T / VM, 0, 1),
          j = E ? UM(_r(C / 0.7, 0, 1)) : 0,
          B = _r(me * 0.55 + j, 0, 1);
        (o.clearRect(0, 0, F, G),
          (o.fillStyle = "rgb(5,15,29)"),
          o.fillRect(0, 0, F, G),
          (o.lineCap = "round"));
        for (let ue = 0; ue < 3; ue++) {
          const de =
              G * (0.25 + ue * 0.25) + Math.sin(P * 0.23 + ue * 2.1) * 10,
            Y = Math.sin(P * 0.31 + ue * 1.4) * 22;
          ((o.strokeStyle = "rgba(36,86,138,0.10)"),
            (o.lineWidth = 8),
            o.beginPath(),
            o.moveTo(-12, de),
            o.quadraticCurveTo(
              F * 0.5 + Y,
              de + (ue % 2 ? 16 : -16),
              F + 12,
              de,
            ),
            o.stroke());
        }
        if (y >= 0 && !E) {
          const de = _r((P - y) / GM, 0, 1) * F,
            Y = o.createLinearGradient(de - 44, 0, de + 44, 0);
          (Y.addColorStop(0, "rgba(56,110,170,0)"),
            Y.addColorStop(0.5, "rgba(56,110,170,0.22)"),
            Y.addColorStop(1, "rgba(56,110,170,0)"),
            (o.fillStyle = Y),
            o.fillRect(de - 44, 0, 88, G));
        }
        const fe = d.map($),
          be = Math.round(Ma(55, 255, B)),
          Pe = Math.round(Ma(200, 220, B)),
          re = Math.round(Ma(232, 174, B));
        for (let ue = 0; ue < Vi.length; ue++) {
          const [de, Y] = Vi[ue],
            ge = fe[de],
            q = fe[Y],
            ce = ve[ue] && !E;
          (o.beginPath(),
            o.moveTo(ge.x, ge.y),
            o.lineTo(q.x, q.y),
            ce
              ? ((o.strokeStyle = `rgba(${jM},0.38)`),
                (o.lineWidth = 1.5),
                o.stroke())
              : (o.save(),
                (o.globalCompositeOperation = "lighter"),
                (o.strokeStyle = `rgba(${be},${Pe},${re},${(0.16 + j * 0.2).toFixed(3)})`),
                (o.lineWidth = 5.5),
                o.stroke(),
                (o.strokeStyle = `rgba(${be},${Pe},${re},0.9)`),
                (o.lineWidth = 1.8),
                o.stroke(),
                o.restore()));
          const Te = h[ue];
          Te > 0 &&
            !E &&
            (o.save(),
            (o.globalCompositeOperation = "lighter"),
            (o.strokeStyle = `rgba(255,214,150,${((Te / 0.45) * 0.7).toFixed(3)})`),
            (o.lineWidth = 3.5),
            (o.shadowColor = "rgba(255,214,150,0.9)"),
            (o.shadowBlur = 10),
            o.beginPath(),
            o.moveTo(ge.x, ge.y),
            o.lineTo(q.x, q.y),
            o.stroke(),
            o.restore());
        }
        if (!E) {
          const ue = Math.floor(P * 8);
          ((o.textAlign = "center"), (o.textBaseline = "middle"));
          for (const de of se) {
            const Y = $(de),
              ge =
                (Math.imul(Math.floor(de.x * 83), 2903) ^
                  Math.imul(Math.floor(de.y * 83), 7919) ^
                  Math.imul(ue, 104729)) >>>
                0,
              q = TC(ge);
            ((o.fillStyle = `rgba(${jM},0.5)`),
              o.beginPath(),
              o.arc(Y.x, Y.y, 1.6, 0, cu),
              o.fill());
            for (let ce = 0; ce < 5; ce++) {
              const Te = (q() - 0.5) * 19,
                Re = (q() - 0.5) * 19,
                Ce = q() < 0.5 ? "0" : "1",
                Ie = 0.3 + q() * 0.5,
                H = 7 + q() * 2.2;
              ((o.font = `${H.toFixed(1)}px ui-monospace, SFMono-Regular, Menlo, monospace`),
                (o.fillStyle = `rgba(${jM},${Ie.toFixed(3)})`),
                o.fillText(Ce, Y.x + Te, Y.y + Re));
            }
          }
        }
        for (const ue of w) {
          const de = _r((P - ue.t0) / 0.55, 0, 1),
            Y = $(ue);
          ((o.strokeStyle = `rgba(80,140,200,${((1 - de) * 0.5).toFixed(3)})`),
            (o.lineWidth = 1.5),
            o.beginPath(),
            o.arc(Y.x, Y.y, 6 + de * 22, 0, cu),
            o.stroke());
        }
        for (let ue = 0; ue < Qs; ue++) {
          const de = fe[ue],
            Y = ue === D,
            ge = (Y ? 20 : 15) + j * 10,
            q = o.createRadialGradient(de.x, de.y, 0, de.x, de.y, ge);
          (q.addColorStop(
            0,
            `rgba(255,214,150,${(Y ? 0.55 : 0.35 + j * 0.25).toFixed(3)})`,
          ),
            q.addColorStop(1, "rgba(255,214,150,0)"),
            o.save(),
            (o.globalCompositeOperation = "lighter"),
            (o.fillStyle = q),
            o.beginPath(),
            o.arc(de.x, de.y, ge, 0, cu),
            o.fill(),
            (o.fillStyle = "rgba(255,233,201,0.95)"),
            o.beginPath(),
            o.arc(de.x, de.y, Y ? 5.5 : 4.5, 0, cu),
            o.fill(),
            o.restore(),
            ue === O &&
              ((o.strokeStyle = "rgba(255,220,170,0.55)"),
              (o.lineWidth = 1.5),
              o.beginPath(),
              o.arc(de.x, de.y, 10.5, 0, cu),
              o.stroke()));
        }
        if (E) {
          let ue = 0,
            de = 0;
          for (const ce of fe) ((ue += ce.x), (de += ce.y));
          const Y = ue / Qs,
            ge = de / Qs,
            q = o.createRadialGradient(Y, ge, 0, Y, ge, Math.max(F, G) * 0.62);
          (q.addColorStop(0, `rgba(255,222,170,${(j * 0.26).toFixed(3)})`),
            q.addColorStop(1, "rgba(255,222,170,0)"),
            o.save(),
            (o.globalCompositeOperation = "lighter"),
            (o.fillStyle = q),
            o.fillRect(0, 0, F, G),
            o.restore());
        }
      };
      return (
        (U = requestAnimationFrame(_e)),
        () => {
          ((a = !1),
            cancelAnimationFrame(U),
            W?.disconnect(),
            s.removeEventListener("pointerdown", te),
            s.removeEventListener("pointermove", K),
            s.removeEventListener("pointerup", Q),
            s.removeEventListener("pointercancel", Q),
            s.removeEventListener("pointerleave", X),
            l.forEach((J) => clearTimeout(J)),
            l.clear());
        }
      );
    }, []),
    jsx.jsx("div", {
      ref: n,
      "data-game": "unknot",
      className: "relative h-full w-full",
      style: { background: "rgb(5,15,29)" },
      children: jsx.jsx("canvas", {
        ref: r,
        className: "absolute inset-0 h-full w-full",
        style: { display: "block", touchAction: "none" },
      }),
    })
  );
}
const no = Math.PI * 2;
const Bn = (t, e, n) => (t < e ? e : t > n ? n : t);
const go = (t, e, n) => t + (e - t) * n;
const ab = (t, e = 0) => (Number.isFinite(t) ? t : e);
const Hu = (t, e, n) => {
    const r = Bn((n - t) / (e - t), 0, 1);
    return r * r * (3 - 2 * r);
  };
function rQ(t) {
  let e = t >>> 0;
  return () => ((e = (e * 1664525 + 1013904223) >>> 0), e / 4294967295);
}
const tk = 90;
const iQ = 104;
const zZe = 72;
const WZe = 0.04;
const $Ze = 95;
const qZe = 3.2;
const XZe = 7;
const sQ = 5;
const KZe = 9;
const HM = [12, 5, 4];
const lb = 0.8;
const zM = 1.2;
const WM = [5, 8];
const B6 = [33, 44];
const Jc = (() => {
    const t = rQ(387665),
      e = [t() * no, t() * no, t() * no, t() * no, t() * no],
      n = [];
    let r = 3.2 + t() * 2.2;
    for (let i = 0; i < 64; i++) {
      const s =
        t() < 0.6
          ? Math.floor(t() * 4) * (no / 4) + (t() - 0.5) * 0.6
          : t() * no;
      (n.push({
        t: r,
        ux: Math.cos(s),
        uy: Math.sin(s),
        mag: go(B6[0], B6[1], t()),
      }),
        (r += WM[0] + t() * (WM[1] - WM[0])));
    }
    return { ph: e, gusts: n, period: r };
  })();
function YZe(t) {
  const e =
      Jc.ph[0] +
      1.4 * Math.sin(t * 0.11 + Jc.ph[1]) +
      0.9 * Math.sin(t * 0.041 + Jc.ph[2]),
    n =
      HM[0] +
      HM[1] * Math.sin(t * 0.17 + Jc.ph[3]) +
      HM[2] * Math.sin(t * 0.071 + Jc.ph[4]);
  let r = Math.cos(e) * n,
    i = Math.sin(e) * n,
    s = 0,
    o = 0,
    a = 0,
    l = 0;
  const c = t % Jc.period;
  for (const f of Jc.gusts) {
    if (f.t > c) break;
    const h = c - f.t;
    if (!(h >= lb + zM)) {
      if (((a = f.ux), (l = f.uy), h < lb)) s = Hu(0, 1, h / lb);
      else {
        const _ = h - lb;
        ((o = Hu(0, 0.25, _) * (1 - Hu(zM - 0.35, zM, _))),
          (r += (f.ux * f.mag - r) * o),
          (i += (f.uy * f.mag - i) * o));
      }
      break;
    }
  }
  const u = Math.hypot(r, i),
    d = u > 1e-6 ? 1 / u : 0;
  return {
    x: r,
    y: i,
    mag: u,
    ux: r * d,
    uy: i * d,
    tele: s,
    push: o,
    gx: a,
    gy: l,
  };
}
const ZZe = 0.55;
const oQ = 6;
const JZe = 3;
const ox = 0.7;
const U6 = 0.35;
const QZe = 26;
const eJe = 30;
const tJe = [
    [-0.08, 0.297],
    [0.204, 0.297],
    [0.204, 0.099],
    [0.452, 0.099],
    [0.452, 0.485],
    [0.06, 0.485],
    [0.06, 0.718],
    [0.608, 0.718],
    [0.608, 0.277],
    [0.948, 0.277],
    [0.948, 0.515],
    [0.768, 0.515],
    [0.768, 0.683],
    [0.928, 0.683],
    [0.928, 0.817],
    [0.708, 0.817],
    [0.708, 0.946],
    [1, 0.946],
  ];
const nJe = [
    {
      at: 1,
      endHalf: 17,
      wps: [
        [0.27, 0.3],
        [0.324, 0.302],
      ],
    },
    {
      at: 8,
      endHalf: 16,
      wps: [
        [0.612, 0.208],
        [0.616, 0.134],
      ],
    },
    {
      at: 16,
      endHalf: 15,
      wps: [
        [0.628, 0.948],
        [0.572, 0.95],
      ],
    },
  ];
const V6 = 20;
const rJe = 6;
const cb = [
    [0, 33],
    [0.07, 32],
    [0.11, 30.5],
    [0.17, 30],
    [0.24, 29],
    [0.34, 27.5],
    [0.38, 26],
    [0.5, 25],
    [0.59, 23.5],
    [0.67, 22.5],
    [0.72, 21.5],
    [0.76, 21],
    [0.79, 20.5],
    [0.83, 19.5],
    [0.86, 19],
    [0.91, 18.5],
    [1, 17.5],
  ];
const iJe = [];
const sJe = 404;
const oJe = 17;
const aQ = [0.355, 0.695];
const G6 = 40;
const aJe = 14;
const lJe = 0.65;
const cJe = 13;
const uJe = 7;
const Lp = 11;
const j6 = 2.6;
const dJe = 34;
const Hm = (t, e) => {
    const n = Bn(t, 0, 1);
    let r = 0;
    for (; r < cb.length - 2 && cb[r + 1][0] < n;) r++;
    const i = cb[r],
      s = cb[r + 1];
    let o = go(i[1], s[1], Hu(i[0], s[0], n));
    for (const a of iJe) {
      const l = (n - a[0]) / a[2];
      o += a[1] * Math.exp(-l * l);
    }
    return Math.max(oJe, o * Bn(e / sJe, 0.85, 1.2));
  };
function fJe(t, e) {
  const n = [{ ...t[0] }];
  for (let r = 1; r < t.length - 1; r++) {
    const i = t[r - 1],
      s = t[r],
      o = t[r + 1],
      a = Math.hypot(s.x - i.x, s.y - i.y) || 1,
      l = Math.hypot(o.x - s.x, o.y - s.y) || 1,
      c = Math.min(e, a * 0.38, l * 0.38),
      u = s.x - ((s.x - i.x) / a) * c,
      d = s.y - ((s.y - i.y) / a) * c,
      f = s.x + ((o.x - s.x) / l) * c,
      h = s.y + ((o.y - s.y) / l) * c,
      _ = Math.max(4, Math.ceil(c / 3));
    for (let m = 0; m <= _; m++) {
      const p = m / _,
        v = 1 - p;
      n.push({
        x: v * v * u + 2 * v * p * s.x + p * p * f,
        y: v * v * d + 2 * v * p * s.y + p * p * h,
      });
    }
  }
  return (n.push({ ...t.at(-1) }), n);
}
function hJe(t, e) {
  const n = [0];
  for (let l = 1; l < t.length; l++)
    n.push(n[l - 1] + Math.hypot(t[l].x - t[l - 1].x, t[l].y - t[l - 1].y));
  const r = n.at(-1),
    i = Math.max(2, Math.ceil(r / e) + 1),
    s = new Float32Array(i * 2),
    o = new Float32Array(i);
  let a = 0;
  for (let l = 0; l < i; l++) {
    const c = Math.min(r, (l * r) / (i - 1));
    for (; a < t.length - 2 && n[a + 1] < c;) a++;
    const u = n[a + 1] - n[a],
      d = u > 0 ? (c - n[a]) / u : 0;
    ((s[l * 2] = t[a].x + (t[a + 1].x - t[a].x) * d),
      (s[l * 2 + 1] = t[a].y + (t[a + 1].y - t[a].y) * d),
      (o[l] = c));
  }
  return { pts: s, cum: o, n: i, total: r };
}
function H6(t, e) {
  return hJe(fJe(t, e), rJe);
}
function zm(t, e, n) {
  let r = 1 / 0,
    i = 0;
  const s = t.pts;
  for (let o = 0; o < t.n - 1; o++) {
    const a = s[o * 2],
      l = s[o * 2 + 1],
      c = s[o * 2 + 2] - a,
      u = s[o * 2 + 3] - l,
      d = c * c + u * u,
      f = d > 0 ? Bn(((e - a) * c + (n - l) * u) / d, 0, 1) : 0,
      h = a + c * f,
      _ = l + u * f,
      m = (e - h) * (e - h) + (n - _) * (n - _);
    m < r && ((r = m), (i = t.cum[o] + f * (t.cum[o + 1] - t.cum[o])));
  }
  return { d: Math.sqrt(r), s: i };
}
function ro(t, e) {
  const n = Bn((e / t.total) * (t.n - 1), 0, t.n - 1),
    r = Math.min(t.n - 2, Math.floor(n)),
    i = n - r;
  return {
    x: t.pts[r * 2] + (t.pts[r * 2 + 2] - t.pts[r * 2]) * i,
    y: t.pts[r * 2 + 1] + (t.pts[r * 2 + 3] - t.pts[r * 2 + 1]) * i,
  };
}
function wf(t, e) {
  const n = ro(t, Math.max(0, e - 4)),
    r = ro(t, Math.min(t.total, e + 4));
  let i = r.x - n.x,
    s = r.y - n.y;
  const o = Math.hypot(i, s) || 1;
  return ((i /= o), (s /= o), { tx: i, ty: s, nx: -s, ny: i });
}
const lQ = (t, e) => (e < 0 ? t.main : t.spurs[e]);
function pJe(t, e, n) {
  if (e < 0) return Hm(n / t.main.total, t.h);
  const r = t.spurs[e];
  return go(r.half0, r.half1, Bn(n / r.total, 0, 1));
}
function ub(t, e) {
  (e.length >= 4 && t.push(Float32Array.from(e)), (e.length = 0));
}
function mJe(t, e) {
  const n = QZe,
    i = t - eJe - n,
    s = rQ(1157093),
    o = (h) => ({ x: n + h[0] * i, y: h[1] * e }),
    a = tJe.map(o);
  for (let h = 1; h < a.length - 1; h++)
    ((a[h].x += (s() - 0.5) * 0.008 * i), (a[h].y += (s() - 0.5) * 0.008 * e));
  const l = H6(a, V6),
    c = nJe.map((h) => {
      const _ = [{ ...a[h.at] }, ...h.wps.map(o)];
      for (let y = 1; y < _.length; y++)
        ((_[y].x += (s() - 0.5) * 0.008 * i),
          (_[y].y += (s() - 0.5) * 0.008 * e));
      const m = H6(_, V6),
        p = zm(l, _[0].x, _[0].y).s / l.total,
        v = Hm(p, e);
      return { ...m, half0: v, half1: Math.min(v, h.endHalf) };
    }),
    u = (h, _) => {
      const m = zm(l, h, _);
      let p = Hm(m.s / l.total, e) - m.d;
      for (const v of c) {
        const y = zm(v, h, _);
        p = Math.max(p, go(v.half0, v.half1, Bn(y.s / v.total, 0, 1)) - y.d);
      }
      return p;
    },
    d = [];
  for (const h of [-1, 1])
    for (let _ = 0; _ < cJe; _++) {
      const m = _ === 0,
        p = m ? 0 : 5 + (_ - 1) * (8.5 + s() * 2) + s() * 4,
        v = s() * no,
        y = [],
        x = [],
        w = Math.floor(l.total / Lp);
      for (let S = 0; S <= w; S++) {
        const T = S * Lp,
          R = ro(l, T),
          E = wf(l, T),
          M = Hm(T / l.total, e) + p + Math.sin(T * 0.017 + v) * 2.2,
          C = R.x + E.nx * h * M,
          A = R.y + E.ny * h * M;
        u(C, A) > j6 ? ub(y, x) : x.push(C, A);
      }
      (ub(y, x),
        y.length &&
          d.push({
            runs: y,
            edge: m,
            width: m ? 1.6 : 1,
            peak: m ? 0.55 : Math.max(0.13, 0.34 - (_ - 1) * 0.016),
            dash: m ? null : [5 + s() * 6, 4 + s() * 4],
            dashSpeed: 4 + s() * 9,
            wobPhase: s() * no,
            wobFreq: 0.01 + s() * 0.008,
            col: m ? "118,175,242" : "64,118,205",
          }));
    }
  for (const h of c)
    for (let _ = 0; _ < uJe; _++) {
      const m = _ === 0,
        p = m ? 0 : 5 + (_ - 1) * (8.5 + s() * 2) + s() * 4,
        v = s() * no,
        y = [],
        x = [],
        w = Math.floor(h.total / Lp),
        S = (C) => go(h.half0, h.half1, Bn(C / h.total, 0, 1)),
        T = (C, A) => {
          u(C, A) > j6 ? ub(y, x) : x.push(C, A);
        };
      for (let C = 0; C <= w; C++) {
        const A = C * Lp,
          k = ro(h, A),
          N = wf(h, A),
          P = S(A) + p + Math.sin(A * 0.017 + v) * 2.2;
        T(k.x + N.nx * P, k.y + N.ny * P);
      }
      const R = ro(h, h.total),
        E = wf(h, h.total),
        M = h.half1 + p;
      for (let C = 1; C < 8; C++) {
        const A = (C / 8) * Math.PI,
          k = E.nx * Math.cos(A) + E.tx * Math.sin(A),
          N = E.ny * Math.cos(A) + E.ty * Math.sin(A);
        T(R.x + k * M, R.y + N * M);
      }
      for (let C = w; C >= 0; C--) {
        const A = C * Lp,
          k = ro(h, A),
          N = wf(h, A),
          P = S(A) + p + Math.sin(A * 0.017 + v + 2.4) * 2.2;
        T(k.x - N.nx * P, k.y - N.ny * P);
      }
      (ub(y, x),
        y.length &&
          d.push({
            runs: y,
            edge: m,
            width: m ? 1.6 : 1,
            peak: m ? 0.55 : Math.max(0.13, 0.34 - (_ - 1) * 0.03),
            dash: m ? null : [5 + s() * 6, 4 + s() * 4],
            dashSpeed: 4 + s() * 9,
            wobPhase: s() * no,
            wobFreq: 0.01 + s() * 0.008,
            col: m ? "118,175,242" : "64,118,205",
          }));
    }
  const f = Array.from({ length: dJe }, () => ({
    x: s() * t,
    y: s() * e,
    vx: (s() - 0.5) * 4,
    vy: (s() - 0.5) * 3,
    a: 0.03 + s() * 0.05,
    r: 0.6 + s() * 0.9,
    par: 0.6 + s() * 0.8,
  }));
  return {
    w: t,
    h: e,
    main: l,
    spurs: c,
    u0: G6 / l.total,
    start: ro(l, G6),
    gate: ro(l, l.total),
    cps: aQ.map((h) => ro(l, h * l.total)),
    strands: d,
    dust: f,
  };
}
function gJe() {
  return {
    inited: !1,
    mote: { x: 0, y: 0 },
    vel: { x: 0, y: 0 },
    tail: [],
    latched: !1,
    lit: 0.38,
    cpIdx: 0,
    lastCp: { x: 0, y: 0 },
    hits: [],
    lastHitT: -9,
    sweepT: 0,
    sweepFrom: { x: 0, y: 0 },
    done: !1,
    doneAt: 0,
    fired: !1,
    maxU: 0,
    reported: -1,
    shocks: [],
    flashes: [],
    windOfs: { x: 0, y: 0 },
  };
}
function vJe({ api: t }) {
  const e = React.useRef(t);
  e.current = t;
  const n = React.useRef(null),
    r = React.useRef(null),
    i = React.useRef(null);
  i.current || (i.current = gJe());
  const s = React.useRef({ x: 0, y: 0, hover: !1 }),
    o = React.useRef(0),
    a = (l) => {
      const c = n.current;
      if (!c) return;
      const u = c.getBoundingClientRect();
      if (u.width <= 0 || u.height <= 0) return;
      const d = s.current;
      ((d.x = l.clientX - u.left), (d.y = l.clientY - u.top), (d.hover = !0));
    };
  return (
    React.useEffect(() => {
      let l = !0,
        c = 0,
        u = performance.now(),
        d = !0,
        f = -1,
        h = -1,
        _ = null,
        m = null;
      bJe().then(({ px: x, app: w }) => {
        if (!l) return;
        const S = n.current;
        S &&
          ((_ = w),
          (w.canvas.style.position = "absolute"),
          (w.canvas.style.inset = "0"),
          S.append(w.canvas),
          (m = new xJe(x)),
          w.stage.addChild(m.root),
          f > 0 && h > 0 && w.renderer.resize(f, h));
      });
      const p = () => {
        const x = n.current?.getBoundingClientRect();
        if (!x || x.width <= 0 || x.height <= 0) return;
        const w = Math.round(x.width),
          S = Math.round(x.height);
        (w !== f || S !== h) && ((f = w), (h = S), _?.renderer.resize(w, S));
        const T = Math.round(x.width),
          R = Math.round(x.height),
          E = r.current,
          M = i.current;
        if (E && E.w === T && E.h === R) return;
        const C = mJe(T, R);
        if (E && M.inited) {
          const A = C.w / E.w,
            k = C.h / E.h;
          ((M.mote.x *= A),
            (M.mote.y *= k),
            (M.sweepFrom.x *= A),
            (M.sweepFrom.y *= k));
          for (const N of M.tail) ((N.x *= A), (N.y *= k));
          M.lastCp = M.cpIdx > 0 ? { ...C.cps[M.cpIdx - 1] } : { ...C.start };
        }
        ((r.current = C),
          M.inited ||
            ((M.inited = !0),
            (M.mote = { ...C.start }),
            (M.tail = Array.from({ length: KZe }, () => ({ ...C.start }))),
            (M.lastCp = { ...C.start })));
      };
      p();
      let v = null;
      typeof ResizeObserver < "u" &&
        n.current &&
        ((v = new ResizeObserver(p)), v.observe(n.current));
      const y = (x) => {
        if (!l) return;
        c = requestAnimationFrame(y);
        const w = (x - u) / 1e3,
          S = d ? 0 : Bn(w, 0, 0.05);
        ((d = !1), (u = x), (o.current += S));
        const T = o.current;
        p();
        const R = r.current,
          E = i.current;
        if (!R || !E.inited) return;
        const M = s.current.hover ? { x: s.current.x, y: s.current.y } : null,
          C = YZe(T);
        ((E.windOfs.x += C.x * S),
          (E.windOfs.y += C.y * S),
          (E.hits = E.hits.filter((P) => T - P < oQ)),
          (E.flashes = E.flashes.filter((P) => T - P.t < 0.3)));
        for (const P of E.shocks) P.age += S;
        if (((E.shocks = E.shocks.filter((P) => P.age < P.dur)), E.done)) {
          const P = Math.min(1, S * 6);
          ((E.mote.x += (R.gate.x - E.mote.x) * P),
            (E.mote.y += (R.gate.y - E.mote.y) * P),
            !E.fired &&
              T - E.doneAt >= lJe &&
              ((E.fired = !0), e.current.onSolved()));
        } else if (E.sweepT > 0) {
          E.sweepT -= S;
          const P = ox - E.sweepT;
          if (P < U6) {
            const D = Hu(0, 1, P / U6);
            ((E.mote.x = go(E.sweepFrom.x, E.lastCp.x, D)),
              (E.mote.y = go(E.sweepFrom.y, E.lastCp.y, D)));
          } else ((E.mote.x = E.lastCp.x), (E.mote.y = E.lastCp.y));
          E.sweepT < 0 && (E.sweepT = 0);
        } else {
          const P = M ? Math.hypot(M.x - E.mote.x, M.y - E.mote.y) : 1 / 0;
          E.latched
            ? (!M || P > iQ) && (E.latched = !1)
            : M &&
              P <= zZe &&
              ((E.latched = !0),
              E.shocks.push({
                x: E.mote.x,
                y: E.mote.y,
                age: 0,
                dur: 0.45,
                maxR: 34,
                col: "255,214,160",
              }),
              e.current.hit(0.25));
          let D = 0,
            L = 0;
          if (E.latched && M && P > 0.001) {
            const te = Math.min($Ze, P * qZe);
            ((D = ((M.x - E.mote.x) / P) * te),
              (L = ((M.y - E.mote.y) / P) * te));
          }
          const O = Math.min(1, XZe * S);
          ((E.vel.x += (D - E.vel.x) * O), (E.vel.y += (L - E.vel.y) * O));
          const I = E.latched ? C.x : 0,
            F = E.latched ? C.y : 0;
          ((E.mote.x = ab(
            Bn(E.mote.x + (E.vel.x + I) * S, 10, R.w - 8),
            E.mote.x,
          )),
            (E.mote.y = ab(
              Bn(E.mote.y + (E.vel.y + F) * S, 8, R.h - 8),
              E.mote.y,
            )));
          const G = zm(R.main, E.mote.x, E.mote.y),
            ee = G.s / R.main.total,
            oe = Hm(ee, R.h);
          let W = -1,
            $ = G.d,
            ne = G.s,
            V = oe;
          for (let te = 0; te < R.spurs.length; te++) {
            const K = R.spurs[te],
              Q = zm(K, E.mote.x, E.mote.y),
              X = go(K.half0, K.half1, Bn(Q.s / K.total, 0, 1));
            X - Q.d > V - $ && ((W = te), ($ = Q.d), (ne = Q.s), (V = X));
          }
          const z = V - sQ - 1;
          if ($ > z && $ > 0.001) {
            const te = lQ(R, W),
              K = ro(te, ne),
              Q = (E.mote.x - K.x) / $,
              X = (E.mote.y - K.y) / $;
            ((E.mote.x = K.x + Q * (z - 8)), (E.mote.y = K.y + X * (z - 8)));
            const he = E.vel.x * Q + E.vel.y * X;
            if (
              ((E.vel.x = 0.5 * E.vel.x - 0.72 * Q * he),
              (E.vel.y = 0.5 * E.vel.y - 0.72 * X * he),
              T - E.lastHitT > ZZe)
            ) {
              ((E.lastHitT = T), E.hits.push(T));
              const U = wf(te, ne);
              (E.flashes.push({
                ri: W,
                s: ne,
                dir: U.nx * Q + U.ny * X >= 0 ? 1 : -1,
                t: T,
              }),
                E.shocks.push({
                  x: K.x + Q * (z + 4),
                  y: K.y + X * (z + 4),
                  age: 0,
                  dur: 0.35,
                  maxR: 26,
                  col: "255,72,84",
                }),
                E.hits.length >= JZe &&
                  ((E.sweepT = ox),
                  (E.sweepFrom = { x: E.mote.x, y: E.mote.y }),
                  (E.hits = []),
                  (E.latched = !1),
                  (E.vel.x = 0),
                  (E.vel.y = 0)));
            }
          }
          if (E.cpIdx < R.cps.length && G.d <= oe && ee >= aQ[E.cpIdx]) {
            const te = R.cps[E.cpIdx];
            ((E.lastCp = { ...te }),
              E.cpIdx++,
              E.shocks.push({
                x: te.x,
                y: te.y,
                age: 0,
                dur: 0.55,
                maxR: 46,
                col: "255,214,160",
              }),
              e.current.hit(0.7));
          }
          (Math.hypot(E.mote.x - R.gate.x, E.mote.y - R.gate.y) <= aJe &&
            ((E.done = !0),
            (E.doneAt = T),
            (E.latched = !1),
            E.shocks.push({
              x: R.gate.x,
              y: R.gate.y,
              age: 0,
              dur: 0.8,
              maxR: Math.max(R.w, R.h) * 0.5,
              col: "255,214,160",
            }),
            e.current.hit(1.5)),
            (E.maxU = Math.max(E.maxU, Bn((ee - R.u0) / (1 - R.u0), 0, 1))));
        }
        const A = E.done ? 1 : E.sweepT > 0 ? 0.3 : E.latched ? 1 : 0.38;
        E.lit += (A - E.lit) * Math.min(1, S * 7);
        let k = E.mote;
        for (const P of E.tail)
          ((P.x = ab(P.x + (k.x - P.x) * 0.38, P.x)),
            (P.y = ab(P.y + (k.y - P.y) * 0.38, P.y)),
            (k = P));
        const N = E.done ? 1 : Bn(E.maxU, 0, 1);
        ((N >= E.reported + 0.004 || (N === 1 && E.reported !== 1)) &&
          ((E.reported = N), e.current.onProgress(N)),
          _ && m && (m.update(R, E, T, M, C), _.render()));
      };
      return (
        (c = requestAnimationFrame(y)),
        () => {
          ((l = !1),
            cancelAnimationFrame(c),
            v?.disconnect(),
            _ && m && (_.stage.removeChild(m.root), m.destroy()),
            _?.canvas.parentNode && _.canvas.parentNode.removeChild(_.canvas));
        }
      );
    }, []),
    jsx.jsx("div", {
      className: "h-full w-full p-3 text-white/85",
      children: jsx.jsx("div", {
        ref: n,
        "data-game": "lure",
        className:
          "relative h-full w-full cursor-none touch-none select-none overflow-hidden rounded-md",
        onPointerDown: a,
        onPointerMove: a,
        onPointerEnter: a,
        onPointerLeave: () => {
          s.current.hover = !1;
        },
      }),
    })
  );
}
let $M = null;
function bJe() {
  return (
    $M ||
      ($M = Promise.resolve(PIXI).then(async (t) => {
        const e = new t.Application();
        return (
          await e.init({
            backgroundAlpha: 0,
            antialias: !0,
            preference: "webgl",
            autoStart: !1,
            resolution: Bn(
              (typeof window < "u" && window.devicePixelRatio) || 1,
              1,
              2,
            ),
            autoDensity: !0,
          }),
          { px: t, app: e }
        );
      })),
    $M
  );
}
const qM = (t) => {
  const e = t.split(",");
  return (
    ((Number.parseInt(e[0], 10) & 255) << 16) |
    ((Number.parseInt(e[1], 10) & 255) << 8) |
    (Number.parseInt(e[2], 10) & 255)
  );
};
function z6(t, e, n, r) {
  const i = document.createElement("canvas");
  i.width = i.height = Math.max(2, Math.ceil(n * 2));
  const s = i.getContext("2d"),
    o = s.createRadialGradient(n, n, 0, n, n, n);
  for (const [a, l] of r) o.addColorStop(a, `rgba(${e},${l.toFixed(4)})`);
  return ((s.fillStyle = o), s.fillRect(0, 0, n * 2, n * 2), t.Texture.from(i));
}
let XM = null;
function _Je(t) {
  if (!XM) {
    const e = document.createElement("canvas");
    ((e.width = 2), (e.height = 256));
    const n = e.getContext("2d"),
      r = n.createLinearGradient(0, 0, 0, 256);
    (r.addColorStop(0, "#04101f"),
      r.addColorStop(1, "#030b17"),
      (n.fillStyle = r),
      n.fillRect(0, 0, 2, 256),
      (XM = {
        halo: z6(t, "255,218,170", tk, [
          [0, 0.13],
          [0.55, 0.05],
          [1, 0],
        ]),
        glow: z6(t, "255,214,160", 64, [
          [0, 1],
          [1, 0],
        ]),
        bg: t.Texture.from(e),
      }));
  }
  return XM;
}
function W6(t, e, n, r) {
  const i = t.length / 2;
  if (!e) {
    for (let a = 0; a < i - 1; a++)
      r.push(t[a * 2], t[a * 2 + 1], t[a * 2 + 2], t[a * 2 + 3]);
    return;
  }
  const s = e[0] + e[1];
  let o = ((n % s) + s) % s;
  for (let a = 0; a < i - 1; a++) {
    let l = t[a * 2],
      c = t[a * 2 + 1];
    const u = t[a * 2 + 2],
      d = t[a * 2 + 3];
    let f = Math.hypot(u - l, d - c);
    if (f <= 1e-6) continue;
    const h = (u - l) / f,
      _ = (d - c) / f;
    for (; f > 1e-6;) {
      const m = o < e[0],
        p = Math.min(f, (m ? e[0] : s) - o);
      (m && r.push(l, c, l + h * p, c + _ * p),
        (l += h * p),
        (c += _ * p),
        (o += p),
        o >= s && (o -= s),
        (f -= p));
    }
  }
}
const yJe = (t) => 1 - Hu(0.42, 1, t / tk);
class xJe {
  root;
  bg;
  dust;
  amb;
  lit;
  cps;
  gateGlow;
  bloom;
  fx;
  tail;
  moteGlow;
  mote;
  lampHalo;
  lampDot;
  dark;
  geo = null;
  runBox = [];
  scratch = [];
  flashPts = [];
  buckets = new Map();
  constructor(e) {
    const n = _Je(e);
    ((this.root = new e.Container()),
      (this.dust = new e.Graphics()),
      (this.amb = new e.Graphics()),
      (this.lit = new e.Graphics()),
      (this.cps = new e.Graphics()),
      (this.fx = new e.Graphics()),
      (this.tail = new e.Graphics()),
      (this.mote = new e.Graphics()),
      (this.lampDot = new e.Graphics()),
      (this.dark = new e.Graphics()),
      (this.bg = new e.Sprite(n.bg)),
      (this.gateGlow = new e.Sprite(n.glow)),
      this.gateGlow.anchor.set(0.5),
      (this.bloom = new e.Sprite(n.glow)),
      this.bloom.anchor.set(0.5),
      (this.bloom.visible = !1),
      (this.moteGlow = new e.Sprite(n.glow)),
      this.moteGlow.anchor.set(0.5),
      (this.moteGlow.blendMode = "add"),
      (this.lampHalo = new e.Sprite(n.halo)),
      this.lampHalo.anchor.set(0.5),
      (this.lampHalo.blendMode = "add"),
      (this.tail.blendMode = "add"),
      (this.mote.blendMode = "add"),
      (this.lampDot.blendMode = "add"),
      this.root.addChild(
        this.bg,
        this.dust,
        this.amb,
        this.lit,
        this.cps,
        this.gateGlow,
        this.bloom,
        this.fx,
        this.tail,
        this.moteGlow,
        this.mote,
        this.lampHalo,
        this.lampDot,
        this.dark,
      ));
  }
  destroy() {
    this.root.destroy({ children: !0 });
  }
  setGeo(e) {
    if (this.geo === e) return;
    ((this.geo = e),
      (this.bg.width = e.w),
      (this.bg.height = e.h),
      (this.runBox = []));
    const n = this.amb;
    n.clear();
    const r = this.scratch;
    for (const i of e.strands) {
      const s = new Float32Array(i.runs.length * 4);
      r.length = 0;
      for (let o = 0; o < i.runs.length; o++) {
        const a = i.runs[o];
        let l = 1 / 0,
          c = 1 / 0,
          u = -1 / 0,
          d = -1 / 0;
        for (let f = 0; f * 2 < a.length; f++) {
          const h = a[f * 2],
            _ = a[f * 2 + 1];
          (h < l && (l = h),
            h > u && (u = h),
            _ < c && (c = _),
            _ > d && (d = _));
        }
        ((s[o * 4] = l - 6),
          (s[o * 4 + 1] = c - 6),
          (s[o * 4 + 2] = u + 6),
          (s[o * 4 + 3] = d + 6),
          W6(a, i.dash, 0, r));
      }
      this.runBox.push(s);
      for (let o = 0; o < r.length; o += 4) {
        const a = Math.sin(i.wobPhase + r[o] * i.wobFreq) * 1.7 * 0.45,
          l = Math.sin(i.wobPhase + r[o + 2] * i.wobFreq) * 1.7 * 0.45;
        (n.moveTo(r[o], r[o + 1] + a), n.lineTo(r[o + 2], r[o + 3] + l));
      }
      n.stroke({
        width: i.width,
        color: qM(i.col),
        alpha: WZe * (i.edge ? 1 : 0.85),
      });
    }
  }
  update(e, n, r, i, s) {
    this.geo !== e && this.setGeo(e);
    const { w: o, h: a } = e,
      l = this.dust;
    l.clear();
    const c = s.tele * 13 + s.push * 9;
    for (const M of e.dust) {
      const C = (((M.x + M.vx * r + n.windOfs.x * M.par) % o) + o) % o,
        A = (((M.y + M.vy * r + n.windOfs.y * M.par) % a) + a) % a,
        k = Math.min(0.26, M.a * (1 + s.tele * 1.6 + s.push * 1.1)),
        N = Bn(s.mag * 0.32, 2.2, 9) * M.par,
        P = s.ux * N + s.gx * c,
        D = s.uy * N + s.gy * c;
      (l.moveTo(C, A),
        l.lineTo(C - P, A - D),
        l.stroke({ width: M.r, color: 9221350, alpha: k, cap: "round" }));
    }
    const u = n.done ? 1 - 0.8 * Bn((r - n.doneAt) / 0.6, 0, 1) : 1;
    this.amb.alpha = u;
    const d = this.lit;
    if ((d.clear(), (d.alpha = u), i)) {
      const M = s.x * 0.055,
        C = s.y * 0.055,
        A = tk + 8;
      for (let k = 0; k < e.strands.length; k++) {
        const N = e.strands[k],
          P = this.runBox[k],
          D = this.scratch;
        D.length = 0;
        for (let I = 0; I < N.runs.length; I++)
          i.x < P[I * 4] - A ||
            i.x > P[I * 4 + 2] + A ||
            i.y < P[I * 4 + 1] - A ||
            i.y > P[I * 4 + 3] + A ||
            W6(N.runs[I], N.dash, -r * N.dashSpeed, D);
        if (!D.length) continue;
        const L = this.buckets;
        L.clear();
        for (let I = 0; I < D.length; I += 4) {
          const F = (D[I] + D[I + 2]) / 2,
            G = (D[I + 1] + D[I + 3]) / 2,
            ee = yJe(Math.hypot(F - i.x, G - i.y));
          if (ee <= 0.02) continue;
          const oe = Math.min(11, Math.floor(ee * 12));
          let W = L.get(oe);
          W || ((W = []), L.set(oe, W));
          const $ = Math.sin(r * 0.8 + N.wobPhase + D[I] * N.wobFreq) * 1.7,
            ne = Math.sin(r * 0.8 + N.wobPhase + D[I + 2] * N.wobFreq) * 1.7;
          W.push(
            D[I] + M + s.ux * $ * 0.55,
            D[I + 1] + C + s.uy * $ * 0.55 + $ * 0.45,
            D[I + 2] + M + s.ux * ne * 0.55,
            D[I + 3] + C + s.uy * ne * 0.55 + ne * 0.45,
          );
        }
        const O = qM(N.col);
        for (const [I, F] of L) {
          for (let G = 0; G < F.length; G += 4)
            (d.moveTo(F[G], F[G + 1]), d.lineTo(F[G + 2], F[G + 3]));
          d.stroke({
            width: N.width,
            color: O,
            alpha: N.peak * ((I + 0.5) / 12),
          });
        }
      }
    }
    const f = this.cps;
    f.clear();
    for (let M = 0; M < e.cps.length; M++) {
      const C = e.cps[M],
        A = M < n.cpIdx,
        k = 0.5 + 0.5 * Math.sin(r * 1.8 + M * 2.1);
      (f.circle(C.x, C.y, 8),
        f.stroke({
          width: A ? 1.6 : 1.2,
          color: 16766624,
          alpha: A ? 0.55 : 0.2 + 0.1 * k,
        }),
        A && (f.circle(C.x, C.y, 2), f.fill({ color: 16769460, alpha: 0.7 })));
    }
    const h = 0.5 + 0.5 * Math.sin(r * 2.2),
      _ = n.done ? Bn((r - n.doneAt) / 0.8, 0, 1) : 0,
      m = 30 + _ * 30;
    if (
      (this.gateGlow.position.set(e.gate.x, e.gate.y),
      (this.gateGlow.width = m * 2),
      (this.gateGlow.height = m * 2),
      (this.gateGlow.alpha = 0.12 + 0.05 * h + _ * 0.3),
      _ > 0)
    ) {
      const M = go(20, Math.max(o, a), Hu(0, 1, _));
      ((this.bloom.visible = !0),
        this.bloom.position.set(e.gate.x, e.gate.y),
        (this.bloom.width = M * 2),
        (this.bloom.height = M * 2),
        (this.bloom.alpha = 0.3 * (1 - _ * 0.6)));
    } else this.bloom.visible = !1;
    const p =
        n.sweepT > 0 ? 0.3 + 0.7 * Math.abs((n.sweepT / ox) * 2 - 1) ** 1.5 : 1,
      v = Bn(n.lit * p, 0, 1),
      y = n.done ? 0 : Math.sin(r * 1.7) * (n.latched ? 0.4 : 1.3),
      x = n.mote.x,
      w = n.mote.y + y,
      S = this.fx;
    (S.clear(),
      S.circle(e.gate.x, e.gate.y, 12),
      S.stroke({
        width: (n.done ? 2.4 : 1.6) + 3.2,
        color: 16766624,
        alpha: 0.18,
      }),
      S.circle(e.gate.x, e.gate.y, 12),
      S.stroke({
        width: n.done ? 2.4 : 1.6,
        color: 16766624,
        alpha: n.done ? 0.95 : 0.55 + 0.15 * h,
      }));
    for (const M of n.flashes) {
      const C = Bn((r - M.t) / 0.28, 0, 1),
        A = lQ(e, M.ri),
        k = this.flashPts;
      k.length = 0;
      for (let N = -5; N <= 5; N++) {
        const P = Bn(M.s + N * 8, 0, A.total),
          D = ro(A, P),
          L = wf(A, P),
          O = pJe(e, M.ri, P);
        k.push(D.x + L.nx * M.dir * O, D.y + L.ny * M.dir * O);
      }
      for (const N of [
        { w: 5.4, a: 0.28 },
        { w: 2.4, a: 0.8 },
      ]) {
        S.moveTo(k[0], k[1]);
        for (let P = 2; P < k.length; P += 2) S.lineTo(k[P], k[P + 1]);
        S.stroke({ width: N.w, color: 16730196, alpha: (1 - C) * N.a });
      }
    }
    for (const M of n.shocks) {
      const C = Bn(M.age / M.dur, 0, 1);
      (S.circle(M.x, M.y, Math.max(C * M.maxR, 2)),
        S.stroke({
          width: 2 * (1 - C) + 0.5,
          color: qM(M.col),
          alpha: (1 - C) * 0.7,
        }));
    }
    if (n.latched && i && n.sweepT <= 0 && !n.done) {
      const M = Math.hypot(i.x - n.mote.x, i.y - n.mote.y),
        C = Bn(M / iQ, 0, 1),
        A = (1 - C) * 10,
        k = Math.round(go(214, 240, C)),
        N = Math.round(go(160, 225, C));
      (S.moveTo(n.mote.x, n.mote.y),
        S.quadraticCurveTo(
          (n.mote.x + i.x) / 2,
          (n.mote.y + i.y) / 2 + A,
          i.x,
          i.y,
        ),
        S.stroke({
          width: 1,
          color: (255 << 16) | (k << 8) | N,
          alpha: 0.1 + 0.28 * C * C,
        }));
    }
    for (let M = 0; M < n.hits.length; M++) {
      const C = 1 - (r - n.hits[M]) / oQ;
      (S.circle(x - 8 + M * 8, w - 15, 2),
        S.fill({ color: 16734820, alpha: C * 0.75 }));
    }
    const T = this.tail;
    (T.clear(), T.moveTo(x, w));
    for (const M of n.tail) T.lineTo(M.x, M.y);
    (T.stroke({ width: 2.2, color: 16766880, alpha: 0.14 * v, join: "round" }),
      this.moteGlow.position.set(x, w),
      (this.moteGlow.width = 44),
      (this.moteGlow.height = 44),
      (this.moteGlow.alpha = 0.5 * v));
    const R = this.mote;
    if (
      (R.clear(),
      R.circle(x, w, sQ - 0.6),
      R.fill({ color: 16769460, alpha: 0.55 + 0.4 * v }),
      R.circle(x, w, 2),
      R.fill({ color: 16775920, alpha: 0.5 + 0.5 * v }),
      i)
    ) {
      ((this.lampHalo.visible = !0), this.lampHalo.position.set(i.x, i.y));
      const M = this.lampDot;
      ((M.visible = !0),
        M.clear(),
        M.circle(i.x, i.y, 4.5),
        M.stroke({ width: 1.4, color: 16769465, alpha: 0.55 }));
    } else ((this.lampHalo.visible = !1), (this.lampDot.visible = !1));
    const E = this.dark;
    (E.clear(),
      n.sweepT > 0 &&
        (E.rect(0, 0, o, a),
        E.fill({ color: 198930, alpha: 0.5 * (n.sweepT / ox) ** 1.4 })));
  }
}
const Qc = Math.PI * 2;
const SJe = Math.PI / 180;
const vs = (t, e, n) => (t < e ? e : t > n ? n : t);
const ei = (t, e, n) => t + (e - t) * n;
const MJe = (t) => 1 - Math.pow(1 - t, 3);
function cQ(t) {
  let e = t >>> 0;
  return () => (
    (e = (Math.imul(e, 1664525) + 1013904223) >>> 0),
    e / 4294967296
  );
}
const dm = 1;
const Pa = [
    { bar: 1, x: -0.75 },
    { bar: 1, x: -0.3 },
    { bar: 1, x: 0.5 },
    { bar: 2, x: -0.25 },
    { bar: 2, x: 0.4 },
    { bar: 2, x: 0.75 },
  ];
const Cr = [2, 3, 5, 6];
const $6 = [5, 2, 1, 3];
const TJe = [
    [-1.08, 1.08],
    [-0.83, 0.58],
    [-0.33, 0.83],
  ];
const KM = 20;
const EJe = 5;
const YM = [5, 2, 2];
const za = [0.5, 0.12, 0.12];
const ZM = 0.8;
const CJe = 5351347;
const RJe = 30;
const AJe = 3;
const PJe = [0.4, 0.7, 0.7];
const IJe = [0.41, 0.63, 0.55];
const kJe = [0.7, 2.3, 4.1];
const DJe = 12;
const q6 = 58;
function Zf(t) {
  let e = 0,
    n = 0,
    r = 0,
    i = 0;
  for (let s = 0; s < Cr.length; s++) {
    const o = t[s];
    if (o < 0) continue;
    const a = Pa[o];
    a.bar === 1
      ? ((e += Cr[s] * a.x), (r += Cr[s]))
      : ((n += Cr[s] * a.x), (i += Cr[s]));
  }
  return [(i - r) * dm, e, n];
}
const ax = (t) => [
    KM * Math.tanh(t[0] / YM[0]),
    KM * Math.tanh(t[1] / YM[1]),
    KM * Math.tanh(t[2] / YM[2]),
  ];
const X6 = (t) => {
    const e = ax(t);
    for (let n = 0; n < 3; n++)
      Math.abs(t[n]) > za[n] &&
        (e[n] = Math.sign(t[n]) * Math.max(Math.abs(e[n]), EJe));
    return e;
  };
const CC = (t) => Math.abs(t[0]) + Math.abs(t[1]) + Math.abs(t[2]);
const nk = (t) =>
    Math.abs(t[0]) < za[0] && Math.abs(t[1]) < za[1] && Math.abs(t[2]) < za[2];
function LJe() {
  const t = [],
    e = [-1, -1, -1, -1],
    n = [!1, !1, !1, !1, !1, !1],
    r = (i) => {
      if (i === Cr.length) {
        nk(Zf(e)) && t.push([...e]);
        return;
      }
      for (let s = 0; s < Pa.length; s++)
        n[s] || ((n[s] = !0), (e[i] = s), r(i + 1), (e[i] = -1), (n[s] = !1));
    };
  return (
    r(0),
    t.some((i) => i.every((s, o) => s === $6[o])) || t.push([...$6]),
    t
  );
}
function NJe(t) {
  const e = cQ(CJe);
  let n = null;
  for (let i = 0; i < 500; i++) {
    const s = [0, 1, 2, 3, 4, 5],
      o = [];
    for (let u = 0; u < Cr.length; u++) {
      const d = Math.floor(e() * s.length);
      (o.push(s[d]), s.splice(d, 1));
    }
    const a = Zf(o);
    if (nk(a)) continue;
    let l = 99;
    for (const u of t) {
      let d = 0;
      for (let f = 0; f < o.length; f++) o[f] !== u[f] && d++;
      l = Math.min(l, d);
    }
    if (l < AJe) continue;
    const c = CC(ax(a));
    if (c >= RJe) return { hookOf: o, tilt0: c };
    (!n || c > n.tilt0) && (n = { hookOf: [...o], tilt0: c });
  }
  if (n) return n;
  const r = [0, 1, 3, 2];
  return { hookOf: r, tilt0: CC(ax(Zf(r))) };
}
function OJe({ api: t }) {
  const e = React.useRef(t);
  e.current = t;
  const n = React.useRef(null),
    r = React.useRef(null);
  return (
    React.useEffect(() => {
      const i = n.current,
        s = r.current,
        o = s?.getContext("2d") ?? null;
      if (!i || !s || !o) return;
      let a = !0;
      const l = LJe(),
        c = NJe(l),
        u = [...c.hookOf],
        d = Math.max(1, c.tilt0),
        f = [...X6(Zf(u))],
        h = [!1, !1, !1];
      {
        const U = Zf(u);
        for (let ae = 0; ae < 3; ae++) h[ae] = Math.abs(U[ae]) < za[ae];
      }
      const _ = Cr.map(() => ({ x: 0, y: 0 })),
        m = Cr.map(() => 0);
      let p = !1,
        v = -1,
        y = -1,
        x = null,
        w = -1,
        S = 0,
        T = 0,
        R = 0,
        E = !1,
        M = !1,
        C = 0,
        A = 0,
        k = 0;
      const N = Pa.map(() => ({ x: 0, y: 0 })),
        P = Cr.map(() => 0);
      let D = 0,
        L = 0,
        O = -1;
      const I = () => {
        const U = i.getBoundingClientRect();
        if (U.width <= 0 || U.height <= 0) return;
        ((D = U.width), (L = U.height));
        const ae = vs(window.devicePixelRatio || 1, 1, 2),
          pe = Math.max(1, Math.round(D * ae)),
          _e = Math.max(1, Math.round(L * ae)),
          J = pe * 1e5 + _e;
        J !== O &&
          ((O = J),
          (s.width = pe),
          (s.height = _e),
          o.setTransform(ae, 0, 0, ae, 0, 0));
      };
      I();
      let F = null;
      typeof ResizeObserver < "u" &&
        ((F = new ResizeObserver(() => I())), F.observe(i));
      const G = (U, ae) => {
          let pe = -1,
            _e = 1 / 0;
          for (let J = 0; J < Cr.length; J++) {
            const le = Math.hypot(U - _[J].x, ae - _[J].y);
            le <= Math.max(P[J] + DJe, 24) && le < _e && ((_e = le), (pe = J));
          }
          return pe;
        },
        ee = (U, ae) => {
          let pe = -1,
            _e = q6;
          for (let J = 0; J < Pa.length; J++) {
            if (u.includes(J)) continue;
            const le = Math.hypot(U - N[J].x, ae - N[J].y);
            le <= _e && ((_e = le), (pe = J));
          }
          return pe;
        },
        oe = (U) => {
          const ae = s.getBoundingClientRect();
          return { x: U.clientX - ae.left, y: U.clientY - ae.top };
        },
        W = (U) => {
          if (E || D <= 0 || !p) return;
          U.preventDefault();
          const ae = oe(U),
            pe = G(ae.x, ae.y);
          if (!(pe < 0)) {
            ((v = pe),
              (y = u[pe]),
              (u[pe] = -1),
              (x = ae),
              (s.style.cursor = "grabbing"),
              e.current.hit(0.15));
            try {
              s.setPointerCapture(U.pointerId);
            } catch {}
          }
        },
        $ = (U) => {
          x = oe(U);
        },
        ne = () => {
          if (v < 0) return;
          const U = x ? ee(x.x, x.y) : -1;
          ((u[v] = U >= 0 ? U : y),
            (v = -1),
            (y = -1),
            (s.style.cursor = "grab"));
        },
        V = (U) => {
          ne();
          try {
            s.releasePointerCapture(U.pointerId);
          } catch {}
        },
        z = () => {
          v < 0 && (x = null);
        };
      (s.addEventListener("pointerdown", W),
        s.addEventListener("pointermove", $),
        s.addEventListener("pointerup", V),
        s.addEventListener("pointercancel", V),
        s.addEventListener("pointerleave", z));
      const te = (U) => {
        const ae = vs(U, 0, 1);
        (ae > R + 0.003 || (ae >= 1 && R < 1)) &&
          ((R = ae), e.current.onProgress(ae));
      };
      let K = 0,
        Q = performance.now(),
        X = !0;
      const he = (U) => {
        if (!a) return;
        K = requestAnimationFrame(he);
        const ae = X ? 0 : vs((U - Q) / 1e3, 0, 0.05);
        if (((X = !1), (Q = U), (k += ae), I(), D <= 0 || L <= 0)) return;
        const pe = Math.min((D / 2 - 38) / 1.78, L / 3.4),
          _e = D / 2,
          J = L * 0.09,
          le = 0.55 * pe,
          se = 0.95 * pe,
          ve = 0.42 * pe;
        for (let H = 0; H < Cr.length; H++)
          P[H] = 0.092 * pe * Math.sqrt(Cr[H]);
        const we = Zf(u),
          me = ax(we),
          j = X6(we),
          B = v < 0,
          fe = 1 - Math.exp(-3.5 * ae);
        for (let H = 0; H < 3; H++) f[H] = f[H] + ((E ? 0 : j[H]) - f[H]) * fe;
        if ((A > 0 && (A -= ae), !E && B)) {
          for (let H = 0; H < 3; H++) {
            const ie = Math.abs(we[H]);
            !h[H] && ie < za[H]
              ? ((h[H] = !0), A <= 0 && (e.current.hit(0.7), (A = 0.15)))
              : h[H] && ie > za[H] * 1.8 && (h[H] = !1);
          }
          (nk(we) ? (S += ae) : (S = 0),
            (T = Math.max(T, vs(1 - CC(me) / d, 0, 1))),
            te(0.9 * T + 0.1 * vs(S / ZM, 0, 1)),
            S >= ZM && ((E = !0), te(1), e.current.hit(1.5)));
        } else B || (S = 0);
        E && ((C += ae), !M && C >= 0.65 && ((M = !0), e.current.onSolved()));
        const be = E ? MJe(vs(C / 0.7, 0, 1)) : 0,
          Pe = E ? 1 : vs(S / ZM, 0, 1),
          re = vs(Pe * 0.55 + be, 0, 1),
          ue = [0, 0, 0];
        for (let H = 0; H < 3; H++)
          ue[H] =
            (f[H] + PJe[H] * Math.sin(k * IJe[H] + kJe[H]) * (1 - be)) * SJe;
        const de = { x: _e, y: J + le },
          Y = ue[0],
          ge = {
            x: de.x - dm * pe * Math.cos(Y),
            y: de.y - dm * pe * Math.sin(Y),
          },
          q = {
            x: de.x + dm * pe * Math.cos(Y),
            y: de.y + dm * pe * Math.sin(Y),
          },
          ce = [
            { x: ge.x, y: ge.y + se },
            { x: q.x, y: q.y + se },
          ];
        for (let H = 0; H < Pa.length; H++) {
          const ie = Pa[H],
            ye = ce[ie.bar - 1],
            Ae = ue[ie.bar];
          ((N[H].x = ye.x + ie.x * pe * Math.cos(Ae)),
            (N[H].y = ye.y + ie.x * pe * Math.sin(Ae)));
        }
        if (!p) {
          p = !0;
          for (let H = 0; H < Cr.length; H++) {
            const ie = u[H];
            ((_[H].x = N[ie].x), (_[H].y = N[ie].y + ve + P[H]));
          }
        }
        for (let H = 0; H < Cr.length; H++) {
          const ie = H === v;
          let ye, Ae;
          if (ie) {
            const Se = x ?? _[H];
            ((ye = vs(Se.x, 16, D - 16)), (Ae = vs(Se.y, 16, L - 16)));
          } else {
            const Se = u[H];
            ((ye = N[Se].x), (Ae = N[Se].y + ve + P[H]));
          }
          const ke = 1 - Math.exp(-(ie ? 18 : 9) * ae);
          ((_[H].x += (ye - _[H].x) * ke),
            (_[H].y += (Ae - _[H].y) * ke),
            (m[H] = m[H] + ((ie ? 1 : 0) - m[H]) * (1 - Math.exp(-14 * ae))));
        }
        ((w = E || v >= 0 || !x ? -1 : G(x.x, x.y)),
          v < 0 && (s.style.cursor = w >= 0 ? "grab" : "default"),
          o.clearRect(0, 0, D, L),
          (o.fillStyle = "rgb(5,15,29)"),
          o.fillRect(0, 0, D, L),
          (o.lineCap = "round"));
        for (let H = 0; H < 3; H++) {
          const ie = L * (0.3 + H * 0.22) + Math.sin(k * 0.21 + H * 2.3) * 9,
            ye = Math.sin(k * 0.29 + H * 1.6) * 20;
          ((o.strokeStyle = "rgba(36,86,138,0.10)"),
            (o.lineWidth = 8),
            o.beginPath(),
            o.moveTo(-12, ie),
            o.quadraticCurveTo(_e + ye, ie + (H % 2 ? 14 : -14), D + 12, ie),
            o.stroke());
        }
        const Te = (H) => {
            const ie = E ? 0 : vs(Math.abs(we[H]) / za[H] - 1, 0, 1);
            return [
              Math.round(ei(ei(55, 200, ie), 255, re)),
              Math.round(ei(ei(200, 205, ie), 220, re)),
              Math.round(ei(ei(232, 212, ie), 170, re)),
            ];
          },
          Re = (H, ie, ye, Ae) => {
            ((o.strokeStyle = `rgba(${ye[0]},${ye[1]},${ye[2]},${Ae.toFixed(3)})`),
              (o.lineWidth = 1),
              o.beginPath(),
              o.moveTo(H.x, H.y),
              o.lineTo(ie.x, ie.y),
              o.stroke());
          },
          Ce = (H, ie) => {
            const ye = ue[H],
              [Ae, ke] = TJe[H],
              Se = {
                x: ie.x + Ae * pe * Math.cos(ye),
                y: ie.y + Ae * pe * Math.sin(ye),
              },
              Ne = {
                x: ie.x + ke * pe * Math.cos(ye),
                y: ie.y + ke * pe * Math.sin(ye),
              },
              Oe = Te(H);
            (o.save(),
              (o.globalCompositeOperation = "lighter"),
              (o.strokeStyle = `rgba(${Oe[0]},${Oe[1]},${Oe[2]},${(0.14 + be * 0.2).toFixed(3)})`),
              (o.lineWidth = 6),
              o.beginPath(),
              o.moveTo(Se.x, Se.y),
              o.lineTo(Ne.x, Ne.y),
              o.stroke(),
              o.restore(),
              (o.strokeStyle = `rgba(${Oe[0]},${Oe[1]},${Oe[2]},0.85)`),
              (o.lineWidth = 2.5),
              o.beginPath(),
              o.moveTo(Se.x, Se.y),
              o.lineTo(Ne.x, Ne.y),
              o.stroke(),
              (o.fillStyle = `rgba(${Oe[0]},${Oe[1]},${Oe[2]},0.9)`),
              o.beginPath(),
              o.arc(ie.x, ie.y, 2.4, 0, Qc),
              o.fill());
          };
        ((o.strokeStyle = "rgba(120,160,200,0.4)"),
          (o.lineWidth = 2),
          o.beginPath(),
          o.moveTo(_e - 11, J),
          o.lineTo(_e + 11, J),
          o.stroke(),
          Re({ x: _e, y: J }, de, Te(0), 0.5),
          Ce(0, de),
          Re(ge, ce[0], Te(1), 0.5),
          Re(q, ce[1], Te(2), 0.5),
          Ce(1, ce[0]),
          Ce(2, ce[1]));
        for (let H = 0; H < Pa.length; H++) {
          const ie = N[H],
            ye = !u.includes(H),
            Ae = Te(Pa[H].bar);
          if (
            ((o.strokeStyle = `rgba(${Ae[0]},${Ae[1]},${Ae[2]},0.55)`),
            (o.lineWidth = 1.2),
            o.beginPath(),
            o.moveTo(ie.x, ie.y),
            o.lineTo(ie.x, ie.y + 5),
            o.stroke(),
            v >= 0 && ye && !E)
          ) {
            const ke = 0.4 + 0.3 * Math.sin(k * 3.4 + H * 1.9);
            (o.save(),
              (o.globalCompositeOperation = "lighter"),
              (o.fillStyle = `rgba(55,200,232,${ke.toFixed(3)})`),
              o.beginPath(),
              o.arc(ie.x, ie.y + 6, 2.6, 0, Qc),
              o.fill(),
              x &&
                Math.hypot(x.x - ie.x, x.y - ie.y) <= q6 &&
                ((o.strokeStyle = "rgba(55,200,232,0.7)"),
                (o.lineWidth = 1.5),
                o.beginPath(),
                o.arc(ie.x, ie.y + 6, 10, 0, Qc),
                o.stroke()),
              o.restore());
          } else
            ((o.fillStyle = `rgba(${Ae[0]},${Ae[1]},${Ae[2]},${ye ? 0.35 : 0.55})`),
              o.beginPath(),
              o.arc(ie.x, ie.y + 6, 1.8, 0, Qc),
              o.fill());
        }
        if (!E) {
          const H = Math.floor(k * 8);
          ((o.textAlign = "center"), (o.textBaseline = "middle"));
          const ie = [de, ce[0], ce[1]];
          for (let ye = 0; ye < 3; ye++) {
            const Ae = vs(Math.abs(we[ye]) / za[ye] - 1, 0, 1);
            if (Ae < 0.3) continue;
            const ke = ie[ye],
              Se = cQ((Math.imul(ye + 1, 2903) ^ Math.imul(H, 104729)) >>> 0),
              Ne = 2 + Math.round(Ae * 3);
            for (let Oe = 0; Oe < Ne; Oe++) {
              const Qe = (Se() - 0.5) * 26,
                at = (Se() - 0.5) * 18 - 4,
                Fe = Se() < 0.5 ? "0" : "1",
                We = (0.2 + Se() * 0.4) * Ae,
                tn = 7 + Se() * 2;
              ((o.font = `${tn.toFixed(1)}px ui-monospace, SFMono-Regular, Menlo, monospace`),
                (o.fillStyle = `rgba(200,205,212,${We.toFixed(3)})`),
                o.fillText(Fe, ke.x + Qe, ke.y + at));
            }
          }
        }
        for (let H = 0; H < Cr.length; H++) {
          if (H === v) continue;
          const ie = u[H];
          Re(
            N[ie],
            { x: _[H].x, y: _[H].y - P[H] * 0.9 },
            Te(Pa[ie].bar),
            0.45,
          );
        }
        const Ie = Cr.map((H, ie) => ie).sort((H, ie) => m[H] - m[ie]);
        for (const H of Ie) {
          const ie = _[H],
            ye = P[H],
            Ae = m[H];
          if ((o.save(), Ae > 0.02)) {
            o.globalCompositeOperation = "lighter";
            const Ne = o.createRadialGradient(
              ie.x,
              ie.y,
              0,
              ie.x,
              ie.y,
              ye * 2.1,
            );
            (Ne.addColorStop(0, `rgba(55,200,232,${(0.28 * Ae).toFixed(3)})`),
              Ne.addColorStop(1, "rgba(55,200,232,0)"),
              (o.fillStyle = Ne),
              o.beginPath(),
              o.arc(ie.x, ie.y, ye * 2.1, 0, Qc),
              o.fill(),
              (o.globalCompositeOperation = "source-over"));
          }
          o.beginPath();
          const ke = 34;
          for (let Ne = 0; Ne <= ke; Ne++) {
            const Oe = (Ne / ke) * Qc,
              Qe =
                1 +
                0.055 * Math.sin(3 * Oe + k * 0.5 + H * 2.4) +
                0.038 * Math.sin(5 * Oe - k * 0.37 + H * 1.7),
              at = ye * Qe * (1 + Ae * 0.06),
              Fe = ie.x + Math.cos(Oe) * at,
              We = ie.y + Math.sin(Oe) * at;
            Ne === 0 ? o.moveTo(Fe, We) : o.lineTo(Fe, We);
          }
          o.closePath();
          const Se = o.createRadialGradient(
            ie.x - ye * 0.25,
            ie.y - ye * 0.3,
            ye * 0.1,
            ie.x,
            ie.y,
            ye * 1.15,
          );
          (Se.addColorStop(
            0,
            `rgba(${Math.round(ei(60, 255, re))},${Math.round(ei(116, 226, re))},${Math.round(ei(190, 180, re))},0.9)`,
          ),
            Se.addColorStop(
              1,
              `rgba(${Math.round(ei(16, 120, re))},${Math.round(ei(40, 96, re))},${Math.round(ei(78, 70, re))},0.92)`,
            ),
            (o.fillStyle = Se),
            o.fill(),
            (o.strokeStyle = `rgba(${Math.round(ei(108, 255, re))},${Math.round(ei(168, 224, re))},${Math.round(ei(232, 176, re))},${(0.55 + Ae * 0.3).toFixed(3)})`),
            (o.lineWidth = 1.4),
            o.stroke(),
            H === w &&
              ((o.strokeStyle = "rgba(55,200,232,0.45)"),
              (o.lineWidth = 1.5),
              o.beginPath(),
              o.arc(ie.x, ie.y, ye + 5, 0, Qc),
              o.stroke()),
            o.restore());
        }
        if (E) {
          const H = de.y + se,
            ie = o.createRadialGradient(_e, H, 0, _e, H, Math.max(D, L) * 0.62);
          (ie.addColorStop(0, `rgba(255,222,170,${(be * 0.26).toFixed(3)})`),
            ie.addColorStop(1, "rgba(255,222,170,0)"),
            o.save(),
            (o.globalCompositeOperation = "lighter"),
            (o.fillStyle = ie),
            o.fillRect(0, 0, D, L),
            o.restore());
        }
      };
      return (
        (K = requestAnimationFrame(he)),
        () => {
          ((a = !1),
            cancelAnimationFrame(K),
            F?.disconnect(),
            s.removeEventListener("pointerdown", W),
            s.removeEventListener("pointermove", $),
            s.removeEventListener("pointerup", V),
            s.removeEventListener("pointercancel", V),
            s.removeEventListener("pointerleave", z));
        }
      );
    }, []),
    jsx.jsx("div", {
      ref: n,
      "data-game": "balance",
      className: "relative h-full w-full",
      style: { background: "rgb(5,15,29)" },
      children: jsx.jsx("canvas", {
        ref: r,
        className: "absolute inset-0 h-full w-full",
        style: { display: "block", touchAction: "none" },
      }),
    })
  );
}
export const DATASEA_GAME_COMPONENTS = { steady: RKe, resonance: eYe, current: vYe, relay: PYe, echo: OYe, denoise: YYe, discern: iZe, ripple: pZe, sweep: CZe, unknot: jZe, lure: vJe, balance: OJe };
