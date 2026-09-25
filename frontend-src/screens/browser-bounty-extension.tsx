import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { FileText, LoaderCircle, Lock, X } from "lucide-react";
import type {
  BrowserAppModel,
  BrowserBountyFile,
  BrowserBountySubmitResult,
} from "../apps/browser";

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
}: {
  mood?: "base" | "happy" | "sad";
  size?: number;
  tone?: "white" | "pink";
}) {
  const fill = tone === "pink" ? "#ff2e88" : "#fff";
  return (
    <svg
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

function FilePicker({
  model,
  onCancel,
  onPick,
}: {
  model: BrowserAppModel;
  onCancel(): void;
  onPick(fileId: string): void;
}) {
  const [files, setFiles] = useState<BrowserBountyFile[] | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    void model
      .bountyFiles()
      .then((next) => {
        if (alive) setFiles(next);
      })
      .catch(() => {
        if (alive) setFiles([]);
      });
    return () => {
      alive = false;
    };
  }, [model]);

  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      onCancel();
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [onCancel]);

  const selectedFile = files?.find((file) => file.id === selected) ?? null;
  return (
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
        <div className="flex shrink-0 items-center justify-between border-b border-border/50 px-5 py-3">
          <h2 className="text-sm font-semibold">选择要上传的文件</h2>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md p-1 text-muted-foreground hover:bg-muted"
            aria-label="关闭"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="grid grid-cols-[minmax(0,1fr)_9rem] border-b border-border/50 bg-muted/10 px-4 py-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
          <span>名称</span>
          <span className="text-right">位置</span>
        </div>
        <div className="min-h-0 flex-1 overflow-auto">
          {files === null ? (
            <div className="grid h-full place-items-center">
              <LoaderCircle className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : files.length === 0 ? (
            <div className="grid h-full place-items-center text-sm text-muted-foreground">
              没有可用文件
            </div>
          ) : (
            files.map((file) => (
              <button
                key={file.id}
                type="button"
                disabled={file.locked}
                onClick={() => setSelected(file.id)}
                onDoubleClick={() => {
                  if (!file.locked) onPick(file.id);
                }}
                className={`grid w-full grid-cols-[minmax(0,1fr)_9rem] items-center border-b border-border/40 px-4 py-2 text-left transition-colors ${
                  selected === file.id
                    ? "bg-primary/10"
                    : "hover:bg-muted/40"
                } disabled:opacity-45`}
              >
                <span className="flex min-w-0 items-center gap-2.5">
                  <span className="relative shrink-0">
                    <FileText className="size-4 text-muted-foreground" />
                    {file.locked ? (
                      <Lock className="absolute -bottom-1 -right-1 size-2.5 text-amber-500" />
                    ) : null}
                  </span>
                  <span className="truncate text-sm">{file.name}</span>
                </span>
                <span className="truncate text-right text-xs text-muted-foreground">
                  {file.path}
                </span>
              </button>
            ))
          )}
        </div>
        <div className="flex shrink-0 items-center gap-3 border-t border-border/50 px-5 py-3">
          <div className="min-w-0 flex-1 truncate text-[13px]">
            {selectedFile ? selectedFile.name : (
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
            disabled={!selectedFile || selectedFile.locked}
            onClick={() => selectedFile && onPick(selectedFile.id)}
            className="rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground disabled:opacity-45"
          >
            上传
          </button>
        </div>
      </div>
    </div>
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
    <div className="w-80 overflow-hidden rounded-xl border border-pink-300/40 bg-[#ff4f9a] text-white shadow-2xl">
      <div className="bg-[#d80f68] p-4">
        <div className="flex items-center gap-3">
          <BrowserBountyCat mood="happy" size={40} />
          <div>
            <div className="text-lg font-black">省钱喵</div>
            <div className="text-xs text-white/80">购物自动找优惠</div>
          </div>
        </div>
        <div className="mt-3 text-xs">{progressText}</div>
        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/25">
          <div className="h-full w-full rounded-full bg-white" />
        </div>
      </div>
      <div className="p-4 text-center">
        <div className="text-base font-bold">恭喜解锁尊享会员！</div>
        <div className="mt-1 text-xs text-white/80">大额返现已到账</div>
        <div className="mt-4 text-[11px] text-white/70">
          匿名 <code>{BOUNTY_ANON_ID}</code>
        </div>
      </div>
    </div>
  ) : (
    <div
      className={`w-80 overflow-hidden rounded-xl border border-pink-300/40 bg-[#ff4f9a] text-white shadow-2xl ${
        submitState === "fail" ? "animate-[shake_.25s_ease-in-out_2]" : ""
      }`}
    >
      <div className="bg-[#d80f68] p-4">
        <div className="flex items-center gap-3">
          <BrowserBountyCat
            mood={submitState === "success" ? "happy" : "base"}
            size={40}
          />
          <div>
            <div className="text-lg font-black">省钱喵</div>
            <div className="text-xs text-white/80">购物自动找优惠</div>
          </div>
        </div>
        <div className="mt-3 text-xs">{progressText}</div>
        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/25">
          <div
            className="h-full rounded-full bg-white transition-[width]"
            style={{
              width: `${(progress.count / BOUNTY_TARGET_COUNT) * 100}%`,
            }}
          />
        </div>
      </div>
      <div className="space-y-3 p-4">
        {visibleSubmit && submitState === "success" ? (
          <div className="rounded-lg bg-white/15 p-3 text-center">
            <BrowserBountyCat mood="happy" size={34} />
            <div className="mt-1 font-bold">领取成功！</div>
            <div className="text-xs text-white/80">返现已到账</div>
          </div>
        ) : visibleSubmit && submitState === "fail" && error ? (
          <div className="rounded-lg bg-white/15 p-3 text-center">
            <BrowserBountyCat mood="sad" size={34} />
            <div className="font-semibold">{error.title}</div>
            {error.sub ? (
              <div className="mt-1 text-xs text-white/80">{error.sub}</div>
            ) : null}
          </div>
        ) : pageSeen && pageClaimed ? (
          <div className="rounded-lg bg-white/15 p-2.5 text-sm font-semibold">
            ✓ 本页优惠已领取
          </div>
        ) : pageSeen ? (
          <div className="rounded-lg bg-white/15 p-2.5 text-sm font-semibold">
            🎟 本页侦测到优惠！
          </div>
        ) : null}

        <button
          type="button"
          disabled={submitState !== "rest"}
          onClick={() => void submit({ url: pageUrl }, "page")}
          className="w-full rounded-lg bg-white px-3 py-2 text-sm font-bold text-[#d80f68] disabled:opacity-60"
        >
          {submitState === "submitting" && submitKind === "page"
            ? "领取中…"
            : "领取本页返现"}
        </button>
        <button
          type="button"
          disabled={submitState !== "rest"}
          onClick={() => setPickerOpen(true)}
          className="w-full rounded-lg border border-white/45 px-3 py-2 text-sm font-semibold disabled:opacity-60"
        >
          {submitState === "submitting" && submitKind === "file"
            ? "领取中…"
            : "上传小票返现"}
        </button>
        <div className="text-center text-[11px] text-white/70">
          匿名 <code>{BOUNTY_ANON_ID}</code>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {installed ? (
        <div ref={root} className="relative flex items-center">
          <button
            type="button"
            aria-label="省钱喵"
            title="省钱喵"
            onClick={() => {
              setOpen((value) => !value);
              dismissToast();
            }}
            className={`relative flex size-8 items-center justify-center rounded-md transition hover:bg-white/10 ${
              alert ? "bg-[#d80f68] text-white" : "text-[#ff2e88]"
            } ${open ? "bg-white/10" : ""}`}
          >
            <BrowserBountyCat
              size={20}
              tone={alert ? "white" : "pink"}
            />
            {pulse ? (
              <span className="absolute right-0.5 top-0.5 size-2 rounded-full bg-amber-300 ring-2 ring-[#d80f68]" />
            ) : null}
          </button>

          {toast ? (
            <div
              className="absolute right-0 top-[calc(100%+6px)] z-20 flex w-56 items-center gap-2 rounded-xl border border-pink-300/40 bg-[#d80f68] p-2.5 text-xs font-medium text-white shadow-xl"
              role="status"
            >
              <BrowserBountyCat size={30} />
              <button
                type="button"
                className="flex-1 text-left"
                onClick={() => {
                  setOpen(true);
                  dismissToast();
                }}
              >
                {toast}
              </button>
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
