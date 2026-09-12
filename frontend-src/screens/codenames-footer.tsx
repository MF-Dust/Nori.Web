import { memo } from "react";
import { deriveCodenamesFooterPresentation } from "../apps/codenames-footer-presentation";
import type { CodenamesUiStateType } from "../apps/codenames-board-presentation";

export interface CodenamesFooterProps {
  uiStateType: CodenamesUiStateType;
  canEndTurn?: boolean;
  shouldPulse?: boolean;
  onEndTurn?(): void;
  translate(key: string): string;
}

/** Source-owned composition for the shipped Codenames turn footer. */
export const CodenamesFooter = memo(function CodenamesFooter({
  uiStateType,
  canEndTurn = false,
  shouldPulse = false,
  onEndTurn,
  translate,
}: CodenamesFooterProps) {
  const presentation = deriveCodenamesFooterPresentation({
    uiStateType,
    canEndTurn,
    hasEndTurnHandler: onEndTurn != null,
  });

  if (!presentation.status && !presentation.showEndTurn) return null;

  return (
    <div className="shrink-0 p-3 min-h-[52px]" data-codenames-footer>
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
          {presentation.status ? (
            <>
              <span data-codenames-footer-icon={presentation.status.icon} aria-hidden="true" />
              <span className="truncate">{translate(presentation.status.translationKey)}</span>
              {presentation.status.showSpinner ? (
                <span className="size-3.5 animate-spin rounded-full border border-current border-r-transparent" aria-hidden="true" />
              ) : null}
            </>
          ) : null}
        </div>

        {presentation.showEndTurn ? (
          <button
            type="button"
            onClick={onEndTurn}
            className={`gap-1.5 rounded-md border px-3 py-1.5 text-sm ${
              shouldPulse ? "codenames-end-turn-pulse" : ""
            }`}
          >
            {translate("codenames.footer.doneGuessing")}
          </button>
        ) : null}
      </div>
    </div>
  );
});
