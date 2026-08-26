"""System, version, and ticket issuance API router."""

from __future__ import annotations

import os
from typing import Dict

from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse

from .auth import get_current_user_id
from ..session.manager import WORLD_MANAGER

system_router = APIRouter(tags=["system"])
MACHINE_ID = os.getenv("NORI_MACHINE_ID", "nori-local")


@system_router.get("/api/entry-status")
async def entry_status() -> Dict[str, str]:
    return {"status": "ok", "machineId": MACHINE_ID}


@system_router.get("/api/version")
async def version() -> Dict[str, str]:
    return {"version": "2.0.0", "service": "NoriOS local compatibility server"}


@system_router.post("/api/arcade/ws-ticket")
async def issue_ws_ticket(request: Request):
    user_id = get_current_user_id(request)
    if not user_id:
        return JSONResponse(status_code=401, content={"error": "Unauthorized"})
    return {"ticket": await WORLD_MANAGER.issue_ticket(user_id)}
