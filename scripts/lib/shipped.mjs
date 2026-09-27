import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import ts from "typescript";
import { repoRoot } from "./paths.mjs";

const chunks = new Map();
const sources = new Map();

/**
 * Read one shipped chunk from public/assets, cached for the process.
 * `prefix` matches the filename start, for example "NormalApp-" or "IdleScreen-".
 * `markers`, when given, select the chunk that contains every marker.
 */
export async function readShipped(prefix, markers = []) {
  const key = `${prefix}\0${markers.join("\0")}`;
  if (chunks.has(key)) return chunks.get(key);
  const directory = resolve(repoRoot, "public", "assets");
  const names = (await readdir(directory))
    .filter((name) => name.startsWith(prefix) && name.endsWith(".js"))
    .sort();
  for (const name of names) {
    const text = await readFile(resolve(directory, name), "utf8");
    if (markers.every((marker) => text.includes(marker))) {
      const value = { name, text };
      chunks.set(key, value);
      return value;
    }
  }
  throw new Error(
    markers.length
      ? `no shipped ${prefix}*.js chunk contains ${markers.join(", ")}`
      : `no shipped ${prefix}*.js chunk`,
  );
}

/** Read a repository text file once per process. Paths are relative to the repo root. */
export async function readSource(relativePath) {
  if (sources.has(relativePath)) return sources.get(relativePath);
  const text = await readFile(resolve(repoRoot, relativePath), "utf8");
  sources.set(relativePath, text);
  return text;
}

const parsed = new Map();

/** Parse a repository file once per process. */
export function parseSource(relativePath, text, scriptKind = ts.ScriptKind.TS) {
  const key = `${scriptKind}\0${relativePath}`;
  if (parsed.has(key)) return parsed.get(key);
  const source = ts.createSourceFile(
    relativePath,
    text,
    ts.ScriptTarget.Latest,
    true,
    scriptKind,
  );
  parsed.set(key, source);
  return source;
}
