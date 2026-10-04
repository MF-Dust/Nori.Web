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

/** Artifact RPC responses do not invalidate their own queries. */
export function subscribeManifoldChanges(
  world: WorldStore,
  listener: () => void,
): () => void {
  const revision = () => {
    const state = world.snapshot();
    return `${state.worldId ?? ""}:${world.runtime("manifold.web")?.headVersion ?? -1}`;
  };
  let previous = revision();
  return world.subscribe((_state, message) => {
    const next = revision();
    if (next === previous) return;
    previous = next;
    if (isIdleSyncRevision(message)) return;
    listener();
  });
}
