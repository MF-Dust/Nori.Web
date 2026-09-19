import { sceneProjectSchema, type SceneProject } from "./scene-project";

export const SCENE_PROJECT_MAX_BYTES = 100_000;
function checkSize(text: string) {
  if (
    text.length > SCENE_PROJECT_MAX_BYTES ||
    new TextEncoder().encode(text).byteLength > SCENE_PROJECT_MAX_BYTES
  )
    throw new Error("Project exceeds 100 KB of UTF-8 text");
}
export function parseSceneProject(text: string): SceneProject {
  checkSize(text);
  let value: unknown;
  try {
    value = JSON.parse(text.replace(/^\uFEFF/, ""));
  } catch {
    throw new Error("Project must contain valid JSON");
  }
  return sceneProjectSchema.parse(value);
}
export function serializeSceneProject(project: SceneProject): string {
  const text =
    JSON.stringify(sceneProjectSchema.parse(project), null, 2) + "\n";
  checkSize(text);
  return text;
}
export async function readSceneProjectFile(
  file: Pick<File, "size" | "text">,
): Promise<SceneProject> {
  if (
    !Number.isFinite(file.size) ||
    file.size < 0 ||
    file.size > SCENE_PROJECT_MAX_BYTES
  )
    throw new Error("Project exceeds 100 KB of UTF-8 text");
  // Recheck the decoded bytes; file metadata and extension never establish validity.
  return parseSceneProject(await file.text());
}
export function sceneProjectFilename(name: string): string {
  const slug = name
    .normalize("NFKC")
    .replace(/[^\p{L}\p{N}_-]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
  return `nori-scene-${slug || "project"}.json`;
}
