// Collect license texts; this is not an audit of the historical frontend bundle.
import { copyFile, readFile, readdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const legal = resolve(root, "public/legal");
const lock = JSON.parse(await readFile(resolve(root, "package-lock.json"), "utf8"));
const sections = [
  "Current source-build npm dependencies (package-lock.json).",
  "Not an exhaustive inventory of the historical public/assets bundles.",
  "Optional native packages not installed on this platform are not included.",
  "The original license texts below retain their own terms.\n",
];

async function licenseFiles(directory, prefix = "") {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === ".git") continue;
    const relative = prefix + entry.name;
    if (entry.isDirectory()) {
      files.push(...await licenseFiles(resolve(directory, entry.name), relative + "/"));
    } else if (/^(licen[cs]e|copying|notice|copyright|authors)([.\-_]|$)/i.test(entry.name)) {
      files.push(relative);
    }
  }
  return files.sort();
}

for (const [path, entry] of Object.entries(lock.packages).sort(([a], [b]) => a.localeCompare(b))) {
  if (!path || entry.dev) continue;
  const directory = resolve(root, path);
  let metadata;
  try {
    metadata = JSON.parse(await readFile(resolve(directory, "package.json"), "utf8"));
  } catch (error) {
    if (entry.optional && error.code === "ENOENT") continue;
    throw error;
  }
  if (metadata.version !== entry.version) throw new Error(`Run npm ci: version mismatch for ${path}`);
  const files = await licenseFiles(directory);
  sections.push(`\n${"=".repeat(72)}\n${metadata.name}@${metadata.version} — ${entry.license}\n`);
  if (!files.length) {
    // This published fork omits LICENSE.md; preserve the upstream text separately.
    if (metadata.name === "@pixi/colord") {
      sections.push(await readFile(resolve(legal, "vendor/colord-LICENSE.txt"), "utf8"));
    } else if (metadata.name.startsWith("@napi-rs/canvas-")) {
      sections.push("Native optional canvas binary; see @napi-rs/canvas LICENSE above.");
    } else {
      throw new Error(`Missing license text for ${metadata.name}`);
    }
  }
  for (const file of files) {
    sections.push(`--- ${file} ---\n${await readFile(resolve(directory, file), "utf8")}`);
  }
}
await writeFile(resolve(legal, "npm-NOTICES.txt"), sections.join("\n") + "\n");
for (const file of ["LICENSE", "COPYRIGHT.md", "THIRD_PARTY_NOTICES.md"]) {
  await copyFile(resolve(root, file), resolve(legal, file));
}
await copyFile(resolve(root, "node_modules/@fontsource/nunito/LICENSE"), resolve(legal, "fonts/Nunito-OFL.txt"));
console.log("Updated public/legal: npm notices, Nunito license and project notices.");
