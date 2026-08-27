"""Generate human-readable Markdown reports from the scraped archive."""
from __future__ import annotations

import json
import re
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "live_archive"
MD = OUT / "markdown"
MD.mkdir(exist_ok=True)

CODEFENCE_RE = re.compile(r"```")


def load(name):
    p = OUT / "artifacts" / f"{name}.json"
    return json.loads(p.read_text(encoding="utf-8")) if p.exists() else []


def md_escape(s: str) -> str:
    return s.replace("\r\n", "\n")


def fmt_ts(ms) -> str:
    try:
        return datetime.fromtimestamp(ms / 1000, tz=timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    except Exception:
        return ""


def report_mail():
    mails = load("mail")
    lines = [f"# 📮 邮件归档（{len(mails)} 封）\n"]
    for m in mails:
        d = m.get("data", {})
        lines.append(f"## {d.get('subject', '(无主题)')}")
        meta = []
        if d.get("from"): meta.append(f"**发件人**: {d['from']}")
        if d.get("to"): meta.append(f"**收件人**: {d['to']}")
        if d.get("date"): meta.append(f"**日期**: {d['date']}")
        if m.get("surfacedAt"): meta.append(f"**出现时间**: {fmt_ts(m['surfacedAt'])}")
        if d.get("folder"): meta.append(f"**文件夹**: {d['folder']}")
        if d.get("read_fact"): meta.append(f"**读取条件**: `{d['read_fact']}`")
        if meta:
            lines.append("\n".join(meta))
        lines.append("")
        body = md_escape(d.get("body_md", ""))
        # fence body safely
        max_run = max((len(x) for x in CODEFENCE_RE.findall(body)), default=0)
        fence = "`" * (3 + max_run)
        lines += [fence, body or "（空）", fence]
        atts = d.get("attachments") or []
        if atts:
            lines.append("**附件**:")
            for a in atts:
                bits = [f"- {a.get('filename')} ({a.get('mime')}, {a.get('size_bytes','?')} B)"]
                if a.get("asset_path"):
                    loc = "live_archive" + a["asset_path"]
                    bits.append(f"[已存档]({loc})")
                if a.get("download_fact"):
                    bits.append(f"下载标记: `{a['download_fact']}`")
                lines.append(" ".join(bits))
        lines.append("")
    (MD / "01_邮件_mail.md").write_text("\n".join(lines), encoding="utf-8")
    return len(mails)


def report_messenger():
    from collections import defaultdict
    threads = load("signal_thread")
    msgs = load("signal_message")
    by = defaultdict(list)
    for m in msgs:
        by[m.get("data", {}).get("thread_id")].append(m)

    def ts_of(mm):
        return mm.get("data", {}).get("timestamp") or ""

    lines = [f"# 💬 Signal 消息归档（{len(threads)} 会话 / {len(msgs)} 条消息）\n"]
    for t in sorted(threads, key=lambda x: x.get("data", {}).get("title", "")):
        d = t.get("data", {})
        tid = d.get("thread_id")
        lines.append(f"## {d.get('title') or tid}")
        if d.get("participants"):
            lines.append(f"- **参与者**: {', '.join(d['participants'])}")
        for k in ("status", "unread_from", "service", "read_fact", "reread"):
            if k in d:
                lines.append(f"- **{k}**: {d[k]}")
        av = (d.get("avatar_path") or "").lstrip("/")
        if av:
            rel = av[len("webAssets/"):] if av.startswith("webAssets/") else av
            loc = OUT / "webAssets" / rel
            lines.append(f"- **头像**: [已存档](../webAssets/{rel})" if loc.exists()
                         else f"- **头像**: /{av}（未存档）")
        lines.append("")
        tms = sorted(by.get(tid, []), key=lambda m: (ts_of(m), m["id"]))
        if tms:
            lines.append("| # | 发送者 | 时间 | 内容 |")
            lines.append("|---|---|---|---|")
            for i, mm in enumerate(tms, 1):
                dd = mm.get("data", {})
                sender = dd.get("sender", "?")
                kind = dd.get("kind", "text")
                body = md_escape(dd.get("body_md") or "").replace("|", "\\|").replace("\n", "<br>")
                if kind != "text" and not body:
                    body = f"[{kind}]"
                if dd.get("asset_path"):
                    p = dd["asset_path"].lstrip("/")
                    rel = p[len("webAssets/"):] if p.startswith("webAssets/") else p
                    okk = (OUT / "webAssets" / rel).exists()
                    ref = f"{'✅' if okk else '❌'} webAssets/{rel}"
                    body = (body + "<br>" if body else "") + f"📎 {ref} " + (dd.get("alt") or "")
                lines.append(f"| {i} | {sender} | {ts_of(mm)} | {body} |")
        else:
            lines.append("_（无消息记录，可能随剧情解锁）_")
        lines.append("")
    (MD / "02_消息_signal.md").write_text("\n".join(lines), encoding="utf-8")
    return len(msgs)


def report_files():
    files = load("file")
    folders: dict[str, list] = {}
    for f in files:
        d = f.get("data", {})
        folders.setdefault(d.get("folder", "(根目录)"), []).append(d)
    lines = [f"# 🗂️ 文件系统归档（{len(files)} 个文件对象）\n"]
    for folder in sorted(folders):
        lines.append(f"## 📁 {folder}")
        lines.append("")
        for d in sorted(folders[folder], key=lambda x: x.get("display_path", "")):
            name = d.get("display_path", "(未命名)")
            size = d.get("size_bytes")
            size_h = f"{size/1024:.0f} KB" if isinstance(size, (int, float)) else (size or "")
            flags = []
            if d.get("corrupted"): flags.append("⚠️ corrupted")
            if d.get("cipher"): flags.append(f"🔐 cipher={d['cipher']}")
            if d.get("read_fact"): flags.append(f"`{d['read_fact']}`")
            line = f"- **{name}** `{d.get('mime','')}` {size_h}"
            if flags:
                line += " — " + " · ".join(flags)
            lines.append(line)
        lines.append("")
    lines.append("---")
    lines.append("# 📄 文件内容全文\n")
    for f in files:
        d = f.get("data", {})
        body = d.get("body_md")
        if not body:
            continue
        lines.append(f"## {d.get('display_path') or f['id']}")
        lines.append("")
        max_run = max((len(x) for x in CODEFENCE_RE.findall(md_escape(body))), default=0)
        fence = "`" * (3 + max_run)
        lines += [fence, md_escape(body), fence]
        lines.append("")
    (MD / "03_文件_files.md").write_text("\n".join(lines), encoding="utf-8")
    return len(files)


def report_browser():
    pages_dir = OUT / "pages"
    entries = []
    for f in pages_dir.glob("*.json"):
        if f.name.startswith("_"):
            continue
        art = json.loads(f.read_text(encoding="utf-8"))
        d = art.get("data", {})
        entries.append({"url": d.get("url", ""), "title": d.get("title", ""),
                        "locales": d.get("supported_locales"), "file": f.name})
    ok_entries = [e for e in entries if e["url"]]
    groups: dict[str, list] = {}
    for e in ok_entries:
        host = re.sub(r"^https?://", "", e["url"]).split("/", 1)[0]
        groups.setdefault(host, []).append(e)
    total_assets = sum(1 for _ in (OUT / "webAssets").rglob("*") if _.is_file())
    lines = [f"# 🌐 内置浏览器站点归档（{len(ok_entries)} 页面 / {len(groups)} 站点）\n",
             f"静态资源: **{total_assets} 个文件** 位于 `live_archive/webAssets/`\n"]
    for host in sorted(groups):
        pages = sorted(groups[host], key=lambda x: x["url"])
        lines.append(f"## https://{host}")
        for p in pages:
            path = p["url"].split("/", 3)[-1] if p["url"].count("/") > 3 else ""
            title = p["title"] or ""
            suffix = f" — {title}" if title else ""
            lines.append(f"- [`/{path}`](pages/{p['file']}){suffix}")
        lines.append("")
    (MD / "04_浏览器_browser.md").write_text("\n".join(lines), encoding="utf-8")
    return len(ok_entries)


def report_world():
    snap = json.loads((OUT / "world_snapshot.json").read_text(encoding="utf-8"))
    carts = snap.get("cartridges", {})
    mw = carts.get("manifold.web")
    lines = ["# 🖥️ 世界状态快照\n"]
    if mw:
        st = mw[0].get("state", {}) if isinstance(mw, list) and mw else {}
        facts = st.get("facts", {})
        variables = st.get("variables", {})
        lines.append(f"## Facts（剧情进度标记，{len(facts)} 条）\n")
        lines.append("| fact | 值 |")
        lines.append("|---|---|")
        for k in sorted(facts):
            v = facts[k]
            if isinstance(v, dict):
                inner = "；".join(f"{ik}: {iv}" for ik, iv in v.items())
                lines.append(f"| {k} | {inner[:120]} |")
            else:
                lines.append(f"| {k} | {v} |")
        lines.append("\n## Variables（运行时变量）\n")
        lines.append("```json")
        lines.append(json.dumps(variables, ensure_ascii=False, indent=2))
        lines.append("```")
    chip = OUT / "chip_status.json"
    if chip.exists():
        lines += ["\n## Chip 状态\n", "```json",
                  json.dumps(json.loads(chip.read_text(encoding="utf-8")),
                             ensure_ascii=False, indent=2), "```"]
    wj = snap.get("world_joined", {})
    lines += [f"\n## 世界 ID：`{(wj.get('world') or {}).get('worldId','')}`",
              f"挂载卡带：`{[c.get('cartridgeId') for c in (wj.get('world') or {}).get('mountedCartridges', [])]}`"]
    (MD / "05_世界状态_world.md").write_text("\n".join(lines), encoding="utf-8")


def main():
    n1 = report_mail()
    n2 = report_messenger()
    n3 = report_files()
    n4 = report_browser()
    report_world()
    total_pages = len(list((OUT / "pages").glob("*.json")))
    total_assets = sum(1 for _ in (OUT / "webAssets").rglob("*") if _.is_file())
    readme = f"""# NoriOS 线上世界完整归档

> 抓取时间：{datetime.now().strftime('%Y-%m-%d %H:%M')}
> 账号：白羽茉風（MF.）· mafushiraha@gmail.com
> 目标：https://os.inori.ai/ （即将关停的全量只读备份）

## 内容清单

| 类别 | 数量 | 报告 | 原始数据 |
|---|---|---|---|
| 📮 邮件 | {n1} 封 | [markdown/01_邮件_mail.md](markdown/01_邮件_mail.md) | artifacts/mail.json |
| 💬 Signal 消息 | 见报告 | [markdown/02_消息_signal.md](markdown/02_消息_signal.md) | artifacts/signal_thread.json, signal_message.json |
| 🗂️ 文件系统 | {n3} 个对象 | [markdown/03_文件_files.md](markdown/03_文件_files.md) | artifacts/file.json |
| 🌐 浏览器站点 | {total_pages} 页面 | [markdown/04_浏览器_browser.md](markdown/04_浏览器_browser.md) | pages/*.json |
| 🖼️ 静态资源 | {total_assets} 文件 | — | webAssets/** |
| 🖥️ 世界状态 | — | [markdown/05_世界状态_world.md](markdown/05_世界状态_world.md) | world_snapshot.json, chip_status.json |

原始通信记录：`transcript.jsonl`（抓取会话中的每一帧 WS 消息）。

## 抓取方式（协议链路）

```
Quetta 浏览器 Cookie（__Secure-better-auth.session_token）
  → Better-Auth /api/auth/get-session          （会话验证）
  → Better-Auth /api/auth/convex/token         （换取 Convex JWT, RS256）
  → Convex POST /api/mutation                  （auth/wsTickets:issueWebUserWsTicket）
  → WSS os.inori.ai/api/arcade/web/v1          （子协议 arcade.v1 + ticket.<JWT>）
     ├─ open_my_web_world           → world_joined（全卡带状态快照）
     ├─ manifold.artifacts.request  → 邮件 / 文件 / Signal 全量 artifacts
     └─ manifold.artifacts.fetch    → browser_page 按链接图谱闭包爬取
  → GET os.inori.ai/webAssets/**               （页面引用的全部静态资源）
```

全程只读：未发送任何 dispatch / command / submit 类指令。
"""
    (OUT / "README.md").write_text(readme, encoding="utf-8")
    print(f"reports done: mail={n1} msgs={n2} files={n3} pages={total_pages} assets={total_assets}")


if __name__ == "__main__":
    main()
