import { ArrowUpRight, Brain, Handshake, Sparkles } from "lucide-react";
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
import { IdleIcon } from "./idle-icon";

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
  testId?: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      data-test={testId}
      disabled={purchased || !enabled || !onClick}
      onClick={onClick}
      className="relative flex min-h-12 w-full items-center gap-2 border-2 bg-black/65 p-1.5 text-left disabled:cursor-default"
      style={{
        borderColor: purchased ? "rgba(255,255,255,.16)" : `${tone}88`,
        color: purchased ? "rgba(255,255,255,.48)" : tone,
        opacity: !purchased && !enabled ? 0.55 : 1,
        boxShadow: purchased
          ? "inset -2px -2px 0 rgba(0,0,0,.5), inset 2px 2px 0 rgba(255,255,255,.04)"
          : `inset -2px -2px 0 rgba(0,0,0,.55), inset 2px 2px 0 ${tone}22`,
      }}
      title={[name, detail, purchased ? "已拥有" : cost].filter(Boolean).join(" · ")}
    >
      <div
        className="grid size-8 shrink-0 place-items-center border"
        style={{ borderColor: purchased ? "rgba(255,255,255,.12)" : `${tone}77` }}
      >
        {icon ? <IdleIcon name={icon} className="size-6" /> : <ArrowUpRight className="size-4" />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1 text-[10px] font-semibold">
          <span className="min-w-0 flex-1 truncate">{name}</span>
          {!purchased && enabled ? <ArrowUpRight className="size-3 shrink-0" /> : null}
        </div>
        {detail ? <div className="mt-0.5 truncate text-[9px] text-white/60">{detail}</div> : null}
        <div className="truncate text-[9px] tabular-nums text-white/50">
          {purchased ? "已拥有" : cost ?? ""}
        </div>
      </div>
    </button>
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
    "buyUpgrade" | "buyFactionUpgrade" | "buyHeritage" | "buyGemPower" | "claimMemento"
  >;
  snapshot: IdlePresentationSnapshot;
}) {
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
    <div className="pointer-events-auto flex min-h-0 flex-1 flex-col overflow-y-auto pr-1">
      <div className="mb-1 flex items-center gap-1 text-[9px] uppercase tracking-[0.16em] text-amber-200/65">
        <Sparkles className="size-3" /> 可购
      </div>

      {hasAvailableRows ? (
        <div className="flex flex-col gap-1">
          {nextMemento ? (
            <ProgressionCard
              name={nextMemento.name ?? nextMemento.id}
              detail={`流形记忆 ${nextMementoIndex! + 1}/${DEFAULT_IDLE_MEMENTO_UPGRADES.length}`}
              cost={`算力门槛 ${formatDesktopCompute(idleMementoComputeFloor(nextMementoIndex!))}`}
              tone="#67e8f9"
              icon={nextMemento.icon}
              enabled
              testId={`memento-${nextMemento.id}`}
              onClick={() => runtime.claimMemento()}
            />
          ) : null}

          {hasGemPowerRow ? (
            <ProgressionCard
              name="共鸣之力"
              detail="每点共鸣提高总产量与 GPU 发现率"
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
                icon={upgrade.icon}
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
        <div className="flex items-center gap-1.5 py-1 text-[10px] text-white/60">
          {snapshot.state.affiliatedFaction === "liuxing" ? <Brain className="size-3" /> : <Handshake className="size-3" />}
          尚未浮现，继续推进算力。
        </div>
      )}

      {hasOwnedRows ? (
        <>
          <div className="mb-1 mt-2 text-[9px] uppercase tracking-[0.16em] text-white/35">已拥有</div>
          <div className="grid grid-cols-2 gap-1">
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
