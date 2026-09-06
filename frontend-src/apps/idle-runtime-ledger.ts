import type { IdleAlignment, IdleUpgradeDefinition } from "./idle";
import { IDLE_MANIFOLD_UNLOCKED_FACT } from "./idle";

export interface IdleRuntimeLedgerState {
  currentEraSeconds: number;
  skillCastsThisEra: number;
  productiveClicks: number;
  lifetimeProductiveClicks: number;
  automaticClicks: number;
  lifetimeAutomaticClicks: number;
  computeGainedByClicking: number;
  lifetimeComputeGainedByClicking: number;
  automaticClickRemainder: number;
  threads: number;
  assistantTickRemainderSec: number;
  factionCoinsFound: Readonly<Record<string, number>>;
  lifetimeFactionCoinsFound: Readonly<Record<string, number>>;
  totalFactionCoinsFound: number;
  lifetimeTotalFactionCoinsFound: number;
  factionCoinsFoundThisEra: number;
  factionCoinsFoundByClicking: number;
  lifetimeFactionCoinsFoundByClicking: number;
  alignmentSeconds: Readonly<Record<string, number>>;
  lifetimeAlignmentSeconds: Readonly<Record<string, number>>;
  factionSeconds: Readonly<Record<string, number>>;
  lifetimeFactionSeconds: Readonly<Record<string, number>>;
  maxOwnedThisRun: Readonly<Record<string, number>>;
  lifetimeMaxOwned: Readonly<Record<string, number>>;
  maxBuildingsThisEra: number;
  maxTotalBuildingsThisRun: number;
  lifetimeMaxTotalBuildings: number;
  longestSessionSeconds: number;
}

export type IdleFactionCoinSource = "productiveClick" | "automaticClick" | "assistant" | "spell";

export function createIdleRuntimeLedgerState(): IdleRuntimeLedgerState {
  return {
    currentEraSeconds: 0,
    skillCastsThisEra: 0,
    productiveClicks: 0,
    lifetimeProductiveClicks: 0,
    automaticClicks: 0,
    lifetimeAutomaticClicks: 0,
    computeGainedByClicking: 0,
    lifetimeComputeGainedByClicking: 0,
    automaticClickRemainder: 0,
    threads: 0,
    assistantTickRemainderSec: 0,
    factionCoinsFound: {},
    lifetimeFactionCoinsFound: {},
    totalFactionCoinsFound: 0,
    lifetimeTotalFactionCoinsFound: 0,
    factionCoinsFoundThisEra: 0,
    factionCoinsFoundByClicking: 0,
    lifetimeFactionCoinsFoundByClicking: 0,
    alignmentSeconds: {},
    lifetimeAlignmentSeconds: {},
    factionSeconds: {},
    lifetimeFactionSeconds: {},
    maxOwnedThisRun: {},
    lifetimeMaxOwned: {},
    maxBuildingsThisEra: 0,
    maxTotalBuildingsThisRun: 0,
    lifetimeMaxTotalBuildings: 0,
    longestSessionSeconds: 0,
  };
}

/** Lifetime fields preserved by the shipped retraining reset (`h$`). */
export function resetIdleRuntimeLedger(
  state: IdleRuntimeLedgerState,
): IdleRuntimeLedgerState {
  return {
    ...createIdleRuntimeLedgerState(),
    lifetimeProductiveClicks: state.lifetimeProductiveClicks,
    lifetimeAutomaticClicks: state.lifetimeAutomaticClicks,
    lifetimeComputeGainedByClicking: state.lifetimeComputeGainedByClicking,
    lifetimeFactionCoinsFound: state.lifetimeFactionCoinsFound,
    lifetimeTotalFactionCoinsFound: state.lifetimeTotalFactionCoinsFound,
    lifetimeFactionCoinsFoundByClicking: state.lifetimeFactionCoinsFoundByClicking,
    lifetimeAlignmentSeconds: state.lifetimeAlignmentSeconds,
    lifetimeFactionSeconds: state.lifetimeFactionSeconds,
    lifetimeMaxOwned: state.lifetimeMaxOwned,
    lifetimeMaxTotalBuildings: state.lifetimeMaxTotalBuildings,
  };
}

function incrementRecord(
  source: Readonly<Record<string, number>>,
  key: string | null | undefined,
  amount: number,
): Readonly<Record<string, number>> {
  if (!key || amount <= 0) return source;
  return { ...source, [key]: (source[key] ?? 0) + amount };
}

export function advanceIdleRuntimeSession(
  state: IdleRuntimeLedgerState,
  elapsedSeconds: number,
  currentAlignment: IdleAlignment | null,
  affiliatedFaction: string | null,
): IdleRuntimeLedgerState {
  const elapsed = Math.max(0, elapsedSeconds);
  if (elapsed <= 0) return state;
  const currentEraSeconds = state.currentEraSeconds + elapsed;
  return {
    ...state,
    currentEraSeconds,
    longestSessionSeconds: Math.max(state.longestSessionSeconds, currentEraSeconds),
    alignmentSeconds: incrementRecord(state.alignmentSeconds, currentAlignment, elapsed),
    lifetimeAlignmentSeconds: incrementRecord(
      state.lifetimeAlignmentSeconds,
      currentAlignment,
      elapsed,
    ),
    factionSeconds: incrementRecord(state.factionSeconds, affiliatedFaction, elapsed),
    lifetimeFactionSeconds: incrementRecord(
      state.lifetimeFactionSeconds,
      affiliatedFaction,
      elapsed,
    ),
  };
}

/** Shipped productive-click statistics, separate from automatic clicks. */
export function recordIdleProductiveClick(
  state: IdleRuntimeLedgerState,
  computeGained: number,
): IdleRuntimeLedgerState {
  const gained = Math.max(0, computeGained);
  return {
    ...state,
    productiveClicks: state.productiveClicks + 1,
    lifetimeProductiveClicks: state.lifetimeProductiveClicks + 1,
    computeGainedByClicking: state.computeGainedByClicking + gained,
    lifetimeComputeGainedByClicking: state.lifetimeComputeGainedByClicking + gained,
  };
}

/** Shipped automatic-click statistics (`tRe`). */
export function recordIdleAutomaticClicks(
  state: IdleRuntimeLedgerState,
  count: number,
): IdleRuntimeLedgerState {
  const clicks = Math.max(0, Math.floor(count));
  if (clicks <= 0) return state;
  return {
    ...state,
    automaticClicks: state.automaticClicks + clicks,
    lifetimeAutomaticClicks: state.lifetimeAutomaticClicks + clicks,
  };
}

function mergeNumberRecords(
  left: Readonly<Record<string, number>>,
  right: Readonly<Record<string, number>>,
): Readonly<Record<string, number>> {
  let next: Record<string, number> | undefined;
  for (const [key, rawAmount] of Object.entries(right)) {
    const amount = Math.max(0, rawAmount ?? 0);
    if (amount <= 0) continue;
    if (!next) next = { ...left };
    next[key] = (next[key] ?? 0) + amount;
  }
  return next ?? left;
}

export function idleFoundCoinCount(found: Readonly<Record<string, number>>): number {
  return Object.values(found).reduce((sum, count) => sum + Math.max(0, count ?? 0), 0);
}

/** Shipped GPU discovery ledger (`v0`), excluding the wallet itself. */
export function recordIdleFactionCoinsFound(
  state: IdleRuntimeLedgerState,
  found: Readonly<Record<string, number>>,
  source: IdleFactionCoinSource,
): IdleRuntimeLedgerState {
  const count = idleFoundCoinCount(found);
  if (count <= 0) return state;
  const byClick = source === "productiveClick" ? count : 0;
  return {
    ...state,
    factionCoinsFound: mergeNumberRecords(state.factionCoinsFound, found),
    lifetimeFactionCoinsFound: mergeNumberRecords(state.lifetimeFactionCoinsFound, found),
    totalFactionCoinsFound: state.totalFactionCoinsFound + count,
    lifetimeTotalFactionCoinsFound: state.lifetimeTotalFactionCoinsFound + count,
    factionCoinsFoundThisEra: state.factionCoinsFoundThisEra + count,
    factionCoinsFoundByClicking: state.factionCoinsFoundByClicking + byClick,
    lifetimeFactionCoinsFoundByClicking: state.lifetimeFactionCoinsFoundByClicking + byClick,
  };
}

/** Shipped ownership peak ledger (`K7`). */
export function recordIdleOwnedPeaks(
  state: IdleRuntimeLedgerState,
  owned: Readonly<Record<string, number>>,
): IdleRuntimeLedgerState {
  let maxOwnedThisRun: Record<string, number> | undefined;
  let lifetimeMaxOwned: Record<string, number> | undefined;
  let total = 0;

  for (const [generatorId, rawCount] of Object.entries(owned)) {
    const count = Math.max(0, rawCount ?? 0);
    total += count;
    if (count > (state.maxOwnedThisRun[generatorId] ?? 0)) {
      maxOwnedThisRun ??= { ...state.maxOwnedThisRun };
      maxOwnedThisRun[generatorId] = count;
    }
    if (count > (state.lifetimeMaxOwned[generatorId] ?? 0)) {
      lifetimeMaxOwned ??= { ...state.lifetimeMaxOwned };
      lifetimeMaxOwned[generatorId] = count;
    }
  }

  return {
    ...state,
    maxOwnedThisRun: maxOwnedThisRun ?? state.maxOwnedThisRun,
    lifetimeMaxOwned: lifetimeMaxOwned ?? state.lifetimeMaxOwned,
    maxBuildingsThisEra: Math.max(state.maxBuildingsThisEra, total),
    maxTotalBuildingsThisRun: Math.max(state.maxTotalBuildingsThisRun, total),
    lifetimeMaxTotalBuildings: Math.max(state.lifetimeMaxTotalBuildings, total),
  };
}

/** Shipped `nO`: thread count is reconstructed from purchased thread-grant upgrades. */
export function idleThreadCountFromUpgrades(
  upgradesOwned: Readonly<Record<string, boolean>>,
  upgradeDefinitions: readonly IdleUpgradeDefinition[],
  facts: Readonly<Record<string, boolean>>,
): number {
  if (facts[IDLE_MANIFOLD_UNLOCKED_FACT]) return 0;
  let threads = 0;
  for (const upgrade of upgradeDefinitions) {
    if (upgrade.grantsThread && upgradesOwned[upgrade.id]) threads += 1;
  }
  return threads;
}