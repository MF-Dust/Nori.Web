import { r as J } from "./i18n-DtIC1LRi.js";
import { g as we } from "./env-DaMn6UrE.js";
const de = "0.12.0",
  Se = () => ({ id: "convex", version: de, $InferServerPlugin: {} });
var _e = {};
const F = Object.create(null),
  j = (e) => _e || globalThis.Deno?.env.toObject() || globalThis.__env__ || (e ? F : globalThis),
  x = new Proxy(F, {
    get(e, t) {
      return j()[t] ?? F[t];
    },
    has(e, t) {
      return t in j() || t in F;
    },
    set(e, t, n) {
      const r = j(!0);
      return ((r[t] = n), !0);
    },
    deleteProperty(e, t) {
      if (!t) return !1;
      const n = j(!0);
      return (delete n[t], !0);
    },
    ownKeys() {
      const e = j(!0);
      return Object.keys(e);
    },
  });
function Re(e) {
  return Object.fromEntries(
    Object.entries(e).map(([t, n]) => [t, { code: t, message: n, toString: () => t }]),
  );
}
var M = class extends Error {
  constructor(e, t) {
    (super(e, t), (this.name = "BetterAuthError"), (this.message = e), (this.stack = ""));
  }
};
function Oe(e) {
  try {
    return (new URL(e).pathname.replace(/\/+$/, "") || "/") !== "/";
  } catch {
    throw new M(`Invalid base URL: ${e}. Please provide a valid base URL.`);
  }
}
function Ee(e) {
  try {
    const t = new URL(e);
    if (t.protocol !== "http:" && t.protocol !== "https:")
      throw new M(`Invalid base URL: ${e}. URL must include 'http://' or 'https://'`);
  } catch (t) {
    throw t instanceof M
      ? t
      : new M(`Invalid base URL: ${e}. Please provide a valid base URL.`, { cause: t });
  }
}
function V(e, t = "/api/auth") {
  if ((Ee(e), Oe(e))) return e;
  const n = e.replace(/\/+$/, "");
  return !t || t === "/" ? n : ((t = t.startsWith("/") ? t : `/${t}`), `${n}${t}`);
}
function Te(e, t, n, r, s) {
  if (e) return V(e, t);
  {
    const o =
      x.BETTER_AUTH_URL ||
      x.NEXT_PUBLIC_BETTER_AUTH_URL ||
      x.PUBLIC_BETTER_AUTH_URL ||
      x.NUXT_PUBLIC_BETTER_AUTH_URL ||
      x.NUXT_PUBLIC_AUTH_URL ||
      (x.BASE_URL !== "/" ? x.BASE_URL : void 0);
    if (o) return V(o, t);
  }
  if (typeof window < "u" && window.location) return V(window.location.origin, t);
}
function Pe(e) {
  try {
    return decodeURIComponent(e);
  } catch {
    return e;
  }
}
function Ue(e) {
  if (!e) return [];
  const t = [];
  let n = 0,
    r = 0;
  for (; r < e.length;) {
    if (e[r] === ",") {
      let o = r + 1;
      for (; o < e.length && e[o] === " ";) o++;
      for (; o < e.length && e[o] !== "=" && e[o] !== ";" && e[o] !== ",";) o++;
      if (o < e.length && e[o] === "=") {
        const a = e.slice(n, r).trim();
        for (a && t.push(a), n = r + 1; n < e.length && e[n] === " ";) n++;
        r = n;
        continue;
      }
    }
    r++;
  }
  const s = e.slice(n).trim();
  return (s && t.push(s), t);
}
function he(e) {
  const t = new Map();
  return (
    Ue(e).forEach((n) => {
      const [r, ...s] = n.split(";").map((u) => u.trim()),
        [o, ...a] = (r || "").split("="),
        l = a.join("=");
      if (!o || l === void 0) return;
      const i = { value: l.includes("%") ? Pe(l) : l };
      (s.forEach((u) => {
        const [c, ...h] = u.split("="),
          f = h.join("="),
          y = c.trim().toLowerCase();
        switch (y) {
          case "max-age":
            i["max-age"] = f ? parseInt(f.trim(), 10) : void 0;
            break;
          case "expires":
            i.expires = f ? new Date(f.trim()) : void 0;
            break;
          case "domain":
            i.domain = f ? f.trim() : void 0;
            break;
          case "path":
            i.path = f ? f.trim() : void 0;
            break;
          case "secure":
            i.secure = !0;
            break;
          case "httponly":
            i.httponly = !0;
            break;
          case "samesite":
            i.samesite = f ? f.trim().toLowerCase() : void 0;
            break;
          case "partitioned":
            i.partitioned = !0;
            break;
          default:
            i[y] = f ? f.trim() : !0;
            break;
        }
      }),
        t.set(o, i));
    }),
    t
  );
}
const Le = new TextEncoder();
Le.encode;
function Ie(e, t) {
  const n = he(e);
  let r = {};
  if (
    (n.forEach((s, o) => {
      const a = s.expires,
        l = s["max-age"],
        i = a ? new Date(String(a)) : l ? new Date(Date.now() + Number(l) * 1e3) : null;
      r[o] = { value: s.value, expires: i ? i.toISOString() : null };
    }),
    t)
  )
    try {
      r = { ...JSON.parse(t), ...r };
    } catch {}
  return JSON.stringify(r);
}
function re(e) {
  let t = {};
  try {
    t = JSON.parse(e);
  } catch {}
  return Object.entries(t)
    .filter(([, n]) => !n.expires || new Date(n.expires) >= new Date())
    .map(([n, r]) => `${n}=${r.value}`)
    .join("; ");
}
const Ae = (e = {}) => {
  let t = null;
  const n = `${e?.storagePrefix || "better-auth"}_cookie`,
    r = `${e?.storagePrefix || "better-auth"}_session_data`,
    s = e?.storage || (typeof window < "u" ? localStorage : void 0);
  return {
    id: "cross-domain",
    version: de,
    $InferServerPlugin: {},
    getActions(o, a) {
      return (
        (t = a),
        {
          getCookie: () => {
            const l = s?.getItem(n);
            return re(l || "{}");
          },
          updateSession: () => {
            a.notify("$sessionSignal");
          },
          getSessionData: () => {
            const l = s?.getItem(r);
            if (!l) return null;
            try {
              const i = JSON.parse(l);
              return i && typeof i == "object" && Object.keys(i).length === 0 ? null : i;
            } catch {
              return null;
            }
          },
        }
      );
    },
    fetchPlugins: [
      {
        id: "cross-domain",
        name: "Cross Domain",
        hooks: {
          async onSuccess(o) {
            if (!s) return;
            const a = o.response.headers.get("set-better-auth-cookie");
            if (a) {
              const l = s.getItem(n),
                i = Ie(a || "", l ?? void 0);
              if ((await s.setItem(n, i), a.includes(".session_token="))) {
                const u = he(a);
                let c = {};
                try {
                  c = JSON.parse(l || "{}");
                } catch {}
                const h = [...u.keys()].find((f) => f.includes("session_token"));
                h && c[h]?.value !== u.get(h)?.value && t?.notify("$sessionSignal");
              }
            }
            if (o.request.url.toString().includes("/get-session") && !e?.disableCache) {
              const l = o.data;
              (s.setItem(r, JSON.stringify(l)), l === null && s.setItem(n, "{}"));
            }
          },
        },
        async init(o, a) {
          if (!s) return { url: o, options: a };
          a = a || {};
          const l = s.getItem(n),
            i = re(l || "{}");
          return (
            (a.credentials = "omit"),
            (a.headers = { ...a.headers, "Better-Auth-Cookie": i }),
            o.includes("/sign-out") &&
              (await s.setItem(n, "{}"),
              t?.atoms.session?.set({ data: null, error: null, isPending: !1 }),
              await s.setItem(r, "{}")),
            { url: o, options: a }
          );
        },
      },
    ],
  };
};
var xe = "1.6.9";
const Ne = xe,
  ke = Re({
    OTP_EXPIRED: "OTP expired",
    INVALID_OTP: "Invalid OTP",
    TOO_MANY_ATTEMPTS: "Too many attempts",
  }),
  Ce = () => ({
    id: "email-otp",
    version: Ne,
    $InferServerPlugin: {},
    atomListeners: [
      {
        matcher: (e) =>
          e === "/email-otp/verify-email" ||
          e === "/sign-in/email-otp" ||
          e === "/email-otp/request-email-change",
        signal: "$sessionSignal",
      },
    ],
    $ERROR_CODES: ke,
  });
let O = [],
  I = 0;
const q = 4,
  je = (globalThis.nanostoresGlobal ||= { epoch: 0 }),
  pe = (e) => {
    let t = [],
      n = {
        get() {
          return (n.lc || n.listen(() => {})(), n.value);
        },
        init: e,
        lc: 0,
        listen(r) {
          return (
            (n.lc = t.push(r)),
            () => {
              for (let o = I + q; o < O.length;) O[o] === r ? O.splice(o, q) : (o += q);
              let s = t.indexOf(r);
              ~s && (t.splice(s, 1), --n.lc || n.off());
            }
          );
        },
        notify(r, s) {
          je.epoch++;
          let o = !O.length;
          for (let a of t) O.push(a, n.value, r, s);
          if (o) {
            for (I = 0; I < O.length; I += q) O[I](O[I + 1], O[I + 2], O[I + 3]);
            O.length = 0;
          }
        },
        off() {},
        set(r) {
          let s = n.value;
          s !== r && ((n.value = r), n.notify(s));
        },
        subscribe(r) {
          let s = n.listen(r);
          return (r(n.value), s);
        },
        value: e,
      };
    return n;
  },
  qe = 5,
  $ = 6,
  D = 10;
let $e = (e, t, n, r) => (
  (e.events = e.events || {}),
  e.events[n + D] ||
    (e.events[n + D] = r((s) => {
      e.events[n].reduceRight((o, a) => (a(o), o), { shared: {}, ...s });
    })),
  (e.events[n] = e.events[n] || []),
  e.events[n].push(t),
  () => {
    let s = e.events[n],
      o = s.indexOf(t);
    (s.splice(o, 1), s.length || (delete e.events[n], e.events[n + D](), delete e.events[n + D]));
  }
);
const De = 1e3;
let ge = (e, t) =>
  $e(
    e,
    (r) => {
      let s = t(r);
      s && e.events[$].push(s);
    },
    qe,
    (r) => {
      let s = e.listen;
      e.listen = (...a) => (!e.lc && !e.active && ((e.active = !0), r()), s(...a));
      let o = e.off;
      return (
        (e.events[$] = []),
        (e.off = () => {
          (o(),
            setTimeout(() => {
              if (e.active && !e.lc) {
                e.active = !1;
                for (let a of e.events[$]) a();
                e.events[$] = [];
              }
            }, De));
        }),
        () => {
          ((e.listen = s), (e.off = o));
        }
      );
    },
  );
function Fe(e, t, n) {
  let r = new Set(t).add(void 0);
  return e.listen((s, o, a) => {
    r.has(a) && n(s, o, a);
  });
}
const Me = () => typeof window > "u",
  Be = (e, t, n, r) => {
    const s = pe({
        data: null,
        error: null,
        isPending: !0,
        isRefetching: !1,
        refetch: (l) => o(l),
      }),
      o = async (l) =>
        new Promise((i) => {
          const u =
            typeof r == "function"
              ? r({ data: s.get().data, error: s.get().error, isPending: s.get().isPending })
              : r;
          n(t, {
            ...u,
            query: { ...u?.query, ...l?.query },
            async onSuccess(c) {
              (s.set({
                data: c.data,
                error: null,
                isPending: !1,
                isRefetching: !1,
                refetch: s.value.refetch,
              }),
                await u?.onSuccess?.(c));
            },
            async onError(c) {
              const { request: h } = c,
                f = typeof h.retry == "number" ? h.retry : h.retry?.attempts,
                y = h.retryAttempt || 0;
              if (f && y < f) return;
              const b = c.error.status === 401;
              (s.set({
                error: c.error,
                data: b ? null : s.get().data,
                isPending: !1,
                isRefetching: !1,
                refetch: s.value.refetch,
              }),
                await u?.onError?.(c));
            },
            async onRequest(c) {
              const h = s.get();
              (s.set({
                isPending: h.data === null,
                data: h.data,
                error: null,
                isRefetching: !0,
                refetch: s.value.refetch,
              }),
                await u?.onRequest?.(c));
            },
          })
            .catch((c) => {
              s.set({
                error: c,
                data: s.get().data,
                isPending: !1,
                isRefetching: !1,
                refetch: s.value.refetch,
              });
            })
            .finally(() => {
              i(void 0);
            });
        });
    e = Array.isArray(e) ? e : [e];
    let a = !1;
    for (const l of e)
      l.subscribe(async () => {
        Me() ||
          (a
            ? await o()
            : ge(s, () => {
                const i = setTimeout(async () => {
                  a || ((a = !0), await o());
                }, 0);
                return () => {
                  (s.off(), l.off(), clearTimeout(i));
                };
              }));
      });
    return s;
  },
  He = {
    proto:
      /"(?:_|\\u0{2}5[Ff]){2}(?:p|\\u0{2}70)(?:r|\\u0{2}72)(?:o|\\u0{2}6[Ff])(?:t|\\u0{2}74)(?:o|\\u0{2}6[Ff])(?:_|\\u0{2}5[Ff]){2}"\s*:/,
    constructor:
      /"(?:c|\\u0063)(?:o|\\u006[Ff])(?:n|\\u006[Ee])(?:s|\\u0073)(?:t|\\u0074)(?:r|\\u0072)(?:u|\\u0075)(?:c|\\u0063)(?:t|\\u0074)(?:o|\\u006[Ff])(?:r|\\u0072)"\s*:/,
    protoShort: /"__proto__"\s*:/,
    constructorShort: /"constructor"\s*:/,
  },
  We = /^\s*["[{]|^\s*-?\d{1,16}(\.\d{1,17})?([Ee][+-]?\d+)?\s*$/,
  se = {
    true: !0,
    false: !1,
    null: null,
    undefined: void 0,
    nan: NaN,
    infinity: Number.POSITIVE_INFINITY,
    "-infinity": Number.NEGATIVE_INFINITY,
  },
  Je =
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,7}))?(?:Z|([+-])(\d{2}):(\d{2}))$/;
function Ve(e) {
  return e instanceof Date && !isNaN(e.getTime());
}
function Ge(e) {
  const t = Je.exec(e);
  if (!t) return null;
  const [, n, r, s, o, a, l, i, u, c, h] = t,
    f = new Date(
      Date.UTC(
        parseInt(n, 10),
        parseInt(r, 10) - 1,
        parseInt(s, 10),
        parseInt(o, 10),
        parseInt(a, 10),
        parseInt(l, 10),
        i ? parseInt(i.padEnd(3, "0"), 10) : 0,
      ),
    );
  if (u) {
    const y = (parseInt(c, 10) * 60 + parseInt(h, 10)) * (u === "+" ? -1 : 1);
    f.setUTCMinutes(f.getUTCMinutes() + y);
  }
  return Ve(f) ? f : null;
}
function Xe(e, t = {}) {
  const { strict: n = !1, warnings: r = !1, reviver: s, parseDates: o = !0 } = t;
  if (typeof e != "string") return e;
  const a = e.trim();
  if (a.length > 0 && a[0] === '"' && a.endsWith('"') && !a.slice(1, -1).includes('"'))
    return a.slice(1, -1);
  const l = a.toLowerCase();
  if (l.length <= 9 && l in se) return se[l];
  if (!We.test(a)) {
    if (n) throw new SyntaxError("[better-json] Invalid JSON");
    return e;
  }
  if (
    Object.entries(He).some(([i, u]) => {
      const c = u.test(a);
      return (
        c &&
          r &&
          console.warn(
            `[better-json] Detected potential prototype pollution attempt using ${i} pattern`,
          ),
        c
      );
    }) &&
    n
  )
    throw new Error("[better-json] Potential prototype pollution attempt detected");
  try {
    return JSON.parse(a, (u, c) => {
      if (
        u === "__proto__" ||
        (u === "constructor" && c && typeof c == "object" && "prototype" in c)
      ) {
        r && console.warn(`[better-json] Dropping "${u}" key to prevent prototype pollution`);
        return;
      }
      if (o && typeof c == "string") {
        const h = Ge(c);
        if (h) return h;
      }
      return s ? s(u, c) : c;
    });
  } catch (i) {
    if (n) throw i;
    return e;
  }
}
function ze(e, t = { strict: !0 }) {
  return Xe(e, t);
}
const Qe = {
    id: "redirect",
    name: "Redirect",
    hooks: {
      onSuccess(e) {
        if (
          e.data?.url &&
          e.data?.redirect &&
          typeof window < "u" &&
          window.location &&
          window.location
        )
          try {
            window.location.href = e.data.url;
          } catch {}
      },
    },
  },
  G = Symbol.for("better-auth:broadcast-channel"),
  Ye = () => Math.floor(Date.now() / 1e3);
var Ze = class {
  listeners = new Set();
  name;
  constructor(e = "better-auth.message") {
    this.name = e;
  }
  subscribe(e) {
    return (
      this.listeners.add(e),
      () => {
        this.listeners.delete(e);
      }
    );
  }
  post(e) {
    if (!(typeof window > "u"))
      try {
        localStorage.setItem(this.name, JSON.stringify({ ...e, timestamp: Ye() }));
      } catch {}
  }
  setup() {
    if (typeof window > "u" || typeof window.addEventListener > "u") return () => {};
    const e = (t) => {
      if (t.key !== this.name) return;
      const n = JSON.parse(t.newValue ?? "{}");
      n?.event !== "session" || !n?.data || this.listeners.forEach((r) => r(n));
    };
    return (
      window.addEventListener("storage", e),
      () => {
        window.removeEventListener("storage", e);
      }
    );
  }
};
function X(e = "better-auth.message") {
  return (globalThis[G] || (globalThis[G] = new Ze(e)), globalThis[G]);
}
const z = Symbol.for("better-auth:focus-manager");
var Ke = class {
  listeners = new Set();
  subscribe(e) {
    return (
      this.listeners.add(e),
      () => {
        this.listeners.delete(e);
      }
    );
  }
  setFocused(e) {
    this.listeners.forEach((t) => t(e));
  }
  setup() {
    if (typeof window > "u" || typeof document > "u" || typeof window.addEventListener > "u")
      return () => {};
    const e = () => {
      document.visibilityState === "visible" && this.setFocused(!0);
    };
    return (
      document.addEventListener("visibilitychange", e, !1),
      () => {
        document.removeEventListener("visibilitychange", e, !1);
      }
    );
  }
};
function oe() {
  return (globalThis[z] || (globalThis[z] = new Ke()), globalThis[z]);
}
const Q = Symbol.for("better-auth:online-manager");
var et = class {
  listeners = new Set();
  isOnline = typeof navigator < "u" ? navigator.onLine : !0;
  subscribe(e) {
    return (
      this.listeners.add(e),
      () => {
        this.listeners.delete(e);
      }
    );
  }
  setOnline(e) {
    ((this.isOnline = e), this.listeners.forEach((t) => t(e)));
  }
  setup() {
    if (typeof window > "u" || typeof window.addEventListener > "u") return () => {};
    const e = () => this.setOnline(!0),
      t = () => this.setOnline(!1);
    return (
      window.addEventListener("online", e, !1),
      window.addEventListener("offline", t, !1),
      () => {
        (window.removeEventListener("online", e, !1), window.removeEventListener("offline", t, !1));
      }
    );
  }
};
function Y() {
  return (globalThis[Q] || (globalThis[Q] = new et()), globalThis[Q]);
}
const C = () => Math.floor(Date.now() / 1e3);
function ie(e) {
  return typeof e == "object" && e !== null && "data" in e && "error" in e
    ? e
    : { data: e, error: null };
}
const tt = 5;
function nt(e) {
  const { sessionAtom: t, sessionSignal: n, $fetch: r, options: s = {} } = e,
    o = s.sessionOptions?.refetchInterval ?? 0,
    a = s.sessionOptions?.refetchOnWindowFocus ?? !0,
    l = s.sessionOptions?.refetchWhenOffline ?? !1,
    i = { lastSync: 0, lastSessionRequest: 0, cachedSession: void 0 },
    u = () => l || Y().isOnline,
    c = (m) => {
      if (!u()) return;
      if (m?.event === "storage") {
        ((i.lastSync = C()), n.set(!n.get()));
        return;
      }
      const w = t.get(),
        g = () => {
          ((i.lastSessionRequest = C()),
            r("/get-session")
              .then(async (d) => {
                let { data: p, error: A } = ie(d);
                if (p?.needsRefresh)
                  try {
                    const k = await r("/get-session", { method: "POST" });
                    ({ data: p, error: A } = ie(k));
                  } catch {}
                const H = p?.session && p?.user ? p : null;
                (t.set({ ...w, data: H, error: A }), (i.lastSync = C()), n.set(!n.get()));
              })
              .catch(() => {}));
        };
      if (m?.event === "poll") {
        g();
        return;
      }
      if (m?.event === "visibilitychange") {
        if (C() - i.lastSessionRequest < tt) return;
        i.lastSessionRequest = C();
      }
      if (m?.event === "visibilitychange") {
        g();
        return;
      }
      (w?.data === null || w?.data === void 0) && ((i.lastSync = C()), n.set(!n.get()));
    },
    h = (m) => {
      X().post({
        event: "session",
        data: { trigger: m },
        clientId: Math.random().toString(36).substring(7),
      });
    },
    f = () => {
      o &&
        o > 0 &&
        (i.pollInterval = setInterval(() => {
          t.get()?.data && c({ event: "poll" });
        }, o * 1e3));
    },
    y = () => {
      i.unsubscribeBroadcast = X().subscribe(() => {
        c({ event: "storage" });
      });
    },
    b = () => {
      a &&
        (i.unsubscribeFocus = oe().subscribe(() => {
          c({ event: "visibilitychange" });
        }));
    },
    L = () => {
      i.unsubscribeOnline = Y().subscribe((m) => {
        m && c({ event: "visibilitychange" });
      });
    };
  return {
    init: () => {
      (f(), y(), b(), L(), X().setup(), oe().setup(), Y().setup());
    },
    cleanup: () => {
      (i.pollInterval && (clearInterval(i.pollInterval), (i.pollInterval = void 0)),
        i.unsubscribeBroadcast && (i.unsubscribeBroadcast(), (i.unsubscribeBroadcast = void 0)),
        i.unsubscribeFocus && (i.unsubscribeFocus(), (i.unsubscribeFocus = void 0)),
        i.unsubscribeOnline && (i.unsubscribeOnline(), (i.unsubscribeOnline = void 0)),
        (i.lastSync = 0),
        (i.lastSessionRequest = 0),
        (i.cachedSession = void 0));
    },
    triggerRefetch: c,
    broadcastSessionUpdate: h,
  };
}
function rt(e, t) {
  const n = pe(!1),
    r = Be(n, "/get-session", e, { method: "GET" });
  let s = () => {};
  return (
    ge(r, () => {
      const o = nt({ sessionAtom: r, sessionSignal: n, $fetch: e, options: t });
      return (
        o.init(),
        (s = o.broadcastSessionUpdate),
        () => {
          o.cleanup();
        }
      );
    }),
    { session: r, $sessionSignal: n, broadcastSessionUpdate: (o) => s(o) }
  );
}
function Z(e) {
  if (e === null || typeof e != "object") return !1;
  const t = Object.getPrototypeOf(e);
  return (t !== null && t !== Object.prototype && Object.getPrototypeOf(t) !== null) ||
    Symbol.iterator in e
    ? !1
    : Symbol.toStringTag in e
      ? Object.prototype.toString.call(e) === "[object Module]"
      : !0;
}
function K(e, t, n = ".", r) {
  if (!Z(t)) return K(e, {}, n, r);
  const s = { ...t };
  for (const o of Object.keys(e)) {
    if (o === "__proto__" || o === "constructor") continue;
    const a = e[o];
    a != null &&
      ((r && r(s, o, a, n)) ||
        (Array.isArray(a) && Array.isArray(s[o])
          ? (s[o] = [...a, ...s[o]])
          : Z(a) && Z(s[o])
            ? (s[o] = K(a, s[o], (n ? `${n}.` : "") + o.toString(), r))
            : (s[o] = a)));
  }
  return s;
}
function st(e) {
  return (...t) => t.reduce((n, r) => K(n, r, "", e), {});
}
const ot = st();
var it = Object.defineProperty,
  at = Object.defineProperties,
  ct = Object.getOwnPropertyDescriptors,
  ae = Object.getOwnPropertySymbols,
  ut = Object.prototype.hasOwnProperty,
  lt = Object.prototype.propertyIsEnumerable,
  ce = (e, t, n) =>
    t in e ? it(e, t, { enumerable: !0, configurable: !0, writable: !0, value: n }) : (e[t] = n),
  E = (e, t) => {
    for (var n in t || (t = {})) ut.call(t, n) && ce(e, n, t[n]);
    if (ae) for (var n of ae(t)) lt.call(t, n) && ce(e, n, t[n]);
    return e;
  },
  T = (e, t) => at(e, ct(t)),
  ft = class extends Error {
    constructor(e, t, n) {
      (super(t || e.toString(), { cause: n }),
        (this.status = e),
        (this.statusText = t),
        (this.error = n),
        Error.captureStackTrace(this, this.constructor));
    }
  },
  dt = async (e, t) => {
    var n, r, s, o, a, l;
    let i = t || {};
    const u = {
      onRequest: [t?.onRequest],
      onResponse: [t?.onResponse],
      onSuccess: [t?.onSuccess],
      onError: [t?.onError],
      onRetry: [t?.onRetry],
    };
    if (!t || !t?.plugins) return { url: e, options: i, hooks: u };
    for (const c of t?.plugins || []) {
      if (c.init) {
        const h = await ((n = c.init) == null ? void 0 : n.call(c, e.toString(), t));
        ((i = h.options || i), (e = h.url));
      }
      (u.onRequest.push((r = c.hooks) == null ? void 0 : r.onRequest),
        u.onResponse.push((s = c.hooks) == null ? void 0 : s.onResponse),
        u.onSuccess.push((o = c.hooks) == null ? void 0 : o.onSuccess),
        u.onError.push((a = c.hooks) == null ? void 0 : a.onError),
        u.onRetry.push((l = c.hooks) == null ? void 0 : l.onRetry));
    }
    return { url: e, options: i, hooks: u };
  },
  ue = class {
    constructor(e) {
      this.options = e;
    }
    shouldAttemptRetry(e, t) {
      return this.options.shouldRetry
        ? Promise.resolve(e < this.options.attempts && this.options.shouldRetry(t))
        : Promise.resolve(e < this.options.attempts);
    }
    getDelay() {
      return this.options.delay;
    }
  },
  ht = class {
    constructor(e) {
      this.options = e;
    }
    shouldAttemptRetry(e, t) {
      return this.options.shouldRetry
        ? Promise.resolve(e < this.options.attempts && this.options.shouldRetry(t))
        : Promise.resolve(e < this.options.attempts);
    }
    getDelay(e) {
      return Math.min(this.options.maxDelay, this.options.baseDelay * 2 ** e);
    }
  };
function pt(e) {
  if (typeof e == "number") return new ue({ type: "linear", attempts: e, delay: 1e3 });
  switch (e.type) {
    case "linear":
      return new ue(e);
    case "exponential":
      return new ht(e);
    default:
      throw new Error("Invalid retry strategy");
  }
}
var gt = async (e) => {
    const t = {},
      n = async (r) => (typeof r == "function" ? await r() : r);
    if (e?.auth) {
      if (e.auth.type === "Bearer") {
        const r = await n(e.auth.token);
        if (!r) return t;
        t.authorization = `Bearer ${r}`;
      } else if (e.auth.type === "Basic") {
        const [r, s] = await Promise.all([n(e.auth.username), n(e.auth.password)]);
        if (!r || !s) return t;
        t.authorization = `Basic ${btoa(`${r}:${s}`)}`;
      } else if (e.auth.type === "Custom") {
        const [r, s] = await Promise.all([n(e.auth.prefix), n(e.auth.value)]);
        if (!s) return t;
        t.authorization = `${r ?? ""} ${s}`;
      }
    }
    return t;
  },
  yt = /^application\/(?:[\w!#$%&*.^`~-]*\+)?json(;.+)?$/i;
function mt(e) {
  const t = e.headers.get("content-type"),
    n = new Set(["image/svg", "application/xml", "application/xhtml", "application/html"]);
  if (!t) return "json";
  const r = t.split(";").shift() || "";
  return yt.test(r) ? "json" : n.has(r) || r.startsWith("text/") ? "text" : "blob";
}
function vt(e) {
  try {
    return (JSON.parse(e), !0);
  } catch {
    return !1;
  }
}
function ee(e) {
  if (e === void 0) return !1;
  const t = typeof e;
  return t === "string" || t === "number" || t === "boolean" || t === null
    ? !0
    : t !== "object"
      ? !1
      : Array.isArray(e)
        ? !0
        : e.buffer
          ? !1
          : (e.constructor && e.constructor.name === "Object") || typeof e.toJSON == "function";
}
function le(e) {
  try {
    return JSON.parse(e);
  } catch {
    return e;
  }
}
function fe(e) {
  return typeof e == "function";
}
function bt(e) {
  if (e?.customFetchImpl) return e.customFetchImpl;
  if (typeof globalThis < "u" && fe(globalThis.fetch)) return globalThis.fetch;
  if (typeof window < "u" && fe(window.fetch)) return window.fetch;
  throw new Error("No fetch implementation found");
}
async function wt(e) {
  const t = new Headers(e?.headers),
    n = await gt(e);
  for (const [r, s] of Object.entries(n || {})) t.set(r, s);
  if (!t.has("content-type")) {
    const r = St(e?.body);
    r && t.set("content-type", r);
  }
  return t;
}
function St(e) {
  return ee(e) ? "application/json" : null;
}
function _t(e) {
  if (!e?.body) return null;
  const t = new Headers(e?.headers);
  if (ee(e.body) && !t.has("content-type")) {
    for (const [n, r] of Object.entries(e?.body))
      r instanceof Date && (e.body[n] = r.toISOString());
    return JSON.stringify(e.body);
  }
  return t.has("content-type") &&
    t.get("content-type") === "application/x-www-form-urlencoded" &&
    ee(e.body)
    ? new URLSearchParams(e.body).toString()
    : e.body;
}
function Rt(e, t) {
  var n;
  if (t?.method) return t.method.toUpperCase();
  if (e.startsWith("@")) {
    const r = (n = e.split("@")[1]) == null ? void 0 : n.split("/")[0];
    return me.includes(r) ? r.toUpperCase() : t?.body ? "POST" : "GET";
  }
  return t?.body ? "POST" : "GET";
}
function Ot(e, t) {
  let n;
  return (
    !e?.signal && e?.timeout && (n = setTimeout(() => t?.abort(), e?.timeout)),
    {
      abortTimeout: n,
      clearTimeout: () => {
        n && clearTimeout(n);
      },
    }
  );
}
var Et = class ye extends Error {
  constructor(t, n) {
    (super(n || JSON.stringify(t, null, 2)),
      (this.issues = t),
      Object.setPrototypeOf(this, ye.prototype));
  }
};
async function B(e, t) {
  const n = await e["~standard"].validate(t);
  if (n.issues) throw new Et(n.issues);
  return n.value;
}
var me = ["get", "post", "put", "patch", "delete"],
  Tt = (e) => ({
    id: "apply-schema",
    name: "Apply Schema",
    version: "1.0.0",
    async init(t, n) {
      var r, s, o, a;
      const l =
        ((s =
          (r = e.plugins) == null
            ? void 0
            : r.find((i) => {
                var u;
                return (u = i.schema) != null && u.config
                  ? t.startsWith(i.schema.config.baseURL || "") ||
                      t.startsWith(i.schema.config.prefix || "")
                  : !1;
              })) == null
          ? void 0
          : s.schema) || e.schema;
      if (l) {
        let i = t;
        ((o = l.config) != null &&
          o.prefix &&
          i.startsWith(l.config.prefix) &&
          ((i = i.replace(l.config.prefix, "")),
          l.config.baseURL && (t = t.replace(l.config.prefix, l.config.baseURL))),
          (a = l.config) != null &&
            a.baseURL &&
            i.startsWith(l.config.baseURL) &&
            (i = i.replace(l.config.baseURL, "")));
        const u = l.schema[i];
        if (u) {
          let c = T(E({}, n), { method: u.method, output: u.output });
          return (
            n?.disableValidation ||
              (c = T(E({}, c), {
                body: u.input ? await B(u.input, n?.body) : n?.body,
                params: u.params ? await B(u.params, n?.params) : n?.params,
                query: u.query ? await B(u.query, n?.query) : n?.query,
              })),
            { url: t, options: c }
          );
        }
      }
      return { url: t, options: n };
    },
  }),
  Pt = (e) => {
    async function t(n, r) {
      const s = T(E(E({}, e), r), {
        plugins: [...(e?.plugins || []), Tt(e || {}), ...(r?.plugins || [])],
      });
      if (e?.catchAllError)
        try {
          return await te(n, s);
        } catch (o) {
          return {
            data: null,
            error: {
              status: 500,
              statusText: "Fetch Error",
              message:
                "Fetch related error. Captured by catchAllError option. See error property for more details.",
              error: o,
            },
          };
        }
      return await te(n, s);
    }
    return t;
  };
function Ut(e, t) {
  const { baseURL: n, params: r, query: s } = t || { query: {}, params: {}, baseURL: "" };
  let o = e.startsWith("http") ? e.split("/").slice(0, 3).join("/") : n || "";
  if (e.startsWith("@")) {
    const h = e.toString().split("@")[1].split("/")[0];
    me.includes(h) && (e = e.replace(`@${h}/`, "/"));
  }
  o.endsWith("/") || (o += "/");
  let [a, l] = e.replace(o, "").split("?");
  const i = new URLSearchParams(l);
  for (const [h, f] of Object.entries(s || {})) {
    if (f == null) continue;
    let y;
    if (typeof f == "string") y = f;
    else if (Array.isArray(f)) {
      for (const b of f) i.append(h, b);
      continue;
    } else y = JSON.stringify(f);
    i.set(h, y);
  }
  if (r)
    if (Array.isArray(r)) {
      const h = a.split("/").filter((f) => f.startsWith(":"));
      for (const [f, y] of h.entries()) {
        const b = r[f];
        a = a.replace(y, b);
      }
    } else for (const [h, f] of Object.entries(r)) a = a.replace(`:${h}`, String(f));
  ((a = a.split("/").map(encodeURIComponent).join("/")), a.startsWith("/") && (a = a.slice(1)));
  let u = i.toString();
  return (
    (u = u.length > 0 ? `?${u}`.replace(/\+/g, "%20") : ""),
    o.startsWith("http") ? new URL(`${a}${u}`, o) : `${o}${a}${u}`
  );
}
var te = async (e, t) => {
    var n, r, s, o, a, l, i, u;
    const { hooks: c, url: h, options: f } = await dt(e, t),
      y = bt(f),
      b = new AbortController(),
      L = (n = f.signal) != null ? n : b.signal,
      S = Ut(h, f),
      _ = _t(f),
      m = await wt(f),
      w = Rt(h, f);
    let g = T(E({}, f), { url: S, headers: m, body: _, method: w, signal: L });
    for (const R of c.onRequest)
      if (R) {
        const v = await R(g);
        typeof v == "object" && v !== null && (g = v);
      }
    (("pipeTo" in g && typeof g.pipeTo == "function") ||
      typeof ((r = t?.body) == null ? void 0 : r.pipe) == "function") &&
      ("duplex" in g || (g.duplex = "half"));
    const { clearTimeout: d } = Ot(f, b);
    let p = await y(g.url, g);
    d();
    const A = { response: p, request: g };
    for (const R of c.onResponse)
      if (R) {
        const v = await R(
          T(E({}, A), {
            response: (s = t?.hookOptions) != null && s.cloneResponse ? p.clone() : p,
          }),
        );
        v instanceof Response ? (p = v) : typeof v == "object" && v !== null && (p = v.response);
      }
    if (p.ok) {
      if (!(g.method !== "HEAD")) return { data: "", error: null };
      const v = mt(p),
        P = { data: null, response: p, request: g };
      if (v === "json" || v === "text") {
        const U = await p.text(),
          be = (o = g.jsonParser) != null ? o : le;
        P.data = await be(U);
      } else P.data = await p[v]();
      g?.output && g.output && !g.disableValidation && (P.data = await B(g.output, P.data));
      for (const U of c.onSuccess)
        U &&
          (await U(
            T(E({}, P), {
              response: (a = t?.hookOptions) != null && a.cloneResponse ? p.clone() : p,
            }),
          ));
      return t?.throw ? P.data : { data: P.data, error: null };
    }
    const H = (l = t?.jsonParser) != null ? l : le,
      k = await p.text(),
      ne = vt(k),
      W = ne ? await H(k) : null,
      ve = {
        response: p,
        responseText: k,
        request: g,
        error: T(E({}, W), { status: p.status, statusText: p.statusText }),
      };
    for (const R of c.onError)
      R &&
        (await R(
          T(E({}, ve), {
            response: (i = t?.hookOptions) != null && i.cloneResponse ? p.clone() : p,
          }),
        ));
    if (t?.retry) {
      const R = pt(t.retry),
        v = (u = t.retryAttempt) != null ? u : 0;
      if (await R.shouldAttemptRetry(v, p)) {
        for (const U of c.onRetry) U && (await U(A));
        const P = R.getDelay(v);
        return (
          await new Promise((U) => setTimeout(U, P)),
          await te(e, T(E({}, t), { retryAttempt: v + 1 }))
        );
      }
    }
    if (t?.throw) throw new ft(p.status, p.statusText, ne ? W : k);
    return { data: null, error: T(E({}, W), { status: p.status, statusText: p.statusText }) };
  },
  N = {};
const Lt = (e) => {
    if (typeof process > "u") return;
    const t = e ?? "/api/auth";
    if (N.NEXT_PUBLIC_AUTH_URL) return N.NEXT_PUBLIC_AUTH_URL;
    if (typeof window > "u") {
      if (N.NEXTAUTH_URL)
        try {
          return N.NEXTAUTH_URL;
        } catch {}
      if (N.VERCEL_URL)
        try {
          const n = N.VERCEL_URL.startsWith("http") ? "" : "https://";
          return `${new URL(`${n}${N.VERCEL_URL}`).origin}${t}`;
        } catch {}
    }
  },
  It = (e, t) => {
    const n = "credentials" in Request.prototype,
      r = Te(e?.baseURL, e?.basePath) ?? Lt(e?.basePath) ?? "/api/auth",
      s = e?.plugins?.flatMap((d) => d.fetchPlugins).filter((d) => d !== void 0) || [],
      o = {
        id: "lifecycle-hooks",
        name: "lifecycle-hooks",
        hooks: {
          onSuccess: e?.fetchOptions?.onSuccess,
          onError: e?.fetchOptions?.onError,
          onRequest: e?.fetchOptions?.onRequest,
          onResponse: e?.fetchOptions?.onResponse,
        },
      },
      { onSuccess: a, onError: l, onRequest: i, onResponse: u, ...c } = e?.fetchOptions || {},
      h = Pt({
        baseURL: r,
        ...(n ? { credentials: "include" } : {}),
        method: "GET",
        jsonParser(d) {
          return d ? ze(d, { strict: !1 }) : null;
        },
        customFetchImpl: fetch,
        ...c,
        plugins: [o, ...(c.plugins || []), ...(e?.disableDefaultFetchPlugins ? [] : [Qe]), ...s],
      }),
      { $sessionSignal: f, session: y, broadcastSessionUpdate: b } = rt(h, e),
      L = e?.plugins || [];
    let S = {};
    const _ = { $sessionSignal: f, session: y },
      m = {
        "/sign-out": "POST",
        "/revoke-sessions": "POST",
        "/revoke-other-sessions": "POST",
        "/delete-user": "POST",
      },
      w = [
        {
          signal: "$sessionSignal",
          matcher(d) {
            return (
              d === "/sign-out" ||
              d === "/update-user" ||
              d === "/update-session" ||
              d === "/sign-up/email" ||
              d === "/sign-in/email" ||
              d === "/delete-user" ||
              d === "/verify-email" ||
              d === "/revoke-sessions" ||
              d === "/revoke-session" ||
              d === "/revoke-other-sessions" ||
              d === "/change-email" ||
              d === "/change-password"
            );
          },
          callback(d) {
            d === "/sign-out"
              ? b("signout")
              : (d === "/update-user" || d === "/update-session") && b("updateUser");
          },
        },
      ];
    for (const d of L)
      (d.getAtoms && Object.assign(_, d.getAtoms?.(h)),
        d.pathMethods && Object.assign(m, d.pathMethods),
        d.atomListeners && w.push(...d.atomListeners));
    const g = {
      notify: (d) => {
        _[d].set(!_[d].get());
      },
      listen: (d, p) => {
        _[d].subscribe(p);
      },
      atoms: _,
    };
    for (const d of L) d.getActions && (S = ot(d.getActions?.(h, g, e) ?? {}, S));
    return {
      get baseURL() {
        return r;
      },
      pluginsActions: S,
      pluginsAtoms: _,
      pluginPathMethods: m,
      atomListeners: w,
      $fetch: h,
      $store: g,
    };
  };
function At(e) {
  return (
    typeof e == "object" &&
    e !== null &&
    "get" in e &&
    typeof e.get == "function" &&
    "lc" in e &&
    typeof e.lc == "number"
  );
}
function xt(e, t, n) {
  const r = t[e],
    { fetchOptions: s, query: o, ...a } = n || {};
  return r || (s?.method ? s.method : a && Object.keys(a).length > 0 ? "POST" : "GET");
}
function Nt(e, t, n, r, s) {
  function o(a = []) {
    return new Proxy(function () {}, {
      get(l, i) {
        if (typeof i != "string" || i === "then" || i === "catch" || i === "finally") return;
        const u = [...a, i];
        let c = e;
        for (const h of u)
          if (c && typeof c == "object" && h in c) c = c[h];
          else {
            c = void 0;
            break;
          }
        return typeof c == "function" || At(c) ? c : o(u);
      },
      apply: async (l, i, u) => {
        const c = "/" + a.map((m) => m.replace(/[A-Z]/g, (w) => `-${w.toLowerCase()}`)).join("/"),
          h = u[0] || {},
          f = u[1] || {},
          { query: y, fetchOptions: b, ...L } = h,
          S = { ...f, ...b },
          _ = xt(c, n, h);
        return await t(c, {
          ...S,
          body: _ === "GET" ? void 0 : { ...L, ...(S?.body || {}) },
          query: y || S?.query,
          method: _,
          async onSuccess(m) {
            if ((await S?.onSuccess?.(m), !s || S.disableSignal)) return;
            const w = s.filter((d) => d.matcher(c));
            if (!w.length) return;
            const g = new Set();
            for (const d of w) {
              const p = r[d.signal];
              if (!p) return;
              if (g.has(d.signal)) continue;
              g.add(d.signal);
              const A = p.get();
              (setTimeout(() => {
                p.set(!A);
              }, 10),
                d.callback?.(c));
            }
          },
        });
      },
    });
  }
  return o();
}
function kt(e, t = {}) {
  const n = J.useRef(e.get()),
    { keys: r, deps: s = [e, r] } = t,
    o = J.useCallback((l) => {
      const i = (u) => {
        n.current !== u && ((n.current = u), l());
      };
      return (i(e.value), r?.length ? Fe(e, r, i) : e.listen(i));
    }, s),
    a = () => n.current;
  return J.useSyncExternalStore(o, a, a);
}
function Ct(e) {
  return e.charAt(0).toUpperCase() + e.slice(1);
}
function jt(e) {
  return `use${Ct(e)}`;
}
function qt(e) {
  const {
      pluginPathMethods: t,
      pluginsActions: n,
      pluginsAtoms: r,
      $fetch: s,
      $store: o,
      atomListeners: a,
    } = It(e),
    l = {};
  for (const [i, u] of Object.entries(r)) l[jt(i)] = () => kt(u);
  return Nt({ ...n, ...l, $fetch: s, $store: o }, s, t, r, a);
}
function $t(e) {
  const t = new URL(e);
  return (
    t.hostname.endsWith(".convex.cloud") &&
      (t.hostname = t.hostname.replace(/\.convex\.cloud$/, ".convex.site")),
    t.toString().replace(/\/+$/, "")
  );
}
function Dt() {
  return $t(we());
}
const Bt = qt({ baseURL: Dt(), plugins: [Se(), Ae({ storagePrefix: "arcade-auth" }), Ce()] });
export { Bt as authClient };
