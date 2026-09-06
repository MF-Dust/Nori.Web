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
