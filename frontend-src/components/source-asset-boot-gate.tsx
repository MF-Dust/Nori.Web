import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { createSourceTranslate } from "../i18n/translate";
import "./source-asset-boot-gate.css";

type Progress = { status: "loading" | "error" | "ready"; done: number; total: number };
type Manifest = { packs: Record<string, string[]>; files: Record<string, { size: number; rev: string }> };
const CACHE_NAME = "arcade-assets-v1";
const CACHE_META = "/__asset-cache-meta__";
const MARK_PATH = "M85.29 40.03q0 1.7-.47 4.09t-1.02 4.06t-.79 1.67q-.53 0-1.2-1.14t-1.64-2.34t-2.19-1.32q-6.49 8.48-6.49 15.09q0 3.04 1.52 5.79l7.83 8.48q4.56 5.26 4.56 10.76q0 3.22-1.49 6.02t-4.12 2.81q-.35-4.39-3.16-7.54L45.6 52.11q-2.46 1.7-3.6 5.03t-1.14 6.37q0 1.99 1.23 4.3t2.98 4.47l3.51 4.21q1.7 2.16 2.92 4.5t1.23 4.33q0 2.87-1.87 5.15t-4.03 2.28H34.79q-.29-.58-.29-.7q0-.88.88-1.11q1.46-.18 2.69-1.29t1.23-2.51q0-1.58-2.19-7.63t-2.19-8.8q0-5.38 2.28-11.11t7.07-8.95l-3.63-3.98q-4.56-5.26-4.56-10.82q0-5.03 4.09-9.47h1.52q.18 5.09 3.04 8.3l22.22 24.67.18.12q2.05-9.18 6.9-15.32q-8.6-2.16-8.6-9.12q0-2.28.41-4.09t.99-2.75t1.14-1.52t.96-.7l.41-.18q.64.47.82 1.08t.26 1.14t.56 1.17t2.1 1.43t4.44 1.67q1.52.41 2.57.82t2.37 1.26t2.02 2.22t.7 3.25z";
const GHOSTS = [
  { tx: -7, ty: 4.5, sk: -7, sc: 1.03, op: 0.34, stroke: "rgba(159,216,230,0.9)", d: 0.55, dur: 8, jx: 1.6, jy: -1.2 },
  { tx: 6.5, ty: -4, sk: 6, sc: 1.07, op: 0.24, stroke: "rgba(159,216,230,0.9)", d: 0.7, dur: 9.5, jx: -1.4, jy: 1.1 },
  { tx: -2.5, ty: -7.5, sk: 0, sc: 0.93, op: 0.17, stroke: "rgba(94,234,212,0.8)", d: 0.85, dur: 7.2, jx: 1.1, jy: 1.5 },
];

async function loadBootAssets(report: (done: number, total: number) => void, signal: AbortSignal) {
  const response = await fetch("/asset-manifest.json", { cache: "no-cache", signal });
  // The historical client fails open when an older deployment has no manifest.
  if (!response.ok || response.headers.get("content-type")?.includes("text/html")) return;
  const manifest = await response.json() as Manifest;
  const files = manifest.packs?.boot ?? [];
  if (!files.length) return;
  const cache = typeof caches === "undefined" ? null : await caches.open(CACHE_NAME).catch(() => null);
  const stored = cache ? await cache.match(CACHE_META).catch(() => undefined) : undefined;
  const metadata = stored ? await stored.json().catch(() => null) as { revs?: Record<string, string> } | null : null;
  const revisions = metadata?.revs ?? {};
  const total = files.reduce((sum, path) => sum + (manifest.files[path]?.size ?? 0), 0);
  let done = 0;
  const pending: string[] = [];
  for (const path of files) {
    const file = manifest.files[path];
    if (!file) continue;
    if (cache && revisions[path] === file.rev && await cache.match(path)) done += file.size;
    else pending.push(path);
  }
  report(done, total);
  let cursor = 0;
  const worker = async () => {
    while (cursor < pending.length) {
      const path = pending[cursor++];
      const file = manifest.files[path];
      for (let attempt = 0; attempt < 3; attempt++) {
        let received = 0;
        try {
          const asset = await fetch(path, { cache: "no-store", headers: { "x-asset-loader": "1" }, signal });
          if (!asset.ok || asset.headers.get("content-type")?.includes("text/html")) throw new Error("Asset unavailable: " + path);
          const chunks: Uint8Array[] = [];
          if (asset.body) {
            const reader = asset.body.getReader();
            for (;;) {
              const { value, done: complete } = await reader.read();
              if (complete) break;
              chunks.push(value);
              received += value.byteLength;
              done += value.byteLength;
              report(done, total);
            }
          } else {
            const bytes = new Uint8Array(await asset.arrayBuffer());
            chunks.push(bytes); received = bytes.byteLength;
            done += received; report(done, total);
          }
          if (cache) {
            const body = new Blob(chunks as BlobPart[]);
            await cache.put(path, new Response(body, { headers: { "content-type": asset.headers.get("content-type") ?? "application/octet-stream" } }));
            revisions[path] = file.rev;
          }
          break;
        } catch (error) {
          done -= received; report(done, total);
          if (signal.aborted) throw error;
          if (attempt === 2) throw error;
        }
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(4, pending.length) }, worker));
  if (cache && pending.length) {
    await cache.put(CACHE_META, new Response(JSON.stringify({ schema: 2, revs: revisions }), {
      headers: { "content-type": "application/json" },
    })).catch(() => {});
  }
}

function AlephMark() {
  return (
    <div className="source-asset-mark" aria-hidden="true">
      <svg className="source-asset-alef" viewBox="0 0 120 120">
        <path className="source-asset-halo" d={MARK_PATH} fill="rgba(110,240,220,0.55)" />
        {GHOSTS.map((ghost) => (
          <path
            key={`${ghost.tx}-${ghost.ty}`}
            className="source-asset-ghost"
            d={MARK_PATH}
            stroke={ghost.stroke}
            style={{
              "--tx": `${ghost.tx}px`,
              "--ty": `${ghost.ty}px`,
              "--sk": `${ghost.sk}deg`,
              "--sc": ghost.sc,
              "--op": ghost.op,
              "--d": `${ghost.d}s`,
              "--dur": `${ghost.dur}s`,
              "--jx": `${ghost.jx}px`,
              "--jy": `${ghost.jy}px`,
            } as CSSProperties}
          />
        ))}
        <path className="source-asset-core" d={MARK_PATH} fill="#dcecf4" />
      </svg>
    </div>
  );
}

function AuthFrame({ children }: { children: ReactNode }) {
  return (
    <main className="source-asset-gate" role="status">
      <div className="source-asset-veil" aria-hidden="true" />
      <header>
        <p className="source-asset-brand">FUTURUM</p>
        <span className="source-asset-guest">
          <i className="source-asset-live" aria-hidden="true" />
          <b>访客通道</b>
          GUEST
        </span>
      </header>
      <div className="source-asset-stack">
        <AlephMark />
        <div className="source-asset-panel">{children}</div>
      </div>
    </main>
  );
}

export function AuthConnecting({ locale }: { locale: string }) {
  const t = createSourceTranslate(locale);
  return (
    <AuthFrame>
      <div className="source-asset-track" aria-hidden="true"><i className="source-asset-sweep" /></div>
      <span className="source-asset-status">{t("auth.loading.connecting")}</span>
    </AuthFrame>
  );
}

function BrandMark({ dim = false }: { dim?: boolean }) {
  return (
    <div className="source-sys-mark" aria-hidden="true">
      <div className="source-sys-halo" data-dim={dim || undefined} />
      <img src="/icon.png" alt="" draggable={false} />
    </div>
  );
}

function ReturnShell({ children }: { children: ReactNode }) {
  return (
    <main className="source-sys-veil" role="status">
      <div className="source-sys-column">{children}</div>
    </main>
  );
}

function megabytes(bytes: number) {
  return (bytes / 1024 / 1024).toFixed(1);
}

/** Uses the shipped boot pack's actual byte count; no simulated progress. */
export function SourceAssetBootGate({ children, firstBoot, locale, booting = false }: {
  children: ReactNode;
  firstBoot: boolean;
  locale: string;
  booting?: boolean;
}) {
  const t = createSourceTranslate(locale);
  const [retry, setRetry] = useState(0);
  const [initialBoot] = useState(() => {
    try { return localStorage.getItem("arcade-first-boot-completed") !== "1"; }
    catch { return true; }
  });
  const [progress, setProgress] = useState<Progress>({ status: "loading", done: 0, total: 0 });
  useEffect(() => {
    if (!firstBoot) {
      try { localStorage.setItem("arcade-first-boot-completed", "1"); } catch { /* Private mode. */ }
    }
  }, [firstBoot]);
  useEffect(() => {
    const controller = new AbortController();
    setProgress({ status: "loading", done: 0, total: 0 });
    void loadBootAssets((done, total) => {
      if (!controller.signal.aborted) setProgress({ status: "loading", done, total });
    }, controller.signal).then(() => {
      if (!controller.signal.aborted) setProgress((value) => ({ ...value, status: "ready" }));
    }).catch(() => {
      if (!controller.signal.aborted) setProgress((value) => ({ ...value, status: "error" }));
    });
    return () => controller.abort();
  }, [retry]);
  if (progress.status === "ready" && !booting) return <>{children}</>;
  const ratio = progress.total > 0 ? Math.min(1, progress.done / progress.total) : 0;
  if (!initialBoot) {
    if (progress.status === "ready") {
      return (
        <ReturnShell>
          <BrandMark />
          <span className="source-sys-spinner" />
        </ReturnShell>
      );
    }
    if (progress.status === "error") {
      return (
        <ReturnShell>
          <BrandMark dim />
          <div className="source-sys-copy">
            <strong>{t("assets.failed")}</strong>
            <p>{t("assets.failedHint")}</p>
          </div>
          <button type="button" className="source-sys-button" onClick={() => setRetry((value) => value + 1)}>{t("assets.retry")}</button>
        </ReturnShell>
      );
    }
    return (
      <ReturnShell>
        <BrandMark />
        <span className="source-sys-status">{t("assets.downloading")}</span>
        <div className="source-sys-progress">
          <div className="source-sys-track"><div className="source-sys-fill" style={{ width: `${ratio * 100}%` }} /></div>
          <span className="source-sys-count">{t("assets.progress", { done: megabytes(progress.done), total: megabytes(progress.total) })}</span>
        </div>
      </ReturnShell>
    );
  }
  if (progress.status === "ready") return <AuthConnecting locale={locale} />;
  return (
    <AuthFrame>
      {progress.status === "error" ? (
        <>
          <div className="source-asset-track" aria-hidden="true"><div className="source-asset-fill" style={{ width: "0%" }} /></div>
          <span className="source-asset-status">{t("auth.loading.assetsFailed")}</span>
          <span className="source-asset-count">{t("assets.failedHint")}</span>
          <button type="button" onClick={() => setRetry((value) => value + 1)}>{t("assets.retry")}</button>
        </>
      ) : (
        <>
          <div className="source-asset-track" aria-hidden="true">
            <div className="source-asset-fill" style={{ width: `${ratio * 100}%` }} />
          </div>
          <span className="source-asset-status">{t("auth.loading.assets")}</span>
          <span className="source-asset-count">{t("assets.progress", { done: megabytes(progress.done), total: megabytes(progress.total) })}</span>
        </>
      )}
    </AuthFrame>
  );
}
