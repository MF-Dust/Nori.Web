import { CHESS_TUTORIAL_STEPS } from "../apps/chess-model";
import { createSourceTranslate } from "../i18n/translate";

const english = createSourceTranslate("en");

/** Presentation follows the replicated step; it never advances the game locally. */
export function ChessTutorial({ step, reviewing, connected, translate, onReturnToLive }: {
  step: string;
  reviewing: boolean;
  connected: boolean;
  translate?: (key: string, values?: Record<string, string | number>) => string;
  onReturnToLive(): void;
}) {
  const index = CHESS_TUTORIAL_STEPS.findIndex(item => item.id === step);
  const current = CHESS_TUTORIAL_STEPS[index];
  const free = step === "free_play";
  const t = (key: string, values?: Record<string, string | number>) => {
    const path = "chess.tutorial." + key;
    const result = translate?.(path, values);
    return result && result !== path ? result : english(path, values);
  };
  return <section className="source-chess-tutorial" data-chess-tutorial={step} aria-label={t("title")}>
    <div role="status" aria-live="polite" aria-atomic="true">
      <strong>{t(free ? "freeTitle" : "title")}</strong>
      {current && <small>{t("progress", { step: index + 1, total: CHESS_TUTORIAL_STEPS.length })}</small>}
      <p>{!connected ? t("disconnected") : reviewing ? t("review") : free ? t("freeBody") : current
        ? t(current.mover === "player" ? "move" : "wait", current.move) : t("unknown")}</p>
      {connected && !reviewing && current && <p>{t("steps." + step)}</p>}
    </div>
    {current && <progress max={CHESS_TUTORIAL_STEPS.length} value={index}
      aria-label={t("title")} aria-valuetext={t("progress", { step: index + 1, total: CHESS_TUTORIAL_STEPS.length })} />}
    {reviewing && <button type="button" onClick={onReturnToLive}>{t("live")}</button>}
  </section>;
}
