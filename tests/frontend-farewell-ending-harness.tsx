import { createRoot } from "react-dom/client";
import { AudioMixer } from "../frontend-src/runtime/audio-mixer";
import { SpeechPlayer } from "../frontend-src/runtime/speech-player";
import { HeadPat } from "../frontend-src/live2d/head-pat";
import { NoriStage } from "../frontend-src/live2d/nori-stage";
import { NoriSceneStore } from "../frontend-src/state/nori-scene";
import { FarewellScene } from "../frontend-src/story/farewell-scene";
import { EndingScene } from "../frontend-src/story/ending-scene";
import type { StoryInstance } from "../frontend-src/story/story-director";
import type { NoriFrontendRuntime } from "../frontend-src/runtime/frontend-runtime";

const scene = new NoriSceneStore();
const speech = new SpeechPlayer({ started() {}, done() {}, error() {} });
const listeners = new Set<() => void>();
let current: StoryInstance | null = null, acknowledge: (() => void) | null = null;
const events: string[] = [];
const storyController = {
  snapshot: () => current,
  subscribe(listener: () => void) { listeners.add(listener); return () => listeners.delete(listener); },
  complete(expected: StoryInstance | null, callback?: () => void) {
    if (expected !== current || acknowledge) return;
    events.push("complete-requested");
    acknowledge = () => { if (expected !== current) return; events.push("acknowledged"); callback?.(); };
  },
};
const chat = { presentationEpoch: 1, lines: [], connected: true, phase: "idle", mode: "text", pending: false, error: null };
const frontend = {
  scene, speech, headPat: new HeadPat(), audio: new AudioMixer(), story: storyController,
  conversation: { snapshot: () => chat, subscribe: () => () => {} },
} as unknown as NoriFrontendRuntime;
const root = createRoot(document.getElementById("root")!);
function publish(next: StoryInstance | null) { current = next; listeners.forEach((listener) => listener()); }
function render(instance: StoryInstance | null) {
  root.render(<><NoriStage frontend={frontend} facts={new Set()} exclusive={() => true} />{
    instance?.id === "farewell" ? <FarewellScene frontend={frontend} story={instance} reload={() => events.push("reload")} />
      : instance?.id === "ending" ? <EndingScene frontend={frontend} story={instance} /> : null
  }</>);
}
function mount(kind: "farewell" | "ending") {
  acknowledge = null; events.length = 0; scene.reset();
  const instance: StoryInstance = kind === "farewell"
    ? { id: kind, trigger: "arg.farewell.started", sentinel: "arg.farewell.shown", instance: Date.now() }
    : { id: kind, trigger: "arg.ending.started", sentinel: "arg.ending.shown", instance: Date.now() };
  publish(instance);
  render(instance);
}
Object.assign(window, { farewellEndingProbe: {
  events, mount, cancel() { events.push("cancel"); publish(null); render(null); },
  acknowledge() { acknowledge?.(); },
  state: () => scene.snapshot(),
  unmount() { root.unmount(); speech.dispose(); frontend.audio.dispose(); },
} });
