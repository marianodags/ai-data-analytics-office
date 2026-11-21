// Cloud-first OpenAI-compatible gateway runner. No Ollama requests.
import { appendFile, mkdir } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { dirname, resolve } from 'node:path';

const base = process.env.FREELLMAPI_BASE_URL || 'http://127.0.0.1:31415/v1';
const key = process.env.FREELLMAPI_API_KEY || '';
const model = process.env.FREELLMAPI_MODEL || '';
const file = resolve(process.env.ANALYTICS_EVENTS_FILE || 'analytics-office/runtime/events.jsonl');
const taskId = randomUUID();
const agent = 'statistical_analyst';
const prompt = process.argv.slice(2).join(' ').trim() || 'Explain the GDP growth rate formula using previous GDP 100 and current GDP 105. Give the numerical result.';
const url = (suffix) => new URL(base.replace(/\/$/, '') + '/' + suffix);
const headers = { 'Content-Type': 'application/json', ...(key ? { Authorization: 'Bearer ' + key } : {}) };

async function event(status, activity) {
  const entry = { version:'1.0', event_id:randomUUID(), task_id:taskId, agent, status, timestamp:new Date().toISOString(), activity:activity.slice(0,240) };
  await mkdir(dirname(file), {recursive:true});
  await appendFile(file, JSON.stringify(entry)+'\n', {encoding:'utf8',mode:0o600});
  console.log('[event] '+status+': '+activity);
}
const abort = new AbortController();
const timer = setTimeout(()=>abort.abort(),120000);
try {
  await event('queued','Cloud gateway request queued');
  const modelsResponse = await fetch(url('models'),{headers,signal:abort.signal});
  if (!modelsResponse.ok) throw new Error('Gateway model discovery failed: HTTP '+modelsResponse.status);
  const models = await modelsResponse.json();
  const ids = (models.data || []).map(x=>x.id).filter(x=>typeof x==='string');
  if (!ids.length) throw new Error('No models exposed by gateway /v1/models');
  if (!model) throw new Error('Set FREELLMAPI_MODEL to one of: '+ids.join(', '));
  if (!ids.includes(model)) throw new Error('Configured model is not exposed by gateway: '+model+'. Available: '+ids.join(', '));
  await event('working','Requesting remote inference through FreeLLMAPI');
  const response = await fetch(url('chat/completions'), {
    method:'POST',headers,signal:abort.signal,
    body:JSON.stringify({model,stream:false,messages:[
      {role:'system',content:'You are a statistical analyst. Explain calculations clearly; do not fabricate sources. Python must verify production calculations.'},
      {role:'user',content:prompt}
    ],max_tokens:350,temperature:0.2})
  });
  if (!response.ok) throw new Error('Gateway completion failed: HTTP '+response.status);
  const result = await response.json();
  const answer = result.choices?.[0]?.message?.content;
  if (typeof answer!=='string'||!answer.trim()) throw new Error('No text response from cloud model');
  console.log('\n--- Statistical Analyst ---\n'+answer+'\n');
  await event('completed','Remote inference completed');
} catch (e) {
  await event('failed',e.name==='AbortError'?'Cloud gateway timed out':'Gateway inference failed');
  console.error(e.message);
  process.exitCode=1;
} finally { clearTimeout(timer); }
