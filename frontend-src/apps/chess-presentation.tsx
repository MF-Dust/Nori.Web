import { lazy } from "react";
import type { ProductionWindowBinding } from "../state/production-window-apps";
import type { ChessScreenProps } from "../screens/chess-screen";
import { MultiplayerGameFrame, type MultiplayerRuntime } from "../screens/multiplayer-panel";

const ChessScreen = lazy(() => import("../screens/chess-screen").then((module) => ({ default: module.ChessScreen })));

export type ChessPresentationRuntime = ChessScreenProps & { multiplayer?: MultiplayerRuntime };
export function createChessProductionWindowBinding(runtime: ChessPresentationRuntime): ProductionWindowBinding {
  const component = () => {
    const { multiplayer, ...props } = runtime;
    return <MultiplayerGameFrame game="chess" runtime={multiplayer}><ChessScreen {...props} /></MultiplayerGameFrame>;
  };
  return { screens: { main: { component } } };
}
