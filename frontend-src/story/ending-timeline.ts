import type { StoryAudioTrack } from "./story-audio";

export const ENDING_PHASES = [
  { id: "void", duration: 2.4 }, { id: "rise", duration: 12 },
  { id: "push", duration: 3.2 }, { id: "hold", duration: 0 },
  { id: "draw", duration: 4.5 }, { id: "morph", duration: 4.8 },
  { id: "blobHold", duration: 1.1 }, { id: "reveal", duration: 2.4 },
  { id: "approach", duration: 2.2 },
  { id: "ready", duration: 0, pauseAtStart: true },
  { id: "settle", duration: 3.3 },
] as const;

export const ENDING_AUDIO: readonly StoryAudioTrack[] = [
  { id: "dive", src: "/audio/cold-open/diving-ambience.m4a", at: 2.4,
    until: 17.6, fadeIn: 1, fadeOut: 3.2, kind: "music" },
  { id: "glyph", src: "/audio/cold-open/shinny-loop.m4a", at: 17.58,
    until: 22.83, gain: 0.5, fadeIn: 0.4, fadeOut: 1.3, kind: "music" },
  { id: "morph", src: "/audio/cold-open/ring-whoosh.m4a", at: 22.82,
    until: 25.5, kind: "sfx" },
];

const clamp = (value: number) => Math.max(0, Math.min(1, value));
const span = (time: number, start: number, duration: number) => clamp((time - start) / duration);

export function endingFrame(time: number, waking = false) {
  const rise = span(time, 2.4, 15.2);
  const draw = span(time, 17.6, 4.5);
  const morph = span(time, 22.1, 4.8);
  const reveal = span(time, 28, 2.4);
  const settle = waking ? span(time, 32.6, 2.8) : 0;
  return {
    coldOpen: {
      ocean: true, oceanFade: 1 - settle, oceanDepth: 1 - rise * 0.26 - settle * 0.32,
      oceanGodray: rise * 0.08, oceanEdge: rise * 2.4,
      glyphDraw: draw, glyphGlow: draw * (1 - morph * 0.35), morph,
      noriForm: reveal, noriWash: 1 - reveal,
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
