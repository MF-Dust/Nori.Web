import { useCallback, useEffect, useRef, useState } from "react";
import type { NoriFrontendRuntime } from "../runtime/frontend-runtime";
import { NORI_SHELL_LAYERS } from "../state/window-layout-runtime";
import type { StoryInstance } from "./story-director";
import { StoryClock, type StoryClockState } from "./story-clock";
import { StoryAudio } from "./story-audio";
import { useStoryFocus } from "./use-story-focus";
import {
  CORRUPTION_AUDIO,
  CORRUPTION_MARKERS as m,
  CORRUPTION_PHASES,
  corruptionScene,
} from "./corruption-timeline";
import { AntivirusGames } from "./antivirus-games";
import { CorruptionEntry, CorruptionHeal } from "./corruption-overlays.js";
import { createCorruptionGlitch } from "./corruption-glitch.js";

/** Production scene keeps the reference's 12s voice fallback, unlike a simulated reply. */
export function CorruptionScene({
  frontend,
  story,
  minimizeWindows,
}: {
  frontend: NoriFrontendRuntime;
  story: StoryInstance;
  minimizeWindows?(): void;
}) {
  const host = useRef<HTMLDivElement>(null);
  useStoryFocus(host);
  const clockRef = useRef<StoryClock | null>(null),
    cleared = useRef(0),
    minimize = useRef(minimizeWindows);
  const [view, setView] = useState<StoryClockState>(() =>
    new StoryClock(CORRUPTION_PHASES).snapshot(),
  );
  const [paused, setPaused] = useState(false);
  const [failed, setFailed] = useState(false),
    [attempt, setAttempt] = useState(0);
  const failRef = useRef<() => void>(() => {});
  const failRenderer = useCallback(() => failRef.current(), []);
  minimize.current = minimizeWindows;
  useEffect(() => {
    setFailed(false);
    minimize.current?.();
    const lease = frontend.scene.acquire(),
      clock = new StoryClock(CORRUPTION_PHASES),
      audio = new StoryAudio(frontend.audio, CORRUPTION_AUDIO);
    const glitch = createCorruptionGlitch();
    clockRef.current = clock;
    cleared.current = 0;
    let frame = 0,
      stopped = false,
      previous = performance.now(),
      voiceWait = 0,
      foreground = 0,
      nextScare = 0,
      droneStop: (() => void) | null = null,
      droneLevel = -1;
    const blocks = new Set<string>();
    const canAdvance = () => !document.hidden && document.hasFocus();
    const stop = () => {
      if (stopped) return;
      stopped = true;
      cancelAnimationFrame(frame);
      audio.dispose();
      droneStop?.();
      glitch.dispose();
      clock.dispose();
      lease.release();
      clockRef.current = null;
    };
    failRef.current = () => {
      stop();
      setFailed(true);
    };
    const offStory = frontend.story.subscribe(() => {
      if (frontend.story.snapshot() !== story) stop();
    });
    const offSpeech = frontend.speech.subscribe((event) => {
      if (stopped || clock.snapshot().parkedAt !== "awaitVoice") return;
      if (event.type === "started")
        blocks.add(`${event.operationId}:${event.blockId}`);
      if (
        event.type === "done" &&
        blocks.has(`${event.operationId}:${event.blockId}`) &&
        canAdvance()
      )
        wakeVoice();
    });
    function wakeVoice() {
      if (clock.wake("awaitVoice", performance.now()))
        frontend.audio.playCue("cutscenes-corruption-erupt", { volume: 0.55 });
    }
    const visibility = () => {
      if (stopped) return;
      previous = performance.now();
      setPaused(!canAdvance());
      if (canAdvance()) clock.resume(previous);
      else clock.suspend(previous);
      audio.sync(clock.snapshot());
    };
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("blur", visibility);
    window.addEventListener("focus", visibility);
    clock.advance(previous);
    visibility();
    let phase: string | null = null;
    const render = (now: number) => {
      if (stopped) return;
      const dt = canAdvance() ? Math.max(0, (now - previous) / 1000) : 0;
      previous = now;
      foreground += dt;
      const before = clock.snapshot();
      let next = clock.advance(now);
      if (next.parkedAt === "awaitVoice") {
        if (before.parkedAt === "awaitVoice") voiceWait += dt;
        if (voiceWait >= 12) {
          wakeVoice();
          next = clock.snapshot();
        }
      }
      if (
        next.time >= m.awaitVoice &&
        next.time < m.exitDark &&
        canAdvance() &&
        foreground >= nextScare
      ) {
        nextScare = foreground + 15;
        try {
          frontend.arcade.sendEvent(
            "nori_talk.request",
            { talkId: "corruption_scare" },
            { cartridgeId: "manifold.web" },
          );
        } catch (error) {
          console.warn("[CorruptionScene] scare request", error);
        }
      }
      const drone =
        next.time >= m.panUp &&
        next.time < m.exitDark &&
        canAdvance() &&
        frontend.audio.canPlay();
      const level = 1 - (0.85 * cleared.current) / 6;
      if ((!drone || level !== droneLevel) && droneStop) {
        droneStop();
        droneStop = null;
      }
      if (drone && !droneStop) {
        droneLevel = level;
        droneStop = frontend.audio.playSceneAudio(
          "/audio/corruption/eerie-drone-loop.m4a",
          {
            duration: 86400,
            gain: 0.55 * level,
            loop: true,
            track: "music",
            elapsed: () => foreground,
          },
        );
      }
      if (phase !== next.phase) {
        phase = next.phase;
        if (phase === "entry")
          frontend.audio.playCue("cutscenes-entry-console-alarm");
      }
      const projected = corruptionScene(next);
      glitch.update(
        foreground * 1000,
        canAdvance() &&
          (next.time < m.panUp
            ? foreground % 1.5 < 0.15
            : next.time < m.exitDark),
      );
      // The original only takes camera control after the initial minimize/voice gate.
      if (next.time < m.panUp) {
        projected.camera = null;
        projected.fov = null;
      }
      if (next.phase === "entry") {
        const p = (next.time - m.entry) / 3.4;
        projected.vignette = 0.7 * Math.sin(Math.PI * p);
        projected.noriReveal = 1 - 0.22 * Math.sin(Math.PI * p);
      }
      lease.set(projected);
      audio.sync(next);
      setView(next);
      if (next.complete) {
        audio.dispose();
        droneStop?.();
        frontend.story.complete(story);
      } else frame = requestAnimationFrame(render);
    };
    frame = requestAnimationFrame(render);
    return () => {
      offStory();
      offSpeech();
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("blur", visibility);
      window.removeEventListener("focus", visibility);
      stop();
    };
  }, [frontend, story, attempt]);
  const wake = (phase: string) => {
    if (!paused && !document.hidden) {
      clockRef.current?.wake(phase, performance.now());
      if (phase === "wake") frontend.audio.playCue("cutscenes-tap-to-wake");
    }
  };
  return (
    <div
      ref={host}
      role="dialog"
      aria-modal="true"
      aria-label="Recover Nori"
      tabIndex={-1}
      data-story-scene="nori-corruption-climax"
      data-phase={view.phase}
      data-time={view.time}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: NORI_SHELL_LAYERS.CUTSCENE,
      }}
    >
      {failed && (
        <div
          role="alert"
          style={{
            position: "absolute",
            inset: 0,
            display: "grid",
            placeContent: "center",
            background: "#03090f",
            color: "white",
          }}
        >
          <p>Scene could not be displayed.</p>
          <button
            type="button"
            onClick={() => setAttempt((value) => value + 1)}
          >
            Retry
          </button>
        </div>
      )}
      <CorruptionEntry
        active={!failed && view.phase === "entry"}
        progress={(view.time - m.entry) / 3.4}
      />
      {!failed && view.parkedAt === "qte" && (
        <AntivirusGames
          audio={frontend.audio}
          paused={paused}
          onCleared={(count) => {
            cleared.current = count;
          }}
          onComplete={() => wake("qte")}
        />
      )}
      <CorruptionHeal
        active={!failed && view.phase === "heal"}
        onError={failRenderer}
        progress={(view.time - m.heal) / 17}
      />
      {view.parkedAt === "wake" && (
        <button
          type="button"
          aria-label="Wake Nori"
          disabled={paused}
          onClick={() => wake("wake")}
          style={{
            position: "absolute",
            inset: 0,
            background: "transparent",
            border: 0,
            color: "#e6fffb",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            paddingBottom: "14%",
            letterSpacing: ".55em",
            cursor: "pointer",
          }}
        >
          TAP TO WAKE
        </button>
      )}
    </div>
  );
}
