require('dotenv').config();

process.env.IIM_SERVICE_NAME = process.env.IIM_SERVICE_NAME || 'recommendation-engine';

const express = require('express');
const coreApp = require('../../app');
const { createLogger, requestLogger } = require('../lib/logger');
const { metricsMiddleware, metricsHandler, recordModelInference, recordRecommendationCount } = require('../lib/metrics');
const { securityHeaders, createRateLimiter } = require('../lib/security');
const { safeInteger, safeString } = require('../lib/validation');
const { attachGracefulShutdown } = require('../lib/gracefulShutdown');
const modelRegistry = require('../ml/modelRegistry');

const serviceName = process.env.IIM_SERVICE_NAME;
const logger = createLogger(serviceName);
const app = express();
const port = Number(process.env.PORT || 8081);
const ml = coreApp.locals.ml;

app.disable('x-powered-by');
app.use(securityHeaders());
app.use(express.json({ limit: '512kb' }));
app.use(requestLogger(serviceName));
app.use(metricsMiddleware(serviceName));
app.use(createRateLimiter({ prefix: serviceName, max: Number(process.env.RECOMMENDATION_RATE_LIMIT_MAX || 240) }));

function statusPayload() {
  const stats = ml.serviceStats();
  return {
    status: 'ok',
    service: serviceName,
    films: stats.films,
    model: modelRegistry.getCurrentModelSafe('recommendation-engine')
  };
}

app.get('/health', (req, res) => res.json(statusPayload()));
app.get('/live', (req, res) => res.json({ status: 'alive', service: serviceName, uptimeSeconds: process.uptime() }));
app.get('/ready', (req, res) => {
  const payload = statusPayload();
  const ready = payload.films > 0;
  res.status(ready ? 200 : 503).json({ ...payload, status: ready ? 'ready' : 'not_ready' });
});
app.get('/metrics', metricsHandler(serviceName));

app.get('/model', (req, res) => {
  res.json({ ok: true, model: modelRegistry.getCurrentModelSafe('recommendation-engine') });
});

app.get('/recommendations', (req, res) => {
  const query = safeString(req.query.q, '', 500);
  const mood = safeString(req.query.mood || ml.detectMood(query), 'tenang', 32);
  const limit = safeInteger(req.query.limit, 3, 1, 24);
  const films = ml.recommendedFilms(mood).slice(0, limit);
  recordModelInference({ service: serviceName, model: 'recommendation-engine', outcome: 'ok' });
  recordRecommendationCount(films.length, { service: serviceName, mood, source: 'service' });
  res.json({
    ok: true,
    service: serviceName,
    mood,
    model: modelRegistry.getCurrentModelSafe('recommendation-engine'),
    films
  });
});

app.post('/rank', (req, res) => {
  const message = safeString(req.body?.message, '', 2000);
  const mood = safeString(req.body?.mood || ml.detectMood(message), 'tenang', 32);
  const limit = safeInteger(req.body?.limit, 3, 1, 24);
  const films = ml.recommendedFilms(mood).slice(0, limit);
  recordModelInference({ service: serviceName, model: 'recommendation-engine', outcome: 'ok' });
  recordRecommendationCount(films.length, { service: serviceName, mood, source: 'service' });
  res.json({ ok: true, mood, films });
});

app.use((err, req, res, next) => {
  logger.error('recommendation.unhandled_error', { requestId: req.requestId, error: err });
  if (res.headersSent) return next(err);
  return res.status(500).json({ ok: false, message: 'Recommendation engine error.' });
});

const server = app.listen(port, () => {
  logger.info('service.started', { port, service: serviceName });
});

attachGracefulShutdown(server, logger);
