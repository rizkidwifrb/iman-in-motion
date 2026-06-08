require('dotenv').config();

process.env.IIM_SERVICE_NAME = process.env.IIM_SERVICE_NAME || 'scheduler';

const path = require('path');
const { spawn } = require('child_process');
const express = require('express');
const cron = require('node-cron');
const { createLogger, requestLogger } = require('../lib/logger');
const { metricsMiddleware, metricsHandler, recordWorkflowRun } = require('../lib/metrics');
const { securityHeaders } = require('../lib/security');
const { attachGracefulShutdown } = require('../lib/gracefulShutdown');
const { ROOT_DIR } = require('../../mlops/lib/data');

const serviceName = process.env.IIM_SERVICE_NAME;
const logger = createLogger(serviceName);
const app = express();
const port = Number(process.env.PORT || 8083);
const running = new Set();
const workflowState = new Map();

const workflows = [
  {
    name: 'health-check',
    cron: process.env.HEALTH_CHECK_CRON || '*/2 * * * *',
    script: 'mlops/health-check.js'
  },
  {
    name: 'watchdog',
    cron: process.env.WATCHDOG_CRON || '* * * * *',
    script: 'mlops/watchdog.js'
  },
  {
    name: 'cache-refresh',
    cron: process.env.CACHE_REFRESH_CRON || '*/30 * * * *',
    script: 'mlops/cache-refresh.js'
  },
  {
    name: 'model-validation',
    cron: process.env.MODEL_VALIDATION_CRON || '15 * * * *',
    script: 'mlops/validate-model.js'
  },
  {
    name: 'model-retraining',
    cron: process.env.MODEL_RETRAINING_CRON || '0 3 * * *',
    script: 'mlops/train.js',
    args: ['--promote']
  },
  {
    name: 'backup',
    cron: process.env.BACKUP_CRON || '30 3 * * *',
    script: 'mlops/backup.js'
  }
];

function summarizeOutput(output) {
  const trimmed = String(output || '').trim();
  return trimmed.length > 1800 ? `${trimmed.slice(0, 1800)}...` : trimmed;
}

function runWorkflow(workflow, trigger = 'cron') {
  if (running.has(workflow.name)) {
    logger.warn('workflow.skipped_overlap', { workflow: workflow.name, trigger });
    return Promise.resolve({ ok: false, skipped: true });
  }

  running.add(workflow.name);
  const startedAt = Date.now();
  workflowState.set(workflow.name, { status: 'running', startedAt: new Date().toISOString(), trigger });
  logger.info('workflow.started', { workflow: workflow.name, trigger });

  return new Promise((resolve) => {
    const child = spawn(process.execPath, [path.join(ROOT_DIR, workflow.script), ...(workflow.args || [])], {
      cwd: ROOT_DIR,
      env: process.env,
      windowsHide: true
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => { stdout += chunk.toString(); });
    child.stderr.on('data', (chunk) => { stderr += chunk.toString(); });
    child.on('close', (code) => {
      running.delete(workflow.name);
      const durationMs = Date.now() - startedAt;
      const ok = code === 0;
      workflowState.set(workflow.name, {
        status: ok ? 'success' : 'failed',
        exitCode: code,
        durationMs,
        finishedAt: new Date().toISOString(),
        trigger,
        stdout: summarizeOutput(stdout),
        stderr: summarizeOutput(stderr)
      });
      recordWorkflowRun(workflow.name, ok ? 'success' : 'failed', { service: serviceName });
      logger[ok ? 'info' : 'error']('workflow.finished', {
        workflow: workflow.name,
        trigger,
        exitCode: code,
        durationMs,
        stdout: summarizeOutput(stdout),
        stderr: summarizeOutput(stderr)
      });
      resolve({ ok, code, stdout, stderr });
    });
  });
}

for (const workflow of workflows) {
  if (!cron.validate(workflow.cron)) {
    logger.error('workflow.invalid_cron', { workflow: workflow.name, cron: workflow.cron });
    continue;
  }
  cron.schedule(workflow.cron, () => runWorkflow(workflow), { timezone: process.env.SCHEDULER_TZ || 'Asia/Jakarta' });
  workflowState.set(workflow.name, { status: 'scheduled', cron: workflow.cron });
  logger.info('workflow.scheduled', { workflow: workflow.name, cron: workflow.cron });
}

app.disable('x-powered-by');
app.use(securityHeaders());
app.use(express.json({ limit: '128kb' }));
app.use(requestLogger(serviceName));
app.use(metricsMiddleware(serviceName));

app.get('/health', (req, res) => res.json({ status: 'ok', service: serviceName, workflows: workflows.length }));
app.get('/live', (req, res) => res.json({ status: 'alive', service: serviceName, uptimeSeconds: process.uptime() }));
app.get('/ready', (req, res) => res.json({ status: 'ready', service: serviceName }));
app.get('/metrics', metricsHandler(serviceName));
app.get('/workflows', (req, res) => {
  res.json({
    ok: true,
    workflows: Array.from(workflowState.entries()).map(([name, state]) => ({ name, ...state }))
  });
});
app.post('/workflows/:name/run', async (req, res) => {
  const workflow = workflows.find((item) => item.name === req.params.name);
  if (!workflow) return res.status(404).json({ ok: false, message: 'Workflow tidak ditemukan.' });
  const result = await runWorkflow(workflow, 'manual');
  return res.status(result.ok ? 200 : 500).json({ ok: result.ok, workflow: workflow.name });
});

const server = app.listen(port, () => {
  logger.info('service.started', { port, service: serviceName });
});

runWorkflow(workflows[0], 'startup').catch((error) => {
  logger.error('workflow.startup_error', { error });
});

attachGracefulShutdown(server, logger);
