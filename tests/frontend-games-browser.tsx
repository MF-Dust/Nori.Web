import { CodenamesApp } from "../frontend-src/screens/codenames-app";
import React from "react";
import { createRoot } from "react-dom/client";
import { ChessScreen } from "../frontend-src/screens/chess-screen";
import { PictionaryScreen } from "../frontend-src/screens/pictionary-screen";
import { CHESS_START_FEN } from "../frontend-src/apps/chess-model";
import { createSourceTranslate } from "../frontend-src/i18n/translate";

// Only transport is replaced. These are the same screens/canvas built by source-app.
const commands: any[] = [], strokes: any[] = [];
const sounds: string[] = [];
let loops = 0;
let capture: (() => any) | null = null;
let revisions = 0;
const chessInitial = { settings: { playerSide: "white", difficulty: "casual" }, gameState: null, tutorial: null, drawOffer: null, takebackRequest: null };
const pictInitial = { settings: { sessionDurationMs: 180000, inferenceMode: "fast", locale: "en" }, gameState: null };
function controller(initial: any) {
  let snapshot = { state: initial, mounted: true, pending: false, error: null, presenting: false, connected: true };
  const listeners = new Set<() => void>();
  let presenter: ((previous: any, next: any, signal: AbortSignal) => Promise<void>) | null = null;
  let abort = new AbortController();
  const publish = (patch: any) => { snapshot = { ...snapshot, ...patch }; listeners.forEach(listener => listener()); };
  return {
    snapshot: () => snapshot,
    subscribe: (listener: () => void) => { listeners.add(listener); return () => listeners.delete(listener); },
    retain: () => () => {},
    ensureMounted: async () => true,
    dispatch: async (command: any) => { commands.push(command); return true; },
    setTransitionPresenter(value: typeof presenter) { presenter = value; return () => { abort.abort(); presenter = null; }; },
    connection(connected: boolean) { publish({ connected }); },
    set(state: any) { abort.abort(); abort = new AbortController(); publish({ state, presenting: false }); },
    async transition(state: any) {
      const signal = abort.signal;
      publish({ presenting: true });
      await presenter?.(snapshot.state, state, signal);
      if (!signal.aborted) publish({ state, presenting: false });
    },
  };
}
const chess = controller(chessInitial), pictionary = controller(pictInitial);
const codenamesInitial = { counterpartSide: "A", agentSide: "B", settings: { tokens: 9, wordLocale: "en" }, tutorial: null, gameState: null };
const codenames = controller(codenamesInitial);
function codenamesGame(guessing = false) {
  return { ...codenamesInitial, gameState: {
    board: Array.from({ length: 25 }, (_, index) => ({ text: index === 0 ? "MOON" : "WORD" + index })),
    key: { A: Array(25).fill("AGENT"), B: Array(25).fill("AGENT") },
    cells: Array.from({ length: 25 }, () => ({ solvedBy: null, assassinatedBy: null, bystanderMarks: [null, null] })),
    tokensRemaining: 9, whoseTurnToGive: guessing ? "B" : "A", phase: "NORMAL", winner: null,
    history: guessing ? [{ clueGiver: "B", clue: { word: "NIGHT", count: 2 }, guesses: [], endedBy: null }] : [],
  } };
}
function round(id = "one", drawer = "player") {
  return { ...pictInitial, gameState: { phase: "PLAYING", score: { solved: 0, skipped: 0 }, history: [],
    round: { roundId: id, startedAtMs: Date.now(), word: "apple", drawingId: "apple", roles: { drawer, guesser: drawer === "player" ? "agent" : "player" }, status: "active", noriRedrawEpoch: 0 } } };
}
const drawing = { setCapture(value: typeof capture) { capture = value; }, submit(stroke: any) { strokes.push(stroke); }, changed() { revisions++; } };
Object.assign(window, { fixture: {
  commands, strokes, sounds,
  loops: () => loops,
  codenames(guessing = false) { codenames.set(codenamesGame(guessing)); },
  codenamesTutorial(step: string) { codenames.set({ ...codenamesGame(true), tutorial: { step } }); },
  revealCodenames(cell = 0, type = "agent") {
    const state = structuredClone(codenames.snapshot().state);
    if (type === "bystander") state.gameState.cells[cell].bystanderMarks[0] = "A";
    else state.gameState.cells[cell][type === "agent" ? "solvedBy" : "assassinatedBy"] = "A";
    void codenames.transition(state);
  },
  snapshot: () => capture?.(),
  revisions: () => revisions,
  chess(fen = CHESS_START_FEN) { chess.set({ ...chessInitial, gameState: { fen, startFen: fen, turn: "white", status: "playing", winner: null, moveHistory: [] } }); },
  round(id?: string, drawer?: string) { pictionary.set(round(id, drawer)); },
  pictionaryState: () => pictionary.snapshot().state,
  setPictionary(state: any) { pictionary.set(state); },
  pictionaryConnection(connected: boolean) { pictionary.connection(connected); },
} });
const pict = location.hash === "#pictionary";
createRoot(document.getElementById("root")!).render(location.hash === "#codenames" ? <CodenamesApp controller={codenames as any} translate={createSourceTranslate("en")} playSound={cue => sounds.push(cue)} /> : pict
  ? <PictionaryScreen controller={pictionary as any} drawing={drawing as any} locale="en" playSound={cue => sounds.push(cue)}
      startSoundLoop={() => { loops++; let stopped = false; return () => { if (!stopped) { stopped = true; loops--; } }; }} />
  : <ChessScreen controller={chess as any} translate={createSourceTranslate("en")} />);
