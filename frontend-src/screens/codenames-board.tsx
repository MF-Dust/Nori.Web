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
  translate?: (key: string) => string;
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
  tapToConfirm: string;
  onClick(): void;
  onHover(index: number | null): void;
}

function RevealedAgent({ side }: { side: CodenamesSide }) {
  return (
    <div
      className="absolute inset-0 z-20 rounded-xl overflow-hidden border border-[var(--codenames-agent-border)] bg-[var(--codenames-agent-bg)] shadow-md"
      style={{ transform: side === "B" ? "rotate(180deg)" : "none" }}
      data-codenames-revealed-agent={side}
    >
      <div className="absolute inset-[14%] rounded-lg border-2 border-amber-900/30" />
      <div className="absolute left-1/2 top-1/2 h-10 w-14 -translate-x-1/2 -translate-y-1/2 rounded-md bg-amber-200/60 border border-amber-900/30" />
    </div>
  );
}

function RevealedAssassin({ side }: { side: CodenamesSide }) {
  return (
    <div
      className="absolute inset-0 z-20 rounded-xl overflow-hidden border border-[var(--codenames-assassin-border)] bg-[var(--codenames-assassin-bg)] shadow-md"
      style={{ transform: side === "B" ? "rotate(180deg)" : "none" }}
      data-codenames-revealed-assassin={side}
    >
      <div className="absolute left-1/2 top-1/2 size-14 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-slate-400/30 bg-slate-950/70" />
      <div className="absolute left-[35%] top-[42%] size-2 rounded-full bg-amber-100" />
      <div className="absolute right-[35%] top-[42%] size-2 rounded-full bg-amber-100" />
    </div>
  );
}

function BystanderMark({ side, slot }: { side: CodenamesSide; slot: 0 | 1 }) {
  return (
    <div
      className={`absolute z-20 pointer-events-none w-[46px] h-[46px] top-1 ${
        slot === 0 ? "right-1" : "right-[54px]"
      } ${side === "B" ? "rotate-180" : ""}`}
      data-codenames-bystander-mark={side}
    >
      <div className="size-full rounded-full border border-[var(--codenames-bystander-border)] bg-[var(--codenames-bystander-bg)] shadow-sm" />
    </div>
  );
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
  tapToConfirm,
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

              {cell.solvedBy ? <RevealedAgent side={cell.solvedBy} /> : null}
              {cell.assassinatedBy ? <RevealedAssassin side={cell.assassinatedBy} /> : null}
              {cell.bystanderMarks[0] ? <BystanderMark side={cell.bystanderMarks[0]} slot={0} /> : null}
              {cell.bystanderMarks[1] ? <BystanderMark side={cell.bystanderMarks[1]} slot={1} /> : null}
              {isShaking ? (
                <div className="absolute inset-0 rounded-xl bg-amber-400/40 pointer-events-none z-20" data-codenames-card-shake />
              ) : null}
            </div>
          </div>
        </div>
        {isPending ? (
          <div className="absolute -top-9 left-1/2 -translate-x-1/2 z-30 px-3 py-1.5 rounded-lg text-white text-xs font-semibold whitespace-nowrap game-card-tooltip">
            {tapToConfirm}
          </div>
        ) : null}
      </div>
    </div>
  );
});

/**
 * Source-owned composition for the shipped Codenames 5x5 board, including
 * solved/assassin/bystander reveals and pending-guess confirmation presentation.
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
  translate,
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
            showUnrevealedOutline={eligibility.showUnrevealedOutline && !(selectedCards?.has(index) ?? false)}
            showMonsterOutline={eligibility.showMonsterOutline}
            tapToConfirm={translate?.("codenames.game.tapToConfirm") ?? "Tap to confirm"}
            onClick={click}
            onHover={hover}
          />
        );
      })}
    </div>
  );
});
