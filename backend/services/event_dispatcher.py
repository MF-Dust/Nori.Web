"""Event dispatcher for Manifold, Settings, and Virtual App RPC channels."""

from __future__ import annotations

import time
from typing import TYPE_CHECKING, Any, Dict, List, Optional

from ..virtual_apps.browser import get_browser_page
from ..virtual_apps.files import get_file_artifacts
from ..virtual_apps.mail import get_mail_artifacts
from ..virtual_apps.messenger import (
    get_signal_message_artifacts,
    get_signal_thread_artifacts,
)

if TYPE_CHECKING:
    from ..session.world import WorldSession


class EventDispatcher:
    """Dispatches custom event channel messages from WebSocket clients."""

    def __init__(self, world: "WorldSession") -> None:
        self.world = world

    def build_response(
        self,
        response_channel: str,
        payload: Any,
        *,
        cartridge_id: Optional[str] = None,
        request_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        result: Dict[str, Any] = {
            "type": "event",
            "worldId": self.world.world_id,
            "channel": response_channel,
            "payload": payload,
        }
        if cartridge_id is not None:
            result["cartridgeId"] = cartridge_id
        if request_id is not None:
            result["requestId"] = request_id
        return result

    async def handle_event(self, message: Dict[str, Any]) -> Dict[str, Any]:
        channel = message.get("channel", "")
        request_id = message.get("requestId")
        cartridge_id = message.get("cartridgeId")
        payload = message.get("payload") if isinstance(message.get("payload"), dict) else {}
        now = int(time.time() * 1000)

        if channel == "manifold.chip.status":
            return self.build_response(
                "manifold.chip.status.result",
                {"capacity": 3, "heat": 0, "coolEveryMs": 60_000, "serverNowMs": now},
                cartridge_id=cartridge_id,
                request_id=request_id,
            )

        if channel == "manifold.chip.scan":
            return self.build_response(
                "manifold.chip.scan.result",
                {"kind": "readout", "text": "Local manifold link stable."},
                cartridge_id=cartridge_id,
                request_id=request_id,
            )

        if channel == "manifold.artifacts.request":
            req_type = payload.get("artifactType")
            artifacts: List[Dict[str, Any]] = []
            if req_type in {None, "mail"}:
                artifacts.extend(get_mail_artifacts(now))
            if req_type in {None, "file"}:
                artifacts.extend(get_file_artifacts(now))
            if req_type in {None, "signal_thread"}:
                artifacts.extend(get_signal_thread_artifacts(now))
            if req_type in {None, "signal_message"}:
                artifacts.extend(get_signal_message_artifacts(now))
            return self.build_response(
                "manifold.artifacts.response",
                {"ok": True, "artifacts": artifacts},
                cartridge_id=cartridge_id,
                request_id=request_id,
            )

        if channel == "manifold.artifacts.fetch":
            lookup_key = payload.get("lookup_key", "")
            artifact_type = payload.get("artifactType", "")
            if artifact_type == "browser_page" and lookup_key:
                page = get_browser_page(lookup_key)
                return self.build_response(
                    "manifold.artifacts.fetch.response",
                    {
                        "ok": True,
                        "artifact": {
                            "id": lookup_key,
                            "type": "browser_page",
                            "data": page,
                        },
                    },
                    cartridge_id=cartridge_id,
                    request_id=request_id,
                )
            return self.build_response(
                "manifold.artifacts.fetch.response",
                {"ok": False, "status": 404},
                cartridge_id=cartridge_id,
                request_id=request_id,
            )

        if channel == "manifold.dev.jump.request":
            facts = payload.get("facts", [])
            manifold_cartridge = self.world.cartridges.get("manifold.web")
            if manifold_cartridge is not None and hasattr(manifold_cartridge, "state"):
                for f in facts:
                    manifold_cartridge.state.setdefault("facts", {})[f] = True
            return self.build_response(
                "manifold.dev.jump.response",
                {"ok": True, "count": len(facts), "committed": True},
                cartridge_id=cartridge_id,
                request_id=request_id,
            )

        if channel == "manifold.command.request":
            return self.build_response(
                "manifold.command.response",
                {"ok": True, "result": {}},
                cartridge_id=cartridge_id,
                request_id=request_id,
            )

        if channel == "settings.network.test":
            return self.build_response(
                "settings.network.test.result",
                {"ok": True, "rttMs": 0},
                cartridge_id=cartridge_id,
                request_id=request_id,
            )

        # Default correlation acknowledgement
        return self.build_response(
            f"{channel}.result",
            {"ok": True},
            cartridge_id=cartridge_id,
            request_id=request_id,
        )
