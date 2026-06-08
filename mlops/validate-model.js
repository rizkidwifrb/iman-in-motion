#!/usr/bin/env node
require('dotenv').config();

const { getCurrentModel, listVersions } = require('../backend/ml/modelRegistry');

const RULES = {
  'recommendation-engine': (model) => {
    const metrics = model?.metrics || {};
    const missingMoods = metrics.missingMoodCoverage || [];
    const totalFilms = Number(metrics.totalFilms || 0);
    const missingPosterRate = Number(metrics.missingPosterRate || 1);
    return [
      { ok: totalFilms >= 10, check: 'min_films', value: totalFilms },
      { ok: missingMoods.length === 0, check: 'mood_coverage', value: missingMoods },
      { ok: missingPosterRate <= 0.5, check: 'poster_coverage', value: missingPosterRate }
    ];
  },
  'rag-service': (model) => {
    const metrics = model?.metrics || {};
    const totalDocuments = Number(metrics.totalDocuments || 0);
    const typeCoverage = metrics.typeCoverage || {};
    return [
      { ok: totalDocuments >= 10, check: 'min_documents', value: totalDocuments },
      { ok: Number(typeCoverage.quran || 0) > 0, check: 'quran_coverage', value: typeCoverage }
    ];
  }
};

function validateModel(modelName) {
  const model = getCurrentModel(modelName);
  if (!model) {
    return {
      modelName,
      ok: false,
      error: 'current model missing',
      versions: listVersions(modelName).map((item) => item.version)
    };
  }
  const checks = RULES[modelName](model);
  return {
    modelName,
    version: model.version,
    ok: checks.every((item) => item.ok),
    checks
  };
}

function main() {
  const modelArg = process.argv.find((arg) => arg.startsWith('--model='))?.split('=')[1];
  const models = modelArg ? [modelArg] : Object.keys(RULES);
  const results = models.map(validateModel);
  const ok = results.every((item) => item.ok);
  process.stdout.write(`${JSON.stringify({ ok, results }, null, 2)}\n`);
  process.exit(ok ? 0 : 1);
}

main();
