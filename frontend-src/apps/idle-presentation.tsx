import type { ProductionWindowBinding } from "../state/production-window-apps";
import type { WindowComponentProps } from "../state/window-types";
import { IdleScreen, type IdleScreenRuntime } from "../screens/idle-screen";

export type IdlePresentationRuntime = IdleScreenRuntime;

export function createIdleProductionWindowBinding(
  runtime: IdlePresentationRuntime,
): ProductionWindowBinding {
  function IdleProductionWindow(_props: WindowComponentProps) {
    return <IdleScreen runtime={runtime} />;
  }
  return { component: IdleProductionWindow };
}
