import { memo } from "react";
import type { CodenamesCardRole } from "../apps/codenames-board-presentation";

export interface CodenamesKeyCardProps {
  keySide: readonly CodenamesCardRole[];
  label: string;
  active?: boolean;
  hoveredCellIndex?: number | null;
  selectedCards?: ReadonlySet<number>;
  onHover?: (index: number | null) => void;
  onSelect?: (index: number) => void;
}

function roleClassName(role: CodenamesCardRole): string {
  if (role === "AGENT") return "border border-oklch(0.55_0.10_60_/_0.6) bg-[var(--codenames-agent-bg)]";
  if (role === "ASSASSIN") return "border border-oklch(0.32_0.05_200_/_0.6) bg-[var(--codenames-assassin-bg)]";
  return "border border-oklch(0.55_0.30_25_/_0.5) bg-[var(--codenames-bystander-bg)]";
}

/** Source-owned 5x5 counterpart key card, including shipped clue-giver hover/select behavior. */
export const CodenamesKeyCard = memo(function CodenamesKeyCard({
  keySide,
  label,
  active = false,
  hoveredCellIndex = null,
  selectedCards,
  onHover,
  onSelect,
}: CodenamesKeyCardProps) {
  return (
    <div className="shrink-0 select-none" data-codenames-key-card>
      <div
        className="relative rounded-2xl p-3"
        style={{
          background:
            "radial-gradient(ellipse 80% 40% at 50% 100%, oklch(0.38 0.07 55) 0%, transparent 60%), linear-gradient(175deg, oklch(0.48 0.06 60) 0%, oklch(0.40 0.07 55) 40%, oklch(0.32 0.06 50) 100%)",
          filter: active ? "brightness(1)" : "brightness(.75)",
        }}
      >
        <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 z-10 px-4 py-1 rounded-md bg-amber-100/90 border border-amber-950/30">
          <span className="text-xs font-bold tracking-widest uppercase text-amber-950 whitespace-nowrap">
            {label}
          </span>
        </div>
        <div className="rounded-xl p-2 bg-stone-950/70 shadow-inner">
          <div className="rounded-lg p-1.5 bg-emerald-950/50">
            <div className="grid grid-cols-5 gap-1">
              {Array.from({ length: 25 }, (_, index) => {
                const role = keySide[index] ?? "BYSTANDER";
                const selectable = active && role === "AGENT";
                const hovered = active && hoveredCellIndex === index;
                const selected = selectable && (selectedCards?.has(index) ?? false);
                return (
                  <button
                    key={index}
                    type="button"
                    disabled={!active}
                    className={`aspect-[16/10] rounded-md transition-all duration-150 ${roleClassName(role)} ${
                      hovered ? "ring-2 ring-amber-400 ring-offset-1 ring-offset-background brightness-110" : ""
                    } ${selected ? "border-[3px] border-amber-400" : ""} ${selectable ? "cursor-pointer" : "cursor-default"}`}
                    data-codenames-key-role={role}
                    data-codenames-key-index={index}
                    onMouseEnter={() => active && onHover?.(index)}
                    onMouseLeave={() => active && onHover?.(null)}
                    onClick={() => selectable && onSelect?.(index)}
                    aria-label={`${role} ${index + 1}`}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
