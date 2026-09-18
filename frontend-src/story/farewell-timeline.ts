import type { StoryAudioTrack } from "./story-audio";

export interface FarewellCue {
  id: string;
  at: number;
  until: number;
  expression: "default" | "smile" | "sad" | "sad-smile" | "eyes-closed-smile" | "farewell";
  modelExpression: string;
  idle: number;
}

const SOURCE_CUES = [
  ["3b7rzf", 4.64, 0.4, "default"], ["jkd6mr", 2.4, 0.7, "default"],
  ["aghhjs", 6.96, 0.7, "smile"], ["vwkwr6", 4.24, 1.2, "smile"],
  ["3w9mnq", 4, 0.4, "default"], ["6mawbk", 6.8, 0.9, "sad"],
  ["k9h86j", 5.04, 0.5, "default"], ["s28jhs", 6.64, 0.5, "sad"],
  ["92rpd2", 2.72, 1, "smile"], ["xr7hbn", 1.68, 0.5, "smile"],
  ["8gttrk", 6.8, 1, "smile"], ["8td8g5", 7.36, 0.9, "smile"],
  ["mpjffb", 4.16, 0.5, "default"], ["n8bswz", 6.88, 0.6, "default"],
  ["theucs", 4.88, 0.8, "default"], ["6v979j", 3.6, 1.2, "sad-smile"],
  ["99nfna", 2.4, 0.8, "sad"], ["pzt84w", 4.64, 0.4, "smile"],
  ["bb9hps", 3.2, 1, "sad-smile"], ["p72jpq", 1.2, 1.4, "eyes-closed-smile"],
  ["vdf5cj", 1.12, 0, "farewell"],
] as const;

export const FAREWELL_CUT_AT = 117.41;
export const FAREWELL_DURATION = 122.41;

const IDLE_BY_CUE = [2, 2, 0, 0, 0, 0, 2, 0, 2, 2, 0, 0, 2, 0, 2, 2, 0, 2, 2, 3, 2] as const;

export const FAREWELL_CUES: readonly FarewellCue[] = (() => {
  let at = 8.4;
  return SOURCE_CUES.map(([id, duration, gap, expression], index) => {
    const modelExpression = `Finale_${expression.split("-").map((part) => part[0].toUpperCase() + part.slice(1)).join("_")}`
      .replace("Finale_Eyes_Closed_Smile", "Finale_EyeClosed_Smile");
    const idle = IDLE_BY_CUE[index];
    const cue = { id, at, until: at + duration, expression, modelExpression, idle };
    at += duration + gap;
    return cue;
  });
})();

export const FAREWELL_AUDIO: readonly StoryAudioTrack[] = [
  ...FAREWELL_CUES.map((cue) => ({
    id: cue.id, src: `/audio/arg-finale/${cue.id}.wav`, at: cue.at,
    until: cue.until, kind: "voice" as const,
  })),
  { id: "bgm", src: "/audio/bgm_memory.mp3", at: 18, until: FAREWELL_CUT_AT,
    gain: 0.6, fadeOut: 2, kind: "music" },
];

export function farewellFrame(time: number) {
  let cueIndex = -1;
  for (let index = 0; index < FAREWELL_CUES.length; index++) {
    if (time < FAREWELL_CUES[index].at) break;
    cueIndex = index;
  }
  const cue = cueIndex < 0 ? null : FAREWELL_CUES[cueIndex];
  const arriving = Math.max(0, Math.min(1, (time - 4.4) / 3));
  const fade = Math.max(0, Math.min(1, (time - 4.8) / 4.2));
  return {
    black: time >= FAREWELL_CUT_AT,
    presence: arriving,
    reveal: arriving,
    dim: 0.12 + 0.88 * (1 - fade),
    wash: 0.12 + 0.88 * (1 - fade),
    rim: 0.5 + 1.35 * (1 - Math.max(0, Math.min(1, (time - 5) / 3.6))),
    shadow: Math.max(0, Math.min(1, (time - 5.2) / 2.6)),
    cueIndex,
    speaking: Boolean(cue && time < cue.until),
    expression: cue?.expression ?? "default",
  };
}
