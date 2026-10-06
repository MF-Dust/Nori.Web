import type { JsonValue } from "../runtime/protocol";
import type { ArtifactService } from "../services/artifacts";
import type { ManifoldService } from "../services/manifold";
import {
  parseSignalTimestamp,
  signalStoryDate,
  signalStoryTimestampFromEpoch,
} from "./signal-story-clock";

export type MailFolder = "inbox" | "sent" | "archive";

export interface MailSender {
  name: string;
  email: string;
}

export interface MailImageAttachment {
  id: string;
  kind: "image";
  filename: string;
  src: string;
  width?: number;
  height?: number;
}

export interface MailDownloadAttachment {
  id: string;
  kind: "download";
  filename: string;
  sizeBytes: number;
  downloadFact?: string;
}

export type MailAttachment = MailImageAttachment | MailDownloadAttachment;

export interface MailMessage {
  id: string;
  folder: MailFolder;
  from: MailSender;
  to: string;
  subject: string;
  body: string;
  date: string;
  self: boolean;
  read: boolean;
  readFact?: string;
  attachments: MailAttachment[];
  raw: Readonly<Record<string, JsonValue>>;
}

function record(value: JsonValue | undefined): Record<string, JsonValue> | undefined {
  if (!value || Array.isArray(value) || typeof value !== "object") return undefined;
  return value;
}

function stringValue(value: JsonValue | undefined, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function numberValue(value: JsonValue | undefined): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function booleanValue(value: JsonValue | undefined): boolean {
  return value === true;
}

function normalizeFolder(value: JsonValue | undefined): MailFolder {
  return value === "sent" || value === "archive" ? value : "inbox";
}

function normalizeSender(value: JsonValue | undefined): MailSender {
  const sender = record(value);
  if (sender) {
    const email = stringValue(sender.email);
    return {
      name: stringValue(sender.name, email),
      email,
    };
  }

  const plain = stringValue(value);
  const match = /^(.*?)\s*<([^>]+)>$/.exec(plain);
  return match
    ? { name: match[1].trim() || match[2], email: match[2] }
    : { name: plain, email: plain };
}

function normalizeAttachment(value: JsonValue, mailId: string, index: number): MailAttachment | undefined {
  const item = record(value);
  if (!item) return undefined;

  const id = stringValue(item.id, `${mailId}:${index}`);
  const filename = stringValue(item.filename, stringValue(item.name, id));

  // Shipped attachments are images unless explicitly tagged as downloads.
  if (item.kind !== "download") {
    const src = stringValue(item.asset_path, stringValue(item.src, stringValue(item.url)));
    if (!src) return undefined;
    const dimensions = record(item.dimensions);
    return {
      id,
      kind: "image",
      filename,
      src,
      width: numberValue(dimensions?.width) ?? numberValue(item.width),
      height: numberValue(dimensions?.height) ?? numberValue(item.height),
    };
  }

  const downloadFact = stringValue(
    item.downloadFact,
    stringValue(item.download_fact),
  );
  return {
    id,
    kind: "download",
    filename,
    sizeBytes:
      numberValue(item.sizeBytes) ??
      numberValue(item.size_bytes) ??
      numberValue(item.size) ??
      0,
    downloadFact: downloadFact || undefined,
  };
}

/** Shipped read state ignores a raw `read` flag: only read facts/local acknowledgements matter. */
export function isMailRead(
  mail: Pick<MailMessage, "id" | "readFact">,
  hasFact?: (factId: string) => boolean,
  localRead?: ReadonlySet<string>,
): boolean {
  return mail.readFact === undefined || localRead?.has(mail.id) === true || hasFact?.(mail.readFact) === true;
}

function dateMilliseconds(value: string): number {
  const milliseconds = parseSignalTimestamp(value).getTime();
  return Number.isNaN(milliseconds) ? 0 : milliseconds;
}

export function formatMailListDate(value: string, now = signalStoryDate()): string {
  const date = parseSignalTimestamp(value);
  if (Number.isNaN(date.getTime())) return "";
  const days = Math.floor((now.getTime() - date.getTime()) / 86_400_000);
  return days === 0
    ? date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })
    : days < 7
      ? date.toLocaleDateString(undefined, { weekday: "short" })
      : date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function formatMailReaderDate(value: string, locale = "en"): string {
  const date = parseSignalTimestamp(value);
  if (Number.isNaN(date.getTime())) return "";
  const calendar = date.toLocaleDateString(locale, { month: "long", day: "numeric", weekday: "long" });
  const time = date.toLocaleTimeString(locale, {
    hour: "numeric", minute: "2-digit", hour12: locale.startsWith("en"),
  });
  return `${calendar}, ${time}`;
}

function normalizeMail(
  id: string,
  raw: Record<string, JsonValue>,
  surfacedAt: number,
  hasFact?: (factId: string) => boolean,
): MailMessage {
  const attachments = Array.isArray(raw.attachments)
    ? raw.attachments
        .map((attachment, index) => normalizeAttachment(attachment, id, index))
        .filter((attachment): attachment is MailAttachment => attachment !== undefined)
    : [];
  const readFact = stringValue(raw.readFact, stringValue(raw.read_fact));

  return {
    id,
    folder: normalizeFolder(raw.folder),
    from: normalizeSender(raw.from),
    to: stringValue(raw.to, "我 <me@manifold.institute>"),
    subject: stringValue(raw.subject),
    body: stringValue(raw.body, stringValue(raw.body_md)),
    date: stringValue(raw.date, signalStoryTimestampFromEpoch(surfacedAt > 0 ? surfacedAt : Date.now())),
    self: booleanValue(raw.self),
    read: isMailRead({ id, readFact: readFact || undefined }, hasFact),
    readFact: readFact || undefined,
    attachments,
    raw,
  };
}

/** Source-side model for the shipped MailScreen contract. */
export class MailAppModel {
  constructor(
    private readonly artifacts: ArtifactService,
    private readonly manifold: ManifoldService,
  ) {}

  async messages(hasFact?: (factId: string) => boolean): Promise<MailMessage[]> {
    const items = await this.artifacts.mail<Record<string, JsonValue>>();
    return items
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => item.type === "mail")
      .map(({ item, index }) => ({
        mail: normalizeMail(item.id, item.data, item.surfacedAt ?? 0, hasFact),
        surfacedAt: item.surfacedAt ?? 0,
        index,
      }))
      .sort((a, b) =>
        b.surfacedAt - a.surfacedAt ||
        dateMilliseconds(b.mail.date) - dateMilliseconds(a.mail.date) ||
        b.index - a.index,
      )
      .map(({ mail }) => mail);
  }

  async inbox(): Promise<MailMessage[]> {
    return (await this.messages()).filter((mail) => mail.folder !== "sent");
  }

  /** Shipped MailScreen sends manifold command `mail.read` with only mailId. */
  async markRead(mail: MailMessage | string): Promise<void> {
    const mailId = typeof mail === "string" ? mail : mail.id;
    await this.manifold.commandResult("mail.read", { mailId });
  }

  /** Download-type attachments reveal their local file by emitting a fact. */
  async emitDownloadFact(factId: string): Promise<void> {
    await this.manifold.commandResult("client.emitFact", { factId });
  }
}
