import type { IdleUpgradeDefinition } from "./idle";

export type IdleFactionRelation = "none" | "treaty" | "pact" | "alliance";
export type IdleFactionGpuCost = readonly [factionId: string, amount: number];

export interface IdleHeritageDefinition {
  id: string;
  name: string;
  factionId: string;
  costs: readonly IdleFactionGpuCost[];
}

function factionUpgrade(
  id: string,
  name: string,
  factionId: string,
  factionTier: 1 | 2 | 3,
  factionSlot: number,
  cost: number,
  icon?: string,
  extra: Readonly<Record<string, unknown>> = {},
): IdleUpgradeDefinition {
  return {
    id,
    name,
    factionId,
    factionTier,
    factionSlot,
    cost,
    icon,
    ...extra,
  };
}

const ELF_UPGRADES: readonly IdleUpgradeDefinition[] = [
  factionUpgrade("fu_elf_treaty", "ROCm 开源入场", "elf", 1, 0, 0),
  factionUpgrade("fu_elf_elven_mint", "性价比铸印", "elf", 1, 1, 5e7, "pocket-things-32"),
  factionUpgrade("fu_elf_sylvan_treasure_frills", "手搓内核优化", "elf", 1, 2, 5e8, "tool-05", { clickProductionSharePct: 140 }),
  factionUpgrade("fu_elf_ancient_clicking_arts", "内核调优手册", "elf", 1, 3, 5e9, "gadgets-26"),
  factionUpgrade("fu_elf_pact", "Instinct 加速卡", "elf", 2, 0, 0),
  factionUpgrade("fu_elf_elven_emissary", "开发者布道", "elf", 2, 1, 5e11, "drone-27"),
  factionUpgrade("fu_elf_elven_efficiency", "蒸馏产线提效", "elf", 2, 2, 5e12, "genetics-32"),
  factionUpgrade("fu_elf_secret_clicking_techniques", "汇编级微调", "elf", 2, 3, 5e13, "pocket-things-02"),
  factionUpgrade("fu_elf_alliance", "开放计算联盟", "elf", 3, 0, 0),
  factionUpgrade("fu_elf_elven_diplomacy", "批量议价", "elf", 3, 1, 5e15, "pocket-things-19"),
  factionUpgrade("fu_elf_elven_luck", "良率彩票", "elf", 3, 2, 5e16, "vegetation-34"),
  factionUpgrade("fu_elf_elven_treasure_casing", "跑分招牌", "elf", 3, 3, 5e17, "artefact-19"),
  factionUpgrade("fu_elf_price_performance", "性价比", "elf", 3, 4, 5e18, "gadgets-15"),
];

const ANGEL_UPGRADES: readonly IdleUpgradeDefinition[] = [
  factionUpgrade("fu_angel_treaty", "CUDA 生态签约", "angel", 1, 0, 0),
  factionUpgrade("fu_angel_holy_bells", "时钟域同步", "angel", 1, 1, 5e7, "pocket-things-20"),
  factionUpgrade("fu_angel_angelic_determination", "推理预算燃烧", "angel", 1, 2, 5e8, "resources-bulk-14"),
  factionUpgrade("fu_angel_angel_feathers", "流式输出代币", "angel", 1, 3, 5e9, "pocket-things-31"),
  factionUpgrade("fu_angel_pact", "DGX 优先供货", "angel", 2, 0, 0),
  factionUpgrade("fu_angel_guardian_angels", "NVLink 互联织网", "angel", 2, 1, 5e11, "implant-18"),
  factionUpgrade("fu_angel_angelic_wisdom", "持久化 KV 缓存", "angel", 2, 2, 5e12, "implant-23", { skillDurationBonus: 0.75 }),
  factionUpgrade("fu_angel_archangel_feathers", "全栈 CUDA 加速", "angel", 2, 3, 5e13, "resources-bulk-28"),
  factionUpgrade("fu_angel_alliance", "数据中心整包", "angel", 3, 0, 0),
  factionUpgrade("fu_angel_magical_gates", "显存扩容", "angel", 3, 1, 5e15, "resources-free-22"),
  factionUpgrade("fu_angel_angelic_dominance", "Tensor Core 霸权", "angel", 3, 2, 5e16, "resources-bulk-34", { skillMagnitudeBonus: 3 }),
  factionUpgrade("fu_angel_wings_of_liberty", "百万上下文窗口", "angel", 3, 3, 5e17, "gadgets-25"),
  factionUpgrade("fu_angel_compute_hegemony", "算力霸权", "angel", 3, 4, 5e18, "drone-01"),
];

const GOBLIN_UPGRADES: readonly IdleUpgradeDefinition[] = [
  factionUpgrade("fu_goblin_treaty", "Ontel 砍价入场", "goblin", 1, 0, 0),
  factionUpgrade("fu_goblin_strong_currency", "硬通货", "goblin", 1, 1, 5e7, "resources-38"),
  factionUpgrade("fu_goblin_slave_trading", "算力套利", "goblin", 1, 2, 5e8, "resources-bulk-12"),
  factionUpgrade("fu_goblin_cheap_materials", "退役机架回收", "goblin", 1, 3, 5e9, "pocket-things-13"),
  factionUpgrade("fu_goblin_pact", "Ontel 走量协议", "goblin", 2, 0, 0),
  factionUpgrade("fu_goblin_fools_gold", "虚标算力", "goblin", 2, 1, 5e11, "resources-free-39"),
  factionUpgrade("fu_goblin_economists", "FLOPs 会计", "goblin", 2, 2, 5e12, "resources-bulk-24"),
  factionUpgrade("fu_goblin_hobgoblin_gladiators", "压榨调度器", "goblin", 2, 3, 5e13, "resources-08"),
  factionUpgrade("fu_goblin_alliance", "Ontel 开源生态", "goblin", 3, 0, 0),
  factionUpgrade("fu_goblin_central_bank", "算力清算所", "goblin", 3, 1, 5e15, "pocket-things-34"),
  factionUpgrade("fu_goblin_black_market", "灰色市场", "goblin", 3, 2, 5e16, "pocket-things-35"),
  factionUpgrade("fu_goblin_green_fingers_discount", "捡漏返利", "goblin", 3, 3, 5e8, "pocket-things-33"),
  factionUpgrade("fu_goblin_underdog", "后发优势", "goblin", 3, 4, 5e18, "drone-38"),
];

const DEMON_UPGRADES: readonly IdleUpgradeDefinition[] = [
  factionUpgrade("fu_demon_treaty", "Ringo 围墙落锁", "demon", 1, 0, 0),
  factionUpgrade("fu_demon_torture_chambers", "压力测试舱", "demon", 1, 1, 5e7, "artefact-07"),
  factionUpgrade("fu_demon_infernal_magic", "底层魔法", "demon", 1, 2, 5e8, "artifact-10"),
  factionUpgrade("fu_demon_burning_legion", "自研军团", "demon", 1, 3, 5e9, "drone-21"),
  factionUpgrade("fu_demon_pact", "Ringo 制程跃迁", "demon", 2, 0, 0),
  factionUpgrade("fu_demon_lava_pits", "统一内存池", "demon", 2, 1, 5e11, "resources-free-32"),
  factionUpgrade("fu_demon_demon_overseers", "认证督导", "demon", 2, 2, 5e12, "artefact-05"),
  factionUpgrade("fu_demon_demonic_presence", "品牌统治力", "demon", 2, 3, 5e13, "resources-bulk-38"),
  factionUpgrade("fu_demon_alliance", "Ringo 闭环帝国", "demon", 3, 0, 0),
  factionUpgrade("fu_demon_devil_tyrant", "封闭暴政", "demon", 3, 1, 5e15, "artifact-11"),
  factionUpgrade("fu_demon_evil_conquerors", "市场收割", "demon", 3, 2, 5e16, "resources-25"),
  factionUpgrade("fu_demon_very_bad_guys", "压轴旗舰", "demon", 3, 3, 5e17, "artefact-04"),
  factionUpgrade("fu_demon_vertical_integration", "垂直整合", "demon", 3, 4, 5e18, "resources-bulk-40"),
];

export const DEFAULT_IDLE_FACTION_UPGRADES: readonly IdleUpgradeDefinition[] = [
  ...ELF_UPGRADES,
  ...ANGEL_UPGRADES,
  ...GOBLIN_UPGRADES,
  ...DEMON_UPGRADES,
];

export const DEFAULT_IDLE_HERITAGES: readonly IdleHeritageDefinition[] = [
  { id: "elven", name: "BMD 性价比血统", factionId: "elf", costs: [["elf", 0]] },
  { id: "angelic", name: "Nvidiy 生态根基", factionId: "angel", costs: [["angel", 0]] },
  { id: "goblin", name: "Ontel 议价直觉", factionId: "goblin", costs: [["goblin", 0]] },
  { id: "demonic", name: "Ringo 制程世代", factionId: "demon", costs: [["demon", 0]] },
  {
    id: "liuxing",
    name: "流形 稳态本能",
    factionId: "liuxing",
    costs: [
      ["angel", 15_000],
      ["goblin", 15_000],
    ],
  },
];

const MEMENTO_NAMES: readonly [id: string, name: string][] = [
  ["memento_paper_sailboat", "纸船"],
  ["memento_hourglass", "凝固沙漏"],
  ["memento_raindrop_pendant", "雨滴挂坠"],
  ["memento_chess_piece", "西洋棋子"],
  ["memento_drift_bottle", "漂流瓶"],
  ["memento_blank_letter", "空白的信"],
  ["memento_key", "钥匙"],
  ["memento_black_box", "黑匣子"],
  ["memento_compass", "司南"],
  ["memento_scalpel", "手术刀"],
  ["memento_radio", "收音机"],
  ["memento_gift_box", "礼物"],
  ["memento_bedtime_stories", "睡前故事集"],
];

export const DEFAULT_IDLE_MEMENTO_UPGRADES: readonly IdleUpgradeDefinition[] =
  MEMENTO_NAMES.map(([id, name], index) => ({
    id,
    name,
    icon: id,
    factionId: "liuxing",
    factionTier: 1,
    factionSlot: index + 1,
    cost: 0,
  }));

export const IDLE_MEMENTO_COUNT = DEFAULT_IDLE_MEMENTO_UPGRADES.length;
export const IDLE_MEMENTO_CLAIM_GAP_MS = 5_000;
export const IDLE_MEMENTO_FLOOR_BASE = 100;
export const IDLE_MEMENTO_FLOOR_GROWTH = 100;
export const IDLE_MANIFOLD_COMPLETE_FACT = "idle.manifold_complete";

const RELATION_RANK: Readonly<Record<IdleFactionRelation, number>> = {
  none: 0,
  treaty: 1,
  pact: 2,
  alliance: 3,
};

const RELATION_MARKERS: Readonly<Record<number, string>> = {
  1: "treaty",
  2: "pact",
  3: "alliance",
};

const STANDARD_MARKER_COST: Readonly<Record<number, number>> = { 1: 20, 2: 100, 3: 500 };
const NEUTRAL_MARKER_COST: Readonly<Record<number, number>> = { 1: 250, 2: 1_000, 3: 4_000 };

export function isIdleMementoId(id: string): boolean {
  return id.startsWith("memento_");
}

export function isIdleFactionRelationUpgrade(upgrade: IdleUpgradeDefinition): boolean {
  return !isIdleMementoId(upgrade.id) && (upgrade.factionSlot ?? 0) === 0 && (upgrade.factionTier ?? 0) >= 1;
}

export function idleFactionRelation(
  upgrades: Readonly<Record<string, boolean>>,
  affiliatedFaction: string | null,
  factionId: string,
): IdleFactionRelation {
  if (upgrades[`fu_${factionId}_alliance`]) return "alliance";
  if (upgrades[`fu_${factionId}_pact`]) return "pact";
  if (upgrades[`fu_${factionId}_treaty`] || affiliatedFaction === factionId) return "treaty";
  return "none";
}

export function idleFactionGpuCosts(
  factionId: string,
  tier: number,
): readonly IdleFactionGpuCost[] {
  if (factionId === "liuxing") {
    const amount = NEUTRAL_MARKER_COST[tier] ?? 0;
    return [
      ["angel", amount],
      ["goblin", amount],
    ];
  }
  return [[factionId, STANDARD_MARKER_COST[tier] ?? 0]];
}

export function hasIdleGpuCosts(
  factionCoins: Readonly<Record<string, number>>,
  costs: readonly IdleFactionGpuCost[],
): boolean {
  return costs.every(([factionId, amount]) => (factionCoins[factionId] ?? 0) >= amount);
}

export function spendIdleGpuCosts(
  factionCoins: Readonly<Record<string, number>>,
  costs: readonly IdleFactionGpuCost[],
): Readonly<Record<string, number>> {
  const next = { ...factionCoins };
  for (const [factionId, amount] of costs) next[factionId] = (next[factionId] ?? 0) - amount;
  return next;
}

export function isIdleFactionUpgradeAvailable(
  state: {
    currentAlignment: string | null;
    affiliatedFaction: string | null;
    upgrades: Readonly<Record<string, boolean>>;
  },
  upgrade: IdleUpgradeDefinition,
  factionAlignment: string | undefined,
): boolean {
  const factionId = upgrade.factionId;
  const tier = upgrade.factionTier ?? 0;
  if (!factionId || tier < 1 || tier > 3 || state.upgrades[upgrade.id] || isIdleMementoId(upgrade.id)) return false;

  const relation = idleFactionRelation(state.upgrades, state.affiliatedFaction, factionId);
  if (isIdleFactionRelationUpgrade(upgrade)) {
    if (tier === 1) {
      return state.affiliatedFaction === null && state.currentAlignment !== null && factionAlignment === state.currentAlignment;
    }
    return state.affiliatedFaction === factionId && RELATION_RANK[relation] === tier - 1;
  }

  return state.affiliatedFaction === factionId && RELATION_RANK[relation] >= tier;
}

export function factionProgressionComplete(
  factionId: string,
  purchased: Readonly<Record<string, boolean>>,
  upgrades: readonly IdleUpgradeDefinition[] = DEFAULT_IDLE_FACTION_UPGRADES,
): boolean {
  const factionUpgrades = upgrades.filter(
    (upgrade) => upgrade.factionId === factionId && !isIdleMementoId(upgrade.id) && (upgrade.factionTier ?? 0) >= 1,
  );
  return factionUpgrades.length > 0 && factionUpgrades.every((upgrade) => purchased[upgrade.id]);
}

export function isIdleHeritageAvailable(
  state: {
    everAlliedFactions: Readonly<Record<string, boolean>>;
    heritagesUnlocked: Readonly<Record<string, boolean>>;
    heritagesPurchased: Readonly<Record<string, boolean>>;
  },
  heritage: IdleHeritageDefinition,
): boolean {
  if (state.heritagesPurchased[heritage.id]) return false;
  return !!(
    state.everAlliedFactions[heritage.factionId] ||
    state.heritagesUnlocked[heritage.factionId] ||
    state.heritagesUnlocked[heritage.id]
  );
}

export function idleMementoComputeFloor(claimedMementoCount: number): number {
  return claimedMementoCount === 0
    ? 0
    : IDLE_MEMENTO_FLOOR_BASE * IDLE_MEMENTO_FLOOR_GROWTH ** claimedMementoCount;
}

export function availableIdleMementoIndex(
  state: { claimedMementoCount: number; lastMementoClaimAtMs: number; compute: number },
  atMs: number,
): number | null {
  const index = state.claimedMementoCount;
  if (index >= IDLE_MEMENTO_COUNT) return null;
  if (index > 0 && atMs - state.lastMementoClaimAtMs < IDLE_MEMENTO_CLAIM_GAP_MS) return null;
  if (state.compute < idleMementoComputeFloor(index)) return null;
  return index;
}
