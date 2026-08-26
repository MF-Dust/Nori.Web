import { j as e } from "./index-CyHAbkO5.js";
import { u as x, r as d } from "./i18n-DtIC1LRi.js";
import { A as m, p as o, m as p, X as u, o as h } from "./NormalApp-Cn6agT0F.js";
import { F as b, C as a } from "./useElementSize-2mM2J_lP.js";
const f = {
    soldier: "#FECE08",
    archer: "#B0D575",
    wizard: "#F49187",
    defender: "#A2BFDC",
    scientist: "#84C1BD",
    wolfy: "#B7C0C3",
  },
  y = "#E6CDE2";
function g(r) {
  return f[r] ?? y;
}
const k = [
    { name: "soldier", count: 5 },
    { name: "archer", count: 4 },
    { name: "wizard", count: 3 },
    { name: "defender", count: 4 },
    { name: "scientist", count: 3 },
    { name: "wolfy", count: 1 },
  ],
  j = ["goal", "attack", "defend", "challenge", "bout"];
function n(r, t) {
  const i = Number.parseInt(r.slice(1, 3), 16),
    s = Number.parseInt(r.slice(3, 5), 16),
    l = Number.parseInt(r.slice(5, 7), 16);
  return `rgba(${i},${s},${l},${t})`;
}
function w({ onClose: r }) {
  const { t } = x();
  (d.useEffect(() => {
    o("primitives-sheet-open");
  }, []),
    d.useEffect(() => {
      const s = (l) => {
        l.key === "Escape" && (l.preventDefault(), o("primitives-sheet-dismiss"), r());
      };
      return (
        window.addEventListener("keydown", s),
        () => window.removeEventListener("keydown", s)
      );
    }, [r]));
  const i = () => {
    (o("primitives-sheet-dismiss"), r());
  };
  return e.jsxs("div", {
    className: "absolute inset-0 z-[60] flex items-center justify-center p-4",
    children: [
      e.jsx("style", { children: b }),
      e.jsx(p.div, {
        className: "absolute inset-0",
        style: {
          background: "rgba(48, 34, 22, 0.45)",
          backdropFilter: "blur(10px) saturate(120%)",
          WebkitBackdropFilter: "blur(10px) saturate(120%)",
        },
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0.2 },
        onClick: i,
      }),
      e.jsx(p.div, {
        role: "dialog",
        "aria-modal": !0,
        "aria-label": t("cakeduel.help.title"),
        className:
          "relative w-full max-w-[540px] max-h-[calc(100%-2rem)] overflow-y-auto rounded-2xl",
        style: {
          background: `linear-gradient(180deg, ${a.cream} 0%, ${a.creamDark} 100%)`,
          border: "1px solid rgba(255,255,255,0.75)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.9), 0 18px 48px rgba(40,24,10,0.45)",
          fontFamily: "'Nunito', sans-serif",
        },
        initial: { opacity: 0, y: 18, scale: 0.97 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, y: 12, scale: 0.97 },
        transition: { duration: 0.3, ease: [0.23, 1, 0.32, 1] },
        children: e.jsxs("div", {
          className: "px-6 pt-5 pb-6",
          children: [
            e.jsxs("div", {
              className: "flex items-start justify-between",
              children: [
                e.jsx("h2", {
                  className: "leading-none",
                  style: {
                    fontFamily: "'Lilita One', sans-serif",
                    fontSize: 26,
                    color: a.brown,
                    textShadow: "0 1px 0 rgba(255,255,255,0.6)",
                  },
                  children: t("cakeduel.help.title"),
                }),
                e.jsx("button", {
                  onClick: i,
                  "aria-label": t("cakeduel.help.close"),
                  className: "shrink-0 rounded-full p-1.5 transition-colors hover:bg-black/[0.06]",
                  style: { color: a.brownLight },
                  children: e.jsx(u, { size: 18, strokeWidth: 2.5 }),
                }),
              ],
            }),
            e.jsx("div", {
              className: "mt-4 space-y-3",
              children: j.map((s) =>
                e.jsxs(
                  "div",
                  {
                    children: [
                      e.jsx("div", {
                        className: "text-[11px] font-extrabold uppercase tracking-[0.14em]",
                        style: { color: a.peachDeep },
                        children: t(`cakeduel.help.${s}.title`),
                      }),
                      e.jsx("p", {
                        className: "mt-0.5 text-[13px] leading-relaxed font-semibold",
                        style: { color: a.brown },
                        children: t(`cakeduel.help.${s}.body`),
                      }),
                    ],
                  },
                  s,
                ),
              ),
            }),
            e.jsxs("div", {
              className: "mt-5 rounded-xl px-4 pt-3 pb-2",
              style: {
                background: "rgba(255,255,255,0.45)",
                border: `1px solid ${n(a.peachDeep, 0.25)}`,
              },
              children: [
                e.jsxs("div", {
                  className: "flex items-baseline justify-between",
                  children: [
                    e.jsx("div", {
                      className: "text-[11px] font-extrabold uppercase tracking-[0.14em]",
                      style: { color: a.peachDeep },
                      children: t("cakeduel.help.deck.title"),
                    }),
                    e.jsx("div", {
                      className: "text-[11px] font-bold",
                      style: { color: a.brownLight },
                      children: t("cakeduel.help.deck.hand"),
                    }),
                  ],
                }),
                e.jsx("div", {
                  className: "mt-2 divide-y",
                  style: { borderColor: n(a.brownLight, 0.15) },
                  children: k.map(({ name: s, count: l }) => {
                    const c = g(s);
                    return e.jsxs(
                      "div",
                      {
                        className: "flex items-center gap-3 py-1.5",
                        children: [
                          e.jsx("img", {
                            src: h(s),
                            alt: "",
                            draggable: !1,
                            className: "h-8 w-8 shrink-0 object-contain",
                            style: { filter: `drop-shadow(0 1px 2px ${n(c, 0.45)})` },
                          }),
                          e.jsx("span", {
                            className: "w-20 shrink-0 text-[13px] font-extrabold",
                            style: { color: a.brown },
                            children: t(`cakeduel.cards.${s}`),
                          }),
                          e.jsxs("span", {
                            className:
                              "shrink-0 rounded-full px-1.5 py-px text-[10px] font-extrabold tabular-nums",
                            style: { background: n(c, 0.18), color: a.brown },
                            children: ["×", l],
                          }),
                          e.jsx("span", {
                            className: "min-w-0 flex-1 text-[12px] font-semibold leading-snug",
                            style: { color: a.brownLight },
                            children: t(`cakeduel.help.deck.${s}`),
                          }),
                        ],
                      },
                      s,
                    );
                  }),
                }),
              ],
            }),
          ],
        }),
      }),
    ],
  });
}
function D({ open: r, onClose: t }) {
  return e.jsx(m, { children: r && e.jsx(w, { onClose: t }) });
}
export { D as C, g };
