import { useEffect, useRef, useState } from "react";
import type { NoriFrontendRuntime } from "../runtime/frontend-runtime";
import { NORI_SHELL_LAYERS } from "../state/window-layout-runtime";
import { StoryAudio } from "./story-audio";
import { StoryClock, type StoryPhase } from "./story-clock";
import type { StoryInstance } from "./story-director";
import "./memory-scene.css";

export const MEMORY_PHASES: readonly StoryPhase[] = [
  { id: "intro", duration: 2.5 },
  ...Array.from({ length: 5 }, (_, index) => ({ id: `win${index + 1}`, duration: 0.3, pauseAtStart: true })),
  { id: "flood", duration: 16.5 },
  { id: "attack", duration: 7 },
  { id: "sweep", duration: 1.2 },
  { id: "drain", duration: 10 },
  { id: "void", duration: 2.4 },
];

interface MemoryLog { name: string; items: unknown[]; }
const record = (value: unknown) => value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
const itemKind = (value: unknown) => { const item = record(value); return item.k === "photo" || typeof item.id === "string" ? "photo" : item.k === "poem" ? "poem" : "turn"; };
const itemText = (value: unknown) => { const item = record(value); return typeof item.t === "string" ? item.t : typeof item.text === "string" ? item.text : ""; };
const MEMORY_PHOTOS: Record<string, string> = { "nori-thinking": "/assets/nori-thinking-BfPVtIvj.jpg", "nori-smile": "/assets/nori-smile-B7ezdSLI.jpg" };
const phaseStart = (id: string) => MEMORY_PHASES.slice(0, MEMORY_PHASES.findIndex((phase) => phase.id === id)).reduce((sum, phase) => sum + phase.duration, 0);

export function memoryProjection(time: number) {
  const attack = phaseStart("attack"), sweep = phaseStart("sweep"), drain = phaseStart("drain"), voidAt = phaseStart("void");
  return {
    attack: time >= attack,
    sweep: time >= sweep,
    drain: time >= drain && time < voidAt,
    drainProgress: Math.max(0, Math.min(1, (time - drain) / 10)),
    voidProgress: Math.max(0, Math.min(1, (time - voidAt) / 1.08)),
  };
}

export function MemoryScene({ frontend, story }: { frontend: NoriFrontendRuntime; story: StoryInstance }) {
  const [view, setView] = useState({ time: 0, phase: "intro" as string | null, parkedAt: null as string | null, complete: false });
  const [readCount, setReadCount] = useState(1);
  const [logs, setLogs] = useState<{ canon: MemoryLog[]; flood: MemoryLog[] } | null>(null), [loadError, setLoadError] = useState<string | null>(null), [loadAttempt, setLoadAttempt] = useState(0);
  const [sceneError, setSceneError] = useState<string | null>(null), [sceneAttempt, setSceneAttempt] = useState(0);
  const clockRef = useRef<StoryClock | null>(null);
  useEffect(() => { let live = true; setLogs(null); setLoadError(null); const timer = setTimeout(() => { if (live) { live = false; setLoadError("Memory archive request timed out"); } }, 15000); frontend.files.presentation().then((snapshot) => { if (!live || frontend.story.snapshot() !== story) return; const candidates = snapshot.files.filter((file) => file.kind === "training-log"); const sort = (a: typeof candidates[number], b: typeof candidates[number]) => Number(a.seq ?? 0) - Number(b.seq ?? 0); const canon = candidates.filter((file) => file.phase === "canon").sort(sort), flood = candidates.filter((file) => file.phase === "flood").sort(sort); if (canon.length < 5) throw new Error("Memory archive is incomplete"); clearTimeout(timer); setLogs({ canon, flood }); }).catch((error: unknown) => { if (live && frontend.story.snapshot() === story) { clearTimeout(timer); setLoadError(error instanceof Error ? error.message : String(error)); } }); return () => { live = false; clearTimeout(timer); }; }, [frontend, story, loadAttempt]);
  useEffect(() => {
    if (!logs) return;
    const clock = new StoryClock(MEMORY_PHASES), lease = frontend.scene.acquire();
    setSceneError(null);
    clockRef.current = clock;
    const audio = new StoryAudio(frontend.audio, [
      { id: "siren", src: "/audio/memory/emergency-siren-loop.m4a", at: phaseStart("attack"), until: phaseStart("void"), gain: 0.9, loop: true, fadeOut: 0.7 },
      { id: "power-down", src: "/audio/memory/power-down.m4a", at: phaseStart("void") - 0.2, until: phaseStart("void") + 2.4, fadeOut: 1 },
    ]);
    let frame = 0, stopped = false, released = false;
    const release = () => { if (released) return; released = true; cancelAnimationFrame(frame); document.removeEventListener("visibilitychange", visibility); audio.dispose(); clock.dispose(); lease.release(); if (clockRef.current === clock) clockRef.current = null; };
    const fail = (error: unknown) => { if (stopped) return; stopped = true; release(); setSceneError(error instanceof Error ? error.message : String(error)); };
    const stopForReplacement = frontend.story.subscribe(() => {
      if (frontend.story.snapshot() !== story) { stopped = true; release(); }
    });
    const visibility = () => { if (document.hidden) clock.suspend(performance.now()); else clock.resume(performance.now()); audio.sync(clock.snapshot()); };
    document.addEventListener("visibilitychange", visibility);
    clock.advance(performance.now());
    const render = (now: number) => {
      if (stopped) return;
      try { const state = clock.advance(now), projection = memoryProjection(state.time);
        audio.sync(state);
        lease.set({ active: !projection.drain, shake: projection.attack && !projection.sweep ? 0.35 : 0, alertLoop: projection.attack ? 1 - projection.voidProgress : 0, alertClock: Math.max(0, state.time - phaseStart("attack")), noriTint: projection.attack ? 0.55 * (1 - projection.voidProgress) : 0, chatMode: projection.sweep ? "bubbles" : "normal", bgm: projection.attack ? (projection.voidProgress > 0 ? "bgm_void" : "silent") : "auto", voidEnv: projection.voidProgress });
        setView({ time: state.time, phase: state.phase, parkedAt: state.parkedAt, complete: state.complete });
        if (state.complete) frontend.story.complete(story); else frame = requestAnimationFrame(render);
      } catch (error) { fail(error); }
    };
    frame = requestAnimationFrame(render);
    return () => { stopped = true; stopForReplacement(); release(); };
  }, [frontend, story, logs, sceneAttempt]);
  const memoryLogs = logs ?? { canon: Array.from({ length: 5 }, () => ({ name: "", items: [] as unknown[] })), flood: [] };
  const projection = memoryProjection(view.time);
  const open = Math.max(0, Math.min(5, Number(view.phase?.replace("win", "")) || (view.time >= phaseStart("flood") ? 5 : 0)));
  const activeIndex = view.parkedAt ? Number(view.parkedAt.replace("win", "")) - 1 : -1;
  useEffect(() => { setReadCount(1); }, [view.parkedAt]);
  useEffect(() => { if (!logs || activeIndex !== 4 || readCount < logs.canon[4].items.length) return; const timer = setTimeout(() => { if (view.parkedAt) clockRef.current?.wake(view.parkedAt, performance.now()); }, 4800); return () => clearTimeout(timer); }, [activeIndex, readCount, view.parkedAt, logs]);
  const advance = () => { if (!view.parkedAt || activeIndex < 0) return; if (readCount < memoryLogs.canon[activeIndex].items.length) setReadCount((value) => value + 1); else clockRef.current?.wake(view.parkedAt, performance.now()); };
  if (!logs) return <div className="memory-scene memory-loading" data-story-scene="memory" style={{ zIndex: NORI_SHELL_LAYERS.CUTSCENE }}>{loadError ? <div role="alert"><p>Memory archive could not be loaded.</p><button type="button" onClick={() => setLoadAttempt((value) => value + 1)}>Retry</button></div> : <div role="status">Decrypting memory archive…</div>}</div>;
  if (sceneError) return <div className="memory-scene memory-loading" data-story-scene="memory" style={{ zIndex: NORI_SHELL_LAYERS.CUTSCENE }}><div role="alert"><p>Memory scene could not continue.</p><button type="button" onClick={() => setSceneAttempt((value) => value + 1)}>Retry</button></div></div>;
  return <div className={`memory-scene ${projection.attack ? "is-attacked" : ""} ${projection.sweep ? "is-sweeping" : ""}`} data-story-scene="memory" data-phase={view.phase ?? "done"} style={{ zIndex: NORI_SHELL_LAYERS.CUTSCENE }}>
    <div className="memory-grid" />
    {Array.from({ length: open }, (_, index) => <button type="button" key={index} className={`memory-window memory-window-${index + 1}`} data-mem-active={view.parkedAt === `win${index + 1}`} onClick={view.parkedAt === `win${index + 1}` ? advance : undefined}>
      <span className="memory-title">{memoryLogs.canon[index].name}</span><span className="memory-records">{memoryLogs.canon[index].items.slice(0, view.parkedAt === `win${index + 1}` ? readCount : undefined).map((value, item) => { const kind = itemKind(value), data = record(value), photo = kind === "photo" && typeof data.id === "string" ? MEMORY_PHOTOS[data.id] : undefined; return <i key={item} className={`memory-record memory-record-${kind}`} data-nori={data.nori === true}>{photo ? <img src={photo} alt="Recovered memory" /> : <b>{itemText(value)}</b>}</i>; })}</span><span className="memory-progress">{view.parkedAt === `win${index + 1}` ? readCount < memoryLogs.canon[index].items.length ? "READ NEXT" : "CONTINUE" : "READ"}</span>
    </button>)}
    {view.phase === "flood" && memoryLogs.flood.slice(0, Math.min(memoryLogs.flood.length, Math.floor((view.time - phaseStart("flood")) * 1.2))).map((log, index) => <div key={`${log.name}-${index}`} className="memory-flood" style={{ left: `${(index * 37) % 88}%`, top: `${(index * 23) % 76}%` }}><b>{log.name}</b><span>{log.items.map(itemText).filter(Boolean).join(" ")}</span></div>)}
    {projection.attack && <div className="memory-alert" role="status">SYSTEM LOCKDOWN</div>}
    {projection.drain && <div className="memory-drain"><span>COMPUTE</span><i style={{ width: `${(1 - projection.drainProgress) * 100}%` }} /></div>}
    {projection.voidProgress > 0 && <div className="memory-void" style={{ opacity: projection.voidProgress }} />}
  </div>;
}
