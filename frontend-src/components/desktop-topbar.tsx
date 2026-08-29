import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { BatteryCharging, Check, ChevronRight, Cpu, Wifi } from "lucide-react";
import type { DesktopRuntime } from "../state/desktop-runtime";
import { NORI_SHELL_LAYERS } from "../state/window-layout-runtime";
import type { RegisteredWindowAppDefinition } from "../state/window-app-registry";

export type TopBarTranslate = (
  key: string,
  variables?: Readonly<Record<string, string | number>>,
) => string;

export interface DesktopTopBarMenuItem {
  label: ReactNode;
  disabled?: boolean;
  separator?: boolean;
  shortcut?: string;
  checked?: boolean;
  submenu?: readonly DesktopTopBarMenuItem[];
  onSelect?: () => void;
}

export interface DesktopTopBarMenuGroup {
  label: ReactNode;
  items: readonly DesktopTopBarMenuItem[];
}

export interface DesktopTopBarProps {
  runtime: DesktopRuntime;
  facts?: ReadonlySet<string>;
  translate?: TopBarTranslate;
  locale?: string;
  isAdmin?: boolean;
  phase?: string;
  exclusive?: boolean;
  computeIndicator?: ReactNode;
  computeSummary?: ReactNode;
  soundIndicator?: ReactNode;
  onOpenComputeVolume?: () => void;
  onSignOut?: () => void;
  resolveAppMenu?: (
    app: RegisteredWindowAppDefinition,
    appId: string,
  ) => readonly DesktopTopBarMenuGroup[];
  resolveAppTitle?: (app: RegisteredWindowAppDefinition) => ReactNode;
  playCue?: (cue: string) => void;
}

const BLUE_BAY_YEAR = 2026;
const BLUE_BAY_MONTH = 7;
const BLUE_BAY_DAY = 31;

export function getBlueBayNow(now = new Date()): Date {
  return new Date(
    BLUE_BAY_YEAR,
    BLUE_BAY_MONTH,
    BLUE_BAY_DAY,
    now.getHours(),
    now.getMinutes(),
    now.getSeconds(),
    now.getMilliseconds(),
  );
}

function defaultTranslate(key: string): string {
  return key;
}

function MenuPanel({ children }: { children: ReactNode }) {
  return (
    <div
      className="absolute left-0 top-full z-50 mt-1 min-w-56 rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-lg"
      role="menu"
    >
      {children}
    </div>
  );
}

function MenuButton({
  children,
  onClick,
  className = "",
  expanded,
}: {
  children: ReactNode;
  onClick(): void;
  className?: string;
  expanded: boolean;
}) {
  return (
    <button
      type="button"
      className={`topbar-indicator-trigger ${className}`.trim()}
      aria-haspopup="menu"
      aria-expanded={expanded}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function MenuItem({
  item,
  close,
}: {
  item: DesktopTopBarMenuItem;
  close(): void;
}) {
  const [open, setOpen] = useState(false);
  if (item.separator) return <div className="my-1 h-px bg-border" role="separator" />;

  const select = () => {
    if (item.disabled) return;
    if (item.submenu?.length) {
      setOpen((value) => !value);
      return;
    }
    item.onSelect?.();
    close();
  };

  return (
    <div className="relative">
      <button
        type="button"
        role="menuitem"
        disabled={item.disabled}
        onClick={select}
        className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm outline-none hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50"
      >
        {typeof item.checked === "boolean" && (
          <span className="flex size-4 items-center justify-center">
            {item.checked && <Check className="size-3.5" />}
          </span>
        )}
        <span className="min-w-0 flex-1 truncate">{item.label}</span>
        {item.shortcut && (
          <span className="ml-auto text-xs tracking-widest text-muted-foreground">
            {item.shortcut}
          </span>
        )}
        {item.submenu?.length ? <ChevronRight className="size-3.5" /> : null}
      </button>
      {open && item.submenu?.length ? (
        <div className="absolute left-full top-0 z-50 ml-1 min-w-52 rounded-md border border-border bg-popover p-1 shadow-lg">
          {item.submenu.map((child, index) => (
            <MenuItem key={index} item={child} close={close} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function MenuItems({
  items,
  close,
}: {
  items: readonly DesktopTopBarMenuItem[];
  close(): void;
}) {
  return <>{items.map((item, index) => <MenuItem key={index} item={item} close={close} />)}</>;
}

export function DesktopTopBar({
  runtime,
  facts = new Set<string>(),
  translate = defaultTranslate,
  locale = "en-US",
  isAdmin = false,
  phase,
  exclusive,
  computeIndicator,
  computeSummary,
  soundIndicator,
  onOpenComputeVolume,
  onSignOut,
  resolveAppMenu,
  resolveAppTitle,
  playCue,
}: DesktopTopBarProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [openMenu, setOpenMenu] = useState("");
  const focusedWindowId = runtime.store((state) => state.focusedWindowId);
  const exclusiveAppId = runtime.store((state) => state.exclusiveAppId);
  const windows = runtime.store((state) => state.windows);
  const currentAppId =
    exclusiveAppId ??
    (focusedWindowId ? windows[focusedWindowId]?.appId ?? null : null);
  const currentApp = currentAppId ? runtime.registry.lookupApp(currentAppId) : undefined;
  const appTitle = currentApp
    ? resolveAppTitle?.(currentApp) ?? currentApp.title ?? currentApp.id
    : "NoriOS";
  const groups = useMemo(
    () =>
      currentApp && currentAppId
        ? resolveAppMenu?.(currentApp, currentAppId) ?? []
        : [],
    [currentApp, currentAppId, resolveAppMenu],
  );
  const [clock, setClock] = useState(() => getBlueBayNow());

  useEffect(() => {
    const timer = setInterval(() => setClock(getBlueBayNow()), 60_000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const pointer = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpenMenu("");
    };
    const keyboard = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenMenu("");
    };
    document.addEventListener("pointerdown", pointer);
    window.addEventListener("keydown", keyboard, true);
    return () => {
      document.removeEventListener("pointerdown", pointer);
      window.removeEventListener("keydown", keyboard, true);
    };
  }, []);

  const setMenu = (value: string) => {
    setOpenMenu((previous) => {
      const next = previous === value ? "" : value;
      if (next) playCue?.("shell-menu-open");
      return next;
    });
  };
  const closeMenu = () => setOpenMenu("");

  const launch = (appId: string) => {
    void runtime.store.getState().launchApp({ appId, mode: "activate" });
    closeMenu();
  };
  const openAbout = async () => {
    await runtime.store.getState().launchApp({ appId: "system", mode: "activate" });
    runtime.store.getState().createWindow("system", "about");
    closeMenu();
  };
  const quitCurrent = () => {
    if (currentAppId) void runtime.store.getState().quitApp(currentAppId);
    closeMenu();
  };
  const sleep = () => {
    playCue?.("shell-sleep-logout");
    closeMenu();
    onSignOut?.();
  };

  const dateLabel = `${clock.toLocaleDateString(locale, {
    weekday: "short",
    month: "short",
    day: "numeric",
  })} ${clock
    .toLocaleTimeString(locale, {
      hour: "numeric",
      minute: "2-digit",
      hour12: locale.startsWith("en"),
    })
    .replace(" ", "")}`;

  const topbarExclusive = exclusive ?? exclusiveAppId !== null;

  return (
    <div
      ref={rootRef}
      className={`topbar-container ${topbarExclusive ? "topbar-exclusive" : ""} ${phase === "void" ? "topbar-void" : ""}`.trim()}
      style={{ zIndex: NORI_SHELL_LAYERS.TOPBAR }}
      data-nori-topbar="true"
    >
      <div className="topbar-menubar flex h-8 items-center gap-1 px-2">
        <div className="relative">
          <MenuButton
            className="topbar-system-trigger"
            expanded={openMenu === "system"}
            onClick={() => setMenu("system")}
          >
            <img src="/icon.png" alt="NoriOS" className="topbar-icon" />
          </MenuButton>
          {openMenu === "system" && (
            <MenuPanel>
              {isAdmin && (
                <MenuItem
                  item={{ label: translate("topbar.system.debug"), onSelect: () => launch("debug") }}
                  close={closeMenu}
                />
              )}
              <MenuItem
                item={{
                  label: translate("topbar.system.systemSettings"),
                  onSelect: () => launch("settings"),
                }}
                close={closeMenu}
              />
              <div className="my-1 h-px bg-border" role="separator" />
              <MenuItem
                item={{ label: translate("topbar.system.sleep"), onSelect: sleep }}
                close={closeMenu}
              />
            </MenuPanel>
          )}
        </div>

        {groups.length > 0 ? (
          groups.map((group, index) => {
            const key = `menu-${index}`;
            return (
              <div className="relative" key={key}>
                <MenuButton
                  className={index === 0 ? "topbar-app-name" : ""}
                  expanded={openMenu === key}
                  onClick={() => setMenu(key)}
                >
                  {group.label}
                </MenuButton>
                {openMenu === key && (
                  <MenuPanel>
                    <MenuItems items={group.items} close={closeMenu} />
                  </MenuPanel>
                )}
              </div>
            );
          })
        ) : (
          <div className="relative">
            <MenuButton
              className="topbar-app-name"
              expanded={openMenu === "app-fallback"}
              onClick={() => setMenu("app-fallback")}
            >
              {appTitle}
            </MenuButton>
            {openMenu === "app-fallback" && (
              <MenuPanel>
                {currentApp && currentAppId && !currentApp.keepAlive ? (
                  <MenuItem
                    item={{
                      label: translate("topbar.system.quit", {
                        appName: String(currentApp.title ?? currentApp.id),
                      }),
                      shortcut: "⌘Q",
                      onSelect: quitCurrent,
                    }}
                    close={closeMenu}
                  />
                ) : currentApp ? (
                  <MenuItem
                    item={{ label: translate("topbar.system.noMenu"), disabled: true }}
                    close={closeMenu}
                  />
                ) : (
                  <MenuItem
                    item={{ label: translate("topbar.system.about"), onSelect: () => void openAbout() }}
                    close={closeMenu}
                  />
                )}
              </MenuPanel>
            )}
          </div>
        )}

        <div className="topbar-indicators ml-auto flex items-center gap-1">
          {facts.has("qfr.installed") && (
            <div className="relative">
              <MenuButton expanded={openMenu === "compute"} onClick={() => setMenu("compute")}>
                {computeIndicator ?? <Cpu className="size-4" />}
              </MenuButton>
              {openMenu === "compute" && (
                <MenuPanel>
                  <div className="px-2 py-1.5">
                    <div className="font-medium">{translate("topbar.compute.title")}</div>
                    {computeSummary}
                  </div>
                  <div className="my-1 h-px bg-border" />
                  <MenuItem
                    item={{ label: translate("topbar.compute.openVolume"), onSelect: onOpenComputeVolume }}
                    close={closeMenu}
                  />
                  <MenuItem
                    item={{ label: translate("topbar.compute.openIdle"), onSelect: () => launch("idle") }}
                    close={closeMenu}
                  />
                </MenuPanel>
              )}
            </div>
          )}

          <div className="relative">
            <MenuButton expanded={openMenu === "battery"} onClick={() => setMenu("battery")}>
              <BatteryCharging className="size-4" />
            </MenuButton>
            {openMenu === "battery" && (
              <MenuPanel>
                <div className="space-y-1 px-2 py-1.5">
                  <div className="font-medium">{translate("topbar.battery.title")}</div>
                  <div className="text-xs text-muted-foreground">
                    {translate("topbar.battery.charged", { percent: 87 })}
                  </div>
                </div>
                <div className="my-1 h-px bg-border" />
                <div className="space-y-1 px-2 py-1.5 text-xs">
                  <div>{translate("topbar.battery.powerSource")}</div>
                  <div className="text-muted-foreground">{translate("topbar.battery.acPower")}</div>
                  <div className="pt-1">{translate("topbar.battery.chargeTimeRemaining")}</div>
                  <div className="text-muted-foreground">{translate("topbar.battery.chargeTimeValue")}</div>
                </div>
              </MenuPanel>
            )}
          </div>

          <div className="relative">
            <MenuButton expanded={openMenu === "wifi"} onClick={() => setMenu("wifi")}>
              <Wifi className="size-4" />
            </MenuButton>
            {openMenu === "wifi" && (
              <MenuPanel>
                <div className="space-y-1 px-2 py-1.5">
                  <div className="font-medium">{translate("topbar.wifi.title")}</div>
                  <div className="text-xs text-muted-foreground">{translate("topbar.wifi.connected")}</div>
                </div>
                <div className="my-1 h-px bg-border" />
                <div className="space-y-2 px-2 py-1.5 text-xs">
                  <div>
                    <div className="font-medium">Futurum-8C3A-5G</div>
                    <div className="text-muted-foreground">{translate("topbar.wifi.connected")}</div>
                  </div>
                  <div>
                    <div>Futurum-8C3A</div>
                    <div className="text-muted-foreground">{translate("topbar.wifi.signalStrong")}</div>
                  </div>
                  <div>
                    <div>别蹭我家网</div>
                    <div className="text-muted-foreground">{translate("topbar.wifi.signalWeak")}</div>
                  </div>
                </div>
              </MenuPanel>
            )}
          </div>

          {soundIndicator}

          <div className="relative">
            <MenuButton
              className="topbar-date"
              expanded={openMenu === "datetime"}
              onClick={() => setMenu("datetime")}
            >
              <span className="text-sm font-medium">{dateLabel}</span>
            </MenuButton>
            {openMenu === "datetime" && (
              <div className="absolute right-0 top-full z-50 mt-1 min-w-56 rounded-md border border-border bg-popover p-2 text-popover-foreground shadow-lg">
                <div className="font-medium text-lg">
                  {clock.toLocaleTimeString(locale, {
                    hour: "numeric",
                    minute: "2-digit",
                    hour12: locale.startsWith("en"),
                  })}
                </div>
                <div className="text-xs text-muted-foreground">
                  {clock.toLocaleDateString(locale, {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  })}
                </div>
                <div className="my-2 h-px bg-border" />
                <div className="text-xs font-medium">{translate("topbar.datetime.timeZone")}</div>
                <div className="text-xs text-muted-foreground">蓝湾标准时间</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
