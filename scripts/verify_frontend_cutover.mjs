import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { historicalAssetReferences } from "./frontend_asset_ownership.mjs";

const sourceHtml = await readFile("frontend-src/index.html", "utf8");
const publicHtml = await readFile("public/index.html", "utf8");
const statusSource = await readFile("frontend-src/migration/cutover-status.ts", "utf8");

const legacyJsPatterns = ["index-CyHAbkO5.js", "NormalApp-Cn6agT0F.js"];
const historicalAssets = (await readdir("public/assets")).filter((name) => /\.(?:js|css)$/.test(name));
const sourceExtensions = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".html", ".css"]);

async function collectSourceFiles(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectSourceFiles(path)));
      continue;
    }
    const extension = entry.name.slice(entry.name.lastIndexOf("."));
    if (sourceExtensions.has(extension)) files.push(path);
  }
  return files;
}

for (const path of await collectSourceFiles("frontend-src")) {
  const content = await readFile(path, "utf8");
  for (const asset of historicalAssetReferences(content, historicalAssets)) {
    throw new Error(`source frontend file ${path} references historical application asset: ${asset}`);
  }
}

if (!sourceHtml.includes("/main.tsx")) {
  throw new Error("source frontend index must boot /main.tsx");
}

const incompleteBoundaries = [...statusSource.matchAll(/complete:\s*false/g)].length;
if (incompleteBoundaries === 0) {
  for (const pattern of legacyJsPatterns) {
    if (publicHtml.includes(pattern)) {
      throw new Error(
        `all cutover boundaries are complete but public/index.html still imports ${pattern}`,
      );
    }
  }
} else if (!legacyJsPatterns.some((pattern) => publicHtml.includes(pattern))) {
  throw new Error(
    "production entry changed before the frontend cutover boundary list reached zero",
  );
}

const cssBoundaryMatch = statusSource.match(
  /id:\s*"css-ownership"[\s\S]*?complete:\s*(true|false)/,
);
if (!cssBoundaryMatch) throw new Error("css-ownership cutover boundary is missing");
if (cssBoundaryMatch[1] === "true" && sourceHtml.includes("index-FU-0vwSE.css")) {
  throw new Error("css-ownership is complete but the source frontend still imports legacy CSS");
}

// Self-policing: the marginal-growth ribbon is the one shipped capability the ledger
// records as unported, and a stub that merely references the baked topology assets must
// not pass silently. Passes today (nothing in frontend-src fetches them) and starts
// failing the moment a real or fake port appears.
const idleBoundaryMatch = statusSource.match(
  /id:\s*"idle-qfr"[\s\S]*?complete:\s*(true|false)/,
);
if (!idleBoundaryMatch) throw new Error("idle-qfr cutover boundary is missing");
if (idleBoundaryMatch[1] === "true") {
  for (const path of await collectSourceFiles("frontend-src")) {
    const content = await readFile(path, "utf8");
    if (/marginal-growth-cache-[a-z]+\.bin/.test(content)) {
      throw new Error(
        `idle-qfr is marked complete but ${path} references a marginal-growth cache; the shipped ribbon world must be ported before the boundary can close`,
      );
    }
  }
}

console.log(`Frontend cutover gate: ${incompleteBoundaries} pending boundary/boundaries.`);
