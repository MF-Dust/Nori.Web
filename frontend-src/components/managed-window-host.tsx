import type { ReactNode } from "react";
import { NORI_WINDOW_ANIMATION, type WindowLayoutRuntime } from "../state/window-layout-runtime";
import type { WindowAppDefinition, WindowStore } from "../state/window-store";
import { WindowChrome } from "./window-chrome";
import { WindowContentHost } from "./window-content-host";
import { WindowLayer, type WindowLayerRenderItem } from "./window-layer";

export interface ManagedWindowHostProps {
  store: WindowStore;
  layout: WindowLayoutRuntime;
  item: WindowLayerRenderItem;
  lookupApp(appId: string): WindowAppDefinition | undefined;
  isRuntimeReady?: (app: WindowAppDefinition) => boolean;
  playCue?: (cue: string) => void;
  suspenseFallback?: ReactNode;
  runtimeFallback?: ReactNode;
}

/**
 * Functional clean-room counterpart of the shipped regular/exclusive window
 * hosts. Motion is represented as data attributes for now; the state and
 * interaction wiring already follows the recovered desktop contracts.
 */
export function ManagedWindowHost({
  store,
  layout,
  item,
  lookupApp,
  isRuntimeReady,
  playCue,
  suspenseFallback,
  runtimeFallback,
}: ManagedWindowHostProps) {
  const managedWindow = store((state) => state.windows[item.instanceId] ?? null);
  const focusedWindowId = store((state) => state.focusedWindowId);
  if (!managedWindow || managedWindow.minimized) return null;

  const exclusive = item.kind === "exclusive";
  const interactive = !item.receded;
  const windowMotion = item.animatesOnEnter ? "enter" : item.receded ? "receded" : "stable";

  return (
    <div
      data-window-host={item.instanceId}
      data-window-kind={item.kind}
      data-window-reveal-delay={item.revealDelay}
    >
      <WindowChrome
        instanceId={managedWindow.instanceId}
        title={managedWindow.title}
        rect={managedWindow}
        preSnapRect={managedWindow.preSnapRect}
        snap={managedWindow.snap}
        zIndex={managedWindow.zIndex}
        focused={focusedWindowId === managedWindow.instanceId}
        exclusive={exclusive}
        alwaysOnTop={managedWindow.alwaysOnTop}
        interactive={interactive}
        windowMotion={windowMotion}
        config={{
          draggable: !exclusive,
          resizable: managedWindow.config.resizable,
          closable: managedWindow.config.closable,
          minimizable: managedWindow.config.minimizable && !exclusive,
          maximizable: managedWindow.config.maximizable && !exclusive,
        }}
        layout={layout}
        playCue={playCue}
        onFocus={(instanceId) => store.getState().focusWindow(instanceId)}
        onClose={(instanceId) => store.getState().closeWindow(instanceId)}
        onMinimize={(instanceId) => store.getState().minimizeWindow(instanceId)}
        onSnap={(instanceId, snap) => store.getState().snapWindow(instanceId, snap)}
        onToggleMaximize={(instanceId) => store.getState().toggleMaximize(instanceId)}
        onMove={(instanceId, x, y) =>
          store.getState().updateWindowPosition(instanceId, x, y)
        }
        onResize={(instanceId, x, y, width, height) =>
          store.getState().updateWindowRect(instanceId, x, y, width, height)
        }
      >
        <WindowContentHost
          store={store}
          instanceId={managedWindow.instanceId}
          lookupApp={lookupApp}
          isRuntimeReady={isRuntimeReady}
          suspenseFallback={suspenseFallback}
          runtimeFallback={runtimeFallback}
        />
      </WindowChrome>
    </div>
  );
}

export interface DesktopWindowManagerProps {
  store: WindowStore;
  layout: WindowLayoutRuntime;
  lookupApp(appId: string): WindowAppDefinition | undefined;
  isRuntimeReady?: (app: WindowAppDefinition) => boolean;
  playCue?: (cue: string) => void;
  suspenseFallback?: ReactNode;
  runtimeFallback?: ReactNode;
  receded?: boolean;
}

/** Complete functional window stack: ordering -> chrome -> app content. */
export function DesktopWindowManager({
  store,
  layout,
  lookupApp,
  isRuntimeReady,
  playCue,
  suspenseFallback,
  runtimeFallback,
  receded = false,
}: DesktopWindowManagerProps) {
  return (
    <WindowLayer
      store={store}
      layout={layout}
      receded={receded}
      getRevealDelay={(index) =>
        NORI_WINDOW_ANIMATION.SHELL_RETURN_DELAY +
        Math.min(index, NORI_WINDOW_ANIMATION.SHELL_RETURN_STAGGER_MAX) *
          NORI_WINDOW_ANIMATION.SHELL_RETURN_STAGGER
      }
      renderWindow={(item) => (
        <ManagedWindowHost
          key={item.instanceId}
          store={store}
          layout={layout}
          item={item}
          lookupApp={lookupApp}
          isRuntimeReady={isRuntimeReady}
          playCue={playCue}
          suspenseFallback={suspenseFallback}
          runtimeFallback={runtimeFallback}
        />
      )}
    />
  );
}
