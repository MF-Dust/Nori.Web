import type { WindowLaunchGuardResult } from "./window-types";
import type { WindowAppRegistry } from "./window-app-registry";

export type AppInstallState = "notDownloaded" | "downloading" | "downloaded";

export const NORI_APP_INSTALL_TIMING = {
  DOWNLOAD_MS: 1_800,
  SETTLE_MS: 280,
  STAGGER_MS: 320,
  DAMAGE_MS: 2_600,
} as const;

export interface AppInstallRuntime {
  getState(appId: string): AppInstallState;
  isDownloaded(appId: string): boolean;
  isDamaged(appId: string): boolean;
  subscribe(appId: string, listener: () => void): () => void;
  subscribeDamage(appId: string, listener: () => void): () => void;
  /**
   * Mirrors the shipped fact-driven installer. The first ready sync resolves
   * states immediately; later newly-satisfied apps animate in with staggering.
   */
  syncFacts(facts: ReadonlySet<string>, ready?: boolean): void;
  launchGuard(request: { appId: string }): WindowLaunchGuardResult;
  dispose(): void;
}

export interface CreateAppInstallRuntimeOptions {
  registry: WindowAppRegistry;
  playCue?: (cue: string) => void;
  setTimeout?: typeof globalThis.setTimeout;
  clearTimeout?: typeof globalThis.clearTimeout;
}

export function createAppInstallRuntime(
  options: CreateAppInstallRuntimeOptions,
): AppInstallRuntime {
  const installable = options.registry.listApps().filter((app) => app.installWhen);
  const states = new Map<string, AppInstallState>();
  const stateListeners = new Map<string, Set<() => void>>();
  const damaged = new Set<string>();
  const damageListeners = new Map<string, Set<() => void>>();
  const acquired = new Set<string>();
  const timers = new Set<ReturnType<typeof globalThis.setTimeout>>();
  const damageTimers = new Map<
    string,
    ReturnType<typeof globalThis.setTimeout>
  >();
  const schedule = options.setTimeout ?? globalThis.setTimeout.bind(globalThis);
  const cancel = options.clearTimeout ?? globalThis.clearTimeout.bind(globalThis);
  let initialized = false;
  let disposed = false;

  for (const app of installable) states.set(app.id, "notDownloaded");

  const emit = (map: Map<string, Set<() => void>>, appId: string) => {
    for (const listener of map.get(appId) ?? []) listener();
  };

  const setState = (appId: string, state: AppInstallState) => {
    if (states.get(appId) === state) return;
    states.set(appId, state);
    emit(stateListeners, appId);
  };

  const addTimer = (callback: () => void, delay: number) => {
    const timer = schedule(() => {
      timers.delete(timer);
      if (!disposed) callback();
    }, delay);
    timers.add(timer);
    return timer;
  };

  const subscribe = (
    map: Map<string, Set<() => void>>,
    appId: string,
    listener: () => void,
  ) => {
    let listeners = map.get(appId);
    if (!listeners) {
      listeners = new Set();
      map.set(appId, listeners);
    }
    listeners.add(listener);
    return () => {
      listeners?.delete(listener);
      if (listeners?.size === 0) map.delete(appId);
    };
  };

  return {
    getState(appId) {
      return states.get(appId) ?? "downloaded";
    },
    isDownloaded(appId) {
      return (states.get(appId) ?? "downloaded") === "downloaded";
    },
    isDamaged(appId) {
      return damaged.has(appId);
    },
    subscribe(appId, listener) {
      return subscribe(stateListeners, appId, listener);
    },
    subscribeDamage(appId, listener) {
      return subscribe(damageListeners, appId, listener);
    },
    syncFacts(facts, ready = true) {
      if (disposed || installable.length === 0 || !ready) return;

      if (!initialized) {
        initialized = true;
        for (const app of installable) {
          const fact = app.installWhen;
          if (fact && facts.has(fact)) {
            acquired.add(app.id);
            setState(app.id, "downloaded");
          } else {
            setState(app.id, "notDownloaded");
          }
        }
        return;
      }

      const newlyAvailable = [];
      for (const app of installable) {
        if (acquired.has(app.id)) {
          if (states.get(app.id) !== "downloading") {
            setState(app.id, "downloaded");
          }
          continue;
        }

        const fact = app.installWhen;
        if (fact && facts.has(fact)) {
          acquired.add(app.id);
          newlyAvailable.push(app.id);
        } else {
          setState(app.id, "notDownloaded");
        }
      }

      newlyAvailable.forEach((appId, index) => {
        const delay = index * NORI_APP_INSTALL_TIMING.STAGGER_MS;
        addTimer(() => setState(appId, "downloading"), delay);
        addTimer(
          () => setState(appId, "downloaded"),
          delay +
            NORI_APP_INSTALL_TIMING.DOWNLOAD_MS +
            NORI_APP_INSTALL_TIMING.SETTLE_MS,
        );
      });
    },
    launchGuard({ appId }) {
      if ((states.get(appId) ?? "downloaded") === "downloaded") {
        return { type: "allow" };
      }

      const previous = damageTimers.get(appId);
      if (previous) cancel(previous);
      options.playCue?.("shell-dock-damaged-veto");
      damaged.add(appId);
      emit(damageListeners, appId);
      const timer = schedule(() => {
        damageTimers.delete(appId);
        if (disposed) return;
        damaged.delete(appId);
        emit(damageListeners, appId);
      }, NORI_APP_INSTALL_TIMING.DAMAGE_MS);
      damageTimers.set(appId, timer);
      return { type: "veto", reason: "app-not-downloaded" };
    },
    dispose() {
      disposed = true;
      for (const timer of timers) cancel(timer);
      timers.clear();
      for (const timer of damageTimers.values()) cancel(timer);
      damageTimers.clear();
      stateListeners.clear();
      damageListeners.clear();
      damaged.clear();
    },
  };
}
