import { memo } from "react";
import type { CodenamesCardRole } from "../apps/codenames-board-presentation";

export interface CodenamesKeyCardProps {
  keySide: readonly CodenamesCardRole[];
}

function roleClassName(role: CodenamesCardRole): string {
  if (role === "AGENT") return "bg-[var(--codenames-agent-bg)] border-[var(--codenames-agent-border)]";
  if (role === "ASSASSIN") return "bg-[var(--codenames-assassin-bg)] border-[var(--codenames-assassin-border)]";
  return "bg-[var(--codenames-bystander-bg)] border-[var(--codenames-bystander-border)]";
}

/** Source-owned 5x5 key-card presentation from the shipped Codenames GameScreen. */
export const CodenamesKeyCard = memo(function CodenamesKeyCard({ keySide }: CodenamesKeyCardProps) {
  return (
    <div className="shrink-0 rounded-xl border bg-card p-2 shadow-sm" data-codenames-key-card>
      <div className="grid grid-cols-5 gap-1">
        {Array.from({ length: 25 }, (_, index) => {
          const role = keySide[index] ?? "BYSTANDER";
          return (
            <div
              key={index}
              className={`aspect-[16/10] rounded-sm border ${roleClassName(role)}`}
              data-codenames-key-role={role}
              aria-hidden="true"
            />
          );
        })}
      </div>
    </div>
  );
});
