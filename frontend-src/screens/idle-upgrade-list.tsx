import { useMemo } from "react";
import {
  IDLE_MANIFOLD_UNLOCKED_FACT,
  type IdlePresentationModel,
  type IdlePresentationSnapshot,
  type IdleRunPresentationState,
  type IdleUpgradeDefinition,
} from "../apps/idle";
import {
  DEFAULT_IDLE_HERITAGES,
  DEFAULT_IDLE_MEMENTO_UPGRADES,
  availableIdleMementoIndex,
  hasIdleGpuCosts,
  idleFactionGpuCosts,
  idleMementoComputeFloor,
  isIdleFactionRelationUpgrade,
  isIdleFactionUpgradeAvailable,
  isIdleHeritageAvailable,
  isIdleMementoId,
  type IdleFactionGpuCost,
} from "../apps/idle-faction-progression";
import {
  DEFAULT_IDLE_GENERIC_UPGRADES,
  idleGenericUpgradeKind,
  isIdleGenericUpgradeUnlocked,
  type IdleGenericProgressState,
} from "../apps/idle-generic-upgrades";
import { isIdleGeneratorUpgradeAvailable } from "../apps/idle-upgrades";
import { formatDesktopCompute } from "../state/compute-runtime";
import { FactionMarks, IdleSlot, MementoGlass, PixelHeading, ThresholdBadge } from "./idle-chrome";
import { IdleIcon } from "./idle-icon";
import { useIdleCue } from "./idle-cue-context";

const FACTION_ALIGNMENT: Readonly<Record<string, string>> = {
  elf: "accelerate",
  angel: "accelerate",
  goblin: "decelerate",
  demon: "decelerate",
  liuxing: "equilibrium",
};
const GENERIC_UPGRADE_IDS = new Set(DEFAULT_IDLE_GENERIC_UPGRADES.map((upgrade) => upgrade.id));

function genericProgressState(state: IdleRunPresentationState): IdleGenericProgressState {
  return {
    compute: state.compute,
    maxComputeThisRun: state.maxComputeThisRun,
    currentRunComputeProduced: state.currentRunComputeProduced ?? 0,
    currentEraSeconds: state.currentEraSeconds ?? 0,
    productiveClicks: state.productiveClicks ?? 0,
    computeGainedByClicking: state.computeGainedByClicking ?? 0,
    factionCoinsFoundThisEra: state.factionCoinsFoundThisEra ?? 0,
    shortRunAbdications: state.shortRunAbdications ?? 0,
    gemPowerUnlocked: state.gemPowerUnlocked,
    hasBuiltThisEra: state.hasBuiltThisEra ?? false,
    anyActionThisEra: state.anyActionThisEra ?? false,
    lifetimeAlignmentSeconds: state.lifetimeAlignmentSeconds ?? {},
    royalExchanges: state.royalExchanges,
    heritagesPurchased: state.heritagesPurchased,
    everAlliedFactions: state.everAlliedFactions,
    facts: state.facts,
    owned: state.owned,
    upgrades: state.upgrades,
  };
}

function genericKindLabel(upgrade: IdleUpgradeDefinition): string {
  switch (idleGenericUpgradeKind(upgrade)) {
    case "secret":
      return "隐藏升级";
    case "certificate":
      return "立场证书";
    case "treasure":
      return "缓存矿脉";
    case "memory":
      return "记忆升级";
    default:
      return "通用升级";
  }
}

function gpuCostLabel(
  costs: readonly IdleFactionGpuCost[],
  snapshot: IdlePresentationSnapshot,
): string {
  return costs
    .map(([factionId, amount]) => {
      const faction = snapshot.factions.find((candidate) => candidate.id === factionId);
      return `${formatDesktopCompute(amount)} ${faction?.name ?? factionId} GPU`;
    })
    .join(" + ");
}

function ProgressionCard({
  name,
  detail,
  cost,
  tone,
  icon,
  purchased = false,
  enabled = false,
  glass = false,
  threshold,
  tier,
  testId,
  onClick,
}: {
  name: string;
  detail?: string;
  cost?: string;
  tone: string;
  icon?: string;
  purchased?: boolean;
  enabled?: boolean;
  glass?: boolean;
  threshold?: number;
  tier?: number;
  testId?: string;
  onClick?: () => void;
}) {
  return (
    <IdleSlot
      tooltip={<div className="flex flex-col gap-1">
        <div className="pixel-fs-lg font-semibold">{name}</div>
        {detail ? <div className="pixel-fs-sm opacity-80">{detail}</div> : null}
        {!purchased && cost ? <div className="pixel-fs-sm font-mono tabular-nums">{cost}</div> : null}
        {purchased ? <div className="pixel-fs-sm italic opacity-70">已拥有</div> : null}
      </div>}
      tooltipClassName={glass ? "pixel-tooltip-glass" : undefined}
      purchased={purchased}
      affordable={enabled}
      bloom={glass}
      borderColor={tone}
      testId={testId}
      label={name}
      onClick={onClick}
    >
      {glass && icon ? <MementoGlass name={icon} claimed={purchased} /> : <>
        {icon ? <IdleIcon name={icon} className="size-full" /> : <span className="pixel-fs-sm">{name.slice(0, 1)}</span>}
        {typeof threshold === "number" ? <ThresholdBadge threshold={threshold} /> : null}
        {typeof tier === "number" ? <FactionMarks tier={tier} color={tone} /> : null}
      </>}
    </IdleSlot>
  );
}

function GeneratorUpgradeCard({
  upgrade,
  snapshot,
  onBuy,
}: {
  upgrade: IdleUpgradeDefinition;
  snapshot: IdlePresentationSnapshot;
  onBuy?: () => void;
}) {
  const purchased = !!snapshot.state.upgrades[upgrade.id];
  const generator = snapshot.generators.find((item) => item.id === upgrade.targetGen);
  const threshold = upgrade.ownedThreshold ?? 0;
  const multiplier = upgrade.multiplier ?? 1;
  const affordable = snapshot.state.compute >= upgrade.cost;
  const tone = generator?.accent ?? "#fbbf24";
  return (
    <ProgressionCard
      name={generator?.name ?? upgrade.id}
      detail={`${threshold} 个 · 产出 ×${multiplier}`}
      cost={`成本 ${formatDesktopCompute(upgrade.cost)}`}
      tone={tone}
      icon={generator?.icon}
      threshold={threshold}
      purchased={purchased}
      enabled={affordable}
      testId={`upgrade-${upgrade.id}`}
      onClick={onBuy}
    />
  );
}

export function IdleUpgradeList({
  runtime,
  snapshot,
}: {
  runtime: Pick<
    IdlePresentationModel,
    "buyUpgrade" | "buyFactionUpgrade" | "buyHeritage" | "buyGemPower" | "claimMemento" | "snapshot"
  >;
  snapshot: IdlePresentationSnapshot;
}) {
  const cue = useIdleCue();
  const definitions = snapshot.upgrades ?? [];
  const manifold = !!snapshot.state.facts[IDLE_MANIFOLD_UNLOCKED_FACT];
  const genericState = useMemo(() => genericProgressState(snapshot.state), [snapshot.state]);

  const generatorRows = useMemo(() => {
    const available: IdleUpgradeDefinition[] = [];
    const owned: IdleUpgradeDefinition[] = [];
    for (const upgrade of definitions) {
      if (!upgrade.targetGen || upgrade.factionId) continue;
      if (snapshot.state.upgrades[upgrade.id]) owned.push(upgrade);
      else if (!manifold && isIdleGeneratorUpgradeAvailable(upgrade, snapshot.state)) available.push(upgrade);
    }
    available.sort((left, right) => left.cost - right.cost);
    return { available, owned };
  }, [definitions, manifold, snapshot.state]);

  const genericRows = useMemo(() => {
    const available: IdleUpgradeDefinition[] = [];
    const owned: IdleUpgradeDefinition[] = [];
    for (const upgrade of definitions) {
      if (!GENERIC_UPGRADE_IDS.has(upgrade.id)) continue;
      if (snapshot.state.upgrades[upgrade.id]) owned.push(upgrade);
      else if (!manifold && isIdleGenericUpgradeUnlocked(genericState, upgrade, snapshot.generators)) {
        available.push(upgrade);
      }
    }
    available.sort((left, right) => left.cost - right.cost);
    return { available, owned };
  }, [definitions, genericState, manifold, snapshot.generators, snapshot.state.upgrades]);

  const factionRows = useMemo(() => {
    const available: IdleUpgradeDefinition[] = [];
    const owned: IdleUpgradeDefinition[] = [];
    for (const upgrade of definitions) {
      if (!upgrade.factionId || isIdleMementoId(upgrade.id)) continue;
      if (snapshot.state.upgrades[upgrade.id]) {
        owned.push(upgrade);
        continue;
      }
      if (
        !manifold &&
        isIdleFactionUpgradeAvailable(
          snapshot.state,
          upgrade,
          FACTION_ALIGNMENT[upgrade.factionId],
        )
      ) {
        available.push(upgrade);
      }
    }
    available.sort((left, right) => {
      const tier = (left.factionTier ?? 0) - (right.factionTier ?? 0);
      return tier !== 0 ? tier : (left.factionSlot ?? 0) - (right.factionSlot ?? 0);
    });
    return { available, owned };
  }, [definitions, manifold, snapshot.state]);

  const heritageRows = useMemo(() => {
    if (manifold) {
      return {
        available: [],
        owned: DEFAULT_IDLE_HERITAGES.filter((heritage) => snapshot.state.heritagesPurchased[heritage.id]),
      };
    }
    return {
      available: DEFAULT_IDLE_HERITAGES.filter((heritage) =>
        isIdleHeritageAvailable(snapshot.state, heritage),
      ),
      owned: DEFAULT_IDLE_HERITAGES.filter((heritage) => snapshot.state.heritagesPurchased[heritage.id]),
    };
  }, [manifold, snapshot.state]);

  const nextMementoIndex =
    snapshot.state.affiliatedFaction === "liuxing"
      ? availableIdleMementoIndex(snapshot.state, Date.now())
      : null;
  const nextMemento =
    nextMementoIndex == null ? null : DEFAULT_IDLE_MEMENTO_UPGRADES[nextMementoIndex] ?? null;
  const claimedMementos = DEFAULT_IDLE_MEMENTO_UPGRADES.filter(
    (memento) => snapshot.state.upgrades[memento.id],
  );

  const hasGemPowerRow = !manifold && (snapshot.state.gemPowerUnlocked || snapshot.state.shards >= 1);
  const hasAvailableRows =
    generatorRows.available.length > 0 ||
    genericRows.available.length > 0 ||
    factionRows.available.length > 0 ||
    heritageRows.available.length > 0 ||
    hasGemPowerRow ||
    nextMemento !== null;
  const hasOwnedRows =
    generatorRows.owned.length > 0 ||
    genericRows.owned.length > 0 ||
    factionRows.owned.length > 0 ||
    heritageRows.owned.length > 0 ||
    claimedMementos.length > 0;

  return (
    <div className="pointer-events-auto flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto pt-2 pr-1">
      {hasAvailableRows ? <PixelHeading>可购</PixelHeading> : null}

      {hasAvailableRows ? (
        <div className="grid grid-cols-5 gap-1">
          {nextMemento ? (
            <ProgressionCard
              name={nextMemento.name ?? nextMemento.id}
              detail={`流形记忆 ${nextMementoIndex! + 1}/${DEFAULT_IDLE_MEMENTO_UPGRADES.length}`}
              cost={`算力门槛 ${formatDesktopCompute(idleMementoComputeFloor(nextMementoIndex!))}`}
              tone="#67e8f9"
              icon={nextMemento.icon}
              glass
              enabled
              testId={`memento-${nextMemento.id}`}
              onClick={() => {
                // Shipped `rr`: the claim pitch climbs per memento; the last one completes the Manifold.
                const before = runtime.snapshot().state.claimedMementoCount;
                let completed = false;
                runtime.claimMemento(() => {
                  completed = true;
                });
                const after = runtime.snapshot().state.claimedMementoCount;
                if (after <= before) return;
                if (completed) cue("idle-memento-complete");
                else cue("idle-memento-claim", { pitch: 2 ** ((after - 1) / DEFAULT_IDLE_MEMENTO_UPGRADES.length / 2) });
              }}
            />
          ) : null}

          {hasGemPowerRow ? (
            <ProgressionCard
              name="共鸣之力"
              detail="每点共鸣提高总产量与 GPU 发现率"
              icon="lorc-brain.svg"
              cost="花费 1 算力 · 需要 1 共鸣"
              tone="#e879f9"
              purchased={snapshot.state.gemPowerUnlocked}
              enabled={!snapshot.state.gemPowerUnlocked && snapshot.state.compute >= 1 && snapshot.state.shards >= 1}
              testId="gem-power"
              onClick={() => runtime.buyGemPower()}
            />
          ) : null}

          {heritageRows.available.map((heritage) => {
            const costs = heritage.costs;
            const faction = snapshot.factions.find((candidate) => candidate.id === heritage.factionId);
            return (
              <ProgressionCard
                key={heritage.id}
                name={heritage.name}
                detail={`${faction?.name ?? heritage.factionId} 永久传承`}
                cost={gpuCostLabel(costs, snapshot)}
                tone={faction?.accent ?? "#fbbf24"}
                enabled={hasIdleGpuCosts(snapshot.state.factionCoins, costs)}
                testId={`heritage-${heritage.id}`}
                onClick={() => runtime.buyHeritage(heritage.id)}
              />
            );
          })}

          {genericRows.available.map((upgrade) => (
            <ProgressionCard
              key={upgrade.id}
              name={upgrade.name ?? upgrade.id}
              detail={upgrade.description ?? genericKindLabel(upgrade)}
              cost={`成本 ${formatDesktopCompute(upgrade.cost)}`}
              tone="#fbbf24"
              icon={upgrade.icon}
              enabled={snapshot.state.compute >= upgrade.cost}
              testId={`generic-upgrade-${upgrade.id}`}
              onClick={() => runtime.buyUpgrade(upgrade.id)}
            />
          ))}

          {factionRows.available.map((upgrade) => {
            const faction = snapshot.factions.find((candidate) => candidate.id === upgrade.factionId);
            const relation = isIdleFactionRelationUpgrade(upgrade);
            const gpuCosts = relation
              ? idleFactionGpuCosts(upgrade.factionId!, upgrade.factionTier ?? 1)
              : [];
            const affordable = relation
              ? hasIdleGpuCosts(snapshot.state.factionCoins, gpuCosts)
              : snapshot.state.compute >= upgrade.cost;
            return (
              <ProgressionCard
                key={upgrade.id}
                name={upgrade.name ?? upgrade.id}
                detail={`${faction?.name ?? upgrade.factionId} · T${upgrade.factionTier}`}
                cost={relation ? gpuCostLabel(gpuCosts, snapshot) : `成本 ${formatDesktopCompute(upgrade.cost)}`}
                tone={faction?.accent ?? "#fbbf24"}
                icon={upgrade.icon ?? faction?.icon}
                tier={upgrade.factionTier}
                enabled={affordable}
                testId={`faction-upgrade-${upgrade.id}`}
                onClick={() => runtime.buyFactionUpgrade(upgrade.id)}
              />
            );
          })}

          {generatorRows.available.map((upgrade) => (
            <GeneratorUpgradeCard
              key={upgrade.id}
              upgrade={upgrade}
              snapshot={snapshot}
              onBuy={() => runtime.buyUpgrade(upgrade.id)}
            />
          ))}
        </div>
      ) : (
        <p className="pixel-cjk pixel-fs-md flex items-center gap-2 text-[var(--px-white)]">
          <span aria-hidden="true" className="inline-block size-1.5 bg-[var(--px-white)] pixel-pulse" />
          {snapshot.state.affiliatedFaction === "liuxing" && claimedMementos.length >= DEFAULT_IDLE_MEMENTO_UPGRADES.length
            ? "已全部部署完成。"
            : "尚未浮现，继续点击。"}
        </p>
      )}

      {hasOwnedRows ? (
        <>
          <PixelHeading tone="muted">已拥有</PixelHeading>
          <div className="grid grid-cols-5 gap-1">
            {heritageRows.owned.map((heritage) => {
              const faction = snapshot.factions.find((candidate) => candidate.id === heritage.factionId);
              return (
                <ProgressionCard
                  key={heritage.id}
                  name={heritage.name}
                  detail="永久传承"
                  tone={faction?.accent ?? "#fbbf24"}
                  purchased
                />
              );
            })}
            {claimedMementos.map((memento) => (
              <ProgressionCard
                key={memento.id}
                name={memento.name ?? memento.id}
                detail="流形记忆"
                tone="#67e8f9"
                icon={memento.icon}
                glass
                purchased
              />
            ))}
            {genericRows.owned.map((upgrade) => (
              <ProgressionCard
                key={upgrade.id}
                name={upgrade.name ?? upgrade.id}
                detail={genericKindLabel(upgrade)}
                tone="#fbbf24"
                icon={upgrade.icon}
                purchased
              />
            ))}
            {factionRows.owned.map((upgrade) => {
              const faction = snapshot.factions.find((candidate) => candidate.id === upgrade.factionId);
              return (
                <ProgressionCard
                  key={upgrade.id}
                  name={upgrade.name ?? upgrade.id}
                  detail={`${faction?.name ?? upgrade.factionId} · T${upgrade.factionTier}`}
                  tone={faction?.accent ?? "#fbbf24"}
                  icon={upgrade.icon}
                  purchased
                />
              );
            })}
            {generatorRows.owned.map((upgrade) => (
              <GeneratorUpgradeCard key={upgrade.id} upgrade={upgrade} snapshot={snapshot} />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
