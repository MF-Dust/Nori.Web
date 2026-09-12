import { memo, useEffect } from "react";
import { X } from "lucide-react";
import { CAKEDUEL_PALETTE } from "../apps/cakeduel-card-presentation";
import type { CakeDuelTranslate } from "./cakeduel-hud";

const CAKEDUEL_HELP_SECTIONS = ["goal", "attack", "defend", "challenge", "bout"] as const;
const CAKEDUEL_BASE_DECK = [
  { name: "soldier", count: 5, color: "#FECE08" },
  { name: "archer", count: 4, color: "#B0D575" },
  { name: "wizard", count: 3, color: "#F49187" },
  { name: "defender", count: 4, color: "#A2BFDC" },
  { name: "scientist", count: 3, color: "#84C1BD" },
  { name: "wolfy", count: 1, color: "#B7C0C3" },
] as const;

function hexAlpha(color: string, alpha: number): string {
  const red = Number.parseInt(color.slice(1, 3), 16);
  const green = Number.parseInt(color.slice(3, 5), 16);
  const blue = Number.parseInt(color.slice(5, 7), 16);
  return `rgba(${red},${green},${blue},${alpha})`;
}

export interface CakeDuelHelpOverlayProps {
  open: boolean;
  translate: CakeDuelTranslate;
  resolveCardIcon: (name: string) => string;
  onClose(): void;
}

/** Source-owned Cake Duel rules/deck sheet from HelpOverlay-Fg7nuFTJ.js. */
export const CakeDuelHelpOverlay = memo(function CakeDuelHelpOverlay({
  open,
  translate,
  resolveCardIcon,
  onClose,
}: CakeDuelHelpOverlayProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, open]);

  if (!open) return null;

  return (
    <div className="absolute inset-0 z-[60] flex items-center justify-center p-4" data-cakeduel-help>
      <button
        type="button"
        className="absolute inset-0 border-0"
        style={{
          background: "rgba(48,34,22,0.45)",
          backdropFilter: "blur(10px) saturate(120%)",
          WebkitBackdropFilter: "blur(10px) saturate(120%)",
        }}
        aria-label={translate("cakeduel.help.close")}
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={translate("cakeduel.help.title")}
        className="relative w-full max-w-[540px] max-h-[calc(100%-2rem)] overflow-y-auto rounded-2xl"
        style={{
          background: `linear-gradient(180deg, ${CAKEDUEL_PALETTE.cream} 0%, ${CAKEDUEL_PALETTE.creamDark} 100%)`,
          border: "1px solid rgba(255,255,255,0.75)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.9), 0 18px 48px rgba(40,24,10,0.45)",
          fontFamily: "'Nunito', sans-serif",
        }}
      >
        <div className="px-6 pt-5 pb-6">
          <div className="flex items-start justify-between">
            <h2
              className="leading-none"
              style={{
                fontFamily: "'Lilita One', sans-serif",
                fontSize: 26,
                color: CAKEDUEL_PALETTE.brown,
                textShadow: "0 1px 0 rgba(255,255,255,0.6)",
              }}
            >
              {translate("cakeduel.help.title")}
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label={translate("cakeduel.help.close")}
              className="shrink-0 rounded-full p-1.5 transition-colors hover:bg-black/[0.06]"
              style={{ color: CAKEDUEL_PALETTE.brownLight }}
            >
              <X size={18} strokeWidth={2.5} />
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {CAKEDUEL_HELP_SECTIONS.map((section) => (
              <div key={section}>
                <div
                  className="text-[11px] font-extrabold uppercase tracking-[0.14em]"
                  style={{ color: CAKEDUEL_PALETTE.peachDeep }}
                >
                  {translate(`cakeduel.help.${section}.title`)}
                </div>
                <p
                  className="mt-0.5 text-[13px] leading-relaxed font-semibold"
                  style={{ color: CAKEDUEL_PALETTE.brown }}
                >
                  {translate(`cakeduel.help.${section}.body`)}
                </p>
              </div>
            ))}
          </div>

          <div
            className="mt-5 rounded-xl px-4 pt-3 pb-2"
            style={{
              background: "rgba(255,255,255,0.45)",
              border: `1px solid ${hexAlpha(CAKEDUEL_PALETTE.peachDeep, 0.25)}`,
            }}
          >
            <div className="flex items-baseline justify-between">
              <div
                className="text-[11px] font-extrabold uppercase tracking-[0.14em]"
                style={{ color: CAKEDUEL_PALETTE.peachDeep }}
              >
                {translate("cakeduel.help.deck.title")}
              </div>
              <div className="text-[11px] font-bold" style={{ color: CAKEDUEL_PALETTE.brownLight }}>
                {translate("cakeduel.help.deck.hand")}
              </div>
            </div>
            <div className="mt-2 divide-y" style={{ borderColor: hexAlpha(CAKEDUEL_PALETTE.brownLight, 0.15) }}>
              {CAKEDUEL_BASE_DECK.map(({ name, count, color }) => (
                <div key={name} className="flex items-center gap-3 py-1.5">
                  <img
                    src={resolveCardIcon(name)}
                    alt=""
                    draggable={false}
                    className="h-8 w-8 shrink-0 object-contain"
                    style={{ filter: `drop-shadow(0 1px 2px ${hexAlpha(color, 0.45)})` }}
                  />
                  <span className="w-20 shrink-0 text-[13px] font-extrabold" style={{ color: CAKEDUEL_PALETTE.brown }}>
                    {translate(`cakeduel.cards.${name}`)}
                  </span>
                  <span
                    className="shrink-0 rounded-full px-1.5 py-px text-[10px] font-extrabold tabular-nums"
                    style={{ background: hexAlpha(color, 0.18), color: CAKEDUEL_PALETTE.brown }}
                  >
                    ×{count}
                  </span>
                  <span className="min-w-0 flex-1 text-[12px] font-semibold leading-snug" style={{ color: CAKEDUEL_PALETTE.brownLight }}>
                    {translate(`cakeduel.help.deck.${name}`)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export { CAKEDUEL_BASE_DECK, CAKEDUEL_HELP_SECTIONS };
