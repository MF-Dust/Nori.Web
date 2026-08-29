import {
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
  type Ref,
} from "react";
import { CircleAlert, Send, TriangleAlert, Zap } from "lucide-react";

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

function renderChatContent(content: ChatMessageContent): ReactNode {
  if (content == null || typeof content === "boolean") return content;
  if (
    typeof content === "string" ||
    typeof content === "number" ||
    typeof content === "bigint" ||
    Array.isArray(content)
  ) {
    return content;
  }
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
  return content as ReactNode;
}

const ChatMessage = memo(function ChatMessage({ message }: { message: ChatPanelMessage }) {
  const success = message.tone === "success";
  const content = renderChatContent(message.content);

  if (message.sender === "system") {
    const warning = message.tone === "warning";
    const danger = message.tone === "danger";
    return (
      <div className="flex w-full mb-2 justify-center">
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
      </div>
    );
  }

  if (message.sender === "player") {
    return (
      <div className="flex w-full mb-2 justify-end">
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
      </div>
    );
  }

  return (
    <div className="flex w-full mb-2 justify-start">
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
    </div>
  );
});

interface FadingScrollAreaProps {
  children: ReactNode;
  gradientHeight?: number;
  gradientColor?: string;
  gradientFullWidth?: boolean;
  className?: string;
}

const FadingScrollArea = forwardRef<HTMLDivElement, FadingScrollAreaProps>(function FadingScrollArea(
  {
    children,
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
  }, [gradientHeight]);

  return (
    <div className={classes("relative", className)}>
      <div ref={viewport} className="h-full w-full overflow-y-auto">
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

function ChatMessageList({ messages, emptyMessage, viewportRef }: ChatMessageListProps) {
  const scrollArea = useRef<HTMLDivElement | null>(null);
  const end = useRef<HTMLDivElement | null>(null);

  useImperativeHandle(viewportRef, () => scrollArea.current as HTMLDivElement, []);

  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <FadingScrollArea
      ref={scrollArea}
      className="flex-1 min-h-0"
      gradientColor="var(--card)"
      gradientFullWidth
    >
      <div className="px-3 pt-3 pb-3">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="p-3 rounded-full bg-muted/50 mb-3">
              <Zap className="size-5 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">{emptyMessage}</p>
          </div>
        ) : (
          messages.map((message) => <ChatMessage key={message.id} message={message} />)
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
  const textarea = useRef<HTMLTextAreaElement | null>(null);
  const wasEnabled = useRef(false);
  const lastTypingSound = useRef(0);
  const enabled = isPlayerGuesser && active;

  useEffect(() => {
    if (enabled && !wasEnabled.current) {
      window.setTimeout(() => textarea.current?.focus(), 100);
    }
    wasEnabled.current = enabled;
  }, [enabled]);

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
    textarea.current?.focus();
  }, [active, onSubmitGuess, playSound, value]);

  const onKeyDown = useCallback(
    (event: KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === "Enter" && !event.shiftKey) {
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
 * Message/input behavior and layout follow the shipped chunk. The original
 * motion-controller animations remain a presentation-only migration detail;
 * no extra animation dependency is introduced here just to emulate them.
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
