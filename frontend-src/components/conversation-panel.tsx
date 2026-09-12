import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type FormEvent,
} from "react";
import type { NoriFrontendRuntime } from "../runtime/frontend-runtime";
import { sanitizeChatText } from "../runtime/chat-media";
import "./conversation-panel.css";

export function ConversationPanel({
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
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [changingMode, setChangingMode] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const scroll = useRef<HTMLDivElement>(null);
  const zh = locale.startsWith("zh");
  useEffect(() => {
    if (scroll.current) scroll.current.scrollTop = scroll.current.scrollHeight;
  }, [state.lines]);
  async function send(event: FormEvent) {
    event.preventDefault();
    const submitted = sanitizeChatText(text);
    if (await frontend.conversation.send(submitted))
      setText((current) => (current === text ? "" : current));
  }
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
    <section
      className="conversation-panel"
      aria-label={zh ? "对话" : "Conversation"}
    >
      <header>
        <button
          type="button"
          aria-expanded={expanded}
          onClick={() => setExpanded(!expanded)}
        >
          Nori <span aria-hidden>{expanded ? "▾" : "▴"}</span>
        </button>
        <span role="status">
          {!state.connected
            ? zh
              ? "连接中"
              : "Connecting"
            : state.phase !== "idle"
              ? zh
                ? "回复中"
                : "Replying"
              : ""}
        </span>
        <button
          type="button"
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
      </header>
      {expanded && (
        <>
          <div
            className="conversation-lines"
            ref={scroll}
            role="log"
            aria-live="polite"
            aria-relevant="additions text"
          >
            {state.lines.map((line) => (
              <p key={line.messageId} data-sender={line.sender}>
                <strong>
                  {line.sender === "player" ? (zh ? "我" : "You") : "Nori"}
                </strong>
                {line.content}
              </p>
            ))}
          </div>
          {(error || state.error) && <p role="alert">{error || state.error}</p>}
          <form onSubmit={(event) => void send(event)}>
            <input
              aria-label={zh ? "消息" : "Message"}
              placeholder={zh ? "输入消息…" : "Type a message…"}
              value={text}
              onChange={(event) =>
                setText(Array.from(event.target.value).slice(0, 100).join(""))
              }
              disabled={!state.connected}
            />
            <button
              type="submit"
              disabled={
                !state.connected || state.pending || !sanitizeChatText(text)
              }
            >
              {zh ? "发送" : "Send"}
            </button>
          </form>
        </>
      )}
    </section>
  );
}
