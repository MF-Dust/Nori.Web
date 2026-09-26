import { useEffect, useState, type ReactNode } from "react";
import "./source-asset-boot-gate.css";

type Progress = { status: "loading" | "error" | "ready"; done: number; total: number };
type Manifest = { packs: Record<string, string[]>; files: Record<string, { size: number; rev: string }> };
const CACHE_NAME = "arcade-assets-v1";
const CACHE_META = "/__asset-cache-meta__";

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

/** Uses the shipped boot pack's actual byte count; no simulated progress. */
export function SourceAssetBootGate({ children, firstBoot, locale }: {
  children: ReactNode; firstBoot: boolean; locale: string;
}) {
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
      if (!controller.signal.aborted) setProgress(value => ({ ...value, status: "ready" }));
    }).catch(() => {
      if (!controller.signal.aborted) setProgress(value => ({ ...value, status: "error" }));
    });
    return () => controller.abort();
  }, [retry]);
  if (progress.status === "ready") return <>{children}</>;
  const zh = locale.startsWith("zh");
  const ratio = progress.total > 0 ? Math.min(1, progress.done / progress.total) : 0;
  const count = (bytes: number) => (bytes / 1024 / 1024).toFixed(1);
  if (!initialBoot) return <main className="source-asset-gate compact" role="status">
    <div className="source-asset-compact-panel">
      <span className="source-asset-compact-mark" aria-hidden="true">✦</span>
      <strong>{progress.status === "error" ? (zh ? "下载失败" : "Download failed") : (zh ? "正在下载资源" : "Downloading assets")}</strong>
      {progress.status === "error" ? <button type="button" onClick={() => setRetry(value => value + 1)}>{zh ? "重试" : "Retry"}</button> : <>
        <div className="source-asset-compact-track"><div style={{ width: (ratio * 100) + "%" }} /></div>
        <small>{count(progress.done)} / {count(progress.total)} MB</small>
      </>}
    </div>
  </main>;
  return <main className="source-asset-gate first-boot" role="status">
    <div className="source-asset-veil" aria-hidden="true" />
    <header><strong>FUTURUM</strong><span><i aria-hidden="true" />{zh ? "访客通道" : "GUEST"} <small>GUEST</small></span></header>
    <div className="source-asset-stack">
      <div className="source-asset-mark" aria-hidden="true">
        <svg viewBox="0 0 120 120"><path d="M85.29 40.03q0 1.7-.47 4.09t-1.02 4.06t-.79 1.67q-.53 0-1.2-1.14t-1.64-2.34t-2.19-1.32q-6.49 8.48-6.49 15.09q0 3.04 1.52 5.79l7.83 8.48q4.56 5.26 4.56 10.76q0 3.22-1.49 6.02t-4.12 2.81q-.35-4.39-3.16-7.54L45.6 52.11q-2.46 1.7-3.6 5.03t-1.14 6.37q0 1.99 1.23 4.3t2.98 4.47l3.51 4.21q1.7 2.16 2.92 4.5t1.23 4.33q0 2.87-1.87 5.15t-4.03 2.28H34.79q-.29-.58-.29-.7q0-.88.88-1.11q1.46-.18 2.69-1.29t1.23-2.51q0-1.58-2.19-7.63t-2.19-8.8q0-5.38 2.28-11.11t7.07-8.95l-3.63-3.98q-4.56-5.26-4.56-10.82q0-5.03 4.09-9.47h1.52q.18 5.09 3.04 8.3l22.22 24.67.18.12q2.05-9.18 6.9-15.32q-8.6-2.16-8.6-9.12q0-2.28.41-4.09t.99-2.75t1.14-1.52t.96-.7l.41-.18q.64.47.82 1.08t.26 1.14t.56 1.17t2.1 1.43t4.44 1.67q1.52.41 2.57.82t2.37 1.26t2.02 2.22t.7 3.25z" fill="#dcecf4" /></svg>
      </div>
      <div className="source-asset-panel">
        {progress.status === "error" ? <>
          <span className="source-asset-status">{zh ? "下载失败" : "Download failed"}</span>
          <span className="source-asset-count">{zh ? "请检查网络连接后重试。" : "Check your connection and try again."}</span>
          <button type="button" onClick={() => setRetry(value => value + 1)}>{zh ? "重试" : "Retry"}</button>
        </> : <>
          <div className="source-asset-track"><div className="source-asset-fill" style={{ width: (ratio * 100) + "%" }} /></div>
          <span className="source-asset-status">{zh ? "正在加载游戏资源…" : "Loading game assets…"}</span>
          <span className="source-asset-count">{count(progress.done)} / {count(progress.total)} MB</span>
        </>}
      </div>
    </div>
  </main>;
}
