"""Regression checks for browser guest identity and both Workers ticket paths."""

from __future__ import annotations

import ast
import asyncio
import importlib.util
import json
import os
import runpy
import sys
import time
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch
from urllib.parse import urlsplit

import httpx

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from backend.api import auth
from backend.core import config
from backend.core.guest_session import (
    GUEST_PREFIX, SESSION_COOKIE, SESSION_TTL, auth_cookie_headers,
    auto_guest_enabled, cookie_token, guest_session,
)
from backend.session.manager import WorldManager, get_world_manager
from server import create_app

TICKET_RPC = {"path": "auth/wsTickets:issueWebUserWsTicket"}


def check_secret_configuration() -> None:
    config_path = str(ROOT / "backend/core/config.py")
    for environment in ({}, {"SECRET_KEY": ""}, {"SECRET_KEY": " \t"}):
        with patch.dict(os.environ, environment, clear=True):
            first = runpy.run_path(config_path)["SECRET_KEY"]
            second = runpy.run_path(config_path)["SECRET_KEY"]
            assert len(first) >= 32 and first != second
            assert first != "nori-os-secret-key-2026"
    with patch.dict(os.environ, {"SECRET_KEY": " explicit-key "}, clear=True):
        assert runpy.run_path(config_path)["SECRET_KEY"] == " explicit-key "

    with patch.object(config, "SECRET_KEY", "local-random-fallback"), patch.dict(os.environ, {}, clear=True):
        for env in (SimpleNamespace(), SimpleNamespace(SECRET_KEY=""), SimpleNamespace(SECRET_KEY=" \t")):
            try:
                config.apply_runtime_bindings(env)
            except ValueError as exc:
                assert "SECRET_KEY" in str(exc)
            else:
                raise AssertionError("Cloudflare accepted an unconfigured signing key")
        config.apply_runtime_bindings(SimpleNamespace(SECRET_KEY=" runtime-key "))
        assert config.SECRET_KEY == " runtime-key "
        with patch.dict(os.environ, {"SECRET_KEY": "environment-key"}):
            config.apply_runtime_bindings(SimpleNamespace())
            assert config.SECRET_KEY == "environment-key"
            config.apply_runtime_bindings(SimpleNamespace(SECRET_KEY="runtime-wins"))
            assert config.SECRET_KEY == "runtime-wins"
        # A previous request's binding must not substitute for missing config.
        try:
            config.apply_runtime_bindings(SimpleNamespace())
        except ValueError:
            pass
        else:
            raise AssertionError("Cloudflare reused a stale runtime key")


async def check_otp_security() -> None:
    send_paths = ("/api/auth/send-email-otp", "/api/auth/email-otp/send-verification-otp")
    verify_paths = ("/api/auth/sign-in/email-otp", "/api/auth/email-otp/verify-email")
    email, code = "security@nori.test", "654321"
    transport = httpx.ASGITransport(app=create_app(include_static=False))
    with (
        patch.dict(auth.OTP_STORE, {}, clear=True),
        patch.dict(auth.SESSIONS, {}, clear=True),
        patch.dict(auth.USERS, {}, clear=True),
        patch.object(auth, "AUTO_GUEST", False),
    ):
        async with httpx.AsyncClient(transport=transport, base_url="https://nori.test") as client:
            for environment in ({}, {"NORI_DEV_OTP": ""}, {"NORI_DEV_OTP": " \t"}):
                with patch.dict(os.environ, environment, clear=True):
                    spec = importlib.util.spec_from_file_location("backend.api._auth_security_check", auth.__file__)
                    defaults = importlib.util.module_from_spec(spec)
                    spec.loader.exec_module(defaults)
                assert defaults.DEV_OTP == ""
                with patch.object(auth, "DEV_OTP", defaults.DEV_OTP):
                    for path in send_paths:
                        assert (await client.post(path, json={"email": email})).json()["code"] == "OTP_DISABLED"
                    for path in verify_paths:
                        assert (await client.post(path, json={"email": email, "otp": "123456"})).json()["code"] == "INVALID_OTP"
                    assert not auth.OTP_STORE and not auth.SESSIONS

            with patch.object(auth, "DEV_OTP", code):
                for path in send_paths + verify_paths:
                    for body in ([], None, "text", 123):
                        result = await client.post(path, content=json.dumps(body), headers={"Content-Type": "application/json"})
                        assert result.status_code == 200 and "code" in result.json()
                for send_path, verify_path in zip(send_paths, verify_paths):
                    credentials = {"email": email, "otp": code}
                    assert (await client.post(verify_path, json=credentials)).json()["code"] == "INVALID_OTP"
                    assert (await client.post(send_path, json={"email": email})).json()["status"] is True
                    assert (await client.post(verify_path, json={"email": email, "otp": "123456"})).json()["code"] == "INVALID_OTP"
                    expiry = auth.OTP_STORE[email]["expiresAt"]
                    with patch.object(auth.time, "time", return_value=expiry):
                        assert (await client.post(verify_path, json=credentials)).json()["code"] == "INVALID_OTP"
                    assert (await client.post(send_path, json={"email": email})).json()["status"] is True
                    login = (await client.post(verify_path, json=credentials)).json()
                    token = login["session"]["token"]
                    assert token in auth.SESSIONS and email not in auth.OTP_STORE
                    assert (await client.post(verify_path, json=credentials)).json()["code"] == "INVALID_OTP"
                    assert (await client.post("/api/auth/sign-out")).json()["success"] is True
                    assert token not in auth.SESSIONS
                    # Replay the captured cookie, not just the now-cleared browser jar.
                    result = await client.get("/api/auth/get-session", headers={"cookie": f"{SESSION_COOKIE}={token}"})
                    assert result.json() is None


def check_invalid_cookies() -> None:
    session, created = guest_session(None)
    assert created
    token = session["session"]["token"]
    restored, created = guest_session(token)
    assert not created and restored == session
    assert cookie_token({"better-auth-cookie": f"{SESSION_COOKIE}={token}"}) == token
    assert cookie_token({
        "cookie": f"{SESSION_COOKIE}={token}",
        "better-auth-cookie": f"{SESSION_COOKIE}=local-guest-token",
    }) == token
    with patch("backend.core.guest_session.time.time", return_value=time.time() - SESSION_TTL - 1):
        expired, _ = guest_session(None)
    bad_tokens = [
        "local-guest-token", "guest.v1.bad", token[:-1] + ("0" if token[-1] != "0" else "1"),
        token.rsplit(".", 1)[0] + "." + "é" * 64, expired["session"]["token"],
    ]
    for bad in bad_tokens:
        rotated, created = guest_session(bad)
        assert created and rotated["user"]["id"] != session["user"]["id"]
        assert rotated["user"]["id"] != "guest-user-001"
    with patch.object(config, "SECRET_KEY", "different-signing-key"):
        assert guest_session(token)[1]


async def check_http() -> None:
    transport = httpx.ASGITransport(app=create_app(include_static=False))
    manager = get_world_manager()
    async with (
        httpx.AsyncClient(transport=transport, base_url="https://nori.test") as a,
        httpx.AsyncClient(transport=transport, base_url="https://nori.test") as b,
    ):
        first_a = await a.get("/api/auth/get-session")
        first_b = await b.get("/api/auth/get-session")
        user_a, user_b = first_a.json()["user"]["id"], first_b.json()["user"]["id"]
        assert user_a != user_b and user_a.startswith("guest_") and user_b.startswith("guest_")
        for response in (first_a, first_b):
            assert response.headers["cache-control"] == "private, no-store"
            assert "HttpOnly" in response.headers["set-cookie"]
            assert "Secure" in response.headers["set-cookie"]
            assert "SameSite=Lax" in response.headers["set-cookie"]
            assert response.headers["set-better-auth-cookie"] == response.headers["set-cookie"]
        assert (await a.post("/api/auth/get-session")).json() == first_a.json()
        # A stale Better Auth localStorage value must not override a valid browser cookie.
        stale = {"better-auth-cookie": f"{SESSION_COOKIE}=local-guest-token"}
        assert (await a.get("/api/auth/get-session", headers=stale)).json() == first_a.json()
        assert (await a.get("/api/auth/convex/token")).json()["token"] == f"local-convex.{user_a}"
        for client, user in ((a, user_a), (b, user_b)):
            direct = (await client.post("/api/arcade/ws-ticket")).json()["ticket"]
            assert await manager.resolve_ticket(direct) == user
            for path in ("/api/query", "/api/mutation", "/api/action", "/api/function", "/api/query_at_ts"):
                result = await client.post(path, json=TICKET_RPC)
                assert result.headers["cache-control"] == "private, no-store"
                assert await manager.resolve_ticket(result.json()["value"]["ticket"]) == user
        world_a, world_b = await manager.get_world(user_a), await manager.get_world(user_b)
        assert world_a.world_id != world_b.world_id
        world_a.cartridges["chat"].dispatch("player", {"type": "playerMessage", "text": "private to A"})
        assert not world_b.cartridges["chat"].state.get("lines")
        assert await manager.get_world(user_a) is world_a
        grant = world_a.issue_media_grant()
        assert await manager.world_for_grant(user_a, grant) is world_a
        assert await manager.world_for_grant(user_b, grant) is None
        await manager.reset_world(user_b)
        assert (await manager.get_world(user_a)).cartridges["chat"].state["lines"][0]["content"] == "private to A"
        assert await manager.resolve_ticket(await manager.issue_ticket("guest-user-001")) is None

        # Preserve explicitly enabled development OTP users instead of guests.
        with patch.object(auth, "DEV_OTP", "654321"):
            issued = await a.post("/api/auth/send-email-otp", json={"email": "isolation@nori.test"})
            assert issued.json()["status"] is True
            login = await a.post("/api/auth/sign-in/email-otp", json={"email": "isolation@nori.test", "otp": "654321"})
        logged_in = login.json()["user"]["id"]
        assert logged_in.startswith("user_")
        assert (await a.get("/api/auth/get-session")).json()["user"]["id"] == logged_in
        ticket = (await a.post("/api/arcade/ws-ticket")).json()["ticket"]
        assert await manager.resolve_ticket(ticket) == logged_in
        assert (await b.get("/api/auth/get-session")).json()["user"]["id"] == user_b
        await a.post("/api/auth/sign-out")
        assert (await a.get("/api/auth/get-session")).json()["user"]["id"] != logged_in

    # A ticket/token request before get-session must also persist its principal.
    for path in ("/api/arcade/ws-ticket", "/api/query", "/api/auth/convex/token"):
        async with httpx.AsyncClient(transport=transport, base_url="http://nori.test") as client:
            result = await client.post(path, json=TICKET_RPC)
            assert SESSION_COOKIE in client.cookies
            current = (await client.get("/api/auth/get-session")).json()["user"]["id"]
            if path.endswith("/token"):
                assert result.json()["token"] == f"local-convex.{current}"
            else:
                ticket = result.json().get("ticket") or result.json()["value"]["ticket"]
                assert await manager.resolve_ticket(ticket) == current
    with patch.object(auth, "AUTO_GUEST", False):
        async with httpx.AsyncClient(transport=transport, base_url="http://nori.test") as client:
            assert (await client.get("/api/auth/get-session")).json() is None
            assert (await client.post("/api/arcade/ws-ticket")).status_code == 401
            assert (await client.post("/api/query", json=TICKET_RPC)).json()["errorMessage"] == "Unauthorized"


def load_functions(path: str, names: set[str], namespace: dict) -> None:
    # workers-py requires Cloudflare's JS runtime. Execute the actual route
    # functions on CPython with only the response/platform boundary substituted.
    tree = ast.parse((ROOT / path).read_text(encoding="utf-8"))
    tree.body = [node for node in tree.body if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)) and node.name in names]
    exec(compile(tree, path, "exec"), namespace)


async def check_edge() -> None:
    manager = WorldManager()
    namespace = {
        "GUEST_PREFIX": GUEST_PREFIX, "cookie_token": cookie_token,
        "auto_guest_enabled": auto_guest_enabled, "guest_session": guest_session,
        "auth_cookie_headers": auth_cookie_headers, "urlsplit": urlsplit,
        "_EDGE_TICKET_MANAGER": manager,
        "_json_response": lambda payload, headers=None: httpx.Response(200, json=payload, headers=headers),
    }
    load_functions("worker.py", {"_edge_guest_session", "_serve_bootstrap_api"}, namespace)
    edge = {"_runtime": SimpleNamespace(**namespace), "_EDGE_CONVEX_PATHS": {"/api/query"}}
    load_functions("cloudflare/entry.py", {"_serve_edge_convex_api"}, edge)

    body_reads = 0

    async def body():
        nonlocal body_reads
        body_reads += 1
        return TICKET_RPC

    async def request(path, cookie=None):
        req = SimpleNamespace(method="POST", url=f"https://nori.test{path}", headers={"cookie": cookie} if cookie else {}, json=body)
        if path == "/api/query":
            return await edge["_serve_edge_convex_api"](path, req)
        return await namespace["_serve_bootstrap_api"](path, req)

    identities = []
    for first_path in ("/api/auth/get-session", "/api/arcade/ws-ticket", "/api/query"):
        first = await request(first_path)
        cookie = first.headers["set-cookie"].split(";", 1)[0]
        session = (await request("/api/auth/get-session", cookie)).json()
        user = session["user"]["id"]
        identities.append(user)
        assert first.headers["cache-control"] == "private, no-store"
        assert "Secure" in first.headers["set-cookie"]
        if first_path != "/api/auth/get-session":
            ticket = first.json().get("ticket") or first.json()["value"]["ticket"]
            assert await manager.resolve_ticket(ticket) == user
        for path in ("/api/arcade/ws-ticket", "/api/query"):
            result = await request(path, cookie)
            ticket = result.json().get("ticket") or result.json()["value"]["ticket"]
            assert await manager.resolve_ticket(ticket) == user
            assert result.headers["cache-control"] == "private, no-store"
        assert (await request("/api/auth/convex/token", cookie)).json()["token"] == f"local-convex.{user}"
        reads_before = body_reads
        assert await request("/api/query", f"{SESSION_COOKIE}=opaque-otp-token") is None
        assert body_reads == reads_before, "OTP fallback consumed ASGI's request body"
    assert len(set(identities)) == len(identities)
    legacy = await request("/api/auth/get-session", f"{SESSION_COOKIE}=local-guest-token")
    assert legacy.json()["user"]["id"] != "guest-user-001"


async def main() -> None:
    check_secret_configuration()
    check_invalid_cookies()
    await check_otp_security()
    await check_http()
    await check_edge()
    print("[ok] independent browser guests, private worlds/media, cookie lifecycle, OTP, and both edge ticket paths")


if __name__ == "__main__":
    asyncio.run(main())
