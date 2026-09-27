# Supporting application recovery

The source application now binds Settings, About, system alerts and Credits. At HEAD `085bad3`, the Debug panel and scene editor are source-owned as well. The remaining Debug boundary is limited to original layout comparison and the private Inject Talk/Nori Context handlers; other supporting-app visual parity remains tracked separately, and this does not mark full production parity complete.

## Recovered behavior

| Application | Source behavior | Shipped evidence |
| --- | --- | --- |
| Settings | Four-section scroll/navigation, master/track volume and mute, persisted graphics mode, online/socket status, five-sample latency test, reset confirmation/error/reboot | NormalApp `iAe`, `qRe`, `XRe`, `tAe`, `rAe` |
| Graphics | `graphics-store` v1 persistence and v0 user-choice migration; live session updates without model reload; resolution tier ladder and ultra-performance half-scale/30 fps | NormalApp `rs`, `Cj`, `R8e`, `A4`, `j8e` |
| About | NoriOS icon/title, contributor data, looping credit roll, hover/focus pause, reduced-motion static roll | NormalApp `Fge`, `HL`, `Dge` |
| System alert | Localized fallback title/message, optional error code, window title synchronization and close action | NormalApp `obe` |
| Credits | Capsule art, localized content, original destinations/group IDs, delayed reveal/particles, clipboard feedback, `credits.opened` fact | NormalApp `DOe`, `AOe`, `TOe` and Credits CSS |

`SystemService` installs response listeners before sending, times out unavailable replies, rejects on socket loss, and deduplicates reset and latency requests across Settings windows. The protocol's pong has no request ID; measurements are serialized. No periodic background ping is introduced. Unrelated messages cannot confirm a reset.

Reset is initiated only by the confirmation action. It waits for `web_world_reset_ack` before stopping Idle autosave, signing out, clearing `idle.run:*` and the source desktop store, and reloading. An unacknowledged request leaves progress storage intact and reports failure. Audio and graphics preferences are retained.

## Verification

- `frontend:runtime:test` covers reset deduplication, unrelated replies, acknowledgement, timeout, cancellation and disconnect (see the current runtime test report).
- `frontend:app:smoke` boots the real model/backend, opens About and Settings through the desktop menus, persists master volume, checks master mute disables sliders, applies 30 fps immediately, measures real ping/pong latency, verifies reset cancellation sends nothing, and reloads to check window/settings restoration.
- The same browser test emits the Credits Dock condition in its disposable local world and opens Credits through the Dock. It waits for reveal completion before taking a screenshot.
- The destructive-flow browser check runs only against the local backend spawned by the smoke script. It checks reset acknowledgement precedes reboot and the old Idle save is removed.
- Existing source typecheck, build, bundle recovery and historical-import gates remain enabled.

## Remaining parity

Settings now drives the shared master/music/SFX/voice mixer, desktop BGM and Browser podcasts. GPU hardware classification and four-second texture downsize hysteresis are implemented while retaining user overrides. About now includes pointer-driven logo tilt, halo and sheen. See [audio/graphics recovery](FRONTEND_AUDIO_GRAPHICS_RECOVERY.md) for evidence and verification. Scene desktop-music overrides and spatial camera/listener transforms are now connected. Most cinematic audio choreography remains open. Credits uses source Lucide symbols for destination icons rather than the original brand paths. Preview PDF pagination, thumbnails, zoom, text selection, literal clue markers, training-log rendering and artifact refresh are now source-owned. The existing Files dialog owns locked-file recovery. The Debug panel and scene editor are source-owned; the remaining Debug gaps are original layout comparison and the private Inject Talk/Nori Context handlers. See [Preview/chip recovery](FRONTEND_PREVIEW_CHIP_RECOVERY.md).

These supporting-app gaps remain behind the `supporting-apps` false cutover gate. The five false gates are `messenger`, `games`, `live2d`, `supporting-apps` and `production-entry`; none is changed by this source ownership update. `public/index.html` remains on the historical entry until the required parity review is complete.


## Supporting resilience pass

Settings now collapses its section navigation into a horizontally scrollable strip at narrow widths and exposes the content region to keyboard users. Preview rejects empty/invalid PDFs with the localized error state and safely handles late worker destruction. Audio unlock listeners re-arm on the default window focus path and are removed on disposal. These are source-owned fixes; private agent controls remain explicitly unavailable.
## Debug controls

The desktop Debug window now binds live connection/cartridge versions, scoped camera/model/screen controls, audio cue audition, corruption voice and desktop-music selection, and read-only fact filtering. Previously visited panels retain their local state. Scene overrides are acquired only when edited and released by the reset button, world change or window close. The browser probe verifies camera editing, reset, audio unlock and corruption-voice cleanup.

This restores the source-owned Debug surface, not the original layout. The network, compute, gesture, reaction, game-scenario, tuner, Live2D, Audio, Pat and notification panels bind the production runtime; the private Inject Talk/Nori Context handlers are intentionally unavailable and only expose blocker/session state. The cult drone has a cancellable timeline player; story-specific cues still require original-parity evidence.


## Scoped scene-project editor

Debug now includes a source-owned scene editor for validated JSON phase projects. It projects camera/model/light state and plays local audio intervals through the existing shared runtime, supports explicit gates and pause/resume, and releases overrides/audio on stop, completion, tab exit or world change. It never completes a production story or invents story facts. Invalid configuration produces an error before playback. Shatter and Datasea production tuners are also source-owned; original layout and private-agent handler acceptance remain listed in [FRONTEND_REMAINING_WORK.md](FRONTEND_REMAINING_WORK.md).

## Corruption Debug study

The Corruption tab launches a scoped eleven-phase preview with six antivirus microgames. Its full-screen surface has pause/resume and close controls, foreground-only timing, keyboard/pointer input and small-window scrolling. It cannot emit a story fact; the production Corruption producer is separately registered, while original animation, layout, media and live-agent parity remain separate acceptance work.
