const crypto = require('crypto');

const REDACTED = '[REDACTED]';
const SECRET_KEY_PATTERN = /(api[_-]?key|token|secret|password|authorization|cookie|credential|private)/i;

function serializeError(error) {
  if (!error) return undefined;
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: process.env.LOG_STACKS === '1' ? error.stack : undefined
    };
  }
  return error;
}

function redact(value, depth = 0) {
  if (depth > 5) return '[MaxDepth]';
  if (value instanceof Error) return serializeError(value);
  if (!value || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.slice(0, 50).map((item) => redact(item, depth + 1));

  const output = {};
  for (const [key, item] of Object.entries(value)) {
    output[key] = SECRET_KEY_PATTERN.test(key) ? REDACTED : redact(item, depth + 1);
  }
  return output;
}

function normalizeArgs(args) {
  return args.map((item) => {
    if (item instanceof Error) return serializeError(item);
    if (typeof item === 'string') return item;
    return redact(item);
  });
}

function writeLog(level, service, event, data = {}) {
  const entry = {
    ts: new Date().toISOString(),
    level,
    service,
    event,
    ...redact(data)
  };
  process.stdout.write(`${JSON.stringify(entry)}\n`);
}

function createLogger(serviceName = process.env.IIM_SERVICE_NAME || 'api') {
  const service = serviceName || 'api';
  return {
    debug(event, data) {
      if (process.env.LOG_LEVEL === 'debug') writeLog('debug', service, event, data);
    },
    info(event, data) {
      writeLog('info', service, event, data);
    },
    warn(event, data) {
      writeLog('warn', service, event, data);
    },
    error(event, data) {
      writeLog('error', service, event, data);
    },
    audit(event, data) {
      writeLog('audit', service, event, data);
    }
  };
}

let consoleInstalled = false;

function installConsoleLogger(serviceName) {
  if (consoleInstalled) return;
  consoleInstalled = true;
  const logger = createLogger(serviceName);

  console.log = (...args) => logger.info('console.log', { message: normalizeArgs(args) });
  console.info = (...args) => logger.info('console.info', { message: normalizeArgs(args) });
  console.warn = (...args) => logger.warn('console.warn', { message: normalizeArgs(args) });
  console.error = (...args) => logger.error('console.error', { message: normalizeArgs(args) });
}

function requestLogger(serviceName) {
  const logger = createLogger(serviceName);
  return (req, res, next) => {
    const startedAt = process.hrtime.bigint();
    const requestId = req.headers['x-request-id'] || crypto.randomUUID();
    req.requestId = requestId;
    res.setHeader('X-Request-Id', requestId);

    res.on('finish', () => {
      const durationMs = Number(process.hrtime.bigint() - startedAt) / 1e6;
      const payload = {
        requestId,
        method: req.method,
        path: req.originalUrl || req.url,
        statusCode: res.statusCode,
        durationMs: Number(durationMs.toFixed(2)),
        ip: req.ip,
        userAgent: req.headers['user-agent']
      };
      if (res.statusCode >= 500) logger.error('http.request', payload);
      else logger.info('http.request', payload);
    });

    next();
  };
}

module.exports = {
  createLogger,
  installConsoleLogger,
  requestLogger,
  serializeError,
  redact
};
