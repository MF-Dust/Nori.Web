export const CAKEDUEL_PALETTE = {
  peach: "#F8A678",
  peachDeep: "#D68B52",
  peachLight: "#ECBE80",
  cream: "#fff8ef",
  creamDark: "#f0e4d0",
  sky: "#8AB7E1",
  brown: "#6b4830",
  brownLight: "#a07050",
  pink: "#e899a8",
  gold: "#e8c73a",
} as const;

export interface CakeDuelHandConfig {
  cardWidth: number;
  cardHeight: number;
  borderRadius: number;
  overlap: number;
  arc: {
    maxRotationDeg: number;
    droopPx: number;
  };
  hover: {
    liftPx: number;
    scale: number;
  };
  selectLiftPx: number;
  glowColor: string;
}

export interface CakeDuelResponsiveLayout {
  scale: number;
  handScale: number;
  compact: boolean;
  cardWidth: number;
  cardHeight: number;
  borderRadius: number;
  hand: CakeDuelHandConfig;
  opponentHand: CakeDuelHandConfig;
  opponentShiftPx: number;
  handBottomPadPx: number;
  pileOverlapPx: number;
  cakeTokenPx: number;
}

export interface CakeDuelHandArcPosition {
  rotation: number;
  yOffset: number;
}

export interface CakeDuelCardIdentity {
  id: string;
}

export const CAKEDUEL_DEFAULT_HAND_CONFIG: Readonly<CakeDuelHandConfig> = {
  cardWidth: 110,
  cardHeight: 150,
  borderRadius: 12,
  overlap: 38,
  arc: { maxRotationDeg: 5, droopPx: 14 },
  hover: { liftPx: 8, scale: 1.05 },
  selectLiftPx: 10,
  glowColor: "rgba(255,255,255,0.85)",
};

const BASE_CARD_WIDTH = CAKEDUEL_DEFAULT_HAND_CONFIG.cardWidth;
const BASE_CARD_HEIGHT = CAKEDUEL_DEFAULT_HAND_CONFIG.cardHeight;
const TALL_HEADER_HEIGHT = 57;
const COMPACT_HEADER_HEIGHT = 49;
const TALL_RESERVED_HEIGHT = 138;
const COMPACT_RESERVED_HEIGHT = 132;
const TALL_VERTICAL_FACTOR = 2.45;
const COMPACT_VERTICAL_FACTOR = 1.25;
const HAND_SCALE_MULTIPLIER = 2;
const MAX_HAND_SCALE = 2;
const HAND_HIGH_RES_THRESHOLD = 1.25;

const ARC_EXTENT =
  CAKEDUEL_DEFAULT_HAND_CONFIG.arc.droopPx +
  (BASE_CARD_WIDTH / 2) *
    Math.sin((CAKEDUEL_DEFAULT_HAND_CONFIG.arc.maxRotationDeg * Math.PI) / 180);
const HAND_VERTICAL_EXTENT =
  (BASE_CARD_HEIGHT + ARC_EXTENT + CAKEDUEL_DEFAULT_HAND_CONFIG.selectLiftPx) /
  BASE_CARD_HEIGHT;

function scaleLayout(baseScale: number, handScale: number, compact: boolean): CakeDuelResponsiveLayout {
  const scale = (value: number) => Math.round(value * baseScale);
  const scaleHand = (value: number) => Math.round(value * handScale);
  const cardWidth = scale(BASE_CARD_WIDTH);
  const cardHeight = scale(BASE_CARD_HEIGHT);
  const borderRadius = Math.max(6, scale(CAKEDUEL_DEFAULT_HAND_CONFIG.borderRadius));

  return {
    scale: baseScale,
    handScale,
    compact,
    cardWidth,
    cardHeight,
    borderRadius,
    hand: {
      cardWidth: scaleHand(BASE_CARD_WIDTH),
      cardHeight: scaleHand(BASE_CARD_HEIGHT),
      borderRadius: Math.max(6, scaleHand(CAKEDUEL_DEFAULT_HAND_CONFIG.borderRadius)),
      overlap: scaleHand(CAKEDUEL_DEFAULT_HAND_CONFIG.overlap),
      arc: {
        maxRotationDeg: CAKEDUEL_DEFAULT_HAND_CONFIG.arc.maxRotationDeg,
        droopPx: scaleHand(CAKEDUEL_DEFAULT_HAND_CONFIG.arc.droopPx),
      },
      hover: {
        liftPx: scaleHand(CAKEDUEL_DEFAULT_HAND_CONFIG.hover.liftPx),
        scale: CAKEDUEL_DEFAULT_HAND_CONFIG.hover.scale,
      },
      selectLiftPx: scaleHand(CAKEDUEL_DEFAULT_HAND_CONFIG.selectLiftPx),
      glowColor: CAKEDUEL_DEFAULT_HAND_CONFIG.glowColor,
    },
    opponentHand: {
      cardWidth,
      cardHeight,
      borderRadius,
      overlap: scale(42),
      arc: { maxRotationDeg: 4, droopPx: scale(10) },
      hover: { liftPx: 0, scale: 1 },
      selectLiftPx: 0,
      glowColor: CAKEDUEL_DEFAULT_HAND_CONFIG.glowColor,
    },
    opponentShiftPx: -Math.round(cardHeight * (compact ? 0.75 : 0.55)),
    handBottomPadPx: Math.ceil(ARC_EXTENT * handScale),
    pileOverlapPx: Math.round(cardWidth * 0.55),
    cakeTokenPx: compact ? Math.max(34, scale(44)) : 48,
  };
}

/**
 * Source-owned equivalent of the shipped Cake Duel responsive layout model.
 * It preserves the same compact breakpoint heuristic and 0.5–1.0 board scale
 * / up-to-2x hand scale bounds used by `GameScreen-BbDAUsf1.js`.
 */
export function deriveCakeDuelResponsiveLayout(width: number, height: number): CakeDuelResponsiveLayout {
  const handVerticalFactor = HAND_VERTICAL_EXTENT * HAND_SCALE_MULTIPLIER;
  const tallHeightScale =
    (height - TALL_HEADER_HEIGHT - TALL_RESERVED_HEIGHT) /
    (BASE_CARD_HEIGHT * (TALL_VERTICAL_FACTOR + handVerticalFactor));
  const compact = tallHeightScale < 0.66;
  const heightScale = compact
    ? (height - COMPACT_HEADER_HEIGHT - COMPACT_RESERVED_HEIGHT) /
      (BASE_CARD_HEIGHT * (COMPACT_VERTICAL_FACTOR + handVerticalFactor))
    : tallHeightScale;

  const sevenCardHandWidth =
    BASE_CARD_WIDTH + 6 * (BASE_CARD_WIDTH - CAKEDUEL_DEFAULT_HAND_CONFIG.overlap);
  const widthScale = width > 0 ? (width - 150) / sevenCardHandWidth : Number.POSITIVE_INFINITY;
  const boardScale = Math.min(
    compact ? 0.85 : 1,
    Math.max(0.5, Math.min(heightScale, widthScale)),
  );
  const handScale = Math.max(
    boardScale,
    Math.min(heightScale * HAND_SCALE_MULTIPLIER, widthScale, MAX_HAND_SCALE),
  );

  return scaleLayout(boardScale, handScale, compact);
}

export function cakeDuelUsesHighResolutionHandCards(layout: CakeDuelResponsiveLayout): boolean {
  return layout.handScale >= HAND_HIGH_RES_THRESHOLD;
}

/** Exact shipped arc/droop calculation for a card in a hand fan. */
export function getCakeDuelHandArcPosition(
  index: number,
  count: number,
  config: Pick<CakeDuelHandConfig, "arc"> = CAKEDUEL_DEFAULT_HAND_CONFIG,
  inverted = false,
): CakeDuelHandArcPosition {
  if (count <= 1) return { rotation: 0, yOffset: 0 };
  const center = (count - 1) / 2;
  const normalized = (index - center) / center;
  const direction = inverted ? -1 : 1;
  return {
    rotation: normalized * config.arc.maxRotationDeg * direction,
    yOffset: normalized * normalized * config.arc.droopPx * direction,
  };
}

export function getCakeDuelCardShadow(
  hovered: boolean,
  selected: boolean,
  dragging: boolean,
): string {
  if (dragging) return "0 16px 40px rgba(0,0,0,0.45)";
  if (hovered) return "0 8px 18px rgba(0,0,0,0.40)";
  if (selected) return "0 5px 12px rgba(0,0,0,0.30)";
  return "0 2px 6px rgba(0,0,0,0.30)";
}

export function replaceCakeDuelRgbaAlpha(color: string, alpha: number): string {
  return color.replace(/[\d.]+\)$/, `${alpha})`);
}

export function getCakeDuelHandIndex(pointerX: number, step: number, count: number): number {
  const index = Math.floor(pointerX / step);
  return Math.max(0, Math.min(index, count - 1));
}

/** Exact immutable card move used while dragging a Cake Duel hand. */
export function reorderCakeDuelCards<T extends CakeDuelCardIdentity>(
  cards: readonly T[],
  cardId: string,
  targetIndex: number,
): T[] {
  if (cards.length <= 1) return [...cards];
  const sourceIndex = cards.findIndex((card) => card.id === cardId);
  if (sourceIndex < 0) return [...cards];
  const boundedIndex = Math.max(0, Math.min(targetIndex, cards.length - 1));
  if (sourceIndex === boundedIndex) return [...cards];

  const reordered = [...cards];
  const [card] = reordered.splice(sourceIndex, 1);
  reordered.splice(boundedIndex, 0, card);
  return reordered;
}

/** Keeps the user's current hand order while accepting newly-arrived card objects. */
export function reconcileCakeDuelCardOrder<T extends CakeDuelCardIdentity>(
  previous: readonly T[],
  next: readonly T[],
): T[] {
  const nextById = new Map(next.map((card) => [card.id, card]));
  const retained = previous.filter((card) => nextById.has(card.id)).map((card) => nextById.get(card.id)!);
  const retainedIds = new Set(retained.map((card) => card.id));
  const appended = next.filter((card) => !retainedIds.has(card.id));
  return [...retained, ...appended];
}

export function sameCakeDuelCardOrder(
  left: readonly CakeDuelCardIdentity[],
  right: readonly CakeDuelCardIdentity[],
): boolean {
  if (left.length !== right.length) return false;
  for (let index = 0; index < left.length; index += 1) {
    if (left[index].id !== right[index].id) return false;
  }
  return true;
}
