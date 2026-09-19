import { useEffect, useRef } from "react";
import type { PictionaryGame } from "../apps/pictionary-model";

export function usePictionarySounds(game: PictionaryGame | null | undefined, remaining: number, nextRoundAt: number | null, now: number, playSound?: (cue: string) => void) {
  const latest = useRef(playSound); latest.current = playSound;
  const previous = useRef<{ roundId: string; status: string; guess: string } | null>(null);
  const round = game?.round;
  const lastGuess = round?.lastGuess;
  const guess = lastGuess ? JSON.stringify([lastGuess.by, lastGuess.text.trim().toLowerCase()]) : "";
  useEffect(() => {
    const before = previous.current;
    previous.current = round ? { roundId: round.roundId, status: round.status, guess } : null;
    // Mounting an existing game is a baseline, not a replay of old result sounds.
    if (!round || before?.roundId !== round.roundId) return;
    if (round.status !== before.status) {
      if (round.status === "solved") latest.current?.("partygames-pictionary-correct-answer");
      if (round.status === "skipped") latest.current?.("partygames-pictionary-skip-round");
    }
    if (guess && guess !== before.guess && !round.lastGuess?.correct) latest.current?.("partygames-pictionary-wrong-guess");
  }, [round?.roundId, round?.status, guess]);
  const countdown = nextRoundAt === null || nextRoundAt <= now ? null : Math.ceil((nextRoundAt - now) / 1000);
  const previousCountdown = useRef<{ roundId?: string; value: number | null }>({ value: null });
  useEffect(() => {
    const before = previousCountdown.current;
    previousCountdown.current = { roundId: round?.roundId, value: countdown };
    if (before.roundId === round?.roundId && before.value !== null && countdown !== null && countdown < before.value)
      latest.current?.("partygames-pictionary-next-round-countdown");
  }, [round?.roundId, countdown]);
  const low = game?.phase === "PLAYING" && round?.status === "active" && remaining > 0 && remaining < 30000;
  useEffect(() => {
    if (!low) return;
    const timer = setInterval(() => latest.current?.("partygames-pictionary-timer-low"), 1000);
    return () => clearInterval(timer);
  }, [low, round?.roundId]);
}
