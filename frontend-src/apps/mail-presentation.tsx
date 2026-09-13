import type { WindowComponentProps } from "../state/window-types";
import type { ProductionWindowBinding } from "../state/production-window-apps";
import { MailScreen, type MailScreenRuntime } from "../screens/mail-screen";

export type MailPresentationRuntime = MailScreenRuntime;

export function createMailProductionWindowBinding(
  runtime: MailPresentationRuntime,
): ProductionWindowBinding {
  function MailProductionWindow(props: WindowComponentProps) {
    return <MailScreen runtime={runtime} instanceId={props.instanceId} />;
  }

  return { component: MailProductionWindow };
}
