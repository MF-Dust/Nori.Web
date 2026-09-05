(() => {
  "use strict";

  const STORAGE_KEY = "nori.ai.settings.v1";
  const SESSION_KEY = "nori.ai.api-key.v1";
  const previousSend = WebSocket.prototype.send;

  function parse(value) {
    try {
      const parsed = JSON.parse(value || "{}");
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
  }

  function readStorage(storage, key) {
    try {
      return storage.getItem(key) || "";
    } catch {
      return "";
    }
  }

  function payload() {
    const persisted = parse(readStorage(localStorage, STORAGE_KEY));
    const apiKey = persisted.rememberApiKey
      ? String(persisted.apiKey || "")
      : readStorage(sessionStorage, SESSION_KEY);
    return {
      enabled: persisted.enabled === true,
      provider: persisted.provider === "anthropic" ? "anthropic" : "openai-compatible",
      baseUrl: String(persisted.baseUrl || "").trim(),
      model: String(persisted.model || "").trim(),
      apiKey: apiKey.trim(),
      systemPrompt: String(persisted.systemPrompt || ""),
      characterPrompt: String(persisted.characterPrompt || ""),
      temperature: Number(persisted.temperature ?? 0.75),
      maxTokens: Number(persisted.maxTokens ?? 350),
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

  WebSocket.prototype.send = function noriAiFreshConfigSend(data) {
    if (typeof data === "string") {
      try {
        const message = JSON.parse(data);
        if (isChatDispatch(message)) {
          previousSend.call(
            this,
            JSON.stringify({
              type: "event",
              worldId: message.worldId,
              cartridgeId: "chat",
              requestId: `ai-config-fresh-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
              channel: "nori.ai.config",
              payload: payload(),
            }),
          );
        }
      } catch {
        // Keep non-JSON WebSocket frames untouched.
      }
    }
    return previousSend.call(this, data);
  };
})();
