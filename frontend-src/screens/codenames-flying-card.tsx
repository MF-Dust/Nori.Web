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

const FLYING_CARD_BASE_SIZE: Readonly<Record<CodenamesFlyingCardType, { width: number; height: number }>> = {
  agent: { width: 160, height: 100 },
  assassin: { width: 160, height: 100 },
  bystander: { width: 50, height: 50 },
};

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
    const base = FLYING_CARD_BASE_SIZE[card.type];
    const sourceScale = card.sourceRect.width / base.width;
    const targetScale = card.targetRect.width / base.width;
    const sourceLeft = card.sourceRect.left + (card.sourceRect.width - base.width) / 2;
    const sourceTop = card.sourceRect.top + (card.sourceRect.height - base.height) / 2;
    const targetLeft = card.targetRect.left + (card.targetRect.width - base.width) / 2;
    const targetTop = card.targetRect.top + (card.targetRect.height - base.height) / 2;

    const animation = element.animate(
      [
        {
          left: `${sourceLeft}px`,
          top: `${sourceTop}px`,
          transform: `scale(${sourceScale}) rotate(0deg)`,
          opacity: 1,
        },
        {
          left: `${targetLeft}px`,
          top: `${targetTop}px`,
          transform: `scale(${targetScale}) rotate(${card.rotate180 ? 180 : 0}deg)`,
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
  const base = FLYING_CARD_BASE_SIZE[card.type];
  return createPortal(
    <div
      ref={ref}
      className="fixed pointer-events-none z-50"
      style={{
        width: base.width,
        height: base.height,
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
