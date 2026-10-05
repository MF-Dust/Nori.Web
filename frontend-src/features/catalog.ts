export type FrontendFeature =
  | "shell"
  | "auth"
  | "arcade"
  | "chat"
  | "browser"
  | "mail"
  | "files"
  | "idle"
  | "messenger"
  | "signal"
  | "terminal"
  | "cakeduel"
  | "codenames"
  | "chess"
  | "pictionary"
  | "preview"
  | "audio"
  | "debug"
  | "vendor";

/**
 * How a shipped chunk family is represented in `frontend-src`.
 *
 * - `ui-recovered`: presentation and behavior are source-owned. Remaining
 *   acceptance (original-agent sessions, original-client visual comparison)
 *   is not tracked by this catalog.
 * - `runtime-recovered`: a protocol/runtime layer with no UI of its own.
 * - `dependency-replaced`: third-party code (React, Pixi, pdf.js, Radix,
 *   Convex client, lucide icons, xterm, motion) that the source build takes
 *   from `package.json` dependencies instead of the shipped bundle.
 */
export type RecoveryStatus =
  | "protocol-recovered"
  | "runtime-recovered"
  | "ui-partial"
  | "ui-recovered"
  | "dependency-replaced"
  | "analysis-only";

export interface RecoveredFeatureBoundary {
  feature: FrontendFeature;
  shippedChunkPatterns: readonly RegExp[];
  maintenanceModules: readonly string[];
  status: RecoveryStatus;
}

/**
 * Ownership map from every shipped `public/assets/*.{js,css}` chunk family to
 * the source modules that replace it. `tests/frontend/frontend-feature-catalog.test.ts`
 * fails when a shipped chunk has no owner or a listed module does not exist.
 */
export const RECOVERED_FEATURES: readonly RecoveredFeatureBoundary[] = [
  {
    feature: "shell",
    shippedChunkPatterns: [
      /^index-CyHAbkO5\.js$/,
      /^index-FU-0vwSE\.css$/,
      /NormalApp/i,
      /IntroPage/i,
      /SidebarNavButton/i,
      /useCompactHeight/i,
      /useElementSize/i,
      /^downloads-/,
    ],
    maintenanceModules: [
      "apps/production-catalog.ts",
      "apps/production-icons.tsx",
      "apps/recovered-presentation.ts",
      "components/desktop-dock.tsx",
      "components/desktop-indicators.tsx",
      "components/desktop-root.tsx",
      "components/desktop-surface.tsx",
      "components/desktop-topbar.tsx",
      "components/notification-layer.tsx",
      "components/recovered-desktop-shell.tsx",
      "components/managed-window-host.tsx",
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
      "hooks/use-element-size.ts",
      "hooks/use-window-interaction.ts",
      "runtime/os-notifications.ts",
      "state/app-install-runtime.ts",
      "state/audio-store.ts",
      "state/compute-runtime.ts",
      "state/desktop-runtime.ts",
      "state/dock-runtime.ts",
      "state/notification-store.ts",
      "state/production-window-apps.ts",
      "state/window-app-registry.ts",
      "state/window-types.ts",
      "state/window-geometry.ts",
      "state/window-layout-runtime.ts",
      "state/window-repair.ts",
      "state/window-store.ts",
      "styles/globals.css",
      "styles/desktop-shell.css",
    ],
    status: "ui-recovered",
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
    shippedChunkPatterns: [/ChatPanel/i, /MarkdownBody/i, /MarkdownMessage/i],
    maintenanceModules: [
      "services/chat.ts",
      "components/chat-panel.tsx",
      "components/conversation-panel.tsx",
      "components/markdown-body.tsx",
    ],
    status: "ui-recovered",
  },
  {
    feature: "browser",
    shippedChunkPatterns: [
      /BrowserApp/i,
      /BrowserPageView/i,
      /PopupScreen/i,
      /browserIntent/i,
      /openUrlInBrowser/i,
      /BountyFilePicker/i,
    ],
    maintenanceModules: [
      "apps/browser.ts",
      "apps/browser-page-runtime.ts",
      "apps/browser-presentation.tsx",
      "apps/recovered-presentation.ts",
      "components/managed-window-host.tsx",
      "components/window-runtime-context.tsx",
      "services/artifacts.ts",
      "services/manifold.ts",
      "intents/browser-intent.ts",
      "screens/browser-bounty-extension.tsx",
      "screens/browser-page-view.tsx",
      "screens/browser-popup-screen.tsx",
      "screens/browser-screen.tsx",
    ],
    status: "ui-recovered",
  },
  {
    feature: "mail",
    shippedChunkPatterns: [/MailScreen/i],
    maintenanceModules: [
      "apps/mail.ts",
      "apps/mail-presentation.tsx",
      "components/markdown-body.tsx",
      "screens/mail-screen.tsx",
      "services/artifacts.ts",
      "services/manifold.ts",
    ],
    status: "ui-recovered",
  },
  {
    feature: "files",
    shippedChunkPatterns: [/FilesScreen/i, /SealedVolumeAlert/i, /^tree-/],
    maintenanceModules: [
      "apps/files.ts",
      "apps/files-tree.ts",
      "apps/files-presentation.tsx",
      "apps/recovered-presentation.ts",
      "components/markdown-body.tsx",
      "components/sidebar-nav-button.tsx",
      "screens/files-screen.tsx",
      "services/artifacts.ts",
      "services/manifold.ts",
    ],
    status: "ui-recovered",
  },
  {
    feature: "idle",
    shippedChunkPatterns: [/IdleScreen/i, /QfrDock/i, /marginalGrowthStore/i, /NormalApp/i],
    maintenanceModules: [
      "apps/idle.ts",
      "apps/idle-presentation.tsx",
      "apps/marginal-growth/ribbon-view.tsx",
      "apps/marginal-growth/loader.ts",
      "apps/recovered-presentation.ts",
      "screens/idle-screen.tsx",
      "screens/qfr-dock.tsx",
      "state/compute-runtime.ts",
      "state/idle-runtime-engine.ts",
      "state/marginal-growth-store.ts",
    ],
    status: "ui-recovered",
  },
  {
    feature: "messenger",
    shippedChunkPatterns: [/MessengerScreen/i],
    maintenanceModules: [
      "apps/messenger.ts",
      "apps/signal-daniel.ts",
      "apps/signal-presentation.tsx",
      "components/markdown-body.tsx",
      "screens/messenger-screen.tsx",
      "services/artifacts.ts",
      "services/manifold.ts",
    ],
    status: "ui-recovered",
  },
  {
    feature: "signal",
    shippedChunkPatterns: [
      /LoginScreen/i,
      /ResetScreen/i,
      /TempPasswordScreen/i,
      /MessengerScreen/i,
      /commands/i,
    ],
    maintenanceModules: [
      "apps/signal-daniel.ts",
      "apps/signal-presentation.tsx",
      "services/signal.ts",
      "screens/messenger-screen.tsx",
      "screens/signal-login-screen.tsx",
      "screens/signal-reset-screen.tsx",
      "screens/signal-temp-password-screen.tsx",
    ],
    status: "ui-recovered",
  },
  {
    feature: "terminal",
    shippedChunkPatterns: [/TerminalWindow/i, /commands/i, /^xterm-/],
    maintenanceModules: [
      "apps/terminal.ts",
      "apps/terminal-presentation.tsx",
      "services/manifold.ts",
      "screens/terminal-window.tsx",
      "terminal/line-editor.ts",
      "terminal/shell.ts",
    ],
    status: "ui-recovered",
  },
  {
    feature: "cakeduel",
    shippedChunkPatterns: [
      /CakeDuel/i,
      /CardPreviewContext/i,
      /^GameScreen-BbDAUsf1\.js$/,
      /^StartScreen-DwCccaJ0\.js$/,
      /^ResultsScreen-Bwv4Qh4p\.js$/,
      /^HelpOverlay-Fg7nuFTJ\.js$/,
    ],
    maintenanceModules: [
      "services/games.ts",
      "apps/cakeduel-runtime.ts",
      "apps/cakeduel-presentation.tsx",
      "screens/cakeduel-screen.tsx",
      "screens/cakeduel-start-screen.tsx",
      "screens/cakeduel-results-screen.tsx",
      "screens/cakeduel-help-overlay.tsx",
      "screens/cakeduel-card-preview.tsx",
    ],
    status: "ui-recovered",
  },
  {
    feature: "codenames",
    shippedChunkPatterns: [
      /Codenames/i,
      /^deriveScreen-/,
      /^GameScreen-BU9F4fB5\.js$/,
      // The Codenames card stylesheet (omitted by the shipped entry, see FRONTEND_CSS_RECOVERY.md).
      /^GameScreen-C1LZQU0R\.css$/,
      /^StartScreen-DLxN1cEa\.js$/,
      /^ResultsScreen-en9PN8_z\.js$/,
      /^HelpOverlay-D485oIXH\.js$/,
    ],
    maintenanceModules: [
      "services/games.ts",
      "apps/codenames-model.ts",
      "apps/codenames-presentation.tsx",
      "screens/codenames-app.tsx",
      "screens/codenames-screen.tsx",
      "screens/codenames-results.tsx",
      "screens/codenames-help-overlay.tsx",
      "styles/codenames-board.css",
    ],
    status: "ui-recovered",
  },
  {
    feature: "chess",
    shippedChunkPatterns: [/ChessScreen/i],
    maintenanceModules: [
      "services/games.ts",
      "apps/chess-model.ts",
      "apps/chess-presentation.tsx",
      "screens/chess-screen.tsx",
      "screens/chess-tutorial.tsx",
    ],
    status: "ui-recovered",
  },
  {
    feature: "pictionary",
    shippedChunkPatterns: [
      /Pictionary/i,
      /moleskineComponents/i,
      /^GameScreen-CgEXO_XJ\.js$/,
      /^StartScreen-DVcRTtZt\.js$/,
      /^ResultsScreen-DIJnNx5D\.js$/,
      /^HelpOverlay-DERW7xRx\.js$/,
    ],
    maintenanceModules: [
      "services/games.ts",
      "apps/pictionary-runtime.ts",
      "apps/pictionary-presentation.tsx",
      "screens/pictionary-screen.tsx",
      "screens/pictionary-cover.tsx",
      "screens/pictionary-results.tsx",
      "screens/pictionary-help-overlay.tsx",
      "styles/pictionary.css",
    ],
    status: "ui-recovered",
  },
  {
    feature: "preview",
    shippedChunkPatterns: [/PreviewScreen/i, /^pdf-/, /pdfRenderWorker/i, /pdfParserWorker/i],
    maintenanceModules: [
      "screens/preview-screen.tsx",
      "screens/preview-screen.css",
      "screens/pdf-preview.tsx",
      "pdf-assets-plugin.ts",
    ],
    status: "ui-recovered",
  },
  {
    feature: "audio",
    shippedChunkPatterns: [/pcmPlayerProcessor/i, /corruptionProcessor/i],
    maintenanceModules: [
      "runtime/audio-mixer.ts",
      "runtime/speech-player.ts",
      "runtime/voice-corruption.ts",
      "runtime/corruption-processor.worklet.js",
    ],
    status: "runtime-recovered",
  },
  {
    feature: "debug",
    shippedChunkPatterns: [/Debug/i],
    maintenanceModules: [
      "services/manifold.ts",
      "services/desktop.ts",
      "screens/debug-screen.tsx",
      "screens/debug-system-tabs.tsx",
    ],
    status: "ui-recovered",
  },
  {
    feature: "vendor",
    shippedChunkPatterns: [
      // React/i18next runtime, markdown pipeline and the Pixi renderer.
      /^i18n-/,
      /^index-6t0U9yuc\.js$/,
      /^index-BsHKXFB1\.js$/,
      /^browserAll-/,
      /^webworkerAll-/,
      // Convex client internals behind the recovered arcade/auth runtime.
      /^index-B-Up_0PN\.js$/,
      /^index-Bu1BL0Xx\.js$/,
      /^index-CLLFu0km\.js$/,
      /^http_client-/,
      /^paginated_query_client-/,
      // Radix/shadcn primitives, motion and environment shims.
      /^input-/,
      /^scroll-area-/,
      /^tooltip-/,
      /^use-animation-/,
      /^env-/,
      /^fs-/,
      // Unreachable `ink` React DevTools hook pulled in by QfrDock.
      /^devtools-/,
      // lucide-react icon chunks.
      /^(arrow-right|chevron-left|circle-question-mark|download|loader-circle|lock|panel-left|plus|refresh-cw|square-pen|target|zap)-/,
    ],
    maintenanceModules: [],
    status: "dependency-replaced",
  },
];
