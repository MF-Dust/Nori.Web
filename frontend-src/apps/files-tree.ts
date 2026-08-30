import {
  FILES_DEFAULT_FOLDERS,
  type FilesRecoveredFile,
  type FilesVault,
} from "./files";

export interface FilesTreeVault extends FilesVault {
  unlocked: boolean;
}

export interface FilesTreeNode {
  name: string;
  path: string;
  folders: Map<string, FilesTreeNode>;
  files: FilesRecoveredFile[];
  vaults: FilesTreeVault[];
}

function node(name: string, path: string): FilesTreeNode {
  return { name, path, folders: new Map(), files: [], vaults: [] };
}

export function joinFilesPath(parent: string, child: string): string {
  return parent ? `${parent}/${child}` : child;
}

function ensureFolder(root: FilesTreeNode, path: string): FilesTreeNode {
  if (!path) return root;
  let current = root;
  let resolved = "";
  for (const segment of path.split("/")) {
    resolved = joinFilesPath(resolved, segment);
    let next = current.folders.get(segment);
    if (!next) {
      next = node(segment, resolved);
      current.folders.set(segment, next);
    }
    current = next;
  }
  return current;
}

export function buildFilesTree(
  files: readonly FilesRecoveredFile[],
  vaults: readonly FilesVault[],
  unlockedFacts: ReadonlySet<string> = new Set(),
): FilesTreeNode {
  const root = node("", "");
  for (const folder of FILES_DEFAULT_FOLDERS) ensureFolder(root, folder);
  for (const file of files) ensureFolder(root, file.folderPath).files.push(file);

  for (const vault of vaults) {
    if (!vault.vaultPath) continue;
    const parts = vault.vaultPath.split("/");
    const name = parts.at(-1) ?? vault.vaultPath;
    const parentPath = parts.slice(0, -1).join("/");
    const parent = ensureFolder(root, parentPath);
    const unlocked = vault.unlockedFact ? unlockedFacts.has(vault.unlockedFact) : false;

    if (vault.vaultKind === "file") {
      if (parent.files.some((file) => file.name === name)) continue;
      parent.vaults.push({ ...vault, unlocked });
      if (unlocked && vault.unpackTo) ensureFolder(root, vault.unpackTo);
      continue;
    }

    if (!parent.folders.has(name)) parent.vaults.push({ ...vault, unlocked });
  }
  return root;
}

export function findFilesTreeNode(root: FilesTreeNode, path: string): FilesTreeNode | null {
  if (!path) return root;
  let current: FilesTreeNode | undefined = root;
  for (const segment of path.split("/")) {
    current = current.folders.get(segment);
    if (!current) return null;
  }
  return current;
}

export function filesBreadcrumbs(path: string): Array<{ name: string; path: string }> {
  if (!path) return [];
  const crumbs: Array<{ name: string; path: string }> = [];
  let resolved = "";
  for (const segment of path.split("/")) {
    resolved = joinFilesPath(resolved, segment);
    crumbs.push({ name: segment, path: resolved });
  }
  return crumbs;
}

export function sortedFilesFolders(node: FilesTreeNode): FilesTreeNode[] {
  return [...node.folders.values()].sort((left, right) => left.name.localeCompare(right.name));
}
