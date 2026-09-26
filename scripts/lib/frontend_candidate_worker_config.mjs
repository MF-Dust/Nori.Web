import { access, readFile, writeFile } from "node:fs/promises";
import { dirname, relative, resolve } from "node:path";
import ts from "typescript";

const root = resolve(import.meta.dirname, "..");
const sourcePath = resolve(root, "wrangler.jsonc");
const outputPath = resolve(root, ".wrangler-candidate.json");
const candidateDirectory = resolve(
  root,
  ".artifacts/build/app/cutover-candidate",
);

if (dirname(outputPath) !== root) {
  throw new Error(
    "Candidate Wrangler configuration must remain at repository root",
  );
}

await access(resolve(candidateDirectory, "index.html"));
const source = await readFile(sourcePath, "utf8");
const parsed = ts.parseConfigFileTextToJson(sourcePath, source);
if (parsed.error) {
  throw new Error(
    ts.flattenDiagnosticMessageText(parsed.error.messageText, "\n"),
  );
}
if (!parsed.config || typeof parsed.config !== "object") {
  throw new Error("wrangler.jsonc did not contain an object configuration");
}
if (!parsed.config.assets || typeof parsed.config.assets !== "object") {
  throw new Error("wrangler.jsonc is missing its assets configuration");
}

const config = structuredClone(parsed.config);
config.assets.directory = `./${relative(root, candidateDirectory)}`;
await writeFile(outputPath, `${JSON.stringify(config, null, 2)}\n`, {
  mode: 0o600,
});

console.log(`Candidate Wrangler config: ${relative(root, outputPath)}`);
console.log(`Candidate asset directory: ${config.assets.directory}`);
