import { memo, useEffect, useRef } from "react";
import { createPortal } from "react-dom";

export type CodenamesFlyingCardType = "agent" | "assassin" | "bystander";

export interface CodenamesFlyingCardRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface CodenamesFlyingCardState {
  type: CodenamesFlyingCardType;
  sourceRect: CodenamesFlyingCardRect;
  targetRect: CodenamesFlyingCardRect;
  cell: number;
  rotate180?: boolean;
}

export interface CodenamesFlyingCardProps {
  card: CodenamesFlyingCardState | null;
  onLanded?: () => void;
}

function FlyingCardFace({ type }: { type: CodenamesFlyingCardType }) {
  if (type === "agent") {
    return <div className="size-full rounded-xl border border-[var(--codenames-agent-border)] bg-[var(--codenames-agent-bg)]" />;
  }
  if (type === "assassin") {
    return <div className="size-full rounded-xl border border-[var(--codenames-assassin-border)] bg-[var(--codenames-assassin-bg)]" />;
  }
  return <div className="size-full rounded-xl border border-[var(--codenames-bystander-border)] bg-[var(--codenames-bystander-bg)]" />;
}

/** Source-owned fixed-layer card flight used when revealed cards move to their target cell. */
export const CodenamesFlyingCard = memo(function CodenamesFlyingCard({
  card,
  onLanded,
}: CodenamesFlyingCardProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!card || !element) return;
    const animation = element.animate(
      [
        {
          left: `${card.sourceRect.left}px`,
          top: `${card.sourceRect.top}px`,
          width: `${card.sourceRect.width}px`,
          height: `${card.sourceRect.height}px`,
          transform: "rotate(0deg)",
          opacity: 1,
        },
        {
          left: `${card.targetRect.left}px`,
          top: `${card.targetRect.top}px`,
          width: `${card.targetRect.width}px`,
          height: `${card.targetRect.height}px`,
          transform: card.rotate180 ? "rotate(180deg)" : "rotate(0deg)",
          opacity: 1,
        },
      ],
      {
        duration: 500,
        easing: "cubic-bezier(.2,.8,.2,1)",
        fill: "forwards",
      },
    );
    animation.onfinish = () => onLanded?.();
    return () => animation.cancel();
  }, [card, onLanded]);

  if (!card || typeof document === "undefined") return null;
  return createPortal(
    <div
      ref={ref}
      className="fixed pointer-events-none z-50"
      style={{
        left: card.sourceRect.left,
        top: card.sourceRect.top,
        width: card.sourceRect.width,
        height: card.sourceRect.height,
        transformOrigin: "center center",
      }}
      data-codenames-flying-card={card.type}
      data-codenames-flying-cell={card.cell}
    >
      <FlyingCardFace type={card.type} />
    </div>,
    document.body,
  );
});
