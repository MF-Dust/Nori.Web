import { useState } from "react";
import { createRoot } from "react-dom/client";
import { IDLE_ALIGNMENT_RIBBON } from "../../../frontend-src/apps/marginal-growth/alignment";
import { MarginalGrowthRibbonView } from "../../../frontend-src/apps/marginal-growth/ribbon-view";
import { DEFAULT_MARGINAL_GROWTH } from "../../../frontend-src/state/marginal-growth-store";
import type { MarginalGrowthShape } from "../../../frontend-src/apps/marginal-growth/ribbon-world";

const shapes = ["circle", "chubby", "spiky", "nori"] as const;

function Harness() {
  const [shape, setShape] = useState<MarginalGrowthShape>("circle");
  const [mounted, setMounted] = useState(true);
  const [steps, setSteps] = useState(DEFAULT_MARGINAL_GROWTH.params.steps);
  const ribbon = IDLE_ALIGNMENT_RIBBON[
    shape === "circle"
      ? "none"
      : shape === "spiky"
        ? "accelerate"
        : shape === "chubby"
          ? "decelerate"
          : "equilibrium"
  ];
  window.idleRibbonProbe = { shape, mounted, steps, setShape, setMounted, setSteps };
  if (!mounted) return null;
  return (
    <div style={{ position: "relative", width: "100vw", height: "100vh" }}>
      <MarginalGrowthRibbonView
        shape={shape}
        params={{
          ...DEFAULT_MARGINAL_GROWTH.params,
          steps,
          ...(ribbon.growth
            ? {
                fxCircleColor: ribbon.growth.circle,
                fxIconColor: ribbon.growth.icon,
              }
            : {}),
        }}
        accentColor={ribbon.accent}
        backgroundColor={ribbon.canvasBg}
      />
    </div>
  );
}

declare global {
  interface Window {
    idleRibbonProbe: {
      shape: MarginalGrowthShape;
      mounted: boolean;
      setShape: (shape: MarginalGrowthShape) => void;
      setMounted: (mounted: boolean) => void;
      setSteps: (steps: number) => void;
    };
  }
}

createRoot(document.getElementById("root")!).render(<Harness />);
