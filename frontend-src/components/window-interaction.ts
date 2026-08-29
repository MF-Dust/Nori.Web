import {
  NORI_SNAP_CORNER_PX,
  NORI_SNAP_EDGE_PX,
  NORI_TOPBAR_HEIGHT,
} from "../state/window-layout-runtime";
import type { WindowBounds, WindowRect, WindowSnap } from "../state/window-store";

export type WindowResizeDirection =
  | "n"
  | "s"
  | "e"
  | "w"
  | "ne"
  | "nw"
  | "se"
  | "sw";

export type DragSnapTarget = Exclude<WindowSnap, "none" | "vertical-maximized">;

export interface PointerPosition {
  x: number;
  y: number;
}

export interface ResizeOrigin extends WindowRect {
  mouseX: number;
  mouseY: number;
}

export interface ResizeMinimums {
  minWidth: number;
  minHeight: number;
}

/**
 * Pure version of the resize math observed in the shipped NormalApp window
 * chrome. Boundary clamping is intentionally a second step because the
 * production code first computes the directional resize and only then clamps
 * it against the desktop work area.
 */
export function resizeFromPointer(
  direction: WindowResizeDirection,
  origin: ResizeOrigin,
  pointer: PointerPosition,
  minimums: ResizeMinimums,
): WindowRect {
  const deltaX = pointer.x - origin.mouseX;
  const deltaY = pointer.y - origin.mouseY;
  let width = origin.width;
  let height = origin.height;
  let x = origin.x;
  let y = origin.y;

  if (direction.includes("e")) {
    width = Math.max(minimums.minWidth, origin.width + deltaX);
  }
  if (direction.includes("w")) {
    const candidate = origin.width - deltaX;
    if (candidate >= minimums.minWidth) {
      width = candidate;
      x = origin.x + deltaX;
    }
  }
  if (direction.includes("s")) {
    height = Math.max(minimums.minHeight, origin.height + deltaY);
  }
  if (direction.includes("n")) {
    const candidate = origin.height - deltaY;
    if (candidate >= minimums.minHeight) {
      height = candidate;
      y = origin.y + deltaY;
    }
  }

  return { x, y, width, height };
}

/**
 * Matches the work-area clamp performed while the shipped window is actively
 * resizing. North/west handles preserve the opposite edge when the desktop
 * boundary clips the tentative position.
 */
export function clampActiveResize(
  direction: WindowResizeDirection,
  rect: WindowRect,
  bounds: WindowBounds,
  minimums: ResizeMinimums,
): WindowRect {
  const clampedY = Math.max(bounds.top, rect.y);
  let height = rect.height;
  if (clampedY > rect.y && direction.includes("n")) {
    height -= clampedY - rect.y;
  }

  height = Math.max(
    minimums.minHeight,
    Math.min(
      height,
      Math.max(minimums.minHeight, bounds.bottom - clampedY),
    ),
  );

  const clampedX = Math.max(0, rect.x);
  let width = rect.width;
  if (clampedX > rect.x && direction.includes("w")) {
    width -= clampedX - rect.x;
  }
  width = Math.max(
    minimums.minWidth,
    Math.min(width, Math.max(minimums.minWidth, bounds.viewportWidth - clampedX)),
  );

  return { x: clampedX, y: clampedY, width, height };
}

export interface SnapTargetOptions {
  edgePx?: number;
  cornerPx?: number;
  topbarHeight?: number;
}

/** Exact FOe snap-zone precedence recovered from NormalApp. */
export function detectWindowSnapTarget(
  pointer: PointerPosition,
  viewportWidth: number,
  viewportHeight: number,
  options: SnapTargetOptions = {},
): DragSnapTarget | null {
  const edge = options.edgePx ?? NORI_SNAP_EDGE_PX;
  const corner = options.cornerPx ?? NORI_SNAP_CORNER_PX;
  const topbarHeight = options.topbarHeight ?? NORI_TOPBAR_HEIGHT;

  const atTop = pointer.y < topbarHeight;
  const atBottomEdge = pointer.y >= viewportHeight - edge;
  const atLeftEdge = pointer.x <= edge;
  const atRightEdge = pointer.x >= viewportWidth - edge;
  const inLeftCornerBand = pointer.x <= corner;
  const inRightCornerBand = pointer.x >= viewportWidth - corner;
  const inBottomCornerBand = pointer.y >= viewportHeight - corner;

  if (atTop && inLeftCornerBand) return "top-left";
  if (atTop && inRightCornerBand) return "top-right";
  if (atBottomEdge && inLeftCornerBand) return "bottom-left";
  if (atBottomEdge && inRightCornerBand) return "bottom-right";
  if (atLeftEdge && inBottomCornerBand) return "bottom-left";
  if (atRightEdge && inBottomCornerBand) return "bottom-right";
  if (atTop) return "maximized";
  if (atLeftEdge) return "left";
  if (atRightEdge) return "right";
  return null;
}

/** Exact BOe edge test used while resizing north/south handles. */
export function shouldPreviewVerticalMaximize(
  direction: WindowResizeDirection,
  pointerY: number,
  bounds: WindowBounds,
  edgePx = NORI_SNAP_EDGE_PX,
): boolean {
  if (direction.includes("n")) return pointerY <= bounds.top + edgePx;
  if (direction.includes("s")) return pointerY >= bounds.bottom - edgePx;
  return false;
}

export interface SnapTearoffInput {
  pointer: PointerPosition;
  restoreWidth: number;
  restoreHeight: number;
  titlebarFractionX: number;
  top: number;
  titlebarPointerOffset?: number;
}

/**
 * The production window keeps the cursor anchored to the same horizontal
 * fraction of the titlebar when a snapped window is torn back into a floating
 * window. The observed titlebar pointer offset is 18 CSS pixels.
 */
export function computeSnapTearoffRect({
  pointer,
  restoreWidth,
  restoreHeight,
  titlebarFractionX,
  top,
  titlebarPointerOffset = 18,
}: SnapTearoffInput): WindowRect {
  return {
    x: pointer.x - restoreWidth * titlebarFractionX,
    y: Math.max(top, pointer.y - titlebarPointerOffset),
    width: restoreWidth,
    height: restoreHeight,
  };
}

export function clampFloatingDrag(
  rect: WindowRect,
  bounds: WindowBounds,
): WindowRect {
  const maxY = Math.max(bounds.top, bounds.bottom - rect.height);
  return {
    ...rect,
    y: Math.min(Math.max(bounds.top, rect.y), maxY),
  };
}

export function clampVerticalMaximizedDragX(
  x: number,
  width: number,
  viewportWidth: number,
): number {
  return Math.min(Math.max(0, x), Math.max(0, viewportWidth - width));
}

export function pointerDeltaExceeded(
  origin: PointerPosition,
  pointer: PointerPosition,
  threshold: number,
): boolean {
  return (
    Math.abs(pointer.x - origin.x) >= threshold ||
    Math.abs(pointer.y - origin.y) >= threshold
  );
}
