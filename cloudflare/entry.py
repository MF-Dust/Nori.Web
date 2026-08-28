"""Stable Cloudflare Worker entrypoint.

Wrangler's build hook populates this directory with the current Nori.Web
runtime before each dev/deploy invocation. Keeping the module root isolated
prevents tests, scraper tools, frontend binaries, and local virtual
environments from being counted against the Worker script-size limit.
"""

from worker_runtime import Default, NoriArcadeSession

__all__ = ["Default", "NoriArcadeSession"]
