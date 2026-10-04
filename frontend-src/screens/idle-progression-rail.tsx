import { ChevronRight, Compass, RefreshCcw, ShoppingCart } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useIdleCue } from "./idle-cue-context";
import type {
  IdlePresentationModel,
  IdlePresentationSnapshot,
} from "../apps/idle";
import { IdleAbdicationPanel } from "./idle-abdication-panel";
import { IdleAlignmentPanel } from "./idle-alignment-panel";
import { IdleRoyalExchangePanel } from "./idle-royal-exchange-panel";
import { IdleUpgradeList } from "./idle-upgrade-list";

type ProgressionPopup = "abdicate" | "alignment" | "royalExchange";

function TriggerButton({
  open,
  label,
  accent,
  pulse,
  icon,
  suffix,
  onClick,
  testId,
}: {
  open: boolean;
  label: string;
  accent: string;
  pulse?: boolean;
  icon: ReactNode;
  suffix?: ReactNode;
  onClick: () => void;
  testId?: string;
}) {
  return (
    <button
      type="button"
      data-test={testId}
      onClick={onClick}
      className={`pixel-cjk pixel-fs-md flex h-8 w-full items-center gap-2 border-2 bg-[var(--px-panel)] px-2 transition-colors duration-100 hover:-translate-y-px active:translate-y-px ${
        pulse ? "pixel-ready-pulse-violet" : ""
      }`}
      style={{
        color: accent,
        borderColor: open ? accent : `${accent}66`,
        boxShadow: open
          ? "inset -2px -2px 0 rgba(0,0,0,.35), inset 2px 2px 0 rgba(255,255,255,.25)"
          : `inset -2px -2px 0 rgba(0,0,0,.45), inset 2px 2px 0 ${accent}24`,
      }}
      aria-expanded={open}
    >
      {icon}
      <span className="min-w-0 flex-1 truncate text-left">{label}</span>
      {suffix}
      <ChevronRight
        className={`size-3.5 shrink-0 transition-transform ${open ? "rotate-90" : ""}`}
        strokeWidth={2.5}
      />
    </button>
  );
}

export function IdleProgressionRail({
  runtime,
  snapshot,
}: {
  runtime: Pick<
    IdlePresentationModel,
    | "abdicate"
    | "buyProof"
    | "buyRoyalExchange"
    | "buyUpgrade"
    | "buyFactionUpgrade"
    | "buyHeritage"
    | "buyGemPower"
    | "claimMemento"
    | "snapshot"
    | "quoteAbdication"
    | "quoteRoyalExchange"
  >;
  snapshot: IdlePresentationSnapshot;
}) {
  const cue = useIdleCue();
  const [popup, setPopup] = useState<ProgressionPopup | null>(null);
  const railRef = useRef<HTMLDivElement>(null);
  // Shipped `ar`: toggles chirp up when opening and down when closing.
  const toggle = (next: ProgressionPopup) => {
    const value = popup === next ? null : next;
    cue("idle-popup-toggle", { pitch: value !== null ? 1.06 : 0.94 });
    setPopup(value);
  };
  // Shipped `ar`: a press outside the rail closes the open popup.
  useEffect(() => {
    if (popup === null) return;
    const close = (event: PointerEvent) => {
      if (railRef.current?.contains(event.target as Node)) return;
      cue("idle-popup-toggle", { pitch: 0.94 });
      setPopup(null);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [cue, popup]);
  const abdication = runtime.quoteAbdication();
  const royalPreview = useMemo(() => {
    for (const faction of snapshot.factions) {
      const quote = runtime.quoteRoyalExchange(faction.id, 1);
      if (quote) return quote;
    }
    return null;
  }, [runtime, snapshot.factions, snapshot.state.factionCoins, snapshot.state.royalExchanges]);

  return (
    <div
      ref={railRef}
      className="pointer-events-none absolute bottom-3 left-3 top-3 z-30 flex w-[208px] flex-col gap-2 pixel-cjk [&_button]:pointer-events-auto"
      style={{ filter: "var(--px-ui-glow, none)" }}
    >
      <div className="pointer-events-auto flex shrink-0 flex-col gap-2">
        <TriggerButton
          open={popup === "abdicate"}
          label="重新训练"
          accent={abdication.canAbdicate || popup === "abdicate" ? "#c084fc" : "#475569"}
          pulse={abdication.canAbdicate && abdication.firstAbdication && popup !== "abdicate"}
          icon={<RefreshCcw className="size-3.5 shrink-0" strokeWidth={2.5} />}
          onClick={() => toggle("abdicate")}
          testId="abdicate-button"
        />
        <TriggerButton
          open={popup === "alignment"}
          label="选择立场"
          accent="#fcd34d"
          icon={<Compass className="size-3.5 shrink-0" strokeWidth={2.5} />}
          onClick={() => toggle("alignment")}
        />
        {royalPreview ? (
          <TriggerButton
            open={popup === "royalExchange"}
            label="GPU 交易所"
            accent="#fcd34d"
            icon={<ShoppingCart className="size-3.5 shrink-0" strokeWidth={2.5} />}
            suffix={
              <span className="shrink-0 text-[9px] tabular-nums opacity-80">
                ×{royalPreview.totalMultiplier < 10 ? royalPreview.totalMultiplier.toFixed(2).replace(/\.?0+$/, "") : Math.round(royalPreview.totalMultiplier)}
              </span>
            }
            onClick={() => toggle("royalExchange")}
            testId="royal-exchange-trigger"
          />
        ) : null}
      </div>

      <IdleUpgradeList runtime={runtime} snapshot={snapshot} />

      {popup === "abdicate" ? (
        <div className="pointer-events-auto absolute left-full top-0 z-30 ml-2 w-[300px]">
          <IdleAbdicationPanel runtime={runtime} snapshot={snapshot} quote={abdication} onClose={() => setPopup(null)} />
        </div>
      ) : null}
      {popup === "alignment" && snapshot.alignments.length > 0 ? (
        <div className="pointer-events-auto absolute left-full top-0 z-30 ml-2 w-[300px]">
          <IdleAlignmentPanel runtime={runtime} snapshot={snapshot} />
        </div>
      ) : null}
      {popup === "royalExchange" && royalPreview ? (
        <div className="pointer-events-auto absolute left-full top-0 z-30 ml-2 w-[300px]">
          <IdleRoyalExchangePanel runtime={runtime} snapshot={snapshot} />
        </div>
      ) : null}
    </div>
  );
}
