import type { ProductionWindowBinding } from "../state/production-window-apps";
import { CodenamesApp, type CodenamesAppProps } from "../screens/codenames-app";
export type CodenamesPresentationRuntime = CodenamesAppProps;
export function createCodenamesProductionWindowBinding(runtime: CodenamesPresentationRuntime): ProductionWindowBinding {
  const component = () => <CodenamesApp {...runtime} />;
  return { screens: { start: { component }, game: { component }, results: { component } } };
}
