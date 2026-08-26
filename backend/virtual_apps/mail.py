import time
from typing import Dict, Any, List

EMAILS: List[Dict[str, Any]] = [
    {
        "id": "mail_001",
        "sender": "Inori Systems <system@inori.ai>",
        "subject": "欢迎接入 NoriOS 终端节点",
        "date": "2026-08-26 10:00",
        "body": "尊敬的操作员：\n\n您的终端已成功同步至 NoriOS 本地运行时核心。Nori Live2D 情绪模型与 Arcade World 协议均已就绪。\n\n如需校准通信链路或发起交互，可直接使用桌面系统。\n\n-- Inori OS 运维组",
        "read": False,
        "archived": False
    },
    {
        "id": "mail_002",
        "sender": "Nori <nori@inori.ai>",
        "subject": "【日常备忘】今天也请多多指教呀！",
        "date": "2026-08-26 10:05",
        "body": "操作员！\n\n我已经准备好啦，如果无聊的话随时叫我聊天哦，或者来几局蛋糕决斗！\n\n(Nori 留)",
        "read": True,
        "archived": False
    }
]

def get_inbox_emails() -> List[Dict[str, Any]]:
    return [e for e in EMAILS if not e["archived"]]

def mark_email_read(mail_id: str):
    for e in EMAILS:
        if e["id"] == mail_id:
            e["read"] = True

def send_email(to_addr: str, subject: str, body: str) -> Dict[str, Any]:
    new_mail = {
        "id": f"mail_{int(time.time()*1000)}",
        "sender": "Operator <operator@nori.ai>",
        "to": to_addr,
        "subject": subject,
        "date": time.strftime("%Y-%m-%d %H:%M"),
        "body": body,
        "read": True,
        "archived": False
    }
    EMAILS.append(new_mail)
    return new_mail
