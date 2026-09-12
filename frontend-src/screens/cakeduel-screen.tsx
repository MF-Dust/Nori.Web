import { memo } from "react";
import { CakeDuelBanner, type CakeDuelBannerMessage } from "./cakeduel-banner";
import { CakeDuelGameBoard, type CakeDuelGameBoardProps } from "./cakeduel-game-board";
import { CakeDuelMeasuredLayout } from "./cakeduel-layout-context";
import { CakeDuelActionError, CakeDuelWolfyTaunt } from "./cakeduel-overlays";
import type { CakeDuelTranslate } from "./cakeduel-hud";

export type CakeDuelScreenStage = "loading" | "empty" | "game";

export interface CakeDuelScreenProps {
  stage: CakeDuelScreenStage;
  backgroundImage: string;
  translate: CakeDuelTranslate;
  gameBoard?: CakeDuelGameBoardProps;
  banner?: CakeDuelBannerMessage | null;
  actionError?: string | null;
  wolfyTaunt?: {
    frameImages: readonly [string, string, string, string];
    accentColor?: string;
  } | null;
  onBackToStart?: () => void;
}

/**
 * Source-owned Cake Duel in-game screen shell. It owns loading/empty/game
 * staging, background composition and the recovered banner/error/Wolfy layers;
 * runtime navigation and cartridge lifecycle remain host injected.
 */
export const CakeDuelScreen = memo(function CakeDuelScreen({
  stage,
  backgroundImage,
  translate,
  gameBoard,
  banner = null,
  actionError = null,
  wolfyTaunt = null,
  onBackToStart,
}: CakeDuelScreenProps) {
  const effectiveStage = stage === "game" && !gameBoard ? "empty" : stage;

  return (
    <div
      className="relative h-full w-full overflow-hidden"
      data-cakeduel-screen={effectiveStage}
    >
      <img
        src={backgroundImage}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
        draggable={false}
      />

      {effectiveStage === "loading" ? (
        <>
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative z-10 flex h-full w-full items-center justify-center">
            <div className="text-sm text-amber-200/60">{translate("cakeduel.game.loading")}</div>
          </div>
        </>
      ) : null}

      {effectiveStage === "empty" ? (
        <>
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative z-10 flex h-full w-full flex-col items-center justify-center gap-3">
            <div className="text-sm text-amber-200/60">{translate("cakeduel.game.noGame")}</div>
            {onBackToStart ? (
              <button
                type="button"
                onClick={onBackToStart}
                className="rounded-md bg-amber-600 px-3 py-1.5 text-sm font-semibold text-amber-50 hover:bg-amber-500"
              >
                {translate("cakeduel.game.backToStart")}
              </button>
            ) : null}
          </div>
        </>
      ) : null}

      {effectiveStage === "game" && gameBoard ? (
        <CakeDuelMeasuredLayout>
          <CakeDuelGameBoard {...gameBoard} />
        </CakeDuelMeasuredLayout>
      ) : null}

      {effectiveStage === "game" && gameBoard ? (
        <CakeDuelBanner
          message={banner}
          translate={translate}
          resolveClaimColor={gameBoard.resolveClaimColor}
          resolveCardImage={(name) => gameBoard.resolveCardFront(name, false)}
        />
      ) : null}
      {wolfyTaunt ? (
        <CakeDuelWolfyTaunt
          active
          frameImages={wolfyTaunt.frameImages}
          accentColor={wolfyTaunt.accentColor}
        />
      ) : null}
      <CakeDuelActionError message={actionError} />
    </div>
  );
});
