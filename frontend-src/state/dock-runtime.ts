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

export const NORI_DOCK_INTERACTION = {
  PRESS_CUE_DEBOUNCE_MS: 45,
  LONG_PRESS_MS: 500,
  ACTIVE_REBOUNCE_GUARD_MS: 320,
  PRESS_HOLD_MS: 200,
  MAX_SCALE: 1.7,
  HOVER_LERP: 0.2,
  REST_LERP: 0.12,
  SCALE_SETTLE_EPSILON: 0.002,
  POSITION_SETTLE_EPSILON: 0.1,
  WIDTH_SETTLE_EPSILON: 0.5,
  STYLE_EPSILON: 0.05,
  ITEM_STYLE_EPSILON: 0.001,
  DOWNLOAD_BOUNCE_MS: 460,
  DOWNLOAD_CUE_DEBOUNCE_MS: 1_000,
} as const;

export interface DockResponsiveLayout {
  baseIconSize: number;
  maxScale: number;
  effectWidth: number;
  gap: number;
  separatorWidth: number;
  padding: number;
  borderRadius: number;
}

/** Exact responsive layout returned by the shipped UGe hook. */
export function getNoriDockResponsiveLayout(
  viewportWidth: number,
  viewportHeight: number,
): DockResponsiveLayout {
  const shortestSide = Math.min(viewportWidth, viewportHeight);
  let baseIconSize: number;
  let effectWidth: number;

  if (!Number.isFinite(shortestSide) || shortestSide <= 0) {
    baseIconSize = 64;
    effectWidth = 240;
  } else if (shortestSide < 480) {
    baseIconSize = Math.max(40, shortestSide * 0.08);
    effectWidth = shortestSide * 0.4;
  } else if (shortestSide < 768) {
    baseIconSize = Math.max(48, shortestSide * 0.07);
    effectWidth = shortestSide * 0.35;
  } else if (shortestSide < 1024) {
    baseIconSize = Math.max(56, shortestSide * 0.06);
    effectWidth = shortestSide * 0.3;
  } else {
    baseIconSize = Math.max(64, Math.min(80, shortestSide * 0.05));
    effectWidth = 300;
  }

  const gap = Math.max(4, baseIconSize * 0.08);
  const separatorWidth = Math.max(8, baseIconSize * 0.15);
  return {
    baseIconSize,
    maxScale: NORI_DOCK_INTERACTION.MAX_SCALE,
    effectWidth,
    gap,
    separatorWidth,
    padding: gap,
    borderRadius: Math.max(12, baseIconSize * 0.4),
  };
}

export function mapDockItemIndex(index: number, separatorIndex: number): number {
  return separatorIndex >= 0 && index >= separatorIndex ? index + 1 : index;
}

export function computeDockMagnificationScales(
  slotCenters: readonly number[],
  pointerX: number | null,
  separatorIndex: number,
  maxScale: number,
  effectWidth: number,
): number[] {
  if (pointerX === null) return slotCenters.map(() => 1);
  const left = pointerX - effectWidth / 2;
  const right = pointerX + effectWidth / 2;
  return slotCenters.map((center, index) => {
    if (index === separatorIndex || center < left || center > right) return 1;
    const angle = ((center - left) / effectWidth) * 2 * Math.PI;
    const clamped = Math.min(Math.max(angle, 0), 2 * Math.PI);
    const influence = (1 - Math.cos(clamped)) / 2;
    return 1 + influence * (maxScale - 1);
  });
}

export function computeDockSlotCenters(
  scales: readonly number[],
  layout: Pick<DockResponsiveLayout, "baseIconSize" | "gap" | "separatorWidth">,
  separatorIndex: number,
): number[] {
  let cursor = 0;
  return scales.map((scale, index) => {
    if (index === separatorIndex) {
      const center = cursor + layout.separatorWidth / 2;
      cursor += layout.separatorWidth;
      return center;
    }
    const width = layout.baseIconSize * scale;
    const center = cursor + width / 2;
    cursor += width + layout.gap;
    return center;
  });
}

export function computeDockContentWidth(
  centers: readonly number[],
  scales: readonly number[],
  layout: Pick<DockResponsiveLayout, "baseIconSize" | "gap" | "separatorWidth">,
  separatorIndex: number,
  appCount: number,
): number {
  if (centers.length === 0) {
    return appCount > 0
      ? appCount * (layout.baseIconSize + layout.gap) - layout.gap +
          (separatorIndex >= 0 ? layout.separatorWidth : 0)
      : 0;
  }

  let right = 0;
  for (let index = 0; index < centers.length; index += 1) {
    const halfWidth =
      index === separatorIndex
        ? layout.separatorWidth / 2
        : (layout.baseIconSize * (scales[index] ?? 1)) / 2;
    right = Math.max(right, (centers[index] ?? 0) + halfWidth);
  }
  return right;
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

export interface DockWindowItem {
  instanceId: string;
  title: string;
  minimized: boolean;
  focused: boolean;
}

export function selectDockWindowItems(
  store: WindowStore,
  registry: WindowAppRegistry,
  appId: string,
  formatWindowNumber: (index: number) => string = (index) => String(index),
): DockWindowItem[] {
  const state = store.getState();
  const app = registry.lookupApp(appId);
  const ids = state.windowOrder.filter((instanceId) => state.windows[instanceId]?.appId === appId);
  const rawTitles = ids.map((instanceId) => {
    const window = state.windows[instanceId];
    const definition = window ? app?.windows[window.windowType] : undefined;
    return window?.title || definition?.title || app?.title || appId;
  });
  const counts = new Map<string, number>();
  for (const title of rawTitles) counts.set(title, (counts.get(title) ?? 0) + 1);
  const seen = new Map<string, number>();

  return ids.map((instanceId, index) => {
    const window = state.windows[instanceId];
    const raw = rawTitles[index] ?? appId;
    let title = raw;
    if ((counts.get(raw) ?? 0) > 1) {
      const number = (seen.get(raw) ?? 0) + 1;
      seen.set(raw, number);
      title = `${raw} - ${formatWindowNumber(number)}`;
    }
    return {
      instanceId,
      title,
      minimized: window?.minimized ?? false,
      focused: instanceId === state.focusedWindowId,
    };
  });
}

export function isDockAppMinimized(store: WindowStore, appId: string): boolean {
  const state = store.getState();
  const ids = state.windowOrder.filter((instanceId) => state.windows[instanceId]?.appId === appId);
  return ids.length > 0 && ids.every((instanceId) => state.windows[instanceId]?.minimized);
}

/** Exact Dock context-menu show/hide behavior. */
export function toggleDockAppWindows(store: WindowStore, appId: string): void {
  const state = store.getState();
  const ids = state.windowOrder.filter((instanceId) => state.windows[instanceId]?.appId === appId);
  if (ids.length === 0) return;
  if (ids.every((instanceId) => state.windows[instanceId]?.minimized)) {
    const last = ids.at(-1);
    if (last) store.getState().focusWindow(last);
    return;
  }
  for (const instanceId of ids) store.getState().minimizeWindow(instanceId);
}
