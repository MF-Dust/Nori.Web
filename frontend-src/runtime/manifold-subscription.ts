import type { WorldStore } from "./world-store";

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
  return world.subscribe(() => {
    const next = revision();
    if (next === previous) return;
    previous = next;
    listener();
  });
}
