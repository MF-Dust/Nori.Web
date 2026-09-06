import type { IdleAlignment, IdleRunPresentationState } from "./idle";

export const IDLE_MEMORY_SHOWN_FACT = "arg.memory.shown";
export const IDLE_MANIFOLD_COMPLETE_FACT = "idle.manifold_complete";

export interface IdleManifoldRevealState {
  compute: number;
  currentAlignment: IdleAlignment | null;
  shards: number;
  owned: Readonly<Record<string, number>>;
  activeSkillBuffs: readonly unknown[];
  claimedMementoCount: number;
  /** The shipped store also checks threads; source runtimes without that lane use zero. */
  threads?: number;
  facts: Readonly<Record<string, boolean>>;
}

export interface IdleManifoldRevealResult<T> {
  state: T;
  manifoldRevealApplied: boolean;
  /** Mirrors the shipped syncManifoldReveal() boolean return. */
  revealTriggered: boolean;
}

/** Shipped `oCe`: whether the run is already in the pristine pre-paradigm state. */
export function isIdleManifoldRevealRunPristine(state: IdleManifoldRevealState): boolean {
  return (
    state.compute === 0 &&
    state.currentAlignment === null &&
    (state.threads ?? 0) === 0 &&
    state.claimedMementoCount === 0 &&
    state.activeSkillBuffs.length === 0 &&
    Object.keys(state.owned).length === 0
  );
}

/**
 * Recover shipped `j7`: when the reveal starts from a non-pristine run it uses
 * the normal retraining reset, then restores the pre-reveal Resonance balance
 * and clears alignment. Pending shards are therefore not granted by the reveal.
 */
export function applyIdleManifoldRevealReset<T extends IdleManifoldRevealState>(
  state: T,
  resetForRetraining: (state: T) => T,
): T {
  if (isIdleManifoldRevealRunPristine(state)) return state;
  const reset = resetForRetraining(state);
  return {
    ...reset,
    shards: state.shards,
    currentAlignment: null,
  } as T;
}

/**
 * Exact control flow of shipped `syncManifoldReveal` around `arg.memory.shown`
 * and `idle.manifold_complete`. `revealTriggered` becomes true once on the first
 * memory reveal even when the current run was already pristine.
 */
export function syncIdleManifoldReveal<T extends IdleManifoldRevealState>(
  state: T,
  manifoldRevealApplied: boolean,
  resetForRetraining: (state: T) => T,
): IdleManifoldRevealResult<T> {
  if (!state.facts[IDLE_MEMORY_SHOWN_FACT]) {
    return {
      state,
      manifoldRevealApplied: false,
      revealTriggered: false,
    };
  }

  if (manifoldRevealApplied || state.facts[IDLE_MANIFOLD_COMPLETE_FACT]) {
    return {
      state,
      manifoldRevealApplied: true,
      revealTriggered: false,
    };
  }

  return {
    state: applyIdleManifoldRevealReset(state, resetForRetraining),
    manifoldRevealApplied: true,
    revealTriggered: true,
  };
}

/** Presentation-state adapter for UI parity checks and tests. */
export function idlePresentationManifoldState(
  state: IdleRunPresentationState,
  threads = 0,
): IdleManifoldRevealState {
  return {
    compute: state.compute,
    currentAlignment: state.currentAlignment,
    shards: state.shards,
    owned: state.owned,
    activeSkillBuffs: state.activeSkillBuffs,
    claimedMementoCount: state.claimedMementoCount,
    threads,
    facts: state.facts,
  };
}
