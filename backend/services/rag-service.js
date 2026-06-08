require('dotenv').config();

process.env.IIM_SERVICE_NAME = process.env.IIM_SERVICE_NAME || 'rag-service';

const express = require('express');
const coreApp = require('../../app');
const { createLogger, requestLogger } = require('../lib/logger');
const { metricsMiddleware, metricsHandler, recordModelInference } = require('../lib/metrics');
const { securityHeaders, createRateLimiter } = require('../lib/security');
const { safeInteger, safeString } = require('../lib/validation');
const { attachGracefulShutdown } = require('../lib/gracefulShutdown');
const modelRegistry = require('../ml/modelRegistry');

const serviceName = process.env.IIM_SERVICE_NAME;
const logger = createLogger(serviceName);
const app = express();
const port = Number(process.env.PORT || 8082);
const ml = coreApp.locals.ml;

app.disable('x-powered-by');
app.use(securityHeaders());
app.use(express.json({ limit: '512kb' }));
app.use(requestLogger(serviceName));
app.use(metricsMiddleware(serviceName));
app.use(createRateLimiter({ prefix: serviceName, max: Number(process.env.RAG_RATE_LIMIT_MAX || 300) }));

function statusPayload() {
  const stats = ml.serviceStats();
  return {
    status: 'ok',
    service: serviceName,
    rag: stats.rag,
    model: modelRegistry.getCurrentModelSafe('rag-service')
  };
}

app.get('/health', (req, res) => res.json(statusPayload()));
app.get('/live', (req, res) => res.json({ status: 'alive', service: serviceName, uptimeSeconds: process.uptime() }));
app.get('/ready', (req, res) => {
  const payload = statusPayload();
  const ready = payload.rag > 0;
  res.status(ready ? 200 : 503).json({ ...payload, status: ready ? 'ready' : 'not_ready' });
});
app.get('/metrics', metricsHandler(serviceName));

app.get('/model', (req, res) => {
  res.json({ ok: true, model: modelRegistry.getCurrentModelSafe('rag-service') });
});

app.get('/search', (req, res) => {
  const q = safeString(req.query.q, '', 2000);
  const mood = safeString(req.query.mood || ml.detectMood(q), 'tenang', 32);
  const limit = safeInteger(req.query.limit, 5, 1, 20);
  const results = ml.retrieveRag(q, mood, limit);
  recordModelInference({ service: serviceName, model: 'rag-service', outcome: 'ok' });
  res.json({
    ok: true,
    service: serviceName,
    mood,
    model: modelRegistry.getCurrentModelSafe('rag-service'),
    results
  });
});

app.post('/search', (req, res) => {
  const q = safeString(req.body?.q || req.body?.message, '', 2000);
  const mood = safeString(req.body?.mood || ml.detectMood(q), 'tenang', 32);
  const limit = safeInteger(req.body?.limit, 5, 1, 20);
  const results = ml.retrieveRag(q, mood, limit);
  recordModelInference({ service: serviceName, model: 'rag-service', outcome: 'ok' });
  res.json({ ok: true, mood, results });
});

app.use((err, req, res, next) => {
  logger.error('rag.unhandled_error', { requestId: req.requestId, error: err });
  if (res.headersSent) return next(err);
  return res.status(500).json({ ok: false, message: 'RAG service error.' });
});

const server = app.listen(port, () => {
  logger.info('service.started', { port, service: serviceName });
});

attachGracefulShutdown(server, logger);
