import { Suspense, lazy, useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { NoriFrontendRuntime } from "../runtime/frontend-runtime";
import { NORI_SHELL_LAYERS } from "../state/window-layout-runtime";
import { StoryClock } from "./story-clock";
import { StoryAudio } from "./story-audio";
import { createCultRenderer } from "./cult-renderer";
import type { StoryInstance } from "./story-director";
import { BootScene } from "./boot-scene";

// Boot plays on the first session.ready, so it stays in the entry. The later scenes
// (and their Pixi/three addon/post-processing dependencies) load on demand and are
// prefetched while the desktop is idle, so they are normally resident before their
// trigger fact arrives.
const loadCorruptionScene = () => import("./corruption-scene");
const loadMemoryScene = () => import("./memory-scene");
const loadDataseaScene = () => import("./datasea-scene");
const loadFarewellScene = () => import("./farewell-scene");
const loadEndingScene = () => import("./ending-scene");
const CorruptionScene = lazy(() => loadCorruptionScene().then((module) => ({ default: module.CorruptionScene })));
const MemoryScene = lazy(() => loadMemoryScene().then((module) => ({ default: module.MemoryScene })));
const DataseaScene = lazy(() => loadDataseaScene().then((module) => ({ default: module.DataseaScene })));
const FarewellScene = lazy(() => loadFarewellScene().then((module) => ({ default: module.FarewellScene })));
const EndingScene = lazy(() => loadEndingScene().then((module) => ({ default: module.EndingScene })));
const DEFERRED_SCENE_LOADERS = [loadCorruptionScene, loadMemoryScene, loadDataseaScene, loadFarewellScene, loadEndingScene];
/** Grace period after the desktop mounts before background scene prefetch starts. */
const SCENE_PREFETCH_DELAY_MS = 4000;

/** Warms deferred scene chunks one at a time during idle periods; failures retry on demand. */
function useDeferredScenePrefetch() {
  useEffect(() => {
    let cancelled = false;
    let idle: number | undefined;
    const schedule = (run: () => void) => {
      if (typeof window.requestIdleCallback === "function") idle = window.requestIdleCallback(run, { timeout: 5000 });
      else idle = window.setTimeout(run, 0);
    };
    const queue = [...DEFERRED_SCENE_LOADERS];
    const next = () => {
      if (cancelled) return;
      const load = queue.shift();
      if (!load) return;
      void load().catch(() => undefined).then(() => schedule(next));
    };
    const timer = window.setTimeout(() => schedule(next), SCENE_PREFETCH_DELAY_MS);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      if (idle === undefined) return;
      if (typeof window.cancelIdleCallback === "function") window.cancelIdleCallback(idle);
      else window.clearTimeout(idle);
    };
  }, []);
}

function CultFlash({
  frontend,
  story,
}: {
  frontend: NoriFrontendRuntime;
  story: StoryInstance;
}) {
  const host = useRef<HTMLDivElement>(null);
  const [attempt, setAttempt] = useState(0),
    [failed, setFailed] = useState(false);
  useEffect(() => {
    const hostElement = host.current;
    if (!hostElement) return;
    const canvas = document.createElement("canvas");
    canvas.style.cssText = "width:100%;height:100%;display:block";
    hostElement.append(canvas);
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
    const offStory = frontend.story.subscribe(() => {
      if (frontend.story.snapshot() === story) return;
      stopped = true;
      cancelAnimationFrame(frame);
      audio.dispose();
      clock.dispose();
      lease.release();
    });
    const visibility = () => {
      if (stopped) return;
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
          hostElement.dataset.progress = String(progress);
          if (progress >= 1) {
            audio.dispose();
            frontend.story.complete(story);
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
      offStory();
      cancelAnimationFrame(frame);
      audio.dispose();
      clock.dispose();
      document.removeEventListener("visibilitychange", visibility);
      renderer?.dispose();
      lease.release();
      canvas.remove();
    };
  }, [frontend, story, attempt]);
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
export function StoryScenes({
  frontend,
  minimizeWindows,
}: {
  frontend: NoriFrontendRuntime;
  minimizeWindows?(): void;
}) {
  const current = useSyncExternalStore(
    frontend.story.subscribe,
    frontend.story.snapshot,
  );
  useDeferredScenePrefetch();
  if (!current) return null;
  return (
    <Suspense fallback={null}>
      <StoryScene current={current} frontend={frontend} minimizeWindows={minimizeWindows} />
    </Suspense>
  );
}

function StoryScene({
  current,
  frontend,
  minimizeWindows,
}: {
  current: StoryInstance;
  frontend: NoriFrontendRuntime;
  minimizeWindows?(): void;
}) {
  const props = { frontend, story: current };
  switch (current.id) {
    case "boot":
      return <BootScene key={current.instance} {...props} />;
    case "nori-corruption-climax":
      return (
        <CorruptionScene
          key={current.instance}
          {...props}
          minimizeWindows={minimizeWindows}
        />
      );
    case "cult-flash":
      return <CultFlash key={current.instance} {...props} />;
    case "memory":
      return <MemoryScene key={current.instance} {...props} />;
    case "datasea":
      return <DataseaScene key={current.instance} {...props} />;
    case "farewell":
      return <FarewellScene key={current.instance} {...props} />;
    case "ending":
      return <EndingScene key={current.instance} {...props} />;
    default:
      return null;
  }
}
