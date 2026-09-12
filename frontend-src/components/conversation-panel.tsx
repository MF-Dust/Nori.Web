import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type FormEvent,
} from "react";
import { SendHorizontal } from "lucide-react";
import type { NoriFrontendRuntime } from "../runtime/frontend-runtime";
import { sanitizeChatText } from "../runtime/chat-media";
import {
  ConversationTimeline,
  CONVERSATION_BUBBLE_LIFETIME_MS,
  type ConversationBubble,
} from "../apps/conversation-presentation";
import {
  getNoriDockReservedHeight,
  NORI_DOCK_BOTTOM_OFFSET,
  NORI_SHELL_LAYERS,
} from "../state/window-layout-runtime";
import { useGraphicsSettings } from "../state/graphics-store";
import { createSourceTranslate } from "../i18n/translate";
import "./conversation-panel.css";

function BubbleStack({
  bubbles,
  epoch,
}: {
  bubbles: ConversationBubble[];
  epoch: number;
}) {
  const [display, setDisplay] = useState<
    Array<ConversationBubble & { exiting?: number }>
  >([]);
  const previousEpoch = useRef(epoch);
  useEffect(() => {
    const reset = previousEpoch.current !== epoch;
    previousEpoch.current = epoch;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    setDisplay((previous) => {
      if (reset || reduced) return bubbles;
      const byId = new Map(bubbles.map((bubble) => [bubble.id, bubble]));
      const next = previous.map(
        (bubble) =>
          byId.get(bubble.id) ?? {
            ...bubble,
            exiting: bubble.exiting ?? Date.now() + 350,
          },
      );
      for (const bubble of bubbles)
        if (!previous.some((old) => old.id === bubble.id)) next.push(bubble);
      return next;
    });
  }, [bubbles, epoch]);
  useEffect(() => {
    const deadlines = display.flatMap((bubble) =>
      bubble.exiting ? [bubble.exiting] : [],
    );
    if (!deadlines.length) return;
    const timer = setTimeout(
      () => {
        const now = Date.now();
        setDisplay((previous) =>
          previous.filter((bubble) => !bubble.exiting || bubble.exiting > now),
        );
      },
      Math.max(1, Math.min(...deadlines) - Date.now()),
    );
    return () => clearTimeout(timer);
  }, [display]);
  return (
    <div
      className="conversation-lines"
      role="log"
      aria-live="polite"
      aria-relevant="additions text"
    >
      {display.map((bubble) => (
        <div
          key={bubble.id}
          className="conversation-bubble"
          data-sender={bubble.sender}
          data-exiting={bubble.exiting || undefined}
          aria-hidden={!!bubble.exiting || undefined}
        >
          <span>{bubble.content}</span>
        </div>
      ))}
    </div>
  );
}

function dockCenter() {
  return (
    NORI_DOCK_BOTTOM_OFFSET +
    getNoriDockReservedHeight({ width: innerWidth, height: innerHeight }) / 2
  );
}

/** Floating NormalApp conversation presentation; speech transport is owned by the runtime. */
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
  const [focused, setFocused] = useState(false);
  const [bottom, setBottom] = useState(dockCenter);
  const [bubbles, setBubbles] = useState<ConversationBubble[]>([]);
  const timeline = useRef(new ConversationTimeline());
  const input = useRef<HTMLInputElement>(null);
  const composing = useRef(false);
  const sending = useRef(false);
  const t = useMemo(() => createSourceTranslate(locale), [locale]);
  const lowEffects = useGraphicsSettings(
    (settings) => settings.mode !== "quality",
  );
  const zh = locale.startsWith("zh");
  const mac = /Mac|iPhone|iPad/.test(navigator.platform);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const refresh = () => {
      const now = Date.now(),
        visible = timeline.current.visible(now);
      setBubbles(visible);
      if (visible.length)
        timer = setTimeout(
          refresh,
          Math.max(
            1,
            Math.min(
              ...visible.map(
                (bubble) => bubble.receivedAt + CONVERSATION_BUBBLE_LIFETIME_MS,
              ),
            ) -
              now +
              50,
          ),
        );
    };
    timeline.current.update(state.presentationEpoch, state.lines, Date.now());
    refresh();
    return () => clearTimeout(timer);
  }, [state.lines, state.presentationEpoch]);
  useEffect(() => {
    const resize = () => setBottom(dockCenter());
    const keydown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        event.stopPropagation();
        input.current?.focus();
      }
    };
    window.addEventListener("resize", resize);
    window.addEventListener("keydown", keydown, true);
    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("keydown", keydown, true);
    };
  }, []);
  async function send(event: FormEvent) {
    event.preventDefault();
    if (composing.current || sending.current || !sanitizeChatText(text)) return;
    sending.current = true;
    input.current?.blur();
    try {
      if (await frontend.conversation.send(sanitizeChatText(text)))
        setText((current) => (current === text ? "" : current));
    } finally {
      sending.current = false;
    }
  }
  return (
    <section
      className="conversation-panel"
      aria-label={zh ? "对话" : "Conversation"}
      data-low-effects={lowEffects || undefined}
      style={{ bottom, zIndex: NORI_SHELL_LAYERS.DOCK_TOOLTIP }}
    >
      <BubbleStack bubbles={bubbles} epoch={state.presentationEpoch} />
      <span className="sr-only" role="status">
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
      {state.error && (
        <p className="conversation-error" role="alert">
          {state.error}
        </p>
      )}
      <form onSubmit={(event) => void send(event)}>
        <div
          className="conversation-composer"
          data-focused={focused || undefined}
        >
          <input
            ref={input}
            type="text"
            aria-label={zh ? "消息" : "Message"}
            aria-keyshortcuts="Control+K Meta+K"
            value={text}
            onChange={(event) =>
              setText(Array.from(event.target.value).slice(0, 100).join(""))
            }
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onCompositionStart={() => {
              composing.current = true;
            }}
            onCompositionEnd={() => {
              composing.current = false;
            }}
            onKeyDown={(event) => {
              if (event.key === "Escape") input.current?.blur();
              if (
                event.key === "Enter" &&
                (composing.current ||
                  event.nativeEvent.isComposing ||
                  event.keyCode === 229)
              )
                event.preventDefault();
            }}
            disabled={!state.connected}
          />
          {!text && (
            <span className="conversation-placeholder" aria-hidden="true">
              {t("chat.placeholder")}
              {!focused && (
                <span className="conversation-shortcut">
                  <kbd>{mac ? "⌘" : "Ctrl"}</kbd>+<kbd>K</kbd>
                </span>
              )}
            </span>
          )}
          <button
            className="conversation-send"
            type="submit"
            aria-label={zh ? "发送" : "Send"}
            disabled={
              !state.connected || state.pending || !sanitizeChatText(text)
            }
            data-filled={!!sanitizeChatText(text) || undefined}
          >
            <SendHorizontal size={16} strokeWidth={2.5} />
          </button>
        </div>
      </form>
    </section>
  );
}
