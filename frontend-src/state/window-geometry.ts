import type {
  ManagedWindow,
  WindowBounds,
  WindowGeometryConfig,
  WindowLayerConfig,
  WindowManagerState,
  WindowRect,
  WindowSnap,
} from "./window-types";

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
