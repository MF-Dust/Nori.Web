import { useEffect, useRef, useState } from "react";
import {
  ANCHOR_CHECKS,
  ANTIVIRUS_GAMES,
  AntivirusSession,
  PROCESS_ROWS,
  TUNE_LIMITS,
  type TuneKey,
} from "./antivirus-model";
import type { AudioMixer } from "../runtime/audio-mixer";
import "./antivirus.css";

const titles = [
  "终端",
  "节点视图",
  "波形修正",
  "调谐",
  "稳定锚点",
  "通信链路校准",
];
export function AntivirusGames({
  onComplete,
  audio,
  paused = false,
  onCleared,
}: {
  onComplete(): void;
  audio: AudioMixer;
  paused?: boolean;
  onCleared?(count: number): void;
}) {
  const [session] = useState(() => new AntivirusSession());
  const [, refresh] = useState(0);
  const callback = useRef(onComplete);
  callback.current = onComplete;
  const clearedCallback = useRef(onCleared);
  clearedCallback.current = onCleared;
  const pausedRef = useRef(paused);
  pausedRef.current = paused;
  const keys = useRef(new Set<string>());
  const [focused, setFocused] = useState(false);
  const [unavailable, setUnavailable] = useState(
    () => document.hidden || !document.hasFocus(),
  );
  const inputBlocked = paused || unavailable;
  const steering = useRef<HTMLDivElement>(null);
  const pointer = useRef<number | null>(null);
  const release = () => {
    const element = steering.current;
    if (pointer.current !== null && element?.hasPointerCapture(pointer.current))
      element.releasePointerCapture(pointer.current);
    pointer.current = null;
    keys.current.clear();
    session.release();
  };
  useEffect(() => {
    if (inputBlocked) release();
  }, [inputBlocked]);
  useEffect(() => {
    let frame = 0,
      previous = performance.now(),
      complete = false;
    let visible = !document.hidden && document.hasFocus();
    let count = 0;
    const visibility = () => {
      visible = !document.hidden && document.hasFocus();
      previous = performance.now();
      if (!visible) release();
      setUnavailable(!visible);
    };
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("blur", visibility);
    window.addEventListener("focus", visibility);
    const render = (now: number) => {
      const dt = Math.max(0, Math.min(0.05, (now - previous) / 1000));
      previous = now;
      if (visible && !pausedRef.current) {
        if (keys.current.size) {
          const target = session.pointer ?? session.position;
          const dx =
            Number(keys.current.has("ArrowRight")) -
            Number(keys.current.has("ArrowLeft"));
          const dy =
            Number(keys.current.has("ArrowDown")) -
            Number(keys.current.has("ArrowUp"));
          session.steer(target.x + dx * dt, target.y + dy * dt);
        }
        session.step(dt);
        if (session.cleared.size > count) {
          count = session.cleared.size;
          clearedCallback.current?.(count);
          audio.playCue("cutscenes-microgame-solve");
        }
        if (session.complete && !complete) {
          complete = true;
          audio.playCue("cutscenes-virus-all-clear");
          callback.current();
        }
        refresh((value) => value + 1);
      }
      if (!complete) frame = requestAnimationFrame(render);
    };
    audio.playCue("cutscenes-virus-window-spawn");
    frame = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(frame);
      release();
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("blur", visibility);
      window.removeEventListener("focus", visibility);
    };
  }, [session, audio]);
  const hit = (action: () => boolean) => {
    if (inputBlocked) return;
    const accepted = action();
    audio.playCue("cutscenes-microgame-hit", {
      volume: accepted ? 0.75 : 0.25,
    });
    refresh((value) => value + 1);
  };
  const currentAnchor = ANCHOR_CHECKS[Math.min(session.anchor, 4)];
  const waveform = Array.from({ length: 100 }, (_, index) => {
    const t = (index / 99) * Math.PI * 2;
    return `${index * 3},${50 + Math.sin(t * session.tune.frequency + session.tune.phase) * 32 * session.tune.gain}`;
  }).join(" ");
  const panels = [
    <div className="antivirus-processes">
      <p>终止可疑进程，保留系统进程。</p>
      {PROCESS_ROWS.map((process, index) => (
        <button
          key={process.name}
          type="button"
          data-hostile={process.hostile}
          disabled={
            inputBlocked ||
            session.terminated.has(index) ||
            session.pendingProcesses.has(index)
          }
          onClick={() => hit(() => session.terminate(index))}
        >
          <span>
            {process.hostile ? "!" : "◆"} {process.name}
          </span>
          <small>
            {session.terminated.has(index)
              ? "已终止"
              : session.pendingProcesses.has(index)
                ? "终止中"
                : process.hostile
                  ? "终止"
                  : "系统"}
          </small>
        </button>
      ))}
    </div>,
    <div>
      <p>清除红色异常节点，保留正常连接。</p>
      <div className="antivirus-nodes">
        <svg viewBox="0 0 100 100" aria-hidden>
          {session.nodes.slice(1).map((node) => (
            <line
              key={node.id}
              x1="50"
              y1="50"
              x2={node.x * 100}
              y2={node.y * 100}
            />
          ))}
        </svg>
        {session.nodes.map((node) => (
          <button
            type="button"
            key={node.id}
            aria-label={`${node.hostile ? "异常" : "正常"}节点 ${node.id + 1}`}
            data-hostile={node.hostile}
            data-cleared={node.cleared}
            disabled={inputBlocked || node.cleared}
            style={{ left: `${node.x * 100}%`, top: `${node.y * 100}%` }}
            onClick={() => hit(() => session.clearNode(node.id))}
          >
            {node.cleared ? "✓" : node.id + 1}
          </button>
        ))}
      </div>
    </div>,
    <div>
      <p>光标进入绿色区域时点击，累计命中四次。</p>
      <div className="antivirus-beat" data-beat-position={session.beatPosition}>
        <span className="antivirus-beat-zone" />
        <i style={{ left: `${session.beatPosition * 100}%` }} />
      </div>
      <button
        className="antivirus-pulse"
        type="button"
        disabled={inputBlocked || session.cleared.has("rhythm")}
        onClick={() => hit(() => session.beat())}
      >
        校正波形
      </button>
      <p role="status">
        {session.rating || "等待节拍"} · {session.beats} / 4
      </p>
    </div>,
    <div>
      <p>调节三个通道，使波形与目标重合。</p>
      <svg
        className="antivirus-wave"
        viewBox="0 0 300 100"
        aria-label="当前与目标波形"
      >
        <path
          d={Array.from(
            { length: 100 },
            (_, i) =>
              `${i ? "L" : "M"}${i * 3},${50 + Math.sin((i / 99) * Math.PI * 4 + Math.PI / 2) * 32}`,
          ).join(" ")}
        />
        <polyline points={waveform} />
      </svg>
      {(Object.keys(TUNE_LIMITS) as TuneKey[]).map((key) => (
        <label className="antivirus-tune" key={key}>
          {{ frequency: "频率", phase: "相位", gain: "增益" }[key]}
          <input
            aria-label={key}
            type="range"
            min={TUNE_LIMITS[key][0]}
            max={TUNE_LIMITS[key][1]}
            step="0.01"
            value={session.tune[key]}
            disabled={inputBlocked || session.cleared.has("tune")}
            onChange={(event) => {
              session.setTune(key, Number(event.target.value));
              refresh((value) => value + 1);
            }}
          />
          <output>{session.tune[key].toFixed(2)}</output>
        </label>
      ))}
    </div>,
    <div className="antivirus-anchors">
      <p>核对记录并选择有效的恢复策略。</p>
      <h3>{currentAnchor.prompt}</h3>
      {currentAnchor.choices.map((choice, index) => (
        <button
          key={choice}
          type="button"
          disabled={
            inputBlocked ||
            session.anchorUntil !== null ||
            session.cleared.has("preference")
          }
          onClick={() => hit(() => session.chooseAnchor(index))}
        >
          {choice}
        </button>
      ))}
      <p>{Math.min(session.anchor, 5)} / 5 已核验</p>
    </div>,
    <div>
      <p>拖动信号点，使它在目标圈内稳定停留。方向键也可调节。</p>
      <div
        ref={steering}
        className="antivirus-steer"
        tabIndex={inputBlocked ? -1 : 0}
        role="application"
        aria-label="通信链路校准"
        data-stage={session.steerStage}
        data-target-x={session.target.x}
        data-target-y={session.target.y}
        onFocus={() => setFocused(true)}
        onBlur={() => {
          setFocused(false);
          release();
        }}
        onKeyDown={(event) => {
          if (!inputBlocked && event.key.startsWith("Arrow")) {
            event.preventDefault();
            keys.current.add(event.key);
          }
        }}
        onKeyUp={(event) => {
          keys.current.delete(event.key);
        }}
        onPointerDown={(event) => {
          if (inputBlocked || event.button !== 0) return;
          pointer.current = event.pointerId;
          event.currentTarget.setPointerCapture(event.pointerId);
          event.currentTarget.focus();
          const box = event.currentTarget.getBoundingClientRect();
          session.steer(
            ((event.clientX - box.left) / box.width) * 2 - 1,
            ((event.clientY - box.top) / box.height) * 2 - 1,
          );
        }}
        onPointerMove={(event) => {
          if (inputBlocked || pointer.current !== event.pointerId) return;
          const box = event.currentTarget.getBoundingClientRect();
          session.steer(
            ((event.clientX - box.left) / box.width) * 2 - 1,
            ((event.clientY - box.top) / box.height) * 2 - 1,
          );
        }}
        onPointerUp={release}
        onPointerCancel={release}
        onLostPointerCapture={release}
      >
        <span
          className="antivirus-target"
          style={{
            left: `${50 + session.target.x * 50}%`,
            top: `${50 + session.target.y * 50}%`,
            width: `${session.steerRadius * 100}%`,
            height: `${session.steerRadius * 100}%`,
          }}
        />
        <i
          style={{
            left: `${50 + session.position.x * 50}%`,
            top: `${50 + session.position.y * 50}%`,
          }}
        />
      </div>
      <small>
        {focused ? "方向键调整目标位置" : "点击或聚焦校准区"} ·{" "}
        {session.steerStage + 1} / 2
      </small>
    </div>,
  ];
  return (
    <section
      className="antivirus"
      aria-label="杀毒交互"
      data-antivirus-cleared={session.cleared.size}
    >
      <header>
        <div>
          <span>NORI OS · RECOVERY</span>
          <h2>完整性修复</h2>
        </div>
        <div>
          <strong>{session.cleared.size} / 6</strong>
          <progress
            aria-label="整体修复进度"
            max="1"
            value={session.totalProgress}
          />
        </div>
      </header>
      {inputBlocked && <p role="status">交互已暂停</p>}
      <div className="antivirus-grid">
        {ANTIVIRUS_GAMES.map((game, index) => (
          <article
            key={game}
            data-antivirus-game={game}
            data-solved={session.cleared.has(game)}
          >
            <header>
              <span>
                {String(index + 1).padStart(2, "0")} · {titles[index]}
              </span>
              <small>{session.cleared.has(game) ? "✓ 已修复" : "运行中"}</small>
            </header>
            <div className="antivirus-panel">{panels[index]}</div>
            <progress
              aria-label={`${titles[index]}修复进度`}
              max="1"
              value={session.progress[game]}
            />
          </article>
        ))}
      </div>
      <p className="antivirus-feedback" role="status">
        {session.feedback || "六项检查均通过后，将继续恢复流程。"}
      </p>
    </section>
  );
}
