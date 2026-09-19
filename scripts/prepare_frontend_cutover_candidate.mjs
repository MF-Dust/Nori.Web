import { createHash } from "node:crypto";
import {
  copyFile,
  cp,
  lstat,
  mkdir,
  readFile,
  readdir,
  rename,
  rm,
  stat,
  symlink,
  writeFile,
} from "node:fs/promises";
import { dirname, extname, relative, resolve, sep } from "node:path";
import { historicalAssetReferences } from "./frontend_asset_ownership.mjs";

const root = resolve(process.cwd());
const defaultCandidate = resolve(root, ".frontend-app-build/cutover-candidate");
const defaultRollback = resolve(root, ".frontend-app-build/cutover-rollback");
const candidateMarker = ".frontend-cutover-candidate.json";
const options = {
  build: resolve(root, ".frontend-app-build"),
  public: resolve(root, "public"),
  candidate: defaultCandidate,
  rollback: defaultRollback,
  materialize: false,
};

for (let index = 2; index < process.argv.length; index += 1) {
  const argument = process.argv[index];
  if (argument === "--materialize") options.materialize = true;
  else if (["--build", "--public", "--candidate", "--rollback"].includes(argument)) {
    const value = process.argv[++index];
    if (!value) throw new Error(`${argument} requires a path`);
    options[argument.slice(2)] = resolve(root, value);
  } else if (argument === "--help") {
    console.log(`Usage: node scripts/prepare_frontend_cutover_candidate.mjs [options]

  --build PATH       Vite application build (default .frontend-app-build)
  --public PATH      Current production static tree (default public)
  --candidate PATH   Isolated candidate directory
  --rollback PATH    Rollback snapshot and manifest directory
  --materialize      Copy public assets instead of using local staging symlinks`);
    process.exit(0);
  } else throw new Error(`Unknown argument: ${argument}`);
}

function inside(parent, child) {
  const path = relative(parent, child);
  return path === "" || (!path.startsWith(`..${sep}`) && path !== "..");
}

for (const [name, path] of Object.entries({ candidate: options.candidate, rollback: options.rollback })) {
  if (
    path === options.public ||
    path === options.build ||
    inside(path, options.public) ||
    inside(path, options.build) ||
    inside(options.public, path)
  )
    throw new Error(`${name} directory must not contain or replace the public/build source tree: ${path}`);
}
if (inside(options.candidate, options.rollback) || inside(options.rollback, options.candidate))
  throw new Error("candidate and rollback directories must be separate");

const buildIndex = resolve(options.build, "index.html");
const productionIndex = resolve(options.public, "index.html");
await Promise.all([stat(buildIndex), stat(productionIndex)]);

const nonce = `${process.pid}-${Date.now()}`;
const candidateTemp = resolve(dirname(options.candidate), `.${options.candidate.split(sep).at(-1)}.tmp-${nonce}`);
const rollbackTemp = resolve(dirname(options.rollback), `.${options.rollback.split(sep).at(-1)}.tmp-${nonce}`);
const excludedBuildPaths = new Set([
  options.candidate,
  options.rollback,
  candidateTemp,
  rollbackTemp,
  // Default local outputs can remain inside the Vite build when callers choose
  // external materialized destinations. They are verifier artifacts, not Vite
  // output, and must never be copied into another candidate.
  resolve(options.build, "cutover-candidate"),
  resolve(options.build, "cutover-rollback"),
]);

async function exists(path) {
  try { await lstat(path); return true; } catch (error) {
    if (error?.code === "ENOENT") return false;
    throw error;
  }
}

async function sha256(path) {
  return createHash("sha256").update(await readFile(path)).digest("hex");
}

async function assertReplaceable(path, kind) {
  if (!(await exists(path))) return;
  if ((kind === "candidate" && path === defaultCandidate) || (kind === "rollback" && path === defaultRollback)) return;
  const markerPath = kind === "candidate"
    ? resolve(path, candidateMarker)
    : resolve(path, "rollback-manifest.json");
  try {
    const marker = JSON.parse(await readFile(markerPath, "utf8"));
    if (marker.version === 1 && (kind !== "candidate" || marker.kind === "frontend-cutover-candidate")) return;
  } catch {}
  throw new Error(`refusing to replace unrecognized ${kind} directory: ${path}`);
}

await Promise.all([
  assertReplaceable(options.candidate, "candidate"),
  assertReplaceable(options.rollback, "rollback"),
]);

const stagedPublicPaths = new Set();
async function stagePublic(source, destination) {
  if (await exists(destination))
    throw new Error(`candidate overlay collision: ${relative(root, destination)}`);
  await mkdir(dirname(destination), { recursive: true });
  if (options.materialize) {
    await cp(source, destination, { recursive: true, dereference: true, errorOnExist: true, force: false });
    stagedPublicPaths.add(destination);
    return;
  }
  const sourceStat = await stat(source);
  const target = relative(dirname(destination), source) || ".";
  await symlink(target, destination, sourceStat.isDirectory() ? "dir" : "file");
  stagedPublicPaths.add(destination);
}

async function stagePublicTree() {
  await mkdir(resolve(candidateTemp, "assets"), { recursive: true });
  for (const entry of await readdir(options.public, { withFileTypes: true })) {
    if (entry.name === "index.html" || entry.name === "assets") continue;
    await stagePublic(resolve(options.public, entry.name), resolve(candidateTemp, entry.name));
  }
  const publicAssets = resolve(options.public, "assets");
  for (const entry of await readdir(publicAssets, { withFileTypes: true }))
    await stagePublic(resolve(publicAssets, entry.name), resolve(candidateTemp, "assets", entry.name));
}

const generatedFiles = [];
async function copyGeneratedTree(source = options.build, relativePath = "") {
  for (const entry of await readdir(source, { withFileTypes: true })) {
    const sourcePath = resolve(source, entry.name);
    if (!relativePath && /^\.cutover-(?:candidate|rollback)\.tmp-\d+-\d+$/.test(entry.name)) continue;
    if (excludedBuildPaths.has(sourcePath)) continue;
    const nextRelative = relativePath ? `${relativePath}/${entry.name}` : entry.name;
    if (nextRelative === "index.html") continue;
    const destination = resolve(candidateTemp, nextRelative);
    if (entry.isDirectory()) {
      if (stagedPublicPaths.has(destination))
        throw new Error(`generated output would overwrite a public rollback asset directory: ${nextRelative}`);
      await mkdir(destination, { recursive: true });
      await copyGeneratedTree(sourcePath, nextRelative);
      continue;
    }
    if (await exists(destination))
      throw new Error(`generated output would overwrite a public rollback asset: ${nextRelative}`);
    await mkdir(dirname(destination), { recursive: true });
    await copyFile(sourcePath, destination);
    generatedFiles.push(nextRelative);
  }
}

function localReferences(html) {
  return [...html.matchAll(/(?:src|href)\s*=\s*["']([^"']+)["']/g)]
    .map((match) => match[1])
    .filter((value) => value.startsWith("/") && !value.startsWith("//"))
    .map((value) => decodeURIComponent(value.split(/[?#]/, 1)[0]).replace(/^\/+/, ""));
}

function executableReferences(html) {
  return [...new Set(localReferences(html).filter((path) => [".js", ".mjs", ".css"].includes(extname(path))))].sort();
}

function safePath(base, path) {
  const destination = resolve(base, path);
  if (!inside(base, destination)) throw new Error(`unsafe candidate reference: ${path}`);
  return destination;
}

async function verifyRequiredCandidateAssets(buildHtml) {
  const required = new Set(localReferences(buildHtml));
  for (const path of [
    "ARGNori_web/ARGNori.model3.json",
    "audio/bgm1.m4a",
    "cubism_sdk/Core/live2dcubismcore.js",
    "fonts/sarasa-fixed-sc.woff2",
  ]) required.add(path);

  const generatedChecks = [
    [/^assets\/corruption-processor\.worklet-.*\.js$/, "corruption audio worklet"],
    [/^assets\/pdf\.worker.*\.mjs$/, "PDF worker"],
    [/^assets\/pdf-preview-.*\.js$/, "lazy PDF preview"],
    [/^assets\/pdfjs\/cmaps\//, "PDF cmaps"],
    [/^assets\/pdfjs\/standard_fonts\//, "PDF standard fonts"],
    [/^assets\/pdfjs\/wasm\/.*\.wasm$/, "PDF wasm"],
    [/^assets\/nunito-.*\.woff2$/, "generated UI fonts"],
  ];
  for (const [pattern, label] of generatedChecks) {
    const match = generatedFiles.find((path) => pattern.test(path));
    if (!match) throw new Error(`source build is missing ${label}`);
    required.add(match);
  }
  const lazyChunks = generatedFiles.filter((path) => /^assets\/.+\.(?:js|mjs)$/.test(path) && !/^assets\/index-/.test(path));
  if (!lazyChunks.length) throw new Error("source build contains no lazy JavaScript chunks");

  for (const path of required) {
    const candidatePath = safePath(candidateTemp, path);
    if (!(await exists(candidatePath))) throw new Error(`candidate reference is missing: /${path}`);
  }
  if (await exists(resolve(candidateTemp, "backend/data/live_world_pack.json")))
    throw new Error("private live-world pack must remain in R2 and outside the static candidate");
  return { required: [...required].sort(), lazyChunks: lazyChunks.sort() };
}

async function verifyNoHistoricalExecution(buildHtml) {
  const historicalExecutables = (await readdir(resolve(options.public, "assets")))
    .filter((name) => /\.(?:js|css)$/.test(name));
  const direct = historicalAssetReferences(buildHtml, historicalExecutables);
  if (direct.length) throw new Error(`candidate index executes historical assets: ${direct.join(", ")}`);
  const violations = [];
  for (const path of generatedFiles.filter((file) => /\.(?:js|mjs|css)$/.test(file))) {
    const content = await readFile(resolve(options.build, path), "utf8");
    for (const asset of historicalAssetReferences(content, historicalExecutables))
      violations.push(`${path} -> ${asset}`);
  }
  if (violations.length)
    throw new Error(`generated source output references historical executable assets:\n${violations.join("\n")}`);
  return historicalExecutables;
}

async function prepareRollbackSnapshot(productionHtml) {
  const references = executableReferences(productionHtml);
  const entries = [];
  for (const path of ["index.html", ...references]) {
    const source = safePath(options.public, path);
    const info = await stat(source);
    if (!info.isFile()) throw new Error(`rollback source is not a file: ${path}`);
    const destination = resolve(rollbackTemp, "files", path);
    await mkdir(dirname(destination), { recursive: true });
    await copyFile(source, destination);
    entries.push({ path, bytes: info.size, sha256: await sha256(source) });
  }
  return entries;
}

async function verifyRollbackSwap(candidateBytes, rollbackEntries) {
  const candidateIndex = resolve(candidateTemp, "index.html");
  const rollbackIndex = resolve(rollbackTemp, "files/index.html");
  const candidateHash = createHash("sha256").update(candidateBytes).digest("hex");
  const productionHash = rollbackEntries.find((entry) => entry.path === "index.html").sha256;
  await copyFile(rollbackIndex, candidateIndex);
  if (await sha256(candidateIndex) !== productionHash)
    throw new Error("rollback index replacement did not restore the production index bytes");
  await writeFile(candidateIndex, candidateBytes);
  if (await sha256(candidateIndex) !== candidateHash)
    throw new Error("candidate index could not be restored after the rollback drill");
  for (const entry of rollbackEntries) {
    if (entry.path === "index.html") continue;
    if (await sha256(safePath(candidateTemp, entry.path)) !== entry.sha256)
      throw new Error(`candidate rollback asset hash mismatch: ${entry.path}`);
  }
  return { candidateIndexSha256: candidateHash, productionIndexSha256: productionHash };
}

async function verifyR2Contract() {
  const [wrangler, deployScript] = await Promise.all([
    readFile(resolve(root, "wrangler.jsonc"), "utf8"),
    readFile(resolve(root, "scripts/cloudflare_builds_deploy.py"), "utf8"),
  ]);
  if (!wrangler.includes('"binding": "NORI_ASSETS_R2"'))
    throw new Error("wrangler.jsonc is missing the NORI_ASSETS_R2 binding");
  if (!deployScript.includes("sync_live_pack") || !deployScript.includes("runtime/live/source-fingerprint.txt"))
    throw new Error("Cloudflare deploy wrapper is missing the live-pack R2 synchronization contract");
  return { binding: "NORI_ASSETS_R2", marker: "runtime/live/source-fingerprint.txt" };
}

await Promise.all([
  rm(candidateTemp, { recursive: true, force: true }),
  rm(rollbackTemp, { recursive: true, force: true }),
]);
await Promise.all([mkdir(candidateTemp, { recursive: true }), mkdir(rollbackTemp, { recursive: true })]);

try {
  const [buildHtml, productionHtml, r2] = await Promise.all([
    readFile(buildIndex, "utf8"),
    readFile(productionIndex, "utf8"),
    verifyR2Contract(),
  ]);
  const productionIndexBefore = await sha256(productionIndex);
  await stagePublicTree();
  await copyGeneratedTree();
  const candidateBytes = Buffer.from(buildHtml);
  await writeFile(resolve(candidateTemp, "index.html"), candidateBytes);

  const historicalExecutables = await verifyNoHistoricalExecution(buildHtml);
  const assetChecks = await verifyRequiredCandidateAssets(buildHtml);
  const rollbackEntries = await prepareRollbackSnapshot(productionHtml);
  const rollbackDrill = await verifyRollbackSwap(candidateBytes, rollbackEntries);
  if (await sha256(productionIndex) !== productionIndexBefore)
    throw new Error("production public/index.html changed during candidate verification");
  for (const entry of rollbackEntries) {
    if (await sha256(safePath(options.public, entry.path)) !== entry.sha256)
      throw new Error(`production rollback source changed during verification: ${entry.path}`);
  }

  const manifest = {
    version: 1,
    stagingMode: options.materialize ? "materialized-copy" : "local-relative-symlink-overlay",
    candidateDirectory: relative(root, options.candidate),
    rollbackDirectory: relative(root, options.rollback),
    sourceBuildDirectory: relative(root, options.build),
    productionPublicDirectory: relative(root, options.public),
    generatedFileCount: generatedFiles.length,
    historicalExecutableInventoryCount: historicalExecutables.length,
    candidateExecutableReferences: executableReferences(buildHtml),
    requiredCandidateAssets: assetChecks.required,
    lazyChunkCount: assetChecks.lazyChunks.length,
    rollbackEntries,
    rollbackDrill: { ...rollbackDrill, restoredCandidateAfterDrill: true, productionSourcesUnchanged: true },
    r2,
  };
  await writeFile(resolve(candidateTemp, candidateMarker), `${JSON.stringify({
    version: 1,
    kind: "frontend-cutover-candidate",
    stagingMode: manifest.stagingMode,
  }, null, 2)}\n`);
  await writeFile(resolve(rollbackTemp, "rollback-manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);

  await Promise.all([
    rm(options.candidate, { recursive: true, force: true }),
    rm(options.rollback, { recursive: true, force: true }),
  ]);
  await rename(candidateTemp, options.candidate);
  await rename(rollbackTemp, options.rollback);
  console.log(`Frontend cutover candidate verified (${manifest.stagingMode}).`);
  console.log(`Candidate: ${relative(root, options.candidate)}`);
  console.log(`Rollback manifest: ${relative(root, resolve(options.rollback, "rollback-manifest.json"))}`);
  console.log(`Generated files: ${generatedFiles.length}; rollback files: ${rollbackEntries.length}; lazy chunks: ${assetChecks.lazyChunks.length}`);
} catch (error) {
  await Promise.all([
    rm(candidateTemp, { recursive: true, force: true }),
    rm(rollbackTemp, { recursive: true, force: true }),
  ]);
  throw error;
}
