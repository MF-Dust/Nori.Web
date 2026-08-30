import type { Artifact, ArtifactService } from "../services/artifacts";
import type { ManifoldService } from "../services/manifold";
import type { JsonValue } from "../runtime/protocol";

export const FILES_COLD_VOLUME_PATH = "RSRCH-COLD-VOL";
export const FILES_DEFAULT_FOLDERS = ["下载", "文稿", "图片", "桌面"] as const;

export interface FileData extends Record<string, JsonValue | undefined> {
  display_path: string;
  mime: string;
  folder?: string;
  modified_at?: string;
  size_bytes?: number;
  body_md?: string;
  asset_path?: string;
  binary_asset_path?: string;
  alt?: string;
  dimensions?: JsonValue;
  trainlog?: JsonValue;
  cipher?: string;
  threshold?: number;
  recover_when?: string;
  tier_order?: number;
  launch?: string;
  read_fact?: string;
  open_emits_fact?: string;
  open_sentinel_fact?: string;
  corrupted?: boolean;
}

export interface FilesVaultData extends Record<string, JsonValue | undefined> {
  app_kind: "password_prompt" | string;
  command: string;
  puzzle_id: string;
  vault_path: string;
  title?: string;
  vault_kind?: "file" | "folder" | string;
  unlocked_when?: string;
  unpack_to?: string;
  placeholder?: string;
  hint?: string;
}

export type FileArtifact = Artifact<FileData>;
export type FilesVaultArtifact = Artifact<FilesVaultData>;
export type FilesRecoveredKind = "pdf" | "training-log" | "image" | "text";

export interface FilesRecoveredBase {
  id: string;
  name: string;
  folderPath: string;
  kind: FilesRecoveredKind;
  modifiedAt: string;
  sortMs?: number;
  sizeBytes: number;
  cipher?: string;
  threshold?: number;
  recoverWhen?: string;
  tierOrder?: number;
  launch?: string;
  readFact?: string;
  openEmitsFact?: string;
  openSentinelFact?: string;
  corrupted?: boolean;
}

export interface FilesRecoveredPdf extends FilesRecoveredBase {
  kind: "pdf";
  pdfSrc: string;
}

export interface FilesRecoveredImage extends FilesRecoveredBase {
  kind: "image";
  imageSrc: string;
  alt: string;
  dimensions?: { width?: number; height?: number };
}

export interface FilesRecoveredTrainingLog extends FilesRecoveredBase {
  kind: "training-log";
  phase?: JsonValue;
  seq?: JsonValue;
  items: JsonValue[];
}

export interface FilesRecoveredText extends FilesRecoveredBase {
  kind: "text";
  content: string;
  lineCount: number;
}

export type FilesRecoveredFile =
  | FilesRecoveredPdf
  | FilesRecoveredImage
  | FilesRecoveredTrainingLog
  | FilesRecoveredText;

export interface FilesVault {
  id: string;
  title: string;
  command: string;
  puzzleId: string;
  vaultPath: string;
  vaultKind: "file" | "folder" | string;
  unlockedFact?: string;
  unpackTo?: string;
  placeholder?: string;
  hint?: string;
}

export interface FilesPresentationSnapshot {
  files: FilesRecoveredFile[];
  vaults: FilesVault[];
}

function isRecord(value: JsonValue | undefined): value is Record<string, JsonValue> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizePath(value: string | undefined): string {
  return value
    ? value.split("/").map((part) => part.trim()).filter(Boolean).join("/")
    : "";
}

function basename(value: string): string {
  return value.split("/").filter(Boolean).at(-1) || value;
}

function defaultFolderForMime(mime: string): string {
  return mime.startsWith("image/") ? "图片" : "文稿";
}

function storyTimestamp(milliseconds: number): string {
  const source = new Date(milliseconds);
  const date = new Date(2026, 7, 31, source.getHours(), source.getMinutes(), source.getSeconds(), source.getMilliseconds());
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function optionalString(value: JsonValue | undefined): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function optionalNumber(value: JsonValue | undefined): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function normalizeDimensions(value: JsonValue | undefined): { width?: number; height?: number } | undefined {
  if (!isRecord(value)) return undefined;
  const width = optionalNumber(value.width);
  const height = optionalNumber(value.height);
  return width === undefined && height === undefined ? undefined : { width, height };
}

function sharedFileFields(artifact: FileArtifact) {
  const data = artifact.data;
  const surfacedAt = typeof artifact.surfacedAt === "number" && artifact.surfacedAt > 0
    ? artifact.surfacedAt
    : Date.now();
  const modifiedAt = optionalString(data.modified_at) ?? storyTimestamp(surfacedAt);
  return {
    id: artifact.id,
    name: basename(data.display_path),
    folderPath: normalizePath(optionalString(data.folder)) || defaultFolderForMime(data.mime),
    modifiedAt,
    ...(data.modified_at == null ? { sortMs: surfacedAt } : {}),
    cipher: optionalString(data.cipher),
    threshold: optionalNumber(data.threshold),
    recoverWhen: optionalString(data.recover_when),
    tierOrder: optionalNumber(data.tier_order),
    launch: optionalString(data.launch),
    readFact: optionalString(data.read_fact),
    openEmitsFact: optionalString(data.open_emits_fact),
    openSentinelFact: optionalString(data.open_sentinel_fact),
    corrupted: data.corrupted === true ? true : undefined,
  };
}

export function isRecoverableFile(file: Pick<FilesRecoveredFile, "threshold" | "recoverWhen">): boolean {
  return file.threshold != null || file.recoverWhen != null;
}

export function isRecoverWhenOnly(file: Pick<FilesRecoveredFile, "threshold" | "recoverWhen">): boolean {
  return file.threshold == null && file.recoverWhen != null;
}

export function hasRecoveredFilePayload(file: FilesRecoveredFile): boolean {
  switch (file.kind) {
    case "text": return file.content.length > 0;
    case "image": return file.imageSrc.length > 0;
    case "training-log": return file.items.length > 0;
    case "pdf": return file.pdfSrc.length > 0;
  }
}

export function isRecoveredFile(file: FilesRecoveredFile): boolean {
  return !isRecoverableFile(file) || hasRecoveredFilePayload(file);
}

export function fileRecoveryThreshold(file: Pick<FilesRecoveredFile, "threshold" | "recoverWhen">): number {
  return file.threshold != null
    ? file.threshold
    : file.recoverWhen != null
      ? Number.POSITIVE_INFINITY
      : -1;
}

export interface FileRecoveryProgress {
  pct: number;
  stalled: boolean;
}

export function computeFileRecoveryProgress(
  threshold: number | null | undefined,
  maxComputeThisRun: number,
  computeCap: number,
): FileRecoveryProgress {
  if (threshold == null) return { pct: 100, stalled: false };
  const recovered = Math.min(maxComputeThisRun, computeCap);
  const baseLog = Math.log10(Math.max(0, 1));
  const span = Math.log10(threshold) - baseLog;
  const ratio = span > 0
    ? (Math.log10(Math.max(recovered, 1)) - baseLog) / span
    : 1;
  const pct = Math.floor(Math.max(0, Math.min(1, ratio)) * 100);
  return {
    pct,
    stalled: pct < 100 && Number.isFinite(computeCap) && maxComputeThisRun >= computeCap,
  };
}

export function normalizeFileArtifact(artifact: FileArtifact): FilesRecoveredFile | null {
  if (artifact.type !== "file") return null;
  const data = artifact.data;
  if (typeof data.display_path !== "string" || typeof data.mime !== "string") return null;
  const shared = sharedFileFields(artifact);
  const recoverable = data.threshold != null || Boolean(data.recover_when);
  const sizeBytes = optionalNumber(data.size_bytes) ?? 0;

  if (data.mime === "application/pdf") {
    const pdfSrc = optionalString(data.binary_asset_path) ?? optionalString(data.asset_path) ?? "";
    if (!pdfSrc && !recoverable) return null;
    return { ...shared, kind: "pdf", sizeBytes, pdfSrc };
  }

  if (data.mime === "application/x-nori-trainlog" && isRecord(data.trainlog)) {
    const items = Array.isArray(data.trainlog.items) ? data.trainlog.items : [];
    return {
      ...shared,
      kind: "training-log",
      sizeBytes,
      phase: data.trainlog.phase,
      seq: data.trainlog.seq,
      items,
    };
  }

  if (data.mime.startsWith("image/")) {
    const imageSrc = optionalString(data.asset_path) ?? "";
    if (!imageSrc && !recoverable) return null;
    return {
      ...shared,
      kind: "image",
      sizeBytes,
      imageSrc,
      alt: optionalString(data.alt) ?? shared.name,
      dimensions: normalizeDimensions(data.dimensions),
    };
  }

  const content = optionalString(data.body_md) ?? "";
  return {
    ...shared,
    kind: "text",
    sizeBytes: optionalNumber(data.size_bytes) ?? content.length,
    content,
    lineCount: content.length === 0 ? 0 : content.split(/\r?\n/).length,
  };
}

export function normalizeFilesVaultArtifact(artifact: FilesVaultArtifact): FilesVault | null {
  if (artifact.type !== "app") return null;
  const data = artifact.data;
  if (
    data.app_kind !== "password_prompt" ||
    typeof data.command !== "string" ||
    typeof data.puzzle_id !== "string" ||
    typeof data.vault_path !== "string"
  ) return null;

  return {
    id: artifact.id,
    title: optionalString(data.title) ?? basename(data.vault_path),
    command: data.command,
    puzzleId: data.puzzle_id,
    vaultPath: normalizePath(data.vault_path),
    vaultKind: optionalString(data.vault_kind) ?? "folder",
    unlockedFact: optionalString(data.unlocked_when),
    unpackTo: optionalString(data.unpack_to) ? normalizePath(data.unpack_to) : undefined,
    placeholder: optionalString(data.placeholder),
    hint: optionalString(data.hint),
  };
}

export class FilesAppModel {
  constructor(private readonly artifacts: ArtifactService, private readonly manifold: ManifoldService) {}

  /** Raw file artifacts retained for compatibility with the earlier protocol-only model. */
  async list(): Promise<FileArtifact[]> {
    return (await this.artifacts.files<FileData>())
      .filter((item) => item.type === "file")
      .sort((a, b) => String(a.data.display_path ?? a.id).localeCompare(String(b.data.display_path ?? b.id)));
  }

  async presentation(): Promise<FilesPresentationSnapshot> {
    const [rawFiles, rawApps] = await Promise.all([
      this.artifacts.files<FileData>(),
      this.artifacts.apps<FilesVaultData>(),
    ]);
    return {
      files: rawFiles.map(normalizeFileArtifact).filter((item): item is FilesRecoveredFile => item !== null),
      vaults: rawApps.map(normalizeFilesVaultArtifact).filter((item): item is FilesVault => item !== null),
    };
  }

  async emitFact(factId: string): Promise<JsonValue> {
    return this.manifold.command("client.emitFact", { factId });
  }

  async verifyVault(vault: Pick<FilesVault, "command" | "puzzleId">, token: string): Promise<boolean> {
    const result = await this.manifold.command(vault.command, {
      puzzleId: vault.puzzleId,
      tokens: [token],
    });
    return Boolean(
      result &&
      typeof result === "object" &&
      !Array.isArray(result) &&
      (result as Record<string, JsonValue>).ok === true,
    );
  }

  /** Legacy adapter kept until callers move to the source-owned presentation flow. */
  async open(file: FileArtifact): Promise<FileArtifact> {
    const factId = file.data.open_emits_fact ?? file.data.open_sentinel_fact ?? file.data.read_fact;
    if (typeof factId === "string" && factId) await this.emitFact(factId);
    return file;
  }

  /** Legacy protocol helper; shipped Files vaults use their artifact-provided command via verifyVault(). */
  async unlockVolume(volumeId: string, factId?: string): Promise<JsonValue> {
    return this.manifold.command("vault.unlock", {
      volumeId,
      ...(factId ? { factId } : {}),
    });
  }
}
