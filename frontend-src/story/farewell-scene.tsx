import { useEffect, useRef, useState } from "react";
import type { NoriFrontendRuntime } from "../runtime/frontend-runtime";
import { NORI_SHELL_LAYERS } from "../state/window-layout-runtime";
import { StoryAudio } from "./story-audio";
import { StoryClock } from "./story-clock";
import type { StoryInstance } from "./story-director";
import {
  FAREWELL_AUDIO,
  FAREWELL_CUES,
  FAREWELL_DURATION,
  farewellFrame,
} from "./farewell-timeline";
import { FarewellRenderer } from "./farewell-renderer";
import { FarewellActor } from "./farewell-actor";
import "./farewell-scene.css";

const reloadPage = () => window.location.reload();

export function FarewellScene({
  frontend,
  story,
  reload = reloadPage,
}: {
  frontend: NoriFrontendRuntime;
  story: StoryInstance;
  reload?: () => void;
}) {
  const [view, setView] = useState(() => farewellFrame(0));
  const [attempt, setAttempt] = useState(0);
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  const host = useRef<HTMLDivElement>(null);
  const frameRef = useRef(0);
  useEffect(() => {
    setReady(false);
    const lease = frontend.scene.acquire();
    const clock = new StoryClock([
      { id: "farewell", duration: FAREWELL_DURATION },
    ]);
    const audio = new StoryAudio(frontend.audio, FAREWELL_AUDIO);
    let actor: FarewellActor | undefined;
    let renderer: FarewellRenderer;
    try {
      actor = new FarewellActor();
      renderer = new FarewellRenderer(() => actor?.canvas ?? null);
      host.current?.prepend(actor.canvas, renderer.canvas);
      setFailed(false);
    } catch (error) {
      console.error("[FarewellScene]", error);
      actor?.dispose();
      setFailed(true);
      lease.release();
      audio.dispose();
      clock.dispose();
      return;
    }
    let stopped = false;
    const activeActor = actor;
    let loadTimer: ReturnType<typeof setTimeout> | undefined;
    const stop = () => {
      stopped = true;
      clearTimeout(loadTimer);
      cancelAnimationFrame(frameRef.current);
      audio.dispose();
      clock.dispose();
      activeActor.dispose();
      renderer.dispose();
      activeActor.canvas.remove();
      renderer.canvas.remove();
      lease.release();
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
    const render = (now: number) => {
      if (stopped) return;
      try {
        const state = clock.advance(now),
          next = farewellFrame(state.time);
        setView(next);
        const cue = FAREWELL_CUES[next.cueIndex];
        activeActor.setCue(
          cue?.modelExpression ?? "Finale_Default",
          cue?.idle ?? 2,
        );
        renderer.render({
          presence: next.presence,
          wash: next.wash,
          rim: next.rim,
          shadow: next.shadow,
          cut: next.black,
        });
        lease.set({
          active: true,
          darkness: next.black ? 1 : 0,
          chatMode: "hidden",
          bgm: "silent",
          noriReveal: 0,
          noriDim: next.dim,
          noriSmile: next.expression.includes("smile"),
          eyeOpen: next.expression === "eyes-closed-smile" ? 0 : null,
        });
        audio.sync(state);
        if (state.complete) frontend.story.complete(story, reload);
        else frameRef.current = requestAnimationFrame(render);
      } catch (error) {
        console.error("[FarewellScene] render failed", error);
        stop();
        setFailed(true);
      }
    };
    const readiness = new Promise<never>((_, reject) => {
      loadTimer = setTimeout(
        () => reject(new Error("Farewell actor readiness timed out")),
        30000,
      );
    });
    void Promise.race([activeActor.load(), readiness])
      .then((loaded) => {
        if (stopped) return;
        clearTimeout(loadTimer);
        if (!loaded) {
          stop();
          setFailed(true);
          return;
        }
        setReady(true);
        clock.advance(performance.now());
        visibility();
        frameRef.current = requestAnimationFrame(render);
      })
      .catch((error) => {
        if (!stopped) {
          console.error("[FarewellActor]", error);
          stop();
          setFailed(true);
        }
      });
    return () => {
      offStory();
      document.removeEventListener("visibilitychange", visibility);
      if (!stopped) stop();
    };
  }, [frontend, story, reload, attempt]);

  return (
    <div
      ref={host}
      data-story-scene="farewell"
      data-ready={ready || undefined}
      data-speaking={view.speaking || undefined}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: NORI_SHELL_LAYERS.CUTSCENE,
        background: view.black ? "#000" : "#fff",
        transition: "background .08s linear",
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
            color: "#222",
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
      {!failed && !view.black && view.subtitle.length > 0 && (
        <div className="farewell-subtitles">
          {view.subtitle.map((cue) => (
            <p key={cue.id} className="farewell-line">
              {cue.text}
            </p>
          ))}
        </div>
      )}
      {!failed && !view.black && (
        <span
          aria-live="polite"
          style={{
            position: "absolute",
            width: 1,
            height: 1,
            overflow: "hidden",
            clipPath: "inset(50%)",
          }}
        >
          {view.speaking ? "Voice playing" : "Voice paused"}
        </span>
      )}
    </div>
  );
}
