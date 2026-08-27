"""Minimal Convex HTTP compatibility API router."""

from __future__ import annotations

from typing import Any, Dict

from fastapi import APIRouter, Request

from .auth import get_current_user_id
from ..session.manager import get_world_manager

convex_router = APIRouter(tags=["convex"])


async def _convex_local_response(request: Request) -> Dict[str, Any]:
    try:
        body = await request.json()
    except Exception:
        body = {}
    path = body.get("path") if isinstance(body, dict) else None
    if path == "auth/wsTickets:issueWebUserWsTicket":
        user_id = get_current_user_id(request)
        if not user_id:
            return {"status": "error", "errorMessage": "Unauthorized", "logLines": []}
        ticket = await get_world_manager().issue_ticket(user_id)
        return {"status": "success", "value": {"ticket": ticket}, "logLines": []}
    if path == "auth/otpEmail:preflightOtpSend":
        return {"status": "success", "value": None, "logLines": []}
    return {"status": "error", "errorMessage": f"Unsupported local Convex function: {path or '<missing>'}", "logLines": []}


@convex_router.post("/api/mutation")
@convex_router.post("/api/query")
@convex_router.post("/api/action")
@convex_router.post("/api/function")
async def convex_function(request: Request):
    return await _convex_local_response(request)


@convex_router.post("/api/query_ts")
async def convex_timestamp() -> Dict[str, str]:
    return {"ts": "0"}


@convex_router.post("/api/query_at_ts")
async def convex_query_at_timestamp(request: Request):
    return await _convex_local_response(request)
