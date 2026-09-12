import { useEffect, useState } from "react";
import type { FilesAppModel, FilesRecoveredFile } from "../apps/files";
import type { WindowComponentProps } from "../state/window-types";
import { MarkdownBody } from "../components/markdown-body";
import "./preview-screen.css";

export function PreviewScreen({
  model,
  locale,
  fileId,
  setTitle,
}: WindowComponentProps & { model: FilesAppModel; locale: string }) {
  const [file, setFile] = useState<FilesRecoveredFile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const zh = locale.startsWith("zh");
  useEffect(() => {
    let disposed = false;
    setFile(null);
    setError(null);
    setLoading(true);
    void model
      .presentation()
      .then((snapshot) => {
        if (disposed) return;
        const found = snapshot.files.find((file) => file.id === fileId) ?? null;
        setFile(found);
        setLoading(false);
        if (found?.readFact)
          void model.emitFact(found.readFact).catch((error) => {
            if (!disposed) setError(String(error));
          });
      })
      .catch((error) => {
        if (!disposed) {
          setError(String(error));
          setLoading(false);
        }
      });
    return () => {
      disposed = true;
    };
  }, [model, fileId]);
  useEffect(() => {
    setTitle(file?.name ?? (zh ? "预览" : "Preview"));
  }, [file?.name, setTitle, zh]);
  return (
    <div className="source-preview">
      {loading && <p role="status">{zh ? "载入中…" : "Loading…"}</p>}
      {error && <p role="alert">{error}</p>}
      {!loading && !file && <p>{zh ? "找不到文件" : "File not found"}</p>}
      {file?.corrupted && (
        <p role="status">
          {zh ? "文件部分损坏" : "This file is partially corrupted"}
        </p>
      )}
      {file?.kind === "image" && <img src={file.imageSrc} alt={file.alt} />}
      {file?.kind === "text" && (
        <article>
          <MarkdownBody markdown={file.content} />
        </article>
      )}
      {file?.kind === "pdf" && (
        <iframe
          title={file.name}
          src={file.pdfSrc}
          sandbox="allow-same-origin"
        />
      )}
      {file?.kind === "training-log" && (
        <ol>
          {file.items.map((item, index) => (
            <li key={index}>
              <pre>
                {typeof item === "string"
                  ? item
                  : JSON.stringify(item, null, 2)}
              </pre>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
