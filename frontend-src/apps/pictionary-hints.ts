export type PinyinSyllable = readonly [string | null, string];
export interface PictionaryHint {
  locale: "en" | "zh-CN";
  characters: readonly string[];
  pinyin: readonly PinyinSyllable[];
  indices: readonly number[];
  revealed: ReadonlySet<number>;
}
const vowels = new Set("aeiou");
const commonLetters = new Set("tnshrdlcm");
const rareLetters = new Set("jqxzkvy");
const commonInitials = new Set("sh zh j x d b g l m h ch t f n s w y".split(" "));
const rareInitials = new Set("z c r p k".split(" "));
const clamp = (value: number, min = 0, max = 1) => Math.max(min, Math.min(max, value));
const lerp = (from: number, to: number, progress: number) => from + (to - from) * progress;

export function createPictionaryHint(word: string, locale = "en", pinyin?: readonly PinyinSyllable[]): PictionaryHint {
  const characters = word.split("");
  // Some older/local rounds do not include pinyin. Keep their Chinese answer masked.
  const chinese = locale === "zh-CN";
  const syllables = pinyin ?? (chinese ? Array.from(word, () => [null, ""] as const) : []);
  return {
    locale: chinese ? "zh-CN" : "en", characters, pinyin: syllables,
    indices: chinese ? syllables.map((_, index) => index) : characters.flatMap((char, index) => /[a-z]/i.test(char) ? [index] : []),
    revealed: new Set(),
  };
}

export function pictionaryHintText(hint: PictionaryHint): string {
  if (hint.locale === "zh-CN") return hint.pinyin.map(([initial, final], index) =>
    !hint.revealed.has(index) ? "__" : initial === null ? final[0] || "__" : initial + "_",
  ).join(" ");
  return hint.characters.map((char, index) => /[a-z]/i.test(char) && !hint.revealed.has(index) ? "_" : char.toUpperCase()).join(" ").replace(/\s{3,}/g, "  ");
}

export function pictionaryHintTiming(hint: PictionaryHint) {
  const length = hint.indices.length;
  let score = 0;
  let difficulty = 0;
  if (hint.locale === "zh-CN") {
    score += length >= 4 ? 1.5 : length >= 3 ? 1 : length <= 1 ? -.5 : 0;
    if (hint.pinyin.filter(([initial]) => initial === null).length >= 2) score -= .5;
    difficulty = clamp((score + .5) / 3);
  } else if (length) {
    const letters = hint.indices.map(index => hint.characters[index].toLowerCase());
    score += length >= 10 ? 1.5 : length >= 8 ? 1 : length <= 4 ? -.5 : 0;
    const ratio = letters.filter(char => vowels.has(char)).length / length;
    score += ratio < .35 ? 1 : ratio > .55 ? -.5 : 0;
    const rare = letters.filter(char => rareLetters.has(char)).length;
    score += rare >= 2 ? 1 : rare === 1 ? .5 : 0;
    if (new Set(letters).size / length > .8) score += .5;
    difficulty = clamp((score + .5) / 5);
  }
  return {
    difficulty,
    initialDelay: clamp(6000 - 2200 * difficulty, 2500, 6000),
    maxDelay: clamp(10000 - 3500 * difficulty, 3500, 10000),
    minDelay: clamp(2400 - 800 * difficulty, 1200, 2400),
  };
}

/** Reveal common letters first, keeping repeated letters together and the initial until late. */
export function advancePictionaryHint(hint: PictionaryHint, progress: number, random = Math.random): PictionaryHint {
  const remaining = hint.indices.filter(index => !hint.revealed.has(index));
  if (!remaining.length) return hint;
  const p = clamp(progress), first = hint.indices[0];
  const desired = Math.ceil((.1 + .75 * p ** 3) * hint.indices.length);
  const budget = Math.min(remaining.length, clamp(Math.max(p < .75 ? 1 : p < .92 ? 2 : 3, desired - hint.revealed.size), 1, 3));
  const groups = new Map<string, number[]>();
  for (const index of remaining) {
    const key = hint.locale === "zh-CN" ? String(index) : hint.characters[index].toLowerCase();
    groups.set(key, [...(groups.get(key) ?? []), index]);
  }
  const selected = new Set<number>();
  if (p >= .92 && !hint.revealed.has(first)) {
    const key = hint.locale === "zh-CN" ? String(first) : hint.characters[first].toLowerCase();
    groups.get(key)?.forEach(index => selected.add(index));
    groups.delete(key);
  }
  const candidates = [...groups].map(([char, indices]) => {
    let score = indices.includes(first) ? lerp(-100, 40, p * p) : 0;
    if (hint.locale === "zh-CN") {
      const [initial] = hint.pinyin[indices[0]];
      if (initial === null) score += lerp(6, 2, p);
      if (initial && commonInitials.has(initial)) score += lerp(5, 2, p);
      if (initial && rareInitials.has(initial)) score += lerp(-1, 6, p);
    } else {
      if (vowels.has(char)) score += lerp(8, 1.5, p);
      if (commonLetters.has(char)) score += lerp(4, 3, p);
      if (rareLetters.has(char)) score += lerp(-2, 8, p);
      score += (indices.length - 1) * 1.8;
    }
    return { indices, score: score + random() * .5 };
  }).sort((a, b) => b.score - a.score);
  for (const candidate of candidates) {
    if (selected.size >= budget) break;
    candidate.indices.forEach(index => selected.add(index));
  }
  if (p >= .97) remaining.filter(index => !selected.has(index)).slice(0, 3).forEach(index => selected.add(index));
  return { ...hint, revealed: new Set([...hint.revealed, ...selected]) };
}

export function pictionaryHintDelay(hint: PictionaryHint, progress: number): number {
  const { minDelay, maxDelay } = pictionaryHintTiming(hint);
  return lerp(maxDelay, minDelay, clamp(progress) ** 3);
}
