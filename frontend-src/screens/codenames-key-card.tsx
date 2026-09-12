import { memo, type CSSProperties } from "react";
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
  if (role === "AGENT") return "border border-oklch(0.55_0.10_60_/_0.6)";
  if (role === "ASSASSIN") return "border border-oklch(0.32_0.05_200_/_0.6)";
  return "border border-oklch(0.55_0.30_25_/_0.5)";
}

function roleStyle(role: CodenamesCardRole, selected: boolean): CSSProperties {
  const background =
    role === "AGENT"
      ? "linear-gradient(145deg, oklch(0.78 0.12 80) 0%, oklch(0.65 0.14 70) 50%, oklch(0.52 0.12 60) 100%)"
      : role === "ASSASSIN"
        ? "linear-gradient(145deg, oklch(0.28 0.04 205) 0%, oklch(0.20 0.04 200) 50%, oklch(0.14 0.03 195) 100%)"
        : "linear-gradient(145deg, oklch(0.94 0.02 70) 0%, oklch(0.90 0.04 50) 50%, oklch(0.86 0.05 40) 100%)";
  const boxShadow = selected
    ? "inset 0 0 0 50px hsla(45, 85%, 55%, 0.3), 0 0 12px 3px hsla(45, 95%, 50%, 0.7)"
    : role === "AGENT"
      ? "inset 0 1px 3px oklch(0.92 0.04 85 / 0.5), inset 0 -1px 2px oklch(0.40 0.10 60 / 0.3)"
      : role === "ASSASSIN"
        ? "inset 0 1px 2px oklch(0.40 0.03 200 / 0.4), inset 0 -1px 2px oklch(0.08 0.02 195 / 0.4)"
        : "inset 0 1px 2px oklch(0.98 0.01 70 / 0.6), inset 0 -1px 2px oklch(0.70 0.05 40 / 0.2)";
  return { background, boxShadow };
}

function KeyRoleIcon({ role }: { role: CodenamesCardRole }) {
  if (role === "AGENT") {
    return (
      <svg viewBox="0 0 24 24" className="w-full h-full" aria-hidden="true">
        <rect x="4" y="11" width="16" height="9" rx="2" fill="oklch(0.52 0.10 55)" />
        <path d="M3 11 L5 7 Q12 5 19 7 L21 11 Q17 10 12 10 Q7 10 3 11 Z" fill="oklch(0.45 0.08 50)" />
        <rect x="4" y="14" width="16" height="2" fill="oklch(0.72 0.14 85)" />
        <rect x="10" y="12.5" width="4" height="5" rx="0.5" fill="oklch(0.78 0.14 88)" />
        <circle cx="12" cy="15.5" r="1" fill="oklch(0.45 0.08 50)" />
      </svg>
    );
  }
  if (role === "ASSASSIN") {
    return (
      <svg viewBox="0 0 24 24" className="w-full h-full" aria-hidden="true">
        <ellipse cx="12" cy="14" rx="9" ry="7" fill="currentColor" opacity="0.3" />
        <ellipse cx="8" cy="11" rx="3" ry="3.5" fill="oklch(0.85 0.15 82)" />
        <ellipse cx="16" cy="11" rx="3" ry="3.5" fill="oklch(0.85 0.15 82)" />
        <ellipse cx="8" cy="11" rx="1" ry="2.5" fill="oklch(0.15 0.02 200)" />
        <ellipse cx="16" cy="11" rx="1" ry="2.5" fill="oklch(0.15 0.02 200)" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className="w-full h-full" aria-hidden="true">
      <ellipse cx="12" cy="15" rx="5.5" ry="6.5" fill="hsl(5 55% 55%)" />
      <ellipse cx="10" cy="13" rx="2.5" ry="3" fill="hsl(12 80% 75%)" opacity="0.5" />
      <ellipse cx="9" cy="8" rx="3" ry="1.6" fill="hsl(115 38% 42%)" transform="rotate(-30 9 8)" />
      <ellipse cx="15" cy="8" rx="3" ry="1.6" fill="hsl(115 38% 42%)" transform="rotate(30 15 8)" />
      <rect x="11.3" y="5" width="1.4" height="3" rx="0.7" fill="hsl(25 40% 36%)" />
    </svg>
  );
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
          boxShadow: active
            ? "inset 0 2px 6px oklch(0.60 0.04 60 / 0.4), inset 0 -2px 6px oklch(0.20 0.04 50 / 0.4), 0 6px 20px oklch(0.25 0.05 55 / 0.4)"
            : "inset 0 2px 6px oklch(0.60 0.04 60 / 0.4), inset 0 -2px 6px oklch(0.20 0.04 50 / 0.4), 0 4px 12px oklch(0.25 0.05 55 / 0)",
          filter: active ? "brightness(1)" : "brightness(0.75)",
        }}
      >
        <div
          className="absolute -top-1.5 left-1/2 -translate-x-1/2 z-10 px-4 py-1 rounded-md"
          style={{
            background:
              "linear-gradient(180deg, oklch(0.82 0.04 70) 0%, oklch(0.70 0.05 65) 50%, oklch(0.62 0.05 60) 100%)",
            boxShadow:
              "inset 0 1px 2px oklch(0.92 0.02 75 / 0.5), inset 0 -1px 3px oklch(0.40 0.05 55 / 0.3), 0 3px 6px oklch(0.25 0.04 55 / 0.4)",
            border: "1px solid oklch(0.55 0.05 60 / 0.5)",
          }}
        >
          <span
            className="text-xs font-bold tracking-widest uppercase"
            style={{
              color: "oklch(0.35 0.06 55)",
              textShadow: "0 1px 0 oklch(0.90 0.02 70 / 0.6)",
              fontFamily: '"Fredoka", "Comic Sans MS", cursive',
            }}
          >
            {label}
          </span>
        </div>
        <div
          className="rounded-xl p-2"
          style={{
            background: "linear-gradient(180deg, oklch(0.28 0.04 55) 0%, oklch(0.22 0.04 50) 100%)",
            boxShadow: "inset 0 3px 10px oklch(0.10 0.02 50 / 0.6)",
          }}
        >
          <div
            className="rounded-lg p-1.5"
            style={{
              background:
                "radial-gradient(ellipse 100% 100% at 50% 50%, oklch(0.35 0.06 140 / 0.3) 0%, transparent 70%), oklch(0.20 0.03 145)",
            }}
          >
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
                    className={`aspect-[16/10] rounded-md flex items-center justify-center transition-all duration-150 ${roleClassName(role)} ${
                      hovered ? "ring-2 ring-amber-400 ring-offset-1 ring-offset-background brightness-110" : ""
                    } ${selected ? "border-[3px] border-amber-400" : ""} ${selectable ? "cursor-pointer" : "cursor-default"}`}
                    style={roleStyle(role, selected)}
                    data-codenames-key-role={role}
                    data-codenames-key-index={index}
                    onMouseEnter={() => active && onHover?.(index)}
                    onMouseLeave={() => active && onHover?.(null)}
                    onClick={() => selectable && onSelect?.(index)}
                    aria-label={`${role} ${index + 1}`}
                  >
                    <KeyRoleIcon role={role} />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
