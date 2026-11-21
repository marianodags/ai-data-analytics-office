// Real local Ollama execution, with append-only, redacted event metadata.
// Run: node analytics-office/runner/run-analyst.mjs
import { appendFile, mkdir } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { resolve, dirname } from 'node:path';

const MODEL = process.env.ANALYTICS_MODEL || 'qwen3.5:4b-q4_K_M';
const BASE = process.env.OLLAMA_URL || 'http://127.0.0.1:11434';
const EVENTS = resolve(process.env.ANALYTICS_EVENTS_FILE || 'analytics-office/runtime/events.jsonl');
const TIMEOUT_MS = 120_000;
const taskId = randomUUID();
const agent = 'statistical_analyst';
const prompt = process.argv.slice(2).join(' ').trim() ||
  'Explain the annual GDP growth rate formula and give a worked example using previous GDP 100 and current GDP 105. Clearly state the answer is 5%.';

async function emit(status, activity) {
  const event = {
    version: '1.0', event_id: randomUUID(), task_id: taskId,
    agent, status, timestamp: new Date().toISOString(),
    activity: activity.slice(0, 240),
  };
  await mkdir(dirname(EVENTS), { recursive: true });
  await appendFile(EVENTS, JSON.stringify(event) + '\n', { encoding: 'utf8', mode: 0o600 });
  process.stdout.write('[event] ' + status + ': ' + activity + '\n');
}

const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
try {
  await emit('queued', 'Statistical analysis request queued');
  await emit('working', 'Calling local Ollama model ' + MODEL);
  const response = await fetch(new URL('/api/generate', BASE), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal: controller.signal,
    body: JSON.stringify({
      model: MODEL, prompt, stream: false,
      options: { num_ctx: 4096, num_predict: 400, temperature: 0.2 },
      keep_alive: '4m',
    }),
  });
  if (!response.ok) throw new Error('Ollama returned HTTP ' + response.status);
  const result = await response.json();
  if (typeof result.response !== 'string' || !result.response.trim()) {
    throw new Error('Ollama returned no visible response');
  }
  console.log('\n--- Statistical Analyst response ---\n' + result.response + '\n');
  if (typeof result.eval_count === 'number' && result.eval_duration > 0) {
    console.log('Generation speed: ' + (result.eval_count * 1e9 / result.eval_duration).toFixed(2) + ' tokens/sec');
  }
  await emit('completed', 'Local model response received');
} catch (error) {
  await emit('failed', error?.name === 'AbortError' ? 'Ollama request timed out' : 'Local model request failed');
  console.error(error?.message || error);
  process.exitCode = 1;
} finally {
  clearTimeout(timeout);
}
