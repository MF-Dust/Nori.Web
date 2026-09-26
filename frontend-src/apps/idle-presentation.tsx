import type { StoreApi, UseBoundStore } from "zustand";
import type { ProductionWindowBinding } from "../state/production-window-apps";
import type { MarginalGrowthState } from "../state/marginal-growth-store";
import type { WindowComponentProps } from "../state/window-types";
import { IdleScreen, type IdleScreenRuntime } from "../screens/idle-screen";

export type IdlePresentationRuntime = IdleScreenRuntime;

export function createIdleProductionWindowBinding(
  runtime: IdlePresentationRuntime,
  marginalGrowth?: UseBoundStore<StoreApi<MarginalGrowthState>>,
): ProductionWindowBinding {
  function IdleProductionWindow(_props: WindowComponentProps) {
    return <IdleScreen runtime={runtime} marginalGrowth={marginalGrowth} />;
  }
  return { component: IdleProductionWindow };
}
