import { memo, useEffect, useRef, type CSSProperties } from "react";
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

function flyingCardStyle(type: CodenamesFlyingCardType): CSSProperties {
  if (type === "agent") {
    return {
      background:
        "radial-gradient(ellipse 80% 65% at 45% 35%, hsl(48 50% 92%) 0%, hsl(42 55% 85%) 45%, hsl(35 55% 68%) 100%)",
      border: "3px solid hsl(38 50% 48% / .7)",
    };
  }
  if (type === "assassin") {
    return {
      background:
        "radial-gradient(ellipse 80% 60% at 50% 50%, hsla(180,30%,30%,.4) 0%, transparent 70%), linear-gradient(170deg, hsl(195 35% 28%) 0%, hsl(200 40% 20%) 50%, hsl(205 45% 14%) 100%)",
      border: "3px solid hsl(190 35% 35%)",
    };
  }
  return {
    background: "linear-gradient(145deg, hsl(12 65% 65%) 0%, hsl(5 55% 55%) 55%, hsl(2 50% 45%) 100%)",
    border: "2px solid hsl(15 40% 55% / .6)",
  };
}

function FlyingCardFace({ type }: { type: CodenamesFlyingCardType }) {
  return <div className="w-full h-full rounded-xl" style={flyingCardStyle(type)} />;
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
        duration: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 1 : 500,
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
      style={{ width: base.width, height: base.height, transformOrigin: "center center" }}
      data-codenames-flying-card={card.type}
      data-codenames-flying-cell={card.cell}
    >
      <FlyingCardFace type={card.type} />
    </div>,
    document.body,
  );
});
