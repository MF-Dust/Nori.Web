(() => {
  "use strict";

  const STORAGE_KEY = "nori.ai.settings.v1";
  const SESSION_KEY = "nori.ai.api-key.v1";
  const INSTALLED = Symbol("noriAiSettingsInstalled");
  const wsFingerprints = new WeakMap();

  const DEFAULTS = Object.freeze({
    enabled: false,
    provider: "openai-compatible",
    baseUrl: "https://api.openai.com/v1",
    model: "gpt-4o-mini",
    apiKey: "",
    rememberApiKey: false,
    systemPrompt:
      "You are Nori, the AI companion inside NoriOS. Be warm, concise, curious, and helpful. Reply in the user's language when practical. Avoid claiming actions you have not performed.",
    characterPrompt: "",
    temperature: 0.75,
    maxTokens: 350,
  });

  function safeParse(value) {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
  }

  function safeStorage(storage, operation, ...args) {
    try {
      return storage[operation](...args);
    } catch {
      return null;
    }
  }

  function clampNumber(value, fallback, min, max) {
    const number = Number(value);
    return Number.isFinite(number) ? Math.max(min, Math.min(max, number)) : fallback;
  }

  function normalize(settings) {
    const source = settings && typeof settings === "object" ? settings : {};
    const provider = source.provider === "anthropic" ? "anthropic" : "openai-compatible";
    return {
      enabled: source.enabled === true,
      provider,
      baseUrl: String(source.baseUrl || DEFAULTS.baseUrl).trim().slice(0, 1000),
      model: String(source.model || DEFAULTS.model).trim().slice(0, 200),
      apiKey: String(source.apiKey || "").trim().slice(0, 2048),
      rememberApiKey: source.rememberApiKey === true,
      systemPrompt: String(source.systemPrompt ?? DEFAULTS.systemPrompt).slice(0, 16000),
      characterPrompt: String(source.characterPrompt || "").slice(0, 16000),
      temperature: clampNumber(source.temperature, DEFAULTS.temperature, 0, 2),
      maxTokens: Math.round(clampNumber(source.maxTokens, DEFAULTS.maxTokens, 32, 4096)),
    };
  }

  function loadSettings() {
    const persisted = safeParse(safeStorage(localStorage, "getItem", STORAGE_KEY) || "{}");
    const sessionKey = safeStorage(sessionStorage, "getItem", SESSION_KEY) || "";
    const apiKey = persisted.rememberApiKey ? persisted.apiKey || "" : sessionKey;
    return normalize({ ...DEFAULTS, ...persisted, apiKey });
  }

  function saveSettings(input) {
    const settings = normalize(input);
    const persisted = { ...settings };
    if (!settings.rememberApiKey) persisted.apiKey = "";
    safeStorage(localStorage, "setItem", STORAGE_KEY, JSON.stringify(persisted));
    if (settings.rememberApiKey) {
      safeStorage(sessionStorage, "removeItem", SESSION_KEY);
    } else if (settings.apiKey) {
      safeStorage(sessionStorage, "setItem", SESSION_KEY, settings.apiKey);
    } else {
      safeStorage(sessionStorage, "removeItem", SESSION_KEY);
    }
    window.dispatchEvent(new CustomEvent("nori:ai-settings-changed", { detail: publicSettings(settings) }));
    return settings;
  }

  function resetSettings() {
    safeStorage(localStorage, "removeItem", STORAGE_KEY);
    safeStorage(sessionStorage, "removeItem", SESSION_KEY);
    const settings = normalize(DEFAULTS);
    window.dispatchEvent(new CustomEvent("nori:ai-settings-changed", { detail: publicSettings(settings) }));
    return settings;
  }

  function publicSettings(settings) {
    return {
      enabled: settings.enabled,
      provider: settings.provider,
      baseUrl: settings.baseUrl,
      model: settings.model,
      rememberApiKey: settings.rememberApiKey,
      hasApiKey: Boolean(settings.apiKey),
      systemPrompt: settings.systemPrompt,
      characterPrompt: settings.characterPrompt,
      temperature: settings.temperature,
      maxTokens: settings.maxTokens,
    };
  }

  function runtimePayload() {
    const settings = loadSettings();
    return {
      enabled: settings.enabled,
      provider: settings.provider,
      baseUrl: settings.baseUrl,
      model: settings.model,
      apiKey: settings.apiKey,
      systemPrompt: settings.systemPrompt,
      characterPrompt: settings.characterPrompt,
      temperature: settings.temperature,
      maxTokens: settings.maxTokens,
    };
  }

  function runtimeFingerprint(payload) {
    // The fingerprint never leaves this page. Including the key prevents a
    // changed key from reusing an older server-side runtime configuration.
    return JSON.stringify(payload);
  }

  function isChatPlayerDispatch(message) {
    return (
      message &&
      message.type === "dispatch" &&
      message.cartridgeId === "chat" &&
      message.actor === "player" &&
      message.cmd &&
      message.cmd.type === "playerMessage"
    );
  }

  // The extension loads before the main Vite bundle. Intercept only outbound
  // chat player dispatches and prepend a standard Arcade event carrying the
  // ephemeral AI configuration. The config event itself is not a cartridge
  // command and therefore never appears in runtime_transition payloads.
  const nativeSend = WebSocket.prototype.send;
  WebSocket.prototype.send = function patchedNoriSend(data) {
    if (typeof data === "string") {
      try {
        const message = JSON.parse(data);
        if (isChatPlayerDispatch(message)) {
          const payload = runtimePayload();
          const fingerprint = runtimeFingerprint(payload);
          if (wsFingerprints.get(this) !== fingerprint) {
            nativeSend.call(
              this,
              JSON.stringify({
                type: "event",
                worldId: message.worldId,
                cartridgeId: "chat",
                requestId: `ai-config-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                channel: "nori.ai.config",
                payload,
              }),
            );
            wsFingerprints.set(this, fingerprint);
          }
        }
      } catch {
        // Preserve the shipped client's behavior for non-JSON frames.
      }
    }
    return nativeSend.call(this, data);
  };

  function isChinese() {
    const lang = String(document.documentElement.lang || navigator.language || "").toLowerCase();
    return lang.startsWith("zh");
  }

  const TEXT = {
    en: {
      tab: "AI",
      title: "AI Model & Prompts",
      subtitle: "Stored in this browser and applied to Nori chat.",
      enabled: "Use browser AI configuration",
      enabledHint: "Off = keep using the server's configured model and credentials.",
      provider: "Provider",
      baseUrl: "Base URL",
      model: "Model",
      apiKey: "API Key",
      rememberKey: "Remember API Key in this browser",
      keyWarning: "Saved browser keys can be read by scripts running on this same origin. Leave this off on shared devices.",
      systemPrompt: "System Prompt",
      characterPrompt: "Nori / Character Prompt",
      characterPlaceholder: "Optional additional personality, setting, style, or behavioral instructions…",
      temperature: "Temperature",
      maxTokens: "Max Tokens",
      save: "Save",
      saved: "Saved locally",
      reset: "Restore defaults",
      serverNote: "When browser override is disabled, the Worker keeps using its OPENAI_* configuration.",
    },
    zh: {
      tab: "AI",
      title: "AI 模型与提示词",
      subtitle: "配置保存在当前浏览器，并应用到 Nori 对话。",
      enabled: "使用浏览器 AI 配置",
      enabledHint: "关闭时继续使用服务器中配置的模型与凭据。",
      provider: "提供商",
      baseUrl: "Base URL",
      model: "模型",
      apiKey: "API Key",
      rememberKey: "在此浏览器记住 API Key",
      keyWarning: "持久化到浏览器的 Key 可被同源页面脚本读取；在公用设备上请不要开启。",
      systemPrompt: "System Prompt",
      characterPrompt: "Nori / 角色提示词",
      characterPlaceholder: "可选：补充人格、世界观、语气或行为要求……",
      temperature: "Temperature",
      maxTokens: "最大输出 Tokens",
      save: "保存",
      saved: "已保存到浏览器",
      reset: "恢复默认",
      serverNote: "浏览器覆盖关闭时，Worker 会继续使用服务器的 OPENAI_* 配置。",
    },
  };

  function labels() {
    return isChinese() ? TEXT.zh : TEXT.en;
  }

  function installStyles() {
    if (document.getElementById("nori-ai-settings-style")) return;
    const style = document.createElement("style");
    style.id = "nori-ai-settings-style";
    style.textContent = `
      .nori-ai-settings-panel{flex:1;min-width:0;overflow:auto;padding:24px 28px;background:var(--background,transparent);color:inherit}
      .nori-ai-settings-wrap{max-width:820px;margin:0 auto 36px}
      .nori-ai-settings-head{margin-bottom:22px}
      .nori-ai-settings-title{font-size:20px;font-weight:650;letter-spacing:-.01em;margin:0 0 5px}
      .nori-ai-settings-subtitle{font-size:13px;opacity:.62;margin:0}
      .nori-ai-card{border:1px solid color-mix(in srgb,currentColor 14%,transparent);border-radius:12px;padding:18px;background:color-mix(in srgb,currentColor 3%,transparent);margin-bottom:14px}
      .nori-ai-row{display:grid;grid-template-columns:minmax(145px,190px) minmax(0,1fr);align-items:start;gap:14px;margin-bottom:15px}
      .nori-ai-row:last-child{margin-bottom:0}
      .nori-ai-label{font-size:13px;font-weight:600;padding-top:8px}
      .nori-ai-hint{display:block;font-size:11px;line-height:1.5;opacity:.55;font-weight:400;margin-top:4px}
      .nori-ai-input,.nori-ai-select,.nori-ai-textarea{box-sizing:border-box;width:100%;border:1px solid color-mix(in srgb,currentColor 18%,transparent);border-radius:8px;background:color-mix(in srgb,currentColor 5%,transparent);color:inherit;padding:8px 10px;font:inherit;font-size:13px;outline:none}
      .nori-ai-input:focus,.nori-ai-select:focus,.nori-ai-textarea:focus{border-color:color-mix(in srgb,#65d9e8 75%,currentColor);box-shadow:0 0 0 2px color-mix(in srgb,#65d9e8 18%,transparent)}
      .nori-ai-textarea{min-height:116px;resize:vertical;line-height:1.55}
      .nori-ai-checkbox-line{display:flex;align-items:center;gap:9px;min-height:34px;font-size:13px}
      .nori-ai-checkbox-line input{width:16px;height:16px;accent-color:#65d9e8}
      .nori-ai-secret-wrap{display:flex;gap:8px}
      .nori-ai-secret-wrap .nori-ai-input{flex:1}
      .nori-ai-small-button,.nori-ai-button{border:1px solid color-mix(in srgb,currentColor 18%,transparent);border-radius:8px;background:color-mix(in srgb,currentColor 7%,transparent);color:inherit;padding:7px 12px;font:inherit;font-size:12px;cursor:pointer}
      .nori-ai-button.primary{background:color-mix(in srgb,#65d9e8 22%,transparent);border-color:color-mix(in srgb,#65d9e8 48%,transparent)}
      .nori-ai-button:hover,.nori-ai-small-button:hover{background:color-mix(in srgb,currentColor 11%,transparent)}
      .nori-ai-warning{font-size:11px;line-height:1.55;color:#e7b65d;margin-top:7px}
      .nori-ai-actions{display:flex;align-items:center;gap:10px;margin-top:18px}
      .nori-ai-status{font-size:12px;opacity:0;transition:opacity .2s}
      .nori-ai-status.visible{opacity:.7}
      .nori-ai-tab{width:100%;border:0;background:transparent;color:inherit;cursor:pointer}
      .nori-ai-tab.nori-ai-tab-active{background:color-mix(in srgb,#65d9e8 12%,transparent)!important;color:#65d9e8!important;font-weight:600}
      @media(max-width:720px){.nori-ai-settings-panel{padding:18px}.nori-ai-row{grid-template-columns:1fr;gap:6px}.nori-ai-label{padding-top:0}}
    `;
    document.head.appendChild(style);
  }

  function field(tag, name, type) {
    const element = document.createElement(tag);
    element.dataset.field = name;
    if (type) element.type = type;
    element.className = tag === "textarea" ? "nori-ai-textarea" : tag === "select" ? "nori-ai-select" : "nori-ai-input";
    return element;
  }

  function row(labelText, control, hintText = "") {
    const root = document.createElement("div");
    root.className = "nori-ai-row";
    const label = document.createElement("div");
    label.className = "nori-ai-label";
    label.textContent = labelText;
    if (hintText) {
      const hint = document.createElement("span");
      hint.className = "nori-ai-hint";
      hint.textContent = hintText;
      label.appendChild(hint);
    }
    root.append(label, control);
    return root;
  }

  function checkbox(name, text) {
    const line = document.createElement("label");
    line.className = "nori-ai-checkbox-line";
    const input = document.createElement("input");
    input.type = "checkbox";
    input.dataset.field = name;
    const caption = document.createElement("span");
    caption.textContent = text;
    line.append(input, caption);
    return line;
  }

  function createPanel() {
    const t = labels();
    const panel = document.createElement("section");
    panel.className = "nori-ai-settings-panel";
    panel.hidden = true;
    panel.dataset.noriAiPanel = "1";

    const wrap = document.createElement("div");
    wrap.className = "nori-ai-settings-wrap";
    const head = document.createElement("div");
    head.className = "nori-ai-settings-head";
    const title = document.createElement("h2");
    title.className = "nori-ai-settings-title";
    title.textContent = t.title;
    const subtitle = document.createElement("p");
    subtitle.className = "nori-ai-settings-subtitle";
    subtitle.textContent = t.subtitle;
    head.append(title, subtitle);

    const card = document.createElement("div");
    card.className = "nori-ai-card";

    const enabled = checkbox("enabled", t.enabled);
    card.append(row(t.enabled, enabled, t.enabledHint));

    const provider = field("select", "provider");
    provider.append(new Option("OpenAI Compatible", "openai-compatible"), new Option("Anthropic", "anthropic"));
    card.append(row(t.provider, provider));

    const baseUrl = field("input", "baseUrl", "url");
    baseUrl.autocomplete = "off";
    baseUrl.spellcheck = false;
    card.append(row(t.baseUrl, baseUrl));

    const model = field("input", "model", "text");
    model.autocomplete = "off";
    model.spellcheck = false;
    card.append(row(t.model, model));

    const secretWrap = document.createElement("div");
    secretWrap.className = "nori-ai-secret-wrap";
    const apiKey = field("input", "apiKey", "password");
    apiKey.autocomplete = "off";
    apiKey.spellcheck = false;
    const reveal = document.createElement("button");
    reveal.type = "button";
    reveal.className = "nori-ai-small-button";
    reveal.textContent = "👁";
    reveal.addEventListener("click", () => {
      apiKey.type = apiKey.type === "password" ? "text" : "password";
    });
    secretWrap.append(apiKey, reveal);
    card.append(row(t.apiKey, secretWrap));

    const remember = checkbox("rememberApiKey", t.rememberKey);
    const rememberBox = document.createElement("div");
    rememberBox.append(remember);
    const warning = document.createElement("div");
    warning.className = "nori-ai-warning";
    warning.textContent = t.keyWarning;
    rememberBox.append(warning);
    card.append(row(t.rememberKey, rememberBox));

    const systemPrompt = field("textarea", "systemPrompt");
    systemPrompt.spellcheck = false;
    card.append(row(t.systemPrompt, systemPrompt));

    const characterPrompt = field("textarea", "characterPrompt");
    characterPrompt.placeholder = t.characterPlaceholder;
    characterPrompt.spellcheck = false;
    card.append(row(t.characterPrompt, characterPrompt));

    const temperature = field("input", "temperature", "number");
    temperature.min = "0";
    temperature.max = "2";
    temperature.step = "0.05";
    card.append(row(t.temperature, temperature));

    const maxTokens = field("input", "maxTokens", "number");
    maxTokens.min = "32";
    maxTokens.max = "4096";
    maxTokens.step = "1";
    card.append(row(t.maxTokens, maxTokens));

    const serverNote = document.createElement("div");
    serverNote.className = "nori-ai-hint";
    serverNote.textContent = t.serverNote;

    const actions = document.createElement("div");
    actions.className = "nori-ai-actions";
    const save = document.createElement("button");
    save.type = "button";
    save.className = "nori-ai-button primary";
    save.textContent = t.save;
    const reset = document.createElement("button");
    reset.type = "button";
    reset.className = "nori-ai-button";
    reset.textContent = t.reset;
    const status = document.createElement("span");
    status.className = "nori-ai-status";
    status.textContent = t.saved;
    actions.append(save, reset, status);

    wrap.append(head, card, serverNote, actions);
    panel.append(wrap);

    function fill(settings) {
      const value = normalize(settings);
      for (const element of panel.querySelectorAll("[data-field]")) {
        const key = element.dataset.field;
        if (element.type === "checkbox") element.checked = Boolean(value[key]);
        else element.value = value[key] ?? "";
      }
    }

    function read() {
      const current = loadSettings();
      for (const element of panel.querySelectorAll("[data-field]")) {
        const key = element.dataset.field;
        current[key] = element.type === "checkbox" ? element.checked : element.value;
      }
      return normalize(current);
    }

    provider.addEventListener("change", () => {
      const current = String(baseUrl.value || "").trim();
      if (
        !current ||
        current === "https://api.openai.com/v1" ||
        current === "https://api.anthropic.com/v1"
      ) {
        baseUrl.value = provider.value === "anthropic" ? "https://api.anthropic.com/v1" : "https://api.openai.com/v1";
      }
      if (!String(model.value || "").trim() || model.value === "gpt-4o-mini") {
        model.value = provider.value === "anthropic" ? "claude-3-5-sonnet-20241022" : "gpt-4o-mini";
      }
    });

    save.addEventListener("click", () => {
      fill(saveSettings(read()));
      status.classList.add("visible");
      window.setTimeout(() => status.classList.remove("visible"), 1600);
    });

    reset.addEventListener("click", () => {
      fill(resetSettings());
      status.classList.add("visible");
      window.setTimeout(() => status.classList.remove("visible"), 1600);
    });

    fill(loadSettings());
    panel.refresh = () => fill(loadSettings());
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
    const aiButton = document.createElement("button");
    aiButton.type = "button";
    aiButton.className =
      originalButtons[0]?.className ||
      "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition-colors text-muted-foreground hover:bg-muted hover:text-foreground";
    aiButton.classList.add("nori-ai-tab");
    const icon = document.createElement("span");
    icon.textContent = "✦";
    icon.style.width = "1rem";
    icon.style.textAlign = "center";
    const text = document.createElement("span");
    text.textContent = t.tab;
    aiButton.append(icon, text);
    nav.appendChild(aiButton);

    const panel = createPanel();
    shell.appendChild(panel);
    const hidden = new Map();

    function showAI() {
      for (const child of [...shell.children]) {
        if (child === sidebar || child === panel) continue;
        if (!hidden.has(child)) hidden.set(child, child.style.display);
        child.style.display = "none";
      }
      panel.hidden = false;
      panel.style.display = "block";
      aiButton.classList.add("nori-ai-tab-active");
      panel.refresh?.();
    }

    function restore() {
      panel.hidden = true;
      panel.style.display = "none";
      aiButton.classList.remove("nori-ai-tab-active");
      for (const [child, display] of hidden) {
        if (child.isConnected) child.style.display = display;
      }
      hidden.clear();
    }

    aiButton.addEventListener("click", (event) => {
      event.preventDefault();
      showAI();
    });
    for (const button of originalButtons) button.addEventListener("click", restore, { capture: true });
  }

  function scanSettings() {
    for (const nav of document.querySelectorAll("nav")) installIntoNav(nav);
  }

  installStyles();
  const observer = new MutationObserver(scanSettings);
  observer.observe(document.documentElement, { subtree: true, childList: true });
  document.addEventListener("DOMContentLoaded", scanSettings, { once: true });
  window.addEventListener("storage", (event) => {
    if (event.key === STORAGE_KEY) scanSettings();
  });
  scanSettings();

  // Small public API for debugging/automation without exposing the key through
  // console output. get() intentionally returns a redacted shape.
  window.NoriAISettings = Object.freeze({
    get: () => publicSettings(loadSettings()),
    save: (settings) => publicSettings(saveSettings({ ...loadSettings(), ...settings })),
    reset: () => publicSettings(resetSettings()),
  });
})();
