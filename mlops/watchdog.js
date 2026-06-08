#!/usr/bin/env node
require('dotenv').config();

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { ROOT_DIR } = require('./lib/data');

const runtimeDir = path.join(ROOT_DIR, 'mlops', 'runtime');
const statePath = path.join(runtimeDir, 'watchdog-state.json');

function readState() {
  try {
    if (!fs.existsSync(statePath)) return {};
    return JSON.parse(fs.readFileSync(statePath, 'utf8'));
  } catch {
    return {};
  }
}

function writeState(state) {
  fs.mkdirSync(runtimeDir, { recursive: true });
  fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
}

function runHealthCheck() {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [path.join(ROOT_DIR, 'mlops', 'health-check.js')], {
      cwd: ROOT_DIR,
      env: process.env,
      windowsHide: true
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => { stdout += chunk.toString(); });
    child.stderr.on('data', (chunk) => { stderr += chunk.toString(); });
    child.on('close', (code) => {
      let payload = null;
      try {
        payload = JSON.parse(stdout);
      } catch {
        payload = { ok: false, error: stderr || stdout || `health-check exited ${code}` };
      }
      resolve({ code, payload });
    });
  });
}

async function once() {
  const threshold = Number(process.env.WATCHDOG_FAILURE_THRESHOLD || 3);
  const state = readState();
  const { payload } = await runHealthCheck();
  const results = payload.results || [];

  for (const result of results) {
    state[result.name] = state[result.name] || { consecutiveFailures: 0, lastOkAt: null, lastFailureAt: null };
    if (result.ok) {
      state[result.name].consecutiveFailures = 0;
      state[result.name].lastOkAt = new Date().toISOString();
      state[result.name].lastError = null;
    } else {
      state[result.name].consecutiveFailures += 1;
      state[result.name].lastFailureAt = new Date().toISOString();
      state[result.name].lastError = result.error;
    }
  }

  writeState(state);
  const unhealthy = Object.entries(state)
    .filter(([, value]) => value.consecutiveFailures >= threshold)
    .map(([name, value]) => ({ name, ...value }));
  const ok = unhealthy.length === 0;
  process.stdout.write(`${JSON.stringify({ ok, checkedAt: new Date().toISOString(), threshold, unhealthy, health: payload }, null, 2)}\n`);
  return ok;
}

async function main() {
  const intervalMs = Number(process.env.WATCHDOG_INTERVAL_MS || 60_000);
  if (process.argv.includes('--loop')) {
    await once();
    setInterval(() => {
      once().catch((error) => {
        process.stderr.write(`${JSON.stringify({ ok: false, error: error.message })}\n`);
      });
    }, intervalMs);
    return;
  }

  const ok = await once();
  process.exit(ok ? 0 : 2);
}

main().catch((error) => {
  process.stderr.write(`${JSON.stringify({ ok: false, error: error.message })}\n`);
  process.exit(1);
});
