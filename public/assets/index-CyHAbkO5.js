const __vite__mapDeps = (
  i,
  m = __vite__mapDeps,
  d = m.f ||
    (m.f = [
      "assets/NormalApp-Cn6agT0F.js",
      "assets/i18n-DtIC1LRi.js",
      "assets/NormalApp-B2xPBQgm.css",
      "assets/IntroPage-BO45BFI5.js",
      "assets/IntroPage-DDLyUHx2.css",
    ]),
) => i.map((i) => d[i]);
import { e as p1, r as Si, u as Er, R as Kl, g as z2, f as E2 } from "./i18n-DtIC1LRi.js";
(function () {
  const t = document.createElement("link").relList;
  if (t && t.supports && t.supports("modulepreload")) return;
  for (const o of document.querySelectorAll('link[rel="modulepreload"]')) s(o);
  new MutationObserver((o) => {
    for (const l of o)
      if (l.type === "childList")
        for (const u of l.addedNodes) u.tagName === "LINK" && u.rel === "modulepreload" && s(u);
  }).observe(document, { childList: !0, subtree: !0 });
  function i(o) {
    const l = {};
    return (
      o.integrity && (l.integrity = o.integrity),
      o.referrerPolicy && (l.referrerPolicy = o.referrerPolicy),
      o.crossOrigin === "use-credentials"
        ? (l.credentials = "include")
        : o.crossOrigin === "anonymous"
          ? (l.credentials = "omit")
          : (l.credentials = "same-origin"),
      l
    );
  }
  function s(o) {
    if (o.ep) return;
    o.ep = !0;
    const l = i(o);
    fetch(o.href, l);
  }
})();
const R2 = "modulepreload",
  C2 = function (c) {
    return "/" + c;
  },
  lg = {},
  m1 = function (t, i, s) {
    let o = Promise.resolve();
    if (i && i.length > 0) {
      let u = function (p) {
        return Promise.all(
          p.map((y) =>
            Promise.resolve(y).then(
              (g) => ({ status: "fulfilled", value: g }),
              (g) => ({ status: "rejected", reason: g }),
            ),
          ),
        );
      };
      document.getElementsByTagName("link");
      const f = document.querySelector("meta[property=csp-nonce]"),
        h = f?.nonce || f?.getAttribute("nonce");
      o = u(
        i.map((p) => {
          if (((p = C2(p)), p in lg)) return;
          lg[p] = !0;
          const y = p.endsWith(".css"),
            g = y ? '[rel="stylesheet"]' : "";
          if (document.querySelector(`link[href="${p}"]${g}`)) return;
          const v = document.createElement("link");
          if (
            ((v.rel = y ? "stylesheet" : R2),
            y || (v.as = "script"),
            (v.crossOrigin = ""),
            (v.href = p),
            h && v.setAttribute("nonce", h),
            document.head.appendChild(v),
            y)
          )
            return new Promise((b, S) => {
              (v.addEventListener("load", b),
                v.addEventListener("error", () => S(Error(`Unable to preload CSS for ${p}`))));
            });
        }),
      );
    }
    function l(u) {
      const f = new Event("vite:preloadError", { cancelable: !0 });
      if (((f.payload = u), window.dispatchEvent(f), !f.defaultPrevented)) throw u;
    }
    return o.then((u) => {
      for (const f of u || []) f.status === "rejected" && l(f.reason);
      return t().catch(l);
    });
  };
var Gf = { exports: {} },
  Io = {};
var cg;
function O2() {
  if (cg) return Io;
  cg = 1;
  var c = Symbol.for("react.transitional.element"),
    t = Symbol.for("react.fragment");
  function i(s, o, l) {
    var u = null;
    if ((l !== void 0 && (u = "" + l), o.key !== void 0 && (u = "" + o.key), "key" in o)) {
      l = {};
      for (var f in o) f !== "key" && (l[f] = o[f]);
    } else l = o;
    return ((o = l.ref), { $$typeof: c, type: s, key: u, ref: o !== void 0 ? o : null, props: l });
  }
  return ((Io.Fragment = t), (Io.jsx = i), (Io.jsxs = i), Io);
}
var ug;
function B2() {
  return (ug || ((ug = 1), (Gf.exports = O2())), Gf.exports);
}
var J = B2(),
  jf = { exports: {} },
  Zo = {},
  Yf = { exports: {} },
  qf = {};
var hg;
function D2() {
  return (
    hg ||
      ((hg = 1),
      (function (c) {
        function t(L, I) {
          var nt = L.length;
          L.push(I);
          t: for (; 0 < nt;) {
            var lt = (nt - 1) >>> 1,
              ut = L[lt];
            if (0 < o(ut, I)) ((L[lt] = I), (L[nt] = ut), (nt = lt));
            else break t;
          }
        }
        function i(L) {
          return L.length === 0 ? null : L[0];
        }
        function s(L) {
          if (L.length === 0) return null;
          var I = L[0],
            nt = L.pop();
          if (nt !== I) {
            L[0] = nt;
            t: for (var lt = 0, ut = L.length, gt = ut >>> 1; lt < gt;) {
              var zt = 2 * (lt + 1) - 1,
                pt = L[zt],
                Zt = zt + 1,
                Ee = L[Zt];
              if (0 > o(pt, nt))
                Zt < ut && 0 > o(Ee, pt)
                  ? ((L[lt] = Ee), (L[Zt] = nt), (lt = Zt))
                  : ((L[lt] = pt), (L[zt] = nt), (lt = zt));
              else if (Zt < ut && 0 > o(Ee, nt)) ((L[lt] = Ee), (L[Zt] = nt), (lt = Zt));
              else break t;
            }
          }
          return I;
        }
        function o(L, I) {
          var nt = L.sortIndex - I.sortIndex;
          return nt !== 0 ? nt : L.id - I.id;
        }
        if (
          ((c.unstable_now = void 0),
          typeof performance == "object" && typeof performance.now == "function")
        ) {
          var l = performance;
          c.unstable_now = function () {
            return l.now();
          };
        } else {
          var u = Date,
            f = u.now();
          c.unstable_now = function () {
            return u.now() - f;
          };
        }
        var h = [],
          p = [],
          y = 1,
          g = null,
          v = 3,
          b = !1,
          S = !1,
          A = !1,
          M = !1,
          T = typeof setTimeout == "function" ? setTimeout : null,
          O = typeof clearTimeout == "function" ? clearTimeout : null,
          C = typeof setImmediate < "u" ? setImmediate : null;
        function E(L) {
          for (var I = i(p); I !== null;) {
            if (I.callback === null) s(p);
            else if (I.startTime <= L) (s(p), (I.sortIndex = I.expirationTime), t(h, I));
            else break;
            I = i(p);
          }
        }
        function U(L) {
          if (((A = !1), E(L), !S))
            if (i(h) !== null) ((S = !0), q || ((q = !0), rt()));
            else {
              var I = i(p);
              I !== null && ft(U, I.startTime - L);
            }
        }
        var q = !1,
          X = -1,
          G = 5,
          W = -1;
        function P() {
          return M ? !0 : !(c.unstable_now() - W < G);
        }
        function Q() {
          if (((M = !1), q)) {
            var L = c.unstable_now();
            W = L;
            var I = !0;
            try {
              t: {
                ((S = !1), A && ((A = !1), O(X), (X = -1)), (b = !0));
                var nt = v;
                try {
                  e: {
                    for (E(L), g = i(h); g !== null && !(g.expirationTime > L && P());) {
                      var lt = g.callback;
                      if (typeof lt == "function") {
                        ((g.callback = null), (v = g.priorityLevel));
                        var ut = lt(g.expirationTime <= L);
                        if (((L = c.unstable_now()), typeof ut == "function")) {
                          ((g.callback = ut), E(L), (I = !0));
                          break e;
                        }
                        (g === i(h) && s(h), E(L));
                      } else s(h);
                      g = i(h);
                    }
                    if (g !== null) I = !0;
                    else {
                      var gt = i(p);
                      (gt !== null && ft(U, gt.startTime - L), (I = !1));
                    }
                  }
                  break t;
                } finally {
                  ((g = null), (v = nt), (b = !1));
                }
                I = void 0;
              }
            } finally {
              I ? rt() : (q = !1);
            }
          }
        }
        var rt;
        if (typeof C == "function")
          rt = function () {
            C(Q);
          };
        else if (typeof MessageChannel < "u") {
          var ht = new MessageChannel(),
            xt = ht.port2;
          ((ht.port1.onmessage = Q),
            (rt = function () {
              xt.postMessage(null);
            }));
        } else
          rt = function () {
            T(Q, 0);
          };
        function ft(L, I) {
          X = T(function () {
            L(c.unstable_now());
          }, I);
        }
        ((c.unstable_IdlePriority = 5),
          (c.unstable_ImmediatePriority = 1),
          (c.unstable_LowPriority = 4),
          (c.unstable_NormalPriority = 3),
          (c.unstable_Profiling = null),
          (c.unstable_UserBlockingPriority = 2),
          (c.unstable_cancelCallback = function (L) {
            L.callback = null;
          }),
          (c.unstable_forceFrameRate = function (L) {
            0 > L || 125 < L
              ? console.error(
                  "forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported",
                )
              : (G = 0 < L ? Math.floor(1e3 / L) : 5);
          }),
          (c.unstable_getCurrentPriorityLevel = function () {
            return v;
          }),
          (c.unstable_next = function (L) {
            switch (v) {
              case 1:
              case 2:
              case 3:
                var I = 3;
                break;
              default:
                I = v;
            }
            var nt = v;
            v = I;
            try {
              return L();
            } finally {
              v = nt;
            }
          }),
          (c.unstable_requestPaint = function () {
            M = !0;
          }),
          (c.unstable_runWithPriority = function (L, I) {
            switch (L) {
              case 1:
              case 2:
              case 3:
              case 4:
              case 5:
                break;
              default:
                L = 3;
            }
            var nt = v;
            v = L;
            try {
              return I();
            } finally {
              v = nt;
            }
          }),
          (c.unstable_scheduleCallback = function (L, I, nt) {
            var lt = c.unstable_now();
            switch (
              (typeof nt == "object" && nt !== null
                ? ((nt = nt.delay), (nt = typeof nt == "number" && 0 < nt ? lt + nt : lt))
                : (nt = lt),
              L)
            ) {
              case 1:
                var ut = -1;
                break;
              case 2:
                ut = 250;
                break;
              case 5:
                ut = 1073741823;
                break;
              case 4:
                ut = 1e4;
                break;
              default:
                ut = 5e3;
            }
            return (
              (ut = nt + ut),
              (L = {
                id: y++,
                callback: I,
                priorityLevel: L,
                startTime: nt,
                expirationTime: ut,
                sortIndex: -1,
              }),
              nt > lt
                ? ((L.sortIndex = nt),
                  t(p, L),
                  i(h) === null && L === i(p) && (A ? (O(X), (X = -1)) : (A = !0), ft(U, nt - lt)))
                : ((L.sortIndex = ut), t(h, L), S || b || ((S = !0), q || ((q = !0), rt()))),
              L
            );
          }),
          (c.unstable_shouldYield = P),
          (c.unstable_wrapCallback = function (L) {
            var I = v;
            return function () {
              var nt = v;
              v = I;
              try {
                return L.apply(this, arguments);
              } finally {
                v = nt;
              }
            };
          }));
      })(qf)),
    qf
  );
}
var fg;
function N2() {
  return (fg || ((fg = 1), (Yf.exports = D2())), Yf.exports);
}
var Xf = { exports: {} },
  Oe = {};
var dg;
function U2() {
  if (dg) return Oe;
  dg = 1;
  var c = p1();
  function t(h) {
    var p = "https://react.dev/errors/" + h;
    if (1 < arguments.length) {
      p += "?args[]=" + encodeURIComponent(arguments[1]);
      for (var y = 2; y < arguments.length; y++) p += "&args[]=" + encodeURIComponent(arguments[y]);
    }
    return (
      "Minified React error #" +
      h +
      "; visit " +
      p +
      " for the full message or use the non-minified dev environment for full errors and additional helpful warnings."
    );
  }
  function i() {}
  var s = {
      d: {
        f: i,
        r: function () {
          throw Error(t(522));
        },
        D: i,
        C: i,
        L: i,
        m: i,
        X: i,
        S: i,
        M: i,
      },
      p: 0,
      findDOMNode: null,
    },
    o = Symbol.for("react.portal");
  function l(h, p, y) {
    var g = 3 < arguments.length && arguments[3] !== void 0 ? arguments[3] : null;
    return {
      $$typeof: o,
      key: g == null ? null : "" + g,
      children: h,
      containerInfo: p,
      implementation: y,
    };
  }
  var u = c.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;
  function f(h, p) {
    if (h === "font") return "";
    if (typeof p == "string") return p === "use-credentials" ? p : "";
  }
  return (
    (Oe.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE = s),
    (Oe.createPortal = function (h, p) {
      var y = 2 < arguments.length && arguments[2] !== void 0 ? arguments[2] : null;
      if (!p || (p.nodeType !== 1 && p.nodeType !== 9 && p.nodeType !== 11)) throw Error(t(299));
      return l(h, p, null, y);
    }),
    (Oe.flushSync = function (h) {
      var p = u.T,
        y = s.p;
      try {
        if (((u.T = null), (s.p = 2), h)) return h();
      } finally {
        ((u.T = p), (s.p = y), s.d.f());
      }
    }),
    (Oe.preconnect = function (h, p) {
      typeof h == "string" &&
        (p
          ? ((p = p.crossOrigin),
            (p = typeof p == "string" ? (p === "use-credentials" ? p : "") : void 0))
          : (p = null),
        s.d.C(h, p));
    }),
    (Oe.prefetchDNS = function (h) {
      typeof h == "string" && s.d.D(h);
    }),
    (Oe.preinit = function (h, p) {
      if (typeof h == "string" && p && typeof p.as == "string") {
        var y = p.as,
          g = f(y, p.crossOrigin),
          v = typeof p.integrity == "string" ? p.integrity : void 0,
          b = typeof p.fetchPriority == "string" ? p.fetchPriority : void 0;
        y === "style"
          ? s.d.S(h, typeof p.precedence == "string" ? p.precedence : void 0, {
              crossOrigin: g,
              integrity: v,
              fetchPriority: b,
            })
          : y === "script" &&
            s.d.X(h, {
              crossOrigin: g,
              integrity: v,
              fetchPriority: b,
              nonce: typeof p.nonce == "string" ? p.nonce : void 0,
            });
      }
    }),
    (Oe.preinitModule = function (h, p) {
      if (typeof h == "string")
        if (typeof p == "object" && p !== null) {
          if (p.as == null || p.as === "script") {
            var y = f(p.as, p.crossOrigin);
            s.d.M(h, {
              crossOrigin: y,
              integrity: typeof p.integrity == "string" ? p.integrity : void 0,
              nonce: typeof p.nonce == "string" ? p.nonce : void 0,
            });
          }
        } else p == null && s.d.M(h);
    }),
    (Oe.preload = function (h, p) {
      if (typeof h == "string" && typeof p == "object" && p !== null && typeof p.as == "string") {
        var y = p.as,
          g = f(y, p.crossOrigin);
        s.d.L(h, y, {
          crossOrigin: g,
          integrity: typeof p.integrity == "string" ? p.integrity : void 0,
          nonce: typeof p.nonce == "string" ? p.nonce : void 0,
          type: typeof p.type == "string" ? p.type : void 0,
          fetchPriority: typeof p.fetchPriority == "string" ? p.fetchPriority : void 0,
          referrerPolicy: typeof p.referrerPolicy == "string" ? p.referrerPolicy : void 0,
          imageSrcSet: typeof p.imageSrcSet == "string" ? p.imageSrcSet : void 0,
          imageSizes: typeof p.imageSizes == "string" ? p.imageSizes : void 0,
          media: typeof p.media == "string" ? p.media : void 0,
        });
      }
    }),
    (Oe.preloadModule = function (h, p) {
      if (typeof h == "string")
        if (p) {
          var y = f(p.as, p.crossOrigin);
          s.d.m(h, {
            as: typeof p.as == "string" && p.as !== "script" ? p.as : void 0,
            crossOrigin: y,
            integrity: typeof p.integrity == "string" ? p.integrity : void 0,
          });
        } else s.d.m(h);
    }),
    (Oe.requestFormReset = function (h) {
      s.d.r(h);
    }),
    (Oe.unstable_batchedUpdates = function (h, p) {
      return h(p);
    }),
    (Oe.useFormState = function (h, p, y) {
      return u.H.useFormState(h, p, y);
    }),
    (Oe.useFormStatus = function () {
      return u.H.useHostTransitionStatus();
    }),
    (Oe.version = "19.2.5"),
    Oe
  );
}
var pg;
function F2() {
  if (pg) return Xf.exports;
  pg = 1;
  function c() {
    if (!(
      typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ > "u" ||
      typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE != "function"
    ))
      try {
        __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(c);
      } catch (t) {
        console.error(t);
      }
  }
  return (c(), (Xf.exports = U2()), Xf.exports);
}
var mg;
function L2() {
  if (mg) return Zo;
  mg = 1;
  var c = N2(),
    t = p1(),
    i = F2();
  function s(e) {
    var n = "https://react.dev/errors/" + e;
    if (1 < arguments.length) {
      n += "?args[]=" + encodeURIComponent(arguments[1]);
      for (var a = 2; a < arguments.length; a++) n += "&args[]=" + encodeURIComponent(arguments[a]);
    }
    return (
      "Minified React error #" +
      e +
      "; visit " +
      n +
      " for the full message or use the non-minified dev environment for full errors and additional helpful warnings."
    );
  }
  function o(e) {
    return !(!e || (e.nodeType !== 1 && e.nodeType !== 9 && e.nodeType !== 11));
  }
  function l(e) {
    var n = e,
      a = e;
    if (e.alternate) for (; n.return;) n = n.return;
    else {
      e = n;
      do ((n = e), (n.flags & 4098) !== 0 && (a = n.return), (e = n.return));
      while (e);
    }
    return n.tag === 3 ? a : null;
  }
  function u(e) {
    if (e.tag === 13) {
      var n = e.memoizedState;
      if ((n === null && ((e = e.alternate), e !== null && (n = e.memoizedState)), n !== null))
        return n.dehydrated;
    }
    return null;
  }
  function f(e) {
    if (e.tag === 31) {
      var n = e.memoizedState;
      if ((n === null && ((e = e.alternate), e !== null && (n = e.memoizedState)), n !== null))
        return n.dehydrated;
    }
    return null;
  }
  function h(e) {
    if (l(e) !== e) throw Error(s(188));
  }
  function p(e) {
    var n = e.alternate;
    if (!n) {
      if (((n = l(e)), n === null)) throw Error(s(188));
      return n !== e ? null : e;
    }
    for (var a = e, r = n; ;) {
      var d = a.return;
      if (d === null) break;
      var m = d.alternate;
      if (m === null) {
        if (((r = d.return), r !== null)) {
          a = r;
          continue;
        }
        break;
      }
      if (d.child === m.child) {
        for (m = d.child; m;) {
          if (m === a) return (h(d), e);
          if (m === r) return (h(d), n);
          m = m.sibling;
        }
        throw Error(s(188));
      }
      if (a.return !== r.return) ((a = d), (r = m));
      else {
        for (var x = !1, w = d.child; w;) {
          if (w === a) {
            ((x = !0), (a = d), (r = m));
            break;
          }
          if (w === r) {
            ((x = !0), (r = d), (a = m));
            break;
          }
          w = w.sibling;
        }
        if (!x) {
          for (w = m.child; w;) {
            if (w === a) {
              ((x = !0), (a = m), (r = d));
              break;
            }
            if (w === r) {
              ((x = !0), (r = m), (a = d));
              break;
            }
            w = w.sibling;
          }
          if (!x) throw Error(s(189));
        }
      }
      if (a.alternate !== r) throw Error(s(190));
    }
    if (a.tag !== 3) throw Error(s(188));
    return a.stateNode.current === a ? e : n;
  }
  function y(e) {
    var n = e.tag;
    if (n === 5 || n === 26 || n === 27 || n === 6) return e;
    for (e = e.child; e !== null;) {
      if (((n = y(e)), n !== null)) return n;
      e = e.sibling;
    }
    return null;
  }
  var g = Object.assign,
    v = Symbol.for("react.element"),
    b = Symbol.for("react.transitional.element"),
    S = Symbol.for("react.portal"),
    A = Symbol.for("react.fragment"),
    M = Symbol.for("react.strict_mode"),
    T = Symbol.for("react.profiler"),
    O = Symbol.for("react.consumer"),
    C = Symbol.for("react.context"),
    E = Symbol.for("react.forward_ref"),
    U = Symbol.for("react.suspense"),
    q = Symbol.for("react.suspense_list"),
    X = Symbol.for("react.memo"),
    G = Symbol.for("react.lazy"),
    W = Symbol.for("react.activity"),
    P = Symbol.for("react.memo_cache_sentinel"),
    Q = Symbol.iterator;
  function rt(e) {
    return e === null || typeof e != "object"
      ? null
      : ((e = (Q && e[Q]) || e["@@iterator"]), typeof e == "function" ? e : null);
  }
  var ht = Symbol.for("react.client.reference");
  function xt(e) {
    if (e == null) return null;
    if (typeof e == "function") return e.$$typeof === ht ? null : e.displayName || e.name || null;
    if (typeof e == "string") return e;
    switch (e) {
      case A:
        return "Fragment";
      case T:
        return "Profiler";
      case M:
        return "StrictMode";
      case U:
        return "Suspense";
      case q:
        return "SuspenseList";
      case W:
        return "Activity";
    }
    if (typeof e == "object")
      switch (e.$$typeof) {
        case S:
          return "Portal";
        case C:
          return e.displayName || "Context";
        case O:
          return (e._context.displayName || "Context") + ".Consumer";
        case E:
          var n = e.render;
          return (
            (e = e.displayName),
            e ||
              ((e = n.displayName || n.name || ""),
              (e = e !== "" ? "ForwardRef(" + e + ")" : "ForwardRef")),
            e
          );
        case X:
          return ((n = e.displayName || null), n !== null ? n : xt(e.type) || "Memo");
        case G:
          ((n = e._payload), (e = e._init));
          try {
            return xt(e(n));
          } catch {}
      }
    return null;
  }
  var ft = Array.isArray,
    L = t.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE,
    I = i.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE,
    nt = { pending: !1, data: null, method: null, action: null },
    lt = [],
    ut = -1;
  function gt(e) {
    return { current: e };
  }
  function zt(e) {
    0 > ut || ((e.current = lt[ut]), (lt[ut] = null), ut--);
  }
  function pt(e, n) {
    (ut++, (lt[ut] = e.current), (e.current = n));
  }
  var Zt = gt(null),
    Ee = gt(null),
    Fi = gt(null),
    Us = gt(null);
  function os(e, n) {
    switch ((pt(Fi, n), pt(Ee, e), pt(Zt, null), n.nodeType)) {
      case 9:
      case 11:
        e = (e = n.documentElement) && (e = e.namespaceURI) ? Oy(e) : 0;
        break;
      default:
        if (((e = n.tagName), (n = n.namespaceURI))) ((n = Oy(n)), (e = By(n, e)));
        else
          switch (e) {
            case "svg":
              e = 1;
              break;
            case "math":
              e = 2;
              break;
            default:
              e = 0;
          }
    }
    (zt(Zt), pt(Zt, e));
  }
  function Re() {
    (zt(Zt), zt(Ee), zt(Fi));
  }
  function An(e) {
    e.memoizedState !== null && pt(Us, e);
    var n = Zt.current,
      a = By(n, e.type);
    n !== a && (pt(Ee, e), pt(Zt, a));
  }
  function Fs(e) {
    (Ee.current === e && (zt(Zt), zt(Ee)), Us.current === e && (zt(Us), (jo._currentValue = nt)));
  }
  var Ie, ri;
  function Z(e) {
    if (Ie === void 0)
      try {
        throw Error();
      } catch (a) {
        var n = a.stack.trim().match(/\n( *(at )?)/);
        ((Ie = (n && n[1]) || ""),
          (ri =
            -1 <
            a.stack.indexOf(`
    at`)
              ? " (<anonymous>)"
              : -1 < a.stack.indexOf("@")
                ? "@unknown:0:0"
                : ""));
      }
    return (
      `
` +
      Ie +
      e +
      ri
    );
  }
  var K = !1;
  function $(e, n) {
    if (!e || K) return "";
    K = !0;
    var a = Error.prepareStackTrace;
    Error.prepareStackTrace = void 0;
    try {
      var r = {
        DetermineComponentFrameRoot: function () {
          try {
            if (n) {
              var Y = function () {
                throw Error();
              };
              if (
                (Object.defineProperty(Y.prototype, "props", {
                  set: function () {
                    throw Error();
                  },
                }),
                typeof Reflect == "object" && Reflect.construct)
              ) {
                try {
                  Reflect.construct(Y, []);
                } catch (k) {
                  var F = k;
                }
                Reflect.construct(e, [], Y);
              } else {
                try {
                  Y.call();
                } catch (k) {
                  F = k;
                }
                e.call(Y.prototype);
              }
            } else {
              try {
                throw Error();
              } catch (k) {
                F = k;
              }
              (Y = e()) && typeof Y.catch == "function" && Y.catch(function () {});
            }
          } catch (k) {
            if (k && F && typeof k.stack == "string") return [k.stack, F.stack];
          }
          return [null, null];
        },
      };
      r.DetermineComponentFrameRoot.displayName = "DetermineComponentFrameRoot";
      var d = Object.getOwnPropertyDescriptor(r.DetermineComponentFrameRoot, "name");
      d &&
        d.configurable &&
        Object.defineProperty(r.DetermineComponentFrameRoot, "name", {
          value: "DetermineComponentFrameRoot",
        });
      var m = r.DetermineComponentFrameRoot(),
        x = m[0],
        w = m[1];
      if (x && w) {
        var _ = x.split(`
`),
          N = w.split(`
`);
        for (d = r = 0; r < _.length && !_[r].includes("DetermineComponentFrameRoot");) r++;
        for (; d < N.length && !N[d].includes("DetermineComponentFrameRoot");) d++;
        if (r === _.length || d === N.length)
          for (r = _.length - 1, d = N.length - 1; 1 <= r && 0 <= d && _[r] !== N[d];) d--;
        for (; 1 <= r && 0 <= d; r--, d--)
          if (_[r] !== N[d]) {
            if (r !== 1 || d !== 1)
              do
                if ((r--, d--, 0 > d || _[r] !== N[d])) {
                  var V =
                    `
` + _[r].replace(" at new ", " at ");
                  return (
                    e.displayName &&
                      V.includes("<anonymous>") &&
                      (V = V.replace("<anonymous>", e.displayName)),
                    V
                  );
                }
              while (1 <= r && 0 <= d);
            break;
          }
      }
    } finally {
      ((K = !1), (Error.prepareStackTrace = a));
    }
    return (a = e ? e.displayName || e.name : "") ? Z(a) : "";
  }
  function at(e, n) {
    switch (e.tag) {
      case 26:
      case 27:
      case 5:
        return Z(e.type);
      case 16:
        return Z("Lazy");
      case 13:
        return e.child !== n && n !== null ? Z("Suspense Fallback") : Z("Suspense");
      case 19:
        return Z("SuspenseList");
      case 0:
      case 15:
        return $(e.type, !1);
      case 11:
        return $(e.type.render, !1);
      case 1:
        return $(e.type, !0);
      case 31:
        return Z("Activity");
      default:
        return "";
    }
  }
  function st(e) {
    try {
      var n = "",
        a = null;
      do ((n += at(e, a)), (a = e), (e = e.return));
      while (e);
      return n;
    } catch (r) {
      return (
        `
Error generating stack: ` +
        r.message +
        `
` +
        r.stack
      );
    }
  }
  var Mt = Object.prototype.hasOwnProperty,
    mt = c.unstable_scheduleCallback,
    Ht = c.unstable_cancelCallback,
    Pt = c.unstable_shouldYield,
    se = c.unstable_requestPaint,
    qt = c.unstable_now,
    qi = c.unstable_getCurrentPriorityLevel,
    Ce = c.unstable_ImmediatePriority,
    $a = c.unstable_UserBlockingPriority,
    rs = c.unstable_NormalPriority,
    Dr = c.unstable_LowPriority,
    Nr = c.unstable_IdlePriority,
    zu = c.log,
    Ur = c.unstable_setDisableYieldValue,
    Mn = null,
    Ze = null;
  function _n(e) {
    if ((typeof zu == "function" && Ur(e), Ze && typeof Ze.setStrictMode == "function"))
      try {
        Ze.setStrictMode(Mn, e);
      } catch {}
  }
  var Pe = Math.clz32 ? Math.clz32 : db,
    hb = Math.log,
    fb = Math.LN2;
  function db(e) {
    return ((e >>>= 0), e === 0 ? 32 : (31 - ((hb(e) / fb) | 0)) | 0);
  }
  var Fr = 256,
    Lr = 262144,
    kr = 4194304;
  function ls(e) {
    var n = e & 42;
    if (n !== 0) return n;
    switch (e & -e) {
      case 1:
        return 1;
      case 2:
        return 2;
      case 4:
        return 4;
      case 8:
        return 8;
      case 16:
        return 16;
      case 32:
        return 32;
      case 64:
        return 64;
      case 128:
        return 128;
      case 256:
      case 512:
      case 1024:
      case 2048:
      case 4096:
      case 8192:
      case 16384:
      case 32768:
      case 65536:
      case 131072:
        return e & 261888;
      case 262144:
      case 524288:
      case 1048576:
      case 2097152:
        return e & 3932160;
      case 4194304:
      case 8388608:
      case 16777216:
      case 33554432:
        return e & 62914560;
      case 67108864:
        return 67108864;
      case 134217728:
        return 134217728;
      case 268435456:
        return 268435456;
      case 536870912:
        return 536870912;
      case 1073741824:
        return 0;
      default:
        return e;
    }
  }
  function Hr(e, n, a) {
    var r = e.pendingLanes;
    if (r === 0) return 0;
    var d = 0,
      m = e.suspendedLanes,
      x = e.pingedLanes;
    e = e.warmLanes;
    var w = r & 134217727;
    return (
      w !== 0
        ? ((r = w & ~m),
          r !== 0
            ? (d = ls(r))
            : ((x &= w), x !== 0 ? (d = ls(x)) : a || ((a = w & ~e), a !== 0 && (d = ls(a)))))
        : ((w = r & ~m),
          w !== 0
            ? (d = ls(w))
            : x !== 0
              ? (d = ls(x))
              : a || ((a = r & ~e), a !== 0 && (d = ls(a)))),
      d === 0
        ? 0
        : n !== 0 &&
            n !== d &&
            (n & m) === 0 &&
            ((m = d & -d), (a = n & -n), m >= a || (m === 32 && (a & 4194048) !== 0))
          ? n
          : d
    );
  }
  function to(e, n) {
    return (e.pendingLanes & ~(e.suspendedLanes & ~e.pingedLanes) & n) === 0;
  }
  function pb(e, n) {
    switch (e) {
      case 1:
      case 2:
      case 4:
      case 8:
      case 64:
        return n + 250;
      case 16:
      case 32:
      case 128:
      case 256:
      case 512:
      case 1024:
      case 2048:
      case 4096:
      case 8192:
      case 16384:
      case 32768:
      case 65536:
      case 131072:
      case 262144:
      case 524288:
      case 1048576:
      case 2097152:
        return n + 5e3;
      case 4194304:
      case 8388608:
      case 16777216:
      case 33554432:
        return -1;
      case 67108864:
      case 134217728:
      case 268435456:
      case 536870912:
      case 1073741824:
        return -1;
      default:
        return -1;
    }
  }
  function f0() {
    var e = kr;
    return ((kr <<= 1), (kr & 62914560) === 0 && (kr = 4194304), e);
  }
  function Eu(e) {
    for (var n = [], a = 0; 31 > a; a++) n.push(e);
    return n;
  }
  function eo(e, n) {
    ((e.pendingLanes |= n),
      n !== 268435456 && ((e.suspendedLanes = 0), (e.pingedLanes = 0), (e.warmLanes = 0)));
  }
  function mb(e, n, a, r, d, m) {
    var x = e.pendingLanes;
    ((e.pendingLanes = a),
      (e.suspendedLanes = 0),
      (e.pingedLanes = 0),
      (e.warmLanes = 0),
      (e.expiredLanes &= a),
      (e.entangledLanes &= a),
      (e.errorRecoveryDisabledLanes &= a),
      (e.shellSuspendCounter = 0));
    var w = e.entanglements,
      _ = e.expirationTimes,
      N = e.hiddenUpdates;
    for (a = x & ~a; 0 < a;) {
      var V = 31 - Pe(a),
        Y = 1 << V;
      ((w[V] = 0), (_[V] = -1));
      var F = N[V];
      if (F !== null)
        for (N[V] = null, V = 0; V < F.length; V++) {
          var k = F[V];
          k !== null && (k.lane &= -536870913);
        }
      a &= ~Y;
    }
    (r !== 0 && d0(e, r, 0),
      m !== 0 && d === 0 && e.tag !== 0 && (e.suspendedLanes |= m & ~(x & ~n)));
  }
  function d0(e, n, a) {
    ((e.pendingLanes |= n), (e.suspendedLanes &= ~n));
    var r = 31 - Pe(n);
    ((e.entangledLanes |= n),
      (e.entanglements[r] = e.entanglements[r] | 1073741824 | (a & 261930)));
  }
  function p0(e, n) {
    var a = (e.entangledLanes |= n);
    for (e = e.entanglements; a;) {
      var r = 31 - Pe(a),
        d = 1 << r;
      ((d & n) | (e[r] & n) && (e[r] |= n), (a &= ~d));
    }
  }
  function m0(e, n) {
    var a = n & -n;
    return ((a = (a & 42) !== 0 ? 1 : Ru(a)), (a & (e.suspendedLanes | n)) !== 0 ? 0 : a);
  }
  function Ru(e) {
    switch (e) {
      case 2:
        e = 1;
        break;
      case 8:
        e = 4;
        break;
      case 32:
        e = 16;
        break;
      case 256:
      case 512:
      case 1024:
      case 2048:
      case 4096:
      case 8192:
      case 16384:
      case 32768:
      case 65536:
      case 131072:
      case 262144:
      case 524288:
      case 1048576:
      case 2097152:
      case 4194304:
      case 8388608:
      case 16777216:
      case 33554432:
        e = 128;
        break;
      case 268435456:
        e = 134217728;
        break;
      default:
        e = 0;
    }
    return e;
  }
  function Cu(e) {
    return ((e &= -e), 2 < e ? (8 < e ? ((e & 134217727) !== 0 ? 32 : 268435456) : 8) : 2);
  }
  function y0() {
    var e = I.p;
    return e !== 0 ? e : ((e = window.event), e === void 0 ? 32 : eg(e.type));
  }
  function g0(e, n) {
    var a = I.p;
    try {
      return ((I.p = e), n());
    } finally {
      I.p = a;
    }
  }
  var Tn = Math.random().toString(36).slice(2),
    Se = "__reactFiber$" + Tn,
    ke = "__reactProps$" + Tn,
    Ls = "__reactContainer$" + Tn,
    Ou = "__reactEvents$" + Tn,
    yb = "__reactListeners$" + Tn,
    gb = "__reactHandles$" + Tn,
    v0 = "__reactResources$" + Tn,
    io = "__reactMarker$" + Tn;
  function Bu(e) {
    (delete e[Se], delete e[ke], delete e[Ou], delete e[yb], delete e[gb]);
  }
  function ks(e) {
    var n = e[Se];
    if (n) return n;
    for (var a = e.parentNode; a;) {
      if ((n = a[Ls] || a[Se])) {
        if (((a = n.alternate), n.child !== null || (a !== null && a.child !== null)))
          for (e = Hy(e); e !== null;) {
            if ((a = e[Se])) return a;
            e = Hy(e);
          }
        return n;
      }
      ((e = a), (a = e.parentNode));
    }
    return null;
  }
  function Hs(e) {
    if ((e = e[Se] || e[Ls])) {
      var n = e.tag;
      if (n === 5 || n === 6 || n === 13 || n === 31 || n === 26 || n === 27 || n === 3) return e;
    }
    return null;
  }
  function no(e) {
    var n = e.tag;
    if (n === 5 || n === 26 || n === 27 || n === 6) return e.stateNode;
    throw Error(s(33));
  }
  function Vs(e) {
    var n = e[v0];
    return (n || (n = e[v0] = { hoistableStyles: new Map(), hoistableScripts: new Map() }), n);
  }
  function me(e) {
    e[io] = !0;
  }
  var b0 = new Set(),
    x0 = {};
  function cs(e, n) {
    (Gs(e, n), Gs(e + "Capture", n));
  }
  function Gs(e, n) {
    for (x0[e] = n, e = 0; e < n.length; e++) b0.add(n[e]);
  }
  var vb = RegExp(
      "^[:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD][:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD\\-.0-9\\u00B7\\u0300-\\u036F\\u203F-\\u2040]*$",
    ),
    S0 = {},
    w0 = {};
  function bb(e) {
    return Mt.call(w0, e)
      ? !0
      : Mt.call(S0, e)
        ? !1
        : vb.test(e)
          ? (w0[e] = !0)
          : ((S0[e] = !0), !1);
  }
  function Vr(e, n, a) {
    if (bb(n))
      if (a === null) e.removeAttribute(n);
      else {
        switch (typeof a) {
          case "undefined":
          case "function":
          case "symbol":
            e.removeAttribute(n);
            return;
          case "boolean":
            var r = n.toLowerCase().slice(0, 5);
            if (r !== "data-" && r !== "aria-") {
              e.removeAttribute(n);
              return;
            }
        }
        e.setAttribute(n, "" + a);
      }
  }
  function Gr(e, n, a) {
    if (a === null) e.removeAttribute(n);
    else {
      switch (typeof a) {
        case "undefined":
        case "function":
        case "symbol":
        case "boolean":
          e.removeAttribute(n);
          return;
      }
      e.setAttribute(n, "" + a);
    }
  }
  function Xi(e, n, a, r) {
    if (r === null) e.removeAttribute(a);
    else {
      switch (typeof r) {
        case "undefined":
        case "function":
        case "symbol":
        case "boolean":
          e.removeAttribute(a);
          return;
      }
      e.setAttributeNS(n, a, "" + r);
    }
  }
  function li(e) {
    switch (typeof e) {
      case "bigint":
      case "boolean":
      case "number":
      case "string":
      case "undefined":
        return e;
      case "object":
        return e;
      default:
        return "";
    }
  }
  function A0(e) {
    var n = e.type;
    return (e = e.nodeName) && e.toLowerCase() === "input" && (n === "checkbox" || n === "radio");
  }
  function xb(e, n, a) {
    var r = Object.getOwnPropertyDescriptor(e.constructor.prototype, n);
    if (
      !e.hasOwnProperty(n) &&
      typeof r < "u" &&
      typeof r.get == "function" &&
      typeof r.set == "function"
    ) {
      var d = r.get,
        m = r.set;
      return (
        Object.defineProperty(e, n, {
          configurable: !0,
          get: function () {
            return d.call(this);
          },
          set: function (x) {
            ((a = "" + x), m.call(this, x));
          },
        }),
        Object.defineProperty(e, n, { enumerable: r.enumerable }),
        {
          getValue: function () {
            return a;
          },
          setValue: function (x) {
            a = "" + x;
          },
          stopTracking: function () {
            ((e._valueTracker = null), delete e[n]);
          },
        }
      );
    }
  }
  function Du(e) {
    if (!e._valueTracker) {
      var n = A0(e) ? "checked" : "value";
      e._valueTracker = xb(e, n, "" + e[n]);
    }
  }
  function M0(e) {
    if (!e) return !1;
    var n = e._valueTracker;
    if (!n) return !0;
    var a = n.getValue(),
      r = "";
    return (
      e && (r = A0(e) ? (e.checked ? "true" : "false") : e.value),
      (e = r),
      e !== a ? (n.setValue(e), !0) : !1
    );
  }
  function jr(e) {
    if (((e = e || (typeof document < "u" ? document : void 0)), typeof e > "u")) return null;
    try {
      return e.activeElement || e.body;
    } catch {
      return e.body;
    }
  }
  var Sb = /[\n"\\]/g;
  function ci(e) {
    return e.replace(Sb, function (n) {
      return "\\" + n.charCodeAt(0).toString(16) + " ";
    });
  }
  function Nu(e, n, a, r, d, m, x, w) {
    ((e.name = ""),
      x != null && typeof x != "function" && typeof x != "symbol" && typeof x != "boolean"
        ? (e.type = x)
        : e.removeAttribute("type"),
      n != null
        ? x === "number"
          ? ((n === 0 && e.value === "") || e.value != n) && (e.value = "" + li(n))
          : e.value !== "" + li(n) && (e.value = "" + li(n))
        : (x !== "submit" && x !== "reset") || e.removeAttribute("value"),
      n != null
        ? Uu(e, x, li(n))
        : a != null
          ? Uu(e, x, li(a))
          : r != null && e.removeAttribute("value"),
      d == null && m != null && (e.defaultChecked = !!m),
      d != null && (e.checked = d && typeof d != "function" && typeof d != "symbol"),
      w != null && typeof w != "function" && typeof w != "symbol" && typeof w != "boolean"
        ? (e.name = "" + li(w))
        : e.removeAttribute("name"));
  }
  function _0(e, n, a, r, d, m, x, w) {
    if (
      (m != null &&
        typeof m != "function" &&
        typeof m != "symbol" &&
        typeof m != "boolean" &&
        (e.type = m),
      n != null || a != null)
    ) {
      if (!((m !== "submit" && m !== "reset") || n != null)) {
        Du(e);
        return;
      }
      ((a = a != null ? "" + li(a) : ""),
        (n = n != null ? "" + li(n) : a),
        w || n === e.value || (e.value = n),
        (e.defaultValue = n));
    }
    ((r = r ?? d),
      (r = typeof r != "function" && typeof r != "symbol" && !!r),
      (e.checked = w ? e.checked : !!r),
      (e.defaultChecked = !!r),
      x != null &&
        typeof x != "function" &&
        typeof x != "symbol" &&
        typeof x != "boolean" &&
        (e.name = x),
      Du(e));
  }
  function Uu(e, n, a) {
    (n === "number" && jr(e.ownerDocument) === e) ||
      e.defaultValue === "" + a ||
      (e.defaultValue = "" + a);
  }
  function js(e, n, a, r) {
    if (((e = e.options), n)) {
      n = {};
      for (var d = 0; d < a.length; d++) n["$" + a[d]] = !0;
      for (a = 0; a < e.length; a++)
        ((d = n.hasOwnProperty("$" + e[a].value)),
          e[a].selected !== d && (e[a].selected = d),
          d && r && (e[a].defaultSelected = !0));
    } else {
      for (a = "" + li(a), n = null, d = 0; d < e.length; d++) {
        if (e[d].value === a) {
          ((e[d].selected = !0), r && (e[d].defaultSelected = !0));
          return;
        }
        n !== null || e[d].disabled || (n = e[d]);
      }
      n !== null && (n.selected = !0);
    }
  }
  function T0(e, n, a) {
    if (n != null && ((n = "" + li(n)), n !== e.value && (e.value = n), a == null)) {
      e.defaultValue !== n && (e.defaultValue = n);
      return;
    }
    e.defaultValue = a != null ? "" + li(a) : "";
  }
  function z0(e, n, a, r) {
    if (n == null) {
      if (r != null) {
        if (a != null) throw Error(s(92));
        if (ft(r)) {
          if (1 < r.length) throw Error(s(93));
          r = r[0];
        }
        a = r;
      }
      (a == null && (a = ""), (n = a));
    }
    ((a = li(n)),
      (e.defaultValue = a),
      (r = e.textContent),
      r === a && r !== "" && r !== null && (e.value = r),
      Du(e));
  }
  function Ys(e, n) {
    if (n) {
      var a = e.firstChild;
      if (a && a === e.lastChild && a.nodeType === 3) {
        a.nodeValue = n;
        return;
      }
    }
    e.textContent = n;
  }
  var wb = new Set(
    "animationIterationCount aspectRatio borderImageOutset borderImageSlice borderImageWidth boxFlex boxFlexGroup boxOrdinalGroup columnCount columns flex flexGrow flexPositive flexShrink flexNegative flexOrder gridArea gridRow gridRowEnd gridRowSpan gridRowStart gridColumn gridColumnEnd gridColumnSpan gridColumnStart fontWeight lineClamp lineHeight opacity order orphans scale tabSize widows zIndex zoom fillOpacity floodOpacity stopOpacity strokeDasharray strokeDashoffset strokeMiterlimit strokeOpacity strokeWidth MozAnimationIterationCount MozBoxFlex MozBoxFlexGroup MozLineClamp msAnimationIterationCount msFlex msZoom msFlexGrow msFlexNegative msFlexOrder msFlexPositive msFlexShrink msGridColumn msGridColumnSpan msGridRow msGridRowSpan WebkitAnimationIterationCount WebkitBoxFlex WebKitBoxFlexGroup WebkitBoxOrdinalGroup WebkitColumnCount WebkitColumns WebkitFlex WebkitFlexGrow WebkitFlexPositive WebkitFlexShrink WebkitLineClamp".split(
      " ",
    ),
  );
  function E0(e, n, a) {
    var r = n.indexOf("--") === 0;
    a == null || typeof a == "boolean" || a === ""
      ? r
        ? e.setProperty(n, "")
        : n === "float"
          ? (e.cssFloat = "")
          : (e[n] = "")
      : r
        ? e.setProperty(n, a)
        : typeof a != "number" || a === 0 || wb.has(n)
          ? n === "float"
            ? (e.cssFloat = a)
            : (e[n] = ("" + a).trim())
          : (e[n] = a + "px");
  }
  function R0(e, n, a) {
    if (n != null && typeof n != "object") throw Error(s(62));
    if (((e = e.style), a != null)) {
      for (var r in a)
        !a.hasOwnProperty(r) ||
          (n != null && n.hasOwnProperty(r)) ||
          (r.indexOf("--") === 0
            ? e.setProperty(r, "")
            : r === "float"
              ? (e.cssFloat = "")
              : (e[r] = ""));
      for (var d in n) ((r = n[d]), n.hasOwnProperty(d) && a[d] !== r && E0(e, d, r));
    } else for (var m in n) n.hasOwnProperty(m) && E0(e, m, n[m]);
  }
  function Fu(e) {
    if (e.indexOf("-") === -1) return !1;
    switch (e) {
      case "annotation-xml":
      case "color-profile":
      case "font-face":
      case "font-face-src":
      case "font-face-uri":
      case "font-face-format":
      case "font-face-name":
      case "missing-glyph":
        return !1;
      default:
        return !0;
    }
  }
  var Ab = new Map([
      ["acceptCharset", "accept-charset"],
      ["htmlFor", "for"],
      ["httpEquiv", "http-equiv"],
      ["crossOrigin", "crossorigin"],
      ["accentHeight", "accent-height"],
      ["alignmentBaseline", "alignment-baseline"],
      ["arabicForm", "arabic-form"],
      ["baselineShift", "baseline-shift"],
      ["capHeight", "cap-height"],
      ["clipPath", "clip-path"],
      ["clipRule", "clip-rule"],
      ["colorInterpolation", "color-interpolation"],
      ["colorInterpolationFilters", "color-interpolation-filters"],
      ["colorProfile", "color-profile"],
      ["colorRendering", "color-rendering"],
      ["dominantBaseline", "dominant-baseline"],
      ["enableBackground", "enable-background"],
      ["fillOpacity", "fill-opacity"],
      ["fillRule", "fill-rule"],
      ["floodColor", "flood-color"],
      ["floodOpacity", "flood-opacity"],
      ["fontFamily", "font-family"],
      ["fontSize", "font-size"],
      ["fontSizeAdjust", "font-size-adjust"],
      ["fontStretch", "font-stretch"],
      ["fontStyle", "font-style"],
      ["fontVariant", "font-variant"],
      ["fontWeight", "font-weight"],
      ["glyphName", "glyph-name"],
      ["glyphOrientationHorizontal", "glyph-orientation-horizontal"],
      ["glyphOrientationVertical", "glyph-orientation-vertical"],
      ["horizAdvX", "horiz-adv-x"],
      ["horizOriginX", "horiz-origin-x"],
      ["imageRendering", "image-rendering"],
      ["letterSpacing", "letter-spacing"],
      ["lightingColor", "lighting-color"],
      ["markerEnd", "marker-end"],
      ["markerMid", "marker-mid"],
      ["markerStart", "marker-start"],
      ["overlinePosition", "overline-position"],
      ["overlineThickness", "overline-thickness"],
      ["paintOrder", "paint-order"],
      ["panose-1", "panose-1"],
      ["pointerEvents", "pointer-events"],
      ["renderingIntent", "rendering-intent"],
      ["shapeRendering", "shape-rendering"],
      ["stopColor", "stop-color"],
      ["stopOpacity", "stop-opacity"],
      ["strikethroughPosition", "strikethrough-position"],
      ["strikethroughThickness", "strikethrough-thickness"],
      ["strokeDasharray", "stroke-dasharray"],
      ["strokeDashoffset", "stroke-dashoffset"],
      ["strokeLinecap", "stroke-linecap"],
      ["strokeLinejoin", "stroke-linejoin"],
      ["strokeMiterlimit", "stroke-miterlimit"],
      ["strokeOpacity", "stroke-opacity"],
      ["strokeWidth", "stroke-width"],
      ["textAnchor", "text-anchor"],
      ["textDecoration", "text-decoration"],
      ["textRendering", "text-rendering"],
      ["transformOrigin", "transform-origin"],
      ["underlinePosition", "underline-position"],
      ["underlineThickness", "underline-thickness"],
      ["unicodeBidi", "unicode-bidi"],
      ["unicodeRange", "unicode-range"],
      ["unitsPerEm", "units-per-em"],
      ["vAlphabetic", "v-alphabetic"],
      ["vHanging", "v-hanging"],
      ["vIdeographic", "v-ideographic"],
      ["vMathematical", "v-mathematical"],
      ["vectorEffect", "vector-effect"],
      ["vertAdvY", "vert-adv-y"],
      ["vertOriginX", "vert-origin-x"],
      ["vertOriginY", "vert-origin-y"],
      ["wordSpacing", "word-spacing"],
      ["writingMode", "writing-mode"],
      ["xmlnsXlink", "xmlns:xlink"],
      ["xHeight", "x-height"],
    ]),
    Mb =
      /^[\u0000-\u001F ]*j[\r\n\t]*a[\r\n\t]*v[\r\n\t]*a[\r\n\t]*s[\r\n\t]*c[\r\n\t]*r[\r\n\t]*i[\r\n\t]*p[\r\n\t]*t[\r\n\t]*:/i;
  function Yr(e) {
    return Mb.test("" + e)
      ? "javascript:throw new Error('React has blocked a javascript: URL as a security precaution.')"
      : e;
  }
  function Ii() {}
  var Lu = null;
  function ku(e) {
    return (
      (e = e.target || e.srcElement || window),
      e.correspondingUseElement && (e = e.correspondingUseElement),
      e.nodeType === 3 ? e.parentNode : e
    );
  }
  var qs = null,
    Xs = null;
  function C0(e) {
    var n = Hs(e);
    if (n && (e = n.stateNode)) {
      var a = e[ke] || null;
      t: switch (((e = n.stateNode), n.type)) {
        case "input":
          if (
            (Nu(
              e,
              a.value,
              a.defaultValue,
              a.defaultValue,
              a.checked,
              a.defaultChecked,
              a.type,
              a.name,
            ),
            (n = a.name),
            a.type === "radio" && n != null)
          ) {
            for (a = e; a.parentNode;) a = a.parentNode;
            for (
              a = a.querySelectorAll('input[name="' + ci("" + n) + '"][type="radio"]'), n = 0;
              n < a.length;
              n++
            ) {
              var r = a[n];
              if (r !== e && r.form === e.form) {
                var d = r[ke] || null;
                if (!d) throw Error(s(90));
                Nu(
                  r,
                  d.value,
                  d.defaultValue,
                  d.defaultValue,
                  d.checked,
                  d.defaultChecked,
                  d.type,
                  d.name,
                );
              }
            }
            for (n = 0; n < a.length; n++) ((r = a[n]), r.form === e.form && M0(r));
          }
          break t;
        case "textarea":
          T0(e, a.value, a.defaultValue);
          break t;
        case "select":
          ((n = a.value), n != null && js(e, !!a.multiple, n, !1));
      }
    }
  }
  var Hu = !1;
  function O0(e, n, a) {
    if (Hu) return e(n, a);
    Hu = !0;
    try {
      var r = e(n);
      return r;
    } finally {
      if (
        ((Hu = !1),
        (qs !== null || Xs !== null) &&
          (Cl(), qs && ((n = qs), (e = Xs), (Xs = qs = null), C0(n), e)))
      )
        for (n = 0; n < e.length; n++) C0(e[n]);
    }
  }
  function so(e, n) {
    var a = e.stateNode;
    if (a === null) return null;
    var r = a[ke] || null;
    if (r === null) return null;
    a = r[n];
    t: switch (n) {
      case "onClick":
      case "onClickCapture":
      case "onDoubleClick":
      case "onDoubleClickCapture":
      case "onMouseDown":
      case "onMouseDownCapture":
      case "onMouseMove":
      case "onMouseMoveCapture":
      case "onMouseUp":
      case "onMouseUpCapture":
      case "onMouseEnter":
        ((r = !r.disabled) ||
          ((e = e.type),
          (r = !(e === "button" || e === "input" || e === "select" || e === "textarea"))),
          (e = !r));
        break t;
      default:
        e = !1;
    }
    if (e) return null;
    if (a && typeof a != "function") throw Error(s(231, n, typeof a));
    return a;
  }
  var Zi = !(
      typeof window > "u" ||
      typeof window.document > "u" ||
      typeof window.document.createElement > "u"
    ),
    Vu = !1;
  if (Zi)
    try {
      var ao = {};
      (Object.defineProperty(ao, "passive", {
        get: function () {
          Vu = !0;
        },
      }),
        window.addEventListener("test", ao, ao),
        window.removeEventListener("test", ao, ao));
    } catch {
      Vu = !1;
    }
  var zn = null,
    Gu = null,
    qr = null;
  function B0() {
    if (qr) return qr;
    var e,
      n = Gu,
      a = n.length,
      r,
      d = "value" in zn ? zn.value : zn.textContent,
      m = d.length;
    for (e = 0; e < a && n[e] === d[e]; e++);
    var x = a - e;
    for (r = 1; r <= x && n[a - r] === d[m - r]; r++);
    return (qr = d.slice(e, 1 < r ? 1 - r : void 0));
  }
  function Xr(e) {
    var n = e.keyCode;
    return (
      "charCode" in e ? ((e = e.charCode), e === 0 && n === 13 && (e = 13)) : (e = n),
      e === 10 && (e = 13),
      32 <= e || e === 13 ? e : 0
    );
  }
  function Ir() {
    return !0;
  }
  function D0() {
    return !1;
  }
  function He(e) {
    function n(a, r, d, m, x) {
      ((this._reactName = a),
        (this._targetInst = d),
        (this.type = r),
        (this.nativeEvent = m),
        (this.target = x),
        (this.currentTarget = null));
      for (var w in e) e.hasOwnProperty(w) && ((a = e[w]), (this[w] = a ? a(m) : m[w]));
      return (
        (this.isDefaultPrevented = (
          m.defaultPrevented != null ? m.defaultPrevented : m.returnValue === !1
        )
          ? Ir
          : D0),
        (this.isPropagationStopped = D0),
        this
      );
    }
    return (
      g(n.prototype, {
        preventDefault: function () {
          this.defaultPrevented = !0;
          var a = this.nativeEvent;
          a &&
            (a.preventDefault
              ? a.preventDefault()
              : typeof a.returnValue != "unknown" && (a.returnValue = !1),
            (this.isDefaultPrevented = Ir));
        },
        stopPropagation: function () {
          var a = this.nativeEvent;
          a &&
            (a.stopPropagation
              ? a.stopPropagation()
              : typeof a.cancelBubble != "unknown" && (a.cancelBubble = !0),
            (this.isPropagationStopped = Ir));
        },
        persist: function () {},
        isPersistent: Ir,
      }),
      n
    );
  }
  var us = {
      eventPhase: 0,
      bubbles: 0,
      cancelable: 0,
      timeStamp: function (e) {
        return e.timeStamp || Date.now();
      },
      defaultPrevented: 0,
      isTrusted: 0,
    },
    Zr = He(us),
    oo = g({}, us, { view: 0, detail: 0 }),
    _b = He(oo),
    ju,
    Yu,
    ro,
    Pr = g({}, oo, {
      screenX: 0,
      screenY: 0,
      clientX: 0,
      clientY: 0,
      pageX: 0,
      pageY: 0,
      ctrlKey: 0,
      shiftKey: 0,
      altKey: 0,
      metaKey: 0,
      getModifierState: Xu,
      button: 0,
      buttons: 0,
      relatedTarget: function (e) {
        return e.relatedTarget === void 0
          ? e.fromElement === e.srcElement
            ? e.toElement
            : e.fromElement
          : e.relatedTarget;
      },
      movementX: function (e) {
        return "movementX" in e
          ? e.movementX
          : (e !== ro &&
              (ro && e.type === "mousemove"
                ? ((ju = e.screenX - ro.screenX), (Yu = e.screenY - ro.screenY))
                : (Yu = ju = 0),
              (ro = e)),
            ju);
      },
      movementY: function (e) {
        return "movementY" in e ? e.movementY : Yu;
      },
    }),
    N0 = He(Pr),
    Tb = g({}, Pr, { dataTransfer: 0 }),
    zb = He(Tb),
    Eb = g({}, oo, { relatedTarget: 0 }),
    qu = He(Eb),
    Rb = g({}, us, { animationName: 0, elapsedTime: 0, pseudoElement: 0 }),
    Cb = He(Rb),
    Ob = g({}, us, {
      clipboardData: function (e) {
        return "clipboardData" in e ? e.clipboardData : window.clipboardData;
      },
    }),
    Bb = He(Ob),
    Db = g({}, us, { data: 0 }),
    U0 = He(Db),
    Nb = {
      Esc: "Escape",
      Spacebar: " ",
      Left: "ArrowLeft",
      Up: "ArrowUp",
      Right: "ArrowRight",
      Down: "ArrowDown",
      Del: "Delete",
      Win: "OS",
      Menu: "ContextMenu",
      Apps: "ContextMenu",
      Scroll: "ScrollLock",
      MozPrintableKey: "Unidentified",
    },
    Ub = {
      8: "Backspace",
      9: "Tab",
      12: "Clear",
      13: "Enter",
      16: "Shift",
      17: "Control",
      18: "Alt",
      19: "Pause",
      20: "CapsLock",
      27: "Escape",
      32: " ",
      33: "PageUp",
      34: "PageDown",
      35: "End",
      36: "Home",
      37: "ArrowLeft",
      38: "ArrowUp",
      39: "ArrowRight",
      40: "ArrowDown",
      45: "Insert",
      46: "Delete",
      112: "F1",
      113: "F2",
      114: "F3",
      115: "F4",
      116: "F5",
      117: "F6",
      118: "F7",
      119: "F8",
      120: "F9",
      121: "F10",
      122: "F11",
      123: "F12",
      144: "NumLock",
      145: "ScrollLock",
      224: "Meta",
    },
    Fb = { Alt: "altKey", Control: "ctrlKey", Meta: "metaKey", Shift: "shiftKey" };
  function Lb(e) {
    var n = this.nativeEvent;
    return n.getModifierState ? n.getModifierState(e) : (e = Fb[e]) ? !!n[e] : !1;
  }
  function Xu() {
    return Lb;
  }
  var kb = g({}, oo, {
      key: function (e) {
        if (e.key) {
          var n = Nb[e.key] || e.key;
          if (n !== "Unidentified") return n;
        }
        return e.type === "keypress"
          ? ((e = Xr(e)), e === 13 ? "Enter" : String.fromCharCode(e))
          : e.type === "keydown" || e.type === "keyup"
            ? Ub[e.keyCode] || "Unidentified"
            : "";
      },
      code: 0,
      location: 0,
      ctrlKey: 0,
      shiftKey: 0,
      altKey: 0,
      metaKey: 0,
      repeat: 0,
      locale: 0,
      getModifierState: Xu,
      charCode: function (e) {
        return e.type === "keypress" ? Xr(e) : 0;
      },
      keyCode: function (e) {
        return e.type === "keydown" || e.type === "keyup" ? e.keyCode : 0;
      },
      which: function (e) {
        return e.type === "keypress"
          ? Xr(e)
          : e.type === "keydown" || e.type === "keyup"
            ? e.keyCode
            : 0;
      },
    }),
    Hb = He(kb),
    Vb = g({}, Pr, {
      pointerId: 0,
      width: 0,
      height: 0,
      pressure: 0,
      tangentialPressure: 0,
      tiltX: 0,
      tiltY: 0,
      twist: 0,
      pointerType: 0,
      isPrimary: 0,
    }),
    F0 = He(Vb),
    Gb = g({}, oo, {
      touches: 0,
      targetTouches: 0,
      changedTouches: 0,
      altKey: 0,
      metaKey: 0,
      ctrlKey: 0,
      shiftKey: 0,
      getModifierState: Xu,
    }),
    jb = He(Gb),
    Yb = g({}, us, { propertyName: 0, elapsedTime: 0, pseudoElement: 0 }),
    qb = He(Yb),
    Xb = g({}, Pr, {
      deltaX: function (e) {
        return "deltaX" in e ? e.deltaX : "wheelDeltaX" in e ? -e.wheelDeltaX : 0;
      },
      deltaY: function (e) {
        return "deltaY" in e
          ? e.deltaY
          : "wheelDeltaY" in e
            ? -e.wheelDeltaY
            : "wheelDelta" in e
              ? -e.wheelDelta
              : 0;
      },
      deltaZ: 0,
      deltaMode: 0,
    }),
    Ib = He(Xb),
    Zb = g({}, us, { newState: 0, oldState: 0 }),
    Pb = He(Zb),
    Wb = [9, 13, 27, 32],
    Iu = Zi && "CompositionEvent" in window,
    lo = null;
  Zi && "documentMode" in document && (lo = document.documentMode);
  var Jb = Zi && "TextEvent" in window && !lo,
    L0 = Zi && (!Iu || (lo && 8 < lo && 11 >= lo)),
    k0 = " ",
    H0 = !1;
  function V0(e, n) {
    switch (e) {
      case "keyup":
        return Wb.indexOf(n.keyCode) !== -1;
      case "keydown":
        return n.keyCode !== 229;
      case "keypress":
      case "mousedown":
      case "focusout":
        return !0;
      default:
        return !1;
    }
  }
  function G0(e) {
    return ((e = e.detail), typeof e == "object" && "data" in e ? e.data : null);
  }
  var Is = !1;
  function Qb(e, n) {
    switch (e) {
      case "compositionend":
        return G0(n);
      case "keypress":
        return n.which !== 32 ? null : ((H0 = !0), k0);
      case "textInput":
        return ((e = n.data), e === k0 && H0 ? null : e);
      default:
        return null;
    }
  }
  function Kb(e, n) {
    if (Is)
      return e === "compositionend" || (!Iu && V0(e, n))
        ? ((e = B0()), (qr = Gu = zn = null), (Is = !1), e)
        : null;
    switch (e) {
      case "paste":
        return null;
      case "keypress":
        if (!(n.ctrlKey || n.altKey || n.metaKey) || (n.ctrlKey && n.altKey)) {
          if (n.char && 1 < n.char.length) return n.char;
          if (n.which) return String.fromCharCode(n.which);
        }
        return null;
      case "compositionend":
        return L0 && n.locale !== "ko" ? null : n.data;
      default:
        return null;
    }
  }
  var $b = {
    color: !0,
    date: !0,
    datetime: !0,
    "datetime-local": !0,
    email: !0,
    month: !0,
    number: !0,
    password: !0,
    range: !0,
    search: !0,
    tel: !0,
    text: !0,
    time: !0,
    url: !0,
    week: !0,
  };
  function j0(e) {
    var n = e && e.nodeName && e.nodeName.toLowerCase();
    return n === "input" ? !!$b[e.type] : n === "textarea";
  }
  function Y0(e, n, a, r) {
    (qs ? (Xs ? Xs.push(r) : (Xs = [r])) : (qs = r),
      (n = Ll(n, "onChange")),
      0 < n.length &&
        ((a = new Zr("onChange", "change", null, a, r)), e.push({ event: a, listeners: n })));
  }
  var co = null,
    uo = null;
  function tx(e) {
    _y(e, 0);
  }
  function Wr(e) {
    var n = no(e);
    if (M0(n)) return e;
  }
  function q0(e, n) {
    if (e === "change") return n;
  }
  var X0 = !1;
  if (Zi) {
    var Zu;
    if (Zi) {
      var Pu = "oninput" in document;
      if (!Pu) {
        var I0 = document.createElement("div");
        (I0.setAttribute("oninput", "return;"), (Pu = typeof I0.oninput == "function"));
      }
      Zu = Pu;
    } else Zu = !1;
    X0 = Zu && (!document.documentMode || 9 < document.documentMode);
  }
  function Z0() {
    co && (co.detachEvent("onpropertychange", P0), (uo = co = null));
  }
  function P0(e) {
    if (e.propertyName === "value" && Wr(uo)) {
      var n = [];
      (Y0(n, uo, e, ku(e)), O0(tx, n));
    }
  }
  function ex(e, n, a) {
    e === "focusin"
      ? (Z0(), (co = n), (uo = a), co.attachEvent("onpropertychange", P0))
      : e === "focusout" && Z0();
  }
  function ix(e) {
    if (e === "selectionchange" || e === "keyup" || e === "keydown") return Wr(uo);
  }
  function nx(e, n) {
    if (e === "click") return Wr(n);
  }
  function sx(e, n) {
    if (e === "input" || e === "change") return Wr(n);
  }
  function ax(e, n) {
    return (e === n && (e !== 0 || 1 / e === 1 / n)) || (e !== e && n !== n);
  }
  var We = typeof Object.is == "function" ? Object.is : ax;
  function ho(e, n) {
    if (We(e, n)) return !0;
    if (typeof e != "object" || e === null || typeof n != "object" || n === null) return !1;
    var a = Object.keys(e),
      r = Object.keys(n);
    if (a.length !== r.length) return !1;
    for (r = 0; r < a.length; r++) {
      var d = a[r];
      if (!Mt.call(n, d) || !We(e[d], n[d])) return !1;
    }
    return !0;
  }
  function W0(e) {
    for (; e && e.firstChild;) e = e.firstChild;
    return e;
  }
  function J0(e, n) {
    var a = W0(e);
    e = 0;
    for (var r; a;) {
      if (a.nodeType === 3) {
        if (((r = e + a.textContent.length), e <= n && r >= n)) return { node: a, offset: n - e };
        e = r;
      }
      t: {
        for (; a;) {
          if (a.nextSibling) {
            a = a.nextSibling;
            break t;
          }
          a = a.parentNode;
        }
        a = void 0;
      }
      a = W0(a);
    }
  }
  function Q0(e, n) {
    return e && n
      ? e === n
        ? !0
        : e && e.nodeType === 3
          ? !1
          : n && n.nodeType === 3
            ? Q0(e, n.parentNode)
            : "contains" in e
              ? e.contains(n)
              : e.compareDocumentPosition
                ? !!(e.compareDocumentPosition(n) & 16)
                : !1
      : !1;
  }
  function K0(e) {
    e =
      e != null && e.ownerDocument != null && e.ownerDocument.defaultView != null
        ? e.ownerDocument.defaultView
        : window;
    for (var n = jr(e.document); n instanceof e.HTMLIFrameElement;) {
      try {
        var a = typeof n.contentWindow.location.href == "string";
      } catch {
        a = !1;
      }
      if (a) e = n.contentWindow;
      else break;
      n = jr(e.document);
    }
    return n;
  }
  function Wu(e) {
    var n = e && e.nodeName && e.nodeName.toLowerCase();
    return (
      n &&
      ((n === "input" &&
        (e.type === "text" ||
          e.type === "search" ||
          e.type === "tel" ||
          e.type === "url" ||
          e.type === "password")) ||
        n === "textarea" ||
        e.contentEditable === "true")
    );
  }
  var ox = Zi && "documentMode" in document && 11 >= document.documentMode,
    Zs = null,
    Ju = null,
    fo = null,
    Qu = !1;
  function $0(e, n, a) {
    var r = a.window === a ? a.document : a.nodeType === 9 ? a : a.ownerDocument;
    Qu ||
      Zs == null ||
      Zs !== jr(r) ||
      ((r = Zs),
      "selectionStart" in r && Wu(r)
        ? (r = { start: r.selectionStart, end: r.selectionEnd })
        : ((r = ((r.ownerDocument && r.ownerDocument.defaultView) || window).getSelection()),
          (r = {
            anchorNode: r.anchorNode,
            anchorOffset: r.anchorOffset,
            focusNode: r.focusNode,
            focusOffset: r.focusOffset,
          })),
      (fo && ho(fo, r)) ||
        ((fo = r),
        (r = Ll(Ju, "onSelect")),
        0 < r.length &&
          ((n = new Zr("onSelect", "select", null, n, a)),
          e.push({ event: n, listeners: r }),
          (n.target = Zs))));
  }
  function hs(e, n) {
    var a = {};
    return (
      (a[e.toLowerCase()] = n.toLowerCase()),
      (a["Webkit" + e] = "webkit" + n),
      (a["Moz" + e] = "moz" + n),
      a
    );
  }
  var Ps = {
      animationend: hs("Animation", "AnimationEnd"),
      animationiteration: hs("Animation", "AnimationIteration"),
      animationstart: hs("Animation", "AnimationStart"),
      transitionrun: hs("Transition", "TransitionRun"),
      transitionstart: hs("Transition", "TransitionStart"),
      transitioncancel: hs("Transition", "TransitionCancel"),
      transitionend: hs("Transition", "TransitionEnd"),
    },
    Ku = {},
    tp = {};
  Zi &&
    ((tp = document.createElement("div").style),
    "AnimationEvent" in window ||
      (delete Ps.animationend.animation,
      delete Ps.animationiteration.animation,
      delete Ps.animationstart.animation),
    "TransitionEvent" in window || delete Ps.transitionend.transition);
  function fs(e) {
    if (Ku[e]) return Ku[e];
    if (!Ps[e]) return e;
    var n = Ps[e],
      a;
    for (a in n) if (n.hasOwnProperty(a) && a in tp) return (Ku[e] = n[a]);
    return e;
  }
  var ep = fs("animationend"),
    ip = fs("animationiteration"),
    np = fs("animationstart"),
    rx = fs("transitionrun"),
    lx = fs("transitionstart"),
    cx = fs("transitioncancel"),
    sp = fs("transitionend"),
    ap = new Map(),
    $u =
      "abort auxClick beforeToggle cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel".split(
        " ",
      );
  $u.push("scrollEnd");
  function _i(e, n) {
    (ap.set(e, n), cs(n, [e]));
  }
  var Jr =
      typeof reportError == "function"
        ? reportError
        : function (e) {
            if (typeof window == "object" && typeof window.ErrorEvent == "function") {
              var n = new window.ErrorEvent("error", {
                bubbles: !0,
                cancelable: !0,
                message:
                  typeof e == "object" && e !== null && typeof e.message == "string"
                    ? String(e.message)
                    : String(e),
                error: e,
              });
              if (!window.dispatchEvent(n)) return;
            } else if (typeof process == "object" && typeof process.emit == "function") {
              process.emit("uncaughtException", e);
              return;
            }
            console.error(e);
          },
    ui = [],
    Ws = 0,
    th = 0;
  function Qr() {
    for (var e = Ws, n = (th = Ws = 0); n < e;) {
      var a = ui[n];
      ui[n++] = null;
      var r = ui[n];
      ui[n++] = null;
      var d = ui[n];
      ui[n++] = null;
      var m = ui[n];
      if (((ui[n++] = null), r !== null && d !== null)) {
        var x = r.pending;
        (x === null ? (d.next = d) : ((d.next = x.next), (x.next = d)), (r.pending = d));
      }
      m !== 0 && op(a, d, m);
    }
  }
  function Kr(e, n, a, r) {
    ((ui[Ws++] = e),
      (ui[Ws++] = n),
      (ui[Ws++] = a),
      (ui[Ws++] = r),
      (th |= r),
      (e.lanes |= r),
      (e = e.alternate),
      e !== null && (e.lanes |= r));
  }
  function eh(e, n, a, r) {
    return (Kr(e, n, a, r), $r(e));
  }
  function ds(e, n) {
    return (Kr(e, null, null, n), $r(e));
  }
  function op(e, n, a) {
    e.lanes |= a;
    var r = e.alternate;
    r !== null && (r.lanes |= a);
    for (var d = !1, m = e.return; m !== null;)
      ((m.childLanes |= a),
        (r = m.alternate),
        r !== null && (r.childLanes |= a),
        m.tag === 22 && ((e = m.stateNode), e === null || e._visibility & 1 || (d = !0)),
        (e = m),
        (m = m.return));
    return e.tag === 3
      ? ((m = e.stateNode),
        d &&
          n !== null &&
          ((d = 31 - Pe(a)),
          (e = m.hiddenUpdates),
          (r = e[d]),
          r === null ? (e[d] = [n]) : r.push(n),
          (n.lane = a | 536870912)),
        m)
      : null;
  }
  function $r(e) {
    if (50 < Uo) throw ((Uo = 0), (hf = null), Error(s(185)));
    for (var n = e.return; n !== null;) ((e = n), (n = e.return));
    return e.tag === 3 ? e.stateNode : null;
  }
  var Js = {};
  function ux(e, n, a, r) {
    ((this.tag = e),
      (this.key = a),
      (this.sibling =
        this.child =
        this.return =
        this.stateNode =
        this.type =
        this.elementType =
          null),
      (this.index = 0),
      (this.refCleanup = this.ref = null),
      (this.pendingProps = n),
      (this.dependencies = this.memoizedState = this.updateQueue = this.memoizedProps = null),
      (this.mode = r),
      (this.subtreeFlags = this.flags = 0),
      (this.deletions = null),
      (this.childLanes = this.lanes = 0),
      (this.alternate = null));
  }
  function Je(e, n, a, r) {
    return new ux(e, n, a, r);
  }
  function ih(e) {
    return ((e = e.prototype), !(!e || !e.isReactComponent));
  }
  function Pi(e, n) {
    var a = e.alternate;
    return (
      a === null
        ? ((a = Je(e.tag, n, e.key, e.mode)),
          (a.elementType = e.elementType),
          (a.type = e.type),
          (a.stateNode = e.stateNode),
          (a.alternate = e),
          (e.alternate = a))
        : ((a.pendingProps = n),
          (a.type = e.type),
          (a.flags = 0),
          (a.subtreeFlags = 0),
          (a.deletions = null)),
      (a.flags = e.flags & 65011712),
      (a.childLanes = e.childLanes),
      (a.lanes = e.lanes),
      (a.child = e.child),
      (a.memoizedProps = e.memoizedProps),
      (a.memoizedState = e.memoizedState),
      (a.updateQueue = e.updateQueue),
      (n = e.dependencies),
      (a.dependencies = n === null ? null : { lanes: n.lanes, firstContext: n.firstContext }),
      (a.sibling = e.sibling),
      (a.index = e.index),
      (a.ref = e.ref),
      (a.refCleanup = e.refCleanup),
      a
    );
  }
  function rp(e, n) {
    e.flags &= 65011714;
    var a = e.alternate;
    return (
      a === null
        ? ((e.childLanes = 0),
          (e.lanes = n),
          (e.child = null),
          (e.subtreeFlags = 0),
          (e.memoizedProps = null),
          (e.memoizedState = null),
          (e.updateQueue = null),
          (e.dependencies = null),
          (e.stateNode = null))
        : ((e.childLanes = a.childLanes),
          (e.lanes = a.lanes),
          (e.child = a.child),
          (e.subtreeFlags = 0),
          (e.deletions = null),
          (e.memoizedProps = a.memoizedProps),
          (e.memoizedState = a.memoizedState),
          (e.updateQueue = a.updateQueue),
          (e.type = a.type),
          (n = a.dependencies),
          (e.dependencies = n === null ? null : { lanes: n.lanes, firstContext: n.firstContext })),
      e
    );
  }
  function tl(e, n, a, r, d, m) {
    var x = 0;
    if (((r = e), typeof e == "function")) ih(e) && (x = 1);
    else if (typeof e == "string")
      x = m2(e, a, Zt.current) ? 26 : e === "html" || e === "head" || e === "body" ? 27 : 5;
    else
      t: switch (e) {
        case W:
          return ((e = Je(31, a, n, d)), (e.elementType = W), (e.lanes = m), e);
        case A:
          return ps(a.children, d, m, n);
        case M:
          ((x = 8), (d |= 24));
          break;
        case T:
          return ((e = Je(12, a, n, d | 2)), (e.elementType = T), (e.lanes = m), e);
        case U:
          return ((e = Je(13, a, n, d)), (e.elementType = U), (e.lanes = m), e);
        case q:
          return ((e = Je(19, a, n, d)), (e.elementType = q), (e.lanes = m), e);
        default:
          if (typeof e == "object" && e !== null)
            switch (e.$$typeof) {
              case C:
                x = 10;
                break t;
              case O:
                x = 9;
                break t;
              case E:
                x = 11;
                break t;
              case X:
                x = 14;
                break t;
              case G:
                ((x = 16), (r = null));
                break t;
            }
          ((x = 29), (a = Error(s(130, e === null ? "null" : typeof e, ""))), (r = null));
      }
    return ((n = Je(x, a, n, d)), (n.elementType = e), (n.type = r), (n.lanes = m), n);
  }
  function ps(e, n, a, r) {
    return ((e = Je(7, e, r, n)), (e.lanes = a), e);
  }
  function nh(e, n, a) {
    return ((e = Je(6, e, null, n)), (e.lanes = a), e);
  }
  function lp(e) {
    var n = Je(18, null, null, 0);
    return ((n.stateNode = e), n);
  }
  function sh(e, n, a) {
    return (
      (n = Je(4, e.children !== null ? e.children : [], e.key, n)),
      (n.lanes = a),
      (n.stateNode = {
        containerInfo: e.containerInfo,
        pendingChildren: null,
        implementation: e.implementation,
      }),
      n
    );
  }
  var cp = new WeakMap();
  function hi(e, n) {
    if (typeof e == "object" && e !== null) {
      var a = cp.get(e);
      return a !== void 0 ? a : ((n = { value: e, source: n, stack: st(n) }), cp.set(e, n), n);
    }
    return { value: e, source: n, stack: st(n) };
  }
  var Qs = [],
    Ks = 0,
    el = null,
    po = 0,
    fi = [],
    di = 0,
    En = null,
    Li = 1,
    ki = "";
  function Wi(e, n) {
    ((Qs[Ks++] = po), (Qs[Ks++] = el), (el = e), (po = n));
  }
  function up(e, n, a) {
    ((fi[di++] = Li), (fi[di++] = ki), (fi[di++] = En), (En = e));
    var r = Li;
    e = ki;
    var d = 32 - Pe(r) - 1;
    ((r &= ~(1 << d)), (a += 1));
    var m = 32 - Pe(n) + d;
    if (30 < m) {
      var x = d - (d % 5);
      ((m = (r & ((1 << x) - 1)).toString(32)),
        (r >>= x),
        (d -= x),
        (Li = (1 << (32 - Pe(n) + d)) | (a << d) | r),
        (ki = m + e));
    } else ((Li = (1 << m) | (a << d) | r), (ki = e));
  }
  function ah(e) {
    e.return !== null && (Wi(e, 1), up(e, 1, 0));
  }
  function oh(e) {
    for (; e === el;) ((el = Qs[--Ks]), (Qs[Ks] = null), (po = Qs[--Ks]), (Qs[Ks] = null));
    for (; e === En;)
      ((En = fi[--di]),
        (fi[di] = null),
        (ki = fi[--di]),
        (fi[di] = null),
        (Li = fi[--di]),
        (fi[di] = null));
  }
  function hp(e, n) {
    ((fi[di++] = Li), (fi[di++] = ki), (fi[di++] = En), (Li = n.id), (ki = n.overflow), (En = e));
  }
  var we = null,
    Wt = null,
    Et = !1,
    Rn = null,
    pi = !1,
    rh = Error(s(519));
  function Cn(e) {
    var n = Error(
      s(418, 1 < arguments.length && arguments[1] !== void 0 && arguments[1] ? "text" : "HTML", ""),
    );
    throw (mo(hi(n, e)), rh);
  }
  function fp(e) {
    var n = e.stateNode,
      a = e.type,
      r = e.memoizedProps;
    switch (((n[Se] = e), (n[ke] = r), a)) {
      case "dialog":
        (wt("cancel", n), wt("close", n));
        break;
      case "iframe":
      case "object":
      case "embed":
        wt("load", n);
        break;
      case "video":
      case "audio":
        for (a = 0; a < Lo.length; a++) wt(Lo[a], n);
        break;
      case "source":
        wt("error", n);
        break;
      case "img":
      case "image":
      case "link":
        (wt("error", n), wt("load", n));
        break;
      case "details":
        wt("toggle", n);
        break;
      case "input":
        (wt("invalid", n),
          _0(n, r.value, r.defaultValue, r.checked, r.defaultChecked, r.type, r.name, !0));
        break;
      case "select":
        wt("invalid", n);
        break;
      case "textarea":
        (wt("invalid", n), z0(n, r.value, r.defaultValue, r.children));
    }
    ((a = r.children),
      (typeof a != "string" && typeof a != "number" && typeof a != "bigint") ||
      n.textContent === "" + a ||
      r.suppressHydrationWarning === !0 ||
      Ry(n.textContent, a)
        ? (r.popover != null && (wt("beforetoggle", n), wt("toggle", n)),
          r.onScroll != null && wt("scroll", n),
          r.onScrollEnd != null && wt("scrollend", n),
          r.onClick != null && (n.onclick = Ii),
          (n = !0))
        : (n = !1),
      n || Cn(e, !0));
  }
  function dp(e) {
    for (we = e.return; we;)
      switch (we.tag) {
        case 5:
        case 31:
        case 13:
          pi = !1;
          return;
        case 27:
        case 3:
          pi = !0;
          return;
        default:
          we = we.return;
      }
  }
  function $s(e) {
    if (e !== we) return !1;
    if (!Et) return (dp(e), (Et = !0), !1);
    var n = e.tag,
      a;
    if (
      ((a = n !== 3 && n !== 27) &&
        ((a = n === 5) &&
          ((a = e.type), (a = !(a !== "form" && a !== "button") || Tf(e.type, e.memoizedProps))),
        (a = !a)),
      a && Wt && Cn(e),
      dp(e),
      n === 13)
    ) {
      if (((e = e.memoizedState), (e = e !== null ? e.dehydrated : null), !e)) throw Error(s(317));
      Wt = ky(e);
    } else if (n === 31) {
      if (((e = e.memoizedState), (e = e !== null ? e.dehydrated : null), !e)) throw Error(s(317));
      Wt = ky(e);
    } else
      n === 27
        ? ((n = Wt), qn(e.type) ? ((e = Of), (Of = null), (Wt = e)) : (Wt = n))
        : (Wt = we ? yi(e.stateNode.nextSibling) : null);
    return !0;
  }
  function ms() {
    ((Wt = we = null), (Et = !1));
  }
  function lh() {
    var e = Rn;
    return (e !== null && (Ye === null ? (Ye = e) : Ye.push.apply(Ye, e), (Rn = null)), e);
  }
  function mo(e) {
    Rn === null ? (Rn = [e]) : Rn.push(e);
  }
  var ch = gt(null),
    ys = null,
    Ji = null;
  function On(e, n, a) {
    (pt(ch, n._currentValue), (n._currentValue = a));
  }
  function Qi(e) {
    ((e._currentValue = ch.current), zt(ch));
  }
  function uh(e, n, a) {
    for (; e !== null;) {
      var r = e.alternate;
      if (
        ((e.childLanes & n) !== n
          ? ((e.childLanes |= n), r !== null && (r.childLanes |= n))
          : r !== null && (r.childLanes & n) !== n && (r.childLanes |= n),
        e === a)
      )
        break;
      e = e.return;
    }
  }
  function hh(e, n, a, r) {
    var d = e.child;
    for (d !== null && (d.return = e); d !== null;) {
      var m = d.dependencies;
      if (m !== null) {
        var x = d.child;
        m = m.firstContext;
        t: for (; m !== null;) {
          var w = m;
          m = d;
          for (var _ = 0; _ < n.length; _++)
            if (w.context === n[_]) {
              ((m.lanes |= a),
                (w = m.alternate),
                w !== null && (w.lanes |= a),
                uh(m.return, a, e),
                r || (x = null));
              break t;
            }
          m = w.next;
        }
      } else if (d.tag === 18) {
        if (((x = d.return), x === null)) throw Error(s(341));
        ((x.lanes |= a), (m = x.alternate), m !== null && (m.lanes |= a), uh(x, a, e), (x = null));
      } else x = d.child;
      if (x !== null) x.return = d;
      else
        for (x = d; x !== null;) {
          if (x === e) {
            x = null;
            break;
          }
          if (((d = x.sibling), d !== null)) {
            ((d.return = x.return), (x = d));
            break;
          }
          x = x.return;
        }
      d = x;
    }
  }
  function ta(e, n, a, r) {
    e = null;
    for (var d = n, m = !1; d !== null;) {
      if (!m) {
        if ((d.flags & 524288) !== 0) m = !0;
        else if ((d.flags & 262144) !== 0) break;
      }
      if (d.tag === 10) {
        var x = d.alternate;
        if (x === null) throw Error(s(387));
        if (((x = x.memoizedProps), x !== null)) {
          var w = d.type;
          We(d.pendingProps.value, x.value) || (e !== null ? e.push(w) : (e = [w]));
        }
      } else if (d === Us.current) {
        if (((x = d.alternate), x === null)) throw Error(s(387));
        x.memoizedState.memoizedState !== d.memoizedState.memoizedState &&
          (e !== null ? e.push(jo) : (e = [jo]));
      }
      d = d.return;
    }
    (e !== null && hh(n, e, a, r), (n.flags |= 262144));
  }
  function il(e) {
    for (e = e.firstContext; e !== null;) {
      if (!We(e.context._currentValue, e.memoizedValue)) return !0;
      e = e.next;
    }
    return !1;
  }
  function gs(e) {
    ((ys = e), (Ji = null), (e = e.dependencies), e !== null && (e.firstContext = null));
  }
  function Ae(e) {
    return pp(ys, e);
  }
  function nl(e, n) {
    return (ys === null && gs(e), pp(e, n));
  }
  function pp(e, n) {
    var a = n._currentValue;
    if (((n = { context: n, memoizedValue: a, next: null }), Ji === null)) {
      if (e === null) throw Error(s(308));
      ((Ji = n), (e.dependencies = { lanes: 0, firstContext: n }), (e.flags |= 524288));
    } else Ji = Ji.next = n;
    return a;
  }
  var hx =
      typeof AbortController < "u"
        ? AbortController
        : function () {
            var e = [],
              n = (this.signal = {
                aborted: !1,
                addEventListener: function (a, r) {
                  e.push(r);
                },
              });
            this.abort = function () {
              ((n.aborted = !0),
                e.forEach(function (a) {
                  return a();
                }));
            };
          },
    fx = c.unstable_scheduleCallback,
    dx = c.unstable_NormalPriority,
    ce = {
      $$typeof: C,
      Consumer: null,
      Provider: null,
      _currentValue: null,
      _currentValue2: null,
      _threadCount: 0,
    };
  function fh() {
    return { controller: new hx(), data: new Map(), refCount: 0 };
  }
  function yo(e) {
    (e.refCount--,
      e.refCount === 0 &&
        fx(dx, function () {
          e.controller.abort();
        }));
  }
  var go = null,
    dh = 0,
    ea = 0,
    ia = null;
  function px(e, n) {
    if (go === null) {
      var a = (go = []);
      ((dh = 0),
        (ea = gf()),
        (ia = {
          status: "pending",
          value: void 0,
          then: function (r) {
            a.push(r);
          },
        }));
    }
    return (dh++, n.then(mp, mp), n);
  }
  function mp() {
    if (--dh === 0 && go !== null) {
      ia !== null && (ia.status = "fulfilled");
      var e = go;
      ((go = null), (ea = 0), (ia = null));
      for (var n = 0; n < e.length; n++) (0, e[n])();
    }
  }
  function mx(e, n) {
    var a = [],
      r = {
        status: "pending",
        value: null,
        reason: null,
        then: function (d) {
          a.push(d);
        },
      };
    return (
      e.then(
        function () {
          ((r.status = "fulfilled"), (r.value = n));
          for (var d = 0; d < a.length; d++) (0, a[d])(n);
        },
        function (d) {
          for (r.status = "rejected", r.reason = d, d = 0; d < a.length; d++) (0, a[d])(void 0);
        },
      ),
      r
    );
  }
  var yp = L.S;
  L.S = function (e, n) {
    (($m = qt()),
      typeof n == "object" && n !== null && typeof n.then == "function" && px(e, n),
      yp !== null && yp(e, n));
  };
  var vs = gt(null);
  function ph() {
    var e = vs.current;
    return e !== null ? e : Xt.pooledCache;
  }
  function sl(e, n) {
    n === null ? pt(vs, vs.current) : pt(vs, n.pool);
  }
  function gp() {
    var e = ph();
    return e === null ? null : { parent: ce._currentValue, pool: e };
  }
  var na = Error(s(460)),
    mh = Error(s(474)),
    al = Error(s(542)),
    ol = { then: function () {} };
  function vp(e) {
    return ((e = e.status), e === "fulfilled" || e === "rejected");
  }
  function bp(e, n, a) {
    switch (
      ((a = e[a]), a === void 0 ? e.push(n) : a !== n && (n.then(Ii, Ii), (n = a)), n.status)
    ) {
      case "fulfilled":
        return n.value;
      case "rejected":
        throw ((e = n.reason), Sp(e), e);
      default:
        if (typeof n.status == "string") n.then(Ii, Ii);
        else {
          if (((e = Xt), e !== null && 100 < e.shellSuspendCounter)) throw Error(s(482));
          ((e = n),
            (e.status = "pending"),
            e.then(
              function (r) {
                if (n.status === "pending") {
                  var d = n;
                  ((d.status = "fulfilled"), (d.value = r));
                }
              },
              function (r) {
                if (n.status === "pending") {
                  var d = n;
                  ((d.status = "rejected"), (d.reason = r));
                }
              },
            ));
        }
        switch (n.status) {
          case "fulfilled":
            return n.value;
          case "rejected":
            throw ((e = n.reason), Sp(e), e);
        }
        throw ((xs = n), na);
    }
  }
  function bs(e) {
    try {
      var n = e._init;
      return n(e._payload);
    } catch (a) {
      throw a !== null && typeof a == "object" && typeof a.then == "function" ? ((xs = a), na) : a;
    }
  }
  var xs = null;
  function xp() {
    if (xs === null) throw Error(s(459));
    var e = xs;
    return ((xs = null), e);
  }
  function Sp(e) {
    if (e === na || e === al) throw Error(s(483));
  }
  var sa = null,
    vo = 0;
  function rl(e) {
    var n = vo;
    return ((vo += 1), sa === null && (sa = []), bp(sa, e, n));
  }
  function bo(e, n) {
    ((n = n.props.ref), (e.ref = n !== void 0 ? n : null));
  }
  function ll(e, n) {
    throw n.$$typeof === v
      ? Error(s(525))
      : ((e = Object.prototype.toString.call(n)),
        Error(
          s(
            31,
            e === "[object Object]" ? "object with keys {" + Object.keys(n).join(", ") + "}" : e,
          ),
        ));
  }
  function wp(e) {
    function n(B, z) {
      if (e) {
        var D = B.deletions;
        D === null ? ((B.deletions = [z]), (B.flags |= 16)) : D.push(z);
      }
    }
    function a(B, z) {
      if (!e) return null;
      for (; z !== null;) (n(B, z), (z = z.sibling));
      return null;
    }
    function r(B) {
      for (var z = new Map(); B !== null;)
        (B.key !== null ? z.set(B.key, B) : z.set(B.index, B), (B = B.sibling));
      return z;
    }
    function d(B, z) {
      return ((B = Pi(B, z)), (B.index = 0), (B.sibling = null), B);
    }
    function m(B, z, D) {
      return (
        (B.index = D),
        e
          ? ((D = B.alternate),
            D !== null
              ? ((D = D.index), D < z ? ((B.flags |= 67108866), z) : D)
              : ((B.flags |= 67108866), z))
          : ((B.flags |= 1048576), z)
      );
    }
    function x(B) {
      return (e && B.alternate === null && (B.flags |= 67108866), B);
    }
    function w(B, z, D, j) {
      return z === null || z.tag !== 6
        ? ((z = nh(D, B.mode, j)), (z.return = B), z)
        : ((z = d(z, D)), (z.return = B), z);
    }
    function _(B, z, D, j) {
      var ot = D.type;
      return ot === A
        ? V(B, z, D.props.children, j, D.key)
        : z !== null &&
            (z.elementType === ot ||
              (typeof ot == "object" && ot !== null && ot.$$typeof === G && bs(ot) === z.type))
          ? ((z = d(z, D.props)), bo(z, D), (z.return = B), z)
          : ((z = tl(D.type, D.key, D.props, null, B.mode, j)), bo(z, D), (z.return = B), z);
    }
    function N(B, z, D, j) {
      return z === null ||
        z.tag !== 4 ||
        z.stateNode.containerInfo !== D.containerInfo ||
        z.stateNode.implementation !== D.implementation
        ? ((z = sh(D, B.mode, j)), (z.return = B), z)
        : ((z = d(z, D.children || [])), (z.return = B), z);
    }
    function V(B, z, D, j, ot) {
      return z === null || z.tag !== 7
        ? ((z = ps(D, B.mode, j, ot)), (z.return = B), z)
        : ((z = d(z, D)), (z.return = B), z);
    }
    function Y(B, z, D) {
      if ((typeof z == "string" && z !== "") || typeof z == "number" || typeof z == "bigint")
        return ((z = nh("" + z, B.mode, D)), (z.return = B), z);
      if (typeof z == "object" && z !== null) {
        switch (z.$$typeof) {
          case b:
            return ((D = tl(z.type, z.key, z.props, null, B.mode, D)), bo(D, z), (D.return = B), D);
          case S:
            return ((z = sh(z, B.mode, D)), (z.return = B), z);
          case G:
            return ((z = bs(z)), Y(B, z, D));
        }
        if (ft(z) || rt(z)) return ((z = ps(z, B.mode, D, null)), (z.return = B), z);
        if (typeof z.then == "function") return Y(B, rl(z), D);
        if (z.$$typeof === C) return Y(B, nl(B, z), D);
        ll(B, z);
      }
      return null;
    }
    function F(B, z, D, j) {
      var ot = z !== null ? z.key : null;
      if ((typeof D == "string" && D !== "") || typeof D == "number" || typeof D == "bigint")
        return ot !== null ? null : w(B, z, "" + D, j);
      if (typeof D == "object" && D !== null) {
        switch (D.$$typeof) {
          case b:
            return D.key === ot ? _(B, z, D, j) : null;
          case S:
            return D.key === ot ? N(B, z, D, j) : null;
          case G:
            return ((D = bs(D)), F(B, z, D, j));
        }
        if (ft(D) || rt(D)) return ot !== null ? null : V(B, z, D, j, null);
        if (typeof D.then == "function") return F(B, z, rl(D), j);
        if (D.$$typeof === C) return F(B, z, nl(B, D), j);
        ll(B, D);
      }
      return null;
    }
    function k(B, z, D, j, ot) {
      if ((typeof j == "string" && j !== "") || typeof j == "number" || typeof j == "bigint")
        return ((B = B.get(D) || null), w(z, B, "" + j, ot));
      if (typeof j == "object" && j !== null) {
        switch (j.$$typeof) {
          case b:
            return ((B = B.get(j.key === null ? D : j.key) || null), _(z, B, j, ot));
          case S:
            return ((B = B.get(j.key === null ? D : j.key) || null), N(z, B, j, ot));
          case G:
            return ((j = bs(j)), k(B, z, D, j, ot));
        }
        if (ft(j) || rt(j)) return ((B = B.get(D) || null), V(z, B, j, ot, null));
        if (typeof j.then == "function") return k(B, z, D, rl(j), ot);
        if (j.$$typeof === C) return k(B, z, D, nl(z, j), ot);
        ll(z, j);
      }
      return null;
    }
    function et(B, z, D, j) {
      for (
        var ot = null, Ot = null, it = z, vt = (z = 0), Tt = null;
        it !== null && vt < D.length;
        vt++
      ) {
        it.index > vt ? ((Tt = it), (it = null)) : (Tt = it.sibling);
        var Bt = F(B, it, D[vt], j);
        if (Bt === null) {
          it === null && (it = Tt);
          break;
        }
        (e && it && Bt.alternate === null && n(B, it),
          (z = m(Bt, z, vt)),
          Ot === null ? (ot = Bt) : (Ot.sibling = Bt),
          (Ot = Bt),
          (it = Tt));
      }
      if (vt === D.length) return (a(B, it), Et && Wi(B, vt), ot);
      if (it === null) {
        for (; vt < D.length; vt++)
          ((it = Y(B, D[vt], j)),
            it !== null &&
              ((z = m(it, z, vt)), Ot === null ? (ot = it) : (Ot.sibling = it), (Ot = it)));
        return (Et && Wi(B, vt), ot);
      }
      for (it = r(it); vt < D.length; vt++)
        ((Tt = k(it, B, vt, D[vt], j)),
          Tt !== null &&
            (e && Tt.alternate !== null && it.delete(Tt.key === null ? vt : Tt.key),
            (z = m(Tt, z, vt)),
            Ot === null ? (ot = Tt) : (Ot.sibling = Tt),
            (Ot = Tt)));
      return (
        e &&
          it.forEach(function (Wn) {
            return n(B, Wn);
          }),
        Et && Wi(B, vt),
        ot
      );
    }
    function ct(B, z, D, j) {
      if (D == null) throw Error(s(151));
      for (
        var ot = null, Ot = null, it = z, vt = (z = 0), Tt = null, Bt = D.next();
        it !== null && !Bt.done;
        vt++, Bt = D.next()
      ) {
        it.index > vt ? ((Tt = it), (it = null)) : (Tt = it.sibling);
        var Wn = F(B, it, Bt.value, j);
        if (Wn === null) {
          it === null && (it = Tt);
          break;
        }
        (e && it && Wn.alternate === null && n(B, it),
          (z = m(Wn, z, vt)),
          Ot === null ? (ot = Wn) : (Ot.sibling = Wn),
          (Ot = Wn),
          (it = Tt));
      }
      if (Bt.done) return (a(B, it), Et && Wi(B, vt), ot);
      if (it === null) {
        for (; !Bt.done; vt++, Bt = D.next())
          ((Bt = Y(B, Bt.value, j)),
            Bt !== null &&
              ((z = m(Bt, z, vt)), Ot === null ? (ot = Bt) : (Ot.sibling = Bt), (Ot = Bt)));
        return (Et && Wi(B, vt), ot);
      }
      for (it = r(it); !Bt.done; vt++, Bt = D.next())
        ((Bt = k(it, B, vt, Bt.value, j)),
          Bt !== null &&
            (e && Bt.alternate !== null && it.delete(Bt.key === null ? vt : Bt.key),
            (z = m(Bt, z, vt)),
            Ot === null ? (ot = Bt) : (Ot.sibling = Bt),
            (Ot = Bt)));
      return (
        e &&
          it.forEach(function (T2) {
            return n(B, T2);
          }),
        Et && Wi(B, vt),
        ot
      );
    }
    function jt(B, z, D, j) {
      if (
        (typeof D == "object" &&
          D !== null &&
          D.type === A &&
          D.key === null &&
          (D = D.props.children),
        typeof D == "object" && D !== null)
      ) {
        switch (D.$$typeof) {
          case b:
            t: {
              for (var ot = D.key; z !== null;) {
                if (z.key === ot) {
                  if (((ot = D.type), ot === A)) {
                    if (z.tag === 7) {
                      (a(B, z.sibling), (j = d(z, D.props.children)), (j.return = B), (B = j));
                      break t;
                    }
                  } else if (
                    z.elementType === ot ||
                    (typeof ot == "object" && ot !== null && ot.$$typeof === G && bs(ot) === z.type)
                  ) {
                    (a(B, z.sibling), (j = d(z, D.props)), bo(j, D), (j.return = B), (B = j));
                    break t;
                  }
                  a(B, z);
                  break;
                } else n(B, z);
                z = z.sibling;
              }
              D.type === A
                ? ((j = ps(D.props.children, B.mode, j, D.key)), (j.return = B), (B = j))
                : ((j = tl(D.type, D.key, D.props, null, B.mode, j)),
                  bo(j, D),
                  (j.return = B),
                  (B = j));
            }
            return x(B);
          case S:
            t: {
              for (ot = D.key; z !== null;) {
                if (z.key === ot)
                  if (
                    z.tag === 4 &&
                    z.stateNode.containerInfo === D.containerInfo &&
                    z.stateNode.implementation === D.implementation
                  ) {
                    (a(B, z.sibling), (j = d(z, D.children || [])), (j.return = B), (B = j));
                    break t;
                  } else {
                    a(B, z);
                    break;
                  }
                else n(B, z);
                z = z.sibling;
              }
              ((j = sh(D, B.mode, j)), (j.return = B), (B = j));
            }
            return x(B);
          case G:
            return ((D = bs(D)), jt(B, z, D, j));
        }
        if (ft(D)) return et(B, z, D, j);
        if (rt(D)) {
          if (((ot = rt(D)), typeof ot != "function")) throw Error(s(150));
          return ((D = ot.call(D)), ct(B, z, D, j));
        }
        if (typeof D.then == "function") return jt(B, z, rl(D), j);
        if (D.$$typeof === C) return jt(B, z, nl(B, D), j);
        ll(B, D);
      }
      return (typeof D == "string" && D !== "") || typeof D == "number" || typeof D == "bigint"
        ? ((D = "" + D),
          z !== null && z.tag === 6
            ? (a(B, z.sibling), (j = d(z, D)), (j.return = B), (B = j))
            : (a(B, z), (j = nh(D, B.mode, j)), (j.return = B), (B = j)),
          x(B))
        : a(B, z);
    }
    return function (B, z, D, j) {
      try {
        vo = 0;
        var ot = jt(B, z, D, j);
        return ((sa = null), ot);
      } catch (it) {
        if (it === na || it === al) throw it;
        var Ot = Je(29, it, null, B.mode);
        return ((Ot.lanes = j), (Ot.return = B), Ot);
      } finally {
      }
    };
  }
  var Ss = wp(!0),
    Ap = wp(!1),
    Bn = !1;
  function yh(e) {
    e.updateQueue = {
      baseState: e.memoizedState,
      firstBaseUpdate: null,
      lastBaseUpdate: null,
      shared: { pending: null, lanes: 0, hiddenCallbacks: null },
      callbacks: null,
    };
  }
  function gh(e, n) {
    ((e = e.updateQueue),
      n.updateQueue === e &&
        (n.updateQueue = {
          baseState: e.baseState,
          firstBaseUpdate: e.firstBaseUpdate,
          lastBaseUpdate: e.lastBaseUpdate,
          shared: e.shared,
          callbacks: null,
        }));
  }
  function Dn(e) {
    return { lane: e, tag: 0, payload: null, callback: null, next: null };
  }
  function Nn(e, n, a) {
    var r = e.updateQueue;
    if (r === null) return null;
    if (((r = r.shared), (Dt & 2) !== 0)) {
      var d = r.pending;
      return (
        d === null ? (n.next = n) : ((n.next = d.next), (d.next = n)),
        (r.pending = n),
        (n = $r(e)),
        op(e, null, a),
        n
      );
    }
    return (Kr(e, r, n, a), $r(e));
  }
  function xo(e, n, a) {
    if (((n = n.updateQueue), n !== null && ((n = n.shared), (a & 4194048) !== 0))) {
      var r = n.lanes;
      ((r &= e.pendingLanes), (a |= r), (n.lanes = a), p0(e, a));
    }
  }
  function vh(e, n) {
    var a = e.updateQueue,
      r = e.alternate;
    if (r !== null && ((r = r.updateQueue), a === r)) {
      var d = null,
        m = null;
      if (((a = a.firstBaseUpdate), a !== null)) {
        do {
          var x = { lane: a.lane, tag: a.tag, payload: a.payload, callback: null, next: null };
          (m === null ? (d = m = x) : (m = m.next = x), (a = a.next));
        } while (a !== null);
        m === null ? (d = m = n) : (m = m.next = n);
      } else d = m = n;
      ((a = {
        baseState: r.baseState,
        firstBaseUpdate: d,
        lastBaseUpdate: m,
        shared: r.shared,
        callbacks: r.callbacks,
      }),
        (e.updateQueue = a));
      return;
    }
    ((e = a.lastBaseUpdate),
      e === null ? (a.firstBaseUpdate = n) : (e.next = n),
      (a.lastBaseUpdate = n));
  }
  var bh = !1;
  function So() {
    if (bh) {
      var e = ia;
      if (e !== null) throw e;
    }
  }
  function wo(e, n, a, r) {
    bh = !1;
    var d = e.updateQueue;
    Bn = !1;
    var m = d.firstBaseUpdate,
      x = d.lastBaseUpdate,
      w = d.shared.pending;
    if (w !== null) {
      d.shared.pending = null;
      var _ = w,
        N = _.next;
      ((_.next = null), x === null ? (m = N) : (x.next = N), (x = _));
      var V = e.alternate;
      V !== null &&
        ((V = V.updateQueue),
        (w = V.lastBaseUpdate),
        w !== x && (w === null ? (V.firstBaseUpdate = N) : (w.next = N), (V.lastBaseUpdate = _)));
    }
    if (m !== null) {
      var Y = d.baseState;
      ((x = 0), (V = N = _ = null), (w = m));
      do {
        var F = w.lane & -536870913,
          k = F !== w.lane;
        if (k ? (_t & F) === F : (r & F) === F) {
          (F !== 0 && F === ea && (bh = !0),
            V !== null &&
              (V = V.next =
                { lane: 0, tag: w.tag, payload: w.payload, callback: null, next: null }));
          t: {
            var et = e,
              ct = w;
            F = n;
            var jt = a;
            switch (ct.tag) {
              case 1:
                if (((et = ct.payload), typeof et == "function")) {
                  Y = et.call(jt, Y, F);
                  break t;
                }
                Y = et;
                break t;
              case 3:
                et.flags = (et.flags & -65537) | 128;
              case 0:
                if (
                  ((et = ct.payload),
                  (F = typeof et == "function" ? et.call(jt, Y, F) : et),
                  F == null)
                )
                  break t;
                Y = g({}, Y, F);
                break t;
              case 2:
                Bn = !0;
            }
          }
          ((F = w.callback),
            F !== null &&
              ((e.flags |= 64),
              k && (e.flags |= 8192),
              (k = d.callbacks),
              k === null ? (d.callbacks = [F]) : k.push(F)));
        } else
          ((k = { lane: F, tag: w.tag, payload: w.payload, callback: w.callback, next: null }),
            V === null ? ((N = V = k), (_ = Y)) : (V = V.next = k),
            (x |= F));
        if (((w = w.next), w === null)) {
          if (((w = d.shared.pending), w === null)) break;
          ((k = w),
            (w = k.next),
            (k.next = null),
            (d.lastBaseUpdate = k),
            (d.shared.pending = null));
        }
      } while (!0);
      (V === null && (_ = Y),
        (d.baseState = _),
        (d.firstBaseUpdate = N),
        (d.lastBaseUpdate = V),
        m === null && (d.shared.lanes = 0),
        (Hn |= x),
        (e.lanes = x),
        (e.memoizedState = Y));
    }
  }
  function Mp(e, n) {
    if (typeof e != "function") throw Error(s(191, e));
    e.call(n);
  }
  function _p(e, n) {
    var a = e.callbacks;
    if (a !== null) for (e.callbacks = null, e = 0; e < a.length; e++) Mp(a[e], n);
  }
  var aa = gt(null),
    cl = gt(0);
  function Tp(e, n) {
    ((e = rn), pt(cl, e), pt(aa, n), (rn = e | n.baseLanes));
  }
  function xh() {
    (pt(cl, rn), pt(aa, aa.current));
  }
  function Sh() {
    ((rn = cl.current), zt(aa), zt(cl));
  }
  var Qe = gt(null),
    mi = null;
  function Un(e) {
    var n = e.alternate;
    (pt(ae, ae.current & 1),
      pt(Qe, e),
      mi === null && (n === null || aa.current !== null || n.memoizedState !== null) && (mi = e));
  }
  function wh(e) {
    (pt(ae, ae.current), pt(Qe, e), mi === null && (mi = e));
  }
  function zp(e) {
    e.tag === 22 ? (pt(ae, ae.current), pt(Qe, e), mi === null && (mi = e)) : Fn();
  }
  function Fn() {
    (pt(ae, ae.current), pt(Qe, Qe.current));
  }
  function Ke(e) {
    (zt(Qe), mi === e && (mi = null), zt(ae));
  }
  var ae = gt(0);
  function ul(e) {
    for (var n = e; n !== null;) {
      if (n.tag === 13) {
        var a = n.memoizedState;
        if (a !== null && ((a = a.dehydrated), a === null || Rf(a) || Cf(a))) return n;
      } else if (
        n.tag === 19 &&
        (n.memoizedProps.revealOrder === "forwards" ||
          n.memoizedProps.revealOrder === "backwards" ||
          n.memoizedProps.revealOrder === "unstable_legacy-backwards" ||
          n.memoizedProps.revealOrder === "together")
      ) {
        if ((n.flags & 128) !== 0) return n;
      } else if (n.child !== null) {
        ((n.child.return = n), (n = n.child));
        continue;
      }
      if (n === e) break;
      for (; n.sibling === null;) {
        if (n.return === null || n.return === e) return null;
        n = n.return;
      }
      ((n.sibling.return = n.return), (n = n.sibling));
    }
    return null;
  }
  var Ki = 0,
    yt = null,
    Vt = null,
    ue = null,
    hl = !1,
    oa = !1,
    ws = !1,
    fl = 0,
    Ao = 0,
    ra = null,
    yx = 0;
  function ee() {
    throw Error(s(321));
  }
  function Ah(e, n) {
    if (n === null) return !1;
    for (var a = 0; a < n.length && a < e.length; a++) if (!We(e[a], n[a])) return !1;
    return !0;
  }
  function Mh(e, n, a, r, d, m) {
    return (
      (Ki = m),
      (yt = n),
      (n.memoizedState = null),
      (n.updateQueue = null),
      (n.lanes = 0),
      (L.H = e === null || e.memoizedState === null ? um : Hh),
      (ws = !1),
      (m = a(r, d)),
      (ws = !1),
      oa && (m = Rp(n, a, r, d)),
      Ep(e),
      m
    );
  }
  function Ep(e) {
    L.H = To;
    var n = Vt !== null && Vt.next !== null;
    if (((Ki = 0), (ue = Vt = yt = null), (hl = !1), (Ao = 0), (ra = null), n)) throw Error(s(300));
    e === null || he || ((e = e.dependencies), e !== null && il(e) && (he = !0));
  }
  function Rp(e, n, a, r) {
    yt = e;
    var d = 0;
    do {
      if ((oa && (ra = null), (Ao = 0), (oa = !1), 25 <= d)) throw Error(s(301));
      if (((d += 1), (ue = Vt = null), e.updateQueue != null)) {
        var m = e.updateQueue;
        ((m.lastEffect = null),
          (m.events = null),
          (m.stores = null),
          m.memoCache != null && (m.memoCache.index = 0));
      }
      ((L.H = hm), (m = n(a, r)));
    } while (oa);
    return m;
  }
  function gx() {
    var e = L.H,
      n = e.useState()[0];
    return (
      (n = typeof n.then == "function" ? Mo(n) : n),
      (e = e.useState()[0]),
      (Vt !== null ? Vt.memoizedState : null) !== e && (yt.flags |= 1024),
      n
    );
  }
  function _h() {
    var e = fl !== 0;
    return ((fl = 0), e);
  }
  function Th(e, n, a) {
    ((n.updateQueue = e.updateQueue), (n.flags &= -2053), (e.lanes &= ~a));
  }
  function zh(e) {
    if (hl) {
      for (e = e.memoizedState; e !== null;) {
        var n = e.queue;
        (n !== null && (n.pending = null), (e = e.next));
      }
      hl = !1;
    }
    ((Ki = 0), (ue = Vt = yt = null), (oa = !1), (Ao = fl = 0), (ra = null));
  }
  function Fe() {
    var e = { memoizedState: null, baseState: null, baseQueue: null, queue: null, next: null };
    return (ue === null ? (yt.memoizedState = ue = e) : (ue = ue.next = e), ue);
  }
  function oe() {
    if (Vt === null) {
      var e = yt.alternate;
      e = e !== null ? e.memoizedState : null;
    } else e = Vt.next;
    var n = ue === null ? yt.memoizedState : ue.next;
    if (n !== null) ((ue = n), (Vt = e));
    else {
      if (e === null) throw yt.alternate === null ? Error(s(467)) : Error(s(310));
      ((Vt = e),
        (e = {
          memoizedState: Vt.memoizedState,
          baseState: Vt.baseState,
          baseQueue: Vt.baseQueue,
          queue: Vt.queue,
          next: null,
        }),
        ue === null ? (yt.memoizedState = ue = e) : (ue = ue.next = e));
    }
    return ue;
  }
  function dl() {
    return { lastEffect: null, events: null, stores: null, memoCache: null };
  }
  function Mo(e) {
    var n = Ao;
    return (
      (Ao += 1),
      ra === null && (ra = []),
      (e = bp(ra, e, n)),
      (n = yt),
      (ue === null ? n.memoizedState : ue.next) === null &&
        ((n = n.alternate), (L.H = n === null || n.memoizedState === null ? um : Hh)),
      e
    );
  }
  function pl(e) {
    if (e !== null && typeof e == "object") {
      if (typeof e.then == "function") return Mo(e);
      if (e.$$typeof === C) return Ae(e);
    }
    throw Error(s(438, String(e)));
  }
  function Eh(e) {
    var n = null,
      a = yt.updateQueue;
    if ((a !== null && (n = a.memoCache), n == null)) {
      var r = yt.alternate;
      r !== null &&
        ((r = r.updateQueue),
        r !== null &&
          ((r = r.memoCache),
          r != null &&
            (n = {
              data: r.data.map(function (d) {
                return d.slice();
              }),
              index: 0,
            })));
    }
    if (
      (n == null && (n = { data: [], index: 0 }),
      a === null && ((a = dl()), (yt.updateQueue = a)),
      (a.memoCache = n),
      (a = n.data[n.index]),
      a === void 0)
    )
      for (a = n.data[n.index] = Array(e), r = 0; r < e; r++) a[r] = P;
    return (n.index++, a);
  }
  function $i(e, n) {
    return typeof n == "function" ? n(e) : n;
  }
  function ml(e) {
    var n = oe();
    return Rh(n, Vt, e);
  }
  function Rh(e, n, a) {
    var r = e.queue;
    if (r === null) throw Error(s(311));
    r.lastRenderedReducer = a;
    var d = e.baseQueue,
      m = r.pending;
    if (m !== null) {
      if (d !== null) {
        var x = d.next;
        ((d.next = m.next), (m.next = x));
      }
      ((n.baseQueue = d = m), (r.pending = null));
    }
    if (((m = e.baseState), d === null)) e.memoizedState = m;
    else {
      n = d.next;
      var w = (x = null),
        _ = null,
        N = n,
        V = !1;
      do {
        var Y = N.lane & -536870913;
        if (Y !== N.lane ? (_t & Y) === Y : (Ki & Y) === Y) {
          var F = N.revertLane;
          if (F === 0)
            (_ !== null &&
              (_ = _.next =
                {
                  lane: 0,
                  revertLane: 0,
                  gesture: null,
                  action: N.action,
                  hasEagerState: N.hasEagerState,
                  eagerState: N.eagerState,
                  next: null,
                }),
              Y === ea && (V = !0));
          else if ((Ki & F) === F) {
            ((N = N.next), F === ea && (V = !0));
            continue;
          } else
            ((Y = {
              lane: 0,
              revertLane: N.revertLane,
              gesture: null,
              action: N.action,
              hasEagerState: N.hasEagerState,
              eagerState: N.eagerState,
              next: null,
            }),
              _ === null ? ((w = _ = Y), (x = m)) : (_ = _.next = Y),
              (yt.lanes |= F),
              (Hn |= F));
          ((Y = N.action), ws && a(m, Y), (m = N.hasEagerState ? N.eagerState : a(m, Y)));
        } else
          ((F = {
            lane: Y,
            revertLane: N.revertLane,
            gesture: N.gesture,
            action: N.action,
            hasEagerState: N.hasEagerState,
            eagerState: N.eagerState,
            next: null,
          }),
            _ === null ? ((w = _ = F), (x = m)) : (_ = _.next = F),
            (yt.lanes |= Y),
            (Hn |= Y));
        N = N.next;
      } while (N !== null && N !== n);
      if (
        (_ === null ? (x = m) : (_.next = w),
        !We(m, e.memoizedState) && ((he = !0), V && ((a = ia), a !== null)))
      )
        throw a;
      ((e.memoizedState = m), (e.baseState = x), (e.baseQueue = _), (r.lastRenderedState = m));
    }
    return (d === null && (r.lanes = 0), [e.memoizedState, r.dispatch]);
  }
  function Ch(e) {
    var n = oe(),
      a = n.queue;
    if (a === null) throw Error(s(311));
    a.lastRenderedReducer = e;
    var r = a.dispatch,
      d = a.pending,
      m = n.memoizedState;
    if (d !== null) {
      a.pending = null;
      var x = (d = d.next);
      do ((m = e(m, x.action)), (x = x.next));
      while (x !== d);
      (We(m, n.memoizedState) || (he = !0),
        (n.memoizedState = m),
        n.baseQueue === null && (n.baseState = m),
        (a.lastRenderedState = m));
    }
    return [m, r];
  }
  function Cp(e, n, a) {
    var r = yt,
      d = oe(),
      m = Et;
    if (m) {
      if (a === void 0) throw Error(s(407));
      a = a();
    } else a = n();
    var x = !We((Vt || d).memoizedState, a);
    if (
      (x && ((d.memoizedState = a), (he = !0)),
      (d = d.queue),
      Dh(Dp.bind(null, r, d, e), [e]),
      d.getSnapshot !== n || x || (ue !== null && ue.memoizedState.tag & 1))
    ) {
      if (
        ((r.flags |= 2048),
        la(9, { destroy: void 0 }, Bp.bind(null, r, d, a, n), null),
        Xt === null)
      )
        throw Error(s(349));
      m || (Ki & 127) !== 0 || Op(r, n, a);
    }
    return a;
  }
  function Op(e, n, a) {
    ((e.flags |= 16384),
      (e = { getSnapshot: n, value: a }),
      (n = yt.updateQueue),
      n === null
        ? ((n = dl()), (yt.updateQueue = n), (n.stores = [e]))
        : ((a = n.stores), a === null ? (n.stores = [e]) : a.push(e)));
  }
  function Bp(e, n, a, r) {
    ((n.value = a), (n.getSnapshot = r), Np(n) && Up(e));
  }
  function Dp(e, n, a) {
    return a(function () {
      Np(n) && Up(e);
    });
  }
  function Np(e) {
    var n = e.getSnapshot;
    e = e.value;
    try {
      var a = n();
      return !We(e, a);
    } catch {
      return !0;
    }
  }
  function Up(e) {
    var n = ds(e, 2);
    n !== null && qe(n, e, 2);
  }
  function Oh(e) {
    var n = Fe();
    if (typeof e == "function") {
      var a = e;
      if (((e = a()), ws)) {
        _n(!0);
        try {
          a();
        } finally {
          _n(!1);
        }
      }
    }
    return (
      (n.memoizedState = n.baseState = e),
      (n.queue = {
        pending: null,
        lanes: 0,
        dispatch: null,
        lastRenderedReducer: $i,
        lastRenderedState: e,
      }),
      n
    );
  }
  function Fp(e, n, a, r) {
    return ((e.baseState = a), Rh(e, Vt, typeof r == "function" ? r : $i));
  }
  function vx(e, n, a, r, d) {
    if (vl(e)) throw Error(s(485));
    if (((e = n.action), e !== null)) {
      var m = {
        payload: d,
        action: e,
        next: null,
        isTransition: !0,
        status: "pending",
        value: null,
        reason: null,
        listeners: [],
        then: function (x) {
          m.listeners.push(x);
        },
      };
      (L.T !== null ? a(!0) : (m.isTransition = !1),
        r(m),
        (a = n.pending),
        a === null
          ? ((m.next = n.pending = m), Lp(n, m))
          : ((m.next = a.next), (n.pending = a.next = m)));
    }
  }
  function Lp(e, n) {
    var a = n.action,
      r = n.payload,
      d = e.state;
    if (n.isTransition) {
      var m = L.T,
        x = {};
      L.T = x;
      try {
        var w = a(d, r),
          _ = L.S;
        (_ !== null && _(x, w), kp(e, n, w));
      } catch (N) {
        Bh(e, n, N);
      } finally {
        (m !== null && x.types !== null && (m.types = x.types), (L.T = m));
      }
    } else
      try {
        ((m = a(d, r)), kp(e, n, m));
      } catch (N) {
        Bh(e, n, N);
      }
  }
  function kp(e, n, a) {
    a !== null && typeof a == "object" && typeof a.then == "function"
      ? a.then(
          function (r) {
            Hp(e, n, r);
          },
          function (r) {
            return Bh(e, n, r);
          },
        )
      : Hp(e, n, a);
  }
  function Hp(e, n, a) {
    ((n.status = "fulfilled"),
      (n.value = a),
      Vp(n),
      (e.state = a),
      (n = e.pending),
      n !== null &&
        ((a = n.next), a === n ? (e.pending = null) : ((a = a.next), (n.next = a), Lp(e, a))));
  }
  function Bh(e, n, a) {
    var r = e.pending;
    if (((e.pending = null), r !== null)) {
      r = r.next;
      do ((n.status = "rejected"), (n.reason = a), Vp(n), (n = n.next));
      while (n !== r);
    }
    e.action = null;
  }
  function Vp(e) {
    e = e.listeners;
    for (var n = 0; n < e.length; n++) (0, e[n])();
  }
  function Gp(e, n) {
    return n;
  }
  function jp(e, n) {
    if (Et) {
      var a = Xt.formState;
      if (a !== null) {
        t: {
          var r = yt;
          if (Et) {
            if (Wt) {
              e: {
                for (var d = Wt, m = pi; d.nodeType !== 8;) {
                  if (!m) {
                    d = null;
                    break e;
                  }
                  if (((d = yi(d.nextSibling)), d === null)) {
                    d = null;
                    break e;
                  }
                }
                ((m = d.data), (d = m === "F!" || m === "F" ? d : null));
              }
              if (d) {
                ((Wt = yi(d.nextSibling)), (r = d.data === "F!"));
                break t;
              }
            }
            Cn(r);
          }
          r = !1;
        }
        r && (n = a[0]);
      }
    }
    return (
      (a = Fe()),
      (a.memoizedState = a.baseState = n),
      (r = {
        pending: null,
        lanes: 0,
        dispatch: null,
        lastRenderedReducer: Gp,
        lastRenderedState: n,
      }),
      (a.queue = r),
      (a = rm.bind(null, yt, r)),
      (r.dispatch = a),
      (r = Oh(!1)),
      (m = kh.bind(null, yt, !1, r.queue)),
      (r = Fe()),
      (d = { state: n, dispatch: null, action: e, pending: null }),
      (r.queue = d),
      (a = vx.bind(null, yt, d, m, a)),
      (d.dispatch = a),
      (r.memoizedState = e),
      [n, a, !1]
    );
  }
  function Yp(e) {
    var n = oe();
    return qp(n, Vt, e);
  }
  function qp(e, n, a) {
    if (
      ((n = Rh(e, n, Gp)[0]),
      (e = ml($i)[0]),
      typeof n == "object" && n !== null && typeof n.then == "function")
    )
      try {
        var r = Mo(n);
      } catch (x) {
        throw x === na ? al : x;
      }
    else r = n;
    n = oe();
    var d = n.queue,
      m = d.dispatch;
    return (
      a !== n.memoizedState &&
        ((yt.flags |= 2048), la(9, { destroy: void 0 }, bx.bind(null, d, a), null)),
      [r, m, e]
    );
  }
  function bx(e, n) {
    e.action = n;
  }
  function Xp(e) {
    var n = oe(),
      a = Vt;
    if (a !== null) return qp(n, a, e);
    (oe(), (n = n.memoizedState), (a = oe()));
    var r = a.queue.dispatch;
    return ((a.memoizedState = e), [n, r, !1]);
  }
  function la(e, n, a, r) {
    return (
      (e = { tag: e, create: a, deps: r, inst: n, next: null }),
      (n = yt.updateQueue),
      n === null && ((n = dl()), (yt.updateQueue = n)),
      (a = n.lastEffect),
      a === null
        ? (n.lastEffect = e.next = e)
        : ((r = a.next), (a.next = e), (e.next = r), (n.lastEffect = e)),
      e
    );
  }
  function Ip() {
    return oe().memoizedState;
  }
  function yl(e, n, a, r) {
    var d = Fe();
    ((yt.flags |= e),
      (d.memoizedState = la(1 | n, { destroy: void 0 }, a, r === void 0 ? null : r)));
  }
  function gl(e, n, a, r) {
    var d = oe();
    r = r === void 0 ? null : r;
    var m = d.memoizedState.inst;
    Vt !== null && r !== null && Ah(r, Vt.memoizedState.deps)
      ? (d.memoizedState = la(n, m, a, r))
      : ((yt.flags |= e), (d.memoizedState = la(1 | n, m, a, r)));
  }
  function Zp(e, n) {
    yl(8390656, 8, e, n);
  }
  function Dh(e, n) {
    gl(2048, 8, e, n);
  }
  function xx(e) {
    yt.flags |= 4;
    var n = yt.updateQueue;
    if (n === null) ((n = dl()), (yt.updateQueue = n), (n.events = [e]));
    else {
      var a = n.events;
      a === null ? (n.events = [e]) : a.push(e);
    }
  }
  function Pp(e) {
    var n = oe().memoizedState;
    return (
      xx({ ref: n, nextImpl: e }),
      function () {
        if ((Dt & 2) !== 0) throw Error(s(440));
        return n.impl.apply(void 0, arguments);
      }
    );
  }
  function Wp(e, n) {
    return gl(4, 2, e, n);
  }
  function Jp(e, n) {
    return gl(4, 4, e, n);
  }
  function Qp(e, n) {
    if (typeof n == "function") {
      e = e();
      var a = n(e);
      return function () {
        typeof a == "function" ? a() : n(null);
      };
    }
    if (n != null)
      return (
        (e = e()),
        (n.current = e),
        function () {
          n.current = null;
        }
      );
  }
  function Kp(e, n, a) {
    ((a = a != null ? a.concat([e]) : null), gl(4, 4, Qp.bind(null, n, e), a));
  }
  function Nh() {}
  function $p(e, n) {
    var a = oe();
    n = n === void 0 ? null : n;
    var r = a.memoizedState;
    return n !== null && Ah(n, r[1]) ? r[0] : ((a.memoizedState = [e, n]), e);
  }
  function tm(e, n) {
    var a = oe();
    n = n === void 0 ? null : n;
    var r = a.memoizedState;
    if (n !== null && Ah(n, r[1])) return r[0];
    if (((r = e()), ws)) {
      _n(!0);
      try {
        e();
      } finally {
        _n(!1);
      }
    }
    return ((a.memoizedState = [r, n]), r);
  }
  function Uh(e, n, a) {
    return a === void 0 || ((Ki & 1073741824) !== 0 && (_t & 261930) === 0)
      ? (e.memoizedState = n)
      : ((e.memoizedState = a), (e = ey()), (yt.lanes |= e), (Hn |= e), a);
  }
  function em(e, n, a, r) {
    return We(a, n)
      ? a
      : aa.current !== null
        ? ((e = Uh(e, a, r)), We(e, n) || (he = !0), e)
        : (Ki & 42) === 0 || ((Ki & 1073741824) !== 0 && (_t & 261930) === 0)
          ? ((he = !0), (e.memoizedState = a))
          : ((e = ey()), (yt.lanes |= e), (Hn |= e), n);
  }
  function im(e, n, a, r, d) {
    var m = I.p;
    I.p = m !== 0 && 8 > m ? m : 8;
    var x = L.T,
      w = {};
    ((L.T = w), kh(e, !1, n, a));
    try {
      var _ = d(),
        N = L.S;
      if (
        (N !== null && N(w, _), _ !== null && typeof _ == "object" && typeof _.then == "function")
      ) {
        var V = mx(_, r);
        _o(e, n, V, ei(e));
      } else _o(e, n, r, ei(e));
    } catch (Y) {
      _o(e, n, { then: function () {}, status: "rejected", reason: Y }, ei());
    } finally {
      ((I.p = m), x !== null && w.types !== null && (x.types = w.types), (L.T = x));
    }
  }
  function Sx() {}
  function Fh(e, n, a, r) {
    if (e.tag !== 5) throw Error(s(476));
    var d = nm(e).queue;
    im(
      e,
      d,
      n,
      nt,
      a === null
        ? Sx
        : function () {
            return (sm(e), a(r));
          },
    );
  }
  function nm(e) {
    var n = e.memoizedState;
    if (n !== null) return n;
    n = {
      memoizedState: nt,
      baseState: nt,
      baseQueue: null,
      queue: {
        pending: null,
        lanes: 0,
        dispatch: null,
        lastRenderedReducer: $i,
        lastRenderedState: nt,
      },
      next: null,
    };
    var a = {};
    return (
      (n.next = {
        memoizedState: a,
        baseState: a,
        baseQueue: null,
        queue: {
          pending: null,
          lanes: 0,
          dispatch: null,
          lastRenderedReducer: $i,
          lastRenderedState: a,
        },
        next: null,
      }),
      (e.memoizedState = n),
      (e = e.alternate),
      e !== null && (e.memoizedState = n),
      n
    );
  }
  function sm(e) {
    var n = nm(e);
    (n.next === null && (n = e.alternate.memoizedState), _o(e, n.next.queue, {}, ei()));
  }
  function Lh() {
    return Ae(jo);
  }
  function am() {
    return oe().memoizedState;
  }
  function om() {
    return oe().memoizedState;
  }
  function wx(e) {
    for (var n = e.return; n !== null;) {
      switch (n.tag) {
        case 24:
        case 3:
          var a = ei();
          e = Dn(a);
          var r = Nn(n, e, a);
          (r !== null && (qe(r, n, a), xo(r, n, a)), (n = { cache: fh() }), (e.payload = n));
          return;
      }
      n = n.return;
    }
  }
  function Ax(e, n, a) {
    var r = ei();
    ((a = {
      lane: r,
      revertLane: 0,
      gesture: null,
      action: a,
      hasEagerState: !1,
      eagerState: null,
      next: null,
    }),
      vl(e) ? lm(n, a) : ((a = eh(e, n, a, r)), a !== null && (qe(a, e, r), cm(a, n, r))));
  }
  function rm(e, n, a) {
    var r = ei();
    _o(e, n, a, r);
  }
  function _o(e, n, a, r) {
    var d = {
      lane: r,
      revertLane: 0,
      gesture: null,
      action: a,
      hasEagerState: !1,
      eagerState: null,
      next: null,
    };
    if (vl(e)) lm(n, d);
    else {
      var m = e.alternate;
      if (
        e.lanes === 0 &&
        (m === null || m.lanes === 0) &&
        ((m = n.lastRenderedReducer), m !== null)
      )
        try {
          var x = n.lastRenderedState,
            w = m(x, a);
          if (((d.hasEagerState = !0), (d.eagerState = w), We(w, x)))
            return (Kr(e, n, d, 0), Xt === null && Qr(), !1);
        } catch {
        } finally {
        }
      if (((a = eh(e, n, d, r)), a !== null)) return (qe(a, e, r), cm(a, n, r), !0);
    }
    return !1;
  }
  function kh(e, n, a, r) {
    if (
      ((r = {
        lane: 2,
        revertLane: gf(),
        gesture: null,
        action: r,
        hasEagerState: !1,
        eagerState: null,
        next: null,
      }),
      vl(e))
    ) {
      if (n) throw Error(s(479));
    } else ((n = eh(e, a, r, 2)), n !== null && qe(n, e, 2));
  }
  function vl(e) {
    var n = e.alternate;
    return e === yt || (n !== null && n === yt);
  }
  function lm(e, n) {
    oa = hl = !0;
    var a = e.pending;
    (a === null ? (n.next = n) : ((n.next = a.next), (a.next = n)), (e.pending = n));
  }
  function cm(e, n, a) {
    if ((a & 4194048) !== 0) {
      var r = n.lanes;
      ((r &= e.pendingLanes), (a |= r), (n.lanes = a), p0(e, a));
    }
  }
  var To = {
    readContext: Ae,
    use: pl,
    useCallback: ee,
    useContext: ee,
    useEffect: ee,
    useImperativeHandle: ee,
    useLayoutEffect: ee,
    useInsertionEffect: ee,
    useMemo: ee,
    useReducer: ee,
    useRef: ee,
    useState: ee,
    useDebugValue: ee,
    useDeferredValue: ee,
    useTransition: ee,
    useSyncExternalStore: ee,
    useId: ee,
    useHostTransitionStatus: ee,
    useFormState: ee,
    useActionState: ee,
    useOptimistic: ee,
    useMemoCache: ee,
    useCacheRefresh: ee,
  };
  To.useEffectEvent = ee;
  var um = {
      readContext: Ae,
      use: pl,
      useCallback: function (e, n) {
        return ((Fe().memoizedState = [e, n === void 0 ? null : n]), e);
      },
      useContext: Ae,
      useEffect: Zp,
      useImperativeHandle: function (e, n, a) {
        ((a = a != null ? a.concat([e]) : null), yl(4194308, 4, Qp.bind(null, n, e), a));
      },
      useLayoutEffect: function (e, n) {
        return yl(4194308, 4, e, n);
      },
      useInsertionEffect: function (e, n) {
        yl(4, 2, e, n);
      },
      useMemo: function (e, n) {
        var a = Fe();
        n = n === void 0 ? null : n;
        var r = e();
        if (ws) {
          _n(!0);
          try {
            e();
          } finally {
            _n(!1);
          }
        }
        return ((a.memoizedState = [r, n]), r);
      },
      useReducer: function (e, n, a) {
        var r = Fe();
        if (a !== void 0) {
          var d = a(n);
          if (ws) {
            _n(!0);
            try {
              a(n);
            } finally {
              _n(!1);
            }
          }
        } else d = n;
        return (
          (r.memoizedState = r.baseState = d),
          (e = {
            pending: null,
            lanes: 0,
            dispatch: null,
            lastRenderedReducer: e,
            lastRenderedState: d,
          }),
          (r.queue = e),
          (e = e.dispatch = Ax.bind(null, yt, e)),
          [r.memoizedState, e]
        );
      },
      useRef: function (e) {
        var n = Fe();
        return ((e = { current: e }), (n.memoizedState = e));
      },
      useState: function (e) {
        e = Oh(e);
        var n = e.queue,
          a = rm.bind(null, yt, n);
        return ((n.dispatch = a), [e.memoizedState, a]);
      },
      useDebugValue: Nh,
      useDeferredValue: function (e, n) {
        var a = Fe();
        return Uh(a, e, n);
      },
      useTransition: function () {
        var e = Oh(!1);
        return ((e = im.bind(null, yt, e.queue, !0, !1)), (Fe().memoizedState = e), [!1, e]);
      },
      useSyncExternalStore: function (e, n, a) {
        var r = yt,
          d = Fe();
        if (Et) {
          if (a === void 0) throw Error(s(407));
          a = a();
        } else {
          if (((a = n()), Xt === null)) throw Error(s(349));
          (_t & 127) !== 0 || Op(r, n, a);
        }
        d.memoizedState = a;
        var m = { value: a, getSnapshot: n };
        return (
          (d.queue = m),
          Zp(Dp.bind(null, r, m, e), [e]),
          (r.flags |= 2048),
          la(9, { destroy: void 0 }, Bp.bind(null, r, m, a, n), null),
          a
        );
      },
      useId: function () {
        var e = Fe(),
          n = Xt.identifierPrefix;
        if (Et) {
          var a = ki,
            r = Li;
          ((a = (r & ~(1 << (32 - Pe(r) - 1))).toString(32) + a),
            (n = "_" + n + "R_" + a),
            (a = fl++),
            0 < a && (n += "H" + a.toString(32)),
            (n += "_"));
        } else ((a = yx++), (n = "_" + n + "r_" + a.toString(32) + "_"));
        return (e.memoizedState = n);
      },
      useHostTransitionStatus: Lh,
      useFormState: jp,
      useActionState: jp,
      useOptimistic: function (e) {
        var n = Fe();
        n.memoizedState = n.baseState = e;
        var a = {
          pending: null,
          lanes: 0,
          dispatch: null,
          lastRenderedReducer: null,
          lastRenderedState: null,
        };
        return ((n.queue = a), (n = kh.bind(null, yt, !0, a)), (a.dispatch = n), [e, n]);
      },
      useMemoCache: Eh,
      useCacheRefresh: function () {
        return (Fe().memoizedState = wx.bind(null, yt));
      },
      useEffectEvent: function (e) {
        var n = Fe(),
          a = { impl: e };
        return (
          (n.memoizedState = a),
          function () {
            if ((Dt & 2) !== 0) throw Error(s(440));
            return a.impl.apply(void 0, arguments);
          }
        );
      },
    },
    Hh = {
      readContext: Ae,
      use: pl,
      useCallback: $p,
      useContext: Ae,
      useEffect: Dh,
      useImperativeHandle: Kp,
      useInsertionEffect: Wp,
      useLayoutEffect: Jp,
      useMemo: tm,
      useReducer: ml,
      useRef: Ip,
      useState: function () {
        return ml($i);
      },
      useDebugValue: Nh,
      useDeferredValue: function (e, n) {
        var a = oe();
        return em(a, Vt.memoizedState, e, n);
      },
      useTransition: function () {
        var e = ml($i)[0],
          n = oe().memoizedState;
        return [typeof e == "boolean" ? e : Mo(e), n];
      },
      useSyncExternalStore: Cp,
      useId: am,
      useHostTransitionStatus: Lh,
      useFormState: Yp,
      useActionState: Yp,
      useOptimistic: function (e, n) {
        var a = oe();
        return Fp(a, Vt, e, n);
      },
      useMemoCache: Eh,
      useCacheRefresh: om,
    };
  Hh.useEffectEvent = Pp;
  var hm = {
    readContext: Ae,
    use: pl,
    useCallback: $p,
    useContext: Ae,
    useEffect: Dh,
    useImperativeHandle: Kp,
    useInsertionEffect: Wp,
    useLayoutEffect: Jp,
    useMemo: tm,
    useReducer: Ch,
    useRef: Ip,
    useState: function () {
      return Ch($i);
    },
    useDebugValue: Nh,
    useDeferredValue: function (e, n) {
      var a = oe();
      return Vt === null ? Uh(a, e, n) : em(a, Vt.memoizedState, e, n);
    },
    useTransition: function () {
      var e = Ch($i)[0],
        n = oe().memoizedState;
      return [typeof e == "boolean" ? e : Mo(e), n];
    },
    useSyncExternalStore: Cp,
    useId: am,
    useHostTransitionStatus: Lh,
    useFormState: Xp,
    useActionState: Xp,
    useOptimistic: function (e, n) {
      var a = oe();
      return Vt !== null ? Fp(a, Vt, e, n) : ((a.baseState = e), [e, a.queue.dispatch]);
    },
    useMemoCache: Eh,
    useCacheRefresh: om,
  };
  hm.useEffectEvent = Pp;
  function Vh(e, n, a, r) {
    ((n = e.memoizedState),
      (a = a(r, n)),
      (a = a == null ? n : g({}, n, a)),
      (e.memoizedState = a),
      e.lanes === 0 && (e.updateQueue.baseState = a));
  }
  var Gh = {
    enqueueSetState: function (e, n, a) {
      e = e._reactInternals;
      var r = ei(),
        d = Dn(r);
      ((d.payload = n),
        a != null && (d.callback = a),
        (n = Nn(e, d, r)),
        n !== null && (qe(n, e, r), xo(n, e, r)));
    },
    enqueueReplaceState: function (e, n, a) {
      e = e._reactInternals;
      var r = ei(),
        d = Dn(r);
      ((d.tag = 1),
        (d.payload = n),
        a != null && (d.callback = a),
        (n = Nn(e, d, r)),
        n !== null && (qe(n, e, r), xo(n, e, r)));
    },
    enqueueForceUpdate: function (e, n) {
      e = e._reactInternals;
      var a = ei(),
        r = Dn(a);
      ((r.tag = 2),
        n != null && (r.callback = n),
        (n = Nn(e, r, a)),
        n !== null && (qe(n, e, a), xo(n, e, a)));
    },
  };
  function fm(e, n, a, r, d, m, x) {
    return (
      (e = e.stateNode),
      typeof e.shouldComponentUpdate == "function"
        ? e.shouldComponentUpdate(r, m, x)
        : n.prototype && n.prototype.isPureReactComponent
          ? !ho(a, r) || !ho(d, m)
          : !0
    );
  }
  function dm(e, n, a, r) {
    ((e = n.state),
      typeof n.componentWillReceiveProps == "function" && n.componentWillReceiveProps(a, r),
      typeof n.UNSAFE_componentWillReceiveProps == "function" &&
        n.UNSAFE_componentWillReceiveProps(a, r),
      n.state !== e && Gh.enqueueReplaceState(n, n.state, null));
  }
  function As(e, n) {
    var a = n;
    if ("ref" in n) {
      a = {};
      for (var r in n) r !== "ref" && (a[r] = n[r]);
    }
    if ((e = e.defaultProps)) {
      a === n && (a = g({}, a));
      for (var d in e) a[d] === void 0 && (a[d] = e[d]);
    }
    return a;
  }
  function pm(e) {
    Jr(e);
  }
  function mm(e) {
    console.error(e);
  }
  function ym(e) {
    Jr(e);
  }
  function bl(e, n) {
    try {
      var a = e.onUncaughtError;
      a(n.value, { componentStack: n.stack });
    } catch (r) {
      setTimeout(function () {
        throw r;
      });
    }
  }
  function gm(e, n, a) {
    try {
      var r = e.onCaughtError;
      r(a.value, { componentStack: a.stack, errorBoundary: n.tag === 1 ? n.stateNode : null });
    } catch (d) {
      setTimeout(function () {
        throw d;
      });
    }
  }
  function jh(e, n, a) {
    return (
      (a = Dn(a)),
      (a.tag = 3),
      (a.payload = { element: null }),
      (a.callback = function () {
        bl(e, n);
      }),
      a
    );
  }
  function vm(e) {
    return ((e = Dn(e)), (e.tag = 3), e);
  }
  function bm(e, n, a, r) {
    var d = a.type.getDerivedStateFromError;
    if (typeof d == "function") {
      var m = r.value;
      ((e.payload = function () {
        return d(m);
      }),
        (e.callback = function () {
          gm(n, a, r);
        }));
    }
    var x = a.stateNode;
    x !== null &&
      typeof x.componentDidCatch == "function" &&
      (e.callback = function () {
        (gm(n, a, r),
          typeof d != "function" && (Vn === null ? (Vn = new Set([this])) : Vn.add(this)));
        var w = r.stack;
        this.componentDidCatch(r.value, { componentStack: w !== null ? w : "" });
      });
  }
  function Mx(e, n, a, r, d) {
    if (((a.flags |= 32768), r !== null && typeof r == "object" && typeof r.then == "function")) {
      if (((n = a.alternate), n !== null && ta(n, a, d, !0), (a = Qe.current), a !== null)) {
        switch (a.tag) {
          case 31:
          case 13:
            return (
              mi === null ? Ol() : a.alternate === null && ie === 0 && (ie = 3),
              (a.flags &= -257),
              (a.flags |= 65536),
              (a.lanes = d),
              r === ol
                ? (a.flags |= 16384)
                : ((n = a.updateQueue),
                  n === null ? (a.updateQueue = new Set([r])) : n.add(r),
                  pf(e, r, d)),
              !1
            );
          case 22:
            return (
              (a.flags |= 65536),
              r === ol
                ? (a.flags |= 16384)
                : ((n = a.updateQueue),
                  n === null
                    ? ((n = { transitions: null, markerInstances: null, retryQueue: new Set([r]) }),
                      (a.updateQueue = n))
                    : ((a = n.retryQueue), a === null ? (n.retryQueue = new Set([r])) : a.add(r)),
                  pf(e, r, d)),
              !1
            );
        }
        throw Error(s(435, a.tag));
      }
      return (pf(e, r, d), Ol(), !1);
    }
    if (Et)
      return (
        (n = Qe.current),
        n !== null
          ? ((n.flags & 65536) === 0 && (n.flags |= 256),
            (n.flags |= 65536),
            (n.lanes = d),
            r !== rh && ((e = Error(s(422), { cause: r })), mo(hi(e, a))))
          : (r !== rh && ((n = Error(s(423), { cause: r })), mo(hi(n, a))),
            (e = e.current.alternate),
            (e.flags |= 65536),
            (d &= -d),
            (e.lanes |= d),
            (r = hi(r, a)),
            (d = jh(e.stateNode, r, d)),
            vh(e, d),
            ie !== 4 && (ie = 2)),
        !1
      );
    var m = Error(s(520), { cause: r });
    if (((m = hi(m, a)), No === null ? (No = [m]) : No.push(m), ie !== 4 && (ie = 2), n === null))
      return !0;
    ((r = hi(r, a)), (a = n));
    do {
      switch (a.tag) {
        case 3:
          return (
            (a.flags |= 65536),
            (e = d & -d),
            (a.lanes |= e),
            (e = jh(a.stateNode, r, e)),
            vh(a, e),
            !1
          );
        case 1:
          if (
            ((n = a.type),
            (m = a.stateNode),
            (a.flags & 128) === 0 &&
              (typeof n.getDerivedStateFromError == "function" ||
                (m !== null &&
                  typeof m.componentDidCatch == "function" &&
                  (Vn === null || !Vn.has(m)))))
          )
            return (
              (a.flags |= 65536),
              (d &= -d),
              (a.lanes |= d),
              (d = vm(d)),
              bm(d, e, a, r),
              vh(a, d),
              !1
            );
      }
      a = a.return;
    } while (a !== null);
    return !1;
  }
  var Yh = Error(s(461)),
    he = !1;
  function Me(e, n, a, r) {
    n.child = e === null ? Ap(n, null, a, r) : Ss(n, e.child, a, r);
  }
  function xm(e, n, a, r, d) {
    a = a.render;
    var m = n.ref;
    if ("ref" in r) {
      var x = {};
      for (var w in r) w !== "ref" && (x[w] = r[w]);
    } else x = r;
    return (
      gs(n),
      (r = Mh(e, n, a, x, m, d)),
      (w = _h()),
      e !== null && !he
        ? (Th(e, n, d), tn(e, n, d))
        : (Et && w && ah(n), (n.flags |= 1), Me(e, n, r, d), n.child)
    );
  }
  function Sm(e, n, a, r, d) {
    if (e === null) {
      var m = a.type;
      return typeof m == "function" && !ih(m) && m.defaultProps === void 0 && a.compare === null
        ? ((n.tag = 15), (n.type = m), wm(e, n, m, r, d))
        : ((e = tl(a.type, null, r, n, n.mode, d)), (e.ref = n.ref), (e.return = n), (n.child = e));
    }
    if (((m = e.child), !Qh(e, d))) {
      var x = m.memoizedProps;
      if (((a = a.compare), (a = a !== null ? a : ho), a(x, r) && e.ref === n.ref))
        return tn(e, n, d);
    }
    return ((n.flags |= 1), (e = Pi(m, r)), (e.ref = n.ref), (e.return = n), (n.child = e));
  }
  function wm(e, n, a, r, d) {
    if (e !== null) {
      var m = e.memoizedProps;
      if (ho(m, r) && e.ref === n.ref)
        if (((he = !1), (n.pendingProps = r = m), Qh(e, d))) (e.flags & 131072) !== 0 && (he = !0);
        else return ((n.lanes = e.lanes), tn(e, n, d));
    }
    return qh(e, n, a, r, d);
  }
  function Am(e, n, a, r) {
    var d = r.children,
      m = e !== null ? e.memoizedState : null;
    if (
      (e === null &&
        n.stateNode === null &&
        (n.stateNode = {
          _visibility: 1,
          _pendingMarkers: null,
          _retryCache: null,
          _transitions: null,
        }),
      r.mode === "hidden")
    ) {
      if ((n.flags & 128) !== 0) {
        if (((m = m !== null ? m.baseLanes | a : a), e !== null)) {
          for (r = n.child = e.child, d = 0; r !== null;)
            ((d = d | r.lanes | r.childLanes), (r = r.sibling));
          r = d & ~m;
        } else ((r = 0), (n.child = null));
        return Mm(e, n, m, a, r);
      }
      if ((a & 536870912) !== 0)
        ((n.memoizedState = { baseLanes: 0, cachePool: null }),
          e !== null && sl(n, m !== null ? m.cachePool : null),
          m !== null ? Tp(n, m) : xh(),
          zp(n));
      else return ((r = n.lanes = 536870912), Mm(e, n, m !== null ? m.baseLanes | a : a, a, r));
    } else
      m !== null
        ? (sl(n, m.cachePool), Tp(n, m), Fn(), (n.memoizedState = null))
        : (e !== null && sl(n, null), xh(), Fn());
    return (Me(e, n, d, a), n.child);
  }
  function zo(e, n) {
    return (
      (e !== null && e.tag === 22) ||
        n.stateNode !== null ||
        (n.stateNode = {
          _visibility: 1,
          _pendingMarkers: null,
          _retryCache: null,
          _transitions: null,
        }),
      n.sibling
    );
  }
  function Mm(e, n, a, r, d) {
    var m = ph();
    return (
      (m = m === null ? null : { parent: ce._currentValue, pool: m }),
      (n.memoizedState = { baseLanes: a, cachePool: m }),
      e !== null && sl(n, null),
      xh(),
      zp(n),
      e !== null && ta(e, n, r, !0),
      (n.childLanes = d),
      null
    );
  }
  function xl(e, n) {
    return (
      (n = wl({ mode: n.mode, children: n.children }, e.mode)),
      (n.ref = e.ref),
      (e.child = n),
      (n.return = e),
      n
    );
  }
  function _m(e, n, a) {
    return (
      Ss(n, e.child, null, a),
      (e = xl(n, n.pendingProps)),
      (e.flags |= 2),
      Ke(n),
      (n.memoizedState = null),
      e
    );
  }
  function _x(e, n, a) {
    var r = n.pendingProps,
      d = (n.flags & 128) !== 0;
    if (((n.flags &= -129), e === null)) {
      if (Et) {
        if (r.mode === "hidden") return ((e = xl(n, r)), (n.lanes = 536870912), zo(null, e));
        if (
          (wh(n),
          (e = Wt)
            ? ((e = Ly(e, pi)),
              (e = e !== null && e.data === "&" ? e : null),
              e !== null &&
                ((n.memoizedState = {
                  dehydrated: e,
                  treeContext: En !== null ? { id: Li, overflow: ki } : null,
                  retryLane: 536870912,
                  hydrationErrors: null,
                }),
                (a = lp(e)),
                (a.return = n),
                (n.child = a),
                (we = n),
                (Wt = null)))
            : (e = null),
          e === null)
        )
          throw Cn(n);
        return ((n.lanes = 536870912), null);
      }
      return xl(n, r);
    }
    var m = e.memoizedState;
    if (m !== null) {
      var x = m.dehydrated;
      if ((wh(n), d))
        if (n.flags & 256) ((n.flags &= -257), (n = _m(e, n, a)));
        else if (n.memoizedState !== null) ((n.child = e.child), (n.flags |= 128), (n = null));
        else throw Error(s(558));
      else if ((he || ta(e, n, a, !1), (d = (a & e.childLanes) !== 0), he || d)) {
        if (((r = Xt), r !== null && ((x = m0(r, a)), x !== 0 && x !== m.retryLane)))
          throw ((m.retryLane = x), ds(e, x), qe(r, e, x), Yh);
        (Ol(), (n = _m(e, n, a)));
      } else
        ((e = m.treeContext),
          (Wt = yi(x.nextSibling)),
          (we = n),
          (Et = !0),
          (Rn = null),
          (pi = !1),
          e !== null && hp(n, e),
          (n = xl(n, r)),
          (n.flags |= 4096));
      return n;
    }
    return (
      (e = Pi(e.child, { mode: r.mode, children: r.children })),
      (e.ref = n.ref),
      (n.child = e),
      (e.return = n),
      e
    );
  }
  function Sl(e, n) {
    var a = n.ref;
    if (a === null) e !== null && e.ref !== null && (n.flags |= 4194816);
    else {
      if (typeof a != "function" && typeof a != "object") throw Error(s(284));
      (e === null || e.ref !== a) && (n.flags |= 4194816);
    }
  }
  function qh(e, n, a, r, d) {
    return (
      gs(n),
      (a = Mh(e, n, a, r, void 0, d)),
      (r = _h()),
      e !== null && !he
        ? (Th(e, n, d), tn(e, n, d))
        : (Et && r && ah(n), (n.flags |= 1), Me(e, n, a, d), n.child)
    );
  }
  function Tm(e, n, a, r, d, m) {
    return (
      gs(n),
      (n.updateQueue = null),
      (a = Rp(n, r, a, d)),
      Ep(e),
      (r = _h()),
      e !== null && !he
        ? (Th(e, n, m), tn(e, n, m))
        : (Et && r && ah(n), (n.flags |= 1), Me(e, n, a, m), n.child)
    );
  }
  function zm(e, n, a, r, d) {
    if ((gs(n), n.stateNode === null)) {
      var m = Js,
        x = a.contextType;
      (typeof x == "object" && x !== null && (m = Ae(x)),
        (m = new a(r, m)),
        (n.memoizedState = m.state !== null && m.state !== void 0 ? m.state : null),
        (m.updater = Gh),
        (n.stateNode = m),
        (m._reactInternals = n),
        (m = n.stateNode),
        (m.props = r),
        (m.state = n.memoizedState),
        (m.refs = {}),
        yh(n),
        (x = a.contextType),
        (m.context = typeof x == "object" && x !== null ? Ae(x) : Js),
        (m.state = n.memoizedState),
        (x = a.getDerivedStateFromProps),
        typeof x == "function" && (Vh(n, a, x, r), (m.state = n.memoizedState)),
        typeof a.getDerivedStateFromProps == "function" ||
          typeof m.getSnapshotBeforeUpdate == "function" ||
          (typeof m.UNSAFE_componentWillMount != "function" &&
            typeof m.componentWillMount != "function") ||
          ((x = m.state),
          typeof m.componentWillMount == "function" && m.componentWillMount(),
          typeof m.UNSAFE_componentWillMount == "function" && m.UNSAFE_componentWillMount(),
          x !== m.state && Gh.enqueueReplaceState(m, m.state, null),
          wo(n, r, m, d),
          So(),
          (m.state = n.memoizedState)),
        typeof m.componentDidMount == "function" && (n.flags |= 4194308),
        (r = !0));
    } else if (e === null) {
      m = n.stateNode;
      var w = n.memoizedProps,
        _ = As(a, w);
      m.props = _;
      var N = m.context,
        V = a.contextType;
      ((x = Js), typeof V == "object" && V !== null && (x = Ae(V)));
      var Y = a.getDerivedStateFromProps;
      ((V = typeof Y == "function" || typeof m.getSnapshotBeforeUpdate == "function"),
        (w = n.pendingProps !== w),
        V ||
          (typeof m.UNSAFE_componentWillReceiveProps != "function" &&
            typeof m.componentWillReceiveProps != "function") ||
          ((w || N !== x) && dm(n, m, r, x)),
        (Bn = !1));
      var F = n.memoizedState;
      ((m.state = F),
        wo(n, r, m, d),
        So(),
        (N = n.memoizedState),
        w || F !== N || Bn
          ? (typeof Y == "function" && (Vh(n, a, Y, r), (N = n.memoizedState)),
            (_ = Bn || fm(n, a, _, r, F, N, x))
              ? (V ||
                  (typeof m.UNSAFE_componentWillMount != "function" &&
                    typeof m.componentWillMount != "function") ||
                  (typeof m.componentWillMount == "function" && m.componentWillMount(),
                  typeof m.UNSAFE_componentWillMount == "function" &&
                    m.UNSAFE_componentWillMount()),
                typeof m.componentDidMount == "function" && (n.flags |= 4194308))
              : (typeof m.componentDidMount == "function" && (n.flags |= 4194308),
                (n.memoizedProps = r),
                (n.memoizedState = N)),
            (m.props = r),
            (m.state = N),
            (m.context = x),
            (r = _))
          : (typeof m.componentDidMount == "function" && (n.flags |= 4194308), (r = !1)));
    } else {
      ((m = n.stateNode),
        gh(e, n),
        (x = n.memoizedProps),
        (V = As(a, x)),
        (m.props = V),
        (Y = n.pendingProps),
        (F = m.context),
        (N = a.contextType),
        (_ = Js),
        typeof N == "object" && N !== null && (_ = Ae(N)),
        (w = a.getDerivedStateFromProps),
        (N = typeof w == "function" || typeof m.getSnapshotBeforeUpdate == "function") ||
          (typeof m.UNSAFE_componentWillReceiveProps != "function" &&
            typeof m.componentWillReceiveProps != "function") ||
          ((x !== Y || F !== _) && dm(n, m, r, _)),
        (Bn = !1),
        (F = n.memoizedState),
        (m.state = F),
        wo(n, r, m, d),
        So());
      var k = n.memoizedState;
      x !== Y || F !== k || Bn || (e !== null && e.dependencies !== null && il(e.dependencies))
        ? (typeof w == "function" && (Vh(n, a, w, r), (k = n.memoizedState)),
          (V =
            Bn ||
            fm(n, a, V, r, F, k, _) ||
            (e !== null && e.dependencies !== null && il(e.dependencies)))
            ? (N ||
                (typeof m.UNSAFE_componentWillUpdate != "function" &&
                  typeof m.componentWillUpdate != "function") ||
                (typeof m.componentWillUpdate == "function" && m.componentWillUpdate(r, k, _),
                typeof m.UNSAFE_componentWillUpdate == "function" &&
                  m.UNSAFE_componentWillUpdate(r, k, _)),
              typeof m.componentDidUpdate == "function" && (n.flags |= 4),
              typeof m.getSnapshotBeforeUpdate == "function" && (n.flags |= 1024))
            : (typeof m.componentDidUpdate != "function" ||
                (x === e.memoizedProps && F === e.memoizedState) ||
                (n.flags |= 4),
              typeof m.getSnapshotBeforeUpdate != "function" ||
                (x === e.memoizedProps && F === e.memoizedState) ||
                (n.flags |= 1024),
              (n.memoizedProps = r),
              (n.memoizedState = k)),
          (m.props = r),
          (m.state = k),
          (m.context = _),
          (r = V))
        : (typeof m.componentDidUpdate != "function" ||
            (x === e.memoizedProps && F === e.memoizedState) ||
            (n.flags |= 4),
          typeof m.getSnapshotBeforeUpdate != "function" ||
            (x === e.memoizedProps && F === e.memoizedState) ||
            (n.flags |= 1024),
          (r = !1));
    }
    return (
      (m = r),
      Sl(e, n),
      (r = (n.flags & 128) !== 0),
      m || r
        ? ((m = n.stateNode),
          (a = r && typeof a.getDerivedStateFromError != "function" ? null : m.render()),
          (n.flags |= 1),
          e !== null && r
            ? ((n.child = Ss(n, e.child, null, d)), (n.child = Ss(n, null, a, d)))
            : Me(e, n, a, d),
          (n.memoizedState = m.state),
          (e = n.child))
        : (e = tn(e, n, d)),
      e
    );
  }
  function Em(e, n, a, r) {
    return (ms(), (n.flags |= 256), Me(e, n, a, r), n.child);
  }
  var Xh = { dehydrated: null, treeContext: null, retryLane: 0, hydrationErrors: null };
  function Ih(e) {
    return { baseLanes: e, cachePool: gp() };
  }
  function Zh(e, n, a) {
    return ((e = e !== null ? e.childLanes & ~a : 0), n && (e |= ti), e);
  }
  function Rm(e, n, a) {
    var r = n.pendingProps,
      d = !1,
      m = (n.flags & 128) !== 0,
      x;
    if (
      ((x = m) || (x = e !== null && e.memoizedState === null ? !1 : (ae.current & 2) !== 0),
      x && ((d = !0), (n.flags &= -129)),
      (x = (n.flags & 32) !== 0),
      (n.flags &= -33),
      e === null)
    ) {
      if (Et) {
        if (
          (d ? Un(n) : Fn(),
          (e = Wt)
            ? ((e = Ly(e, pi)),
              (e = e !== null && e.data !== "&" ? e : null),
              e !== null &&
                ((n.memoizedState = {
                  dehydrated: e,
                  treeContext: En !== null ? { id: Li, overflow: ki } : null,
                  retryLane: 536870912,
                  hydrationErrors: null,
                }),
                (a = lp(e)),
                (a.return = n),
                (n.child = a),
                (we = n),
                (Wt = null)))
            : (e = null),
          e === null)
        )
          throw Cn(n);
        return (Cf(e) ? (n.lanes = 32) : (n.lanes = 536870912), null);
      }
      var w = r.children;
      return (
        (r = r.fallback),
        d
          ? (Fn(),
            (d = n.mode),
            (w = wl({ mode: "hidden", children: w }, d)),
            (r = ps(r, d, a, null)),
            (w.return = n),
            (r.return = n),
            (w.sibling = r),
            (n.child = w),
            (r = n.child),
            (r.memoizedState = Ih(a)),
            (r.childLanes = Zh(e, x, a)),
            (n.memoizedState = Xh),
            zo(null, r))
          : (Un(n), Ph(n, w))
      );
    }
    var _ = e.memoizedState;
    if (_ !== null && ((w = _.dehydrated), w !== null)) {
      if (m)
        n.flags & 256
          ? (Un(n), (n.flags &= -257), (n = Wh(e, n, a)))
          : n.memoizedState !== null
            ? (Fn(), (n.child = e.child), (n.flags |= 128), (n = null))
            : (Fn(),
              (w = r.fallback),
              (d = n.mode),
              (r = wl({ mode: "visible", children: r.children }, d)),
              (w = ps(w, d, a, null)),
              (w.flags |= 2),
              (r.return = n),
              (w.return = n),
              (r.sibling = w),
              (n.child = r),
              Ss(n, e.child, null, a),
              (r = n.child),
              (r.memoizedState = Ih(a)),
              (r.childLanes = Zh(e, x, a)),
              (n.memoizedState = Xh),
              (n = zo(null, r)));
      else if ((Un(n), Cf(w))) {
        if (((x = w.nextSibling && w.nextSibling.dataset), x)) var N = x.dgst;
        ((x = N),
          (r = Error(s(419))),
          (r.stack = ""),
          (r.digest = x),
          mo({ value: r, source: null, stack: null }),
          (n = Wh(e, n, a)));
      } else if ((he || ta(e, n, a, !1), (x = (a & e.childLanes) !== 0), he || x)) {
        if (((x = Xt), x !== null && ((r = m0(x, a)), r !== 0 && r !== _.retryLane)))
          throw ((_.retryLane = r), ds(e, r), qe(x, e, r), Yh);
        (Rf(w) || Ol(), (n = Wh(e, n, a)));
      } else
        Rf(w)
          ? ((n.flags |= 192), (n.child = e.child), (n = null))
          : ((e = _.treeContext),
            (Wt = yi(w.nextSibling)),
            (we = n),
            (Et = !0),
            (Rn = null),
            (pi = !1),
            e !== null && hp(n, e),
            (n = Ph(n, r.children)),
            (n.flags |= 4096));
      return n;
    }
    return d
      ? (Fn(),
        (w = r.fallback),
        (d = n.mode),
        (_ = e.child),
        (N = _.sibling),
        (r = Pi(_, { mode: "hidden", children: r.children })),
        (r.subtreeFlags = _.subtreeFlags & 65011712),
        N !== null ? (w = Pi(N, w)) : ((w = ps(w, d, a, null)), (w.flags |= 2)),
        (w.return = n),
        (r.return = n),
        (r.sibling = w),
        (n.child = r),
        zo(null, r),
        (r = n.child),
        (w = e.child.memoizedState),
        w === null
          ? (w = Ih(a))
          : ((d = w.cachePool),
            d !== null
              ? ((_ = ce._currentValue), (d = d.parent !== _ ? { parent: _, pool: _ } : d))
              : (d = gp()),
            (w = { baseLanes: w.baseLanes | a, cachePool: d })),
        (r.memoizedState = w),
        (r.childLanes = Zh(e, x, a)),
        (n.memoizedState = Xh),
        zo(e.child, r))
      : (Un(n),
        (a = e.child),
        (e = a.sibling),
        (a = Pi(a, { mode: "visible", children: r.children })),
        (a.return = n),
        (a.sibling = null),
        e !== null &&
          ((x = n.deletions), x === null ? ((n.deletions = [e]), (n.flags |= 16)) : x.push(e)),
        (n.child = a),
        (n.memoizedState = null),
        a);
  }
  function Ph(e, n) {
    return ((n = wl({ mode: "visible", children: n }, e.mode)), (n.return = e), (e.child = n));
  }
  function wl(e, n) {
    return ((e = Je(22, e, null, n)), (e.lanes = 0), e);
  }
  function Wh(e, n, a) {
    return (
      Ss(n, e.child, null, a),
      (e = Ph(n, n.pendingProps.children)),
      (e.flags |= 2),
      (n.memoizedState = null),
      e
    );
  }
  function Cm(e, n, a) {
    e.lanes |= n;
    var r = e.alternate;
    (r !== null && (r.lanes |= n), uh(e.return, n, a));
  }
  function Jh(e, n, a, r, d, m) {
    var x = e.memoizedState;
    x === null
      ? (e.memoizedState = {
          isBackwards: n,
          rendering: null,
          renderingStartTime: 0,
          last: r,
          tail: a,
          tailMode: d,
          treeForkCount: m,
        })
      : ((x.isBackwards = n),
        (x.rendering = null),
        (x.renderingStartTime = 0),
        (x.last = r),
        (x.tail = a),
        (x.tailMode = d),
        (x.treeForkCount = m));
  }
  function Om(e, n, a) {
    var r = n.pendingProps,
      d = r.revealOrder,
      m = r.tail;
    r = r.children;
    var x = ae.current,
      w = (x & 2) !== 0;
    if (
      (w ? ((x = (x & 1) | 2), (n.flags |= 128)) : (x &= 1),
      pt(ae, x),
      Me(e, n, r, a),
      (r = Et ? po : 0),
      !w && e !== null && (e.flags & 128) !== 0)
    )
      t: for (e = n.child; e !== null;) {
        if (e.tag === 13) e.memoizedState !== null && Cm(e, a, n);
        else if (e.tag === 19) Cm(e, a, n);
        else if (e.child !== null) {
          ((e.child.return = e), (e = e.child));
          continue;
        }
        if (e === n) break t;
        for (; e.sibling === null;) {
          if (e.return === null || e.return === n) break t;
          e = e.return;
        }
        ((e.sibling.return = e.return), (e = e.sibling));
      }
    switch (d) {
      case "forwards":
        for (a = n.child, d = null; a !== null;)
          ((e = a.alternate), e !== null && ul(e) === null && (d = a), (a = a.sibling));
        ((a = d),
          a === null ? ((d = n.child), (n.child = null)) : ((d = a.sibling), (a.sibling = null)),
          Jh(n, !1, d, a, m, r));
        break;
      case "backwards":
      case "unstable_legacy-backwards":
        for (a = null, d = n.child, n.child = null; d !== null;) {
          if (((e = d.alternate), e !== null && ul(e) === null)) {
            n.child = d;
            break;
          }
          ((e = d.sibling), (d.sibling = a), (a = d), (d = e));
        }
        Jh(n, !0, a, null, m, r);
        break;
      case "together":
        Jh(n, !1, null, null, void 0, r);
        break;
      default:
        n.memoizedState = null;
    }
    return n.child;
  }
  function tn(e, n, a) {
    if (
      (e !== null && (n.dependencies = e.dependencies), (Hn |= n.lanes), (a & n.childLanes) === 0)
    )
      if (e !== null) {
        if ((ta(e, n, a, !1), (a & n.childLanes) === 0)) return null;
      } else return null;
    if (e !== null && n.child !== e.child) throw Error(s(153));
    if (n.child !== null) {
      for (e = n.child, a = Pi(e, e.pendingProps), n.child = a, a.return = n; e.sibling !== null;)
        ((e = e.sibling), (a = a.sibling = Pi(e, e.pendingProps)), (a.return = n));
      a.sibling = null;
    }
    return n.child;
  }
  function Qh(e, n) {
    return (e.lanes & n) !== 0 ? !0 : ((e = e.dependencies), !!(e !== null && il(e)));
  }
  function Tx(e, n, a) {
    switch (n.tag) {
      case 3:
        (os(n, n.stateNode.containerInfo), On(n, ce, e.memoizedState.cache), ms());
        break;
      case 27:
      case 5:
        An(n);
        break;
      case 4:
        os(n, n.stateNode.containerInfo);
        break;
      case 10:
        On(n, n.type, n.memoizedProps.value);
        break;
      case 31:
        if (n.memoizedState !== null) return ((n.flags |= 128), wh(n), null);
        break;
      case 13:
        var r = n.memoizedState;
        if (r !== null)
          return r.dehydrated !== null
            ? (Un(n), (n.flags |= 128), null)
            : (a & n.child.childLanes) !== 0
              ? Rm(e, n, a)
              : (Un(n), (e = tn(e, n, a)), e !== null ? e.sibling : null);
        Un(n);
        break;
      case 19:
        var d = (e.flags & 128) !== 0;
        if (
          ((r = (a & n.childLanes) !== 0),
          r || (ta(e, n, a, !1), (r = (a & n.childLanes) !== 0)),
          d)
        ) {
          if (r) return Om(e, n, a);
          n.flags |= 128;
        }
        if (
          ((d = n.memoizedState),
          d !== null && ((d.rendering = null), (d.tail = null), (d.lastEffect = null)),
          pt(ae, ae.current),
          r)
        )
          break;
        return null;
      case 22:
        return ((n.lanes = 0), Am(e, n, a, n.pendingProps));
      case 24:
        On(n, ce, e.memoizedState.cache);
    }
    return tn(e, n, a);
  }
  function Bm(e, n, a) {
    if (e !== null)
      if (e.memoizedProps !== n.pendingProps) he = !0;
      else {
        if (!Qh(e, a) && (n.flags & 128) === 0) return ((he = !1), Tx(e, n, a));
        he = (e.flags & 131072) !== 0;
      }
    else ((he = !1), Et && (n.flags & 1048576) !== 0 && up(n, po, n.index));
    switch (((n.lanes = 0), n.tag)) {
      case 16:
        t: {
          var r = n.pendingProps;
          if (((e = bs(n.elementType)), (n.type = e), typeof e == "function"))
            ih(e)
              ? ((r = As(e, r)), (n.tag = 1), (n = zm(null, n, e, r, a)))
              : ((n.tag = 0), (n = qh(null, n, e, r, a)));
          else {
            if (e != null) {
              var d = e.$$typeof;
              if (d === E) {
                ((n.tag = 11), (n = xm(null, n, e, r, a)));
                break t;
              } else if (d === X) {
                ((n.tag = 14), (n = Sm(null, n, e, r, a)));
                break t;
              }
            }
            throw ((n = xt(e) || e), Error(s(306, n, "")));
          }
        }
        return n;
      case 0:
        return qh(e, n, n.type, n.pendingProps, a);
      case 1:
        return ((r = n.type), (d = As(r, n.pendingProps)), zm(e, n, r, d, a));
      case 3:
        t: {
          if ((os(n, n.stateNode.containerInfo), e === null)) throw Error(s(387));
          r = n.pendingProps;
          var m = n.memoizedState;
          ((d = m.element), gh(e, n), wo(n, r, null, a));
          var x = n.memoizedState;
          if (
            ((r = x.cache),
            On(n, ce, r),
            r !== m.cache && hh(n, [ce], a, !0),
            So(),
            (r = x.element),
            m.isDehydrated)
          )
            if (
              ((m = { element: r, isDehydrated: !1, cache: x.cache }),
              (n.updateQueue.baseState = m),
              (n.memoizedState = m),
              n.flags & 256)
            ) {
              n = Em(e, n, r, a);
              break t;
            } else if (r !== d) {
              ((d = hi(Error(s(424)), n)), mo(d), (n = Em(e, n, r, a)));
              break t;
            } else {
              switch (((e = n.stateNode.containerInfo), e.nodeType)) {
                case 9:
                  e = e.body;
                  break;
                default:
                  e = e.nodeName === "HTML" ? e.ownerDocument.body : e;
              }
              for (
                Wt = yi(e.firstChild),
                  we = n,
                  Et = !0,
                  Rn = null,
                  pi = !0,
                  a = Ap(n, null, r, a),
                  n.child = a;
                a;
              )
                ((a.flags = (a.flags & -3) | 4096), (a = a.sibling));
            }
          else {
            if ((ms(), r === d)) {
              n = tn(e, n, a);
              break t;
            }
            Me(e, n, r, a);
          }
          n = n.child;
        }
        return n;
      case 26:
        return (
          Sl(e, n),
          e === null
            ? (a = Yy(n.type, null, n.pendingProps, null))
              ? (n.memoizedState = a)
              : Et ||
                ((a = n.type),
                (e = n.pendingProps),
                (r = kl(Fi.current).createElement(a)),
                (r[Se] = n),
                (r[ke] = e),
                _e(r, a, e),
                me(r),
                (n.stateNode = r))
            : (n.memoizedState = Yy(n.type, e.memoizedProps, n.pendingProps, e.memoizedState)),
          null
        );
      case 27:
        return (
          An(n),
          e === null &&
            Et &&
            ((r = n.stateNode = Vy(n.type, n.pendingProps, Fi.current)),
            (we = n),
            (pi = !0),
            (d = Wt),
            qn(n.type) ? ((Of = d), (Wt = yi(r.firstChild))) : (Wt = d)),
          Me(e, n, n.pendingProps.children, a),
          Sl(e, n),
          e === null && (n.flags |= 4194304),
          n.child
        );
      case 5:
        return (
          e === null &&
            Et &&
            ((d = r = Wt) &&
              ((r = i2(r, n.type, n.pendingProps, pi)),
              r !== null
                ? ((n.stateNode = r), (we = n), (Wt = yi(r.firstChild)), (pi = !1), (d = !0))
                : (d = !1)),
            d || Cn(n)),
          An(n),
          (d = n.type),
          (m = n.pendingProps),
          (x = e !== null ? e.memoizedProps : null),
          (r = m.children),
          Tf(d, m) ? (r = null) : x !== null && Tf(d, x) && (n.flags |= 32),
          n.memoizedState !== null && ((d = Mh(e, n, gx, null, null, a)), (jo._currentValue = d)),
          Sl(e, n),
          Me(e, n, r, a),
          n.child
        );
      case 6:
        return (
          e === null &&
            Et &&
            ((e = a = Wt) &&
              ((a = n2(a, n.pendingProps, pi)),
              a !== null ? ((n.stateNode = a), (we = n), (Wt = null), (e = !0)) : (e = !1)),
            e || Cn(n)),
          null
        );
      case 13:
        return Rm(e, n, a);
      case 4:
        return (
          os(n, n.stateNode.containerInfo),
          (r = n.pendingProps),
          e === null ? (n.child = Ss(n, null, r, a)) : Me(e, n, r, a),
          n.child
        );
      case 11:
        return xm(e, n, n.type, n.pendingProps, a);
      case 7:
        return (Me(e, n, n.pendingProps, a), n.child);
      case 8:
        return (Me(e, n, n.pendingProps.children, a), n.child);
      case 12:
        return (Me(e, n, n.pendingProps.children, a), n.child);
      case 10:
        return ((r = n.pendingProps), On(n, n.type, r.value), Me(e, n, r.children, a), n.child);
      case 9:
        return (
          (d = n.type._context),
          (r = n.pendingProps.children),
          gs(n),
          (d = Ae(d)),
          (r = r(d)),
          (n.flags |= 1),
          Me(e, n, r, a),
          n.child
        );
      case 14:
        return Sm(e, n, n.type, n.pendingProps, a);
      case 15:
        return wm(e, n, n.type, n.pendingProps, a);
      case 19:
        return Om(e, n, a);
      case 31:
        return _x(e, n, a);
      case 22:
        return Am(e, n, a, n.pendingProps);
      case 24:
        return (
          gs(n),
          (r = Ae(ce)),
          e === null
            ? ((d = ph()),
              d === null &&
                ((d = Xt),
                (m = fh()),
                (d.pooledCache = m),
                m.refCount++,
                m !== null && (d.pooledCacheLanes |= a),
                (d = m)),
              (n.memoizedState = { parent: r, cache: d }),
              yh(n),
              On(n, ce, d))
            : ((e.lanes & a) !== 0 && (gh(e, n), wo(n, null, null, a), So()),
              (d = e.memoizedState),
              (m = n.memoizedState),
              d.parent !== r
                ? ((d = { parent: r, cache: r }),
                  (n.memoizedState = d),
                  n.lanes === 0 && (n.memoizedState = n.updateQueue.baseState = d),
                  On(n, ce, r))
                : ((r = m.cache), On(n, ce, r), r !== d.cache && hh(n, [ce], a, !0))),
          Me(e, n, n.pendingProps.children, a),
          n.child
        );
      case 29:
        throw n.pendingProps;
    }
    throw Error(s(156, n.tag));
  }
  function en(e) {
    e.flags |= 4;
  }
  function Kh(e, n, a, r, d) {
    if (((n = (e.mode & 32) !== 0) && (n = !1), n)) {
      if (((e.flags |= 16777216), (d & 335544128) === d))
        if (e.stateNode.complete) e.flags |= 8192;
        else if (ay()) e.flags |= 8192;
        else throw ((xs = ol), mh);
    } else e.flags &= -16777217;
  }
  function Dm(e, n) {
    if (n.type !== "stylesheet" || (n.state.loading & 4) !== 0) e.flags &= -16777217;
    else if (((e.flags |= 16777216), !Py(n)))
      if (ay()) e.flags |= 8192;
      else throw ((xs = ol), mh);
  }
  function Al(e, n) {
    (n !== null && (e.flags |= 4),
      e.flags & 16384 && ((n = e.tag !== 22 ? f0() : 536870912), (e.lanes |= n), (fa |= n)));
  }
  function Eo(e, n) {
    if (!Et)
      switch (e.tailMode) {
        case "hidden":
          n = e.tail;
          for (var a = null; n !== null;) (n.alternate !== null && (a = n), (n = n.sibling));
          a === null ? (e.tail = null) : (a.sibling = null);
          break;
        case "collapsed":
          a = e.tail;
          for (var r = null; a !== null;) (a.alternate !== null && (r = a), (a = a.sibling));
          r === null
            ? n || e.tail === null
              ? (e.tail = null)
              : (e.tail.sibling = null)
            : (r.sibling = null);
      }
  }
  function Jt(e) {
    var n = e.alternate !== null && e.alternate.child === e.child,
      a = 0,
      r = 0;
    if (n)
      for (var d = e.child; d !== null;)
        ((a |= d.lanes | d.childLanes),
          (r |= d.subtreeFlags & 65011712),
          (r |= d.flags & 65011712),
          (d.return = e),
          (d = d.sibling));
    else
      for (d = e.child; d !== null;)
        ((a |= d.lanes | d.childLanes),
          (r |= d.subtreeFlags),
          (r |= d.flags),
          (d.return = e),
          (d = d.sibling));
    return ((e.subtreeFlags |= r), (e.childLanes = a), n);
  }
  function zx(e, n, a) {
    var r = n.pendingProps;
    switch ((oh(n), n.tag)) {
      case 16:
      case 15:
      case 0:
      case 11:
      case 7:
      case 8:
      case 12:
      case 9:
      case 14:
        return (Jt(n), null);
      case 1:
        return (Jt(n), null);
      case 3:
        return (
          (a = n.stateNode),
          (r = null),
          e !== null && (r = e.memoizedState.cache),
          n.memoizedState.cache !== r && (n.flags |= 2048),
          Qi(ce),
          Re(),
          a.pendingContext && ((a.context = a.pendingContext), (a.pendingContext = null)),
          (e === null || e.child === null) &&
            ($s(n)
              ? en(n)
              : e === null ||
                (e.memoizedState.isDehydrated && (n.flags & 256) === 0) ||
                ((n.flags |= 1024), lh())),
          Jt(n),
          null
        );
      case 26:
        var d = n.type,
          m = n.memoizedState;
        return (
          e === null
            ? (en(n), m !== null ? (Jt(n), Dm(n, m)) : (Jt(n), Kh(n, d, null, r, a)))
            : m
              ? m !== e.memoizedState
                ? (en(n), Jt(n), Dm(n, m))
                : (Jt(n), (n.flags &= -16777217))
              : ((e = e.memoizedProps), e !== r && en(n), Jt(n), Kh(n, d, e, r, a)),
          null
        );
      case 27:
        if ((Fs(n), (a = Fi.current), (d = n.type), e !== null && n.stateNode != null))
          e.memoizedProps !== r && en(n);
        else {
          if (!r) {
            if (n.stateNode === null) throw Error(s(166));
            return (Jt(n), null);
          }
          ((e = Zt.current), $s(n) ? fp(n) : ((e = Vy(d, r, a)), (n.stateNode = e), en(n)));
        }
        return (Jt(n), null);
      case 5:
        if ((Fs(n), (d = n.type), e !== null && n.stateNode != null))
          e.memoizedProps !== r && en(n);
        else {
          if (!r) {
            if (n.stateNode === null) throw Error(s(166));
            return (Jt(n), null);
          }
          if (((m = Zt.current), $s(n))) fp(n);
          else {
            var x = kl(Fi.current);
            switch (m) {
              case 1:
                m = x.createElementNS("http://www.w3.org/2000/svg", d);
                break;
              case 2:
                m = x.createElementNS("http://www.w3.org/1998/Math/MathML", d);
                break;
              default:
                switch (d) {
                  case "svg":
                    m = x.createElementNS("http://www.w3.org/2000/svg", d);
                    break;
                  case "math":
                    m = x.createElementNS("http://www.w3.org/1998/Math/MathML", d);
                    break;
                  case "script":
                    ((m = x.createElement("div")),
                      (m.innerHTML = "<script><\/script>"),
                      (m = m.removeChild(m.firstChild)));
                    break;
                  case "select":
                    ((m =
                      typeof r.is == "string"
                        ? x.createElement("select", { is: r.is })
                        : x.createElement("select")),
                      r.multiple ? (m.multiple = !0) : r.size && (m.size = r.size));
                    break;
                  default:
                    m =
                      typeof r.is == "string"
                        ? x.createElement(d, { is: r.is })
                        : x.createElement(d);
                }
            }
            ((m[Se] = n), (m[ke] = r));
            t: for (x = n.child; x !== null;) {
              if (x.tag === 5 || x.tag === 6) m.appendChild(x.stateNode);
              else if (x.tag !== 4 && x.tag !== 27 && x.child !== null) {
                ((x.child.return = x), (x = x.child));
                continue;
              }
              if (x === n) break t;
              for (; x.sibling === null;) {
                if (x.return === null || x.return === n) break t;
                x = x.return;
              }
              ((x.sibling.return = x.return), (x = x.sibling));
            }
            n.stateNode = m;
            t: switch ((_e(m, d, r), d)) {
              case "button":
              case "input":
              case "select":
              case "textarea":
                r = !!r.autoFocus;
                break t;
              case "img":
                r = !0;
                break t;
              default:
                r = !1;
            }
            r && en(n);
          }
        }
        return (Jt(n), Kh(n, n.type, e === null ? null : e.memoizedProps, n.pendingProps, a), null);
      case 6:
        if (e && n.stateNode != null) e.memoizedProps !== r && en(n);
        else {
          if (typeof r != "string" && n.stateNode === null) throw Error(s(166));
          if (((e = Fi.current), $s(n))) {
            if (((e = n.stateNode), (a = n.memoizedProps), (r = null), (d = we), d !== null))
              switch (d.tag) {
                case 27:
                case 5:
                  r = d.memoizedProps;
              }
            ((e[Se] = n),
              (e = !!(
                e.nodeValue === a ||
                (r !== null && r.suppressHydrationWarning === !0) ||
                Ry(e.nodeValue, a)
              )),
              e || Cn(n, !0));
          } else ((e = kl(e).createTextNode(r)), (e[Se] = n), (n.stateNode = e));
        }
        return (Jt(n), null);
      case 31:
        if (((a = n.memoizedState), e === null || e.memoizedState !== null)) {
          if (((r = $s(n)), a !== null)) {
            if (e === null) {
              if (!r) throw Error(s(318));
              if (((e = n.memoizedState), (e = e !== null ? e.dehydrated : null), !e))
                throw Error(s(557));
              e[Se] = n;
            } else (ms(), (n.flags & 128) === 0 && (n.memoizedState = null), (n.flags |= 4));
            (Jt(n), (e = !1));
          } else
            ((a = lh()),
              e !== null && e.memoizedState !== null && (e.memoizedState.hydrationErrors = a),
              (e = !0));
          if (!e) return n.flags & 256 ? (Ke(n), n) : (Ke(n), null);
          if ((n.flags & 128) !== 0) throw Error(s(558));
        }
        return (Jt(n), null);
      case 13:
        if (
          ((r = n.memoizedState),
          e === null || (e.memoizedState !== null && e.memoizedState.dehydrated !== null))
        ) {
          if (((d = $s(n)), r !== null && r.dehydrated !== null)) {
            if (e === null) {
              if (!d) throw Error(s(318));
              if (((d = n.memoizedState), (d = d !== null ? d.dehydrated : null), !d))
                throw Error(s(317));
              d[Se] = n;
            } else (ms(), (n.flags & 128) === 0 && (n.memoizedState = null), (n.flags |= 4));
            (Jt(n), (d = !1));
          } else
            ((d = lh()),
              e !== null && e.memoizedState !== null && (e.memoizedState.hydrationErrors = d),
              (d = !0));
          if (!d) return n.flags & 256 ? (Ke(n), n) : (Ke(n), null);
        }
        return (
          Ke(n),
          (n.flags & 128) !== 0
            ? ((n.lanes = a), n)
            : ((a = r !== null),
              (e = e !== null && e.memoizedState !== null),
              a &&
                ((r = n.child),
                (d = null),
                r.alternate !== null &&
                  r.alternate.memoizedState !== null &&
                  r.alternate.memoizedState.cachePool !== null &&
                  (d = r.alternate.memoizedState.cachePool.pool),
                (m = null),
                r.memoizedState !== null &&
                  r.memoizedState.cachePool !== null &&
                  (m = r.memoizedState.cachePool.pool),
                m !== d && (r.flags |= 2048)),
              a !== e && a && (n.child.flags |= 8192),
              Al(n, n.updateQueue),
              Jt(n),
              null)
        );
      case 4:
        return (Re(), e === null && Sf(n.stateNode.containerInfo), Jt(n), null);
      case 10:
        return (Qi(n.type), Jt(n), null);
      case 19:
        if ((zt(ae), (r = n.memoizedState), r === null)) return (Jt(n), null);
        if (((d = (n.flags & 128) !== 0), (m = r.rendering), m === null))
          if (d) Eo(r, !1);
          else {
            if (ie !== 0 || (e !== null && (e.flags & 128) !== 0))
              for (e = n.child; e !== null;) {
                if (((m = ul(e)), m !== null)) {
                  for (
                    n.flags |= 128,
                      Eo(r, !1),
                      e = m.updateQueue,
                      n.updateQueue = e,
                      Al(n, e),
                      n.subtreeFlags = 0,
                      e = a,
                      a = n.child;
                    a !== null;
                  )
                    (rp(a, e), (a = a.sibling));
                  return (pt(ae, (ae.current & 1) | 2), Et && Wi(n, r.treeForkCount), n.child);
                }
                e = e.sibling;
              }
            r.tail !== null &&
              qt() > El &&
              ((n.flags |= 128), (d = !0), Eo(r, !1), (n.lanes = 4194304));
          }
        else {
          if (!d)
            if (((e = ul(m)), e !== null)) {
              if (
                ((n.flags |= 128),
                (d = !0),
                (e = e.updateQueue),
                (n.updateQueue = e),
                Al(n, e),
                Eo(r, !0),
                r.tail === null && r.tailMode === "hidden" && !m.alternate && !Et)
              )
                return (Jt(n), null);
            } else
              2 * qt() - r.renderingStartTime > El &&
                a !== 536870912 &&
                ((n.flags |= 128), (d = !0), Eo(r, !1), (n.lanes = 4194304));
          r.isBackwards
            ? ((m.sibling = n.child), (n.child = m))
            : ((e = r.last), e !== null ? (e.sibling = m) : (n.child = m), (r.last = m));
        }
        return r.tail !== null
          ? ((e = r.tail),
            (r.rendering = e),
            (r.tail = e.sibling),
            (r.renderingStartTime = qt()),
            (e.sibling = null),
            (a = ae.current),
            pt(ae, d ? (a & 1) | 2 : a & 1),
            Et && Wi(n, r.treeForkCount),
            e)
          : (Jt(n), null);
      case 22:
      case 23:
        return (
          Ke(n),
          Sh(),
          (r = n.memoizedState !== null),
          e !== null
            ? (e.memoizedState !== null) !== r && (n.flags |= 8192)
            : r && (n.flags |= 8192),
          r
            ? (a & 536870912) !== 0 &&
              (n.flags & 128) === 0 &&
              (Jt(n), n.subtreeFlags & 6 && (n.flags |= 8192))
            : Jt(n),
          (a = n.updateQueue),
          a !== null && Al(n, a.retryQueue),
          (a = null),
          e !== null &&
            e.memoizedState !== null &&
            e.memoizedState.cachePool !== null &&
            (a = e.memoizedState.cachePool.pool),
          (r = null),
          n.memoizedState !== null &&
            n.memoizedState.cachePool !== null &&
            (r = n.memoizedState.cachePool.pool),
          r !== a && (n.flags |= 2048),
          e !== null && zt(vs),
          null
        );
      case 24:
        return (
          (a = null),
          e !== null && (a = e.memoizedState.cache),
          n.memoizedState.cache !== a && (n.flags |= 2048),
          Qi(ce),
          Jt(n),
          null
        );
      case 25:
        return null;
      case 30:
        return null;
    }
    throw Error(s(156, n.tag));
  }
  function Ex(e, n) {
    switch ((oh(n), n.tag)) {
      case 1:
        return ((e = n.flags), e & 65536 ? ((n.flags = (e & -65537) | 128), n) : null);
      case 3:
        return (
          Qi(ce),
          Re(),
          (e = n.flags),
          (e & 65536) !== 0 && (e & 128) === 0 ? ((n.flags = (e & -65537) | 128), n) : null
        );
      case 26:
      case 27:
      case 5:
        return (Fs(n), null);
      case 31:
        if (n.memoizedState !== null) {
          if ((Ke(n), n.alternate === null)) throw Error(s(340));
          ms();
        }
        return ((e = n.flags), e & 65536 ? ((n.flags = (e & -65537) | 128), n) : null);
      case 13:
        if ((Ke(n), (e = n.memoizedState), e !== null && e.dehydrated !== null)) {
          if (n.alternate === null) throw Error(s(340));
          ms();
        }
        return ((e = n.flags), e & 65536 ? ((n.flags = (e & -65537) | 128), n) : null);
      case 19:
        return (zt(ae), null);
      case 4:
        return (Re(), null);
      case 10:
        return (Qi(n.type), null);
      case 22:
      case 23:
        return (
          Ke(n),
          Sh(),
          e !== null && zt(vs),
          (e = n.flags),
          e & 65536 ? ((n.flags = (e & -65537) | 128), n) : null
        );
      case 24:
        return (Qi(ce), null);
      case 25:
        return null;
      default:
        return null;
    }
  }
  function Nm(e, n) {
    switch ((oh(n), n.tag)) {
      case 3:
        (Qi(ce), Re());
        break;
      case 26:
      case 27:
      case 5:
        Fs(n);
        break;
      case 4:
        Re();
        break;
      case 31:
        n.memoizedState !== null && Ke(n);
        break;
      case 13:
        Ke(n);
        break;
      case 19:
        zt(ae);
        break;
      case 10:
        Qi(n.type);
        break;
      case 22:
      case 23:
        (Ke(n), Sh(), e !== null && zt(vs));
        break;
      case 24:
        Qi(ce);
    }
  }
  function Ro(e, n) {
    try {
      var a = n.updateQueue,
        r = a !== null ? a.lastEffect : null;
      if (r !== null) {
        var d = r.next;
        a = d;
        do {
          if ((a.tag & e) === e) {
            r = void 0;
            var m = a.create,
              x = a.inst;
            ((r = m()), (x.destroy = r));
          }
          a = a.next;
        } while (a !== d);
      }
    } catch (w) {
      Ft(n, n.return, w);
    }
  }
  function Ln(e, n, a) {
    try {
      var r = n.updateQueue,
        d = r !== null ? r.lastEffect : null;
      if (d !== null) {
        var m = d.next;
        r = m;
        do {
          if ((r.tag & e) === e) {
            var x = r.inst,
              w = x.destroy;
            if (w !== void 0) {
              ((x.destroy = void 0), (d = n));
              var _ = a,
                N = w;
              try {
                N();
              } catch (V) {
                Ft(d, _, V);
              }
            }
          }
          r = r.next;
        } while (r !== m);
      }
    } catch (V) {
      Ft(n, n.return, V);
    }
  }
  function Um(e) {
    var n = e.updateQueue;
    if (n !== null) {
      var a = e.stateNode;
      try {
        _p(n, a);
      } catch (r) {
        Ft(e, e.return, r);
      }
    }
  }
  function Fm(e, n, a) {
    ((a.props = As(e.type, e.memoizedProps)), (a.state = e.memoizedState));
    try {
      a.componentWillUnmount();
    } catch (r) {
      Ft(e, n, r);
    }
  }
  function Co(e, n) {
    try {
      var a = e.ref;
      if (a !== null) {
        switch (e.tag) {
          case 26:
          case 27:
          case 5:
            var r = e.stateNode;
            break;
          case 30:
            r = e.stateNode;
            break;
          default:
            r = e.stateNode;
        }
        typeof a == "function" ? (e.refCleanup = a(r)) : (a.current = r);
      }
    } catch (d) {
      Ft(e, n, d);
    }
  }
  function Hi(e, n) {
    var a = e.ref,
      r = e.refCleanup;
    if (a !== null)
      if (typeof r == "function")
        try {
          r();
        } catch (d) {
          Ft(e, n, d);
        } finally {
          ((e.refCleanup = null), (e = e.alternate), e != null && (e.refCleanup = null));
        }
      else if (typeof a == "function")
        try {
          a(null);
        } catch (d) {
          Ft(e, n, d);
        }
      else a.current = null;
  }
  function Lm(e) {
    var n = e.type,
      a = e.memoizedProps,
      r = e.stateNode;
    try {
      t: switch (n) {
        case "button":
        case "input":
        case "select":
        case "textarea":
          a.autoFocus && r.focus();
          break t;
        case "img":
          a.src ? (r.src = a.src) : a.srcSet && (r.srcset = a.srcSet);
      }
    } catch (d) {
      Ft(e, e.return, d);
    }
  }
  function $h(e, n, a) {
    try {
      var r = e.stateNode;
      (Jx(r, e.type, a, n), (r[ke] = n));
    } catch (d) {
      Ft(e, e.return, d);
    }
  }
  function km(e) {
    return (
      e.tag === 5 || e.tag === 3 || e.tag === 26 || (e.tag === 27 && qn(e.type)) || e.tag === 4
    );
  }
  function tf(e) {
    t: for (;;) {
      for (; e.sibling === null;) {
        if (e.return === null || km(e.return)) return null;
        e = e.return;
      }
      for (
        e.sibling.return = e.return, e = e.sibling;
        e.tag !== 5 && e.tag !== 6 && e.tag !== 18;
      ) {
        if ((e.tag === 27 && qn(e.type)) || e.flags & 2 || e.child === null || e.tag === 4)
          continue t;
        ((e.child.return = e), (e = e.child));
      }
      if (!(e.flags & 2)) return e.stateNode;
    }
  }
  function ef(e, n, a) {
    var r = e.tag;
    if (r === 5 || r === 6)
      ((e = e.stateNode),
        n
          ? (a.nodeType === 9
              ? a.body
              : a.nodeName === "HTML"
                ? a.ownerDocument.body
                : a
            ).insertBefore(e, n)
          : ((n = a.nodeType === 9 ? a.body : a.nodeName === "HTML" ? a.ownerDocument.body : a),
            n.appendChild(e),
            (a = a._reactRootContainer),
            a != null || n.onclick !== null || (n.onclick = Ii)));
    else if (
      r !== 4 &&
      (r === 27 && qn(e.type) && ((a = e.stateNode), (n = null)), (e = e.child), e !== null)
    )
      for (ef(e, n, a), e = e.sibling; e !== null;) (ef(e, n, a), (e = e.sibling));
  }
  function Ml(e, n, a) {
    var r = e.tag;
    if (r === 5 || r === 6) ((e = e.stateNode), n ? a.insertBefore(e, n) : a.appendChild(e));
    else if (r !== 4 && (r === 27 && qn(e.type) && (a = e.stateNode), (e = e.child), e !== null))
      for (Ml(e, n, a), e = e.sibling; e !== null;) (Ml(e, n, a), (e = e.sibling));
  }
  function Hm(e) {
    var n = e.stateNode,
      a = e.memoizedProps;
    try {
      for (var r = e.type, d = n.attributes; d.length;) n.removeAttributeNode(d[0]);
      (_e(n, r, a), (n[Se] = e), (n[ke] = a));
    } catch (m) {
      Ft(e, e.return, m);
    }
  }
  var nn = !1,
    fe = !1,
    nf = !1,
    Vm = typeof WeakSet == "function" ? WeakSet : Set,
    ye = null;
  function Rx(e, n) {
    if (((e = e.containerInfo), (Mf = Xl), (e = K0(e)), Wu(e))) {
      if ("selectionStart" in e) var a = { start: e.selectionStart, end: e.selectionEnd };
      else
        t: {
          a = ((a = e.ownerDocument) && a.defaultView) || window;
          var r = a.getSelection && a.getSelection();
          if (r && r.rangeCount !== 0) {
            a = r.anchorNode;
            var d = r.anchorOffset,
              m = r.focusNode;
            r = r.focusOffset;
            try {
              (a.nodeType, m.nodeType);
            } catch {
              a = null;
              break t;
            }
            var x = 0,
              w = -1,
              _ = -1,
              N = 0,
              V = 0,
              Y = e,
              F = null;
            e: for (;;) {
              for (
                var k;
                Y !== a || (d !== 0 && Y.nodeType !== 3) || (w = x + d),
                  Y !== m || (r !== 0 && Y.nodeType !== 3) || (_ = x + r),
                  Y.nodeType === 3 && (x += Y.nodeValue.length),
                  (k = Y.firstChild) !== null;
              )
                ((F = Y), (Y = k));
              for (;;) {
                if (Y === e) break e;
                if (
                  (F === a && ++N === d && (w = x),
                  F === m && ++V === r && (_ = x),
                  (k = Y.nextSibling) !== null)
                )
                  break;
                ((Y = F), (F = Y.parentNode));
              }
              Y = k;
            }
            a = w === -1 || _ === -1 ? null : { start: w, end: _ };
          } else a = null;
        }
      a = a || { start: 0, end: 0 };
    } else a = null;
    for (_f = { focusedElem: e, selectionRange: a }, Xl = !1, ye = n; ye !== null;)
      if (((n = ye), (e = n.child), (n.subtreeFlags & 1028) !== 0 && e !== null))
        ((e.return = n), (ye = e));
      else
        for (; ye !== null;) {
          switch (((n = ye), (m = n.alternate), (e = n.flags), n.tag)) {
            case 0:
              if (
                (e & 4) !== 0 &&
                ((e = n.updateQueue), (e = e !== null ? e.events : null), e !== null)
              )
                for (a = 0; a < e.length; a++) ((d = e[a]), (d.ref.impl = d.nextImpl));
              break;
            case 11:
            case 15:
              break;
            case 1:
              if ((e & 1024) !== 0 && m !== null) {
                ((e = void 0),
                  (a = n),
                  (d = m.memoizedProps),
                  (m = m.memoizedState),
                  (r = a.stateNode));
                try {
                  var et = As(a.type, d);
                  ((e = r.getSnapshotBeforeUpdate(et, m)),
                    (r.__reactInternalSnapshotBeforeUpdate = e));
                } catch (ct) {
                  Ft(a, a.return, ct);
                }
              }
              break;
            case 3:
              if ((e & 1024) !== 0) {
                if (((e = n.stateNode.containerInfo), (a = e.nodeType), a === 9)) Ef(e);
                else if (a === 1)
                  switch (e.nodeName) {
                    case "HEAD":
                    case "HTML":
                    case "BODY":
                      Ef(e);
                      break;
                    default:
                      e.textContent = "";
                  }
              }
              break;
            case 5:
            case 26:
            case 27:
            case 6:
            case 4:
            case 17:
              break;
            default:
              if ((e & 1024) !== 0) throw Error(s(163));
          }
          if (((e = n.sibling), e !== null)) {
            ((e.return = n.return), (ye = e));
            break;
          }
          ye = n.return;
        }
  }
  function Gm(e, n, a) {
    var r = a.flags;
    switch (a.tag) {
      case 0:
      case 11:
      case 15:
        (an(e, a), r & 4 && Ro(5, a));
        break;
      case 1:
        if ((an(e, a), r & 4))
          if (((e = a.stateNode), n === null))
            try {
              e.componentDidMount();
            } catch (x) {
              Ft(a, a.return, x);
            }
          else {
            var d = As(a.type, n.memoizedProps);
            n = n.memoizedState;
            try {
              e.componentDidUpdate(d, n, e.__reactInternalSnapshotBeforeUpdate);
            } catch (x) {
              Ft(a, a.return, x);
            }
          }
        (r & 64 && Um(a), r & 512 && Co(a, a.return));
        break;
      case 3:
        if ((an(e, a), r & 64 && ((e = a.updateQueue), e !== null))) {
          if (((n = null), a.child !== null))
            switch (a.child.tag) {
              case 27:
              case 5:
                n = a.child.stateNode;
                break;
              case 1:
                n = a.child.stateNode;
            }
          try {
            _p(e, n);
          } catch (x) {
            Ft(a, a.return, x);
          }
        }
        break;
      case 27:
        n === null && r & 4 && Hm(a);
      case 26:
      case 5:
        (an(e, a), n === null && r & 4 && Lm(a), r & 512 && Co(a, a.return));
        break;
      case 12:
        an(e, a);
        break;
      case 31:
        (an(e, a), r & 4 && qm(e, a));
        break;
      case 13:
        (an(e, a),
          r & 4 && Xm(e, a),
          r & 64 &&
            ((e = a.memoizedState),
            e !== null && ((e = e.dehydrated), e !== null && ((a = kx.bind(null, a)), s2(e, a)))));
        break;
      case 22:
        if (((r = a.memoizedState !== null || nn), !r)) {
          ((n = (n !== null && n.memoizedState !== null) || fe), (d = nn));
          var m = fe;
          ((nn = r),
            (fe = n) && !m ? on(e, a, (a.subtreeFlags & 8772) !== 0) : an(e, a),
            (nn = d),
            (fe = m));
        }
        break;
      case 30:
        break;
      default:
        an(e, a);
    }
  }
  function jm(e) {
    var n = e.alternate;
    (n !== null && ((e.alternate = null), jm(n)),
      (e.child = null),
      (e.deletions = null),
      (e.sibling = null),
      e.tag === 5 && ((n = e.stateNode), n !== null && Bu(n)),
      (e.stateNode = null),
      (e.return = null),
      (e.dependencies = null),
      (e.memoizedProps = null),
      (e.memoizedState = null),
      (e.pendingProps = null),
      (e.stateNode = null),
      (e.updateQueue = null));
  }
  var Kt = null,
    Ve = !1;
  function sn(e, n, a) {
    for (a = a.child; a !== null;) (Ym(e, n, a), (a = a.sibling));
  }
  function Ym(e, n, a) {
    if (Ze && typeof Ze.onCommitFiberUnmount == "function")
      try {
        Ze.onCommitFiberUnmount(Mn, a);
      } catch {}
    switch (a.tag) {
      case 26:
        (fe || Hi(a, n),
          sn(e, n, a),
          a.memoizedState
            ? a.memoizedState.count--
            : a.stateNode && ((a = a.stateNode), a.parentNode.removeChild(a)));
        break;
      case 27:
        fe || Hi(a, n);
        var r = Kt,
          d = Ve;
        (qn(a.type) && ((Kt = a.stateNode), (Ve = !1)),
          sn(e, n, a),
          Ho(a.stateNode),
          (Kt = r),
          (Ve = d));
        break;
      case 5:
        fe || Hi(a, n);
      case 6:
        if (((r = Kt), (d = Ve), (Kt = null), sn(e, n, a), (Kt = r), (Ve = d), Kt !== null))
          if (Ve)
            try {
              (Kt.nodeType === 9
                ? Kt.body
                : Kt.nodeName === "HTML"
                  ? Kt.ownerDocument.body
                  : Kt
              ).removeChild(a.stateNode);
            } catch (m) {
              Ft(a, n, m);
            }
          else
            try {
              Kt.removeChild(a.stateNode);
            } catch (m) {
              Ft(a, n, m);
            }
        break;
      case 18:
        Kt !== null &&
          (Ve
            ? ((e = Kt),
              Uy(
                e.nodeType === 9 ? e.body : e.nodeName === "HTML" ? e.ownerDocument.body : e,
                a.stateNode,
              ),
              xa(e))
            : Uy(Kt, a.stateNode));
        break;
      case 4:
        ((r = Kt),
          (d = Ve),
          (Kt = a.stateNode.containerInfo),
          (Ve = !0),
          sn(e, n, a),
          (Kt = r),
          (Ve = d));
        break;
      case 0:
      case 11:
      case 14:
      case 15:
        (Ln(2, a, n), fe || Ln(4, a, n), sn(e, n, a));
        break;
      case 1:
        (fe ||
          (Hi(a, n), (r = a.stateNode), typeof r.componentWillUnmount == "function" && Fm(a, n, r)),
          sn(e, n, a));
        break;
      case 21:
        sn(e, n, a);
        break;
      case 22:
        ((fe = (r = fe) || a.memoizedState !== null), sn(e, n, a), (fe = r));
        break;
      default:
        sn(e, n, a);
    }
  }
  function qm(e, n) {
    if (
      n.memoizedState === null &&
      ((e = n.alternate), e !== null && ((e = e.memoizedState), e !== null))
    ) {
      e = e.dehydrated;
      try {
        xa(e);
      } catch (a) {
        Ft(n, n.return, a);
      }
    }
  }
  function Xm(e, n) {
    if (
      n.memoizedState === null &&
      ((e = n.alternate),
      e !== null && ((e = e.memoizedState), e !== null && ((e = e.dehydrated), e !== null)))
    )
      try {
        xa(e);
      } catch (a) {
        Ft(n, n.return, a);
      }
  }
  function Cx(e) {
    switch (e.tag) {
      case 31:
      case 13:
      case 19:
        var n = e.stateNode;
        return (n === null && (n = e.stateNode = new Vm()), n);
      case 22:
        return (
          (e = e.stateNode),
          (n = e._retryCache),
          n === null && (n = e._retryCache = new Vm()),
          n
        );
      default:
        throw Error(s(435, e.tag));
    }
  }
  function _l(e, n) {
    var a = Cx(e);
    n.forEach(function (r) {
      if (!a.has(r)) {
        a.add(r);
        var d = Hx.bind(null, e, r);
        r.then(d, d);
      }
    });
  }
  function Ge(e, n) {
    var a = n.deletions;
    if (a !== null)
      for (var r = 0; r < a.length; r++) {
        var d = a[r],
          m = e,
          x = n,
          w = x;
        t: for (; w !== null;) {
          switch (w.tag) {
            case 27:
              if (qn(w.type)) {
                ((Kt = w.stateNode), (Ve = !1));
                break t;
              }
              break;
            case 5:
              ((Kt = w.stateNode), (Ve = !1));
              break t;
            case 3:
            case 4:
              ((Kt = w.stateNode.containerInfo), (Ve = !0));
              break t;
          }
          w = w.return;
        }
        if (Kt === null) throw Error(s(160));
        (Ym(m, x, d),
          (Kt = null),
          (Ve = !1),
          (m = d.alternate),
          m !== null && (m.return = null),
          (d.return = null));
      }
    if (n.subtreeFlags & 13886) for (n = n.child; n !== null;) (Im(n, e), (n = n.sibling));
  }
  var Ti = null;
  function Im(e, n) {
    var a = e.alternate,
      r = e.flags;
    switch (e.tag) {
      case 0:
      case 11:
      case 14:
      case 15:
        (Ge(n, e), je(e), r & 4 && (Ln(3, e, e.return), Ro(3, e), Ln(5, e, e.return)));
        break;
      case 1:
        (Ge(n, e),
          je(e),
          r & 512 && (fe || a === null || Hi(a, a.return)),
          r & 64 &&
            nn &&
            ((e = e.updateQueue),
            e !== null &&
              ((r = e.callbacks),
              r !== null &&
                ((a = e.shared.hiddenCallbacks),
                (e.shared.hiddenCallbacks = a === null ? r : a.concat(r))))));
        break;
      case 26:
        var d = Ti;
        if ((Ge(n, e), je(e), r & 512 && (fe || a === null || Hi(a, a.return)), r & 4)) {
          var m = a !== null ? a.memoizedState : null;
          if (((r = e.memoizedState), a === null))
            if (r === null)
              if (e.stateNode === null) {
                t: {
                  ((r = e.type), (a = e.memoizedProps), (d = d.ownerDocument || d));
                  e: switch (r) {
                    case "title":
                      ((m = d.getElementsByTagName("title")[0]),
                        (!m ||
                          m[io] ||
                          m[Se] ||
                          m.namespaceURI === "http://www.w3.org/2000/svg" ||
                          m.hasAttribute("itemprop")) &&
                          ((m = d.createElement(r)),
                          d.head.insertBefore(m, d.querySelector("head > title"))),
                        _e(m, r, a),
                        (m[Se] = e),
                        me(m),
                        (r = m));
                      break t;
                    case "link":
                      var x = Iy("link", "href", d).get(r + (a.href || ""));
                      if (x) {
                        for (var w = 0; w < x.length; w++)
                          if (
                            ((m = x[w]),
                            m.getAttribute("href") ===
                              (a.href == null || a.href === "" ? null : a.href) &&
                              m.getAttribute("rel") === (a.rel == null ? null : a.rel) &&
                              m.getAttribute("title") === (a.title == null ? null : a.title) &&
                              m.getAttribute("crossorigin") ===
                                (a.crossOrigin == null ? null : a.crossOrigin))
                          ) {
                            x.splice(w, 1);
                            break e;
                          }
                      }
                      ((m = d.createElement(r)), _e(m, r, a), d.head.appendChild(m));
                      break;
                    case "meta":
                      if ((x = Iy("meta", "content", d).get(r + (a.content || "")))) {
                        for (w = 0; w < x.length; w++)
                          if (
                            ((m = x[w]),
                            m.getAttribute("content") ===
                              (a.content == null ? null : "" + a.content) &&
                              m.getAttribute("name") === (a.name == null ? null : a.name) &&
                              m.getAttribute("property") ===
                                (a.property == null ? null : a.property) &&
                              m.getAttribute("http-equiv") ===
                                (a.httpEquiv == null ? null : a.httpEquiv) &&
                              m.getAttribute("charset") === (a.charSet == null ? null : a.charSet))
                          ) {
                            x.splice(w, 1);
                            break e;
                          }
                      }
                      ((m = d.createElement(r)), _e(m, r, a), d.head.appendChild(m));
                      break;
                    default:
                      throw Error(s(468, r));
                  }
                  ((m[Se] = e), me(m), (r = m));
                }
                e.stateNode = r;
              } else Zy(d, e.type, e.stateNode);
            else e.stateNode = Xy(d, r, e.memoizedProps);
          else
            m !== r
              ? (m === null
                  ? a.stateNode !== null && ((a = a.stateNode), a.parentNode.removeChild(a))
                  : m.count--,
                r === null ? Zy(d, e.type, e.stateNode) : Xy(d, r, e.memoizedProps))
              : r === null && e.stateNode !== null && $h(e, e.memoizedProps, a.memoizedProps);
        }
        break;
      case 27:
        (Ge(n, e),
          je(e),
          r & 512 && (fe || a === null || Hi(a, a.return)),
          a !== null && r & 4 && $h(e, e.memoizedProps, a.memoizedProps));
        break;
      case 5:
        if ((Ge(n, e), je(e), r & 512 && (fe || a === null || Hi(a, a.return)), e.flags & 32)) {
          d = e.stateNode;
          try {
            Ys(d, "");
          } catch (et) {
            Ft(e, e.return, et);
          }
        }
        (r & 4 &&
          e.stateNode != null &&
          ((d = e.memoizedProps), $h(e, d, a !== null ? a.memoizedProps : d)),
          r & 1024 && (nf = !0));
        break;
      case 6:
        if ((Ge(n, e), je(e), r & 4)) {
          if (e.stateNode === null) throw Error(s(162));
          ((r = e.memoizedProps), (a = e.stateNode));
          try {
            a.nodeValue = r;
          } catch (et) {
            Ft(e, e.return, et);
          }
        }
        break;
      case 3:
        if (
          ((Gl = null),
          (d = Ti),
          (Ti = Hl(n.containerInfo)),
          Ge(n, e),
          (Ti = d),
          je(e),
          r & 4 && a !== null && a.memoizedState.isDehydrated)
        )
          try {
            xa(n.containerInfo);
          } catch (et) {
            Ft(e, e.return, et);
          }
        nf && ((nf = !1), Zm(e));
        break;
      case 4:
        ((r = Ti), (Ti = Hl(e.stateNode.containerInfo)), Ge(n, e), je(e), (Ti = r));
        break;
      case 12:
        (Ge(n, e), je(e));
        break;
      case 31:
        (Ge(n, e),
          je(e),
          r & 4 && ((r = e.updateQueue), r !== null && ((e.updateQueue = null), _l(e, r))));
        break;
      case 13:
        (Ge(n, e),
          je(e),
          e.child.flags & 8192 &&
            (e.memoizedState !== null) != (a !== null && a.memoizedState !== null) &&
            (zl = qt()),
          r & 4 && ((r = e.updateQueue), r !== null && ((e.updateQueue = null), _l(e, r))));
        break;
      case 22:
        d = e.memoizedState !== null;
        var _ = a !== null && a.memoizedState !== null,
          N = nn,
          V = fe;
        if (((nn = N || d), (fe = V || _), Ge(n, e), (fe = V), (nn = N), je(e), r & 8192))
          t: for (
            n = e.stateNode,
              n._visibility = d ? n._visibility & -2 : n._visibility | 1,
              d && (a === null || _ || nn || fe || Ms(e)),
              a = null,
              n = e;
            ;
          ) {
            if (n.tag === 5 || n.tag === 26) {
              if (a === null) {
                _ = a = n;
                try {
                  if (((m = _.stateNode), d))
                    ((x = m.style),
                      typeof x.setProperty == "function"
                        ? x.setProperty("display", "none", "important")
                        : (x.display = "none"));
                  else {
                    w = _.stateNode;
                    var Y = _.memoizedProps.style,
                      F = Y != null && Y.hasOwnProperty("display") ? Y.display : null;
                    w.style.display = F == null || typeof F == "boolean" ? "" : ("" + F).trim();
                  }
                } catch (et) {
                  Ft(_, _.return, et);
                }
              }
            } else if (n.tag === 6) {
              if (a === null) {
                _ = n;
                try {
                  _.stateNode.nodeValue = d ? "" : _.memoizedProps;
                } catch (et) {
                  Ft(_, _.return, et);
                }
              }
            } else if (n.tag === 18) {
              if (a === null) {
                _ = n;
                try {
                  var k = _.stateNode;
                  d ? Fy(k, !0) : Fy(_.stateNode, !1);
                } catch (et) {
                  Ft(_, _.return, et);
                }
              }
            } else if (
              ((n.tag !== 22 && n.tag !== 23) || n.memoizedState === null || n === e) &&
              n.child !== null
            ) {
              ((n.child.return = n), (n = n.child));
              continue;
            }
            if (n === e) break t;
            for (; n.sibling === null;) {
              if (n.return === null || n.return === e) break t;
              (a === n && (a = null), (n = n.return));
            }
            (a === n && (a = null), (n.sibling.return = n.return), (n = n.sibling));
          }
        r & 4 &&
          ((r = e.updateQueue),
          r !== null && ((a = r.retryQueue), a !== null && ((r.retryQueue = null), _l(e, a))));
        break;
      case 19:
        (Ge(n, e),
          je(e),
          r & 4 && ((r = e.updateQueue), r !== null && ((e.updateQueue = null), _l(e, r))));
        break;
      case 30:
        break;
      case 21:
        break;
      default:
        (Ge(n, e), je(e));
    }
  }
  function je(e) {
    var n = e.flags;
    if (n & 2) {
      try {
        for (var a, r = e.return; r !== null;) {
          if (km(r)) {
            a = r;
            break;
          }
          r = r.return;
        }
        if (a == null) throw Error(s(160));
        switch (a.tag) {
          case 27:
            var d = a.stateNode,
              m = tf(e);
            Ml(e, m, d);
            break;
          case 5:
            var x = a.stateNode;
            a.flags & 32 && (Ys(x, ""), (a.flags &= -33));
            var w = tf(e);
            Ml(e, w, x);
            break;
          case 3:
          case 4:
            var _ = a.stateNode.containerInfo,
              N = tf(e);
            ef(e, N, _);
            break;
          default:
            throw Error(s(161));
        }
      } catch (V) {
        Ft(e, e.return, V);
      }
      e.flags &= -3;
    }
    n & 4096 && (e.flags &= -4097);
  }
  function Zm(e) {
    if (e.subtreeFlags & 1024)
      for (e = e.child; e !== null;) {
        var n = e;
        (Zm(n), n.tag === 5 && n.flags & 1024 && n.stateNode.reset(), (e = e.sibling));
      }
  }
  function an(e, n) {
    if (n.subtreeFlags & 8772)
      for (n = n.child; n !== null;) (Gm(e, n.alternate, n), (n = n.sibling));
  }
  function Ms(e) {
    for (e = e.child; e !== null;) {
      var n = e;
      switch (n.tag) {
        case 0:
        case 11:
        case 14:
        case 15:
          (Ln(4, n, n.return), Ms(n));
          break;
        case 1:
          Hi(n, n.return);
          var a = n.stateNode;
          (typeof a.componentWillUnmount == "function" && Fm(n, n.return, a), Ms(n));
          break;
        case 27:
          Ho(n.stateNode);
        case 26:
        case 5:
          (Hi(n, n.return), Ms(n));
          break;
        case 22:
          n.memoizedState === null && Ms(n);
          break;
        case 30:
          Ms(n);
          break;
        default:
          Ms(n);
      }
      e = e.sibling;
    }
  }
  function on(e, n, a) {
    for (a = a && (n.subtreeFlags & 8772) !== 0, n = n.child; n !== null;) {
      var r = n.alternate,
        d = e,
        m = n,
        x = m.flags;
      switch (m.tag) {
        case 0:
        case 11:
        case 15:
          (on(d, m, a), Ro(4, m));
          break;
        case 1:
          if ((on(d, m, a), (r = m), (d = r.stateNode), typeof d.componentDidMount == "function"))
            try {
              d.componentDidMount();
            } catch (N) {
              Ft(r, r.return, N);
            }
          if (((r = m), (d = r.updateQueue), d !== null)) {
            var w = r.stateNode;
            try {
              var _ = d.shared.hiddenCallbacks;
              if (_ !== null)
                for (d.shared.hiddenCallbacks = null, d = 0; d < _.length; d++) Mp(_[d], w);
            } catch (N) {
              Ft(r, r.return, N);
            }
          }
          (a && x & 64 && Um(m), Co(m, m.return));
          break;
        case 27:
          Hm(m);
        case 26:
        case 5:
          (on(d, m, a), a && r === null && x & 4 && Lm(m), Co(m, m.return));
          break;
        case 12:
          on(d, m, a);
          break;
        case 31:
          (on(d, m, a), a && x & 4 && qm(d, m));
          break;
        case 13:
          (on(d, m, a), a && x & 4 && Xm(d, m));
          break;
        case 22:
          (m.memoizedState === null && on(d, m, a), Co(m, m.return));
          break;
        case 30:
          break;
        default:
          on(d, m, a);
      }
      n = n.sibling;
    }
  }
  function sf(e, n) {
    var a = null;
    (e !== null &&
      e.memoizedState !== null &&
      e.memoizedState.cachePool !== null &&
      (a = e.memoizedState.cachePool.pool),
      (e = null),
      n.memoizedState !== null &&
        n.memoizedState.cachePool !== null &&
        (e = n.memoizedState.cachePool.pool),
      e !== a && (e != null && e.refCount++, a != null && yo(a)));
  }
  function af(e, n) {
    ((e = null),
      n.alternate !== null && (e = n.alternate.memoizedState.cache),
      (n = n.memoizedState.cache),
      n !== e && (n.refCount++, e != null && yo(e)));
  }
  function zi(e, n, a, r) {
    if (n.subtreeFlags & 10256) for (n = n.child; n !== null;) (Pm(e, n, a, r), (n = n.sibling));
  }
  function Pm(e, n, a, r) {
    var d = n.flags;
    switch (n.tag) {
      case 0:
      case 11:
      case 15:
        (zi(e, n, a, r), d & 2048 && Ro(9, n));
        break;
      case 1:
        zi(e, n, a, r);
        break;
      case 3:
        (zi(e, n, a, r),
          d & 2048 &&
            ((e = null),
            n.alternate !== null && (e = n.alternate.memoizedState.cache),
            (n = n.memoizedState.cache),
            n !== e && (n.refCount++, e != null && yo(e))));
        break;
      case 12:
        if (d & 2048) {
          (zi(e, n, a, r), (e = n.stateNode));
          try {
            var m = n.memoizedProps,
              x = m.id,
              w = m.onPostCommit;
            typeof w == "function" &&
              w(x, n.alternate === null ? "mount" : "update", e.passiveEffectDuration, -0);
          } catch (_) {
            Ft(n, n.return, _);
          }
        } else zi(e, n, a, r);
        break;
      case 31:
        zi(e, n, a, r);
        break;
      case 13:
        zi(e, n, a, r);
        break;
      case 23:
        break;
      case 22:
        ((m = n.stateNode),
          (x = n.alternate),
          n.memoizedState !== null
            ? m._visibility & 2
              ? zi(e, n, a, r)
              : Oo(e, n)
            : m._visibility & 2
              ? zi(e, n, a, r)
              : ((m._visibility |= 2), ca(e, n, a, r, (n.subtreeFlags & 10256) !== 0 || !1)),
          d & 2048 && sf(x, n));
        break;
      case 24:
        (zi(e, n, a, r), d & 2048 && af(n.alternate, n));
        break;
      default:
        zi(e, n, a, r);
    }
  }
  function ca(e, n, a, r, d) {
    for (d = d && ((n.subtreeFlags & 10256) !== 0 || !1), n = n.child; n !== null;) {
      var m = e,
        x = n,
        w = a,
        _ = r,
        N = x.flags;
      switch (x.tag) {
        case 0:
        case 11:
        case 15:
          (ca(m, x, w, _, d), Ro(8, x));
          break;
        case 23:
          break;
        case 22:
          var V = x.stateNode;
          (x.memoizedState !== null
            ? V._visibility & 2
              ? ca(m, x, w, _, d)
              : Oo(m, x)
            : ((V._visibility |= 2), ca(m, x, w, _, d)),
            d && N & 2048 && sf(x.alternate, x));
          break;
        case 24:
          (ca(m, x, w, _, d), d && N & 2048 && af(x.alternate, x));
          break;
        default:
          ca(m, x, w, _, d);
      }
      n = n.sibling;
    }
  }
  function Oo(e, n) {
    if (n.subtreeFlags & 10256)
      for (n = n.child; n !== null;) {
        var a = e,
          r = n,
          d = r.flags;
        switch (r.tag) {
          case 22:
            (Oo(a, r), d & 2048 && sf(r.alternate, r));
            break;
          case 24:
            (Oo(a, r), d & 2048 && af(r.alternate, r));
            break;
          default:
            Oo(a, r);
        }
        n = n.sibling;
      }
  }
  var Bo = 8192;
  function ua(e, n, a) {
    if (e.subtreeFlags & Bo) for (e = e.child; e !== null;) (Wm(e, n, a), (e = e.sibling));
  }
  function Wm(e, n, a) {
    switch (e.tag) {
      case 26:
        (ua(e, n, a),
          e.flags & Bo && e.memoizedState !== null && y2(a, Ti, e.memoizedState, e.memoizedProps));
        break;
      case 5:
        ua(e, n, a);
        break;
      case 3:
      case 4:
        var r = Ti;
        ((Ti = Hl(e.stateNode.containerInfo)), ua(e, n, a), (Ti = r));
        break;
      case 22:
        e.memoizedState === null &&
          ((r = e.alternate),
          r !== null && r.memoizedState !== null
            ? ((r = Bo), (Bo = 16777216), ua(e, n, a), (Bo = r))
            : ua(e, n, a));
        break;
      default:
        ua(e, n, a);
    }
  }
  function Jm(e) {
    var n = e.alternate;
    if (n !== null && ((e = n.child), e !== null)) {
      n.child = null;
      do ((n = e.sibling), (e.sibling = null), (e = n));
      while (e !== null);
    }
  }
  function Do(e) {
    var n = e.deletions;
    if ((e.flags & 16) !== 0) {
      if (n !== null)
        for (var a = 0; a < n.length; a++) {
          var r = n[a];
          ((ye = r), Km(r, e));
        }
      Jm(e);
    }
    if (e.subtreeFlags & 10256) for (e = e.child; e !== null;) (Qm(e), (e = e.sibling));
  }
  function Qm(e) {
    switch (e.tag) {
      case 0:
      case 11:
      case 15:
        (Do(e), e.flags & 2048 && Ln(9, e, e.return));
        break;
      case 3:
        Do(e);
        break;
      case 12:
        Do(e);
        break;
      case 22:
        var n = e.stateNode;
        e.memoizedState !== null && n._visibility & 2 && (e.return === null || e.return.tag !== 13)
          ? ((n._visibility &= -3), Tl(e))
          : Do(e);
        break;
      default:
        Do(e);
    }
  }
  function Tl(e) {
    var n = e.deletions;
    if ((e.flags & 16) !== 0) {
      if (n !== null)
        for (var a = 0; a < n.length; a++) {
          var r = n[a];
          ((ye = r), Km(r, e));
        }
      Jm(e);
    }
    for (e = e.child; e !== null;) {
      switch (((n = e), n.tag)) {
        case 0:
        case 11:
        case 15:
          (Ln(8, n, n.return), Tl(n));
          break;
        case 22:
          ((a = n.stateNode), a._visibility & 2 && ((a._visibility &= -3), Tl(n)));
          break;
        default:
          Tl(n);
      }
      e = e.sibling;
    }
  }
  function Km(e, n) {
    for (; ye !== null;) {
      var a = ye;
      switch (a.tag) {
        case 0:
        case 11:
        case 15:
          Ln(8, a, n);
          break;
        case 23:
        case 22:
          if (a.memoizedState !== null && a.memoizedState.cachePool !== null) {
            var r = a.memoizedState.cachePool.pool;
            r != null && r.refCount++;
          }
          break;
        case 24:
          yo(a.memoizedState.cache);
      }
      if (((r = a.child), r !== null)) ((r.return = a), (ye = r));
      else
        t: for (a = e; ye !== null;) {
          r = ye;
          var d = r.sibling,
            m = r.return;
          if ((jm(r), r === a)) {
            ye = null;
            break t;
          }
          if (d !== null) {
            ((d.return = m), (ye = d));
            break t;
          }
          ye = m;
        }
    }
  }
  var Ox = {
      getCacheForType: function (e) {
        var n = Ae(ce),
          a = n.data.get(e);
        return (a === void 0 && ((a = e()), n.data.set(e, a)), a);
      },
      cacheSignal: function () {
        return Ae(ce).controller.signal;
      },
    },
    Bx = typeof WeakMap == "function" ? WeakMap : Map,
    Dt = 0,
    Xt = null,
    St = null,
    _t = 0,
    Ut = 0,
    $e = null,
    kn = !1,
    ha = !1,
    of = !1,
    rn = 0,
    ie = 0,
    Hn = 0,
    _s = 0,
    rf = 0,
    ti = 0,
    fa = 0,
    No = null,
    Ye = null,
    lf = !1,
    zl = 0,
    $m = 0,
    El = 1 / 0,
    Rl = null,
    Vn = null,
    pe = 0,
    Gn = null,
    da = null,
    ln = 0,
    cf = 0,
    uf = null,
    ty = null,
    Uo = 0,
    hf = null;
  function ei() {
    return (Dt & 2) !== 0 && _t !== 0 ? _t & -_t : L.T !== null ? gf() : y0();
  }
  function ey() {
    if (ti === 0)
      if ((_t & 536870912) === 0 || Et) {
        var e = Lr;
        ((Lr <<= 1), (Lr & 3932160) === 0 && (Lr = 262144), (ti = e));
      } else ti = 536870912;
    return ((e = Qe.current), e !== null && (e.flags |= 32), ti);
  }
  function qe(e, n, a) {
    (((e === Xt && (Ut === 2 || Ut === 9)) || e.cancelPendingCommit !== null) &&
      (pa(e, 0), jn(e, _t, ti, !1)),
      eo(e, a),
      ((Dt & 2) === 0 || e !== Xt) &&
        (e === Xt && ((Dt & 2) === 0 && (_s |= a), ie === 4 && jn(e, _t, ti, !1)), Vi(e)));
  }
  function iy(e, n, a) {
    if ((Dt & 6) !== 0) throw Error(s(327));
    var r = (!a && (n & 127) === 0 && (n & e.expiredLanes) === 0) || to(e, n),
      d = r ? Ux(e, n) : df(e, n, !0),
      m = r;
    do {
      if (d === 0) {
        ha && !r && jn(e, n, 0, !1);
        break;
      } else {
        if (((a = e.current.alternate), m && !Dx(a))) {
          ((d = df(e, n, !1)), (m = !1));
          continue;
        }
        if (d === 2) {
          if (((m = n), e.errorRecoveryDisabledLanes & m)) var x = 0;
          else
            ((x = e.pendingLanes & -536870913), (x = x !== 0 ? x : x & 536870912 ? 536870912 : 0));
          if (x !== 0) {
            n = x;
            t: {
              var w = e;
              d = No;
              var _ = w.current.memoizedState.isDehydrated;
              if ((_ && (pa(w, x).flags |= 256), (x = df(w, x, !1)), x !== 2)) {
                if (of && !_) {
                  ((w.errorRecoveryDisabledLanes |= m), (_s |= m), (d = 4));
                  break t;
                }
                ((m = Ye), (Ye = d), m !== null && (Ye === null ? (Ye = m) : Ye.push.apply(Ye, m)));
              }
              d = x;
            }
            if (((m = !1), d !== 2)) continue;
          }
        }
        if (d === 1) {
          (pa(e, 0), jn(e, n, 0, !0));
          break;
        }
        t: {
          switch (((r = e), (m = d), m)) {
            case 0:
            case 1:
              throw Error(s(345));
            case 4:
              if ((n & 4194048) !== n) break;
            case 6:
              jn(r, n, ti, !kn);
              break t;
            case 2:
              Ye = null;
              break;
            case 3:
            case 5:
              break;
            default:
              throw Error(s(329));
          }
          if ((n & 62914560) === n && ((d = zl + 300 - qt()), 10 < d)) {
            if ((jn(r, n, ti, !kn), Hr(r, 0, !0) !== 0)) break t;
            ((ln = n),
              (r.timeoutHandle = Dy(
                ny.bind(null, r, a, Ye, Rl, lf, n, ti, _s, fa, kn, m, "Throttled", -0, 0),
                d,
              )));
            break t;
          }
          ny(r, a, Ye, Rl, lf, n, ti, _s, fa, kn, m, null, -0, 0);
        }
      }
      break;
    } while (!0);
    Vi(e);
  }
  function ny(e, n, a, r, d, m, x, w, _, N, V, Y, F, k) {
    if (((e.timeoutHandle = -1), (Y = n.subtreeFlags), Y & 8192 || (Y & 16785408) === 16785408)) {
      ((Y = {
        stylesheets: null,
        count: 0,
        imgCount: 0,
        imgBytes: 0,
        suspenseyImages: [],
        waitingForImages: !0,
        waitingForViewTransition: !1,
        unsuspend: Ii,
      }),
        Wm(n, m, Y));
      var et = (m & 62914560) === m ? zl - qt() : (m & 4194048) === m ? $m - qt() : 0;
      if (((et = g2(Y, et)), et !== null)) {
        ((ln = m),
          (e.cancelPendingCommit = et(hy.bind(null, e, n, m, a, r, d, x, w, _, V, Y, null, F, k))),
          jn(e, m, x, !N));
        return;
      }
    }
    hy(e, n, m, a, r, d, x, w, _);
  }
  function Dx(e) {
    for (var n = e; ;) {
      var a = n.tag;
      if (
        (a === 0 || a === 11 || a === 15) &&
        n.flags & 16384 &&
        ((a = n.updateQueue), a !== null && ((a = a.stores), a !== null))
      )
        for (var r = 0; r < a.length; r++) {
          var d = a[r],
            m = d.getSnapshot;
          d = d.value;
          try {
            if (!We(m(), d)) return !1;
          } catch {
            return !1;
          }
        }
      if (((a = n.child), n.subtreeFlags & 16384 && a !== null)) ((a.return = n), (n = a));
      else {
        if (n === e) break;
        for (; n.sibling === null;) {
          if (n.return === null || n.return === e) return !0;
          n = n.return;
        }
        ((n.sibling.return = n.return), (n = n.sibling));
      }
    }
    return !0;
  }
  function jn(e, n, a, r) {
    ((n &= ~rf),
      (n &= ~_s),
      (e.suspendedLanes |= n),
      (e.pingedLanes &= ~n),
      r && (e.warmLanes |= n),
      (r = e.expirationTimes));
    for (var d = n; 0 < d;) {
      var m = 31 - Pe(d),
        x = 1 << m;
      ((r[m] = -1), (d &= ~x));
    }
    a !== 0 && d0(e, a, n);
  }
  function Cl() {
    return (Dt & 6) === 0 ? (Fo(0), !1) : !0;
  }
  function ff() {
    if (St !== null) {
      if (Ut === 0) var e = St.return;
      else ((e = St), (Ji = ys = null), zh(e), (sa = null), (vo = 0), (e = St));
      for (; e !== null;) (Nm(e.alternate, e), (e = e.return));
      St = null;
    }
  }
  function pa(e, n) {
    var a = e.timeoutHandle;
    (a !== -1 && ((e.timeoutHandle = -1), $x(a)),
      (a = e.cancelPendingCommit),
      a !== null && ((e.cancelPendingCommit = null), a()),
      (ln = 0),
      ff(),
      (Xt = e),
      (St = a = Pi(e.current, null)),
      (_t = n),
      (Ut = 0),
      ($e = null),
      (kn = !1),
      (ha = to(e, n)),
      (of = !1),
      (fa = ti = rf = _s = Hn = ie = 0),
      (Ye = No = null),
      (lf = !1),
      (n & 8) !== 0 && (n |= n & 32));
    var r = e.entangledLanes;
    if (r !== 0)
      for (e = e.entanglements, r &= n; 0 < r;) {
        var d = 31 - Pe(r),
          m = 1 << d;
        ((n |= e[d]), (r &= ~m));
      }
    return ((rn = n), Qr(), a);
  }
  function sy(e, n) {
    ((yt = null),
      (L.H = To),
      n === na || n === al
        ? ((n = xp()), (Ut = 3))
        : n === mh
          ? ((n = xp()), (Ut = 4))
          : (Ut =
              n === Yh
                ? 8
                : n !== null && typeof n == "object" && typeof n.then == "function"
                  ? 6
                  : 1),
      ($e = n),
      St === null && ((ie = 1), bl(e, hi(n, e.current))));
  }
  function ay() {
    var e = Qe.current;
    return e === null
      ? !0
      : (_t & 4194048) === _t
        ? mi === null
        : (_t & 62914560) === _t || (_t & 536870912) !== 0
          ? e === mi
          : !1;
  }
  function oy() {
    var e = L.H;
    return ((L.H = To), e === null ? To : e);
  }
  function ry() {
    var e = L.A;
    return ((L.A = Ox), e);
  }
  function Ol() {
    ((ie = 4),
      kn || ((_t & 4194048) !== _t && Qe.current !== null) || (ha = !0),
      ((Hn & 134217727) === 0 && (_s & 134217727) === 0) || Xt === null || jn(Xt, _t, ti, !1));
  }
  function df(e, n, a) {
    var r = Dt;
    Dt |= 2;
    var d = oy(),
      m = ry();
    ((Xt !== e || _t !== n) && ((Rl = null), pa(e, n)), (n = !1));
    var x = ie;
    t: do
      try {
        if (Ut !== 0 && St !== null) {
          var w = St,
            _ = $e;
          switch (Ut) {
            case 8:
              (ff(), (x = 6));
              break t;
            case 3:
            case 2:
            case 9:
            case 6:
              Qe.current === null && (n = !0);
              var N = Ut;
              if (((Ut = 0), ($e = null), ma(e, w, _, N), a && ha)) {
                x = 0;
                break t;
              }
              break;
            default:
              ((N = Ut), (Ut = 0), ($e = null), ma(e, w, _, N));
          }
        }
        (Nx(), (x = ie));
        break;
      } catch (V) {
        sy(e, V);
      }
    while (!0);
    return (
      n && e.shellSuspendCounter++,
      (Ji = ys = null),
      (Dt = r),
      (L.H = d),
      (L.A = m),
      St === null && ((Xt = null), (_t = 0), Qr()),
      x
    );
  }
  function Nx() {
    for (; St !== null;) ly(St);
  }
  function Ux(e, n) {
    var a = Dt;
    Dt |= 2;
    var r = oy(),
      d = ry();
    Xt !== e || _t !== n ? ((Rl = null), (El = qt() + 500), pa(e, n)) : (ha = to(e, n));
    t: do
      try {
        if (Ut !== 0 && St !== null) {
          n = St;
          var m = $e;
          e: switch (Ut) {
            case 1:
              ((Ut = 0), ($e = null), ma(e, n, m, 1));
              break;
            case 2:
            case 9:
              if (vp(m)) {
                ((Ut = 0), ($e = null), cy(n));
                break;
              }
              ((n = function () {
                ((Ut !== 2 && Ut !== 9) || Xt !== e || (Ut = 7), Vi(e));
              }),
                m.then(n, n));
              break t;
            case 3:
              Ut = 7;
              break t;
            case 4:
              Ut = 5;
              break t;
            case 7:
              vp(m) ? ((Ut = 0), ($e = null), cy(n)) : ((Ut = 0), ($e = null), ma(e, n, m, 7));
              break;
            case 5:
              var x = null;
              switch (St.tag) {
                case 26:
                  x = St.memoizedState;
                case 5:
                case 27:
                  var w = St;
                  if (x ? Py(x) : w.stateNode.complete) {
                    ((Ut = 0), ($e = null));
                    var _ = w.sibling;
                    if (_ !== null) St = _;
                    else {
                      var N = w.return;
                      N !== null ? ((St = N), Bl(N)) : (St = null);
                    }
                    break e;
                  }
              }
              ((Ut = 0), ($e = null), ma(e, n, m, 5));
              break;
            case 6:
              ((Ut = 0), ($e = null), ma(e, n, m, 6));
              break;
            case 8:
              (ff(), (ie = 6));
              break t;
            default:
              throw Error(s(462));
          }
        }
        Fx();
        break;
      } catch (V) {
        sy(e, V);
      }
    while (!0);
    return (
      (Ji = ys = null),
      (L.H = r),
      (L.A = d),
      (Dt = a),
      St !== null ? 0 : ((Xt = null), (_t = 0), Qr(), ie)
    );
  }
  function Fx() {
    for (; St !== null && !Pt();) ly(St);
  }
  function ly(e) {
    var n = Bm(e.alternate, e, rn);
    ((e.memoizedProps = e.pendingProps), n === null ? Bl(e) : (St = n));
  }
  function cy(e) {
    var n = e,
      a = n.alternate;
    switch (n.tag) {
      case 15:
      case 0:
        n = Tm(a, n, n.pendingProps, n.type, void 0, _t);
        break;
      case 11:
        n = Tm(a, n, n.pendingProps, n.type.render, n.ref, _t);
        break;
      case 5:
        zh(n);
      default:
        (Nm(a, n), (n = St = rp(n, rn)), (n = Bm(a, n, rn)));
    }
    ((e.memoizedProps = e.pendingProps), n === null ? Bl(e) : (St = n));
  }
  function ma(e, n, a, r) {
    ((Ji = ys = null), zh(n), (sa = null), (vo = 0));
    var d = n.return;
    try {
      if (Mx(e, d, n, a, _t)) {
        ((ie = 1), bl(e, hi(a, e.current)), (St = null));
        return;
      }
    } catch (m) {
      if (d !== null) throw ((St = d), m);
      ((ie = 1), bl(e, hi(a, e.current)), (St = null));
      return;
    }
    n.flags & 32768
      ? (Et || r === 1
          ? (e = !0)
          : ha || (_t & 536870912) !== 0
            ? (e = !1)
            : ((kn = e = !0),
              (r === 2 || r === 9 || r === 3 || r === 6) &&
                ((r = Qe.current), r !== null && r.tag === 13 && (r.flags |= 16384))),
        uy(n, e))
      : Bl(n);
  }
  function Bl(e) {
    var n = e;
    do {
      if ((n.flags & 32768) !== 0) {
        uy(n, kn);
        return;
      }
      e = n.return;
      var a = zx(n.alternate, n, rn);
      if (a !== null) {
        St = a;
        return;
      }
      if (((n = n.sibling), n !== null)) {
        St = n;
        return;
      }
      St = n = e;
    } while (n !== null);
    ie === 0 && (ie = 5);
  }
  function uy(e, n) {
    do {
      var a = Ex(e.alternate, e);
      if (a !== null) {
        ((a.flags &= 32767), (St = a));
        return;
      }
      if (
        ((a = e.return),
        a !== null && ((a.flags |= 32768), (a.subtreeFlags = 0), (a.deletions = null)),
        !n && ((e = e.sibling), e !== null))
      ) {
        St = e;
        return;
      }
      St = e = a;
    } while (e !== null);
    ((ie = 6), (St = null));
  }
  function hy(e, n, a, r, d, m, x, w, _) {
    e.cancelPendingCommit = null;
    do Dl();
    while (pe !== 0);
    if ((Dt & 6) !== 0) throw Error(s(327));
    if (n !== null) {
      if (n === e.current) throw Error(s(177));
      if (
        ((m = n.lanes | n.childLanes),
        (m |= th),
        mb(e, a, m, x, w, _),
        e === Xt && ((St = Xt = null), (_t = 0)),
        (da = n),
        (Gn = e),
        (ln = a),
        (cf = m),
        (uf = d),
        (ty = r),
        (n.subtreeFlags & 10256) !== 0 || (n.flags & 10256) !== 0
          ? ((e.callbackNode = null),
            (e.callbackPriority = 0),
            Vx(rs, function () {
              return (yy(), null);
            }))
          : ((e.callbackNode = null), (e.callbackPriority = 0)),
        (r = (n.flags & 13878) !== 0),
        (n.subtreeFlags & 13878) !== 0 || r)
      ) {
        ((r = L.T), (L.T = null), (d = I.p), (I.p = 2), (x = Dt), (Dt |= 4));
        try {
          Rx(e, n, a);
        } finally {
          ((Dt = x), (I.p = d), (L.T = r));
        }
      }
      ((pe = 1), fy(), dy(), py());
    }
  }
  function fy() {
    if (pe === 1) {
      pe = 0;
      var e = Gn,
        n = da,
        a = (n.flags & 13878) !== 0;
      if ((n.subtreeFlags & 13878) !== 0 || a) {
        ((a = L.T), (L.T = null));
        var r = I.p;
        I.p = 2;
        var d = Dt;
        Dt |= 4;
        try {
          Im(n, e);
          var m = _f,
            x = K0(e.containerInfo),
            w = m.focusedElem,
            _ = m.selectionRange;
          if (x !== w && w && w.ownerDocument && Q0(w.ownerDocument.documentElement, w)) {
            if (_ !== null && Wu(w)) {
              var N = _.start,
                V = _.end;
              if ((V === void 0 && (V = N), "selectionStart" in w))
                ((w.selectionStart = N), (w.selectionEnd = Math.min(V, w.value.length)));
              else {
                var Y = w.ownerDocument || document,
                  F = (Y && Y.defaultView) || window;
                if (F.getSelection) {
                  var k = F.getSelection(),
                    et = w.textContent.length,
                    ct = Math.min(_.start, et),
                    jt = _.end === void 0 ? ct : Math.min(_.end, et);
                  !k.extend && ct > jt && ((x = jt), (jt = ct), (ct = x));
                  var B = J0(w, ct),
                    z = J0(w, jt);
                  if (
                    B &&
                    z &&
                    (k.rangeCount !== 1 ||
                      k.anchorNode !== B.node ||
                      k.anchorOffset !== B.offset ||
                      k.focusNode !== z.node ||
                      k.focusOffset !== z.offset)
                  ) {
                    var D = Y.createRange();
                    (D.setStart(B.node, B.offset),
                      k.removeAllRanges(),
                      ct > jt
                        ? (k.addRange(D), k.extend(z.node, z.offset))
                        : (D.setEnd(z.node, z.offset), k.addRange(D)));
                  }
                }
              }
            }
            for (Y = [], k = w; (k = k.parentNode);)
              k.nodeType === 1 && Y.push({ element: k, left: k.scrollLeft, top: k.scrollTop });
            for (typeof w.focus == "function" && w.focus(), w = 0; w < Y.length; w++) {
              var j = Y[w];
              ((j.element.scrollLeft = j.left), (j.element.scrollTop = j.top));
            }
          }
          ((Xl = !!Mf), (_f = Mf = null));
        } finally {
          ((Dt = d), (I.p = r), (L.T = a));
        }
      }
      ((e.current = n), (pe = 2));
    }
  }
  function dy() {
    if (pe === 2) {
      pe = 0;
      var e = Gn,
        n = da,
        a = (n.flags & 8772) !== 0;
      if ((n.subtreeFlags & 8772) !== 0 || a) {
        ((a = L.T), (L.T = null));
        var r = I.p;
        I.p = 2;
        var d = Dt;
        Dt |= 4;
        try {
          Gm(e, n.alternate, n);
        } finally {
          ((Dt = d), (I.p = r), (L.T = a));
        }
      }
      pe = 3;
    }
  }
  function py() {
    if (pe === 4 || pe === 3) {
      ((pe = 0), se());
      var e = Gn,
        n = da,
        a = ln,
        r = ty;
      (n.subtreeFlags & 10256) !== 0 || (n.flags & 10256) !== 0
        ? (pe = 5)
        : ((pe = 0), (da = Gn = null), my(e, e.pendingLanes));
      var d = e.pendingLanes;
      if (
        (d === 0 && (Vn = null),
        Cu(a),
        (n = n.stateNode),
        Ze && typeof Ze.onCommitFiberRoot == "function")
      )
        try {
          Ze.onCommitFiberRoot(Mn, n, void 0, (n.current.flags & 128) === 128);
        } catch {}
      if (r !== null) {
        ((n = L.T), (d = I.p), (I.p = 2), (L.T = null));
        try {
          for (var m = e.onRecoverableError, x = 0; x < r.length; x++) {
            var w = r[x];
            m(w.value, { componentStack: w.stack });
          }
        } finally {
          ((L.T = n), (I.p = d));
        }
      }
      ((ln & 3) !== 0 && Dl(),
        Vi(e),
        (d = e.pendingLanes),
        (a & 261930) !== 0 && (d & 42) !== 0 ? (e === hf ? Uo++ : ((Uo = 0), (hf = e))) : (Uo = 0),
        Fo(0));
    }
  }
  function my(e, n) {
    (e.pooledCacheLanes &= n) === 0 &&
      ((n = e.pooledCache), n != null && ((e.pooledCache = null), yo(n)));
  }
  function Dl() {
    return (fy(), dy(), py(), yy());
  }
  function yy() {
    if (pe !== 5) return !1;
    var e = Gn,
      n = cf;
    cf = 0;
    var a = Cu(ln),
      r = L.T,
      d = I.p;
    try {
      ((I.p = 32 > a ? 32 : a), (L.T = null), (a = uf), (uf = null));
      var m = Gn,
        x = ln;
      if (((pe = 0), (da = Gn = null), (ln = 0), (Dt & 6) !== 0)) throw Error(s(331));
      var w = Dt;
      if (
        ((Dt |= 4),
        Qm(m.current),
        Pm(m, m.current, x, a),
        (Dt = w),
        Fo(0, !1),
        Ze && typeof Ze.onPostCommitFiberRoot == "function")
      )
        try {
          Ze.onPostCommitFiberRoot(Mn, m);
        } catch {}
      return !0;
    } finally {
      ((I.p = d), (L.T = r), my(e, n));
    }
  }
  function gy(e, n, a) {
    ((n = hi(a, n)),
      (n = jh(e.stateNode, n, 2)),
      (e = Nn(e, n, 2)),
      e !== null && (eo(e, 2), Vi(e)));
  }
  function Ft(e, n, a) {
    if (e.tag === 3) gy(e, e, a);
    else
      for (; n !== null;) {
        if (n.tag === 3) {
          gy(n, e, a);
          break;
        } else if (n.tag === 1) {
          var r = n.stateNode;
          if (
            typeof n.type.getDerivedStateFromError == "function" ||
            (typeof r.componentDidCatch == "function" && (Vn === null || !Vn.has(r)))
          ) {
            ((e = hi(a, e)),
              (a = vm(2)),
              (r = Nn(n, a, 2)),
              r !== null && (bm(a, r, n, e), eo(r, 2), Vi(r)));
            break;
          }
        }
        n = n.return;
      }
  }
  function pf(e, n, a) {
    var r = e.pingCache;
    if (r === null) {
      r = e.pingCache = new Bx();
      var d = new Set();
      r.set(n, d);
    } else ((d = r.get(n)), d === void 0 && ((d = new Set()), r.set(n, d)));
    d.has(a) || ((of = !0), d.add(a), (e = Lx.bind(null, e, n, a)), n.then(e, e));
  }
  function Lx(e, n, a) {
    var r = e.pingCache;
    (r !== null && r.delete(n),
      (e.pingedLanes |= e.suspendedLanes & a),
      (e.warmLanes &= ~a),
      Xt === e &&
        (_t & a) === a &&
        (ie === 4 || (ie === 3 && (_t & 62914560) === _t && 300 > qt() - zl)
          ? (Dt & 2) === 0 && pa(e, 0)
          : (rf |= a),
        fa === _t && (fa = 0)),
      Vi(e));
  }
  function vy(e, n) {
    (n === 0 && (n = f0()), (e = ds(e, n)), e !== null && (eo(e, n), Vi(e)));
  }
  function kx(e) {
    var n = e.memoizedState,
      a = 0;
    (n !== null && (a = n.retryLane), vy(e, a));
  }
  function Hx(e, n) {
    var a = 0;
    switch (e.tag) {
      case 31:
      case 13:
        var r = e.stateNode,
          d = e.memoizedState;
        d !== null && (a = d.retryLane);
        break;
      case 19:
        r = e.stateNode;
        break;
      case 22:
        r = e.stateNode._retryCache;
        break;
      default:
        throw Error(s(314));
    }
    (r !== null && r.delete(n), vy(e, a));
  }
  function Vx(e, n) {
    return mt(e, n);
  }
  var Nl = null,
    ya = null,
    mf = !1,
    Ul = !1,
    yf = !1,
    Yn = 0;
  function Vi(e) {
    (e !== ya && e.next === null && (ya === null ? (Nl = ya = e) : (ya = ya.next = e)),
      (Ul = !0),
      mf || ((mf = !0), jx()));
  }
  function Fo(e, n) {
    if (!yf && Ul) {
      yf = !0;
      do
        for (var a = !1, r = Nl; r !== null;) {
          if (e !== 0) {
            var d = r.pendingLanes;
            if (d === 0) var m = 0;
            else {
              var x = r.suspendedLanes,
                w = r.pingedLanes;
              ((m = (1 << (31 - Pe(42 | e) + 1)) - 1),
                (m &= d & ~(x & ~w)),
                (m = m & 201326741 ? (m & 201326741) | 1 : m ? m | 2 : 0));
            }
            m !== 0 && ((a = !0), wy(r, m));
          } else
            ((m = _t),
              (m = Hr(
                r,
                r === Xt ? m : 0,
                r.cancelPendingCommit !== null || r.timeoutHandle !== -1,
              )),
              (m & 3) === 0 || to(r, m) || ((a = !0), wy(r, m)));
          r = r.next;
        }
      while (a);
      yf = !1;
    }
  }
  function Gx() {
    by();
  }
  function by() {
    Ul = mf = !1;
    var e = 0;
    Yn !== 0 && Kx() && (e = Yn);
    for (var n = qt(), a = null, r = Nl; r !== null;) {
      var d = r.next,
        m = xy(r, n);
      (m === 0
        ? ((r.next = null), a === null ? (Nl = d) : (a.next = d), d === null && (ya = a))
        : ((a = r), (e !== 0 || (m & 3) !== 0) && (Ul = !0)),
        (r = d));
    }
    ((pe !== 0 && pe !== 5) || Fo(e), Yn !== 0 && (Yn = 0));
  }
  function xy(e, n) {
    for (
      var a = e.suspendedLanes,
        r = e.pingedLanes,
        d = e.expirationTimes,
        m = e.pendingLanes & -62914561;
      0 < m;
    ) {
      var x = 31 - Pe(m),
        w = 1 << x,
        _ = d[x];
      (_ === -1
        ? ((w & a) === 0 || (w & r) !== 0) && (d[x] = pb(w, n))
        : _ <= n && (e.expiredLanes |= w),
        (m &= ~w));
    }
    if (
      ((n = Xt),
      (a = _t),
      (a = Hr(e, e === n ? a : 0, e.cancelPendingCommit !== null || e.timeoutHandle !== -1)),
      (r = e.callbackNode),
      a === 0 || (e === n && (Ut === 2 || Ut === 9)) || e.cancelPendingCommit !== null)
    )
      return (r !== null && r !== null && Ht(r), (e.callbackNode = null), (e.callbackPriority = 0));
    if ((a & 3) === 0 || to(e, a)) {
      if (((n = a & -a), n === e.callbackPriority)) return n;
      switch ((r !== null && Ht(r), Cu(a))) {
        case 2:
        case 8:
          a = $a;
          break;
        case 32:
          a = rs;
          break;
        case 268435456:
          a = Nr;
          break;
        default:
          a = rs;
      }
      return (
        (r = Sy.bind(null, e)),
        (a = mt(a, r)),
        (e.callbackPriority = n),
        (e.callbackNode = a),
        n
      );
    }
    return (
      r !== null && r !== null && Ht(r),
      (e.callbackPriority = 2),
      (e.callbackNode = null),
      2
    );
  }
  function Sy(e, n) {
    if (pe !== 0 && pe !== 5) return ((e.callbackNode = null), (e.callbackPriority = 0), null);
    var a = e.callbackNode;
    if (Dl() && e.callbackNode !== a) return null;
    var r = _t;
    return (
      (r = Hr(e, e === Xt ? r : 0, e.cancelPendingCommit !== null || e.timeoutHandle !== -1)),
      r === 0
        ? null
        : (iy(e, r, n),
          xy(e, qt()),
          e.callbackNode != null && e.callbackNode === a ? Sy.bind(null, e) : null)
    );
  }
  function wy(e, n) {
    if (Dl()) return null;
    iy(e, n, !0);
  }
  function jx() {
    t2(function () {
      (Dt & 6) !== 0 ? mt(Ce, Gx) : by();
    });
  }
  function gf() {
    if (Yn === 0) {
      var e = ea;
      (e === 0 && ((e = Fr), (Fr <<= 1), (Fr & 261888) === 0 && (Fr = 256)), (Yn = e));
    }
    return Yn;
  }
  function Ay(e) {
    return e == null || typeof e == "symbol" || typeof e == "boolean"
      ? null
      : typeof e == "function"
        ? e
        : Yr("" + e);
  }
  function My(e, n) {
    var a = n.ownerDocument.createElement("input");
    return (
      (a.name = n.name),
      (a.value = n.value),
      e.id && a.setAttribute("form", e.id),
      n.parentNode.insertBefore(a, n),
      (e = new FormData(e)),
      a.parentNode.removeChild(a),
      e
    );
  }
  function Yx(e, n, a, r, d) {
    if (n === "submit" && a && a.stateNode === d) {
      var m = Ay((d[ke] || null).action),
        x = r.submitter;
      x &&
        ((n = (n = x[ke] || null) ? Ay(n.formAction) : x.getAttribute("formAction")),
        n !== null && ((m = n), (x = null)));
      var w = new Zr("action", "action", null, r, d);
      e.push({
        event: w,
        listeners: [
          {
            instance: null,
            listener: function () {
              if (r.defaultPrevented) {
                if (Yn !== 0) {
                  var _ = x ? My(d, x) : new FormData(d);
                  Fh(a, { pending: !0, data: _, method: d.method, action: m }, null, _);
                }
              } else
                typeof m == "function" &&
                  (w.preventDefault(),
                  (_ = x ? My(d, x) : new FormData(d)),
                  Fh(a, { pending: !0, data: _, method: d.method, action: m }, m, _));
            },
            currentTarget: d,
          },
        ],
      });
    }
  }
  for (var vf = 0; vf < $u.length; vf++) {
    var bf = $u[vf],
      qx = bf.toLowerCase(),
      Xx = bf[0].toUpperCase() + bf.slice(1);
    _i(qx, "on" + Xx);
  }
  (_i(ep, "onAnimationEnd"),
    _i(ip, "onAnimationIteration"),
    _i(np, "onAnimationStart"),
    _i("dblclick", "onDoubleClick"),
    _i("focusin", "onFocus"),
    _i("focusout", "onBlur"),
    _i(rx, "onTransitionRun"),
    _i(lx, "onTransitionStart"),
    _i(cx, "onTransitionCancel"),
    _i(sp, "onTransitionEnd"),
    Gs("onMouseEnter", ["mouseout", "mouseover"]),
    Gs("onMouseLeave", ["mouseout", "mouseover"]),
    Gs("onPointerEnter", ["pointerout", "pointerover"]),
    Gs("onPointerLeave", ["pointerout", "pointerover"]),
    cs("onChange", "change click focusin focusout input keydown keyup selectionchange".split(" ")),
    cs(
      "onSelect",
      "focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange".split(
        " ",
      ),
    ),
    cs("onBeforeInput", ["compositionend", "keypress", "textInput", "paste"]),
    cs("onCompositionEnd", "compositionend focusout keydown keypress keyup mousedown".split(" ")),
    cs(
      "onCompositionStart",
      "compositionstart focusout keydown keypress keyup mousedown".split(" "),
    ),
    cs(
      "onCompositionUpdate",
      "compositionupdate focusout keydown keypress keyup mousedown".split(" "),
    ));
  var Lo =
      "abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange resize seeked seeking stalled suspend timeupdate volumechange waiting".split(
        " ",
      ),
    Ix = new Set(
      "beforetoggle cancel close invalid load scroll scrollend toggle".split(" ").concat(Lo),
    );
  function _y(e, n) {
    n = (n & 4) !== 0;
    for (var a = 0; a < e.length; a++) {
      var r = e[a],
        d = r.event;
      r = r.listeners;
      t: {
        var m = void 0;
        if (n)
          for (var x = r.length - 1; 0 <= x; x--) {
            var w = r[x],
              _ = w.instance,
              N = w.currentTarget;
            if (((w = w.listener), _ !== m && d.isPropagationStopped())) break t;
            ((m = w), (d.currentTarget = N));
            try {
              m(d);
            } catch (V) {
              Jr(V);
            }
            ((d.currentTarget = null), (m = _));
          }
        else
          for (x = 0; x < r.length; x++) {
            if (
              ((w = r[x]),
              (_ = w.instance),
              (N = w.currentTarget),
              (w = w.listener),
              _ !== m && d.isPropagationStopped())
            )
              break t;
            ((m = w), (d.currentTarget = N));
            try {
              m(d);
            } catch (V) {
              Jr(V);
            }
            ((d.currentTarget = null), (m = _));
          }
      }
    }
  }
  function wt(e, n) {
    var a = n[Ou];
    a === void 0 && (a = n[Ou] = new Set());
    var r = e + "__bubble";
    a.has(r) || (Ty(n, e, 2, !1), a.add(r));
  }
  function xf(e, n, a) {
    var r = 0;
    (n && (r |= 4), Ty(a, e, r, n));
  }
  var Fl = "_reactListening" + Math.random().toString(36).slice(2);
  function Sf(e) {
    if (!e[Fl]) {
      ((e[Fl] = !0),
        b0.forEach(function (a) {
          a !== "selectionchange" && (Ix.has(a) || xf(a, !1, e), xf(a, !0, e));
        }));
      var n = e.nodeType === 9 ? e : e.ownerDocument;
      n === null || n[Fl] || ((n[Fl] = !0), xf("selectionchange", !1, n));
    }
  }
  function Ty(e, n, a, r) {
    switch (eg(n)) {
      case 2:
        var d = x2;
        break;
      case 8:
        d = S2;
        break;
      default:
        d = Ff;
    }
    ((a = d.bind(null, n, a, e)),
      (d = void 0),
      !Vu || (n !== "touchstart" && n !== "touchmove" && n !== "wheel") || (d = !0),
      r
        ? d !== void 0
          ? e.addEventListener(n, a, { capture: !0, passive: d })
          : e.addEventListener(n, a, !0)
        : d !== void 0
          ? e.addEventListener(n, a, { passive: d })
          : e.addEventListener(n, a, !1));
  }
  function wf(e, n, a, r, d) {
    var m = r;
    if ((n & 1) === 0 && (n & 2) === 0 && r !== null)
      t: for (;;) {
        if (r === null) return;
        var x = r.tag;
        if (x === 3 || x === 4) {
          var w = r.stateNode.containerInfo;
          if (w === d) break;
          if (x === 4)
            for (x = r.return; x !== null;) {
              var _ = x.tag;
              if ((_ === 3 || _ === 4) && x.stateNode.containerInfo === d) return;
              x = x.return;
            }
          for (; w !== null;) {
            if (((x = ks(w)), x === null)) return;
            if (((_ = x.tag), _ === 5 || _ === 6 || _ === 26 || _ === 27)) {
              r = m = x;
              continue t;
            }
            w = w.parentNode;
          }
        }
        r = r.return;
      }
    O0(function () {
      var N = m,
        V = ku(a),
        Y = [];
      t: {
        var F = ap.get(e);
        if (F !== void 0) {
          var k = Zr,
            et = e;
          switch (e) {
            case "keypress":
              if (Xr(a) === 0) break t;
            case "keydown":
            case "keyup":
              k = Hb;
              break;
            case "focusin":
              ((et = "focus"), (k = qu));
              break;
            case "focusout":
              ((et = "blur"), (k = qu));
              break;
            case "beforeblur":
            case "afterblur":
              k = qu;
              break;
            case "click":
              if (a.button === 2) break t;
            case "auxclick":
            case "dblclick":
            case "mousedown":
            case "mousemove":
            case "mouseup":
            case "mouseout":
            case "mouseover":
            case "contextmenu":
              k = N0;
              break;
            case "drag":
            case "dragend":
            case "dragenter":
            case "dragexit":
            case "dragleave":
            case "dragover":
            case "dragstart":
            case "drop":
              k = zb;
              break;
            case "touchcancel":
            case "touchend":
            case "touchmove":
            case "touchstart":
              k = jb;
              break;
            case ep:
            case ip:
            case np:
              k = Cb;
              break;
            case sp:
              k = qb;
              break;
            case "scroll":
            case "scrollend":
              k = _b;
              break;
            case "wheel":
              k = Ib;
              break;
            case "copy":
            case "cut":
            case "paste":
              k = Bb;
              break;
            case "gotpointercapture":
            case "lostpointercapture":
            case "pointercancel":
            case "pointerdown":
            case "pointermove":
            case "pointerout":
            case "pointerover":
            case "pointerup":
              k = F0;
              break;
            case "toggle":
            case "beforetoggle":
              k = Pb;
          }
          var ct = (n & 4) !== 0,
            jt = !ct && (e === "scroll" || e === "scrollend"),
            B = ct ? (F !== null ? F + "Capture" : null) : F;
          ct = [];
          for (var z = N, D; z !== null;) {
            var j = z;
            if (
              ((D = j.stateNode),
              (j = j.tag),
              (j !== 5 && j !== 26 && j !== 27) ||
                D === null ||
                B === null ||
                ((j = so(z, B)), j != null && ct.push(ko(z, j, D))),
              jt)
            )
              break;
            z = z.return;
          }
          0 < ct.length && ((F = new k(F, et, null, a, V)), Y.push({ event: F, listeners: ct }));
        }
      }
      if ((n & 7) === 0) {
        t: {
          if (
            ((F = e === "mouseover" || e === "pointerover"),
            (k = e === "mouseout" || e === "pointerout"),
            F && a !== Lu && (et = a.relatedTarget || a.fromElement) && (ks(et) || et[Ls]))
          )
            break t;
          if (
            (k || F) &&
            ((F =
              V.window === V
                ? V
                : (F = V.ownerDocument)
                  ? F.defaultView || F.parentWindow
                  : window),
            k
              ? ((et = a.relatedTarget || a.toElement),
                (k = N),
                (et = et ? ks(et) : null),
                et !== null &&
                  ((jt = l(et)), (ct = et.tag), et !== jt || (ct !== 5 && ct !== 27 && ct !== 6)) &&
                  (et = null))
              : ((k = null), (et = N)),
            k !== et)
          ) {
            if (
              ((ct = N0),
              (j = "onMouseLeave"),
              (B = "onMouseEnter"),
              (z = "mouse"),
              (e === "pointerout" || e === "pointerover") &&
                ((ct = F0), (j = "onPointerLeave"), (B = "onPointerEnter"), (z = "pointer")),
              (jt = k == null ? F : no(k)),
              (D = et == null ? F : no(et)),
              (F = new ct(j, z + "leave", k, a, V)),
              (F.target = jt),
              (F.relatedTarget = D),
              (j = null),
              ks(V) === N &&
                ((ct = new ct(B, z + "enter", et, a, V)),
                (ct.target = D),
                (ct.relatedTarget = jt),
                (j = ct)),
              (jt = j),
              k && et)
            )
              e: {
                for (ct = Zx, B = k, z = et, D = 0, j = B; j; j = ct(j)) D++;
                j = 0;
                for (var ot = z; ot; ot = ct(ot)) j++;
                for (; 0 < D - j;) ((B = ct(B)), D--);
                for (; 0 < j - D;) ((z = ct(z)), j--);
                for (; D--;) {
                  if (B === z || (z !== null && B === z.alternate)) {
                    ct = B;
                    break e;
                  }
                  ((B = ct(B)), (z = ct(z)));
                }
                ct = null;
              }
            else ct = null;
            (k !== null && zy(Y, F, k, ct, !1),
              et !== null && jt !== null && zy(Y, jt, et, ct, !0));
          }
        }
        t: {
          if (
            ((F = N ? no(N) : window),
            (k = F.nodeName && F.nodeName.toLowerCase()),
            k === "select" || (k === "input" && F.type === "file"))
          )
            var Ot = q0;
          else if (j0(F))
            if (X0) Ot = sx;
            else {
              Ot = ix;
              var it = ex;
            }
          else
            ((k = F.nodeName),
              !k || k.toLowerCase() !== "input" || (F.type !== "checkbox" && F.type !== "radio")
                ? N && Fu(N.elementType) && (Ot = q0)
                : (Ot = nx));
          if (Ot && (Ot = Ot(e, N))) {
            Y0(Y, Ot, a, V);
            break t;
          }
          (it && it(e, F, N),
            e === "focusout" &&
              N &&
              F.type === "number" &&
              N.memoizedProps.value != null &&
              Uu(F, "number", F.value));
        }
        switch (((it = N ? no(N) : window), e)) {
          case "focusin":
            (j0(it) || it.contentEditable === "true") && ((Zs = it), (Ju = N), (fo = null));
            break;
          case "focusout":
            fo = Ju = Zs = null;
            break;
          case "mousedown":
            Qu = !0;
            break;
          case "contextmenu":
          case "mouseup":
          case "dragend":
            ((Qu = !1), $0(Y, a, V));
            break;
          case "selectionchange":
            if (ox) break;
          case "keydown":
          case "keyup":
            $0(Y, a, V);
        }
        var vt;
        if (Iu)
          t: {
            switch (e) {
              case "compositionstart":
                var Tt = "onCompositionStart";
                break t;
              case "compositionend":
                Tt = "onCompositionEnd";
                break t;
              case "compositionupdate":
                Tt = "onCompositionUpdate";
                break t;
            }
            Tt = void 0;
          }
        else
          Is
            ? V0(e, a) && (Tt = "onCompositionEnd")
            : e === "keydown" && a.keyCode === 229 && (Tt = "onCompositionStart");
        (Tt &&
          (L0 &&
            a.locale !== "ko" &&
            (Is || Tt !== "onCompositionStart"
              ? Tt === "onCompositionEnd" && Is && (vt = B0())
              : ((zn = V), (Gu = "value" in zn ? zn.value : zn.textContent), (Is = !0))),
          (it = Ll(N, Tt)),
          0 < it.length &&
            ((Tt = new U0(Tt, e, null, a, V)),
            Y.push({ event: Tt, listeners: it }),
            vt ? (Tt.data = vt) : ((vt = G0(a)), vt !== null && (Tt.data = vt)))),
          (vt = Jb ? Qb(e, a) : Kb(e, a)) &&
            ((Tt = Ll(N, "onBeforeInput")),
            0 < Tt.length &&
              ((it = new U0("onBeforeInput", "beforeinput", null, a, V)),
              Y.push({ event: it, listeners: Tt }),
              (it.data = vt))),
          Yx(Y, e, N, a, V));
      }
      _y(Y, n);
    });
  }
  function ko(e, n, a) {
    return { instance: e, listener: n, currentTarget: a };
  }
  function Ll(e, n) {
    for (var a = n + "Capture", r = []; e !== null;) {
      var d = e,
        m = d.stateNode;
      if (
        ((d = d.tag),
        (d !== 5 && d !== 26 && d !== 27) ||
          m === null ||
          ((d = so(e, a)),
          d != null && r.unshift(ko(e, d, m)),
          (d = so(e, n)),
          d != null && r.push(ko(e, d, m))),
        e.tag === 3)
      )
        return r;
      e = e.return;
    }
    return [];
  }
  function Zx(e) {
    if (e === null) return null;
    do e = e.return;
    while (e && e.tag !== 5 && e.tag !== 27);
    return e || null;
  }
  function zy(e, n, a, r, d) {
    for (var m = n._reactName, x = []; a !== null && a !== r;) {
      var w = a,
        _ = w.alternate,
        N = w.stateNode;
      if (((w = w.tag), _ !== null && _ === r)) break;
      ((w !== 5 && w !== 26 && w !== 27) ||
        N === null ||
        ((_ = N),
        d
          ? ((N = so(a, m)), N != null && x.unshift(ko(a, N, _)))
          : d || ((N = so(a, m)), N != null && x.push(ko(a, N, _)))),
        (a = a.return));
    }
    x.length !== 0 && e.push({ event: n, listeners: x });
  }
  var Px = /\r\n?/g,
    Wx = /\u0000|\uFFFD/g;
  function Ey(e) {
    return (typeof e == "string" ? e : "" + e)
      .replace(
        Px,
        `
`,
      )
      .replace(Wx, "");
  }
  function Ry(e, n) {
    return ((n = Ey(n)), Ey(e) === n);
  }
  function Gt(e, n, a, r, d, m) {
    switch (a) {
      case "children":
        typeof r == "string"
          ? n === "body" || (n === "textarea" && r === "") || Ys(e, r)
          : (typeof r == "number" || typeof r == "bigint") && n !== "body" && Ys(e, "" + r);
        break;
      case "className":
        Gr(e, "class", r);
        break;
      case "tabIndex":
        Gr(e, "tabindex", r);
        break;
      case "dir":
      case "role":
      case "viewBox":
      case "width":
      case "height":
        Gr(e, a, r);
        break;
      case "style":
        R0(e, r, m);
        break;
      case "data":
        if (n !== "object") {
          Gr(e, "data", r);
          break;
        }
      case "src":
      case "href":
        if (r === "" && (n !== "a" || a !== "href")) {
          e.removeAttribute(a);
          break;
        }
        if (r == null || typeof r == "function" || typeof r == "symbol" || typeof r == "boolean") {
          e.removeAttribute(a);
          break;
        }
        ((r = Yr("" + r)), e.setAttribute(a, r));
        break;
      case "action":
      case "formAction":
        if (typeof r == "function") {
          e.setAttribute(
            a,
            "javascript:throw new Error('A React form was unexpectedly submitted. If you called form.submit() manually, consider using form.requestSubmit() instead. If you\\'re trying to use event.stopPropagation() in a submit event handler, consider also calling event.preventDefault().')",
          );
          break;
        } else
          typeof m == "function" &&
            (a === "formAction"
              ? (n !== "input" && Gt(e, n, "name", d.name, d, null),
                Gt(e, n, "formEncType", d.formEncType, d, null),
                Gt(e, n, "formMethod", d.formMethod, d, null),
                Gt(e, n, "formTarget", d.formTarget, d, null))
              : (Gt(e, n, "encType", d.encType, d, null),
                Gt(e, n, "method", d.method, d, null),
                Gt(e, n, "target", d.target, d, null)));
        if (r == null || typeof r == "symbol" || typeof r == "boolean") {
          e.removeAttribute(a);
          break;
        }
        ((r = Yr("" + r)), e.setAttribute(a, r));
        break;
      case "onClick":
        r != null && (e.onclick = Ii);
        break;
      case "onScroll":
        r != null && wt("scroll", e);
        break;
      case "onScrollEnd":
        r != null && wt("scrollend", e);
        break;
      case "dangerouslySetInnerHTML":
        if (r != null) {
          if (typeof r != "object" || !("__html" in r)) throw Error(s(61));
          if (((a = r.__html), a != null)) {
            if (d.children != null) throw Error(s(60));
            e.innerHTML = a;
          }
        }
        break;
      case "multiple":
        e.multiple = r && typeof r != "function" && typeof r != "symbol";
        break;
      case "muted":
        e.muted = r && typeof r != "function" && typeof r != "symbol";
        break;
      case "suppressContentEditableWarning":
      case "suppressHydrationWarning":
      case "defaultValue":
      case "defaultChecked":
      case "innerHTML":
      case "ref":
        break;
      case "autoFocus":
        break;
      case "xlinkHref":
        if (r == null || typeof r == "function" || typeof r == "boolean" || typeof r == "symbol") {
          e.removeAttribute("xlink:href");
          break;
        }
        ((a = Yr("" + r)), e.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", a));
        break;
      case "contentEditable":
      case "spellCheck":
      case "draggable":
      case "value":
      case "autoReverse":
      case "externalResourcesRequired":
      case "focusable":
      case "preserveAlpha":
        r != null && typeof r != "function" && typeof r != "symbol"
          ? e.setAttribute(a, "" + r)
          : e.removeAttribute(a);
        break;
      case "inert":
      case "allowFullScreen":
      case "async":
      case "autoPlay":
      case "controls":
      case "default":
      case "defer":
      case "disabled":
      case "disablePictureInPicture":
      case "disableRemotePlayback":
      case "formNoValidate":
      case "hidden":
      case "loop":
      case "noModule":
      case "noValidate":
      case "open":
      case "playsInline":
      case "readOnly":
      case "required":
      case "reversed":
      case "scoped":
      case "seamless":
      case "itemScope":
        r && typeof r != "function" && typeof r != "symbol"
          ? e.setAttribute(a, "")
          : e.removeAttribute(a);
        break;
      case "capture":
      case "download":
        r === !0
          ? e.setAttribute(a, "")
          : r !== !1 && r != null && typeof r != "function" && typeof r != "symbol"
            ? e.setAttribute(a, r)
            : e.removeAttribute(a);
        break;
      case "cols":
      case "rows":
      case "size":
      case "span":
        r != null && typeof r != "function" && typeof r != "symbol" && !isNaN(r) && 1 <= r
          ? e.setAttribute(a, r)
          : e.removeAttribute(a);
        break;
      case "rowSpan":
      case "start":
        r == null || typeof r == "function" || typeof r == "symbol" || isNaN(r)
          ? e.removeAttribute(a)
          : e.setAttribute(a, r);
        break;
      case "popover":
        (wt("beforetoggle", e), wt("toggle", e), Vr(e, "popover", r));
        break;
      case "xlinkActuate":
        Xi(e, "http://www.w3.org/1999/xlink", "xlink:actuate", r);
        break;
      case "xlinkArcrole":
        Xi(e, "http://www.w3.org/1999/xlink", "xlink:arcrole", r);
        break;
      case "xlinkRole":
        Xi(e, "http://www.w3.org/1999/xlink", "xlink:role", r);
        break;
      case "xlinkShow":
        Xi(e, "http://www.w3.org/1999/xlink", "xlink:show", r);
        break;
      case "xlinkTitle":
        Xi(e, "http://www.w3.org/1999/xlink", "xlink:title", r);
        break;
      case "xlinkType":
        Xi(e, "http://www.w3.org/1999/xlink", "xlink:type", r);
        break;
      case "xmlBase":
        Xi(e, "http://www.w3.org/XML/1998/namespace", "xml:base", r);
        break;
      case "xmlLang":
        Xi(e, "http://www.w3.org/XML/1998/namespace", "xml:lang", r);
        break;
      case "xmlSpace":
        Xi(e, "http://www.w3.org/XML/1998/namespace", "xml:space", r);
        break;
      case "is":
        Vr(e, "is", r);
        break;
      case "innerText":
      case "textContent":
        break;
      default:
        (!(2 < a.length) || (a[0] !== "o" && a[0] !== "O") || (a[1] !== "n" && a[1] !== "N")) &&
          ((a = Ab.get(a) || a), Vr(e, a, r));
    }
  }
  function Af(e, n, a, r, d, m) {
    switch (a) {
      case "style":
        R0(e, r, m);
        break;
      case "dangerouslySetInnerHTML":
        if (r != null) {
          if (typeof r != "object" || !("__html" in r)) throw Error(s(61));
          if (((a = r.__html), a != null)) {
            if (d.children != null) throw Error(s(60));
            e.innerHTML = a;
          }
        }
        break;
      case "children":
        typeof r == "string"
          ? Ys(e, r)
          : (typeof r == "number" || typeof r == "bigint") && Ys(e, "" + r);
        break;
      case "onScroll":
        r != null && wt("scroll", e);
        break;
      case "onScrollEnd":
        r != null && wt("scrollend", e);
        break;
      case "onClick":
        r != null && (e.onclick = Ii);
        break;
      case "suppressContentEditableWarning":
      case "suppressHydrationWarning":
      case "innerHTML":
      case "ref":
        break;
      case "innerText":
      case "textContent":
        break;
      default:
        if (!x0.hasOwnProperty(a))
          t: {
            if (
              a[0] === "o" &&
              a[1] === "n" &&
              ((d = a.endsWith("Capture")),
              (n = a.slice(2, d ? a.length - 7 : void 0)),
              (m = e[ke] || null),
              (m = m != null ? m[a] : null),
              typeof m == "function" && e.removeEventListener(n, m, d),
              typeof r == "function")
            ) {
              (typeof m != "function" &&
                m !== null &&
                (a in e ? (e[a] = null) : e.hasAttribute(a) && e.removeAttribute(a)),
                e.addEventListener(n, r, d));
              break t;
            }
            a in e ? (e[a] = r) : r === !0 ? e.setAttribute(a, "") : Vr(e, a, r);
          }
    }
  }
  function _e(e, n, a) {
    switch (n) {
      case "div":
      case "span":
      case "svg":
      case "path":
      case "a":
      case "g":
      case "p":
      case "li":
        break;
      case "img":
        (wt("error", e), wt("load", e));
        var r = !1,
          d = !1,
          m;
        for (m in a)
          if (a.hasOwnProperty(m)) {
            var x = a[m];
            if (x != null)
              switch (m) {
                case "src":
                  r = !0;
                  break;
                case "srcSet":
                  d = !0;
                  break;
                case "children":
                case "dangerouslySetInnerHTML":
                  throw Error(s(137, n));
                default:
                  Gt(e, n, m, x, a, null);
              }
          }
        (d && Gt(e, n, "srcSet", a.srcSet, a, null), r && Gt(e, n, "src", a.src, a, null));
        return;
      case "input":
        wt("invalid", e);
        var w = (m = x = d = null),
          _ = null,
          N = null;
        for (r in a)
          if (a.hasOwnProperty(r)) {
            var V = a[r];
            if (V != null)
              switch (r) {
                case "name":
                  d = V;
                  break;
                case "type":
                  x = V;
                  break;
                case "checked":
                  _ = V;
                  break;
                case "defaultChecked":
                  N = V;
                  break;
                case "value":
                  m = V;
                  break;
                case "defaultValue":
                  w = V;
                  break;
                case "children":
                case "dangerouslySetInnerHTML":
                  if (V != null) throw Error(s(137, n));
                  break;
                default:
                  Gt(e, n, r, V, a, null);
              }
          }
        _0(e, m, w, _, N, x, d, !1);
        return;
      case "select":
        (wt("invalid", e), (r = x = m = null));
        for (d in a)
          if (a.hasOwnProperty(d) && ((w = a[d]), w != null))
            switch (d) {
              case "value":
                m = w;
                break;
              case "defaultValue":
                x = w;
                break;
              case "multiple":
                r = w;
              default:
                Gt(e, n, d, w, a, null);
            }
        ((n = m),
          (a = x),
          (e.multiple = !!r),
          n != null ? js(e, !!r, n, !1) : a != null && js(e, !!r, a, !0));
        return;
      case "textarea":
        (wt("invalid", e), (m = d = r = null));
        for (x in a)
          if (a.hasOwnProperty(x) && ((w = a[x]), w != null))
            switch (x) {
              case "value":
                r = w;
                break;
              case "defaultValue":
                d = w;
                break;
              case "children":
                m = w;
                break;
              case "dangerouslySetInnerHTML":
                if (w != null) throw Error(s(91));
                break;
              default:
                Gt(e, n, x, w, a, null);
            }
        z0(e, r, d, m);
        return;
      case "option":
        for (_ in a)
          if (a.hasOwnProperty(_) && ((r = a[_]), r != null))
            switch (_) {
              case "selected":
                e.selected = r && typeof r != "function" && typeof r != "symbol";
                break;
              default:
                Gt(e, n, _, r, a, null);
            }
        return;
      case "dialog":
        (wt("beforetoggle", e), wt("toggle", e), wt("cancel", e), wt("close", e));
        break;
      case "iframe":
      case "object":
        wt("load", e);
        break;
      case "video":
      case "audio":
        for (r = 0; r < Lo.length; r++) wt(Lo[r], e);
        break;
      case "image":
        (wt("error", e), wt("load", e));
        break;
      case "details":
        wt("toggle", e);
        break;
      case "embed":
      case "source":
      case "link":
        (wt("error", e), wt("load", e));
      case "area":
      case "base":
      case "br":
      case "col":
      case "hr":
      case "keygen":
      case "meta":
      case "param":
      case "track":
      case "wbr":
      case "menuitem":
        for (N in a)
          if (a.hasOwnProperty(N) && ((r = a[N]), r != null))
            switch (N) {
              case "children":
              case "dangerouslySetInnerHTML":
                throw Error(s(137, n));
              default:
                Gt(e, n, N, r, a, null);
            }
        return;
      default:
        if (Fu(n)) {
          for (V in a)
            a.hasOwnProperty(V) && ((r = a[V]), r !== void 0 && Af(e, n, V, r, a, void 0));
          return;
        }
    }
    for (w in a) a.hasOwnProperty(w) && ((r = a[w]), r != null && Gt(e, n, w, r, a, null));
  }
  function Jx(e, n, a, r) {
    switch (n) {
      case "div":
      case "span":
      case "svg":
      case "path":
      case "a":
      case "g":
      case "p":
      case "li":
        break;
      case "input":
        var d = null,
          m = null,
          x = null,
          w = null,
          _ = null,
          N = null,
          V = null;
        for (k in a) {
          var Y = a[k];
          if (a.hasOwnProperty(k) && Y != null)
            switch (k) {
              case "checked":
                break;
              case "value":
                break;
              case "defaultValue":
                _ = Y;
              default:
                r.hasOwnProperty(k) || Gt(e, n, k, null, r, Y);
            }
        }
        for (var F in r) {
          var k = r[F];
          if (((Y = a[F]), r.hasOwnProperty(F) && (k != null || Y != null)))
            switch (F) {
              case "type":
                m = k;
                break;
              case "name":
                d = k;
                break;
              case "checked":
                N = k;
                break;
              case "defaultChecked":
                V = k;
                break;
              case "value":
                x = k;
                break;
              case "defaultValue":
                w = k;
                break;
              case "children":
              case "dangerouslySetInnerHTML":
                if (k != null) throw Error(s(137, n));
                break;
              default:
                k !== Y && Gt(e, n, F, k, r, Y);
            }
        }
        Nu(e, x, w, _, N, V, m, d);
        return;
      case "select":
        k = x = w = F = null;
        for (m in a)
          if (((_ = a[m]), a.hasOwnProperty(m) && _ != null))
            switch (m) {
              case "value":
                break;
              case "multiple":
                k = _;
              default:
                r.hasOwnProperty(m) || Gt(e, n, m, null, r, _);
            }
        for (d in r)
          if (((m = r[d]), (_ = a[d]), r.hasOwnProperty(d) && (m != null || _ != null)))
            switch (d) {
              case "value":
                F = m;
                break;
              case "defaultValue":
                w = m;
                break;
              case "multiple":
                x = m;
              default:
                m !== _ && Gt(e, n, d, m, r, _);
            }
        ((n = w),
          (a = x),
          (r = k),
          F != null
            ? js(e, !!a, F, !1)
            : !!r != !!a && (n != null ? js(e, !!a, n, !0) : js(e, !!a, a ? [] : "", !1)));
        return;
      case "textarea":
        k = F = null;
        for (w in a)
          if (((d = a[w]), a.hasOwnProperty(w) && d != null && !r.hasOwnProperty(w)))
            switch (w) {
              case "value":
                break;
              case "children":
                break;
              default:
                Gt(e, n, w, null, r, d);
            }
        for (x in r)
          if (((d = r[x]), (m = a[x]), r.hasOwnProperty(x) && (d != null || m != null)))
            switch (x) {
              case "value":
                F = d;
                break;
              case "defaultValue":
                k = d;
                break;
              case "children":
                break;
              case "dangerouslySetInnerHTML":
                if (d != null) throw Error(s(91));
                break;
              default:
                d !== m && Gt(e, n, x, d, r, m);
            }
        T0(e, F, k);
        return;
      case "option":
        for (var et in a)
          if (((F = a[et]), a.hasOwnProperty(et) && F != null && !r.hasOwnProperty(et)))
            switch (et) {
              case "selected":
                e.selected = !1;
                break;
              default:
                Gt(e, n, et, null, r, F);
            }
        for (_ in r)
          if (((F = r[_]), (k = a[_]), r.hasOwnProperty(_) && F !== k && (F != null || k != null)))
            switch (_) {
              case "selected":
                e.selected = F && typeof F != "function" && typeof F != "symbol";
                break;
              default:
                Gt(e, n, _, F, r, k);
            }
        return;
      case "img":
      case "link":
      case "area":
      case "base":
      case "br":
      case "col":
      case "embed":
      case "hr":
      case "keygen":
      case "meta":
      case "param":
      case "source":
      case "track":
      case "wbr":
      case "menuitem":
        for (var ct in a)
          ((F = a[ct]),
            a.hasOwnProperty(ct) && F != null && !r.hasOwnProperty(ct) && Gt(e, n, ct, null, r, F));
        for (N in r)
          if (((F = r[N]), (k = a[N]), r.hasOwnProperty(N) && F !== k && (F != null || k != null)))
            switch (N) {
              case "children":
              case "dangerouslySetInnerHTML":
                if (F != null) throw Error(s(137, n));
                break;
              default:
                Gt(e, n, N, F, r, k);
            }
        return;
      default:
        if (Fu(n)) {
          for (var jt in a)
            ((F = a[jt]),
              a.hasOwnProperty(jt) &&
                F !== void 0 &&
                !r.hasOwnProperty(jt) &&
                Af(e, n, jt, void 0, r, F));
          for (V in r)
            ((F = r[V]),
              (k = a[V]),
              !r.hasOwnProperty(V) ||
                F === k ||
                (F === void 0 && k === void 0) ||
                Af(e, n, V, F, r, k));
          return;
        }
    }
    for (var B in a)
      ((F = a[B]),
        a.hasOwnProperty(B) && F != null && !r.hasOwnProperty(B) && Gt(e, n, B, null, r, F));
    for (Y in r)
      ((F = r[Y]),
        (k = a[Y]),
        !r.hasOwnProperty(Y) || F === k || (F == null && k == null) || Gt(e, n, Y, F, r, k));
  }
  function Cy(e) {
    switch (e) {
      case "css":
      case "script":
      case "font":
      case "img":
      case "image":
      case "input":
      case "link":
        return !0;
      default:
        return !1;
    }
  }
  function Qx() {
    if (typeof performance.getEntriesByType == "function") {
      for (
        var e = 0, n = 0, a = performance.getEntriesByType("resource"), r = 0;
        r < a.length;
        r++
      ) {
        var d = a[r],
          m = d.transferSize,
          x = d.initiatorType,
          w = d.duration;
        if (m && w && Cy(x)) {
          for (x = 0, w = d.responseEnd, r += 1; r < a.length; r++) {
            var _ = a[r],
              N = _.startTime;
            if (N > w) break;
            var V = _.transferSize,
              Y = _.initiatorType;
            V && Cy(Y) && ((_ = _.responseEnd), (x += V * (_ < w ? 1 : (w - N) / (_ - N))));
          }
          if ((--r, (n += (8 * (m + x)) / (d.duration / 1e3)), e++, 10 < e)) break;
        }
      }
      if (0 < e) return n / e / 1e6;
    }
    return navigator.connection && ((e = navigator.connection.downlink), typeof e == "number")
      ? e
      : 5;
  }
  var Mf = null,
    _f = null;
  function kl(e) {
    return e.nodeType === 9 ? e : e.ownerDocument;
  }
  function Oy(e) {
    switch (e) {
      case "http://www.w3.org/2000/svg":
        return 1;
      case "http://www.w3.org/1998/Math/MathML":
        return 2;
      default:
        return 0;
    }
  }
  function By(e, n) {
    if (e === 0)
      switch (n) {
        case "svg":
          return 1;
        case "math":
          return 2;
        default:
          return 0;
      }
    return e === 1 && n === "foreignObject" ? 0 : e;
  }
  function Tf(e, n) {
    return (
      e === "textarea" ||
      e === "noscript" ||
      typeof n.children == "string" ||
      typeof n.children == "number" ||
      typeof n.children == "bigint" ||
      (typeof n.dangerouslySetInnerHTML == "object" &&
        n.dangerouslySetInnerHTML !== null &&
        n.dangerouslySetInnerHTML.__html != null)
    );
  }
  var zf = null;
  function Kx() {
    var e = window.event;
    return e && e.type === "popstate" ? (e === zf ? !1 : ((zf = e), !0)) : ((zf = null), !1);
  }
  var Dy = typeof setTimeout == "function" ? setTimeout : void 0,
    $x = typeof clearTimeout == "function" ? clearTimeout : void 0,
    Ny = typeof Promise == "function" ? Promise : void 0,
    t2 =
      typeof queueMicrotask == "function"
        ? queueMicrotask
        : typeof Ny < "u"
          ? function (e) {
              return Ny.resolve(null).then(e).catch(e2);
            }
          : Dy;
  function e2(e) {
    setTimeout(function () {
      throw e;
    });
  }
  function qn(e) {
    return e === "head";
  }
  function Uy(e, n) {
    var a = n,
      r = 0;
    do {
      var d = a.nextSibling;
      if ((e.removeChild(a), d && d.nodeType === 8))
        if (((a = d.data), a === "/$" || a === "/&")) {
          if (r === 0) {
            (e.removeChild(d), xa(n));
            return;
          }
          r--;
        } else if (a === "$" || a === "$?" || a === "$~" || a === "$!" || a === "&") r++;
        else if (a === "html") Ho(e.ownerDocument.documentElement);
        else if (a === "head") {
          ((a = e.ownerDocument.head), Ho(a));
          for (var m = a.firstChild; m;) {
            var x = m.nextSibling,
              w = m.nodeName;
            (m[io] ||
              w === "SCRIPT" ||
              w === "STYLE" ||
              (w === "LINK" && m.rel.toLowerCase() === "stylesheet") ||
              a.removeChild(m),
              (m = x));
          }
        } else a === "body" && Ho(e.ownerDocument.body);
      a = d;
    } while (a);
    xa(n);
  }
  function Fy(e, n) {
    var a = e;
    e = 0;
    do {
      var r = a.nextSibling;
      if (
        (a.nodeType === 1
          ? n
            ? ((a._stashedDisplay = a.style.display), (a.style.display = "none"))
            : ((a.style.display = a._stashedDisplay || ""),
              a.getAttribute("style") === "" && a.removeAttribute("style"))
          : a.nodeType === 3 &&
            (n
              ? ((a._stashedText = a.nodeValue), (a.nodeValue = ""))
              : (a.nodeValue = a._stashedText || "")),
        r && r.nodeType === 8)
      )
        if (((a = r.data), a === "/$")) {
          if (e === 0) break;
          e--;
        } else (a !== "$" && a !== "$?" && a !== "$~" && a !== "$!") || e++;
      a = r;
    } while (a);
  }
  function Ef(e) {
    var n = e.firstChild;
    for (n && n.nodeType === 10 && (n = n.nextSibling); n;) {
      var a = n;
      switch (((n = n.nextSibling), a.nodeName)) {
        case "HTML":
        case "HEAD":
        case "BODY":
          (Ef(a), Bu(a));
          continue;
        case "SCRIPT":
        case "STYLE":
          continue;
        case "LINK":
          if (a.rel.toLowerCase() === "stylesheet") continue;
      }
      e.removeChild(a);
    }
  }
  function i2(e, n, a, r) {
    for (; e.nodeType === 1;) {
      var d = a;
      if (e.nodeName.toLowerCase() !== n.toLowerCase()) {
        if (!r && (e.nodeName !== "INPUT" || e.type !== "hidden")) break;
      } else if (r) {
        if (!e[io])
          switch (n) {
            case "meta":
              if (!e.hasAttribute("itemprop")) break;
              return e;
            case "link":
              if (
                ((m = e.getAttribute("rel")),
                m === "stylesheet" && e.hasAttribute("data-precedence"))
              )
                break;
              if (
                m !== d.rel ||
                e.getAttribute("href") !== (d.href == null || d.href === "" ? null : d.href) ||
                e.getAttribute("crossorigin") !== (d.crossOrigin == null ? null : d.crossOrigin) ||
                e.getAttribute("title") !== (d.title == null ? null : d.title)
              )
                break;
              return e;
            case "style":
              if (e.hasAttribute("data-precedence")) break;
              return e;
            case "script":
              if (
                ((m = e.getAttribute("src")),
                (m !== (d.src == null ? null : d.src) ||
                  e.getAttribute("type") !== (d.type == null ? null : d.type) ||
                  e.getAttribute("crossorigin") !==
                    (d.crossOrigin == null ? null : d.crossOrigin)) &&
                  m &&
                  e.hasAttribute("async") &&
                  !e.hasAttribute("itemprop"))
              )
                break;
              return e;
            default:
              return e;
          }
      } else if (n === "input" && e.type === "hidden") {
        var m = d.name == null ? null : "" + d.name;
        if (d.type === "hidden" && e.getAttribute("name") === m) return e;
      } else return e;
      if (((e = yi(e.nextSibling)), e === null)) break;
    }
    return null;
  }
  function n2(e, n, a) {
    if (n === "") return null;
    for (; e.nodeType !== 3;)
      if (
        ((e.nodeType !== 1 || e.nodeName !== "INPUT" || e.type !== "hidden") && !a) ||
        ((e = yi(e.nextSibling)), e === null)
      )
        return null;
    return e;
  }
  function Ly(e, n) {
    for (; e.nodeType !== 8;)
      if (
        ((e.nodeType !== 1 || e.nodeName !== "INPUT" || e.type !== "hidden") && !n) ||
        ((e = yi(e.nextSibling)), e === null)
      )
        return null;
    return e;
  }
  function Rf(e) {
    return e.data === "$?" || e.data === "$~";
  }
  function Cf(e) {
    return e.data === "$!" || (e.data === "$?" && e.ownerDocument.readyState !== "loading");
  }
  function s2(e, n) {
    var a = e.ownerDocument;
    if (e.data === "$~") e._reactRetry = n;
    else if (e.data !== "$?" || a.readyState !== "loading") n();
    else {
      var r = function () {
        (n(), a.removeEventListener("DOMContentLoaded", r));
      };
      (a.addEventListener("DOMContentLoaded", r), (e._reactRetry = r));
    }
  }
  function yi(e) {
    for (; e != null; e = e.nextSibling) {
      var n = e.nodeType;
      if (n === 1 || n === 3) break;
      if (n === 8) {
        if (
          ((n = e.data),
          n === "$" ||
            n === "$!" ||
            n === "$?" ||
            n === "$~" ||
            n === "&" ||
            n === "F!" ||
            n === "F")
        )
          break;
        if (n === "/$" || n === "/&") return null;
      }
    }
    return e;
  }
  var Of = null;
  function ky(e) {
    e = e.nextSibling;
    for (var n = 0; e;) {
      if (e.nodeType === 8) {
        var a = e.data;
        if (a === "/$" || a === "/&") {
          if (n === 0) return yi(e.nextSibling);
          n--;
        } else (a !== "$" && a !== "$!" && a !== "$?" && a !== "$~" && a !== "&") || n++;
      }
      e = e.nextSibling;
    }
    return null;
  }
  function Hy(e) {
    e = e.previousSibling;
    for (var n = 0; e;) {
      if (e.nodeType === 8) {
        var a = e.data;
        if (a === "$" || a === "$!" || a === "$?" || a === "$~" || a === "&") {
          if (n === 0) return e;
          n--;
        } else (a !== "/$" && a !== "/&") || n++;
      }
      e = e.previousSibling;
    }
    return null;
  }
  function Vy(e, n, a) {
    switch (((n = kl(a)), e)) {
      case "html":
        if (((e = n.documentElement), !e)) throw Error(s(452));
        return e;
      case "head":
        if (((e = n.head), !e)) throw Error(s(453));
        return e;
      case "body":
        if (((e = n.body), !e)) throw Error(s(454));
        return e;
      default:
        throw Error(s(451));
    }
  }
  function Ho(e) {
    for (var n = e.attributes; n.length;) e.removeAttributeNode(n[0]);
    Bu(e);
  }
  var gi = new Map(),
    Gy = new Set();
  function Hl(e) {
    return typeof e.getRootNode == "function"
      ? e.getRootNode()
      : e.nodeType === 9
        ? e
        : e.ownerDocument;
  }
  var cn = I.d;
  I.d = { f: a2, r: o2, D: r2, C: l2, L: c2, m: u2, X: f2, S: h2, M: d2 };
  function a2() {
    var e = cn.f(),
      n = Cl();
    return e || n;
  }
  function o2(e) {
    var n = Hs(e);
    n !== null && n.tag === 5 && n.type === "form" ? sm(n) : cn.r(e);
  }
  var ga = typeof document > "u" ? null : document;
  function jy(e, n, a) {
    var r = ga;
    if (r && typeof n == "string" && n) {
      var d = ci(n);
      ((d = 'link[rel="' + e + '"][href="' + d + '"]'),
        typeof a == "string" && (d += '[crossorigin="' + a + '"]'),
        Gy.has(d) ||
          (Gy.add(d),
          (e = { rel: e, crossOrigin: a, href: n }),
          r.querySelector(d) === null &&
            ((n = r.createElement("link")), _e(n, "link", e), me(n), r.head.appendChild(n))));
    }
  }
  function r2(e) {
    (cn.D(e), jy("dns-prefetch", e, null));
  }
  function l2(e, n) {
    (cn.C(e, n), jy("preconnect", e, n));
  }
  function c2(e, n, a) {
    cn.L(e, n, a);
    var r = ga;
    if (r && e && n) {
      var d = 'link[rel="preload"][as="' + ci(n) + '"]';
      n === "image" && a && a.imageSrcSet
        ? ((d += '[imagesrcset="' + ci(a.imageSrcSet) + '"]'),
          typeof a.imageSizes == "string" && (d += '[imagesizes="' + ci(a.imageSizes) + '"]'))
        : (d += '[href="' + ci(e) + '"]');
      var m = d;
      switch (n) {
        case "style":
          m = va(e);
          break;
        case "script":
          m = ba(e);
      }
      gi.has(m) ||
        ((e = g(
          { rel: "preload", href: n === "image" && a && a.imageSrcSet ? void 0 : e, as: n },
          a,
        )),
        gi.set(m, e),
        r.querySelector(d) !== null ||
          (n === "style" && r.querySelector(Vo(m))) ||
          (n === "script" && r.querySelector(Go(m))) ||
          ((n = r.createElement("link")), _e(n, "link", e), me(n), r.head.appendChild(n)));
    }
  }
  function u2(e, n) {
    cn.m(e, n);
    var a = ga;
    if (a && e) {
      var r = n && typeof n.as == "string" ? n.as : "script",
        d = 'link[rel="modulepreload"][as="' + ci(r) + '"][href="' + ci(e) + '"]',
        m = d;
      switch (r) {
        case "audioworklet":
        case "paintworklet":
        case "serviceworker":
        case "sharedworker":
        case "worker":
        case "script":
          m = ba(e);
      }
      if (
        !gi.has(m) &&
        ((e = g({ rel: "modulepreload", href: e }, n)), gi.set(m, e), a.querySelector(d) === null)
      ) {
        switch (r) {
          case "audioworklet":
          case "paintworklet":
          case "serviceworker":
          case "sharedworker":
          case "worker":
          case "script":
            if (a.querySelector(Go(m))) return;
        }
        ((r = a.createElement("link")), _e(r, "link", e), me(r), a.head.appendChild(r));
      }
    }
  }
  function h2(e, n, a) {
    cn.S(e, n, a);
    var r = ga;
    if (r && e) {
      var d = Vs(r).hoistableStyles,
        m = va(e);
      n = n || "default";
      var x = d.get(m);
      if (!x) {
        var w = { loading: 0, preload: null };
        if ((x = r.querySelector(Vo(m)))) w.loading = 5;
        else {
          ((e = g({ rel: "stylesheet", href: e, "data-precedence": n }, a)),
            (a = gi.get(m)) && Bf(e, a));
          var _ = (x = r.createElement("link"));
          (me(_),
            _e(_, "link", e),
            (_._p = new Promise(function (N, V) {
              ((_.onload = N), (_.onerror = V));
            })),
            _.addEventListener("load", function () {
              w.loading |= 1;
            }),
            _.addEventListener("error", function () {
              w.loading |= 2;
            }),
            (w.loading |= 4),
            Vl(x, n, r));
        }
        ((x = { type: "stylesheet", instance: x, count: 1, state: w }), d.set(m, x));
      }
    }
  }
  function f2(e, n) {
    cn.X(e, n);
    var a = ga;
    if (a && e) {
      var r = Vs(a).hoistableScripts,
        d = ba(e),
        m = r.get(d);
      m ||
        ((m = a.querySelector(Go(d))),
        m ||
          ((e = g({ src: e, async: !0 }, n)),
          (n = gi.get(d)) && Df(e, n),
          (m = a.createElement("script")),
          me(m),
          _e(m, "link", e),
          a.head.appendChild(m)),
        (m = { type: "script", instance: m, count: 1, state: null }),
        r.set(d, m));
    }
  }
  function d2(e, n) {
    cn.M(e, n);
    var a = ga;
    if (a && e) {
      var r = Vs(a).hoistableScripts,
        d = ba(e),
        m = r.get(d);
      m ||
        ((m = a.querySelector(Go(d))),
        m ||
          ((e = g({ src: e, async: !0, type: "module" }, n)),
          (n = gi.get(d)) && Df(e, n),
          (m = a.createElement("script")),
          me(m),
          _e(m, "link", e),
          a.head.appendChild(m)),
        (m = { type: "script", instance: m, count: 1, state: null }),
        r.set(d, m));
    }
  }
  function Yy(e, n, a, r) {
    var d = (d = Fi.current) ? Hl(d) : null;
    if (!d) throw Error(s(446));
    switch (e) {
      case "meta":
      case "title":
        return null;
      case "style":
        return typeof a.precedence == "string" && typeof a.href == "string"
          ? ((n = va(a.href)),
            (a = Vs(d).hoistableStyles),
            (r = a.get(n)),
            r || ((r = { type: "style", instance: null, count: 0, state: null }), a.set(n, r)),
            r)
          : { type: "void", instance: null, count: 0, state: null };
      case "link":
        if (
          a.rel === "stylesheet" &&
          typeof a.href == "string" &&
          typeof a.precedence == "string"
        ) {
          e = va(a.href);
          var m = Vs(d).hoistableStyles,
            x = m.get(e);
          if (
            (x ||
              ((d = d.ownerDocument || d),
              (x = {
                type: "stylesheet",
                instance: null,
                count: 0,
                state: { loading: 0, preload: null },
              }),
              m.set(e, x),
              (m = d.querySelector(Vo(e))) && !m._p && ((x.instance = m), (x.state.loading = 5)),
              gi.has(e) ||
                ((a = {
                  rel: "preload",
                  as: "style",
                  href: a.href,
                  crossOrigin: a.crossOrigin,
                  integrity: a.integrity,
                  media: a.media,
                  hrefLang: a.hrefLang,
                  referrerPolicy: a.referrerPolicy,
                }),
                gi.set(e, a),
                m || p2(d, e, a, x.state))),
            n && r === null)
          )
            throw Error(s(528, ""));
          return x;
        }
        if (n && r !== null) throw Error(s(529, ""));
        return null;
      case "script":
        return (
          (n = a.async),
          (a = a.src),
          typeof a == "string" && n && typeof n != "function" && typeof n != "symbol"
            ? ((n = ba(a)),
              (a = Vs(d).hoistableScripts),
              (r = a.get(n)),
              r || ((r = { type: "script", instance: null, count: 0, state: null }), a.set(n, r)),
              r)
            : { type: "void", instance: null, count: 0, state: null }
        );
      default:
        throw Error(s(444, e));
    }
  }
  function va(e) {
    return 'href="' + ci(e) + '"';
  }
  function Vo(e) {
    return 'link[rel="stylesheet"][' + e + "]";
  }
  function qy(e) {
    return g({}, e, { "data-precedence": e.precedence, precedence: null });
  }
  function p2(e, n, a, r) {
    e.querySelector('link[rel="preload"][as="style"][' + n + "]")
      ? (r.loading = 1)
      : ((n = e.createElement("link")),
        (r.preload = n),
        n.addEventListener("load", function () {
          return (r.loading |= 1);
        }),
        n.addEventListener("error", function () {
          return (r.loading |= 2);
        }),
        _e(n, "link", a),
        me(n),
        e.head.appendChild(n));
  }
  function ba(e) {
    return '[src="' + ci(e) + '"]';
  }
  function Go(e) {
    return "script[async]" + e;
  }
  function Xy(e, n, a) {
    if ((n.count++, n.instance === null))
      switch (n.type) {
        case "style":
          var r = e.querySelector('style[data-href~="' + ci(a.href) + '"]');
          if (r) return ((n.instance = r), me(r), r);
          var d = g({}, a, {
            "data-href": a.href,
            "data-precedence": a.precedence,
            href: null,
            precedence: null,
          });
          return (
            (r = (e.ownerDocument || e).createElement("style")),
            me(r),
            _e(r, "style", d),
            Vl(r, a.precedence, e),
            (n.instance = r)
          );
        case "stylesheet":
          d = va(a.href);
          var m = e.querySelector(Vo(d));
          if (m) return ((n.state.loading |= 4), (n.instance = m), me(m), m);
          ((r = qy(a)),
            (d = gi.get(d)) && Bf(r, d),
            (m = (e.ownerDocument || e).createElement("link")),
            me(m));
          var x = m;
          return (
            (x._p = new Promise(function (w, _) {
              ((x.onload = w), (x.onerror = _));
            })),
            _e(m, "link", r),
            (n.state.loading |= 4),
            Vl(m, a.precedence, e),
            (n.instance = m)
          );
        case "script":
          return (
            (m = ba(a.src)),
            (d = e.querySelector(Go(m)))
              ? ((n.instance = d), me(d), d)
              : ((r = a),
                (d = gi.get(m)) && ((r = g({}, a)), Df(r, d)),
                (e = e.ownerDocument || e),
                (d = e.createElement("script")),
                me(d),
                _e(d, "link", r),
                e.head.appendChild(d),
                (n.instance = d))
          );
        case "void":
          return null;
        default:
          throw Error(s(443, n.type));
      }
    else
      n.type === "stylesheet" &&
        (n.state.loading & 4) === 0 &&
        ((r = n.instance), (n.state.loading |= 4), Vl(r, a.precedence, e));
    return n.instance;
  }
  function Vl(e, n, a) {
    for (
      var r = a.querySelectorAll('link[rel="stylesheet"][data-precedence],style[data-precedence]'),
        d = r.length ? r[r.length - 1] : null,
        m = d,
        x = 0;
      x < r.length;
      x++
    ) {
      var w = r[x];
      if (w.dataset.precedence === n) m = w;
      else if (m !== d) break;
    }
    m
      ? m.parentNode.insertBefore(e, m.nextSibling)
      : ((n = a.nodeType === 9 ? a.head : a), n.insertBefore(e, n.firstChild));
  }
  function Bf(e, n) {
    (e.crossOrigin == null && (e.crossOrigin = n.crossOrigin),
      e.referrerPolicy == null && (e.referrerPolicy = n.referrerPolicy),
      e.title == null && (e.title = n.title));
  }
  function Df(e, n) {
    (e.crossOrigin == null && (e.crossOrigin = n.crossOrigin),
      e.referrerPolicy == null && (e.referrerPolicy = n.referrerPolicy),
      e.integrity == null && (e.integrity = n.integrity));
  }
  var Gl = null;
  function Iy(e, n, a) {
    if (Gl === null) {
      var r = new Map(),
        d = (Gl = new Map());
      d.set(a, r);
    } else ((d = Gl), (r = d.get(a)), r || ((r = new Map()), d.set(a, r)));
    if (r.has(e)) return r;
    for (r.set(e, null), a = a.getElementsByTagName(e), d = 0; d < a.length; d++) {
      var m = a[d];
      if (
        !(m[io] || m[Se] || (e === "link" && m.getAttribute("rel") === "stylesheet")) &&
        m.namespaceURI !== "http://www.w3.org/2000/svg"
      ) {
        var x = m.getAttribute(n) || "";
        x = e + x;
        var w = r.get(x);
        w ? w.push(m) : r.set(x, [m]);
      }
    }
    return r;
  }
  function Zy(e, n, a) {
    ((e = e.ownerDocument || e),
      e.head.insertBefore(a, n === "title" ? e.querySelector("head > title") : null));
  }
  function m2(e, n, a) {
    if (a === 1 || n.itemProp != null) return !1;
    switch (e) {
      case "meta":
      case "title":
        return !0;
      case "style":
        if (typeof n.precedence != "string" || typeof n.href != "string" || n.href === "") break;
        return !0;
      case "link":
        if (
          typeof n.rel != "string" ||
          typeof n.href != "string" ||
          n.href === "" ||
          n.onLoad ||
          n.onError
        )
          break;
        switch (n.rel) {
          case "stylesheet":
            return ((e = n.disabled), typeof n.precedence == "string" && e == null);
          default:
            return !0;
        }
      case "script":
        if (
          n.async &&
          typeof n.async != "function" &&
          typeof n.async != "symbol" &&
          !n.onLoad &&
          !n.onError &&
          n.src &&
          typeof n.src == "string"
        )
          return !0;
    }
    return !1;
  }
  function Py(e) {
    return !(e.type === "stylesheet" && (e.state.loading & 3) === 0);
  }
  function y2(e, n, a, r) {
    if (
      a.type === "stylesheet" &&
      (typeof r.media != "string" || matchMedia(r.media).matches !== !1) &&
      (a.state.loading & 4) === 0
    ) {
      if (a.instance === null) {
        var d = va(r.href),
          m = n.querySelector(Vo(d));
        if (m) {
          ((n = m._p),
            n !== null &&
              typeof n == "object" &&
              typeof n.then == "function" &&
              (e.count++, (e = jl.bind(e)), n.then(e, e)),
            (a.state.loading |= 4),
            (a.instance = m),
            me(m));
          return;
        }
        ((m = n.ownerDocument || n),
          (r = qy(r)),
          (d = gi.get(d)) && Bf(r, d),
          (m = m.createElement("link")),
          me(m));
        var x = m;
        ((x._p = new Promise(function (w, _) {
          ((x.onload = w), (x.onerror = _));
        })),
          _e(m, "link", r),
          (a.instance = m));
      }
      (e.stylesheets === null && (e.stylesheets = new Map()),
        e.stylesheets.set(a, n),
        (n = a.state.preload) &&
          (a.state.loading & 3) === 0 &&
          (e.count++,
          (a = jl.bind(e)),
          n.addEventListener("load", a),
          n.addEventListener("error", a)));
    }
  }
  var Nf = 0;
  function g2(e, n) {
    return (
      e.stylesheets && e.count === 0 && ql(e, e.stylesheets),
      0 < e.count || 0 < e.imgCount
        ? function (a) {
            var r = setTimeout(function () {
              if ((e.stylesheets && ql(e, e.stylesheets), e.unsuspend)) {
                var m = e.unsuspend;
                ((e.unsuspend = null), m());
              }
            }, 6e4 + n);
            0 < e.imgBytes && Nf === 0 && (Nf = 62500 * Qx());
            var d = setTimeout(
              function () {
                if (
                  ((e.waitingForImages = !1),
                  e.count === 0 && (e.stylesheets && ql(e, e.stylesheets), e.unsuspend))
                ) {
                  var m = e.unsuspend;
                  ((e.unsuspend = null), m());
                }
              },
              (e.imgBytes > Nf ? 50 : 800) + n,
            );
            return (
              (e.unsuspend = a),
              function () {
                ((e.unsuspend = null), clearTimeout(r), clearTimeout(d));
              }
            );
          }
        : null
    );
  }
  function jl() {
    if ((this.count--, this.count === 0 && (this.imgCount === 0 || !this.waitingForImages))) {
      if (this.stylesheets) ql(this, this.stylesheets);
      else if (this.unsuspend) {
        var e = this.unsuspend;
        ((this.unsuspend = null), e());
      }
    }
  }
  var Yl = null;
  function ql(e, n) {
    ((e.stylesheets = null),
      e.unsuspend !== null &&
        (e.count++, (Yl = new Map()), n.forEach(v2, e), (Yl = null), jl.call(e)));
  }
  function v2(e, n) {
    if (!(n.state.loading & 4)) {
      var a = Yl.get(e);
      if (a) var r = a.get(null);
      else {
        ((a = new Map()), Yl.set(e, a));
        for (
          var d = e.querySelectorAll("link[data-precedence],style[data-precedence]"), m = 0;
          m < d.length;
          m++
        ) {
          var x = d[m];
          (x.nodeName === "LINK" || x.getAttribute("media") !== "not all") &&
            (a.set(x.dataset.precedence, x), (r = x));
        }
        r && a.set(null, r);
      }
      ((d = n.instance),
        (x = d.getAttribute("data-precedence")),
        (m = a.get(x) || r),
        m === r && a.set(null, d),
        a.set(x, d),
        this.count++,
        (r = jl.bind(this)),
        d.addEventListener("load", r),
        d.addEventListener("error", r),
        m
          ? m.parentNode.insertBefore(d, m.nextSibling)
          : ((e = e.nodeType === 9 ? e.head : e), e.insertBefore(d, e.firstChild)),
        (n.state.loading |= 4));
    }
  }
  var jo = {
    $$typeof: C,
    Provider: null,
    Consumer: null,
    _currentValue: nt,
    _currentValue2: nt,
    _threadCount: 0,
  };
  function b2(e, n, a, r, d, m, x, w, _) {
    ((this.tag = 1),
      (this.containerInfo = e),
      (this.pingCache = this.current = this.pendingChildren = null),
      (this.timeoutHandle = -1),
      (this.callbackNode =
        this.next =
        this.pendingContext =
        this.context =
        this.cancelPendingCommit =
          null),
      (this.callbackPriority = 0),
      (this.expirationTimes = Eu(-1)),
      (this.entangledLanes =
        this.shellSuspendCounter =
        this.errorRecoveryDisabledLanes =
        this.expiredLanes =
        this.warmLanes =
        this.pingedLanes =
        this.suspendedLanes =
        this.pendingLanes =
          0),
      (this.entanglements = Eu(0)),
      (this.hiddenUpdates = Eu(null)),
      (this.identifierPrefix = r),
      (this.onUncaughtError = d),
      (this.onCaughtError = m),
      (this.onRecoverableError = x),
      (this.pooledCache = null),
      (this.pooledCacheLanes = 0),
      (this.formState = _),
      (this.incompleteTransitions = new Map()));
  }
  function Wy(e, n, a, r, d, m, x, w, _, N, V, Y) {
    return (
      (e = new b2(e, n, a, x, _, N, V, Y, w)),
      (n = 1),
      m === !0 && (n |= 24),
      (m = Je(3, null, null, n)),
      (e.current = m),
      (m.stateNode = e),
      (n = fh()),
      n.refCount++,
      (e.pooledCache = n),
      n.refCount++,
      (m.memoizedState = { element: r, isDehydrated: a, cache: n }),
      yh(m),
      e
    );
  }
  function Jy(e) {
    return e ? ((e = Js), e) : Js;
  }
  function Qy(e, n, a, r, d, m) {
    ((d = Jy(d)),
      r.context === null ? (r.context = d) : (r.pendingContext = d),
      (r = Dn(n)),
      (r.payload = { element: a }),
      (m = m === void 0 ? null : m),
      m !== null && (r.callback = m),
      (a = Nn(e, r, n)),
      a !== null && (qe(a, e, n), xo(a, e, n)));
  }
  function Ky(e, n) {
    if (((e = e.memoizedState), e !== null && e.dehydrated !== null)) {
      var a = e.retryLane;
      e.retryLane = a !== 0 && a < n ? a : n;
    }
  }
  function Uf(e, n) {
    (Ky(e, n), (e = e.alternate) && Ky(e, n));
  }
  function $y(e) {
    if (e.tag === 13 || e.tag === 31) {
      var n = ds(e, 67108864);
      (n !== null && qe(n, e, 67108864), Uf(e, 67108864));
    }
  }
  function tg(e) {
    if (e.tag === 13 || e.tag === 31) {
      var n = ei();
      n = Ru(n);
      var a = ds(e, n);
      (a !== null && qe(a, e, n), Uf(e, n));
    }
  }
  var Xl = !0;
  function x2(e, n, a, r) {
    var d = L.T;
    L.T = null;
    var m = I.p;
    try {
      ((I.p = 2), Ff(e, n, a, r));
    } finally {
      ((I.p = m), (L.T = d));
    }
  }
  function S2(e, n, a, r) {
    var d = L.T;
    L.T = null;
    var m = I.p;
    try {
      ((I.p = 8), Ff(e, n, a, r));
    } finally {
      ((I.p = m), (L.T = d));
    }
  }
  function Ff(e, n, a, r) {
    if (Xl) {
      var d = Lf(r);
      if (d === null) (wf(e, n, r, Il, a), ig(e, r));
      else if (A2(d, e, n, a, r)) r.stopPropagation();
      else if ((ig(e, r), n & 4 && -1 < w2.indexOf(e))) {
        for (; d !== null;) {
          var m = Hs(d);
          if (m !== null)
            switch (m.tag) {
              case 3:
                if (((m = m.stateNode), m.current.memoizedState.isDehydrated)) {
                  var x = ls(m.pendingLanes);
                  if (x !== 0) {
                    var w = m;
                    for (w.pendingLanes |= 2, w.entangledLanes |= 2; x;) {
                      var _ = 1 << (31 - Pe(x));
                      ((w.entanglements[1] |= _), (x &= ~_));
                    }
                    (Vi(m), (Dt & 6) === 0 && ((El = qt() + 500), Fo(0)));
                  }
                }
                break;
              case 31:
              case 13:
                ((w = ds(m, 2)), w !== null && qe(w, m, 2), Cl(), Uf(m, 2));
            }
          if (((m = Lf(r)), m === null && wf(e, n, r, Il, a), m === d)) break;
          d = m;
        }
        d !== null && r.stopPropagation();
      } else wf(e, n, r, null, a);
    }
  }
  function Lf(e) {
    return ((e = ku(e)), kf(e));
  }
  var Il = null;
  function kf(e) {
    if (((Il = null), (e = ks(e)), e !== null)) {
      var n = l(e);
      if (n === null) e = null;
      else {
        var a = n.tag;
        if (a === 13) {
          if (((e = u(n)), e !== null)) return e;
          e = null;
        } else if (a === 31) {
          if (((e = f(n)), e !== null)) return e;
          e = null;
        } else if (a === 3) {
          if (n.stateNode.current.memoizedState.isDehydrated)
            return n.tag === 3 ? n.stateNode.containerInfo : null;
          e = null;
        } else n !== e && (e = null);
      }
    }
    return ((Il = e), null);
  }
  function eg(e) {
    switch (e) {
      case "beforetoggle":
      case "cancel":
      case "click":
      case "close":
      case "contextmenu":
      case "copy":
      case "cut":
      case "auxclick":
      case "dblclick":
      case "dragend":
      case "dragstart":
      case "drop":
      case "focusin":
      case "focusout":
      case "input":
      case "invalid":
      case "keydown":
      case "keypress":
      case "keyup":
      case "mousedown":
      case "mouseup":
      case "paste":
      case "pause":
      case "play":
      case "pointercancel":
      case "pointerdown":
      case "pointerup":
      case "ratechange":
      case "reset":
      case "resize":
      case "seeked":
      case "submit":
      case "toggle":
      case "touchcancel":
      case "touchend":
      case "touchstart":
      case "volumechange":
      case "change":
      case "selectionchange":
      case "textInput":
      case "compositionstart":
      case "compositionend":
      case "compositionupdate":
      case "beforeblur":
      case "afterblur":
      case "beforeinput":
      case "blur":
      case "fullscreenchange":
      case "focus":
      case "hashchange":
      case "popstate":
      case "select":
      case "selectstart":
        return 2;
      case "drag":
      case "dragenter":
      case "dragexit":
      case "dragleave":
      case "dragover":
      case "mousemove":
      case "mouseout":
      case "mouseover":
      case "pointermove":
      case "pointerout":
      case "pointerover":
      case "scroll":
      case "touchmove":
      case "wheel":
      case "mouseenter":
      case "mouseleave":
      case "pointerenter":
      case "pointerleave":
        return 8;
      case "message":
        switch (qi()) {
          case Ce:
            return 2;
          case $a:
            return 8;
          case rs:
          case Dr:
            return 32;
          case Nr:
            return 268435456;
          default:
            return 32;
        }
      default:
        return 32;
    }
  }
  var Hf = !1,
    Xn = null,
    In = null,
    Zn = null,
    Yo = new Map(),
    qo = new Map(),
    Pn = [],
    w2 =
      "mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput copy cut paste click change contextmenu reset".split(
        " ",
      );
  function ig(e, n) {
    switch (e) {
      case "focusin":
      case "focusout":
        Xn = null;
        break;
      case "dragenter":
      case "dragleave":
        In = null;
        break;
      case "mouseover":
      case "mouseout":
        Zn = null;
        break;
      case "pointerover":
      case "pointerout":
        Yo.delete(n.pointerId);
        break;
      case "gotpointercapture":
      case "lostpointercapture":
        qo.delete(n.pointerId);
    }
  }
  function Xo(e, n, a, r, d, m) {
    return e === null || e.nativeEvent !== m
      ? ((e = {
          blockedOn: n,
          domEventName: a,
          eventSystemFlags: r,
          nativeEvent: m,
          targetContainers: [d],
        }),
        n !== null && ((n = Hs(n)), n !== null && $y(n)),
        e)
      : ((e.eventSystemFlags |= r),
        (n = e.targetContainers),
        d !== null && n.indexOf(d) === -1 && n.push(d),
        e);
  }
  function A2(e, n, a, r, d) {
    switch (n) {
      case "focusin":
        return ((Xn = Xo(Xn, e, n, a, r, d)), !0);
      case "dragenter":
        return ((In = Xo(In, e, n, a, r, d)), !0);
      case "mouseover":
        return ((Zn = Xo(Zn, e, n, a, r, d)), !0);
      case "pointerover":
        var m = d.pointerId;
        return (Yo.set(m, Xo(Yo.get(m) || null, e, n, a, r, d)), !0);
      case "gotpointercapture":
        return ((m = d.pointerId), qo.set(m, Xo(qo.get(m) || null, e, n, a, r, d)), !0);
    }
    return !1;
  }
  function ng(e) {
    var n = ks(e.target);
    if (n !== null) {
      var a = l(n);
      if (a !== null) {
        if (((n = a.tag), n === 13)) {
          if (((n = u(a)), n !== null)) {
            ((e.blockedOn = n),
              g0(e.priority, function () {
                tg(a);
              }));
            return;
          }
        } else if (n === 31) {
          if (((n = f(a)), n !== null)) {
            ((e.blockedOn = n),
              g0(e.priority, function () {
                tg(a);
              }));
            return;
          }
        } else if (n === 3 && a.stateNode.current.memoizedState.isDehydrated) {
          e.blockedOn = a.tag === 3 ? a.stateNode.containerInfo : null;
          return;
        }
      }
    }
    e.blockedOn = null;
  }
  function Zl(e) {
    if (e.blockedOn !== null) return !1;
    for (var n = e.targetContainers; 0 < n.length;) {
      var a = Lf(e.nativeEvent);
      if (a === null) {
        a = e.nativeEvent;
        var r = new a.constructor(a.type, a);
        ((Lu = r), a.target.dispatchEvent(r), (Lu = null));
      } else return ((n = Hs(a)), n !== null && $y(n), (e.blockedOn = a), !1);
      n.shift();
    }
    return !0;
  }
  function sg(e, n, a) {
    Zl(e) && a.delete(n);
  }
  function M2() {
    ((Hf = !1),
      Xn !== null && Zl(Xn) && (Xn = null),
      In !== null && Zl(In) && (In = null),
      Zn !== null && Zl(Zn) && (Zn = null),
      Yo.forEach(sg),
      qo.forEach(sg));
  }
  function Pl(e, n) {
    e.blockedOn === n &&
      ((e.blockedOn = null),
      Hf || ((Hf = !0), c.unstable_scheduleCallback(c.unstable_NormalPriority, M2)));
  }
  var Wl = null;
  function ag(e) {
    Wl !== e &&
      ((Wl = e),
      c.unstable_scheduleCallback(c.unstable_NormalPriority, function () {
        Wl === e && (Wl = null);
        for (var n = 0; n < e.length; n += 3) {
          var a = e[n],
            r = e[n + 1],
            d = e[n + 2];
          if (typeof r != "function") {
            if (kf(r || a) === null) continue;
            break;
          }
          var m = Hs(a);
          m !== null &&
            (e.splice(n, 3),
            (n -= 3),
            Fh(m, { pending: !0, data: d, method: a.method, action: r }, r, d));
        }
      }));
  }
  function xa(e) {
    function n(_) {
      return Pl(_, e);
    }
    (Xn !== null && Pl(Xn, e),
      In !== null && Pl(In, e),
      Zn !== null && Pl(Zn, e),
      Yo.forEach(n),
      qo.forEach(n));
    for (var a = 0; a < Pn.length; a++) {
      var r = Pn[a];
      r.blockedOn === e && (r.blockedOn = null);
    }
    for (; 0 < Pn.length && ((a = Pn[0]), a.blockedOn === null);)
      (ng(a), a.blockedOn === null && Pn.shift());
    if (((a = (e.ownerDocument || e).$$reactFormReplay), a != null))
      for (r = 0; r < a.length; r += 3) {
        var d = a[r],
          m = a[r + 1],
          x = d[ke] || null;
        if (typeof m == "function") x || ag(a);
        else if (x) {
          var w = null;
          if (m && m.hasAttribute("formAction")) {
            if (((d = m), (x = m[ke] || null))) w = x.formAction;
            else if (kf(d) !== null) continue;
          } else w = x.action;
          (typeof w == "function" ? (a[r + 1] = w) : (a.splice(r, 3), (r -= 3)), ag(a));
        }
      }
  }
  function og() {
    function e(m) {
      m.canIntercept &&
        m.info === "react-transition" &&
        m.intercept({
          handler: function () {
            return new Promise(function (x) {
              return (d = x);
            });
          },
          focusReset: "manual",
          scroll: "manual",
        });
    }
    function n() {
      (d !== null && (d(), (d = null)), r || setTimeout(a, 20));
    }
    function a() {
      if (!r && !navigation.transition) {
        var m = navigation.currentEntry;
        m &&
          m.url != null &&
          navigation.navigate(m.url, {
            state: m.getState(),
            info: "react-transition",
            history: "replace",
          });
      }
    }
    if (typeof navigation == "object") {
      var r = !1,
        d = null;
      return (
        navigation.addEventListener("navigate", e),
        navigation.addEventListener("navigatesuccess", n),
        navigation.addEventListener("navigateerror", n),
        setTimeout(a, 100),
        function () {
          ((r = !0),
            navigation.removeEventListener("navigate", e),
            navigation.removeEventListener("navigatesuccess", n),
            navigation.removeEventListener("navigateerror", n),
            d !== null && (d(), (d = null)));
        }
      );
    }
  }
  function Vf(e) {
    this._internalRoot = e;
  }
  ((Jl.prototype.render = Vf.prototype.render =
    function (e) {
      var n = this._internalRoot;
      if (n === null) throw Error(s(409));
      var a = n.current,
        r = ei();
      Qy(a, r, e, n, null, null);
    }),
    (Jl.prototype.unmount = Vf.prototype.unmount =
      function () {
        var e = this._internalRoot;
        if (e !== null) {
          this._internalRoot = null;
          var n = e.containerInfo;
          (Qy(e.current, 2, null, e, null, null), Cl(), (n[Ls] = null));
        }
      }));
  function Jl(e) {
    this._internalRoot = e;
  }
  Jl.prototype.unstable_scheduleHydration = function (e) {
    if (e) {
      var n = y0();
      e = { blockedOn: null, target: e, priority: n };
      for (var a = 0; a < Pn.length && n !== 0 && n < Pn[a].priority; a++);
      (Pn.splice(a, 0, e), a === 0 && ng(e));
    }
  };
  var rg = t.version;
  if (rg !== "19.2.5") throw Error(s(527, rg, "19.2.5"));
  I.findDOMNode = function (e) {
    var n = e._reactInternals;
    if (n === void 0)
      throw typeof e.render == "function"
        ? Error(s(188))
        : ((e = Object.keys(e).join(",")), Error(s(268, e)));
    return ((e = p(n)), (e = e !== null ? y(e) : null), (e = e === null ? null : e.stateNode), e);
  };
  var _2 = {
    bundleType: 0,
    version: "19.2.5",
    rendererPackageName: "react-dom",
    currentDispatcherRef: L,
    reconcilerVersion: "19.2.5",
  };
  if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ < "u") {
    var Ql = __REACT_DEVTOOLS_GLOBAL_HOOK__;
    if (!Ql.isDisabled && Ql.supportsFiber)
      try {
        ((Mn = Ql.inject(_2)), (Ze = Ql));
      } catch {}
  }
  return (
    (Zo.createRoot = function (e, n) {
      if (!o(e)) throw Error(s(299));
      var a = !1,
        r = "",
        d = pm,
        m = mm,
        x = ym;
      return (
        n != null &&
          (n.unstable_strictMode === !0 && (a = !0),
          n.identifierPrefix !== void 0 && (r = n.identifierPrefix),
          n.onUncaughtError !== void 0 && (d = n.onUncaughtError),
          n.onCaughtError !== void 0 && (m = n.onCaughtError),
          n.onRecoverableError !== void 0 && (x = n.onRecoverableError)),
        (n = Wy(e, 1, !1, null, null, a, r, null, d, m, x, og)),
        (e[Ls] = n.current),
        Sf(e),
        new Vf(n)
      );
    }),
    (Zo.hydrateRoot = function (e, n, a) {
      if (!o(e)) throw Error(s(299));
      var r = !1,
        d = "",
        m = pm,
        x = mm,
        w = ym,
        _ = null;
      return (
        a != null &&
          (a.unstable_strictMode === !0 && (r = !0),
          a.identifierPrefix !== void 0 && (d = a.identifierPrefix),
          a.onUncaughtError !== void 0 && (m = a.onUncaughtError),
          a.onCaughtError !== void 0 && (x = a.onCaughtError),
          a.onRecoverableError !== void 0 && (w = a.onRecoverableError),
          a.formState !== void 0 && (_ = a.formState)),
        (n = Wy(e, 1, !0, n, a ?? null, r, d, _, m, x, w, og)),
        (n.context = Jy(null)),
        (a = n.current),
        (r = ei()),
        (r = Ru(r)),
        (d = Dn(r)),
        (d.callback = null),
        Nn(a, d, r),
        (a = r),
        (n.current.lanes = a),
        eo(n, a),
        Vi(n),
        (e[Ls] = n.current),
        Sf(e),
        new Jl(n)
      );
    }),
    (Zo.version = "19.2.5"),
    Zo
  );
}
var yg;
function k2() {
  if (yg) return jf.exports;
  yg = 1;
  function c() {
    if (!(
      typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ > "u" ||
      typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE != "function"
    ))
      try {
        __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(c);
      } catch (t) {
        console.error(t);
      }
  }
  return (c(), (jf.exports = L2()), jf.exports);
}
var H2 = k2();
const Rr = {
    DESKTOP: 100,
    WINDOW: 1e3,
    EXCLUSIVE: 5e3,
    ALWAYS_ON_TOP: 8e3,
    TOPBAR: 9e3,
    DOCK: 9500,
    EDIT_MENU: 99997,
    SCAN_OVERLAY: 99998,
    DOCK_TOOLTIP: 99999,
    CONNECTION_OVERLAY: 1e5,
    CUTSCENE: 100001,
    BROWSER_WARNING: 100002,
    VIEWPORT_GUARD: 100003,
    GRAPHICS_RECOVERY: 100004,
    MOBILE_GUARD: 100005,
    PAT_CURSOR_SHIELD: 100006,
  },
  gg = { WIDTH: 1024, HEIGHT: 512 },
  sz = {
    CASCADE_OFFSET: { x: 40, y: 30 },
    INITIAL_POSITION: { x: 100, y: 80 },
    CASCADE_WRAP: 5,
    MIN_WIDTH: 280,
    MIN_HEIGHT: 180,
    SNAP_EDGE_PX: 12,
    SNAP_CORNER_PX: 60,
  },
  az = { EXCLUSIVE_MS: 300 },
  oz = {
    WINDOW_DURATION: 0.2,
    MAXIMIZE_DURATION: 0.25,
    EXCLUSIVE_DURATION: 0.35,
    EASE: [0.23, 1, 0.32, 1],
    GENIE_APPEAR_DURATION: 0.34,
    GENIE_APPEAR_EASE: [0.34, 1.5, 0.64, 1],
    GENIE_MINIMIZE_DURATION: 0.36,
    GENIE_MINIMIZE_EASE: [0.4, 0, 0.7, 0.15],
    CLOSE_DURATION: 0.18,
    CLOSE_EASE: [0.4, 0, 0.7, 0.2],
    REDUCED_DURATION: 0.12,
    RECEDE_DURATION: 0.45,
    RECEDE_EASE: [0.4, 0, 0.7, 0.2],
    SHELL_RETURN_DELAY: 0.5,
    SHELL_RETURN_STAGGER: 0.05,
    SHELL_RETURN_STAGGER_MAX: 6,
  },
  rz = { BOTTOM_OFFSET: 8 },
  lz = { HEIGHT: 32 };
function cz() {
  if (typeof window > "u") return 80;
  const c = Math.min(window.innerWidth, window.innerHeight);
  if (!Number.isFinite(c)) return 80;
  let t;
  c < 480
    ? (t = Math.max(40, c * 0.08))
    : c < 768
      ? (t = Math.max(48, c * 0.07))
      : c < 1024
        ? (t = Math.max(56, c * 0.06))
        : (t = Math.max(64, Math.min(80, c * 0.05)));
  const i = Math.max(4, t * 0.08);
  return t + i * 2;
}
function uz() {
  return typeof window > "u"
    ? { x: 960, y: 1020 }
    : !Number.isFinite(window.innerWidth) || !Number.isFinite(window.innerHeight)
      ? { x: 960, y: 1020 }
      : { x: window.innerWidth / 2, y: window.innerHeight - 60 };
}
const V2 = "rgba(22, 26, 34, 0.88)",
  G2 = "rgba(158, 210, 210, 0.10)",
  j2 = "0 8px 32px rgba(0, 0, 0, 0.35)",
  vg = "rgba(40, 46, 58, 0.92)",
  Y2 = "rgba(158, 210, 210, 0.14)",
  q2 = "rgba(58, 66, 80, 0.95)";
function mu() {
  return J.jsx("style", {
    children: `
      .sys-veil {
        background:
          radial-gradient(120% 85% at 50% -12%, oklch(0.78 0.08 210 / 0.07), transparent 62%),
          radial-gradient(110% 80% at 50% 118%, oklch(0.45 0.05 245 / 0.10), transparent 58%),
          var(--background);
      }
      .sys-veil::after {
        content: '';
        position: absolute;
        inset: 0;
        background: radial-gradient(100% 100% at 50% 50%, transparent 58%, rgba(0, 0, 0, 0.38));
        pointer-events: none;
      }
      .sys-halo {
        background: radial-gradient(closest-side, var(--primary), transparent 72%);
        animation: sys-halo-breathe 5.5s ease-in-out infinite;
      }
      .sys-skim {
        background: linear-gradient(to right, transparent 0%, rgba(255,255,255,0.12) 30%, rgba(255,255,255,0.12) 70%, transparent 100%);
      }
      .sys-status {
        animation: sys-status-pulse 2.8s ease-in-out infinite;
      }
      .sys-spinner {
        border: 2px solid rgba(158, 210, 210, 0.14);
        border-top-color: var(--primary);
        animation: sys-spin 0.9s linear infinite;
      }
      .sys-progress-fill {
        background: var(--primary);
        box-shadow: 0 0 10px oklch(0.78 0.08 210 / 0.45);
        transition: width 200ms ease-out;
      }
      @keyframes sys-halo-breathe {
        0%, 100% { opacity: 0.18; transform: scale(0.94); }
        50% { opacity: 0.42; transform: scale(1.05); }
      }
      @keyframes sys-status-pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.55; }
      }
      @keyframes sys-spin { to { transform: rotate(360deg); } }
      @media (prefers-reduced-motion: reduce) {
        .sys-halo { animation: none; opacity: 0.25; }
        .sys-status { animation: none; }
      }
    `,
  });
}
function Cr({ children: c, zIndex: t }) {
  return J.jsxs("div", {
    className: "sys-veil fixed inset-0 flex items-center justify-center",
    style: t != null ? { zIndex: t } : void 0,
    children: [
      J.jsx(mu, {}),
      J.jsx("div", {
        className: "relative flex flex-col items-center gap-6 max-w-md px-6 text-center",
        children: c,
      }),
    ],
  });
}
function hz({ size: c = 64, dim: t = !1 }) {
  return J.jsxs("div", {
    className: "relative select-none",
    style: { width: c, height: c },
    children: [
      J.jsx(mu, {}),
      J.jsx("div", {
        "aria-hidden": !0,
        className: t
          ? "absolute -inset-4 rounded-full blur-xl opacity-15"
          : "sys-halo absolute -inset-4 rounded-full blur-xl",
        style: t
          ? { background: "radial-gradient(closest-side, var(--primary), transparent 72%)" }
          : void 0,
      }),
      J.jsx("img", {
        src: "/icon.png",
        alt: "",
        draggable: !1,
        className: "relative invert dark:invert-0",
        style: { width: c, height: c },
      }),
    ],
  });
}
function X2({ size: c = 16 }) {
  return J.jsxs(J.Fragment, {
    children: [
      J.jsx(mu, {}),
      J.jsx("div", {
        className: "sys-spinner rounded-full shrink-0",
        style: { width: c, height: c },
      }),
    ],
  });
}
function fz({ children: c }) {
  return J.jsx("span", {
    className: "sys-status text-sm font-medium",
    style: { color: "var(--muted-foreground)" },
    children: c,
  });
}
function qa({ children: c }) {
  return J.jsx("h2", {
    className: "text-base font-semibold tracking-tight",
    style: { color: "var(--foreground)" },
    children: c,
  });
}
function Xa({ children: c }) {
  return J.jsx("p", {
    className: "text-sm leading-relaxed text-balance",
    style: { color: "var(--muted-foreground)" },
    children: c,
  });
}
function y1({ onClick: c, children: t }) {
  return J.jsx("button", {
    onClick: c,
    className: "px-4 py-2 rounded-md text-sm font-medium transition-colors",
    style: { background: vg, border: `1px solid ${Y2}`, color: "rgba(220, 232, 232, 0.9)" },
    onMouseEnter: (i) => {
      i.currentTarget.style.background = q2;
    },
    onMouseLeave: (i) => {
      i.currentTarget.style.background = vg;
    },
    children: t,
  });
}
function Cd({ onClick: c, children: t }) {
  return J.jsx("button", {
    onClick: c,
    className: "px-3 py-2 text-sm transition-colors",
    style: { color: "var(--muted-foreground)" },
    onMouseEnter: (i) => {
      i.currentTarget.style.color = "rgba(220, 232, 232, 0.9)";
    },
    onMouseLeave: (i) => {
      i.currentTarget.style.color = "var(--muted-foreground)";
    },
    children: t,
  });
}
function dz({ children: c, className: t }) {
  return J.jsxs("div", {
    className: `relative overflow-hidden rounded-xl ${t ?? ""}`,
    style: {
      background: V2,
      border: `1px solid ${G2}`,
      boxShadow: j2,
      backdropFilter: "blur(20px) saturate(150%)",
      WebkitBackdropFilter: "blur(20px) saturate(150%)",
    },
    children: [
      J.jsx(mu, {}),
      J.jsx("div", { "aria-hidden": !0, className: "sys-skim absolute inset-x-0 top-0 h-px" }),
      c,
    ],
  });
}
const I2 = `(min-width: ${gg.WIDTH}px) and (min-height: ${gg.HEIGHT}px)`,
  Od = typeof window < "u" ? window.matchMedia(I2) : null;
function Z2(c) {
  return (Od?.addEventListener("change", c), () => Od?.removeEventListener("change", c));
}
function P2() {
  return Od?.matches ?? !0;
}
function W2() {
  return Si.useSyncExternalStore(Z2, P2) ? null : J.jsx(J2, {});
}
function J2() {
  const { t: c } = Er();
  return J.jsx(Cr, {
    zIndex: Rr.VIEWPORT_GUARD,
    children: J.jsxs("div", {
      className: "flex flex-col gap-1.5",
      children: [
        J.jsx(qa, { children: c("viewport.tooSmall") }),
        J.jsx(Xa, { children: c("viewport.resizeHint") }),
      ],
    }),
  });
}
function Q2() {
  const c = navigator.userAgentData;
  return c
    ? c.brands.some((t) => t.brand === "Chromium" || t.brand === "Google Chrome")
    : /Chrome\//.test(navigator.userAgent);
}
const K2 = [
  /QQBrowser/i,
  /\bMetaSr\b/,
  /2345Explorer/i,
  /LBBROWSER/i,
  /Maxthon/i,
  /BIDUBrowser|baidubrowser/i,
  /UCBrowser|\bUBrowser\b/i,
  /TheWorld/i,
  /QIHU 360(SE|EE)/,
];
function $l(c) {
  const { mimeTypes: t } = navigator;
  for (let i = 0; i < t.length; i++) if (t[i]?.type === c) return !0;
  return !1;
}
function $2() {
  return (
    $l("application/360softmgrplugin") ||
    $l("application/x360mmplugin") ||
    $l("application/mozilla-npqihooquicklogin") ||
    $l("application/vnd.chromium.remoting-viewer")
  );
}
function tS() {
  const c = window.chrome;
  return c != null && ("adblock2345" in c || "common2345" in c);
}
function eS() {
  return !Q2() || $2() || tS() ? !0 : K2.some((c) => c.test(navigator.userAgent));
}
const g1 = "browser-warning-dismissed:v2";
function iS() {
  try {
    return localStorage.getItem(g1) === "1";
  } catch {
    return !1;
  }
}
function nS() {
  const [c, t] = Si.useState(() => eS() && !iS());
  if (!c) return null;
  const i = () => {
    try {
      localStorage.setItem(g1, "1");
    } catch {}
    t(!1);
  };
  return J.jsx(sS, { onDismiss: i });
}
function sS({ onDismiss: c }) {
  const { t } = Er(),
    [i, s] = Si.useState(!1);
  return J.jsx(Cr, {
    zIndex: Rr.BROWSER_WARNING,
    children: i
      ? J.jsxs(J.Fragment, {
          children: [
            J.jsxs("div", {
              className: "flex flex-col gap-1.5",
              children: [
                J.jsx(qa, { children: t("browserWarning.confirmTitle") }),
                J.jsx(Xa, { children: t("browserWarning.confirmBody") }),
              ],
            }),
            J.jsxs("div", {
              className: "flex items-center gap-2",
              children: [
                J.jsx(y1, { onClick: () => s(!1), children: t("browserWarning.goBack") }),
                J.jsx(Cd, { onClick: c, children: t("browserWarning.confirmContinue") }),
              ],
            }),
          ],
        })
      : J.jsxs(J.Fragment, {
          children: [
            J.jsxs("div", {
              className: "flex flex-col gap-1.5",
              children: [
                J.jsx(qa, { children: t("browserWarning.title") }),
                J.jsx(Xa, { children: t("browserWarning.body") }),
              ],
            }),
            J.jsx(Cd, { onClick: () => s(!0), children: t("browserWarning.continueAnyway") }),
          ],
        }),
  });
}
const v1 = /swiftshader|llvmpipe|software|basic render/;
function aS(c) {
  const t = c.toLowerCase();
  return t === ""
    ? "high"
    : v1.test(t) || /\bmali\b|adreno|videocore|powervr/.test(t)
      ? "low"
      : /intel/.test(t)
        ? /\barc\b/.test(t)
          ? "mid"
          : "low"
        : /radeon\(tm\) graphics|amd.*vega \d/.test(t)
          ? "mid"
          : (/apple/.test(t) || /nvidia|geforce|rtx|gtx|quadro|radeon|amd/.test(t), "high");
}
let tc = null;
function oS() {
  if (tc) return tc;
  let c = "";
  try {
    const t = document.createElement("canvas"),
      i = t.getContext("webgl2") ?? t.getContext("webgl");
    if (i) {
      const s = i.getExtension("WEBGL_debug_renderer_info"),
        o = s ? s.UNMASKED_RENDERER_WEBGL : i.RENDERER;
      ((c = String(i.getParameter(o) ?? "")), i.getExtension("WEBGL_lose_context")?.loseContext());
    }
  } catch {}
  return ((tc = { renderer: c, tier: aS(c), software: v1.test(c.toLowerCase()) }), tc);
}
const b1 = "software-renderer-warning-dismissed:v1";
function rS() {
  try {
    return localStorage.getItem(b1) === "1";
  } catch {
    return !1;
  }
}
function lS() {
  const [c, t] = Si.useState(() => oS().software && !rS());
  if (!c) return null;
  const i = () => {
    try {
      localStorage.setItem(b1, "1");
    } catch {}
    t(!1);
  };
  return J.jsx(cS, { onDismiss: i });
}
function cS({ onDismiss: c }) {
  const { t } = Er();
  return J.jsxs(Cr, {
    zIndex: Rr.BROWSER_WARNING,
    children: [
      J.jsxs("div", {
        className: "flex flex-col gap-1.5",
        children: [
          J.jsx(qa, { children: t("softwareRendererWarning.title") }),
          J.jsx(Xa, { children: t("softwareRendererWarning.body") }),
        ],
      }),
      J.jsx(Cd, { onClick: c, children: t("softwareRendererWarning.continueAnyway") }),
    ],
  });
}
function uS() {
  if (navigator.userAgentData?.mobile) return !0;
  const t = navigator.userAgent;
  return /Android|iPhone|iPad|iPod|Mobile|Tablet|Silk/i.test(t)
    ? !0
    : /Macintosh/.test(t) && navigator.maxTouchPoints > 1;
}
function hS() {
  return uS() ? J.jsx(fS, {}) : null;
}
function fS() {
  const { t: c } = Er();
  return J.jsx(Cr, {
    zIndex: Rr.MOBILE_GUARD,
    children: J.jsxs("div", {
      className: "flex flex-col gap-1.5",
      children: [
        J.jsx(qa, { children: c("mobile.desktopOnly") }),
        J.jsx(Xa, { children: c("mobile.desktopHint") }),
      ],
    }),
  });
}
const bg = (c) => {
    let t;
    const i = new Set(),
      s = (p, y) => {
        const g = typeof p == "function" ? p(t) : p;
        if (!Object.is(g, t)) {
          const v = t;
          ((t = (y ?? (typeof g != "object" || g === null)) ? g : Object.assign({}, t, g)),
            i.forEach((b) => b(t, v)));
        }
      },
      o = () => t,
      f = {
        setState: s,
        getState: o,
        getInitialState: () => h,
        subscribe: (p) => (i.add(p), () => i.delete(p)),
      },
      h = (t = c(s, o, f));
    return f;
  },
  dS = (c) => (c ? bg(c) : bg),
  pS = (c) => c;
function mS(c, t = pS) {
  const i = Kl.useSyncExternalStore(
    c.subscribe,
    Kl.useCallback(() => t(c.getState()), [c, t]),
    Kl.useCallback(() => t(c.getInitialState()), [c, t]),
  );
  return (Kl.useDebugValue(i), i);
}
const xg = (c) => {
    const t = dS(c),
      i = (s) => mS(t, s);
    return (Object.assign(i, t), i);
  },
  x1 = (c) => (c ? xg(c) : xg),
  yS = !1,
  tu = {
    debug: (...c) => yS,
    info: (...c) => console.info(...c),
    warn: (...c) => console.warn(...c),
    error: (...c) => console.error(...c),
  },
  gS = 1e4,
  vS = 1500,
  Bd = "graphics-watchdog-reloaded:v1",
  bS = 6e4,
  dr = x1(() => ({ phase: "ok" }));
function xS() {
  try {
    return sessionStorage.getItem(Bd) === "1";
  } catch {
    return !1;
  }
}
function S1(c) {
  try {
    c ? sessionStorage.setItem(Bd, "1") : sessionStorage.removeItem(Bd);
  } catch {}
}
function SS() {
  if (dr.getState().phase === "ok") {
    if (xS()) {
      (tu.error("[GraphicsWatchdog] Context loss after an auto-reload; showing manual recovery"),
        dr.setState({ phase: "stuck" }));
      return;
    }
    (tu.error("[GraphicsWatchdog] WebGL context not restored; reloading page"),
      S1(!0),
      dr.setState({ phase: "reloading" }),
      window.setTimeout(() => window.location.reload(), vS));
  }
}
let Sg = !1;
function wS() {
  if (Sg || typeof window > "u") return;
  Sg = !0;
  const c = new Map();
  (window.addEventListener(
    "webglcontextlost",
    (t) => {
      const i = t.target;
      if (!(i instanceof HTMLCanvasElement) || !i.closest("#root") || c.has(i)) return;
      tu.warn("[GraphicsWatchdog] WebGL context lost", i);
      const s = window.setTimeout(() => {
        (c.delete(i), i.isConnected && SS());
      }, gS);
      c.set(i, s);
    },
    !0,
  ),
    window.addEventListener(
      "webglcontextrestored",
      (t) => {
        const i = t.target;
        if (!i) return;
        const s = c.get(i);
        s !== void 0 &&
          (window.clearTimeout(s),
          c.delete(i),
          tu.info("[GraphicsWatchdog] WebGL context restored"));
      },
      !0,
    ),
    window.setTimeout(() => {
      dr.getState().phase === "ok" && S1(!1);
    }, bS));
}
function AS() {
  const c = dr((t) => t.phase);
  return c === "ok" ? null : J.jsx(MS, { phase: c, onReload: () => window.location.reload() });
}
function MS({ phase: c, onReload: t }) {
  const { t: i } = Er();
  return J.jsxs(Cr, {
    zIndex: Rr.GRAPHICS_RECOVERY,
    children: [
      J.jsxs("div", {
        className: "flex flex-col gap-1.5",
        children: [
          J.jsx(qa, { children: i("graphicsRecovery.title") }),
          J.jsx(Xa, {
            children: i(
              c === "reloading" ? "graphicsRecovery.reloading" : "graphicsRecovery.stuck",
            ),
          }),
        ],
      }),
      c === "reloading"
        ? J.jsx(X2, {})
        : J.jsx(y1, { onClick: t, children: i("graphicsRecovery.reload") }),
    ],
  });
}
const w1 = "180",
  pz = 0,
  mz = 1,
  yz = 2,
  gz = 1,
  vz = 2,
  bz = 3,
  Dd = 0,
  A1 = 1,
  Ne = 2,
  _S = 0,
  wi = 1,
  Rt = 2,
  xz = 3,
  Sz = 4,
  wz = 5,
  wg = 100,
  Az = 101,
  Mz = 102,
  _z = 103,
  Tz = 104,
  zz = 200,
  Ez = 201,
  Rz = 202,
  Cz = 203,
  Ag = 204,
  Mg = 205,
  Oz = 206,
  Bz = 207,
  Dz = 208,
  Nz = 209,
  Uz = 210,
  Fz = 211,
  Lz = 212,
  kz = 213,
  Hz = 214,
  Vz = 0,
  Gz = 1,
  jz = 2,
  _g = 3,
  Yz = 4,
  qz = 5,
  Xz = 6,
  Iz = 7,
  TS = 0,
  Zz = 1,
  Pz = 2,
  Wz = 0,
  Jz = 1,
  Qz = 2,
  Kz = 3,
  $z = 4,
  t4 = 5,
  e4 = 6,
  i4 = 7,
  Tg = "attached",
  zS = "detached",
  M1 = 300,
  ES = 301,
  n4 = 302,
  s4 = 303,
  a4 = 304,
  o4 = 306,
  zg = 1e3,
  Va = 1001,
  Eg = 1002,
  ns = 1003,
  r4 = 1004,
  l4 = 1005,
  eu = 1006,
  c4 = 1007,
  _1 = 1008,
  Jd = 1009,
  RS = 1010,
  CS = 1011,
  OS = 1012,
  BS = 1013,
  T1 = 1014,
  yu = 1015,
  DS = 1016,
  NS = 1017,
  US = 1018,
  u4 = 1020,
  FS = 35902,
  LS = 35899,
  kS = 1021,
  HS = 1022,
  Qd = 1023,
  Rg = 1026,
  VS = 1027,
  z1 = 1028,
  GS = 1029,
  jS = 1030,
  YS = 1031,
  qS = 1033,
  XS = 33776,
  IS = 33777,
  ZS = 33778,
  PS = 33779,
  WS = 35840,
  JS = 35841,
  QS = 35842,
  KS = 35843,
  $S = 36196,
  t3 = 37492,
  e3 = 37496,
  i3 = 37808,
  n3 = 37809,
  s3 = 37810,
  a3 = 37811,
  o3 = 37812,
  r3 = 37813,
  l3 = 37814,
  c3 = 37815,
  u3 = 37816,
  h3 = 37817,
  f3 = 37818,
  d3 = 37819,
  p3 = 37820,
  m3 = 37821,
  y3 = 36492,
  g3 = 36494,
  v3 = 36495,
  b3 = 36283,
  x3 = 36284,
  S3 = 36285,
  w3 = 36286,
  iu = 2300,
  Nd = 2301,
  If = 2302,
  Cg = 2400,
  Og = 2401,
  Bg = 2402,
  A3 = 2500,
  h4 = 0,
  f4 = 1,
  d4 = 2,
  M3 = 3200,
  p4 = 3201,
  _3 = 0,
  m4 = 1,
  E1 = "",
  Bi = "srgb",
  Dg = "srgb-linear",
  Ng = "linear",
  Zf = "srgb",
  Sa = 7680,
  Ug = 519,
  y4 = 512,
  g4 = 513,
  v4 = 514,
  b4 = 515,
  x4 = 516,
  S4 = 517,
  w4 = 518,
  A4 = 519,
  Ud = 35044,
  oi = 35048,
  M4 = "300 es",
  is = 2e3,
  nu = 2001;
class Or {
  addEventListener(t, i) {
    this._listeners === void 0 && (this._listeners = {});
    const s = this._listeners;
    (s[t] === void 0 && (s[t] = []), s[t].indexOf(i) === -1 && s[t].push(i));
  }
  hasEventListener(t, i) {
    const s = this._listeners;
    return s === void 0 ? !1 : s[t] !== void 0 && s[t].indexOf(i) !== -1;
  }
  removeEventListener(t, i) {
    const s = this._listeners;
    if (s === void 0) return;
    const o = s[t];
    if (o !== void 0) {
      const l = o.indexOf(i);
      l !== -1 && o.splice(l, 1);
    }
  }
  dispatchEvent(t) {
    const i = this._listeners;
    if (i === void 0) return;
    const s = i[t.type];
    if (s !== void 0) {
      t.target = this;
      const o = s.slice(0);
      for (let l = 0, u = o.length; l < u; l++) o[l].call(this, t);
      t.target = null;
    }
  }
}
const Be = [
  "00",
  "01",
  "02",
  "03",
  "04",
  "05",
  "06",
  "07",
  "08",
  "09",
  "0a",
  "0b",
  "0c",
  "0d",
  "0e",
  "0f",
  "10",
  "11",
  "12",
  "13",
  "14",
  "15",
  "16",
  "17",
  "18",
  "19",
  "1a",
  "1b",
  "1c",
  "1d",
  "1e",
  "1f",
  "20",
  "21",
  "22",
  "23",
  "24",
  "25",
  "26",
  "27",
  "28",
  "29",
  "2a",
  "2b",
  "2c",
  "2d",
  "2e",
  "2f",
  "30",
  "31",
  "32",
  "33",
  "34",
  "35",
  "36",
  "37",
  "38",
  "39",
  "3a",
  "3b",
  "3c",
  "3d",
  "3e",
  "3f",
  "40",
  "41",
  "42",
  "43",
  "44",
  "45",
  "46",
  "47",
  "48",
  "49",
  "4a",
  "4b",
  "4c",
  "4d",
  "4e",
  "4f",
  "50",
  "51",
  "52",
  "53",
  "54",
  "55",
  "56",
  "57",
  "58",
  "59",
  "5a",
  "5b",
  "5c",
  "5d",
  "5e",
  "5f",
  "60",
  "61",
  "62",
  "63",
  "64",
  "65",
  "66",
  "67",
  "68",
  "69",
  "6a",
  "6b",
  "6c",
  "6d",
  "6e",
  "6f",
  "70",
  "71",
  "72",
  "73",
  "74",
  "75",
  "76",
  "77",
  "78",
  "79",
  "7a",
  "7b",
  "7c",
  "7d",
  "7e",
  "7f",
  "80",
  "81",
  "82",
  "83",
  "84",
  "85",
  "86",
  "87",
  "88",
  "89",
  "8a",
  "8b",
  "8c",
  "8d",
  "8e",
  "8f",
  "90",
  "91",
  "92",
  "93",
  "94",
  "95",
  "96",
  "97",
  "98",
  "99",
  "9a",
  "9b",
  "9c",
  "9d",
  "9e",
  "9f",
  "a0",
  "a1",
  "a2",
  "a3",
  "a4",
  "a5",
  "a6",
  "a7",
  "a8",
  "a9",
  "aa",
  "ab",
  "ac",
  "ad",
  "ae",
  "af",
  "b0",
  "b1",
  "b2",
  "b3",
  "b4",
  "b5",
  "b6",
  "b7",
  "b8",
  "b9",
  "ba",
  "bb",
  "bc",
  "bd",
  "be",
  "bf",
  "c0",
  "c1",
  "c2",
  "c3",
  "c4",
  "c5",
  "c6",
  "c7",
  "c8",
  "c9",
  "ca",
  "cb",
  "cc",
  "cd",
  "ce",
  "cf",
  "d0",
  "d1",
  "d2",
  "d3",
  "d4",
  "d5",
  "d6",
  "d7",
  "d8",
  "d9",
  "da",
  "db",
  "dc",
  "dd",
  "de",
  "df",
  "e0",
  "e1",
  "e2",
  "e3",
  "e4",
  "e5",
  "e6",
  "e7",
  "e8",
  "e9",
  "ea",
  "eb",
  "ec",
  "ed",
  "ee",
  "ef",
  "f0",
  "f1",
  "f2",
  "f3",
  "f4",
  "f5",
  "f6",
  "f7",
  "f8",
  "f9",
  "fa",
  "fb",
  "fc",
  "fd",
  "fe",
  "ff",
];
let Fg = 1234567;
const pr = Math.PI / 180,
  vr = 180 / Math.PI;
function Ai() {
  const c = (Math.random() * 4294967295) | 0,
    t = (Math.random() * 4294967295) | 0,
    i = (Math.random() * 4294967295) | 0,
    s = (Math.random() * 4294967295) | 0;
  return (
    Be[c & 255] +
    Be[(c >> 8) & 255] +
    Be[(c >> 16) & 255] +
    Be[(c >> 24) & 255] +
    "-" +
    Be[t & 255] +
    Be[(t >> 8) & 255] +
    "-" +
    Be[((t >> 16) & 15) | 64] +
    Be[(t >> 24) & 255] +
    "-" +
    Be[(i & 63) | 128] +
    Be[(i >> 8) & 255] +
    "-" +
    Be[(i >> 16) & 255] +
    Be[(i >> 24) & 255] +
    Be[s & 255] +
    Be[(s >> 8) & 255] +
    Be[(s >> 16) & 255] +
    Be[(s >> 24) & 255]
  ).toLowerCase();
}
function bt(c, t, i) {
  return Math.max(t, Math.min(i, c));
}
function Kd(c, t) {
  return ((c % t) + t) % t;
}
function T3(c, t, i, s, o) {
  return s + ((c - t) * (o - s)) / (i - t);
}
function z3(c, t, i) {
  return c !== t ? (i - c) / (t - c) : 0;
}
function mr(c, t, i) {
  return (1 - i) * c + i * t;
}
function E3(c, t, i, s) {
  return mr(c, t, 1 - Math.exp(-i * s));
}
function R3(c, t = 1) {
  return t - Math.abs(Kd(c, t * 2) - t);
}
function C3(c, t, i) {
  return c <= t ? 0 : c >= i ? 1 : ((c = (c - t) / (i - t)), c * c * (3 - 2 * c));
}
function O3(c, t, i) {
  return c <= t ? 0 : c >= i ? 1 : ((c = (c - t) / (i - t)), c * c * c * (c * (c * 6 - 15) + 10));
}
function B3(c, t) {
  return c + Math.floor(Math.random() * (t - c + 1));
}
function D3(c, t) {
  return c + Math.random() * (t - c);
}
function N3(c) {
  return c * (0.5 - Math.random());
}
function U3(c) {
  c !== void 0 && (Fg = c);
  let t = (Fg += 1831565813);
  return (
    (t = Math.imul(t ^ (t >>> 15), t | 1)),
    (t ^= t + Math.imul(t ^ (t >>> 7), t | 61)),
    ((t ^ (t >>> 14)) >>> 0) / 4294967296
  );
}
function F3(c) {
  return c * pr;
}
function L3(c) {
  return c * vr;
}
function k3(c) {
  return (c & (c - 1)) === 0 && c !== 0;
}
function H3(c) {
  return Math.pow(2, Math.ceil(Math.log(c) / Math.LN2));
}
function V3(c) {
  return Math.pow(2, Math.floor(Math.log(c) / Math.LN2));
}
function G3(c, t, i, s, o) {
  const l = Math.cos,
    u = Math.sin,
    f = l(i / 2),
    h = u(i / 2),
    p = l((t + s) / 2),
    y = u((t + s) / 2),
    g = l((t - s) / 2),
    v = u((t - s) / 2),
    b = l((s - t) / 2),
    S = u((s - t) / 2);
  switch (o) {
    case "XYX":
      c.set(f * y, h * g, h * v, f * p);
      break;
    case "YZY":
      c.set(h * v, f * y, h * g, f * p);
      break;
    case "ZXZ":
      c.set(h * g, h * v, f * y, f * p);
      break;
    case "XZX":
      c.set(f * y, h * S, h * b, f * p);
      break;
    case "YXY":
      c.set(h * b, f * y, h * S, f * p);
      break;
    case "ZYZ":
      c.set(h * S, h * b, f * y, f * p);
      break;
    default:
      console.warn(
        "THREE.MathUtils: .setQuaternionFromProperEuler() encountered an unknown order: " + o,
      );
  }
}
function Di(c, t) {
  switch (t.constructor) {
    case Float32Array:
      return c;
    case Uint32Array:
      return c / 4294967295;
    case Uint16Array:
      return c / 65535;
    case Uint8Array:
      return c / 255;
    case Int32Array:
      return Math.max(c / 2147483647, -1);
    case Int16Array:
      return Math.max(c / 32767, -1);
    case Int8Array:
      return Math.max(c / 127, -1);
    default:
      throw new Error("Invalid component type.");
  }
}
function Lt(c, t) {
  switch (t.constructor) {
    case Float32Array:
      return c;
    case Uint32Array:
      return Math.round(c * 4294967295);
    case Uint16Array:
      return Math.round(c * 65535);
    case Uint8Array:
      return Math.round(c * 255);
    case Int32Array:
      return Math.round(c * 2147483647);
    case Int16Array:
      return Math.round(c * 32767);
    case Int8Array:
      return Math.round(c * 127);
    default:
      throw new Error("Invalid component type.");
  }
}
const _4 = {
  DEG2RAD: pr,
  RAD2DEG: vr,
  generateUUID: Ai,
  clamp: bt,
  euclideanModulo: Kd,
  mapLinear: T3,
  inverseLerp: z3,
  lerp: mr,
  damp: E3,
  pingpong: R3,
  smoothstep: C3,
  smootherstep: O3,
  randInt: B3,
  randFloat: D3,
  randFloatSpread: N3,
  seededRandom: U3,
  degToRad: F3,
  radToDeg: L3,
  isPowerOfTwo: k3,
  ceilPowerOfTwo: H3,
  floorPowerOfTwo: V3,
  setQuaternionFromProperEuler: G3,
  normalize: Lt,
  denormalize: Di,
};
class tt {
  constructor(t = 0, i = 0) {
    ((tt.prototype.isVector2 = !0), (this.x = t), (this.y = i));
  }
  get width() {
    return this.x;
  }
  set width(t) {
    this.x = t;
  }
  get height() {
    return this.y;
  }
  set height(t) {
    this.y = t;
  }
  set(t, i) {
    return ((this.x = t), (this.y = i), this);
  }
  setScalar(t) {
    return ((this.x = t), (this.y = t), this);
  }
  setX(t) {
    return ((this.x = t), this);
  }
  setY(t) {
    return ((this.y = t), this);
  }
  setComponent(t, i) {
    switch (t) {
      case 0:
        this.x = i;
        break;
      case 1:
        this.y = i;
        break;
      default:
        throw new Error("index is out of range: " + t);
    }
    return this;
  }
  getComponent(t) {
    switch (t) {
      case 0:
        return this.x;
      case 1:
        return this.y;
      default:
        throw new Error("index is out of range: " + t);
    }
  }
  clone() {
    return new this.constructor(this.x, this.y);
  }
  copy(t) {
    return ((this.x = t.x), (this.y = t.y), this);
  }
  add(t) {
    return ((this.x += t.x), (this.y += t.y), this);
  }
  addScalar(t) {
    return ((this.x += t), (this.y += t), this);
  }
  addVectors(t, i) {
    return ((this.x = t.x + i.x), (this.y = t.y + i.y), this);
  }
  addScaledVector(t, i) {
    return ((this.x += t.x * i), (this.y += t.y * i), this);
  }
  sub(t) {
    return ((this.x -= t.x), (this.y -= t.y), this);
  }
  subScalar(t) {
    return ((this.x -= t), (this.y -= t), this);
  }
  subVectors(t, i) {
    return ((this.x = t.x - i.x), (this.y = t.y - i.y), this);
  }
  multiply(t) {
    return ((this.x *= t.x), (this.y *= t.y), this);
  }
  multiplyScalar(t) {
    return ((this.x *= t), (this.y *= t), this);
  }
  divide(t) {
    return ((this.x /= t.x), (this.y /= t.y), this);
  }
  divideScalar(t) {
    return this.multiplyScalar(1 / t);
  }
  applyMatrix3(t) {
    const i = this.x,
      s = this.y,
      o = t.elements;
    return ((this.x = o[0] * i + o[3] * s + o[6]), (this.y = o[1] * i + o[4] * s + o[7]), this);
  }
  min(t) {
    return ((this.x = Math.min(this.x, t.x)), (this.y = Math.min(this.y, t.y)), this);
  }
  max(t) {
    return ((this.x = Math.max(this.x, t.x)), (this.y = Math.max(this.y, t.y)), this);
  }
  clamp(t, i) {
    return ((this.x = bt(this.x, t.x, i.x)), (this.y = bt(this.y, t.y, i.y)), this);
  }
  clampScalar(t, i) {
    return ((this.x = bt(this.x, t, i)), (this.y = bt(this.y, t, i)), this);
  }
  clampLength(t, i) {
    const s = this.length();
    return this.divideScalar(s || 1).multiplyScalar(bt(s, t, i));
  }
  floor() {
    return ((this.x = Math.floor(this.x)), (this.y = Math.floor(this.y)), this);
  }
  ceil() {
    return ((this.x = Math.ceil(this.x)), (this.y = Math.ceil(this.y)), this);
  }
  round() {
    return ((this.x = Math.round(this.x)), (this.y = Math.round(this.y)), this);
  }
  roundToZero() {
    return ((this.x = Math.trunc(this.x)), (this.y = Math.trunc(this.y)), this);
  }
  negate() {
    return ((this.x = -this.x), (this.y = -this.y), this);
  }
  dot(t) {
    return this.x * t.x + this.y * t.y;
  }
  cross(t) {
    return this.x * t.y - this.y * t.x;
  }
  lengthSq() {
    return this.x * this.x + this.y * this.y;
  }
  length() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }
  manhattanLength() {
    return Math.abs(this.x) + Math.abs(this.y);
  }
  normalize() {
    return this.divideScalar(this.length() || 1);
  }
  angle() {
    return Math.atan2(-this.y, -this.x) + Math.PI;
  }
  angleTo(t) {
    const i = Math.sqrt(this.lengthSq() * t.lengthSq());
    if (i === 0) return Math.PI / 2;
    const s = this.dot(t) / i;
    return Math.acos(bt(s, -1, 1));
  }
  distanceTo(t) {
    return Math.sqrt(this.distanceToSquared(t));
  }
  distanceToSquared(t) {
    const i = this.x - t.x,
      s = this.y - t.y;
    return i * i + s * s;
  }
  manhattanDistanceTo(t) {
    return Math.abs(this.x - t.x) + Math.abs(this.y - t.y);
  }
  setLength(t) {
    return this.normalize().multiplyScalar(t);
  }
  lerp(t, i) {
    return ((this.x += (t.x - this.x) * i), (this.y += (t.y - this.y) * i), this);
  }
  lerpVectors(t, i, s) {
    return ((this.x = t.x + (i.x - t.x) * s), (this.y = t.y + (i.y - t.y) * s), this);
  }
  equals(t) {
    return t.x === this.x && t.y === this.y;
  }
  fromArray(t, i = 0) {
    return ((this.x = t[i]), (this.y = t[i + 1]), this);
  }
  toArray(t = [], i = 0) {
    return ((t[i] = this.x), (t[i + 1] = this.y), t);
  }
  fromBufferAttribute(t, i) {
    return ((this.x = t.getX(i)), (this.y = t.getY(i)), this);
  }
  rotateAround(t, i) {
    const s = Math.cos(i),
      o = Math.sin(i),
      l = this.x - t.x,
      u = this.y - t.y;
    return ((this.x = l * s - u * o + t.x), (this.y = l * o + u * s + t.y), this);
  }
  random() {
    return ((this.x = Math.random()), (this.y = Math.random()), this);
  }
  *[Symbol.iterator]() {
    (yield this.x, yield this.y);
  }
}
class Pa {
  constructor(t = 0, i = 0, s = 0, o = 1) {
    ((this.isQuaternion = !0), (this._x = t), (this._y = i), (this._z = s), (this._w = o));
  }
  static slerpFlat(t, i, s, o, l, u, f) {
    let h = s[o + 0],
      p = s[o + 1],
      y = s[o + 2],
      g = s[o + 3];
    const v = l[u + 0],
      b = l[u + 1],
      S = l[u + 2],
      A = l[u + 3];
    if (f === 0) {
      ((t[i + 0] = h), (t[i + 1] = p), (t[i + 2] = y), (t[i + 3] = g));
      return;
    }
    if (f === 1) {
      ((t[i + 0] = v), (t[i + 1] = b), (t[i + 2] = S), (t[i + 3] = A));
      return;
    }
    if (g !== A || h !== v || p !== b || y !== S) {
      let M = 1 - f;
      const T = h * v + p * b + y * S + g * A,
        O = T >= 0 ? 1 : -1,
        C = 1 - T * T;
      if (C > Number.EPSILON) {
        const U = Math.sqrt(C),
          q = Math.atan2(U, T * O);
        ((M = Math.sin(M * q) / U), (f = Math.sin(f * q) / U));
      }
      const E = f * O;
      if (
        ((h = h * M + v * E),
        (p = p * M + b * E),
        (y = y * M + S * E),
        (g = g * M + A * E),
        M === 1 - f)
      ) {
        const U = 1 / Math.sqrt(h * h + p * p + y * y + g * g);
        ((h *= U), (p *= U), (y *= U), (g *= U));
      }
    }
    ((t[i] = h), (t[i + 1] = p), (t[i + 2] = y), (t[i + 3] = g));
  }
  static multiplyQuaternionsFlat(t, i, s, o, l, u) {
    const f = s[o],
      h = s[o + 1],
      p = s[o + 2],
      y = s[o + 3],
      g = l[u],
      v = l[u + 1],
      b = l[u + 2],
      S = l[u + 3];
    return (
      (t[i] = f * S + y * g + h * b - p * v),
      (t[i + 1] = h * S + y * v + p * g - f * b),
      (t[i + 2] = p * S + y * b + f * v - h * g),
      (t[i + 3] = y * S - f * g - h * v - p * b),
      t
    );
  }
  get x() {
    return this._x;
  }
  set x(t) {
    ((this._x = t), this._onChangeCallback());
  }
  get y() {
    return this._y;
  }
  set y(t) {
    ((this._y = t), this._onChangeCallback());
  }
  get z() {
    return this._z;
  }
  set z(t) {
    ((this._z = t), this._onChangeCallback());
  }
  get w() {
    return this._w;
  }
  set w(t) {
    ((this._w = t), this._onChangeCallback());
  }
  set(t, i, s, o) {
    return (
      (this._x = t),
      (this._y = i),
      (this._z = s),
      (this._w = o),
      this._onChangeCallback(),
      this
    );
  }
  clone() {
    return new this.constructor(this._x, this._y, this._z, this._w);
  }
  copy(t) {
    return (
      (this._x = t.x),
      (this._y = t.y),
      (this._z = t.z),
      (this._w = t.w),
      this._onChangeCallback(),
      this
    );
  }
  setFromEuler(t, i = !0) {
    const s = t._x,
      o = t._y,
      l = t._z,
      u = t._order,
      f = Math.cos,
      h = Math.sin,
      p = f(s / 2),
      y = f(o / 2),
      g = f(l / 2),
      v = h(s / 2),
      b = h(o / 2),
      S = h(l / 2);
    switch (u) {
      case "XYZ":
        ((this._x = v * y * g + p * b * S),
          (this._y = p * b * g - v * y * S),
          (this._z = p * y * S + v * b * g),
          (this._w = p * y * g - v * b * S));
        break;
      case "YXZ":
        ((this._x = v * y * g + p * b * S),
          (this._y = p * b * g - v * y * S),
          (this._z = p * y * S - v * b * g),
          (this._w = p * y * g + v * b * S));
        break;
      case "ZXY":
        ((this._x = v * y * g - p * b * S),
          (this._y = p * b * g + v * y * S),
          (this._z = p * y * S + v * b * g),
          (this._w = p * y * g - v * b * S));
        break;
      case "ZYX":
        ((this._x = v * y * g - p * b * S),
          (this._y = p * b * g + v * y * S),
          (this._z = p * y * S - v * b * g),
          (this._w = p * y * g + v * b * S));
        break;
      case "YZX":
        ((this._x = v * y * g + p * b * S),
          (this._y = p * b * g + v * y * S),
          (this._z = p * y * S - v * b * g),
          (this._w = p * y * g - v * b * S));
        break;
      case "XZY":
        ((this._x = v * y * g - p * b * S),
          (this._y = p * b * g - v * y * S),
          (this._z = p * y * S + v * b * g),
          (this._w = p * y * g + v * b * S));
        break;
      default:
        console.warn("THREE.Quaternion: .setFromEuler() encountered an unknown order: " + u);
    }
    return (i === !0 && this._onChangeCallback(), this);
  }
  setFromAxisAngle(t, i) {
    const s = i / 2,
      o = Math.sin(s);
    return (
      (this._x = t.x * o),
      (this._y = t.y * o),
      (this._z = t.z * o),
      (this._w = Math.cos(s)),
      this._onChangeCallback(),
      this
    );
  }
  setFromRotationMatrix(t) {
    const i = t.elements,
      s = i[0],
      o = i[4],
      l = i[8],
      u = i[1],
      f = i[5],
      h = i[9],
      p = i[2],
      y = i[6],
      g = i[10],
      v = s + f + g;
    if (v > 0) {
      const b = 0.5 / Math.sqrt(v + 1);
      ((this._w = 0.25 / b),
        (this._x = (y - h) * b),
        (this._y = (l - p) * b),
        (this._z = (u - o) * b));
    } else if (s > f && s > g) {
      const b = 2 * Math.sqrt(1 + s - f - g);
      ((this._w = (y - h) / b),
        (this._x = 0.25 * b),
        (this._y = (o + u) / b),
        (this._z = (l + p) / b));
    } else if (f > g) {
      const b = 2 * Math.sqrt(1 + f - s - g);
      ((this._w = (l - p) / b),
        (this._x = (o + u) / b),
        (this._y = 0.25 * b),
        (this._z = (h + y) / b));
    } else {
      const b = 2 * Math.sqrt(1 + g - s - f);
      ((this._w = (u - o) / b),
        (this._x = (l + p) / b),
        (this._y = (h + y) / b),
        (this._z = 0.25 * b));
    }
    return (this._onChangeCallback(), this);
  }
  setFromUnitVectors(t, i) {
    let s = t.dot(i) + 1;
    return (
      s < 1e-8
        ? ((s = 0),
          Math.abs(t.x) > Math.abs(t.z)
            ? ((this._x = -t.y), (this._y = t.x), (this._z = 0), (this._w = s))
            : ((this._x = 0), (this._y = -t.z), (this._z = t.y), (this._w = s)))
        : ((this._x = t.y * i.z - t.z * i.y),
          (this._y = t.z * i.x - t.x * i.z),
          (this._z = t.x * i.y - t.y * i.x),
          (this._w = s)),
      this.normalize()
    );
  }
  angleTo(t) {
    return 2 * Math.acos(Math.abs(bt(this.dot(t), -1, 1)));
  }
  rotateTowards(t, i) {
    const s = this.angleTo(t);
    if (s === 0) return this;
    const o = Math.min(1, i / s);
    return (this.slerp(t, o), this);
  }
  identity() {
    return this.set(0, 0, 0, 1);
  }
  invert() {
    return this.conjugate();
  }
  conjugate() {
    return ((this._x *= -1), (this._y *= -1), (this._z *= -1), this._onChangeCallback(), this);
  }
  dot(t) {
    return this._x * t._x + this._y * t._y + this._z * t._z + this._w * t._w;
  }
  lengthSq() {
    return this._x * this._x + this._y * this._y + this._z * this._z + this._w * this._w;
  }
  length() {
    return Math.sqrt(this._x * this._x + this._y * this._y + this._z * this._z + this._w * this._w);
  }
  normalize() {
    let t = this.length();
    return (
      t === 0
        ? ((this._x = 0), (this._y = 0), (this._z = 0), (this._w = 1))
        : ((t = 1 / t),
          (this._x = this._x * t),
          (this._y = this._y * t),
          (this._z = this._z * t),
          (this._w = this._w * t)),
      this._onChangeCallback(),
      this
    );
  }
  multiply(t) {
    return this.multiplyQuaternions(this, t);
  }
  premultiply(t) {
    return this.multiplyQuaternions(t, this);
  }
  multiplyQuaternions(t, i) {
    const s = t._x,
      o = t._y,
      l = t._z,
      u = t._w,
      f = i._x,
      h = i._y,
      p = i._z,
      y = i._w;
    return (
      (this._x = s * y + u * f + o * p - l * h),
      (this._y = o * y + u * h + l * f - s * p),
      (this._z = l * y + u * p + s * h - o * f),
      (this._w = u * y - s * f - o * h - l * p),
      this._onChangeCallback(),
      this
    );
  }
  slerp(t, i) {
    if (i === 0) return this;
    if (i === 1) return this.copy(t);
    const s = this._x,
      o = this._y,
      l = this._z,
      u = this._w;
    let f = u * t._w + s * t._x + o * t._y + l * t._z;
    if (
      (f < 0
        ? ((this._w = -t._w), (this._x = -t._x), (this._y = -t._y), (this._z = -t._z), (f = -f))
        : this.copy(t),
      f >= 1)
    )
      return ((this._w = u), (this._x = s), (this._y = o), (this._z = l), this);
    const h = 1 - f * f;
    if (h <= Number.EPSILON) {
      const b = 1 - i;
      return (
        (this._w = b * u + i * this._w),
        (this._x = b * s + i * this._x),
        (this._y = b * o + i * this._y),
        (this._z = b * l + i * this._z),
        this.normalize(),
        this
      );
    }
    const p = Math.sqrt(h),
      y = Math.atan2(p, f),
      g = Math.sin((1 - i) * y) / p,
      v = Math.sin(i * y) / p;
    return (
      (this._w = u * g + this._w * v),
      (this._x = s * g + this._x * v),
      (this._y = o * g + this._y * v),
      (this._z = l * g + this._z * v),
      this._onChangeCallback(),
      this
    );
  }
  slerpQuaternions(t, i, s) {
    return this.copy(t).slerp(i, s);
  }
  random() {
    const t = 2 * Math.PI * Math.random(),
      i = 2 * Math.PI * Math.random(),
      s = Math.random(),
      o = Math.sqrt(1 - s),
      l = Math.sqrt(s);
    return this.set(o * Math.sin(t), o * Math.cos(t), l * Math.sin(i), l * Math.cos(i));
  }
  equals(t) {
    return t._x === this._x && t._y === this._y && t._z === this._z && t._w === this._w;
  }
  fromArray(t, i = 0) {
    return (
      (this._x = t[i]),
      (this._y = t[i + 1]),
      (this._z = t[i + 2]),
      (this._w = t[i + 3]),
      this._onChangeCallback(),
      this
    );
  }
  toArray(t = [], i = 0) {
    return ((t[i] = this._x), (t[i + 1] = this._y), (t[i + 2] = this._z), (t[i + 3] = this._w), t);
  }
  fromBufferAttribute(t, i) {
    return (
      (this._x = t.getX(i)),
      (this._y = t.getY(i)),
      (this._z = t.getZ(i)),
      (this._w = t.getW(i)),
      this._onChangeCallback(),
      this
    );
  }
  toJSON() {
    return this.toArray();
  }
  _onChange(t) {
    return ((this._onChangeCallback = t), this);
  }
  _onChangeCallback() {}
  *[Symbol.iterator]() {
    (yield this._x, yield this._y, yield this._z, yield this._w);
  }
}
class R {
  constructor(t = 0, i = 0, s = 0) {
    ((R.prototype.isVector3 = !0), (this.x = t), (this.y = i), (this.z = s));
  }
  set(t, i, s) {
    return (s === void 0 && (s = this.z), (this.x = t), (this.y = i), (this.z = s), this);
  }
  setScalar(t) {
    return ((this.x = t), (this.y = t), (this.z = t), this);
  }
  setX(t) {
    return ((this.x = t), this);
  }
  setY(t) {
    return ((this.y = t), this);
  }
  setZ(t) {
    return ((this.z = t), this);
  }
  setComponent(t, i) {
    switch (t) {
      case 0:
        this.x = i;
        break;
      case 1:
        this.y = i;
        break;
      case 2:
        this.z = i;
        break;
      default:
        throw new Error("index is out of range: " + t);
    }
    return this;
  }
  getComponent(t) {
    switch (t) {
      case 0:
        return this.x;
      case 1:
        return this.y;
      case 2:
        return this.z;
      default:
        throw new Error("index is out of range: " + t);
    }
  }
  clone() {
    return new this.constructor(this.x, this.y, this.z);
  }
  copy(t) {
    return ((this.x = t.x), (this.y = t.y), (this.z = t.z), this);
  }
  add(t) {
    return ((this.x += t.x), (this.y += t.y), (this.z += t.z), this);
  }
  addScalar(t) {
    return ((this.x += t), (this.y += t), (this.z += t), this);
  }
  addVectors(t, i) {
    return ((this.x = t.x + i.x), (this.y = t.y + i.y), (this.z = t.z + i.z), this);
  }
  addScaledVector(t, i) {
    return ((this.x += t.x * i), (this.y += t.y * i), (this.z += t.z * i), this);
  }
  sub(t) {
    return ((this.x -= t.x), (this.y -= t.y), (this.z -= t.z), this);
  }
  subScalar(t) {
    return ((this.x -= t), (this.y -= t), (this.z -= t), this);
  }
  subVectors(t, i) {
    return ((this.x = t.x - i.x), (this.y = t.y - i.y), (this.z = t.z - i.z), this);
  }
  multiply(t) {
    return ((this.x *= t.x), (this.y *= t.y), (this.z *= t.z), this);
  }
  multiplyScalar(t) {
    return ((this.x *= t), (this.y *= t), (this.z *= t), this);
  }
  multiplyVectors(t, i) {
    return ((this.x = t.x * i.x), (this.y = t.y * i.y), (this.z = t.z * i.z), this);
  }
  applyEuler(t) {
    return this.applyQuaternion(Lg.setFromEuler(t));
  }
  applyAxisAngle(t, i) {
    return this.applyQuaternion(Lg.setFromAxisAngle(t, i));
  }
  applyMatrix3(t) {
    const i = this.x,
      s = this.y,
      o = this.z,
      l = t.elements;
    return (
      (this.x = l[0] * i + l[3] * s + l[6] * o),
      (this.y = l[1] * i + l[4] * s + l[7] * o),
      (this.z = l[2] * i + l[5] * s + l[8] * o),
      this
    );
  }
  applyNormalMatrix(t) {
    return this.applyMatrix3(t).normalize();
  }
  applyMatrix4(t) {
    const i = this.x,
      s = this.y,
      o = this.z,
      l = t.elements,
      u = 1 / (l[3] * i + l[7] * s + l[11] * o + l[15]);
    return (
      (this.x = (l[0] * i + l[4] * s + l[8] * o + l[12]) * u),
      (this.y = (l[1] * i + l[5] * s + l[9] * o + l[13]) * u),
      (this.z = (l[2] * i + l[6] * s + l[10] * o + l[14]) * u),
      this
    );
  }
  applyQuaternion(t) {
    const i = this.x,
      s = this.y,
      o = this.z,
      l = t.x,
      u = t.y,
      f = t.z,
      h = t.w,
      p = 2 * (u * o - f * s),
      y = 2 * (f * i - l * o),
      g = 2 * (l * s - u * i);
    return (
      (this.x = i + h * p + u * g - f * y),
      (this.y = s + h * y + f * p - l * g),
      (this.z = o + h * g + l * y - u * p),
      this
    );
  }
  project(t) {
    return this.applyMatrix4(t.matrixWorldInverse).applyMatrix4(t.projectionMatrix);
  }
  unproject(t) {
    return this.applyMatrix4(t.projectionMatrixInverse).applyMatrix4(t.matrixWorld);
  }
  transformDirection(t) {
    const i = this.x,
      s = this.y,
      o = this.z,
      l = t.elements;
    return (
      (this.x = l[0] * i + l[4] * s + l[8] * o),
      (this.y = l[1] * i + l[5] * s + l[9] * o),
      (this.z = l[2] * i + l[6] * s + l[10] * o),
      this.normalize()
    );
  }
  divide(t) {
    return ((this.x /= t.x), (this.y /= t.y), (this.z /= t.z), this);
  }
  divideScalar(t) {
    return this.multiplyScalar(1 / t);
  }
  min(t) {
    return (
      (this.x = Math.min(this.x, t.x)),
      (this.y = Math.min(this.y, t.y)),
      (this.z = Math.min(this.z, t.z)),
      this
    );
  }
  max(t) {
    return (
      (this.x = Math.max(this.x, t.x)),
      (this.y = Math.max(this.y, t.y)),
      (this.z = Math.max(this.z, t.z)),
      this
    );
  }
  clamp(t, i) {
    return (
      (this.x = bt(this.x, t.x, i.x)),
      (this.y = bt(this.y, t.y, i.y)),
      (this.z = bt(this.z, t.z, i.z)),
      this
    );
  }
  clampScalar(t, i) {
    return (
      (this.x = bt(this.x, t, i)),
      (this.y = bt(this.y, t, i)),
      (this.z = bt(this.z, t, i)),
      this
    );
  }
  clampLength(t, i) {
    const s = this.length();
    return this.divideScalar(s || 1).multiplyScalar(bt(s, t, i));
  }
  floor() {
    return (
      (this.x = Math.floor(this.x)),
      (this.y = Math.floor(this.y)),
      (this.z = Math.floor(this.z)),
      this
    );
  }
  ceil() {
    return (
      (this.x = Math.ceil(this.x)),
      (this.y = Math.ceil(this.y)),
      (this.z = Math.ceil(this.z)),
      this
    );
  }
  round() {
    return (
      (this.x = Math.round(this.x)),
      (this.y = Math.round(this.y)),
      (this.z = Math.round(this.z)),
      this
    );
  }
  roundToZero() {
    return (
      (this.x = Math.trunc(this.x)),
      (this.y = Math.trunc(this.y)),
      (this.z = Math.trunc(this.z)),
      this
    );
  }
  negate() {
    return ((this.x = -this.x), (this.y = -this.y), (this.z = -this.z), this);
  }
  dot(t) {
    return this.x * t.x + this.y * t.y + this.z * t.z;
  }
  lengthSq() {
    return this.x * this.x + this.y * this.y + this.z * this.z;
  }
  length() {
    return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
  }
  manhattanLength() {
    return Math.abs(this.x) + Math.abs(this.y) + Math.abs(this.z);
  }
  normalize() {
    return this.divideScalar(this.length() || 1);
  }
  setLength(t) {
    return this.normalize().multiplyScalar(t);
  }
  lerp(t, i) {
    return (
      (this.x += (t.x - this.x) * i),
      (this.y += (t.y - this.y) * i),
      (this.z += (t.z - this.z) * i),
      this
    );
  }
  lerpVectors(t, i, s) {
    return (
      (this.x = t.x + (i.x - t.x) * s),
      (this.y = t.y + (i.y - t.y) * s),
      (this.z = t.z + (i.z - t.z) * s),
      this
    );
  }
  cross(t) {
    return this.crossVectors(this, t);
  }
  crossVectors(t, i) {
    const s = t.x,
      o = t.y,
      l = t.z,
      u = i.x,
      f = i.y,
      h = i.z;
    return ((this.x = o * h - l * f), (this.y = l * u - s * h), (this.z = s * f - o * u), this);
  }
  projectOnVector(t) {
    const i = t.lengthSq();
    if (i === 0) return this.set(0, 0, 0);
    const s = t.dot(this) / i;
    return this.copy(t).multiplyScalar(s);
  }
  projectOnPlane(t) {
    return (Pf.copy(this).projectOnVector(t), this.sub(Pf));
  }
  reflect(t) {
    return this.sub(Pf.copy(t).multiplyScalar(2 * this.dot(t)));
  }
  angleTo(t) {
    const i = Math.sqrt(this.lengthSq() * t.lengthSq());
    if (i === 0) return Math.PI / 2;
    const s = this.dot(t) / i;
    return Math.acos(bt(s, -1, 1));
  }
  distanceTo(t) {
    return Math.sqrt(this.distanceToSquared(t));
  }
  distanceToSquared(t) {
    const i = this.x - t.x,
      s = this.y - t.y,
      o = this.z - t.z;
    return i * i + s * s + o * o;
  }
  manhattanDistanceTo(t) {
    return Math.abs(this.x - t.x) + Math.abs(this.y - t.y) + Math.abs(this.z - t.z);
  }
  setFromSpherical(t) {
    return this.setFromSphericalCoords(t.radius, t.phi, t.theta);
  }
  setFromSphericalCoords(t, i, s) {
    const o = Math.sin(i) * t;
    return (
      (this.x = o * Math.sin(s)),
      (this.y = Math.cos(i) * t),
      (this.z = o * Math.cos(s)),
      this
    );
  }
  setFromCylindrical(t) {
    return this.setFromCylindricalCoords(t.radius, t.theta, t.y);
  }
  setFromCylindricalCoords(t, i, s) {
    return ((this.x = t * Math.sin(i)), (this.y = s), (this.z = t * Math.cos(i)), this);
  }
  setFromMatrixPosition(t) {
    const i = t.elements;
    return ((this.x = i[12]), (this.y = i[13]), (this.z = i[14]), this);
  }
  setFromMatrixScale(t) {
    const i = this.setFromMatrixColumn(t, 0).length(),
      s = this.setFromMatrixColumn(t, 1).length(),
      o = this.setFromMatrixColumn(t, 2).length();
    return ((this.x = i), (this.y = s), (this.z = o), this);
  }
  setFromMatrixColumn(t, i) {
    return this.fromArray(t.elements, i * 4);
  }
  setFromMatrix3Column(t, i) {
    return this.fromArray(t.elements, i * 3);
  }
  setFromEuler(t) {
    return ((this.x = t._x), (this.y = t._y), (this.z = t._z), this);
  }
  setFromColor(t) {
    return ((this.x = t.r), (this.y = t.g), (this.z = t.b), this);
  }
  equals(t) {
    return t.x === this.x && t.y === this.y && t.z === this.z;
  }
  fromArray(t, i = 0) {
    return ((this.x = t[i]), (this.y = t[i + 1]), (this.z = t[i + 2]), this);
  }
  toArray(t = [], i = 0) {
    return ((t[i] = this.x), (t[i + 1] = this.y), (t[i + 2] = this.z), t);
  }
  fromBufferAttribute(t, i) {
    return ((this.x = t.getX(i)), (this.y = t.getY(i)), (this.z = t.getZ(i)), this);
  }
  random() {
    return ((this.x = Math.random()), (this.y = Math.random()), (this.z = Math.random()), this);
  }
  randomDirection() {
    const t = Math.random() * Math.PI * 2,
      i = Math.random() * 2 - 1,
      s = Math.sqrt(1 - i * i);
    return ((this.x = s * Math.cos(t)), (this.y = i), (this.z = s * Math.sin(t)), this);
  }
  *[Symbol.iterator]() {
    (yield this.x, yield this.y, yield this.z);
  }
}
const Pf = new R(),
  Lg = new Pa();
class Sn {
  constructor(t, i, s, o, l, u, f, h, p) {
    ((Sn.prototype.isMatrix3 = !0),
      (this.elements = [1, 0, 0, 0, 1, 0, 0, 0, 1]),
      t !== void 0 && this.set(t, i, s, o, l, u, f, h, p));
  }
  set(t, i, s, o, l, u, f, h, p) {
    const y = this.elements;
    return (
      (y[0] = t),
      (y[1] = o),
      (y[2] = f),
      (y[3] = i),
      (y[4] = l),
      (y[5] = h),
      (y[6] = s),
      (y[7] = u),
      (y[8] = p),
      this
    );
  }
  identity() {
    return (this.set(1, 0, 0, 0, 1, 0, 0, 0, 1), this);
  }
  copy(t) {
    const i = this.elements,
      s = t.elements;
    return (
      (i[0] = s[0]),
      (i[1] = s[1]),
      (i[2] = s[2]),
      (i[3] = s[3]),
      (i[4] = s[4]),
      (i[5] = s[5]),
      (i[6] = s[6]),
      (i[7] = s[7]),
      (i[8] = s[8]),
      this
    );
  }
  extractBasis(t, i, s) {
    return (
      t.setFromMatrix3Column(this, 0),
      i.setFromMatrix3Column(this, 1),
      s.setFromMatrix3Column(this, 2),
      this
    );
  }
  setFromMatrix4(t) {
    const i = t.elements;
    return (this.set(i[0], i[4], i[8], i[1], i[5], i[9], i[2], i[6], i[10]), this);
  }
  multiply(t) {
    return this.multiplyMatrices(this, t);
  }
  premultiply(t) {
    return this.multiplyMatrices(t, this);
  }
  multiplyMatrices(t, i) {
    const s = t.elements,
      o = i.elements,
      l = this.elements,
      u = s[0],
      f = s[3],
      h = s[6],
      p = s[1],
      y = s[4],
      g = s[7],
      v = s[2],
      b = s[5],
      S = s[8],
      A = o[0],
      M = o[3],
      T = o[6],
      O = o[1],
      C = o[4],
      E = o[7],
      U = o[2],
      q = o[5],
      X = o[8];
    return (
      (l[0] = u * A + f * O + h * U),
      (l[3] = u * M + f * C + h * q),
      (l[6] = u * T + f * E + h * X),
      (l[1] = p * A + y * O + g * U),
      (l[4] = p * M + y * C + g * q),
      (l[7] = p * T + y * E + g * X),
      (l[2] = v * A + b * O + S * U),
      (l[5] = v * M + b * C + S * q),
      (l[8] = v * T + b * E + S * X),
      this
    );
  }
  multiplyScalar(t) {
    const i = this.elements;
    return (
      (i[0] *= t),
      (i[3] *= t),
      (i[6] *= t),
      (i[1] *= t),
      (i[4] *= t),
      (i[7] *= t),
      (i[2] *= t),
      (i[5] *= t),
      (i[8] *= t),
      this
    );
  }
  determinant() {
    const t = this.elements,
      i = t[0],
      s = t[1],
      o = t[2],
      l = t[3],
      u = t[4],
      f = t[5],
      h = t[6],
      p = t[7],
      y = t[8];
    return i * u * y - i * f * p - s * l * y + s * f * h + o * l * p - o * u * h;
  }
  invert() {
    const t = this.elements,
      i = t[0],
      s = t[1],
      o = t[2],
      l = t[3],
      u = t[4],
      f = t[5],
      h = t[6],
      p = t[7],
      y = t[8],
      g = y * u - f * p,
      v = f * h - y * l,
      b = p * l - u * h,
      S = i * g + s * v + o * b;
    if (S === 0) return this.set(0, 0, 0, 0, 0, 0, 0, 0, 0);
    const A = 1 / S;
    return (
      (t[0] = g * A),
      (t[1] = (o * p - y * s) * A),
      (t[2] = (f * s - o * u) * A),
      (t[3] = v * A),
      (t[4] = (y * i - o * h) * A),
      (t[5] = (o * l - f * i) * A),
      (t[6] = b * A),
      (t[7] = (s * h - p * i) * A),
      (t[8] = (u * i - s * l) * A),
      this
    );
  }
  transpose() {
    let t;
    const i = this.elements;
    return (
      (t = i[1]),
      (i[1] = i[3]),
      (i[3] = t),
      (t = i[2]),
      (i[2] = i[6]),
      (i[6] = t),
      (t = i[5]),
      (i[5] = i[7]),
      (i[7] = t),
      this
    );
  }
  getNormalMatrix(t) {
    return this.setFromMatrix4(t).invert().transpose();
  }
  transposeIntoArray(t) {
    const i = this.elements;
    return (
      (t[0] = i[0]),
      (t[1] = i[3]),
      (t[2] = i[6]),
      (t[3] = i[1]),
      (t[4] = i[4]),
      (t[5] = i[7]),
      (t[6] = i[2]),
      (t[7] = i[5]),
      (t[8] = i[8]),
      this
    );
  }
  setUvTransform(t, i, s, o, l, u, f) {
    const h = Math.cos(l),
      p = Math.sin(l);
    return (
      this.set(
        s * h,
        s * p,
        -s * (h * u + p * f) + u + t,
        -o * p,
        o * h,
        -o * (-p * u + h * f) + f + i,
        0,
        0,
        1,
      ),
      this
    );
  }
  scale(t, i) {
    return (this.premultiply(Wf.makeScale(t, i)), this);
  }
  rotate(t) {
    return (this.premultiply(Wf.makeRotation(-t)), this);
  }
  translate(t, i) {
    return (this.premultiply(Wf.makeTranslation(t, i)), this);
  }
  makeTranslation(t, i) {
    return (
      t.isVector2 ? this.set(1, 0, t.x, 0, 1, t.y, 0, 0, 1) : this.set(1, 0, t, 0, 1, i, 0, 0, 1),
      this
    );
  }
  makeRotation(t) {
    const i = Math.cos(t),
      s = Math.sin(t);
    return (this.set(i, -s, 0, s, i, 0, 0, 0, 1), this);
  }
  makeScale(t, i) {
    return (this.set(t, 0, 0, 0, i, 0, 0, 0, 1), this);
  }
  equals(t) {
    const i = this.elements,
      s = t.elements;
    for (let o = 0; o < 9; o++) if (i[o] !== s[o]) return !1;
    return !0;
  }
  fromArray(t, i = 0) {
    for (let s = 0; s < 9; s++) this.elements[s] = t[s + i];
    return this;
  }
  toArray(t = [], i = 0) {
    const s = this.elements;
    return (
      (t[i] = s[0]),
      (t[i + 1] = s[1]),
      (t[i + 2] = s[2]),
      (t[i + 3] = s[3]),
      (t[i + 4] = s[4]),
      (t[i + 5] = s[5]),
      (t[i + 6] = s[6]),
      (t[i + 7] = s[7]),
      (t[i + 8] = s[8]),
      t
    );
  }
  clone() {
    return new this.constructor().fromArray(this.elements);
  }
}
const Wf = new Sn();
function j3(c) {
  for (let t = c.length - 1; t >= 0; --t) if (c[t] >= 65535) return !0;
  return !1;
}
function su(c) {
  return document.createElementNS("http://www.w3.org/1999/xhtml", c);
}
function T4() {
  const c = su("canvas");
  return ((c.style.display = "block"), c);
}
const kg = {};
function Hg(c) {
  c in kg || ((kg[c] = !0), console.warn(c));
}
function z4(c, t, i) {
  return new Promise(function (s, o) {
    function l() {
      switch (c.clientWaitSync(t, c.SYNC_FLUSH_COMMANDS_BIT, 0)) {
        case c.WAIT_FAILED:
          o();
          break;
        case c.TIMEOUT_EXPIRED:
          setTimeout(l, i);
          break;
        default:
          s();
      }
    }
    setTimeout(l, i);
  });
}
const Vg = new Sn().set(
    0.4123908,
    0.3575843,
    0.1804808,
    0.212639,
    0.7151687,
    0.0721923,
    0.0193308,
    0.1191948,
    0.9505322,
  ),
  Gg = new Sn().set(
    3.2409699,
    -1.5373832,
    -0.4986108,
    -0.9692436,
    1.8759675,
    0.0415551,
    0.0556301,
    -0.203977,
    1.0569715,
  );
function Y3() {
  const c = {
      enabled: !0,
      workingColorSpace: Dg,
      spaces: {},
      convert: function (o, l, u) {
        return (
          this.enabled === !1 ||
            l === u ||
            !l ||
            !u ||
            (this.spaces[l].transfer === Zf && ((o.r = bn(o.r)), (o.g = bn(o.g)), (o.b = bn(o.b))),
            this.spaces[l].primaries !== this.spaces[u].primaries &&
              (o.applyMatrix3(this.spaces[l].toXYZ), o.applyMatrix3(this.spaces[u].fromXYZ)),
            this.spaces[u].transfer === Zf && ((o.r = ja(o.r)), (o.g = ja(o.g)), (o.b = ja(o.b)))),
          o
        );
      },
      workingToColorSpace: function (o, l) {
        return this.convert(o, this.workingColorSpace, l);
      },
      colorSpaceToWorking: function (o, l) {
        return this.convert(o, l, this.workingColorSpace);
      },
      getPrimaries: function (o) {
        return this.spaces[o].primaries;
      },
      getTransfer: function (o) {
        return o === E1 ? Ng : this.spaces[o].transfer;
      },
      getToneMappingMode: function (o) {
        return this.spaces[o].outputColorSpaceConfig.toneMappingMode || "standard";
      },
      getLuminanceCoefficients: function (o, l = this.workingColorSpace) {
        return o.fromArray(this.spaces[l].luminanceCoefficients);
      },
      define: function (o) {
        Object.assign(this.spaces, o);
      },
      _getMatrix: function (o, l, u) {
        return o.copy(this.spaces[l].toXYZ).multiply(this.spaces[u].fromXYZ);
      },
      _getDrawingBufferColorSpace: function (o) {
        return this.spaces[o].outputColorSpaceConfig.drawingBufferColorSpace;
      },
      _getUnpackColorSpace: function (o = this.workingColorSpace) {
        return this.spaces[o].workingColorSpaceConfig.unpackColorSpace;
      },
      fromWorkingColorSpace: function (o, l) {
        return (
          Hg(
            "THREE.ColorManagement: .fromWorkingColorSpace() has been renamed to .workingToColorSpace().",
          ),
          c.workingToColorSpace(o, l)
        );
      },
      toWorkingColorSpace: function (o, l) {
        return (
          Hg(
            "THREE.ColorManagement: .toWorkingColorSpace() has been renamed to .colorSpaceToWorking().",
          ),
          c.colorSpaceToWorking(o, l)
        );
      },
    },
    t = [0.64, 0.33, 0.3, 0.6, 0.15, 0.06],
    i = [0.2126, 0.7152, 0.0722],
    s = [0.3127, 0.329];
  return (
    c.define({
      [Dg]: {
        primaries: t,
        whitePoint: s,
        transfer: Ng,
        toXYZ: Vg,
        fromXYZ: Gg,
        luminanceCoefficients: i,
        workingColorSpaceConfig: { unpackColorSpace: Bi },
        outputColorSpaceConfig: { drawingBufferColorSpace: Bi },
      },
      [Bi]: {
        primaries: t,
        whitePoint: s,
        transfer: Zf,
        toXYZ: Vg,
        fromXYZ: Gg,
        luminanceCoefficients: i,
        outputColorSpaceConfig: { drawingBufferColorSpace: Bi },
      },
    }),
    c
  );
}
const bi = Y3();
function bn(c) {
  return c < 0.04045 ? c * 0.0773993808 : Math.pow(c * 0.9478672986 + 0.0521327014, 2.4);
}
function ja(c) {
  return c < 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 0.41666) - 0.055;
}
let wa;
class q3 {
  static getDataURL(t, i = "image/png") {
    if (/^data:/i.test(t.src) || typeof HTMLCanvasElement > "u") return t.src;
    let s;
    if (t instanceof HTMLCanvasElement) s = t;
    else {
      (wa === void 0 && (wa = su("canvas")), (wa.width = t.width), (wa.height = t.height));
      const o = wa.getContext("2d");
      (t instanceof ImageData ? o.putImageData(t, 0, 0) : o.drawImage(t, 0, 0, t.width, t.height),
        (s = wa));
    }
    return s.toDataURL(i);
  }
  static sRGBToLinear(t) {
    if (
      (typeof HTMLImageElement < "u" && t instanceof HTMLImageElement) ||
      (typeof HTMLCanvasElement < "u" && t instanceof HTMLCanvasElement) ||
      (typeof ImageBitmap < "u" && t instanceof ImageBitmap)
    ) {
      const i = su("canvas");
      ((i.width = t.width), (i.height = t.height));
      const s = i.getContext("2d");
      s.drawImage(t, 0, 0, t.width, t.height);
      const o = s.getImageData(0, 0, t.width, t.height),
        l = o.data;
      for (let u = 0; u < l.length; u++) l[u] = bn(l[u] / 255) * 255;
      return (s.putImageData(o, 0, 0), i);
    } else if (t.data) {
      const i = t.data.slice(0);
      for (let s = 0; s < i.length; s++)
        i instanceof Uint8Array || i instanceof Uint8ClampedArray
          ? (i[s] = Math.floor(bn(i[s] / 255) * 255))
          : (i[s] = bn(i[s]));
      return { data: i, width: t.width, height: t.height };
    } else
      return (
        console.warn(
          "THREE.ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied.",
        ),
        t
      );
  }
}
let X3 = 0;
class $d {
  constructor(t = null) {
    ((this.isSource = !0),
      Object.defineProperty(this, "id", { value: X3++ }),
      (this.uuid = Ai()),
      (this.data = t),
      (this.dataReady = !0),
      (this.version = 0));
  }
  getSize(t) {
    const i = this.data;
    return (
      typeof HTMLVideoElement < "u" && i instanceof HTMLVideoElement
        ? t.set(i.videoWidth, i.videoHeight, 0)
        : i instanceof VideoFrame
          ? t.set(i.displayHeight, i.displayWidth, 0)
          : i !== null
            ? t.set(i.width, i.height, i.depth || 0)
            : t.set(0, 0, 0),
      t
    );
  }
  set needsUpdate(t) {
    t === !0 && this.version++;
  }
  toJSON(t) {
    const i = t === void 0 || typeof t == "string";
    if (!i && t.images[this.uuid] !== void 0) return t.images[this.uuid];
    const s = { uuid: this.uuid, url: "" },
      o = this.data;
    if (o !== null) {
      let l;
      if (Array.isArray(o)) {
        l = [];
        for (let u = 0, f = o.length; u < f; u++)
          o[u].isDataTexture ? l.push(Jf(o[u].image)) : l.push(Jf(o[u]));
      } else l = Jf(o);
      s.url = l;
    }
    return (i || (t.images[this.uuid] = s), s);
  }
}
function Jf(c) {
  return (typeof HTMLImageElement < "u" && c instanceof HTMLImageElement) ||
    (typeof HTMLCanvasElement < "u" && c instanceof HTMLCanvasElement) ||
    (typeof ImageBitmap < "u" && c instanceof ImageBitmap)
    ? q3.getDataURL(c)
    : c.data
      ? {
          data: Array.from(c.data),
          width: c.width,
          height: c.height,
          type: c.data.constructor.name,
        }
      : (console.warn("THREE.Texture: Unable to serialize Texture."), {});
}
let I3 = 0;
const Qf = new R();
class Ue extends Or {
  constructor(
    t = Ue.DEFAULT_IMAGE,
    i = Ue.DEFAULT_MAPPING,
    s = Va,
    o = Va,
    l = eu,
    u = _1,
    f = Qd,
    h = Jd,
    p = Ue.DEFAULT_ANISOTROPY,
    y = E1,
  ) {
    (super(),
      (this.isTexture = !0),
      Object.defineProperty(this, "id", { value: I3++ }),
      (this.uuid = Ai()),
      (this.name = ""),
      (this.source = new $d(t)),
      (this.mipmaps = []),
      (this.mapping = i),
      (this.channel = 0),
      (this.wrapS = s),
      (this.wrapT = o),
      (this.magFilter = l),
      (this.minFilter = u),
      (this.anisotropy = p),
      (this.format = f),
      (this.internalFormat = null),
      (this.type = h),
      (this.offset = new tt(0, 0)),
      (this.repeat = new tt(1, 1)),
      (this.center = new tt(0, 0)),
      (this.rotation = 0),
      (this.matrixAutoUpdate = !0),
      (this.matrix = new Sn()),
      (this.generateMipmaps = !0),
      (this.premultiplyAlpha = !1),
      (this.flipY = !0),
      (this.unpackAlignment = 4),
      (this.colorSpace = y),
      (this.userData = {}),
      (this.updateRanges = []),
      (this.version = 0),
      (this.onUpdate = null),
      (this.renderTarget = null),
      (this.isRenderTargetTexture = !1),
      (this.isArrayTexture = !!(t && t.depth && t.depth > 1)),
      (this.pmremVersion = 0));
  }
  get width() {
    return this.source.getSize(Qf).x;
  }
  get height() {
    return this.source.getSize(Qf).y;
  }
  get depth() {
    return this.source.getSize(Qf).z;
  }
  get image() {
    return this.source.data;
  }
  set image(t = null) {
    this.source.data = t;
  }
  updateMatrix() {
    this.matrix.setUvTransform(
      this.offset.x,
      this.offset.y,
      this.repeat.x,
      this.repeat.y,
      this.rotation,
      this.center.x,
      this.center.y,
    );
  }
  addUpdateRange(t, i) {
    this.updateRanges.push({ start: t, count: i });
  }
  clearUpdateRanges() {
    this.updateRanges.length = 0;
  }
  clone() {
    return new this.constructor().copy(this);
  }
  copy(t) {
    return (
      (this.name = t.name),
      (this.source = t.source),
      (this.mipmaps = t.mipmaps.slice(0)),
      (this.mapping = t.mapping),
      (this.channel = t.channel),
      (this.wrapS = t.wrapS),
      (this.wrapT = t.wrapT),
      (this.magFilter = t.magFilter),
      (this.minFilter = t.minFilter),
      (this.anisotropy = t.anisotropy),
      (this.format = t.format),
      (this.internalFormat = t.internalFormat),
      (this.type = t.type),
      this.offset.copy(t.offset),
      this.repeat.copy(t.repeat),
      this.center.copy(t.center),
      (this.rotation = t.rotation),
      (this.matrixAutoUpdate = t.matrixAutoUpdate),
      this.matrix.copy(t.matrix),
      (this.generateMipmaps = t.generateMipmaps),
      (this.premultiplyAlpha = t.premultiplyAlpha),
      (this.flipY = t.flipY),
      (this.unpackAlignment = t.unpackAlignment),
      (this.colorSpace = t.colorSpace),
      (this.renderTarget = t.renderTarget),
      (this.isRenderTargetTexture = t.isRenderTargetTexture),
      (this.isArrayTexture = t.isArrayTexture),
      (this.userData = JSON.parse(JSON.stringify(t.userData))),
      (this.needsUpdate = !0),
      this
    );
  }
  setValues(t) {
    for (const i in t) {
      const s = t[i];
      if (s === void 0) {
        console.warn(`THREE.Texture.setValues(): parameter '${i}' has value of undefined.`);
        continue;
      }
      const o = this[i];
      if (o === void 0) {
        console.warn(`THREE.Texture.setValues(): property '${i}' does not exist.`);
        continue;
      }
      (o && s && o.isVector2 && s.isVector2) ||
      (o && s && o.isVector3 && s.isVector3) ||
      (o && s && o.isMatrix3 && s.isMatrix3)
        ? o.copy(s)
        : (this[i] = s);
    }
  }
  toJSON(t) {
    const i = t === void 0 || typeof t == "string";
    if (!i && t.textures[this.uuid] !== void 0) return t.textures[this.uuid];
    const s = {
      metadata: { version: 4.7, type: "Texture", generator: "Texture.toJSON" },
      uuid: this.uuid,
      name: this.name,
      image: this.source.toJSON(t).uuid,
      mapping: this.mapping,
      channel: this.channel,
      repeat: [this.repeat.x, this.repeat.y],
      offset: [this.offset.x, this.offset.y],
      center: [this.center.x, this.center.y],
      rotation: this.rotation,
      wrap: [this.wrapS, this.wrapT],
      format: this.format,
      internalFormat: this.internalFormat,
      type: this.type,
      colorSpace: this.colorSpace,
      minFilter: this.minFilter,
      magFilter: this.magFilter,
      anisotropy: this.anisotropy,
      flipY: this.flipY,
      generateMipmaps: this.generateMipmaps,
      premultiplyAlpha: this.premultiplyAlpha,
      unpackAlignment: this.unpackAlignment,
    };
    return (
      Object.keys(this.userData).length > 0 && (s.userData = this.userData),
      i || (t.textures[this.uuid] = s),
      s
    );
  }
  dispose() {
    this.dispatchEvent({ type: "dispose" });
  }
  transformUv(t) {
    if (this.mapping !== M1) return t;
    if ((t.applyMatrix3(this.matrix), t.x < 0 || t.x > 1))
      switch (this.wrapS) {
        case zg:
          t.x = t.x - Math.floor(t.x);
          break;
        case Va:
          t.x = t.x < 0 ? 0 : 1;
          break;
        case Eg:
          Math.abs(Math.floor(t.x) % 2) === 1
            ? (t.x = Math.ceil(t.x) - t.x)
            : (t.x = t.x - Math.floor(t.x));
          break;
      }
    if (t.y < 0 || t.y > 1)
      switch (this.wrapT) {
        case zg:
          t.y = t.y - Math.floor(t.y);
          break;
        case Va:
          t.y = t.y < 0 ? 0 : 1;
          break;
        case Eg:
          Math.abs(Math.floor(t.y) % 2) === 1
            ? (t.y = Math.ceil(t.y) - t.y)
            : (t.y = t.y - Math.floor(t.y));
          break;
      }
    return (this.flipY && (t.y = 1 - t.y), t);
  }
  set needsUpdate(t) {
    t === !0 && (this.version++, (this.source.needsUpdate = !0));
  }
  set needsPMREMUpdate(t) {
    t === !0 && this.pmremVersion++;
  }
}
Ue.DEFAULT_IMAGE = null;
Ue.DEFAULT_MAPPING = M1;
Ue.DEFAULT_ANISOTROPY = 1;
class Te {
  constructor(t = 0, i = 0, s = 0, o = 1) {
    ((Te.prototype.isVector4 = !0), (this.x = t), (this.y = i), (this.z = s), (this.w = o));
  }
  get width() {
    return this.z;
  }
  set width(t) {
    this.z = t;
  }
  get height() {
    return this.w;
  }
  set height(t) {
    this.w = t;
  }
  set(t, i, s, o) {
    return ((this.x = t), (this.y = i), (this.z = s), (this.w = o), this);
  }
  setScalar(t) {
    return ((this.x = t), (this.y = t), (this.z = t), (this.w = t), this);
  }
  setX(t) {
    return ((this.x = t), this);
  }
  setY(t) {
    return ((this.y = t), this);
  }
  setZ(t) {
    return ((this.z = t), this);
  }
  setW(t) {
    return ((this.w = t), this);
  }
  setComponent(t, i) {
    switch (t) {
      case 0:
        this.x = i;
        break;
      case 1:
        this.y = i;
        break;
      case 2:
        this.z = i;
        break;
      case 3:
        this.w = i;
        break;
      default:
        throw new Error("index is out of range: " + t);
    }
    return this;
  }
  getComponent(t) {
    switch (t) {
      case 0:
        return this.x;
      case 1:
        return this.y;
      case 2:
        return this.z;
      case 3:
        return this.w;
      default:
        throw new Error("index is out of range: " + t);
    }
  }
  clone() {
    return new this.constructor(this.x, this.y, this.z, this.w);
  }
  copy(t) {
    return (
      (this.x = t.x),
      (this.y = t.y),
      (this.z = t.z),
      (this.w = t.w !== void 0 ? t.w : 1),
      this
    );
  }
  add(t) {
    return ((this.x += t.x), (this.y += t.y), (this.z += t.z), (this.w += t.w), this);
  }
  addScalar(t) {
    return ((this.x += t), (this.y += t), (this.z += t), (this.w += t), this);
  }
  addVectors(t, i) {
    return (
      (this.x = t.x + i.x),
      (this.y = t.y + i.y),
      (this.z = t.z + i.z),
      (this.w = t.w + i.w),
      this
    );
  }
  addScaledVector(t, i) {
    return (
      (this.x += t.x * i),
      (this.y += t.y * i),
      (this.z += t.z * i),
      (this.w += t.w * i),
      this
    );
  }
  sub(t) {
    return ((this.x -= t.x), (this.y -= t.y), (this.z -= t.z), (this.w -= t.w), this);
  }
  subScalar(t) {
    return ((this.x -= t), (this.y -= t), (this.z -= t), (this.w -= t), this);
  }
  subVectors(t, i) {
    return (
      (this.x = t.x - i.x),
      (this.y = t.y - i.y),
      (this.z = t.z - i.z),
      (this.w = t.w - i.w),
      this
    );
  }
  multiply(t) {
    return ((this.x *= t.x), (this.y *= t.y), (this.z *= t.z), (this.w *= t.w), this);
  }
  multiplyScalar(t) {
    return ((this.x *= t), (this.y *= t), (this.z *= t), (this.w *= t), this);
  }
  applyMatrix4(t) {
    const i = this.x,
      s = this.y,
      o = this.z,
      l = this.w,
      u = t.elements;
    return (
      (this.x = u[0] * i + u[4] * s + u[8] * o + u[12] * l),
      (this.y = u[1] * i + u[5] * s + u[9] * o + u[13] * l),
      (this.z = u[2] * i + u[6] * s + u[10] * o + u[14] * l),
      (this.w = u[3] * i + u[7] * s + u[11] * o + u[15] * l),
      this
    );
  }
  divide(t) {
    return ((this.x /= t.x), (this.y /= t.y), (this.z /= t.z), (this.w /= t.w), this);
  }
  divideScalar(t) {
    return this.multiplyScalar(1 / t);
  }
  setAxisAngleFromQuaternion(t) {
    this.w = 2 * Math.acos(t.w);
    const i = Math.sqrt(1 - t.w * t.w);
    return (
      i < 1e-4
        ? ((this.x = 1), (this.y = 0), (this.z = 0))
        : ((this.x = t.x / i), (this.y = t.y / i), (this.z = t.z / i)),
      this
    );
  }
  setAxisAngleFromRotationMatrix(t) {
    let i, s, o, l;
    const h = t.elements,
      p = h[0],
      y = h[4],
      g = h[8],
      v = h[1],
      b = h[5],
      S = h[9],
      A = h[2],
      M = h[6],
      T = h[10];
    if (Math.abs(y - v) < 0.01 && Math.abs(g - A) < 0.01 && Math.abs(S - M) < 0.01) {
      if (
        Math.abs(y + v) < 0.1 &&
        Math.abs(g + A) < 0.1 &&
        Math.abs(S + M) < 0.1 &&
        Math.abs(p + b + T - 3) < 0.1
      )
        return (this.set(1, 0, 0, 0), this);
      i = Math.PI;
      const C = (p + 1) / 2,
        E = (b + 1) / 2,
        U = (T + 1) / 2,
        q = (y + v) / 4,
        X = (g + A) / 4,
        G = (S + M) / 4;
      return (
        C > E && C > U
          ? C < 0.01
            ? ((s = 0), (o = 0.707106781), (l = 0.707106781))
            : ((s = Math.sqrt(C)), (o = q / s), (l = X / s))
          : E > U
            ? E < 0.01
              ? ((s = 0.707106781), (o = 0), (l = 0.707106781))
              : ((o = Math.sqrt(E)), (s = q / o), (l = G / o))
            : U < 0.01
              ? ((s = 0.707106781), (o = 0.707106781), (l = 0))
              : ((l = Math.sqrt(U)), (s = X / l), (o = G / l)),
        this.set(s, o, l, i),
        this
      );
    }
    let O = Math.sqrt((M - S) * (M - S) + (g - A) * (g - A) + (v - y) * (v - y));
    return (
      Math.abs(O) < 0.001 && (O = 1),
      (this.x = (M - S) / O),
      (this.y = (g - A) / O),
      (this.z = (v - y) / O),
      (this.w = Math.acos((p + b + T - 1) / 2)),
      this
    );
  }
  setFromMatrixPosition(t) {
    const i = t.elements;
    return ((this.x = i[12]), (this.y = i[13]), (this.z = i[14]), (this.w = i[15]), this);
  }
  min(t) {
    return (
      (this.x = Math.min(this.x, t.x)),
      (this.y = Math.min(this.y, t.y)),
      (this.z = Math.min(this.z, t.z)),
      (this.w = Math.min(this.w, t.w)),
      this
    );
  }
  max(t) {
    return (
      (this.x = Math.max(this.x, t.x)),
      (this.y = Math.max(this.y, t.y)),
      (this.z = Math.max(this.z, t.z)),
      (this.w = Math.max(this.w, t.w)),
      this
    );
  }
  clamp(t, i) {
    return (
      (this.x = bt(this.x, t.x, i.x)),
      (this.y = bt(this.y, t.y, i.y)),
      (this.z = bt(this.z, t.z, i.z)),
      (this.w = bt(this.w, t.w, i.w)),
      this
    );
  }
  clampScalar(t, i) {
    return (
      (this.x = bt(this.x, t, i)),
      (this.y = bt(this.y, t, i)),
      (this.z = bt(this.z, t, i)),
      (this.w = bt(this.w, t, i)),
      this
    );
  }
  clampLength(t, i) {
    const s = this.length();
    return this.divideScalar(s || 1).multiplyScalar(bt(s, t, i));
  }
  floor() {
    return (
      (this.x = Math.floor(this.x)),
      (this.y = Math.floor(this.y)),
      (this.z = Math.floor(this.z)),
      (this.w = Math.floor(this.w)),
      this
    );
  }
  ceil() {
    return (
      (this.x = Math.ceil(this.x)),
      (this.y = Math.ceil(this.y)),
      (this.z = Math.ceil(this.z)),
      (this.w = Math.ceil(this.w)),
      this
    );
  }
  round() {
    return (
      (this.x = Math.round(this.x)),
      (this.y = Math.round(this.y)),
      (this.z = Math.round(this.z)),
      (this.w = Math.round(this.w)),
      this
    );
  }
  roundToZero() {
    return (
      (this.x = Math.trunc(this.x)),
      (this.y = Math.trunc(this.y)),
      (this.z = Math.trunc(this.z)),
      (this.w = Math.trunc(this.w)),
      this
    );
  }
  negate() {
    return ((this.x = -this.x), (this.y = -this.y), (this.z = -this.z), (this.w = -this.w), this);
  }
  dot(t) {
    return this.x * t.x + this.y * t.y + this.z * t.z + this.w * t.w;
  }
  lengthSq() {
    return this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w;
  }
  length() {
    return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w);
  }
  manhattanLength() {
    return Math.abs(this.x) + Math.abs(this.y) + Math.abs(this.z) + Math.abs(this.w);
  }
  normalize() {
    return this.divideScalar(this.length() || 1);
  }
  setLength(t) {
    return this.normalize().multiplyScalar(t);
  }
  lerp(t, i) {
    return (
      (this.x += (t.x - this.x) * i),
      (this.y += (t.y - this.y) * i),
      (this.z += (t.z - this.z) * i),
      (this.w += (t.w - this.w) * i),
      this
    );
  }
  lerpVectors(t, i, s) {
    return (
      (this.x = t.x + (i.x - t.x) * s),
      (this.y = t.y + (i.y - t.y) * s),
      (this.z = t.z + (i.z - t.z) * s),
      (this.w = t.w + (i.w - t.w) * s),
      this
    );
  }
  equals(t) {
    return t.x === this.x && t.y === this.y && t.z === this.z && t.w === this.w;
  }
  fromArray(t, i = 0) {
    return ((this.x = t[i]), (this.y = t[i + 1]), (this.z = t[i + 2]), (this.w = t[i + 3]), this);
  }
  toArray(t = [], i = 0) {
    return ((t[i] = this.x), (t[i + 1] = this.y), (t[i + 2] = this.z), (t[i + 3] = this.w), t);
  }
  fromBufferAttribute(t, i) {
    return (
      (this.x = t.getX(i)),
      (this.y = t.getY(i)),
      (this.z = t.getZ(i)),
      (this.w = t.getW(i)),
      this
    );
  }
  random() {
    return (
      (this.x = Math.random()),
      (this.y = Math.random()),
      (this.z = Math.random()),
      (this.w = Math.random()),
      this
    );
  }
  *[Symbol.iterator]() {
    (yield this.x, yield this.y, yield this.z, yield this.w);
  }
}
class Z3 extends Or {
  constructor(t = 1, i = 1, s = {}) {
    (super(),
      (s = Object.assign(
        {
          generateMipmaps: !1,
          internalFormat: null,
          minFilter: eu,
          depthBuffer: !0,
          stencilBuffer: !1,
          resolveDepthBuffer: !0,
          resolveStencilBuffer: !0,
          depthTexture: null,
          samples: 0,
          count: 1,
          depth: 1,
          multiview: !1,
        },
        s,
      )),
      (this.isRenderTarget = !0),
      (this.width = t),
      (this.height = i),
      (this.depth = s.depth),
      (this.scissor = new Te(0, 0, t, i)),
      (this.scissorTest = !1),
      (this.viewport = new Te(0, 0, t, i)));
    const o = { width: t, height: i, depth: s.depth },
      l = new Ue(o);
    this.textures = [];
    const u = s.count;
    for (let f = 0; f < u; f++)
      ((this.textures[f] = l.clone()),
        (this.textures[f].isRenderTargetTexture = !0),
        (this.textures[f].renderTarget = this));
    (this._setTextureOptions(s),
      (this.depthBuffer = s.depthBuffer),
      (this.stencilBuffer = s.stencilBuffer),
      (this.resolveDepthBuffer = s.resolveDepthBuffer),
      (this.resolveStencilBuffer = s.resolveStencilBuffer),
      (this._depthTexture = null),
      (this.depthTexture = s.depthTexture),
      (this.samples = s.samples),
      (this.multiview = s.multiview));
  }
  _setTextureOptions(t = {}) {
    const i = { minFilter: eu, generateMipmaps: !1, flipY: !1, internalFormat: null };
    (t.mapping !== void 0 && (i.mapping = t.mapping),
      t.wrapS !== void 0 && (i.wrapS = t.wrapS),
      t.wrapT !== void 0 && (i.wrapT = t.wrapT),
      t.wrapR !== void 0 && (i.wrapR = t.wrapR),
      t.magFilter !== void 0 && (i.magFilter = t.magFilter),
      t.minFilter !== void 0 && (i.minFilter = t.minFilter),
      t.format !== void 0 && (i.format = t.format),
      t.type !== void 0 && (i.type = t.type),
      t.anisotropy !== void 0 && (i.anisotropy = t.anisotropy),
      t.colorSpace !== void 0 && (i.colorSpace = t.colorSpace),
      t.flipY !== void 0 && (i.flipY = t.flipY),
      t.generateMipmaps !== void 0 && (i.generateMipmaps = t.generateMipmaps),
      t.internalFormat !== void 0 && (i.internalFormat = t.internalFormat));
    for (let s = 0; s < this.textures.length; s++) this.textures[s].setValues(i);
  }
  get texture() {
    return this.textures[0];
  }
  set texture(t) {
    this.textures[0] = t;
  }
  set depthTexture(t) {
    (this._depthTexture !== null && (this._depthTexture.renderTarget = null),
      t !== null && (t.renderTarget = this),
      (this._depthTexture = t));
  }
  get depthTexture() {
    return this._depthTexture;
  }
  setSize(t, i, s = 1) {
    if (this.width !== t || this.height !== i || this.depth !== s) {
      ((this.width = t), (this.height = i), (this.depth = s));
      for (let o = 0, l = this.textures.length; o < l; o++)
        ((this.textures[o].image.width = t),
          (this.textures[o].image.height = i),
          (this.textures[o].image.depth = s),
          (this.textures[o].isArrayTexture = this.textures[o].image.depth > 1));
      this.dispose();
    }
    (this.viewport.set(0, 0, t, i), this.scissor.set(0, 0, t, i));
  }
  clone() {
    return new this.constructor().copy(this);
  }
  copy(t) {
    ((this.width = t.width),
      (this.height = t.height),
      (this.depth = t.depth),
      this.scissor.copy(t.scissor),
      (this.scissorTest = t.scissorTest),
      this.viewport.copy(t.viewport),
      (this.textures.length = 0));
    for (let i = 0, s = t.textures.length; i < s; i++) {
      ((this.textures[i] = t.textures[i].clone()),
        (this.textures[i].isRenderTargetTexture = !0),
        (this.textures[i].renderTarget = this));
      const o = Object.assign({}, t.textures[i].image);
      this.textures[i].source = new $d(o);
    }
    return (
      (this.depthBuffer = t.depthBuffer),
      (this.stencilBuffer = t.stencilBuffer),
      (this.resolveDepthBuffer = t.resolveDepthBuffer),
      (this.resolveStencilBuffer = t.resolveStencilBuffer),
      t.depthTexture !== null && (this.depthTexture = t.depthTexture.clone()),
      (this.samples = t.samples),
      this
    );
  }
  dispose() {
    this.dispatchEvent({ type: "dispose" });
  }
}
class P3 extends Z3 {
  constructor(t = 1, i = 1, s = {}) {
    (super(t, i, s), (this.isWebGLRenderTarget = !0));
  }
}
class E4 extends Ue {
  constructor(t = null, i = 1, s = 1, o = 1) {
    (super(null),
      (this.isDataArrayTexture = !0),
      (this.image = { data: t, width: i, height: s, depth: o }),
      (this.magFilter = ns),
      (this.minFilter = ns),
      (this.wrapR = Va),
      (this.generateMipmaps = !1),
      (this.flipY = !1),
      (this.unpackAlignment = 1),
      (this.layerUpdates = new Set()));
  }
  addLayerUpdate(t) {
    this.layerUpdates.add(t);
  }
  clearLayerUpdates() {
    this.layerUpdates.clear();
  }
}
class R4 extends Ue {
  constructor(t = null, i = 1, s = 1, o = 1) {
    (super(null),
      (this.isData3DTexture = !0),
      (this.image = { data: t, width: i, height: s, depth: o }),
      (this.magFilter = ns),
      (this.minFilter = ns),
      (this.wrapR = Va),
      (this.generateMipmaps = !1),
      (this.flipY = !1),
      (this.unpackAlignment = 1));
  }
}
class as {
  constructor(t = new R(1 / 0, 1 / 0, 1 / 0), i = new R(-1 / 0, -1 / 0, -1 / 0)) {
    ((this.isBox3 = !0), (this.min = t), (this.max = i));
  }
  set(t, i) {
    return (this.min.copy(t), this.max.copy(i), this);
  }
  setFromArray(t) {
    this.makeEmpty();
    for (let i = 0, s = t.length; i < s; i += 3) this.expandByPoint(Ei.fromArray(t, i));
    return this;
  }
  setFromBufferAttribute(t) {
    this.makeEmpty();
    for (let i = 0, s = t.count; i < s; i++) this.expandByPoint(Ei.fromBufferAttribute(t, i));
    return this;
  }
  setFromPoints(t) {
    this.makeEmpty();
    for (let i = 0, s = t.length; i < s; i++) this.expandByPoint(t[i]);
    return this;
  }
  setFromCenterAndSize(t, i) {
    const s = Ei.copy(i).multiplyScalar(0.5);
    return (this.min.copy(t).sub(s), this.max.copy(t).add(s), this);
  }
  setFromObject(t, i = !1) {
    return (this.makeEmpty(), this.expandByObject(t, i));
  }
  clone() {
    return new this.constructor().copy(this);
  }
  copy(t) {
    return (this.min.copy(t.min), this.max.copy(t.max), this);
  }
  makeEmpty() {
    return (
      (this.min.x = this.min.y = this.min.z = 1 / 0),
      (this.max.x = this.max.y = this.max.z = -1 / 0),
      this
    );
  }
  isEmpty() {
    return this.max.x < this.min.x || this.max.y < this.min.y || this.max.z < this.min.z;
  }
  getCenter(t) {
    return this.isEmpty() ? t.set(0, 0, 0) : t.addVectors(this.min, this.max).multiplyScalar(0.5);
  }
  getSize(t) {
    return this.isEmpty() ? t.set(0, 0, 0) : t.subVectors(this.max, this.min);
  }
  expandByPoint(t) {
    return (this.min.min(t), this.max.max(t), this);
  }
  expandByVector(t) {
    return (this.min.sub(t), this.max.add(t), this);
  }
  expandByScalar(t) {
    return (this.min.addScalar(-t), this.max.addScalar(t), this);
  }
  expandByObject(t, i = !1) {
    t.updateWorldMatrix(!1, !1);
    const s = t.geometry;
    if (s !== void 0) {
      const l = s.getAttribute("position");
      if (i === !0 && l !== void 0 && t.isInstancedMesh !== !0)
        for (let u = 0, f = l.count; u < f; u++)
          (t.isMesh === !0 ? t.getVertexPosition(u, Ei) : Ei.fromBufferAttribute(l, u),
            Ei.applyMatrix4(t.matrixWorld),
            this.expandByPoint(Ei));
      else
        (t.boundingBox !== void 0
          ? (t.boundingBox === null && t.computeBoundingBox(), ec.copy(t.boundingBox))
          : (s.boundingBox === null && s.computeBoundingBox(), ec.copy(s.boundingBox)),
          ec.applyMatrix4(t.matrixWorld),
          this.union(ec));
    }
    const o = t.children;
    for (let l = 0, u = o.length; l < u; l++) this.expandByObject(o[l], i);
    return this;
  }
  containsPoint(t) {
    return (
      t.x >= this.min.x &&
      t.x <= this.max.x &&
      t.y >= this.min.y &&
      t.y <= this.max.y &&
      t.z >= this.min.z &&
      t.z <= this.max.z
    );
  }
  containsBox(t) {
    return (
      this.min.x <= t.min.x &&
      t.max.x <= this.max.x &&
      this.min.y <= t.min.y &&
      t.max.y <= this.max.y &&
      this.min.z <= t.min.z &&
      t.max.z <= this.max.z
    );
  }
  getParameter(t, i) {
    return i.set(
      (t.x - this.min.x) / (this.max.x - this.min.x),
      (t.y - this.min.y) / (this.max.y - this.min.y),
      (t.z - this.min.z) / (this.max.z - this.min.z),
    );
  }
  intersectsBox(t) {
    return (
      t.max.x >= this.min.x &&
      t.min.x <= this.max.x &&
      t.max.y >= this.min.y &&
      t.min.y <= this.max.y &&
      t.max.z >= this.min.z &&
      t.min.z <= this.max.z
    );
  }
  intersectsSphere(t) {
    return (this.clampPoint(t.center, Ei), Ei.distanceToSquared(t.center) <= t.radius * t.radius);
  }
  intersectsPlane(t) {
    let i, s;
    return (
      t.normal.x > 0
        ? ((i = t.normal.x * this.min.x), (s = t.normal.x * this.max.x))
        : ((i = t.normal.x * this.max.x), (s = t.normal.x * this.min.x)),
      t.normal.y > 0
        ? ((i += t.normal.y * this.min.y), (s += t.normal.y * this.max.y))
        : ((i += t.normal.y * this.max.y), (s += t.normal.y * this.min.y)),
      t.normal.z > 0
        ? ((i += t.normal.z * this.min.z), (s += t.normal.z * this.max.z))
        : ((i += t.normal.z * this.max.z), (s += t.normal.z * this.min.z)),
      i <= -t.constant && s >= -t.constant
    );
  }
  intersectsTriangle(t) {
    if (this.isEmpty()) return !1;
    (this.getCenter(Po),
      ic.subVectors(this.max, Po),
      Aa.subVectors(t.a, Po),
      Ma.subVectors(t.b, Po),
      _a.subVectors(t.c, Po),
      Jn.subVectors(Ma, Aa),
      Qn.subVectors(_a, Ma),
      Ts.subVectors(Aa, _a));
    let i = [
      0,
      -Jn.z,
      Jn.y,
      0,
      -Qn.z,
      Qn.y,
      0,
      -Ts.z,
      Ts.y,
      Jn.z,
      0,
      -Jn.x,
      Qn.z,
      0,
      -Qn.x,
      Ts.z,
      0,
      -Ts.x,
      -Jn.y,
      Jn.x,
      0,
      -Qn.y,
      Qn.x,
      0,
      -Ts.y,
      Ts.x,
      0,
    ];
    return !Kf(i, Aa, Ma, _a, ic) || ((i = [1, 0, 0, 0, 1, 0, 0, 0, 1]), !Kf(i, Aa, Ma, _a, ic))
      ? !1
      : (nc.crossVectors(Jn, Qn), (i = [nc.x, nc.y, nc.z]), Kf(i, Aa, Ma, _a, ic));
  }
  clampPoint(t, i) {
    return i.copy(t).clamp(this.min, this.max);
  }
  distanceToPoint(t) {
    return this.clampPoint(t, Ei).distanceTo(t);
  }
  getBoundingSphere(t) {
    return (
      this.isEmpty()
        ? t.makeEmpty()
        : (this.getCenter(t.center), (t.radius = this.getSize(Ei).length() * 0.5)),
      t
    );
  }
  intersect(t) {
    return (this.min.max(t.min), this.max.min(t.max), this.isEmpty() && this.makeEmpty(), this);
  }
  union(t) {
    return (this.min.min(t.min), this.max.max(t.max), this);
  }
  applyMatrix4(t) {
    return this.isEmpty()
      ? this
      : (un[0].set(this.min.x, this.min.y, this.min.z).applyMatrix4(t),
        un[1].set(this.min.x, this.min.y, this.max.z).applyMatrix4(t),
        un[2].set(this.min.x, this.max.y, this.min.z).applyMatrix4(t),
        un[3].set(this.min.x, this.max.y, this.max.z).applyMatrix4(t),
        un[4].set(this.max.x, this.min.y, this.min.z).applyMatrix4(t),
        un[5].set(this.max.x, this.min.y, this.max.z).applyMatrix4(t),
        un[6].set(this.max.x, this.max.y, this.min.z).applyMatrix4(t),
        un[7].set(this.max.x, this.max.y, this.max.z).applyMatrix4(t),
        this.setFromPoints(un),
        this);
  }
  translate(t) {
    return (this.min.add(t), this.max.add(t), this);
  }
  equals(t) {
    return t.min.equals(this.min) && t.max.equals(this.max);
  }
  toJSON() {
    return { min: this.min.toArray(), max: this.max.toArray() };
  }
  fromJSON(t) {
    return (this.min.fromArray(t.min), this.max.fromArray(t.max), this);
  }
}
const un = [new R(), new R(), new R(), new R(), new R(), new R(), new R(), new R()],
  Ei = new R(),
  ec = new as(),
  Aa = new R(),
  Ma = new R(),
  _a = new R(),
  Jn = new R(),
  Qn = new R(),
  Ts = new R(),
  Po = new R(),
  ic = new R(),
  nc = new R(),
  zs = new R();
function Kf(c, t, i, s, o) {
  for (let l = 0, u = c.length - 3; l <= u; l += 3) {
    zs.fromArray(c, l);
    const f = o.x * Math.abs(zs.x) + o.y * Math.abs(zs.y) + o.z * Math.abs(zs.z),
      h = t.dot(zs),
      p = i.dot(zs),
      y = s.dot(zs);
    if (Math.max(-Math.max(h, p, y), Math.min(h, p, y)) > f) return !1;
  }
  return !0;
}
const W3 = new as(),
  Wo = new R(),
  $f = new R();
class wn {
  constructor(t = new R(), i = -1) {
    ((this.isSphere = !0), (this.center = t), (this.radius = i));
  }
  set(t, i) {
    return (this.center.copy(t), (this.radius = i), this);
  }
  setFromPoints(t, i) {
    const s = this.center;
    i !== void 0 ? s.copy(i) : W3.setFromPoints(t).getCenter(s);
    let o = 0;
    for (let l = 0, u = t.length; l < u; l++) o = Math.max(o, s.distanceToSquared(t[l]));
    return ((this.radius = Math.sqrt(o)), this);
  }
  copy(t) {
    return (this.center.copy(t.center), (this.radius = t.radius), this);
  }
  isEmpty() {
    return this.radius < 0;
  }
  makeEmpty() {
    return (this.center.set(0, 0, 0), (this.radius = -1), this);
  }
  containsPoint(t) {
    return t.distanceToSquared(this.center) <= this.radius * this.radius;
  }
  distanceToPoint(t) {
    return t.distanceTo(this.center) - this.radius;
  }
  intersectsSphere(t) {
    const i = this.radius + t.radius;
    return t.center.distanceToSquared(this.center) <= i * i;
  }
  intersectsBox(t) {
    return t.intersectsSphere(this);
  }
  intersectsPlane(t) {
    return Math.abs(t.distanceToPoint(this.center)) <= this.radius;
  }
  clampPoint(t, i) {
    const s = this.center.distanceToSquared(t);
    return (
      i.copy(t),
      s > this.radius * this.radius &&
        (i.sub(this.center).normalize(), i.multiplyScalar(this.radius).add(this.center)),
      i
    );
  }
  getBoundingBox(t) {
    return this.isEmpty()
      ? (t.makeEmpty(), t)
      : (t.set(this.center, this.center), t.expandByScalar(this.radius), t);
  }
  applyMatrix4(t) {
    return (this.center.applyMatrix4(t), (this.radius = this.radius * t.getMaxScaleOnAxis()), this);
  }
  translate(t) {
    return (this.center.add(t), this);
  }
  expandByPoint(t) {
    if (this.isEmpty()) return (this.center.copy(t), (this.radius = 0), this);
    Wo.subVectors(t, this.center);
    const i = Wo.lengthSq();
    if (i > this.radius * this.radius) {
      const s = Math.sqrt(i),
        o = (s - this.radius) * 0.5;
      (this.center.addScaledVector(Wo, o / s), (this.radius += o));
    }
    return this;
  }
  union(t) {
    return t.isEmpty()
      ? this
      : this.isEmpty()
        ? (this.copy(t), this)
        : (this.center.equals(t.center) === !0
            ? (this.radius = Math.max(this.radius, t.radius))
            : ($f.subVectors(t.center, this.center).setLength(t.radius),
              this.expandByPoint(Wo.copy(t.center).add($f)),
              this.expandByPoint(Wo.copy(t.center).sub($f))),
          this);
  }
  equals(t) {
    return t.center.equals(this.center) && t.radius === this.radius;
  }
  clone() {
    return new this.constructor().copy(this);
  }
  toJSON() {
    return { radius: this.radius, center: this.center.toArray() };
  }
  fromJSON(t) {
    return ((this.radius = t.radius), this.center.fromArray(t.center), this);
  }
}
const hn = new R(),
  td = new R(),
  sc = new R(),
  Kn = new R(),
  ed = new R(),
  ac = new R(),
  id = new R();
class gu {
  constructor(t = new R(), i = new R(0, 0, -1)) {
    ((this.origin = t), (this.direction = i));
  }
  set(t, i) {
    return (this.origin.copy(t), this.direction.copy(i), this);
  }
  copy(t) {
    return (this.origin.copy(t.origin), this.direction.copy(t.direction), this);
  }
  at(t, i) {
    return i.copy(this.origin).addScaledVector(this.direction, t);
  }
  lookAt(t) {
    return (this.direction.copy(t).sub(this.origin).normalize(), this);
  }
  recast(t) {
    return (this.origin.copy(this.at(t, hn)), this);
  }
  closestPointToPoint(t, i) {
    i.subVectors(t, this.origin);
    const s = i.dot(this.direction);
    return s < 0 ? i.copy(this.origin) : i.copy(this.origin).addScaledVector(this.direction, s);
  }
  distanceToPoint(t) {
    return Math.sqrt(this.distanceSqToPoint(t));
  }
  distanceSqToPoint(t) {
    const i = hn.subVectors(t, this.origin).dot(this.direction);
    return i < 0
      ? this.origin.distanceToSquared(t)
      : (hn.copy(this.origin).addScaledVector(this.direction, i), hn.distanceToSquared(t));
  }
  distanceSqToSegment(t, i, s, o) {
    (td.copy(t).add(i).multiplyScalar(0.5),
      sc.copy(i).sub(t).normalize(),
      Kn.copy(this.origin).sub(td));
    const l = t.distanceTo(i) * 0.5,
      u = -this.direction.dot(sc),
      f = Kn.dot(this.direction),
      h = -Kn.dot(sc),
      p = Kn.lengthSq(),
      y = Math.abs(1 - u * u);
    let g, v, b, S;
    if (y > 0)
      if (((g = u * h - f), (v = u * f - h), (S = l * y), g >= 0))
        if (v >= -S)
          if (v <= S) {
            const A = 1 / y;
            ((g *= A), (v *= A), (b = g * (g + u * v + 2 * f) + v * (u * g + v + 2 * h) + p));
          } else ((v = l), (g = Math.max(0, -(u * v + f))), (b = -g * g + v * (v + 2 * h) + p));
        else ((v = -l), (g = Math.max(0, -(u * v + f))), (b = -g * g + v * (v + 2 * h) + p));
      else
        v <= -S
          ? ((g = Math.max(0, -(-u * l + f))),
            (v = g > 0 ? -l : Math.min(Math.max(-l, -h), l)),
            (b = -g * g + v * (v + 2 * h) + p))
          : v <= S
            ? ((g = 0), (v = Math.min(Math.max(-l, -h), l)), (b = v * (v + 2 * h) + p))
            : ((g = Math.max(0, -(u * l + f))),
              (v = g > 0 ? l : Math.min(Math.max(-l, -h), l)),
              (b = -g * g + v * (v + 2 * h) + p));
    else
      ((v = u > 0 ? -l : l), (g = Math.max(0, -(u * v + f))), (b = -g * g + v * (v + 2 * h) + p));
    return (
      s && s.copy(this.origin).addScaledVector(this.direction, g),
      o && o.copy(td).addScaledVector(sc, v),
      b
    );
  }
  intersectSphere(t, i) {
    hn.subVectors(t.center, this.origin);
    const s = hn.dot(this.direction),
      o = hn.dot(hn) - s * s,
      l = t.radius * t.radius;
    if (o > l) return null;
    const u = Math.sqrt(l - o),
      f = s - u,
      h = s + u;
    return h < 0 ? null : f < 0 ? this.at(h, i) : this.at(f, i);
  }
  intersectsSphere(t) {
    return t.radius < 0 ? !1 : this.distanceSqToPoint(t.center) <= t.radius * t.radius;
  }
  distanceToPlane(t) {
    const i = t.normal.dot(this.direction);
    if (i === 0) return t.distanceToPoint(this.origin) === 0 ? 0 : null;
    const s = -(this.origin.dot(t.normal) + t.constant) / i;
    return s >= 0 ? s : null;
  }
  intersectPlane(t, i) {
    const s = this.distanceToPlane(t);
    return s === null ? null : this.at(s, i);
  }
  intersectsPlane(t) {
    const i = t.distanceToPoint(this.origin);
    return i === 0 || t.normal.dot(this.direction) * i < 0;
  }
  intersectBox(t, i) {
    let s, o, l, u, f, h;
    const p = 1 / this.direction.x,
      y = 1 / this.direction.y,
      g = 1 / this.direction.z,
      v = this.origin;
    return (
      p >= 0
        ? ((s = (t.min.x - v.x) * p), (o = (t.max.x - v.x) * p))
        : ((s = (t.max.x - v.x) * p), (o = (t.min.x - v.x) * p)),
      y >= 0
        ? ((l = (t.min.y - v.y) * y), (u = (t.max.y - v.y) * y))
        : ((l = (t.max.y - v.y) * y), (u = (t.min.y - v.y) * y)),
      s > u ||
      l > o ||
      ((l > s || isNaN(s)) && (s = l),
      (u < o || isNaN(o)) && (o = u),
      g >= 0
        ? ((f = (t.min.z - v.z) * g), (h = (t.max.z - v.z) * g))
        : ((f = (t.max.z - v.z) * g), (h = (t.min.z - v.z) * g)),
      s > h || f > o) ||
      ((f > s || s !== s) && (s = f), (h < o || o !== o) && (o = h), o < 0)
        ? null
        : this.at(s >= 0 ? s : o, i)
    );
  }
  intersectsBox(t) {
    return this.intersectBox(t, hn) !== null;
  }
  intersectTriangle(t, i, s, o, l) {
    (ed.subVectors(i, t), ac.subVectors(s, t), id.crossVectors(ed, ac));
    let u = this.direction.dot(id),
      f;
    if (u > 0) {
      if (o) return null;
      f = 1;
    } else if (u < 0) ((f = -1), (u = -u));
    else return null;
    Kn.subVectors(this.origin, t);
    const h = f * this.direction.dot(ac.crossVectors(Kn, ac));
    if (h < 0) return null;
    const p = f * this.direction.dot(ed.cross(Kn));
    if (p < 0 || h + p > u) return null;
    const y = -f * Kn.dot(id);
    return y < 0 ? null : this.at(y / u, l);
  }
  applyMatrix4(t) {
    return (this.origin.applyMatrix4(t), this.direction.transformDirection(t), this);
  }
  equals(t) {
    return t.origin.equals(this.origin) && t.direction.equals(this.direction);
  }
  clone() {
    return new this.constructor().copy(this);
  }
}
class Ct {
  constructor(t, i, s, o, l, u, f, h, p, y, g, v, b, S, A, M) {
    ((Ct.prototype.isMatrix4 = !0),
      (this.elements = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]),
      t !== void 0 && this.set(t, i, s, o, l, u, f, h, p, y, g, v, b, S, A, M));
  }
  set(t, i, s, o, l, u, f, h, p, y, g, v, b, S, A, M) {
    const T = this.elements;
    return (
      (T[0] = t),
      (T[4] = i),
      (T[8] = s),
      (T[12] = o),
      (T[1] = l),
      (T[5] = u),
      (T[9] = f),
      (T[13] = h),
      (T[2] = p),
      (T[6] = y),
      (T[10] = g),
      (T[14] = v),
      (T[3] = b),
      (T[7] = S),
      (T[11] = A),
      (T[15] = M),
      this
    );
  }
  identity() {
    return (this.set(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1), this);
  }
  clone() {
    return new Ct().fromArray(this.elements);
  }
  copy(t) {
    const i = this.elements,
      s = t.elements;
    return (
      (i[0] = s[0]),
      (i[1] = s[1]),
      (i[2] = s[2]),
      (i[3] = s[3]),
      (i[4] = s[4]),
      (i[5] = s[5]),
      (i[6] = s[6]),
      (i[7] = s[7]),
      (i[8] = s[8]),
      (i[9] = s[9]),
      (i[10] = s[10]),
      (i[11] = s[11]),
      (i[12] = s[12]),
      (i[13] = s[13]),
      (i[14] = s[14]),
      (i[15] = s[15]),
      this
    );
  }
  copyPosition(t) {
    const i = this.elements,
      s = t.elements;
    return ((i[12] = s[12]), (i[13] = s[13]), (i[14] = s[14]), this);
  }
  setFromMatrix3(t) {
    const i = t.elements;
    return (
      this.set(i[0], i[3], i[6], 0, i[1], i[4], i[7], 0, i[2], i[5], i[8], 0, 0, 0, 0, 1),
      this
    );
  }
  extractBasis(t, i, s) {
    return (
      t.setFromMatrixColumn(this, 0),
      i.setFromMatrixColumn(this, 1),
      s.setFromMatrixColumn(this, 2),
      this
    );
  }
  makeBasis(t, i, s) {
    return (this.set(t.x, i.x, s.x, 0, t.y, i.y, s.y, 0, t.z, i.z, s.z, 0, 0, 0, 0, 1), this);
  }
  extractRotation(t) {
    const i = this.elements,
      s = t.elements,
      o = 1 / Ta.setFromMatrixColumn(t, 0).length(),
      l = 1 / Ta.setFromMatrixColumn(t, 1).length(),
      u = 1 / Ta.setFromMatrixColumn(t, 2).length();
    return (
      (i[0] = s[0] * o),
      (i[1] = s[1] * o),
      (i[2] = s[2] * o),
      (i[3] = 0),
      (i[4] = s[4] * l),
      (i[5] = s[5] * l),
      (i[6] = s[6] * l),
      (i[7] = 0),
      (i[8] = s[8] * u),
      (i[9] = s[9] * u),
      (i[10] = s[10] * u),
      (i[11] = 0),
      (i[12] = 0),
      (i[13] = 0),
      (i[14] = 0),
      (i[15] = 1),
      this
    );
  }
  makeRotationFromEuler(t) {
    const i = this.elements,
      s = t.x,
      o = t.y,
      l = t.z,
      u = Math.cos(s),
      f = Math.sin(s),
      h = Math.cos(o),
      p = Math.sin(o),
      y = Math.cos(l),
      g = Math.sin(l);
    if (t.order === "XYZ") {
      const v = u * y,
        b = u * g,
        S = f * y,
        A = f * g;
      ((i[0] = h * y),
        (i[4] = -h * g),
        (i[8] = p),
        (i[1] = b + S * p),
        (i[5] = v - A * p),
        (i[9] = -f * h),
        (i[2] = A - v * p),
        (i[6] = S + b * p),
        (i[10] = u * h));
    } else if (t.order === "YXZ") {
      const v = h * y,
        b = h * g,
        S = p * y,
        A = p * g;
      ((i[0] = v + A * f),
        (i[4] = S * f - b),
        (i[8] = u * p),
        (i[1] = u * g),
        (i[5] = u * y),
        (i[9] = -f),
        (i[2] = b * f - S),
        (i[6] = A + v * f),
        (i[10] = u * h));
    } else if (t.order === "ZXY") {
      const v = h * y,
        b = h * g,
        S = p * y,
        A = p * g;
      ((i[0] = v - A * f),
        (i[4] = -u * g),
        (i[8] = S + b * f),
        (i[1] = b + S * f),
        (i[5] = u * y),
        (i[9] = A - v * f),
        (i[2] = -u * p),
        (i[6] = f),
        (i[10] = u * h));
    } else if (t.order === "ZYX") {
      const v = u * y,
        b = u * g,
        S = f * y,
        A = f * g;
      ((i[0] = h * y),
        (i[4] = S * p - b),
        (i[8] = v * p + A),
        (i[1] = h * g),
        (i[5] = A * p + v),
        (i[9] = b * p - S),
        (i[2] = -p),
        (i[6] = f * h),
        (i[10] = u * h));
    } else if (t.order === "YZX") {
      const v = u * h,
        b = u * p,
        S = f * h,
        A = f * p;
      ((i[0] = h * y),
        (i[4] = A - v * g),
        (i[8] = S * g + b),
        (i[1] = g),
        (i[5] = u * y),
        (i[9] = -f * y),
        (i[2] = -p * y),
        (i[6] = b * g + S),
        (i[10] = v - A * g));
    } else if (t.order === "XZY") {
      const v = u * h,
        b = u * p,
        S = f * h,
        A = f * p;
      ((i[0] = h * y),
        (i[4] = -g),
        (i[8] = p * y),
        (i[1] = v * g + A),
        (i[5] = u * y),
        (i[9] = b * g - S),
        (i[2] = S * g - b),
        (i[6] = f * y),
        (i[10] = A * g + v));
    }
    return (
      (i[3] = 0),
      (i[7] = 0),
      (i[11] = 0),
      (i[12] = 0),
      (i[13] = 0),
      (i[14] = 0),
      (i[15] = 1),
      this
    );
  }
  makeRotationFromQuaternion(t) {
    return this.compose(J3, t, Q3);
  }
  lookAt(t, i, s) {
    const o = this.elements;
    return (
      ii.subVectors(t, i),
      ii.lengthSq() === 0 && (ii.z = 1),
      ii.normalize(),
      $n.crossVectors(s, ii),
      $n.lengthSq() === 0 &&
        (Math.abs(s.z) === 1 ? (ii.x += 1e-4) : (ii.z += 1e-4),
        ii.normalize(),
        $n.crossVectors(s, ii)),
      $n.normalize(),
      oc.crossVectors(ii, $n),
      (o[0] = $n.x),
      (o[4] = oc.x),
      (o[8] = ii.x),
      (o[1] = $n.y),
      (o[5] = oc.y),
      (o[9] = ii.y),
      (o[2] = $n.z),
      (o[6] = oc.z),
      (o[10] = ii.z),
      this
    );
  }
  multiply(t) {
    return this.multiplyMatrices(this, t);
  }
  premultiply(t) {
    return this.multiplyMatrices(t, this);
  }
  multiplyMatrices(t, i) {
    const s = t.elements,
      o = i.elements,
      l = this.elements,
      u = s[0],
      f = s[4],
      h = s[8],
      p = s[12],
      y = s[1],
      g = s[5],
      v = s[9],
      b = s[13],
      S = s[2],
      A = s[6],
      M = s[10],
      T = s[14],
      O = s[3],
      C = s[7],
      E = s[11],
      U = s[15],
      q = o[0],
      X = o[4],
      G = o[8],
      W = o[12],
      P = o[1],
      Q = o[5],
      rt = o[9],
      ht = o[13],
      xt = o[2],
      ft = o[6],
      L = o[10],
      I = o[14],
      nt = o[3],
      lt = o[7],
      ut = o[11],
      gt = o[15];
    return (
      (l[0] = u * q + f * P + h * xt + p * nt),
      (l[4] = u * X + f * Q + h * ft + p * lt),
      (l[8] = u * G + f * rt + h * L + p * ut),
      (l[12] = u * W + f * ht + h * I + p * gt),
      (l[1] = y * q + g * P + v * xt + b * nt),
      (l[5] = y * X + g * Q + v * ft + b * lt),
      (l[9] = y * G + g * rt + v * L + b * ut),
      (l[13] = y * W + g * ht + v * I + b * gt),
      (l[2] = S * q + A * P + M * xt + T * nt),
      (l[6] = S * X + A * Q + M * ft + T * lt),
      (l[10] = S * G + A * rt + M * L + T * ut),
      (l[14] = S * W + A * ht + M * I + T * gt),
      (l[3] = O * q + C * P + E * xt + U * nt),
      (l[7] = O * X + C * Q + E * ft + U * lt),
      (l[11] = O * G + C * rt + E * L + U * ut),
      (l[15] = O * W + C * ht + E * I + U * gt),
      this
    );
  }
  multiplyScalar(t) {
    const i = this.elements;
    return (
      (i[0] *= t),
      (i[4] *= t),
      (i[8] *= t),
      (i[12] *= t),
      (i[1] *= t),
      (i[5] *= t),
      (i[9] *= t),
      (i[13] *= t),
      (i[2] *= t),
      (i[6] *= t),
      (i[10] *= t),
      (i[14] *= t),
      (i[3] *= t),
      (i[7] *= t),
      (i[11] *= t),
      (i[15] *= t),
      this
    );
  }
  determinant() {
    const t = this.elements,
      i = t[0],
      s = t[4],
      o = t[8],
      l = t[12],
      u = t[1],
      f = t[5],
      h = t[9],
      p = t[13],
      y = t[2],
      g = t[6],
      v = t[10],
      b = t[14],
      S = t[3],
      A = t[7],
      M = t[11],
      T = t[15];
    return (
      S * (+l * h * g - o * p * g - l * f * v + s * p * v + o * f * b - s * h * b) +
      A * (+i * h * b - i * p * v + l * u * v - o * u * b + o * p * y - l * h * y) +
      M * (+i * p * g - i * f * b - l * u * g + s * u * b + l * f * y - s * p * y) +
      T * (-o * f * y - i * h * g + i * f * v + o * u * g - s * u * v + s * h * y)
    );
  }
  transpose() {
    const t = this.elements;
    let i;
    return (
      (i = t[1]),
      (t[1] = t[4]),
      (t[4] = i),
      (i = t[2]),
      (t[2] = t[8]),
      (t[8] = i),
      (i = t[6]),
      (t[6] = t[9]),
      (t[9] = i),
      (i = t[3]),
      (t[3] = t[12]),
      (t[12] = i),
      (i = t[7]),
      (t[7] = t[13]),
      (t[13] = i),
      (i = t[11]),
      (t[11] = t[14]),
      (t[14] = i),
      this
    );
  }
  setPosition(t, i, s) {
    const o = this.elements;
    return (
      t.isVector3
        ? ((o[12] = t.x), (o[13] = t.y), (o[14] = t.z))
        : ((o[12] = t), (o[13] = i), (o[14] = s)),
      this
    );
  }
  invert() {
    const t = this.elements,
      i = t[0],
      s = t[1],
      o = t[2],
      l = t[3],
      u = t[4],
      f = t[5],
      h = t[6],
      p = t[7],
      y = t[8],
      g = t[9],
      v = t[10],
      b = t[11],
      S = t[12],
      A = t[13],
      M = t[14],
      T = t[15],
      O = g * M * p - A * v * p + A * h * b - f * M * b - g * h * T + f * v * T,
      C = S * v * p - y * M * p - S * h * b + u * M * b + y * h * T - u * v * T,
      E = y * A * p - S * g * p + S * f * b - u * A * b - y * f * T + u * g * T,
      U = S * g * h - y * A * h - S * f * v + u * A * v + y * f * M - u * g * M,
      q = i * O + s * C + o * E + l * U;
    if (q === 0) return this.set(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
    const X = 1 / q;
    return (
      (t[0] = O * X),
      (t[1] = (A * v * l - g * M * l - A * o * b + s * M * b + g * o * T - s * v * T) * X),
      (t[2] = (f * M * l - A * h * l + A * o * p - s * M * p - f * o * T + s * h * T) * X),
      (t[3] = (g * h * l - f * v * l - g * o * p + s * v * p + f * o * b - s * h * b) * X),
      (t[4] = C * X),
      (t[5] = (y * M * l - S * v * l + S * o * b - i * M * b - y * o * T + i * v * T) * X),
      (t[6] = (S * h * l - u * M * l - S * o * p + i * M * p + u * o * T - i * h * T) * X),
      (t[7] = (u * v * l - y * h * l + y * o * p - i * v * p - u * o * b + i * h * b) * X),
      (t[8] = E * X),
      (t[9] = (S * g * l - y * A * l - S * s * b + i * A * b + y * s * T - i * g * T) * X),
      (t[10] = (u * A * l - S * f * l + S * s * p - i * A * p - u * s * T + i * f * T) * X),
      (t[11] = (y * f * l - u * g * l - y * s * p + i * g * p + u * s * b - i * f * b) * X),
      (t[12] = U * X),
      (t[13] = (y * A * o - S * g * o + S * s * v - i * A * v - y * s * M + i * g * M) * X),
      (t[14] = (S * f * o - u * A * o - S * s * h + i * A * h + u * s * M - i * f * M) * X),
      (t[15] = (u * g * o - y * f * o + y * s * h - i * g * h - u * s * v + i * f * v) * X),
      this
    );
  }
  scale(t) {
    const i = this.elements,
      s = t.x,
      o = t.y,
      l = t.z;
    return (
      (i[0] *= s),
      (i[4] *= o),
      (i[8] *= l),
      (i[1] *= s),
      (i[5] *= o),
      (i[9] *= l),
      (i[2] *= s),
      (i[6] *= o),
      (i[10] *= l),
      (i[3] *= s),
      (i[7] *= o),
      (i[11] *= l),
      this
    );
  }
  getMaxScaleOnAxis() {
    const t = this.elements,
      i = t[0] * t[0] + t[1] * t[1] + t[2] * t[2],
      s = t[4] * t[4] + t[5] * t[5] + t[6] * t[6],
      o = t[8] * t[8] + t[9] * t[9] + t[10] * t[10];
    return Math.sqrt(Math.max(i, s, o));
  }
  makeTranslation(t, i, s) {
    return (
      t.isVector3
        ? this.set(1, 0, 0, t.x, 0, 1, 0, t.y, 0, 0, 1, t.z, 0, 0, 0, 1)
        : this.set(1, 0, 0, t, 0, 1, 0, i, 0, 0, 1, s, 0, 0, 0, 1),
      this
    );
  }
  makeRotationX(t) {
    const i = Math.cos(t),
      s = Math.sin(t);
    return (this.set(1, 0, 0, 0, 0, i, -s, 0, 0, s, i, 0, 0, 0, 0, 1), this);
  }
  makeRotationY(t) {
    const i = Math.cos(t),
      s = Math.sin(t);
    return (this.set(i, 0, s, 0, 0, 1, 0, 0, -s, 0, i, 0, 0, 0, 0, 1), this);
  }
  makeRotationZ(t) {
    const i = Math.cos(t),
      s = Math.sin(t);
    return (this.set(i, -s, 0, 0, s, i, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1), this);
  }
  makeRotationAxis(t, i) {
    const s = Math.cos(i),
      o = Math.sin(i),
      l = 1 - s,
      u = t.x,
      f = t.y,
      h = t.z,
      p = l * u,
      y = l * f;
    return (
      this.set(
        p * u + s,
        p * f - o * h,
        p * h + o * f,
        0,
        p * f + o * h,
        y * f + s,
        y * h - o * u,
        0,
        p * h - o * f,
        y * h + o * u,
        l * h * h + s,
        0,
        0,
        0,
        0,
        1,
      ),
      this
    );
  }
  makeScale(t, i, s) {
    return (this.set(t, 0, 0, 0, 0, i, 0, 0, 0, 0, s, 0, 0, 0, 0, 1), this);
  }
  makeShear(t, i, s, o, l, u) {
    return (this.set(1, s, l, 0, t, 1, u, 0, i, o, 1, 0, 0, 0, 0, 1), this);
  }
  compose(t, i, s) {
    const o = this.elements,
      l = i._x,
      u = i._y,
      f = i._z,
      h = i._w,
      p = l + l,
      y = u + u,
      g = f + f,
      v = l * p,
      b = l * y,
      S = l * g,
      A = u * y,
      M = u * g,
      T = f * g,
      O = h * p,
      C = h * y,
      E = h * g,
      U = s.x,
      q = s.y,
      X = s.z;
    return (
      (o[0] = (1 - (A + T)) * U),
      (o[1] = (b + E) * U),
      (o[2] = (S - C) * U),
      (o[3] = 0),
      (o[4] = (b - E) * q),
      (o[5] = (1 - (v + T)) * q),
      (o[6] = (M + O) * q),
      (o[7] = 0),
      (o[8] = (S + C) * X),
      (o[9] = (M - O) * X),
      (o[10] = (1 - (v + A)) * X),
      (o[11] = 0),
      (o[12] = t.x),
      (o[13] = t.y),
      (o[14] = t.z),
      (o[15] = 1),
      this
    );
  }
  decompose(t, i, s) {
    const o = this.elements;
    let l = Ta.set(o[0], o[1], o[2]).length();
    const u = Ta.set(o[4], o[5], o[6]).length(),
      f = Ta.set(o[8], o[9], o[10]).length();
    (this.determinant() < 0 && (l = -l),
      (t.x = o[12]),
      (t.y = o[13]),
      (t.z = o[14]),
      Ri.copy(this));
    const p = 1 / l,
      y = 1 / u,
      g = 1 / f;
    return (
      (Ri.elements[0] *= p),
      (Ri.elements[1] *= p),
      (Ri.elements[2] *= p),
      (Ri.elements[4] *= y),
      (Ri.elements[5] *= y),
      (Ri.elements[6] *= y),
      (Ri.elements[8] *= g),
      (Ri.elements[9] *= g),
      (Ri.elements[10] *= g),
      i.setFromRotationMatrix(Ri),
      (s.x = l),
      (s.y = u),
      (s.z = f),
      this
    );
  }
  makePerspective(t, i, s, o, l, u, f = is, h = !1) {
    const p = this.elements,
      y = (2 * l) / (i - t),
      g = (2 * l) / (s - o),
      v = (i + t) / (i - t),
      b = (s + o) / (s - o);
    let S, A;
    if (h) ((S = l / (u - l)), (A = (u * l) / (u - l)));
    else if (f === is) ((S = -(u + l) / (u - l)), (A = (-2 * u * l) / (u - l)));
    else if (f === nu) ((S = -u / (u - l)), (A = (-u * l) / (u - l)));
    else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: " + f);
    return (
      (p[0] = y),
      (p[4] = 0),
      (p[8] = v),
      (p[12] = 0),
      (p[1] = 0),
      (p[5] = g),
      (p[9] = b),
      (p[13] = 0),
      (p[2] = 0),
      (p[6] = 0),
      (p[10] = S),
      (p[14] = A),
      (p[3] = 0),
      (p[7] = 0),
      (p[11] = -1),
      (p[15] = 0),
      this
    );
  }
  makeOrthographic(t, i, s, o, l, u, f = is, h = !1) {
    const p = this.elements,
      y = 2 / (i - t),
      g = 2 / (s - o),
      v = -(i + t) / (i - t),
      b = -(s + o) / (s - o);
    let S, A;
    if (h) ((S = 1 / (u - l)), (A = u / (u - l)));
    else if (f === is) ((S = -2 / (u - l)), (A = -(u + l) / (u - l)));
    else if (f === nu) ((S = -1 / (u - l)), (A = -l / (u - l)));
    else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: " + f);
    return (
      (p[0] = y),
      (p[4] = 0),
      (p[8] = 0),
      (p[12] = v),
      (p[1] = 0),
      (p[5] = g),
      (p[9] = 0),
      (p[13] = b),
      (p[2] = 0),
      (p[6] = 0),
      (p[10] = S),
      (p[14] = A),
      (p[3] = 0),
      (p[7] = 0),
      (p[11] = 0),
      (p[15] = 1),
      this
    );
  }
  equals(t) {
    const i = this.elements,
      s = t.elements;
    for (let o = 0; o < 16; o++) if (i[o] !== s[o]) return !1;
    return !0;
  }
  fromArray(t, i = 0) {
    for (let s = 0; s < 16; s++) this.elements[s] = t[s + i];
    return this;
  }
  toArray(t = [], i = 0) {
    const s = this.elements;
    return (
      (t[i] = s[0]),
      (t[i + 1] = s[1]),
      (t[i + 2] = s[2]),
      (t[i + 3] = s[3]),
      (t[i + 4] = s[4]),
      (t[i + 5] = s[5]),
      (t[i + 6] = s[6]),
      (t[i + 7] = s[7]),
      (t[i + 8] = s[8]),
      (t[i + 9] = s[9]),
      (t[i + 10] = s[10]),
      (t[i + 11] = s[11]),
      (t[i + 12] = s[12]),
      (t[i + 13] = s[13]),
      (t[i + 14] = s[14]),
      (t[i + 15] = s[15]),
      t
    );
  }
}
const Ta = new R(),
  Ri = new Ct(),
  J3 = new R(0, 0, 0),
  Q3 = new R(1, 1, 1),
  $n = new R(),
  oc = new R(),
  ii = new R(),
  jg = new Ct(),
  Yg = new Pa();
class ss {
  constructor(t = 0, i = 0, s = 0, o = ss.DEFAULT_ORDER) {
    ((this.isEuler = !0), (this._x = t), (this._y = i), (this._z = s), (this._order = o));
  }
  get x() {
    return this._x;
  }
  set x(t) {
    ((this._x = t), this._onChangeCallback());
  }
  get y() {
    return this._y;
  }
  set y(t) {
    ((this._y = t), this._onChangeCallback());
  }
  get z() {
    return this._z;
  }
  set z(t) {
    ((this._z = t), this._onChangeCallback());
  }
  get order() {
    return this._order;
  }
  set order(t) {
    ((this._order = t), this._onChangeCallback());
  }
  set(t, i, s, o = this._order) {
    return (
      (this._x = t),
      (this._y = i),
      (this._z = s),
      (this._order = o),
      this._onChangeCallback(),
      this
    );
  }
  clone() {
    return new this.constructor(this._x, this._y, this._z, this._order);
  }
  copy(t) {
    return (
      (this._x = t._x),
      (this._y = t._y),
      (this._z = t._z),
      (this._order = t._order),
      this._onChangeCallback(),
      this
    );
  }
  setFromRotationMatrix(t, i = this._order, s = !0) {
    const o = t.elements,
      l = o[0],
      u = o[4],
      f = o[8],
      h = o[1],
      p = o[5],
      y = o[9],
      g = o[2],
      v = o[6],
      b = o[10];
    switch (i) {
      case "XYZ":
        ((this._y = Math.asin(bt(f, -1, 1))),
          Math.abs(f) < 0.9999999
            ? ((this._x = Math.atan2(-y, b)), (this._z = Math.atan2(-u, l)))
            : ((this._x = Math.atan2(v, p)), (this._z = 0)));
        break;
      case "YXZ":
        ((this._x = Math.asin(-bt(y, -1, 1))),
          Math.abs(y) < 0.9999999
            ? ((this._y = Math.atan2(f, b)), (this._z = Math.atan2(h, p)))
            : ((this._y = Math.atan2(-g, l)), (this._z = 0)));
        break;
      case "ZXY":
        ((this._x = Math.asin(bt(v, -1, 1))),
          Math.abs(v) < 0.9999999
            ? ((this._y = Math.atan2(-g, b)), (this._z = Math.atan2(-u, p)))
            : ((this._y = 0), (this._z = Math.atan2(h, l))));
        break;
      case "ZYX":
        ((this._y = Math.asin(-bt(g, -1, 1))),
          Math.abs(g) < 0.9999999
            ? ((this._x = Math.atan2(v, b)), (this._z = Math.atan2(h, l)))
            : ((this._x = 0), (this._z = Math.atan2(-u, p))));
        break;
      case "YZX":
        ((this._z = Math.asin(bt(h, -1, 1))),
          Math.abs(h) < 0.9999999
            ? ((this._x = Math.atan2(-y, p)), (this._y = Math.atan2(-g, l)))
            : ((this._x = 0), (this._y = Math.atan2(f, b))));
        break;
      case "XZY":
        ((this._z = Math.asin(-bt(u, -1, 1))),
          Math.abs(u) < 0.9999999
            ? ((this._x = Math.atan2(v, p)), (this._y = Math.atan2(f, l)))
            : ((this._x = Math.atan2(-y, b)), (this._y = 0)));
        break;
      default:
        console.warn("THREE.Euler: .setFromRotationMatrix() encountered an unknown order: " + i);
    }
    return ((this._order = i), s === !0 && this._onChangeCallback(), this);
  }
  setFromQuaternion(t, i, s) {
    return (jg.makeRotationFromQuaternion(t), this.setFromRotationMatrix(jg, i, s));
  }
  setFromVector3(t, i = this._order) {
    return this.set(t.x, t.y, t.z, i);
  }
  reorder(t) {
    return (Yg.setFromEuler(this), this.setFromQuaternion(Yg, t));
  }
  equals(t) {
    return t._x === this._x && t._y === this._y && t._z === this._z && t._order === this._order;
  }
  fromArray(t) {
    return (
      (this._x = t[0]),
      (this._y = t[1]),
      (this._z = t[2]),
      t[3] !== void 0 && (this._order = t[3]),
      this._onChangeCallback(),
      this
    );
  }
  toArray(t = [], i = 0) {
    return (
      (t[i] = this._x),
      (t[i + 1] = this._y),
      (t[i + 2] = this._z),
      (t[i + 3] = this._order),
      t
    );
  }
  _onChange(t) {
    return ((this._onChangeCallback = t), this);
  }
  _onChangeCallback() {}
  *[Symbol.iterator]() {
    (yield this._x, yield this._y, yield this._z, yield this._order);
  }
}
ss.DEFAULT_ORDER = "XYZ";
class K3 {
  constructor() {
    this.mask = 1;
  }
  set(t) {
    this.mask = ((1 << t) | 0) >>> 0;
  }
  enable(t) {
    this.mask |= (1 << t) | 0;
  }
  enableAll() {
    this.mask = -1;
  }
  toggle(t) {
    this.mask ^= (1 << t) | 0;
  }
  disable(t) {
    this.mask &= ~((1 << t) | 0);
  }
  disableAll() {
    this.mask = 0;
  }
  test(t) {
    return (this.mask & t.mask) !== 0;
  }
  isEnabled(t) {
    return (this.mask & ((1 << t) | 0)) !== 0;
  }
}
let $3 = 0;
const qg = new R(),
  za = new Pa(),
  fn = new Ct(),
  rc = new R(),
  Jo = new R(),
  tw = new R(),
  ew = new Pa(),
  Xg = new R(1, 0, 0),
  Ig = new R(0, 1, 0),
  Zg = new R(0, 0, 1),
  Pg = { type: "added" },
  iw = { type: "removed" },
  Ea = { type: "childadded", child: null },
  nd = { type: "childremoved", child: null };
class le extends Or {
  constructor() {
    (super(),
      (this.isObject3D = !0),
      Object.defineProperty(this, "id", { value: $3++ }),
      (this.uuid = Ai()),
      (this.name = ""),
      (this.type = "Object3D"),
      (this.parent = null),
      (this.children = []),
      (this.up = le.DEFAULT_UP.clone()));
    const t = new R(),
      i = new ss(),
      s = new Pa(),
      o = new R(1, 1, 1);
    function l() {
      s.setFromEuler(i, !1);
    }
    function u() {
      i.setFromQuaternion(s, void 0, !1);
    }
    (i._onChange(l),
      s._onChange(u),
      Object.defineProperties(this, {
        position: { configurable: !0, enumerable: !0, value: t },
        rotation: { configurable: !0, enumerable: !0, value: i },
        quaternion: { configurable: !0, enumerable: !0, value: s },
        scale: { configurable: !0, enumerable: !0, value: o },
        modelViewMatrix: { value: new Ct() },
        normalMatrix: { value: new Sn() },
      }),
      (this.matrix = new Ct()),
      (this.matrixWorld = new Ct()),
      (this.matrixAutoUpdate = le.DEFAULT_MATRIX_AUTO_UPDATE),
      (this.matrixWorldAutoUpdate = le.DEFAULT_MATRIX_WORLD_AUTO_UPDATE),
      (this.matrixWorldNeedsUpdate = !1),
      (this.layers = new K3()),
      (this.visible = !0),
      (this.castShadow = !1),
      (this.receiveShadow = !1),
      (this.frustumCulled = !0),
      (this.renderOrder = 0),
      (this.animations = []),
      (this.customDepthMaterial = void 0),
      (this.customDistanceMaterial = void 0),
      (this.userData = {}));
  }
  onBeforeShadow() {}
  onAfterShadow() {}
  onBeforeRender() {}
  onAfterRender() {}
  applyMatrix4(t) {
    (this.matrixAutoUpdate && this.updateMatrix(),
      this.matrix.premultiply(t),
      this.matrix.decompose(this.position, this.quaternion, this.scale));
  }
  applyQuaternion(t) {
    return (this.quaternion.premultiply(t), this);
  }
  setRotationFromAxisAngle(t, i) {
    this.quaternion.setFromAxisAngle(t, i);
  }
  setRotationFromEuler(t) {
    this.quaternion.setFromEuler(t, !0);
  }
  setRotationFromMatrix(t) {
    this.quaternion.setFromRotationMatrix(t);
  }
  setRotationFromQuaternion(t) {
    this.quaternion.copy(t);
  }
  rotateOnAxis(t, i) {
    return (za.setFromAxisAngle(t, i), this.quaternion.multiply(za), this);
  }
  rotateOnWorldAxis(t, i) {
    return (za.setFromAxisAngle(t, i), this.quaternion.premultiply(za), this);
  }
  rotateX(t) {
    return this.rotateOnAxis(Xg, t);
  }
  rotateY(t) {
    return this.rotateOnAxis(Ig, t);
  }
  rotateZ(t) {
    return this.rotateOnAxis(Zg, t);
  }
  translateOnAxis(t, i) {
    return (
      qg.copy(t).applyQuaternion(this.quaternion),
      this.position.add(qg.multiplyScalar(i)),
      this
    );
  }
  translateX(t) {
    return this.translateOnAxis(Xg, t);
  }
  translateY(t) {
    return this.translateOnAxis(Ig, t);
  }
  translateZ(t) {
    return this.translateOnAxis(Zg, t);
  }
  localToWorld(t) {
    return (this.updateWorldMatrix(!0, !1), t.applyMatrix4(this.matrixWorld));
  }
  worldToLocal(t) {
    return (this.updateWorldMatrix(!0, !1), t.applyMatrix4(fn.copy(this.matrixWorld).invert()));
  }
  lookAt(t, i, s) {
    t.isVector3 ? rc.copy(t) : rc.set(t, i, s);
    const o = this.parent;
    (this.updateWorldMatrix(!0, !1),
      Jo.setFromMatrixPosition(this.matrixWorld),
      this.isCamera || this.isLight ? fn.lookAt(Jo, rc, this.up) : fn.lookAt(rc, Jo, this.up),
      this.quaternion.setFromRotationMatrix(fn),
      o &&
        (fn.extractRotation(o.matrixWorld),
        za.setFromRotationMatrix(fn),
        this.quaternion.premultiply(za.invert())));
  }
  add(t) {
    if (arguments.length > 1) {
      for (let i = 0; i < arguments.length; i++) this.add(arguments[i]);
      return this;
    }
    return t === this
      ? (console.error("THREE.Object3D.add: object can't be added as a child of itself.", t), this)
      : (t && t.isObject3D
          ? (t.removeFromParent(),
            (t.parent = this),
            this.children.push(t),
            t.dispatchEvent(Pg),
            (Ea.child = t),
            this.dispatchEvent(Ea),
            (Ea.child = null))
          : console.error("THREE.Object3D.add: object not an instance of THREE.Object3D.", t),
        this);
  }
  remove(t) {
    if (arguments.length > 1) {
      for (let s = 0; s < arguments.length; s++) this.remove(arguments[s]);
      return this;
    }
    const i = this.children.indexOf(t);
    return (
      i !== -1 &&
        ((t.parent = null),
        this.children.splice(i, 1),
        t.dispatchEvent(iw),
        (nd.child = t),
        this.dispatchEvent(nd),
        (nd.child = null)),
      this
    );
  }
  removeFromParent() {
    const t = this.parent;
    return (t !== null && t.remove(this), this);
  }
  clear() {
    return this.remove(...this.children);
  }
  attach(t) {
    return (
      this.updateWorldMatrix(!0, !1),
      fn.copy(this.matrixWorld).invert(),
      t.parent !== null && (t.parent.updateWorldMatrix(!0, !1), fn.multiply(t.parent.matrixWorld)),
      t.applyMatrix4(fn),
      t.removeFromParent(),
      (t.parent = this),
      this.children.push(t),
      t.updateWorldMatrix(!1, !0),
      t.dispatchEvent(Pg),
      (Ea.child = t),
      this.dispatchEvent(Ea),
      (Ea.child = null),
      this
    );
  }
  getObjectById(t) {
    return this.getObjectByProperty("id", t);
  }
  getObjectByName(t) {
    return this.getObjectByProperty("name", t);
  }
  getObjectByProperty(t, i) {
    if (this[t] === i) return this;
    for (let s = 0, o = this.children.length; s < o; s++) {
      const u = this.children[s].getObjectByProperty(t, i);
      if (u !== void 0) return u;
    }
  }
  getObjectsByProperty(t, i, s = []) {
    this[t] === i && s.push(this);
    const o = this.children;
    for (let l = 0, u = o.length; l < u; l++) o[l].getObjectsByProperty(t, i, s);
    return s;
  }
  getWorldPosition(t) {
    return (this.updateWorldMatrix(!0, !1), t.setFromMatrixPosition(this.matrixWorld));
  }
  getWorldQuaternion(t) {
    return (this.updateWorldMatrix(!0, !1), this.matrixWorld.decompose(Jo, t, tw), t);
  }
  getWorldScale(t) {
    return (this.updateWorldMatrix(!0, !1), this.matrixWorld.decompose(Jo, ew, t), t);
  }
  getWorldDirection(t) {
    this.updateWorldMatrix(!0, !1);
    const i = this.matrixWorld.elements;
    return t.set(i[8], i[9], i[10]).normalize();
  }
  raycast() {}
  traverse(t) {
    t(this);
    const i = this.children;
    for (let s = 0, o = i.length; s < o; s++) i[s].traverse(t);
  }
  traverseVisible(t) {
    if (this.visible === !1) return;
    t(this);
    const i = this.children;
    for (let s = 0, o = i.length; s < o; s++) i[s].traverseVisible(t);
  }
  traverseAncestors(t) {
    const i = this.parent;
    i !== null && (t(i), i.traverseAncestors(t));
  }
  updateMatrix() {
    (this.matrix.compose(this.position, this.quaternion, this.scale),
      (this.matrixWorldNeedsUpdate = !0));
  }
  updateMatrixWorld(t) {
    (this.matrixAutoUpdate && this.updateMatrix(),
      (this.matrixWorldNeedsUpdate || t) &&
        (this.matrixWorldAutoUpdate === !0 &&
          (this.parent === null
            ? this.matrixWorld.copy(this.matrix)
            : this.matrixWorld.multiplyMatrices(this.parent.matrixWorld, this.matrix)),
        (this.matrixWorldNeedsUpdate = !1),
        (t = !0)));
    const i = this.children;
    for (let s = 0, o = i.length; s < o; s++) i[s].updateMatrixWorld(t);
  }
  updateWorldMatrix(t, i) {
    const s = this.parent;
    if (
      (t === !0 && s !== null && s.updateWorldMatrix(!0, !1),
      this.matrixAutoUpdate && this.updateMatrix(),
      this.matrixWorldAutoUpdate === !0 &&
        (this.parent === null
          ? this.matrixWorld.copy(this.matrix)
          : this.matrixWorld.multiplyMatrices(this.parent.matrixWorld, this.matrix)),
      i === !0)
    ) {
      const o = this.children;
      for (let l = 0, u = o.length; l < u; l++) o[l].updateWorldMatrix(!1, !0);
    }
  }
  toJSON(t) {
    const i = t === void 0 || typeof t == "string",
      s = {};
    i &&
      ((t = {
        geometries: {},
        materials: {},
        textures: {},
        images: {},
        shapes: {},
        skeletons: {},
        animations: {},
        nodes: {},
      }),
      (s.metadata = { version: 4.7, type: "Object", generator: "Object3D.toJSON" }));
    const o = {};
    ((o.uuid = this.uuid),
      (o.type = this.type),
      this.name !== "" && (o.name = this.name),
      this.castShadow === !0 && (o.castShadow = !0),
      this.receiveShadow === !0 && (o.receiveShadow = !0),
      this.visible === !1 && (o.visible = !1),
      this.frustumCulled === !1 && (o.frustumCulled = !1),
      this.renderOrder !== 0 && (o.renderOrder = this.renderOrder),
      Object.keys(this.userData).length > 0 && (o.userData = this.userData),
      (o.layers = this.layers.mask),
      (o.matrix = this.matrix.toArray()),
      (o.up = this.up.toArray()),
      this.matrixAutoUpdate === !1 && (o.matrixAutoUpdate = !1),
      this.isInstancedMesh &&
        ((o.type = "InstancedMesh"),
        (o.count = this.count),
        (o.instanceMatrix = this.instanceMatrix.toJSON()),
        this.instanceColor !== null && (o.instanceColor = this.instanceColor.toJSON())),
      this.isBatchedMesh &&
        ((o.type = "BatchedMesh"),
        (o.perObjectFrustumCulled = this.perObjectFrustumCulled),
        (o.sortObjects = this.sortObjects),
        (o.drawRanges = this._drawRanges),
        (o.reservedRanges = this._reservedRanges),
        (o.geometryInfo = this._geometryInfo.map((f) => ({
          ...f,
          boundingBox: f.boundingBox ? f.boundingBox.toJSON() : void 0,
          boundingSphere: f.boundingSphere ? f.boundingSphere.toJSON() : void 0,
        }))),
        (o.instanceInfo = this._instanceInfo.map((f) => ({ ...f }))),
        (o.availableInstanceIds = this._availableInstanceIds.slice()),
        (o.availableGeometryIds = this._availableGeometryIds.slice()),
        (o.nextIndexStart = this._nextIndexStart),
        (o.nextVertexStart = this._nextVertexStart),
        (o.geometryCount = this._geometryCount),
        (o.maxInstanceCount = this._maxInstanceCount),
        (o.maxVertexCount = this._maxVertexCount),
        (o.maxIndexCount = this._maxIndexCount),
        (o.geometryInitialized = this._geometryInitialized),
        (o.matricesTexture = this._matricesTexture.toJSON(t)),
        (o.indirectTexture = this._indirectTexture.toJSON(t)),
        this._colorsTexture !== null && (o.colorsTexture = this._colorsTexture.toJSON(t)),
        this.boundingSphere !== null && (o.boundingSphere = this.boundingSphere.toJSON()),
        this.boundingBox !== null && (o.boundingBox = this.boundingBox.toJSON())));
    function l(f, h) {
      return (f[h.uuid] === void 0 && (f[h.uuid] = h.toJSON(t)), h.uuid);
    }
    if (this.isScene)
      (this.background &&
        (this.background.isColor
          ? (o.background = this.background.toJSON())
          : this.background.isTexture && (o.background = this.background.toJSON(t).uuid)),
        this.environment &&
          this.environment.isTexture &&
          this.environment.isRenderTargetTexture !== !0 &&
          (o.environment = this.environment.toJSON(t).uuid));
    else if (this.isMesh || this.isLine || this.isPoints) {
      o.geometry = l(t.geometries, this.geometry);
      const f = this.geometry.parameters;
      if (f !== void 0 && f.shapes !== void 0) {
        const h = f.shapes;
        if (Array.isArray(h))
          for (let p = 0, y = h.length; p < y; p++) {
            const g = h[p];
            l(t.shapes, g);
          }
        else l(t.shapes, h);
      }
    }
    if (
      (this.isSkinnedMesh &&
        ((o.bindMode = this.bindMode),
        (o.bindMatrix = this.bindMatrix.toArray()),
        this.skeleton !== void 0 &&
          (l(t.skeletons, this.skeleton), (o.skeleton = this.skeleton.uuid))),
      this.material !== void 0)
    )
      if (Array.isArray(this.material)) {
        const f = [];
        for (let h = 0, p = this.material.length; h < p; h++)
          f.push(l(t.materials, this.material[h]));
        o.material = f;
      } else o.material = l(t.materials, this.material);
    if (this.children.length > 0) {
      o.children = [];
      for (let f = 0; f < this.children.length; f++)
        o.children.push(this.children[f].toJSON(t).object);
    }
    if (this.animations.length > 0) {
      o.animations = [];
      for (let f = 0; f < this.animations.length; f++) {
        const h = this.animations[f];
        o.animations.push(l(t.animations, h));
      }
    }
    if (i) {
      const f = u(t.geometries),
        h = u(t.materials),
        p = u(t.textures),
        y = u(t.images),
        g = u(t.shapes),
        v = u(t.skeletons),
        b = u(t.animations),
        S = u(t.nodes);
      (f.length > 0 && (s.geometries = f),
        h.length > 0 && (s.materials = h),
        p.length > 0 && (s.textures = p),
        y.length > 0 && (s.images = y),
        g.length > 0 && (s.shapes = g),
        v.length > 0 && (s.skeletons = v),
        b.length > 0 && (s.animations = b),
        S.length > 0 && (s.nodes = S));
    }
    return ((s.object = o), s);
    function u(f) {
      const h = [];
      for (const p in f) {
        const y = f[p];
        (delete y.metadata, h.push(y));
      }
      return h;
    }
  }
  clone(t) {
    return new this.constructor().copy(this, t);
  }
  copy(t, i = !0) {
    if (
      ((this.name = t.name),
      this.up.copy(t.up),
      this.position.copy(t.position),
      (this.rotation.order = t.rotation.order),
      this.quaternion.copy(t.quaternion),
      this.scale.copy(t.scale),
      this.matrix.copy(t.matrix),
      this.matrixWorld.copy(t.matrixWorld),
      (this.matrixAutoUpdate = t.matrixAutoUpdate),
      (this.matrixWorldAutoUpdate = t.matrixWorldAutoUpdate),
      (this.matrixWorldNeedsUpdate = t.matrixWorldNeedsUpdate),
      (this.layers.mask = t.layers.mask),
      (this.visible = t.visible),
      (this.castShadow = t.castShadow),
      (this.receiveShadow = t.receiveShadow),
      (this.frustumCulled = t.frustumCulled),
      (this.renderOrder = t.renderOrder),
      (this.animations = t.animations.slice()),
      (this.userData = JSON.parse(JSON.stringify(t.userData))),
      i === !0)
    )
      for (let s = 0; s < t.children.length; s++) {
        const o = t.children[s];
        this.add(o.clone());
      }
    return this;
  }
}
le.DEFAULT_UP = new R(0, 1, 0);
le.DEFAULT_MATRIX_AUTO_UPDATE = !0;
le.DEFAULT_MATRIX_WORLD_AUTO_UPDATE = !0;
const Ci = new R(),
  dn = new R(),
  sd = new R(),
  pn = new R(),
  Ra = new R(),
  Ca = new R(),
  Wg = new R(),
  ad = new R(),
  od = new R(),
  rd = new R(),
  ld = new Te(),
  cd = new Te(),
  ud = new Te();
class Ni {
  constructor(t = new R(), i = new R(), s = new R()) {
    ((this.a = t), (this.b = i), (this.c = s));
  }
  static getNormal(t, i, s, o) {
    (o.subVectors(s, i), Ci.subVectors(t, i), o.cross(Ci));
    const l = o.lengthSq();
    return l > 0 ? o.multiplyScalar(1 / Math.sqrt(l)) : o.set(0, 0, 0);
  }
  static getBarycoord(t, i, s, o, l) {
    (Ci.subVectors(o, i), dn.subVectors(s, i), sd.subVectors(t, i));
    const u = Ci.dot(Ci),
      f = Ci.dot(dn),
      h = Ci.dot(sd),
      p = dn.dot(dn),
      y = dn.dot(sd),
      g = u * p - f * f;
    if (g === 0) return (l.set(0, 0, 0), null);
    const v = 1 / g,
      b = (p * h - f * y) * v,
      S = (u * y - f * h) * v;
    return l.set(1 - b - S, S, b);
  }
  static containsPoint(t, i, s, o) {
    return this.getBarycoord(t, i, s, o, pn) === null
      ? !1
      : pn.x >= 0 && pn.y >= 0 && pn.x + pn.y <= 1;
  }
  static getInterpolation(t, i, s, o, l, u, f, h) {
    return this.getBarycoord(t, i, s, o, pn) === null
      ? ((h.x = 0), (h.y = 0), "z" in h && (h.z = 0), "w" in h && (h.w = 0), null)
      : (h.setScalar(0),
        h.addScaledVector(l, pn.x),
        h.addScaledVector(u, pn.y),
        h.addScaledVector(f, pn.z),
        h);
  }
  static getInterpolatedAttribute(t, i, s, o, l, u) {
    return (
      ld.setScalar(0),
      cd.setScalar(0),
      ud.setScalar(0),
      ld.fromBufferAttribute(t, i),
      cd.fromBufferAttribute(t, s),
      ud.fromBufferAttribute(t, o),
      u.setScalar(0),
      u.addScaledVector(ld, l.x),
      u.addScaledVector(cd, l.y),
      u.addScaledVector(ud, l.z),
      u
    );
  }
  static isFrontFacing(t, i, s, o) {
    return (Ci.subVectors(s, i), dn.subVectors(t, i), Ci.cross(dn).dot(o) < 0);
  }
  set(t, i, s) {
    return (this.a.copy(t), this.b.copy(i), this.c.copy(s), this);
  }
  setFromPointsAndIndices(t, i, s, o) {
    return (this.a.copy(t[i]), this.b.copy(t[s]), this.c.copy(t[o]), this);
  }
  setFromAttributeAndIndices(t, i, s, o) {
    return (
      this.a.fromBufferAttribute(t, i),
      this.b.fromBufferAttribute(t, s),
      this.c.fromBufferAttribute(t, o),
      this
    );
  }
  clone() {
    return new this.constructor().copy(this);
  }
  copy(t) {
    return (this.a.copy(t.a), this.b.copy(t.b), this.c.copy(t.c), this);
  }
  getArea() {
    return (
      Ci.subVectors(this.c, this.b),
      dn.subVectors(this.a, this.b),
      Ci.cross(dn).length() * 0.5
    );
  }
  getMidpoint(t) {
    return t
      .addVectors(this.a, this.b)
      .add(this.c)
      .multiplyScalar(1 / 3);
  }
  getNormal(t) {
    return Ni.getNormal(this.a, this.b, this.c, t);
  }
  getPlane(t) {
    return t.setFromCoplanarPoints(this.a, this.b, this.c);
  }
  getBarycoord(t, i) {
    return Ni.getBarycoord(t, this.a, this.b, this.c, i);
  }
  getInterpolation(t, i, s, o, l) {
    return Ni.getInterpolation(t, this.a, this.b, this.c, i, s, o, l);
  }
  containsPoint(t) {
    return Ni.containsPoint(t, this.a, this.b, this.c);
  }
  isFrontFacing(t) {
    return Ni.isFrontFacing(this.a, this.b, this.c, t);
  }
  intersectsBox(t) {
    return t.intersectsTriangle(this);
  }
  closestPointToPoint(t, i) {
    const s = this.a,
      o = this.b,
      l = this.c;
    let u, f;
    (Ra.subVectors(o, s), Ca.subVectors(l, s), ad.subVectors(t, s));
    const h = Ra.dot(ad),
      p = Ca.dot(ad);
    if (h <= 0 && p <= 0) return i.copy(s);
    od.subVectors(t, o);
    const y = Ra.dot(od),
      g = Ca.dot(od);
    if (y >= 0 && g <= y) return i.copy(o);
    const v = h * g - y * p;
    if (v <= 0 && h >= 0 && y <= 0) return ((u = h / (h - y)), i.copy(s).addScaledVector(Ra, u));
    rd.subVectors(t, l);
    const b = Ra.dot(rd),
      S = Ca.dot(rd);
    if (S >= 0 && b <= S) return i.copy(l);
    const A = b * p - h * S;
    if (A <= 0 && p >= 0 && S <= 0) return ((f = p / (p - S)), i.copy(s).addScaledVector(Ca, f));
    const M = y * S - b * g;
    if (M <= 0 && g - y >= 0 && b - S >= 0)
      return (
        Wg.subVectors(l, o),
        (f = (g - y) / (g - y + (b - S))),
        i.copy(o).addScaledVector(Wg, f)
      );
    const T = 1 / (M + A + v);
    return ((u = A * T), (f = v * T), i.copy(s).addScaledVector(Ra, u).addScaledVector(Ca, f));
  }
  equals(t) {
    return t.a.equals(this.a) && t.b.equals(this.b) && t.c.equals(this.c);
  }
}
const R1 = {
    aliceblue: 15792383,
    antiquewhite: 16444375,
    aqua: 65535,
    aquamarine: 8388564,
    azure: 15794175,
    beige: 16119260,
    bisque: 16770244,
    black: 0,
    blanchedalmond: 16772045,
    blue: 255,
    blueviolet: 9055202,
    brown: 10824234,
    burlywood: 14596231,
    cadetblue: 6266528,
    chartreuse: 8388352,
    chocolate: 13789470,
    coral: 16744272,
    cornflowerblue: 6591981,
    cornsilk: 16775388,
    crimson: 14423100,
    cyan: 65535,
    darkblue: 139,
    darkcyan: 35723,
    darkgoldenrod: 12092939,
    darkgray: 11119017,
    darkgreen: 25600,
    darkgrey: 11119017,
    darkkhaki: 12433259,
    darkmagenta: 9109643,
    darkolivegreen: 5597999,
    darkorange: 16747520,
    darkorchid: 10040012,
    darkred: 9109504,
    darksalmon: 15308410,
    darkseagreen: 9419919,
    darkslateblue: 4734347,
    darkslategray: 3100495,
    darkslategrey: 3100495,
    darkturquoise: 52945,
    darkviolet: 9699539,
    deeppink: 16716947,
    deepskyblue: 49151,
    dimgray: 6908265,
    dimgrey: 6908265,
    dodgerblue: 2003199,
    firebrick: 11674146,
    floralwhite: 16775920,
    forestgreen: 2263842,
    fuchsia: 16711935,
    gainsboro: 14474460,
    ghostwhite: 16316671,
    gold: 16766720,
    goldenrod: 14329120,
    gray: 8421504,
    green: 32768,
    greenyellow: 11403055,
    grey: 8421504,
    honeydew: 15794160,
    hotpink: 16738740,
    indianred: 13458524,
    indigo: 4915330,
    ivory: 16777200,
    khaki: 15787660,
    lavender: 15132410,
    lavenderblush: 16773365,
    lawngreen: 8190976,
    lemonchiffon: 16775885,
    lightblue: 11393254,
    lightcoral: 15761536,
    lightcyan: 14745599,
    lightgoldenrodyellow: 16448210,
    lightgray: 13882323,
    lightgreen: 9498256,
    lightgrey: 13882323,
    lightpink: 16758465,
    lightsalmon: 16752762,
    lightseagreen: 2142890,
    lightskyblue: 8900346,
    lightslategray: 7833753,
    lightslategrey: 7833753,
    lightsteelblue: 11584734,
    lightyellow: 16777184,
    lime: 65280,
    limegreen: 3329330,
    linen: 16445670,
    magenta: 16711935,
    maroon: 8388608,
    mediumaquamarine: 6737322,
    mediumblue: 205,
    mediumorchid: 12211667,
    mediumpurple: 9662683,
    mediumseagreen: 3978097,
    mediumslateblue: 8087790,
    mediumspringgreen: 64154,
    mediumturquoise: 4772300,
    mediumvioletred: 13047173,
    midnightblue: 1644912,
    mintcream: 16121850,
    mistyrose: 16770273,
    moccasin: 16770229,
    navajowhite: 16768685,
    navy: 128,
    oldlace: 16643558,
    olive: 8421376,
    olivedrab: 7048739,
    orange: 16753920,
    orangered: 16729344,
    orchid: 14315734,
    palegoldenrod: 15657130,
    palegreen: 10025880,
    paleturquoise: 11529966,
    palevioletred: 14381203,
    papayawhip: 16773077,
    peachpuff: 16767673,
    peru: 13468991,
    pink: 16761035,
    plum: 14524637,
    powderblue: 11591910,
    purple: 8388736,
    rebeccapurple: 6697881,
    red: 16711680,
    rosybrown: 12357519,
    royalblue: 4286945,
    saddlebrown: 9127187,
    salmon: 16416882,
    sandybrown: 16032864,
    seagreen: 3050327,
    seashell: 16774638,
    sienna: 10506797,
    silver: 12632256,
    skyblue: 8900331,
    slateblue: 6970061,
    slategray: 7372944,
    slategrey: 7372944,
    snow: 16775930,
    springgreen: 65407,
    steelblue: 4620980,
    tan: 13808780,
    teal: 32896,
    thistle: 14204888,
    tomato: 16737095,
    turquoise: 4251856,
    violet: 15631086,
    wheat: 16113331,
    white: 16777215,
    whitesmoke: 16119285,
    yellow: 16776960,
    yellowgreen: 10145074,
  },
  ts = { h: 0, s: 0, l: 0 },
  lc = { h: 0, s: 0, l: 0 };
function hd(c, t, i) {
  return (
    i < 0 && (i += 1),
    i > 1 && (i -= 1),
    i < 1 / 6 ? c + (t - c) * 6 * i : i < 1 / 2 ? t : i < 2 / 3 ? c + (t - c) * 6 * (2 / 3 - i) : c
  );
}
class Mi {
  constructor(t, i, s) {
    return ((this.isColor = !0), (this.r = 1), (this.g = 1), (this.b = 1), this.set(t, i, s));
  }
  set(t, i, s) {
    if (i === void 0 && s === void 0) {
      const o = t;
      o && o.isColor
        ? this.copy(o)
        : typeof o == "number"
          ? this.setHex(o)
          : typeof o == "string" && this.setStyle(o);
    } else this.setRGB(t, i, s);
    return this;
  }
  setScalar(t) {
    return ((this.r = t), (this.g = t), (this.b = t), this);
  }
  setHex(t, i = Bi) {
    return (
      (t = Math.floor(t)),
      (this.r = ((t >> 16) & 255) / 255),
      (this.g = ((t >> 8) & 255) / 255),
      (this.b = (t & 255) / 255),
      bi.colorSpaceToWorking(this, i),
      this
    );
  }
  setRGB(t, i, s, o = bi.workingColorSpace) {
    return ((this.r = t), (this.g = i), (this.b = s), bi.colorSpaceToWorking(this, o), this);
  }
  setHSL(t, i, s, o = bi.workingColorSpace) {
    if (((t = Kd(t, 1)), (i = bt(i, 0, 1)), (s = bt(s, 0, 1)), i === 0))
      this.r = this.g = this.b = s;
    else {
      const l = s <= 0.5 ? s * (1 + i) : s + i - s * i,
        u = 2 * s - l;
      ((this.r = hd(u, l, t + 1 / 3)), (this.g = hd(u, l, t)), (this.b = hd(u, l, t - 1 / 3)));
    }
    return (bi.colorSpaceToWorking(this, o), this);
  }
  setStyle(t, i = Bi) {
    function s(l) {
      l !== void 0 &&
        parseFloat(l) < 1 &&
        console.warn("THREE.Color: Alpha component of " + t + " will be ignored.");
    }
    let o;
    if ((o = /^(\w+)\(([^\)]*)\)/.exec(t))) {
      let l;
      const u = o[1],
        f = o[2];
      switch (u) {
        case "rgb":
        case "rgba":
          if ((l = /^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(f)))
            return (
              s(l[4]),
              this.setRGB(
                Math.min(255, parseInt(l[1], 10)) / 255,
                Math.min(255, parseInt(l[2], 10)) / 255,
                Math.min(255, parseInt(l[3], 10)) / 255,
                i,
              )
            );
          if ((l = /^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(f)))
            return (
              s(l[4]),
              this.setRGB(
                Math.min(100, parseInt(l[1], 10)) / 100,
                Math.min(100, parseInt(l[2], 10)) / 100,
                Math.min(100, parseInt(l[3], 10)) / 100,
                i,
              )
            );
          break;
        case "hsl":
        case "hsla":
          if (
            (l =
              /^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(
                f,
              ))
          )
            return (
              s(l[4]),
              this.setHSL(parseFloat(l[1]) / 360, parseFloat(l[2]) / 100, parseFloat(l[3]) / 100, i)
            );
          break;
        default:
          console.warn("THREE.Color: Unknown color model " + t);
      }
    } else if ((o = /^\#([A-Fa-f\d]+)$/.exec(t))) {
      const l = o[1],
        u = l.length;
      if (u === 3)
        return this.setRGB(
          parseInt(l.charAt(0), 16) / 15,
          parseInt(l.charAt(1), 16) / 15,
          parseInt(l.charAt(2), 16) / 15,
          i,
        );
      if (u === 6) return this.setHex(parseInt(l, 16), i);
      console.warn("THREE.Color: Invalid hex color " + t);
    } else if (t && t.length > 0) return this.setColorName(t, i);
    return this;
  }
  setColorName(t, i = Bi) {
    const s = R1[t.toLowerCase()];
    return (
      s !== void 0 ? this.setHex(s, i) : console.warn("THREE.Color: Unknown color " + t),
      this
    );
  }
  clone() {
    return new this.constructor(this.r, this.g, this.b);
  }
  copy(t) {
    return ((this.r = t.r), (this.g = t.g), (this.b = t.b), this);
  }
  copySRGBToLinear(t) {
    return ((this.r = bn(t.r)), (this.g = bn(t.g)), (this.b = bn(t.b)), this);
  }
  copyLinearToSRGB(t) {
    return ((this.r = ja(t.r)), (this.g = ja(t.g)), (this.b = ja(t.b)), this);
  }
  convertSRGBToLinear() {
    return (this.copySRGBToLinear(this), this);
  }
  convertLinearToSRGB() {
    return (this.copyLinearToSRGB(this), this);
  }
  getHex(t = Bi) {
    return (
      bi.workingToColorSpace(De.copy(this), t),
      Math.round(bt(De.r * 255, 0, 255)) * 65536 +
        Math.round(bt(De.g * 255, 0, 255)) * 256 +
        Math.round(bt(De.b * 255, 0, 255))
    );
  }
  getHexString(t = Bi) {
    return ("000000" + this.getHex(t).toString(16)).slice(-6);
  }
  getHSL(t, i = bi.workingColorSpace) {
    bi.workingToColorSpace(De.copy(this), i);
    const s = De.r,
      o = De.g,
      l = De.b,
      u = Math.max(s, o, l),
      f = Math.min(s, o, l);
    let h, p;
    const y = (f + u) / 2;
    if (f === u) ((h = 0), (p = 0));
    else {
      const g = u - f;
      switch (((p = y <= 0.5 ? g / (u + f) : g / (2 - u - f)), u)) {
        case s:
          h = (o - l) / g + (o < l ? 6 : 0);
          break;
        case o:
          h = (l - s) / g + 2;
          break;
        case l:
          h = (s - o) / g + 4;
          break;
      }
      h /= 6;
    }
    return ((t.h = h), (t.s = p), (t.l = y), t);
  }
  getRGB(t, i = bi.workingColorSpace) {
    return (bi.workingToColorSpace(De.copy(this), i), (t.r = De.r), (t.g = De.g), (t.b = De.b), t);
  }
  getStyle(t = Bi) {
    bi.workingToColorSpace(De.copy(this), t);
    const i = De.r,
      s = De.g,
      o = De.b;
    return t !== Bi
      ? `color(${t} ${i.toFixed(3)} ${s.toFixed(3)} ${o.toFixed(3)})`
      : `rgb(${Math.round(i * 255)},${Math.round(s * 255)},${Math.round(o * 255)})`;
  }
  offsetHSL(t, i, s) {
    return (this.getHSL(ts), this.setHSL(ts.h + t, ts.s + i, ts.l + s));
  }
  add(t) {
    return ((this.r += t.r), (this.g += t.g), (this.b += t.b), this);
  }
  addColors(t, i) {
    return ((this.r = t.r + i.r), (this.g = t.g + i.g), (this.b = t.b + i.b), this);
  }
  addScalar(t) {
    return ((this.r += t), (this.g += t), (this.b += t), this);
  }
  sub(t) {
    return (
      (this.r = Math.max(0, this.r - t.r)),
      (this.g = Math.max(0, this.g - t.g)),
      (this.b = Math.max(0, this.b - t.b)),
      this
    );
  }
  multiply(t) {
    return ((this.r *= t.r), (this.g *= t.g), (this.b *= t.b), this);
  }
  multiplyScalar(t) {
    return ((this.r *= t), (this.g *= t), (this.b *= t), this);
  }
  lerp(t, i) {
    return (
      (this.r += (t.r - this.r) * i),
      (this.g += (t.g - this.g) * i),
      (this.b += (t.b - this.b) * i),
      this
    );
  }
  lerpColors(t, i, s) {
    return (
      (this.r = t.r + (i.r - t.r) * s),
      (this.g = t.g + (i.g - t.g) * s),
      (this.b = t.b + (i.b - t.b) * s),
      this
    );
  }
  lerpHSL(t, i) {
    (this.getHSL(ts), t.getHSL(lc));
    const s = mr(ts.h, lc.h, i),
      o = mr(ts.s, lc.s, i),
      l = mr(ts.l, lc.l, i);
    return (this.setHSL(s, o, l), this);
  }
  setFromVector3(t) {
    return ((this.r = t.x), (this.g = t.y), (this.b = t.z), this);
  }
  applyMatrix3(t) {
    const i = this.r,
      s = this.g,
      o = this.b,
      l = t.elements;
    return (
      (this.r = l[0] * i + l[3] * s + l[6] * o),
      (this.g = l[1] * i + l[4] * s + l[7] * o),
      (this.b = l[2] * i + l[5] * s + l[8] * o),
      this
    );
  }
  equals(t) {
    return t.r === this.r && t.g === this.g && t.b === this.b;
  }
  fromArray(t, i = 0) {
    return ((this.r = t[i]), (this.g = t[i + 1]), (this.b = t[i + 2]), this);
  }
  toArray(t = [], i = 0) {
    return ((t[i] = this.r), (t[i + 1] = this.g), (t[i + 2] = this.b), t);
  }
  fromBufferAttribute(t, i) {
    return ((this.r = t.getX(i)), (this.g = t.getY(i)), (this.b = t.getZ(i)), this);
  }
  toJSON() {
    return this.getHex();
  }
  *[Symbol.iterator]() {
    (yield this.r, yield this.g, yield this.b);
  }
}
const De = new Mi();
Mi.NAMES = R1;
let nw = 0;
class Ns extends Or {
  constructor() {
    (super(),
      (this.isMaterial = !0),
      Object.defineProperty(this, "id", { value: nw++ }),
      (this.uuid = Ai()),
      (this.name = ""),
      (this.type = "Material"),
      (this.blending = wi),
      (this.side = Dd),
      (this.vertexColors = !1),
      (this.opacity = 1),
      (this.transparent = !1),
      (this.alphaHash = !1),
      (this.blendSrc = Ag),
      (this.blendDst = Mg),
      (this.blendEquation = wg),
      (this.blendSrcAlpha = null),
      (this.blendDstAlpha = null),
      (this.blendEquationAlpha = null),
      (this.blendColor = new Mi(0, 0, 0)),
      (this.blendAlpha = 0),
      (this.depthFunc = _g),
      (this.depthTest = !0),
      (this.depthWrite = !0),
      (this.stencilWriteMask = 255),
      (this.stencilFunc = Ug),
      (this.stencilRef = 0),
      (this.stencilFuncMask = 255),
      (this.stencilFail = Sa),
      (this.stencilZFail = Sa),
      (this.stencilZPass = Sa),
      (this.stencilWrite = !1),
      (this.clippingPlanes = null),
      (this.clipIntersection = !1),
      (this.clipShadows = !1),
      (this.shadowSide = null),
      (this.colorWrite = !0),
      (this.precision = null),
      (this.polygonOffset = !1),
      (this.polygonOffsetFactor = 0),
      (this.polygonOffsetUnits = 0),
      (this.dithering = !1),
      (this.alphaToCoverage = !1),
      (this.premultipliedAlpha = !1),
      (this.forceSinglePass = !1),
      (this.allowOverride = !0),
      (this.visible = !0),
      (this.toneMapped = !0),
      (this.userData = {}),
      (this.version = 0),
      (this._alphaTest = 0));
  }
  get alphaTest() {
    return this._alphaTest;
  }
  set alphaTest(t) {
    (this._alphaTest > 0 != t > 0 && this.version++, (this._alphaTest = t));
  }
  onBeforeRender() {}
  onBeforeCompile() {}
  customProgramCacheKey() {
    return this.onBeforeCompile.toString();
  }
  setValues(t) {
    if (t !== void 0)
      for (const i in t) {
        const s = t[i];
        if (s === void 0) {
          console.warn(`THREE.Material: parameter '${i}' has value of undefined.`);
          continue;
        }
        const o = this[i];
        if (o === void 0) {
          console.warn(`THREE.Material: '${i}' is not a property of THREE.${this.type}.`);
          continue;
        }
        o && o.isColor
          ? o.set(s)
          : o && o.isVector3 && s && s.isVector3
            ? o.copy(s)
            : (this[i] = s);
      }
  }
  toJSON(t) {
    const i = t === void 0 || typeof t == "string";
    i && (t = { textures: {}, images: {} });
    const s = { metadata: { version: 4.7, type: "Material", generator: "Material.toJSON" } };
    ((s.uuid = this.uuid),
      (s.type = this.type),
      this.name !== "" && (s.name = this.name),
      this.color && this.color.isColor && (s.color = this.color.getHex()),
      this.roughness !== void 0 && (s.roughness = this.roughness),
      this.metalness !== void 0 && (s.metalness = this.metalness),
      this.sheen !== void 0 && (s.sheen = this.sheen),
      this.sheenColor && this.sheenColor.isColor && (s.sheenColor = this.sheenColor.getHex()),
      this.sheenRoughness !== void 0 && (s.sheenRoughness = this.sheenRoughness),
      this.emissive && this.emissive.isColor && (s.emissive = this.emissive.getHex()),
      this.emissiveIntensity !== void 0 &&
        this.emissiveIntensity !== 1 &&
        (s.emissiveIntensity = this.emissiveIntensity),
      this.specular && this.specular.isColor && (s.specular = this.specular.getHex()),
      this.specularIntensity !== void 0 && (s.specularIntensity = this.specularIntensity),
      this.specularColor &&
        this.specularColor.isColor &&
        (s.specularColor = this.specularColor.getHex()),
      this.shininess !== void 0 && (s.shininess = this.shininess),
      this.clearcoat !== void 0 && (s.clearcoat = this.clearcoat),
      this.clearcoatRoughness !== void 0 && (s.clearcoatRoughness = this.clearcoatRoughness),
      this.clearcoatMap &&
        this.clearcoatMap.isTexture &&
        (s.clearcoatMap = this.clearcoatMap.toJSON(t).uuid),
      this.clearcoatRoughnessMap &&
        this.clearcoatRoughnessMap.isTexture &&
        (s.clearcoatRoughnessMap = this.clearcoatRoughnessMap.toJSON(t).uuid),
      this.clearcoatNormalMap &&
        this.clearcoatNormalMap.isTexture &&
        ((s.clearcoatNormalMap = this.clearcoatNormalMap.toJSON(t).uuid),
        (s.clearcoatNormalScale = this.clearcoatNormalScale.toArray())),
      this.sheenColorMap &&
        this.sheenColorMap.isTexture &&
        (s.sheenColorMap = this.sheenColorMap.toJSON(t).uuid),
      this.sheenRoughnessMap &&
        this.sheenRoughnessMap.isTexture &&
        (s.sheenRoughnessMap = this.sheenRoughnessMap.toJSON(t).uuid),
      this.dispersion !== void 0 && (s.dispersion = this.dispersion),
      this.iridescence !== void 0 && (s.iridescence = this.iridescence),
      this.iridescenceIOR !== void 0 && (s.iridescenceIOR = this.iridescenceIOR),
      this.iridescenceThicknessRange !== void 0 &&
        (s.iridescenceThicknessRange = this.iridescenceThicknessRange),
      this.iridescenceMap &&
        this.iridescenceMap.isTexture &&
        (s.iridescenceMap = this.iridescenceMap.toJSON(t).uuid),
      this.iridescenceThicknessMap &&
        this.iridescenceThicknessMap.isTexture &&
        (s.iridescenceThicknessMap = this.iridescenceThicknessMap.toJSON(t).uuid),
      this.anisotropy !== void 0 && (s.anisotropy = this.anisotropy),
      this.anisotropyRotation !== void 0 && (s.anisotropyRotation = this.anisotropyRotation),
      this.anisotropyMap &&
        this.anisotropyMap.isTexture &&
        (s.anisotropyMap = this.anisotropyMap.toJSON(t).uuid),
      this.map && this.map.isTexture && (s.map = this.map.toJSON(t).uuid),
      this.matcap && this.matcap.isTexture && (s.matcap = this.matcap.toJSON(t).uuid),
      this.alphaMap && this.alphaMap.isTexture && (s.alphaMap = this.alphaMap.toJSON(t).uuid),
      this.lightMap &&
        this.lightMap.isTexture &&
        ((s.lightMap = this.lightMap.toJSON(t).uuid),
        (s.lightMapIntensity = this.lightMapIntensity)),
      this.aoMap &&
        this.aoMap.isTexture &&
        ((s.aoMap = this.aoMap.toJSON(t).uuid), (s.aoMapIntensity = this.aoMapIntensity)),
      this.bumpMap &&
        this.bumpMap.isTexture &&
        ((s.bumpMap = this.bumpMap.toJSON(t).uuid), (s.bumpScale = this.bumpScale)),
      this.normalMap &&
        this.normalMap.isTexture &&
        ((s.normalMap = this.normalMap.toJSON(t).uuid),
        (s.normalMapType = this.normalMapType),
        (s.normalScale = this.normalScale.toArray())),
      this.displacementMap &&
        this.displacementMap.isTexture &&
        ((s.displacementMap = this.displacementMap.toJSON(t).uuid),
        (s.displacementScale = this.displacementScale),
        (s.displacementBias = this.displacementBias)),
      this.roughnessMap &&
        this.roughnessMap.isTexture &&
        (s.roughnessMap = this.roughnessMap.toJSON(t).uuid),
      this.metalnessMap &&
        this.metalnessMap.isTexture &&
        (s.metalnessMap = this.metalnessMap.toJSON(t).uuid),
      this.emissiveMap &&
        this.emissiveMap.isTexture &&
        (s.emissiveMap = this.emissiveMap.toJSON(t).uuid),
      this.specularMap &&
        this.specularMap.isTexture &&
        (s.specularMap = this.specularMap.toJSON(t).uuid),
      this.specularIntensityMap &&
        this.specularIntensityMap.isTexture &&
        (s.specularIntensityMap = this.specularIntensityMap.toJSON(t).uuid),
      this.specularColorMap &&
        this.specularColorMap.isTexture &&
        (s.specularColorMap = this.specularColorMap.toJSON(t).uuid),
      this.envMap &&
        this.envMap.isTexture &&
        ((s.envMap = this.envMap.toJSON(t).uuid),
        this.combine !== void 0 && (s.combine = this.combine)),
      this.envMapRotation !== void 0 && (s.envMapRotation = this.envMapRotation.toArray()),
      this.envMapIntensity !== void 0 && (s.envMapIntensity = this.envMapIntensity),
      this.reflectivity !== void 0 && (s.reflectivity = this.reflectivity),
      this.refractionRatio !== void 0 && (s.refractionRatio = this.refractionRatio),
      this.gradientMap &&
        this.gradientMap.isTexture &&
        (s.gradientMap = this.gradientMap.toJSON(t).uuid),
      this.transmission !== void 0 && (s.transmission = this.transmission),
      this.transmissionMap &&
        this.transmissionMap.isTexture &&
        (s.transmissionMap = this.transmissionMap.toJSON(t).uuid),
      this.thickness !== void 0 && (s.thickness = this.thickness),
      this.thicknessMap &&
        this.thicknessMap.isTexture &&
        (s.thicknessMap = this.thicknessMap.toJSON(t).uuid),
      this.attenuationDistance !== void 0 &&
        this.attenuationDistance !== 1 / 0 &&
        (s.attenuationDistance = this.attenuationDistance),
      this.attenuationColor !== void 0 && (s.attenuationColor = this.attenuationColor.getHex()),
      this.size !== void 0 && (s.size = this.size),
      this.shadowSide !== null && (s.shadowSide = this.shadowSide),
      this.sizeAttenuation !== void 0 && (s.sizeAttenuation = this.sizeAttenuation),
      this.blending !== wi && (s.blending = this.blending),
      this.side !== Dd && (s.side = this.side),
      this.vertexColors === !0 && (s.vertexColors = !0),
      this.opacity < 1 && (s.opacity = this.opacity),
      this.transparent === !0 && (s.transparent = !0),
      this.blendSrc !== Ag && (s.blendSrc = this.blendSrc),
      this.blendDst !== Mg && (s.blendDst = this.blendDst),
      this.blendEquation !== wg && (s.blendEquation = this.blendEquation),
      this.blendSrcAlpha !== null && (s.blendSrcAlpha = this.blendSrcAlpha),
      this.blendDstAlpha !== null && (s.blendDstAlpha = this.blendDstAlpha),
      this.blendEquationAlpha !== null && (s.blendEquationAlpha = this.blendEquationAlpha),
      this.blendColor && this.blendColor.isColor && (s.blendColor = this.blendColor.getHex()),
      this.blendAlpha !== 0 && (s.blendAlpha = this.blendAlpha),
      this.depthFunc !== _g && (s.depthFunc = this.depthFunc),
      this.depthTest === !1 && (s.depthTest = this.depthTest),
      this.depthWrite === !1 && (s.depthWrite = this.depthWrite),
      this.colorWrite === !1 && (s.colorWrite = this.colorWrite),
      this.stencilWriteMask !== 255 && (s.stencilWriteMask = this.stencilWriteMask),
      this.stencilFunc !== Ug && (s.stencilFunc = this.stencilFunc),
      this.stencilRef !== 0 && (s.stencilRef = this.stencilRef),
      this.stencilFuncMask !== 255 && (s.stencilFuncMask = this.stencilFuncMask),
      this.stencilFail !== Sa && (s.stencilFail = this.stencilFail),
      this.stencilZFail !== Sa && (s.stencilZFail = this.stencilZFail),
      this.stencilZPass !== Sa && (s.stencilZPass = this.stencilZPass),
      this.stencilWrite === !0 && (s.stencilWrite = this.stencilWrite),
      this.rotation !== void 0 && this.rotation !== 0 && (s.rotation = this.rotation),
      this.polygonOffset === !0 && (s.polygonOffset = !0),
      this.polygonOffsetFactor !== 0 && (s.polygonOffsetFactor = this.polygonOffsetFactor),
      this.polygonOffsetUnits !== 0 && (s.polygonOffsetUnits = this.polygonOffsetUnits),
      this.linewidth !== void 0 && this.linewidth !== 1 && (s.linewidth = this.linewidth),
      this.dashSize !== void 0 && (s.dashSize = this.dashSize),
      this.gapSize !== void 0 && (s.gapSize = this.gapSize),
      this.scale !== void 0 && (s.scale = this.scale),
      this.dithering === !0 && (s.dithering = !0),
      this.alphaTest > 0 && (s.alphaTest = this.alphaTest),
      this.alphaHash === !0 && (s.alphaHash = !0),
      this.alphaToCoverage === !0 && (s.alphaToCoverage = !0),
      this.premultipliedAlpha === !0 && (s.premultipliedAlpha = !0),
      this.forceSinglePass === !0 && (s.forceSinglePass = !0),
      this.wireframe === !0 && (s.wireframe = !0),
      this.wireframeLinewidth > 1 && (s.wireframeLinewidth = this.wireframeLinewidth),
      this.wireframeLinecap !== "round" && (s.wireframeLinecap = this.wireframeLinecap),
      this.wireframeLinejoin !== "round" && (s.wireframeLinejoin = this.wireframeLinejoin),
      this.flatShading === !0 && (s.flatShading = !0),
      this.visible === !1 && (s.visible = !1),
      this.toneMapped === !1 && (s.toneMapped = !1),
      this.fog === !1 && (s.fog = !1),
      Object.keys(this.userData).length > 0 && (s.userData = this.userData));
    function o(l) {
      const u = [];
      for (const f in l) {
        const h = l[f];
        (delete h.metadata, u.push(h));
      }
      return u;
    }
    if (i) {
      const l = o(t.textures),
        u = o(t.images);
      (l.length > 0 && (s.textures = l), u.length > 0 && (s.images = u));
    }
    return s;
  }
  clone() {
    return new this.constructor().copy(this);
  }
  copy(t) {
    ((this.name = t.name),
      (this.blending = t.blending),
      (this.side = t.side),
      (this.vertexColors = t.vertexColors),
      (this.opacity = t.opacity),
      (this.transparent = t.transparent),
      (this.blendSrc = t.blendSrc),
      (this.blendDst = t.blendDst),
      (this.blendEquation = t.blendEquation),
      (this.blendSrcAlpha = t.blendSrcAlpha),
      (this.blendDstAlpha = t.blendDstAlpha),
      (this.blendEquationAlpha = t.blendEquationAlpha),
      this.blendColor.copy(t.blendColor),
      (this.blendAlpha = t.blendAlpha),
      (this.depthFunc = t.depthFunc),
      (this.depthTest = t.depthTest),
      (this.depthWrite = t.depthWrite),
      (this.stencilWriteMask = t.stencilWriteMask),
      (this.stencilFunc = t.stencilFunc),
      (this.stencilRef = t.stencilRef),
      (this.stencilFuncMask = t.stencilFuncMask),
      (this.stencilFail = t.stencilFail),
      (this.stencilZFail = t.stencilZFail),
      (this.stencilZPass = t.stencilZPass),
      (this.stencilWrite = t.stencilWrite));
    const i = t.clippingPlanes;
    let s = null;
    if (i !== null) {
      const o = i.length;
      s = new Array(o);
      for (let l = 0; l !== o; ++l) s[l] = i[l].clone();
    }
    return (
      (this.clippingPlanes = s),
      (this.clipIntersection = t.clipIntersection),
      (this.clipShadows = t.clipShadows),
      (this.shadowSide = t.shadowSide),
      (this.colorWrite = t.colorWrite),
      (this.precision = t.precision),
      (this.polygonOffset = t.polygonOffset),
      (this.polygonOffsetFactor = t.polygonOffsetFactor),
      (this.polygonOffsetUnits = t.polygonOffsetUnits),
      (this.dithering = t.dithering),
      (this.alphaTest = t.alphaTest),
      (this.alphaHash = t.alphaHash),
      (this.alphaToCoverage = t.alphaToCoverage),
      (this.premultipliedAlpha = t.premultipliedAlpha),
      (this.forceSinglePass = t.forceSinglePass),
      (this.visible = t.visible),
      (this.toneMapped = t.toneMapped),
      (this.userData = JSON.parse(JSON.stringify(t.userData))),
      this
    );
  }
  dispose() {
    this.dispatchEvent({ type: "dispose" });
  }
  set needsUpdate(t) {
    t === !0 && this.version++;
  }
}
class sw extends Ns {
  constructor(t) {
    (super(),
      (this.isMeshBasicMaterial = !0),
      (this.type = "MeshBasicMaterial"),
      (this.color = new Mi(16777215)),
      (this.map = null),
      (this.lightMap = null),
      (this.lightMapIntensity = 1),
      (this.aoMap = null),
      (this.aoMapIntensity = 1),
      (this.specularMap = null),
      (this.alphaMap = null),
      (this.envMap = null),
      (this.envMapRotation = new ss()),
      (this.combine = TS),
      (this.reflectivity = 1),
      (this.refractionRatio = 0.98),
      (this.wireframe = !1),
      (this.wireframeLinewidth = 1),
      (this.wireframeLinecap = "round"),
      (this.wireframeLinejoin = "round"),
      (this.fog = !0),
      this.setValues(t));
  }
  copy(t) {
    return (
      super.copy(t),
      this.color.copy(t.color),
      (this.map = t.map),
      (this.lightMap = t.lightMap),
      (this.lightMapIntensity = t.lightMapIntensity),
      (this.aoMap = t.aoMap),
      (this.aoMapIntensity = t.aoMapIntensity),
      (this.specularMap = t.specularMap),
      (this.alphaMap = t.alphaMap),
      (this.envMap = t.envMap),
      this.envMapRotation.copy(t.envMapRotation),
      (this.combine = t.combine),
      (this.reflectivity = t.reflectivity),
      (this.refractionRatio = t.refractionRatio),
      (this.wireframe = t.wireframe),
      (this.wireframeLinewidth = t.wireframeLinewidth),
      (this.wireframeLinecap = t.wireframeLinecap),
      (this.wireframeLinejoin = t.wireframeLinejoin),
      (this.fog = t.fog),
      this
    );
  }
}
const gn = aw();
function aw() {
  const c = new ArrayBuffer(4),
    t = new Float32Array(c),
    i = new Uint32Array(c),
    s = new Uint32Array(512),
    o = new Uint32Array(512);
  for (let h = 0; h < 256; ++h) {
    const p = h - 127;
    p < -27
      ? ((s[h] = 0), (s[h | 256] = 32768), (o[h] = 24), (o[h | 256] = 24))
      : p < -14
        ? ((s[h] = 1024 >> (-p - 14)),
          (s[h | 256] = (1024 >> (-p - 14)) | 32768),
          (o[h] = -p - 1),
          (o[h | 256] = -p - 1))
        : p <= 15
          ? ((s[h] = (p + 15) << 10),
            (s[h | 256] = ((p + 15) << 10) | 32768),
            (o[h] = 13),
            (o[h | 256] = 13))
          : p < 128
            ? ((s[h] = 31744), (s[h | 256] = 64512), (o[h] = 24), (o[h | 256] = 24))
            : ((s[h] = 31744), (s[h | 256] = 64512), (o[h] = 13), (o[h | 256] = 13));
  }
  const l = new Uint32Array(2048),
    u = new Uint32Array(64),
    f = new Uint32Array(64);
  for (let h = 1; h < 1024; ++h) {
    let p = h << 13,
      y = 0;
    for (; (p & 8388608) === 0;) ((p <<= 1), (y -= 8388608));
    ((p &= -8388609), (y += 947912704), (l[h] = p | y));
  }
  for (let h = 1024; h < 2048; ++h) l[h] = 939524096 + ((h - 1024) << 13);
  for (let h = 1; h < 31; ++h) u[h] = h << 23;
  ((u[31] = 1199570944), (u[32] = 2147483648));
  for (let h = 33; h < 63; ++h) u[h] = 2147483648 + ((h - 32) << 23);
  u[63] = 3347054592;
  for (let h = 1; h < 64; ++h) h !== 32 && (f[h] = 1024);
  return {
    floatView: t,
    uint32View: i,
    baseTable: s,
    shiftTable: o,
    mantissaTable: l,
    exponentTable: u,
    offsetTable: f,
  };
}
function ow(c) {
  (Math.abs(c) > 65504 && console.warn("THREE.DataUtils.toHalfFloat(): Value out of range."),
    (c = bt(c, -65504, 65504)),
    (gn.floatView[0] = c));
  const t = gn.uint32View[0],
    i = (t >> 23) & 511;
  return gn.baseTable[i] + ((t & 8388607) >> gn.shiftTable[i]);
}
function rw(c) {
  const t = c >> 10;
  return (
    (gn.uint32View[0] = gn.mantissaTable[gn.offsetTable[t] + (c & 1023)] + gn.exponentTable[t]),
    gn.floatView[0]
  );
}
class C4 {
  static toHalfFloat(t) {
    return ow(t);
  }
  static fromHalfFloat(t) {
    return rw(t);
  }
}
const de = new R(),
  cc = new tt();
let lw = 0;
class H {
  constructor(t, i, s = !1) {
    if (Array.isArray(t))
      throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");
    ((this.isBufferAttribute = !0),
      Object.defineProperty(this, "id", { value: lw++ }),
      (this.name = ""),
      (this.array = t),
      (this.itemSize = i),
      (this.count = t !== void 0 ? t.length / i : 0),
      (this.normalized = s),
      (this.usage = Ud),
      (this.updateRanges = []),
      (this.gpuType = yu),
      (this.version = 0));
  }
  onUploadCallback() {}
  set needsUpdate(t) {
    t === !0 && this.version++;
  }
  setUsage(t) {
    return ((this.usage = t), this);
  }
  addUpdateRange(t, i) {
    this.updateRanges.push({ start: t, count: i });
  }
  clearUpdateRanges() {
    this.updateRanges.length = 0;
  }
  copy(t) {
    return (
      (this.name = t.name),
      (this.array = new t.array.constructor(t.array)),
      (this.itemSize = t.itemSize),
      (this.count = t.count),
      (this.normalized = t.normalized),
      (this.usage = t.usage),
      (this.gpuType = t.gpuType),
      this
    );
  }
  copyAt(t, i, s) {
    ((t *= this.itemSize), (s *= i.itemSize));
    for (let o = 0, l = this.itemSize; o < l; o++) this.array[t + o] = i.array[s + o];
    return this;
  }
  copyArray(t) {
    return (this.array.set(t), this);
  }
  applyMatrix3(t) {
    if (this.itemSize === 2)
      for (let i = 0, s = this.count; i < s; i++)
        (cc.fromBufferAttribute(this, i), cc.applyMatrix3(t), this.setXY(i, cc.x, cc.y));
    else if (this.itemSize === 3)
      for (let i = 0, s = this.count; i < s; i++)
        (de.fromBufferAttribute(this, i), de.applyMatrix3(t), this.setXYZ(i, de.x, de.y, de.z));
    return this;
  }
  applyMatrix4(t) {
    for (let i = 0, s = this.count; i < s; i++)
      (de.fromBufferAttribute(this, i), de.applyMatrix4(t), this.setXYZ(i, de.x, de.y, de.z));
    return this;
  }
  applyNormalMatrix(t) {
    for (let i = 0, s = this.count; i < s; i++)
      (de.fromBufferAttribute(this, i), de.applyNormalMatrix(t), this.setXYZ(i, de.x, de.y, de.z));
    return this;
  }
  transformDirection(t) {
    for (let i = 0, s = this.count; i < s; i++)
      (de.fromBufferAttribute(this, i), de.transformDirection(t), this.setXYZ(i, de.x, de.y, de.z));
    return this;
  }
  set(t, i = 0) {
    return (this.array.set(t, i), this);
  }
  getComponent(t, i) {
    let s = this.array[t * this.itemSize + i];
    return (this.normalized && (s = Di(s, this.array)), s);
  }
  setComponent(t, i, s) {
    return (
      this.normalized && (s = Lt(s, this.array)),
      (this.array[t * this.itemSize + i] = s),
      this
    );
  }
  getX(t) {
    let i = this.array[t * this.itemSize];
    return (this.normalized && (i = Di(i, this.array)), i);
  }
  setX(t, i) {
    return (this.normalized && (i = Lt(i, this.array)), (this.array[t * this.itemSize] = i), this);
  }
  getY(t) {
    let i = this.array[t * this.itemSize + 1];
    return (this.normalized && (i = Di(i, this.array)), i);
  }
  setY(t, i) {
    return (
      this.normalized && (i = Lt(i, this.array)),
      (this.array[t * this.itemSize + 1] = i),
      this
    );
  }
  getZ(t) {
    let i = this.array[t * this.itemSize + 2];
    return (this.normalized && (i = Di(i, this.array)), i);
  }
  setZ(t, i) {
    return (
      this.normalized && (i = Lt(i, this.array)),
      (this.array[t * this.itemSize + 2] = i),
      this
    );
  }
  getW(t) {
    let i = this.array[t * this.itemSize + 3];
    return (this.normalized && (i = Di(i, this.array)), i);
  }
  setW(t, i) {
    return (
      this.normalized && (i = Lt(i, this.array)),
      (this.array[t * this.itemSize + 3] = i),
      this
    );
  }
  setXY(t, i, s) {
    return (
      (t *= this.itemSize),
      this.normalized && ((i = Lt(i, this.array)), (s = Lt(s, this.array))),
      (this.array[t + 0] = i),
      (this.array[t + 1] = s),
      this
    );
  }
  setXYZ(t, i, s, o) {
    return (
      (t *= this.itemSize),
      this.normalized &&
        ((i = Lt(i, this.array)), (s = Lt(s, this.array)), (o = Lt(o, this.array))),
      (this.array[t + 0] = i),
      (this.array[t + 1] = s),
      (this.array[t + 2] = o),
      this
    );
  }
  setXYZW(t, i, s, o, l) {
    return (
      (t *= this.itemSize),
      this.normalized &&
        ((i = Lt(i, this.array)),
        (s = Lt(s, this.array)),
        (o = Lt(o, this.array)),
        (l = Lt(l, this.array))),
      (this.array[t + 0] = i),
      (this.array[t + 1] = s),
      (this.array[t + 2] = o),
      (this.array[t + 3] = l),
      this
    );
  }
  onUpload(t) {
    return ((this.onUploadCallback = t), this);
  }
  clone() {
    return new this.constructor(this.array, this.itemSize).copy(this);
  }
  toJSON() {
    const t = {
      itemSize: this.itemSize,
      type: this.array.constructor.name,
      array: Array.from(this.array),
      normalized: this.normalized,
    };
    return (
      this.name !== "" && (t.name = this.name),
      this.usage !== Ud && (t.usage = this.usage),
      t
    );
  }
}
class cw extends H {
  constructor(t, i, s) {
    super(new Uint16Array(t), i, s);
  }
}
class uw extends H {
  constructor(t, i, s) {
    super(new Uint32Array(t), i, s);
  }
}
class ze extends H {
  constructor(t, i, s) {
    super(new Float32Array(t), i, s);
  }
}
let hw = 0;
const vi = new Ct(),
  fd = new le(),
  Oa = new R(),
  ni = new as(),
  Qo = new as(),
  ge = new R();
class At extends Or {
  constructor() {
    (super(),
      (this.isBufferGeometry = !0),
      Object.defineProperty(this, "id", { value: hw++ }),
      (this.uuid = Ai()),
      (this.name = ""),
      (this.type = "BufferGeometry"),
      (this.index = null),
      (this.indirect = null),
      (this.attributes = {}),
      (this.morphAttributes = {}),
      (this.morphTargetsRelative = !1),
      (this.groups = []),
      (this.boundingBox = null),
      (this.boundingSphere = null),
      (this.drawRange = { start: 0, count: 1 / 0 }),
      (this.userData = {}));
  }
  getIndex() {
    return this.index;
  }
  setIndex(t) {
    return (Array.isArray(t) ? (this.index = new (j3(t) ? uw : cw)(t, 1)) : (this.index = t), this);
  }
  setIndirect(t) {
    return ((this.indirect = t), this);
  }
  getIndirect() {
    return this.indirect;
  }
  getAttribute(t) {
    return this.attributes[t];
  }
  setAttribute(t, i) {
    return ((this.attributes[t] = i), this);
  }
  deleteAttribute(t) {
    return (delete this.attributes[t], this);
  }
  hasAttribute(t) {
    return this.attributes[t] !== void 0;
  }
  addGroup(t, i, s = 0) {
    this.groups.push({ start: t, count: i, materialIndex: s });
  }
  clearGroups() {
    this.groups = [];
  }
  setDrawRange(t, i) {
    ((this.drawRange.start = t), (this.drawRange.count = i));
  }
  applyMatrix4(t) {
    const i = this.attributes.position;
    i !== void 0 && (i.applyMatrix4(t), (i.needsUpdate = !0));
    const s = this.attributes.normal;
    if (s !== void 0) {
      const l = new Sn().getNormalMatrix(t);
      (s.applyNormalMatrix(l), (s.needsUpdate = !0));
    }
    const o = this.attributes.tangent;
    return (
      o !== void 0 && (o.transformDirection(t), (o.needsUpdate = !0)),
      this.boundingBox !== null && this.computeBoundingBox(),
      this.boundingSphere !== null && this.computeBoundingSphere(),
      this
    );
  }
  applyQuaternion(t) {
    return (vi.makeRotationFromQuaternion(t), this.applyMatrix4(vi), this);
  }
  rotateX(t) {
    return (vi.makeRotationX(t), this.applyMatrix4(vi), this);
  }
  rotateY(t) {
    return (vi.makeRotationY(t), this.applyMatrix4(vi), this);
  }
  rotateZ(t) {
    return (vi.makeRotationZ(t), this.applyMatrix4(vi), this);
  }
  translate(t, i, s) {
    return (vi.makeTranslation(t, i, s), this.applyMatrix4(vi), this);
  }
  scale(t, i, s) {
    return (vi.makeScale(t, i, s), this.applyMatrix4(vi), this);
  }
  lookAt(t) {
    return (fd.lookAt(t), fd.updateMatrix(), this.applyMatrix4(fd.matrix), this);
  }
  center() {
    return (
      this.computeBoundingBox(),
      this.boundingBox.getCenter(Oa).negate(),
      this.translate(Oa.x, Oa.y, Oa.z),
      this
    );
  }
  setFromPoints(t) {
    const i = this.getAttribute("position");
    if (i === void 0) {
      const s = [];
      for (let o = 0, l = t.length; o < l; o++) {
        const u = t[o];
        s.push(u.x, u.y, u.z || 0);
      }
      this.setAttribute("position", new ze(s, 3));
    } else {
      const s = Math.min(t.length, i.count);
      for (let o = 0; o < s; o++) {
        const l = t[o];
        i.setXYZ(o, l.x, l.y, l.z || 0);
      }
      (t.length > i.count &&
        console.warn(
          "THREE.BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry.",
        ),
        (i.needsUpdate = !0));
    }
    return this;
  }
  computeBoundingBox() {
    this.boundingBox === null && (this.boundingBox = new as());
    const t = this.attributes.position,
      i = this.morphAttributes.position;
    if (t && t.isGLBufferAttribute) {
      (console.error(
        "THREE.BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",
        this,
      ),
        this.boundingBox.set(new R(-1 / 0, -1 / 0, -1 / 0), new R(1 / 0, 1 / 0, 1 / 0)));
      return;
    }
    if (t !== void 0) {
      if ((this.boundingBox.setFromBufferAttribute(t), i))
        for (let s = 0, o = i.length; s < o; s++) {
          const l = i[s];
          (ni.setFromBufferAttribute(l),
            this.morphTargetsRelative
              ? (ge.addVectors(this.boundingBox.min, ni.min),
                this.boundingBox.expandByPoint(ge),
                ge.addVectors(this.boundingBox.max, ni.max),
                this.boundingBox.expandByPoint(ge))
              : (this.boundingBox.expandByPoint(ni.min), this.boundingBox.expandByPoint(ni.max)));
        }
    } else this.boundingBox.makeEmpty();
    (isNaN(this.boundingBox.min.x) ||
      isNaN(this.boundingBox.min.y) ||
      isNaN(this.boundingBox.min.z)) &&
      console.error(
        'THREE.BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',
        this,
      );
  }
  computeBoundingSphere() {
    this.boundingSphere === null && (this.boundingSphere = new wn());
    const t = this.attributes.position,
      i = this.morphAttributes.position;
    if (t && t.isGLBufferAttribute) {
      (console.error(
        "THREE.BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",
        this,
      ),
        this.boundingSphere.set(new R(), 1 / 0));
      return;
    }
    if (t) {
      const s = this.boundingSphere.center;
      if ((ni.setFromBufferAttribute(t), i))
        for (let l = 0, u = i.length; l < u; l++) {
          const f = i[l];
          (Qo.setFromBufferAttribute(f),
            this.morphTargetsRelative
              ? (ge.addVectors(ni.min, Qo.min),
                ni.expandByPoint(ge),
                ge.addVectors(ni.max, Qo.max),
                ni.expandByPoint(ge))
              : (ni.expandByPoint(Qo.min), ni.expandByPoint(Qo.max)));
        }
      ni.getCenter(s);
      let o = 0;
      for (let l = 0, u = t.count; l < u; l++)
        (ge.fromBufferAttribute(t, l), (o = Math.max(o, s.distanceToSquared(ge))));
      if (i)
        for (let l = 0, u = i.length; l < u; l++) {
          const f = i[l],
            h = this.morphTargetsRelative;
          for (let p = 0, y = f.count; p < y; p++)
            (ge.fromBufferAttribute(f, p),
              h && (Oa.fromBufferAttribute(t, p), ge.add(Oa)),
              (o = Math.max(o, s.distanceToSquared(ge))));
        }
      ((this.boundingSphere.radius = Math.sqrt(o)),
        isNaN(this.boundingSphere.radius) &&
          console.error(
            'THREE.BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',
            this,
          ));
    }
  }
  computeTangents() {
    const t = this.index,
      i = this.attributes;
    if (t === null || i.position === void 0 || i.normal === void 0 || i.uv === void 0) {
      console.error(
        "THREE.BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)",
      );
      return;
    }
    const s = i.position,
      o = i.normal,
      l = i.uv;
    this.hasAttribute("tangent") === !1 &&
      this.setAttribute("tangent", new H(new Float32Array(4 * s.count), 4));
    const u = this.getAttribute("tangent"),
      f = [],
      h = [];
    for (let G = 0; G < s.count; G++) ((f[G] = new R()), (h[G] = new R()));
    const p = new R(),
      y = new R(),
      g = new R(),
      v = new tt(),
      b = new tt(),
      S = new tt(),
      A = new R(),
      M = new R();
    function T(G, W, P) {
      (p.fromBufferAttribute(s, G),
        y.fromBufferAttribute(s, W),
        g.fromBufferAttribute(s, P),
        v.fromBufferAttribute(l, G),
        b.fromBufferAttribute(l, W),
        S.fromBufferAttribute(l, P),
        y.sub(p),
        g.sub(p),
        b.sub(v),
        S.sub(v));
      const Q = 1 / (b.x * S.y - S.x * b.y);
      isFinite(Q) &&
        (A.copy(y).multiplyScalar(S.y).addScaledVector(g, -b.y).multiplyScalar(Q),
        M.copy(g).multiplyScalar(b.x).addScaledVector(y, -S.x).multiplyScalar(Q),
        f[G].add(A),
        f[W].add(A),
        f[P].add(A),
        h[G].add(M),
        h[W].add(M),
        h[P].add(M));
    }
    let O = this.groups;
    O.length === 0 && (O = [{ start: 0, count: t.count }]);
    for (let G = 0, W = O.length; G < W; ++G) {
      const P = O[G],
        Q = P.start,
        rt = P.count;
      for (let ht = Q, xt = Q + rt; ht < xt; ht += 3)
        T(t.getX(ht + 0), t.getX(ht + 1), t.getX(ht + 2));
    }
    const C = new R(),
      E = new R(),
      U = new R(),
      q = new R();
    function X(G) {
      (U.fromBufferAttribute(o, G), q.copy(U));
      const W = f[G];
      (C.copy(W), C.sub(U.multiplyScalar(U.dot(W))).normalize(), E.crossVectors(q, W));
      const Q = E.dot(h[G]) < 0 ? -1 : 1;
      u.setXYZW(G, C.x, C.y, C.z, Q);
    }
    for (let G = 0, W = O.length; G < W; ++G) {
      const P = O[G],
        Q = P.start,
        rt = P.count;
      for (let ht = Q, xt = Q + rt; ht < xt; ht += 3)
        (X(t.getX(ht + 0)), X(t.getX(ht + 1)), X(t.getX(ht + 2)));
    }
  }
  computeVertexNormals() {
    const t = this.index,
      i = this.getAttribute("position");
    if (i !== void 0) {
      let s = this.getAttribute("normal");
      if (s === void 0)
        ((s = new H(new Float32Array(i.count * 3), 3)), this.setAttribute("normal", s));
      else for (let v = 0, b = s.count; v < b; v++) s.setXYZ(v, 0, 0, 0);
      const o = new R(),
        l = new R(),
        u = new R(),
        f = new R(),
        h = new R(),
        p = new R(),
        y = new R(),
        g = new R();
      if (t)
        for (let v = 0, b = t.count; v < b; v += 3) {
          const S = t.getX(v + 0),
            A = t.getX(v + 1),
            M = t.getX(v + 2);
          (o.fromBufferAttribute(i, S),
            l.fromBufferAttribute(i, A),
            u.fromBufferAttribute(i, M),
            y.subVectors(u, l),
            g.subVectors(o, l),
            y.cross(g),
            f.fromBufferAttribute(s, S),
            h.fromBufferAttribute(s, A),
            p.fromBufferAttribute(s, M),
            f.add(y),
            h.add(y),
            p.add(y),
            s.setXYZ(S, f.x, f.y, f.z),
            s.setXYZ(A, h.x, h.y, h.z),
            s.setXYZ(M, p.x, p.y, p.z));
        }
      else
        for (let v = 0, b = i.count; v < b; v += 3)
          (o.fromBufferAttribute(i, v + 0),
            l.fromBufferAttribute(i, v + 1),
            u.fromBufferAttribute(i, v + 2),
            y.subVectors(u, l),
            g.subVectors(o, l),
            y.cross(g),
            s.setXYZ(v + 0, y.x, y.y, y.z),
            s.setXYZ(v + 1, y.x, y.y, y.z),
            s.setXYZ(v + 2, y.x, y.y, y.z));
      (this.normalizeNormals(), (s.needsUpdate = !0));
    }
  }
  normalizeNormals() {
    const t = this.attributes.normal;
    for (let i = 0, s = t.count; i < s; i++)
      (ge.fromBufferAttribute(t, i), ge.normalize(), t.setXYZ(i, ge.x, ge.y, ge.z));
  }
  toNonIndexed() {
    function t(f, h) {
      const p = f.array,
        y = f.itemSize,
        g = f.normalized,
        v = new p.constructor(h.length * y);
      let b = 0,
        S = 0;
      for (let A = 0, M = h.length; A < M; A++) {
        f.isInterleavedBufferAttribute ? (b = h[A] * f.data.stride + f.offset) : (b = h[A] * y);
        for (let T = 0; T < y; T++) v[S++] = p[b++];
      }
      return new H(v, y, g);
    }
    if (this.index === null)
      return (
        console.warn("THREE.BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),
        this
      );
    const i = new At(),
      s = this.index.array,
      o = this.attributes;
    for (const f in o) {
      const h = o[f],
        p = t(h, s);
      i.setAttribute(f, p);
    }
    const l = this.morphAttributes;
    for (const f in l) {
      const h = [],
        p = l[f];
      for (let y = 0, g = p.length; y < g; y++) {
        const v = p[y],
          b = t(v, s);
        h.push(b);
      }
      i.morphAttributes[f] = h;
    }
    i.morphTargetsRelative = this.morphTargetsRelative;
    const u = this.groups;
    for (let f = 0, h = u.length; f < h; f++) {
      const p = u[f];
      i.addGroup(p.start, p.count, p.materialIndex);
    }
    return i;
  }
  toJSON() {
    const t = {
      metadata: { version: 4.7, type: "BufferGeometry", generator: "BufferGeometry.toJSON" },
    };
    if (
      ((t.uuid = this.uuid),
      (t.type = this.type),
      this.name !== "" && (t.name = this.name),
      Object.keys(this.userData).length > 0 && (t.userData = this.userData),
      this.parameters !== void 0)
    ) {
      const h = this.parameters;
      for (const p in h) h[p] !== void 0 && (t[p] = h[p]);
      return t;
    }
    t.data = { attributes: {} };
    const i = this.index;
    i !== null &&
      (t.data.index = {
        type: i.array.constructor.name,
        array: Array.prototype.slice.call(i.array),
      });
    const s = this.attributes;
    for (const h in s) {
      const p = s[h];
      t.data.attributes[h] = p.toJSON(t.data);
    }
    const o = {};
    let l = !1;
    for (const h in this.morphAttributes) {
      const p = this.morphAttributes[h],
        y = [];
      for (let g = 0, v = p.length; g < v; g++) {
        const b = p[g];
        y.push(b.toJSON(t.data));
      }
      y.length > 0 && ((o[h] = y), (l = !0));
    }
    l && ((t.data.morphAttributes = o), (t.data.morphTargetsRelative = this.morphTargetsRelative));
    const u = this.groups;
    u.length > 0 && (t.data.groups = JSON.parse(JSON.stringify(u)));
    const f = this.boundingSphere;
    return (f !== null && (t.data.boundingSphere = f.toJSON()), t);
  }
  clone() {
    return new this.constructor().copy(this);
  }
  copy(t) {
    ((this.index = null),
      (this.attributes = {}),
      (this.morphAttributes = {}),
      (this.groups = []),
      (this.boundingBox = null),
      (this.boundingSphere = null));
    const i = {};
    this.name = t.name;
    const s = t.index;
    s !== null && this.setIndex(s.clone());
    const o = t.attributes;
    for (const p in o) {
      const y = o[p];
      this.setAttribute(p, y.clone(i));
    }
    const l = t.morphAttributes;
    for (const p in l) {
      const y = [],
        g = l[p];
      for (let v = 0, b = g.length; v < b; v++) y.push(g[v].clone(i));
      this.morphAttributes[p] = y;
    }
    this.morphTargetsRelative = t.morphTargetsRelative;
    const u = t.groups;
    for (let p = 0, y = u.length; p < y; p++) {
      const g = u[p];
      this.addGroup(g.start, g.count, g.materialIndex);
    }
    const f = t.boundingBox;
    f !== null && (this.boundingBox = f.clone());
    const h = t.boundingSphere;
    return (
      h !== null && (this.boundingSphere = h.clone()),
      (this.drawRange.start = t.drawRange.start),
      (this.drawRange.count = t.drawRange.count),
      (this.userData = t.userData),
      this
    );
  }
  dispose() {
    this.dispatchEvent({ type: "dispose" });
  }
}
const Jg = new Ct(),
  Es = new gu(),
  uc = new wn(),
  Qg = new R(),
  hc = new R(),
  fc = new R(),
  dc = new R(),
  dd = new R(),
  pc = new R(),
  Kg = new R(),
  mc = new R();
class $t extends le {
  constructor(t = new At(), i = new sw()) {
    (super(),
      (this.isMesh = !0),
      (this.type = "Mesh"),
      (this.geometry = t),
      (this.material = i),
      (this.morphTargetDictionary = void 0),
      (this.morphTargetInfluences = void 0),
      (this.count = 1),
      this.updateMorphTargets());
  }
  copy(t, i) {
    return (
      super.copy(t, i),
      t.morphTargetInfluences !== void 0 &&
        (this.morphTargetInfluences = t.morphTargetInfluences.slice()),
      t.morphTargetDictionary !== void 0 &&
        (this.morphTargetDictionary = Object.assign({}, t.morphTargetDictionary)),
      (this.material = Array.isArray(t.material) ? t.material.slice() : t.material),
      (this.geometry = t.geometry),
      this
    );
  }
  updateMorphTargets() {
    const i = this.geometry.morphAttributes,
      s = Object.keys(i);
    if (s.length > 0) {
      const o = i[s[0]];
      if (o !== void 0) {
        ((this.morphTargetInfluences = []), (this.morphTargetDictionary = {}));
        for (let l = 0, u = o.length; l < u; l++) {
          const f = o[l].name || String(l);
          (this.morphTargetInfluences.push(0), (this.morphTargetDictionary[f] = l));
        }
      }
    }
  }
  getVertexPosition(t, i) {
    const s = this.geometry,
      o = s.attributes.position,
      l = s.morphAttributes.position,
      u = s.morphTargetsRelative;
    i.fromBufferAttribute(o, t);
    const f = this.morphTargetInfluences;
    if (l && f) {
      pc.set(0, 0, 0);
      for (let h = 0, p = l.length; h < p; h++) {
        const y = f[h],
          g = l[h];
        y !== 0 &&
          (dd.fromBufferAttribute(g, t),
          u ? pc.addScaledVector(dd, y) : pc.addScaledVector(dd.sub(i), y));
      }
      i.add(pc);
    }
    return i;
  }
  raycast(t, i) {
    const s = this.geometry,
      o = this.material,
      l = this.matrixWorld;
    o !== void 0 &&
      (s.boundingSphere === null && s.computeBoundingSphere(),
      uc.copy(s.boundingSphere),
      uc.applyMatrix4(l),
      Es.copy(t.ray).recast(t.near),
      !(
        uc.containsPoint(Es.origin) === !1 &&
        (Es.intersectSphere(uc, Qg) === null ||
          Es.origin.distanceToSquared(Qg) > (t.far - t.near) ** 2)
      ) &&
        (Jg.copy(l).invert(),
        Es.copy(t.ray).applyMatrix4(Jg),
        !(s.boundingBox !== null && Es.intersectsBox(s.boundingBox) === !1) &&
          this._computeIntersections(t, i, Es)));
  }
  _computeIntersections(t, i, s) {
    let o;
    const l = this.geometry,
      u = this.material,
      f = l.index,
      h = l.attributes.position,
      p = l.attributes.uv,
      y = l.attributes.uv1,
      g = l.attributes.normal,
      v = l.groups,
      b = l.drawRange;
    if (f !== null)
      if (Array.isArray(u))
        for (let S = 0, A = v.length; S < A; S++) {
          const M = v[S],
            T = u[M.materialIndex],
            O = Math.max(M.start, b.start),
            C = Math.min(f.count, Math.min(M.start + M.count, b.start + b.count));
          for (let E = O, U = C; E < U; E += 3) {
            const q = f.getX(E),
              X = f.getX(E + 1),
              G = f.getX(E + 2);
            ((o = yc(this, T, t, s, p, y, g, q, X, G)),
              o &&
                ((o.faceIndex = Math.floor(E / 3)),
                (o.face.materialIndex = M.materialIndex),
                i.push(o)));
          }
        }
      else {
        const S = Math.max(0, b.start),
          A = Math.min(f.count, b.start + b.count);
        for (let M = S, T = A; M < T; M += 3) {
          const O = f.getX(M),
            C = f.getX(M + 1),
            E = f.getX(M + 2);
          ((o = yc(this, u, t, s, p, y, g, O, C, E)),
            o && ((o.faceIndex = Math.floor(M / 3)), i.push(o)));
        }
      }
    else if (h !== void 0)
      if (Array.isArray(u))
        for (let S = 0, A = v.length; S < A; S++) {
          const M = v[S],
            T = u[M.materialIndex],
            O = Math.max(M.start, b.start),
            C = Math.min(h.count, Math.min(M.start + M.count, b.start + b.count));
          for (let E = O, U = C; E < U; E += 3) {
            const q = E,
              X = E + 1,
              G = E + 2;
            ((o = yc(this, T, t, s, p, y, g, q, X, G)),
              o &&
                ((o.faceIndex = Math.floor(E / 3)),
                (o.face.materialIndex = M.materialIndex),
                i.push(o)));
          }
        }
      else {
        const S = Math.max(0, b.start),
          A = Math.min(h.count, b.start + b.count);
        for (let M = S, T = A; M < T; M += 3) {
          const O = M,
            C = M + 1,
            E = M + 2;
          ((o = yc(this, u, t, s, p, y, g, O, C, E)),
            o && ((o.faceIndex = Math.floor(M / 3)), i.push(o)));
        }
      }
  }
}
function fw(c, t, i, s, o, l, u, f) {
  let h;
  if (
    (t.side === A1
      ? (h = s.intersectTriangle(u, l, o, !0, f))
      : (h = s.intersectTriangle(o, l, u, t.side === Dd, f)),
    h === null)
  )
    return null;
  (mc.copy(f), mc.applyMatrix4(c.matrixWorld));
  const p = i.ray.origin.distanceTo(mc);
  return p < i.near || p > i.far ? null : { distance: p, point: mc.clone(), object: c };
}
function yc(c, t, i, s, o, l, u, f, h, p) {
  (c.getVertexPosition(f, hc), c.getVertexPosition(h, fc), c.getVertexPosition(p, dc));
  const y = fw(c, t, i, s, hc, fc, dc, Kg);
  if (y) {
    const g = new R();
    (Ni.getBarycoord(Kg, hc, fc, dc, g),
      o && (y.uv = Ni.getInterpolatedAttribute(o, f, h, p, g, new tt())),
      l && (y.uv1 = Ni.getInterpolatedAttribute(l, f, h, p, g, new tt())),
      u &&
        ((y.normal = Ni.getInterpolatedAttribute(u, f, h, p, g, new R())),
        y.normal.dot(s.direction) > 0 && y.normal.multiplyScalar(-1)));
    const v = { a: f, b: h, c: p, normal: new R(), materialIndex: 0 };
    (Ni.getNormal(hc, fc, dc, v.normal), (y.face = v), (y.barycoord = g));
  }
  return y;
}
class t0 extends At {
  constructor(t = 1, i = 1, s = 1, o = 1, l = 1, u = 1) {
    (super(),
      (this.type = "BoxGeometry"),
      (this.parameters = {
        width: t,
        height: i,
        depth: s,
        widthSegments: o,
        heightSegments: l,
        depthSegments: u,
      }));
    const f = this;
    ((o = Math.floor(o)), (l = Math.floor(l)), (u = Math.floor(u)));
    const h = [],
      p = [],
      y = [],
      g = [];
    let v = 0,
      b = 0;
    (S("z", "y", "x", -1, -1, s, i, t, u, l, 0),
      S("z", "y", "x", 1, -1, s, i, -t, u, l, 1),
      S("x", "z", "y", 1, 1, t, s, i, o, u, 2),
      S("x", "z", "y", 1, -1, t, s, -i, o, u, 3),
      S("x", "y", "z", 1, -1, t, i, s, o, l, 4),
      S("x", "y", "z", -1, -1, t, i, -s, o, l, 5),
      this.setIndex(h),
      this.setAttribute("position", new ze(p, 3)),
      this.setAttribute("normal", new ze(y, 3)),
      this.setAttribute("uv", new ze(g, 2)));
    function S(A, M, T, O, C, E, U, q, X, G, W) {
      const P = E / X,
        Q = U / G,
        rt = E / 2,
        ht = U / 2,
        xt = q / 2,
        ft = X + 1,
        L = G + 1;
      let I = 0,
        nt = 0;
      const lt = new R();
      for (let ut = 0; ut < L; ut++) {
        const gt = ut * Q - ht;
        for (let zt = 0; zt < ft; zt++) {
          const pt = zt * P - rt;
          ((lt[A] = pt * O),
            (lt[M] = gt * C),
            (lt[T] = xt),
            p.push(lt.x, lt.y, lt.z),
            (lt[A] = 0),
            (lt[M] = 0),
            (lt[T] = q > 0 ? 1 : -1),
            y.push(lt.x, lt.y, lt.z),
            g.push(zt / X),
            g.push(1 - ut / G),
            (I += 1));
        }
      }
      for (let ut = 0; ut < G; ut++)
        for (let gt = 0; gt < X; gt++) {
          const zt = v + gt + ft * ut,
            pt = v + gt + ft * (ut + 1),
            Zt = v + (gt + 1) + ft * (ut + 1),
            Ee = v + (gt + 1) + ft * ut;
          (h.push(zt, pt, Ee), h.push(pt, Zt, Ee), (nt += 6));
        }
      (f.addGroup(b, nt, W), (b += nt), (v += I));
    }
  }
  copy(t) {
    return (super.copy(t), (this.parameters = Object.assign({}, t.parameters)), this);
  }
  static fromJSON(t) {
    return new t0(t.width, t.height, t.depth, t.widthSegments, t.heightSegments, t.depthSegments);
  }
}
function vu(c) {
  const t = {};
  for (const i in c) {
    t[i] = {};
    for (const s in c[i]) {
      const o = c[i][s];
      o &&
      (o.isColor ||
        o.isMatrix3 ||
        o.isMatrix4 ||
        o.isVector2 ||
        o.isVector3 ||
        o.isVector4 ||
        o.isTexture ||
        o.isQuaternion)
        ? o.isRenderTargetTexture
          ? (console.warn(
              "UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms().",
            ),
            (t[i][s] = null))
          : (t[i][s] = o.clone())
        : Array.isArray(o)
          ? (t[i][s] = o.slice())
          : (t[i][s] = o);
    }
  }
  return t;
}
function dw(c) {
  const t = {};
  for (let i = 0; i < c.length; i++) {
    const s = vu(c[i]);
    for (const o in s) t[o] = s[o];
  }
  return t;
}
function pw(c) {
  const t = [];
  for (let i = 0; i < c.length; i++) t.push(c[i].clone());
  return t;
}
function O4(c) {
  const t = c.getRenderTarget();
  return t === null
    ? c.outputColorSpace
    : t.isXRRenderTarget === !0
      ? t.texture.colorSpace
      : bi.workingColorSpace;
}
const B4 = { clone: vu, merge: dw };
var mw = `void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,
  yw = `void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`;
class dt extends Ns {
  constructor(t) {
    (super(),
      (this.isShaderMaterial = !0),
      (this.type = "ShaderMaterial"),
      (this.defines = {}),
      (this.uniforms = {}),
      (this.uniformsGroups = []),
      (this.vertexShader = mw),
      (this.fragmentShader = yw),
      (this.linewidth = 1),
      (this.wireframe = !1),
      (this.wireframeLinewidth = 1),
      (this.fog = !1),
      (this.lights = !1),
      (this.clipping = !1),
      (this.forceSinglePass = !0),
      (this.extensions = { clipCullDistance: !1, multiDraw: !1 }),
      (this.defaultAttributeValues = { color: [1, 1, 1], uv: [0, 0], uv1: [0, 0] }),
      (this.index0AttributeName = void 0),
      (this.uniformsNeedUpdate = !1),
      (this.glslVersion = null),
      t !== void 0 && this.setValues(t));
  }
  copy(t) {
    return (
      super.copy(t),
      (this.fragmentShader = t.fragmentShader),
      (this.vertexShader = t.vertexShader),
      (this.uniforms = vu(t.uniforms)),
      (this.uniformsGroups = pw(t.uniformsGroups)),
      (this.defines = Object.assign({}, t.defines)),
      (this.wireframe = t.wireframe),
      (this.wireframeLinewidth = t.wireframeLinewidth),
      (this.fog = t.fog),
      (this.lights = t.lights),
      (this.clipping = t.clipping),
      (this.extensions = Object.assign({}, t.extensions)),
      (this.glslVersion = t.glslVersion),
      this
    );
  }
  toJSON(t) {
    const i = super.toJSON(t);
    ((i.glslVersion = this.glslVersion), (i.uniforms = {}));
    for (const o in this.uniforms) {
      const u = this.uniforms[o].value;
      u && u.isTexture
        ? (i.uniforms[o] = { type: "t", value: u.toJSON(t).uuid })
        : u && u.isColor
          ? (i.uniforms[o] = { type: "c", value: u.getHex() })
          : u && u.isVector2
            ? (i.uniforms[o] = { type: "v2", value: u.toArray() })
            : u && u.isVector3
              ? (i.uniforms[o] = { type: "v3", value: u.toArray() })
              : u && u.isVector4
                ? (i.uniforms[o] = { type: "v4", value: u.toArray() })
                : u && u.isMatrix3
                  ? (i.uniforms[o] = { type: "m3", value: u.toArray() })
                  : u && u.isMatrix4
                    ? (i.uniforms[o] = { type: "m4", value: u.toArray() })
                    : (i.uniforms[o] = { value: u });
    }
    (Object.keys(this.defines).length > 0 && (i.defines = this.defines),
      (i.vertexShader = this.vertexShader),
      (i.fragmentShader = this.fragmentShader),
      (i.lights = this.lights),
      (i.clipping = this.clipping));
    const s = {};
    for (const o in this.extensions) this.extensions[o] === !0 && (s[o] = !0);
    return (Object.keys(s).length > 0 && (i.extensions = s), i);
  }
}
class C1 extends le {
  constructor() {
    (super(),
      (this.isCamera = !0),
      (this.type = "Camera"),
      (this.matrixWorldInverse = new Ct()),
      (this.projectionMatrix = new Ct()),
      (this.projectionMatrixInverse = new Ct()),
      (this.coordinateSystem = is),
      (this._reversedDepth = !1));
  }
  get reversedDepth() {
    return this._reversedDepth;
  }
  copy(t, i) {
    return (
      super.copy(t, i),
      this.matrixWorldInverse.copy(t.matrixWorldInverse),
      this.projectionMatrix.copy(t.projectionMatrix),
      this.projectionMatrixInverse.copy(t.projectionMatrixInverse),
      (this.coordinateSystem = t.coordinateSystem),
      this
    );
  }
  getWorldDirection(t) {
    return super.getWorldDirection(t).negate();
  }
  updateMatrixWorld(t) {
    (super.updateMatrixWorld(t), this.matrixWorldInverse.copy(this.matrixWorld).invert());
  }
  updateWorldMatrix(t, i) {
    (super.updateWorldMatrix(t, i), this.matrixWorldInverse.copy(this.matrixWorld).invert());
  }
  clone() {
    return new this.constructor().copy(this);
  }
}
const es = new R(),
  $g = new tt(),
  tv = new tt();
class yn extends C1 {
  constructor(t = 50, i = 1, s = 0.1, o = 2e3) {
    (super(),
      (this.isPerspectiveCamera = !0),
      (this.type = "PerspectiveCamera"),
      (this.fov = t),
      (this.zoom = 1),
      (this.near = s),
      (this.far = o),
      (this.focus = 10),
      (this.aspect = i),
      (this.view = null),
      (this.filmGauge = 35),
      (this.filmOffset = 0),
      this.updateProjectionMatrix());
  }
  copy(t, i) {
    return (
      super.copy(t, i),
      (this.fov = t.fov),
      (this.zoom = t.zoom),
      (this.near = t.near),
      (this.far = t.far),
      (this.focus = t.focus),
      (this.aspect = t.aspect),
      (this.view = t.view === null ? null : Object.assign({}, t.view)),
      (this.filmGauge = t.filmGauge),
      (this.filmOffset = t.filmOffset),
      this
    );
  }
  setFocalLength(t) {
    const i = (0.5 * this.getFilmHeight()) / t;
    ((this.fov = vr * 2 * Math.atan(i)), this.updateProjectionMatrix());
  }
  getFocalLength() {
    const t = Math.tan(pr * 0.5 * this.fov);
    return (0.5 * this.getFilmHeight()) / t;
  }
  getEffectiveFOV() {
    return vr * 2 * Math.atan(Math.tan(pr * 0.5 * this.fov) / this.zoom);
  }
  getFilmWidth() {
    return this.filmGauge * Math.min(this.aspect, 1);
  }
  getFilmHeight() {
    return this.filmGauge / Math.max(this.aspect, 1);
  }
  getViewBounds(t, i, s) {
    (es.set(-1, -1, 0.5).applyMatrix4(this.projectionMatrixInverse),
      i.set(es.x, es.y).multiplyScalar(-t / es.z),
      es.set(1, 1, 0.5).applyMatrix4(this.projectionMatrixInverse),
      s.set(es.x, es.y).multiplyScalar(-t / es.z));
  }
  getViewSize(t, i) {
    return (this.getViewBounds(t, $g, tv), i.subVectors(tv, $g));
  }
  setViewOffset(t, i, s, o, l, u) {
    ((this.aspect = t / i),
      this.view === null &&
        (this.view = {
          enabled: !0,
          fullWidth: 1,
          fullHeight: 1,
          offsetX: 0,
          offsetY: 0,
          width: 1,
          height: 1,
        }),
      (this.view.enabled = !0),
      (this.view.fullWidth = t),
      (this.view.fullHeight = i),
      (this.view.offsetX = s),
      (this.view.offsetY = o),
      (this.view.width = l),
      (this.view.height = u),
      this.updateProjectionMatrix());
  }
  clearViewOffset() {
    (this.view !== null && (this.view.enabled = !1), this.updateProjectionMatrix());
  }
  updateProjectionMatrix() {
    const t = this.near;
    let i = (t * Math.tan(pr * 0.5 * this.fov)) / this.zoom,
      s = 2 * i,
      o = this.aspect * s,
      l = -0.5 * o;
    const u = this.view;
    if (this.view !== null && this.view.enabled) {
      const h = u.fullWidth,
        p = u.fullHeight;
      ((l += (u.offsetX * o) / h),
        (i -= (u.offsetY * s) / p),
        (o *= u.width / h),
        (s *= u.height / p));
    }
    const f = this.filmOffset;
    (f !== 0 && (l += (t * f) / this.getFilmWidth()),
      this.projectionMatrix.makePerspective(
        l,
        l + o,
        i,
        i - s,
        t,
        this.far,
        this.coordinateSystem,
        this.reversedDepth,
      ),
      this.projectionMatrixInverse.copy(this.projectionMatrix).invert());
  }
  toJSON(t) {
    const i = super.toJSON(t);
    return (
      (i.object.fov = this.fov),
      (i.object.zoom = this.zoom),
      (i.object.near = this.near),
      (i.object.far = this.far),
      (i.object.focus = this.focus),
      (i.object.aspect = this.aspect),
      this.view !== null && (i.object.view = Object.assign({}, this.view)),
      (i.object.filmGauge = this.filmGauge),
      (i.object.filmOffset = this.filmOffset),
      i
    );
  }
}
const Ba = -90,
  Da = 1;
class gw extends le {
  constructor(t, i, s) {
    (super(),
      (this.type = "CubeCamera"),
      (this.renderTarget = s),
      (this.coordinateSystem = null),
      (this.activeMipmapLevel = 0));
    const o = new yn(Ba, Da, t, i);
    ((o.layers = this.layers), this.add(o));
    const l = new yn(Ba, Da, t, i);
    ((l.layers = this.layers), this.add(l));
    const u = new yn(Ba, Da, t, i);
    ((u.layers = this.layers), this.add(u));
    const f = new yn(Ba, Da, t, i);
    ((f.layers = this.layers), this.add(f));
    const h = new yn(Ba, Da, t, i);
    ((h.layers = this.layers), this.add(h));
    const p = new yn(Ba, Da, t, i);
    ((p.layers = this.layers), this.add(p));
  }
  updateCoordinateSystem() {
    const t = this.coordinateSystem,
      i = this.children.concat(),
      [s, o, l, u, f, h] = i;
    for (const p of i) this.remove(p);
    if (t === is)
      (s.up.set(0, 1, 0),
        s.lookAt(1, 0, 0),
        o.up.set(0, 1, 0),
        o.lookAt(-1, 0, 0),
        l.up.set(0, 0, -1),
        l.lookAt(0, 1, 0),
        u.up.set(0, 0, 1),
        u.lookAt(0, -1, 0),
        f.up.set(0, 1, 0),
        f.lookAt(0, 0, 1),
        h.up.set(0, 1, 0),
        h.lookAt(0, 0, -1));
    else if (t === nu)
      (s.up.set(0, -1, 0),
        s.lookAt(-1, 0, 0),
        o.up.set(0, -1, 0),
        o.lookAt(1, 0, 0),
        l.up.set(0, 0, 1),
        l.lookAt(0, 1, 0),
        u.up.set(0, 0, -1),
        u.lookAt(0, -1, 0),
        f.up.set(0, -1, 0),
        f.lookAt(0, 0, 1),
        h.up.set(0, -1, 0),
        h.lookAt(0, 0, -1));
    else
      throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: " + t);
    for (const p of i) (this.add(p), p.updateMatrixWorld());
  }
  update(t, i) {
    this.parent === null && this.updateMatrixWorld();
    const { renderTarget: s, activeMipmapLevel: o } = this;
    this.coordinateSystem !== t.coordinateSystem &&
      ((this.coordinateSystem = t.coordinateSystem), this.updateCoordinateSystem());
    const [l, u, f, h, p, y] = this.children,
      g = t.getRenderTarget(),
      v = t.getActiveCubeFace(),
      b = t.getActiveMipmapLevel(),
      S = t.xr.enabled;
    t.xr.enabled = !1;
    const A = s.texture.generateMipmaps;
    ((s.texture.generateMipmaps = !1),
      t.setRenderTarget(s, 0, o),
      t.render(i, l),
      t.setRenderTarget(s, 1, o),
      t.render(i, u),
      t.setRenderTarget(s, 2, o),
      t.render(i, f),
      t.setRenderTarget(s, 3, o),
      t.render(i, h),
      t.setRenderTarget(s, 4, o),
      t.render(i, p),
      (s.texture.generateMipmaps = A),
      t.setRenderTarget(s, 5, o),
      t.render(i, y),
      t.setRenderTarget(g, v, b),
      (t.xr.enabled = S),
      (s.texture.needsPMREMUpdate = !0));
  }
}
class vw extends Ue {
  constructor(t = [], i = ES, s, o, l, u, f, h, p, y) {
    (super(t, i, s, o, l, u, f, h, p, y), (this.isCubeTexture = !0), (this.flipY = !1));
  }
  get images() {
    return this.image;
  }
  set images(t) {
    this.image = t;
  }
}
class D4 extends P3 {
  constructor(t = 1, i = {}) {
    (super(t, t, i), (this.isWebGLCubeRenderTarget = !0));
    const s = { width: t, height: t, depth: 1 },
      o = [s, s, s, s, s, s];
    ((this.texture = new vw(o)),
      this._setTextureOptions(i),
      (this.texture.isRenderTargetTexture = !0));
  }
  fromEquirectangularTexture(t, i) {
    ((this.texture.type = i.type),
      (this.texture.colorSpace = i.colorSpace),
      (this.texture.generateMipmaps = i.generateMipmaps),
      (this.texture.minFilter = i.minFilter),
      (this.texture.magFilter = i.magFilter));
    const s = {
        uniforms: { tEquirect: { value: null } },
        vertexShader: `

				varying vec3 vWorldDirection;

				vec3 transformDirection( in vec3 dir, in mat4 matrix ) {

					return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );

				}

				void main() {

					vWorldDirection = transformDirection( position, modelMatrix );

					#include <begin_vertex>
					#include <project_vertex>

				}
			`,
        fragmentShader: `

				uniform sampler2D tEquirect;

				varying vec3 vWorldDirection;

				#include <common>

				void main() {

					vec3 direction = normalize( vWorldDirection );

					vec2 sampleUV = equirectUv( direction );

					gl_FragColor = texture2D( tEquirect, sampleUV );

				}
			`,
      },
      o = new t0(5, 5, 5),
      l = new dt({
        name: "CubemapFromEquirect",
        uniforms: vu(s.uniforms),
        vertexShader: s.vertexShader,
        fragmentShader: s.fragmentShader,
        side: A1,
        blending: _S,
      });
    l.uniforms.tEquirect.value = i;
    const u = new $t(o, l),
      f = i.minFilter;
    return (
      i.minFilter === _1 && (i.minFilter = eu),
      new gw(1, 10, this).update(t, u),
      (i.minFilter = f),
      u.geometry.dispose(),
      u.material.dispose(),
      this
    );
  }
  clear(t, i = !0, s = !0, o = !0) {
    const l = t.getRenderTarget();
    for (let u = 0; u < 6; u++) (t.setRenderTarget(this, u), t.clear(i, s, o));
    t.setRenderTarget(l);
  }
}
class ve extends le {
  constructor() {
    (super(), (this.isGroup = !0), (this.type = "Group"));
  }
}
const bw = { type: "move" };
class N4 {
  constructor() {
    ((this._targetRay = null), (this._grip = null), (this._hand = null));
  }
  getHandSpace() {
    return (
      this._hand === null &&
        ((this._hand = new ve()),
        (this._hand.matrixAutoUpdate = !1),
        (this._hand.visible = !1),
        (this._hand.joints = {}),
        (this._hand.inputState = { pinching: !1 })),
      this._hand
    );
  }
  getTargetRaySpace() {
    return (
      this._targetRay === null &&
        ((this._targetRay = new ve()),
        (this._targetRay.matrixAutoUpdate = !1),
        (this._targetRay.visible = !1),
        (this._targetRay.hasLinearVelocity = !1),
        (this._targetRay.linearVelocity = new R()),
        (this._targetRay.hasAngularVelocity = !1),
        (this._targetRay.angularVelocity = new R())),
      this._targetRay
    );
  }
  getGripSpace() {
    return (
      this._grip === null &&
        ((this._grip = new ve()),
        (this._grip.matrixAutoUpdate = !1),
        (this._grip.visible = !1),
        (this._grip.hasLinearVelocity = !1),
        (this._grip.linearVelocity = new R()),
        (this._grip.hasAngularVelocity = !1),
        (this._grip.angularVelocity = new R())),
      this._grip
    );
  }
  dispatchEvent(t) {
    return (
      this._targetRay !== null && this._targetRay.dispatchEvent(t),
      this._grip !== null && this._grip.dispatchEvent(t),
      this._hand !== null && this._hand.dispatchEvent(t),
      this
    );
  }
  connect(t) {
    if (t && t.hand) {
      const i = this._hand;
      if (i) for (const s of t.hand.values()) this._getHandJoint(i, s);
    }
    return (this.dispatchEvent({ type: "connected", data: t }), this);
  }
  disconnect(t) {
    return (
      this.dispatchEvent({ type: "disconnected", data: t }),
      this._targetRay !== null && (this._targetRay.visible = !1),
      this._grip !== null && (this._grip.visible = !1),
      this._hand !== null && (this._hand.visible = !1),
      this
    );
  }
  update(t, i, s) {
    let o = null,
      l = null,
      u = null;
    const f = this._targetRay,
      h = this._grip,
      p = this._hand;
    if (t && i.session.visibilityState !== "visible-blurred") {
      if (p && t.hand) {
        u = !0;
        for (const A of t.hand.values()) {
          const M = i.getJointPose(A, s),
            T = this._getHandJoint(p, A);
          (M !== null &&
            (T.matrix.fromArray(M.transform.matrix),
            T.matrix.decompose(T.position, T.rotation, T.scale),
            (T.matrixWorldNeedsUpdate = !0),
            (T.jointRadius = M.radius)),
            (T.visible = M !== null));
        }
        const y = p.joints["index-finger-tip"],
          g = p.joints["thumb-tip"],
          v = y.position.distanceTo(g.position),
          b = 0.02,
          S = 0.005;
        p.inputState.pinching && v > b + S
          ? ((p.inputState.pinching = !1),
            this.dispatchEvent({ type: "pinchend", handedness: t.handedness, target: this }))
          : !p.inputState.pinching &&
            v <= b - S &&
            ((p.inputState.pinching = !0),
            this.dispatchEvent({ type: "pinchstart", handedness: t.handedness, target: this }));
      } else
        h !== null &&
          t.gripSpace &&
          ((l = i.getPose(t.gripSpace, s)),
          l !== null &&
            (h.matrix.fromArray(l.transform.matrix),
            h.matrix.decompose(h.position, h.rotation, h.scale),
            (h.matrixWorldNeedsUpdate = !0),
            l.linearVelocity
              ? ((h.hasLinearVelocity = !0), h.linearVelocity.copy(l.linearVelocity))
              : (h.hasLinearVelocity = !1),
            l.angularVelocity
              ? ((h.hasAngularVelocity = !0), h.angularVelocity.copy(l.angularVelocity))
              : (h.hasAngularVelocity = !1)));
      f !== null &&
        ((o = i.getPose(t.targetRaySpace, s)),
        o === null && l !== null && (o = l),
        o !== null &&
          (f.matrix.fromArray(o.transform.matrix),
          f.matrix.decompose(f.position, f.rotation, f.scale),
          (f.matrixWorldNeedsUpdate = !0),
          o.linearVelocity
            ? ((f.hasLinearVelocity = !0), f.linearVelocity.copy(o.linearVelocity))
            : (f.hasLinearVelocity = !1),
          o.angularVelocity
            ? ((f.hasAngularVelocity = !0), f.angularVelocity.copy(o.angularVelocity))
            : (f.hasAngularVelocity = !1),
          this.dispatchEvent(bw)));
    }
    return (
      f !== null && (f.visible = o !== null),
      h !== null && (h.visible = l !== null),
      p !== null && (p.visible = u !== null),
      this
    );
  }
  _getHandJoint(t, i) {
    if (t.joints[i.jointName] === void 0) {
      const s = new ve();
      ((s.matrixAutoUpdate = !1), (s.visible = !1), (t.joints[i.jointName] = s), t.add(s));
    }
    return t.joints[i.jointName];
  }
}
class U4 extends le {
  constructor() {
    (super(),
      (this.isScene = !0),
      (this.type = "Scene"),
      (this.background = null),
      (this.environment = null),
      (this.fog = null),
      (this.backgroundBlurriness = 0),
      (this.backgroundIntensity = 1),
      (this.backgroundRotation = new ss()),
      (this.environmentIntensity = 1),
      (this.environmentRotation = new ss()),
      (this.overrideMaterial = null),
      typeof __THREE_DEVTOOLS__ < "u" &&
        __THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe", { detail: this })));
  }
  copy(t, i) {
    return (
      super.copy(t, i),
      t.background !== null && (this.background = t.background.clone()),
      t.environment !== null && (this.environment = t.environment.clone()),
      t.fog !== null && (this.fog = t.fog.clone()),
      (this.backgroundBlurriness = t.backgroundBlurriness),
      (this.backgroundIntensity = t.backgroundIntensity),
      this.backgroundRotation.copy(t.backgroundRotation),
      (this.environmentIntensity = t.environmentIntensity),
      this.environmentRotation.copy(t.environmentRotation),
      t.overrideMaterial !== null && (this.overrideMaterial = t.overrideMaterial.clone()),
      (this.matrixAutoUpdate = t.matrixAutoUpdate),
      this
    );
  }
  toJSON(t) {
    const i = super.toJSON(t);
    return (
      this.fog !== null && (i.object.fog = this.fog.toJSON()),
      this.backgroundBlurriness > 0 && (i.object.backgroundBlurriness = this.backgroundBlurriness),
      this.backgroundIntensity !== 1 && (i.object.backgroundIntensity = this.backgroundIntensity),
      (i.object.backgroundRotation = this.backgroundRotation.toArray()),
      this.environmentIntensity !== 1 &&
        (i.object.environmentIntensity = this.environmentIntensity),
      (i.object.environmentRotation = this.environmentRotation.toArray()),
      i
    );
  }
}
class F4 {
  constructor(t, i) {
    ((this.isInterleavedBuffer = !0),
      (this.array = t),
      (this.stride = i),
      (this.count = t !== void 0 ? t.length / i : 0),
      (this.usage = Ud),
      (this.updateRanges = []),
      (this.version = 0),
      (this.uuid = Ai()));
  }
  onUploadCallback() {}
  set needsUpdate(t) {
    t === !0 && this.version++;
  }
  setUsage(t) {
    return ((this.usage = t), this);
  }
  addUpdateRange(t, i) {
    this.updateRanges.push({ start: t, count: i });
  }
  clearUpdateRanges() {
    this.updateRanges.length = 0;
  }
  copy(t) {
    return (
      (this.array = new t.array.constructor(t.array)),
      (this.count = t.count),
      (this.stride = t.stride),
      (this.usage = t.usage),
      this
    );
  }
  copyAt(t, i, s) {
    ((t *= this.stride), (s *= i.stride));
    for (let o = 0, l = this.stride; o < l; o++) this.array[t + o] = i.array[s + o];
    return this;
  }
  set(t, i = 0) {
    return (this.array.set(t, i), this);
  }
  clone(t) {
    (t.arrayBuffers === void 0 && (t.arrayBuffers = {}),
      this.array.buffer._uuid === void 0 && (this.array.buffer._uuid = Ai()),
      t.arrayBuffers[this.array.buffer._uuid] === void 0 &&
        (t.arrayBuffers[this.array.buffer._uuid] = this.array.slice(0).buffer));
    const i = new this.array.constructor(t.arrayBuffers[this.array.buffer._uuid]),
      s = new this.constructor(i, this.stride);
    return (s.setUsage(this.usage), s);
  }
  onUpload(t) {
    return ((this.onUploadCallback = t), this);
  }
  toJSON(t) {
    return (
      t.arrayBuffers === void 0 && (t.arrayBuffers = {}),
      this.array.buffer._uuid === void 0 && (this.array.buffer._uuid = Ai()),
      t.arrayBuffers[this.array.buffer._uuid] === void 0 &&
        (t.arrayBuffers[this.array.buffer._uuid] = Array.from(new Uint32Array(this.array.buffer))),
      {
        uuid: this.uuid,
        buffer: this.array.buffer._uuid,
        type: this.array.constructor.name,
        stride: this.stride,
      }
    );
  }
}
const Le = new R();
class O1 {
  constructor(t, i, s, o = !1) {
    ((this.isInterleavedBufferAttribute = !0),
      (this.name = ""),
      (this.data = t),
      (this.itemSize = i),
      (this.offset = s),
      (this.normalized = o));
  }
  get count() {
    return this.data.count;
  }
  get array() {
    return this.data.array;
  }
  set needsUpdate(t) {
    this.data.needsUpdate = t;
  }
  applyMatrix4(t) {
    for (let i = 0, s = this.data.count; i < s; i++)
      (Le.fromBufferAttribute(this, i), Le.applyMatrix4(t), this.setXYZ(i, Le.x, Le.y, Le.z));
    return this;
  }
  applyNormalMatrix(t) {
    for (let i = 0, s = this.count; i < s; i++)
      (Le.fromBufferAttribute(this, i), Le.applyNormalMatrix(t), this.setXYZ(i, Le.x, Le.y, Le.z));
    return this;
  }
  transformDirection(t) {
    for (let i = 0, s = this.count; i < s; i++)
      (Le.fromBufferAttribute(this, i), Le.transformDirection(t), this.setXYZ(i, Le.x, Le.y, Le.z));
    return this;
  }
  getComponent(t, i) {
    let s = this.array[t * this.data.stride + this.offset + i];
    return (this.normalized && (s = Di(s, this.array)), s);
  }
  setComponent(t, i, s) {
    return (
      this.normalized && (s = Lt(s, this.array)),
      (this.data.array[t * this.data.stride + this.offset + i] = s),
      this
    );
  }
  setX(t, i) {
    return (
      this.normalized && (i = Lt(i, this.array)),
      (this.data.array[t * this.data.stride + this.offset] = i),
      this
    );
  }
  setY(t, i) {
    return (
      this.normalized && (i = Lt(i, this.array)),
      (this.data.array[t * this.data.stride + this.offset + 1] = i),
      this
    );
  }
  setZ(t, i) {
    return (
      this.normalized && (i = Lt(i, this.array)),
      (this.data.array[t * this.data.stride + this.offset + 2] = i),
      this
    );
  }
  setW(t, i) {
    return (
      this.normalized && (i = Lt(i, this.array)),
      (this.data.array[t * this.data.stride + this.offset + 3] = i),
      this
    );
  }
  getX(t) {
    let i = this.data.array[t * this.data.stride + this.offset];
    return (this.normalized && (i = Di(i, this.array)), i);
  }
  getY(t) {
    let i = this.data.array[t * this.data.stride + this.offset + 1];
    return (this.normalized && (i = Di(i, this.array)), i);
  }
  getZ(t) {
    let i = this.data.array[t * this.data.stride + this.offset + 2];
    return (this.normalized && (i = Di(i, this.array)), i);
  }
  getW(t) {
    let i = this.data.array[t * this.data.stride + this.offset + 3];
    return (this.normalized && (i = Di(i, this.array)), i);
  }
  setXY(t, i, s) {
    return (
      (t = t * this.data.stride + this.offset),
      this.normalized && ((i = Lt(i, this.array)), (s = Lt(s, this.array))),
      (this.data.array[t + 0] = i),
      (this.data.array[t + 1] = s),
      this
    );
  }
  setXYZ(t, i, s, o) {
    return (
      (t = t * this.data.stride + this.offset),
      this.normalized &&
        ((i = Lt(i, this.array)), (s = Lt(s, this.array)), (o = Lt(o, this.array))),
      (this.data.array[t + 0] = i),
      (this.data.array[t + 1] = s),
      (this.data.array[t + 2] = o),
      this
    );
  }
  setXYZW(t, i, s, o, l) {
    return (
      (t = t * this.data.stride + this.offset),
      this.normalized &&
        ((i = Lt(i, this.array)),
        (s = Lt(s, this.array)),
        (o = Lt(o, this.array)),
        (l = Lt(l, this.array))),
      (this.data.array[t + 0] = i),
      (this.data.array[t + 1] = s),
      (this.data.array[t + 2] = o),
      (this.data.array[t + 3] = l),
      this
    );
  }
  clone(t) {
    if (t === void 0) {
      console.log(
        "THREE.InterleavedBufferAttribute.clone(): Cloning an interleaved buffer attribute will de-interleave buffer data.",
      );
      const i = [];
      for (let s = 0; s < this.count; s++) {
        const o = s * this.data.stride + this.offset;
        for (let l = 0; l < this.itemSize; l++) i.push(this.data.array[o + l]);
      }
      return new H(new this.array.constructor(i), this.itemSize, this.normalized);
    } else
      return (
        t.interleavedBuffers === void 0 && (t.interleavedBuffers = {}),
        t.interleavedBuffers[this.data.uuid] === void 0 &&
          (t.interleavedBuffers[this.data.uuid] = this.data.clone(t)),
        new O1(t.interleavedBuffers[this.data.uuid], this.itemSize, this.offset, this.normalized)
      );
  }
  toJSON(t) {
    if (t === void 0) {
      console.log(
        "THREE.InterleavedBufferAttribute.toJSON(): Serializing an interleaved buffer attribute will de-interleave buffer data.",
      );
      const i = [];
      for (let s = 0; s < this.count; s++) {
        const o = s * this.data.stride + this.offset;
        for (let l = 0; l < this.itemSize; l++) i.push(this.data.array[o + l]);
      }
      return {
        itemSize: this.itemSize,
        type: this.array.constructor.name,
        array: i,
        normalized: this.normalized,
      };
    } else
      return (
        t.interleavedBuffers === void 0 && (t.interleavedBuffers = {}),
        t.interleavedBuffers[this.data.uuid] === void 0 &&
          (t.interleavedBuffers[this.data.uuid] = this.data.toJSON(t)),
        {
          isInterleavedBufferAttribute: !0,
          itemSize: this.itemSize,
          data: this.data.uuid,
          offset: this.offset,
          normalized: this.normalized,
        }
      );
  }
}
const ev = new R(),
  iv = new Te(),
  nv = new Te(),
  xw = new R(),
  sv = new Ct(),
  gc = new R(),
  pd = new wn(),
  av = new Ct(),
  md = new gu();
class L4 extends $t {
  constructor(t, i) {
    (super(t, i),
      (this.isSkinnedMesh = !0),
      (this.type = "SkinnedMesh"),
      (this.bindMode = Tg),
      (this.bindMatrix = new Ct()),
      (this.bindMatrixInverse = new Ct()),
      (this.boundingBox = null),
      (this.boundingSphere = null));
  }
  computeBoundingBox() {
    const t = this.geometry;
    (this.boundingBox === null && (this.boundingBox = new as()), this.boundingBox.makeEmpty());
    const i = t.getAttribute("position");
    for (let s = 0; s < i.count; s++)
      (this.getVertexPosition(s, gc), this.boundingBox.expandByPoint(gc));
  }
  computeBoundingSphere() {
    const t = this.geometry;
    (this.boundingSphere === null && (this.boundingSphere = new wn()),
      this.boundingSphere.makeEmpty());
    const i = t.getAttribute("position");
    for (let s = 0; s < i.count; s++)
      (this.getVertexPosition(s, gc), this.boundingSphere.expandByPoint(gc));
  }
  copy(t, i) {
    return (
      super.copy(t, i),
      (this.bindMode = t.bindMode),
      this.bindMatrix.copy(t.bindMatrix),
      this.bindMatrixInverse.copy(t.bindMatrixInverse),
      (this.skeleton = t.skeleton),
      t.boundingBox !== null && (this.boundingBox = t.boundingBox.clone()),
      t.boundingSphere !== null && (this.boundingSphere = t.boundingSphere.clone()),
      this
    );
  }
  raycast(t, i) {
    const s = this.material,
      o = this.matrixWorld;
    s !== void 0 &&
      (this.boundingSphere === null && this.computeBoundingSphere(),
      pd.copy(this.boundingSphere),
      pd.applyMatrix4(o),
      t.ray.intersectsSphere(pd) !== !1 &&
        (av.copy(o).invert(),
        md.copy(t.ray).applyMatrix4(av),
        !(this.boundingBox !== null && md.intersectsBox(this.boundingBox) === !1) &&
          this._computeIntersections(t, i, md)));
  }
  getVertexPosition(t, i) {
    return (super.getVertexPosition(t, i), this.applyBoneTransform(t, i), i);
  }
  bind(t, i) {
    ((this.skeleton = t),
      i === void 0 &&
        (this.updateMatrixWorld(!0), this.skeleton.calculateInverses(), (i = this.matrixWorld)),
      this.bindMatrix.copy(i),
      this.bindMatrixInverse.copy(i).invert());
  }
  pose() {
    this.skeleton.pose();
  }
  normalizeSkinWeights() {
    const t = new Te(),
      i = this.geometry.attributes.skinWeight;
    for (let s = 0, o = i.count; s < o; s++) {
      t.fromBufferAttribute(i, s);
      const l = 1 / t.manhattanLength();
      (l !== 1 / 0 ? t.multiplyScalar(l) : t.set(1, 0, 0, 0), i.setXYZW(s, t.x, t.y, t.z, t.w));
    }
  }
  updateMatrixWorld(t) {
    (super.updateMatrixWorld(t),
      this.bindMode === Tg
        ? this.bindMatrixInverse.copy(this.matrixWorld).invert()
        : this.bindMode === zS
          ? this.bindMatrixInverse.copy(this.bindMatrix).invert()
          : console.warn("THREE.SkinnedMesh: Unrecognized bindMode: " + this.bindMode));
  }
  applyBoneTransform(t, i) {
    const s = this.skeleton,
      o = this.geometry;
    (iv.fromBufferAttribute(o.attributes.skinIndex, t),
      nv.fromBufferAttribute(o.attributes.skinWeight, t),
      ev.copy(i).applyMatrix4(this.bindMatrix),
      i.set(0, 0, 0));
    for (let l = 0; l < 4; l++) {
      const u = nv.getComponent(l);
      if (u !== 0) {
        const f = iv.getComponent(l);
        (sv.multiplyMatrices(s.bones[f].matrixWorld, s.boneInverses[f]),
          i.addScaledVector(xw.copy(ev).applyMatrix4(sv), u));
      }
    }
    return i.applyMatrix4(this.bindMatrixInverse);
  }
}
class Sw extends le {
  constructor() {
    (super(), (this.isBone = !0), (this.type = "Bone"));
  }
}
class B1 extends Ue {
  constructor(t = null, i = 1, s = 1, o, l, u, f, h, p = ns, y = ns, g, v) {
    (super(null, u, f, h, p, y, o, l, g, v),
      (this.isDataTexture = !0),
      (this.image = { data: t, width: i, height: s }),
      (this.generateMipmaps = !1),
      (this.flipY = !1),
      (this.unpackAlignment = 1));
  }
}
const ov = new Ct(),
  ww = new Ct();
class D1 {
  constructor(t = [], i = []) {
    ((this.uuid = Ai()),
      (this.bones = t.slice(0)),
      (this.boneInverses = i),
      (this.boneMatrices = null),
      (this.boneTexture = null),
      this.init());
  }
  init() {
    const t = this.bones,
      i = this.boneInverses;
    if (((this.boneMatrices = new Float32Array(t.length * 16)), i.length === 0))
      this.calculateInverses();
    else if (t.length !== i.length) {
      (console.warn(
        "THREE.Skeleton: Number of inverse bone matrices does not match amount of bones.",
      ),
        (this.boneInverses = []));
      for (let s = 0, o = this.bones.length; s < o; s++) this.boneInverses.push(new Ct());
    }
  }
  calculateInverses() {
    this.boneInverses.length = 0;
    for (let t = 0, i = this.bones.length; t < i; t++) {
      const s = new Ct();
      (this.bones[t] && s.copy(this.bones[t].matrixWorld).invert(), this.boneInverses.push(s));
    }
  }
  pose() {
    for (let t = 0, i = this.bones.length; t < i; t++) {
      const s = this.bones[t];
      s && s.matrixWorld.copy(this.boneInverses[t]).invert();
    }
    for (let t = 0, i = this.bones.length; t < i; t++) {
      const s = this.bones[t];
      s &&
        (s.parent && s.parent.isBone
          ? (s.matrix.copy(s.parent.matrixWorld).invert(), s.matrix.multiply(s.matrixWorld))
          : s.matrix.copy(s.matrixWorld),
        s.matrix.decompose(s.position, s.quaternion, s.scale));
    }
  }
  update() {
    const t = this.bones,
      i = this.boneInverses,
      s = this.boneMatrices,
      o = this.boneTexture;
    for (let l = 0, u = t.length; l < u; l++) {
      const f = t[l] ? t[l].matrixWorld : ww;
      (ov.multiplyMatrices(f, i[l]), ov.toArray(s, l * 16));
    }
    o !== null && (o.needsUpdate = !0);
  }
  clone() {
    return new D1(this.bones, this.boneInverses);
  }
  computeBoneTexture() {
    let t = Math.sqrt(this.bones.length * 4);
    ((t = Math.ceil(t / 4) * 4), (t = Math.max(t, 4)));
    const i = new Float32Array(t * t * 4);
    i.set(this.boneMatrices);
    const s = new B1(i, t, t, Qd, yu);
    return ((s.needsUpdate = !0), (this.boneMatrices = i), (this.boneTexture = s), this);
  }
  getBoneByName(t) {
    for (let i = 0, s = this.bones.length; i < s; i++) {
      const o = this.bones[i];
      if (o.name === t) return o;
    }
  }
  dispose() {
    this.boneTexture !== null && (this.boneTexture.dispose(), (this.boneTexture = null));
  }
  fromJSON(t, i) {
    this.uuid = t.uuid;
    for (let s = 0, o = t.bones.length; s < o; s++) {
      const l = t.bones[s];
      let u = i[l];
      (u === void 0 &&
        (console.warn("THREE.Skeleton: No bone found with UUID:", l), (u = new Sw())),
        this.bones.push(u),
        this.boneInverses.push(new Ct().fromArray(t.boneInverses[s])));
    }
    return (this.init(), this);
  }
  toJSON() {
    const t = {
      metadata: { version: 4.7, type: "Skeleton", generator: "Skeleton.toJSON" },
      bones: [],
      boneInverses: [],
    };
    t.uuid = this.uuid;
    const i = this.bones,
      s = this.boneInverses;
    for (let o = 0, l = i.length; o < l; o++) {
      const u = i[o];
      t.bones.push(u.uuid);
      const f = s[o];
      t.boneInverses.push(f.toArray());
    }
    return t;
  }
}
class kt extends H {
  constructor(t, i, s, o = 1) {
    (super(t, i, s), (this.isInstancedBufferAttribute = !0), (this.meshPerAttribute = o));
  }
  copy(t) {
    return (super.copy(t), (this.meshPerAttribute = t.meshPerAttribute), this);
  }
  toJSON() {
    const t = super.toJSON();
    return ((t.meshPerAttribute = this.meshPerAttribute), (t.isInstancedBufferAttribute = !0), t);
  }
}
const Na = new Ct(),
  rv = new Ct(),
  vc = [],
  lv = new as(),
  Aw = new Ct(),
  Ko = new $t(),
  $o = new wn();
class Mw extends $t {
  constructor(t, i, s) {
    (super(t, i),
      (this.isInstancedMesh = !0),
      (this.instanceMatrix = new kt(new Float32Array(s * 16), 16)),
      (this.instanceColor = null),
      (this.morphTexture = null),
      (this.count = s),
      (this.boundingBox = null),
      (this.boundingSphere = null));
    for (let o = 0; o < s; o++) this.setMatrixAt(o, Aw);
  }
  computeBoundingBox() {
    const t = this.geometry,
      i = this.count;
    (this.boundingBox === null && (this.boundingBox = new as()),
      t.boundingBox === null && t.computeBoundingBox(),
      this.boundingBox.makeEmpty());
    for (let s = 0; s < i; s++)
      (this.getMatrixAt(s, Na),
        lv.copy(t.boundingBox).applyMatrix4(Na),
        this.boundingBox.union(lv));
  }
  computeBoundingSphere() {
    const t = this.geometry,
      i = this.count;
    (this.boundingSphere === null && (this.boundingSphere = new wn()),
      t.boundingSphere === null && t.computeBoundingSphere(),
      this.boundingSphere.makeEmpty());
    for (let s = 0; s < i; s++)
      (this.getMatrixAt(s, Na),
        $o.copy(t.boundingSphere).applyMatrix4(Na),
        this.boundingSphere.union($o));
  }
  copy(t, i) {
    return (
      super.copy(t, i),
      this.instanceMatrix.copy(t.instanceMatrix),
      t.morphTexture !== null && (this.morphTexture = t.morphTexture.clone()),
      t.instanceColor !== null && (this.instanceColor = t.instanceColor.clone()),
      (this.count = t.count),
      t.boundingBox !== null && (this.boundingBox = t.boundingBox.clone()),
      t.boundingSphere !== null && (this.boundingSphere = t.boundingSphere.clone()),
      this
    );
  }
  getColorAt(t, i) {
    i.fromArray(this.instanceColor.array, t * 3);
  }
  getMatrixAt(t, i) {
    i.fromArray(this.instanceMatrix.array, t * 16);
  }
  getMorphAt(t, i) {
    const s = i.morphTargetInfluences,
      o = this.morphTexture.source.data.data,
      l = s.length + 1,
      u = t * l + 1;
    for (let f = 0; f < s.length; f++) s[f] = o[u + f];
  }
  raycast(t, i) {
    const s = this.matrixWorld,
      o = this.count;
    if (
      ((Ko.geometry = this.geometry),
      (Ko.material = this.material),
      Ko.material !== void 0 &&
        (this.boundingSphere === null && this.computeBoundingSphere(),
        $o.copy(this.boundingSphere),
        $o.applyMatrix4(s),
        t.ray.intersectsSphere($o) !== !1))
    )
      for (let l = 0; l < o; l++) {
        (this.getMatrixAt(l, Na),
          rv.multiplyMatrices(s, Na),
          (Ko.matrixWorld = rv),
          Ko.raycast(t, vc));
        for (let u = 0, f = vc.length; u < f; u++) {
          const h = vc[u];
          ((h.instanceId = l), (h.object = this), i.push(h));
        }
        vc.length = 0;
      }
  }
  setColorAt(t, i) {
    (this.instanceColor === null &&
      (this.instanceColor = new kt(new Float32Array(this.instanceMatrix.count * 3).fill(1), 3)),
      i.toArray(this.instanceColor.array, t * 3));
  }
  setMatrixAt(t, i) {
    i.toArray(this.instanceMatrix.array, t * 16);
  }
  setMorphAt(t, i) {
    const s = i.morphTargetInfluences,
      o = s.length + 1;
    this.morphTexture === null &&
      (this.morphTexture = new B1(new Float32Array(o * this.count), o, this.count, z1, yu));
    const l = this.morphTexture.source.data.data;
    let u = 0;
    for (let p = 0; p < s.length; p++) u += s[p];
    const f = this.geometry.morphTargetsRelative ? 1 : 1 - u,
      h = o * t;
    ((l[h] = f), l.set(s, h + 1));
  }
  updateMorphTargets() {}
  dispose() {
    (this.dispatchEvent({ type: "dispose" }),
      this.morphTexture !== null && (this.morphTexture.dispose(), (this.morphTexture = null)));
  }
}
const yd = new R(),
  _w = new R(),
  Tw = new Sn();
class Ua {
  constructor(t = new R(1, 0, 0), i = 0) {
    ((this.isPlane = !0), (this.normal = t), (this.constant = i));
  }
  set(t, i) {
    return (this.normal.copy(t), (this.constant = i), this);
  }
  setComponents(t, i, s, o) {
    return (this.normal.set(t, i, s), (this.constant = o), this);
  }
  setFromNormalAndCoplanarPoint(t, i) {
    return (this.normal.copy(t), (this.constant = -i.dot(this.normal)), this);
  }
  setFromCoplanarPoints(t, i, s) {
    const o = yd.subVectors(s, i).cross(_w.subVectors(t, i)).normalize();
    return (this.setFromNormalAndCoplanarPoint(o, t), this);
  }
  copy(t) {
    return (this.normal.copy(t.normal), (this.constant = t.constant), this);
  }
  normalize() {
    const t = 1 / this.normal.length();
    return (this.normal.multiplyScalar(t), (this.constant *= t), this);
  }
  negate() {
    return ((this.constant *= -1), this.normal.negate(), this);
  }
  distanceToPoint(t) {
    return this.normal.dot(t) + this.constant;
  }
  distanceToSphere(t) {
    return this.distanceToPoint(t.center) - t.radius;
  }
  projectPoint(t, i) {
    return i.copy(t).addScaledVector(this.normal, -this.distanceToPoint(t));
  }
  intersectLine(t, i) {
    const s = t.delta(yd),
      o = this.normal.dot(s);
    if (o === 0) return this.distanceToPoint(t.start) === 0 ? i.copy(t.start) : null;
    const l = -(t.start.dot(this.normal) + this.constant) / o;
    return l < 0 || l > 1 ? null : i.copy(t.start).addScaledVector(s, l);
  }
  intersectsLine(t) {
    const i = this.distanceToPoint(t.start),
      s = this.distanceToPoint(t.end);
    return (i < 0 && s > 0) || (s < 0 && i > 0);
  }
  intersectsBox(t) {
    return t.intersectsPlane(this);
  }
  intersectsSphere(t) {
    return t.intersectsPlane(this);
  }
  coplanarPoint(t) {
    return t.copy(this.normal).multiplyScalar(-this.constant);
  }
  applyMatrix4(t, i) {
    const s = i || Tw.getNormalMatrix(t),
      o = this.coplanarPoint(yd).applyMatrix4(t),
      l = this.normal.applyMatrix3(s).normalize();
    return ((this.constant = -o.dot(l)), this);
  }
  translate(t) {
    return ((this.constant -= t.dot(this.normal)), this);
  }
  equals(t) {
    return t.normal.equals(this.normal) && t.constant === this.constant;
  }
  clone() {
    return new this.constructor().copy(this);
  }
}
const Rs = new wn(),
  zw = new tt(0.5, 0.5),
  bc = new R();
class Ew {
  constructor(t = new Ua(), i = new Ua(), s = new Ua(), o = new Ua(), l = new Ua(), u = new Ua()) {
    this.planes = [t, i, s, o, l, u];
  }
  set(t, i, s, o, l, u) {
    const f = this.planes;
    return (
      f[0].copy(t),
      f[1].copy(i),
      f[2].copy(s),
      f[3].copy(o),
      f[4].copy(l),
      f[5].copy(u),
      this
    );
  }
  copy(t) {
    const i = this.planes;
    for (let s = 0; s < 6; s++) i[s].copy(t.planes[s]);
    return this;
  }
  setFromProjectionMatrix(t, i = is, s = !1) {
    const o = this.planes,
      l = t.elements,
      u = l[0],
      f = l[1],
      h = l[2],
      p = l[3],
      y = l[4],
      g = l[5],
      v = l[6],
      b = l[7],
      S = l[8],
      A = l[9],
      M = l[10],
      T = l[11],
      O = l[12],
      C = l[13],
      E = l[14],
      U = l[15];
    if (
      (o[0].setComponents(p - u, b - y, T - S, U - O).normalize(),
      o[1].setComponents(p + u, b + y, T + S, U + O).normalize(),
      o[2].setComponents(p + f, b + g, T + A, U + C).normalize(),
      o[3].setComponents(p - f, b - g, T - A, U - C).normalize(),
      s)
    )
      (o[4].setComponents(h, v, M, E).normalize(),
        o[5].setComponents(p - h, b - v, T - M, U - E).normalize());
    else if ((o[4].setComponents(p - h, b - v, T - M, U - E).normalize(), i === is))
      o[5].setComponents(p + h, b + v, T + M, U + E).normalize();
    else if (i === nu) o[5].setComponents(h, v, M, E).normalize();
    else
      throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: " + i);
    return this;
  }
  intersectsObject(t) {
    if (t.boundingSphere !== void 0)
      (t.boundingSphere === null && t.computeBoundingSphere(),
        Rs.copy(t.boundingSphere).applyMatrix4(t.matrixWorld));
    else {
      const i = t.geometry;
      (i.boundingSphere === null && i.computeBoundingSphere(),
        Rs.copy(i.boundingSphere).applyMatrix4(t.matrixWorld));
    }
    return this.intersectsSphere(Rs);
  }
  intersectsSprite(t) {
    Rs.center.set(0, 0, 0);
    const i = zw.distanceTo(t.center);
    return (
      (Rs.radius = 0.7071067811865476 + i),
      Rs.applyMatrix4(t.matrixWorld),
      this.intersectsSphere(Rs)
    );
  }
  intersectsSphere(t) {
    const i = this.planes,
      s = t.center,
      o = -t.radius;
    for (let l = 0; l < 6; l++) if (i[l].distanceToPoint(s) < o) return !1;
    return !0;
  }
  intersectsBox(t) {
    const i = this.planes;
    for (let s = 0; s < 6; s++) {
      const o = i[s];
      if (
        ((bc.x = o.normal.x > 0 ? t.max.x : t.min.x),
        (bc.y = o.normal.y > 0 ? t.max.y : t.min.y),
        (bc.z = o.normal.z > 0 ? t.max.z : t.min.z),
        o.distanceToPoint(bc) < 0)
      )
        return !1;
    }
    return !0;
  }
  containsPoint(t) {
    const i = this.planes;
    for (let s = 0; s < 6; s++) if (i[s].distanceToPoint(t) < 0) return !1;
    return !0;
  }
  clone() {
    return new this.constructor().copy(this);
  }
}
class Rw extends Ns {
  constructor(t) {
    (super(),
      (this.isLineBasicMaterial = !0),
      (this.type = "LineBasicMaterial"),
      (this.color = new Mi(16777215)),
      (this.map = null),
      (this.linewidth = 1),
      (this.linecap = "round"),
      (this.linejoin = "round"),
      (this.fog = !0),
      this.setValues(t));
  }
  copy(t) {
    return (
      super.copy(t),
      this.color.copy(t.color),
      (this.map = t.map),
      (this.linewidth = t.linewidth),
      (this.linecap = t.linecap),
      (this.linejoin = t.linejoin),
      (this.fog = t.fog),
      this
    );
  }
}
const au = new R(),
  ou = new R(),
  cv = new Ct(),
  tr = new gu(),
  xc = new wn(),
  gd = new R(),
  uv = new R();
class N1 extends le {
  constructor(t = new At(), i = new Rw()) {
    (super(),
      (this.isLine = !0),
      (this.type = "Line"),
      (this.geometry = t),
      (this.material = i),
      (this.morphTargetDictionary = void 0),
      (this.morphTargetInfluences = void 0),
      this.updateMorphTargets());
  }
  copy(t, i) {
    return (
      super.copy(t, i),
      (this.material = Array.isArray(t.material) ? t.material.slice() : t.material),
      (this.geometry = t.geometry),
      this
    );
  }
  computeLineDistances() {
    const t = this.geometry;
    if (t.index === null) {
      const i = t.attributes.position,
        s = [0];
      for (let o = 1, l = i.count; o < l; o++)
        (au.fromBufferAttribute(i, o - 1),
          ou.fromBufferAttribute(i, o),
          (s[o] = s[o - 1]),
          (s[o] += au.distanceTo(ou)));
      t.setAttribute("lineDistance", new ze(s, 1));
    } else
      console.warn(
        "THREE.Line.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.",
      );
    return this;
  }
  raycast(t, i) {
    const s = this.geometry,
      o = this.matrixWorld,
      l = t.params.Line.threshold,
      u = s.drawRange;
    if (
      (s.boundingSphere === null && s.computeBoundingSphere(),
      xc.copy(s.boundingSphere),
      xc.applyMatrix4(o),
      (xc.radius += l),
      t.ray.intersectsSphere(xc) === !1)
    )
      return;
    (cv.copy(o).invert(), tr.copy(t.ray).applyMatrix4(cv));
    const f = l / ((this.scale.x + this.scale.y + this.scale.z) / 3),
      h = f * f,
      p = this.isLineSegments ? 2 : 1,
      y = s.index,
      v = s.attributes.position;
    if (y !== null) {
      const b = Math.max(0, u.start),
        S = Math.min(y.count, u.start + u.count);
      for (let A = b, M = S - 1; A < M; A += p) {
        const T = y.getX(A),
          O = y.getX(A + 1),
          C = Sc(this, t, tr, h, T, O, A);
        C && i.push(C);
      }
      if (this.isLineLoop) {
        const A = y.getX(S - 1),
          M = y.getX(b),
          T = Sc(this, t, tr, h, A, M, S - 1);
        T && i.push(T);
      }
    } else {
      const b = Math.max(0, u.start),
        S = Math.min(v.count, u.start + u.count);
      for (let A = b, M = S - 1; A < M; A += p) {
        const T = Sc(this, t, tr, h, A, A + 1, A);
        T && i.push(T);
      }
      if (this.isLineLoop) {
        const A = Sc(this, t, tr, h, S - 1, b, S - 1);
        A && i.push(A);
      }
    }
  }
  updateMorphTargets() {
    const i = this.geometry.morphAttributes,
      s = Object.keys(i);
    if (s.length > 0) {
      const o = i[s[0]];
      if (o !== void 0) {
        ((this.morphTargetInfluences = []), (this.morphTargetDictionary = {}));
        for (let l = 0, u = o.length; l < u; l++) {
          const f = o[l].name || String(l);
          (this.morphTargetInfluences.push(0), (this.morphTargetDictionary[f] = l));
        }
      }
    }
  }
}
function Sc(c, t, i, s, o, l, u) {
  const f = c.geometry.attributes.position;
  if (
    (au.fromBufferAttribute(f, o),
    ou.fromBufferAttribute(f, l),
    i.distanceSqToSegment(au, ou, gd, uv) > s)
  )
    return;
  gd.applyMatrix4(c.matrixWorld);
  const p = t.ray.origin.distanceTo(gd);
  if (!(p < t.near || p > t.far))
    return {
      distance: p,
      point: uv.clone().applyMatrix4(c.matrixWorld),
      index: u,
      face: null,
      faceIndex: null,
      barycoord: null,
      object: c,
    };
}
const hv = new R(),
  fv = new R();
class U1 extends N1 {
  constructor(t, i) {
    (super(t, i), (this.isLineSegments = !0), (this.type = "LineSegments"));
  }
  computeLineDistances() {
    const t = this.geometry;
    if (t.index === null) {
      const i = t.attributes.position,
        s = [];
      for (let o = 0, l = i.count; o < l; o += 2)
        (hv.fromBufferAttribute(i, o),
          fv.fromBufferAttribute(i, o + 1),
          (s[o] = o === 0 ? 0 : s[o - 1]),
          (s[o + 1] = s[o] + hv.distanceTo(fv)));
      t.setAttribute("lineDistance", new ze(s, 1));
    } else
      console.warn(
        "THREE.LineSegments.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.",
      );
    return this;
  }
}
class k4 extends N1 {
  constructor(t, i) {
    (super(t, i), (this.isLineLoop = !0), (this.type = "LineLoop"));
  }
}
class Cw extends Ns {
  constructor(t) {
    (super(),
      (this.isPointsMaterial = !0),
      (this.type = "PointsMaterial"),
      (this.color = new Mi(16777215)),
      (this.map = null),
      (this.alphaMap = null),
      (this.size = 1),
      (this.sizeAttenuation = !0),
      (this.fog = !0),
      this.setValues(t));
  }
  copy(t) {
    return (
      super.copy(t),
      this.color.copy(t.color),
      (this.map = t.map),
      (this.alphaMap = t.alphaMap),
      (this.size = t.size),
      (this.sizeAttenuation = t.sizeAttenuation),
      (this.fog = t.fog),
      this
    );
  }
}
const dv = new Ct(),
  Fd = new gu(),
  wc = new wn(),
  Ac = new R();
class ne extends le {
  constructor(t = new At(), i = new Cw()) {
    (super(),
      (this.isPoints = !0),
      (this.type = "Points"),
      (this.geometry = t),
      (this.material = i),
      (this.morphTargetDictionary = void 0),
      (this.morphTargetInfluences = void 0),
      this.updateMorphTargets());
  }
  copy(t, i) {
    return (
      super.copy(t, i),
      (this.material = Array.isArray(t.material) ? t.material.slice() : t.material),
      (this.geometry = t.geometry),
      this
    );
  }
  raycast(t, i) {
    const s = this.geometry,
      o = this.matrixWorld,
      l = t.params.Points.threshold,
      u = s.drawRange;
    if (
      (s.boundingSphere === null && s.computeBoundingSphere(),
      wc.copy(s.boundingSphere),
      wc.applyMatrix4(o),
      (wc.radius += l),
      t.ray.intersectsSphere(wc) === !1)
    )
      return;
    (dv.copy(o).invert(), Fd.copy(t.ray).applyMatrix4(dv));
    const f = l / ((this.scale.x + this.scale.y + this.scale.z) / 3),
      h = f * f,
      p = s.index,
      g = s.attributes.position;
    if (p !== null) {
      const v = Math.max(0, u.start),
        b = Math.min(p.count, u.start + u.count);
      for (let S = v, A = b; S < A; S++) {
        const M = p.getX(S);
        (Ac.fromBufferAttribute(g, M), pv(Ac, M, h, o, t, i, this));
      }
    } else {
      const v = Math.max(0, u.start),
        b = Math.min(g.count, u.start + u.count);
      for (let S = v, A = b; S < A; S++)
        (Ac.fromBufferAttribute(g, S), pv(Ac, S, h, o, t, i, this));
    }
  }
  updateMorphTargets() {
    const i = this.geometry.morphAttributes,
      s = Object.keys(i);
    if (s.length > 0) {
      const o = i[s[0]];
      if (o !== void 0) {
        ((this.morphTargetInfluences = []), (this.morphTargetDictionary = {}));
        for (let l = 0, u = o.length; l < u; l++) {
          const f = o[l].name || String(l);
          (this.morphTargetInfluences.push(0), (this.morphTargetDictionary[f] = l));
        }
      }
    }
  }
}
function pv(c, t, i, s, o, l, u) {
  const f = Fd.distanceSqToPoint(c);
  if (f < i) {
    const h = new R();
    (Fd.closestPointToPoint(c, h), h.applyMatrix4(s));
    const p = o.ray.origin.distanceTo(h);
    if (p < o.near || p > o.far) return;
    l.push({
      distance: p,
      distanceToRay: Math.sqrt(f),
      point: h,
      index: t,
      face: null,
      faceIndex: null,
      barycoord: null,
      object: u,
    });
  }
}
class H4 extends Ue {
  constructor(t, i, s, o, l, u, f, h, p) {
    (super(t, i, s, o, l, u, f, h, p), (this.isCanvasTexture = !0), (this.needsUpdate = !0));
  }
}
class V4 extends Ue {
  constructor(t, i, s = T1, o, l, u, f = ns, h = ns, p, y = Rg, g = 1) {
    if (y !== Rg && y !== VS)
      throw new Error(
        "DepthTexture format must be either THREE.DepthFormat or THREE.DepthStencilFormat",
      );
    const v = { width: t, height: i, depth: g };
    (super(v, o, l, u, f, h, y, s, p),
      (this.isDepthTexture = !0),
      (this.flipY = !1),
      (this.generateMipmaps = !1),
      (this.compareFunction = null));
  }
  copy(t) {
    return (
      super.copy(t),
      (this.source = new $d(Object.assign({}, t.image))),
      (this.compareFunction = t.compareFunction),
      this
    );
  }
  toJSON(t) {
    const i = super.toJSON(t);
    return (this.compareFunction !== null && (i.compareFunction = this.compareFunction), i);
  }
}
class G4 extends Ue {
  constructor(t = null) {
    (super(), (this.sourceTexture = t), (this.isExternalTexture = !0));
  }
  copy(t) {
    return (super.copy(t), (this.sourceTexture = t.sourceTexture), this);
  }
}
class e0 extends At {
  constructor(t = [], i = [], s = 1, o = 0) {
    (super(),
      (this.type = "PolyhedronGeometry"),
      (this.parameters = { vertices: t, indices: i, radius: s, detail: o }));
    const l = [],
      u = [];
    (f(o),
      p(s),
      y(),
      this.setAttribute("position", new ze(l, 3)),
      this.setAttribute("normal", new ze(l.slice(), 3)),
      this.setAttribute("uv", new ze(u, 2)),
      o === 0 ? this.computeVertexNormals() : this.normalizeNormals());
    function f(O) {
      const C = new R(),
        E = new R(),
        U = new R();
      for (let q = 0; q < i.length; q += 3)
        (b(i[q + 0], C), b(i[q + 1], E), b(i[q + 2], U), h(C, E, U, O));
    }
    function h(O, C, E, U) {
      const q = U + 1,
        X = [];
      for (let G = 0; G <= q; G++) {
        X[G] = [];
        const W = O.clone().lerp(E, G / q),
          P = C.clone().lerp(E, G / q),
          Q = q - G;
        for (let rt = 0; rt <= Q; rt++)
          rt === 0 && G === q ? (X[G][rt] = W) : (X[G][rt] = W.clone().lerp(P, rt / Q));
      }
      for (let G = 0; G < q; G++)
        for (let W = 0; W < 2 * (q - G) - 1; W++) {
          const P = Math.floor(W / 2);
          W % 2 === 0
            ? (v(X[G][P + 1]), v(X[G + 1][P]), v(X[G][P]))
            : (v(X[G][P + 1]), v(X[G + 1][P + 1]), v(X[G + 1][P]));
        }
    }
    function p(O) {
      const C = new R();
      for (let E = 0; E < l.length; E += 3)
        ((C.x = l[E + 0]),
          (C.y = l[E + 1]),
          (C.z = l[E + 2]),
          C.normalize().multiplyScalar(O),
          (l[E + 0] = C.x),
          (l[E + 1] = C.y),
          (l[E + 2] = C.z));
    }
    function y() {
      const O = new R();
      for (let C = 0; C < l.length; C += 3) {
        ((O.x = l[C + 0]), (O.y = l[C + 1]), (O.z = l[C + 2]));
        const E = M(O) / 2 / Math.PI + 0.5,
          U = T(O) / Math.PI + 0.5;
        u.push(E, 1 - U);
      }
      (S(), g());
    }
    function g() {
      for (let O = 0; O < u.length; O += 6) {
        const C = u[O + 0],
          E = u[O + 2],
          U = u[O + 4],
          q = Math.max(C, E, U),
          X = Math.min(C, E, U);
        q > 0.9 &&
          X < 0.1 &&
          (C < 0.2 && (u[O + 0] += 1), E < 0.2 && (u[O + 2] += 1), U < 0.2 && (u[O + 4] += 1));
      }
    }
    function v(O) {
      l.push(O.x, O.y, O.z);
    }
    function b(O, C) {
      const E = O * 3;
      ((C.x = t[E + 0]), (C.y = t[E + 1]), (C.z = t[E + 2]));
    }
    function S() {
      const O = new R(),
        C = new R(),
        E = new R(),
        U = new R(),
        q = new tt(),
        X = new tt(),
        G = new tt();
      for (let W = 0, P = 0; W < l.length; W += 9, P += 6) {
        (O.set(l[W + 0], l[W + 1], l[W + 2]),
          C.set(l[W + 3], l[W + 4], l[W + 5]),
          E.set(l[W + 6], l[W + 7], l[W + 8]),
          q.set(u[P + 0], u[P + 1]),
          X.set(u[P + 2], u[P + 3]),
          G.set(u[P + 4], u[P + 5]),
          U.copy(O).add(C).add(E).divideScalar(3));
        const Q = M(U);
        (A(q, P + 0, O, Q), A(X, P + 2, C, Q), A(G, P + 4, E, Q));
      }
    }
    function A(O, C, E, U) {
      (U < 0 && O.x === 1 && (u[C] = O.x - 1),
        E.x === 0 && E.z === 0 && (u[C] = U / 2 / Math.PI + 0.5));
    }
    function M(O) {
      return Math.atan2(O.z, -O.x);
    }
    function T(O) {
      return Math.atan2(-O.y, Math.sqrt(O.x * O.x + O.z * O.z));
    }
  }
  copy(t) {
    return (super.copy(t), (this.parameters = Object.assign({}, t.parameters)), this);
  }
  static fromJSON(t) {
    return new e0(t.vertices, t.indices, t.radius, t.details);
  }
}
class Yi {
  constructor() {
    ((this.type = "Curve"),
      (this.arcLengthDivisions = 200),
      (this.needsUpdate = !1),
      (this.cacheArcLengths = null));
  }
  getPoint() {
    console.warn("THREE.Curve: .getPoint() not implemented.");
  }
  getPointAt(t, i) {
    const s = this.getUtoTmapping(t);
    return this.getPoint(s, i);
  }
  getPoints(t = 5) {
    const i = [];
    for (let s = 0; s <= t; s++) i.push(this.getPoint(s / t));
    return i;
  }
  getSpacedPoints(t = 5) {
    const i = [];
    for (let s = 0; s <= t; s++) i.push(this.getPointAt(s / t));
    return i;
  }
  getLength() {
    const t = this.getLengths();
    return t[t.length - 1];
  }
  getLengths(t = this.arcLengthDivisions) {
    if (this.cacheArcLengths && this.cacheArcLengths.length === t + 1 && !this.needsUpdate)
      return this.cacheArcLengths;
    this.needsUpdate = !1;
    const i = [];
    let s,
      o = this.getPoint(0),
      l = 0;
    i.push(0);
    for (let u = 1; u <= t; u++)
      ((s = this.getPoint(u / t)), (l += s.distanceTo(o)), i.push(l), (o = s));
    return ((this.cacheArcLengths = i), i);
  }
  updateArcLengths() {
    ((this.needsUpdate = !0), this.getLengths());
  }
  getUtoTmapping(t, i = null) {
    const s = this.getLengths();
    let o = 0;
    const l = s.length;
    let u;
    i ? (u = i) : (u = t * s[l - 1]);
    let f = 0,
      h = l - 1,
      p;
    for (; f <= h;)
      if (((o = Math.floor(f + (h - f) / 2)), (p = s[o] - u), p < 0)) f = o + 1;
      else if (p > 0) h = o - 1;
      else {
        h = o;
        break;
      }
    if (((o = h), s[o] === u)) return o / (l - 1);
    const y = s[o],
      v = s[o + 1] - y,
      b = (u - y) / v;
    return (o + b) / (l - 1);
  }
  getTangent(t, i) {
    let o = t - 1e-4,
      l = t + 1e-4;
    (o < 0 && (o = 0), l > 1 && (l = 1));
    const u = this.getPoint(o),
      f = this.getPoint(l),
      h = i || (u.isVector2 ? new tt() : new R());
    return (h.copy(f).sub(u).normalize(), h);
  }
  getTangentAt(t, i) {
    const s = this.getUtoTmapping(t);
    return this.getTangent(s, i);
  }
  computeFrenetFrames(t, i = !1) {
    const s = new R(),
      o = [],
      l = [],
      u = [],
      f = new R(),
      h = new Ct();
    for (let b = 0; b <= t; b++) {
      const S = b / t;
      o[b] = this.getTangentAt(S, new R());
    }
    ((l[0] = new R()), (u[0] = new R()));
    let p = Number.MAX_VALUE;
    const y = Math.abs(o[0].x),
      g = Math.abs(o[0].y),
      v = Math.abs(o[0].z);
    (y <= p && ((p = y), s.set(1, 0, 0)),
      g <= p && ((p = g), s.set(0, 1, 0)),
      v <= p && s.set(0, 0, 1),
      f.crossVectors(o[0], s).normalize(),
      l[0].crossVectors(o[0], f),
      u[0].crossVectors(o[0], l[0]));
    for (let b = 1; b <= t; b++) {
      if (
        ((l[b] = l[b - 1].clone()),
        (u[b] = u[b - 1].clone()),
        f.crossVectors(o[b - 1], o[b]),
        f.length() > Number.EPSILON)
      ) {
        f.normalize();
        const S = Math.acos(bt(o[b - 1].dot(o[b]), -1, 1));
        l[b].applyMatrix4(h.makeRotationAxis(f, S));
      }
      u[b].crossVectors(o[b], l[b]);
    }
    if (i === !0) {
      let b = Math.acos(bt(l[0].dot(l[t]), -1, 1));
      ((b /= t), o[0].dot(f.crossVectors(l[0], l[t])) > 0 && (b = -b));
      for (let S = 1; S <= t; S++)
        (l[S].applyMatrix4(h.makeRotationAxis(o[S], b * S)), u[S].crossVectors(o[S], l[S]));
    }
    return { tangents: o, normals: l, binormals: u };
  }
  clone() {
    return new this.constructor().copy(this);
  }
  copy(t) {
    return ((this.arcLengthDivisions = t.arcLengthDivisions), this);
  }
  toJSON() {
    const t = { metadata: { version: 4.7, type: "Curve", generator: "Curve.toJSON" } };
    return ((t.arcLengthDivisions = this.arcLengthDivisions), (t.type = this.type), t);
  }
  fromJSON(t) {
    return ((this.arcLengthDivisions = t.arcLengthDivisions), this);
  }
}
class i0 extends Yi {
  constructor(t = 0, i = 0, s = 1, o = 1, l = 0, u = Math.PI * 2, f = !1, h = 0) {
    (super(),
      (this.isEllipseCurve = !0),
      (this.type = "EllipseCurve"),
      (this.aX = t),
      (this.aY = i),
      (this.xRadius = s),
      (this.yRadius = o),
      (this.aStartAngle = l),
      (this.aEndAngle = u),
      (this.aClockwise = f),
      (this.aRotation = h));
  }
  getPoint(t, i = new tt()) {
    const s = i,
      o = Math.PI * 2;
    let l = this.aEndAngle - this.aStartAngle;
    const u = Math.abs(l) < Number.EPSILON;
    for (; l < 0;) l += o;
    for (; l > o;) l -= o;
    (l < Number.EPSILON && (u ? (l = 0) : (l = o)),
      this.aClockwise === !0 && !u && (l === o ? (l = -o) : (l = l - o)));
    const f = this.aStartAngle + t * l;
    let h = this.aX + this.xRadius * Math.cos(f),
      p = this.aY + this.yRadius * Math.sin(f);
    if (this.aRotation !== 0) {
      const y = Math.cos(this.aRotation),
        g = Math.sin(this.aRotation),
        v = h - this.aX,
        b = p - this.aY;
      ((h = v * y - b * g + this.aX), (p = v * g + b * y + this.aY));
    }
    return s.set(h, p);
  }
  copy(t) {
    return (
      super.copy(t),
      (this.aX = t.aX),
      (this.aY = t.aY),
      (this.xRadius = t.xRadius),
      (this.yRadius = t.yRadius),
      (this.aStartAngle = t.aStartAngle),
      (this.aEndAngle = t.aEndAngle),
      (this.aClockwise = t.aClockwise),
      (this.aRotation = t.aRotation),
      this
    );
  }
  toJSON() {
    const t = super.toJSON();
    return (
      (t.aX = this.aX),
      (t.aY = this.aY),
      (t.xRadius = this.xRadius),
      (t.yRadius = this.yRadius),
      (t.aStartAngle = this.aStartAngle),
      (t.aEndAngle = this.aEndAngle),
      (t.aClockwise = this.aClockwise),
      (t.aRotation = this.aRotation),
      t
    );
  }
  fromJSON(t) {
    return (
      super.fromJSON(t),
      (this.aX = t.aX),
      (this.aY = t.aY),
      (this.xRadius = t.xRadius),
      (this.yRadius = t.yRadius),
      (this.aStartAngle = t.aStartAngle),
      (this.aEndAngle = t.aEndAngle),
      (this.aClockwise = t.aClockwise),
      (this.aRotation = t.aRotation),
      this
    );
  }
}
class Ow extends i0 {
  constructor(t, i, s, o, l, u) {
    (super(t, i, s, s, o, l, u), (this.isArcCurve = !0), (this.type = "ArcCurve"));
  }
}
function n0() {
  let c = 0,
    t = 0,
    i = 0,
    s = 0;
  function o(l, u, f, h) {
    ((c = l), (t = f), (i = -3 * l + 3 * u - 2 * f - h), (s = 2 * l - 2 * u + f + h));
  }
  return {
    initCatmullRom: function (l, u, f, h, p) {
      o(u, f, p * (f - l), p * (h - u));
    },
    initNonuniformCatmullRom: function (l, u, f, h, p, y, g) {
      let v = (u - l) / p - (f - l) / (p + y) + (f - u) / y,
        b = (f - u) / y - (h - u) / (y + g) + (h - f) / g;
      ((v *= y), (b *= y), o(u, f, v, b));
    },
    calc: function (l) {
      const u = l * l,
        f = u * l;
      return c + t * l + i * u + s * f;
    },
  };
}
const Mc = new R(),
  vd = new n0(),
  bd = new n0(),
  xd = new n0();
class Bw extends Yi {
  constructor(t = [], i = !1, s = "centripetal", o = 0.5) {
    (super(),
      (this.isCatmullRomCurve3 = !0),
      (this.type = "CatmullRomCurve3"),
      (this.points = t),
      (this.closed = i),
      (this.curveType = s),
      (this.tension = o));
  }
  getPoint(t, i = new R()) {
    const s = i,
      o = this.points,
      l = o.length,
      u = (l - (this.closed ? 0 : 1)) * t;
    let f = Math.floor(u),
      h = u - f;
    this.closed
      ? (f += f > 0 ? 0 : (Math.floor(Math.abs(f) / l) + 1) * l)
      : h === 0 && f === l - 1 && ((f = l - 2), (h = 1));
    let p, y;
    this.closed || f > 0 ? (p = o[(f - 1) % l]) : (Mc.subVectors(o[0], o[1]).add(o[0]), (p = Mc));
    const g = o[f % l],
      v = o[(f + 1) % l];
    if (
      (this.closed || f + 2 < l
        ? (y = o[(f + 2) % l])
        : (Mc.subVectors(o[l - 1], o[l - 2]).add(o[l - 1]), (y = Mc)),
      this.curveType === "centripetal" || this.curveType === "chordal")
    ) {
      const b = this.curveType === "chordal" ? 0.5 : 0.25;
      let S = Math.pow(p.distanceToSquared(g), b),
        A = Math.pow(g.distanceToSquared(v), b),
        M = Math.pow(v.distanceToSquared(y), b);
      (A < 1e-4 && (A = 1),
        S < 1e-4 && (S = A),
        M < 1e-4 && (M = A),
        vd.initNonuniformCatmullRom(p.x, g.x, v.x, y.x, S, A, M),
        bd.initNonuniformCatmullRom(p.y, g.y, v.y, y.y, S, A, M),
        xd.initNonuniformCatmullRom(p.z, g.z, v.z, y.z, S, A, M));
    } else
      this.curveType === "catmullrom" &&
        (vd.initCatmullRom(p.x, g.x, v.x, y.x, this.tension),
        bd.initCatmullRom(p.y, g.y, v.y, y.y, this.tension),
        xd.initCatmullRom(p.z, g.z, v.z, y.z, this.tension));
    return (s.set(vd.calc(h), bd.calc(h), xd.calc(h)), s);
  }
  copy(t) {
    (super.copy(t), (this.points = []));
    for (let i = 0, s = t.points.length; i < s; i++) {
      const o = t.points[i];
      this.points.push(o.clone());
    }
    return (
      (this.closed = t.closed),
      (this.curveType = t.curveType),
      (this.tension = t.tension),
      this
    );
  }
  toJSON() {
    const t = super.toJSON();
    t.points = [];
    for (let i = 0, s = this.points.length; i < s; i++) {
      const o = this.points[i];
      t.points.push(o.toArray());
    }
    return (
      (t.closed = this.closed),
      (t.curveType = this.curveType),
      (t.tension = this.tension),
      t
    );
  }
  fromJSON(t) {
    (super.fromJSON(t), (this.points = []));
    for (let i = 0, s = t.points.length; i < s; i++) {
      const o = t.points[i];
      this.points.push(new R().fromArray(o));
    }
    return (
      (this.closed = t.closed),
      (this.curveType = t.curveType),
      (this.tension = t.tension),
      this
    );
  }
}
function mv(c, t, i, s, o) {
  const l = (s - t) * 0.5,
    u = (o - i) * 0.5,
    f = c * c,
    h = c * f;
  return (2 * i - 2 * s + l + u) * h + (-3 * i + 3 * s - 2 * l - u) * f + l * c + i;
}
function Dw(c, t) {
  const i = 1 - c;
  return i * i * t;
}
function Nw(c, t) {
  return 2 * (1 - c) * c * t;
}
function Uw(c, t) {
  return c * c * t;
}
function yr(c, t, i, s) {
  return Dw(c, t) + Nw(c, i) + Uw(c, s);
}
function Fw(c, t) {
  const i = 1 - c;
  return i * i * i * t;
}
function Lw(c, t) {
  const i = 1 - c;
  return 3 * i * i * c * t;
}
function kw(c, t) {
  return 3 * (1 - c) * c * c * t;
}
function Hw(c, t) {
  return c * c * c * t;
}
function gr(c, t, i, s, o) {
  return Fw(c, t) + Lw(c, i) + kw(c, s) + Hw(c, o);
}
class F1 extends Yi {
  constructor(t = new tt(), i = new tt(), s = new tt(), o = new tt()) {
    (super(),
      (this.isCubicBezierCurve = !0),
      (this.type = "CubicBezierCurve"),
      (this.v0 = t),
      (this.v1 = i),
      (this.v2 = s),
      (this.v3 = o));
  }
  getPoint(t, i = new tt()) {
    const s = i,
      o = this.v0,
      l = this.v1,
      u = this.v2,
      f = this.v3;
    return (s.set(gr(t, o.x, l.x, u.x, f.x), gr(t, o.y, l.y, u.y, f.y)), s);
  }
  copy(t) {
    return (
      super.copy(t),
      this.v0.copy(t.v0),
      this.v1.copy(t.v1),
      this.v2.copy(t.v2),
      this.v3.copy(t.v3),
      this
    );
  }
  toJSON() {
    const t = super.toJSON();
    return (
      (t.v0 = this.v0.toArray()),
      (t.v1 = this.v1.toArray()),
      (t.v2 = this.v2.toArray()),
      (t.v3 = this.v3.toArray()),
      t
    );
  }
  fromJSON(t) {
    return (
      super.fromJSON(t),
      this.v0.fromArray(t.v0),
      this.v1.fromArray(t.v1),
      this.v2.fromArray(t.v2),
      this.v3.fromArray(t.v3),
      this
    );
  }
}
class Vw extends Yi {
  constructor(t = new R(), i = new R(), s = new R(), o = new R()) {
    (super(),
      (this.isCubicBezierCurve3 = !0),
      (this.type = "CubicBezierCurve3"),
      (this.v0 = t),
      (this.v1 = i),
      (this.v2 = s),
      (this.v3 = o));
  }
  getPoint(t, i = new R()) {
    const s = i,
      o = this.v0,
      l = this.v1,
      u = this.v2,
      f = this.v3;
    return (
      s.set(gr(t, o.x, l.x, u.x, f.x), gr(t, o.y, l.y, u.y, f.y), gr(t, o.z, l.z, u.z, f.z)),
      s
    );
  }
  copy(t) {
    return (
      super.copy(t),
      this.v0.copy(t.v0),
      this.v1.copy(t.v1),
      this.v2.copy(t.v2),
      this.v3.copy(t.v3),
      this
    );
  }
  toJSON() {
    const t = super.toJSON();
    return (
      (t.v0 = this.v0.toArray()),
      (t.v1 = this.v1.toArray()),
      (t.v2 = this.v2.toArray()),
      (t.v3 = this.v3.toArray()),
      t
    );
  }
  fromJSON(t) {
    return (
      super.fromJSON(t),
      this.v0.fromArray(t.v0),
      this.v1.fromArray(t.v1),
      this.v2.fromArray(t.v2),
      this.v3.fromArray(t.v3),
      this
    );
  }
}
class L1 extends Yi {
  constructor(t = new tt(), i = new tt()) {
    (super(), (this.isLineCurve = !0), (this.type = "LineCurve"), (this.v1 = t), (this.v2 = i));
  }
  getPoint(t, i = new tt()) {
    const s = i;
    return (
      t === 1 ? s.copy(this.v2) : (s.copy(this.v2).sub(this.v1), s.multiplyScalar(t).add(this.v1)),
      s
    );
  }
  getPointAt(t, i) {
    return this.getPoint(t, i);
  }
  getTangent(t, i = new tt()) {
    return i.subVectors(this.v2, this.v1).normalize();
  }
  getTangentAt(t, i) {
    return this.getTangent(t, i);
  }
  copy(t) {
    return (super.copy(t), this.v1.copy(t.v1), this.v2.copy(t.v2), this);
  }
  toJSON() {
    const t = super.toJSON();
    return ((t.v1 = this.v1.toArray()), (t.v2 = this.v2.toArray()), t);
  }
  fromJSON(t) {
    return (super.fromJSON(t), this.v1.fromArray(t.v1), this.v2.fromArray(t.v2), this);
  }
}
class Gw extends Yi {
  constructor(t = new R(), i = new R()) {
    (super(), (this.isLineCurve3 = !0), (this.type = "LineCurve3"), (this.v1 = t), (this.v2 = i));
  }
  getPoint(t, i = new R()) {
    const s = i;
    return (
      t === 1 ? s.copy(this.v2) : (s.copy(this.v2).sub(this.v1), s.multiplyScalar(t).add(this.v1)),
      s
    );
  }
  getPointAt(t, i) {
    return this.getPoint(t, i);
  }
  getTangent(t, i = new R()) {
    return i.subVectors(this.v2, this.v1).normalize();
  }
  getTangentAt(t, i) {
    return this.getTangent(t, i);
  }
  copy(t) {
    return (super.copy(t), this.v1.copy(t.v1), this.v2.copy(t.v2), this);
  }
  toJSON() {
    const t = super.toJSON();
    return ((t.v1 = this.v1.toArray()), (t.v2 = this.v2.toArray()), t);
  }
  fromJSON(t) {
    return (super.fromJSON(t), this.v1.fromArray(t.v1), this.v2.fromArray(t.v2), this);
  }
}
class k1 extends Yi {
  constructor(t = new tt(), i = new tt(), s = new tt()) {
    (super(),
      (this.isQuadraticBezierCurve = !0),
      (this.type = "QuadraticBezierCurve"),
      (this.v0 = t),
      (this.v1 = i),
      (this.v2 = s));
  }
  getPoint(t, i = new tt()) {
    const s = i,
      o = this.v0,
      l = this.v1,
      u = this.v2;
    return (s.set(yr(t, o.x, l.x, u.x), yr(t, o.y, l.y, u.y)), s);
  }
  copy(t) {
    return (super.copy(t), this.v0.copy(t.v0), this.v1.copy(t.v1), this.v2.copy(t.v2), this);
  }
  toJSON() {
    const t = super.toJSON();
    return ((t.v0 = this.v0.toArray()), (t.v1 = this.v1.toArray()), (t.v2 = this.v2.toArray()), t);
  }
  fromJSON(t) {
    return (
      super.fromJSON(t),
      this.v0.fromArray(t.v0),
      this.v1.fromArray(t.v1),
      this.v2.fromArray(t.v2),
      this
    );
  }
}
class jw extends Yi {
  constructor(t = new R(), i = new R(), s = new R()) {
    (super(),
      (this.isQuadraticBezierCurve3 = !0),
      (this.type = "QuadraticBezierCurve3"),
      (this.v0 = t),
      (this.v1 = i),
      (this.v2 = s));
  }
  getPoint(t, i = new R()) {
    const s = i,
      o = this.v0,
      l = this.v1,
      u = this.v2;
    return (s.set(yr(t, o.x, l.x, u.x), yr(t, o.y, l.y, u.y), yr(t, o.z, l.z, u.z)), s);
  }
  copy(t) {
    return (super.copy(t), this.v0.copy(t.v0), this.v1.copy(t.v1), this.v2.copy(t.v2), this);
  }
  toJSON() {
    const t = super.toJSON();
    return ((t.v0 = this.v0.toArray()), (t.v1 = this.v1.toArray()), (t.v2 = this.v2.toArray()), t);
  }
  fromJSON(t) {
    return (
      super.fromJSON(t),
      this.v0.fromArray(t.v0),
      this.v1.fromArray(t.v1),
      this.v2.fromArray(t.v2),
      this
    );
  }
}
class H1 extends Yi {
  constructor(t = []) {
    (super(), (this.isSplineCurve = !0), (this.type = "SplineCurve"), (this.points = t));
  }
  getPoint(t, i = new tt()) {
    const s = i,
      o = this.points,
      l = (o.length - 1) * t,
      u = Math.floor(l),
      f = l - u,
      h = o[u === 0 ? u : u - 1],
      p = o[u],
      y = o[u > o.length - 2 ? o.length - 1 : u + 1],
      g = o[u > o.length - 3 ? o.length - 1 : u + 2];
    return (s.set(mv(f, h.x, p.x, y.x, g.x), mv(f, h.y, p.y, y.y, g.y)), s);
  }
  copy(t) {
    (super.copy(t), (this.points = []));
    for (let i = 0, s = t.points.length; i < s; i++) {
      const o = t.points[i];
      this.points.push(o.clone());
    }
    return this;
  }
  toJSON() {
    const t = super.toJSON();
    t.points = [];
    for (let i = 0, s = this.points.length; i < s; i++) {
      const o = this.points[i];
      t.points.push(o.toArray());
    }
    return t;
  }
  fromJSON(t) {
    (super.fromJSON(t), (this.points = []));
    for (let i = 0, s = t.points.length; i < s; i++) {
      const o = t.points[i];
      this.points.push(new tt().fromArray(o));
    }
    return this;
  }
}
var Ld = Object.freeze({
  __proto__: null,
  ArcCurve: Ow,
  CatmullRomCurve3: Bw,
  CubicBezierCurve: F1,
  CubicBezierCurve3: Vw,
  EllipseCurve: i0,
  LineCurve: L1,
  LineCurve3: Gw,
  QuadraticBezierCurve: k1,
  QuadraticBezierCurve3: jw,
  SplineCurve: H1,
});
class Yw extends Yi {
  constructor() {
    (super(), (this.type = "CurvePath"), (this.curves = []), (this.autoClose = !1));
  }
  add(t) {
    this.curves.push(t);
  }
  closePath() {
    const t = this.curves[0].getPoint(0),
      i = this.curves[this.curves.length - 1].getPoint(1);
    if (!t.equals(i)) {
      const s = t.isVector2 === !0 ? "LineCurve" : "LineCurve3";
      this.curves.push(new Ld[s](i, t));
    }
    return this;
  }
  getPoint(t, i) {
    const s = t * this.getLength(),
      o = this.getCurveLengths();
    let l = 0;
    for (; l < o.length;) {
      if (o[l] >= s) {
        const u = o[l] - s,
          f = this.curves[l],
          h = f.getLength(),
          p = h === 0 ? 0 : 1 - u / h;
        return f.getPointAt(p, i);
      }
      l++;
    }
    return null;
  }
  getLength() {
    const t = this.getCurveLengths();
    return t[t.length - 1];
  }
  updateArcLengths() {
    ((this.needsUpdate = !0), (this.cacheLengths = null), this.getCurveLengths());
  }
  getCurveLengths() {
    if (this.cacheLengths && this.cacheLengths.length === this.curves.length)
      return this.cacheLengths;
    const t = [];
    let i = 0;
    for (let s = 0, o = this.curves.length; s < o; s++)
      ((i += this.curves[s].getLength()), t.push(i));
    return ((this.cacheLengths = t), t);
  }
  getSpacedPoints(t = 40) {
    const i = [];
    for (let s = 0; s <= t; s++) i.push(this.getPoint(s / t));
    return (this.autoClose && i.push(i[0]), i);
  }
  getPoints(t = 12) {
    const i = [];
    let s;
    for (let o = 0, l = this.curves; o < l.length; o++) {
      const u = l[o],
        f = u.isEllipseCurve
          ? t * 2
          : u.isLineCurve || u.isLineCurve3
            ? 1
            : u.isSplineCurve
              ? t * u.points.length
              : t,
        h = u.getPoints(f);
      for (let p = 0; p < h.length; p++) {
        const y = h[p];
        (s && s.equals(y)) || (i.push(y), (s = y));
      }
    }
    return (this.autoClose && i.length > 1 && !i[i.length - 1].equals(i[0]) && i.push(i[0]), i);
  }
  copy(t) {
    (super.copy(t), (this.curves = []));
    for (let i = 0, s = t.curves.length; i < s; i++) {
      const o = t.curves[i];
      this.curves.push(o.clone());
    }
    return ((this.autoClose = t.autoClose), this);
  }
  toJSON() {
    const t = super.toJSON();
    ((t.autoClose = this.autoClose), (t.curves = []));
    for (let i = 0, s = this.curves.length; i < s; i++) {
      const o = this.curves[i];
      t.curves.push(o.toJSON());
    }
    return t;
  }
  fromJSON(t) {
    (super.fromJSON(t), (this.autoClose = t.autoClose), (this.curves = []));
    for (let i = 0, s = t.curves.length; i < s; i++) {
      const o = t.curves[i];
      this.curves.push(new Ld[o.type]().fromJSON(o));
    }
    return this;
  }
}
class yv extends Yw {
  constructor(t) {
    (super(), (this.type = "Path"), (this.currentPoint = new tt()), t && this.setFromPoints(t));
  }
  setFromPoints(t) {
    this.moveTo(t[0].x, t[0].y);
    for (let i = 1, s = t.length; i < s; i++) this.lineTo(t[i].x, t[i].y);
    return this;
  }
  moveTo(t, i) {
    return (this.currentPoint.set(t, i), this);
  }
  lineTo(t, i) {
    const s = new L1(this.currentPoint.clone(), new tt(t, i));
    return (this.curves.push(s), this.currentPoint.set(t, i), this);
  }
  quadraticCurveTo(t, i, s, o) {
    const l = new k1(this.currentPoint.clone(), new tt(t, i), new tt(s, o));
    return (this.curves.push(l), this.currentPoint.set(s, o), this);
  }
  bezierCurveTo(t, i, s, o, l, u) {
    const f = new F1(this.currentPoint.clone(), new tt(t, i), new tt(s, o), new tt(l, u));
    return (this.curves.push(f), this.currentPoint.set(l, u), this);
  }
  splineThru(t) {
    const i = [this.currentPoint.clone()].concat(t),
      s = new H1(i);
    return (this.curves.push(s), this.currentPoint.copy(t[t.length - 1]), this);
  }
  arc(t, i, s, o, l, u) {
    const f = this.currentPoint.x,
      h = this.currentPoint.y;
    return (this.absarc(t + f, i + h, s, o, l, u), this);
  }
  absarc(t, i, s, o, l, u) {
    return (this.absellipse(t, i, s, s, o, l, u), this);
  }
  ellipse(t, i, s, o, l, u, f, h) {
    const p = this.currentPoint.x,
      y = this.currentPoint.y;
    return (this.absellipse(t + p, i + y, s, o, l, u, f, h), this);
  }
  absellipse(t, i, s, o, l, u, f, h) {
    const p = new i0(t, i, s, o, l, u, f, h);
    if (this.curves.length > 0) {
      const g = p.getPoint(0);
      g.equals(this.currentPoint) || this.lineTo(g.x, g.y);
    }
    this.curves.push(p);
    const y = p.getPoint(1);
    return (this.currentPoint.copy(y), this);
  }
  copy(t) {
    return (super.copy(t), this.currentPoint.copy(t.currentPoint), this);
  }
  toJSON() {
    const t = super.toJSON();
    return ((t.currentPoint = this.currentPoint.toArray()), t);
  }
  fromJSON(t) {
    return (super.fromJSON(t), this.currentPoint.fromArray(t.currentPoint), this);
  }
}
class qw extends yv {
  constructor(t) {
    (super(t), (this.uuid = Ai()), (this.type = "Shape"), (this.holes = []));
  }
  getPointsHoles(t) {
    const i = [];
    for (let s = 0, o = this.holes.length; s < o; s++) i[s] = this.holes[s].getPoints(t);
    return i;
  }
  extractPoints(t) {
    return { shape: this.getPoints(t), holes: this.getPointsHoles(t) };
  }
  copy(t) {
    (super.copy(t), (this.holes = []));
    for (let i = 0, s = t.holes.length; i < s; i++) {
      const o = t.holes[i];
      this.holes.push(o.clone());
    }
    return this;
  }
  toJSON() {
    const t = super.toJSON();
    ((t.uuid = this.uuid), (t.holes = []));
    for (let i = 0, s = this.holes.length; i < s; i++) {
      const o = this.holes[i];
      t.holes.push(o.toJSON());
    }
    return t;
  }
  fromJSON(t) {
    (super.fromJSON(t), (this.uuid = t.uuid), (this.holes = []));
    for (let i = 0, s = t.holes.length; i < s; i++) {
      const o = t.holes[i];
      this.holes.push(new yv().fromJSON(o));
    }
    return this;
  }
}
function Xw(c, t, i = 2) {
  const s = t && t.length,
    o = s ? t[0] * i : c.length;
  let l = V1(c, 0, o, i, !0);
  const u = [];
  if (!l || l.next === l.prev) return u;
  let f, h, p;
  if ((s && (l = Jw(c, t, l, i)), c.length > 80 * i)) {
    ((f = 1 / 0), (h = 1 / 0));
    let y = -1 / 0,
      g = -1 / 0;
    for (let v = i; v < o; v += i) {
      const b = c[v],
        S = c[v + 1];
      (b < f && (f = b), S < h && (h = S), b > y && (y = b), S > g && (g = S));
    }
    ((p = Math.max(y - f, g - h)), (p = p !== 0 ? 32767 / p : 0));
  }
  return (br(l, u, i, f, h, p, 0), u);
}
function V1(c, t, i, s, o) {
  let l;
  if (o === rA(c, t, i, s) > 0)
    for (let u = t; u < i; u += s) l = gv((u / s) | 0, c[u], c[u + 1], l);
  else for (let u = i - s; u >= t; u -= s) l = gv((u / s) | 0, c[u], c[u + 1], l);
  return (l && Ia(l, l.next) && (Sr(l), (l = l.next)), l);
}
function Os(c, t) {
  if (!c) return c;
  t || (t = c);
  let i = c,
    s;
  do
    if (((s = !1), !i.steiner && (Ia(i, i.next) || te(i.prev, i, i.next) === 0))) {
      if ((Sr(i), (i = t = i.prev), i === i.next)) break;
      s = !0;
    } else i = i.next;
  while (s || i !== t);
  return t;
}
function br(c, t, i, s, o, l, u) {
  if (!c) return;
  !u && l && eA(c, s, o, l);
  let f = c;
  for (; c.prev !== c.next;) {
    const h = c.prev,
      p = c.next;
    if (l ? Zw(c, s, o, l) : Iw(c)) {
      (t.push(h.i, c.i, p.i), Sr(c), (c = p.next), (f = p.next));
      continue;
    }
    if (((c = p), c === f)) {
      u
        ? u === 1
          ? ((c = Pw(Os(c), t)), br(c, t, i, s, o, l, 2))
          : u === 2 && Ww(c, t, i, s, o, l)
        : br(Os(c), t, i, s, o, l, 1);
      break;
    }
  }
}
function Iw(c) {
  const t = c.prev,
    i = c,
    s = c.next;
  if (te(t, i, s) >= 0) return !1;
  const o = t.x,
    l = i.x,
    u = s.x,
    f = t.y,
    h = i.y,
    p = s.y,
    y = Math.min(o, l, u),
    g = Math.min(f, h, p),
    v = Math.max(o, l, u),
    b = Math.max(f, h, p);
  let S = s.next;
  for (; S !== t;) {
    if (
      S.x >= y &&
      S.x <= v &&
      S.y >= g &&
      S.y <= b &&
      ur(o, f, l, h, u, p, S.x, S.y) &&
      te(S.prev, S, S.next) >= 0
    )
      return !1;
    S = S.next;
  }
  return !0;
}
function Zw(c, t, i, s) {
  const o = c.prev,
    l = c,
    u = c.next;
  if (te(o, l, u) >= 0) return !1;
  const f = o.x,
    h = l.x,
    p = u.x,
    y = o.y,
    g = l.y,
    v = u.y,
    b = Math.min(f, h, p),
    S = Math.min(y, g, v),
    A = Math.max(f, h, p),
    M = Math.max(y, g, v),
    T = kd(b, S, t, i, s),
    O = kd(A, M, t, i, s);
  let C = c.prevZ,
    E = c.nextZ;
  for (; C && C.z >= T && E && E.z <= O;) {
    if (
      (C.x >= b &&
        C.x <= A &&
        C.y >= S &&
        C.y <= M &&
        C !== o &&
        C !== u &&
        ur(f, y, h, g, p, v, C.x, C.y) &&
        te(C.prev, C, C.next) >= 0) ||
      ((C = C.prevZ),
      E.x >= b &&
        E.x <= A &&
        E.y >= S &&
        E.y <= M &&
        E !== o &&
        E !== u &&
        ur(f, y, h, g, p, v, E.x, E.y) &&
        te(E.prev, E, E.next) >= 0)
    )
      return !1;
    E = E.nextZ;
  }
  for (; C && C.z >= T;) {
    if (
      C.x >= b &&
      C.x <= A &&
      C.y >= S &&
      C.y <= M &&
      C !== o &&
      C !== u &&
      ur(f, y, h, g, p, v, C.x, C.y) &&
      te(C.prev, C, C.next) >= 0
    )
      return !1;
    C = C.prevZ;
  }
  for (; E && E.z <= O;) {
    if (
      E.x >= b &&
      E.x <= A &&
      E.y >= S &&
      E.y <= M &&
      E !== o &&
      E !== u &&
      ur(f, y, h, g, p, v, E.x, E.y) &&
      te(E.prev, E, E.next) >= 0
    )
      return !1;
    E = E.nextZ;
  }
  return !0;
}
function Pw(c, t) {
  let i = c;
  do {
    const s = i.prev,
      o = i.next.next;
    (!Ia(s, o) &&
      j1(s, i, i.next, o) &&
      xr(s, o) &&
      xr(o, s) &&
      (t.push(s.i, i.i, o.i), Sr(i), Sr(i.next), (i = c = o)),
      (i = i.next));
  } while (i !== c);
  return Os(i);
}
function Ww(c, t, i, s, o, l) {
  let u = c;
  do {
    let f = u.next.next;
    for (; f !== u.prev;) {
      if (u.i !== f.i && sA(u, f)) {
        let h = Y1(u, f);
        ((u = Os(u, u.next)),
          (h = Os(h, h.next)),
          br(u, t, i, s, o, l, 0),
          br(h, t, i, s, o, l, 0));
        return;
      }
      f = f.next;
    }
    u = u.next;
  } while (u !== c);
}
function Jw(c, t, i, s) {
  const o = [];
  for (let l = 0, u = t.length; l < u; l++) {
    const f = t[l] * s,
      h = l < u - 1 ? t[l + 1] * s : c.length,
      p = V1(c, f, h, s, !1);
    (p === p.next && (p.steiner = !0), o.push(nA(p)));
  }
  o.sort(Qw);
  for (let l = 0; l < o.length; l++) i = Kw(o[l], i);
  return i;
}
function Qw(c, t) {
  let i = c.x - t.x;
  if (i === 0 && ((i = c.y - t.y), i === 0)) {
    const s = (c.next.y - c.y) / (c.next.x - c.x),
      o = (t.next.y - t.y) / (t.next.x - t.x);
    i = s - o;
  }
  return i;
}
function Kw(c, t) {
  const i = $w(c, t);
  if (!i) return t;
  const s = Y1(i, c);
  return (Os(s, s.next), Os(i, i.next));
}
function $w(c, t) {
  let i = t;
  const s = c.x,
    o = c.y;
  let l = -1 / 0,
    u;
  if (Ia(c, i)) return i;
  do {
    if (Ia(c, i.next)) return i.next;
    if (o <= i.y && o >= i.next.y && i.next.y !== i.y) {
      const g = i.x + ((o - i.y) * (i.next.x - i.x)) / (i.next.y - i.y);
      if (g <= s && g > l && ((l = g), (u = i.x < i.next.x ? i : i.next), g === s)) return u;
    }
    i = i.next;
  } while (i !== t);
  if (!u) return null;
  const f = u,
    h = u.x,
    p = u.y;
  let y = 1 / 0;
  i = u;
  do {
    if (
      s >= i.x &&
      i.x >= h &&
      s !== i.x &&
      G1(o < p ? s : l, o, h, p, o < p ? l : s, o, i.x, i.y)
    ) {
      const g = Math.abs(o - i.y) / (s - i.x);
      xr(i, c) &&
        (g < y || (g === y && (i.x > u.x || (i.x === u.x && tA(u, i))))) &&
        ((u = i), (y = g));
    }
    i = i.next;
  } while (i !== f);
  return u;
}
function tA(c, t) {
  return te(c.prev, c, t.prev) < 0 && te(t.next, c, c.next) < 0;
}
function eA(c, t, i, s) {
  let o = c;
  do
    (o.z === 0 && (o.z = kd(o.x, o.y, t, i, s)),
      (o.prevZ = o.prev),
      (o.nextZ = o.next),
      (o = o.next));
  while (o !== c);
  ((o.prevZ.nextZ = null), (o.prevZ = null), iA(o));
}
function iA(c) {
  let t,
    i = 1;
  do {
    let s = c,
      o;
    c = null;
    let l = null;
    for (t = 0; s;) {
      t++;
      let u = s,
        f = 0;
      for (let p = 0; p < i && (f++, (u = u.nextZ), !!u); p++);
      let h = i;
      for (; f > 0 || (h > 0 && u);)
        (f !== 0 && (h === 0 || !u || s.z <= u.z)
          ? ((o = s), (s = s.nextZ), f--)
          : ((o = u), (u = u.nextZ), h--),
          l ? (l.nextZ = o) : (c = o),
          (o.prevZ = l),
          (l = o));
      s = u;
    }
    ((l.nextZ = null), (i *= 2));
  } while (t > 1);
  return c;
}
function kd(c, t, i, s, o) {
  return (
    (c = ((c - i) * o) | 0),
    (t = ((t - s) * o) | 0),
    (c = (c | (c << 8)) & 16711935),
    (c = (c | (c << 4)) & 252645135),
    (c = (c | (c << 2)) & 858993459),
    (c = (c | (c << 1)) & 1431655765),
    (t = (t | (t << 8)) & 16711935),
    (t = (t | (t << 4)) & 252645135),
    (t = (t | (t << 2)) & 858993459),
    (t = (t | (t << 1)) & 1431655765),
    c | (t << 1)
  );
}
function nA(c) {
  let t = c,
    i = c;
  do ((t.x < i.x || (t.x === i.x && t.y < i.y)) && (i = t), (t = t.next));
  while (t !== c);
  return i;
}
function G1(c, t, i, s, o, l, u, f) {
  return (
    (o - u) * (t - f) >= (c - u) * (l - f) &&
    (c - u) * (s - f) >= (i - u) * (t - f) &&
    (i - u) * (l - f) >= (o - u) * (s - f)
  );
}
function ur(c, t, i, s, o, l, u, f) {
  return !(c === u && t === f) && G1(c, t, i, s, o, l, u, f);
}
function sA(c, t) {
  return (
    c.next.i !== t.i &&
    c.prev.i !== t.i &&
    !aA(c, t) &&
    ((xr(c, t) && xr(t, c) && oA(c, t) && (te(c.prev, c, t.prev) || te(c, t.prev, t))) ||
      (Ia(c, t) && te(c.prev, c, c.next) > 0 && te(t.prev, t, t.next) > 0))
  );
}
function te(c, t, i) {
  return (t.y - c.y) * (i.x - t.x) - (t.x - c.x) * (i.y - t.y);
}
function Ia(c, t) {
  return c.x === t.x && c.y === t.y;
}
function j1(c, t, i, s) {
  const o = Tc(te(c, t, i)),
    l = Tc(te(c, t, s)),
    u = Tc(te(i, s, c)),
    f = Tc(te(i, s, t));
  return !!(
    (o !== l && u !== f) ||
    (o === 0 && _c(c, i, t)) ||
    (l === 0 && _c(c, s, t)) ||
    (u === 0 && _c(i, c, s)) ||
    (f === 0 && _c(i, t, s))
  );
}
function _c(c, t, i) {
  return (
    t.x <= Math.max(c.x, i.x) &&
    t.x >= Math.min(c.x, i.x) &&
    t.y <= Math.max(c.y, i.y) &&
    t.y >= Math.min(c.y, i.y)
  );
}
function Tc(c) {
  return c > 0 ? 1 : c < 0 ? -1 : 0;
}
function aA(c, t) {
  let i = c;
  do {
    if (i.i !== c.i && i.next.i !== c.i && i.i !== t.i && i.next.i !== t.i && j1(i, i.next, c, t))
      return !0;
    i = i.next;
  } while (i !== c);
  return !1;
}
function xr(c, t) {
  return te(c.prev, c, c.next) < 0
    ? te(c, t, c.next) >= 0 && te(c, c.prev, t) >= 0
    : te(c, t, c.prev) < 0 || te(c, c.next, t) < 0;
}
function oA(c, t) {
  let i = c,
    s = !1;
  const o = (c.x + t.x) / 2,
    l = (c.y + t.y) / 2;
  do
    (i.y > l != i.next.y > l &&
      i.next.y !== i.y &&
      o < ((i.next.x - i.x) * (l - i.y)) / (i.next.y - i.y) + i.x &&
      (s = !s),
      (i = i.next));
  while (i !== c);
  return s;
}
function Y1(c, t) {
  const i = Hd(c.i, c.x, c.y),
    s = Hd(t.i, t.x, t.y),
    o = c.next,
    l = t.prev;
  return (
    (c.next = t),
    (t.prev = c),
    (i.next = o),
    (o.prev = i),
    (s.next = i),
    (i.prev = s),
    (l.next = s),
    (s.prev = l),
    s
  );
}
function gv(c, t, i, s) {
  const o = Hd(c, t, i);
  return (
    s
      ? ((o.next = s.next), (o.prev = s), (s.next.prev = o), (s.next = o))
      : ((o.prev = o), (o.next = o)),
    o
  );
}
function Sr(c) {
  ((c.next.prev = c.prev),
    (c.prev.next = c.next),
    c.prevZ && (c.prevZ.nextZ = c.nextZ),
    c.nextZ && (c.nextZ.prevZ = c.prevZ));
}
function Hd(c, t, i) {
  return { i: c, x: t, y: i, prev: null, next: null, z: 0, prevZ: null, nextZ: null, steiner: !1 };
}
function rA(c, t, i, s) {
  let o = 0;
  for (let l = t, u = i - s; l < i; l += s) ((o += (c[u] - c[l]) * (c[l + 1] + c[u + 1])), (u = l));
  return o;
}
class lA {
  static triangulate(t, i, s = 2) {
    return Xw(t, i, s);
  }
}
class Ga {
  static area(t) {
    const i = t.length;
    let s = 0;
    for (let o = i - 1, l = 0; l < i; o = l++) s += t[o].x * t[l].y - t[l].x * t[o].y;
    return s * 0.5;
  }
  static isClockWise(t) {
    return Ga.area(t) < 0;
  }
  static triangulateShape(t, i) {
    const s = [],
      o = [],
      l = [];
    (vv(t), bv(s, t));
    let u = t.length;
    i.forEach(vv);
    for (let h = 0; h < i.length; h++) (o.push(u), (u += i[h].length), bv(s, i[h]));
    const f = lA.triangulate(s, o);
    for (let h = 0; h < f.length; h += 3) l.push(f.slice(h, h + 3));
    return l;
  }
}
function vv(c) {
  const t = c.length;
  t > 2 && c[t - 1].equals(c[0]) && c.pop();
}
function bv(c, t) {
  for (let i = 0; i < t.length; i++) (c.push(t[i].x), c.push(t[i].y));
}
class q1 extends At {
  constructor(
    t = new qw([new tt(0.5, 0.5), new tt(-0.5, 0.5), new tt(-0.5, -0.5), new tt(0.5, -0.5)]),
    i = {},
  ) {
    (super(),
      (this.type = "ExtrudeGeometry"),
      (this.parameters = { shapes: t, options: i }),
      (t = Array.isArray(t) ? t : [t]));
    const s = this,
      o = [],
      l = [];
    for (let f = 0, h = t.length; f < h; f++) {
      const p = t[f];
      u(p);
    }
    (this.setAttribute("position", new ze(o, 3)),
      this.setAttribute("uv", new ze(l, 2)),
      this.computeVertexNormals());
    function u(f) {
      const h = [],
        p = i.curveSegments !== void 0 ? i.curveSegments : 12,
        y = i.steps !== void 0 ? i.steps : 1,
        g = i.depth !== void 0 ? i.depth : 1;
      let v = i.bevelEnabled !== void 0 ? i.bevelEnabled : !0,
        b = i.bevelThickness !== void 0 ? i.bevelThickness : 0.2,
        S = i.bevelSize !== void 0 ? i.bevelSize : b - 0.1,
        A = i.bevelOffset !== void 0 ? i.bevelOffset : 0,
        M = i.bevelSegments !== void 0 ? i.bevelSegments : 3;
      const T = i.extrudePath,
        O = i.UVGenerator !== void 0 ? i.UVGenerator : cA;
      let C,
        E = !1,
        U,
        q,
        X,
        G;
      (T &&
        ((C = T.getSpacedPoints(y)),
        (E = !0),
        (v = !1),
        (U = T.computeFrenetFrames(y, !1)),
        (q = new R()),
        (X = new R()),
        (G = new R())),
        v || ((M = 0), (b = 0), (S = 0), (A = 0)));
      const W = f.extractPoints(p);
      let P = W.shape;
      const Q = W.holes;
      if (!Ga.isClockWise(P)) {
        P = P.reverse();
        for (let Z = 0, K = Q.length; Z < K; Z++) {
          const $ = Q[Z];
          Ga.isClockWise($) && (Q[Z] = $.reverse());
        }
      }
      function ht(Z) {
        const $ = 10000000000000001e-36;
        let at = Z[0];
        for (let st = 1; st <= Z.length; st++) {
          const Mt = st % Z.length,
            mt = Z[Mt],
            Ht = mt.x - at.x,
            Pt = mt.y - at.y,
            se = Ht * Ht + Pt * Pt,
            qt = Math.max(Math.abs(mt.x), Math.abs(mt.y), Math.abs(at.x), Math.abs(at.y)),
            qi = $ * qt * qt;
          if (se <= qi) {
            (Z.splice(Mt, 1), st--);
            continue;
          }
          at = mt;
        }
      }
      (ht(P), Q.forEach(ht));
      const xt = Q.length,
        ft = P;
      for (let Z = 0; Z < xt; Z++) {
        const K = Q[Z];
        P = P.concat(K);
      }
      function L(Z, K, $) {
        return (
          K || console.error("THREE.ExtrudeGeometry: vec does not exist"),
          Z.clone().addScaledVector(K, $)
        );
      }
      const I = P.length;
      function nt(Z, K, $) {
        let at, st, Mt;
        const mt = Z.x - K.x,
          Ht = Z.y - K.y,
          Pt = $.x - Z.x,
          se = $.y - Z.y,
          qt = mt * mt + Ht * Ht,
          qi = mt * se - Ht * Pt;
        if (Math.abs(qi) > Number.EPSILON) {
          const Ce = Math.sqrt(qt),
            $a = Math.sqrt(Pt * Pt + se * se),
            rs = K.x - Ht / Ce,
            Dr = K.y + mt / Ce,
            Nr = $.x - se / $a,
            zu = $.y + Pt / $a,
            Ur = ((Nr - rs) * se - (zu - Dr) * Pt) / (mt * se - Ht * Pt);
          ((at = rs + mt * Ur - Z.x), (st = Dr + Ht * Ur - Z.y));
          const Mn = at * at + st * st;
          if (Mn <= 2) return new tt(at, st);
          Mt = Math.sqrt(Mn / 2);
        } else {
          let Ce = !1;
          (mt > Number.EPSILON
            ? Pt > Number.EPSILON && (Ce = !0)
            : mt < -Number.EPSILON
              ? Pt < -Number.EPSILON && (Ce = !0)
              : Math.sign(Ht) === Math.sign(se) && (Ce = !0),
            Ce
              ? ((at = -Ht), (st = mt), (Mt = Math.sqrt(qt)))
              : ((at = mt), (st = Ht), (Mt = Math.sqrt(qt / 2))));
        }
        return new tt(at / Mt, st / Mt);
      }
      const lt = [];
      for (let Z = 0, K = ft.length, $ = K - 1, at = Z + 1; Z < K; Z++, $++, at++)
        ($ === K && ($ = 0), at === K && (at = 0), (lt[Z] = nt(ft[Z], ft[$], ft[at])));
      const ut = [];
      let gt,
        zt = lt.concat();
      for (let Z = 0, K = xt; Z < K; Z++) {
        const $ = Q[Z];
        gt = [];
        for (let at = 0, st = $.length, Mt = st - 1, mt = at + 1; at < st; at++, Mt++, mt++)
          (Mt === st && (Mt = 0), mt === st && (mt = 0), (gt[at] = nt($[at], $[Mt], $[mt])));
        (ut.push(gt), (zt = zt.concat(gt)));
      }
      let pt;
      if (M === 0) pt = Ga.triangulateShape(ft, Q);
      else {
        const Z = [],
          K = [];
        for (let $ = 0; $ < M; $++) {
          const at = $ / M,
            st = b * Math.cos((at * Math.PI) / 2),
            Mt = S * Math.sin((at * Math.PI) / 2) + A;
          for (let mt = 0, Ht = ft.length; mt < Ht; mt++) {
            const Pt = L(ft[mt], lt[mt], Mt);
            (Re(Pt.x, Pt.y, -st), at === 0 && Z.push(Pt));
          }
          for (let mt = 0, Ht = xt; mt < Ht; mt++) {
            const Pt = Q[mt];
            gt = ut[mt];
            const se = [];
            for (let qt = 0, qi = Pt.length; qt < qi; qt++) {
              const Ce = L(Pt[qt], gt[qt], Mt);
              (Re(Ce.x, Ce.y, -st), at === 0 && se.push(Ce));
            }
            at === 0 && K.push(se);
          }
        }
        pt = Ga.triangulateShape(Z, K);
      }
      const Zt = pt.length,
        Ee = S + A;
      for (let Z = 0; Z < I; Z++) {
        const K = v ? L(P[Z], zt[Z], Ee) : P[Z];
        E
          ? (X.copy(U.normals[0]).multiplyScalar(K.x),
            q.copy(U.binormals[0]).multiplyScalar(K.y),
            G.copy(C[0]).add(X).add(q),
            Re(G.x, G.y, G.z))
          : Re(K.x, K.y, 0);
      }
      for (let Z = 1; Z <= y; Z++)
        for (let K = 0; K < I; K++) {
          const $ = v ? L(P[K], zt[K], Ee) : P[K];
          E
            ? (X.copy(U.normals[Z]).multiplyScalar($.x),
              q.copy(U.binormals[Z]).multiplyScalar($.y),
              G.copy(C[Z]).add(X).add(q),
              Re(G.x, G.y, G.z))
            : Re($.x, $.y, (g / y) * Z);
        }
      for (let Z = M - 1; Z >= 0; Z--) {
        const K = Z / M,
          $ = b * Math.cos((K * Math.PI) / 2),
          at = S * Math.sin((K * Math.PI) / 2) + A;
        for (let st = 0, Mt = ft.length; st < Mt; st++) {
          const mt = L(ft[st], lt[st], at);
          Re(mt.x, mt.y, g + $);
        }
        for (let st = 0, Mt = Q.length; st < Mt; st++) {
          const mt = Q[st];
          gt = ut[st];
          for (let Ht = 0, Pt = mt.length; Ht < Pt; Ht++) {
            const se = L(mt[Ht], gt[Ht], at);
            E ? Re(se.x, se.y + C[y - 1].y, C[y - 1].x + $) : Re(se.x, se.y, g + $);
          }
        }
      }
      (Fi(), Us());
      function Fi() {
        const Z = o.length / 3;
        if (v) {
          let K = 0,
            $ = I * K;
          for (let at = 0; at < Zt; at++) {
            const st = pt[at];
            An(st[2] + $, st[1] + $, st[0] + $);
          }
          ((K = y + M * 2), ($ = I * K));
          for (let at = 0; at < Zt; at++) {
            const st = pt[at];
            An(st[0] + $, st[1] + $, st[2] + $);
          }
        } else {
          for (let K = 0; K < Zt; K++) {
            const $ = pt[K];
            An($[2], $[1], $[0]);
          }
          for (let K = 0; K < Zt; K++) {
            const $ = pt[K];
            An($[0] + I * y, $[1] + I * y, $[2] + I * y);
          }
        }
        s.addGroup(Z, o.length / 3 - Z, 0);
      }
      function Us() {
        const Z = o.length / 3;
        let K = 0;
        (os(ft, K), (K += ft.length));
        for (let $ = 0, at = Q.length; $ < at; $++) {
          const st = Q[$];
          (os(st, K), (K += st.length));
        }
        s.addGroup(Z, o.length / 3 - Z, 1);
      }
      function os(Z, K) {
        let $ = Z.length;
        for (; --$ >= 0;) {
          const at = $;
          let st = $ - 1;
          st < 0 && (st = Z.length - 1);
          for (let Mt = 0, mt = y + M * 2; Mt < mt; Mt++) {
            const Ht = I * Mt,
              Pt = I * (Mt + 1),
              se = K + at + Ht,
              qt = K + st + Ht,
              qi = K + st + Pt,
              Ce = K + at + Pt;
            Fs(se, qt, qi, Ce);
          }
        }
      }
      function Re(Z, K, $) {
        (h.push(Z), h.push(K), h.push($));
      }
      function An(Z, K, $) {
        (Ie(Z), Ie(K), Ie($));
        const at = o.length / 3,
          st = O.generateTopUV(s, o, at - 3, at - 2, at - 1);
        (ri(st[0]), ri(st[1]), ri(st[2]));
      }
      function Fs(Z, K, $, at) {
        (Ie(Z), Ie(K), Ie(at), Ie(K), Ie($), Ie(at));
        const st = o.length / 3,
          Mt = O.generateSideWallUV(s, o, st - 6, st - 3, st - 2, st - 1);
        (ri(Mt[0]), ri(Mt[1]), ri(Mt[3]), ri(Mt[1]), ri(Mt[2]), ri(Mt[3]));
      }
      function Ie(Z) {
        (o.push(h[Z * 3 + 0]), o.push(h[Z * 3 + 1]), o.push(h[Z * 3 + 2]));
      }
      function ri(Z) {
        (l.push(Z.x), l.push(Z.y));
      }
    }
  }
  copy(t) {
    return (super.copy(t), (this.parameters = Object.assign({}, t.parameters)), this);
  }
  toJSON() {
    const t = super.toJSON(),
      i = this.parameters.shapes,
      s = this.parameters.options;
    return uA(i, s, t);
  }
  static fromJSON(t, i) {
    const s = [];
    for (let l = 0, u = t.shapes.length; l < u; l++) {
      const f = i[t.shapes[l]];
      s.push(f);
    }
    const o = t.options.extrudePath;
    return (
      o !== void 0 && (t.options.extrudePath = new Ld[o.type]().fromJSON(o)),
      new q1(s, t.options)
    );
  }
}
const cA = {
  generateTopUV: function (c, t, i, s, o) {
    const l = t[i * 3],
      u = t[i * 3 + 1],
      f = t[s * 3],
      h = t[s * 3 + 1],
      p = t[o * 3],
      y = t[o * 3 + 1];
    return [new tt(l, u), new tt(f, h), new tt(p, y)];
  },
  generateSideWallUV: function (c, t, i, s, o, l) {
    const u = t[i * 3],
      f = t[i * 3 + 1],
      h = t[i * 3 + 2],
      p = t[s * 3],
      y = t[s * 3 + 1],
      g = t[s * 3 + 2],
      v = t[o * 3],
      b = t[o * 3 + 1],
      S = t[o * 3 + 2],
      A = t[l * 3],
      M = t[l * 3 + 1],
      T = t[l * 3 + 2];
    return Math.abs(f - y) < Math.abs(u - p)
      ? [new tt(u, 1 - h), new tt(p, 1 - g), new tt(v, 1 - S), new tt(A, 1 - T)]
      : [new tt(f, 1 - h), new tt(y, 1 - g), new tt(b, 1 - S), new tt(M, 1 - T)];
  },
};
function uA(c, t, i) {
  if (((i.shapes = []), Array.isArray(c)))
    for (let s = 0, o = c.length; s < o; s++) {
      const l = c[s];
      i.shapes.push(l.uuid);
    }
  else i.shapes.push(c.uuid);
  return (
    (i.options = Object.assign({}, t)),
    t.extrudePath !== void 0 && (i.options.extrudePath = t.extrudePath.toJSON()),
    i
  );
}
class be extends At {
  constructor(t = 1, i = 1, s = 1, o = 1) {
    (super(),
      (this.type = "PlaneGeometry"),
      (this.parameters = { width: t, height: i, widthSegments: s, heightSegments: o }));
    const l = t / 2,
      u = i / 2,
      f = Math.floor(s),
      h = Math.floor(o),
      p = f + 1,
      y = h + 1,
      g = t / f,
      v = i / h,
      b = [],
      S = [],
      A = [],
      M = [];
    for (let T = 0; T < y; T++) {
      const O = T * v - u;
      for (let C = 0; C < p; C++) {
        const E = C * g - l;
        (S.push(E, -O, 0), A.push(0, 0, 1), M.push(C / f), M.push(1 - T / h));
      }
    }
    for (let T = 0; T < h; T++)
      for (let O = 0; O < f; O++) {
        const C = O + p * T,
          E = O + p * (T + 1),
          U = O + 1 + p * (T + 1),
          q = O + 1 + p * T;
        (b.push(C, E, q), b.push(E, U, q));
      }
    (this.setIndex(b),
      this.setAttribute("position", new ze(S, 3)),
      this.setAttribute("normal", new ze(A, 3)),
      this.setAttribute("uv", new ze(M, 2)));
  }
  copy(t) {
    return (super.copy(t), (this.parameters = Object.assign({}, t.parameters)), this);
  }
  static fromJSON(t) {
    return new be(t.width, t.height, t.widthSegments, t.heightSegments);
  }
}
class X1 extends e0 {
  constructor(t = 1, i = 0) {
    const s = [1, 1, 1, -1, -1, 1, -1, 1, -1, 1, -1, -1],
      o = [2, 1, 0, 0, 3, 2, 1, 3, 0, 2, 3, 1];
    (super(s, o, t, i),
      (this.type = "TetrahedronGeometry"),
      (this.parameters = { radius: t, detail: i }));
  }
  static fromJSON(t) {
    return new X1(t.radius, t.detail);
  }
}
class wr extends At {
  constructor(t = 1, i = 0.4, s = 12, o = 48, l = Math.PI * 2) {
    (super(),
      (this.type = "TorusGeometry"),
      (this.parameters = { radius: t, tube: i, radialSegments: s, tubularSegments: o, arc: l }),
      (s = Math.floor(s)),
      (o = Math.floor(o)));
    const u = [],
      f = [],
      h = [],
      p = [],
      y = new R(),
      g = new R(),
      v = new R();
    for (let b = 0; b <= s; b++)
      for (let S = 0; S <= o; S++) {
        const A = (S / o) * l,
          M = (b / s) * Math.PI * 2;
        ((g.x = (t + i * Math.cos(M)) * Math.cos(A)),
          (g.y = (t + i * Math.cos(M)) * Math.sin(A)),
          (g.z = i * Math.sin(M)),
          f.push(g.x, g.y, g.z),
          (y.x = t * Math.cos(A)),
          (y.y = t * Math.sin(A)),
          v.subVectors(g, y).normalize(),
          h.push(v.x, v.y, v.z),
          p.push(S / o),
          p.push(b / s));
      }
    for (let b = 1; b <= s; b++)
      for (let S = 1; S <= o; S++) {
        const A = (o + 1) * b + S - 1,
          M = (o + 1) * (b - 1) + S - 1,
          T = (o + 1) * (b - 1) + S,
          O = (o + 1) * b + S;
        (u.push(A, M, O), u.push(M, T, O));
      }
    (this.setIndex(u),
      this.setAttribute("position", new ze(f, 3)),
      this.setAttribute("normal", new ze(h, 3)),
      this.setAttribute("uv", new ze(p, 2)));
  }
  copy(t) {
    return (super.copy(t), (this.parameters = Object.assign({}, t.parameters)), this);
  }
  static fromJSON(t) {
    return new wr(t.radius, t.tube, t.radialSegments, t.tubularSegments, t.arc);
  }
}
class hA extends Ns {
  constructor(t) {
    (super(),
      (this.isMeshStandardMaterial = !0),
      (this.type = "MeshStandardMaterial"),
      (this.defines = { STANDARD: "" }),
      (this.color = new Mi(16777215)),
      (this.roughness = 1),
      (this.metalness = 0),
      (this.map = null),
      (this.lightMap = null),
      (this.lightMapIntensity = 1),
      (this.aoMap = null),
      (this.aoMapIntensity = 1),
      (this.emissive = new Mi(0)),
      (this.emissiveIntensity = 1),
      (this.emissiveMap = null),
      (this.bumpMap = null),
      (this.bumpScale = 1),
      (this.normalMap = null),
      (this.normalMapType = _3),
      (this.normalScale = new tt(1, 1)),
      (this.displacementMap = null),
      (this.displacementScale = 1),
      (this.displacementBias = 0),
      (this.roughnessMap = null),
      (this.metalnessMap = null),
      (this.alphaMap = null),
      (this.envMap = null),
      (this.envMapRotation = new ss()),
      (this.envMapIntensity = 1),
      (this.wireframe = !1),
      (this.wireframeLinewidth = 1),
      (this.wireframeLinecap = "round"),
      (this.wireframeLinejoin = "round"),
      (this.flatShading = !1),
      (this.fog = !0),
      this.setValues(t));
  }
  copy(t) {
    return (
      super.copy(t),
      (this.defines = { STANDARD: "" }),
      this.color.copy(t.color),
      (this.roughness = t.roughness),
      (this.metalness = t.metalness),
      (this.map = t.map),
      (this.lightMap = t.lightMap),
      (this.lightMapIntensity = t.lightMapIntensity),
      (this.aoMap = t.aoMap),
      (this.aoMapIntensity = t.aoMapIntensity),
      this.emissive.copy(t.emissive),
      (this.emissiveMap = t.emissiveMap),
      (this.emissiveIntensity = t.emissiveIntensity),
      (this.bumpMap = t.bumpMap),
      (this.bumpScale = t.bumpScale),
      (this.normalMap = t.normalMap),
      (this.normalMapType = t.normalMapType),
      this.normalScale.copy(t.normalScale),
      (this.displacementMap = t.displacementMap),
      (this.displacementScale = t.displacementScale),
      (this.displacementBias = t.displacementBias),
      (this.roughnessMap = t.roughnessMap),
      (this.metalnessMap = t.metalnessMap),
      (this.alphaMap = t.alphaMap),
      (this.envMap = t.envMap),
      this.envMapRotation.copy(t.envMapRotation),
      (this.envMapIntensity = t.envMapIntensity),
      (this.wireframe = t.wireframe),
      (this.wireframeLinewidth = t.wireframeLinewidth),
      (this.wireframeLinecap = t.wireframeLinecap),
      (this.wireframeLinejoin = t.wireframeLinejoin),
      (this.flatShading = t.flatShading),
      (this.fog = t.fog),
      this
    );
  }
}
class j4 extends hA {
  constructor(t) {
    (super(),
      (this.isMeshPhysicalMaterial = !0),
      (this.defines = { STANDARD: "", PHYSICAL: "" }),
      (this.type = "MeshPhysicalMaterial"),
      (this.anisotropyRotation = 0),
      (this.anisotropyMap = null),
      (this.clearcoatMap = null),
      (this.clearcoatRoughness = 0),
      (this.clearcoatRoughnessMap = null),
      (this.clearcoatNormalScale = new tt(1, 1)),
      (this.clearcoatNormalMap = null),
      (this.ior = 1.5),
      Object.defineProperty(this, "reflectivity", {
        get: function () {
          return bt((2.5 * (this.ior - 1)) / (this.ior + 1), 0, 1);
        },
        set: function (i) {
          this.ior = (1 + 0.4 * i) / (1 - 0.4 * i);
        },
      }),
      (this.iridescenceMap = null),
      (this.iridescenceIOR = 1.3),
      (this.iridescenceThicknessRange = [100, 400]),
      (this.iridescenceThicknessMap = null),
      (this.sheenColor = new Mi(0)),
      (this.sheenColorMap = null),
      (this.sheenRoughness = 1),
      (this.sheenRoughnessMap = null),
      (this.transmissionMap = null),
      (this.thickness = 0),
      (this.thicknessMap = null),
      (this.attenuationDistance = 1 / 0),
      (this.attenuationColor = new Mi(1, 1, 1)),
      (this.specularIntensity = 1),
      (this.specularIntensityMap = null),
      (this.specularColor = new Mi(1, 1, 1)),
      (this.specularColorMap = null),
      (this._anisotropy = 0),
      (this._clearcoat = 0),
      (this._dispersion = 0),
      (this._iridescence = 0),
      (this._sheen = 0),
      (this._transmission = 0),
      this.setValues(t));
  }
  get anisotropy() {
    return this._anisotropy;
  }
  set anisotropy(t) {
    (this._anisotropy > 0 != t > 0 && this.version++, (this._anisotropy = t));
  }
  get clearcoat() {
    return this._clearcoat;
  }
  set clearcoat(t) {
    (this._clearcoat > 0 != t > 0 && this.version++, (this._clearcoat = t));
  }
  get iridescence() {
    return this._iridescence;
  }
  set iridescence(t) {
    (this._iridescence > 0 != t > 0 && this.version++, (this._iridescence = t));
  }
  get dispersion() {
    return this._dispersion;
  }
  set dispersion(t) {
    (this._dispersion > 0 != t > 0 && this.version++, (this._dispersion = t));
  }
  get sheen() {
    return this._sheen;
  }
  set sheen(t) {
    (this._sheen > 0 != t > 0 && this.version++, (this._sheen = t));
  }
  get transmission() {
    return this._transmission;
  }
  set transmission(t) {
    (this._transmission > 0 != t > 0 && this.version++, (this._transmission = t));
  }
  copy(t) {
    return (
      super.copy(t),
      (this.defines = { STANDARD: "", PHYSICAL: "" }),
      (this.anisotropy = t.anisotropy),
      (this.anisotropyRotation = t.anisotropyRotation),
      (this.anisotropyMap = t.anisotropyMap),
      (this.clearcoat = t.clearcoat),
      (this.clearcoatMap = t.clearcoatMap),
      (this.clearcoatRoughness = t.clearcoatRoughness),
      (this.clearcoatRoughnessMap = t.clearcoatRoughnessMap),
      (this.clearcoatNormalMap = t.clearcoatNormalMap),
      this.clearcoatNormalScale.copy(t.clearcoatNormalScale),
      (this.dispersion = t.dispersion),
      (this.ior = t.ior),
      (this.iridescence = t.iridescence),
      (this.iridescenceMap = t.iridescenceMap),
      (this.iridescenceIOR = t.iridescenceIOR),
      (this.iridescenceThicknessRange = [...t.iridescenceThicknessRange]),
      (this.iridescenceThicknessMap = t.iridescenceThicknessMap),
      (this.sheen = t.sheen),
      this.sheenColor.copy(t.sheenColor),
      (this.sheenColorMap = t.sheenColorMap),
      (this.sheenRoughness = t.sheenRoughness),
      (this.sheenRoughnessMap = t.sheenRoughnessMap),
      (this.transmission = t.transmission),
      (this.transmissionMap = t.transmissionMap),
      (this.thickness = t.thickness),
      (this.thicknessMap = t.thicknessMap),
      (this.attenuationDistance = t.attenuationDistance),
      this.attenuationColor.copy(t.attenuationColor),
      (this.specularIntensity = t.specularIntensity),
      (this.specularIntensityMap = t.specularIntensityMap),
      this.specularColor.copy(t.specularColor),
      (this.specularColorMap = t.specularColorMap),
      this
    );
  }
}
class Y4 extends Ns {
  constructor(t) {
    (super(),
      (this.isMeshDepthMaterial = !0),
      (this.type = "MeshDepthMaterial"),
      (this.depthPacking = M3),
      (this.map = null),
      (this.alphaMap = null),
      (this.displacementMap = null),
      (this.displacementScale = 1),
      (this.displacementBias = 0),
      (this.wireframe = !1),
      (this.wireframeLinewidth = 1),
      this.setValues(t));
  }
  copy(t) {
    return (
      super.copy(t),
      (this.depthPacking = t.depthPacking),
      (this.map = t.map),
      (this.alphaMap = t.alphaMap),
      (this.displacementMap = t.displacementMap),
      (this.displacementScale = t.displacementScale),
      (this.displacementBias = t.displacementBias),
      (this.wireframe = t.wireframe),
      (this.wireframeLinewidth = t.wireframeLinewidth),
      this
    );
  }
}
class q4 extends Ns {
  constructor(t) {
    (super(),
      (this.isMeshDistanceMaterial = !0),
      (this.type = "MeshDistanceMaterial"),
      (this.map = null),
      (this.alphaMap = null),
      (this.displacementMap = null),
      (this.displacementScale = 1),
      (this.displacementBias = 0),
      this.setValues(t));
  }
  copy(t) {
    return (
      super.copy(t),
      (this.map = t.map),
      (this.alphaMap = t.alphaMap),
      (this.displacementMap = t.displacementMap),
      (this.displacementScale = t.displacementScale),
      (this.displacementBias = t.displacementBias),
      this
    );
  }
}
function zc(c, t) {
  return !c || c.constructor === t
    ? c
    : typeof t.BYTES_PER_ELEMENT == "number"
      ? new t(c)
      : Array.prototype.slice.call(c);
}
function fA(c) {
  return ArrayBuffer.isView(c) && !(c instanceof DataView);
}
function dA(c) {
  function t(o, l) {
    return c[o] - c[l];
  }
  const i = c.length,
    s = new Array(i);
  for (let o = 0; o !== i; ++o) s[o] = o;
  return (s.sort(t), s);
}
function xv(c, t, i) {
  const s = c.length,
    o = new c.constructor(s);
  for (let l = 0, u = 0; u !== s; ++l) {
    const f = i[l] * t;
    for (let h = 0; h !== t; ++h) o[u++] = c[f + h];
  }
  return o;
}
function I1(c, t, i, s) {
  let o = 1,
    l = c[0];
  for (; l !== void 0 && l[s] === void 0;) l = c[o++];
  if (l === void 0) return;
  let u = l[s];
  if (u !== void 0)
    if (Array.isArray(u))
      do ((u = l[s]), u !== void 0 && (t.push(l.time), i.push(...u)), (l = c[o++]));
      while (l !== void 0);
    else if (u.toArray !== void 0)
      do ((u = l[s]), u !== void 0 && (t.push(l.time), u.toArray(i, i.length)), (l = c[o++]));
      while (l !== void 0);
    else
      do ((u = l[s]), u !== void 0 && (t.push(l.time), i.push(u)), (l = c[o++]));
      while (l !== void 0);
}
class bu {
  constructor(t, i, s, o) {
    ((this.parameterPositions = t),
      (this._cachedIndex = 0),
      (this.resultBuffer = o !== void 0 ? o : new i.constructor(s)),
      (this.sampleValues = i),
      (this.valueSize = s),
      (this.settings = null),
      (this.DefaultSettings_ = {}));
  }
  evaluate(t) {
    const i = this.parameterPositions;
    let s = this._cachedIndex,
      o = i[s],
      l = i[s - 1];
    t: {
      e: {
        let u;
        i: {
          n: if (!(t < o)) {
            for (let f = s + 2; ;) {
              if (o === void 0) {
                if (t < l) break n;
                return ((s = i.length), (this._cachedIndex = s), this.copySampleValue_(s - 1));
              }
              if (s === f) break;
              if (((l = o), (o = i[++s]), t < o)) break e;
            }
            u = i.length;
            break i;
          }
          if (!(t >= l)) {
            const f = i[1];
            t < f && ((s = 2), (l = f));
            for (let h = s - 2; ;) {
              if (l === void 0) return ((this._cachedIndex = 0), this.copySampleValue_(0));
              if (s === h) break;
              if (((o = l), (l = i[--s - 1]), t >= l)) break e;
            }
            ((u = s), (s = 0));
            break i;
          }
          break t;
        }
        for (; s < u;) {
          const f = (s + u) >>> 1;
          t < i[f] ? (u = f) : (s = f + 1);
        }
        if (((o = i[s]), (l = i[s - 1]), l === void 0))
          return ((this._cachedIndex = 0), this.copySampleValue_(0));
        if (o === void 0)
          return ((s = i.length), (this._cachedIndex = s), this.copySampleValue_(s - 1));
      }
      ((this._cachedIndex = s), this.intervalChanged_(s, l, o));
    }
    return this.interpolate_(s, l, t, o);
  }
  getSettings_() {
    return this.settings || this.DefaultSettings_;
  }
  copySampleValue_(t) {
    const i = this.resultBuffer,
      s = this.sampleValues,
      o = this.valueSize,
      l = t * o;
    for (let u = 0; u !== o; ++u) i[u] = s[l + u];
    return i;
  }
  interpolate_() {
    throw new Error("call to abstract method");
  }
  intervalChanged_() {}
}
class pA extends bu {
  constructor(t, i, s, o) {
    (super(t, i, s, o),
      (this._weightPrev = -0),
      (this._offsetPrev = -0),
      (this._weightNext = -0),
      (this._offsetNext = -0),
      (this.DefaultSettings_ = { endingStart: Cg, endingEnd: Cg }));
  }
  intervalChanged_(t, i, s) {
    const o = this.parameterPositions;
    let l = t - 2,
      u = t + 1,
      f = o[l],
      h = o[u];
    if (f === void 0)
      switch (this.getSettings_().endingStart) {
        case Og:
          ((l = t), (f = 2 * i - s));
          break;
        case Bg:
          ((l = o.length - 2), (f = i + o[l] - o[l + 1]));
          break;
        default:
          ((l = t), (f = s));
      }
    if (h === void 0)
      switch (this.getSettings_().endingEnd) {
        case Og:
          ((u = t), (h = 2 * s - i));
          break;
        case Bg:
          ((u = 1), (h = s + o[1] - o[0]));
          break;
        default:
          ((u = t - 1), (h = i));
      }
    const p = (s - i) * 0.5,
      y = this.valueSize;
    ((this._weightPrev = p / (i - f)),
      (this._weightNext = p / (h - s)),
      (this._offsetPrev = l * y),
      (this._offsetNext = u * y));
  }
  interpolate_(t, i, s, o) {
    const l = this.resultBuffer,
      u = this.sampleValues,
      f = this.valueSize,
      h = t * f,
      p = h - f,
      y = this._offsetPrev,
      g = this._offsetNext,
      v = this._weightPrev,
      b = this._weightNext,
      S = (s - i) / (o - i),
      A = S * S,
      M = A * S,
      T = -v * M + 2 * v * A - v * S,
      O = (1 + v) * M + (-1.5 - 2 * v) * A + (-0.5 + v) * S + 1,
      C = (-1 - b) * M + (1.5 + b) * A + 0.5 * S,
      E = b * M - b * A;
    for (let U = 0; U !== f; ++U) l[U] = T * u[y + U] + O * u[p + U] + C * u[h + U] + E * u[g + U];
    return l;
  }
}
class mA extends bu {
  constructor(t, i, s, o) {
    super(t, i, s, o);
  }
  interpolate_(t, i, s, o) {
    const l = this.resultBuffer,
      u = this.sampleValues,
      f = this.valueSize,
      h = t * f,
      p = h - f,
      y = (s - i) / (o - i),
      g = 1 - y;
    for (let v = 0; v !== f; ++v) l[v] = u[p + v] * g + u[h + v] * y;
    return l;
  }
}
class yA extends bu {
  constructor(t, i, s, o) {
    super(t, i, s, o);
  }
  interpolate_(t) {
    return this.copySampleValue_(t - 1);
  }
}
class Ui {
  constructor(t, i, s, o) {
    if (t === void 0) throw new Error("THREE.KeyframeTrack: track name is undefined");
    if (i === void 0 || i.length === 0)
      throw new Error("THREE.KeyframeTrack: no keyframes in track named " + t);
    ((this.name = t),
      (this.times = zc(i, this.TimeBufferType)),
      (this.values = zc(s, this.ValueBufferType)),
      this.setInterpolation(o || this.DefaultInterpolation));
  }
  static toJSON(t) {
    const i = t.constructor;
    let s;
    if (i.toJSON !== this.toJSON) s = i.toJSON(t);
    else {
      s = { name: t.name, times: zc(t.times, Array), values: zc(t.values, Array) };
      const o = t.getInterpolation();
      o !== t.DefaultInterpolation && (s.interpolation = o);
    }
    return ((s.type = t.ValueTypeName), s);
  }
  InterpolantFactoryMethodDiscrete(t) {
    return new yA(this.times, this.values, this.getValueSize(), t);
  }
  InterpolantFactoryMethodLinear(t) {
    return new mA(this.times, this.values, this.getValueSize(), t);
  }
  InterpolantFactoryMethodSmooth(t) {
    return new pA(this.times, this.values, this.getValueSize(), t);
  }
  setInterpolation(t) {
    let i;
    switch (t) {
      case iu:
        i = this.InterpolantFactoryMethodDiscrete;
        break;
      case Nd:
        i = this.InterpolantFactoryMethodLinear;
        break;
      case If:
        i = this.InterpolantFactoryMethodSmooth;
        break;
    }
    if (i === void 0) {
      const s =
        "unsupported interpolation for " +
        this.ValueTypeName +
        " keyframe track named " +
        this.name;
      if (this.createInterpolant === void 0)
        if (t !== this.DefaultInterpolation) this.setInterpolation(this.DefaultInterpolation);
        else throw new Error(s);
      return (console.warn("THREE.KeyframeTrack:", s), this);
    }
    return ((this.createInterpolant = i), this);
  }
  getInterpolation() {
    switch (this.createInterpolant) {
      case this.InterpolantFactoryMethodDiscrete:
        return iu;
      case this.InterpolantFactoryMethodLinear:
        return Nd;
      case this.InterpolantFactoryMethodSmooth:
        return If;
    }
  }
  getValueSize() {
    return this.values.length / this.times.length;
  }
  shift(t) {
    if (t !== 0) {
      const i = this.times;
      for (let s = 0, o = i.length; s !== o; ++s) i[s] += t;
    }
    return this;
  }
  scale(t) {
    if (t !== 1) {
      const i = this.times;
      for (let s = 0, o = i.length; s !== o; ++s) i[s] *= t;
    }
    return this;
  }
  trim(t, i) {
    const s = this.times,
      o = s.length;
    let l = 0,
      u = o - 1;
    for (; l !== o && s[l] < t;) ++l;
    for (; u !== -1 && s[u] > i;) --u;
    if ((++u, l !== 0 || u !== o)) {
      l >= u && ((u = Math.max(u, 1)), (l = u - 1));
      const f = this.getValueSize();
      ((this.times = s.slice(l, u)), (this.values = this.values.slice(l * f, u * f)));
    }
    return this;
  }
  validate() {
    let t = !0;
    const i = this.getValueSize();
    i - Math.floor(i) !== 0 &&
      (console.error("THREE.KeyframeTrack: Invalid value size in track.", this), (t = !1));
    const s = this.times,
      o = this.values,
      l = s.length;
    l === 0 && (console.error("THREE.KeyframeTrack: Track is empty.", this), (t = !1));
    let u = null;
    for (let f = 0; f !== l; f++) {
      const h = s[f];
      if (typeof h == "number" && isNaN(h)) {
        (console.error("THREE.KeyframeTrack: Time is not a valid number.", this, f, h), (t = !1));
        break;
      }
      if (u !== null && u > h) {
        (console.error("THREE.KeyframeTrack: Out of order keys.", this, f, h, u), (t = !1));
        break;
      }
      u = h;
    }
    if (o !== void 0 && fA(o))
      for (let f = 0, h = o.length; f !== h; ++f) {
        const p = o[f];
        if (isNaN(p)) {
          (console.error("THREE.KeyframeTrack: Value is not a valid number.", this, f, p),
            (t = !1));
          break;
        }
      }
    return t;
  }
  optimize() {
    const t = this.times.slice(),
      i = this.values.slice(),
      s = this.getValueSize(),
      o = this.getInterpolation() === If,
      l = t.length - 1;
    let u = 1;
    for (let f = 1; f < l; ++f) {
      let h = !1;
      const p = t[f],
        y = t[f + 1];
      if (p !== y && (f !== 1 || p !== t[0]))
        if (o) h = !0;
        else {
          const g = f * s,
            v = g - s,
            b = g + s;
          for (let S = 0; S !== s; ++S) {
            const A = i[g + S];
            if (A !== i[v + S] || A !== i[b + S]) {
              h = !0;
              break;
            }
          }
        }
      if (h) {
        if (f !== u) {
          t[u] = t[f];
          const g = f * s,
            v = u * s;
          for (let b = 0; b !== s; ++b) i[v + b] = i[g + b];
        }
        ++u;
      }
    }
    if (l > 0) {
      t[u] = t[l];
      for (let f = l * s, h = u * s, p = 0; p !== s; ++p) i[h + p] = i[f + p];
      ++u;
    }
    return (
      u !== t.length
        ? ((this.times = t.slice(0, u)), (this.values = i.slice(0, u * s)))
        : ((this.times = t), (this.values = i)),
      this
    );
  }
  clone() {
    const t = this.times.slice(),
      i = this.values.slice(),
      s = this.constructor,
      o = new s(this.name, t, i);
    return ((o.createInterpolant = this.createInterpolant), o);
  }
}
Ui.prototype.ValueTypeName = "";
Ui.prototype.TimeBufferType = Float32Array;
Ui.prototype.ValueBufferType = Float32Array;
Ui.prototype.DefaultInterpolation = Nd;
class Wa extends Ui {
  constructor(t, i, s) {
    super(t, i, s);
  }
}
Wa.prototype.ValueTypeName = "bool";
Wa.prototype.ValueBufferType = Array;
Wa.prototype.DefaultInterpolation = iu;
Wa.prototype.InterpolantFactoryMethodLinear = void 0;
Wa.prototype.InterpolantFactoryMethodSmooth = void 0;
class Z1 extends Ui {
  constructor(t, i, s, o) {
    super(t, i, s, o);
  }
}
Z1.prototype.ValueTypeName = "color";
class ru extends Ui {
  constructor(t, i, s, o) {
    super(t, i, s, o);
  }
}
ru.prototype.ValueTypeName = "number";
class gA extends bu {
  constructor(t, i, s, o) {
    super(t, i, s, o);
  }
  interpolate_(t, i, s, o) {
    const l = this.resultBuffer,
      u = this.sampleValues,
      f = this.valueSize,
      h = (s - i) / (o - i);
    let p = t * f;
    for (let y = p + f; p !== y; p += 4) Pa.slerpFlat(l, 0, u, p - f, u, p, h);
    return l;
  }
}
class xu extends Ui {
  constructor(t, i, s, o) {
    super(t, i, s, o);
  }
  InterpolantFactoryMethodLinear(t) {
    return new gA(this.times, this.values, this.getValueSize(), t);
  }
}
xu.prototype.ValueTypeName = "quaternion";
xu.prototype.InterpolantFactoryMethodSmooth = void 0;
class Ja extends Ui {
  constructor(t, i, s) {
    super(t, i, s);
  }
}
Ja.prototype.ValueTypeName = "string";
Ja.prototype.ValueBufferType = Array;
Ja.prototype.DefaultInterpolation = iu;
Ja.prototype.InterpolantFactoryMethodLinear = void 0;
Ja.prototype.InterpolantFactoryMethodSmooth = void 0;
class lu extends Ui {
  constructor(t, i, s, o) {
    super(t, i, s, o);
  }
}
lu.prototype.ValueTypeName = "vector";
class X4 {
  constructor(t = "", i = -1, s = [], o = A3) {
    ((this.name = t),
      (this.tracks = s),
      (this.duration = i),
      (this.blendMode = o),
      (this.uuid = Ai()),
      (this.userData = {}),
      this.duration < 0 && this.resetDuration());
  }
  static parse(t) {
    const i = [],
      s = t.tracks,
      o = 1 / (t.fps || 1);
    for (let u = 0, f = s.length; u !== f; ++u) i.push(bA(s[u]).scale(o));
    const l = new this(t.name, t.duration, i, t.blendMode);
    return ((l.uuid = t.uuid), (l.userData = JSON.parse(t.userData || "{}")), l);
  }
  static toJSON(t) {
    const i = [],
      s = t.tracks,
      o = {
        name: t.name,
        duration: t.duration,
        tracks: i,
        uuid: t.uuid,
        blendMode: t.blendMode,
        userData: JSON.stringify(t.userData),
      };
    for (let l = 0, u = s.length; l !== u; ++l) i.push(Ui.toJSON(s[l]));
    return o;
  }
  static CreateFromMorphTargetSequence(t, i, s, o) {
    const l = i.length,
      u = [];
    for (let f = 0; f < l; f++) {
      let h = [],
        p = [];
      (h.push((f + l - 1) % l, f, (f + 1) % l), p.push(0, 1, 0));
      const y = dA(h);
      ((h = xv(h, 1, y)),
        (p = xv(p, 1, y)),
        !o && h[0] === 0 && (h.push(l), p.push(p[0])),
        u.push(new ru(".morphTargetInfluences[" + i[f].name + "]", h, p).scale(1 / s)));
    }
    return new this(t, -1, u);
  }
  static findByName(t, i) {
    let s = t;
    if (!Array.isArray(t)) {
      const o = t;
      s = (o.geometry && o.geometry.animations) || o.animations;
    }
    for (let o = 0; o < s.length; o++) if (s[o].name === i) return s[o];
    return null;
  }
  static CreateClipsFromMorphTargetSequences(t, i, s) {
    const o = {},
      l = /^([\w-]*?)([\d]+)$/;
    for (let f = 0, h = t.length; f < h; f++) {
      const p = t[f],
        y = p.name.match(l);
      if (y && y.length > 1) {
        const g = y[1];
        let v = o[g];
        (v || (o[g] = v = []), v.push(p));
      }
    }
    const u = [];
    for (const f in o) u.push(this.CreateFromMorphTargetSequence(f, o[f], i, s));
    return u;
  }
  static parseAnimation(t, i) {
    if (
      (console.warn(
        "THREE.AnimationClip: parseAnimation() is deprecated and will be removed with r185",
      ),
      !t)
    )
      return (console.error("THREE.AnimationClip: No animation in JSONLoader data."), null);
    const s = function (g, v, b, S, A) {
        if (b.length !== 0) {
          const M = [],
            T = [];
          (I1(b, M, T, S), M.length !== 0 && A.push(new g(v, M, T)));
        }
      },
      o = [],
      l = t.name || "default",
      u = t.fps || 30,
      f = t.blendMode;
    let h = t.length || -1;
    const p = t.hierarchy || [];
    for (let g = 0; g < p.length; g++) {
      const v = p[g].keys;
      if (!(!v || v.length === 0))
        if (v[0].morphTargets) {
          const b = {};
          let S;
          for (S = 0; S < v.length; S++)
            if (v[S].morphTargets)
              for (let A = 0; A < v[S].morphTargets.length; A++) b[v[S].morphTargets[A]] = -1;
          for (const A in b) {
            const M = [],
              T = [];
            for (let O = 0; O !== v[S].morphTargets.length; ++O) {
              const C = v[S];
              (M.push(C.time), T.push(C.morphTarget === A ? 1 : 0));
            }
            o.push(new ru(".morphTargetInfluence[" + A + "]", M, T));
          }
          h = b.length * u;
        } else {
          const b = ".bones[" + i[g].name + "]";
          (s(lu, b + ".position", v, "pos", o),
            s(xu, b + ".quaternion", v, "rot", o),
            s(lu, b + ".scale", v, "scl", o));
        }
    }
    return o.length === 0 ? null : new this(l, h, o, f);
  }
  resetDuration() {
    const t = this.tracks;
    let i = 0;
    for (let s = 0, o = t.length; s !== o; ++s) {
      const l = this.tracks[s];
      i = Math.max(i, l.times[l.times.length - 1]);
    }
    return ((this.duration = i), this);
  }
  trim() {
    for (let t = 0; t < this.tracks.length; t++) this.tracks[t].trim(0, this.duration);
    return this;
  }
  validate() {
    let t = !0;
    for (let i = 0; i < this.tracks.length; i++) t = t && this.tracks[i].validate();
    return t;
  }
  optimize() {
    for (let t = 0; t < this.tracks.length; t++) this.tracks[t].optimize();
    return this;
  }
  clone() {
    const t = [];
    for (let s = 0; s < this.tracks.length; s++) t.push(this.tracks[s].clone());
    const i = new this.constructor(this.name, this.duration, t, this.blendMode);
    return ((i.userData = JSON.parse(JSON.stringify(this.userData))), i);
  }
  toJSON() {
    return this.constructor.toJSON(this);
  }
}
function vA(c) {
  switch (c.toLowerCase()) {
    case "scalar":
    case "double":
    case "float":
    case "number":
    case "integer":
      return ru;
    case "vector":
    case "vector2":
    case "vector3":
    case "vector4":
      return lu;
    case "color":
      return Z1;
    case "quaternion":
      return xu;
    case "bool":
    case "boolean":
      return Wa;
    case "string":
      return Ja;
  }
  throw new Error("THREE.KeyframeTrack: Unsupported typeName: " + c);
}
function bA(c) {
  if (c.type === void 0)
    throw new Error("THREE.KeyframeTrack: track type undefined, can not parse");
  const t = vA(c.type);
  if (c.times === void 0) {
    const i = [],
      s = [];
    (I1(c.keys, i, s, "value"), (c.times = i), (c.values = s));
  }
  return t.parse !== void 0 ? t.parse(c) : new t(c.name, c.times, c.values, c.interpolation);
}
const vn = {
  enabled: !1,
  files: {},
  add: function (c, t) {
    this.enabled !== !1 && (this.files[c] = t);
  },
  get: function (c) {
    if (this.enabled !== !1) return this.files[c];
  },
  remove: function (c) {
    delete this.files[c];
  },
  clear: function () {
    this.files = {};
  },
};
class xA {
  constructor(t, i, s) {
    const o = this;
    let l = !1,
      u = 0,
      f = 0,
      h;
    const p = [];
    ((this.onStart = void 0),
      (this.onLoad = t),
      (this.onProgress = i),
      (this.onError = s),
      (this.abortController = new AbortController()),
      (this.itemStart = function (y) {
        (f++, l === !1 && o.onStart !== void 0 && o.onStart(y, u, f), (l = !0));
      }),
      (this.itemEnd = function (y) {
        (u++,
          o.onProgress !== void 0 && o.onProgress(y, u, f),
          u === f && ((l = !1), o.onLoad !== void 0 && o.onLoad()));
      }),
      (this.itemError = function (y) {
        o.onError !== void 0 && o.onError(y);
      }),
      (this.resolveURL = function (y) {
        return h ? h(y) : y;
      }),
      (this.setURLModifier = function (y) {
        return ((h = y), this);
      }),
      (this.addHandler = function (y, g) {
        return (p.push(y, g), this);
      }),
      (this.removeHandler = function (y) {
        const g = p.indexOf(y);
        return (g !== -1 && p.splice(g, 2), this);
      }),
      (this.getHandler = function (y) {
        for (let g = 0, v = p.length; g < v; g += 2) {
          const b = p[g],
            S = p[g + 1];
          if ((b.global && (b.lastIndex = 0), b.test(y))) return S;
        }
        return null;
      }),
      (this.abort = function () {
        return (this.abortController.abort(), (this.abortController = new AbortController()), this);
      }));
  }
}
const SA = new xA();
class Br {
  constructor(t) {
    ((this.manager = t !== void 0 ? t : SA),
      (this.crossOrigin = "anonymous"),
      (this.withCredentials = !1),
      (this.path = ""),
      (this.resourcePath = ""),
      (this.requestHeader = {}));
  }
  load() {}
  loadAsync(t, i) {
    const s = this;
    return new Promise(function (o, l) {
      s.load(t, o, i, l);
    });
  }
  parse() {}
  setCrossOrigin(t) {
    return ((this.crossOrigin = t), this);
  }
  setWithCredentials(t) {
    return ((this.withCredentials = t), this);
  }
  setPath(t) {
    return ((this.path = t), this);
  }
  setResourcePath(t) {
    return ((this.resourcePath = t), this);
  }
  setRequestHeader(t) {
    return ((this.requestHeader = t), this);
  }
  abort() {
    return this;
  }
}
Br.DEFAULT_MATERIAL_NAME = "__DEFAULT";
const mn = {};
class wA extends Error {
  constructor(t, i) {
    (super(t), (this.response = i));
  }
}
class I4 extends Br {
  constructor(t) {
    (super(t),
      (this.mimeType = ""),
      (this.responseType = ""),
      (this._abortController = new AbortController()));
  }
  load(t, i, s, o) {
    (t === void 0 && (t = ""),
      this.path !== void 0 && (t = this.path + t),
      (t = this.manager.resolveURL(t)));
    const l = vn.get(`file:${t}`);
    if (l !== void 0)
      return (
        this.manager.itemStart(t),
        setTimeout(() => {
          (i && i(l), this.manager.itemEnd(t));
        }, 0),
        l
      );
    if (mn[t] !== void 0) {
      mn[t].push({ onLoad: i, onProgress: s, onError: o });
      return;
    }
    ((mn[t] = []), mn[t].push({ onLoad: i, onProgress: s, onError: o }));
    const u = new Request(t, {
        headers: new Headers(this.requestHeader),
        credentials: this.withCredentials ? "include" : "same-origin",
        signal:
          typeof AbortSignal.any == "function"
            ? AbortSignal.any([this._abortController.signal, this.manager.abortController.signal])
            : this._abortController.signal,
      }),
      f = this.mimeType,
      h = this.responseType;
    (fetch(u)
      .then((p) => {
        if (p.status === 200 || p.status === 0) {
          if (
            (p.status === 0 && console.warn("THREE.FileLoader: HTTP Status 0 received."),
            typeof ReadableStream > "u" || p.body === void 0 || p.body.getReader === void 0)
          )
            return p;
          const y = mn[t],
            g = p.body.getReader(),
            v = p.headers.get("X-File-Size") || p.headers.get("Content-Length"),
            b = v ? parseInt(v) : 0,
            S = b !== 0;
          let A = 0;
          const M = new ReadableStream({
            start(T) {
              O();
              function O() {
                g.read().then(
                  ({ done: C, value: E }) => {
                    if (C) T.close();
                    else {
                      A += E.byteLength;
                      const U = new ProgressEvent("progress", {
                        lengthComputable: S,
                        loaded: A,
                        total: b,
                      });
                      for (let q = 0, X = y.length; q < X; q++) {
                        const G = y[q];
                        G.onProgress && G.onProgress(U);
                      }
                      (T.enqueue(E), O());
                    }
                  },
                  (C) => {
                    T.error(C);
                  },
                );
              }
            },
          });
          return new Response(M);
        } else throw new wA(`fetch for "${p.url}" responded with ${p.status}: ${p.statusText}`, p);
      })
      .then((p) => {
        switch (h) {
          case "arraybuffer":
            return p.arrayBuffer();
          case "blob":
            return p.blob();
          case "document":
            return p.text().then((y) => new DOMParser().parseFromString(y, f));
          case "json":
            return p.json();
          default:
            if (f === "") return p.text();
            {
              const g = /charset="?([^;"\s]*)"?/i.exec(f),
                v = g && g[1] ? g[1].toLowerCase() : void 0,
                b = new TextDecoder(v);
              return p.arrayBuffer().then((S) => b.decode(S));
            }
        }
      })
      .then((p) => {
        vn.add(`file:${t}`, p);
        const y = mn[t];
        delete mn[t];
        for (let g = 0, v = y.length; g < v; g++) {
          const b = y[g];
          b.onLoad && b.onLoad(p);
        }
      })
      .catch((p) => {
        const y = mn[t];
        if (y === void 0) throw (this.manager.itemError(t), p);
        delete mn[t];
        for (let g = 0, v = y.length; g < v; g++) {
          const b = y[g];
          b.onError && b.onError(p);
        }
        this.manager.itemError(t);
      })
      .finally(() => {
        this.manager.itemEnd(t);
      }),
      this.manager.itemStart(t));
  }
  setResponseType(t) {
    return ((this.responseType = t), this);
  }
  setMimeType(t) {
    return ((this.mimeType = t), this);
  }
  abort() {
    return (this._abortController.abort(), (this._abortController = new AbortController()), this);
  }
}
const Fa = new WeakMap();
class AA extends Br {
  constructor(t) {
    super(t);
  }
  load(t, i, s, o) {
    (this.path !== void 0 && (t = this.path + t), (t = this.manager.resolveURL(t)));
    const l = this,
      u = vn.get(`image:${t}`);
    if (u !== void 0) {
      if (u.complete === !0)
        (l.manager.itemStart(t),
          setTimeout(function () {
            (i && i(u), l.manager.itemEnd(t));
          }, 0));
      else {
        let g = Fa.get(u);
        (g === void 0 && ((g = []), Fa.set(u, g)), g.push({ onLoad: i, onError: o }));
      }
      return u;
    }
    const f = su("img");
    function h() {
      (y(), i && i(this));
      const g = Fa.get(this) || [];
      for (let v = 0; v < g.length; v++) {
        const b = g[v];
        b.onLoad && b.onLoad(this);
      }
      (Fa.delete(this), l.manager.itemEnd(t));
    }
    function p(g) {
      (y(), o && o(g), vn.remove(`image:${t}`));
      const v = Fa.get(this) || [];
      for (let b = 0; b < v.length; b++) {
        const S = v[b];
        S.onError && S.onError(g);
      }
      (Fa.delete(this), l.manager.itemError(t), l.manager.itemEnd(t));
    }
    function y() {
      (f.removeEventListener("load", h, !1), f.removeEventListener("error", p, !1));
    }
    return (
      f.addEventListener("load", h, !1),
      f.addEventListener("error", p, !1),
      t.slice(0, 5) !== "data:" &&
        this.crossOrigin !== void 0 &&
        (f.crossOrigin = this.crossOrigin),
      vn.add(`image:${t}`, f),
      l.manager.itemStart(t),
      (f.src = t),
      f
    );
  }
}
class Z4 extends Br {
  constructor(t) {
    super(t);
  }
  load(t, i, s, o) {
    const l = new Ue(),
      u = new AA(this.manager);
    return (
      u.setCrossOrigin(this.crossOrigin),
      u.setPath(this.path),
      u.load(
        t,
        function (f) {
          ((l.image = f), (l.needsUpdate = !0), i !== void 0 && i(l));
        },
        s,
        o,
      ),
      l
    );
  }
}
class Su extends le {
  constructor(t, i = 1) {
    (super(),
      (this.isLight = !0),
      (this.type = "Light"),
      (this.color = new Mi(t)),
      (this.intensity = i));
  }
  dispose() {}
  copy(t, i) {
    return (super.copy(t, i), this.color.copy(t.color), (this.intensity = t.intensity), this);
  }
  toJSON(t) {
    const i = super.toJSON(t);
    return (
      (i.object.color = this.color.getHex()),
      (i.object.intensity = this.intensity),
      this.groundColor !== void 0 && (i.object.groundColor = this.groundColor.getHex()),
      this.distance !== void 0 && (i.object.distance = this.distance),
      this.angle !== void 0 && (i.object.angle = this.angle),
      this.decay !== void 0 && (i.object.decay = this.decay),
      this.penumbra !== void 0 && (i.object.penumbra = this.penumbra),
      this.shadow !== void 0 && (i.object.shadow = this.shadow.toJSON()),
      this.target !== void 0 && (i.object.target = this.target.uuid),
      i
    );
  }
}
const Sd = new Ct(),
  Sv = new R(),
  wv = new R();
class s0 {
  constructor(t) {
    ((this.camera = t),
      (this.intensity = 1),
      (this.bias = 0),
      (this.normalBias = 0),
      (this.radius = 1),
      (this.blurSamples = 8),
      (this.mapSize = new tt(512, 512)),
      (this.mapType = Jd),
      (this.map = null),
      (this.mapPass = null),
      (this.matrix = new Ct()),
      (this.autoUpdate = !0),
      (this.needsUpdate = !1),
      (this._frustum = new Ew()),
      (this._frameExtents = new tt(1, 1)),
      (this._viewportCount = 1),
      (this._viewports = [new Te(0, 0, 1, 1)]));
  }
  getViewportCount() {
    return this._viewportCount;
  }
  getFrustum() {
    return this._frustum;
  }
  updateMatrices(t) {
    const i = this.camera,
      s = this.matrix;
    (Sv.setFromMatrixPosition(t.matrixWorld),
      i.position.copy(Sv),
      wv.setFromMatrixPosition(t.target.matrixWorld),
      i.lookAt(wv),
      i.updateMatrixWorld(),
      Sd.multiplyMatrices(i.projectionMatrix, i.matrixWorldInverse),
      this._frustum.setFromProjectionMatrix(Sd, i.coordinateSystem, i.reversedDepth),
      i.reversedDepth
        ? s.set(0.5, 0, 0, 0.5, 0, 0.5, 0, 0.5, 0, 0, 1, 0, 0, 0, 0, 1)
        : s.set(0.5, 0, 0, 0.5, 0, 0.5, 0, 0.5, 0, 0, 0.5, 0.5, 0, 0, 0, 1),
      s.multiply(Sd));
  }
  getViewport(t) {
    return this._viewports[t];
  }
  getFrameExtents() {
    return this._frameExtents;
  }
  dispose() {
    (this.map && this.map.dispose(), this.mapPass && this.mapPass.dispose());
  }
  copy(t) {
    return (
      (this.camera = t.camera.clone()),
      (this.intensity = t.intensity),
      (this.bias = t.bias),
      (this.radius = t.radius),
      (this.autoUpdate = t.autoUpdate),
      (this.needsUpdate = t.needsUpdate),
      (this.normalBias = t.normalBias),
      (this.blurSamples = t.blurSamples),
      this.mapSize.copy(t.mapSize),
      this
    );
  }
  clone() {
    return new this.constructor().copy(this);
  }
  toJSON() {
    const t = {};
    return (
      this.intensity !== 1 && (t.intensity = this.intensity),
      this.bias !== 0 && (t.bias = this.bias),
      this.normalBias !== 0 && (t.normalBias = this.normalBias),
      this.radius !== 1 && (t.radius = this.radius),
      (this.mapSize.x !== 512 || this.mapSize.y !== 512) && (t.mapSize = this.mapSize.toArray()),
      (t.camera = this.camera.toJSON(!1).object),
      delete t.camera.matrix,
      t
    );
  }
}
class MA extends s0 {
  constructor() {
    (super(new yn(50, 1, 0.5, 500)),
      (this.isSpotLightShadow = !0),
      (this.focus = 1),
      (this.aspect = 1));
  }
  updateMatrices(t) {
    const i = this.camera,
      s = vr * 2 * t.angle * this.focus,
      o = (this.mapSize.width / this.mapSize.height) * this.aspect,
      l = t.distance || i.far;
    ((s !== i.fov || o !== i.aspect || l !== i.far) &&
      ((i.fov = s), (i.aspect = o), (i.far = l), i.updateProjectionMatrix()),
      super.updateMatrices(t));
  }
  copy(t) {
    return (super.copy(t), (this.focus = t.focus), this);
  }
}
class P4 extends Su {
  constructor(t, i, s = 0, o = Math.PI / 3, l = 0, u = 2) {
    (super(t, i),
      (this.isSpotLight = !0),
      (this.type = "SpotLight"),
      this.position.copy(le.DEFAULT_UP),
      this.updateMatrix(),
      (this.target = new le()),
      (this.distance = s),
      (this.angle = o),
      (this.penumbra = l),
      (this.decay = u),
      (this.map = null),
      (this.shadow = new MA()));
  }
  get power() {
    return this.intensity * Math.PI;
  }
  set power(t) {
    this.intensity = t / Math.PI;
  }
  dispose() {
    this.shadow.dispose();
  }
  copy(t, i) {
    return (
      super.copy(t, i),
      (this.distance = t.distance),
      (this.angle = t.angle),
      (this.penumbra = t.penumbra),
      (this.decay = t.decay),
      (this.target = t.target.clone()),
      (this.shadow = t.shadow.clone()),
      this
    );
  }
}
const Av = new Ct(),
  er = new R(),
  wd = new R();
class _A extends s0 {
  constructor() {
    (super(new yn(90, 1, 0.5, 500)),
      (this.isPointLightShadow = !0),
      (this._frameExtents = new tt(4, 2)),
      (this._viewportCount = 6),
      (this._viewports = [
        new Te(2, 1, 1, 1),
        new Te(0, 1, 1, 1),
        new Te(3, 1, 1, 1),
        new Te(1, 1, 1, 1),
        new Te(3, 0, 1, 1),
        new Te(1, 0, 1, 1),
      ]),
      (this._cubeDirections = [
        new R(1, 0, 0),
        new R(-1, 0, 0),
        new R(0, 0, 1),
        new R(0, 0, -1),
        new R(0, 1, 0),
        new R(0, -1, 0),
      ]),
      (this._cubeUps = [
        new R(0, 1, 0),
        new R(0, 1, 0),
        new R(0, 1, 0),
        new R(0, 1, 0),
        new R(0, 0, 1),
        new R(0, 0, -1),
      ]));
  }
  updateMatrices(t, i = 0) {
    const s = this.camera,
      o = this.matrix,
      l = t.distance || s.far;
    (l !== s.far && ((s.far = l), s.updateProjectionMatrix()),
      er.setFromMatrixPosition(t.matrixWorld),
      s.position.copy(er),
      wd.copy(s.position),
      wd.add(this._cubeDirections[i]),
      s.up.copy(this._cubeUps[i]),
      s.lookAt(wd),
      s.updateMatrixWorld(),
      o.makeTranslation(-er.x, -er.y, -er.z),
      Av.multiplyMatrices(s.projectionMatrix, s.matrixWorldInverse),
      this._frustum.setFromProjectionMatrix(Av, s.coordinateSystem, s.reversedDepth));
  }
}
class W4 extends Su {
  constructor(t, i, s = 0, o = 2) {
    (super(t, i),
      (this.isPointLight = !0),
      (this.type = "PointLight"),
      (this.distance = s),
      (this.decay = o),
      (this.shadow = new _A()));
  }
  get power() {
    return this.intensity * 4 * Math.PI;
  }
  set power(t) {
    this.intensity = t / (4 * Math.PI);
  }
  dispose() {
    this.shadow.dispose();
  }
  copy(t, i) {
    return (
      super.copy(t, i),
      (this.distance = t.distance),
      (this.decay = t.decay),
      (this.shadow = t.shadow.clone()),
      this
    );
  }
}
class TA extends C1 {
  constructor(t = -1, i = 1, s = 1, o = -1, l = 0.1, u = 2e3) {
    (super(),
      (this.isOrthographicCamera = !0),
      (this.type = "OrthographicCamera"),
      (this.zoom = 1),
      (this.view = null),
      (this.left = t),
      (this.right = i),
      (this.top = s),
      (this.bottom = o),
      (this.near = l),
      (this.far = u),
      this.updateProjectionMatrix());
  }
  copy(t, i) {
    return (
      super.copy(t, i),
      (this.left = t.left),
      (this.right = t.right),
      (this.top = t.top),
      (this.bottom = t.bottom),
      (this.near = t.near),
      (this.far = t.far),
      (this.zoom = t.zoom),
      (this.view = t.view === null ? null : Object.assign({}, t.view)),
      this
    );
  }
  setViewOffset(t, i, s, o, l, u) {
    (this.view === null &&
      (this.view = {
        enabled: !0,
        fullWidth: 1,
        fullHeight: 1,
        offsetX: 0,
        offsetY: 0,
        width: 1,
        height: 1,
      }),
      (this.view.enabled = !0),
      (this.view.fullWidth = t),
      (this.view.fullHeight = i),
      (this.view.offsetX = s),
      (this.view.offsetY = o),
      (this.view.width = l),
      (this.view.height = u),
      this.updateProjectionMatrix());
  }
  clearViewOffset() {
    (this.view !== null && (this.view.enabled = !1), this.updateProjectionMatrix());
  }
  updateProjectionMatrix() {
    const t = (this.right - this.left) / (2 * this.zoom),
      i = (this.top - this.bottom) / (2 * this.zoom),
      s = (this.right + this.left) / 2,
      o = (this.top + this.bottom) / 2;
    let l = s - t,
      u = s + t,
      f = o + i,
      h = o - i;
    if (this.view !== null && this.view.enabled) {
      const p = (this.right - this.left) / this.view.fullWidth / this.zoom,
        y = (this.top - this.bottom) / this.view.fullHeight / this.zoom;
      ((l += p * this.view.offsetX),
        (u = l + p * this.view.width),
        (f -= y * this.view.offsetY),
        (h = f - y * this.view.height));
    }
    (this.projectionMatrix.makeOrthographic(
      l,
      u,
      f,
      h,
      this.near,
      this.far,
      this.coordinateSystem,
      this.reversedDepth,
    ),
      this.projectionMatrixInverse.copy(this.projectionMatrix).invert());
  }
  toJSON(t) {
    const i = super.toJSON(t);
    return (
      (i.object.zoom = this.zoom),
      (i.object.left = this.left),
      (i.object.right = this.right),
      (i.object.top = this.top),
      (i.object.bottom = this.bottom),
      (i.object.near = this.near),
      (i.object.far = this.far),
      this.view !== null && (i.object.view = Object.assign({}, this.view)),
      i
    );
  }
}
class zA extends s0 {
  constructor() {
    (super(new TA(-5, 5, 5, -5, 0.5, 500)), (this.isDirectionalLightShadow = !0));
  }
}
class J4 extends Su {
  constructor(t, i) {
    (super(t, i),
      (this.isDirectionalLight = !0),
      (this.type = "DirectionalLight"),
      this.position.copy(le.DEFAULT_UP),
      this.updateMatrix(),
      (this.target = new le()),
      (this.shadow = new zA()));
  }
  dispose() {
    this.shadow.dispose();
  }
  copy(t) {
    return (
      super.copy(t),
      (this.target = t.target.clone()),
      (this.shadow = t.shadow.clone()),
      this
    );
  }
}
class Q4 extends Su {
  constructor(t, i) {
    (super(t, i), (this.isAmbientLight = !0), (this.type = "AmbientLight"));
  }
}
class K4 {
  static extractUrlBase(t) {
    const i = t.lastIndexOf("/");
    return i === -1 ? "./" : t.slice(0, i + 1);
  }
  static resolveURL(t, i) {
    return typeof t != "string" || t === ""
      ? ""
      : (/^https?:\/\//i.test(i) &&
          /^\//.test(t) &&
          (i = i.replace(/(^https?:\/\/[^\/]+).*/i, "$1")),
        /^(https?:)?\/\//i.test(t) || /^data:.*,.*$/i.test(t) || /^blob:.*$/i.test(t) ? t : i + t);
  }
}
class P1 extends At {
  constructor() {
    (super(),
      (this.isInstancedBufferGeometry = !0),
      (this.type = "InstancedBufferGeometry"),
      (this.instanceCount = 1 / 0));
  }
  copy(t) {
    return (super.copy(t), (this.instanceCount = t.instanceCount), this);
  }
  toJSON() {
    const t = super.toJSON();
    return ((t.instanceCount = this.instanceCount), (t.isInstancedBufferGeometry = !0), t);
  }
}
const Ad = new WeakMap();
class $4 extends Br {
  constructor(t) {
    (super(t),
      (this.isImageBitmapLoader = !0),
      typeof createImageBitmap > "u" &&
        console.warn("THREE.ImageBitmapLoader: createImageBitmap() not supported."),
      typeof fetch > "u" && console.warn("THREE.ImageBitmapLoader: fetch() not supported."),
      (this.options = { premultiplyAlpha: "none" }),
      (this._abortController = new AbortController()));
  }
  setOptions(t) {
    return ((this.options = t), this);
  }
  load(t, i, s, o) {
    (t === void 0 && (t = ""),
      this.path !== void 0 && (t = this.path + t),
      (t = this.manager.resolveURL(t)));
    const l = this,
      u = vn.get(`image-bitmap:${t}`);
    if (u !== void 0) {
      if ((l.manager.itemStart(t), u.then)) {
        u.then((p) => {
          if (Ad.has(u) === !0) (o && o(Ad.get(u)), l.manager.itemError(t), l.manager.itemEnd(t));
          else return (i && i(p), l.manager.itemEnd(t), p);
        });
        return;
      }
      return (
        setTimeout(function () {
          (i && i(u), l.manager.itemEnd(t));
        }, 0),
        u
      );
    }
    const f = {};
    ((f.credentials = this.crossOrigin === "anonymous" ? "same-origin" : "include"),
      (f.headers = this.requestHeader),
      (f.signal =
        typeof AbortSignal.any == "function"
          ? AbortSignal.any([this._abortController.signal, this.manager.abortController.signal])
          : this._abortController.signal));
    const h = fetch(t, f)
      .then(function (p) {
        return p.blob();
      })
      .then(function (p) {
        return createImageBitmap(p, Object.assign(l.options, { colorSpaceConversion: "none" }));
      })
      .then(function (p) {
        return (vn.add(`image-bitmap:${t}`, p), i && i(p), l.manager.itemEnd(t), p);
      })
      .catch(function (p) {
        (o && o(p),
          Ad.set(h, p),
          vn.remove(`image-bitmap:${t}`),
          l.manager.itemError(t),
          l.manager.itemEnd(t));
      });
    (vn.add(`image-bitmap:${t}`, h), l.manager.itemStart(t));
  }
  abort() {
    return (this._abortController.abort(), (this._abortController = new AbortController()), this);
  }
}
class tE extends yn {
  constructor(t = []) {
    (super(), (this.isArrayCamera = !0), (this.isMultiViewCamera = !1), (this.cameras = t));
  }
}
class eE {
  constructor(t = !0) {
    ((this.autoStart = t),
      (this.startTime = 0),
      (this.oldTime = 0),
      (this.elapsedTime = 0),
      (this.running = !1));
  }
  start() {
    ((this.startTime = performance.now()),
      (this.oldTime = this.startTime),
      (this.elapsedTime = 0),
      (this.running = !0));
  }
  stop() {
    (this.getElapsedTime(), (this.running = !1), (this.autoStart = !1));
  }
  getElapsedTime() {
    return (this.getDelta(), this.elapsedTime);
  }
  getDelta() {
    let t = 0;
    if (this.autoStart && !this.running) return (this.start(), 0);
    if (this.running) {
      const i = performance.now();
      ((t = (i - this.oldTime) / 1e3), (this.oldTime = i), (this.elapsedTime += t));
    }
    return t;
  }
}
const a0 = "\\[\\]\\.:\\/",
  EA = new RegExp("[" + a0 + "]", "g"),
  o0 = "[^" + a0 + "]",
  RA = "[^" + a0.replace("\\.", "") + "]",
  CA = /((?:WC+[\/:])*)/.source.replace("WC", o0),
  OA = /(WCOD+)?/.source.replace("WCOD", RA),
  BA = /(?:\.(WC+)(?:\[(.+)\])?)?/.source.replace("WC", o0),
  DA = /\.(WC+)(?:\[(.+)\])?/.source.replace("WC", o0),
  NA = new RegExp("^" + CA + OA + BA + DA + "$"),
  UA = ["material", "materials", "bones", "map"];
class FA {
  constructor(t, i, s) {
    const o = s || Yt.parseTrackName(i);
    ((this._targetGroup = t), (this._bindings = t.subscribe_(i, o)));
  }
  getValue(t, i) {
    this.bind();
    const s = this._targetGroup.nCachedObjects_,
      o = this._bindings[s];
    o !== void 0 && o.getValue(t, i);
  }
  setValue(t, i) {
    const s = this._bindings;
    for (let o = this._targetGroup.nCachedObjects_, l = s.length; o !== l; ++o) s[o].setValue(t, i);
  }
  bind() {
    const t = this._bindings;
    for (let i = this._targetGroup.nCachedObjects_, s = t.length; i !== s; ++i) t[i].bind();
  }
  unbind() {
    const t = this._bindings;
    for (let i = this._targetGroup.nCachedObjects_, s = t.length; i !== s; ++i) t[i].unbind();
  }
}
class Yt {
  constructor(t, i, s) {
    ((this.path = i),
      (this.parsedPath = s || Yt.parseTrackName(i)),
      (this.node = Yt.findNode(t, this.parsedPath.nodeName)),
      (this.rootNode = t),
      (this.getValue = this._getValue_unbound),
      (this.setValue = this._setValue_unbound));
  }
  static create(t, i, s) {
    return t && t.isAnimationObjectGroup ? new Yt.Composite(t, i, s) : new Yt(t, i, s);
  }
  static sanitizeNodeName(t) {
    return t.replace(/\s/g, "_").replace(EA, "");
  }
  static parseTrackName(t) {
    const i = NA.exec(t);
    if (i === null) throw new Error("PropertyBinding: Cannot parse trackName: " + t);
    const s = {
        nodeName: i[2],
        objectName: i[3],
        objectIndex: i[4],
        propertyName: i[5],
        propertyIndex: i[6],
      },
      o = s.nodeName && s.nodeName.lastIndexOf(".");
    if (o !== void 0 && o !== -1) {
      const l = s.nodeName.substring(o + 1);
      UA.indexOf(l) !== -1 && ((s.nodeName = s.nodeName.substring(0, o)), (s.objectName = l));
    }
    if (s.propertyName === null || s.propertyName.length === 0)
      throw new Error("PropertyBinding: can not parse propertyName from trackName: " + t);
    return s;
  }
  static findNode(t, i) {
    if (i === void 0 || i === "" || i === "." || i === -1 || i === t.name || i === t.uuid) return t;
    if (t.skeleton) {
      const s = t.skeleton.getBoneByName(i);
      if (s !== void 0) return s;
    }
    if (t.children) {
      const s = function (l) {
          for (let u = 0; u < l.length; u++) {
            const f = l[u];
            if (f.name === i || f.uuid === i) return f;
            const h = s(f.children);
            if (h) return h;
          }
          return null;
        },
        o = s(t.children);
      if (o) return o;
    }
    return null;
  }
  _getValue_unavailable() {}
  _setValue_unavailable() {}
  _getValue_direct(t, i) {
    t[i] = this.targetObject[this.propertyName];
  }
  _getValue_array(t, i) {
    const s = this.resolvedProperty;
    for (let o = 0, l = s.length; o !== l; ++o) t[i++] = s[o];
  }
  _getValue_arrayElement(t, i) {
    t[i] = this.resolvedProperty[this.propertyIndex];
  }
  _getValue_toArray(t, i) {
    this.resolvedProperty.toArray(t, i);
  }
  _setValue_direct(t, i) {
    this.targetObject[this.propertyName] = t[i];
  }
  _setValue_direct_setNeedsUpdate(t, i) {
    ((this.targetObject[this.propertyName] = t[i]), (this.targetObject.needsUpdate = !0));
  }
  _setValue_direct_setMatrixWorldNeedsUpdate(t, i) {
    ((this.targetObject[this.propertyName] = t[i]),
      (this.targetObject.matrixWorldNeedsUpdate = !0));
  }
  _setValue_array(t, i) {
    const s = this.resolvedProperty;
    for (let o = 0, l = s.length; o !== l; ++o) s[o] = t[i++];
  }
  _setValue_array_setNeedsUpdate(t, i) {
    const s = this.resolvedProperty;
    for (let o = 0, l = s.length; o !== l; ++o) s[o] = t[i++];
    this.targetObject.needsUpdate = !0;
  }
  _setValue_array_setMatrixWorldNeedsUpdate(t, i) {
    const s = this.resolvedProperty;
    for (let o = 0, l = s.length; o !== l; ++o) s[o] = t[i++];
    this.targetObject.matrixWorldNeedsUpdate = !0;
  }
  _setValue_arrayElement(t, i) {
    this.resolvedProperty[this.propertyIndex] = t[i];
  }
  _setValue_arrayElement_setNeedsUpdate(t, i) {
    ((this.resolvedProperty[this.propertyIndex] = t[i]), (this.targetObject.needsUpdate = !0));
  }
  _setValue_arrayElement_setMatrixWorldNeedsUpdate(t, i) {
    ((this.resolvedProperty[this.propertyIndex] = t[i]),
      (this.targetObject.matrixWorldNeedsUpdate = !0));
  }
  _setValue_fromArray(t, i) {
    this.resolvedProperty.fromArray(t, i);
  }
  _setValue_fromArray_setNeedsUpdate(t, i) {
    (this.resolvedProperty.fromArray(t, i), (this.targetObject.needsUpdate = !0));
  }
  _setValue_fromArray_setMatrixWorldNeedsUpdate(t, i) {
    (this.resolvedProperty.fromArray(t, i), (this.targetObject.matrixWorldNeedsUpdate = !0));
  }
  _getValue_unbound(t, i) {
    (this.bind(), this.getValue(t, i));
  }
  _setValue_unbound(t, i) {
    (this.bind(), this.setValue(t, i));
  }
  bind() {
    let t = this.node;
    const i = this.parsedPath,
      s = i.objectName,
      o = i.propertyName;
    let l = i.propertyIndex;
    if (
      (t || ((t = Yt.findNode(this.rootNode, i.nodeName)), (this.node = t)),
      (this.getValue = this._getValue_unavailable),
      (this.setValue = this._setValue_unavailable),
      !t)
    ) {
      console.warn("THREE.PropertyBinding: No target node found for track: " + this.path + ".");
      return;
    }
    if (s) {
      let p = i.objectIndex;
      switch (s) {
        case "materials":
          if (!t.material) {
            console.error(
              "THREE.PropertyBinding: Can not bind to material as node does not have a material.",
              this,
            );
            return;
          }
          if (!t.material.materials) {
            console.error(
              "THREE.PropertyBinding: Can not bind to material.materials as node.material does not have a materials array.",
              this,
            );
            return;
          }
          t = t.material.materials;
          break;
        case "bones":
          if (!t.skeleton) {
            console.error(
              "THREE.PropertyBinding: Can not bind to bones as node does not have a skeleton.",
              this,
            );
            return;
          }
          t = t.skeleton.bones;
          for (let y = 0; y < t.length; y++)
            if (t[y].name === p) {
              p = y;
              break;
            }
          break;
        case "map":
          if ("map" in t) {
            t = t.map;
            break;
          }
          if (!t.material) {
            console.error(
              "THREE.PropertyBinding: Can not bind to material as node does not have a material.",
              this,
            );
            return;
          }
          if (!t.material.map) {
            console.error(
              "THREE.PropertyBinding: Can not bind to material.map as node.material does not have a map.",
              this,
            );
            return;
          }
          t = t.material.map;
          break;
        default:
          if (t[s] === void 0) {
            console.error(
              "THREE.PropertyBinding: Can not bind to objectName of node undefined.",
              this,
            );
            return;
          }
          t = t[s];
      }
      if (p !== void 0) {
        if (t[p] === void 0) {
          console.error(
            "THREE.PropertyBinding: Trying to bind to objectIndex of objectName, but is undefined.",
            this,
            t,
          );
          return;
        }
        t = t[p];
      }
    }
    const u = t[o];
    if (u === void 0) {
      const p = i.nodeName;
      console.error(
        "THREE.PropertyBinding: Trying to update property for track: " +
          p +
          "." +
          o +
          " but it wasn't found.",
        t,
      );
      return;
    }
    let f = this.Versioning.None;
    ((this.targetObject = t),
      t.isMaterial === !0
        ? (f = this.Versioning.NeedsUpdate)
        : t.isObject3D === !0 && (f = this.Versioning.MatrixWorldNeedsUpdate));
    let h = this.BindingType.Direct;
    if (l !== void 0) {
      if (o === "morphTargetInfluences") {
        if (!t.geometry) {
          console.error(
            "THREE.PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.",
            this,
          );
          return;
        }
        if (!t.geometry.morphAttributes) {
          console.error(
            "THREE.PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.morphAttributes.",
            this,
          );
          return;
        }
        t.morphTargetDictionary[l] !== void 0 && (l = t.morphTargetDictionary[l]);
      }
      ((h = this.BindingType.ArrayElement), (this.resolvedProperty = u), (this.propertyIndex = l));
    } else
      u.fromArray !== void 0 && u.toArray !== void 0
        ? ((h = this.BindingType.HasFromToArray), (this.resolvedProperty = u))
        : Array.isArray(u)
          ? ((h = this.BindingType.EntireArray), (this.resolvedProperty = u))
          : (this.propertyName = o);
    ((this.getValue = this.GetterByBindingType[h]),
      (this.setValue = this.SetterByBindingTypeAndVersioning[h][f]));
  }
  unbind() {
    ((this.node = null),
      (this.getValue = this._getValue_unbound),
      (this.setValue = this._setValue_unbound));
  }
}
Yt.Composite = FA;
Yt.prototype.BindingType = { Direct: 0, EntireArray: 1, ArrayElement: 2, HasFromToArray: 3 };
Yt.prototype.Versioning = { None: 0, NeedsUpdate: 1, MatrixWorldNeedsUpdate: 2 };
Yt.prototype.GetterByBindingType = [
  Yt.prototype._getValue_direct,
  Yt.prototype._getValue_array,
  Yt.prototype._getValue_arrayElement,
  Yt.prototype._getValue_toArray,
];
Yt.prototype.SetterByBindingTypeAndVersioning = [
  [
    Yt.prototype._setValue_direct,
    Yt.prototype._setValue_direct_setNeedsUpdate,
    Yt.prototype._setValue_direct_setMatrixWorldNeedsUpdate,
  ],
  [
    Yt.prototype._setValue_array,
    Yt.prototype._setValue_array_setNeedsUpdate,
    Yt.prototype._setValue_array_setMatrixWorldNeedsUpdate,
  ],
  [
    Yt.prototype._setValue_arrayElement,
    Yt.prototype._setValue_arrayElement_setNeedsUpdate,
    Yt.prototype._setValue_arrayElement_setMatrixWorldNeedsUpdate,
  ],
  [
    Yt.prototype._setValue_fromArray,
    Yt.prototype._setValue_fromArray_setNeedsUpdate,
    Yt.prototype._setValue_fromArray_setMatrixWorldNeedsUpdate,
  ],
];
function iE(c, t, i, s) {
  const o = LA(s);
  switch (i) {
    case kS:
      return c * t;
    case z1:
      return ((c * t) / o.components) * o.byteLength;
    case GS:
      return ((c * t) / o.components) * o.byteLength;
    case jS:
      return ((c * t * 2) / o.components) * o.byteLength;
    case YS:
      return ((c * t * 2) / o.components) * o.byteLength;
    case HS:
      return ((c * t * 3) / o.components) * o.byteLength;
    case Qd:
      return ((c * t * 4) / o.components) * o.byteLength;
    case qS:
      return ((c * t * 4) / o.components) * o.byteLength;
    case XS:
    case IS:
      return Math.floor((c + 3) / 4) * Math.floor((t + 3) / 4) * 8;
    case ZS:
    case PS:
      return Math.floor((c + 3) / 4) * Math.floor((t + 3) / 4) * 16;
    case JS:
    case KS:
      return (Math.max(c, 16) * Math.max(t, 8)) / 4;
    case WS:
    case QS:
      return (Math.max(c, 8) * Math.max(t, 8)) / 2;
    case $S:
    case t3:
      return Math.floor((c + 3) / 4) * Math.floor((t + 3) / 4) * 8;
    case e3:
      return Math.floor((c + 3) / 4) * Math.floor((t + 3) / 4) * 16;
    case i3:
      return Math.floor((c + 3) / 4) * Math.floor((t + 3) / 4) * 16;
    case n3:
      return Math.floor((c + 4) / 5) * Math.floor((t + 3) / 4) * 16;
    case s3:
      return Math.floor((c + 4) / 5) * Math.floor((t + 4) / 5) * 16;
    case a3:
      return Math.floor((c + 5) / 6) * Math.floor((t + 4) / 5) * 16;
    case o3:
      return Math.floor((c + 5) / 6) * Math.floor((t + 5) / 6) * 16;
    case r3:
      return Math.floor((c + 7) / 8) * Math.floor((t + 4) / 5) * 16;
    case l3:
      return Math.floor((c + 7) / 8) * Math.floor((t + 5) / 6) * 16;
    case c3:
      return Math.floor((c + 7) / 8) * Math.floor((t + 7) / 8) * 16;
    case u3:
      return Math.floor((c + 9) / 10) * Math.floor((t + 4) / 5) * 16;
    case h3:
      return Math.floor((c + 9) / 10) * Math.floor((t + 5) / 6) * 16;
    case f3:
      return Math.floor((c + 9) / 10) * Math.floor((t + 7) / 8) * 16;
    case d3:
      return Math.floor((c + 9) / 10) * Math.floor((t + 9) / 10) * 16;
    case p3:
      return Math.floor((c + 11) / 12) * Math.floor((t + 9) / 10) * 16;
    case m3:
      return Math.floor((c + 11) / 12) * Math.floor((t + 11) / 12) * 16;
    case y3:
    case g3:
    case v3:
      return Math.ceil(c / 4) * Math.ceil(t / 4) * 16;
    case b3:
    case x3:
      return Math.ceil(c / 4) * Math.ceil(t / 4) * 8;
    case S3:
    case w3:
      return Math.ceil(c / 4) * Math.ceil(t / 4) * 16;
  }
  throw new Error(`Unable to determine texture byte length for ${i} format.`);
}
function LA(c) {
  switch (c) {
    case Jd:
    case RS:
      return { byteLength: 1, components: 1 };
    case OS:
    case CS:
    case DS:
      return { byteLength: 2, components: 1 };
    case NS:
    case US:
      return { byteLength: 2, components: 4 };
    case T1:
    case BS:
    case yu:
      return { byteLength: 4, components: 1 };
    case FS:
    case LS:
      return { byteLength: 4, components: 3 };
  }
  throw new Error(`Unknown texture type ${c}.`);
}
typeof __THREE_DEVTOOLS__ < "u" &&
  __THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register", { detail: { revision: w1 } }));
typeof window < "u" &&
  (window.__THREE__
    ? console.warn("WARNING: Multiple instances of Three.js being imported.")
    : (window.__THREE__ = w1));
const Gi = 256,
  kA = `
  attribute float aBornAt;
  attribute float aLifespan;
  attribute vec3 aVelocity;
  attribute float aSize;
  attribute float aSeed;
  uniform float time;
  uniform float baseSize;
  varying float vAlpha;
  varying float vSeed;

  void main() {
    float age = time - aBornAt;
    float life = aLifespan;
    float t = age / life;

    if (aBornAt < 0.0 || t < 0.0 || t > 1.0) {
      vAlpha = 0.0;
      gl_Position = vec4(0.0, 0.0, -10000.0, 1.0);
      gl_PointSize = 0.0;
      return;
    }

    vec3 pos = position + aVelocity * age;
    // Gentle wobble
    pos.x += sin(time * 1.3 + aSeed * 6.28) * 0.05;
    pos.y += sin(time * 0.9 + aSeed * 11.0) * 0.04;

    // Fade in fast, fade out gentle
    float fadeIn = smoothstep(0.0, 0.1, t);
    float fadeOut = 1.0 - smoothstep(0.55, 1.0, t);
    vAlpha = fadeIn * fadeOut;
    vSeed = aSeed;

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = aSize * baseSize * 320.0 / -mv.z;
    gl_Position = projectionMatrix * mv;
  }
`,
  HA = `
  uniform vec3 color;
  varying float vAlpha;
  varying float vSeed;

  void main() {
    if (vAlpha <= 0.001) discard;
    vec2 d = gl_PointCoord - 0.5;
    float r = length(d);
    if (r > 0.5) discard;
    float core = exp(-r * r * 32.0);
    float halo = exp(-r * r * 8.0) * 0.55;
    // Tiny twinkle in core
    float twinkle = 0.85 + 0.15 * sin(vSeed * 33.0);
    vec3 c = color * (core * 1.3 + halo * 0.7) * twinkle;
    gl_FragColor = vec4(c, (core + halo) * vAlpha);
  }
`;
class Bs {
  id;
  object;
  done = !1;
  geometry;
  material;
  uniforms;
  position;
  velocity;
  bornAt;
  lifespanAttr;
  sizeAttr;
  seed;
  posBuf;
  velBuf;
  bornBuf;
  lifeBuf;
  sizeBuf;
  seedBuf;
  mode;
  size;
  lifespan;
  color;
  spawnArea;
  driftY;
  jitterXY;
  anchorYOffset;
  rng;
  spawnAccumulator = 0;
  anchor = null;
  constructor(t) {
    ((this.id = t.id),
      (this.mode = t.mode),
      (this.size = t.size),
      (this.lifespan = t.lifespan),
      (this.color = t.color),
      (this.spawnArea = t.spawnArea),
      (this.driftY = t.driftY),
      (this.jitterXY = t.jitterXY),
      (this.anchorYOffset = t.anchorYOffset ?? 0),
      (this.rng = t.rng ?? Math.random),
      (this.position = new Float32Array(Gi * 3)),
      (this.velocity = new Float32Array(Gi * 3)),
      (this.bornAt = new Float32Array(Gi)),
      (this.lifespanAttr = new Float32Array(Gi)),
      (this.sizeAttr = new Float32Array(Gi)),
      (this.seed = new Float32Array(Gi)));
    for (let i = 0; i < Gi; i++) ((this.bornAt[i] = -1), (this.seed[i] = this.rng()));
    ((this.geometry = new At()),
      (this.posBuf = new H(this.position, 3)),
      (this.velBuf = new H(this.velocity, 3)),
      (this.bornBuf = new H(this.bornAt, 1)),
      (this.lifeBuf = new H(this.lifespanAttr, 1)),
      (this.sizeBuf = new H(this.sizeAttr, 1)),
      (this.seedBuf = new H(this.seed, 1)),
      this.posBuf.setUsage(oi),
      this.velBuf.setUsage(oi),
      this.bornBuf.setUsage(oi),
      this.lifeBuf.setUsage(oi),
      this.sizeBuf.setUsage(oi),
      this.geometry.setAttribute("position", this.posBuf),
      this.geometry.setAttribute("aVelocity", this.velBuf),
      this.geometry.setAttribute("aBornAt", this.bornBuf),
      this.geometry.setAttribute("aLifespan", this.lifeBuf),
      this.geometry.setAttribute("aSize", this.sizeBuf),
      this.geometry.setAttribute("aSeed", this.seedBuf),
      (this.uniforms = {
        time: { value: 0 },
        color: { value: new R(this.color.r, this.color.g, this.color.b) },
        baseSize: { value: this.size },
      }),
      (this.material = new dt({
        uniforms: this.uniforms,
        vertexShader: kA,
        fragmentShader: HA,
        transparent: !0,
        depthWrite: !1,
        blending: Rt,
      })),
      (this.object = new ne(this.geometry, this.material)),
      (this.object.frustumCulled = !1),
      (this.object.renderOrder = 4));
  }
  setConfig(t) {
    (t.spawnRate !== void 0 &&
      this.mode.kind === "ambient" &&
      (this.mode = { kind: "ambient", spawnRate: t.spawnRate }),
      t.size !== void 0 && ((this.size = t.size), (this.uniforms.baseSize.value = this.size)),
      t.lifespan !== void 0 && (this.lifespan = t.lifespan),
      t.color !== void 0 &&
        ((this.color = t.color),
        this.uniforms.color.value.set(this.color.r, this.color.g, this.color.b)),
      t.spawnArea !== void 0 && (this.spawnArea = t.spawnArea),
      t.driftY !== void 0 && (this.driftY = t.driftY),
      t.jitterXY !== void 0 && (this.jitterXY = t.jitterXY),
      t.anchorYOffset !== void 0 && (this.anchorYOffset = t.anchorYOffset));
  }
  update(t, i, s) {
    if (((this.anchor = s), (this.uniforms.time.value = t), this.mode.kind === "ambient"))
      for (this.spawnAccumulator += this.mode.spawnRate * i; this.spawnAccumulator >= 1;)
        (this.spawn(t), (this.spawnAccumulator -= 1));
    else {
      if (this.spawnAccumulator < 0.5) {
        for (let l = 0; l < this.mode.count && l < Gi; l++) this.spawn(t);
        this.spawnAccumulator = 1;
      }
      let o = !1;
      for (let l = 0; l < Gi; l++)
        if (this.bornAt[l] >= 0 && t - this.bornAt[l] < this.lifespanAttr[l]) {
          o = !0;
          break;
        }
      o || (this.done = !0);
    }
  }
  spawn(t) {
    if (!this.anchor) return;
    let i = -1,
      s = -1;
    for (let g = 0; g < Gi; g++) {
      const v = this.bornAt[g];
      if (v < 0) {
        i = g;
        break;
      }
      const b = t - v;
      b > s && ((s = b), (i = g));
    }
    if (i < 0) return;
    const o = this.anchor,
      l = (o.size.x * this.spawnArea.x) / 2,
      u = (o.size.y * this.spawnArea.y) / 2,
      f = this.spawnArea.z / 2,
      h = o.position.x + (this.rng() * 2 - 1) * l,
      p = o.position.y + this.anchorYOffset + (this.rng() * 2 - 1) * u,
      y = o.position.z + (this.rng() * 2 - 1) * f;
    ((this.position[i * 3] = h),
      (this.position[i * 3 + 1] = p),
      (this.position[i * 3 + 2] = y),
      (this.velocity[i * 3] = (this.rng() * 2 - 1) * this.jitterXY),
      (this.velocity[i * 3 + 1] = this.driftY + (this.rng() * 0.4 - 0.2) * this.jitterXY),
      (this.velocity[i * 3 + 2] = (this.rng() * 2 - 1) * this.jitterXY * 0.5),
      (this.bornAt[i] = t),
      (this.lifespanAttr[i] = this.lifespan * (0.7 + this.rng() * 0.6)),
      (this.sizeAttr[i] = 0.4 + this.rng() * 0.8),
      (this.seed[i] = this.rng()),
      (this.posBuf.needsUpdate = !0),
      (this.velBuf.needsUpdate = !0),
      (this.bornBuf.needsUpdate = !0),
      (this.lifeBuf.needsUpdate = !0),
      (this.sizeBuf.needsUpdate = !0),
      (this.seedBuf.needsUpdate = !0));
  }
  dispose() {
    (this.geometry.dispose(), this.material.dispose());
  }
}
const VA = `
  varying vec2 vUv;
  varying vec3 vWorldNormal;
  void main() {
    vUv = uv;
    vWorldNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`,
  GA = `
  uniform vec3 color;
  uniform float opacity;
  uniform float intensity;
  varying vec2 vUv;
  varying vec3 vWorldNormal;

  void main() {
    float y = vUv.y - 0.5;
    float core = exp(-y * y * 80.0);
    float halo = exp(-y * y * 10.0) * 0.3;
    float profile = core + halo;

    float rim = pow(1.0 - abs(vWorldNormal.z), 1.5) * 0.3;

    float a = clamp((profile + rim) * opacity * intensity, 0.0, 1.0);
    gl_FragColor = vec4(color, a);
  }
`;
class Za {
  id;
  object;
  done = !1;
  mesh;
  geometry;
  material;
  uniforms;
  radius;
  thickness;
  tilt;
  rotationSpeed;
  opacity;
  color;
  anchorYOffset;
  lifespan;
  riseFromY;
  riseToY;
  elapsed = 0;
  constructor(t) {
    ((this.id = t.id),
      (this.radius = t.radius),
      (this.thickness = t.thickness),
      (this.tilt = t.tilt),
      (this.rotationSpeed = t.rotationSpeed),
      (this.opacity = t.opacity),
      (this.color = t.color),
      (this.anchorYOffset = t.anchorYOffset ?? 0),
      (this.lifespan = t.lifespan ?? null),
      (this.riseFromY = t.riseFromY ?? null),
      (this.riseToY = t.riseToY ?? null),
      (this.geometry = new wr(this.radius, this.thickness, 16, 96)),
      (this.uniforms = {
        color: { value: new R(this.color.r, this.color.g, this.color.b) },
        opacity: { value: this.opacity },
        intensity: { value: 1 },
      }),
      (this.material = new dt({
        uniforms: this.uniforms,
        vertexShader: VA,
        fragmentShader: GA,
        transparent: !0,
        depthWrite: !1,
        blending: Rt,
        side: Ne,
      })),
      (this.mesh = new $t(this.geometry, this.material)),
      (this.mesh.rotation.x = Math.PI / 2 + this.tilt),
      (this.object = new ve()),
      this.object.add(this.mesh),
      (this.object.renderOrder = 4));
  }
  setConfig(t) {
    (((t.radius !== void 0 && t.radius !== this.radius) ||
      (t.thickness !== void 0 && t.thickness !== this.thickness)) &&
      ((this.radius = t.radius ?? this.radius),
      (this.thickness = t.thickness ?? this.thickness),
      this.geometry.dispose(),
      (this.geometry = new wr(this.radius, this.thickness, 16, 96)),
      (this.mesh.geometry = this.geometry)),
      t.tilt !== void 0 && ((this.tilt = t.tilt), (this.mesh.rotation.x = Math.PI / 2 + this.tilt)),
      t.rotationSpeed !== void 0 && (this.rotationSpeed = t.rotationSpeed),
      t.opacity !== void 0 &&
        ((this.opacity = t.opacity), (this.uniforms.opacity.value = this.opacity)),
      t.color !== void 0 &&
        ((this.color = t.color),
        this.uniforms.color.value.set(this.color.r, this.color.g, this.color.b)),
      t.anchorYOffset !== void 0 && (this.anchorYOffset = t.anchorYOffset));
  }
  update(t, i, s) {
    this.elapsed += i;
    const o =
      this.lifespan !== null && this.riseFromY !== null && this.riseToY !== null
        ? this.riseFromY +
          (this.riseToY - this.riseFromY) * Math.min(1, this.elapsed / this.lifespan)
        : this.anchorYOffset;
    if (
      (this.object.position.set(s.position.x, s.position.y + o, s.position.z),
      this.rotationSpeed !== 0 && (this.mesh.rotation.z += this.rotationSpeed * i),
      this.lifespan !== null)
    ) {
      const l = this.elapsed / this.lifespan;
      if (l >= 1) {
        ((this.done = !0), (this.uniforms.intensity.value = 0));
        return;
      }
      let u;
      (l < 0.15 ? (u = l / 0.15) : l < 0.7 ? (u = 1) : (u = 1 - (l - 0.7) / 0.3),
        (this.uniforms.intensity.value = u));
    } else this.uniforms.intensity.value = 1;
  }
  dispose() {
    (this.geometry.dispose(), this.material.dispose());
  }
}
const Oi = 256,
  Mv = [
    [
      [0, 0],
      [1, 0],
      [2, 0],
      [3, 0],
    ],
    [
      [0, 0],
      [1, 0],
      [0, 1],
      [1, 1],
    ],
    [
      [0, 0],
      [1, 0],
      [2, 0],
      [1, 1],
    ],
    [
      [1, 0],
      [2, 0],
      [0, 1],
      [1, 1],
    ],
    [
      [0, 0],
      [1, 0],
      [1, 1],
      [2, 1],
    ],
    [
      [0, 0],
      [0, 1],
      [0, 2],
      [1, 2],
    ],
    [
      [1, 0],
      [1, 1],
      [0, 2],
      [1, 2],
    ],
  ],
  jA = `
  attribute vec3 aOffset;
  attribute float aSize;
  attribute float aHollow;
  attribute float aBornAt;
  attribute float aLifespan;
  attribute float aSeed;

  uniform float time;

  varying vec2 vUv;
  varying float vAlpha;
  varying float vHollow;
  varying float vSeed;

  void main() {
    float age = time - aBornAt;
    float t = age / aLifespan;

    if (aBornAt < 0.0 || t < 0.0 || t > 1.0) {
      vAlpha = 0.0;
      gl_Position = vec4(0.0, 0.0, -10000.0, 1.0);
      return;
    }

    vec3 pos = position * aSize + aOffset;
    vUv = uv;

    // Glitch: occasional jitter on x or full mute frames
    float glitchRand = fract(sin(aSeed * 12.9898 + floor(time * 12.0)) * 43758.5453);
    float jitter = (glitchRand - 0.5) * 0.06 * step(0.92, glitchRand);
    pos.x += jitter;

    // Quick fade-in + linger + fade-out envelope
    float fadeIn = smoothstep(0.0, 0.08, t);
    float fadeOut = 1.0 - smoothstep(0.6, 1.0, t);
    vAlpha = fadeIn * fadeOut;

    vHollow = aHollow;
    vSeed = aSeed;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`,
  YA = `
  uniform vec3 color;
  uniform float glitchAmount;
  uniform float time;
  varying vec2 vUv;
  varying float vAlpha;
  varying float vHollow;
  varying float vSeed;

  void main() {
    if (vAlpha <= 0.001) discard;

    // Border thickness (in UV)
    float border = 0.18;
    float onEdge = step(vUv.x, border) + step(1.0 - vUv.x, border)
                 + step(vUv.y, border) + step(1.0 - vUv.y, border);
    onEdge = clamp(onEdge, 0.0, 1.0);

    // Hollow tiles show only the edge; filled tiles show edge + soft fill
    float fillMask = mix(1.0, onEdge, vHollow);

    // Random per-tile flicker (controlled by glitchAmount)
    float flickerSeed = floor(time * 14.0) + vSeed * 7.0;
    float flicker = fract(sin(flickerSeed) * 43758.5453);
    float flickerMute = step(1.0 - glitchAmount * 0.4, flicker);
    fillMask *= 1.0 - flickerMute;

    if (fillMask <= 0.001) discard;

    // Edge a bit brighter than the soft fill, but stay on the same hue —
    // no white accent, no extra brightness multiplier.
    vec3 col = color * mix(0.55, 1.0, onEdge);
    gl_FragColor = vec4(col, vAlpha * fillMask);
  }
`;
class r0 {
  id;
  object;
  done = !1;
  geometry;
  material;
  uniforms;
  offsetAttr;
  sizeAttrBuf;
  hollowAttr;
  bornAttr;
  lifeAttr;
  seedAttr;
  offsetData;
  sizeData;
  hollowData;
  bornData;
  lifeData;
  seedData;
  mode;
  size;
  hollowRatio;
  glitchAmount;
  color;
  spawnArea;
  lifespan;
  anchorYOffset;
  rng;
  clusterAccumulator = 0;
  burstSpawned = !1;
  anchor = null;
  constructor(t) {
    ((this.id = t.id),
      (this.mode = t.mode),
      (this.size = t.size),
      (this.hollowRatio = t.hollowRatio),
      (this.glitchAmount = t.glitchAmount),
      (this.color = t.color),
      (this.spawnArea = t.spawnArea),
      (this.lifespan = t.lifespan),
      (this.anchorYOffset = t.anchorYOffset ?? 0),
      (this.rng = t.rng ?? Math.random),
      (this.geometry = new be(1, 1)),
      (this.uniforms = {
        time: { value: 0 },
        color: { value: new R(this.color.r, this.color.g, this.color.b) },
        glitchAmount: { value: this.glitchAmount },
      }),
      (this.material = new dt({
        uniforms: this.uniforms,
        vertexShader: jA,
        fragmentShader: YA,
        transparent: !0,
        depthWrite: !1,
        blending: Rt,
        side: Ne,
      })),
      (this.object = new Mw(this.geometry, this.material, Oi)),
      (this.object.frustumCulled = !1),
      (this.object.renderOrder = 4));
    const i = new Ct();
    for (let s = 0; s < Oi; s++) this.object.setMatrixAt(s, i);
    ((this.object.instanceMatrix.needsUpdate = !0),
      (this.offsetData = new Float32Array(Oi * 3)),
      (this.sizeData = new Float32Array(Oi)),
      (this.hollowData = new Float32Array(Oi)),
      (this.bornData = new Float32Array(Oi)),
      (this.lifeData = new Float32Array(Oi)),
      (this.seedData = new Float32Array(Oi)));
    for (let s = 0; s < Oi; s++) this.bornData[s] = -1;
    ((this.offsetAttr = new kt(this.offsetData, 3)),
      (this.sizeAttrBuf = new kt(this.sizeData, 1)),
      (this.hollowAttr = new kt(this.hollowData, 1)),
      (this.bornAttr = new kt(this.bornData, 1)),
      (this.lifeAttr = new kt(this.lifeData, 1)),
      (this.seedAttr = new kt(this.seedData, 1)),
      this.offsetAttr.setUsage(oi),
      this.sizeAttrBuf.setUsage(oi),
      this.hollowAttr.setUsage(oi),
      this.bornAttr.setUsage(oi),
      this.lifeAttr.setUsage(oi),
      this.seedAttr.setUsage(oi),
      this.geometry.setAttribute("aOffset", this.offsetAttr),
      this.geometry.setAttribute("aSize", this.sizeAttrBuf),
      this.geometry.setAttribute("aHollow", this.hollowAttr),
      this.geometry.setAttribute("aBornAt", this.bornAttr),
      this.geometry.setAttribute("aLifespan", this.lifeAttr),
      this.geometry.setAttribute("aSeed", this.seedAttr));
  }
  setConfig(t) {
    (t.clusterRate !== void 0 &&
      this.mode.kind === "ambient" &&
      (this.mode = { kind: "ambient", clusterRate: t.clusterRate }),
      t.size !== void 0 && (this.size = t.size),
      t.hollowRatio !== void 0 && (this.hollowRatio = t.hollowRatio),
      t.glitchAmount !== void 0 &&
        ((this.glitchAmount = t.glitchAmount),
        (this.uniforms.glitchAmount.value = this.glitchAmount)),
      t.color !== void 0 &&
        ((this.color = t.color),
        this.uniforms.color.value.set(this.color.r, this.color.g, this.color.b)),
      t.spawnArea !== void 0 && (this.spawnArea = t.spawnArea),
      t.lifespan !== void 0 && (this.lifespan = t.lifespan),
      t.anchorYOffset !== void 0 && (this.anchorYOffset = t.anchorYOffset));
  }
  update(t, i, s) {
    if (((this.anchor = s), (this.uniforms.time.value = t), this.mode.kind === "ambient"))
      for (this.clusterAccumulator += this.mode.clusterRate * i; this.clusterAccumulator >= 1;)
        (this.spawnCluster(t), (this.clusterAccumulator -= 1));
    else {
      if (!this.burstSpawned) {
        for (let l = 0; l < this.mode.clusters; l++) this.spawnCluster(t);
        this.burstSpawned = !0;
      }
      let o = !1;
      for (let l = 0; l < Oi; l++)
        if (this.bornData[l] >= 0 && t - this.bornData[l] < this.lifeData[l]) {
          o = !0;
          break;
        }
      o || (this.done = !0);
    }
  }
  spawnCluster(t) {
    if (!this.anchor) return;
    const i = this.anchor,
      s = (i.size.x * this.spawnArea.x) / 2,
      o = (i.size.y * this.spawnArea.y) / 2,
      l = this.spawnArea.z / 2,
      u = i.position.x + (this.rng() * 2 - 1) * s,
      f = i.position.y + this.anchorYOffset + (this.rng() * 2 - 1) * o,
      h = i.position.z + (this.rng() * 2 - 1) * l,
      p = Mv[(this.rng() * Mv.length) | 0],
      y = this.size,
      g = this.rng(),
      v = this.rng() < this.hollowRatio ? 1 : 0;
    for (const [b, S] of p) this.spawnTile(t, u + b * y, f + S * y, h, y, v, g);
  }
  spawnTile(t, i, s, o, l, u, f) {
    let h = -1,
      p = -1;
    for (let y = 0; y < Oi; y++) {
      const g = this.bornData[y];
      if (g < 0) {
        h = y;
        break;
      }
      const v = t - g;
      v > p && ((p = v), (h = y));
    }
    h < 0 ||
      ((this.offsetData[h * 3] = i),
      (this.offsetData[h * 3 + 1] = s),
      (this.offsetData[h * 3 + 2] = o),
      (this.sizeData[h] = l * (0.92 + this.rng() * 0.16)),
      (this.hollowData[h] = u),
      (this.bornData[h] = t),
      (this.lifeData[h] = this.lifespan * (0.7 + this.rng() * 0.6)),
      (this.seedData[h] = f + this.rng() * 0.001),
      (this.offsetAttr.needsUpdate = !0),
      (this.sizeAttrBuf.needsUpdate = !0),
      (this.hollowAttr.needsUpdate = !0),
      (this.bornAttr.needsUpdate = !0),
      (this.lifeAttr.needsUpdate = !0),
      (this.seedAttr.needsUpdate = !0));
  }
  dispose() {
    (this.geometry.dispose(), this.material.dispose());
  }
}
var Gc = { exports: {} },
  qA = Gc.exports,
  _v;
function XA() {
  return (
    _v ||
      ((_v = 1),
      (function (c) {
        (function (t, i, s) {
          function o(h) {
            var p = this,
              y = f();
            ((p.next = function () {
              var g = 2091639 * p.s0 + p.c * 23283064365386963e-26;
              return ((p.s0 = p.s1), (p.s1 = p.s2), (p.s2 = g - (p.c = g | 0)));
            }),
              (p.c = 1),
              (p.s0 = y(" ")),
              (p.s1 = y(" ")),
              (p.s2 = y(" ")),
              (p.s0 -= y(h)),
              p.s0 < 0 && (p.s0 += 1),
              (p.s1 -= y(h)),
              p.s1 < 0 && (p.s1 += 1),
              (p.s2 -= y(h)),
              p.s2 < 0 && (p.s2 += 1),
              (y = null));
          }
          function l(h, p) {
            return ((p.c = h.c), (p.s0 = h.s0), (p.s1 = h.s1), (p.s2 = h.s2), p);
          }
          function u(h, p) {
            var y = new o(h),
              g = p && p.state,
              v = y.next;
            return (
              (v.int32 = function () {
                return (y.next() * 4294967296) | 0;
              }),
              (v.double = function () {
                return v() + ((v() * 2097152) | 0) * 11102230246251565e-32;
              }),
              (v.quick = v),
              g &&
                (typeof g == "object" && l(g, y),
                (v.state = function () {
                  return l(y, {});
                })),
              v
            );
          }
          function f() {
            var h = 4022871197,
              p = function (y) {
                y = String(y);
                for (var g = 0; g < y.length; g++) {
                  h += y.charCodeAt(g);
                  var v = 0.02519603282416938 * h;
                  ((h = v >>> 0),
                    (v -= h),
                    (v *= h),
                    (h = v >>> 0),
                    (v -= h),
                    (h += v * 4294967296));
                }
                return (h >>> 0) * 23283064365386963e-26;
              };
            return p;
          }
          i && i.exports ? (i.exports = u) : (this.alea = u);
        })(qA, c);
      })(Gc)),
    Gc.exports
  );
}
var jc = { exports: {} },
  IA = jc.exports,
  Tv;
function ZA() {
  return (
    Tv ||
      ((Tv = 1),
      (function (c) {
        (function (t, i, s) {
          function o(f) {
            var h = this,
              p = "";
            ((h.x = 0),
              (h.y = 0),
              (h.z = 0),
              (h.w = 0),
              (h.next = function () {
                var g = h.x ^ (h.x << 11);
                return (
                  (h.x = h.y),
                  (h.y = h.z),
                  (h.z = h.w),
                  (h.w ^= (h.w >>> 19) ^ g ^ (g >>> 8))
                );
              }),
              f === (f | 0) ? (h.x = f) : (p += f));
            for (var y = 0; y < p.length + 64; y++) ((h.x ^= p.charCodeAt(y) | 0), h.next());
          }
          function l(f, h) {
            return ((h.x = f.x), (h.y = f.y), (h.z = f.z), (h.w = f.w), h);
          }
          function u(f, h) {
            var p = new o(f),
              y = h && h.state,
              g = function () {
                return (p.next() >>> 0) / 4294967296;
              };
            return (
              (g.double = function () {
                do
                  var v = p.next() >>> 11,
                    b = (p.next() >>> 0) / 4294967296,
                    S = (v + b) / (1 << 21);
                while (S === 0);
                return S;
              }),
              (g.int32 = p.next),
              (g.quick = g),
              y &&
                (typeof y == "object" && l(y, p),
                (g.state = function () {
                  return l(p, {});
                })),
              g
            );
          }
          i && i.exports ? (i.exports = u) : (this.xor128 = u);
        })(IA, c);
      })(jc)),
    jc.exports
  );
}
var Yc = { exports: {} },
  PA = Yc.exports,
  zv;
function WA() {
  return (
    zv ||
      ((zv = 1),
      (function (c) {
        (function (t, i, s) {
          function o(f) {
            var h = this,
              p = "";
            ((h.next = function () {
              var g = h.x ^ (h.x >>> 2);
              return (
                (h.x = h.y),
                (h.y = h.z),
                (h.z = h.w),
                (h.w = h.v),
                ((h.d = (h.d + 362437) | 0) + (h.v = h.v ^ (h.v << 4) ^ (g ^ (g << 1)))) | 0
              );
            }),
              (h.x = 0),
              (h.y = 0),
              (h.z = 0),
              (h.w = 0),
              (h.v = 0),
              f === (f | 0) ? (h.x = f) : (p += f));
            for (var y = 0; y < p.length + 64; y++)
              ((h.x ^= p.charCodeAt(y) | 0),
                y == p.length && (h.d = (h.x << 10) ^ (h.x >>> 4)),
                h.next());
          }
          function l(f, h) {
            return (
              (h.x = f.x),
              (h.y = f.y),
              (h.z = f.z),
              (h.w = f.w),
              (h.v = f.v),
              (h.d = f.d),
              h
            );
          }
          function u(f, h) {
            var p = new o(f),
              y = h && h.state,
              g = function () {
                return (p.next() >>> 0) / 4294967296;
              };
            return (
              (g.double = function () {
                do
                  var v = p.next() >>> 11,
                    b = (p.next() >>> 0) / 4294967296,
                    S = (v + b) / (1 << 21);
                while (S === 0);
                return S;
              }),
              (g.int32 = p.next),
              (g.quick = g),
              y &&
                (typeof y == "object" && l(y, p),
                (g.state = function () {
                  return l(p, {});
                })),
              g
            );
          }
          i && i.exports ? (i.exports = u) : (this.xorwow = u);
        })(PA, c);
      })(Yc)),
    Yc.exports
  );
}
var qc = { exports: {} },
  JA = qc.exports,
  Ev;
function QA() {
  return (
    Ev ||
      ((Ev = 1),
      (function (c) {
        (function (t, i, s) {
          function o(f) {
            var h = this;
            h.next = function () {
              var y = h.x,
                g = h.i,
                v,
                b;
              return (
                (v = y[g]),
                (v ^= v >>> 7),
                (b = v ^ (v << 24)),
                (v = y[(g + 1) & 7]),
                (b ^= v ^ (v >>> 10)),
                (v = y[(g + 3) & 7]),
                (b ^= v ^ (v >>> 3)),
                (v = y[(g + 4) & 7]),
                (b ^= v ^ (v << 7)),
                (v = y[(g + 7) & 7]),
                (v = v ^ (v << 13)),
                (b ^= v ^ (v << 9)),
                (y[g] = b),
                (h.i = (g + 1) & 7),
                b
              );
            };
            function p(y, g) {
              var v,
                b = [];
              if (g === (g | 0)) b[0] = g;
              else
                for (g = "" + g, v = 0; v < g.length; ++v)
                  b[v & 7] = (b[v & 7] << 15) ^ ((g.charCodeAt(v) + b[(v + 1) & 7]) << 13);
              for (; b.length < 8;) b.push(0);
              for (v = 0; v < 8 && b[v] === 0; ++v);
              for (v == 8 ? (b[7] = -1) : b[v], y.x = b, y.i = 0, v = 256; v > 0; --v) y.next();
            }
            p(h, f);
          }
          function l(f, h) {
            return ((h.x = f.x.slice()), (h.i = f.i), h);
          }
          function u(f, h) {
            f == null && (f = +new Date());
            var p = new o(f),
              y = h && h.state,
              g = function () {
                return (p.next() >>> 0) / 4294967296;
              };
            return (
              (g.double = function () {
                do
                  var v = p.next() >>> 11,
                    b = (p.next() >>> 0) / 4294967296,
                    S = (v + b) / (1 << 21);
                while (S === 0);
                return S;
              }),
              (g.int32 = p.next),
              (g.quick = g),
              y &&
                (y.x && l(y, p),
                (g.state = function () {
                  return l(p, {});
                })),
              g
            );
          }
          i && i.exports ? (i.exports = u) : (this.xorshift7 = u);
        })(JA, c);
      })(qc)),
    qc.exports
  );
}
var Xc = { exports: {} },
  KA = Xc.exports,
  Rv;
function $A() {
  return (
    Rv ||
      ((Rv = 1),
      (function (c) {
        (function (t, i, s) {
          function o(f) {
            var h = this;
            h.next = function () {
              var y = h.w,
                g = h.X,
                v = h.i,
                b,
                S;
              return (
                (h.w = y = (y + 1640531527) | 0),
                (S = g[(v + 34) & 127]),
                (b = g[(v = (v + 1) & 127)]),
                (S ^= S << 13),
                (b ^= b << 17),
                (S ^= S >>> 15),
                (b ^= b >>> 12),
                (S = g[v] = S ^ b),
                (h.i = v),
                (S + (y ^ (y >>> 16))) | 0
              );
            };
            function p(y, g) {
              var v,
                b,
                S,
                A,
                M,
                T = [],
                O = 128;
              for (
                g === (g | 0)
                  ? ((b = g), (g = null))
                  : ((g = g + "\0"), (b = 0), (O = Math.max(O, g.length))),
                  S = 0,
                  A = -32;
                A < O;
                ++A
              )
                (g && (b ^= g.charCodeAt((A + 32) % g.length)),
                  A === 0 && (M = b),
                  (b ^= b << 10),
                  (b ^= b >>> 15),
                  (b ^= b << 4),
                  (b ^= b >>> 13),
                  A >= 0 &&
                    ((M = (M + 1640531527) | 0),
                    (v = T[A & 127] ^= b + M),
                    (S = v == 0 ? S + 1 : 0)));
              for (S >= 128 && (T[((g && g.length) || 0) & 127] = -1), S = 127, A = 512; A > 0; --A)
                ((b = T[(S + 34) & 127]),
                  (v = T[(S = (S + 1) & 127)]),
                  (b ^= b << 13),
                  (v ^= v << 17),
                  (b ^= b >>> 15),
                  (v ^= v >>> 12),
                  (T[S] = b ^ v));
              ((y.w = M), (y.X = T), (y.i = S));
            }
            p(h, f);
          }
          function l(f, h) {
            return ((h.i = f.i), (h.w = f.w), (h.X = f.X.slice()), h);
          }
          function u(f, h) {
            f == null && (f = +new Date());
            var p = new o(f),
              y = h && h.state,
              g = function () {
                return (p.next() >>> 0) / 4294967296;
              };
            return (
              (g.double = function () {
                do
                  var v = p.next() >>> 11,
                    b = (p.next() >>> 0) / 4294967296,
                    S = (v + b) / (1 << 21);
                while (S === 0);
                return S;
              }),
              (g.int32 = p.next),
              (g.quick = g),
              y &&
                (y.X && l(y, p),
                (g.state = function () {
                  return l(p, {});
                })),
              g
            );
          }
          i && i.exports ? (i.exports = u) : (this.xor4096 = u);
        })(KA, c);
      })(Xc)),
    Xc.exports
  );
}
var Ic = { exports: {} },
  tM = Ic.exports,
  Cv;
function eM() {
  return (
    Cv ||
      ((Cv = 1),
      (function (c) {
        (function (t, i, s) {
          function o(f) {
            var h = this,
              p = "";
            ((h.next = function () {
              var g = h.b,
                v = h.c,
                b = h.d,
                S = h.a;
              return (
                (g = (g << 25) ^ (g >>> 7) ^ v),
                (v = (v - b) | 0),
                (b = (b << 24) ^ (b >>> 8) ^ S),
                (S = (S - g) | 0),
                (h.b = g = (g << 20) ^ (g >>> 12) ^ v),
                (h.c = v = (v - b) | 0),
                (h.d = (b << 16) ^ (v >>> 16) ^ S),
                (h.a = (S - g) | 0)
              );
            }),
              (h.a = 0),
              (h.b = 0),
              (h.c = -1640531527),
              (h.d = 1367130551),
              f === Math.floor(f) ? ((h.a = (f / 4294967296) | 0), (h.b = f | 0)) : (p += f));
            for (var y = 0; y < p.length + 20; y++) ((h.b ^= p.charCodeAt(y) | 0), h.next());
          }
          function l(f, h) {
            return ((h.a = f.a), (h.b = f.b), (h.c = f.c), (h.d = f.d), h);
          }
          function u(f, h) {
            var p = new o(f),
              y = h && h.state,
              g = function () {
                return (p.next() >>> 0) / 4294967296;
              };
            return (
              (g.double = function () {
                do
                  var v = p.next() >>> 11,
                    b = (p.next() >>> 0) / 4294967296,
                    S = (v + b) / (1 << 21);
                while (S === 0);
                return S;
              }),
              (g.int32 = p.next),
              (g.quick = g),
              y &&
                (typeof y == "object" && l(y, p),
                (g.state = function () {
                  return l(p, {});
                })),
              g
            );
          }
          i && i.exports ? (i.exports = u) : (this.tychei = u);
        })(tM, c);
      })(Ic)),
    Ic.exports
  );
}
var Zc = { exports: {} };
const iM = {},
  nM = Object.freeze(
    Object.defineProperty({ __proto__: null, default: iM }, Symbol.toStringTag, {
      value: "Module",
    }),
  ),
  sM = z2(nM);
var aM = Zc.exports,
  Ov;
function oM() {
  return (
    Ov ||
      ((Ov = 1),
      (function (c) {
        (function (t, i, s) {
          var o = 256,
            l = 6,
            u = 52,
            f = "random",
            h = s.pow(o, l),
            p = s.pow(2, u),
            y = p * 2,
            g = o - 1,
            v;
          function b(E, U, q) {
            var X = [];
            U = U == !0 ? { entropy: !0 } : U || {};
            var G = T(M(U.entropy ? [E, C(i)] : (E ?? O()), 3), X),
              W = new S(X),
              P = function () {
                for (var Q = W.g(l), rt = h, ht = 0; Q < p;)
                  ((Q = (Q + ht) * o), (rt *= o), (ht = W.g(1)));
                for (; Q >= y;) ((Q /= 2), (rt /= 2), (ht >>>= 1));
                return (Q + ht) / rt;
              };
            return (
              (P.int32 = function () {
                return W.g(4) | 0;
              }),
              (P.quick = function () {
                return W.g(4) / 4294967296;
              }),
              (P.double = P),
              T(C(W.S), i),
              (
                U.pass ||
                q ||
                function (Q, rt, ht, xt) {
                  return (
                    xt &&
                      (xt.S && A(xt, W),
                      (Q.state = function () {
                        return A(W, {});
                      })),
                    ht ? ((s[f] = Q), rt) : Q
                  );
                }
              )(P, G, "global" in U ? U.global : this == s, U.state)
            );
          }
          function S(E) {
            var U,
              q = E.length,
              X = this,
              G = 0,
              W = (X.i = X.j = 0),
              P = (X.S = []);
            for (q || (E = [q++]); G < o;) P[G] = G++;
            for (G = 0; G < o; G++) ((P[G] = P[(W = g & (W + E[G % q] + (U = P[G])))]), (P[W] = U));
            (X.g = function (Q) {
              for (var rt, ht = 0, xt = X.i, ft = X.j, L = X.S; Q--;)
                ((rt = L[(xt = g & (xt + 1))]),
                  (ht = ht * o + L[g & ((L[xt] = L[(ft = g & (ft + rt))]) + (L[ft] = rt))]));
              return ((X.i = xt), (X.j = ft), ht);
            })(o);
          }
          function A(E, U) {
            return ((U.i = E.i), (U.j = E.j), (U.S = E.S.slice()), U);
          }
          function M(E, U) {
            var q = [],
              X = typeof E,
              G;
            if (U && X == "object")
              for (G in E)
                try {
                  q.push(M(E[G], U - 1));
                } catch {}
            return q.length ? q : X == "string" ? E : E + "\0";
          }
          function T(E, U) {
            for (var q = E + "", X, G = 0; G < q.length;)
              U[g & G] = g & ((X ^= U[g & G] * 19) + q.charCodeAt(G++));
            return C(U);
          }
          function O() {
            try {
              var E;
              return (
                v && (E = v.randomBytes)
                  ? (E = E(o))
                  : ((E = new Uint8Array(o)), (t.crypto || t.msCrypto).getRandomValues(E)),
                C(E)
              );
            } catch {
              var U = t.navigator,
                q = U && U.plugins;
              return [+new Date(), t, q, t.screen, C(i)];
            }
          }
          function C(E) {
            return String.fromCharCode.apply(0, E);
          }
          if ((T(s.random(), i), c.exports)) {
            c.exports = b;
            try {
              v = sM;
            } catch {}
          } else s["seed" + f] = b;
        })(typeof self < "u" ? self : aM, [], Math);
      })(Zc)),
    Zc.exports
  );
}
var Md, Bv;
function rM() {
  if (Bv) return Md;
  Bv = 1;
  var c = XA(),
    t = ZA(),
    i = WA(),
    s = QA(),
    o = $A(),
    l = eM(),
    u = oM();
  return (
    (u.alea = c),
    (u.xor128 = t),
    (u.xorwow = i),
    (u.xorshift7 = s),
    (u.xor4096 = o),
    (u.tychei = l),
    (Md = u),
    Md
  );
}
var lM = rM();
const cM = E2(lM),
  l0 = new Map();
function xe(c, t) {
  l0.set(c, t);
}
function uM() {
  return Array.from(l0.keys());
}
function hM(c, t, i = {}) {
  const s = l0.get(t);
  if (!s) return;
  const o = i.seed === void 0 ? null : cM(`${t}:${i.seed}`),
    l = i.rng ?? o ?? Math.random;
  s({
    engine: c,
    add: (f) => c.add(f),
    after: (f, h) => c.schedule(f, h),
    nextId: (f) => c.nextId(f),
    rng: () => l(),
  });
}
xe("ring-pulse", (c) => {
  c.add(
    new Za({
      id: c.nextId("ring-pulse"),
      radius: 1.6,
      thickness: 0.1,
      tilt: 0,
      rotationSpeed: 0,
      opacity: 0.9,
      color: { r: 0.35, g: 0.9, b: 1 },
      lifespan: 1.2,
      riseFromY: -3.4,
      riseToY: 4,
    }),
  );
});
xe("glow-burst", (c) => {
  c.add(
    new Bs({
      id: c.nextId("glow-burst"),
      mode: { kind: "burst", count: 60 },
      size: 0.16,
      lifespan: 1.4,
      color: { r: 0.85, g: 0.95, b: 1 },
      spawnArea: { x: 0.4, y: 0.4, z: 0.6 },
      driftY: 1.6,
      jitterXY: 1.4,
      anchorYOffset: 0.4,
      rng: c.rng,
    }),
  );
});
xe("drain-burst", (c) => {
  c.add(
    new Bs({
      id: c.nextId("drain-burst"),
      mode: { kind: "burst", count: 55 },
      size: 0.2,
      lifespan: 1.8,
      color: { r: 1, g: 0.45, b: 0.2 },
      spawnArea: { x: 0.6, y: 0.6, z: 0.7 },
      driftY: -1.4,
      jitterXY: 1.3,
      anchorYOffset: 0.4,
      rng: c.rng,
    }),
  );
});
xe("tetris-rain", (c) => {
  c.add(
    new r0({
      id: c.nextId("tetris-rain"),
      mode: { kind: "burst", clusters: 12 },
      size: 0.13,
      hollowRatio: 0.55,
      glitchAmount: 0.6,
      color: { r: 0.35, g: 0.9, b: 1 },
      spawnArea: { x: 1.4, y: 1.2, z: 1.2 },
      lifespan: 1.6,
      anchorYOffset: 0,
      rng: c.rng,
    }),
  );
});
xe("level-up", (c) => {
  (c.add(
    new Za({
      id: c.nextId("level-up-ring"),
      radius: 1.9,
      thickness: 0.14,
      tilt: 0,
      rotationSpeed: 0,
      opacity: 1,
      color: { r: 1, g: 0.85, b: 0.5 },
      lifespan: 1.6,
      riseFromY: -3.4,
      riseToY: 4.2,
    }),
  ),
    c.after(0.12, () => {
      c.add(
        new r0({
          id: c.nextId("level-up-tiles"),
          mode: { kind: "burst", clusters: 18 },
          size: 0.15,
          hollowRatio: 0.4,
          glitchAmount: 0.5,
          color: { r: 1, g: 0.85, b: 0.55 },
          spawnArea: { x: 1.6, y: 1.4, z: 1.4 },
          lifespan: 1.8,
          rng: c.rng,
        }),
      );
    }),
    c.after(0.2, () => {
      c.add(
        new Bs({
          id: c.nextId("level-up-dots"),
          mode: { kind: "burst", count: 90 },
          size: 0.18,
          lifespan: 2,
          color: { r: 1, g: 0.9, b: 0.6 },
          spawnArea: { x: 0.5, y: 0.6, z: 0.7 },
          driftY: 2.2,
          jitterXY: 1.6,
          anchorYOffset: 0.2,
          rng: c.rng,
        }),
      );
    }));
});
xe("exp-gain", (c) => {
  (c.add(
    new Za({
      id: c.nextId("exp-ring"),
      radius: 1.4,
      thickness: 0.07,
      tilt: 0,
      rotationSpeed: 0,
      opacity: 0.85,
      color: { r: 0.55, g: 1, b: 0.85 },
      lifespan: 0.9,
      riseFromY: -3,
      riseToY: 3.6,
    }),
  ),
    c.add(
      new Bs({
        id: c.nextId("exp-dots"),
        mode: { kind: "burst", count: 24 },
        size: 0.14,
        lifespan: 1.2,
        color: { r: 0.6, g: 1, b: 0.85 },
        spawnArea: { x: 0.35, y: 0.35, z: 0.5 },
        driftY: 1.4,
        jitterXY: 1,
        anchorYOffset: 0.3,
        rng: c.rng,
      }),
    ));
});
xe("nori-attention-bloom", (c) => {
  (c.add(
    new Za({
      id: c.nextId("nori-attention-ring"),
      radius: 1.28,
      thickness: 0.06,
      tilt: 0,
      rotationSpeed: 0,
      opacity: 0.62,
      color: { r: 0.48, g: 1, b: 0.86 },
      lifespan: 1.9,
      riseFromY: -2.6,
      riseToY: 3.1,
    }),
  ),
    c.after(0.24, () => {
      c.add(
        new Za({
          id: c.nextId("nori-attention-ring"),
          radius: 1.58,
          thickness: 0.045,
          tilt: 0,
          rotationSpeed: 0,
          opacity: 0.48,
          color: { r: 0.35, g: 0.92, b: 1 },
          lifespan: 1.65,
          riseFromY: -2.3,
          riseToY: 3.35,
        }),
      );
    }),
    c.after(0.06, () => {
      c.add(
        new Bs({
          id: c.nextId("nori-attention-dots"),
          mode: { kind: "burst", count: 46 },
          size: 0.13,
          lifespan: 1.45,
          color: { r: 0.62, g: 1, b: 0.9 },
          spawnArea: { x: 0.42, y: 0.72, z: 0.6 },
          driftY: 1.25,
          jitterXY: 0.7,
          anchorYOffset: -0.35,
          rng: c.rng,
        }),
      );
    }),
    c.after(0.32, () => {
      c.add(
        new Bs({
          id: c.nextId("nori-attention-dots"),
          mode: { kind: "burst", count: 28 },
          size: 0.1,
          lifespan: 1.2,
          color: { r: 0.38, g: 0.9, b: 1 },
          spawnArea: { x: 0.34, y: 0.5, z: 0.5 },
          driftY: 1.45,
          jitterXY: 0.55,
          anchorYOffset: -0.1,
          rng: c.rng,
        }),
      );
    }));
});
const Dv = 2.4,
  fM = 4,
  dM = 8,
  W1 = Math.PI * 2,
  pM = [-2.4, -0.8, 0.8, 2.4],
  mM = [2.6, 2.9, 3.2],
  Nv = 200,
  yM = 400,
  gM = 5;
function Uv(c, t, i) {
  const s = Math.min(1, Math.max(0, (i - c) / (t - c)));
  return s * s * (3 - 2 * s);
}
function ji(c, t, i) {
  return t + (i - t) * c();
}
const vM = `
  varying vec2 vUv;
  varying float vRadial;

  void main() {
    vUv = uv;
    // Encode the cross-section position so the fragment shader can sculpt the tube glow.
    vRadial = (uv.y - 0.5) * 2.0;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`,
  bM = `
  varying vec2 vUv;
  varying float vRadial;

  uniform float elapsed;
  uniform float envelope;
  uniform float brightness;
  uniform float phase;

  void main() {
    if (envelope <= 0.001) discard;

    float absR = abs(vRadial);
    float core = pow(1.0 - clamp(absR, 0.0, 1.0), 6.0);
    float halo = pow(1.0 - clamp(absR, 0.0, 1.0), 1.6) * 0.45;

    // Traveling shimmer along the ring path so each ring feels alive.
    float shimmer = 0.75 + 0.25 * sin(vUv.x * 18.0 + elapsed * 2.0 + phase * 6.2831853);

    float mask = (core * 1.4 + halo) * shimmer;
    if (mask <= 0.002) discard;

    vec3 deepBlue = vec3(0.15, 0.45, 1.0);
    vec3 cyan = vec3(0.6, 0.95, 1.0);
    vec3 white = vec3(0.9, 0.95, 1.0);
    vec3 color = mix(deepBlue, cyan, halo * 0.8 + 0.2);
    color = mix(color, white, core * 0.9);

    float alpha = clamp(mask * envelope * brightness, 0.0, 1.0);
    gl_FragColor = vec4(color * (0.9 + core * 0.6), alpha);
  }
`,
  xM = `
  attribute float aSize;
  attribute float aPhase;
  attribute float aAlpha;
  attribute float aShape;
  attribute float aHue;

  uniform float elapsed;
  uniform float envelope;

  varying float vAlpha;
  varying float vShape;
  varying float vHue;

  void main() {
    vec3 pos = position;
    // Floating cube drift between ring levels.
    if (aShape > 0.5) {
      pos.y += sin(elapsed * 0.45 + aPhase * 11.0) * 0.22;
      pos.x += sin(elapsed * 0.32 + aPhase * 7.0) * 0.14;
      pos.z += cos(elapsed * 0.28 + aPhase * 9.0) * 0.14;
    }

    float flicker = 0.55 + 0.45 * sin(elapsed * (2.0 + aPhase * 1.4) + aPhase * 17.0);
    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    vAlpha = envelope * aAlpha * flicker;
    vShape = aShape;
    vHue = aHue;
    gl_PointSize = aSize * 320.0 / -mv.z;
    gl_Position = projectionMatrix * mv;
  }
`,
  SM = `
  varying float vAlpha;
  varying float vShape;
  varying float vHue;

  void main() {
    if (vAlpha <= 0.001) discard;
    vec2 p = gl_PointCoord - 0.5;

    float mask;
    vec3 color;

    if (vShape > 0.5) {
      // Hard cyan/white square — Minecraft-style data fragment via step() mask.
      float m = max(abs(p.x), abs(p.y));
      float box = step(m, 0.42);
      float rim = step(0.30, m) * box;
      mask = box * 0.55 + rim * 0.85;
      vec3 cyan = vec3(0.6, 0.95, 1.0);
      vec3 white = vec3(0.92, 0.97, 1.0);
      color = mix(cyan, white, vHue);
    } else {
      // Ring sparkle: bright disc + cross flare.
      float r = length(p);
      float disc = 1.0 - smoothstep(0.0, 0.5, r);
      float spike = pow(max(0.0, 1.0 - abs(p.x) * 9.0), 3.0) * (1.0 - smoothstep(0.0, 0.5, abs(p.y)))
                  + pow(max(0.0, 1.0 - abs(p.y) * 9.0), 3.0) * (1.0 - smoothstep(0.0, 0.5, abs(p.x)))
                  + pow(max(0.0, 1.0 - abs(p.x + p.y) * 9.0), 3.0) * 0.6
                  + pow(max(0.0, 1.0 - abs(p.x - p.y) * 9.0), 3.0) * 0.6;
      mask = clamp(disc * 0.55 + spike * 1.2, 0.0, 1.8);
      vec3 white = vec3(0.92, 0.97, 1.0);
      vec3 cyan = vec3(0.6, 0.95, 1.0);
      color = mix(cyan, white, disc * 0.8 + spike * 0.3);
    }

    if (mask <= 0.003) discard;
    gl_FragColor = vec4(color, mask * vAlpha);
  }
`,
  wM = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`,
  AM = `
  varying vec2 vUv;
  uniform float envelope;

  void main() {
    if (envelope <= 0.001) discard;
    vec2 p = vUv - 0.5;
    float r = length(p) * 2.0; // 0..~1.4
    // Two-stop radial: dense cyan core, soft outer haze.
    float core = pow(max(0.0, 1.0 - r / 0.55), 2.2);
    float halo = pow(max(0.0, 1.0 - r / 1.1), 1.4) * 0.45;
    float mask = core * 0.55 + halo;
    if (mask <= 0.002) discard;
    vec3 cyan = vec3(0.35, 0.75, 1.0);
    vec3 deep = vec3(0.08, 0.25, 0.7);
    vec3 color = mix(deep, cyan, core * 0.7 + halo * 0.4);
    gl_FragColor = vec4(color, mask * envelope * 0.7);
  }
`;
function MM(c) {
  const t = new wr(c.radius, c.thickness, 10, 96);
  (t.rotateX(Math.PI / 2), t.rotateX(c.tilt));
  const i = {
      elapsed: { value: 0 },
      envelope: { value: 0 },
      brightness: { value: c.brightness },
      phase: { value: c.phase },
    },
    s = new dt({
      uniforms: i,
      vertexShader: vM,
      fragmentShader: bM,
      transparent: !0,
      depthWrite: !1,
      depthTest: !0,
      blending: Rt,
      side: Ne,
    }),
    o = new $t(t, s);
  return (
    (o.position.y = c.y),
    (o.frustumCulled = !1),
    (o.renderOrder = 5),
    { mesh: o, geometry: t, material: s, uniforms: i, rotationSpeed: c.rotationSpeed }
  );
}
function _M(c, t) {
  const i = c.length * Nv,
    s = new Float32Array(i * 3),
    o = new Float32Array(i),
    l = new Float32Array(i),
    u = new Float32Array(i),
    f = new Float32Array(i),
    h = new Float32Array(i);
  let p = 0;
  for (const y of c) {
    const g = Math.cos(y.tilt),
      v = Math.sin(y.tilt);
    for (let b = 0; b < Nv; b++) {
      const S = t() * W1,
        A = y.radius + ji(t, -y.thickness * 1.2, y.thickness * 1.2),
        M = Math.cos(S) * A,
        T = Math.sin(S) * A,
        O = ji(t, -y.thickness * 1.1, y.thickness * 1.1),
        C = -v * T + O,
        E = g * T;
      ((s[p * 3] = M),
        (s[p * 3 + 1] = y.y + C),
        (s[p * 3 + 2] = E),
        (o[p] = ji(t, 0.022, t() > 0.85 ? 0.075 : 0.04)),
        (l[p] = t()),
        (u[p] = ji(t, 0.7, 1.15)),
        (f[p] = 0),
        (h[p] = t()),
        p++);
    }
  }
  return J1(s, o, l, u, f, h);
}
function TM(c) {
  const t = yM,
    i = new Float32Array(t * 3),
    s = new Float32Array(t),
    o = new Float32Array(t),
    l = new Float32Array(t),
    u = new Float32Array(t),
    f = new Float32Array(t);
  for (let h = 0; h < t; h++) {
    const p = c() * W1,
      y = ji(c, 1.5, 3.5),
      g = Math.cos(p) * y,
      v = Math.sin(p) * y,
      b = ji(c, -3.2, 3.2);
    ((i[h * 3] = g),
      (i[h * 3 + 1] = b),
      (i[h * 3 + 2] = v),
      (s[h] = ji(c, 0.03, c() > 0.78 ? 0.09 : 0.055)),
      (o[h] = c()),
      (l[h] = ji(c, 0.45, 0.95)),
      (u[h] = 1),
      (f[h] = c()));
  }
  return J1(i, s, o, l, u, f);
}
function J1(c, t, i, s, o, l) {
  const u = new At();
  (u.setAttribute("position", new H(c, 3)),
    u.setAttribute("aSize", new H(t, 1)),
    u.setAttribute("aPhase", new H(i, 1)),
    u.setAttribute("aAlpha", new H(s, 1)),
    u.setAttribute("aShape", new H(o, 1)),
    u.setAttribute("aHue", new H(l, 1)));
  const f = { elapsed: { value: 0 }, envelope: { value: 0 } },
    h = new dt({
      uniforms: f,
      vertexShader: xM,
      fragmentShader: SM,
      transparent: !0,
      depthWrite: !1,
      depthTest: !0,
      blending: Rt,
    }),
    p = new ne(u, h);
  return (
    (p.frustumCulled = !1),
    (p.renderOrder = 4),
    { points: p, geometry: u, material: h, uniforms: f }
  );
}
function zM() {
  const c = new be(14, 14),
    t = { envelope: { value: 0 } },
    i = new dt({
      uniforms: t,
      vertexShader: wM,
      fragmentShader: AM,
      transparent: !0,
      depthWrite: !1,
      depthTest: !1,
      blending: Rt,
      side: Ne,
    }),
    s = new $t(c, i);
  return (
    (s.frustumCulled = !1),
    (s.renderOrder = 1),
    { mesh: s, geometry: c, material: i, uniforms: t }
  );
}
class EM {
  id;
  object = new ve();
  done = !1;
  elapsed = 0;
  rings;
  sparkles;
  squares;
  haze;
  geometries;
  materials;
  pointUniformGroups;
  constructor(t, i) {
    this.id = t;
    const s = (gM * Math.PI) / 180,
      o = [];
    (pM.forEach((l, u) => {
      const f = u % 2 === 0 ? s : -s;
      mM.forEach((h, p) => {
        o.push({
          y: l,
          radius: h,
          thickness: 0.045 + p * 0.018,
          brightness: ji(i, 1, 1.35) * (p === 1 ? 1.1 : 1),
          rotationSpeed: (u % 2 === 0 ? 1 : -1) * ji(i, 0.18, 0.32),
          phase: i(),
          tilt: f,
        });
      });
    }),
      (this.rings = o.map(MM)),
      (this.sparkles = _M(o, i)),
      (this.squares = TM(i)),
      (this.haze = zM()),
      this.object.add(this.haze.mesh, this.squares.points, this.sparkles.points));
    for (const l of this.rings) this.object.add(l.mesh);
    ((this.object.renderOrder = 4),
      (this.geometries = [
        this.haze.geometry,
        this.squares.geometry,
        this.sparkles.geometry,
        ...this.rings.map((l) => l.geometry),
      ]),
      (this.materials = [
        this.haze.material,
        this.squares.material,
        this.sparkles.material,
        ...this.rings.map((l) => l.material),
      ]),
      (this.pointUniformGroups = [this.squares.uniforms, this.sparkles.uniforms]));
  }
  update(t, i, s) {
    this.elapsed += Math.max(0, i);
    const o = Uv(0, 0.22, this.elapsed) * (1 - Uv(1.95, Dv, this.elapsed)),
      l = s.size.x / fM,
      u = s.size.y / dM;
    (this.object.position.copy(s.position), this.object.scale.set(l, u, l));
    for (const f of this.rings)
      ((f.mesh.rotation.y = this.elapsed * f.rotationSpeed),
        (f.uniforms.elapsed.value = this.elapsed),
        (f.uniforms.envelope.value = o));
    for (const f of this.pointUniformGroups)
      ((f.elapsed.value = this.elapsed), (f.envelope.value = o));
    if (((this.haze.uniforms.envelope.value = o), this.elapsed >= Dv)) {
      this.done = !0;
      for (const f of this.rings) f.uniforms.envelope.value = 0;
      for (const f of this.pointUniformGroups) f.envelope.value = 0;
      this.haze.uniforms.envelope.value = 0;
    }
  }
  dispose() {
    for (const t of this.geometries) t.dispose();
    for (const t of this.materials) t.dispose();
  }
}
xe("cognitive-lock-prism", (c) => {
  c.add(new EM(c.nextId("cognitive-lock-prism"), c.rng));
});
const Pc = 5.8,
  Qa = 20,
  Q1 = 14,
  RM = -3.12,
  cu = 1,
  Vd = -12,
  CM = 7800,
  OM = 6e3,
  BM = 3e3,
  DM = 320,
  La = 640,
  ka = 380,
  Ds = -1.25,
  NM = `
  varying vec2 vLocal;
  void main() {
    vLocal = position.xz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`,
  UM = `
  uniform float time;
  uniform float opacity;
  varying vec2 vLocal;

  void main() {
    vec2 p = vLocal;
    float er = length(vec2(p.x / 10.2, p.y / 7.0));
    float ellipse = 1.0 - smoothstep(0.86, 1.04, er);
    if (ellipse <= 0.001) discard;

    float depthDim = mix(1.0, 0.55, smoothstep(-1.0, 7.0, p.y));
    float streak = 0.5 + 0.5 * sin(p.y * 0.45 + time * 0.10);
    streak = mix(0.85, 1.0, streak);

    vec3 ink = vec3(0.012, 0.030, 0.058);
    vec3 reflTeal = vec3(0.020, 0.085, 0.135);
    vec3 color = mix(ink, reflTeal, 0.35 + 0.25 * depthDim);
    color *= streak;

    gl_FragColor = vec4(color, ellipse * opacity * 0.78);
  }
`,
  FM = `
  varying vec2 vLocal;
  void main() {
    vLocal = position.xz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`,
  LM = `
  uniform float time;
  uniform float opacity;
  varying vec2 vLocal;

  float band(vec2 p, float lane, float phase, float wobble, float tightness) {
    float bend =
        0.55 * sin(p.x * 0.28 + phase + time * 0.18)
      + 0.24 * sin(p.x * 0.62 - phase * 0.6 - time * 0.12)
      + 0.11 * sin(p.x * 1.40 + phase * 1.3 + time * 0.08);
    float center = lane + bend * wobble;
    float dist = p.y - center;
    return exp(-dist * dist * tightness);
  }

  void main() {
    vec2 p = vLocal;
    float er = length(vec2(p.x / 9.8, p.y / 6.6));
    float ellipse = 1.0 - smoothstep(0.84, 1.02, er);
    if (ellipse <= 0.001) discard;

    float lanes = 0.0;
    lanes += band(p, -4.40, 0.20, 1.10, 3.2) * 0.85;
    lanes += band(p, -2.70, 1.40, 1.20, 3.6) * 1.00;
    lanes += band(p, -1.05, 2.55, 1.00, 4.0) * 0.95;
    lanes += band(p,  1.20, 3.80, 1.00, 4.0) * 0.95;
    lanes += band(p,  2.90, 5.05, 1.20, 3.6) * 1.00;
    lanes += band(p,  4.60, 6.30, 1.10, 3.2) * 0.85;
    float laneMag = clamp(lanes, 0.0, 1.6);

    float upperFront = smoothstep(0.0, 1.0,
      length(vec2(p.x / 1.05, (p.y + 0.55) / 0.90))
    );
    float bodyDim = mix(0.55, 1.0, upperFront);

    vec3 teal = vec3(0.10, 0.62, 0.82);
    vec3 cyan = vec3(0.40, 0.95, 1.00);
    vec3 color = teal * (laneMag * 0.55) + cyan * (laneMag * laneMag * 0.45);

    float alpha = ellipse * bodyDim * opacity * (laneMag * 0.55);
    gl_FragColor = vec4(color, alpha);
  }
`,
  kM = `
  attribute float aSize;
  attribute float aSeed;
  attribute float aBrightness;
  attribute float aAspect; // 0..1 maps to height/width ratio of the rectangle interior
  uniform float time;
  uniform float opacity;
  uniform float pixelScale;
  varying float vAlpha;
  varying float vSeed;
  varying float vBrightness;
  varying float vAspect;
  varying float vSwirl;

  void main() {
    vec3 pos = position;

    // Gentle drift so the pool feels alive.
    pos.x += sin(time * 0.30 + aSeed * 6.283) * 0.018;
    pos.z += cos(time * 0.24 + aSeed * 11.7) * 0.014;

    // Swirl/current density mask: polar coordinates over the floor.
    // density modulated by sin(angle * 3.0 + r * 1.8) so flowing arcs read
    // as bright/dim sweeps across the field.
    float angle = atan(pos.z + 4.0, pos.x);
    float r = length(vec2(pos.x, pos.z + 4.0));
    float swirl = 0.5 + 0.5 * sin(angle * 3.0 + r * 1.8 + time * 0.18);
    vSwirl = swirl;

    // Twinkle: sharp peaks, soft valleys.
    float tw = sin(time * (1.3 + aSeed * 1.9) + aSeed * 31.0) * 0.5 + 0.5;
    tw = pow(tw, 2.0);
    float pulse = 0.55 + 0.45 * tw;

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    // Perspective-correct: world-size aSize → screen size scaled by 1/-mv.z.
    // 900.0 maps a 0.025-world-unit point to a sub-pixel speck at the
    // vanishing horizon (z≈-12) and a hefty rectangle right under Nori
    // (z≈+1), giving the depth recession the concept art shows.
    gl_PointSize = max(1.5, aSize * pixelScale * 900.0 / -mv.z);
    gl_Position = projectionMatrix * mv;

    vAlpha = opacity * pulse;
    vSeed = aSeed;
    vBrightness = aBrightness;
    vAspect = aAspect;
  }
`,
  HM = `
  varying float vAlpha;
  varying float vSeed;
  varying float vBrightness;
  varying float vAspect;
  varying float vSwirl;

  void main() {
    // gl_PointCoord is 0..1 across the square sprite. Draw an axis-aligned
    // rectangle of width=1.0 and height=vAspect (centered).
    vec2 c = gl_PointCoord;
    float halfW = 0.45;
    float halfH = 0.45 * vAspect;
    vec2 d = abs(c - 0.5);
    // Hard box mask: discard outside the rectangle.
    if (d.x > halfW || d.y > halfH) discard;

    // Brightness ramp:
    //   bottom 60% → teal
    //   middle    → cyan
    //   top 20%   → near-saturated cyan-white
    vec3 dim  = vec3(0.10, 0.55, 0.78);
    vec3 teal = vec3(0.22, 0.86, 1.00);
    vec3 cyan = vec3(0.55, 1.00, 1.00);
    vec3 hot  = vec3(0.70, 1.00, 1.00);
    vec3 color = mix(dim, teal, smoothstep(0.0, 0.55, vBrightness));
    color = mix(color, cyan, smoothstep(0.50, 0.80, vBrightness));
    color = mix(color, hot,  smoothstep(0.80, 1.00, vBrightness));
    color *= 0.92 + vSeed * 0.14;

    float glow = 0.85 + smoothstep(0.75, 1.0, vBrightness) * 0.45;

    // Swirl current: modulate alpha so flowing arcs are visible. Bright
    // pixels keep a floor of 0.55, dim scatter pixels swing the full range.
    float floorAlpha = 0.30 + vBrightness * 0.45;
    float swirlAlpha = mix(floorAlpha, 1.0, vSwirl);

    gl_FragColor = vec4(color * glow, vAlpha * swirlAlpha);
  }
`,
  VM = `
  attribute float aSize;
  attribute float aSeed;
  attribute float aBrightness;
  uniform float time;
  uniform float opacity;
  varying float vAlpha;
  varying float vBrightness;

  void main() {
    vec3 pos = position;
    // Same drift as the parent pixel so the streak tracks its source.
    pos.x += sin(time * 0.30 + aSeed * 6.283) * 0.018;
    pos.z += cos(time * 0.24 + aSeed * 11.7) * 0.014;

    float tw = sin(time * (1.3 + aSeed * 1.9) + aSeed * 31.0) * 0.5 + 0.5;
    tw = pow(tw, 2.0);
    float pulse = 0.45 + 0.55 * tw;

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    // World-size aSize is the streak's screen height; same perspective law.
    gl_PointSize = max(3.0, aSize * 900.0 / -mv.z);
    gl_Position = projectionMatrix * mv;

    vAlpha = opacity * pulse;
    vBrightness = aBrightness;
  }
`,
  GM = `
  varying float vAlpha;
  varying float vBrightness;

  void main() {
    // gl_PointCoord: 0..1 with (0,0) at top-left. The streak sits as a thin
    // vertical band centered horizontally; alpha fades from full at the
    // top (source pixel) down to zero.
    vec2 c = gl_PointCoord;
    float dx = abs(c.x - 0.5);
    // Narrow horizontal slit (≈ 12% of the sprite width).
    float horiz = 1.0 - smoothstep(0.04, 0.10, dx);
    if (horiz <= 0.001) discard;

    // Vertical fade: bright near top (y≈0), nothing near bottom (y≈1).
    float vert = 1.0 - smoothstep(0.0, 0.95, c.y);
    vert = pow(vert, 1.4);

    vec3 cyan = vec3(0.45, 0.95, 1.00);
    vec3 mint = vec3(0.70, 1.00, 0.98);
    vec3 color = mix(cyan, mint, vBrightness * 0.5);

    float alpha = horiz * vert * vAlpha * (0.35 + vBrightness * 0.35);
    gl_FragColor = vec4(color, alpha);
  }
`,
  jM = `
  attribute float aSize;
  attribute float aSeed;
  uniform float time;
  uniform float opacity;
  varying float vAlpha;

  void main() {
    vec3 pos = position;
    pos.x += sin(time * 0.31 + aSeed * 7.7) * 0.025;
    pos.z += cos(time * 0.28 + aSeed * 5.1) * 0.022;

    float tw = sin(time * (1.1 + aSeed * 1.6) + aSeed * 19.0) * 0.5 + 0.5;
    tw = pow(tw, 1.6);
    vAlpha = opacity * (0.30 + 0.70 * tw);

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = aSize * (820.0 + tw * 360.0) / -mv.z;
    gl_Position = projectionMatrix * mv;
  }
`,
  YM = `
  varying float vAlpha;

  void main() {
    vec2 d = gl_PointCoord - 0.5;
    float r = length(d);
    if (r > 0.5) discard;
    float core = pow(1.0 - smoothstep(0.0, 0.5, r), 2.6);
    vec3 cyan = vec3(0.42, 0.95, 1.00);
    vec3 mint = vec3(0.82, 1.00, 0.95);
    vec3 color = mix(cyan, mint, core * 0.35);
    gl_FragColor = vec4(color, core * vAlpha * 0.40);
  }
`;
function Fv(c, t, i) {
  const s = Math.max(0, Math.min(1, (i - c) / (t - c)));
  return s * s * (3 - 2 * s);
}
function K1(c, t, i, s) {
  const o =
    0.55 * Math.sin(c * 0.28 + i) +
    0.24 * Math.sin(c * 0.62 - i * 0.6) +
    0.11 * Math.sin(c * 1.4 + i * 1.3);
  return t + o * s;
}
function qM(c) {
  return c < 0.32 ? Fv(0, 0.32, c) : c > Pc - 0.9 ? 1 - Fv(Pc - 0.9, Pc, c) : 1;
}
function Ka(c, t = Ds) {
  ((c.frustumCulled = !1), (c.renderOrder = t));
}
const Ya = [
    { lane: -4.4, phase: 0.2, wobble: 1.1, intensity: 0.9 },
    { lane: -2.7, phase: 1.4, wobble: 1.2, intensity: 1.05 },
    { lane: -1.05, phase: 2.55, wobble: 1, intensity: 0.95 },
    { lane: 1.2, phase: 3.8, wobble: 1, intensity: 0.95 },
    { lane: 2.9, phase: 5.05, wobble: 1.2, intensity: 1.05 },
    { lane: 4.6, phase: 6.3, wobble: 1.1, intensity: 0.9 },
  ],
  XM = Qa * 0.5;
function IM(c, t, i, s) {
  const o = c / (XM - i);
  return o * o <= 1;
}
function ZM(c, t) {
  const i = c / 0.85,
    s = (t - 0.1) / 0.7;
  return i * i + s * s < 1;
}
function PM(c) {
  let t = c(),
    i = Math.pow(t, 2.2);
  return (
    i < 0.25 && c() < 0.5 && ((t = 0.4 + c() * 0.6), (i = Math.pow(t, 2.2))),
    cu + (Vd - cu) * i
  );
}
function Lv(c) {
  const t = Ya[Math.min(Ya.length - 1, Math.floor(c() * Ya.length))],
    i = (c() - 0.5) * Qa * 0.98,
    s = t.lane * 0.4 - 5,
    o = K1(i, s, t.phase, t.wobble * 1.4),
    l = (c() - 0.5) * 1.2;
  let u = o + l;
  (u < Vd && (u = Vd + c() * 0.4), u > cu && (u = cu - c() * 0.4));
  const f = Math.exp(-(l * l) * 0.7),
    h = Math.min(1, 0.55 + f * 0.5 * t.intensity + c() * 0.05);
  return { x: i, z: u, brightness: h };
}
function kv(c) {
  const t = (c() - 0.5) * Qa * 0.96,
    i = PM(c),
    s = c(),
    o = s < 0.08 ? 0.8 + c() * 0.18 : 0.18 + s * 0.5;
  return { x: t, z: i, brightness: o };
}
function WM(c, t) {
  const i = t + 4,
    s = Math.atan2(i, c),
    o = Math.sqrt(c * c + i * i);
  return Math.sin(s * 1.6 + o * 0.7) * 0.7 + 0.6;
}
function JM(c) {
  for (let t = 0; t < 4; t++) {
    const i = c() < 0.55 ? Lv(c) : kv(c),
      s = WM(i.x, i.z),
      o = Math.max(0.15, Math.min(1, s));
    if (c() < o) return i;
  }
  return c() < 0.55 ? Lv(c) : kv(c);
}
function QM() {
  const c = new be(Qa * 1.05, Q1 * 1.05, 8, 8);
  c.rotateX(-Math.PI / 2);
  const t = new dt({
      uniforms: { time: { value: 0 }, opacity: { value: 0 } },
      vertexShader: NM,
      fragmentShader: UM,
      transparent: !0,
      depthWrite: !1,
      depthTest: !1,
      blending: wi,
      side: Ne,
    }),
    i = new $t(c, t);
  return (Ka(i, Ds - 0.02), { mesh: i, geometry: c, material: t });
}
function KM() {
  const c = new be(Qa, Q1, 80, 56);
  c.rotateX(-Math.PI / 2);
  const t = new dt({
      uniforms: { time: { value: 0 }, opacity: { value: 0 } },
      vertexShader: FM,
      fragmentShader: LM,
      transparent: !0,
      depthWrite: !1,
      depthTest: !1,
      blending: Rt,
      side: Ne,
    }),
    i = new $t(c, t);
  return (Ka(i, Ds - 0.01), { mesh: i, geometry: c, material: t });
}
function Ec(c, t, i, s) {
  const o = new Float32Array(t * 3),
    l = new Float32Array(t),
    u = new Float32Array(t),
    f = new Float32Array(t),
    h = new Float32Array(t);
  let p = 0,
    y = 0;
  const g = t * 6;
  for (; p < t && y < g;) {
    y++;
    const A = JM(c);
    IM(A.x, A.z, 0.4) &&
      ((ZM(A.x, A.z) && c() < 0.7) ||
        ((o[p * 3] = A.x),
        (o[p * 3 + 1] = 0.04 + c() * 0.04),
        (o[p * 3 + 2] = A.z),
        (l[p] = i.minSize + c() * (i.maxSize - i.minSize)),
        (u[p] = c()),
        (h[p] = i.minAspect + c() * (i.maxAspect - i.minAspect)),
        (f[p] = s ? Math.min(1, A.brightness + 0.2 + c() * 0.1) : A.brightness),
        p++));
  }
  for (; p < t;)
    ((o[p * 3] = 0),
      (o[p * 3 + 1] = -1e3),
      (o[p * 3 + 2] = 0),
      (l[p] = i.minSize),
      (u[p] = 0),
      (f[p] = 0),
      (h[p] = 1),
      p++);
  const v = new At();
  (v.setAttribute("position", new H(o, 3)),
    v.setAttribute("aSize", new H(l, 1)),
    v.setAttribute("aSeed", new H(u, 1)),
    v.setAttribute("aBrightness", new H(f, 1)),
    v.setAttribute("aAspect", new H(h, 1)));
  const b = new dt({
      uniforms: { time: { value: 0 }, opacity: { value: 0 }, pixelScale: { value: 1 } },
      vertexShader: kM,
      fragmentShader: HM,
      transparent: !0,
      depthWrite: !1,
      depthTest: !1,
      blending: Rt,
    }),
    S = new ne(v, b);
  return (
    Ka(S, s ? Ds + 0.04 : Ds + 0.02),
    { points: S, geometry: v, material: b, positions: o, brights: f }
  );
}
function $M(c, t, i) {
  const s = [];
  for (let b = 0; b < i.length; b++) {
    const S = t[b * 3 + 2];
    i[b] > 0.65 && S > -6 && s.push(b);
  }
  const o = Math.min(ka, s.length),
    l = new Float32Array(ka * 3),
    u = new Float32Array(ka),
    f = new Float32Array(ka),
    h = new Float32Array(ka),
    p = 0.4;
  for (let b = 0; b < ka; b++)
    if (b < o) {
      const S = s[Math.floor(c() * s.length)],
        A = t[S * 3],
        M = t[S * 3 + 2];
      ((l[b * 3] = A),
        (l[b * 3 + 1] = 0.04 + p * 0.5),
        (l[b * 3 + 2] = M),
        (u[b] = p),
        (f[b] = c()),
        (h[b] = i[S]));
    } else
      ((l[b * 3] = 0),
        (l[b * 3 + 1] = -1e3),
        (l[b * 3 + 2] = 0),
        (u[b] = p),
        (f[b] = 0),
        (h[b] = 0));
  const y = new At();
  (y.setAttribute("position", new H(l, 3)),
    y.setAttribute("aSize", new H(u, 1)),
    y.setAttribute("aSeed", new H(f, 1)),
    y.setAttribute("aBrightness", new H(h, 1)));
  const g = new dt({
      uniforms: { time: { value: 0 }, opacity: { value: 0 } },
      vertexShader: VM,
      fragmentShader: GM,
      transparent: !0,
      depthWrite: !1,
      depthTest: !1,
      blending: Rt,
    }),
    v = new ne(y, g);
  return (Ka(v, Ds + 0.005), { points: v, geometry: y, material: g });
}
function t5(c, t, i) {
  const s = new Float32Array(La * 3),
    o = new Float32Array(La),
    l = new Float32Array(La),
    u = [];
  for (let y = 0; y < i.length; y++) i[y] > 0.78 && u.push(y);
  if (u.length < La)
    for (let y = 0; y < i.length && u.length < La * 2; y++) i[y] > 0.55 && u.push(y);
  for (let y = 0; y < La; y++) {
    const g = u.length > 0 && c() < 0.9;
    let v, b;
    if (g) {
      const S = u[Math.floor(c() * u.length)];
      ((v = t[S * 3]), (b = t[S * 3 + 2]));
    } else {
      const S = Ya[Math.min(Ya.length - 1, Math.floor(c() * Ya.length))];
      ((v = (c() - 0.5) * Qa * 0.9), (b = K1(v, S.lane, S.phase, S.wobble) + (c() - 0.5) * 0.2));
    }
    ((s[y * 3] = v),
      (s[y * 3 + 1] = 0.06),
      (s[y * 3 + 2] = b),
      (o[y] = 0.14 + c() * 0.2),
      (l[y] = c()));
  }
  const f = new At();
  (f.setAttribute("position", new H(s, 3)),
    f.setAttribute("aSize", new H(o, 1)),
    f.setAttribute("aSeed", new H(l, 1)));
  const h = new dt({
      uniforms: { time: { value: 0 }, opacity: { value: 0 } },
      vertexShader: jM,
      fragmentShader: YM,
      transparent: !0,
      depthWrite: !1,
      depthTest: !1,
      blending: Rt,
    }),
    p = new ne(f, h);
  return (Ka(p, Ds + 0.01), { points: p, geometry: f, material: h });
}
class e5 {
  id;
  object;
  done = !1;
  reflection;
  flow;
  pixelsTiny;
  pixelsMid;
  pixelsLarge;
  blocks;
  streaks;
  bloom;
  elapsed = 0;
  constructor(t, i) {
    ((this.id = t),
      (this.object = new ve()),
      Ka(this.object),
      (this.reflection = QM()),
      (this.flow = KM()),
      (this.pixelsTiny = Ec(
        i,
        CM,
        { minSize: 0.018, maxSize: 0.024, minAspect: 0.9, maxAspect: 1.1 },
        !1,
      )),
      (this.pixelsMid = Ec(
        i,
        OM,
        { minSize: 0.04, maxSize: 0.05, minAspect: 0.85, maxAspect: 1.15 },
        !1,
      )),
      (this.pixelsLarge = Ec(
        i,
        BM,
        { minSize: 0.1, maxSize: 0.14, minAspect: 0.85, maxAspect: 1.2 },
        !0,
      )),
      (this.blocks = Ec(
        i,
        DM,
        { minSize: 0.12, maxSize: 0.22, minAspect: 1.8, maxAspect: 3.2 },
        !0,
      )),
      (this.streaks = $M(i, this.pixelsLarge.positions, this.pixelsLarge.brights)),
      (this.bloom = t5(i, this.pixelsLarge.positions, this.pixelsLarge.brights)),
      this.object.add(
        this.reflection.mesh,
        this.flow.mesh,
        this.streaks.points,
        this.bloom.points,
        this.pixelsTiny.points,
        this.pixelsMid.points,
        this.pixelsLarge.points,
        this.blocks.points,
      ));
  }
  update(t, i, s) {
    this.elapsed += i;
    const o = qM(this.elapsed);
    (this.elapsed >= Pc && (this.done = !0),
      this.object.position.set(s.position.x, s.position.y + RM, s.position.z - 0.18),
      (this.reflection.material.uniforms.time.value = this.elapsed),
      (this.reflection.material.uniforms.opacity.value = o),
      (this.flow.material.uniforms.time.value = this.elapsed),
      (this.flow.material.uniforms.opacity.value = o),
      (this.pixelsTiny.material.uniforms.time.value = this.elapsed),
      (this.pixelsTiny.material.uniforms.opacity.value = o),
      (this.pixelsMid.material.uniforms.time.value = this.elapsed),
      (this.pixelsMid.material.uniforms.opacity.value = o),
      (this.pixelsLarge.material.uniforms.time.value = this.elapsed),
      (this.pixelsLarge.material.uniforms.opacity.value = o),
      (this.blocks.material.uniforms.time.value = this.elapsed),
      (this.blocks.material.uniforms.opacity.value = o),
      (this.streaks.material.uniforms.time.value = this.elapsed),
      (this.streaks.material.uniforms.opacity.value = o),
      (this.bloom.material.uniforms.time.value = this.elapsed),
      (this.bloom.material.uniforms.opacity.value = o));
  }
  dispose() {
    (this.reflection.geometry.dispose(),
      this.reflection.material.dispose(),
      this.flow.geometry.dispose(),
      this.flow.material.dispose(),
      this.pixelsTiny.geometry.dispose(),
      this.pixelsTiny.material.dispose(),
      this.pixelsMid.geometry.dispose(),
      this.pixelsMid.material.dispose(),
      this.pixelsLarge.geometry.dispose(),
      this.pixelsLarge.material.dispose(),
      this.blocks.geometry.dispose(),
      this.blocks.material.dispose(),
      this.streaks.geometry.dispose(),
      this.streaks.material.dispose(),
      this.bloom.geometry.dispose(),
      this.bloom.material.dispose());
  }
}
xe("data-sea-tidepool", (c) => {
  c.add(new e5(c.nextId("data-sea-tidepool"), c.rng));
});
const si = 32,
  Hv = 10,
  i5 = 12,
  ir = 18e3,
  nr = 2600,
  Gd = 3,
  xn = 6,
  Ar = -3,
  Mr = 4.5,
  n5 = 2.4,
  _r = 2.8,
  s5 = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`,
  a5 = `
  precision highp float;

  uniform float time;
  uniform float opacity;
  varying vec2 vUv;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  void main() {
    // Horizontal scanlines — fine ~140 lines across the plane.
    float scan = 0.5 + 0.5 * sin(vUv.y * 280.0);
    scan = pow(scan, 3.0);

    // Per-line dropout: occasional rows drop out / brighten with time.
    float row = floor(vUv.y * 140.0);
    float drop = step(0.86, hash(vec2(row, floor(time * 1.3))));
    float bright = step(0.92, hash(vec2(row, floor(time * 2.1) + 7.0)));

    // Faint vertical grid hairs for a glitch matrix feel.
    float col = floor(vUv.x * 60.0);
    float colJitter = hash(vec2(col, floor(time * 0.6)));
    float verticalHair = step(0.96, colJitter) * 0.08;

    float ink = scan * 0.10 + drop * 0.18 + bright * 0.30 + verticalHair;
    vec3 tint = mix(vec3(0.45, 0.50, 0.58), vec3(0.85, 0.92, 1.00), bright);
    gl_FragColor = vec4(tint * ink, ink * opacity);
  }
`,
  o5 = `
  attribute vec3 aOffset;
  attribute vec2 aSize;
  attribute float aSpinZ;
  attribute float aTiltX;
  attribute float aTiltY;
  attribute float aSeed;
  attribute float aFlagged;
  attribute float aDepth;       // 0 = far, 0.5 = mid, 1.0 = near
  attribute float aOrbitR;      // orbital radius for slow swirl
  attribute float aOrbitPhase;  // initial phase
  attribute float aOrbitRate;   // angular speed

  uniform float time;
  uniform float opacity;

  varying vec2 vUv;
  varying float vAlpha;
  varying float vSeed;
  varying float vFlagged;
  varying float vDepth;

  mat3 rotX(float a) {
    float c = cos(a); float s = sin(a);
    return mat3(1.0, 0.0, 0.0, 0.0, c, -s, 0.0, s, c);
  }
  mat3 rotY(float a) {
    float c = cos(a); float s = sin(a);
    return mat3(c, 0.0, s, 0.0, 1.0, 0.0, -s, 0.0, c);
  }
  mat3 rotZ(float a) {
    float c = cos(a); float s = sin(a);
    return mat3(c, -s, 0.0, s, c, 0.0, 0.0, 0.0, 1.0);
  }

  void main() {
    vec3 p = vec3(position.xy * aSize, 0.0);

    // Per-instance perspective tilt around X and Y axes, plus a slow Z spin
    // so envelopes feel like paper tumbling. Far envelopes tumble more slowly.
    float spinMul = mix(0.55, 1.15, aDepth);
    float tiltX = aTiltX + sin(time * 0.7 * spinMul + aSeed * 9.0) * 0.18;
    float tiltY = aTiltY + cos(time * 0.6 * spinMul + aSeed * 11.0) * 0.18;
    float zAng = aSpinZ * time + sin(time * 1.4 + aSeed * 5.0) * 0.10;
    p = rotZ(zAng) * rotX(tiltX) * rotY(tiltY) * p;

    // Orbital swirl around the anchor offset — gives the "storm" rotation feel.
    float orbitAng = aOrbitPhase + time * aOrbitRate;
    vec3 orbit = vec3(
      cos(orbitAng) * aOrbitR,
      sin(orbitAng) * aOrbitR * 0.65,
      0.0
    );

    vec3 drift = vec3(
      sin(time * 0.6 + aSeed * 7.0) * 0.22 - time * 0.08,
      cos(time * 0.5 + aSeed * 13.0) * 0.20 - time * 0.04,
      sin(time * 0.4 + aSeed * 17.0) * 0.14
    );
    vec3 pos = p + aOffset + orbit + drift;

    vUv = uv;
    vSeed = aSeed;
    vFlagged = aFlagged;
    vDepth = aDepth;

    // Far envelopes ~0.25 alpha, near ~0.95 alpha.
    float depthAlpha = mix(0.25, 0.95, aDepth);
    vAlpha = opacity * depthAlpha;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`,
  r5 = `
  precision highp float;

  uniform float time;

  varying vec2 vUv;
  varying float vAlpha;
  varying float vSeed;
  varying float vFlagged;
  varying float vDepth;

  float hash21(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  float sdRoundRect(vec2 p, vec2 b, float r) {
    vec2 d = abs(p) - b + vec2(r);
    return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0) - r;
  }

  float sdSegment(vec2 p, vec2 a, vec2 b) {
    vec2 pa = p - a;
    vec2 ba = b - a;
    float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
    return length(pa - ba * h);
  }

  // SDF of the envelope outline (round-rect body + flap diagonals).
  float envelopeOutlineSdf(vec2 p) {
    float body = sdRoundRect(p, vec2(0.72, 0.44), 0.05);
    float bodyOutline = abs(body);
    vec2 tipL = vec2(-0.72, 0.44);
    vec2 tipR = vec2(0.72, 0.44);
    vec2 tipC = vec2(0.0, 0.10);
    float flap = min(sdSegment(p, tipL, tipC), sdSegment(p, tipR, tipC));
    float bodyInside = step(body, 0.0);
    // Flap line only visible inside the body silhouette.
    float flapLine = mix(1.0e3, flap, bodyInside);
    return min(bodyOutline, flapLine);
  }

  void main() {
    // UV centered, envelope shape is ~1.6 wide, 1.0 tall.
    vec2 p = (vUv - 0.5) * vec2(1.6, 1.0);

    // Far envelopes use a wider, softer outline falloff (acts as blur).
    // Near envelopes use a tight, sharp outline.
    float outlineSharp = mix(28.0, 70.0, vDepth);

    float body = sdRoundRect(p, vec2(0.72, 0.44), 0.05);
    float bodyInside = step(body, 0.0);

    // RGB-split chromatic aberration: offset the SDF sample per channel along
    // a depth-modulated axis. Near envelopes get a tighter split, far ones
    // ghost wider for that hazy CRT feel.
    float caStrength = mix(0.022, 0.008, vDepth);
    vec2 caAxis = vec2(1.0, 0.35);
    float sdfR = envelopeOutlineSdf(p - caAxis * caStrength);
    float sdfG = envelopeOutlineSdf(p);
    float sdfB = envelopeOutlineSdf(p + caAxis * caStrength);
    float lineR = exp(-pow(sdfR * outlineSharp, 2.0));
    float lineG = exp(-pow(sdfG * outlineSharp, 2.0));
    float lineB = exp(-pow(sdfB * outlineSharp, 2.0));
    float lineMax = max(lineR, max(lineG, lineB));

    // FILLED paper body — semi-opaque white/grey with hashed step dither.
    // Pixelate the UV to a coarse grid so the dither reads as bitmap-style.
    vec2 pixel = floor(vUv * 64.0) / 64.0;
    float ditherHash = hash21(pixel + floor(vSeed * 37.0));
    float ditherStep = step(0.55, ditherHash);
    // Slight horizontal scan corruption inside the paper.
    float scanRow = floor(vUv.y * 36.0);
    float scanDropout = step(0.88, hash21(vec2(scanRow, floor(vSeed * 11.0))));
    vec3 paperBase = vec3(0.85, 0.85, 0.88);
    vec3 paperDark = vec3(0.62, 0.63, 0.68);
    vec3 paperColor = mix(paperDark, paperBase, ditherStep);
    paperColor = mix(paperColor, vec3(0.95, 0.96, 1.00), scanDropout * 0.45);
    float fillAlpha = 0.55 * bodyInside;

    // Rim glow — strongest on far envelopes for that hazy depth halo.
    float rimSharp = mix(12.0, 22.0, vDepth);
    float rimStrength = mix(0.55, 0.28, vDepth);
    float rim = exp(-pow(body * rimSharp, 2.0)) * rimStrength;

    // Composite: paper fill underneath, then RGB-split outline ghosting,
    // then a faint rim halo. We're using NormalBlending so col is the
    // pre-blend RGB and alpha is the coverage.
    float alpha = clamp(fillAlpha + lineMax * 0.95 + rim * 0.6, 0.0, 1.0);
    vec3 col = paperColor;
    // Outline glow per-channel — mix toward bright line color where each
    // channel SDF lands, producing chromatic fringes.
    col = mix(col, vec3(1.0, 0.55, 0.55), lineR * 0.85);
    col = mix(col, vec3(0.55, 1.0, 0.55), lineG * 0.85);
    col = mix(col, vec3(0.55, 0.55, 1.0), lineB * 0.85);
    // Pure-white core where all three channels overlap.
    float lineCore = min(lineR, min(lineG, lineB));
    col = mix(col, vec3(0.96, 0.98, 1.00), lineCore * 0.9);
    col += vec3(0.30, 0.55, 0.85) * rim * 0.6;

    // Red error stamp on flagged envelopes — small bright square upper-right.
    if (vFlagged > 0.5) {
      vec2 stamp = p - vec2(0.42, 0.20);
      float sd = max(abs(stamp.x), abs(stamp.y));
      float stampMask = 1.0 - smoothstep(0.05, 0.085, sd);
      float pulse = 0.65 + 0.35 * sin(time * 6.0 + vSeed * 23.0);
      col += vec3(1.0, 0.18, 0.05) * stampMask * pulse * 1.4;
      alpha = max(alpha, stampMask * pulse);
    }

    alpha *= vAlpha;
    if (alpha <= 0.01) discard;
    gl_FragColor = vec4(col, alpha);
  }
`,
  l5 = `
  attribute float aSize;
  attribute float aSeed;
  attribute float aBrightness;

  uniform float time;
  uniform float opacity;

  varying float vAlpha;
  varying float vBrightness;

  void main() {
    vec3 pos = position;
    pos.x += sin(time * 0.7 + aSeed * 17.0) * 0.10 - time * 0.05;
    pos.y += cos(time * 0.6 + aSeed * 23.0) * 0.08 - time * 0.03;

    float blink = step(0.18, fract(time * (0.9 + aSeed * 1.3) + aSeed * 7.0));
    float pulse = 0.55 + 0.45 * sin(time * (2.0 + aSeed * 3.0) + aSeed * 19.0);
    vAlpha = opacity * (0.55 + 0.45 * pulse) * mix(0.5, 1.0, blink);
    vBrightness = aBrightness;

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = max(2.0, aSize * 220.0 / -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`,
  c5 = `
  precision highp float;

  varying float vAlpha;
  varying float vBrightness;

  void main() {
    vec2 d = gl_PointCoord - 0.5;
    float absMax = max(abs(d.x), abs(d.y));
    float core = 1.0 - smoothstep(0.34, 0.48, absMax);
    if (core <= 0.01) discard;

    vec3 dim  = vec3(0.55, 0.60, 0.66);
    vec3 mid  = vec3(0.85, 0.88, 0.92);
    vec3 hot  = vec3(1.00, 1.00, 1.00);
    vec3 col = mix(dim, mid, vBrightness);
    col = mix(col, hot, vBrightness * vBrightness);

    gl_FragColor = vec4(col, core * vAlpha);
  }
`,
  u5 = `
  attribute float aSize;
  attribute float aSeed;
  attribute float aHeat;     // 0 = deep red, 1 = orange-hot

  uniform float time;
  uniform float opacity;

  varying float vAlpha;
  varying float vHeat;

  void main() {
    vec3 pos = position;
    pos.x += sin(time * 0.8 + aSeed * 21.0) * 0.06 - time * 0.05;
    pos.y += cos(time * 0.7 + aSeed * 29.0) * 0.08 - time * 0.03;

    // Twinkle stays bright — floor at 0.7 so shards never fade to invisible.
    float twinkle = 0.5 + 0.5 * sin(time * (3.0 + aSeed * 4.0) + aSeed * 31.0);
    twinkle = pow(twinkle, 1.6);
    float blink = step(0.04, fract(time * (1.2 + aSeed * 1.7) + aSeed * 3.0));
    vAlpha = opacity * (0.70 + 0.30 * twinkle) * mix(0.75, 1.0, blink);
    vHeat = aHeat;

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    // abs() so points at positive-camera-space-z (in front of origin) still
    // get sized correctly; max() guarantees a visible floor.
    gl_PointSize = max(6.0, aSize * 320.0 / max(0.4, abs(mv.z)));
    gl_Position = projectionMatrix * mv;
  }
`,
  h5 = `
  precision highp float;

  varying float vAlpha;
  varying float vHeat;

  void main() {
    vec2 d = gl_PointCoord - 0.5;
    float absMax = max(abs(d.x), abs(d.y));
    // Square pixel TV-corruption shape, not soft dot — keep edges crisp.
    float core = 1.0 - smoothstep(0.38, 0.50, absMax);
    if (core <= 0.01) discard;
    // Punchy warm red with a hot orange minority. Alpha forced to 0.95 so
    // the shards stay clearly visible under additive blending.
    vec3 red = vec3(1.0, 0.18, 0.05);
    vec3 hot = vec3(1.0, 0.55, 0.18);
    vec3 col = mix(red, hot, vHeat);
    gl_FragColor = vec4(col, core * vAlpha * 0.95);
  }
`;
function Qt(c, t, i) {
  return t + (i - t) * c();
}
function f5(c) {
  if (c < 0 || c >= Gd) return 0;
  const t = Math.min(1, c / 0.25),
    i = Math.min(1, (Gd - c) / 0.55);
  return Math.max(0, Math.min(1, t * i)) * 0.95;
}
function d5(c, t) {
  let i = Qt(c, -xn, xn);
  Math.abs(i) < 0.9 && (i = (i < 0 ? -1 : 1) * (0.9 + c() * (xn - 0.9)));
  const s = Qt(c, Ar, Mr),
    l = (t - 0.5) * 2 * n5 * 0.6 + Qt(c, -0.3, 0.3);
  return { x: i, y: s, z: l };
}
function p5(c) {
  const t = new be(xn * 2.4, (Mr - Ar) * 1.25),
    i = new dt({
      uniforms: c,
      vertexShader: s5,
      fragmentShader: a5,
      transparent: !0,
      depthWrite: !1,
      depthTest: !1,
      blending: Rt,
    }),
    s = new $t(t, i);
  return (
    s.position.set(0, (Ar + Mr) * 0.5, -_r - 0.5),
    (s.frustumCulled = !1),
    (s.renderOrder = 3),
    { mesh: s, geometry: t, material: i }
  );
}
function m5(c, t) {
  const i = new be(1, 1),
    s = new P1();
  ((s.index = i.index),
    s.setAttribute("position", i.getAttribute("position")),
    s.setAttribute("uv", i.getAttribute("uv")),
    i.dispose());
  const o = new Float32Array(si * 3),
    l = new Float32Array(si * 2),
    u = new Float32Array(si),
    f = new Float32Array(si),
    h = new Float32Array(si),
    p = new Float32Array(si),
    y = new Float32Array(si),
    g = new Float32Array(si),
    v = new Float32Array(si),
    b = new Float32Array(si),
    S = new Float32Array(si),
    A = (35 * Math.PI) / 180;
  for (let O = 0; O < si; O++) {
    let C;
    (O < Hv ? (C = 0) : O < Hv + i5 ? (C = 0.5) : (C = 1), (g[O] = C));
    const E = d5(c, C);
    ((o[O * 3] = E.x), (o[O * 3 + 1] = E.y), (o[O * 3 + 2] = E.z));
    let U;
    C === 0
      ? (U = c() < 0.25 ? Qt(c, 2.4, 3) : Qt(c, 1.6, 2.4))
      : C === 0.5
        ? (U = Qt(c, 0.9, 1.6))
        : (U = c() < 0.25 ? Qt(c, 0.4, 0.6) : Qt(c, 0.6, 1));
    const q = U * Qt(c, 0.56, 0.74);
    ((l[O * 2] = U),
      (l[O * 2 + 1] = q),
      (u[O] = Qt(c, -0.35, 0.35)),
      (f[O] = Qt(c, -A, A)),
      (h[O] = Qt(c, -A, A)),
      (p[O] = c()),
      (y[O] = c() < 0.55 ? 1 : 0),
      (v[O] = C === 0 ? Qt(c, 0.25, 0.55) : Qt(c, 0.1, 0.3)),
      (b[O] = c() * Math.PI * 2),
      (S[O] = Qt(c, -0.45, 0.45)));
  }
  (s.setAttribute("aOffset", new kt(o, 3)),
    s.setAttribute("aSize", new kt(l, 2)),
    s.setAttribute("aSpinZ", new kt(u, 1)),
    s.setAttribute("aTiltX", new kt(f, 1)),
    s.setAttribute("aTiltY", new kt(h, 1)),
    s.setAttribute("aSeed", new kt(p, 1)),
    s.setAttribute("aFlagged", new kt(y, 1)),
    s.setAttribute("aDepth", new kt(g, 1)),
    s.setAttribute("aOrbitR", new kt(v, 1)),
    s.setAttribute("aOrbitPhase", new kt(b, 1)),
    s.setAttribute("aOrbitRate", new kt(S, 1)),
    (s.instanceCount = si));
  const M = new dt({
      uniforms: t,
      vertexShader: o5,
      fragmentShader: r5,
      transparent: !0,
      depthWrite: !1,
      depthTest: !1,
      blending: wi,
      side: Ne,
    }),
    T = new $t(s, M);
  return ((T.frustumCulled = !1), (T.renderOrder = 5), { mesh: T, geometry: s, material: M });
}
function y5(c, t) {
  const i = new Float32Array(ir * 3),
    s = new Float32Array(ir),
    o = new Float32Array(ir),
    l = new Float32Array(ir);
  for (let p = 0; p < ir; p++)
    ((i[p * 3] = Qt(c, -xn, xn)),
      (i[p * 3 + 1] = Qt(c, Ar, Mr)),
      (i[p * 3 + 2] = Qt(c, -_r, _r - 0.5)),
      (s[p] = c() < 0.3 ? Qt(c, 0.08, 0.12) : Qt(c, 0.02, 0.04)),
      (o[p] = c()),
      (l[p] = Math.pow(c(), 1.8)));
  const u = new At();
  (u.setAttribute("position", new H(i, 3)),
    u.setAttribute("aSize", new H(s, 1)),
    u.setAttribute("aSeed", new H(o, 1)),
    u.setAttribute("aBrightness", new H(l, 1)));
  const f = new dt({
      uniforms: t,
      vertexShader: l5,
      fragmentShader: c5,
      transparent: !0,
      depthWrite: !1,
      depthTest: !1,
      blending: wi,
    }),
    h = new ne(u, f);
  return ((h.frustumCulled = !1), (h.renderOrder = 4), { points: h, geometry: u, material: f });
}
function g5(c, t) {
  const i = new Float32Array(nr * 3),
    s = new Float32Array(nr),
    o = new Float32Array(nr),
    l = new Float32Array(nr);
  for (let p = 0; p < nr; p++) {
    let y;
    (c() < 0.65 ? (y = Qt(c, -xn, 1)) : (y = Qt(c, -xn, xn)),
      (i[p * 3] = y),
      (i[p * 3 + 1] = Qt(c, Ar, Mr)),
      (i[p * 3 + 2] = Qt(c, -_r * 0.9, _r * 0.6)),
      (s[p] = Qt(c, 0.12, 0.2)),
      (o[p] = c()),
      (l[p] = Math.pow(c(), 2.4) * 0.6));
  }
  const u = new At();
  (u.setAttribute("position", new H(i, 3)),
    u.setAttribute("aSize", new H(s, 1)),
    u.setAttribute("aSeed", new H(o, 1)),
    u.setAttribute("aHeat", new H(l, 1)));
  const f = new dt({
      uniforms: t,
      vertexShader: u5,
      fragmentShader: h5,
      transparent: !0,
      depthWrite: !1,
      depthTest: !1,
      blending: Rt,
    }),
    h = new ne(u, f);
  return ((h.frustumCulled = !1), (h.renderOrder = 6), { points: h, geometry: u, material: f });
}
class v5 {
  id;
  object;
  done = !1;
  uniforms = { time: { value: 0 }, opacity: { value: 0 } };
  backdrop;
  envelopes;
  debris;
  shards;
  elapsed = 0;
  constructor(t, i) {
    ((this.id = t),
      (this.object = new ve()),
      (this.object.frustumCulled = !1),
      (this.object.renderOrder = 4),
      (this.backdrop = p5(this.uniforms)),
      (this.envelopes = m5(i, this.uniforms)),
      (this.debris = y5(i, this.uniforms)),
      (this.shards = g5(i, this.uniforms)),
      this.object.add(
        this.backdrop.mesh,
        this.debris.points,
        this.envelopes.mesh,
        this.shards.points,
      ));
  }
  update(t, i, s) {
    ((this.elapsed += i),
      this.elapsed >= Gd && (this.done = !0),
      this.object.position.copy(s.position),
      (this.uniforms.time.value = this.elapsed),
      (this.uniforms.opacity.value = f5(this.elapsed)));
  }
  dispose() {
    (this.backdrop.geometry.dispose(),
      this.backdrop.material.dispose(),
      this.envelopes.geometry.dispose(),
      this.envelopes.material.dispose(),
      this.debris.geometry.dispose(),
      this.debris.material.dispose(),
      this.shards.geometry.dispose(),
      this.shards.material.dispose());
  }
}
xe("dead-letter-storm", (c) => {
  c.add(new v5(c.nextId("dead-letter-storm"), c.rng));
});
const Vv = 2.4,
  Rc = 600,
  b5 = 12,
  Gv = 8,
  x5 = 12,
  jv = 8,
  Yv = `
  varying vec2 vUv;
  varying float vDepth;
  void main() {
    vUv = uv;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    // View-space depth (positive = farther). Camera looks down -Z.
    vDepth = -mv.z;
    gl_Position = projectionMatrix * mv;
  }
`,
  qv = `
  precision highp float;

  varying vec2 vUv;
  varying float vDepth;

  uniform float time;
  uniform float envelope;
  uniform vec2  cells;      // (rowsU, rowsV)
  uniform float ribbonSeed; // per-plane seed so the two planes pick different ribbon edges
  uniform vec2  fadeAxis;   // which UV axes to fade at the far edge (1 = fade, 0 = ignore)

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  void main() {
    vec2 grid = vUv * cells;
    vec2 cell = floor(grid);
    vec2 f    = fract(grid);

    // Thin glowing lines on a near-black background. We also stamp a harder
    // "always on" mask via step() so even far-back cells keep readable lines
    // instead of dissolving below the smoothstep threshold.
    float lineThick = 0.045;
    float lineU = 1.0 - smoothstep(0.0, lineThick, min(f.x, 1.0 - f.x));
    float lineV = 1.0 - smoothstep(0.0, lineThick, min(f.y, 1.0 - f.y));
    float lineSmooth = max(lineU, lineV);
    float lineHardU = 1.0 - step(0.04, min(f.x, 1.0 - f.x));
    float lineHardV = 1.0 - step(0.04, min(f.y, 1.0 - f.y));
    float lineMask = max(lineHardU, lineHardV);
    float line = max(lineSmooth, mix(0.0, 1.0, lineMask) * 1.5);

    // Per-cell flicker so the grid breathes.
    float cellHash = hash(cell);
    float flicker = 0.75 + 0.25 * sin(time * (2.5 + cellHash * 6.0) + cellHash * 31.4);

    // Bright nodes at intersections — every 3rd intersection.
    vec2 nodeMod = mod(cell, vec2(3.0));
    float nodePattern = step(nodeMod.x, 0.5) * step(nodeMod.y, 0.5);
    float nodeExtra = step(0.92, hash(cell + vec2(7.1, 3.3)));
    float nodeMask = max(nodePattern, nodeExtra);

    vec2 nd = f - 0.5;
    float nodeR = length(nd);
    float nodeCore = exp(-nodeR * nodeR * 28.0);
    float node = nodeCore * nodeMask;

    // Ribbon traces.
    float ribbonH = 0.0;
    float ribbonV = 0.0;
    for (int i = 0; i < 6; i++) {
      float fi = float(i);
      float rowPick = floor(hash(vec2(fi, ribbonSeed)) * cells.y);
      float rowEdge = step(abs(cell.y - rowPick), 0.5);
      float rowLine = 1.0 - smoothstep(0.0, lineThick * 1.3, min(f.y, 1.0 - f.y));
      float pulseH = 0.55 + 0.45 * sin(time * 3.2 + fi * 1.7 + ribbonSeed);
      ribbonH = max(ribbonH, rowEdge * rowLine * pulseH);

      float colPick = floor(hash(vec2(fi + 17.0, ribbonSeed)) * cells.x);
      float colEdge = step(abs(cell.x - colPick), 0.5);
      float colLine = 1.0 - smoothstep(0.0, lineThick * 1.3, min(f.x, 1.0 - f.x));
      float pulseV = 0.55 + 0.45 * sin(time * 2.8 + fi * 2.3 + ribbonSeed + 0.7);
      ribbonV = max(ribbonV, colEdge * colLine * pulseV);
    }
    float ribbon = max(ribbonH, ribbonV);

    // Edge fade.
    float fadeU = mix(1.0, smoothstep(0.0, 0.12, vUv.x) * (1.0 - smoothstep(0.88, 1.0, vUv.x)), fadeAxis.x);
    float fadeV = mix(1.0, smoothstep(0.0, 0.08, vUv.y) * (1.0 - smoothstep(0.85, 1.0, vUv.y)), fadeAxis.y);
    float edgeFade = fadeU * fadeV;

    // Perspective fog: distant cells dim heavily, near cells stay bright.
    // vDepth ~ 1..12 across the planes; fade to ~0.18 at the far end.
    float fog = clamp(1.0 - (vDepth - 1.5) / 9.0, 0.18, 1.0);

    float baseLine = line * flicker * 0.55;
    float total = (baseLine + ribbon * 1.0 + node * 1.6) * edgeFade * fog;

    if (total <= 0.003) discard;

    // HARD-LOCKED red-orange palette. No blue, no teal, no cyan possible.
    // Base = vec3(0.95, 0.35, 0.08), hot nodes = vec3(1.0, 0.55, 0.12).
    vec3 baseCol   = vec3(0.95, 0.35, 0.08);
    vec3 brightCol = vec3(1.00, 0.55, 0.12);

    float brightMix = clamp(node * 1.5 + ribbon * 0.6, 0.0, 1.0);
    vec3 col = mix(baseCol, brightCol, brightMix);

    // Hot foreground rows: nearest two rows of the floor saturate to bright
    // pure red, fading into mid-ground. Driven by vDepth so it only affects
    // the floor (wall stays at near-constant depth).
    float hotRow = 1.0 - smoothstep(1.5, 3.5, vDepth);
    col = mix(col, vec3(1.00, 0.40, 0.08), hotRow * 0.85);

    float intensity = total * envelope;
    vec3 outCol = col * intensity;

    // Belt-and-suspenders: force red dominance. Blue zeroed; green capped at
    // 45% of red. Mathematically impossible to read as blue/teal/cyan.
    outCol.r = max(outCol.r, 0.0);
    outCol.g = clamp(outCol.g, 0.0, outCol.r * 0.45);
    outCol.b = 0.0;

    gl_FragColor = vec4(outCol, clamp(intensity, 0.0, 1.0));
  }
`,
  S5 = `
  attribute float aSize;
  attribute float aSeed;
  uniform float time;
  varying float vSeed;

  void main() {
    vec3 p = position;
    p.y += sin(time * 0.6 + aSeed * 7.3) * 0.05;
    p.x += sin(time * 0.4 + aSeed * 5.1) * 0.04;
    vSeed = aSeed;

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_PointSize = aSize * 280.0 / -mv.z;
    gl_Position = projectionMatrix * mv;
  }
`,
  w5 = `
  precision highp float;
  uniform float envelope;
  varying float vSeed;

  void main() {
    vec2 d = gl_PointCoord - 0.5;
    // Square embers, hard edges.
    float square = step(abs(d.x), 0.42) * step(abs(d.y), 0.42);
    if (square < 0.5) discard;

    float twinkle = 0.55 + 0.45 * sin(vSeed * 53.0);
    // HARD-LOCKED red-orange ember. Blue zeroed, green capped at 45% of red.
    vec3 col = vec3(0.95, 0.35, 0.08);
    col.g = clamp(col.g, 0.0, col.r * 0.45);
    col.b = 0.0;
    float alpha = 0.45 * twinkle * envelope;
    gl_FragColor = vec4(col, alpha);
  }
`;
function Cc(c, t, i) {
  return t + (i - t) * c();
}
class A5 {
  id;
  object;
  done = !1;
  rng;
  floorGeom;
  floorMat;
  floorMesh;
  wallGeom;
  wallMat;
  wallMesh;
  emberGeom;
  emberMat;
  emberPoints;
  floorUniforms = {
    time: { value: 0 },
    envelope: { value: 0 },
    cells: { value: new tt(24, 16) },
    ribbonSeed: { value: 0 },
    fadeAxis: { value: new tt(1, 1) },
  };
  wallUniforms = {
    time: { value: 0 },
    envelope: { value: 0 },
    cells: { value: new tt(24, 16) },
    ribbonSeed: { value: 0 },
    fadeAxis: { value: new tt(1, 1) },
  };
  emberUniforms = { time: { value: 0 }, envelope: { value: 0 } };
  built = !1;
  startTime = null;
  elapsed = 0;
  constructor(t) {
    ((this.id = t.id),
      (this.rng = t.rng),
      (this.object = new ve()),
      (this.object.frustumCulled = !1),
      (this.object.renderOrder = 4),
      (this.floorUniforms.ribbonSeed.value = this.rng() * 100),
      (this.wallUniforms.ribbonSeed.value = this.rng() * 100 + 200),
      (this.floorGeom = new be(b5, Gv, 1, 1)),
      (this.floorMat = new dt({
        uniforms: this.floorUniforms,
        vertexShader: Yv,
        fragmentShader: qv,
        transparent: !0,
        depthWrite: !1,
        blending: Rt,
        side: Ne,
      })),
      (this.floorMesh = new $t(this.floorGeom, this.floorMat)),
      (this.floorMesh.frustumCulled = !1),
      (this.floorMesh.renderOrder = 3),
      (this.wallGeom = new be(x5, jv, 1, 1)),
      (this.wallMat = new dt({
        uniforms: this.wallUniforms,
        vertexShader: Yv,
        fragmentShader: qv,
        transparent: !0,
        depthWrite: !1,
        blending: Rt,
        side: Ne,
      })),
      (this.wallMesh = new $t(this.wallGeom, this.wallMat)),
      (this.wallMesh.frustumCulled = !1),
      (this.wallMesh.renderOrder = 2),
      (this.emberGeom = new At()),
      (this.emberMat = new dt({
        uniforms: this.emberUniforms,
        vertexShader: S5,
        fragmentShader: w5,
        transparent: !0,
        depthWrite: !1,
        blending: Rt,
      })),
      (this.emberPoints = new ne(this.emberGeom, this.emberMat)),
      (this.emberPoints.frustumCulled = !1),
      (this.emberPoints.renderOrder = 5),
      this.object.add(this.floorMesh, this.wallMesh, this.emberPoints));
  }
  update(t, i, s) {
    ((this.startTime ??= t),
      this.built || (this.build(s), (this.built = !0)),
      (this.elapsed = t - this.startTime));
    const o = this.elapsed,
      l = Math.min(1, o / 0.18),
      u = 1.7,
      f = 1 - Math.max(0, (o - u) / (Vv - u)),
      h = Math.max(0, l * f);
    ((this.floorUniforms.time.value = o),
      (this.floorUniforms.envelope.value = h),
      (this.wallUniforms.time.value = o),
      (this.wallUniforms.envelope.value = h),
      (this.emberUniforms.time.value = o),
      (this.emberUniforms.envelope.value = h),
      (this.done = o >= Vv));
  }
  dispose() {
    (this.floorGeom.dispose(),
      this.floorMat.dispose(),
      this.wallGeom.dispose(),
      this.wallMat.dispose(),
      this.emberGeom.dispose(),
      this.emberMat.dispose());
  }
  build(t) {
    (this.placeFloor(t), this.placeWall(t), this.buildEmbers(t));
  }
  placeFloor(t) {
    const i = t.position.x,
      s = t.position.z;
    (this.floorMesh.position.set(i, -2.8, s - Gv * 0.25),
      this.floorMesh.rotation.set(-Math.PI * 0.5, 0, 0));
  }
  placeWall(t) {
    const i = t.position.x,
      s = t.position.y,
      l = t.position.z - 4,
      u = s - t.size.y * 0.5 + jv * 0.4;
    (this.wallMesh.position.set(i, u, l), this.wallMesh.rotation.set(0, 0, 0));
  }
  buildEmbers(t) {
    const i = t.position.x,
      s = t.position.z,
      o = new Float32Array(Rc * 3),
      l = new Float32Array(Rc),
      u = new Float32Array(Rc),
      f = -2.8;
    for (let h = 0; h < Rc; h++) {
      let p = i + Cc(this.rng, -6, 6);
      const y = s + Cc(this.rng, -5, -1),
        g = f + Cc(this.rng, 0.2, 4.5);
      (Math.abs(p - i) < 0.6 &&
        y > s - 2.5 &&
        g > f + 0.5 &&
        g < f + t.size.y &&
        (p += p >= i ? 1 : -1),
        (o[h * 3] = p),
        (o[h * 3 + 1] = g),
        (o[h * 3 + 2] = y),
        (l[h] = Cc(this.rng, 0.06, 0.18)),
        (u[h] = this.rng() * 100));
    }
    (this.emberGeom.setAttribute("position", new H(o, 3)),
      this.emberGeom.setAttribute("aSize", new H(l, 1)),
      this.emberGeom.setAttribute("aSeed", new H(u, 1)));
  }
}
xe("firewall-shear", (c) => {
  c.add(new A5({ id: c.nextId("firewall-shear"), rng: c.rng }));
});
const Oc = { width: 4, height: 8 },
  Xv = 2.26,
  Tr = 2,
  zr = -0.6,
  Iv = -2.45,
  wu = -1,
  Au = 1,
  M5 = 1.78,
  jd = 2,
  uu = -2.5,
  _5 = 4.5,
  T5 = 5.5,
  z5 = 14,
  E5 = 3,
  R5 = 3.5,
  C5 = 4,
  O5 = `
  attribute float aSeed;
  attribute float aStrength;
  attribute float aSide;
  attribute float aKind;
  attribute float aPixelSize;

  uniform float time;
  uniform float envelope;
  uniform float sweepY;

  varying float vAlpha;
  varying float vSide;
  varying float vKind;
  varying float vValid;

  void main() {
    vec3 pos = position;
    float jitter = 0.010;
    pos.x += sin(time * 5.6 + aSeed * 19.0) * jitter;
    pos.y += cos(time * 4.3 + aSeed * 23.0) * jitter;

    float scan = 0.74 + 0.26 * sin(position.y * 7.5 - time * 8.0 + aSeed * 31.0);
    float dropout = step(0.08, fract(sin(floor(time * 14.0) + aSeed * 97.0) * 43758.5453));
    float pulse = 0.88 + 0.12 * sin(time * 11.0 + aSeed * 67.0);

    // Validation sweep ribbon: cyan side only.
    float bandDist = abs(position.y - sweepY);
    float band = exp(-bandDist * bandDist * 2.4);
    vValid = band * (1.0 - step(0.0, aSide));

    vAlpha = envelope * aStrength * scan * pulse * dropout * (1.0 + band * 0.45);
    vSide = aSide;
    vKind = aKind;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    // Size attenuates with distance (perspective): mirrors three.js Points default.
    gl_PointSize = aPixelSize * (300.0 / -mvPosition.z);
  }
`,
  B5 = `
  varying float vAlpha;
  varying float vSide;
  varying float vKind;
  varying float vValid;

  void main() {
    if (vAlpha <= 0.001) discard;
    // Soft round point: radial falloff inside the gl_PointCoord square.
    vec2 uv = gl_PointCoord - vec2(0.5);
    float r = dot(uv, uv) * 4.0;       // 0 at center, 1 at edge
    if (r > 1.0) discard;
    float soft = 1.0 - r;

    // Capped cores per the brief — no overexposed white.
    vec3 cyanCore = vec3(0.30, 0.85, 0.95);
    vec3 magentaCore = vec3(0.95, 0.30, 0.85);
    float magentaSide = step(0.0, vSide);
    vec3 base = mix(cyanCore, magentaCore, magentaSide);

    // Outline reads slightly hotter but stays inside the capped palette.
    float outlineMix = step(0.5, vKind);
    vec3 outline = mix(
      vec3(0.55, 0.95, 1.00),
      vec3(1.00, 0.55, 0.95),
      magentaSide
    );
    vec3 color = mix(base, outline, outlineMix * 0.6);

    // Validation ribbon: mint-green tint on cyan side, gentle (no white-out).
    color = mix(color, vec3(0.40, 0.95, 0.70), vValid * 0.55);

    float alpha = clamp(vAlpha * soft, 0.0, 0.85);
    gl_FragColor = vec4(color, alpha);
  }
`,
  D5 = `
  attribute float aSeed;
  attribute float aSide;

  uniform float time;
  uniform float envelope;

  varying float vAlpha;
  varying float vSide;

  void main() {
    vec3 pos = position;
    pos.x += sin(time * 1.7 + aSeed * 11.0) * 0.02;
    pos.y += cos(time * 1.3 + aSeed * 17.0) * 0.02;
    float pulse = 0.65 + 0.35 * sin(time * 2.4 + aSeed * 9.0);
    vAlpha = envelope * pulse * 0.22;
    vSide = aSide;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    gl_PointSize = ${z5.toFixed(2)} * (300.0 / -mvPosition.z);
  }
`,
  N5 = `
  varying float vAlpha;
  varying float vSide;

  void main() {
    if (vAlpha <= 0.001) discard;
    vec2 uv = gl_PointCoord - vec2(0.5);
    float r = dot(uv, uv) * 4.0;
    if (r > 1.0) discard;
    float soft = pow(1.0 - r, 2.2);

    vec3 cyanCore = vec3(0.30, 0.85, 0.95);
    vec3 magentaCore = vec3(0.95, 0.30, 0.85);
    float magentaSide = step(0.0, vSide);
    vec3 color = mix(cyanCore, magentaCore, magentaSide);

    gl_FragColor = vec4(color, vAlpha * soft);
  }
`,
  U5 = `
  attribute float aSeed;
  attribute float aSide;
  attribute float aStrength;

  uniform float time;
  uniform float envelope;

  varying float vAlpha;
  varying float vSide;

  void main() {
    vec3 pos = position;
    pos.x += sin(time * 2.1 + aSeed * 31.0) * 0.05;
    pos.y += cos(time * 1.6 + aSeed * 27.0) * 0.05;
    float flicker = step(0.30, fract(sin(floor(time * 10.0) + aSeed * 113.0) * 43758.5453));
    vAlpha = envelope * aStrength * flicker * 0.42;
    vSide = aSide;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    gl_PointSize = ${E5.toFixed(2)} * (300.0 / -mvPosition.z);
  }
`,
  F5 = `
  varying float vAlpha;
  varying float vSide;

  void main() {
    if (vAlpha <= 0.001) discard;
    vec2 uv = gl_PointCoord - vec2(0.5);
    float r = dot(uv, uv) * 4.0;
    if (r > 1.0) discard;
    float soft = 1.0 - r;

    vec3 cyanCore = vec3(0.30, 0.85, 0.95);
    vec3 magentaCore = vec3(0.95, 0.30, 0.85);
    float magentaSide = step(0.0, vSide);
    vec3 color = mix(cyanCore, magentaCore, magentaSide);

    gl_FragColor = vec4(color, clamp(vAlpha * soft, 0.0, 0.6));
  }
`,
  L5 = `
  attribute float aSeed;
  attribute float aSide;
  attribute float aColumn;     // x offset already baked, but kept for flicker variety

  uniform float time;
  uniform float envelope;

  varying float vAlpha;
  varying float vSide;
  varying float vHead;

  void main() {
    vec3 pos = position;
    // Scroll downward; wrap over the column span (5.0m).
    float span = 5.6;
    float speed = 1.6 + 0.6 * fract(aSeed * 7.13);
    float driftY = mod(pos.y - time * speed - aSeed * span, span) - span * 0.5;
    pos.y = driftY;

    // Head-of-column brightness: a value 0..1 keyed off the new position.
    float headPhase = fract((driftY + span * 0.5) / span + aSeed);
    vHead = smoothstep(0.65, 1.0, headPhase);

    float flicker = step(0.18, fract(sin(floor(time * 14.0) + aSeed * 113.0 + aColumn) * 43758.5453));
    vAlpha = envelope * flicker * (0.35 + 0.55 * fract(aSeed * 11.7));
    vSide = aSide;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    gl_PointSize = ${R5.toFixed(2)} * (300.0 / -mvPosition.z);
  }
`,
  k5 = `
  varying float vAlpha;
  varying float vSide;
  varying float vHead;

  void main() {
    if (vAlpha <= 0.001) discard;
    // Vertical dash, not a round dot — squash the y axis hard so it reads as a code glyph slice.
    vec2 uv = gl_PointCoord - vec2(0.5);
    float dash = step(abs(uv.x), 0.35) * step(abs(uv.y), 0.48);
    if (dash < 0.5) discard;

    vec3 cyanCore = vec3(0.30, 0.85, 0.95);
    vec3 magentaCore = vec3(0.95, 0.30, 0.85);
    float magentaSide = step(0.0, vSide);
    vec3 color = mix(cyanCore, magentaCore, magentaSide);
    // Head of the falling column reads slightly hotter.
    color = mix(color, color + vec3(0.15), vHead);

    gl_FragColor = vec4(color, clamp(vAlpha, 0.0, 0.75));
  }
`,
  H5 = `
  attribute float aSeed;
  attribute float aRing;
  attribute float aStrength;

  uniform float time;
  uniform float envelope;

  varying float vAlpha;
  varying float vRing;

  void main() {
    vec3 pos = position;
    pos.y += sin(time * 2.2 + aRing * 1.3 + aSeed * 5.0) * 0.015;
    float gate = step(0.12, fract(sin(aSeed * 73.0 + floor(time * 9.0)) * 43758.5453));
    float pulse = 0.7 + 0.3 * sin(time * 3.0 - aRing * 0.8 + aSeed * 4.0);
    vAlpha = envelope * aStrength * gate * pulse * 0.7;
    vRing = aRing;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    gl_PointSize = ${C5.toFixed(2)} * (300.0 / -mvPosition.z);
  }
`,
  V5 = `
  varying float vAlpha;
  varying float vRing;

  void main() {
    if (vAlpha <= 0.001) discard;
    vec2 uv = gl_PointCoord - vec2(0.5);
    float r = dot(uv, uv) * 4.0;
    if (r > 1.0) discard;
    float soft = 1.0 - r;

    vec3 inner = vec3(0.35, 0.90, 0.98);
    vec3 outer = vec3(0.30, 0.70, 0.95);
    vec3 color = mix(inner, outer, clamp(vRing / 3.0, 0.0, 1.0));
    gl_FragColor = vec4(color, clamp(vAlpha * soft, 0.0, 0.7));
  }
`;
function Zv(c, t, i) {
  const s = Math.max(0, Math.min(1, (i - c) / (t - c)));
  return s * s * (3 - 2 * s);
}
function re(c, t, i) {
  return t + (i - t) * c();
}
function hu(c, t) {
  const i = c(),
    s = uu + i * (jd - uu),
    o = Math.sin(i * Math.PI) * 0.3,
    l = Math.sin(i * Math.PI * 1.4) * 0.06,
    u = -o + l;
  let f;
  i > 0.88
    ? (f = 0.18 + (1 - Math.min(1, (i - 0.88) / 0.12)) * 0.05)
    : i > 0.78
      ? (f = 0.1)
      : i > 0.55
        ? (f = 0.3 - ((i - 0.55) / 0.23) * 0.1)
        : i > 0.32
          ? (f = 0.22 + ((i - 0.32) / 0.23) * 0.18)
          : i > 0.06
            ? (f = 0.12)
            : (f = 0.18);
  const h = c() * 2 - 1,
    p = t,
    y = Math.sign(h) * (p + (1 - p) * Math.abs(h));
  return { x: u + y * f, y: s };
}
function G5(c) {
  const t = [];
  for (const i of [wu, Au]) {
    for (let s = 0; s < 6500; s++) {
      const o = hu(c, 0.55);
      t.push({
        x: i * Tr + o.x * i,
        y: o.y,
        z: zr + re(c, -0.04, 0.04),
        seed: c(),
        strength: re(c, 0.55, 0.85),
        side: i,
        kind: 0,
        pixelSize: _5 * re(c, 0.85, 1.15),
      });
    }
    for (let s = 0; s < 1500; s++) {
      const o = hu(c, 0.92);
      t.push({
        x: i * Tr + o.x * i,
        y: o.y,
        z: zr + re(c, -0.02, 0.02),
        seed: c(),
        strength: re(c, 0.65, 0.85),
        side: i,
        kind: 1,
        pixelSize: T5 * re(c, 0.9, 1.2),
      });
    }
  }
  return t;
}
function j5(c) {
  const t = [];
  for (const i of [wu, Au])
    for (let s = 0; s < 250; s++) {
      const o = hu(c, 0.85);
      t.push({
        x: i * Tr + o.x * i + re(c, -0.08, 0.08),
        y: o.y + re(c, -0.08, 0.08),
        z: zr - 0.05,
        seed: c(),
        side: i,
      });
    }
  return t;
}
function Y5(c) {
  const t = [];
  for (const i of [wu, Au])
    for (let s = 0; s < 300; s++) {
      const o = hu(c, 0.5),
        l = re(c, 0.25, 1.4),
        u = c() * Math.PI * 2,
        f = Math.cos(u) * l,
        h = Math.sin(u) * l * 0.7;
      t.push({
        x: i * Tr + o.x * i + f,
        y: o.y + h,
        z: zr + re(c, -0.15, 0.15),
        seed: c(),
        side: i,
        strength: re(c, 0.35, 0.75),
      });
    }
  return t;
}
function q5(c) {
  const t = [],
    i = [0.55, 0.95, 1.3, 1.65, 2.05, 2.45];
  for (const s of [wu, Au])
    for (let o = 0; o < i.length; o++) {
      const l = s * (Tr + i[o]),
        u = 100;
      for (let f = 0; f < u; f++) {
        const h = l + re(c, -0.1, 0.1),
          p = re(c, -2.8, 2.8);
        t.push({ x: h, y: p, z: zr - 0.25, seed: c(), side: s, column: o });
      }
    }
  return t;
}
function X5(c) {
  const t = [],
    i = [0.95, 1.4, 1.95, 2.55];
  for (let s = 0; s < i.length; s++) {
    const o = i[s],
      l = o * 0.45,
      u = 220;
    for (let h = 0; h < u; h++) {
      const p = (h / u) * Math.PI * 2 + re(c, -0.02, 0.02),
        y = re(c, -0.04, 0.04);
      t.push({
        x: Math.cos(p) * (o + y),
        y: Iv + re(c, -0.02, 0.02),
        z: Math.sin(p) * (l + y * 0.45),
        seed: c(),
        ring: s,
        strength: re(c, 0.4, 0.7),
      });
    }
    const f = 6;
    for (let h = 0; h < f; h++) {
      const p = c() * Math.PI * 2,
        y = 18 + Math.floor(c() * 10);
      for (let g = 0; g < y; g++) {
        const v = p + re(c, -0.18, 0.18),
          b = re(c, -0.1, 0.1);
        t.push({
          x: Math.cos(v) * (o + b),
          y: Iv + re(c, -0.03, 0.03),
          z: Math.sin(v) * (l + b * 0.45),
          seed: c(),
          ring: s,
          strength: re(c, 0.85, 1),
        });
      }
    }
  }
  return t;
}
function I5(c) {
  const t = c.length,
    i = new Float32Array(t * 3),
    s = new Float32Array(t),
    o = new Float32Array(t),
    l = new Float32Array(t),
    u = new Float32Array(t),
    f = new Float32Array(t);
  for (let p = 0; p < t; p++) {
    const y = c[p];
    ((i[p * 3] = y.x),
      (i[p * 3 + 1] = y.y),
      (i[p * 3 + 2] = y.z),
      (s[p] = y.seed),
      (o[p] = y.strength),
      (l[p] = y.side),
      (u[p] = y.kind),
      (f[p] = y.pixelSize));
  }
  const h = new At();
  return (
    h.setAttribute("position", new H(i, 3)),
    h.setAttribute("aSeed", new H(s, 1)),
    h.setAttribute("aStrength", new H(o, 1)),
    h.setAttribute("aSide", new H(l, 1)),
    h.setAttribute("aKind", new H(u, 1)),
    h.setAttribute("aPixelSize", new H(f, 1)),
    h
  );
}
function Z5(c) {
  const t = c.length,
    i = new Float32Array(t * 3),
    s = new Float32Array(t),
    o = new Float32Array(t);
  for (let u = 0; u < t; u++) {
    const f = c[u];
    ((i[u * 3] = f.x),
      (i[u * 3 + 1] = f.y),
      (i[u * 3 + 2] = f.z),
      (s[u] = f.seed),
      (o[u] = f.side));
  }
  const l = new At();
  return (
    l.setAttribute("position", new H(i, 3)),
    l.setAttribute("aSeed", new H(s, 1)),
    l.setAttribute("aSide", new H(o, 1)),
    l
  );
}
function P5(c) {
  const t = c.length,
    i = new Float32Array(t * 3),
    s = new Float32Array(t),
    o = new Float32Array(t),
    l = new Float32Array(t);
  for (let f = 0; f < t; f++) {
    const h = c[f];
    ((i[f * 3] = h.x),
      (i[f * 3 + 1] = h.y),
      (i[f * 3 + 2] = h.z),
      (s[f] = h.seed),
      (o[f] = h.side),
      (l[f] = h.strength));
  }
  const u = new At();
  return (
    u.setAttribute("position", new H(i, 3)),
    u.setAttribute("aSeed", new H(s, 1)),
    u.setAttribute("aSide", new H(o, 1)),
    u.setAttribute("aStrength", new H(l, 1)),
    u
  );
}
function W5(c) {
  const t = c.length,
    i = new Float32Array(t * 3),
    s = new Float32Array(t),
    o = new Float32Array(t),
    l = new Float32Array(t);
  for (let f = 0; f < t; f++) {
    const h = c[f];
    ((i[f * 3] = h.x),
      (i[f * 3 + 1] = h.y),
      (i[f * 3 + 2] = h.z),
      (s[f] = h.seed),
      (o[f] = h.side),
      (l[f] = h.column));
  }
  const u = new At();
  return (
    u.setAttribute("position", new H(i, 3)),
    u.setAttribute("aSeed", new H(s, 1)),
    u.setAttribute("aSide", new H(o, 1)),
    u.setAttribute("aColumn", new H(l, 1)),
    u
  );
}
function J5(c) {
  const t = c.length,
    i = new Float32Array(t * 3),
    s = new Float32Array(t),
    o = new Float32Array(t),
    l = new Float32Array(t);
  for (let f = 0; f < t; f++) {
    const h = c[f];
    ((i[f * 3] = h.x),
      (i[f * 3 + 1] = h.y),
      (i[f * 3 + 2] = h.z),
      (s[f] = h.seed),
      (o[f] = h.ring),
      (l[f] = h.strength));
  }
  const u = new At();
  return (
    u.setAttribute("position", new H(i, 3)),
    u.setAttribute("aSeed", new H(s, 1)),
    u.setAttribute("aRing", new H(o, 1)),
    u.setAttribute("aStrength", new H(l, 1)),
    u
  );
}
class Q5 {
  id;
  object = new ve();
  done = !1;
  silhouetteUniforms = [];
  basicUniforms = [];
  geometries = [];
  materials = [];
  elapsed = 0;
  constructor(t, i) {
    ((this.id = t),
      this.addRain(q5(i)),
      this.addHalo(j5(i)),
      this.addFloor(X5(i)),
      this.addScatter(Y5(i)));
    const s = G5(i),
      o = s.filter((u) => u.kind === 0),
      l = s.filter((u) => u.kind === 1);
    (this.addSilhouette(o, 5), this.addSilhouette(l, 6), (this.object.renderOrder = 4));
  }
  update(t, i, s) {
    this.elapsed += Math.max(0, i);
    const o = Zv(0, 0.22, this.elapsed) * (1 - Zv(1.82, Xv, this.elapsed)),
      l = Math.cos(this.elapsed * M5 * Math.PI) * (jd - uu) * 0.5 + (jd + uu) * 0.5;
    (this.object.position.copy(s.position),
      this.object.scale.set(
        s.size.x / Oc.width,
        s.size.y / Oc.height,
        Math.min(s.size.x / Oc.width, s.size.y / Oc.height),
      ));
    for (const u of this.silhouetteUniforms)
      ((u.time.value = this.elapsed), (u.envelope.value = o), (u.sweepY.value = l));
    for (const u of this.basicUniforms) ((u.time.value = this.elapsed), (u.envelope.value = o));
    if (this.elapsed >= Xv) {
      this.done = !0;
      for (const u of this.silhouetteUniforms) u.envelope.value = 0;
      for (const u of this.basicUniforms) u.envelope.value = 0;
    }
  }
  dispose() {
    for (const t of this.geometries) t.dispose();
    for (const t of this.materials) t.dispose();
  }
  addSilhouette(t, i) {
    if (t.length === 0) return;
    const s = I5(t),
      o = { time: { value: 0 }, envelope: { value: 0 }, sweepY: { value: 0 } };
    this.silhouetteUniforms.push(o);
    const l = new dt({
        uniforms: o,
        vertexShader: O5,
        fragmentShader: B5,
        transparent: !0,
        depthTest: !0,
        depthWrite: !1,
        blending: wi,
      }),
      u = new ne(s, l);
    ((u.frustumCulled = !1),
      (u.renderOrder = i),
      this.geometries.push(s),
      this.materials.push(l),
      this.object.add(u));
  }
  addHalo(t) {
    if (t.length === 0) return;
    const i = Z5(t),
      s = { time: { value: 0 }, envelope: { value: 0 } };
    this.basicUniforms.push(s);
    const o = new dt({
        uniforms: s,
        vertexShader: D5,
        fragmentShader: N5,
        transparent: !0,
        depthTest: !0,
        depthWrite: !1,
        blending: Rt,
      }),
      l = new ne(i, o);
    ((l.frustumCulled = !1),
      (l.renderOrder = 3),
      this.geometries.push(i),
      this.materials.push(o),
      this.object.add(l));
  }
  addScatter(t) {
    if (t.length === 0) return;
    const i = P5(t),
      s = { time: { value: 0 }, envelope: { value: 0 } };
    this.basicUniforms.push(s);
    const o = new dt({
        uniforms: s,
        vertexShader: U5,
        fragmentShader: F5,
        transparent: !0,
        depthTest: !0,
        depthWrite: !1,
        blending: wi,
      }),
      l = new ne(i, o);
    ((l.frustumCulled = !1),
      (l.renderOrder = 4),
      this.geometries.push(i),
      this.materials.push(o),
      this.object.add(l));
  }
  addRain(t) {
    if (t.length === 0) return;
    const i = W5(t),
      s = { time: { value: 0 }, envelope: { value: 0 } };
    this.basicUniforms.push(s);
    const o = new dt({
        uniforms: s,
        vertexShader: L5,
        fragmentShader: k5,
        transparent: !0,
        depthTest: !0,
        depthWrite: !1,
        blending: wi,
      }),
      l = new ne(i, o);
    ((l.frustumCulled = !1),
      (l.renderOrder = 1),
      this.geometries.push(i),
      this.materials.push(o),
      this.object.add(l));
  }
  addFloor(t) {
    if (t.length === 0) return;
    const i = J5(t),
      s = { time: { value: 0 }, envelope: { value: 0 } };
    this.basicUniforms.push(s);
    const o = new dt({
        uniforms: s,
        vertexShader: H5,
        fragmentShader: V5,
        transparent: !0,
        depthTest: !0,
        depthWrite: !1,
        blending: wi,
      }),
      l = new ne(i, o);
    ((l.frustumCulled = !1),
      (l.renderOrder = 2),
      this.geometries.push(i),
      this.materials.push(o),
      this.object.add(l));
  }
}
xe("identity-checksum", (c) => {
  c.add(new Q5(c.nextId("identity-checksum"), c.rng));
});
const K5 = Math.PI * 2,
  $5 = 2.32,
  t_ = 5,
  e_ = 8,
  i_ = 3500,
  ai = 30,
  n_ = 1,
  s_ = `
  attribute vec3 aVelocity;
  attribute float aSize;
  attribute float aBorn;
  attribute float aLife;
  attribute float aSeed;
  attribute float aTone;
  attribute float aIntensity;

  uniform float uAge;
  uniform float uPointScale;

  varying float vAlpha;
  varying float vSeed;
  varying float vTone;
  varying float vIntensity;

  void main() {
    float age = uAge - aBorn;
    float t = age / aLife;

    if (t < 0.0 || t > 1.0) {
      vAlpha = 0.0;
      gl_Position = vec4(0.0, 0.0, -10000.0, 1.0);
      gl_PointSize = 0.0;
      return;
    }

    vec3 pos = position + aVelocity * age;
    pos.x += sin(uAge * 1.05 + aSeed * 6.28318) * 0.055;
    pos.y += cos(uAge * 0.82 + aSeed * 9.0) * 0.040;

    float fadeIn = smoothstep(0.0, 0.22, t);
    float fadeOut = 1.0 - smoothstep(0.62, 1.0, t);
    float shimmer = 0.86 + 0.14 * sin(uAge * 4.4 + aSeed * 23.0);
    vAlpha = fadeIn * fadeOut * shimmer * aIntensity;
    vSeed = aSeed;
    vTone = aTone;
    vIntensity = aIntensity;

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    // World-space sized point: aSize in world units → pixels via -mv.z.
    gl_PointSize = aSize * uPointScale * 380.0 / max(0.18, -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`,
  a_ = `
  varying float vAlpha;
  varying float vSeed;
  varying float vTone;
  varying float vIntensity;

  void main() {
    if (vAlpha <= 0.001) discard;

    vec2 d = gl_PointCoord - 0.5;
    float r = length(d) * 2.0;
    if (r > 1.0) discard;

    float soft = pow(1.0 - r, 3.0);
    float wisp = pow(1.0 - r, 1.4) * 0.30;

    // Warm-gold palette ONLY: amber → gold → cream.
    vec3 amber = vec3(1.00, 0.55, 0.20);
    vec3 gold  = vec3(1.00, 0.75, 0.30);
    vec3 cream = vec3(1.00, 0.90, 0.60);
    vec3 color = mix(amber, gold, smoothstep(0.10, 0.65, vTone));
    color = mix(color, cream, smoothstep(0.70, 1.0, vTone));

    float intensity = soft * 1.05 + wisp * 0.40;
    float alpha = (soft * 0.40 + wisp * 0.15) * vAlpha * 0.55;
    gl_FragColor = vec4(color * intensity, alpha);
  }
`,
  o_ = `
  attribute vec3 aOffset;
  attribute vec3 aVelocity;
  attribute vec2 aSize;
  attribute float aAngle;
  attribute float aSpin;
  attribute float aBorn;
  attribute float aLife;
  attribute float aSeed;
  attribute float aColorKind;
  attribute float aAlpha;

  uniform float uAge;

  varying vec2 vUv;
  varying float vAlpha;
  varying float vSeed;
  varying float vColorKind;

  void main() {
    float age = uAge - aBorn;
    float t = age / aLife;

    if (t < 0.0 || t > 1.0) {
      vAlpha = 0.0;
      gl_Position = vec4(0.0, 0.0, -10000.0, 1.0);
      return;
    }

    vec2 local = position.xy * aSize;
    float angle = aAngle + aSpin * age + sin(uAge * 1.4 + aSeed * 8.0) * 0.22;
    float c = cos(angle);
    float s = sin(angle);
    vec2 rotated = mat2(c, -s, s, c) * local;

    // Grounded swirl: orbit slowly around Nori in XZ, with gentle vertical drift.
    float orbit = uAge * 0.55 + aSeed * 6.28318;
    float radius = length(aOffset.xz);
    vec3 offset;
    offset.x = cos(orbit) * radius;
    offset.z = sin(orbit) * radius * 0.5;
    offset.y = aOffset.y + aVelocity.y * age + sin(age * 1.05 + aSeed * 9.0) * 0.10;

    float fadeIn = smoothstep(0.0, 0.20, t);
    float fadeOut = 1.0 - smoothstep(0.62, 1.0, t);
    vAlpha = fadeIn * fadeOut * aAlpha;
    vUv = uv;
    vSeed = aSeed;
    vColorKind = aColorKind;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(vec3(rotated, 0.0) + offset, 1.0);
  }
`,
  r_ = `
  varying vec2 vUv;
  varying float vAlpha;
  varying float vSeed;
  varying float vColorKind;

  void main() {
    if (vAlpha <= 0.001) discard;

    vec2 p = vUv * 2.0 - 1.0;
    p.x += sin(p.y * 2.4 + vSeed * 3.0) * 0.08;

    float y = abs(p.y);
    float halfWidth = 0.20 + 0.68 * (1.0 - pow(y, 1.55));
    halfWidth *= 1.0 - 0.22 * smoothstep(0.78, 1.0, y);
    float body = 1.0 - smoothstep(halfWidth, halfWidth + 0.10, abs(p.x));
    body *= 1.0 - smoothstep(0.94, 1.06, y);
    if (body <= 0.001) discard;

    float rim = smoothstep(halfWidth, halfWidth - 0.18, abs(p.x)) * 0.20;

    // Beige-pink palette (warm, not cool).
    vec3 beigePink = vec3(1.00, 0.78, 0.66);
    vec3 warmPink  = vec3(1.00, 0.74, 0.62);
    vec3 paleRose  = vec3(1.00, 0.86, 0.74);
    vec3 color = mix(beigePink, warmPink, smoothstep(0.30, 0.70, vColorKind));
    color = mix(color, paleRose, smoothstep(0.82, 1.0, vColorKind));
    color += rim * vec3(0.10, 0.05, 0.02);

    gl_FragColor = vec4(color * (0.88 + rim * 0.4), body * vAlpha * 0.85);
  }
`,
  l_ = `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`,
  c_ = `
  uniform float uAge;
  uniform float uSeed;
  uniform float uAlpha;

  varying vec2 vUv;

  void main() {
    // Centered NDC-like coords [-1,1].
    vec2 p = (vUv - 0.5) * 2.0;
    float r = length(p);
    if (r > 1.0) discard;

    // Strong diffuse interior glow.
    float diffuse = pow(max(0.0, 1.0 - r), 1.4);

    // Bright gold rim near the outer edge.
    float rimBand = smoothstep(0.78, 0.94, r) * (1.0 - smoothstep(0.96, 1.00, r));

    // Faint checker pattern: angular wedges × radial bands.
    float ang = atan(p.y, p.x);
    float wedge = floor((ang / 3.14159265 + 1.0) * 8.0); // 16 wedges
    float ring  = floor(r * 4.0);                        // 4 rings
    float checker = mod(wedge + ring, 2.0);              // 0 or 1
    float flicker = 0.85 + 0.15 * sin(uAge * 2.2 + (wedge + ring) * 1.7 + uSeed * 5.0);
    // Mask checker to the disc interior, fade toward edge.
    float checkerMask = (1.0 - smoothstep(0.55, 0.92, r)) * diffuse;
    float checkerFill = checker * checkerMask * flicker;

    // Warm-gold colors only.
    vec3 goldWarm  = vec3(1.00, 0.75, 0.30);
    vec3 goldCream = vec3(1.00, 0.90, 0.55);
    vec3 amber     = vec3(1.00, 0.55, 0.20);

    vec3 color = goldWarm * diffuse * 0.9
               + goldCream * rimBand * 1.4
               + amber * checkerFill * 0.5;

    // Higher floor alpha so disc is clearly visible.
    float alpha = (diffuse * 0.55 + rimBand * 1.0 + checkerFill * 0.30) * uAlpha;

    // Lifecycle fade.
    float life = smoothstep(0.0, 0.35, uAge) * (1.0 - smoothstep(1.85, 2.32, uAge));
    alpha *= life;
    if (alpha <= 0.001) discard;
    gl_FragColor = vec4(color, alpha);
  }
`,
  u_ = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`,
  h_ = `
  uniform float uAge;
  varying vec2 vUv;
  void main() {
    vec2 p = vUv - 0.5;
    float r = length(p * vec2(1.0, 1.15));
    float glow = pow(max(0.0, 1.0 - r * 1.35), 1.8);

    // Pure warm palette: amber core → gold falloff.
    vec3 amber = vec3(1.00, 0.55, 0.20);
    vec3 gold  = vec3(1.00, 0.75, 0.32);
    vec3 color = mix(gold, amber, glow);

    float life = smoothstep(0.0, 0.45, uAge) * (1.0 - smoothstep(1.9, 2.32, uAge));
    // Boosted alpha so the warm wash is clearly visible (>= 0.45 in core).
    float alpha = (0.32 + glow * 0.30) * life;
    gl_FragColor = vec4(color, alpha);
  }
`;
class f_ {
  id;
  object;
  done = !1;
  geometries = [];
  materials = [];
  ageUniforms = [];
  pointScaleUniforms = [];
  elapsed = 0;
  constructor(t) {
    ((this.id = t.id), (this.object = new ve()), (this.object.name = t.id));
    const i = this.createWarmTint(),
      s = this.createFloorCache(t.rng),
      o = d_(t.rng, i_),
      l = this.createMotePoints(o),
      u = this.createPetals(t.rng);
    ((i.renderOrder = 1),
      (s.renderOrder = 2),
      (l.renderOrder = 3),
      (u.renderOrder = 4),
      this.object.add(i, s, l, u),
      (this.object.frustumCulled = !1));
  }
  update(t, i, s) {
    this.elapsed += i;
    const o = Math.max(0.72, Math.min(1.36, s.size.x / t_)),
      l = Math.max(0.72, Math.min(1.36, s.size.y / e_)),
      u = (o + l) * 0.5;
    (this.object.position.copy(s.position), this.object.scale.set(o, l, 1));
    for (const f of this.pointScaleUniforms) f.value = u;
    for (const f of this.ageUniforms) f.value = this.elapsed;
    this.elapsed >= $5 && (this.done = !0);
  }
  dispose() {
    for (const t of this.geometries) t.dispose();
    for (const t of this.materials) t.dispose();
  }
  createWarmTint() {
    const t = new be(18, 22),
      i = { value: 0 },
      s = new dt({
        uniforms: { uAge: i },
        vertexShader: u_,
        fragmentShader: h_,
        transparent: !0,
        depthWrite: !1,
        depthTest: !1,
        blending: wi,
        side: Ne,
      });
    (this.geometries.push(t), this.materials.push(s), this.ageUniforms.push(i));
    const o = new $t(t, s);
    return ((o.position.z = -5), (o.frustumCulled = !1), o);
  }
  createMotePoints(t) {
    const i = t.length,
      s = new Float32Array(i * 3),
      o = new Float32Array(i * 3),
      l = new Float32Array(i),
      u = new Float32Array(i),
      f = new Float32Array(i),
      h = new Float32Array(i),
      p = new Float32Array(i),
      y = new Float32Array(i);
    for (let M = 0; M < i; M++) {
      const T = t[M],
        O = M * 3;
      ((s[O] = T.x),
        (s[O + 1] = T.y),
        (s[O + 2] = T.z),
        (o[O] = T.vx),
        (o[O + 1] = T.vy),
        (o[O + 2] = T.vz),
        (l[M] = T.size),
        (u[M] = T.born),
        (f[M] = T.life),
        (h[M] = T.seed),
        (p[M] = T.tone),
        (y[M] = T.intensity));
    }
    const g = new At();
    (g.setAttribute("position", new H(s, 3)),
      g.setAttribute("aVelocity", new H(o, 3)),
      g.setAttribute("aSize", new H(l, 1)),
      g.setAttribute("aBorn", new H(u, 1)),
      g.setAttribute("aLife", new H(f, 1)),
      g.setAttribute("aSeed", new H(h, 1)),
      g.setAttribute("aTone", new H(p, 1)),
      g.setAttribute("aIntensity", new H(y, 1)));
    const v = { value: 0 },
      b = { value: 1 },
      S = new dt({
        uniforms: { uAge: v, uPointScale: b },
        vertexShader: s_,
        fragmentShader: a_,
        transparent: !0,
        depthWrite: !1,
        depthTest: !1,
        blending: Rt,
      });
    (this.geometries.push(g),
      this.materials.push(S),
      this.ageUniforms.push(v),
      this.pointScaleUniforms.push(b));
    const A = new ne(g, S);
    return ((A.frustumCulled = !1), A);
  }
  createPetals(t) {
    const i = p_(),
      s = new Float32Array(ai * 3),
      o = new Float32Array(ai * 3),
      l = new Float32Array(ai * 2),
      u = new Float32Array(ai),
      f = new Float32Array(ai),
      h = new Float32Array(ai),
      p = new Float32Array(ai),
      y = new Float32Array(ai),
      g = new Float32Array(ai),
      v = new Float32Array(ai);
    for (let M = 0; M < ai; M++) {
      const T = (M / ai) * K5 + It(t, -0.35, 0.35),
        O = It(t, 0.8, 2),
        C = Math.cos(T) * O,
        E = Math.sin(T) * O * 0.55,
        U = It(t, -1.4, 1.6),
        q = M * 3;
      ((s[q] = C),
        (s[q + 1] = U),
        (s[q + 2] = E),
        (o[q] = 0),
        (o[q + 1] = It(t, 0.015, 0.08)),
        (o[q + 2] = 0));
      const X = It(t, 0.26, 0.38),
        G = It(t, 0.16, 0.24),
        W = M * 2;
      ((l[W] = G),
        (l[W + 1] = X),
        (u[M] = It(t, -Math.PI, Math.PI)),
        (f[M] = It(t, -0.65, 0.65)),
        (h[M] = It(t, -0.3, 0.55)),
        (p[M] = It(t, 1.75, 2.2)),
        (y[M] = t()),
        (g[M] = t()),
        (v[M] = It(t, 0.55, 0.8)));
    }
    (i.setAttribute("aOffset", new kt(s, 3)),
      i.setAttribute("aVelocity", new kt(o, 3)),
      i.setAttribute("aSize", new kt(l, 2)),
      i.setAttribute("aAngle", new kt(u, 1)),
      i.setAttribute("aSpin", new kt(f, 1)),
      i.setAttribute("aBorn", new kt(h, 1)),
      i.setAttribute("aLife", new kt(p, 1)),
      i.setAttribute("aSeed", new kt(y, 1)),
      i.setAttribute("aColorKind", new kt(g, 1)),
      i.setAttribute("aAlpha", new kt(v, 1)));
    const b = { value: 0 },
      S = new dt({
        uniforms: { uAge: b },
        vertexShader: o_,
        fragmentShader: r_,
        transparent: !0,
        depthWrite: !1,
        depthTest: !1,
        blending: wi,
        side: Ne,
      });
    i.instanceCount = ai;
    const A = new $t(i, S);
    return (
      (A.frustumCulled = !1),
      this.geometries.push(i),
      this.materials.push(S),
      this.ageUniforms.push(b),
      A
    );
  }
  createFloorCache(t) {
    const i = new ve(),
      s = [],
      o = -2.8,
      l = -0.05;
    for (let u = 0; u < n_; u++)
      s.push({
        cx: It(t, -0.1, 0.1),
        cy: o + u * 0.005,
        cz: l + It(t, -0.05, 0.05),
        radius: 3.5,
        tiltX: -Math.PI * 0.5 + It(t, -0.03, 0.03),
        rotZ: It(t, -0.25, 0.25),
        alpha: 0.95,
        seed: t(),
      });
    for (const u of s) {
      const f = u.radius * 2,
        h = new be(f, f, 1, 1),
        p = { value: 0 },
        y = new dt({
          uniforms: { uAge: p, uSeed: { value: u.seed }, uAlpha: { value: u.alpha } },
          vertexShader: l_,
          fragmentShader: c_,
          transparent: !0,
          depthWrite: !1,
          depthTest: !1,
          blending: wi,
          side: Ne,
        });
      (this.geometries.push(h), this.materials.push(y), this.ageUniforms.push(p));
      const g = new $t(h, y);
      (g.position.set(u.cx, u.cy, u.cz),
        (g.rotation.x = u.tiltX),
        (g.rotation.z = u.rotZ),
        (g.frustumCulled = !1),
        i.add(g));
    }
    return i;
  }
}
function d_(c, t) {
  const i = [];
  for (let l = 0; l < t; l++) {
    const u = It(c, -5.5, 5.5),
      f = It(c, -5.5, 5.5),
      h = It(c, -1, 1),
      p = It(c, 0.06, 0.12),
      y = It(c, 0.25, 0.95),
      g = It(c, 0.45, 0.85);
    i.push({
      x: u,
      y: f,
      z: h,
      vx: It(c, -0.03, 0.03),
      vy: It(c, 0.015, 0.1),
      vz: It(c, -0.02, 0.02),
      size: p,
      born: It(c, -0.5, 0.8),
      life: It(c, 1.75, 2.32),
      seed: c(),
      tone: y,
      intensity: g,
    });
  }
  return i;
}
function p_() {
  const c = new be(1, 1),
    t = new P1();
  return (
    (t.index = c.index),
    t.setAttribute("position", c.getAttribute("position")),
    t.setAttribute("uv", c.getAttribute("uv")),
    c.dispose(),
    t
  );
}
function It(c, t, i) {
  return t + (i - t) * c();
}
xe("memory-sunlit-cache", (c) => {
  c.add(new f_({ id: c.nextId("memory-sunlit-cache"), rng: c.rng }));
});
const $1 = 2.4,
  m_ = 4,
  y_ = 8,
  Bc = 2,
  Dc = 8,
  Nc = 0,
  g_ = [
    { x: -5, y: Nc, z: -1.2, width: Bc, height: Dc, hueShift: 0, intensity: 1 },
    { x: -2.8, y: Nc, z: -0.9, width: Bc, height: Dc, hueShift: 0.05, intensity: 0.95 },
    { x: 2.8, y: Nc, z: -0.9, width: Bc, height: Dc, hueShift: -0.03, intensity: 0.95 },
    { x: 5, y: Nc, z: -1.2, width: Bc, height: Dc, hueShift: 0.02, intensity: 1 },
  ],
  Wc = [1.2, 1.5, 1.8, 2.1, 2.4, 2.7, 3, 3.3],
  Jc = 128,
  Pv = 0.04,
  tb = 50,
  Uc = Wc.length * tb,
  sr = 600,
  v_ = 2,
  b_ = 2.8,
  ar = 200,
  Ha = 1.5,
  Wv = 12,
  x_ = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`,
  S_ = `
  uniform float time;
  uniform float opacity;
  uniform float intensity;
  uniform float hueShift;
  uniform float aspect;
  uniform float seed;
  varying vec2 vUv;

  float hash21(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  float vnoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash21(i);
    float b = hash21(i + vec2(1.0, 0.0));
    float c = hash21(i + vec2(0.0, 1.0));
    float d = hash21(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 5; i++) {
      v += a * vnoise(p);
      p *= 2.07;
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec2 d = min(vUv, 1.0 - vUv);
    vec2 du = d;
    du.y *= aspect;
    float edge = min(du.x, du.y);

    float rimWidth = 0.05;
    float rimT = 1.0 - smoothstep(0.0, rimWidth, d.x);
    float rimTy = 1.0 - smoothstep(0.0, rimWidth * aspect, d.y);
    float hotRim = max(rimT, rimTy);
    hotRim = pow(hotRim, 2.6);

    float mid = exp(-edge * 18.0);
    float wide = exp(-edge * 5.0);
    float frameMask = clamp(hotRim * 0.85 + mid * 0.22 + wide * 0.05, 0.0, 1.6);

    float interiorMask = smoothstep(0.0, 0.04, edge);

    float col1 = exp(-pow((vUv.x - 0.18) * 24.0, 2.0));
    float col2 = exp(-pow((vUv.x - 0.40) * 24.0, 2.0));
    float col3 = exp(-pow((vUv.x - 0.60) * 24.0, 2.0));
    float col4 = exp(-pow((vUv.x - 0.82) * 24.0, 2.0));
    float columns = (col1 + col2 + col3 + col4) * 1.6;
    float colFlick =
        (0.85 + 0.15 * sin(time * 2.1 + seed * 3.0)) * col1
      + (0.85 + 0.15 * sin(time * 2.6 + seed * 5.0)) * col2
      + (0.85 + 0.15 * sin(time * 1.8 + seed * 7.0)) * col3
      + (0.85 + 0.15 * sin(time * 2.3 + seed * 9.0)) * col4;
    columns *= 0.75 + 0.45 * colFlick;
    float colScan = 0.7 + 0.3 * sin(vUv.y * aspect * 6.0 - time * 1.6 + seed * 4.0);
    columns *= colScan;

    vec2 blockUV = vec2(floor(vUv.x * 8.0), floor(vUv.y * aspect * 12.0 - time * 1.2));
    float blockRand = hash21(blockUV + seed);
    float blockOn = step(0.72, blockRand);
    float blockEdge = smoothstep(0.0, 0.05, fract(vUv.x * 8.0)) *
                      smoothstep(0.0, 0.05, 1.0 - fract(vUv.x * 8.0)) *
                      smoothstep(0.0, 0.05, fract(vUv.y * aspect * 12.0)) *
                      smoothstep(0.0, 0.05, 1.0 - fract(vUv.y * aspect * 12.0));
    float blocks = blockOn * blockEdge;

    float codeY = vUv.y * aspect * 48.0 + time * 2.2 + seed * 7.0;
    float code = 0.5 + 0.5 * sin(codeY);
    code = pow(code, 6.0);
    float codeMask = step(0.45, hash21(vec2(floor(codeY), floor(vUv.x * 16.0) + seed)));
    code *= codeMask * 0.55;

    float haze = fbm(vec2(vUv.x * 4.0 + seed, vUv.y * aspect * 2.0 - time * 0.35));
    haze = smoothstep(0.35, 0.95, haze);

    float interior = interiorMask *
      (columns * 0.95 + blocks * 0.7 + code * 0.4 + haze * 0.3);

    float flick = 0.86 + 0.14 * sin(time * 6.8 + seed * 19.0);

    // Deep blue-leaning violet palette — never pink/magenta.
    vec3 violet = vec3(0.35, 0.18, 1.0);
    vec3 deep = vec3(0.12, 0.05, 0.55);
    vec3 accent = vec3(0.5, 0.28, 1.0);
    vec3 hotWhite = vec3(0.85, 0.65, 1.0);

    violet.r += hueShift * 0.5;
    violet.b -= hueShift * 0.3;
    accent.r += hueShift * 0.3;

    vec3 frameCol = mix(violet, accent, hotRim * 0.55);
    frameCol = mix(frameCol, hotWhite, hotRim * 0.55);

    vec3 intCol = deep;
    intCol = mix(intCol, violet, haze * 0.85 + columns * 0.45);
    intCol = mix(intCol, hotWhite, columns * 0.4);
    intCol = mix(intCol, accent, blocks * 0.7 + code * 0.6);

    float frameA = frameMask * flick * intensity;
    float intA = interior * intensity * 0.95;

    vec3 col = frameCol * frameA + intCol * intA;
    float alpha = clamp(frameA + intA, 0.0, 1.6) * opacity;

    if (alpha < 0.004) discard;
    gl_FragColor = vec4(col, alpha);
  }
`,
  w_ = `
  uniform float opacity;
  varying float vAlpha;
  void main() {
    vAlpha = opacity * 0.92;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`,
  A_ = `
  varying float vAlpha;
  void main() {
    vec3 gold = vec3(1.0, 0.78, 0.35);
    gl_FragColor = vec4(gold, vAlpha);
  }
`,
  M_ = `
  attribute float aSeed;
  uniform float time;
  uniform float opacity;
  varying float vAlpha;

  void main() {
    float tw = sin(time * (5.0 + aSeed * 4.0) + aSeed * 51.0) * 0.5 + 0.5;
    float spike = pow(tw, 3.0);
    vAlpha = opacity * (0.7 + spike * 0.4);

    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = (110.0 + spike * 90.0) / -mv.z;
    gl_Position = projectionMatrix * mv;
  }
`,
  __ = `
  varying float vAlpha;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float r = length(c);
    if (r > 0.5) discard;
    float core = exp(-r * 20.0);
    float a = vAlpha * core;
    vec3 gold = vec3(1.0, 0.85, 0.45);
    vec3 hot = vec3(1.0, 0.95, 0.7);
    vec3 col = mix(gold, hot, core);
    gl_FragColor = vec4(col * 1.6, a);
  }
`,
  T_ = `
  attribute float aSeed;
  attribute float aSize;
  attribute vec3 aBase;
  uniform float time;
  uniform float opacity;
  varying float vAlpha;
  varying float vSeed;

  void main() {
    vec3 pos = aBase;
    pos.x += sin(time * 0.6 + aSeed * 9.0) * 0.05;
    pos.y += cos(time * 0.55 + aSeed * 11.0) * 0.07;
    pos.z += sin(time * 0.5 + aSeed * 13.0) * 0.04;

    float tw = sin(time * (4.5 + aSeed * 5.5) + aSeed * 71.0) * 0.5 + 0.5;
    float spike = pow(tw, 5.0);
    vAlpha = opacity * (0.4 + spike * 0.95);
    vSeed = aSeed;

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = aSize * (340.0 + spike * 300.0) / -mv.z;
    gl_Position = projectionMatrix * mv;
  }
`,
  z_ = `
  varying float vAlpha;
  varying float vSeed;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float r = length(c);
    if (r > 0.5) discard;
    float core = exp(-r * 22.0);
    float cross = max(
      exp(-abs(c.x) * 42.0) * exp(-abs(c.y) * 6.0),
      exp(-abs(c.y) * 42.0) * exp(-abs(c.x) * 6.0)
    );
    float a = vAlpha * (core * 1.0 + cross * 0.75);

    vec3 cream = vec3(1.0, 0.82, 0.42);
    vec3 hot = vec3(1.0, 0.92, 0.6);
    vec3 col = mix(cream, hot, core);
    gl_FragColor = vec4(col * 1.8, a);
  }
`,
  E_ = `
  attribute float aSeed;
  attribute float aSize;
  attribute vec3 aBase;
  uniform float time;
  uniform float opacity;
  varying float vAlpha;

  void main() {
    vec3 pos = aBase;
    pos.x += sin(time * 0.7 + aSeed * 7.0) * 0.04;
    pos.y += cos(time * 0.65 + aSeed * 9.0) * 0.05;
    pos.z += sin(time * 0.55 + aSeed * 11.0) * 0.03;

    float tw = sin(time * (5.0 + aSeed * 6.0) + aSeed * 63.0) * 0.5 + 0.5;
    float spike = pow(tw, 4.0);
    vAlpha = opacity * (0.55 + spike * 0.9);

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = aSize * (380.0 + spike * 360.0) / -mv.z;
    gl_Position = projectionMatrix * mv;
  }
`,
  R_ = `
  varying float vAlpha;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float r = length(c);
    if (r > 0.5) discard;
    float core = exp(-r * 22.0);
    float cross = max(
      exp(-abs(c.x) * 46.0) * exp(-abs(c.y) * 5.0),
      exp(-abs(c.y) * 46.0) * exp(-abs(c.x) * 5.0)
    );
    float a = vAlpha * (core * 1.05 + cross * 0.95);

    vec3 cream = vec3(1.0, 0.85, 0.45);
    vec3 hot = vec3(1.0, 0.95, 0.7);
    vec3 col = mix(cream, hot, core);
    gl_FragColor = vec4(col * 2.0, a);
  }
`,
  C_ = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`,
  O_ = `
  uniform float time;
  uniform float opacity;
  varying vec2 vUv;

  void main() {
    vec2 c = vUv - 0.5;
    float radial = 1.0 - smoothstep(0.15, 0.5, length(c));

    vec2 g = abs(fract(vUv * 12.0) - 0.5);
    float gridLine = 1.0 - smoothstep(0.46, 0.5, max(g.x, g.y));

    vec2 cell = floor(vUv * 12.0);
    float major = step(0.5, mod(cell.x, 4.0)) * step(0.5, mod(cell.y, 4.0));
    vec3 violet = vec3(0.6, 0.35, 0.95);
    vec3 cool = vec3(0.4, 0.45, 0.7);
    vec3 col = mix(cool, violet, major);

    float scroll = 0.85 + 0.15 * sin(time * 0.6 + vUv.y * 8.0);
    col *= scroll;

    float a = gridLine * radial * 0.22 * opacity;
    if (a < 0.002) discard;
    gl_FragColor = vec4(col, a);
  }
`;
function B_(c, t, i) {
  return Math.max(t, Math.min(i, c));
}
function fu(c, t, i) {
  const s = B_((i - c) / (t - c), 0, 1);
  return s * s * (3 - 2 * s);
}
function xi(c, t, i) {
  return t + (i - t) * c();
}
function D_(c) {
  const t = fu(0, 0.22, c),
    i = 1 - fu(1.95, $1, c);
  return Math.min(1, t * 1.08) * i;
}
function N_(c, t, i) {
  const s = Math.cos(c),
    o = Math.sin(c),
    l = Math.cos(t),
    u = Math.sin(t),
    f = Math.cos(i),
    h = Math.sin(i);
  return {
    m00: s * f + o * u * h,
    m01: -s * h + o * u * f,
    m10: l * h,
    m11: l * f,
    m20: -o * f + s * u * h,
    m21: o * h + s * u * f,
  };
}
function U_(c, t) {
  const i = new be(c.width, c.height, 1, 1),
    s = {
      time: { value: 0 },
      opacity: { value: 0 },
      intensity: { value: c.intensity },
      hueShift: { value: c.hueShift },
      aspect: { value: c.height / c.width },
      seed: { value: t() * 100 },
    },
    o = new dt({
      uniforms: s,
      vertexShader: x_,
      fragmentShader: S_,
      transparent: !0,
      depthWrite: !1,
      depthTest: !0,
      side: Ne,
      blending: Rt,
    }),
    l = new $t(i, o);
  return (
    l.position.set(c.x, c.y, c.z),
    (l.frustumCulled = !1),
    (l.renderOrder = 1),
    { mesh: l, uniforms: s, geometry: i, material: o }
  );
}
function F_(c) {
  const t = [];
  for (let y = 0; y < Wc.length; y++) {
    const g = Wc[y],
      v = y % 2 === 0;
    t.push({
      radius: g,
      yaw: v ? xi(c, -0.35, 0.35) : Math.PI / 2 + xi(c, -0.25, 0.25),
      pitch: v ? Math.PI / 2 + xi(c, -0.25, 0.25) : xi(c, -0.35, 0.35),
      roll: xi(c, 0, Math.PI * 2),
      phase: c() * Math.PI * 2,
      speed: xi(c, 0.05, 0.13) * (v ? 1 : -1),
      seed: c(),
    });
  }
  const s = Jc * 2 * 2 * Wc.length,
    o = new Float32Array(s * 3),
    l = new At(),
    u = new H(o, 3);
  (u.setUsage(oi), l.setAttribute("position", u));
  const f = { time: { value: 0 }, opacity: { value: 0 } },
    h = new dt({
      uniforms: f,
      vertexShader: w_,
      fragmentShader: A_,
      transparent: !0,
      depthWrite: !1,
      depthTest: !0,
      blending: Rt,
    }),
    p = new U1(l, h);
  return (
    (p.frustumCulled = !1),
    (p.renderOrder = 5),
    { lines: p, uniforms: f, geometry: l, material: h, specs: t }
  );
}
function L_(c) {
  const t = new Float32Array(Uc * 3),
    i = new Float32Array(Uc),
    s = new Float32Array(Uc);
  for (let p = 0; p < Uc; p++) ((i[p] = c()), (s[p] = c()));
  const o = new At(),
    l = new H(t, 3);
  (l.setUsage(oi), o.setAttribute("position", l), o.setAttribute("aSeed", new H(i, 1)));
  const u = { time: { value: 0 }, opacity: { value: 0 } },
    f = new dt({
      uniforms: u,
      vertexShader: M_,
      fragmentShader: __,
      transparent: !0,
      depthWrite: !1,
      depthTest: !0,
      blending: Rt,
    }),
    h = new ne(o, f);
  return (
    (h.frustumCulled = !1),
    (h.renderOrder = 6),
    { points: h, uniforms: u, geometry: o, material: f, offsets: s }
  );
}
function k_(c) {
  const t = new Float32Array(sr * 3),
    i = new Float32Array(sr),
    s = new Float32Array(sr);
  for (let p = 0; p < sr; p++) {
    const y = c() * Math.PI,
      g = c() * Math.PI * 2,
      v = xi(c, v_, b_),
      b = Math.sin(y);
    ((t[p * 3] = v * b * Math.cos(g)),
      (t[p * 3 + 1] = v * Math.cos(y)),
      (t[p * 3 + 2] = v * b * Math.sin(g)),
      (i[p] = c()),
      (s[p] = xi(c, 0.045, 0.11)));
  }
  const o = new At(),
    l = new Float32Array(sr * 3);
  (o.setAttribute("position", new H(l, 3)),
    o.setAttribute("aBase", new H(t, 3)),
    o.setAttribute("aSeed", new H(i, 1)),
    o.setAttribute("aSize", new H(s, 1)));
  const u = { time: { value: 0 }, opacity: { value: 0 } },
    f = new dt({
      uniforms: u,
      vertexShader: T_,
      fragmentShader: z_,
      transparent: !0,
      depthWrite: !1,
      depthTest: !0,
      blending: Rt,
    }),
    h = new ne(o, f);
  return (
    (h.frustumCulled = !1),
    (h.renderOrder = 6),
    { points: h, uniforms: u, geometry: o, material: f }
  );
}
function H_(c) {
  const t = new Float32Array(ar * 3),
    i = new Float32Array(ar),
    s = new Float32Array(ar);
  let o = 0;
  for (; o < ar;) {
    const y = xi(c, -Ha, Ha),
      g = xi(c, -Ha, Ha);
    y * y + g * g > Ha * Ha ||
      ((t[o * 3] = y),
      (t[o * 3 + 1] = g),
      (t[o * 3 + 2] = xi(c, -0.3, 0.3)),
      (i[o] = c()),
      (s[o] = xi(c, 0.06, 0.13)),
      o++);
  }
  const l = new At(),
    u = new Float32Array(ar * 3);
  (l.setAttribute("position", new H(u, 3)),
    l.setAttribute("aBase", new H(t, 3)),
    l.setAttribute("aSeed", new H(i, 1)),
    l.setAttribute("aSize", new H(s, 1)));
  const f = { time: { value: 0 }, opacity: { value: 0 } },
    h = new dt({
      uniforms: f,
      vertexShader: E_,
      fragmentShader: R_,
      transparent: !0,
      depthWrite: !1,
      depthTest: !0,
      blending: Rt,
    }),
    p = new ne(l, h);
  return (
    (p.frustumCulled = !1),
    (p.renderOrder = 7),
    { points: p, uniforms: f, geometry: l, material: h }
  );
}
function V_() {
  const c = new be(Wv, Wv, 1, 1),
    t = { time: { value: 0 }, opacity: { value: 0 } },
    i = new dt({
      uniforms: t,
      vertexShader: C_,
      fragmentShader: O_,
      transparent: !0,
      depthWrite: !1,
      depthTest: !1,
      side: Ne,
      blending: Rt,
    }),
    s = new $t(c, i);
  return (
    (s.rotation.x = -Math.PI / 2),
    s.position.set(0, -3, 0),
    (s.frustumCulled = !1),
    (s.renderOrder = 0),
    { mesh: s, uniforms: t, geometry: c, material: i }
  );
}
class G_ {
  id;
  object;
  done = !1;
  elapsed = 0;
  portals;
  rings;
  travellers;
  sparks;
  tightSparks;
  floor;
  constructor(t, i) {
    ((this.id = t),
      (this.object = new ve()),
      (this.object.renderOrder = 1),
      (this.portals = g_.map((s) => U_(s, i))),
      (this.rings = F_(i)),
      (this.travellers = L_(i)),
      (this.sparks = k_(i)),
      (this.tightSparks = H_(i)),
      (this.floor = V_()),
      this.object.add(this.floor.mesh));
    for (const s of this.portals) this.object.add(s.mesh);
    (this.object.add(this.rings.lines),
      this.object.add(this.travellers.points),
      this.object.add(this.sparks.points),
      this.object.add(this.tightSparks.points));
  }
  update(t, i, s) {
    this.elapsed += i;
    const o = this.elapsed,
      l = D_(o),
      u = fu(0.55, 1.15, o) * (1 - fu(1.55, 2.05, o));
    (this.object.position.copy(s.position), this.object.scale.set(s.size.x / m_, s.size.y / y_, 1));
    const f = Math.min(1, l * 0.96 + u * 0.1);
    for (const h of this.portals) ((h.uniforms.time.value = o), (h.uniforms.opacity.value = f));
    if (
      ((this.rings.uniforms.time.value = o),
      (this.rings.uniforms.opacity.value = l * (0.95 + u * 0.1)),
      (this.travellers.uniforms.time.value = o),
      (this.travellers.uniforms.opacity.value = l * (0.95 + u * 0.15)),
      this.updateRings(o),
      (this.sparks.uniforms.time.value = o),
      (this.sparks.uniforms.opacity.value = l * (0.9 + u * 0.25)),
      (this.tightSparks.uniforms.time.value = o),
      (this.tightSparks.uniforms.opacity.value = l * (0.95 + u * 0.25)),
      (this.floor.uniforms.time.value = o),
      (this.floor.uniforms.opacity.value = l * (0.6 + u * 0.2)),
      o >= $1)
    ) {
      this.done = !0;
      for (const h of this.portals) h.uniforms.opacity.value = 0;
      ((this.rings.uniforms.opacity.value = 0),
        (this.travellers.uniforms.opacity.value = 0),
        (this.sparks.uniforms.opacity.value = 0),
        (this.tightSparks.uniforms.opacity.value = 0),
        (this.floor.uniforms.opacity.value = 0));
    }
  }
  dispose() {
    for (const t of this.portals) (t.geometry.dispose(), t.material.dispose());
    (this.rings.geometry.dispose(),
      this.rings.material.dispose(),
      this.travellers.geometry.dispose(),
      this.travellers.material.dispose(),
      this.sparks.geometry.dispose(),
      this.sparks.material.dispose(),
      this.tightSparks.geometry.dispose(),
      this.tightSparks.material.dispose(),
      this.floor.geometry.dispose(),
      this.floor.material.dispose());
  }
  updateRings(t) {
    const i = this.rings.geometry.getAttribute("position"),
      s = i.array,
      o = this.travellers.geometry.getAttribute("position"),
      l = o.array,
      u = this.travellers.offsets;
    let f = 0,
      h = 0;
    for (let p = 0; p < this.rings.specs.length; p++) {
      const y = this.rings.specs[p],
        g = t * y.speed + y.phase,
        v = N_(y.yaw, y.pitch, y.roll),
        b = y.radius + Pv * 0.5,
        S = y.radius - Pv * 0.5;
      for (let M = 0; M < Jc; M++) {
        const T = M / Jc,
          O = (M + 1) / Jc,
          C = g + T * Math.PI * 2,
          E = g + O * Math.PI * 2,
          U = Math.cos(C),
          q = Math.sin(C),
          X = Math.cos(E),
          G = Math.sin(E),
          W = b * U,
          P = b * q,
          Q = b * X,
          rt = b * G;
        ((s[f] = v.m00 * W + v.m01 * P),
          (s[f + 1] = v.m10 * W + v.m11 * P),
          (s[f + 2] = v.m20 * W + v.m21 * P),
          (s[f + 3] = v.m00 * Q + v.m01 * rt),
          (s[f + 4] = v.m10 * Q + v.m11 * rt),
          (s[f + 5] = v.m20 * Q + v.m21 * rt),
          (f += 6));
        const ht = S * U,
          xt = S * q,
          ft = S * X,
          L = S * G;
        ((s[f] = v.m00 * ht + v.m01 * xt),
          (s[f + 1] = v.m10 * ht + v.m11 * xt),
          (s[f + 2] = v.m20 * ht + v.m21 * xt),
          (s[f + 3] = v.m00 * ft + v.m01 * L),
          (s[f + 4] = v.m10 * ft + v.m11 * L),
          (s[f + 5] = v.m20 * ft + v.m21 * L),
          (f += 6));
      }
      const A = 0.18 + (p % 3) * 0.06;
      for (let M = 0; M < tb; M++) {
        const O = (u[h] + t * A + y.phase * 0.1) % 1,
          C = g + O * Math.PI * 2,
          E = y.radius * Math.cos(C),
          U = y.radius * Math.sin(C);
        ((l[h * 3] = v.m00 * E + v.m01 * U),
          (l[h * 3 + 1] = v.m10 * E + v.m11 * U),
          (l[h * 3 + 2] = v.m20 * E + v.m21 * U),
          h++);
      }
    }
    ((i.needsUpdate = !0), (o.needsUpdate = !0));
  }
}
xe("portal-sacrifice-aegis", (c) => {
  c.add(new G_(c.nextId("portal-sacrifice-aegis"), c.rng));
});
const eb = 2.25,
  Jv = { width: 4, height: 8 },
  Mu = 4,
  _u = -3.5,
  c0 = 5,
  ib = c0 - _u,
  du = 1.55,
  u0 = 7.6,
  Yd = 50,
  qd = 25,
  j_ = Yd * 2 * qd,
  _d = 4,
  Td = 500,
  Y_ = 0.07,
  q_ = 0.22,
  X_ = 0.3,
  Qv = 0.15,
  I_ = `
  attribute vec4 aData0; // headPhase, fallSpeed, trailLength, dashWorldHeight
  attribute vec4 aData1; // blinkPhase, blinkRate, colorIndex, glyphHash

  uniform float elapsed;
  uniform float envelope;
  uniform float uPixelRatio;
  uniform float uColumnGroupScale; // converts world-units → screen-px for gl_PointSize
  uniform float uTopY;
  uniform float uFloorY;
  uniform float uDashWidth;

  varying float vAlpha;
  varying float vColorIndex;
  varying float vHeadBoost;   // 1.0 at head, 0 elsewhere
  varying float vTrailT;       // 0..1 along the trail (0 = head)
  varying float vAspect;       // dashHeight / dashWidth, used in frag for rect mask
  varying float vGlyphSeed;    // hashed per-dash seed for bit pattern

  // Cheap deterministic hash.
  float hash11(float n) { return fract(sin(n) * 43758.5453); }

  void main() {
    float columnX  = position.x;
    float dashIdx  = position.y; // 0..(DASHES_PER_COLUMN-1)
    float columnZ  = position.z;

    float headPhase    = aData0.x;
    float fallSpeed    = aData0.y;
    float trailLen     = aData0.z;
    float dashHeight   = aData0.w;

    float blinkPhase   = aData1.x;
    float blinkRate    = aData1.y;
    float colorIndex   = aData1.z;
    float glyphHash    = aData1.w;

    // Total wrap distance: full frame height plus the trail spillover so dashes
    // glide off the bottom before the column reseeds at the top.
    float wrap = (uTopY - uFloorY) + trailLen * dashHeight;
    float t = headPhase + elapsed * fallSpeed;
    float headY = uTopY - mod(t, wrap);

    // Each dash sits dashIdx slots ABOVE the head.
    float y = headY + dashIdx * dashHeight;

    // Exponential trail falloff: head=1.0, fades quickly up the trail.
    float trailT = clamp(dashIdx / max(trailLen, 1.0), 0.0, 1.0);
    float trailFade = exp(-trailT * 3.2);
    float headBoost = step(dashIdx, 0.5); // 1.0 only for dashIdx == 0

    // Hide dashes that have scrolled below the floor or above the top.
    float visBelow = smoothstep(uFloorY - dashHeight, uFloorY + 0.2, y);
    float visAbove = 1.0 - smoothstep(uTopY - 0.1, uTopY + dashHeight, y);
    float vis = visBelow * visAbove;

    // Deterministic shimmer (heads sit a touch brighter and steadier).
    float blink = 0.78 + 0.22 * sin(elapsed * blinkRate + blinkPhase);
    float headSteady = mix(blink, 1.0, headBoost * 0.65);

    vec3 worldPos = vec3(columnX, y, columnZ);
    vec4 mv = modelViewMatrix * vec4(worldPos, 1.0);

    // Convert dash world-height to a screen point size.  We use dashHeight as
    // the dominant dimension (taller than wide); the frag clamps width via
    // gl_PointCoord so the visible glyph is a tall rectangle.
    float pxPerWorld = uColumnGroupScale / -mv.z;
    float pointSize = dashHeight * pxPerWorld * uPixelRatio;
    gl_PointSize = max(3.0, pointSize);

    vAspect    = dashHeight / max(uDashWidth, 0.0001);
    vAlpha     = envelope * vis * headSteady * (trailFade + headBoost * 0.8);
    vColorIndex = colorIndex;
    vHeadBoost  = headBoost;
    vTrailT     = trailT;

    // Per-dash glyph seed: column hash + dash slot + a slow phase tick so the
    // characters appear to change as the rain scrolls.
    float phaseTick = floor(t / max(dashHeight, 0.0001));
    vGlyphSeed = hash11(glyphHash * 91.17 + dashIdx * 7.31 + phaseTick * 0.13);

    gl_Position = projectionMatrix * mv;
  }
`,
  Z_ = `
  precision mediump float;

  varying float vAlpha;
  varying float vColorIndex;
  varying float vHeadBoost;
  varying float vTrailT;
  varying float vAspect;
  varying float vGlyphSeed;

  vec3 paletteColor(float idx) {
    if (idx < 0.5) return vec3(0.30, 0.95, 1.00); // cyan dominant
    if (idx < 1.5) return vec3(0.35, 1.00, 0.45); // green
    return vec3(1.00, 0.82, 0.30);                // warm yellow / amber
  }

  // Deterministic 15-bit "bit set" lookup for a hashed 3x5 glyph.  Each pixel
  // (col,row) maps to a bit index 0..14; whether that bit is "on" is decided
  // by hashing (seed, bitIndex) and comparing against a fill threshold so
  // every glyph gets a different but coherent character-like silhouette.
  float bitForCell(float seed, float col, float row) {
    float bitIndex = row * 3.0 + col;
    // Two hashes so bit decisions are independent across cells.
    float h = fract(sin(seed * 53.71 + bitIndex * 7.13) * 43758.5453);
    // Bias toward ~55 % on-pixels → looks like a glyph rather than noise.
    return step(0.45, h);
  }

  void main() {
    if (vAlpha <= 0.001) discard;

    // gl_PointCoord is 0..1 over the square Point sprite.  We want a narrow
    // vertical 3x5 cell grid inside the sprite.  Reject pixels outside a thin
    // vertical strip first (so the sprite reads as character-shaped).
    vec2 p = gl_PointCoord - 0.5;          // -0.5..0.5
    float halfWidth = 0.5 / vAspect;       // narrow band
    if (abs(p.x) > halfWidth) discard;

    // Map p into a 3x5 cell grid spanning the inner strip.
    float u = (p.x + halfWidth) / (2.0 * halfWidth); // 0..1 across width
    float v = (p.y + 0.45) / 0.9;                    // 0..1 across height
    if (v < 0.0 || v > 1.0) discard;

    float col = floor(u * 3.0);
    float row = floor(v * 5.0);
    // Clamp in case of edge sampling.
    col = clamp(col, 0.0, 2.0);
    row = clamp(row, 0.0, 4.0);

    float lit = bitForCell(vGlyphSeed, col, row);

    // Sub-cell soft edge so the pixels don't strobe at small sizes.
    vec2 cellUV = vec2(fract(u * 3.0), fract(v * 5.0));
    vec2 cellD = abs(cellUV - 0.5);
    float cellMask = (1.0 - smoothstep(0.42, 0.5, max(cellD.x, cellD.y)));
    float mask = lit * cellMask;
    if (mask <= 0.001) discard;

    vec3 color = paletteColor(vColorIndex);

    // Leading head: pure white-cyan (0.9, 1.0, 1.0) overriding palette tint.
    vec3 headWhite = vec3(0.9, 1.0, 1.0);
    color = mix(color, headWhite, vHeadBoost);

    // Slight dim of the deep trail in the colour itself, so the falloff
    // reads as faded ink rather than just opacity.
    color *= mix(1.0, 0.55, vTrailT);

    gl_FragColor = vec4(color, mask * vAlpha);
  }
`,
  P_ = `
  void main() {
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`,
  W_ = `
  uniform float envelope;
  uniform float elapsed;
  void main() {
    float pulse = 0.55 + 0.25 * sin(elapsed * 1.4);
    vec3 rail = vec3(0.18, 0.42, 0.55);
    gl_FragColor = vec4(rail, envelope * pulse * 0.35);
  }
`,
  J_ = `
  attribute vec2 aData; // (twinklePhase, sizeScale)

  uniform float elapsed;
  uniform float envelope;
  uniform float uPixelRatio;

  varying float vTwinkle;

  void main() {
    float twinklePhase = aData.x;
    float sizeScale    = aData.y;

    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    float pxPerWorld = 320.0 / -mv.z;
    gl_PointSize = max(2.0, sizeScale * pxPerWorld * uPixelRatio);

    vTwinkle = envelope * (0.55 + 0.45 * sin(elapsed * 1.7 + twinklePhase));
    gl_Position = projectionMatrix * mv;
  }
`,
  Q_ = `
  precision mediump float;
  varying float vTwinkle;
  void main() {
    if (vTwinkle <= 0.001) discard;
    vec2 p = gl_PointCoord - 0.5;
    float r = length(p);
    if (r > 0.5) discard;
    // Soft round dot, very dim.
    float mask = 1.0 - smoothstep(0.0, 0.5, r);
    vec3 col = vec3(0.45, 0.85, 1.0);
    gl_FragColor = vec4(col, mask * vTwinkle * 0.22);
  }
`;
function Kv(c, t, i) {
  const s = Math.min(1, Math.max(0, (i - c) / (t - c)));
  return s * s * (3 - 2 * s);
}
function K_(c) {
  return Kv(0, 0.28, c) * (1 - Kv(1.82, eb, c));
}
function Tu(c, t) {
  ((c.frustumCulled = !1), (c.renderOrder = t));
}
function $_(c) {
  const t = c();
  return t < Qv ? 2 : t < Qv + X_ ? 1 : 0;
}
function tT(c) {
  return {
    positions: new Float32Array(c * 3),
    data0: new Float32Array(c * 4),
    data1: new Float32Array(c * 4),
  };
}
function eT(c, t) {
  let i = 0;
  for (let s = 0; s < 2; s++) {
    const o = s === 0 ? -1 : 1;
    for (let l = 0; l < Yd; l++) {
      const u = l / Math.max(1, Yd - 1),
        f = Math.pow(u, 0.82),
        h = du + f * (u0 - du),
        p = (t() - 0.5) * 0.08,
        y = o * (h + p),
        g = -1 - f * 4 - t() * 0.9,
        v = t() * (ib + 4),
        b = 4.2 + t() * 3.2,
        S = qd - 1,
        A = $_(t),
        M = t() * 1e3,
        T = 2.6 + t() * 4,
        O = t() * Math.PI * 2;
      for (let C = 0; C < qd; C++) {
        const E = i * 3;
        ((c.positions[E] = y), (c.positions[E + 1] = C), (c.positions[E + 2] = g));
        const U = i * 4;
        ((c.data0[U] = v),
          (c.data0[U + 1] = b),
          (c.data0[U + 2] = S),
          (c.data0[U + 3] = q_),
          (c.data1[U] = O + C * 0.31),
          (c.data1[U + 1] = T),
          (c.data1[U + 2] = A),
          (c.data1[U + 3] = M + C * 0.17),
          (i += 1));
      }
    }
  }
}
function iT(c, t) {
  const i = new At();
  (i.setAttribute("position", new H(c.positions, 3)),
    i.setAttribute("aData0", new H(c.data0, 4)),
    i.setAttribute("aData1", new H(c.data1, 4)));
  const s = new dt({
      uniforms: {
        elapsed: { value: 0 },
        envelope: { value: 0 },
        uPixelRatio: { value: t },
        uColumnGroupScale: { value: 520 },
        uTopY: { value: c0 },
        uFloorY: { value: _u },
        uDashWidth: { value: Y_ },
      },
      vertexShader: I_,
      fragmentShader: Z_,
      transparent: !0,
      depthWrite: !1,
      depthTest: !0,
      blending: Rt,
    }),
    o = new ne(i, s);
  return (Tu(o, Mu + 2), { points: o, material: s, geometry: i });
}
function nT(c) {
  const t = _d * 2,
    i = new Float32Array(t * 2 * 3);
  let s = 0;
  for (let f = 0; f < 2; f++) {
    const h = f === 0 ? -1 : 1;
    for (let p = 0; p < _d; p++) {
      const y = (p + 0.5) / _d,
        g = Math.pow(y, 0.8),
        v = h * (du + 0.4 + g * (u0 - du - 0.4)),
        b = -1.2 - g * 3.4 - c() * 0.4;
      ((i[s * 3] = v),
        (i[s * 3 + 1] = _u + 0.1),
        (i[s * 3 + 2] = b),
        s++,
        (i[s * 3] = v),
        (i[s * 3 + 1] = c0 - 0.1),
        (i[s * 3 + 2] = b),
        s++);
    }
  }
  const o = new At();
  o.setAttribute("position", new H(i, 3));
  const l = new dt({
      uniforms: { elapsed: { value: 0 }, envelope: { value: 0 } },
      vertexShader: P_,
      fragmentShader: W_,
      transparent: !0,
      depthWrite: !1,
      depthTest: !1,
      blending: Rt,
    }),
    u = new U1(o, l);
  return (Tu(u, Mu), { lines: u, geometry: o, material: l });
}
function sT(c, t) {
  const i = new Float32Array(Td * 3),
    s = new Float32Array(Td * 2);
  for (let f = 0; f < Td; f++) {
    const h = c() < 0.5 ? -1 : 1,
      p = c(),
      y = 0.4 + Math.pow(p, 0.7) * (u0 + 0.6),
      g = h * y,
      v = Math.pow(c(), 1.8),
      b = _u + 0.15 + v * (ib - 0.3),
      S = -2.5 - c() * 5;
    ((i[f * 3] = g),
      (i[f * 3 + 1] = b),
      (i[f * 3 + 2] = S),
      (s[f * 2] = c() * Math.PI * 2),
      (s[f * 2 + 1] = 0.05 + c() * 0.08));
  }
  const o = new At();
  (o.setAttribute("position", new H(i, 3)), o.setAttribute("aData", new H(s, 2)));
  const l = new dt({
      uniforms: { elapsed: { value: 0 }, envelope: { value: 0 }, uPixelRatio: { value: t } },
      vertexShader: J_,
      fragmentShader: Q_,
      transparent: !0,
      depthWrite: !1,
      depthTest: !1,
      blending: Rt,
    }),
    u = new ne(o, l);
  return (Tu(u, Mu + 1), { points: u, geometry: o, material: l });
}
class aT {
  id;
  object;
  done = !1;
  elapsed = 0;
  dashes;
  rails;
  bokeh;
  constructor(t, i) {
    ((this.id = t), (this.object = new ve()), Tu(this.object, Mu));
    const s = tT(j_);
    eT(s, i);
    const o =
      typeof window < "u" && window.devicePixelRatio ? Math.min(2, window.devicePixelRatio) : 1;
    ((this.dashes = iT(s, o)),
      (this.rails = nT(i)),
      (this.bokeh = sT(i, o)),
      this.object.add(this.rails.lines, this.bokeh.points, this.dashes.points));
  }
  update(t, i, s) {
    this.elapsed += i;
    const o = K_(this.elapsed);
    (this.object.position.copy(s.position),
      this.object.scale.set(s.size.x / Jv.width, s.size.y / Jv.height, 1),
      (this.dashes.material.uniforms.elapsed.value = this.elapsed),
      (this.dashes.material.uniforms.envelope.value = o),
      (this.rails.material.uniforms.elapsed.value = this.elapsed),
      (this.rails.material.uniforms.envelope.value = o),
      (this.bokeh.material.uniforms.elapsed.value = this.elapsed),
      (this.bokeh.material.uniforms.envelope.value = o),
      this.elapsed >= eb &&
        ((this.done = !0),
        (this.dashes.material.uniforms.envelope.value = 0),
        (this.rails.material.uniforms.envelope.value = 0),
        (this.bokeh.material.uniforms.envelope.value = 0)));
  }
  dispose() {
    (this.dashes.geometry.dispose(),
      this.dashes.material.dispose(),
      this.rails.geometry.dispose(),
      this.rails.material.dispose(),
      this.bokeh.geometry.dispose(),
      this.bokeh.material.dispose());
  }
}
xe("server-aisle-pulse", (c) => {
  c.add(new aT(c.nextId("server-aisle-pulse"), c.rng));
});
const zd = 2.6,
  $v = { width: 4, height: 8 },
  Cs = 5,
  Xd = 4,
  Id = -3,
  hr = -0.5,
  nb = 0.75,
  sb = 2,
  ab = 0.2,
  t1 = 16,
  or = 5,
  oT = 0.5,
  Fc = 0.44,
  e1 = 0.62,
  rT = 0.72,
  lT = 0.18,
  Lc = 0.04,
  cT = 0.7,
  uT = 1.15,
  hT = 64,
  fT = 0.1,
  dT = 0.32,
  pT = 0.018,
  mT = 0.035,
  yT = 180,
  gT = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`,
  vT = `
  uniform float envelope;
  uniform float time;
  uniform vec3 violet;
  uniform vec3 blue;
  uniform vec3 sheen;        // dense violet ambient sheen color
  uniform float sheenAlpha;  // peak alpha for the sheen plate
  varying vec2 vUv;

  void main() {
    vec2 d = vUv - vec2(0.5);
    float r = length(d);
    float core = exp(-r * r * 6.0);
    float halo = exp(-r * r * 1.8) * 0.55;
    float breathe = 0.85 + 0.15 * sin(time * 1.7);
    vec3 color = mix(violet, blue, 0.5 + 0.5 * sin(time * 0.6 + r * 5.0));
    // dense ambient sheen — broad violet wash that fills the frame.
    float wash = exp(-r * r * 0.6);
    float a = (core * 0.4 + halo * 0.6) * envelope * 0.42 * breathe;
    a += wash * sheenAlpha * envelope;
    color = mix(color, sheen, clamp(wash, 0.0, 1.0));
    gl_FragColor = vec4(color, a);
  }
`,
  bT = `
  attribute float aSeed;
  attribute float aTaper;
  attribute float aSide;
  attribute float aColorMix;
  attribute float aFlow;
  attribute vec2 aNormal;
  attribute float aThick;

  uniform float time;
  uniform float envelope;

  varying float vAlpha;
  varying float vColorMix;
  varying float vTaper;
  varying float vPulse;
  varying float vSide;

  void main() {
    vec3 pos = position;
    // micro-jitter so the bolt crawls — bigger near tip (low taper).
    float crawl = sin(time * 9.0 + aSeed * 37.0) * 0.015 * (1.2 - aTaper);
    pos.xy += vec2(sin(aSeed * 19.0 + time * 3.0), cos(aSeed * 23.0 + time * 2.6)) * crawl;

    // extrude along normal by per-vertex thickness × side
    pos.xy += aNormal * aThick * aSide;

    // traveling pulse along the bolt's flow coordinate
    float w1 = exp(-pow((fract(time * 0.55 + aSeed * 0.31) - aFlow) * 7.0, 2.0));
    float w2 = exp(-pow((fract(time * 0.83 + aSeed * 0.17) - aFlow) * 9.0, 2.0));
    vPulse = clamp(w1 + w2 * 0.7, 0.0, 1.6);

    // dropout flicker — synapse blackout buckets
    float bucket = floor(time * 16.0 + aSeed * 7.0);
    float dropout = step(0.07, fract(sin(bucket + aSeed * 97.7) * 43758.5453));
    float shimmer = 0.88 + 0.12 * sin(time * 11.0 + aSeed * 61.0);

    // brighter floor — never drops below 0.70, peaks at 1.0 at root.
    vAlpha = envelope * dropout * shimmer * (0.70 + 0.30 * aTaper);
    vColorMix = aColorMix;
    vTaper = aTaper;
    vSide = aSide;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`,
  xT = `
  uniform vec3 violet;       // base electric violet (0.55, 0.25, 1.0)
  uniform vec3 blue;         // electric blue accent (0.30, 0.50, 1.0)
  uniform vec3 lightViolet;  // hot violet highlight (0.80, 0.50, 1.0)
  uniform float baseOpacity;
  uniform float isHalo;      // 0 for sharp core pass, 1 for soft bloom halo pass

  varying float vAlpha;
  varying float vColorMix;
  varying float vTaper;
  varying float vPulse;
  varying float vSide;

  void main() {
    if (vAlpha <= 0.001) discard;
    float edge = 1.0 - abs(vSide);

    // sharp neon-tube core for the bolt pass; soft gaussian for halo pass.
    // softer core exponent so the ribbon body is broadly bright, not a hairline.
    float core = pow(edge, 1.8);                  // broad-body core, still tapered
    float soft = exp(-pow((1.0 - edge) * 1.8, 2.0));

    float intensity = mix(core, soft, isHalo);
    intensity *= (0.95 + 0.45 * vPulse);

    // Bright violet core color — additive blending will clamp channels >1.0.
    // Channels intentionally exceed 1.0 to guarantee a vivid violet on screen.
    vec3 base = mix(violet, blue, clamp(vColorMix, 0.0, 1.0));
    vec3 hotCore = vec3(0.8, 0.5, 1.2);
    // Lerp toward the hot core based on how central we are within the ribbon.
    vec3 color = mix(base, hotCore, edge);

    float alphaMul = mix(1.0, 0.35, isHalo);    // halo pass dimmer
    // alpha already includes ribbon falloff (intensity) and the per-vertex vAlpha.
    float alpha = intensity * vAlpha * baseOpacity * alphaMul;
    gl_FragColor = vec4(color, clamp(alpha, 0.0, 1.0));
  }
`,
  ST = `
  attribute float aSize;
  attribute float aSeed;
  attribute float aStrength;
  attribute float aColorMix;
  attribute float aCore;

  uniform float time;
  uniform float envelope;
  uniform float pointScale;

  varying float vAlpha;
  varying float vColorMix;
  varying float vCore;
  varying float vBoom;

  void main() {
    vec3 pos = position;
    pos.xy += vec2(sin(time * 4.5 + aSeed * 29.0), cos(time * 3.2 + aSeed * 31.0)) * 0.012;

    float pulse = 0.72 + 0.28 * sin(time * 9.0 + aSeed * 41.0);
    float boom = smoothstep(0.84, 1.0, fract(sin(floor(time * 2.4) + aSeed * 73.0) * 43758.5453));
    vBoom = boom * aCore;

    float bucket = floor(time * 11.0 + aSeed * 11.0);
    float dropout = step(0.08, fract(sin(bucket + aSeed * 41.7) * 43758.5453));
    float coreKeep = mix(dropout, 1.0, smoothstep(0.40, 0.85, aCore));

    vAlpha = envelope * aStrength * pulse * coreKeep;
    vColorMix = aColorMix;
    vCore = aCore;

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    float boost = 1.0 + boom * 0.6;
    gl_PointSize = aSize * pointScale * boost / -mv.z;
    gl_Position = projectionMatrix * mv;
  }
`,
  wT = `
  uniform vec3 violet;     // vivid violet base
  uniform vec3 blue;       // electric blue
  uniform vec3 hotCore;    // hot violet core (0.7, 0.4, 1.0) — NOT white

  varying float vAlpha;
  varying float vColorMix;
  varying float vCore;
  varying float vBoom;

  void main() {
    if (vAlpha <= 0.001) discard;
    vec2 d = gl_PointCoord - 0.5;
    float r = length(d);
    if (r > 0.5) discard;

    float core = exp(-r * r * 85.0);
    float halo = exp(-r * r * 13.0) * 0.8;
    float bigHalo = exp(-r * r * 4.0) * 0.36 * (0.4 + vCore);
    float flareX = smoothstep(0.04, 0.0, abs(d.x)) * smoothstep(0.5, 0.0, abs(d.y)) * 0.55;
    float flareY = smoothstep(0.04, 0.0, abs(d.y)) * smoothstep(0.5, 0.0, abs(d.x)) * 0.55;
    float cross = (flareX + flareY) * (0.3 + vCore * 0.9);

    // Bright violet knot — channels can exceed 1.0; additive blending clamps.
    vec3 base = mix(violet, blue, clamp(vColorMix, 0.0, 1.0));
    float intensity = core + halo + bigHalo + cross + vBoom * 0.55;
    // hot core color is bright violet (>1.0 in B), blended in by core weight.
    vec3 color = mix(base, hotCore, clamp(core * (0.7 + vCore) + vBoom * 0.5, 0.0, 1.0));
    // do not multiply color by intensity — let alpha carry the falloff so the
    // hue stays bright violet rather than getting dimmed toward black.
    gl_FragColor = vec4(color, clamp(intensity * vAlpha, 0.0, 1.0));
  }
`,
  AT = `
  attribute float aSeed;
  attribute vec2 aHalfSize;
  attribute float aSide;     // -1 / +1 along streak's long axis
  attribute float aRow;      // -1 / +1 across streak height
  attribute float aPhase;
  attribute float aHue;      // 0 cyan ↔ 1 deeper blue

  uniform float time;
  uniform float envelope;

  varying float vAlpha;
  varying float vHue;
  varying vec2 vLocal;

  void main() {
    vec3 pos = position;
    pos.x += aSide * aHalfSize.x;
    pos.y += aRow * aHalfSize.y;

    // packet flicker — short on-pulses
    float bucket = floor(time * 7.0 + aPhase * 11.0 + aSeed * 5.0);
    float onoff = step(0.45, fract(sin(bucket + aSeed * 73.0) * 43758.5453));
    float wave = 0.5 + 0.5 * sin(time * 12.0 + aPhase * 6.0);

    vAlpha = envelope * onoff * (0.5 + 0.5 * wave);
    vHue = aHue;
    vLocal = vec2(aSide, aRow);

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`,
  MT = `
  uniform vec3 cyan;
  uniform vec3 blue;

  varying float vAlpha;
  varying float vHue;
  varying vec2 vLocal;

  void main() {
    if (vAlpha <= 0.001) discard;
    float fx = 1.0 - abs(vLocal.x);          // soft horizontal taper
    float fy = 1.0 - abs(vLocal.y);          // soft vertical edge
    float mask = pow(fx, 0.6) * pow(fy, 1.5);
    vec3 color = mix(cyan, blue, clamp(vHue, 0.0, 1.0));
    color += vec3(0.7, 0.95, 1.0) * pow(fx, 4.0) * 0.6;
    gl_FragColor = vec4(color, mask * vAlpha * 0.85);
  }
`;
function Nt(c, t, i) {
  return t + (i - t) * c();
}
function i1(c, t, i) {
  const s = Math.min(1, Math.max(0, (i - c) / (t - c)));
  return s * s * (3 - 2 * s);
}
function Qc(c, t, i) {
  return { x: c, y: t, z: i };
}
function Zd(c) {
  const t = c.x / nb,
    i = (c.y - ab) / sb;
  return t * t + i * i <= 1;
}
function _T(c) {
  return c.x >= -Cs - 0.4 && c.x <= Cs + 0.4 && c.y >= Id - 0.4 && c.y <= Xd + 0.4;
}
function n1(c, t, i, s, o, l, u, f, h, p, y) {
  const g = i.x - t.x,
    v = i.y - t.y,
    b = Math.hypot(g, v) || 1,
    S = -v / b,
    A = g / b,
    M = (O) => ({
      point: t,
      seed: f,
      taper: s,
      side: O,
      colorMix: h,
      flow: p,
      nx: S,
      ny: A,
      thick: l,
    }),
    T = (O) => ({
      point: i,
      seed: f,
      taper: o,
      side: O,
      colorMix: h,
      flow: y,
      nx: S,
      ny: A,
      thick: u,
    });
  (c.push(M(-1), M(1), T(-1)), c.push(M(1), T(1), T(-1)));
}
function ob(c, t, i, s, o, l, u, f, h) {
  if (o >= or || s < 0.04) return;
  const { rng: p } = c,
    y = 3 + Math.floor(p() * 3);
  let g = t,
    v = i;
  const b = 1 / or;
  for (let O = 0; O < y; O++) {
    const C = O / y,
      E = (O + 1) / y;
    v += Nt(p, -Fc * 0.35, Fc * 0.35);
    const U = (s / y) * Nt(p, 0.85, 1.18),
      q = Qc(g.x + Math.cos(v) * U, g.y + Math.sin(v) * U, g.z + Nt(p, -0.03, 0.03));
    if (Zd(q) || !_T(q)) return;
    const X = Math.max(0, h - C * b),
      G = Math.max(0, h - E * b),
      W = Lc + (f - Lc) * X,
      P = Lc + (f - Lc) * G,
      Q = l + Nt(p, -0.12, 0.12),
      rt = u + o * 0.13 + O * 0.041;
    (n1(c.bolts, g, q, X, G, W, P, rt, Q, C, E),
      n1(c.halo, g, q, X, G, W * 2.5, P * 2.5, rt + 0.5, Q, C, E),
      (g = q));
  }
  c.knotBudget.remaining > 0 &&
    p() < 0.55 &&
    ((c.knotBudget.remaining -= 1),
    c.knots.push({
      point: g,
      size: Nt(p, 0.14, 0.32) * (1 + (or - o) * 0.08),
      seed: p(),
      strength: 0.6 + 0.3 * (1 - o / or),
      colorMix: l + Nt(p, -0.15, 0.15),
      core: 0.45 + 0.45 * (1 - o / or),
    }));
  const S = p() < oT ? 2 : 1,
    A = s * rT * Nt(c.rng, 0.85, 1.15),
    M = f * 0.78,
    T = Math.max(0, h - b);
  for (let O = 0; O < S; O++) {
    const C = S === 2 ? (O === 0 ? -1 : 1) : 0,
      E = C === 0 ? Nt(p, -Fc, Fc) : C * Nt(p, e1 * 0.5, e1);
    ob(c, g, v + E, A, o + 1, l, u + O * 0.071, M, T);
  }
}
function TT(c) {
  const t = { bolts: [], halo: [], knots: [], streaks: [] },
    i = { remaining: yT },
    s = { rng: c, bolts: t.bolts, halo: t.halo, knots: t.knots, knotBudget: i };
  for (let l = 0; l < t1; l++) {
    const u = (l / t1) * Math.PI * 2 + Nt(c, -0.12, 0.12),
      f = Math.cos(u) * nb * Nt(c, 1.02, 1.18),
      h = ab + Math.sin(u) * sb * Nt(c, 1.02, 1.18),
      p = Qc(f, h, hr + Nt(c, -0.2, 0.2));
    i.remaining > 0 &&
      ((i.remaining -= 1),
      t.knots.push({
        point: p,
        size: Nt(c, 0.32, 0.58),
        seed: c(),
        strength: Nt(c, 0.9, 1.15),
        colorMix: Nt(c, 0.15, 0.85),
        core: 1,
      }));
    const y = Nt(c, 0.1, 0.9),
      g = Nt(c, cT, uT);
    ob(s, p, u, g, 0, y, c(), lT, 1);
  }
  const o = 320;
  for (let l = 0; l < o; l++) {
    const u = Nt(c, -Cs, Cs),
      f = Nt(c, Id, Xd),
      h = hr + Nt(c, -0.4, 0.2),
      p = Qc(u, f, h);
    Zd(p) ||
      t.knots.push({
        point: p,
        size: Nt(c, 0.05, 0.13),
        seed: c(),
        strength: Nt(c, 0.25, 0.55),
        colorMix: Nt(c, 0, 1),
        core: Nt(c, 0.05, 0.22),
      });
  }
  for (let l = 0; l < hT; l++) {
    let u = Nt(c, -Cs, Cs);
    const f = Nt(c, Id + 0.2, Xd - 0.2);
    u = u * (0.55 + (0.45 * Math.abs(u)) / Cs);
    const h = Qc(u, f, hr - 0.25);
    Zd(h) ||
      t.streaks.push({
        cx: u,
        cy: f,
        cz: hr - 0.25,
        halfW: Nt(c, fT, dT) * 0.5,
        halfH: Nt(c, pT, mT) * 0.5,
        seed: c(),
        phase: c(),
        hue: c() < 0.7 ? Nt(c, 0, 0.35) : Nt(c, 0.55, 0.95),
      });
  }
  return t;
}
function zT(c) {
  const t = c.length,
    i = new Float32Array(t * 3),
    s = new Float32Array(t),
    o = new Float32Array(t),
    l = new Float32Array(t),
    u = new Float32Array(t),
    f = new Float32Array(t),
    h = new Float32Array(t * 2),
    p = new Float32Array(t);
  for (let g = 0; g < t; g++) {
    const v = c[g];
    ((i[g * 3] = v.point.x),
      (i[g * 3 + 1] = v.point.y),
      (i[g * 3 + 2] = v.point.z),
      (s[g] = v.seed),
      (o[g] = v.taper),
      (l[g] = v.side),
      (u[g] = v.colorMix),
      (f[g] = v.flow),
      (h[g * 2] = v.nx),
      (h[g * 2 + 1] = v.ny),
      (p[g] = v.thick));
  }
  const y = new At();
  return (
    y.setAttribute("position", new H(i, 3)),
    y.setAttribute("aSeed", new H(s, 1)),
    y.setAttribute("aTaper", new H(o, 1)),
    y.setAttribute("aSide", new H(l, 1)),
    y.setAttribute("aColorMix", new H(u, 1)),
    y.setAttribute("aFlow", new H(f, 1)),
    y.setAttribute("aNormal", new H(h, 2)),
    y.setAttribute("aThick", new H(p, 1)),
    y
  );
}
function ET(c) {
  const t = c.length,
    i = new Float32Array(t * 3),
    s = new Float32Array(t),
    o = new Float32Array(t),
    l = new Float32Array(t),
    u = new Float32Array(t),
    f = new Float32Array(t);
  for (let p = 0; p < t; p++) {
    const y = c[p];
    ((i[p * 3] = y.point.x),
      (i[p * 3 + 1] = y.point.y),
      (i[p * 3 + 2] = y.point.z + 0.05),
      (s[p] = y.size),
      (o[p] = y.seed),
      (l[p] = y.strength),
      (u[p] = y.colorMix),
      (f[p] = y.core));
  }
  const h = new At();
  return (
    h.setAttribute("position", new H(i, 3)),
    h.setAttribute("aSize", new H(s, 1)),
    h.setAttribute("aSeed", new H(o, 1)),
    h.setAttribute("aStrength", new H(l, 1)),
    h.setAttribute("aColorMix", new H(u, 1)),
    h.setAttribute("aCore", new H(f, 1)),
    h
  );
}
function RT(c) {
  const t = c.length,
    i = new Float32Array(t * 6 * 3),
    s = new Float32Array(t * 6),
    o = new Float32Array(t * 6 * 2),
    l = new Float32Array(t * 6),
    u = new Float32Array(t * 6),
    f = new Float32Array(t * 6),
    h = new Float32Array(t * 6),
    p = [
      [-1, -1],
      [1, -1],
      [1, 1],
      [-1, -1],
      [1, 1],
      [-1, 1],
    ];
  for (let g = 0; g < t; g++) {
    const v = c[g];
    for (let b = 0; b < 6; b++) {
      const S = g * 6 + b;
      ((i[S * 3] = v.cx),
        (i[S * 3 + 1] = v.cy),
        (i[S * 3 + 2] = v.cz),
        (s[S] = v.seed),
        (o[S * 2] = v.halfW),
        (o[S * 2 + 1] = v.halfH),
        (l[S] = p[b][0]),
        (u[S] = p[b][1]),
        (f[S] = v.phase),
        (h[S] = v.hue));
    }
  }
  const y = new At();
  return (
    y.setAttribute("position", new H(i, 3)),
    y.setAttribute("aSeed", new H(s, 1)),
    y.setAttribute("aHalfSize", new H(o, 2)),
    y.setAttribute("aSide", new H(l, 1)),
    y.setAttribute("aRow", new H(u, 1)),
    y.setAttribute("aPhase", new H(f, 1)),
    y.setAttribute("aHue", new H(h, 1)),
    y
  );
}
class CT {
  id;
  object = new ve();
  done = !1;
  uniforms = [];
  geometries = [];
  materials = [];
  elapsed = 0;
  constructor(t, i) {
    this.id = t;
    const s = TT(i);
    (this.addHaze(),
      this.addStreaks(s.streaks),
      this.addBolts(s.halo, 1, !0),
      this.addBolts(s.bolts, 1, !1),
      this.addKnots(s.knots),
      (this.object.renderOrder = 4));
  }
  update(t, i, s) {
    this.elapsed += Math.max(0, i);
    const o = i1(0, 0.45, this.elapsed),
      l = 1 - i1(zd - 0.55, zd, this.elapsed),
      u = Math.min(1, o * l * 1.05),
      f = Math.max(s.size.x / $v.width, s.size.y / $v.height);
    (this.object.position.set(s.position.x, s.position.y, s.position.z),
      this.object.scale.set(f, f, f),
      (this.object.rotation.z = Math.sin(this.elapsed * 0.5) * 0.008));
    for (const h of this.uniforms) ((h.time.value = this.elapsed), (h.envelope.value = u));
    this.elapsed >= zd && (this.done = !0);
  }
  dispose() {
    for (const t of this.geometries) t.dispose();
    for (const t of this.materials) t.dispose();
  }
  trackUniforms(t) {
    return (this.uniforms.push(t), t);
  }
  addHaze() {
    const t = new be(14, 10),
      i = this.trackUniforms({
        time: { value: 0 },
        envelope: { value: 0 },
        violet: { value: new R(0.45, 0.18, 1) },
        blue: { value: new R(0.18, 0.45, 1) },
        sheen: { value: new R(0.2, 0.1, 0.5) },
        sheenAlpha: { value: 0.4 },
      }),
      s = new dt({
        uniforms: i,
        vertexShader: gT,
        fragmentShader: vT,
        transparent: !0,
        depthWrite: !1,
        depthTest: !1,
        blending: Rt,
      }),
      o = new $t(t, s);
    ((o.position.z = hr - 1.2),
      (o.frustumCulled = !1),
      (o.renderOrder = 3),
      this.object.add(o),
      this.geometries.push(t),
      this.materials.push(s));
  }
  addBolts(t, i, s) {
    if (t.length === 0) return;
    const o = zT(t),
      l = this.trackUniforms({
        time: { value: 0 },
        envelope: { value: 0 },
        violet: { value: new R(0.55, 0.25, 1) },
        blue: { value: new R(0.3, 0.5, 1) },
        lightViolet: { value: new R(0.8, 0.5, 1) },
        baseOpacity: { value: i },
        isHalo: { value: s ? 1 : 0 },
      }),
      u = new dt({
        uniforms: l,
        vertexShader: bT,
        fragmentShader: xT,
        transparent: !0,
        depthWrite: !1,
        depthTest: !1,
        blending: Rt,
      }),
      f = new $t(o, u);
    ((f.frustumCulled = !1),
      (f.renderOrder = s ? 4 : 5),
      this.object.add(f),
      this.geometries.push(o),
      this.materials.push(u));
  }
  addKnots(t) {
    if (t.length === 0) return;
    const i = ET(t),
      s = this.trackUniforms({
        time: { value: 0 },
        envelope: { value: 0 },
        violet: { value: new R(0.55, 0.25, 1) },
        blue: { value: new R(0.3, 0.5, 1) },
        hotCore: { value: new R(0.9, 0.5, 1.4) },
        pointScale: { value: 720 },
      }),
      o = new dt({
        uniforms: s,
        vertexShader: ST,
        fragmentShader: wT,
        transparent: !0,
        depthWrite: !1,
        depthTest: !1,
        blending: Rt,
      }),
      l = new ne(i, o);
    ((l.frustumCulled = !1),
      (l.renderOrder = 6),
      this.object.add(l),
      this.geometries.push(i),
      this.materials.push(o));
  }
  addStreaks(t) {
    if (t.length === 0) return;
    const i = RT(t),
      s = this.trackUniforms({
        time: { value: 0 },
        envelope: { value: 0 },
        cyan: { value: new R(0.4, 0.95, 1) },
        blue: { value: new R(0.35, 0.6, 1) },
      }),
      o = new dt({
        uniforms: s,
        vertexShader: AT,
        fragmentShader: MT,
        transparent: !0,
        depthWrite: !1,
        depthTest: !1,
        blending: Rt,
      }),
      l = new $t(i, o);
    ((l.frustumCulled = !1),
      (l.renderOrder = 3),
      this.object.add(l),
      this.geometries.push(i),
      this.materials.push(o));
  }
}
xe("synapse-blackout", (c) => {
  c.add(new CT(c.nextId("synapse-blackout-field"), c.rng));
});
const s1 = 2.4,
  a1 = { width: 4, height: 8 },
  Ed = Math.PI * 2,
  rb = [-4.5, -3.5, -2.5, -1.5, 1.5, 2.5, 3.5, 4.5],
  OT = rb.length,
  BT = 0.06,
  Rd = 6,
  o1 = -2.8,
  DT = 0.35,
  kc = (4 * Math.PI) / 180,
  Hc = 1.5,
  Kc = [
    { y: -2.85, radius: 4.4, tone: 0 },
    { y: -2.78, radius: 3.6, tone: 0 },
    { y: -2.71, radius: 2.8, tone: 0.25 },
    { y: -2.64, radius: 2, tone: 0.7 },
    { y: -2.57, radius: 1.2, tone: 1 },
  ],
  fr = Kc.length,
  NT = 0.18,
  UT = 1.5,
  Pd = 30,
  FT = fr * Pd,
  LT = 200,
  kT = `
  attribute float aSize;
  attribute float aSeed;
  attribute float aRadius;
  attribute float aPhase;
  attribute float aSpeed;
  attribute float aTilt;
  attribute float aAxis;
  attribute float aCenterY;
  attribute float aTone;
  attribute float aStrength;

  uniform float uAge;
  uniform float uEnvelope;
  uniform float uSizeScale;

  varying float vAlpha;
  varying float vSeed;
  varying float vTone;

  void main() {
    float angle = uAge * aSpeed + aPhase;
    float ca = cos(angle);
    float sa = sin(angle);

    vec3 local = vec3(ca * aRadius, 0.0, sa * aRadius);

    float ct = cos(aTilt);
    float st = sin(aTilt);
    vec3 tilted = vec3(local.x, -local.z * st, local.z * ct);

    float cy = cos(aAxis);
    float sy = sin(aAxis);
    vec3 pos = vec3(
      tilted.x * cy + tilted.z * sy,
      tilted.y + aCenterY,
      -tilted.x * sy + tilted.z * cy
    );

    float tw = pow(sin(uAge * (5.0 + aSeed * 3.0) + aSeed * 27.0) * 0.5 + 0.5, 1.3);
    // Audit: alpha pinned at 1.0 (was 0.85 + 0.55 * tw) so orbital dots are
    // unambiguously VERY VISIBLE — twinkle survives only as the slight extra
    // boost on top of the floor of 1.0.
    vAlpha = uEnvelope * aStrength * (1.0 + 0.15 * tw);
    vSeed = aSeed;
    vTone = aTone;

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    // Audit: gl_PointSize = size * 1200 / -mv.z (was 1100). Big visible dots.
    gl_PointSize = aSize * uSizeScale * (1200.0 / max(0.1, -mv.z));
    gl_Position = projectionMatrix * mv;
  }
`,
  HT = `
  varying float vAlpha;
  varying float vSeed;
  varying float vTone;

  void main() {
    if (vAlpha <= 0.001) discard;
    vec2 d = gl_PointCoord - 0.5;
    float r = length(d);
    if (r > 0.5) discard;

    // Audit: gold ascending family — bright core (0.95, 1.0, 0.6) requested.
    vec3 gold = vec3(0.95, 1.0, 0.6);
    vec3 blue = vec3(0.4, 0.7, 1.0);
    vec3 color = mix(gold, blue, clamp(vTone, 0.0, 1.0));
    vec3 coreWhite = vec3(1.0, 0.97, 0.85);

    float core = exp(-r * r * 40.0);
    float halo = exp(-r * r * 10.0);
    float crossX = (1.0 - smoothstep(0.0, 0.05, abs(d.y))) *
                   (1.0 - smoothstep(0.0, 0.5, abs(d.x)));
    float crossY = (1.0 - smoothstep(0.0, 0.05, abs(d.x))) *
                   (1.0 - smoothstep(0.0, 0.5, abs(d.y)));
    float glint = (crossX + crossY) * (0.55 + 0.5 * vSeed);
    float mask = core * 1.6 + halo * 0.85 + glint * 1.1;
    if (mask <= 0.001) discard;
    color += coreWhite * core * 0.95;
    gl_FragColor = vec4(color, mask * vAlpha);
  }
`,
  VT = `
  attribute float aSize;
  attribute float aSeed;
  attribute float aRingR;
  attribute float aXAspect;
  attribute float aCenterY;
  attribute float aPhase;
  attribute float aSpeed;
  attribute float aTilt;
  attribute float aTone;

  uniform float uAge;
  uniform float uEnvelope;
  uniform float uSizeScale;

  varying float vAlpha;
  varying float vSeed;
  varying float vTone;

  void main() {
    float angle = uAge * aSpeed + aPhase;
    float ca = cos(angle);
    float sa = sin(angle);

    // On-ring sample: x scaled by aspect for oval shape, z is the minor axis.
    vec3 local = vec3(aRingR * aXAspect * ca, 0.0, aRingR * sa);

    // Tilt the ring plane around X for the small 3D feel.
    float ct = cos(aTilt);
    float st = sin(aTilt);
    vec3 tilted = vec3(local.x, -local.z * st, local.z * ct);
    tilted.y += aCenterY;

    float tw = pow(sin(uAge * (4.5 + aSeed * 2.5) + aSeed * 13.0) * 0.5 + 0.5, 1.1);
    vAlpha = uEnvelope * (0.9 + 0.45 * tw);
    vSeed = aSeed;
    vTone = aTone;

    vec4 mv = modelViewMatrix * vec4(tilted, 1.0);
    gl_PointSize = aSize * uSizeScale * (1200.0 / max(0.1, -mv.z));
    gl_Position = projectionMatrix * mv;
  }
`,
  GT = `
  varying float vAlpha;
  varying float vSeed;
  varying float vTone;

  void main() {
    if (vAlpha <= 0.001) discard;
    vec2 d = gl_PointCoord - 0.5;
    float r = length(d);
    if (r > 0.5) discard;

    // Cream-gold for outer rings (tone 0), blue for inner rings (tone 1).
    vec3 creamGold = vec3(1.0, 0.92, 0.55);
    vec3 blue = vec3(0.45, 0.75, 1.0);
    vec3 color = mix(creamGold, blue, clamp(vTone, 0.0, 1.0));
    vec3 white = vec3(1.0, 0.98, 0.9);

    float core = exp(-r * r * 50.0);
    float halo = exp(-r * r * 8.0);
    float mask = core * 1.4 + halo * 0.5;
    if (mask <= 0.001) discard;
    color += white * core * 0.7;
    gl_FragColor = vec4(color, mask * vAlpha);
  }
`,
  jT = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`,
  YT = `
  varying vec2 vUv;

  uniform float uAge;
  uniform float uEnvelope;
  uniform float uSeed;
  uniform float uAlphaMul;

  void main() {
    float cx = abs(vUv.x - 0.5) * 2.0;
    float edge = 1.0 - smoothstep(0.4, 1.0, cx);

    float topFade = 1.0 - smoothstep(0.85, 1.0, vUv.y);
    float botFade = smoothstep(0.0, 0.06, vUv.y);

    float scroll = fract(vUv.y * 3.0 - uAge * 0.85 + uSeed);
    float band = smoothstep(0.0, 0.25, scroll) * (1.0 - smoothstep(0.5, 1.0, scroll));
    float bright = 0.55 + band * 0.55;

    bright *= 0.92 + 0.08 * sin(uAge * 3.0 + uSeed * 11.0 + vUv.y * 8.0);

    vec3 gold = vec3(1.0, 0.78, 0.3);
    vec3 cream = vec3(1.0, 0.95, 0.72);
    vec3 color = mix(gold, cream, band * 0.55);

    float a = edge * topFade * botFade * bright * uEnvelope * uAlphaMul;
    if (a <= 0.002) discard;
    gl_FragColor = vec4(color, a);
  }
`,
  qT = `
  varying vec2 vLocal;
  void main() {
    vLocal = position.xz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`,
  XT = `
  varying vec2 vLocal;

  uniform float uAge;
  uniform float uEnvelope;
  uniform float uXAspect;
  uniform float uThickness;
  uniform float uRingRadius;
  uniform float uRingIdx;
  uniform float uTone;

  void main() {
    float r = length(vec2(vLocal.x / uXAspect, vLocal.y));
    float dist = abs(r - uRingRadius);
    // Soft outer falloff + crisp inner core so each ring reads cleanly.
    float band = 1.0 - smoothstep(uThickness * 0.35, uThickness, dist);
    float pulse = sin(uAge * 2.2 - uRingIdx * 0.9) * 0.18 + 1.0;
    float mask = band * pulse;
    if (mask <= 0.001) discard;

    // Outer rings cream-gold, inner rings blue — matches traveling-dot tone.
    vec3 creamGold = vec3(1.0, 0.85, 0.4);
    vec3 blue = vec3(0.5, 0.78, 1.0);
    vec3 color = mix(creamGold, blue, clamp(uTone, 0.0, 1.0));

    // DEBUG-VERIFIABLE: alpha explicitly carries per-ring band contribution so
    // every ring's coverage can be read from a frame's framebuffer alpha
    // channel; uEnvelope only scales it, never zeros it during the active
    // window. Boosted to 1.0 so the rings WAY-thicker and brighter per audit.
    float ringAlpha = clamp(mask, 0.0, 1.2) * 1.0 * uEnvelope;
    // Brighten the gold by pumping the colour vector itself before output so
    // additive blending pushes the rings to a near-overexposed cream-gold.
    color *= 1.6;
    gl_FragColor = vec4(color, ringAlpha);
  }
`;
function r1(c, t, i) {
  const s = Math.min(1, Math.max(0, (i - c) / (t - c)));
  return s * s * (3 - 2 * s);
}
function Xe(c, t, i) {
  return t + (i - t) * c();
}
function IT(c) {
  const t = [];
  for (let i = 0; i < OT; i++) {
    const s = rb[i],
      o = Math.abs(s),
      l = 1.05 - Math.min(0.25, (o - 1.4) * 0.06);
    t.push({
      x: s,
      z: Xe(c, -0.4, 0.4),
      jitterRadius: Xe(c, 0.18, 0.28),
      speed: Xe(c, 0.38, 0.58),
      intensity: l,
    });
  }
  return t;
}
class ZT {
  id;
  object;
  done = !1;
  elapsed = 0;
  streams;
  uniforms = { uAge: { value: 0 }, uEnvelope: { value: 0 }, uSizeScale: { value: 1 } };
  resources = [];
  debugLogged = !1;
  constructor(t, i) {
    ((this.id = t),
      (this.object = new ve()),
      (this.object.name = t),
      (this.object.renderOrder = 4),
      (this.object.frustumCulled = !1),
      (this.streams = IT(i)));
    const s = this.buildNestedOvalRings(),
      o = this.buildStreamBars(i),
      l = this.buildRingTravelingDots(i),
      u = this.buildOrbitalSparkles(i);
    ((s.renderOrder = 1e3),
      (o.renderOrder = 1001),
      (l.renderOrder = 1002),
      (u.renderOrder = 1003),
      this.object.add(s, o, l, u));
  }
  update(t, i, s) {
    this.elapsed += i;
    const o = r1(0, 0.45, this.elapsed) * (1 - r1(1.8, s1, this.elapsed));
    this.object.position.copy(s.position);
    const l = s.size.x / a1.width,
      u = s.size.y / a1.height;
    if (
      (this.object.scale.set(l, u, l),
      (this.uniforms.uAge.value = this.elapsed),
      (this.uniforms.uEnvelope.value = o),
      (this.uniforms.uSizeScale.value = Math.max(0.7, Math.min(1.6, (l + u) * 0.5))),
      !this.debugLogged && o > 0.6)
    ) {
      this.debugLogged = !0;
      const f = [];
      for (let h = 0; h < fr; h++) {
        const p = Kc[h],
          y = 0.95 * o;
        f.push(
          `ring[${h}] y=${p.y.toFixed(2)} r=${p.radius.toFixed(2)} tone=${p.tone.toFixed(2)} peakAlpha≈${y.toFixed(3)}`,
        );
      }
      console.debug(`[upgrade-ladder] ring alpha contributions:
${f.join(`
`)}`);
    }
    this.elapsed >= s1 && ((this.done = !0), (this.uniforms.uEnvelope.value = 0));
  }
  dispose() {
    for (const t of this.resources) t.dispose();
  }
  trackGeometry(t) {
    return (this.resources.push(t), t);
  }
  trackMaterial(t) {
    return (this.resources.push(t), t);
  }
  buildNestedOvalRings() {
    const t = new ve();
    t.frustumCulled = !1;
    for (let i = 0; i < fr; i++) {
      const s = Kc[i],
        o = s.radius * 2 * Hc + UT,
        l = this.trackGeometry(new be(o, o, 1, 1));
      l.rotateX(-Math.PI / 2);
      const u = this.trackMaterial(
          new dt({
            uniforms: {
              uAge: this.uniforms.uAge,
              uEnvelope: this.uniforms.uEnvelope,
              uXAspect: { value: Hc },
              uThickness: { value: NT },
              uRingRadius: { value: s.radius },
              uRingIdx: { value: i },
              uTone: { value: s.tone },
            },
            vertexShader: qT,
            fragmentShader: XT,
            transparent: !0,
            depthWrite: !1,
            depthTest: !1,
            blending: Rt,
            side: Ne,
          }),
        ),
        f = new $t(l, u);
      ((f.rotation.x = kc), (f.position.y = s.y), (f.frustumCulled = !1), t.add(f));
    }
    return t;
  }
  buildRingTravelingDots(t) {
    const i = FT,
      s = new Float32Array(i * 3),
      o = new Float32Array(i),
      l = new Float32Array(i),
      u = new Float32Array(i),
      f = new Float32Array(i),
      h = new Float32Array(i),
      p = new Float32Array(i),
      y = new Float32Array(i),
      g = new Float32Array(i),
      v = new Float32Array(i);
    let b = 0;
    for (let T = 0; T < fr; T++) {
      const O = Kc[T],
        C = 0.45 + (fr - 1 - T) * 0.12,
        E = T % 2 === 0 ? 1 : -1;
      for (let U = 0; U < Pd; U++) {
        const q = (U / Pd) * Ed,
          X = Xe(t, -0.04, 0.04),
          G = q + X,
          W = E * (C + Xe(t, -0.05, 0.05)),
          P = Math.cos(G),
          Q = Math.sin(G),
          rt = O.radius * Hc * P,
          ht = O.radius * Q,
          xt = Math.cos(kc),
          ft = Math.sin(kc);
        ((s[b * 3 + 0] = rt), (s[b * 3 + 1] = -ht * ft + O.y), (s[b * 3 + 2] = ht * xt));
        const L = 0.11 + T * 0.012;
        ((o[b] = L + Xe(t, -0.015, 0.015)),
          (l[b] = t()),
          (u[b] = O.radius),
          (f[b] = Hc),
          (h[b] = O.y),
          (p[b] = G),
          (y[b] = W),
          (g[b] = kc),
          (v[b] = O.tone),
          b++);
      }
    }
    const S = this.trackGeometry(new At());
    (S.setAttribute("position", new H(s, 3)),
      S.setAttribute("aSize", new H(o, 1)),
      S.setAttribute("aSeed", new H(l, 1)),
      S.setAttribute("aRingR", new H(u, 1)),
      S.setAttribute("aXAspect", new H(f, 1)),
      S.setAttribute("aCenterY", new H(h, 1)),
      S.setAttribute("aPhase", new H(p, 1)),
      S.setAttribute("aSpeed", new H(y, 1)),
      S.setAttribute("aTilt", new H(g, 1)),
      S.setAttribute("aTone", new H(v, 1)));
    const A = this.trackMaterial(
        new dt({
          uniforms: {
            uAge: this.uniforms.uAge,
            uEnvelope: this.uniforms.uEnvelope,
            uSizeScale: this.uniforms.uSizeScale,
          },
          vertexShader: VT,
          fragmentShader: GT,
          transparent: !0,
          depthWrite: !1,
          depthTest: !1,
          blending: Rt,
        }),
      ),
      M = new ne(S, A);
    return ((M.frustumCulled = !1), M);
  }
  buildStreamBars(t) {
    const i = new ve();
    i.frustumCulled = !1;
    const s = this.trackGeometry(new be(BT, Rd, 1, 1));
    for (const o of this.streams) {
      const l = t(),
        u = this.trackMaterial(
          new dt({
            uniforms: {
              uAge: this.uniforms.uAge,
              uEnvelope: this.uniforms.uEnvelope,
              uSeed: { value: l },
              uAlphaMul: { value: DT },
            },
            vertexShader: jT,
            fragmentShader: YT,
            transparent: !0,
            depthWrite: !1,
            depthTest: !1,
            blending: Rt,
            side: Ne,
          }),
        ),
        f = new $t(s, u);
      (f.position.set(o.x, o1 + Rd / 2, o.z), (f.frustumCulled = !1), i.add(f));
      const h = new $t(s, u);
      (h.position.set(o.x, o1 + Rd / 2, o.z),
        (h.rotation.y = Math.PI / 2),
        (h.frustumCulled = !1),
        i.add(h));
    }
    return i;
  }
  buildOrbitalSparkles(t) {
    const i = LT,
      s = new Float32Array(i * 3),
      o = new Float32Array(i),
      l = new Float32Array(i),
      u = new Float32Array(i),
      f = new Float32Array(i),
      h = new Float32Array(i),
      p = new Float32Array(i),
      y = new Float32Array(i),
      g = new Float32Array(i),
      v = new Float32Array(i),
      b = new Float32Array(i);
    for (let T = 0; T < i; T++) {
      const O = T % 2 === 0,
        C = Xe(t, 1, 2),
        E = O ? Xe(t, -0.12, 0.12) : Xe(t, 0.6, 1.4),
        U = t() < 0.5 ? E : -E,
        q = Xe(t, 0, Ed),
        X = Xe(t, -1.6, 0.6),
        G = t() * Ed,
        P = (t() < 0.5 ? 1 : -1) * Xe(t, 0.9, 1.6) * (1.4 / Math.max(0.5, C)),
        Q = Math.cos(G),
        rt = Math.sin(G),
        ht = Q * C,
        xt = rt * C,
        ft = Math.cos(U),
        L = Math.sin(U),
        I = ht,
        nt = -xt * L,
        lt = xt * ft,
        ut = Math.cos(q),
        gt = Math.sin(q);
      ((s[T * 3 + 0] = I * ut + lt * gt),
        (s[T * 3 + 1] = nt + X),
        (s[T * 3 + 2] = -I * gt + lt * ut),
        (o[T] = 0.1 + Xe(t, 0, 0.02)),
        (l[T] = t()),
        (u[T] = C),
        (f[T] = G),
        (h[T] = P),
        (p[T] = U),
        (y[T] = q),
        (g[T] = X),
        (v[T] = T % 2 === 0 ? 0 : 1),
        (b[T] = 1 + Xe(t, 0, 0.15)));
    }
    const S = this.trackGeometry(new At());
    (S.setAttribute("position", new H(s, 3)),
      S.setAttribute("aSize", new H(o, 1)),
      S.setAttribute("aSeed", new H(l, 1)),
      S.setAttribute("aRadius", new H(u, 1)),
      S.setAttribute("aPhase", new H(f, 1)),
      S.setAttribute("aSpeed", new H(h, 1)),
      S.setAttribute("aTilt", new H(p, 1)),
      S.setAttribute("aAxis", new H(y, 1)),
      S.setAttribute("aCenterY", new H(g, 1)),
      S.setAttribute("aTone", new H(v, 1)),
      S.setAttribute("aStrength", new H(b, 1)));
    const A = this.trackMaterial(
        new dt({
          uniforms: {
            uAge: this.uniforms.uAge,
            uEnvelope: this.uniforms.uEnvelope,
            uSizeScale: this.uniforms.uSizeScale,
          },
          vertexShader: kT,
          fragmentShader: HT,
          transparent: !0,
          depthWrite: !1,
          depthTest: !1,
          blending: Rt,
        }),
      ),
      M = new ne(S, A);
    return ((M.frustumCulled = !1), M);
  }
}
xe("upgrade-ladder", (c) => {
  c.add(new ZT(c.nextId("upgrade-ladder"), c.rng));
});
const rr = "ambient-ring",
  lr = "ambient-dots",
  cr = "ambient-tiles",
  l1 = {
    enabled: !1,
    radius: 2.4,
    thickness: 0.08,
    tilt: 0.35,
    rotationSpeed: 0.6,
    opacity: 0.7,
    color: { r: 0.4, g: 0.95, b: 1 },
  },
  c1 = { enabled: !1, spawnRate: 8, size: 0.12, lifespan: 2.2, color: { r: 0.85, g: 0.95, b: 1 } },
  u1 = {
    enabled: !1,
    density: 1.5,
    size: 0.11,
    hollowRatio: 0.6,
    glitchAmount: 0.35,
    color: { r: 0.35, g: 0.9, b: 1 },
  },
  $c = x1()((c, t) => {
    const i = () => {
        const { engine: l, ring: u } = t();
        l &&
          (u.enabled
            ? l.has(rr)
              ? l
                  .get(rr)
                  ?.setConfig({
                    radius: u.radius,
                    thickness: u.thickness,
                    tilt: u.tilt,
                    rotationSpeed: u.rotationSpeed,
                    opacity: u.opacity,
                    color: u.color,
                  })
              : l.add(
                  new Za({
                    id: rr,
                    radius: u.radius,
                    thickness: u.thickness,
                    tilt: u.tilt,
                    rotationSpeed: u.rotationSpeed,
                    opacity: u.opacity,
                    color: u.color,
                    anchorYOffset: -0.5,
                  }),
                )
            : l.has(rr) && l.remove(rr));
      },
      s = () => {
        const { engine: l, dots: u } = t();
        l &&
          (u.enabled
            ? l.has(lr)
              ? l
                  .get(lr)
                  ?.setConfig({
                    spawnRate: u.spawnRate,
                    size: u.size,
                    lifespan: u.lifespan,
                    color: u.color,
                  })
              : l.add(
                  new Bs({
                    id: lr,
                    mode: { kind: "ambient", spawnRate: u.spawnRate },
                    size: u.size,
                    lifespan: u.lifespan,
                    color: u.color,
                    spawnArea: { x: 0.6, y: 0.7, z: 1 },
                    driftY: 0.6,
                    jitterXY: 0.4,
                    anchorYOffset: 0,
                  }),
                )
            : l.has(lr) && l.remove(lr));
      },
      o = () => {
        const { engine: l, tiles: u } = t();
        l &&
          (u.enabled
            ? l.has(cr)
              ? l
                  .get(cr)
                  ?.setConfig({
                    clusterRate: u.density,
                    size: u.size,
                    hollowRatio: u.hollowRatio,
                    glitchAmount: u.glitchAmount,
                    color: u.color,
                  })
              : l.add(
                  new r0({
                    id: cr,
                    mode: { kind: "ambient", clusterRate: u.density },
                    size: u.size,
                    hollowRatio: u.hollowRatio,
                    glitchAmount: u.glitchAmount,
                    color: u.color,
                    spawnArea: { x: 1.4, y: 1.2, z: 1.2 },
                    lifespan: 1.4,
                  }),
                )
            : l.has(cr) && l.remove(cr));
      };
    return {
      engine: null,
      ring: { ...l1 },
      dots: { ...c1 },
      tiles: { ...u1 },
      attachEngine: (l) => {
        (c({ engine: l }), i(), s(), o());
      },
      detachEngine: () => {
        c({ engine: null });
      },
      setRingEnabled: (l) => {
        (c((u) => ({ ring: { ...u.ring, enabled: l } })), i());
      },
      setRingRadius: (l) => {
        (c((u) => ({ ring: { ...u.ring, radius: l } })), i());
      },
      setRingThickness: (l) => {
        (c((u) => ({ ring: { ...u.ring, thickness: l } })), i());
      },
      setRingTilt: (l) => {
        (c((u) => ({ ring: { ...u.ring, tilt: l } })), i());
      },
      setRingRotationSpeed: (l) => {
        (c((u) => ({ ring: { ...u.ring, rotationSpeed: l } })), i());
      },
      setRingOpacity: (l) => {
        (c((u) => ({ ring: { ...u.ring, opacity: l } })), i());
      },
      setRingColor: (l, u) => {
        (c((f) => ({ ring: { ...f.ring, color: { ...f.ring.color, [l]: u } } })), i());
      },
      resetRing: () => {
        (c({ ring: { ...l1 } }), i());
      },
      setDotsEnabled: (l) => {
        (c((u) => ({ dots: { ...u.dots, enabled: l } })), s());
      },
      setDotsSpawnRate: (l) => {
        (c((u) => ({ dots: { ...u.dots, spawnRate: l } })), s());
      },
      setDotsSize: (l) => {
        (c((u) => ({ dots: { ...u.dots, size: l } })), s());
      },
      setDotsLifespan: (l) => {
        (c((u) => ({ dots: { ...u.dots, lifespan: l } })), s());
      },
      setDotsColor: (l, u) => {
        (c((f) => ({ dots: { ...f.dots, color: { ...f.dots.color, [l]: u } } })), s());
      },
      resetDots: () => {
        (c({ dots: { ...c1 } }), s());
      },
      setTilesEnabled: (l) => {
        (c((u) => ({ tiles: { ...u.tiles, enabled: l } })), o());
      },
      setTilesDensity: (l) => {
        (c((u) => ({ tiles: { ...u.tiles, density: l } })), o());
      },
      setTilesSize: (l) => {
        (c((u) => ({ tiles: { ...u.tiles, size: l } })), o());
      },
      setTilesHollowRatio: (l) => {
        (c((u) => ({ tiles: { ...u.tiles, hollowRatio: l } })), o());
      },
      setTilesGlitchAmount: (l) => {
        (c((u) => ({ tiles: { ...u.tiles, glitchAmount: l } })), o());
      },
      setTilesColor: (l, u) => {
        (c((f) => ({ tiles: { ...f.tiles, color: { ...f.tiles.color, [l]: u } } })), o());
      },
      resetTiles: () => {
        (c({ tiles: { ...u1 } }), o());
      },
      playEffect: (l) => {
        const { engine: u } = t();
        u && hM(u, l);
      },
    };
  });
function nE(c) {
  $c.getState().playEffect(c);
}
let h1 = !1;
function PT() {
  h1 ||
    typeof window > "u" ||
    ((h1 = !0),
    (window.__particles = {
      play: (c) => $c.getState().playEffect(c),
      list: () => uM(),
      clear: () => $c.getState().engine?.clear(),
      register: (c, t) => xe(c, t),
      attached: () => $c.getState().engine !== null,
    }));
}
function WT() {
  return !1;
}
let Vc = null;
function JT() {
  return (
    Vc !== null || (Vc = window.location.pathname.replace(/\/+$/, "").toLowerCase() === "/landing"),
    Vc
  );
}
const QT = Si.lazy(() =>
    m1(() => import("./NormalApp-Cn6agT0F.js").then((c) => c.eG), __vite__mapDeps([0, 1, 2])),
  ),
  KT = Si.lazy(() =>
    m1(() => import("./IntroPage-BO45BFI5.js"), __vite__mapDeps([3, 1, 4])).then((c) => ({
      default: c.IntroPage,
    })),
  );
PT();
wS();
function $T() {
  return (
    Si.useMemo(() => WT(), []),
    Si.useMemo(() => JT(), [])
      ? J.jsx(Si.Suspense, { fallback: null, children: J.jsx(KT, {}) })
      : J.jsxs(J.Fragment, {
          children: [
            J.jsx(hS, {}),
            J.jsx(W2, {}),
            J.jsx(nS, {}),
            J.jsx(lS, {}),
            J.jsx(AS, {}),
            J.jsx(Si.Suspense, { fallback: null, children: J.jsx(QT, {}) }),
          ],
        })
  );
}
const pu = "arcade.devTools",
  Wd = new Set();
function lb() {
  try {
    return localStorage.getItem(pu) === "1";
  } catch {
    return !1;
  }
}
let h0 = lb();
function cb() {
  for (const c of Wd) c();
}
function f1(c) {
  h0 = c;
  try {
    c ? localStorage.setItem(pu, "1") : localStorage.removeItem(pu);
  } catch {}
  cb();
}
function ub() {
  return h0;
}
function tz(c) {
  return (
    Wd.add(c),
    () => {
      Wd.delete(c);
    }
  );
}
function sE() {
  return Si.useSyncExternalStore(tz, ub);
}
function ez() {
  ((window.arcadeDevTools = {
    enable: () => f1(!0),
    disable: () => f1(!1),
    get enabled() {
      return ub();
    },
  }),
    window.addEventListener("storage", (c) => {
      c.key === pu && ((h0 = lb()), cb());
    }));
}
ez();
const d1 = "arcade-preload-error-reload-at",
  iz = 6e4;
window.addEventListener("vite:preloadError", (c) => {
  let t = 0;
  try {
    t = Number(window.sessionStorage.getItem(d1)) || 0;
  } catch {}
  if (!(Date.now() - t < iz)) {
    try {
      window.sessionStorage.setItem(d1, String(Date.now()));
    } catch {}
    (console.warn(
      "[main] chunk preload failed (stale bundle after deploy?) — reloading",
      c.payload,
    ),
      c.preventDefault(),
      window.location.reload());
  }
});
Promise.resolve();
"serviceWorker" in navigator &&
  navigator.serviceWorker.register("/sw.js").catch((c) => {
    console.warn("[assets] service worker registration failed:", c);
  });
document.addEventListener("contextmenu", (c) => c.preventDefault());
document.addEventListener(
  "wheel",
  (c) => {
    (c.ctrlKey || c.metaKey) && c.preventDefault();
  },
  { passive: !1, capture: !0 },
);
H2.createRoot(document.getElementById("root")).render(
  J.jsx(Si.StrictMode, { children: J.jsx($T, {}) }),
);
export {
  _g as $,
  Rt as A,
  At as B,
  eE as C,
  Ne as D,
  Or as E,
  ze as F,
  tE as G,
  DS as H,
  N4 as I,
  Qd as J,
  VS as K,
  _1 as L,
  $t as M,
  wi as N,
  Rg as O,
  yn as P,
  u4 as Q,
  w1 as R,
  U4 as S,
  T1 as T,
  Jd as U,
  Te as V,
  is as W,
  V4 as X,
  vr as Y,
  E1 as Z,
  m1 as _,
  dt as a,
  ZS as a$,
  Mz as a0,
  Az as a1,
  wg as a2,
  Hz as a3,
  kz as a4,
  Lz as a5,
  Fz as a6,
  Bz as a7,
  Nz as a8,
  Mg as a9,
  Y4 as aA,
  p4 as aB,
  q4 as aC,
  H as aD,
  gz as aE,
  _S as aF,
  bz as aG,
  OS as aH,
  NS as aI,
  US as aJ,
  G4 as aK,
  be as aL,
  FS as aM,
  LS as aN,
  RS as aO,
  CS as aP,
  BS as aQ,
  yu as aR,
  kS as aS,
  HS as aT,
  z1 as aU,
  GS as aV,
  jS as aW,
  YS as aX,
  qS as aY,
  XS as aZ,
  IS as a_,
  Cz as aa,
  Oz as ab,
  Dz as ac,
  Uz as ad,
  Ag as ae,
  Rz as af,
  Ez as ag,
  zz as ah,
  Eg as ai,
  Va as aj,
  zg as ak,
  c4 as al,
  eu as am,
  l4 as an,
  r4 as ao,
  ns as ap,
  S4 as aq,
  x4 as ar,
  w4 as as,
  v4 as at,
  b4 as au,
  g4 as av,
  A4 as aw,
  y4 as ax,
  Ua as ay,
  Sn as az,
  sw as b,
  M4 as b$,
  PS as b0,
  Zf as b1,
  WS as b2,
  JS as b3,
  QS as b4,
  KS as b5,
  $S as b6,
  t3 as b7,
  e3 as b8,
  i3 as b9,
  Vz as bA,
  pz as bB,
  mz as bC,
  yz as bD,
  wz as bE,
  Sz as bF,
  xz as bG,
  s4 as bH,
  a4 as bI,
  D4 as bJ,
  E4 as bK,
  B4 as bL,
  o4 as bM,
  _3 as bN,
  m4 as bO,
  O4 as bP,
  t0 as bQ,
  vu as bR,
  ss as bS,
  ES as bT,
  n4 as bU,
  TA as bV,
  iE as bW,
  Ng as bX,
  uw as bY,
  cw as bZ,
  j3 as b_,
  n3 as ba,
  s3 as bb,
  a3 as bc,
  o3 as bd,
  r3 as be,
  l3 as bf,
  c3 as bg,
  u3 as bh,
  h3 as bi,
  f3 as bj,
  d3 as bk,
  p3 as bl,
  m3 as bm,
  y3 as bn,
  g3 as bo,
  v3 as bp,
  b3 as bq,
  x3 as br,
  S3 as bs,
  w3 as bt,
  Iz as bu,
  Xz as bv,
  qz as bw,
  Yz as bx,
  jz as by,
  Gz as bz,
  x1 as c,
  hA as c$,
  dw as c0,
  K3 as c1,
  vz as c2,
  t4 as c3,
  i4 as c4,
  e4 as c5,
  $z as c6,
  Kz as c7,
  Qz as c8,
  Jz as c9,
  y1 as cA,
  fz as cB,
  X2 as cC,
  dz as cD,
  B1 as cE,
  C4 as cF,
  Rw as cG,
  k4 as cH,
  N1 as cI,
  H4 as cJ,
  Z4 as cK,
  Mw as cL,
  h4 as cM,
  d4 as cN,
  f4 as cO,
  Br as cP,
  K4 as cQ,
  I4 as cR,
  j4 as cS,
  P4 as cT,
  W4 as cU,
  J4 as cV,
  Pa as cW,
  le as cX,
  $4 as cY,
  F4 as cZ,
  Ns as c_,
  vw as ca,
  R4 as cb,
  Ue as cc,
  su as cd,
  Pz as ce,
  Zz as cf,
  TS as cg,
  _z as ch,
  Tz as ci,
  ve as cj,
  oi as ck,
  P1 as cl,
  kt as cm,
  F2 as cn,
  rz as co,
  cz as cp,
  Rr as cq,
  oz as cr,
  cM as cs,
  sz as ct,
  lz as cu,
  az as cv,
  Cr as cw,
  hz as cx,
  qa as cy,
  Xa as cz,
  ne as d,
  Yt as d0,
  L4 as d1,
  U1 as d2,
  _4 as d3,
  D1 as d4,
  X4 as d5,
  Sw as d6,
  iu as d7,
  Nd as d8,
  O1 as d9,
  lu as da,
  ru as db,
  xu as dc,
  bu as dd,
  as as de,
  wn as df,
  $c as dg,
  oS as dh,
  uz as di,
  sE as dj,
  qw as dk,
  q1 as dl,
  Q4 as dm,
  X1 as dn,
  Cw as e,
  yS as f,
  T4 as g,
  Wz as h,
  uS as i,
  J as j,
  Bi as k,
  tu as l,
  Mi as m,
  Ew as n,
  Ct as o,
  nE as p,
  R as q,
  N2 as r,
  P3 as s,
  bi as t,
  A1 as u,
  Dd as v,
  Hg as w,
  Dg as x,
  z4 as y,
  tt as z,
};
