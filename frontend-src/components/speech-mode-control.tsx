import { useState, useSyncExternalStore } from "react";
import type { NoriFrontendRuntime } from "../runtime/frontend-runtime";

/** Gesture-gated speech belongs in Sound settings, outside the floating composer. */
export function SpeechModeControl({
  frontend,
  locale,
}: {
  frontend: NoriFrontendRuntime;
  locale: string;
}) {
  const state = useSyncExternalStore(
    frontend.conversation.subscribe,
    frontend.conversation.snapshot,
  );
  const [error, setError] = useState<string | null>(null);
  const [changingMode, setChangingMode] = useState(false);
  const zh = locale.startsWith("zh");
  async function toggleSpeech() {
    setChangingMode(true);
    setError(null);
    try {
      if (!(await frontend.enableSpeech(state.mode !== "audio")))
        setError(
          frontend.speechError ??
            (zh ? "无法切换语音模式" : "Unable to change speech mode"),
        );
    } finally {
      setChangingMode(false);
    }
  }
  return (
    <div className="space-y-2">
      <button
        type="button"
        className="settings-action"
        disabled={!state.connected || changingMode}
        aria-pressed={state.mode === "audio"}
        onClick={() => void toggleSpeech()}
      >
        {state.mode === "audio"
          ? zh
            ? "语音已开启"
            : "Speech on"
          : zh
            ? "开启语音"
            : "Enable speech"}
      </button>
      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
