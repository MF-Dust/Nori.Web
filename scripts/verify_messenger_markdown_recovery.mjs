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

async function main() {
  const markdownChunk = await findAsset("MarkdownMessage-");
  const messengerChunk = await findAsset("MessengerScreen-");
  const sourceMarkdown = await read("frontend-src/components/markdown-body.tsx");
  const sourceMessenger = await read("frontend-src/screens/messenger-screen.tsx");

  for (const marker of [
    'className: "text-base"',
    'className: "leading-relaxed [&:not(:last-child)]:mb-2"',
    'className: "underline cursor-pointer hover:opacity-80"',
    'className: "underline"',
    'className: "border-l-2 border-white/30 pl-3 my-2 italic opacity-90"',
    'role: "link"',
    "tabIndex: 0",
    'l.key === "Enter" || l.key === " "',
    "l.preventDefault()",
    "window.NoriAPI?.openUrlInBrowser(s)",
  ]) {
    assert(
      markdownChunk.source.includes(marker),
      `shipped MarkdownMessage contract changed: ${marker}`,
    );
  }

  for (const marker of [
    'className="text-base"',
    'className="leading-relaxed [&:not(:last-child)]:mb-2"',
    'className="underline cursor-pointer hover:opacity-80"',
    'className="underline"',
    'className="border-l-2 border-white/30 pl-3 my-2 italic opacity-90"',
    'role="link"',
    "tabIndex={0}",
    'event.key === "Enter" || event.key === " "',
    "event.preventDefault()",
    "NoriAPI?.openUrlInBrowser?.(url)",
    "/^https?:\\/\\//i.test(href)",
  ]) {
    assert(
      sourceMarkdown.includes(marker),
      `source Messenger markdown recovery missing marker: ${marker}`,
    );
  }

  assert(
    messengerChunk.source.includes('const u = `🤖 ${t.body}`') &&
      messengerChunk.source.includes("source: u"),
    "shipped Messenger service-message MarkdownMessage wiring changed",
  );
  assert(
    sourceMessenger.includes('<MarkdownBody markdown={`🤖 ${message.body}`}') &&
      sourceMessenger.includes('className="select-text break-words italic leading-relaxed"'),
    "source Messenger service message must preserve the shipped Markdown body and wrapper",
  );

  assert(
    sourceMarkdown.includes("const token = /(\\[([^\\]]+)\\]\\(([^)\\s]+)\\)") &&
      sourceMarkdown.includes('<span key={key++} className="underline">'),
    "source Messenger markdown must parse non-HTTP markdown links and keep them inert",
  );

  console.log(
    `[ok] Messenger service markdown matches shipped ${markdownChunk.file} presentation and link contracts`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
