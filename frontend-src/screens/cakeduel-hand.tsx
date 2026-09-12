import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  getCakeDuelHandArcPosition,
  getCakeDuelHandIndex,
  reconcileCakeDuelCardOrder,
  reorderCakeDuelCards,
  sameCakeDuelCardOrder,
  type CakeDuelHandConfig,
} from "../apps/cakeduel-card-presentation";
import { CakeDuelCard, type CakeDuelCardData } from "./cakeduel-card";

export interface CakeDuelHandProps {
  cards: readonly CakeDuelCardData[];
  faceUp?: boolean;
  config: CakeDuelHandConfig;
  selectedIds?: ReadonlySet<string>;
  highlightedIds?: ReadonlySet<string>;
  dimmedIds?: ReadonlySet<string>;
  disabled?: boolean;
  draggable?: boolean;
  inverted?: boolean;
  onCardClick?: (cardId: string, index: number) => void;
  onReorder?: (cards: readonly CakeDuelCardData[]) => void;
  className?: string;
}

const CLICK_SUPPRESS_AFTER_DRAG_MS = 180;

/** Source-owned shipped Cake Duel fanned hand with pointer reordering. */
export const CakeDuelHand = memo(function CakeDuelHand({
  cards,
  faceUp = true,
  config,
  selectedIds,
  highlightedIds,
  dimmedIds,
  disabled = false,
  draggable = faceUp,
  inverted = false,
  onCardClick,
  onReorder,
  className = "",
}: CakeDuelHandProps) {
  const [workingOrder, setWorkingOrder] = useState<CakeDuelCardData[] | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const suppressClickUntil = useRef(0);
  const displayCards = workingOrder ?? cards;
  const cardStep = config.cardWidth - config.overlap;

  useEffect(() => {
    setWorkingOrder((current) => {
      if (current === null) return null;
      const reconciled = reconcileCakeDuelCardOrder(current, cards);
      return sameCakeDuelCardOrder(current, reconciled) ? current : reconciled;
    });
    setDraggingId((current) => (current && cards.some((card) => card.id === current) ? current : null));
  }, [cards]);

  const moveDraggedCard = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (!draggingId || !containerRef.current || displayCards.length === 0) return;
      const bounds = containerRef.current.getBoundingClientRect();
      const pointerX = event.clientX - bounds.left;
      const targetIndex = getCakeDuelHandIndex(pointerX, cardStep, displayCards.length);
      const reordered = reorderCakeDuelCards(displayCards, draggingId, targetIndex);
      if (!sameCakeDuelCardOrder(displayCards, reordered)) setWorkingOrder(reordered);
    },
    [cardStep, displayCards, draggingId],
  );

  const finishDrag = useCallback(() => {
    if (!draggingId) return;
    const finalOrder = workingOrder ?? cards;
    setDraggingId(null);
    setWorkingOrder(null);
    suppressClickUntil.current = performance.now() + CLICK_SUPPRESS_AFTER_DRAG_MS;
    if (!sameCakeDuelCardOrder(cards, finalOrder)) onReorder?.(finalOrder);
  }, [cards, draggingId, onReorder, workingOrder]);

  const startDrag = useCallback(
    (cardId: string, event: ReactPointerEvent<HTMLDivElement>) => {
      if (!draggable || disabled) return;
      event.currentTarget.setPointerCapture(event.pointerId);
      setDraggingId(cardId);
      setHoveredId(null);
      setWorkingOrder([...cards]);
    },
    [cards, disabled, draggable],
  );

  const handWidth = useMemo(
    () =>
      displayCards.length === 0
        ? 0
        : config.cardWidth + (displayCards.length - 1) * (config.cardWidth - config.overlap),
    [config.cardWidth, config.overlap, displayCards.length],
  );

  if (displayCards.length === 0) return null;

  return (
    <div className={`flex justify-center ${className}`} data-cakeduel-hand>
      <div
        ref={containerRef}
        className="flex items-end"
        style={{ paddingTop: config.selectLiftPx, width: handWidth }}
        onPointerMove={moveDraggedCard}
        onPointerUp={finishDrag}
        onPointerCancel={finishDrag}
        onPointerLeave={() => !draggingId && setHoveredId(null)}
      >
        {displayCards.map((card, index) => {
          const dimmed = dimmedIds?.has(card.id) ?? false;
          const hovered = !dimmed && hoveredId === card.id;
          const selected = selectedIds?.has(card.id) ?? false;
          const highlighted = highlightedIds?.has(card.id) ?? false;
          const dragging = draggingId === card.id;
          const arc = getCakeDuelHandArcPosition(index, displayCards.length, config, inverted);
          const liftY = disabled
            ? arc.yOffset
            : hovered
              ? -(config.hover.liftPx + arc.yOffset)
              : selected
                ? -config.selectLiftPx
                : arc.yOffset;
          const rotation = disabled || !hovered ? arc.rotation : 0;
          const scale = !disabled && hovered ? config.hover.scale : 1;
          const zIndex = dragging ? 60 : hovered ? 50 : selected ? 40 : 10;

          return (
            <div
              key={card.id}
              data-cakeduel-hand-card={card.id}
              className="relative"
              style={{
                marginRight: index < displayCards.length - 1 ? -config.overlap : 0,
                zIndex,
                touchAction: "none",
                transition: "margin 180ms ease",
              }}
              onPointerDown={(event) => startDrag(card.id, event)}
            >
              <CakeDuelCard
                data={card}
                faceUp={faceUp}
                width={config.cardWidth}
                height={config.cardHeight}
                borderRadius={config.borderRadius}
                inverted={inverted}
                hovered={!disabled && hovered}
                selected={selected}
                highlighted={highlighted}
                dimmed={dimmed}
                dragging={dragging}
                disabled={disabled || dimmed}
                liftY={liftY}
                rotation={rotation}
                scale={scale}
                glowColor={config.glowColor}
                onHoverChange={(next) => {
                  if (!disabled && !draggingId) setHoveredId(next ? card.id : null);
                }}
                onClick={
                  onCardClick && !disabled && !dimmed
                    ? () => {
                        if (performance.now() < suppressClickUntil.current) return;
                        onCardClick(card.id, index);
                      }
                    : undefined
                }
              />
            </div>
          );
        })}
      </div>
    </div>
  );
});
