import type { ComponentType, ReactNode } from "react";

export type SidebarBadgeVariant = "muted" | "primary";

export interface SidebarNavButtonProps {
  icon: ComponentType<{ className?: string }>;
  label: ReactNode;
  count?: number;
  active?: boolean;
  badgeVariant?: SidebarBadgeVariant;
  onClick: () => void;
  sfx?: boolean;
  playSelectSound?: () => void;
}

function classes(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}

/**
 * Maintainable reconstruction of the small shipped SidebarNavButton chunk.
 * Sound playback is injected so this component does not depend on the still
 * unrecovered NormalApp audio registry.
 */
export function SidebarNavButton({
  icon: Icon,
  label,
  count,
  active = false,
  badgeVariant = "muted",
  onClick,
  sfx = true,
  playSelectSound,
}: SidebarNavButtonProps) {
  const showCount = typeof count === "number" && count > 0;

  const activate = () => {
    if (sfx) playSelectSound?.();
    onClick();
  };

  return (
    <button
      type="button"
      onClick={activate}
      className={classes(
        "w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-sm transition-colors",
        active
          ? "bg-primary/10 text-primary font-medium"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      <Icon className="size-4 shrink-0" />
      <span className="flex-1 text-left">{label}</span>
      {showCount && badgeVariant === "primary" ? (
        <span
          className={classes(
            "text-[10px] font-medium px-1.5 py-0.5 rounded-full min-w-[20px] text-center",
            active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
          )}
        >
          {count}
        </span>
      ) : null}
      {showCount && badgeVariant === "muted" ? (
        <span className="text-[10px] text-muted-foreground">{count}</span>
      ) : null}
    </button>
  );
}
