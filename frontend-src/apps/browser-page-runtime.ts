import type { JsonValue } from "../runtime/protocol";

export const BROWSER_HOME_URL = "https://meridianpost.com/";
export const BROWSER_SEARCH_HOST = "doodle.search";
export const BROWSER_TABS_STORAGE_KEY = "noebrowser.tabs";
export const BROWSER_BOOKMARKS_STORAGE_KEY = "noebrowser.bookmarks";
export const BROWSER_IFRAME_SANDBOX =
  "allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox";

export interface BrowserFontDescriptor {
  family: string;
  url: string;
  weight?: string;
  style?: string;
}

export interface BrowserPageData {
  url: string;
  supported_locales: string[];
  title: string;
  body_html: string;
  allowed_commands: string[];
  favicon?: string;
  read_fact?: string;
  fonts?: BrowserFontDescriptor[];
}

export interface PersistedBrowserTab {
  url: string;
  pinned?: boolean;
}

export interface BrowserBookmark {
  url: string;
  title: string;
  favicon?: string;
}

export interface BrowserStoredTabs {
  tabs: PersistedBrowserTab[];
  activeIndex: number;
}

export interface BrowserResolveResult {
  kind: "same-site" | "absolute";
  url: string;
  path?: string;
}

export function normalizeBrowserArtifactUrl(value: string): string {
  try {
    const url = new URL(value);
    if (url.protocol === "http:") url.protocol = "https:";
    url.search = "";
    url.hash = "";
    return url.toString();
  } catch {
    return value;
  }
}

const SCHEME = /^[a-z][a-z0-9+.-]*:/i;
const HOST_LIKE = /^[^\s/]+\.[^\s/]+$/;

export function normalizeBrowserInput(value: string): string {
  if (SCHEME.test(value) || /^[/.#?]/.test(value)) return value;
  const first = value.split("/")[0] ?? "";
  return HOST_LIKE.test(first) ? `https://${value}` : value;
}

export function isBrowserAbsoluteInput(value: string): boolean {
  const input = value.trim();
  return input.length > 0 && SCHEME.test(normalizeBrowserInput(input));
}

export function browserSearchUrl(query: string): string {
  return `https://${BROWSER_SEARCH_HOST}/?q=${encodeURIComponent(query.trim())}`;
}

export function splitBrowserUrl(value: string): { pageUrl: string; hash: string } {
  try {
    const url = new URL(value);
    const hash = url.hash;
    url.hash = "";
    return { pageUrl: url.toString(), hash };
  } catch {
    const at = value.indexOf("#");
    return at === -1
      ? { pageUrl: value, hash: "" }
      : { pageUrl: value.slice(0, at), hash: value.slice(at) };
  }
}

export function browserSameDocumentHashChange(left: string, right: string): boolean {
  if (!left || !right || left === right) return false;
  const a = splitBrowserUrl(left);
  const b = splitBrowserUrl(right);
  return a.pageUrl === b.pageUrl && a.hash !== b.hash;
}

export function resolveBrowserUrl(input: string, base: string): BrowserResolveResult {
  const value = input.trim();
  if (!value) return { kind: "absolute", url: value };
  try {
    const next = new URL(normalizeBrowserInput(value), base);
    const current = new URL(base);
    return next.host === current.host && next.protocol === current.protocol
      ? {
          kind: "same-site",
          path: `${next.pathname}${next.search}${next.hash}`,
          url: next.toString(),
        }
      : { kind: "absolute", url: next.toString() };
  } catch {
    return { kind: "absolute", url: value };
  }
}

function safeRead(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeWrite(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Storage can be unavailable in privacy/preview environments.
  }
}

function parseJson(value: string | null): unknown {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

export function loadBrowserTabs(): BrowserStoredTabs {
  const parsed = parseJson(safeRead(BROWSER_TABS_STORAGE_KEY));
  const record = parsed && typeof parsed === "object" && !Array.isArray(parsed)
    ? parsed as Record<string, unknown>
    : null;
  const rawTabs = Array.isArray(parsed)
    ? parsed
    : record && Array.isArray(record.tabs)
      ? record.tabs
      : [];
  const tabs = rawTabs.flatMap((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) return [];
    const value = item as Record<string, unknown>;
    if (typeof value.url !== "string") return [];
    return [{ url: value.url, ...(value.pinned === true ? { pinned: true } : {}) }];
  });
  const rawIndex = record?.activeIndex;
  const activeIndex =
    typeof rawIndex === "number" && rawIndex >= 0 && rawIndex < tabs.length
      ? rawIndex
      : 0;
  return { tabs, activeIndex };
}

export function saveBrowserTabs(tabs: readonly PersistedBrowserTab[], activeIndex: number): void {
  safeWrite(BROWSER_TABS_STORAGE_KEY, JSON.stringify({ tabs, activeIndex }));
}

export function loadBrowserBookmarks(): BrowserBookmark[] {
  const parsed = parseJson(safeRead(BROWSER_BOOKMARKS_STORAGE_KEY));
  if (!Array.isArray(parsed)) return [];
  return parsed.flatMap((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) return [];
    const value = item as Record<string, unknown>;
    if (typeof value.url !== "string" || typeof value.title !== "string") return [];
    return [{
      url: value.url,
      title: value.title,
      ...(typeof value.favicon === "string" ? { favicon: value.favicon } : {}),
    }];
  });
}

export function saveBrowserBookmarks(bookmarks: readonly BrowserBookmark[]): void {
  safeWrite(BROWSER_BOOKMARKS_STORAGE_KEY, JSON.stringify(bookmarks));
}

export function normalizeBrowserPageData(value: unknown): BrowserPageData | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  if (
    typeof record.url !== "string" ||
    !Array.isArray(record.supported_locales) ||
    record.supported_locales.length === 0 ||
    !record.supported_locales.every((item) => typeof item === "string" && item.length > 0) ||
    typeof record.title !== "string" ||
    typeof record.body_html !== "string" ||
    !Array.isArray(record.allowed_commands) ||
    !record.allowed_commands.every((item) => typeof item === "string" && item.length > 0)
  ) return null;
  const fonts = Array.isArray(record.fonts)
    ? record.fonts.flatMap((font) => {
        if (!font || typeof font !== "object" || Array.isArray(font)) return [];
        const item = font as Record<string, unknown>;
        if (typeof item.family !== "string" || typeof item.url !== "string") return [];
        return [{
          family: item.family,
          url: item.url,
          ...(typeof item.weight === "string" ? { weight: item.weight } : {}),
          ...(typeof item.style === "string" ? { style: item.style } : {}),
        }];
      })
    : undefined;
  return {
    url: normalizeBrowserArtifactUrl(record.url),
    supported_locales: [...record.supported_locales] as string[],
    title: record.title,
    body_html: record.body_html,
    allowed_commands: [...record.allowed_commands] as string[],
    ...(typeof record.favicon === "string" && record.favicon ? { favicon: record.favicon } : {}),
    ...(typeof record.read_fact === "string" && record.read_fact ? { read_fact: record.read_fact } : {}),
    ...(fonts && fonts.length > 0 ? { fonts } : {}),
  };
}

const TRANSPARENT_IMAGE =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
const assetCache = new Map<string, Promise<string | null>>();
const fontCache = new Map<string, Promise<string | null>>();

function isSafeWebAsset(url: unknown): url is string {
  return typeof url === "string" && url.startsWith("/webAssets/") && !url.includes("..");
}

async function dataUri(url: string, fallbackMime: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const mime = response.headers.get("content-type")?.split(";")[0]?.trim() || fallbackMime;
    const bytes = new Uint8Array(await response.arrayBuffer());
    let binary = "";
    for (let index = 0; index < bytes.length; index += 32768) {
      binary += String.fromCharCode(...bytes.subarray(index, index + 32768));
    }
    return `data:${mime};base64,${btoa(binary)}`;
  } catch {
    return null;
  }
}

export function fetchBrowserAssetData(url: string): Promise<string | null> {
  if (!isSafeWebAsset(url)) return Promise.resolve(null);
  const current = assetCache.get(url);
  if (current) return current;
  const pending = dataUri(url, "application/octet-stream");
  assetCache.set(url, pending);
  void pending.then((value) => {
    if (value === null) assetCache.delete(url);
  });
  return pending;
}

async function fetchBrowserFontData(url: string): Promise<string | null> {
  const current = fontCache.get(url);
  if (current) return current;
  const pending = dataUri(url, "font/woff2");
  fontCache.set(url, pending);
  void pending.then((value) => {
    if (value === null) fontCache.delete(url);
  });
  return pending;
}

function safeCssToken(value: string): string {
  return value.replaceAll("<", "");
}

export async function buildBrowserFontCss(fonts?: readonly BrowserFontDescriptor[]): Promise<string> {
  if (!fonts || fonts.length === 0) return "";
  const data = await Promise.all(fonts.map((font) => fetchBrowserFontData(font.url)));
  return fonts.flatMap((font, index) => {
    const uri = data[index];
    if (!uri) return [];
    return [
      `@font-face{font-family:${JSON.stringify(font.family).replaceAll("<", "\\3c ")};` +
      `src:url(${uri});font-weight:${safeCssToken(font.weight ?? "400")};` +
      `font-style:${safeCssToken(font.style ?? "normal")}}`,
    ];
  }).join("\n");
}

const SCROLLBAR_CSS =
  "<style>::-webkit-scrollbar{width:5px;height:5px;background:var(--arcade-sb-bg,transparent)}" +
  "::-webkit-scrollbar-track{background:var(--arcade-sb-bg,transparent)}" +
  "::-webkit-scrollbar-thumb{background:rgba(113,113,122,.5);border-radius:5px}" +
  "::-webkit-scrollbar-thumb:hover{background:rgba(113,113,122,.7)}" +
  "::-webkit-scrollbar-corner{background:var(--arcade-sb-bg,transparent)}</style>";

function rewriteInlineAssets(body: string): string {
  let disabled = false;
  try {
    disabled = globalThis.localStorage?.getItem("arcade.assetInline") === "off";
  } catch {}
  if (disabled) return body;
  return body
    .replaceAll(
      /(<img\b[^>]*?)\ssrc="(\/webAssets\/[^"]*)"/gi,
      (_match, prefix: string, url: string) =>
        `${prefix} src="${TRANSPARENT_IMAGE}" data-arcade-src="${url}"`,
    )
    .replaceAll(/<link\b[^>]*>/gi, (tag) =>
      /\brel="preload"/i.test(tag) &&
      /\bas="image"/i.test(tag) &&
      /\bhref="\/webAssets\//i.test(tag)
        ? ""
        : tag,
    );
}

const BROWSER_RUNTIME_SHIM = String.raw`
;(function(){
  const w=window, init=w.__arcadeInit__||{locale:'en',url:'',facts:{},window:{isMaximized:false}};
  const facts=Object.assign({},init.facts||{}), factSubs=new Set(), winSubs=new Set(), podcastSubs=new Set();
  const winState={isMaximized:!!(init.window&&init.window.isMaximized)}; let podcastState=null, editTarget=null;
  const pending=new Map(), requested=new Set(), received={};
  const post=(m)=>window.parent.postMessage(m,'*');
  const id=()=>typeof crypto!=='undefined'&&crypto.randomUUID?crypto.randomUUID():'arcade-'+Date.now()+'-'+Math.random().toString(36).slice(2);
  function fireFacts(){factSubs.forEach(s=>{const v={};s.ids.forEach(f=>v[f]=facts[f]===true);try{s.cb(v)}catch(e){console.error('[arcade] facts subscriber',e)}})}
  function applyFacts(snapshot){Object.keys(facts).forEach(k=>delete facts[k]);Object.keys(snapshot||{}).forEach(k=>facts[k]=snapshot[k]===true);fireFacts()}
  function fireWin(){winSubs.forEach(cb=>{try{cb({isMaximized:winState.isMaximized})}catch(e){console.error('[arcade] window subscriber',e)}})}
  function applyAsset(url,data){if(typeof url!=='string')return;if(data)received[url]=data;document.querySelectorAll('img[data-arcade-src]').forEach(img=>{if(img.getAttribute('data-arcade-src')===url){img.removeAttribute('data-arcade-src');img.setAttribute('src',data||url)}})}
  function hydrate(root){const urls=[];(root||document).querySelectorAll('img[data-arcade-src]').forEach(img=>{const url=img.getAttribute('data-arcade-src');if(!url)return;if(received[url]){img.removeAttribute('data-arcade-src');img.setAttribute('src',received[url]);return}if(!requested.has(url)){requested.add(url);urls.push(url)}});if(urls.length)post({__arcade:true,type:'assets-request',urls})}
  function scrollId(hash){let raw=(hash||'').replace(/^#/,'');try{raw=decodeURIComponent(raw)}catch{}return raw}
  function scrollHash(hash){const target=scrollId(hash);if(!target)return;try{const u=new URL(arcade.url);u.hash=hash;arcade.url=u.toString()}catch{};const go=()=>{const el=document.getElementById(target)||(document.getElementsByName&&document.getElementsByName(target)[0]);if(el){try{el.scrollIntoView()}catch{};return true}return false};if(!go()&&typeof requestAnimationFrame==='function')requestAnimationFrame(go)}
  function scrollY(y){try{window.scrollTo(0,typeof y==='number'&&y>0?y:0)}catch{}}
  function isText(el){if(!el||el.nodeType!==1)return false;if(el.tagName==='TEXTAREA')return true;if(el.tagName!=='INPUT')return false;return ['text','search','url','tel','password'].includes((el.getAttribute('type')||'text').toLowerCase())}
  function editable(start){let n=start;while(n&&n!==document){if(isText(n)||n.isContentEditable)return n;n=n.parentNode}return null}
  function edit(data){const el=editTarget;if(data.action==='select-all'){if(el&&isText(el)){el.focus();el.select();return}const sel=window.getSelection();if(sel)try{sel.selectAllChildren(el&&el.isContentEditable?el:document.body)}catch{};return}if(!el)return;if(isText(el)){if(el.readOnly||el.disabled)return;const a=typeof el.selectionStart==='number'?el.selectionStart:el.value.length,b=typeof el.selectionEnd==='number'?el.selectionEnd:a,insert=data.action==='paste'?String(data.text||''):'';el.focus();try{el.setRangeText(insert,a,b,'end')}catch{return}el.dispatchEvent(new Event('input',{bubbles:true}));return}el.focus();if(data.action==='paste')document.execCommand('insertText',false,String(data.text||''));else document.execCommand('delete')}
  window.addEventListener('message',ev=>{if(ev.source!==window.parent)return;const d=ev.data;if(!d||d.__arcade!==true)return;if(d.type==='cmd-result'){const r=pending.get(d.requestId);if(r){pending.delete(d.requestId);r(d.result)}}else if(d.type==='facts')applyFacts(d.snapshot);else if(d.type==='window-state'){const n=d.isMaximized===true;if(n!==winState.isMaximized){winState.isMaximized=n;fireWin()}}else if(d.type==='podcast-state'){podcastState=d.state||null;podcastSubs.forEach(cb=>{try{cb(podcastState)}catch{}})}else if(d.type==='scroll-to-hash')scrollHash(d.hash);else if(d.type==='scroll-to-position')scrollY(d.y);else if(d.type==='edit-action')edit(d);else if(d.type==='asset-data')applyAsset(d.url,d.dataUri)});
  const arcade={locale:init.locale,url:init.url||'',facts:{current:facts,subscribe(ids,cb){const s={ids:new Set(ids),cb};factSubs.add(s);const v={};s.ids.forEach(f=>v[f]=facts[f]===true);try{cb(v)}catch{};return()=>factSubs.delete(s)}},invoke(command,payload){return new Promise(resolve=>{const requestId=id();pending.set(requestId,resolve);post({__arcade:true,type:'cmd',requestId,command,payload})})},navigate(url,newTab,popup){post({__arcade:true,type:'nav',url,newTab:newTab===true,popup:popup===true})},window:{get isMaximized(){return winState.isMaximized},subscribe(cb){winSubs.add(cb);try{cb({isMaximized:winState.isMaximized})}catch{};return()=>winSubs.delete(cb)}},podcast:{get state(){return podcastState},subscribe(cb){podcastSubs.add(cb);try{cb(podcastState)}catch{};return()=>podcastSubs.delete(cb)}}};
  Object.defineProperty(w,'arcade',{value:arcade,configurable:false,writable:false});
  function anchor(start){let n=start;while(n&&n!==document){if(n.tagName&&n.tagName.toLowerCase()==='a')return n;n=n.parentNode}return null}
  function external(a){return !!a&&a.getAttribute&&a.getAttribute('data-arcade-external')==='true'}
  function hrefOk(h){if(!h||h[0]==='#')return false;const l=h.toLowerCase();return !['javascript:','mailto:','tel:','data:'].some(p=>l.indexOf(p)===0)}
  function osLink(a){const h=a&&a.getAttribute&&a.getAttribute('href');return !!h&&(/^(mailto:|tel:)/i).test(h)}
  function rewrite(a){if(!a||a.nodeType!==1||a.tagName!=='A')return;if(external(a)){a.setAttribute('target','_blank');a.setAttribute('rel','noopener noreferrer');return}if(a.hasAttribute('data-arcade-href'))return;const h=a.getAttribute('href');if(!hrefOk(h))return;a.setAttribute('data-arcade-href',h);a.removeAttribute('href')}
  function rewriteAll(root){(root||document).querySelectorAll('a[href]').forEach(rewrite)}
  function link(a){if(!a||external(a))return null;const h=a.getAttribute('data-arcade-href')||a.getAttribute('href');return hrefOk(h)?h:null}
  function popup(a){return a&&a.getAttribute('data-arcade-window')==='popup'}
  function back(a){return a&&a.hasAttribute('data-arcade-back')}
  function newTab(ev,a){return ev.button===1||ev.metaKey||ev.ctrlKey||!!(a.getAttribute('target')&&a.getAttribute('target')!=='_self')}
  function fragment(a){if(!a||external(a))return null;const h=a.getAttribute('data-arcade-href')||a.getAttribute('href');if(!h)return null;try{const cur=new URL(arcade.url),next=new URL(h,arcade.url);if(!next.hash||next.origin!==cur.origin||next.pathname!==cur.pathname||next.search!==cur.search)return null;return {id:scrollId(next.hash),url:next.toString()}}catch{return h[0]==='#'?{id:scrollId(h),url:h}:null}}
  document.addEventListener('click',ev=>{if(ev.defaultPrevented||ev.button!==0)return;const a=anchor(ev.target);if(!a)return;if(osLink(a)){ev.preventDefault();return}if(ev.shiftKey||ev.altKey)return;const nt=newTab(ev,a),pop=popup(a),frag=fragment(a);if(frag){ev.preventDefault();if(nt||pop){arcade.navigate(frag.url,nt,pop);return}scrollHash(new URL(frag.url,arcade.url).hash);arcade.url=frag.url;arcade.navigate(frag.url,false,false);return}const h=link(a);if(!h){if(nt&&!external(a))ev.preventDefault();return}ev.preventDefault();if(!nt&&!pop&&back(a)){post({__arcade:true,type:'nav',url:h,newTab:false,popup:false,back:true});return}arcade.navigate(h,nt,pop)});
  document.addEventListener('mousedown',ev=>{if(ev.button===1){const a=anchor(ev.target);if(a&&!external(a))ev.preventDefault()}},true);
  document.addEventListener('auxclick',ev=>{if(ev.defaultPrevented||ev.button!==1)return;const a=anchor(ev.target);if(!a||external(a))return;ev.preventDefault();if(osLink(a))return;const f=fragment(a);if(f){arcade.navigate(f.url,true,popup(a));return}const h=link(a);if(h)arcade.navigate(h,true,popup(a))});
  try{const style=document.createElement('style');style.textContent='a[data-arcade-href]{cursor:pointer;}';(document.head||document.documentElement).append(style)}catch{}
  rewriteAll(document);if(typeof MutationObserver==='function')new MutationObserver(ms=>ms.forEach(m=>{if(m.type==='attributes')rewrite(m.target);else (m.addedNodes||[]).forEach(n=>{if(n.nodeType===1){rewrite(n);if(n.querySelectorAll)rewriteAll(n)}})})).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['href']});document.addEventListener('DOMContentLoaded',()=>{rewriteAll(document);hydrate(document)});if(document.body)hydrate(document);
  let hover=null;const sendHover=u=>{u=u||null;if(u!==hover){hover=u;post({__arcade:true,type:'link-hover',url:u})}};document.addEventListener('mouseover',ev=>{const a=anchor(ev.target);sendHover(a?link(a):null)},true);document.addEventListener('mouseout',ev=>{if(!ev.relatedTarget)sendHover(null)},true);
  document.addEventListener('pointerdown',()=>post({__arcade:true,type:'activate'}),{capture:true,passive:true});
  document.addEventListener('contextmenu',ev=>{ev.preventDefault();const a=anchor(ev.target),f=fragment(a),l=f?f.url:link(a),ed=editable(ev.target);editTarget=ed;let selection='';let info=null;if(ed&&isText(ed)){const a=ed.selectionStart,b=ed.selectionEnd;if(typeof a==='number'&&typeof b==='number'&&b>a)selection=String(ed.value).slice(a,b);info={hasSelection:selection.length>0,readOnly:ed.readOnly===true||ed.disabled===true}}else{const sel=window.getSelection();selection=sel?String(sel):'';if(ed)info={hasSelection:selection.length>0,readOnly:false}}post({__arcade:true,type:'context-menu',x:ev.clientX,y:ev.clientY,selectionText:selection,editable:info,link:l,linkPopup:!!l&&popup(a)})});
  if(typeof IntersectionObserver==='function'){const seen=new Set();let last=null;const thresholds=Array.from({length:21},(_,i)=>i/20);const io=new IntersectionObserver(entries=>{entries.forEach(e=>{const yes=e.isIntersecting&&(e.intersectionRatio>=.5||(e.rootBounds&&e.intersectionRect.height>=e.rootBounds.height*.5));yes?seen.add(e.target):seen.delete(e.target)});const next=seen.size>0;if(next!==last){last=next;post({__arcade:true,type:'submittable',value:next})}},{threshold:thresholds});const observe=root=>(root||document).querySelectorAll('[data-arcade-submit]').forEach(el=>io.observe(el));observe(document);document.addEventListener('DOMContentLoaded',()=>observe(document))}
  let title=null;const reportTitle=()=>{let t='';try{t=String(document.title||'')}catch{}if(t&&t!==title){title=t;post({__arcade:true,type:'title',title:t})}};const head=document.head||document.documentElement;if(head&&typeof MutationObserver==='function')new MutationObserver(reportTitle).observe(head,{childList:true,subtree:true,characterData:true});reportTitle();document.addEventListener('DOMContentLoaded',reportTitle);window.addEventListener('load',reportTitle);
  let queued=false;const currentY=()=>window.scrollY||document.documentElement.scrollTop||0;window.addEventListener('scroll',()=>{if(queued)return;if(typeof requestAnimationFrame!=='function'){post({__arcade:true,type:'scroll',y:currentY()});return}queued=true;requestAnimationFrame(()=>{queued=false;post({__arcade:true,type:'scroll',y:currentY()})})},{passive:true});
  function syncChrome(){try{const els=[document.body,document.documentElement];let bg=null;for(const el of els){if(!el)continue;const m=getComputedStyle(el).backgroundColor.match(/rgba?\(([^)]+)\)/);if(!m)continue;const p=m[1].split(',').map(Number);if(p.length>=3&&(p.length<4||p[3]>0)){bg=p;break}}if(!bg)return;const lum=(.2126*bg[0]+.7152*bg[1]+.0722*bg[2])/255;document.documentElement.style.colorScheme=lum<.5?'dark':'light';document.documentElement.style.setProperty('--arcade-sb-bg','rgb('+Math.round(bg[0])+','+Math.round(bg[1])+','+Math.round(bg[2])+')')}catch{}};if(document.body)syncChrome();document.addEventListener('DOMContentLoaded',syncChrome);window.addEventListener('load',syncChrome);
  const initial=()=>{try{const h=new URL(init.url).hash;if(h)scrollHash(h)}catch{}};document.addEventListener('DOMContentLoaded',initial);window.addEventListener('load',initial);
})();
`;

function escapeJsonForScript(value: unknown): string {
  return JSON.stringify(value).replaceAll("<", "\\u003c");
}

export interface BuildBrowserSrcDocOptions {
  locale: string;
  url: string;
  facts: Record<string, boolean>;
  isMaximized: boolean;
  bodyHtml: string;
  fontCss?: string;
}

export function buildBrowserIframeSrcDoc(options: BuildBrowserSrcDocOptions): string {
  const init = {
    locale: options.locale,
    url: options.url,
    facts: { ...options.facts },
    window: { isMaximized: options.isMaximized === true },
  };
  const injection =
    SCROLLBAR_CSS +
    (options.fontCss ? `<style>${options.fontCss}</style>` : "") +
    `<script>window.__arcadeInit__=${escapeJsonForScript(init)};<\/script>` +
    `<script>${BROWSER_RUNTIME_SHIM}<\/script>`;
  const body = rewriteInlineAssets(options.bodyHtml);
  const head = /<head\b[^>]*>/i.exec(body);
  if (head) {
    const at = head.index + head[0].length;
    return body.slice(0, at) + injection + body.slice(at);
  }
  const html = /<html\b[^>]*>/i.exec(body);
  if (html) {
    const at = html.index + html[0].length;
    return body.slice(0, at) + `<head>${injection}</head>` + body.slice(at);
  }
  return injection + body;
}

export interface BrowserPodcastState {
  src: string;
  paused: boolean;
  currentTime: number;
  duration: number | null;
  buffered: number;
  rate: number;
}

export class BrowserPodcastRuntime {
  private audio: HTMLAudioElement | null = null;
  private currentOwner: string | null = null;
  private readonly owners = new Map<string, number>();
  private readonly listeners = new Set<(state: BrowserPodcastState | null) => void>();

  private ensureAudio(): HTMLAudioElement {
    if (this.audio) return this.audio;
    const audio = new Audio();
    audio.crossOrigin = "anonymous";
    audio.preload = "metadata";
    for (const event of ["play", "pause", "timeupdate", "durationchange", "loadedmetadata", "ratechange", "seeked", "progress"])
      audio.addEventListener(event, () => this.publish());
    audio.addEventListener("ended", () => {
      audio.currentTime = 0;
      this.publish();
    });
    this.audio = audio;
    return audio;
  }

  snapshot(): BrowserPodcastState | null {
    const audio = this.audio;
    const src = audio?.dataset.podcastSrc;
    if (!audio || !src) return null;
    let buffered = 0;
    try {
      if (audio.buffered.length > 0) buffered = audio.buffered.end(audio.buffered.length - 1);
    } catch {}
    return {
      src,
      paused: audio.paused,
      currentTime: audio.currentTime,
      duration: Number.isFinite(audio.duration) ? audio.duration : null,
      buffered,
      rate: audio.playbackRate,
    };
  }

  subscribe(listener: (state: BrowserPodcastState | null) => void): () => void {
    this.listeners.add(listener);
    listener(this.snapshot());
    return () => this.listeners.delete(listener);
  }

  private publish(): void {
    const state = this.snapshot();
    for (const listener of this.listeners) listener(state);
  }

  async invoke(command: string, payload: unknown, owner: string): Promise<JsonValue> {
    const record = payload && typeof payload === "object" && !Array.isArray(payload)
      ? payload as Record<string, unknown>
      : {};
    if (!isSafeWebAsset(record.src)) {
      return { ok: false, reason: "bad_src", message: "podcast src must be a /webAssets/ URL" };
    }
    const src = record.src;
    const audio = this.ensureAudio();
    switch (command) {
      case "podcast.play":
        if (audio.dataset.podcastSrc !== src) {
          audio.dataset.podcastSrc = src;
          audio.src = src;
          audio.playbackRate = 1;
        }
        if (typeof record.at === "number" && Number.isFinite(record.at) && record.at >= 0)
          audio.currentTime = record.at;
        this.currentOwner = owner;
        try {
          await audio.play();
          this.publish();
          return { ok: true };
        } catch (error) {
          this.publish();
          return { ok: false, reason: "play_failed", message: error instanceof Error ? error.message : String(error) };
        }
      case "podcast.pause":
        if (audio.dataset.podcastSrc === src) audio.pause();
        return { ok: true };
      case "podcast.seek":
        if (audio.dataset.podcastSrc === src && typeof record.to === "number" && Number.isFinite(record.to)) {
          const limit = Number.isFinite(audio.duration) ? audio.duration : Number.POSITIVE_INFINITY;
          audio.currentTime = Math.max(0, Math.min(limit, record.to));
          this.publish();
        }
        return { ok: true };
      case "podcast.rate":
        if (audio.dataset.podcastSrc === src && typeof record.rate === "number" && Number.isFinite(record.rate))
          audio.playbackRate = Math.max(0.5, Math.min(3, record.rate));
        return { ok: true };
      default:
        return { ok: false, reason: "unknown_command", message: `Unknown command '${command}'` };
    }
  }

  retainOwner(owner: string): void {
    this.owners.set(owner, (this.owners.get(owner) ?? 0) + 1);
  }

  releaseOwner(owner: string): void {
    const count = this.owners.get(owner) ?? 0;
    if (count > 1) {
      this.owners.set(owner, count - 1);
      return;
    }
    this.owners.delete(owner);
    if (this.currentOwner === owner && this.audio && !this.audio.paused) this.audio.pause();
    if (this.currentOwner === owner) this.currentOwner = null;
  }
}

export interface BrowserFrameContextMenuEvent {
  x: number;
  y: number;
  selectionText: string;
  editable: { hasSelection?: boolean; readOnly?: boolean } | null;
  link: string | null;
  linkPopup: boolean;
}

export type BrowserEditAction =
  | { action: "cut" }
  | { action: "paste"; text: string }
  | { action: "select-all" };

export interface BrowserFrameBridgeOptions {
  iframe: HTMLIFrameElement;
  allowedCommands: readonly string[];
  invokeCommand(command: string, payload: Record<string, JsonValue>): Promise<JsonValue>;
  onNavigate(url: string, options: { newTab: boolean; popup: boolean; back: boolean }): void;
  onActivate?: () => void;
  onLinkHover?: (url: string | null) => void;
  onSubmittable?: (value: boolean) => void;
  onTitle?: (title: string) => void;
  onScroll?: (y: number) => void;
  onContextMenu?: (event: BrowserFrameContextMenuEvent, sendEditAction: (action: BrowserEditAction) => void) => void;
  hostWindow?: Window;
}

function isArcadeFrameMessage(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  if (record.__arcade !== true || typeof record.type !== "string") return false;
  return ["cmd", "nav", "activate", "link-hover", "submittable", "title", "scroll", "context-menu", "assets-request"].includes(record.type);
}

export interface BrowserFrameBridge {
  pushFacts(change: { emitted: readonly string[]; retracted: readonly string[]; snapshot: Record<string, boolean> }): void;
  pushWindowState(state: { isMaximized: boolean }): void;
  pushPodcastState(state: BrowserPodcastState | null): void;
  scrollToHash(hash: string): void;
  scrollToPosition(y: number): void;
  sendEditAction(action: BrowserEditAction): void;
  dispose(): void;
}

export function createBrowserFrameBridge(options: BrowserFrameBridgeOptions): BrowserFrameBridge {
  const post = (message: Record<string, unknown>) => options.iframe.contentWindow?.postMessage({ __arcade: true, ...message }, "*");
  const sendEditAction = (action: BrowserEditAction) => post({ type: "edit-action", ...action });
  const handle = (event: MessageEvent) => {
    if (event.source !== options.iframe.contentWindow || !isArcadeFrameMessage(event.data)) return;
    const message = event.data;
    const type = String(message.type);
    if (type === "nav") {
      if (typeof message.url === "string") options.onNavigate(message.url, { newTab: message.newTab === true, popup: message.popup === true, back: message.back === true });
      return;
    }
    if (type === "activate") return options.onActivate?.();
    if (type === "link-hover") return options.onLinkHover?.(typeof message.url === "string" ? message.url : null);
    if (type === "submittable") return options.onSubmittable?.(message.value === true);
    if (type === "title") {
      if (typeof message.title === "string" && message.title) options.onTitle?.(message.title);
      return;
    }
    if (type === "scroll") {
      if (typeof message.y === "number" && Number.isFinite(message.y)) options.onScroll?.(message.y);
      return;
    }
    if (type === "context-menu") {
      if (typeof message.x !== "number" || typeof message.y !== "number") return;
      const editable = message.editable && typeof message.editable === "object" && !Array.isArray(message.editable)
        ? message.editable as { hasSelection?: boolean; readOnly?: boolean }
        : null;
      options.onContextMenu?.({
        x: message.x,
        y: message.y,
        selectionText: typeof message.selectionText === "string" ? message.selectionText : "",
        editable,
        link: typeof message.link === "string" && message.link ? message.link : null,
        linkPopup: message.linkPopup === true,
      }, sendEditAction);
      return;
    }
    if (type === "assets-request") {
      const urls = Array.isArray(message.urls) ? message.urls.filter(isSafeWebAsset) : [];
      for (const url of urls) void fetchBrowserAssetData(url).then((value) => post({ type: "asset-data", url, dataUri: value }));
      return;
    }
    if (type !== "cmd" || typeof message.requestId !== "string" || typeof message.command !== "string") return;
    const requestId = message.requestId;
    const command = message.command;
    if (!options.allowedCommands.includes(command)) {
      post({ type: "cmd-result", requestId, result: { ok: false, reason: "command_not_allowed", message: `Command '${command}' is not allowed from this page.` } });
      return;
    }
    const payload = message.payload && typeof message.payload === "object" && !Array.isArray(message.payload)
      ? message.payload as Record<string, JsonValue>
      : {};
    void options.invokeCommand(command, payload)
      .then((result) => post({ type: "cmd-result", requestId, result }))
      .catch((error) => post({ type: "cmd-result", requestId, result: { ok: false, reason: "invoke_failed", message: error instanceof Error ? error.message : String(error) } }));
  };
  const host = options.hostWindow ?? window;
  host.addEventListener("message", handle);
  return {
    pushFacts: ({ emitted, retracted, snapshot }) => post({ type: "facts", emitted: [...emitted], retracted: [...retracted], snapshot: { ...snapshot } }),
    pushWindowState: ({ isMaximized }) => post({ type: "window-state", isMaximized }),
    pushPodcastState: (state) => post({ type: "podcast-state", state }),
    scrollToHash: (hash) => post({ type: "scroll-to-hash", hash }),
    scrollToPosition: (y) => post({ type: "scroll-to-position", y }),
    sendEditAction,
    dispose: () => host.removeEventListener("message", handle),
  };
}
