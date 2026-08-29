import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  clampWindowRect,
  computeSnapRect,
  minimizeWindowSet,
  nextWindowZIndex,
  selectTopWindow,
} from "./window-geometry";
import { repairPersistedWindowState } from "./window-repair";
import type {
  ManagedWindow,
  PersistedWindowManagerState,
  WindowAppContext,
  WindowConfig,
  WindowManagerState,
  WindowProcess,
  WindowRect,
  WindowScreenHistoryEntry,
  WindowScreenStack,
  WindowStore,
  WindowStoreOptions,
} from "./window-types";

export * from "./window-types";
export * from "./window-geometry";
export * from "./window-repair";

export function createWindowStore(options: WindowStoreOptions): WindowStore {
  const warn = options.warn ?? ((message: string) => console.warn(message));
  const reportError =
    options.error ?? ((message: string, error?: unknown) => console.error(message, error));
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

  const creator = persist<WindowManagerState, [], [], PersistedWindowManagerState>(
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
                if (
                  appId === request.appId ||
                  !options.lookupApp(appId)?.runtime?.ownsCartridge
                ) {
                  continue;
                }
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
            const state = get();
            set({
              processes: { ...state.processes, [request.appId]: nextProcess },
              windows: minimizeWindowSet(state.windows, state.windowOrder, true),
              exclusiveAppId: request.appId,
              exclusiveWindowId: null,
            });
          } else {
            set((state) => ({
              processes: { ...state.processes, [request.appId]: nextProcess },
            }));
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
            if (!window?.minimizedByExclusive) continue;
            restoredWindows[instanceId] = {
              ...window,
              minimized: false,
              minimizedByExclusive: undefined,
            };
          }

          if (!suppressLifecycleCue) play("shell-exclusive-exit");
          set({ isTransitioning: true });
          setTimeout(() => {
            set({
              processes,
              windows: restoredWindows,
              windowOrder: remainingOrder,
              exclusiveAppId: null,
              exclusiveWindowId: null,
              focusedWindowId: selectTopWindow(restoredWindows, remainingOrder, true),
              isTransitioning: false,
            });
          }, options.layout.exclusiveTransitionMs);
        } else {
          if (
            remainingOrder.length !== current.windowOrder.length &&
            !suppressLifecycleCue
          ) {
            play("shell-window-close");
          }
          set({
            processes,
            windows: remainingWindows,
            windowOrder: remainingOrder,
            focusedWindowId:
              current.focusedWindowId && !remainingWindows[current.focusedWindowId]
                ? selectTopWindow(remainingWindows, remainingOrder, true)
                : current.focusedWindowId,
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
        const screenStack: WindowScreenStack | undefined = definition.screens
          ? { current: definition.screens.initial, history: [] }
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
          zIndex: highestLayer + 1,
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
        set({
          processes,
          windows,
          windowOrder,
          focusedWindowId:
            current.focusedWindowId === instanceId
              ? selectTopWindow(windows, windowOrder, true)
              : current.focusedWindowId,
        });
      },

      focusWindow: (instanceId) => {
        const current = get();
        if (current.isTransitioning) return;
        const window = current.windows[instanceId];
        if (!window || (current.focusedWindowId === instanceId && !window.minimized)) return;

        play(window.minimized ? "shell-window-restore" : "shell-window-focus");
        set({
          focusedWindowId: instanceId,
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
        set({
          windows: { ...current.windows, [instanceId]: { ...window, minimized: true } },
        });
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
        const preSnapRect: WindowRect =
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
        if (!window) return;
        set({ windows: { ...current.windows, [instanceId]: { ...window, x, y } } });
      },

      updateWindowSize: (instanceId, width, height) => {
        const current = get();
        const window = current.windows[instanceId];
        if (!window) return;
        set({
          windows: { ...current.windows, [instanceId]: { ...window, width, height } },
        });
      },

      updateWindowRect: (instanceId, x, y, width, height) => {
        const current = get();
        const window = current.windows[instanceId];
        if (!window) return;
        set({
          windows: {
            ...current.windows,
            [instanceId]: { ...window, x, y, width, height },
          },
        });
      },

      setWindowTitle: (instanceId, title) => {
        const current = get();
        const window = current.windows[instanceId];
        if (!window) return;
        set({ windows: { ...current.windows, [instanceId]: { ...window, title } } });
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

        const previous: WindowScreenHistoryEntry = {
          screen: window.screenStack.current,
          params: window.screenStack.params,
        };
        const screenStack: WindowScreenStack = {
          current: screen,
          params,
          history: [...window.screenStack.history, previous],
        };
        set({
          windows: { ...current.windows, [instanceId]: { ...window, screenStack } },
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
          windows: { ...current.windows, [instanceId]: { ...window, screenStack } },
        });
      },

      unfocusWindow: () => set({ focusedWindowId: null }),

      getAppContext: (appId): WindowAppContext => ({
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
          if (!process) return [];
          return process.windowIds
            .map((instanceId) => get().windows[instanceId])
            .filter((window): window is ManagedWindow => Boolean(window));
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
      partialize: (state): PersistedWindowManagerState => ({
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
        const repaired = repairPersistedWindowState(state, options);
        Object.assign(state, repaired, { isTransitioning: false });
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
