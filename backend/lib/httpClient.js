function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchJsonWithRetry(url, options = {}) {
  const retries = Number(options.retries ?? process.env.HTTP_RETRY_ATTEMPTS ?? 2);
  const timeoutMs = Number(options.timeoutMs ?? process.env.HTTP_TIMEOUT_MS ?? 2500);
  const retryDelayMs = Number(options.retryDelayMs ?? process.env.HTTP_RETRY_DELAY_MS ?? 150);
  const fetchOptions = { ...(options.fetchOptions || {}) };

  let lastError;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
        headers: {
          accept: 'application/json',
          ...(fetchOptions.headers || {})
        }
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        const error = new Error(`HTTP ${response.status} from ${url}`);
        error.status = response.status;
        error.payload = payload;
        throw error;
      }
      return payload;
    } catch (error) {
      lastError = error;
      if (attempt >= retries) break;
      const backoff = retryDelayMs * (attempt + 1);
      await sleep(backoff);
    } finally {
      clearTimeout(timeout);
    }
  }

  throw lastError;
}

function joinUrl(base, pathname) {
  return `${String(base || '').replace(/\/+$/, '')}/${String(pathname || '').replace(/^\/+/, '')}`;
}

module.exports = {
  fetchJsonWithRetry,
  joinUrl,
  sleep
};
