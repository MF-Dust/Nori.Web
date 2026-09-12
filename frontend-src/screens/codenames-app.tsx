import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import type { GameCartridgeController } from "../apps/game-cartridge-controller";
import { codenamesClueError, codenamesHistoryMessages, codenamesUiState, type CodenamesState } from "../apps/codenames-model";
import { deriveCodenamesBoardCellEligibility } from "../apps/codenames-board-presentation";
import { CODENAMES_BOARD_OVERLAY_DURATION_MS, type CodenamesBoardOverlayType } from "../apps/codenames-clue-presentation";
import type { CodenamesClueCount, CodenamesTranslate } from "../apps/codenames-chat";
import { CodenamesScreen } from "./codenames-screen";
import { CodenamesHelpOverlay } from "./codenames-help-overlay";
import "../styles/codenames-app.css";

export interface CodenamesAppProps {
  controller: GameCartridgeController<CodenamesState>;
  translate: CodenamesTranslate;
  locale?: string;
  playSound?: (cue: string) => void;
}
export function CodenamesApp({ controller, translate: t, locale = "en", playSound }: CodenamesAppProps) {
  const snapshot = useSyncExternalStore(controller.subscribe, controller.snapshot, controller.snapshot);
  useEffect(() => controller.retain(), [controller]);
  const [tokens, setTokens] = useState(9), [help, setHelp] = useState(false);
  const [count, setCount] = useState<CodenamesClueCount | -1>(-1);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [hovered, setHovered] = useState<number | null>(null);
  const [pendingGuess, setPendingGuess] = useState<number | null>(null);
  const [validation, setValidation] = useState<string | null>(null);
  const [overlay, setOverlay] = useState<CodenamesBoardOverlayType | null>(null);
  const state = snapshot.state, game = state?.gameState ?? null, player = state?.counterpartSide ?? "A";
  const ui = useMemo(() => codenamesUiState(game, player), [game, player]);
  const messages = useMemo(() => game ? codenamesHistoryMessages(game, player, t) : [], [game, player, t]);
  const turn = game?.history.at(-1);
  const turnKey = [ui.type, game?.history.length, turn?.guesses.length, turn?.endedBy, game?.tokensRemaining].join(":");
  useEffect(() => { setPendingGuess(null); setSelected(new Set()); setValidation(null); }, [turnKey]);
  const previousType = useRef<string | null>(null);
  useEffect(() => {
    const previous = previousType.current; previousType.current = game ? ui.type : null;
    if (!game || previous === ui.type) return;
    const next = ui.type === "GAME_OVER" ? game.winner === "TEAM" ? "win" : "lose" :
      ui.type.startsWith("SUDDEN_DEATH") && !previous?.startsWith("SUDDEN_DEATH") ? "sudden-death" :
      ui.type === "HUMAN_GIVING_CLUE" ? "your-turn" : ui.type === "AI_GIVING_CLUE" ? "agent-turn" : null;
    setOverlay(next);
  }, [ui.type, game]);
  useEffect(() => {
    if (!overlay) return;
    const timer = setTimeout(() => setOverlay(null), CODENAMES_BOARD_OVERLAY_DURATION_MS[overlay]);
    return () => clearTimeout(timer);
  }, [overlay]);
  const start = (tutorial = false) => void controller.dispatch({ type: "startGame",
    settings: { tokens, wordLocale: locale }, ...(tutorial ? { mode: "tutorial" } : {}) });
  const canEndTurn = ui.type === "HUMAN_GUESSING" && !!turn?.guesses.length && !snapshot.pending;
  return <section className="source-codenames-app">
    {!game ? <div className="source-codenames-menu">
      <p>{t("codenames.badge")}</p><h1>{t("codenames.title")}</h1><p>{t("codenames.subtitle")}</p>
      <fieldset disabled={!snapshot.mounted || snapshot.pending}><legend>{t("codenames.difficulty.label")}</legend>
        {[{ tokens: 11, key: "easy" }, { tokens: 10, key: "normal" }, { tokens: 9, key: "hard" }].map(item =>
          <button type="button" key={item.tokens} aria-pressed={tokens === item.tokens} onClick={() => setTokens(item.tokens)}>
            {t("codenames.difficulty." + item.key)} · {t("codenames.difficulty.tokens", { count: item.tokens })}
          </button>)}
      </fieldset>
      <button type="button" disabled={!snapshot.mounted || snapshot.pending} onClick={() => start()}>{t("codenames.buttons.startMission")}</button>
      <button type="button" disabled={!snapshot.mounted || snapshot.pending} onClick={() => start(true)}>{t("codenames.buttons.tutorial")}</button>
      <button type="button" onClick={() => setHelp(true)}>{t("codenames.help.button")}</button>
    </div> : <>
      <CodenamesScreen gameState={game} uiState={ui} counterpartSide={player} messages={messages} translate={t}
        playSound={playSound}
        pendingGuess={pendingGuess} selectedCards={selected} hoveredCellIndex={hovered} clueCount={count}
        activeOverlay={overlay} onDismissOverlay={() => setOverlay(null)} onClueCountChange={setCount}
        onCardHover={setHovered} onClearPendingGuess={() => setPendingGuess(null)} canEndTurn={canEndTurn}
        onEndTurn={() => { if (canEndTurn) void controller.dispatch({ type: "endTurn" }); }}
        onCardSelect={index => {
          if (ui.type !== "HUMAN_GIVING_CLUE" || snapshot.pending) return;
          setSelected(previous => { const next = new Set(previous); if (next.has(index)) next.delete(index); else next.add(index); return next; });
        }}
        onCardClick={index => {
          if (snapshot.pending || !game.cells[index]) return;
          const eligibility = deriveCodenamesBoardCellEligibility({ index, uiStateType: ui.type, counterpartSide: player,
            counterpartRole: game.key[player][index], tutorialGuessCell: null, cell: game.cells[index] });
          if (eligibility.clickAction !== "guess") return;
          if (pendingGuess !== index) { setPendingGuess(index); return; }
          setPendingGuess(null); void controller.dispatch({ type: "submitGuess", cell: index });
        }}
        onSubmitClue={(word, inlineCount) => {
          if (snapshot.pending || ui.type !== "HUMAN_GIVING_CLUE") return false;
          const chosen = inlineCount ?? count;
          if (chosen === -1) { setValidation(t("codenames.chat.selectCountWarning")); return false; }
          const error = codenamesClueError(game, word, chosen);
          if (error) { setValidation(t("codenames.clueRejected." + error, { word })); return false; }
          setValidation(null);
          void controller.dispatch({ type: "submitClue", clue: { word: word.trim().toUpperCase(), count: chosen } }).then(ok => {
            if (ok) { setCount(-1); setSelected(new Set()); }
          });
          return true;
        }} />
      {game.phase === "GAME_OVER" && <div className="source-codenames-results" role="status">
        <strong>{t(game.winner === "TEAM" ? "codenames.results.victory" : "codenames.results.defeat")}</strong>
        <button type="button" disabled={snapshot.pending} onClick={() => start()}>{t("codenames.buttons.rematch")}</button>
        <button type="button" disabled={snapshot.pending} onClick={() => void controller.dispatch({ type: "reset" })}>{t("codenames.buttons.backToMenu")}</button>
      </div>}
    </>}
    {!snapshot.mounted && <button type="button" disabled={snapshot.pending} onClick={() => void controller.ensureMounted()}>{t("codenames.game.connecting")}</button>}
    {(validation || snapshot.error) && <p className="source-codenames-error" role="alert">{validation || snapshot.error}</p>}
    <CodenamesHelpOverlay open={help} translate={t} onClose={() => setHelp(false)} />
  </section>;
}
