import { TerminalWindow, type TerminalWindowProps } from "../screens/terminal-window";
import type { ProductionWindowBinding } from "../state/production-window-apps";
import type { WindowComponentProps } from "../state/window-types";

export type TerminalPresentationRuntime = Omit<
  TerminalWindowProps,
  "instanceId" | "focused"
>;

/** Creates the production `terminal/main` presentation binding. */
export function createTerminalProductionWindowBinding(
  runtime: TerminalPresentationRuntime,
): ProductionWindowBinding {
  function BoundTerminalWindow(props: WindowComponentProps) {
    return (
      <TerminalWindow
        {...runtime}
        instanceId={props.instanceId}
        focused={props.focused}
      />
    );
  }

  return { component: BoundTerminalWindow };
}
