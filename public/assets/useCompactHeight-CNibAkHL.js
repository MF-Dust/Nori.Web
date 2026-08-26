import { r as e } from "./i18n-DtIC1LRi.js";
function f(t) {
  const r = e.useRef(null),
    [n, o] = e.useState(!1);
  return (
    e.useLayoutEffect(() => {
      const s = r.current;
      if (!s) return;
      const c = new ResizeObserver(([u]) => {
        o(u.contentRect.height < t);
      });
      return (c.observe(s), () => c.disconnect());
    }, [t]),
    { ref: r, compact: n }
  );
}
export { f as u };
