import React from "react";
import { createRoot } from "react-dom/client";
import { ChessScreen } from "../frontend-src/screens/chess-screen";
import { PictionaryScreen } from "../frontend-src/screens/pictionary-screen";
import { CHESS_START_FEN } from "../frontend-src/apps/chess-model";
import { createSourceTranslate } from "../frontend-src/i18n/translate";

// Only transport is replaced. These are the same screens/canvas built by source-app.
const commands: any[] = [], strokes: any[] = [];
let capture: (() => any) | null = null;
let revisions = 0;
const chessInitial = { settings: { playerSide: "white", difficulty: "casual" }, gameState: null, tutorial: null, drawOffer: null, takebackRequest: null };
const pictInitial = { settings: { sessionDurationMs: 180000, inferenceMode: "fast", locale: "en" }, gameState: null };
function controller(initial: any) {
  let snapshot = { state: initial, mounted: true, pending: false, error: null };
  const listeners = new Set<() => void>();
  return {
    snapshot: () => snapshot,
    subscribe: (listener: () => void) => { listeners.add(listener); return () => listeners.delete(listener); },
    retain: () => () => {},
    ensureMounted: async () => true,
    dispatch: async (command: any) => { commands.push(command); return true; },
    set(state: any) { snapshot = { ...snapshot, state }; listeners.forEach(listener => listener()); },
  };
}
const chess = controller(chessInitial), pictionary = controller(pictInitial);
function round(id = "one", drawer = "player") {
  return { ...pictInitial, gameState: { phase: "PLAYING", score: { solved: 0, skipped: 0 }, history: [],
    round: { roundId: id, startedAtMs: Date.now(), word: "apple", drawingId: "apple", roles: { drawer, guesser: drawer === "player" ? "agent" : "player" }, status: "active", noriRedrawEpoch: 0 } } };
}
const drawing = { setCapture(value: typeof capture) { capture = value; }, submit(stroke: any) { strokes.push(stroke); }, changed() { revisions++; } };
Object.assign(window, { fixture: {
  commands, strokes,
  snapshot: () => capture?.(),
  revisions: () => revisions,
  chess(fen = CHESS_START_FEN) { chess.set({ ...chessInitial, gameState: { fen, startFen: fen, turn: "white", status: "playing", winner: null, moveHistory: [] } }); },
  round(id?: string, drawer?: string) { pictionary.set(round(id, drawer)); },
} });
const pict = location.hash === "#pictionary";
createRoot(document.getElementById("root")!).render(pict
  ? <PictionaryScreen controller={pictionary as any} drawing={drawing as any} locale="en" />
  : <ChessScreen controller={chess as any} translate={createSourceTranslate("en")} />);
