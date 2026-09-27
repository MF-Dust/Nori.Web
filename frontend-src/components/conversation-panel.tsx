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
import type { ChipController } from "../runtime/chip-controller";
import {
  getNoriDockReservedHeight,
  NORI_DOCK_BOTTOM_OFFSET,
  NORI_SHELL_LAYERS,
  NORI_WINDOW_ANIMATION,
} from "../state/window-layout-runtime";
import { useGraphicsSettings } from "../state/graphics-store";
import { createSourceTranslate } from "../i18n/translate";
import { retainExiting } from "./chat-motion";
import {
  CHIP_READOUT_VISIBLE_MS,
  CONVERSATION_EXIT_MS,
  CONVERSATION_LAYOUT_EASE,
  CONVERSATION_LAYOUT_MS,
  conversationStackOffset,
  isChipReadoutVisible,
} from "./conversation-motion";
import { useListFlip } from "./list-flip";
import "./conversation-panel.css";

const NO_CHIP_READOUT = {
  readout: null as { text: string; receivedAt: number } | null,
};
const subscribeToNothing = () => () => {};
const readNoChip = () => NO_CHIP_READOUT;

function useChipReadoutVisible(chip?: ChipController): boolean {
  const { readout } = useSyncExternalStore(
    chip ? chip.subscribe : subscribeToNothing,
    chip ? chip.snapshot : readNoChip,
  );
  const [now, setNow] = useState(() => Date.now());
  const visible = isChipReadoutVisible(readout, now);
  useEffect(() => {
    const current = Date.now();
    const live = isChipReadoutVisible(readout, current);
    if (live !== visible) {
      setNow(current);
      return;
    }
    if (!readout || !live) return;
    const remaining = readout.receivedAt + CHIP_READOUT_VISIBLE_MS - current;
    const timer = setTimeout(() => setNow(Date.now()), Math.max(0, remaining));
    return () => clearTimeout(timer);
  }, [readout, visible, now]);
  return visible;
}

function BubbleStack({
  bubbles,
  epoch,
  corrupt,
  lifted,
  bottom,
}: {
  bubbles: ConversationBubble[];
  epoch: number;
  corrupt: boolean;
  lifted: boolean;
  bottom: number;
}) {
  const [display, setDisplay] = useState<
    Array<ConversationBubble & { exiting?: number }>
  >([]);
  const previousEpoch = useRef(epoch);
  const flipKey = display.map((bubble) => bubble.id).join("\0");
  const { setRoot, itemRef, rebase } = useListFlip(
    flipKey,
    CONVERSATION_LAYOUT_MS,
    CONVERSATION_LAYOUT_EASE,
    true,
    `${bottom}:${lifted ? 1 : 0}`,
  );
  useEffect(() => {
    const reset = previousEpoch.current !== epoch;
    previousEpoch.current = epoch;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    setDisplay((previous) => {
      if (reset || reduced) return bubbles;
      return retainExiting(previous, bubbles, Date.now(), CONVERSATION_EXIT_MS);
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
  // CSS ease-in is the shipped framer easeIn (cubic-bezier(0.42, 0, 1, 1)).
  const liftEase = lifted
    ? `cubic-bezier(${NORI_WINDOW_ANIMATION.GENIE_APPEAR_EASE.join(", ")})`
    : "ease-in";
  const liftDuration = `${
    lifted
      ? NORI_WINDOW_ANIMATION.GENIE_APPEAR_DURATION
      : NORI_WINDOW_ANIMATION.CLOSE_DURATION
  }s`;
  return (
    <div
      ref={setRoot}
      className="conversation-lines"
      role="log"
      aria-live="polite"
      aria-relevant="additions text"
      onTransitionEnd={(event) => {
        if (
          event.target === event.currentTarget &&
          event.propertyName === "margin-bottom"
        )
          rebase();
      }}
      style={{
        marginBottom: conversationStackOffset(lifted),
        ["--stack-lift-duration" as string]: liftDuration,
        ["--stack-lift-ease" as string]: liftEase,
      }}
    >
      {display.map((bubble) => (
        <div
          key={bubble.id}
          ref={itemRef(bubble.id)}
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
  chip,
  chipButton,
  chipReadout,
  chipNotice,
}: {
  frontend: NoriFrontendRuntime;
  locale: string;
  chip?: ChipController;
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
  const lifted = useChipReadoutVisible(chip);
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
      {chipReadout}
      <BubbleStack
        bubbles={bubbles}
        epoch={state.presentationEpoch}
        corrupt={scene.noriTexture === "corrupt"}
        lifted={lifted}
        bottom={bottom}
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
              maxLength={100}
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
            {chipNotice?.(
              Math.max(
                0,
                ...bubbles
                  .filter((bubble) => bubble.sender === "agent")
                  .map((bubble) => bubble.receivedAt),
              ),
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
