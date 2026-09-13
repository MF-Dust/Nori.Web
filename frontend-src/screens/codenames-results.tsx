import type { CodenamesState } from "../apps/codenames-model";
import type { CodenamesTranslate } from "../apps/codenames-chat";
import { CodenamesForest } from "./codenames-forest.js";
import { CodenamesTreasureArt, CodenamesMonsterArt } from "./codenames-art.js";

export function CodenamesResults({ state, translate: t, pending, onRematch, onMenu }: {
  state: CodenamesState; translate: CodenamesTranslate; pending: boolean; onRematch(): void; onMenu(): void;
}) {
  const game = state.gameState;
  if (!game) return null;
  const win = game.winner === "TEAM";
  const total = game.key.A.filter((type, index) => type === "AGENT" || game.key.B[index] === "AGENT").length;
  const found = game.cells.filter(cell => cell.solvedBy !== null).length;
  const monster = game.cells.some(cell => cell.assassinatedBy !== null);
  return <div className="source-codenames-results" data-codenames-results={win ? "win" : "loss"}>
    <div className="source-codenames-results-forest" aria-hidden="true"><CodenamesForest /></div>
    <section className="source-codenames-result-card" aria-label={t("codenames.results." + (win ? "victory" : "defeat"))}>
      <div className="source-codenames-result-emblem" aria-hidden="true">{win ? <CodenamesTreasureArt /> : <CodenamesMonsterArt />}</div>
      <h1>{t("codenames.results." + (win ? "victory" : "defeat"))}</h1>
      <p>{t(win ? "codenames.results.victoryMessage" : monster ? "codenames.results.hitMonster" :
        total - found === 1 ? "codenames.results.treasuresRemaining" : "codenames.results.treasuresRemainingPlural", { count: Math.max(0, total - found) })}</p>
      <dl>
        <div><dt>{t("codenames.results.treasures")}</dt><dd>{found} / {total}</dd></div>
        <div><dt>{t("codenames.results.rounds")}</dt><dd>{Math.max(0, state.settings.tokens - game.tokensRemaining)} / {state.settings.tokens}</dd></div>
        <div><dt>{t("codenames.results.turns")}</dt><dd>{game.history.length}</dd></div>
      </dl>
      <div className="source-codenames-result-actions"><button type="button" disabled={pending} onClick={onRematch}>{t("codenames.buttons.rematch")}</button>
        <button type="button" disabled={pending} onClick={onMenu}>{t("codenames.buttons.backToMenu")}</button></div>
    </section>
  </div>;
}
