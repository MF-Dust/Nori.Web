import { useEffect, useRef, useState } from "react";
import type { NoriFrontendRuntime } from "../runtime/frontend-runtime";
import { NORI_SHELL_LAYERS } from "../state/window-layout-runtime";
import { StoryAudio } from "./story-audio";
import { StoryClock, type StoryPhase } from "./story-clock";
import type { StoryInstance } from "./story-director";
import { createDataseaRenderer } from "./datasea-renderer";
import { DataseaWaveGate } from "./datasea-wave-gate";
import "./datasea-scene.css";

export const DATASEA_PHASES: readonly StoryPhase[] = [
  { id: "descent", duration: 30 }, { id: "messages", duration: 44.8 },
  { id: "vizIn", duration: 14 }, { id: "waves", duration: 0.5, pauseAtStart: true },
  { id: "converge", duration: 10 }, { id: "cosmic", duration: 59.815178571428596 },
  { id: "white", duration: 28.3 }, { id: "cg", duration: 11 },
];
const startOf = (id: string) => DATASEA_PHASES.slice(0, DATASEA_PHASES.findIndex((phase) => phase.id === id)).reduce((sum, phase) => sum + phase.duration, 0);

export function dataseaCamera(time: number) {
  const points = [[0, 0], [1, -2], [3, -30], [5, -80], [7, -122], [9, -146], [12, -163], [16, -175], [20, -183], [24, -188], [27, -190]] as const;
  const segment = points.findIndex((point, index) => index > 0 && time <= point[0]);
  const right = segment < 1 ? points.at(-1)! : points[segment], left = segment < 1 ? right : points[segment - 1];
  const mix = left === right ? 1 : Math.max(0, Math.min(1, (time - left[0]) / (right[0] - left[0])));
  const eased = mix * mix * (3 - 2 * mix), y = left[1] + (right[1] - left[1]) * eased;
  const tilt = Math.max(0, Math.min(1, (time - 5) / 8));
  return { camera: { x: 0, y, z: 7.4 }, cameraRot: { x: -(Math.PI / 2) * (tilt * tilt * (3 - 2 * tilt)), y: 0, z: 0 }, fov: 60 };
}

export function DataseaScene({ frontend, story }: { frontend: NoriFrontendRuntime; story: StoryInstance }) {
  const [view, setView] = useState({ time: 0, phase: "descent" as string | null, parkedAt: null as string | null, ready: false });
  const [attempt, setAttempt] = useState(0), [failure, setFailure] = useState<string | null>(null);
  const clockRef = useRef<StoryClock | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const clock = new StoryClock(DATASEA_PHASES), lease = frontend.scene.acquire(); clockRef.current = clock;
    let renderer: ReturnType<typeof createDataseaRenderer> | undefined; setFailure(null); setView((state) => ({ ...state, ready: false }));
    const cosmic = startOf("cosmic"), white = startOf("white"), cg = startOf("cg");
    const audio = new StoryAudio(frontend.audio, [
      { id: "descent", src: "/audio/datasea/descend-bubbles.m4a", at: 0, until: 8 },
      { id: "deep", src: "/audio/datasea/deep-space.m4a", at: 8, until: cosmic, loop: true, fadeIn: 2, fadeOut: 2, gain: 0.8 },
      { id: "accelerate", src: "/audio/datasea/cosmic-accel-whoosh.m4a", at: cosmic, until: cosmic + 8 },
      { id: "white-1", src: "/audio/datasea/white-wave-1.m4a", at: white, until: white + 6 },
      { id: "white-2", src: "/audio/datasea/white-wave-2.m4a", at: white + 6, until: cg },
      { id: "shore", src: "/audio/datasea/seaside-waves-loop.m4a", at: white, until: cg + 11, loop: true, fadeIn: 2, gain: 0.65 },
      { id: "touch", src: "/audio/datasea/droplet-touch.m4a", at: cg, until: cg + 4 },
      { id: "riser", src: "/audio/datasea/cg-riser.m4a", at: cg + 3, until: cg + 11 },
    ]);
    let frame = 0, stopped = false, released = false, readyTimer: ReturnType<typeof setTimeout> | undefined;
    const release = () => { if (released) return; released = true; clearTimeout(readyTimer); cancelAnimationFrame(frame); document.removeEventListener("visibilitychange", visibility); audio.dispose(); renderer?.dispose(); clock.dispose(); lease.release(); if (clockRef.current === clock) clockRef.current = null; };
    const fail = (error: unknown) => { if (stopped) return; stopped = true; release(); setFailure(error instanceof Error ? error.message : String(error)); };
    const off = frontend.story.subscribe(() => { if (frontend.story.snapshot() !== story) { stopped = true; release(); } });
    const visibility = () => { if (stopped) return; if (document.hidden) clock.suspend(performance.now()); else clock.resume(performance.now()); audio.sync(clock.snapshot()); };
    document.addEventListener("visibilitychange", visibility);
    const render = (now: number) => {
      if (stopped) return;
      try {
        const state = clock.advance(now), camera = dataseaCamera(state.time), whiteProgress = Math.max(0, Math.min(1, (state.time - white) / 5));
        audio.sync(state); renderer!.render({ time: state.time, phaseTime: state.phase ? state.time - startOf(state.phase) : state.time, phase: state.phase, ...camera }); lease.set({ active: true, ...camera, lerp: 1, darkness: state.time < 30 ? Math.min(1, state.time / 18) : 1, whiteFlash: whiteProgress, bgm: "silent", chatMode: "hidden" });
        setView({ time: state.time, phase: state.phase, parkedAt: state.parkedAt, ready: true });
        if (state.complete) frontend.story.complete(story); else frame = requestAnimationFrame(render);
      } catch (error) { fail(error); }
    };
    try {
      renderer = createDataseaRenderer(canvasRef.current!);
      readyTimer = setTimeout(() => fail(new Error("Datasea assets timed out")), 45000);
      renderer.ready.then(() => { if (stopped) return; clearTimeout(readyTimer); clock.advance(performance.now()); visibility(); frame = requestAnimationFrame(render); }).catch(fail);
    } catch (error) { fail(error); }
    return () => { stopped = true; off(); release(); };
  }, [frontend, story, attempt]);
  const white = startOf("white"), cg = startOf("cg"), whiteProgress = Math.max(0, Math.min(1, (view.time - white) / 5));
  const wake = () => view.parkedAt && clockRef.current?.wake(view.parkedAt, performance.now());
  return <div className="datasea-scene" data-story-scene="datasea" data-phase={view.phase ?? "done"} data-ready={view.ready ? "true" : "false"} style={{ zIndex: NORI_SHELL_LAYERS.CUTSCENE }}>
    <canvas ref={canvasRef} className="datasea-canvas" />
    <div className="datasea-depth" style={{ transform: `translateY(${Math.min(55, view.time * 1.7)}vh)` }} />
    {!view.ready && !failure && <div className="datasea-loading" role="status">Loading Datasea geometry…</div>}
    {view.parkedAt === "waves" && <DataseaWaveGate wake={wake} frontend={frontend} />}
    {(view.phase === "converge" || view.phase === "cosmic") && <div className="datasea-cosmic"><div className="datasea-core" /></div>}
    <div className="datasea-white" style={{ opacity: whiteProgress }} />
    {view.time >= cg && <div className="datasea-cg"><img src="/datasea/cg-touch-her.webp" alt="" /><img src="/datasea/cg-touch-hand.webp" alt="" /></div>}
    {failure && <div className="datasea-error" role="alert"><p>Datasea assets could not be loaded.</p><button type="button" onClick={() => setAttempt((value) => value + 1)}>Retry</button></div>}
  </div>;
}
