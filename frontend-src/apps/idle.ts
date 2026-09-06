import type { DesktopComputeState } from "../state/compute-runtime";

/** Batch choices exposed by the shipped Idle generator shop. */
export type IdleBuyCount = 1 | 10 | 100 | "smart" | "max";

export type IdleAlignment = "none" | "accelerate" | "decelerate" | "equilibrium";
export type IdleGeneratorAlignment = IdleAlignment | "universal";

export interface IdleGeneratorDefinition {
  id: string;
  name: string;
  description?: string;
  plural?: string;
  measure?: string;
  alignment: IdleGeneratorAlignment;
  baseCost: number;
  baseRate: number;
  costMult: number;
  icon?: string;
  accent?: string;
  growthWeight: number;
  dynamicRate: boolean;
}

export interface IdleAlignmentDefinition {
  id: IdleAlignment;
  proofName: string;
  short: string;
  description: string;
  flavor: string;
  cost: number;
  unlockFact?: string;
}

export interface IdleFactionDefinition {
  id: string;
  name: string;
  accent: string;
  icon?: string;
  readonly [key: string]: unknown;
}

/**
 * Skills keep pack-specific effect payloads source-owned while the shared
 * fields below mirror what the shipped Idle presentation reads directly.
 */
export interface IdleSkillDefinition {
  id: string;
  name?: string;
  description?: string;
  icon?: string;
  scope?: string;
  cooldownSec?: number;
  durationSec?: number;
  effect?: Readonly<Record<string, unknown>>;
  readonly [key: string]: unknown;
}

export interface IdleActiveSkillBuff {
  id: string;
  targetGenId?: string;
  magnitude?: number;
  remainingSec?: number;
  durationSec?: number;
  readonly [key: string]: unknown;
}

/** UI-facing subset of the shipped Idle run state. */
export interface IdleRunPresentationState {
  compute: number;
  maxComputeThisRun: number;
  currentAlignment: IdleAlignment | null;
  affiliatedFaction: string | null;
  shards: number;
  abdications: number;
  facts: Readonly<Record<string, boolean>>;
  owned: Readonly<Record<string, number>>;
  upgrades: Readonly<Record<string, boolean>>;
  factionCoins: Readonly<Record<string, number>>;
  royalExchanges: Readonly<Record<string, number>>;
  skillCooldownSec: Readonly<Record<string, number>>;
  activeSkillBuffs: readonly IdleActiveSkillBuff[];
}

export interface IdleClickResult {
  gained: number;
  isCombo: boolean;
  isCrit: boolean;
  isLucky: boolean;
  luckGain: number;
  factionCoinsFound: Readonly<Record<string, number>>;
}

/**
 * Generator row values are calculated by the economy runtime rather than the
 * React presentation. This preserves story formula overrides, base-rate bands,
 * upgrades and active-skill modifiers while keeping the source UI deterministic.
 */
export interface IdleGeneratorQuote {
  generatorId: string;
  owned: number;
  willBuy: number;
  totalCost: number;
  perUnitRate: number;
  totalRate: number;
}

export interface IdlePresentationSnapshot {
  state: IdleRunPresentationState;
  computeState: DesktopComputeState;
  generators: readonly IdleGeneratorDefinition[];
  alignments: readonly IdleAlignmentDefinition[];
  factions: readonly IdleFactionDefinition[];
  skills: readonly IdleSkillDefinition[];
  manifoldRevealApplied: boolean;
  persistedMaxCompute: number;
}

/**
 * Recovered public action surface of the shipped Idle Zustand store. Formula
 * implementation and persistence remain a separate runtime migration step.
 */
export interface IdleActionRuntime {
  click(): IdleClickResult;
  buy(generatorId: string, count?: IdleBuyCount): void;
  buyUpgrade(upgradeId: string): void;
  buyFactionUpgrade(upgradeId: string): void;
  buyHeritage(heritageId: string): void;
  buyRoyalExchange(factionId: string, count?: 1 | "max"): void;
  buyProof(alignmentId: IdleAlignment): void;
  fireSkill(skillId: string): number;
  setFacts(facts: ReadonlySet<string>): void;
  buyGemPower(): void;
  abdicate(): void;
  syncManifoldReveal(): boolean;
  claimMemento(onCompleted?: () => void): void;
  tick(seconds: number): void;
}

export interface IdlePresentationModel extends IdleActionRuntime {
  snapshot(): IdlePresentationSnapshot;
  subscribe(listener: () => void): () => void;
  quoteGenerator(generatorId: string, mode: IdleBuyCount): IdleGeneratorQuote | null;
}

export const IDLE_BUY_COUNTS: readonly IdleBuyCount[] = [1, 10, 100, "smart", "max"];

export const IDLE_BUY_COUNT_LABELS: Readonly<Record<IdleBuyCount, string>> = {
  1: "×1",
  10: "×10",
  100: "×100",
  smart: "智能",
  max: "最大",
};

/** Fact that closes the original no-unlockFact alignment choices in shipped Idle. */
export const IDLE_MANIFOLD_UNLOCKED_FACT = "arg.manifold_unlocked";

/** Shipped run persistence cadence. */
export const IDLE_SAVE_INTERVAL_MS = 5_000;

/** Shipped simulation/shell synchronization cadences. */
export const IDLE_TICK_INTERVAL_MS = 100;
export const IDLE_COMPUTE_SYNC_INTERVAL_MS = 500;
