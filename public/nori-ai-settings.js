(() => {
  "use strict";

  const STORAGE_KEY = "nori.ai.settings.v1";
  const SESSION_KEY = "nori.ai.api-key.v1";
  const INSTALLED = Symbol("noriAiSettingsInstalled");
  const attachedSockets = new WeakSet();
  let activeSocket = null;
  let activeWorldId = "";

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

  function credentialTarget(settings) {
    const provider = settings?.provider === "anthropic" ? "anthropic" : "openai-compatible";
    const raw = String(settings?.baseUrl || "").trim();
    try {
      const url = new URL(raw);
      return `${provider}|${url.protocol}//${url.host}`;
    } catch {
      return `${provider}|${raw.toLowerCase()}`;
    }
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

  function protectCredentialTarget(input, previous = loadSettings()) {
    const settings = normalize(input);
    const baseline = normalize(previous);
    if (
      baseline.apiKey &&
      settings.apiKey === baseline.apiKey &&
      credentialTarget(baseline) !== credentialTarget(settings)
    ) {
      settings.apiKey = "";
    }
    return settings;
  }

  function saveSettings(input) {
    const settings = protectCredentialTarget(input);
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

  function runtimePayload(settings = loadSettings()) {
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

  function emitStatus(kind, text) {
    window.dispatchEvent(new CustomEvent("nori:ai-status", { detail: { kind, text } }));
  }

  function attachSocket(socket) {
    if (attachedSockets.has(socket)) return;
    attachedSockets.add(socket);
    socket.addEventListener("message", (event) => {
      if (typeof event.data !== "string") return;
      try {
        const message = JSON.parse(event.data);
        if (message.type === "world_joined" || message.type === "world_created") {
          activeSocket = socket;
          activeWorldId = String(message.world?.worldId || message.worldId || "");
          return;
        }
        if (message.type !== "event" || message.channel !== "nori.ai.test.result") return;
        const result = message.payload && typeof message.payload === "object" ? message.payload : {};
        if (result.ok === true) {
          const provider = String(result.provider || "AI");
          const model = String(result.model || "");
          emitStatus(
            "ok",
            isChinese()
              ? `连接成功：${provider}${model ? ` / ${model}` : ""}`
              : `Connection succeeded: ${provider}${model ? ` / ${model}` : ""}`,
          );
        } else {
          emitStatus(
            "error",
            isChinese()
              ? `连接失败：${String(result.error || "未知错误")}`
              : `Connection failed: ${String(result.error || "Unknown error")}`,
          );
        }
      } catch {
        // Ignore unrelated text frames.
      }
    });
    socket.addEventListener("close", () => {
      if (activeSocket === socket) {
        activeSocket = null;
        activeWorldId = "";
      }
    }, { once: true });
  }

  // The extension loads before the main Vite bundle. Attach browser AI
  // credentials only to chat, chip analysis and drawing recognition. The Worker strips
  // this compatibility field before the message reaches cartridge state, so
  // the API key never needs to survive in WebSocket attachment storage.
  const nativeSend = WebSocket.prototype.send;
  WebSocket.prototype.send = function patchedNoriSend(data) {
    attachSocket(this);
    if (typeof data === "string") {
      try {
        const message = JSON.parse(data);
        if (isChatPlayerDispatch(message) || (message.type === "event" && ["manifold.chip.scan", "pictionary.snapshot"].includes(message.channel))) {
          activeSocket = this;
          if (message.worldId) activeWorldId = String(message.worldId);
          message.noriAiConfig = runtimePayload();
          return nativeSend.call(this, JSON.stringify(message));
        }
      } catch {
        // Preserve the shipped client's behavior for non-JSON frames.
      }
    }
    return nativeSend.call(this, data);
  };

  function sendTest(settings) {
    if (!activeSocket || activeSocket.readyState !== WebSocket.OPEN || !activeWorldId) {
      emitStatus("error", isChinese() ? "当前尚未建立 Nori 会话连接" : "Nori session is not connected yet");
      return false;
    }
    nativeSend.call(
      activeSocket,
      JSON.stringify({
        type: "event",
        worldId: activeWorldId,
        cartridgeId: "chat",
        requestId: `ai-test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        channel: "nori.ai.test",
        payload: { config: runtimePayload(normalize(settings)) },
      }),
    );
    emitStatus("pending", isChinese() ? "正在测试 AI 连接…" : "Testing AI connection…");
    return true;
  }

  function isChinese() {
    const lang = String(document.documentElement.lang || navigator.language || "").toLowerCase();
    return lang.startsWith("zh");
  }

  const TEXT = {
    en: {
      tab: "AI",
      title: "AI Model & Prompts",
      subtitle: "Used for chat, chip analysis and drawing recognition. Drawing recognition requires a vision-capable model.",
      enabled: "Use browser AI configuration",
      enabledHint: "Off = keep using the server's configured model and credentials.",
      provider: "Provider",
      baseUrl: "Base URL",
      model: "Model",
      apiKey: "API Key",
      rememberKey: "Remember API Key in this browser",
      keyWarning: "Saved browser keys can be read by scripts running on this same origin. Leave this off on shared devices.",
      keyClearedTargetChanged: "API key cleared because the provider or API host changed. Re-enter the key for the new endpoint.",
      systemPrompt: "System Prompt",
      characterPrompt: "Nori / Character Prompt",
      characterPlaceholder: "Optional additional personality, setting, style, or behavioral instructions…",
      temperature: "Temperature",
      maxTokens: "Max Tokens",
      save: "Save",
      saved: "Saved locally",
      savedDisabled: "Saved locally; browser AI override is still disabled",
      test: "Test connection",
      reset: "Restore defaults",
      serverNote: "When browser override is disabled, the Worker keeps using its OPENAI_* configuration.",
    },
    zh: {
      tab: "AI",
      title: "AI 模型与提示词",
      subtitle: "用于对话、芯片分析和画布识图；识图需要支持图片输入的模型。",
      enabled: "使用浏览器 AI 配置",
      enabledHint: "关闭时继续使用服务器中配置的模型与凭据。",
      provider: "提供商",
      baseUrl: "Base URL",
      model: "模型",
      apiKey: "API Key",
      rememberKey: "在此浏览器记住 API Key",
      keyWarning: "持久化到浏览器的 Key 可被同源页面脚本读取；在公用设备上请不要开启。",
      keyClearedTargetChanged: "提供商或 API 主机已变化，原 API Key 已清除；请为新端点重新输入。",
      systemPrompt: "System Prompt",
      characterPrompt: "Nori / 角色提示词",
      characterPlaceholder: "可选：补充人格、世界观、语气或行为要求……",
      temperature: "Temperature",
      maxTokens: "最大输出 Tokens",
      save: "保存",
      saved: "已保存到浏览器",
      savedDisabled: "已保存，但“使用浏览器 AI 配置”仍处于关闭状态",
      test: "测试连接",
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
      .nori-ai-settings-panel{flex:1;min-width:0;min-height:0;overflow:auto;padding:1.25rem;background:transparent;color:inherit;font:inherit}
      .nori-ai-settings-wrap{max-width:28rem;margin:0 auto 2rem}
      .nori-ai-settings-head{margin:0 0 1.5rem;padding:0 0 1.5rem;border-bottom:1px solid var(--border)}
      .nori-ai-settings-title{font-size:.875rem;line-height:1.25rem;font-weight:500;letter-spacing:0;margin:0}
      .nori-ai-settings-subtitle{font-size:.75rem;line-height:1rem;color:var(--muted-foreground);opacity:1;margin:0}
      .nori-ai-card{border:0;border-radius:0;padding:0;background:transparent;margin:0}
      .nori-ai-row{display:flex;flex-direction:column;align-items:stretch;gap:.5rem;margin-bottom:1rem}
      .nori-ai-row:last-child{margin-bottom:0}
      .nori-ai-row:has(input[type="checkbox"]){flex-direction:row;align-items:center;justify-content:space-between;gap:1rem}
      .nori-ai-label{font-size:.875rem;line-height:1.25rem;font-weight:400;padding-top:0;min-width:0}
      .nori-ai-hint{display:block;font-size:.75rem;line-height:1rem;color:var(--muted-foreground);opacity:1;font-weight:400;margin-top:.125rem}
      .nori-ai-input,.nori-ai-select,.nori-ai-textarea{box-sizing:border-box;width:100%;border:1px solid var(--border);border-radius:6px;background:var(--background);color:var(--foreground);padding:6px 10px;font:inherit;font-size:14px}
      .nori-ai-textarea{min-height:6rem;resize:vertical;line-height:1.5}
      .nori-ai-checkbox-line{position:relative;display:inline-flex;flex:0 0 auto;width:32px;height:18px}
      .nori-ai-checkbox-line input{position:absolute;inset:0;margin:0;opacity:0;cursor:pointer}
      .nori-ai-checkbox-line span{display:block;width:32px;height:18px;border-radius:20px;background:var(--input);font-size:0;color:transparent;overflow:hidden;position:relative}
      .nori-ai-checkbox-line span::before{content:"";position:absolute;top:2px;left:2px;width:14px;height:14px;border-radius:50%;background:var(--background);box-shadow:0 1px 2px #0003;transition:transform .15s}
      .nori-ai-checkbox-line input:checked+span{background:var(--primary)}
      .nori-ai-checkbox-line input:checked+span::before{transform:translateX(14px)}
      .nori-ai-secret-wrap{display:flex;gap:.5rem;align-items:center}
      .nori-ai-secret-wrap .nori-ai-input{flex:1;min-width:0}
      .nori-ai-small-button,.nori-ai-button{border:1px solid var(--border);border-radius:6px;background:var(--background);color:var(--foreground);padding:6px 10px;font:inherit;font-size:12px;cursor:pointer}
      .nori-ai-button.primary{background:var(--background);border-color:var(--border)}
      .nori-ai-button:hover,.nori-ai-small-button:hover{background:var(--muted)}
      .nori-ai-actions{display:flex;align-items:center;gap:.75rem;margin-top:1.5rem;flex-wrap:wrap}
      .nori-ai-status{font-size:.75rem;line-height:1rem;color:var(--muted-foreground);opacity:0}
      .nori-ai-status.visible{opacity:1}
      .nori-ai-status.error{color:var(--destructive);opacity:1}
      .nori-ai-tab{width:auto;border:0;background:transparent;color:var(--muted-foreground);cursor:pointer;font-size:.875rem;line-height:1.25rem;font-weight:400;text-align:left}
      .nori-ai-tab:hover:not(.nori-ai-tab-active){background:var(--muted);color:var(--foreground)}
      .nori-ai-tab.nori-ai-tab-active{background:color-mix(in oklab,var(--primary) 10%,transparent)!important;color:var(--primary)!important;font-weight:500!important}
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

    card.append(row(t.rememberKey, checkbox("rememberApiKey", t.rememberKey), t.keyWarning));

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
    const test = document.createElement("button");
    test.type = "button";
    test.className = "nori-ai-button";
    test.textContent = t.test;
    const reset = document.createElement("button");
    reset.type = "button";
    reset.className = "nori-ai-button";
    reset.textContent = t.reset;
    const status = document.createElement("span");
    status.className = "nori-ai-status";
    status.textContent = t.saved;
    actions.append(save, test, reset, status);

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

    function showStatus(kind, text) {
      status.textContent = text;
      status.classList.add("visible");
      status.classList.toggle("error", kind === "error");
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
      const draft = read();
      const saved = saveSettings(draft);
      fill(saved);
      const keyCleared = Boolean(draft.apiKey) && !saved.apiKey;
      showStatus(
        keyCleared ? "error" : "ok",
        keyCleared ? t.keyClearedTargetChanged : saved.enabled ? t.saved : t.savedDisabled,
      );
      window.setTimeout(() => status.classList.remove("visible"), keyCleared ? 4200 : 2600);
    });

    test.addEventListener("click", () => {
      const draft = read();
      const guarded = protectCredentialTarget(draft);
      if (draft.apiKey && !guarded.apiKey) {
        fill(guarded);
        showStatus("error", t.keyClearedTargetChanged);
        window.setTimeout(() => status.classList.remove("visible"), 4200);
        return;
      }
      sendTest(guarded);
    });

    reset.addEventListener("click", () => {
      fill(resetSettings());
      showStatus("ok", t.saved);
      window.setTimeout(() => status.classList.remove("visible"), 1600);
    });

    window.addEventListener("nori:ai-status", (event) => {
      showStatus(String(event.detail?.kind || "ok"), String(event.detail?.text || ""));
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
    const aiButton = document.createElement("button");
    aiButton.type = "button";
    aiButton.className =
      "nori-ai-tab flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition-colors text-muted-foreground hover:bg-muted hover:text-foreground";
    const icon = document.createElement("span");
    icon.setAttribute("aria-hidden", "true");
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
    nav.addEventListener("click", (event) => {
      const clicked = event.target instanceof Element ? event.target.closest("button") : null;
      if (clicked && clicked !== aiButton) restore();
    }, { capture: true });
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
    test: () => sendTest(loadSettings()),
  });
})();
