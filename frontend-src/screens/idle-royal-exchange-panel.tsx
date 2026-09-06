import { ShoppingCart } from "lucide-react";
import { useMemo, useState } from "react";
import {
  IDLE_ROYAL_EXCHANGE_BUY_COUNTS,
  IDLE_ROYAL_EXCHANGE_BUY_COUNT_LABELS,
  type IdleFactionDefinition,
  type IdlePresentationModel,
  type IdlePresentationSnapshot,
  type IdleRoyalExchangeBuyCount,
  type IdleRoyalExchangeQuote,
} from "../apps/idle";
import { formatDesktopCompute } from "../state/compute-runtime";

function formatMultiplier(value: number): string {
  if (!Number.isFinite(value)) return String(value);
  return value < 10 ? value.toFixed(2).replace(/\.?0+$/, "") : formatDesktopCompute(value);
}

export function IdleRoyalExchangePanel({
  runtime,
  snapshot,
}: {
  runtime: Pick<IdlePresentationModel, "buyRoyalExchange" | "quoteRoyalExchange">;
  snapshot: IdlePresentationSnapshot;
}) {
  const [mode, setMode] = useState<IdleRoyalExchangeBuyCount>(1);
  const rows = useMemo(
    () =>
      snapshot.factions
        .map((faction) => ({
          faction,
          quote: runtime.quoteRoyalExchange(faction.id, mode),
        }))
        .filter(
          (row): row is { faction: IdleFactionDefinition; quote: IdleRoyalExchangeQuote } =>
            row.quote != null,
        ),
    [mode, runtime, snapshot.factions, snapshot.state.factionCoins, snapshot.state.royalExchanges],
  );

  if (rows.length === 0) return null;

  const totalTrades = Object.values(snapshot.state.royalExchanges).reduce(
    (sum, value) => sum + (value ?? 0),
    0,
  );
  const summary = rows[0].quote;

  return (
    <section
      data-test="royal-exchange-panel"
      className="border-2 border-amber-300 bg-black/95 text-white"
      style={{
        boxShadow:
          "inset -2px -2px 0 rgba(0,0,0,.6), inset 2px 2px 0 rgba(255,255,255,.06), 5px 5px 0 rgba(0,0,0,.7)",
      }}
    >
      <div className="px-2.5 py-2.5">
        <div className="flex items-center gap-1.5 text-[12px] font-semibold text-amber-300">
          <ShoppingCart className="size-3.5" strokeWidth={2.5} />
          GPU 交易所
        </div>
        <div className="mt-1 text-[10px] tabular-nums text-white/65">
          累计交易 {formatDesktopCompute(totalTrades)} 次，单次 +{formatDesktopCompute(summary.perTradePercent)}%，全局 ×{formatMultiplier(summary.totalMultiplier)}
        </div>
        <p className="mt-2 text-[10px] leading-snug text-white/60">
          非当前阵营的 GPU 可以用于升级产线，当前阵营的 GPU 则可以用来购买阵营升级。
        </p>

        <div className="mt-2 flex items-stretch gap-[2px] border-2 border-black bg-black p-[2px]">
          {IDLE_ROYAL_EXCHANGE_BUY_COUNTS.map((item) => (
            <button
              type="button"
              key={item}
              onClick={() => setMode(item)}
              className={`flex-1 border px-2 py-1 text-[9px] ${
                mode === item
                  ? "border-amber-200/80 bg-amber-300/15 text-amber-100"
                  : "border-white/10 bg-white/5 text-white/55"
              }`}
            >
              {IDLE_ROYAL_EXCHANGE_BUY_COUNT_LABELS[item]}
            </button>
          ))}
        </div>

        <div className="mt-2 flex flex-col gap-1">
          {rows.map(({ faction, quote }) => {
            const canBuy = quote.willBuy > 0;
            return (
              <button
                type="button"
                key={faction.id}
                disabled={!canBuy}
                onClick={() => runtime.buyRoyalExchange(faction.id, mode)}
                className="border-2 bg-white/[.025] px-2 py-1.5 text-left disabled:cursor-not-allowed disabled:opacity-40"
                style={{ borderColor: `${faction.accent}88` }}
              >
                <div className="flex items-center gap-2">
                  <span className="min-w-0 flex-1 truncate text-[10px] font-semibold" style={{ color: faction.accent }}>
                    {faction.name} GPU
                  </span>
                  <span className="text-[9px] tabular-nums text-white/55">
                    {formatDesktopCompute(quote.coinBalance)}
                  </span>
                </div>
                <div className="mt-1 flex items-center justify-between gap-2 text-[9px] tabular-nums text-white/50">
                  <span>已交易 {formatDesktopCompute(quote.tradesOwned)}</span>
                  <span>
                    {canBuy
                      ? `${formatDesktopCompute(quote.totalCost)} GPU → +${quote.willBuy}`
                      : "余额不足"}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
