import { ArrowUpRight } from "lucide-react";
import { useMemo } from "react";
import type {
  IdlePresentationModel,
  IdlePresentationSnapshot,
  IdleUpgradeDefinition,
} from "../apps/idle";
import { isIdleGeneratorUpgradeAvailable } from "../apps/idle-upgrades";
import { formatDesktopCompute } from "../state/compute-runtime";

function UpgradeCard({
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
    <button
      type="button"
      data-test={`upgrade-${upgrade.id}`}
      disabled={purchased || !onBuy || !affordable}
      onClick={onBuy}
      className="relative flex min-h-12 w-full items-center gap-2 border-2 bg-black/65 p-1.5 text-left disabled:cursor-default"
      style={{
        borderColor: purchased ? "rgba(255,255,255,.16)" : `${tone}88`,
        color: purchased ? "rgba(255,255,255,.48)" : tone,
        opacity: !purchased && !affordable ? 0.55 : 1,
        boxShadow: purchased
          ? "inset -2px -2px 0 rgba(0,0,0,.5), inset 2px 2px 0 rgba(255,255,255,.04)"
          : `inset -2px -2px 0 rgba(0,0,0,.55), inset 2px 2px 0 ${tone}22`,
      }}
      title={
        purchased
          ? `${generator?.name ?? upgrade.targetGen ?? upgrade.id} · 已拥有`
          : `${generator?.name ?? upgrade.targetGen ?? upgrade.id} 达到 ${threshold} 个后解锁，产出 ×${multiplier}`
      }
    >
      <div
        className="grid size-8 shrink-0 place-items-center border text-[10px] font-semibold tabular-nums"
        style={{ borderColor: purchased ? "rgba(255,255,255,.12)" : `${tone}77` }}
      >
        {threshold}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1 text-[10px] font-semibold">
          <span className="min-w-0 flex-1 truncate">{generator?.name ?? upgrade.id}</span>
          {!purchased ? <ArrowUpRight className="size-3 shrink-0" /> : null}
        </div>
        <div className="mt-0.5 text-[9px] tabular-nums text-white/60">
          产出 ×{multiplier}
        </div>
        <div className="text-[9px] tabular-nums text-white/50">
          {purchased ? "已拥有" : `成本 ${formatDesktopCompute(upgrade.cost)}`}
        </div>
      </div>
    </button>
  );
}

export function IdleUpgradeList({
  runtime,
  snapshot,
}: {
  runtime: Pick<IdlePresentationModel, "buyUpgrade">;
  snapshot: IdlePresentationSnapshot;
}) {
  const definitions = snapshot.upgrades ?? [];
  const { available, owned } = useMemo(() => {
    const availableRows: IdleUpgradeDefinition[] = [];
    const ownedRows: IdleUpgradeDefinition[] = [];

    for (const upgrade of definitions) {
      if (!upgrade.targetGen || upgrade.factionId) continue;
      if (snapshot.state.upgrades[upgrade.id]) {
        ownedRows.push(upgrade);
      } else if (isIdleGeneratorUpgradeAvailable(upgrade, snapshot.state)) {
        availableRows.push(upgrade);
      }
    }

    availableRows.sort((left, right) => left.cost - right.cost);
    ownedRows.sort((left, right) => {
      const a = left.ownedThreshold ?? 0;
      const b = right.ownedThreshold ?? 0;
      return a - b;
    });
    return { available: availableRows, owned: ownedRows };
  }, [definitions, snapshot.state]);

  if (available.length === 0 && owned.length === 0) return null;

  return (
    <div className="pointer-events-auto flex min-h-0 flex-1 flex-col overflow-y-auto pr-1">
      {available.length > 0 ? (
        <>
          <div className="mb-1 text-[9px] uppercase tracking-[0.16em] text-amber-200/65">升级</div>
          <div className="flex flex-col gap-1">
            {available.map((upgrade) => (
              <UpgradeCard
                key={upgrade.id}
                upgrade={upgrade}
                snapshot={snapshot}
                onBuy={() => runtime.buyUpgrade(upgrade.id)}
              />
            ))}
          </div>
        </>
      ) : null}

      {owned.length > 0 ? (
        <>
          <div className="mb-1 mt-2 text-[9px] uppercase tracking-[0.16em] text-white/35">已拥有</div>
          <div className="grid grid-cols-2 gap-1">
            {owned.map((upgrade) => (
              <UpgradeCard key={upgrade.id} upgrade={upgrade} snapshot={snapshot} />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
