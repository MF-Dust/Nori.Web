import { useSyncExternalStore } from "react";
import type { NoriSceneStore } from "../state/nori-scene";
import { NORI_SHELL_LAYERS } from "../state/window-layout-runtime";

export function noriVignette(value: number) {
  const intensity = Math.max(
    0,
    Math.min(Number.isFinite(value) ? value : 0, 5),
  );
  return `radial-gradient(ellipse at center, rgba(0,0,0,0) ${Math.max(6, 42 - intensity * 7)}%, rgba(0,0,0,${Math.min(0.95, 0.16 * intensity)}) ${Math.max(38, 72 - intensity * 5)}%, rgba(0,0,0,${Math.min(1, 0.32 * intensity)}) 100%)`;
}
export function NoriSceneEffects({ scene }: { scene: NoriSceneStore }) {
  const state = useSyncExternalStore(scene.subscribe, scene.snapshot);
  const layer = {
    position: "fixed" as const,
    inset: 0,
    pointerEvents: "none" as const,
  };
  return (
    <>
      {state.blur > 0.15 && (
        <div
          aria-hidden
          data-scene-effect="blur"
          style={{
            ...layer,
            zIndex: NORI_SHELL_LAYERS.CUTSCENE - 6,
            backdropFilter: `blur(${Math.min(state.blur, 100)}px)`,
            WebkitBackdropFilter: `blur(${Math.min(state.blur, 100)}px)`,
          }}
        />
      )}
      {state.vignette > 0.001 && (
        <div
          aria-hidden
          data-scene-effect="vignette"
          style={{
            ...layer,
            zIndex: NORI_SHELL_LAYERS.CUTSCENE - 5,
            background: noriVignette(state.vignette),
          }}
        />
      )}
      {state.whiteFlash > 0.001 && (
        <div
          aria-hidden
          data-scene-effect="flash"
          style={{
            ...layer,
            zIndex: NORI_SHELL_LAYERS.CUTSCENE - 4,
            background: "white",
            opacity: Math.min(state.whiteFlash, 1),
          }}
        />
      )}
    </>
  );
}
