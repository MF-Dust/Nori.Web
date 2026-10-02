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

Changing the provider or API host invalidates an unchanged saved key. The UI clears it and requires the user to enter a credential for the new target, preventing a silently modified Base URL from reusing an existing key.

## Server transport and secret isolation

For a player chat message, `public/nori-ai-settings.js` attaches the active browser AI configuration to that **single** Arcade dispatch in the private `noriAiConfig` compatibility field.

The local server and Cloudflare Durable Object remove `noriAiConfig` before protocol/cartridge handling, validate the configuration, and install it in a Python `ContextVar` only for work spawned by that chat dispatch. API keys are never serialized into WebSocket hibernation attachments and are deliberately **not** stored in cartridge state, runtime transitions, world snapshots, or Durable Object storage.

The legacy `nori.ai.config` event remains accepted by the backend for compatibility, but it no longer persists credentials across messages. The settings connection test continues to send its configuration only for the test request.

Public configuration acknowledgements contain only redacted metadata such as `hasApiKey`; they never return the key itself. Provider errors also avoid logging request headers or configuration values.

Browser overrides never inherit the server's `OPENAI_API_KEY`. This prevents a user-supplied Base URL from receiving the server's credential.
