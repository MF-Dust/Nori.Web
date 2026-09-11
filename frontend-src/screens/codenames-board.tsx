import {
  memo,
  useCallback,
  useLayoutEffect,
  useRef,
  type CSSProperties,
} from "react";
import {
  deriveCodenamesBoardCellEligibility,
  deriveCodenamesCardInteraction,
  getCodenamesCardScale,
  getCodenamesCardWordFontSize,
  type CodenamesBoardPresentationCell,
  type CodenamesCardRole,
  type CodenamesSide,
  type CodenamesUiStateType,
} from "../apps/codenames-board-presentation";

export interface CodenamesBoardWord {
  text: string;
}

export interface CodenamesBoardGameState {
  board: readonly CodenamesBoardWord[];
  cells: readonly CodenamesBoardPresentationCell[];
  key: Record<CodenamesSide, readonly CodenamesCardRole[]>;
}

export interface CodenamesBoardUiState {
  type: CodenamesUiStateType;
}

export interface CodenamesBoardCardAnimation {
  cell: number;
  phase: string;
}

export interface CodenamesBoardProps {
  gameState: CodenamesBoardGameState;
  uiState: CodenamesBoardUiState;
  counterpartSide: CodenamesSide;
  pendingGuess: number | null;
  cardAnimation: CodenamesBoardCardAnimation | null;
  tutorialGuessCell: number | null;
  hoveredCellIndex?: number | null;
  selectedCards?: ReadonlySet<number>;
  onCardClick(index: number): void;
  onCardSelect?(index: number): void;
  onCardHover?(index: number | null): void;
}

const CARD_BASE_WIDTH = 160;
const CARD_BASE_HEIGHT = 100;
const GLOW_SYNC_DURATION_MS = 3_000;
const glowSyncDelay = `${-(Date.now() % GLOW_SYNC_DURATION_MS)}ms`;

interface CodenamesBoardCellProps {
  index: number;
  word: string;
  cell: CodenamesBoardPresentationCell;
  isSelected: boolean;
  isPending: boolean;
  isShaking: boolean;
  isDisabled: boolean;
  isClickable: boolean;
  canSelect: boolean;
  isHovered: boolean;
  showUnrevealedOutline: boolean;
  showMonsterOutline: boolean;
  onClick(): void;
  onHover(index: number | null): void;
}

const CodenamesBoardCell = memo(function CodenamesBoardCell({
  index,
  word,
  cell,
  isSelected,
  isPending,
  isShaking,
  isDisabled,
  isClickable,
  canSelect,
  isHovered,
  showUnrevealedOutline,
  showMonsterOutline,
  onClick,
  onHover,
}: CodenamesBoardCellProps) {
  const assassinated = cell.assassinatedBy != null;
  const solved = cell.solvedBy != null;
  const interaction = deriveCodenamesCardInteraction({
    solved,
    assassinated,
    isSelected,
    isPending,
    isShaking,
    isDisabled,
    isClickable,
    canSelect,
    isHovered,
  });

  const enter = useCallback(() => onHover(index), [index, onHover]);
  const leave = useCallback(() => onHover(null), [onHover]);

  return (
    <div
      className="overflow-visible"
      data-card-cell={index}
      onMouseEnter={enter}
      onMouseLeave={leave}
    >
      <div className={interaction.wrapperClassName}>
        <div className="w-full aspect-[16/10] overflow-visible">
          <div
            className="origin-top-left overflow-visible"
            style={{
              width: CARD_BASE_WIDTH,
              height: CARD_BASE_HEIGHT,
              transform: "scale(var(--card-scale,1))",
            }}
          >
            <div className="relative w-full h-full overflow-visible">
              {showUnrevealedOutline ? (
                <div
                  className="codenames-treasure-glow"
                  style={{ "--glow-sync-delay": glowSyncDelay } as CSSProperties}
                  aria-hidden="true"
                >
                  <div className="codenames-treasure-spin" />
                </div>
              ) : null}
              {showMonsterOutline ? (
                <div
                  className="codenames-monster-glow"
                  style={{ "--glow-sync-delay": glowSyncDelay } as CSSProperties}
                  aria-hidden="true"
                >
                  <div className="codenames-monster-spin" />
                </div>
              ) : null}
              <button
                type="button"
                className={interaction.buttonClassName}
                onClick={onClick}
                disabled={!interaction.interactive}
              >
                <span
                  className="game-card-word"
                  style={{ fontSize: getCodenamesCardWordFontSize(word) }}
                >
                  {word}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

/**
 * Source-owned composition for the shipped Codenames 5x5 board.
 *
 * The parent continues to own the game/runtime state. This component owns the
 * fixed grid geometry, ResizeObserver scale, per-cell presentation derivation,
 * hover forwarding and select/guess click routing used by GameScreen.
 */
export const CodenamesBoard = memo(function CodenamesBoard({
  gameState,
  uiState,
  counterpartSide,
  pendingGuess,
  cardAnimation,
  tutorialGuessCell,
  hoveredCellIndex = null,
  selectedCards,
  onCardClick,
  onCardSelect,
  onCardHover,
}: CodenamesBoardProps) {
  const boardRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const board = boardRef.current;
    if (!board) return;
    const observer = new ResizeObserver(([entry]) => {
      board.style.setProperty("--card-scale", String(getCodenamesCardScale(entry.contentRect.width)));
    });
    observer.observe(board);
    return () => observer.disconnect();
  }, []);

  const hover = useCallback(
    (index: number | null) => {
      onCardHover?.(index);
    },
    [onCardHover],
  );

  return (
    <div
      ref={boardRef}
      className="h-full grid grid-cols-5 grid-rows-5 gap-2 p-2"
      data-codenames-board
      style={{ overflow: "visible" }}
    >
      {gameState.board.map((word, index) => {
        const cell = gameState.cells[index];
        if (!cell) return null;
        const counterpartRole =
          uiState.type === "HUMAN_GIVING_CLUE" ? gameState.key[counterpartSide][index] ?? null : null;
        const eligibility = deriveCodenamesBoardCellEligibility({
          index,
          uiStateType: uiState.type,
          counterpartSide,
          counterpartRole,
          tutorialGuessCell,
          cell,
        });
        const isShaking = cardAnimation?.cell === index && cardAnimation.phase === "shake";
        const click = () => {
          if (eligibility.clickAction === "select") {
            onCardSelect?.(index);
          } else if (eligibility.clickAction === "guess") {
            onCardClick(index);
          }
        };

        return (
          <CodenamesBoardCell
            key={index}
            index={index}
            word={word.text}
            cell={cell}
            isSelected={selectedCards?.has(index) ?? false}
            isPending={pendingGuess === index}
            isShaking={isShaking}
            isDisabled={eligibility.isDisabled}
            isClickable={eligibility.isClickable}
            canSelect={eligibility.canSelect}
            isHovered={hoveredCellIndex === index}
            showUnrevealedOutline={eligibility.showUnrevealedOutline}
            showMonsterOutline={eligibility.showMonsterOutline}
            onClick={click}
            onHover={hover}
          />
        );
      })}
    </div>
  );
});
