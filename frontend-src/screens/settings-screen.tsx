import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  Volume2,
  Music2,
  Sparkles,
  Mic,
  Monitor,
  Wifi,
  Settings,
  type LucideIcon,
} from "lucide-react";
import { useAudioSettings } from "../state/audio-store";
import { isGraphicsMode, useGraphicsSettings } from "../state/graphics-store";
import type { ArcadeClient } from "../runtime/arcade-client";
import type { SystemService } from "../services/system";
import type { createSourceTranslate } from "../i18n/translate";
import "./settings-screen.css";

type Translate = ReturnType<typeof createSourceTranslate>;
export interface SettingsRuntime {
  arcade: ArcadeClient;
  system: SystemService;
  translate: Translate;
  onReset(): Promise<void>;
  speechControl?: ReactNode;
}
const sections = ["sound", "graphics", "network", "system"] as const;
type Section = (typeof sections)[number];
const icons = {
  sound: Volume2,
  graphics: Monitor,
  network: Wifi,
  system: Settings,
};

function Toggle({
  checked,
  label,
  disabled,
  onChange,
}: {
  checked: boolean;
  label: string;
  disabled?: boolean;
  onChange(): void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={onChange}
      className="settings-switch"
    >
      <span />
    </button>
  );
}
function VolumeRow({
  icon: Icon,
  label,
  value,
  onChange,
  disabled,
  mute,
  t,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  onChange(value: number): void;
  disabled: boolean;
  mute?: { muted: boolean; toggle(): void };
  t: Translate;
}) {
  return (
    <div
      className={`flex items-center gap-4 py-2 ${disabled ? "opacity-50" : ""}`}
    >
      <Icon className="size-4 shrink-0 text-muted-foreground" />
      <label
        className={`flex min-w-0 flex-1 flex-col gap-2 ${mute?.muted ? "opacity-50" : ""}`}
      >
        <span className="flex items-center justify-between text-sm">
          <span>{label}</span>
          <span className="text-xs tabular-nums text-muted-foreground">
            {Math.round(value)}%
          </span>
        </span>
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={value}
          aria-label={label}
          disabled={disabled || mute?.muted}
          onChange={(event) => onChange(event.target.valueAsNumber)}
        />
      </label>
      {mute ? (
        <Toggle
          checked={!mute.muted}
          disabled={disabled}
          label={`${t(mute.muted ? "settings.sound.unmuteTrack" : "settings.sound.muteTrack")} ${label}`}
          onChange={mute.toggle}
        />
      ) : (
        <span className="w-8 shrink-0" />
      )}
    </div>
  );
}
function SoundSettings({
  t,
  speechControl,
}: {
  t: Translate;
  speechControl?: ReactNode;
}) {
  const audio = useAudioSettings();
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium">{t("settings.sound.title")}</h3>
          <p className="text-xs text-muted-foreground">
            {t("settings.sound.description")}
          </p>
        </div>
        <Toggle
          checked={!audio.isMuted}
          label={t("settings.sound.title")}
          onChange={audio.toggleMute}
        />
      </div>
      {speechControl}
      <hr />
      <div className="space-y-1">
        <VolumeRow
          icon={Volume2}
          label={t("settings.sound.masterVolume")}
          value={audio.masterVolume}
          onChange={audio.setMasterVolume}
          disabled={audio.isMuted}
          t={t}
        />
        <VolumeRow
          icon={Music2}
          label={t("settings.sound.music")}
          value={audio.musicVolume}
          onChange={audio.setMusicVolume}
          disabled={audio.isMuted}
          mute={{ muted: audio.musicMuted, toggle: audio.toggleMusicMuted }}
          t={t}
        />
        <VolumeRow
          icon={Sparkles}
          label={t("settings.sound.sfx")}
          value={audio.sfxVolume}
          onChange={audio.setSfxVolume}
          disabled={audio.isMuted}
          mute={{ muted: audio.sfxMuted, toggle: audio.toggleSfxMuted }}
          t={t}
        />
        <VolumeRow
          icon={Mic}
          label={t("settings.sound.voice")}
          value={audio.voiceVolume}
          onChange={audio.setVoiceVolume}
          disabled={audio.isMuted}
          mute={{ muted: audio.voiceMuted, toggle: audio.toggleVoiceMuted }}
          t={t}
        />
      </div>
    </div>
  );
}
function GraphicsSettings({ t }: { t: Translate }) {
  const graphics = useGraphicsSettings();
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium">{t("settings.graphics.title")}</h3>
      <select
        className="settings-select"
        aria-label={t("settings.graphics.title")}
        value={graphics.mode}
        onChange={(event) => {
          if (isGraphicsMode(event.target.value))
            graphics.setMode(event.target.value);
        }}
      >
        <option value="quality">{t("settings.graphics.quality")}</option>
        <option value="performance">
          {t("settings.graphics.performance")}
        </option>
        <option value="ultra-performance">
          {t("settings.graphics.ultraPerformance")}
        </option>
      </select>
    </div>
  );
}
function InfoRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm">{label}</span>
      <span className="flex items-center gap-2 text-xs tabular-nums text-muted-foreground">
        {children}
      </span>
    </div>
  );
}
function subscribeOnline(listener: () => void) {
  window.addEventListener("online", listener);
  window.addEventListener("offline", listener);
  return () => {
    window.removeEventListener("online", listener);
    window.removeEventListener("offline", listener);
  };
}
function NetworkSettings({ runtime }: { runtime: SettingsRuntime }) {
  const t = runtime.translate;
  const [connection, setConnection] = useState(runtime.arcade.connectionState);
  const [samples, setSamples] = useState<number[]>([]);
  const [phase, setPhase] = useState<"idle" | "running" | "done" | "failed">(
    "idle",
  );
  const alive = useRef(false);
  const online = useSyncExternalStore(subscribeOnline, () => navigator.onLine);
  useEffect(() => {
    alive.current = true;
    const unsubscribe = runtime.arcade.onState(setConnection);
    return () => {
      alive.current = false;
      unsubscribe();
    };
  }, [runtime]);
  const state = !online
    ? "offline"
    : connection === "open"
      ? "connected"
      : "reconnecting";
  const median =
    samples.length && state === "connected"
      ? [...samples].sort((a, b) => a - b)[Math.floor(samples.length / 2)]
      : null;
  async function check() {
    setPhase("running");
    try {
      const values = await runtime.system.measureLatency();
      if (alive.current) {
        setSamples(values);
        setPhase("done");
      }
    } catch {
      if (alive.current) setPhase("failed");
    }
  }
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <h3 className="text-sm font-medium">{t("settings.network.title")}</h3>
        <InfoRow label={t("settings.network.status")}>
          <span
            className={`size-2 rounded-full ${state === "connected" ? "bg-emerald-500" : state === "offline" ? "bg-destructive" : "bg-amber-500"}`}
          />
          {t(`settings.network.state.${state}`)}
        </InfoRow>
        <InfoRow label={t("settings.network.latency")}>
          {median === null
            ? "—"
            : t("settings.network.latencyValue", {
                ms: Math.round(median),
                quality: t(
                  `settings.network.quality.${median < 100 ? "good" : median < 250 ? "ok" : "slow"}`,
                ),
              })}
        </InfoRow>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="settings-action"
          disabled={phase === "running" || state !== "connected"}
          onClick={() => void check()}
        >
          {t(
            `settings.network.test.${phase === "running" ? "running" : "button"}`,
          )}
        </button>
        <span role="status" className="text-xs text-muted-foreground">
          {phase === "done"
            ? t("settings.network.test.result", {
                avg: Math.round(
                  samples.reduce((a, b) => a + b, 0) / samples.length,
                ),
              })
            : phase === "failed"
              ? t("settings.network.test.failed")
              : ""}
        </span>
      </div>
    </div>
  );
}
function ResetDialog({
  runtime,
  onClose,
}: {
  runtime: SettingsRuntime;
  onClose(): void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [phase, setPhase] = useState("idle");
  const working = phase === "working",
    t = runtime.translate;
  useEffect(() => {
    dialog.current?.showModal();
  }, []);
  async function reset() {
    if (working) return;
    setPhase("working");
    try {
      await runtime.onReset();
    } catch {
      setPhase("error");
    }
  }
  return (
    <dialog
      ref={dialog}
      className="settings-reset-dialog"
      aria-label={t("settings.system.dialog.title")}
      aria-busy={working}
      onCancel={(event) => {
        event.preventDefault();
        if (!working) onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget && !working) onClose();
      }}
    >
      <div onClick={(event) => event.stopPropagation()}>
        <h2 className="text-sm font-semibold">
          {t("settings.system.dialog.title")}
        </h2>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          {t("settings.system.dialog.body")}
        </p>
        {phase === "error" && (
          <p role="alert" className="mt-2 text-xs text-destructive">
            {t("settings.system.dialog.error")}
          </p>
        )}
        <div className="mt-4 flex justify-end gap-2">
          <button
            autoFocus
            type="button"
            className="settings-action"
            disabled={working}
            onClick={onClose}
          >
            {t("settings.system.dialog.cancel")}
          </button>
          <button
            type="button"
            className="settings-action settings-destructive"
            disabled={working}
            onClick={() => void reset()}
          >
            {t(`settings.system.dialog.${working ? "working" : "confirm"}`)}
          </button>
        </div>
      </div>
    </dialog>
  );
}

export function SettingsScreen({ runtime }: { runtime: SettingsRuntime }) {
  const t = runtime.translate;
  const [selected, setSelected] = useState<Section>("sound");
  const [reset, setReset] = useState(false);
  const scroll = useRef<HTMLDivElement>(null);
  const navigatingUntil = useRef(0);
  const refs = useRef<Partial<Record<Section, HTMLElement | null>>>({});
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (performance.now() < navigatingUntil.current) return;
        const entry = entries.find((item) => item.isIntersecting);
        if (entry)
          setSelected(entry.target.getAttribute("data-section") as Section);
      },
      { root: scroll.current, rootMargin: "-20% 0px -60% 0px" },
    );
    for (const section of Object.values(refs.current))
      if (section) observer.observe(section);
    return () => observer.disconnect();
  }, []);
  function navigate(section: Section) {
    setSelected(section);
    navigatingUntil.current = performance.now() + 500;
    // Scroll only this window's container; scrollIntoView also moves the desktop viewport.
    const element = refs.current[section],
      container = scroll.current;
    if (element && container)
      container.scrollTo({
        top:
          element.getBoundingClientRect().top -
          container.getBoundingClientRect().top +
          container.scrollTop -
          20,
        behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "instant"
          : "smooth",
      });
  }
  return (
    <div className="settings-root relative flex h-full">
      <nav
        className="flex w-44 shrink-0 flex-col gap-0.5 border-r bg-muted/30 p-2"
        aria-label={t("apps.settings")}
      >
        {sections.map((section) => {
          const Icon = icons[section];
          return (
            <button
              type="button"
              key={section}
              aria-current={selected === section ? "location" : undefined}
              onClick={() => navigate(section)}
              className={`flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition-colors ${selected === section ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
            >
              <Icon className="size-4" />
              {t(`settings.sections.${section}`)}
            </button>
          );
        })}
      </nav>
      <div ref={scroll} className="min-w-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-md space-y-8 p-5">
          {sections.map((section, index) => (
            <div key={section}>
              {index > 0 && <hr className="mb-8" />}
              <section
                data-section={section}
                ref={(node) => {
                  refs.current[section] = node;
                }}
                className={section === "system" ? "pb-8" : ""}
              >
                {section === "sound" ? (
                  <SoundSettings t={t} speechControl={runtime.speechControl} />
                ) : section === "graphics" ? (
                  <GraphicsSettings t={t} />
                ) : section === "network" ? (
                  <NetworkSettings runtime={runtime} />
                ) : (
                  <div className="space-y-3">
                    <div>
                      <h3 className="text-sm font-medium">
                        {t("settings.system.title")}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {t("settings.system.description")}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="settings-action settings-destructive"
                      onClick={() => setReset(true)}
                    >
                      {t("settings.system.button")}
                    </button>
                  </div>
                )}
              </section>
            </div>
          ))}
        </div>
      </div>
      {reset && (
        <ResetDialog runtime={runtime} onClose={() => setReset(false)} />
      )}
    </div>
  );
}
