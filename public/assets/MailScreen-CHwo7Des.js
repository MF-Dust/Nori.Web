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
    ]),
) => i.map((i) => d[i]);
import { j as e, _ as W } from "./index-CyHAbkO5.js";
import { r as s, u as v } from "./i18n-DtIC1LRi.js";
import {
  f as y,
  aS as A,
  aM as q,
  aT as F,
  aU as _,
  aV as U,
  aW as V,
  i as N,
  p as R,
  aX as $,
  as as K,
  E as Y,
  aY as C,
  J as G,
  aZ as I,
  U as H,
  y as J,
  a_ as z,
  A as X,
} from "./NormalApp-Cn6agT0F.js";
import { S as Z } from "./SidebarNavButton-jUmo5l7D.js";
import { S as Q } from "./square-pen-DO9jpDiG.js";
import { L as T } from "./loader-circle-DfbEUp82.js";
import { n as ee } from "./downloads-xYYIzO4D.js";
import { D as te } from "./download-BfBW5oEI.js";
const se = [
    ["rect", { width: "20", height: "5", x: "2", y: "3", rx: "1", key: "1wp1u1" }],
    ["path", { d: "M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8", key: "1s80jp" }],
    ["path", { d: "M10 12h4", key: "a56b0p" }],
  ],
  ne = y("archive", se);
const re = [
    ["path", { d: "m2 2 20 20", key: "1ooewy" }],
    ["path", { d: "M5.782 5.782A7 7 0 0 0 9 19h8.5a4.5 4.5 0 0 0 1.307-.193", key: "yfwify" }],
    [
      "path",
      { d: "M21.532 16.5A4.5 4.5 0 0 0 17.5 10h-1.79A7.008 7.008 0 0 0 10 5.07", key: "jlfiyv" },
    ],
  ],
  oe = y("cloud-off", re);
const ae = [
    ["polyline", { points: "22 12 16 12 14 15 10 15 8 12 2 12", key: "o97t9d" }],
    [
      "path",
      {
        d: "M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z",
        key: "oot6mr",
      },
    ],
  ],
  ie = y("inbox", ae);
const le = [
    ["path", { d: "m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7", key: "132q7q" }],
    ["rect", { x: "2", y: "4", width: "20", height: "16", rx: "2", key: "izxlao" }],
  ],
  de = y("mail", le);
const ce = [
    [
      "path",
      {
        d: "m16 6-8.414 8.586a2 2 0 0 0 2.829 2.829l8.414-8.586a4 4 0 1 0-5.657-5.657l-8.379 8.551a6 6 0 1 0 8.485 8.485l8.379-8.551",
        key: "1miecu",
      },
    ],
  ],
  B = y("paperclip", ce);
const me = [
    [
      "path",
      {
        d: "M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z",
        key: "1ffxy3",
      },
    ],
    ["path", { d: "m21.854 2.147-10.94 10.939", key: "12cjpa" }],
  ],
  ue = y("send", me);
function xe() {
  const r = A(),
    t = q(),
    l = F.useArtifacts("mail"),
    n = F.useIsLoading(),
    d = _((i) => i.localReadById),
    u = _((i) => i.markReadLocal),
    [h, f] = s.useState(null),
    o = s.useMemo(() => U(l), [l]),
    x = s.useRef(null),
    a = s.useMemo(() => {
      const i = x.current,
        m = i && i.parsed === o ? i.emails : null;
      let b = !m || m.length !== o.length;
      const S = o.map((M, P) => {
        const D = V(M, t, d),
          E = m?.[P];
        return E && E.read === D ? E : ((b = !0), { ...M.email, read: D });
      });
      return !b && m ? m : ((x.current = { parsed: o, emails: S }), S);
    }, [o, t, d]),
    p = s.useMemo(() => a.find((i) => i.id === h) ?? null, [a, h]),
    g = s.useCallback((i) => a.filter((m) => m.folder === i), [a]),
    c = s.useMemo(() => {
      const i = { inbox: 0, sent: 0, archive: 0 };
      for (const m of a) i[m.folder]++;
      return i;
    }, [a]),
    j = s.useMemo(() => a.filter((i) => !i.read && i.folder === "inbox").length, [a]),
    w = s.useRef(a);
  w.current = a;
  const k = s.useCallback(
    (i) => {
      if ((f(i), !i)) return;
      const m = w.current.find((b) => b.id === i);
      m &&
        (m.read ||
          r("mail.read", { mailId: i })
            .then(() => {
              u(i);
            })
            .catch((b) => {
              console.warn("[Mail] Failed to mark mail as read:", b);
            }));
    },
    [r, u],
  );
  return s.useMemo(
    () => ({
      emails: a,
      isLoading: n,
      selectedEmail: p,
      selectEmail: k,
      getEmailsForFolder: g,
      folderCounts: c,
      unreadInboxCount: j,
    }),
    [a, n, p, k, g, c, j],
  );
}
function fe(r) {
  const t = $(r),
    l = K(),
    n = Math.floor((l.getTime() - t.getTime()) / (1e3 * 60 * 60 * 24));
  return n === 0
    ? t.toLocaleTimeString(void 0, { hour: "2-digit", minute: "2-digit" })
    : n < 7
      ? t.toLocaleDateString(void 0, { weekday: "short" })
      : t.toLocaleDateString(void 0, { month: "short", day: "numeric" });
}
const he = s.memo(function ({ email: t, selected: l, onSelect: n }) {
    const { t: d } = v(),
      u = t.subject.startsWith("mail.") ? d(t.subject) : t.subject,
      h = t.self ? `${d("mail.to")}: ${t.to}` : t.from.name,
      f = t.self ? "" : t.from.email,
      o = l
        ? "border-l-primary bg-primary/[0.12] hover:bg-primary/[0.18] active:bg-primary/[0.24]"
        : t.read
          ? "hover:bg-muted/40 active:bg-muted/60"
          : "bg-foreground/[0.035] hover:bg-muted/40 active:bg-muted/60";
    return e.jsx("button", {
      type: "button",
      onClick: () => {
        (l || R("comms-mail-open-email"), n(t.id));
      },
      "aria-current": l ? "true" : void 0,
      className: N(
        "w-full text-left px-3 py-2.5",
        "border-b border-border/50 border-l-2 border-l-transparent",
        "transition-colors duration-150",
        "outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/60",
        o,
      ),
      children: e.jsxs("div", {
        className: "flex items-start gap-2",
        children: [
          e.jsx("div", {
            className: "mt-1.5 shrink-0 size-2",
            children: !t.read && e.jsx("div", { className: "size-2 rounded-full bg-primary" }),
          }),
          e.jsxs("div", {
            className: "flex-1 min-w-0",
            children: [
              e.jsxs("div", {
                className: "flex items-center justify-between gap-2",
                children: [
                  e.jsx("span", {
                    className: N(
                      "text-sm truncate",
                      t.read ? "font-normal text-foreground" : "font-semibold text-foreground",
                    ),
                    children: h,
                  }),
                  e.jsxs("span", {
                    className: N(
                      "flex items-center gap-1 text-[11px] shrink-0",
                      l ? "text-foreground/70" : "text-muted-foreground",
                    ),
                    children: [
                      t.attachments.length > 0 && e.jsx(B, { className: "size-3" }),
                      fe(t.date),
                    ],
                  }),
                ],
              }),
              e.jsx("div", {
                className: N(
                  "text-sm truncate mt-0.5",
                  t.read
                    ? l
                      ? "text-foreground/80"
                      : "text-muted-foreground"
                    : "font-medium text-foreground",
                ),
                children: u,
              }),
              f &&
                e.jsx("div", {
                  className: "text-xs text-muted-foreground truncate mt-0.5 opacity-70",
                  children: f,
                }),
            ],
          }),
        ],
      }),
    });
  }),
  pe = { inbox: ie, sent: ue, archive: ne },
  L = { inbox: "mail.inbox", sent: "mail.sent", archive: "mail.archive" },
  ge = ["inbox", "sent", "archive"],
  be = s.memo(function ({
    emails: t,
    selectedEmailId: l,
    currentFolder: n,
    folderCounts: d,
    unreadInboxCount: u,
    isLoading: h,
    onSelectEmail: f,
    onSelectFolder: o,
    onCompose: x,
  }) {
    const { t: a } = v(),
      p = (c) => {
        const j = d[c];
        return j > 0 ? j : void 0;
      },
      g = () => {
        switch (n) {
          case "sent":
            return a("mail.emptySent");
          case "archive":
            return a("mail.emptyArchive");
          default:
            return a("mail.emptyInbox");
        }
      };
    return e.jsxs("div", {
      className: "h-full flex flex-col bg-muted/20 border-r border-border/50",
      children: [
        e.jsxs("div", {
          className:
            "flex items-center justify-between px-3 h-11 shrink-0 border-b border-border/50",
          children: [
            e.jsx("span", { className: "text-sm font-medium text-foreground", children: a(L[n]) }),
            e.jsx("button", {
              type: "button",
              onClick: x,
              title: a("mail.compose"),
              "aria-label": a("mail.compose"),
              className: N(
                "p-1.5 rounded-md text-muted-foreground transition-colors",
                "outline-none focus-visible:ring-2 focus-visible:ring-ring/60",
                "hover:bg-muted/60 hover:text-foreground active:bg-muted/80",
              ),
              children: e.jsx(Q, { className: "size-4" }),
            }),
          ],
        }),
        e.jsx("nav", {
          className: "px-2 py-2",
          children: ge.map((c) =>
            e.jsx(
              Z,
              {
                icon: pe[c],
                label: a(L[c]),
                count: p(c),
                active: n === c,
                badgeVariant: c === "inbox" && u > 0 ? "primary" : "muted",
                onClick: () => o(c),
              },
              c,
            ),
          ),
        }),
        e.jsx("div", {
          className: "flex-1 overflow-auto border-t border-border/50",
          children:
            h && t.length === 0
              ? e.jsx("div", {
                  className: "h-full flex items-center justify-center",
                  children: e.jsx(T, { className: "size-5 text-muted-foreground animate-spin" }),
                })
              : t.length === 0
                ? e.jsx("div", {
                    className: "p-4 text-center text-sm text-muted-foreground",
                    children: g(),
                  })
                : t.map((c) => e.jsx(he, { email: c, selected: c.id === l, onSelect: f }, c.id)),
        }),
      ],
    });
  });
function je(r) {
  return r >= 1048576
    ? `${(r / 1048576).toFixed(1)} MB`
    : r >= 1024
      ? `${Math.round(r / 1024)} KB`
      : `${r} B`;
}
function ve({ attachment: r }) {
  const { t } = v(),
    l = A(),
    n = Y(r.downloadFact ?? ""),
    [d, u] = s.useState(!1),
    [h, f] = s.useState(0);
  s.useEffect(() => {
    if (!d) return;
    const x = r.downloadFact;
    if (!x) return;
    const a = requestAnimationFrame(() => f(100)),
      p = setTimeout(() => {
        l("client.emitFact", { factId: x })
          .then(() => ee(x, !1))
          .catch((g) => {
            (console.error("[Mail] qfr download emit failed", g), u(!1), f(0));
          });
      }, C);
    return () => {
      (cancelAnimationFrame(a), clearTimeout(p));
    };
  }, [d, r.downloadFact, l]);
  const o = () => {
    n || d || !r.downloadFact || u(!0);
  };
  return e.jsxs("div", {
    className: "flex items-center gap-3 rounded-md border border-border bg-muted/30 px-3 py-2.5",
    children: [
      e.jsx("div", {
        className:
          "flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground",
        children: e.jsx(te, { className: "size-4" }),
      }),
      e.jsxs("div", {
        className: "min-w-0 flex-1",
        children: [
          e.jsx("div", { className: "truncate text-sm text-foreground", children: r.filename }),
          e.jsx("div", {
            className: "text-xs text-muted-foreground",
            children: d ? t("mail.downloading") : je(r.sizeBytes),
          }),
        ],
      }),
      n
        ? e.jsxs("span", {
            className:
              "inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground",
            children: [e.jsx(G, { className: "size-3.5" }), t("mail.downloaded")],
          })
        : d
          ? e.jsx("div", {
              className: "h-1.5 w-28 shrink-0 overflow-hidden rounded-full bg-muted",
              children: e.jsx("div", {
                className: "h-full rounded-full bg-primary",
                style: {
                  width: `${h}%`,
                  transitionProperty: "width",
                  transitionDuration: `${C}ms`,
                  transitionTimingFunction: "linear",
                },
              }),
            })
          : e.jsx("button", {
              type: "button",
              onClick: o,
              className:
                "inline-flex shrink-0 items-center rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90",
              children: t("mail.download"),
            }),
    ],
  });
}
const O = () =>
    W(() => import("./MarkdownBody-Ct_BWFHm.js"), __vite__mapDeps([0, 1, 2, 3, 4, 5, 6, 7, 8])),
  ye = s.lazy(O);
function Ne() {
  O();
}
const we = e.jsx("div", {
    className: "flex items-center justify-center py-10 text-muted-foreground",
    children: e.jsx("div", {
      className: "animate-spin",
      children: e.jsx(T, { className: "size-5", strokeWidth: 1.5 }),
    }),
  }),
  ke = s.memo(function ({ email: t }) {
    const { t: l, i18n: n } = v(),
      d = t.self === !0,
      u = (o) => {
        const x = $(o),
          a = x.toLocaleDateString(n.language, { month: "long", day: "numeric", weekday: "long" }),
          p = x.toLocaleTimeString(n.language, {
            hour: "numeric",
            minute: "2-digit",
            hour12: n.language.startsWith("en"),
          });
        return `${a}, ${p}`;
      },
      h = t.subject.startsWith("mail.") ? l(t.subject) : t.subject,
      f = t.body.startsWith("mail.") ? l(t.body) : t.body;
    return e.jsx("div", {
      className: "h-full flex flex-col",
      children: e.jsx("div", {
        className: "flex-1 overflow-auto",
        children: e.jsxs("div", {
          className: "max-w-3xl mx-auto p-6",
          children: [
            e.jsx("h1", { className: "text-xl font-semibold text-foreground mb-4", children: h }),
            e.jsxs("div", {
              className: "flex items-start gap-3 mb-6",
              children: [
                e.jsx("div", {
                  className:
                    "size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium shrink-0",
                  children: t.from.name.charAt(0).toUpperCase(),
                }),
                e.jsxs("div", {
                  className: "flex-1 min-w-0",
                  children: [
                    e.jsxs("div", {
                      className: "flex items-baseline gap-2 flex-wrap",
                      children: [
                        e.jsx("span", {
                          className: "font-medium text-foreground",
                          children: t.from.name,
                        }),
                        !d &&
                          e.jsxs("span", {
                            className: "text-sm text-muted-foreground",
                            children: ["<", t.from.email, ">"],
                          }),
                      ],
                    }),
                    e.jsxs("div", {
                      className: "text-sm text-muted-foreground mt-0.5",
                      children: [l("mail.to"), ": ", t.to],
                    }),
                    e.jsx("div", {
                      className: "text-xs text-muted-foreground mt-1",
                      children: u(t.date),
                    }),
                  ],
                }),
              ],
            }),
            e.jsx(I, { className: "mb-6" }),
            e.jsx("div", {
              className:
                "prose prose-sm dark:prose-invert max-w-none select-text text-foreground leading-relaxed",
              children: e.jsx(s.Suspense, { fallback: we, children: e.jsx(ye, { source: f }) }),
            }),
            t.attachments.length > 0 &&
              e.jsxs("div", {
                className: "mt-8 select-text",
                children: [
                  e.jsx(I, { className: "mb-4" }),
                  e.jsxs("div", {
                    className:
                      "flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-3",
                    children: [
                      e.jsx(B, { className: "size-3.5" }),
                      e.jsxs("span", {
                        children: [l("mail.attachments"), " (", t.attachments.length, ")"],
                      }),
                    ],
                  }),
                  e.jsx("div", {
                    className: "flex flex-col gap-3",
                    children: t.attachments.map((o) =>
                      o.kind === "download"
                        ? e.jsx(ve, { attachment: o }, o.id)
                        : e.jsxs(
                            "figure",
                            {
                              className: "m-0",
                              children: [
                                e.jsx("img", {
                                  src: o.src,
                                  alt: "",
                                  width: o.dimensions?.width,
                                  height: o.dimensions?.height,
                                  className: "max-w-full h-auto rounded-md border border-border",
                                }),
                                e.jsx("figcaption", {
                                  className: "text-xs text-muted-foreground mt-1.5",
                                  children: o.filename,
                                }),
                              ],
                            },
                            o.id,
                          ),
                    ),
                  }),
                ],
              }),
          ],
        }),
      }),
    });
  }),
  Ee = s.memo(function () {
    const { t } = v();
    return e.jsx("div", {
      className: "h-full flex items-center justify-center",
      children: e.jsxs("div", {
        className: "text-center",
        children: [
          e.jsx("div", {
            className:
              "size-16 rounded-full bg-muted/30 flex items-center justify-center mx-auto mb-4",
            children: e.jsx(de, { className: "size-8 text-muted-foreground/50", strokeWidth: 1.5 }),
          }),
          e.jsx("p", { className: "text-muted-foreground", children: t("mail.noEmailSelected") }),
        ],
      }),
    });
  });
function Se({ onDismiss: r }) {
  const { t } = v();
  return e.jsxs(H, {
    className: "pt-10",
    onScrimClick: r,
    onEscape: r,
    onEnter: r,
    sfx: !1,
    children: [
      e.jsxs("div", {
        className: "flex items-start gap-3",
        children: [
          e.jsx("div", {
            className:
              "flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted/50 text-muted-foreground",
            children: e.jsx(oe, { className: "size-[18px]" }),
          }),
          e.jsxs("div", {
            className: "min-w-0 flex-1",
            children: [
              e.jsx("h2", {
                className: "text-sm font-semibold leading-snug text-foreground",
                children: t("mail.networkError.title"),
              }),
              e.jsx("p", {
                className: "mt-1.5 text-[13px] leading-relaxed text-muted-foreground",
                children: t("mail.networkError.body"),
              }),
            ],
          }),
        ],
      }),
      e.jsx("div", {
        className: "mt-5 flex justify-end",
        children: e.jsx("button", {
          type: "button",
          onClick: r,
          className:
            "rounded-lg bg-muted/60 px-4 py-1.5 text-[13px] font-medium text-foreground transition-colors hover:bg-muted",
          children: t("mail.networkError.dismiss"),
        }),
      }),
    ],
  });
}
const Ae = s.memo(function (t) {
  const {
      isLoading: l,
      selectedEmail: n,
      selectEmail: d,
      getEmailsForFolder: u,
      folderCounts: h,
      unreadInboxCount: f,
    } = xe(),
    [o, x] = s.useState("inbox"),
    [a, p] = s.useState(!1);
  (J(n ? `mail:${n.id}` : "mail:inbox"),
    s.useEffect(() => {
      Ne();
    }, []));
  const g = z((m) => m.pendingFocusEmailId),
    c = z((m) => m.setPendingFocusEmailId);
  s.useEffect(() => {
    g && (x("inbox"), d(g), c(null));
  }, [g, c, d]);
  const j = s.useMemo(() => u(o), [u, o]),
    w = s.useCallback(
      (m) => {
        (x(m), n && !u(m).some((b) => b.id === n.id) && d(null));
      },
      [n, u, d],
    ),
    k = s.useCallback(() => {
      (R("comms-mail-compose-refused"), p(!0));
    }, []),
    i = s.useCallback(() => p(!1), []);
  return e.jsxs("div", {
    className: "h-full flex relative overflow-hidden",
    children: [
      e.jsx("div", {
        className: "w-64 shrink-0",
        children: e.jsx(be, {
          emails: j,
          selectedEmailId: n?.id ?? null,
          currentFolder: o,
          folderCounts: h,
          unreadInboxCount: f,
          isLoading: l,
          onSelectEmail: d,
          onSelectFolder: w,
          onCompose: k,
        }),
      }),
      e.jsx("div", {
        className: "flex-1 min-w-0",
        children: n ? e.jsx(ke, { email: n }, n.id) : e.jsx(Ee, {}),
      }),
      e.jsx(X, { children: a && e.jsx(Se, { onDismiss: i }) }),
    ],
  });
});
export { Ae as MailScreen };
