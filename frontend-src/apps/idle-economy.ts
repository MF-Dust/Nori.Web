import type {
  IdleBuyCount,
  IdleGeneratorDefinition,
  IdleRunPresentationState,
} from "./idle";

/**
 * Ownership milestones used by the shipped Idle shop's `smart` buy mode.
 * `smart` buys exactly enough generators to reach the next milestone, capped
 * by the amount the current compute balance can afford.
 */
export const IDLE_SMART_BUY_THRESHOLDS = [
  5,
  25,
  75,
  150,
  200,
  300,
  400,
  500,
  600,
  700,
  800,
  900,
  1_000,
] as const;

export type IdleCostMultiplierResolver = (
  generator: IdleGeneratorDefinition,
  state: IdleRunPresentationState,
) => number | undefined;

export function getIdleSmartBuyCount(owned: number): number {
  const next = IDLE_SMART_BUY_THRESHOLDS.find((threshold) => threshold > owned);
  return next == null ? 1 : next - owned;
}

/**
 * The shipped runtime allows story/runtime formulas to override a generator's
 * cost multiplier, then clamps the effective multiplier to at least 1.01.
 */
export function getIdleGeneratorCostMultiplier(
  generator: IdleGeneratorDefinition,
  state: IdleRunPresentationState,
  resolveCostMultiplier?: IdleCostMultiplierResolver,
): number {
  const resolved = resolveCostMultiplier?.(generator, state);
  return Math.max(1.01, resolved ?? generator.costMult);
}

/** Exact geometric-series purchase cost used by the shipped Idle runtime. */
export function getIdleGeneratorTotalCost(
  generator: IdleGeneratorDefinition,
  owned: number,
  count: number,
  state: IdleRunPresentationState,
  resolveCostMultiplier?: IdleCostMultiplierResolver,
): number {
  if (count <= 0) return 0;
  const multiplier = getIdleGeneratorCostMultiplier(
    generator,
    state,
    resolveCostMultiplier,
  );
  return (
    generator.baseCost *
    multiplier ** owned *
    (multiplier ** count - 1) /
    (multiplier - 1)
  );
}

/**
 * Closed-form maximum affordable count recovered from the shipped store. This
 * avoids iterative scans for `max` purchases and matches the public bundle's
 * logarithmic calculation.
 */
export function getIdleMaxAffordableGeneratorCount(
  generator: IdleGeneratorDefinition,
  owned: number,
  compute: number,
  state: IdleRunPresentationState,
  resolveCostMultiplier?: IdleCostMultiplierResolver,
): number {
  if (compute <= 0) return 0;
  const multiplier = getIdleGeneratorCostMultiplier(
    generator,
    state,
    resolveCostMultiplier,
  );
  const scaled =
    (compute * (multiplier - 1)) /
    (generator.baseCost * multiplier ** owned);
  if (scaled <= 0) return 0;
  const affordable = Math.floor(Math.log(1 + scaled) / Math.log(multiplier));
  return Math.max(0, affordable);
}

/** Resolve a UI buy mode to the exact count the shipped store will purchase. */
export function resolveIdleGeneratorBuyCount(
  generator: IdleGeneratorDefinition,
  owned: number,
  compute: number,
  mode: IdleBuyCount,
  state: IdleRunPresentationState,
  resolveCostMultiplier?: IdleCostMultiplierResolver,
): number {
  const affordable = getIdleMaxAffordableGeneratorCount(
    generator,
    owned,
    compute,
    state,
    resolveCostMultiplier,
  );

  if (mode === "max") return affordable;
  if (mode === "smart") return Math.min(getIdleSmartBuyCount(owned), affordable);
  return affordable >= mode ? mode : 0;
}

/** Shipped generator visibility rule for alignment-specific and universal rows. */
export function isIdleGeneratorVisible(
  generator: IdleGeneratorDefinition,
  state: IdleRunPresentationState,
): boolean {
  if (generator.alignment !== "universal") {
    return generator.alignment === state.currentAlignment;
  }
  return state.currentAlignment !== null || !generator.dynamicRate;
}

/**
 * Marginal-growth ribbon phase, ported verbatim from the shipped Idle chunk
 * (`IdleScreen-DCDB640k.js:3094` phase memo). Logarithmic in owned counts, so
 * it is already 0.038 at one of each generator and saturates once the weighted
 * log total passes `kRef`.
 */
export function getIdleMarginalGrowthPhase(input: {
  generators: readonly IdleGeneratorDefinition[];
  owned: Readonly<Record<string, number>>;
  kRef: number;
  exponent: number;
}): number {
  if (input.kRef <= 0) return 0;
  let weighted = 0;
  for (const generator of input.generators) {
    weighted +=
      generator.growthWeight * Math.log(1 + (input.owned[generator.id] ?? 0));
  }
  const raw = Math.max(0, Math.min(1, weighted / input.kRef));
  return input.exponent === 1
    ? raw
    : 1 - (1 - raw) ** Math.max(0.01, input.exponent);
}

/**
 * Ribbon step count for a phase, ported from the shipped owned-mode effect
 * (`IdleScreen-DCDB640k.js:3195`): a clamped `stepOffset` floor plus the
 * remaining span, so the ribbon is never empty.
 */
export function getIdleMarginalGrowthSteps(input: {
  phase: number;
  stepOffset: number;
  maxSteps: number;
}): number {
  const maxSteps = Math.max(1, input.maxSteps);
  const stepOffset = Math.max(0, Math.min(input.stepOffset, maxSteps - 1));
  const phase = Math.max(0, Math.min(1, input.phase));
  return stepOffset + phase * (maxSteps - stepOffset);
}

/** Active skill buffs multiply a generator's effective per-unit rate. */
export function getIdleActiveGeneratorMultiplier(
  generatorId: string,
  state: IdleRunPresentationState,
): number {
  let multiplier = 1;
  for (const buff of state.activeSkillBuffs) {
    if (
      buff.targetGenId === generatorId &&
      typeof buff.magnitude === "number" &&
      buff.magnitude !== 0
    ) {
      multiplier *= buff.magnitude;
    }
  }
  return multiplier;
}
