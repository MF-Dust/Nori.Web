import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { NoriFrontendRuntime } from "../runtime/frontend-runtime";
import { NORI_SHELL_LAYERS } from "../state/window-layout-runtime";
import { StoryClock } from "./story-clock";
import { StoryAudio } from "./story-audio";
import { createCultRenderer } from "./cult-renderer";

function CultFlash({ frontend }: { frontend: NoriFrontendRuntime }) {
  const host = useRef<HTMLDivElement>(null);
  const [attempt, setAttempt] = useState(0),
    [failed, setFailed] = useState(false);
  useEffect(() => {
    const canvas = document.createElement("canvas");
    canvas.style.cssText = "width:100%;height:100%;display:block";
    host.current!.append(canvas);
    const lease = frontend.scene.acquire();
    lease.set({ active: true, darkness: 1 });
    let renderer: ReturnType<typeof createCultRenderer> | undefined;
    let frame = 0,
      stopped = false;
    const clock = new StoryClock([{ id: "cult", duration: 7 }]);
    const audio = new StoryAudio(frontend.audio, [
      {
        id: "drone",
        src: "/audio/cult/drone.ogg",
        at: 0,
        until: 6.65,
        fadeOut: 1.19,
        gain: 0.6,
        loop: true,
      },
    ]);
    const visibility = () => {
      if (document.hidden) clock.suspend(performance.now());
      else clock.resume(performance.now());
      audio.sync(clock.snapshot());
    };
    document.addEventListener("visibilitychange", visibility);
    setFailed(false);
    try {
      renderer = createCultRenderer(canvas);
      clock.advance(performance.now());
      visibility();
      const reduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      const render = (now: number) => {
        if (stopped) return;
        try {
          const state = clock.advance(now);
          audio.sync(state);
          const progress = state.time / state.duration;
          renderer!.render(reduced ? 0.95 : progress);
          host.current!.dataset.progress = String(progress);
          if (progress >= 1) {
            audio.dispose();
            frontend.story.complete();
          } else frame = requestAnimationFrame(render);
        } catch (error) {
          console.error("[CultFlash]", error);
          audio.dispose();
          setFailed(true);
        }
      };
      frame = requestAnimationFrame(render);
    } catch (error) {
      console.error("[CultFlash]", error);
      setFailed(true);
    }
    return () => {
      stopped = true;
      cancelAnimationFrame(frame);
      audio.dispose();
      clock.dispose();
      document.removeEventListener("visibilitychange", visibility);
      renderer?.dispose();
      lease.release();
      canvas.remove();
    };
  }, [frontend, attempt]);
  return (
    <div
      ref={host}
      data-story-scene="cult-flash"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: NORI_SHELL_LAYERS.CUTSCENE,
        background: "black",
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
    </div>
  );
}
export function StoryScenes({ frontend }: { frontend: NoriFrontendRuntime }) {
  const current = useSyncExternalStore(
    frontend.story.subscribe,
    frontend.story.snapshot,
  );
  return current?.id === "cult-flash" ? (
    <CultFlash key={frontend.world.snapshot().worldId} frontend={frontend} />
  ) : null;
}
