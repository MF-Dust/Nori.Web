#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
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
  const messenger = await findAsset("MessengerScreen-");
  const source = await read("frontend-src/screens/messenger-shipped-surfaces.tsx");

  assert(
    /shrink-0 rounded-full outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring\/60/.test(
      messenger.source,
    ),
    `shipped Messenger avatar hover/focus contract changed in ${messenger.file}`,
  );
  assert(
    source.includes(
      'button.rounded-full:has(> img.rounded-full):hover {\n  opacity: 0.9;\n}',
    ),
    "source Messenger wrapper does not restore avatar hover opacity 0.9",
  );
  assert(
    source.includes('button.rounded-full:has(> img.rounded-full):focus-visible'),
    "source Messenger wrapper does not retain avatar focus-visible ownership",
  );

  console.log(`[ok] Messenger avatar hover/focus parity matches shipped ${messenger.file}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
