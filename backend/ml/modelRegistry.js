const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..', '..');
const DEFAULT_REGISTRY_DIR = path.join(ROOT_DIR, 'mlops', 'registry');

function registryDir() {
  return path.resolve(process.env.MODEL_REGISTRY_DIR || DEFAULT_REGISTRY_DIR);
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function readJson(filePath, fallback = null) {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return fallback;
  }
}

function writeJsonAtomic(filePath, payload) {
  ensureDir(path.dirname(filePath));
  const tempPath = `${filePath}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(tempPath, JSON.stringify(payload, null, 2));
  fs.renameSync(tempPath, filePath);
}

function registryPath() {
  return path.join(registryDir(), 'registry.json');
}

function readRegistry() {
  return readJson(registryPath(), {
    schemaVersion: 1,
    updatedAt: null,
    models: {}
  });
}

function writeRegistry(registry) {
  registry.updatedAt = new Date().toISOString();
  writeJsonAtomic(registryPath(), registry);
}

function modelVersionDir(modelName, version) {
  return path.join(registryDir(), 'models', modelName, version);
}

function modelFile(modelName, version) {
  return path.join(modelVersionDir(modelName, version), 'model.json');
}

function currentFile(modelName) {
  return path.join(registryDir(), 'current', `${modelName}.json`);
}

function normalizeModelRecord(modelName, version, metadata = {}) {
  return {
    modelName,
    version,
    createdAt: metadata.createdAt || new Date().toISOString(),
    promotedAt: metadata.promotedAt || null,
    status: metadata.status || 'candidate',
    algorithm: metadata.algorithm || 'unknown',
    dataHash: metadata.dataHash || '',
    metrics: metadata.metrics || {},
    artifactPath: path.relative(ROOT_DIR, modelFile(modelName, version)).replace(/\\/g, '/'),
    metadata
  };
}

function registerModel(modelName, version, metadata = {}) {
  const record = normalizeModelRecord(modelName, version, metadata);
  const filePath = modelFile(modelName, version);
  writeJsonAtomic(filePath, record);

  const registry = readRegistry();
  registry.models[modelName] = registry.models[modelName] || { current: null, versions: [] };
  const versions = registry.models[modelName].versions.filter((item) => item.version !== version);
  versions.push({
    version,
    createdAt: record.createdAt,
    status: record.status,
    algorithm: record.algorithm,
    dataHash: record.dataHash,
    artifactPath: record.artifactPath
  });
  registry.models[modelName].versions = versions.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  writeRegistry(registry);
  return record;
}

function promoteModel(modelName, version, reason = 'manual-promote') {
  const record = readJson(modelFile(modelName, version));
  if (!record) throw new Error(`Model version not found: ${modelName}@${version}`);

  const promoted = {
    ...record,
    status: 'production',
    promotedAt: new Date().toISOString(),
    promotionReason: reason
  };
  writeJsonAtomic(modelFile(modelName, version), promoted);
  writeJsonAtomic(currentFile(modelName), promoted);

  const registry = readRegistry();
  registry.models[modelName] = registry.models[modelName] || { current: null, versions: [] };
  registry.models[modelName].current = version;
  registry.models[modelName].versions = registry.models[modelName].versions.map((item) => ({
    ...item,
    status: item.version === version ? 'production' : (item.status === 'production' ? 'archived' : item.status)
  }));
  writeRegistry(registry);
  return promoted;
}

function listVersions(modelName) {
  const registry = readRegistry();
  return registry.models[modelName]?.versions || [];
}

function getCurrentModel(modelName) {
  const current = readJson(currentFile(modelName));
  if (current) return current;
  const registry = readRegistry();
  const currentVersion = registry.models[modelName]?.current;
  return currentVersion ? readJson(modelFile(modelName, currentVersion)) : null;
}

function getCurrentModelSafe(modelName) {
  const current = getCurrentModel(modelName);
  if (!current) return { modelName, status: 'missing' };
  return {
    modelName,
    version: current.version,
    status: current.status,
    algorithm: current.algorithm,
    dataHash: current.dataHash,
    promotedAt: current.promotedAt,
    metrics: current.metrics
  };
}

function rollbackModel(modelName, targetVersion = '') {
  const versions = listVersions(modelName);
  if (!versions.length) throw new Error(`No versions registered for ${modelName}`);

  const current = getCurrentModel(modelName);
  const candidates = versions
    .filter((item) => item.version !== current?.version)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const nextVersion = targetVersion || candidates[0]?.version;
  if (!nextVersion) throw new Error(`No rollback target available for ${modelName}`);
  return promoteModel(modelName, nextVersion, 'rollback');
}

module.exports = {
  ROOT_DIR,
  registryDir,
  readJson,
  writeJsonAtomic,
  registerModel,
  promoteModel,
  rollbackModel,
  listVersions,
  getCurrentModel,
  getCurrentModelSafe
};
