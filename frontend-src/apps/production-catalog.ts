import type { WindowScreenTransition } from "../state/window-types";

export type ProductionAppRecoveryStatus =
  | "runtime-recovered"
  | "protocol-recovered"
  | "ui-partial"
  | "ui-recovered"
  | "metadata-recovered";

export interface ProductionRuntimeDescriptor {
  cartridgeId: string;
  ownsCartridge: boolean;
  actorId: string;
  visibilityFenceId: string;
  revealPolicy?: string;
  hasRuntimeBridge?: boolean;
}

export interface ProductionScreenDescriptor {
  id: string;
  transition: WindowScreenTransition;
}

export interface ProductionWindowDescriptor {
  type: string;
  title?: string;
  defaultSize: { width: number; height: number };
  minSize?: { width: number; height: number };
  resizable?: boolean;
  closable?: boolean;
  minimizable?: boolean;
  maximizable?: boolean;
  alwaysOnTop?: boolean;
  initialScreen?: string;
  screens?: readonly ProductionScreenDescriptor[];
}

export interface ProductionAppDescriptor {
  /** Minified identifier retained only as an evidence anchor. */
  sourceBinding: string;
  id: string;
  title: string;
  pinned: boolean;
  exclusive?: boolean;
  keepAlive?: boolean;
  bootstrap?: "startup" | string;
  installWhen?: string;
  dockWhen?: string;
  accentColor?: string;
  runtime?: ProductionRuntimeDescriptor;
  windows: readonly ProductionWindowDescriptor[];
  recoveryStatus: ProductionAppRecoveryStatus;
}

/**
 * Verified application/window topology from the shipped NormalApp bundle.
 * Component identifiers are intentionally absent: this catalog is the stable
 * migration map, while maintainable React implementations live in their own
 * source modules as they are recovered.
 */
export const NORI_PRODUCTION_APPS: readonly ProductionAppDescriptor[] = [
  {
    sourceBinding: "s2e",
    id: "system",
    title: "NoriOS",
    pinned: false,
    keepAlive: true,
    bootstrap: "startup",
    runtime: {
      cartridgeId: "chat",
      ownsCartridge: false,
      actorId: "player",
      visibilityFenceId: "ui",
      revealPolicy: "manual",
      hasRuntimeBridge: true,
    },
    windows: [
      {
        type: "about",
        title: "About NoriOS",
        defaultSize: { width: 400, height: 440 },
        resizable: false,
        minimizable: false,
        maximizable: false,
      },
      {
        type: "alert",
        defaultSize: { width: 400, height: 188 },
        resizable: false,
        minimizable: false,
        maximizable: false,
        alwaysOnTop: true,
      },
    ],
    recoveryStatus: "runtime-recovered",
  },
  {
    sourceBinding: "LOe",
    id: "credits",
    title: "Credits",
    pinned: true,
    dockWhen: "arg.farewell.shown",
    windows: [
      {
        type: "main",
        defaultSize: { width: 420, height: 690 },
        resizable: false,
        maximizable: false,
      },
    ],
    recoveryStatus: "metadata-recovered",
  },
  {
    sourceBinding: "bOe",
    id: "idle",
    title: "算力",
    accentColor: "#22d3ee",
    pinned: true,
    windows: [
      {
        type: "main",
        defaultSize: { width: 1080, height: 640 },
        minSize: { width: 900, height: 600 },
        resizable: true,
      },
    ],
    recoveryStatus: "metadata-recovered",
  },
  {
    sourceBinding: "oOe",
    id: "mail",
    title: "Mail",
    pinned: true,
    windows: [
      {
        type: "main",
        defaultSize: { width: 900, height: 600 },
        minSize: { width: 600, height: 400 },
        resizable: true,
      },
    ],
    recoveryStatus: "ui-recovered",
  },
  {
    sourceBinding: "cOe",
    id: "files",
    title: "Files",
    pinned: true,
    windows: [
      {
        type: "main",
        defaultSize: { width: 1180, height: 720 },
        minSize: { width: 480, height: 480 },
        resizable: true,
      },
    ],
    recoveryStatus: "ui-recovered",
  },
  {
    sourceBinding: "fOe",
    id: "browser",
    title: "Browser",
    accentColor: "#0ea5e9",
    pinned: true,
    installWhen: "system.repaired",
    windows: [
      {
        type: "main",
        defaultSize: { width: 820, height: 560 },
        minSize: { width: 520, height: 360 },
        resizable: true,
      },
      {
        type: "popup",
        defaultSize: { width: 440, height: 500 },
        minSize: { width: 300, height: 220 },
        resizable: true,
        maximizable: true,
        minimizable: false,
        closable: true,
        alwaysOnTop: true,
      },
    ],
    recoveryStatus: "ui-partial",
  },
  {
    sourceBinding: "fX",
    id: "signal",
    title: "Messages",
    pinned: true,
    installWhen: "system.repaired",
    windows: [
      {
        type: "main",
        defaultSize: { width: 760, height: 600 },
        minSize: { width: 340, height: 480 },
        resizable: true,
        initialScreen: "login",
        screens: [
          { id: "login", transition: "fade" },
          { id: "reset", transition: "slide-left" },
          { id: "tempPassword", transition: "slide-left" },
          { id: "messenger", transition: "fade" },
        ],
      },
    ],
    recoveryStatus: "ui-recovered",
  },
  {
    sourceBinding: "xAe",
    id: "pictionary",
    title: "Draw & Guess",
    pinned: true,
    exclusive: true,
    runtime: {
      cartridgeId: "pictionary",
      ownsCartridge: true,
      actorId: "player",
      visibilityFenceId: "ui",
      revealPolicy: "auto_advance_head",
    },
    windows: [
      {
        type: "game",
        defaultSize: { width: 1200, height: 800 },
        initialScreen: "start",
        screens: [
          { id: "start", transition: "fade" },
          { id: "game", transition: "slide-left" },
          { id: "results", transition: "slide-up" },
        ],
      },
    ],
    recoveryStatus: "protocol-recovered",
  },
  {
    sourceBinding: "UPe",
    id: "codenames",
    title: "Woodland Quest",
    pinned: true,
    exclusive: true,
    runtime: {
      cartridgeId: "codenames",
      ownsCartridge: true,
      actorId: "player",
      visibilityFenceId: "ui",
      hasRuntimeBridge: true,
    },
    windows: [
      {
        type: "game",
        defaultSize: { width: 1200, height: 800 },
        initialScreen: "start",
        screens: [
          { id: "start", transition: "fade" },
          { id: "game", transition: "slide-left" },
          { id: "results", transition: "slide-up" },
        ],
      },
    ],
    recoveryStatus: "protocol-recovered",
  },
  {
    sourceBinding: "jPe",
    id: "chess",
    title: "Chess",
    pinned: true,
    exclusive: true,
    runtime: {
      cartridgeId: "chess",
      ownsCartridge: true,
      actorId: "player",
      visibilityFenceId: "ui",
      revealPolicy: "auto_advance_head",
    },
    windows: [
      {
        type: "game",
        defaultSize: { width: 1100, height: 720 },
        initialScreen: "main",
        screens: [{ id: "main", transition: "fade" }],
      },
    ],
    recoveryStatus: "protocol-recovered",
  },
  {
    sourceBinding: "rOe",
    id: "cakeduel",
    title: "Cake Duel",
    pinned: true,
    exclusive: true,
    runtime: {
      cartridgeId: "cakeduel",
      ownsCartridge: true,
      actorId: "player",
      visibilityFenceId: "ui",
      hasRuntimeBridge: true,
    },
    windows: [
      {
        type: "game",
        defaultSize: { width: 1200, height: 800 },
        initialScreen: "start",
        screens: [
          { id: "start", transition: "fade" },
          { id: "game", transition: "slide-left" },
          { id: "results", transition: "slide-up" },
        ],
      },
    ],
    recoveryStatus: "protocol-recovered",
  },
  {
    sourceBinding: "a2e",
    id: "terminal",
    title: "Terminal",
    pinned: true,
    windows: [
      {
        type: "main",
        defaultSize: { width: 800, height: 500 },
        resizable: true,
      },
    ],
    recoveryStatus: "ui-partial",
  },
  {
    sourceBinding: "c2e",
    id: "debug",
    title: "Debug",
    pinned: false,
    windows: [
      {
        type: "main",
        defaultSize: { width: 720, height: 600 },
        minSize: { width: 480, height: 360 },
        resizable: true,
        alwaysOnTop: true,
      },
    ],
    recoveryStatus: "metadata-recovered",
  },
  {
    sourceBinding: "sAe",
    id: "settings",
    title: "Settings",
    pinned: false,
    windows: [
      {
        type: "main",
        defaultSize: { width: 560, height: 420 },
        resizable: true,
      },
    ],
    recoveryStatus: "metadata-recovered",
  },
  {
    sourceBinding: "mOe",
    id: "preview",
    title: "Preview",
    pinned: false,
    windows: [
      {
        type: "main",
        defaultSize: { width: 760, height: 560 },
        minSize: { width: 520, height: 400 },
        resizable: true,
      },
    ],
    recoveryStatus: "metadata-recovered",
  },
] as const;

export function getProductionAppDescriptor(
  appId: string,
): ProductionAppDescriptor | undefined {
  return NORI_PRODUCTION_APPS.find((app) => app.id === appId);
}

export function getProductionWindowDescriptor(appId: string, windowType: string) {
  return getProductionAppDescriptor(appId)?.windows.find(
    (window) => window.type === windowType,
  );
}
