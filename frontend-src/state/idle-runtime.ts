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
} from "../apps/idle-economy";
import {
  DEFAULT_IDLE_GENERATOR_UPGRADES,
  getIdleGeneratorUpgradeMultiplier,
  isIdleGeneratorUpgradeAvailable,
} from "../apps/idle-upgrades";
import type { DesktopComputeState } from "./compute-runtime";

const IDLE_RUN_STORAGE_VERSION = 1;
const IDLE_RUN_STORAGE_PREFIX = "idle.run:";
const EXCHANGEABLE_FACTIONS = new Set(["elf", "angel", "goblin", "demon"]);
const EXCHANGEABLE_FACTION_IDS = [...EXCHANGEABLE_FACTIONS];

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
  gemPowerUnlocked: boolean;
  currentEraSeconds: number;
  currentRunComputeProduced: number;
  skillCastsThisEra: number;
  productiveClicks: number;
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
    facts: factsRecord(facts),
    owned: {},
    upgrades: {},
    factionCoins: {},
    royalExchanges: {},
    skillCooldownSec: {},
    activeSkillBuffs: [],
    gemPowerUnlocked: false,
    currentEraSeconds: 0,
    currentRunComputeProduced: 0,
    skillCastsThisEra: 0,
    productiveClicks: 0,
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
    facts: state.facts,
    owned: state.owned,
    upgrades: state.upgrades,
    factionCoins: state.factionCoins,
    royalExchanges: state.royalExchanges,
    skillCooldownSec: state.skillCooldownSec,
    activeSkillBuffs: state.activeSkillBuffs,
  };
}

function sameFacts(
  current: Readonly<Record<string, boolean>>,
  next: ReadonlySet<string>,
): boolean {
  const ids = Object.keys(current).filter((factId) => current[factId]);
  return ids.length === next.size && ids.every((factId) => next.has(factId));
}

function computeCap(facts: Readonly<Record<string, boolean>>): number {
  if (!facts["compute.initialized"]) return Number.POSITIVE_INFINITY;
  if (facts["arg.manifold_unlocked"]) return Number.POSITIVE_INFINITY;
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

function totalTrades(state: IdleRuntimeState): number {
  return Object.values(state.royalExchanges).reduce((sum, count) => sum + (count ?? 0), 0);
}

function exchangeMultiplier(
  state: IdleRuntimeState,
  constants: IdleDefaultEconomyConstants,
): number {
  return 1 + (constants.royalExchangeUnitaryBonusPct * totalTrades(state)) / 100;
}

function gemPowerMultiplier(state: IdleRuntimeState): number {
  if (
    !state.gemPowerUnlocked ||
    state.shards <= 0 ||
    state.facts[IDLE_MANIFOLD_UNLOCKED_FACT]
  ) {
    return 1;
  }
  return 1 + (state.shards * GEM_POWER_PRODUCTION_BONUS_PCT_PER_SHARD) / 100;
}

function factionCoinFindChancePct(
  state: IdleRuntimeState,
  constants: IdleDefaultEconomyConstants,
): number {
  let chance = constants.baseFactionCoinFindChancePct;
  if (
    state.gemPowerUnlocked &&
    state.shards > 0 &&
    !state.facts[IDLE_MANIFOLD_UNLOCKED_FACT]
  ) {
    chance += Math.floor(0.625 * Math.log(1 + state.shards) ** 0.9);
  }
  return Math.max(0, chance);
}

function rollFactionCoins(
  state: IdleRuntimeState,
  attempts: number,
  constants: IdleDefaultEconomyConstants,
  random: () => number,
): Record<string, number> {
  const rolledChance = factionCoinFindChancePct(state, constants) * Math.max(0, attempts);
  const guaranteed = Math.floor(rolledChance / 100);
  const remainder = rolledChance - guaranteed * 100;
  const count = guaranteed + (random() * 100 < remainder ? 1 : 0);
  const found: Record<string, number> = {};
  for (let index = 0; index < count; index += 1) {
    const factionIndex = Math.min(
      EXCHANGEABLE_FACTION_IDS.length - 1,
      Math.floor(random() * EXCHANGEABLE_FACTION_IDS.length),
    );
    const factionId = EXCHANGEABLE_FACTION_IDS[factionIndex];
    found[factionId] = (found[factionId] ?? 0) + 1;
  }
  return found;
}

function mergeFactionCoins(
  current: Readonly<Record<string, number>>,
  found: Readonly<Record<string, number>>,
): Readonly<Record<string, number>> {
  if (Object.keys(found).length === 0) return current;
  const next = { ...current };
  for (const [factionId, amount] of Object.entries(found)) {
    next[factionId] = (next[factionId] ?? 0) + amount;
  }
  return next;
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
    exchangeMultiplier(state, constants) *
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

function shardTotalForCompute(maxCompute: number, constants: IdleDefaultEconomyConstants): number {
  if (maxCompute < constants.shardThresholdK) return 0;
  return Math.floor(
    (maxCompute / constants.shardThresholdK) ** (1 / constants.shardCurveExp) + 1e-9,
  );
}

function computeForShardTotal(shards: number, constants: IdleDefaultEconomyConstants): number {
  return shards ** constants.shardCurveExp * constants.shardThresholdK;
}

function exchangeCumulativeCost(
  trades: number,
  constants: IdleDefaultEconomyConstants,
): number {
  const multiplier = constants.royalExchangeCostMult;
  return Math.floor(
    (constants.royalExchangeBaseCost / (multiplier - 1)) * (multiplier ** trades - 1),
  );
}

function exchangeCost(
  state: IdleRuntimeState,
  factionId: string,
  count: number,
  constants: IdleDefaultEconomyConstants,
): number {
  if (count <= 0) return 0;
  const owned = state.royalExchanges[factionId] ?? 0;
  return (
    exchangeCumulativeCost(owned + count, constants) -
    exchangeCumulativeCost(owned, constants)
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
  const multiplier = constants.royalExchangeCostMult;
  const spentBefore = exchangeCumulativeCost(owned, constants);
  const scaled =
    1 + ((balance + spentBefore) * (multiplier - 1)) / constants.royalExchangeBaseCost;
  let target = scaled > 1 ? Math.floor(Math.log(scaled) / Math.log(multiplier)) : owned;
  if (target < owned) target = owned;
  while (exchangeCumulativeCost(target + 1, constants) - spentBefore <= balance) target += 1;
  while (target > owned && exchangeCumulativeCost(target, constants) - spentBefore > balance) target -= 1;
  return target - owned;
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

export function createSourceIdleRuntime(
  options: CreateSourceIdleRuntimeOptions = {},
): SourceIdleRuntime {
  const generators = options.generators ?? DEFAULT_IDLE_GENERATORS;
  const upgrades = options.upgrades ?? DEFAULT_IDLE_GENERATOR_UPGRADES;
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
      persistedMaxCompute = Math.max(
        Number(parsed.persistedMaxCompute) || 0,
        state.maxComputeThisRun,
      );
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
      const willBuy = resolveIdleGeneratorBuyCount(
        generator,
        owned,
        state.compute,
        mode,
        state,
      );
      const totalCost = getIdleGeneratorTotalCost(generator, owned, willBuy, state);
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
        (firstAbdication
          ? gainedShards >= IDLE_FIRST_ABDICATION_SHARDS
          : gainedShards > 0);
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
        perTradePercent: constants.royalExchangeUnitaryBonusPct,
        totalMultiplier: exchangeMultiplier(state, constants),
      };
    },

    click(): IdleClickResult {
      const gained = activeClickMultiplier(state);
      const factionCoinsFound = rollFactionCoins(state, 1, constants, random);
      state = addCompute(
        {
          ...state,
          productiveClicks: state.productiveClicks + 1,
          factionCoins: mergeFactionCoins(state.factionCoins, factionCoinsFound),
        },
        gained,
      );
      publish();
      return {
        gained,
        isCombo: false,
        isCrit: false,
        isLucky: false,
        luckGain: 0,
        factionCoinsFound,
      };
    },

    buy(generatorId, mode: IdleBuyCount = 1) {
      const generator = generators.find((candidate) => candidate.id === generatorId);
      if (!generator || !isIdleGeneratorVisible(generator, state)) return;
      const owned = state.owned[generatorId] ?? 0;
      const count = resolveIdleGeneratorBuyCount(
        generator,
        owned,
        state.compute,
        mode,
        state,
      );
      if (count <= 0) return;
      const cost = getIdleGeneratorTotalCost(generator, owned, count, state);
      if (state.compute < cost) return;
      state = {
        ...state,
        compute: finiteCompute(state.compute - cost),
        owned: { ...state.owned, [generatorId]: owned + count },
      };
      publish();
    },

    buyUpgrade(upgradeId) {
      const upgrade = upgrades.find((candidate) => candidate.id === upgradeId);
      if (!upgrade || !isIdleGeneratorUpgradeAvailable(upgrade, state)) return;
      if (state.compute < upgrade.cost) return;
      state = {
        ...state,
        compute: finiteCompute(state.compute - upgrade.cost),
        upgrades: { ...state.upgrades, [upgrade.id]: true },
      };
      publish();
    },

    buyFactionUpgrade(_upgradeId) {
      // Treaty/pact/alliance eligibility and faction effect curves are the next progression slice.
    },

    buyHeritage(_heritageId) {
      // Heritage persistence remains a separate progression slice.
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
      state = {
        ...state,
        compute: finiteCompute(state.compute - (alignment.unlockFact ? 0 : alignment.cost)),
        currentAlignment: alignment.id,
      };
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
      let next: IdleRuntimeState = {
        ...state,
        skillCastsThisEra: state.skillCastsThisEra + 1,
        skillCooldownSec: { ...state.skillCooldownSec, [skillId]: cooldownSec },
      };

      if (kind === "prodBuff") {
        const magnitude = typeof effect.magnitude === "number" ? effect.magnitude : 1;
        const durationSec = Math.max(0, skill.durationSec ?? 0);
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
                    ? generator.id === "singularity_gate" || generator.id === "terminal_lockdown"
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
        next = { ...next, activeSkillBuffs: [...next.activeSkillBuffs, ...buffs] };
      } else if (kind === "lump") {
        const seconds = typeof effect.seconds === "number" ? effect.seconds : 0;
        next = addCompute(
          next,
          totalProductionRate(next, generators, upgrades, constants) * seconds,
        );
        const grant = typeof effect.grantsFactionCoins === "number" ? effect.grantsFactionCoins : 0;
        if (grant > 0 && next.affiliatedFaction && EXCHANGEABLE_FACTIONS.has(next.affiliatedFaction)) {
          next = {
            ...next,
            factionCoins: {
              ...next.factionCoins,
              [next.affiliatedFaction]: (next.factionCoins[next.affiliatedFaction] ?? 0) + grant,
            },
          };
        }
      } else if (kind === "strike") {
        const pool = typeof effect.pool === "string" ? effect.pool : "decelerate";
        const candidates = generators.filter(
          (generator) => generator.alignment === pool && (next.owned[generator.id] ?? 0) > 0,
        );
        if (candidates.length > 0) {
          const index = Math.min(candidates.length - 1, Math.floor(random() * candidates.length));
          const target = candidates[index];
          const baseMagnitude = typeof effect.magnitude === "number" ? effect.magnitude : 1;
          const critChance = typeof effect.critChance === "number" ? effect.critChance : 0;
          const critMult = typeof effect.critMult === "number" ? effect.critMult : 1;
          const magnitude = baseMagnitude * (random() < critChance ? critMult : 1);
          const durationSec = Math.max(0, skill.durationSec ?? 0);
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
        const durationSec = Math.max(0, skill.durationSec ?? 0);
        next = {
          ...next,
          activeSkillBuffs: [
            ...next.activeSkillBuffs,
            {
              id: skillId,
              magnitude: typeof effect.magnitude === "number" ? effect.magnitude : 1,
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
      const gemPowerUnlocked = state.gemPowerUnlocked;
      state = {
        ...createInitialState(facts),
        shards: quote.totalShardsAfter,
        abdications: state.abdications + 1,
        gemPowerUnlocked,
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
      // Memento claim sequencing is recovered separately from the base economy runtime.
      onCompleted?.();
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
