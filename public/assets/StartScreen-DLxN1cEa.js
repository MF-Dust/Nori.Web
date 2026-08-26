import { j as e } from "./index-CyHAbkO5.js";
import { r as p, u as k } from "./i18n-DtIC1LRi.js";
import { e as h, u as M, c as F, m as i, A as y, t as w } from "./NormalApp-Cn6agT0F.js";
import { d as G } from "./deriveScreen-CBWfbwMk.js";
import { u as T } from "./useCompactHeight-CNibAkHL.js";
import { C as B } from "./HelpOverlay-D485oIXH.js";
const t = {
    canopy: "#1a2418",
    moss: "#4a5a40",
    leaf: "#7ab55c",
    gold: "#d4a853",
    goldLight: "#f0d78c",
    amber: "#c98b2e",
    berry: "#e85d75",
    cream: "#f5f0e6",
    bark: "#5c4a3d",
  },
  O = `
@import url('/fonts.css');
`;
function I() {
  return e.jsxs("div", {
    className: "absolute inset-0 overflow-hidden",
    children: [
      e.jsx("div", {
        className: "absolute inset-0",
        style: {
          background: `linear-gradient(180deg, 
            hsl(160, 35%, 8%) 0%, 
            hsl(155, 40%, 10%) 30%,
            hsl(150, 35%, 12%) 60%,
            hsl(145, 30%, 8%) 100%
          )`,
        },
      }),
      e.jsxs("svg", {
        className: "absolute bottom-0 w-full",
        style: { height: "70%" },
        viewBox: "0 0 800 300",
        preserveAspectRatio: "xMidYMax slice",
        children: [
          e.jsxs("defs", {
            children: [
              e.jsxs("linearGradient", {
                id: "farTreeGrad",
                x1: "0%",
                y1: "0%",
                x2: "0%",
                y2: "100%",
                children: [
                  e.jsx("stop", { offset: "0%", stopColor: "hsl(155, 30%, 18%)" }),
                  e.jsx("stop", { offset: "100%", stopColor: "hsl(155, 35%, 10%)" }),
                ],
              }),
              e.jsxs("linearGradient", {
                id: "midTreeGrad",
                x1: "0%",
                y1: "0%",
                x2: "0%",
                y2: "100%",
                children: [
                  e.jsx("stop", { offset: "0%", stopColor: "hsl(150, 35%, 14%)" }),
                  e.jsx("stop", { offset: "100%", stopColor: "hsl(150, 40%, 8%)" }),
                ],
              }),
              e.jsxs("linearGradient", {
                id: "nearTreeGrad",
                x1: "0%",
                y1: "0%",
                x2: "0%",
                y2: "100%",
                children: [
                  e.jsx("stop", { offset: "0%", stopColor: t.moss }),
                  e.jsx("stop", { offset: "100%", stopColor: t.canopy }),
                ],
              }),
            ],
          }),
          e.jsx("path", {
            d: "M0 300 L0 180 Q100 140 200 160 Q300 120 400 150 Q500 100 600 140 Q700 110 800 150 L800 300 Z",
            fill: "url(#farTreeGrad)",
            opacity: "0.5",
          }),
          e.jsx("path", {
            d: "M0 300 L0 200 L40 200 L60 150 L80 200 L120 200 L150 120 L180 200 L220 200 L250 160 L280 200 L320 200 L360 130 L400 200 L440 200 L470 170 L500 200 L540 200 L580 140 L620 200 L660 200 L700 160 L740 200 L780 200 L800 180 L800 300 Z",
            fill: "url(#midTreeGrad)",
            opacity: "0.7",
          }),
          e.jsx("path", {
            d: "M0 300 L0 240 L30 240 L50 180 L45 180 L70 120 L65 120 L90 60 L115 120 L110 120 L135 180 L130 180 L150 240 L200 240 L220 190 L215 190 L245 130 L240 130 L270 70 L300 130 L295 130 L325 190 L320 190 L340 240 L400 240 L420 200 L415 200 L440 150 L435 150 L465 90 L495 150 L490 150 L515 200 L510 200 L530 240 L580 240 L600 210 L595 210 L620 160 L615 160 L640 110 L665 160 L660 160 L685 210 L680 210 L700 240 L750 240 L770 200 L765 200 L790 150 L815 200 L810 200 L830 240 L830 300 Z",
            fill: "url(#nearTreeGrad)",
          }),
        ],
      }),
      e.jsx("div", {
        className: "absolute bottom-0 left-0 right-0 h-24",
        style: {
          background: "linear-gradient(180deg, transparent 0%, hsla(150, 30%, 12%, 0.6) 100%)",
        },
      }),
    ],
  });
}
function z() {
  const c = p.useMemo(
    () =>
      Array.from({ length: 18 }, (s, a) => ({
        id: a,
        x: 5 + Math.random() * 90,
        y: 10 + Math.random() * 70,
        size: 2 + Math.random() * 3,
        delay: Math.random() * 4,
        duration: 3 + Math.random() * 3,
        drift: 10 + Math.random() * 20,
      })),
    [],
  );
  return e.jsx("div", {
    className: "absolute inset-0 overflow-hidden pointer-events-none",
    children: c.map((s) =>
      e.jsx(
        i.div,
        {
          className: "absolute rounded-full",
          style: {
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: s.size,
            height: s.size,
            background: `radial-gradient(circle, ${t.goldLight} 0%, ${t.gold}80 40%, transparent 70%)`,
            boxShadow: `0 0 ${s.size * 4}px ${s.size}px ${t.gold}60`,
          },
          animate: {
            opacity: [0.2, 1, 0.2],
            scale: [0.6, 1.3, 0.6],
            x: [0, s.drift, 0],
            y: [0, -s.drift * 0.6, 0],
          },
          transition: { duration: s.duration, delay: s.delay, repeat: 1 / 0, ease: "easeInOut" },
        },
        s.id,
      ),
    ),
  });
}
function A() {
  return e.jsxs("div", {
    className: "absolute inset-4 pointer-events-none",
    children: [
      e.jsxs("svg", {
        className: "absolute inset-0 w-full h-full",
        preserveAspectRatio: "none",
        children: [
          e.jsx("defs", {
            children: e.jsxs("linearGradient", {
              id: "vineBorder",
              x1: "0%",
              y1: "0%",
              x2: "100%",
              y2: "100%",
              children: [
                e.jsx("stop", { offset: "0%", stopColor: t.leaf, stopOpacity: "0.4" }),
                e.jsx("stop", { offset: "50%", stopColor: t.gold, stopOpacity: "0.3" }),
                e.jsx("stop", { offset: "100%", stopColor: t.leaf, stopOpacity: "0.4" }),
              ],
            }),
          }),
          e.jsx("rect", {
            x: "1",
            y: "1",
            width: "calc(100% - 2px)",
            height: "calc(100% - 2px)",
            rx: "16",
            fill: "none",
            stroke: "url(#vineBorder)",
            strokeWidth: "2",
            strokeDasharray: "8 4",
          }),
        ],
      }),
      [
        { pos: "top-0 left-0", rotate: 0 },
        { pos: "top-0 right-0", rotate: 90 },
        { pos: "bottom-0 right-0", rotate: 180 },
        { pos: "bottom-0 left-0", rotate: 270 },
      ].map(({ pos: c, rotate: s }, a) =>
        e.jsxs(
          "svg",
          {
            className: `absolute ${c} w-12 h-12`,
            style: { transform: `rotate(${s}deg)` },
            viewBox: "0 0 48 48",
            children: [
              e.jsx("path", {
                d: "M4 4 Q4 20 20 24 Q10 20 8 12 Q12 18 20 18 Q8 16 4 4",
                fill: t.leaf,
                opacity: "0.6",
              }),
              e.jsx("circle", { cx: "8", cy: "8", r: "2", fill: t.gold, opacity: "0.8" }),
            ],
          },
          a,
        ),
      ),
    ],
  });
}
function W({ compact: c }) {
  return e.jsxs(i.div, {
    initial: { scale: 0, rotate: -180 },
    animate: { scale: 1, rotate: 0 },
    transition: { delay: 0.2, type: "spring", stiffness: 100, damping: 12 },
    className: "relative",
    children: [
      e.jsxs("svg", {
        viewBox: "0 0 120 120",
        className: c ? "w-20 h-20" : "w-28 h-28",
        children: [
          e.jsxs("defs", {
            children: [
              e.jsxs("radialGradient", {
                id: "compassBg",
                cx: "50%",
                cy: "50%",
                r: "50%",
                children: [
                  e.jsx("stop", { offset: "0%", stopColor: t.goldLight }),
                  e.jsx("stop", { offset: "70%", stopColor: t.gold }),
                  e.jsx("stop", { offset: "100%", stopColor: t.amber }),
                ],
              }),
              e.jsxs("radialGradient", {
                id: "compassInner",
                cx: "50%",
                cy: "50%",
                r: "50%",
                children: [
                  e.jsx("stop", { offset: "0%", stopColor: t.cream }),
                  e.jsx("stop", { offset: "100%", stopColor: "#e8dcc8" }),
                ],
              }),
              e.jsx("filter", {
                id: "compassShadow",
                children: e.jsx("feDropShadow", {
                  dx: "0",
                  dy: "4",
                  stdDeviation: "6",
                  floodColor: t.canopy,
                  floodOpacity: "0.5",
                }),
              }),
            ],
          }),
          e.jsx("circle", {
            cx: "60",
            cy: "60",
            r: "56",
            fill: "url(#compassBg)",
            filter: "url(#compassShadow)",
          }),
          e.jsx("circle", {
            cx: "60",
            cy: "60",
            r: "52",
            fill: "none",
            stroke: t.amber,
            strokeWidth: "2",
            opacity: "0.5",
          }),
          Array.from({ length: 8 }).map((s, a) => {
            const l = (a * 45 * Math.PI) / 180,
              r = 60 + Math.cos(l) * 48,
              d = 60 + Math.sin(l) * 48,
              x = 60 + Math.cos(l) * 54,
              o = 60 + Math.sin(l) * 54;
            return e.jsx(
              "line",
              {
                x1: r,
                y1: d,
                x2: x,
                y2: o,
                stroke: t.bark,
                strokeWidth: a % 2 === 0 ? 3 : 1.5,
                strokeLinecap: "round",
              },
              a,
            );
          }),
          e.jsx("circle", { cx: "60", cy: "60", r: "42", fill: "url(#compassInner)" }),
          e.jsx("circle", {
            cx: "60",
            cy: "60",
            r: "40",
            fill: "none",
            stroke: t.gold,
            strokeWidth: "1.5",
          }),
          e.jsxs("g", {
            transform: "translate(60, 60)",
            children: [
              e.jsx("polygon", { points: "0,-32 4,-8 0,-12 -4,-8", fill: t.berry }),
              e.jsx("polygon", { points: "0,32 4,8 0,12 -4,8", fill: t.moss }),
              e.jsx("polygon", { points: "-32,0 -8,4 -12,0 -8,-4", fill: t.moss }),
              e.jsx("polygon", { points: "32,0 8,4 12,0 8,-4", fill: t.moss }),
              [45, 135, 225, 315].map((s) => {
                const a = (s * Math.PI) / 180;
                return e.jsx(
                  "polygon",
                  {
                    points: `${Math.cos(a) * 24},${Math.sin(a) * 24} ${Math.cos(a + 0.15) * 8},${Math.sin(a + 0.15) * 8} ${Math.cos(a - 0.15) * 8},${Math.sin(a - 0.15) * 8}`,
                    fill: t.gold,
                    opacity: "0.7",
                  },
                  s,
                );
              }),
              e.jsx("circle", { r: "6", fill: t.gold }),
              e.jsx("circle", { r: "4", fill: t.goldLight }),
              e.jsx("circle", { r: "2", fill: "white", opacity: "0.8" }),
            ],
          }),
          e.jsx("text", {
            x: "60",
            y: "28",
            textAnchor: "middle",
            fill: t.bark,
            fontSize: "10",
            fontWeight: "bold",
            fontFamily: "Crimson Pro",
            children: "N",
          }),
        ],
      }),
      e.jsx(i.div, {
        className: "absolute inset-0 rounded-full",
        style: { background: `radial-gradient(circle, ${t.gold}30 0%, transparent 70%)` },
        animate: { scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] },
        transition: { duration: 3, repeat: 1 / 0, ease: "easeInOut" },
      }),
    ],
  });
}
function P({ tokens: c, setTokens: s, compact: a }) {
  const { t: l } = k(),
    r = [
      { value: 11, label: l("codenames.difficulty.easy") },
      { value: 10, label: l("codenames.difficulty.normal") },
      { value: 9, label: l("codenames.difficulty.hard") },
    ];
  return e.jsxs("div", {
    className: a ? "w-full space-y-2" : "w-full space-y-3",
    children: [
      e.jsx("div", {
        className: "text-xs uppercase tracking-[0.2em] text-center",
        style: { color: t.gold, fontFamily: "'Crimson Pro', serif" },
        children: l("codenames.difficulty.label"),
      }),
      e.jsx("div", {
        className: "flex gap-2",
        children: r.map(({ value: d, label: x }) => {
          const o = c === d;
          return e.jsxs(
            i.button,
            {
              onClick: () => s(d),
              className: `flex-1 ${a ? "py-2" : "py-3"} px-2 rounded-lg relative overflow-hidden transition-colors`,
              style: {
                background: o
                  ? `linear-gradient(135deg, ${t.moss} 0%, ${t.canopy} 100%)`
                  : "rgba(0, 0, 0, 0.3)",
                border: o ? `2px solid ${t.gold}80` : "2px solid rgba(255, 255, 255, 0.1)",
                boxShadow: o ? `0 4px 20px ${t.gold}30, inset 0 1px 0 ${t.leaf}40` : "none",
              },
              whileHover: { scale: 1.02 },
              whileTap: { scale: 0.98 },
              children: [
                o &&
                  e.jsx(i.div, {
                    className: "absolute inset-0",
                    style: {
                      background: `radial-gradient(circle at 50% 0%, ${t.gold}20 0%, transparent 70%)`,
                    },
                    layoutId: "activeGlow",
                  }),
                e.jsxs("div", {
                  className: "relative",
                  children: [
                    e.jsx("div", {
                      className: "text-sm font-semibold",
                      style: {
                        color: o ? t.cream : "rgba(255, 255, 255, 0.6)",
                        fontFamily: "'Fredoka', sans-serif",
                      },
                      children: x,
                    }),
                    e.jsx("div", {
                      className: "text-[10px] mt-0.5",
                      style: { color: o ? t.gold : "rgba(255, 255, 255, 0.4)" },
                      children: l("codenames.difficulty.tokens", { count: d }),
                    }),
                  ],
                }),
              ],
            },
            d,
          );
        }),
      }),
    ],
  });
}
function u({ onClick: c, children: s, variant: a = "primary", compact: l }) {
  const r = a === "primary";
  return e.jsxs(i.button, {
    onClick: c,
    className: `w-full ${l ? "py-2.5" : "py-3.5"} px-6 rounded-xl relative overflow-hidden font-semibold text-base`,
    style: {
      background: r
        ? `linear-gradient(135deg, ${t.leaf} 0%, #5a9a40 50%, ${t.moss} 100%)`
        : "transparent",
      border: r ? `2px solid ${t.leaf}` : `2px solid ${t.moss}`,
      color: r ? t.cream : t.leaf,
      fontFamily: "'Fredoka', sans-serif",
      boxShadow: r ? `0 6px 24px ${t.leaf}40, inset 0 1px 0 ${t.goldLight}30` : "none",
    },
    whileHover: {
      scale: 1.02,
      boxShadow: r
        ? `0 8px 32px ${t.leaf}50, inset 0 1px 0 ${t.goldLight}40`
        : `0 4px 16px ${t.moss}30`,
    },
    whileTap: { scale: 0.98 },
    children: [
      r &&
        e.jsx(i.div, {
          className: "absolute inset-0",
          style: {
            background:
              "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.15) 50%, transparent 60%)",
          },
          animate: { x: ["-100%", "200%"] },
          transition: { duration: 3, repeat: 1 / 0, repeatDelay: 2 },
        }),
      e.jsx("span", { className: "relative flex items-center justify-center gap-2", children: s }),
    ],
  });
}
const _ = p.memo(function ({ navigate: s }) {
  const { t: a } = k(),
    l = h((n) => n.settings),
    r = h((n) => n.gameState),
    { setWindowStyle: d } = M(),
    { ref: x, compact: o } = T(520),
    [m, g] = p.useState(!1),
    [$, j] = p.useState(!1),
    [L, C] = p.useState(l.tokens);
  p.useEffect(() => (d({ titleBarBackground: t.canopy }), () => d(null)), [d]);
  const b = F("codenames"),
    v = h((n) => n.tutorial !== null);
  p.useEffect(() => {
    const n = b?.getHeadSnapshot()?.state.gameState;
    G(r, n, v) === "game" && s("game");
  }, [r, s, b, v]);
  const N = () => {
      if (!m) g(!0);
      else {
        const n = w();
        if (!n) return;
        n.startGame({ tokens: L })
          .then(() => {
            s("game");
          })
          .catch((f) => {
            console.error("[CodenamesStart] Failed to start game:", f);
          });
      }
    },
    S = () => {
      const n = w();
      n &&
        n
          .startTutorial()
          .then(() => {
            s("game");
          })
          .catch((f) => {
            console.error("[CodenamesStart] Failed to start tutorial:", f);
          });
    };
  return e.jsxs("div", {
    ref: x,
    className: "relative h-full flex flex-col items-center justify-center overflow-hidden",
    children: [
      e.jsx("style", { children: O }),
      e.jsx(I, {}),
      e.jsx(z, {}),
      e.jsx(A, {}),
      e.jsx("div", {
        className: "absolute inset-0 pointer-events-none",
        style: {
          background: `radial-gradient(ellipse 60% 50% at 50% 45%, ${t.gold}08 0%, transparent 60%)`,
        },
      }),
      e.jsx("div", {
        className: "absolute inset-0 pointer-events-none",
        style: { boxShadow: `inset 0 0 120px 40px ${t.canopy}` },
      }),
      e.jsx(i.button, {
        onClick: () => j(!0),
        "aria-label": a("codenames.help.button"),
        className:
          "absolute top-9 right-9 z-20 flex h-9 w-9 items-center justify-center rounded-full",
        style: {
          background: "rgba(0, 0, 0, 0.35)",
          border: `1.5px solid ${t.gold}70`,
          color: t.goldLight,
          fontFamily: "'Fredoka', sans-serif",
          fontWeight: 600,
          fontSize: 16,
          boxShadow: "0 2px 12px rgba(0,0,0,0.4)",
        },
        whileHover: { scale: 1.08, boxShadow: `0 0 16px ${t.gold}50` },
        whileTap: { scale: 0.94 },
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        transition: { delay: 0.5 },
        children: "?",
      }),
      e.jsxs(i.div, {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        transition: { duration: 0.6 },
        className: "relative flex flex-col items-center z-10 w-full max-w-[320px] px-6",
        children: [
          e.jsx(W, { compact: o }),
          e.jsx(i.h1, {
            className: `tracking-tight text-center mb-1 ${o ? "text-3xl mt-2" : "text-4xl mt-4"}`,
            style: {
              fontFamily: "'Fredoka', sans-serif",
              fontWeight: 700,
              color: t.cream,
              textShadow: `0 0 40px ${t.gold}40, 0 2px 0 ${t.canopy}`,
            },
            initial: { opacity: 0, y: 20 },
            animate: { opacity: 1, y: 0 },
            transition: { delay: 0.3 },
            children: a("codenames.title"),
          }),
          e.jsxs(i.div, {
            className: `flex items-center gap-2 ${o ? "my-2" : "my-3"}`,
            initial: { opacity: 0, scaleX: 0 },
            animate: { opacity: 1, scaleX: 1 },
            transition: { delay: 0.4 },
            children: [
              e.jsx("div", {
                className: "h-px w-8",
                style: { background: `linear-gradient(90deg, transparent, ${t.gold}60)` },
              }),
              e.jsx("svg", {
                viewBox: "0 0 16 16",
                className: "w-4 h-4",
                children: e.jsx("path", {
                  d: "M8 0 L10 6 L16 8 L10 10 L8 16 L6 10 L0 8 L6 6 Z",
                  fill: t.gold,
                }),
              }),
              e.jsx("div", {
                className: "h-px w-8",
                style: { background: `linear-gradient(90deg, ${t.gold}60, transparent)` },
              }),
            ],
          }),
          e.jsx(i.p, {
            className: `text-sm text-center italic ${o ? "mb-3" : "mb-6"}`,
            style: { fontFamily: "'Crimson Pro', serif", color: t.moss },
            initial: { opacity: 0 },
            animate: { opacity: 1 },
            transition: { delay: 0.5 },
            children: a("codenames.subtitle"),
          }),
          e.jsxs(i.div, {
            layout: !0,
            className: `flex flex-col w-full ${o ? "gap-2 mt-1" : "gap-3 mt-4"}`,
            initial: { opacity: 0, y: 20 },
            animate: { opacity: 1, y: 0 },
            transition: { delay: 0.6, layout: { duration: 0.25, ease: "easeOut" } },
            children: [
              e.jsx(y, {
                mode: "popLayout",
                children:
                  m &&
                  e.jsx(
                    i.div,
                    {
                      layout: !0,
                      initial: { opacity: 0, scale: 0.95 },
                      animate: { opacity: 1, scale: 1 },
                      exit: { opacity: 0, scale: 0.95 },
                      transition: { duration: 0.2 },
                      children: e.jsx(P, { tokens: L, setTokens: C, compact: o }),
                    },
                    "difficulty",
                  ),
              }),
              e.jsx(i.div, {
                layout: !0,
                transition: { duration: 0.25, ease: "easeOut" },
                children: e.jsxs(u, {
                  onClick: N,
                  compact: o,
                  children: [
                    e.jsx("svg", {
                      viewBox: "0 0 24 24",
                      className: "w-5 h-5",
                      fill: "currentColor",
                      children: e.jsx("path", { d: "M8 5v14l11-7z" }),
                    }),
                    a(m ? "codenames.buttons.startMission" : "codenames.buttons.newMission"),
                  ],
                }),
              }),
              e.jsx(y, {
                mode: "popLayout",
                children:
                  !m &&
                  e.jsx(
                    i.div,
                    {
                      layout: !0,
                      initial: { opacity: 0, scale: 0.95 },
                      animate: { opacity: 1, scale: 1 },
                      exit: { opacity: 0, scale: 0.95 },
                      transition: { duration: 0.2 },
                      children: e.jsxs(u, {
                        onClick: S,
                        variant: "secondary",
                        compact: o,
                        children: [
                          e.jsxs("svg", {
                            viewBox: "0 0 24 24",
                            className: "w-5 h-5",
                            fill: "none",
                            stroke: "currentColor",
                            strokeWidth: "1.8",
                            strokeLinecap: "round",
                            strokeLinejoin: "round",
                            children: [
                              e.jsx("path", {
                                d: "M2 5.5 C5 4, 8.5 4.2, 12 6 v13 C8.5 17.2, 5 17, 2 18.5 Z",
                              }),
                              e.jsx("path", {
                                d: "M22 5.5 C19 4, 15.5 4.2, 12 6 v13 c3.5 -1.8, 7 -2, 10 -0.5 Z",
                              }),
                            ],
                          }),
                          a("codenames.buttons.tutorial"),
                        ],
                      }),
                    },
                    "tutorial",
                  ),
              }),
              e.jsx(y, {
                mode: "popLayout",
                children:
                  m &&
                  e.jsx(
                    i.div,
                    {
                      layout: !0,
                      initial: { opacity: 0, scale: 0.95 },
                      animate: { opacity: 1, scale: 1 },
                      exit: { opacity: 0, scale: 0.95 },
                      transition: { duration: 0.2 },
                      children: e.jsx(u, {
                        onClick: () => g(!1),
                        variant: "secondary",
                        compact: o,
                        children: a("codenames.buttons.back"),
                      }),
                    },
                    "back",
                  ),
              }),
            ],
          }),
        ],
      }),
      e.jsx(B, { open: $, onClose: () => j(!1) }),
    ],
  });
});
export { _ as StartScreen };
