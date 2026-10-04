# Security and performance notes

Nori.Web's local compatibility authentication is not production authentication.
Guest identity separates browser worlds; it does not verify a person's identity.

## Signing key

Guest cookies and Arcade tickets use `SECRET_KEY`. The former public fallback
key must not be used: anyone who knows a signing key can forge identities.

For local development, an absent, empty, or whitespace-only `SECRET_KEY` gets a
fresh cryptographically random key when configuration loads. This key is not
persisted. Restarting the process invalidates its signed cookies and tickets;
independently started processes will not share identities. To retain identities
across restarts or share them across processes, securely provision the same
explicit nonblank `SECRET_KEY`. Explicit keys are used verbatim. Keep the key
out of source control, and rotate any previously public key.

Cloudflare must have a nonblank `SECRET_KEY` secret binding (for example, set it
with `npx wrangler secret put SECRET_KEY` for the intended deployment), or an
explicit process environment value. Provision the same secret for the Worker
and its Durable Objects so tickets and cookies validate across isolates.
Runtime bindings take precedence; a blank binding is rejected. Missing or blank
configuration fails rather than using the local random fallback or a previous
request's key. Rotating the key invalidates existing signed cookies and tickets.

## Development-only email OTP

Email OTP is disabled unless `NORI_DEV_OTP` is explicitly set to a nonblank code
in the process environment. There is no email delivery implementation and no
proof of email ownership. Anyone who knows the configured development code can
request an OTP for an email and log in as that address. Do not enable this mode
on a public deployment or treat it as production authentication.

When enabled, the send endpoint records the configured code for the normalized
email address for ten minutes. Verification requires that issuance, rejects
expired codes, and consumes a successful code once. There is no default
`123456` bypass. Users, OTPs, and authenticated sessions are process-local memory,
not durable or shared across Cloudflare isolates.

Signing out removes the presented authenticated token from the process-local
session store and clears the browser cookie. It does not revoke stateless guest cookies
or already issued Arcade tickets; those remain governed by their expiry and
signing key. Automatic guest access can create a new guest after logout.

## Browser and upstream boundaries

HTTP API and Arcade main/media WebSocket requests with an `Origin` header must
match the request's scheme, host, and port. Opaque (`null`) and foreign origins
are rejected before session creation or routing, including Cloudflare's Convex
fast paths. Native clients without `Origin` remain supported. The Vite API
proxy preserves Host; reverse proxies must preserve the public Host and supply
the correct scheme through the server's trusted proxy configuration.

This is browser-origin protection, not authentication or a public-access gate.
Keep the local server on loopback, or add deployment-level access control for
private installations. Local AI/TTS provider URLs (including GPT-SoVITS on
127.0.0.1) remain intentionally supported. Public guest deployments still need
appropriate access, usage, and outbound-network controls; do not expose a
private network or a server-funded provider key through an unrestricted demo.

TTS responses are streamed with an 8 MiB decoded audio limit, a 16 MiB + 64 KiB
JSON-envelope limit for encoded audio, and a 64 KiB error-body cap. Oversized
success responses stop reading rather than buffering the entire upstream body.
The limit is on accepted content, not a guarantee on total process memory.

## Performance and recovered frontend

Developer story jumps validate at most 1024 non-empty fact IDs of at most 256
characters before mutation, then commit and broadcast the batch once. Single
fact commands and per-fact events retain their existing behavior.

Local gzip uses level 6 instead of 9. A three-run compression-only sample on
`public/assets/NormalApp-Cn6agT0F.js` measured median 138.65 ms versus 354.65 ms,
with 862,632 versus 854,684 compressed bytes. These are local compression
measurements, not end-to-end latency or Cloudflare performance claims.

The recovered source frontend validates canonical same-origin `/webAssets/`
paths before its iframe asset bridge fetches them. Its Markdown link scanner
also avoids quadratic work on unmatched opening brackets. These changes are
in `frontend-src/`; the historical bundle served by `public/index.html` was not
rebuilt or switched over by this audit.

## Regression checks

- `npm run test:rust`: Rust core, local service, and Worker regressions, including
  authentication, guest isolation, request origins, providers, persistence, and
  static delivery. The retired Python runtime tests are available in Git history.
- `npm run frontend:runtime:test`: recovered frontend bridge and Markdown cases.
- `npm audit --registry=https://registry.npmjs.org`: JavaScript dependency audit.
  The vulnerable development-only transitive `brace-expansion` was updated from
  5.0.9 to 5.0.12 without unrelated dependency upgrades.
