import { CorruptedChatText } from "./corrupted-chat-text";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type FormEvent,
  type ReactNode,
} from "react";
import { ArrowUp } from "lucide-react";
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
  corrupt,
}: {
  bubbles: ConversationBubble[];
  epoch: number;
  corrupt: boolean;
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
          data-corrupt={(corrupt && bubble.sender === "agent") || undefined}
          data-exiting={bubble.exiting || undefined}
          aria-hidden={!!bubble.exiting || undefined}
        >
          <span>
            {corrupt && bubble.sender === "agent" ? (
              <CorruptedChatText text={bubble.content} />
            ) : (
              bubble.content
            )}
          </span>
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
  chipButton,
  chipReadout,
  chipNotice,
}: {
  frontend: NoriFrontendRuntime;
  locale: string;
  chipButton?: ReactNode;
  chipReadout?: ReactNode;
  chipNotice?: (lastNoriAt: number) => ReactNode;
}) {
  const state = useSyncExternalStore(
    frontend.conversation.subscribe,
    frontend.conversation.snapshot,
  );
  const scene = useSyncExternalStore(
    frontend.scene.subscribe,
    frontend.scene.snapshot,
  );
  const hidden =
    scene.chatMode === "hidden" ||
    (scene.chatMode === "normal" && scene.active);
  const bubblesOnly = scene.chatMode === "bubbles";
  const inputBlocked = hidden || bubblesOnly;
  const received = useRef<{ epoch: number; ids: Set<string> } | null>(null);
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
    const next = timeline.current.update(
      state.presentationEpoch,
      state.lines,
      Date.now(),
    );
    const prior = received.current;
    const ids = new Set(
      next
        .filter((bubble) => bubble.sender === "agent")
        .map((bubble) => bubble.id),
    );
    if (
      prior &&
      prior.epoch === state.presentationEpoch &&
      [...ids].some((id) => !prior.ids.has(id)) &&
      !hidden &&
      !bubblesOnly &&
      scene.noriTexture !== "corrupt"
    )
      frontend.audio.playCue("comms-norichat-receive");
    received.current = { epoch: state.presentationEpoch, ids };
    refresh();
    return () => clearTimeout(timer);
  }, [
    state.lines,
    state.presentationEpoch,
    hidden,
    bubblesOnly,
    scene.noriTexture,
    frontend,
  ]);
  useEffect(() => {
    if (inputBlocked) {
      input.current?.blur();
      setFocused(false);
    }
  }, [inputBlocked]);
  useEffect(() => {
    const resize = () => setBottom(dockCenter());
    const keydown = (event: KeyboardEvent) => {
      if (
        !inputBlocked &&
        (event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === "k"
      ) {
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
  }, [inputBlocked]);
  async function send(event: FormEvent) {
    event.preventDefault();
    if (
      inputBlocked ||
      composing.current ||
      sending.current ||
      !sanitizeChatText(text)
    )
      return;
    sending.current = true;
    input.current?.blur();
    try {
      if (await frontend.conversation.send(sanitizeChatText(text))) {
        frontend.audio.playCue("comms-norichat-send");
        setText((current) => (current === text ? "" : current));
      }
    } finally {
      sending.current = false;
    }
  }
  return (
    <section
      className="conversation-panel"
      aria-label={zh ? "对话" : "Conversation"}
      aria-hidden={hidden || undefined}
      inert={hidden || undefined}
      data-scene-hidden={hidden || undefined}
      data-bubbles-only={bubblesOnly || undefined}
      data-low-effects={lowEffects || undefined}
      style={{ bottom, zIndex: NORI_SHELL_LAYERS.DOCK_TOOLTIP }}
    >
      {!inputBlocked &&
        chipNotice?.(
          Math.max(
            0,
            ...bubbles
              .filter((bubble) => bubble.sender === "agent")
              .map((bubble) => bubble.receivedAt),
          ),
        )}
      {chipReadout}
      <BubbleStack
        bubbles={bubbles}
        epoch={state.presentationEpoch}
        corrupt={scene.noriTexture === "corrupt"}
      />
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
      {!bubblesOnly && (
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
              onFocus={() => {
                setFocused(true);
                frontend.audio.playCue("comms-norichat-focus");
              }}
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
              disabled={!state.connected || inputBlocked}
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
            {chipButton}
            <button
              className="conversation-send"
              type="submit"
              aria-label={zh ? "发送" : "Send"}
              disabled={
                inputBlocked ||
                !state.connected ||
                state.pending ||
                !sanitizeChatText(text)
              }
              data-filled={!!sanitizeChatText(text) || undefined}
            >
              <ArrowUp size={16} strokeWidth={2.5} />
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
