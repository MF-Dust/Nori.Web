import { RefreshCcw } from "lucide-react";
import type {
  IdleAbdicationQuote,
  IdlePresentationModel,
  IdlePresentationSnapshot,
} from "../apps/idle";
import { formatDesktopCompute } from "../state/compute-runtime";

export function IdleAbdicationPanel({
  runtime,
  snapshot,
  quote,
}: {
  runtime: Pick<IdlePresentationModel, "abdicate">;
  snapshot: IdlePresentationSnapshot;
  quote: IdleAbdicationQuote;
}) {
  const noneAvailable = quote.gainedShards <= 0;

  return (
    <section
      data-test="abdication-confirmation"
      className="border-2 border-violet-400 bg-black/95 text-white"
      style={{
        boxShadow:
          "inset -2px -2px 0 rgba(0,0,0,.6), inset 2px 2px 0 rgba(255,255,255,.06), 5px 5px 0 rgba(0,0,0,.7)",
      }}
    >
      <div className="px-2.5 py-2.5">
        <div className="flex items-center gap-1.5 text-[12px] font-semibold text-violet-300">
          <RefreshCcw className="size-3.5" strokeWidth={2.5} />
          重新训练
        </div>
        <div className="mt-1 text-[10px] text-white/50">越训越强。</div>

        <div className="mt-3 space-y-2 text-[10px] leading-snug text-white/75">
          <div className="flex gap-1.5">
            <span aria-hidden className="mt-[3px] inline-block size-1.5 shrink-0 bg-violet-400" />
            <span>算力涨得越来越慢、感觉卡住时，重新训练一次，就能再次提速。</span>
          </div>
          <div className="border-l-2 border-violet-400/70 pl-2 text-white/60">
            清空本轮的算力、算力源、升级、立场、临时增益、GPU 交易所和阵营币余额；共鸣、共鸣之力和已领取的传承永久保留。
          </div>

          {quote.firstAbdication && !quote.canAbdicate ? (
            <div className="text-white/55">
              首次重新训练建议攒够
              <span className="tabular-nums text-violet-300"> {formatDesktopCompute(quote.recommendedFirstShards)} </span>
              共鸣。当前可获得
              <span className="tabular-nums text-violet-300"> {formatDesktopCompute(quote.gainedShards)} </span>
              。
            </div>
          ) : !noneAvailable ? (
            <div className="text-white/65">
              本次可获得
              <span className="tabular-nums text-violet-300"> +{formatDesktopCompute(quote.gainedShards)} </span>
              共鸣，重新训练后共有
              <span className="tabular-nums text-fuchsia-300"> {formatDesktopCompute(quote.totalShardsAfter)} </span>
              。
            </div>
          ) : (
            <div className="text-white/50">当前还拿不到共鸣，等算力更高时再重新训练。</div>
          )}

          {quote.nextShardCompute != null && !quote.canAbdicate ? (
            <div className="text-[9px] text-white/40">
              下一点共鸣约需峰值算力 {formatDesktopCompute(quote.nextShardCompute)}
            </div>
          ) : null}

          <div className="text-[9px] text-white/35">
            本轮峰值 {formatDesktopCompute(snapshot.state.maxComputeThisRun)} · 已有共鸣 {formatDesktopCompute(snapshot.state.shards)}
          </div>
        </div>
      </div>

      <div className="border-t-2 border-white/10 px-2.5 pb-2.5 pt-2">
        <button
          type="button"
          data-test="confirm-abdication"
          disabled={!quote.canAbdicate}
          onClick={() => runtime.abdicate()}
          className="flex h-9 w-full items-center justify-center gap-1.5 border-2 border-black bg-violet-400 text-[11px] font-semibold text-black hover:brightness-110 active:translate-y-[3px] disabled:cursor-not-allowed disabled:opacity-40"
          style={{
            boxShadow:
              "inset -2px -2px 0 rgba(0,0,0,.5), inset 2px 2px 0 rgba(255,255,255,.28), 0 4px 0 #000",
          }}
        >
          <RefreshCcw className="size-3.5" strokeWidth={2.5} />
          确认重新训练
        </button>
      </div>
    </section>
  );
}
