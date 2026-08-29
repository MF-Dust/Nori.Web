import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type RefObject,
} from "react";
import {
  NORI_RESIZE_CURSORS,
  NORI_SNAP_PREVIEW_SOUND_THROTTLE_MS,
  NORI_VERTICAL_MAXIMIZED_TEAROFF_PX,
  clampActiveResize,
  clampVerticalMaximizedDragX,
  computeSnapTearoffRect,
  detectWindowSnapTarget,
  pointerDeltaExceeded,
  resizeFromPointer,
  shouldPreviewVerticalMaximize,
  type DragSnapTarget,
  type WindowResizeDirection,
} from "../components/window-interaction";
import {
  NORI_TOPBAR_HEIGHT,
  type WindowLayoutRuntime,
} from "../state/window-layout-runtime";
import type { WindowRect, WindowSnap } from "../state/window-store";

interface DragSession {
  mouseX: number;
  mouseY: number;
  windowX: number;
  windowY: number;
  activated: boolean;
  startedSnapped: boolean;
  restoreWidth: number;
  restoreHeight: number;
  titlebarFractionX: number;
}

interface ResizeSession extends WindowRect {
  mouseX: number;
  mouseY: number;
}

export interface WindowInteractionCallbacks {
  onFocus?: (instanceId: string) => void;
  onSnap?: (instanceId: string, snap: WindowSnap) => void;
  onToggleMaximize?: (instanceId: string) => void;
  onMove?: (instanceId: string, x: number, y: number) => void;
  onResize?: (
    instanceId: string,
    x: number,
    y: number,
    width: number,
    height: number,
  ) => void;
  playCue?: (cue: string) => void;
}

export interface UseWindowInteractionOptions extends WindowInteractionCallbacks {
  instanceId: string;
  rect: WindowRect;
  preSnapRect?: WindowRect;
  snap: WindowSnap;
  layout: WindowLayoutRuntime;
  alwaysOnTop?: boolean;
  exclusive?: boolean;
  draggable?: boolean;
  resizable?: boolean;
  maximizable?: boolean;
}

export interface WindowInteractionController {
  rootRef: RefObject<HTMLDivElement | null>;
  liveRectRef: RefObject<WindowRect>;
  dragging: boolean;
  resizing: boolean;
  cursor: string;
  snapPreview: WindowSnap | null;
  onTitlebarMouseDown(event: ReactMouseEvent<HTMLElement>): void;
  onTitlebarDoubleClick(event: ReactMouseEvent<HTMLElement>): void;
  onResizeMouseDown(
    event: ReactMouseEvent<HTMLElement>,
    direction: WindowResizeDirection,
  ): void;
  onResizeDoubleClick(direction: WindowResizeDirection): void;
}

function writeRect(element: HTMLDivElement | null, rect: WindowRect) {
  if (!element) return;
  element.style.left = `${rect.x}px`;
  element.style.top = `${rect.y}px`;
  element.style.width = `${rect.width}px`;
  element.style.height = `${rect.height}px`;
}

export function useWindowInteraction({
  instanceId,
  rect,
  preSnapRect,
  snap,
  layout,
  alwaysOnTop = false,
  exclusive = false,
  draggable = true,
  resizable = true,
  maximizable = true,
  onFocus,
  onSnap,
  onToggleMaximize,
  onMove,
  onResize,
  playCue,
}: UseWindowInteractionOptions): WindowInteractionController {
  const rootRef = useRef<HTMLDivElement>(null);
  const liveRectRef = useRef<WindowRect>({ ...rect });
  const dragSessionRef = useRef<DragSession | null>(null);
  const resizeSessionRef = useRef<ResizeSession | null>(null);
  const resizeDirectionRef = useRef<WindowResizeDirection | null>(null);
  const snapRef = useRef(snap);
  const alwaysOnTopRef = useRef(alwaysOnTop);
  const lastPreviewCueRef = useRef(0);

  const [dragging, setDragging] = useState(false);
  const [resizing, setResizing] = useState(false);
  const [cursor, setCursor] = useState("default");
  const [dragSnapPreview, setDragSnapPreview] = useState<DragSnapTarget | null>(null);
  const [resizeSnapPreview, setResizeSnapPreview] = useState<WindowSnap | null>(null);

  snapRef.current = snap;
  alwaysOnTopRef.current = alwaysOnTop;

  if (!dragSessionRef.current && !resizeSessionRef.current) {
    liveRectRef.current = { ...rect };
  }

  useEffect(() => {
    if (!dragSessionRef.current && !resizeSessionRef.current) {
      writeRect(rootRef.current, rect);
    }
  }, [rect]);

  const applyLiveRect = useCallback((next: WindowRect) => {
    liveRectRef.current = next;
    writeRect(rootRef.current, next);
  }, []);

  const playPreviewCue = useCallback(() => {
    const now = performance.now();
    if (now - lastPreviewCueRef.current < NORI_SNAP_PREVIEW_SOUND_THROTTLE_MS) return;
    lastPreviewCueRef.current = now;
    playCue?.("shell-snap-preview-engage");
  }, [playCue]);

  const tearOff = useCallback(
    (session: DragSession, pointer: { x: number; y: number }) => {
      playCue?.("shell-snap-tearoff");
      const restored = computeSnapTearoffRect({
        pointer,
        restoreWidth: session.restoreWidth,
        restoreHeight: session.restoreHeight,
        titlebarFractionX: session.titlebarFractionX,
        top: NORI_TOPBAR_HEIGHT,
      });
      session.windowX = restored.x;
      session.windowY = restored.y;
      session.mouseX = pointer.x;
      session.mouseY = pointer.y;
      session.startedSnapped = false;
      applyLiveRect(restored);
      onSnap?.(instanceId, "none");
    },
    [applyLiveRect, instanceId, onSnap, playCue],
  );

  const onTitlebarMouseDown = useCallback(
    (event: ReactMouseEvent<HTMLElement>) => {
      if (!draggable || exclusive) return;
      event.preventDefault();
      const current = liveRectRef.current;
      const startedSnapped = snapRef.current !== "none";
      const restoreWidth = preSnapRect?.width ?? current.width;
      const restoreHeight = preSnapRect?.height ?? current.height;
      const titlebarFractionX =
        current.width > 0 ? (event.clientX - current.x) / current.width : 0.5;

      dragSessionRef.current = {
        mouseX: event.clientX,
        mouseY: event.clientY,
        windowX: current.x,
        windowY: current.y,
        activated: false,
        startedSnapped,
        restoreWidth,
        restoreHeight,
        titlebarFractionX,
      };
      onFocus?.(instanceId);
    },
    [draggable, exclusive, instanceId, onFocus, preSnapRect],
  );

  const onTitlebarDoubleClick = useCallback(
    (event: ReactMouseEvent<HTMLElement>) => {
      if (!maximizable || exclusive) return;
      event.preventDefault();
      event.stopPropagation();
      onToggleMaximize?.(instanceId);
    },
    [exclusive, instanceId, maximizable, onToggleMaximize],
  );

  const onResizeMouseDown = useCallback(
    (event: ReactMouseEvent<HTMLElement>, direction: WindowResizeDirection) => {
      const snapped = snapRef.current !== "none";
      const verticalMaximized = snapRef.current === "vertical-maximized";
      if (!resizable || exclusive || (snapped && !verticalMaximized)) return;
      event.preventDefault();
      event.stopPropagation();
      const current = liveRectRef.current;
      resizeSessionRef.current = {
        mouseX: event.clientX,
        mouseY: event.clientY,
        ...current,
      };
      resizeDirectionRef.current = direction;
      onFocus?.(instanceId);
    },
    [exclusive, instanceId, onFocus, resizable],
  );

  const onResizeDoubleClick = useCallback(
    (direction: WindowResizeDirection) => {
      if (!resizable || exclusive || (direction !== "n" && direction !== "s")) return;
      onSnap?.(
        instanceId,
        snapRef.current === "vertical-maximized" ? "none" : "vertical-maximized",
      );
    },
    [exclusive, instanceId, onSnap, resizable],
  );

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      const drag = dragSessionRef.current;
      if (drag) {
        const delta = {
          x: event.clientX - drag.mouseX,
          y: event.clientY - drag.mouseY,
        };
        if (!drag.activated) {
          if (
            !pointerDeltaExceeded(
              { x: drag.mouseX, y: drag.mouseY },
              { x: event.clientX, y: event.clientY },
            )
          ) {
            return;
          }
          drag.activated = true;
          setDragging(true);
          setCursor("grabbing");
          if (drag.startedSnapped && snapRef.current !== "vertical-maximized") {
            tearOff(drag, { x: event.clientX, y: event.clientY });
            return;
          }
        }

        if (drag.startedSnapped && snapRef.current === "vertical-maximized") {
          if (delta.y > NORI_VERTICAL_MAXIMIZED_TEAROFF_PX) {
            tearOff(drag, { x: event.clientX, y: event.clientY });
            return;
          }
          const current = liveRectRef.current;
          applyLiveRect({
            ...current,
            x: clampVerticalMaximizedDragX(
              drag.windowX + delta.x,
              current.width,
              window.innerWidth,
            ),
            y: drag.windowY,
          });
          return;
        }

        let x = drag.windowX + (event.clientX - drag.mouseX);
        let y = drag.windowY + (event.clientY - drag.mouseY);
        const current = liveRectRef.current;
        if (
          (event.clientX < 0 && x < current.x) ||
          (event.clientX > window.innerWidth && x > current.x)
        ) {
          x = current.x;
        }
        if (
          (event.clientY < 0 && y < current.y) ||
          (event.clientY > window.innerHeight && y > current.y)
        ) {
          y = current.y;
        }

        const bounds = layout.getBounds(alwaysOnTopRef.current);
        y = Math.max(bounds.top, y);
        y = Math.min(Math.max(bounds.top, bounds.bottom - current.height), y);

        const nextTarget = detectWindowSnapTarget(
          { x: event.clientX, y: event.clientY },
          window.innerWidth,
          window.innerHeight,
        );
        if (nextTarget !== dragSnapPreview) {
          if (nextTarget) playPreviewCue();
          setDragSnapPreview(nextTarget);
        }

        applyLiveRect({ ...current, x, y });
        return;
      }

      const resize = resizeSessionRef.current;
      const direction = resizeDirectionRef.current;
      if (!resize || !direction) return;
      if (!resizing) {
        if (
          !pointerDeltaExceeded(
            { x: resize.mouseX, y: resize.mouseY },
            { x: event.clientX, y: event.clientY },
          )
        ) {
          return;
        }
        setResizing(true);
        setCursor(NORI_RESIZE_CURSORS[direction]);
        if (
          snapRef.current === "vertical-maximized" &&
          (direction.includes("n") || direction.includes("s"))
        ) {
          onSnap?.(instanceId, "none");
        }
      }

      const tentative = resizeFromPointer(
        direction,
        resize,
        { x: event.clientX, y: event.clientY },
        layout.geometry,
      );
      const next = clampActiveResize(
        direction,
        tentative,
        layout.getBounds(alwaysOnTopRef.current),
        layout.geometry,
      );
      applyLiveRect(next);

      const verticalPreview = shouldPreviewVerticalMaximize(
        direction,
        event.clientY,
        layout.getBounds(false),
      )
        ? "vertical-maximized"
        : null;
      if (verticalPreview !== resizeSnapPreview) {
        if (verticalPreview) playPreviewCue();
        setResizeSnapPreview(verticalPreview);
      }
    };

    const handleMouseUp = () => {
      const drag = dragSessionRef.current;
      if (drag) {
        dragSessionRef.current = null;
        if (drag.activated) {
          const current = liveRectRef.current;
          if (dragSnapPreview) {
            playCue?.("shell-snap-commit");
            onMove?.(instanceId, current.x, current.y);
            onSnap?.(instanceId, dragSnapPreview);
          } else {
            onMove?.(instanceId, current.x, current.y);
          }
        }
        setDragging(false);
        setDragSnapPreview(null);
      }

      const resize = resizeSessionRef.current;
      const direction = resizeDirectionRef.current;
      if (resize) {
        resizeSessionRef.current = null;
        resizeDirectionRef.current = null;
        if (resizing && direction) {
          const current = liveRectRef.current;
          if (resizeSnapPreview === "vertical-maximized") {
            playCue?.("shell-snap-commit");
            onResize?.(
              instanceId,
              current.x,
              resize.y,
              current.width,
              resize.height,
            );
            onSnap?.(instanceId, "vertical-maximized");
          } else {
            onResize?.(
              instanceId,
              current.x,
              current.y,
              current.width,
              current.height,
            );
          }
        }
        setResizing(false);
        setResizeSnapPreview(null);
      }

      setCursor("default");
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [
    applyLiveRect,
    dragSnapPreview,
    instanceId,
    layout,
    onMove,
    onResize,
    onSnap,
    playCue,
    playPreviewCue,
    resizeSnapPreview,
    resizing,
    tearOff,
  ]);

  return {
    rootRef,
    liveRectRef,
    dragging,
    resizing,
    cursor,
    snapPreview: dragging ? dragSnapPreview : resizing ? resizeSnapPreview : null,
    onTitlebarMouseDown,
    onTitlebarDoubleClick,
    onResizeMouseDown,
    onResizeDoubleClick,
  };
}
