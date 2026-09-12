import { memo, useMemo, type CSSProperties } from "react";
import {
  getCakeDuelCardShadow,
  replaceCakeDuelRgbaAlpha,
} from "../apps/cakeduel-card-presentation";

export interface CakeDuelCardData {
  id: string;
  frontImage: string;
  backImage: string;
  hdFrontImage?: string;
}

export interface CakeDuelCardProps {
  data: CakeDuelCardData;
  faceUp: boolean;
  width: number;
  height: number;
  hovered?: boolean;
  selected?: boolean;
  dragging?: boolean;
  disabled?: boolean;
  highlighted?: boolean;
  dimmed?: boolean;
  liftY?: number;
  rotation?: number;
  scale?: number;
  borderRadius?: number;
  inverted?: boolean;
  glowColor?: string;
  flipDelayMs?: number;
  onClick?: () => void;
  onHoverChange?: (hovered: boolean) => void;
}

/** Source-owned Cake Duel card face/flip/selection presentation. */
export const CakeDuelCard = memo(function CakeDuelCard({
  data,
  faceUp,
  width,
  height,
  hovered = false,
  selected = false,
  dragging = false,
  disabled = false,
  highlighted = false,
  dimmed = false,
  liftY = 0,
  rotation = 0,
  scale = 1,
  borderRadius = 12,
  inverted = false,
  glowColor = "rgba(255,255,255,0.85)",
  flipDelayMs = 0,
  onClick,
  onHoverChange,
}: CakeDuelCardProps) {
  const activeHover = hovered && !disabled;
  const frontImage = activeHover && data.hdFrontImage ? data.hdFrontImage : data.frontImage;
  const shadow = getCakeDuelCardShadow(activeHover, selected, dragging);
  const transform = `translateY(${liftY}px) rotate(${rotation}deg) scale(${scale}) rotateY(${faceUp ? 0 : 180}deg)`;
  const selectionShadow = selected
    ? `inset 0 0 0 2px ${glowColor}, 0 0 24px ${replaceCakeDuelRgbaAlpha(glowColor, 0.55)}`
    : highlighted
      ? "inset 0 0 0 2.5px rgba(255,226,110,1), 0 0 24px rgba(232,199,58,0.68)"
      : undefined;

  const commonFaceStyle = useMemo<CSSProperties>(
    () => ({
      position: "absolute",
      inset: 0,
      overflow: "hidden",
      borderRadius,
      backfaceVisibility: "hidden",
      WebkitBackfaceVisibility: "hidden",
    }),
    [borderRadius],
  );

  return (
    <div
      style={{
        width,
        height,
        perspective: 800,
        opacity: dimmed ? 0.45 : 1,
        filter: dimmed ? "saturate(0.35) brightness(0.85)" : "saturate(1) brightness(1)",
        transition: "opacity 300ms ease, filter 300ms ease",
      }}
      data-cakeduel-card-shell
    >
      <button
        type="button"
        data-card-id={data.id}
        data-cakeduel-card
        data-face-up={faceUp ? "true" : "false"}
        data-selected={selected ? "true" : "false"}
        data-highlighted={highlighted ? "true" : "false"}
        disabled={disabled || !onClick}
        onMouseEnter={() => onHoverChange?.(true)}
        onMouseLeave={() => onHoverChange?.(false)}
        onClick={onClick}
        className="relative block border-0 bg-transparent p-0 select-none disabled:cursor-not-allowed"
        style={{
          width,
          height,
          borderRadius,
          transformOrigin: "bottom center",
          transformStyle: "preserve-3d",
          transform,
          boxShadow: shadow,
          cursor: onClick && !disabled ? "pointer" : disabled ? "not-allowed" : "default",
          transition: `transform 220ms cubic-bezier(.2,.8,.2,1) ${flipDelayMs}ms, box-shadow 180ms ease, opacity 180ms ease`,
          touchAction: "none",
        }}
      >
        <span style={commonFaceStyle}>
          <img
            src={frontImage}
            alt=""
            className="h-full w-full object-cover"
            style={{ borderRadius, transform: inverted ? "rotate(180deg)" : undefined }}
            draggable={false}
          />
          <span
            className="absolute inset-0 pointer-events-none"
            style={{ borderRadius, boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.1)" }}
          />
        </span>
        <span style={{ ...commonFaceStyle, transform: "rotateY(180deg)" }}>
          <img
            src={data.backImage}
            alt=""
            className="h-full w-full object-cover"
            style={{ borderRadius, transform: inverted ? "rotate(180deg)" : undefined }}
            draggable={false}
          />
          <span
            className="absolute inset-0 pointer-events-none"
            style={{ borderRadius, boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.1)" }}
          />
        </span>
        {selectionShadow ? (
          <span
            className="absolute inset-0 pointer-events-none"
            data-cakeduel-card-glow
            style={{ borderRadius, boxShadow: selectionShadow }}
          />
        ) : null}
      </button>
    </div>
  );
});
