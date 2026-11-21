# AI Data Analytics Office — Architecture

This repository is a fork of [Habblaud](https://github.com/marmottajr/habblaud), a visual office for Claude Code and Codex. The goal of this fork is to visualize **real** local Ollama/n8n analytics-agent execution. This is a **design document**, not a claim that Ollama integration already exists.

## Principles

1. Preserve upstream Habblaud behavior and artwork.
2. Add a separate Ollama/n8n event source to the existing provider/source architecture. Do not impersonate Claude or Codex transcripts.
3. Display **only verified execution events**. The UI must never invent work, token consumption, progress, or completion.
4. Run all numeric calculations in deterministic Python code; the LLM plans, explains and reviews.
5. Never automatically submit reports or send external messages without explicit human approval.
6. Keep private analytics inputs and Ollama connections local. Use fabricated/public data for development.
7. Run one Ollama generation at a time on a 4 GB GPU until resource limits are measured.
8. Do not modify Habblaud World payloads to misrepresent execution or agent activity.

## Components

| Component | Responsibility |
| --- | --- |
| Habblaud UI & SSE server | Live pixel-art office and activity stream |
| Analytics event adapter (planned) | Validated task events -> source entries in Habblaud |
| n8n (existing localhost installation) | Workflow state, routing, retries, and approvals |
| Ollama (existing host installation) | Local inference via `qwen3.5:4b-q4_K_M` |
| Python analytics API (planned) | CSV/Excel parsing, ETL, statistical operations and QA |
| SQLite + local files | Event history and report artifacts |

## Agent roles

| Role | What it does | Required checks |
| --- | --- | --- |
| Researcher | Finds official methodologies and dataset provenance | Source URL, dates, caveats |
| Data Engineer | Ingests, normalizes, validates schemas | Types, nulls, uniqueness, lineage |
| Statistical Analyst | Requests code-backed summaries and computations | Formulas, units, totals |
| Quality Assurance | Independently validates inputs, outputs, assumptions | Reconciliation, exceptions, stop on fail |
| Reporting Specialist | Produces draft narratives, tables and visualizations | Citations, validation status, approval |

## Proposed execution order

Intake -> Research -> Data Engineering -> Statistical Analysis -> Quality Assurance -> Human Approval -> Reporting -> Archive.

A failed QA stage blocks publication. Each run should carry a stable task ID and timestamps. The initial prototype uses a single model with role-specific prompts, not five concurrently loaded models.

## Provider integration notes

The upstream `shared/types.ts` currently recognizes `claude` and `codex`. Extend this carefully and add a dedicated server-side source. Review `server/sources/source.ts`, `server/model/office.ts`, and their tests before editing. Avoid altering `shared/world/` or `server/world/` to fabricate activity.

Habblaud has a built-in demo mode for UI exploration. Demo agents must remain clearly separated from real Ollama/n8n activity.

## Networking

- Habblaud: `http://localhost:4747`
- Ollama on host: `http://localhost:11434`
- Existing n8n: `http://localhost:5678`
- Proposed Python API: `http://localhost:8000`

Docker containers cannot assume that `localhost` refers to the Windows host. On Docker Desktop, use `host.docker.internal` as appropriate, and test reachability. Do not publish private API endpoints on `0.0.0.0` without authentication.

## Milestones

- [ ] M1: Confirm Habblaud demo works in WSL2 with Node >= 22.12
- [ ] M2: Define versioned, validated agent event schema
- [ ] M3: Build an event source and visualize five real role identities
- [ ] M4: Connect n8n workflow event ingestion and task lifecycle
- [ ] M5: Connect host Ollama via queued model requests
- [ ] M6: Build deterministic Python analytics + reproducible tests
- [ ] M7: Implement human review and report-export workflow
- [ ] M8: Validate privacy, redaction and safe network binding

No milestone is complete simply because the file structure exists.
