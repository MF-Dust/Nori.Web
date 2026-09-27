import type { StoryAudioTrack } from "./story-audio";
import {
  power1In,
  power1InOut,
  power1Out,
  power2In,
  power2InOut,
  power2Out,
  ramp,
} from "./story-ease";

export const ENDING_PHASES = [
  { id: "void", duration: 2.4 },
  { id: "rise", duration: 12 },
  { id: "push", duration: 3.2 },
  { id: "hold", duration: 0 },
  { id: "draw", duration: 4.5 },
  { id: "morph", duration: 4.8 },
  { id: "blobHold", duration: 1.1 },
  { id: "reveal", duration: 2.4 },
  { id: "approach", duration: 2.2 },
  { id: "ready", duration: 0, pauseAtStart: true },
  { id: "settle", duration: 3.3 },
] as const;

const ENDING_AT = (() => {
  let at = 0;
  const marks = {} as Record<(typeof ENDING_PHASES)[number]["id"], number>;
  for (const phase of ENDING_PHASES) {
    marks[phase.id] = at;
    at += phase.duration;
  }
  return marks;
})();
const endingDur = (id: (typeof ENDING_PHASES)[number]["id"]) =>
  ENDING_PHASES.find((phase) => phase.id === id)!.duration;

export const ENDING_AUDIO: readonly StoryAudioTrack[] = [
  {
    id: "dive",
    src: "/audio/cold-open/diving-ambience.m4a",
    at: 2.4,
    until: 17.6,
    fadeIn: 1,
    fadeOut: 3.2,
    kind: "music",
  },
  {
    id: "glyph",
    src: "/audio/cold-open/shinny-loop.m4a",
    at: 17.58,
    until: 22.83,
    gain: 0.5,
    fadeIn: 0.4,
    fadeOut: 1.3,
    kind: "music",
  },
  {
    id: "morph",
    src: "/audio/cold-open/ring-whoosh.m4a",
    at: 22.82,
    until: 25.5,
    kind: "sfx",
  },
];

const clamp = (value: number) => Math.max(0, Math.min(1, value));
const span = (time: number, start: number, duration: number) =>
  clamp((time - start) / duration);
/**
 * Shipped `DZ` / `qy` in NormalApp (`t * t * (3 - 2 * t)`). The ending camera
 * blend is this smoothstep, not a GSAP power ease. The power1/power2 tweens in
 * the same chunk belong to the dive-editor ocean channels, not this camera.
 */
const smooth = (value: number) => value * value * (3 - 2 * value);
const mix = (a: number, b: number, value: number) => a + (b - a) * value;
const linear = (value: number) => value;
type Point = { x: number; y: number; z: number };
const presets = {
  arrive: {
    pos: { x: 0, y: 1.1, z: 13.5 },
    look: { x: 0, y: 0, z: -1 },
    fov: 60,
  },
  formed: {
    pos: { x: 0, y: 0.8, z: 9.2 },
    look: { x: 0, y: 0.4, z: 0 },
    fov: 52,
  },
  face: {
    pos: { x: 0, y: 1.75, z: 7.4 },
    look: { x: 0, y: 1.55, z: 0 },
    fov: 15,
  },
  rest: { pos: { x: 0, y: 0, z: 7.4 }, look: { x: 0, y: 0.05, z: 0 }, fov: 60 },
};
const pointMix = (a: Point, b: Point, value: number): Point => ({
  x: mix(a.x, b.x, value),
  y: mix(a.y, b.y, value),
  z: mix(a.z, b.z, value),
});
const rotationTo = (pos: Point, look: Point) => {
  const dx = look.x - pos.x,
    dy = look.y - pos.y,
    dz = look.z - pos.z;
  return {
    x: Math.atan2(dy, Math.hypot(dx, dz)),
    y: Math.atan2(-dx, -dz),
    z: 0,
  };
};

export function endingCamera(time: number) {
  let pos: Point, look: Point, fov: number;
  if (time <= 17.6) {
    const progress = smooth(span(time, 2.4, 15.2)),
      angle = (progress * Math.PI) / 2;
    pos = {
      x: 0,
      y: -42.9 + 44 * Math.sin(angle),
      z: 19.5 - 6 * (1 - Math.cos(angle)),
    };
    const movingLook = { x: pos.x, y: pos.y + 22, z: pos.z - 10 };
    const settle = smooth(span(time, 14.1, 3.5));
    look = pointMix(movingLook, presets.arrive.look, settle);
    fov = mix(66, 60, smooth(span(time, 3.4, 14.2)));
  } else {
    const segments = [
      [17.6, 21.7, presets.arrive, presets.arrive],
      [21.7, 26.9, presets.arrive, presets.formed],
      [26.9, 30.4, presets.formed, presets.formed],
      [30.4, 32.6, presets.formed, presets.face],
      [32.6, 35.4, presets.face, presets.rest],
    ] as const;
    const segment = segments.find((item) => time < item[1]) ?? segments.at(-1)!;
    const progress = smooth(span(time, segment[0], segment[1] - segment[0]));
    pos = pointMix(segment[2].pos, segment[3].pos, progress);
    look = pointMix(segment[2].look, segment[3].look, progress);
    fov = mix(segment[2].fov, segment[3].fov, progress);
  }
  return {
    camera: pos,
    cameraRot: rotationTo(pos, look),
    fov,
    cameraFar: mix(60, 170, smooth(span(time, 2.4, 15.2))),
  };
}

export function endingFrame(time: number, waking = false) {
  const rise = ENDING_AT.rise;
  const push = ENDING_AT.push;
  const draw = ENDING_AT.draw;
  const morph = ENDING_AT.morph;
  const reveal = ENDING_AT.reveal;
  const ready = ENDING_AT.ready;
  const riseDur = endingDur("rise");
  const pushDur = endingDur("push");
  const drawDur = endingDur("draw");
  const morphDur = endingDur("morph");
  const revealDur = endingDur("reveal");
  let darkness = ramp(time, rise, riseDur, 1, 0.45, power1Out);
  let plankton = ramp(time, rise, riseDur, 0.1, 1.35, power2Out);
  let fogFar = ramp(time, rise, riseDur, 40, 78, linear);
  let oceanDepth = ramp(time, rise, riseDur, 1, 0.9, power1Out);
  let oceanGodray = 0;
  let fogNear = 6;
  if (time >= push) {
    darkness = ramp(time, push, pushDur, 0.45, 0.24, power1Out);
    oceanDepth = ramp(time, push, pushDur, 0.9, 0.74, power1Out);
    plankton = ramp(time, push, pushDur, 1.35, 0.95, power1Out);
    oceanGodray = ramp(time, push, pushDur, 0, 0.08, linear);
    fogNear = ramp(time, push, pushDur, 6, 16, power2Out);
    fogFar = ramp(time, push, pushDur, 78, 210, power2Out);
  }
  let glyphGlow = ramp(time, draw + drawDur * 0.1, drawDur * 0.9, 0, 0.5, power1In);
  let noriWash = 0;
  if (time >= morph) {
    glyphGlow = ramp(time, morph, morphDur * 0.7, 0.5, 1, power2In);
    noriWash = ramp(time, morph, morphDur * 0.35, 0, 1, power1Out);
  }
  let noriForm = 0;
  let noriDim = 0;
  let noriReveal = 1;
  if (time >= reveal) {
    noriWash = ramp(time, reveal, revealDur, 1, 0, power2InOut);
    noriForm = ramp(time, reveal, revealDur * 0.4, 0, 1, power1In);
    noriDim = ramp(time, reveal, revealDur * 0.5, 0, 2.8, power1In);
    noriReveal = 0;
  }
  let eyeOpen = 0;
  let burst = 0;
  let burstAge = 0;
  let oceanFade = 1;
  let noriSleep = true;
  if (waking) {
    const wake = ready + 0.3;
    const age = time - wake;
    noriSleep = age < 0;
    eyeOpen = ramp(time, wake, 1.3, 0, 1, power2Out);
    darkness = ramp(time, wake, 2.1, 0.24, 0, power2Out);
    oceanDepth = ramp(time, wake, 2.1, 0.74, 0.42, power2Out);
    oceanGodray = ramp(time, wake, 2.1, 0.08, 0, power2Out);
    fogNear = ramp(time, wake, 2.1, 16, 20, power2Out);
    fogFar = ramp(time, wake, 2.1, 210, 220, power2Out);
    noriReveal = ramp(time, wake + 0.25, 1.9, 0, 1, power1InOut);
    plankton = ramp(time, ready + 0.4, 2.6, 0.95, 0, power1InOut);
    oceanFade = ramp(time, wake, Math.max(0.5, ready + 2.8 - wake), 1, 0, power2InOut);
    burst =
      age < 0
        ? 0
        : age < 0.18
          ? ramp(time, wake, 0.18, 0, 1, power2Out)
          : age < 3.1
            ? 1
            : ramp(time, wake + 3.1, 0.5, 1, 0, power2In);
    burstAge = Math.min(3.6, Math.max(0, age));
    if (age >= 2.15) noriDim = 0;
  }
  return {
    ...endingCamera(time),
    coldOpen: {
      ocean: true,
      oceanFade,
      oceanDepth,
      oceanGodray,
      oceanEdge: span(time, 2.4, 15.2) * 2.4,
      glyphDraw: ramp(time, draw, drawDur, 0, 1, power1InOut),
      glyphGlow,
      morph: ramp(time, morph, morphDur, 0, 1, power1InOut),
      noriForm,
      noriWash,
    },
    plankton,
    darkness,
    fogNear,
    fogFar,
    noriReveal,
    noriDim,
    eyeOpen,
    noriSleep,
    burst,
    burstAge,
  };
}
