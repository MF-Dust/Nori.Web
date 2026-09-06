import type {
  IdleGeneratorDefinition,
  IdleRunPresentationState,
  IdleUpgradeDefinition,
} from "./idle";

export type IdleGenericUpgradeKind = "plain" | "secret" | "certificate" | "treasure" | "memory";

export interface IdleGenericProgressState {
  compute: number;
  maxComputeThisRun: number;
  currentRunComputeProduced: number;
  currentEraSeconds: number;
  productiveClicks: number;
  computeGainedByClicking: number;
  factionCoinsFoundThisEra: number;
  shortRunAbdications: number;
  gemPowerUnlocked: boolean;
  hasBuiltThisEra: boolean;
  anyActionThisEra: boolean;
  lifetimeAlignmentSeconds: Readonly<Record<string, number>>;
  royalExchanges: Readonly<Record<string, number>>;
  heritagesPurchased: Readonly<Record<string, boolean>>;
  everAlliedFactions: Readonly<Record<string, boolean>>;
  facts: Readonly<Record<string, boolean>>;
  owned: Readonly<Record<string, number>>;
  upgrades: Readonly<Record<string, boolean>>;
}

function genericUpgrade(
  id: string,
  name: string,
  description: string,
  icon: string,
  cost: number,
  extra: Readonly<Record<string, unknown>> = {},
): IdleUpgradeDefinition {
  return { id, name, description, icon, cost, ...extra };
}

/** The five shipped cache-vein upgrades share the same multiplicative click effect. */
export const IDLE_TREASURE_CLICKING_IDS = [
  "filled_treasure",
  "rich_treasure",
  "wealthy_treasure",
  "opulent_treasure",
  "overflowing_treasure",
] as const;

/**
 * Generic / secret / certificate / treasure rows recovered from the shipped Nori Idle pack.
 *
 * Fields intentionally mirror the NormalApp pack parser (`nP`) so the runtime can consume
 * this catalog without inventing a second progression schema. `productionPct` and
 * `treasureClickMultiplier` make the separate shipped scalar-effect tables explicit in
 * source while preserving their exact values.
 */
export const DEFAULT_IDLE_GENERIC_UPGRADES: readonly IdleUpgradeDefinition[] = [
  genericUpgrade(
    "unitary",
    "独热",
    "本轮拥有至少一个算力源后解锁。全算力源产出 +11.11111111%。",
    "pocket-things-40",
    1_111,
    { unlockTrophyId: "unitary_trophy", productionPct: 11.11111111 },
  ),
  genericUpgrade(
    "suggestion_master",
    "提示词大师",
    "单轮持续 3 分钟后解锁。全算力源产出 +43%。",
    "gadgets-39",
    1_000,
    { unlockTrophyId: "suggestion_master_trophy", productionPct: 43 },
  ),
  genericUpgrade(
    "advisor_insight",
    "思维链顿悟",
    "单轮点击 100 次后解锁。全算力源产出 +10%。",
    "resources-free-33",
    1e28,
    { unlockTrophyId: "ui_tip_trophy", productionPct: 10 },
  ),
  genericUpgrade(
    "rewind",
    "检查点回滚",
    "单轮算力达到 1.00e27 后解锁。全算力源产出 +8%。",
    "jewelry-34",
    1e27,
    { unlockTrophyId: "rewind_trophy", productionPct: 8 },
  ),
  genericUpgrade(
    "building_hater",
    "纯手工标注",
    "单轮不购买任何算力源并达到 100,000 算力后解锁。点击奖励 +25%。",
    "genetics-38",
    1,
    { unlockTrophyId: "building_hater_trophy", clickMultiplierPct: 25 },
  ),
  genericUpgrade(
    "glho_kohhl_snod",
    "glho kohhl snod",
    "仅通过点击获得 1,000,000 算力后解锁。点击奖励 +50%。",
    "artefact-20",
    1_000,
    { unlockTrophyId: "glho_kohhl_snod_trophy", clickMultiplierPct: 50 },
  ),
  genericUpgrade(
    "speed_run",
    "五分钟速通",
    "不使用共鸣之力，在 5 分钟内达到 1,000,000 算力后解锁。每次点击获得 +1,000,000 算力。",
    "resources-22",
    1,
    { unlockTrophyId: "speed_run_trophy", clickFlatAdd: 1_000_000 },
  ),
  genericUpgrade(
    "because_i_like_to_grind",
    "我就喜欢刷数据",
    "单轮持续 1 小时后解锁。每次在交易所兑换 GPU，永久产出加成 +1%。",
    "tool-15",
    1_000,
    { unlockTrophyId: "because_i_like_to_grind_trophy", royalExchangeBonusAddPct: 1 },
  ),
  genericUpgrade(
    "exchange_master",
    "蒸馏宗师",
    "每次在交易所兑换 GPU 时，获得的永久产出加成额外 +5。单轮在交易所兑换 GPU 100 次后解锁。",
    "genetics-09",
    5e29,
    { unlockTrophyId: "exchange_master_trophy", royalExchangeBonusAddPct: 5 },
  ),
  genericUpgrade(
    "faction_grinder",
    "供应链整合",
    "GPU 发现率 +2 个百分点。单轮购买四家厂商的全部传承后解锁。",
    "gadgets-23",
    1e6,
    { unlockTrophyId: "faction_grinder_trophy", fcChanceAddPct: 2 },
  ),
  genericUpgrade(
    "grand_diplomat",
    "首席外交官",
    "GPU 发现率 +2 个百分点。与四家厂商至少各结盟一次后解锁。",
    "clothes-04",
    1,
    { unlockTrophyId: "grand_diplomat_trophy", fcChanceAddPct: 2 },
  ),
  genericUpgrade(
    "faction_run",
    "供应链冲刺",
    "GPU 发现率 +10 个百分点。不使用共鸣之力，在 5 分钟内找到 1,500,000 个 GPU 后解锁。",
    "resources-12",
    1,
    { unlockTrophyId: "faction_run_trophy", fcChanceAddPct: 10 },
  ),
  genericUpgrade(
    "perfectly_good",
    "完美加速",
    "保持加速立场时，加速算力源产出 +50%。保持加速立场满 33 分钟后解锁。",
    "resources-07",
    1e25,
    {
      unlockTrophyId: "perfectly_good_trophy",
      alignmentProductionPct: 50,
      alignmentProductionGate: "accelerate",
    },
  ),
  genericUpgrade(
    "diabolical_evil",
    "绝对安全",
    "保持减速立场时，减速算力源产出 +50%。保持减速立场满 66 分钟后解锁。",
    "headphones-glasses-36",
    1e25,
    {
      unlockTrophyId: "diabolical_evil_trophy",
      alignmentProductionPct: 50,
      alignmentProductionGate: "decelerate",
    },
  ),
  genericUpgrade(
    "need_a_head_start",
    "需要点冷启动?",
    "购买后立即获得 25 算力。连续 5 分钟不执行任何操作后解锁。",
    "vegetation-30",
    0,
    {
      unlockTrophyId: "need_a_head_start_trophy",
      onPurchaseGrant: { kind: "gold", amount: 25 },
    },
  ),
  genericUpgrade(
    "stoic_resistance",
    "过拟合",
    "购买后立即获得 1.00e16 算力。本轮算力达到 1.00e27 后解锁。",
    "clothes-16",
    0,
    {
      unlockTrophyId: "stoic_resistance_trophy",
      onPurchaseGrant: { kind: "gold", amount: 1e16 },
    },
  ),
  genericUpgrade(
    "heroic_certificate",
    "跑分登顶",
    "保持加速立场时，加速算力源产出 +100%。",
    "artifact-05",
    1e14,
    { alignmentProductionPct: 100, alignmentProductionGate: "accelerate", alignCountThreshold: 250 },
  ),
  genericUpgrade(
    "heroic_validation",
    "蝉联榜首",
    "保持加速立场时，加速算力源产出 +100%。",
    "artifact-18",
    1e20,
    { alignmentProductionPct: 100, alignmentProductionGate: "accelerate", alignCountThreshold: 500 },
  ),
  genericUpgrade(
    "heroic_affirmation",
    "断层第一",
    "保持加速立场时，加速算力源产出 +100%。",
    "artefact-09",
    1e30,
    { alignmentProductionPct: 100, alignmentProductionGate: "accelerate", alignCountThreshold: 750 },
  ),
  genericUpgrade(
    "villainous_certificate",
    "安全认证",
    "保持减速立场时，减速算力源产出 +100%。",
    "gadgets-21",
    1e14,
    { alignmentProductionPct: 100, alignmentProductionGate: "decelerate", alignCountThreshold: 250 },
  ),
  genericUpgrade(
    "villainous_validation",
    "第三方审计",
    "保持减速立场时，减速算力源产出 +100%。",
    "gadgets-28",
    1e20,
    { alignmentProductionPct: 100, alignmentProductionGate: "decelerate", alignCountThreshold: 500 },
  ),
  genericUpgrade(
    "villainous_affirmation",
    "公开承诺",
    "保持减速立场时，减速算力源产出 +100%。",
    "gadgets-24",
    1e30,
    { alignmentProductionPct: 100, alignmentProductionGate: "decelerate", alignCountThreshold: 750 },
  ),
  genericUpgrade(
    "filled_treasure",
    "充盈的缓存矿脉",
    "点击产出 ×1.25，五项此类升级的加成彼此相乘。单轮累计产出达到 5,000 算力后解锁。",
    "resources-19",
    1e4,
    { coinsEarnedReq: 5e3, treasureClickMultiplier: 1.25 },
  ),
  genericUpgrade(
    "rich_treasure",
    "富集的缓存矿脉",
    "点击产出 ×1.25，五项此类升级的加成彼此相乘。单轮累计产出达到 5,000,000 算力后解锁。",
    "resources-13",
    5e7,
    { coinsEarnedReq: 5e6, treasureClickMultiplier: 1.25 },
  ),
  genericUpgrade(
    "wealthy_treasure",
    "丰沃的缓存矿脉",
    "点击产出 ×1.25，五项此类升级的加成彼此相乘。单轮累计产出达到 5.00e9 算力后解锁。",
    "resources-37",
    1e11,
    { coinsEarnedReq: 5e9, treasureClickMultiplier: 1.25 },
  ),
  genericUpgrade(
    "opulent_treasure",
    "奢盈的缓存矿脉",
    "点击产出 ×1.25，五项此类升级的加成彼此相乘。单轮累计产出达到 5.00e12 算力后解锁。",
    "resources-03",
    1.5e14,
    { coinsEarnedReq: 5e12, treasureClickMultiplier: 1.25 },
  ),
  genericUpgrade(
    "overflowing_treasure",
    "漫溢的缓存矿脉",
    "点击产出 ×1.25，五项此类升级的加成彼此相乘。单轮累计产出达到 5.00e15 算力后解锁。",
    "artifact-12",
    2e17,
    { coinsEarnedReq: 5e15, treasureClickMultiplier: 1.25 },
  ),
];

export function idleGenericUpgradeKind(upgrade: IdleUpgradeDefinition): IdleGenericUpgradeKind {
  if (upgrade.unlockFact) return "memory";
  if (upgrade.unlockTrophyId) return "secret";
  if (typeof upgrade.alignCountThreshold === "number" && upgrade.alignCountThreshold > 0) {
    return "certificate";
  }
  if ((IDLE_TREASURE_CLICKING_IDS as readonly string[]).includes(upgrade.id)) return "treasure";
  return "plain";
}

function totalRoyalExchanges(state: IdleGenericProgressState): number {
  return Object.values(state.royalExchanges).reduce((sum, count) => sum + (count ?? 0), 0);
}

/** Exact shipped secret-trophy predicates used to expose generic upgrades. */
export function isIdleSecretTrophyUnlocked(
  state: IdleGenericProgressState,
  trophyId: string,
): boolean {
  switch (trophyId) {
    case "unitary_trophy":
      return state.maxComputeThisRun > 0;
    case "exchange_master_trophy":
      return totalRoyalExchanges(state) >= 100;
    case "perfectly_good_trophy":
      return (state.lifetimeAlignmentSeconds.accelerate ?? 0) >= 1_980;
    case "diabolical_evil_trophy":
      return (state.lifetimeAlignmentSeconds.decelerate ?? 0) >= 3_960;
    case "faction_grinder_trophy":
      return Object.keys(state.heritagesPurchased).length >= 4;
    case "grand_diplomat_trophy":
      return ["elf", "angel", "goblin", "demon"].every(
        (factionId) => !!state.everAlliedFactions[factionId],
      );
    case "faction_run_trophy":
      return (
        state.currentEraSeconds <= 300 &&
        state.factionCoinsFoundThisEra >= 1_500_000 &&
        !state.gemPowerUnlocked
      );
    case "building_hater_trophy":
      return state.compute >= 100_000 && !state.hasBuiltThisEra;
    case "need_a_head_start_trophy":
      return state.currentEraSeconds >= 300 && !state.anyActionThisEra;
    case "speed_run_trophy":
      return state.maxComputeThisRun >= 1_000_000 && state.currentEraSeconds < 300 && !state.gemPowerUnlocked;
    case "rewind_trophy":
      return state.maxComputeThisRun >= 1e27;
    case "suggestion_master_trophy":
      return state.currentEraSeconds >= 180;
    case "glho_kohhl_snod_trophy":
      return state.computeGainedByClicking >= 1_000_000;
    case "ui_tip_trophy":
      return state.productiveClicks >= 100;
    case "rule_dis_trophy":
      return state.shortRunAbdications >= 10;
    case "because_i_like_to_grind_trophy":
      return state.currentEraSeconds >= 3_600;
    case "stoic_resistance_trophy":
      return state.maxComputeThisRun >= 1e27;
    default:
      return false;
  }
}

function alignedBuildingCount(
  state: IdleGenericProgressState,
  generators: readonly IdleGeneratorDefinition[],
  alignment: string,
): number {
  let total = 0;
  for (const generator of generators) {
    if (generator.alignment === alignment) total += state.owned[generator.id] ?? 0;
  }
  return total;
}

/** Visibility gate recovered from the shipped `YCe`/generic-upgrade availability path. */
export function isIdleGenericUpgradeUnlocked(
  state: IdleGenericProgressState,
  upgrade: IdleUpgradeDefinition,
  generators: readonly IdleGeneratorDefinition[],
): boolean {
  switch (idleGenericUpgradeKind(upgrade)) {
    case "memory":
      return !!(upgrade.unlockFact && state.facts[upgrade.unlockFact]);
    case "secret":
      return !!(upgrade.unlockTrophyId && isIdleSecretTrophyUnlocked(state, upgrade.unlockTrophyId));
    case "certificate": {
      const gate = typeof upgrade.alignmentProductionGate === "string"
        ? upgrade.alignmentProductionGate
        : undefined;
      const threshold = typeof upgrade.alignCountThreshold === "number"
        ? upgrade.alignCountThreshold
        : undefined;
      if (!gate || !threshold) return true;
      return alignedBuildingCount(state, generators, gate) >= threshold;
    }
    case "treasure": {
      const requirement = typeof upgrade.coinsEarnedReq === "number" ? upgrade.coinsEarnedReq : upgrade.cost;
      return state.currentRunComputeProduced >= requirement;
    }
    default:
      return true;
  }
}

/** Purchase gate common to shipped generic upgrades after their visibility predicate passes. */
export function isIdleGenericUpgradePurchasable(
  state: IdleGenericProgressState,
  upgrade: IdleUpgradeDefinition,
  generators: readonly IdleGeneratorDefinition[],
): boolean {
  if (state.upgrades[upgrade.id] || upgrade.factionId) return false;
  return isIdleGenericUpgradeUnlocked(state, upgrade, generators) && state.compute >= upgrade.cost;
}

function purchasedNumericEffect(
  state: Pick<IdleGenericProgressState, "upgrades">,
  upgrades: readonly IdleUpgradeDefinition[],
  field: string,
): number {
  let total = 0;
  for (const upgrade of upgrades) {
    if (!state.upgrades[upgrade.id]) continue;
    const value = upgrade[field];
    if (typeof value === "number") total += value;
  }
  return total;
}

/** Shipped scalar `prod_all` effects are additive percentage terms before becoming one multiplier. */
export function idleGenericGlobalProductionMultiplier(
  state: Pick<IdleGenericProgressState, "upgrades">,
  upgrades: readonly IdleUpgradeDefinition[] = DEFAULT_IDLE_GENERIC_UPGRADES,
): number {
  return 1 + purchasedNumericEffect(state, upgrades, "productionPct") / 100;
}

/** Shipped alignment-gated effects multiply independently after the common production terms. */
export function idleGenericAlignmentProductionMultiplier(
  state: Pick<IdleGenericProgressState, "upgrades">,
  generator: IdleGeneratorDefinition,
  upgrades: readonly IdleUpgradeDefinition[] = DEFAULT_IDLE_GENERIC_UPGRADES,
): number {
  let multiplier = 1;
  for (const upgrade of upgrades) {
    if (!state.upgrades[upgrade.id]) continue;
    if (upgrade.alignmentProductionGate !== generator.alignment) continue;
    const percent = upgrade.alignmentProductionPct;
    if (typeof percent === "number" && percent !== 0) multiplier *= 1 + percent / 100;
  }
  return multiplier;
}

export function idleGenericClickFlatAdd(
  state: Pick<IdleGenericProgressState, "upgrades">,
  upgrades: readonly IdleUpgradeDefinition[] = DEFAULT_IDLE_GENERIC_UPGRADES,
): number {
  return purchasedNumericEffect(state, upgrades, "clickFlatAdd");
}

export function idleGenericClickMultiplier(
  state: Pick<IdleGenericProgressState, "upgrades">,
  upgrades: readonly IdleUpgradeDefinition[] = DEFAULT_IDLE_GENERIC_UPGRADES,
): number {
  let multiplier = 1;
  for (const upgrade of upgrades) {
    if (!state.upgrades[upgrade.id]) continue;
    const percent = upgrade.clickMultiplierPct;
    if (typeof percent === "number" && percent !== 0) multiplier *= 1 + percent / 100;
  }
  return multiplier;
}

/** Shipped treasure lane is exactly 1.25^N for the five purchased cache-vein upgrades. */
export function idleTreasureClickMultiplier(
  state: Pick<IdleGenericProgressState, "upgrades">,
): number {
  let count = 0;
  for (const upgradeId of IDLE_TREASURE_CLICKING_IDS) {
    if (state.upgrades[upgradeId]) count += 1;
  }
  return count === 0 ? 1 : 1.25 ** count;
}

export function idleGenericFactionCoinChanceAddPct(
  state: Pick<IdleGenericProgressState, "upgrades">,
  upgrades: readonly IdleUpgradeDefinition[] = DEFAULT_IDLE_GENERIC_UPGRADES,
): number {
  return purchasedNumericEffect(state, upgrades, "fcChanceAddPct");
}

export function idleGenericRoyalExchangeBonusAddPct(
  state: Pick<IdleGenericProgressState, "upgrades">,
  upgrades: readonly IdleUpgradeDefinition[] = DEFAULT_IDLE_GENERIC_UPGRADES,
): number {
  return purchasedNumericEffect(state, upgrades, "royalExchangeBonusAddPct");
}

/** Compute granted immediately by the shipped generic-upgrade purchase path. */
export function idleGenericPurchaseGrantCompute(upgrade: IdleUpgradeDefinition): number {
  const grant = upgrade.onPurchaseGrant;
  if (!grant || typeof grant !== "object") return 0;
  const record = grant as Readonly<Record<string, unknown>>;
  return record.kind === "gold" && typeof record.amount === "number" ? record.amount : 0;
}

/** Adapter for callers that only hold the current public presentation state. */
export function asIdleGenericPresentationState(
  state: IdleRunPresentationState,
  extra: Omit<IdleGenericProgressState, keyof IdleRunPresentationState>,
): IdleGenericProgressState {
  return { ...state, ...extra };
}
