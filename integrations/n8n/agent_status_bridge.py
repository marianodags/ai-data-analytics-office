"""Local n8n agent-status bridge for the visual AI office.

Register with an existing FastAPI app:
    from agent_status_bridge import router as agent_status_router
    app.include_router(agent_status_router)

Set AI_OFFICE_EVENT_KEY in the FastAPI process environment and supply it
as X-API-Key from n8n. No keys or task payloads are committed to Git.
"""
from datetime import datetime, timezone
from os import environ
from threading import RLock
from typing import Literal
from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel, Field

router = APIRouter(prefix="/ai-office", tags=["AI Office"])
_lock = RLock()
_tasks: dict[str, dict] = {}
ROLES = ("Researcher", "Data Engineer", "Statistical Analyst",
         "Quality Assurance", "Reporting Specialist")

class AgentEvent(BaseModel):
    taskId: str = Field(min_length=1, max_length=128)
    role: str
    status: Literal["queued", "working", "completed", "failed", "waiting_approval", "approved", "rejected"]
    message: str = Field(default="", max_length=500)

@router.post("/events")
def receive_event(event: AgentEvent, x_api_key: str | None = Header(default=None)):
    from secrets import compare_digest
    expected = environ.get("AI_OFFICE_EVENT_KEY", "")
    if not expected or not x_api_key or not compare_digest(x_api_key, expected):
        raise HTTPException(401, "Unauthorized")
    if event.role not in ROLES and event.role != "Office":
        raise HTTPException(422, "Unknown role")
    now = datetime.now(timezone.utc).isoformat()
    with _lock:
        task = _tasks.setdefault(event.taskId, {"taskId": event.taskId, "agents": {}, "updatedAt": now})
        task["agents"][event.role] = {"status": event.status, "message": event.message, "updatedAt": now}
        task["updatedAt"] = now
    return {"ok": True, "taskId": event.taskId, "updatedAt": now}

@router.get("/tasks")
def list_tasks():
    # Local status metadata only; never expose report contents or credentials.
    with _lock:
        return {"tasks": list(_tasks.values())}
