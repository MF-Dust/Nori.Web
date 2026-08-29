#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ASSET_DIR = path.join(ROOT, "public", "assets");
const OUTPUT = path.resolve(ROOT, process.argv[2] || ".frontend-recovery");

function uniq(values) {
  return [...new Set(values)].sort();
}

function classify(file) {
  const rules = [
    ["auth", /(?:LoginPage|ConvexAuthProvider|authClient)/i],
    ["chat", /ChatPanel/i],
    ["browser", /(?:BrowserApp|BrowserPageView|browserIntent|openUrlInBrowser)/i],
    ["mail", /MailScreen/i],
    ["files", /(?:FilesScreen|SealedVolumeAlert|BountyFilePicker)/i],
    ["messenger", /MessengerScreen/i],
    ["terminal", /(?:TerminalWindow|commands)/i],
    ["chess", /ChessScreen/i],
    ["cakeduel", /CakeDuel/i],
    ["games", /(?:GameScreen|StartScreen|ResultsScreen|HelpOverlay|PreviewScreen|IdleScreen|PopupScreen|ResetScreen)/i],
    ["debug", /Debug/i],
    ["arcade", /(?:NormalApp|arcadeConvexClient|paginated_query_client|http_client)/i],
    ["shell", /(?:index-|i18n-|env-)/i],
  ];
  return rules.find(([, pattern]) => pattern.test(file))?.[0] ?? "vendor-or-shared";
}

function textOf(node, sourceFile) {
  return node.getText(sourceFile);
}

function bindingName(name) {
  if (ts.isIdentifier(name)) return name.text;
  return textOf(name, name.getSourceFile());
}

function topLevelDeclarations(sourceFile) {
  const result = [];
  for (const statement of sourceFile.statements) {
    if (ts.isFunctionDeclaration(statement) && statement.name) {
      result.push({ kind: "function", name: statement.name.text, params: statement.parameters.length });
      continue;
    }
    if (ts.isClassDeclaration(statement) && statement.name) {
      result.push({ kind: "class", name: statement.name.text, members: statement.members.length });
      continue;
    }
    if (ts.isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        result.push({ kind: "variable", name: bindingName(declaration.name) });
      }
    }
  }
  return result;
}

function importBindings(sourceFile) {
  const imports = [];
  for (const statement of sourceFile.statements) {
    if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier)) continue;
    const from = statement.moduleSpecifier.text;
    const clause = statement.importClause;
    if (!clause) {
      imports.push({ from, imported: "<side-effect>", local: null });
      continue;
    }
    if (clause.name) imports.push({ from, imported: "default", local: clause.name.text });
    if (clause.namedBindings && ts.isNamespaceImport(clause.namedBindings)) {
      imports.push({ from, imported: "*", local: clause.namedBindings.name.text });
    } else if (clause.namedBindings && ts.isNamedImports(clause.namedBindings)) {
      for (const element of clause.namedBindings.elements) {
        imports.push({
          from,
          imported: element.propertyName?.text ?? element.name.text,
          local: element.name.text,
        });
      }
    }
  }
  return imports;
}

function exportBindings(sourceFile) {
  const exports = [];
  for (const statement of sourceFile.statements) {
    if (ts.isExportDeclaration(statement) && statement.exportClause && ts.isNamedExports(statement.exportClause)) {
      for (const element of statement.exportClause.elements) {
        exports.push({ local: element.propertyName?.text ?? element.name.text, exported: element.name.text });
      }
    }
    if (ts.isExportAssignment(statement)) exports.push({ local: "<expression>", exported: "default" });
  }
  return exports;
}

function runtimeSignals(sourceFile) {
  const signals = {
    fetchCalls: 0,
    websocketConstructors: 0,
    requestAnimationFrameCalls: 0,
    setTimeoutCalls: 0,
    setIntervalCalls: 0,
    storageCalls: 0,
    workerConstructors: 0,
    reactHookCalls: [],
  };
  const hooks = [];
  const visit = (node) => {
    if (ts.isCallExpression(node)) {
      const expression = node.expression;
      const name = ts.isIdentifier(expression)
        ? expression.text
        : ts.isPropertyAccessExpression(expression)
          ? expression.name.text
          : "";
      if (name === "fetch") signals.fetchCalls += 1;
      if (name === "requestAnimationFrame") signals.requestAnimationFrameCalls += 1;
      if (name === "setTimeout") signals.setTimeoutCalls += 1;
      if (name === "setInterval") signals.setIntervalCalls += 1;
      if (["getItem", "setItem", "removeItem"].includes(name)) signals.storageCalls += 1;
      if (/^use[A-Z]/.test(name)) hooks.push(name);
    }
    if (ts.isNewExpression(node) && ts.isIdentifier(node.expression)) {
      if (node.expression.text === "WebSocket") signals.websocketConstructors += 1;
      if (node.expression.text === "Worker") signals.workerConstructors += 1;
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  signals.reactHookCalls = uniq(hooks);
  return signals;
}

async function main() {
  const files = (await fs.readdir(ASSET_DIR)).filter((file) => file.endsWith(".js")).sort();
  const symbolDir = path.join(OUTPUT, "symbols");
  await fs.mkdir(symbolDir, { recursive: true });
  const records = [];
  for (const file of files) {
    const text = await fs.readFile(path.join(ASSET_DIR, file), "utf8");
    const sourceFile = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
    const record = {
      file,
      feature: classify(file),
      topLevelDeclarations: topLevelDeclarations(sourceFile),
      imports: importBindings(sourceFile),
      exports: exportBindings(sourceFile),
      runtimeSignals: runtimeSignals(sourceFile),
    };
    records.push(record);
    await fs.writeFile(path.join(symbolDir, `${file}.json`), `${JSON.stringify(record, null, 2)}\n`, "utf8");
  }

  const byFeature = {};
  for (const record of records) (byFeature[record.feature] ??= []).push(record.file);
  await fs.writeFile(path.join(OUTPUT, "SYMBOL_INDEX.json"), `${JSON.stringify({ chunks: records, byFeature }, null, 2)}\n`, "utf8");

  const lines = [
    "# Recovered frontend feature map",
    "",
    "This report groups every shipped JavaScript chunk by observable responsibility. It is structural analysis, not a copy of the original TypeScript source tree.",
    "",
  ];
  for (const feature of Object.keys(byFeature).sort()) {
    lines.push(`## ${feature}`, "");
    for (const file of byFeature[feature]) lines.push(`- \`${file}\``);
    lines.push("");
  }
  await fs.writeFile(path.join(OUTPUT, "FEATURE_MAP.md"), `${lines.join("\n")}\n`, "utf8");
  console.log(`[frontend-symbols] inventoried ${records.length} JavaScript chunks`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
