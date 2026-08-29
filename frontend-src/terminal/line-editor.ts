export interface TerminalDisposable {
  dispose(): void;
}

export interface TerminalSurface {
  readonly cols: number;
  onData(listener: (data: string) => void): TerminalDisposable;
  write(data: string): void;
}

export interface CompletionOption {
  value: string;
  display: string;
}

export interface CompletionResult {
  start: number;
  end: number;
  options: CompletionOption[];
}

export type TerminalCompleter = (
  input: readonly string[],
  cursor: number,
) => CompletionResult | null | Promise<CompletionResult | null>;

export interface TerminalLineEditorOptions {
  onKeystroke?: () => void;
}

interface CursorPosition {
  row: number;
  col: number;
}

interface RenderLayout {
  cursor: CursorPosition;
  end: CursorPosition;
}

interface ActiveRead {
  resolve: (value: string) => void;
}

const EMPTY_LAYOUT: RenderLayout = {
  cursor: { row: 0, col: 0 },
  end: { row: 0, col: 0 },
};

function cloneLayout(layout: RenderLayout): RenderLayout {
  return {
    cursor: { ...layout.cursor },
    end: { ...layout.end },
  };
}

function isWideCodePoint(codePoint: number): boolean {
  return (
    (codePoint >= 0x1100 && codePoint <= 0x115f) ||
    codePoint === 0x2329 ||
    codePoint === 0x232a ||
    (codePoint >= 0x2e80 && codePoint <= 0xa4cf && codePoint !== 0x303f) ||
    (codePoint >= 0xac00 && codePoint <= 0xd7a3) ||
    (codePoint >= 0xf900 && codePoint <= 0xfaff) ||
    (codePoint >= 0xfe10 && codePoint <= 0xfe19) ||
    (codePoint >= 0xfe30 && codePoint <= 0xfe6f) ||
    (codePoint >= 0xff00 && codePoint <= 0xff60) ||
    (codePoint >= 0xffe0 && codePoint <= 0xffe6) ||
    (codePoint >= 0x1f300 && codePoint <= 0x1faff) ||
    (codePoint >= 0x20000 && codePoint <= 0x3fffd)
  );
}

export function terminalCodePointWidth(codePoint: number): number {
  if (codePoint < 0x20 || codePoint === 0x7f) return 0;
  return isWideCodePoint(codePoint) ? 2 : 1;
}

function measureText(text: string, start: CursorPosition, columns: number): CursorPosition {
  const position = { ...start };
  const width = Math.max(columns, 1);

  for (const character of text) {
    if (character === "\n") {
      position.row += 1;
      position.col = 0;
      continue;
    }

    position.col += terminalCodePointWidth(character.codePointAt(0) ?? 0);
    if (position.col > width) {
      position.row += 1;
      position.col = terminalCodePointWidth(character.codePointAt(0) ?? 0);
    }
  }

  if (position.col === width && text.length > 0) {
    position.row += 1;
    position.col = 0;
  }
  return position;
}

export function sanitizeTerminalInput(value: string): string {
  let result = "";
  let index = 0;

  while (index < value.length) {
    const code = value.charCodeAt(index);
    if (code === 0x1b) {
      index += 1;
      if (value[index] === "[") {
        index += 1;
        while (index < value.length && /[0-9;]/.test(value[index] ?? "")) index += 1;
        index += 1;
      } else {
        index += value[index] === "O" ? 2 : 1;
      }
      continue;
    }

    if (code === 10 || code === 13) {
      result += " ";
      index += 1;
      while (index < value.length) {
        const next = value.charCodeAt(index);
        if (next !== 10 && next !== 13) break;
        index += 1;
      }
      continue;
    }

    if (code < 32 || code === 127) {
      index += 1;
      continue;
    }

    result += value[index];
    index += 1;
  }

  return result;
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

export class TerminalLineEditor {
  private readonly disposable: TerminalDisposable;
  private prompt = "";
  private promptSize: CursorPosition = { row: 0, col: 0 };
  private chars: string[] = [];
  private cursor = 0;
  private layout = cloneLayout(EMPTY_LAYOUT);
  private history: string[] = [];
  private historyIndex = 0;
  private draft = "";
  private active: ActiveRead | null = null;
  private completer: TerminalCompleter | null = null;
  private completing = false;

  constructor(
    private readonly terminal: TerminalSurface,
    private readonly options: TerminalLineEditorOptions = {},
  ) {
    this.disposable = terminal.onData((data) => this.onData(data));
  }

  setCompleter(completer: TerminalCompleter | null): void {
    this.completer = completer;
  }

  dispose(): void {
    this.disposable.dispose();
    this.active = null;
  }

  read(prompt: string): Promise<string> {
    this.prompt = prompt;
    this.promptSize = measureText(prompt, { row: 0, col: 0 }, this.columns());
    this.chars = [];
    this.cursor = 0;
    this.historyIndex = this.history.length;
    this.draft = "";
    this.layout = cloneLayout(EMPTY_LAYOUT);
    this.render();

    return new Promise((resolve) => {
      this.active = { resolve };
    });
  }

  print(text: string): void {
    this.terminal.write(text.replaceAll(/\r?\n/g, "\r\n"));
  }

  println(text = ""): void {
    this.terminal.write(`${text.replaceAll(/\r?\n/g, "\r\n")}\r\n`);
  }

  paste(text: string): void {
    if (!this.active) return;
    const clean = sanitizeTerminalInput(text);
    if (!clean) return;
    this.insert(clean);
    this.render();
  }

  interrupt(): void {
    if (!this.active) return;
    this.terminal.write(`${this.cursorToEnd()}^C\r\n`);
    this.chars = [];
    this.cursor = 0;
    this.historyIndex = this.history.length;
    this.draft = "";
    this.layout = cloneLayout(EMPTY_LAYOUT);
    this.render();
  }

  private columns(): number {
    return this.terminal.cols > 0 ? this.terminal.cols : 80;
  }

  private onData(data: string): void {
    if (!this.active) return;

    switch (data) {
      case "\r":
      case "\n":
        this.submit();
        return;
      case "\x7f":
      case "\b":
        this.backspace();
        return;
      case "\x1b[D":
      case "\x1bOD":
        this.moveBy(-1);
        return;
      case "\x1b[C":
      case "\x1bOC":
        this.moveBy(1);
        return;
      case "\x1b[A":
      case "\x1bOA":
        this.historyPrevious();
        return;
      case "\x1b[B":
      case "\x1bOB":
        this.historyNext();
        return;
      case "\x1b[H":
      case "\x1bOH":
      case "\x1b[1~":
      case "\x01":
        this.moveTo(0);
        return;
      case "\x1b[F":
      case "\x1bOF":
      case "\x1b[4~":
      case "\x05":
        this.moveTo(this.chars.length);
        return;
      case "\x1b[3~":
      case "\x04":
        this.deleteForward();
        return;
      case "\x03":
        this.interrupt();
        return;
      case "\x15":
        this.killToStart();
        return;
      case "\x0b":
        this.killToEnd();
        return;
      case "\x17":
        this.deleteWord();
        return;
      case "\x0c":
        this.clearScreen();
        return;
      case "\t":
        void this.complete();
        return;
    }

    const clean = sanitizeTerminalInput(data);
    if (!clean) return;
    this.options.onKeystroke?.();
    this.insert(clean);
    this.render();
  }

  private async complete(): Promise<void> {
    if (!this.completer || !this.active || this.completing) return;
    this.completing = true;

    try {
      const before = this.chars.join("");
      const cursor = this.cursor;
      const completion = await this.completer([...this.chars], cursor);
      if (
        !this.active ||
        !completion ||
        completion.options.length === 0 ||
        this.chars.join("") !== before ||
        this.cursor !== cursor
      ) {
        return;
      }

      const current = this.chars.slice(completion.start, completion.end).join("");
      if (completion.options.length === 1) {
        this.replaceSpan(completion.start, completion.end, completion.options[0]?.value ?? "");
        this.render();
        return;
      }

      const prefix = commonPrefix(completion.options.map((option) => option.value));
      if (prefix.length > current.length) {
        this.replaceSpan(completion.start, completion.end, prefix);
        this.render();
        return;
      }

      this.listCandidates(completion.options.map((option) => option.display));
    } finally {
      this.completing = false;
    }
  }

  private replaceSpan(start: number, end: number, value: string): void {
    const replacement = [...value];
    this.chars.splice(start, end - start, ...replacement);
    this.cursor = start + replacement.length;
  }

  private listCandidates(values: readonly string[]): void {
    this.terminal.write(`${this.cursorToEnd()}\r\n${values.join("  ")}\r\n`);
    this.layout = cloneLayout(EMPTY_LAYOUT);
    this.render();
  }

  private insert(value: string): void {
    const characters = [...value];
    this.chars.splice(this.cursor, 0, ...characters);
    this.cursor += characters.length;
  }

  private backspace(): void {
    if (this.cursor === 0) return;
    this.chars.splice(this.cursor - 1, 1);
    this.cursor -= 1;
    this.render();
  }

  private deleteForward(): void {
    if (this.cursor >= this.chars.length) return;
    this.chars.splice(this.cursor, 1);
    this.render();
  }

  private moveBy(delta: number): void {
    this.moveTo(this.cursor + delta);
  }

  private moveTo(index: number): void {
    const next = Math.max(0, Math.min(this.chars.length, index));
    if (next === this.cursor) return;
    this.cursor = next;
    this.render();
  }

  private killToStart(): void {
    if (this.cursor === 0) return;
    this.chars.splice(0, this.cursor);
    this.cursor = 0;
    this.render();
  }

  private killToEnd(): void {
    if (this.cursor >= this.chars.length) return;
    this.chars.splice(this.cursor);
    this.render();
  }

  private deleteWord(): void {
    if (this.cursor === 0) return;
    let start = this.cursor;
    while (start > 0 && this.chars[start - 1] === " ") start -= 1;
    while (start > 0 && this.chars[start - 1] !== " ") start -= 1;
    this.chars.splice(start, this.cursor - start);
    this.cursor = start;
    this.render();
  }

  private clearScreen(): void {
    this.terminal.write("\x1b[H\x1b[2J");
    this.layout = cloneLayout(EMPTY_LAYOUT);
    this.render();
  }

  private setLine(value: string): void {
    this.chars = [...value];
    this.cursor = this.chars.length;
    this.render();
  }

  private historyPrevious(): void {
    if (this.historyIndex === 0) return;
    if (this.historyIndex === this.history.length) this.draft = this.chars.join("");
    this.historyIndex -= 1;
    this.setLine(this.history[this.historyIndex] ?? "");
  }

  private historyNext(): void {
    if (this.historyIndex >= this.history.length) return;
    this.historyIndex += 1;
    this.setLine(
      this.historyIndex === this.history.length ? this.draft : (this.history[this.historyIndex] ?? ""),
    );
  }

  private submit(): void {
    const value = this.chars.join("");
    this.terminal.write(`${this.cursorToEnd()}\r\n`);
    if (value.trim() && this.history.at(-1) !== value) this.history.push(value);
    this.historyIndex = this.history.length;
    this.draft = "";

    const resolve = this.active?.resolve;
    this.active = null;
    resolve?.(value);
  }

  private render(): void {
    const columns = this.columns();
    const text = this.chars.join("");
    const cursor = measureText(this.chars.slice(0, this.cursor).join(""), this.promptSize, columns);
    const end =
      this.cursor === this.chars.length
        ? { ...cursor }
        : measureText(this.chars.slice(this.cursor).join(""), cursor, columns);

    let output = this.clearOldRows(this.layout);
    output += this.prompt + text;
    if (end.col === 0 && end.row > 0 && text.at(-1) !== "\n") output += "\n";

    const rowsUp = end.row - cursor.row;
    if (rowsUp > 0) output += `\x1b[${rowsUp}A`;
    output += cursor.col > 0 ? `\r\x1b[${cursor.col}C` : "\r";
    this.terminal.write(output);
    this.layout = { cursor, end };
  }

  private clearOldRows(layout: RenderLayout): string {
    let output = "";
    const rowsDown = Math.max(layout.end.row - layout.cursor.row, 0);
    if (rowsDown > 0) output += `\x1b[${rowsDown}B`;
    for (let row = 0; row < layout.end.row; row += 1) output += "\r\x1b[0K\x1b[A";
    return `${output}\r\x1b[0K`;
  }

  private cursorToEnd(): string {
    let output = "";
    const rowsDown = this.layout.end.row - this.layout.cursor.row;
    if (rowsDown > 0) output += `\x1b[${rowsDown}B`;
    output += this.layout.end.col > 0 ? `\r\x1b[${this.layout.end.col}C` : "\r";
    this.layout.cursor = { ...this.layout.end };
    return output;
  }
}
