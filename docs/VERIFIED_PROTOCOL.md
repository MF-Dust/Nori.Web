# Verified NoriOS public protocol contract

This document records only behavior verified from public responses and the JavaScript shipped by `https://os.inori.ai/`. It is the compatibility target for the local backend; it is **not** a copy of the upstream server implementation.

## Evidence captured

- Live HTML loads `/assets/index-CyHAbkO5.js` and `/assets/NormalApp-Cn6agT0F.js`.
- `GET https://os.inori.ai/api/entry-status` returned HTTP 200 with:
  ```json
  {"status":"ok","machineId":"…"}
  ```
- The current live `NormalApp-Cn6agT0F.js` SHA-256 captured on 2026-08-26 was
  `a94458746a599c6ae175b68bd2be0497421e1319dc37b2337e12b3eae87be70d`.
- The client-side Zod schemas are in `public/assets/i18n-DtIC1LRi.js`, around its `Ld()` server-message parser.

## WebSocket connection

The production client obtains a Convex mutation ticket for
`auth/wsTickets:issueWebUserWsTicket`, then opens:

```text
wss://os.inori.ai/api/arcade/web/v1
subprotocols: ["arcade.v1", "ticket.<ticket>"]
```

A local adapter replaces only ticket issuance and the host URL; the shipped Arcade client implementation remains intact.

A media connection uses the same subprotocols at:

```text
.../api/arcade/web/v1/media
```

After opening, it sends JSON:

```json
{"type":"open_media","grant":"<mediaGrant>"}
```

## Client → server JSON messages

All are strict objects in the shipped schema:

- `open_my_web_world`: `{ type, locale? }`
- `reset_my_web_world`: `{ type, locale? }`
- `join_world`: `{ type, worldId, subscriptionKinds?, locale?, attachHuman? }`
- `leave_world`: `{ type }`
- `mount_cartridge`: `{ type, cartridgeId, requestId, params? }`
- `unmount_cartridge`: `{ type, cartridgeId, requestId }`
- `dispatch`: `{ type, actor, cartridgeId, cmd, expectedHeadVersion, requestId }`
- `advance_visibility_fence`: `{ type, cartridgeId, visibilityFenceId, version, requestId }`
- `ping`: `{ type }`
- `event`: `{ type, channel, cartridgeId?, requestId?, payload }`

## Server → client JSON messages

Required message shapes (strict parser):

```json
{
  "type":"world_joined",
  "world":{"worldId":"…","mountedCartridges":[
    {"cartridgeId":"chat","runtimes":[
      {"visibilityFenceId":"ui","visibleVersion":0,"headVersion":0,"state":{}}
    ]}
  ]},
  "session":{"isAdmin":true,"mediaGrant":"…"}
}
```

```json
{
  "type":"runtime_transition",
  "worldId":"…",
  "cartridgeId":"…",
  "version":1,
  "transition":{
    "actor":"player",
    "cmd":{"type":"…"},
    "patches":[{"op":"replace","path":"/…","value":{}}],
    "events":[{"type":"…","version":1,"index":0}]
  }
}
```

Other validated types:

- `world_created` (session contains only `isAdmin`)
- `world_left`
- `web_world_reset_ack` (requires `worldId`)
- `cartridge_mounted` and `cartridge_mounted_ack` (the ack requires `transition: "created" | "already_mounted"` and `runtimes`)
- `cartridge_unmounted` and `cartridge_unmounted_ack`
- `visibility_fence_advanced` and `visibility_fence_advanced_ack`
- `dispatch_ack`
- `event`
- `error`
- `pong` (uses `now`, not `timestamp`)

A successful committed dispatch acknowledgement requires:

```json
{
  "type":"dispatch_ack",
  "worldId":"…",
  "cartridgeId":"…",
  "requestId":"…",
  "success":true,
  "committed":true,
  "committedVersion":1,
  "headVersion":1,
  "result":{}
}
```

## Media binary frame

The public client decodes little-endian frames as:

| Offset | Size | Field |
| --- | ---: | --- |
| 0 | 1 | protocol version (`1`) |
| 1 | 1 | channel (`1`, `chatAudio`) |
| 2 | 2 | flags (`bit 0 = isComplete`) |
| 4 | 4 | sequence number |
| 8 | 4 | block ID |
| 12 | 4 | chunk ID |
| 16 | 16 | operation UUID bytes |
| 32 | 16 | message UUID bytes |
| 48 | remainder | 16-bit little-endian PCM |

## Verified runtime cartridges

The shipped client registers these cartridge contracts:

- `chat` in `NormalApp-Cn6agT0F.js`
- `codenames` in `NormalApp-Cn6agT0F.js`
- `cakeduel` in `NormalApp-Cn6agT0F.js`
- `chess` in `ChessScreen-D3ynrc3S.js`
- `pictionary` in `GameScreen-CgEXO_XJ.js`

The local backend ports their public state and command contracts. The original model/provider behavior (upstream LLM, TTS voice and any private world content) cannot be recovered from public client assets and is intentionally implemented as configurable local behavior.
