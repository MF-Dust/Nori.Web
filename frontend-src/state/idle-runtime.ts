import {
  IDLE_COMPUTE_SYNC_INTERVAL_MS,
  IDLE_FIRST_ABDICATION_SHARDS,
  IDLE_MANIFOLD_UNLOCKED_FACT,
  IDLE_SAVE_INTERVAL_MS,
  IDLE_TICK_INTERVAL_MS,
  type IdleAbdicationQuote,
  type IdleActiveSkillBuff,
  type IdleAlignment,
  type IdleAlignmentDefinition,
  type IdleBuyCount,
  type IdleClickResult,
  type IdleFactionDefinition,
  type IdleGeneratorDefinition,
  type IdleGeneratorQuote,
  type IdlePresentationModel,
  type IdlePresentationSnapshot,
  type IdleRoyalExchangeBuyCount,
  type IdleRoyalExchangeQuote,
  type IdleRunPresentationState,
  type IdleSkillDefinition,
  type IdleUpgradeDefinition,
} from "../apps/idle";
import {
  DEFAULT_IDLE_ALIGNMENTS,
  DEFAULT_IDLE_ECONOMY_CONSTANTS,
  DEFAULT_IDLE_FACTIONS,
  DEFAULT_IDLE_GENERATORS,
  DEFAULT_IDLE_SKILLS,
  type IdleDefaultEconomyConstants,
} from "../apps/idle-default-data";
import {
  getIdleGeneratorTotalCost,
  isIdleGeneratorVisible,
  resolveIdleGeneratorBuyCount,
  type IdleCostMultiplierResolver,
} from "../apps/idle-economy";
import {
  DEFAULT_IDLE_FACTION_UPGRADES,
  DEFAULT_IDLE_HERITAGES,
  DEFAULT_IDLE_MEMENTO_UPGRADES,
  IDLE_MEMENTO_COUNT,
  availableIdleMementoIndex,
  factionProgressionComplete,
  hasIdleGpuCosts,
  idleFactionGpuCosts,
  isIdleFactionRelationUpgrade,
  isIdleFactionUpgradeAvailable,
  isIdleHeritageAvailable,
  isIdleMementoId,
  spendIdleGpuCosts,
} from "../apps/idle-faction-progression";
import {
  DEFAULT_IDLE_GENERATOR_UPGRADES,
  getIdleGeneratorUpgradeMultiplier,
  isIdleGeneratorUpgradeAvailable,
} from "../apps/idle-upgrades";
import type { DesktopComputeState } from "./compute-runtime";

const IDLE_RUN_STORAGE_VERSION = 1;
const IDLE_RUN_STORAGE_PREFIX = "idle.run:";
const EXCHANGEABLE_FACTION_IDS = ["elf", "angel", "goblin", "demon"] as const;
const EXCHANGEABLE_FACTIONS = new Set<string>(EXCHANGEABLE_FACTION_IDS);
const FACTION_ALIGNMENT: Readonly<Record<string, IdleAlignment>> = {
  elf: "accelerate",
  angel: "accelerate",
  goblin: "decelerate",
  demon: "decelerate",
  liuxing: "equilibrium",
};

const GEM_POWER_COMPUTE_COST = 1;
const GEM_POWER_REQUIRED_SHARDS = 1;
const GEM_POWER_PRODUCTION_BONUS_PCT_PER_SHARD = 2;

const CAP_BASE = 1e10;
const CAP_BUMPS: Readonly<Record<string, number>> = {
  "arg.seal_released": 5,
  "arg.cult_truth": 5,
  "arg.gestures_complete": 5,
  "arg.honeypot_access": 10,
};

interface IdleRuntimeState extends IdleRunPresentationState {
  currentEraSeconds: number;
  currentRunComputeProduced: number;
  skillCastsThisEra: number;
  productiveClicks: number;
  lifetimeProductiveClicks: number;
  factionCoinsFoundThisEra: number;
  lifetimeMaxTotalBuildings: number;
}

interface IdlePersistedRun {
  version: number;
  savedAt: number;
  state: Omit<IdleRuntimeState, "facts">;
  manifoldRevealApplied: boolean;
  persistedMaxCompute: number;
}

export interface CreateSourceIdleRuntimeOptions {
  generators?: readonly IdleGeneratorDefinition[];
  upgrades?: readonly IdleUpgradeDefinition[];
  alignments?: readonly IdleAlignmentDefinition[];
  factions?: readonly IdleFactionDefinition[];
  skills?: readonly IdleSkillDefinition[];
  constants?: IdleDefaultEconomyConstants;
  getFacts?: () => ReadonlySet<string>;
  subscribeFacts?: (listener: () => void) => () => void;
  emitFact?: (factId: string) => Promise<void> | void;
  getWorldId?: () => string | null;
  storage?: Pick<Storage, "getItem" | "setItem" | "removeItem">;
  now?: () => number;
  random?: () => number;
  onComputeSync?: (state: DesktopComputeState) => void;
  warn?: (message: string, error?: unknown) => void;
}

export interface SourceIdleRuntime extends IdlePresentationModel {
  start(): void;
  dispose(): void;
  emitFact(factId: string): Promise<void>;
}

function factsRecord(facts: ReadonlySet<string>): Record<string, boolean> {
  return Object.fromEntries([...facts].map((factId) => [factId, true]));
}

function createInitialState(facts: ReadonlySet<string> = new Set()): IdleRuntimeState {
  return {
    compute: 0,
    maxComputeThisRun: 0,
    currentAlignment: null,
    affiliatedFaction: null,
    shards: 0,
    abdications: 0,
    gemPowerUnlocked: false,
    facts: factsRecord(facts),
    owned: {},
    upgrades: {},
    factionCoins: {},
    royalExchanges: {},
    skillCooldownSec: {},
    activeSkillBuffs: [],
    everAlliedFactions: {},
    heritagesUnlocked: {},
    heritagesPurchased: {},
    claimedMementoCount: 0,
    lastMementoClaimAtMs: 0,
    currentEraSeconds: 0,
    currentRunComputeProduced: 0,
    skillCastsThisEra: 0,
    productiveClicks: 0,
    lifetimeProductiveClicks: 0,
    factionCoinsFoundThisEra: 0,
    lifetimeMaxTotalBuildings: 0,
  };
}

function clonePresentationState(state: IdleRuntimeState): IdleRunPresentationState {
  return {
    compute: state.compute,
    maxComputeThisRun: state.maxComputeThisRun,
    currentAlignment: state.currentAlignment,
    affiliatedFaction: state.affiliatedFaction,
    shards: state.shards,
    abdications: state.abdications,
    gemPowerUnlocked: state.gemPowerUnlocked,
    facts: state.facts,
    owned: state.owned,
    upgrades: state.upgrades,
    factionCoins: state.factionCoins,
    royalExchanges: state.royalExchanges,
    skillCooldownSec: state.skillCooldownSec,
    activeSkillBuffs: state.activeSkillBuffs,
    everAlliedFactions: state.everAlliedFactions,
    heritagesUnlocked: state.heritagesUnlocked,
    heritagesPurchased: state.heritagesPurchased,
    claimedMementoCount: state.claimedMementoCount,
    lastMementoClaimAtMs: state.lastMementoClaimAtMs,
  };
}

function sameFacts(current: Readonly<Record<string, boolean>>, next: ReadonlySet<string>): boolean {
  const ids = Object.keys(current).filter((factId) => current[factId]);
  return ids.length === next.size && ids.every((factId) => next.has(factId));
}

function computeCap(facts: Readonly<Record<string, boolean>>): number {
  if (!facts["compute.initialized"]) return Number.POSITIVE_INFINITY;
  if (facts[IDLE_MANIFOLD_UNLOCKED_FACT]) return Number.POSITIVE_INFINITY;
  if (facts["arg.memory.shown"]) return 0;

  let orders = 0;
  for (const [factId, bump] of Object.entries(CAP_BUMPS)) {
    if (facts[factId]) orders += bump;
  }
  return CAP_BASE * 10 ** orders;
}

function finiteCompute(value: number): number {
  if (Number.isNaN(value)) return 0;
  if (!Number.isFinite(value)) return value > 0 ? Number.MAX_VALUE : 0;
  return Math.max(0, value);
}

function addCompute(state: IdleRuntimeState, amount: number): IdleRuntimeState {
  if (amount === 0) return state;
  const nextCompute = finiteCompute(Math.min(computeCap(state.facts), state.compute + amount));
  return {
    ...state,
    compute: nextCompute,
    maxComputeThisRun: Math.max(state.maxComputeThisRun, nextCompute),
    currentRunComputeProduced: state.currentRunComputeProduced + Math.max(0, amount),
  };
}

function totalBuildings(state: IdleRuntimeState): number {
  return Object.values(state.owned).reduce((sum, count) => sum + (count ?? 0), 0);
}

function distinctBuildingTypes(state: IdleRuntimeState): number {
  return Object.values(state.owned).filter((count) => (count ?? 0) > 0).length;
}

function totalTrades(state: IdleRuntimeState): number {
  return Object.values(state.royalExchanges).reduce((sum, count) => sum + (count ?? 0), 0);
}

function royalExchangePercent(
  state: IdleRuntimeState,
  constants: IdleDefaultEconomyConstants,
): number {
  let percent = constants.royalExchangeUnitaryBonusPct;
  if (state.upgrades.fu_elf_elven_efficiency) {
    percent += 1.75 * Math.log(1 + state.factionCoinsFoundThisEra) ** 1.75;
  }
  if (state.upgrades.fu_goblin_central_bank) {
    percent += 0.6 * Math.log(1 + state.factionCoinsFoundThisEra);
  }
  if (state.heritagesPurchased.liuxing) percent += 15;
  return percent;
}

function exchangeMultiplier(
  state: IdleRuntimeState,
  constants: IdleDefaultEconomyConstants,
): number {
  return 1 + (royalExchangePercent(state, constants) * totalTrades(state)) / 100;
}

function exchangeCostMultiplier(
  state: IdleRuntimeState,
  constants: IdleDefaultEconomyConstants,
): number {
  return state.upgrades.fu_goblin_black_market
    ? Math.max(1.07, constants.royalExchangeCostMult - 0.03)
    : constants.royalExchangeCostMult;
}

function heritageProductionMultiplier(state: IdleRuntimeState): number {
  let multiplier = 1;
  const buildings = totalBuildings(state);
  if (state.heritagesPurchased.demonic) {
    multiplier *= 1 + (2.5 * buildings ** 0.7) / 100;
  }
  if (state.heritagesPurchased.liuxing) {
    multiplier *= 1 + (0.25 * state.lifetimeMaxTotalBuildings ** 0.75) / 100;
  }
  if (state.heritagesPurchased.goblin) {
    multiplier *= 1 + (12 * Math.log(1 + state.shards) ** 1.3) / 100;
  }
  if (state.heritagesPurchased.angelic) {
    multiplier *= 1 + (2.5 * state.lifetimeMaxTotalBuildings ** 0.7) / 100;
  }
  if (state.heritagesPurchased.elven) {
    multiplier *= 1 + (6 * state.lifetimeProductiveClicks ** 0.5) / 100;
  }
  return multiplier;
}

function gemPowerMultiplier(state: IdleRuntimeState): number {
  if (!state.gemPowerUnlocked || state.shards <= 0 || state.facts[IDLE_MANIFOLD_UNLOCKED_FACT]) {
    return 1;
  }
  let bonusPct = state.shards * GEM_POWER_PRODUCTION_BONUS_PCT_PER_SHARD;
  if (state.upgrades.fu_goblin_black_market) {
    bonusPct *= 1 + (50 + 2 * Math.log(1 + state.shards)) / 100;
  }
  return 1 + bonusPct / 100;
}

function simpleFactionProductionMultiplier(
  state: IdleRuntimeState,
  generator: IdleGeneratorDefinition,
): number {
  let multiplier = 1;
  if (state.upgrades.fu_angel_archangel_feathers) multiplier *= 1.4;
  if (state.upgrades.fu_angel_magical_gates) multiplier *= 1.15;
  if (state.upgrades.fu_demon_demonic_presence) multiplier *= 2;
  if (
    state.upgrades.fu_demon_devil_tyrant &&
    (generator.id === "full_feature_atlas" || generator.id === "terminal_lockdown")
  ) {
    multiplier *= 2;
  }
  if (state.upgrades.fu_goblin_underdog && generator.alignment === "decelerate") {
    multiplier *= 1 + 4 / (1 + Math.log10(Math.max(10, state.compute)));
  }
  return multiplier;
}

function activeGeneratorMultiplier(state: IdleRuntimeState, generatorId: string): number {
  let multiplier = 1;
  for (const buff of state.activeSkillBuffs) {
    const magnitude = typeof buff.magnitude === "number" ? buff.magnitude : 1;
    if (buff.targetGenId === "*" || buff.targetGenId === generatorId) multiplier *= magnitude;
  }
  return multiplier;
}

function activeClickMultiplier(state: IdleRuntimeState): number {
  let multiplier = 1;
  for (const buff of state.activeSkillBuffs) {
    if (buff.targetGenId != null) continue;
    if (typeof buff.magnitude === "number") multiplier *= buff.magnitude;
  }
  return multiplier;
}

function generatorRate(
  state: IdleRuntimeState,
  generator: IdleGeneratorDefinition,
  upgrades: readonly IdleUpgradeDefinition[],
  constants: IdleDefaultEconomyConstants,
): number {
  return (
    generator.baseRate *
    getIdleGeneratorUpgradeMultiplier(generator.id, state.upgrades, upgrades) *
    activeGeneratorMultiplier(state, generator.id) *
    simpleFactionProductionMultiplier(state, generator) *
    exchangeMultiplier(state, constants) *
    heritageProductionMultiplier(state) *
    gemPowerMultiplier(state)
  );
}

function totalProductionRate(
  state: IdleRuntimeState,
  generators: readonly IdleGeneratorDefinition[],
  upgrades: readonly IdleUpgradeDefinition[],
  constants: IdleDefaultEconomyConstants,
): number {
  let total = 0;
  for (const generator of generators) {
    const owned = state.owned[generator.id] ?? 0;
    if (owned <= 0) continue;
    total += owned * generatorRate(state, generator, upgrades, constants);
  }
  return finiteCompute(total);
}

function factionCoinFindChancePct(
  state: IdleRuntimeState,
  constants: IdleDefaultEconomyConstants,
): number {
  let chance = constants.baseFactionCoinFindChancePct;
  if (state.gemPowerUnlocked && state.shards > 0 && !state.facts[IDLE_MANIFOLD_UNLOCKED_FACT]) {
    chance += Math.floor(0.625 * Math.log(1 + state.shards) ** 0.9);
  }
  if (state.heritagesPurchased.elven) chance += 5;
  if (state.upgrades.fu_elf_elven_treasure_casing) {
    chance += 10 + 2.5 * distinctBuildingTypes(state) ** 0.95;
  }
  if (state.upgrades.fu_goblin_central_bank) {
    chance += 20 + 8 * Math.log(1 + state.factionCoinsFoundThisEra);
  }
  if (state.upgrades.fu_elf_elven_mint) chance *= 2;
  return Math.max(0, chance);
}

function randomFactionCoins(count: number, random: () => number): Record<string, number> {
  const found: Record<string, number> = {};
  for (let index = 0; index < Math.max(0, Math.floor(count)); index += 1) {
    const factionIndex = Math.min(
      EXCHANGEABLE_FACTION_IDS.length - 1,
      Math.floor(random() * EXCHANGEABLE_FACTION_IDS.length),
    );
    const factionId = EXCHANGEABLE_FACTION_IDS[factionIndex];
    found[factionId] = (found[factionId] ?? 0) + 1;
  }
  return found;
}

function rollFactionCoins(
  state: IdleRuntimeState,
  attempts: number,
  constants: IdleDefaultEconomyConstants,
  random: () => number,
): Record<string, number> {
  if (state.facts[IDLE_MANIFOLD_UNLOCKED_FACT]) return {};
  const rolledChance = factionCoinFindChancePct(state, constants) * Math.max(0, attempts);
  const guaranteed = Math.floor(rolledChance / 100);
  const remainder = rolledChance - guaranteed * 100;
  const count = guaranteed + (random() * 100 < remainder ? 1 : 0);
  return randomFactionCoins(count, random);
}

function foundCoinCount(found: Readonly<Record<string, number>>): number {
  return Object.values(found).reduce((sum, count) => sum + (count ?? 0), 0);
}

function mergeCoinRecords(
  left: Readonly<Record<string, number>>,
  right: Readonly<Record<string, number>>,
): Readonly<Record<string, number>> {
  if (Object.keys(right).length === 0) return left;
  const next = { ...left };
  for (const [factionId, amount] of Object.entries(right)) {
    next[factionId] = (next[factionId] ?? 0) + amount;
  }
  return next;
}

function grantFactionCoins(
  state: IdleRuntimeState,
  found: Readonly<Record<string, number>>,
): IdleRuntimeState {
  if (state.facts[IDLE_MANIFOLD_UNLOCKED_FACT]) return state;
  const count = foundCoinCount(found);
  if (count <= 0) return state;
  return {
    ...state,
    factionCoins: mergeCoinRecords(state.factionCoins, found),
    factionCoinsFoundThisEra: state.factionCoinsFoundThisEra + count,
  };
}

function clickReward(
  state: IdleRuntimeState,
  generators: readonly IdleGeneratorDefinition[],
  upgrades: readonly IdleUpgradeDefinition[],
  constants: IdleDefaultEconomyConstants,
): number {
  let reward = 1;
  const rate = totalProductionRate(state, generators, upgrades, constants);
  for (const upgrade of upgrades) {
    if (!state.upgrades[upgrade.id]) continue;
    const share = typeof upgrade.clickProductionSharePct === "number" ? upgrade.clickProductionSharePct : 0;
    if (share !== 0) reward += (share / 100) * rate;
  }
  if (state.heritagesPurchased.elven) {
    const chance = factionCoinFindChancePct(state, constants);
    reward *= 1 + (2 * Math.log(1 + chance) ** 2) / 100;
  }
  return Math.max(0, reward * activeClickMultiplier(state));
}

function shardTotalForCompute(maxCompute: number, constants: IdleDefaultEconomyConstants): number {
  if (maxCompute < constants.shardThresholdK) return 0;
  return Math.floor((maxCompute / constants.shardThresholdK) ** (1 / constants.shardCurveExp) + 1e-9);
}

function computeForShardTotal(shards: number, constants: IdleDefaultEconomyConstants): number {
  return shards ** constants.shardCurveExp * constants.shardThresholdK;
}

function exchangeCumulativeCost(trades: number, multiplier: number, baseCost: number): number {
  return Math.floor((baseCost / (multiplier - 1)) * (multiplier ** trades - 1));
}

function exchangeCost(
  state: IdleRuntimeState,
  factionId: string,
  count: number,
  constants: IdleDefaultEconomyConstants,
): number {
  if (count <= 0) return 0;
  const owned = state.royalExchanges[factionId] ?? 0;
  const multiplier = exchangeCostMultiplier(state, constants);
  return (
    exchangeCumulativeCost(owned + count, multiplier, constants.royalExchangeBaseCost) -
    exchangeCumulativeCost(owned, multiplier, constants.royalExchangeBaseCost)
  );
}

function maxAffordableExchangeCount(
  state: IdleRuntimeState,
  factionId: string,
  constants: IdleDefaultEconomyConstants,
): number {
  if (!EXCHANGEABLE_FACTIONS.has(factionId)) return 0;
  const balance = state.factionCoins[factionId] ?? 0;
  const owned = state.royalExchanges[factionId] ?? 0;
  const multiplier = exchangeCostMultiplier(state, constants);
  const spentBefore = exchangeCumulativeCost(owned, multiplier, constants.royalExchangeBaseCost);
  const scaled = 1 + ((balance + spentBefore) * (multiplier - 1)) / constants.royalExchangeBaseCost;
  let target = scaled > 1 ? Math.floor(Math.log(scaled) / Math.log(multiplier)) : owned;
  if (target < owned) target = owned;
  while (
    exchangeCumulativeCost(target + 1, multiplier, constants.royalExchangeBaseCost) - spentBefore <=
    balance
  ) {
    target += 1;
  }
  while (
    target > owned &&
    exchangeCumulativeCost(target, multiplier, constants.royalExchangeBaseCost) - spentBefore > balance
  ) {
    target -= 1;
  }
  return target - owned;
}

function generatorCostResolver(state: IdleRuntimeState): IdleCostMultiplierResolver {
  return (generator) => {
    if (state.upgrades.fu_elf_price_performance && generator.alignment === "accelerate") {
      return Math.max(1.1, generator.costMult - 0.02);
    }
    if (state.upgrades.fu_demon_vertical_integration && generator.alignment === "decelerate") {
      return Math.max(1.09, generator.costMult - 0.06);
    }
    return generator.costMult;
  };
}

function skillMagnitudeMultiplier(state: IdleRuntimeState, upgrades: readonly IdleUpgradeDefinition[]): number {
  let bonus = 0;
  for (const upgrade of upgrades) {
    if (!state.upgrades[upgrade.id]) continue;
    if (typeof upgrade.skillMagnitudeBonus === "number") bonus += upgrade.skillMagnitudeBonus;
  }
  return 1 + bonus;
}

function skillDurationMultiplier(state: IdleRuntimeState, upgrades: readonly IdleUpgradeDefinition[]): number {
  let bonus = 0;
  for (const upgrade of upgrades) {
    if (!state.upgrades[upgrade.id]) continue;
    if (typeof upgrade.skillDurationBonus === "number") bonus += upgrade.skillDurationBonus;
  }
  return 1 + bonus;
}

function storageForRuntime(
  explicit?: Pick<Storage, "getItem" | "setItem" | "removeItem">,
): Pick<Storage, "getItem" | "setItem" | "removeItem"> | undefined {
  if (explicit) return explicit;
  if (typeof window === "undefined") return undefined;
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}

function persistedState(state: IdleRuntimeState): Omit<IdleRuntimeState, "facts"> {
  const { facts: _facts, ...rest } = state;
  return rest;
}

export function createSourceIdleRuntime(options: CreateSourceIdleRuntimeOptions = {}): SourceIdleRuntime {
  const generators = options.generators ?? DEFAULT_IDLE_GENERATORS;
  const upgrades =
    options.upgrades ??
    [...DEFAULT_IDLE_GENERATOR_UPGRADES, ...DEFAULT_IDLE_FACTION_UPGRADES, ...DEFAULT_IDLE_MEMENTO_UPGRADES];
  const alignments = options.alignments ?? DEFAULT_IDLE_ALIGNMENTS;
  const factions = options.factions ?? DEFAULT_IDLE_FACTIONS;
  const skills = options.skills ?? DEFAULT_IDLE_SKILLS;
  const constants = options.constants ?? DEFAULT_IDLE_ECONOMY_CONSTANTS;
  const now = options.now ?? (() => Date.now());
  const random = options.random ?? Math.random;
  const storage = storageForRuntime(options.storage);
  const warn = options.warn ?? ((message, error) => console.warn(message, error));

  let state = createInitialState(options.getFacts?.());
  let manifoldRevealApplied = false;
  let persistedMaxCompute = 0;
  let started = false;
  let disposed = false;
  let storageKey: string | null = null;
  let lastTickAt = now();
  let tickTimer: ReturnType<typeof setInterval> | undefined;
  let syncTimer: ReturnType<typeof setInterval> | undefined;
  let saveTimer: ReturnType<typeof setInterval> | undefined;
  let unsubscribeFacts: (() => void) | undefined;
  const listeners = new Set<() => void>();

  const publish = () => {
    for (const listener of listeners) listener();
  };

  const syncCompute = () => {
    options.onComputeSync?.({ compute: state.compute, cap: computeCap(state.facts) });
  };

  const currentStorageKey = (): string | null => {
    const worldId = options.getWorldId?.();
    return worldId ? `${IDLE_RUN_STORAGE_PREFIX}${worldId}` : null;
  };

  const loadStorage = (key: string, facts: ReadonlySet<string>): boolean => {
    if (!storage) return false;
    try {
      const raw = storage.getItem(key);
      if (!raw) return false;
      const parsed = JSON.parse(raw) as Partial<IdlePersistedRun>;
      if (parsed.version !== IDLE_RUN_STORAGE_VERSION || !parsed.state) return false;
      state = { ...createInitialState(facts), ...parsed.state, facts: factsRecord(facts) };
      manifoldRevealApplied = !!parsed.manifoldRevealApplied;
      persistedMaxCompute = Math.max(Number(parsed.persistedMaxCompute) || 0, state.maxComputeThisRun);
      return true;
    } catch (error) {
      warn("[IdleRuntime] failed to hydrate run persistence", error);
      return false;
    }
  };

  const save = () => {
    if (!storage || !storageKey) return;
    try {
      const payload: IdlePersistedRun = {
        version: IDLE_RUN_STORAGE_VERSION,
        savedAt: now(),
        state: persistedState(state),
        manifoldRevealApplied,
        persistedMaxCompute: Math.max(persistedMaxCompute, state.maxComputeThisRun),
      };
      storage.setItem(storageKey, JSON.stringify(payload));
    } catch (error) {
      warn("[IdleRuntime] failed to persist run", error);
    }
  };

  const syncFacts = () => {
    const facts = options.getFacts?.() ?? new Set<string>();
    const nextKey = currentStorageKey();
    let changed = false;

    if (nextKey !== storageKey) {
      save();
      storageKey = nextKey;
      state = createInitialState(facts);
      manifoldRevealApplied = false;
      changed = true;
      if (storageKey) loadStorage(storageKey, facts);
    } else if (!sameFacts(state.facts, facts)) {
      state = { ...state, facts: factsRecord(facts) };
      changed = true;
    }

    if (changed) {
      publish();
      syncCompute();
    }
  };

  const runtime: SourceIdleRuntime = {
    snapshot(): IdlePresentationSnapshot {
      return {
        state: clonePresentationState(state),
        computeState: { compute: state.compute, cap: computeCap(state.facts) },
        generators,
        upgrades,
        alignments,
        factions,
        skills,
        manifoldRevealApplied,
        persistedMaxCompute: Math.max(persistedMaxCompute, state.maxComputeThisRun),
      };
    },

    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    quoteGenerator(generatorId, mode): IdleGeneratorQuote | null {
      const generator = generators.find((candidate) => candidate.id === generatorId);
      if (!generator || !isIdleGeneratorVisible(generator, state)) return null;
      const owned = state.owned[generator.id] ?? 0;
      const resolver = generatorCostResolver(state);
      const willBuy = resolveIdleGeneratorBuyCount(generator, owned, state.compute, mode, state, resolver);
      const totalCost = getIdleGeneratorTotalCost(generator, owned, willBuy, state, resolver);
      const perUnitRate = generatorRate(state, generator, upgrades, constants);
      return {
        generatorId,
        owned,
        willBuy,
        totalCost,
        perUnitRate,
        totalRate: owned * perUnitRate,
      };
    },

    quoteAbdication(): IdleAbdicationQuote {
      const potential = shardTotalForCompute(state.maxComputeThisRun, constants);
      const gainedShards = Math.max(0, potential - state.shards);
      const firstAbdication = state.abdications === 0;
      const canAbdicate =
        state.currentAlignment !== "equilibrium" &&
        (firstAbdication ? gainedShards >= IDLE_FIRST_ABDICATION_SHARDS : gainedShards > 0);
      return {
        gainedShards,
        totalShardsAfter: state.shards + gainedShards,
        canAbdicate,
        firstAbdication,
        recommendedFirstShards: IDLE_FIRST_ABDICATION_SHARDS,
        nextShardCompute: computeForShardTotal(state.shards + gainedShards + 1, constants),
      };
    },

    quoteRoyalExchange(factionId, mode): IdleRoyalExchangeQuote | null {
      if (!EXCHANGEABLE_FACTIONS.has(factionId)) return null;
      if (state.currentAlignment === null || state.currentAlignment === "equilibrium") return null;
      const maximum = maxAffordableExchangeCount(state, factionId, constants);
      const willBuy = mode === "max" ? maximum : Math.min(1, maximum);
      return {
        factionId,
        tradesOwned: state.royalExchanges[factionId] ?? 0,
        coinBalance: state.factionCoins[factionId] ?? 0,
        willBuy,
        totalCost: exchangeCost(state, factionId, willBuy, constants),
        perTradePercent: royalExchangePercent(state, constants),
        totalMultiplier: exchangeMultiplier(state, constants),
      };
    },

    click(): IdleClickResult {
      const gained = clickReward(state, generators, upgrades, constants);
      let next = addCompute(
        {
          ...state,
          productiveClicks: state.productiveClicks + 1,
          lifetimeProductiveClicks: state.lifetimeProductiveClicks + 1,
        },
        gained,
      );

      let factionCoinsFound = rollFactionCoins(next, 1, constants, random);
      next = grantFactionCoins(next, factionCoinsFound);

      let isLucky = false;
      let luckGain = 0;
      if (next.upgrades.fu_elf_elven_luck && random() < 0.01) {
        isLucky = true;
        luckGain = totalProductionRate(next, generators, upgrades, constants) * 10_000;
        next = addCompute(next, luckGain);
        const luckCoins = randomFactionCoins(Math.floor(factionCoinFindChancePct(next, constants)), random);
        next = grantFactionCoins(next, luckCoins);
        factionCoinsFound = mergeCoinRecords(factionCoinsFound, luckCoins);
      }

      state = next;
      publish();
      return {
        gained,
        isCombo: false,
        isCrit: false,
        isLucky,
        luckGain,
        factionCoinsFound,
      };
    },

    buy(generatorId, mode: IdleBuyCount = 1) {
      const generator = generators.find((candidate) => candidate.id === generatorId);
      if (!generator || !isIdleGeneratorVisible(generator, state)) return;
      const owned = state.owned[generatorId] ?? 0;
      const resolver = generatorCostResolver(state);
      const count = resolveIdleGeneratorBuyCount(generator, owned, state.compute, mode, state, resolver);
      if (count <= 0) return;
      const cost = getIdleGeneratorTotalCost(generator, owned, count, state, resolver);
      if (state.compute < cost) return;
      const nextOwned = { ...state.owned, [generatorId]: owned + count };
      const nextTotalBuildings = Object.values(nextOwned).reduce((sum, value) => sum + (value ?? 0), 0);
      state = {
        ...state,
        compute: finiteCompute(state.compute - cost),
        owned: nextOwned,
        lifetimeMaxTotalBuildings: Math.max(state.lifetimeMaxTotalBuildings, nextTotalBuildings),
      };
      publish();
    },

    buyUpgrade(upgradeId) {
      const upgrade = upgrades.find((candidate) => candidate.id === upgradeId);
      if (!upgrade || upgrade.factionId || !isIdleGeneratorUpgradeAvailable(upgrade, state)) return;
      if (state.compute < upgrade.cost) return;
      state = {
        ...state,
        compute: finiteCompute(state.compute - upgrade.cost),
        upgrades: { ...state.upgrades, [upgrade.id]: true },
      };
      publish();
    },

    buyFactionUpgrade(upgradeId) {
      const upgrade = upgrades.find((candidate) => candidate.id === upgradeId);
      if (!upgrade || !upgrade.factionId || isIdleMementoId(upgrade.id)) return;
      const factionId = upgrade.factionId;
      if (!isIdleFactionUpgradeAvailable(state, upgrade, FACTION_ALIGNMENT[factionId])) return;

      let next = state;
      if (isIdleFactionRelationUpgrade(upgrade)) {
        const costs = idleFactionGpuCosts(factionId, upgrade.factionTier ?? 1);
        if (!hasIdleGpuCosts(state.factionCoins, costs)) return;
        const firstTreaty = (upgrade.factionTier ?? 0) === 1 && state.affiliatedFaction === null;
        next = {
          ...state,
          factionCoins: spendIdleGpuCosts(state.factionCoins, costs),
          upgrades: { ...state.upgrades, [upgrade.id]: true },
          affiliatedFaction: firstTreaty ? factionId : state.affiliatedFaction,
          everAlliedFactions: firstTreaty
            ? { ...state.everAlliedFactions, [factionId]: true }
            : state.everAlliedFactions,
        };
      } else {
        if (state.compute < upgrade.cost) return;
        next = {
          ...state,
          compute: finiteCompute(state.compute - upgrade.cost),
          upgrades: { ...state.upgrades, [upgrade.id]: true },
        };
      }

      if (factionProgressionComplete(factionId, next.upgrades, upgrades)) {
        next = {
          ...next,
          heritagesUnlocked: { ...next.heritagesUnlocked, [factionId]: true },
        };
      }
      state = next;
      publish();
    },

    buyHeritage(heritageId) {
      const heritage = DEFAULT_IDLE_HERITAGES.find((candidate) => candidate.id === heritageId);
      if (!heritage || !isIdleHeritageAvailable(state, heritage)) return;
      if (!hasIdleGpuCosts(state.factionCoins, heritage.costs)) return;
      state = {
        ...state,
        factionCoins: spendIdleGpuCosts(state.factionCoins, heritage.costs),
        heritagesPurchased: { ...state.heritagesPurchased, [heritage.id]: true },
      };
      publish();
    },

    buyRoyalExchange(factionId, mode: IdleRoyalExchangeBuyCount = 1) {
      const quote = runtime.quoteRoyalExchange(factionId, mode);
      if (!quote || quote.willBuy <= 0 || quote.coinBalance < quote.totalCost) return;
      state = {
        ...state,
        factionCoins: {
          ...state.factionCoins,
          [factionId]: quote.coinBalance - quote.totalCost,
        },
        royalExchanges: {
          ...state.royalExchanges,
          [factionId]: quote.tradesOwned + quote.willBuy,
        },
      };
      publish();
    },

    buyProof(alignmentId: IdleAlignment) {
      if (state.currentAlignment !== null) return;
      const alignment = alignments.find((candidate) => candidate.id === alignmentId);
      if (!alignment) return;
      if (alignment.unlockFact) {
        if (!state.facts[alignment.unlockFact]) return;
      } else if (state.compute < alignment.cost) {
        return;
      }

      let next: IdleRuntimeState = {
        ...state,
        compute: finiteCompute(state.compute - (alignment.unlockFact ? 0 : alignment.cost)),
        currentAlignment: alignment.id,
      };
      const matchingFactions = factions.filter(
        (faction) => FACTION_ALIGNMENT[faction.id] === alignment.id,
      );
      if (matchingFactions.length === 1) {
        const factionId = matchingFactions[0]?.id;
        const hasTreaty = factionId ? upgrades.some(
          (upgrade) => upgrade.id === `fu_${factionId}_treaty`,
        ) : false;
        if (factionId && !hasTreaty) {
          next = {
            ...next,
            affiliatedFaction: factionId,
            everAlliedFactions: { ...next.everAlliedFactions, [factionId]: true },
          };
        }
      }
      state = next;
      publish();
    },

    fireSkill(skillId) {
      const skill = skills.find((candidate) => candidate.id === skillId);
      if (!skill) return 0;
      if (skill.scope !== "universal" && skill.scope !== state.affiliatedFaction) return 0;
      if ((state.skillCooldownSec[skillId] ?? 0) > 0) return 0;

      const before = state.compute;
      const effect = skill.effect ?? {};
      const kind = typeof effect.kind === "string" ? effect.kind : "";
      const cooldownSec = Math.max(0, skill.cooldownSec ?? 0);
      const magnitudeMultiplier = skillMagnitudeMultiplier(state, upgrades);
      const durationMultiplier = skillDurationMultiplier(state, upgrades);
      let next: IdleRuntimeState = {
        ...state,
        skillCastsThisEra: state.skillCastsThisEra + 1,
        skillCooldownSec: { ...state.skillCooldownSec, [skillId]: cooldownSec },
      };

      const grant = typeof effect.grantsFactionCoins === "number" ? effect.grantsFactionCoins : 0;
      if (grant > 0) next = grantFactionCoins(next, randomFactionCoins(grant, random));

      if (kind === "prodBuff") {
        const magnitude =
          (typeof effect.magnitude === "number" ? effect.magnitude : 1) * magnitudeMultiplier;
        const durationSec = Math.max(0, skill.durationSec ?? 0) * durationMultiplier;
        const target = typeof effect.target === "string" ? effect.target : "all";
        const targetIds = generators
          .filter((generator) =>
            target === "all"
              ? true
              : target === "accel"
                ? generator.alignment === "accelerate"
                : target === "decel"
                  ? generator.alignment === "decelerate"
                  : target === "flagship"
                    ? generator.id === "singularity_gate"
                    : false,
          )
          .map((generator) => generator.id);
        const buffs: IdleActiveSkillBuff[] = targetIds.map((targetGenId) => ({
          id: skillId,
          targetGenId,
          magnitude,
          remainingSec: durationSec,
          durationSec,
        }));
        next = {
          ...next,
          activeSkillBuffs: [
            ...next.activeSkillBuffs.filter((buff) => buff.id !== skillId),
            ...buffs,
          ],
        };
      } else if (kind === "lump") {
        const seconds = typeof effect.seconds === "number" ? effect.seconds : 0;
        next = addCompute(next, totalProductionRate(next, generators, upgrades, constants) * seconds);
      } else if (kind === "strike") {
        const pool = typeof effect.pool === "string" ? effect.pool : "decelerate";
        const candidates = generators.filter(
          (generator) =>
            (next.owned[generator.id] ?? 0) > 0 &&
            (pool === "all" || generator.alignment === pool),
        );
        if (candidates.length > 0) {
          const index = Math.min(candidates.length - 1, Math.floor(random() * candidates.length));
          const target = candidates[index];
          const baseMagnitude = typeof effect.magnitude === "number" ? effect.magnitude : 1;
          const critChance = typeof effect.critChance === "number" ? effect.critChance : 0;
          const critMult = typeof effect.critMult === "number" ? effect.critMult : 1;
          const magnitude =
            baseMagnitude * (random() < critChance ? critMult : 1) * magnitudeMultiplier;
          const durationSec = Math.max(0, skill.durationSec ?? 0) * durationMultiplier;
          next = {
            ...next,
            activeSkillBuffs: [
              ...next.activeSkillBuffs,
              {
                id: skillId,
                targetGenId: target.id,
                magnitude,
                remainingSec: durationSec,
                durationSec,
              },
            ],
          };
        }
      } else if (kind === "clickBuff") {
        const durationSec = Math.max(0, skill.durationSec ?? 0) * durationMultiplier;
        next = {
          ...next,
          activeSkillBuffs: [
            ...next.activeSkillBuffs.filter((buff) => buff.id !== skillId),
            {
              id: skillId,
              magnitude:
                (typeof effect.magnitude === "number" ? effect.magnitude : 1) * magnitudeMultiplier,
              remainingSec: durationSec,
              durationSec,
            },
          ],
        };
      }

      state = next;
      publish();
      return Math.max(0, state.compute - before);
    },

    setFacts(facts) {
      if (sameFacts(state.facts, facts)) return;
      state = { ...state, facts: factsRecord(facts) };
      publish();
      syncCompute();
    },

    buyGemPower() {
      if (
        state.facts[IDLE_MANIFOLD_UNLOCKED_FACT] ||
        state.gemPowerUnlocked ||
        state.shards < GEM_POWER_REQUIRED_SHARDS ||
        state.compute < GEM_POWER_COMPUTE_COST
      ) {
        return;
      }
      state = {
        ...state,
        compute: finiteCompute(state.compute - GEM_POWER_COMPUTE_COST),
        gemPowerUnlocked: true,
      };
      publish();
      syncCompute();
    },

    abdicate() {
      const quote = runtime.quoteAbdication();
      if (!quote.canAbdicate) return;
      persistedMaxCompute = Math.max(persistedMaxCompute, state.maxComputeThisRun);
      const facts = new Set(Object.keys(state.facts).filter((factId) => state.facts[factId]));
      const permanent = {
        gemPowerUnlocked: state.gemPowerUnlocked,
        lifetimeProductiveClicks: state.lifetimeProductiveClicks,
        lifetimeMaxTotalBuildings: state.lifetimeMaxTotalBuildings,
        everAlliedFactions: state.everAlliedFactions,
        heritagesUnlocked: state.heritagesUnlocked,
        heritagesPurchased: state.heritagesPurchased,
      };
      state = {
        ...createInitialState(facts),
        ...permanent,
        shards: quote.totalShardsAfter,
        abdications: state.abdications + 1,
      };
      publish();
      syncCompute();
      save();
    },

    syncManifoldReveal() {
      if (!state.facts["arg.memory.shown"]) {
        if (manifoldRevealApplied) {
          manifoldRevealApplied = false;
          publish();
        }
        return false;
      }
      if (manifoldRevealApplied) return false;
      manifoldRevealApplied = true;
      publish();
      return true;
    },

    claimMemento(onCompleted) {
      const index = availableIdleMementoIndex(state, now());
      if (index === null) return;
      const memento = DEFAULT_IDLE_MEMENTO_UPGRADES[index];
      if (!memento) return;
      const claimedMementoCount = state.claimedMementoCount + 1;
      state = {
        ...state,
        upgrades: { ...state.upgrades, [memento.id]: true },
        claimedMementoCount,
        lastMementoClaimAtMs: now(),
      };
      publish();
      if (claimedMementoCount >= IDLE_MEMENTO_COUNT) onCompleted?.();
    },

    tick(seconds) {
      const elapsed = Math.max(0, seconds);
      if (elapsed <= 0) return;
      let next = addCompute(
        { ...state, currentEraSeconds: state.currentEraSeconds + elapsed },
        totalProductionRate(state, generators, upgrades, constants) * elapsed,
      );

      const cooldowns: Record<string, number> = {};
      for (const [skillId, remaining] of Object.entries(next.skillCooldownSec)) {
        const value = Math.max(0, remaining - elapsed);
        if (value > 0) cooldowns[skillId] = value;
      }
      const buffs = next.activeSkillBuffs
        .map((buff) => ({
          ...buff,
          remainingSec:
            typeof buff.remainingSec === "number"
              ? Math.max(0, buff.remainingSec - elapsed)
              : buff.remainingSec,
        }))
        .filter((buff) => buff.remainingSec == null || buff.remainingSec > 0);
      next = { ...next, skillCooldownSec: cooldowns, activeSkillBuffs: buffs };
      state = next;
      publish();
    },

    async emitFact(factId) {
      if (!factId) return;
      await options.emitFact?.(factId);
      if (!state.facts[factId]) {
        state = { ...state, facts: { ...state.facts, [factId]: true } };
        publish();
        syncCompute();
      }
    },

    start() {
      if (started || disposed) return;
      started = true;
      syncFacts();
      lastTickAt = now();
      unsubscribeFacts = options.subscribeFacts?.(() => syncFacts());
      tickTimer = setInterval(() => {
        const current = now();
        const elapsed = Math.max(0, (current - lastTickAt) / 1_000);
        lastTickAt = current;
        runtime.tick(elapsed);
      }, IDLE_TICK_INTERVAL_MS);
      syncTimer = setInterval(syncCompute, IDLE_COMPUTE_SYNC_INTERVAL_MS);
      saveTimer = setInterval(save, IDLE_SAVE_INTERVAL_MS);
      syncCompute();
    },

    dispose() {
      if (disposed) return;
      disposed = true;
      save();
      if (tickTimer) clearInterval(tickTimer);
      if (syncTimer) clearInterval(syncTimer);
      if (saveTimer) clearInterval(saveTimer);
      unsubscribeFacts?.();
      listeners.clear();
    },
  };

  return runtime;
}
