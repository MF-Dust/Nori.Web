export type FrontendFeature =
  | "shell"
  | "auth"
  | "arcade"
  | "chat"
  | "browser"
  | "mail"
  | "files"
  | "messenger"
  | "signal"
  | "terminal"
  | "cakeduel"
  | "codenames"
  | "chess"
  | "pictionary"
  | "debug"
  | "vendor";

export type RecoveryStatus =
  | "protocol-recovered"
  | "runtime-recovered"
  | "ui-partial"
  | "ui-recovered"
  | "analysis-only";

export interface RecoveredFeatureBoundary {
  feature: FrontendFeature;
  shippedChunkPatterns: readonly RegExp[];
  maintenanceModules: readonly string[];
  status: RecoveryStatus;
}

export const RECOVERED_FEATURES: readonly RecoveredFeatureBoundary[] = [
  {
    feature: "shell",
    shippedChunkPatterns: [
      /NormalApp/i,
      /IntroPage/i,
      /SidebarNavButton/i,
      /useCompactHeight/i,
      /useElementSize/i,
    ],
    maintenanceModules: [
      "screens/intro-page.tsx",
      "components/sidebar-nav-button.tsx",
      "components/window-chrome.tsx",
      "components/window-content-host.tsx",
      "components/window-controls.tsx",
      "components/window-interaction.ts",
      "components/window-layer.tsx",
      "components/window-overlays.tsx",
      "components/window-resize-handles.tsx",
      "components/window-runtime-context.tsx",
      "components/window-screen-router.tsx",
      "hooks/use-compact-height.ts",
      "hooks/use-element-size.ts",
      "hooks/use-window-interaction.ts",
      "state/window-app-registry.ts",
      "state/window-types.ts",
      "state/window-geometry.ts",
      "state/window-layout-runtime.ts",
      "state/window-repair.ts",
      "state/window-store.ts",
    ],
    status: "ui-partial",
  },
  {
    feature: "auth",
    shippedChunkPatterns: [/LoginPage/i, /ConvexAuthProvider/i, /authClient/i],
    maintenanceModules: ["runtime/auth.ts", "runtime/http.ts"],
    status: "runtime-recovered",
  },
  {
    feature: "arcade",
    shippedChunkPatterns: [/arcadeConvexClient/i, /NormalApp/i],
    maintenanceModules: [
      "runtime/arcade-client.ts",
      "runtime/protocol.ts",
      "runtime/world-store.ts",
      "runtime/event-rpc.ts",
      "runtime/media-client.ts",
    ],
    status: "runtime-recovered",
  },
  {
    feature: "chat",
    shippedChunkPatterns: [/ChatPanel/i],
    maintenanceModules: ["services/chat.ts", "components/chat-panel.tsx"],
    status: "ui-partial",
  },
  {
    feature: "browser",
    shippedChunkPatterns: [
      /BrowserApp/i,
      /BrowserPageView/i,
      /PopupScreen/i,
      /browserIntent/i,
      /openUrlInBrowser/i,
    ],
    maintenanceModules: [
      "apps/browser.ts",
      "services/artifacts.ts",
      "services/manifold.ts",
      "intents/browser-intent.ts",
      "screens/browser-popup-screen.tsx",
    ],
    status: "ui-partial",
  },
  {
    feature: "mail",
    shippedChunkPatterns: [/MailScreen/i],
    maintenanceModules: ["apps/mail.ts", "services/artifacts.ts", "services/manifold.ts"],
    status: "protocol-recovered",
  },
  {
    feature: "files",
    shippedChunkPatterns: [/FilesScreen/i, /SealedVolumeAlert/i],
    maintenanceModules: ["apps/files.ts", "services/artifacts.ts", "services/manifold.ts"],
    status: "protocol-recovered",
  },
  {
    feature: "messenger",
    shippedChunkPatterns: [/MessengerScreen/i],
    maintenanceModules: ["apps/messenger.ts", "services/artifacts.ts", "services/manifold.ts"],
    status: "protocol-recovered",
  },
  {
    feature: "signal",
    shippedChunkPatterns: [/LoginScreen/i, /ResetScreen/i, /TempPasswordScreen/i, /commands/i],
    maintenanceModules: [
      "services/signal.ts",
      "screens/signal-login-screen.tsx",
      "screens/signal-reset-screen.tsx",
      "screens/signal-temp-password-screen.tsx",
    ],
    status: "ui-partial",
  },
  {
    feature: "terminal",
    shippedChunkPatterns: [/TerminalWindow/i, /commands/i],
    maintenanceModules: [
      "apps/terminal.ts",
      "services/manifold.ts",
      "terminal/line-editor.ts",
      "terminal/shell.ts",
    ],
    status: "ui-partial",
  },
  {
    feature: "cakeduel",
    shippedChunkPatterns: [/CakeDuel/i, /GameScreen/i],
    maintenanceModules: ["services/games.ts"],
    status: "protocol-recovered",
  },
  {
    feature: "codenames",
    shippedChunkPatterns: [/Codenames/i, /GameScreen/i],
    maintenanceModules: ["services/games.ts"],
    status: "protocol-recovered",
  },
  {
    feature: "chess",
    shippedChunkPatterns: [/ChessScreen/i],
    maintenanceModules: ["services/games.ts"],
    status: "protocol-recovered",
  },
  {
    feature: "pictionary",
    shippedChunkPatterns: [/Pictionary/i, /GameScreen/i],
    maintenanceModules: ["services/games.ts"],
    status: "protocol-recovered",
  },
  {
    feature: "debug",
    shippedChunkPatterns: [/Debug/i],
    maintenanceModules: ["services/manifold.ts", "services/desktop.ts"],
    status: "protocol-recovered",
  },
];
