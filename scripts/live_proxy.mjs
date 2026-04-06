import http from 'node:http';
import { URL } from 'node:url';
import { appendFile } from 'node:fs/promises';

const PORT = Number(process.env.PRISM_PROXY_PORT || 8787);
const TARGET = process.env.PRISM_MONITOR_TARGET || 'https://prism-git-cap-travel-miricoders-projects.vercel.app';
const LOG_PATH = process.env.PRISM_MONITOR_LOG || 'monitor.log';

const SENSITIVE_HEADERS = new Set([
  'authorization',
  'cookie',
  'set-cookie',
  'x-vercel-protection-bypass',
  'x-vercel-deployment-url',
]);

function redactHeaders(headers) {
  const out = {};
  for (const [k, v] of Object.entries(headers || {})) {
    if (SENSITIVE_HEADERS.has(k.toLowerCase())) {
      out[k] = '[REDACTED]';
    } else {
      out[k] = v;
    }
  }
  return out;
}

async function logLine(obj) {
  await appendFile(LOG_PATH, `${JSON.stringify(obj)}\n`, 'utf8');
}

const server = http.createServer(async (req, res) => {
  const start = Date.now();
  const reqUrl = new URL(req.url || '/', `http://${req.headers.host || `localhost:${PORT}`}`);
  const upstreamUrl = new URL(reqUrl.pathname + reqUrl.search, TARGET);

  const requestHeaders = { ...req.headers };
  delete requestHeaders.host;

  let bodyBuf = null;
  if (req.method && !['GET', 'HEAD'].includes(req.method)) {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    bodyBuf = Buffer.concat(chunks);
  }

  try {
    const upstreamRes = await fetch(upstreamUrl, {
      method: req.method || 'GET',
      headers: requestHeaders,
      body: bodyBuf ?? undefined,
      redirect: 'manual',
    });

    const durationMs = Date.now() - start;
    const text = await upstreamRes.text();

    // Mirror status + headers
    res.statusCode = upstreamRes.status;
    upstreamRes.headers.forEach((value, key) => {
      // Avoid passing upstream set-cookie to local proxy response
      if (key.toLowerCase() === 'set-cookie') return;
      res.setHeader(key, value);
    });

    res.end(text);

    await logLine({
      ts: new Date().toISOString(),
      kind: 'proxy',
      method: req.method,
      path: reqUrl.pathname,
      query: reqUrl.search,
      upstream: upstreamUrl.toString(),
      status: upstreamRes.status,
      durationMs,
      requestHeaders: redactHeaders(req.headers),
      responseHeaders: redactHeaders(Object.fromEntries(upstreamRes.headers.entries())),
      bodySnippet: text.slice(0, 1200),
    });
  } catch (err) {
    const durationMs = Date.now() - start;
    res.statusCode = 502;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ error: 'Proxy upstream failed', detail: String(err) }));
    await logLine({
      ts: new Date().toISOString(),
      kind: 'proxy_error',
      method: req.method,
      path: reqUrl.pathname,
      query: reqUrl.search,
      upstream: upstreamUrl.toString(),
      status: 502,
      durationMs,
      error: String(err),
      requestHeaders: redactHeaders(req.headers),
    });
  }
});

server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`PRISM live proxy listening on http://localhost:${PORT}`);
  // eslint-disable-next-line no-console
  console.log(`Forwarding to: ${TARGET}`);
  // eslint-disable-next-line no-console
  console.log(`Logging to: ${LOG_PATH}`);
});

