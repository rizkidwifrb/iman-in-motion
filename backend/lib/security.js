function securityHeaders() {
  return (req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    next();
  };
}

function clientKey(req) {
  const forwarded = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  return forwarded || req.ip || req.socket?.remoteAddress || 'unknown';
}

function createRateLimiter(options = {}) {
  const windowMs = Number(options.windowMs || process.env.RATE_LIMIT_WINDOW_MS || 60_000);
  const max = Number(options.max || process.env.RATE_LIMIT_MAX || 120);
  const buckets = new Map();

  const interval = setInterval(() => {
    const now = Date.now();
    for (const [key, value] of buckets.entries()) {
      if (value.resetAt <= now) buckets.delete(key);
    }
  }, Math.min(windowMs, 60_000));
  interval.unref?.();

  return (req, res, next) => {
    if (req.path === '/metrics' || req.path === '/health' || req.path === '/ready' || req.path === '/live') {
      return next();
    }

    const key = `${options.prefix || 'global'}:${clientKey(req)}`;
    const now = Date.now();
    const current = buckets.get(key) || { count: 0, resetAt: now + windowMs };
    if (current.resetAt <= now) {
      current.count = 0;
      current.resetAt = now + windowMs;
    }

    current.count += 1;
    buckets.set(key, current);

    const remaining = Math.max(0, max - current.count);
    res.setHeader('RateLimit-Limit', String(max));
    res.setHeader('RateLimit-Remaining', String(remaining));
    res.setHeader('RateLimit-Reset', String(Math.ceil(current.resetAt / 1000)));

    if (current.count > max) {
      return res.status(429).json({
        ok: false,
        message: 'Terlalu banyak request. Coba lagi sebentar.'
      });
    }

    return next();
  };
}

module.exports = {
  securityHeaders,
  createRateLimiter
};
