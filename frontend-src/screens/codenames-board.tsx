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
      className="absolute inset-0 z-20 rounded-xl overflow-hidden"
      style={{
        transform: side === "B" ? "rotate(180deg)" : "none",
        background:
          "radial-gradient(ellipse 80% 65% at 45% 35%, hsl(48 50% 92%) 0%, hsl(42 55% 85%) 45%, hsl(35 55% 68%) 100%)",
        border: "3px solid hsl(38 50% 48% / .7)",
        boxShadow: "0 2px 8px rgba(0,0,0,.15)",
      }}
      data-codenames-revealed-agent={side}
    >
      <div
        className="absolute inset-[14%] rounded-lg"
        style={{ border: "2px solid hsl(35 45% 42% / .3)" }}
      />
      <div
        className="absolute left-1/2 top-1/2 h-10 w-14 -translate-x-1/2 -translate-y-1/2 rounded-md"
        style={{
          background: "linear-gradient(145deg, hsl(48 65% 72%), hsl(40 45% 50%))",
          border: "1px solid hsl(35 45% 42% / .35)",
        }}
      />
    </div>
  );
}

function RevealedAssassin({ side }: { side: CodenamesSide }) {
  return (
    <div
      className="absolute inset-0 z-20 rounded-xl overflow-hidden"
      style={{
        transform: side === "B" ? "rotate(180deg)" : "none",
        background:
          "radial-gradient(ellipse 80% 60% at 50% 50%, hsla(180,30%,30%,.4) 0%, transparent 70%), linear-gradient(170deg, hsl(195 35% 28%) 0%, hsl(200 40% 20%) 50%, hsl(205 45% 14%) 100%)",
        border: "3px solid hsl(190 35% 35%)",
        boxShadow: "0 2px 8px rgba(0,0,0,.15)",
      }}
      data-codenames-revealed-assassin={side}
    >
      <div
        className="absolute left-1/2 top-1/2 size-14 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ border: "2px solid hsla(195,25%,65%,.3)", background: "hsla(205,45%,8%,.72)" }}
      />
      <div className="absolute left-[35%] top-[42%] size-2 rounded-full" style={{ background: "hsl(45 90% 70%)" }} />
      <div className="absolute right-[35%] top-[42%] size-2 rounded-full" style={{ background: "hsl(45 90% 70%)" }} />
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
      <div
        className="size-full rounded-full"
        style={{
          background: "radial-gradient(circle at 35% 30%, hsl(12 80% 75%), hsl(5 55% 55%) 55%, hsl(2 50% 45%))",
          border: "2px solid hsl(15 40% 55% / .6)",
          boxShadow: "0 1px 3px rgba(0,0,0,.18)",
        }}
      />
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
    <div className="overflow-visible" data-card-cell={index} onMouseEnter={enter} onMouseLeave={leave}>
      <div className={interaction.wrapperClassName}>
        <div className="w-full aspect-[16/10] overflow-visible">
          <div
            className="origin-top-left overflow-visible"
            style={{ width: CARD_BASE_WIDTH, height: CARD_BASE_HEIGHT, transform: "scale(var(--card-scale,1))" }}
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
                <span className="game-card-word" style={{ fontSize: getCodenamesCardWordFontSize(word) }}>
                  {word}
                </span>
              </button>

              {cell.solvedBy ? <RevealedAgent side={cell.solvedBy} /> : null}
              {cell.assassinatedBy ? <RevealedAssassin side={cell.assassinatedBy} /> : null}
              {cell.bystanderMarks[0] ? <BystanderMark side={cell.bystanderMarks[0]} slot={0} /> : null}
              {cell.bystanderMarks[1] ? <BystanderMark side={cell.bystanderMarks[1]} slot={1} /> : null}
              {isShaking ? (
                <div
                  className="absolute inset-0 rounded-xl pointer-events-none z-20"
                  style={{ background: "radial-gradient(circle, hsla(45,90%,55%,.4) 0%, transparent 75%)" }}
                  data-codenames-card-shake
                />
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
          if (eligibility.clickAction === "select") onCardSelect?.(index);
          else if (eligibility.clickAction === "guess") onCardClick(index);
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
