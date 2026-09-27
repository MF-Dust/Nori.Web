import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { MemoryScene } from "../../../frontend-src/story/memory-scene";
import { DataseaScene } from "../../../frontend-src/story/datasea-scene";
import { NoriSceneStore } from "../../../frontend-src/state/nori-scene";
import type { NoriFrontendRuntime } from "../../../frontend-src/runtime/frontend-runtime";
import type { StoryInstance } from "../../../frontend-src/story/story-director";
import "../../../frontend-src/styles/app.css";

type Kind = "memory" | "datasea";
const events = { completions: [] as string[], audioStops: 0, leases: 0 };
let current: StoryInstance | null = null;
const listeners = new Set<() => void>();
const scene = new NoriSceneStore();
const story = {
  snapshot: () => current,
  subscribe: (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  complete: (expected: StoryInstance | null) => {
    if (expected === current) events.completions.push(expected!.id);
  },
};
const originalAcquire = scene.acquire.bind(scene);
scene.acquire = () => {
  events.leases++;
  const lease = originalAcquire();
  let released = false;
  return {
    set: lease.set,
    release: () => {
      if (!released) {
        released = true;
        events.leases--;
      }
      lease.release();
    },
  };
};
const runtime = {
  scene,
  story,
  files: {
    presentation: async () => ({
      vaults: [],
      files: [
        ...[4, 5, 4, 5, 6].map((count, index) => ({
          id: `canon-${index}`,
          kind: "training-log",
          phase: "canon",
          seq: index,
          name: `Recovered log ${index + 1}`,
          items: Array.from({ length: count }, (_, item) => ({
            t: `Recovered record ${index + 1}.${item + 1}`,
          })),
        })),
        ...Array.from({ length: 12 }, (_, index) => ({
          id: `flood-${index}`,
          kind: "training-log",
          phase: "flood",
          seq: index,
          name: `Incoming archive ${index + 1}`,
          items: [{ t: `Packet ${index + 1}` }],
        })),
      ],
    }),
  },
  audio: {
    canPlay: () => false,
    playCue: () => {},
    playSceneAudio: () => {
      let stopped = false;
      return () => {
        if (!stopped) {
          stopped = true;
          events.audioStops++;
        }
      };
    },
  },
} as unknown as NoriFrontendRuntime;

function instance(kind: Kind, serial: number): StoryInstance {
  return {
    id: kind,
    trigger: kind === "memory" ? "arg.memory.start" : "arg.finale.started",
    sentinel: kind === "memory" ? "arg.memory.shown" : "arg.finale.shown",
    instance: serial,
  };
}
function App() {
  const initial = (
    new URLSearchParams(location.search).get("scene") === "memory"
      ? "memory"
      : "datasea"
  ) as Kind;
  const [selection, setSelection] = useState<{
    kind: Kind;
    serial: number;
  } | null>({ kind: initial, serial: 1 });
  if (selection) current = instance(selection.kind, selection.serial);
  else current = null;
  (window as unknown as { memoryDataseaProbe: unknown }).memoryDataseaProbe = {
    events,
    scene: () => scene.snapshot(),
    cancel: () => {
      current = null;
      listeners.forEach((listener) => listener());
      setSelection(null);
    },
    mount: (kind: Kind) =>
      setSelection((value) => ({ kind, serial: (value?.serial ?? 1) + 1 })),
  };
  if (!selection || !current) return <div data-harness-empty="true" />;
  return selection.kind === "memory" ? (
    <MemoryScene key={selection.serial} frontend={runtime} story={current} />
  ) : (
    <DataseaScene key={selection.serial} frontend={runtime} story={current} />
  );
}
createRoot(document.getElementById("root")!).render(<App />);
