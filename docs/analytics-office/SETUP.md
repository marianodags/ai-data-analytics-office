# Local Development Setup (Windows 11 + WSL2)

This fork preserves upstream Habblaud installation requirements: Node.js 22.12+, npm, and a working Linux/macOS environment. Windows native behavior is not assumed to be fully supported.

## Verify your existing services (do not reinstall)

In Windows PowerShell:

```powershell
ollama list
ollama ps
docker ps
```

Expected existing service addresses: `http://localhost:11434` (Ollama), `http://localhost:5678` (n8n).

## Clone in WSL2 Ubuntu

```bash
node --version
npm --version
git clone https://github.com/marianodags/ai-data-analytics-office.git
cd ai-data-analytics-office
git switch feature/analytics-office-foundation
npm install
npm run demo
```

Open `http://localhost:4747` from the Windows browser.

Demo mode renders simulated agents; it does not demonstrate Ollama or n8n integration. Keep it on loopback only.

If the Node version is below 22.12, install an appropriate current Node release in WSL2 first.

## Planned runtime separation

- Habblaud frontend/backend: WSL2 Node
- n8n: existing Docker container
- Ollama: existing Windows host installation, initially `qwen3.5:4b-q4_K_M`
- Analytics API: future separate Python service

The Habblaud fork does not install, replace, delete, or reconfigure your existing n8n workflows or Ollama models.

## Quick model test

```powershell
ollama run qwen3.5:4b-q4_K_M
```

Use a context length of roughly 4K tokens for first tests and serialize requests to reduce GPU memory pressure.

## Safety

Use synthetic or public test data only. Do not put confidential respondents' personal or establishment data in GitHub, model prompts, execution logs, or workflow exports. Human approval remains mandatory before data sharing or publishing reports.
