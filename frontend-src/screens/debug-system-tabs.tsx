import { debugMessage, debugText } from "../i18n/debug";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import type { NoriFrontendRuntime } from "../runtime/frontend-runtime";
import type { ArcadeServerMessage, JsonValue } from "../runtime/protocol";
import { UI_SOUND_CATALOG } from "../runtime/ui-sound-catalog";
import {
  DESKTOP_MUSIC,
  type AudioDebugTrack,
  type AudioMixerDebugSnapshot,
  type DesktopMusic,
} from "../runtime/audio-mixer";
import type {
  AudioFilterType,
  AudioReverbPreset,
} from "../runtime/audio-track-effects";
import { useAudioSettings } from "../state/audio-store";
import type { NoriSceneState } from "../state/nori-scene";
import { notificationInputFromMessage } from "../state/notification-store";

export interface DebugNotification {
  id: string;
  title: string;
  subtitle?: string;
  body?: string;
  durationMs?: number;
  onClick?: { type: string; appId?: string };
}

type NotificationPushResponse = {
  ok?: boolean;
  pushed?: string;
};

/** Decode only notifications that actually arrived on the production event stream. */
export function notificationFromMessage(
  message: ArcadeServerMessage,
): DebugNotification | null {
  const parsed = notificationInputFromMessage(message);
  if (!parsed) return null;
  const input = parsed.input;
  const action = input.action;
  return {
    id: parsed.id,
    title: input.title,
    ...(input.subtitle !== undefined ? { subtitle: input.subtitle } : {}),
    ...(input.body !== undefined ? { body: input.body } : {}),
    ...(input.durationMs !== undefined ? { durationMs: input.durationMs } : {}),
    ...(action
      ? {
          onClick: {
            type: action.type,
            ...(action.type === "open-app" ? { appId: action.appId } : {}),
          },
        }
      : {}),
  };
}

/** Match the fields that the local backend validates and mirrors to notification.pushed. */
export function notificationPushPayload(input: {
  title: string;
  subtitle: string;
  body: string;
  durationMs: string;
  openAppId: string;
}): Record<string, JsonValue> {
  const duration = Number(input.durationMs);
  return {
    title: input.title.trim() || "NoriOS",
    ...(input.subtitle.trim() ? { subtitle: input.subtitle.trim() } : {}),
    ...(input.body.trim() ? { body: input.body.trim() } : {}),
    ...(input.durationMs.trim() && Number.isFinite(duration) && duration >= 0
      ? { durationMs: duration }
      : {}),
    ...(input.openAppId.trim()
      ? { onClick: { type: "open-app", appId: input.openAppId.trim() } }
      : {}),
  };
}

function useArcadeConnection(frontend: NoriFrontendRuntime) {
  return useSyncExternalStore(
    frontend.arcade.onState.bind(frontend.arcade),
    () => frontend.arcade.connectionState,
  );
}

export function NotificationsDebugTab({
  frontend,
}: {
  frontend: NoriFrontendRuntime;
}) {
  const connection = useArcadeConnection(frontend);
  const [title, setTitle] = useState("From the server");
  const [subtitle, setSubtitle] = useState(
    "Pushed via notification.debug.push",
  );
  const [body, setBody] = useState(
    "Server is the sole author of this message.",
  );
  const [durationMs, setDurationMs] = useState("");
  const [openAppId, setOpenAppId] = useState("");
  const [status, setStatus] = useState("idle");
  const [received, setReceived] = useState<DebugNotification[]>([]);
  const queueSize = useSyncExternalStore(
    frontend.notifications.subscribe,
    () => frontend.notifications.snapshot().queue.length,
    () => frontend.notifications.snapshot().queue.length,
  );

  useEffect(
    () =>
      frontend.arcade.onMessage((message) => {
        const notification = notificationFromMessage(message);
        if (!notification) return;
        setReceived((current) => [notification, ...current].slice(0, 20));
      }),
    [frontend],
  );

  async function pushFromServer() {
    setStatus("Sending…");
    try {
      const result = await frontend.rpc.call<NotificationPushResponse>(
        "notification.debug.push",
        notificationPushPayload({
          title,
          subtitle,
          body,
          durationMs,
          openAppId,
        }),
        "notification.debug.push.result",
      );
      setStatus(
        result.ok
          ? debugMessage("Sent{{id}}", { id: result.pushed ? ` (${result.pushed})` : "" })
          : "Server refused the push",
      );
    } catch (error) {
      setStatus(
        debugMessage("Failed: {{error}}", { error: error instanceof Error ? error.message : String(error) }),
      );
    }
  }

  return (
    <section aria-label={debugText("Notifications debug")}>
      <h2>{debugText("Notifications")}</h2>
      <p>{debugText("Real server round trip:")}{" "}<code>notification.debug.push</code> →{" "}
        <code>notification.pushed</code>.
      </p>
      <dl>
        <dt>{debugText("Arcade connection")}</dt>
        <dd>{debugText(connection)}</dd>
        <dt>{debugText("Source shell queue")}</dt>
        <dd>{queueSize}{debugText("visible notification(s)")}</dd>
      </dl>
      <label>{debugText("Title")}{" "}<input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
      </label>
      <label>{debugText("Subtitle")}{" "}<input
          value={subtitle}
          onChange={(event) => setSubtitle(event.target.value)}
        />
      </label>
      <label>{debugText("Body")}{" "}<input value={body} onChange={(event) => setBody(event.target.value)} />
      </label>
      <label>{debugText("Duration ms")}{" "}<input
          type="number"
          min="0"
          placeholder={debugText("server default")}
          value={durationMs}
          onChange={(event) => setDurationMs(event.target.value)}
        />
      </label>
      <label>{debugText("onClick open app")}{" "}<input
          placeholder={debugText("optional app id")}
          value={openAppId}
          onChange={(event) => setOpenAppId(event.target.value)}
        />
      </label>
      <div className="source-debug-lab-actions">
        <button
          type="button"
          disabled={connection !== "open" || status === "Sending…"}
          onClick={() => void pushFromServer()}
        >{debugText("Push from server")}{" "}</button>
        <output role="status">{debugText(status)}</output>
      </div>
      <h3>{debugText("Observed notification.pushed events (")}{received.length})</h3>
      {received.length === 0 ? (
        <p>{debugText("No notification event observed in this tab session.")}</p>
      ) : (
        <ul>
          {received.map((notification, index) => (
            <li key={`${notification.id}:${index}`}>
              <strong>{notification.title}</strong>
              {notification.subtitle ? ` — ${notification.subtitle}` : ""}
              {notification.body ? <div>{notification.body}</div> : null}
              <code>{notification.id}</code>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function InjectTalkDebugTab({
  frontend,
}: {
  frontend: NoriFrontendRuntime;
}) {
  const connection = useArcadeConnection(frontend);
  const chat = useSyncExternalStore(
    frontend.conversation.subscribe,
    frontend.conversation.snapshot,
  );
  return (
    <section aria-label={debugText("Inject Talk debug")}>
      <h2>{debugText("Inject Talk")}</h2>
      <p role="status">{debugText("Unavailable: this backend does not implement")}{" "}
        <code>debug.chat_inject_talk.request</code>{debugText("or the private agent inject-talk queue.")}{" "}</p>
      <p>{debugText("No authored line is sent, and no agent output is fabricated.")}</p>
      <h3>{debugText("Live session status")}</h3>
      <dl>
        <dt>{debugText("Arcade connection")}</dt>
        <dd>{debugText(connection)}</dd>
        <dt>{debugText("Chat connection")}</dt>
        <dd>{debugText(chat.connected ? debugText("connected") : debugText("disconnected"))}</dd>
        <dt>{debugText("Chat phase")}</dt>
        <dd>{debugText(chat.phase)}</dd>
      </dl>
    </section>
  );
}

export function NoriContextDebugTab({
  frontend,
}: {
  frontend: NoriFrontendRuntime;
}) {
  const connection = useArcadeConnection(frontend);
  const [world, setWorld] = useState(() => frontend.world.snapshot());
  useEffect(() => {
    setWorld(frontend.world.snapshot());
    return frontend.world.subscribe((state) => setWorld(state));
  }, [frontend]);
  const chat = useSyncExternalStore(
    frontend.conversation.subscribe,
    frontend.conversation.snapshot,
  );
  const facts = frontend.world.facts().size;
  return (
    <section aria-label={debugText("Nori Context debug")}>
      <h2>{debugText("Nori Context")}</h2>
      <p role="status">{debugText("Unavailable: this backend does not implement")}{" "}
        <code>debug.chat_context.stats</code>,{" "}
        <code>debug.chat_context.append</code>{debugText(", or")}{" "}
        <code>debug.chat_context.reset</code>.
      </p>
      <p>{debugText("Token budgets, history segments, and replay scenarios are private agent/server state, so this source tab does not estimate or modify them.")}{" "}</p>
      <h3>{debugText("Source-observable session facts")}</h3>
      <dl>
        <dt>{debugText("Arcade connection")}</dt>
        <dd>{debugText(connection)}</dd>
        <dt>{debugText("World")}</dt>
        <dd>{world.worldId ?? debugText("Not joined")}</dd>
        <dt>{debugText("Visible facts")}</dt>
        <dd>{facts}</dd>
        <dt>{debugText("Chat phase")}</dt>
        <dd>{debugText(chat.phase)}</dd>
        <dt>{debugText("Pending command")}</dt>
        <dd>{debugText(String(chat.pending))}</dd>
      </dl>
    </section>
  );
}

type AudioNumberKey =
  "masterVolume" | "musicVolume" | "sfxVolume" | "voiceVolume";

export function syncDebugAudioSettings(
  frontend: NoriFrontendRuntime,
  update: () => void,
) {
  update();
  const next = useAudioSettings.getState();
  frontend.audio.sync(next);
  frontend.speech.setVolume(1, next.voiceRate);
}

function AudioSlider({
  frontend,
  label,
  setting,
  value,
  update,
}: {
  frontend: NoriFrontendRuntime;
  label: string;
  setting: AudioNumberKey;
  value: number;
  update(value: number): void;
}) {
  return (
    <label>
      {debugText(label)}
      <input
        aria-label={debugText(label)}
        type="range"
        min="0"
        max="100"
        value={value}
        onChange={(event) =>
          syncDebugAudioSettings(frontend, () =>
            update(Number(event.target.value)),
          )
        }
        data-audio-setting={setting}
      />
      <output>{value}%</output>
    </label>
  );
}

export function spatialGain(snapshot: Pick<
  AudioMixerDebugSnapshot,
  "listenerPos" | "speechPos" | "distanceParams"
>) {
  const listener = snapshot.listenerPos;
  const source = snapshot.speechPos;
  const params = snapshot.distanceParams;
  if (!listener || !source || !params) return null;
  const distance = Math.hypot(
    listener.x - source.x,
    listener.y - source.y,
    listener.z - source.z,
  );
  if (params.model !== "inverse") return { distance, gain: null };
  const normalized = Math.max(distance, params.refDistance);
  const gain =
    params.refDistance /
    (params.refDistance +
      params.rolloffFactor * (normalized - params.refDistance));
  return { distance, gain };
}

function TrackEffectsDebug({
  frontend,
  track,
  label,
  snapshot,
}: {
  frontend: NoriFrontendRuntime;
  track: AudioDebugTrack;
  label: string;
  snapshot: AudioMixerDebugSnapshot["effects"][AudioDebugTrack];
}) {
  const reverbs: AudioReverbPreset[] = ["none", "room", "hall", "cave"];
  const filters: AudioFilterType[] = [
    "none",
    "lowpass",
    "highpass",
    "bandpass",
  ];
  return (
    <div>
      <h4>{debugText(label)}</h4>
      <label>{debugText("Reverb")}{" "}<select
          aria-label={`${debugText(label)} ${debugText("Reverb")}`}
          value={snapshot.reverb}
          onChange={(event) =>
            void frontend.audio.debugSetReverb(
              track,
              event.target.value as AudioReverbPreset,
              snapshot.wetness || 0.3,
            )
          }
        >
          {reverbs.map((preset) => (
            <option key={preset} value={preset}>{debugText(preset)}</option>
          ))}
        </select>
      </label>
      {snapshot.reverb !== "none" && (
        <label>{debugText("Wet")}{" "}<input
            aria-label={`${debugText(label)} ${debugText("Wet")}`}
            type="range"
            min="0"
            max="100"
            step="1"
            value={snapshot.wetness * 100}
            onChange={(event) =>
              frontend.audio.debugSetWetness(
                track,
                event.target.valueAsNumber / 100,
              )
            }
          />
          <output>{Math.round(snapshot.wetness * 100)}%</output>
        </label>
      )}
      <label>{debugText("Filter")}{" "}<select
          aria-label={`${debugText(label)} ${debugText("Filter")}`}
          value={snapshot.filter}
          onChange={(event) =>
            frontend.audio.debugSetFilter(
              track,
              event.target.value as AudioFilterType,
              snapshot.frequency,
              snapshot.q,
            )
          }
        >
          {filters.map((filter) => (
            <option key={filter} value={filter}>{debugText(filter)}</option>
          ))}
        </select>
      </label>
      {snapshot.filter !== "none" && (
        <>
          <label>{debugText("Freq")}{" "}<input
              aria-label={`${debugText(label)} ${debugText("Filter")} ${debugText("Freq")}`}
              type="range"
              min="20"
              max="20000"
              step="1"
              value={snapshot.frequency}
              onChange={(event) =>
                frontend.audio.debugSetFilterFrequency(
                  track,
                  event.target.valueAsNumber,
                )
              }
            />
            <output>{snapshot.frequency.toFixed(0)} Hz</output>
          </label>
          <label>
            Q
            <input
              aria-label={`${debugText(label)} ${debugText("Filter")} Q`}
              type="range"
              min="0.1"
              max="20"
              step="0.1"
              value={snapshot.q}
              onChange={(event) =>
                frontend.audio.debugSetFilterQ(
                  track,
                  event.target.valueAsNumber,
                )
              }
            />
            <output>{snapshot.q.toFixed(1)}</output>
          </label>
        </>
      )}
    </div>
  );
}

export function AudioDebugTab({
  frontend,
  setScene,
}: {
  frontend: NoriFrontendRuntime;
  setScene(patch: Partial<NoriSceneState>): void;
}) {
  const audio = useAudioSettings();
  const scene = useSyncExternalStore(
    frontend.scene.subscribe,
    frontend.scene.snapshot,
  );
  const [cue, setCue] = useState("chess.moveSelf");
  const [mixer, setMixer] = useState(() => frontend.audio.debugSnapshot());
  const [speechLevel, setSpeechLevel] = useState(0);
  const [crossfade, setCrossfade] = useState(1);
  const cues = useMemo(
    () =>
      Object.entries(UI_SOUND_CATALOG)
        .filter((entry) => entry[1] !== null)
        .map((entry) => entry[0]),
    [],
  );
  const spatial = spatialGain(mixer);

  useEffect(() => {
    const refresh = () => {
      setMixer(frontend.audio.debugSnapshot());
      setSpeechLevel(frontend.speech.level());
    };
    refresh();
    const timer = window.setInterval(refresh, 100);
    return () => window.clearInterval(timer);
  }, [frontend]);

  async function resume() {
    await frontend.audio.debugResume();
    setMixer(frontend.audio.debugSnapshot());
  }

  async function suspend() {
    await frontend.audio.debugSuspend();
    setMixer(frontend.audio.debugSnapshot());
  }

  async function loadMusic() {
    await frontend.audio.debugLoadMusic();
    setMixer(frontend.audio.debugSnapshot());
  }

  async function playCue() {
    await frontend.audio.unlock();
    frontend.audio.playCue(cue);
    setMixer(frontend.audio.debugSnapshot());
  }

  const update = (action: () => void) =>
    syncDebugAudioSettings(frontend, action);
  return (
    <section aria-label={debugText("Audio debug")}>
      <h2>{debugText("Audio")}</h2>
      <h3>{debugText("Status")}</h3>
      <dl>
        <dt>{debugText("Initialized")}</dt>
        <dd>{debugText(mixer.initialized ? debugText("Yes") : debugText("No"))}</dd>
        <dt>{debugText("Context State")}</dt>
        <dd>{debugText(mixer.contextState)}</dd>
        <dt>{debugText("Speech Spatial")}</dt>
        <dd>{mixer.speechHasPanner ? "3D (HRTF)" : "2D (Stereo)"}</dd>
        <dt>{debugText("Speech level")}</dt>
        <dd>{speechLevel.toFixed(2)}</dd>
        <dt>{debugText("Scene music")}</dt>
        <dd>{scene.bgm}</dd>
        <dt>{debugText("Corrupt voice")}</dt>
        <dd>{debugText(scene.corruptVoice ? debugText("active") : debugText("inactive"))}</dd>
      </dl>
      <div className="source-debug-lab-actions">
        <button
          type="button"
          disabled={mixer.contextState === "running"}
          onClick={() => void resume()}
        >{debugText("Resume")}{" "}</button>
        <button
          type="button"
          disabled={mixer.contextState !== "running"}
          onClick={() => void suspend()}
        >{debugText("Suspend")}{" "}</button>
      </div>

      {mixer.speechHasPanner && (
        <>
          <h3>{debugText("3D Spatial (Speech)")}</h3>
          <dl>
            <dt>{debugText("Listener (Camera)")}</dt>
            <dd>
              {mixer.listenerPos
                ? `(${mixer.listenerPos.x.toFixed(1)}, ${mixer.listenerPos.y.toFixed(1)}, ${mixer.listenerPos.z.toFixed(1)})`
                : debugText("N/A")}
            </dd>
            <dt>{debugText("Source (Nori)")}</dt>
            <dd>
              {mixer.speechPos
                ? `(${mixer.speechPos.x.toFixed(1)}, ${mixer.speechPos.y.toFixed(1)}, ${mixer.speechPos.z.toFixed(1)})`
                : debugText("N/A")}
            </dd>
            <dt>{debugText("Distance")}</dt>
            <dd>{spatial ? spatial.distance.toFixed(2) : debugText("N/A")}</dd>
            <dt>{debugText("Model")}</dt>
            <dd>
              {mixer.distanceParams
                ? `${mixer.distanceParams.model} (ref=${mixer.distanceParams.refDistance}, roll=${mixer.distanceParams.rolloffFactor})`
                : debugText("N/A")}
            </dd>
            <dt>{debugText("Calculated Gain")}</dt>
            <dd>
              {spatial?.gain === null || spatial?.gain === undefined
                ? debugText("N/A")
                : `${(spatial.gain * 100).toFixed(1)}%`}
            </dd>
          </dl>
        </>
      )}

      <h3>{debugText("Scene audio")}</h3>
      <label>
        <input
          type="checkbox"
          checked={scene.corruptVoice}
          onChange={(event) => setScene({ corruptVoice: event.target.checked })}
        />{debugText("Corrupt voice")}{" "}</label>
      <label>{debugText("Desktop music")}{" "}<select
          value={scene.bgm}
          onChange={(event) =>
            setScene({ bgm: event.target.value as NoriSceneState["bgm"] })
          }
        >
          <option value="auto">{debugText("auto")}</option>
          <option value="silent">{debugText("silent")}</option>
          <option value="bgm1">bgm1</option>
          <option value="bgm_manifold">bgm_manifold</option>
          <option value="bgm_void">bgm_void</option>
        </select>
      </label>

      <h3>{debugText("Volume (settings → session mixer)")}</h3>
      <AudioSlider
        frontend={frontend}
        label={debugText("Master")}
        setting="masterVolume"
        value={audio.masterVolume}
        update={audio.setMasterVolume}
      />
      <AudioSlider
        frontend={frontend}
        label={debugText("Music")}
        setting="musicVolume"
        value={audio.musicVolume}
        update={audio.setMusicVolume}
      />
      <AudioSlider
        frontend={frontend}
        label={debugText("SFX")}
        setting="sfxVolume"
        value={audio.sfxVolume}
        update={audio.setSfxVolume}
      />
      <AudioSlider
        frontend={frontend}
        label={debugText("Voice")}
        setting="voiceVolume"
        value={audio.voiceVolume}
        update={audio.setVoiceVolume}
      />
      {[
        ["Master mute", audio.isMuted, audio.toggleMute],
        ["Music mute", audio.musicMuted, audio.toggleMusicMuted],
        ["SFX mute", audio.sfxMuted, audio.toggleSfxMuted],
        ["Voice mute", audio.voiceMuted, audio.toggleVoiceMuted],
      ].map(([label, checked, toggle]) => (
        <label key={String(label)}>
          <input
            type="checkbox"
            checked={Boolean(checked)}
            onChange={() => update(toggle as () => void)}
          />
          {debugText(String(label))}
        </label>
      ))}
      <label>
        <input
          type="checkbox"
          checked={audio.spatialVoice}
          onChange={(event) =>
            update(() => audio.setSpatialVoice(event.target.checked))
          }
        />{debugText("3D voice (HRTF)")}{" "}</label>
      <label>{debugText("Voice speed")}{" "}<input
          aria-label={debugText("Voice speed")}
          type="range"
          min="0.5"
          max="2"
          step="0.05"
          value={audio.voiceRate}
          onChange={(event) =>
            update(() => audio.setVoiceRate(Number(event.target.value)))
          }
        />
        <output>{audio.voiceRate.toFixed(2)}×</output>
      </label>

      <h3>{debugText("Music")}</h3>
      <p>{debugText("Loaded:")}{" "}{mixer.loadedMusic.join(", ") || "none"}</p>
      <button type="button" onClick={() => void loadMusic()}>{debugText("Load test music")}{" "}</button>
      <div className="source-debug-lab-actions">
        {(Object.keys(DESKTOP_MUSIC) as DesktopMusic[]).map((track) => (
          <button
            type="button"
            key={track}
            aria-pressed={mixer.musicTrackId === track}
            disabled={!mixer.loadedMusic.includes(track)}
            onClick={() => frontend.audio.debugPlayMusic(track)}
          >{debugText("Play")}{" "}{track}
          </button>
        ))}
      </div>
      <div className="source-debug-lab-actions">
        <button
          type="button"
          disabled={!mixer.musicPlaying}
          onClick={() => frontend.audio.debugPauseMusic()}
        >{debugText("Pause")}{" "}</button>
        <button
          type="button"
          disabled={!mixer.musicPaused}
          onClick={() => frontend.audio.debugResumeMusic()}
        >{debugText("Resume music")}{" "}</button>
        <button
          type="button"
          disabled={!mixer.musicPlaying && !mixer.musicPaused}
          onClick={() => frontend.audio.debugStopMusic()}
        >{debugText("Stop")}{" "}</button>
      </div>
      {mixer.musicDuration > 0 && (
        <label>{debugText("Music position")}{" "}<input
            aria-label={debugText("Music position")}
            type="range"
            min="0"
            max={mixer.musicDuration}
            step="0.1"
            value={mixer.musicCurrentTime}
            onChange={(event) =>
              frontend.audio.debugSeekMusic(event.target.valueAsNumber)
            }
          />
          <output>
            {mixer.musicCurrentTime.toFixed(1)} / {mixer.musicDuration.toFixed(1)} s
          </output>
        </label>
      )}
      <label>{debugText("Crossfade")}{" "}<input
          aria-label={debugText("Crossfade")}
          type="range"
          min="0.5"
          max="5"
          step="0.5"
          value={crossfade}
          onChange={(event) => setCrossfade(event.target.valueAsNumber)}
        />
        <output>{crossfade.toFixed(1)} s</output>
      </label>
      <div className="source-debug-lab-actions">
        {(Object.keys(DESKTOP_MUSIC) as DesktopMusic[]).map((track) => (
          <button
            type="button"
            key={`fade-${track}`}
            disabled={
              !mixer.loadedMusic.includes(track) ||
              mixer.musicTrackId === track ||
              !mixer.musicPlaying
            }
            onClick={() =>
              frontend.audio.debugCrossfadeMusic(track, crossfade)
            }
          >{debugText("Fade to")}{" "}{track}
          </button>
        ))}
      </div>

      <h3>{debugText("Sound Effects")}</h3>
      <p>{debugText("Loaded buffers:")}{" "}{mixer.loadedSfx.length}</p>
      <label>{debugText("Cue")}{" "}<select value={cue} onChange={(event) => setCue(event.target.value)}>
          {cues.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
      </label>
      <button type="button" onClick={() => void playCue()}>{debugText("Play cue")}{" "}</button>
      <dl>
        <dt>{debugText("Active Sounds")}</dt>
        <dd>{mixer.sfxActiveCount}</dd>
      </dl>
      <h3>{debugText("Effects")}</h3>
      <TrackEffectsDebug
        frontend={frontend}
        track="speech"
        label={debugText("Speech")}
        snapshot={mixer.effects.speech}
      />
      <TrackEffectsDebug
        frontend={frontend}
        track="music"
        label={debugText("Music")}
        snapshot={mixer.effects.music}
      />
      <TrackEffectsDebug
        frontend={frontend}
        track="sfx"
        label={debugText("SFX")}
        snapshot={mixer.effects.sfx}
      />
    </section>
  );
}
