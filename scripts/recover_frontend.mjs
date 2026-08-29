#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import beautifyPackage from "js-beautify";
import ts from "typescript";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ASSET_DIR = path.join(ROOT, "public", "assets");
const DEFAULT_OUTPUT = path.join(ROOT, ".frontend-recovery");
const beautifyJs =
  beautifyPackage.js ?? beautifyPackage.js_beautify ?? beautifyPackage.default ?? beautifyPackage;

function parseArgs(argv) {
  const args = { output: DEFAULT_OUTPUT, metadataOnly: false };
  for (let i = 0; i < argv.length; i += 1) {
    const value = argv[i];
    if (value === "--metadata-only") {
      args.metadataOnly = true;
    } else if (value === "--output") {
      const next = argv[i + 1];
      if (!next) throw new Error("--output requires a directory");
      args.output = path.resolve(ROOT, next);
      i += 1;
    } else if (value === "--help" || value === "-h") {
      console.log(`Usage: node scripts/recover_frontend.mjs [options]\n\nOptions:\n  --output <dir>     Output directory (default: .frontend-recovery)\n  --metadata-only    Skip writing beautified bundle copies\n`);
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${value}`);
    }
  }
  return args;
}

function uniq(values) {
  return [...new Set(values)].sort();
}

function sha256(text) {
  return crypto.createHash("sha256").update(text).digest("hex");
}

function literalText(node) {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  return null;
}

function hasExportModifier(node) {
  return Boolean(node.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword));
}

function nodeName(node) {
  if (node.name && ts.isIdentifier(node.name)) return node.name.text;
  return null;
}

function isStorageCallLiteral(node) {
  const parent = node.parent;
  if (!parent || !ts.isCallExpression(parent) || parent.arguments[0] !== node) return null;
  const expression = parent.expression;
  if (!ts.isPropertyAccessExpression(expression)) return null;
  const method = expression.name.text;
  if (!["getItem", "setItem", "removeItem"].includes(method)) return null;
  const owner = expression.expression.getText();
  if (owner !== "localStorage" && owner !== "sessionStorage") return null;
  return `${owner}.${method}`;
}

function analyzeSource(fileName, sourceText) {
  const sourceFile = ts.createSourceFile(
    fileName,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.JS,
  );

  const staticImports = [];
  const dynamicImports = [];
  const reexports = [];
  const exports = [];
  const apiPaths = [];
  const externalUrls = [];
  const assetReferences = [];
  const storageKeys = [];
  const protocolStrings = [];

  const visit = (node) => {
    if (ts.isImportDeclaration(node)) {
      const specifier = literalText(node.moduleSpecifier);
      if (specifier) staticImports.push(specifier);
    }

    if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword) {
      const specifier = literalText(node.arguments[0]);
      if (specifier) dynamicImports.push(specifier);
    }

    if (ts.isExportDeclaration(node)) {
      const specifier = node.moduleSpecifier ? literalText(node.moduleSpecifier) : null;
      if (specifier) reexports.push(specifier);
      if (node.exportClause && ts.isNamedExports(node.exportClause)) {
        for (const element of node.exportClause.elements) exports.push(element.name.text);
      }
    } else if (ts.isExportAssignment(node)) {
      exports.push("default");
    } else if (hasExportModifier(node)) {
      const name = nodeName(node);
      if (name) exports.push(name);
      if (node.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.DefaultKeyword)) {
        exports.push("default");
      }
    }

    const value = literalText(node);
    if (value !== null) {
      if (value.startsWith("/api/")) apiPaths.push(value);
      if (/^https?:\/\//i.test(value)) externalUrls.push(value);
      if (/^(?:\.\/)?assets\/.*\.(?:js|css)$/i.test(value)) assetReferences.push(value);

      const storageCall = isStorageCallLiteral(node);
      if (storageCall) storageKeys.push(`${storageCall}:${value}`);

      if (
        /^(?:nori|manifold|arcade|chat|auth|signal|mail|browser|files|terminal|pictionary|codenames|chess|cake)[.:/]/i.test(
          value,
        )
      ) {
        protocolStrings.push(value);
      }
    }

    ts.forEachChild(node, visit);
  };

  visit(sourceFile);

  return {
    staticImports: uniq(staticImports),
    dynamicImports: uniq(dynamicImports),
    reexports: uniq(reexports),
    exports: uniq(exports),
    apiPaths: uniq(apiPaths),
    externalUrls: uniq(externalUrls),
    assetReferences: uniq(assetReferences),
    storageKeys: uniq(storageKeys),
    protocolStrings: uniq(protocolStrings),
    hasSourceMapReference: /[#@]\s*sourceMappingURL\s*=/.test(sourceText),
  };
}

function chunkLabel(fileName) {
  return fileName.replace(/-[A-Za-z0-9_]+\.js$/, "").replace(/\.js$/, "");
}

function markdownTable(rows) {
  if (!rows.length) return "_None detected._\n";
  return [
    "| Chunk | Bytes | Static imports | Dynamic imports | API paths |",
    "| --- | ---: | ---: | ---: | ---: |",
    ...rows.map(
      (row) =>
        `| \`${row.file}\` | ${row.bytes} | ${row.staticImports.length} | ${row.dynamicImports.length} | ${row.apiPaths.length} |`,
    ),
    "",
  ].join("\n");
}

function section(title, values) {
  const body = values.length ? values.map((value) => `- \`${value}\``).join("\n") : "_None detected._";
  return `## ${title}\n\n${body}\n`;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const files = (await fs.readdir(ASSET_DIR))
    .filter((name) => name.endsWith(".js"))
    .sort();

  await fs.rm(args.output, { recursive: true, force: true });
  await fs.mkdir(args.output, { recursive: true });
  if (!args.metadataOnly) await fs.mkdir(path.join(args.output, "pretty", "assets"), { recursive: true });

  const chunks = [];
  for (const file of files) {
    const sourcePath = path.join(ASSET_DIR, file);
    const sourceText = await fs.readFile(sourcePath, "utf8");
    const analysis = analyzeSource(file, sourceText);
    const record = {
      file,
      label: chunkLabel(file),
      bytes: Buffer.byteLength(sourceText),
      sha256: sha256(sourceText),
      ...analysis,
    };
    chunks.push(record);

    if (!args.metadataOnly) {
      const pretty = beautifyJs(sourceText, {
        indent_size: 2,
        indent_char: " ",
        preserve_newlines: true,
        max_preserve_newlines: 2,
        brace_style: "collapse",
        end_with_newline: true,
      });
      await fs.writeFile(path.join(args.output, "pretty", "assets", file), pretty, "utf8");
    }
  }

  const allApiPaths = uniq(chunks.flatMap((chunk) => chunk.apiPaths));
  const allStorageKeys = uniq(chunks.flatMap((chunk) => chunk.storageKeys));
  const allProtocolStrings = uniq(chunks.flatMap((chunk) => chunk.protocolStrings));
  const allExternalUrls = uniq(chunks.flatMap((chunk) => chunk.externalUrls));
  const sourceMapped = chunks.filter((chunk) => chunk.hasSourceMapReference).map((chunk) => chunk.file);

  const manifest = {
    generatedAt: new Date().toISOString(),
    sourceDirectory: "public/assets",
    bundleCount: chunks.length,
    sourceMapsDetected: sourceMapped,
    note:
      "This is structural recovery metadata derived from shipped bundles. It is not the original TypeScript/TSX source tree.",
    chunks,
    aggregate: {
      apiPaths: allApiPaths,
      storageKeys: allStorageKeys,
      protocolStrings: allProtocolStrings,
      externalUrls: allExternalUrls,
    },
  };

  await fs.writeFile(
    path.join(args.output, "manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
    "utf8",
  );

  const moduleMap = [
    "# Frontend recovery module map",
    "",
    `Analyzed ${chunks.length} shipped JavaScript chunks from \`public/assets\`.`,
    "",
    sourceMapped.length
      ? `Source map references were detected in: ${sourceMapped.map((name) => `\`${name}\``).join(", ")}.`
      : "No source-map references were detected. Exact original identifiers, comments, TS types, and source paths cannot be reconstructed reliably.",
    "",
    markdownTable(chunks),
    section("Detected API paths", allApiPaths),
    section("Detected browser storage keys", allStorageKeys),
    section("Detected protocol/event strings", allProtocolStrings),
    section("Detected external URLs", allExternalUrls),
  ].join("\n");
  await fs.writeFile(path.join(args.output, "MODULE_MAP.md"), moduleMap, "utf8");

  const graph = Object.fromEntries(
    chunks.map((chunk) => [
      chunk.file,
      uniq([...chunk.staticImports, ...chunk.dynamicImports, ...chunk.reexports, ...chunk.assetReferences]),
    ]),
  );
  await fs.writeFile(path.join(args.output, "chunk-graph.json"), `${JSON.stringify(graph, null, 2)}\n`, "utf8");

  console.log(`[frontend-recovery] analyzed ${chunks.length} JS chunks`);
  console.log(`[frontend-recovery] source maps detected: ${sourceMapped.length}`);
  console.log(`[frontend-recovery] API paths: ${allApiPaths.length}`);
  console.log(`[frontend-recovery] storage keys: ${allStorageKeys.length}`);
  console.log(`[frontend-recovery] output: ${path.relative(ROOT, args.output) || "."}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
