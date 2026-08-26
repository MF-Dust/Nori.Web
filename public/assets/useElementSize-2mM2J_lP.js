import { r as i } from "./i18n-DtIC1LRi.js";
const u = {
    peach: "#F8A678",
    peachDeep: "#D68B52",
    peachLight: "#ECBE80",
    cream: "#fff8ef",
    creamDark: "#f0e4d0",
    sky: "#8AB7E1",
    brown: "#6b4830",
    brownLight: "#a07050",
    pink: "#e899a8",
    gold: "#e8c73a",
  },
  f = `
@import url('/fonts.css');
`;
function g() {
  const [e, r] = i.useState(null),
    [a, c] = i.useState({ width: 0, height: 0 });
  return (
    i.useLayoutEffect(() => {
      if (!e) return;
      const n = () => {
        const t = e.getBoundingClientRect();
        c((s) =>
          s.width === t.width && s.height === t.height ? s : { width: t.width, height: t.height },
        );
      };
      n();
      const o = new ResizeObserver(n);
      return (o.observe(e), () => o.disconnect());
    }, [e]),
    [r, a]
  );
}
export { u as C, f as F, g as u };
