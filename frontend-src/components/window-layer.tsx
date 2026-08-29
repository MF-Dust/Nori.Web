import { Fragment, useEffect, useRef, type ReactNode } from "react";
import { useShallow } from "zustand/react/shallow";
import {
  clampWindowRect,
  computeSnapRect,
  type WindowLayoutRuntime,
  type WindowStore,
} from "../state/window-store";

export type WindowLayerKind = "window" | "always-on-top" | "exclusive";

export interface WindowLayerRenderItem {
  instanceId: string;
  kind: WindowLayerKind;
  exclusiveMode: boolean;
  animatesOnEnter: boolean;
  receded: boolean;
  revealDelay: number;
}

export interface WindowLayerProps {
  store: WindowStore;
  layout: WindowLayoutRuntime;
  receded?: boolean;
  getRevealDelay?: (index: number) => number;
  renderWindow(item: WindowLayerRenderItem): ReactNode;
}

function sameRect(
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number },
) {
  return a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height;
}

export function WindowLayer({
  store,
  layout,
  receded = false,
  getRevealDelay = () => 0,
  renderWindow,
}: WindowLayerProps) {
  const exclusiveAppId = store((state) => state.exclusiveAppId);
  const exclusiveWindowId = store((state) => state.exclusiveWindowId);
  const exclusiveMode = exclusiveAppId !== null;

  const normalWindowIds = store(
    useShallow((state) =>
      state.windowOrder.filter((instanceId) => {
        const window = state.windows[instanceId];
        return Boolean(
          window && !window.alwaysOnTop && instanceId !== state.exclusiveWindowId,
        );
      }),
    ),
  );

  const alwaysOnTopWindowIds = store(
    useShallow((state) =>
      state.windowOrder.filter(
        (instanceId) =>
          Boolean(state.windows[instanceId]?.alwaysOnTop) &&
          instanceId !== state.exclusiveWindowId,
      ),
    ),
  );

  const initialWindowIds = useRef<Set<string> | null>(null);
  if (initialWindowIds.current === null) {
    initialWindowIds.current = new Set([...normalWindowIds, ...alwaysOnTopWindowIds]);
  }
  const animatesOnEnter = (instanceId: string) => !initialWindowIds.current?.has(instanceId);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let frame = 0;
    const reconcile = () => {
      frame = 0;
      const state = store.getState();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      if (
        !Number.isFinite(viewportWidth) ||
        !Number.isFinite(viewportHeight) ||
        viewportWidth <= 0 ||
        viewportHeight <= 0
      ) {
        return;
      }

      let changed = false;
      const windows = { ...state.windows };
      for (const [instanceId, managedWindow] of Object.entries(state.windows)) {
        if (
          !managedWindow ||
          instanceId === state.exclusiveWindowId ||
          !Number.isFinite(managedWindow.width) ||
          !Number.isFinite(managedWindow.height) ||
          managedWindow.width <= 0 ||
          managedWindow.height <= 0
        ) {
          continue;
        }

        const current = {
          x: managedWindow.x,
          y: managedWindow.y,
          width: managedWindow.width,
          height: managedWindow.height,
        };
        const next =
          managedWindow.snap !== "none"
            ? computeSnapRect(managedWindow.snap, layout.getBounds(false), current)
            : clampWindowRect(
                current,
                layout.getBounds(managedWindow.alwaysOnTop),
                layout.geometry,
              );

        if (next && !sameRect(current, next)) {
          windows[instanceId] = { ...managedWindow, ...next };
          changed = true;
        }
      }

      if (changed) store.setState({ windows });
    };

    const scheduleReconcile = () => {
      if (!frame) frame = window.requestAnimationFrame(reconcile);
    };

    window.addEventListener("resize", scheduleReconcile);
    scheduleReconcile();
    return () => {
      window.removeEventListener("resize", scheduleReconcile);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [layout, store]);

  return (
    <Fragment>
      <div className="pointer-events-none absolute inset-0 bottom-8 [&>*]:pointer-events-auto">
        {normalWindowIds.map((instanceId, index) => (
          <Fragment key={instanceId}>
            {renderWindow({
              instanceId,
              kind: "window",
              exclusiveMode,
              animatesOnEnter: animatesOnEnter(instanceId),
              receded,
              revealDelay: getRevealDelay(index),
            })}
          </Fragment>
        ))}
      </div>

      {exclusiveWindowId &&
        renderWindow({
          instanceId: exclusiveWindowId,
          kind: "exclusive",
          exclusiveMode,
          animatesOnEnter: false,
          receded,
          revealDelay: getRevealDelay(0),
        })}

      {alwaysOnTopWindowIds.map((instanceId, index) => (
        <Fragment key={instanceId}>
          {renderWindow({
            instanceId,
            kind: "always-on-top",
            exclusiveMode,
            animatesOnEnter: animatesOnEnter(instanceId),
            receded,
            revealDelay: getRevealDelay(normalWindowIds.length + index),
          })}
        </Fragment>
      ))}
    </Fragment>
  );
}
