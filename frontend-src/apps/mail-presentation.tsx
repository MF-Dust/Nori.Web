import type { ProductionWindowBinding } from "../state/production-window-apps";
import { MailScreen, type MailScreenRuntime } from "../screens/mail-screen";

export type MailPresentationRuntime = MailScreenRuntime;

export function createMailProductionWindowBinding(
  runtime: MailPresentationRuntime,
): ProductionWindowBinding {
  function MailProductionWindow() {
    return <MailScreen runtime={runtime} />;
  }

  return { component: MailProductionWindow };
}
