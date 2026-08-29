import { useMemo, type CSSProperties, type ReactNode } from "react";
import { useWindowInteraction } from "../hooks/use-window-interaction";
import type { WindowLayoutRuntime } from "../state/window-layout-runtime";
import type { WindowRect, WindowSnap } from "../state/window-store";
import { WindowControls } from "./window-controls";
import { WindowInteractionShield, WindowSnapPreview } from "./window-overlays";
import { WindowResizeHandles } from "./window-resize-handles";

export interface WindowChromeConfig {
  draggable: boolean;
  resizable: boolean;
  closable: boolean;
  minimizable: boolean;
  maximizable: boolean;
}

export const DEFAULT_WINDOW_CHROME_CONFIG: Readonly<WindowChromeConfig> = {
  draggable: true,
  resizable: true,
  closable: true,
  minimizable: true,
  maximizable: true,
};

export interface WindowTitleBarContent {
  left?: ReactNode;
  center?: ReactNode;
  right?: ReactNode;
}

export interface WindowBlurOverlay {
  bgClassName?: string;
  content?: ReactNode;
}

export interface WindowChromeProps {
  instanceId: string;
  title?: ReactNode;
  children?: ReactNode;
  rect: WindowRect;
  preSnapRect?: WindowRect;
  snap?: WindowSnap;
  zIndex?: number;
  focused?: boolean;
  exclusive?: boolean;
  alwaysOnTop?: boolean;
  interactive?: boolean;
  contentBlurred?: boolean | WindowBlurOverlay;
  titleBarContent?: WindowTitleBarContent | null;
  titleBarBackground?: string;
  overlay?: ReactNode;
  windowMotion?: string | null;
  config?: Partial<WindowChromeConfig>;
  layout: WindowLayoutRuntime;
  playCue?: (cue: string) => void;
  onFocus?: (instanceId: string) => void;
  onClose?: (instanceId: string) => void;
  onMinimize?: (instanceId: string) => void;
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
}

function classes(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export function WindowChrome({
  instanceId,
  title,
  children,
  rect,
  preSnapRect,
  snap = "none",
  zIndex,
  focused = false,
  exclusive = false,
  alwaysOnTop = false,
  interactive = true,
  contentBlurred = false,
  titleBarContent = null,
  titleBarBackground,
  overlay,
  windowMotion = null,
  config,
  layout,
  playCue,
  onFocus,
  onClose,
  onMinimize,
  onSnap,
  onToggleMaximize,
  onMove,
  onResize,
}: WindowChromeProps) {
  const chromeConfig = useMemo(
    () => ({ ...DEFAULT_WINDOW_CHROME_CONFIG, ...config }),
    [config],
  );
  const maximized = snap === "maximized";
  const snapped = snap !== "none";
  const verticalMaximized = snap === "vertical-maximized";
  const blur =
    contentBlurred === true
      ? ({} satisfies WindowBlurOverlay)
      : typeof contentBlurred === "object"
        ? contentBlurred
        : null;

  const interaction = useWindowInteraction({
    instanceId,
    rect,
    preSnapRect,
    snap,
    layout,
    alwaysOnTop,
    exclusive,
    draggable: chromeConfig.draggable,
    resizable: chromeConfig.resizable,
    maximizable: chromeConfig.maximizable,
    playCue,
    onFocus,
    onSnap,
    onToggleMaximize,
    onMove,
    onResize,
  });

  const effectiveZIndex =
    zIndex ??
    (exclusive
      ? layout.layers.exclusive
      : alwaysOnTop
        ? layout.layers.alwaysOnTop
        : layout.layers.window);

  const rootStyle: CSSProperties = exclusive
    ? {
        top: 48,
        bottom: 16,
        left: 0,
        right: 400,
        marginLeft: "auto",
        marginRight: "auto",
        width: "auto",
        height: "auto",
        maxWidth: "calc(100% - 32px)",
        maxHeight: "calc(100vh - 64px)",
        aspectRatio: "4 / 3",
        minHeight: "calc((100vh - 64px) * 0.7)",
        zIndex: effectiveZIndex,
      }
    : {
        left: rect.x,
        top: rect.y,
        width: rect.width,
        height: rect.height,
        zIndex: effectiveZIndex,
      };

  const blurOverlay = contentBlurred === true || blur !== null;

  return (
    <>
      <WindowInteractionShield
        active={interaction.dragging || interaction.resizing}
        cursor={interaction.cursor}
      />
      <WindowSnapPreview
        snap={interaction.snapPreview}
        windowRect={interaction.liveRectRef.current}
        layout={layout}
      />

      <div
        ref={interaction.rootRef}
        className="fixed"
        style={{
          ...rootStyle,
          isolation: "isolate",
          pointerEvents: interactive ? "auto" : "none",
        }}
      >
        <div
          className={classes(
            "bg-popover text-popover-foreground flex h-full w-full flex-col rounded-lg border shadow-lg",
            "relative overflow-hidden nori-window-glass gradient-border",
            exclusive && "nori-window-exclusive",
            !exclusive && !maximized && "min-w-[280px] min-h-[180px]",
          )}
          data-focused={focused ? "true" : undefined}
          data-window-motion={windowMotion ?? undefined}
          onMouseDown={() => onFocus?.(instanceId)}
        >
          <div className="absolute left-3 top-0 z-40 flex h-9 items-center">
            <WindowControls
              instanceId={instanceId}
              closable={chromeConfig.closable}
              minimizable={chromeConfig.minimizable}
              maximizable={chromeConfig.maximizable}
              maximized={maximized}
              exclusive={exclusive}
              onClose={onClose}
              onMinimize={onMinimize}
              onMaximize={onToggleMaximize}
            />
          </div>

          {!titleBarContent && title != null && (
            <div className="pointer-events-none absolute left-1/2 top-0 z-40 flex h-9 max-w-[60%] -translate-x-1/2 items-center">
              <span className="nori-window-title truncate text-sm font-medium transition-colors duration-200">
                {title}
              </span>
            </div>
          )}

          <div
            className="nori-window-titlebar flex h-9 select-none items-center px-3 transition-colors duration-200"
            style={
              titleBarBackground
                ? {
                    background: titleBarBackground,
                    ...(titleBarContent ? { borderBottom: "none" } : {}),
                  }
                : titleBarContent
                  ? { borderBottom: "none" }
                  : undefined
            }
            onMouseDown={interaction.onTitlebarMouseDown}
            onDoubleClick={interaction.onTitlebarDoubleClick}
          >
            <div className="w-14 shrink-0" />
            {titleBarContent?.left && (
              <div className="flex min-w-0 flex-1 items-center gap-2">
                {titleBarContent.left}
              </div>
            )}
            {titleBarContent?.center && (
              <div className="absolute left-1/2 flex -translate-x-1/2 items-center gap-2">
                {titleBarContent.center}
              </div>
            )}
            {titleBarContent?.right && (
              <div className="ml-auto flex flex-shrink-0 items-center gap-2">
                {titleBarContent.right}
              </div>
            )}
          </div>

          <div
            className="nori-window-content relative min-h-0 flex-1 overflow-hidden"
            inert={!interactive || undefined}
          >
            {children}
          </div>

          {blurOverlay && (
            <div
              className={classes(
                "nori-window-blur-overlay absolute inset-0 z-30 flex items-center justify-center rounded-lg backdrop-blur-[8px]",
                blur?.bgClassName ?? "bg-background/60",
              )}
            >
              {blur?.content}
            </div>
          )}

          {chromeConfig.resizable &&
            !exclusive &&
            (!snapped || verticalMaximized) && (
              <WindowResizeHandles
                onMouseDown={interaction.onResizeMouseDown}
                onDoubleClick={interaction.onResizeDoubleClick}
              />
            )}
        </div>

        {overlay && (
          <div
            className={classes(
              "pointer-events-none absolute inset-0 z-50 overflow-visible",
              interactive && "[&>*]:pointer-events-auto",
            )}
          >
            {overlay}
          </div>
        )}
      </div>
    </>
  );
}
