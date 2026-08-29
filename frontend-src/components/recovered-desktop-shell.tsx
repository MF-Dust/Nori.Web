import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { renderProductionDockIcon } from "../apps/production-icons";
import type { RecoveredDesktopRuntimeBundle } from "../apps/recovered-presentation";
import {
  createDesktopRuntime,
  type CreateDesktopRuntimeOptions,
  type DesktopRuntime,
} from "../state/desktop-runtime";
import type { RegisteredWindowAppDefinition } from "../state/window-app-registry";
import type { WindowAppDefinition, WindowLaunchRequest } from "../state/window-store";
import { DesktopDock, type DesktopDockProps } from "./desktop-dock";
import { DesktopRoot } from "./desktop-root";
import { DesktopSurface } from "./desktop-surface";
import { DesktopTopBar, type TopBarTranslate } from "./desktop-topbar";

export interface RecoveredDesktopShellProps {
  /** Turnkey result from createRecoveredDesktopRuntime(). */
  bundle?: RecoveredDesktopRuntimeBundle;
  /** Explicit runtime takes precedence over bundle.runtime. */
  runtime?: DesktopRuntime;
  runtimeOptions?: CreateDesktopRuntimeOptions;
  facts?: ReadonlySet<string>;
  factsReady?: boolean;
  restoreOnMount?: boolean;
  /** Includes every app whose recovered production metadata says bootstrap=startup. */
  bootstrapStartupApps?: boolean;
  initialLaunches?: readonly WindowLaunchRequest[];
  translate?: TopBarTranslate;
  locale?: string;
  isAdmin?: boolean;
  phase?: string;
  cinematic?: boolean;
  chromeTopbarOnly?: boolean;
  receded?: boolean;
  background?: ReactNode;
  overlay?: ReactNode;
  computeIndicator?: ReactNode;
  computeSummary?: ReactNode;
  soundIndicator?: ReactNode;
  onOpenComputeVolume?: () => void;
  onSignOut?: () => void;
  resolveAppMenu?: DesktopTopBarMenuResolver;
  resolveAppTitle?: (app: RegisteredWindowAppDefinition) => ReactNode;
  renderDockIcon?: DesktopDockProps["renderIcon"];
  resolveDockTitle?: DesktopDockProps["resolveTitle"];
  getDockBadgeCount?: DesktopDockProps["getBadgeCount"];
  getDockBadgeDot?: DesktopDockProps["getBadgeDot"];
  getDockTooltip?: DesktopDockProps["getTooltip"];
  formatDockWindowNumber?: DesktopDockProps["formatWindowNumber"];
  reducedMotion?: boolean;
  playCue?: (cue: string) => void;
  isRuntimeReady?: (app: WindowAppDefinition) => boolean;
  suspenseFallback?: ReactNode;
  runtimeFallback?: ReactNode;
  className?: string;
  style?: CSSProperties;
  onReady?: (runtime: DesktopRuntime) => void;
}

export type DesktopTopBarMenuResolver = NonNullable<
  Parameters<typeof DesktopTopBar>[0]["resolveAppMenu"]
>;

function startupLaunches(runtime: DesktopRuntime): WindowLaunchRequest[] {
  return runtime.registry
    .listApps()
    .filter((app) => app.bootstrap === "startup")
    .map((app) => ({ appId: app.id, mode: "launch" }));
}

function mergeLaunches(
  bootstrap: readonly WindowLaunchRequest[],
  requested: readonly WindowLaunchRequest[],
): WindowLaunchRequest[] {
  const result: WindowLaunchRequest[] = [];
  const seen = new Set<string>();
  for (const request of [...bootstrap, ...requested]) {
    const key = `${request.appId}\u0000${request.mode}\u0000${JSON.stringify(request.args ?? null)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(request);
  }
  return result;
}

/**
 * Production-oriented source shell assembled from the recovered NormalApp
 * boundaries: bootstrap lifecycle, topbar, Dock, desktop surface, window stack
 * and migration fallbacks. Feature overlays and unrecovered menu providers stay
 * injectable until their bundle boundaries are reconstructed.
 */
export function RecoveredDesktopShell({
  bundle,
  runtime: providedRuntime,
  runtimeOptions,
  facts = new Set<string>(),
  factsReady = true,
  restoreOnMount = true,
  bootstrapStartupApps = true,
  initialLaunches = [],
  translate,
  locale,
  isAdmin,
  phase,
  cinematic = false,
  chromeTopbarOnly = false,
  receded = false,
  background = <DesktopSurface />,
  overlay,
  computeIndicator,
  computeSummary,
  soundIndicator,
  onOpenComputeVolume,
  onSignOut,
  resolveAppMenu,
  resolveAppTitle,
  renderDockIcon = renderProductionDockIcon,
  resolveDockTitle,
  getDockBadgeCount,
  getDockBadgeDot,
  getDockTooltip,
  formatDockWindowNumber,
  reducedMotion = false,
  playCue,
  isRuntimeReady,
  suspenseFallback,
  runtimeFallback,
  className,
  style,
  onReady,
}: RecoveredDesktopShellProps) {
  const suppliedRuntime = providedRuntime ?? bundle?.runtime;
  const [ownedRuntime] = useState<DesktopRuntime>(() =>
    suppliedRuntime ?? createDesktopRuntime(runtimeOptions),
  );
  const runtime = suppliedRuntime ?? ownedRuntime;
  const ownsRuntime = suppliedRuntime == null;
  const exclusiveAppId = runtime.store((state) => state.exclusiveAppId);

  useEffect(() => {
    if (!ownsRuntime) return;
    return () => runtime.dispose();
  }, [ownsRuntime, runtime]);

  const launches = useMemo(
    () =>
      mergeLaunches(
        bootstrapStartupApps ? startupLaunches(runtime) : [],
        initialLaunches,
      ),
    [bootstrapStartupApps, initialLaunches, runtime],
  );

  const showDock = !exclusiveAppId && !cinematic && !chromeTopbarOnly;
  const showDesktopSurface = !cinematic && !chromeTopbarOnly;
  const effectivePlayCue = playCue ?? runtimeOptions?.playCue;
  const effectiveResolveAppMenu = resolveAppMenu ?? bundle?.resolveAppMenu;

  const topbar = (
    <DesktopTopBar
      runtime={runtime}
      facts={facts}
      translate={translate}
      locale={locale}
      isAdmin={isAdmin}
      phase={phase}
      exclusive={exclusiveAppId !== null}
      computeIndicator={computeIndicator}
      computeSummary={computeSummary}
      soundIndicator={soundIndicator}
      onOpenComputeVolume={onOpenComputeVolume}
      onSignOut={onSignOut}
      resolveAppMenu={effectiveResolveAppMenu}
      resolveAppTitle={resolveAppTitle}
      playCue={effectivePlayCue}
    />
  );

  const dock = showDock ? (
    <div className="flex w-full justify-center pb-2">
      <DesktopDock
        runtime={runtime}
        facts={facts}
        translate={translate}
        renderIcon={renderDockIcon}
        resolveTitle={resolveDockTitle}
        getBadgeCount={getDockBadgeCount}
        getBadgeDot={getDockBadgeDot}
        getTooltip={getDockTooltip}
        formatWindowNumber={formatDockWindowNumber}
        reducedMotion={reducedMotion}
        playCue={effectivePlayCue}
      />
    </div>
  ) : null;

  return (
    <DesktopRoot
      runtime={runtime}
      restoreOnMount={restoreOnMount}
      initialLaunches={launches}
      installFacts={facts}
      installFactsReady={factsReady}
      isRuntimeReady={isRuntimeReady}
      playCue={effectivePlayCue}
      suspenseFallback={suspenseFallback}
      runtimeFallback={runtimeFallback}
      receded={receded}
      background={showDesktopSurface ? background : null}
      topbar={topbar}
      dock={dock}
      overlay={overlay}
      className={className}
      style={style}
      onReady={onReady}
    />
  );
}
