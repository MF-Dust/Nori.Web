import {
  Ban,
  Bot,
  CheckCheck,
  ChevronLeft,
  Download,
  EllipsisVertical,
  ImageOff,
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
  useSyncExternalStore,
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
import {
  compareSignalConversationRecency,
  createSignalLocalReadFactsStore,
  draftAfterSuccessfulSend,
  formatSignalThreadTimestamp,
  groupSignalMessages,
  isConversationNearBottom,
  shouldSubmitMessageKey,
  signalAvatarColor,
  signalAvatarInitial,
  signalThreadReadState,
  type SignalLocalReadFactsStore,
} from "../apps/messenger-interactions";
import { parseSignalTimestamp } from "../apps/signal-story-clock";
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
  subscribe?: (listener: () => void) => () => void;
  translate?: MessengerTranslate;
  playCue?: (cue: string) => void;
  openUrl?: (url: string) => void | Promise<void>;
  hasFact?: (factId: string) => boolean;
  isOwnMessage?: (message: SignalMessage) => boolean;
  getPendingFocusThreadId?: () => string | null;
  consumePendingFocusThreadId?: () => void;
  localReadFacts?: SignalLocalReadFactsStore;
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
  useEffect(() => setFailed(false), [imageSrc]);
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
        className="shrink-0 rounded-full outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring/60"
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
        background: signalAvatarColor(seed ?? title),
      }}
      aria-hidden
    >
      {signalAvatarInitial(title)}
    </div>
  );
}

function validDate(timestamp: string): Date | undefined {
  const date = parseSignalTimestamp(timestamp);
  return Number.isFinite(date.getTime()) ? date : undefined;
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
  return [...conversations]
    .sort(compareSignalConversationRecency)
    .map((conversation) => {
      const readState = signalThreadReadState(
        conversation.thread,
        conversation.messages,
        localReadFacts,
        hasFact,
      );
      const last = conversation.messages.at(-1);
      return {
        conversation,
        unreadCount: readState.unreadCount,
        pendingReadFacts: readState.pendingReadFacts,
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
      className={`flex w-full items-center gap-3 border-b border-border/50 border-l-2 border-l-transparent px-3 py-2.5 text-left outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/60 ${
        selected
          ? "border-l-primary bg-primary/[0.12] hover:bg-primary/[0.18] active:bg-primary/[0.24]"
          : "hover:bg-muted/40 active:bg-muted/60"
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
          <span className={`shrink-0 text-[11px] ${unread ? "font-medium text-primary" : selected ? "text-foreground/70" : "text-muted-foreground"}`}>
            {formatSignalThreadTimestamp(view.lastTimestamp)}
          </span>
        </div>
        <div className="mt-0.5 flex items-center gap-2">
          <span className={`min-w-0 flex-1 truncate text-[13px] ${unread ? "font-medium text-foreground/90" : selected ? "text-foreground/80" : "text-muted-foreground"}`}>
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
          className="flex size-7 cursor-not-allowed items-center justify-center rounded-md text-muted-foreground/70 transition-colors hover:text-muted-foreground"
        >
          <SquarePen className="size-4" />
        </button>
      </header>
      <div className="px-3 py-2.5">
        <div className="flex items-center gap-2 rounded-md border px-2.5 py-1.5 transition-shadow focus-within:ring-1 focus-within:ring-ring/40">
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
              className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
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
      void emit().catch((error) => {
        console.warn("[Signal] Failed to reopen attachment", error);
      });
      return;
    }
    setDownloading(true);
    setProgress(0);
    rafRef.current = requestAnimationFrame(() => setProgress(100));
    timeoutRef.current = window.setTimeout(() => {
      void emit()
        .catch((error) => {
          console.warn("[Signal] Failed to download attachment", error);
          setProgress(0);
        })
        .finally(() => setDownloading(false));
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

function MessagePhoto({
  message,
  onViewImage,
  t,
}: {
  message: SignalMessage;
  onViewImage(src: string): void;
  t: MessengerTranslate;
}) {
  const [failed, setFailed] = useState(false);
  const src = message.assetPath!;
  useEffect(() => setFailed(false), [src]);

  if (failed) {
    return (
      <div
        role="img"
        aria-label={message.alt || t("signal.message.imagePreview")}
        className="flex min-h-24 min-w-36 flex-col items-center justify-center gap-1 rounded-[14px] bg-muted/60 px-4 py-6 text-muted-foreground"
      >
        <ImageOff className="size-5" />
        <span className="text-xs">{t("signal.message.imagePreview")}</span>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onViewImage(src)}
      aria-label={t("signal.conversation.viewPhoto")}
      className="block w-full cursor-zoom-in outline-none transition-opacity hover:opacity-95 focus-visible:ring-2 focus-visible:ring-ring/60"
    >
      <img
        src={src}
        alt={message.alt ?? ""}
        width={message.dimensions?.width}
        height={message.dimensions?.height}
        onError={() => setFailed(true)}
        className="block h-auto max-w-full rounded-[14px] object-cover"
      />
    </button>
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
    <>
      <span>{timestamp}</span>
      {own ? <CheckCheck className="size-3" /> : null}
    </>
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
          <MessagePhoto message={message} onViewImage={onViewImage} t={t} />
          {stamp ? (
            <span className="pointer-events-none absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-black/45 px-1.5 py-0.5 text-[10px] text-white">
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
          {stamp ? (
            <div className="mt-1 flex justify-end">
              <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                {stamp}
              </span>
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  if (!own && thread.service && message.kind === "text") {
    return (
      <div className="flex justify-start">
        <div className="relative max-w-[78%] rounded-2xl rounded-bl-sm border px-3.5 py-2 text-sm text-secondary-foreground shadow-sm">
          <MarkdownBody markdown={`🤖 ${message.body}`} className="select-text break-words italic leading-relaxed" />
          {stamp ? (
            <div className="mt-1 flex justify-end">
              <span className="flex items-center gap-1 text-[10px] not-italic text-muted-foreground">
                {stamp}
              </span>
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${own ? "justify-end" : "justify-start"}`}>
      <div className={`relative max-w-[78%] rounded-2xl px-3.5 py-2 text-sm ${own ? "rounded-br-sm bg-primary text-primary-foreground" : "rounded-bl-sm border text-secondary-foreground"}`}>
        <div className="select-text whitespace-pre-wrap break-words leading-relaxed">
          {linkedText(message.body, own ? "text-primary-foreground" : "text-primary", runtime.openUrl)}
          {stamp ? (
            <span aria-hidden className="invisible ml-2 inline-flex select-none items-center gap-1 text-[10px]">
              {stamp}
            </span>
          ) : null}
        </div>
        {stamp ? (
          <span className={`pointer-events-none absolute bottom-2 right-3.5 flex items-center gap-1 text-[10px] ${own ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
            {stamp}
          </span>
        ) : null}
      </div>
    </div>
  );
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
                <button type="button" onClick={() => setDetailsOpen((value) => !value)} className="text-[11px] text-muted-foreground transition-colors hover:text-foreground">
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
              className="shrink-0 rounded p-0.5 text-muted-foreground transition-colors hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
      ) : null}
      <div className="flex items-end gap-2 px-3 py-2.5">
        <button type="button" onClick={reject} aria-label={t("signal.composer.attach")} title={t("signal.composer.disabledHint")} className="mb-0.5 flex size-9 shrink-0 cursor-not-allowed items-center justify-center rounded-full text-muted-foreground/70 transition-colors hover:text-muted-foreground">
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
          <button type="button" onClick={reject} aria-label={t("signal.composer.emoji")} title={t("signal.composer.disabledHint")} className="shrink-0 cursor-not-allowed text-muted-foreground/70 transition-colors hover:text-muted-foreground">
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
  const [sending, setSending] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const composing = useRef(false);
  const typing = runtime.serviceConversation?.isTyping?.(thread) === true;
  const send = async () => {
    const trimmed = body.trim();
    const serviceSend = runtime.serviceConversation?.send;
    if (!trimmed || typing || sending || !serviceSend) return;
    setSending(true);
    runtime.playCue?.("comms-signal-verify-send");
    try {
      await serviceSend(thread, trimmed);
      setBody((current) => draftAfterSuccessfulSend(current, trimmed));
    } catch (error) {
      console.warn("[Signal] Failed to send service message", error);
      inputRef.current?.focus();
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="relative shrink-0 border-t border-border/50">
      <div className="flex items-end gap-2 px-3 py-2.5">
        <div className="flex min-w-0 flex-1 items-center gap-2 rounded-2xl border px-3 py-2 transition-shadow focus-within:ring-1 focus-within:ring-ring/40">
          <input
            ref={inputRef}
            type="text"
            value={body}
            onChange={(event) => setBody(event.target.value)}
            onCompositionStart={() => {
              composing.current = true;
            }}
            onCompositionEnd={() => {
              composing.current = false;
            }}
            onKeyDown={(event) => {
              if (shouldSubmitMessageKey(event, composing.current)) {
                event.preventDefault();
                void send();
              }
            }}
            autoComplete="off"
            placeholder={t("signal.composer.servicePlaceholder")}
            aria-label={t("signal.composer.servicePlaceholder")}
            className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
        </div>
        <button type="button" onClick={() => void send()} disabled={!body.trim() || typing || sending} aria-label={t("signal.composer.send")} className="mb-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-opacity disabled:cursor-not-allowed disabled:opacity-40">
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
  const grouped = useMemo(() => groupSignalMessages(resolvedMessages), [resolvedMessages]);
  const serviceBadge = serviceConversation?.getServiceBadge?.(thread);
  const showServiceBadge = serviceBadge === undefined ? thread.service : serviceBadge !== null;
  const scrollRef = useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);
  const previousThreadId = useRef(thread.threadId);

  useLayoutEffect(() => {
    const element = scrollRef.current;
    if (!element) return;
    if (previousThreadId.current !== thread.threadId) {
      previousThreadId.current = thread.threadId;
      stickToBottom.current = true;
    }
    if (stickToBottom.current) element.scrollTop = element.scrollHeight;
  }, [resolvedMessages, thread.threadId, typing]);

  const actions = [
    { Icon: Phone, label: "signal.conversation.call" },
    { Icon: Video, label: "signal.conversation.video" },
    { Icon: EllipsisVertical, label: "signal.conversation.menu" },
  ] as const;

  return (
    <div className="flex h-full flex-col text-foreground">
      <header className="flex shrink-0 items-center gap-3 border-b border-border/50 px-3 py-2.5">
        {showBack ? (
          <button type="button" onClick={onBack} aria-label={t("signal.conversation.back")} className="-ml-1 inline-flex items-center rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground">
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
            <button key={label} type="button" title={t("signal.conversation.unavailable")} aria-label={t(label)} className="flex size-8 cursor-not-allowed items-center justify-center rounded-full text-muted-foreground/70 transition-colors hover:text-muted-foreground">
              <Icon className="size-[18px]" />
            </button>
          ))}
        </div>
      </header>
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-3"
        onScroll={(event) => {
          stickToBottom.current = isConversationNearBottom(event.currentTarget);
        }}
      >
        <div className="flex justify-center pb-3 pt-1">
          <span className="max-w-[80%] rounded-lg bg-muted/60 px-3 py-1.5 text-center text-[11px] leading-relaxed text-muted-foreground">
            {t("signal.conversation.encryptionNotice")}
          </span>
        </div>
        <div className="space-y-2">
          {grouped.map((group) => (
            <div key={group.key} className="space-y-2">
              {group.separator ? (
                <div className="flex justify-center py-1">
                  <span className="rounded-full bg-muted/60 px-3 py-1 text-[11px] font-medium text-muted-foreground">
                    {group.separator.kind === "today"
                      ? t("signal.day.today")
                      : group.separator.kind === "yesterday"
                        ? t("signal.day.yesterday")
                        : group.separator.label}
                  </span>
                </div>
              ) : null}
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
        ? <ServiceComposer key={thread.threadId} thread={thread} runtime={runtime} t={t} />
        : <SealedComposer runtime={runtime} t={t} />}
    </div>
  );
}

function EmptyConversation({ t }: { t: MessengerTranslate }) {
  return (
    <div
      className="flex h-full flex-col items-center justify-center gap-4 px-8 text-center text-foreground"
      style={{ backgroundImage: "radial-gradient(320px 240px at 50% 38%, color-mix(in oklab, var(--primary) 13%, transparent), transparent 72%)" }}
    >
      <div className="size-16">
        <img src="/app-icons/signal/icon-a.png" alt="" className="size-full object-contain" />
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
  returnFocus,
  t,
}: {
  src: string;
  onClose(): void;
  returnFocus: HTMLElement | null;
  t: MessengerTranslate;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  useEffect(() => {
    dialogRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopPropagation();
      onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      if (returnFocus?.isConnected) returnFocus.focus();
    };
  }, [onClose, returnFocus]);

  return (
    <div
      ref={dialogRef}
      className="absolute inset-0 z-20 flex items-center justify-center bg-black/70 p-6 outline-none"
      role="dialog"
      aria-modal="true"
      aria-label={t("signal.conversation.viewPhoto")}
      tabIndex={-1}
      onClick={onClose}
    >
      {failed ? (
        <div
          role="img"
          aria-label={t("signal.message.imagePreview")}
          className="flex min-h-40 min-w-56 flex-col items-center justify-center gap-2 rounded-lg bg-popover p-8 text-muted-foreground shadow-2xl"
          onClick={(event) => event.stopPropagation()}
        >
          <ImageOff className="size-8" />
          <span className="text-sm">{t("signal.message.imagePreview")}</span>
        </div>
      ) : (
        <img
          src={src}
          alt={t("signal.conversation.viewPhoto")}
          onError={() => setFailed(true)}
          className="max-h-full max-w-full rounded-lg object-contain shadow-2xl"
          onClick={(event) => event.stopPropagation()}
        />
      )}
    </div>
  );
}

export function MessengerScreen({ runtime, instanceId, setContentKey }: { runtime: MessengerScreenRuntime; instanceId?: string; setContentKey?: (instanceId: string, contentKey: string | null) => void }) {
  const t = runtime.translate ?? defaultTranslate;
  const [containerRef, width] = useContainerWidth();
  const [conversations, setConversations] = useState<SignalConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [retainedThreadId, setRetainedThreadId] = useState<string | null>(null);
  const [image, setImage] = useState<{ src: string; returnFocus: HTMLElement | null } | null>(null);
  const [ownedLocalReadFacts] = useState(() => createSignalLocalReadFactsStore());
  const localReadFactsStore = runtime.localReadFacts ?? ownedLocalReadFacts;
  const localReadFacts = useSyncExternalStore(
    localReadFactsStore.subscribe,
    localReadFactsStore.snapshot,
    localReadFactsStore.snapshot,
  );

  useEffect(() => {
    if (!instanceId) return;
    const photo = image ? (image.src.split("/").pop() ?? image.src).replace(/\.[^.]+$/, "").replaceAll(".", "-") : null;
    setContentKey?.(instanceId, selectedThreadId ? `signal:${selectedThreadId}${photo ? `.photo.${photo}` : ""}` : "signal:messenger");
    return () => setContentKey?.(instanceId, null);
  }, [instanceId, setContentKey, selectedThreadId, image]);

  const loadRevision = useRef(0);
  const load = useCallback(async () => {
    const revision = ++loadRevision.current;
    try {
      const next = await runtime.model.conversations();
      if (revision === loadRevision.current) setConversations(next);
    } catch (error) {
      console.warn("[Signal] Failed to load conversations", error);
    } finally {
      if (revision === loadRevision.current) setLoading(false);
    }
  }, [runtime.model]);

  useEffect(() => {
    void load();
    const unsubscribe = runtime.subscribe?.(() => void load());
    return () => { loadRevision.current++; unsubscribe?.(); };
  }, [load, runtime.subscribe]);

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

    if (view && view.pendingReadFacts.length > 0) {
      const pendingFacts = view.pendingReadFacts;
      void runtime.model.markThreadRead(threadId)
        .then(() => {
          localReadFactsStore.mark(pendingFacts);
        })
        .catch((error) => console.warn("[Signal] Failed to mark thread as read", error));
    }
  }, [runtime, selectedThreadId, views, localReadFactsStore]);

  useEffect(() => {
    const pending = runtime.getPendingFocusThreadId?.();
    if (!pending || loading) return;
    selectThread(pending);
    runtime.consumePendingFocusThreadId?.();
  }, [loading, runtime, selectThread]);

  const back = useCallback(() => setSelectedThreadId(null), []);
  const viewImage = useCallback((src: string) => {
    const active = document.activeElement;
    setImage({
      src,
      returnFocus: active instanceof HTMLElement ? active : null,
    });
  }, []);
  const closeImage = useCallback(() => setImage(null), []);

  if (width >= DESKTOP_BREAKPOINT) {
    return (
      <div ref={containerRef} className="relative flex h-full">
        <div className="shrink-0 border-r border-border/50" style={{ width: THREAD_LIST_WIDTH }}>
          <ThreadList views={views} selectedThreadId={selectedThreadId} loading={loading} onSelect={selectThread} t={t} />
        </div>
        <div className="min-w-0 flex-1">
          {selected
            ? <ConversationView conversation={selected} showBack={false} onBack={back} onViewImage={viewImage} runtime={runtime} t={t} />
            : <EmptyConversation t={t} />}
        </div>
        {image ? <ImageOverlay src={image.src} returnFocus={image.returnFocus} onClose={closeImage} t={t} /> : null}
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
            ? <ConversationView conversation={retained} showBack onBack={back} onViewImage={viewImage} runtime={runtime} t={t} />
            : null}
        </div>
      </div>
      {image ? <ImageOverlay src={image.src} returnFocus={image.returnFocus} onClose={closeImage} t={t} /> : null}
    </div>
  );
}
