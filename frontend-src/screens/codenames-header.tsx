import { memo } from "react";
import {
  countRemainingCodenamesTargets,
  type CodenamesPresentationState,
  type CodenamesSide,
} from "../apps/codenames-board-presentation";
import type { CodenamesClueUiState } from "../apps/codenames-clue-presentation";
import type { CodenamesTranslate } from "../apps/codenames-chat";
import { CodenamesClueDisplay } from "./codenames-clue-overlay";

export interface CodenamesHeaderGameState extends CodenamesPresentationState {
  tokensRemaining?: number;
  phase?: string;
}

export interface CodenamesHeaderProps {
  uiState: CodenamesClueUiState;
  counterpartSide: CodenamesSide;
  gameState: CodenamesHeaderGameState;
  translate: CodenamesTranslate;
  onHelp?: () => void;
}

/** Source-owned three-column header from the shipped Codenames GameScreen. */
export const CodenamesHeader = memo(function CodenamesHeader({
  uiState,
  counterpartSide,
  gameState,
  translate,
  onHelp,
}: CodenamesHeaderProps) {
  const remaining = countRemainingCodenamesTargets(gameState);
  const otherSide: CodenamesSide = counterpartSide === "A" ? "B" : "A";
  const tokensRemaining = gameState.tokensRemaining ?? 0;
  const suddenDeath = gameState.phase === "SUDDEN_DEATH";
  const ownCount = remaining[counterpartSide];
  const playerCount = remaining[otherSide];

  return (
    <header className="shrink-0 h-16 px-3 @[820px]/game:h-20 @[820px]/game:px-4 border-b bg-card/50 backdrop-blur-sm relative z-20" data-codenames-header>
      <div data-assassin-source className="absolute left-1/2 -top-10 -translate-x-1/2 opacity-0 pointer-events-none" />
      <div className="grid grid-cols-3 items-center gap-4 h-full">
        <div className="flex justify-start">
          <div className="flex items-center gap-3">
            <div data-bystander-source className="size-8 rounded-full bg-[var(--codenames-bystander-bg)]" />
            <div className={suddenDeath ? "flex flex-col items-start codenames-rounds-zero" : "flex flex-col items-start"}>
              <span className="text-xs text-muted-foreground uppercase tracking-wide">
                {translate("codenames.game.roundsLeft")}
              </span>
              <span className="text-lg font-bold tabular-nums">{tokensRemaining}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center h-full min-h-[3rem]">
          <CodenamesClueDisplay uiState={uiState} translate={translate} />
        </div>

        <div className="flex justify-end">
          <div className="flex items-center gap-3">
            <div
              className="flex flex-col items-end cursor-default"
              title={`${translate("codenames.game.youToGuess", { count: playerCount })}\n${translate(
                "codenames.game.noriToGuess",
                { count: ownCount },
              )}`}
            >
              <span className="text-xs text-muted-foreground uppercase tracking-wide">
                {translate("codenames.game.treasuresLeft")}
              </span>
              <span className="text-lg font-bold tabular-nums">
                {playerCount}+{ownCount}
              </span>
            </div>
            <div data-agent-source className="w-[40px] h-[25px] rounded-md bg-[var(--codenames-agent-bg)] border border-[var(--codenames-agent-border)]" />
            {onHelp ? (
              <button
                type="button"
                onClick={onHelp}
                aria-label={translate("codenames.help.button")}
                className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                ?
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
});
