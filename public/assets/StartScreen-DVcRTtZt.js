import { j as e } from "./index-CyHAbkO5.js";
import { r as c, u as d } from "./i18n-DtIC1LRi.js";
import {
  u as S,
  a as N,
  b as k,
  c as C,
  m as n,
  A as E,
  p as D,
  d as z,
} from "./NormalApp-Cn6agT0F.js";
import {
  d as F,
  I as T,
  F as o,
  M as R,
  P as B,
  a as t,
  S as I,
  b as P,
  C as W,
  W as O,
  D as $,
} from "./moleskineComponents-DxZW-ZrL.js";
import { P as A } from "./HelpOverlay-DERW7xRx.js";
const H = [120, 180, 300];
function M({ isOpen: a = !1 }) {
  return e.jsxs(n.div, {
    className: "absolute inset-0 pointer-events-none z-30",
    initial: !1,
    animate: { opacity: a ? 0 : 1, x: a ? 120 : 0, scaleX: a ? 1.2 : 1 },
    transition: { duration: 0.4, ease: a ? [0.4, 0, 0.2, 1] : [0.68, -0.55, 0.27, 1.55] },
    children: [
      e.jsx("div", {
        className: "absolute top-0 bottom-0 w-[14px]",
        style: {
          right: "24px",
          background: `linear-gradient(90deg,
            ${t.elasticDark} 0%,
            ${t.elastic} 30%,
            ${t.elasticHighlight} 50%,
            ${t.elastic} 70%,
            ${t.elasticDark} 100%
          )`,
          borderRadius: "2px",
          boxShadow: `
            -2px 0 4px rgba(0,0,0,0.2),
            2px 0 4px rgba(0,0,0,0.2),
            inset 0 1px 0 rgba(255,255,255,0.2)
          `,
        },
      }),
      e.jsx("div", {
        className: "absolute top-[-2px] h-[6px]",
        style: {
          right: "24px",
          width: "14px",
          background: t.elasticDark,
          borderRadius: "2px 2px 0 0",
        },
      }),
      e.jsx("div", {
        className: "absolute bottom-[-2px] h-[6px]",
        style: {
          right: "24px",
          width: "14px",
          background: t.elasticDark,
          borderRadius: "0 0 2px 2px",
        },
      }),
    ],
  });
}
function L({ children: a }) {
  return e.jsxs("div", {
    className: "relative",
    children: [
      e.jsx("span", {
        className: "absolute inset-0 select-none",
        style: { color: "rgba(0, 0, 0, 0.5)", transform: "translate(1px, 1px)" },
        children: a,
      }),
      e.jsx("span", {
        className: "relative select-none",
        style: {
          background: "linear-gradient(135deg, #D4A84B 0%, #F5D88E 45%, #C9963C 55%, #E8C56E 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          filter: "drop-shadow(0 0 1px rgba(212, 168, 75, 0.3))",
        },
        children: a,
      }),
    ],
  });
}
function G({ durationSec: a, setDurationSec: r }) {
  const { t: s } = d();
  return e.jsx(n.div, {
    initial: { opacity: 0, x: 30, rotate: 5 },
    animate: { opacity: 1, x: 0, rotate: 2 },
    exit: { opacity: 0, x: 30, rotate: 5 },
    transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] },
    className: "absolute left-full top-16 ml-9 max-xl:ml-2",
    style: { width: "160px" },
    children: e.jsxs("div", {
      className: "rounded-[2px] p-4 relative",
      style: {
        background: t.washiYellow,
        boxShadow: `
            4px 4px 12px rgba(0,0,0,0.25),
            inset 0 0 30px rgba(255,255,255,0.3)
          `,
      },
      children: [
        e.jsx("div", {
          className: "absolute -top-2 left-1/2 -translate-x-1/2 w-12 h-4",
          style: {
            background: "rgba(255,255,255,0.5)",
            transform: "translateX(-50%) rotate(-1deg)",
            boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
          },
        }),
        e.jsx("div", {
          className: "absolute bottom-0 right-0 w-6 h-6",
          style: { background: "linear-gradient(135deg, transparent 50%, rgba(0,0,0,0.08) 50%)" },
        }),
        e.jsx("p", {
          className: "text-center mb-3",
          style: { color: t.graphite, fontFamily: o.handwriting, fontSize: "15px" },
          children: s("pictionary.start.sessionDuration"),
        }),
        e.jsx("div", {
          className: "flex flex-col items-center gap-1",
          children: H.map((i) => {
            const p = a === i,
              m = i / 60;
            return e.jsxs(
              n.button,
              {
                onClick: () => r(i),
                className: "relative px-4 py-1.5 w-full",
                style: {
                  color: t.graphite,
                  fontFamily: o.handwriting,
                  fontSize: "18px",
                  fontWeight: 600,
                },
                whileHover: { scale: 1.03 },
                whileTap: { scale: 0.97 },
                children: [
                  p &&
                    e.jsxs("svg", {
                      viewBox: "0 0 80 30",
                      className: "absolute inset-0",
                      style: { width: "100%", height: "100%" },
                      preserveAspectRatio: "none",
                      children: [
                        e.jsx("ellipse", {
                          cx: "40",
                          cy: "15",
                          rx: "36",
                          ry: "12",
                          fill: "none",
                          stroke: t.graphite,
                          strokeWidth: "2",
                          strokeDasharray: "2,3",
                          style: { filter: "url(#wobbly)" },
                        }),
                        e.jsx("defs", {
                          children: e.jsxs("filter", {
                            id: "wobbly",
                            children: [
                              e.jsx("feTurbulence", { baseFrequency: "0.02", numOctaves: "2" }),
                              e.jsx("feDisplacementMap", { in: "SourceGraphic", scale: "2" }),
                            ],
                          }),
                        }),
                      ],
                    }),
                  m,
                  " ",
                  s("pictionary.start.min"),
                ],
              },
              i,
            );
          }),
        }),
      ],
    }),
  });
}
function X() {
  const { t: a } = d(),
    r = [
      {
        title: a("pictionary.modes.draw"),
        desc: a("pictionary.modes.drawDesc"),
        Icon: I,
        tapeColor: t.washiMint,
        tapeRotation: -3,
      },
      {
        title: a("pictionary.modes.guess"),
        desc: a("pictionary.modes.guessDesc"),
        Icon: P,
        tapeColor: t.washiPink,
        tapeRotation: 2,
      },
    ];
  return e.jsxs("div", {
    className: "flex gap-3 relative",
    style: { marginBottom: "clamp(10px, 2.2vh, 16px)" },
    children: [
      e.jsx(W, { className: "absolute -top-4 left-1/2 -translate-x-1/2 z-0", size: 70 }),
      r.map((s, i) =>
        e.jsxs(
          n.div,
          {
            className: "flex-1 p-3 pt-5 rounded-[4px] relative overflow-visible",
            style: {
              background: t.paper,
              boxShadow: `
              0 2px 8px rgba(0,0,0,0.1),
              inset 0 0 40px rgba(0,0,0,0.02)
            `,
            },
            initial: { opacity: 0, y: 12, rotate: i === 0 ? -1 : 1 },
            animate: { opacity: 1, y: 0, rotate: i === 0 ? -0.5 : 0.5 },
            transition: { delay: 0.2 + i * 0.1 },
            children: [
              e.jsx(O, {
                color: s.tapeColor,
                rotation: s.tapeRotation,
                width: 50,
                className: "absolute -top-2 left-1/2 -translate-x-1/2 z-10",
              }),
              e.jsx("div", {
                className: "absolute inset-0 pointer-events-none rounded-[4px]",
                style: {
                  backgroundImage: `radial-gradient(${t.dotGrid} 1px, transparent 1px)`,
                  backgroundSize: "12px 12px",
                  backgroundPosition: "6px 6px",
                },
              }),
              e.jsx($, { position: i === 0 ? "top-right" : "bottom-right" }),
              e.jsxs("div", {
                className: "relative z-10",
                children: [
                  e.jsx(s.Icon, { className: "w-8 h-8 mb-2", style: { color: t.graphite } }),
                  e.jsx("p", {
                    className: "text-sm font-semibold mb-1",
                    style: { color: t.graphite, fontFamily: o.handwriting, fontSize: "16px" },
                    children: s.title,
                  }),
                  e.jsx("p", {
                    className: "text-[11px] leading-relaxed",
                    style: { color: t.graphiteLight },
                    children: s.desc,
                  }),
                ],
              }),
            ],
          },
          s.title,
        ),
      ),
    ],
  });
}
function q({ onClick: a, showStart: r }) {
  const { t: s } = d();
  return e.jsxs(n.button, {
    onClick: a,
    className: "w-full rounded-[4px] relative overflow-hidden",
    style: {
      paddingBlock: "clamp(11px, 2.2vh, 16px)",
      background: t.elastic,
      boxShadow: `
          0 3px 0 ${t.elasticDark},
          0 6px 16px rgba(194, 59, 34, 0.35)
        `,
    },
    whileHover: {
      scale: 1.01,
      y: -1,
      boxShadow: `
          0 4px 0 ${t.elasticDark},
          0 8px 20px rgba(194, 59, 34, 0.4)
        `,
    },
    whileTap: {
      scale: 0.99,
      y: 1,
      boxShadow: `
          0 1px 0 ${t.elasticDark},
          0 2px 8px rgba(194, 59, 34, 0.3)
        `,
    },
    children: [
      e.jsx("div", {
        className: "absolute inset-0 pointer-events-none opacity-20",
        style: {
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='f'%3E%3CfeTurbulence baseFrequency='0.5' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23f)'/%3E%3C/svg%3E")`,
        },
      }),
      e.jsx("span", {
        className: "relative z-10 flex items-center justify-center gap-2 text-white",
        style: {
          fontFamily: '"Caveat", cursive, Georgia, serif',
          fontSize: "20px",
          fontWeight: 600,
          letterSpacing: "0.02em",
          textShadow: "0 2px 3px rgba(0,0,0,0.25)",
        },
        children: r
          ? e.jsxs(e.Fragment, { children: [s("pictionary.start.startSession"), " →"] })
          : e.jsxs(e.Fragment, { children: ["→ ", s("pictionary.start.play")] }),
      }),
    ],
  });
}
const Q = c.memo(function ({ navigate: r }) {
  const { t: s, i18n: i } = d(),
    { setWindowStyle: p } = S(),
    m = N("pictionary"),
    b = k("pictionary"),
    u = C("pictionary"),
    [l, g] = c.useState(!1),
    [v, h] = c.useState(!1),
    [y, w] = c.useState(180);
  c.useEffect(() => (p({ titleBarBackground: "#0C0C0C" }), () => p(null)), [p]);
  const f = b?.gameState ?? null;
  c.useEffect(() => {
    const x = u?.getHeadSnapshot()?.state;
    F(f, x ? x.gameState : void 0) === "game" && r("game");
  }, [f, r, u]);
  const j = async () => {
    if (!l) {
      g(!0);
      return;
    }
    if (!m) {
      console.warn("[PictionaryStart] Start pressed before runtime ready — ignoring");
      return;
    }
    D("partygames-session-start");
    try {
      (await z("pictionary", {
        type: "startSession",
        atMs: Date.now(),
        settings: { sessionDurationMs: y * 1e3, locale: i.language === "zh-CN" ? "zh-CN" : "en" },
      }),
        r("game"));
    } catch (x) {
      console.warn("[StartScreen] Failed to start session:", x);
    }
  };
  return e.jsxs("div", {
    className: "relative h-full flex flex-col items-center justify-center overflow-hidden",
    style: { background: "radial-gradient(ellipse at center, #1A1A1A 0%, #0C0C0C 100%)" },
    children: [
      e.jsx("div", {
        className: "absolute inset-0 pointer-events-none opacity-40",
        style: {
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='wood'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.03' numOctaves='4' result='noise'/%3E%3CfeDiffuseLighting in='noise' lighting-color='%23181818' surfaceScale='2'%3E%3CfeDistantLight azimuth='45' elevation='50'/%3E%3C/feDiffuseLighting%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23wood)'/%3E%3C/svg%3E")`,
        },
      }),
      e.jsx(T, { className: "absolute bottom-12 left-12 w-8 h-8" }),
      e.jsx(n.button, {
        onClick: () => h(!0),
        "aria-label": s("pictionary.help.button"),
        className:
          "absolute top-6 right-6 z-20 flex h-9 w-9 items-center justify-center rounded-full",
        style: {
          border: "1.5px dashed rgba(255,255,255,0.35)",
          color: "rgba(255,255,255,0.55)",
          fontFamily: o.handwriting,
          fontSize: 18,
          fontWeight: 700,
          transform: "rotate(6deg)",
        },
        whileHover: {
          scale: 1.1,
          color: "rgba(255,255,255,0.85)",
          borderColor: "rgba(255,255,255,0.6)",
        },
        whileTap: { scale: 0.92 },
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        transition: { delay: 0.5 },
        children: "?",
      }),
      e.jsx(n.div, {
        initial: { opacity: 0, y: 30 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.6, ease: [0.4, 0, 0.2, 1] },
        className: "relative z-10 w-full max-w-[440px] px-4",
        children: e.jsxs("div", {
          className: `relative transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${l ? "-translate-x-[100px] max-xl:-translate-x-[84px]" : ""}`,
          children: [
            e.jsx(R, {
              isOpen: l,
              children: e.jsxs("div", {
                className: "relative",
                style: {
                  padding: "clamp(14px, calc(6.2vh - 12.6px), 32px)",
                  minHeight: "min(580px, calc(100vh - 140px))",
                },
                children: [
                  e.jsx(M, { isOpen: l }),
                  e.jsxs("div", {
                    className: "relative z-10",
                    children: [
                      e.jsxs("div", {
                        className: "text-center",
                        style: {
                          paddingTop: "clamp(8px, calc(9.6vh - 29.1px), 40px)",
                          paddingBottom: "clamp(8px, calc(7.7vh - 23.4px), 32px)",
                        },
                        children: [
                          e.jsx(L, {
                            children: e.jsx("h1", {
                              style: {
                                fontFamily: o.display,
                                fontSize: "clamp(22px, 4.2vh, 30px)",
                                fontWeight: 600,
                                letterSpacing: "0.15em",
                                textTransform: "uppercase",
                              },
                              children: s("pictionary.title"),
                            }),
                          }),
                          e.jsx(n.div, {
                            className: "flex justify-center",
                            style: { marginTop: "clamp(8px, 2.2vh, 16px)" },
                            initial: { opacity: 0, scaleX: 0 },
                            animate: { opacity: 1, scaleX: 1 },
                            transition: { delay: 0.4, duration: 0.3 },
                            children: e.jsx(B, { width: 160 }),
                          }),
                          e.jsx(n.p, {
                            className: "text-sm",
                            style: {
                              marginTop: "clamp(8px, 2.2vh, 16px)",
                              color: "rgba(255,255,255,0.35)",
                              fontFamily: o.display,
                              fontStyle: "italic",
                              letterSpacing: "0.05em",
                            },
                            initial: { opacity: 0 },
                            animate: { opacity: 1 },
                            transition: { delay: 0.3 },
                            children: s("pictionary.subtitle"),
                          }),
                        ],
                      }),
                      e.jsx(X, {}),
                      e.jsx("div", {
                        className: "mt-4",
                        children: e.jsx(q, { onClick: j, showStart: l }),
                      }),
                      l &&
                        e.jsxs(n.button, {
                          onClick: () => g(!1),
                          className: "w-full py-2.5 mt-3 rounded-[4px] text-sm",
                          style: {
                            color: "rgba(255,255,255,0.4)",
                            fontFamily: o.handwriting,
                            fontSize: "16px",
                          },
                          initial: { opacity: 0 },
                          animate: { opacity: 1 },
                          whileHover: { color: "rgba(255,255,255,0.6)" },
                          children: ["← ", s("pictionary.start.back")],
                        }),
                    ],
                  }),
                ],
              }),
            }),
            e.jsx(E, { children: l && e.jsx(G, { durationSec: y, setDurationSec: w }) }),
          ],
        }),
      }),
      e.jsx(A, { open: v, onClose: () => h(!1) }),
    ],
  });
});
export { Q as StartScreen };
