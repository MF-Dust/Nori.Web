import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  ArrowLeft,
  ArrowRight,
  ChevronRight,
  FileArchive,
  FileText,
  Folder,
  HardDrive,
  Home,
  Image as ImageIcon,
  LoaderCircle,
  Lock,
  LockOpen,
  X,
} from "lucide-react";
import "../styles/browser-bounty.css";
import type {
  BrowserAppModel,
  BrowserBountySubmitResult,
} from "../apps/browser";
import {
  FILES_COLD_VOLUME_PATH,
  fileRecoveryThreshold,
  isRecoverableFile,
  isRecoveredFile,
  type FilesRecoveredFile,
  type FilesPresentationSnapshot,
} from "../apps/files";
import {
  buildFilesTree,
  filesBreadcrumbs,
  findFilesTreeNode,
  sortedFilesFolders,
  type FilesTreeNode,
  type FilesTreeVault,
} from "../apps/files-tree";

export const BOUNTY_PROGRESS_FACTS = [
  "dirt.jack",
  "dirt.daniel",
  "dirt.frank",
  "dirt.maggie",
  "dirt.hanyue_ssh",
  "dirt.futurum_aleph_obs",
] as const;

export const BOUNTY_TARGET_COUNT = 5;
export const BOUNTY_ANON_ID = "#df7aeac";
export const BOUNTY_DETECT_DELAY_MS = 3_000;
export const BOUNTY_TOAST_MS = 6_000;

export interface BrowserBountyProgress {
  count: number;
  complete: boolean;
}

export function browserBountyProgress(
  facts: ReadonlySet<string>,
): BrowserBountyProgress {
  const raw = BOUNTY_PROGRESS_FACTS.reduce(
    (total, fact) => total + (facts.has(fact) ? 1 : 0),
    0,
  );
  return {
    count: Math.min(raw, BOUNTY_TARGET_COUNT),
    complete:
      facts.has("arg.honeypot_access") || raw >= BOUNTY_TARGET_COUNT,
  };
}

export function BrowserBountyCat({
  mood = "base",
  size = 40,
  tone = "white",
  bare = false,
}: {
  mood?: "base" | "happy" | "sad";
  size?: number;
  tone?: "white" | "pink";
  bare?: boolean;
}) {
  const fill = tone === "pink" ? "#ff2e88" : "#fff";
  return (
    <svg
      className={bare ? undefined : "qm-cat"}
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M9 8 L15 16 Q20 13 25 16 L31 8 L29 19 Q33 24 29 30 Q20 36 11 30 Q7 24 11 19 Z"
        fill={fill}
        stroke="#d80f68"
        strokeWidth="1.5"
      />
      {mood === "happy" ? (
        <>
          <path
            d="M13.5 21 Q16 18.5 18.5 21"
            stroke="#d80f68"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
          <path
            d="M21.5 21 Q24 18.5 26.5 21"
            stroke="#d80f68"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
          <circle cx="13" cy="25" r="1.7" fill="#ffc2db" />
          <circle cx="27" cy="25" r="1.7" fill="#ffc2db" />
          <path
            d="M17 26 Q20 30 23 26"
            stroke="#d80f68"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </>
      ) : mood === "sad" ? (
        <>
          <circle cx="16" cy="23" r="2" fill="#d80f68" />
          <circle cx="24" cy="23" r="2" fill="#d80f68" />
          <path
            d="M17 28 Q20 25.5 23 28"
            stroke="#d80f68"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </>
      ) : (
        <>
          <circle cx="16" cy="22" r="2.1" fill="#d80f68" />
          <circle cx="24" cy="22" r="2.1" fill="#d80f68" />
          <circle cx="13" cy="25" r="1.6" fill="#ffc2db" />
          <circle cx="27" cy="25" r="1.6" fill="#ffc2db" />
          <path
            d="M18 27 Q20 29.5 22 27"
            stroke="#d80f68"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </>
      )}
    </svg>
  );
}

const BOUNTY_CONFETTI = [
  { left: "14%", background: "var(--qm-aqua)", delay: "0ms" },
  { left: "30%", background: "#fff", delay: "80ms" },
  { left: "48%", background: "var(--qm-pink-soft)", delay: "40ms" },
  { left: "64%", background: "var(--qm-aqua)", delay: "120ms" },
  { left: "80%", background: "#fff", delay: "60ms" },
  { left: "90%", background: "var(--qm-pink-soft)", delay: "100ms" },
] as const;

function BrowserBountyConfetti() {
  return (
    <div className="qm-confetti" aria-hidden="true">
      {BOUNTY_CONFETTI.map((item, index) => (
        <i
          key={index}
          style={{
            left: item.left,
            background: item.background,
            animationDelay: item.delay,
          }}
        />
      ))}
    </div>
  );
}

type SubmitKind = "page" | "file";
type SubmitState = "rest" | "submitting" | "success" | "fail";

interface SubmitError {
  title: string;
  sub?: string;
}

interface BrowserBountyExtensionProps {
  model: BrowserAppModel;
  facts: ReadonlySet<string>;
  pageUrl: string;
  submittable: boolean;
  playCue?: (
    cue: string,
    options?: { pitch?: number; volume?: number; duckMusic?: boolean },
  ) => void;
}

type PickerEntry =
  | { kind: "folder"; key: string; node: FilesTreeNode }
  | { kind: "device"; key: string; sealed: boolean }
  | { kind: "vault"; key: string; vault: FilesTreeVault }
  | { kind: "file"; key: string; file: FilesRecoveredFile };

function usePickerHistory(initialPath = "") {
  const [state, setState] = useState({ stack: [initialPath], index: 0 });
  const go = useCallback((path: string) => {
    setState((current) => {
      if (current.stack[current.index] === path) return current;
      const prefix = current.stack.slice(0, current.index + 1);
      return { stack: [...prefix, path], index: prefix.length };
    });
  }, []);
  const back = useCallback(
    () =>
      setState((current) =>
        current.index > 0
          ? { ...current, index: current.index - 1 }
          : current,
      ),
    [],
  );
  const forward = useCallback(
    () =>
      setState((current) =>
        current.index < current.stack.length - 1
          ? { ...current, index: current.index + 1 }
          : current,
      ),
    [],
  );
  return {
    path: state.stack[state.index] ?? "",
    canBack: state.index > 0,
    canForward: state.index < state.stack.length - 1,
    go,
    back,
    forward,
  };
}

function pickerEntries(node: FilesTreeNode): PickerEntry[] {
  const folders = sortedFilesFolders(node).map((child) => ({
    kind: "folder" as const,
    key: `folder:${child.path}`,
    node: child,
  }));
  const vaults = node.vaults.map((vault) => ({
    kind: "vault" as const,
    key: `vault:${vault.id}`,
    vault,
  }));
  const files = [...node.files]
    .sort((left, right) => {
      const leftTier = fileRecoveryThreshold(left);
      const rightTier = fileRecoveryThreshold(right);
      if (leftTier !== rightTier) return leftTier - rightTier;
      return (
        new Date(right.modifiedAt).getTime() -
        new Date(left.modifiedAt).getTime()
      );
    })
    .map((file) => ({
      kind: "file" as const,
      key: `file:${file.id}`,
      file,
    }));
  return [...folders, ...vaults, ...files];
}

function pickerFormatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit++;
  }
  return `${value.toFixed(unit === 0 ? 0 : value >= 10 ? 1 : 2)} ${units[unit]}`;
}

function pickerFormatDate(value: string) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "";
  const now = new Date();
  const days = Math.floor((now.getTime() - date.getTime()) / 86_400_000);
  return days === 0
    ? date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })
    : days < 7
      ? date.toLocaleDateString(undefined, { weekday: "short" })
      : date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function PickerNotice({
  kind,
  onClose,
}: {
  kind: "sealed" | "cannot-upload";
  onClose(): void;
}) {
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (event.key !== "Escape" && event.key !== "Enter") return;
      event.preventDefault();
      onClose();
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [onClose]);

  const sealed = kind === "sealed";
  return (
    <div
      className="fixed inset-0 z-[10040] grid place-items-center bg-black/45 p-4"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className="w-[min(24rem,100%)] rounded-2xl border border-border bg-popover p-5 text-popover-foreground shadow-2xl"
        role="alertdialog"
        aria-modal="true"
        aria-label={sealed ? "Volume sealed" : "无法上传此处的文件"}
      >
        {sealed ? (
          <div className="flex items-start gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted/50 text-muted-foreground">
              <Lock className="size-[18px]" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-semibold">Volume sealed</h2>
              <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
                The cold research volume is unavailable until QFR is installed.
              </p>
            </div>
          </div>
        ) : (
          <>
            <h2 className="text-sm font-semibold leading-snug">
              无法上传此处的文件
            </h2>
            <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
              「归档区」中的文件已被加密，无法直接访问。
            </p>
          </>
        )}
        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-muted/60 px-4 py-1.5 text-[13px] font-medium hover:bg-muted"
          >
            {sealed ? "OK" : "知道了"}
          </button>
        </div>
      </div>
    </div>
  );
}

function PickerRow({
  selected,
  muted = false,
  icon,
  name,
  date,
  size,
  onSelect,
  onOpen,
}: {
  selected: boolean;
  muted?: boolean;
  icon: ReactNode;
  name: string;
  date?: string;
  size?: string;
  onSelect(): void;
  onOpen(): void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      onDoubleClick={onOpen}
      className={`relative flex w-full items-center gap-2.5 border-b border-border/40 px-4 py-2 text-left transition-colors before:absolute before:inset-y-1.5 before:left-0 before:w-[3px] before:rounded-r-full before:bg-primary before:opacity-0 before:content-[''] hover:bg-muted/40 focus:bg-muted/40 focus:outline-none ${
        selected
          ? "bg-primary/10 before:opacity-100 hover:bg-primary/15"
          : ""
      }`}
    >
      <span className="flex size-4 shrink-0 items-center justify-center">
        {icon}
      </span>
      <span
        className={`min-w-0 flex-1 truncate text-sm ${
          muted ? "text-muted-foreground" : "text-foreground"
        }`}
      >
        {name}
      </span>
      {date || size ? (
        <span className="hidden shrink-0 items-center gap-4 text-xs tabular-nums text-muted-foreground sm:flex">
          <span className="w-24 text-right">{date ?? ""}</span>
          <span className="w-16 text-right">{size ?? ""}</span>
        </span>
      ) : null}
    </button>
  );
}

function PickerBreadcrumbs({
  path,
  onNavigate,
}: {
  path: string;
  onNavigate(path: string): void;
}) {
  const crumbs = filesBreadcrumbs(path);
  return (
    <div className="flex min-w-0 items-center gap-1 overflow-hidden text-sm">
      <button
        type="button"
        onClick={() => onNavigate("")}
        className={`shrink-0 rounded px-1.5 py-0.5 hover:bg-muted ${
          crumbs.length === 0
            ? "font-medium text-foreground"
            : "text-muted-foreground"
        }`}
      >
        Files
      </button>
      {crumbs.map((crumb, index) => (
        <span key={crumb.path} className="contents">
          <ChevronRight className="size-3.5 shrink-0 text-muted-foreground/60" />
          <button
            type="button"
            onClick={() => onNavigate(crumb.path)}
            className={`truncate rounded px-1.5 py-0.5 hover:bg-muted ${
              index === crumbs.length - 1
                ? "font-medium text-foreground"
                : "text-muted-foreground"
            }`}
          >
            {crumb.name}
          </button>
        </span>
      ))}
    </div>
  );
}

function FilePicker({
  model,
  facts,
  onCancel,
  onPick,
}: {
  model: BrowserAppModel;
  facts: ReadonlySet<string>;
  onCancel(): void;
  onPick(fileId: string): void;
}) {
  const [snapshot, setSnapshot] = useState<FilesPresentationSnapshot | null>(
    null,
  );
  const [selected, setSelected] = useState<{
    key: string;
    file: FilesRecoveredFile;
  } | null>(null);
  const [notice, setNotice] = useState<"sealed" | "cannot-upload" | null>(null);
  const history = usePickerHistory();
  const qfrInstalled = facts.has("qfr.installed");

  useEffect(() => {
    let alive = true;
    void model
      .bountyPresentation()
      .then((next) => {
        if (alive) setSnapshot(next);
      })
      .catch(() => {
        if (alive) setSnapshot({ files: [], vaults: [] });
      });
    return () => {
      alive = false;
    };
  }, [model]);

  useEffect(() => {
    if (notice) return;
    const key = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      onCancel();
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [notice, onCancel]);

  const tree = snapshot
    ? buildFilesTree(snapshot.files, snapshot.vaults, facts)
    : null;
  const node = tree ? findFilesTreeNode(tree, history.path) : null;
  let entries = node ? pickerEntries(node) : [];
  if (history.path === "") {
    entries = [
      {
        kind: "device",
        key: "device:cold-volume",
        sealed: !qfrInstalled,
      },
      ...entries.filter(
        (entry) =>
          entry.kind !== "folder" ||
          entry.node.path !== FILES_COLD_VOLUME_PATH,
      ),
    ];
  }

  const navigate = useCallback(
    (path: string) => {
      if (
        path === FILES_COLD_VOLUME_PATH ||
        path.startsWith(`${FILES_COLD_VOLUME_PATH}/`)
      ) {
        setNotice(qfrInstalled ? "cannot-upload" : "sealed");
        return;
      }
      history.go(path);
      setSelected(null);
    },
    [history.go, qfrInstalled],
  );

  const uploadable = useCallback(
    (file: FilesRecoveredFile) =>
      !isRecoverableFile(file) || isRecoveredFile(file),
    [],
  );

  const openEntry = useCallback(
    (entry: PickerEntry) => {
      if (entry.kind === "folder") navigate(entry.node.path);
      else if (entry.kind === "device")
        setNotice(entry.sealed ? "sealed" : "cannot-upload");
      else if (
        entry.kind === "file" &&
        uploadable(entry.file)
      )
        onPick(entry.file.id);
    },
    [navigate, onPick, uploadable],
  );

  const selectEntry = useCallback(
    (entry: PickerEntry) => {
      setSelected(
        entry.kind === "file" && uploadable(entry.file)
          ? { key: entry.key, file: entry.file }
          : null,
      );
    },
    [uploadable],
  );

  const row = (entry: PickerEntry) => {
    const isSelected = selected?.key === entry.key;
    if (entry.kind === "folder")
      return (
        <PickerRow
          key={entry.key}
          selected={isSelected}
          onSelect={() => selectEntry(entry)}
          onOpen={() => openEntry(entry)}
          icon={<Folder className="size-4 fill-sky-400/10 text-sky-400/90" />}
          name={entry.node.name}
        />
      );
    if (entry.kind === "device")
      return (
        <PickerRow
          key={entry.key}
          selected={isSelected}
          onSelect={() => selectEntry(entry)}
          onOpen={() => openEntry(entry)}
          icon={
            <span className="relative inline-flex size-4">
              <HardDrive className="size-full" />
              {entry.sealed ? (
                <Lock className="absolute bottom-0 right-0 size-[48%] text-amber-500" />
              ) : (
                <LockOpen className="absolute bottom-0 right-0 size-[48%] text-[var(--nori-teal,#5eead4)]" />
              )}
            </span>
          }
          name="归档区"
        />
      );
    if (entry.kind === "vault") {
      const Icon = entry.vault.vaultKind === "file" ? FileArchive : Folder;
      return (
        <PickerRow
          key={entry.key}
          selected={false}
          muted
          onSelect={() => selectEntry(entry)}
          onOpen={() => openEntry(entry)}
          icon={
            <span className="relative">
              <Icon className="size-4 text-muted-foreground" />
              {!entry.vault.unlocked ? (
                <Lock className="absolute -bottom-0.5 -right-0.5 size-2.5 text-amber-500" />
              ) : null}
            </span>
          }
          name={entry.vault.title}
        />
      );
    }
    const locked = !uploadable(entry.file);
    const Icon =
      entry.file.kind === "image"
        ? ImageIcon
        : entry.file.kind === "training-log"
          ? FileArchive
          : FileText;
    return (
      <PickerRow
        key={entry.key}
        selected={isSelected}
        muted={locked}
        onSelect={() => selectEntry(entry)}
        onOpen={() => openEntry(entry)}
        icon={
          locked ? (
            <span className="relative">
              <FileText className="size-4 text-muted-foreground" />
              <Lock className="absolute -bottom-0.5 -right-0.5 size-2.5 text-amber-500" />
            </span>
          ) : (
            <Icon
              className={`size-4 ${
                entry.file.launch === "qfr"
                  ? "text-[#4ee0c8]"
                  : "text-muted-foreground"
              }`}
            />
          )
        }
        name={entry.file.name}
        date={pickerFormatDate(entry.file.modifiedAt)}
        size={pickerFormatBytes(entry.file.sizeBytes)}
      />
    );
  };

  const favorites = [
    { path: "下载", label: "Downloads" },
    { path: "文稿", label: "Documents" },
    { path: "图片", label: "Pictures" },
  ];

  return (
    <>
      <div
        className="fixed inset-0 z-[10020] grid place-items-center bg-black/45 p-3"
        role="presentation"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) onCancel();
        }}
      >
        <div
          className="flex h-[min(32rem,calc(100%-1rem))] w-[min(44rem,calc(100%-1rem))] flex-col overflow-hidden rounded-2xl border border-border bg-popover text-popover-foreground shadow-2xl"
          role="dialog"
          aria-modal="true"
          aria-label="选择要上传的文件"
        >
          <div className="shrink-0 border-b border-border/50 px-5 py-3">
            <h2 className="text-sm font-semibold leading-snug">
              选择要上传的文件
            </h2>
          </div>
          <div className="flex min-h-0 flex-1 overflow-hidden">
            <aside className="hidden w-48 shrink-0 overflow-y-auto border-r border-border/50 bg-muted/15 sm:block">
              <nav className="px-2 pt-3">
                <button
                  type="button"
                  onClick={() => navigate("")}
                  className={`w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-muted/60 ${
                    history.path === "" ? "bg-muted/60" : ""
                  }`}
                >
                  Files
                </button>
              </nav>
              <div className="px-3 pb-1.5 pt-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                Favorites
              </div>
              <nav className="px-2 pb-3">
                {favorites.map((favorite) => (
                  <button
                    type="button"
                    key={favorite.path}
                    onClick={() => navigate(favorite.path)}
                    className={`w-full rounded-lg px-3 py-1.5 text-left text-sm hover:bg-muted/60 ${
                      history.path === favorite.path ? "bg-muted/60" : ""
                    }`}
                  >
                    {favorite.label}
                  </button>
                ))}
              </nav>
              <div className="px-3 pb-1.5 pt-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                Devices
              </div>
              <nav className="px-2 pb-3">
                <button
                  type="button"
                  onClick={() => navigate(FILES_COLD_VOLUME_PATH)}
                  className="w-full rounded-lg px-3 py-1.5 text-left text-sm hover:bg-muted/60"
                >
                  Cold Volume
                </button>
              </nav>
            </aside>
            <div className="flex min-w-0 flex-1 flex-col">
              <div className="flex shrink-0 items-center gap-2 border-b border-border/50 bg-muted/15 px-3 py-2">
                <div className="inline-flex items-center rounded-lg bg-muted/40 p-0.5 ring-1 ring-inset ring-border/60">
                  <button
                    type="button"
                    disabled={!history.canBack}
                    onClick={history.back}
                    className="flex size-7 items-center justify-center rounded-[7px] text-muted-foreground hover:bg-background/50 disabled:opacity-40"
                    aria-label="后退"
                    title="后退"
                  >
                    <ArrowLeft className="size-4" />
                  </button>
                  <span className="mx-px h-4 w-px bg-border/60" />
                  <button
                    type="button"
                    disabled={!history.canForward}
                    onClick={history.forward}
                    className="flex size-7 items-center justify-center rounded-[7px] text-muted-foreground hover:bg-background/50 disabled:opacity-40"
                    aria-label="前进"
                    title="前进"
                  >
                    <ArrowRight className="size-4" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => navigate("")}
                  disabled={history.path === ""}
                  className="flex size-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted/60 disabled:opacity-40"
                  aria-label="主目录"
                  title="主目录"
                >
                  <Home className="size-4" />
                </button>
                <div className="min-w-0 flex-1">
                  <PickerBreadcrumbs
                    path={history.path}
                    onNavigate={navigate}
                  />
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2.5 border-b border-border/50 bg-muted/10 px-4 py-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
                <span className="size-4 shrink-0" />
                <span className="min-w-0 flex-1">名称</span>
                <span className="hidden shrink-0 items-center gap-4 sm:flex">
                  <span className="w-24 text-right">修改日期</span>
                  <span className="w-16 text-right">大小</span>
                </span>
              </div>
              <div className="min-h-0 flex-1 overflow-auto">
                {snapshot === null ? (
                  <div className="flex h-full items-center justify-center py-10">
                    <LoaderCircle className="size-5 animate-spin text-muted-foreground/70" />
                  </div>
                ) : !node || entries.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center gap-3 py-10 text-center">
                    <Folder className="size-10 text-muted-foreground/40" />
                    <div className="text-sm text-muted-foreground">
                      此文件夹为空
                    </div>
                  </div>
                ) : (
                  entries.map(row)
                )}
              </div>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-3 border-t border-border/50 px-5 py-3">
            <div className="min-w-0 flex-1 truncate text-[13px]">
              {selected ? (
                <span className="text-foreground">{selected.file.name}</span>
              ) : (
                <span className="text-muted-foreground">未选择文件</span>
              )}
            </div>
            <button
              type="button"
              onClick={onCancel}
              className="rounded-md px-3 py-1.5 text-sm hover:bg-muted"
            >
              取消
            </button>
            <button
              type="button"
              disabled={!selected}
              onClick={() => selected && onPick(selected.file.id)}
              className="rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground disabled:opacity-45"
            >
              上传
            </button>
          </div>
        </div>
      </div>
      {notice ? (
        <PickerNotice kind={notice} onClose={() => setNotice(null)} />
      ) : null}
    </>
  );
}

export function BrowserBountyExtension({
  model,
  facts,
  pageUrl,
  submittable,
  playCue,
}: BrowserBountyExtensionProps) {
  const installed = facts.has("bounty.ext_installed");
  const progress = browserBountyProgress(facts);
  const previousInstalled = useRef(installed);
  const previousJackpot = useRef(facts.has("arg.honeypot_access"));
  const pageRef = useRef(pageUrl);
  pageRef.current = pageUrl;

  const root = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [welcome, setWelcome] = useState(false);
  const [detectedPage, setDetectedPage] = useState<string | null>(null);
  const [seenPages, setSeenPages] = useState(() => new Set<string>());
  const [claimedEvidence, setClaimedEvidence] = useState(
    () => new Set<string>(),
  );
  const [submitState, setSubmitState] = useState<SubmitState>("rest");
  const [submitKind, setSubmitKind] = useState<SubmitKind | null>(null);
  const [submitPage, setSubmitPage] = useState<string | null>(null);
  const [error, setError] = useState<SubmitError | null>(null);

  useEffect(() => {
    if (!previousInstalled.current && installed) {
      playCue?.("webapps-bounty-detect-bubble", { duckMusic: true });
      setWelcome(true);
    }
    previousInstalled.current = installed;
  }, [installed, playCue]);

  useEffect(() => {
    const jackpot = facts.has("arg.honeypot_access");
    if (!previousJackpot.current && jackpot) {
      playCue?.("webapps-bounty-jackpot", { duckMusic: true });
      setOpen(true);
    }
    previousJackpot.current = jackpot;
  }, [facts, playCue]);

  useEffect(() => {
    if (!submittable || !pageUrl || seenPages.has(pageUrl)) return;
    const target = pageUrl;
    const timer = window.setTimeout(() => {
      setSeenPages((current) => new Set(current).add(target));
      if (!progress.complete) {
        playCue?.("webapps-bounty-detect-bubble", { duckMusic: true });
        setDetectedPage(target);
      }
    }, BOUNTY_DETECT_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [pageUrl, playCue, progress.complete, seenPages, submittable]);

  useEffect(() => {
    if (!detectedPage) return;
    const timer = window.setTimeout(
      () => setDetectedPage(null),
      BOUNTY_TOAST_MS,
    );
    return () => window.clearTimeout(timer);
  }, [detectedPage]);

  useEffect(() => {
    if (!welcome) return;
    const timer = window.setTimeout(() => setWelcome(false), BOUNTY_TOAST_MS);
    return () => window.clearTimeout(timer);
  }, [welcome]);

  useEffect(() => {
    if (submitState !== "success" && submitState !== "fail") return;
    const timer = window.setTimeout(
      () => {
        setSubmitState("rest");
        setSubmitKind(null);
        setSubmitPage(null);
        setError(null);
      },
      submitState === "success" ? 1_700 : 1_900,
    );
    return () => window.clearTimeout(timer);
  }, [submitState]);

  useEffect(() => {
    if (!open || pickerOpen) return;
    const onMouseDown = (event: MouseEvent) => {
      if (root.current && !root.current.contains(event.target as Node))
        setOpen(false);
    };
    const onBlur = () => setOpen(false);
    document.addEventListener("mousedown", onMouseDown);
    window.addEventListener("blur", onBlur);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("blur", onBlur);
    };
  }, [open, pickerOpen]);

  const dismissToast = useCallback(() => {
    setDetectedPage(null);
    setWelcome(false);
  }, []);

  const submit = useCallback(
    async (
      payload: { url?: string; fileId?: string },
      kind: SubmitKind,
    ) => {
      if (submitState !== "rest") return;
      const evidence = payload.url ?? payload.fileId;
      if (!evidence) return;
      const capturedPage = pageUrl;
      const before = new Set(facts);
      setOpen(true);
      setSubmitKind(kind);
      setSubmitPage(kind === "page" ? capturedPage : null);
      setError(null);
      setSubmitState("submitting");

      let result: BrowserBountySubmitResult;
      try {
        result = await model.submitBounty(payload);
      } catch {
        result = { ok: false };
      }

      if (result.ok)
        setClaimedEvidence((current) => new Set(current).add(evidence));

      if (kind === "page" && pageRef.current !== capturedPage) {
        setSubmitState("rest");
        setSubmitKind(null);
        setSubmitPage(null);
        return;
      }

      if (result.ok) {
        if (result.fact && before.has(result.fact)) {
          setError({
            title:
              kind === "page"
                ? "本页返现已领取过"
                : "该返现已领取过",
          });
          playCue?.("webapps-bounty-submit-fail");
          setSubmitState("fail");
        } else {
          playCue?.("webapps-bounty-submit-success");
          setSubmitState("success");
        }
      } else {
        setError({
          title:
            kind === "page"
              ? "本页不是返现页面"
              : "该文件不是返现订单",
          sub: "换一个再试试",
        });
        playCue?.("webapps-bounty-submit-fail");
        setSubmitState("fail");
      }
    },
    [facts, model, pageUrl, playCue, submitState],
  );

  const pageSeen = seenPages.has(pageUrl);
  const pageClaimed = claimedEvidence.has(pageUrl);
  const alert = pageSeen && !progress.complete;
  const pulse = alert && !pageClaimed;
  const visibleSubmit =
    submitState !== "rest" && (submitPage === null || submitPage === pageUrl);
  const toast =
    welcome
      ? "省钱喵 已就位，帮你盯紧优惠！"
      : !open && detectedPage === pageUrl && !progress.complete
        ? "本页侦测到优惠！"
        : null;

  const progressText = progress.complete
    ? `已返 ${BOUNTY_TARGET_COUNT}/${BOUNTY_TARGET_COUNT} 单`
    : `已返 ${progress.count}/${BOUNTY_TARGET_COUNT} 单，再返 ${BOUNTY_TARGET_COUNT - progress.count} 单解锁尊享会员`;

  const panel = progress.complete && submitState === "rest" ? (
    <div className="qm-pop">
      <div className="qm-head">
        <BrowserBountyConfetti />
        <div className="qm-brand">
          <BrowserBountyCat mood="happy" size={40} />
          <div className="qm-word">
            <span className="qm-word__zh">省钱喵</span>
            <span className="qm-word__tag">购物自动找优惠</span>
          </div>
        </div>
        <div className="qm-prog">
          <div className="qm-prog__line">
            已返 <b>{BOUNTY_TARGET_COUNT}/{BOUNTY_TARGET_COUNT}</b> 单
          </div>
          <div className="qm-track">
            <div className="qm-fill" style={{ width: "100%" }} />
          </div>
        </div>
      </div>
      <div className="qm-body">
        <div className="qm-celebrate">
          <div className="qm-cel-title">恭喜解锁尊享会员！</div>
          <div className="qm-cel-sub">大额返现已到账</div>
        </div>
        <div className="qm-foot">
          匿名 <code>{BOUNTY_ANON_ID}</code>
        </div>
      </div>
    </div>
  ) : (
    <div className={`qm-pop ${submitState === "fail" ? "is-shake" : ""}`}>
      <div className="qm-head">
        {visibleSubmit && submitState === "success" ? (
          <BrowserBountyConfetti />
        ) : null}
        <div className="qm-brand">
          <BrowserBountyCat
            mood={visibleSubmit && submitState === "success" ? "happy" : "base"}
            size={40}
          />
          <div className="qm-word">
            <span className="qm-word__zh">省钱喵</span>
            <span className="qm-word__tag">购物自动找优惠</span>
          </div>
        </div>
        <div className="qm-prog">
          <div className="qm-prog__line">
            已返 <b>{progress.count}/{BOUNTY_TARGET_COUNT}</b> 单，再返{" "}
            <b>{BOUNTY_TARGET_COUNT - progress.count}</b> 单解锁尊享会员
          </div>
          <div className="qm-track">
            <div
              className="qm-fill"
              style={{
                width: `${(progress.count / BOUNTY_TARGET_COUNT) * 100}%`,
              }}
            />
          </div>
        </div>
      </div>
      <div className="qm-body">
        {visibleSubmit && submitState === "success" ? (
          <div className="qm-panel qm-panel--success">
            <BrowserBountyCat mood="happy" size={34} />
            <div className="qm-big">领取成功！</div>
            <div className="qm-sub">返现已到账</div>
          </div>
        ) : visibleSubmit && submitState === "fail" && error ? (
          <div className="qm-panel qm-panel--fail">
            <BrowserBountyCat mood="sad" size={34} />
            <div className="qm-flag qm-flag--fail">{error.title}</div>
            {error.sub ? <div className="qm-sub">{error.sub}</div> : null}
          </div>
        ) : pageSeen && pageClaimed ? (
          <div className="qm-panel">
            <div className="qm-flag qm-flag--claimed">
              ✓ 本页优惠已领取
            </div>
          </div>
        ) : pageSeen ? (
          <div className="qm-panel">
            <div className="qm-flag">
              <span className="qm-flag__tk">🎟</span>
              本页侦测到优惠！
            </div>
          </div>
        ) : null}

        <div className="qm-stack">
          <button
            type="button"
            disabled={submitState !== "rest"}
            onClick={() => void submit({ url: pageUrl }, "page")}
            className="qm-btn qm-btn--primary"
          >
            <span className="qm-btn__lbl">
              {submitState === "submitting" && submitKind === "page" ? (
                <>
                  <span className="qm-spin" /> 领取中…
                </>
              ) : (
                "领取本页返现"
              )}
            </span>
          </button>
          <button
            type="button"
            disabled={submitState !== "rest"}
            onClick={() => setPickerOpen(true)}
            className="qm-btn qm-btn--ghost"
          >
            <span className="qm-btn__lbl">
              {submitState === "submitting" && submitKind === "file" ? (
                <>
                  <span className="qm-spin" /> 领取中…
                </>
              ) : (
                "上传小票返现"
              )}
            </span>
          </button>
        </div>
        <div className="qm-foot">
          匿名 <code>{BOUNTY_ANON_ID}</code>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {installed ? (
        <div ref={root} className="qm relative flex items-center">
          <button
            type="button"
            aria-label="省钱喵"
            title="省钱喵"
            onClick={() => {
              setOpen((value) => !value);
              dismissToast();
            }}
            className={`qm-icon ${alert ? "qm-icon--alert" : ""} ${
              pulse ? "qm-icon--pulse" : ""
            } ${open ? "is-open" : ""}`}
          >
            <BrowserBountyCat
              bare
              size={20}
              tone={alert ? "white" : "pink"}
            />
            {pulse ? <span className="qm-icon__dot" /> : null}
          </button>

          {toast ? (
            <div className="absolute right-0 top-[calc(100%+6px)] z-20">
              <div className="qm-toast" role="status">
                <BrowserBountyCat size={30} />
                <button
                  type="button"
                  className="qm-toast__txt"
                  onClick={() => {
                    setOpen(true);
                    dismissToast();
                  }}
                >
                  {toast}
                </button>
              </div>
            </div>
          ) : null}

          {open ? (
            <div className="absolute right-0 top-[calc(100%+6px)] z-30">
              {panel}
            </div>
          ) : null}
        </div>
      ) : null}

      {pickerOpen ? (
        <FilePicker
          model={model}
          facts={facts}
          onCancel={() => setPickerOpen(false)}
          onPick={(fileId) => {
            setPickerOpen(false);
            void submit({ fileId }, "file");
          }}
        />
      ) : null}
    </>
  );
}
