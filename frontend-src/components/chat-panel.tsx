import {
  forwardRef,
  isValidElement,
  memo,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
  type Ref,
} from "react";
import { CircleAlert, Send, TriangleAlert, Zap } from "lucide-react";
import { shouldSubmitMessageKey } from "../apps/messenger-interactions";
import { CHAT_EXIT_MS, CHAT_LAYOUT_EASE, CHAT_LAYOUT_MS, retainExiting } from "./chat-motion";
import { useListFlip } from "./list-flip";

export type ChatCardColor = "agent" | "bystander" | "assassin";

export interface ChatWordBadgeContent {
  type: "wordBadge";
  word: string;
  cardColor: ChatCardColor;
}

export interface ChatTextWithBadgeContent {
  type: "textWithBadge";
  text: string;
  badge: ChatWordBadgeContent;
}

export type ChatMessageContent = ReactNode | ChatWordBadgeContent | ChatTextWithBadgeContent;

export interface ChatPanelMessage {
  id: string;
  sender: "system" | "player" | string;
  tone?: "success" | "warning" | "danger" | string;
  content: ChatMessageContent;
}

export interface ChatPanelProps {
  messages: readonly ChatPanelMessage[];
  isPlayerGuesser: boolean;
  active: boolean;
  onSubmitGuess: (guess: string) => boolean | void;
  placeholder?: string;
  disabledPlaceholder?: string;
  emptyMessage?: string;
  renderBeforeSubmit?: () => ReactNode;
  viewportRef?: Ref<HTMLDivElement>;
  playSound?: (
    cue:
      | "primitives-input-submit"
      | "primitives-error-shake"
      | "primitives-input-typing"
      | "primitives-input-focus",
  ) => void;
}

function classes(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}

function ChatWordBadge({ word, cardColor }: ChatWordBadgeContent) {
  return (
    <span
      className={classes(
        "inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium uppercase tracking-wide",
        cardColor === "agent" &&
          "bg-[var(--codenames-agent-bg)] border-[var(--codenames-agent-border)] text-[var(--codenames-agent-text)] dark:text-[var(--codenames-agent-text-dark)]",
        cardColor === "bystander" &&
          "bg-[var(--codenames-bystander-bg)] border-[var(--codenames-bystander-border)] text-[var(--codenames-bystander-text)]",
        cardColor === "assassin" &&
          "bg-[var(--codenames-assassin-bg)] border-[var(--codenames-assassin-border)] text-[var(--codenames-assassin-text)]",
      )}
    >
      {word}
    </span>
  );
}

/**
 * Shipped ChatPanel content normalization.
 *
 * The historical chunk keeps strings and React elements intact, renders the two
 * Codenames badge payloads specially, and stringifies every other value. Keeping
 * that fallback matters for cartridge data that is not already a React node: an
 * unexpected object must render as text instead of being handed to React as an
 * invalid child.
 */
function renderChatContent(content: ChatMessageContent): ReactNode {
  if (content == null) return null;
  if (typeof content === "string" || isValidElement(content)) return content;

  if (typeof content === "object" && "type" in content) {
    const typed = content as ChatWordBadgeContent | ChatTextWithBadgeContent;
    if (typed.type === "wordBadge") return <ChatWordBadge {...typed} />;
    if (typed.type === "textWithBadge") {
      return (
        <>
          {typed.text} <ChatWordBadge {...typed.badge} />
        </>
      );
    }
  }

  return String(content);
}

const ChatMessage = memo(function ChatMessage({
  message,
  exiting,
  appear,
  rowRef,
}: {
  message: ChatPanelMessage;
  exiting?: number;
  appear: boolean;
  rowRef: (element: HTMLDivElement | null) => void;
}) {
  const [entered, setEntered] = useState(!appear);
  const success = message.tone === "success";
  const content = renderChatContent(message.content);
  useLayoutEffect(() => {
    if (!appear || entered) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setEntered(true);
      return;
    }
    // The from-pose has to paint once before the transition is armed, otherwise
    // the browser skips straight to the resting styles. One frame is still
    // before that paint, so the second frame performs the change.
    let inner = 0;
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => setEntered(true));
    });
    return () => {
      cancelAnimationFrame(outer);
      cancelAnimationFrame(inner);
    };
  }, [appear, entered]);
  const kind = message.sender === "system" ? "status" : "message";
  const justify =
    message.sender === "system"
      ? "justify-center"
      : message.sender === "player"
        ? "justify-end"
        : "justify-start";

  let body: ReactNode;
  if (message.sender === "system") {
    const warning = message.tone === "warning";
    const danger = message.tone === "danger";
    body = (
      <div
        className={classes(
          "px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5",
          danger && "bg-destructive/10 text-destructive",
          warning && "bg-amber-500/10 text-amber-600 dark:text-amber-400",
          !danger && !warning && "bg-muted text-muted-foreground",
        )}
      >
        {danger ? <CircleAlert className="size-3" /> : null}
        {warning ? <TriangleAlert className="size-3" /> : null}
        {content}
      </div>
    );
  } else if (message.sender === "player") {
    body = (
      <div className="ml-8 max-w-[85%]">
        <div
          className={classes(
            "rounded-2xl rounded-br-sm px-3.5 py-2 shadow-sm",
            success ? "bg-emerald-500 text-white" : "bg-primary text-primary-foreground",
          )}
        >
          <p className="text-sm whitespace-pre-wrap break-words">{content}</p>
        </div>
      </div>
    );
  } else {
    body = (
      <div className="mr-8 max-w-[85%]">
        <div
          className={classes(
            "rounded-2xl rounded-bl-sm px-3.5 py-2 shadow-sm",
            success &&
              "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20",
            !success && "bg-muted text-foreground",
          )}
        >
          <p className="text-sm whitespace-pre-wrap break-words">{content}</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={rowRef} className="chat-row-flip" data-exiting={exiting || undefined}>
      <div
        className={classes("chat-message-motion flex w-full mb-2", justify)}
        data-kind={kind}
        data-phase={!entered && !exiting ? "from" : undefined}
        data-exiting={exiting || undefined}
        aria-hidden={exiting ? true : undefined}
      >
        {body}
      </div>
    </div>
  );
});

interface FadingScrollAreaProps {
  children: ReactNode;
  gradientDeps?: readonly unknown[];
  gradientHeight?: number;
  gradientColor?: string;
  gradientFullWidth?: boolean;
  className?: string;
}

const FadingScrollArea = forwardRef<HTMLDivElement, FadingScrollAreaProps>(function FadingScrollArea(
  {
    children,
    gradientDeps = [],
    gradientHeight = 64,
    gradientColor = "var(--sidebar)",
    gradientFullWidth = false,
    className,
  },
  forwardedRef,
) {
  const viewport = useRef<HTMLDivElement | null>(null);
  const [topOpacity, setTopOpacity] = useState(0);
  const [bottomOpacity, setBottomOpacity] = useState(0);

  useImperativeHandle(forwardedRef, () => viewport.current as HTMLDivElement, []);

  useEffect(() => {
    const element = viewport.current;
    if (!element) return;

    const update = () => {
      const { scrollTop, scrollHeight, clientHeight } = element;
      const maxScroll = scrollHeight - clientHeight;
      setTopOpacity(Math.min(scrollTop / gradientHeight, 1));
      setBottomOpacity(Math.min((maxScroll - scrollTop) / gradientHeight, 1));
    };

    update();
    element.addEventListener("scroll", update);
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => {
      element.removeEventListener("scroll", update);
      observer.disconnect();
    };
  }, [gradientHeight, ...gradientDeps]);

  return (
    <div className={classes("relative", className)}>
      <div
        ref={viewport}
        className="h-full w-full overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </div>
      <div
        className={classes(
          "absolute top-0 left-0 right-0 pointer-events-none transition-opacity duration-150",
          !gradientFullWidth && "mx-2.5",
        )}
        style={{
          height: `${gradientHeight}px`,
          background: `linear-gradient(to bottom, ${gradientColor}, transparent)`,
          opacity: topOpacity,
        }}
      />
      <div
        className={classes(
          "absolute bottom-0 left-0 right-0 pointer-events-none transition-opacity duration-150",
          !gradientFullWidth && "mx-2.5",
        )}
        style={{
          height: `${gradientHeight}px`,
          background: `linear-gradient(to top, ${gradientColor}, transparent)`,
          opacity: bottomOpacity,
        }}
      />
    </div>
  );
});

interface ChatMessageListProps {
  messages: readonly ChatPanelMessage[];
  emptyMessage: string;
  viewportRef?: Ref<HTMLDivElement>;
}

function assignDomRef(ref: Ref<HTMLDivElement> | undefined, element: HTMLDivElement | null) {
  if (typeof ref === "function") ref(element);
  else if (ref) ref.current = element;
}

function ChatMessageList({
  messages,
  emptyMessage,
  viewportRef: externalViewportRef,
}: ChatMessageListProps) {
  const end = useRef<HTMLDivElement | null>(null);
  const quietIds = useRef<Set<string> | null>(null);
  if (quietIds.current === null) {
    quietIds.current = new Set(messages.map((message) => message.id));
  }
  const quiet = quietIds.current;
  const [display, setDisplay] = useState<Array<ChatPanelMessage & { exiting?: number }>>(() => [
    ...messages,
  ]);
  const flipKey = display.map((message) => message.id).join("\0");
  const { setRoot, itemRef } = useListFlip(flipKey, CHAT_LAYOUT_MS, CHAT_LAYOUT_EASE);
  const viewportRef = useCallback(
    (element: HTMLDivElement | null) => {
      setRoot(element);
      assignDomRef(externalViewportRef, element);
    },
    [setRoot, externalViewportRef],
  );

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setDisplay((previous) =>
      reduced ? [...messages] : retainExiting(previous, messages, Date.now(), CHAT_EXIT_MS),
    );
  }, [messages]);

  useEffect(() => {
    const deadlines = display.flatMap((message) => (message.exiting ? [message.exiting] : []));
    if (!deadlines.length) return;
    const timer = window.setTimeout(() => {
      const now = Date.now();
      setDisplay((previous) =>
        previous.filter((message) => !message.exiting || message.exiting > now),
      );
    }, Math.max(1, Math.min(...deadlines) - Date.now()));
    return () => window.clearTimeout(timer);
  }, [display]);

  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <FadingScrollArea
      className="flex-1 min-h-0"
      gradientDeps={[messages]}
      gradientColor="var(--card)"
      gradientFullWidth
    >
      <div ref={viewportRef} className="px-3 pt-3 pb-3" style={{ position: "relative" }}>
        {display.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="p-3 rounded-full bg-muted/50 mb-3">
              <Zap className="size-5 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">{emptyMessage}</p>
          </div>
        ) : (
          display.map((message) => (
            <ChatMessage
              key={message.id}
              message={message}
              exiting={message.exiting}
              appear={!quiet.has(message.id)}
              rowRef={itemRef(message.id)}
            />
          ))
        )}
        <div ref={end} />
      </div>
    </FadingScrollArea>
  );
}

interface ChatComposerProps {
  isPlayerGuesser: boolean;
  active: boolean;
  onSubmitGuess: (guess: string) => boolean | void;
  placeholder: string;
  disabledPlaceholder: string;
  renderBeforeSubmit?: () => ReactNode;
  playSound?: ChatPanelProps["playSound"];
}

function ChatComposer({
  isPlayerGuesser,
  active,
  onSubmitGuess,
  placeholder,
  disabledPlaceholder,
  renderBeforeSubmit,
  playSound,
}: ChatComposerProps) {
  const [value, setValue] = useState("");
  const [invalid, setInvalid] = useState(false);
  const [shake, setShake] = useState(false);
  const textarea = useRef<HTMLTextAreaElement | null>(null);
  const wasEnabled = useRef(false);
  const composing = useRef(false);
  const focusTimer = useRef<number | undefined>(undefined);
  const shakeTimer = useRef<number | undefined>(undefined);
  const lastTypingSound = useRef(0);
  const enabled = isPlayerGuesser && active;

  useEffect(() => {
    if (enabled && !wasEnabled.current) {
      focusTimer.current = window.setTimeout(() => textarea.current?.focus(), 100);
    }
    wasEnabled.current = enabled;
    return () => {
      if (focusTimer.current !== undefined) window.clearTimeout(focusTimer.current);
      if (shakeTimer.current !== undefined) window.clearTimeout(shakeTimer.current);
    };
  }, [enabled]);

  /** Replay the shake keyframes. Dropping the class and restoring it in a later
   * task is what restarts a CSS animation; React has flushed the removal by
   * then, so repeated rejections shake again instead of going inert. */
  const replayShake = useCallback(() => {
    setShake(false);
    if (shakeTimer.current !== undefined) window.clearTimeout(shakeTimer.current);
    shakeTimer.current = window.setTimeout(() => setShake(true), 0);
  }, []);

  const submit = useCallback(() => {
    const guess = value.trim();
    if (!guess || !active) return;

    if (onSubmitGuess(guess) !== false) {
      playSound?.("primitives-input-submit");
      setValue("");
      setInvalid(false);
      return;
    }

    playSound?.("primitives-error-shake");
    setInvalid(true);
    replayShake();
    textarea.current?.focus();
  }, [active, onSubmitGuess, playSound, replayShake, value]);

  const onKeyDown = useCallback(
    (event: KeyboardEvent<HTMLTextAreaElement>) => {
      if (shouldSubmitMessageKey(event, composing.current, true)) {
        event.preventDefault();
        submit();
      }
    },
    [submit],
  );

  return (
    <div className="shrink-0 bg-card p-3 pt-2 rounded-b-xl">
      <div
        className={classes(
          "group/input-group border-input dark:bg-input/30 relative flex w-full items-center rounded-md border shadow-xs transition-[color,box-shadow] outline-none",
          "h-auto min-w-0 flex-col",
          invalid && "border-destructive ring-destructive/20 ring-[3px]",
          shake && "chat-composer-shake",
        )}
      >
        <textarea
          ref={textarea}
          value={value}
          onChange={(event) => {
            const now = Date.now();
            if (now - lastTypingSound.current >= 70) {
              lastTypingSound.current = now;
              playSound?.("primitives-input-typing");
            }
            setValue(event.currentTarget.value);
            if (invalid) setInvalid(false);
          }}
          onFocus={() => playSound?.("primitives-input-focus")}
          onCompositionStart={() => {
            composing.current = true;
          }}
          onCompositionEnd={() => {
            composing.current = false;
          }}
          onKeyDown={onKeyDown}
          placeholder={enabled ? placeholder : disabledPlaceholder}
          disabled={!enabled}
          aria-invalid={invalid || undefined}
          className="border-0 bg-transparent flex field-sizing-content min-h-[2.5rem] max-h-24 w-full resize-none px-3 py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
          rows={1}
        />
        <div className="order-last flex w-full items-center justify-end gap-1 px-3 pb-3">
          {renderBeforeSubmit?.()}
          <button
            type="button"
            onClick={submit}
            disabled={!value.trim() || !enabled}
            className="inline-flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Send className="size-4" />
            <span className="sr-only">Send guess</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Recovered shared chat panel used by game/chat presentation chunks.
 *
 * Message/input behavior, layout and the composer error shake follow the
 * shipped chunk. The shake is the shipped framer-motion `useAnimation` tween
 * (`x: [0,-6,6,-4,4,0]`, 300ms, easeOut) reproduced as the
 * `chat-composer-shake` keyframes in styles/components.css; no animation
 * dependency is introduced for it.
 *
 * Player and other rows enter from opacity 0 / y 10 and exit to opacity 0 / y -10.
 * Center status pills enter and exit at scale 0.95 with opacity. Both are the
 * shipped plain 300ms tweens: the chunk does not name a custom cubic, so the
 * stylesheet uses CSS `ease`. Removed rows stay mounted for 300ms and the list
 * FLIPs so neighbors slide instead of jumping. Reduced motion drops the exit
 * hold and the FLIP.
 */
export const ChatPanel = memo(function ChatPanel({
  messages,
  isPlayerGuesser,
  active,
  onSubmitGuess,
  placeholder = "Type here...",
  disabledPlaceholder = "Waiting...",
  emptyMessage = "Waiting for activity...",
  renderBeforeSubmit,
  viewportRef,
  playSound,
}: ChatPanelProps) {
  return (
    <div className="bg-card text-card-foreground h-full flex flex-col gap-0 rounded-xl border py-0 shadow-none overflow-hidden">
      <ChatMessageList messages={messages} viewportRef={viewportRef} emptyMessage={emptyMessage} />
      <ChatComposer
        isPlayerGuesser={isPlayerGuesser}
        active={active}
        onSubmitGuess={onSubmitGuess}
        placeholder={placeholder}
        disabledPlaceholder={disabledPlaceholder}
        renderBeforeSubmit={renderBeforeSubmit}
        playSound={playSound}
      />
    </div>
  );
});
