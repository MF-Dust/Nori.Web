import { CodenamesApp } from "../frontend-src/screens/codenames-app";
import React from "react";
import { Chess } from "chess.js";
import { createRoot } from "react-dom/client";
import { ChessScreen } from "../frontend-src/screens/chess-screen";
import { PictionaryScreen } from "../frontend-src/screens/pictionary-screen";
import { CHESS_START_FEN, CHESS_TUTORIAL_STEPS } from "../frontend-src/apps/chess-model";
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
  pictionaryResults() {
    const state = round(); state.gameState.phase = "RESULTS";
    state.gameState.history = [
      { word: "apple", elapsedMs: 3000, outcome: "solved", roles: { drawer: "player", guesser: "agent" } },
      { word: "tree", elapsedMs: 5000, outcome: "skipped", roles: { drawer: "agent", guesser: "player" } },
      { word: "boat", elapsedMs: 2000, outcome: "unfinished", roles: { drawer: "player", guesser: "agent" } },
    ] as any;
    pictionary.set(state);
  },
  codenamesResults(win = true) {
    const state = codenamesGame(true);
    state.gameState.phase = "GAME_OVER";
    state.gameState.winner = (win ? "TEAM" : null) as any;
    state.gameState.key.A = Array.from({ length: 25 }, (_, i) => i < 15 ? "AGENT" : "BYSTANDER");
    state.gameState.key.B = [...state.gameState.key.A];
    state.gameState.cells.forEach((cell, i) => { if (i < (win ? 15 : 6)) cell.solvedBy = "A" as any; });
    if (!win) state.gameState.cells[20].assassinatedBy = "A" as any;
    state.gameState.tokensRemaining = 4;
    codenames.set(state);
  },
  codenames(guessing = false) { codenames.set(codenamesGame(guessing)); },
  codenamesTutorial(step: string) { codenames.set({ ...codenamesGame(true), tutorial: { step } }); },
  codenamesScenario(scenario: "sudden_death_both" | "sudden_death_counterpart_only" | "sudden_death_agent_only") {
    const state = codenamesGame(true);
    state.gameState.phase = "SUDDEN_DEATH"; state.gameState.tokensRemaining = 0;
    state.gameState.key.A = Array(25).fill("BYSTANDER"); state.gameState.key.B = Array(25).fill("BYSTANDER");
    state.gameState.key.A[0] = "AGENT"; state.gameState.key.B[1] = "AGENT";
    if (scenario === "sudden_death_counterpart_only") state.gameState.cells[0].solvedBy = "B" as any;
    if (scenario === "sudden_death_agent_only") state.gameState.cells[1].solvedBy = "A" as any;
    codenames.set(state);
  },
  revealCodenames(cell = 0, type = "agent") {
    const state = structuredClone(codenames.snapshot().state);
    if (type === "bystander") state.gameState.cells[cell].bystanderMarks[0] = "A";
    else state.gameState.cells[cell][type === "agent" ? "solvedBy" : "assassinatedBy"] = "A";
    void codenames.transition(state);
  },
  chessConnection(connected: boolean) { chess.connection(connected); },
  chessTutorial(index: number, override?: string) {
    const board = new Chess();
    const history = CHESS_TUTORIAL_STEPS.slice(0, index).map(step => {
      const move = board.move(step.move);
      return { by: move.color === "w" ? "white" : "black", move: step.move, san: move.san, captured: move.captured, isCheck: board.isCheck(), isCastling: move.isKingsideCastle() };
    });
    chess.set({ ...chessInitial, tutorial: { step: override ?? CHESS_TUTORIAL_STEPS[index]?.id ?? "free_play" },
      gameState: { fen: board.fen(), startFen: CHESS_START_FEN, turn: board.turn() === "w" ? "white" : "black", status: "playing", winner: null, isCheck: board.isCheck(), moveHistory: history } });
  },
  chessRequest(kind: "draw" | "takeback") {
    const state: any = { ...chessInitial, gameState: { fen: CHESS_START_FEN, startFen: CHESS_START_FEN, turn: "white", status: "playing", winner: null, isCheck: false, moveHistory: [] } };
    if (kind === "draw") state.drawOffer = "black"; else state.takebackRequest = "black";
    chess.set(state);
  },
  chessResults(winner: "white" | "black" | "draw" = "white") {
    chess.set({ ...chessInitial, gameState: { fen: CHESS_START_FEN, startFen: CHESS_START_FEN, turn: "white", status: winner === "draw" ? "draw" : "checkmate", winner,
      isCheck: winner !== "draw", moveHistory: [{ by: "white", move: { from: "e2", to: "e4" }, san: "e4", captured: null, isCheck: winner !== "draw", isCastling: false, isPromotion: false, isCheckmate: winner !== "draw" }] } });
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
  : <ChessScreen controller={chess as any} translate={createSourceTranslate(new URLSearchParams(location.search).get("locale") ?? "en")} />);
