"""Event dispatcher for Manifold, Settings, and Virtual App RPC channels."""

from __future__ import annotations

import hashlib
import time
from typing import TYPE_CHECKING, Any, Dict, List, Optional

from ..virtual_apps import live_pack
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

    DEFAULT_CHIP = {"capacity": 3, "coolEveryMs": 60_000}
    HONEYPOT_URL_HINTS = ("verify-now.com", "futurum-prize")

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

    # ------------------------------------------------------------------
    # manifold.web helpers (chip model / bounty / idle)
    # ------------------------------------------------------------------

    def _manifold(self):
        cartridge = self.world.cartridges.get("manifold.web")
        return cartridge

    def _variables(self) -> Dict[str, Any]:
        manifold = self._manifold()
        if manifold is not None and hasattr(manifold, "state"):
            return manifold.state.setdefault("variables", {})
        return {}

    def _chip_status(self) -> Dict[str, Any]:
        from ..cartridges.manifold import chip_status_snapshot
        variables = self._variables()
        if variables:
            return chip_status_snapshot(variables)
        archived = live_pack.chip_status() or {}
        return {
            "capacity": int(archived.get("capacity") or self.DEFAULT_CHIP["capacity"]),
            "heat": 0,
            "coolEveryMs": int(archived.get("coolEveryMs")
                               or self.DEFAULT_CHIP["coolEveryMs"]),
            "serverNowMs": int(time.time() * 1000),
        }

    # ------------------------------------------------------------------
    # manifold.command.request generic router
    # ------------------------------------------------------------------

    _EMIT_FACT_COMMANDS = {
        "mail.markRead": "mail",
        "mark_mail_read": "mail",
        "signal.markRead": "signal",
        "signal_login": "signal",
        "vault.unlock": "vault",
        "unseal_volume": "vault",
    }

    def _run_manifold_command(self, command: str, sub_payload: Dict[str, Any]):
        """Route a generic manifold command; returns (ok, result-or-error)."""
        command = (command or "").strip()
        if not command:
            return False, "missing command"

        cartridge = self._mantridge = self._manifold()

        if command in ("browser.bookmarks.list",):
            return True, {"bookmarks": self._variables().get("browserBookmarks", [])}

        if command in ("browser.bookmarks.add", "browser.bookmarks.remove"):
            url = str(sub_payload.get("url") or "").strip()
            if not url:
                return False, "missing url"
            marks = self._variables().setdefault("browserBookmarks", [])
            exists = any(m.get("url") == url for m in marks)
            if command.endswith("add") and not exists:
                marks.append({"url": url,
                              "title": str(sub_payload.get("title") or url)})
            elif command.endswith("remove"):
                marks[:] = [m for m in marks if m.get("url") != url]
            return True, {"count": len(marks)}

        fact_id = str(sub_payload.get("factId") or "")
        if not fact_id and command in self._EMIT_FACT_COMMANDS:
            fact_hint = str(sub_payload.get("artifactId")
                            or sub_payload.get("fileId")
                            or sub_payload.get("volumeId") or "")
            if fact_hint:
                fact_id = fact_hint

        if fact_id:
            kind = self._EMIT_FACT_COMMANDS.get(command)
            source = None
            if kind == "vault" or (kind == "signal" and "verify" in fact_id):
                pass  # derive_source resolves these namespaces itself
            commit = None
            m = self._manifold()
            if m is not None:
                try:
                    cmd = {"type": "client.emitFact", "factId": fact_id}
                    if source:
                        cmd["source"] = source
                    commit = m.dispatch("player", cmd)
                    if getattr(commit, "transition", None):
                        messages = self.world._commit_messages(m, commit)
                        if messages:
                            self.world._spawn(self.world.broadcast(messages))
                except Exception as exc:
                    return False, f"fact emission rejected: {exc}"
            return True, {"fact": fact_id,
                          "already": bool(commit is None or not commit.committed)}

        # Unrecognized commands are acknowledged permissively so shipped
        # callers never hit request timeouts (verified generic behaviour).
        return True, {"echo": command}

    # ------------------------------------------------------------------
    # desktop shell events (game windows / talk / notification debug)
    # ------------------------------------------------------------------

    def _handle_desktop_event(self, channel: str, payload: Dict[str, Any],
                              cartridge_id, request_id):
        """Acknowledge shell-owned channels and mirror debug pushes.

        ``notification.debug.push`` is re-broadcast to every connected client
        as a real ``notification.pushed`` event; game-window channels are
        recorded in world variables for observability only.
        """
        variables = self._variables()

        if channel == "nori_open_game":
            variables.setdefault("launchedGames", []).append(
                {"gameId": payload.get("gameId"), "atMs": int(time.time() * 1000)})

        if channel == "notification.debug.push":
            note = {
                "id": str(payload.get("id") or f"note-{int(time.time() * 1000)}"),
                "title": str(payload.get("title") or "NoriOS"),
            }
            for key in ("subtitle", "body", "durationMs", "onClick"):
                if key in payload:
                    note[key] = payload[key]
            message = {
                "type": "event",
                "worldId": self.world.world_id,
                "channel": "notification.pushed",
                "payload": note,
            }
            self.world._spawn(self.world.broadcast([message]))
            return self.build_response(
                "notification.debug.push.result",
                {"ok": True, "pushed": note["id"]},
                cartridge_id=cartridge_id,
                request_id=request_id,
            )

        # game windows / talk requests: acknowledge so shipped `.call`s
        # never time out; the desktop shell handles them locally too.
        default_result = {"ok": True}
        if channel == "nori_talk.request":
            default_result = {"type": "noop"}
        return self.build_response(
            f"{channel}.result",
            default_result,
            cartridge_id=cartridge_id,
            request_id=request_id,
        )

    def _dispatch_manifold(self, cmd: Dict[str, Any]) -> Optional[Any]:
        """Commit a manifold.web command and broadcast the transition."""
        manifold = self._manifold()
        if manifold is None:
            return None
        commit = manifold.dispatch("player", cmd)
        if getattr(commit, "transition", None):
            messages = self.world._commit_messages(manifold, commit)
            if messages:
                self.world._spawn(self.world.broadcast(messages))
        return commit

    def _bounty_submit(self, payload: Dict[str, Any]) -> Optional[str]:
        """Validate a bounty submission against archived artifacts.

        Payload may carry ``url`` and/or ``fileId``. Success requires that the
        submitted evidence actually exists in the archive (or matches the
        honeypot), after which the artifact's emitted fact is granted.
        """
        file_id = str(payload.get("fileId") or "").strip()
        url = str(payload.get("url") or "").strip().lower()

        matched_fact: Optional[str] = None
        if file_id:
            for art in get_file_artifacts():
                data = art.get("data") or {}
                path = str(data.get("display_path") or "")
                aid = str(art.get("id") or "")
                if file_id in (path.rsplit("/", 1)[-1], path, aid):
                    matched_fact = data.get("open_emits_fact") \
                        or data.get("open_sentinel_fact") \
                        or data.get("read_fact")
                    break
        if not url and not file_id:
            return None

        if matched_fact is None and url:
            pages = live_pack.all_pages_raw()
            hit = any(url in ((p.get("data") or {}).get("url") or "").lower()
                      or any(hint in url for hint in self.HONEYPOT_URL_HINTS)
                      for p in pages)
            if hit:
                matched_fact = "arg.honeypot_access"

        if not matched_fact:
            return None

        manifold = self._manifold()
        if manifold is not None:
            try:
                manifold.dispatch("player",
                                  {"type": "client.emitFact", "factId": matched_fact})
            except Exception:
                return None
        return matched_fact

    async def handle_event(self, message: Dict[str, Any]) -> Dict[str, Any]:
        channel = message.get("channel", "")
        request_id = message.get("requestId")
        cartridge_id = message.get("cartridgeId")
        payload = message.get("payload") if isinstance(message.get("payload"), dict) else {}
        now = int(time.time() * 1000)

        if channel == "manifold.chip.status":
            return self.build_response(
                "manifold.chip.status.result",
                self._chip_status(),
                cartridge_id=cartridge_id,
                request_id=request_id,
            )

        if channel == "manifold.chip.scan":
            cmd_scan: Dict[str, Any] = {"type": "chip.scan"}
            for k in ("key", "appId", "windowType", "contentKey", "title"):
                if k in payload:
                    cmd_scan[k] = payload[k]
            commit = self._dispatch_manifold(cmd_scan)
            result = commit.result if commit is not None else {
                "kind": "unsupported", "text": "[chip] manifold link unavailable"}
            return self.build_response(
                "manifold.chip.scan.result",
                result,
                cartridge_id=cartridge_id,
                request_id=request_id,
            )

        if channel == "manifold.chip.debug_scan":
            cmd = {"type": "chip.debugScan",
                   "key": str(payload.get("key") or payload.get("contentKey") or "")}
            for k in ("contentKey", "title", "readout"):
                if k in payload:
                    cmd[k] = payload[k]
            commit = self._dispatch_manifold(cmd)
            result = (commit.result if commit is not None else
                      {"ok": False, "error": "manifold unavailable"})
            return self.build_response(
                "manifold.chip.debug_scan.result",
                result,
                cartridge_id=cartridge_id,
                request_id=request_id,
            )

        if channel == "manifold.chip.debug_reset":
            commit = self._dispatch_manifold({"type": "chip.debugReset"})
            result = (commit.result if commit is not None else
                      {"ok": False, "error": "manifold unavailable"})
            return self.build_response(
                "manifold.chip.debug_reset.result",
                result,
                cartridge_id=cartridge_id,
                request_id=request_id,
            )

        if channel == "manifold.chip.debug_config":
            cmd: Dict[str, Any] = {"type": "chip.debugConfig"}
            for key in ("capacity", "coolEveryMs", "heat", "neverOverheat"):
                if key in payload:
                    cmd[key] = payload[key]
            commit = self._dispatch_manifold(cmd)
            result = (commit.result if commit is not None and commit.result
                      else {"ok": False, "error": "manifold unavailable"})
            return self.build_response(
                "manifold.chip.debug_config.result",
                result,
                cartridge_id=cartridge_id,
                request_id=request_id,
            )

        if channel == "ambient.trigger":
            ambient = self._variables().setdefault("ambient", {})
            return self.build_response(
                "ambient.trigger.result",
                {
                    "quietGapMs": int(ambient.get("quietGapMs") or 60_000),
                    "cooldownMs": int(ambient.get("cooldownMs") or 120_000),
                    "sessionBudget": int(ambient.get("sessionBudget") or 3),
                },
                cartridge_id=cartridge_id,
                request_id=request_id,
            )

        if channel == "ambient.debug_config":
            cfg = self._variables().setdefault("ambient", {})
            ok = True
            for key in ("quietGapMs", "cooldownMs", "sessionBudget"):
                value = payload.get(key)
                if isinstance(value, int) and value >= 0:
                    cfg[key] = value
            return self.build_response(
                "ambient.debug_config.result",
                {"ok": ok},
                cartridge_id=cartridge_id,
                request_id=request_id,
            )

        if channel == "manifold.command.request":
            command = str(payload.get("command", ""))
            sub_payload = payload.get("payload") or {}
            ok, out = self._run_manifold_command(command, sub_payload)
            body: Dict[str, Any] = {"ok": True, "result": out} if ok                 else {"ok": False, "error": out}
            return self.build_response(
                "manifold.command.response",
                body,
                cartridge_id=cartridge_id,
                request_id=request_id,
            )

        if channel in ("nori_open_game", "nori_close_game", "nori_talk.request",
                       "notification.debug.push"):
            return self._handle_desktop_event(channel, payload, cartridge_id, request_id)

        if channel == "manifold.bounty.submit":
            fact = self._bounty_submit(payload)
            result: Dict[str, Any] = (
                {"ok": True, "fact": fact} if fact else {"ok": False}
            )
            return self.build_response(
                "manifold.bounty.submit.result",
                result,
                cartridge_id=cartridge_id,
                request_id=request_id,
            )

        if channel == "idle.sync":
            prestige = (payload or {}).get("prestige") or {}
            manifold = self._manifold()
            if manifold is not None and isinstance(payload, dict) and payload:
                scalar_payload = {
                    k: v for k, v in payload.items()
                    if isinstance(v, (str, int, float, bool))
                }
                try:
                    commit = manifold.dispatch(
                        "player",
                        {"type": "idle.sync", **scalar_payload},
                    )
                    if commit.transition:
                        messages = self.world._commit_messages(manifold, commit)
                        if messages:
                            self.world._spawn(self.world.broadcast(messages))
                except Exception:
                    pass
            return self.build_response(
                "idle.sync.result",
                {"ok": True, "prestige": prestige},
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
            facts = [f for f in (payload.get("facts") or []) if isinstance(f, str)]
            committed = 0
            for fact_id in facts:
                commit = self._dispatch_manifold(
                    {"type": "client.emitFact", "factId": fact_id}
                )
                if commit is not None and commit.committed:
                    committed += 1
            return self.build_response(
                "manifold.dev.jump.response",
                {"ok": True, "count": committed, "committed": True},
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
