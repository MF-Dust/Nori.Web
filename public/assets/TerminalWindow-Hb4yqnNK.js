import { j as U } from "./index-CyHAbkO5.js";
import { u as Y, r as d } from "./i18n-DtIC1LRi.js";
import { x as G, a as V } from "./xterm-HnSM_fe4.js";
import {
  aB as J,
  aC as Z,
  p as R,
  z as Q,
  aD as X,
  E as x,
  aE as ee,
  aF as j,
  I as te,
} from "./NormalApp-Cn6agT0F.js";
import { n as re } from "./downloads-xYYIzO4D.js";
import { r as z, b as ne } from "./tree-BwnCy3ce.js";
import "./download-BfBW5oEI.js";
async function se(e) {
  return J(await Z(e, { artifactType: "file" }));
}
const E = { cursor: { row: 0, col: 0 }, end: { row: 0, col: 0 } };
function ie(e) {
  if (e.length === 0) return "";
  let t = e[0];
  for (const r of e) {
    let n = 0;
    for (; n < t.length && n < r.length && t[n] === r[n];) n += 1;
    if (((t = t.slice(0, n)), !t)) break;
  }
  return t;
}
function oe(e) {
  return e < 32 || e === 127
    ? 0
    : (e >= 4352 && e <= 4447) ||
        e === 9001 ||
        e === 9002 ||
        (e >= 11904 && e <= 42191 && e !== 12351) ||
        (e >= 44032 && e <= 55203) ||
        (e >= 63744 && e <= 64255) ||
        (e >= 65040 && e <= 65049) ||
        (e >= 65072 && e <= 65135) ||
        (e >= 65280 && e <= 65376) ||
        (e >= 65504 && e <= 65510) ||
        (e >= 127744 && e <= 129791) ||
        (e >= 131072 && e <= 262141)
      ? 2
      : 1;
}
function O(e, t, r) {
  const n = { row: t.row, col: t.col };
  for (const s of e) {
    if (
      s ===
      `
`
    ) {
      ((n.row += 1), (n.col = 0));
      continue;
    }
    const o = oe(s.codePointAt(0) ?? 0);
    ((n.col += o), n.col > r && ((n.row += 1), (n.col = o)));
  }
  return (r > 0 && n.col === r && ((n.col = 0), (n.row += 1)), n);
}
class ae {
  term;
  disposable;
  prompt = "";
  promptSize = { row: 0, col: 0 };
  chars = [];
  cursor = 0;
  layout = E;
  history = [];
  histIndex = 0;
  draft = "";
  active = null;
  completer = null;
  completing = !1;
  constructor(t) {
    ((this.term = t), (this.disposable = t.onData(this.onData)));
  }
  setCompleter(t) {
    this.completer = t;
  }
  dispose() {
    (this.disposable.dispose(), (this.active = null));
  }
  read(t) {
    return (
      (this.prompt = t),
      (this.promptSize = O(t, { row: 0, col: 0 }, this.cols())),
      (this.chars = []),
      (this.cursor = 0),
      (this.histIndex = this.history.length),
      (this.draft = ""),
      (this.layout = E),
      this.render(),
      new Promise((r) => {
        this.active = { resolve: r };
      })
    );
  }
  print(t) {
    this.term.write(
      t.replaceAll(
        /\r?\n/g,
        `\r
`,
      ),
    );
  }
  println(t) {
    this.term.write(`${t.replaceAll(
      /\r?\n/g,
      `\r
`,
    )}\r
`);
  }
  paste(t) {
    if (!this.active) return;
    const r = L(t);
    r && (this.insert(r), this.render());
  }
  interrupt() {
    this.active &&
      (this.term.write(
        this.cursorToEnd() +
          `^C\r
`,
      ),
      (this.chars = []),
      (this.cursor = 0),
      (this.histIndex = this.history.length),
      (this.draft = ""),
      (this.layout = E),
      this.render());
  }
  cols() {
    return this.term.cols > 0 ? this.term.cols : 80;
  }
  onData = (t) => {
    if (!this.active) return;
    switch (t) {
      case "\r":
      case `
`:
        this.submit();
        return;
      case "":
      case "\b":
        this.backspace();
        return;
      case "\x1B[D":
      case "\x1BOD":
        this.moveBy(-1);
        return;
      case "\x1B[C":
      case "\x1BOC":
        this.moveBy(1);
        return;
      case "\x1B[A":
      case "\x1BOA":
        this.historyPrev();
        return;
      case "\x1B[B":
      case "\x1BOB":
        this.historyNext();
        return;
      case "\x1B[H":
      case "\x1BOH":
      case "\x1B[1~":
      case "":
        this.moveTo(0);
        return;
      case "\x1B[F":
      case "\x1BOF":
      case "\x1B[4~":
      case "":
        this.moveTo(this.chars.length);
        return;
      case "\x1B[3~":
      case "":
        this.deleteForward();
        return;
      case "":
        this.interrupt();
        return;
      case "":
        this.killToStart();
        return;
      case "\v":
        this.killToEnd();
        return;
      case "":
        this.deleteWord();
        return;
      case "\f":
        this.clearScreen();
        return;
      case "	":
        this.complete();
        return;
    }
    const r = L(t);
    r &&
      (R("webapps-terminal-keystroke", { pitch: 0.92 + Math.random() * 0.16 }),
      this.insert(r),
      this.render());
  };
  async complete() {
    if (!(!this.completer || !this.active || this.completing)) {
      this.completing = !0;
      try {
        const t = this.chars.join(""),
          r = this.cursor,
          n = await this.completer(t, r);
        if (
          !this.active ||
          !n ||
          n.options.length === 0 ||
          this.chars.join("") !== t ||
          this.cursor !== r
        )
          return;
        const s = this.chars.slice(n.start, n.end).join("");
        if (n.options.length === 1) {
          (this.replaceSpan(n.start, n.end, n.options[0].value), this.render());
          return;
        }
        const o = ie(n.options.map((i) => i.value));
        if (o.length > s.length) {
          (this.replaceSpan(n.start, n.end, o), this.render());
          return;
        }
        this.listCandidates(n.options.map((i) => i.display));
      } finally {
        this.completing = !1;
      }
    }
  }
  replaceSpan(t, r, n) {
    const s = [...n];
    (this.chars.splice(t, r - t, ...s), (this.cursor = t + s.length));
  }
  listCandidates(t) {
    (this.term.write(`${this.cursorToEnd()}\r
${t.join("  ")}\r
`),
      (this.layout = E),
      this.render());
  }
  insert(t) {
    const r = [...t];
    (this.chars.splice(this.cursor, 0, ...r), (this.cursor += r.length));
  }
  backspace() {
    this.cursor !== 0 && (this.chars.splice(this.cursor - 1, 1), (this.cursor -= 1), this.render());
  }
  deleteForward() {
    this.cursor >= this.chars.length || (this.chars.splice(this.cursor, 1), this.render());
  }
  moveBy(t) {
    this.moveTo(this.cursor + t);
  }
  moveTo(t) {
    const r = Math.max(0, Math.min(this.chars.length, t));
    r !== this.cursor && ((this.cursor = r), this.render());
  }
  killToStart() {
    this.cursor !== 0 && (this.chars.splice(0, this.cursor), (this.cursor = 0), this.render());
  }
  killToEnd() {
    this.cursor >= this.chars.length || (this.chars.splice(this.cursor), this.render());
  }
  deleteWord() {
    if (this.cursor === 0) return;
    let t = this.cursor;
    for (; t > 0 && this.chars[t - 1] === " ";) t -= 1;
    for (; t > 0 && this.chars[t - 1] !== " ";) t -= 1;
    (this.chars.splice(t, this.cursor - t), (this.cursor = t), this.render());
  }
  clearScreen() {
    (this.term.write("\x1B[H\x1B[2J"), (this.layout = E), this.render());
  }
  setLine(t) {
    ((this.chars = [...t]), (this.cursor = this.chars.length), this.render());
  }
  historyPrev() {
    this.histIndex !== 0 &&
      (this.histIndex === this.history.length && (this.draft = this.chars.join("")),
      (this.histIndex -= 1),
      this.setLine(this.history[this.histIndex] ?? ""));
  }
  historyNext() {
    this.histIndex >= this.history.length ||
      ((this.histIndex += 1),
      this.setLine(
        this.histIndex === this.history.length ? this.draft : (this.history[this.histIndex] ?? ""),
      ));
  }
  submit() {
    const t = this.chars.join("");
    (this.term.write(
      this.cursorToEnd() +
        `\r
`,
    ),
      t.trim() && this.history.at(-1) !== t && this.history.push(t),
      (this.histIndex = this.history.length),
      (this.draft = ""));
    const r = this.active?.resolve;
    ((this.active = null), r?.(t));
  }
  render() {
    const t = this.cols(),
      r = this.chars.join(""),
      n = O(this.chars.slice(0, this.cursor).join(""), this.promptSize, t),
      s =
        this.cursor === this.chars.length
          ? { ...n }
          : O(this.chars.slice(this.cursor).join(""), n, t),
      o = { cursor: n, end: s };
    let i = this.clearOldRows(this.layout);
    ((i += this.prompt + r),
      o.end.col === 0 &&
        o.end.row > 0 &&
        r.at(-1) !==
          `
` &&
        (i += `
`));
    const a = o.end.row - o.cursor.row;
    (a > 0 && (i += `\x1B[${a}A`),
      (i += o.cursor.col > 0 ? `\r\x1B[${o.cursor.col}C` : "\r"),
      this.term.write(i),
      (this.layout = o));
  }
  clearOldRows(t) {
    let r = "";
    const n = Math.max(t.end.row - t.cursor.row, 0);
    n > 0 && (r += `\x1B[${n}B`);
    for (let s = 0; s < t.end.row; s += 1) r += "\r\x1B[0K\x1B[A";
    return ((r += "\r\x1B[0K"), r);
  }
  cursorToEnd() {
    let t = "";
    const r = this.layout.end.row - this.layout.cursor.row;
    return (
      r > 0 && (t += `\x1B[${r}B`),
      (t += le(this.layout.end.col)),
      (this.layout.cursor = { ...this.layout.end }),
      t
    );
  }
}
function le(e) {
  return e > 0 ? `\r\x1B[${e}C` : "\r";
}
const ce = 27;
function L(e) {
  let t = "",
    r = 0;
  for (; r < e.length;) {
    const n = e.charCodeAt(r);
    if (n === ce) {
      if (((r += 1), e[r] === "[")) {
        for (r += 1; r < e.length && /[0-9;]/.test(e[r]);) r += 1;
        r += 1;
      } else r += e[r] === "O" ? 2 : 1;
      continue;
    }
    if (n === 10 || n === 13) {
      for (t += " ", r += 1; r < e.length && (e.charCodeAt(r) === 10 || e.charCodeAt(r) === 13);)
        r += 1;
      continue;
    }
    if (n < 32 || n === 127) {
      r += 1;
      continue;
    }
    ((t += e[r]), (r += 1));
  }
  return t;
}
async function F(e, t, r) {
  const n = await e(t, r);
  if (!n.ok) throw new Error(n.error || "command failed");
  return n.result ?? { ok: !1 };
}
function _(e) {
  return {
    async list(t) {
      const r = await F(e, "nas.list", { path: t });
      return r.ok ? { ok: !0, entries: r.entries ?? [] } : { ok: !1, error: r.error };
    },
    async readText(t) {
      const r = await F(e, "nas.read", { path: t });
      return r.ok ? { ok: !0, text: r.text ?? "" } : { ok: !1, error: r.error };
    },
  };
}
function he(e, t) {
  return F(e, "nas.connect", { host: t });
}
function de(e, t) {
  return F(e, "nas.download", { path: t });
}
function W(e) {
  return e.replace(/^\/+/, "");
}
function N(e, t) {
  const r = W(t).split("/").filter(Boolean);
  if (r.length === 0) return null;
  const n = r.at(-1);
  return z(e, r.slice(0, -1).join("/"))?.files.find((o) => o.name === n) ?? null;
}
function M(e) {
  async function t() {
    return ne(await e(), []);
  }
  return {
    async list(r) {
      const n = z(await t(), W(r));
      if (!n) return { ok: !1, error: "没有那个文件或目录" };
      const s = [...n.folders.values()].map((i) => ({ name: i.name, kind: "dir" })),
        o = n.files.map((i) => ({ name: i.name, kind: "file" }));
      return { ok: !0, entries: [...s, ...o] };
    },
    async readText(r) {
      const n = N(await t(), r);
      return n
        ? n.kind !== "text"
          ? { ok: !1, error: "二进制文件，请用 open 打开" }
          : { ok: !0, text: n.content }
        : { ok: !1, error: "没有那个文件或目录" };
    },
    async resolveFile(r) {
      return N(await t(), r);
    },
  };
}
async function ue(e, t, r) {
  const n = [...e];
  let s = t;
  for (; s > 0 && n[s - 1] !== " ";) s -= 1;
  const o = n.slice(s, t).join(""),
    i = n.slice(0, s).join("").trim();
  if (i === "") {
    const h = r.commands
      .filter((f) => f.startsWith(o))
      .map((f) => ({ value: `${f} `, display: f }));
    return h.length > 0 ? { start: s, end: t, options: h } : null;
  }
  const a = i.split(/\s+/)[0];
  if (!r.pathCommands.has(a)) return null;
  const c = o.lastIndexOf("/"),
    b = c >= 0 ? o.slice(0, c + 1) : "",
    S = c >= 0 ? o.slice(c + 1) : o,
    C = await r.listDir(r.resolveDir(b));
  if (!C) return null;
  let k = C.entries.filter((h) => h.name.startsWith(S));
  r.dirOnlyCommands.has(a) && (k = k.filter((h) => h.kind === "dir"));
  const u = k.map((h) => ({
    value: b + h.name + (h.kind === "dir" ? "/" : " "),
    display: h.name + (h.kind === "dir" ? "/" : ""),
  }));
  return u.length > 0 ? { start: s, end: t, options: u } : null;
}
const fe = {
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
};
function B(e, t) {
  const n = (t.startsWith("/") ? "/" : e).split("/").filter(Boolean);
  for (const s of t.split("/"))
    if (!(s === "" || s === ".")) {
      if (s === "..") {
        n.pop();
        continue;
      }
      n.push(s);
    }
  return "/" + n.join("/");
}
const T = (e) => (t, r) => te(e, t, r),
  D = (e) => () => se(e),
  H = ["help", "clear", "ls", "cd", "cat", "ssh"],
  me = [...H, "open"],
  pe = [...H, "download", "exit"],
  we = new Set(["ls", "cd", "cat", "open", "download"]),
  ge = new Set(["cd"]);
function $(e, t, r) {
  const n = e.session;
  return n
    ? {
        fs: _(T(t)),
        cwd: n.cwd,
        commitCwd: (s) => {
          n.cwd = s;
        },
      }
    : e.getSynced()
      ? {
          fs: M(D(t)),
          cwd: e.localCwd,
          commitCwd: (s) => {
            e.localCwd = s;
          },
        }
      : (l(e, `${r}: ${e.t("terminal.filesLocked")}`), null);
}
function ye(e) {
  const t = e.session,
    r = t ? t.cwd : e.localCwd;
  return {
    commands: t ? pe : me,
    pathCommands: we,
    dirOnlyCommands: ge,
    resolveDir: (n) => B(r, n || "."),
    listDir: async (n) => {
      const s = e.getBinding();
      if (!s || (!t && !e.getSynced())) return null;
      const o = t ? _(T(s)) : M(D(s));
      try {
        const i = await o.list(n);
        return i.ok ? { entries: i.entries } : null;
      } catch {
        return null;
      }
    },
  };
}
function be(e) {
  return (t, r) => ue(t, r, ye(e));
}
function l(e, t) {
  (R("webapps-terminal-error"), e.editor.println(t));
}
function p(e, t, r) {
  return `  ${t.padEnd(17)} - ${e.t(r)}`;
}
function ve(e) {
  const { editor: t } = e;
  (t.println(e.t("terminal.help.title")),
    t.println(p(e, "help", "terminal.help.help")),
    t.println(p(e, "clear", "terminal.help.clear")),
    t.println(p(e, "ls [path]", "terminal.help.ls")),
    t.println(p(e, "cd <path>", "terminal.help.cd")),
    t.println(p(e, "cat <path>", "terminal.help.cat")),
    t.println(p(e, "ssh <host>", "terminal.help.ssh")),
    e.session
      ? (t.println(p(e, "download <path>", "terminal.help.download")),
        t.println(p(e, "exit", "terminal.help.exit")))
      : t.println(p(e, "open <path>", "terminal.help.open")));
}
async function ke(e, t) {
  const { editor: r } = e,
    n = t[0];
  if (!n) {
    l(e, e.t("terminal.ssh.usage"));
    return;
  }
  const s = n.indexOf("@"),
    o = s >= 0 ? n.slice(0, s) : "root",
    i = s >= 0 ? n.slice(s + 1) : n;
  if (!i) {
    l(e, e.t("terminal.ssh.usage"));
    return;
  }
  const a = e.getBinding();
  if (!a) {
    l(e, e.t("terminal.notReady", { cmd: "ssh" }));
    return;
  }
  r.println(e.t("terminal.ssh.connecting", { host: i }));
  try {
    const c = await he(T(a), i);
    if (!c.ok) {
      l(
        e,
        e.t("terminal.ssh.refused", {
          host: i,
          reason: c.error || e.t("terminal.reason.connectionRefused"),
        }),
      );
      return;
    }
    if ((R("webapps-terminal-ssh-connect"), (e.session = { user: o, host: i, cwd: "/" }), c.motd))
      for (const b of c.motd.split(`
`))
        r.println(b);
  } catch (c) {
    l(
      e,
      e.t("terminal.ssh.failed", {
        reason: c instanceof Error ? c.message : e.t("terminal.reason.connectionFailed"),
      }),
    );
  }
}
async function Be(e, t) {
  const { editor: r } = e,
    n = e.getBinding();
  if (!n) {
    l(e, e.t("terminal.notReady", { cmd: "ls" }));
    return;
  }
  const s = $(e, n, "ls");
  if (!s) return;
  const o = B(s.cwd, t[0] ?? ".");
  try {
    const i = await s.fs.list(o);
    if (!i.ok) {
      l(
        e,
        e.t("terminal.ls.cannotAccess", {
          path: o,
          reason: i.error || e.t("terminal.reason.noSuchFile"),
        }),
      );
      return;
    }
    if (i.entries.length === 0) return;
    for (const a of i.entries) r.println(a.kind === "dir" ? `${a.name}/` : a.name);
  } catch (i) {
    l(
      e,
      e.t("terminal.ls.cannotAccess", {
        path: o,
        reason: i instanceof Error ? i.message : e.t("terminal.reason.failed"),
      }),
    );
  }
}
async function Ce(e, t) {
  const r = e.getBinding();
  if (!r) {
    l(e, e.t("terminal.notReady", { cmd: "cd" }));
    return;
  }
  const n = $(e, r, "cd");
  if (!n) return;
  const s = t[0] ?? "/",
    o = B(n.cwd, s);
  try {
    const i = await n.fs.list(o);
    if (!i.ok) {
      l(
        e,
        e.t("terminal.cd.error", {
          target: s,
          reason: i.error || e.t("terminal.reason.noSuchFile"),
        }),
      );
      return;
    }
    n.commitCwd(o);
  } catch (i) {
    l(
      e,
      e.t("terminal.cd.error", {
        target: s,
        reason: i instanceof Error ? i.message : e.t("terminal.reason.failed"),
      }),
    );
  }
}
async function Ee(e, t) {
  const { editor: r } = e,
    n = t[0];
  if (!n) {
    l(e, e.t("terminal.cat.usage"));
    return;
  }
  const s = e.getBinding();
  if (!s) {
    l(e, e.t("terminal.notReady", { cmd: "cat" }));
    return;
  }
  const o = $(e, s, "cat");
  if (!o) return;
  const i = B(o.cwd, n);
  try {
    const a = await o.fs.readText(i);
    if (!a.ok) {
      l(
        e,
        e.t("terminal.cat.error", {
          path: i,
          reason: a.error || e.t("terminal.reason.noSuchFile"),
        }),
      );
      return;
    }
    for (const c of a.text.split(`
`))
      r.println(c);
  } catch (a) {
    l(
      e,
      e.t("terminal.cat.error", {
        path: i,
        reason: a instanceof Error ? a.message : e.t("terminal.reason.failed"),
      }),
    );
  }
}
async function Se(e, t) {
  const { editor: r } = e,
    n = t[0];
  if (!n) {
    l(e, e.t("terminal.open.usage"));
    return;
  }
  if (e.session) {
    l(e, e.t("terminal.open.remoteOnly"));
    return;
  }
  if (!e.getSynced()) {
    l(e, `open: ${e.t("terminal.filesLocked")}`);
    return;
  }
  const s = e.getBinding();
  if (!s) {
    l(e, e.t("terminal.notReady", { cmd: "open" }));
    return;
  }
  const o = M(D(s)),
    i = B(e.localCwd, n);
  try {
    const a = await o.resolveFile(i);
    if (!a) {
      l(e, e.t("terminal.open.noSuchFile", { path: i }));
      return;
    }
    (e.launchPreview(a.id), r.println(e.t("terminal.open.opening", { name: a.name })));
  } catch {
    l(e, e.t("terminal.open.noSuchFile", { path: i }));
  }
}
async function Ae(e, t) {
  const { editor: r, session: n } = e;
  if (!n) {
    l(e, e.t("terminal.download.notConnected"));
    return;
  }
  const s = t[0];
  if (!s) {
    l(e, e.t("terminal.download.usage"));
    return;
  }
  const o = e.getBinding();
  if (!o) {
    l(e, e.t("terminal.notReady", { cmd: "download" }));
    return;
  }
  const i = B(n.cwd, s);
  r.println(e.t("terminal.download.downloading", { path: i }));
  try {
    const a = await de(T(o), i);
    if (!a.ok) {
      l(
        e,
        e.t("terminal.download.error", {
          path: i,
          reason: a.error || e.t("terminal.reason.cannotDownload"),
        }),
      );
      return;
    }
    (r.println(e.t("terminal.download.done", { filename: a.filename })),
      re(a.downloadFact, a.already));
  } catch (a) {
    l(
      e,
      e.t("terminal.download.error", {
        path: i,
        reason: a instanceof Error ? a.message : e.t("terminal.reason.failed"),
      }),
    );
  }
}
async function Fe(e, t) {
  const { editor: r, terminal: n, session: s } = e,
    o = t.trim();
  if (!o) return;
  const [i, ...a] = o.split(/\s+/);
  switch (i.toLowerCase()) {
    case "help":
      ve(e);
      break;
    case "clear":
      n.clear();
      break;
    case "ssh":
      await ke(e, a);
      break;
    case "ls":
      await Be(e, a);
      break;
    case "cd":
      await Ce(e, a);
      break;
    case "cat":
      await Ee(e, a);
      break;
    case "open":
      await Se(e, a);
      break;
    case "download":
      await Ae(e, a);
      break;
    case "exit":
      s
        ? (r.println(e.t("terminal.exit.closed", { host: s.host })), (e.session = null))
        : l(e, e.t("terminal.exit.notConnected"));
      break;
    default:
      l(e, e.t("terminal.commandNotFound", { cmd: i }));
  }
}
function Re(e) {
  return e.session ? `${e.session.user}@${e.session.host}:${e.session.cwd} > ` : `${e.localCwd} > `;
}
function q(e) {
  e.editor
    .read(Re(e))
    .then(async (t) => {
      (t.trim() && R("webapps-terminal-command-run"), await Fe(e, t), q(e));
    })
    .catch(() => {});
}
const Te = 1e3;
function Le({ instanceId: e }) {
  const { t } = Y(),
    r = Q(),
    n = X(e),
    s = x("system.repaired"),
    o = ee(),
    i = d.useRef(null),
    a = d.useRef(null),
    c = d.useRef(null),
    b = d.useRef(r),
    S = d.useRef(s),
    C = d.useRef(o),
    k = d.useRef(t);
  return (
    d.useEffect(() => {
      b.current = r;
    }, [r]),
    d.useEffect(() => {
      S.current = s;
    }, [s]),
    d.useEffect(() => {
      C.current = o;
    }, [o]),
    d.useEffect(() => {
      k.current = t;
    }, [t]),
    d.useEffect(() => {
      const u = i.current;
      if (!u) return;
      let h = null,
        f = null,
        v = null,
        w = !1;
      return (
        Promise.all([
          document.fonts.load("14px 'IBM Plex Mono'"),
          document.fonts.load("14px 'Noto Sans SC'"),
        ])
          .catch(() => {})
          .then(() => {
            if (w) return;
            const g = new G.Terminal({
                cursorBlink: !0,
                fontSize: 14,
                fontFamily: "'IBM Plex Mono', 'Noto Sans SC', 'Courier New', monospace",
                scrollback: 1e3,
                theme: fe,
              }),
              A = new V.FitAddon();
            (g.loadAddon(A), g.open(u));
            const y = new ae(g);
            ((h = g),
              (f = y),
              requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                  w ||
                    (A.fit(),
                    setTimeout(() => {
                      w || A.fit();
                    }, 0));
                });
              }),
              (a.current = g),
              (c.current = A));
            const I = (m, K) => k.current(m, K);
            (y.println("Terminal v1.0"), y.println(I("terminal.ready")), y.println(""));
            const P = {
              editor: y,
              terminal: g,
              getBinding: () => b.current,
              session: null,
              localCwd: "/",
              getSynced: () => S.current,
              launchPreview: (m) => {
                C.current?.({ appId: "preview", mode: "launch", args: { fileId: m } });
              },
              t: I,
            };
            (y.setCompleter(be(P)),
              q(P),
              j.set(e, {
                copyOrInterrupt: () => {
                  const m = g.getSelection();
                  m
                    ? (navigator.clipboard?.writeText(m).catch(() => {}), g.clearSelection())
                    : y.interrupt();
                },
                paste: () => {
                  navigator.clipboard
                    ?.readText()
                    .then((m) => {
                      m && y.paste(m);
                    })
                    .catch(() => {});
                },
              }),
              (v = () => c.current?.fit()),
              window.addEventListener("resize", v));
          }),
        () => {
          ((w = !0),
            v && window.removeEventListener("resize", v),
            j.delete(e),
            f?.dispose(),
            h?.dispose(),
            (a.current = null),
            (c.current = null));
        }
      );
    }, [e]),
    d.useEffect(() => {
      if (!i.current) return;
      const u = new ResizeObserver(() => {
        requestAnimationFrame(() => c.current?.fit());
      });
      return (u.observe(i.current), () => u.disconnect());
    }, []),
    d.useEffect(() => {
      if (!n) return;
      let u = 0;
      const h = performance.now() + Te,
        f = () => {
          const v = a.current,
            w = i.current;
          (v &&
            w &&
            (w.contains(document.activeElement) ||
              (v.focus(), w.contains(document.activeElement)))) ||
            (performance.now() < h && (u = requestAnimationFrame(f)));
        };
      return ((u = requestAnimationFrame(f)), () => cancelAnimationFrame(u));
    }, [n]),
    U.jsx("div", {
      ref: i,
      className: "terminal-container",
      style: { width: "100%", height: "100%", margin: 0 },
    })
  );
}
export { Le as TerminalWindow };
