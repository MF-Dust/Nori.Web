/**
 * Cold-open readiness deadlines for scenes that poll `.nori-stage` from
 * `requestAnimationFrame`.
 *
 * A hidden tab runs neither RAF nor any asset work, so a plain `setTimeout`
 * reports a false asset failure for a scene that is simply not being drawn yet.
 * `visibilitychange` fires before the next frame on return to the tab, so
 * `refresh()` restarts the budget in time; while hidden it is a no-op so
 * background time can never extend it.
 */
export interface ReadinessDeadline {
  /** True once the visible-time budget is spent. */
  expired(now: number): boolean;
  /** Restart the budget. No-op while hidden, so background time never counts. */
  refresh(): void;
}

export function visibleReadinessDeadline(ms: number): ReadinessDeadline {
  let deadline = performance.now() + ms;
  return {
    expired: (now) => now >= deadline,
    refresh: () => {
      if (document.hidden) return;
      deadline = performance.now() + ms;
    },
  };
}
