import test from "node:test";
import assert from "node:assert/strict";
import type { ReactNode } from "react";
import { codenamesStateSchema, codenamesUiState } from "../../frontend-src/apps/codenames-model";
import { countRemainingCodenamesTargets, deriveCodenamesBoardCellEligibility } from "../../frontend-src/apps/codenames-board-presentation";
import { CodenamesKeyCard } from "../../frontend-src/screens/codenames-key-card";

function redactedGame() {
  return codenamesStateSchema.parse({
    counterpartSide: "A", agentSide: "B", settings: { tokens: 9, wordLocale: "en" }, tutorial: null,
    gameState: {
      board: Array.from({ length: 25 }, (_, index) => ({ text: "WORD" + index })),
      key: { A: Array(25).fill("AGENT"), B: Array(25).fill(null) },
      remainingTargets: { A: 2, B: 3 },
      cells: Array.from({ length: 25 }, () => ({ solvedBy: null, assassinatedBy: null, bystanderMarks: [null, null] })),
      tokensRemaining: 0, whoseTurnToGive: "A", phase: "SUDDEN_DEATH", winner: null, history: [],
    },
  }).gameState!;
}

test("Redacted keys use public counts for the header and sudden-death eligibility", () => {
  const game = redactedGame();
  assert.deepEqual(countRemainingCodenamesTargets(game), { A: 2, B: 3, total: 5 });
  assert.equal(codenamesUiState(game, "A").type, "SUDDEN_DEATH_BOTH");
  game.remainingTargets!.A = 0;
  assert.equal(codenamesUiState(game, "A").type, "SUDDEN_DEATH_HUMAN_TURN");
  game.remainingTargets = { A: 2, B: 0 };
  assert.equal(codenamesUiState(game, "A").type, "SUDDEN_DEATH_AI_TURN");
  game.phase = "GAME_OVER";
  assert.equal(codenamesUiState(game, "A").type, "GAME_OVER");
});

test("Unknown key roles are hidden, not bystanders or selectable targets", () => {
  const game = redactedGame();
  const input = { index: 0, uiStateType: "HUMAN_GIVING_CLUE", counterpartSide: "A" as const,
    counterpartRole: game.key.A[0], tutorialGuessCell: null, cell: game.cells[0] };
  assert.equal(deriveCodenamesBoardCellEligibility(input).canSelect, true);
  assert.equal(deriveCodenamesBoardCellEligibility({ ...input, counterpartRole: null }).canSelect, false);
  // The key card has no hooks, so its element tree can be inspected without react-dom
  // (whose server renderer keeps node's test process alive).
  const render = (CodenamesKeyCard as unknown as { type: (props: object) => ReactNode }).type;
  const roles: unknown[] = [];
  const walk = (node: unknown): void => {
    if (Array.isArray(node)) return node.forEach(walk);
    if (!node || typeof node !== "object" || !("props" in node)) return;
    const props = (node as { props: Record<string, unknown> }).props;
    if ("data-codenames-key-role" in props) roles.push(props["data-codenames-key-role"]);
    walk(props.children);
  };
  walk(render({ keySide: game.key.B, label: "Hidden key", active: true }));
  assert.equal(roles.length, 25);
  assert.ok(roles.every(role => role === "HIDDEN"));
});
