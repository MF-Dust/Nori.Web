import { createRoot } from "react-dom/client";
import { DebugScreen } from "../../../frontend-src/screens/debug-screen";
import { StoryScenes } from "../../../frontend-src/story/story-scenes";
import { NoriFrontendRuntime } from "../../../frontend-src/runtime/frontend-runtime";
import { StoryDirector } from "../../../frontend-src/story/story-director";
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
      <div style={{ height: 580, width: "min(760px, 100vw)" }}>
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
    joinWorld(worldId = "preview-world", cult = false) {
      frontend.world.consume({
        type: "world_joined",
        world: {
          worldId,
          mountedCartridges: cult
            ? [
                {
                  cartridgeId: "manifold.web",
                  runtimes: [
                    {
                      visibilityFenceId: "ui",
                      headVersion: 1,
                      visibleVersion: 1,
                      state: { facts: { "cult.unpacked": true } },
                    },
                  ],
                },
              ]
            : [],
        },
      } as Parameters<typeof frontend.world.consume>[0]);
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
