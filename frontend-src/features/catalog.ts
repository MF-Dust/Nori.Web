export type FrontendFeature =
  | "shell"
  | "auth"
  | "arcade"
  | "chat"
  | "browser"
  | "mail"
  | "files"
  | "messenger"
  | "terminal"
  | "cakeduel"
  | "codenames"
  | "chess"
  | "pictionary"
  | "debug"
  | "vendor";

export interface RecoveredFeatureBoundary {
  feature: FrontendFeature;
  shippedChunkPatterns: readonly RegExp[];
  maintenanceModules: readonly string[];
  status: "protocol-recovered" | "runtime-recovered" | "analysis-only";
}

export const RECOVERED_FEATURES: readonly RecoveredFeatureBoundary[] = [
  { feature: "auth", shippedChunkPatterns: [/LoginPage/i, /ConvexAuthProvider/i, /authClient/i], maintenanceModules: ["runtime/auth.ts", "runtime/http.ts"], status: "runtime-recovered" },
  { feature: "arcade", shippedChunkPatterns: [/arcadeConvexClient/i, /NormalApp/i], maintenanceModules: ["runtime/arcade-client.ts", "runtime/protocol.ts", "runtime/world-store.ts", "runtime/event-rpc.ts", "runtime/media-client.ts"], status: "runtime-recovered" },
  { feature: "chat", shippedChunkPatterns: [/ChatPanel/i], maintenanceModules: ["services/chat.ts"], status: "runtime-recovered" },
  { feature: "browser", shippedChunkPatterns: [/BrowserApp/i, /BrowserPageView/i, /browserIntent/i], maintenanceModules: ["services/artifacts.ts", "services/manifold.ts"], status: "protocol-recovered" },
  { feature: "mail", shippedChunkPatterns: [/MailScreen/i], maintenanceModules: ["services/artifacts.ts", "services/manifold.ts"], status: "protocol-recovered" },
  { feature: "files", shippedChunkPatterns: [/FilesScreen/i, /SealedVolumeAlert/i], maintenanceModules: ["services/artifacts.ts", "services/manifold.ts"], status: "protocol-recovered" },
  { feature: "messenger", shippedChunkPatterns: [/MessengerScreen/i], maintenanceModules: ["services/artifacts.ts", "services/manifold.ts"], status: "protocol-recovered" },
  { feature: "terminal", shippedChunkPatterns: [/TerminalWindow/i, /commands/i], maintenanceModules: ["services/manifold.ts"], status: "protocol-recovered" },
  { feature: "cakeduel", shippedChunkPatterns: [/CakeDuel/i, /GameScreen/i], maintenanceModules: ["services/games.ts"], status: "protocol-recovered" },
  { feature: "codenames", shippedChunkPatterns: [/Codenames/i, /GameScreen/i], maintenanceModules: ["services/games.ts"], status: "protocol-recovered" },
  { feature: "chess", shippedChunkPatterns: [/ChessScreen/i], maintenanceModules: ["services/games.ts"], status: "protocol-recovered" },
  { feature: "pictionary", shippedChunkPatterns: [/Pictionary/i, /GameScreen/i], maintenanceModules: ["services/games.ts"], status: "protocol-recovered" },
  { feature: "debug", shippedChunkPatterns: [/Debug/i], maintenanceModules: ["services/manifold.ts", "services/desktop.ts"], status: "protocol-recovered" },
];
