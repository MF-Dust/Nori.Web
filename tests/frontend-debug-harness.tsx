import { createRoot } from "react-dom/client";
import { NoriFrontendRuntime } from "../frontend-src/runtime/frontend-runtime";
import { readNetworkFaultProfile } from "../frontend-src/runtime/debug-tools";
import { DebugScreen } from "../frontend-src/screens/debug-screen";
import { createSourceIdleRuntimeEngine } from "../frontend-src/state/idle-runtime-engine";

const idle = createSourceIdleRuntimeEngine();
const frontend = new NoriFrontendRuntime();
const scenarios: string[] = [];

const root = createRoot(document.getElementById("root")!);
const render = (visible = true) =>
  root.render(
    visible ? (
      <DebugScreen
        frontend={frontend}
        actions={{
          compute: idle.debug,
          loadScenario: async (game, scenarioId) => {
            scenarios.push(`${game}:${scenarioId}`);
          },
        }}
      />
    ) : null,
  );
render();

Object.assign(window, {
  debugLabProbe: {
    profile: () => readNetworkFaultProfile(localStorage),
    idle: () => idle.snapshot().state,
    scene: () => frontend.scene.snapshot(),
    scenarios,
    takeover() {
      frontend.story.sync("debug-world", new Set(["cult.unpacked"]));
    },
    releaseTakeover() {
      frontend.story.sync(null, new Set());
    },
    unmountTuners() {
      render(false);
    },
    dispose() {
      root.unmount();
      idle.dispose();
      frontend.dispose();
    },
  },
});
