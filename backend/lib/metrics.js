const counters = new Map();
const summaries = new Map();
const gauges = new Map();

function defaultService() {
  return process.env.IIM_SERVICE_NAME || 'api';
}

function normalizeLabels(labels = {}) {
  return Object.fromEntries(
    Object.entries(labels)
      .filter(([, value]) => value !== undefined && value !== null)
      .map(([key, value]) => [key, String(value)])
      .sort(([a], [b]) => a.localeCompare(b))
  );
}

function metricKey(name, labels = {}) {
  return `${name}|${JSON.stringify(normalizeLabels(labels))}`;
}

function labelString(labels = {}) {
  const normalized = normalizeLabels(labels);
  const entries = Object.entries(normalized);
  if (!entries.length) return '';
  const rendered = entries
    .map(([key, value]) => `${key}="${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n')}"`)
    .join(',');
  return `{${rendered}}`;
}

function incCounter(name, help, labels = {}, value = 1) {
  const key = metricKey(name, labels);
  const current = counters.get(key) || { name, help, labels: normalizeLabels(labels), value: 0 };
  current.value += Number(value) || 0;
  counters.set(key, current);
}

function setGauge(name, help, labels = {}, value = 0) {
  gauges.set(metricKey(name, labels), {
    name,
    help,
    labels: normalizeLabels(labels),
    value: Number(value) || 0
  });
}

function observeSummary(name, help, labels = {}, value = 0) {
  const key = metricKey(name, labels);
  const current = summaries.get(key) || { name, help, labels: normalizeLabels(labels), count: 0, sum: 0 };
  current.count += 1;
  current.sum += Number(value) || 0;
  summaries.set(key, current);
}

function routeLabel(req) {
  if (req.route?.path) return `${req.baseUrl || ''}${req.route.path}`;
  return String(req.path || req.url || '/')
    .replace(/[0-9a-f]{16,}/gi, ':id')
    .replace(/\b\d+\b/g, ':id')
    .replace(/\/+/g, '/');
}

function metricsMiddleware(serviceName = defaultService()) {
  return (req, res, next) => {
    const startedAt = process.hrtime.bigint();
    res.on('finish', () => {
      const durationSeconds = Number(process.hrtime.bigint() - startedAt) / 1e9;
      const route = routeLabel(req);
      const labels = {
        service: serviceName,
        method: req.method,
        route,
        status_code: res.statusCode
      };

      incCounter('iim_http_requests_total', 'Total HTTP requests by service, route, method, and status.', labels);
      observeSummary(
        'iim_http_request_duration_seconds',
        'HTTP request latency in seconds.',
        { service: serviceName, method: req.method, route },
        durationSeconds
      );
      if (res.statusCode >= 500) {
        incCounter('iim_http_errors_total', 'Total HTTP 5xx errors.', labels);
      }
    });
    next();
  };
}

function recordModelInference(labels = {}, count = 1) {
  incCounter(
    'iim_model_inference_total',
    'Total model inference calls.',
    {
      service: labels.service || defaultService(),
      model: labels.model || 'unknown',
      outcome: labels.outcome || 'ok'
    },
    count
  );
}

function recordRecommendationCount(count = 0, labels = {}) {
  incCounter(
    'iim_recommendations_returned_total',
    'Total recommendations returned.',
    {
      service: labels.service || defaultService(),
      mood: labels.mood || 'unknown',
      source: labels.source || 'local'
    },
    count
  );
}

function recordWorkflowRun(name, outcome, labels = {}) {
  incCounter(
    'iim_workflow_runs_total',
    'Total scheduler workflow runs.',
    {
      service: labels.service || defaultService(),
      workflow: name,
      outcome
    }
  );
}

function collectProcessMetrics(serviceName = defaultService()) {
  const memory = process.memoryUsage();
  const cpu = process.cpuUsage();
  setGauge('iim_process_memory_rss_bytes', 'Resident memory size in bytes.', { service: serviceName }, memory.rss);
  setGauge('iim_process_memory_heap_used_bytes', 'Used V8 heap in bytes.', { service: serviceName }, memory.heapUsed);
  setGauge('iim_process_memory_heap_total_bytes', 'Total V8 heap in bytes.', { service: serviceName }, memory.heapTotal);
  setGauge('iim_process_cpu_user_seconds_total', 'User CPU seconds consumed by the process.', { service: serviceName }, cpu.user / 1e6);
  setGauge('iim_process_cpu_system_seconds_total', 'System CPU seconds consumed by the process.', { service: serviceName }, cpu.system / 1e6);
  setGauge('iim_process_uptime_seconds', 'Process uptime in seconds.', { service: serviceName }, process.uptime());
}

function renderFamily(items, type) {
  const byName = new Map();
  for (const item of items.values()) {
    if (!byName.has(item.name)) byName.set(item.name, []);
    byName.get(item.name).push(item);
  }

  const lines = [];
  for (const [name, series] of byName.entries()) {
    lines.push(`# HELP ${name} ${series[0].help}`);
    lines.push(`# TYPE ${name} ${type}`);
    for (const item of series) {
      lines.push(`${name}${labelString(item.labels)} ${item.value}`);
    }
  }
  return lines;
}

function renderSummaries() {
  const byName = new Map();
  for (const item of summaries.values()) {
    if (!byName.has(item.name)) byName.set(item.name, []);
    byName.get(item.name).push(item);
  }

  const lines = [];
  for (const [name, series] of byName.entries()) {
    lines.push(`# HELP ${name} ${series[0].help}`);
    lines.push(`# TYPE ${name} summary`);
    for (const item of series) {
      lines.push(`${name}_sum${labelString(item.labels)} ${item.sum}`);
      lines.push(`${name}_count${labelString(item.labels)} ${item.count}`);
    }
  }
  return lines;
}

function renderMetrics(serviceName = defaultService()) {
  collectProcessMetrics(serviceName);
  return [
    ...renderFamily(counters, 'counter'),
    ...renderFamily(gauges, 'gauge'),
    ...renderSummaries()
  ].join('\n') + '\n';
}

function metricsHandler(serviceName = defaultService()) {
  return (req, res) => {
    res.setHeader('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
    res.send(renderMetrics(serviceName));
  };
}

module.exports = {
  incCounter,
  setGauge,
  observeSummary,
  metricsMiddleware,
  metricsHandler,
  renderMetrics,
  recordModelInference,
  recordRecommendationCount,
  recordWorkflowRun
};
