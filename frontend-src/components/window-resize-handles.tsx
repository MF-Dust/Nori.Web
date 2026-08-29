import { memo, type MouseEvent } from "react";
import {
  NORI_RESIZE_CURSORS,
  NORI_RESIZE_DIRECTIONS,
  type WindowResizeDirection,
} from "./window-interaction";

const HANDLE_STYLE: Readonly<Record<WindowResizeDirection, React.CSSProperties>> = {
  n: { top: -4, left: 8, right: 8, height: 8, cursor: NORI_RESIZE_CURSORS.n },
  s: { bottom: -4, left: 8, right: 8, height: 8, cursor: NORI_RESIZE_CURSORS.s },
  e: { right: -4, top: 8, bottom: 8, width: 8, cursor: NORI_RESIZE_CURSORS.e },
  w: { left: -4, top: 8, bottom: 8, width: 8, cursor: NORI_RESIZE_CURSORS.w },
  ne: { top: -4, right: -4, width: 12, height: 12, cursor: NORI_RESIZE_CURSORS.ne },
  nw: { top: -4, left: -4, width: 12, height: 12, cursor: NORI_RESIZE_CURSORS.nw },
  se: { bottom: -4, right: -4, width: 12, height: 12, cursor: NORI_RESIZE_CURSORS.se },
  sw: { bottom: -4, left: -4, width: 12, height: 12, cursor: NORI_RESIZE_CURSORS.sw },
};

export interface WindowResizeHandlesProps {
  onMouseDown(
    event: MouseEvent<HTMLDivElement>,
    direction: WindowResizeDirection,
  ): void;
  onDoubleClick(direction: WindowResizeDirection): void;
}

export const WindowResizeHandles = memo(function WindowResizeHandles({
  onMouseDown,
  onDoubleClick,
}: WindowResizeHandlesProps) {
  return (
    <>
      {NORI_RESIZE_DIRECTIONS.map((direction) => (
        <div
          key={direction}
          className="absolute z-50"
          style={HANDLE_STYLE[direction]}
          data-window-resize={direction}
          onMouseDown={(event) => onMouseDown(event, direction)}
          onDoubleClick={
            direction === "n" || direction === "s"
              ? () => onDoubleClick(direction)
              : undefined
          }
          aria-hidden="true"
        />
      ))}
    </>
  );
});
