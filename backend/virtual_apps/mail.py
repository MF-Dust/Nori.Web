"""Virtual Mail application service.

When `backend/data/live_world_pack.json` is installed (see
`scraper/import_pack.py`), the archived production mail artifacts are served
verbatim for maximum fidelity, while runtime-sent mail still works on top.
"""

from __future__ import annotations

import time
from typing import Any, Dict, List

from . import live_pack

# ---------------------------------------------------------------------------
# Fallback demo mailbox (used only when no live pack is installed).
# ---------------------------------------------------------------------------
EMAILS: List[Dict[str, Any]] = [
    {
        "id": "mail_welcome",
        "from": "Inori Systems <system@inori.ai>",
        "to": "Operator <operator@nori.ai>",
        "subject": "欢迎接入 NoriOS 终端节点",
        "body_md": "尊敬的操作员：\n\n您的终端已成功同步至 NoriOS 本地运行时核心。Nori Live2D 情绪模型、全部小游戏与系统应用已解锁就绪。\n\n-- Inori OS 运维组",
        "folder": "inbox",
        "date": "2026-08-26 10:00",
        "read_fact": "mail.help.read",
        "read": False,
        "archived": False,
    },
    {
        "id": "mail_memo",
        "from": "Nori <nori@inori.ai>",
        "to": "Operator <operator@nori.ai>",
        "subject": "【日常备忘】今天也请多多指教呀！",
        "body_md": "操作员！\n\n所有应用和游戏（国际象棋、蛋糕决斗、森林寻宝、你画我猜）都已准备好啦！随时可以开始哦！\n\n(Nori 留)",
        "folder": "inbox",
        "date": "2026-08-26 10:05",
        "read": True,
        "archived": False,
    },
]

_runtime_sent: List[Dict[str, Any]] = []


def get_inbox_emails() -> List[Dict[str, Any]]:
    return [e for e in EMAILS if not e.get("archived", False)]


def mark_email_read(mail_id: str) -> bool:
    for pool in (EMAILS, _runtime_sent):
        for e in pool:
            if e["id"] == mail_id:
                e["read"] = True
                return True
    return False


def send_email(to_addr: str, subject: str, body: str) -> Dict[str, Any]:
    new_mail = {
        "id": f"mail_{int(time.time() * 1000)}",
        "from": "Operator <operator@nori.ai>",
        "to": to_addr,
        "subject": subject,
        "date": time.strftime("%Y-%m-%d %H:%M"),
        "body_md": body,
        "folder": "sent",
        "read": True,
        "archived": False,
    }
    _runtime_sent.append(new_mail)
    return new_mail


def _record_to_artifact(mail: Dict[str, Any], index: int) -> Dict[str, Any]:
    now_ms = int(time.time() * 1000)
    return {
        "id": mail["id"],
        "type": "mail",
        "surfacedAt": now_ms - (3600000 - index * 1800000),
        "data": {
            key: value
            for key, value in mail.items()
            if key not in {"id", "archived", "read"} and value is not None
        },
    }


def get_mail_artifacts(now_ms: int | None = None) -> List[Dict[str, Any]]:
    """Export mail objects formatted as Manifold artifacts."""
    if live_pack.is_available():
        artifacts = live_pack.mail_artifacts()
        # include any mails composed during this session on top of the archive
        known_ids = {a["id"] for a in artifacts}
        for i, mail in enumerate(_runtime_sent):
            if mail["id"] not in known_ids:
                artifacts.append(_record_to_artifact(mail, i))
        return artifacts

    now = int(time.time() * 1000) if now_ms is None else now_ms
    artifacts = []
    for index, mail in enumerate(EMAILS):
        artifacts.append(
            {
                "id": mail["id"],
                "type": "mail",
                "surfacedAt": now - (3600000 - index * 1800000),
                "data": {
                    "from": mail["from"],
                    "to": mail["to"],
                    "subject": mail["subject"],
                    "body_md": mail["body_md"],
                    "folder": mail["folder"],
                    "date": mail["date"],
                    **({"read_fact": mail["read_fact"]} if "read_fact" in mail else {}),
                },
            }
        )
    return artifacts
