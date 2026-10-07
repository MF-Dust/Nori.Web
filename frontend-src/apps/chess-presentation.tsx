import { lazy } from "react";
import type { ProductionWindowBinding } from "../state/production-window-apps";
import type { ChessScreenProps } from "../screens/chess-screen";

const ChessScreen = lazy(() => import("../screens/chess-screen").then((module) => ({ default: module.ChessScreen })));

export type ChessPresentationRuntime = ChessScreenProps;
export function createChessProductionWindowBinding(runtime: ChessPresentationRuntime): ProductionWindowBinding {
  return { screens: { main: { component: () => <ChessScreen {...runtime} /> } } };
}
