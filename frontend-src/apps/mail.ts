import type { JsonValue } from "../runtime/protocol";
import type { ArtifactService } from "../services/artifacts";
import type { ManifoldService } from "../services/manifold";

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
  return { name: plain, email: plain };
}

function normalizeAttachment(value: JsonValue, index: number): MailAttachment | undefined {
  const item = record(value);
  if (!item) return undefined;

  const id = stringValue(item.id, `attachment-${index}`);
  const filename = stringValue(item.filename, stringValue(item.name, id));
  const kind = stringValue(item.kind);

  if (kind === "image") {
    const src = stringValue(item.src, stringValue(item.url));
    if (!src) return undefined;
    return {
      id,
      kind: "image",
      filename,
      src,
      width: numberValue(item.width),
      height: numberValue(item.height),
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

function normalizeMail(id: string, raw: Record<string, JsonValue>): MailMessage {
  const attachments = Array.isArray(raw.attachments)
    ? raw.attachments
        .map((attachment, index) => normalizeAttachment(attachment, index))
        .filter((attachment): attachment is MailAttachment => attachment !== undefined)
    : [];
  const readFact = stringValue(raw.readFact, stringValue(raw.read_fact));

  return {
    id,
    folder: normalizeFolder(raw.folder),
    from: normalizeSender(raw.from),
    to: stringValue(raw.to),
    subject: stringValue(raw.subject),
    body: stringValue(raw.body, stringValue(raw.body_md)),
    date: stringValue(raw.date),
    self: booleanValue(raw.self),
    read: booleanValue(raw.read),
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

  async messages(): Promise<MailMessage[]> {
    const items = await this.artifacts.mail<Record<string, JsonValue>>();
    return items
      .filter((item) => item.type === "mail")
      .map((item) => normalizeMail(item.id, item.data))
      .sort((a, b) => b.date.localeCompare(a.date));
  }

  async inbox(): Promise<MailMessage[]> {
    return (await this.messages()).filter((mail) => mail.folder !== "sent");
  }

  /** Shipped MailScreen sends manifold command `mail.read` with only mailId. */
  async markRead(mail: MailMessage | string): Promise<void> {
    const mailId = typeof mail === "string" ? mail : mail.id;
    await this.manifold.command("mail.read", { mailId });
  }

  /** Download-type attachments reveal their local file by emitting a fact. */
  async emitDownloadFact(factId: string): Promise<void> {
    await this.manifold.command("client.emitFact", { factId });
  }
}
