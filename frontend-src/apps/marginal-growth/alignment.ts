import type { IdleAlignment } from "../idle";
import type { MarginalGrowthShape } from "./ribbon-world";

/**
 * Shipped `wt` table (`IdleScreen-DCDB640k.js`). `none` has no growth tint, so
 * the accent falls back to the store default `fxIconColor`.
 */
export const IDLE_ALIGNMENT_RIBBON: Record<
  IdleAlignment,
  {
    shape: MarginalGrowthShape;
    canvasBg: number;
    accent: number;
    growth: { circle: number; icon: number } | null;
  }
> = {
  none: { shape: "circle", canvasBg: 0, accent: 8053503, growth: null },
  accelerate: {
    shape: "spiky",
    canvasBg: 1311748,
    accent: 16281969,
    growth: { circle: 10033947, icon: 16281969 },
  },
  decelerate: {
    shape: "chubby",
    canvasBg: 660484,
    accent: 10741301,
    growth: { circle: 5078031, icon: 10741301 },
  },
  equilibrium: {
    shape: "nori",
    canvasBg: 267805,
    accent: 10875900,
    growth: { circle: 947344, icon: 10875900 },
  },
};
