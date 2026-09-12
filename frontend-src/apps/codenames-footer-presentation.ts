import type { CodenamesUiStateType } from "./codenames-board-presentation";

export type CodenamesFooterIcon = "eye" | "target" | "brain";

export interface CodenamesFooterStatus {
  translationKey: string;
  icon: CodenamesFooterIcon;
  showSpinner: boolean;
}

export interface CodenamesFooterPresentation {
  status: CodenamesFooterStatus | null;
  showEndTurn: boolean;
}

/**
 * Source-owned presentation contract for the shipped Codenames footer.
 *
 * The historical GameScreen maps UI-state types to one status label/icon pair
 * and only exposes the "done guessing" action during a human guessing turn
 * when the runtime explicitly allows ending the turn and supplies a callback.
 */
export function deriveCodenamesFooterPresentation(input: {
  uiStateType: CodenamesUiStateType;
  canEndTurn: boolean;
  hasEndTurnHandler: boolean;
}): CodenamesFooterPresentation {
  const status: CodenamesFooterStatus | null = (() => {
    switch (input.uiStateType) {
      case "HUMAN_GIVING_CLUE":
        return { translationKey: "codenames.footer.giveClue", icon: "eye", showSpinner: false };
      case "HUMAN_GUESSING":
        return { translationKey: "codenames.footer.yourTurn", icon: "target", showSpinner: false };
      case "AI_GIVING_CLUE":
        return { translationKey: "codenames.footer.noriThinking", icon: "brain", showSpinner: true };
      case "AI_GUESSING":
        return { translationKey: "codenames.footer.noriGuessing", icon: "brain", showSpinner: false };
      case "SUDDEN_DEATH_HUMAN_TURN":
        return { translationKey: "codenames.footer.suddenDeathYou", icon: "target", showSpinner: false };
      case "SUDDEN_DEATH_AI_TURN":
        return { translationKey: "codenames.footer.suddenDeathNori", icon: "brain", showSpinner: true };
      case "SUDDEN_DEATH_BOTH":
        return { translationKey: "codenames.footer.suddenDeathBoth", icon: "target", showSpinner: false };
      default:
        return null;
    }
  })();

  return {
    status,
    showEndTurn:
      input.uiStateType === "HUMAN_GUESSING" && input.canEndTurn && input.hasEndTurnHandler,
  };
}
