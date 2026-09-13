import type { MotionStep } from "./engine.js";
export type NoriIdleState = "idle" | "glitch" | "kneel" | "kneelCalm";
const motions: Record<NoriIdleState | "sleep", MotionStep> = {
  idle: { group: "Idle", index: 0 },
  sleep: { group: "Idle", index: 1 },
  glitch: { group: "Effects", index: 0 },
  kneel: { group: "Poses", index: 0 },
  kneelCalm: { group: "Poses", index: 1 },
};
export function noriIdleFromFacts(facts: ReadonlySet<string>): NoriIdleState {
  if (facts.has("arg.manifold_unlocked"))
    return facts.has("arg.finale.shown") ? "idle" : "kneelCalm";
  if (facts.has("arg.memory.shown")) return "kneel";
  if (
    !facts.has("virus.cleared") &&
    [1, 2, 3].every((index) => facts.has(`corrupt.doc${index}.read`))
  )
    return "glitch";
  return "idle";
}
export class NoriIdleController {
  private lastActivity: number;
  private current: NoriIdleState | "sleep" | null = null;
  constructor(
    private play: (step: MotionStep, sleeping: boolean) => void,
    private now = () => performance.now(),
  ) {
    this.lastActivity = now();
  }
  activity() {
    this.lastActivity = this.now();
  }
  update(
    state: NoriIdleState,
    forcedSleep: boolean,
    amplitude: number,
    blocked: boolean,
  ) {
    if (state !== "idle" || amplitude > 0.01 || blocked) this.activity();
    const next =
      forcedSleep || this.now() - this.lastActivity > 15000 ? "sleep" : state;
    if (next !== this.current) {
      this.current = next;
      this.play(
        {
          ...motions[next],
          loop: true,
          fadeIn:
            next === "sleep"
              ? forcedSleep
                ? 1.5
                : 10
              : next === "idle"
                ? 5
                : undefined,
        },
        next === "sleep",
      );
    }
    return next;
  }
}
const blends: Readonly<Record<string, number>> = {
  "07_Smile": 1,
  "10_Doubt": 0.45,
  "11_Disgust": 0.65,
};
export function noriLipExpressionBlend(expressions: readonly string[]) {
  return expressions.length
    ? expressions.reduce(
        (sum, expression) => sum + (blends[expression] ?? 0.5),
        0,
      ) / expressions.length
    : 1;
}
