import { createRoot } from "react-dom/client";
import { NoriStage } from "../frontend-src/live2d/nori-stage";
import { NoriSceneEffects } from "../frontend-src/components/nori-scene-effects";
import {
  NoriSceneStore,
  type NoriSceneState,
} from "../frontend-src/state/nori-scene";
import { SpeechPlayer } from "../frontend-src/runtime/speech-player";
import type { NoriFrontendRuntime } from "../frontend-src/runtime/frontend-runtime";
import type { ChatSnapshot } from "../frontend-src/apps/chat-runtime";

// Transport-only fixture; the model, engine, controllers and effects are production source.
const scene = new NoriSceneStore();
const speech = new SpeechPlayer({
  started() {},
  done() {},
  error(message) {
    throw new Error(message);
  },
});
let chat: ChatSnapshot = {
  presentationEpoch: 1,
  lines: [],
  connected: true,
  phase: "idle",
  mode: "text",
  pending: false,
  error: null,
};
const listeners = new Set<() => void>();
const conversation = {
  snapshot: () => chat,
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};
const frontend = {
  scene,
  speech,
  conversation,
} as unknown as NoriFrontendRuntime;
const facts = new Set<string>();
const root = createRoot(document.getElementById("root")!);
root.render(
  <>
    <NoriStage frontend={frontend} facts={facts} exclusive={() => false} />
    <NoriSceneEffects scene={scene} />
  </>,
);
const leases: ReturnType<NoriSceneStore["acquire"]>[] = [];
Object.assign(window, {
  noriSceneProbe: {
    chat(patch: Partial<ChatSnapshot>) {
      chat = { ...chat, ...patch };
      listeners.forEach((listener) => listener());
    },
    emotion(emotion: string) {
      const id = chat.lines.length + 1;
      this.chat({
        lines: [
          ...chat.lines,
          {
            messageId: String(id),
            blockId: 0,
            createdAt: id,
            sender: "agent",
            isSpeech: true,
            emotion,
            content: "Model check",
          },
        ],
      });
    },
    facts(values: string[]) {
      facts.clear();
      values.forEach((value) => facts.add(value));
    },
    acquire(patch: Partial<NoriSceneState>) {
      const lease = scene.acquire();
      leases.push(lease);
      lease.set(patch);
    },
    release() {
      leases.pop()?.release();
    },
    reset() {
      scene.reset();
    },
    unmount() {
      root.unmount();
      speech.dispose();
    },
  },
});
