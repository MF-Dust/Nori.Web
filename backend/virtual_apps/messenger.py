"""Virtual Messenger (Signal-like) application service."""

from __future__ import annotations

import time
from typing import Any, Dict, List

THREADS: Dict[str, Dict[str, Any]] = {
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


def get_signal_thread_artifacts(now_ms: int) -> List[Dict[str, Any]]:
    """Export thread objects formatted as Manifold artifacts."""
    artifacts = []
    for thread in THREADS.values():
        artifacts.append(
            {
                "id": thread["id"],
                "type": "signal_thread",
                "surfacedAt": now_ms - 3600000,
                "data": {
                    "thread_id": thread["thread_id"],
                    "title": thread["title"],
                    "participants": thread["participants"],
                    "avatar_path": thread["avatar_path"],
                },
            }
        )
    return artifacts


def get_signal_message_artifacts(now_ms: int) -> List[Dict[str, Any]]:
    """Export message objects formatted as Manifold artifacts."""
    artifacts = []
    for thread in THREADS.values():
        for msg in thread.get("messages", []):
            artifacts.append(
                {
                    "id": msg["id"],
                    "type": "signal_message",
                    "surfacedAt": now_ms - 60000,
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
