import { createRoot } from "react-dom/client";
import { DebugScreen } from "../frontend-src/screens/debug-screen";
import { StoryScenes } from "../frontend-src/story/story-scenes";
import { NoriFrontendRuntime } from "../frontend-src/runtime/frontend-runtime";
import { StoryDirector } from "../frontend-src/story/story-director";
const frontend = new NoriFrontendRuntime();
const completions: string[] = [];
frontend.story.dispose();
Object.defineProperty(frontend, "story", {
  value: new StoryDirector(new Set(["cult-flash"]), async (fact) => {
    completions.push(fact);
  }),
});
const root = createRoot(document.getElementById("root")!);
const render = (debug: boolean) =>
  root.render(
    <>
      <div style={{ height: 580, width: 760 }}>
        {debug && <DebugScreen frontend={frontend} />}
      </div>
      <StoryScenes frontend={frontend} />
    </>,
  );
render(true);
Object.assign(window, {
  sceneTools: {
    completions,
    start(world = "fixture") {
      frontend.story.sync(world, new Set(["cult.unpacked"]));
    },
    cancel() {
      frontend.story.sync(null, new Set());
    },
    state() {
      return frontend.scene.snapshot();
    },
    visibility(hidden: boolean) {
      Object.defineProperty(document, "hidden", {
        configurable: true,
        value: hidden,
      });
      document.dispatchEvent(new Event("visibilitychange"));
    },
    closeDebug() {
      render(false);
    },
    openDebug() {
      render(true);
    },
    dispose() {
      delete (document as unknown as Record<string, unknown>).hidden;
      root.unmount();
      frontend.dispose();
    },
  },
});
