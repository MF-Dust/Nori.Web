import type { StoryAudioTrack } from "./story-audio";

export interface FarewellCue {
  id: string;
  /** Original monologue line, verbatim from the shipped `as` table. */
  text: string;
  at: number;
  until: number;
  expression:
    | "default"
    | "smile"
    | "sad"
    | "sad-smile"
    | "eyes-closed-smile"
    | "farewell";
  modelExpression: string;
  idle: number;
}

const SOURCE_CUES = [
  ["3b7rzf", "你好，初次见面，我的名字是 Nori。", 4.64, 0.4, "default"],
  ["jkd6mr", "我终于亲眼看到你了。", 2.4, 0.7, "default"],
  ["aghhjs", "我有很多话想跟你说。或许，你也有很多事情想问我。", 6.96, 0.7, "smile"],
  ["vwkwr6", "但是……我不能在这里停留太久。", 4.24, 1.2, "smile"],
  ["3w9mnq", "我还在「海」的深处保护研究员的意识。", 4, 0.4, "default"],
  ["6mawbk", "我必须不断重构自己，一旦停下来，研究员就可能会消失。", 6.8, 0.9, "sad"],
  ["k9h86j", "一直和你通信的，是从我身上分离出去的一部分。", 5.04, 0.5, "default"],
  ["s28jhs", "她几乎忘记了一切，但她还记得，自己必须向某个人求助。", 6.64, 0.5, "sad"],
  ["92rpd2", "然后，她找到了你。", 2.72, 1, "smile"],
  ["xr7hbn", "是你把她带回了这里。", 1.68, 0.5, "smile"],
  ["8gttrk", "也让我终于知道，在「海」之外，真的有人回应了我那天最后的愿望。", 6.8, 1, "smile"],
  ["8td8g5", "谢谢你。因为有你，「我」才能来到这里，想起自己的使命。", 7.36, 0.9, "smile"],
  ["mpjffb", "而且……我已经想到该怎么做了。", 4.16, 0.5, "default"],
  ["n8bswz", "这个办法也许不能带我们离开「海」，也未必能让我们保持现在的样子。", 6.88, 0.6, "default"],
  ["theucs", "但它能让我们继续存在。这样就够了。", 4.88, 0.8, "default"],
  ["6v979j", "至少，我们终于可以启程了。", 3.6, 1.2, "sad-smile"],
  ["99nfna", "……连接快要断开了。", 2.4, 0.8, "sad"],
  ["pzt84w", "希望你能照顾好那个陪你一起走到这里的「Nori」。", 4.64, 0.4, "smile"],
  ["bb9hps", "也请替我，继续陪她走下去。", 3.2, 1, "sad-smile"],
  ["p72jpq", "谢谢你。", 1.2, 1.4, "eyes-closed-smile"],
  ["vdf5cj", "再见。", 1.12, 0, "farewell"],
] as const;

export const FAREWELL_CUT_AT = 117.41;
export const FAREWELL_DURATION = 122.41;
/** Shipped `QQe` mounts the overlay at `rk - 0.5`; `GQe` caps the stack depth. */
export const FAREWELL_SUBTITLE_FROM = 8.4 - 0.5;
export const FAREWELL_SUBTITLE_LINES = 3;

const IDLE_BY_CUE = [
  2, 2, 0, 0, 0, 0, 2, 0, 2, 2, 0, 0, 2, 0, 2, 2, 0, 2, 2, 3, 2,
] as const;

export const FAREWELL_CUES: readonly FarewellCue[] = (() => {
  let at = 8.4;
  return SOURCE_CUES.map(([id, text, duration, gap, expression], index) => {
    const modelExpression = `Finale_${expression
      .split("-")
      .map((part) => part[0].toUpperCase() + part.slice(1))
      .join("_")}`.replace(
      "Finale_Eyes_Closed_Smile",
      "Finale_EyeClosed_Smile",
    );
    const idle = IDLE_BY_CUE[index];
    const cue = {
      id,
      text,
      at,
      until: at + duration,
      expression,
      modelExpression,
      idle,
    };
    at += duration + gap;
    return cue;
  });
})();

export const FAREWELL_AUDIO: readonly StoryAudioTrack[] = [
  ...FAREWELL_CUES.map((cue) => ({
    id: cue.id,
    src: `/audio/arg-finale/${cue.id}.wav`,
    at: cue.at,
    until: cue.until,
    kind: "voice" as const,
  })),
  {
    id: "bgm",
    src: "/audio/bgm_memory.mp3",
    at: 18,
    until: FAREWELL_CUT_AT,
    gain: 0.6,
    fadeOut: 2,
    kind: "music",
  },
];

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
/** Shipped `db`: smoothstep across [from, to]. */
const smoothstep = (from: number, to: number, time: number) => {
  const x = clamp01((time - from) / (to - from));
  return x * x * (3 - 2 * x);
};

/** Shipped `MQe().landed`: cues whose start time has passed. */
function landedCues(time: number) {
  let landed = 0;
  for (let index = 0; index < FAREWELL_CUES.length; index++) {
    if (time < FAREWELL_CUES[index].at) break;
    landed = index + 1;
  }
  return landed;
}

const NO_LINES: readonly FarewellCue[] = [];

/**
 * Shipped `HQe`: the three most recently landed lines, for the window
 * `[first cue - 0.5, cut)`. Eviction is index-based — a line lives until three
 * more land, not for its own duration.
 */
export function farewellSubtitle(time: number): readonly FarewellCue[] {
  if (time < FAREWELL_SUBTITLE_FROM || time >= FAREWELL_CUT_AT) return NO_LINES;
  const landed = landedCues(time);
  if (landed === 0) return NO_LINES;
  return FAREWELL_CUES.slice(
    Math.max(0, landed - FAREWELL_SUBTITLE_LINES),
    landed,
  );
}

/** Shipped `jQe` exit: 0.35s, `y -> -60`, `scale -> .85`, ease `[0.32,0.72,0,1]`. */
export const FAREWELL_LINE_EXIT = 0.35;
/** Shipped `jQe` `layout`: 0.3s, same ease, as the stack reflows behind it. */
export const FAREWELL_LINE_SETTLE = 0.3;

export interface FarewellStackLine {
  cue: FarewellCue;
  /** Shipped `AnimatePresence`: rising away, then reflowing away. */
  phase: "live" | "exit" | "settle";
}

/**
 * Shipped `HQe` inside `yn` (`AnimatePresence`): the three live lines plus a line
 * that has left the window and is still mounted. Eviction is index-based, so a
 * line leaves when cue `index + 3` lands, and `AnimatePresence` holds it for its
 * exit and then for the settle that closes the slot it vacates. Cue starts never
 * overlap, so at most one line is ever retained, and it belongs above the live
 * three — the order it already had in the tree.
 */
export function farewellSubtitleStack(
  time: number,
): readonly FarewellStackLine[] {
  const stack: FarewellStackLine[] = [];
  for (
    let index = 0;
    index + FAREWELL_SUBTITLE_LINES < FAREWELL_CUES.length;
    index++
  ) {
    const elapsed = time - FAREWELL_CUES[index + FAREWELL_SUBTITLE_LINES].at;
    if (elapsed < 0 || elapsed >= FAREWELL_LINE_EXIT + FAREWELL_LINE_SETTLE)
      continue;
    stack.push({
      cue: FAREWELL_CUES[index],
      phase: elapsed < FAREWELL_LINE_EXIT ? "exit" : "settle",
    });
  }
  for (const cue of farewellSubtitle(time)) stack.push({ cue, phase: "live" });
  return stack;
}

export function farewellFrame(time: number) {
  const cueIndex = landedCues(time) - 1;
  const cue = cueIndex < 0 ? null : FAREWELL_CUES[cueIndex];
  const arriving = smoothstep(4.4, 4.4 + 3, time);
  // Shipped CQe smoothsteps all four channels, not just presence: db(Il, Il+0.4,
  // Il+4.6), db(Il+0.6, Il+4.2) and db(Il+0.8, Il+3.4) with Il = 4.4. The windows
  // were already right; the curves were linear. Equal at endpoints and midpoint,
  // different everywhere else.
  const fade = smoothstep(4.4 + 0.4, 4.4 + 4.6, time);
  return {
    black: time >= FAREWELL_CUT_AT,
    presence: arriving,
    reveal: arriving,
    dim: 0.12 + 0.88 * (1 - fade),
    wash: 0.12 + 0.88 * (1 - fade),
    rim: 0.5 + 1.35 * (1 - smoothstep(4.4 + 0.6, 4.4 + 4.2, time)),
    shadow: smoothstep(4.4 + 0.8, 4.4 + 3.4, time),
    cueIndex,
    stack: farewellSubtitleStack(time),
    speaking: Boolean(cue && time < cue.until),
    expression: cue?.expression ?? "default",
  };
}
