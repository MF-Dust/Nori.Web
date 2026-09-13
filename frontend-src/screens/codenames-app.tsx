import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import type { GameCartridgeController } from "../apps/game-cartridge-controller";
import { codenamesClueError, codenamesHistoryMessages, codenamesUiState, type CodenamesState } from "../apps/codenames-model";
import { deriveCodenamesBoardCellEligibility } from "../apps/codenames-board-presentation";
import { CODENAMES_BOARD_OVERLAY_DURATION_MS, type CodenamesBoardOverlayType } from "../apps/codenames-clue-presentation";
import type { CodenamesClueCount, CodenamesTranslate } from "../apps/codenames-chat";
import { CodenamesScreen } from "./codenames-screen";
import { CodenamesHelpOverlay } from "./codenames-help-overlay";
import { useCodenamesReveal } from "./use-codenames-reveal";
import { codenamesTutorialAllows, codenamesTutorialGate, codenamesTutorialUi } from "../apps/codenames-tutorial";
import type { CodenamesClueHighlight } from "../apps/codenames-clue-presentation";
import "../styles/codenames-app.css";
import "../styles/codenames-board.css";

export interface CodenamesAppProps {
  controller: GameCartridgeController<CodenamesState>;
  translate: CodenamesTranslate;
  locale?: string;
  playSound?: (cue: string) => void;
}
export function CodenamesApp({ controller, translate: t, locale = "en", playSound }: CodenamesAppProps) {
  const snapshot = useSyncExternalStore(controller.subscribe, controller.snapshot, controller.snapshot);
  const root = useRef<HTMLElement>(null);
  const reveal = useCodenamesReveal(controller, root, playSound);
  const busy = snapshot.pending || !!snapshot.presenting || snapshot.connected === false;
  useEffect(() => controller.retain(), [controller]);
  const [tokens, setTokens] = useState(9), [help, setHelp] = useState(false);
  const [count, setCount] = useState<CodenamesClueCount | -1>(-1);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [hovered, setHovered] = useState<number | null>(null);
  const [pendingGuess, setPendingGuess] = useState<number | null>(null);
  const [validation, setValidation] = useState<string | null>(null);
  const [overlay, setOverlay] = useState<CodenamesBoardOverlayType | null>(null);
  const state = snapshot.state, game = state?.gameState ?? null, player = state?.counterpartSide ?? "A";
  const tutorialStep = state?.tutorial?.step;
  const gate = useMemo(() => codenamesTutorialGate(tutorialStep), [tutorialStep]);
  const ui = useMemo(() => codenamesTutorialUi(codenamesUiState(game, player), gate), [game, player, gate]);
  const messages = useMemo(() => game ? codenamesHistoryMessages(game, player, t) : [], [game, player, t]);
  const turn = game?.history.at(-1);
  const turnKey = [ui.type, game?.history.length, turn?.guesses.length, turn?.endedBy, game?.tokensRemaining].join(":");
  useEffect(() => { setPendingGuess(null); setSelected(new Set()); setCount(-1); setValidation(null); }, [turnKey, tutorialStep]);
  const sound = useRef(playSound); sound.current = playSound;
  const [clueHighlight, setClueHighlight] = useState<CodenamesClueHighlight | null>(null);
  const previousHistory = useRef<number | null>(null);
  const historyLength = game?.history.length ?? null;
  useEffect(() => {
    const previous = previousHistory.current; previousHistory.current = historyLength;
    if (previous === null || historyLength === null || historyLength <= previous || !turn) { setClueHighlight(null); return; }
    setClueHighlight({ clue: turn.clue, label: t(turn.clueGiver === player ? "codenames.game.yourClue" : "codenames.game.norisClue") });
    sound.current?.("boardgames-codenames-clue-given");
    const timer = setTimeout(() => setClueHighlight(null), 3000);
    return () => clearTimeout(timer);
  }, [historyLength, player, t]);
  const previousType = useRef<string | null>(null);
  useEffect(() => {
    const previous = previousType.current; previousType.current = game ? ui.type : null;
    if (!game || previous === ui.type) return;
    const next = ui.type === "GAME_OVER" ? game.winner === "TEAM" ? "win" : "lose" :
      ui.type.startsWith("SUDDEN_DEATH") && !previous?.startsWith("SUDDEN_DEATH") ? "sudden-death" :
      ui.type === "HUMAN_GIVING_CLUE" ? "your-turn" : ui.type === "AI_GIVING_CLUE" ? "agent-turn" : null;
    setOverlay(next);
    if (previous && next) sound.current?.(next === "sudden-death" ? "boardgames-codenames-sudden-death-overlay" :
      next === "win" ? "boardgames-codenames-win-overlay" : next === "lose" ? "boardgames-codenames-lose-overlay" : "boardgames-codenames-turn-overlay");
  }, [ui.type, game]);
  useEffect(() => {
    if (!overlay) return;
    const timer = setTimeout(() => setOverlay(null), CODENAMES_BOARD_OVERLAY_DURATION_MS[overlay]);
    return () => clearTimeout(timer);
  }, [overlay]);
  const [showResults, setShowResults] = useState(false);
  const [epilogueRetry, setEpilogueRetry] = useState(0);
  const ended = game?.phase === "GAME_OVER", tutorial = !!state?.tutorial;
  useEffect(() => {
    setShowResults(false);
    if (!ended || tutorial) return;
    const timer = setTimeout(() => setShowResults(true), game?.winner === "TEAM" ? 1500 : 5000);
    return () => clearTimeout(timer);
  }, [ended, game?.winner, tutorial]);
  useEffect(() => {
    if (!ended || !tutorial) { setEpilogueRetry(0); return; }
    let cancelled = false;
    const timer = setTimeout(() => void controller.dispatch({ type: "reset" }).then(ok => {
      if (!ok && !cancelled) setEpilogueRetry(value => value + 1);
    }), epilogueRetry ? 3000 : 6000);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [ended, tutorial, controller, epilogueRetry]);
  const start = (tutorial = false) => void controller.dispatch({ type: "startGame",
    settings: { tokens, wordLocale: locale }, ...(tutorial ? { mode: "tutorial" } : {}) }).then(ok => {
      if (ok) sound.current?.("boardgames-codenames-game-start");
    });
  const canEndTurn = ui.type === "HUMAN_GUESSING" && !!turn?.guesses.length && !busy && codenamesTutorialAllows(gate, "endTurn");
  const shouldPulseEndTurn = canEndTurn && typeof turn?.clue.count === "number" && turn.clue.count > 0 && turn.guesses.filter(guess => guess.result === "AGENT").length >= turn.clue.count;
  return <section ref={root} className="source-codenames-app">
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
        {...reveal}
        clueHighlight={clueHighlight} tutorialGuessCell={gate.kind === "guess" ? gate.cell : null} shouldPulseEndTurn={shouldPulseEndTurn}
        pendingGuess={pendingGuess} selectedCards={selected} hoveredCellIndex={hovered} clueCount={count}
        activeOverlay={overlay} onDismissOverlay={() => setOverlay(null)} onClueCountChange={setCount}
        onCardHover={setHovered} onClearPendingGuess={() => setPendingGuess(null)} canEndTurn={canEndTurn}
        onEndTurn={() => { if (canEndTurn) void controller.dispatch({ type: "endTurn" }); }}
        onCardSelect={index => {
          if (ui.type !== "HUMAN_GIVING_CLUE" || busy || !codenamesTutorialAllows(gate, "submitClue")) return;
          const next = new Set(selected); if (next.has(index)) next.delete(index); else next.add(index);
          setSelected(next); setCount(next.size > 9 ? "infinity" : next.size || -1);
        }}
        onCardClick={index => {
          if (busy || !game.cells[index] || !codenamesTutorialAllows(gate, "submitGuess", index)) return;
          const eligibility = deriveCodenamesBoardCellEligibility({ index, uiStateType: ui.type, counterpartSide: player,
            counterpartRole: game.key[player][index], tutorialGuessCell: gate.kind === "guess" ? gate.cell : null, cell: game.cells[index] });
          if (eligibility.clickAction !== "guess") return;
          if (pendingGuess !== index) { sound.current?.("boardgames-codenames-tap-to-confirm"); setPendingGuess(index); return; }
          setPendingGuess(null); void controller.dispatch({ type: "submitGuess", cell: index });
        }}
        onSubmitClue={(word, inlineCount) => {
          if (busy || ui.type !== "HUMAN_GIVING_CLUE" || !codenamesTutorialAllows(gate, "submitClue")) return false;
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
      {ended && showResults && <div className="source-codenames-results" role="status">
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
