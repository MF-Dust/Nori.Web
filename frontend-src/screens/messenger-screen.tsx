import {
  Ban,
  Bot,
  CheckCheck,
  ChevronLeft,
  Download,
  EllipsisVertical,
  Lock,
  Phone,
  Plus,
  Search,
  SendHorizontal,
  Smile,
  SquarePen,
  Video,
  X,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import type {
  MessengerAppModel,
  SignalConversation,
  SignalMessage,
  SignalThread,
} from "../apps/messenger";
import { SIGNAL_DANIEL_EVIDENCE_FACT } from "../apps/signal-daniel";
import { MarkdownBody } from "../components/markdown-body";

const DESKTOP_BREAKPOINT = 640;
const THREAD_LIST_WIDTH = 320;
const FILE_DOWNLOAD_DURATION_MS = 1800;
const SEALED_ERROR_CODE = "451 SENDER_RESTRICTED";
const SEALED_ERROR_DETAILS = [
  "PolicyException: send rejected",
  "  route: unidentified-delivery → relay.signal",
  "  peer is not a verified service account",
  "  account +1 555 0•• ••••  status 451 (restricted: risk-review)",
];

export type MessengerTranslate = (
  key: string,
  params?: Readonly<Record<string, string | number>>,
) => string;

export interface SignalServiceConversationRuntime {
  isInteractive?: (thread: SignalThread) => boolean;
  isTyping?: (thread: SignalThread) => boolean;
  send?: (thread: SignalThread, body: string) => void | Promise<void>;
  subscribe?: (listener: () => void) => () => void;
  resolveMessages?: (
    thread: SignalThread,
    staticMessages: readonly SignalMessage[],
  ) => SignalMessage[];
  onOpen?: (thread: SignalThread) => void;
  /** null hides the badge, undefined falls back to the generic service badge. */
  getServiceBadge?: (thread: SignalThread) => string | null | undefined;
}

export interface MessengerScreenRuntime {
  model: MessengerAppModel;
  translate?: MessengerTranslate;
  playCue?: (cue: string) => void;
  openUrl?: (url: string) => void | Promise<void>;
  hasFact?: (factId: string) => boolean;
  isOwnMessage?: (message: SignalMessage) => boolean;
  getPendingFocusThreadId?: () => string | null;
  consumePendingFocusThreadId?: () => void;
  serviceConversation?: SignalServiceConversationRuntime;
}

const STRINGS: Record<string, string> = {
  "signal.threads.title": "Messages",
  "signal.threads.newChat": "New chat",
  "signal.threads.newChatHint": "New chats are unavailable",
  "signal.threads.search": "Search",
  "signal.threads.clearSearch": "Clear search",
  "signal.threads.loading": "Loading…",
  "signal.threads.empty": "No conversations",
  "signal.threads.retention": "Messages are retained by the local Signal archive.",
  "signal.message.recalled": "Message recalled",
  "signal.message.imagePreview": "Photo",
  "signal.message.filePreview": "File",
  "signal.conversation.viewPhoto": "View photo",
  "signal.conversation.back": "Back",
  "signal.conversation.serviceBadge": "Service",
  "signal.conversation.encrypted": "Encrypted",
  "signal.conversation.call": "Call",
  "signal.conversation.video": "Video",
  "signal.conversation.menu": "Menu",
  "signal.conversation.unavailable": "Unavailable",
  "signal.conversation.encryptionNotice": "Messages in this conversation are end-to-end encrypted.",
  "signal.conversation.typing": "Typing",
  "signal.empty.title": "Signal",
  "signal.empty.subtitle": "Select a conversation to start reading messages.",
  "signal.empty.encrypted": "End-to-end encrypted",
  "signal.attachment.download": "Download attachment",
  "signal.attachment.downloaded": "Downloaded",
  "signal.attachment.downloading": "Downloading…",
  "signal.composer.servicePlaceholder": "Message service account",
  "signal.composer.send": "Send",
  "signal.composer.attach": "Attach",
  "signal.composer.emoji": "Emoji",
  "signal.composer.placeholder": "Messaging is sealed",
  "signal.composer.disabledHint": "Sending is unavailable",
  "signal.composer.errorTitle": "Message could not be sent",
  "signal.composer.errorBody": "This peer is restricted by relay policy.",
  "signal.composer.details": "Details",
  "signal.composer.dismiss": "Dismiss",
  "signal.day.today": "Today",
  "signal.day.yesterday": "Yesterday",
};

function defaultTranslate(
  key: string,
  params?: Readonly<Record<string, string | number>>,
): string {
  if (key === "signal.threads.unread") return `${params?.count ?? 0} unread`;
  if (key === "signal.threads.noResults") return `No results for “${params?.query ?? ""}”`;
  return STRINGS[key] ?? key;
}

function useContainerWidth(): [RefObject<HTMLDivElement | null>, number] {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    setWidth(element.clientWidth);
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setWidth(entry.contentRect.width);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return [ref, width];
}

function avatarInitials(title: string): string {
  const parts = title.trim().split(/\s+/).filter(Boolean);
  return parts.length
    ? parts.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "").join("")
    : "?";
}

function avatarColor(seed: string): string {
  let hash = 0;
  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) | 0;
  return `hsl(${Math.abs(hash) % 360} 58% 46%)`;
}

function Avatar({
  title,
  seed,
  size = 40,
  imageSrc,
  onZoom,
  t,
}: {
  title: string;
  seed?: string;
  size?: number;
  imageSrc?: string;
  onZoom?: () => void;
  t: MessengerTranslate;
}) {
  const [failed, setFailed] = useState(false);
  if (imageSrc && !failed) {
    const image = (
      <img
        src={imageSrc}
        alt=""
        width={size}
        height={size}
        onError={() => setFailed(true)}
        className="shrink-0 select-none rounded-full object-cover"
        style={{ width: size, height: size }}
        aria-hidden
      />
    );
    return onZoom ? (
      <button
        type="button"
        onClick={onZoom}
        aria-label={t("signal.conversation.viewPhoto")}
        className="shrink-0 rounded-full outline-none transition-opacity hover:opacity-90"
      >
        {image}
      </button>
    ) : image;
  }
  return (
    <div
      className="flex shrink-0 select-none items-center justify-center rounded-full font-medium text-white"
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.42),
        background: avatarColor(seed ?? title),
      }}
      aria-hidden
    >
      {avatarInitials(title)}
    </div>
  );
}

function validDate(timestamp: string): Date | undefined {
  const date = new Date(timestamp);
  return Number.isFinite(date.getTime()) ? date : undefined;
}

function formatThreadTime(timestamp: string): string {
  const date = validDate(timestamp);
  if (!date) return "";
  if (date.toDateString() === new Date().toDateString()) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

function formatMessageTime(timestamp: string): string {
  return validDate(timestamp)?.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  }) ?? "";
}

function formatBytes(bytes: number): string {
  if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(1)} MB`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${bytes} B`;
}

interface ThreadView {
  conversation: SignalConversation;
  unreadCount: number;
  pendingReadFacts: string[];
  lastKind: string;
  lastBody: string;
  lastTimestamp: string;
}

function buildThreadViews(
  conversations: readonly SignalConversation[],
  localReadFacts: ReadonlySet<string>,
  hasFact?: (factId: string) => boolean,
): ThreadView[] {
  return conversations.map((conversation) => {
    const pendingReadFacts = conversation.messages
      .map((message) => message.readFact)
      .filter((fact): fact is string => Boolean(fact))
      .filter((fact) => !localReadFacts.has(fact) && !hasFact?.(fact));
    const last = conversation.messages.at(-1);
    return {
      conversation,
      unreadCount: pendingReadFacts.length,
      pendingReadFacts,
      lastKind: last?.kind ?? "text",
      lastBody: last?.body ?? "",
      lastTimestamp: last?.timestamp ?? "",
    };
  });
}

function ThreadRow({
  view,
  selected,
  onSelect,
  t,
}: {
  view: ThreadView;
  selected: boolean;
  onSelect(): void;
  t: MessengerTranslate;
}) {
  const { thread } = view.conversation;
  const unread = view.unreadCount > 0;
  const preview =
    view.lastKind === "deleted"
      ? t("signal.message.recalled")
      : view.lastKind === "image"
        ? t("signal.message.imagePreview")
        : view.lastKind === "file"
          ? t("signal.message.filePreview")
          : view.lastBody.replaceAll("\n", " ");

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-current={selected ? "true" : undefined}
      className={`flex w-full items-center gap-3 border-b border-l-2 px-3 py-2.5 text-left transition-colors ${
        selected
          ? "border-l-primary bg-primary/[0.12]"
          : "border-l-transparent border-border/50 hover:bg-muted/40"
      }`}
    >
      <Avatar
        title={thread.title}
        seed={thread.threadId}
        size={44}
        imageSrc={thread.avatarPath}
        t={t}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className={`truncate text-sm text-foreground ${unread ? "font-semibold" : "font-medium"}`}>
            {thread.title}
          </span>
          <span className={`shrink-0 text-[11px] ${unread ? "font-medium text-primary" : "text-muted-foreground"}`}>
            {formatThreadTime(view.lastTimestamp)}
          </span>
        </div>
        <div className="mt-0.5 flex items-center gap-2">
          <span className={`min-w-0 flex-1 truncate text-[13px] ${unread ? "font-medium text-foreground/90" : "text-muted-foreground"}`}>
            {preview}
          </span>
          {unread ? (
            <span
              aria-label={t("signal.threads.unread", { count: view.unreadCount })}
              className="flex h-[18px] min-w-[18px] shrink-0 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-semibold leading-none text-primary-foreground"
            >
              {view.unreadCount}
            </span>
          ) : null}
        </div>
      </div>
    </button>
  );
}

function ThreadList({
  views,
  selectedThreadId,
  loading,
  onSelect,
  t,
}: {
  views: readonly ThreadView[];
  selectedThreadId: string | null;
  loading: boolean;
  onSelect(threadId: string): void;
  t: MessengerTranslate;
}) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return normalized
      ? views.filter(({ conversation, lastBody }) =>
          `${conversation.thread.title} ${lastBody}`.toLowerCase().includes(normalized),
        )
      : views;
  }, [query, views]);

  return (
    <div className="flex h-full flex-col bg-muted/20">
      <header className="flex h-11 shrink-0 items-center justify-between border-b border-border/50 px-3">
        <span className="text-sm font-medium text-foreground">{t("signal.threads.title")}</span>
        <button
          type="button"
          title={t("signal.threads.newChatHint")}
          aria-label={t("signal.threads.newChat")}
          className="flex size-7 cursor-not-allowed items-center justify-center rounded-md text-muted-foreground/70"
        >
          <SquarePen className="size-4" />
        </button>
      </header>
      <div className="px-3 py-2.5">
        <div className="flex items-center gap-2 rounded-md border px-2.5 py-1.5 focus-within:ring-1 focus-within:ring-ring/40">
          <Search className="size-4 shrink-0 text-muted-foreground" />
          <input
            value={query}
            onChange={(event) => setQuery(event.currentTarget.value)}
            placeholder={t("signal.threads.search")}
            aria-label={t("signal.threads.search")}
            className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label={t("signal.threads.clearSearch")}
              className="shrink-0 text-muted-foreground hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          ) : null}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto border-t border-border/50 pb-2">
        {loading && !views.length ? (
          <div className="px-4 py-6 text-sm text-muted-foreground">{t("signal.threads.loading")}</div>
        ) : !views.length ? (
          <div className="px-4 py-6 text-sm text-muted-foreground">{t("signal.threads.empty")}</div>
        ) : !filtered.length ? (
          <div className="px-4 py-6 text-sm text-muted-foreground">
            {t("signal.threads.noResults", { query: query.trim() })}
          </div>
        ) : (
          <>
            {filtered.map((view) => (
              <ThreadRow
                key={view.conversation.thread.threadId}
                view={view}
                selected={view.conversation.thread.threadId === selectedThreadId}
                onSelect={() => onSelect(view.conversation.thread.threadId)}
                t={t}
              />
            ))}
            <p className="px-4 pb-1 pt-3 text-center text-[11px] text-muted-foreground/70">
              {t("signal.threads.retention")}
            </p>
          </>
        )}
      </div>
    </div>
  );
}

function FileAttachment({
  message,
  runtime,
  t,
}: {
  message: SignalMessage;
  runtime: MessengerScreenRuntime;
  t: MessengerTranslate;
}) {
  const fact = message.downloadFact;
  const downloaded = fact ? runtime.hasFact?.(fact) === true : false;
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const timeoutRef = useRef<number | undefined>(undefined);
  const rafRef = useRef<number | undefined>(undefined);

  useEffect(
    () => () => {
      if (timeoutRef.current !== undefined) window.clearTimeout(timeoutRef.current);
      if (rafRef.current !== undefined) cancelAnimationFrame(rafRef.current);
    },
    [],
  );

  const emit = async () => {
    if (fact) await runtime.model.emitDownloadFact(fact);
  };

  const download = () => {
    if (downloading || !fact) return;
    if (downloaded) {
      void emit();
      return;
    }
    setDownloading(true);
    setProgress(0);
    rafRef.current = requestAnimationFrame(() => setProgress(100));
    timeoutRef.current = window.setTimeout(() => {
      void emit().finally(() => setDownloading(false));
    }, FILE_DOWNLOAD_DURATION_MS);
  };

  return (
    <button
      type="button"
      onClick={download}
      aria-label={t(downloaded ? "signal.attachment.downloaded" : "signal.attachment.download")}
      className="flex w-full items-center gap-3 rounded-lg border border-border/60 bg-background/40 px-3 py-2.5 text-left transition-colors hover:bg-background/70"
    >
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Download className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-foreground">{message.fileName ?? ""}</div>
        <div className="text-xs text-muted-foreground">
          {downloading ? t("signal.attachment.downloading") : formatBytes(message.sizeBytes ?? 0)}
        </div>
      </div>
      {downloading ? (
        <div className="h-1.5 w-16 shrink-0 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary"
            style={{
              width: `${progress}%`,
              transitionProperty: "width",
              transitionDuration: `${FILE_DOWNLOAD_DURATION_MS}ms`,
              transitionTimingFunction: "linear",
            }}
          />
        </div>
      ) : (
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground">
          {downloaded ? <CheckCheck className="size-4 text-primary" /> : <Download className="size-4" />}
        </span>
      )}
    </button>
  );
}

function linkedText(
  body: string,
  className: string,
  openUrl?: (url: string) => void | Promise<void>,
): ReactNode[] {
  const pattern = /(https?:\/\/[^\s]+)/g;
  return body.split(pattern).map((part, index) =>
    index % 2 === 1 ? (
      <span
        key={index}
        role="link"
        tabIndex={0}
        onClick={() => void openUrl?.(part)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            void openUrl?.(part);
          }
        }}
        className={`cursor-pointer underline underline-offset-2 hover:opacity-80 ${className}`}
      >
        {part}
      </span>
    ) : part,
  );
}

function MessageBubble({
  message,
  thread,
  runtime,
  onViewImage,
  t,
}: {
  message: SignalMessage;
  thread: SignalThread;
  runtime: MessengerScreenRuntime;
  onViewImage(src: string): void;
  t: MessengerTranslate;
}) {
  const own = runtime.isOwnMessage?.(message) ?? message.self;
  const timestamp = message.timestamp ? formatMessageTime(message.timestamp) : "";
  const stamp = timestamp ? (
    <span className="flex items-center gap-1">
      {timestamp}{own ? <CheckCheck className="size-3" /> : null}
    </span>
  ) : null;

  if (message.kind === "deleted") {
    return (
      <div className={`flex ${own ? "justify-end" : "justify-start"}`}>
        <div className="flex max-w-[78%] items-center gap-1.5 rounded-2xl bg-muted/60 px-3.5 py-2 text-[13px] italic text-muted-foreground">
          <Ban className="size-3.5 shrink-0" />
          <span>{t("signal.message.recalled")}</span>
        </div>
      </div>
    );
  }

  if (message.kind === "image" && message.assetPath) {
    return (
      <div className={`flex ${own ? "justify-end" : "justify-start"}`}>
        <div className={`relative max-w-[min(78%,20rem)] overflow-hidden rounded-2xl p-0.5 ${own ? "rounded-br-sm bg-primary" : "rounded-bl-sm border"}`}>
          <button
            type="button"
            onClick={() => onViewImage(message.assetPath!)}
            aria-label={t("signal.conversation.viewPhoto")}
            className="block w-full cursor-zoom-in outline-none transition-opacity hover:opacity-95"
          >
            <img
              src={message.assetPath}
              alt={message.alt ?? ""}
              width={message.dimensions?.width}
              height={message.dimensions?.height}
              className="block h-auto max-w-full rounded-[14px] object-cover"
            />
          </button>
          {stamp ? (
            <span className="pointer-events-none absolute bottom-2 right-2 rounded-full bg-black/45 px-1.5 py-0.5 text-[10px] text-white">
              {stamp}
            </span>
          ) : null}
        </div>
      </div>
    );
  }

  if (message.kind === "file" && message.downloadFact) {
    return (
      <div className="flex justify-start">
        <div className="max-w-[min(78%,18rem)]">
          <FileAttachment message={message} runtime={runtime} t={t} />
          {timestamp ? <div className="mt-1 text-right text-[10px] text-muted-foreground">{timestamp}</div> : null}
        </div>
      </div>
    );
  }

  if (!own && thread.service && message.kind === "text") {
    return (
      <div className="flex justify-start">
        <div className="relative max-w-[78%] rounded-2xl rounded-bl-sm border px-3.5 py-2 text-sm text-secondary-foreground shadow-sm">
          <MarkdownBody markdown={`🤖 ${message.body}`} className="select-text break-words italic leading-relaxed" />
          {timestamp ? <div className="mt-1 text-right text-[10px] not-italic text-muted-foreground">{timestamp}</div> : null}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${own ? "justify-end" : "justify-start"}`}>
      <div className={`relative max-w-[78%] rounded-2xl px-3.5 py-2 text-sm ${own ? "rounded-br-sm bg-primary text-primary-foreground" : "rounded-bl-sm border text-secondary-foreground"}`}>
        <div className="select-text whitespace-pre-wrap break-words leading-relaxed">
          {linkedText(message.body, own ? "text-primary-foreground" : "text-primary", runtime.openUrl)}
          {timestamp ? <span aria-hidden className="invisible ml-2 inline-flex text-[10px]">{timestamp}</span> : null}
        </div>
        {stamp ? (
          <span className={`pointer-events-none absolute bottom-2 right-3.5 text-[10px] ${own ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
            {stamp}
          </span>
        ) : null}
      </div>
    </div>
  );
}

interface MessageGroup {
  key: string;
  label: "today" | "yesterday" | string;
  messages: SignalMessage[];
}

function groupMessages(messages: readonly SignalMessage[]): MessageGroup[] {
  const groups: MessageGroup[] = [];
  const now = new Date();
  const today = now.toDateString();
  const yesterdayDate = new Date(now);
  yesterdayDate.setDate(now.getDate() - 1);
  const yesterday = yesterdayDate.toDateString();

  for (const message of messages) {
    const date = validDate(message.timestamp);
    const key = date?.toDateString() ?? "unknown";
    const label = key === today
      ? "today"
      : key === yesterday
        ? "yesterday"
        : date?.toLocaleDateString() ?? "";
    const previous = groups.at(-1);
    if (previous?.key === key) previous.messages.push(message);
    else groups.push({ key, label, messages: [message] });
  }
  return groups;
}

function SealedComposer({ runtime, t }: { runtime: MessengerScreenRuntime; t: MessengerTranslate }) {
  const [errorOpen, setErrorOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const reject = () => {
    runtime.playCue?.("comms-signal-sealed-composer");
    setErrorOpen(true);
  };

  return (
    <div className="relative shrink-0 border-t border-border/50">
      {errorOpen ? (
        <div className="absolute inset-x-3 bottom-full mb-2 overflow-hidden rounded-lg border border-destructive/40 bg-popover shadow-lg" role="alert">
          <div className="flex items-start gap-2.5 p-3">
            <Ban className="mt-0.5 size-4 shrink-0 text-destructive" />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-destructive">{t("signal.composer.errorTitle")}</div>
              <p className="mt-0.5 text-[13px] leading-relaxed text-muted-foreground">{t("signal.composer.errorBody")}</p>
              <div className="mt-2 flex items-center gap-2">
                <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">{SEALED_ERROR_CODE}</span>
                <button type="button" onClick={() => setDetailsOpen((value) => !value)} className="text-[11px] text-muted-foreground hover:text-foreground">
                  {t("signal.composer.details")}
                </button>
              </div>
              {detailsOpen ? (
                <pre className="mt-2 whitespace-pre-wrap rounded bg-muted/50 p-2 font-mono text-[10px] leading-relaxed text-muted-foreground">
                  {SEALED_ERROR_DETAILS.join("\n")}
                </pre>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => {
                setErrorOpen(false);
                setDetailsOpen(false);
              }}
              aria-label={t("signal.composer.dismiss")}
              className="shrink-0 rounded p-0.5 text-muted-foreground hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
      ) : null}
      <div className="flex items-end gap-2 px-3 py-2.5">
        <button type="button" onClick={reject} aria-label={t("signal.composer.attach")} title={t("signal.composer.disabledHint")} className="mb-0.5 flex size-9 shrink-0 cursor-not-allowed items-center justify-center rounded-full text-muted-foreground/70">
          <Plus className="size-5" />
        </button>
        <div className="flex min-w-0 flex-1 items-center gap-2 rounded-2xl border px-3 py-2">
          <Lock className="size-3.5 shrink-0 text-muted-foreground" />
          <input
            type="text"
            readOnly
            value=""
            onMouseDown={(event) => {
              event.preventDefault();
              reject();
            }}
            onFocus={(event) => event.currentTarget.blur()}
            placeholder={t("signal.composer.placeholder")}
            aria-label={t("signal.composer.placeholder")}
            className="min-w-0 flex-1 cursor-not-allowed bg-transparent text-sm text-muted-foreground outline-none placeholder:text-muted-foreground"
          />
          <button type="button" onClick={reject} aria-label={t("signal.composer.emoji")} title={t("signal.composer.disabledHint")} className="shrink-0 cursor-not-allowed text-muted-foreground/70">
            <Smile className="size-5" />
          </button>
        </div>
        <button type="button" onClick={reject} aria-label={t("signal.composer.send")} title={t("signal.composer.disabledHint")} className="mb-0.5 flex size-9 shrink-0 cursor-not-allowed items-center justify-center rounded-full bg-primary text-primary-foreground opacity-50">
          <SendHorizontal className="size-[18px]" />
        </button>
      </div>
    </div>
  );
}

function ServiceComposer({
  thread,
  runtime,
  t,
}: {
  thread: SignalThread;
  runtime: MessengerScreenRuntime;
  t: MessengerTranslate;
}) {
  const [body, setBody] = useState("");
  const typing = runtime.serviceConversation?.isTyping?.(thread) === true;
  const send = () => {
    const trimmed = body.trim();
    if (!trimmed || typing || !runtime.serviceConversation?.send) return;
    runtime.playCue?.("comms-signal-verify-send");
    void runtime.serviceConversation.send(thread, trimmed);
    setBody("");
  };

  return (
    <div className="relative shrink-0 border-t border-border/50">
      <div className="flex items-end gap-2 px-3 py-2.5">
        <div className="flex min-w-0 flex-1 items-center gap-2 rounded-2xl border px-3 py-2 focus-within:ring-1 focus-within:ring-ring/40">
          <input
            type="text"
            value={body}
            onChange={(event) => setBody(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.nativeEvent.isComposing) {
                event.preventDefault();
                send();
              }
            }}
            autoComplete="off"
            placeholder={t("signal.composer.servicePlaceholder")}
            aria-label={t("signal.composer.servicePlaceholder")}
            className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
        </div>
        <button type="button" onClick={send} disabled={!body.trim() || typing} aria-label={t("signal.composer.send")} className="mb-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-40">
          <SendHorizontal className="size-[18px]" />
        </button>
      </div>
    </div>
  );
}

function TypingBubble({ t }: { t: MessengerTranslate }) {
  return (
    <div className="flex justify-start">
      <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-sm border px-3.5 py-2.5 text-secondary-foreground shadow-sm">
        <span className="sr-only">{t("signal.conversation.typing")}</span>
        {[0, 1, 2].map((index) => (
          <span key={index} className="size-1.5 animate-bounce rounded-full bg-current opacity-50" style={{ animationDelay: `${index * 140}ms` }} />
        ))}
      </div>
    </div>
  );
}

function ConversationView({
  conversation,
  showBack,
  onBack,
  onViewImage,
  runtime,
  t,
}: {
  conversation: SignalConversation;
  showBack: boolean;
  onBack(): void;
  onViewImage(src: string): void;
  runtime: MessengerScreenRuntime;
  t: MessengerTranslate;
}) {
  const { thread, messages } = conversation;
  const [, setServiceRevision] = useState(0);
  const serviceConversation = runtime.serviceConversation;

  useEffect(() => serviceConversation?.subscribe?.(() => {
    setServiceRevision((revision) => revision + 1);
  }), [serviceConversation]);

  useEffect(() => {
    serviceConversation?.onOpen?.(thread);
  }, [serviceConversation, thread]);

  const interactive = serviceConversation?.isInteractive?.(thread) === true;
  const typing = serviceConversation?.isTyping?.(thread) === true;
  const typingWasActive = useRef(typing);
  const evidenceUnlocked = runtime.hasFact?.(SIGNAL_DANIEL_EVIDENCE_FACT) === true;
  const evidenceWasUnlocked = useRef(evidenceUnlocked);

  useEffect(() => {
    if (typing && !typingWasActive.current) runtime.playCue?.("comms-signal-typing");
    typingWasActive.current = typing;
  }, [runtime, typing]);

  useEffect(() => {
    if (evidenceUnlocked && !evidenceWasUnlocked.current) {
      runtime.playCue?.("comms-signal-evidence-unlock");
    }
    evidenceWasUnlocked.current = evidenceUnlocked;
  }, [evidenceUnlocked, runtime]);
  const resolvedMessages = serviceConversation?.resolveMessages?.(thread, messages) ?? messages;
  const grouped = useMemo(() => groupMessages(resolvedMessages), [resolvedMessages]);
  const serviceBadge = serviceConversation?.getServiceBadge?.(thread);
  const showServiceBadge = serviceBadge === undefined ? thread.service : serviceBadge !== null;
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = scrollRef.current;
    if (element) element.scrollTop = element.scrollHeight;
  }, [resolvedMessages, typing]);

  const actions = [
    { Icon: Phone, label: "signal.conversation.call" },
    { Icon: Video, label: "signal.conversation.video" },
    { Icon: EllipsisVertical, label: "signal.conversation.menu" },
  ] as const;

  return (
    <div className="flex h-full flex-col text-foreground">
      <header className="flex shrink-0 items-center gap-3 border-b border-border/50 px-3 py-2.5">
        {showBack ? (
          <button type="button" onClick={onBack} aria-label={t("signal.conversation.back")} className="-ml-1 inline-flex items-center rounded-md p-1 text-muted-foreground hover:bg-muted/60 hover:text-foreground">
            <ChevronLeft className="size-5" />
          </button>
        ) : null}
        <Avatar
          title={thread.title}
          seed={thread.threadId}
          size={36}
          imageSrc={thread.avatarPath}
          onZoom={thread.avatarPath ? () => onViewImage(thread.avatarPath!) : undefined}
          t={t}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-sm font-medium">{thread.title}</span>
            {showServiceBadge ? (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                <Bot className="size-2.5" />{serviceBadge ?? t("signal.conversation.serviceBadge")}
              </span>
            ) : null}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Lock className="size-3" /><span>{t("signal.conversation.encrypted")}</span>
          </div>
        </div>
        <div className="flex items-center gap-0.5">
          {actions.map(({ Icon, label }) => (
            <button key={label} type="button" title={t("signal.conversation.unavailable")} aria-label={t(label)} className="flex size-8 cursor-not-allowed items-center justify-center rounded-full text-muted-foreground/70">
              <Icon className="size-[18px]" />
            </button>
          ))}
        </div>
      </header>
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3">
        <div className="flex justify-center pb-3 pt-1">
          <span className="max-w-[80%] rounded-lg bg-muted/60 px-3 py-1.5 text-center text-[11px] leading-relaxed text-muted-foreground">
            {t("signal.conversation.encryptionNotice")}
          </span>
        </div>
        <div className="space-y-2">
          {grouped.map((group) => (
            <div key={group.key} className="space-y-2">
              <div className="flex justify-center py-1">
                <span className="rounded-full bg-muted/60 px-3 py-1 text-[11px] font-medium text-muted-foreground">
                  {group.label === "today"
                    ? t("signal.day.today")
                    : group.label === "yesterday"
                      ? t("signal.day.yesterday")
                      : group.label}
                </span>
              </div>
              {group.messages.map((message) => (
                <MessageBubble
                  key={message.messageId}
                  message={message}
                  thread={thread}
                  runtime={runtime}
                  onViewImage={onViewImage}
                  t={t}
                />
              ))}
            </div>
          ))}
          {typing ? <TypingBubble t={t} /> : null}
        </div>
      </div>
      {interactive
        ? <ServiceComposer thread={thread} runtime={runtime} t={t} />
        : <SealedComposer runtime={runtime} t={t} />}
    </div>
  );
}

function EmptyConversation({ t }: { t: MessengerTranslate }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 px-8 text-center text-foreground">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10">
        <SendHorizontal className="size-8 text-primary" />
      </div>
      <div>
        <div className="text-base font-medium">{t("signal.empty.title")}</div>
        <p className="mt-1 max-w-xs text-sm leading-relaxed text-muted-foreground">{t("signal.empty.subtitle")}</p>
      </div>
      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <Lock className="size-3" /><span>{t("signal.empty.encrypted")}</span>
      </div>
    </div>
  );
}

function ImageOverlay({
  src,
  onClose,
  t,
}: {
  src: string;
  onClose(): void;
  t: MessengerTranslate;
}) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/70 p-6" role="dialog" aria-modal="true" onClick={onClose}>
      <img
        src={src}
        alt={t("signal.conversation.viewPhoto")}
        className="max-h-full max-w-full rounded-lg object-contain shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      />
    </div>
  );
}

export function MessengerScreen({ runtime }: { runtime: MessengerScreenRuntime }) {
  const t = runtime.translate ?? defaultTranslate;
  const [containerRef, width] = useContainerWidth();
  const [conversations, setConversations] = useState<SignalConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [retainedThreadId, setRetainedThreadId] = useState<string | null>(null);
  const [image, setImage] = useState<string | null>(null);
  const [localReadFacts, setLocalReadFacts] = useState<Set<string>>(() => new Set());

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setConversations(await runtime.model.conversations());
    } catch (error) {
      console.warn("[Signal] Failed to load conversations", error);
    } finally {
      setLoading(false);
    }
  }, [runtime.model]);

  useEffect(() => {
    void load();
  }, [load]);

  const views = useMemo(
    () => buildThreadViews(conversations, localReadFacts, runtime.hasFact),
    [conversations, localReadFacts, runtime.hasFact],
  );
  const selected = conversations.find((conversation) => conversation.thread.threadId === selectedThreadId) ?? null;
  const retained = conversations.find((conversation) => conversation.thread.threadId === retainedThreadId) ?? null;

  const selectThread = useCallback((threadId: string) => {
    if (threadId !== selectedThreadId) runtime.playCue?.("comms-signal-open-thread");
    const view = views.find((candidate) => candidate.conversation.thread.threadId === threadId);
    setSelectedThreadId(threadId);
    setRetainedThreadId(threadId);
    setImage(null);

    if (view && view.unreadCount > 0) {
      const pendingFacts = view.pendingReadFacts;
      void runtime.model.markThreadRead(threadId)
        .then(() => {
          setLocalReadFacts((current) => {
            const next = new Set(current);
            for (const fact of pendingFacts) next.add(fact);
            return next;
          });
        })
        .catch((error) => console.warn("[Signal] Failed to mark thread as read", error));
    }
  }, [runtime, selectedThreadId, views]);

  useEffect(() => {
    const pending = runtime.getPendingFocusThreadId?.();
    if (!pending || loading) return;
    selectThread(pending);
    runtime.consumePendingFocusThreadId?.();
  }, [loading, runtime, selectThread]);

  const back = useCallback(() => setSelectedThreadId(null), []);

  if (width >= DESKTOP_BREAKPOINT) {
    return (
      <div ref={containerRef} className="relative flex h-full">
        <div className="shrink-0 border-r border-border/50" style={{ width: THREAD_LIST_WIDTH }}>
          <ThreadList views={views} selectedThreadId={selectedThreadId} loading={loading} onSelect={selectThread} t={t} />
        </div>
        <div className="min-w-0 flex-1">
          {selected
            ? <ConversationView conversation={selected} showBack={false} onBack={back} onViewImage={setImage} runtime={runtime} t={t} />
            : <EmptyConversation t={t} />}
        </div>
        {image ? <ImageOverlay src={image} onClose={() => setImage(null)} t={t} /> : null}
      </div>
    );
  }

  const opened = selectedThreadId !== null;
  return (
    <div ref={containerRef} className="relative h-full overflow-clip">
      <div
        className="flex h-full w-[200%]"
        style={{
          transform: `translateX(${opened ? "-50%" : "0%"})`,
          transition: "transform 250ms cubic-bezier(0.32,0.72,0,1)",
        }}
        onTransitionEnd={() => {
          if (!opened) setRetainedThreadId(null);
        }}
      >
        <div className="h-full w-1/2 shrink-0">
          <ThreadList views={views} selectedThreadId={selectedThreadId} loading={loading} onSelect={selectThread} t={t} />
        </div>
        <div className="h-full w-1/2 shrink-0">
          {retained
            ? <ConversationView conversation={retained} showBack onBack={back} onViewImage={setImage} runtime={runtime} t={t} />
            : null}
        </div>
      </div>
      {image ? <ImageOverlay src={image} onClose={() => setImage(null)} t={t} /> : null}
    </div>
  );
}
