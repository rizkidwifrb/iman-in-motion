import dalilDataset from '../../data/dalil-rag.json';

const stopwords = new Set([
  'aku', 'saya', 'gue', 'gw', 'yang', 'dan', 'atau', 'di', 'ke', 'dari', 'ini', 'itu',
  'untuk', 'buat', 'dengan', 'karena', 'lagi', 'banget', 'mood', 'dalil'
]);

const moodQueries = {
  sedih: 'sedih lelah kecewa kehilangan sabar jangan bersedih ujian rahmat pertolongan',
  gelisah: 'gelisah cemas takut overthinking tenang dzikir tawakal hati tenteram perlindungan',
  hidayah: 'hidayah hijrah taubat dosa ampunan petunjuk berubah jalan lurus niat',
  bahagia: 'bahagia senang syukur nikmat alhamdulillah karunia berbagi senyum',
  marah: 'marah emosi kesal amarah menahan memaafkan lisan diam sabar',
  rindu: 'rindu kangen keluarga saudara kehilangan hubungan kasih sayang pulang'
};

function normalize(value = '') {
  return String(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s']/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokensOf(value = '') {
  return normalize(value)
    .split(' ')
    .filter((token) => token.length > 2 && !stopwords.has(token));
}

function searchText(item) {
  return normalize([
    item.ref,
    item.type,
    item.topic,
    item.text,
    item.explanation,
    ...(item.keywords || []),
    ...(item.moods || [])
  ].join(' '));
}

function scoreDalil(item, mood = '', query = '') {
  const normalizedMood = normalize(mood);
  const text = searchText(item);
  const terms = [...new Set(tokensOf(`${moodQueries[normalizedMood] || ''} ${query}`))];

  let score = 0;
  if ((item.moods || []).includes(normalizedMood)) score += 22;
  if (item.type === 'quran') score += 3;
  if (/\bhadis|hadits|hadith|sabda|nabi\b/.test(normalize(query)) && item.type === 'hadith') score += 18;

  terms.forEach((term) => {
    if (text.includes(term)) score += term.length > 5 ? 3 : 2;
  });

  return score;
}

export function getDalilByMood(mood = 'sedih', { query = '', limit = 8, excludeIds = [] } = {}) {
  const excluded = new Set(excludeIds);
  return dalilDataset
    .map((item) => ({ ...item, score: scoreDalil(item, mood, query) }))
    .filter((item) => item.score > 0 && !excluded.has(item.id))
    .sort((a, b) => b.score - a.score || a.ref.localeCompare(b.ref))
    .slice(0, limit);
}

export function getRandomDalilByMood(mood = 'sedih', { query = '', excludeId = '' } = {}) {
  const candidates = getDalilByMood(mood, { query, limit: 12, excludeIds: excludeId ? [excludeId] : [] });
  if (!candidates.length) return dalilDataset.find((item) => item.id !== excludeId) || dalilDataset[0] || null;
  const topScore = candidates[0].score || 1;
  const weighted = candidates.flatMap((item) => {
    const weight = Math.max(1, Math.round(((item.score || 1) / topScore) * 4));
    return Array.from({ length: weight }, () => item);
  });
  return weighted[Math.floor(Math.random() * weighted.length)] || candidates[0];
}

export function getDalilDataset() {
  return dalilDataset.slice();
}
