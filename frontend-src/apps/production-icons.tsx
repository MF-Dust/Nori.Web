import type { ReactNode } from "react";
import type {
  DesktopDockIconState,
  DesktopDockProps,
} from "../components/desktop-dock";
import type { DockAppModel } from "../state/dock-runtime";

export interface ProductionDockIconPair {
  a: string;
  b: string;
}

const STANDARD_DOCK_ICON_APPS = new Set([
  "idle",
  "mail",
  "files",
  "browser",
  "signal",
  "pictionary",
  "codenames",
  "chess",
  "cakeduel",
  "terminal",
  "preview",
]);

/**
 * Exact asset convention used by the shipped `So(id)` helper. Credits is the
 * one pinned exception: both icon layers point at icon-a.png.
 */
export function getProductionDockIconPair(appId: string): ProductionDockIconPair | null {
  if (appId === "credits") {
    const icon = "/app-icons/credits/icon-a.png";
    return { a: icon, b: icon };
  }
  if (!STANDARD_DOCK_ICON_APPS.has(appId)) return null;
  return {
    a: `/app-icons/${appId}/icon-a.png`,
    b: `/app-icons/${appId}/icon-b.png`,
  };
}

export interface ProductionDockIconProps {
  app: DockAppModel;
  state: DesktopDockIconState;
  fallback?: ReactNode;
}

/** Maintainable counterpart of NormalApp's J9e two-layer Dock icon renderer. */
export function ProductionDockIcon({
  app,
  state,
  fallback = null,
}: ProductionDockIconProps) {
  const icon = getProductionDockIconPair(app.id);
  const darkened = state.darkened ? { filter: "brightness(0.82)" } : undefined;
  if (!icon) return <>{fallback}</>;

  return (
    <div className="flex h-full w-full items-center justify-center" style={darkened}>
      <div className={`dock-ic ${state.active ? "dock-ic--active" : ""}`.trim()}>
        <div aria-hidden="true" className="dock-ic__shadow" />
        <img
          src={icon.b}
          alt=""
          draggable={false}
          className="dock-ic__layer dock-ic__swap dock-ic__b"
        />
        <img
          src={icon.a}
          alt=""
          draggable={false}
          className="dock-ic__layer dock-ic__swap dock-ic__a"
        />
      </div>
    </div>
  );
}

export const renderProductionDockIcon: NonNullable<DesktopDockProps["renderIcon"]> = (
  app,
  state,
) => <ProductionDockIcon app={app} state={state} />;
