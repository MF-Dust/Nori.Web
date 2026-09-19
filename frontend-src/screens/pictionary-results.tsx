import { pictionarySummary, type PictionaryGame } from "../apps/pictionary-model";
import { createSourceTranslate } from "../i18n/translate";

export function PictionaryResults({ game, locale, pending, onRestart }: {
  game: PictionaryGame; locale: string; pending: boolean; onRestart(): void;
}) {
  const summary = pictionarySummary(game), translate = createSourceTranslate(locale);
  const t = (key: string, values?: Record<string, string | number>) => translate("pictionary.results." + key, values);
  const seconds = (value: number | null) => value === null ? "—" : `${(value / 1000).toFixed(1)}s`;
  return <div className="source-pictionary-results" data-pictionary-results>
    <section className="source-pictionary-result-sheet">
      <header><span>{t("recordingComplete")}</span><small>{t("session")}</small></header>
      <h1>{t("sessionComplete")}</h1>
      <div className="source-pictionary-tape" aria-hidden="true"><i /><span>NORI · SKETCHBOOK</span><i /></div>
      <div className="source-pictionary-score"><strong>{summary.solved}</strong><span>{t("ofAttempted", { count: summary.attempted })}</span></div>
      <dl className="source-pictionary-result-stats">
        {[["duration", `${Math.floor(summary.durationMs / 60000)}:${String(Math.floor(summary.durationMs / 1000) % 60).padStart(2, "0")}`],
          ["accuracy", `${summary.accuracy}%`], ["fastest", seconds(summary.bestTime)], ["average", seconds(summary.avgTime)]].map(([key, value]) =>
          <div key={key}><dt>{t(key)}</dt><dd>{value}</dd></div>)}
      </dl>
      <h2>{t("wordsAttempted")} <small>{t("entries", { count: game.history.length })}</small></h2>
      {game.history.length ? <ol className="source-pictionary-result-log">{game.history.map((item, index) =>
        <li key={index} data-outcome={item.outcome}>
          <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
          <div><strong>{item.word}</strong><small>{t(item.roles.drawer === "player" ? "you" : "nori")}</small></div>
          <span>{item.outcome === "unfinished" ? t("timesUp") : seconds(item.elapsedMs)}</span>
          <span aria-label={item.outcome}>{item.outcome === "solved" ? "✓" : item.outcome === "skipped" ? "−" : "…"}</span>
        </li>)}</ol> : <p>{t("noWordsRecorded")}</p>}
      <footer><span>{t("anotherRound")}</span><button type="button" disabled={pending} onClick={onRestart}>{t("playAgain")}</button></footer>
    </section>
  </div>;
}
