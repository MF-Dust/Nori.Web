import type { ComponentType } from "react";
import type { StoreApi, UseBoundStore } from "zustand";

export type WindowSnap =
  | "none"
  | "maximized"
  | "vertical-maximized"
  | "left"
  | "right"
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right";

export interface WindowRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface WindowBounds {
  viewportWidth: number;
  viewportHeight: number;
  top: number;
  bottom: number;
}

export interface WindowLayerConfig {
  window: number;
  alwaysOnTop: number;
  exclusive: number;
}

export interface WindowGeometryConfig {
  minWidth: number;
  minHeight: number;
  initialPosition: { x: number; y: number };
  cascadeOffset: { x: number; y: number };
  cascadeWrap: number;
}

export interface WindowLayoutRuntime {
  layers: WindowLayerConfig;
  geometry: WindowGeometryConfig;
  getBounds(alwaysOnTop: boolean): WindowBounds;
  exclusiveTransitionMs: number;
}

export interface WindowRuntimeProps {
  instanceId: string;
  appId: string;
  windowType: string;
  /** Mirrors the shipped per-instance focused-window selector. */
  focused?: boolean;
  focus(): void;
  close(): void;
  setTitle(title: string): void;
}

export type WindowComponentProps = WindowRuntimeProps & Record<string, unknown>;
export type WindowComponent = ComponentType<WindowComponentProps>;

export type WindowScreenTransition =
  | "fade"
  | "slide-left"
  | "slide-right"
  | "slide-up"
  | "none";

export interface WindowScreenComponentProps {
  navigate(screen: string, params?: unknown): void;
  goBack(): void;
  canGoBack: boolean;
  params?: unknown;
}

export interface WindowScreenEntryDefinition {
  component: ComponentType<WindowScreenComponentProps>;
  transition?: WindowScreenTransition;
}

export interface WindowScreenDefinition {
  initial: string;
  screens: Record<string, WindowScreenEntryDefinition>;
}

export interface WindowDefinition {
  title: string;
  defaultSize: { width: number; height: number };
  component?: WindowComponent;
  resizable?: boolean;
  closable?: boolean;
  minimizable?: boolean;
  maximizable?: boolean;
  alwaysOnTop?: boolean;
  screens?: WindowScreenDefinition;
}

export interface WindowAppRuntimeDefinition {
  ownsCartridge?: boolean;
}

export interface WindowAppDefinition {
  id: string;
  exclusive?: boolean;
  keepAlive?: boolean;
  runtime?: WindowAppRuntimeDefinition;
  windows: Record<string, WindowDefinition>;
  onLaunch?: (
    context: WindowAppContext,
    request: WindowLaunchRequest,
  ) => void | Promise<void>;
  onQuit?: (context: WindowAppContext) => void | Promise<void>;
  onRestore?: (context: WindowAppContext) => boolean | void | Promise<boolean | void>;
}

export interface WindowLaunchRequest {
  appId: string;
  mode: "launch" | "activate" | string;
  args?: unknown;
}

export interface WindowProcess {
  appId: string;
  windowIds: string[];
  launchedAt: number;
}

export interface WindowConfig {
  resizable: boolean;
  closable: boolean;
  minimizable: boolean;
  maximizable: boolean;
}

export interface WindowScreenHistoryEntry {
  screen: string;
  params?: unknown;
}

export interface WindowScreenStack {
  current: string;
  params?: unknown;
  history: WindowScreenHistoryEntry[];
}

export interface ManagedWindow extends WindowRect {
  instanceId: string;
  appId: string;
  windowType: string;
  props?: unknown;
  title: string;
  zIndex: number;
  minimized: boolean;
  minimizedByExclusive?: boolean;
  snap: WindowSnap;
  preSnapRect?: WindowRect;
  config: WindowConfig;
  alwaysOnTop: boolean;
  screenStack?: WindowScreenStack;
}

export interface PersistedWindowManagerState {
  processes: Record<string, WindowProcess>;
  windows: Record<string, ManagedWindow>;
  windowOrder: string[];
  focusedWindowId: string | null;
  exclusiveAppId: string | null;
  exclusiveWindowId: string | null;
  windowCounter: number;
}

export interface WindowAppContext {
  appId: string;
  createWindow(windowType: string, props?: unknown): string | null;
  closeWindow(instanceId: string): void;
  closeAllWindows(): void;
  getWindows(): ManagedWindow[];
  quit(): Promise<void>;
}

export interface WindowAppMenuContext extends WindowAppContext {
  focusedWindowId: string | null;
}

export type WindowLaunchGuardResult =
  | { type: "allow" }
  | { type: "veto"; reason?: string };

export interface WindowStoreOptions {
  lookupApp(appId: string): WindowAppDefinition | undefined;
  layout: WindowLayoutRuntime;
  playCue?: (cue: string) => void;
  launchGuard?: (request: {
    appId: string;
    mode: string;
    willBeExclusive: boolean;
    request: WindowLaunchRequest;
  }) => WindowLaunchGuardResult;
  now?: () => number;
  persistName?: string;
  warn?: (message: string) => void;
  error?: (message: string, error?: unknown) => void;
}

export interface WindowManagerState extends PersistedWindowManagerState {
  isTransitioning: boolean;
  restorationDone: boolean;
  launchApp(request: WindowLaunchRequest): Promise<void>;
  quitApp(appId: string): Promise<void>;
  createWindow(appId: string, windowType: string, props?: unknown): string | null;
  closeWindow(instanceId: string): void;
  focusWindow(instanceId: string): void;
  minimizeWindow(instanceId: string): void;
  minimizeAllWindows(): void;
  snapWindow(instanceId: string, snap: WindowSnap): void;
  toggleMaximize(instanceId: string): void;
  updateWindowPosition(instanceId: string, x: number, y: number): void;
  updateWindowSize(instanceId: string, width: number, height: number): void;
  updateWindowRect(
    instanceId: string,
    x: number,
    y: number,
    width: number,
    height: number,
  ): void;
  setWindowTitle(instanceId: string, title: string): void;
  navigateScreen(instanceId: string, screen: string, params?: unknown): void;
  goBackScreen(instanceId: string): void;
  unfocusWindow(): void;
  getAppContext(appId: string): WindowAppContext;
  getAppMenuContext(appId: string): WindowAppMenuContext;
  restoreApps(): Promise<void>;
}

export type WindowStore = UseBoundStore<StoreApi<WindowManagerState>>;
