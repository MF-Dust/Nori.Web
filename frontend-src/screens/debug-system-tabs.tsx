import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import type { NoriFrontendRuntime } from "../runtime/frontend-runtime";
import type { ArcadeServerMessage, JsonValue } from "../runtime/protocol";
import { UI_SOUND_CATALOG } from "../runtime/ui-sound-catalog";
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
          ? `Sent${result.pushed ? ` (${result.pushed})` : ""}`
          : "Server refused the push",
      );
    } catch (error) {
      setStatus(
        `Failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  return (
    <section aria-label="Notifications debug">
      <h2>Notifications</h2>
      <p>
        Real server round trip: <code>notification.debug.push</code> →{" "}
        <code>notification.pushed</code>.
      </p>
      <dl>
        <dt>Arcade connection</dt>
        <dd>{connection}</dd>
        <dt>Source shell queue</dt>
        <dd>{queueSize} visible notification(s)</dd>
      </dl>
      <label>
        Title
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
      </label>
      <label>
        Subtitle
        <input
          value={subtitle}
          onChange={(event) => setSubtitle(event.target.value)}
        />
      </label>
      <label>
        Body
        <input value={body} onChange={(event) => setBody(event.target.value)} />
      </label>
      <label>
        Duration ms
        <input
          type="number"
          min="0"
          placeholder="server default"
          value={durationMs}
          onChange={(event) => setDurationMs(event.target.value)}
        />
      </label>
      <label>
        onClick open app
        <input
          placeholder="optional app id"
          value={openAppId}
          onChange={(event) => setOpenAppId(event.target.value)}
        />
      </label>
      <div className="source-debug-lab-actions">
        <button
          type="button"
          disabled={connection !== "open" || status === "Sending…"}
          onClick={() => void pushFromServer()}
        >
          Push from server
        </button>
        <output role="status">{status}</output>
      </div>
      <h3>Observed notification.pushed events ({received.length})</h3>
      {received.length === 0 ? (
        <p>No notification event observed in this tab session.</p>
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
    <section aria-label="Inject Talk debug">
      <h2>Inject Talk</h2>
      <p role="status">
        Unavailable: this backend does not implement{" "}
        <code>debug.chat_inject_talk.request</code> or the private agent
        inject-talk queue.
      </p>
      <p>No authored line is sent, and no agent output is fabricated.</p>
      <h3>Live session status</h3>
      <dl>
        <dt>Arcade connection</dt>
        <dd>{connection}</dd>
        <dt>Chat connection</dt>
        <dd>{chat.connected ? "connected" : "disconnected"}</dd>
        <dt>Chat phase</dt>
        <dd>{chat.phase}</dd>
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
    <section aria-label="Nori Context debug">
      <h2>Nori Context</h2>
      <p role="status">
        Unavailable: this backend does not implement{" "}
        <code>debug.chat_context.stats</code>,{" "}
        <code>debug.chat_context.append</code>, or{" "}
        <code>debug.chat_context.reset</code>.
      </p>
      <p>
        Token budgets, history segments, and replay scenarios are private
        agent/server state, so this source tab does not estimate or modify them.
      </p>
      <h3>Source-observable session facts</h3>
      <dl>
        <dt>Arcade connection</dt>
        <dd>{connection}</dd>
        <dt>World</dt>
        <dd>{world.worldId ?? "Not joined"}</dd>
        <dt>Visible facts</dt>
        <dd>{facts}</dd>
        <dt>Chat phase</dt>
        <dd>{chat.phase}</dd>
        <dt>Pending command</dt>
        <dd>{String(chat.pending)}</dd>
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
      {label}
      <input
        aria-label={label}
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
  const [status, setStatus] = useState(() =>
    frontend.audio.canPlay() ? "running" : "locked",
  );
  const [speechLevel, setSpeechLevel] = useState(0);
  const cues = useMemo(
    () =>
      Object.entries(UI_SOUND_CATALOG)
        .filter((entry) => entry[1] !== null)
        .map((entry) => entry[0]),
    [],
  );

  useEffect(() => {
    const timer = window.setInterval(() => {
      setStatus(frontend.audio.canPlay() ? "running" : "locked");
      setSpeechLevel(frontend.speech.level());
    }, 200);
    return () => window.clearInterval(timer);
  }, [frontend]);

  async function unlock() {
    try {
      const running = await frontend.audio.unlock();
      setStatus(running ? "running" : "suspended");
    } catch (error) {
      setStatus(
        `error: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  async function playCue() {
    try {
      await frontend.audio.unlock();
      frontend.audio.playCue(cue);
      setStatus("running");
    } catch (error) {
      setStatus(
        `error: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  const update = (action: () => void) =>
    syncDebugAudioSettings(frontend, action);
  return (
    <section aria-label="Audio debug">
      <h2>Audio</h2>
      <h3>Runtime status</h3>
      <dl>
        <dt>Audio output</dt>
        <dd>{status}</dd>
        <dt>Speech level</dt>
        <dd>{speechLevel.toFixed(2)}</dd>
        <dt>Scene music</dt>
        <dd>{scene.bgm}</dd>
        <dt>Corrupt voice</dt>
        <dd>{scene.corruptVoice ? "active" : "inactive"}</dd>
      </dl>
      <button type="button" onClick={() => void unlock()}>
        Resume / unlock audio
      </button>

      <h3>Scene audio</h3>
      <label>
        <input
          type="checkbox"
          checked={scene.corruptVoice}
          onChange={(event) => setScene({ corruptVoice: event.target.checked })}
        />
        Corrupt voice
      </label>
      <label>
        Desktop music
        <select
          value={scene.bgm}
          onChange={(event) =>
            setScene({ bgm: event.target.value as NoriSceneState["bgm"] })
          }
        >
          <option value="auto">auto</option>
          <option value="silent">silent</option>
          <option value="bgm1">bgm1</option>
          <option value="bgm_manifold">bgm_manifold</option>
          <option value="bgm_void">bgm_void</option>
        </select>
      </label>

      <h3>Volume (settings → session mixer)</h3>
      <AudioSlider
        frontend={frontend}
        label="Master"
        setting="masterVolume"
        value={audio.masterVolume}
        update={audio.setMasterVolume}
      />
      <AudioSlider
        frontend={frontend}
        label="Music"
        setting="musicVolume"
        value={audio.musicVolume}
        update={audio.setMusicVolume}
      />
      <AudioSlider
        frontend={frontend}
        label="SFX"
        setting="sfxVolume"
        value={audio.sfxVolume}
        update={audio.setSfxVolume}
      />
      <AudioSlider
        frontend={frontend}
        label="Voice"
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
          {String(label)}
        </label>
      ))}
      <label>
        <input
          type="checkbox"
          checked={audio.spatialVoice}
          onChange={(event) =>
            update(() => audio.setSpatialVoice(event.target.checked))
          }
        />
        3D voice (HRTF)
      </label>
      <label>
        Voice speed
        <input
          aria-label="Voice speed"
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

      <h3>Sound effect</h3>
      <label>
        Cue
        <select value={cue} onChange={(event) => setCue(event.target.value)}>
          {cues.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
      </label>
      <button type="button" onClick={() => void playCue()}>
        Play cue
      </button>
      <p>
        Source AudioMixer does not expose the shipped manager's suspend, seek,
        loaded-track, panner, or effects internals.
      </p>
    </section>
  );
}
