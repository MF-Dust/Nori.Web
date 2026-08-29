#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ASSET_DIR = path.join(ROOT, "public", "assets");
const selector = process.argv[2] || "NormalApp-";
const identifiers = process.argv.slice(3).filter(Boolean);
const contextRadius = Math.max(200, Number(process.env.FRONTEND_IDENTIFIER_CONTEXT || 1800));
const maxStatement = Math.max(800, Number(process.env.FRONTEND_IDENTIFIER_STATEMENT || 12000));
const maxMatches = Math.max(1, Number(process.env.FRONTEND_IDENTIFIER_MATCHES || 80));

function normalize(text) {
  return text.replaceAll(/\s+/g, " ").trim();
}

function nearestStatement(node) {
  let current = node;
  while (current.parent && !ts.isStatement(current) && !ts.isSourceFile(current.parent)) {
    current = current.parent;
  }
  return current;
}

function ancestry(node) {
  const result = [];
  let current = node.parent;
  while (current && result.length < 8) {
    result.push(ts.SyntaxKind[current.kind]);
    current = current.parent;
  }
  return result;
}

function collectMatches(sourceFile, sourceText, identifier) {
  const matches = [];
  function visit(node) {
    if (ts.isIdentifier(node) && node.text === identifier) {
      const position = node.getStart(sourceFile);
      const parent = node.parent;
      const statement = nearestStatement(node);
      const contextStart = Math.max(0, position - contextRadius);
      const contextEnd = Math.min(sourceText.length, node.getEnd() + contextRadius);
      const statementText = normalize(statement.getText(sourceFile));
      matches.push({
        position,
        line: sourceFile.getLineAndCharacterOfPosition(position).line + 1,
        parentKind: parent ? ts.SyntaxKind[parent.kind] : null,
        ancestry: ancestry(node),
        context: normalize(sourceText.slice(contextStart, contextEnd)),
        statement:
          statementText.length > maxStatement
            ? `${statementText.slice(0, maxStatement)} …`
            : statementText,
      });
    }
    ts.forEachChild(node, visit);
  }
  visit(sourceFile);
  return matches.sort((a, b) => a.position - b.position).slice(0, maxMatches);
}

async function main() {
  if (identifiers.length === 0) throw new Error("Provide at least one identifier to inspect");
  const files = (await fs.readdir(ASSET_DIR))
    .filter((file) => file.endsWith(".js") && file.includes(selector))
    .sort();
  if (files.length !== 1) {
    throw new Error(`Expected exactly one JavaScript chunk matching ${JSON.stringify(selector)}, got ${files.length}: ${files.join(", ")}`);
  }

  const file = files[0];
  const sourceText = await fs.readFile(path.join(ASSET_DIR, file), "utf8");
  const sourceFile = ts.createSourceFile(file, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
  const report = {
    file,
    bytes: Buffer.byteLength(sourceText),
    identifiers: Object.fromEntries(
      identifiers.map((identifier) => [identifier, collectMatches(sourceFile, sourceText, identifier)]),
    ),
  };
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
