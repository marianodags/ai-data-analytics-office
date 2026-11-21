# FreeLLMAPI cloud-first setup — Windows 11

This project can use a cloud AI model through your existing FreeLLMAPI gateway. Ollama is **not required**. FreeLLMAPI must itself be configured to forward to a remote provider; a local gateway can still route to local Ollama if misconfigured.

## 1. Confirm cloud models

In PowerShell:

```powershell
(Invoke-RestMethod http://127.0.0.1:31415/v1/models).data | Select-Object id
```

Choose an **exact model ID** from that output, and confirm the upstream provider is cloud-hosted. Do not guess a model ID.

## 2. Run a real cloud agent

From the repository root in PowerShell:

```powershell
$env:FREELLMAPI_BASE_URL = 'http://127.0.0.1:31415/v1'
$env:FREELLMAPI_MODEL = 'REPLACE_WITH_EXACT_MODEL_ID'
# Only if the gateway requires a bearer token:
# $env:FREELLMAPI_API_KEY = 'your-local-gateway-key'
node analytics-office/runner/run-cloud-analyst.mjs
```

This appends real task metadata to the ignored `analytics-office/runtime/events.jsonl` file. It does not log prompts, responses or API keys.

## 3. n8n Docker connectivity

For the existing n8n Docker installation, `127.0.0.1` means the container. Use `http://host.docker.internal:31415/v1` from n8n if FreeLLMAPI listens on an interface reachable from Docker Desktop. Verify from inside the n8n container before wiring any workflow.

If FreeLLMAPI is bound strictly to `127.0.0.1` on Windows, `host.docker.internal` may not reach it. Prefer a **private, authenticated local reverse proxy** or an explicitly configured loopback-compatible bridge rather than opening the gateway publicly.

Use n8n HTTP Request:
- Method: POST
- URL: `http://host.docker.internal:31415/v1/chat/completions` (only after connectivity test)
- JSON body: `{"model":"EXACT_ID","messages":[{"role":"user","content":"Explain GDP growth"}],"stream":false}`
- Header `Content-Type: application/json`
- Add `Authorization: Bearer ...` through n8n credentials **only if required**.

Never commit provider API keys or real confidential statistical data to the public GitHub repository. Do not expose the gateway to the internet.

## 4. Habblaud

Continue to run `npm run dev` locally at `http://localhost:4747` with demo mode disabled. Habblaud's original code only watches Claude/Codex sessions; it does **not** yet display these cloud runner events. A separate event adapter is required and is a future milestone.

## 5. Cooling down your laptop

```powershell
ollama stop qwen3.5:4b-q4_K_M
ollama ps
```

An empty `ollama ps` confirms no model is loaded. You can also exit the Ollama tray application to stop its background server if you wish. Cloud calls still use network and modest local CPU, but no local model inference.
