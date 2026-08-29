import { Suspense, useCallback, useMemo, type ReactNode } from "react";
import type {
  WindowAppDefinition,
  WindowScreenComponentProps,
  WindowStore,
} from "../state/window-store";

export interface WindowScreenRouterProps {
  store: WindowStore;
  instanceId: string;
  appId: string;
  windowType: string;
  lookupApp(appId: string): WindowAppDefinition | undefined;
  fallback?: ReactNode;
  missingFallback?: ReactNode;
}

export function WindowScreenRouter({
  store,
  instanceId,
  appId,
  windowType,
  lookupApp,
  fallback = null,
  missingFallback = null,
}: WindowScreenRouterProps) {
  const screenStack = store((state) => state.windows[instanceId]?.screenStack);
  const screenDefinition = lookupApp(appId)?.windows[windowType]?.screens;

  const navigate = useCallback(
    (screen: string, params?: unknown) => {
      store.getState().navigateScreen(instanceId, screen, params);
    },
    [instanceId, store],
  );

  const goBack = useCallback(() => {
    store.getState().goBackScreen(instanceId);
  }, [instanceId, store]);

  const screenProps = useMemo<WindowScreenComponentProps | null>(() => {
    if (!screenStack) return null;
    return {
      navigate,
      goBack,
      canGoBack: screenStack.history.length > 0,
      params: screenStack.params,
    };
  }, [goBack, navigate, screenStack]);

  if (!screenDefinition || !screenStack || !screenProps) return missingFallback;

  const current = screenDefinition.screens[screenStack.current];
  if (!current) {
    console.warn(
      `[ScreenContainer] Missing screen config for ${instanceId}: ${screenStack.current}`,
    );
    return missingFallback;
  }

  const Screen = current.component;
  return (
    <div
      className="relative h-full w-full overflow-hidden"
      data-window-screen={screenStack.current}
      data-window-transition={current.transition ?? "fade"}
    >
      <div className="absolute inset-0 h-full w-full" key={screenStack.current}>
        <Suspense fallback={fallback}>
          <Screen {...screenProps} />
        </Suspense>
      </div>
    </div>
  );
}
