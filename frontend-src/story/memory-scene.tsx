import { useEffect, useMemo, useRef, useState } from "react";
import type { NoriFrontendRuntime } from "../runtime/frontend-runtime";
import { NORI_SHELL_LAYERS } from "../state/window-layout-runtime";
import { StoryAudio } from "./story-audio";
import { StoryClock, type StoryPhase } from "./story-clock";
import type { StoryInstance } from "./story-director";
import { power2InOut, power2Out, ramp } from "./story-ease";
import "./memory-scene.css";

export const MEMORY_PHASES: readonly StoryPhase[] = [
  { id: "intro", duration: 2.5 },
  ...Array.from({ length: 5 }, (_, index) => ({
    id: `win${index + 1}`,
    duration: 0.3,
    pauseAtStart: true,
  })),
  { id: "flood", duration: 16.5 },
  { id: "attack", duration: 7 },
  { id: "sweep", duration: 1.2 },
  { id: "drain", duration: 10 },
  { id: "void", duration: 2.4 },
];

interface MemoryLog {
  name: string;
  items: unknown[];
}
const record = (value: unknown) =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
const itemKind = (value: unknown) => {
  const item = record(value);
  return item.k === "photo" || typeof item.id === "string"
    ? "photo"
    : item.k === "poem"
      ? "poem"
      : "turn";
};
const itemText = (value: unknown) => {
  const item = record(value);
  return typeof item.t === "string"
    ? item.t
    : typeof item.text === "string"
      ? item.text
      : "";
};
const MEMORY_PHOTOS: Record<string, string> = {
  "nori-thinking": "/assets/nori-thinking-BfPVtIvj.jpg",
  "nori-smile": "/assets/nori-smile-B7ezdSLI.jpg",
};
const phaseStart = (id: string) =>
  MEMORY_PHASES.slice(
    0,
    MEMORY_PHASES.findIndex((phase) => phase.id === id),
  ).reduce((sum, phase) => sum + phase.duration, 0);
const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

/** Shipped `kXe`: mulberry32(1852797545), four draws per record in w, h, fx, fy order. */
export const memoryFloodBoxes = (count: number) => {
  let state = 1852797545 >>> 0;
  const next = () => {
    state = (state + 1831565813) | 0;
    let n = Math.imul(state ^ (state >>> 15), 1 | state);
    n = (n + Math.imul(n ^ (n >>> 7), 61 | n)) ^ n;
    return ((n ^ (n >>> 14)) >>> 0) / 4294967296;
  };
  return Array.from({ length: count }, () => ({
    w: Math.round(320 + next() * 60),
    h: Math.round(300 + next() * 120),
    fx: 0.03 + next() * 0.94,
    fy: 0.03 + next() * 0.94,
  }));
};

/**
 * Shipped `LXe`: n = count - 1 gaps, first step 2, each later step times
 * (0.25/2)^(1/(n-1)) -- the shipped exponent is one gap short of n, so the tail
 * step is 2 * 0.25 = 0.5 of the first -- and the whole run scaled so the last
 * record lands at floodDur - 0.25.
 */
export const memoryFloodOffsets = (count: number, floodDur: number) => {
  const gaps = count - 1,
    ratio = gaps > 1 ? (0.25 / 2) ** (1 / (gaps - 1)) : 1,
    raw = [0];
  let sum = 0,
    step = 2;
  for (let index = 0; index < gaps; index++)
    (sum += step), raw.push(sum), (step *= ratio);
  const scale = Math.max(0, floodDur - 0.25) / (sum || 1);
  return raw.map((value) => value * scale);
};

const MEMORY_ALERTS: ReadonlyArray<{ title: string; body: string }> = [
  { title: "NoriOS 防火墙", body: "拦截了一个未知来源的入站连接" },
  { title: "NoriOS 防火墙", body: "检测到端口扫描，已丢弃" },
  { title: "NoriOS 防火墙", body: "规则 FW-07 已触发" },
  { title: "NoriOS 防火墙", body: "异常握手包 ×14，已拦截" },
  { title: "NoriOS 防火墙", body: "未知进程请求提权，已拒绝" },
  { title: "NoriOS 防火墙", body: "入站流量超出阈值 380%" },
  { title: "NoriOS 防火墙", body: "正在重建过滤规则……" },
  { title: "NoriOS 防火墙", body: "过滤规则重建失败，重试中" },
  { title: "NoriOS 防火墙", body: "核心进程访问被阻断" },
  { title: "NoriOS 防火墙", body: "拦截队列已满，开始丢包" },
  { title: "NoriOS 防火墙", body: "内存占用 97%，响应变慢" },
  { title: "NoriOS 防火墙", body: "防护等级已降至最低" },
];
const ALERT_LIFE = 4.5;
const ALERT_IN = 0.28;
const ALERT_OUT = 0.4;
const ALERT_FADE = 0.8;
const ALERT_SOUND_GAP_MS = 380;
const ALERT_BACK_OUT = 1.70158;
/** Shipped `BXe`, the back-out cubic behind the toast slide-in. */
const alertBackOut = (t: number) =>
  1 + (ALERT_BACK_OUT + 1) * (t - 1) ** 3 + ALERT_BACK_OUT * (t - 1) ** 2;

/** Shipped `OXe`: nine decelerating head offsets, then a flat 0.24s cadence. */
export const memoryAlertOffsets = (head: number, horizon: number) => {
  const shape = [1.35, 1.1, 0.9, 0.72, 0.56, 0.44, 0.34, 0.26, 0.2];
  const cumulative: number[] = [];
  let sum = 0;
  for (const value of shape) (sum += value), cumulative.push(sum);
  const scale = head / (sum + 0.1),
    offsets = cumulative.map((value) => value * scale);
  for (let at = (offsets.at(-1) ?? 0) + 0.24; at < horizon; at += 0.24)
    offsets.push(at);
  return offsets;
};
const MEMORY_ALERT_START = phaseStart("attack") + 0.6;
export const MEMORY_ALERT_OFFSETS = memoryAlertOffsets(
  phaseStart("sweep") - phaseStart("attack") - 0.6,
  phaseStart("void") - phaseStart("attack") - 0.6,
);

export function memoryProjection(time: number) {
  const attack = phaseStart("attack"),
    sweep = phaseStart("sweep"),
    drain = phaseStart("drain"),
    voidAt = phaseStart("void");
  return {
    attack: time >= attack,
    sweep: time >= sweep,
    drain: time >= drain && time < voidAt,
    drainProgress: clamp01((time - drain) / 10),
    // Shipped: Math.min(1, voidDur 2.4 * 0.45) = 1s, not the raw 1.08 product.
    // Shipped `DJ` tweens voidEnv 0 -> 1 across that 1s with `power2.inOut`.
    voidProgress: ramp(time, voidAt, 1, 0, 1, power2InOut),
    // Shipped quakePeak 0.7 decaying to 0 over 2s (power2.out), then quiet for
    // the rest of the attack — not a flat 0.35 held across the whole phase.
    quake: 0.7 * (1 - ramp(time, attack, 2, 0, 1, power2Out)),
    // Shipped `DJ` also rides alert and tint up with `power2.in` over
    // alarmRise 1.2s and back down with `power2.out` over
    // voidDur - 1 = 1.4s from voidStart + 1. This source still drops both
    // linearly over 1s from voidStart; the window is a duration finding, not
    // converted here.
    alertFall: clamp01((time - voidAt) / 1),
  };
}

/**
 * Shipped `HXe`: a right-hand firewall toast stack that spams from attack + 0.6
 * until the void phase, keeps the newest six, and throttles its notify cue to
 * one every 380ms. The whole stack fades over 0.8s from the void start.
 */
function MemoryAlerts({
  time,
  fadeAt,
  frontend,
}: {
  time: number;
  fadeAt: number;
  frontend: NoriFrontendRuntime;
}) {
  const shown = useRef(0);
  const lastCue = useRef(0);
  const elapsed = MEMORY_ALERT_OFFSETS.reduce(
    (count, offset) =>
      time >= MEMORY_ALERT_START + offset ? count + 1 : count,
    0,
  );
  useEffect(() => {
    if (elapsed <= shown.current) {
      shown.current = elapsed;
      return;
    }
    shown.current = elapsed;
    const now = performance.now();
    if (now - lastCue.current >= ALERT_SOUND_GAP_MS) {
      lastCue.current = now;
      frontend.audio.playCue("cutscenes-popup-spam-notify");
    }
  }, [elapsed, frontend]);
  const opacity = 1 - clamp01((time - fadeAt) / ALERT_FADE);
  if (opacity <= 0) return null;
  const live: Array<{ index: number; age: number }> = [];
  for (let index = 0; index < MEMORY_ALERT_OFFSETS.length; index++) {
    const age = time - (MEMORY_ALERT_START + MEMORY_ALERT_OFFSETS[index]!);
    if (age < 0) break;
    if (age <= ALERT_LIFE) live.push({ index, age });
  }
  const cards = live.slice(-6);
  if (!cards.length) return null;
  return (
    <div className="memory-alerts" style={{ opacity }} aria-hidden="true">
      {cards.map(({ index, age }) => {
        const line = MEMORY_ALERTS[index % MEMORY_ALERTS.length]!;
        const enter = clamp01(age / ALERT_IN);
        return (
          <div
            className="memory-alert"
            key={index}
            style={{
              opacity: Math.min(
                enter,
                clamp01((ALERT_LIFE - age) / ALERT_OUT),
              ),
              transform: `translateX(${(1 - alertBackOut(enter)) * 24}px)`,
            }}
          >
            <span className="memory-alert-icon">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
                <path d="M12 8v4" />
                <path d="M12 16h.01" />
              </svg>
            </span>
            <span className="memory-alert-text">
              <b className="memory-alert-title">{line.title}</b>
              <span className="memory-alert-body">{line.body}</span>
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function MemoryScene({
  frontend,
  story,
}: {
  frontend: NoriFrontendRuntime;
  story: StoryInstance;
}) {
  const [view, setView] = useState({
    time: 0,
    phase: "intro" as string | null,
    parkedAt: null as string | null,
    complete: false,
  });
  const [readCount, setReadCount] = useState(1);
  const [logs, setLogs] = useState<{
      canon: MemoryLog[];
      flood: MemoryLog[];
    } | null>(null),
    [loadError, setLoadError] = useState<string | null>(null),
    [loadAttempt, setLoadAttempt] = useState(0);
  const [sceneError, setSceneError] = useState<string | null>(null),
    [sceneAttempt, setSceneAttempt] = useState(0);
  const clockRef = useRef<StoryClock | null>(null);
  useEffect(() => {
    let live = true;
    setLogs(null);
    setLoadError(null);
    const timer = setTimeout(() => {
      if (live) {
        live = false;
        setLoadError("Memory archive request timed out");
      }
    }, 15000);
    frontend.files
      .presentation()
      .then((snapshot) => {
        if (!live || frontend.story.snapshot() !== story) return;
        const candidates = snapshot.files.filter(
          (file) => file.kind === "training-log",
        );
        const sort = (
          a: (typeof candidates)[number],
          b: (typeof candidates)[number],
        ) => Number(a.seq ?? 0) - Number(b.seq ?? 0);
        const canon = candidates
            .filter((file) => file.phase === "canon")
            .sort(sort),
          flood = candidates
            .filter((file) => file.phase === "flood")
            .sort(sort);
        if (canon.length < 5) throw new Error("Memory archive is incomplete");
        clearTimeout(timer);
        setLogs({ canon, flood });
      })
      .catch((error: unknown) => {
        if (live && frontend.story.snapshot() === story) {
          clearTimeout(timer);
          setLoadError(error instanceof Error ? error.message : String(error));
        }
      });
    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [frontend, story, loadAttempt]);
  useEffect(() => {
    if (!logs) return;
    const clock = new StoryClock(MEMORY_PHASES),
      lease = frontend.scene.acquire();
    setSceneError(null);
    clockRef.current = clock;
    const audio = new StoryAudio(frontend.audio, [
      {
        id: "siren",
        src: "/audio/memory/emergency-siren-loop.m4a",
        at: phaseStart("attack"),
        // Shipped: nx + eKe * Ry with Ry = 2.5 and
        // eKe = floor((38.7 - 20.5) / 2.5) + 1 = 8  ->  20.5 + 20 = 40.5,
        // i.e. two seconds past the void start, not the void start itself.
        until: 40.5,
        gain: 0.9,
        loop: true,
        // Shipped: Ry / 3 = 0.8333.
        fadeOut: 2.5 / 3,
      },
      {
        id: "power-down",
        src: "/audio/memory/power-down.m4a",
        at: phaseStart("void") - 0.2,
        until: phaseStart("void") + 2.4,
        fadeOut: 1,
      },
    ]);
    let frame = 0,
      stopped = false,
      released = false;
    const release = () => {
      if (released) return;
      released = true;
      cancelAnimationFrame(frame);
      document.removeEventListener("visibilitychange", visibility);
      audio.dispose();
      clock.dispose();
      lease.release();
      if (clockRef.current === clock) clockRef.current = null;
    };
    const fail = (error: unknown) => {
      if (stopped) return;
      stopped = true;
      release();
      setSceneError(error instanceof Error ? error.message : String(error));
    };
    const stopForReplacement = frontend.story.subscribe(() => {
      if (frontend.story.snapshot() !== story) {
        stopped = true;
        release();
      }
    });
    const visibility = () => {
      if (document.hidden) clock.suspend(performance.now());
      else clock.resume(performance.now());
      audio.sync(clock.snapshot());
    };
    document.addEventListener("visibilitychange", visibility);
    clock.advance(performance.now());
    const render = (now: number) => {
      if (stopped) return;
      try {
        const state = clock.advance(now),
          projection = memoryProjection(state.time);
        audio.sync(state);
        lease.set({
          // Shipped: project() returns active = chrome < 0.5, and chrome is set to
          // 1 at phaseStart("drain") = 28.7, so the desktop takes over there.
          active: state.time < phaseStart("drain"),
          shake: projection.quake,
          alertLoop: projection.attack ? 1 - projection.alertFall : 0,
          alertClock: Math.max(0, state.time - phaseStart("attack")),
          noriTint: projection.attack
            ? 0.55 * (1 - projection.alertFall)
            : 0,
          chatMode: projection.sweep ? "bubbles" : "normal",
          bgm: projection.attack
            ? projection.voidProgress > 0
              ? "bgm_void"
              : "silent"
            : "auto",
          voidEnv: projection.voidProgress,
          memoryComputeDrain: projection.drainProgress,
        });
        setView({
          time: state.time,
          phase: state.phase,
          parkedAt: state.parkedAt,
          complete: state.complete,
        });
        if (state.complete) frontend.story.complete(story);
        else frame = requestAnimationFrame(render);
      } catch (error) {
        fail(error);
      }
    };
    frame = requestAnimationFrame(render);
    return () => {
      stopped = true;
      stopForReplacement();
      release();
    };
  }, [frontend, story, logs, sceneAttempt]);
  const memoryLogs = logs ?? {
    canon: Array.from({ length: 5 }, () => ({
      name: "",
      items: [] as unknown[],
    })),
    flood: [],
  };
  const floodBoxes = useMemo(
    () => memoryFloodBoxes(memoryLogs.flood.length),
    [memoryLogs.flood.length],
  );
  const floodOffsets = useMemo(
    () =>
      memoryFloodOffsets(
        memoryLogs.flood.length,
        phaseStart("attack") - phaseStart("flood"),
      ),
    [memoryLogs.flood.length],
  );
  const floodCount = floodOffsets.reduce(
    (count, offset) =>
      view.time >= phaseStart("flood") + offset ? count + 1 : count,
    0,
  );
  const projection = memoryProjection(view.time);
  const open = Math.max(
    0,
    Math.min(
      5,
      Number(view.phase?.replace("win", "")) ||
        (view.time >= phaseStart("flood") ? 5 : 0),
    ),
  );
  const activeIndex = view.parkedAt
    ? Number(view.parkedAt.replace("win", "")) - 1
    : -1;
  useEffect(() => {
    setReadCount(1);
  }, [view.parkedAt]);
  // Shipped: `(!r && v > prev) && Ye("cutscenes-memory-window-pop")` — a new archive
  // window coming into view, once per window.
  const poppedRef = useRef(0);
  useEffect(() => {
    if (open > poppedRef.current) {
      frontend.audio.playCue("cutscenes-memory-window-pop");
      poppedRef.current = open;
    } else if (open < poppedRef.current) poppedRef.current = open;
  }, [open, frontend.audio]);
  useEffect(() => {
    if (!logs || activeIndex !== 4 || readCount < logs.canon[4].items.length)
      return;
    const timer = setTimeout(() => {
      if (view.parkedAt)
        clockRef.current?.wake(view.parkedAt, performance.now());
    }, 4800);
    return () => clearTimeout(timer);
  }, [activeIndex, readCount, view.parkedAt, logs]);
  const advance = () => {
    if (!view.parkedAt || activeIndex < 0) return;
    if (readCount < memoryLogs.canon[activeIndex].items.length) {
      // Shipped fires the reveal cue on every step through a window's records,
      // not only on the final one that wakes the gate.
      frontend.audio.playCue("cutscenes-memory-bubble-reveal");
      setReadCount((value) => value + 1);
    } else clockRef.current?.wake(view.parkedAt, performance.now());
  };
  if (!logs)
    return (
      <div
        className="memory-scene memory-loading"
        data-story-scene="memory"
        style={{ zIndex: NORI_SHELL_LAYERS.CUTSCENE }}
      >
        {loadError ? (
          <div role="alert">
            <p>Memory archive could not be loaded.</p>
            <button
              type="button"
              onClick={() => setLoadAttempt((value) => value + 1)}
            >
              Retry
            </button>
          </div>
        ) : (
          <div role="status">Decrypting memory archive…</div>
        )}
      </div>
    );
  if (sceneError)
    return (
      <div
        className="memory-scene memory-loading"
        data-story-scene="memory"
        style={{ zIndex: NORI_SHELL_LAYERS.CUTSCENE }}
      >
        <div role="alert">
          <p>Memory scene could not continue.</p>
          <button
            type="button"
            onClick={() => setSceneAttempt((value) => value + 1)}
          >
            Retry
          </button>
        </div>
      </div>
    );
  return (
    <div
      className={`memory-scene ${projection.attack ? "is-attacked" : ""} ${projection.sweep ? "is-sweeping" : ""}`}
      data-story-scene="memory"
      data-phase={view.phase ?? "done"}
      style={{ zIndex: NORI_SHELL_LAYERS.CUTSCENE }}
    >
      <div className="memory-grid" />
      {Array.from({ length: open }, (_, index) => (
        <button
          type="button"
          key={index}
          className={`memory-window memory-window-${index + 1}`}
          data-mem-active={view.parkedAt === `win${index + 1}`}
          onClick={view.parkedAt === `win${index + 1}` ? advance : undefined}
        >
          <span className="memory-title">{memoryLogs.canon[index].name}</span>
          <span className="memory-records">
            {memoryLogs.canon[index].items
              .slice(
                0,
                view.parkedAt === `win${index + 1}` ? readCount : undefined,
              )
              .map((value, item) => {
                const kind = itemKind(value),
                  data = record(value),
                  photo =
                    kind === "photo" && typeof data.id === "string"
                      ? MEMORY_PHOTOS[data.id]
                      : undefined;
                return (
                  <i
                    key={item}
                    className={`memory-record memory-record-${kind}`}
                    data-nori={data.nori === true}
                  >
                    {photo ? (
                      <img src={photo} alt="Recovered memory" />
                    ) : (
                      <b>{itemText(value)}</b>
                    )}
                  </i>
                );
              })}
          </span>
          <span className="memory-progress">
            {view.parkedAt === `win${index + 1}`
              ? readCount < memoryLogs.canon[index].items.length
                ? "READ NEXT"
                : "CONTINUE"
              : "READ"}
          </span>
        </button>
      ))}
      {view.phase === "flood" &&
        memoryLogs.flood.slice(0, floodCount).map((log, index) => {
          const box = floodBoxes[index];
          return (
            <div
              key={`${log.name}-${index}`}
              className="memory-flood"
              style={{
                width: box.w,
                height: box.h,
                // Shipped: x = fx * (viewportWidth - w), so the box never
                // overhangs the right edge; the % term is fx * 100% and the px
                // term is the same w the viewport is measured against.
                left: `calc(${(box.fx * 100).toFixed(3)}% - ${(box.fx * box.w).toFixed(1)}px)`,
                top: `calc(${(box.fy * 100).toFixed(3)}% - ${(box.fy * box.h).toFixed(1)}px)`,
              }}
            >
              <b>{log.name}</b>
              <span>{log.items.map(itemText).filter(Boolean).join(" ")}</span>
            </div>
          );
        })}
      <MemoryAlerts
        time={view.time}
        fadeAt={phaseStart("void")}
        frontend={frontend}
      />
      {projection.drain && (
        <div className="memory-drain">
          <span>COMPUTE</span>
          <i style={{ width: `${(1 - projection.drainProgress) * 100}%` }} />
        </div>
      )}
      {projection.voidProgress > 0 && (
        <div
          className="memory-void"
          style={{ opacity: projection.voidProgress }}
        />
      )}
    </div>
  );
}
