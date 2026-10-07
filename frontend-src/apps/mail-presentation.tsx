import { lazy } from "react";
import type { WindowComponentProps } from "../state/window-types";
import type { ProductionWindowBinding } from "../state/production-window-apps";
import type { MailScreenRuntime } from "../screens/mail-screen";

const MailScreen = lazy(() => import("../screens/mail-screen").then((module) => ({ default: module.MailScreen })));

export type MailPresentationRuntime = MailScreenRuntime;

export function createMailProductionWindowBinding(
  runtime: MailPresentationRuntime,
): ProductionWindowBinding {
  function MailProductionWindow(props: WindowComponentProps) {
    return <MailScreen runtime={runtime} instanceId={props.instanceId} />;
  }

  return { component: MailProductionWindow };
}
