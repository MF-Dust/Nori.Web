import type { WindowScreenComponent } from "../state/window-types";
import { MailScreen, type MailScreenRuntime } from "../screens/mail-screen";

export type MailPresentationRuntime = MailScreenRuntime;

export function createMailProductionWindowBinding(
  runtime: MailPresentationRuntime,
): WindowScreenComponent {
  return function MailProductionWindow() {
    return <MailScreen runtime={runtime} />;
  };
}
