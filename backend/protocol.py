"""Validation and message builders for the public Arcade WebSocket contract.

The shapes here come from the Zod schemas shipped in
`public/assets/i18n-DtIC1LRi.js` (see docs/VERIFIED_PROTOCOL.md).
"""

from __future__ import annotations

from typing import Any, Dict, Iterable, Mapping, Optional

Json = Any

CLIENT_TYPES = {
    "create_world",
    "join_world",
    "leave_world",
    "open_my_web_world",
    "reset_my_web_world",
    "mount_cartridge",
    "unmount_cartridge",
    "dispatch",
    "advance_visibility_fence",
    "ping",
    "event",
}


class ProtocolError(ValueError):
    def __init__(self, code: str, message: str, *, request_id: Optional[str] = None, cartridge_id: Optional[str] = None):
        super().__init__(message)
        self.code = code
        self.message = message
        self.request_id = request_id
        self.cartridge_id = cartridge_id


def _string(value: Any, field: str, *, nonempty: bool = True) -> str:
    if not isinstance(value, str) or (nonempty and not value):
        raise ProtocolError("bad_request", f"{field} must be a non-empty string")
    return value


def _version(value: Any, field: str) -> int:
    # bool is an int subclass in Python but invalid in the wire format.
    if isinstance(value, bool) or not isinstance(value, int) or value < 0:
        raise ProtocolError("bad_request", f"{field} must be a non-negative integer")
    return value


def validate_client_message(value: Any) -> Dict[str, Json]:
    if not isinstance(value, dict):
        raise ProtocolError("bad_request", "message must be an object")
    message_type = _string(value.get("type"), "type")
    if message_type not in CLIENT_TYPES:
        raise ProtocolError("unsupported_message", f"Unsupported message type: {message_type}")

    # Keep unknown fields forward-compatible while enforcing every field that
    # the shipped client uses to correlate a request or state transition.
    if message_type in {"join_world"}:
        _string(value.get("worldId"), "worldId")
    elif message_type in {"mount_cartridge", "unmount_cartridge"}:
        _string(value.get("cartridgeId"), "cartridgeId")
        _string(value.get("requestId"), "requestId")
    elif message_type == "dispatch":
        _string(value.get("actor"), "actor")
        _string(value.get("cartridgeId"), "cartridgeId")
        _string(value.get("requestId"), "requestId")
        _version(value.get("expectedHeadVersion"), "expectedHeadVersion")
        cmd = value.get("cmd")
        if not isinstance(cmd, dict) or not isinstance(cmd.get("type"), str) or not cmd["type"]:
            raise ProtocolError("bad_request", "cmd must be an object with a non-empty type", request_id=value.get("requestId"), cartridge_id=value.get("cartridgeId"))
    elif message_type == "advance_visibility_fence":
        _string(value.get("cartridgeId"), "cartridgeId")
        _string(value.get("visibilityFenceId"), "visibilityFenceId")
        _string(value.get("requestId"), "requestId")
        _version(value.get("version"), "version")
    elif message_type == "event":
        _string(value.get("channel"), "channel")

    return value


def error_message(
    code: str,
    message: str,
    *,
    world_id: Optional[str] = None,
    cartridge_id: Optional[str] = None,
    request_id: Optional[str] = None,
    details: Optional[Mapping[str, Json]] = None,
) -> Dict[str, Json]:
    payload: Dict[str, Json] = {"type": "error", "code": code, "message": message}
    if world_id is not None:
        payload["worldId"] = world_id
    if cartridge_id is not None:
        payload["cartridgeId"] = cartridge_id
    if request_id is not None:
        payload["requestId"] = request_id
    if details:
        payload["details"] = dict(details)
    return payload


def runtime_transition_message(
    *, world_id: str, cartridge_id: str, version: int, transition: Mapping[str, Json]
) -> Dict[str, Json]:
    return {
        "type": "runtime_transition",
        "worldId": world_id,
        "cartridgeId": cartridge_id,
        "version": version,
        "transition": dict(transition),
    }


def visibility_advanced_message(
    *, world_id: str, cartridge_id: str, visibility_fence_id: str, visible_version: int, head_version: int
) -> Dict[str, Json]:
    return {
        "type": "visibility_fence_advanced",
        "worldId": world_id,
        "cartridgeId": cartridge_id,
        "visibilityFenceId": visibility_fence_id,
        "visibleVersion": visible_version,
        "headVersion": head_version,
    }


def dispatch_success_message(
    *, world_id: str, cartridge_id: str, request_id: str, head_version: int, committed: bool, result: Json = None
) -> Dict[str, Json]:
    payload: Dict[str, Json] = {
        "type": "dispatch_ack",
        "worldId": world_id,
        "cartridgeId": cartridge_id,
        "requestId": request_id,
        "success": True,
        "committed": committed,
        "headVersion": head_version,
    }
    if committed:
        payload["committedVersion"] = head_version
    if result is not None:
        payload["result"] = result
    return payload


def dispatch_failure_message(
    *,
    world_id: str,
    cartridge_id: str,
    request_id: str,
    head_version: int,
    error: str,
    error_code: str,
    stale_visibility_fence: Optional[Mapping[str, Json]] = None,
) -> Dict[str, Json]:
    payload: Dict[str, Json] = {
        "type": "dispatch_ack",
        "worldId": world_id,
        "cartridgeId": cartridge_id,
        "requestId": request_id,
        "success": False,
        "headVersion": head_version,
        "error": error,
        "errorCode": error_code,
    }
    if stale_visibility_fence is not None:
        payload["staleVisibilityFence"] = dict(stale_visibility_fence)
    return payload
