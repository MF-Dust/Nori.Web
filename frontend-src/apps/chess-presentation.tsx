import type { ProductionWindowBinding } from "../state/production-window-apps";
import { ChessScreen, type ChessScreenProps } from "../screens/chess-screen";

export type ChessPresentationRuntime = ChessScreenProps;
export function createChessProductionWindowBinding(runtime: ChessPresentationRuntime): ProductionWindowBinding {
  return { screens: { main: { component: () => <ChessScreen {...runtime} /> } } };
}
