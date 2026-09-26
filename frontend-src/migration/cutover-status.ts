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
  { id: "browser-main", complete: true, note: "Browser main tabs/history/bookmarks/navigation, BrowserPageView artifact loading, srcdoc sandbox bridge, page facts/window/podcast messaging, link interception, asset/font inlining and popup handoff are source-owned. The shipped bounty-extension permission flow, installed toolbar, page/file claims, progress state and backend fact broadcast are source-owned; podcast mixer routing uses the shared source SFX bus, and stable window callbacks/void effect cleanups prevent title/status update loops." },
  { id: "signal-messenger", complete: true, note: "Signal Messenger presentation and the Daniel service-thread state machine are source-owned; story facts and the jump epoch remain explicit host inputs." },
  { id: "mail", complete: true, note: "Mail data normalization, read/download commands, three-pane presentation, compose failure flow, attachment handling and production binding are source-owned." },
  { id: "files", complete: true, note: "Files artifact/vault normalization, tree/navigation, grid/list presentation, locked-file recovery UI, cold-volume routing, Preview launch and Files intent handling are source-owned; QFR Dock rendering is tracked by the separate Idle/QFR boundary." },
  { id: "idle-qfr", complete: true, note: "Idle/QFR is source-owned: compute-field interaction, generator economy, advanced faction and Heritage effects, assistant/thread/autoclick runtime, GPU/click/Exchange paths, periodic Green Fingers lumps, retraining/Manifold resets, Liu Xing mementos, persistence, initialization cinematic/fact handoff, presentation and QFR Dock no longer require historical JavaScript. Initialization exposes shipped sound-event hooks while the shared AudioManager remains a separate host-audio integration edge. Browser probe idle-ribbon passed for circle, chubby, spiky and nori: each shape draws, redraws when the growth step changes, and releases its canvas on unmount. The ribbon is mounted from IdleScreen via MarginalGrowthRibbonView: cache decode, topology, the shipped GLSL/WGSL and the Pixi mesh are ported, and autoplay advances steps at 60/s.  public/assets/IdleScreen-DCDB640k.js:490-2486 (~75 KB including a 33 KB hand-written GLSL vertex/fragment pair) drives a growing branching ribbon from a baked topology asset, and IdleScreen mounts it unconditionally at :6312 as a plain sibling with no fact, flag or alignment gate. IdleScreen now mounts the ported Pixi ribbon, and the store is bound to the live generator economy. It is not merely decorative: the ribbon is non-empty from the first frame (stepOffset 90 of maxSteps 700) and responds to gameplay (217 steps at one of each generator, 438 at ten, 594 at a hundred, asymptote 700) off the growthWeight table that is already source-owned. Nothing reads it back, so the economy is unaffected — the capability is missing, not broken. Four shipped shapes (circle/chubby/spiky/nori) map 1:1 to the four alignments and all four .bin caches ship. No new dependency would be needed: pixi.js 8.17.1 is already a dependency and the shipped Pixi is the same version. scripts/verify_frontend_cutover.mjs now fails if any frontend-src file references a marginal-growth-cache-*.bin, so a stubbed port cannot pass silently. Remaining before this boundary can close: a browser probe that mounts each of circle, chubby, spiky and nori, checks that the mesh draws and ticks, and checks that unmount releases the Pixi app.." },
  { id: "messenger", complete: false, note: "UI/lifecycle/styling complete and verified. All source components implemented: IME-safe composition, duplicate-send fencing, failed-send draft preservation, scroll retention, image failure/preview focus, bubble/thread styling, read/unread metadata, shell notifications, Signal artifact-delta handling. Deterministic Chromium tests pass (read/reread windows, Daniel typing → reply → evidence handoff, world-jump interruption). Runtime tests pass (message ordering, draft preservation, notification queue). Browser acceptance tests pass. Test evidence: frontend:app:smoke PASS, unit tests PASS, integration tests PASS (2026-09-26). Remaining: agent-dependent features only (original-agent dialogue sessions, full-corpus agent responses, media sessions). See FRONTEND_TEST_EVIDENCE_SUMMARY.md." },
  { id: "games", complete: false, note: "All 4 game runtimes complete and verified. Test evidence: frontend:games:smoke PASS (2026-09-26) covering Chess 22-ply tutorial + free play + special moves, Pictionary drawing + dual-locale hints + audio, Codenames 13-step tutorial + sudden-death + card animations. Cake Duel is not exercised by that script; its protocol, card/hand/HUD layout, action state and challenge banner/pause/reveal timing are covered by `tests/frontend-games.test.ts` plus five `verify_cakeduel_*` gates, and its desktop lifecycle is covered by `scripts/frontend_games_lifecycle_test.mjs`. Runtime tests PASS (edge cases, stroke limits, request correlation, cleanup). Browser tests PASS (interactions, canvas, computed styles). Cartridge lifecycle, request acknowledgements, timeouts, visibility advancement all source-owned. Dual locale verified (English/Chinese), reduced motion verified. Codenames presentation is source-owned end to end, including the recovered flying-card transition behavior (source rect to slot rect interpolation, 180-degree flip and the shipped card flight duration). Cake Duel is source-owned end to end, including exact shipped challenge banner/pause/reveal timing. Remaining: agent-dependent features only (Codenames dialogue/voice/clue-guess, Chess agent speech, Pictionary snapshot inference, Cake Duel agent media sessions). See FRONTEND_TEST_EVIDENCE_SUMMARY.md." },
  { id: "live2d", complete: false, note: "The source Cubism engine, model runtime, scene host, cold-open ocean/glyph/postprocessing and seven registered story producers are implemented. Boot and Ending timeline/camera math was re-derived from the shipped cold-open code and matches constant-for-constant, including the YP = -0.6 world offset, the settle formula, the dive arc and the wake burst splits. The Corruption camera track did NOT: it used pre-offset preset Y values and so sat 0.6 too high for the whole scene, and returned over cl_brightenDuration 2.1 instead of min(wakeReturnDur 1.4, 2.1); both are fixed. Memory lost the shipped Math.min(1, voidDur*0.45) clamp and held a flat shake instead of the 0.7 peak decaying over 2s. The Datasea message cursor folded the type duration into the shipped gap+dots cursor, drifting line 12 by +25.5s past the phase end, and the CG type duration used max where the shipped used min. Each was verified against the bundle and fixed. Deterministic fake-clock capture now covers all seven producers (44 frames + manifest), Cult has scripts/probes/frontend_cult_probe.mjs, and story registration never certified complete behavior. Memory drain-burst is a 55-sprite THREE.Points emitter on NoriSceneRenderer, re-fired every 180ms of drain time: original particle/model-motion/cinematic comparison and the agent media work remain open. See FRONTEND_BOOT_CORRUPTION_RECOVERY.md." },
  { id: "css-ownership", complete: true, note: "Source app CSS is decomposed into tokens, globals, pixel, base, components, Nori theme and desktop shell. Tailwind utilities are generated from source; missing declaration delimiters for 177 theme tokens and the omitted Codenames card stylesheet are repaired and checked through computed styles. No historical stylesheet is loaded. Browser app/game checks use the rebuilt CSS. See docs/FRONTEND_CSS_RECOVERY.md." },
  { id: "supporting-apps", complete: true, note: "Settings, About, Credits, Preview, scoped Debug and scene editing are source-owned and smoke-tested. Debug binds the production Live2D, Audio, Pat and reaction runtimes, all recovered Chess/Codenames/Cake Duel scenarios, and the Shatter/Datasea tuners; the shipped chunk exposes no additional dedicated cinematic tuner family. Private Inject Talk and Nori Context handlers are documented as intentionally unavailable (local backend limitation, not a source gap). See docs/FRONTEND_SYSTEM_RECOVERY.md and smoke evidence in frontend:app:smoke." },
  { id: "production-entry", complete: false, note: "public/index.html still boots the historical production JavaScript entry." },
];

export const FRONTEND_CUTOVER_READY = FRONTEND_CUTOVER_BOUNDARIES.every(
  (boundary) => boundary.complete,
);

export function listPendingFrontendCutoverBoundaries(): readonly FrontendCutoverBoundary[] {
  return FRONTEND_CUTOVER_BOUNDARIES.filter((boundary) => !boundary.complete);
}
