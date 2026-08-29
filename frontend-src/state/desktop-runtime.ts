import {
  createProductionWindowAppRegistry,
  type CreateProductionWindowAppsOptions,
} from "./production-window-apps";
import {
  createNoriWindowLayoutRuntime,
  type WindowLayoutRuntime,
} from "./window-layout-runtime";
import { createWindowStore } from "./window-store";
import type {
  WindowLaunchGuardResult,
  WindowLaunchRequest,
  WindowStore,
} from "./window-types";
import type { WindowAppRegistry } from "./window-app-registry";

export interface DesktopRuntime {
  registry: WindowAppRegistry;
  layout: WindowLayoutRuntime;
  store: WindowStore;
}

export interface CreateDesktopRuntimeOptions
  extends CreateProductionWindowAppsOptions {
  registry?: WindowAppRegistry;
  layout?: WindowLayoutRuntime;
  playCue?: (cue: string) => void;
  launchGuard?: (request: {
    appId: string;
    mode: string;
    willBeExclusive: boolean;
    request: WindowLaunchRequest;
  }) => WindowLaunchGuardResult;
  persistName?: string;
  now?: () => number;
  error?: (message: string, error?: unknown) => void;
}

/**
 * Creates the recovered desktop's stable runtime graph. Registry and layout are
 * intentionally constructed before the Zustand store because the shipped OS
 * resolves app/window definitions synchronously from its insertion-ordered
 * registry during launch, restoration and window creation.
 */
export function createDesktopRuntime(
  options: CreateDesktopRuntimeOptions = {},
): DesktopRuntime {
  const registry =
    options.registry ??
    createProductionWindowAppRegistry({
      descriptors: options.descriptors,
      windows: options.windows,
      lifecycle: options.lifecycle,
      warn: options.warn,
    });
  const layout = options.layout ?? createNoriWindowLayoutRuntime();
  const store = createWindowStore({
    lookupApp: registry.lookupApp,
    layout,
    playCue: options.playCue,
    launchGuard: options.launchGuard,
    persistName: options.persistName,
    now: options.now,
    warn: options.warn,
    error: options.error,
  });

  return { registry, layout, store };
}
