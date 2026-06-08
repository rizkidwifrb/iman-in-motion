function attachGracefulShutdown(server, logger, options = {}) {
  const timeoutMs = Number(options.timeoutMs || process.env.SHUTDOWN_TIMEOUT_MS || 10_000);
  let closing = false;

  function shutdown(signal) {
    if (closing) return;
    closing = true;
    logger?.info?.('service.shutdown.started', { signal, timeoutMs });

    const forceTimer = setTimeout(() => {
      logger?.error?.('service.shutdown.timeout', { signal, timeoutMs });
      process.exit(1);
    }, timeoutMs);
    forceTimer.unref?.();

    server.close((error) => {
      clearTimeout(forceTimer);
      if (error) {
        logger?.error?.('service.shutdown.error', { error });
        process.exit(1);
      }
      logger?.info?.('service.shutdown.complete', { signal });
      process.exit(0);
    });
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

module.exports = {
  attachGracefulShutdown
};
