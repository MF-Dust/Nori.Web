import { memo } from "react";
import { CircleHelp } from "lucide-react";
import {
  deriveCakeDuelHudPresentation,
  type CakeDuelClaimName,
  type CakeDuelHudState,
} from "../apps/cakeduel-game-presentation";
import { useCakeDuelLayout } from "./cakeduel-layout-context";

export type CakeDuelTranslate = (
  key: string,
  values?: Readonly<Record<string, string | number>>,
) => string;

export interface CakeDuelHudProps extends CakeDuelHudState {
  translate: CakeDuelTranslate;
  resolveClaimImage?: (claim: CakeDuelClaimName) => string;
  cakeImage?: string;
  onHelp?: () => void;
}

const TURN_BANNER_CLIP =
  "polygon(14px 0%, calc(100% - 14px) 0%, 100% 50%, calc(100% - 14px) 100%, 14px 100%, 0% 50%)";

/** Source-owned three-column Cake Duel HUD from the shipped game screen. */
export const CakeDuelHud = memo(function CakeDuelHud({
  translate,
  resolveClaimImage,
  cakeImage,
  onHelp,
  ...state
}: CakeDuelHudProps) {
  const layout = useCakeDuelLayout();
  const presentation = deriveCakeDuelHudPresentation(state);
  const compact = layout.compact;

  return (
    <div className="shrink-0 relative" data-cakeduel-hud>
      <div className="bg-card/95 backdrop-blur-sm">
        <div
          className={`grid grid-cols-[1fr_auto_1fr] items-center ${compact ? "px-3 h-12" : "px-5 h-14"}`}
        >
          <div className="flex items-center justify-start">
            {onHelp ? (
              <button
                type="button"
                onClick={onHelp}
                aria-label={translate("cakeduel.help.button")}
                className="flex items-center gap-1.5 rounded-full bg-muted/50 px-3 py-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <CircleHelp className="h-3.5 w-3.5" />
                <span className="text-[11px] font-semibold">{translate("cakeduel.help.button")}</span>
              </button>
            ) : null}
          </div>

          <div className="flex justify-center px-4">
            <div
              className={`flex items-center select-none whitespace-nowrap ${state.isMyTurn ? "" : "bg-muted"}`}
              style={{
                clipPath: TURN_BANNER_CLIP,
                padding: compact ? "5px 26px" : "7px 38px",
                background: state.isMyTurn
                  ? "linear-gradient(135deg, #92400e, #d97706, #92400e)"
                  : undefined,
                filter: state.isMyTurn ? "drop-shadow(0 0 10px rgba(217,119,6,0.24))" : undefined,
              }}
              data-cakeduel-turn-banner
            >
              <span
                className={`text-[13px] font-bold tracking-wide ${
                  state.isMyTurn ? "text-amber-50" : "text-muted-foreground"
                }`}
              >
                {translate(presentation.turnTranslationKey)}
              </span>
              {presentation.activeClaim ? (
                <div className="flex items-center gap-2 ml-3" data-cakeduel-hud-claim>
                  <div className={`w-px h-5 ${state.isMyTurn ? "bg-amber-300/30" : "bg-border"}`} />
                  {resolveClaimImage ? (
                    <img
                      src={resolveClaimImage(presentation.activeClaim.claim)}
                      alt={presentation.activeClaim.claim}
                      className="h-7 w-auto rounded-[2px] shadow-sm"
                      draggable={false}
                    />
                  ) : null}
                  <div className="flex flex-col leading-none gap-0.5">
                    <span
                      className={`text-[10px] ${
                        state.isMyTurn ? "text-amber-200/60" : "text-muted-foreground/60"
                      }`}
                    >
                      {translate("cakeduel.game.claimedLabel", {
                        who: translate(
                          presentation.activeClaimByPlayer
                            ? "cakeduel.game.you"
                            : "cakeduel.game.nori",
                        ),
                      })}
                    </span>
                    <span
                      className={`text-xs font-semibold capitalize ${
                        state.isMyTurn ? "text-amber-50" : "text-foreground"
                      }`}
                    >
                      {translate(`cakeduel.cards.${presentation.activeClaim.claim}`)}
                      <span
                        className={`ml-1 font-normal ${
                          state.isMyTurn ? "text-amber-200/80" : "text-muted-foreground"
                        }`}
                      >
                        ×{presentation.activeClaim.cardCount}
                      </span>
                    </span>
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <div className="flex items-center justify-end">
            <div className="flex items-center gap-1.5 rounded-full bg-muted/50 px-3.5 py-1">
              <span className="text-[10px] font-medium text-muted-foreground/60 uppercase">
                {translate("cakeduel.game.you")}
              </span>
              <span
                className={`text-sm font-bold tabular-nums ${
                  presentation.playerWins > 0 && presentation.playerWins >= presentation.noriWins
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-foreground"
                }`}
              >
                {presentation.playerWins}
              </span>
              {cakeImage ? <img src={cakeImage} alt="" className="h-5 w-5 drop-shadow-sm" draggable={false} /> : null}
              <span
                className={`text-sm font-bold tabular-nums ${
                  presentation.noriWins > 0 && presentation.noriWins > presentation.playerWins
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-foreground"
                }`}
              >
                {presentation.noriWins}
              </span>
              <span className="text-[10px] font-medium text-muted-foreground/60 uppercase">
                {translate("cakeduel.game.nori")}
              </span>
            </div>
          </div>
        </div>
      </div>
      <div
        className={`h-px ${
          state.isMyTurn
            ? "bg-gradient-to-r from-transparent via-amber-500/40 to-transparent"
            : "bg-border/50"
        }`}
      />
    </div>
  );
});
