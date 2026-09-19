import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { historicalAssetReferences } from "./frontend_asset_ownership.mjs";

const sourceHtml = await readFile("frontend-src/index.html", "utf8");
const publicHtml = await readFile("public/index.html", "utf8");
const statusSource = await readFile("frontend-src/migration/cutover-status.ts", "utf8");
const deploySource = await readFile("scripts/cloudflare_builds_deploy.py", "utf8");

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
const productionEntryMatch = statusSource.match(
  /id:\s*"production-entry"[\s\S]*?complete:\s*(true|false)/,
);
if (!productionEntryMatch) throw new Error("production-entry cutover boundary is missing");

if (productionEntryMatch[1] === "true") {
  const sourceDeploymentContracts = [
    "prepare_source_frontend()",
    "prepare_frontend_cutover_candidate.mjs",
    "frontend_candidate_worker_config.mjs",
    "deploy_worker(base, config=frontend_config)",
  ];
  for (const contract of sourceDeploymentContracts) {
    if (!deploySource.includes(contract)) {
      throw new Error(`production-entry is complete but the deploy wrapper is missing: ${contract}`);
    }
  }
} else if (!legacyJsPatterns.some((pattern) => publicHtml.includes(pattern))) {
  throw new Error(
    "production-entry is incomplete but public/index.html no longer provides the historical entry",
  );
}

const cssBoundaryMatch = statusSource.match(
  /id:\s*"css-ownership"[\s\S]*?complete:\s*(true|false)/,
);
if (!cssBoundaryMatch) throw new Error("css-ownership cutover boundary is missing");
if (cssBoundaryMatch[1] === "true" && sourceHtml.includes("index-FU-0vwSE.css")) {
  throw new Error("css-ownership is complete but the source frontend still imports legacy CSS");
}

console.log(`Frontend cutover gate: ${incompleteBoundaries} pending boundary/boundaries.`);
