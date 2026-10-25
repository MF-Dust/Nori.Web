import assert from "node:assert/strict";
import { createServer } from "node:http";
import { build } from "esbuild";
import { chromium } from "playwright";
import { probeLaunchOptions } from "../lib/probe_launch.mjs";

/** Connects two real RTCPeerConnections through the multiplayer invite/reply codes. */
const compiled = await build({
  entryPoints: ["tests/frontend/harness/frontend-multiplayer-webrtc.ts"], bundle: true, write: false,
  outfile: "probe.js", format: "esm",
});
const script = compiled.outputFiles[0].contents;
const server = createServer((req, res) => {
  if (req.url === "/probe.js") { res.setHeader("Content-Type", "text/javascript"); res.end(script); return; }
  res.setHeader("Content-Type", "text/html");
  res.end('<!doctype html><meta charset="utf-8"><script type="module" src="/probe.js"></script>');
});
await new Promise((done) => server.listen(0, "127.0.0.1", done));
let browser;
try {
  browser = await chromium.launch(probeLaunchOptions());
  const page = await browser.newPage();
  await page.goto(`http://127.0.0.1:${server.address().port}/`);
  await page.waitForFunction(() => typeof window.loopback === "function");
  const result = await page.evaluate(() => window.loopback());
  assert.equal(result.message, JSON.stringify({ t: "ping", at: 1 }));
  assert.equal(result.hostRoute, "direct");
  assert.equal(result.guestRoute, "direct");
  console.log(`PASS: WebRTC invite/reply loopback, direct route, invite code ${result.inviteLength} chars`);
} finally {
  await browser?.close();
  server.close();
}
