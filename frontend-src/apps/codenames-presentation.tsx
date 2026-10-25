import { lazy } from "react";
import type { ProductionWindowBinding } from "../state/production-window-apps";
import type { CodenamesAppProps } from "../screens/codenames-app";
import { MultiplayerGameFrame, type MultiplayerRuntime } from "../screens/multiplayer-panel";
const CodenamesApp = lazy(() => import("../screens/codenames-app").then((module) => ({ default: module.CodenamesApp })));

export type CodenamesPresentationRuntime = CodenamesAppProps & { multiplayer?: MultiplayerRuntime };
export function createCodenamesProductionWindowBinding(runtime: CodenamesPresentationRuntime): ProductionWindowBinding {
  const component = () => {
    const { multiplayer, ...props } = runtime;
    return <MultiplayerGameFrame game="codenames" runtime={multiplayer}><CodenamesApp {...props} /></MultiplayerGameFrame>;
  };
  return { screens: { start: { component }, game: { component }, results: { component } } };
}
