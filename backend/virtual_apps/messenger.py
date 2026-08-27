"""Virtual Messenger (Signal-like) application service.

When the live pack (`live_world_pack.json`) is installed, THREADS is
materialized from the archived production Signal data at import time.
Composing new messages simply appends to the same store, exactly like the
original demo implementation. Without a pack the built-in demo mailbox is
used instead.
"""

from __future__ import annotations

import time
from typing import Any, Dict, List

from . import live_pack

_FALLBACK_THREADS: Dict[str, Dict[str, Any]] = {
    "nori": {
        "id": "thread_nori",
        "thread_id": "nori",
        "title": "Nori",
        "participants": ["nori", "operator"],
        "avatar_path": "/icon.png",
        "status": "online",
        "messages": [
            {
                "id": "msg_01",
                "message_id": "msg_01",
                "thread_id": "nori",
                "sender": "nori",
                "kind": "text",
                "body_md": "操作员，听到我这边的信号了吗？全部功能都已解锁就绪啦！",
                "timestamp": "2026-08-26T10:00:00Z",
            }
        ],
    },
    "system_alert": {
        "id": "thread_alert",
        "thread_id": "system_alert",
        "title": "System Dispatcher",
        "participants": ["system", "operator"],
        "avatar_path": "/inori-logo.png",
        "status": "offline",
        "messages": [
            {
                "id": "msg_02",
                "message_id": "msg_02",
                "thread_id": "system_alert",
                "sender": "system",
                "kind": "text",
                "body_md": "[Security Link] Terminal heartbeat active.",
                "timestamp": "2026-08-26T09:50:00Z",
            }
        ],
    },
}

_THREAD_KEYS_EXCLUDED = {"thread_id", "title", "participants", "avatar_path",
                         "status", "messages"}
_MESSAGE_KEYS_EXCLUDED = {"thread_id", "message_id", "sender", "kind",
                          "body_md", "timestamp"}


def _pack_threads() -> Dict[str, Dict[str, Any]]:
    """Materialize archived threads + messages into interactive stores."""
    threads: Dict[str, Dict[str, Any]] = {}
    for art in live_pack.signal_thread_artifacts():
        d = art.get("data", {})
        tid = d.get("thread_id") or art.get("id", "")
        extra = {k: v for k, v in d.items() if k not in _THREAD_KEYS_EXCLUDED}
        threads[tid] = {
            "id": f"thread_{tid}",
            "thread_id": tid,
            "title": d.get("title") or tid,
            "participants": d.get("participants", []),
            "avatar_path": d.get("avatar_path", "/icon.png"),
            "messages": [],
            **({"status": d["status"]} if d.get("status") else {}),
            **extra,
        }
    for art in live_pack.signal_message_artifacts():
        d = art.get("data", {})
        tid = d.get("thread_id")
        target = threads.get(tid)
        if target is None:
            target = threads.setdefault(tid, {
                "id": f"thread_{tid}",
                "thread_id": tid,
                "title": tid,
                "participants": [],
                "avatar_path": "/icon.png",
                "messages": [],
            })
        msg_extra = {k: v for k, v in d.items() if k not in _MESSAGE_KEYS_EXCLUDED}
        target["messages"].append({
            "id": art.get("id"),
            "message_id": d.get("message_id") or art.get("id"),
            "thread_id": tid,
            "sender": d.get("sender", "?"),
            "kind": d.get("kind", "text"),
            "body_md": d.get("body_md", ""),
            "timestamp": d.get("timestamp", ""),
            **msg_extra,
        })
    for t in threads.values():
        t["messages"].sort(key=lambda m: m.get("timestamp") or "")
    return threads


THREADS: Dict[str, Dict[str, Any]] = (
    _pack_threads() if live_pack.is_available()
    else {k: dict(v) for k, v in _FALLBACK_THREADS.items()}
)


def get_messenger_threads() -> List[Dict[str, Any]]:
    return list(THREADS.values())


def send_message_to_thread(thread_id: str, text: str) -> Dict[str, Any]:
    if thread_id not in THREADS:
        THREADS[thread_id] = {
            "id": f"thread_{thread_id}",
            "thread_id": thread_id,
            "title": thread_id.capitalize(),
            "participants": [thread_id, "operator"],
            "avatar_path": "/icon.png",
            "status": "online",
            "messages": [],
        }
    msg_id = f"msg_{int(time.time() * 1000)}"
    msg = {
        "id": msg_id,
        "message_id": msg_id,
        "thread_id": thread_id,
        "sender": "operator",
        "kind": "text",
        "body_md": text,
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }
    THREADS[thread_id]["messages"].append(msg)
    return msg


def get_signal_thread_artifacts(now_ms: int | None = None) -> List[Dict[str, Any]]:
    """Export thread objects formatted as Manifold artifacts."""
    now = int(time.time() * 1000) if now_ms is None else now_ms
    if live_pack.is_available():
        artifacts: Dict[str, Dict[str, Any]] = {}
        seen_tids = set()
        for art in live_pack.signal_thread_artifacts():
            artifacts[art["id"]] = art
            seen_tids.add((art.get("data") or {}).get("thread_id"))
        for thread in THREADS.values():
            if thread["thread_id"] in seen_tids:
                continue
            artifacts[thread["id"]] = {
                "id": thread["id"],
                "type": "signal_thread",
                "surfacedAt": now - 3600000,
                "data": {
                    key: value for key, value in thread.items()
                    if key != "messages"
                },
            }
        return list(artifacts.values())

    artifacts = []
    for thread in THREADS.values():
        artifacts.append(
            {
                "id": thread["id"],
                "type": "signal_thread",
                "surfacedAt": now - 3600000,
                "data": {
                    "thread_id": thread["thread_id"],
                    "title": thread["title"],
                    "participants": thread["participants"],
                    "avatar_path": thread["avatar_path"],
                },
            }
        )
    return artifacts


def get_signal_message_artifacts(now_ms: int | None = None) -> List[Dict[str, Any]]:
    """Export message objects formatted as Manifold artifacts."""
    now = int(time.time() * 1000) if now_ms is None else now_ms
    if live_pack.is_available():
        artifacts: Dict[str, Dict[str, Any]] = {}
        seen_mids = set()
        for art in live_pack.signal_message_artifacts():
            artifacts[art["id"]] = art
            mid = (art.get("data") or {}).get("message_id") or art["id"]
            seen_mids.add(mid)
        for thread in THREADS.values():
            for msg in thread.get("messages", []):
                if msg["message_id"] in seen_mids:
                    continue
                artifacts[msg["id"]] = {
                    "id": msg["id"],
                    "type": "signal_message",
                    "surfacedAt": now - 60000,
                    "data": {
                        key: value for key, value in msg.items()
                        if key != "id"
                    },
                }
        return list(artifacts.values())

    artifacts = []
    for thread in THREADS.values():
        for msg in thread.get("messages", []):
            artifacts.append(
                {
                    "id": msg["id"],
                    "type": "signal_message",
                    "surfacedAt": now - 60000,
                    "data": {
                        "thread_id": msg["thread_id"],
                        "message_id": msg["message_id"],
                        "sender": msg["sender"],
                        "kind": msg["kind"],
                        "body_md": msg["body_md"],
                        "timestamp": msg["timestamp"],
                    },
                }
            )
    return artifacts
