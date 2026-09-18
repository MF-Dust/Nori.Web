import { createRoot } from "react-dom/client";
import { HeadPat } from "../frontend-src/live2d/head-pat";
import {
  ComputeDebugLab,
  GestureDebugLab,
  NetworkDebugLab,
  ReactionDebugLab,
  ScenarioDebugLab,
} from "../frontend-src/screens/debug-labs";
import { createSourceIdleRuntimeEngine } from "../frontend-src/state/idle-runtime-engine";
import type { NoriFrontendRuntime } from "../frontend-src/runtime/frontend-runtime";
import { readNetworkFaultProfile } from "../frontend-src/runtime/debug-tools";

const idle = createSourceIdleRuntimeEngine();
const frontend = { headPat: new HeadPat() } as NoriFrontendRuntime;
const reactions: string[] = [];
const scenarios: string[] = [];
let reloads = 0;

const root = createRoot(document.getElementById("root")!);
root.render(
  <main className="source-debug" aria-label="Debug lab harness">
    <NetworkDebugLab reload={() => reloads++} />
    <ComputeDebugLab actions={idle.debug} />
    <GestureDebugLab frontend={frontend} />
    <ReactionDebugLab preview={(reaction) => reactions.push(reaction)} />
    <ScenarioDebugLab
      load={async (_game, scenarioId) => {
        scenarios.push(scenarioId);
      }}
    />
  </main>,
);

Object.assign(window, {
  debugLabProbe: {
    profile: () => readNetworkFaultProfile(localStorage),
    idle: () => idle.snapshot().state,
    reactions,
    scenarios,
    reloads: () => reloads,
    dispose() {
      root.unmount();
      idle.dispose();
    },
  },
});
