# AI Data Analytics Office — n8n integration (in progress)

This integration is separate from Habblaud's original Claude Code/Codex session tracking. Do not replace the existing application or expose the local API publicly.

## Existing verified local services
- n8n Docker: http://localhost:5678
- Ollama: http://localhost:11434
- Python FastAPI: http://localhost:8008
- Report folders: reports/approved and reports/rejected

## Install the agent event bridge
Copy `integrations/n8n/agent_status_bridge.py` next to your existing `analytics_service.py`, then add *after* `app = FastAPI(...)`:

```python
from agent_status_bridge import router as agent_status_router
app.include_router(agent_status_router)
```

In PowerShell, set `$env:AI_OFFICE_EVENT_KEY` to a newly generated secret and restart uvicorn. Do not commit secrets.

## n8n HTTP Request event nodes
POST `http://host.docker.internal:8008/ai-office/events`
Headers: `X-API-Key: <AI_OFFICE_EVENT_KEY>`
Body: JSON, for example:

```json
{"taskId":"office-example","role":"Researcher","status":"working","message":"Analyzing source data"}
```

Allowed roles: Researcher, Data Engineer, Statistical Analyst, Quality Assurance, Reporting Specialist, Office.
Allowed statuses: queued, working, completed, failed, waiting_approval, approved, rejected.

Check `GET http://localhost:8008/ai-office/tasks` on the local host to inspect status metadata.

## Remaining integration work
- Add n8n event nodes around each of the five agent steps, the approval wait, and both decision branches.
- Add a Habblaud server-side adapter that polls the local bridge, with an explicit opt-in flag.
- Map five virtual agents to room/character state without disrupting native Claude/Codex sessions.
- Add a report list/viewer and approval UI; keep signed webhook URLs and API keys on the server.
- Implement persistent event history, replay/recovery, duplicate handling, QA checks, and end-to-end tests.

**Current limitation:** event state is in memory and resets on FastAPI restart. This is a starter bridge, not a completed Habblaud integration.
