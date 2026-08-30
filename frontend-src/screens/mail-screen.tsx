import {
  Archive,
  Check,
  Download,
  ImageIcon,
  Inbox,
  LoaderCircle,
  Mail,
  Send,
  SquarePen,
  X,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
} from "react";
import type {
  MailDownloadAttachment,
  MailImageAttachment,
  MailMessage,
  MailFolder,
} from "../apps/mail";
import type { MailAppModel } from "../apps/mail";
import { MarkdownBody } from "../components/markdown-body";

export type MailTranslate = (
  key: string,
  params?: Readonly<Record<string, string | number>>,
) => string;

export interface MailScreenRuntime {
  model: MailAppModel;
  translate?: MailTranslate;
  playCue?: (cue: string) => void;
  resolveMedia?: (mediaKey: string) => string | undefined;
  hasFact?: (factId: string) => boolean;
  attachmentDownloadDurationMs?: number;
  getPendingFocusEmailId?: () => string | null;
  consumePendingFocusEmailId?: () => void;
}

const STRINGS: Record<string, string> = {
  loading: "Loading…",
  "mail.compose": "Compose",
  "mail.inbox": "Inbox",
  "mail.sent": "Sent",
  "mail.archive": "Archive",
  "mail.empty": "No messages",
  "mail.selectEmail": "Select an email to read",
  "mail.attachments": "Attachments",
  "mail.downloaded": "Downloaded",
  "mail.newMessage": "New Message",
  "mail.networkError": "Network error: Unable to send message",
  "mail.to": "To",
  "mail.subject": "Subject",
  "mail.message": "Message",
  "mail.cancel": "Cancel",
  "mail.sending": "Sending…",
  "mail.send": "Send",
};

function defaultTranslate(
  key: string,
  params?: Readonly<Record<string, string | number>>,
): string {
  if (key === "mail.messageCount") {
    const count = Number(params?.count ?? 0);
    return `${count} message${count === 1 ? "" : "s"}`;
  }
  return STRINGS[key] ?? key;
}

function relativeDate(date: Date): string {
  const elapsed = Date.now() - date.getTime();
  if (!Number.isFinite(elapsed) || elapsed < 0) return date.toLocaleDateString();
  if (elapsed < 60_000) return "now";
  if (elapsed < 3_600_000) return `${Math.floor(elapsed / 60_000)}m`;
  if (elapsed < 86_400_000) return `${Math.floor(elapsed / 3_600_000)}h`;
  if (elapsed < 604_800_000) return `${Math.floor(elapsed / 86_400_000)}d`;
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

function formatBytes(bytes: number): string {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(
    units.length - 1,
    Math.max(0, Math.floor(Math.log(bytes) / Math.log(1024))),
  );
  return `${(bytes / 1024 ** index).toFixed(index ? 1 : 0)} ${units[index]}`;
}

interface SidebarButtonProps {
  icon: ComponentType<{ className?: string }>;
  label: string;
  active: boolean;
  badge?: number;
  onClick(): void;
}

function SidebarButton({ icon: Icon, label, active, badge, onClick }: SidebarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors ${
        active ? "bg-accent text-accent-foreground" : "hover:bg-accent/60"
      }`}
    >
      <Icon className="size-4 shrink-0" />
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {badge ? (
        <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] leading-none text-primary-foreground">
          {badge}
        </span>
      ) : null}
    </button>
  );
}

function MailRow({
  email,
  selected,
  read,
  onClick,
}: {
  email: MailMessage;
  selected: boolean;
  read: boolean;
  onClick(): void;
}) {
  const sender = email.self ? email.to : email.from.name;
  const preview = email.body.slice(0, 80).replace(/\n/g, " ");

  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative block w-full border-b px-4 py-3 text-left transition-colors hover:bg-accent/60 ${
        selected ? "bg-accent" : ""
      } ${read ? "" : "font-medium"}`}
    >
      <div className="mb-1 flex items-center gap-2">
        <span className="min-w-0 flex-1 truncate">{sender}</span>
        <span className="shrink-0 text-[11px] font-normal text-muted-foreground">
          {relativeDate(new Date(email.date))}
        </span>
      </div>
      <div className="truncate text-xs">{email.subject}</div>
      <div className="mt-1 truncate text-xs font-normal text-muted-foreground">{preview}</div>
      {!read ? <span className="absolute right-2 top-1/2 size-1.5 rounded-full bg-primary" /> : null}
    </button>
  );
}

function ImageAttachment({ attachment }: { attachment: MailImageAttachment }) {
  const [open, setOpen] = useState(false);
  const dimensions =
    attachment.width && attachment.height
      ? `${attachment.width} × ${attachment.height}`
      : undefined;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full overflow-hidden rounded-md border bg-muted/30 text-left hover:bg-muted/50"
      >
        <img src={attachment.src} alt={attachment.filename} className="max-h-48 w-full object-cover" />
        <div className="flex items-center gap-2 p-2 text-xs">
          <ImageIcon className="size-4 shrink-0" />
          <span className="min-w-0 flex-1 truncate">{attachment.filename}</span>
          {dimensions ? <span className="text-muted-foreground">{dimensions}</span> : null}
        </div>
      </button>
      {open ? (
        <div
          className="fixed inset-0 z-[100001] flex items-center justify-center bg-black/80 p-8"
          onClick={() => setOpen(false)}
        >
          <button
            type="button"
            aria-label="Close"
            onClick={() => setOpen(false)}
            className="absolute right-4 top-4 rounded-full bg-background/80 p-2 text-foreground"
          >
            <X className="size-5" />
          </button>
          <img
            src={attachment.src}
            alt={attachment.filename}
            className="max-h-full max-w-full object-contain"
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      ) : null}
    </>
  );
}

function DownloadAttachment({
  attachment,
  runtime,
  t,
}: {
  attachment: MailDownloadAttachment;
  runtime: MailScreenRuntime;
  t: MailTranslate;
}) {
  const [progress, setProgress] = useState(0);
  const [localDownloaded, setLocalDownloaded] = useState(false);
  const downloaded =
    localDownloaded ||
    (attachment.downloadFact ? runtime.hasFact?.(attachment.downloadFact) === true : false);
  const downloading = progress > 0 && progress < 100;
  const duration = runtime.attachmentDownloadDurationMs ?? 0;

  const download = async () => {
    if (downloaded || downloading) return;
    runtime.playCue?.("shell-file-download");
    setProgress(1);
    requestAnimationFrame(() => setProgress(100));
    try {
      if (attachment.downloadFact) {
        await runtime.model.emitDownloadFact(attachment.downloadFact);
        setLocalDownloaded(true);
      }
      window.setTimeout(() => setProgress(0), duration);
    } catch (error) {
      console.warn("[Mail] Failed to download attachment", error);
      setProgress(0);
    }
  };

  return (
    <button
      type="button"
      onClick={() => void download()}
      className="relative flex w-full items-center gap-3 overflow-hidden rounded-md border p-3 text-left hover:bg-muted/50"
      disabled={downloading}
    >
      <span className="relative z-10 flex size-8 shrink-0 items-center justify-center rounded bg-muted">
        {downloaded ? (
          <Check className="size-4" />
        ) : downloading ? (
          <LoaderCircle className="size-4 animate-spin" />
        ) : (
          <Download className="size-4" />
        )}
      </span>
      <span className="relative z-10 min-w-0 flex-1">
        <span className="block truncate text-sm">{attachment.filename}</span>
        <span className="block text-xs text-muted-foreground">
          {downloaded ? t("mail.downloaded") : formatBytes(attachment.sizeBytes)}
        </span>
      </span>
      {progress > 0 ? (
        <span
          className="absolute inset-y-0 left-0 bg-primary/10"
          style={{
            width: `${progress}%`,
            transitionProperty: "width",
            transitionDuration: `${duration}ms`,
            transitionTimingFunction: "ease-out",
          }}
        />
      ) : null}
    </button>
  );
}

function MailReader({
  email,
  runtime,
  t,
}: {
  email: MailMessage;
  runtime: MailScreenRuntime;
  t: MailTranslate;
}) {
  const body = email.body.startsWith("i18n:") ? t(email.body.slice(5)) : email.body;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-b px-6 py-4">
        <h2 className="text-lg font-semibold">{email.subject}</h2>
        <div className="mt-1 text-xs text-muted-foreground">
          From: {email.from.name} &lt;{email.from.email}&gt; · {new Date(email.date).toLocaleString()}
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-auto px-6 py-5">
        <div className="mx-auto max-w-[760px]">
          <MarkdownBody markdown={body} className="text-sm" />
          {email.attachments.length ? (
            <section className="mt-6 border-t pt-4">
              <h3 className="mb-3 text-sm font-semibold">{t("mail.attachments")}</h3>
              <div className="grid gap-2">
                {email.attachments.map((attachment) =>
                  attachment.kind === "image" ? (
                    <ImageAttachment key={attachment.id} attachment={attachment} />
                  ) : (
                    <DownloadAttachment
                      key={attachment.id}
                      attachment={attachment}
                      runtime={runtime}
                      t={t}
                    />
                  ),
                )}
              </div>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function EmptySelection({ runtime, t }: { runtime: MailScreenRuntime; t: MailTranslate }) {
  const source = runtime.resolveMedia?.("mail.select");
  return (
    <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
      {source ? (
        <img src={source} alt="" aria-hidden="true" className="mb-4 h-48 w-48 object-contain opacity-65" />
      ) : (
        <div data-fallback-for="mail.select" className="mb-4 h-48 w-48" />
      )}
      <p>{t("mail.selectEmail")}</p>
    </div>
  );
}

function ComposeDialog({
  runtime,
  t,
  onClose,
}: {
  runtime: MailScreenRuntime;
  t: MailTranslate;
  onClose(): void;
}) {
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string>();

  const send = () => {
    if (sending) return;
    setSending(true);
    setError(undefined);
    runtime.playCue?.("mail-sending");
    window.setTimeout(() => {
      setSending(false);
      runtime.playCue?.("mail-send-failed");
      setError(t("mail.networkError"));
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="relative flex max-h-[80vh] w-[520px] max-w-full flex-col rounded-lg border bg-background shadow-2xl">
        <div className="flex items-center border-b px-4 py-3">
          <h2 className="font-semibold">{t("mail.newMessage")}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="ml-auto p-1">
            <X className="size-4" />
          </button>
        </div>
        <div className="space-y-3 overflow-auto p-4">
          <label className="block text-xs font-medium">
            {t("mail.to")}
            <input className="mt-1 w-full rounded-md border bg-background px-3 py-2 font-normal" />
          </label>
          <label className="block text-xs font-medium">
            {t("mail.subject")}
            <input className="mt-1 w-full rounded-md border bg-background px-3 py-2 font-normal" />
          </label>
          <label className="block text-xs font-medium">
            {t("mail.message")}
            <textarea rows={8} className="mt-1 w-full resize-none rounded-md border bg-background px-3 py-2 font-normal" />
          </label>
          {error ? <p className="text-xs text-destructive">{error}</p> : null}
        </div>
        <div className="flex justify-end gap-2 border-t px-4 py-3">
          <button type="button" onClick={onClose} className="rounded-md border px-3 py-1.5 text-sm">
            {t("mail.cancel")}
          </button>
          <button
            type="button"
            onClick={send}
            disabled={sending}
            className="rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground disabled:opacity-60"
          >
            {sending ? t("mail.sending") : t("mail.send")}
          </button>
        </div>
      </div>
    </div>
  );
}

export function MailScreen({ runtime }: { runtime: MailScreenRuntime }) {
  const t = runtime.translate ?? defaultTranslate;
  const [folder, setFolder] = useState<MailFolder>("inbox");
  const [selectedId, setSelectedId] = useState<string>();
  const [compose, setCompose] = useState(false);
  const [messages, setMessages] = useState<MailMessage[]>([]);
  const [localRead, setLocalRead] = useState<Set<string>>(() => new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>();
  const firstLaunchCuePlayed = useRef(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(undefined);
    try {
      const next = await runtime.model.messages();
      setMessages(next);
      setLocalRead((current) => {
        const copy = new Set(current);
        for (const mail of next) if (mail.read) copy.add(mail.id);
        return copy;
      });
    } catch (loadError) {
      setError(loadError);
    } finally {
      setLoading(false);
    }
  }, [runtime.model]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (loading) return;
    if (!messages.length && !firstLaunchCuePlayed.current) {
      firstLaunchCuePlayed.current = true;
      runtime.playCue?.("shell-mail-first-launch");
    }
    runtime.playCue?.("shell-mail-threads-reveal");
    return () => runtime.playCue?.("shell-mail-threads-hide");
  }, [loading, messages.length, runtime]);

  const markRead = useCallback(
    async (mail: MailMessage) => {
      if (mail.read || localRead.has(mail.id)) return;
      try {
        await runtime.model.markRead(mail.id);
        setLocalRead((current) => new Set(current).add(mail.id));
      } catch (readError) {
        console.warn("[Mail] Failed to mark mail as read", readError);
      }
    },
    [localRead, runtime.model],
  );

  useEffect(() => {
    if (loading || !runtime.getPendingFocusEmailId) return;
    const pendingId = runtime.getPendingFocusEmailId();
    if (!pendingId) return;
    const mail = messages.find((candidate) => candidate.id === pendingId);
    if (!mail) {
      runtime.consumePendingFocusEmailId?.();
      return;
    }
    setFolder(mail.folder);
    setSelectedId(mail.id);
    void markRead(mail).finally(() => runtime.consumePendingFocusEmailId?.());
  }, [loading, markRead, messages, runtime]);

  const visible = useMemo(
    () => messages.filter((mail) => mail.folder === folder),
    [folder, messages],
  );
  const selected = messages.find((mail) => mail.id === selectedId);
  const unreadInbox = messages.filter(
    (mail) => mail.folder === "inbox" && !mail.read && !localRead.has(mail.id),
  ).length;

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-background text-muted-foreground">
        {t("loading")}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 bg-background p-6 text-center">
        <Mail className="size-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Unable to load mail.</p>
        <button type="button" onClick={() => void load()} className="rounded-md border px-3 py-1.5 text-sm">
          Retry
        </button>
      </div>
    );
  }

  const selectFolder = (next: MailFolder) => {
    setFolder(next);
    setSelectedId(undefined);
  };

  return (
    <div className="flex h-full w-full bg-background text-sm">
      <aside className="flex w-44 shrink-0 flex-col border-r bg-muted/30">
        <div className="border-b p-3">
          <button
            type="button"
            onClick={() => setCompose(true)}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-3 py-2 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <SquarePen className="size-4" />
            {t("mail.compose")}
          </button>
        </div>
        <div className="flex-1 py-2">
          <SidebarButton icon={Inbox} label={t("mail.inbox")} active={folder === "inbox"} badge={unreadInbox || undefined} onClick={() => selectFolder("inbox")} />
          <SidebarButton icon={Send} label={t("mail.sent")} active={folder === "sent"} onClick={() => selectFolder("sent")} />
          <SidebarButton icon={Archive} label={t("mail.archive")} active={folder === "archive"} onClick={() => selectFolder("archive")} />
        </div>
      </aside>

      <section className="flex w-72 shrink-0 flex-col border-r">
        <div className="flex h-12 items-center border-b px-4 font-semibold">
          {folder === "inbox" ? t("mail.inbox") : folder === "sent" ? t("mail.sent") : t("mail.archive")}
          <span className="ml-2 text-xs font-normal text-muted-foreground">
            {t("mail.messageCount", { count: visible.length })}
          </span>
        </div>
        <div className="min-h-0 flex-1 overflow-auto">
          {visible.length ? (
            visible.map((email) => (
              <MailRow
                key={email.id}
                email={email}
                selected={selectedId === email.id}
                read={email.read || localRead.has(email.id)}
                onClick={() => {
                  runtime.playCue?.("shell-mail-row-select");
                  setSelectedId(email.id);
                  void markRead(email);
                }}
              />
            ))
          ) : (
            <div className="flex h-32 flex-col items-center justify-center text-muted-foreground/60">
              <Mail className="mb-2 size-8" />
              <p className="text-xs">{t("mail.empty")}</p>
            </div>
          )}
        </div>
      </section>

      <main className="min-w-0 flex-1">
        {selected ? <MailReader email={selected} runtime={runtime} t={t} /> : <EmptySelection runtime={runtime} t={t} />}
      </main>

      {compose ? <ComposeDialog runtime={runtime} t={t} onClose={() => setCompose(false)} /> : null}
    </div>
  );
}
