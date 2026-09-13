import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { GameCartridgeController } from "../apps/game-cartridge-controller";
import { PICTIONARY_COLORS, pictionaryElapsed, pictionaryNextRoundAt, pictionarySummary, type PictionaryState } from "../apps/pictionary-model";
import type { PictionaryDrawingBridge } from "../apps/pictionary-runtime";
import { PictionaryCanvas, type PictionaryCanvasHandle } from "./pictionary-canvas";
import { usePictionaryHints } from "./use-pictionary-hints";
import { usePictionarySounds } from "./use-pictionary-sounds";
import "../styles/pictionary.css";

export interface PictionaryScreenProps {
  controller: GameCartridgeController<PictionaryState>;
  drawing: PictionaryDrawingBridge;
  locale?: string;
  playSound?: (cue: string) => void;
  startSoundLoop?: (cue: string) => () => void;
}
export function PictionaryScreen({ controller, drawing, locale = "en", playSound, startSoundLoop }: PictionaryScreenProps) {
  const snapshot = useSyncExternalStore(controller.subscribe, controller.snapshot, controller.snapshot);
  const [now, setNow] = useState(Date.now);
  const [bookOpen, setBookOpen] = useState(false);
  const [durationSec, setDurationSec] = useState(180);
  const [color, setColor] = useState<string>(PICTIONARY_COLORS[0]);
  const [eraser, setEraser] = useState(false);
  const [guess, setGuess] = useState("");
  const [help, setHelp] = useState(false);
  const [messages, setMessages] = useState<Array<{ id: string; text: string; by: string; correct: boolean }>>([]);
  const [retryAt, setRetryAt] = useState(0);
  const canvas = useRef<PictionaryCanvasHandle>(null);
  const chat = useRef<HTMLDivElement>(null);
  const autoRequest = useRef<string | null>(null);
  const state = snapshot.state, game = state?.gameState, round = game?.round;
  const playing = game?.phase === "PLAYING";
  const roundActive = playing && round?.status === "active";
  const active = roundActive && snapshot.connected !== false;
  const isDrawer = round?.roles.drawer === "player";
  const remaining = game && state ? Math.max(0, state.settings.sessionDurationMs - pictionaryElapsed(game, now)) : 180000;
  const nextRoundAt = game ? pictionaryNextRoundAt(game) : null;
  const hint = usePictionaryHints({ roundId: round?.roundId, word: round?.word, active: !!active,
    guesser: round?.roles.guesser === "player", duration: state?.settings.sessionDurationMs ?? 180000,
    locale: state?.settings.locale ?? locale, pinyin: round?.pinyin, playSound });
  usePictionarySounds(snapshot.connected === false ? null : game, remaining, nextRoundAt, now, playSound);
  const zh = locale.toLowerCase().startsWith("zh");
  const text = (en: string, cn: string) => zh ? cn : en;
  useEffect(() => controller.retain(), [controller]);
  useEffect(() => {
    drawing.setCapture(() => canvas.current?.snapshot() ?? null);
    return () => drawing.setCapture(null);
  }, [drawing]);
  useEffect(() => {
    if (!playing) return;
    const timer = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(timer);
  }, [playing]);
  useEffect(() => { autoRequest.current = null; setGuess(""); }, [round?.roundId]);
  useEffect(() => {
    if (!round?.lastGuess) return;
    const item = round.lastGuess;
    const id = round.roundId + ":" + item.atMs + ":" + item.by + ":" + item.text;
    setMessages(previous => previous.some(message => message.id === id) ? previous : [...previous, { id, text: item.text, by: item.by, correct: item.correct }].slice(-100));
  }, [round?.lastGuess, round?.roundId]);
  useEffect(() => { chat.current?.scrollTo({ top: chat.current.scrollHeight }); }, [messages]);
  useEffect(() => {
    if (!playing || !round || snapshot.pending || now < retryAt) return;
    const command = active && remaining <= 0 ? "forceEndSession" :
      active && state?.settings.roundTimeLimitMs && now - round.startedAtMs >= state.settings.roundTimeLimitMs ? "skipRound" :
      nextRoundAt !== null && now >= nextRoundAt ? "startNextRound" : null;
    if (!command) return;
    const key = round.roundId + ":" + command;
    if (autoRequest.current === key) return;
    autoRequest.current = key;
    void controller.dispatch({ type: command, atMs: Date.now() }).then(ok => {
      if (!ok) { autoRequest.current = null; setRetryAt(Date.now() + 2000); }
    });
  }, [active, remaining, nextRoundAt, now, playing, round, snapshot.pending, controller, retryAt, state?.settings.roundTimeLimitMs]);
  useEffect(() => {
    if (!help) return;
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") setHelp(false); };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [help]);
  const start = () => {
    void controller.dispatch({ type: "startSession", atMs: Date.now(), settings: { sessionDurationMs: durationSec * 1000, locale: zh ? "zh-CN" : "en" } }).then(ok => {
      if (ok) { autoRequest.current = null; setMessages([]); setNow(Date.now()); playSound?.("partygames-session-start"); }
    });
  };
  const summary = game?.phase === "RESULTS" ? pictionarySummary(game) : null;
  return <section className="source-pictionary">
    {!game ? <div className="source-pictionary-cover">
      <div className="source-pictionary-cover-rule" /><p>NORI · SKETCHBOOK</p>
      <h1>{text("Draw & Guess", "你画我猜")}</h1><p>{text("Take turns drawing with Nori.", "与 Nori 轮流画图，一起猜出更多词语。")}</p>
      {bookOpen && <fieldset disabled={snapshot.pending} aria-label={text("Session duration", "游戏时长")}>
        {[120, 180, 300].map(value => <button type="button" key={value} aria-pressed={durationSec === value} onClick={() => setDurationSec(value)}>{value / 60} {text("min", "分钟")}</button>)}
      </fieldset>}
      <button type="button" disabled={bookOpen && (!snapshot.mounted || snapshot.pending)} onClick={() => bookOpen ? start() : setBookOpen(true)}>{bookOpen ? text("Start session", "开始游戏") : text("Play", "开始")}</button>
      {bookOpen && <button type="button" onClick={() => setBookOpen(false)}>{text("Back", "返回")}</button>}
      <button type="button" aria-label={text("Help", "帮助")} onClick={() => setHelp(true)}>?</button>
    </div> : summary ? <div className="source-pictionary-results">
      <h1>{text("Session results", "本局结果")}</h1><strong>{summary.solved}</strong><p>{text("Solved", "答对")} · {summary.accuracy}%</p>
      <p>{text("Skipped", "跳过")}: {summary.skipped} · {text("Best time", "最快用时")}: {summary.bestTime === null ? "—" : (summary.bestTime / 1000).toFixed(1) + "s"}</p>
      <ul>{game.history.map((item, index) => <li key={index}><span>{item.word}</span><span>{item.outcome} · {(item.elapsedMs / 1000).toFixed(1)}s</span></li>)}</ul>
      <button type="button" disabled={snapshot.pending} onClick={start}>{text("Play again", "再玩一次")}</button>
    </div> : round && <div className="source-pictionary-game">
      <div className="source-pictionary-tools" aria-label={text("Drawing tools", "画图工具")}>
        {PICTIONARY_COLORS.map(value => <button type="button" key={value} aria-label={value} aria-pressed={color === value && !eraser}
          disabled={!active || !isDrawer} onClick={() => { playSound?.("partygames-pictionary-tools"); setColor(value); setEraser(false); }}>
          <svg viewBox="0 0 100 20" aria-hidden="true"><rect x="0" y="2" width="76" height="16" rx="2" fill="#E8DCC8" /><rect x="6" y="2" width="10" height="16" fill={value} /><path d="M76 2 L100 10 L76 18Z" fill="#E8DCC8" /><path d="M88 7 L100 10 L88 13Z" fill={value} /></svg>
        </button>)}
        <button type="button" disabled={!active || !isDrawer} aria-pressed={eraser} onClick={() => { playSound?.("partygames-pictionary-tools"); setEraser(!eraser); }}>{text("Eraser", "橡皮")}</button>
        <button type="button" disabled={!active || !isDrawer} onClick={() => { playSound?.("partygames-pictionary-tools"); canvas.current?.undo(); }}>{text("Undo", "撤销")}</button>
        <button type="button" disabled={!active || !isDrawer} onClick={() => { playSound?.("partygames-pictionary-tools"); canvas.current?.clear(); }}>{text("Clear", "清空")}</button>
      </div>
      <div className="source-pictionary-paper">
        <header><span className={remaining < 30000 ? "low" : ""}>{Math.floor(Math.ceil(remaining / 1000) / 60)}:{String(Math.ceil(remaining / 1000) % 60).padStart(2, "0")}</span>
          <div><small>{isDrawer ? text("Your turn to draw", "轮到你画图") : text("Your turn to guess", "轮到你猜词")}</small>
            <strong data-pictionary-hint aria-live="polite">{isDrawer || !roundActive ? round.word : hint}</strong></div>
          <span>{game.score.solved} ✓</span><button type="button" aria-label="Help" onClick={() => setHelp(true)}>?</button>
        </header>
        <PictionaryCanvas ref={canvas} roundId={round.roundId} drawingId={round.drawingId} redrawEpoch={round.noriRedrawEpoch}
          active={!!active} drawer={round.roles.drawer} color={color} eraser={eraser} startSoundLoop={startSoundLoop}
          onStroke={stroke => drawing.submit(stroke)} onChange={() => drawing.changed()} />
        {!roundActive && <div className="source-pictionary-round-result" role="status"><strong>{round.word}</strong>
          <p>{round.status === "solved" ? text("Correct!", "答对了！") : text("Skipped", "已跳过")}</p>
          {nextRoundAt !== null && <span>{Math.max(0, Math.ceil((nextRoundAt - now) / 1000))}</span>}
        </div>}
      </div>
      <aside className="source-pictionary-chat">
        <h2>{text("Guesses", "猜词记录")}</h2>
        <div ref={chat} className="source-pictionary-messages" role="log">{messages.map(item => <p key={item.id} data-correct={item.correct}><small>{item.by === "agent" ? "Nori" : text("You", "你")}</small>{item.text}{item.correct ? " ✓" : ""}</p>)}</div>
        <form onSubmit={event => {
          event.preventDefault(); const value = guess.trim().slice(0, 50);
          if (!value || !active || isDrawer || snapshot.pending) return;
          void controller.dispatch({ type: "submitGuess", text: value, atMs: Date.now() }).then(ok => { if (ok) setGuess(""); });
        }}>
          <input aria-label={text("Your guess", "你的答案")} maxLength={50} disabled={!active || isDrawer || snapshot.pending} value={guess} onChange={event => setGuess(event.target.value)} />
          <button type="submit" disabled={!active || isDrawer || snapshot.pending || !guess.trim()}>{text("Send", "发送")}</button>
        </form>
        <button type="button" disabled={!active || snapshot.pending} onClick={() => void controller.dispatch({ type: "skipRound", atMs: Date.now() })}>{text("Skip round", "跳过本轮")}</button>
      </aside>
    </div>}
    {!snapshot.mounted && <button type="button" disabled={snapshot.pending} onClick={() => void controller.ensureMounted()}>{text("Connect game", "连接游戏")}</button>}
    {snapshot.error && <p className="source-pictionary-error" role="alert">{snapshot.error}</p>}
    {help && <div className="source-pictionary-help-backdrop" onClick={() => setHelp(false)}>
      <div role="dialog" aria-modal="true" aria-label="Draw & Guess help" tabIndex={-1} onClick={event => event.stopPropagation()} onKeyDown={event => { if (event.key === "Escape") setHelp(false); }}>
        <button type="button" aria-label="Close help" onClick={() => setHelp(false)}>×</button>
        <h2>{text("Draw & Guess", "你画我猜")}</h2><p>{text("Draw the word on the paper with the pencils. When Nori draws, type your guess in the chat.", "用铅笔在纸上画出词语；Nori 画图时，在聊天框输入答案。")}</p>
        <p>{text("You can undo, erase or clear your drawing. Skip a difficult word to swap roles.", "可以撤销、擦除或清空自己的画稿。遇到难题时，跳过便会交换角色。")}</p>
      </div>
    </div>}
  </section>;
}
