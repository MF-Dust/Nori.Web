"""Local restoration of the story RPCs omitted from the archived server.

Vault answers come from the shipped Doodle/cult pages; NAS hosts come from
Han Yue's homelab post. The server's Daniel replies and app metadata were not
archived, so the prompts below use only clues present in the shipped content.
"""
from __future__ import annotations

import posixpath
import re
import unicodedata
from typing import Any

VAULTS = {
    "bookcipher": {
        "title": "账户恢复码", "vault_path": "文稿/账户恢复码",
        "unpack_to": "文稿", "vault_kind": "folder",
        "unlocked_when": "bookcipher.solved", "available_when": "paper.downloaded",
        "hint": "我论文里面的诗。他没能拯救的她的名字。",
        "answers": ("欧律狄刻", "eurydice"),
    },
    "cult": {
        "title": "宇宙真相.zip", "vault_path": "下载/宇宙真相.zip",
        "vault_kind": "zip", "unlocked_when": "cult.unpacked",
        "available_when": "cult.zip.downloaded", "hint": "播客中的六位数字。",
        "answers": ("978208",),
    },
}

# ponytail: archived server questions are missing; reuse the existing Signal and
# Pulse clues rather than invent inaccessible answers or an external AI service.
DANIEL_QUESTIONS = (
    "身份核验 1/3：丹尼尔在 Signal 里说要去店里接猫，是几月几日？（月-日）",
    "身份核验 2/3：丹尼尔在 Pulse 上发「生日快乐~」是几月几日？（月-日）",
    "身份核验 3/3：Signal 照片里的猫是什么花色？",
)
NAS_HOSTS = {"198.51.100.74", "ft-homenas.local", "nas.hanyue.tech"}
NAS_FILENAME = "deep-dive-consent-review.pdf"
NAS_FACT = "download.hanyue_consent"


def app_artifacts() -> list[dict[str, Any]]:
    return [{
        "id": f"app.vault.{key}", "type": "app",
        "data": {"app_kind": "password_prompt", "command": "vault.unlock",
                 "puzzle_id": key, "placeholder": "输入口令",
                 **{k: v for k, v in data.items() if k != "answers"}},
    } for key, data in VAULTS.items()]


def _normal(value: Any) -> str:
    return unicodedata.normalize("NFKC", str(value or "")).strip().casefold()


def _emit(dispatcher: Any, fact_id: str, source: str) -> None:
    dispatcher._dispatch_manifold({"type": "client.emitFact", "factId": fact_id, "source": source})


def _patch(dispatcher: Any, **variables: Any) -> None:
    dispatcher._dispatch_manifold({"type": "patchVariables", "variablesPatch": variables})


def _date_answer(answer: str, month: int, day: int) -> bool:
    parts = re.findall(r"\d+", answer)
    if len(parts) == 3 and len(parts[0]) == 4:
        parts = parts[1:]
    if len(parts) == 1 and len(parts[0]) in (3, 4):
        return int(parts[0]) == month * 100 + day
    return len(parts) == 2 and [int(p) for p in parts] == [month, day]


def _verify_daniel(dispatcher: Any, payload: dict[str, Any], facts: dict[str, Any]) -> dict[str, Any]:
    if not facts.get("daniel.deadman.delivered") or not facts.get("signal_daniel.unlocked"):
        return {"ok": False, "reply": ["身份核验尚未开放。"]}
    if facts.get("daniel.evidence_unlocked"):
        return {"ok": True, "reply": ["核验已通过，附件已交付。"]}
    step = min(3, max(0, int(dispatcher._variables().get("danielVerifyStep") or 0)))
    answer = _normal(payload.get("answer"))
    if not answer or answer == "/verify":
        _emit(dispatcher, "daniel.verify.started", "signal.daniel.verify")
        return {"ok": True, "reply": [DANIEL_QUESTIONS[min(step, 2)]]}
    if not facts.get("daniel.verify.started"):
        return {"ok": False, "reply": ["请先回复 /verify 开始。"]}
    correct = (_date_answer(answer, 2, 13) if step == 0 else
               _date_answer(answer, 3, 6) if step == 1 else
               answer in {"银虎斑", "银色虎斑", "silver tabby"})
    if not correct:
        return {"ok": False, "reply": ["答案不匹配，请再查看 Signal 记录或 Pulse 主页。", DANIEL_QUESTIONS[min(step, 2)]]}
    step += 1
    _patch(dispatcher, danielVerifyStep=step)
    if step >= 3:
        _emit(dispatcher, "daniel.evidence_unlocked", "signal.daniel.verify")
        return {"ok": True, "reply": ["身份核验通过。依据主人的预设指令，向你交付「子午线邮报-撤稿往来.pdf」。"]}
    return {"ok": True, "reply": ["答案匹配。", DANIEL_QUESTIONS[step]]}


def _nas(dispatcher: Any, command: str, payload: dict[str, Any], facts: dict[str, Any]) -> dict[str, Any]:
    if command == "nas.connect":
        host = _normal(payload.get("host"))
        if host not in NAS_HOSTS:
            return {"ok": False, "error": "connection refused"}
        _patch(dispatcher, nasHost=host)
        _emit(dispatcher, "nas.connected", "nas.connect")
        return {"ok": True, "motd": "FT-HOMENAS 4.2.1 — Han Yue home archive"}
    if not dispatcher._variables().get("nasHost"):
        return {"ok": False, "error": "not connected"}
    raw = str(payload.get("path") or "/")
    path = posixpath.normpath("/" + raw.lstrip("/"))
    if command == "nas.list":
        if path != "/":
            return {"ok": False, "error": "没有那个目录"}
        return {"ok": True, "entries": [{"name": "README.txt", "kind": "file"}, {"name": NAS_FILENAME, "kind": "file"}]}
    if command == "nas.read":
        if path == "/README.txt":
            return {"ok": True, "text": f"韩越的工作资料备份。\n{NAS_FILENAME}\n二进制 PDF，请用 download 下载后在文件应用中查看。"}
        return {"ok": False, "error": "二进制文件，请用 download 下载" if path == f"/{NAS_FILENAME}" else "没有那个文件"}
    if command == "nas.download":
        if path != f"/{NAS_FILENAME}":
            return {"ok": False, "error": "没有那个文件"}
        already = bool(facts.get(NAS_FACT))
        _emit(dispatcher, NAS_FACT, "nas.download")
        return {"ok": True, "filename": NAS_FILENAME, "downloadFact": NAS_FACT, "already": already}
    return {"ok": False, "error": "unknown NAS command"}


def run_story_command(dispatcher: Any, command: str, payload: dict[str, Any]) -> dict[str, Any] | None:
    manifold = dispatcher._manifold()
    facts = manifold.state.get("facts", {}) if manifold is not None else {}
    if command in {"puzzle.verify", "vault.unlock", "unseal_volume"} and not payload.get("factId"):
        key = str(payload.get("puzzleId") or payload.get("volumeId") or "")
        vault = VAULTS.get(key)
        if vault is None:
            return {"ok": False, "error": "unknown vault"}
        if not dispatcher.world.full_unlock and not facts.get(vault["available_when"]):
            return {"ok": False, "error": "vault is not available"}
        tokens = payload.get("tokens")
        token = tokens[0] if isinstance(tokens, list) and len(tokens) == 1 else payload.get("token")
        if _normal(token) not in vault["answers"]:
            return {"ok": False, "error": "incorrect passphrase"}
        _emit(dispatcher, vault["unlocked_when"], "vault.unlock")
        return {"ok": True, "fact": vault["unlocked_when"]}
    if command == "bounty.installExtension":
        _emit(dispatcher, "bounty.ext_installed", "bounty.installExtension")
        return {"ok": True}
    if command == "signal.daniel.verify":
        return _verify_daniel(dispatcher, payload, facts)
    if command.startswith("nas."):
        return _nas(dispatcher, command, payload, facts)
    return None
