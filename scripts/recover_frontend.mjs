#!/usr/bin/env node

import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { js as beautify } from "js-beautify";
import prettier from "prettier";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function parseArgs(argv) {
  const options = {
    input: path.join(ROOT, "public", "assets"),
    output: path.join(ROOT, "recovered-src"),
    clean: true,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--input") options.input = path.resolve(argv[++index]);
    else if (arg === "--output") options.output = path.resolve(argv[++index]);
    else if (arg === "--no-clean") options.clean = false;
    else if (arg === "--help" || arg === "-h") {
      console.log(`Usage: node scripts/recover_frontend.mjs [options]\n\nOptions:\n  --input DIR     Bundle directory (default: public/assets)\n  --output DIR    Recovery output directory (default: recovered-src)\n  --no-clean      Keep files already present in the output directory\n`);
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return options;
}

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(full)));
    else out.push(full);
  }
  return out;
}

function sha256(text) {
  return createHash("sha256").update(text).digest("hex");
}

function sanitizeSourcePath(value, fallback) {
  let normalized = String(value || fallback)
    .replace(/^webpack:\/\//, "")
    .replace(/^vite:\/\//, "")
    .replace(/^file:\/\//, "")
    .replaceAll("\\", "/")
    .replace(/^\/+/, "");

  const parts = normalized.split("/").filter((part) => part && part !== "." && part !== "..");
  normalized = parts.join("/");
  return normalized || fallback;
}

async function loadSourceMap(bundlePath, source) {
  const match = source.match(/(?:\/\/[#@]\s*sourceMappingURL=([^\s]+)|\/\*[#@]\s*sourceMappingURL=([^*]+)\*\/)[\s]*$/m);
  if (!match) return null;

  const ref = (match[1] || match[2] || "").trim();
  if (!ref) return null;

  try {
    if (ref.startsWith("data:")) {
      const comma = ref.indexOf(",");
      if (comma < 0) return null;
      const metadata = ref.slice(0, comma);
      const payload = ref.slice(comma + 1);
      const decoded = metadata.includes(";base64")
        ? Buffer.from(payload, "base64").toString("utf8")
        : decodeURIComponent(payload);
      return { ref: "inline", map: JSON.parse(decoded) };
    }

    if (/^[a-z]+:\/\//i.test(ref)) {
      return { ref, skipped: "remote source maps are intentionally not fetched" };
    }

    const mapPath = path.resolve(path.dirname(bundlePath), ref);
    if (!existsSync(mapPath)) return { ref, skipped: "referenced source map is absent" };
    return { ref, map: JSON.parse(await readFile(mapPath, "utf8")) };
  } catch (error) {
    return { ref, error: error instanceof Error ? error.message : String(error) };
  }
}

async function formatJavaScript(source) {
  try {
    return await prettier.format(source, {
      parser: "babel",
      printWidth: 100,
      semi: true,
      singleQuote: false,
      trailingComma: "all",
    });
  } catch (prettierError) {
    try {
      return beautify(source, {
        indent_size: 2,
        preserve_newlines: true,
        max_preserve_newlines: 2,
        wrap_line_length: 100,
      });
    } catch {
      throw prettierError;
    }
  }
}

function extractModuleInfo(formatted) {
  const dependencies = new Set();
  const dynamicDependencies = new Set();
  const exports = new Set();
  const topLevelSymbols = new Set();
  const hints = new Set();

  for (const match of formatted.matchAll(/(?:^|\n)\s*(?:import|export)\s+(?:[\s\S]*?\s+from\s+)?["']([^"']+)["']/g)) {
    dependencies.add(match[1]);
  }
  for (const match of formatted.matchAll(/\bimport\(\s*["']([^"']+)["']\s*\)/g)) {
    dynamicDependencies.add(match[1]);
  }
  for (const match of formatted.matchAll(/\bexport\s*\{([^}]+)\}/g)) {
    for (const item of match[1].split(",")) {
      const cleaned = item.trim();
      if (!cleaned) continue;
      const alias = cleaned.split(/\s+as\s+/i).at(-1)?.trim();
      if (alias) exports.add(alias);
    }
  }
  for (const match of formatted.matchAll(/(?:^|\n)(?:export\s+)?(?:async\s+)?(?:function|class|const|let|var)\s+([A-Za-z_$][\w$]*)/g)) {
    topLevelSymbols.add(match[1]);
  }

  const stringPattern = /(["'`])((?:\\.|(?!\1)[^\\\n]){3,160})\1/g;
  for (const match of formatted.matchAll(stringPattern)) {
    const value = match[2];
    if (
      value.startsWith("/api/") ||
      value.startsWith("ws://") ||
      value.startsWith("wss://") ||
      /(?:storage|session|localStorage|sessionStorage|arcade|manifold|nori\.|live2d|cartridge|world|ticket|auth)/i.test(value)
    ) {
      hints.add(value);
    }
    if (hints.size >= 250) break;
  }

  return {
    dependencies: [...dependencies].sort(),
    dynamicDependencies: [...dynamicDependencies].sort(),
    exports: [...exports].sort(),
    topLevelSymbols: [...topLevelSymbols].sort(),
    hints: [...hints].sort(),
  };
}

async function recoverSourceMapSources(mapResult, outputRoot, chunkName) {
  const map = mapResult?.map;
  if (!map || !Array.isArray(map.sources) || !Array.isArray(map.sourcesContent)) return [];

  const recovered = [];
  for (let index = 0; index < map.sources.length; index += 1) {
    const content = map.sourcesContent[index];
    if (typeof content !== "string") continue;

    const fallback = `${chunkName}/source-${String(index).padStart(4, "0")}.js`;
    const relative = sanitizeSourcePath(map.sources[index], fallback);
    const destination = path.join(outputRoot, "original", relative);
    await mkdir(path.dirname(destination), { recursive: true });
    await writeFile(destination, content, "utf8");
    recovered.push({ source: map.sources[index], output: path.relative(outputRoot, destination) });
  }
  return recovered;
}

function markdownEscape(value) {
  return String(value).replaceAll("|", "\\|").replaceAll("\n", " ");
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (!existsSync(options.input)) throw new Error(`Bundle directory does not exist: ${options.input}`);

  if (options.clean) await rm(options.output, { recursive: true, force: true });
  await mkdir(path.join(options.output, "chunks"), { recursive: true });
  await mkdir(path.join(options.output, "reports"), { recursive: true });

  const files = (await walk(options.input)).filter((file) => file.endsWith(".js")).sort();
  const manifest = {
    generatedAt: new Date().toISOString(),
    input: path.relative(ROOT, options.input),
    output: path.relative(ROOT, options.output),
    chunks: [],
    sourceMapRecoveredFiles: 0,
  };

  for (const bundlePath of files) {
    const relativeBundle = path.relative(options.input, bundlePath).replaceAll(path.sep, "/");
    const source = await readFile(bundlePath, "utf8");
    const chunkName = path.basename(relativeBundle, ".js");
    const sourceMap = await loadSourceMap(bundlePath, source);
    const exactSources = await recoverSourceMapSources(sourceMap, options.output, chunkName);
    manifest.sourceMapRecoveredFiles += exactSources.length;

    const formatted = await formatJavaScript(source);
    const recoveredPath = path.join(options.output, "chunks", relativeBundle);
    await mkdir(path.dirname(recoveredPath), { recursive: true });
    await writeFile(
      recoveredPath,
      `/* Recovered from public/assets/${relativeBundle}.\n * This is a syntax-preserving deminified bundle chunk, not necessarily the original TS/TSX module boundary.\n */\n\n${formatted}`,
      "utf8",
    );

    const moduleInfo = extractModuleInfo(formatted);
    const report = {
      bundle: relativeBundle,
      bytes: Buffer.byteLength(source),
      sha256: sha256(source),
      sourceMap: sourceMap
        ? {
            reference: sourceMap.ref,
            recoveredFiles: exactSources.length,
            skipped: sourceMap.skipped,
            error: sourceMap.error,
          }
        : null,
      exactSources,
      ...moduleInfo,
    };

    const reportPath = path.join(options.output, "reports", `${chunkName}.json`);
    await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
    manifest.chunks.push(report);
    console.log(`[recover] ${relativeBundle}: ${report.bytes} bytes, ${moduleInfo.dependencies.length} deps, ${exactSources.length} map sources`);
  }

  manifest.chunks.sort((a, b) => b.bytes - a.bytes);
  await writeFile(path.join(options.output, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

  const rows = manifest.chunks.map((chunk) => {
    const deps = [...chunk.dependencies, ...chunk.dynamicDependencies.map((item) => `${item} (dynamic)`)].join(", ");
    return `| ${markdownEscape(chunk.bundle)} | ${chunk.bytes.toLocaleString("en-US")} | ${chunk.sourceMap?.recoveredFiles ?? 0} | ${markdownEscape(deps || "-")} |`;
  });
  const graph = `# Recovered frontend chunk graph\n\nGenerated by \`scripts/recover_frontend.mjs\`.\n\n| Chunk | Bytes | Exact source-map files | Dependencies |\n| --- | ---: | ---: | --- |\n${rows.join("\n")}\n`;
  await writeFile(path.join(options.output, "MODULE_GRAPH.md"), graph, "utf8");

  const notes = `# Frontend recovery output\n\nThis directory is generated and intentionally ignored by Git.\n\n- \`original/\` contains exact \`sourcesContent\` recovered from source maps when present.\n- \`chunks/\` contains syntax-preserving deminified JavaScript for every shipped Vite chunk.\n- \`reports/\` records imports, dynamic imports, exports, top-level symbol names, string hints and hashes.\n- \`manifest.json\` is the machine-readable recovery index.\n- \`MODULE_GRAPH.md\` is the first-pass chunk dependency graph.\n\nWhen no source map is present, JavaScript semantics can be recovered but original TypeScript types, comments, file boundaries and pre-minification local identifier names are not uniquely recoverable from the bundle alone. Use the generated reports as the basis for the second-pass component/Hook/store renaming work.\n`;
  await writeFile(path.join(options.output, "README.md"), notes, "utf8");

  console.log(`\nRecovered ${manifest.chunks.length} JavaScript chunks into ${options.output}`);
  console.log(`Exact source-map source files recovered: ${manifest.sourceMapRecoveredFiles}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
