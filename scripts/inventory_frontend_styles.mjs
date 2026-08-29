#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import beautifyPackage from "js-beautify";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ASSET_DIR = path.join(ROOT, "public", "assets");
const OUTPUT = path.resolve(ROOT, process.argv[2] || ".frontend-recovery");
const metadataOnly = process.argv.includes("--metadata-only");
const beautifyCss = beautifyPackage.css ?? beautifyPackage.css_beautify ?? beautifyPackage.default;

function uniq(values) { return [...new Set(values)].sort(); }
function sha256(text) { return crypto.createHash("sha256").update(text).digest("hex"); }

function analyzeCss(file, text) {
  const selectors = uniq([...text.matchAll(/(?:^|})\s*([^@{}][^{}]*)\{/gms)].flatMap((match) => match[1].split(",").map((value) => value.trim()).filter(Boolean)));
  const variables = uniq([...text.matchAll(/(--[A-Za-z0-9_-]+)\s*:/g)].map((match) => match[1]));
  const assetUrls = uniq([...text.matchAll(/url\((?:['"])?([^)'"]+)(?:['"])?\)/g)].map((match) => match[1]));
  const mediaQueries = uniq([...text.matchAll(/@media\s*([^\{]+)/g)].map((match) => match[1].trim()));
  const keyframes = uniq([...text.matchAll(/@keyframes\s+([A-Za-z0-9_-]+)/g)].map((match) => match[1]));
  return { file, bytes: Buffer.byteLength(text), sha256: sha256(text), selectors, variables, assetUrls, mediaQueries, keyframes };
}

async function main() {
  const files = (await fs.readdir(ASSET_DIR)).filter((file) => file.endsWith(".css")).sort();
  const prettyDir = path.join(OUTPUT, "pretty", "assets");
  if (!metadataOnly) await fs.mkdir(prettyDir, { recursive: true });
  const records = [];
  for (const file of files) {
    const text = await fs.readFile(path.join(ASSET_DIR, file), "utf8");
    records.push(analyzeCss(file, text));
    if (!metadataOnly) {
      await fs.writeFile(path.join(prettyDir, file), beautifyCss(text, { indent_size: 2, end_with_newline: true }), "utf8");
    }
  }
  await fs.writeFile(path.join(OUTPUT, "style-manifest.json"), `${JSON.stringify({ count: records.length, styles: records }, null, 2)}\n`, "utf8");
  const lines = ["# Frontend style map", "", `Analyzed ${records.length} shipped CSS chunks.`, ""];
  for (const record of records) {
    lines.push(`## ${record.file}`, "", `- bytes: ${record.bytes}`, `- selectors: ${record.selectors.length}`, `- CSS variables: ${record.variables.length}`, `- asset URLs: ${record.assetUrls.length}`, `- media queries: ${record.mediaQueries.length}`, `- keyframes: ${record.keyframes.length}`, "");
  }
  await fs.writeFile(path.join(OUTPUT, "STYLE_MAP.md"), `${lines.join("\n")}\n`, "utf8");
  console.log(`[frontend-styles] inventoried ${records.length} CSS chunks`);
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
