import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { CHESS_DIFFICULTIES, CHESS_START_FEN, CHESS_TUTORIAL_STEPS, chessCaptures, chessHistory, chessLayout, type ChessSide, type ChessState } from "../apps/chess-model";
import type { GameCartridgeController } from "../apps/game-cartridge-controller";
import { useElementSize } from "../hooks/use-element-size";
import { ChessBoard } from "./chess-board";
import { ChessPiece } from "./chess-piece";
import "../styles/chess.css";

export interface ChessScreenProps {
  controller: GameCartridgeController<ChessState>;
  translate?: (key: string, values?: Record<string, string | number>) => string;
  onSound?: (sound: string) => void;
}
export function ChessScreen({ controller, translate, onSound }: ChessScreenProps) {
  const snapshot = useSyncExternalStore(controller.subscribe, controller.snapshot, controller.snapshot);
  useEffect(() => controller.retain(), [controller]);
  const [ref, size] = useElementSize();
  const layout = chessLayout(size.width, size.height);
  const [side, setSide] = useState<ChessSide>("white");
  const [difficulty, setDifficulty] = useState("casual");
  const [restart, setRestart] = useState(false);
  const [ply, setPly] = useState<number | null>(null);
  const [help, setHelp] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const state = snapshot.state;
  const game = state?.gameState;
  const playing = game?.status === "playing";
  const setup = !game || (!playing && restart);
  const playerSide = setup ? side : state?.settings.playerSide ?? side;
  const history = game?.moveHistory ?? [];
  const activePly = ply === null ? history.length : Math.min(ply, history.length);
  const timeline = useMemo(() => game ? chessHistory(game.startFen, game.moveHistory) : null, [game]);
  const captures = chessCaptures(history.slice(0, activePly), playerSide);
  const tutorial = CHESS_TUTORIAL_STEPS.find(step => step.id === state?.tutorial?.step);
  const guided = !!tutorial;
  const myTurn = playing && game?.turn === playerSide;
  const t = (key: string, fallback: string, values?: Record<string, string | number>) => {
    const result = translate?.("chess." + key, values);
    return result && result !== "chess." + key ? result : fallback;
  };
  useEffect(() => {
    if (ply !== null && ply >= history.length) setPly(null);
  }, [history.length, ply]);
  useEffect(() => {
    if (!playing) setExpanded(true);
  }, [playing]);
  useEffect(() => {
    if (!help) return;
    const listener = (event: KeyboardEvent) => { if (event.key === "Escape") setHelp(false); };
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, [help]);
  const previousLength = useRef<number | null>(null);
  useEffect(() => {
    const previous = previousLength.current;
    previousLength.current = history.length;
    if (previous === null || history.length <= previous) return;
    for (const item of history.slice(previous)) {
      onSound?.(item.isCheck ? "check" : item.captured ? "capture" : item.isCastling ? "castle" : item.isPromotion ? "promote" : item.by === playerSide ? "moveSelf" : "moveOpponent");
    }
  }, [history, onSound, playerSide]);
  const dispatch = (type: string) => { void controller.dispatch({ type }); };
  function capturedRow(pieces: Record<string, number>, color: ChessSide, advantage: number) {
    return <div className="source-chess-captures" style={{ width: layout.board + 16, opacity: setup ? 0 : 1 }}>
      {["q", "r", "b", "n", "p"].flatMap(piece => Array.from({ length: pieces[piece] ?? 0 }, (_, index) =>
        <ChessPiece key={piece + index} piece={piece} color={color} size={18} />))}
      {advantage > 0 && <strong>+{advantage}</strong>}
    </div>;
  }
  const incoming = playing && state?.takebackRequest && state.takebackRequest !== playerSide ? "Takeback" :
    playing && state?.drawOffer && state.drawOffer !== playerSide ? "Draw" : null;
  return <section ref={ref} className="source-chess" aria-label={t("title", "Chess")}>
    <div className="source-chess-layout">
      <div className="source-chess-board-column">
        {capturedRow(captures.opponent, playerSide, -captures.advantage)}
        <ChessBoard fen={setup ? CHESS_START_FEN : timeline?.fens[activePly] ?? game?.fen ?? CHESS_START_FEN}
          side={playerSide} size={layout.board} lastMove={setup ? null : history[activePly - 1]?.move}
          tutorialMove={tutorial?.mover === "player" && ply === null ? tutorial.move : null}
          interactive={!!myTurn && !snapshot.pending && ply === null && (!guided || tutorial?.mover === "player")}
          onReturnToLive={() => setPly(null)}
          onMove={(from, to, promotion) => { void controller.dispatch({ type: "move", from, to, ...(promotion ? { promotion } : {}) }).then(ok => { if (!ok) onSound?.("illegal"); }); }} />
        {capturedRow(captures.player, playerSide === "white" ? "black" : "white", captures.advantage)}
      </div>
      <aside className="source-chess-rail" style={{ width: layout.rail }} data-compact={layout.compact}>
        <div className="source-chess-heading"><h1>{t("title", "Chess")}</h1><button type="button" aria-label={t("help.button", "Help")} onClick={() => setHelp(true)}>?</button></div>
        {setup ? <>
          <div className="source-chess-sides">{(["white", "black"] as const).map(value =>
            <button type="button" key={value} aria-pressed={side === value} onClick={() => setSide(value)}>
              <ChessPiece piece="k" color={value} size={layout.compact ? 22 : 32} />
              {t(value === "white" ? "start.playWhite" : "start.playBlack", value === "white" ? "Play White" : "Play Black")}
            </button>)}</div>
          <div className="source-chess-difficulties">{CHESS_DIFFICULTIES.map(item =>
            <button type="button" key={item.id} aria-pressed={difficulty === item.id} onClick={() => setDifficulty(item.id)}>
              <span>{t("start.difficulties." + item.id, item.id)}</span><small>{item.elo}</small>
            </button>)}</div>
          <button type="button" className="primary" disabled={!snapshot.mounted || snapshot.pending} onClick={() => {
            void controller.dispatch({ type: "startGame", mode: "normal", side, difficulty }).then(ok => { if (ok) { setRestart(false); setPly(null); onSound?.("gameStart"); } });
          }}>{t("start.startGame", "Start game")}</button>
          <button type="button" disabled={!snapshot.mounted || snapshot.pending} onClick={() => {
            void controller.dispatch({ type: "startGame", mode: "tutorial" }).then(ok => { if (ok) { setRestart(false); setPly(null); } });
          }}>{t("start.tutorial", "Tutorial")}</button>
        </> : <>
          <p role="status">{game?.isCheck ? t("game.check", "Check") + " · " : ""}{playing ? myTurn ? t("game.yourTurn", "Your turn") : t("game.noriTurn", "Nori's turn") : t("results." + game?.status, game?.status ?? "")}</p>
          <div className="source-chess-history" aria-label="Move history">
            {timeline?.san.map((san, index) => <button type="button" key={index} aria-pressed={activePly === index + 1}
              onClick={() => setPly(index + 1 === history.length ? null : index + 1)}>{index % 2 === 0 && <small>{Math.floor(index / 2) + 1}. </small>}{san}</button>)}
          </div>
          <div className="source-chess-history-controls">
            <button type="button" aria-label="First position" onClick={() => setPly(0)}>⏮</button>
            <button type="button" aria-label="Previous move" onClick={() => setPly(Math.max(0, activePly - 1))}>‹</button>
            <button type="button" aria-label="Next move" onClick={() => setPly(activePly + 1 >= history.length ? null : activePly + 1)}>›</button>
            <button type="button" aria-label="Live position" onClick={() => setPly(null)}>⏭</button>
          </div>
          {playing && <fieldset disabled={snapshot.pending || guided}>
            <button type="button" disabled={!myTurn || history.length < 2} onClick={() => dispatch(state?.takebackRequest === playerSide ? "cancelTakebackRequest" : "requestTakeback")}>
              {state?.takebackRequest === playerSide ? t("game.cancelTakeback", "Cancel takeback") : t("game.requestTakeback", "Request takeback")}
            </button>
            <button type="button" onClick={() => {
              if (state?.drawOffer && state.drawOffer !== playerSide) void controller.dispatch({ type: "respondDraw", accept: true });
              else dispatch(state?.drawOffer === playerSide ? "cancelDrawOffer" : "offerDraw");
            }}>{state?.drawOffer === playerSide ? t("game.cancelDraw", "Cancel draw offer") : t("game.offerDraw", "Offer draw")}</button>
            <button type="button" onClick={() => dispatch("resign")}>{t("game.resign", "Resign")}</button>
          </fieldset>}
        </>}
        {!snapshot.mounted && <button type="button" disabled={snapshot.pending} onClick={() => void controller.ensureMounted()}>{snapshot.pending ? "Loading…" : "Connect game"}</button>}
        {snapshot.error && <p role="alert">{snapshot.error}</p>}
      </aside>
    </div>
    {incoming && <div className="source-chess-request source-chess-glass" role="dialog" aria-label={incoming}>
      <p>{incoming === "Draw" ? t("request.noriOffersDraw", "Nori offers a draw") : t("request.noriRequestsTakeback", "Nori requests a takeback")}</p>
      {[true, false].map(accept => <button type="button" key={String(accept)} disabled={snapshot.pending} onClick={() => void controller.dispatch({ type: incoming === "Draw" ? "respondDraw" : "respondTakeback", accept })}>
        {accept ? t("request.accept", "Accept") : t("request.decline", "Decline")}</button>)}
    </div>}
    {game && !playing && !setup && <div className="source-chess-results source-chess-glass">
      <button type="button" aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>{game.winner === "draw" ? t("results.draw", "Draw") : game.winner === playerSide ? t("results.youWin", "You win") : t("results.noriWins", "Nori wins")}</button>
      {expanded && <><p>{t("results.totalMoves", "Total moves")}: {history.length}</p>
        <p>{t("results.captures", "Captures")}: {history.filter(item => item.by === playerSide && item.captured).length} / {history.filter(item => item.by !== playerSide && item.captured).length}</p>
        <p>{t("results.checks", "Checks")}: {history.filter(item => item.by === playerSide && item.isCheck).length} / {history.filter(item => item.by !== playerSide && item.isCheck).length}</p>
        <button type="button" className="primary" onClick={() => setRestart(true)}>{t("results.playAgain", "Play again")}</button></>}
    </div>}
    {help && <div className="source-chess-help-backdrop" onClick={() => setHelp(false)}>
      <div className="source-chess-glass source-chess-help" role="dialog" aria-modal="true" aria-label={t("help.title", "Chess help")} onClick={event => event.stopPropagation()}>
        <div className="source-chess-heading"><h2>{t("help.title", "Chess help")}</h2><button type="button" aria-label="Close help" onClick={() => setHelp(false)}>×</button></div>
        <p>{t("help.goal", "Checkmate the opposing king.")}</p>
        {(["king", "queen", "rook", "bishop", "knight", "pawn"] as const).map((key, index) => <p key={key}><ChessPiece piece={["k", "q", "r", "b", "n", "p"][index]} color="white" size={24} /> {t("help.pieces." + key, ["King: one square in any direction.", "Queen: ranks, files and diagonals.", "Rook: ranks and files.", "Bishop: diagonals.", "Knight: an L-shaped leap.", "Pawn: moves forward, captures diagonally."][index])}</p>)}
        <p>{t("help.table.history", "Select a move to review the position. Select the board or the live-position button to resume.")}</p>
      </div>
    </div>}
  </section>;
}
