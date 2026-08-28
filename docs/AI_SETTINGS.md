# Browser AI settings

NoriOS adds an **AI** section to the virtual **Settings** application without modifying the large compiled `NormalApp` bundle.

## Settings

The browser can override the server-side model configuration with:

- Provider: OpenAI-compatible or Anthropic
- Base URL
- Model
- API key
- System prompt
- Nori / character prompt
- Temperature
- Maximum output tokens

The **Use browser AI configuration** switch is off by default. When it is off, Nori.Web keeps using the server's existing `OPENAI_*` configuration and local fallback behavior.

## Browser persistence

Non-secret preferences are stored under the namespaced `localStorage` key:

```text
nori.ai.settings.v1
```

The API key is safer by default:

- **Remember API Key off**: the key is kept in `sessionStorage` under `nori.ai.api-key.v1` and disappears when the browser session ends.
- **Remember API Key on**: the key is persisted in `localStorage` with the other settings.

A persisted browser key can be read by JavaScript executing on the same origin. Do not enable persistent-key storage on a shared or untrusted browser profile.

## Server transport and secret isolation

Before the browser sends a player chat message, `public/nori-ai-settings.js` sends the active configuration over the verified Arcade `event` channel:

```text
nori.ai.config
```

The backend validates it and stores it in a Python `ContextVar` for the current WebSocket execution context. It is deliberately **not** stored in a cartridge state, runtime transition, world snapshot, or Durable Object storage.

The acknowledgement contains only a redacted summary such as `hasApiKey`; it never returns the key itself. Provider errors also avoid logging request headers or configuration values.

Browser overrides never inherit the server's `OPENAI_API_KEY`. This prevents a user-supplied Base URL from receiving the server's credential.
