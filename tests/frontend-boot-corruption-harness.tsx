import { createRoot } from "react-dom/client";
import { useSyncExternalStore } from "react";
import { AudioMixer } from "../frontend-src/runtime/audio-mixer";
import { WorldStore } from "../frontend-src/runtime/world-store";
import { HeadPat } from "../frontend-src/live2d/head-pat";
import { NoriStage } from "../frontend-src/live2d/nori-stage";
import { NoriSceneEffects } from "../frontend-src/components/nori-scene-effects";
import { NoriSceneStore } from "../frontend-src/state/nori-scene";
import { SpeechPlayer } from "../frontend-src/runtime/speech-player";
import {
  StoryDirector,
  STORY_ORDER,
} from "../frontend-src/story/story-director";
import { BootScene } from "../frontend-src/story/boot-scene";
import { CorruptionScene } from "../frontend-src/story/corruption-scene";
import type { NoriFrontendRuntime } from "../frontend-src/runtime/frontend-runtime";

// Only transport/acknowledgement is simulated; clocks, actors, renderers and scene components are production source.
const scene = new NoriSceneStore(),
  completions: string[] = [],
  events: unknown[] = [];
const story = new StoryDirector(
  new Set(["boot", "nori-corruption-climax"]),
  async (fact) => {
    completions.push(fact);
  },
);
const speech = new SpeechPlayer({
  started() {},
  done() {},
  error(message) {
    throw Error(message);
  },
});
const audio = new AudioMixer(),
  cues: string[] = [];
const chat = {
  presentationEpoch: 1,
  lines: [],
  connected: true,
  phase: "idle",
  mode: "text",
  pending: false,
  error: null,
};
const frontend = {
  world: new WorldStore(),
  scene,
  story,
  speech,
  audio,
  headPat: new HeadPat(),
  requestPatReaction: () => false,
  arcade: {
    sendEvent(...args: unknown[]) {
      events.push(args);
    },
  },
  conversation: {
    snapshot: () => chat,
    subscribe: () => () => {},
    send: async () => true,
  },
} as unknown as NoriFrontendRuntime;
let minimized = 0;
let actorCaptureLease: ReturnType<NoriSceneStore["acquire"]> | null = null;
function App() {
  const current = useSyncExternalStore(story.subscribe, story.snapshot);
  return (
    <>
      <NoriStage
        frontend={frontend}
        facts={new Set()}
        exclusive={() => false}
      />
      <NoriSceneEffects scene={scene} />
      {current?.id === "boot" && (
        <BootScene key={current.instance} frontend={frontend} story={current} />
      )}
      {current?.id === "nori-corruption-climax" && (
        <CorruptionScene
          key={current.instance}
          frontend={frontend}
          story={current}
          minimizeWindows={() => {
            minimized++;
          }}
        />
      )}
    </>
  );
}
const root = createRoot(document.getElementById("root")!);
root.render(<App />);
Object.assign(window, {
  storyProbe: {
    completions,
    events,
    cues,
    state: scene.snapshot,
    minimized: () => minimized,
    actorCapture(hidden: boolean | null) {
      if (hidden === null) { actorCaptureLease?.release(); actorCaptureLease = null; return; }
      if (!actorCaptureLease) {
        const snapshot = scene.snapshot();
        actorCaptureLease = scene.acquire();
        actorCaptureLease.set({ ...snapshot, plankton: 0 });
      }
      actorCaptureLease.set({ coldOpen: { ...scene.snapshot().coldOpen!, noriForm: hidden ? 0 : 1 } });
    },
    start(id: string) {
      const definition = STORY_ORDER.find((s) => s.id === id)!;
      story.sync("fixture", new Set([definition.trigger]), true);
    },
    cancel() {
      story.sync(null, new Set(), true);
    },
    voiceDone() {
      (speech as any).emit({
        type: "started",
        operationId: "fixture",
        blockId: 0,
      });
      (speech as any).emit({
        type: "done",
        operationId: "fixture",
        blockId: 0,
      });
    },
    visibility(hidden: boolean) {
      Object.defineProperty(document, "hidden", {
        configurable: true,
        value: hidden,
      });
      document.dispatchEvent(new Event("visibilitychange"));
    },
    unmount() {
      root.unmount();
      story.dispose();
      speech.dispose();
      audio.dispose();
    },
  },
});
