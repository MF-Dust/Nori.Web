import { Terminal } from "@xterm/xterm";
import "@xterm/xterm/css/xterm.css";
import { useEffect, useRef } from "react";
import { TerminalLineEditor } from "../terminal/line-editor";
import {
  TerminalShell,
  type TerminalConnectResult,
  type TerminalLocalFileSystem,
  type TerminalPreviewFile,
  type TerminalTranslate,
} from "../terminal/shell";

export interface TerminalEditBridge {
  copyOrInterrupt(): void;
  paste(): void;
}

export interface TerminalWindowProps {
  instanceId: string;
  focused?: boolean;
  translate: TerminalTranslate;
  getLocalFileSystem(): TerminalLocalFileSystem | null;
  connectRemote(host: string): Promise<TerminalConnectResult>;
  launchPreview(file: TerminalPreviewFile): void;
  registerDownload?: (downloadFact: unknown, already?: boolean) => void;
  registerEditBridge?: (
    instanceId: string,
    bridge: TerminalEditBridge | null,
  ) => void;
  playCue?: (
    cue:
      | "webapps-terminal-keystroke"
      | "webapps-terminal-command-run"
      | "webapps-terminal-error"
      | "webapps-terminal-ssh-connect",
    options?: { pitch?: number },
  ) => void;
}

const TERMINAL_THEME = {
  background: "#1e1e1e",
  foreground: "#d4d4d4",
  cursor: "#aeafad",
  selectionBackground: "#264f78",
  black: "#000000",
  red: "#cd3131",
  green: "#0dbc79",
  yellow: "#e5e510",
  blue: "#2472c8",
  magenta: "#bc3fbc",
  cyan: "#11a8cd",
  white: "#e5e5e5",
  brightBlack: "#666666",
  brightRed: "#f14c4c",
  brightGreen: "#23d18b",
  brightYellow: "#f5f543",
  brightBlue: "#3b8eea",
  brightMagenta: "#d670d6",
  brightCyan: "#29b8db",
  brightWhite: "#e5e5e5",
} as const;

const FOCUS_RETRY_MS = 1_000;

function fitTerminal(terminal: Terminal, container: HTMLElement): void {
  const terminalElement = terminal.element;
  if (!terminalElement) return;

  const measure = terminalElement.querySelector<HTMLElement>(
    ".xterm-char-measure-element",
  );
  const charRect = measure?.getBoundingClientRect();
  if (!charRect || charRect.width <= 0 || charRect.height <= 0) return;

  const viewport = terminalElement.querySelector<HTMLElement>(".xterm-viewport");
  const scrollbarWidth = viewport
    ? Math.max(0, viewport.offsetWidth - viewport.clientWidth)
    : 0;
  const availableWidth = Math.max(0, container.clientWidth - scrollbarWidth);
  const availableHeight = Math.max(0, container.clientHeight);
  const cols = Math.max(2, Math.floor(availableWidth / charRect.width));
  const rows = Math.max(1, Math.floor(availableHeight / charRect.height));

  if (cols !== terminal.cols || rows !== terminal.rows) terminal.resize(cols, rows);
}

/**
 * Maintainable reconstruction of the shipped TerminalWindow presentation.
 * The original FitAddon behavior is reproduced with xterm's own character
 * measurement node so this source tree does not need an extra package that is
 * absent from the repository lockfile.
 */
export function TerminalWindow({
  instanceId,
  focused = false,
  translate,
  getLocalFileSystem,
  connectRemote,
  launchPreview,
  registerDownload,
  registerEditBridge,
  playCue,
}: TerminalWindowProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const terminalRef = useRef<Terminal | null>(null);
  const editorRef = useRef<TerminalLineEditor | null>(null);
  const runtimeRef = useRef({
    translate,
    getLocalFileSystem,
    connectRemote,
    launchPreview,
    registerDownload,
    registerEditBridge,
    playCue,
  });
  runtimeRef.current = {
    translate,
    getLocalFileSystem,
    connectRemote,
    launchPreview,
    registerDownload,
    registerEditBridge,
    playCue,
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let disposed = false;
    let terminal: Terminal | null = null;
    let editor: TerminalLineEditor | null = null;
    let resizeObserver: ResizeObserver | null = null;
    let resizeAnimationFrame = 0;

    const fit = () => {
      if (!disposed && terminal && containerRef.current) {
        fitTerminal(terminal, containerRef.current);
      }
    };
    const scheduleFit = () => {
      if (resizeAnimationFrame) cancelAnimationFrame(resizeAnimationFrame);
      resizeAnimationFrame = requestAnimationFrame(() => {
        resizeAnimationFrame = 0;
        fit();
      });
    };

    const fontReady =
      typeof document !== "undefined" && document.fonts
        ? Promise.all([
            document.fonts.load("14px 'IBM Plex Mono'"),
            document.fonts.load("14px 'Noto Sans SC'"),
          ]).catch(() => undefined)
        : Promise.resolve();

    void fontReady.then(() => {
      if (disposed) return;

      terminal = new Terminal({
        cursorBlink: true,
        fontSize: 14,
        fontFamily: "'IBM Plex Mono', 'Noto Sans SC', 'Courier New', monospace",
        scrollback: 1_000,
        theme: TERMINAL_THEME,
      });
      terminal.open(container);

      editor = new TerminalLineEditor(terminal, {
        onKeystroke: () =>
          runtimeRef.current.playCue?.("webapps-terminal-keystroke", {
            pitch: 0.92 + Math.random() * 0.16,
          }),
      });
      terminalRef.current = terminal;
      editorRef.current = editor;

      const io = {
        println: (text = "") => editor?.println(text),
        clear: () => terminal?.clear(),
      };
      const shell = new TerminalShell({
        io,
        translate: (key, params) => runtimeRef.current.translate(key, params),
        getLocalFileSystem: () => runtimeRef.current.getLocalFileSystem(),
        connectRemote: (host) => runtimeRef.current.connectRemote(host),
        launchPreview: (file) => runtimeRef.current.launchPreview(file),
        registerDownload: (downloadFact, already) =>
          runtimeRef.current.registerDownload?.(downloadFact, already),
        onCommandRun: () =>
          runtimeRef.current.playCue?.("webapps-terminal-command-run"),
        onError: () => runtimeRef.current.playCue?.("webapps-terminal-error"),
        onSshConnected: () =>
          runtimeRef.current.playCue?.("webapps-terminal-ssh-connect"),
      });
      editor.setCompleter(shell.completer);
      editor.println("Terminal v1.0");
      editor.println(runtimeRef.current.translate("terminal.ready"));
      editor.println("");

      const readLoop = async () => {
        while (!disposed && editor) {
          const line = await editor.read(shell.prompt);
          if (disposed) return;
          await shell.run(line);
        }
      };
      void readLoop().catch(() => undefined);

      runtimeRef.current.registerEditBridge?.(instanceId, {
        copyOrInterrupt: () => {
          if (!terminal || !editor) return;
          const selection = terminal.getSelection();
          if (selection) {
            navigator.clipboard?.writeText(selection).catch(() => undefined);
            terminal.clearSelection();
          } else {
            editor.interrupt();
          }
        },
        paste: () => {
          navigator.clipboard
            ?.readText()
            .then((text) => {
              if (text) editor?.paste(text);
            })
            .catch(() => undefined);
        },
      });

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          fit();
          setTimeout(fit, 0);
        });
      });

      resizeObserver = new ResizeObserver(scheduleFit);
      resizeObserver.observe(container);
      window.addEventListener("resize", scheduleFit);
    });

    return () => {
      disposed = true;
      if (resizeAnimationFrame) cancelAnimationFrame(resizeAnimationFrame);
      window.removeEventListener("resize", scheduleFit);
      resizeObserver?.disconnect();
      runtimeRef.current.registerEditBridge?.(instanceId, null);
      editor?.dispose();
      terminal?.dispose();
      editorRef.current = null;
      terminalRef.current = null;
    };
  }, [instanceId]);

  useEffect(() => {
    if (!focused) return;
    let frame = 0;
    const deadline = performance.now() + FOCUS_RETRY_MS;
    const focus = () => {
      const terminal = terminalRef.current;
      const container = containerRef.current;
      if (terminal && container) {
        const alreadyFocused = container.contains(document.activeElement);
        if (!alreadyFocused) terminal.focus();
        if (container.contains(document.activeElement)) return;
      }
      if (performance.now() < deadline) frame = requestAnimationFrame(focus);
    };
    frame = requestAnimationFrame(focus);
    return () => cancelAnimationFrame(frame);
  }, [focused]);

  return (
    <div
      ref={containerRef}
      className="terminal-container"
      style={{ width: "100%", height: "100%", margin: 0 }}
    />
  );
}
