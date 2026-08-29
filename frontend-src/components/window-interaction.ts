import type { WindowBounds, WindowRect } from "../state/window-store";

export type WindowResizeDirection =
  | "n"
  | "s"
  | "e"
  | "w"
  | "ne"
  | "nw"
  | "se"
  | "sw";

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

  const maxBottom = bounds.bottom;
  height = Math.max(
    minimums.minHeight,
    Math.min(height, Math.max(minimums.minHeight, maxBottom - clampedY)),
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
