import { j as e } from "./index-CyHAbkO5.js";
import { u as h, r as s } from "./i18n-DtIC1LRi.js";
import { v as b, w as g, x as v, y as z } from "./NormalApp-Cn6agT0F.js";
import { H as j, B as y } from "./BrowserPageView-drqjbn-z.js";
import { L as E } from "./lock-eIU2WcCi.js";
import "./downloads-xYYIzO4D.js";
import "./download-BfBW5oEI.js";
function B({ setTitle: o, instanceId: t, url: c }) {
  const { t: n } = h(),
    x = b(t) === "maximized",
    m = g(),
    i = v(),
    a = c ?? j,
    [r, u] = s.useState(""),
    [l, d] = s.useState(null);
  z(l ? `page:${l}` : null);
  const p = s.useCallback((w) => {
      u(w);
    }, []),
    f = s.useCallback(() => {
      i(t);
    }, [i, t]);
  return (
    s.useEffect(() => {
      o(r || n("browser.title"));
    }, [r, o, n]),
    e.jsxs("div", {
      className: "flex h-full flex-col bg-white text-zinc-950",
      children: [
        e.jsxs("div", {
          className: "flex items-center gap-2 border-b border-zinc-200 bg-zinc-50 px-3 py-2",
          children: [
            e.jsx(E, { className: "size-3.5 shrink-0 text-zinc-400" }),
            e.jsx("div", {
              className:
                "min-w-0 flex-1 truncate rounded-full bg-zinc-100 px-3 py-1 text-xs text-zinc-500",
              children: a,
            }),
          ],
        }),
        e.jsx("div", {
          className: "relative min-h-0 flex-1 bg-white",
          children: e.jsx(y, {
            url: a,
            reloadNonce: 0,
            isMaximized: x,
            onTitleChange: p,
            onEnvelopeChange: d,
            onActivate: f,
            onReady: m,
          }),
        }),
      ],
    })
  );
}
export { B as PopupScreen };
