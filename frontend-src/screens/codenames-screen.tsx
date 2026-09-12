import { memo, useCallback, useEffect, useMemo, useState } from "react";
import type { CodenamesSide } from "../apps/codenames-board-presentation";
import {
  CODENAMES_CLUE_COUNT_OPTIONS,
  formatCodenamesClueCount,
  parseCodenamesClueSubmission,
  type CodenamesBoardOverlayType,
  type CodenamesClueHighlight,
  type CodenamesClueUiState,
} from "../apps/codenames-clue-presentation";
import {
  recoverCodenamesChatMessages,
  type CodenamesClueCount,
  type CodenamesRawChatMessage,
  type CodenamesTranslate,
} from "../apps/codenames-chat";
import { ChatPanel, type ChatPanelProps } from "../components/chat-panel";
import {
  CodenamesBoard,
  type CodenamesBoardCardAnimation,
  type CodenamesBoardGameState,
} from "./codenames-board";
import { CodenamesClueOverlay } from "./codenames-clue-overlay";
import { CodenamesFlyingCard, type CodenamesFlyingCardState } from "./codenames-flying-card";
import { CodenamesFooter } from "./codenames-footer";
import { CodenamesHeader } from "./codenames-header";
import { CodenamesHelpOverlay } from "./codenames-help-overlay";
import { CodenamesKeyCard } from "./codenames-key-card";

export interface CodenamesScreenGameState extends CodenamesBoardGameState {
  tokensRemaining?: number;
  phase?: string;
}

export type CodenamesClueCountSelection = CodenamesClueCount | -1;
export type CodenamesConnectionState = "ready" | "connecting" | "loading";

export interface CodenamesScreenProps {
  gameState: CodenamesScreenGameState | null;
  uiState: CodenamesClueUiState;
  counterpartSide: CodenamesSide;
  messages: readonly CodenamesRawChatMessage[];
  translate: CodenamesTranslate;
  connectionState?: CodenamesConnectionState;
  pendingGuess?: number | null;
  cardAnimation?: CodenamesBoardCardAnimation | null;
  tutorialGuessCell?: number | null;
  activeOverlay?: CodenamesBoardOverlayType | null;
  clueHighlight?: CodenamesClueHighlight | null;
  clueCount?: CodenamesClueCountSelection;
  hoveredCellIndex?: number | null;
  selectedCards?: ReadonlySet<number>;
  flyingCard?: CodenamesFlyingCardState | null;
  canEndTurn?: boolean;
  shouldPulseEndTurn?: boolean;
  onCardClick(index: number): void;
  onCardSelect?(index: number): void;
  onCardHover?(index: number | null): void;
  onClearPendingGuess?: () => void;
  onEndTurn?: () => void;
  onDismissOverlay?: () => void;
  onFlyingCardLanded?: () => void;
  onHelp?: () => void;
  onClueCountChange?: (count: CodenamesClueCount) => void;
  onSubmitClue?: (word: string, inlineCount?: CodenamesClueCount) => boolean | void;
  playSound?: ChatPanelProps["playSound"];
}

function CodenamesClueCountSelector({
  uiState,
  clueCount,
  translate,
  onChange,
}: {
  uiState: CodenamesClueUiState;
  clueCount: CodenamesClueCountSelection;
  translate: CodenamesTranslate;
  onChange?: (count: CodenamesClueCount) => void;
}) {
  if (uiState.type !== "HUMAN_GIVING_CLUE") return null;
  const selected = clueCount !== -1;
  return (
    <div className="flex items-center gap-1.5" data-codenames-clue-count-selector>
      <span className="text-xs text-muted-foreground/70 select-none hidden @[820px]/game:inline">
        {translate(selected ? "codenames.chat.countLabel" : "codenames.chat.selectCount")}
      </span>
      <select
        className="w-14 rounded-full border bg-background px-2 py-1 text-xs"
        value={clueCount === -1 ? "" : String(clueCount)}
        onChange={(event) => {
          const raw = event.currentTarget.value;
          if (!raw) return;
          onChange?.(raw === "infinity" ? "infinity" : Number.parseInt(raw, 10));
        }}
        aria-label={translate("codenames.chat.selectCount")}
      >
        <option value="">—</option>
        {CODENAMES_CLUE_COUNT_OPTIONS.map((count) => (
          <option key={String(count)} value={String(count)}>
            {formatCodenamesClueCount(count)}
          </option>
        ))}
      </select>
    </div>
  );
}

/**
 * Source-owned Codenames GameScreen presentation.
 *
 * Game/controller state remains supplied by the host runtime; this component
 * owns the shipped header, board/overlay, turn footer, key card, chat/clue
 * composer, help sheet, flying-card layer and loading layout.
 */
export const CodenamesScreen = memo(function CodenamesScreen({
  gameState,
  uiState,
  counterpartSide,
  messages,
  translate,
  connectionState = "ready",
  pendingGuess = null,
  cardAnimation = null,
  tutorialGuessCell = null,
  activeOverlay = null,
  clueHighlight = null,
  clueCount = -1,
  hoveredCellIndex = null,
  selectedCards,
  flyingCard = null,
  canEndTurn = false,
  shouldPulseEndTurn = false,
  onCardClick,
  onCardSelect,
  onCardHover,
  onClearPendingGuess,
  onEndTurn,
  onDismissOverlay,
  onFlyingCardLanded,
  onHelp,
  onClueCountChange,
  onSubmitClue,
  playSound,
}: CodenamesScreenProps) {
  const [helpOpen, setHelpOpen] = useState(false);
  const chatMessages = useMemo(
    () => recoverCodenamesChatMessages(messages, translate),
    [messages, translate],
  );

  const submitClue = useCallback(
    (value: string) => {
      if (uiState.type !== "HUMAN_GIVING_CLUE") return true;
      const parsed = parseCodenamesClueSubmission(value);
      if (parsed.count !== undefined) onClueCountChange?.(parsed.count);
      return onSubmitClue?.(parsed.word, parsed.count) ?? false;
    },
    [onClueCountChange, onSubmitClue, uiState.type],
  );

  const openHelp = useCallback(() => {
    setHelpOpen(true);
    onHelp?.();
  }, [onHelp]);
  const closeHelp = useCallback(() => setHelpOpen(false), []);

  useEffect(() => {
    if (pendingGuess === null || !onClearPendingGuess) return;

    const handleDocumentClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (
        target.closest("[data-codenames-board]") ||
        target.closest("[data-debug-menu]") ||
        target.closest("button")
      ) {
        return;
      }
      onClearPendingGuess();
    };

    document.addEventListener("click", handleDocumentClick);
    return () => document.removeEventListener("click", handleDocumentClick);
  }, [onClearPendingGuess, pendingGuess]);

  if (connectionState !== "ready" || !gameState) {
    return (
      <div className="h-full flex items-center justify-center bg-background/50" data-codenames-loading>
        <div className="flex items-center gap-2 text-muted-foreground">
          <div className="size-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium">
            {translate(connectionState === "connecting" ? "codenames.game.connecting" : "codenames.game.loading")}
          </span>
        </div>
      </div>
    );
  }

  const clueGiver = uiState.type === "HUMAN_GIVING_CLUE";

  return (
    <div className="h-full flex flex-col bg-background/50 relative @container/game" data-codenames-screen>
      <CodenamesHeader
        uiState={uiState}
        counterpartSide={counterpartSide}
        gameState={gameState}
        translate={translate}
        onHelp={openHelp}
      />
      <div className="flex-1 min-h-0 p-2 gap-2 @[820px]/game:p-3 @[820px]/game:gap-3 flex bg-muted/50">
        <div className="flex-1 min-w-0 flex flex-col gap-2 @[820px]/game:gap-3">
          <div className="flex-1 min-h-0 overflow-visible relative">
            <CodenamesBoard
              gameState={gameState}
              uiState={uiState}
              counterpartSide={counterpartSide}
              pendingGuess={pendingGuess}
              cardAnimation={cardAnimation}
              tutorialGuessCell={tutorialGuessCell}
              hoveredCellIndex={hoveredCellIndex}
              selectedCards={selectedCards}
              translate={translate}
              onCardClick={onCardClick}
              onCardSelect={onCardSelect}
              onCardHover={onCardHover}
            />
            <CodenamesClueOverlay
              activeOverlay={activeOverlay}
              clueHighlight={clueHighlight}
              onDismissOverlay={onDismissOverlay}
              translate={translate}
            />
          </div>
          <CodenamesFooter
            uiStateType={uiState.type}
            canEndTurn={canEndTurn && tutorialGuessCell === null}
            shouldPulse={shouldPulseEndTurn}
            onEndTurn={onEndTurn}
            translate={translate}
          />
        </div>

        <div className="w-48 @[820px]/game:w-60 shrink-0 min-h-0 flex flex-col gap-2 @[820px]/game:gap-3">
          <CodenamesKeyCard
            keySide={gameState.key[counterpartSide]}
            label={translate("codenames.keyCard.yourKey")}
            active={clueGiver}
            hoveredCellIndex={hoveredCellIndex}
            selectedCards={selectedCards}
            onHover={onCardHover}
            onSelect={onCardSelect}
          />
          <div className="flex-1 min-h-0">
            <ChatPanel
              messages={chatMessages}
              isPlayerGuesser={clueGiver}
              active={uiState.type !== "GAME_OVER"}
              onSubmitGuess={submitClue}
              placeholder={
                clueGiver
                  ? translate("codenames.chat.cluePlaceholder")
                  : translate("codenames.chat.messagePlaceholder")
              }
              disabledPlaceholder={translate("codenames.chat.waiting")}
              emptyMessage={translate("codenames.chat.noTurns")}
              renderBeforeSubmit={() => (
                <CodenamesClueCountSelector
                  uiState={uiState}
                  clueCount={clueCount}
                  translate={translate}
                  onChange={onClueCountChange}
                />
              )}
              playSound={playSound}
            />
          </div>
        </div>
      </div>

      <CodenamesFlyingCard card={flyingCard} onLanded={onFlyingCardLanded} />
      <CodenamesHelpOverlay open={helpOpen} translate={translate} onClose={closeHelp} />
    </div>
  );
});
