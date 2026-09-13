import type { ProductionWindowBinding } from "../state/production-window-apps";
import { PictionaryScreen, type PictionaryScreenProps } from "../screens/pictionary-screen";
export type PictionaryPresentationRuntime = PictionaryScreenProps;
export function createPictionaryProductionWindowBinding(runtime: PictionaryPresentationRuntime): ProductionWindowBinding {
  // The replicated game state owns the route; one host preserves the drawing canvas
  // and transcript across round transitions.
  const component = () => <PictionaryScreen {...runtime} />;
  return { screens: { start: { component }, game: { component }, results: { component } } };
}
