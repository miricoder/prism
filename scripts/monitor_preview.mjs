import { spawn } from 'node:child_process';
import { appendFile, writeFile } from 'node:fs/promises';

const TARGET = process.env.PRISM_MONITOR_TARGET || 'https://prism-git-cap-travel-miricoders-projects.vercel.app';
const LOG_PATH = process.env.PRISM_MONITOR_LOG || 'monitor.log';
const VERCEL_LOG_PATH = process.env.PRISM_VERCEL_LOG || 'vercel-preview.log';

async function banner() {
  await appendFile(LOG_PATH, JSON.stringify({ ts: new Date().toISOString(), kind: 'monitor_start', target: TARGET }) + '\n');
  await appendFile(VERCEL_LOG_PATH, `\n--- monitor start ${new Date().toISOString()} target=${TARGET} ---\n`);
}

function spawnVercelLogs() {
  const args = [
    'logs',
    TARGET,
    '--environment',
    'preview',
    '--since',
    '30m',
    '--follow',
    '--json',
  ];
  const p = spawn('vercel', args, { stdio: ['ignore', 'pipe', 'pipe'] });

  p.stdout.on('data', async (buf) => {
    await appendFile(VERCEL_LOG_PATH, buf);
  });
  p.stderr.on('data', async (buf) => {
    await appendFile(VERCEL_LOG_PATH, buf);
  });

  return p;
}

function spawnProxy() {
  const p = spawn('node', ['scripts/live_proxy.mjs'], {
    stdio: 'inherit',
    env: { ...process.env, PRISM_MONITOR_TARGET: TARGET, PRISM_MONITOR_LOG: LOG_PATH },
  });
  return p;
}

await banner();
await writeFile('monitor.target.txt', `${TARGET}\n`, 'utf8');

const proxy = spawnProxy();
const logs = spawnVercelLogs();

const shutdown = (code = 0) => {
  try { logs.kill('SIGTERM'); } catch {}
  try { proxy.kill('SIGTERM'); } catch {}
  process.exit(code);
};

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

proxy.on('exit', (code) => shutdown(code ?? 0));
logs.on('exit', () => {
  // keep proxy alive even if logs exit
});

