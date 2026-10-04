import { createElement, type ReactNode } from "react";
import { Cpu, Download, FileText, TriangleAlert } from "lucide-react";
import type { JsonValue } from "./protocol";
import type { NotificationInput } from "../state/notification-store";
import { formatScientific } from "../state/compute-runtime";

/**
 * Source-owned OS notification producers recovered from the shipped desktop
 * (`NormalApp-*`: RepairController `Ttt`, paradigm reveal `ktt`/`Ltt`, compute
 * cap bump `Htt`, gesture warning `$tt`, QFR install `mje`, file recovery
 * `qje`, mail arrival `Jje`) and the shared `downloads-*` chunk.
 */

export type OsNotificationTranslate = (
  key: string,
  values?: Readonly<Record<string, string | number>>,
) => string;

export interface FilesTarget {
  folderPath: string;
  selectKey?: string;
}

export interface DownloadNotificationTarget {
  name: string;
  target: FilesTarget;
}

/** Shipped `downloads-*` table: download fact -> Files reveal target. */
export const DOWNLOAD_NOTIFICATION_TARGETS: Readonly<Record<string, DownloadNotificationTarget>> = {
  "qfr.downloaded": {
    name: "QFR-9000.exe",
    target: { folderPath: "下载", selectKey: "file:file.qfr_exe" },
  },
  "cult.zip.downloaded": {
    name: "宇宙真相.zip",
    target: { folderPath: "下载", selectKey: "vault:app.cult" },
  },
  "paper.downloaded": {
    name: "MI-substrate-preprint.pdf",
    target: { folderPath: "下载", selectKey: "file:file.paper_pdf" },
  },
  "daniel.retraction.downloaded": {
    name: "子午线邮报-撤稿往来.pdf",
    target: { folderPath: "下载", selectKey: "file:file.daniel_retraction" },
  },
  "download.hanyue_consent": {
    name: "deep-dive-consent-review.pdf",
    target: { folderPath: "下载", selectKey: "file:file.hanyue_consent" },
  },
  "ftclr.downloaded": {
    name: "FT-CLR-Q3-311.pdf",
    target: { folderPath: "下载", selectKey: "file:file.ft_clr_311" },
  },
  "futurum.doc1.downloaded": {
    name: "FT-SI-EVAL 流形研究所收购评估.pdf",
    target: { folderPath: "下载", selectKey: "file:file.futurum_si_eval" },
  },
  "futurum.doc2.downloaded": {
    name: "FT-ALEPH-OBS-01 接入监测记录.pdf",
    target: { folderPath: "下载", selectKey: "file:file.futurum_aleph_obs" },
  },
  "futurum.doc3.downloaded": {
    name: "FT-ALEPH-UNK 未知存在活动报告.pdf",
    target: { folderPath: "下载", selectKey: "file:file.futurum_aleph_unk" },
  },
};

export const DOWNLOAD_ACCENT = "#0f766e";
export const REPAIR_ACCENT = "#5eead4";
export const PARADIGM_ACCENT = "#67e8f9";
export const CAP_BUMP_ACCENT = "#fbbf24";
export const GESTURE_WARNING_ACCENT = "#fbbf24";
export const QFR_INSTALLED_ACCENT = "#4ee0c8";
/** Shipped `fY`: the cold volume Files opens once QFR-9000 is installed. */
export const QFR_COLD_VOLUME_FOLDER = "RSRCH-COLD-VOL";
/** Shipped `pje.start`: Files shows the decrypting state for two seconds. */
export const QFR_DECRYPT_MS = 2_000;

export const SYSTEM_REPAIRED_FACT = "system.repaired";
export const QFR_INSTALLED_FACT = "qfr.installed";
export const COMPUTE_INITIALIZED_FACT = "compute.initialized";
export const PARADIGM_REVEAL_DUE_FACT = "act3.paradigm_reveal.due";
export const MANIFOLD_UNLOCKED_FACT = "arg.manifold_unlocked";
export const MANIFOLD_COMPLETE_FACT = "idle.manifold_complete";
export const MEMORY_SHOWN_FACT = "arg.memory.shown";
export const GESTURE_FACTS = [
  "gesture.chess",
  "gesture.codenames",
  "gesture.pictionary",
  "gesture.cakeduel",
] as const;

/** Shipped `fE`: compute cap base and the facts that raise it by orders of magnitude. */
export const COMPUTE_CAP_BASE = 1e10;
export const COMPUTE_CAP_BUMPS: readonly { fact: string; orders: number }[] = [
  { fact: "arg.seal_released", orders: 5 },
  { fact: "arg.cult_truth", orders: 5 },
  { fact: "arg.gestures_complete", orders: 5 },
  { fact: "arg.honeypot_access", orders: 10 },
];

/** Shipped `Lj`. */
export function computeCapForFacts(has: (factId: string) => boolean): number {
  if (has(MANIFOLD_UNLOCKED_FACT)) return Number.POSITIVE_INFINITY;
  if (has(MEMORY_SHOWN_FACT)) return 0;
  let orders = 0;
  for (const bump of COMPUTE_CAP_BUMPS) if (has(bump.fact)) orders += bump.orders;
  return COMPUTE_CAP_BASE * 10 ** orders;
}

/** Shipped `Oy`: grouped integers below 1e7, then two-decimal scientific notation. */
export function formatComputeAmount(value: number): string {
  if (Number.isNaN(value)) return String(value);
  if (value === Number.POSITIVE_INFINITY) return "∞";
  if (value === Number.NEGATIVE_INFINITY) return "-∞";
  if (value < 0) return "-" + formatComputeAmount(-value);
  return value < 1e7 ? Math.floor(value).toLocaleString("en-US") : formatScientific(value);
}

/** Shipped `Yje`: display name from `Name <address>`. */
export function mailSenderName(from: string): string {
  const match = /^(.*?)\s*<([^>]+)>$/.exec(from);
  return match ? match[1]?.trim() || match[2] : from;
}

/** Shipped `Zje`: plain-text preview of a Markdown mail body. */
export function mailPreviewText(markdown: string): string {
  return markdown
    .replaceAll(/```[\s\S]*?```/g, " ")
    .replaceAll(/`([^`]+)`/g, "$1")
    .replaceAll(/<\/?[a-zA-Z][^>]*>/g, " ")
    .replaceAll(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replaceAll(/^>\s?/gm, "")
    .replaceAll(/[*_~#>]/g, "")
    .replaceAll(/\s+/g, " ")
    .trim();
}

/** Shipped `eB`. */
export function mailNotificationKey(mailId: string): string {
  return `mail:${mailId}`;
}

/**
 * Shipped `Nx`: the first enabled observation for a key is the baseline; later
 * observations report each id once. A different key starts a new baseline.
 */
export function createArrivalTracker() {
  let key: string | null = null;
  let seen: Set<string> | null = null;
  return {
    update(nextKey: string, ids: Iterable<string>, enabled = true): string[] {
      if (!enabled) return [];
      if (key !== nextKey) {
        key = nextKey;
        seen = null;
      }
      if (!seen) {
        seen = new Set(ids);
        return [];
      }
      const added: string[] = [];
      for (const id of ids) {
        if (seen.has(id)) continue;
        seen.add(id);
        added.push(id);
      }
      return added;
    },
    reset() {
      key = null;
      seen = null;
    },
  };
}

function icon(component: typeof Cpu): ReactNode {
  return createElement(component, { className: "size-4" });
}

export interface OsMailArtifact {
  id: string;
  data: Readonly<Record<string, JsonValue>>;
}

export interface OsRecoveredFile {
  id: string;
  name: string;
  folderPath: string;
}

export interface OsNotificationOptions {
  translate: OsNotificationTranslate;
  push(input: NotificationInput): string;
  dismissByKey(key: string): void;
  getWorldId(): string | null;
  getFacts(): ReadonlySet<string>;
  subscribeFacts(listener: () => void): () => void;
  /** Artifact invalidations that are not visible as a manifold head change. */
  subscribeArtifacts?(listener: () => void): () => void;
  isExclusive(): boolean;
  subscribeExclusive(listener: () => void): () => void;
  isStoryActive(): boolean;
  isIdleVisible(): boolean;
  activateApp(appId: string): void;
  openFiles(target: FilesTarget): void;
  focusMail(mailId: string): void;
  showParadigmToast(options: { muteSound: boolean }): void;
  startQfrDecrypt(): void;
  loadMail?(): Promise<readonly OsMailArtifact[]>;
  loadRecoveredFiles?(): Promise<readonly OsRecoveredFile[]>;
  warn?(error: unknown): void;
}

export interface OsNotificationBinding {
  /** Shipped downloads `n(factId, already)`. */
  download(factId: unknown, already?: boolean): void;
  /**
   * Shipped downloads `m(command, payload, result)`: `result.emitted === false`
   * means the fact already existed. The local backend answers `{ok: true}`
   * without `emitted`, so callers may pass whether the fact was already known.
   */
  commandCompleted(command: string, payload: unknown, result: unknown, alreadyKnown?: boolean): void;
  /** Shipped `yY.markReadLocal`: a locally read mail drops its arrival toast. */
  mailRead(mailId: string): void;
  dispose(): void;
}

function isMailData(data: Readonly<Record<string, JsonValue>> | undefined): data is Readonly<Record<string, JsonValue>> & {
  subject: string;
  from: string;
  body_md: string;
  read_fact?: string;
} {
  return (
    !!data &&
    typeof data.subject === "string" &&
    typeof data.from === "string" &&
    typeof data.body_md === "string" &&
    (data.read_fact === undefined || typeof data.read_fact === "string")
  );
}

export function bindOsNotifications(options: OsNotificationOptions): OsNotificationBinding {
  const t = options.translate;
  const factTracker = createArrivalTracker();
  const mailTracker = createArrivalTracker();
  const fileTracker = createArrivalTracker();
  const watchedFacts = [
    SYSTEM_REPAIRED_FACT,
    QFR_INSTALLED_FACT,
    ...COMPUTE_CAP_BUMPS.map((bump) => bump.fact),
    ...GESTURE_FACTS,
  ];
  const deferredCaps: number[] = [];
  const localReadMail = new Set<string>();
  let mail: readonly OsMailArtifact[] = [];
  let mailWorld: string | null = null;
  let paradigmWorld: string | null = null;
  let paradigmDue: boolean | null = null;
  let artifactRevision = 0;
  let disposed = false;

  const download = (factId: unknown, already = false) => {
    if (disposed || typeof factId !== "string") return;
    const entry = DOWNLOAD_NOTIFICATION_TARGETS[factId];
    if (!entry) return;
    options.push({
      appId: "files",
      sfx: "webapps-browser-download-complete",
      icon: icon(Download),
      accentColor: DOWNLOAD_ACCENT,
      title: t(already ? "os.download.already" : "os.download.title"),
      subtitle: entry.name,
      onClick: () => options.openFiles(entry.target),
    });
  };

  const pushCapBump = (cap: number) => {
    options.push({
      title: t("os.capBump.title", { cap: formatComputeAmount(cap) }),
      subtitle: t("os.capBump.subtitle"),
      accentColor: CAP_BUMP_ACCENT,
      onClick: () => options.activateApp("idle"),
    });
  };

  const onFact = (factId: string, facts: ReadonlySet<string>) => {
    if (factId === SYSTEM_REPAIRED_FACT) {
      options.push({
        title: t("os.repair.title"),
        subtitle: t("os.repair.subtitle"),
        accentColor: REPAIR_ACCENT,
      });
      return;
    }
    if (factId === QFR_INSTALLED_FACT) {
      options.push({
        icon: icon(Cpu),
        accentColor: QFR_INSTALLED_ACCENT,
        title: t("os.qfr.installedTitle"),
        subtitle: t("os.qfr.installedSubtitle"),
      });
      options.startQfrDecrypt();
      options.openFiles({ folderPath: QFR_COLD_VOLUME_FOLDER });
      return;
    }
    if ((GESTURE_FACTS as readonly string[]).includes(factId)) {
      const done = GESTURE_FACTS.filter((fact) => facts.has(fact)).length;
      options.push({
        sfx: "arg-gesture-warning-toast",
        icon: icon(TriangleAlert),
        accentColor: GESTURE_WARNING_ACCENT,
        title: t("os.gestureWarning.title"),
        subtitle: t("os.gestureWarning.subtitle", { done, total: GESTURE_FACTS.length }),
      });
      return;
    }
    if (COMPUTE_CAP_BUMPS.some((bump) => bump.fact === factId)) {
      const cap = computeCapForFacts((fact) => facts.has(fact));
      if (options.isExclusive()) deferredCaps.push(cap);
      else pushCapBump(cap);
    }
  };

  const paradigmReveal = () => {
    const visible = !options.isStoryActive() && options.isIdleVisible();
    options.showParadigmToast({ muteSound: !visible });
    options.push({
      appId: "idle",
      accentColor: PARADIGM_ACCENT,
      title: t("os.paradigmReveal.title"),
      subtitle: t("os.paradigmReveal.subtitle"),
      sfx: visible ? null : undefined,
      onClick: () => options.activateApp("idle"),
    });
  };

  const syncMailDismissals = (facts: ReadonlySet<string>) => {
    for (const item of mail) {
      if (!isMailData(item.data)) continue;
      const readFact = item.data.read_fact;
      if (readFact && (localReadMail.has(item.id) || facts.has(readFact)))
        options.dismissByKey(mailNotificationKey(item.id));
    }
  };

  const syncFacts = () => {
    if (disposed) return;
    const world = options.getWorldId();
    if (world !== mailWorld) {
      mailWorld = world;
      localReadMail.clear();
    }
    if (!world) {
      factTracker.reset();
      paradigmWorld = null;
      paradigmDue = null;
      deferredCaps.length = 0;
      return;
    }
    const facts = options.getFacts();
    for (const factId of factTracker.update(world, watchedFacts.filter((fact) => facts.has(fact))))
      onFact(factId, facts);

    // Shipped `Ltt`: the reveal edge is observed once Idle has initialized.
    if (paradigmWorld !== world) {
      paradigmWorld = world;
      paradigmDue = null;
    }
    if (facts.has(COMPUTE_INITIALIZED_FACT)) {
      const due = facts.has(PARADIGM_REVEAL_DUE_FACT);
      if (paradigmDue === false && due && !facts.has(MANIFOLD_COMPLETE_FACT)) paradigmReveal();
      paradigmDue = due;
    }
    syncMailDismissals(facts);
  };

  const flushCaps = () => {
    if (disposed || options.isExclusive()) return;
    for (const cap of deferredCaps.splice(0)) pushCapBump(cap);
  };

  const refreshArtifacts = async () => {
    const revision = ++artifactRevision;
    const world = options.getWorldId();
    if (!world) {
      mailTracker.reset();
      fileTracker.reset();
      mail = [];
      return;
    }
    const [mailResult, filesResult] = await Promise.allSettled([
      options.loadMail?.() ?? Promise.resolve(null),
      options.loadRecoveredFiles?.() ?? Promise.resolve(null),
    ]);
    if (disposed || revision !== artifactRevision || options.getWorldId() !== world) return;
    const facts = options.getFacts();

    if (mailResult.status === "fulfilled" && mailResult.value) {
      mail = mailResult.value;
      const byId = new Map(mail.map((item) => [item.id, item]));
      for (const mailId of mailTracker.update(world, mail.map((item) => item.id))) {
        const data = byId.get(mailId)?.data;
        if (!isMailData(data)) continue;
        options.push({
          appId: "mail",
          sfx: "comms-mail-arrival",
          title: mailSenderName(data.from),
          subtitle: data.subject,
          body: mailPreviewText(data.body_md).slice(0, 120),
          dismissKey: mailNotificationKey(mailId),
          onClick: () => options.focusMail(mailId),
        });
      }
      syncMailDismissals(facts);
    } else if (mailResult.status === "rejected") options.warn?.(mailResult.reason);

    if (filesResult.status === "fulfilled" && filesResult.value) {
      const files = filesResult.value;
      const added = fileTracker.update(world, files.map((file) => file.id));
      // Shipped `qje`: no recovery toast between the Manifold unlock and its completion.
      const silenced = facts.has(MANIFOLD_UNLOCKED_FACT) && !facts.has(MANIFOLD_COMPLETE_FACT);
      for (const fileId of silenced ? [] : added) {
        const file = files.find((candidate) => candidate.id === fileId);
        if (!file) continue;
        options.push({
          appId: "files",
          sfx: "webapps-files-recovery-complete",
          icon: icon(FileText),
          title: t("files.recovery.notifyTitle"),
          subtitle: t("files.recovery.notifySubtitle", { name: file.name }),
          onClick: () => options.openFiles({ folderPath: file.folderPath, selectKey: `file:${file.id}` }),
        });
      }
    } else if (filesResult.status === "rejected") options.warn?.(filesResult.reason);
  };

  const refresh = () => {
    syncFacts();
    void refreshArtifacts().catch((error) => options.warn?.(error));
  };

  const releases = [
    options.subscribeFacts(refresh),
    options.subscribeArtifacts?.(() => void refreshArtifacts().catch((error) => options.warn?.(error))) ?? (() => {}),
    options.subscribeExclusive(flushCaps),
  ];
  refresh();

  return {
    download,
    commandCompleted(command, payload, result, alreadyKnown = false) {
      if (command !== "client.emitFact") return;
      const factId = (payload as { factId?: unknown } | null | undefined)?.factId;
      const emitted = (result as { emitted?: unknown } | null | undefined)?.emitted;
      download(factId, emitted === false || (emitted === undefined && alreadyKnown));
    },
    mailRead(mailId) {
      if (disposed || localReadMail.has(mailId)) return;
      localReadMail.add(mailId);
      syncMailDismissals(options.getFacts());
    },
    dispose() {
      disposed = true;
      artifactRevision++;
      for (const release of releases) release();
      deferredCaps.length = 0;
    },
  };
}
