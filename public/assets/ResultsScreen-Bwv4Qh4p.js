import { j as e } from "./index-CyHAbkO5.js";
import { u as C, r as m } from "./i18n-DtIC1LRi.js";
import {
  b as S,
  u as M,
  c as W,
  k as R,
  r as T,
  l as B,
  m as d,
  T as E,
  s as z,
  q as D,
} from "./NormalApp-Cn6agT0F.js";
import { u as _, C as a, F as A } from "./useElementSize-2mM2J_lP.js";
import { H as O, C as w, a as F } from "./CakeDuelPrimaryButton-BAwIQX7O.js";
function P({ victory: s }) {
  const i = m.useMemo(
    () =>
      Array.from({ length: 18 }, (t, l) => ({
        id: l,
        x: 5 + Math.random() * 90,
        y: s ? 80 + Math.random() * 30 : -10 - Math.random() * 20,
        size: 4 + Math.random() * 8,
        delay: Math.random() * 1.5,
        duration: 3 + Math.random() * 4,
        drift: 10 + Math.random() * 30,
        color: s
          ? [a.gold, a.peach, a.pink, a.peachLight, "#fff"][l % 5]
          : [a.sky, a.brownLight, a.peach, a.creamDark][l % 4],
        shape: s && l % 3 === 0 ? "star" : "circle",
      })),
    [s],
  );
  return e.jsx("div", {
    className: "absolute inset-0 overflow-hidden pointer-events-none",
    children: i.map((t) =>
      e.jsx(
        d.div,
        {
          className: "absolute",
          style: {
            left: `${t.x}%`,
            top: `${t.y}%`,
            width: t.size,
            height: t.size,
            background: t.color,
            borderRadius: t.shape === "star" ? "2px" : "50%",
            rotate: t.shape === "star" ? "45deg" : void 0,
            opacity: 0,
          },
          animate: {
            y: s ? [0, -t.drift * 8, -t.drift * 12] : [0, t.drift * 6, t.drift * 10],
            x: [0, t.drift * (Math.random() > 0.5 ? 1 : -1), 0],
            opacity: [0, 0.7, 0],
            scale: [0.5, 1.3, 0.3],
            rotate: t.shape === "star" ? [0, 180, 360] : void 0,
          },
          transition: { duration: t.duration, delay: t.delay, repeat: 1 / 0, ease: "easeOut" },
        },
        t.id,
      ),
    ),
  });
}
function G({ playerWins: s, noriWins: i, roundsToWin: t, playerLabel: l, noriLabel: c }) {
  const u = Math.max(t, s, i);
  return e.jsxs("div", {
    className: "flex items-center justify-center gap-4 w-full",
    style: { fontFamily: "'Nunito', sans-serif" },
    children: [
      e.jsxs("div", {
        className: "flex flex-col items-center gap-1",
        children: [
          e.jsx("span", {
            className: "text-[10px] font-bold uppercase tracking-widest",
            style: { color: a.brownLight },
            children: l,
          }),
          e.jsx("div", {
            className: "flex gap-1",
            children: Array.from({ length: u }, (g, n) =>
              e.jsx(
                d.div,
                {
                  className: "rounded-full",
                  style: {
                    width: 10,
                    height: 10,
                    background: n < s ? a.gold : `${a.brown}30`,
                    boxShadow: n < s ? `0 0 6px ${a.gold}80` : "none",
                  },
                  initial: { scale: 0 },
                  animate: { scale: 1 },
                  transition: { delay: 0.6 + n * 0.08, type: "spring", stiffness: 200 },
                },
                n,
              ),
            ),
          }),
        ],
      }),
      e.jsx("span", {
        className: "text-xs font-bold",
        style: { color: a.brownLight, fontFamily: "'Lilita One', sans-serif" },
        children: "vs",
      }),
      e.jsxs("div", {
        className: "flex flex-col items-center gap-1",
        children: [
          e.jsx("span", {
            className: "text-[10px] font-bold uppercase tracking-widest",
            style: { color: a.brownLight },
            children: c,
          }),
          e.jsx("div", {
            className: "flex gap-1",
            children: Array.from({ length: u }, (g, n) =>
              e.jsx(
                d.div,
                {
                  className: "rounded-full",
                  style: {
                    width: 10,
                    height: 10,
                    background: n < i ? a.pink : `${a.brown}30`,
                    boxShadow: n < i ? `0 0 6px ${a.pink}80` : "none",
                  },
                  initial: { scale: 0 },
                  animate: { scale: 1 },
                  transition: { delay: 0.6 + n * 0.08, type: "spring", stiffness: 200 },
                },
                n,
              ),
            ),
          }),
        ],
      }),
    ],
  });
}
function q({ navigate: s }) {
  const { t: i, i18n: t } = C(),
    l = t.language.startsWith("zh"),
    c = S("cakeduel"),
    { setWindowStyle: u } = M(),
    [g, n] = _(),
    r = Math.min(1, Math.max(0, (n.height - 400) / 240)),
    h = n.height > 0 && n.height < 520;
  m.useEffect(() => (u({ titleBarBackground: a.sky }), () => u(null)), [u]);
  const x = W("cakeduel"),
    y = c?.game ?? null;
  m.useEffect(() => {
    const o = x?.getHeadSnapshot()?.state.game;
    R(y, o) === "game" && s("game");
  }, [y, s, x]);
  const p = c?.game?.gameEnded?.winner ?? null,
    f = p === 0,
    b = m.useRef(!1);
  m.useEffect(() => {
    p === null || b.current || ((b.current = !0), T(p === 0));
  }, [p]);
  const k = c?.game?.boutWinners ?? [],
    j = c?.settings?.roundsToWin ?? 2,
    v = k.filter((o) => o === 0).length,
    N = k.filter((o) => o === 1).length,
    L = i(
      p === 0
        ? "cakeduel.results.youWin"
        : p === 1
          ? "cakeduel.results.noriWins"
          : "cakeduel.results.noWinner",
    ),
    $ = m.useCallback(async () => {
      const o = D();
      if (o)
        try {
          await o.reset();
        } catch {}
      s("start");
    }, [s]);
  return e.jsxs("div", {
    ref: g,
    className: "relative h-full w-full overflow-hidden",
    "data-cakeduel-screen": "results",
    children: [
      e.jsx("style", { children: A }),
      e.jsx("img", {
        src: B,
        alt: "",
        className: "absolute inset-0 h-full w-full object-cover",
        draggable: !1,
      }),
      e.jsx("div", {
        className: "absolute inset-0",
        style: {
          background: f
            ? `
              radial-gradient(ellipse 70% 60% at 50% 45%, ${a.gold}40 0%, transparent 70%),
              linear-gradient(180deg, ${a.sky}70 0%, ${a.sky}40 40%, ${a.peach}30 100%)
            `
            : `
              radial-gradient(ellipse 70% 60% at 50% 45%, ${a.sky}50 0%, transparent 70%),
              linear-gradient(180deg, ${a.sky}60 0%, ${a.brownLight}30 60%, ${a.brown}40 100%)
            `,
        },
      }),
      e.jsx("div", {
        className: "absolute inset-0",
        style: { boxShadow: "inset 0 0 100px 30px rgba(40,60,80,0.5)" },
      }),
      e.jsx(P, { victory: f }),
      e.jsxs("div", {
        className: "relative z-10 flex h-full w-full flex-col items-center justify-center p-4",
        style: { gap: 6 + 6 * r },
        children: [
          e.jsxs(d.div, {
            className: "flex flex-col items-center",
            initial: { opacity: 0, y: 20 },
            animate: { opacity: 1, y: 0 },
            transition: { duration: 0.5, ease: [0.23, 1, 0.32, 1] },
            children: [
              e.jsxs("div", {
                className: "relative",
                children: [
                  e.jsx(O, { locale: t.language, scale: 0.55 + 0.45 * r }),
                  e.jsx(d.img, {
                    src: f ? E : z,
                    alt: "",
                    draggable: !1,
                    className: "absolute left-1/2 top-1/2 z-20 drop-shadow-xl",
                    style: {
                      width: 48 + 32 * r,
                      height: 48 + 32 * r,
                      marginLeft: -(48 + 32 * r) / 2,
                      marginTop: -(48 + 32 * r) / 2,
                    },
                    initial: { opacity: 0, y: -40, scale: 0.3, rotate: -15 },
                    animate: { opacity: 1, y: 0, scale: 1, rotate: 0 },
                    transition: { delay: 0.4, type: "spring", stiffness: 150, damping: 12 },
                  }),
                ],
              }),
              e.jsx(d.h1, {
                className: "text-center leading-none",
                style: {
                  marginTop: 6 + 6 * r,
                  marginBottom: 12 + 20 * r,
                  fontFamily: "'Lilita One', sans-serif",
                  fontSize: 26 + 12 * r,
                  fontWeight: l ? 900 : void 0,
                  background: f
                    ? `linear-gradient(180deg, ${a.cream} 0%, ${a.gold} 45%, ${a.peach} 75%, ${a.peachDeep} 100%)`
                    : "linear-gradient(180deg, #ffffff 0%, #d0ccc8 45%, #9a9490 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  filter: f
                    ? `drop-shadow(0 2px 0 ${a.peachDeep}) drop-shadow(0 4px 10px rgba(200,160,20,0.5))`
                    : "drop-shadow(0 2px 0 #6a6460) drop-shadow(0 4px 10px rgba(60,55,50,0.45))",
                },
                initial: { opacity: 0, y: 16, scale: 0.85 },
                animate: { opacity: 1, y: 0, scale: 1 },
                transition: { delay: 0.25, type: "spring", stiffness: 160, damping: 12 },
                children: L,
              }),
            ],
          }),
          e.jsx(d.div, {
            className: "w-full max-w-[280px] rounded-2xl relative overflow-hidden backdrop-blur-md",
            style: {
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.40) 50%, rgba(255,255,255,0.55) 100%)",
              border: "1px solid rgba(255,255,255,0.6)",
              boxShadow:
                "inset 0 1px 0 rgba(255,255,255,0.8), 0 4px 16px rgba(0,0,0,0.15), 0 0 1px rgba(0,0,0,0.1)",
            },
            initial: { opacity: 0, y: 20 },
            animate: { opacity: 1, y: 0 },
            transition: { delay: 0.45, duration: 0.5, ease: [0.23, 1, 0.32, 1] },
            children: e.jsxs("div", {
              className: h
                ? "relative px-4 pt-2.5 pb-3.5 space-y-2"
                : "relative px-5 pt-4 pb-5 space-y-3",
              children: [
                e.jsx(w, { compact: h }),
                e.jsx(G, {
                  playerWins: v,
                  noriWins: N,
                  roundsToWin: j,
                  playerLabel: i("cakeduel.results.playerLabel"),
                  noriLabel: i("cakeduel.results.noriLabel"),
                }),
                e.jsx(w, { compact: h }),
                e.jsx(F, {
                  onClick: $,
                  compact: h,
                  fontSize: h ? 15 : 18,
                  shimmerDelay: 1.5,
                  entryDelay: 0.7,
                  icon: e.jsxs("svg", {
                    viewBox: "0 0 24 24",
                    className: "w-5 h-5",
                    fill: "none",
                    stroke: "currentColor",
                    strokeWidth: "2.5",
                    strokeLinecap: "round",
                    children: [
                      e.jsx("path", { d: "M1 4v6h6" }),
                      e.jsx("path", { d: "M3.51 15a9 9 0 1 0 2.13-9.36L1 10" }),
                    ],
                  }),
                  children: i("cakeduel.results.playAgain"),
                }),
              ],
            }),
          }),
        ],
      }),
    ],
  });
}
export { q as ResultsScreen };
