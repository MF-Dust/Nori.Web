import type { StoryPhase, StoryClockState } from "./story-clock";
import type { StoryAudioTrack } from "./story-audio";
import { NoriSceneStore, type NoriSceneState } from "../state/nori-scene";

export const CORRUPTION_PHASES: readonly StoryPhase[] = [
  { id: "minimize", duration: 1.1 },
  { id: "awaitVoice", duration: 0.01, pauseAtStart: true },
  { id: "panUp", duration: 0.7 },
  { id: "dread", duration: 6 },
  { id: "entry", duration: 3.4 },
  { id: "qte", duration: 0.01, pauseAtStart: true },
  { id: "exitDark", duration: 0.9 },
  { id: "heal", duration: 17 },
  { id: "exitSnap", duration: 2 },
  { id: "wake", duration: 0, pauseAtStart: true },
  { id: "settle", duration: 2.8 },
];
export const CORRUPTION_MARKERS: Readonly<Record<string, number>> = (() => {
  let time = 0;
  return Object.fromEntries(
    CORRUPTION_PHASES.map((phase) => {
      const start = time;
      time += phase.duration;
      return [phase.id, start];
    }),
  );
})();
export const CORRUPTION_AUDIO: readonly StoryAudioTrack[] = [
  {
    id: "pan",
    src: "/audio/corruption/panup-braam.m4a",
    at: CORRUPTION_MARKERS.panUp,
    until: CORRUPTION_MARKERS.qte,
    fadeOut: 2,
    kind: "music",
  },
  {
    id: "clear",
    src: "/audio/corruption/qte-clear-bubbles.m4a",
    at: CORRUPTION_MARKERS.heal + 0.4,
    until: CORRUPTION_MARKERS.exitSnap,
    kind: "music",
  },
  {
    id: "heal",
    src: "/audio/corruption/heal-chimes.m4a",
    at: CORRUPTION_MARKERS.heal,
    until: CORRUPTION_MARKERS.wake,
    gain: 0.8,
    fadeIn: 1,
    fadeOut: 4.5,
    kind: "music",
  },
];
const clamp = (value: number) => Math.max(0, Math.min(1, value));
const smooth = (value: number) => {
  const t = clamp(value);
  return t * t * (3 - 2 * t);
};
const defaults = new NoriSceneStore().snapshot();
/** Inspection projection. Production registration waits for the original overlay and agent handoff. */
export function corruptionScene(state: StoryClockState): NoriSceneState {
  const result = {
    ...defaults,
    active: true,
    bgm: "silent" as const,
    lerp: 1,
    noriDolly: 6.3,
  };
  const t = state.time,
    m = CORRUPTION_MARKERS;
  if (t < m.panUp) return result;
  const pan = smooth((t - m.panUp) / 0.7);
  Object.assign(result, {
    camera: { x: 0, y: 0.6 + 1.6 * pan, z: 7.4 },
    fov: 60,
    noriTexture: "corrupt",
    corruptVoice: true,
    noriRestPose: true,
    noriTint: pan,
    redLight: pan,
    chatMode: "bubbles",
    eyeOpen: 1,
    noriSmile: true,
  });
  if (t < m.exitDark) return result;
  const dark = smooth((t - m.exitDark) / 0.9);
  Object.assign(result, {
    noriTexture: null,
    corruptVoice: false,
    noriRestPose: false,
    chatMode: "normal",
    redLight: 1 - dark,
    noriTint: 1 - dark,
    darkness: 0.85 * dark,
    noriDim: 3 * dark,
    eyeOpen: 0,
    mouthOpen: 0,
  });
  if (t < m.heal) return result;
  const heal = clamp((t - m.heal) / 17);
  Object.assign(result, {
    noriSleep: true,
    noriSmile: null,
    mouthOpen: null,
    noriReveal:
      heal < 0.3
        ? 1 - 0.62 * smooth(heal / 0.3)
        : 0.38 + 0.62 * smooth((heal - 0.3) / 0.7),
    vignette:
      heal < 0.45
        ? 0.5 * smooth(heal / 0.45)
        : 0.5 - 0.42 * smooth((heal - 0.45) / 0.55),
  });
  if (t < m.exitSnap) return result;
  const snap = smooth((t - m.exitSnap) / 2);
  Object.assign(result, {
    camera: { x: 0, y: 2.2 + 0.15 * snap, z: 7.4 },
    fov: 60 - 45 * snap,
    noriDolly: 6.3 * (1 - snap),
  });
  if (state.parkedAt === "wake" || t < m.settle + 0.3) return result;
  const settle = smooth((t - m.settle - 0.3) / 2.1);
  Object.assign(result, {
    camera: { x: 0, y: 0.6 + 1.75 * (1 - settle), z: 7.4 },
    fov: 15 + 45 * settle,
    noriSleep: false,
    eyeOpen: clamp((t - m.settle - 0.3) / 1.3),
    darkness: 0.85 * (1 - settle),
    noriDim: 3 * (1 - settle),
    vignette: 0.08 * (1 - settle),
  });
  return result;
}
