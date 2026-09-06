import { ShoppingCart } from "lucide-react";
import { useMemo, useState } from "react";
import {
  IDLE_BUY_COUNTS,
  IDLE_BUY_COUNT_LABELS,
  type IdleBuyCount,
  type IdleGeneratorDefinition,
  type IdleGeneratorQuote,
  type IdlePresentationModel,
  type IdlePresentationSnapshot,
} from "../apps/idle";
import { isIdleGeneratorVisible } from "../apps/idle-economy";
import { formatDesktopCompute } from "../state/compute-runtime";

const UNIVERSAL_TONE = "#94a3b8";
const ALIGNMENT_TONES = {
  none: "#67e8f9",
  accelerate: "#f87171",
  decelerate: "#a3e635",
  equilibrium: "#a5f3fc",
} as const;

function generatorTone(generator: IdleGeneratorDefinition): string {
  if (generator.accent) return generator.accent;
  if (generator.alignment === "universal") return UNIVERSAL_TONE;
  return ALIGNMENT_TONES[generator.alignment];
}

function GeneratorCard({
  generator,
  quote,
  totalProduction,
  mode,
  onBuy,
}: {
  generator: IdleGeneratorDefinition;
  quote: IdleGeneratorQuote;
  totalProduction: number;
  mode: IdleBuyCount;
  onBuy: () => void;
}) {
  const tone = generatorTone(generator);
  const affordable = quote.willBuy > 0;
  const share = totalProduction > 0 ? (quote.totalRate / totalProduction) * 100 : 0;
  const unitLabel = generator.measure ?? "个";

  return (
    <button
      type="button"
      onClick={affordable ? onBuy : undefined}
      aria-disabled={!affordable}
      className={`group w-full border-2 bg-black/60 p-1.5 text-left transition-colors duration-100 ${
        affordable
          ? "hover:bg-white/5 active:translate-y-px"
          : "cursor-not-allowed opacity-45"
      }`}
      style={{
        borderColor: `${tone}88`,
        boxShadow:
          quote.owned > 0
            ? `inset -2px -2px 0 rgba(0,0,0,.55), inset 2px 2px 0 ${tone}33`
            : "inset -2px -2px 0 rgba(0,0,0,.55), inset 2px 2px 0 rgba(255,255,255,.04)",
      }}
      title={`${generator.name} · 每${unitLabel}每秒产出 ${formatDesktopCompute(quote.perUnitRate)} 算力；当前总产出 ${formatDesktopCompute(quote.totalRate)} 算力/秒`}
    >
      <div className="flex items-start gap-2">
        <div
          className="grid size-8 shrink-0 place-items-center border font-semibold"
          style={{ borderColor: `${tone}99`, color: tone }}
          aria-hidden="true"
        >
          {generator.name.slice(0, 1)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-1">
            <span className="min-w-0 flex-1 truncate text-[11px] font-semibold" style={{ color: tone }}>
              {generator.name}
            </span>
            <span className="shrink-0 text-[10px] tabular-nums text-white/70">
              {quote.owned}
            </span>
          </div>
          <div className="mt-0.5 flex items-center justify-between gap-1 text-[9px] tabular-nums text-white/55">
            <span>{formatDesktopCompute(quote.totalRate)}/s</span>
            <span>{share.toFixed(1)}%</span>
          </div>
        </div>
      </div>

      <div className="mt-1.5 flex items-center justify-between gap-2 border-t border-white/10 pt-1 text-[10px]">
        <span className="tabular-nums text-white/75">
          {formatDesktopCompute(quote.totalCost)} 算力
        </span>
        <span style={{ color: affordable ? tone : undefined }}>
          {quote.willBuy > 0 ? `+${quote.willBuy}` : IDLE_BUY_COUNT_LABELS[mode]}
        </span>
      </div>
    </button>
  );
}

function BuyModeSelector({
  mode,
  onChange,
}: {
  mode: IdleBuyCount;
  onChange: (mode: IdleBuyCount) => void;
}) {
  return (
    <div className="shrink-0">
      <div className="mb-1 text-[9px] uppercase tracking-[0.16em] text-cyan-200/70">
        购买模式
      </div>
      <div className="flex items-stretch gap-[2px] border-2 border-black bg-black p-[2px]">
        {IDLE_BUY_COUNTS.map((item) => {
          const selected = item === mode;
          return (
            <button
              type="button"
              key={item}
              onClick={() => onChange(item)}
              className={`min-w-0 flex-1 border px-1 py-1 text-[9px] ${
                selected
                  ? "border-cyan-200/80 bg-cyan-300/15 text-cyan-100"
                  : "border-white/10 bg-white/5 text-white/55 hover:text-white/80"
              }`}
            >
              {IDLE_BUY_COUNT_LABELS[item]}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function IdleGeneratorShop({
  runtime,
  snapshot,
}: {
  runtime: Pick<IdlePresentationModel, "buy" | "quoteGenerator">;
  snapshot: IdlePresentationSnapshot;
}) {
  const [mode, setMode] = useState<IdleBuyCount>(1);
  const visibleGenerators = useMemo(
    () => snapshot.generators.filter((generator) => isIdleGeneratorVisible(generator, snapshot.state)),
    [snapshot.generators, snapshot.state],
  );
  const quotes = visibleGenerators
    .map((generator) => ({ generator, quote: runtime.quoteGenerator(generator.id, mode) }))
    .filter(
      (item): item is { generator: IdleGeneratorDefinition; quote: IdleGeneratorQuote } =>
        item.quote != null,
    );
  const totalProduction = quotes.reduce((total, item) => total + item.quote.totalRate, 0);

  if (visibleGenerators.length === 0) return null;

  return (
    <div
      className="pointer-events-none absolute bottom-3 right-3 top-3 z-10 flex w-[220px] flex-col gap-2 font-mono"
      style={{ filter: "var(--px-ui-glow, none)" }}
    >
      <div className="flex shrink-0 items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-cyan-200/80">
        <ShoppingCart className="size-3.5" />
        算力源
      </div>
      <div className="pointer-events-auto -ml-2 flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto pl-2">
        {quotes.map(({ generator, quote }) => (
          <GeneratorCard
            key={generator.id}
            generator={generator}
            quote={quote}
            totalProduction={totalProduction}
            mode={mode}
            onBuy={() => runtime.buy(generator.id, mode)}
          />
        ))}
      </div>
      <div className="pointer-events-auto">
        <BuyModeSelector mode={mode} onChange={setMode} />
      </div>
    </div>
  );
}
