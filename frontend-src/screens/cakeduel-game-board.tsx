import { memo, useEffect, useMemo } from "react";
import {
  cakeDuelUsesHighResolutionHandCards,
  type CakeDuelCardIdentity,
} from "../apps/cakeduel-card-presentation";
import {
  findCakeDuelClaimAction,
  isCakeDuelTutorialClaimSelectionReady,
  mapCakeDuelSelectedEntityIdsToHandIndices,
  resolveCakeDuelDefaultClaim,
  type CakeDuelClaimPresentation,
  type CakeDuelLegalAction,
  type CakeDuelTutorialGate,
} from "../apps/cakeduel-game-presentation";
import { CakeDuelActionPanel, type CakeDuelPlayerAction } from "./cakeduel-action-panel";
import { type CakeDuelCardData } from "./cakeduel-card";
import { CakeDuelHand } from "./cakeduel-hand";
import { CakeDuelHud, type CakeDuelTranslate } from "./cakeduel-hud";
import { useCakeDuelLayout } from "./cakeduel-layout-context";
import {
  CakeDuelCakeRail,
  CakeDuelDeck,
  CakeDuelPiles,
  type CakeDuelPileCard,
  type CakeDuelZoneCard,
} from "./cakeduel-table";

export interface CakeDuelNamedZoneCard extends CakeDuelZoneCard {
  name: string;
}

export interface CakeDuelGameBoardView {
  phase: string;
  attackerIndex: number;
  boutWinners: readonly number[];
  gameEnded: boolean;
  attackingClaim?: CakeDuelClaimPresentation | null;
  blockingClaim?: CakeDuelClaimPresentation | null;
  me: { cakes: number };
  opponent: { cakes: number };
}

export interface CakeDuelGameBoardZones {
  playerHand: readonly CakeDuelNamedZoneCard[];
  opponentHand: readonly CakeDuelZoneCard[];
  attackPile: readonly CakeDuelPileCard[];
  blockPile: readonly CakeDuelPileCard[];
  deckTop: readonly CakeDuelZoneCard[];
  deckCount: number;
}

export interface CakeDuelGameBoardProps {
  view: CakeDuelGameBoardView;
  zones: CakeDuelGameBoardZones;
  isMyTurn: boolean;
  legalActions: readonly CakeDuelLegalAction[];
  selectedHandEntityIds: ReadonlySet<number>;
  handOrderEntityIds?: readonly number[];
  selectedClaim: string;
  selectedPickIndex: number | null;
  actionPending?: boolean;
  activeEffect?: boolean;
  tutorialGate?: CakeDuelTutorialGate;
  lastAttackPassed?: boolean;
  translate: CakeDuelTranslate;
  cardBackImage: string;
  cakeImage: string;
  resolveCardFront: (name: string, highResolution?: boolean) => string;
  resolveClaimColor?: (claim: string) => string;
  onHelp?: () => void;
  onToggleHandEntity: (entityId: number) => void;
  onReorderHandEntityIds: (entityIds: readonly number[]) => void;
  onSelectClaim: (claim: string) => void;
  onSelectPickIndex: (index: number) => void;
  onAction: (action: CakeDuelPlayerAction) => void;
}

function orderZoneCards<T extends CakeDuelZoneCard>(
  cards: readonly T[],
  entityOrder?: readonly number[],
): T[] {
  if (!entityOrder || entityOrder.length === 0) return [...cards];
  const byId = new Map(cards.map((card) => [card.entityId, card]));
  const ordered = entityOrder.map((id) => byId.get(id)).filter((card): card is T => card !== undefined);
  const orderedIds = new Set(ordered.map((card) => card.entityId));
  return [...ordered, ...cards.filter((card) => !orderedIds.has(card.entityId))];
}

function toCardData(
  card: CakeDuelNamedZoneCard,
  cardBackImage: string,
  resolveCardFront: (name: string, highResolution?: boolean) => string,
  highResolution: boolean,
): CakeDuelCardData {
  return {
    id: String(card.entityId),
    frontImage: resolveCardFront(card.name, false),
    hdFrontImage: highResolution ? resolveCardFront(card.name, true) : undefined,
    backImage: cardBackImage,
  };
}

/**
 * Source-owned Cake Duel in-game board composition. Runtime/store ownership is
 * deliberately injected through props so the shipped presentation can be
 * migrated independently of the cartridge controller.
 */
export const CakeDuelGameBoard = memo(function CakeDuelGameBoard({
  view,
  zones,
  isMyTurn,
  legalActions,
  selectedHandEntityIds,
  handOrderEntityIds,
  selectedClaim,
  selectedPickIndex,
  actionPending = false,
  activeEffect = false,
  tutorialGate = { kind: "off" },
  lastAttackPassed = false,
  translate,
  cardBackImage,
  cakeImage,
  resolveCardFront,
  resolveClaimColor,
  onHelp,
  onToggleHandEntity,
  onReorderHandEntityIds,
  onSelectClaim,
  onSelectPickIndex,
  onAction,
}: CakeDuelGameBoardProps) {
  const layout = useCakeDuelLayout();
  const highResolution = cakeDuelUsesHighResolutionHandCards(layout);
  const orderedPlayerHand = useMemo(
    () => orderZoneCards(zones.playerHand, handOrderEntityIds),
    [handOrderEntityIds, zones.playerHand],
  );
  const playerCards = useMemo(
    () =>
      orderedPlayerHand.map((card) =>
        toCardData(card, cardBackImage, resolveCardFront, highResolution),
      ),
    [cardBackImage, highResolution, orderedPlayerHand, resolveCardFront],
  );
  const opponentCards = useMemo<CakeDuelCardData[]>(
    () =>
      zones.opponentHand.map((card) => ({
        id: String(card.entityId),
        frontImage: cardBackImage,
        backImage: cardBackImage,
      })),
    [cardBackImage, zones.opponentHand],
  );
  const selectedStringIds = useMemo(
    () => new Set([...selectedHandEntityIds].map(String)),
    [selectedHandEntityIds],
  );
  const selectedHandIndices = useMemo(
    () => mapCakeDuelSelectedEntityIdsToHandIndices(selectedHandEntityIds, zones.playerHand),
    [selectedHandEntityIds, zones.playerHand],
  );
  const tutorialSelectionReady = useMemo(
    () => isCakeDuelTutorialClaimSelectionReady(tutorialGate, selectedHandIndices, zones.playerHand),
    [selectedHandIndices, tutorialGate, zones.playerHand],
  );
  const claimAction = useMemo(() => findCakeDuelClaimAction(legalActions), [legalActions]);

  useEffect(() => {
    if (!claimAction || selectedHandIndices.length === 0) {
      if (selectedClaim) onSelectClaim("");
      return;
    }
    if (tutorialGate.kind === "claim") {
      if (selectedClaim !== tutorialGate.claim) onSelectClaim(tutorialGate.claim);
      return;
    }
    if (selectedClaim) return;
    const defaultClaim = resolveCakeDuelDefaultClaim(
      claimAction.claimFrom,
      selectedHandIndices,
      zones.playerHand.map((card) => card.name),
    );
    if (defaultClaim) onSelectClaim(defaultClaim);
  }, [claimAction, onSelectClaim, selectedClaim, selectedHandIndices, tutorialGate, zones.playerHand]);

  const hasClaimAction = claimAction !== null;
  const tutorialBlocksHand = tutorialGate.kind !== "off" && tutorialGate.kind !== "claim";
  const handDisabled = actionPending || !isMyTurn || !hasClaimAction || tutorialBlocksHand || activeEffect;
  const { highlightedIds, dimmedIds } = useMemo(() => {
    if (handDisabled || tutorialGate.kind !== "claim") {
      return { highlightedIds: undefined, dimmedIds: undefined };
    }
    const highlighted = new Set<string>();
    const dimmed = new Set<string>();
    for (const card of zones.playerHand) {
      const id = String(card.entityId);
      if (tutorialGate.requiredEntityIds.has(card.entityId)) {
        if (!selectedStringIds.has(id)) highlighted.add(id);
      } else {
        dimmed.add(id);
      }
    }
    return { highlightedIds: highlighted, dimmedIds: dimmed };
  }, [handDisabled, selectedStringIds, tutorialGate, zones.playerHand]);

  return (
    <div className="relative z-10 flex h-full w-full flex-col" data-cakeduel-game-board>
      <CakeDuelHud
        phase={view.phase}
        isMyTurn={isMyTurn}
        attackerIndex={view.attackerIndex}
        boutWinners={view.boutWinners}
        attackingClaim={view.attackingClaim}
        blockingClaim={view.blockingClaim}
        translate={translate}
        resolveClaimImage={(claim) => resolveCardFront(claim, false)}
        cakeImage={cakeImage}
        onHelp={onHelp}
      />

      <div className="flex-1 min-h-0 overflow-hidden relative">
        <div className="absolute left-0 inset-y-0 z-20">
          <CakeDuelCakeRail playerCakes={view.me.cakes} noriCakes={view.opponent.cakes} cakeImage={cakeImage} />
        </div>

        <div className="h-full flex flex-col relative">
          <div className="shrink-0 relative" data-cakeduel-opponent-hand>
            {opponentCards.length > 0 ? (
              <div style={{ marginTop: layout.opponentShiftPx }}>
                <CakeDuelHand
                  cards={opponentCards}
                  faceUp={false}
                  config={layout.opponentHand}
                  draggable={false}
                  inverted
                  disabled
                />
              </div>
            ) : (
              <div className="flex justify-center items-center h-12">
                <div className="text-xs text-amber-200/30 italic">{translate("cakeduel.game.noCards")}</div>
              </div>
            )}
          </div>

          <div className="flex-1" />

          <div className="shrink-0 relative z-30">
            <CakeDuelActionPanel
              gameEnded={view.gameEnded}
              isMyTurn={isMyTurn}
              legalActions={legalActions}
              selectedHandIndices={selectedHandIndices}
              selectedClaim={selectedClaim}
              selectedPickIndex={selectedPickIndex}
              actionPending={actionPending}
              tutorialGate={tutorialGate}
              tutorialSelectionReady={tutorialSelectionReady}
              lastAttackPassed={lastAttackPassed}
              translate={translate}
              resolveClaimColor={resolveClaimColor}
              onSelectClaim={onSelectClaim}
              onSelectPickIndex={onSelectPickIndex}
              onAction={onAction}
            />
            <div
              className={layout.compact ? "shrink-0 px-3" : "shrink-0 px-4"}
              style={{ paddingBottom: layout.handBottomPadPx, ...(layout.compact ? { marginTop: -12 } : undefined) }}
              data-cakeduel-player-hand
            >
              {playerCards.length > 0 ? (
                <CakeDuelHand
                  cards={playerCards}
                  faceUp
                  config={layout.hand}
                  selectedIds={selectedStringIds}
                  highlightedIds={highlightedIds}
                  dimmedIds={dimmedIds}
                  disabled={handDisabled}
                  draggable={!handDisabled}
                  onCardClick={(id) => {
                    const entityId = Number.parseInt(id, 10);
                    if (Number.isFinite(entityId)) onToggleHandEntity(entityId);
                  }}
                  onReorder={(cards: readonly CakeDuelCardIdentity[]) => {
                    const ids = cards
                      .map((card) => Number.parseInt(card.id, 10))
                      .filter((id) => Number.isFinite(id));
                    onReorderHandEntityIds(ids);
                  }}
                />
              ) : (
                <div className="flex justify-center pb-2 pt-1">
                  <div className="text-xs text-amber-200/30 italic py-6">{translate("cakeduel.game.noCards")}</div>
                </div>
              )}
            </div>
          </div>

          <CakeDuelPiles
            attackerIndex={view.attackerIndex}
            attackPile={zones.attackPile}
            blockPile={zones.blockPile}
            cardBackImage={cardBackImage}
            resolveCardFront={(name) => resolveCardFront(name, false)}
          />

          <div
            className="absolute right-0 top-1/2"
            style={{ transform: "translateX(50%) translateY(-50%)" }}
          >
            <CakeDuelDeck topCards={zones.deckTop} count={zones.deckCount} cardBackImage={cardBackImage} />
          </div>
        </div>
      </div>
    </div>
  );
});
