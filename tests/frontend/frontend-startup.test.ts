import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import test from "node:test";
import { createRequire } from "node:module";
import type * as TypeScript from "typescript";
import { localizeUserError } from "../../frontend-src/i18n/user-error";
import { HttpCompatibilityError } from "../../frontend-src/runtime/http";

test("user errors are localized, actionable and never expose transport diagnostics", () => {
  const internal = new Error("World does not have a media grant yet");
  assert.equal(localizeUserError(internal, "zh-CN", "connection"), "连接失败，请确认本地服务已启动后重试。");
  assert.equal(localizeUserError(internal, "zh-CN", "signIn"), "登录失败，请检查验证码后重试。");
  assert.equal(localizeUserError(new TypeError("Failed to fetch"), "en", "sendCode"), "Unable to connect. Check that the local service is running, then try again.");
  assert.equal(localizeUserError(new HttpCompatibilityError("internal rate limiter", 429, null), "zh-CN", "sendCode"), "操作过于频繁，请稍后重试。");
  assert.equal(localizeUserError(internal, "zh-CN", "signOut"), "退出登录失败，请检查连接后重试。");
});

const root = process.cwd();
const ts: typeof TypeScript = createRequire(resolve(root, "package.json"))("typescript");

test("boot pack contains only first-screen assets; deferred assets remain available", () => {
  const manifest = JSON.parse(readFileSync(resolve(root, "public/asset-manifest.json"), "utf8"));
  const boot: string[] = manifest.packs.boot;
  assert.ok(boot.length > 0);
  assert.ok(boot.every((path) => /^(\/ARGNori_web\/|\/ocean\/|\/cubism_sdk\/|\/icon\.png$)/.test(path)));
  for (const path of boot) {
    assert.ok(manifest.files[path], `missing revision: ${path}`);
    assert.ok(existsSync(resolve(root, "public", path.slice(1))), `missing asset: ${path}`);
  }
  assert.ok(boot.reduce((sum, path) => sum + manifest.files[path].size, 0) < 17_000_000);
  assert.ok(boot.includes("/ARGNori_web/ARGNori.model3.json"));
  assert.ok(boot.includes("/ocean/water-normal.png"));
  for (const path of ["/cakeduel/playmat.jpg", "/audio/chess/move-self.mp3", "/fonts/sarasa-fixed-sc.woff2", "/app-icons/files/icon-a.png"]) {
    assert.ok(manifest.packs.onDemand.includes(path), `lost deferred asset: ${path}`);
    assert.ok(manifest.files[path]);
  }
});

test("App screens are absent from the source entry's static dependency graph", () => {
  const visited = new Set<string>();
  const dynamic = new Set<string>();
  const visit = (path: string) => {
    if (visited.has(path)) return;
    visited.add(path);
    const source = ts.createSourceFile(path, readFileSync(path, "utf8"), ts.ScriptTarget.Latest, true);
    const target = (specifier: string) => {
      if (!specifier.startsWith(".")) return undefined;
      const base = resolve(dirname(path), specifier);
      return [base, `${base}.ts`, `${base}.tsx`, `${base}.js`].find((file) => /\.[jt]sx?$/.test(file) && existsSync(file));
    };
    for (const node of source.statements) {
      if (!ts.isImportDeclaration(node) && !ts.isExportDeclaration(node)) continue;
      if (!node.moduleSpecifier || !ts.isStringLiteral(node.moduleSpecifier)) continue;
      if (ts.isImportDeclaration(node) && node.importClause) {
        if (node.importClause.isTypeOnly) continue;
        const bindings = node.importClause.namedBindings;
        if (!node.importClause.name && bindings && ts.isNamedImports(bindings) && bindings.elements.every((item) => item.isTypeOnly)) continue;
      }
      if (ts.isExportDeclaration(node) && node.isTypeOnly) continue;
      const dependency = target(node.moduleSpecifier.text);
      if (dependency) visit(dependency);
    }
    const imports = (node: TypeScript.Node) => {
      if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword && node.arguments[0] && ts.isStringLiteral(node.arguments[0])) {
        const dependency = target(node.arguments[0].text);
        if (dependency) dynamic.add(dependency);
      }
      ts.forEachChild(node, imports);
    };
    imports(source);
  };
  visit(resolve(root, "frontend-src/source-app.tsx"));
  for (const screen of ["browser-screen", "files-screen", "mail-screen", "idle-screen", "chess-screen", "pictionary-screen", "codenames-app", "cakeduel-screen", "terminal-window", "messenger-shipped-surfaces", "debug-screen", "preview-screen", "settings-screen", "credits-screen"]) {
    const path = resolve(root, `frontend-src/screens/${screen}.tsx`);
    assert.equal(visited.has(path), false, `${screen} is still eagerly imported`);
    assert.ok(dynamic.has(path), `${screen} has no lazy import`);
  }
  // Later story scenes carry Pixi and three post-processing; only Boot (first session.ready) is eager.
  assert.ok(visited.has(resolve(root, "frontend-src/story/boot-scene.tsx")), "boot scene must stay eager");
  for (const scene of ["corruption-scene", "memory-scene", "datasea-scene", "farewell-scene", "ending-scene"]) {
    const path = resolve(root, `frontend-src/story/${scene}.tsx`);
    assert.equal(visited.has(path), false, `${scene} is still eagerly imported`);
    assert.ok(dynamic.has(path), `${scene} has no lazy import`);
  }
  // The entry validates chess state through the engine-free schema module.
  assert.equal(visited.has(resolve(root, "frontend-src/apps/chess-model.ts")), false, "chess engine model is eagerly imported");
});
