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
  const model = await read("frontend-src/apps/messenger.ts");
  const interactions = await read("frontend-src/apps/messenger-interactions.ts");
  const storyClock = await read("frontend-src/apps/signal-story-clock.ts");
  const backend = await read("backend/services/event_dispatcher.py");
  const sourceApp = await read("frontend-src/source-app.tsx");

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
    [
      "mobile thread-pane slide completion",
      /className:\s*"flex h-full w-\[200%\]"[\s\S]{0,180}initial:\s*!1[\s\S]{0,180}animate:\s*\{\s*x:\s*[^}]+\}[\s\S]{0,220}transition:\s*\{\s*type:\s*"tween",\s*duration:\s*0\.25,\s*ease:\s*\[0\.32,\s*0\.72,\s*0,\s*1\]\s*\}[\s\S]{0,220}onAnimationComplete:/,
    ],
    [
      "thread search translucent surface binding",
      /rounded-md border px-2\.5 py-1\.5 transition-shadow focus-within:ring-1 focus-within:ring-ring\/40"[\s\S]{0,80}style: F/,
    ],
    [
      "service composer translucent surface binding",
      /rounded-2xl border px-3 py-2 transition-shadow focus-within:ring-1 focus-within:ring-ring\/40"[\s\S]{0,80}style: F/,
    ],
    [
      "sealed composer translucent surface binding",
      /rounded-2xl border px-3 py-2"[\s\S]{0,80}style: F/,
    ],
    [
      "typing bubble incoming surface binding",
      /rounded-bl-sm border px-3\.5 py-2\.5 text-secondary-foreground shadow-sm"[\s\S]{0,100}style:\s*L[\s\S]{0,360}signal\.conversation\.typing/,
    ],
    [
      "sealed composer alert enter/exit choreography",
      /initial:\s*\{\s*opacity:\s*0,\s*y:\s*8\s*\}[\s\S]{0,220}animate:\s*\{\s*opacity:\s*1,\s*y:\s*0\s*\}[\s\S]{0,220}exit:\s*\{\s*opacity:\s*0,\s*y:\s*8\s*\}[\s\S]{0,220}transition:\s*\{\s*duration:\s*0\.18,\s*ease:\s*\[0\.32,\s*0\.72,\s*0,\s*1\]\s*\}/,
    ],
    [
      "sealed composer details disclosure choreography",
      /initial:\s*\{\s*height:\s*0,\s*opacity:\s*0\s*\}[\s\S]{0,180}animate:\s*\{\s*height:\s*"auto",\s*opacity:\s*1\s*\}[\s\S]{0,180}exit:\s*\{\s*height:\s*0,\s*opacity:\s*0\s*\}[\s\S]{0,180}transition:\s*\{\s*duration:\s*0\.16\s*\}/,
    ],
    [
      "sealed composer details chevrons",
      /signal\.composer\.details[\s\S]{0,260}className:\s*"size-3"[\s\S]{0,180}className:\s*"size-3"/,
    ],
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

  assertPattern(
    normalApp,
    /background:\s*"color-mix\(in oklab, var\(--background\) 60%, transparent\)"[\s\S]{0,140}borderColor:\s*"color-mix\(in oklab, var\(--secondary-foreground\) 12%, transparent\)"/,
    "shipped Messenger input-surface palette changed",
  );

  for (const [label, pattern] of [
    [
      "thread unread/reread metadata",
      /unread_from[\s\S]{0,120}read_fact[\s\S]{0,120}reread/,
    ],
    [
      "thread reread trigger",
      /reread !== void 0[\s\S]{0,120}\.has\(t\.reread\.when\)[\s\S]{0,160}reread\.readFact/,
    ],
    [
      "thread recency ordering",
      /\.sort\(\(s, o\) => \(s\.last && o\.last \? SY\(o\.last, s\.last\)/,
    ],
    [
      "thread timestamp numeric month/day",
      /toLocaleDateString\(void 0, \{ month: "numeric", day: "numeric" \}\)/,
    ],
    [
      "message date long month/day",
      /toLocaleDateString\(void 0, \{ month: "long", day: "numeric" \}\)/,
    ],
    [
      "timestamp-less message group continuation",
      /s && \(i === "" \|\| i === s\.key\)/,
    ],
    [
      "story calendar clock",
      /oY = 2026,[\s\S]{0,80}aY = 7,[\s\S]{0,80}lY = 31;[\s\S]{0,120}function Ga\(\)/,
    ],
    [
      "Signal Dock unread badge",
      /function EHe\([\s\S]{0,420}reduce\(\(i, s\) => i \+ s\.unreadCount, 0\)[\s\S]{0,520}Ny\("signal", i\)/,
    ],
    [
      "shared local read facts",
      /localReadByFactId[\s\S]{0,180}markReadLocal[\s\S]{0,180}localReadByFactId/,
    ],
    [
      "fallback avatar palette",
      /oklch\(0\.55 0\.10 200\)[\s\S]{0,360}oklch\(0\.52 0\.05 240\)/,
    ],
    [
      "fallback avatar FNV-1a hash",
      /2166136261[\s\S]{0,180}Math\.imul\(e, 16777619\)[\s\S]{0,160}>>> 0/,
    ],
    [
      "fallback avatar initial",
      /trim\(\)\.slice\(0, 1\)\.toUpperCase\(\) \|\| "\?"/,
    ],
  ]) {
    assertPattern(
      normalApp,
      pattern,
      `shipped Signal runtime contract changed: ${label}`,
    );
  }

  for (const marker of [
    "data-messenger-shipped-surfaces",
    "color-mix(in oklab, var(--secondary-foreground) 10%, var(--secondary))",
    "color-mix(in oklab, var(--secondary-foreground) 16%, transparent)",
    ".flex.justify-start > .flex.items-center.rounded-2xl.rounded-bl-sm.border.shadow-sm",
    "0 1px 2px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.18)",
    "header + div > div.rounded-md.border",
    "div.relative.shrink-0.border-t",
    "> div.flex.items-end",
    "> div.min-w-0.flex-1.items-center.rounded-2xl.border",
    "color-mix(in oklab, var(--background) 60%, transparent)",
    "color-mix(in oklab, var(--secondary-foreground) 12%, transparent)",
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
    "MESSENGER_SEALED_ERROR_TRANSITION_MS = 180",
    "MESSENGER_SEALED_DETAILS_TRANSITION_MS = 160",
    'MESSENGER_SEALED_ERROR_EASING = "cubic-bezier(0.32, 0.72, 0, 1)"',
    "messenger-sealed-error-enter",
    "messenger-sealed-error-exit",
    "messenger-sealed-details-enter",
    "messenger-sealed-details-exit",
    "data-messenger-sealed-details-button",
    'expanded ? "m18 15-6-6-6 6" : "m6 9 6 6 6-6"',
    "MutationObserver",
    "details.scrollHeight",
    "onClickCapture={handleSealedComposerClickCapture}",
    "handleMobileTrackTransitionEndCapture",
    'target.classList.contains("w-[200%]")',
    'event.propertyName === "transform"',
    "onTransitionEndCapture={handleMobileTrackTransitionEndCapture}",
  ]) {
    assert(source.includes(marker), `source Messenger shipped-surface recovery missing marker: ${marker}`);
  }

  for (const marker of [
    "signalAvatarColor(seed ?? title)",
    "signalAvatarInitial(title)",
    'aria-current={selected ? "true" : undefined}',
    "active:bg-primary/[0.24]",
    "active:bg-muted/60",
    "focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/60",
    "hover:opacity-95 focus-visible:ring-2 focus-visible:ring-ring/60",
    "invisible ml-2 inline-flex select-none items-center gap-1 text-[10px]",
    "pointer-events-none absolute bottom-2 right-3.5 flex items-center gap-1 text-[10px]",
    'message.sender !== "我"',
    "signalThreadReadState",
    "compareSignalConversationRecency",
    "view.pendingReadFacts.length > 0",
    "localReadFactsStore.mark(pendingFacts)",
    "border-b border-border/50 border-l-2 border-l-transparent",
    "min-w-0 flex-1",
    "flex items-center gap-2 rounded-md border px-2.5 py-1.5 transition-shadow focus-within:ring-1 focus-within:ring-ring/40",
    "flex min-w-0 flex-1 items-center gap-2 rounded-2xl border px-3 py-2 transition-shadow focus-within:ring-1 focus-within:ring-ring/40",
    'className="flex min-w-0 flex-1 items-center gap-2 rounded-2xl border px-3 py-2"',
    "flex items-center gap-1.5 rounded-2xl rounded-bl-sm border px-3.5 py-2.5 text-secondary-foreground shadow-sm",
    'role="alert"',
    "SEALED_ERROR_CODE",
    'SEALED_ERROR_DETAILS.join("\\n")',
    'className="flex h-full w-[200%]"',
    'transition: "transform 250ms cubic-bezier(0.32,0.72,0,1)"',
    "onTransitionEnd={() => {",
    "if (!opened) setRetainedThreadId(null);",
  ]) {
    assert(
      baseSource.includes(marker),
      `Messenger structure changed under shipped-surface recovery: ${marker}`,
    );
  }

  assert(
    binding.includes('from "../screens/messenger-shipped-surfaces"'),
    "production Signal binding does not use the source-owned shipped-surface wrapper",
  );

  for (const marker of [
    "unreadFrom?: string",
    "readFact?: string",
    "reread?: SignalThreadReread",
    "normalizeThreadReread",
    "SIGNAL_MESSAGE_KINDS",
    "if (!threadId || !title) return undefined",
    "if (!threadId || !messageId || !sender) return undefined",
    'SIGNAL_MESSAGE_KINDS.has(rawKind) ? rawKind : "text"',
    "self: sender === SIGNAL_SELF_SENDER",
    "width !== undefined && height !== undefined",
    "rawSize !== undefined && rawSize > 0",
  ]) {
    assert(model.includes(marker), `Signal model is missing shipped thread metadata: ${marker}`);
  }
  for (const marker of [
    "signalAvatarInitial",
    "signalAvatarColor",
    "2166136261",
    "Math.imul(hash, 16777619)",
    "formatSignalThreadTimestamp",
    "groupSignalMessages",
    "month: \"numeric\"",
    "month: \"long\"",
    "signalThreadReadState",
    "pendingReadFacts",
    "rereadEligibleCount",
    "compareSignalConversationRecency",
    "createSignalLocalReadFactsStore",
  ]) {
    assert(interactions.includes(marker), `Signal read-state recovery missing marker: ${marker}`);
  }
  for (const marker of [
    "STORY_YEAR = 2026",
    "STORY_MONTH_INDEX = 7",
    "STORY_DAY = 31",
    "parseSignalTimestamp",
  ]) {
    assert(storyClock.includes(marker), `Signal story-clock recovery missing marker: ${marker}`);
  }
  assert(
    backend.includes('if command == "signal.read":') &&
      backend.includes('"source": "signal.read"') &&
      backend.includes('reread.get("read_fact")'),
    "local backend does not persist shipped Signal read/reread facts",
  );
  assert(
    sourceApp.includes("signalConversationUnreadCount") &&
      sourceApp.includes("createSignalLocalReadFactsStore") &&
      sourceApp.includes("source.signalLocalReadFacts.snapshot()") &&
      sourceApp.includes('appId === "signal" ? signalUnreadCount : 0') &&
      sourceApp.includes("getDockBadgeCount"),
    "source shell does not wire the shipped Signal unread count into the Dock badge",
  );

  console.log(
    `[ok] Messenger read/reread state, Dock badge, story clock, bubbles, photo focus, thread rows, mobile slide completion, translucent inputs and sealed-composer choreography match shipped ${messengerChunk.file}`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
