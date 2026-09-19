import { useEffect, useRef, useState } from "react";
import type { NoriFrontendRuntime } from "../runtime/frontend-runtime";
import { NORI_SHELL_LAYERS } from "../state/window-layout-runtime";
import { StoryAudio } from "./story-audio";
import { StoryClock } from "./story-clock";
import type { StoryInstance } from "./story-director";
import { ENDING_AUDIO, ENDING_PHASES, endingFrame } from "./ending-timeline";

export function EndingScene({
  frontend,
  story,
}: {
  frontend: NoriFrontendRuntime;
  story: StoryInstance;
}) {
  const clockRef = useRef<StoryClock | null>(null);
  const frameRef = useRef(0);
  const retryFrames = useRef<number[]>([]);
  const [parked, setParked] = useState(false);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    setFailed(false);
    const lease = frontend.scene.acquire();
    const clock = new StoryClock(ENDING_PHASES);
    const audio = new StoryAudio(frontend.audio, ENDING_AUDIO);
    clockRef.current = clock;
    let stopped = false,
      waking = false;
    const readyDeadline = performance.now() + 30000;
    const stop = () => {
      stopped = true;
      cancelAnimationFrame(frameRef.current);
      retryFrames.current.forEach(cancelAnimationFrame);
      retryFrames.current = [];
      audio.dispose();
      clock.dispose();
      lease.release();
      clockRef.current = null;
    };
    const offStory = frontend.story.subscribe(() => {
      if (frontend.story.snapshot() !== story && !stopped) stop();
    });
    const visibility = () => {
      if (document.hidden) clock.suspend(performance.now());
      else clock.resume(performance.now());
      audio.sync(clock.snapshot());
    };
    document.addEventListener("visibilitychange", visibility);
    lease.set({
      active: true,
      chatMode: "hidden",
      bgm: "silent",
      ...endingFrame(0, false),
    });
    const render = (now: number) => {
      if (stopped) return;
      try {
        const stage = document.querySelector<HTMLElement>(".nori-stage");
        if (
          stage?.dataset.sceneRenderer === "fallback" ||
          stage?.dataset.coldOpen === "error"
        ) {
          stop();
          setFailed(true);
          return;
        }
        if (stage?.dataset.coldOpen !== "ready") {
          if (now >= readyDeadline) {
            console.error("[EndingScene] cold-open readiness timed out");
            stop();
            setFailed(true);
            return;
          }
          frameRef.current = requestAnimationFrame(render);
          return;
        }
        const state = clock.advance(now);
        waking ||= state.phase === "settle";
        const projected = endingFrame(state.time, waking);
        lease.set({
          active: true,
          chatMode: "hidden",
          bgm: "silent",
          ...projected,
        });
        audio.sync(state);
        setParked(state.parkedAt === "ready");
        if (state.complete) frontend.story.complete(story);
        else frameRef.current = requestAnimationFrame(render);
      } catch (error) {
        console.error("[EndingScene] render failed", error);
        stop();
        setFailed(true);
      }
    };
    visibility();
    frameRef.current = requestAnimationFrame(render);
    return () => {
      offStory();
      document.removeEventListener("visibilitychange", visibility);
      retryFrames.current.forEach(cancelAnimationFrame);
      retryFrames.current = [];
      if (!stopped) stop();
    };
  }, [frontend, story, attempt]);
  const wake = () => clockRef.current?.wake("ready", performance.now());
  const retry = () => {
    // Keep the released/default scene visible to NoriSceneRenderer for a full frame so it
    // disposes the failed ColdOpenRenderer before a new lease requests another instance.
    setFailed(false);
    const first = requestAnimationFrame(() => {
      retryFrames.current = retryFrames.current.filter((id) => id !== first);
      const second = requestAnimationFrame(() => {
        retryFrames.current = retryFrames.current.filter((id) => id !== second);
        setAttempt((value) => value + 1);
      });
      retryFrames.current.push(second);
    });
    retryFrames.current.push(first);
  };
  return (
    <div
      data-story-scene="ending"
      data-parked={parked || undefined}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: NORI_SHELL_LAYERS.CUTSCENE,
        pointerEvents: parked || failed ? "auto" : "none",
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
            color: "white",
            background: "#05080d",
          }}
        >
          <p>Scene resources could not be loaded.</p>
          <button type="button" onClick={retry}>
            Retry
          </button>
        </div>
      )}
      {!failed && parked && (
        <button
          type="button"
          onClick={wake}
          aria-label="Wake Nori"
          style={{
            position: "absolute",
            left: "50%",
            bottom: "10%",
            transform: "translateX(-50%)",
            border: "1px solid rgba(255,255,255,.55)",
            borderRadius: 999,
            padding: "10px 22px",
            background: "rgba(5,16,28,.45)",
            color: "white",
            letterSpacing: ".12em",
            cursor: "pointer",
          }}
        >
          WAKE
        </button>
      )}
    </div>
  );
}
