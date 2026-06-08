#!/usr/bin/env node
require('dotenv').config();

const { rollbackModel } = require('../backend/ml/modelRegistry');

function arg(name, fallback = '') {
  return process.argv.find((item) => item.startsWith(`--${name}=`))?.split('=').slice(1).join('=') || fallback;
}

function main() {
  const modelName = arg('model');
  const version = arg('version');
  if (!modelName) {
    throw new Error('Gunakan --model=recommendation-engine atau --model=rag-service.');
  }
  const model = rollbackModel(modelName, version);
  process.stdout.write(`${JSON.stringify({ ok: true, rollback: model }, null, 2)}\n`);
}

try {
  main();
} catch (error) {
  process.stderr.write(`${JSON.stringify({ ok: false, error: error.message })}\n`);
  process.exit(1);
}
