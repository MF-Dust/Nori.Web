import type { IdleUpgradeDefinition } from "./idle";

type MilestoneTuple = readonly [threshold: number, multiplier: number, cost: number];

function milestones(
  prefix: string,
  targetGen: string,
  rows: readonly MilestoneTuple[],
): IdleUpgradeDefinition[] {
  return rows.map(([ownedThreshold, multiplier, cost]) => ({
    id: `${prefix}_t${ownedThreshold}`,
    targetGen,
    ownedThreshold,
    multiplier,
    cost,
    grantsThread: ownedThreshold === 5 || ownedThreshold === 25,
  }));
}

const BASE_A: readonly MilestoneTuple[] = [
  [5, 2, 200],
  [25, 3, 6_580],
  [75, 4, 10_701_870],
  [150, 5, 509_021_403_840],
  [200, 6, 689_506_040_247_800],
  [300, 5, 971_635_460_882_488_900_000],
  [400, 4, 1.3311720227069476e27],
  [500, 3, 1.786529384526473e33],
];

const BASE_B: readonly MilestoneTuple[] = [
  [5, 2, 2_510],
  [25, 3, 82_300],
  [75, 4, 133_773_240],
  [150, 5, 6_362_767_548_000],
  [200, 6, 8_618_825_503_097_450],
  [300, 5, 1.2145443261031108e22],
  [400, 4, 1.6639650283836847e28],
  [500, 3, 2.233161730658091e34],
];

const BASE_C: readonly MilestoneTuple[] = [
  [5, 2, 12_070],
  [25, 3, 395_020],
  [75, 4, 642_111_630],
  [150, 5, 30_541_284_230_480],
  [200, 6, 41_370_362_414_867_800],
  [300, 5, 5.829812765294933e22],
  [400, 4, 7.987032136241686e28],
];

const TIER_1: readonly MilestoneTuple[] = [
  [5, 2, 36_200],
  [25, 2, 1_185_080],
  [75, 2, 1_926_334_860],
  [150, 2, 91_623_852_691_440],
  [200, 2, 124_111_087_244_603_360],
  [300, 3, 1.74894382958848e23],
  [400, 3, 2.3961096408725062e29],
];

const TIER_2: readonly MilestoneTuple[] = [
  [5, 2, 112_640],
  [25, 2, 3_686_920],
  [75, 2, 5_993_041_830],
  [150, 2, 285_051_986_151_200],
  [200, 2, 386_123_382_538_766_000],
  [300, 3, 5.4411585809419375e23],
  [400, 3, 7.454563327158906e29],
];

const TIER_3: readonly MilestoneTuple[] = [
  [5, 2, 764_320],
  [25, 2, 25_018_400],
  [75, 2, 40_667_069_490],
  [150, 2, 1_934_281_334_597_280],
  [200, 2, 2_620_122_952_941_626_400],
  [300, 3, 3.6922147513534576e24],
  [400, 3, 5.058453686286401e30],
];

const TIER_4: readonly MilestoneTuple[] = [
  [5, 2, 8_890_200],
  [25, 2, 291_003_540],
  [75, 2, 473_022_229_350],
  [150, 2, 22_498_746_049_789_640],
  [200, 2, 30_476_166_978_952_600_000],
  [300, 3, 4.2946287371006e25],
  [400, 3, 5.883780340364709e31],
];

const TIER_5: readonly MilestoneTuple[] = [
  [5, 2, 146_829_070],
  [25, 2, 4_806_167_080],
  [75, 2, 7_812_358_086_660],
  [150, 2, 371_585_624_804_217_700],
  [200, 2, 503_339_409_380_891_360_000],
  [300, 3, 7.092938864442169e26],
  [400, 3, 9.717555765760719e32],
];

const TIER_6: readonly MilestoneTuple[] = [
  [5, 2, 2_916_467_920],
  [25, 2, 95_464_962_600],
  [75, 2, 155_176_975_693_800],
  [150, 2, 7_380_810_355_700_216_000],
  [200, 2, 9.997837583593048e21],
  [300, 3, 1.4088714182796088e28],
  [400, 3, 1.930199432925074e34],
];

const TIER_7: readonly MilestoneTuple[] = [
  [5, 2, 64_363_430_000],
  [25, 2, 2_106_812_967_660],
  [75, 2, 3_424_595_325_656_130],
  [150, 2, 162_886_849_229_246_170_000],
  [200, 2, 2.2064193287929484e23],
  [300, 3, 3.109233474823964e29],
];

/**
 * Source-owned copy of the shipped generator milestone table. Equilibrium
 * generators deliberately have no rows in this baseline table; their paradigm
 * progression is handled by the separate manifold/memento path.
 */
export const DEFAULT_IDLE_GENERATOR_UPGRADES: readonly IdleUpgradeDefinition[] = [
  ...milestones("b01", "token", BASE_A),
  ...milestones("b02", "server", BASE_B),
  ...milestones("b03", "compute_cluster", BASE_C),

  ...milestones("b05", "data_flywheel", TIER_1),
  ...milestones("b06", "long_reasoning_chain", TIER_2),
  ...milestones("b07", "dl_framework", TIER_3),
  ...milestones("b08", "neural_interconnect", TIER_4),
  ...milestones("b09", "supercompute_center", TIER_5),
  ...milestones("b10", "recursive_self_improvement", TIER_6),
  ...milestones("b11", "singularity_gate", TIER_7),

  ...milestones("b12", "refined_dataset", TIER_1),
  ...milestones("b13", "supervised_reasoning_chain", TIER_2),
  ...milestones("b14", "guardian_daemon", TIER_3),
  ...milestones("b15", "value_test_matrix", TIER_4),
  ...milestones("b16", "interpretability_core", TIER_5),
  ...milestones("b17", "full_feature_atlas", TIER_6),
  ...milestones("b18", "terminal_lockdown", TIER_7),
];

export function getIdleGeneratorUpgradeMultiplier(
  generatorId: string,
  purchased: Readonly<Record<string, boolean>>,
  upgrades: readonly IdleUpgradeDefinition[] = DEFAULT_IDLE_GENERATOR_UPGRADES,
): number {
  let multiplier = 1;
  for (const upgrade of upgrades) {
    if (
      upgrade.targetGen === generatorId &&
      purchased[upgrade.id] &&
      typeof upgrade.multiplier === "number"
    ) {
      multiplier *= upgrade.multiplier;
    }
  }
  return multiplier;
}

export function isIdleGeneratorUpgradeAvailable(
  upgrade: IdleUpgradeDefinition,
  state: { owned: Readonly<Record<string, number>>; upgrades: Readonly<Record<string, boolean>> },
): boolean {
  if (!upgrade.targetGen || state.upgrades[upgrade.id]) return false;
  return (state.owned[upgrade.targetGen] ?? 0) >= (upgrade.ownedThreshold ?? 0);
}
