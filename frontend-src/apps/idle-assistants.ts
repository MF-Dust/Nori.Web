import { IDLE_MANIFOLD_UNLOCKED_FACT } from "./idle";

export interface IdleAssistantFormulaState {
  threads: number;
  upgrades: Readonly<Record<string, boolean>>;
  facts: Readonly<Record<string, boolean>>;
  owned: Readonly<Record<string, number>>;
  lifetimeMaxOwned: Readonly<Record<string, number>>;
  heritagesPurchased: Readonly<Record<string, boolean>>;
}

export interface IdleRemainderAdvance {
  whole: number;
  remainder: number;
}

/** Shipped `Ar.hellPortal` alias used by the Demonic assistant-count curve. */
export const IDLE_HELL_PORTAL_GENERATOR_ID = "terminal_lockdown";

/**
 * Exact source-owned form of the shipped generic effect-curve evaluator for the
 * two assistant-count rows used by the Nori Idle pack.
 */
export function idleAssistantCurve(
  kind: "poly" | "log",
  value: number,
  params: { base: number; coeff: number; exp: number; inner?: number },
): number {
  const input = Math.max(0, value);
  if (kind === "poly") return params.base + params.coeff * input ** params.exp;
  return params.base + params.coeff * ((params.inner ?? 1) * Math.log(1 + input)) ** params.exp;
}

/**
 * Shipped effective-assistant count (`o1`). The Nori pack has two additive
 * assistant-count effects and a no-op custom multiplier. Manifold mode forces
 * assistants to zero regardless of stored thread count.
 */
export function idleEffectiveAssistantCount(state: IdleAssistantFormulaState): number {
  if (state.facts[IDLE_MANIFOLD_UNLOCKED_FACT]) return 0;

  let bonus = 0;
  if (state.upgrades.fu_goblin_strong_currency) {
    const totalBuildings = Object.values(state.owned).reduce(
      (sum, count) => sum + Math.max(0, count ?? 0),
      0,
    );
    bonus += idleAssistantCurve("log", totalBuildings, {
      base: 0,
      coeff: 8,
      exp: 1.5,
      inner: 1,
    });
  }

  if (state.upgrades.fu_demon_burning_legion) {
    const hellPortalPeak = Math.max(0, state.lifetimeMaxOwned[IDLE_HELL_PORTAL_GENERATOR_ID] ?? 0);
    bonus += idleAssistantCurve("poly", hellPortalPeak, {
      base: 6,
      coeff: 1.6,
      exp: 0.6,
      inner: 1,
    });
  }

  return Math.floor(Math.max(0, state.threads + bonus));
}

/**
 * Shipped autoclick-rate formula (`nRe`). The Nori pack's custom upgrade hook
 * returns zero, so only Elven Heritage contributes one automatic click/second.
 */
export function idleAutoclicksPerSecond(
  state: Pick<IdleAssistantFormulaState, "heritagesPurchased">,
): number {
  return state.heritagesPurchased.elven ? 1 : 0;
}

/** Exact fractional accumulator used by the shipped automatic-click tick. */
export function advanceIdleAutoclickRemainder(
  remainder: number,
  clicksPerSecond: number,
  elapsedSeconds: number,
): IdleRemainderAdvance {
  const accumulated = Math.max(0, remainder + Math.max(0, clicksPerSecond) * Math.max(0, elapsedSeconds));
  const whole = Math.floor(accumulated);
  return { whole, remainder: accumulated - whole };
}

/**
 * Assistants tick on whole elapsed seconds. The shipped path keeps sub-second
 * time in a separate remainder and performs `assistantCount * wholeSeconds`
 * assistant actions at once.
 */
export function advanceIdleAssistantSecondRemainder(
  remainderSeconds: number,
  elapsedSeconds: number,
): IdleRemainderAdvance {
  const accumulated = Math.max(0, remainderSeconds + Math.max(0, elapsedSeconds));
  const whole = Math.floor(accumulated);
  return { whole, remainder: accumulated - whole };
}

/**
 * Nori's shipped assistant production multiplier table is empty and the
 * assistant-upgrade CSV has no rows, leaving the baseline multiplier at 1.
 * Each assistant action therefore grants exactly 5% of the current click reward.
 */
export function idleAssistantComputeGain(
  assistantCount: number,
  wholeSeconds: number,
  clickReward: number,
): number {
  return Math.max(0, assistantCount) * Math.max(0, wholeSeconds) * 0.05 * Math.max(0, clickReward);
}
