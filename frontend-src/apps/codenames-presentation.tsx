import { lazy } from "react";
import type { ProductionWindowBinding } from "../state/production-window-apps";
import type { CodenamesAppProps } from "../screens/codenames-app";
const CodenamesApp = lazy(() => import("../screens/codenames-app").then((module) => ({ default: module.CodenamesApp })));

export type CodenamesPresentationRuntime = CodenamesAppProps;
export function createCodenamesProductionWindowBinding(runtime: CodenamesPresentationRuntime): ProductionWindowBinding {
  const component = () => <CodenamesApp {...runtime} />;
  return { screens: { start: { component }, game: { component }, results: { component } } };
}
