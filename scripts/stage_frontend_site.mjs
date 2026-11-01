import { copyFile, cp, lstat, mkdir, readFile, readdir, rename, rm, stat, symlink, writeFile } from "node:fs/promises";
import { dirname, relative, resolve, sep } from "node:path";

/**
 * Stage the deployable static site: the Vite build of frontend-src/ overlaid
 * with the static assets in public/. Cloudflare Workers Assets needs one
 * directory; the local server layers the two trees itself and needs no staging.
 */
const root = resolve(process.cwd());
const defaultSite = resolve(root, ".artifacts/build/site");
const siteMarker = ".nori-frontend-site.json";
const options = {
  build: resolve(root, ".artifacts/build/app"),
  public: resolve(root, "public"),
  site: defaultSite,
  materialize: false,
};

for (let index = 2; index < process.argv.length; index += 1) {
  const argument = process.argv[index];
  if (argument === "--materialize") options.materialize = true;
  else if (["--build", "--public", "--site"].includes(argument)) {
    const value = process.argv[++index];
    if (!value) throw new Error(`${argument} requires a path`);
    options[argument.slice(2)] = resolve(root, value);
  } else if (argument === "--help") {
    console.log(`Usage: node scripts/stage_frontend_site.mjs [options]

  --build PATH    Vite application build (default .artifacts/build/app)
  --public PATH   Static asset tree (default public)
  --site PATH     Output directory (default .artifacts/build/site)
  --materialize   Copy public assets instead of linking them (required for deployment)`);
    process.exit(0);
  } else throw new Error(`Unknown argument: ${argument}`);
}

function inside(parent, child) {
  const path = relative(parent, child);
  return path === "" || (!path.startsWith(`..${sep}`) && path !== "..");
}

if ([options.public, options.build].some((tree) => inside(tree, options.site) || inside(options.site, tree)))
  throw new Error(`site directory must be separate from the public and build trees: ${options.site}`);

async function exists(path) {
  try {
    await lstat(path);
    return true;
  } catch (error) {
    if (error?.code === "ENOENT") return false;
    throw error;
  }
}

if (options.site !== defaultSite && (await exists(options.site)) && !(await exists(resolve(options.site, siteMarker))))
  throw new Error(`refusing to replace unrecognized directory: ${options.site}`);
await stat(resolve(options.build, "index.html"));
if (await exists(resolve(options.public, "index.html")))
  throw new Error("public/index.html would shadow the source frontend entry");

const temp = resolve(dirname(options.site), `.${options.site.split(sep).at(-1)}.tmp-${process.pid}-${Date.now()}`);
const generatedFiles = [];

async function copyBuild(source = options.build, path = "") {
  for (const entry of await readdir(source, { withFileTypes: true })) {
    const next = path ? `${path}/${entry.name}` : entry.name;
    const destination = resolve(temp, next);
    if (entry.isDirectory()) {
      await mkdir(destination, { recursive: true });
      await copyBuild(resolve(source, entry.name), next);
    } else {
      await copyFile(resolve(source, entry.name), destination);
      generatedFiles.push(next);
    }
  }
}

async function overlayPublic(source = options.public, path = "") {
  for (const entry of await readdir(source, { withFileTypes: true })) {
    const next = path ? `${path}/${entry.name}` : entry.name;
    const from = resolve(source, entry.name);
    const destination = resolve(temp, next);
    if (await exists(destination)) {
      // Directories shared with the build (assets/) merge file by file.
      if (entry.isDirectory() && (await stat(destination)).isDirectory()) {
        await overlayPublic(from, next);
        continue;
      }
      throw new Error(`generated output collides with a public asset: ${next}`);
    }
    if (options.materialize) {
      await cp(from, destination, { recursive: true, dereference: true, errorOnExist: true, force: false });
    } else {
      const target = relative(dirname(destination), from) || ".";
      await symlink(target, destination, entry.isDirectory() ? "dir" : "file");
    }
  }
}

function localReferences(html) {
  return [...html.matchAll(/(?:src|href)\s*=\s*["']([^"']+)["']/g)]
    .map((match) => match[1])
    .filter((value) => value.startsWith("/") && !value.startsWith("//"))
    .map((value) => decodeURIComponent(value.split(/[?#]/, 1)[0]).replace(/^\/+/, ""));
}

async function verifySite() {
  const required = new Set(localReferences(await readFile(resolve(temp, "index.html"), "utf8")));
  for (const path of [
    "ARGNori_web/ARGNori.model3.json",
    "audio/bgm1.m4a",
    "cubism_sdk/Core/live2dcubismcore.js",
    "fonts.css",
    "fonts/sarasa-fixed-sc.woff2",
    "fonts/sarasa-fixed-sc-bold.woff2",
    "fonts/fusion-pixel-12px-proportional-sc.woff2",
    "fonts/fusion-pixel-12px-monospaced-sc.woff2",
    "fonts/press-start-2p-latin.woff2",
    "fonts/vt323-latin.woff2",
    "fonts/silkscreen-latin.woff2",
    "fonts/silkscreen-bold-latin.woff2",
    "fonts/web",
  ]) required.add(path);
  for (const [pattern, label] of [
    [/^assets\/corruption-processor\.worklet-.*\.js$/, "corruption audio worklet"],
    [/^assets\/pdf\.worker.*\.mjs$/, "PDF worker"],
    [/^assets\/pdf-preview-.*\.js$/, "lazy PDF preview"],
    [/^assets\/pdfjs\/cmaps\//, "PDF cmaps"],
    [/^assets\/pdfjs\/standard_fonts\//, "PDF standard fonts"],
    [/^assets\/pdfjs\/wasm\/.*\.wasm$/, "PDF wasm"],
    [/^assets\/nunito-.*\.woff2$/, "generated UI fonts"],
  ]) {
    if (!generatedFiles.some((path) => pattern.test(path))) throw new Error(`source build is missing ${label}`);
  }
  if (!generatedFiles.some((path) => /^assets\/.+\.(?:js|mjs)$/.test(path) && !/^assets\/index-/.test(path)))
    throw new Error("source build contains no lazy JavaScript chunks");
  for (const path of required) {
    const destination = resolve(temp, path);
    if (!inside(temp, destination)) throw new Error(`unsafe site reference: ${path}`);
    if (!(await exists(destination))) throw new Error(`site reference is missing: /${path}`);
  }
  if (await exists(resolve(temp, "backend/data/live_world_pack.json")))
    throw new Error("private live-world pack must remain in R2 and outside the static site");
}

await rm(temp, { recursive: true, force: true });
await mkdir(temp, { recursive: true });
try {
  await copyBuild();
  await overlayPublic();
  await verifySite();
  const mode = options.materialize ? "materialized-copy" : "local-relative-symlink-overlay";
  await writeFile(resolve(temp, siteMarker), `${JSON.stringify({ version: 1, mode, generatedFiles: generatedFiles.length }, null, 2)}\n`);
  await rm(options.site, { recursive: true, force: true });
  await rename(temp, options.site);
  console.log(`Frontend site staged (${mode}): ${relative(root, options.site)}; generated files: ${generatedFiles.length}`);
} catch (error) {
  await rm(temp, { recursive: true, force: true });
  throw error;
}
