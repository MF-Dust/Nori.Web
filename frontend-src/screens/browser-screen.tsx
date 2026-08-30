import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type DragEvent,
  type FormEvent,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from "react";
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  Globe2,
  Home,
  Plus,
  RefreshCw,
  Star,
  X,
} from "lucide-react";
import {
  BROWSER_HOME_URL,
  browserSearchUrl,
  isBrowserAbsoluteInput,
  normalizeBrowserInput,
  loadBrowserBookmarks,
  loadBrowserTabs,
  resolveBrowserUrl,
  saveBrowserBookmarks,
  saveBrowserTabs,
  type BrowserBookmark as BrowserBookmarkData,
} from "../apps/browser-page-runtime";
import type { BrowserIntentStore } from "../intents/browser-intent";
import {
  useManagedWindowRuntime,
  useWindowAppRuntime,
  useWindowPresentationRuntime,
} from "../components/window-runtime-context";
import {
  BrowserPageView,
  type BrowserPageContextMenuPayload,
  type BrowserPageHostRuntime,
  type BrowserPageStatus,
} from "./browser-page-view";

const BLANK_URL = "";
let tabSequence = 0;
let restoreSequence = 0;
const RELOAD_FLASH_MS = 240;

interface BrowserHistoryEntry {
  url: string;
  scrollY: number;
}

interface BrowserTab {
  id: string;
  url: string;
  input: string;
  title: string;
  favicon: string;
  status: BrowserPageStatus;
  history: BrowserHistoryEntry[];
  historyIndex: number;
  restoreScroll: { y: number; token: number } | null;
  reloadNonce: number;
  whiteFlash: boolean;
  pinned: boolean;
  openerId: string | null;
  envelopeId?: string;
  homeOverlay: boolean;
}

export interface BrowserScreenProps {
  runtime: BrowserPageHostRuntime;
  initialUrl?: string;
  intent?: BrowserIntentStore;
  isMaximized: boolean;
  setTitle(title: string): void;
  translate: (key: string, params?: Record<string, string>) => string;
  playCue?: (cue: string, options?: { pitch?: number; volume?: number }) => void;
  onReady?: () => void;
  setPageContext?: (context: string | null) => void;
}

function createTab(url: string, pinned = false, openerId: string | null = null): BrowserTab {
  const id = `tab-${++tabSequence}`;
  return {
    id,
    url,
    input: url,
    title: "",
    favicon: "",
    status: url === BLANK_URL ? "page" : "loading",
    history: [{ url, scrollY: 0 }],
    historyIndex: 0,
    restoreScroll: null,
    reloadNonce: 0,
    whiteFlash: false,
    pinned,
    openerId,
    homeOverlay: false,
  };
}

function insertChildTab(tabs: BrowserTab[], tab: BrowserTab): BrowserTab[] {
  const next = [...tabs];
  const opener = tab.openerId ? next.findIndex((item) => item.id === tab.openerId) : -1;
  if (opener < 0) {
    next.push(tab);
    return next;
  }
  const pinnedCount = next.filter((item) => item.pinned).length;
  let at = Math.max(opener + 1, pinnedCount);
  while (at < next.length && next[at]?.openerId === tab.openerId) at += 1;
  next.splice(at, 0, tab);
  return next;
}

function faviconFallback(url: string, title = ""): string {
  const source = (title || url).trim();
  try {
    return new URL(url).host.replace(/^www\./i, "")[0]?.toUpperCase() ?? "?";
  } catch {
    return source[0]?.toUpperCase() ?? "?";
  }
}

function BrowserFavicon({ src, url, title, className = "size-4" }: { src?: string; url: string; title?: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  if (!src || failed) {
    return (
      <span className={`flex ${className} items-center justify-center rounded bg-foreground/10 text-[10px] font-semibold`}>
        {faviconFallback(url, title)}
      </span>
    );
  }
  return <img src={src} alt="" aria-hidden draggable={false} onError={() => setFailed(true)} className={`${className} rounded-[3px] object-contain`} />;
}

function BrowserHome({
  bookmarks,
  facts,
  translate,
  onOpen,
  onRemoveBookmark,
}: {
  bookmarks: BrowserBookmarkData[];
  facts: ReadonlySet<string>;
  translate: BrowserScreenProps["translate"];
  onOpen(url: string): void;
  onRemoveBookmark(url: string): void;
}) {
  const links = [
    { name: "Doodle", url: "https://doodle.search/", favicon: "/webAssets/doodle/favicon.svg" },
    { name: "子午线邮报", url: BROWSER_HOME_URL, favicon: "/webAssets/meridian_post/favicon.svg" },
    { name: "Pulse", url: "https://pulse.social/", favicon: "/webAssets/pulse/favicon.svg" },
    ...(facts.has("driftnet.quick_access")
      ? [{
          name: "driftnet",
          url: "https://driftnet3jo3cp2q4dzwsoaiph5qxr5axirfxjcq4dzpmotxvct3qhvd.onion/",
          favicon: "/webAssets/driftnet/favicon.svg",
        }]
      : []),
  ];
  return (
    <div className="absolute inset-0 overflow-y-auto bg-background text-foreground">
      <div className="mx-auto w-full max-w-2xl px-8 py-14">
        <section>
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {translate("browser.home.quickLinks")}
          </h2>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
            {links.map((link) => (
              <button key={link.url} type="button" onClick={() => onOpen(link.url)} className="group flex flex-col items-center gap-2 rounded-xl border border-border/60 bg-foreground/[0.03] px-3 py-4 text-center transition-colors hover:border-border hover:bg-foreground/[0.07]">
                <BrowserFavicon src={link.favicon} url={link.url} title={link.name} className="size-10" />
                <span className="line-clamp-1 w-full text-xs font-medium">{link.name}</span>
              </button>
            ))}
          </div>
        </section>
        <section className="mt-10">
          <h2 className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Bookmark className="size-3.5" /> {translate("browser.home.bookmarks")}
          </h2>
          {bookmarks.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border/60 bg-foreground/[0.03] px-6 py-10 text-center">
              <Star className="size-5 text-muted-foreground/50" />
              <p className="text-xs text-muted-foreground">{translate("browser.home.noBookmarks")}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {bookmarks.map((bookmark) => (
                <div key={bookmark.url} className="group flex items-center gap-2 rounded-lg border border-border/60 bg-foreground/[0.03] pl-1 pr-2 transition-colors hover:border-border hover:bg-foreground/[0.07]">
                  <button type="button" onClick={() => onOpen(bookmark.url)} className="flex min-w-0 flex-1 items-center gap-2.5 py-2 pl-2 text-left">
                    <BrowserFavicon src={bookmark.favicon} url={bookmark.url} title={bookmark.title} className="size-7 shrink-0" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{bookmark.title || bookmark.url}</span>
                      <span className="block truncate text-[11px] text-muted-foreground">{bookmark.url}</span>
                    </span>
                  </button>
                  <button type="button" onClick={() => onRemoveBookmark(bookmark.url)} className="flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-opacity hover:bg-foreground/10 hover:text-foreground group-hover:opacity-100" aria-label={translate("browser.removeBookmark")}>
                    <X className="size-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function ToolbarButton({ icon: Icon, label, disabled, onClick }: { icon: typeof ArrowLeft; label: string; disabled?: boolean; onClick(): void }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition hover:bg-white/10 hover:brightness-125 active:scale-90 active:bg-white/15 disabled:pointer-events-none disabled:text-muted-foreground/40" aria-label={label} title={label}>
      <Icon className="size-4" />
    </button>
  );
}

interface MenuState {
  x: number;
  y: number;
  kind: "tab" | "page";
  tabId?: string;
  page?: BrowserPageContextMenuPayload;
}

export function BrowserScreen({
  runtime,
  initialUrl,
  intent,
  isMaximized,
  setTitle,
  translate,
  playCue,
  onReady,
  setPageContext,
}: BrowserScreenProps) {
  const app = useWindowAppRuntime();
  const managedWindow = useManagedWindowRuntime();
  const presentation = useWindowPresentationRuntime();
  const restored = useMemo(() => loadBrowserTabs(), []);
  const initial = useMemo(() => {
    if (initialUrl) return [createTab(initialUrl)];
    return restored.tabs.length > 0
      ? restored.tabs.map((tab) => createTab(tab.url, tab.pinned === true))
      : [createTab(BLANK_URL)];
  }, []);
  const [tabs, setTabs] = useState<BrowserTab[]>(initial);
  const [activeId, setActiveId] = useState(() => initialUrl
    ? (initial[0]?.id ?? "")
    : (initial[restored.activeIndex]?.id ?? initial[0]?.id ?? ""));
  const [bookmarks, setBookmarks] = useState<BrowserBookmarkData[]>(() => loadBrowserBookmarks());
  const [hoverUrl, setHoverUrl] = useState<string | null>(null);
  const [factsVersion, setFactsVersion] = useState(0);
  const [menu, setMenu] = useState<MenuState | null>(null);
  const scroll = useRef(new Map<string, number>());
  const reloadTimers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const addressInput = useRef<HTMLInputElement | null>(null);
  const draggingTab = useRef<string | null>(null);

  const active = tabs.find((tab) => tab.id === activeId) ?? tabs[0];
  const facts = runtime.getFacts?.() ?? new Set<string>();
  void factsVersion;

  useEffect(() => runtime.subscribeFacts?.(() => setFactsVersion((value) => value + 1)), [runtime]);
  useEffect(() => () => {
    for (const timer of reloadTimers.current.values()) clearTimeout(timer);
  }, []);
  useEffect(() => {
    const index = Math.max(0, tabs.findIndex((tab) => tab.id === activeId));
    saveBrowserTabs(tabs.map((tab) => ({ url: tab.url, ...(tab.pinned ? { pinned: true } : {}) })), index);
  }, [activeId, tabs]);
  useEffect(() => saveBrowserBookmarks(bookmarks), [bookmarks]);
  useEffect(() => setTitle(translate("browser.title")), [setTitle, translate]);
  useEffect(() => setPageContext?.(active?.envelopeId ? `page:${active.envelopeId}` : null), [active?.envelopeId, setPageContext]);

  const patchTab = useCallback((id: string, patcher: (tab: BrowserTab) => BrowserTab) => {
    setTabs((current) => current.map((tab) => tab.id === id ? patcher(tab) : tab));
  }, []);

  const commitNavigation = useCallback((id: string, target: string) => {
    playCue?.("webapps-browser-navigate");
    const currentScroll = scroll.current.get(id) ?? 0;
    patchTab(id, (tab) => {
      if (target === tab.url) return { ...tab, input: target };
      const history = tab.history.slice(0, tab.historyIndex + 1);
      const current = history[tab.historyIndex];
      if (current) history[tab.historyIndex] = { ...current, scrollY: currentScroll };
      history.push({ url: target, scrollY: 0 });
      const blank = target === BLANK_URL;
      const sameHash = tab.url !== target && (() => {
        try {
          const a = new URL(tab.url), b = new URL(target);
          const ah = a.hash, bh = b.hash;
          a.hash = ""; b.hash = "";
          return a.toString() === b.toString() && ah !== bh;
        } catch { return false; }
      })();
      return {
        ...tab,
        url: target,
        input: target,
        title: blank ? "" : tab.title,
        favicon: blank ? "" : tab.favicon,
        envelopeId: blank ? undefined : tab.envelopeId,
        history,
        historyIndex: history.length - 1,
        status: blank || sameHash ? "page" : "loading",
        restoreScroll: null,
        homeOverlay: tab.url === BLANK_URL && target !== BLANK_URL,
      };
    });
  }, [patchTab, playCue]);

  const openTab = useCallback((url = BLANK_URL, openerId: string | null = null) => {
    const tab = createTab(url, false, openerId);
    if (url === BLANK_URL) queueMicrotask(() => addressInput.current?.focus());
    playCue?.("webapps-browser-tab-open");
    setTabs((current) => insertChildTab(current, tab));
    setActiveId(tab.id);
  }, [playCue]);

  useEffect(() => {
    if (!intent) return;
    const consume = () => {
      const pending = intent.snapshot();
      if (!pending) return;
      openTab(pending.url, activeId || null);
      intent.clear(pending.id);
    };
    consume();
    return intent.subscribe(consume);
  }, [activeId, intent, openTab]);

  const selectTab = useCallback((id: string) => {
    if (id === activeId) return;
    const leaving = tabs.find((tab) => tab.id === activeId);
    if (leaving && leaving.url !== BLANK_URL && leaving.status !== "loading") {
      const y = scroll.current.get(leaving.id) ?? 0;
      if (y > 0) patchTab(leaving.id, (tab) => ({ ...tab, restoreScroll: { y, token: ++restoreSequence } }));
    }
    setActiveId(id);
  }, [activeId, patchTab, tabs]);

  const closeTab = useCallback((id: string) => {
    playCue?.("webapps-browser-tab-close");
    setTabs((current) => {
      if (current.length <= 1) {
        const replacement = createTab(BLANK_URL);
        setActiveId(replacement.id);
        return [replacement];
      }
      const index = current.findIndex((tab) => tab.id === id);
      const next = current.filter((tab) => tab.id !== id);
      if (id === activeId) setActiveId(next[Math.min(index, next.length - 1)]?.id ?? next[0]?.id ?? "");
      return next;
    });
  }, [activeId, playCue]);

  const duplicateTab = useCallback((id: string) => {
    setTabs((current) => {
      const index = current.findIndex((tab) => tab.id === id);
      if (index < 0) return current;
      const copy = createTab(current[index]!.url, current[index]!.pinned);
      const next = [...current];
      next.splice(index + 1, 0, copy);
      setActiveId(copy.id);
      return next;
    });
  }, []);

  const setPinned = useCallback((id: string, pinned: boolean) => {
    setTabs((current) => {
      const tab = current.find((item) => item.id === id);
      if (!tab || tab.pinned === pinned) return current;
      const nextTab = { ...tab, pinned };
      const rest = current.filter((item) => item.id !== id);
      const pinnedCount = rest.filter((item) => item.pinned).length;
      rest.splice(pinned ? pinnedCount : rest.filter((item) => item.pinned).length, 0, nextTab);
      return rest;
    });
  }, []);

  const closeOtherTabs = useCallback((id: string) => {
    setTabs((current) => current.filter((tab) => tab.id === id || tab.pinned));
    selectTab(id);
  }, [selectTab]);

  const navigateHistory = useCallback((id: string, delta: number) => {
    playCue?.("webapps-browser-navigate");
    const y = scroll.current.get(id) ?? 0;
    patchTab(id, (tab) => {
      const index = tab.historyIndex + delta;
      if (index < 0 || index >= tab.history.length) return tab;
      const history = tab.history.map((entry, at) => at === tab.historyIndex ? { ...entry, scrollY: y } : entry);
      const target = history[index]?.url ?? BLANK_URL;
      return {
        ...tab,
        history,
        historyIndex: index,
        url: target,
        input: target,
        title: target === BLANK_URL ? "" : tab.title,
        favicon: target === BLANK_URL ? "" : tab.favicon,
        envelopeId: target === BLANK_URL ? undefined : tab.envelopeId,
        status: target === BLANK_URL ? "page" : "loading",
        restoreScroll: target === BLANK_URL ? null : { y: history[index]?.scrollY ?? 0, token: ++restoreSequence },
        homeOverlay: false,
      };
    });
  }, [patchTab, playCue]);

  const reload = useCallback((id: string) => {
    playCue?.("webapps-browser-navigate");
    const y = scroll.current.get(id) ?? 0;
    patchTab(id, (tab) => ({ ...tab, reloadNonce: tab.reloadNonce + 1, whiteFlash: true, restoreScroll: { y, token: ++restoreSequence } }));
    const previous = reloadTimers.current.get(id);
    if (previous) clearTimeout(previous);
    reloadTimers.current.set(id, setTimeout(() => {
      patchTab(id, (tab) => ({ ...tab, whiteFlash: false }));
      reloadTimers.current.delete(id);
    }, RELOAD_FLASH_MS));
  }, [patchTab, playCue]);

  const navigateInput = useCallback((event: FormEvent) => {
    event.preventDefault();
    if (!active) return;
    const value = active.input.trim();
    if (!value) return;
    commitNavigation(
      active.id,
      isBrowserAbsoluteInput(value) ? normalizeBrowserInput(value) : browserSearchUrl(value),
    );
  }, [active, commitNavigation]);

  const pageNavigate = useCallback((tab: BrowserTab, target: string, options?: { newTab?: boolean; popup?: boolean; back?: boolean }) => {
    if (options?.back && !options.newTab && !options.popup && tab.historyIndex > 0) {
      navigateHistory(tab.id, -1);
      return;
    }
    const base = tab.url !== BLANK_URL ? tab.url : BROWSER_HOME_URL;
    const resolved = resolveBrowserUrl(target.trim(), base);
    if (options?.popup) {
      app.createWindow("popup", { url: resolved.url });
      return;
    }
    if (options?.newTab || resolved.kind === "absolute") {
      openTab(resolved.url, tab.id);
      return;
    }
    commitNavigation(tab.id, resolved.url);
  }, [app, commitNavigation, navigateHistory, openTab]);

  const toggleBookmark = useCallback(() => {
    if (!active || active.url === BLANK_URL) return;
    const exists = bookmarks.some((bookmark) => bookmark.url === active.url);
    playCue?.("webapps-browser-bookmark", exists ? { pitch: 0.8, volume: 0.85 } : undefined);
    setBookmarks((current) => exists
      ? current.filter((bookmark) => bookmark.url !== active.url)
      : [...current, { url: active.url, title: active.title || active.url, ...(active.favicon ? { favicon: active.favicon } : {}) }]);
  }, [active, bookmarks, playCue]);

  const removeBookmark = useCallback((url: string) => {
    playCue?.("webapps-browser-bookmark", { pitch: 0.8, volume: 0.85 });
    setBookmarks((current) => current.filter((bookmark) => bookmark.url !== url));
  }, [playCue]);

  const onDragStart = (event: DragEvent, id: string) => {
    draggingTab.current = id;
    event.dataTransfer.effectAllowed = "move";
  };
  const onDragOver = (event: DragEvent, overId: string) => {
    event.preventDefault();
    const id = draggingTab.current;
    if (!id || id === overId) return;
    setTabs((current) => {
      const from = current.findIndex((tab) => tab.id === id);
      const to = current.findIndex((tab) => tab.id === overId);
      if (from < 0 || to < 0) return current;
      const next = [...current];
      const [moved] = next.splice(from, 1);
      if (!moved) return current;
      next.splice(to, 0, moved);
      const pinned = next.filter((tab) => tab.pinned);
      const normal = next.filter((tab) => !tab.pinned);
      return pinned.length && normal.length ? [...pinned, ...normal] : next;
    });
  };

  const showMenu = (event: ReactMouseEvent, value: MenuState) => {
    event.preventDefault();
    event.stopPropagation();
    setMenu({ ...value, x: event.clientX, y: event.clientY });
  };

  useEffect(() => {
    if (!menu) return;
    const close = () => setMenu(null);
    const key = (event: KeyboardEvent) => event.key === "Escape" && close();
    window.addEventListener("pointerdown", close);
    window.addEventListener("keydown", key);
    return () => {
      window.removeEventListener("pointerdown", close);
      window.removeEventListener("keydown", key);
    };
  }, [menu]);

  const pageContextMenu = useCallback((payload: BrowserPageContextMenuPayload) => {
    setMenu({ x: payload.x, y: payload.y, kind: "page", page: payload });
  }, []);

  const tabsBar = useMemo<ReactNode>(() => (
    <div className="flex h-9 min-w-0 max-w-full flex-1 items-end gap-1 overflow-x-auto pl-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {tabs.map((tab) => {
        const selected = tab.id === activeId;
        return (
          <div
            key={tab.id}
            draggable
            data-tab-id={tab.id}
            onDragStart={(event) => onDragStart(event, tab.id)}
            onDragOver={(event) => onDragOver(event, tab.id)}
            onClick={() => selectTab(tab.id)}
            onAuxClick={(event) => { if (event.button === 1) closeTab(tab.id); }}
            onContextMenu={(event) => showMenu(event, { x: 0, y: 0, kind: "tab", tabId: tab.id })}
            className={`group relative flex h-8 shrink-0 cursor-default items-center gap-1.5 rounded-t-lg px-2 text-sm transition-colors ${tab.pinned ? "w-10 justify-center" : "w-[min(240px,18vw)] min-w-10"} ${selected ? "z-10 bg-foreground/10 text-foreground" : "text-muted-foreground hover:bg-foreground/5"}`}
            title={tab.title || (tab.url === BLANK_URL ? translate("browser.newTab") : tab.url)}
          >
            {tab.url !== BLANK_URL && tab.status === "loading" ? (
              <RefreshCw className="size-3.5 shrink-0 animate-spin" />
            ) : tab.url === BLANK_URL ? (
              <Globe2 className="size-3.5 shrink-0" />
            ) : (
              <BrowserFavicon src={tab.favicon} url={tab.url} title={tab.title} />
            )}
            {!tab.pinned ? <span className="min-w-0 flex-1 truncate text-xs">{tab.title || (tab.url === BLANK_URL ? translate("browser.newTab") : tab.url)}</span> : null}
            {!tab.pinned ? (
              <button type="button" onClick={(event) => { event.stopPropagation(); closeTab(tab.id); }} className="flex size-5 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground" aria-label={translate("browser.closeTab")}> <X className="size-3.5" /> </button>
            ) : null}
          </div>
        );
      })}
      <div className="flex h-8 shrink-0 items-center">
        <button type="button" onClick={() => openTab()} className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground" aria-label={translate("browser.newTab")} title={translate("browser.newTab")}>
          <Plus className="size-4" />
        </button>
      </div>
    </div>
  ), [activeId, closeTab, openTab, selectTab, tabs, translate]);

  useEffect(() => {
    if (!presentation) return;
    if (isMaximized) {
      presentation.setTitleBarContent({
        left: (
          <>
            <span className="shrink-0 select-none whitespace-nowrap pl-4 pr-2 text-sm font-medium text-foreground/80">
              {translate("browser.title")}
            </span>
            {tabsBar}
          </>
        ),
      });
    } else {
      presentation.setTitleBarContent(null);
    }
    return () => presentation.setTitleBarContent(null);
  }, [isMaximized, presentation, tabsBar, translate]);

  if (!active) return null;
  const canBack = active.historyIndex > 0;
  const canForward = active.historyIndex < active.history.length - 1;
  const bookmarked = active.url !== BLANK_URL && bookmarks.some((bookmark) => bookmark.url === active.url);

  const menuStyle: CSSProperties | undefined = menu ? { left: menu.x, top: menu.y } : undefined;

  return (
    <div className="relative flex h-full select-none flex-col text-foreground">
      {!isMaximized || !presentation ? <div className="flex shrink-0 items-end px-1 pt-1">{tabsBar}</div> : null}
      <div className="flex items-center gap-2 border-b border-border/50 bg-foreground/10 px-3 py-2">
        <ToolbarButton icon={ArrowLeft} label={translate("browser.back")} disabled={!canBack} onClick={() => navigateHistory(active.id, -1)} />
        <ToolbarButton icon={ArrowRight} label={translate("browser.forward")} disabled={!canForward} onClick={() => navigateHistory(active.id, 1)} />
        <ToolbarButton icon={RefreshCw} label={translate("browser.reload")} disabled={active.url === BLANK_URL} onClick={() => reload(active.id)} />
        <ToolbarButton icon={Home} label={translate("browser.home.tooltip")} onClick={() => commitNavigation(active.id, BLANK_URL)} />
        <form className="min-w-0 flex-1" onSubmit={navigateInput}>
          <div className="relative flex items-center">
            <input
              ref={addressInput}
              type="text"
              inputMode="url"
              spellCheck={false}
              autoCorrect="off"
              autoCapitalize="off"
              value={active.input}
              placeholder={translate("browser.addressPlaceholder")}
              onChange={(event) => patchTab(active.id, (tab) => ({ ...tab, input: event.target.value }))}
              className="w-full select-text rounded-full border border-border/60 bg-background/60 px-4 py-1.5 pr-9 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50"
              aria-label={translate("browser.address")}
            />
            <button type="button" onClick={toggleBookmark} disabled={active.url === BLANK_URL} className={`absolute right-1.5 flex size-6 items-center justify-center rounded-full transition ${active.url === BLANK_URL ? "text-muted-foreground/40" : bookmarked ? "text-amber-500 hover:bg-amber-500/10" : "text-muted-foreground hover:bg-white/10"}`} aria-label={translate(bookmarked ? "browser.removeBookmark" : "browser.addBookmark")}>
              <Star className={`size-4 ${bookmarked ? "fill-current" : ""}`} />
            </button>
          </div>
        </form>
      </div>

      <div className="relative min-h-0 flex-1 bg-background">
        {tabs.map((tab) => {
          const isActive = tab.id === activeId;
          return (
            <div key={tab.id} className="absolute inset-0" style={isActive ? undefined : { display: "none" }} aria-hidden={isActive ? undefined : true}>
              {tab.url === BLANK_URL ? (
                <BrowserHome bookmarks={bookmarks} facts={facts} translate={translate} onOpen={(url) => commitNavigation(tab.id, url)} onRemoveBookmark={removeBookmark} />
              ) : (
                <>
                  <BrowserPageView
                    runtime={runtime}
                    url={tab.url}
                    reloadNonce={tab.reloadNonce}
                    isMaximized={isMaximized}
                    showWhiteFlash={tab.whiteFlash}
                    active={isActive}
                    restoreScroll={tab.restoreScroll}
                    onTitleChange={(title) => patchTab(tab.id, (value) => value.title === title ? value : { ...value, title })}
                    onFaviconChange={(favicon) => patchTab(tab.id, (value) => value.favicon === (favicon ?? "") ? value : { ...value, favicon: favicon ?? "" })}
                    onStatusChange={(status) => patchTab(tab.id, (value) => value.status === status ? value : { ...value, status })}
                    onEnvelopeChange={(envelopeId) => patchTab(tab.id, (value) => value.envelopeId === (envelopeId ?? undefined) ? value : { ...value, envelopeId: envelopeId ?? undefined })}
                    onNavigate={(url, options) => pageNavigate(tab, url, options)}
                    onActivate={managedWindow.focus}
                    onLinkHover={isActive ? setHoverUrl : undefined}
                    onReady={isActive ? () => onReady?.() : () => {}}
                    onContentReady={() => patchTab(tab.id, (value) => value.homeOverlay ? { ...value, homeOverlay: false } : value)}
                    onScrollChange={(y) => scroll.current.set(tab.id, y)}
                    onContextMenu={pageContextMenu}
                  />
                  {tab.homeOverlay ? <BrowserHome bookmarks={bookmarks} facts={facts} translate={translate} onOpen={(url) => commitNavigation(tab.id, url)} onRemoveBookmark={removeBookmark} /> : null}
                </>
              )}
            </div>
          );
        })}
        {hoverUrl ? (
          <div className="pointer-events-none absolute bottom-0 left-0 z-10 max-w-[80%] truncate rounded-tr-md border-r border-t border-border/60 bg-background/95 px-2.5 py-0.5 text-[11px] text-muted-foreground shadow-sm">
            {hoverUrl}
          </div>
        ) : null}
      </div>

      {menu ? (
        <div className="fixed z-[9999] min-w-44 rounded-md border border-border bg-popover p-1 text-sm text-popover-foreground shadow-lg" style={menuStyle} onPointerDown={(event) => event.stopPropagation()} onClick={() => setMenu(null)}>
          {menu.kind === "tab" && menu.tabId ? (() => {
            const tab = tabs.find((item) => item.id === menu.tabId);
            if (!tab) return null;
            return (
              <>
                <MenuButton onClick={() => duplicateTab(tab.id)}>{translate("browser.duplicateTab")}</MenuButton>
                <MenuButton onClick={() => setPinned(tab.id, !tab.pinned)}>{translate(tab.pinned ? "browser.unpinTab" : "browser.pinTab")}</MenuButton>
                <div className="my-1 h-px bg-border" />
                <MenuButton onClick={() => closeTab(tab.id)}>{translate("browser.closeTab")}</MenuButton>
                <MenuButton disabled={tabs.every((item) => item.id === tab.id || item.pinned)} onClick={() => closeOtherTabs(tab.id)}>{translate("browser.closeOtherTabs")}</MenuButton>
              </>
            );
          })() : null}
          {menu.kind === "page" && menu.page ? (
            <PageContextMenu page={menu.page} openTab={openTab} createPopup={(url) => app.createWindow("popup", { url })} />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function MenuButton({ children, disabled, onClick }: { children: ReactNode; disabled?: boolean; onClick(): void }) {
  return (
    <button type="button" disabled={disabled} onClick={onClick} className="flex w-full items-center rounded px-2 py-1.5 text-left hover:bg-muted disabled:opacity-40">
      {children}
    </button>
  );
}

function PageContextMenu({
  page,
  openTab,
  createPopup,
}: {
  page: BrowserPageContextMenuPayload;
  openTab(url: string): void;
  createPopup(url: string): void;
}) {
  const selection = page.selectionText.trim();
  const editable = page.editable;
  const copy = () => selection && navigator.clipboard?.writeText(selection).catch(() => {});
  const cut = () => {
    void copy();
    page.sendEditAction({ action: "cut" });
  };
  const paste = () => {
    void navigator.clipboard?.readText().then((text) => page.sendEditAction({ action: "paste", text })).catch(() => {});
  };
  return (
    <>
      {page.link ? (
        <MenuButton onClick={() => page.linkPopup ? createPopup(page.link!) : openTab(page.link!)}>
          {page.linkPopup ? "Open link in new window" : "Open link in new tab"}
        </MenuButton>
      ) : null}
      {selection ? <MenuButton onClick={() => openTab(browserSearchUrl(selection))}>Search selection</MenuButton> : null}
      {(page.link || selection) ? <div className="my-1 h-px bg-border" /> : null}
      <MenuButton disabled={!selection || editable?.readOnly === true} onClick={cut}>Cut</MenuButton>
      <MenuButton disabled={!selection} onClick={() => void copy()}>Copy</MenuButton>
      <MenuButton disabled={!editable || editable.readOnly === true} onClick={paste}>Paste</MenuButton>
      <MenuButton onClick={() => page.sendEditAction({ action: "select-all" })}>Select all</MenuButton>
    </>
  );
}
