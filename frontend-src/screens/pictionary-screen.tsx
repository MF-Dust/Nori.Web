import { ArrowUp, MessageSquareText, Zap } from "lucide-react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { GameCartridgeController } from "../apps/game-cartridge-controller";
import { PICTIONARY_COLORS, pictionaryElapsed, pictionaryNextRoundAt, pictionarySummary, type PictionaryState } from "../apps/pictionary-model";
import type { PictionaryDrawingBridge } from "../apps/pictionary-runtime";
import { PictionaryCanvas, type PictionaryCanvasHandle } from "./pictionary-canvas";
import { usePictionarySounds } from "./use-pictionary-sounds";
import "../styles/pictionary.css";
import { PictionaryResults } from "./pictionary-results";
import { PictionaryCover } from "./pictionary-cover";
import { PictionaryHelpOverlay } from "./pictionary-help-overlay";
import { pictionaryReaction, type PictionaryReaction } from "../apps/pictionary-reactions";

export interface PictionaryScreenProps {
  controller: GameCartridgeController<PictionaryState>;
  drawing: PictionaryDrawingBridge;
  locale?: string;
  playSound?: (cue: string) => void;
  startSoundLoop?: (cue: string) => () => void;
  onNoriReaction?: (reaction: PictionaryReaction) => void;
}
export function PictionaryScreen({ controller, drawing, locale = "en", playSound, startSoundLoop, onNoriReaction }: PictionaryScreenProps) {
  const snapshot = useSyncExternalStore(controller.subscribe, controller.snapshot, controller.snapshot);
  const vision = useSyncExternalStore(drawing.subscribe, drawing.snapshot, drawing.snapshot);
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
  const previousReactionState = useRef<PictionaryState | null>(null);
  const state = snapshot.state, game = state?.gameState, round = game?.round;
  const playing = game?.phase === "PLAYING";
  const roundActive = playing && round?.status === "active";
  const active = roundActive && snapshot.connected !== false;
  const isDrawer = round?.roles.drawer === "player";
  const remaining = game && state ? Math.max(0, state.settings.sessionDurationMs - pictionaryElapsed(game, now)) : 180000;
  const nextRoundAt = game ? pictionaryNextRoundAt(game) : null;
  // The server reveals the hint over time; the answer itself never reaches the browser.
  const hint = round?.roles.guesser === "player" ? round.hint?.text ?? null : null;
  const hintReveal = useRef<{ roundId?: string; revealed: number }>({ revealed: 0 });
  useEffect(() => {
    const revealed = round?.hint?.revealed ?? 0;
    const previous = hintReveal.current;
    if (previous.roundId === round?.roundId && revealed > previous.revealed) playSound?.("partygames-pictionary-hint-reveal");
    hintReveal.current = { roundId: round?.roundId, revealed };
  }, [round?.roundId, round?.hint?.revealed, playSound]);
  usePictionarySounds(snapshot.connected === false ? null : game, remaining, nextRoundAt, now, playSound);
  const zh = locale.toLowerCase().startsWith("zh");
  const text = (en: string, cn: string) => zh ? cn : en;
  useEffect(() => controller.retain(), [controller]);
  useEffect(() => {
    const next = snapshot.connected === false ? null : state ?? null;
    const reaction = pictionaryReaction(previousReactionState.current, next);
    previousReactionState.current = next;
    if (reaction) onNoriReaction?.(reaction);
  }, [snapshot.connected, state, onNoriReaction]);
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
  const start = () => {
    void controller.dispatch({ type: "startSession", atMs: Date.now(), settings: { sessionDurationMs: durationSec * 1000, locale: zh ? "zh-CN" : "en" } }).then(ok => {
      if (ok) { autoRequest.current = null; setMessages([]); setNow(Date.now()); playSound?.("partygames-session-start"); }
    });
  };
  const summary = game?.phase === "RESULTS" ? pictionarySummary(game) : null;
  return <section className="source-pictionary">
    {!game ? <PictionaryCover locale={locale} open={bookOpen} durationSec={durationSec}
      disabled={!snapshot.mounted || snapshot.pending} onDuration={setDurationSec} onToggle={() => setBookOpen(value => !value)}
      onStart={start} onHelp={() => setHelp(true)} /> : summary ? <PictionaryResults game={game!} locale={locale} pending={snapshot.pending} onRestart={start} />       : round && <div className="source-pictionary-game">
      <div className="source-pictionary-felt" aria-hidden="true" />
      <div className="source-pictionary-vignette" aria-hidden="true" />
      <div className="source-pictionary-tools" aria-label={text("Drawing tools", "画图工具")} data-dimmed={!isDrawer || undefined}>
        <div className="source-pictionary-pencils">
          {PICTIONARY_COLORS.map(value => <button type="button" key={value} className="source-pictionary-pencil" aria-label={value} aria-pressed={color === value && !eraser}
            disabled={!active || !isDrawer} data-pressed={color === value && !eraser ? "" : undefined}
            onClick={() => { playSound?.("partygames-pictionary-tools"); setColor(value); setEraser(false); }}>
            <svg viewBox="0 0 100 20" aria-hidden="true"><rect x="0" y="2" width="6" height="16" rx="2" fill="#E8DCC8" /><rect x="6" y="2" width="10" height="16" rx="1" fill={value} /><rect x="16" y="2" width="60" height="16" fill="#E8DCC8" /><path d="M76 2 L100 10 L76 18Z" fill="#E8DCC8" /><path d="M88 7 L100 10 L88 13Z" fill={value} /></svg>
          </button>)}
          <button type="button" className="source-pictionary-eraser" aria-label={text("Eraser", "橡皮")} aria-pressed={eraser}
            disabled={!active || !isDrawer} data-pressed={eraser ? "" : undefined}
            onClick={() => { playSound?.("partygames-pictionary-tools"); setEraser(!eraser); }}>
            <svg viewBox="0 0 84 33" aria-hidden="true"><rect width="84" height="33" rx="2.5" fill="#F4E7D4" /><rect width="22" height="33" fill="#E7B7C4" /><rect x="22" width="4" height="33" fill="#C98B9A" /></svg>
          </button>
        </div>
        <div className="source-pictionary-tools-spacer" />
        <div className="source-pictionary-tool-actions">
          {isDrawer ? <button type="button" className="source-pictionary-action" disabled={!active}
            onClick={() => { playSound?.("partygames-pictionary-tools"); canvas.current?.undo(); }}>{text("Undo", "撤销")}</button> : null}
          {isDrawer ? <button type="button" className="source-pictionary-action" data-danger="" disabled={!active} onClick={() => { playSound?.("partygames-pictionary-tools"); canvas.current?.clear(); }}>{text("Clear", "清空")}</button> : null}
          <button type="button" className="source-pictionary-action" aria-label={text("Skip round", "跳过回合")}
            disabled={!active || snapshot.pending} onClick={() => void controller.dispatch({ type: "skipRound", atMs: Date.now() })}>{text("Skip", "跳过")}</button>
        </div>
      </div>
      <div className="source-pictionary-paper">
        <header><span className={remaining < 30000 ? "low" : ""}>{Math.floor(Math.ceil(remaining / 1000) / 60)}:{String(Math.ceil(remaining / 1000) % 60).padStart(2, "0")}</span>
          <div><small>{isDrawer ? text("Your turn to draw", "轮到你画图") : text("Your turn to guess", "轮到你猜词")}</small>
            <strong data-pictionary-hint aria-live="polite">{isDrawer || !roundActive ? round.word : hint}</strong></div>
          <span>{game.score.solved} ✓</span><button type="button" aria-label="Help" onClick={() => setHelp(true)}>?</button>
        </header>
        <PictionaryCanvas ref={canvas} roundId={round.roundId} noriDrawings={round.noriDrawings} redrawEpoch={round.noriRedrawEpoch}
          active={!!active} drawer={round.roles.drawer} color={color} eraser={eraser} startSoundLoop={startSoundLoop}
          onStroke={stroke => drawing.submit(stroke)} onChange={() => drawing.changed()} />
        {!roundActive && <div className="source-pictionary-round-result" role="status"><strong>{round.word}</strong>
          <p>{round.status === "solved" ? text("Correct!", "答对了！") : text("Skipped", "已跳过")}</p>
          {nextRoundAt !== null && <span>{Math.max(0, Math.ceil((nextRoundAt - now) / 1000))}</span>}
        </div>}
      </div>
      <aside className="source-pictionary-chat" data-watching={isDrawer || undefined}>
        <header className="source-pictionary-chat-header">
          <span className="source-pictionary-chat-lights" aria-hidden="true"><i /><i /></span>
          <MessageSquareText aria-hidden="true" />
          <h2>{text("Guessing", "猜词")}</h2>
          <span className="source-pictionary-chat-live" data-live={snapshot.connected !== false || undefined}>
            {snapshot.connected === false ? text("OFFLINE", "离线") : "LIVE"}
          </span>
        </header>
        {isDrawer && roundActive && <div role="status" className="source-pictionary-vision">
          {vision.status === "analyzing" ? text("Nori is looking at your drawing…", "Nori 正在看你的画…") :
            vision.status === "unconfigured" ? text("Choose a vision-capable model in AI settings.", "请在 AI 设置中配置支持识图的模型。") :
            vision.status === "failed" ? text("Recognition failed. Check AI settings and retry.", "识图失败，请检查 AI 设置后重试。") :
            vision.status === "unknown" ? text("Not clear yet. Add a few more strokes!", "暂时没看出来，再补几笔吧！") :
            text("Your drawing is sent to the configured AI model to guess.", "画布会发送给已配置的 AI 模型来猜词。")}
          {["failed", "unconfigured", "unknown"].includes(vision.status) && <button type="button" onClick={() => drawing.retryRecognition()}>{text("Retry", "重试")}</button>}
        </div>}
        <div ref={chat} className="source-pictionary-messages" role="log">
          {messages.length ? messages.map(item => <p key={item.id} data-correct={item.correct}><small>{item.by === "agent" ? "Nori" : text("You", "你")}</small>{item.text}{item.correct ? " ✓" : ""}</p>) : (
            <div className="source-pictionary-chat-empty" role="status">
              <span><Zap aria-hidden="true" /></span>
              <strong>{text("Waiting…", "等待中…")}</strong>
            </div>
          )}
        </div>
        <form onSubmit={event => {
          event.preventDefault(); const value = guess.trim().slice(0, 50);
          if (!value || !active || isDrawer || snapshot.pending) return;
          void controller.dispatch({ type: "submitGuess", text: value, atMs: Date.now() }).then(ok => { if (ok) setGuess(""); });
        }}>
          <input aria-label={text("Your guess", "你的答案")} placeholder={isDrawer ? text("Watching…", "观看中…") : text("Type a guess…", "输入猜测…")} maxLength={50} disabled={!active || isDrawer || snapshot.pending} value={guess} onChange={event => setGuess(event.target.value)} />
          <button type="submit" aria-label={text("Send", "发送")} disabled={!active || isDrawer || snapshot.pending || !guess.trim()}><ArrowUp aria-hidden="true" /></button>
        </form>
      </aside>
    </div>}
    {!snapshot.mounted && <button type="button" disabled={snapshot.pending} onClick={() => void controller.ensureMounted()}>{text("Connect game", "连接游戏")}</button>}
    {snapshot.error && <p className="source-pictionary-error" role="alert">{snapshot.error}</p>}
    {help && <PictionaryHelpOverlay locale={locale} onClose={() => setHelp(false)} />}
  </section>;
}
