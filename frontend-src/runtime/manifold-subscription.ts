import type { ArtifactType } from "../services/artifacts";
import type { ArcadeServerMessage } from "./protocol";
import type { WorldStore } from "./world-store";

function onlyTouchesVariables(patches: unknown): boolean {
  return (
    Array.isArray(patches) &&
    patches.length > 0 &&
    patches.every((patch) => {
      const path = (patch as { path?: unknown } | null)?.path;
      return typeof path === "string" && (path === "/variables" || path.startsWith("/variables/"));
    })
  );
}

/**
 * Idle compute is synced into the manifold every 500 ms (`idle.sync`). That
 * commit only rewrites `/variables`: facts and artifacts cannot change through
 * it (threshold recoveries arrive as a separate fact commit), so it must not
 * make every artifact consumer reload twice per second.
 */
function isIdleSyncRevision(message: ArcadeServerMessage): boolean {
  if (message.type !== "runtime_transition" || message.cartridgeId !== "manifold.web") return false;
  const transition = message.transition as { cmd?: { type?: unknown }; patches?: unknown };
  return transition.cmd?.type === "idle.sync" && onlyTouchesVariables(transition.patches);
}

/** Reports whether the world or the manifold head moved since the previous call. */
function revisionTracker(world: WorldStore): () => boolean {
  const revision = () => {
    const state = world.snapshot();
    return `${state.worldId ?? ""}:${world.runtime("manifold.web")?.headVersion ?? -1}`;
  };
  let previous = revision();
  return () => {
    const next = revision();
    if (next === previous) return false;
    previous = next;
    return true;
  };
}

/** Artifact RPC responses do not invalidate their own queries. */
export function subscribeManifoldChanges(
  world: WorldStore,
  listener: () => void,
): () => void {
  const advanced = revisionTracker(world);
  return world.subscribe((_state, message) => {
    if (advanced() && !isIdleSyncRevision(message)) listener();
  });
}

/** `"all"`: any artifact type may have changed. */
type ArtifactInvalidation = "all" | ReadonlySet<string>;

/** `changedArtifactTypes` hint of a `manifold.facts.changed` event; absent means unknown. */
function hintedTypes(source: unknown): readonly string[] | null {
  const types = (source as { changedArtifactTypes?: unknown } | null | undefined)?.changedArtifactTypes;
  return Array.isArray(types) && types.length > 0 && types.every((type) => typeof type === "string")
    ? types
    : null;
}

function transitionInvalidation(transition: unknown): ArtifactInvalidation | null {
  const { events, patches } = (transition ?? {}) as { events?: unknown; patches?: unknown };
  const types = new Set<string>();
  let factEvent = false;
  for (const event of Array.isArray(events) ? events : []) {
    const type = (event as { type?: unknown } | null)?.type;
    if (type === "manifold.facts.changed") {
      const hint = hintedTypes(event);
      if (!hint) return "all";
      for (const name of hint) types.add(name);
    } else if (type === "factEmitted" || type === "factRetracted" || type === "artifactUnlocked") {
      factEvent = true;
    }
  }
  if (types.size > 0) return types;
  // Only a commit proven to rewrite nothing but `/variables` (chip scans, Idle sync) leaves artifacts alone.
  return factEvent || !onlyTouchesVariables(patches) ? "all" : null;
}

/** A moved manifold head: a fact commit hints its types, a world join/leave or re-mount replaces everything. */
function revisionInvalidation(message: ArcadeServerMessage): ArtifactInvalidation | null {
  if (message.type !== "runtime_transition" || message.cartridgeId !== "manifold.web") return "all";
  return transitionInvalidation(message.transition);
}

/** Events that carry an invalidation without moving the manifold head. */
function eventInvalidation(message: ArcadeServerMessage): ArtifactInvalidation | null {
  if (message.type !== "event") return null;
  if (message.channel === "manifold.artifacts.invalidated") return "all";
  if (message.channel === "sites.envelopes.changed") return new Set(["browser_page"]);
  if (message.channel !== "manifold.facts.changed") return null;
  const hint = hintedTypes(message.payload);
  return hint ? new Set(hint) : "all";
}

export function subscribeArtifactInvalidations(
  world: WorldStore,
  listener: (invalidation: ArtifactInvalidation) => void,
): () => void {
  const advanced = revisionTracker(world);
  return world.subscribe((_state, message) => {
    const invalidation = advanced() ? revisionInvalidation(message) : eventInvalidation(message);
    if (invalidation) listener(invalidation);
  });
}

/** Fixed-window coalescing: the first call arms a timer and later calls inside the window are absorbed. */
export function coalesceListener(
  listener: () => void,
  windowMs: number,
): (() => void) & { cancel(): void } {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const schedule = () => {
    timer ??= setTimeout(() => {
      timer = undefined;
      listener();
    }, windowMs);
  };
  return Object.assign(schedule, {
    cancel() {
      clearTimeout(timer);
      timer = undefined;
    },
  });
}

/** Commits arrive in bursts (a story tick plus its follow-ups): one reload per window. */
const ARTIFACT_COALESCE_MS = 50;

/**
 * Artifact consumers reload only when their types may have changed. The server
 * hints the affected types on `manifold.facts.changed` (`mail.*`, `file.*` and
 * `recover.*`, `signal.*`), but a fact without a hint still gates artifacts
 * (`qfr.downloaded` reveals a file, `daniel.deadman.delivered` a Signal
 * message), so an unhinted fact, a world change and `manifold.artifacts.invalidated`
 * count as every type. Commits that only rewrite `/variables` change none.
 */
export function subscribeArtifactTypes(
  world: WorldStore,
  types: readonly ArtifactType[],
  listener: () => void,
): () => void {
  const notify = coalesceListener(listener, ARTIFACT_COALESCE_MS);
  const release = subscribeArtifactInvalidations(world, (invalidation) => {
    if (invalidation === "all" || types.some((type) => invalidation.has(type))) notify();
  });
  return () => {
    release();
    notify.cancel();
  };
}

/**
 * One load shared by every consumer of the same artifact types. A single
 * coalesced subscription drops the in-flight request and then notifies all
 * listeners, so their reloads for one change share one `load()`; a request
 * started before the change is never reused after it.
 */
export function createArtifactLoader<T>(
  world: WorldStore,
  types: readonly ArtifactType[],
  load: () => Promise<T>,
) {
  const listeners = new Set<() => void>();
  let inflight: Promise<T> | null = null;
  let release: (() => void) | undefined;
  return {
    load(): Promise<T> {
      if (inflight) return inflight;
      const request = (inflight = load());
      const settled = () => {
        if (inflight === request) inflight = null;
      };
      request.then(settled, settled);
      return request;
    },
    subscribe(listener: () => void): () => void {
      listeners.add(listener);
      release ??= subscribeArtifactTypes(world, types, () => {
        inflight = null;
        for (const notify of [...listeners]) notify();
      });
      return () => {
        listeners.delete(listener);
        if (listeners.size > 0) return;
        release?.();
        release = undefined;
      };
    },
  };
}
