import{j as F}from"./index-CyHAbkO5.js";import{o as ye,a as be,s as y,r as o,u as vt,n as kt}from"./i18n-DtIC1LRi.js";import{aK as At,aL as Xe,z as xt,aM as St,aN as Tt,aO as Et,aP as Ke,I as Ge,aQ as Rt,aR as It}from"./NormalApp-Cn6agT0F.js";import{m as _t}from"./downloads-xYYIzO4D.js";function Ct(e){try{const t=new URL(e);return t.protocol==="http:"&&(t.protocol="https:"),t.search="",t.hash="",t.toString()}catch{return e}}const Mt=ye({url:y().min(1).transform(Ct),supported_locales:be(y().min(1)).min(1),title:y(),body_html:y(),allowed_commands:be(y().min(1)),favicon:y().min(1).optional(),read_fact:y().min(1).optional(),fonts:be(ye({family:y().min(1),url:y().min(1),weight:y().min(1).optional(),style:y().min(1).optional()}).strict()).optional()}).strict(),Pt=ye({reason:y()}),Lt=At("sites.envelopes.changed",Pt),Ht=`// Runtime shim injected into every fictional-internet iframe by BrowserApp
// (in-game) and the editor (offline preview). Imported as a STRING via
// Vite's \`?raw\`, then injected via <script> into the iframe's <head> so it
// runs BEFORE the page's own scripts.
//
// IMPORTANT: this file is plain JavaScript on purpose. The \`?raw\` import
// returns the file source verbatim — Vite does not transpile it — and a
// browser would SyntaxError on any TypeScript-only syntax (type
// annotations, generics, \`as\` casts, etc.). Keep this file ES2020-clean JS.
//
// Contract — exposed surface on \`window.arcade\`:
//   locale: string
//   url: string                              // the full requested URL, query included
//   facts.current: Record<string, boolean>
//   facts.subscribe(factIds, cb): () => unsubscribe
//   invoke(command, payload): Promise<{ ok, redirect?, message? } | …>
//   navigate(url): void
//   window.isMaximized: boolean
//   window.subscribe(cb): () => unsubscribe   // cb({ isMaximized })
//   podcast.state: { src, paused, currentTime, duration, buffered, rate } | null
//   podcast.subscribe(cb): () => unsubscribe  // cb(state | null)
//
// \`url\` is the only way a page can read its own address: the iframe is a
// srcdoc with an opaque origin, so \`window.location\` is \`about:srcdoc\`. A
// dynamic page (e.g. the search engine) reads \`new URL(window.arcade.url)
// .searchParams.get('q')\` to render query-specific content.
//
// The host pre-populates \`window.__arcadeInit__ = { locale, url, facts, window }\`
// via an inline <script> placed before this shim so the synchronous reads land
// before page scripts execute. No flash-of-wrong-content.

;(function setupArcadeShim() {
  const w = window
  const init = w.__arcadeInit__ || { locale: 'en', url: '', facts: {}, window: { isMaximized: false } }

  const factsCurrent = Object.assign({}, init.facts || {})
  const subscribers = new Set()

  // Window-state (the OS window hosting this iframe). Generic, horror-agnostic:
  // a page can react to its own window being maximized. Pushed by the host over
  // the same postMessage channel as facts — not via manifold/worldEvents/WS.
  const windowState = { isMaximized: (init.window && init.window.isMaximized) === true }
  const windowSubscribers = new Set()

  function fireWindowSubscribers() {
    windowSubscribers.forEach(function (cb) {
      try {
        cb({ isMaximized: windowState.isMaximized })
      } catch (err) {
        // Page-script errors stay sandboxed — don't blow up the shim.
        console.error('[arcade] window.subscribe callback threw', err)
      }
    })
  }

  function applyWindowState(isMaximized) {
    const next = isMaximized === true
    if (next === windowState.isMaximized) return
    windowState.isMaximized = next
    fireWindowSubscribers()
  }

  // Podcast engine state (host-side <audio> routed through the OS SFX track).
  // Pushed by the host on every transport/timeupdate change; null = idle.
  // Pages drive the engine via the client-handled \`podcast.*\` invoke commands
  // and render their player UI from these pushes (filtered by \`src\`).
  let podcastCurrent = null
  const podcastSubscribers = new Set()

  function applyPodcastState(state) {
    podcastCurrent = state || null
    podcastSubscribers.forEach(function (cb) {
      try {
        cb(podcastCurrent)
      } catch (err) {
        // Page-script errors stay sandboxed — don't blow up the shim.
        console.error('[arcade] podcast.subscribe callback threw', err)
      }
    })
  }

  function postToHost(msg) {
    window.parent.postMessage(msg, '*')
  }

  function fireSubscribers() {
    subscribers.forEach(function (sub) {
      const view = {}
      sub.factIds.forEach(function (f) {
        view[f] = factsCurrent[f] === true
      })
      try {
        sub.cb(view)
      } catch (err) {
        // Page-script errors stay sandboxed — don't blow up the shim.
        console.error('[arcade] facts.subscribe callback threw', err)
      }
    })
  }

  function applyFactsUpdate(emitted, retracted, snapshot) {
    for (const k1 in factsCurrent) {
      if (Object.prototype.hasOwnProperty.call(factsCurrent, k1)) {
        delete factsCurrent[k1]
      }
    }
    for (const k2 in snapshot) {
      if (Object.prototype.hasOwnProperty.call(snapshot, k2)) {
        factsCurrent[k2] = snapshot[k2] === true
      }
    }
    void emitted
    void retracted
    fireSubscribers()
  }

  const pendingResolvers = new Map()

  window.addEventListener('message', function (event) {
    if (event.source !== window.parent) return
    const data = event.data
    if (!data || data.__arcade !== true) return
    if (data.type === 'cmd-result') {
      const resolve = pendingResolvers.get(data.requestId)
      if (resolve) {
        pendingResolvers.delete(data.requestId)
        resolve(data.result)
      }
      return
    }
    if (data.type === 'facts') {
      applyFactsUpdate(data.emitted, data.retracted, data.snapshot)
      return
    }
    if (data.type === 'window-state') {
      applyWindowState(data.isMaximized)
      return
    }
    if (data.type === 'podcast-state') {
      applyPodcastState(data.state)
      return
    }
    if (data.type === 'scroll-to-hash') {
      applyScrollToHash(data.hash)
      return
    }
    if (data.type === 'edit-action') {
      applyEditAction(data)
      return
    }
    if (data.type === 'asset-data') {
      applyAssetData(data.url, data.dataUri)
      return
    }
    if (data.type === 'scroll-to-position') {
      applyScrollToPosition(data.y)
    }
  })

  // ── Host-cached image assets ──────────────────────────────────────────────
  // buildIframeSrcDoc rewrites each image's /webAssets source to a placeholder
  // + \`data-arcade-src\` so the opaque-origin iframe never fetches images itself
  // (its transient cache partition re-downloads on every navigation). The shim
  // asks the host for the sources; the host answers from a session-long memo
  // (one network fetch per asset per session) with one \`asset-data\` message
  // per image as it resolves. \`null\` bytes = host fetch failed → fall back to
  // the original URL (direct iframe fetch, the old behavior).
  const receivedAssetData = {} // url → dataUri, for <img>es added after the reply
  const requestedAssetUrls = new Set()

  function applyAssetSrc(img, url, dataUri) {
    img.removeAttribute('data-arcade-src')
    img.setAttribute('src', dataUri || url)
  }

  function applyAssetData(url, dataUri) {
    if (typeof url !== 'string') return
    if (dataUri) receivedAssetData[url] = dataUri
    const imgs = document.querySelectorAll('img[data-arcade-src]')
    for (let i = 0; i < imgs.length; i++) {
      if (imgs[i].getAttribute('data-arcade-src') === url) applyAssetSrc(imgs[i], url, dataUri)
    }
  }

  function hydrateAssetImages(root) {
    const imgs = (root || document).querySelectorAll('img[data-arcade-src]')
    const toRequest = []
    for (let i = 0; i < imgs.length; i++) {
      const img = imgs[i]
      const url = img.getAttribute('data-arcade-src')
      if (!url) continue
      const known = receivedAssetData[url]
      if (known) {
        applyAssetSrc(img, url, known)
        continue
      }
      if (!requestedAssetUrls.has(url)) {
        requestedAssetUrls.add(url)
        toRequest.push(url)
      }
    }
    if (toRequest.length > 0) {
      postToHost({ __arcade: true, type: 'assets-request', urls: toRequest })
    }
  }
  if (document.body) hydrateAssetImages(document)
  document.addEventListener('DOMContentLoaded', function () {
    hydrateAssetImages(document)
  })

  function genRequestId() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID()
    }
    return 'arcade-' + Date.now() + '-' + Math.random().toString(36).slice(2)
  }

  const arcade = {
    locale: init.locale,
    url: init.url || '',
    facts: {
      current: factsCurrent,
      subscribe: function (factIds, cb) {
        const sub = { factIds: new Set(factIds), cb: cb }
        subscribers.add(sub)
        const view = {}
        sub.factIds.forEach(function (f) {
          view[f] = factsCurrent[f] === true
        })
        try {
          cb(view)
        } catch (err) {
          console.error('[arcade] facts.subscribe initial fire threw', err)
        }
        return function () {
          subscribers.delete(sub)
        }
      },
    },
    invoke: function (command, payload) {
      return new Promise(function (resolve) {
        const requestId = genRequestId()
        pendingResolvers.set(requestId, resolve)
        postToHost({ __arcade: true, type: 'cmd', requestId: requestId, command: command, payload: payload })
      })
    },
    navigate: function (url, newTab, popup) {
      postToHost({ __arcade: true, type: 'nav', url: url, newTab: newTab === true, popup: popup === true })
    },
    window: {
      get isMaximized() {
        return windowState.isMaximized
      },
      subscribe: function (cb) {
        windowSubscribers.add(cb)
        try {
          cb({ isMaximized: windowState.isMaximized })
        } catch (err) {
          console.error('[arcade] window.subscribe initial fire threw', err)
        }
        return function () {
          windowSubscribers.delete(cb)
        }
      },
    },
    podcast: {
      get state() {
        return podcastCurrent
      },
      subscribe: function (cb) {
        podcastSubscribers.add(cb)
        try {
          cb(podcastCurrent)
        } catch (err) {
          console.error('[arcade] podcast.subscribe initial fire threw', err)
        }
        return function () {
          podcastSubscribers.delete(cb)
        }
      },
    },
  }

  Object.defineProperty(w, 'arcade', { value: arcade, configurable: false, writable: false })

  // Anchor-tag interceptor: catch clicks on <a href="..."> and route through
  // window.arcade.navigate so site authors can write normal HTML links
  // without per-link onclick handlers. We capture on the document so it
  // works even for anchors added after page load.
  //
  // A normal left-click navigates the SAME tab. A "new-context" intent —
  //   - middle-click (auxclick, button 1)
  //   - Ctrl/Cmd + left-click
  //   - the anchor's target="_blank"
  // — opens a NEW IN-APP TAB: we preventDefault and route to the host with
  // newTab:true. Without this, the sandboxed iframe leaks these to a REAL OS
  // browser tab (or no-ops), which the in-game browser must never do.
  //
  // Always skipped (left alone, never routed):
  //   - Shift/Alt-click (browser "save"/"new window" gestures — not ours)
  //   - href starting with "#"  — in-page anchors
  //   - href starting with "javascript:" / "data:"
  // These keep their native href, so a new-context gesture on one would still
  // let the sandboxed iframe open a REAL browser tab (a dead \`href="#"\` link
  // middle-clicked pops an about:srcdoc tab). Every non-external anchor
  // therefore swallows the new-context gesture even when there's nothing to
  // route — the plain left-click stays native for the page's own handlers.
  //
  // Swallowed (preventDefault, never routed): "mailto:" / "tel:" — clicking
  // those would escape the sandbox to a REAL OS protocol handler (system mail
  // client, dialer), which the in-game browser must never do. Sites print the
  // address as the link text, so the information survives the dead click.
  function findAnchor(start) {
    let node = start
    while (node && node !== document) {
      if (node.tagName && node.tagName.toLowerCase() === 'a') return node
      node = node.parentNode
    }
    return null
  }
  function isRoutableHref(href) {
    if (!href) return false
    if (href[0] === '#') return false
    const lower = href.toLowerCase()
    if (
      lower.indexOf('javascript:') === 0 ||
      lower.indexOf('mailto:') === 0 ||
      lower.indexOf('tel:') === 0 ||
      lower.indexOf('data:') === 0
    ) return false
    return true
  }
  // mailto:/tel: anchors keep their native href (never rewritten), so the click
  // handlers must swallow them explicitly — see the "Swallowed" note above.
  function isOsProtocolAnchor(anchor) {
    if (!anchor || !anchor.getAttribute) return false
    const href = anchor.getAttribute('href')
    if (!href) return false
    const lower = href.toLowerCase()
    return lower.indexOf('mailto:') === 0 || lower.indexOf('tel:') === 0
  }
  // A link can opt to LEAVE noriOS entirely and open in a real OS browser tab —
  // the one sanctioned escape from the sandbox — by marking itself
  // data-arcade-external="true". Such anchors are kept fully native (real href,
  // forced target="_blank" + rel="noopener noreferrer"); the iframe sandbox grants
  // allow-popups-to-escape-sandbox so the browser opens a genuine, un-sandboxed
  // tab. Everything below treats them as non-routable, so the in-app
  // click / middle-click / hover-preview machinery leaves them completely alone.
  function isExternalAnchor(a) {
    return !!a && !!a.getAttribute && a.getAttribute('data-arcade-external') === 'true'
  }
  function ensureExternalAnchor(a) {
    if (a.getAttribute('target') !== '_blank') a.setAttribute('target', '_blank')
    if (a.getAttribute('rel') !== 'noopener noreferrer') a.setAttribute('rel', 'noopener noreferrer')
  }
  function routableHref(anchor) {
    if (!anchor) return null
    // External links open a real OS tab natively — never route them in-app.
    if (isExternalAnchor(anchor)) return null
    // After rewrite the real target lives in data-arcade-href; fall back to href
    // for anchors not yet rewritten (e.g. mid-parse) or left native (#, mailto:).
    const href = anchor.getAttribute('data-arcade-href') || anchor.getAttribute('href')
    return isRoutableHref(href) ? href : null
  }

  // Move every routable href onto \`data-arcade-href\` and drop the real \`href\`,
  // so the HOST browser's native status bar never previews the iframe link — our
  // in-app preview (driven by the hover relay below) is the only one. Click /
  // middle-click routing reads data-arcade-href via routableHref(). In-page (#),
  // mailto:, tel:, data:, javascript: links are left native.
  function rewriteAnchor(a) {
    if (!a || a.nodeType !== 1 || a.tagName !== 'A') return
    // External links keep their real href (the browser opens the real tab); just
    // harden target/rel and leave them otherwise untouched.
    if (isExternalAnchor(a)) { ensureExternalAnchor(a); return }
    if (a.hasAttribute('data-arcade-href')) return
    const href = a.getAttribute('href')
    if (!isRoutableHref(href)) return
    a.setAttribute('data-arcade-href', href)
    a.removeAttribute('href')
  }
  function rewriteAll(root) {
    const list = (root || document).querySelectorAll('a[href]')
    for (let i = 0; i < list.length; i++) rewriteAnchor(list[i])
  }
  function wantsNewTab(event, anchor) {
    if (event.button === 1) return true // middle-click
    if (event.metaKey || event.ctrlKey) return true // cmd/ctrl + click
    const target = anchor.getAttribute('target')
    if (target && target !== '' && target !== '_self') return true // target="_blank" etc.
    return false
  }
  // A link can opt into opening in a Chrome-style popup window (no tabs, read-only
  // url, always-on-top) instead of a tab — the company-DB file rows use this so
  // each doc opens as its own popup. Popup wins over newTab in the host.
  function wantsPopup(anchor) {
    return anchor.getAttribute('data-arcade-window') === 'popup'
  }
  // A link can mark itself \`data-arcade-back\` (a thread page's "← author"
  // link): a plain click asks the host for a HISTORY-BACK navigation, which
  // restores the previous page's reading position like the chrome back button.
  // The href stays the fallback target — hover preview shows it, and the host
  // navigates to it when the tab has no back history (direct / new-tab open).
  function wantsBack(anchor) {
    return anchor.hasAttribute('data-arcade-back')
  }

  // ── Page anchors (#fragment) ──────────────────────────────────────────────
  // The srcdoc iframe has an opaque origin (window.location is about:srcdoc), so
  // native fragment navigation can't update the in-app address bar and is
  // unreliable under the sandbox. We handle fragments explicitly: scroll to the
  // target element ourselves, and let the host sync the URL bar / history.
  function scrollToElementById(id) {
    if (!id) return false
    let el = null
    try {
      el = document.getElementById(id)
      if (!el && typeof document.getElementsByName === 'function') {
        el = document.getElementsByName(id)[0] || null
      }
    } catch (err) {
      void err
      el = null
    }
    if (!el) return false
    try {
      el.scrollIntoView()
    } catch (err) {
      void err
    }
    return true
  }
  function idFromHash(hash) {
    if (!hash) return ''
    const raw = hash[0] === '#' ? hash.slice(1) : hash
    if (!raw) return ''
    try {
      return decodeURIComponent(raw)
    } catch (err) {
      void err
      return raw
    }
  }
  // Host → shim: scroll to a fragment and keep \`arcade.url\` in sync. The element
  // may not be parsed yet if this lands very early, so retry once next frame.
  function applyScrollToHash(hash) {
    const id = idFromHash(hash)
    if (!id) return
    try {
      const u = new URL(arcade.url)
      u.hash = hash
      arcade.url = u.toString()
    } catch (err) {
      void err
    }
    if (scrollToElementById(id)) return
    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(function () {
        scrollToElementById(id)
      })
    }
  }
  // Classify an anchor whose target is a fragment on the CURRENT document
  // (a bare \`#sec\`, or a \`/path#sec\` that resolves to this same page). Returns
  // \`{ id, url }\` for an in-page scroll, or null when it's a cross-page nav.
  function sameDocHashTarget(anchor) {
    if (!anchor || isExternalAnchor(anchor)) return null
    const href = anchor.getAttribute('data-arcade-href') || anchor.getAttribute('href')
    if (!href) return null
    if (href[0] === '#') {
      const id = idFromHash(href)
      if (!id) return null
      let url = href
      try {
        const u = new URL(arcade.url)
        u.hash = href
        url = u.toString()
      } catch (err) {
        void err
      }
      return { id: id, url: url }
    }
    if (!isRoutableHref(href)) return null
    try {
      const current = new URL(arcade.url)
      const next = new URL(href, arcade.url)
      if (!next.hash) return null
      if (next.origin !== current.origin) return null
      if (next.pathname !== current.pathname) return null
      if (next.search !== current.search) return null
      return { id: idFromHash(next.hash), url: next.toString() }
    } catch (err) {
      void err
      return null
    }
  }

  // Left-click (button 0). Routes same-tab, or new-tab on Cmd/Ctrl/target.
  document.addEventListener('click', function (event) {
    if (event.defaultPrevented) return
    if (event.button !== 0) return
    const anchor = findAnchor(event.target)
    if (!anchor) return
    // Swallow OS-protocol links before the modifier bail-outs — a Shift/Alt
    // gesture on a mailto: would still reach the system mail client otherwise.
    if (isOsProtocolAnchor(anchor)) {
      event.preventDefault()
      return
    }
    if (event.shiftKey || event.altKey) return // browser-native gestures
    const newTab = wantsNewTab(event, anchor)
    const popup = wantsPopup(anchor)
    const frag = sameDocHashTarget(anchor)
    if (frag) {
      event.preventDefault()
      // New-tab / popup intent on a fragment link opens the full URL in its own
      // context (it scroll-on-loads there); a plain click scrolls in place and
      // tells the host to advance the address bar + history without a reload.
      if (newTab || popup) {
        arcade.navigate(frag.url, newTab, popup)
        return
      }
      scrollToElementById(frag.id)
      arcade.url = frag.url
      arcade.navigate(frag.url, false, false)
      return
    }
    const href = routableHref(anchor)
    if (!href) {
      if (newTab && !isExternalAnchor(anchor)) event.preventDefault()
      return
    }
    event.preventDefault()
    // History-back intent: plain click only — a new-context gesture on the same
    // anchor opens the fallback href in its own tab/popup like any other link.
    if (!newTab && !popup && wantsBack(anchor)) {
      postToHost({ __arcade: true, type: 'nav', url: href, newTab: false, popup: false, back: true })
      return
    }
    arcade.navigate(href, newTab, popup)
  })
  // Middle-button mousedown over a link must NOT start the browser's autoscroll
  // ("drag mode"). Because we strip the real href (above), the browser no longer
  // treats the anchor as a link, so it would begin autoscroll on press — preempt
  // it. \`auxclick\` (below) still fires on release and opens the new tab.
  document.addEventListener(
    'mousedown',
    function (event) {
      if (event.button !== 1) return
      const anchor = findAnchor(event.target)
      if (anchor && !isExternalAnchor(anchor)) event.preventDefault()
    },
    true,
  )
  // Middle-click fires \`auxclick\` (button 1), not \`click\`, in modern browsers.
  // Always a new-tab intent — preventDefault so it never escapes the sandbox.
  document.addEventListener('auxclick', function (event) {
    if (event.defaultPrevented) return
    if (event.button !== 1) return
    const anchor = findAnchor(event.target)
    if (!anchor) return
    // External links are the one sanctioned escape — let the browser have them.
    if (isExternalAnchor(anchor)) return
    // Everything else: swallow first, so a link with no in-app destination
    // (dead \`href="#"\`, mailto:, javascript:) can't pop a real browser tab.
    event.preventDefault()
    if (isOsProtocolAnchor(anchor)) return
    // A fragment link middle-clicked opens its full resolved URL in a new tab
    // (which scroll-on-loads to the anchor there), like a real browser.
    const frag = sameDocHashTarget(anchor)
    if (frag) {
      arcade.navigate(frag.url, true, wantsPopup(anchor))
      return
    }
    const href = routableHref(anchor)
    if (!href) return
    arcade.navigate(href, true, wantsPopup(anchor))
  })

  // Stripped anchors have no href, so they lose the UA pointer cursor — restore it.
  try {
    const cursorStyle = document.createElement('style')
    cursorStyle.textContent = 'a[data-arcade-href]{cursor:pointer;}'
    ;(document.head || document.documentElement).append(cursorStyle)
  } catch (err) {
    void err
  }

  // Theme the iframe's native chrome (scrollbar gutter + form controls) to the
  // PAGE's own background, per page — the fictional sites are a mix of light
  // (paper news) and dark (terminals), and a srcdoc iframe declares no
  // color-scheme of its own. Runs once the body has painted, and again on full
  // load in case a late stylesheet changes the background.
  function parseRgbColor(s) {
    const m = s && s.match(/rgba?\\(([^)]+)\\)/)
    if (!m) return null
    const p = m[1].split(',').map(function (x) { return Number.parseFloat(x) })
    if (p.length < 3 || Number.isNaN(p[0]) || Number.isNaN(p[1]) || Number.isNaN(p[2])) return null
    return { r: p[0], g: p[1], b: p[2], a: p.length >= 4 ? p[3] : 1 }
  }
  function pageBackgroundColor() {
    const els = [document.body, document.documentElement]
    for (let i = 0; i < els.length; i++) {
      if (!els[i]) continue
      const rgb = parseRgbColor(getComputedStyle(els[i]).backgroundColor)
      if (rgb && rgb.a > 0) return rgb
    }
    return null
  }
  function syncNativeChrome() {
    try {
      const bg = pageBackgroundColor()
      if (!bg) return // fully transparent → leave the UA defaults
      const root = document.documentElement
      // color-scheme themes Firefox's native scrollbar + form controls; the
      // sRGB-weighted luminance midpoint decides dark vs light.
      const lum = (0.2126 * bg.r + 0.7152 * bg.g + 0.0722 * bg.b) / 255
      root.style.colorScheme = lum < 0.5 ? 'dark' : 'light'
      // Paint the ::-webkit scrollbar gutter (SCROLLBAR_STYLE reads this var) with
      // the page's own opaque colour, so the host's white iframe backdrop can't
      // show through the otherwise-transparent gutter as a white bar on dark pages.
      root.style.setProperty(
        '--arcade-sb-bg',
        'rgb(' + Math.round(bg.r) + ',' + Math.round(bg.g) + ',' + Math.round(bg.b) + ')',
      )
    } catch (err) {
      void err
    }
  }
  if (document.body) syncNativeChrome()
  document.addEventListener('DOMContentLoaded', syncNativeChrome)
  window.addEventListener('load', syncNativeChrome)

  // Rewrite anchors as the document parses, after load, and whenever a page
  // script adds/changes one. Removing \`href\` fires an attribute mutation, but the
  // re-entry early-returns (data-arcade-href is already set), so there's no loop.
  rewriteAll(document)
  if (typeof MutationObserver === 'function') {
    const mo = new MutationObserver(function (muts) {
      for (let i = 0; i < muts.length; i++) {
        const m = muts[i]
        if (m.type === 'attributes') {
          rewriteAnchor(m.target)
          continue
        }
        const added = m.addedNodes
        if (!added) continue
        for (let j = 0; j < added.length; j++) {
          const n = added[j]
          if (n.nodeType !== 1) continue
          if (n.tagName === 'A') rewriteAnchor(n)
          if (n.querySelectorAll) rewriteAll(n)
        }
      }
    })
    mo.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['href'],
    })
  }
  document.addEventListener('DOMContentLoaded', function () {
    rewriteAll(document)
  })

  // Link-hover relay → the host's in-app status-bar URL preview (lower-left). The
  // host browser's own status bar stays silent because hrefs were stripped above.
  let lastHoverUrl = null
  function sendHover(url) {
    const next = url || null
    if (next === lastHoverUrl) return
    lastHoverUrl = next
    postToHost({ __arcade: true, type: 'link-hover', url: next })
  }
  document.addEventListener(
    'mouseover',
    function (event) {
      const anchor = findAnchor(event.target)
      sendHover(anchor ? routableHref(anchor) : null)
    },
    true,
  )
  document.addEventListener(
    'mouseout',
    function (event) {
      // Pointer left the document entirely (moved to nothing) → clear the preview.
      if (!event.relatedTarget) sendHover(null)
    },
    true,
  )

  // Window-raise relay: a pointerdown anywhere in the page must bring the
  // hosting OS window to the foreground, exactly like clicking the window
  // chrome. Iframe-internal pointer events never reach the host document, so we
  // ping the host on every pointerdown and let it call focusWindow(). Capture
  // phase + passive so a page handler that stops propagation can't suppress the
  // raise, and we never block the page's own click handling. We don't
  // preventDefault — the page still receives the event normally.
  document.addEventListener(
    'pointerdown',
    function () {
      postToHost({ __arcade: true, type: 'activate' })
    },
    { capture: true, passive: true },
  )

  // ── OS edit context menu relay ─────────────────────────────────────────
  // Suppress the browser's native right-click context menu inside the iframe.
  // The host document blocks it (main.tsx), but a srcdoc iframe is its own
  // document: contextmenu events fire and stay inside the frame, never reaching
  // the host. Block it here so the fictional browser never leaks the real UA
  // menu (view-source, reload frame, back/forward, …) — and report the click
  // to the host instead, which renders the OS edit menu (cut/copy/paste, plus
  // "open in new tab" when the click landed on a link). The opaque-origin
  // iframe has no clipboard API, so clipboard work runs host-side; the shim
  // only reports selection state and applies edit actions the host sends back.
  function isEditTextField(node) {
    if (!node || node.nodeType !== 1) return false
    const tag = node.tagName
    if (tag === 'TEXTAREA') return true
    if (tag !== 'INPUT') return false
    // Only text-like types support the selection API (setRangeText & friends
    // throw on e.g. number/email) — and only they make sense for text editing.
    const type = (node.getAttribute('type') || 'text').toLowerCase()
    return (
      type === 'text' ||
      type === 'search' ||
      type === 'url' ||
      type === 'tel' ||
      type === 'password'
    )
  }
  function findEditableTarget(start) {
    let node = start
    while (node && node !== document) {
      if (isEditTextField(node)) return node
      if (node.nodeType === 1 && node.isContentEditable) return node
      node = node.parentNode
    }
    return null
  }
  // The last right-clicked editable — edit actions from the host apply to it
  // (element handles can't cross postMessage, so the reference stays here).
  let editActionTarget = null
  document.addEventListener('contextmenu', function (event) {
    event.preventDefault()
    const anchor = findAnchor(event.target)
    const anchorFrag = sameDocHashTarget(anchor)
    const link = anchorFrag ? anchorFrag.url : routableHref(anchor)
    // A popup link (data-arcade-window="popup") keeps its window mode from the
    // context menu too: report the intent so the host offers "open in new
    // window" (→ the locked popup) instead of forcing a tab.
    const linkPopup = !!link && !!anchor && wantsPopup(anchor)
    const editable = findEditableTarget(event.target)
    editActionTarget = editable
    let selectionText = ''
    let editableInfo = null
    if (editable && isEditTextField(editable)) {
      const start = editable.selectionStart
      const end = editable.selectionEnd
      if (typeof start === 'number' && typeof end === 'number' && end > start) {
        selectionText = String(editable.value).slice(start, end)
      }
      editableInfo = {
        hasSelection: selectionText.length > 0,
        readOnly: editable.readOnly === true || editable.disabled === true,
      }
    } else {
      const sel = window.getSelection()
      selectionText = sel ? String(sel) : ''
      if (editable) {
        // contenteditable host: the document selection IS the field selection.
        editableInfo = { hasSelection: selectionText.length > 0, readOnly: false }
      }
    }
    postToHost({
      __arcade: true,
      type: 'context-menu',
      x: event.clientX,
      y: event.clientY,
      selectionText: selectionText,
      editable: editableInfo,
      link: link,
      linkPopup: linkPopup,
    })
  })
  // Host → shim: apply an edit action to the last right-clicked target. The
  // fictional sites are plain HTML (no framework value trackers), so
  // setRangeText + an \`input\` event is a faithful user edit.
  function applyEditAction(data) {
    const el = editActionTarget
    if (data.action === 'select-all') {
      if (el && isEditTextField(el)) {
        el.focus()
        el.select()
        return
      }
      const sel = window.getSelection()
      if (!sel) return
      try {
        sel.selectAllChildren(el && el.isContentEditable ? el : document.body)
      } catch (err) {
        void err
      }
      return
    }
    if (!el) return
    if (isEditTextField(el)) {
      if (el.readOnly === true || el.disabled === true) return
      const start = typeof el.selectionStart === 'number' ? el.selectionStart : el.value.length
      const end = typeof el.selectionEnd === 'number' ? el.selectionEnd : start
      const insert = data.action === 'paste' ? String(data.text || '') : ''
      el.focus()
      try {
        el.setRangeText(insert, start, end, 'end')
      } catch (err) {
        void err
        return
      }
      el.dispatchEvent(new Event('input', { bubbles: true }))
      return
    }
    // contenteditable host — execCommand still works everywhere for these and
    // preserves the page's own input handling.
    el.focus()
    if (data.action === 'paste') {
      document.execCommand('insertText', false, String(data.text || ''))
    } else {
      document.execCommand('delete')
    }
  }

  // Submittable-element relay (generic, reusable). A site marks the element(s)
  // that make its page submittable with \`data-arcade-submit\`; while any such
  // element is "half seen" — ≥50% of the ELEMENT visible, or the element covering
  // ≥50% of the VIEWPORT — the shim tells the host the page has submittable
  // content (the host's browser-toolbar 提交器 extension lights its affordance).
  // The viewport-coverage arm exists for markers taller than the viewport (a
  // long breakdown post): their own ratio can mathematically never reach 0.5, so
  // element-ratio alone would never fire. Boolean only — the host derives WHAT
  // to submit from the current URL, so the marker carries no value.
  // Engagement-gated: a marker below the fold doesn't fire until the player
  // scrolls it into view. The host defaults to "not submittable" per page load,
  // so a page with no markers never lights up.
  if (typeof IntersectionObserver === 'function') {
    const visibleSet = new Set()
    let lastSubmittable = null
    const recompute = function () {
      const next = visibleSet.size > 0
      if (next === lastSubmittable) return
      lastSubmittable = next
      postToHost({ __arcade: true, type: 'submittable', value: next })
    }
    // Dense thresholds: IO thresholds are fractions of the TARGET, so the
    // viewport-coverage arm needs callbacks throughout the scroll (a tall
    // element's ratio creeps up in small steps and never crosses 0.5).
    const thresholds = []
    for (let t = 0; t <= 20; t++) thresholds.push(t / 20)
    // eslint-disable-next-line unicorn/consistent-function-scoping -- predicate stays next to the observer it serves; the shim IIFE has no meaningful outer scope
    const halfSeen = function (e) {
      if (!e.isIntersecting) return false
      if (e.intersectionRatio >= 0.5) return true
      return e.rootBounds !== null && e.intersectionRect.height >= e.rootBounds.height * 0.5
    }
    const io = new IntersectionObserver(
      function (entries) {
        for (let i = 0; i < entries.length; i++) {
          const e = entries[i]
          if (halfSeen(e)) visibleSet.add(e.target)
          else visibleSet.delete(e.target)
        }
        recompute()
      },
      { threshold: thresholds },
    )
    const observeSubmittables = function (root) {
      const list = (root || document).querySelectorAll('[data-arcade-submit]')
      for (let i = 0; i < list.length; i++) io.observe(list[i])
    }
    observeSubmittables(document)
    document.addEventListener('DOMContentLoaded', function () {
      observeSubmittables(document)
    })
  }

  // ── Title relay ───────────────────────────────────────────────────────────
  // The host's tab chrome shows the envelope's STATIC <title>; a dynamic page
  // (the search engine) composes its real title from client state via
  // \`document.title\`. Report the live title once observed and on every change,
  // deduped, empty skipped — the host prefers the reported value for the tab.
  let lastReportedTitle = null
  function reportTitle() {
    let t = ''
    try {
      t = String(document.title || '')
    } catch (err) {
      void err
    }
    if (!t || t === lastReportedTitle) return
    lastReportedTitle = t
    postToHost({ __arcade: true, type: 'title', title: t })
  }
  // Observe <head> subtree (the shim itself runs inside <head>, so it exists):
  // document.title writes mutate the <title> text node (characterData) or
  // create the element (childList) — both land here, as does the initial parse
  // of the page's own static <title>. Head mutations are rare after load; the
  // report itself is deduped.
  const titleWatchTarget = document.head || document.documentElement
  if (titleWatchTarget && typeof MutationObserver === 'function') {
    new MutationObserver(reportTitle).observe(titleWatchTarget, {
      childList: true,
      subtree: true,
      characterData: true,
    })
  }
  reportTitle()
  document.addEventListener('DOMContentLoaded', reportTitle)
  window.addEventListener('load', reportTitle)

  // ── Scroll-position relay ───────────────────────────────────────────────
  // The host records the live document scroll per tab and stamps it into the
  // tab's history entry on navigation, so back/forward (and a variant-changing
  // reload) restore the reading position. The iframe is opaque-origin, so the
  // host can't read the scroll itself — the shim reports it, rAF-throttled to
  // at most one message per painted frame. Passive: never blocks scrolling.
  function currentScrollY() {
    return window.scrollY || document.documentElement.scrollTop || 0
  }
  let scrollReportQueued = false
  window.addEventListener(
    'scroll',
    function () {
      if (scrollReportQueued) return
      if (typeof requestAnimationFrame !== 'function') {
        postToHost({ __arcade: true, type: 'scroll', y: currentScrollY() })
        return
      }
      scrollReportQueued = true
      requestAnimationFrame(function () {
        scrollReportQueued = false
        postToHost({ __arcade: true, type: 'scroll', y: currentScrollY() })
      })
    },
    { passive: true },
  )
  // Host → shim: restore an absolute scroll position (history nav / reload).
  // Sent after the destination paints (the host waits for the iframe's load),
  // so the document is fully parsed; the browser clamps if the restored page
  // is shorter than it was. The scroll it causes re-reports through the relay
  // above, which just re-records the same position — harmless.
  function applyScrollToPosition(y) {
    const target = typeof y === 'number' && y > 0 ? y : 0
    try {
      window.scrollTo(0, target)
    } catch (err) {
      void err
    }
  }

  // Initial fragment: when the page is served for a URL with a \`#fragment\`
  // (an omnibox entry, a bookmark, a cross-page link, a reload), scroll to that
  // element once it exists. The shim runs in <head> before <body> parses, so the
  // target isn't there yet — attempt on DOMContentLoaded, then again on full
  // load (late images/fonts shift layout) until one succeeds. Pure no-hash loads
  // do nothing, so a page's own initial scroll is left untouched.
  let initialHashDone = false
  function scrollToInitialHash() {
    if (initialHashDone) return
    let hash = ''
    try {
      hash = new URL(init.url).hash
    } catch (err) {
      void err
    }
    const id = idFromHash(hash)
    if (!id) {
      initialHashDone = true
      return
    }
    if (scrollToElementById(id)) initialHashDone = true
  }
  if (document.body) scrollToInitialHash()
  document.addEventListener('DOMContentLoaded', scrollToInitialHash)
  window.addEventListener('load', scrollToInitialHash)
})()
`,ge=new Map;function Nt(e){return typeof e=="string"&&e.startsWith("/webAssets/")&&!e.includes("..")}function Ot(e){let t="";for(let n=0;n<e.length;n+=32768)t+=String.fromCharCode(...e.subarray(n,n+32768));return btoa(t)}function Ut(e){const t=ge.get(e);if(t)return t;const s=(async()=>{try{const n=await fetch(e);if(!n.ok)return null;const c=n.headers.get("content-type")?.split(";")[0]?.trim()||"application/octet-stream",r=await n.arrayBuffer();return`data:${c};base64,${Ot(new Uint8Array(r))}`}catch{return null}})();return ge.set(e,s),s.then(n=>{n===null&&ge.delete(e)}),s}function Dt(e){if(!e||typeof e!="object")return!1;const t=e;return t.__arcade!==!0?!1:t.type==="cmd"||t.type==="nav"||t.type==="activate"||t.type==="link-hover"||t.type==="submittable"||t.type==="title"||t.type==="scroll"||t.type==="context-menu"||t.type==="assets-request"}function Ye(e){const t=r=>{r.source===e.iframe.contentWindow&&Dt(r.data)&&s(r.data)};async function s(r){if(r.type==="nav"){e.onNavigate(r.url,{newTab:r.newTab===!0,popup:r.popup===!0,back:r.back===!0});return}if(r.type==="activate"){e.onActivate?.();return}if(r.type==="link-hover"){e.onLinkHover?.(r.url);return}if(r.type==="submittable"){e.onSubmittable?.(r.value===!0);return}if(r.type==="title"){typeof r.title=="string"&&r.title.length>0&&e.onTitle?.(r.title);return}if(r.type==="scroll"){typeof r.y=="number"&&Number.isFinite(r.y)&&e.onScroll?.(r.y);return}if(r.type==="assets-request"){const u=Array.isArray(r.urls)?r.urls.filter(M=>Nt(M)):[];for(const M of u)Ut(M).then(V=>{const J=e.iframe.contentWindow;if(!J)return;const Q={__arcade:!0,type:"asset-data",url:M,dataUri:V};J.postMessage(Q,"*")});return}if(r.type==="context-menu"){typeof r.x=="number"&&Number.isFinite(r.x)&&typeof r.y=="number"&&Number.isFinite(r.y)&&e.onContextMenu?.({x:r.x,y:r.y,selectionText:typeof r.selectionText=="string"?r.selectionText:"",editable:r.editable??null,link:typeof r.link=="string"&&r.link!==""?r.link:null,linkPopup:r.linkPopup===!0});return}if(!e.allowedCommands.includes(r.command)){n(r.requestId,{ok:!1,reason:"command_not_allowed",message:`Command '${r.command}' is not allowed from this page.`});return}try{const u=await e.invokeCommand(r.command,r.payload);n(r.requestId,u)}catch(u){n(r.requestId,{ok:!1,reason:"invoke_failed",message:u instanceof Error?u.message:String(u)})}}function n(r,l){const u=e.iframe.contentWindow;u&&u.postMessage({__arcade:!0,type:"cmd-result",requestId:r,result:l},"*")}const c=e.hostWindow??window;return c.addEventListener("message",t),{pushFacts(r){const l=e.iframe.contentWindow;if(!l)return;const u={__arcade:!0,type:"facts",emitted:[...r.emitted],retracted:[...r.retracted],snapshot:{...r.snapshot}};l.postMessage(u,"*")},pushWindowState(r){const l=e.iframe.contentWindow;if(!l)return;const u={__arcade:!0,type:"window-state",isMaximized:r.isMaximized};l.postMessage(u,"*")},pushPodcastState(r){const l=e.iframe.contentWindow;if(!l)return;const u={__arcade:!0,type:"podcast-state",state:r};l.postMessage(u,"*")},scrollToHash(r){const l=e.iframe.contentWindow;if(!l)return;const u={__arcade:!0,type:"scroll-to-hash",hash:r};l.postMessage(u,"*")},scrollToPosition(r){const l=e.iframe.contentWindow;if(!l)return;const u={__arcade:!0,type:"scroll-to-position",y:r};l.postMessage(u,"*")},sendEditAction(r){const l=e.iframe.contentWindow;if(!l)return;const u={__arcade:!0,type:"edit-action",...r};l.postMessage(u,"*")},dispose(){c.removeEventListener("message",t)}}}const Ft="<style>::-webkit-scrollbar{width:5px;height:5px;background:var(--arcade-sb-bg,transparent)}::-webkit-scrollbar-track{background:var(--arcade-sb-bg,transparent)}::-webkit-scrollbar-thumb{background:rgba(113,113,122,.5);border-radius:5px}::-webkit-scrollbar-thumb:hover{background:rgba(113,113,122,.7)}::-webkit-scrollbar-corner{background:var(--arcade-sb-bg,transparent)}</style>",Bt="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";function qt(e){return e.replaceAll(/(<img\b[^>]*?)\ssrc="(\/webAssets\/[^"]*)"/gi,(t,s,n)=>`${s} src="${Bt}" data-arcade-src="${n}"`).replaceAll(/<link\b[^>]*>/gi,t=>/\brel="preload"/i.test(t)&&/\bas="image"/i.test(t)&&/\bhref="\/webAssets\//i.test(t)?"":t)}function Wt(){try{return globalThis.localStorage?.getItem("arcade.assetInline")==="off"}catch{return!1}}function Ve(e){const t={locale:e.locale,url:e.url??"",facts:{...e.facts},window:{isMaximized:e.isMaximized===!0}},s=Ft+(e.fontCss?`<style>${e.fontCss}</style>`:"")+`<script>window.__arcadeInit__=${zt(t)};<\/script><script>${Ht}<\/script>`,n=Wt()?e.bodyHtml:qt(e.bodyHtml),c=/<head\b[^>]*>/i.exec(n);if(c){const l=c.index+c[0].length;return n.slice(0,l)+s+n.slice(l)}const r=/<html\b[^>]*>/i.exec(n);if(r){const l=r.index+r[0].length;return n.slice(0,l)+`<head>${s}</head>`+n.slice(l)}return s+n}const jt="\\u003c";function zt(e){return JSON.stringify(e).replaceAll("<",jt)}const Je="allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox",we=new Map;function $t(e){let t="";for(let n=0;n<e.length;n+=32768)t+=String.fromCharCode(...e.subarray(n,n+32768));return btoa(t)}function Kt(e){const t=we.get(e);if(t)return t;const s=(async()=>{try{const n=await fetch(e);if(!n.ok)return null;const c=n.headers.get("content-type")?.split(";")[0]?.trim()||"font/woff2",r=await n.arrayBuffer();return`data:${c};base64,${$t(new Uint8Array(r))}`}catch{return null}})();return we.set(e,s),s.then(n=>{n===null&&we.delete(e)}),s}function Gt(e){return JSON.stringify(e).replaceAll("<",String.raw`\3c `)}function Qe(e){return e.replaceAll("<","")}async function Yt(e){if(!e||e.length===0)return"";const t=await Promise.all(e.map(n=>Kt(n.url))),s=[];for(let n=0;n<e.length;n++){const c=t[n];if(!c)continue;const r=e[n];s.push(`@font-face{font-family:${Gt(r.family)};src:url(${c});font-weight:${Qe(r.weight??"400")};font-style:${Qe(r.style??"normal")}}`)}return s.join(`
`)}const Ze=/^[a-z][a-z0-9+-]*:/i,Vt=/^[^\s/]+\.[^\s/]+$/;function et(e){if(Ze.test(e)||/^[/.#?]/.test(e))return e;const t=e.split("/")[0];return Vt.test(t)?`https://${e}`:e}function kn(e){const t=e.trim();return t?Ze.test(et(t)):!1}function ve(e){try{const t=new URL(e),s=t.hash;return t.hash="",{pageUrl:t.toString(),hash:s}}catch{const t=e.indexOf("#");return t===-1?{pageUrl:e,hash:""}:{pageUrl:e.slice(0,t),hash:e.slice(t)}}}function An(e,t){if(!e||!t||e===t)return!1;const s=ve(e),n=ve(t);return s.pageUrl===n.pageUrl&&s.hash!==n.hash}function xn(e,t){const s=e.trim();if(!s)return{kind:"absolute",url:s};try{const n=new URL(et(s),t),c=new URL(t);return n.host===c.host&&n.protocol===c.protocol?{kind:"same-site",path:n.pathname+n.search+n.hash,url:n.toString()}:{kind:"absolute",url:n.toString()}}catch{return{kind:"absolute",url:s}}}const tt={"concord-clinic.med/":{id:"page-bgm-concord-jack",url:"/webAssets/concord/jack_bgm.mp3"}},oe=new Map;function Jt(e){try{const{host:t,pathname:s}=new URL(e),n=t+s;return n in tt?n:null}catch{return null}}function Qt(e){const t=oe.get(e);if(t){t.count+=1;return}const s=tt[e];if(!s)return;const n={count:1,handle:null,unsubInit:()=>{}};oe.set(e,n);const c=Xe.getInstance();n.unsubInit=c.onInit(()=>{c.sfx.load(s.id,s.url).then(()=>{n.count<=0||n.handle||(n.handle=c.sfx.play(s.id,{loop:!0}))}).catch(r=>console.warn("[page-bgm] load failed:",r))})}function Xt(e){const t=oe.get(e);t&&(t.count-=1,!(t.count>0)&&(oe.delete(e),t.unsubInit(),t.handle?.stop(),t.handle=null))}function Zt(e){o.useEffect(()=>{if(e==null)return;const t=Jt(e);if(t)return Qt(t),()=>Xt(t)},[e])}const Sn="https://meridianpost.com/",en="doodle.search";function tn(e){return`https://${en}/?q=${encodeURIComponent(e.trim())}`}const nt="noebrowser.tabs",rt="noebrowser.bookmarks";function at(e){if(!e)return null;try{return JSON.parse(e)}catch{return null}}function ke(e){return typeof e=="object"&&e!==null}function nn(e){return ke(e)&&typeof e.url=="string"}function Tn(){const e=at(ot(nt)),s=(Array.isArray(e)?e:ke(e)&&Array.isArray(e.tabs)?e.tabs:[]).filter(nn).map(r=>({url:r.url,pinned:r.pinned===!0})),n=ke(e)?e.activeIndex:void 0,c=typeof n=="number"&&n>=0&&n<s.length?n:0;return{tabs:s,activeIndex:c}}function En(e,t){st(nt,JSON.stringify({tabs:e,activeIndex:t}))}function Rn(){const e=at(ot(rt));return Array.isArray(e)?e.filter(t=>typeof t=="object"&&t!==null&&typeof t.url=="string"&&typeof t.title=="string").map(t=>({url:t.url,title:t.title,...typeof t.favicon=="string"?{favicon:t.favicon}:{}})):[]}function In(e){st(rt,JSON.stringify(e))}function ot(e){try{return window.localStorage.getItem(e)}catch{return null}}function st(e,t){try{window.localStorage.setItem(e,t)}catch{}}let b=null,K=null,it=null;const Ae=new Set,rn=.5,an=3;function xe(){if(!b)return null;const e=b.element,t=e.getAttribute("data-podcast-src");if(!t)return null;let s=0;try{e.buffered.length>0&&(s=e.buffered.end(e.buffered.length-1))}catch{}return{src:t,paused:e.paused,currentTime:e.currentTime,duration:Number.isFinite(e.duration)?e.duration:null,buffered:s,rate:e.playbackRate}}function G(){const e=xe();for(const t of Ae)try{t(e)}catch(s){console.error("[podcast-audio] state subscriber threw:",s)}}function on(){return b?Promise.resolve(b):K||(K=new Promise((e,t)=>{const s=Xe.getInstance();s.onInit(()=>{if(b){e(b);return}try{const n=new Audio;n.crossOrigin="anonymous",n.preload="metadata";const c=s.sfx.connectMediaElement(n),r=()=>{n.currentTime=0,G()};n.addEventListener("ended",r);for(const l of["play","pause","timeupdate","durationchange","loadedmetadata","ratechange","seeked","progress"])n.addEventListener(l,G);b={element:n,disconnect:c},e(b)}catch(n){K=null,t(n instanceof Error?n:new Error(String(n)))}})}),K)}function sn(e){return e.startsWith("podcast.")}function cn(e){return e&&typeof e=="object"?e:{}}function ln(e){return typeof e=="string"&&e.startsWith("/webAssets/")}async function un(e,t,s){const n=cn(t);if(!ln(n.src))return{ok:!1,reason:"bad_src",message:"podcast src must be a /webAssets/ URL"};const c=n.src;switch(e){case"podcast.play":{const{element:r}=await on();r.getAttribute("data-podcast-src")!==c&&(r.setAttribute("data-podcast-src",c),r.src=c,r.playbackRate=1),typeof n.at=="number"&&Number.isFinite(n.at)&&n.at>=0&&(r.currentTime=n.at),it=s;try{await r.play()}catch(u){return G(),{ok:!1,reason:"play_failed",message:u instanceof Error?u.message:String(u)}}return G(),{ok:!0}}case"podcast.pause":return b?.element.getAttribute("data-podcast-src")===c&&b.element.pause(),{ok:!0};case"podcast.seek":{if(b?.element.getAttribute("data-podcast-src")===c&&typeof n.to=="number"&&Number.isFinite(n.to)){const r=b.element,l=Number.isFinite(r.duration)?r.duration:Number.POSITIVE_INFINITY;r.currentTime=Math.max(0,Math.min(l,n.to)),G()}return{ok:!0}}case"podcast.rate":return b?.element.getAttribute("data-podcast-src")===c&&typeof n.rate=="number"&&Number.isFinite(n.rate)&&(b.element.playbackRate=Math.max(rn,Math.min(an,n.rate))),{ok:!0};default:return{ok:!1,reason:"unknown_command",message:`Unknown command '${e}'`}}}function dn(e){Ae.add(e);try{e(xe())}catch(t){console.error("[podcast-audio] state subscriber threw:",t)}return()=>{Ae.delete(e)}}function fn(){return xe()}const Y=new Map;function hn(e){Y.set(e,(Y.get(e)??0)+1)}function pn(e){const t=Y.get(e)??0;if(t>1){Y.set(e,t-1);return}Y.delete(e),it===e&&b&&!b.element.paused&&b.element.pause()}function mn(e){o.useEffect(()=>{if(e!=null)return hn(e),()=>pn(e)},[e])}const bn=4e3;function _n({url:e,reloadNonce:t,isMaximized:s,onTitleChange:n,onFaviconChange:c,onStatusChange:r,onEnvelopeChange:l,onNavigate:u,onActivate:M,onLinkHover:V,showWhiteFlash:J=!1,onReady:Q,onContentReady:Se,active:P=!0,onSubmittableChange:Te,onRequestExtensionInstall:Ee,onScrollChange:Re,restoreScroll:B}){const v=xt(),N=St(),ct=Tt(),{i18n:X}=vt(),q=o.useMemo(()=>kt(X.resolvedLanguage??X.language??"en"),[X.language,X.resolvedLanguage]),{pageUrl:k,hash:se}=o.useMemo(()=>ve(e),[e]),[d,Z]=o.useState(null),[ee,L]=o.useState(null),[T,W]=o.useState(!1);Zt(T&&d?d.pageUrl:null),mn(T&&d?d.pageUrl:null);const[H,ie]=o.useState(null),[Ie,ce]=o.useState(null),[lt,j]=o.useState(!1),[_e,Ce]=o.useState(!1),[ut,dt]=o.useState(0),[ft,ht]=o.useState(0),Me=o.useRef(e);Me.current=e;const le=o.useRef(k);le.current=k;const Pe=o.useRef({}),pt=o.useRef(0),E=o.useRef(null);E.current=d;const Le=o.useRef(null);Le.current=ee;const ue=o.useRef(s);ue.current=s;const te=o.useRef(v);te.current=v;const O=o.useRef(P);O.current=P;const de=o.useRef([]),I=o.useRef(u);I.current=u;const fe=o.useRef(M);fe.current=M;const He=o.useRef(V);He.current=V;const ne=o.useRef(Q);ne.current=Q;const re=o.useRef(Se);re.current=Se;const z=o.useRef(Te);z.current=Te;const Ne=o.useRef(Ee);Ne.current=Ee;const he=o.useRef(Re);he.current=Re;const $=o.useRef(new Map),[mt,Oe]=o.useState(new Map),x=o.useRef(new Map),Ue=o.useRef(new Map),U=o.useRef(new Map),bt=o.useCallback(a=>{const f=Ue.current,g=f.get(a.generation);if(g)return g;const p=h=>{const A=x.current,w=A.get(a.generation);if(!h){w&&(w.dispose(),A.delete(a.generation)),f.delete(a.generation),U.current.delete(a.generation),$.current.delete(a.generation),Oe(i=>{if(!i.has(a.generation))return i;const m=new Map(i);return m.delete(a.generation),m});return}if(U.current.set(a.generation,h),w||!te.current)return;const R=Ye({iframe:h,allowedCommands:a.data.allowed_commands,invokeCommand:async(i,m)=>{if(i==="bounty.installExtension")return O.current?{ok:await Ne.current?.()===!0}:{ok:!1};if(sn(i))return O.current?await un(i,m,a.pageUrl):{ok:!1,reason:"inactive_tab"};const C=te.current;if(!C)return{ok:!1,reason:"no_binding",message:"no binding"};if(i==="client.emitFact"&&!O.current)return de.current.push(m),{ok:!0};const S=await Ge(C,i,m);return S.ok?(_t(i,m,S.result),S.result??{ok:!0}):{ok:!1,reason:S.error,message:S.error}},onNavigate:(i,m)=>{I.current?.(i,m)},onActivate:()=>{fe.current?.()},onLinkHover:i=>{He.current?.(i)},onTitle:i=>{Oe(m=>{if(m.get(a.generation)===i)return m;const C=new Map(m);return C.set(a.generation,i),C})},onSubmittable:i=>{$.current.set(a.generation,i),Ke.getState().mode==="idle"&&E.current?.generation===a.generation&&a.pageUrl===le.current&&z.current?.(i)},onScroll:i=>{E.current?.generation===a.generation&&he.current?.(i)},onContextMenu:i=>{if(!O.current||E.current?.generation!==a.generation)return;const m=U.current.get(a.generation);if(!m)return;const C=m.getBoundingClientRect(),S=i.link;It({x:C.left+i.x,y:C.top+i.y,selectionText:i.selectionText,editable:i.editable,openLinkInNewTab:S&&!i.linkPopup&&I.current?()=>I.current?.(S,{newTab:!0}):null,openLinkInPopup:S&&i.linkPopup&&I.current?()=>I.current?.(S,{popup:!0}):null,searchSelection:i.selectionText.trim()&&I.current?()=>I.current?.(tn(i.selectionText),{newTab:!0}):null,sendEditAction:$e=>{x.current.get(a.generation)?.sendEditAction($e)}})}});A.set(a.generation,R),R.pushWindowState({isMaximized:ue.current})};return f.set(a.generation,p),p},[]),D=o.useRef(null),gt=o.useCallback(a=>{D.current&&(D.current.dispose(),D.current=null),a&&(D.current=Ye({iframe:a,allowedCommands:[],invokeCommand:async()=>({ok:!1}),onNavigate:()=>{},onActivate:()=>{fe.current?.()}}))},[]);o.useEffect(()=>()=>{for(const a of x.current.values())a.dispose();x.current.clear(),Ue.current.clear(),D.current?.dispose(),D.current=null},[]),Et(P?d?.data.read_fact??null:null),o.useEffect(()=>{z.current?.(d!=null&&d.pageUrl===k?$.current.get(d.generation)??!1:!1)},[d?.generation]),o.useEffect(()=>{const a=E.current;a&&z.current?.(a.pageUrl===k&&($.current.get(a.generation)??!1))},[k]),o.useEffect(()=>{if(!P||!d||!T)return;const a=U.current.get(d.generation);if(!a)return;const f=requestAnimationFrame(()=>{try{a.contentWindow?.focus()}catch{}});return()=>cancelAnimationFrame(f)},[P,d,T]);const pe=o.useRef(null),_=o.useRef(null);o.useEffect(()=>{const a=Ke.subscribe((f,g)=>{const p=g.mode==="idle",h=f.mode==="idle";if(p&&!h){if(_.current!==null){cancelAnimationFrame(_.current),_.current=null;return}const A=document.activeElement;let w=null;for(const[R,i]of U.current)i===A&&(w=R);pe.current=w;return}h===p||!h||(_.current=requestAnimationFrame(()=>{_.current=null;const A=E.current;A!=null&&z.current?.(A.pageUrl===le.current&&($.current.get(A.generation)??!1));const w=pe.current;if(pe.current=null,w==null||!O.current||E.current?.generation!==w)return;const R=U.current.get(w),i=document.activeElement;if(!(i&&i!==document.body&&i!==R))try{R?.contentWindow?.focus()}catch{}}))});return()=>{a(),_.current!==null&&(cancelAnimationFrame(_.current),_.current=null)}},[]),o.useEffect(()=>{!se||!d||!T||x.current.get(d.generation)?.scrollToHash(se)},[se,d,T]),o.useEffect(()=>{he.current?.(0)},[d?.generation]);const De=o.useRef(null);o.useEffect(()=>{!B||!d||!T||d.pageUrl===k&&De.current!==B.token&&(De.current=B.token,x.current.get(d.generation)?.scrollToPosition(B.y))},[B,d,T,k]),o.useEffect(()=>{if(!P)return;const a=de.current;if(a.length===0)return;de.current=[];const f=te.current;if(f)for(const g of a)Ge(f,"client.emitFact",g).catch(()=>{})},[P]);const Fe=o.useRef(new Set);o.useEffect(()=>{const a=Fe.current,f={};for(const h of N)f[h]=!0;Pe.current=f;const g=[],p=[];for(const h of N)a.has(h)||g.push(h);for(const h of a)N.has(h)||p.push(h);if(Fe.current=N,!(g.length===0&&p.length===0))for(const h of x.current.values())h.pushFacts({emitted:g,retracted:p,snapshot:f})},[N]),o.useEffect(()=>{for(const a of x.current.values())a.pushWindowState({isMaximized:s})},[s]),o.useEffect(()=>dn(a=>{for(const f of x.current.values())f.pushPodcastState(a)}),[]),o.useEffect(()=>{if(v)return v.onEvent(Lt,()=>{ht(a=>a+1)})},[v]),o.useEffect(()=>{if(!v){j(!1);return}let a=!1;return j(!0),ie(null),ce(null),Ce(!1),Rt(v,{artifactType:"browser_page",lookup_key:k}).then(async f=>{if(a)return;if(!f.ok){j(!1),ie(f.status===502?"unavailable":"not-found"),ce(f.body??null),Z(null),L(null),W(!1);return}const g=Mt.safeParse(f.artifact.data);if(!g.success){j(!1),ie("not-found"),ce(null),Z(null),L(null),W(!1);return}const p=g.data,h=f.artifact.id,A=await Yt(p.fonts);if(a)return;j(!1);const w=p.supported_locales.includes(q)?q:p.supported_locales[0]??q,R=Ve({locale:w,facts:Pe.current,bodyHtml:p.body_html,url:Me.current,isMaximized:ue.current,fontCss:A}),i=E.current;if(i&&i.envelopeId===h&&i.pageUrl===k){L(null);return}const m={data:p,envelopeId:h,pageUrl:k,srcDoc:R,generation:++pt.current};i?L(m):(L(null),W(!1),Z(m))}).catch(()=>{a||(L(null),Ce(!0))}),()=>{a=!0}},[v,k,t,ft,q,ct,N,ut]),o.useEffect(()=>{if(!_e||!v)return;const a=()=>dt(p=>p+1),f=v.subscribeState(p=>{p.phase==="ready"&&a()}),g=setInterval(a,bn);return()=>{f(),clearInterval(g)}},[_e,v]);const ae=o.useCallback(a=>{x.current.get(a)?.pushPodcastState(fn())},[]),wt=o.useCallback(a=>{Le.current?.generation===a.generation&&(Z(a),W(!0),L(null),ae(a.generation),ne.current?.(),re.current?.())},[ae]),yt=o.useCallback(()=>{W(!0);const a=E.current?.generation;a!=null&&ae(a),ne.current?.(),re.current?.()},[ae]);o.useEffect(()=>{H&&(ne.current?.(),re.current?.())},[H]);const Be=(d?mt.get(d.generation):void 0)??d?.data.title??"",qe=d?.data.favicon??null,We=d?.envelopeId??null,je=H??(lt||ee!=null||d==null||!T?"loading":"page");o.useEffect(()=>{n?.(Be)},[Be,n]),o.useEffect(()=>{c?.(qe)},[qe,c]),o.useEffect(()=>{l?.(We)},[We,l]),o.useEffect(()=>{r?.(je)},[je,r]);const me=[];d&&me.push({page:d,role:"displayed"}),ee&&me.push({page:ee,role:"incoming"});const ze=H&&Ie?Ve({locale:q,facts:{},bodyHtml:Ie,url:e}):null;return F.jsxs("div",{className:"absolute inset-0 bg-white",children:[H?ze?F.jsx("iframe",{ref:gt,srcDoc:ze,title:H,sandbox:Je,referrerPolicy:"no-referrer","data-browser-page-frame":"",className:"absolute inset-0 h-full w-full border-0"},`error-${H}`):F.jsx("div",{className:"absolute inset-0 flex items-center justify-center bg-white px-6 text-center text-sm text-zinc-500",children:e}):me.map(({page:a,role:f})=>F.jsx("iframe",{ref:bt(a),srcDoc:a.srcDoc,title:a.data.title,sandbox:Je,referrerPolicy:"no-referrer","data-browser-page-frame":"",onLoad:f==="displayed"?yt:()=>wt(a),className:"absolute inset-0 h-full w-full border-0",style:f==="incoming"?{visibility:"hidden"}:void 0,"aria-hidden":f==="incoming"?!0:void 0},a.generation)),J&&F.jsx("div",{className:"absolute inset-0 bg-white","aria-hidden":!0}),F.jsx("div",{"aria-hidden":!0,className:"browser-glitch-shield pointer-events-none absolute inset-0 bg-zinc-950",style:{backgroundImage:"repeating-linear-gradient(0deg, rgba(255,255,255,0.06) 0px, rgba(255,255,255,0.06) 1px, transparent 1px, transparent 3px)"}})]})}export{_n as B,Sn as H,Rn as a,In as b,kn as c,tn as d,An as i,Tn as l,xn as r,En as s};
