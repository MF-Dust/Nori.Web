import type { WindowAppDefinition, WindowDefinition } from "./window-types";

export interface RegisteredWindowAppDefinition extends WindowAppDefinition {
  pinned?: boolean;
  /** Recovered presentation/catalog metadata used by the desktop shell. */
  title?: string;
  sourceBinding?: string;
  bootstrap?: string;
  installWhen?: string;
  dockWhen?: string;
  accentColor?: string;
  recoveryStatus?: string;
}

export interface WindowAppRegistry {
  register(app: RegisteredWindowAppDefinition): boolean;
  lookupApp(appId: string): RegisteredWindowAppDefinition | undefined;
  lookupWindow(appId: string, windowType: string): WindowDefinition | undefined;
  listApps(): RegisteredWindowAppDefinition[];
  listPinnedApps(): RegisteredWindowAppDefinition[];
  listUnpinnedApps(): RegisteredWindowAppDefinition[];
}

export interface WindowAppRegistryOptions {
  warn?: (message: string) => void;
  hiddenUnpinnedIds?: readonly string[];
}

/**
 * Clean-room form of NormalApp's insertion-ordered Map registry. The shipped
 * desktop excludes system/debug from its unpinned launcher list even when an
 * app explicitly opts out of pinning.
 */
export function createWindowAppRegistry(
  initialApps: readonly RegisteredWindowAppDefinition[] = [],
  options: WindowAppRegistryOptions = {},
): WindowAppRegistry {
  const apps = new Map<string, RegisteredWindowAppDefinition>();
  const warn = options.warn ?? ((message: string) => console.warn(message));
  const hiddenUnpinnedIds = new Set(options.hiddenUnpinnedIds ?? ["system", "debug"]);

  const register = (app: RegisteredWindowAppDefinition): boolean => {
    if (apps.has(app.id)) {
      warn(`[OS Registry] App already registered: ${app.id}`);
      return false;
    }
    apps.set(app.id, app);
    return true;
  };

  for (const app of initialApps) register(app);

  return {
    register,
    lookupApp(appId) {
      return apps.get(appId);
    },
    lookupWindow(appId, windowType) {
      return apps.get(appId)?.windows[windowType];
    },
    listApps() {
      return Array.from(apps.values());
    },
    listPinnedApps() {
      return Array.from(apps.values()).filter((app) => app.pinned !== false);
    },
    listUnpinnedApps() {
      return Array.from(apps.values()).filter(
        (app) => app.pinned === false && !hiddenUnpinnedIds.has(app.id),
      );
    },
  };
}
