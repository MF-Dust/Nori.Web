import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { AppWindow, Check, CircleAlert, Download } from "lucide-react";
import type { DesktopRuntime } from "../state/desktop-runtime";
import {
  NORI_DOCK_INTERACTION,
  activateDockApp,
  computeDockContentWidth,
  computeDockMagnificationScales,
  computeDockSlotCenters,
  getNoriDockResponsiveLayout,
  isDockAppMinimized,
  mapDockItemIndex,
  selectDockApps,
  selectDockWindowItems,
  toggleDockAppWindows,
  type DockAppModel,
  type DockResponsiveLayout,
  type DockWindowItem,
} from "../state/dock-runtime";
import { NORI_APP_INSTALL_TIMING } from "../state/app-install-runtime";
import { NORI_SHELL_LAYERS } from "../state/window-layout-runtime";

export type DockTranslate = (
  key: string,
  variables?: Readonly<Record<string, string | number>>,
) => string;

export interface DesktopDockIconState {
  active: boolean;
  darkened: boolean;
  installState: "notDownloaded" | "downloading" | "downloaded";
}

export interface DesktopDockProps {
  runtime: DesktopRuntime;
  facts?: ReadonlySet<string>;
  className?: string;
  translate?: DockTranslate;
  renderIcon?: (app: DockAppModel, state: DesktopDockIconState) => ReactNode;
  resolveTitle?: (app: DockAppModel) => string;
  getBadgeCount?: (appId: string) => number;
  getBadgeDot?: (appId: string) => boolean;
  getTooltip?: (app: DockAppModel) => ReactNode | undefined;
  formatWindowNumber?: (index: number) => string;
  reducedMotion?: boolean;
  playCue?: (cue: string) => void;
  onMenuOpenChange?: (open: boolean) => void;
}

function defaultTranslate(key: string): string {
  return key;
}

function useResponsiveDockLayout(): DockResponsiveLayout {
  const read = useCallback(() => {
    if (typeof window === "undefined") return getNoriDockResponsiveLayout(0, 0);
    return getNoriDockResponsiveLayout(window.innerWidth, window.innerHeight);
  }, []);
  const [layout, setLayout] = useState(read);
  useEffect(() => {
    const resize = () => setLayout(read());
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [read]);
  return layout;
}

function useInstallState(runtime: DesktopRuntime, appId: string) {
  return useSyncExternalStore(
    useCallback((listener) => runtime.installs.subscribe(appId, listener), [appId, runtime]),
    useCallback(() => runtime.installs.getState(appId), [appId, runtime]),
    () => "downloaded" as const,
  );
}

function useDamaged(runtime: DesktopRuntime, appId: string) {
  return useSyncExternalStore(
    useCallback(
      (listener) => runtime.installs.subscribeDamage(appId, listener),
      [appId, runtime],
    ),
    useCallback(() => runtime.installs.isDamaged(appId), [appId, runtime]),
    () => false,
  );
}

function DefaultDockIcon({ app }: { app: DockAppModel }) {
  return (
    <div
      className="dock-ic flex h-full w-full items-center justify-center bg-white/85 shadow-lg dark:bg-[rgba(35,40,50,0.85)]"
      style={{ borderRadius: "22.5%" }}
    >
      <AppWindow className="h-[55%] w-[55%] text-gray-700 dark:text-gray-200" aria-label={app.title} />
    </div>
  );
}

function DownloadOverlay({
  state,
}: {
  state: "notDownloaded" | "downloading" | "downloaded";
}) {
  if (state === "downloaded") return null;
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
      <div
        className="relative"
        style={{ width: "var(--dock-icon-fill, 88%)", height: "var(--dock-icon-fill, 88%)" }}
      >
        <div
          className="absolute -right-1 -top-1 rounded-full bg-zinc-900/80 p-px transition-opacity"
          style={{ opacity: state === "notDownloaded" ? 1 : 0 }}
        >
          <Download className="size-3.5 text-amber-400" />
        </div>
        <div
          className="absolute inset-x-[14%] bottom-[12%] h-1 overflow-hidden rounded-full bg-white/25 transition-opacity"
          style={{ opacity: state === "downloading" ? 1 : 0 }}
        >
          <div
            className="h-full rounded-full bg-white/90"
            style={{
              width: state === "downloading" ? "100%" : "0%",
              transition: `width ${NORI_APP_INSTALL_TIMING.DOWNLOAD_MS}ms ease-out`,
            }}
          />
        </div>
      </div>
    </div>
  );
}

function DockBadge({ count, size }: { count: number; size: number }) {
  if (count <= 0) return null;
  const label = count > 99 ? "99+" : String(count);
  const height = Math.max(16, Math.round(size * 0.42));
  const fontSize = Math.max(10, Math.round(size * 0.24));
  const padding = Math.round(height * 0.3);
  return (
    <div className="pointer-events-none absolute right-[-4%] top-[-4%]">
      <div
        className="nori-dock-badge flex items-center justify-center rounded-full font-semibold tabular-nums"
        aria-hidden="true"
        style={{
          minWidth: height,
          height,
          padding: `0 ${padding}px`,
          borderRadius: 9999,
          fontSize,
          lineHeight: 1,
        }}
      >
        {label}
      </div>
    </div>
  );
}

function DockDotBadge({ visible, size }: { visible: boolean; size: number }) {
  if (!visible) return null;
  const diameter = Math.max(12, Math.round(size * 0.26));
  return (
    <div className="pointer-events-none absolute right-[-4%] top-[-4%]">
      <div
        className="nori-dock-badge rounded-full"
        aria-hidden="true"
        style={{ width: diameter, height: diameter }}
      />
    </div>
  );
}

interface DockContextMenuProps {
  open: boolean;
  running: boolean;
  minimized: boolean;
  windows: readonly DockWindowItem[];
  translate: DockTranslate;
  onFocusWindow(instanceId: string): void;
  onShowHide(): void;
  onQuit(): void;
  onOpen(): void;
}

function DockContextMenu({
  open,
  running,
  minimized,
  windows,
  translate,
  onFocusWindow,
  onShowHide,
  onQuit,
  onOpen,
}: DockContextMenuProps) {
  if (!open) return null;
  return (
    <div
      className="absolute bottom-full left-1/2 z-50 mb-3 min-w-44 -translate-x-1/2 rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-lg"
      role="menu"
    >
      {running ? (
        <>
          {windows.length > 1 && (
            <>
              {windows.map((window) => (
                <button
                  key={window.instanceId}
                  type="button"
                  className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent"
                  onClick={() => onFocusWindow(window.instanceId)}
                  data-dock-action={`window:${window.instanceId}`}
                >
                  <Check
                    className={`size-3.5 text-foreground ${window.focused ? "fill-current" : "opacity-0"}`}
                  />
                  <span className="truncate">{window.title}</span>
                </button>
              ))}
              <div className="my-1 h-px bg-border" />
            </>
          )}
          <button
            type="button"
            className="w-full rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent"
            onClick={onShowHide}
            data-dock-action="showHide"
          >
            {translate(minimized ? "dock.show" : "dock.hide")}
          </button>
          <button
            type="button"
            className="w-full rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent"
            onClick={onQuit}
            data-dock-action="quit"
          >
            {translate("dock.quit")}
          </button>
        </>
      ) : (
        <button
          type="button"
          className="w-full rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent"
          onClick={onOpen}
          data-dock-action="open"
        >
          {translate("dock.open")}
        </button>
      )}
    </div>
  );
}

interface DesktopDockItemProps {
  runtime: DesktopRuntime;
  app: DockAppModel;
  size: number;
  scale: number;
  center: number;
  active: boolean;
  open: boolean;
  minimized: boolean;
  windowItems: readonly DockWindowItem[];
  animated?: boolean;
  translate: DockTranslate;
  renderIcon?: DesktopDockProps["renderIcon"];
  badgeCount: number;
  badgeDot: boolean;
  tooltip?: ReactNode;
  reducedMotion: boolean;
  playCue?: (cue: string) => void;
  onMenuOpenChange(open: boolean): void;
}

let lastDownloadCueAt = 0;
let lastPressCueAt = 0;

function DesktopDockItem({
  runtime,
  app,
  size,
  scale,
  center,
  active,
  open,
  minimized,
  windowItems,
  animated = false,
  translate,
  renderIcon,
  badgeCount,
  badgeDot,
  tooltip,
  reducedMotion,
  playCue,
  onMenuOpenChange,
}: DesktopDockItemProps) {
  const installState = useInstallState(runtime, app.id);
  const damaged = useDamaged(runtime, app.id);
  const [menuOpen, setMenuOpen] = useState(false);
  const [pressed, setPressed] = useState(false);
  const [newInstallDot, setNewInstallDot] = useState(false);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pressStartedAt = useRef(0);
  const longPressed = useRef(false);
  const previousInstallState = useRef(installState);
  const slotRef = useRef<HTMLDivElement>(null);

  const setMenu = (value: boolean) => {
    setMenuOpen(value);
    onMenuOpenChange(value);
    if (!value) {
      setPressed(false);
      longPressed.current = false;
    }
  };

  useEffect(() => {
    if (previousInstallState.current === "downloading" && installState === "downloaded") {
      const now = performance.now();
      if (now - lastDownloadCueAt >= NORI_DOCK_INTERACTION.DOWNLOAD_CUE_DEBOUNCE_MS) {
        lastDownloadCueAt = now;
        playCue?.("shell-dock-download-complete");
      }
      slotRef.current?.animate(
        [
          { transform: `scale(${scale}) translateY(0)` },
          { transform: `scale(${scale}) translateY(-26%)` },
          { transform: `scale(${scale}) translateY(0)` },
        ],
        {
          duration: NORI_DOCK_INTERACTION.DOWNLOAD_BOUNCE_MS,
          easing: "cubic-bezier(0.34, 1.56, 0.64, 1)",
        },
      );
      if (app.id === "browser" || app.id === "signal") setNewInstallDot(true);
    }
    previousInstallState.current = installState;
  }, [app.id, installState, playCue, scale]);

  useEffect(() => {
    if (open) setNewInstallDot(false);
  }, [open]);

  useEffect(
    () => () => {
      if (longPressTimer.current) clearTimeout(longPressTimer.current);
    },
    [],
  );

  const pointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    setPressed(true);
    pressStartedAt.current = performance.now();
    longPressed.current = false;
    if (event.pointerType !== "touch") {
      const now = performance.now();
      if (now - lastPressCueAt >= NORI_DOCK_INTERACTION.PRESS_CUE_DEBOUNCE_MS) {
        lastPressCueAt = now;
        playCue?.("shell-dock-press");
      }
    }
    longPressTimer.current = setTimeout(() => {
      longPressed.current = true;
      playCue?.("shell-menu-open");
      setMenu(true);
    }, NORI_DOCK_INTERACTION.LONG_PRESS_MS);
  };

  const releasePress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    if (longPressed.current || menuOpen) return;
    const elapsed = performance.now() - pressStartedAt.current;
    const remaining = NORI_DOCK_INTERACTION.PRESS_HOLD_MS - elapsed;
    if (remaining > 0) setTimeout(() => setPressed(false), remaining);
    else setPressed(false);
  };

  const click = () => {
    if (longPressed.current) return;
    void activateDockApp(runtime.store, app.id);
  };

  const contextMenu = (event: ReactPointerEvent<HTMLDivElement> | React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    playCue?.("shell-menu-open");
    setPressed(true);
    setMenu(true);
  };

  const darkened = pressed || menuOpen;
  const tooltipText = damaged
    ? translate("appError.damaged")
    : tooltip ?? app.title;
  const indicatorSize = Math.max(3, size * 0.06);
  const inverseScale = scale === 0 ? 1 : 1 / scale;

  return (
    <div
      ref={slotRef}
      className="dock-item-slot absolute pointer-events-none"
      style={{
        left: center - size / 2,
        bottom: 0,
        width: size,
        height: size,
        transform: `scale(${scale})`,
        transformOrigin: "50% 100%",
        transition: reducedMotion ? "none" : animated ? "opacity 250ms cubic-bezier(0.23, 1, 0.32, 1)" : undefined,
      }}
    >
      <div
        className="dock-item-wrapper group absolute inset-0 flex cursor-default select-none flex-col items-center justify-end pointer-events-auto"
        data-app-id={app.id}
        onClick={click}
        onContextMenu={contextMenu}
        onPointerDown={pointerDown}
        onPointerUp={releasePress}
        onPointerCancel={releasePress}
        onPointerLeave={releasePress}
        style={{ transformOrigin: "50% 100%", willChange: "transform" }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            transformOrigin: "50% 100%",
            transition: reducedMotion
              ? "none"
              : `transform ${pressed ? "var(--dock-press-in, 200ms)" : "var(--dock-press-out, 380ms)"} cubic-bezier(0.22, 1, 0.36, 1), filter 200ms ease-out`,
            transform: pressed
              ? "translateY(var(--dock-press-depth, 2%)) scale(var(--dock-press-scale, 0.95))"
              : "translateY(0%) scale(1)",
            filter: installState !== "downloaded" ? "brightness(0.5)" : undefined,
          }}
        >
          {renderIcon ? (
            renderIcon(app, { active, darkened, installState })
          ) : (
            <div style={darkened ? { filter: "brightness(0.82)" } : undefined} className="h-full w-full">
              <DefaultDockIcon app={app} />
            </div>
          )}
        </div>

        <DownloadOverlay state={installState} />
        {installState === "downloaded" && (
          <>
            <DockBadge count={badgeCount} size={size} />
            <DockDotBadge visible={badgeCount <= 0 && (badgeDot || newInstallDot)} size={size} />
          </>
        )}

        {open && (
          <div
            className="nori-dock-indicator absolute"
            style={{
              bottom: Math.max(-2, -size * 0.05),
              left: "50%",
              width: indicatorSize,
              height: indicatorSize,
              borderRadius: "50%",
              backgroundColor: "rgba(255, 255, 255, 0.8)",
              boxShadow: "0 0 4px rgba(0, 0, 0, 0.3)",
              transform: `translateX(-50%) scale(${inverseScale})`,
              transformOrigin: "50% 100%",
            }}
          />
        )}

        <div
          className={`dock-item-tooltip nori-dock-tooltip absolute pointer-events-none whitespace-nowrap rounded px-2 py-1 text-xs font-medium transition-opacity duration-150 ${
            damaged ? "opacity-100 nori-dock-tooltip-damaged" : "opacity-0 group-hover:opacity-100"
          }`}
          style={{
            bottom: "calc(100% + 8px)",
            left: "50%",
            zIndex: NORI_SHELL_LAYERS.DOCK_TOOLTIP,
            color: "rgba(255, 255, 255, 0.95)",
            backgroundColor: "rgba(0, 0, 0, 0.85)",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.3)",
            transform: `translateX(-50%) scale(${inverseScale})`,
            transformOrigin: "50% 100%",
          }}
        >
          {damaged && <CircleAlert className="mr-1 inline size-3" aria-hidden="true" />}
          {tooltipText}
        </div>

        <DockContextMenu
          open={menuOpen}
          running={open}
          minimized={minimized}
          windows={windowItems}
          translate={translate}
          onFocusWindow={(instanceId) => {
            runtime.store.getState().focusWindow(instanceId);
            setMenu(false);
          }}
          onShowHide={() => {
            toggleDockAppWindows(runtime.store, app.id);
            setMenu(false);
          }}
          onQuit={() => {
            void runtime.store.getState().quitApp(app.id);
            setMenu(false);
          }}
          onOpen={() => {
            void activateDockApp(runtime.store, app.id);
            setMenu(false);
          }}
        />
      </div>
    </div>
  );
}

export function DesktopDock({
  runtime,
  facts = new Set<string>(),
  className = "",
  translate = defaultTranslate,
  renderIcon,
  resolveTitle,
  getBadgeCount = () => 0,
  getBadgeDot = () => false,
  getTooltip,
  formatWindowNumber = (index) => translate("dock.windowNumber", { index }),
  reducedMotion = false,
  playCue,
  onMenuOpenChange,
}: DesktopDockProps) {
  const layout = useResponsiveDockLayout();
  const rootRef = useRef<HTMLDivElement>(null);
  const pointerX = useRef<number | null>(null);
  const menuOpen = useRef(false);
  const menuClosedAt = useRef(0);
  const animationFrame = useRef<number | null>(null);
  const [renderState, setRenderState] = useState<{
    scales: number[];
    centers: number[];
    contentWidth: number;
  }>({ scales: [], centers: [], contentWidth: 0 });

  const processes = runtime.store((state) => state.processes);
  const windows = runtime.store((state) => state.windows);
  const windowOrder = runtime.store((state) => state.windowOrder);
  const focusedWindowId = runtime.store((state) => state.focusedWindowId);
  const exclusiveAppId = runtime.store((state) => state.exclusiveAppId);
  const openAppIds = useMemo(
    () => Object.values(processes).filter((process) => process.windowIds.length > 0).map((process) => process.appId),
    [processes],
  );
  const selection = useMemo(
    () =>
      selectDockApps({
        registry: runtime.registry,
        facts,
        openUnpinnedAppIds: openAppIds,
        resolveTitle: (app) => app.title ?? app.id,
      }),
    [facts, openAppIds, runtime.registry],
  );
  const pinned = selection.pinnedApps.map((app) => ({
    ...app,
    title: resolveTitle?.(app) ?? app.title,
  }));
  const unpinned = selection.unpinnedApps.map((app) => ({
    ...app,
    title: resolveTitle?.(app) ?? app.title,
  }));
  const hasSeparator = pinned.length > 0 && unpinned.length > 0;
  const separatorIndex = hasSeparator ? pinned.length : -1;
  const slotCount = pinned.length + unpinned.length + (hasSeparator ? 1 : 0);
  const allApps = [...pinned, ...unpinned];
  const appCount = allApps.length;
  const activeAppId =
    exclusiveAppId ??
    (focusedWindowId ? windows[focusedWindowId]?.appId ?? null : null);

  const currentScales = useRef<number[]>([]);
  const currentCenters = useRef<number[]>([]);
  const currentWidth = useRef(0);

  const initialize = useCallback(() => {
    const scales = Array(slotCount).fill(1) as number[];
    const centers = computeDockSlotCenters(scales, layout, separatorIndex);
    const width = computeDockContentWidth(centers, scales, layout, separatorIndex, appCount);
    currentScales.current = scales;
    currentCenters.current = centers;
    currentWidth.current = width;
    setRenderState({ scales, centers, contentWidth: width });
  }, [appCount, layout, separatorIndex, slotCount]);

  const animate = useCallback(() => {
    if (menuOpen.current) {
      animationFrame.current = requestAnimationFrame(animate);
      return;
    }
    const targetScales = computeDockMagnificationScales(
      currentCenters.current,
      pointerX.current,
      separatorIndex,
      layout.maxScale,
      layout.effectWidth,
    );
    const targetCenters = computeDockSlotCenters(targetScales, layout, separatorIndex);
    const targetWidth = computeDockContentWidth(
      targetCenters,
      targetScales,
      layout,
      separatorIndex,
      appCount,
    );
    const alpha = pointerX.current === null
      ? NORI_DOCK_INTERACTION.REST_LERP
      : NORI_DOCK_INTERACTION.HOVER_LERP;

    const scales = currentScales.current.map(
      (value, index) => value + ((targetScales[index] ?? 1) - value) * alpha,
    );
    const centers = currentCenters.current.map(
      (value, index) => value + ((targetCenters[index] ?? 0) - value) * alpha,
    );
    const width = currentWidth.current + (targetWidth - currentWidth.current) * alpha;
    currentScales.current = scales;
    currentCenters.current = centers;
    currentWidth.current = width;
    setRenderState({ scales, centers, contentWidth: width });

    let unsettled = Math.abs(width - targetWidth) > NORI_DOCK_INTERACTION.WIDTH_SETTLE_EPSILON;
    if (!unsettled) {
      unsettled = scales.some(
        (value, index) =>
          Math.abs(value - (targetScales[index] ?? 1)) >
          NORI_DOCK_INTERACTION.SCALE_SETTLE_EPSILON,
      );
    }
    if (!unsettled) {
      unsettled = centers.some(
        (value, index) =>
          Math.abs(value - (targetCenters[index] ?? 0)) >
          NORI_DOCK_INTERACTION.POSITION_SETTLE_EPSILON,
      );
    }
    animationFrame.current = unsettled ? requestAnimationFrame(animate) : null;
  }, [appCount, layout, separatorIndex]);

  const ensureAnimation = useCallback(() => {
    if (animationFrame.current === null) animationFrame.current = requestAnimationFrame(animate);
  }, [animate]);

  useEffect(() => {
    initialize();
    ensureAnimation();
  }, [ensureAnimation, initialize]);

  useEffect(
    () => () => {
      if (animationFrame.current !== null) cancelAnimationFrame(animationFrame.current);
    },
    [],
  );

  const mouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (menuOpen.current) return;
    if (performance.now() - menuClosedAt.current < NORI_DOCK_INTERACTION.PRESS_HOLD_MS) return;
    const rect = rootRef.current?.getBoundingClientRect();
    if (!rect) return;
    pointerX.current = event.clientX - rect.left - layout.padding;
    ensureAnimation();
  };
  const mouseLeave = () => {
    if (menuOpen.current) return;
    pointerX.current = null;
    ensureAnimation();
  };
  const setAnyMenuOpen = (open: boolean) => {
    menuOpen.current = open;
    if (!open) {
      menuClosedAt.current = performance.now();
      pointerX.current = null;
      ensureAnimation();
    }
    onMenuOpenChange?.(open);
  };

  const outerWidth = renderState.contentWidth + layout.padding * 2;
  const backgroundStyle = {
    position: "absolute" as const,
    inset: 0,
    pointerEvents: "none" as const,
    background: "rgba(45, 45, 45, 0.4)",
    backdropFilter: "blur(12px) saturate(180%)",
    WebkitBackdropFilter: "blur(12px) saturate(180%)",
    borderRadius: layout.borderRadius,
    border: "1px solid rgba(255, 255, 255, 0.2)",
    boxShadow: `0 ${Math.max(4, layout.baseIconSize * 0.1)}px ${Math.max(16, layout.baseIconSize * 0.4)}px rgba(0, 0, 0, 0.3), 0 ${Math.max(2, layout.baseIconSize * 0.05)}px ${Math.max(8, layout.baseIconSize * 0.2)}px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.25)`,
  };

  const appAt = (appIndex: number) => {
    const slotIndex = mapDockItemIndex(appIndex, separatorIndex);
    return {
      center: renderState.centers[slotIndex] ?? 0,
      scale: renderState.scales[slotIndex] ?? 1,
    };
  };

  return (
    <div
      ref={rootRef}
      className={`nori-dock ${className}`.trim()}
      style={{
        position: "relative",
        width: outerWidth,
        borderRadius: layout.borderRadius,
        padding: layout.padding,
        "--dock-oversample": String(NORI_DOCK_INTERACTION.MAX_SCALE),
      } as React.CSSProperties}
      onMouseMove={mouseMove}
      onMouseLeave={mouseLeave}
      data-nori-dock="true"
    >
      <div aria-hidden="true" className="nori-dock-container" style={backgroundStyle} />
      <div className="relative" style={{ height: layout.baseIconSize, width: "100%" }}>
        {pinned.map((app, appIndex) => {
          const placement = appAt(appIndex);
          const process = processes[app.id];
          const open = Boolean(process && process.windowIds.length > 0);
          return (
            <DesktopDockItem
              key={app.id}
              runtime={runtime}
              app={app}
              size={layout.baseIconSize}
              scale={placement.scale}
              center={placement.center}
              active={app.id === activeAppId}
              open={open}
              minimized={isDockAppMinimized(runtime.store, app.id)}
              windowItems={selectDockWindowItems(runtime.store, runtime.registry, app.id, formatWindowNumber)}
              translate={translate}
              renderIcon={renderIcon}
              badgeCount={getBadgeCount(app.id)}
              badgeDot={getBadgeDot(app.id)}
              tooltip={getTooltip?.(app)}
              reducedMotion={reducedMotion}
              playCue={playCue}
              onMenuOpenChange={setAnyMenuOpen}
            />
          );
        })}

        {hasSeparator && (
          <div
            className="dock-separator absolute"
            style={{
              left: renderState.centers[separatorIndex] ?? 0,
              bottom: layout.baseIconSize * 0.2,
              width: 1,
              height: layout.baseIconSize * 0.6,
              transform: "translateX(-50%)",
              willChange: "transform",
            }}
          >
            <div
              className="nori-dock-separator h-full w-full"
              style={{ backgroundColor: "rgba(255, 255, 255, 0.4)", transformOrigin: "center" }}
            />
          </div>
        )}

        {unpinned.map((app, index) => {
          const appIndex = pinned.length + index;
          const placement = appAt(appIndex);
          const process = processes[app.id];
          const open = Boolean(process && process.windowIds.length > 0);
          return (
            <DesktopDockItem
              key={app.id}
              runtime={runtime}
              app={app}
              size={layout.baseIconSize}
              scale={placement.scale}
              center={placement.center}
              active={app.id === activeAppId}
              open={open}
              minimized={isDockAppMinimized(runtime.store, app.id)}
              windowItems={selectDockWindowItems(runtime.store, runtime.registry, app.id, formatWindowNumber)}
              animated
              translate={translate}
              renderIcon={renderIcon}
              badgeCount={getBadgeCount(app.id)}
              badgeDot={getBadgeDot(app.id)}
              tooltip={getTooltip?.(app)}
              reducedMotion={reducedMotion}
              playCue={playCue}
              onMenuOpenChange={setAnyMenuOpen}
            />
          );
        })}
      </div>
    </div>
  );
}
