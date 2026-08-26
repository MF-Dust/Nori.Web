import { j as e } from "./index-CyHAbkO5.js";
import { u as y, r as g } from "./i18n-DtIC1LRi.js";
import { z as v, y as w, H as X, p as c } from "./NormalApp-Cn6agT0F.js";
import { a as C } from "./commands-CYVhKV_w.js";
import { C as N } from "./chevron-left-BV9NpAwY.js";
const f = 16;
function j(o) {
  return o
    .replaceAll(/[^a-z0-9]/gi, "")
    .toUpperCase()
    .slice(0, f)
    .replaceAll(/(.{4})(?=.)/g, "$1-");
}
function P({ navigate: o, goBack: m }) {
  const { t } = y(),
    d = v(),
    [a, x] = g.useState(""),
    [n, i] = g.useState("idle"),
    r = n === "submitting",
    u = a.replaceAll("-", "").length === f;
  w("signal:reset");
  const b = async (l) => {
      if ((l.preventDefault(), !(!d || r || !u))) {
        i("submitting");
        try {
          const s = await C(d, a);
          if (s?.ok && typeof s.tempPassword == "string") {
            (c("comms-signal-recovery-accepted"),
              o("tempPassword", { tempPassword: s.tempPassword }));
            return;
          }
          (await new Promise((h) => setTimeout(h, 1100)),
            c("comms-signal-auth-error"),
            i("invalid"));
        } catch (s) {
          (console.warn("[Signal] Recovery failed:", s), c("comms-signal-auth-error"), i("error"));
        }
      }
    },
    p =
      n === "invalid"
        ? t("signal.reset.invalidCode")
        : n === "error"
          ? t("signal.reset.submitFailed")
          : "";
  return e.jsxs("div", {
    className: "flex h-full flex-col p-6 text-foreground",
    children: [
      e.jsxs("button", {
        type: "button",
        onClick: m,
        className:
          "mb-6 inline-flex items-center gap-1 self-start text-sm text-muted-foreground transition-colors hover:text-foreground",
        children: [e.jsx(N, { className: "size-4" }), t("signal.reset.back")],
      }),
      e.jsxs("form", {
        onSubmit: b,
        className: "m-auto w-full max-w-xs space-y-5",
        children: [
          e.jsxs("div", {
            children: [
              e.jsx("h1", {
                className: "text-base font-medium",
                children: t("signal.reset.title"),
              }),
              e.jsx("p", {
                className: "mt-1 text-sm text-muted-foreground",
                children: t("signal.reset.subtitle", { account: X }),
              }),
              e.jsx("p", {
                className: "mt-2 text-xs text-muted-foreground/80",
                children: t("signal.reset.hint"),
              }),
            ],
          }),
          e.jsx("input", {
            value: a,
            onChange: (l) => x(j(l.currentTarget.value)),
            disabled: r,
            placeholder: "XXXX-XXXX-XXXX-XXXX",
            autoFocus: !0,
            autoComplete: "off",
            spellCheck: !1,
            className:
              "w-full rounded-md border border-border bg-muted/40 px-3 py-2 text-center font-mono text-sm tracking-widest text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/50 disabled:opacity-50",
          }),
          e.jsx("button", {
            type: "submit",
            disabled: r || !u,
            className:
              "w-full rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50",
            children: t(r ? "signal.reset.submitting" : "signal.reset.submit"),
          }),
          p && e.jsx("p", { className: "min-h-5 text-sm text-destructive", children: p }),
        ],
      }),
    ],
  });
}
export { P as ResetScreen };
