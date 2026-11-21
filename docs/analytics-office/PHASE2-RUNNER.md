# Phase 2: Real Ollama Statistical Analyst runner

This is a working **standalone local inference runner**, not yet a Habblaud source integration. It generates real, timestamped task events that the next integration milestone can consume. It does not create simulated agents or modify Habblaud World data.

## Prerequisites

- Node.js 22.12+ (or Node 20+ for this standalone script)
- Running Ollama at http://127.0.0.1:11434
- Installed `qwen3.5:4b-q4_K_M`

## Run from repository root in PowerShell

```powershell
node analytics-office/runner/run-analyst.mjs
```

Or give it a custom prompt:

```powershell
node analytics-office/runner/run-analyst.mjs "Explain how to validate a GDP industry-share table."
```

## Expected results

1. `queued` and `working` events appear.
2. A real Ollama response is printed.
3. A `completed` event appears (or `failed` on error).
4. Metadata events are appended to `analytics-office/runtime/events.jsonl`.

The runtime directory is excluded from Git via `analytics-office/runtime/.gitignore`'s parent directory pattern in the new ignore file. The script intentionally does **not** log prompts or generated responses, which may contain sensitive information.

## Future connection

The planned Habblaud adapter will read these events and reflect real execution in the pixel-art UI. Until it exists, the UI remains unchanged.

The model is used for explanation, not trusted arithmetic. Production statistics must be calculated and validated in Python.

## Troubleshooting

```powershell
Invoke-RestMethod http://localhost:11434/api/tags
ollama ps
```

If `fetch failed`, confirm the Ollama host URL. If you run Node inside Docker, `127.0.0.1` means the container, not the Windows host; set `OLLAMA_URL` appropriately.
