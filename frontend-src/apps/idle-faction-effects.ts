import type { IdleGeneratorDefinition } from "./idle";
import { IDLE_HELL_PORTAL_GENERATOR_ID } from "./idle-assistants";

export type IdleFactionEffectCurveKind = "const" | "poly" | "log";

export interface IdleFactionEffectCurve {
  base: number;
  coeff: number;
  exp: number;
  inner?: number;
}

export type IdleFactionEffectStat =
  | { name: "const" }
  | { name: "productiveClicks" }
  | { name: "lifetimeProductiveClicks" }
  | { name: "alignedBuildings"; param: string }
  | { name: "totalBuildings" }
  | { name: "factionCoinsFound" }
  | { name: "compute" }
  | { name: "minDecelBuilding" }
  | { name: "buildingPeak"; param: string }
  | { name: "assistants" }
  | { name: "hellPortals" }
  | { name: "lifetimeAlignmentSeconds"; param: string };

export type IdleFactionEffectTarget =
  | "all"
  | { alignment: string }
  | { ids: readonly string[] };

export interface IdleFactionProductionEffect {
  id: string;
  target: IdleFactionEffectTarget;
  stat: IdleFactionEffectStat;
  curveKind: IdleFactionEffectCurveKind;
  curve: IdleFactionEffectCurve;
}

export interface IdleFactionProductionState {
  compute: number;
  productiveClicks: number;
  lifetimeProductiveClicks: number;
  factionCoinsFoundThisEra: number;
  skillCastsThisEra: number;
  upgrades: Readonly<Record<string, boolean>>;
  owned: Readonly<Record<string, number>>;
  lifetimeMaxOwned: Readonly<Record<string, number>>;
  lifetimeAlignmentSeconds: Readonly<Record<string, number>>;
}

export interface IdleFactionProductionContext {
  generators: readonly IdleGeneratorDefinition[];
  assistants: number;
}

export const IDLE_EVIL_FORTRESS_GENERATOR_ID = "full_feature_atlas";
export const IDLE_NECROPOLIS_GENERATOR_ID = "interpretability_core";
export const IDLE_SINGULARITY_GATE_GENERATOR_ID = "singularity_gate";

/** Exact shipped `ly` curve evaluator. */
export function evaluateIdleFactionEffectCurve(
  kind: IdleFactionEffectCurveKind,
  curve: IdleFactionEffectCurve,
  value: number,
): number {
  const input = Math.max(0, value);
  switch (kind) {
    case "const":
      return curve.base;
    case "poly":
      return curve.base + curve.coeff * input ** curve.exp;
    case "log":
      return curve.base + curve.coeff * ((curve.inner ?? 1) * Math.log(1 + input)) ** curve.exp;
  }
}

/**
 * Shipped advanced faction production-effect table. `shape` is intentionally
 * omitted: the production path never consumes it; it is presentation metadata.
 * Matching effect percentages are summed and converted to one multiplier.
 */
export const IDLE_FACTION_PRODUCTION_EFFECTS: readonly IdleFactionProductionEffect[] = [
  {
    id: "fu_elf_secret_clicking_techniques",
    target: "all",
    stat: { name: "productiveClicks" },
    curveKind: "poly",
    curve: { base: 0, coeff: 3, exp: 0.5 },
  },
  {
    id: "fu_elf_elven_emissary",
    target: { alignment: "accelerate" },
    stat: { name: "alignedBuildings", param: "accelerate" },
    curveKind: "poly",
    curve: { base: 0, coeff: 0.3, exp: 0.6 },
  },
  {
    id: "fu_elf_ancient_clicking_arts",
    target: "all",
    stat: { name: "lifetimeProductiveClicks" },
    curveKind: "log",
    curve: { base: 0, coeff: 0.75, exp: 1.5, inner: 1 },
  },
  {
    id: "fu_angel_compute_hegemony",
    target: "all",
    stat: { name: "alignedBuildings", param: "accelerate" },
    curveKind: "poly",
    curve: { base: 0, coeff: 20, exp: 1.15, inner: 1 },
  },
  {
    id: "fu_angel_holy_bells",
    target: { ids: [IDLE_SINGULARITY_GATE_GENERATOR_ID] },
    stat: { name: "alignedBuildings", param: "accelerate" },
    curveKind: "poly",
    curve: { base: 0, coeff: 25, exp: 1.1 },
  },
  {
    id: "fu_angel_angelic_determination",
    target: "all",
    stat: { name: "totalBuildings" },
    curveKind: "log",
    curve: { base: 0, coeff: 80, exp: 1.4, inner: 1 },
  },
  {
    id: "fu_angel_guardian_angels",
    target: { ids: ["neural_interconnect"] },
    stat: { name: "alignedBuildings", param: "accelerate" },
    curveKind: "poly",
    curve: { base: 40, coeff: 80, exp: 0.6 },
  },
  {
    id: "fu_angel_archangel_feathers",
    target: "all",
    stat: { name: "const" },
    curveKind: "log",
    curve: { base: 40, coeff: 0, exp: 0, inner: 1 },
  },
  {
    id: "fu_angel_magical_gates",
    target: "all",
    stat: { name: "const" },
    curveKind: "poly",
    curve: { base: 15, coeff: 1, exp: 0.7 },
  },
  {
    id: "fu_goblin_slave_trading",
    target: "all",
    stat: { name: "alignedBuildings", param: "decelerate" },
    curveKind: "poly",
    curve: { base: 0, coeff: 20, exp: 0.95 },
  },
  {
    id: "fu_goblin_cheap_materials",
    target: "all",
    stat: { name: "totalBuildings" },
    curveKind: "log",
    curve: { base: 10, coeff: 12, exp: 1.5, inner: 1 },
  },
  {
    id: "fu_goblin_hobgoblin_gladiators",
    target: "all",
    stat: { name: "factionCoinsFound" },
    curveKind: "log",
    curve: { base: 0, coeff: 4, exp: 2, inner: 1 },
  },
  {
    id: "fu_goblin_economists",
    target: "all",
    stat: { name: "compute" },
    curveKind: "log",
    curve: { base: 15, coeff: 3, exp: 1.25, inner: 1 },
  },
  {
    id: "fu_demon_vertical_integration",
    target: "all",
    stat: { name: "minDecelBuilding" },
    curveKind: "poly",
    curve: { base: 2, coeff: 2200, exp: 1, inner: 1 },
  },
  {
    id: "fu_demon_evil_conquerors",
    target: "all",
    stat: { name: "buildingPeak", param: IDLE_HELL_PORTAL_GENERATOR_ID },
    curveKind: "poly",
    curve: { base: 0, coeff: 4, exp: 0.8 },
  },
  {
    id: "fu_demon_torture_chambers",
    target: { ids: [IDLE_EVIL_FORTRESS_GENERATOR_ID] },
    stat: { name: "assistants" },
    curveKind: "log",
    curve: { base: 0, coeff: 7, exp: 3.5, inner: 1 },
  },
  {
    id: "fu_demon_demon_overseers",
    target: { ids: [IDLE_EVIL_FORTRESS_GENERATOR_ID, IDLE_HELL_PORTAL_GENERATOR_ID] },
    stat: { name: "hellPortals" },
    curveKind: "poly",
    curve: { base: 16, coeff: 4, exp: 0.8 },
  },
  {
    id: "fu_demon_very_bad_guys",
    target: { ids: [IDLE_HELL_PORTAL_GENERATOR_ID] },
    stat: { name: "alignedBuildings", param: "decelerate" },
    curveKind: "poly",
    curve: { base: 10, coeff: 0.7, exp: 0.7 },
  },
  {
    id: "fu_demon_devil_tyrant",
    target: { ids: [IDLE_EVIL_FORTRESS_GENERATOR_ID, IDLE_HELL_PORTAL_GENERATOR_ID] },
    stat: { name: "lifetimeAlignmentSeconds", param: "decelerate" },
    curveKind: "poly",
    curve: { base: 0, coeff: 1.5, exp: 0.5 },
  },
  {
    id: "fu_demon_infernal_magic",
    target: "all",
    stat: { name: "alignedBuildings", param: "decelerate" },
    curveKind: "poly",
    curve: { base: 3, coeff: 6, exp: 0.9 },
  },
  {
    id: "fu_demon_demonic_presence",
    target: "all",
    stat: { name: "const" },
    curveKind: "log",
    curve: { base: 100, coeff: 4, exp: 4, inner: 1 },
  },
];

function totalBuildings(state: IdleFactionProductionState): number {
  return Object.values(state.owned).reduce((sum, count) => sum + Math.max(0, count ?? 0), 0);
}

function alignedBuildings(
  state: IdleFactionProductionState,
  generators: readonly IdleGeneratorDefinition[],
  alignment: string,
): number {
  let total = 0;
  for (const generator of generators) {
    if (generator.alignment === alignment) total += Math.max(0, state.owned[generator.id] ?? 0);
  }
  return total;
}

function minimumLowTierDecelerationBuildings(
  state: IdleFactionProductionState,
  generators: readonly IdleGeneratorDefinition[],
): number {
  const lowTier = [...generators]
    .filter((generator) => generator.alignment === "decelerate")
    .sort((left, right) => left.baseCost - right.baseCost)
    .slice(0, 4);
  let minimum = Number.POSITIVE_INFINITY;
  for (const generator of lowTier) minimum = Math.min(minimum, state.owned[generator.id] ?? 0);
  return Number.isFinite(minimum) ? Math.max(0, minimum) : 0;
}

export function idleFactionEffectStatValue(
  stat: IdleFactionEffectStat,
  state: IdleFactionProductionState,
  context: IdleFactionProductionContext,
): number {
  switch (stat.name) {
    case "const":
      return 0;
    case "productiveClicks":
      return Math.max(0, state.productiveClicks);
    case "lifetimeProductiveClicks":
      return Math.max(0, state.lifetimeProductiveClicks);
    case "alignedBuildings":
      return alignedBuildings(state, context.generators, stat.param);
    case "totalBuildings":
      return totalBuildings(state);
    case "factionCoinsFound":
      return Math.max(0, state.factionCoinsFoundThisEra);
    case "compute":
      return Math.max(0, state.compute);
    case "minDecelBuilding":
      return minimumLowTierDecelerationBuildings(state, context.generators);
    case "buildingPeak":
      return Math.max(0, state.lifetimeMaxOwned[stat.param] ?? 0);
    case "assistants":
      return Math.max(0, context.assistants);
    case "hellPortals":
      return Math.max(0, state.owned[IDLE_HELL_PORTAL_GENERATOR_ID] ?? 0);
    case "lifetimeAlignmentSeconds":
      return Math.max(0, state.lifetimeAlignmentSeconds[stat.param] ?? 0);
  }
}

export function idleFactionEffectTargetsGenerator(
  target: IdleFactionEffectTarget,
  generator: IdleGeneratorDefinition,
): boolean {
  if (target === "all") return true;
  if ("alignment" in target) return generator.alignment === target.alignment;
  return target.ids.includes(generator.id);
}

/** Exact shipped `DCe`: sum matching advanced-faction percentages, then apply once. */
export function idleFactionProductionMultiplier(
  state: IdleFactionProductionState,
  generator: IdleGeneratorDefinition,
  context: IdleFactionProductionContext,
  effects: readonly IdleFactionProductionEffect[] = IDLE_FACTION_PRODUCTION_EFFECTS,
): number {
  let percent = 0;
  for (const effect of effects) {
    if (!state.upgrades[effect.id] || !idleFactionEffectTargetsGenerator(effect.target, generator)) continue;
    const stat = idleFactionEffectStatValue(effect.stat, state, context);
    percent += evaluateIdleFactionEffectCurve(effect.curveKind, effect.curve, stat);
  }
  return 1 + percent / 100;
}

/** Shipped fixed base-rate additions (`P7`). They apply before percentage multipliers. */
export function idleFactionBaseRateAdd(
  state: Pick<IdleFactionProductionState, "upgrades">,
  generatorId: string,
): number {
  let add = 0;
  if (state.upgrades.fu_demon_lava_pits) {
    if (generatorId === IDLE_EVIL_FORTRESS_GENERATOR_ID) add += 900_000;
    if (generatorId === IDLE_HELL_PORTAL_GENERATOR_ID) add += 8_800_000;
  }
  if (state.upgrades.fu_angel_guardian_angels && generatorId === "neural_interconnect") {
    add += 98_000;
  }
  return add;
}

/** Shipped `SRe` custom formula, separate from the generic production-effect table. */
export function idleWingsOfLibertyMultiplier(
  state: Pick<IdleFactionProductionState, "upgrades" | "skillCastsThisEra">,
): number {
  if (!state.upgrades.fu_angel_wings_of_liberty) return 1;
  return 1 + (4 * Math.max(0, state.skillCastsThisEra) ** 0.5) / 100;
}
