import { Suspense, useMemo, type ReactNode } from "react";
import type {
  WindowAppDefinition,
  WindowComponentProps,
  WindowRuntimeProps,
  WindowStore,
} from "../state/window-store";
import {
  ManagedWindowRuntimeProvider,
  WindowAppRuntimeProvider,
} from "./window-runtime-context";
import { WindowScreenRouter } from "./window-screen-router";

export interface WindowContentHostProps {
  store: WindowStore;
  instanceId: string;
  lookupApp(appId: string): WindowAppDefinition | undefined;
  isRuntimeReady?: (app: WindowAppDefinition) => boolean;
  suspenseFallback?: ReactNode;
  runtimeFallback?: ReactNode;
}

export function WindowContentFallback() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-background/50">
      <div className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent text-muted-foreground" />
    </div>
  );
}

function asWindowProps(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

export function WindowContentHost({
  store,
  instanceId,
  lookupApp,
  isRuntimeReady,
  suspenseFallback = <WindowContentFallback />,
  runtimeFallback = null,
}: WindowContentHostProps) {
  const managedWindow = store((state) => state.windows[instanceId] ?? null);
  const focused = store((state) => state.focusedWindowId === instanceId);
  const app = managedWindow ? lookupApp(managedWindow.appId) : undefined;
  const definition = managedWindow ? app?.windows[managedWindow.windowType] : undefined;

  const runtimeProps = useMemo<WindowRuntimeProps | null>(() => {
    if (!managedWindow) return null;
    return {
      instanceId: managedWindow.instanceId,
      appId: managedWindow.appId,
      windowType: managedWindow.windowType,
      focused,
      close: () => store.getState().closeWindow(managedWindow.instanceId),
      setTitle: (title: string) =>
        store.getState().setWindowTitle(managedWindow.instanceId, title),
    };
  }, [focused, managedWindow, store]);

  const componentProps = useMemo<WindowComponentProps | null>(() => {
    if (!runtimeProps || !managedWindow) return null;
    // The shipped client applies launch/window props last, so feature-specific
    // props retain the same override semantics during the migration.
    return {
      ...runtimeProps,
      ...asWindowProps(managedWindow.props),
    } as WindowComponentProps;
  }, [managedWindow, runtimeProps]);

  const appContext = useMemo(
    () => (managedWindow ? store.getState().getAppContext(managedWindow.appId) : null),
    [managedWindow, store],
  );

  if (!managedWindow || !app || !definition || !runtimeProps || !componentProps || !appContext) {
    return null;
  }

  if (app.runtime && isRuntimeReady && !isRuntimeReady(app)) return <>{runtimeFallback}</>;

  let content: ReactNode = null;
  if (definition.screens) {
    content = (
      <WindowScreenRouter
        store={store}
        instanceId={managedWindow.instanceId}
        appId={managedWindow.appId}
        windowType={managedWindow.windowType}
        lookupApp={lookupApp}
        fallback={suspenseFallback}
      />
    );
  } else if (definition.component) {
    const Component = definition.component;
    content = (
      <Suspense fallback={suspenseFallback}>
        <Component {...componentProps} />
      </Suspense>
    );
  }

  return (
    <WindowAppRuntimeProvider value={appContext}>
      <ManagedWindowRuntimeProvider value={runtimeProps}>
        {content}
      </ManagedWindowRuntimeProvider>
    </WindowAppRuntimeProvider>
  );
}
