import time
from typing import Dict, Any, List

VIRTUAL_FS = {
    "/": {
        "type": "dir",
        "children": ["system", "user", "datasea", "games", "logs"]
    },
    "/system": {
        "type": "dir",
        "children": ["kernel.sys", "nori_core.dll", "config.json"]
    },
    "/system/config.json": {
        "type": "file",
        "content": '{"version": "1.0.0", "node": "nori-local-core", "mode": "cloud-linked"}'
    },
    "/user": {
        "type": "dir",
        "children": ["notes.txt", "memento.dat"]
    },
    "/user/notes.txt": {
        "type": "file",
        "content": "NoriOS Operator Memo: Live2D synchronized, WebSocket arcade listening on port 4173."
    },
    "/datasea": {
        "type": "dir",
        "children": ["ocean_coordinates.log"]
    },
    "/datasea/ocean_coordinates.log": {
        "type": "file",
        "content": "Depth: -3200m | Resonance: 98.4% | Beacon: Stable"
    }
}

def execute_terminal_command(cmd_line: str) -> str:
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
        if not target.startswith("/"):
            target = "/" + target
        target = target.rstrip("/") or "/"
        if target in VIRTUAL_FS and VIRTUAL_FS[target]["type"] == "dir":
            return "  ".join(VIRTUAL_FS[target]["children"])
        return f"ls: cannot access '{target}': No such directory"
    elif cmd == "cat":
        if not args:
            return "Usage: cat <filename>"
        target = args[0] if args[0].startswith("/") else "/" + args[0]
        if target in VIRTUAL_FS and VIRTUAL_FS[target]["type"] == "file":
            return VIRTUAL_FS[target]["content"]
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
        return "[SCAN] Link Status: OK (127.0.0.1) | Heat: 0°C | Memory: 100% Intact | Core: Running"
    elif cmd == "reboot":
        return "[SYSTEM] World session reboot signal emitted."
    elif cmd == "clear":
        return "\x1b[2J\x1b[H"
    else:
        return f"{cmd}: command not found. Type 'help' for available commands."
