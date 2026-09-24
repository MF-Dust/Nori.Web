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
  { id: "browser-main", complete: true, note: "Browser main tabs/history/bookmarks/navigation, BrowserPageView artifact loading, srcdoc sandbox bridge, page facts/window/podcast messaging, link interception, asset/font inlining and popup handoff are source-owned; bounty extension installation remains an explicit optional host callback and podcast mixer routing is connected to the shared source SFX bus." },
  { id: "signal-messenger", complete: true, note: "Signal Messenger presentation and the Daniel service-thread state machine are source-owned; story facts and the jump epoch remain explicit host inputs." },
  { id: "mail", complete: true, note: "Mail data normalization, read/download commands, three-pane presentation, compose failure flow, attachment handling and production binding are source-owned." },
  { id: "files", complete: true, note: "Files artifact/vault normalization, tree/navigation, grid/list presentation, locked-file recovery UI, cold-volume routing, Preview launch and Files intent handling are source-owned; QFR Dock rendering is tracked by the separate Idle/QFR boundary." },
  { id: "idle-qfr", complete: true, note: "Idle/QFR is source-owned: compute-field interaction, generator economy, advanced faction and Heritage effects, assistant/thread/autoclick runtime, GPU/click/Exchange paths, periodic Green Fingers lumps, retraining/Manifold resets, Liu Xing mementos, persistence, initialization cinematic/fact handoff, presentation and QFR Dock no longer require historical JavaScript. Initialization exposes shipped sound-event hooks while the shared AudioManager remains a separate host-audio integration edge." },
  { id: "messenger", complete: false, note: "Messenger now owns IME-safe composition, duplicate-send fencing, failed-send draft preservation, scroll retention, image failure/preview focus restoration and short-window bubbles. Shipped bubble/thread interaction styling, avatar hover/focus parity, mobile thread-pane slide completion fencing, typing-bubble incoming palette, translucent thread-search/service/sealed-composer palette, and the sealed-composer alert/details enter-exit choreography with shipped timings and chevrons are source-owned and parity-gated. Six source story producers are registered alongside cult, with scene-owned clocks/audio and acknowledgement fencing. Deterministic browser acceptance now covers the Daniel typing → sequential reply → evidence-file handoff and world-jump interruption fence. Original-session visual comparison and original-agent sessions remain unverified; see docs/FRONTEND_COVERAGE_MATRIX.md." },
  { id: "games", complete: false, note: "Codenames presentation is source-owned, including flying-card transition behavior. Cake Duel is source-owned end to end, including exact shipped challenge banner/pause/reveal timing. All four game screens and controllers are source-owned. This pass adds Codenames tutorial/narrative presentation and deterministic scenario injection, Chess request/result sheets, Pictionary cover/help/result staging and semantic model reactions. Cake Duel retains its shipped contract gates. Complete browser acceptance, original-agent dialogue/snapshot inference and reference visual comparison remain open; see docs/FRONTEND_GAMES_RECOVERY.md." },
  { id: "live2d", complete: false, note: "The source Cubism engine, model runtime, scene host, cold-open ocean/glyph/postprocessing and seven registered story producers are implemented. Boot fracture, Corruption entry/heal, Memory, Datasea geometry, Farewell actor and Ending now have source modules and independent probes. Story registration does not certify complete behavior: browser failures, remaining interaction differences, original particle comparison and original-agent media acceptance must close before cutover. See the scene-specific recovery documents." },
  { id: "css-ownership", complete: true, note: "Source app CSS is decomposed into tokens, globals, pixel, base, components, Nori theme and desktop shell. Tailwind utilities are generated from source; missing declaration delimiters for 177 theme tokens and the omitted Codenames card stylesheet are repaired and checked through computed styles. No historical stylesheet is loaded. Browser app/game checks use the rebuilt CSS. See docs/FRONTEND_CSS_RECOVERY.md." },
  { id: "supporting-apps", complete: false, note: "Settings, About, Credits, Preview, scoped Debug and scene editing are source-owned. This pass restores Credits brand SVGs, network fault presets with real socket simulation, ledger-backed compute controls, gestures/reaction preview, verified Codenames scenario commands and expression/motion editor channels. Dedicated scene tuners and complete original visual/browser acceptance remain open; see docs/FRONTEND_SYSTEM_RECOVERY.md." },
  { id: "production-entry", complete: false, note: "public/index.html still boots the historical production JavaScript entry." },
];

export const FRONTEND_CUTOVER_READY = FRONTEND_CUTOVER_BOUNDARIES.every(
  (boundary) => boundary.complete,
);

export function listPendingFrontendCutoverBoundaries(): readonly FrontendCutoverBoundary[] {
  return FRONTEND_CUTOVER_BOUNDARIES.filter((boundary) => !boundary.complete);
}
