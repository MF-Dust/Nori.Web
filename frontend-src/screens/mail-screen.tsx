import {
  Archive,
  Check,
  CloudOff,
  Download,
  Inbox,
  LoaderCircle,
  Mail,
  Paperclip,
  Send,
  SquarePen,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  formatMailListDate,
  formatMailReaderDate,
  isMailRead,
  type MailAppModel,
  type MailDownloadAttachment,
  type MailImageAttachment,
  type MailMessage,
  type MailFolder,
} from "../apps/mail";
import { MarkdownBody } from "../components/markdown-body";
import { SidebarNavButton } from "../components/sidebar-nav-button";
import { VaultSheet } from "../components/vault-sheet";
import { createSourceTranslate } from "../i18n/translate";

export type MailTranslate = (
  key: string,
  params?: Readonly<Record<string, string | number>>,
) => string;

export interface MailScreenRuntime {
  model: MailAppModel;
  subscribe?: (listener: () => void) => () => void;
  setContentKey?: (instanceId: string, contentKey: string | null) => void;
  translate?: MailTranslate;
  locale?: () => string;
  playCue?: (cue: string) => void;
  hasFact?: (factId: string) => boolean;
  attachmentDownloadDurationMs?: number;
  getPendingFocusEmailId?: () => string | null;
  consumePendingFocusEmailId?: () => void;
  /** Re-run pending focus when a notification targets an already open Mail window. */
  subscribePendingFocus?: (listener: () => void) => () => void;
  /** Shipped `yY.markReadLocal`: lets the desktop drop this mail's arrival toast. */
  onMailRead?: (mailId: string) => void;
  /** Shipped downloads `n(factId, false)` after an attachment download fact is emitted. */
  onDownloaded?: (factId: string, already: boolean) => void;
}

const FOLDERS = ["inbox", "sent", "archive"] as const;
const FOLDER_ICONS = { inbox: Inbox, sent: Send, archive: Archive };
const EMPTY_FOLDER_KEYS = {
  inbox: "mail.emptyInbox", sent: "mail.emptySent", archive: "mail.emptyArchive",
};

function mailText(value: string, t: MailTranslate): string {
  return value.startsWith("mail.") ? t(value) : value.startsWith("i18n:") ? t(value.slice(5)) : value;
}

function formatBytes(bytes: number): string {
  if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(1)} MB`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${bytes} B`;
}

export function MailRow({
  email,
  selected,
  onSelect,
  playCue,
  t,
}: {
  email: MailMessage;
  selected: boolean;
  onSelect(id: string): void;
  playCue?: (cue: string) => void;
  t: MailTranslate;
}) {
  const sender = email.self ? `${t("mail.to")}: ${email.to}` : email.from.name;
  const address = email.self ? "" : email.from.email;
  const state = selected
    ? "border-l-primary bg-primary/[0.12] hover:bg-primary/[0.18] active:bg-primary/[0.24]"
    : email.read
      ? "hover:bg-muted/40 active:bg-muted/60"
      : "bg-foreground/[0.035] hover:bg-muted/40 active:bg-muted/60";

  return (
    <button
      type="button"
      onClick={() => {
        if (!selected) playCue?.("comms-mail-open-email");
        onSelect(email.id);
      }}
      aria-current={selected ? "true" : undefined}
      className={`w-full text-left px-3 py-2.5 border-b border-border/50 border-l-2 border-l-transparent transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/60 ${state}`}
    >
      <div className="flex items-start gap-2">
        <div className="mt-1.5 shrink-0 size-2">
          {!email.read ? <div className="size-2 rounded-full bg-primary" /> : null}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className={`text-sm truncate text-foreground ${email.read ? "font-normal" : "font-semibold"}`}>{sender}</span>
            <span className={`flex items-center gap-1 text-[11px] shrink-0 ${selected ? "text-foreground/70" : "text-muted-foreground"}`}>
              {email.attachments.length > 0 ? <Paperclip className="size-3" /> : null}
              {formatMailListDate(email.date)}
            </span>
          </div>
          <div className={`text-sm truncate mt-0.5 ${email.read ? selected ? "text-foreground/80" : "text-muted-foreground" : "font-medium text-foreground"}`}>
            {mailText(email.subject, t)}
          </div>
          {address ? <div className="text-xs text-muted-foreground truncate mt-0.5 opacity-70">{address}</div> : null}
        </div>
      </div>
    </button>
  );
}

function ImageAttachment({ attachment }: { attachment: MailImageAttachment }) {
  return (
    <figure className="m-0">
      <img
        src={attachment.src}
        alt=""
        width={attachment.width}
        height={attachment.height}
        className="max-w-full h-auto rounded-md border border-border"
      />
      <figcaption className="text-xs text-muted-foreground mt-1.5">{attachment.filename}</figcaption>
    </figure>
  );
}

/** The shipped progress timer owns the fact emission; leaving the reader cancels it. */
export function scheduleMailDownload(
  runtime: Pick<MailScreenRuntime, "model" | "attachmentDownloadDurationMs" | "onDownloaded">,
  factId: string,
  onComplete: () => void,
  onError: (error: unknown) => void,
): () => void {
  const timer = setTimeout(() => {
    void runtime.model.emitDownloadFact(factId).then(() => {
      runtime.onDownloaded?.(factId, false);
      onComplete();
    }).catch(onError);
  }, runtime.attachmentDownloadDurationMs ?? 1800);
  return () => clearTimeout(timer);
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
  const [downloading, setDownloading] = useState(false);
  const [localDownloaded, setLocalDownloaded] = useState(false);
  const downloaded = localDownloaded || !!(attachment.downloadFact && runtime.hasFact?.(attachment.downloadFact));
  const duration = runtime.attachmentDownloadDurationMs ?? 1800;

  useEffect(() => {
    if (!downloading || !attachment.downloadFact) return;
    const frame = requestAnimationFrame(() => setProgress(100));
    const cancel = scheduleMailDownload(runtime, attachment.downloadFact, () => {
      setLocalDownloaded(true);
      setDownloading(false);
    }, (error) => {
      console.error("[Mail] Attachment download emit failed", error);
      setDownloading(false);
      setProgress(0);
    });
    return () => { cancelAnimationFrame(frame); cancel(); };
  }, [downloading, attachment.downloadFact, runtime]);

  return (
    <div className="flex items-center gap-3 rounded-md border border-border bg-muted/30 px-3 py-2.5">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <Download className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm text-foreground">{attachment.filename}</div>
        <div className="text-xs text-muted-foreground">{downloading ? t("mail.downloading") : formatBytes(attachment.sizeBytes)}</div>
      </div>
      {downloaded ? (
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground">
          <Check className="size-3.5" />{t("mail.downloaded")}
        </span>
      ) : downloading ? (
        <div className="h-1.5 w-28 shrink-0 overflow-hidden rounded-full bg-muted" role="progressbar" aria-label={t("mail.downloading")}>
          <div className="h-full rounded-full bg-primary" style={{
            width: `${progress}%`, transitionProperty: "width", transitionDuration: `${duration}ms`, transitionTimingFunction: "linear",
          }} />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => {
            if (!attachment.downloadFact) return;
            setProgress(0);
            setDownloading(true);
          }}
          className="inline-flex shrink-0 items-center rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >{t("mail.download")}</button>
      )}
    </div>
  );
}

export function MailReader({
  email,
  runtime,
  t,
}: {
  email: MailMessage;
  runtime: MailScreenRuntime;
  t: MailTranslate;
}) {
  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-auto">
        <div className="max-w-3xl mx-auto p-6">
          <h1 className="text-xl font-semibold text-foreground mb-4">{mailText(email.subject, t)}</h1>
          <div className="flex items-start gap-3 mb-6">
            <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium shrink-0" aria-hidden="true">
              {email.from.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="font-medium text-foreground">{email.from.name}</span>
                {!email.self ? <span className="text-sm text-muted-foreground">&lt;{email.from.email}&gt;</span> : null}
              </div>
              <div className="text-sm text-muted-foreground mt-0.5">{t("mail.to")}: {email.to}</div>
              <div className="text-xs text-muted-foreground mt-1">{formatMailReaderDate(email.date, runtime.locale?.())}</div>
            </div>
          </div>
          <hr className="border-border mb-6" />
          <MarkdownBody
            markdown={mailText(email.body, t)}
            className="prose prose-sm dark:prose-invert max-w-none select-text text-sm text-foreground leading-relaxed"
          />
          {email.attachments.length > 0 ? (
            <section className="mt-8 select-text">
              <hr className="border-border mb-4" />
              <h2 className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-3">
                <Paperclip className="size-3.5" />{t("mail.attachments")} ({email.attachments.length})
              </h2>
              <div className="flex flex-col gap-3">
                {email.attachments.map((attachment) => attachment.kind === "download" ? (
                  <DownloadAttachment key={attachment.id} attachment={attachment} runtime={runtime} t={t} />
                ) : <ImageAttachment key={attachment.id} attachment={attachment} />)}
              </div>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function EmptySelection({ t }: { t: MailTranslate }) {
  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-center">
        <div className="size-16 rounded-full bg-muted/30 flex items-center justify-center mx-auto mb-4">
          <Mail className="size-8 text-muted-foreground/50" strokeWidth={1.5} />
        </div>
        <p className="text-muted-foreground">{t("mail.noEmailSelected")}</p>
      </div>
    </div>
  );
}

export function MailComposeRefusal({ t, onClose }: { t: MailTranslate; onClose(): void }) {
  return (
    <VaultSheet className="pt-10" onClose={onClose} onEnter={onClose} sfx={false} label={t("mail.networkError.title")}>
      <div className="flex items-start gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted/50 text-muted-foreground">
          <CloudOff className="size-[18px]" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold leading-snug text-foreground">{t("mail.networkError.title")}</h2>
          <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">{t("mail.networkError.body")}</p>
        </div>
      </div>
      <div className="mt-5 flex justify-end">
        <button type="button" autoFocus onClick={onClose} className="rounded-lg bg-muted/60 px-4 py-1.5 text-[13px] font-medium text-foreground transition-colors hover:bg-muted">
          {t("mail.networkError.dismiss")}
        </button>
      </div>
    </VaultSheet>
  );
}

export function MailScreen({ runtime, instanceId }: { runtime: MailScreenRuntime; instanceId?: string }) {
  const t = runtime.translate ?? createSourceTranslate(runtime.locale?.() ?? "en");
  const [folder, setFolder] = useState<MailFolder>("inbox");
  const [selectedId, setSelectedId] = useState<string>();
  const [compose, setCompose] = useState(false);
  const [messages, setMessages] = useState<MailMessage[]>([]);
  const [localRead, setLocalRead] = useState<Set<string>>(() => new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>();
  const loadRevision = useRef(0);
  const load = useCallback(async () => {
    const revision = ++loadRevision.current;
    setError(undefined);
    try {
      const next = await runtime.model.messages(runtime.hasFact);
      if (revision === loadRevision.current) setMessages(next);
    } catch (loadError) {
      if (revision === loadRevision.current) setError(loadError);
    } finally {
      if (revision === loadRevision.current) setLoading(false);
    }
  }, [runtime.model, runtime.hasFact]);

  useEffect(() => {
    void load();
    const unsubscribe = runtime.subscribe?.(() => void load());
    return () => { loadRevision.current++; unsubscribe?.(); };
  }, [load, runtime.subscribe]);

  const markRead = useCallback(async (mail: MailMessage) => {
    if (isMailRead(mail, runtime.hasFact, localRead)) return;
    try {
      await runtime.model.markRead(mail.id);
      setLocalRead((current) => new Set(current).add(mail.id));
      runtime.onMailRead?.(mail.id);
    } catch (readError) {
      console.warn("[Mail] Failed to mark mail as read", readError);
    }
  }, [localRead, runtime]);

  const [pendingFocusRevision, setPendingFocusRevision] = useState(0);
  useEffect(
    () => runtime.subscribePendingFocus?.(() => setPendingFocusRevision((value) => value + 1)),
    [runtime],
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
  }, [loading, markRead, messages, runtime, pendingFocusRevision]);

  const emails = useMemo(
    () => messages.map((mail) => ({ ...mail, read: isMailRead(mail, runtime.hasFact, localRead) })),
    [messages, localRead, runtime.hasFact],
  );
  const visible = emails.filter((mail) => mail.folder === folder);
  const selected = emails.find((mail) => mail.id === selectedId);
  const unreadInbox = emails.filter((mail) => mail.folder === "inbox" && !mail.read).length;
  useEffect(() => {
    if (!instanceId) return;
    runtime.setContentKey?.(instanceId, selectedId ? `mail:${selectedId}` : "mail:inbox");
    return () => runtime.setContentKey?.(instanceId, null);
  }, [instanceId, selectedId, runtime.setContentKey]);

  const selectFolder = (next: MailFolder) => {
    setFolder(next);
    if (selected && selected.folder !== next) setSelectedId(undefined);
  };

  return (
    <div className="h-full flex relative overflow-hidden bg-background text-foreground">
      <aside className="w-64 shrink-0">
        <div className="h-full flex flex-col bg-muted/20 border-r border-border/50">
          <div className="flex items-center justify-between px-3 h-11 shrink-0 border-b border-border/50">
            <span className="text-sm font-medium text-foreground">{t(`mail.${folder}`)}</span>
            <button
              type="button"
              title={t("mail.compose")}
              aria-label={t("mail.compose")}
              onClick={() => { runtime.playCue?.("comms-mail-compose-refused"); setCompose(true); }}
              className="p-1.5 rounded-md text-muted-foreground transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/60 hover:bg-muted/60 hover:text-foreground active:bg-muted/80"
            ><SquarePen className="size-4" /></button>
          </div>
          <nav className="px-2 py-2">
            {FOLDERS.map((next) => (
              <SidebarNavButton
                key={next}
                icon={FOLDER_ICONS[next]}
                label={t(`mail.${next}`)}
                count={emails.filter((mail) => mail.folder === next).length || undefined}
                active={folder === next}
                badgeVariant={next === "inbox" && unreadInbox > 0 ? "primary" : "muted"}
                onClick={() => selectFolder(next)}
                playSelectSound={() => runtime.playCue?.("primitives-nav-select")}
              />
            ))}
          </nav>
          <div className="flex-1 overflow-auto border-t border-border/50">
            {loading && !visible.length ? (
              <div className="h-full flex items-center justify-center" role="status" aria-label={t("mail.loading")}>
                <LoaderCircle className="size-5 text-muted-foreground animate-spin" />
              </div>
            ) : error ? (
              <div className="p-4 text-center text-sm text-muted-foreground" role="alert">
                <p>Unable to load mail.</p>
                <button type="button" onClick={() => void load()} className="mt-3 rounded-md border px-3 py-1.5">Retry</button>
              </div>
            ) : !visible.length ? (
              <p className="p-4 text-center text-sm text-muted-foreground">{t(EMPTY_FOLDER_KEYS[folder])}</p>
            ) : visible.map((email) => (
              <MailRow key={email.id} email={email} selected={selectedId === email.id} t={t} playCue={runtime.playCue} onSelect={() => {
                setSelectedId(email.id);
                void markRead(email);
              }} />
            ))}
          </div>
        </div>
      </aside>
      <main className="flex-1 min-w-0">
        {selected ? <MailReader key={selected.id} email={selected} runtime={runtime} t={t} /> : <EmptySelection t={t} />}
      </main>
      {compose ? <MailComposeRefusal t={t} onClose={() => setCompose(false)} /> : null}
    </div>
  );
}
