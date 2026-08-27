"""Virtual Terminal command execution service.

Commands operate on a virtual filesystem that merges the built-in demo tree
with directories reconstructed from archived file artifacts (``文稿``、
``下载``、``RSRCH-COLD-VOL`` …) when a live pack is installed.
"""

from __future__ import annotations

import time
from typing import Any, Dict

from . import live_pack

VIRTUAL_FS: Dict[str, Dict[str, Any]] = {
    "/": {
        "type": "dir",
        "children": ["system", "user", "datasea", "games", "logs"],
    },
    "/system": {
        "type": "dir",
        "children": ["kernel.sys", "nori_core.dll", "config.json"],
    },
    "/system/config.json": {
        "type": "file",
        "content": '{"version": "1.0.0", "node": "nori-local-core", "mode": "cloud-linked"}',
    },
}

_MERGED_FS: Dict[str, Dict[str, Any]] | None = None


def _fs() -> Dict[str, Dict[str, Any]]:
    """Return the effective filesystem (merged once per process)."""
    global _MERGED_FS
    if _MERGED_FS is not None:
        return _MERGED_FS
    if not live_pack.is_available():
        _MERGED_FS = VIRTUAL_FS
        return _MERGED_FS

    fs: Dict[str, Dict[str, Any]] = {k: {**v, "children": list(v.get("children", []))}
                                     for k, v in VIRTUAL_FS.items()}

    def ensure_dir(path: str) -> None:
        path = path.rstrip("/") or "/"
        if path == "/" or path in fs:
            return
        parent = path.rsplit("/", 1)[0] or "/"
        ensure_dir(parent)
        name = path.rsplit("/", 1)[-1]
        fs[path] = {"type": "dir", "children": []}
        if name not in fs[parent]["children"]:
            fs[parent]["children"].append(name)

    for art in live_pack.file_artifacts():
        d = art.get("data") or {}
        display = str(d.get("display_path") or "").strip()
        parts = [p for p in display.split("/") if p]
        if not parts:
            continue
        path = "/" + "/".join(parts)
        parent = path.rsplit("/", 1)[0] or "/"
        name = parts[-1]
        ensure_dir(parent)

        body = d.get("body_md")
        node: Dict[str, Any] = {
            "type": "file",
            "mime": d.get("mime", "text/plain"),
            "artifact_id": art.get("id"),
        }
        if body:
            # archived bodies are authoritative – even intentionally
            # "corrupted" ones render their original mojibake payload
            node["content"] = body + (
                "\n[CORRUPTED SECTORS PRESENT]" if d.get("corrupted") else ""
            )
        else:
            asset = d.get("binary_asset_path") or d.get("asset_path")
            size = d.get("size_bytes")
            size_h = f" · {size} bytes" if isinstance(size, int) else ""
            cipher = f" · cipher={d['cipher']}" if d.get("cipher") else ""
            asset_h = f" · {asset}" if asset else ""
            node["content"] = (
                f"[{d.get('mime', 'application/octet-stream')}{size_h}{cipher}"
                f"{asset_h} — 请通过 Files 应用打开]"
            )
        fs[path] = node
        if name not in fs[parent]["children"]:
            fs[parent]["children"].append(name)

    _MERGED_FS = fs
    return fs


def execute_terminal_command(cmd_line: str) -> str:
    fs = _fs()
    parts = cmd_line.strip().split()
    if not parts:
        return ""
    cmd = parts[0].lower()
    args = parts[1:]

    if cmd in ("help", "?"):
        return """NoriOS Terminal Commands:
  help               Show this help message
  ls [path]          List files in virtual directory
  cat <file>         Print file contents
  whoami             Show current user
  date               Show current system time
  ps                 List active virtual processes
  scan               Scan cognitive and network status
  clear              Clear terminal screen
  reboot             Soft restart virtual world core"""
    elif cmd == "ls":
        target = args[0] if args else "/"
        target = target.strip("'\"")
        if not target.startswith("/"):
            target = "/" + target
        target = target.rstrip("/") or "/"
        if target in fs and fs[target]["type"] == "dir":
            children = sorted(fs[target].get("children", []))
            return "  ".join(children) if children else "(empty)"
        return f"ls: cannot access '{target}': No such directory"
    elif cmd == "cat":
        if not args:
            return "Usage: cat <filename>"
        target = args[0].strip("'\"")
        if not target.startswith("/"):
            target = "/" + target
        if target in fs and fs[target]["type"] == "file":
            return fs[target].get("content", "")
        return f"cat: '{target}': No such file"
    elif cmd == "whoami":
        return "operator (uid=1000, gid=1000, roles=[admin, player])"
    elif cmd == "date":
        return time.strftime("%Y-%m-%d %H:%M:%S UTC")
    elif cmd == "ps":
        return """PID   USER      TIME  COMMAND
  1   root      0:01  systemd / nori_core
 12   nori      0:42  arcade_world_server
 88   operator  0:05  terminal_session"""
    elif cmd == "scan":
        variables = live_pack.variables().get("chip") or {}
        heat = variables.get("heat", 0)
        scans = len(live_pack.variables().get("chipScans") or [])
        return (f"[SCAN] Link Status: OK (127.0.0.1) | Heat: {heat} | "
                f"Chip Scans: {scans} | Memory: 100% Intact | Core: Running")
    elif cmd == "reboot":
        return "[SYSTEM] World session reboot signal emitted."
    elif cmd == "clear":
        return "\x1b[2J\x1b[H"
    else:
        return f"{cmd}: command not found. Type 'help' for available commands."
