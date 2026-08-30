import {
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ChevronRight,
  Download,
  FileArchive,
  FileText,
  Folder,
  FolderOpen,
  HardDrive,
  Image as ImageIcon,
  Info,
  LayoutGrid,
  List,
  LoaderCircle,
  Lock,
  LockOpen,
  MessagesSquare,
  PanelLeft,
  X,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from "react";
import {
  FILES_COLD_VOLUME_PATH,
  computeFileRecoveryProgress,
  fileRecoveryThreshold,
  isRecoverWhenOnly,
  isRecoverableFile,
  isRecoveredFile,
  type FilesAppModel,
  type FilesRecoveredFile,
  type FilesPresentationSnapshot,
  type FilesVault,
} from "../apps/files";
import {
  buildFilesTree,
  filesBreadcrumbs,
  findFilesTreeNode,
  sortedFilesFolders,
  type FilesTreeNode,
  type FilesTreeVault,
} from "../apps/files-tree";
import { MarkdownBody } from "../components/markdown-body";
import { SidebarNavButton } from "../components/sidebar-nav-button";

const SIDEBAR_WIDTH = 224;
const SIDEBAR_AUTO_COLLAPSE_WIDTH = 600;
const DOWNLOADS_PATH = "下载";
const VIEW_EASE = "cubic-bezier(0.32,0.72,0,1)";

export interface FilesIntentPayload {
  folderPath: string;
  selectKey?: string;
}

export interface FilesIntentStore {
  open(payload: FilesIntentPayload): void;
  pending(): FilesIntentPayload | null;
  clear(): void;
  subscribe(listener: () => void): () => void;
}

export function createFilesIntentStore(): FilesIntentStore {
  let value: FilesIntentPayload | null = null;
  const listeners = new Set<() => void>();
  const publish = () => listeners.forEach((listener) => listener());
  return {
    open(payload) {
      value = payload;
      publish();
    },
    pending: () => value,
    clear() {
      if (!value) return;
      value = null;
      publish();
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

export interface FilesRecoveryState {
  maxComputeThisRun: number;
  computeCap: number;
  currentCompute?: number;
}

export type FilesTranslate = (
  key: string,
  params?: Readonly<Record<string, string | number>>,
) => string;

export interface FilesScreenRuntime {
  model: FilesAppModel;
  translate?: FilesTranslate;
  hasFact?: (factId: string) => boolean;
  subscribe?: (listener: () => void) => () => void;
  playCue?: (cue: string) => void;
  launchApp?: (request: { appId: string; mode: string; args?: unknown }) => void | Promise<void>;
  recoveryState?: () => FilesRecoveryState;
  reduceMotion?: () => boolean;
  decrypting?: () => boolean;
  renderColdVolumeDock?: (files: readonly FilesRecoveredFile[]) => ReactNode;
  intent?: FilesIntentStore;
}

const STRINGS: Record<string, string> = {
  "files.breadcrumb.root": "Files",
  "files.sidebar.section": "Favorites",
  "files.sidebar.devices": "Devices",
  "files.sidebar.downloads": "Downloads",
  "files.sidebar.documents": "Documents",
  "files.sidebar.pictures": "Pictures",
  "files.sidebar.coldVolume": "Cold Volume",
  "files.sidebar.recovered": "Recovered",
  "files.warning.serverCorrupt": "Some files are still being reconstructed from the damaged server archive.",
  "files.downloadsEmpty": "Downloads is empty.",
  "files.columns.name": "Name",
  "files.columns.cipher": "Cipher",
  "files.columns.recovery": "Recovery",
  "files.columns.modified": "Modified",
  "files.columns.size": "Size",
  "files.decrypting": "Decrypting recovered volume…",
  "files.empty": "This folder is empty.",
  "files.sealed.title": "Volume sealed",
  "files.sealed.body": "The cold research volume is unavailable until QFR is installed.",
  "files.sealed.ok": "OK",
  "files.vault.title": "Unlock {name}",
  "files.vault.placeholder": "Password",
  "files.vault.hintLabel": "Hint: ",
  "files.vault.wrong": "That password was not accepted.",
  "files.vault.error": "The vault could not be unlocked.",
  "files.vault.cancel": "Cancel",
  "files.vault.submit": "Unlock",
  "files.vault.submitting": "Unlocking…",
  "files.lockedDialog.requiredUnknown": "UNKNOWN",
  "files.lockedDialog.required": "REQUIRED COMPUTE",
  "files.lockedDialog.currentCompute": "CURRENT",
  "files.lockedDialog.chain": "CHAIN",
  "files.lockedDialog.volume": "VOLUME",
  "files.lockedDialog.close": "Close",
  "files.lockedDialog.raiseCompute": "Raise compute",
  "files.recovery.stalled": "Stalled",
  "files.recovery.recovering": "Recovering",
  "files.recovery.stalledHint": "Recovery is capped by the current compute limit.",
  "files.syncError.title": "Files unavailable",
  "files.syncError.body": "The filesystem index cannot be synchronized until system repair completes.",
  "os.files.alreadyUnpacked": "Already unpacked",
};

function defaultTranslate(key: string, params?: Readonly<Record<string, string | number>>): string {
  let result = STRINGS[key] ?? key;
  for (const [name, value] of Object.entries(params ?? {})) result = result.replace(`{${name}}`, String(value));
  return result;
}

function classes(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}

function fileIcon(file: FilesRecoveredFile) {
  if (file.launch === "qfr") return MessagesSquare;
  if (file.kind === "image") return ImageIcon;
  if (file.kind === "training-log") return FileArchive;
  return FileText;
}

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let index = 0;
  while (value >= 1024 && index < units.length - 1) {
    value /= 1024;
    index += 1;
  }
  const digits = index === 0 ? 0 : value >= 10 ? 1 : 2;
  return `${value.toFixed(digits)} ${units[index]}`;
}

function validDate(value: string): Date | null {
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date : null;
}

function formatModified(value: string): string {
  const date = validDate(value);
  if (!date) return "";
  const now = new Date();
  const days = Math.floor((now.getTime() - date.getTime()) / 86_400_000);
  if (days === 0) return date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  if (days < 7) return date.toLocaleDateString(undefined, { weekday: "short" });
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function useHistory(initialPath: string) {
  const [history, setHistory] = useState({ stack: [initialPath], index: 0 });
  const go = useCallback((path: string) => {
    setHistory((current) => {
      if (current.stack[current.index] === path) return current;
      const prefix = current.stack.slice(0, current.index + 1);
      return { stack: [...prefix, path], index: prefix.length };
    });
  }, []);
  const back = useCallback(() => setHistory((current) => current.index > 0 ? { ...current, index: current.index - 1 } : current), []);
  const forward = useCallback(() => setHistory((current) => current.index < current.stack.length - 1 ? { ...current, index: current.index + 1 } : current), []);
  return {
    path: history.stack[history.index] ?? "",
    canBack: history.index > 0,
    canForward: history.index < history.stack.length - 1,
    go,
    back,
    forward,
  };
}

function unlockedFacts(vaults: readonly FilesVault[], hasFact?: (factId: string) => boolean): Set<string> {
  const result = new Set<string>();
  for (const vault of vaults) if (vault.unlockedFact && hasFact?.(vault.unlockedFact)) result.add(vault.unlockedFact);
  return result;
}

type FilesEntry =
  | { kind: "folder"; key: string; node: FilesTreeNode }
  | { kind: "device"; key: string; sealed: boolean }
  | { kind: "vault"; key: string; vault: FilesTreeVault }
  | { kind: "file"; key: string; file: FilesRecoveredFile };

function buildEntries(node: FilesTreeNode): FilesEntry[] {
  const folders = sortedFilesFolders(node).map((child) => ({ kind: "folder" as const, key: `folder:${child.path}`, node: child }));
  const vaults = node.vaults.map((vault) => ({ kind: "vault" as const, key: `vault:${vault.id}`, vault }));
  const files = [...node.files]
    .sort((left, right) => {
      const leftTier = fileRecoveryThreshold(left);
      const rightTier = fileRecoveryThreshold(right);
      if (leftTier !== rightTier) return leftTier - rightTier;
      const leftOrder = left.tierOrder ?? 0;
      const rightOrder = right.tierOrder ?? 0;
      if (leftOrder !== rightOrder) return leftOrder - rightOrder;
      const leftSort = left.sortMs != null;
      const rightSort = right.sortMs != null;
      if (leftSort !== rightSort) return leftSort ? -1 : 1;
      if (left.sortMs != null && right.sortMs != null) return right.sortMs - left.sortMs;
      return (validDate(right.modifiedAt)?.getTime() ?? 0) - (validDate(left.modifiedAt)?.getTime() ?? 0);
    })
    .map((file) => ({ kind: "file" as const, key: `file:${file.id}`, file }));
  return [...folders, ...vaults, ...files];
}

function RecoveryProgress({ file, runtime, t }: { file: FilesRecoveredFile; runtime: FilesScreenRuntime; t: FilesTranslate }) {
  if (isRecoverWhenOnly(file)) return <span className="font-mono text-[11px] text-muted-foreground">{t("files.lockedDialog.requiredUnknown")}</span>;
  const state = runtime.recoveryState?.() ?? { maxComputeThisRun: 0, computeCap: Number.POSITIVE_INFINITY, currentCompute: 0 };
  const progress = computeFileRecoveryProgress(file.threshold, state.maxComputeThisRun, state.computeCap);
  if (progress.stalled) return <span className="text-[11px] text-amber-500">{t("files.recovery.stalled")}</span>;
  return <span className="flex items-center gap-1.5"><span className="relative h-[3px] w-10 overflow-hidden rounded-full bg-foreground/10"><span className="absolute inset-y-0 left-0 rounded-full bg-[var(--nori-teal,#5eead4)]" style={{ width: `${progress.pct}%` }} /></span><span className="font-mono text-[10px] tabular-nums text-[var(--nori-teal,#5eead4)]">{progress.pct}%</span></span>;
}

function EntryIcon({ entry, className }: { entry: FilesEntry; className?: string }) {
  if (entry.kind === "folder") return <Folder className={className} />;
  if (entry.kind === "device") return <HardDrive className={classes(className, entry.sealed ? "text-amber-500" : "text-[var(--nori-teal,#5eead4)]")} />;
  if (entry.kind === "vault") {
    const Icon = entry.vault.vaultKind === "file" ? FileArchive : Folder;
    const LockIcon = entry.vault.unlocked ? LockOpen : Lock;
    return <span className="relative inline-flex"><Icon className={className} /><LockIcon className={classes("absolute -bottom-0.5 -right-0.5 size-3", entry.vault.unlocked ? "text-muted-foreground" : "text-amber-500")} /></span>;
  }
  const Icon = fileIcon(entry.file);
  return <span className="relative inline-flex"><Icon className={classes(className, entry.file.launch === "qfr" && "text-[#4ee0c8]")} />{isRecoverableFile(entry.file) && !isRecoveredFile(entry.file) ? <Lock className="absolute -bottom-0.5 -right-0.5 size-3 text-amber-500" /> : null}</span>;
}

function Breadcrumbs({ path, onNavigate, t }: { path: string; onNavigate(path: string): void; t: FilesTranslate }) {
  const crumbs = filesBreadcrumbs(path);
  return <div className="flex min-w-0 items-center gap-1 overflow-hidden text-sm"><button type="button" onClick={() => onNavigate("")} className={classes("shrink-0 rounded px-1.5 py-0.5 hover:bg-muted", crumbs.length === 0 ? "font-medium text-foreground" : "text-muted-foreground")}>{t("files.breadcrumb.root")}</button>{crumbs.map((crumb, index) => <span key={crumb.path} className="contents"><ChevronRight className="size-3.5 shrink-0 text-muted-foreground/60" /><button type="button" onClick={() => onNavigate(crumb.path)} className={classes("truncate rounded px-1.5 py-0.5 hover:bg-muted", index === crumbs.length - 1 ? "font-medium text-foreground" : "text-muted-foreground")}>{crumb.name}</button></span>)}</div>;
}

function Modal({ children, onClose, label }: { children: ReactNode; onClose(): void; label?: string }) {
  useEffect(() => {
    const key = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [onClose]);
  return <div className="absolute inset-0 z-30 grid place-items-center bg-black/35 p-4" role="dialog" aria-modal="true" aria-label={label} onMouseDown={(event) => event.target === event.currentTarget && onClose()}><div className="w-[min(30rem,100%)] rounded-2xl border border-border bg-popover p-5 text-popover-foreground shadow-2xl">{children}</div></div>;
}

function SealedDialog({ onClose, t }: { onClose(): void; t: FilesTranslate }) {
  return <Modal onClose={onClose} label={t("files.sealed.title")}><div className="flex items-start gap-3"><div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted/50 text-muted-foreground"><Lock className="size-[18px]" /></div><div className="min-w-0 flex-1"><h2 className="text-sm font-semibold">{t("files.sealed.title")}</h2><p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">{t("files.sealed.body")}</p></div></div><div className="mt-5 flex justify-end"><button type="button" onClick={onClose} className="rounded-lg bg-muted/60 px-4 py-1.5 text-[13px] font-medium hover:bg-muted">{t("files.sealed.ok")}</button></div></Modal>;
}

function VaultDialog({ vault, runtime, onCancel, onUnlocked, t }: { vault: FilesTreeVault; runtime: FilesScreenRuntime; onCancel(): void; onUnlocked(vault: FilesTreeVault): void; t: FilesTranslate }) {
  const [token, setToken] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "wrong" | "error">("idle");
  const submitting = status === "submitting";
  const name = vault.vaultPath.split("/").filter(Boolean).at(-1) ?? vault.title;
  const submit = async () => {
    if (!token.trim() || submitting) return;
    setStatus("submitting");
    try {
      if (await runtime.model.verifyVault(vault, token)) {
        runtime.playCue?.("webapps-files-vault-unlock");
        onUnlocked(vault);
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, 900));
      runtime.playCue?.("webapps-files-vault-wrong-pass");
      setToken("");
      setStatus("wrong");
    } catch (error) {
      console.warn("[Files] Vault unlock failed:", error);
      runtime.playCue?.("webapps-files-vault-wrong-pass");
      setStatus("error");
    }
  };
  const message = status === "wrong" ? t("files.vault.wrong") : status === "error" ? t("files.vault.error") : "";
  return <Modal onClose={submitting ? () => {} : onCancel} label={name}><div className="flex gap-4"><Lock className="mt-0.5 size-10 shrink-0 text-muted-foreground" strokeWidth={1.25} /><div className="min-w-0 flex-1"><h2 className="text-sm font-semibold">{t("files.vault.title", { name })}</h2><input autoFocus value={token} disabled={submitting} onChange={(event) => { setToken(event.target.value); if (status !== "submitting") setStatus("idle"); }} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); void submit(); } }} placeholder={vault.placeholder ?? t("files.vault.placeholder")} className="mt-3.5 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring/40" />{vault.hint ? <div className="mt-2 text-[12px] leading-relaxed text-muted-foreground"><MarkdownBody markdown={t("files.vault.hintLabel") + vault.hint} /></div> : null}<p className={classes("mt-2 min-h-4 text-[12px]", message ? "text-destructive" : "text-transparent")} aria-live="polite">{message || " "}</p></div></div><div className="mt-2 flex justify-end gap-2"><button type="button" disabled={submitting} onClick={onCancel} className="rounded-md px-3 py-1.5 text-sm hover:bg-muted disabled:opacity-50">{t("files.vault.cancel")}</button><button type="button" disabled={submitting || !token.trim()} onClick={() => void submit()} className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground disabled:opacity-50">{submitting ? <LoaderCircle className="size-4 animate-spin" /> : null}{t(submitting ? "files.vault.submitting" : "files.vault.submit")}</button></div></Modal>;
}

function scientificThreshold(value: number): string {
  return `1e${Math.round(Math.log10(value))}`;
}

function LockedFileDialog({ file, runtime, onClose, t }: { file: FilesRecoveredFile; runtime: FilesScreenRuntime; onClose(): void; t: FilesTranslate }) {
  const unknown = isRecoverWhenOnly(file);
  const state = runtime.recoveryState?.() ?? { maxComputeThisRun: 0, computeCap: Number.POSITIVE_INFINITY, currentCompute: 0 };
  const progress = computeFileRecoveryProgress(file.threshold, state.maxComputeThisRun, state.computeCap);
  const cipher = file.cipher ?? "RSA-2048";
  return <Modal onClose={onClose} label={file.name}><div className="flex items-start justify-between gap-4"><div className="min-w-0"><h2 className="truncate text-sm font-semibold">{file.name}</h2><div className="mt-1.5 flex items-center gap-2 text-[11px]"><span className="rounded-md border bg-muted/40 px-1.5 py-0.5 font-mono text-muted-foreground">{cipher}</span><span className={unknown ? "font-mono text-muted-foreground" : progress.stalled ? "text-amber-500" : "text-[var(--nori-teal,#5eead4)]"}>{t(unknown ? "files.lockedDialog.requiredUnknown" : progress.stalled ? "files.recovery.stalled" : "files.recovery.recovering")}</span></div></div><button type="button" onClick={onClose} className="rounded p-1 text-muted-foreground hover:bg-muted"><X className="size-4" /></button></div><div className="relative mt-4 overflow-hidden rounded-xl border border-border/50 bg-[#0a1119] px-4 pb-3.5 pt-3.5"><div className="text-[11px] tracking-[0.16em] text-muted-foreground">{t("files.lockedDialog.required")}</div><div className="mt-0.5 font-mono text-[40px] font-bold leading-[1.1] text-[var(--nori-teal,#5eead4)]">{file.threshold != null ? scientificThreshold(file.threshold) : t("files.lockedDialog.requiredUnknown")}</div>{file.threshold != null ? <><div className="mt-3 flex items-baseline justify-between text-xs"><span className="text-foreground/90">{t("files.lockedDialog.currentCompute")} <b className={classes("font-mono tabular-nums", progress.stalled && "text-amber-500")}>{state.currentCompute ?? state.maxComputeThisRun}</b></span><span className="font-mono tabular-nums text-muted-foreground">{progress.pct}%</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-foreground/10"><div className={classes("h-full rounded-full", progress.stalled ? "bg-amber-500" : "bg-[var(--nori-teal,#5eead4)]")} style={{ width: `${progress.pct}%` }} /></div><div className="mt-1 flex justify-between font-mono text-[10px] text-muted-foreground/60"><span>1</span><span>{scientificThreshold(file.threshold)}</span></div></> : null}</div>{!unknown && progress.stalled ? <p className="mt-2.5 text-[11.5px] leading-relaxed text-amber-500/90">{t("files.recovery.stalledHint")}</p> : null}<div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 border-t border-border/40 pt-3 font-mono text-[11px] text-muted-foreground"><span><small className="block text-[9.5px] uppercase tracking-wider">{t("files.lockedDialog.chain")}</small><span className="text-foreground/90">{cipher} → VMK → FVEK</span></span><span><small className="block text-[9.5px] uppercase tracking-wider">{t("files.lockedDialog.volume")}</small><span className="text-foreground/90">AES-256-XTS</span></span></div><div className="mt-4 flex justify-end gap-2"><button type="button" onClick={onClose} className="rounded-md px-3 py-1.5 text-sm hover:bg-muted">{t("files.lockedDialog.close")}</button>{!unknown ? <button type="button" onClick={() => { void runtime.launchApp?.({ appId: "idle", mode: "activate" }); onClose(); }} className="rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground">{t("files.lockedDialog.raiseCompute")}</button> : null}</div></Modal>;
}

function SyncError({ t }: { t: FilesTranslate }) {
  return <div className="relative flex h-full flex-col items-center justify-center overflow-hidden px-8 text-center"><img src="/app-icons/files/icon-a.png" alt="" draggable={false} className="size-16 opacity-80 grayscale" /><div className="mt-3 text-sm font-medium text-foreground">{t("files.syncError.title")}</div><div className="mt-1 max-w-xs text-xs text-muted-foreground">{t("files.syncError.body")}</div></div>;
}

function columns(showCipher: boolean): string {
  return showCipher ? "grid grid-cols-[minmax(0,1fr)_88px_120px_104px_84px] items-center gap-3" : "grid grid-cols-[minmax(0,1fr)_104px_84px] items-center gap-3";
}

function ListEntry({ entry, selected, showCipher, runtime, onSelect, onOpen, t }: { entry: FilesEntry; selected: boolean; showCipher: boolean; runtime: FilesScreenRuntime; onSelect(): void; onOpen(): void; t: FilesTranslate }) {
  const file = entry.kind === "file" ? entry.file : null;
  return <button type="button" onClick={onSelect} onDoubleClick={onOpen} className={classes("w-full border-b border-border/40 border-l-2 border-l-transparent px-4 py-2 text-left transition-colors hover:bg-muted/40 focus:bg-muted/40 focus:outline-none", selected && "border-l-primary bg-primary/10 hover:bg-primary/15")}><div className={columns(showCipher)}><div className="flex min-w-0 items-center gap-2"><EntryIcon entry={entry} className="size-4 shrink-0 text-muted-foreground" /><span className="truncate text-sm text-foreground">{entry.kind === "folder" ? entry.node.name : entry.kind === "device" ? t("files.sidebar.coldVolume") : entry.kind === "vault" ? entry.vault.title : entry.file.name}</span></div>{showCipher ? <div className="font-mono text-[11px] text-muted-foreground">{file?.cipher ?? ""}</div> : null}{showCipher ? <div>{file && isRecoverableFile(file) && !isRecoveredFile(file) ? <RecoveryProgress file={file} runtime={runtime} t={t} /> : null}</div> : null}<div className="text-xs text-muted-foreground">{file ? formatModified(file.modifiedAt) : ""}</div><div className="text-right text-xs text-muted-foreground">{file ? formatBytes(file.sizeBytes) : "—"}</div></div></button>;
}

function GridEntry({ entry, selected, runtime, onSelect, onOpen, t }: { entry: FilesEntry; selected: boolean; runtime: FilesScreenRuntime; onSelect(): void; onOpen(): void; t: FilesTranslate }) {
  const file = entry.kind === "file" ? entry.file : null;
  const label = entry.kind === "folder" ? entry.node.name : entry.kind === "device" ? t("files.sidebar.coldVolume") : entry.kind === "vault" ? entry.vault.title : entry.file.name;
  return <button type="button" onClick={onSelect} onDoubleClick={onOpen} title={label} className={classes("group flex flex-col items-center gap-2 rounded-xl p-3 transition-[background-color,box-shadow] duration-200 focus:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-primary/40", selected ? "bg-primary/10 ring-1 ring-inset ring-primary/30" : "hover:bg-muted/40")}><div className="flex h-20 w-full items-center justify-center group-hover:scale-[1.04] group-active:scale-95 transition-transform">{file?.kind === "image" && file.imageSrc && isRecoveredFile(file) ? <img src={file.imageSrc} alt={file.alt} draggable={false} className="max-h-20 max-w-full rounded-md object-contain shadow-sm ring-1 ring-border/40" /> : <EntryIcon entry={entry} className="size-14 text-muted-foreground/70" />}</div>{file && isRecoverableFile(file) && !isRecoveredFile(file) ? <div className="w-full"><RecoveryProgress file={file} runtime={runtime} t={t} /></div> : null}<span className={classes("line-clamp-2 max-w-full break-words rounded px-1 text-center text-xs", selected ? "font-medium text-primary" : "text-foreground/90")}>{label}</span></button>;
}

function Sidebar({ path, qfrInstalled, files, onNavigate, onSealed, t }: { path: string; qfrInstalled: boolean; files: readonly FilesRecoveredFile[]; onNavigate(path: string): void; onSealed(): void; t: FilesTranslate }) {
  const recoverable = files.filter(isRecoverableFile);
  const recovered = recoverable.filter(isRecoveredFile).length;
  const pct = recoverable.length ? Math.round((recovered / recoverable.length) * 100) : 0;
  return <div className="flex h-full flex-col border-r border-border/50 bg-muted/15"><nav className="px-2 pt-3"><SidebarNavButton icon={HardDrive} label={t("files.breadcrumb.root")} active={path === ""} onClick={() => onNavigate("")} sfx={false} /></nav><div className="px-3 pb-1.5 pt-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">{t("files.sidebar.section")}</div><nav className="px-2 pb-3"><SidebarNavButton icon={Download} label={t("files.sidebar.downloads")} active={path === "下载"} onClick={() => onNavigate("下载")} sfx={false} /><SidebarNavButton icon={Folder} label={t("files.sidebar.documents")} active={path === "文稿"} onClick={() => onNavigate("文稿")} sfx={false} /><SidebarNavButton icon={ImageIcon} label={t("files.sidebar.pictures")} active={path === "图片"} onClick={() => onNavigate("图片")} sfx={false} /></nav><div className="px-3 pb-1.5 pt-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">{t("files.sidebar.devices")}</div><nav className="px-2 pb-3"><SidebarNavButton icon={HardDrive} label={t("files.sidebar.coldVolume")} active={path === FILES_COLD_VOLUME_PATH} onClick={() => qfrInstalled ? onNavigate(FILES_COLD_VOLUME_PATH) : onSealed()} sfx={false} />{qfrInstalled && recoverable.length > 0 ? <div className="mt-1 pl-9 pr-2.5"><div className="flex items-center justify-between text-[10px] text-muted-foreground/80"><span>{t("files.sidebar.recovered")}</span><span className="tabular-nums">{recovered} / {recoverable.length}</span></div><div className="mt-1 h-1 overflow-hidden rounded-full bg-foreground/10"><div className="h-full rounded-full bg-[var(--nori-teal,#5eead4)] transition-[width] duration-500 ease-out" style={{ width: `${pct}%` }} /></div></div> : null}</nav></div>;
}

function rowColumns(ref: HTMLDivElement | null): number {
  if (!ref) return 1;
  const buttons = ref.querySelectorAll("button");
  if (buttons.length <= 1) return 1;
  const top = buttons[0].offsetTop;
  let count = 1;
  for (let index = 1; index < buttons.length && buttons[index].offsetTop === top; index += 1) count += 1;
  return count;
}

function inputTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) || target.isContentEditable;
}

export function FilesScreen({ runtime, initialIntent = { folderPath: "" } }: { runtime: FilesScreenRuntime; initialIntent?: FilesIntentPayload }) {
  const t = runtime.translate ?? defaultTranslate;
  const [snapshot, setSnapshot] = useState<FilesPresentationSnapshot>({ files: [], vaults: [] });
  const [loading, setLoading] = useState(true);
  const [revision, setRevision] = useState(0);
  const navigation = useHistory(initialIntent.folderPath);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [selectedKey, setSelectedKey] = useState<string | null>(initialIntent.selectKey ?? null);
  const [vault, setVault] = useState<FilesTreeVault | null>(null);
  const [lockedFile, setLockedFile] = useState<FilesRecoveredFile | null>(null);
  const [sealed, setSealed] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [toast, setToast] = useState<{ title: string; subtitle: string } | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const entriesRef = useRef<HTMLDivElement>(null);
  const autoCollapsed = useRef(false);
  void revision;

  const load = useCallback(async () => {
    setLoading(true);
    try { setSnapshot(await runtime.model.presentation()); }
    catch (error) { console.warn("[Files] Failed to load artifacts", error); }
    finally { setLoading(false); }
  }, [runtime.model]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => runtime.subscribe?.(() => { setRevision((value) => value + 1); void load(); }), [runtime, load]);
  useEffect(() => runtime.intent?.subscribe(() => {
    const pending = runtime.intent?.pending();
    if (!pending) return;
    setVault(null); setLockedFile(null); setSealed(false);
    navigation.go(pending.folderPath);
    setSelectedKey(pending.selectKey ?? null);
    runtime.intent?.clear();
  }), [runtime.intent, navigation.go]);

  useEffect(() => {
    const element = rootRef.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      const collapse = (entry?.contentRect.width ?? 0) < SIDEBAR_AUTO_COLLAPSE_WIDTH;
      if (collapse !== autoCollapsed.current) {
        autoCollapsed.current = collapse;
        setSidebarOpen(!collapse);
      }
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const systemRepaired = runtime.hasFact?.("system.repaired") ?? true;
  const qfrInstalled = runtime.hasFact?.("qfr.installed") ?? false;
  const facts = useMemo(() => unlockedFacts(snapshot.vaults, runtime.hasFact), [snapshot.vaults, runtime.hasFact, revision]);
  const tree = useMemo(() => buildFilesTree(snapshot.files, snapshot.vaults, facts), [snapshot.files, snapshot.vaults, facts]);
  const current = useMemo(() => findFilesTreeNode(tree, navigation.path), [tree, navigation.path]);
  const entries = useMemo(() => {
    if (!current) return [];
    const normal = buildEntries(current);
    if (navigation.path !== "") return normal;
    return [{ kind: "device" as const, key: "device:cold-volume", sealed: !qfrInstalled }, ...normal.filter((entry) => !(entry.kind === "folder" && entry.node.path === FILES_COLD_VOLUME_PATH))];
  }, [current, navigation.path, qfrInstalled]);
  const coldVolume = navigation.path === FILES_COLD_VOLUME_PATH;
  const downloadsEmpty = navigation.path === DOWNLOADS_PATH && !loading && entries.length === 0;
  const decrypting = coldVolume && (runtime.decrypting?.() ?? false);

  const navigate = useCallback((path: string) => { navigation.go(path); setSelectedKey(null); runtime.playCue?.("webapps-files-open-folder"); }, [navigation.go, runtime]);
  const showAlreadyUnpacked = useCallback((title: string) => {
    setToast({ title: t("os.files.alreadyUnpacked"), subtitle: title });
    window.setTimeout(() => setToast(null), 4000);
  }, [t]);
  const openEntry = useCallback(async (entry: FilesEntry) => {
    if (entry.kind === "folder") { navigate(entry.node.path); return; }
    if (entry.kind === "device") { if (entry.sealed) { runtime.playCue?.("webapps-files-locked-file"); setSealed(true); } else navigate(FILES_COLD_VOLUME_PATH); return; }
    if (entry.kind === "vault") { if (entry.vault.unlocked) showAlreadyUnpacked(entry.vault.title); else setVault(entry.vault); return; }
    const file = entry.file;
    if (file.launch === "qfr") {
      if (qfrInstalled) navigate(FILES_COLD_VOLUME_PATH);
      else await runtime.model.emitFact("qfr.installing");
      return;
    }
    if (isRecoverableFile(file) && !isRecoveredFile(file)) { runtime.playCue?.("webapps-files-locked-file"); setLockedFile(file); return; }
    if (file.openEmitsFact !== undefined) {
      if (file.openSentinelFact && runtime.hasFact?.(file.openSentinelFact)) { showAlreadyUnpacked(file.name); return; }
      await runtime.model.emitFact(file.openEmitsFact);
      return;
    }
    await runtime.launchApp?.({ appId: "preview", mode: "launch", args: { fileId: file.id } });
  }, [navigate, qfrInstalled, runtime, showAlreadyUnpacked]);

  useEffect(() => {
    if (!lockedFile) return;
    const updated = current?.files.find((file) => file.id === lockedFile.id);
    if (updated && isRecoveredFile(updated)) setLockedFile(null);
  }, [lockedFile, current, revision]);

  const navigateUp = useCallback(() => navigate(navigation.path.split("/").slice(0, -1).join("/")), [navigate, navigation.path]);
  const onKeyDown = useCallback((event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (inputTarget(event.target)) return;
    const index = selectedKey ? entries.findIndex((entry) => entry.key === selectedKey) : -1;
    const select = (next: number) => {
      const key = entries[next]?.key;
      if (!key) return;
      setSelectedKey(key);
      entriesRef.current?.querySelectorAll("button")[next]?.focus();
    };
    switch (event.key) {
      case "ArrowRight": if (!entries.length) return; event.preventDefault(); select(index < 0 ? 0 : Math.min(entries.length - 1, index + 1)); break;
      case "ArrowLeft": if (!entries.length) return; event.preventDefault(); select(index < 0 ? 0 : Math.max(0, index - 1)); break;
      case "ArrowDown": if (!entries.length) return; event.preventDefault(); select(index < 0 ? 0 : Math.min(entries.length - 1, index + rowColumns(entriesRef.current))); break;
      case "ArrowUp": if (!entries.length) return; event.preventDefault(); select(index < 0 ? entries.length - 1 : Math.max(0, index - rowColumns(entriesRef.current))); break;
      case "Home": if (!entries.length) return; event.preventDefault(); select(0); break;
      case "End": if (!entries.length) return; event.preventDefault(); select(entries.length - 1); break;
      case "Enter": if (index < 0) return; event.preventDefault(); void openEntry(entries[index]); break;
      case "Escape": if (!selectedKey) return; event.preventDefault(); setSelectedKey(null); break;
      case "Backspace": event.preventDefault(); navigateUp(); break;
    }
  }, [entries, selectedKey, openEntry, navigateUp]);

  if (!systemRepaired) return <SyncError t={t} />;

  return <div ref={rootRef} className="relative flex h-full overflow-hidden animate-in fade-in duration-700"><div className="shrink-0 overflow-hidden transition-[width]" style={{ width: sidebarOpen ? SIDEBAR_WIDTH : 0, transitionDuration: runtime.reduceMotion?.() ? "0ms" : "240ms", transitionTimingFunction: VIEW_EASE }}><div className="h-full w-56"><Sidebar path={navigation.path} qfrInstalled={qfrInstalled} files={snapshot.files} onNavigate={navigate} onSealed={() => { runtime.playCue?.("webapps-files-locked-file"); setSealed(true); }} t={t} /></div></div><div className="flex min-w-0 flex-1 flex-col"><div className="flex items-center gap-2 border-b border-border/50 bg-muted/15 px-3 py-2"><button type="button" onClick={() => setSidebarOpen((value) => !value)} aria-pressed={sidebarOpen} className="flex size-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted/60 hover:text-foreground"><PanelLeft className="size-4" /></button><div className="inline-flex items-center rounded-lg bg-muted/40 p-0.5 ring-1 ring-inset ring-border/60"><button type="button" onClick={navigation.back} disabled={!navigation.canBack} className="flex size-7 items-center justify-center rounded-[7px] text-muted-foreground disabled:opacity-40"><ArrowLeft className="size-4" /></button><span className="mx-px h-4 w-px bg-border/60" /><button type="button" onClick={navigation.forward} disabled={!navigation.canForward} className="flex size-7 items-center justify-center rounded-[7px] text-muted-foreground disabled:opacity-40"><ArrowRight className="size-4" /></button></div><button type="button" onClick={navigateUp} disabled={navigation.path === ""} className="flex size-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted/60 disabled:opacity-40"><ArrowUp className="size-4" /></button><div className="min-w-0 flex-1"><Breadcrumbs path={navigation.path} onNavigate={navigate} t={t} /></div><div className="inline-flex items-center rounded-lg bg-muted/40 p-0.5 ring-1 ring-inset ring-border/60"><button type="button" onClick={() => setView("grid")} className={classes("flex size-7 items-center justify-center rounded-[7px] text-muted-foreground", view === "grid" && "bg-background/80 text-foreground shadow-sm")}><LayoutGrid className="size-4" /></button><button type="button" onClick={() => setView("list")} className={classes("flex size-7 items-center justify-center rounded-[7px] text-muted-foreground", view === "list" && "bg-background/80 text-foreground shadow-sm")}><List className="size-4" /></button></div></div>{navigation.path === "" ? <div className="flex items-center gap-2 border-b border-amber-500/25 bg-amber-500/10 px-4 py-2 text-[12px] leading-snug text-amber-600 dark:text-amber-400"><Info className="size-3.5 shrink-0" /><span>{t("files.warning.serverCorrupt")}</span></div> : null}{downloadsEmpty ? <div className="flex items-center gap-2 border-b border-border/50 bg-muted/20 px-4 py-2 text-[12px] text-muted-foreground"><Info className="size-3.5 shrink-0" /><span>{t("files.downloadsEmpty")}</span></div> : null}{view === "list" && !downloadsEmpty ? <div className={classes(columns(coldVolume), "border-b border-border/50 bg-muted/10 px-4 py-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70")}><div>{t("files.columns.name")}</div>{coldVolume ? <div>{t("files.columns.cipher")}</div> : null}{coldVolume ? <div>{t("files.columns.recovery")}</div> : null}<div>{t("files.columns.modified")}</div><div className="text-right">{t("files.columns.size")}</div></div> : null}<div ref={entriesRef} tabIndex={-1} onKeyDown={onKeyDown} onClick={(event) => { if (!(event.target as HTMLElement).closest("button")) { setSelectedKey(null); entriesRef.current?.focus({ preventScroll: true }); } }} className="flex-1 overflow-auto outline-none">{decrypting ? <div className="flex h-full flex-col items-center justify-center gap-3 text-center"><LoaderCircle className="size-5 animate-spin text-[var(--nori-teal,#5eead4)]" /><div className="text-sm text-muted-foreground">{t("files.decrypting")}</div></div> : loading ? <div className="flex h-full items-center justify-center"><LoaderCircle className="size-5 animate-spin text-muted-foreground/70" /></div> : !current || entries.length === 0 ? downloadsEmpty ? null : <div className="flex h-full flex-col items-center justify-center gap-3 text-center"><FolderOpen className="size-10 text-muted-foreground/40" strokeWidth={1.25} /><div className="text-sm text-muted-foreground">{t("files.empty")}</div></div> : view === "grid" ? <div className="grid grid-cols-[repeat(auto-fill,minmax(108px,1fr))] gap-1.5 p-3">{entries.map((entry) => <GridEntry key={entry.key} entry={entry} selected={entry.key === selectedKey} runtime={runtime} onSelect={() => setSelectedKey(entry.key)} onOpen={() => void openEntry(entry)} t={t} />)}</div> : entries.map((entry) => <ListEntry key={entry.key} entry={entry} selected={entry.key === selectedKey} showCipher={coldVolume} runtime={runtime} onSelect={() => setSelectedKey(entry.key)} onOpen={() => void openEntry(entry)} t={t} />)}</div></div>{coldVolume ? runtime.renderColdVolumeDock?.(current?.files ?? []) : null}{vault ? <VaultDialog vault={vault} runtime={runtime} onCancel={() => setVault(null)} onUnlocked={(unlocked) => { setVault(null); if (unlocked.vaultKind === "file") { if (unlocked.unpackTo) navigate(unlocked.unpackTo); } else navigate(unlocked.vaultPath); }} t={t} /> : null}{lockedFile ? <LockedFileDialog file={lockedFile} runtime={runtime} onClose={() => setLockedFile(null)} t={t} /> : null}{sealed ? <SealedDialog onClose={() => setSealed(false)} t={t} /> : null}{toast ? <div className="pointer-events-none absolute right-3 top-3 z-40 rounded-xl border bg-popover px-3 py-2 shadow-lg"><div className="text-sm font-medium">{toast.title}</div><div className="text-xs text-muted-foreground">{toast.subtitle}</div></div> : null}</div>;
}
