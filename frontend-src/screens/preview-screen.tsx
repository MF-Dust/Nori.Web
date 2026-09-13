import { Fragment, lazy, Suspense, useEffect, useRef, useState } from "react";
import type { FilesAppModel, FilesRecoveredFile } from "../apps/files";
import type { JsonValue } from "../runtime/protocol";
import type { WindowComponentProps } from "../state/window-types";
import "./preview-screen.css";
const PdfPreview = lazy(() =>
  import("./pdf-preview").then((module) => ({ default: module.PdfPreview })),
);

/** Original Preview text markers are deliberately not an HTML/Markdown parser. */
export function PreviewText({ content }: { content: string }) {
  const parts = [];
  const pattern =
    /\*\*(.+?)\*\*|<bold>([\s\S]+?)<\/bold>|<clue>([\s\S]+?)<\/clue>|<red>([\s\S]+?)<\/red>/g;
  let offset = 0;
  for (const match of content.matchAll(pattern)) {
    parts.push(
      <Fragment key={`text:${offset}`}>
        {content.slice(offset, match.index)}
      </Fragment>,
    );
    parts.push(
      <strong
        key={`mark:${match.index}`}
        className={
          match[4] !== undefined
            ? "preview-red"
            : match[3] !== undefined
              ? "preview-clue"
              : "preview-bold"
        }
      >
        {match[1] ?? match[2] ?? match[3] ?? match[4]}
      </strong>,
    );
    offset = match.index + match[0].length;
  }
  parts.push(
    <Fragment key={`text:${offset}`}>{content.slice(offset)}</Fragment>,
  );
  return <article className="preview-text">{parts}</article>;
}
const photos: Record<string, string> = {
  "nori-thinking": "/assets/nori-thinking-BfPVtIvj.jpg",
  "nori-smile": "/assets/nori-smile-B7ezdSLI.jpg",
};
export function TrainingLog({ items }: { items: JsonValue[] }) {
  return (
    <div className="preview-training-log">
      {items.map((raw, index) => {
        if (!raw || typeof raw !== "object" || Array.isArray(raw))
          return <p key={index}>{typeof raw === "string" ? raw : ""}</p>;
        if (raw.k === "photo")
          return typeof raw.id === "string" && photos[raw.id] ? (
            <img
              key={index}
              className="preview-training-photo"
              src={photos[raw.id]}
              alt=""
            />
          ) : null;
        const text = typeof raw.t === "string" ? raw.t : "";
        if (raw.k === "poem")
          return (
            <p key={index} className="preview-training-poem">
              {text}
            </p>
          );
        return (
          <div
            key={index}
            className="preview-training-turn"
            data-sender={raw.nori ? "agent" : "player"}
          >
            {text}
          </div>
        );
      })}
    </div>
  );
}
export interface PreviewRuntime {
  subscribe?(listener: () => void): () => void;
  hasFact?(factId: string): boolean;
  setContentKey?(instanceId: string, contentKey: string | null): void;
}
export function PreviewScreen({
  model,
  locale,
  fileId,
  instanceId,
  setTitle,
  runtime,
}: WindowComponentProps & {
  model: FilesAppModel;
  locale: string;
  runtime?: PreviewRuntime;
}) {
  const [file, setFile] = useState<FilesRecoveredFile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const emitted = useRef(new Set<string>());
  const previousTitle = useRef<string | undefined>(undefined);
  const zh = locale.startsWith("zh");
  useEffect(() => {
    let disposed = false,
      revision = 0;
    setFile(null);
    setError(null);
    setLoading(true);
    const refresh = async () => {
      const request = ++revision;
      try {
        const snapshot = await model.presentation();
        if (disposed || request !== revision) return;
        const found = snapshot.files.find((file) => file.id === fileId) ?? null;
        setFile(found);
        setLoading(false);
        setError(null);
        const fact = found?.readFact;
        if (fact && !runtime?.hasFact?.(fact) && !emitted.current.has(fact)) {
          emitted.current.add(fact);
          void model.emitFact(fact).catch((error) => {
            emitted.current.delete(fact);
            if (!disposed) setError(String(error));
          });
        }
      } catch (error) {
        if (!disposed && request === revision) {
          setError(String(error));
          setLoading(false);
        }
      }
    };
    void refresh();
    const unsubscribe = runtime?.subscribe?.(() => void refresh());
    return () => {
      disposed = true;
      unsubscribe?.();
    };
  }, [model, fileId, runtime]);
  useEffect(() => {
    runtime?.setContentKey?.(
      instanceId,
      typeof fileId === "string" ? `file:${fileId}` : null,
    );
    return () => runtime?.setContentKey?.(instanceId, null);
  }, [runtime, instanceId, fileId]);
  useEffect(() => {
    const title = file?.name ?? (zh ? "预览" : "Preview");
    if (previousTitle.current !== title) {
      previousTitle.current = title;
      setTitle(title);
    }
  }, [file?.name, setTitle, zh]);
  return (
    <div className="source-preview">
      {loading && <p role="status">{zh ? "载入中…" : "Loading…"}</p>}
      {error && <p role="alert">{error}</p>}
      {!loading && !file && (
        <div className="preview-empty">
          <img src="/app-icons/preview/icon-a.png" alt="" />
          <p>{zh ? "没有可预览的文件" : "No file to preview"}</p>
          <span>
            {zh
              ? "从文件中打开文档或图片"
              : "Open a document or image from Files"}
          </span>
        </div>
      )}
      {file?.corrupted && (
        <p className="preview-corrupted" role="status">
          {zh ? "文件部分损坏" : "This file is partially corrupted"}
        </p>
      )}
      {file?.kind === "image" && (
        <div className="preview-image">
          <img src={file.imageSrc} alt={file.alt} />
        </div>
      )}
      {file?.kind === "text" && <PreviewText content={file.content} />}
      {file?.kind === "pdf" && (
        <Suspense fallback={<p role="status">{zh ? "载入中…" : "Loading…"}</p>}>
          <PdfPreview key={file.id} src={file.pdfSrc} locale={locale} />
        </Suspense>
      )}
      {file?.kind === "training-log" && <TrainingLog items={file.items} />}
    </div>
  );
}
