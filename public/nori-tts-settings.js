(() => {
  "use strict";

  const STORAGE_KEY = "nori.tts.settings.v1";
  const SESSION_KEY = "nori.tts.api-keys.v1";
  const INSTALLED = Symbol("noriTtsSettingsInstalled");
  const attachedSockets = new WeakSet();
  const previousSend = WebSocket.prototype.send;
  let activeSocket = null;
  let activeWorldId = "";
  let playingAudio = null;
  let playingUrl = "";

  const PROVIDERS = Object.freeze({
    "openai-compatible": {
      label: "OpenAI Compatible",
      baseUrl: "https://api.openai.com/v1",
      model: "gpt-4o-mini-tts",
    },
    custom: { label: "Custom HTTP", baseUrl: "", model: "" },
    "gpt-sovits": { label: "GPT-SoVITS", baseUrl: "http://127.0.0.1:9880", model: "" },
    minimax: {
      label: "MiniMax",
      baseUrl: "https://api.minimaxi.com/v1",
      model: "speech-2.8-turbo",
    },
    gemini: {
      label: "Gemini TTS",
      baseUrl: "https://generativelanguage.googleapis.com/v1beta",
      model: "gemini-3.1-flash-tts-preview",
    },
  });

  const DEFAULTS = Object.freeze({
    enabled: false,
    provider: "openai-compatible",
    voice: "nova",
    speed: 1,
    rememberApiKey: false,
  });

  function safeParse(value) {
    try {
      const parsed = JSON.parse(value || "{}");
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

  function clamp(value, fallback, min, max) {
    const number = Number(value);
    return Number.isFinite(number) ? Math.max(min, Math.min(max, number)) : fallback;
  }

  function normalizeProfile(provider, value) {
    const defaults = PROVIDERS[provider];
    const source = value && typeof value === "object" ? value : {};
    return {
      baseUrl: String(source.baseUrl ?? defaults.baseUrl).trim().slice(0, 1000),
      apiKey: String(source.apiKey || "").trim().slice(0, 2048),
      model: String(source.model ?? defaults.model).trim().slice(0, 200),
      refAudio: String(source.refAudio || "").trim().slice(0, 4000),
      promptText: String(source.promptText || "").slice(0, 4000),
      promptLang: String(source.promptLang || "zh").trim().slice(0, 40) || "zh",
      textLang: String(source.textLang || "zh").trim().slice(0, 40) || "zh",
    };
  }

  function normalize(value) {
    const source = value && typeof value === "object" ? value : {};
    const provider = Object.hasOwn(PROVIDERS, source.provider)
      ? source.provider
      : DEFAULTS.provider;
    const profiles = {};
    for (const name of Object.keys(PROVIDERS)) {
      profiles[name] = normalizeProfile(name, source.profiles?.[name]);
    }
    return {
      enabled: source.enabled === true,
      provider,
      voice: String(source.voice || DEFAULTS.voice).trim().slice(0, 200),
      speed: clamp(source.speed, DEFAULTS.speed, 0.25, 4),
      rememberApiKey: source.rememberApiKey === true,
      profiles,
    };
  }

  function loadSettings() {
    const persisted = safeParse(safeStorage(localStorage, "getItem", STORAGE_KEY));
    const sessionKeys = safeParse(safeStorage(sessionStorage, "getItem", SESSION_KEY));
    const settings = normalize(persisted);
    if (!settings.rememberApiKey) {
      for (const name of Object.keys(PROVIDERS)) {
        settings.profiles[name].apiKey = String(sessionKeys[name] || "").trim().slice(0, 2048);
      }
    }
    return settings;
  }

  function saveSettings(value) {
    const settings = normalize(value);
    const persisted = structuredClone(settings);
    if (settings.rememberApiKey) {
      safeStorage(sessionStorage, "removeItem", SESSION_KEY);
    } else {
      const keys = {};
      for (const name of Object.keys(PROVIDERS)) {
        keys[name] = settings.profiles[name].apiKey;
        persisted.profiles[name].apiKey = "";
      }
      safeStorage(sessionStorage, "setItem", SESSION_KEY, JSON.stringify(keys));
    }
    safeStorage(localStorage, "setItem", STORAGE_KEY, JSON.stringify(persisted));
    window.dispatchEvent(new CustomEvent("nori:tts-settings-changed", { detail: publicSettings(settings) }));
    return settings;
  }

  function resetSettings() {
    safeStorage(localStorage, "removeItem", STORAGE_KEY);
    safeStorage(sessionStorage, "removeItem", SESSION_KEY);
    const settings = normalize(DEFAULTS);
    window.dispatchEvent(new CustomEvent("nori:tts-settings-changed", { detail: publicSettings(settings) }));
    return settings;
  }

  function publicSettings(settings) {
    const profiles = {};
    for (const name of Object.keys(PROVIDERS)) {
      const profile = settings.profiles[name];
      profiles[name] = {
        baseUrl: profile.baseUrl,
        model: profile.model,
        hasApiKey: Boolean(profile.apiKey),
        refAudio: profile.refAudio,
        promptText: profile.promptText,
        promptLang: profile.promptLang,
        textLang: profile.textLang,
      };
    }
    return {
      enabled: settings.enabled,
      provider: settings.provider,
      voice: settings.voice,
      speed: settings.speed,
      rememberApiKey: settings.rememberApiKey,
      profiles,
    };
  }

  function runtimePayload(settings = loadSettings()) {
    const profile = settings.profiles[settings.provider];
    return {
      enabled: settings.enabled,
      provider: settings.provider,
      baseUrl: profile.baseUrl,
      apiKey: profile.apiKey,
      model: profile.model,
      voice: settings.voice,
      speed: settings.speed,
      refAudio: profile.refAudio,
      promptText: profile.promptText,
      promptLang: profile.promptLang,
      textLang: profile.textLang,
    };
  }

  function isChatDispatch(message) {
    return Boolean(
      message &&
      message.type === "dispatch" &&
      message.cartridgeId === "chat" &&
      message.actor === "player" &&
      message.cmd &&
      message.cmd.type === "playerMessage"
    );
  }

  function emitStatus(kind, text) {
    window.dispatchEvent(new CustomEvent("nori:tts-status", { detail: { kind, text } }));
  }

  function stopAudio() {
    if (playingAudio) {
      playingAudio.pause();
      playingAudio.src = "";
      playingAudio = null;
    }
    if (playingUrl) {
      URL.revokeObjectURL(playingUrl);
      playingUrl = "";
    }
  }

  function playPayload(payload) {
    if (!payload || typeof payload.audio !== "string" || !payload.audio) return;
    try {
      const binary = atob(payload.audio);
      const bytes = new Uint8Array(binary.length);
      for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
      stopAudio();
      playingUrl = URL.createObjectURL(new Blob([bytes], { type: payload.mime || "audio/mpeg" }));
      playingAudio = new Audio(playingUrl);
      playingAudio.addEventListener("ended", () => {
        emitStatus("ok", payload.purpose === "test" ? "Test voice completed" : "TTS completed");
        stopAudio();
      }, { once: true });
      playingAudio.addEventListener("error", () => {
        emitStatus("error", "Browser could not decode the synthesized audio");
        stopAudio();
      }, { once: true });
      const result = playingAudio.play();
      if (result && typeof result.catch === "function") {
        result.catch((error) => emitStatus("error", `Audio playback failed: ${error?.message || error}`));
      }
    } catch (error) {
      emitStatus("error", `Invalid TTS audio response: ${error?.message || error}`);
    }
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
        if (message.type !== "event") return;
        if (message.channel === "nori.tts.audio") {
          playPayload(message.payload);
        } else if (message.channel === "nori.tts.error") {
          emitStatus("error", String(message.payload?.error || "TTS request failed"));
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

  WebSocket.prototype.send = function noriTtsConfiguredSend(data) {
    attachSocket(this);
    if (typeof data === "string") {
      try {
        const message = JSON.parse(data);
        if (isChatDispatch(message)) {
          activeSocket = this;
          if (message.worldId) activeWorldId = String(message.worldId);
          previousSend.call(
            this,
            JSON.stringify({
              type: "event",
              worldId: message.worldId,
              cartridgeId: "chat",
              requestId: `tts-config-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
              channel: "nori.tts.config",
              payload: runtimePayload(),
            }),
          );
        }
      } catch {
        // Keep non-JSON WebSocket frames untouched.
      }
    }
    return previousSend.call(this, data);
  };

  function sendTest(settings) {
    if (!activeSocket || activeSocket.readyState !== WebSocket.OPEN || !activeWorldId) {
      emitStatus("error", isChinese() ? "当前尚未建立 Nori 会话连接" : "Nori session is not connected yet");
      return false;
    }
    previousSend.call(
      activeSocket,
      JSON.stringify({
        type: "event",
        worldId: activeWorldId,
        cartridgeId: "chat",
        requestId: `tts-test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        channel: "nori.tts.test",
        payload: {
          config: runtimePayload(settings),
          text: isChinese() ? "你好，我是 Nori。这是一段语音测试。" : "Hello, I'm Nori. This is a voice test.",
        },
      }),
    );
    emitStatus("pending", isChinese() ? "正在合成测试语音…" : "Synthesizing test voice…");
    return true;
  }

  function isChinese() {
    const lang = String(document.documentElement.lang || navigator.language || "").toLowerCase();
    return lang.startsWith("zh");
  }

  const TEXT = {
    en: {
      tab: "TTS",
      title: "Text-to-Speech",
      subtitle: "Independent voice provider used for Nori chat replies.",
      enabled: "Use custom TTS",
      enabledHint: "Off keeps the built-in compatibility audio fallback.",
      provider: "Provider",
      baseUrl: "Base URL / Endpoint",
      apiKey: "API Key",
      rememberKey: "Remember API keys in this browser",
      keyWarning: "Saved browser keys can be read by scripts on this origin. Leave this off on shared devices.",
      model: "Model",
      voice: "Voice / Voice ID",
      speed: "Speed",
      refAudio: "Reference audio path",
      promptText: "Reference prompt text",
      promptLang: "Prompt language",
      textLang: "Text language",
      save: "Save",
      reset: "Restore defaults",
      test: "Test voice",
      saved: "Saved locally",
    },
    zh: {
      tab: "TTS",
      title: "语音合成 TTS",
      subtitle: "与 AI 模型分开配置，用于 Nori 对话回复的语音合成。",
      enabled: "使用自定义 TTS",
      enabledHint: "关闭后继续使用内置兼容音频 fallback。",
      provider: "提供商",
      baseUrl: "Base URL / 请求端点",
      apiKey: "API Key",
      rememberKey: "在此浏览器记住 API Key",
      keyWarning: "持久化到浏览器的 Key 可被同源页面脚本读取，公用设备上可保持关闭。",
      model: "模型",
      voice: "音色 / Voice ID",
      speed: "语速",
      refAudio: "参考音频路径",
      promptText: "参考音频文本",
      promptLang: "参考音频语言",
      textLang: "合成文本语言",
      save: "保存",
      reset: "恢复默认",
      test: "测试声音",
      saved: "已保存到浏览器",
    },
  };

  function labels() {
    return isChinese() ? TEXT.zh : TEXT.en;
  }

  function installStyles() {
    if (document.getElementById("nori-tts-settings-style")) return;
    const style = document.createElement("style");
    style.id = "nori-tts-settings-style";
    style.textContent = `
      .nori-tts-panel{flex:1;min-width:0;overflow:auto;padding:24px 28px;background:var(--background,transparent);color:inherit}
      .nori-tts-wrap{max-width:820px;margin:0 auto 36px}.nori-tts-head{margin-bottom:22px}
      .nori-tts-title{font-size:20px;font-weight:650;letter-spacing:-.01em;margin:0 0 5px}.nori-tts-subtitle{font-size:13px;opacity:.62;margin:0}
      .nori-tts-card{border:1px solid color-mix(in srgb,currentColor 14%,transparent);border-radius:12px;padding:18px;background:color-mix(in srgb,currentColor 3%,transparent);margin-bottom:14px}
      .nori-tts-row{display:grid;grid-template-columns:minmax(145px,190px) minmax(0,1fr);align-items:start;gap:14px;margin-bottom:15px}.nori-tts-row:last-child{margin-bottom:0}
      .nori-tts-label{font-size:13px;font-weight:600;padding-top:8px}.nori-tts-hint{display:block;font-size:11px;line-height:1.5;opacity:.55;font-weight:400;margin-top:4px}
      .nori-tts-input,.nori-tts-select,.nori-tts-textarea{box-sizing:border-box;width:100%;border:1px solid color-mix(in srgb,currentColor 18%,transparent);border-radius:8px;background:color-mix(in srgb,currentColor 5%,transparent);color:inherit;padding:8px 10px;font:inherit;font-size:13px;outline:none}
      .nori-tts-input:focus,.nori-tts-select:focus,.nori-tts-textarea:focus{border-color:color-mix(in srgb,#65d9e8 75%,currentColor);box-shadow:0 0 0 2px color-mix(in srgb,#65d9e8 18%,transparent)}
      .nori-tts-textarea{min-height:82px;resize:vertical;line-height:1.5}.nori-tts-checkbox{display:flex;align-items:center;gap:9px;min-height:34px;font-size:13px}.nori-tts-checkbox input{width:16px;height:16px;accent-color:#65d9e8}
      .nori-tts-secret{display:flex;gap:8px}.nori-tts-secret .nori-tts-input{flex:1}.nori-tts-button,.nori-tts-small{border:1px solid color-mix(in srgb,currentColor 18%,transparent);border-radius:8px;background:color-mix(in srgb,currentColor 7%,transparent);color:inherit;padding:7px 12px;font:inherit;font-size:12px;cursor:pointer}.nori-tts-button.primary{background:color-mix(in srgb,#65d9e8 22%,transparent);border-color:color-mix(in srgb,#65d9e8 48%,transparent)}
      .nori-tts-actions{display:flex;align-items:center;gap:10px;margin-top:18px;flex-wrap:wrap}.nori-tts-warning{font-size:11px;line-height:1.55;color:#e7b65d;margin-top:7px}.nori-tts-status{font-size:12px;opacity:.7}.nori-tts-status.error{color:#ef7777}.nori-tts-tab{width:100%;border:0;background:transparent;color:inherit;cursor:pointer}.nori-tts-tab.active{background:color-mix(in srgb,#65d9e8 12%,transparent)!important;color:#65d9e8!important;font-weight:600}
      @media(max-width:720px){.nori-tts-panel{padding:18px}.nori-tts-row{grid-template-columns:1fr;gap:6px}.nori-tts-label{padding-top:0}}
    `;
    document.head.appendChild(style);
  }

  function field(tag, name, type = "") {
    const element = document.createElement(tag);
    element.dataset.field = name;
    if (type) element.type = type;
    element.className = tag === "textarea" ? "nori-tts-textarea" : tag === "select" ? "nori-tts-select" : "nori-tts-input";
    return element;
  }

  function row(labelText, control, hint = "") {
    const root = document.createElement("div");
    root.className = "nori-tts-row";
    const label = document.createElement("div");
    label.className = "nori-tts-label";
    label.textContent = labelText;
    if (hint) {
      const note = document.createElement("span");
      note.className = "nori-tts-hint";
      note.textContent = hint;
      label.appendChild(note);
    }
    root.append(label, control);
    return root;
  }

  function checkbox(name, text) {
    const root = document.createElement("label");
    root.className = "nori-tts-checkbox";
    const input = document.createElement("input");
    input.type = "checkbox";
    input.dataset.field = name;
    const caption = document.createElement("span");
    caption.textContent = text;
    root.append(input, caption);
    return root;
  }

  function createPanel() {
    const t = labels();
    const panel = document.createElement("section");
    panel.className = "nori-tts-panel";
    panel.hidden = true;

    const wrap = document.createElement("div");
    wrap.className = "nori-tts-wrap";
    const head = document.createElement("div");
    head.className = "nori-tts-head";
    const title = document.createElement("h2");
    title.className = "nori-tts-title";
    title.textContent = t.title;
    const subtitle = document.createElement("p");
    subtitle.className = "nori-tts-subtitle";
    subtitle.textContent = t.subtitle;
    head.append(title, subtitle);

    const card = document.createElement("div");
    card.className = "nori-tts-card";
    const enabled = checkbox("enabled", t.enabled);
    card.append(row(t.enabled, enabled, t.enabledHint));

    const provider = field("select", "provider");
    for (const [value, meta] of Object.entries(PROVIDERS)) provider.append(new Option(meta.label, value));
    card.append(row(t.provider, provider));

    const baseUrl = field("input", "baseUrl", "url");
    baseUrl.autocomplete = "off";
    baseUrl.spellcheck = false;
    card.append(row(t.baseUrl, baseUrl));

    const secret = document.createElement("div");
    secret.className = "nori-tts-secret";
    const apiKey = field("input", "apiKey", "password");
    apiKey.autocomplete = "off";
    const reveal = document.createElement("button");
    reveal.type = "button";
    reveal.className = "nori-tts-small";
    reveal.textContent = "👁";
    reveal.addEventListener("click", () => { apiKey.type = apiKey.type === "password" ? "text" : "password"; });
    secret.append(apiKey, reveal);
    card.append(row(t.apiKey, secret));

    const rememberWrap = document.createElement("div");
    rememberWrap.append(checkbox("rememberApiKey", t.rememberKey));
    const warning = document.createElement("div");
    warning.className = "nori-tts-warning";
    warning.textContent = t.keyWarning;
    rememberWrap.append(warning);
    card.append(row(t.rememberKey, rememberWrap));

    const model = field("input", "model", "text");
    const modelRow = row(t.model, model);
    card.append(modelRow);
    const voice = field("input", "voice", "text");
    const voiceRow = row(t.voice, voice);
    card.append(voiceRow);
    const speed = field("input", "speed", "number");
    speed.min = "0.25"; speed.max = "4"; speed.step = "0.05";
    card.append(row(t.speed, speed));

    const refAudio = field("input", "refAudio", "text");
    const refAudioRow = row(t.refAudio, refAudio);
    card.append(refAudioRow);
    const promptText = field("textarea", "promptText");
    const promptTextRow = row(t.promptText, promptText);
    card.append(promptTextRow);
    const promptLang = field("input", "promptLang", "text");
    const promptLangRow = row(t.promptLang, promptLang);
    card.append(promptLangRow);
    const textLang = field("input", "textLang", "text");
    const textLangRow = row(t.textLang, textLang);
    card.append(textLangRow);

    const actions = document.createElement("div");
    actions.className = "nori-tts-actions";
    const save = document.createElement("button");
    save.type = "button"; save.className = "nori-tts-button primary"; save.textContent = t.save;
    const test = document.createElement("button");
    test.type = "button"; test.className = "nori-tts-button"; test.textContent = t.test;
    const reset = document.createElement("button");
    reset.type = "button"; reset.className = "nori-tts-button"; reset.textContent = t.reset;
    const status = document.createElement("span");
    status.className = "nori-tts-status";
    actions.append(save, test, reset, status);
    wrap.append(head, card, actions);
    panel.append(wrap);

    let draft = loadSettings();

    function storeVisibleProfile() {
      const name = provider.value;
      if (!Object.hasOwn(draft.profiles, name)) return;
      draft.profiles[name] = normalizeProfile(name, {
        baseUrl: baseUrl.value,
        apiKey: apiKey.value,
        model: model.value,
        refAudio: refAudio.value,
        promptText: promptText.value,
        promptLang: promptLang.value,
        textLang: textLang.value,
      });
      draft.voice = voice.value;
      draft.speed = speed.value;
      draft.enabled = panel.querySelector('[data-field="enabled"]').checked;
      draft.rememberApiKey = panel.querySelector('[data-field="rememberApiKey"]').checked;
    }

    function refreshProviderRows() {
      const name = provider.value;
      const gpt = name === "gpt-sovits";
      modelRow.hidden = name === "custom" || gpt;
      voiceRow.hidden = gpt;
      for (const item of [refAudioRow, promptTextRow, promptLangRow, textLangRow]) item.hidden = !gpt;
    }

    function fill(settings) {
      draft = normalize(settings);
      provider.value = draft.provider;
      panel.querySelector('[data-field="enabled"]').checked = draft.enabled;
      panel.querySelector('[data-field="rememberApiKey"]').checked = draft.rememberApiKey;
      voice.value = draft.voice;
      speed.value = String(draft.speed);
      const profile = draft.profiles[draft.provider];
      baseUrl.value = profile.baseUrl;
      apiKey.value = profile.apiKey;
      model.value = profile.model;
      refAudio.value = profile.refAudio;
      promptText.value = profile.promptText;
      promptLang.value = profile.promptLang;
      textLang.value = profile.textLang;
      refreshProviderRows();
    }

    provider.addEventListener("change", (event) => {
      const next = event.currentTarget.value;
      const previous = draft.provider;
      event.currentTarget.value = previous;
      storeVisibleProfile();
      draft.provider = next;
      provider.value = next;
      const profile = draft.profiles[next];
      baseUrl.value = profile.baseUrl;
      apiKey.value = profile.apiKey;
      model.value = profile.model;
      refAudio.value = profile.refAudio;
      promptText.value = profile.promptText;
      promptLang.value = profile.promptLang;
      textLang.value = profile.textLang;
      refreshProviderRows();
    });

    save.addEventListener("click", () => {
      storeVisibleProfile();
      draft.provider = provider.value;
      fill(saveSettings(draft));
      status.classList.remove("error");
      status.textContent = t.saved;
    });

    test.addEventListener("click", () => {
      storeVisibleProfile();
      draft.provider = provider.value;
      sendTest(normalize(draft));
    });

    reset.addEventListener("click", () => {
      fill(resetSettings());
      status.classList.remove("error");
      status.textContent = t.saved;
    });

    window.addEventListener("nori:tts-status", (event) => {
      status.textContent = String(event.detail?.text || "");
      status.classList.toggle("error", event.detail?.kind === "error");
    });

    fill(draft);
    panel.refresh = () => fill(loadSettings());
    return panel;
  }

  function looksLikeSettingsNav(nav) {
    const texts = [...nav.querySelectorAll("button")].map((button) => button.textContent.trim());
    const includesAny = (choices) => choices.some((choice) => texts.includes(choice));
    return includesAny(["Sound", "声音"]) && includesAny(["Graphics", "显示效果"]) && includesAny(["Network", "网络"]) && includesAny(["System", "系统"]);
  }

  function installIntoNav(nav) {
    if (nav[INSTALLED] || !looksLikeSettingsNav(nav)) return;
    const sidebar = nav.parentElement;
    const shell = sidebar?.parentElement;
    if (!sidebar || !shell) return;
    nav[INSTALLED] = true;

    const t = labels();
    const template = nav.querySelector("button");
    const button = document.createElement("button");
    button.type = "button";
    button.className = template?.className || "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition-colors";
    button.classList.add("nori-tts-tab");
    const icon = document.createElement("span");
    icon.textContent = "♫"; icon.style.width = "1rem"; icon.style.textAlign = "center";
    const text = document.createElement("span");
    text.textContent = t.tab;
    button.append(icon, text);
    nav.appendChild(button);

    const panel = createPanel();
    shell.appendChild(panel);
    const hidden = new Map();

    function show() {
      for (const child of [...shell.children]) {
        if (child === sidebar || child === panel) continue;
        if (!hidden.has(child)) hidden.set(child, child.style.display);
        child.style.display = "none";
      }
      panel.hidden = false;
      panel.style.display = "block";
      button.classList.add("active");
      panel.refresh?.();
    }

    function restore() {
      panel.hidden = true;
      panel.style.display = "none";
      button.classList.remove("active");
      for (const [child, display] of hidden) if (child.isConnected) child.style.display = display;
      hidden.clear();
    }

    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      show();
    });
    nav.addEventListener("click", (event) => {
      const clicked = event.target.closest("button");
      if (clicked && clicked !== button) restore();
    }, { capture: true });
  }

  function scanSettings() {
    for (const nav of document.querySelectorAll("nav")) installIntoNav(nav);
  }

  installStyles();
  const observer = new MutationObserver(scanSettings);
  observer.observe(document.documentElement, { subtree: true, childList: true });
  document.addEventListener("DOMContentLoaded", scanSettings, { once: true });
  scanSettings();

  window.NoriTTSSettings = Object.freeze({
    get: () => publicSettings(loadSettings()),
    save: (settings) => publicSettings(saveSettings({ ...loadSettings(), ...settings })),
    reset: () => publicSettings(resetSettings()),
    stop: stopAudio,
  });
})();
