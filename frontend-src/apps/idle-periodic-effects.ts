export const IDLE_GREEN_FINGERS_UPGRADE_ID = "fu_goblin_green_fingers_discount";
export const IDLE_GREEN_FINGERS_COOLDOWN_SEC = 120;

export interface IdlePeriodicLumpAdvance {
  triggerCount: number;
  remainderSeconds: number;
}

/**
 * Exact source-owned form of the shipped periodic-lump cooldown accumulator.
 * Each owned periodic lump keeps its own elapsed remainder and may fire more
 * than once when a long tick crosses multiple cooldown boundaries.
 */
export function advanceIdlePeriodicLumpCooldown(
  remainderSeconds: number,
  elapsedSeconds: number,
  cooldownSeconds = IDLE_GREEN_FINGERS_COOLDOWN_SEC,
): IdlePeriodicLumpAdvance {
  let remainder = Math.max(0, remainderSeconds) + Math.max(0, elapsedSeconds);
  let triggerCount = 0;
  const cooldown = Math.max(Number.EPSILON, cooldownSeconds);
  while (remainder >= cooldown) {
    remainder -= cooldown;
    triggerCount += 1;
  }
  return { triggerCount, remainderSeconds: remainder };
}

/**
 * Shipped `fu_goblin_green_fingers_discount` grant:
 * `(1 + 1499 * rng()) * (generatorRate + assistantProductionRate)` per trigger.
 * The rate snapshot is shared across all triggers in the same tick while each
 * trigger receives its own independent random multiplier.
 */
export function idleGreenFingersGrant(
  triggerCount: number,
  generatorRate: number,
  assistantProductionRate: number,
  random: () => number = Math.random,
): number {
  const rate = generatorRate + assistantProductionRate;
  let grant = 0;
  for (let index = 0; index < Math.max(0, Math.floor(triggerCount)); index += 1) {
    grant += (1 + 1499 * random()) * rate;
  }
  return grant;
}
