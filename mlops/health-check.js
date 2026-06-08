#!/usr/bin/env node
require('dotenv').config();

const { fetchJsonWithRetry } = require('../backend/lib/httpClient');

function parseTargets() {
  const raw = process.env.IIM_HEALTH_TARGETS || [
    'api:http://localhost:8080/health',
    'recommendation-engine:http://localhost:8081/health',
    'rag-service:http://localhost:8082/health'
  ].join(',');
  return raw.split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => {
      const [name, ...urlParts] = item.split(':');
      return { name, url: urlParts.join(':') };
    })
    .filter((item) => item.name && item.url);
}

async function checkTarget(target) {
  const startedAt = Date.now();
  try {
    const payload = await fetchJsonWithRetry(target.url, {
      retries: Number(process.env.HEALTH_RETRY_ATTEMPTS || 1),
      timeoutMs: Number(process.env.HEALTH_TIMEOUT_MS || 2000)
    });
    return {
      name: target.name,
      url: target.url,
      ok: true,
      latencyMs: Date.now() - startedAt,
      payload
    };
  } catch (error) {
    return {
      name: target.name,
      url: target.url,
      ok: false,
      latencyMs: Date.now() - startedAt,
      error: error.message
    };
  }
}

async function main() {
  const results = await Promise.all(parseTargets().map(checkTarget));
  const ok = results.every((item) => item.ok);
  process.stdout.write(`${JSON.stringify({ ok, checkedAt: new Date().toISOString(), results }, null, 2)}\n`);
  process.exit(ok ? 0 : 1);
}

main().catch((error) => {
  process.stderr.write(`${JSON.stringify({ ok: false, error: error.message })}\n`);
  process.exit(1);
});
