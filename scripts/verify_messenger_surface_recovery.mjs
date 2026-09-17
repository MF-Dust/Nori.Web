#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function read(relativePath) {
  return fs.readFile(path.join(ROOT, relativePath), "utf8");
}

async function findAsset(prefix) {
  const assets = await fs.readdir(path.join(ROOT, "public", "assets"));
  const file = assets.find((name) => name.startsWith(prefix) && name.endsWith(".js"));
  assert(file, `missing shipped ${prefix}* chunk`);
  return { file, source: await read(path.join("public", "assets", file)) };
}

function assertPattern(source, pattern, message) {
  assert(pattern.test(source), message);
}

async function main() {
  const messengerChunk = await findAsset("MessengerScreen-");
  const source = await read("frontend-src/screens/messenger-shipped-surfaces.tsx");
  const baseSource = await read("frontend-src/screens/messenger-screen.tsx");
  const binding = await read("frontend-src/apps/signal-presentation.tsx");

  const normalAppImport = messengerChunk.source.match(/from "\.\/(NormalApp-[^"]+\.js)"/);
  assert(normalAppImport, "shipped Messenger no longer imports NormalApp runtime contracts");
  const normalApp = await read(path.join("public", "assets", normalAppImport[1]));

  for (const [label, pattern] of [
    ["incoming image surface", /rounded-bl-sm border shadow-sm/],
    [
      "outgoing image surface",
      /rounded-br-sm bg-primary shadow-\[0_1px_2px_rgba\(0,0,0,0\.12\),inset_0_1px_0_rgba\(255,255,255,0\.18\)\]/,
    ],
    [
      "image keyboard focus",
      /cursor-zoom-in outline-none transition-opacity hover:opacity-95 focus-visible:ring-2 focus-visible:ring-ring\/60/,
    ],
    ["thread row transition timing", /transition-colors duration-150/],
    [
      "thread row keyboard focus",
      /outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring\/60/,
    ],
    [
      "selected thread hover and active states",
      /border-l-primary bg-primary\/\[0\.12\] hover:bg-primary\/\[0\.18\] active:bg-primary\/\[0\.24\]/,
    ],
    ["unselected thread active state", /hover:bg-muted\/40 active:bg-muted\/60/],
    ["selected read timestamp tone", /text-foreground\/70/],
    ["selected read preview tone", /text-foreground\/80/],
  ]) {
    assertPattern(
      messengerChunk.source,
      pattern,
      `shipped Messenger surface contract changed: ${label}`,
    );
  }

  assertPattern(
    normalApp,
    /background:\s*"color-mix\(in oklab, var\(--secondary-foreground\) 10%, var\(--secondary\)\)"[\s\S]{0,140}borderColor:\s*"color-mix\(in oklab, var\(--secondary-foreground\) 16%, transparent\)"/,
    "shipped incoming Messenger surface palette changed",
  );

  for (const marker of [
    "data-messenger-shipped-surfaces",
    "color-mix(in oklab, var(--secondary-foreground) 10%, var(--secondary))",
    "color-mix(in oklab, var(--secondary-foreground) 16%, transparent)",
    "0 1px 2px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.18)",
    "button.cursor-zoom-in:focus-visible",
    "button.rounded-full:has(> img.rounded-full):focus-visible",
    "color-mix(in oklab, var(--ring) 60%, transparent)",
    "button.w-full.border-b.border-l-2",
    "border-bottom-color: color-mix(in oklab, var(--border) 50%, transparent)",
    "transition-duration: 150ms",
    "box-shadow: inset 0 0 0 2px color-mix(in oklab, var(--ring) 60%, transparent)",
    '[aria-current="true"]:hover',
    "color-mix(in oklab, var(--primary) 18%, transparent)",
    '[aria-current="true"]:active',
    "color-mix(in oklab, var(--primary) 24%, transparent)",
    ':not([aria-current="true"]):active',
    "color-mix(in oklab, var(--muted) 60%, transparent)",
    ':not(:has(span[aria-label]))',
    "color-mix(in oklab, var(--foreground) 70%, transparent)",
    "color-mix(in oklab, var(--foreground) 80%, transparent)",
  ]) {
    assert(source.includes(marker), `source Messenger shipped-surface recovery missing marker: ${marker}`);
  }

  for (const marker of [
    'aria-current={selected ? "true" : undefined}',
    "border-b border-l-2",
    "min-w-0 flex-1",
  ]) {
    assert(
      baseSource.includes(marker),
      `Messenger thread-row structure changed under shipped-surface recovery: ${marker}`,
    );
  }

  assert(
    binding.includes('from "../screens/messenger-shipped-surfaces"'),
    "production Signal binding does not use the source-owned shipped-surface wrapper",
  );

  console.log(
    `[ok] Messenger bubbles, photo focus and thread-row interaction states match shipped ${messengerChunk.file}`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
