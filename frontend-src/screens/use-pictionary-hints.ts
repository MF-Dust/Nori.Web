import { useEffect, useMemo, useRef, useState } from "react";
import { advancePictionaryHint, createPictionaryHint, pictionaryHintDelay, pictionaryHintText, pictionaryHintTiming, type PictionaryHint, type PinyinSyllable } from "../apps/pictionary-hints";

export function usePictionaryHints(options: {
  roundId?: string; word?: string; active: boolean; guesser: boolean;
  duration: number; locale: string; pinyin?: readonly PinyinSyllable[];
  playSound?: (cue: string) => void;
}) {
  const { roundId, word, active, guesser, duration, locale } = options;
  const playSound = useRef(options.playSound); playSound.current = options.playSound;
  // Replicated snapshots allocate fresh arrays even when pinyin has not changed.
  const pinyinKey = JSON.stringify(options.pinyin);
  const initial = useMemo(() => word && guesser ? createPictionaryHint(word, locale, pinyinKey ? JSON.parse(pinyinKey) : undefined) : null,
    [roundId, word, guesser, locale, pinyinKey]);
  const [value, setValue] = useState<{ initial: PictionaryHint; hint: PictionaryHint } | null>(null);
  useEffect(() => {
    if (!active || !initial) return;
    let hint = initial, cancelled = false;
    const startedAt = performance.now();
    setValue({ initial, hint });
    const reveal = () => {
      if (cancelled) return;
      const progress = Math.min(1, (performance.now() - startedAt) / Math.max(1, duration));
      const next = advancePictionaryHint(hint, progress);
      if (next === hint) return;
      hint = next; setValue({ initial, hint });
      playSound.current?.("partygames-pictionary-hint-reveal");
      if (hint.revealed.size < hint.indices.length) timer = setTimeout(reveal, pictionaryHintDelay(hint, progress));
    };
    let timer = setTimeout(reveal, pictionaryHintTiming(initial).initialDelay);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [initial, active, duration]);
  // Never render the previous round's hint during the frame before effect cleanup.
  return initial ? pictionaryHintText(value?.initial === initial ? value.hint : initial) : null;
}
