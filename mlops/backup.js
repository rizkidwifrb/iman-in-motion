#!/usr/bin/env node
require('dotenv').config();

const fs = require('fs');
const path = require('path');
const { ROOT_DIR, sha256File } = require('./lib/data');

const DEFAULT_RETENTION_DAYS = 30;

function isoStamp() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function copyIfExists(source, target) {
  if (!fs.existsSync(source)) return false;
  ensureDir(path.dirname(target));
  const stats = fs.statSync(source);
  if (stats.isDirectory()) {
    fs.cpSync(source, target, { recursive: true });
  } else {
    fs.copyFileSync(source, target);
  }
  return true;
}

function removeOldBackups(backupRoot, retentionDays) {
  if (!fs.existsSync(backupRoot)) return [];
  const cutoff = Date.now() - (retentionDays * 24 * 60 * 60 * 1000);
  const removed = [];
  for (const entry of fs.readdirSync(backupRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const fullPath = path.join(backupRoot, entry.name);
    const stat = fs.statSync(fullPath);
    if (stat.mtimeMs < cutoff) {
      fs.rmSync(fullPath, { recursive: true, force: true });
      removed.push(entry.name);
    }
  }
  return removed;
}

function main() {
  const backupRoot = path.resolve(process.env.BACKUP_DIR || path.join(ROOT_DIR, 'backups'));
  const retentionDays = Number(process.env.BACKUP_RETENTION_DAYS || DEFAULT_RETENTION_DAYS);
  const targetDir = path.join(backupRoot, isoStamp());
  ensureDir(targetDir);

  const items = [
    { name: 'model-registry', source: path.join(ROOT_DIR, 'mlops', 'registry'), target: path.join(targetDir, 'model-registry') },
    { name: 'knowledge-base', source: path.join(ROOT_DIR, 'data'), target: path.join(targetDir, 'data') },
    { name: 'film-metadata', source: path.join(ROOT_DIR, 'df_processed.csv'), target: path.join(targetDir, 'metadata', 'df_processed.csv') },
    { name: 'package-metadata', source: path.join(ROOT_DIR, 'package.json'), target: path.join(targetDir, 'metadata', 'package.json') }
  ];

  const copied = items.map((item) => ({
    name: item.name,
    source: path.relative(ROOT_DIR, item.source).replace(/\\/g, '/'),
    copied: copyIfExists(item.source, item.target)
  }));

  const manifest = {
    ok: true,
    createdAt: new Date().toISOString(),
    backupDir: path.relative(ROOT_DIR, targetDir).replace(/\\/g, '/'),
    retentionDays,
    copied,
    hashes: {
      filmMetadata: sha256File(path.join(ROOT_DIR, 'df_processed.csv')),
      ragMeta: sha256File(path.join(ROOT_DIR, 'data', 'rag_meta.json')),
      aimanKnowledge: sha256File(path.join(ROOT_DIR, 'data', 'aiman-knowledge.json')),
      islamicKnowledge: sha256File(path.join(ROOT_DIR, 'data', 'islamic-knowledge.json'))
    }
  };

  fs.writeFileSync(path.join(targetDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
  const removed = removeOldBackups(backupRoot, retentionDays);
  process.stdout.write(`${JSON.stringify({ ...manifest, removed }, null, 2)}\n`);
}

try {
  main();
} catch (error) {
  process.stderr.write(`${JSON.stringify({ ok: false, error: error.message })}\n`);
  process.exit(1);
}
