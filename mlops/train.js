#!/usr/bin/env node
require('dotenv').config();

const path = require('path');
const { registerModel, promoteModel } = require('../backend/ml/modelRegistry');
const { ROOT_DIR, sha256File, sha256Object, readJson, readCsvRows, countBy, topCounts } = require('./lib/data');

const REQUIRED_MOODS = ['sedih', 'gelisah', 'hidayah', 'bahagia', 'marah', 'rindu'];

function versionId() {
  return `v${new Date().toISOString().replace(/[-:]/g, '').replace(/\..+/, '').replace('T', '')}`;
}

function normalizeMood(value = '') {
  const mood = String(value || '').toLowerCase().split(/[|,]/)[0]?.trim();
  return REQUIRED_MOODS.includes(mood) ? mood : 'tenang';
}

function splitList(value = '') {
  return String(value || '').split(/[|,]/).map((item) => item.trim()).filter(Boolean);
}

function numeric(value) {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function buildRecommendationMetadata(rows, dataHash) {
  const validRows = rows.filter((row) => row.title_asli || row.title || row.title_en);
  const moodCounts = countBy(validRows, (row) => normalizeMood(row.mood));
  const genreCounts = {};
  for (const row of validRows) {
    for (const genre of splitList(row.genres || row.genre)) {
      genreCounts[genre] = (genreCounts[genre] || 0) + 1;
    }
  }

  const ratings = validRows.map((row) => numeric(row.rating || row.vote_average || row.tmdb_vote_average)).filter(Boolean);
  const missingPoster = validRows.filter((row) => !(row.poster_url || row.poster)).length;
  const missingRating = validRows.filter((row) => !numeric(row.rating || row.vote_average || row.tmdb_vote_average)).length;
  const missingMoodCoverage = REQUIRED_MOODS.filter((mood) => !moodCounts[mood]);
  const avgRating = ratings.length ? ratings.reduce((sum, value) => sum + value, 0) / ratings.length : 0;

  return {
    createdAt: new Date().toISOString(),
    status: missingMoodCoverage.length ? 'needs_review' : 'candidate',
    algorithm: 'hybrid-semantic-bm25-bayesian-v3',
    dataHash,
    features: [
      'mood keyword detection',
      'semantic token similarity',
      'genre affinity',
      'bayesian rating confidence',
      'optional native cpp ranker'
    ],
    metrics: {
      totalFilms: validRows.length,
      totalRows: rows.length,
      moodCoverage: moodCounts,
      missingMoodCoverage,
      topGenres: topCounts(genreCounts, 20),
      avgRating: Number(avgRating.toFixed(3)),
      missingPosterRate: validRows.length ? Number((missingPoster / validRows.length).toFixed(4)) : 1,
      missingRatingRate: validRows.length ? Number((missingRating / validRows.length).toFixed(4)) : 1
    },
    validationRules: {
      requiredMoods: REQUIRED_MOODS,
      minFilms: 10,
      maxMissingPosterRate: 0.5
    }
  };
}

function buildRagMetadata({ ragDocs, islamicKnowledge, aimanKnowledge, dataHash }) {
  const typeCounts = countBy(ragDocs, (doc) => doc.type || 'text');
  const topics = Array.isArray(islamicKnowledge) ? islamicKnowledge.map((item) => item.topic).filter(Boolean) : [];
  return {
    createdAt: new Date().toISOString(),
    status: ragDocs.length ? 'candidate' : 'needs_review',
    algorithm: 'bm25-keyword-rag-v1',
    dataHash,
    features: [
      'normalized lexical retrieval',
      'mood anchor boosting',
      'quran and hadith type weighting',
      'intent-aware result ordering'
    ],
    metrics: {
      totalDocuments: ragDocs.length,
      typeCoverage: typeCounts,
      islamicTopics: topics.length,
      knowledgeBaseSections: Object.keys(aimanKnowledge || {}).length
    },
    validationRules: {
      minDocuments: 10,
      requiredTypes: ['quran']
    }
  };
}

async function main() {
  const promote = process.argv.includes('--promote');
  const version = process.env.MODEL_VERSION || versionId();
  const csvPath = path.join(ROOT_DIR, 'df_processed.csv');
  const ragPath = path.join(ROOT_DIR, 'data', 'rag_meta.json');
  const islamicPath = path.join(ROOT_DIR, 'data', 'islamic-knowledge.json');
  const aimanPath = path.join(ROOT_DIR, 'data', 'aiman-knowledge.json');

  const rows = await readCsvRows(csvPath);
  const ragDocs = readJson(ragPath, []);
  const islamicKnowledge = readJson(islamicPath, []);
  const aimanKnowledge = readJson(aimanPath, {});

  const recommendationHash = sha256File(csvPath);
  const ragHash = sha256Object({
    rag: sha256File(ragPath),
    islamic: sha256File(islamicPath),
    aiman: sha256File(aimanPath)
  });

  const recommendation = registerModel(
    'recommendation-engine',
    version,
    buildRecommendationMetadata(rows, recommendationHash)
  );
  const rag = registerModel(
    'rag-service',
    version,
    buildRagMetadata({ ragDocs, islamicKnowledge, aimanKnowledge, dataHash: ragHash })
  );

  const result = { ok: true, version, models: { recommendation, rag }, promoted: false };
  if (promote) {
    result.models.recommendation = promoteModel('recommendation-engine', version, 'training-workflow');
    result.models.rag = promoteModel('rag-service', version, 'training-workflow');
    result.promoted = true;
  }

  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

main().catch((error) => {
  process.stderr.write(`${JSON.stringify({ ok: false, error: error.message })}\n`);
  process.exit(1);
});
