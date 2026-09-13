# Floating Nori conversation recovery

The right-bottom source conversation previously used a temporary purple card, header, transcript and speech button. This increment replaces that surface using the shipped NormalApp `i2e`, `yt`, `up` and `Lye` behavior as evidence.

| Behavior | Recovered contract |
| --- | --- |
| Position | Right 16 px; maximum width 280 px; minimum width 200 px; viewport-relative width; composer centered on the responsive Dock reserve |
| Shell | Transparent, no card border/header; only individual bubbles and the composer receive pointer input |
| Agent | Mint gradient, gray text, 16/16/16/4 px corners, original border/blur/shadow |
| Player | Gray gradient, light text, opposite alignment and corner, 85% maximum width |
| Composer | Gray glass unfocused; light mint focus surface with 1.02 scale; 28 px icon button; Ctrl/Cmd+K focuses and Escape blurs |
| Messages | Latest three speech lines, keyed by message ID plus block ID, 30-second local-receipt lifetime; stream text updates do not prolong expiry |
| Reconnect | Initial lines on each presentation epoch are historical and do not reappear as new bubbles |
| Motion | 400 ms entry and 350 ms exit; reduced-motion removes transitions; pending exits keep their original deadline |
| Typeface | Nunito 400/600/700 Latin fonts bundled from `@fontsource/nunito`, using an isolated family name to avoid the repository's Sarasa substitute alias |

The existing source text sanitizer and 100 Unicode-code-point limit remain in force. IME confirmation does not submit a message. A failed send retains the draft. Gesture-enabled speech remains available in Settings → Sound, with existing playback and acknowledgements intact.

Validation includes the runtime timeline test, the source typecheck/build/recovery gates, and the real-backend Chromium smoke. The browser checks the transparent 280 px shell, keyboard focus/blur, multiple viewport widths and the actual rendered Nunito font through Chromium's font inspection API. Updated screenshots show the idle and focused composer. The existing speech playback, reconnect, system-app and reset checks still run.

This is the normal floating-chat presentation slice. Chip charge/selection/help overlays, corrupt/cinematic variants, shared UI sound cues, motion-driven stack reflow and speech-synchronized reveal/interrupt still need restoration. The Messenger cutover boundary remains incomplete and the production entry is unchanged.
