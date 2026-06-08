#!/usr/bin/env node
require('dotenv').config();

const fs = require('fs');
const path = require('path');
const { ROOT_DIR, readJson, sha256File } = require('./lib/data');

function ensureJson(filePath, fallback) {
  const payload = readJson(filePath, fallback);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(fallback, null, 2));
  }
  return payload;
}

function main() {
  const dataDir = path.join(ROOT_DIR, 'data');
  const caches = [
    path.join(dataDir, 'trailer-cache.json'),
    path.join(dataDir, 'tmdb-rating-cache.json')
  ];

  const cacheStats = caches.map((filePath) => {
    const payload = ensureJson(filePath, {});
    return {
      file: path.relative(ROOT_DIR, filePath).replace(/\\/g, '/'),
      entries: payload && typeof payload === 'object' ? Object.keys(payload).length : 0,
      hash: sha256File(filePath)
    };
  });

  const meta = {
    ok: true,
    refreshedAt: new Date().toISOString(),
    caches: cacheStats
  };
  fs.writeFileSync(path.join(dataDir, 'cache-refresh-meta.json'), JSON.stringify(meta, null, 2));
  process.stdout.write(`${JSON.stringify(meta, null, 2)}\n`);
}

try {
  main();
} catch (error) {
  process.stderr.write(`${JSON.stringify({ ok: false, error: error.message })}\n`);
  process.exit(1);
}
