/** Source-owned original SVG artwork recovered from the authorized shipped reference. */
import * as e from "react/jsx-runtime";
const t = {
  canopy: "#1a2418",
  moss: "#4a5a40",
  leaf: "#7ab55c",
  gold: "#d4a853",
  goldLight: "#f0d78c",
  amber: "#c98b2e",
  berry: "#e85d75",
  cream: "#f5f0e6",
  bark: "#5c4a3d"
};
function CodenamesForest() {
  return e.jsxs("div", {
    className: "absolute inset-0 overflow-hidden",
    children: [e.jsx("div", {
      className: "absolute inset-0",
      style: {
        background: `linear-gradient(180deg,
            hsl(160, 35%, 8%) 0%,
            hsl(155, 40%, 10%) 30%,
            hsl(150, 35%, 12%) 60%,
            hsl(145, 30%, 8%) 100%
          )`
      }
    }), e.jsxs("svg", {
      className: "absolute bottom-0 w-full",
      style: {
        height: "70%"
      },
      viewBox: "0 0 800 300",
      preserveAspectRatio: "xMidYMax slice",
      children: [e.jsxs("defs", {
        children: [e.jsxs("linearGradient", {
          id: "farTreeGrad",
          x1: "0%",
          y1: "0%",
          x2: "0%",
          y2: "100%",
          children: [e.jsx("stop", {
            offset: "0%",
            stopColor: "hsl(155, 30%, 18%)"
          }), e.jsx("stop", {
            offset: "100%",
            stopColor: "hsl(155, 35%, 10%)"
          })]
        }), e.jsxs("linearGradient", {
          id: "midTreeGrad",
          x1: "0%",
          y1: "0%",
          x2: "0%",
          y2: "100%",
          children: [e.jsx("stop", {
            offset: "0%",
            stopColor: "hsl(150, 35%, 14%)"
          }), e.jsx("stop", {
            offset: "100%",
            stopColor: "hsl(150, 40%, 8%)"
          })]
        }), e.jsxs("linearGradient", {
          id: "nearTreeGrad",
          x1: "0%",
          y1: "0%",
          x2: "0%",
          y2: "100%",
          children: [e.jsx("stop", {
            offset: "0%",
            stopColor: t.moss
          }), e.jsx("stop", {
            offset: "100%",
            stopColor: t.canopy
          })]
        })]
      }), e.jsx("path", {
        d: "M0 300 L0 180 Q100 140 200 160 Q300 120 400 150 Q500 100 600 140 Q700 110 800 150 L800 300 Z",
        fill: "url(#farTreeGrad)",
        opacity: "0.5"
      }), e.jsx("path", {
        d: "M0 300 L0 200 L40 200 L60 150 L80 200 L120 200 L150 120 L180 200 L220 200 L250 160 L280 200 L320 200 L360 130 L400 200 L440 200 L470 170 L500 200 L540 200 L580 140 L620 200 L660 200 L700 160 L740 200 L780 200 L800 180 L800 300 Z",
        fill: "url(#midTreeGrad)",
        opacity: "0.7"
      }), e.jsx("path", {
        d: "M0 300 L0 240 L30 240 L50 180 L45 180 L70 120 L65 120 L90 60 L115 120 L110 120 L135 180 L130 180 L150 240 L200 240 L220 190 L215 190 L245 130 L240 130 L270 70 L300 130 L295 130 L325 190 L320 190 L340 240 L400 240 L420 200 L415 200 L440 150 L435 150 L465 90 L495 150 L490 150 L515 200 L510 200 L530 240 L580 240 L600 210 L595 210 L620 160 L615 160 L640 110 L665 160 L660 160 L685 210 L680 210 L700 240 L750 240 L770 200 L765 200 L790 150 L815 200 L810 200 L830 240 L830 300 Z",
        fill: "url(#nearTreeGrad)"
      })]
    }), e.jsx("div", {
      className: "absolute bottom-0 left-0 right-0 h-24",
      style: {
        background: "linear-gradient(180deg, transparent 0%, hsla(150, 30%, 12%, 0.6) 100%)"
      }
    })]
  });
}
export { CodenamesForest };
