export type FrontendCutoverBoundaryId =
  | "desktop-shell"
  | "terminal"
  | "signal-auth"
  | "browser-popup"
  | "browser-main"
  | "signal-messenger"
  | "mail"
  | "files"
  | "idle-qfr"
  | "messenger"
  | "games"
  | "live2d"
  | "supporting-apps"
  | "css-ownership"
  | "production-entry";

export interface FrontendCutoverBoundary {
  id: FrontendCutoverBoundaryId;
  complete: boolean;
  note: string;
}

/**
 * Single source of truth for the production frontend cutover.
 *
 * A boundary is marked complete only when its production behavior is owned by
 * frontend-src and no historical JavaScript chunk is required for that slice.
 * The public production entry must not be switched while any boundary remains
 * incomplete.
 */
export const FRONTEND_CUTOVER_BOUNDARIES: readonly FrontendCutoverBoundary[] = [
  { id: "desktop-shell", complete: true, note: "Desktop/window runtime, TopBar, Dock and shell composition are source-owned." },
  { id: "terminal", complete: true, note: "Terminal model, xterm presentation and edit/menu bridge are source-owned." },
  { id: "signal-auth", complete: true, note: "Signal login, recovery and temporary-password flow are source-owned." },
  { id: "browser-popup", complete: true, note: "Browser popup shell and production window binding are source-owned." },
  { id: "browser-main", complete: true, note: "Browser main tabs/history/bookmarks/navigation, BrowserPageView artifact loading, srcdoc sandbox bridge, page facts/window/podcast messaging, link interception, asset/font inlining and popup handoff are source-owned; bounty extension installation remains an explicit optional host callback and podcast mixer routing remains a host-audio integration edge." },
  { id: "signal-messenger", complete: true, note: "Signal Messenger presentation and the Daniel service-thread state machine are source-owned; story facts and the jump epoch remain explicit host inputs." },
  { id: "mail", complete: true, note: "Mail data normalization, read/download commands, three-pane presentation, compose failure flow, attachment handling and production binding are source-owned." },
  { id: "files", complete: true, note: "Files artifact/vault normalization, tree/navigation, grid/list presentation, locked-file recovery UI, cold-volume routing, Preview launch and Files intent handling are source-owned; QFR Dock rendering is tracked by the separate Idle/QFR boundary." },
  { id: "idle-qfr", complete: true, note: "Idle/QFR is source-owned: compute-field interaction, generator economy, advanced faction and Heritage effects, assistant/thread/autoclick runtime, GPU/click/Exchange paths, periodic Green Fingers lumps, retraining/Manifold resets, Liu Xing mementos, persistence, initialization cinematic/fact handoff, presentation and QFR Dock no longer require historical JavaScript. Initialization exposes shipped sound-event hooks while the shared AudioManager remains a separate host-audio integration edge." },
  { id: "messenger", complete: false, note: "Messenger service-message Markdown and external-link keyboard behavior are source-owned. Source conversation, PCM/encoded TTS playback, mode switching, audio acknowledgements, bounds, cancellation and world/reconnect integration are implemented and browser-tested. The floating Nori conversation layout, palette, receipt-time expiry, block identity, keyboard composer and source-hosted Nunito are restored. Chip overlays, story/corruption states, reveal/interrupt choreography and shared audio routing remain open; see docs/FRONTEND_MEDIA_RECOVERY.md." },
  { id: "games", complete: false, note: "Codenames presentation is source-owned, including header/clue flow, 5x5 board and reveals, turn footer, interactive key card, chat/clue composer, timed board overlays, help sheet and flying-card transition behavior. Cake Duel is source-owned end to end: production cartridge controller, start/game/results lifecycle, locale-aware shipped assets, card/hand/HUD/table/action presentation, preview/help overlays, transition-driven banner and Wolfy events, exact shipped challenge banner/pause/reveal timing with per-card flip staggering, results pacing, Start/Results decorative structure, outcome overlays and shared route effect pacing. Chess and Pictionary now have source-owned playable screens, schemas, lifecycle controllers, legal chess moves/history/promotion and drawing/snapshot/round timing. Codenames is connected to cartridge state, clue validation, tap-to-confirm and turn commands. Games remains incomplete: Codenames controller reveal pacing/tutorial choreography, Chess visual/audio parity, Pictionary progressive hints and original rendering parity, and live backend/media verification remain open. See docs/FRONTEND_GAMES_RECOVERY.md." },
  { id: "live2d", complete: false, note: "Cubism framework, standalone engine, typed session boundary, real ARGNori model, idle motion, physics/lip-sync and StrictMode-safe WebGL lifecycle are source-owned and browser-tested. Three.js scene/camera/shadow, custom gesture/expression plugins and story cinematics remain open." },
  { id: "css-ownership", complete: true, note: "Source app CSS is decomposed into tokens, globals, pixel, base, components, Nori theme and desktop shell. Tailwind utilities are generated from source; no historical stylesheet is loaded. Browser app/game checks use the rebuilt CSS. See docs/FRONTEND_CSS_RECOVERY.md." },
  { id: "supporting-apps", complete: false, note: "Settings sound/graphics/network/reset, About credit roll, system alerts, Credits content/fact/clipboard and basic Preview have source components and production bindings. Settings persistence, live rendering controls, latency, reset and Credits launch are browser-tested. Debug, full Preview, About logo effects, GPU auto-detection and shared audio remain open; see docs/FRONTEND_SYSTEM_RECOVERY.md. This explicit boundary records gaps previously carried inside production-entry." },
  { id: "production-entry", complete: false, note: "public/index.html still boots the historical production JavaScript entry." },
];

export const FRONTEND_CUTOVER_READY = FRONTEND_CUTOVER_BOUNDARIES.every(
  (boundary) => boundary.complete,
);

export function listPendingFrontendCutoverBoundaries(): readonly FrontendCutoverBoundary[] {
  return FRONTEND_CUTOVER_BOUNDARIES.filter((boundary) => !boundary.complete);
}
