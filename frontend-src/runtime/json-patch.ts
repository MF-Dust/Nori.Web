import type { JsonValue } from "./protocol";

export interface JsonPatchOperation {
  op: "add" | "remove" | "replace";
  path: string;
  value?: JsonValue;
}

function decodePointerToken(token: string): string {
  return token.replace(/~1/g, "/").replace(/~0/g, "~");
}

function clone<T>(value: T): T {
  return typeof structuredClone === "function"
    ? structuredClone(value)
    : JSON.parse(JSON.stringify(value)) as T;
}

function resolveParent(root: JsonValue, pointer: string): { parent: any; key: string } {
  if (!pointer.startsWith("/")) throw new Error(`Invalid JSON pointer: ${pointer}`);
  const tokens = pointer.split("/").slice(1).map(decodePointerToken);
  if (!tokens.length) throw new Error("Root replacement is not supported by the Arcade patch contract");
  const key = tokens.pop()!;
  let parent: any = root;
  for (const token of tokens) {
    if (Array.isArray(parent)) {
      const index = Number(token);
      if (!Number.isInteger(index) || index < 0 || index >= parent.length) {
        throw new Error(`Invalid array pointer segment: ${token}`);
      }
      parent = parent[index];
    } else if (parent && typeof parent === "object") {
      parent = parent[token];
    } else {
      throw new Error(`Pointer traverses a non-container at ${token}`);
    }
  }
  return { parent, key };
}

export function applyJsonPatch<T extends JsonValue>(document: T, operations: JsonPatchOperation[]): T {
  const next = clone(document);
  for (const operation of operations) {
    const { parent, key } = resolveParent(next, operation.path);
    if (Array.isArray(parent)) {
      const index = key === "-" ? parent.length : Number(key);
      if (!Number.isInteger(index) || index < 0) throw new Error(`Invalid array index: ${key}`);
      if (operation.op === "add") parent.splice(index, 0, clone(operation.value as JsonValue));
      else if (operation.op === "replace") parent[index] = clone(operation.value as JsonValue);
      else parent.splice(index, 1);
      continue;
    }
    if (!parent || typeof parent !== "object") throw new Error(`Invalid patch target: ${operation.path}`);
    if (operation.op === "remove") delete parent[key];
    else parent[key] = clone(operation.value as JsonValue);
  }
  return next;
}
