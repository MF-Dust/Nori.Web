import type { FilesAppModel } from "./files";
import { buildFilesTree, findFilesTreeNode } from "./files-tree";
import type { ManifoldService } from "../services/manifold";
import type {
  TerminalLocalFileSystem,
  TerminalConnectResult,
  TerminalListResult,
  TerminalReadResult,
  TerminalDownloadResult,
} from "../terminal/shell";

/** Files and nas.* protocol adapters recovered from TerminalWindow. */
export function createTerminalLocalFileSystem(
  files: FilesAppModel,
): TerminalLocalFileSystem {
  const tree = async () =>
    buildFilesTree((await files.presentation()).files, []);
  async function resolveFile(path: string) {
    const parts = path.split("/").filter(Boolean),
      name = parts.pop();
    return (
      findFilesTreeNode(await tree(), parts.join("/"))?.files.find(
        (file) => file.name === name,
      ) ?? null
    );
  }
  return {
    async list(path) {
      const folder = findFilesTreeNode(
        await tree(),
        path.replace(/^\/+|\/+$/g, ""),
      );
      if (!folder) return { ok: false, error: "没有那个文件或目录" };
      return {
        ok: true,
        entries: [
          ...[...folder.folders.values()].map(({ name }) => ({
            name,
            kind: "dir" as const,
          })),
          ...folder.files.map(({ name }) => ({ name, kind: "file" as const })),
        ],
      };
    },
    async readText(path) {
      const file = await resolveFile(path);
      return !file
        ? { ok: false, error: "没有那个文件或目录" }
        : file.kind !== "text"
          ? { ok: false, error: "二进制文件，请用 open 打开" }
          : { ok: true, text: file.content };
    },
    resolveFile,
  };
}
export async function connectTerminalRemote(
  manifold: ManifoldService,
  host: string,
): Promise<TerminalConnectResult> {
  const connection = await manifold.commandResult<{
    ok: boolean;
    error?: string;
    motd?: string;
  }>("nas.connect", { host });
  if (!connection.ok) return connection;
  return {
    ...connection,
    fileSystem: {
      list: (path) =>
        manifold.commandResult<TerminalListResult>("nas.list", { path }),
      readText: (path) =>
        manifold.commandResult<TerminalReadResult>("nas.read", { path }),
      download: (path) =>
        manifold.commandResult<TerminalDownloadResult>("nas.download", {
          path,
        }),
    },
  };
}
