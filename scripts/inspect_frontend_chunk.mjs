#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ASSET_DIR = path.join(ROOT, "public", "assets");
const selector = process.argv[2] || "NormalApp-";
const maxSnippet = Number(process.env.FRONTEND_INSPECT_SNIPPET || 2400);
const dependencyDepth = Math.max(0, Number(process.env.FRONTEND_INSPECT_DEPTH || 0));
const exportFilter = new Set(
  (process.env.FRONTEND_INSPECT_EXPORTS || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean),
);

function uniq(values) {
  return [...new Set(values)].sort();
}

function bindingNames(name) {
  if (ts.isIdentifier(name)) return [name.text];
  const result = [];
  for (const element of name.elements) {
    if (ts.isOmittedExpression(element)) continue;
    result.push(...bindingNames(element.name));
  }
  return result;
}

function exportBindings(sourceFile) {
  const exports = [];
  for (const statement of sourceFile.statements) {
    if (!ts.isExportDeclaration(statement) || !statement.exportClause || !ts.isNamedExports(statement.exportClause)) continue;
    for (const element of statement.exportClause.elements) {
      exports.push({
        local: element.propertyName?.text ?? element.name.text,
        exported: element.name.text,
      });
    }
  }
  return exports;
}

function topLevelDeclarationIndex(sourceFile) {
  const index = new Map();
  for (const statement of sourceFile.statements) {
    if (ts.isFunctionDeclaration(statement) && statement.name) {
      index.set(statement.name.text, { kind: "function", node: statement });
      continue;
    }
    if (ts.isClassDeclaration(statement) && statement.name) {
      index.set(statement.name.text, { kind: "class", node: statement });
      continue;
    }
    if (!ts.isVariableStatement(statement)) continue;
    for (const declaration of statement.declarationList.declarations) {
      for (const name of bindingNames(declaration.name)) {
        index.set(name, { kind: "variable", node: declaration });
      }
    }
  }
  return index;
}

function walk(node, inspect) {
  const stack = [node];
  while (stack.length) {
    const current = stack.pop();
    inspect(current);
    ts.forEachChild(current, (child) => stack.push(child));
  }
}

function semanticHints(node) {
  const strings = [];
  const calls = [];
  const properties = [];
  const jsxTags = [];
  walk(node, (child) => {
    if (ts.isStringLiteralLike(child) && child.text.length <= 160) strings.push(child.text);
    if (ts.isCallExpression(child)) {
      const expression = child.expression;
      if (ts.isIdentifier(expression)) calls.push(expression.text);
      else if (ts.isPropertyAccessExpression(expression)) calls.push(expression.name.text);
    }
    if (ts.isPropertyAccessExpression(child)) properties.push(child.name.text);
    if (ts.isJsxOpeningElement(child) || ts.isJsxSelfClosingElement(child)) jsxTags.push(child.tagName.getText());
  });
  return {
    strings: uniq(strings).slice(0, 80),
    calls: uniq(calls).slice(0, 80),
    properties: uniq(properties).slice(0, 120),
    jsxTags: uniq(jsxTags).slice(0, 40),
  };
}

function usageContexts(sourceFile, sourceText, identifier) {
  const contexts = [];
  const seen = new Set();
  walk(sourceFile, (node) => {
    if (!ts.isIdentifier(node) || node.text !== identifier) return;
    const parent = node.parent;
    if (!parent) return;
    const start = Math.max(0, parent.getStart(sourceFile) - 220);
    const end = Math.min(sourceText.length, parent.getEnd() + 220);
    const text = sourceText.slice(start, end).replaceAll(/\s+/g, " ").trim();
    if (!seen.has(text)) {
      seen.add(text);
      contexts.push(text.slice(0, 900));
    }
  });
  return contexts.slice(0, 6);
}

function declarationReport(sourceFile, declaration) {
  if (!declaration) return null;
  const raw = declaration.node.getText(sourceFile).replaceAll(/\s+/g, " ").trim();
  return {
    kind: declaration.kind,
    snippet: raw.length > maxSnippet ? `${raw.slice(0, maxSnippet)} …` : raw,
    hints: semanticHints(declaration.node),
  };
}

function referencedTopLevelNames(node, declarations, ownName) {
  const names = new Set();
  walk(node, (child) => {
    if (!ts.isIdentifier(child) || child.text === ownName || !declarations.has(child.text)) return;
    const parent = child.parent;
    if (ts.isPropertyAccessExpression(parent) && parent.name === child) return;
    if (ts.isPropertyAssignment(parent) && parent.name === child && parent.initializer !== child) return;
    if (ts.isMethodDeclaration(parent) && parent.name === child) return;
    names.add(child.text);
  });
  return [...names].sort();
}

function dependencyClosure(sourceFile, declarations, rootName, maxDepth) {
  if (maxDepth <= 0) return [];
  const result = [];
  const visited = new Set([rootName]);
  let frontier = [{ name: rootName, depth: 0 }];

  while (frontier.length) {
    const current = frontier.shift();
    if (!current || current.depth >= maxDepth) continue;
    const declaration = declarations.get(current.name);
    if (!declaration) continue;
    for (const name of referencedTopLevelNames(declaration.node, declarations, current.name)) {
      if (visited.has(name)) continue;
      visited.add(name);
      const dependency = declarations.get(name);
      if (!dependency) continue;
      const depth = current.depth + 1;
      result.push({
        name,
        depth,
        declaration: declarationReport(sourceFile, dependency),
      });
      frontier.push({ name, depth });
    }
  }

  return result;
}

async function main() {
  const files = (await fs.readdir(ASSET_DIR)).filter((file) => file.endsWith(".js") && file.includes(selector)).sort();
  if (files.length !== 1) {
    throw new Error(`Expected exactly one JavaScript chunk matching ${JSON.stringify(selector)}, got ${files.length}: ${files.join(", ")}`);
  }

  const file = files[0];
  const sourceText = await fs.readFile(path.join(ASSET_DIR, file), "utf8");
  const sourceFile = ts.createSourceFile(file, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
  const declarations = topLevelDeclarationIndex(sourceFile);
  const bindings = exportBindings(sourceFile);
  const selectedBindings = exportFilter.size
    ? bindings.filter((binding) => exportFilter.has(binding.exported))
    : bindings;
  const exports = selectedBindings.map((binding) => ({
    ...binding,
    declaration: declarationReport(sourceFile, declarations.get(binding.local)),
    dependencies: dependencyClosure(sourceFile, declarations, binding.local, dependencyDepth),
    usageContexts: usageContexts(sourceFile, sourceText, binding.local),
  }));

  const report = {
    file,
    bytes: Buffer.byteLength(sourceText),
    totalExportCount: bindings.length,
    selectedExportCount: exports.length,
    dependencyDepth,
    exportFilter: [...exportFilter],
    exports,
  };
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
