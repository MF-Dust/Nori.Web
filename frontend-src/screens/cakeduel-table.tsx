import { memo, useMemo } from "react";
import {
  CAKEDUEL_REVEALED_PILE_GAP_PX,
  deriveCakeDuelCakeTokenLayout,
  deriveCakeDuelPileLayout,
} from "../apps/cakeduel-game-presentation";
import { CakeDuelCard, type CakeDuelCardData } from "./cakeduel-card";
import { useCakeDuelLayout } from "./cakeduel-layout-context";

export interface CakeDuelZoneCard {
  entityId: number;
  name?: string;
}

export interface CakeDuelPileCard extends CakeDuelZoneCard {
  revealedName?: string | null;
  flipDelayMs?: number;
}

export interface CakeDuelPileProps {
  pileType: "attack" | "block";
  cards: readonly CakeDuelPileCard[];
  opponentSide?: boolean;
  cardBackImage: string;
  resolveCardFront: (name: string) => string;
}

export const CakeDuelPile = memo(function CakeDuelPile({
  pileType,
  cards,
  opponentSide = false,
  cardBackImage,
  resolveCardFront,
}: CakeDuelPileProps) {
  const layout = useCakeDuelLayout();

  return (
    <div
      className="flex flex-col items-center gap-1.5"
      style={{ minHeight: layout.cardHeight }}
      data-pile-target={pileType}
      data-cakeduel-pile={pileType}
    >
      {cards.length > 0 ? (
        <div className="flex">
          {cards.map((card, index) => {
            const revealedName = card.revealedName ?? card.name ?? null;
            const revealed = revealedName !== null;
            const last = index === cards.length - 1;
            const marginRight = last
              ? 0
              : revealed
                ? CAKEDUEL_REVEALED_PILE_GAP_PX
                : -layout.pileOverlapPx;
            const cardData: CakeDuelCardData = {
              id: String(card.entityId),
              frontImage: revealedName ? resolveCardFront(revealedName) : cardBackImage,
              backImage: cardBackImage,
            };

            return (
              <div
                key={card.entityId}
                className="relative"
                style={{ marginRight, zIndex: index }}
                data-cakeduel-pile-card={card.entityId}
              >
                <div
                  style={{
                    transform: opponentSide && revealed ? "rotate(180deg)" : undefined,
                    transition: "transform 220ms cubic-bezier(.2,.8,.2,1)",
                  }}
                >
                  <CakeDuelCard
                    data={cardData}
                    faceUp={revealed}
                    width={layout.cardWidth}
                    height={layout.cardHeight}
                    borderRadius={layout.borderRadius}
                    inverted={opponentSide}
                    disabled
                    flipDelayMs={card.flipDelayMs ?? 0}
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
});

export interface CakeDuelPilesProps {
  attackerIndex: number;
  attackPile: readonly CakeDuelPileCard[];
  blockPile: readonly CakeDuelPileCard[];
  cardBackImage: string;
  resolveCardFront: (name: string) => string;
}

export const CakeDuelPiles = memo(function CakeDuelPiles({
  attackerIndex,
  attackPile,
  blockPile,
  cardBackImage,
  resolveCardFront,
}: CakeDuelPilesProps) {
  const layout = useCakeDuelLayout();
  const pileLayout = deriveCakeDuelPileLayout(attackerIndex);
  const byType = { attack: attackPile, block: blockPile } as const;
  const piles = (
    <>
      <CakeDuelPile
        pileType={pileLayout.opponentPile}
        cards={byType[pileLayout.opponentPile]}
        opponentSide
        cardBackImage={cardBackImage}
        resolveCardFront={resolveCardFront}
      />
      <CakeDuelPile
        pileType={pileLayout.playerPile}
        cards={byType[pileLayout.playerPile]}
        cardBackImage={cardBackImage}
        resolveCardFront={resolveCardFront}
      />
    </>
  );

  if (layout.compact) {
    return (
      <div className="absolute inset-0 pointer-events-none" data-cakeduel-piles>
        <div
          className="absolute left-1/2 -translate-x-1/2 flex flex-row items-start gap-4 pointer-events-auto"
          style={{ top: Math.round(layout.cardHeight * 0.25) + 26 }}
        >
          {piles}
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none" data-cakeduel-piles>
      <div className="flex flex-col items-center gap-1 pointer-events-auto -translate-y-8">{piles}</div>
    </div>
  );
});

export interface CakeDuelDeckProps {
  topCards: readonly CakeDuelZoneCard[];
  count: number;
  cardBackImage: string;
}

const DECK_STACK_OFFSET = 1.5;

export const CakeDuelDeck = memo(function CakeDuelDeck({
  topCards,
  count,
  cardBackImage,
}: CakeDuelDeckProps) {
  const layout = useCakeDuelLayout();

  return (
    <div
      className="relative"
      style={{ width: layout.cardWidth + 6, height: layout.cardHeight + 6 }}
      data-cakeduel-deck
    >
      {topCards.map((card, index) => {
        const reverseIndex = topCards.length - 1 - index;
        const offset = reverseIndex * DECK_STACK_OFFSET;
        return (
          <div
            key={card.entityId}
            className="absolute"
            style={{ left: offset, top: offset, zIndex: topCards.length - reverseIndex }}
          >
            <CakeDuelCard
              data={{ id: String(card.entityId), frontImage: cardBackImage, backImage: cardBackImage }}
              faceUp={false}
              width={layout.cardWidth}
              height={layout.cardHeight}
              borderRadius={layout.borderRadius}
              disabled
            />
          </div>
        );
      })}
      {count > 0 ? (
        <div
          className="absolute backdrop-blur-md rounded-full w-7 h-7 flex items-center justify-center text-xs font-bold text-stone-700 shadow"
          style={{
            bottom: -6,
            left: -14,
            zIndex: 20,
            background: "linear-gradient(180deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.40) 100%)",
            border: "1px solid rgba(255,255,255,0.6)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.8), 0 4px 16px rgba(0,0,0,0.15), 0 0 1px rgba(0,0,0,0.1)",
          }}
        >
          {count}
        </div>
      ) : (
        <div
          className="absolute inset-0 border border-dashed border-amber-800/20 flex items-center justify-center"
          style={{ width: layout.cardWidth, height: layout.cardHeight, borderRadius: layout.borderRadius }}
        >
          <span className="text-[9px] text-amber-200/20">0</span>
        </div>
      )}
    </div>
  );
});

export interface CakeDuelCakeRailProps {
  playerCakes: number;
  noriCakes: number;
  cakeImage: string;
}

export const CakeDuelCakeRail = memo(function CakeDuelCakeRail({
  playerCakes,
  noriCakes,
  cakeImage,
}: CakeDuelCakeRailProps) {
  const layout = useCakeDuelLayout();
  const tokens = useMemo(
    () => deriveCakeDuelCakeTokenLayout(playerCakes, noriCakes),
    [noriCakes, playerCakes],
  );
  const size = layout.cakeTokenPx;

  const renderToken = (id: number) => (
    <div key={id} className="relative" style={{ width: size, height: size }} data-cakeduel-cake-token={id}>
      <img src={cakeImage} alt="" className="h-full w-full drop-shadow-md" draggable={false} />
    </div>
  );

  return (
    <div
      className="relative flex h-full shrink-0 items-center justify-center py-2 px-1"
      style={{ width: size + 16 }}
      data-cakeduel-cake-rail
    >
      <div
        className="absolute inset-y-2 inset-x-1 rounded-xl backdrop-blur-md"
        style={{
          background: "linear-gradient(180deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.40) 50%, rgba(255,255,255,0.55) 100%)",
          border: "1px solid rgba(255,255,255,0.6)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.8), 0 4px 16px rgba(0,0,0,0.15), 0 0 1px rgba(0,0,0,0.1)",
        }}
      />
      <div
        className="absolute left-1/2 -translate-x-1/2 z-[1] rounded-full"
        style={{ width: 6, top: 22, bottom: 22, background: "#d4944a", border: "1px solid #b87736" }}
      />
      <div
        className="absolute left-1/2 -translate-x-1/2 z-[2] rounded-full"
        style={{ width: 12, height: 12, top: 14, background: "#e8a85c", border: "1px solid #b87736" }}
      />
      <div
        className="absolute left-1/2 -translate-x-1/2 z-[2] rounded-full"
        style={{ width: 12, height: 12, bottom: 14, background: "#e8a85c", border: "1px solid #b87736" }}
      />
      <div className="relative z-10 flex h-full flex-col items-center py-6">
        <div className="flex flex-col items-center" style={{ gap: -size / 2 }}>
          {tokens.noriTokenIds.map(renderToken)}
        </div>
        <div className="flex-1" />
        <div className="flex flex-col items-center" style={{ gap: -size / 2 }}>
          {tokens.playerTokenIds.map(renderToken)}
        </div>
      </div>
    </div>
  );
});
