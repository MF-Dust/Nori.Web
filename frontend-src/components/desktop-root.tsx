import {
  useEffect,
  useState,
  type CSSProperties,
  type MouseEvent,
  type ReactNode,
} from "react";
import {
  createDesktopRuntime,
  type CreateDesktopRuntimeOptions,
  type DesktopRuntime,
} from "../state/desktop-runtime";
import { NORI_SHELL_LAYERS } from "../state/window-layout-runtime";
import type { WindowAppDefinition, WindowLaunchRequest } from "../state/window-store";
import { DesktopWindowManager } from "./managed-window-host";

export interface DesktopRootProps {
  runtime?: DesktopRuntime;
  runtimeOptions?: CreateDesktopRuntimeOptions;
  restoreOnMount?: boolean;
  initialLaunches?: readonly WindowLaunchRequest[];
  isRuntimeReady?: (app: WindowAppDefinition) => boolean;
  playCue?: (cue: string) => void;
  suspenseFallback?: ReactNode;
  runtimeFallback?: ReactNode;
  receded?: boolean;
  background?: ReactNode;
  topbar?: ReactNode;
  dock?: ReactNode;
  overlay?: ReactNode;
  className?: string;
  style?: CSSProperties;
  onReady?: (runtime: DesktopRuntime) => void;
}

/**
 * Source-driven desktop composition boundary. It deliberately keeps topbar,
 * dock, wallpaper and feature presentation injectable while the corresponding
 * NormalApp presentation modules are still being recovered.
 *
 * `runtimeOptions` are treated as construction-time options. Pass a prebuilt
 * `runtime` when a caller needs to own runtime replacement explicitly.
 */
export function DesktopRoot({
  runtime: providedRuntime,
  runtimeOptions,
  restoreOnMount = true,
  initialLaunches = [],
  isRuntimeReady,
  playCue,
  suspenseFallback,
  runtimeFallback,
  receded = false,
  background,
  topbar,
  dock,
  overlay,
  className,
  style,
  onReady,
}: DesktopRootProps) {
  const [ownedRuntime] = useState<DesktopRuntime>(() =>
    providedRuntime ?? createDesktopRuntime(runtimeOptions),
  );
  const runtime = providedRuntime ?? ownedRuntime;

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (restoreOnMount) await runtime.store.getState().restoreApps();
      if (cancelled) return;

      for (const request of initialLaunches) {
        await runtime.store.getState().launchApp(request);
        if (cancelled) return;
      }

      onReady?.(runtime);
    })();
    return () => {
      cancelled = true;
    };
  }, [initialLaunches, onReady, restoreOnMount, runtime]);

  const unfocusDesktop = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) runtime.store.getState().unfocusWindow();
  };

  return (
    <div
      className={className ?? "relative h-full w-full overflow-hidden"}
      style={style}
      data-nori-desktop-root="true"
      onMouseDown={unfocusDesktop}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{ zIndex: NORI_SHELL_LAYERS.DESKTOP }}
        data-nori-desktop-background="true"
      >
        {background}
      </div>

      <DesktopWindowManager
        store={runtime.store}
        layout={runtime.layout}
        lookupApp={runtime.registry.lookupApp}
        isRuntimeReady={isRuntimeReady}
        playCue={playCue ?? runtimeOptions?.playCue}
        suspenseFallback={suspenseFallback}
        runtimeFallback={runtimeFallback}
        receded={receded}
      />

      {topbar != null && (
        <div
          className="pointer-events-none fixed inset-x-0 top-0"
          style={{ zIndex: NORI_SHELL_LAYERS.TOPBAR }}
          data-nori-desktop-topbar="true"
        >
          <div className="pointer-events-auto">{topbar}</div>
        </div>
      )}

      {dock != null && (
        <div
          className="pointer-events-none fixed inset-x-0 bottom-0"
          style={{ zIndex: NORI_SHELL_LAYERS.DOCK }}
          data-nori-desktop-dock="true"
        >
          <div className="pointer-events-auto">{dock}</div>
        </div>
      )}

      {overlay != null && (
        <div
          className="pointer-events-none fixed inset-0"
          style={{ zIndex: NORI_SHELL_LAYERS.CONNECTION_OVERLAY }}
          data-nori-desktop-overlay="true"
        >
          {overlay}
        </div>
      )}
    </div>
  );
}
