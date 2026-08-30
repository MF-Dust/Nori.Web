import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefCallback,
} from "react";
import type { BrowserAppModel, BrowserPageFetchResult } from "../apps/browser";
import {
  BROWSER_IFRAME_SANDBOX,
  BrowserPodcastRuntime,
  browserSameDocumentHashChange,
  buildBrowserFontCss,
  buildBrowserIframeSrcDoc,
  createBrowserFrameBridge,
  normalizeBrowserPageData,
  splitBrowserUrl,
  type BrowserEditAction,
  type BrowserFrameBridge,
  type BrowserFrameContextMenuEvent,
  type BrowserPageData,
} from "../apps/browser-page-runtime";
import type { JsonValue } from "../runtime/protocol";

const ERROR_RETRY_MS = 4_000;

export type BrowserPageStatus = "loading" | "page" | "not-found" | "unavailable" | "error";

export interface BrowserPageHostRuntime {
  model: BrowserAppModel;
  locale?: () => string;
  getFacts?: () => ReadonlySet<string>;
  subscribeFacts?: (listener: () => void) => () => void;
  subscribeEnvelopeChanges?: (listener: () => void) => () => void;
  invokeCommand?: (command: string, payload: Record<string, JsonValue>) => Promise<JsonValue>;
  podcast?: BrowserPodcastRuntime;
}

export interface BrowserPageContextMenuPayload extends BrowserFrameContextMenuEvent {
  sendEditAction(action: BrowserEditAction): void;
}

export interface BrowserPageViewProps {
  runtime: BrowserPageHostRuntime;
  url: string;
  reloadNonce: number;
  isMaximized: boolean;
  showWhiteFlash?: boolean;
  active?: boolean;
  restoreScroll?: { y: number; token: number } | null;
  onTitleChange: (title: string) => void;
  onFaviconChange?: (favicon: string | null) => void;
  onStatusChange?: (status: BrowserPageStatus) => void;
  onEnvelopeChange: (envelopeId: string | null) => void;
  onNavigate?: (url: string, options?: { newTab?: boolean; popup?: boolean; back?: boolean }) => void;
  onActivate: () => void;
  onLinkHover?: (url: string | null) => void;
  onReady: () => void;
  onContentReady?: () => void;
  onSubmittableChange?: (value: boolean) => void;
  onRequestExtensionInstall?: () => Promise<boolean>;
  onScrollChange?: (y: number) => void;
  onContextMenu?: (payload: BrowserPageContextMenuPayload) => void;
}

interface PreparedPage {
  generation: number;
  artifactId: string;
  pageUrl: string;
  data: BrowserPageData;
  srcDoc: string;
}

function factsSnapshot(facts: ReadonlySet<string>): Record<string, boolean> {
  return Object.fromEntries([...facts].map((fact) => [fact, true]));
}

function errorStatus(result: BrowserPageFetchResult): BrowserPageStatus {
  if (result.status === 502) return "unavailable";
  return result.ok ? "error" : "not-found";
}

export function BrowserPageView({
  runtime,
  url,
  reloadNonce,
  isMaximized,
  showWhiteFlash = false,
  active = true,
  restoreScroll = null,
  onTitleChange,
  onFaviconChange,
  onStatusChange,
  onEnvelopeChange,
  onNavigate,
  onActivate,
  onLinkHover,
  onReady,
  onContentReady,
  onSubmittableChange,
  onRequestExtensionInstall,
  onScrollChange,
  onContextMenu,
}: BrowserPageViewProps) {
  const { pageUrl, hash } = useMemo(() => splitBrowserUrl(url), [url]);
  const [displayed, setDisplayed] = useState<PreparedPage | null>(null);
  const [incoming, setIncoming] = useState<PreparedPage | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [status, setStatus] = useState<BrowserPageStatus>("loading");
  const [errorBody, setErrorBody] = useState<string | null>(null);
  const [errorNonce, setErrorNonce] = useState(0);
  const [factNonce, setFactNonce] = useState(0);
  const [envelopeNonce, setEnvelopeNonce] = useState(0);
  const generation = useRef(0);
  const urlRef = useRef(url);
  urlRef.current = url;
  const maximizedRef = useRef(isMaximized);
  maximizedRef.current = isMaximized;
  const bridges = useRef(new Map<number, BrowserFrameBridge>());
  const frames = useRef(new Map<number, HTMLIFrameElement>());
  const queuedInactiveFacts = useRef<Array<Record<string, JsonValue>>>([]);
  const factsRef = useRef<ReadonlySet<string>>(runtime.getFacts?.() ?? new Set());
  const previousFacts = useRef(new Set<string>());
  const previousUrl = useRef(url);
  const restoreToken = useRef<number | null>(null);
  const podcast = useMemo(() => runtime.podcast ?? new BrowserPodcastRuntime(), [runtime.podcast]);

  const invoke = useCallback(async (command: string, payload: Record<string, JsonValue>, owner: string) => {
    if (command === "bounty.installExtension") {
      return active
        ? { ok: (await onRequestExtensionInstall?.()) === true }
        : { ok: false, reason: "inactive_tab" };
    }
    if (command.startsWith("podcast.")) {
      return active
        ? podcast.invoke(command, payload, owner)
        : { ok: false, reason: "inactive_tab" };
    }
    if (command === "client.emitFact" && !active) {
      queuedInactiveFacts.current.push(payload);
      return { ok: true };
    }
    return runtime.invokeCommand?.(command, payload)
      ?? runtime.model.invokeCommand(command, payload);
  }, [active, onRequestExtensionInstall, podcast, runtime]);

  const attachFrame = useCallback((page: PreparedPage): RefCallback<HTMLIFrameElement> => (frame) => {
    const existing = bridges.current.get(page.generation);
    if (!frame) {
      existing?.dispose();
      bridges.current.delete(page.generation);
      frames.current.delete(page.generation);
      return;
    }
    if (frames.current.get(page.generation) === frame && existing) return;
    existing?.dispose();
    frames.current.set(page.generation, frame);
    const bridge = createBrowserFrameBridge({
      iframe: frame,
      allowedCommands: page.data.allowed_commands,
      invokeCommand: (command, payload) => invoke(command, payload, page.pageUrl),
      onNavigate: (target, options) => onNavigate?.(target, options),
      onActivate,
      onLinkHover,
      onSubmittable: (value) => {
        if (displayed?.generation === page.generation && page.pageUrl === pageUrl)
          onSubmittableChange?.(value);
      },
      onTitle: (title) => {
        if (displayed?.generation === page.generation) onTitleChange(title);
      },
      onScroll: (y) => {
        if (displayed?.generation === page.generation) onScrollChange?.(y);
      },
      onContextMenu: (event, sendEditAction) => {
        if (!active || displayed?.generation !== page.generation) return;
        const rect = frame.getBoundingClientRect();
        onContextMenu?.({
          ...event,
          x: rect.left + event.x,
          y: rect.top + event.y,
          sendEditAction,
        });
      },
    });
    bridges.current.set(page.generation, bridge);
    bridge.pushWindowState({ isMaximized });
    bridge.pushFacts({ emitted: [...factsRef.current], retracted: [], snapshot: factsSnapshot(factsRef.current) });
    bridge.pushPodcastState(podcast.snapshot());
  }, [active, displayed?.generation, invoke, isMaximized, onActivate, onContextMenu, onLinkHover, onNavigate, onScrollChange, onSubmittableChange, onTitleChange, pageUrl, podcast]);

  useEffect(() => () => {
    for (const bridge of bridges.current.values()) bridge.dispose();
    bridges.current.clear();
    frames.current.clear();
  }, []);

  useEffect(() => runtime.subscribeFacts?.(() => {
    factsRef.current = runtime.getFacts?.() ?? new Set();
    setFactNonce((value) => value + 1);
  }), [runtime]);

  useEffect(() => runtime.subscribeEnvelopeChanges?.(() => setEnvelopeNonce((value) => value + 1)), [runtime]);

  useEffect(() => {
    const next = new Set(runtime.getFacts?.() ?? []);
    factsRef.current = next;
    const previous = previousFacts.current;
    const emitted = [...next].filter((fact) => !previous.has(fact));
    const retracted = [...previous].filter((fact) => !next.has(fact));
    previousFacts.current = next;
    if (emitted.length === 0 && retracted.length === 0) return;
    const snapshot = factsSnapshot(next);
    for (const bridge of bridges.current.values()) bridge.pushFacts({ emitted, retracted, snapshot });
  }, [factNonce, runtime]);

  useEffect(() => {
    for (const bridge of bridges.current.values()) bridge.pushWindowState({ isMaximized });
  }, [isMaximized]);

  useEffect(() => podcast.subscribe((state) => {
    for (const bridge of bridges.current.values()) bridge.pushPodcastState(state);
  }), [podcast]);

  useEffect(() => {
    podcast.retainOwner(pageUrl);
    return () => podcast.releaseOwner(pageUrl);
  }, [pageUrl, podcast]);

  useEffect(() => {
    if (!active || queuedInactiveFacts.current.length === 0) return;
    const queue = queuedInactiveFacts.current.splice(0);
    for (const payload of queue) void (runtime.invokeCommand?.("client.emitFact", payload) ?? runtime.model.invokeCommand("client.emitFact", payload));
  }, [active, runtime]);

  useEffect(() => {
    if (!active || !displayed?.data.read_fact) return;
    void (runtime.invokeCommand?.("client.emitFact", { factId: displayed.data.read_fact })
      ?? runtime.model.invokeCommand("client.emitFact", { factId: displayed.data.read_fact }));
  }, [active, displayed?.data.read_fact, runtime]);

  useEffect(() => {
    const before = previousUrl.current;
    previousUrl.current = url;
    if (!hash || !displayed || !loaded || !browserSameDocumentHashChange(before, url)) return;
    bridges.current.get(displayed.generation)?.scrollToHash(hash);
  }, [displayed, hash, loaded, url]);

  useEffect(() => {
    if (!restoreScroll || !displayed || !loaded || displayed.pageUrl !== pageUrl) return;
    if (restoreToken.current === restoreScroll.token) return;
    restoreToken.current = restoreScroll.token;
    bridges.current.get(displayed.generation)?.scrollToPosition(restoreScroll.y);
  }, [displayed, loaded, pageUrl, restoreScroll]);

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    setErrorBody(null);
    onSubmittableChange?.(false);
    void runtime.model.fetchPage(pageUrl).then(async (result) => {
      if (cancelled) return;
      if (!result.ok || !result.artifact) {
        setStatus(errorStatus(result));
        setErrorBody(result.body ?? null);
        setIncoming(null);
        setDisplayed(null);
        setLoaded(false);
        return;
      }
      const data = normalizeBrowserPageData(result.artifact.data);
      if (!data) {
        setStatus("not-found");
        setErrorBody(null);
        setIncoming(null);
        setDisplayed(null);
        setLoaded(false);
        return;
      }
      const locale = runtime.locale?.() ?? navigator.language ?? "en";
      const resolvedLocale = data.supported_locales.includes(locale)
        ? locale
        : (data.supported_locales[0] ?? locale);
      const fontCss = await buildBrowserFontCss(data.fonts);
      if (cancelled) return;
      const prepared: PreparedPage = {
        generation: ++generation.current,
        artifactId: result.artifact.id,
        pageUrl,
        data,
        srcDoc: buildBrowserIframeSrcDoc({
          locale: resolvedLocale,
          facts: factsSnapshot(factsRef.current),
          bodyHtml: data.body_html,
          url: urlRef.current,
          isMaximized: maximizedRef.current,
          fontCss,
        }),
      };
      if (displayed && displayed.artifactId === prepared.artifactId && displayed.pageUrl === pageUrl) {
        setIncoming(null);
        setStatus(loaded ? "page" : "loading");
        return;
      }
      if (displayed) setIncoming(prepared);
      else {
        setDisplayed(prepared);
        setIncoming(null);
        setLoaded(false);
      }
    }).catch(() => {
      if (!cancelled) {
        setStatus("error");
        setErrorBody(null);
      }
    });
    return () => { cancelled = true; };
  }, [displayed?.artifactId, envelopeNonce, factNonce, pageUrl, reloadNonce, runtime]);

  useEffect(() => {
    if (!status || !["error", "not-found", "unavailable"].includes(status)) return;
    const timer = setInterval(() => setErrorNonce((value) => value + 1), ERROR_RETRY_MS);
    return () => clearInterval(timer);
  }, [status]);

  useEffect(() => {
    if (errorNonce > 0) setEnvelopeNonce((value) => value + 1);
  }, [errorNonce]);

  const swapIncoming = useCallback((page: PreparedPage) => {
    if (incoming?.generation !== page.generation) return;
    setDisplayed(page);
    setIncoming(null);
    setLoaded(true);
    setStatus("page");
    onReady();
    onContentReady?.();
  }, [incoming?.generation, onContentReady, onReady]);

  const displayedLoaded = useCallback((page: PreparedPage) => {
    setLoaded(true);
    setStatus("page");
    bridges.current.get(page.generation)?.pushPodcastState(podcast.snapshot());
    onReady();
    onContentReady?.();
  }, [onContentReady, onReady, podcast]);

  const currentTitle = displayed?.data.title ?? "";
  const currentFavicon = displayed?.data.favicon ?? null;
  useEffect(() => onTitleChange(currentTitle), [currentTitle, onTitleChange]);
  useEffect(() => onFaviconChange?.(currentFavicon), [currentFavicon, onFaviconChange]);
  useEffect(() => onEnvelopeChange(displayed?.artifactId ?? null), [displayed?.artifactId, onEnvelopeChange]);
  useEffect(() => onStatusChange?.(status), [onStatusChange, status]);
  useEffect(() => onScrollChange?.(0), [displayed?.generation, onScrollChange]);

  const errorSrcDoc = useMemo(() => errorBody
    ? buildBrowserIframeSrcDoc({ locale: runtime.locale?.() ?? "en", facts: {}, bodyHtml: errorBody, url, isMaximized })
    : null,
    [errorBody, isMaximized, runtime, url]);

  return (
    <div className="absolute inset-0 bg-white">
      {status !== "page" && !displayed ? (
        errorSrcDoc ? (
          <iframe
            srcDoc={errorSrcDoc}
            title={status}
            sandbox={BROWSER_IFRAME_SANDBOX}
            referrerPolicy="no-referrer"
            data-browser-page-frame=""
            className="absolute inset-0 h-full w-full border-0"
          />
        ) : status === "loading" ? null : (
          <div className="absolute inset-0 flex items-center justify-center bg-white px-6 text-center text-sm text-zinc-500">
            {url}
          </div>
        )
      ) : null}

      {displayed ? (
        <iframe
          key={displayed.generation}
          ref={attachFrame(displayed)}
          srcDoc={displayed.srcDoc}
          title={displayed.data.title}
          sandbox={BROWSER_IFRAME_SANDBOX}
          referrerPolicy="no-referrer"
          data-browser-page-frame=""
          onLoad={() => displayedLoaded(displayed)}
          className="absolute inset-0 h-full w-full border-0"
        />
      ) : null}

      {incoming ? (
        <iframe
          key={incoming.generation}
          ref={attachFrame(incoming)}
          srcDoc={incoming.srcDoc}
          title={incoming.data.title}
          sandbox={BROWSER_IFRAME_SANDBOX}
          referrerPolicy="no-referrer"
          data-browser-page-frame=""
          onLoad={() => swapIncoming(incoming)}
          className="absolute inset-0 h-full w-full border-0"
          style={{ visibility: "hidden" }}
          aria-hidden
        />
      ) : null}

      {showWhiteFlash ? <div className="absolute inset-0 bg-white" aria-hidden /> : null}
      <div
        aria-hidden
        className="browser-glitch-shield pointer-events-none absolute inset-0 bg-zinc-950"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, rgba(255,255,255,0.06) 0px, rgba(255,255,255,0.06) 1px, transparent 1px, transparent 3px)",
        }}
      />
    </div>
  );
}
