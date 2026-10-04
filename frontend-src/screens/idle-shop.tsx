import { Zap } from "lucide-react";
import { useMemo, useState } from "react";
import { PixelHeading, PixelTooltip } from "./idle-chrome";
import { IdleIcon } from "./idle-icon";
import { useIdleCue } from "./idle-cue-context";
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
  if (generator.alignment === "universal") return UNIVERSAL_TONE;
  if (generator.accent) return generator.accent;
  return ALIGNMENT_TONES[generator.alignment];
}

function GeneratorCard({
  generator,
  quote,
  totalProduction,
  onBuy,
}: {
  generator: IdleGeneratorDefinition;
  quote: IdleGeneratorQuote;
  totalProduction: number;
  onBuy: () => void;
}) {
  const tone = generatorTone(generator);
  const affordable = quote.willBuy > 0;
  const share = totalProduction > 0 ? (quote.totalRate / totalProduction) * 100 : 0;
  const unitLabel = generator.measure ?? "个";

  const owned = quote.owned > 0;
  const inset =
    "inset -2px -2px 0 rgba(0,0,0,.55), inset 2px 2px 0 rgba(255,255,255,.04)";
  return (
    <PixelTooltip
      side="left"
      content={<div className="flex max-w-[200px] flex-col gap-1">
        <div className="pixel-cjk pixel-fs-lg leading-tight" style={{ color: tone }}>{generator.name}</div>
        {generator.description ? <div className="pixel-cjk pixel-fs-sm leading-snug opacity-80">{generator.description}</div> : null}
        <div className="pixel-cjk pixel-fs-sm leading-snug text-[var(--px-dim)]">
          <div>每{unitLabel}{generator.name}每秒产出 {formatDesktopCompute(quote.perUnitRate)} 算力。</div>
          <div>所有{generator.name}目前每秒共生成 {formatDesktopCompute(quote.totalRate)} 算力。</div>
        </div>
      </div>}
    >
    <button
      type="button"
      onClick={affordable ? onBuy : undefined}
      aria-disabled={!affordable}
      className={`group flex w-full items-center gap-2 border-2 bg-[var(--px-panel)] p-1.5 text-left transition-colors duration-100 hover:bg-[var(--px-panel-2)] ${
        affordable ? "active:translate-y-px" : "cursor-not-allowed opacity-45"
      }`}
      style={{
        borderColor: owned ? tone : "var(--px-stroke)",
        boxShadow: owned
          ? `inset -2px -2px 0 rgba(0,0,0,.55), inset 2px 2px 0 ${tone}33`
          : inset,
      }}
    >
      <div className="relative size-8 shrink-0" style={{ color: tone }} aria-hidden="true">
        {generator.icon ? (
          <IdleIcon name={generator.icon} className="size-full" />
        ) : (
          <span className="grid size-full place-items-center pixel-fs-sm">{generator.name.slice(0, 1)}</span>
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1 leading-none">
        <div className="pixel-cjk pixel-fs-md pixel-tsh-1 leading-tight break-words text-[var(--px-white)]">
          {generator.name}
        </div>
        <div className="flex items-stretch gap-2">
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <div className="pixel-num pixel-fs-md" style={{ color: tone }}>
              LV {quote.owned}
            </div>
            <div className="pixel-num pixel-fs-md" style={{ color: tone }}>
              {share.toPrecision(3)}%
            </div>
          </div>
          <div
            className={`flex shrink-0 items-center justify-center gap-1 self-stretch border-2 px-1.5 ${
              affordable
                ? "border-[var(--px-cyan)] bg-[var(--px-cyan-deep)] text-[var(--px-cyan)]"
                : "border-[var(--px-dim)] bg-[var(--px-void)] text-[var(--px-dim)]"
            }`}
          >
            <Zap className="size-2.5 shrink-0" strokeWidth={2.5} />
            <span className="pixel-num pixel-fs-lg pixel-tsh-1">
              {formatDesktopCompute(Math.ceil(quote.totalCost))}
            </span>
          </div>
        </div>
      </div>
    </button>
    </PixelTooltip>
  );
}

function BuyModeSelector({
  mode,
  onChange,
}: {
  mode: IdleBuyCount;
  onChange: (mode: IdleBuyCount) => void;
}) {
  const cue = useIdleCue();
  return (
    <div className="flex shrink-0 flex-col gap-1.5">
      <PixelHeading tone="cyan">购买模式</PixelHeading>
      <div className="flex items-stretch gap-[2px] border-2 border-[var(--px-void)] bg-[var(--px-void)] p-[2px]">
        {IDLE_BUY_COUNTS.map((item) => {
          const selected = item === mode;
          const label = IDLE_BUY_COUNT_LABELS[item];
          const cjk = /[\u4e00-\u9fff]/.test(label);
          return (
            <button
              type="button"
              key={item}
              onClick={() => {
                if (item !== mode) cue("idle-buy-mode-switch");
                onChange(item);
              }}
              className={`relative inline-flex h-6 flex-1 items-center justify-center border-2 leading-none pixel-fs-sm transition-colors duration-75 ${cjk ? "pixel-cjk" : "pixel-ascii"} ${
                selected
                  ? "border-[var(--px-void)] bg-[var(--px-cyan)] text-[var(--px-void)]"
                  : "border-[var(--px-stroke)] bg-[var(--px-panel)] text-[var(--px-cyan)]/70 hover:bg-[var(--px-panel-2)] hover:text-[var(--px-cyan)]"
              }`}
              style={selected
                ? { boxShadow: "inset -1px -1px 0 0 var(--px-cyan-dim), inset 1px 1px 0 0 #d6fbff" }
                : { boxShadow: "inset -1px -1px 0 0 rgba(0,0,0,0.55), inset 1px 1px 0 0 rgba(255,255,255,0.05)" }}
            >
              {label}
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
  const cue = useIdleCue();
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
      className="pointer-events-none absolute bottom-3 right-3 top-3 z-10 flex w-[220px] flex-col gap-2"
      style={{ filter: "var(--px-ui-glow, none)" }}
    >
      <PixelHeading tone="cyan">算力源</PixelHeading>
      <div className="pointer-events-auto -ml-2 flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto pl-2">
        {quotes.map(({ generator, quote }) => (
          <GeneratorCard
            key={generator.id}
            generator={generator}
            quote={quote}
            totalProduction={totalProduction}
            onBuy={() => {
              cue("idle-generator-buy");
              runtime.buy(generator.id, mode);
            }}
          />
        ))}
      </div>
      <div className="pointer-events-auto">
        <BuyModeSelector mode={mode} onChange={setMode} />
      </div>
    </div>
  );
}
