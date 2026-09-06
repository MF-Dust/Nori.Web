export interface IdleMementoProductionEffect {
  id: string;
  productionPct: number;
}

/**
 * Exact shipped Liu Xing memento production constants. The historical runtime
 * treats every claimed memento as an independent multiplicative percentage
 * term: `multiplier *= 1 + productionPct / 100`.
 */
export const IDLE_MEMENTO_PRODUCTION_EFFECTS: readonly IdleMementoProductionEffect[] = [
  { id: "memento_paper_sailboat", productionPct: 9_900 },
  { id: "memento_hourglass", productionPct: 21_444 },
  { id: "memento_raindrop_pendant", productionPct: 46_316 },
  { id: "memento_chess_piece", productionPct: 99_900 },
  { id: "memento_drift_bottle", productionPct: 215_343 },
  { id: "memento_blank_letter", productionPct: 464_059 },
  { id: "memento_key", productionPct: 999_900 },
  { id: "memento_black_box", productionPct: 2_154_335 },
  { id: "memento_compass", productionPct: 4_641_489 },
  { id: "memento_scalpel", productionPct: 9_999_900 },
  { id: "memento_radio", productionPct: 21_544_247 },
  { id: "memento_gift_box", productionPct: 46_415_788 },
  { id: "memento_bedtime_stories", productionPct: 99_999_900 },
];

export function idleMementoProductionMultiplier(
  upgrades: Readonly<Record<string, boolean>>,
  effects: readonly IdleMementoProductionEffect[] = IDLE_MEMENTO_PRODUCTION_EFFECTS,
): number {
  let multiplier = 1;
  for (const effect of effects) {
    if (upgrades[effect.id]) multiplier *= 1 + effect.productionPct / 100;
  }
  return multiplier;
}
