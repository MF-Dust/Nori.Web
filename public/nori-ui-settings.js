(() => {
  "use strict";

  const STORAGE_KEY = "nori.ui.settings.v1";
  const INSTALLED = Symbol("noriUiSettingsInstalled");
  const HIDDEN_CLASS = "nori-gui-hidden";
  const KEEP_ATTRIBUTE = "data-nori-gui-keep";
  const DEFAULTS = Object.freeze({ hideGui: false });
  let sceneObserver = null;
  let scanFrame = 0;

  function safeParse(value) {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
  }

  function loadSettings() {
    let persisted = {};
    try {
      persisted = safeParse(localStorage.getItem(STORAGE_KEY) || "{}");
    } catch {
      // Private browsing / hardened storage can reject localStorage access.
    }
    return { hideGui: persisted.hideGui === true };
  }

  function persistSettings(settings) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // The setting still applies for the current page when storage is unavailable.
    }
  }

  function isChinese() {
    const lang = String(document.documentElement.lang || navigator.language || "").toLowerCase();
    return lang.startsWith("zh");
  }

  const TEXT = {
    en: {
      tab: "Interface",
      title: "Interface",
      subtitle: "Control the NoriOS desktop presentation in this browser.",
      hideGui: "Hide GUI",
      hideGuiHint: "Leaves only Nori and the scene background visible. Press Esc at any time to restore the GUI.",
    },
    zh: {
      tab: "界面",
      title: "界面",
      subtitle: "控制当前浏览器中的 NoriOS 桌面显示。",
      hideGui: "隐藏 GUI",
      hideGuiHint: "开启后只保留 Nori 与场景背景。随时按 Esc 恢复 GUI。",
    },
  };

  function labels() {
    return isChinese() ? TEXT.zh : TEXT.en;
  }

  function viewportCoverage(element) {
    const rect = element.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0 || innerWidth <= 0 || innerHeight <= 0) return 0;
    const visibleWidth = Math.max(0, Math.min(rect.right, innerWidth) - Math.max(rect.left, 0));
    const visibleHeight = Math.max(0, Math.min(rect.bottom, innerHeight) - Math.max(rect.top, 0));
    return (visibleWidth * visibleHeight) / (innerWidth * innerHeight);
  }

  function insideWindowLikeUi(element) {
    return Boolean(
      element.closest(
        '[role="dialog"],[aria-modal="true"],[data-radix-portal],[data-nori-desktop-window],[data-window-id]',
      ),
    );
  }

  function markPath(element, root) {
    let current = element;
    while (current && current !== root) {
      current.setAttribute(KEEP_ATTRIBUTE, "1");
      current = current.parentElement;
    }
  }

  function looksLikeSceneMedia(element) {
    if (insideWindowLikeUi(element)) return false;
    const tag = element.tagName;
    const coverage = viewportCoverage(element);
    if (tag === "CANVAS") return coverage >= 0.38;
    if (tag === "IMG" || tag === "VIDEO") return coverage >= 0.62;
    return false;
  }

  function looksLikeWallpaperLayer(element) {
    if (insideWindowLikeUi(element) || viewportCoverage(element) < 0.78) return false;
    const style = getComputedStyle(element);
    return style.backgroundImage && style.backgroundImage !== "none";
  }

  function scanScene() {
    scanFrame = 0;
    if (!document.documentElement.classList.contains(HIDDEN_CLASS)) return;
    const root = document.getElementById("root");
    if (!root) return;

    for (const element of root.querySelectorAll("canvas,img,video")) {
      if (looksLikeSceneMedia(element)) markPath(element, root);
    }

    // Wallpaper/gradient layers are usually shallow full-screen elements. Keep
    // their box visible while every unmarked descendant remains hidden.
    const queue = [...root.children].map((element) => [element, 0]);
    while (queue.length) {
      const [element, depth] = queue.shift();
      if (!(element instanceof HTMLElement) || depth > 3) continue;
      if (looksLikeWallpaperLayer(element)) markPath(element, root);
      if (depth < 3) {
        for (const child of element.children) queue.push([child, depth + 1]);
      }
    }
  }

  function scheduleSceneScan() {
    if (scanFrame || !document.documentElement.classList.contains(HIDDEN_CLASS)) return;
    scanFrame = requestAnimationFrame(scanScene);
  }

  function clearSceneMarks() {
    for (const element of document.querySelectorAll(`[${KEEP_ATTRIBUTE}]`)) {
      element.removeAttribute(KEEP_ATTRIBUTE);
    }
  }

  function ensureSceneObserver() {
    if (sceneObserver || !document.documentElement) return;
    sceneObserver = new MutationObserver(scheduleSceneScan);
    sceneObserver.observe(document.documentElement, { subtree: true, childList: true });
    window.addEventListener("resize", scheduleSceneScan, { passive: true });
  }

  function applySettings(settings) {
    const hidden = settings.hideGui === true;
    document.documentElement.classList.toggle(HIDDEN_CLASS, hidden);
    if (hidden) {
      ensureSceneObserver();
      scheduleSceneScan();
    } else {
      if (scanFrame) cancelAnimationFrame(scanFrame);
      scanFrame = 0;
      clearSceneMarks();
    }
    document.querySelectorAll('[data-field="hideGui"]').forEach((element) => {
      if (element instanceof HTMLInputElement) element.checked = hidden;
    });
    window.dispatchEvent(new CustomEvent("nori:ui-settings-changed", { detail: { hideGui: hidden } }));
    return { hideGui: hidden };
  }

  function saveSettings(input) {
    const settings = { hideGui: input?.hideGui === true };
    persistSettings(settings);
    return applySettings(settings);
  }

  function installStyles() {
    if (document.getElementById("nori-ui-settings-style")) return;
    const style = document.createElement("style");
    style.id = "nori-ui-settings-style";
    style.textContent = `
      html.${HIDDEN_CLASS} #root *{visibility:hidden!important}
      html.${HIDDEN_CLASS} #root [${KEEP_ATTRIBUTE}="1"]{visibility:visible!important}
      .nori-ui-settings-panel{flex:1;min-width:0;overflow:auto;padding:24px 28px;background:var(--background,transparent);color:inherit}
      .nori-ui-settings-wrap{max-width:820px;margin:0 auto 36px}
      .nori-ui-settings-head{margin-bottom:22px}
      .nori-ui-settings-title{font-size:20px;font-weight:650;letter-spacing:-.01em;margin:0 0 5px}
      .nori-ui-settings-subtitle{font-size:13px;opacity:.62;margin:0}
      .nori-ui-card{border:1px solid color-mix(in srgb,currentColor 14%,transparent);border-radius:12px;padding:18px;background:color-mix(in srgb,currentColor 3%,transparent);margin-bottom:14px}
      .nori-ui-row{display:grid;grid-template-columns:minmax(145px,190px) minmax(0,1fr);align-items:start;gap:14px}
      .nori-ui-label{font-size:13px;font-weight:600;padding-top:4px}
      .nori-ui-hint{display:block;font-size:11px;line-height:1.5;opacity:.55;font-weight:400;margin-top:4px}
      .nori-ui-checkbox-line{display:flex;align-items:center;gap:9px;min-height:30px;font-size:13px}
      .nori-ui-checkbox-line input{width:16px;height:16px;accent-color:#65d9e8}
      .nori-ui-tab{width:100%;border:0;background:transparent;color:inherit;cursor:pointer}
      .nori-ui-tab.nori-ui-tab-active{background:color-mix(in srgb,#65d9e8 12%,transparent)!important;color:#65d9e8!important;font-weight:600}
      @media(max-width:720px){.nori-ui-settings-panel{padding:18px}.nori-ui-row{grid-template-columns:1fr;gap:6px}.nori-ui-label{padding-top:0}}
    `;
    document.head.appendChild(style);
  }

  function createPanel() {
    const t = labels();
    const panel = document.createElement("section");
    panel.className = "nori-ui-settings-panel";
    panel.hidden = true;
    panel.dataset.noriUiPanel = "1";

    const wrap = document.createElement("div");
    wrap.className = "nori-ui-settings-wrap";
    const head = document.createElement("div");
    head.className = "nori-ui-settings-head";
    const title = document.createElement("h2");
    title.className = "nori-ui-settings-title";
    title.textContent = t.title;
    const subtitle = document.createElement("p");
    subtitle.className = "nori-ui-settings-subtitle";
    subtitle.textContent = t.subtitle;
    head.append(title, subtitle);

    const card = document.createElement("div");
    card.className = "nori-ui-card";
    const row = document.createElement("div");
    row.className = "nori-ui-row";
    const label = document.createElement("div");
    label.className = "nori-ui-label";
    label.textContent = t.hideGui;
    const hint = document.createElement("span");
    hint.className = "nori-ui-hint";
    hint.textContent = t.hideGuiHint;
    label.appendChild(hint);

    const line = document.createElement("label");
    line.className = "nori-ui-checkbox-line";
    const toggle = document.createElement("input");
    toggle.type = "checkbox";
    toggle.dataset.field = "hideGui";
    const caption = document.createElement("span");
    caption.textContent = t.hideGui;
    line.append(toggle, caption);
    row.append(label, line);
    card.appendChild(row);
    wrap.append(head, card);
    panel.appendChild(wrap);

    toggle.checked = loadSettings().hideGui;
    toggle.addEventListener("change", () => saveSettings({ hideGui: toggle.checked }));
    panel.refresh = () => {
      toggle.checked = loadSettings().hideGui;
    };
    return panel;
  }

  function looksLikeSettingsNav(nav) {
    const texts = [...nav.querySelectorAll("button")].map((button) => button.textContent.trim());
    const includesAny = (choices) => choices.some((choice) => texts.includes(choice));
    return (
      includesAny(["Sound", "声音"]) &&
      includesAny(["Graphics", "显示效果"]) &&
      includesAny(["Network", "网络"]) &&
      includesAny(["System", "系统"])
    );
  }

  function installIntoNav(nav) {
    if (nav[INSTALLED] || !looksLikeSettingsNav(nav)) return;
    const sidebar = nav.parentElement;
    const shell = sidebar?.parentElement;
    if (!sidebar || !shell) return;
    nav[INSTALLED] = true;

    const t = labels();
    const originalButtons = [...nav.querySelectorAll("button")];
    const button = document.createElement("button");
    button.type = "button";
    button.className =
      originalButtons[0]?.className ||
      "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition-colors text-muted-foreground hover:bg-muted hover:text-foreground";
    button.classList.add("nori-ui-tab");
    const icon = document.createElement("span");
    icon.textContent = "◫";
    icon.style.width = "1rem";
    icon.style.textAlign = "center";
    const text = document.createElement("span");
    text.textContent = t.tab;
    button.append(icon, text);
    nav.appendChild(button);

    const panel = createPanel();
    shell.appendChild(panel);
    const hidden = new Map();

    function showPanel() {
      for (const child of [...shell.children]) {
        if (child === sidebar || child === panel) continue;
        if (!hidden.has(child)) hidden.set(child, child.style.display);
        child.style.display = "none";
      }
      panel.hidden = false;
      panel.style.display = "block";
      button.classList.add("nori-ui-tab-active");
      panel.refresh?.();
    }

    function restore() {
      panel.hidden = true;
      panel.style.display = "none";
      button.classList.remove("nori-ui-tab-active");
      for (const [child, display] of hidden) {
        if (child.isConnected) child.style.display = display;
      }
      hidden.clear();
    }

    button.addEventListener("click", (event) => {
      event.preventDefault();
      showPanel();
    });
    nav.addEventListener(
      "click",
      (event) => {
        const clicked = event.target instanceof Element ? event.target.closest("button") : null;
        if (clicked && clicked !== button) restore();
      },
      { capture: true },
    );
  }

  function scanSettings() {
    for (const nav of document.querySelectorAll("nav")) installIntoNav(nav);
  }

  function restoreGui() {
    if (!loadSettings().hideGui) return;
    saveSettings({ hideGui: false });
  }

  installStyles();
  applySettings(loadSettings());
  const settingsObserver = new MutationObserver(() => {
    scanSettings();
    scheduleSceneScan();
  });
  settingsObserver.observe(document.documentElement, { subtree: true, childList: true });
  document.addEventListener("DOMContentLoaded", scanSettings, { once: true });
  document.addEventListener(
    "keydown",
    (event) => {
      if (event.key !== "Escape" || !document.documentElement.classList.contains(HIDDEN_CLASS)) return;
      event.preventDefault();
      event.stopPropagation();
      restoreGui();
    },
    true,
  );
  window.addEventListener("storage", (event) => {
    if (event.key === STORAGE_KEY) applySettings(loadSettings());
  });
  scanSettings();

  window.NoriUISettings = Object.freeze({
    get: () => ({ ...loadSettings() }),
    save: (settings) => saveSettings({ ...loadSettings(), ...settings }),
    showGui: restoreGui,
  });
})();
