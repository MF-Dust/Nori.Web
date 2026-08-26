import { j as h } from "./index-CyHAbkO5.js";
import { r as s } from "./i18n-DtIC1LRi.js";
import {
  $ as R,
  a0 as se,
  a1 as y,
  a2 as O,
  a3 as ce,
  a4 as C,
  a5 as P,
  a6 as ae,
  a7 as ie,
  i as F,
} from "./NormalApp-Cn6agT0F.js";
function de(e, o) {
  return s.useReducer((r, l) => o[r][l] ?? r, e);
}
var U = "ScrollArea",
  [$] = ce(U),
  [ue, m] = $(U),
  q = s.forwardRef((e, o) => {
    const { __scopeScrollArea: r, type: l = "hover", dir: t, scrollHideDelay: n = 600, ...c } = e,
      [a, i] = s.useState(null),
      [f, d] = s.useState(null),
      [b, u] = s.useState(null),
      [S, w] = s.useState(null),
      [A, Y] = s.useState(null),
      [x, L] = s.useState(0),
      [M, _] = s.useState(0),
      [j, T] = s.useState(!1),
      [D, N] = s.useState(!1),
      v = R(o, i),
      p = se(t);
    return h.jsx(ue, {
      scope: r,
      type: l,
      dir: p,
      scrollHideDelay: n,
      scrollArea: a,
      viewport: f,
      onViewportChange: d,
      content: b,
      onContentChange: u,
      scrollbarX: S,
      onScrollbarXChange: w,
      scrollbarXEnabled: j,
      onScrollbarXEnabledChange: T,
      scrollbarY: A,
      onScrollbarYChange: Y,
      scrollbarYEnabled: D,
      onScrollbarYEnabledChange: N,
      onCornerWidthChange: L,
      onCornerHeightChange: _,
      children: h.jsx(y.div, {
        dir: p,
        ...c,
        ref: v,
        style: {
          position: "relative",
          "--radix-scroll-area-corner-width": x + "px",
          "--radix-scroll-area-corner-height": M + "px",
          ...e.style,
        },
      }),
    });
  });
q.displayName = U;
var G = "ScrollAreaViewport",
  J = s.forwardRef((e, o) => {
    const { __scopeScrollArea: r, children: l, nonce: t, ...n } = e,
      c = m(G, r),
      a = s.useRef(null),
      i = R(o, a, c.onViewportChange);
    return h.jsxs(h.Fragment, {
      children: [
        h.jsx(fe, { nonce: t }),
        h.jsx(y.div, {
          "data-radix-scroll-area-viewport": "",
          ...n,
          ref: i,
          style: {
            overflowX: c.scrollbarXEnabled ? "scroll" : "hidden",
            overflowY: c.scrollbarYEnabled ? "scroll" : "hidden",
            ...e.style,
          },
          children: h.jsx("div", {
            ref: c.onContentChange,
            style: { minWidth: "100%", display: "table" },
            children: l,
          }),
        }),
      ],
    });
  });
J.displayName = G;
var fe = s.memo(
    ({ nonce: e }) =>
      h.jsx("style", {
        dangerouslySetInnerHTML: {
          __html:
            "[data-radix-scroll-area-viewport]{scrollbar-width:none;-ms-overflow-style:none;-webkit-overflow-scrolling:touch;}[data-radix-scroll-area-viewport]::-webkit-scrollbar{display:none}",
        },
        nonce: e,
      }),
    (e, o) => e.nonce === o.nonce,
  ),
  g = "ScrollAreaScrollbar",
  K = s.forwardRef((e, o) => {
    const { forceMount: r, ...l } = e,
      t = m(g, e.__scopeScrollArea),
      { onScrollbarXEnabledChange: n, onScrollbarYEnabledChange: c } = t,
      a = e.orientation === "horizontal";
    return (
      s.useEffect(
        () => (
          a ? n(!0) : c(!0),
          () => {
            a ? n(!1) : c(!1);
          }
        ),
        [a, n, c],
      ),
      t.type === "hover"
        ? h.jsx(he, { ...l, ref: o, forceMount: r })
        : t.type === "scroll"
          ? h.jsx(be, { ...l, ref: o, forceMount: r })
          : t.type === "auto"
            ? h.jsx(Q, { ...l, ref: o, forceMount: r })
            : t.type === "always"
              ? h.jsx(V, { ...l, ref: o, "data-state": "visible" })
              : null
    );
  });
K.displayName = g;
var he = s.forwardRef((e, o) => {
    const { forceMount: r, ...l } = e,
      t = m(g, e.__scopeScrollArea),
      [n, c] = s.useState(!1);
    return (
      s.useEffect(() => {
        const a = t.scrollArea;
        let i = 0;
        if (a) {
          const f = () => {
              (window.clearTimeout(i), c(!0));
            },
            d = () => {
              i = window.setTimeout(() => c(!1), t.scrollHideDelay);
            };
          return (
            a.addEventListener("pointerenter", f),
            a.addEventListener("pointerleave", d),
            () => {
              (window.clearTimeout(i),
                a.removeEventListener("pointerenter", f),
                a.removeEventListener("pointerleave", d));
            }
          );
        }
      }, [t.scrollArea, t.scrollHideDelay]),
      h.jsx(O, {
        present: r || n,
        children: h.jsx(Q, { "data-state": n ? "visible" : "hidden", ...l, ref: o }),
      })
    );
  }),
  be = s.forwardRef((e, o) => {
    const { forceMount: r, ...l } = e,
      t = m(g, e.__scopeScrollArea),
      n = e.orientation === "horizontal",
      c = X(() => i("SCROLL_END"), 100),
      [a, i] = de("hidden", {
        hidden: { SCROLL: "scrolling" },
        scrolling: { SCROLL_END: "idle", POINTER_ENTER: "interacting" },
        interacting: { SCROLL: "interacting", POINTER_LEAVE: "idle" },
        idle: { HIDE: "hidden", SCROLL: "scrolling", POINTER_ENTER: "interacting" },
      });
    return (
      s.useEffect(() => {
        if (a === "idle") {
          const f = window.setTimeout(() => i("HIDE"), t.scrollHideDelay);
          return () => window.clearTimeout(f);
        }
      }, [a, t.scrollHideDelay, i]),
      s.useEffect(() => {
        const f = t.viewport,
          d = n ? "scrollLeft" : "scrollTop";
        if (f) {
          let b = f[d];
          const u = () => {
            const S = f[d];
            (b !== S && (i("SCROLL"), c()), (b = S));
          };
          return (f.addEventListener("scroll", u), () => f.removeEventListener("scroll", u));
        }
      }, [t.viewport, n, i, c]),
      h.jsx(O, {
        present: r || a !== "hidden",
        children: h.jsx(V, {
          "data-state": a === "hidden" ? "hidden" : "visible",
          ...l,
          ref: o,
          onPointerEnter: C(e.onPointerEnter, () => i("POINTER_ENTER")),
          onPointerLeave: C(e.onPointerLeave, () => i("POINTER_LEAVE")),
        }),
      })
    );
  }),
  Q = s.forwardRef((e, o) => {
    const r = m(g, e.__scopeScrollArea),
      { forceMount: l, ...t } = e,
      [n, c] = s.useState(!1),
      a = e.orientation === "horizontal",
      i = X(() => {
        if (r.viewport) {
          const f = r.viewport.offsetWidth < r.viewport.scrollWidth,
            d = r.viewport.offsetHeight < r.viewport.scrollHeight;
          c(a ? f : d);
        }
      }, 10);
    return (
      E(r.viewport, i),
      E(r.content, i),
      h.jsx(O, {
        present: l || n,
        children: h.jsx(V, { "data-state": n ? "visible" : "hidden", ...t, ref: o }),
      })
    );
  }),
  V = s.forwardRef((e, o) => {
    const { orientation: r = "vertical", ...l } = e,
      t = m(g, e.__scopeScrollArea),
      n = s.useRef(null),
      c = s.useRef(0),
      [a, i] = s.useState({
        content: 0,
        viewport: 0,
        scrollbar: { size: 0, paddingStart: 0, paddingEnd: 0 },
      }),
      f = te(a.viewport, a.content),
      d = {
        ...l,
        sizes: a,
        onSizesChange: i,
        hasThumb: f > 0 && f < 1,
        onThumbChange: (u) => (n.current = u),
        onThumbPointerUp: () => (c.current = 0),
        onThumbPointerDown: (u) => (c.current = u),
      };
    function b(u, S) {
      return ge(u, c.current, a, S);
    }
    return r === "horizontal"
      ? h.jsx(Se, {
          ...d,
          ref: o,
          onThumbPositionChange: () => {
            if (t.viewport && n.current) {
              const u = t.viewport.scrollLeft,
                S = k(u, a, t.dir);
              n.current.style.transform = `translate3d(${S}px, 0, 0)`;
            }
          },
          onWheelScroll: (u) => {
            t.viewport && (t.viewport.scrollLeft = u);
          },
          onDragScroll: (u) => {
            t.viewport && (t.viewport.scrollLeft = b(u, t.dir));
          },
        })
      : r === "vertical"
        ? h.jsx(ve, {
            ...d,
            ref: o,
            onThumbPositionChange: () => {
              if (t.viewport && n.current) {
                const u = t.viewport.scrollTop,
                  S = k(u, a);
                n.current.style.transform = `translate3d(0, ${S}px, 0)`;
              }
            },
            onWheelScroll: (u) => {
              t.viewport && (t.viewport.scrollTop = u);
            },
            onDragScroll: (u) => {
              t.viewport && (t.viewport.scrollTop = b(u));
            },
          })
        : null;
  }),
  Se = s.forwardRef((e, o) => {
    const { sizes: r, onSizesChange: l, ...t } = e,
      n = m(g, e.__scopeScrollArea),
      [c, a] = s.useState(),
      i = s.useRef(null),
      f = R(o, i, n.onScrollbarXChange);
    return (
      s.useEffect(() => {
        i.current && a(getComputedStyle(i.current));
      }, [i]),
      h.jsx(ee, {
        "data-orientation": "horizontal",
        ...t,
        ref: f,
        sizes: r,
        style: {
          bottom: 0,
          left: n.dir === "rtl" ? "var(--radix-scroll-area-corner-width)" : 0,
          right: n.dir === "ltr" ? "var(--radix-scroll-area-corner-width)" : 0,
          "--radix-scroll-area-thumb-width": I(r) + "px",
          ...e.style,
        },
        onThumbPointerDown: (d) => e.onThumbPointerDown(d.x),
        onDragScroll: (d) => e.onDragScroll(d.x),
        onWheelScroll: (d, b) => {
          if (n.viewport) {
            const u = n.viewport.scrollLeft + d.deltaX;
            (e.onWheelScroll(u), le(u, b) && d.preventDefault());
          }
        },
        onResize: () => {
          i.current &&
            n.viewport &&
            c &&
            l({
              content: n.viewport.scrollWidth,
              viewport: n.viewport.offsetWidth,
              scrollbar: {
                size: i.current.clientWidth,
                paddingStart: z(c.paddingLeft),
                paddingEnd: z(c.paddingRight),
              },
            });
        },
      })
    );
  }),
  ve = s.forwardRef((e, o) => {
    const { sizes: r, onSizesChange: l, ...t } = e,
      n = m(g, e.__scopeScrollArea),
      [c, a] = s.useState(),
      i = s.useRef(null),
      f = R(o, i, n.onScrollbarYChange);
    return (
      s.useEffect(() => {
        i.current && a(getComputedStyle(i.current));
      }, [i]),
      h.jsx(ee, {
        "data-orientation": "vertical",
        ...t,
        ref: f,
        sizes: r,
        style: {
          top: 0,
          right: n.dir === "ltr" ? 0 : void 0,
          left: n.dir === "rtl" ? 0 : void 0,
          bottom: "var(--radix-scroll-area-corner-height)",
          "--radix-scroll-area-thumb-height": I(r) + "px",
          ...e.style,
        },
        onThumbPointerDown: (d) => e.onThumbPointerDown(d.y),
        onDragScroll: (d) => e.onDragScroll(d.y),
        onWheelScroll: (d, b) => {
          if (n.viewport) {
            const u = n.viewport.scrollTop + d.deltaY;
            (e.onWheelScroll(u), le(u, b) && d.preventDefault());
          }
        },
        onResize: () => {
          i.current &&
            n.viewport &&
            c &&
            l({
              content: n.viewport.scrollHeight,
              viewport: n.viewport.offsetHeight,
              scrollbar: {
                size: i.current.clientHeight,
                paddingStart: z(c.paddingTop),
                paddingEnd: z(c.paddingBottom),
              },
            });
        },
      })
    );
  }),
  [me, Z] = $(g),
  ee = s.forwardRef((e, o) => {
    const {
        __scopeScrollArea: r,
        sizes: l,
        hasThumb: t,
        onThumbChange: n,
        onThumbPointerUp: c,
        onThumbPointerDown: a,
        onThumbPositionChange: i,
        onDragScroll: f,
        onWheelScroll: d,
        onResize: b,
        ...u
      } = e,
      S = m(g, r),
      [w, A] = s.useState(null),
      Y = R(o, A),
      x = s.useRef(null),
      L = s.useRef(""),
      M = S.viewport,
      _ = l.content - l.viewport,
      j = P(d),
      T = P(i),
      D = X(b, 10);
    function N(v) {
      if (x.current) {
        const p = v.clientX - x.current.left,
          W = v.clientY - x.current.top;
        f({ x: p, y: W });
      }
    }
    return (
      s.useEffect(() => {
        const v = (p) => {
          const W = p.target;
          w?.contains(W) && j(p, _);
        };
        return (
          document.addEventListener("wheel", v, { passive: !1 }),
          () => document.removeEventListener("wheel", v, { passive: !1 })
        );
      }, [M, w, _, j]),
      s.useEffect(T, [l, T]),
      E(w, D),
      E(S.content, D),
      h.jsx(me, {
        scope: r,
        scrollbar: w,
        hasThumb: t,
        onThumbChange: P(n),
        onThumbPointerUp: P(c),
        onThumbPositionChange: T,
        onThumbPointerDown: P(a),
        children: h.jsx(y.div, {
          ...u,
          ref: Y,
          style: { position: "absolute", ...u.style },
          onPointerDown: C(e.onPointerDown, (v) => {
            v.button === 0 &&
              (v.target.setPointerCapture(v.pointerId),
              (x.current = w.getBoundingClientRect()),
              (L.current = document.body.style.webkitUserSelect),
              (document.body.style.webkitUserSelect = "none"),
              S.viewport && (S.viewport.style.scrollBehavior = "auto"),
              N(v));
          }),
          onPointerMove: C(e.onPointerMove, N),
          onPointerUp: C(e.onPointerUp, (v) => {
            const p = v.target;
            (p.hasPointerCapture(v.pointerId) && p.releasePointerCapture(v.pointerId),
              (document.body.style.webkitUserSelect = L.current),
              S.viewport && (S.viewport.style.scrollBehavior = ""),
              (x.current = null));
          }),
        }),
      })
    );
  }),
  H = "ScrollAreaThumb",
  re = s.forwardRef((e, o) => {
    const { forceMount: r, ...l } = e,
      t = Z(H, e.__scopeScrollArea);
    return h.jsx(O, { present: r || t.hasThumb, children: h.jsx(pe, { ref: o, ...l }) });
  }),
  pe = s.forwardRef((e, o) => {
    const { __scopeScrollArea: r, style: l, ...t } = e,
      n = m(H, r),
      c = Z(H, r),
      { onThumbPositionChange: a } = c,
      i = R(o, c.onThumbChange),
      f = s.useRef(void 0),
      d = X(() => {
        f.current && (f.current(), (f.current = void 0));
      }, 100);
    return (
      s.useEffect(() => {
        const b = n.viewport;
        if (b) {
          const u = () => {
            if ((d(), !f.current)) {
              const S = xe(b, a);
              ((f.current = S), a());
            }
          };
          return (a(), b.addEventListener("scroll", u), () => b.removeEventListener("scroll", u));
        }
      }, [n.viewport, d, a]),
      h.jsx(y.div, {
        "data-state": c.hasThumb ? "visible" : "hidden",
        ...t,
        ref: i,
        style: {
          width: "var(--radix-scroll-area-thumb-width)",
          height: "var(--radix-scroll-area-thumb-height)",
          ...l,
        },
        onPointerDownCapture: C(e.onPointerDownCapture, (b) => {
          const S = b.target.getBoundingClientRect(),
            w = b.clientX - S.left,
            A = b.clientY - S.top;
          c.onThumbPointerDown({ x: w, y: A });
        }),
        onPointerUp: C(e.onPointerUp, c.onThumbPointerUp),
      })
    );
  });
re.displayName = H;
var B = "ScrollAreaCorner",
  oe = s.forwardRef((e, o) => {
    const r = m(B, e.__scopeScrollArea),
      l = !!(r.scrollbarX && r.scrollbarY);
    return r.type !== "scroll" && l ? h.jsx(we, { ...e, ref: o }) : null;
  });
oe.displayName = B;
var we = s.forwardRef((e, o) => {
  const { __scopeScrollArea: r, ...l } = e,
    t = m(B, r),
    [n, c] = s.useState(0),
    [a, i] = s.useState(0),
    f = !!(n && a);
  return (
    E(t.scrollbarX, () => {
      const d = t.scrollbarX?.offsetHeight || 0;
      (t.onCornerHeightChange(d), i(d));
    }),
    E(t.scrollbarY, () => {
      const d = t.scrollbarY?.offsetWidth || 0;
      (t.onCornerWidthChange(d), c(d));
    }),
    f
      ? h.jsx(y.div, {
          ...l,
          ref: o,
          style: {
            width: n,
            height: a,
            position: "absolute",
            right: t.dir === "ltr" ? 0 : void 0,
            left: t.dir === "rtl" ? 0 : void 0,
            bottom: 0,
            ...e.style,
          },
        })
      : null
  );
});
function z(e) {
  return e ? parseInt(e, 10) : 0;
}
function te(e, o) {
  const r = e / o;
  return isNaN(r) ? 0 : r;
}
function I(e) {
  const o = te(e.viewport, e.content),
    r = e.scrollbar.paddingStart + e.scrollbar.paddingEnd,
    l = (e.scrollbar.size - r) * o;
  return Math.max(l, 18);
}
function ge(e, o, r, l = "ltr") {
  const t = I(r),
    n = t / 2,
    c = o || n,
    a = t - c,
    i = r.scrollbar.paddingStart + c,
    f = r.scrollbar.size - r.scrollbar.paddingEnd - a,
    d = r.content - r.viewport,
    b = l === "ltr" ? [0, d] : [d * -1, 0];
  return ne([i, f], b)(e);
}
function k(e, o, r = "ltr") {
  const l = I(o),
    t = o.scrollbar.paddingStart + o.scrollbar.paddingEnd,
    n = o.scrollbar.size - t,
    c = o.content - o.viewport,
    a = n - l,
    i = r === "ltr" ? [0, c] : [c * -1, 0],
    f = ie(e, i);
  return ne([0, c], [0, a])(f);
}
function ne(e, o) {
  return (r) => {
    if (e[0] === e[1] || o[0] === o[1]) return o[0];
    const l = (o[1] - o[0]) / (e[1] - e[0]);
    return o[0] + l * (r - e[0]);
  };
}
function le(e, o) {
  return e > 0 && e < o;
}
var xe = (e, o = () => {}) => {
  let r = { left: e.scrollLeft, top: e.scrollTop },
    l = 0;
  return (
    (function t() {
      const n = { left: e.scrollLeft, top: e.scrollTop },
        c = r.left !== n.left,
        a = r.top !== n.top;
      ((c || a) && o(), (r = n), (l = window.requestAnimationFrame(t)));
    })(),
    () => window.cancelAnimationFrame(l)
  );
};
function X(e, o) {
  const r = P(e),
    l = s.useRef(0);
  return (
    s.useEffect(() => () => window.clearTimeout(l.current), []),
    s.useCallback(() => {
      (window.clearTimeout(l.current), (l.current = window.setTimeout(r, o)));
    }, [r, o])
  );
}
function E(e, o) {
  const r = P(o);
  ae(() => {
    let l = 0;
    if (e) {
      const t = new ResizeObserver(() => {
        (cancelAnimationFrame(l), (l = window.requestAnimationFrame(r)));
      });
      return (
        t.observe(e),
        () => {
          (window.cancelAnimationFrame(l), t.unobserve(e));
        }
      );
    }
  }, [e, r]);
}
var Pe = q,
  Ce = J,
  Ee = oe;
function _e({ className: e, children: o, viewportRef: r, ...l }) {
  return h.jsxs(Pe, {
    "data-slot": "scroll-area",
    className: F("relative h-full flex flex-col", e),
    ...l,
    children: [
      h.jsx(Ce, {
        ref: r,
        "data-slot": "scroll-area-viewport",
        className:
          "focus-visible:ring-ring/50 w-full h-full flex-1 min-h-0 rounded-[inherit] transition-[color,box-shadow] outline-none focus-visible:ring-[3px] focus-visible:outline-1",
        children: o,
      }),
      h.jsx(Re, {}),
      h.jsx(Ee, {}),
    ],
  });
}
function Re({ className: e, orientation: o = "vertical", ...r }) {
  return h.jsx(K, {
    "data-slot": "scroll-area-scrollbar",
    orientation: o,
    className: F(
      "flex touch-none p-px transition-colors select-none",
      o === "vertical" && "h-full w-2.5 border-l border-l-transparent",
      o === "horizontal" && "h-2.5 flex-col border-t border-t-transparent",
      e,
    ),
    ...r,
    children: h.jsx(re, {
      "data-slot": "scroll-area-thumb",
      className: "bg-border relative flex-1 rounded-full",
    }),
  });
}
export { _e as S };
