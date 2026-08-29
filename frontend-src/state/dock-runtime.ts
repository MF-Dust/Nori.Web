import type { WindowStore } from "./window-types";
import type {
  RegisteredWindowAppDefinition,
  WindowAppRegistry,
} from "./window-app-registry";

export interface DockAppModel {
  id: string;
  title: string;
  accentColor?: string;
  app: RegisteredWindowAppDefinition;
}

export interface DockAppSelection {
  pinnedApps: DockAppModel[];
  unpinnedApps: DockAppModel[];
}

export interface SelectDockAppsOptions {
  registry: WindowAppRegistry;
  facts: ReadonlySet<string>;
  /** IDs exposed by the shipped open/unpinned-app selector. */
  openUnpinnedAppIds?: readonly string[];
  resolveTitle?: (app: RegisteredWindowAppDefinition) => string;
}

function toDockModel(
  app: RegisteredWindowAppDefinition,
  resolveTitle?: (app: RegisteredWindowAppDefinition) => string,
): DockAppModel {
  return {
    id: app.id,
    title: resolveTitle?.(app) ?? app.title ?? app.id,
    accentColor: app.accentColor,
    app,
  };
}

/** Mirrors vV's pinned/dockWhen and open-unpinned filtering. */
export function selectDockApps({
  registry,
  facts,
  openUnpinnedAppIds = [],
  resolveTitle,
}: SelectDockAppsOptions): DockAppSelection {
  const pinnedApps = registry
    .listPinnedApps()
    .filter((app) => !app.dockWhen || facts.has(app.dockWhen))
    .map((app) => toDockModel(app, resolveTitle));
  const openIds = new Set(openUnpinnedAppIds);
  const unpinnedApps = registry
    .listUnpinnedApps()
    .filter((app) => openIds.has(app.id))
    .map((app) => toDockModel(app, resolveTitle));
  return { pinnedApps, unpinnedApps };
}

function topWindowId(
  store: WindowStore,
  windowIds: readonly string[],
  visibleOnly: boolean,
): string | null {
  const { windows } = store.getState();
  let result: string | null = null;
  let highest = Number.NEGATIVE_INFINITY;
  for (const instanceId of windowIds) {
    const window = windows[instanceId];
    if (!window || (visibleOnly && window.minimized)) continue;
    const zIndex = typeof window.zIndex === "number" ? window.zIndex : 0;
    if (zIndex > highest) {
      highest = zIndex;
      result = instanceId;
    }
  }
  return result;
}

/**
 * Exact behavioral core of vV's Dock click handler:
 * - running exclusive app: ignore
 * - clicking the currently active app: minimize all of its visible windows
 * - otherwise focus its highest visible (or highest existing) window
 * - not running: activate/launch the app
 */
export async function activateDockApp(
  store: WindowStore,
  appId: string,
): Promise<void> {
  const state = store.getState();
  const process = state.processes[appId];
  if (process && process.windowIds.length > 0) {
    if (appId === state.exclusiveAppId) return;

    const focusedAppId = state.focusedWindowId
      ? state.windows[state.focusedWindowId]?.appId ?? null
      : null;
    if (focusedAppId === appId) {
      const visible = process.windowIds.filter(
        (instanceId) => state.windows[instanceId] && !state.windows[instanceId].minimized,
      );
      if (visible.length > 0) {
        for (const instanceId of visible) store.getState().minimizeWindow(instanceId);
        return;
      }
    }

    const target =
      topWindowId(store, process.windowIds, true) ??
      topWindowId(store, process.windowIds, false);
    if (target) store.getState().focusWindow(target);
    return;
  }

  await store.getState().launchApp({ appId, mode: "activate" });
}
