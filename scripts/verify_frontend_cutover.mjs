import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

const sourceHtml = await readFile("frontend-src/index.html", "utf8");
const publicHtml = await readFile("public/index.html", "utf8");
const statusSource = await readFile("frontend-src/migration/cutover-status.ts", "utf8");

const legacyJsPatterns = ["index-CyHAbkO5.js", "NormalApp-Cn6agT0F.js"];
const sourceExtensions = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".html"]);

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
  for (const pattern of legacyJsPatterns) {
    if (content.includes(pattern)) {
      throw new Error(`source frontend file ${path} references historical JavaScript chunk: ${pattern}`);
    }
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

console.log(`Frontend cutover gate: ${incompleteBoundaries} pending boundary/boundaries.`);
