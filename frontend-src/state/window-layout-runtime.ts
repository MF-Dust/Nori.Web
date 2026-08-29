import type {
  WindowBounds,
  WindowGeometryConfig,
  WindowLayerConfig,
  WindowLayoutRuntime,
} from "./window-types";

export type { WindowLayoutRuntime } from "./window-types";

/** Exact values recovered from the shared production index chunk. */
export const NORI_WINDOW_GEOMETRY: Readonly<WindowGeometryConfig> = {
  cascadeOffset: { x: 40, y: 30 },
  initialPosition: { x: 100, y: 80 },
  cascadeWrap: 5,
  minWidth: 280,
  minHeight: 180,
};

export const NORI_SHELL_LAYERS = {
  DESKTOP: 100,
  WINDOW: 1_000,
  EXCLUSIVE: 5_000,
  ALWAYS_ON_TOP: 8_000,
  TOPBAR: 9_000,
  DOCK: 9_500,
  EDIT_MENU: 99_997,
  SCAN_OVERLAY: 99_998,
  DOCK_TOOLTIP: 99_999,
  CONNECTION_OVERLAY: 100_000,
  CUTSCENE: 100_001,
  BROWSER_WARNING: 100_002,
  VIEWPORT_GUARD: 100_003,
  GRAPHICS_RECOVERY: 100_004,
  MOBILE_GUARD: 100_005,
  PAT_CURSOR_SHIELD: 100_006,
} as const;

export const NORI_WINDOW_LAYERS: Readonly<WindowLayerConfig> = {
  window: NORI_SHELL_LAYERS.WINDOW,
  alwaysOnTop: NORI_SHELL_LAYERS.ALWAYS_ON_TOP,
  exclusive: NORI_SHELL_LAYERS.EXCLUSIVE,
};

export const NORI_WINDOW_ANIMATION = {
  WINDOW_DURATION: 0.2,
  MAXIMIZE_DURATION: 0.25,
  EXCLUSIVE_DURATION: 0.35,
  EASE: [0.23, 1, 0.32, 1] as const,
  GENIE_APPEAR_DURATION: 0.34,
  GENIE_APPEAR_EASE: [0.34, 1.5, 0.64, 1] as const,
  GENIE_MINIMIZE_DURATION: 0.36,
  GENIE_MINIMIZE_EASE: [0.4, 0, 0.7, 0.15] as const,
  CLOSE_DURATION: 0.18,
  CLOSE_EASE: [0.4, 0, 0.7, 0.2] as const,
  REDUCED_DURATION: 0.12,
  RECEDE_DURATION: 0.45,
  RECEDE_EASE: [0.4, 0, 0.7, 0.2] as const,
  SHELL_RETURN_DELAY: 0.5,
  SHELL_RETURN_STAGGER: 0.05,
  SHELL_RETURN_STAGGER_MAX: 6,
} as const;

export const NORI_TOPBAR_HEIGHT = 32;
export const NORI_DOCK_BOTTOM_OFFSET = 8;
export const NORI_EXCLUSIVE_TRANSITION_MS = 300;
export const NORI_SNAP_EDGE_PX = 12;
export const NORI_SNAP_CORNER_PX = 60;

export interface WindowViewport {
  width: number;
  height: number;
}

export type WindowViewportProvider = () => WindowViewport;

/**
 * Responsive dock reservation recovered from the shipped shared index chunk.
 * The result already includes the vertical padding on both sides of the dock.
 */
export function getNoriDockReservedHeight(viewport: WindowViewport): number {
  const shortestSide = Math.min(viewport.width, viewport.height);
  if (!Number.isFinite(shortestSide)) return 80;

  let dockSize: number;
  if (shortestSide < 480) {
    dockSize = Math.max(40, shortestSide * 0.08);
  } else if (shortestSide < 768) {
    dockSize = Math.max(48, shortestSide * 0.07);
  } else if (shortestSide < 1024) {
    dockSize = Math.max(56, shortestSide * 0.06);
  } else {
    dockSize = Math.max(64, Math.min(80, shortestSide * 0.05));
  }

  const verticalPadding = Math.max(4, dockSize * 0.08);
  return dockSize + verticalPadding * 2;
}

export function getBrowserWindowViewport(): WindowViewport {
  if (typeof window === "undefined") return { width: 0, height: 0 };
  return { width: window.innerWidth, height: window.innerHeight };
}

/**
 * Recovered work-area rule: all windows start below the 32px topbar. Ordinary
 * windows also reserve the responsive dock height plus its 8px bottom offset;
 * always-on-top windows may use the viewport all the way to the bottom edge.
 */
export function getNoriWindowBounds(
  alwaysOnTop: boolean,
  viewport: WindowViewport,
): WindowBounds {
  const bottom = alwaysOnTop
    ? viewport.height
    : viewport.height - getNoriDockReservedHeight(viewport) - NORI_DOCK_BOTTOM_OFFSET;
  return {
    viewportWidth: viewport.width,
    viewportHeight: viewport.height,
    top: NORI_TOPBAR_HEIGHT,
    bottom,
  };
}

export function createNoriWindowLayoutRuntime(
  getViewport: WindowViewportProvider = getBrowserWindowViewport,
): WindowLayoutRuntime {
  return {
    layers: NORI_WINDOW_LAYERS,
    geometry: NORI_WINDOW_GEOMETRY,
    exclusiveTransitionMs: NORI_EXCLUSIVE_TRANSITION_MS,
    getBounds(alwaysOnTop) {
      return getNoriWindowBounds(alwaysOnTop, getViewport());
    },
  };
}
