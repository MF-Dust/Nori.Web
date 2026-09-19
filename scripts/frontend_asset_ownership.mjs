import ts from "typescript";

/** Inspect executable literals without treating provenance comments as imports. */
export function historicalAssetReferences(source, historicalAssets) {
  const names = new Set(historicalAssets);
  const references = new Set();
  const file = ts.createSourceFile("source.tsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  function visit(node) {
    if (ts.isStringLiteralLike(node) || ts.isTemplateHead(node) || ts.isTemplateMiddle(node) || ts.isTemplateTail(node)) {
      const value = node.text.split(/[?#]/, 1)[0];
      const name = value.slice(value.lastIndexOf("/") + 1);
      if (names.has(name)) references.add(name);
    }
    ts.forEachChild(node, visit);
  }
  visit(file);
  // HTML and CSS are also production entry points, outside the TS syntax tree.
  for (const match of source.matchAll(/(?:src|href)\s*=\s*["']([^"']+)["']|(?:@import\s*|url\(\s*)["']?([^\s"');]+)/g)) {
    const value = (match[1] ?? match[2]).split(/[?#]/, 1)[0];
    const name = value.slice(value.lastIndexOf("/") + 1);
    if (names.has(name)) references.add(name);
  }
  return [...references].sort();
}
