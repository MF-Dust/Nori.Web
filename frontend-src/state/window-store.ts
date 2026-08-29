import { create, type StoreApi, type UseBoundStore } from "zustand";
import { persist } from "zustand/middleware";

export type WindowSnap =
  | "none"
  | "maximized"
  | "vertical-maximized"
  | "left"
  | "right"
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right";

export interface WindowRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface WindowBounds {
  viewportWidth: number;
  viewportHeight: number;
  top: number;
  bottom: number;
}

export interface WindowLayerConfig {
  window: number;
  alwaysOnTop: number;
  exclusive: number;
}

export interface WindowGeometryConfig {
  minWidth: number;
  minHeight: number;
  initialPosition: { x: number; y: number };
  cascadeOffset: { x: number; y: number };
  cascadeWrap: number;
}

export interface WindowLayoutRuntime {
  layers: WindowLayerConfig;
  geometry: WindowGeometryConfig;
  getBounds(alwaysOnTop: boolean): WindowBounds;
  exclusiveTransitionMs: number;
}

export interface WindowScreenDefinition {
  initial: string;
  screens: Record<string, unknown>;
}

export interface WindowDefinition {
  title: string;
  defaultSize: { width: number; height: number };
  resizable?: boolean;
  closable?: boolean;
  minimizable?: boolean;
  maximizable?: boolean;
  alwaysOnTop?: boolean;
  screens?: WindowScreenDefinition;
}

export interface WindowAppRuntimeDefinition {
  ownsCartridge?: boolean;
}

export interface WindowAppDefinition {
  id: string;
  exclusive?: boolean;
  keepAlive?: boolean;
  runtime?: WindowAppRuntimeDefinition;
  windows: Record<string, WindowDefinition>;
  onLaunch?: (
    context: WindowAppContext,
    request: WindowLaunchRequest,
  ) => void | Promise<void>;
  onQuit?: (context: WindowAppContext) => void | Promise<void>;
  onRestore?: (context: WindowAppContext) => boolean | void | Promise<boolean | void>;
}

export interface WindowLaunchRequest {
  appId: string;
  mode: "launch" | "activate" | string;
  args?: unknown;
}

export interface WindowProcess {
  appId: string;
  windowIds: string[];
  launchedAt: number;
}

export interface WindowConfig {
  resizable: boolean;
  closable: boolean;
  minimizable: boolean;
  maximizable: boolean;
}

export interface WindowScreenHistoryEntry {
  screen: string;
  params?: unknown;
}

export interface WindowScreenStack {
  current: string;
  params?: unknown;
  history: WindowScreenHistoryEntry[];
}

export interface ManagedWindow extends WindowRect {
  instanceId: string;
  appId: string;
  windowType: string;
  props?: unknown;
  title: string;
  zIndex: number;
  minimized: boolean;
  minimizedByExclusive?: boolean;
  snap: WindowSnap;
  preSnapRect?: WindowRect;
  config: WindowConfig;
  alwaysOnTop: boolean;
  screenStack?: WindowScreenStack;
}

export interface PersistedWindowManagerState {
  processes: Record<string, WindowProcess>;
  windows: Record<string, ManagedWindow>;
  windowOrder: string[];
  focusedWindowId: string | null;
  exclusiveAppId: string | null;
  exclusiveWindowId: string | null;
  windowCounter: number;
}

export interface WindowAppContext {
  appId: string;
  createWindow(windowType: string, props?: unknown): string | null;
  closeWindow(instanceId: string): void;
  closeAllWindows(): void;
  getWindows(): ManagedWindow[];
  quit(): Promise<void>;
}

export interface WindowAppMenuContext extends WindowAppContext {
  focusedWindowId: string | null;
}

export type WindowLaunchGuardResult = { type: "allow" } | { type: "veto"; reason?: string };

export interface WindowStoreOptions {
  lookupApp(appId: string): WindowAppDefinition | undefined;
  layout: WindowLayoutRuntime;
  playCue?: (cue: string) => void;
  launchGuard?: (request: {
    appId: string;
    mode: string;
    willBeExclusive: boolean;
    request: WindowLaunchRequest;
  }) => WindowLaunchGuardResult;
  now?: () => number;
  persistName?: string;
  warn?: (message: string) => void;
  error?: (message: string, error?: unknown) => void;
}

export interface WindowManagerState extends PersistedWindowManagerState {
  isTransitioning: boolean;
  restorationDone: boolean;
  launchApp(request: WindowLaunchRequest): Promise<void>;
  quitApp(appId: string): Promise<void>;
  createWindow(appId: string, windowType: string, props?: unknown): string | null;
  closeWindow(instanceId: string): void;
  focusWindow(instanceId: string): void;
  minimizeWindow(instanceId: string): void;
  minimizeAllWindows(): void;
  snapWindow(instanceId: string, snap: WindowSnap): void;
  toggleMaximize(instanceId: string): void;
  updateWindowPosition(instanceId: string, x: number, y: number): void;
  updateWindowSize(instanceId: string, width: number, height: number): void;
  updateWindowRect(instanceId: string, x: number, y: number, width: number, height: number): void;
  setWindowTitle(instanceId: string, title: string): void;
  navigateScreen(instanceId: string, screen: string, params?: unknown): void;
  goBackScreen(instanceId: string): void;
  unfocusWindow(): void;
  getAppContext(appId: string): WindowAppContext;
  getAppMenuContext(appId: string): WindowAppMenuContext;
  restoreApps(): Promise<void>;
}

export type WindowStore = UseBoundStore<StoreApi<WindowManagerState>>;

export function computeSnapRect(
  snap: WindowSnap,
  bounds: WindowBounds,
  current: WindowRect,
): WindowRect | null {
  if (snap === "none") return null;
  const height = Math.max(0, bounds.bottom - bounds.top);
  const halfWidth = bounds.viewportWidth / 2;
  const halfHeight = height / 2;

  switch (snap) {
    case "maximized":
      return { x: 0, y: bounds.top, width: bounds.viewportWidth, height };
    case "vertical-maximized": {
      const width = Math.min(current.width, bounds.viewportWidth);
      return {
        x: Math.min(Math.max(0, current.x), Math.max(0, bounds.viewportWidth - width)),
        y: bounds.top,
        width,
        height,
      };
    }
    case "left":
      return { x: 0, y: bounds.top, width: halfWidth, height };
    case "right":
      return { x: halfWidth, y: bounds.top, width: halfWidth, height };
    case "top-left":
      return { x: 0, y: bounds.top, width: halfWidth, height: halfHeight };
    case "top-right":
      return { x: halfWidth, y: bounds.top, width: halfWidth, height: halfHeight };
    case "bottom-left":
      return { x: 0, y: bounds.top + halfHeight, width: halfWidth, height: halfHeight };
    case "bottom-right":
      return {
        x: halfWidth,
        y: bounds.top + halfHeight,
        width: halfWidth,
        height: halfHeight,
      };
  }
}

export function clampWindowRect(
  rect: WindowRect,
  bounds: WindowBounds,
  minimum: Pick<WindowGeometryConfig, "minWidth" | "minHeight">,
): WindowRect {
  const availableWidth = Math.max(minimum.minWidth, bounds.viewportWidth);
  const availableHeight = Math.max(minimum.minHeight, bounds.bottom - bounds.top);
  const width = Math.max(minimum.minWidth, Math.min(rect.width, availableWidth));
  const height = Math.max(minimum.minHeight, Math.min(rect.height, availableHeight));
  const maxX = Math.max(0, bounds.viewportWidth - width);
  const maxY = Math.max(bounds.top, bounds.bottom - height);
  return {
    x: Math.min(Math.max(rect.x, 0), maxX),
    y: Math.min(Math.max(rect.y, bounds.top), maxY),
    width,
    height,
  };
}

export function selectTopWindow(
  windows: Readonly<Record<string, ManagedWindow>>,
  windowIds: readonly string[],
  preferNotMinimized = true,
): string | null {
  let result: string | null = null;
  let highest = Number.NEGATIVE_INFINITY;
  const consider = (instanceId: string) => {
    const window = windows[instanceId];
    if (!window) return;
    const zIndex = typeof window.zIndex === "number" ? window.zIndex : 0;
    if (zIndex > highest) {
      highest = zIndex;
      result = instanceId;
    }
  };

  if (preferNotMinimized) {
    for (const instanceId of windowIds) {
      const window = windows[instanceId];
      if (!window || window.minimized) continue;
      consider(instanceId);
    }
    if (result) return result;
  }
  for (const instanceId of windowIds) consider(instanceId);
  return result;
}

export function nextWindowZIndex(
  target: Pick<ManagedWindow, "alwaysOnTop">,
  windows: Readonly<Record<string, ManagedWindow>>,
  layers: WindowLayerConfig,
): number {
  const base = target.alwaysOnTop ? layers.alwaysOnTop : layers.window;
  let highest = base;
  for (const window of Object.values(windows)) {
    if (window.alwaysOnTop !== target.alwaysOnTop) continue;
    const zIndex = typeof window.zIndex === "number" ? window.zIndex : base;
    if (zIndex > highest) highest = zIndex;
  }
  return highest + 1;
}

export function minimizeWindowSet(
  windows: Readonly<Record<string, ManagedWindow>>,
  windowOrder: readonly string[],
  markExclusive: boolean,
): Record<string, ManagedWindow> {
  const next = { ...windows };
  for (const instanceId of windowOrder) {
    const window = next[instanceId];
    if (!window || window.alwaysOnTop) continue;
    next[instanceId] =
      markExclusive && !window.minimized
        ? { ...window, minimized: true, minimizedByExclusive: true }
        : { ...window, minimized: true };
  }
  return next;
}

export function isWindowFullyCovered(
  state: Pick<WindowManagerState, "windows" | "exclusiveWindowId">,
  instanceId: string,
): boolean {
  const target = state.windows[instanceId];
  if (!target || target.minimized || instanceId === state.exclusiveWindowId) return false;
  for (const window of Object.values(state.windows)) {
    if (
      window.instanceId === instanceId ||
      window.minimized ||
      window.instanceId === state.exclusiveWindowId ||
      window.zIndex <= target.zIndex
    ) {
      continue;
    }
    if (
      window.x <= target.x &&
      window.y <= target.y &&
      window.x + window.width >= target.x + target.width &&
      window.y + window.height >= target.y + target.height
    ) {
      return true;
    }
  }
  return false;
}

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

  const cartridgeApps = Object.values(processes)
    .filter((process) => options.lookupApp(process.appId)?.runtime?.ownsCartridge)
    .sort((a, b) => b.launchedAt - a.launchedAt)
    .slice(1);
  for (const process of cartridgeApps) {
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
        ? clampWindowRect(previousRect, options.layout.getBounds(alwaysOnTop), options.layout.geometry)
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
    const adopted = windowOrder.find((instanceId) => windows[instanceId]?.appId === exclusiveAppId);
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

export function createWindowStore(options: WindowStoreOptions): WindowStore {
  const warn = options.warn ?? ((message: string) => console.warn(message));
  const reportError = options.error ?? ((message: string, error?: unknown) => console.error(message, error));
  const now = options.now ?? Date.now;
  const launchPromises = new Map<string, Promise<void>>();
  let suppressLifecycleCue = false;
  const play = (cue: string) => options.playCue?.(cue);

  let store!: WindowStore;

  const waitForTransition = (): Promise<void> => {
    const state = store.getState();
    if (!state.isTransitioning) return Promise.resolve();
    return new Promise((resolve) => {
      const unsubscribe = store.subscribe((next) => {
        if (!next.isTransitioning) {
          unsubscribe();
          resolve();
        }
      });
    });
  };

  const creator = persist<WindowManagerState>(
    (set, get) => ({
      processes: {},
      windows: {},
      windowOrder: [],
      focusedWindowId: null,
      exclusiveAppId: null,
      exclusiveWindowId: null,
      windowCounter: 0,
      isTransitioning: false,
      restorationDone: false,

      launchApp: async (request) => {
        const existingPromise = launchPromises.get(request.appId);
        if (existingPromise) {
          await existingPromise;
          return;
        }

        const operation = (async () => {
          const app = options.lookupApp(request.appId);
          if (!app) {
            warn(`[OS] Unknown app: ${request.appId}`);
            return;
          }
          const current = get();
          if (current.isTransitioning) {
            warn(`[OS] Cannot launch app during transition: ${request.appId}`);
            return;
          }

          const process = current.processes[request.appId];
          if (process) {
            if (request.mode === "activate" || app.exclusive) {
              const instanceId = selectTopWindow(current.windows, process.windowIds, true);
              if (instanceId) get().focusWindow(instanceId);
              return;
            }
            if (app.onLaunch) {
              try {
                await app.onLaunch(get().getAppContext(request.appId), request);
              } catch (error) {
                reportError(`[OS] Error in onLaunch for ${request.appId}:`, error);
              }
            }
            return;
          }

          const willBeExclusive = Boolean(app.exclusive);
          const guard = options.launchGuard?.({
            appId: request.appId,
            mode: request.mode,
            willBeExclusive,
            request,
          });
          if (guard?.type === "veto") return;

          if (app.runtime?.ownsCartridge) {
            suppressLifecycleCue = true;
            try {
              for (const appId of Object.keys(get().processes)) {
                if (appId === request.appId || !options.lookupApp(appId)?.runtime?.ownsCartridge) continue;
                await get().quitApp(appId);
                await waitForTransition();
                if (get().processes[appId]) {
                  warn(`[OS] Could not quit ${appId}; launch of ${request.appId} aborted`);
                  return;
                }
              }
            } finally {
              suppressLifecycleCue = false;
            }
          }

          const nextProcess: WindowProcess = {
            appId: request.appId,
            windowIds: [],
            launchedAt: now(),
          };
          if (app.exclusive) {
            play("shell-exclusive-enter");
            set({
              processes: { ...get().processes, [request.appId]: nextProcess },
              windows: minimizeWindowSet(get().windows, get().windowOrder, true),
              exclusiveAppId: request.appId,
              exclusiveWindowId: null,
            });
          } else {
            set({ processes: { ...get().processes, [request.appId]: nextProcess } });
          }

          if (app.onLaunch) {
            try {
              await app.onLaunch(get().getAppContext(request.appId), request);
            } catch (error) {
              reportError(`[OS] Error in onLaunch for ${request.appId}:`, error);
            }
          }
        })();

        launchPromises.set(request.appId, operation);
        try {
          await operation;
        } finally {
          if (launchPromises.get(request.appId) === operation) launchPromises.delete(request.appId);
        }
      },

      quitApp: async (appId) => {
        const app = options.lookupApp(appId);
        const current = get();
        if (current.isTransitioning) {
          warn(`[OS] Cannot quit app during transition: ${appId}`);
          return;
        }
        if (!current.processes[appId]) return;

        const wasExclusive = current.exclusiveAppId === appId;
        const remainingWindows: Record<string, ManagedWindow> = {};
        for (const [instanceId, window] of Object.entries(current.windows)) {
          if (window.appId !== appId) remainingWindows[instanceId] = window;
        }
        const remainingOrder = current.windowOrder.filter(
          (instanceId) => current.windows[instanceId]?.appId !== appId,
        );
        const processes = { ...current.processes };
        delete processes[appId];

        if (wasExclusive) {
          const restoredWindows = { ...remainingWindows };
          for (const instanceId of remainingOrder) {
            const window = restoredWindows[instanceId];
            if (window?.minimizedByExclusive) {
              restoredWindows[instanceId] = {
                ...window,
                minimized: false,
                minimizedByExclusive: undefined,
              };
            }
          }
          if (!suppressLifecycleCue) play("shell-exclusive-exit");
          set({ isTransitioning: true });
          setTimeout(() => {
            const focusedWindowId = selectTopWindow(restoredWindows, remainingOrder, true);
            set({
              processes,
              windows: restoredWindows,
              windowOrder: remainingOrder,
              exclusiveAppId: null,
              exclusiveWindowId: null,
              focusedWindowId,
              isTransitioning: false,
            });
          }, options.layout.exclusiveTransitionMs);
        } else {
          if (remainingOrder.length !== current.windowOrder.length && !suppressLifecycleCue) {
            play("shell-window-close");
          }
          const focusedWindowId =
            current.focusedWindowId && !remainingWindows[current.focusedWindowId]
              ? selectTopWindow(remainingWindows, remainingOrder, true)
              : current.focusedWindowId;
          set({
            processes,
            windows: remainingWindows,
            windowOrder: remainingOrder,
            focusedWindowId,
          });
        }

        if (app?.onQuit) {
          void Promise.resolve()
            .then(() => app.onQuit?.(get().getAppContext(appId)))
            .catch((error) => reportError(`[OS] Error in onQuit for ${appId}:`, error));
        }
      },

      createWindow: (appId, windowType, props) => {
        const app = options.lookupApp(appId);
        const definition = app?.windows[windowType];
        if (!app || !definition) {
          warn(`[OS] Cannot create window: unknown app or window type (${appId}/${windowType})`);
          return null;
        }
        const current = get();
        if (current.isTransitioning) {
          warn(`[OS] Cannot create window during transition: ${appId}/${windowType}`);
          return null;
        }
        const process = current.processes[appId];
        if (!process) {
          warn(`[OS] Cannot create window: app not running (${appId})`);
          return null;
        }

        const instanceId = `${appId}:${windowType}:${current.windowCounter}`;
        const alwaysOnTop = definition.alwaysOnTop ?? false;
        const cascade = current.windowCounter % options.layout.geometry.cascadeWrap;
        const config: WindowConfig = {
          resizable: definition.resizable ?? true,
          closable: definition.closable ?? true,
          minimizable: app.exclusive ? false : (definition.minimizable ?? true),
          maximizable: app.exclusive ? false : (definition.maximizable ?? true),
        };
        const adoptsExclusive = Boolean(app.exclusive && !current.exclusiveWindowId);
        const screenStack = definition.screens
          ? { current: definition.screens.initial, history: [] as WindowScreenHistoryEntry[] }
          : undefined;
        const baseLayer = adoptsExclusive
          ? options.layout.layers.exclusive
          : alwaysOnTop
            ? options.layout.layers.alwaysOnTop
            : options.layout.layers.window;
        let highestLayer = baseLayer;
        for (const window of Object.values(current.windows)) {
          if (adoptsExclusive || window.alwaysOnTop !== alwaysOnTop) continue;
          const zIndex = typeof window.zIndex === "number" ? window.zIndex : baseLayer;
          if (zIndex > highestLayer) highestLayer = zIndex;
        }
        const zIndex = highestLayer + 1;
        const rect = adoptsExclusive
          ? {
              x: 0,
              y: 0,
              width: definition.defaultSize.width,
              height: definition.defaultSize.height,
            }
          : clampWindowRect(
              {
                x:
                  options.layout.geometry.initialPosition.x +
                  cascade * options.layout.geometry.cascadeOffset.x,
                y:
                  options.layout.geometry.initialPosition.y +
                  cascade * options.layout.geometry.cascadeOffset.y,
                width: definition.defaultSize.width,
                height: definition.defaultSize.height,
              },
              options.layout.getBounds(alwaysOnTop),
              options.layout.geometry,
            );

        const window: ManagedWindow = {
          instanceId,
          appId,
          windowType,
          props,
          title: definition.title,
          ...rect,
          zIndex,
          minimized: false,
          snap: "none",
          config,
          alwaysOnTop,
          screenStack,
        };
        set({
          processes: {
            ...current.processes,
            [appId]: { ...process, windowIds: [...process.windowIds, instanceId] },
          },
          windows: { ...current.windows, [instanceId]: window },
          windowOrder: [...current.windowOrder, instanceId],
          windowCounter: current.windowCounter + 1,
          focusedWindowId: instanceId,
          exclusiveAppId: adoptsExclusive ? appId : current.exclusiveAppId,
          exclusiveWindowId: adoptsExclusive ? instanceId : current.exclusiveWindowId,
        });
        if (!adoptsExclusive) play("shell-window-open");
        return instanceId;
      },

      closeWindow: (instanceId) => {
        const current = get();
        if (current.isTransitioning && instanceId !== current.exclusiveWindowId) {
          warn(`[OS] Cannot close window during transition: ${instanceId}`);
          return;
        }
        const window = current.windows[instanceId];
        if (!window) return;
        const process = current.processes[window.appId];
        if (!process) {
          warn(`[OS] Closing orphaned window without a process: ${instanceId}`);
        } else {
          if (instanceId === current.exclusiveWindowId) {
            void get().quitApp(window.appId);
            return;
          }
          const hasAnotherWindow = process.windowIds.some((id) => id !== instanceId);
          if (!hasAnotherWindow && !options.lookupApp(window.appId)?.keepAlive) {
            void get().quitApp(window.appId);
            return;
          }
        }

        const windows = { ...current.windows };
        delete windows[instanceId];
        const windowOrder = current.windowOrder.filter((id) => id !== instanceId);
        const focusedWindowId =
          current.focusedWindowId === instanceId
            ? selectTopWindow(windows, windowOrder, true)
            : current.focusedWindowId;
        const processes = process
          ? {
              ...current.processes,
              [window.appId]: {
                ...process,
                windowIds: process.windowIds.filter((id) => id !== instanceId),
              },
            }
          : current.processes;
        play("shell-window-close");
        set({ processes, windows, windowOrder, focusedWindowId });
      },

      focusWindow: (instanceId) => {
        const current = get();
        if (current.isTransitioning) return;
        const window = current.windows[instanceId];
        if (!window || (current.focusedWindowId === instanceId && !window.minimized)) return;
        play(window.minimized ? "shell-window-restore" : "shell-window-focus");
        set({
          focusedWindowId: instanceId,
          windowOrder: current.windowOrder,
          windows: {
            ...current.windows,
            [instanceId]: {
              ...window,
              minimized: false,
              minimizedByExclusive: undefined,
              zIndex: nextWindowZIndex(window, current.windows, options.layout.layers),
            },
          },
        });
      },

      minimizeWindow: (instanceId) => {
        const current = get();
        if (current.isTransitioning) return;
        const window = current.windows[instanceId];
        if (!window) return;
        if (!window.minimized) play("shell-window-minimize");
        set({ windows: { ...current.windows, [instanceId]: { ...window, minimized: true } } });
      },

      minimizeAllWindows: () => {
        const current = get();
        set({ windows: minimizeWindowSet(current.windows, current.windowOrder, false) });
      },

      snapWindow: (instanceId, snap) => {
        const current = get();
        if (current.isTransitioning) return;
        const window = current.windows[instanceId];
        if (!window || window.snap === snap) return;
        if (snap === "none") {
          const rect = window.preSnapRect ?? window;
          set({
            windows: {
              ...current.windows,
              [instanceId]: {
                ...window,
                snap: "none",
                x: rect.x,
                y: rect.y,
                width: rect.width,
                height: rect.height,
                preSnapRect: undefined,
              },
            },
          });
          return;
        }

        const rect = computeSnapRect(snap, options.layout.getBounds(false), window);
        if (!rect) return;
        const preSnapRect =
          window.snap === "none"
            ? { x: window.x, y: window.y, width: window.width, height: window.height }
            : (window.preSnapRect ?? {
                x: window.x,
                y: window.y,
                width: window.width,
                height: window.height,
              });
        set({
          windows: {
            ...current.windows,
            [instanceId]: { ...window, snap, ...rect, preSnapRect },
          },
        });
      },

      toggleMaximize: (instanceId) => {
        const current = get();
        const window = current.windows[instanceId];
        if (!window) return;
        if (!current.isTransitioning) play("shell-maximize-toggle");
        get().snapWindow(instanceId, window.snap === "maximized" ? "none" : "maximized");
      },

      updateWindowPosition: (instanceId, x, y) => {
        const current = get();
        const window = current.windows[instanceId];
        if (window) set({ windows: { ...current.windows, [instanceId]: { ...window, x, y } } });
      },

      updateWindowSize: (instanceId, width, height) => {
        const current = get();
        const window = current.windows[instanceId];
        if (window) {
          set({ windows: { ...current.windows, [instanceId]: { ...window, width, height } } });
        }
      },

      updateWindowRect: (instanceId, x, y, width, height) => {
        const current = get();
        const window = current.windows[instanceId];
        if (window) {
          set({
            windows: {
              ...current.windows,
              [instanceId]: { ...window, x, y, width, height },
            },
          });
        }
      },

      setWindowTitle: (instanceId, title) => {
        const current = get();
        const window = current.windows[instanceId];
        if (window) {
          set({ windows: { ...current.windows, [instanceId]: { ...window, title } } });
        }
      },

      navigateScreen: (instanceId, screen, params) => {
        const current = get();
        const window = current.windows[instanceId];
        if (!window?.screenStack) return;
        const definition = options.lookupApp(window.appId)?.windows[window.windowType];
        if (!definition?.screens?.screens[screen]) {
          warn(`[OS] Unknown screen: ${screen} for ${instanceId}`);
          return;
        }
        const screenStack: WindowScreenStack = {
          current: screen,
          params,
          history: [
            ...window.screenStack.history,
            { screen: window.screenStack.current, params: window.screenStack.params },
          ],
        };
        set({
          windows: {
            ...current.windows,
            [instanceId]: { ...window, screenStack },
          },
        });
      },

      goBackScreen: (instanceId) => {
        const current = get();
        const window = current.windows[instanceId];
        if (!window?.screenStack || window.screenStack.history.length === 0) return;
        const previous = window.screenStack.history.at(-1);
        if (!previous) return;
        const screenStack: WindowScreenStack = {
          current: previous.screen,
          params: previous.params,
          history: window.screenStack.history.slice(0, -1),
        };
        set({
          windows: {
            ...current.windows,
            [instanceId]: { ...window, screenStack },
          },
        });
      },

      unfocusWindow: () => set({ focusedWindowId: null }),

      getAppContext: (appId) => ({
        appId,
        createWindow: (windowType, props) => get().createWindow(appId, windowType, props),
        closeWindow: (instanceId) => get().closeWindow(instanceId),
        closeAllWindows: () => {
          const process = get().processes[appId];
          if (!process) return;
          for (const instanceId of [...process.windowIds]) get().closeWindow(instanceId);
        },
        getWindows: () => {
          const process = get().processes[appId];
          return process
            ? process.windowIds.map((instanceId) => get().windows[instanceId]).filter(Boolean)
            : [];
        },
        quit: () => get().quitApp(appId),
      }),

      getAppMenuContext: (appId) => ({
        ...get().getAppContext(appId),
        focusedWindowId: get().focusedWindowId,
      }),

      restoreApps: async () => {
        const current = get();
        if (current.restorationDone) return;
        set({ restorationDone: true });
        for (const appId of Object.keys(current.processes)) {
          const app = options.lookupApp(appId);
          if (!app?.onRestore) continue;
          try {
            const keep = await Promise.resolve(app.onRestore(get().getAppContext(appId)));
            if (keep === false) {
              suppressLifecycleCue = true;
              try {
                await get().quitApp(appId);
              } finally {
                suppressLifecycleCue = false;
              }
            }
          } catch (error) {
            reportError(`[OS] onRestore error for ${appId}:`, error);
          }
        }
      },
    }),
    {
      name: options.persistName ?? "os-store",
      partialize: (state) => ({
        processes: state.processes,
        windows: state.windows,
        windowOrder: state.windowOrder,
        focusedWindowId: state.focusedWindowId,
        exclusiveAppId: state.exclusiveAppId,
        exclusiveWindowId: state.exclusiveWindowId,
        windowCounter: state.windowCounter,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        store.setState({
          ...repairPersistedWindowState(state, options),
          isTransitioning: false,
        });
      },
    },
  );

  store = create<WindowManagerState>()(creator);
  return store;
}

export function createWindowActionBridge(store: WindowStore) {
  return {
    get focusWindow() {
      return store.getState().focusWindow;
    },
    get closeWindow() {
      return store.getState().closeWindow;
    },
    get minimizeWindow() {
      return store.getState().minimizeWindow;
    },
    get snapWindow() {
      return store.getState().snapWindow;
    },
    get toggleMaximize() {
      return store.getState().toggleMaximize;
    },
    get updateWindowPosition() {
      return store.getState().updateWindowPosition;
    },
    get updateWindowRect() {
      return store.getState().updateWindowRect;
    },
    get setWindowTitle() {
      return store.getState().setWindowTitle;
    },
    get navigateScreen() {
      return store.getState().navigateScreen;
    },
    get goBackScreen() {
      return store.getState().goBackScreen;
    },
  };
}
