import type { CompletionResult, TerminalCompleter } from "./line-editor";

export interface TerminalDirectoryEntry {
  name: string;
  kind: "dir" | "file";
}

export interface TerminalListResult {
  ok: boolean;
  entries?: TerminalDirectoryEntry[];
  error?: string;
}

export interface TerminalReadResult {
  ok: boolean;
  text?: string;
  error?: string;
}

export interface TerminalFileSystem {
  list(path: string): Promise<TerminalListResult>;
  readText(path: string): Promise<TerminalReadResult>;
}

export interface TerminalDownloadResult {
  ok: boolean;
  filename?: string;
  downloadFact?: unknown;
  already?: boolean;
  error?: string;
}

export interface TerminalRemoteFileSystem extends TerminalFileSystem {
  download(path: string): Promise<TerminalDownloadResult>;
}

export interface TerminalConnectResult {
  ok: boolean;
  error?: string;
  motd?: string;
  fileSystem?: TerminalRemoteFileSystem;
}

export interface TerminalPreviewFile {
  id: string;
  name: string;
}

export interface TerminalLocalFileSystem extends TerminalFileSystem {
  resolveFile(path: string): Promise<TerminalPreviewFile | null>;
}

export interface TerminalShellIo {
  println(text?: string): void;
  clear(): void;
}

export type TerminalTranslate = (
  key: string,
  params?: Readonly<Record<string, string | number>>,
) => string;

export interface TerminalShellOptions {
  io: TerminalShellIo;
  translate: TerminalTranslate;
  getLocalFileSystem: () => TerminalLocalFileSystem | null;
  connectRemote: (host: string) => Promise<TerminalConnectResult>;
  launchPreview: (file: TerminalPreviewFile) => void;
  registerDownload?: (downloadFact: unknown, already?: boolean) => void;
  onCommandRun?: () => void;
  onError?: () => void;
  onSshConnected?: () => void;
}

export interface TerminalRemoteSession {
  user: string;
  host: string;
  cwd: string;
  fileSystem: TerminalRemoteFileSystem;
}

interface ActiveFileSystem {
  fs: TerminalFileSystem;
  cwd: string;
  commitCwd(path: string): void;
}

const BASE_COMMANDS = ["help", "clear", "ls", "cd", "cat", "ssh"] as const;
const LOCAL_COMMANDS = [...BASE_COMMANDS, "open"] as const;
const REMOTE_COMMANDS = [...BASE_COMMANDS, "download", "exit"] as const;
const PATH_COMMANDS = new Set(["ls", "cd", "cat", "open", "download"]);
const DIR_ONLY_COMMANDS = new Set(["cd"]);

export function resolveTerminalPath(cwd: string, target: string): string {
  const parts = (target.startsWith("/") ? "/" : cwd).split("/").filter(Boolean);
  for (const part of target.split("/")) {
    if (!part || part === ".") continue;
    if (part === "..") {
      parts.pop();
      continue;
    }
    parts.push(part);
  }
  return `/${parts.join("/")}`;
}

function commandAndArgs(line: string): { command: string; args: string[] } | null {
  const normalized = line.trim();
  if (!normalized) return null;
  const [command = "", ...args] = normalized.split(/\s+/);
  return { command: command.toLowerCase(), args };
}

function commonPrefix(values: readonly string[]): string {
  if (values.length === 0) return "";
  let prefix = values[0] ?? "";
  for (const value of values.slice(1)) {
    let length = 0;
    while (length < prefix.length && length < value.length && prefix[length] === value[length]) {
      length += 1;
    }
    prefix = prefix.slice(0, length);
    if (!prefix) break;
  }
  return prefix;
}

export class TerminalShell {
  private localCwd = "/";
  private session: TerminalRemoteSession | null = null;

  constructor(private readonly options: TerminalShellOptions) {}

  get prompt(): string {
    if (this.session) {
      return `${this.session.user}@${this.session.host}:${this.session.cwd} > `;
    }
    return `${this.localCwd} > `;
  }

  get remoteSession(): Readonly<TerminalRemoteSession> | null {
    return this.session;
  }

  get completer(): TerminalCompleter {
    return (input, cursor) => this.complete(input, cursor);
  }

  async run(line: string): Promise<void> {
    const parsed = commandAndArgs(line);
    if (!parsed) return;
    this.options.onCommandRun?.();

    switch (parsed.command) {
      case "help":
        this.help();
        return;
      case "clear":
        this.options.io.clear();
        return;
      case "ssh":
        await this.ssh(parsed.args);
        return;
      case "ls":
        await this.list(parsed.args);
        return;
      case "cd":
        await this.changeDirectory(parsed.args);
        return;
      case "cat":
        await this.cat(parsed.args);
        return;
      case "open":
        await this.open(parsed.args);
        return;
      case "download":
        await this.download(parsed.args);
        return;
      case "exit":
        this.exit();
        return;
      default:
        this.error(this.options.translate("terminal.commandNotFound", { cmd: parsed.command }));
    }
  }

  async complete(input: readonly string[], cursor: number): Promise<CompletionResult | null> {
    let start = cursor;
    while (start > 0 && input[start - 1] !== " ") start -= 1;

    const fragment = input.slice(start, cursor).join("");
    const before = input.slice(0, start).join("").trim();
    if (!before) {
      const options = this.commands()
        .filter((command) => command.startsWith(fragment))
        .map((command) => ({ value: `${command} `, display: command }));
      return options.length > 0 ? { start, end: cursor, options } : null;
    }

    const command = before.split(/\s+/)[0]?.toLowerCase() ?? "";
    if (!PATH_COMMANDS.has(command)) return null;

    const slash = fragment.lastIndexOf("/");
    const directoryFragment = slash >= 0 ? fragment.slice(0, slash + 1) : "";
    const nameFragment = slash >= 0 ? fragment.slice(slash + 1) : fragment;
    const directory = resolveTerminalPath(this.cwd(), directoryFragment || ".");
    const active = this.activeFileSystem(command);
    if (!active) return null;

    try {
      const result = await active.fs.list(directory);
      if (!result.ok) return null;
      let entries = (result.entries ?? []).filter((entry) => entry.name.startsWith(nameFragment));
      if (DIR_ONLY_COMMANDS.has(command)) entries = entries.filter((entry) => entry.kind === "dir");
      const options = entries.map((entry) => ({
        value: `${directoryFragment}${entry.name}${entry.kind === "dir" ? "/" : " "}`,
        display: `${entry.name}${entry.kind === "dir" ? "/" : ""}`,
      }));

      if (options.length <= 1) return options.length ? { start, end: cursor, options } : null;
      const prefix = commonPrefix(options.map((option) => option.value));
      if (prefix.length > fragment.length) {
        return {
          start,
          end: cursor,
          options: [{ value: prefix, display: prefix }],
        };
      }
      return { start, end: cursor, options };
    } catch {
      return null;
    }
  }

  private commands(): readonly string[] {
    return this.session ? REMOTE_COMMANDS : LOCAL_COMMANDS;
  }

  private cwd(): string {
    return this.session?.cwd ?? this.localCwd;
  }

  private activeFileSystem(command: string): ActiveFileSystem | null {
    if (this.session) {
      const session = this.session;
      return {
        fs: session.fileSystem,
        cwd: session.cwd,
        commitCwd: (path) => {
          session.cwd = path;
        },
      };
    }

    const fs = this.options.getLocalFileSystem();
    if (!fs) {
      this.error(`${command}: ${this.options.translate("terminal.filesLocked")}`);
      return null;
    }
    return {
      fs,
      cwd: this.localCwd,
      commitCwd: (path) => {
        this.localCwd = path;
      },
    };
  }

  private help(): void {
    const { io, translate } = this.options;
    const row = (command: string, key: string) => `  ${command.padEnd(17)} - ${translate(key)}`;
    io.println(translate("terminal.help.title"));
    io.println(row("help", "terminal.help.help"));
    io.println(row("clear", "terminal.help.clear"));
    io.println(row("ls [path]", "terminal.help.ls"));
    io.println(row("cd <path>", "terminal.help.cd"));
    io.println(row("cat <path>", "terminal.help.cat"));
    io.println(row("ssh <host>", "terminal.help.ssh"));
    if (this.session) {
      io.println(row("download <path>", "terminal.help.download"));
      io.println(row("exit", "terminal.help.exit"));
    } else {
      io.println(row("open <path>", "terminal.help.open"));
    }
  }

  private async ssh(args: readonly string[]): Promise<void> {
    const target = args[0];
    if (!target) {
      this.error(this.options.translate("terminal.ssh.usage"));
      return;
    }

    const separator = target.indexOf("@");
    const user = separator >= 0 ? target.slice(0, separator) : "root";
    const host = separator >= 0 ? target.slice(separator + 1) : target;
    if (!host) {
      this.error(this.options.translate("terminal.ssh.usage"));
      return;
    }

    this.options.io.println(this.options.translate("terminal.ssh.connecting", { host }));
    try {
      const result = await this.options.connectRemote(host);
      if (!result.ok || !result.fileSystem) {
        this.error(
          this.options.translate("terminal.ssh.refused", {
            host,
            reason: result.error || this.options.translate("terminal.reason.connectionRefused"),
          }),
        );
        return;
      }

      this.options.onSshConnected?.();
      this.session = { user, host, cwd: "/", fileSystem: result.fileSystem };
      if (result.motd) {
        for (const line of result.motd.split("\n")) this.options.io.println(line);
      }
    } catch (error) {
      this.error(
        this.options.translate("terminal.ssh.failed", {
          reason:
            error instanceof Error
              ? error.message
              : this.options.translate("terminal.reason.connectionFailed"),
        }),
      );
    }
  }

  private async list(args: readonly string[]): Promise<void> {
    const active = this.activeFileSystem("ls");
    if (!active) return;
    const path = resolveTerminalPath(active.cwd, args[0] ?? ".");
    try {
      const result = await active.fs.list(path);
      if (!result.ok) {
        this.error(
          this.options.translate("terminal.ls.cannotAccess", {
            path,
            reason: result.error || this.options.translate("terminal.reason.noSuchFile"),
          }),
        );
        return;
      }
      for (const entry of result.entries ?? []) {
        this.options.io.println(entry.kind === "dir" ? `${entry.name}/` : entry.name);
      }
    } catch (error) {
      this.error(
        this.options.translate("terminal.ls.cannotAccess", {
          path,
          reason: error instanceof Error ? error.message : this.options.translate("terminal.reason.failed"),
        }),
      );
    }
  }

  private async changeDirectory(args: readonly string[]): Promise<void> {
    const active = this.activeFileSystem("cd");
    if (!active) return;
    const target = args[0] ?? "/";
    const path = resolveTerminalPath(active.cwd, target);
    try {
      const result = await active.fs.list(path);
      if (!result.ok) {
        this.error(
          this.options.translate("terminal.cd.error", {
            target,
            reason: result.error || this.options.translate("terminal.reason.noSuchFile"),
          }),
        );
        return;
      }
      active.commitCwd(path);
    } catch (error) {
      this.error(
        this.options.translate("terminal.cd.error", {
          target,
          reason: error instanceof Error ? error.message : this.options.translate("terminal.reason.failed"),
        }),
      );
    }
  }

  private async cat(args: readonly string[]): Promise<void> {
    const target = args[0];
    if (!target) {
      this.error(this.options.translate("terminal.cat.usage"));
      return;
    }
    const active = this.activeFileSystem("cat");
    if (!active) return;
    const path = resolveTerminalPath(active.cwd, target);
    try {
      const result = await active.fs.readText(path);
      if (!result.ok) {
        this.error(
          this.options.translate("terminal.cat.error", {
            path,
            reason: result.error || this.options.translate("terminal.reason.noSuchFile"),
          }),
        );
        return;
      }
      for (const line of (result.text ?? "").split("\n")) this.options.io.println(line);
    } catch (error) {
      this.error(
        this.options.translate("terminal.cat.error", {
          path,
          reason: error instanceof Error ? error.message : this.options.translate("terminal.reason.failed"),
        }),
      );
    }
  }

  private async open(args: readonly string[]): Promise<void> {
    const target = args[0];
    if (!target) {
      this.error(this.options.translate("terminal.open.usage"));
      return;
    }
    if (this.session) {
      this.error(this.options.translate("terminal.open.remoteOnly"));
      return;
    }
    const fs = this.options.getLocalFileSystem();
    if (!fs) {
      this.error(`open: ${this.options.translate("terminal.filesLocked")}`);
      return;
    }
    const path = resolveTerminalPath(this.localCwd, target);
    try {
      const file = await fs.resolveFile(path);
      if (!file) {
        this.error(this.options.translate("terminal.open.noSuchFile", { path }));
        return;
      }
      this.options.launchPreview(file);
      this.options.io.println(this.options.translate("terminal.open.opening", { name: file.name }));
    } catch {
      this.error(this.options.translate("terminal.open.noSuchFile", { path }));
    }
  }

  private async download(args: readonly string[]): Promise<void> {
    if (!this.session) {
      this.error(this.options.translate("terminal.download.notConnected"));
      return;
    }
    const target = args[0];
    if (!target) {
      this.error(this.options.translate("terminal.download.usage"));
      return;
    }

    const path = resolveTerminalPath(this.session.cwd, target);
    this.options.io.println(this.options.translate("terminal.download.downloading", { path }));
    try {
      const result = await this.session.fileSystem.download(path);
      if (!result.ok) {
        this.error(
          this.options.translate("terminal.download.error", {
            path,
            reason: result.error || this.options.translate("terminal.reason.cannotDownload"),
          }),
        );
        return;
      }
      this.options.io.println(
        this.options.translate("terminal.download.done", { filename: result.filename ?? target }),
      );
      if (result.downloadFact !== undefined) {
        this.options.registerDownload?.(result.downloadFact, result.already);
      }
    } catch (error) {
      this.error(
        this.options.translate("terminal.download.error", {
          path,
          reason: error instanceof Error ? error.message : this.options.translate("terminal.reason.failed"),
        }),
      );
    }
  }

  private exit(): void {
    if (!this.session) {
      this.error(this.options.translate("terminal.exit.notConnected"));
      return;
    }
    const host = this.session.host;
    this.options.io.println(this.options.translate("terminal.exit.closed", { host }));
    this.session = null;
  }

  private error(message: string): void {
    this.options.onError?.();
    this.options.io.println(message);
  }
}
