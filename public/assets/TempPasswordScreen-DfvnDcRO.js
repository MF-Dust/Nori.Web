import { j as e } from "./index-CyHAbkO5.js";
import { u as d, r as m } from "./i18n-DtIC1LRi.js";
import { y as l, J as c, K as p } from "./NormalApp-Cn6agT0F.js";
function f({ navigate: o, params: r }) {
  const { t } = d(),
    s = r?.tempPassword ?? "",
    [n, i] = m.useState(!1);
  l("signal:tempPassword");
  const a = () => {
    s &&
      navigator.clipboard
        ?.writeText(s)
        .then(() => i(!0))
        .catch(() => {});
  };
  return e.jsxs("div", {
    className:
      "flex h-full flex-col items-center justify-center gap-6 p-8 text-center text-foreground",
    children: [
      e.jsxs("div", {
        children: [
          e.jsx("h1", {
            className: "text-base font-medium",
            children: t("signal.tempPassword.title"),
          }),
          e.jsx("p", {
            className: "mt-1 text-sm text-muted-foreground",
            children: t("signal.tempPassword.subtitle"),
          }),
        ],
      }),
      e.jsxs("button", {
        type: "button",
        onClick: a,
        className:
          "group inline-flex items-center gap-3 rounded-md border border-border bg-muted/40 px-4 py-3 font-mono text-lg tracking-wide transition-colors hover:bg-muted/60",
        title: t("signal.tempPassword.copy"),
        children: [
          e.jsx("span", { children: s || "••••" }),
          n
            ? e.jsx(c, { className: "size-4 text-primary" })
            : e.jsx(p, { className: "size-4 text-muted-foreground" }),
        ],
      }),
      e.jsx("button", {
        type: "button",
        onClick: () => o("login", { notice: t("signal.tempPassword.loginNotice") }),
        className:
          "w-full max-w-xs rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90",
        children: t("signal.tempPassword.backToLogin"),
      }),
    ],
  });
}
export { f as TempPasswordScreen };
