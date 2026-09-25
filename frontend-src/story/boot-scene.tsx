import { useEffect, useRef, useState } from "react";
import type { NoriFrontendRuntime } from "../runtime/frontend-runtime";
import { NORI_SHELL_LAYERS } from "../state/window-layout-runtime";
import { StoryClock } from "./story-clock";
import { StoryAudio } from "./story-audio";
import { useStoryFocus } from "./use-story-focus";
import type { StoryInstance } from "./story-director";
import { BOOT_AUDIO, BOOT_PHASES, bootScene } from "./boot-timeline";
import {
  ShatterRenderer,
  createFractureGraph,
  shatterDefaults,
} from "./boot-shatter-renderer.js";

export function BootScene({
  frontend,
  story,
}: {
  frontend: NoriFrontendRuntime;
  story: StoryInstance;
}) {
  const host = useRef<HTMLDivElement>(null),
    clockRef = useRef<StoryClock | null>(null);
  useStoryFocus(host);
  const [attempt, setAttempt] = useState(0),
    [failed, setFailed] = useState(false),
    [loading, setLoading] = useState(true),
    [parked, setParked] = useState(false);
  useEffect(() => {
    const hostElement = host.current;
    if (!hostElement) return;
    setFailed(false);
    setLoading(true);
    setParked(false);
    const lease = frontend.scene.acquire(),
      clock = new StoryClock(BOOT_PHASES),
      audio = new StoryAudio(frontend.audio, BOOT_AUDIO);
    clockRef.current = clock;
    lease.set({
      active: true,
      bgm: "silent",
      chatMode: "hidden",
      coldOpen: null,
    });
    const canvas = document.createElement("canvas");
    canvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%";
    hostElement.prepend(canvas);
    let renderer: ShatterRenderer | undefined,
      frame = 0,
      stopped = false,
      ready = false,
      resetFrames = 0;
    const loadTimeout = setTimeout(() => {
      if (ready || stopped) return;
      stop();
      setFailed(true);
      setLoading(false);
    }, 60000);
    const params = shatterDefaults({});
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduced) {
      params.glitch = 0;
      params.shock = 0;
      params.filigree = 0;
    }
    const stop = () => {
      if (stopped) return;
      stopped = true;
      cancelAnimationFrame(frame);
      clearTimeout(loadTimeout);
      audio.dispose();
      clock.dispose();
      renderer?.dispose();
      canvas.remove();
      lease.release();
      clockRef.current = null;
    };
    const offStory = frontend.story.subscribe(() => {
      if (frontend.story.snapshot() !== story) stop();
    });
    const visibility = () => {
      if (stopped) return;
      if (document.hidden || !ready) clock.suspend(performance.now());
      else clock.resume(performance.now());
      audio.sync(clock.snapshot());
    };
    document.addEventListener("visibilitychange", visibility);
    const resize = new ResizeObserver(() => {
      if (renderer)
        renderer.resize(hostElement.clientWidth, hostElement.clientHeight);
    });
    resize.observe(hostElement);
    const render = (now: number) => {
      if (stopped) return;
      try {
        // Give a released failed ColdOpenRenderer a frame to dispose before retry.
        if (resetFrames++ < 2) {
          frame = requestAnimationFrame(render);
          return;
        }
        if (!renderer) {
          renderer = new ShatterRenderer(
            canvas,
            params,
            createFractureGraph(params),
            document.querySelector<HTMLCanvasElement>(
              "canvas[data-scene-canvas]",
            ),
          );
          renderer.ensureBreakStage();
          renderer.render(0, params);
          clock.advance(now);
          clock.suspend(now);
          lease.set(bootScene(clock.snapshot()));
        }
        const stage = document.querySelector<HTMLElement>(".nori-stage");
        if (
          stage?.dataset.live2dStatus === "error" ||
          stage?.dataset.coldOpen === "error" ||
          stage?.dataset.sceneRenderer === "fallback"
        )
          throw new Error("Cold-open resources unavailable");
        if (!ready && stage?.dataset.coldOpen === "ready") {
          ready = true;
          clearTimeout(loadTimeout);
          setLoading(false);
          if (!document.hidden) clock.resume(now);
        }
        const state = clock.advance(now);
        lease.set(bootScene(state));
        audio.sync(state);
        setParked(state.parkedAt === "ready");
        if (state.time <= 16) {
          renderer.drawBackdrop();
          renderer.render(state.time / 16, params);
        }
        canvas.style.visibility = state.time < 16 ? "visible" : "hidden";
        hostElement.dataset.phase = state.phase ?? "";
        hostElement.dataset.time = String(state.time);
        if (state.complete) {
          audio.dispose();
          frontend.story.complete(story);
        } else frame = requestAnimationFrame(render);
      } catch (error) {
        console.error("[BootScene]", error);
        stop();
        setFailed(true);
        setLoading(false);
      }
    };
    frame = requestAnimationFrame(render);
    return () => {
      offStory();
      resize.disconnect();
      document.removeEventListener("visibilitychange", visibility);
      stop();
    };
  }, [frontend, story, attempt]);
  const wake = () => {
    if (
      !document.hidden &&
      clockRef.current?.wake("ready", performance.now())
    ) {
      frontend.audio.playCue("cutscenes-tap-to-wake");
      void frontend.audio.unlock();
    }
  };
  return (
    <div
      ref={host}
      role="dialog"
      aria-modal="true"
      aria-label="Wake Nori"
      tabIndex={-1}
      data-story-scene="boot"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: NORI_SHELL_LAYERS.CUTSCENE,
      }}
    >
      {loading && !failed && (
        <span
          role="status"
          style={{ position: "absolute", bottom: 24, left: 24, color: "white" }}
        >
          Loading scene…
        </span>
      )}
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
          <p>Scene resources could not be loaded.</p>
          <button type="button" onClick={() => setAttempt((x) => x + 1)}>
            Retry
          </button>
        </div>
      )}
      {parked && !failed && (
        <button
          type="button"
          aria-label="Wake Nori"
          onClick={wake}
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
