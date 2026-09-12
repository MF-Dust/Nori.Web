# Supporting application recovery

The source application now binds Settings, About, system alerts and Credits. The previous source entry could launch these windows but rendered an unrecovered notice. This change does not mark full production parity complete.

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

Settings now drives the shared master/music/SFX/voice mixer, desktop BGM and Browser podcasts. GPU hardware classification and four-second texture downsize hysteresis are implemented while retaining user overrides. About now includes pointer-driven logo tilt, halo and sheen. See [audio/graphics recovery](FRONTEND_AUDIO_GRAPHICS_RECOVERY.md) for evidence and verification. Remaining scene-specific audio cues, story mixer overrides and spatial camera/listener transforms are still open. Credits uses source Lucide symbols for destination icons rather than the original brand paths. Debug and the full PDF/training-log/recovery Preview remain pending.

These supporting-app gaps now have an explicit incomplete cutover boundary. The increase from four to five pending boundaries is better accounting of existing work, not a production regression. `public/index.html` remains on the historical entry until these and the chat/game/scene boundaries pass parity review.
