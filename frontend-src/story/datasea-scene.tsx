import { useEffect, useRef, useState } from "react";
import type { NoriFrontendRuntime } from "../runtime/frontend-runtime";
import { NORI_SHELL_LAYERS } from "../state/window-layout-runtime";
import { StoryAudio, type StoryAudioTrack } from "./story-audio";
import { StoryClock, type StoryPhase } from "./story-clock";
import type { StoryInstance } from "./story-director";
import { createDataseaRenderer } from "./datasea-renderer";
import { DataseaWaveGate } from "./datasea-wave-gate";
import { dataseaMessagesAt, dataseaCosmicAt, dataseaWhiteAt, dataseaCgAt } from "./datasea-content";
import { power2InOut } from "./story-ease";
import "./datasea-scene.css";

export const DATASEA_PHASES: readonly StoryPhase[] = [
  { id: "descent", duration: 30 },
  { id: "messages", duration: 44.8 },
  { id: "vizIn", duration: 14 },
  { id: "waves", duration: 0.5, pauseAtStart: true },
  { id: "converge", duration: 10 },
  { id: "cosmic", duration: 59.815178571428596 },
  { id: "white", duration: 28.3 },
  { id: "cg", duration: 11 },
];
const startOf = (id: string) =>
  DATASEA_PHASES.slice(
    0,
    DATASEA_PHASES.findIndex((phase) => phase.id === id),
  ).reduce((sum, phase) => sum + phase.duration, 0);

/** Story end. A shipped cue with no `until` is bounded by exactly this. */
const DATASEA_END = DATASEA_PHASES.reduce(
  (sum, phase) => sum + phase.duration,
  0,
);
/** Shipped `pass`: the accel whoosh rides the last cosmic line (t0 + 1.5,
 *  52.6 + 1.5). The shipped float carries one extra ulp (54.10000000000002 →
 *  153.40000000000003); phase-derived 153.4 is 2.8e-14s away, ~1e-9 of a sample. */
const DATASEA_PASS = 54.1;
/** Shipped `cosmicTail`: the cosmic phase outlasts the nebula handoff by this. */
const DATASEA_COSMIC_TAIL = 2;
/** Shipped CG contact beat: the hand lands 3.8s into the CG. */
const DATASEA_CONTACT = 3.8;

/**
 * The shipped audio table (the one revision of it in public/assets, in
 * NormalApp-Cn6agT0F.js, which public/index.html loads through index-CyHAbkO5).
 * Every time is an offset from DATASEA_PHASES so the algebra stays checkable.
 */
export const DATASEA_AUDIO: readonly StoryAudioTrack[] = [
  {
    id: "descendBubbles",
    src: "/audio/datasea/descend-bubbles.m4a",
    at: 0,
    until: DATASEA_END,
  },
  {
    id: "deepSpace",
    src: "/audio/datasea/deep-space.m4a",
    at: startOf("cosmic"),
    until: startOf("white"),
    gain: 0.7,
    fadeOut: 6,
  },
  {
    id: "cosmicAccelWhoosh",
    src: "/audio/datasea/cosmic-accel-whoosh.m4a",
    at: startOf("cosmic") + DATASEA_PASS,
    until: DATASEA_END,
    gain: 0.7,
  },
  {
    id: "whiteWave1",
    src: "/audio/datasea/white-wave-1.m4a",
    at: startOf("white"),
    until: DATASEA_END,
  },
  {
    id: "whiteWave2",
    src: "/audio/datasea/white-wave-2.m4a",
    at: startOf("white") + 6,
    until: DATASEA_END,
  },
  {
    id: "seasideWaves",
    src: "/audio/datasea/seaside-waves-loop.m4a",
    at: startOf("white"),
    until: startOf("cg") + DATASEA_CONTACT + 2.5,
    loop: true,
    gain: 0.25,
    fadeIn: 3,
    fadeOut: 2.5,
  },
  {
    id: "dropletTouch",
    src: "/audio/datasea/droplet-touch.m4a",
    at: startOf("cg") + DATASEA_CONTACT,
    until: DATASEA_END,
  },
  {
    id: "cgRiser",
    src: "/audio/datasea/cg-riser.m4a",
    at: startOf("cg") + 5,
    until: DATASEA_END,
    fadeOut: 0.5,
  },
];

/**
 * Shipped whiteout: smoothstep over [handoff + 5.2, handoff + 6.4] with the
 * handoff at `cosmic + (cosmicDur - cosmicTail)`, i.e. 1.2s long starting
 * 3.2s into the white phase.
 */
const whiteOutAt = startOf("white") - DATASEA_COSMIC_TAIL + 5.2;
const whiteOutSpan = 6.4 - 5.2;
export const dataseaWhiteout = (time: number) => {
  const mix = Math.max(0, Math.min(1, (time - whiteOutAt) / whiteOutSpan));
  return mix * mix * (3 - 2 * mix);
};

export function dataseaCamera(time: number) {
  const points = [
    [0, 0],
    [1, -2],
    [3, -30],
    [5, -80],
    [7, -122],
    [9, -146],
    [12, -163],
    [16, -175],
    [20, -183],
    [24, -188],
    [27, -190],
  ] as const;
  const segment = points.findIndex(
    (point, index) => index > 0 && time <= point[0],
  );
  const right = segment < 1 ? points.at(-1)! : points[segment],
    left = segment < 1 ? right : points[segment - 1];
  const mix =
    left === right
      ? 1
      : Math.max(0, Math.min(1, (time - left[0]) / (right[0] - left[0])));
  const eased = mix * mix * (3 - 2 * mix),
    y = left[1] + (right[1] - left[1]) * eased;
  const tilt = Math.max(0, Math.min(1, (time - 5) / 8));
  return {
    camera: { x: 0, y, z: 7.4 },
    cameraRot: {
      // Shipped `sUe`: `-(PI / 2) * Sg(fl(t, 5, 13))`. That bundle's `Sg` is the
      // cubic half/half ramp `t < 0.5 ? 4t^3 : 1 - (2 - 2t)^3 / 2`, i.e. exactly
      // the vendored GSAP `power2.inOut` — not the smoothstep this used to run.
      x: -(Math.PI / 2) * power2InOut(tilt),
      y: 0,
      z: 0,
    },
    fov: 60,
  };
}

export function DataseaScene({
  frontend,
  story,
}: {
  frontend: NoriFrontendRuntime;
  story: StoryInstance;
}) {
  const [view, setView] = useState({
    time: 0,
    phase: "descent" as string | null,
    parkedAt: null as string | null,
    ready: false,
  });
  const [attempt, setAttempt] = useState(0),
    [failure, setFailure] = useState<string | null>(null);
  const clockRef = useRef<StoryClock | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const clock = new StoryClock(DATASEA_PHASES),
      lease = frontend.scene.acquire();
    clockRef.current = clock;
    let renderer: ReturnType<typeof createDataseaRenderer> | undefined;
    setFailure(null);
    setView((state) => ({ ...state, ready: false }));
    const audio = new StoryAudio(frontend.audio, DATASEA_AUDIO);
    let frame = 0,
      stopped = false,
      released = false,
      readyTimer: ReturnType<typeof setTimeout> | undefined;
    const release = () => {
      if (released) return;
      released = true;
      clearTimeout(readyTimer);
      cancelAnimationFrame(frame);
      document.removeEventListener("visibilitychange", visibility);
      audio.dispose();
      renderer?.dispose();
      clock.dispose();
      lease.release();
      if (clockRef.current === clock) clockRef.current = null;
    };
    const fail = (error: unknown) => {
      if (stopped) return;
      stopped = true;
      release();
      setFailure(error instanceof Error ? error.message : String(error));
    };
    const off = frontend.story.subscribe(() => {
      if (frontend.story.snapshot() !== story) {
        stopped = true;
        release();
      }
    });
    const visibility = () => {
      if (stopped) return;
      if (document.hidden) clock.suspend(performance.now());
      else clock.resume(performance.now());
      audio.sync(clock.snapshot());
    };
    document.addEventListener("visibilitychange", visibility);
    const render = (now: number) => {
      if (stopped) return;
      try {
        const state = clock.advance(now),
          camera = dataseaCamera(state.time),
          whiteProgress = dataseaWhiteout(state.time);
        audio.sync(state);
        renderer!.render({
          time: state.time,
          phaseTime: state.phase
            ? state.time - startOf(state.phase)
            : state.time,
          phase: state.phase,
          ...camera,
        });
        lease.set({
          active: true,
          ...camera,
          lerp: 1,
          darkness: state.time < 30 ? Math.min(1, state.time / 18) : 1,
          whiteFlash: whiteProgress,
          bgm: "silent",
          chatMode: "hidden",
        });
        setView({
          time: state.time,
          phase: state.phase,
          parkedAt: state.parkedAt,
          ready: true,
        });
        if (state.complete) frontend.story.complete(story);
        else frame = requestAnimationFrame(render);
      } catch (error) {
        fail(error);
      }
    };
    try {
      renderer = createDataseaRenderer(canvasRef.current!);
      readyTimer = setTimeout(
        () => fail(new Error("Datasea assets timed out")),
        45000,
      );
      renderer.ready
        .then(() => {
          if (stopped) return;
          clearTimeout(readyTimer);
          clock.advance(performance.now());
          visibility();
          frame = requestAnimationFrame(render);
        })
        .catch(fail);
    } catch (error) {
      fail(error);
    }
    return () => {
      stopped = true;
      off();
      release();
    };
  }, [frontend, story, attempt]);
  const white = startOf("white"),
    cg = startOf("cg"),
    whiteProgress = dataseaWhiteout(view.time);
  const wake = () =>
    view.parkedAt && clockRef.current?.wake(view.parkedAt, performance.now());
  return (
    <div
      className="datasea-scene"
      data-story-scene="datasea"
      data-phase={view.phase ?? "done"}
      data-ready={view.ready ? "true" : "false"}
      style={{ zIndex: NORI_SHELL_LAYERS.CUTSCENE }}
    >
      <canvas ref={canvasRef} className="datasea-canvas" />
      <div
        className="datasea-depth"
        style={{ transform: `translateY(${Math.min(55, view.time * 1.7)}vh)` }}
      />
      {!view.ready && !failure && (
        <div className="datasea-loading" role="status">
          Loading Datasea geometry…
        </div>
      )}
      {view.phase === "messages" && (
        <div className="datasea-messages" data-datasea-messages="true" aria-live="polite">
          {(() => {
            const line = dataseaMessagesAt(view.time - startOf("messages"));
            return line ? <p className="datasea-bubble">{line.text}</p> : null;
          })()}
        </div>
      )}
      {view.parkedAt === "waves" && (
        <DataseaWaveGate wake={wake} frontend={frontend} />
      )}
      {(view.phase === "converge" || view.phase === "cosmic") && (
        <div className="datasea-cosmic">
          <div className="datasea-core" />
          {(() => {
            const line = dataseaCosmicAt(view.time - startOf("cosmic"));
            return line ? <p className="datasea-subtitles" data-datasea-subtitles="cosmic">{line.text}</p> : null;
          })()}
        </div>
      )}
      <div className="datasea-white" style={{ opacity: whiteProgress }}>
        {whiteProgress > 0 && (() => {
          const line = dataseaWhiteAt(view.time - white);
          return line ? <p className="datasea-subtitles datasea-subtitles-white" data-datasea-subtitles="white">{line.text}</p> : null;
        })()}
      </div>
      {view.time >= cg && (
        <div className="datasea-cg">
          <img src="/datasea/cg-touch-her.webp" alt="" />
          <img src="/datasea/cg-touch-hand.webp" alt="" />
          {(() => {
            const line = dataseaCgAt(view.time - cg);
            return line ? <p className="datasea-subtitles datasea-subtitles-cg" data-datasea-subtitles="cg">{line.text}</p> : null;
          })()}
        </div>
      )}
      {failure && (
        <div className="datasea-error" role="alert">
          <p>Datasea assets could not be loaded.</p>
          <button
            type="button"
            onClick={() => setAttempt((value) => value + 1)}
          >
            Retry
          </button>
        </div>
      )}
    </div>
  );
}
