import { spawn } from 'node:child_process';
import { appendFile } from 'node:fs/promises';

const LOG_PATH = process.env.PRISM_MONITOR_LOG || 'monitor.log';
const PROXY_PORT = String(process.env.PRISM_PROXY_PORT || 8787);
const LOCAL_TARGET = process.env.PRISM_MONITOR_TARGET || 'http://localhost:3000';

async function banner() {
  await appendFile(LOG_PATH, JSON.stringify({ ts: new Date().toISOString(), kind: 'dev_monitor_start', target: LOCAL_TARGET }) + '\n');
}

function spawnNextDev() {
  return spawn('npm', ['run', 'dev'], { stdio: 'inherit' });
}

function spawnProxy() {
  return spawn('node', ['scripts/live_proxy.mjs'], {
    stdio: 'inherit',
    env: { ...process.env, PRISM_PROXY_PORT: PROXY_PORT, PRISM_MONITOR_TARGET: LOCAL_TARGET, PRISM_MONITOR_LOG: LOG_PATH },
  });
}

await banner();

const nextDev = spawnNextDev();
const proxy = spawnProxy();

const shutdown = (code = 0) => {
  try { nextDev.kill('SIGTERM'); } catch {}
  try { proxy.kill('SIGTERM'); } catch {}
  process.exit(code);
};

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

nextDev.on('exit', (code) => shutdown(code ?? 0));
proxy.on('exit', (code) => shutdown(code ?? 0));

