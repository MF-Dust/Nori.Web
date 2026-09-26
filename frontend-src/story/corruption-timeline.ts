import type { StoryPhase, StoryClockState } from "./story-clock";
import type { StoryAudioTrack } from "./story-audio";
import { NoriSceneStore, type NoriSceneState } from "../state/nori-scene";
import { power2In, power2InOut, power2Out, power3Out, ramp } from "./story-ease";

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
  // Shipped `MJ` camera: camY 0 -> +panUpRise 1.6 over panDuration 0.7
  // (`power2.out`). Shipped `cXe` corruption: redLight and tint 0 -> 1 over the
  // same window (`power2.in`) — they lead the camera, not the other way round.
  Object.assign(result, {
    camera: {
      x: 0,
      y: 1.6 * ramp(t, m.panUp, 0.7, 0, 1, power2Out),
      z: 7.4,
    },
    fov: 60,
    noriTexture: "corrupt",
    corruptVoice: true,
    noriRestPose: true,
    noriTint: ramp(t, m.panUp, 0.7, 0, 1, power2In),
    redLight: ramp(t, m.panUp, 0.7, 0, 1, power2In),
    chatMode: "bubbles",
    eyeOpen: 1,
    noriSmile: true,
  });
  if (t < m.exitDark) return result;
  // Shipped `TJ` exit-base: redLight and tint 1 -> 0 over exitDarkDur 0.9
  // (`power2.out`); darkness -> darkPeak 0.85 and noriDim -> noriDarkPeak 3 on
  // the same window with `power2.inOut`.
  Object.assign(result, {
    noriTexture: null,
    corruptVoice: false,
    noriRestPose: false,
    chatMode: "normal",
    redLight: ramp(t, m.exitDark, 0.9, 1, 0, power2Out),
    noriTint: ramp(t, m.exitDark, 0.9, 1, 0, power2Out),
    darkness: ramp(t, m.exitDark, 0.9, 0, 0.85, power2InOut),
    noriDim: ramp(t, m.exitDark, 0.9, 0, 3, power2InOut),
    eyeOpen: 0,
    mouthOpen: 0,
  });
  if (t < m.heal) return result;
  // Shipped `SJ` heal-tide over healDur 17: vReveal 1 -> 1 - healShroud 0.38
  // across the first 0.3 (`power2.in`) then back to 1 across 0.7
  // (`power3.out`); vVignette -> healVignette 0.5 across 0.45 (`power2.out`)
  // then down to 0.08 across 0.55 (`power2.inOut`). `heal` stays the normalized
  // phase progress, so those fractions are the shipped sub-window durations.
  const heal = clamp((t - m.heal) / 17);
  Object.assign(result, {
    noriSleep: true,
    noriSmile: null,
    mouthOpen: null,
    noriReveal:
      heal < 0.3
        ? ramp(heal, 0, 0.3, 1, 0.38, power2In)
        : ramp(heal, 0.3, 0.7, 0.38, 1, power3Out),
    vignette:
      heal < 0.45
        ? ramp(heal, 0, 0.45, 0, 0.5, power2Out)
        : ramp(heal, 0.45, 0.55, 0.5, 0.08, power2InOut),
  });
  if (t < m.exitSnap) return result;
  // Shipped `MJ`: one six-property tween (camX/camY/camZ/pitchX/fov/dolly) to
  // the idle preset over exitSnapDur 2 with `power2.inOut`. One eased t feeds
  // camera, fov and dolly here too.
  const snap = ramp(t, m.exitSnap, 2, 0, 1, power2InOut);
  Object.assign(result, {
    camera: { x: 0, y: 1.6 + 0.15 * snap, z: 7.4 },
    fov: 60 - 45 * snap,
    noriDolly: 6.3 * (1 - snap),
  });
  if (state.parkedAt === "wake" || t < m.settle + 0.3) return result;
  // darkness/noriDim run on cl_brightenDuration (2.1s), but the camera and fov
  // return over min(wakeReturnDur 1.4, cl_brightenDuration) and finish 0.7s early.
  // Shipped `uXe` noriDim -> 0 and `iJ` darkness -> 0 are `power2.out` over
  // 2.1s, `MJ`'s camera/fov return is `power2.out` over 1.4s, and `iJ`'s
  // eyeOpen -> 1 is `power2.out` over cl_eyeOpenDuration 1.3s.
  const settle = ramp(t, m.settle + 0.3, 2.1, 0, 1, power2Out);
  const camSettle = ramp(t, m.settle + 0.3, 1.4, 0, 1, power2Out);
  Object.assign(result, {
    camera: { x: 0, y: 1.75 * (1 - camSettle), z: 7.4 },
    fov: 15 + 45 * camSettle,
    noriSleep: false,
    eyeOpen: ramp(t, m.settle + 0.3, 1.3, 0, 1, power2Out),
    darkness: 0.85 * (1 - settle),
    noriDim: 3 * (1 - settle),
    vignette: 0.08 * (1 - settle),
  });
  return result;
}
