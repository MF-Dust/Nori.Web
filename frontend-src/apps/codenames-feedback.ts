import type { CodenamesState } from "./codenames-model";
import type { NoriReactionMap } from "../live2d/reaction-director";

/** Shipped MPe event semantics, applied only to newly presented transitions. */
export class CodenamesFeedback {
  private previous: CodenamesState | null = null;
  reset() { this.previous = null; }
  observe(next: CodenamesState | null): NoriReactionMap["codenames"][] {
    const previous = this.previous;
    this.previous = next;
    const old = previous?.gameState, game = next?.gameState;
    if (!old || !game || !next || old.board.some((cell, i) => cell.text !== game.board[i]?.text)) return [];
    const reactions: NoriReactionMap["codenames"][] = [];
    game.history.forEach((turn, index) => {
      const oldTurn = old.history[index];
      const start = oldTurn?.clue.word === turn.clue.word ? oldTurn.guesses.length : 0;
      let streak = 0;
      turn.guesses.forEach((guess, guessIndex) => {
        streak = guess.result === "AGENT" ? streak + 1 : 0;
        if (guessIndex < start) return;
        if (guess.result === "ASSASSIN") reactions.push("assassin");
        else if (turn.clueGiver === next.counterpartSide) reactions.push(guess.result === "AGENT" ? streak >= 2 ? "guessStreak" : "guessAlly" : "guessBystander");
        else if (guess.result === "BYSTANDER") reactions.push("herClueMissed");
      });
    });
    if (old.phase !== "GAME_OVER" && game.phase === "GAME_OVER") reactions.push(game.winner === "TEAM" ? "win" : "loss");
    return reactions;
  }
}
