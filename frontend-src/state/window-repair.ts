import { clampWindowRect, computeSnapRect } from "./window-geometry";
import type {
  ManagedWindow,
  PersistedWindowManagerState,
  WindowConfig,
  WindowProcess,
  WindowRect,
  WindowStoreOptions,
} from "./window-types";

export function repairPersistedWindowState(
  persisted: PersistedWindowManagerState,
  options: Pick<WindowStoreOptions, "lookupApp" | "layout" | "warn">,
): PersistedWindowManagerState {
  const warn = options.warn ?? ((message: string) => console.warn(message));
  const processes: Record<string, WindowProcess> = {};
  const windows: Record<string, ManagedWindow> = {};
  const windowOrder: string[] = [];
  const removedApps = new Set<string>();

  for (const [appId, process] of Object.entries(persisted.processes)) {
    if (!options.lookupApp(appId)) {
      warn(`[OS Restore] Removing process for unregistered app: ${appId}`);
      removedApps.add(appId);
      continue;
    }
    processes[appId] = { ...process, windowIds: [] };
  }

  const extraCartridgeApps = Object.values(processes)
    .filter((process) => options.lookupApp(process.appId)?.runtime?.ownsCartridge)
    .sort((left, right) => right.launchedAt - left.launchedAt)
    .slice(1);

  for (const process of extraCartridgeApps) {
    warn(`[OS Restore] Removing extra cartridge-owning app: ${process.appId}`);
    removedApps.add(process.appId);
    delete processes[process.appId];
  }

  for (const instanceId of persisted.windowOrder) {
    const previous = persisted.windows[instanceId];
    if (!previous || removedApps.has(previous.appId)) continue;

    const app = options.lookupApp(previous.appId);
    const definition = app?.windows[previous.windowType];
    if (!app || !definition) {
      warn(`[OS Restore] Removing window with invalid type: ${instanceId}`);
      continue;
    }

    const process = processes[previous.appId];
    if (!process) {
      warn(`[OS Restore] Removing orphaned window without a process: ${instanceId}`);
      continue;
    }

    const config: WindowConfig = {
      resizable: definition.resizable ?? true,
      closable: definition.closable ?? true,
      minimizable: app.exclusive ? false : (definition.minimizable ?? true),
      maximizable: app.exclusive ? false : (definition.maximizable ?? true),
    };
    const alwaysOnTop = definition.alwaysOnTop ?? false;
    const snap = previous.snap ?? "none";
    const previousRect: WindowRect = {
      x: previous.x,
      y: previous.y,
      width: previous.width,
      height: previous.height,
    };
    const rect =
      snap === "none"
        ? clampWindowRect(
            previousRect,
            options.layout.getBounds(alwaysOnTop),
            options.layout.geometry,
          )
        : (computeSnapRect(snap, options.layout.getBounds(false), previousRect) ?? previousRect);

    windows[instanceId] = {
      ...previous,
      config,
      alwaysOnTop,
      snap,
      ...rect,
    };
    windowOrder.push(instanceId);
    process.windowIds.push(instanceId);
  }

  const focusedWindowId =
    persisted.focusedWindowId && windows[persisted.focusedWindowId]
      ? persisted.focusedWindowId
      : null;
  let exclusiveAppId =
    persisted.exclusiveAppId && processes[persisted.exclusiveAppId]
      ? persisted.exclusiveAppId
      : null;
  let exclusiveWindowId =
    persisted.exclusiveWindowId &&
    exclusiveAppId &&
    windows[persisted.exclusiveWindowId]?.appId === exclusiveAppId
      ? persisted.exclusiveWindowId
      : null;

  if (exclusiveAppId && !exclusiveWindowId) {
    const adopted = windowOrder.find(
      (instanceId) => windows[instanceId]?.appId === exclusiveAppId,
    );
    if (adopted) {
      warn(`[OS Restore] Re-adopting exclusive window for ${exclusiveAppId}: ${adopted}`);
      exclusiveWindowId = adopted;
    } else {
      warn(`[OS Restore] Removing exclusive app without windows: ${exclusiveAppId}`);
      delete processes[exclusiveAppId];
      exclusiveAppId = null;
    }
  }

  if (persisted.exclusiveAppId && !exclusiveAppId) {
    for (const [instanceId, window] of Object.entries(windows)) {
      if (!window.minimizedByExclusive) continue;
      windows[instanceId] = {
        ...window,
        minimized: false,
        minimizedByExclusive: undefined,
      };
    }
  }

  return {
    processes,
    windows,
    windowOrder,
    focusedWindowId,
    exclusiveAppId,
    exclusiveWindowId,
    windowCounter: persisted.windowCounter,
  };
}
