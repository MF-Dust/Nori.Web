#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function assertPattern(source, pattern, message) {
  assert(pattern.test(source), message);
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

  const shippedContracts = [
    ["paragraph spacing", /className:\s*"mb-2 last:mb-0"/],
    ["interactive external-link style", /className:\s*"cursor-pointer underline underline-offset-2 hover:opacity-80"/],
    ["inert non-HTTP link style", /className:\s*"underline underline-offset-2"/],
    ["blockquote style", /className:\s*"my-2 border-l-2 border-current pl-3 not-italic opacity-80 last:mb-0"/],
    ["link role", /role:\s*"link"/],
    ["keyboard focus", /tabIndex:\s*0/],
    ["Enter/Space activation", /\w+\.key\s*===\s*"Enter"\s*\|\|\s*\w+\.key\s*===\s*" "/],
    ["keyboard default prevention", /\.preventDefault\(\)/],
    ["Nori browser bridge import", /from "\.\/openUrlInBrowser-[^"]+\.js"/],
  ];
  for (const [label, pattern] of shippedContracts) {
    assertPattern(
      markdownChunk.source,
      pattern,
      `shipped MarkdownMessage contract changed: ${label}`,
    );
  }

  for (const marker of [
    'className="mb-2 last:mb-0"',
    'className="cursor-pointer underline underline-offset-2 hover:opacity-80"',
    'className="underline underline-offset-2"',
    'className="my-2 border-l-2 border-current pl-3 not-italic opacity-80 last:mb-0"',
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
    messengerChunk.source.includes('import("./MarkdownMessage-') &&
      /`🤖 \$\{\w+\.body\}`/.test(messengerChunk.source) &&
      /source:\s*\w+/.test(messengerChunk.source),
    "shipped Messenger service-message MarkdownMessage wiring changed",
  );
  assert(
    sourceMessenger.includes('<MarkdownBody markdown={`🤖 ${message.body}`}') &&
      sourceMessenger.includes('className="select-text break-words italic leading-relaxed"'),
    "source Messenger service message must preserve the shipped Markdown body and wrapper",
  );

  assert(
    sourceMarkdown.includes("const token = /(\\[([^\\]]+)\\]\\(([^)\\s]+)\\)") &&
      sourceMarkdown.includes('className="underline underline-offset-2" title={href || undefined}'),
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
