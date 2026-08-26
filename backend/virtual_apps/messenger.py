import time
from typing import Dict, Any, List

THREADS: Dict[str, Dict[str, Any]] = {
    "nori": {
        "id": "thread_nori",
        "name": "Nori",
        "avatar": "/icon.png",
        "status": "online",
        "messages": [
            {
                "id": "msg_01",
                "sender": "nori",
                "text": "操作员，听到我这边的信号了吗？",
                "timestamp": int(time.time() * 1000) - 60000
            },
            {
                "id": "msg_02",
                "sender": "nori",
                "text": "如果你在终端或者桌面发消息，我随时都会回应你哦！",
                "timestamp": int(time.time() * 1000) - 30000
            }
        ]
    },
    "system_alert": {
        "id": "thread_alert",
        "name": "System Dispatcher",
        "avatar": "/inori-logo.png",
        "status": "offline",
        "messages": [
            {
                "id": "msg_03",
                "sender": "system",
                "text": "[Security Link] Terminal heartbeat active.",
                "timestamp": int(time.time() * 1000) - 120000
            }
        ]
    }
}

def get_messenger_threads() -> List[Dict[str, Any]]:
    return list(THREADS.values())

def send_message_to_thread(thread_id: str, text: str) -> Dict[str, Any]:
    if thread_id not in THREADS:
        THREADS[thread_id] = {
            "id": thread_id,
            "name": thread_id.capitalize(),
            "avatar": "/icon.png",
            "status": "online",
            "messages": []
        }
    msg = {
        "id": f"msg_{int(time.time() * 1000)}",
        "sender": "player",
        "text": text,
        "timestamp": int(time.time() * 1000)
    }
    THREADS[thread_id]["messages"].append(msg)
    return msg
