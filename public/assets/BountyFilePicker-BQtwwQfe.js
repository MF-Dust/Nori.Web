import { j as e } from "./index-CyHAbkO5.js";
import { r as n } from "./i18n-DtIC1LRi.js";
import {
  E as V,
  V as N,
  Q as F,
  R as S,
  U as R,
  W as $,
  B as w,
  Y as E,
  Z as K,
  _ as L,
  i as y,
} from "./NormalApp-Cn6agT0F.js";
import { r as W, c as P } from "./tree-BwnCy3ce.js";
import {
  u as _,
  a as G,
  F as H,
  B as Q,
  b as Y,
  S as Z,
  c as B,
  d as J,
  M as X,
  e as ee,
  f as se,
  P as te,
  I as re,
  g as ae,
  h as le,
} from "./SealedVolumeAlert-CLn2CcA9.js";
import { A as ie, a as ne } from "./arrow-right-Ch5wSBwP.js";
import { L as oe } from "./loader-circle-DfbEUp82.js";
import { L as I } from "./lock-eIU2WcCi.js";
import "./SidebarNavButton-jUmo5l7D.js";
import "./download-BfBW5oEI.js";
function de(a) {
  const o = P(a).map((r) => ({ kind: "folder", key: `folder:${r.path}`, node: r })),
    i = a.vaults.map((r) => ({ kind: "vault", key: `vault:${r.id}`, vault: r })),
    u = [...a.files]
      .sort((r, t) => {
        const l = E(r),
          d = E(t);
        return l !== d
          ? l - d
          : new Date(t.modifiedAt).getTime() - new Date(r.modifiedAt).getTime();
      })
      .map((r) => ({ kind: "file", key: `file:${r.id}`, file: r }));
  return [...o, ...i, ...u];
}
const ce = { text: L, image: re, pdf: te, "training-log": se },
  me = "inline-flex items-center rounded-lg bg-muted/40 p-0.5 ring-1 ring-inset ring-border/60",
  A =
    "flex size-7 items-center justify-center rounded-[7px] text-muted-foreground transition-colors hover:bg-background/50 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-muted-foreground",
  ue =
    "flex size-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent";
function j({ selected: a, muted: o, onSelect: i, onOpen: u, icon: r, name: t, date: l, size: d }) {
  return e.jsxs("button", {
    type: "button",
    onClick: i,
    onDoubleClick: u,
    className: y(
      "relative flex w-full items-center gap-2.5 border-b border-border/40 px-4 py-2 text-left transition-colors",
      "before:absolute before:inset-y-1.5 before:left-0 before:w-[3px] before:rounded-r-full before:bg-primary before:opacity-0 before:content-['']",
      "hover:bg-muted/40 focus:bg-muted/40 focus:outline-none",
      a && "bg-primary/10 hover:bg-primary/15 before:opacity-100",
    ),
    children: [
      e.jsx("span", { className: "flex size-4 shrink-0 items-center justify-center", children: r }),
      e.jsx("span", {
        className: y(
          "min-w-0 flex-1 truncate text-sm",
          o ? "text-muted-foreground" : "text-foreground",
        ),
        children: t,
      }),
      (l || d) &&
        e.jsxs("span", {
          className:
            "hidden shrink-0 items-center gap-4 text-xs tabular-nums text-muted-foreground sm:flex",
          children: [
            e.jsx("span", { className: "w-24 text-right", children: l ?? "" }),
            e.jsx("span", { className: "w-16 text-right", children: d ?? "" }),
          ],
        }),
    ],
  });
}
function ye({ onCancel: a, onPick: o }) {
  const i = V("qfr.installed"),
    { tree: u, isLoading: r } = _(),
    t = G(""),
    [l, d] = n.useState(null),
    [k, f] = n.useState(null),
    h = n.useCallback(
      (s) => {
        if (s === N || s.startsWith(`${N}/`)) {
          f(i ? "cannot-upload" : "sealed");
          return;
        }
        (t.go(s), d(null));
      },
      [t, i],
    ),
    b = n.useMemo(() => W(u, t.path), [u, t.path]),
    z = n.useMemo(() => {
      if (!b) return [];
      const s = de(b);
      if (t.path !== "") return s;
      const x = s.filter((m) => !(m.kind === "folder" && m.node.path === N));
      return [{ kind: "device", key: "device:cold-volume", sealed: !i }, ...x];
    }, [b, t.path, i]),
    g = n.useCallback((s) => !F(s) || S(s), []),
    D = n.useCallback(() => {
      l && o(l.file.id);
    }, [l, o]),
    M = n.useCallback(
      (s) => {
        d(s.kind === "file" && g(s.file) ? { key: s.key, file: s.file } : null);
      },
      [g],
    ),
    q = n.useCallback(
      (s) => {
        s.kind === "folder"
          ? h(s.node.path)
          : s.kind === "device"
            ? f(s.sealed ? "sealed" : "cannot-upload")
            : s.kind === "vault" || (g(s.file) && o(s.file.id));
      },
      [h, g, o],
    ),
    O = l?.key ?? null;
  function T(s) {
    const x = s.key === O,
      p = () => M(s),
      m = () => q(s);
    if (s.kind === "folder")
      return e.jsx(
        j,
        {
          selected: x,
          onSelect: p,
          onOpen: m,
          icon: e.jsx(B, { className: "size-4 fill-sky-400/10 text-sky-400/90" }),
          name: s.node.name,
        },
        s.key,
      );
    if (s.kind === "device") {
      const v = s.sealed ? J : X;
      return e.jsx(
        j,
        {
          selected: x,
          onSelect: p,
          onOpen: m,
          icon: e.jsx(v, { className: "size-4" }),
          name: "归档区",
        },
        s.key,
      );
    }
    if (s.kind === "vault") {
      const v = s.vault.vaultKind === "file" ? ee : B;
      return e.jsx(
        j,
        {
          selected: x,
          muted: !0,
          onSelect: p,
          onOpen: m,
          icon: e.jsxs("span", {
            className: "relative",
            children: [
              e.jsx(v, { className: "size-4 text-muted-foreground" }),
              !s.vault.unlocked &&
                e.jsx(I, { className: "absolute -bottom-0.5 -right-0.5 size-2.5 text-amber-500" }),
            ],
          }),
          name: s.vault.title,
        },
        s.key,
      );
    }
    const c = s.file,
      C = F(c) && !S(c),
      U = c.launch === "qfr" ? K : ce[c.kind];
    return e.jsx(
      j,
      {
        selected: x,
        muted: C,
        onSelect: p,
        onOpen: m,
        icon: C
          ? e.jsxs("span", {
              className: "relative",
              children: [
                e.jsx(L, { className: "size-4 text-muted-foreground" }),
                e.jsx(I, { className: "absolute -bottom-0.5 -right-0.5 size-2.5 text-amber-500" }),
              ],
            })
          : e.jsx(U, {
              className: y(
                "size-4",
                c.launch === "qfr" ? "text-[#4ee0c8]" : "text-muted-foreground",
              ),
            }),
        name: c.name,
        date: le(c.modifiedAt),
        size: ae(c.sizeBytes),
      },
      s.key,
    );
  }
  return e.jsxs(e.Fragment, {
    children: [
      e.jsxs(R, {
        className: "items-center px-4 py-6",
        frameClassName:
          "flex h-[min(32rem,calc(100%-1rem))] w-[min(44rem,calc(100%-1rem))] flex-col",
        sheetClassName: "flex min-h-0 flex-1 flex-col overflow-hidden p-0",
        onScrimClick: a,
        onEscape: k ? void 0 : a,
        children: [
          e.jsx("div", {
            className: "shrink-0 border-b border-border/50 px-5 py-3",
            children: e.jsx("h2", {
              className: "text-sm font-semibold leading-snug text-foreground",
              children: "选择要上传的文件",
            }),
          }),
          e.jsxs("div", {
            className: "flex min-h-0 flex-1 overflow-hidden",
            children: [
              e.jsx("aside", {
                className: "hidden w-48 shrink-0 overflow-y-auto sm:block",
                children: e.jsx(H, {
                  currentPath: t.path,
                  onSelectFolder: h,
                  qfrInstalled: i,
                  onSealedClick: () => f("sealed"),
                }),
              }),
              e.jsxs("div", {
                className: "flex min-w-0 flex-1 flex-col",
                children: [
                  e.jsxs("div", {
                    className:
                      "flex shrink-0 items-center gap-2 border-b border-border/50 bg-muted/15 px-3 py-2",
                    children: [
                      e.jsxs("div", {
                        className: me,
                        children: [
                          e.jsx("button", {
                            type: "button",
                            className: A,
                            onClick: t.back,
                            disabled: !t.canBack,
                            "aria-label": "后退",
                            title: "后退",
                            children: e.jsx(ie, { className: "size-4" }),
                          }),
                          e.jsx("span", {
                            className: "mx-px h-4 w-px bg-border/60",
                            "aria-hidden": !0,
                          }),
                          e.jsx("button", {
                            type: "button",
                            className: A,
                            onClick: t.forward,
                            disabled: !t.canForward,
                            "aria-label": "前进",
                            title: "前进",
                            children: e.jsx(ne, { className: "size-4" }),
                          }),
                        ],
                      }),
                      e.jsx("button", {
                        type: "button",
                        className: ue,
                        onClick: () => h(""),
                        disabled: t.path === "",
                        "aria-label": "主目录",
                        title: "主目录",
                        children: e.jsx($, { className: "size-4" }),
                      }),
                      e.jsx("div", {
                        className: "min-w-0 flex-1",
                        children: e.jsx(Q, { path: t.path, onNavigate: h }),
                      }),
                    ],
                  }),
                  e.jsxs("div", {
                    className:
                      "flex shrink-0 items-center gap-2.5 border-b border-border/50 bg-muted/10 px-4 py-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70",
                    children: [
                      e.jsx("span", { className: "size-4 shrink-0", "aria-hidden": !0 }),
                      e.jsx("span", { className: "min-w-0 flex-1", children: "名称" }),
                      e.jsxs("span", {
                        className: "hidden shrink-0 items-center gap-4 sm:flex",
                        children: [
                          e.jsx("span", { className: "w-24 text-right", children: "修改日期" }),
                          e.jsx("span", { className: "w-16 text-right", children: "大小" }),
                        ],
                      }),
                    ],
                  }),
                  e.jsx("div", {
                    className: "min-h-0 flex-1 overflow-auto",
                    children: r
                      ? e.jsx("div", {
                          className: "flex h-full items-center justify-center py-10",
                          children: e.jsx(oe, {
                            className: "size-5 animate-spin text-muted-foreground/70",
                          }),
                        })
                      : !b || z.length === 0
                        ? e.jsxs("div", {
                            className:
                              "flex h-full flex-col items-center justify-center gap-3 py-10 text-center",
                            children: [
                              e.jsx(Y, {
                                className: "size-10 text-muted-foreground/40",
                                strokeWidth: 1.25,
                              }),
                              e.jsx("div", {
                                className: "text-sm text-muted-foreground",
                                children: "此文件夹为空",
                              }),
                            ],
                          })
                        : z.map(T),
                  }),
                ],
              }),
            ],
          }),
          e.jsxs("div", {
            className: "flex shrink-0 items-center gap-3 border-t border-border/50 px-5 py-3",
            children: [
              e.jsx("div", {
                className: "min-w-0 flex-1 truncate text-[13px]",
                children: l
                  ? e.jsx("span", { className: "text-foreground", children: l.file.name })
                  : e.jsx("span", { className: "text-muted-foreground", children: "未选择文件" }),
              }),
              e.jsx(w, { variant: "ghost", size: "sm", onClick: a, children: "取消" }),
              e.jsx(w, { size: "sm", onClick: D, disabled: !l, children: "上传" }),
            ],
          }),
        ],
      }),
      k === "sealed" && e.jsx(Z, { onClose: () => f(null) }),
      k === "cannot-upload" && e.jsx(xe, { onClose: () => f(null) }),
    ],
  });
}
function xe({ onClose: a }) {
  return e.jsxs(R, {
    className: "z-[60] pt-10",
    onScrimClick: a,
    onEscape: a,
    onEnter: a,
    children: [
      e.jsx("h2", {
        className: "text-sm font-semibold leading-snug text-foreground",
        children: "无法上传此处的文件",
      }),
      e.jsx("p", {
        className: "mt-1.5 text-[13px] leading-relaxed text-muted-foreground",
        children: "「归档区」中的文件已被加密，无法直接访问。",
      }),
      e.jsx("div", {
        className: "mt-5 flex justify-end",
        children: e.jsx(w, { variant: "secondary", size: "sm", onClick: a, children: "知道了" }),
      }),
    ],
  });
}
export { ye as BountyFilePicker };
