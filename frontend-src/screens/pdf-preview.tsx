import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import {
  getDocument,
  GlobalWorkerOptions,
  TextLayer,
  type PDFDocumentProxy,
  type RenderTask,
} from "pdfjs-dist/legacy/build/pdf.mjs";
import workerUrl from "pdfjs-dist/legacy/build/pdf.worker.min.mjs?url";
import { PanelLeft, Minus, Plus, Maximize2 } from "lucide-react";
import { createSourceTranslate } from "../i18n/translate";
import "./pdf-preview.css";

GlobalWorkerOptions.workerSrc = workerUrl;
type PageSize = { width: number; height: number };
const clamp = (value: number) => Math.max(0.25, Math.min(5, value));

function PageCanvas({
  document,
  number,
  scale,
  text = false,
}: {
  document: PDFDocumentProxy;
  number: number;
  scale: number;
  text?: boolean;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const layer = useRef<HTMLDivElement>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    let cancelled = false,
      render: RenderTask | undefined,
      textLayer: TextLayer | undefined;
    setError(false);
    const target = canvas.current!;
    const container = layer.current;
    void (async () => {
      const page = await document.getPage(number);
      if (cancelled) return;
      const viewport = page.getViewport({ scale });
      // Bound both pixel density and allocation for large documents/zoom levels.
      const density = Math.min(
        devicePixelRatio || 1,
        2,
        Math.sqrt(8_000_000 / (viewport.width * viewport.height)),
      );
      target.width = Math.ceil(viewport.width * density);
      target.height = Math.ceil(viewport.height * density);
      target.style.width = `${viewport.width}px`;
      target.style.height = `${viewport.height}px`;
      render = page.render({
        canvas: target,
        viewport,
        transform: [density, 0, 0, density, 0, 0],
      });
      await render.promise;
      if (cancelled || !text || !container) return;
      textLayer = new TextLayer({
        container,
        viewport,
        textContentSource: page.streamTextContent(),
      });
      await textLayer.render();
    })().catch((error: unknown) => {
      if (!cancelled) {
        console.warn("[Preview] PDF page failed", error);
        setError(true);
      }
    });
    return () => {
      cancelled = true;
      render?.cancel();
      textLayer?.cancel();
      container?.replaceChildren();
      // The old canvas is released on unmount; effect reruns wait for cancellation.
    };
  }, [document, number, scale, text]);
  return (
    <>
      <canvas ref={canvas} aria-label={`PDF ${number}`} />
      {text && (
        <div
          ref={layer}
          className="textLayer"
          style={{ "--total-scale-factor": scale } as CSSProperties}
        />
      )}
      {error && <span role="alert">PDF page {number}: rendering failed</span>}
    </>
  );
}

export function PdfPreview({ src, locale }: { src: string; locale: string }) {
  const [document, setDocument] = useState<PDFDocumentProxy | null>(null);
  const [pages, setPages] = useState<PageSize[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [sidebar, setSidebar] = useState(true);
  const [zoom, setZoom] = useState<number | "auto" | "fit">("auto");
  const [box, setBox] = useState({ width: 500, height: 500, top: 0 });
  const [pageInput, setPageInput] = useState("1");
  const scroller = useRef<HTMLDivElement>(null);
  const t = useMemo(() => createSourceTranslate(locale), [locale]);
  useEffect(() => {
    let cancelled = false;
    setDocument(null);
    setPages([]);
    setError(null);
    setZoom("auto");
    setPageInput("1");
    const task = getDocument({
      url: src,
      cMapUrl: "/assets/pdfjs/cmaps/",
      cMapPacked: true,
      standardFontDataUrl: "/assets/pdfjs/standard_fonts/",
      wasmUrl: "/assets/pdfjs/wasm/",
    });
    void (async () => {
      const pdf = await task.promise;
      const dimensions: PageSize[] = [];
      for (let number = 1; number <= pdf.numPages; number++) {
        if (cancelled) return;
        const viewport = (await pdf.getPage(number)).getViewport({ scale: 1 });
        dimensions.push({ width: viewport.width, height: viewport.height });
      }
      if (!cancelled) {
        setDocument(pdf);
        setPages(dimensions);
        scroller.current?.scrollTo(0, 0);
      }
    })().catch((error: unknown) => {
      if (!cancelled) setError(String(error));
    });
    return () => {
      cancelled = true;
      void task.destroy();
    };
  }, [src]);
  useLayoutEffect(() => {
    const element = scroller.current!;
    const resize = () =>
      setBox({
        width: element.clientWidth,
        height: element.clientHeight,
        top: element.scrollTop,
      });
    const observer = new ResizeObserver(resize);
    observer.observe(element);
    resize();
    return () => observer.disconnect();
  }, []);
  const fit = clamp(
    (box.width - 56) / Math.max(1, ...pages.map((page) => page.width)),
  );
  const scale =
    zoom === "auto" ? Math.min(fit, 1.25) : zoom === "fit" ? fit : zoom;
  const layout = useMemo(() => {
    let top = 20;
    return pages.map((page) => {
      const item = {
        ...page,
        top,
        height: page.height * scale,
        width: page.width * scale,
      };
      top += item.height + 20;
      return item;
    });
  }, [pages, scale]);
  const current = Math.max(
    0,
    layout.findIndex(
      (page) => page.top + page.height >= box.top + box.height * 0.35,
    ),
  );
  useEffect(() => setPageInput(String(current + 1)), [current]);
  const go = (number: number) => {
    const index = Math.max(
      0,
      Math.min(pages.length - 1, Math.round(number) - 1),
    );
    scroller.current?.scrollTo({ top: layout[index]?.top ?? 0 });
    setPageInput(String(index + 1));
  };
  const resizeZoom = (next: number | "fit") => {
    // Keep the same reading page across zoom and fit changes.
    const ratio = (box.top - (layout[current]?.top ?? 0)) / scale;
    const nextScale = next === "fit" ? fit : clamp(next);
    setZoom(next === "fit" ? next : nextScale);
    const nextTop =
      20 +
      pages
        .slice(0, current)
        .reduce((sum, page) => sum + page.height * nextScale + 20, 0) +
      ratio * nextScale;
    requestAnimationFrame(() =>
      scroller.current?.scrollTo({ top: Math.max(0, nextTop) }),
    );
  };
  return (
    <section className="pdf-preview">
      <div className="pdf-toolbar" role="toolbar" aria-label="PDF">
        <button
          aria-label={t("preview.pdf.thumbnails")}
          aria-pressed={sidebar}
          onClick={() => setSidebar(!sidebar)}
        >
          <PanelLeft size={16} />
        </button>
        <span className="pdf-separator" />
        <input
          aria-label={t("preview.pdf.page")}
          inputMode="numeric"
          value={pageInput}
          onFocus={(event) => event.currentTarget.select()}
          onChange={(event) =>
            setPageInput(event.target.value.replace(/\D/g, ""))
          }
          onBlur={() => go(Number(pageInput) || current + 1)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              go(Number(pageInput) || current + 1);
              event.currentTarget.blur();
            }
          }}
        />
        <span>/ {pages.length || "—"}</span>
        <span className="pdf-toolbar-spacer" />
        <button
          aria-label={t("preview.pdf.zoomOut")}
          disabled={scale <= 0.25}
          onClick={() => resizeZoom(scale / 1.25)}
        >
          <Minus size={16} />
        </button>
        <span className="pdf-percent">{Math.round(scale * 100)}%</span>
        <button
          aria-label={t("preview.pdf.zoomIn")}
          disabled={scale >= 5}
          onClick={() => resizeZoom(scale * 1.25)}
        >
          <Plus size={16} />
        </button>
        <button
          aria-label={t("preview.pdf.fitWidth")}
          aria-pressed={zoom === "fit"}
          onClick={() => resizeZoom("fit")}
        >
          <Maximize2 size={16} />
        </button>
      </div>
      <div className="pdf-body">
        {sidebar && (
          <nav
            className="pdf-thumbnails"
            aria-label={t("preview.pdf.thumbnails")}
          >
            {document &&
              pages.map((page, index) => (
                <Thumbnail
                  key={index}
                  document={document}
                  page={page}
                  number={index + 1}
                  active={current === index}
                  go={go}
                />
              ))}
          </nav>
        )}
        <div
          className="pdf-scroller"
          ref={scroller}
          tabIndex={0}
          onScroll={(event) => {
            const top = event.currentTarget.scrollTop;
            setBox((previous) => ({ ...previous, top }));
          }}
          onKeyDown={(event) => {
            if (!(event.ctrlKey || event.metaKey)) return;
            if (["+", "=", "-", "0", "9"].includes(event.key))
              event.preventDefault();
            if (event.key === "+" || event.key === "=")
              resizeZoom(scale * 1.25);
            if (event.key === "-") resizeZoom(scale / 1.25);
            if (event.key === "0") resizeZoom(1);
            if (event.key === "9") resizeZoom("fit");
          }}
        >
          {error ? (
            <p role="alert">
              {t("preview.pdf.error")} {error}
            </p>
          ) : !document ? (
            <p role="status">
              {locale.startsWith("zh") ? "载入中…" : "Loading…"}
            </p>
          ) : (
            <div
              className="pdf-pages"
              style={{
                height:
                  (layout.at(-1)?.top ?? 0) + (layout.at(-1)?.height ?? 0) + 20,
                minWidth: Math.max(...layout.map((page) => page.width)) + 56,
              }}
            >
              {layout.map((page, index) =>
                page.top + page.height < box.top - box.height ||
                page.top > box.top + box.height * 2 ? null : (
                  <div
                    key={`${index}:${scale}`}
                    className="pdf-page"
                    data-page-number={index + 1}
                    style={{
                      top: page.top,
                      width: page.width,
                      height: page.height,
                    }}
                  >
                    <PageCanvas
                      document={document}
                      number={index + 1}
                      scale={scale}
                      text
                    />
                  </div>
                ),
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function Thumbnail({
  document,
  page,
  number,
  active,
  go,
}: {
  document: PDFDocumentProxy;
  page: PageSize;
  number: number;
  active: boolean;
  go(number: number): void;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { root: ref.current?.parentElement, rootMargin: "180px" },
    );
    observer.observe(ref.current!);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (active && ref.current) {
      const button = ref.current,
        parent = button.parentElement!;
      const top = button.offsetTop - parent.offsetTop;
      if (top < parent.scrollTop) parent.scrollTop = top;
      else if (
        top + button.offsetHeight >
        parent.scrollTop + parent.clientHeight
      )
        parent.scrollTop = top + button.offsetHeight - parent.clientHeight;
    }
  }, [active]);
  return (
    <button
      ref={ref}
      aria-label={`PDF ${number}`}
      aria-current={active ? "page" : undefined}
      onClick={() => go(number)}
    >
      <div style={{ width: 100, height: (page.height * 100) / page.width }}>
        {visible && (
          <PageCanvas
            document={document}
            number={number}
            scale={100 / page.width}
          />
        )}
      </div>
      <span>{number}</span>
    </button>
  );
}
