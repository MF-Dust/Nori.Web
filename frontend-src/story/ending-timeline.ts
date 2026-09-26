import type { StoryAudioTrack } from "./story-audio";

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
  const rise = span(time, 2.4, 15.2);
  const draw = span(time, 17.6, 4.5);
  const morph = span(time, 22.1, 4.8);
  const reveal = span(time, 28, 2.4);
  const settle = waking ? span(time, 32.6, 2.8) : 0;
  return {
    ...endingCamera(time),
    coldOpen: {
      ocean: true,
      oceanFade: 1 - settle,
      oceanDepth: 1 - rise * 0.26 - settle * 0.32,
      oceanGodray: rise * 0.08,
      oceanEdge: rise * 2.4,
      glyphDraw: draw,
      glyphGlow: draw * (1 - morph * 0.35),
      morph,
      noriForm: reveal,
      noriWash: 1 - reveal,
    },
    plankton: (0.1 + rise * 1.25) * (1 - settle),
    darkness: (1 - rise * 0.76) * (1 - settle),
    noriReveal: waking ? settle : Math.max(0, 1 - reveal),
    noriDim: waking ? (1 - settle) * 2.8 : reveal * 2.8,
    eyeOpen: waking ? settle : 0,
    noriSleep: !waking,
    burst: waking ? 1 - span(time, 32.9, 3.6) : 0,
    burstAge: waking ? Math.max(0, time - 32.9) : 0,
  };
}
