/** Shipped ChatPanel enter/exit and layout window. The tween does not name a custom cubic. */
export const CHAT_EXIT_MS = 300;
export const CHAT_LAYOUT_MS = 300;
export const CHAT_LAYOUT_EASE = "ease";

/**
 * Keep rows that disappeared until `now + exitMs`, drop ones whose deadline has
 * passed, and append ids that were not in the previous list.
 * A live id replaces an exiting copy. An existing deadline is not extended.
 */
export function retainExiting<T extends { id: string }>(
  previous: readonly (T & { exiting?: number })[],
  next: readonly T[],
  now: number,
  exitMs: number,
): Array<T & { exiting?: number }> {
  const incoming = new Map(next.map((item) => [item.id, item]));
  const retained: Array<T & { exiting?: number }> = [];
  const seen = new Set<string>();
  for (const item of previous) {
    const live = incoming.get(item.id);
    if (live) {
      retained.push(live);
      seen.add(item.id);
      continue;
    }
    const deadline = item.exiting ?? now + exitMs;
    if (deadline <= now) continue;
    retained.push({ ...item, exiting: deadline });
    seen.add(item.id);
  }
  for (const item of next) {
    if (seen.has(item.id)) continue;
    retained.push(item);
    seen.add(item.id);
  }
  return retained;
}
