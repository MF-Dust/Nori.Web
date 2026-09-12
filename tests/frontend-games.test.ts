import test from "node:test";
import assert from "node:assert/strict";
import { Chess } from "chess.js";
import { CHESS_START_FEN, chessCaptures, chessHistory, chessLayout, legalChessMoves } from "../frontend-src/apps/chess-model";
import { chooseDrawingSample, drawingSampleStrokes, normalizeDrawingStroke, pictionaryElapsed, pictionaryNextRoundAt, pictionaryStateSchema, pictionarySummary } from "../frontend-src/apps/pictionary-model";
import { GameCartridgeController } from "../frontend-src/apps/game-cartridge-controller";
import { PictionaryDrawingBridge } from "../frontend-src/apps/pictionary-runtime";
import { WorldStore } from "../frontend-src/runtime/world-store";

test("Chess legality handles pins, en passant, castling and all promotions", () => {
  assert.deepEqual(legalChessMoves(CHESS_START_FEN, "e2").map(move => move.to), ["e3", "e4"]);
  assert.equal(legalChessMoves("4r1k1/8/8/8/8/8/4R3/4K3 w - - 0 1", "e2").some(move => move.to === "d2"), false);
  assert.ok(legalChessMoves("4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 1", "e5").some(move => move.to === "d6" && move.isEnPassant()));
  assert.ok(legalChessMoves("r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1", "e1").some(move => move.to === "g1"));
  assert.deepEqual(legalChessMoves("4k3/P7/8/8/8/8/8/4K3 w - - 0 1", "a7").map(move => move.promotion).sort(), ["b", "n", "q", "r"]);
});
test("History review replays the original position without mutating the replicated history", () => {
  const moves = [{ by: "white" as const, move: { from: "e2", to: "e4" } }, { by: "black" as const, move: { from: "d7", to: "d5" } }, { by: "white" as const, move: { from: "e4", to: "d5" }, captured: "p" }];
  const original = structuredClone(moves);
  const history = chessHistory(CHESS_START_FEN, moves);
  assert.deepEqual(history.san, ["e4", "d5", "exd5"]);
  assert.equal(history.fens.length, 4);
  assert.equal(new Chess(history.fens[1]).get("e4")?.type, "p");
  assert.equal(chessCaptures(moves, "white").advantage, 1);
  assert.equal(chessCaptures(moves, "black").advantage, -1);
  assert.deepEqual(moves, original);
  assert.deepEqual(chessLayout(1100, 720), { board: 560, rail: 280, compact: false });
  assert.equal(chessLayout(550, 420).compact, true);
});
function state(status: "active" | "solved" | "skipped" = "active") {
  return pictionaryStateSchema.parse({
    settings: { sessionDurationMs: 180000, inferenceMode: "fast", locale: "en" },
    gameState: { phase: "PLAYING", score: { solved: 0, skipped: 0 }, history: [],
      round: { roundId: "one", startedAtMs: 1000, word: "apple", drawingId: "apple", roles: { drawer: "player", guesser: "agent" }, status, noriRedrawEpoch: 0 } },
  });
}
test("Session clock excludes the five-second intermission and unfinished guesses from accuracy", () => {
  const value = state(); const game = value.gameState!;
  assert.equal(pictionaryElapsed(game, 11000), 10000);
  assert.equal(pictionaryElapsed(game, 500), 0);
  game.round.status = "solved"; game.round.solvedAtMs = 11000;
  game.history.push({ word: "apple", roles: game.round.roles, elapsedMs: 10000, outcome: "solved" });
  assert.equal(pictionaryElapsed(game, 16000), 10000);
  assert.equal(pictionaryNextRoundAt(game), 16000);
  game.history.push({ word: "cat", roles: game.round.roles, elapsedMs: 3000, outcome: "unfinished" });
  assert.equal(pictionarySummary(game).accuracy, 100);
  assert.equal(pictionarySummary(game).unfinished, 1);
  assert.equal(pictionarySummary(game).durationMs, 13000);
});
test("Stroke payloads respect the 128-point normalized protocol and drawing sample bounds", () => {
  const points = Array.from({ length: 1000 }, (_, index) => ({ x: index, y: -index }));
  const stroke = normalizeDrawingStroke(points, 100, 100, "#363636", 6)!;
  assert.ok(stroke.points.length <= 128 && stroke.points.length >= 2);
  assert.ok(stroke.points.every(point => point.x >= 0 && point.x <= 1 && point.y === 0));
  assert.equal(normalizeDrawingStroke([{ x: 0, y: 0 }], 10, 10, "#000", 6), null);
  const sample: [number[], number[]][] = [[[0, 128, 255], [255, 128, 0]]];
  const strokes = drawingSampleStrokes(sample);
  assert.ok(strokes[0].points.every(point => point.x >= .16 - 1e-12 && point.x <= .84 + 1e-12 && point.y >= .16 - 1e-12 && point.y <= .84 + 1e-12));
  const used = new Set<number>();
  const index = { apple: [sample, [[[10, 20], [30, 40]]] as typeof sample] };
  const first = chooseDrawingSample(index, "Apple", used, () => 0);
  const second = chooseDrawingSample(index, "Apple", used, () => 0);
  assert.notEqual(first, second);
  assert.equal(used.size, 2);
});
function harness() {
  const world = new WorldStore();
  const stateListeners = new Set<(state: string) => void>();
  const eventListeners = new Set<(message: any) => void>();
  let serial = 0;
  const sent: any[] = [];
  const arcade = {
    connectionState: "open", onState(listener: any) { stateListeners.add(listener); listener("open"); return () => stateListeners.delete(listener); },
    onMessage(listener: any) { eventListeners.add(listener); return () => eventListeners.delete(listener); },
    send(message: any) { sent.push(message); },
    sendEvent(channel: string, payload: any, extra: any) { sent.push({ channel, payload, ...extra }); return "event"; },
  };
  const games = { mount(game: string) { const id = "mount-" + ++serial; sent.push({ type: "mount", game, id }); return id; },
    unmount(game: string) { sent.push({ type: "unmount", game }); return "unmount"; },
    dispatch(game: string, command: any) { const id = "dispatch-" + ++serial; sent.push({ type: "dispatch", game, command, id }); return id; } };
  const emit = (message: any) => { world.consume(message); eventListeners.forEach(listener => listener(message)); };
  emit({ type: "world_joined", world: { worldId: "world", mountedCartridges: [] } });
  const controller = new GameCartridgeController("pictionary", games as any, world, arcade as any, raw => pictionaryStateSchema.parse(raw));
  const mount = (value = state()) => emit({ type: "cartridge_mounted", cartridgeId: "pictionary", requestId: sent.find(item => item.type === "mount")?.id,
    runtimes: [{ visibilityFenceId: "ui", headVersion: 0, visibleVersion: 0, state: value }] });
  return { world, arcade, sent, emit, controller, mount, stateListeners };
}
test("Controller correlates acks, blocks duplicate commands and cleans up on window release", async () => {
  const h = harness(), release = h.controller.retain();
  h.mount(); assert.equal(h.controller.snapshot().mounted, true);
  const action = h.controller.dispatch({ type: "skipRound", atMs: 1000 });
  const request = h.sent.at(-1);
  assert.equal(await h.controller.dispatch({ type: "skipRound", atMs: 1000 }), false);
  h.emit({ type: "dispatch_ack", cartridgeId: "pictionary", requestId: "unrelated", success: true });
  assert.equal(h.controller.snapshot().pending, true);
  h.emit({ type: "dispatch_ack", cartridgeId: "pictionary", requestId: request.id, success: false, error: "Round is still active" });
  assert.equal(await action, false);
  assert.match(h.controller.snapshot().error!, /Round/);
  release(); await Promise.resolve();
  assert.equal(h.sent.at(-1).type, "unmount");
  h.controller.dispose();
  assert.equal(h.stateListeners.size, 0);
});
test("Old round stroke queues are discarded and snapshots retain the request ID", async () => {
  const h = harness(), release = h.controller.retain();
  const bridge = new PictionaryDrawingBridge(h.controller, h.arcade as any);
  h.mount();
  bridge.setCapture(() => ({ revision: 1, image: "base64", width: 256, height: 128 }));
  h.emit({ type: "event", channel: "pictionary.snapshot.request", requestId: "snapshot-id", cartridgeId: "pictionary", payload: { roundId: "one" } });
  assert.equal(h.sent.at(-1).requestId, "snapshot-id");
  assert.equal(h.sent.at(-1).channel, "pictionary.snapshot");
  const stroke = { points: [{ x: 0, y: 0 }, { x: 1, y: 1 }], color: "#000", width: 6 };
  bridge.submit(stroke); bridge.submit(stroke);
  const request = h.sent.at(-1);
  const next = state(); next.gameState!.round.roundId = "two";
  h.emit({ type: "runtime_transition", cartridgeId: "pictionary", version: 1, transition: { patches: [{ op: "replace", path: "/gameState", value: next.gameState }], events: [] } });
  h.emit({ type: "dispatch_ack", cartridgeId: "pictionary", requestId: request.id, success: true });
  await Promise.resolve(); await Promise.resolve();
  assert.equal(h.sent.filter(item => item.type === "dispatch").length, 1);
  bridge.dispose(); release(); h.controller.dispose();
});
 
import { createSourceTranslate } from "../frontend-src/i18n/translate";
test("Recovered translations render shipped labels and interpolate values as text", () => {
  const t = createSourceTranslate("zh-HK");
  assert.equal(t("chess.title"), "与 Nori 下棋");
  assert.equal(createSourceTranslate("en")("chess.start.elo", { elo: 700 }), "700 ELO");
  assert.equal(t("unknown.key"), "unknown.key");
});
