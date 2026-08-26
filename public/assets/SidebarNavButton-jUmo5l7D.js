import { j as e } from "./index-CyHAbkO5.js";
import { i as n, p } from "./NormalApp-Cn6agT0F.js";
function l({
  icon: o,
  label: i,
  count: t,
  active: r,
  badgeVariant: s = "muted",
  onClick: x,
  sfx: a = !0,
}) {
  const m = typeof t == "number" && t > 0;
  return e.jsxs("button", {
    type: "button",
    onClick: () => {
      (a && p("primitives-nav-select"), x());
    },
    className: n(
      "w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-sm transition-colors",
      r
        ? "bg-primary/10 text-primary font-medium"
        : "text-muted-foreground hover:bg-muted hover:text-foreground",
    ),
    children: [
      e.jsx(o, { className: "size-4 shrink-0" }),
      e.jsx("span", { className: "flex-1 text-left", children: i }),
      m &&
        s === "primary" &&
        e.jsx("span", {
          className: n(
            "text-[10px] font-medium px-1.5 py-0.5 rounded-full min-w-[20px] text-center",
            r ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
          ),
          children: t,
        }),
      m &&
        s === "muted" &&
        e.jsx("span", { className: "text-[10px] text-muted-foreground", children: t }),
    ],
  });
}
export { l as S };
