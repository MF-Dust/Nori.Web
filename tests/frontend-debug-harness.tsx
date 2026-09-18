import { createRoot } from "react-dom/client";
import { NoriFrontendRuntime } from "../frontend-src/runtime/frontend-runtime";
import { readNetworkFaultProfile } from "../frontend-src/runtime/debug-tools";
import { DebugScreen } from "../frontend-src/screens/debug-screen";
import { createSourceIdleRuntimeEngine } from "../frontend-src/state/idle-runtime-engine";
import { useAudioSettings } from "../frontend-src/state/audio-store";

const idle = createSourceIdleRuntimeEngine();
const frontend = new NoriFrontendRuntime();
const scenarios: string[] = [];
const live2dState = {
  plugins: new Map<string, boolean>([["physics", true]]),
  rest: false,
  expressions: new Set<string>(),
  motions: [] as unknown[],
};
frontend.live2dDebug.attach({
  getSetting: () => ({
    getMotionGroupCount: () => 1,
    getMotionGroupName: () => "Idle",
    getMotionCount: () => 1,
    getMotionFileName: () => "idle.motion3.json",
  }),
  getExpressionNames: () => ["13_Happy"],
  getActiveExpressions: () => [...live2dState.expressions],
  addExpression: (name: string) => live2dState.expressions.add(name),
  removeExpression: (name: string) => live2dState.expressions.delete(name),
  getPluginEnabled: (id: string) => live2dState.plugins.get(id) ?? false,
  setPluginEnabled: (id: string, enabled: boolean) =>
    live2dState.plugins.set(id, enabled),
  isRestPose: () => live2dState.rest,
  setRestPose: (enabled: boolean) => {
    live2dState.rest = enabled;
  },
  startMotion: (value: unknown) => live2dState.motions.push(value),
} as never);

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
    audio: () => useAudioSettings.getState(),
    scene: () => frontend.scene.snapshot(),
    scenarios,
    live2d: () => ({
      plugins: Object.fromEntries(live2dState.plugins),
      rest: live2dState.rest,
      expressions: [...live2dState.expressions],
      motions: live2dState.motions,
    }),
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
