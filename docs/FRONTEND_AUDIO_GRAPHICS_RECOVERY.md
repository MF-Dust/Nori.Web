# Shared audio, automatic graphics and About recovery

The source desktop now owns one session-scoped WebAudio context with master, music, SFX and voice buses. Settings apply to these buses, including per-track mute. PCM/encoded speech connects to the voice bus without multiplying master volume twice; disabling or disposing speech does not close the mixer. Spatial voice can insert/remove the HRTF panner. The source stage's future 3D camera/listener choreography remains separate.

## Shipped evidence and implemented behavior

| Slice | Evidence | Source behavior |
| --- | --- | --- |
| Mixer | NormalApp `Lt`, `GR`, `bpe`, `ype` | Gesture unlock and retry after suspension; session cleanup; independent gains; music crossfade/ducking; SFX source cleanup and 32-voice limit |
| UI cues | NormalApp `pj`, `Ye`, `Ege` | 195 original cue mappings, including silent entries; nine Chess asset mappings; original gains; shared asset decode cache; up to 120 ms of leading silence removed at the 0.001 threshold |
| Routed interactions | Existing source cue callbacks | Desktop windows, Dock/topbar, Browser navigation, Signal authentication, Nori input focus, Chess and Codenames composer |
| Desktop BGM | NormalApp `sT`, `DQ`, `Ntt`, `Ftt`, `Utt` | Default/Manifold/Void tracks selected from facts; installation/corruption suppression; ending precedence; 2.5-second transitions and 5-second corruption fade |
| Podcast | BrowserPageView `on` and NormalApp `ype.connectMediaElement` | Media element enters SFX bus; seek/rate remain intact; pause or owner release cancels a pending play; disposal disconnects the element |
| GPU mode | index `aS`, `oS`; NormalApp `E8e`, `C8e` | Cached renderer classification, software/Intel fallback, probe-context release, persisted manual choice respected, obsolete adaptive-quality key removed |
| Resolution | NormalApp `IK`, `R8e`, `A4`, `D8e` | Low-tier texture cap, half-scale after bucket selection, immediate growth, four-second stable downsize, explicit mode changes applied immediately |
| About logo | NormalApp `Oge` | Six-degree tilt using spring stiffness 180/damping 18; breathing halo, masked sheen, hover/press feedback, reduced-motion static presentation |

Sound mappings are data owned by the source build and reference existing public assets. No historical JavaScript is imported. Asset requests are deduplicated and aborted on disposal. Slow UI cue loads are discarded after 500 ms to avoid delayed interaction sounds; background music is fenced by target version so an older load cannot replace a newer selection.

## Verification

Runtime tests exercise the audio graph with independently observable nodes, cross-track mute, playback acknowledgements, late loads, bounded polyphony, silence trimming, fact precedence, podcast cancellation, GPU classification and resolution hysteresis. Browser checks use the real decoder and observe actual WebAudio connections: background music and speech share a context, Settings control the output gain, podcasts use SFX gain, and media disposal disconnects/closes the test graph. About pointer tilt and return-to-center are exercised in the desktop smoke.

## Remaining work

This closes the basic shared mixer, desktop BGM, podcast, automatic hardware classification and About-logo gaps. It does not claim all sound call sites or cinematic parity: Idle initialization synthesized sound events, remaining game/reveal cues, story overrides and spatial camera/listener transforms still require their owning scene/controller migrations. Debug, full Preview, chip UI, speech-synchronized reveal/interrupt, game visual/tutorial details and the outer 3D/cinematic scene remain open. Production cutover is still gated.
