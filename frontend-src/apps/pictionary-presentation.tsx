import { lazy } from "react";
import type { ProductionWindowBinding } from "../state/production-window-apps";
import type { PictionaryScreenProps } from "../screens/pictionary-screen";
import { MultiplayerGameFrame, type MultiplayerRuntime } from "../screens/multiplayer-panel";
const PictionaryScreen = lazy(() => import("../screens/pictionary-screen").then((module) => ({ default: module.PictionaryScreen })));

export type PictionaryPresentationRuntime = PictionaryScreenProps & { multiplayer?: MultiplayerRuntime };
export function createPictionaryProductionWindowBinding(runtime: PictionaryPresentationRuntime): ProductionWindowBinding {
  // The replicated game state owns the route; one host preserves the drawing canvas
  // and transcript across round transitions.
  const component = () => {
    const { multiplayer, ...props } = runtime;
    return <MultiplayerGameFrame game="pictionary" runtime={multiplayer}><PictionaryScreen {...props} /></MultiplayerGameFrame>;
  };
  return { screens: { start: { component }, game: { component }, results: { component } } };
}
