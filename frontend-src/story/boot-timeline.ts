import { PerspectiveCamera, Vector3 } from "three";
import { NoriSceneStore, type NoriSceneState } from "../state/nori-scene";
import type { StoryPhase, StoryClockState } from "./story-clock";
import type { StoryAudioTrack } from "./story-audio";

/** Default phase boundaries recovered from l$e/LZ/L1/sJ in the shipped client. */
export const BOOT_PHASES: readonly StoryPhase[] = [
  { id: "shatter", duration: 13.6 },
  { id: "surface", duration: 3.6 },
  { id: "descend", duration: 8.5 },
  { id: "push", duration: 3 },
  { id: "hold", duration: 0 },
  { id: "draw", duration: 4.5 },
  { id: "morph", duration: 4.8 },
  { id: "blobHold", duration: 1.1 },
  { id: "reveal", duration: 2.4 },
  { id: "approach", duration: 2.2 },
  { id: "ready", duration: 0, pauseAtStart: true },
  { id: "settle", duration: 3.3 },
];
export const BOOT_MARKERS: Readonly<Record<string, number>> = (() => {
  let at = 0;
  return Object.fromEntries(
    BOOT_PHASES.map((p) => {
      const start = at;
      at += p.duration;
      return [p.id, start];
    }),
  );
})();
const m = BOOT_MARKERS;
export const BOOT_AUDIO: readonly StoryAudioTrack[] = [
  {
    id: "landing",
    src: "/audio/bgm_landing.m4a",
    at: 0,
    until: 10.78,
    srcStart: 44,
    loop: true,
    fadeIn: 2.5,
    kind: "music",
  },
  ...[3.8, 6.6, 9].map((at, i) => ({
    id: `drop${i}`,
    src: "/audio/sfx/glitch_023-ed1184.m4a",
    at,
    until: at + 0.8,
    gain: 0.9,
    kind: "music" as const,
  })),
  {
    id: "glass",
    src: "/audio/cold-open/glass-break.m4a",
    at: 10.78,
    until: 16,
    kind: "music",
  },
  {
    id: "water",
    src: "/audio/cold-open/water-whoosh.m4a",
    at: m.surface,
    until: m.surface + 6,
    kind: "music",
  },
  {
    id: "bubbles",
    src: "/audio/cold-open/bubbles-underwater.m4a",
    at: m.surface + 1.76,
    until: m.push,
    kind: "music",
  },
  {
    id: "dive",
    src: "/audio/cold-open/diving-ambience.m4a",
    at: m.surface + 5.4,
    until: m.draw,
    fadeIn: 1,
    fadeOut: 3,
    kind: "music",
  },
  {
    id: "glyph",
    src: "/audio/cold-open/shinny-loop.m4a",
    at: m.draw - 0.02,
    until: m.draw + 5.23,
    gain: 0.5,
    fadeIn: 0.4,
    fadeOut: 1.3,
    kind: "music",
  },
  {
    id: "morph",
    src: "/audio/cold-open/ring-whoosh.m4a",
    at: m.morph + 0.72,
    until: m.reveal,
    kind: "music",
  },
];
const clamp = (n: number) => Math.max(0, Math.min(1, n));
const smooth = (n: number) => {
  const t = clamp(n);
  return t * t * (3 - 2 * t);
};
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const progress = (t: number, start: number, duration: number) =>
  clamp((t - start) / duration);
const baseline = new NoriSceneStore().snapshot();
const cameraObject = new PerspectiveCamera();
cameraObject.rotation.order = "YXZ";
function divePosition(t: number) {
  const seconds = Math.max(0, t - m.surface),
    arc = (smooth((t - m.surface - 1.6) / (15.1 - 1.6)) * Math.PI) / 2;
  return new Vector3(
    0,
    89.5998 + (1.1 - 89.5998) * Math.sin(arc),
    51 -
      12 * (1 - Math.exp(-seconds / 0.45)) +
      (13.5 - 51 + 12) * (1 - Math.cos(arc)),
  );
}
export function bootScene(state: StoryClockState): NoriSceneState {
  const t = state.time;
  const out: NoriSceneState = {
    ...baseline,
    active: true,
    chatMode: "hidden",
    bgm: "silent",
    lerp: 1,
    noriSleep: true,
    eyeOpen: 0,
    darkness: 0.04,
    plankton: 0.18,
    fogNear: 16,
    fogFar: 80,
    coldOpen: {
      ocean: t >= 12,
      oceanFade: 1,
      oceanDepth: 0,
      oceanGodray: 0.8,
      oceanEdge: 0,
      glyphDraw: 0,
      glyphGlow: 0,
      morph: 0,
      noriForm: 0,
      noriWash: 0,
    },
  };
  const cold = out.coldOpen!;
  cold.oceanDepth = 0.06 * progress(t, m.surface, 3.6);
  if (t >= m.descend) {
    const p = progress(t, m.descend, 8.5);
    cold.oceanDepth = mix(0.06, 0.9, p * p * p);
    cold.oceanGodray = mix(0.8, 0.1, p * p * p);
    out.darkness = mix(0.04, 0.46, p * p);
    out.plankton = mix(0.18, 1.35, 1 - (1 - p) ** 2);
    out.fogFar = mix(80, 78, p);
  }
  if (t >= m.push) {
    const p = progress(t, m.push, 3);
    cold.oceanDepth = mix(0.9, 0.74, 1 - (1 - p) ** 2);
    out.darkness = mix(0.46, 0.24, 1 - (1 - p) ** 2);
    out.plankton = mix(1.35, 0.95, 1 - (1 - p) ** 2);
    cold.oceanGodray = mix(0.1, 0.08, p);
    out.fogFar = mix(78, 210, 1 - (1 - p) ** 3);
  }
  cold.glyphDraw = smooth(progress(t, m.draw, 4.5));
  cold.glyphGlow = 0.5 * progress(t, m.draw + 0.45, 4.05) ** 2;
  if (t >= m.morph) {
    cold.glyphGlow = mix(0.5, 1, progress(t, m.morph, 3.36) ** 3);
    cold.morph = smooth(progress(t, m.morph, 4.8));
    cold.noriWash = 1 - (1 - progress(t, m.morph, 1.68)) ** 2;
  }
  if (t >= m.reveal) {
    cold.noriWash = 1 - smooth(progress(t, m.reveal, 2.4));
    cold.noriForm = progress(t, m.reveal, 0.96) ** 2;
    out.noriDim = 2.8 * progress(t, m.reveal, 1.2) ** 2;
    out.noriReveal = 0;
  }
  let position: Vector3, look: Vector3, fov: number;
  if (t <= m.draw) {
    position = divePosition(t);
    look = position
      .clone()
      .add(new Vector3(0, -0.003017264, -0.99999545).multiplyScalar(40));
    look.lerp(
      new Vector3(0, 0, -1),
      smooth(smooth((t - (m.draw - 3.5)) / 3.5)),
    );
    fov = mix(22.2753333373, 60, smooth((t - m.descend) / 8.5));
    cold.oceanEdge = Math.min(
      3.5,
      divePosition(t + 0.05).distanceTo(divePosition(t - 0.05)) * 1.3,
    );
  } else {
    const arrive = { p: [0, 1.1, 13.5], l: [0, 0, -1], f: 60 },
      formed = { p: [0, 0.8, 9.2], l: [0, 0.4, 0], f: 52 },
      face = { p: [0, 1.75, 7.4], l: [0, 1.55, 0], f: 15 },
      rest = { p: [0, 0, 7.4], l: [0, 0.05, 0], f: 60 };
    let from = arrive,
      to = formed,
      p = smooth((t - (m.morph - 0.4)) / 5.2);
    if (t >= m.blobHold) {
      from = formed;
      to = face;
      p = smooth((t - m.approach) / 2.2);
    }
    if (t >= m.ready) {
      from = face;
      to = rest;
      p = smooth((t - m.ready) / 2.8);
    }
    position = new Vector3(...(from.p as [number, number, number])).lerp(
      new Vector3(...(to.p as [number, number, number])),
      p,
    );
    look = new Vector3(...(from.l as [number, number, number])).lerp(
      new Vector3(...(to.l as [number, number, number])),
      p,
    );
    fov = mix(from.f, to.f, p);
  }
  cameraObject.position.copy(position);
  cameraObject.up.set(0, 1, 0);
  cameraObject.lookAt(look);
  out.camera = { x: position.x, y: position.y, z: position.z };
  out.cameraRot = {
    x: cameraObject.rotation.x,
    y: cameraObject.rotation.y,
    z: cameraObject.rotation.z,
  };
  out.fov = fov;
  out.cameraFar = mix(19, 170, smooth((t - m.surface - 1) / 14.1));
  if (t > m.ready) {
    const age = t - m.ready - 0.3,
      p = progress(age, 0, 2.1);
    out.noriSleep = age < 0;
    out.eyeOpen = 1 - (1 - progress(age, 0, 1.3)) ** 3;
    out.darkness = 0.24 * (1 - p) ** 3;
    cold.oceanDepth = mix(0.74, 0.42, 1 - (1 - p) ** 3);
    cold.oceanGodray = 0.08 * (1 - p) ** 3;
    out.fogNear = mix(16, 20, 1 - (1 - p) ** 3);
    out.fogFar = mix(210, 220, 1 - (1 - p) ** 3);
    out.noriReveal = smooth(progress(age, 0.25, 1.9));
    out.plankton = 0.95 * (1 - smooth(progress(t, m.ready + 0.4, 2.6)));
    cold.oceanFade = 1 - smooth(progress(age, 0, 2.5));
    out.burst =
      age < 0
        ? 0
        : age < 0.18
          ? age / 0.18
          : age < 3.1
            ? 1
            : 1 - progress(age, 3.1, 0.5);
    out.burstAge = Math.max(0, age);
    if (age >= 2.15) out.noriDim = 0;
    if (t >= m.ready + 2.8) {
      out.camera = null;
      out.cameraRot = null;
      out.fov = null;
      out.cameraFar = null;
    }
  }
  return out;
}
