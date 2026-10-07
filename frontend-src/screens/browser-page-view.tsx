import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type RefCallback,
} from "react";
import type { BrowserAppModel, BrowserPageFetchResult } from "../apps/browser";
import {
  BROWSER_IFRAME_SANDBOX,
  BrowserPodcastRuntime,
  browserSameDocumentHashChange,
  buildBrowserIframeSrcDoc,
  createBrowserFrameBridge,
  normalizeBrowserPageData,
  resolveBrowserFontCss,
  splitBrowserUrl,
  type BrowserEditAction,
  type BrowserFrameBridge,
  type BrowserFrameContextMenuEvent,
  type BrowserPageData,
} from "../apps/browser-page-runtime";
import type { JsonValue } from "../runtime/protocol";
import { useWindowVisible } from "../components/managed-window-host";

const ERROR_RETRY_MS = 4_000;
const ERROR_RETRY_MAX_MS = 60_000;

export type BrowserPageStatus = "loading" | "page" | "not-found" | "unavailable" | "error";

const RETRY_STATUSES: readonly BrowserPageStatus[] = ["error", "not-found", "unavailable"];

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
  /**
   * Background tabs pause fact pushes, envelope refetches and error retries, and
   * catch up (one refetch if something was missed) when they become active again.
   */
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
  /** Fonts that were not cached when the srcDoc was built; delivered through the frame bridge. */
  pendingFontCss: Promise<string> | null;
}

function subscribeDocumentVisibility(listener: () => void): () => void {
  document.addEventListener("visibilitychange", listener);
  return () => document.removeEventListener("visibilitychange", listener);
}

const documentVisible = () => document.visibilityState !== "hidden";

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
  active: tabActive = true,
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
  const [refetchNonce, setRefetchNonce] = useState(0);
  const visible = useSyncExternalStore(subscribeDocumentVisibility, documentVisible, () => true);
  const windowVisible = useWindowVisible();
  const active = tabActive && windowVisible && visible;
  const awake = active;
  const generation = useRef(0);
  const urlRef = useRef(url);
  urlRef.current = url;
  const maximizedRef = useRef(isMaximized);
  maximizedRef.current = isMaximized;
  // The page-load effect must not depend on what it sets, so it reads these through refs.
  const displayedRef = useRef(displayed);
  displayedRef.current = displayed;
  const loadedRef = useRef(loaded);
  loadedRef.current = loaded;
  const activeRef = useRef(active);
  activeRef.current = active;
  // An envelope change arrived while inactive and no fetch has started since.
  const staleRef = useRef(false);
  const retryAttempts = useRef(0);
  const emittedReadFacts = useRef(new Set<string>());
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

  // Frame refs stay stable across parent renders; bridge callbacks read current props.
  const hostCallbacks = useRef({ invoke, onNavigate, onActivate, onLinkHover, onSubmittableChange,
    onTitleChange, onScrollChange, onContextMenu, active, displayed, pageUrl, isMaximized, podcast });
  hostCallbacks.current = { invoke, onNavigate, onActivate, onLinkHover, onSubmittableChange,
    onTitleChange, onScrollChange, onContextMenu, active, displayed, pageUrl, isMaximized, podcast };
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
      fontCss: page.pendingFontCss,
      invokeCommand: (command, payload) => hostCallbacks.current.invoke(command, payload, page.pageUrl),
      onNavigate: (target, options) => hostCallbacks.current.onNavigate?.(target, options),
      onActivate: () => hostCallbacks.current.onActivate(),
      onLinkHover: (url) => hostCallbacks.current.onLinkHover?.(url),
      onSubmittable: (value) => {
        const host = hostCallbacks.current;
        if (host.displayed?.generation === page.generation && page.pageUrl === host.pageUrl)
          host.onSubmittableChange?.(value);
      },
      onTitle: (title) => {
        const host = hostCallbacks.current;
        if (host.displayed?.generation === page.generation) host.onTitleChange(title);
      },
      onScroll: (y) => {
        const host = hostCallbacks.current;
        if (host.displayed?.generation === page.generation) host.onScrollChange?.(y);
      },
      onContextMenu: (event, sendEditAction) => {
        const host = hostCallbacks.current;
        if (!host.active || host.displayed?.generation !== page.generation) return;
        const rect = frame.getBoundingClientRect();
        host.onContextMenu?.({
          ...event,
          x: rect.left + event.x,
          y: rect.top + event.y,
          sendEditAction,
        });
      },
    });
    bridges.current.set(page.generation, bridge);
    const host = hostCallbacks.current;
    bridge.pushWindowState({ isMaximized: host.isMaximized });
    bridge.pushFacts({ emitted: [...factsRef.current], retracted: [], snapshot: factsSnapshot(factsRef.current) });
    if (host.active) bridge.pushPodcastState(host.podcast.snapshot());
  }, []);
  const displayedFrameRef = useMemo(() => displayed ? attachFrame(displayed) : undefined, [attachFrame, displayed]);
  const incomingFrameRef = useMemo(() => incoming ? attachFrame(incoming) : undefined, [attachFrame, incoming]);

  useEffect(() => () => {
    for (const bridge of bridges.current.values()) bridge.dispose();
    bridges.current.clear();
    frames.current.clear();
  }, []);

  const syncFacts = useCallback(() => {
    const next = new Set(runtime.getFacts?.() ?? []);
    factsRef.current = next;
    const previous = previousFacts.current;
    const emitted = [...next].filter((fact) => !previous.has(fact));
    const retracted = [...previous].filter((fact) => !next.has(fact));
    previousFacts.current = next;
    if (emitted.length === 0 && retracted.length === 0) return;
    const snapshot = factsSnapshot(next);
    for (const bridge of bridges.current.values()) bridge.pushFacts({ emitted, retracted, snapshot });
  }, [runtime]);

  // Facts reach the page through the bridge, never through a refetch. Background tabs
  // skip them and catch up with a single diff when they become active again.
  useEffect(() => {
    if (!active) return;
    syncFacts();
    return runtime.subscribeFacts?.(syncFacts);
  }, [active, runtime, syncFacts]);

  useEffect(() => runtime.subscribeEnvelopeChanges?.(() => {
    if (activeRef.current) setRefetchNonce((value) => value + 1);
    else staleRef.current = true;
  }), [runtime]);

  useEffect(() => {
    for (const bridge of bridges.current.values()) bridge.pushWindowState({ isMaximized });
  }, [isMaximized]);

  // `subscribe` replays the current state, so a re-activated tab catches up immediately.
  useEffect(() => {
    if (!active) return;
    return podcast.subscribe((state) => {
      for (const bridge of bridges.current.values()) bridge.pushPodcastState(state);
    });
  }, [active, podcast]);

  useEffect(() => {
    podcast.retainOwner(pageUrl);
    return () => podcast.releaseOwner(pageUrl);
  }, [pageUrl, podcast]);

  useEffect(() => {
    if (!active || queuedInactiveFacts.current.length === 0) return;
    const queue = queuedInactiveFacts.current.splice(0);
    for (const payload of queue) void (runtime.invokeCommand?.("client.emitFact", payload) ?? runtime.model.invokeCommand("client.emitFact", payload));
  }, [active, runtime]);

  const readFact = displayed?.data.read_fact;
  useEffect(() => {
    if (!active || !readFact) return;
    // Re-activating the tab or reloading the page must not re-emit a fact that is already known.
    if (emittedReadFacts.current.has(readFact) || runtime.getFacts?.().has(readFact)) return;
    emittedReadFacts.current.add(readFact);
    const payload = { factId: readFact };
    void (runtime.invokeCommand?.("client.emitFact", payload)
      ?? runtime.model.invokeCommand("client.emitFact", payload))
      .catch(() => emittedReadFacts.current.delete(readFact));
  }, [active, readFact, runtime]);

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

  // A new navigation or manual reload starts the error backoff over.
  useEffect(() => {
    retryAttempts.current = 0;
  }, [pageUrl, reloadNonce]);

  // Refetches only on URL change, manual reload, an envelope change, or an error retry.
  useEffect(() => {
    let cancelled = false;
    staleRef.current = false;
    setStatus("loading");
    setErrorBody(null);
    onSubmittableChange?.(false);
    void runtime.model.fetchPage(pageUrl).then((result) => {
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
      retryAttempts.current = 0;
      const current = displayedRef.current;
      if (current && current.artifactId === result.artifact.id && current.pageUrl === pageUrl) {
        setIncoming(null);
        setStatus(loadedRef.current ? "page" : "loading");
        return;
      }
      const locale = runtime.locale?.() ?? navigator.language ?? "en";
      const resolvedLocale = data.supported_locales.includes(locale)
        ? locale
        : (data.supported_locales[0] ?? locale);
      // The first paint never waits for font downloads: cached fonts are inlined and the
      // rest reach the frame through the bridge once it asks for them.
      const fonts = resolveBrowserFontCss(data.fonts);
      const prepared: PreparedPage = {
        generation: ++generation.current,
        artifactId: result.artifact.id,
        pageUrl,
        data,
        pendingFontCss: fonts.pending,
        srcDoc: buildBrowserIframeSrcDoc({
          locale: resolvedLocale,
          facts: factsSnapshot(factsRef.current),
          bodyHtml: data.body_html,
          url: urlRef.current,
          isMaximized: maximizedRef.current,
          fontCss: fonts.ready,
          fontsPending: fonts.pending !== null,
        }),
      };
      if (current) setIncoming(prepared);
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
  }, [pageUrl, refetchNonce, reloadNonce, runtime]);

  // Re-activating a tab (or showing the window again) catches up with one refetch when an
  // envelope change was skipped or an error retry was paused in the meantime.
  useEffect(() => {
    if (!awake || !(staleRef.current || RETRY_STATUSES.includes(status))) return;
    staleRef.current = false;
    retryAttempts.current = 0;
    setRefetchNonce((value) => value + 1);
  }, [awake]);

  // Error retries back off (4s doubling to 60s) and pause while the tab or window is hidden.
  useEffect(() => {
    if (!awake || !RETRY_STATUSES.includes(status)) return;
    const delay = Math.min(ERROR_RETRY_MS * 2 ** retryAttempts.current, ERROR_RETRY_MAX_MS);
    const timer = setTimeout(() => {
      retryAttempts.current += 1;
      setRefetchNonce((value) => value + 1);
    }, delay);
    return () => clearTimeout(timer);
  }, [awake, refetchNonce, status]);

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
  const titleChangeRef = useRef(onTitleChange);
  const faviconChangeRef = useRef(onFaviconChange);
  const envelopeChangeRef = useRef(onEnvelopeChange);
  const statusChangeRef = useRef(onStatusChange);
  const scrollChangeRef = useRef(onScrollChange);
  titleChangeRef.current = onTitleChange;
  faviconChangeRef.current = onFaviconChange;
  envelopeChangeRef.current = onEnvelopeChange;
  statusChangeRef.current = onStatusChange;
  scrollChangeRef.current = onScrollChange;
  useEffect(() => {
    titleChangeRef.current(currentTitle);
  }, [currentTitle]);
  useEffect(() => {
    faviconChangeRef.current?.(currentFavicon);
  }, [currentFavicon]);
  useEffect(() => {
    envelopeChangeRef.current(displayed?.artifactId ?? null);
  }, [displayed?.artifactId]);
  useEffect(() => {
    statusChangeRef.current?.(status);
  }, [status]);
  useEffect(() => {
    scrollChangeRef.current?.(0);
  }, [displayed?.generation]);

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
          ref={displayedFrameRef}
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
          ref={incomingFrameRef}
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
