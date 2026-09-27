import test from "node:test";
import assert from "node:assert/strict";
import { StoryDirector } from "../../frontend-src/story/story-director";
import { ChessFeedback } from "../../frontend-src/apps/chess-feedback";
import {
  chessStateSchema,
  CHESS_START_FEN,
} from "../../frontend-src/apps/chess-model";
const settle = async () => {
  await Promise.resolve();
  await Promise.resolve();
};
test("same-ID world replacement invalidates scene instances and pending completion", async (context) => {
  context.mock.timers.enable({ apis: ["setTimeout"] });
  const accepts: Array<() => void> = [];
  const director = new StoryDirector(
    new Set(["cult-flash"]),
    () => new Promise<void>((resolve) => accepts.push(resolve)),
  );
  const facts = new Set(["cult.unpacked"]);
  director.sync("same", facts);
  const previous = director.snapshot()!;
  director.complete(previous);
  director.sync("same", facts, true);
  const current = director.snapshot()!;
  assert.notEqual(previous.instance, current.instance);
  director.complete(previous);
  assert.equal(
    accepts.length,
    1,
    "a stale renderer cannot finish the replacement",
  );
  accepts[0]();
  await settle();
  context.mock.timers.tick(5000);
  assert.equal(director.snapshot(), current);
  director.complete(current);
  assert.equal(accepts.length, 2);
  accepts[1]();
  await settle();
  context.mock.timers.tick(1500);
  assert.equal(director.snapshot(), null);
  director.dispose();
});

test("replacement cancels completion retries even when the world ID is unchanged", async (context) => {
  context.mock.timers.enable({ apis: ["setTimeout"] });
  let calls = 0;
  const director = new StoryDirector(new Set(["cult-flash"]), async () => {
    calls++;
    throw Error("offline");
  });
  director.sync("same", new Set(["cult.unpacked"]));
  director.complete();
  await settle();
  director.sync("same", new Set(["cult.unpacked"]), true);
  context.mock.timers.tick(10000);
  assert.equal(calls, 1);
  assert.equal(director.snapshot()?.id, "cult-flash");
  director.dispose();
});
test("story priority preserves unrecovered scenes and completion waits for acknowledged sentinel", async (context) => {
  context.mock.timers.enable({ apis: ["setTimeout"] });
  let calls = 0,
    accept!: () => void;
  const director = new StoryDirector(new Set(["cult-flash"]), () => {
    calls++;
    return new Promise<void>((resolve) => {
      accept = resolve;
    });
  });
  director.sync("one", new Set(["session.ready", "cult.unpacked"]));
  assert.equal(director.snapshot(), null);
  director.sync(
    "one",
    new Set(["session.ready", "boot.completed", "cult.unpacked"]),
  );
  assert.equal(director.snapshot()?.id, "cult-flash");
  director.complete();
  director.complete();
  assert.equal(calls, 1);
  context.mock.timers.tick(10000);
  assert.equal(director.snapshot()?.id, "cult-flash");
  accept();
  await settle();
  context.mock.timers.tick(1499);
  assert.ok(director.snapshot());
  context.mock.timers.tick(1);
  assert.equal(director.snapshot(), null);
  director.sync("one", new Set(["cult.unpacked"]));
  assert.equal(director.snapshot(), null);
  director.dispose();
});
test("story retries after failure and discards acknowledgements from a previous world", async (context) => {
  context.mock.timers.enable({ apis: ["setTimeout"] });
  let calls = 0,
    accept!: () => void;
  const director = new StoryDirector(new Set(["cult-flash"]), async () => {
    if (++calls === 1) throw Error("offline");
    await new Promise<void>((resolve) => {
      accept = resolve;
    });
  });
  director.sync("one", new Set(["cult.unpacked"]));
  director.complete();
  await settle();
  context.mock.timers.tick(1999);
  assert.equal(calls, 1);
  context.mock.timers.tick(1);
  assert.equal(calls, 2);
  director.sync("two", new Set(["cult.unpacked"]));
  accept();
  await settle();
  context.mock.timers.tick(5000);
  assert.equal(director.snapshot()?.id, "cult-flash");
  director.dispose();
  context.mock.timers.tick(5000);
  assert.equal(calls, 2);
});
const state = () =>
  chessStateSchema.parse({
    settings: { playerSide: "white", difficulty: "casual" },
    gameState: {
      fen: CHESS_START_FEN,
      turn: "white",
      status: "playing",
      winner: null,
      moveHistory: [],
    },
  });
test("chess feedback delays checkmate sound, fences reconnects and avoids historical sounds", (context) => {
  context.mock.timers.enable({ apis: ["setTimeout"] });
  const sounds: string[] = [],
    feedback = new ChessFeedback(
      (sound) => sounds.push(sound),
      () => {},
    );
  const initial = state();
  feedback.update(initial, 0, true);
  const mate = structuredClone(initial);
  mate.gameState!.status = "checkmate";
  mate.gameState!.moveHistory.push({
    by: "white",
    move: { from: "d1", to: "h5" },
    isCheckmate: true,
  });
  feedback.update(mate, 0, true);
  assert.deepEqual(sounds, ["check"]);
  context.mock.timers.tick(199);
  assert.deepEqual(sounds, ["check"]);
  context.mock.timers.tick(1);
  assert.deepEqual(sounds, ["check", "gameEnd"]);
  feedback.update(initial, 1, true);
  feedback.update(mate, 1, true);
  feedback.update(mate, 2, false);
  context.mock.timers.tick(250);
  assert.deepEqual(sounds, ["check", "gameEnd", "check"]);
  feedback.update(mate, 2, true);
  assert.equal(sounds.length, 3);
  feedback.reset();
});
test("chess reports accepted or declined requests while local cancellation stays silent", () => {
  const notices: string[] = [],
    sounds: string[] = [],
    feedback = new ChessFeedback(
      (sound) => sounds.push(sound),
      (notice) => notices.push(notice),
    );
  const initial = state();
  initial.drawOffer = "white";
  feedback.update(initial, 0, true);
  const declined = structuredClone(initial);
  declined.drawOffer = null;
  feedback.update(declined, 0, true);
  assert.deepEqual(notices, ["noriDeclinedDraw"]);
  feedback.update(initial, 0, true);
  feedback.suppressCancellation("draw");
  feedback.update(declined, 0, true);
  assert.equal(notices.length, 1);
  const takeback = structuredClone(declined);
  takeback.takebackRequest = "white";
  takeback.gameState!.moveHistory.push({
    by: "white",
    move: { from: "e2", to: "e4" },
  });
  feedback.update(takeback, 0, true);
  feedback.update(declined, 0, true);
  assert.equal(notices.at(-1), "noriAcceptedTakeback");
  feedback.reset();
});
