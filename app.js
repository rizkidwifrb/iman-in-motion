// app.js - IMAN IN MOTION + AIMAN Friend-RAG Upgrade
require('dotenv').config();

const express = require('express');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const cors = require('cors');
const { execFileSync } = require('child_process');

const app = express();
const PORT = process.env.PORT || 8080;
const GROQ_KEY = process.env.GROQ_API_KEY;
const CPP_RANKER_PATH = process.env.IIM_CPP_RANKER_PATH || path.join(__dirname, 'bin', process.platform === 'win32' ? 'iim_ranker.exe' : 'iim_ranker');
let cppRankerUnavailable = false;

app.use(cors());
app.use(express.json({ limit: '1mb' }));
const distPath = path.join(__dirname, 'dist');
const publicPath = path.join(__dirname, 'public');

// Serve React build first when available. Keep old public folder as fallback/assets.
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
}
app.use(express.static(publicPath));

// =========================
// Trailer resolver (TMDB -> direct YouTube watch URL)
// =========================
const TMDB_KEY = process.env.TMDB_API_KEY || '';
const TMDB_BEARER = process.env.TMDB_BEARER_TOKEN || process.env.TMDB_READ_TOKEN || '';
const trailerCachePath = path.join(__dirname, 'data', 'trailer-cache.json');
let TRAILER_CACHE = {};

function loadTrailerCache() {
  try {
    if (fs.existsSync(trailerCachePath)) {
      TRAILER_CACHE = JSON.parse(fs.readFileSync(trailerCachePath, 'utf8')) || {};
    }
  } catch (e) {
    console.warn('[WARN] trailer cache gagal dibaca:', e.message);
    TRAILER_CACHE = {};
  }
}

function saveTrailerCache() {
  try {
    fs.mkdirSync(path.dirname(trailerCachePath), { recursive: true });
    fs.writeFileSync(trailerCachePath, JSON.stringify(TRAILER_CACHE, null, 2));
  } catch (e) {
    console.warn('[WARN] trailer cache gagal disimpan:', e.message);
  }
}

function pickBestTrailer(videos = []) {
  const youtubeVideos = videos.filter((v) => String(v.site || '').toLowerCase() === 'youtube' && v.key);
  const score = (v) => {
    const type = String(v.type || '').toLowerCase();
    const name = String(v.name || '').toLowerCase();
    let value = 0;
    if (type === 'trailer') value += 100;
    if (type === 'teaser') value += 45;
    if (name.includes('official')) value += 30;
    if (name.includes('trailer')) value += 20;
    if (name.includes('teaser')) value += 8;
    if (String(v.official).toLowerCase() === 'true' || v.official === true) value += 15;
    return value;
  };
  return youtubeVideos.sort((a, b) => score(b) - score(a))[0] || null;
}

async function fetchTmdbVideos(tmdbId) {
  if (!tmdbId) return [];
  if (!TMDB_KEY && !TMDB_BEARER) return [];
  const url = TMDB_KEY
    ? `https://api.themoviedb.org/3/movie/${encodeURIComponent(tmdbId)}/videos?api_key=${encodeURIComponent(TMDB_KEY)}`
    : `https://api.themoviedb.org/3/movie/${encodeURIComponent(tmdbId)}/videos`;
  const headers = TMDB_BEARER ? { Authorization: `Bearer ${TMDB_BEARER}` } : {};
  const response = await fetch(url, { headers });
  if (!response.ok) throw new Error(`TMDB videos gagal: ${response.status}`);
  const data = await response.json();
  return Array.isArray(data.results) ? data.results : [];
}

async function resolveTrailerUrl({ tmdbId, title, year }) {
  const cacheKey = tmdbId ? `tmdb:${tmdbId}` : `title:${title || ''}:${year || ''}`;
  if (TRAILER_CACHE[cacheKey]) return TRAILER_CACHE[cacheKey];
  const videos = await fetchTmdbVideos(tmdbId);
  const trailer = pickBestTrailer(videos);
  if (!trailer) return null;
  const result = {
    trailer_url: `https://www.youtube.com/watch?v=${trailer.key}`,
    trailer_embed_url: `https://www.youtube.com/embed/${trailer.key}`,
    trailer_key: trailer.key,
    trailer_name: trailer.name || 'Official Trailer',
    source: 'tmdb-youtube'
  };
  TRAILER_CACHE[cacheKey] = result;
  saveTrailerCache();
  return result;
}

loadTrailerCache();


// =========================
// TMDB rating resolver (tmdbId -> vote_average/vote_count)
// =========================
const ratingCachePath = path.join(__dirname, 'data', 'tmdb-rating-cache.json');
let RATING_CACHE = {};

function loadRatingCache() {
  try {
    if (fs.existsSync(ratingCachePath)) {
      RATING_CACHE = JSON.parse(fs.readFileSync(ratingCachePath, 'utf8')) || {};
    }
  } catch (e) {
    console.warn('[WARN] rating cache gagal dibaca:', e.message);
    RATING_CACHE = {};
  }
}

function saveRatingCache() {
  try {
    fs.mkdirSync(path.dirname(ratingCachePath), { recursive: true });
    fs.writeFileSync(ratingCachePath, JSON.stringify(RATING_CACHE, null, 2));
  } catch (e) {
    console.warn('[WARN] rating cache gagal disimpan:', e.message);
  }
}

async function fetchTmdbDetail(tmdbId) {
  if (!tmdbId) return null;
  if (!TMDB_KEY && !TMDB_BEARER) return null;
  const url = TMDB_KEY
    ? `https://api.themoviedb.org/3/movie/${encodeURIComponent(tmdbId)}?api_key=${encodeURIComponent(TMDB_KEY)}&language=en-US`
    : `https://api.themoviedb.org/3/movie/${encodeURIComponent(tmdbId)}?language=en-US`;
  const headers = TMDB_BEARER ? { Authorization: `Bearer ${TMDB_BEARER}`, accept: 'application/json' } : {};
  const response = await fetch(url, { headers });
  if (!response.ok) throw new Error(`TMDB detail gagal: ${response.status}`);
  return response.json();
}

async function resolveTmdbRating(tmdbId) {
  const cacheKey = `tmdb:${tmdbId}`;
  if (RATING_CACHE[cacheKey]) return RATING_CACHE[cacheKey];
  const detail = await fetchTmdbDetail(tmdbId);
  if (!detail) return null;
  const voteAverage = Number(detail.vote_average || 0);
  const voteCount = Number(detail.vote_count || 0);
  const result = {
    rating: voteAverage > 0 ? Number(voteAverage.toFixed(1)) : null,
    vote_count: Number.isFinite(voteCount) ? voteCount : 0,
    rating_source: voteAverage > 0 ? 'TMDB' : 'unrated',
    rating_updated_at: new Date().toISOString().slice(0, 10),
    tmdb_vote_average: voteAverage > 0 ? Number(voteAverage.toFixed(1)) : null,
    tmdb_popularity: detail.popularity || 0,
    tmdb_status: detail.status || '',
    source: 'tmdb-detail'
  };
  RATING_CACHE[cacheKey] = result;
  saveRatingCache();
  return result;
}

loadRatingCache();

app.get('/api/rating/:tmdbId', async (req, res) => {
  try {
    const tmdbId = String(req.params.tmdbId || '').trim();
    if (!tmdbId) return res.status(400).json({ ok: false, message: 'tmdbId kosong.' });
    const resolved = await resolveTmdbRating(tmdbId);
    if (!resolved || !resolved.rating) {
      return res.status(404).json({ ok: false, message: 'Rating TMDB belum tersedia. Pastikan TMDB_API_KEY, TMDB_READ_TOKEN, atau TMDB_BEARER_TOKEN sudah diset.' });
    }
    return res.json({ ok: true, ...resolved });
  } catch (e) {
    console.error('[ERROR] rating:', e.message);
    return res.status(500).json({ ok: false, message: 'Gagal mengambil rating dari TMDB.' });
  }
});

app.get('/api/trailer/:tmdbId', async (req, res) => {
  try {
    const tmdbId = String(req.params.tmdbId || '').trim();
    const title = req.query.title || '';
    const year = req.query.year || '';
    const resolved = await resolveTrailerUrl({ tmdbId, title, year });
    if (!resolved) {
      return res.status(404).json({ ok: false, message: 'Trailer direct belum ditemukan. Pastikan TMDB_API_KEY, TMDB_READ_TOKEN, atau TMDB_BEARER_TOKEN sudah diset.' });
    }
    return res.json({ ok: true, ...resolved });
  } catch (e) {
    console.error('[ERROR] trailer:', e.message);
    return res.status(500).json({ ok: false, message: 'Gagal mengambil trailer direct dari TMDB.' });
  }
});

// =========================
// Film database
// =========================
let FILMS = [];
const csvPath = path.join(__dirname, 'df_processed.csv');
if (fs.existsSync(csvPath)) {
  fs.createReadStream(csvPath)
    .pipe(csv())
    .on('data', (row) => {
      if (row.title_asli || row.title || row.title_en) {
        FILMS.push({
          tmdbId: row.tmdbId || row.tmdb_id || row.tmdb || '',
          title: row.title_asli || row.title || row.title_en,
          title_en: row.title_en || '',
          year: row.year || '',
          genres: row.genres || '',
          cast: row.cast || '',
          poster: row.poster_url || row.poster || '',
          overview: row.overview || '',
          rating: Number(row.rating || row.vote_average || 0),
          vote_count: Number(row.vote_count || row.voteCount || 0),
          rating_source: row.rating_source || row.ratingSource || '',
          rating_updated_at: row.rating_updated_at || '',
          tmdb_vote_average: Number(row.tmdb_vote_average || row.vote_average || 0),
          mood: (row.mood || '').toLowerCase(),
          trailer_url: row.trailer_url || row.trailer || '',
          reason: row.reason || 'Film yang menenangkan hati'
        });
      }
    })
    .on('end', () => console.log(`[OK] ${FILMS.length} film loaded`))
    .on('error', (e) => console.error('[ERROR] CSV:', e.message));
} else {
  console.warn('[WARN] df_processed.csv tidak ditemukan');
}

// =========================
// RAG Meta: Quran/Hadith/Text retrieval
// =========================
let RAG_DOCS = [];
const ragJsonPath = path.join(__dirname, 'data', 'rag_meta.json');
try {
  if (fs.existsSync(ragJsonPath)) {
    RAG_DOCS = JSON.parse(fs.readFileSync(ragJsonPath, 'utf8')).map((d) => ({
      ref: d.ref || '',
      type: d.type || 'text',
      arab: d.arab || '',
      text: d.text || '',
      search: normalize(`${d.ref || ''} ${d.type || ''} ${d.text || ''}`)
    }));
    console.log(`[OK] ${RAG_DOCS.length} RAG documents loaded`);
  } else {
    console.warn('[WARN] data/rag_meta.json tidak ditemukan. AIMAN tetap jalan tanpa RAG.');
  }
} catch (e) {
  console.error('[ERROR] RAG load:', e.message);
}

const STOPWORDS = new Set([
  'aku','saya','gue','gw','lagi','banget','bgt','yang','dan','atau','di','ke','dari','ini','itu','untuk','buat','dengan','karena','kalo','kalau','kok','ya','dong','deh','aja','nih','sih','pun','adalah','jadi','dalam','pada','sebagai','mau','ingin','pengen','butuh'
]);

const RAG_ANCHORS = {
  gelisah: ["QS. Ar-Ra'd 13:28", 'QS. Al-Baqarah 2:38', 'QS. Az-Zumar 39:23'],
  sedih: ['QS. At-Taubah 9:40', 'QS. Yusuf 12:86', 'QS. Fussilat 41:30', 'QS. Al-Baqarah 2:153'],
  hidayah: ['QS. Az-Zumar 39:53', 'QS. Al-Baqarah 2:2', 'QS. Al-Fatihah 1:6'],
  marah: ["QS. Ali 'Imran 3:134", 'Bukhari 5649', 'Abu Dawud 4151'],
  bahagia: ['QS. Ibrahim 14:7', 'QS. Ad-Duha 93:11'],
  rindu: ['QS. Al-Baqarah 2:156', "QS. Ar-Ra'd 13:28"]
};

const MOOD_SEMANTIC_PROFILES = {
  sedih: 'sedih galau down nangis kecewa lelah kehilangan loneliness grief healing patience mercy hope acceptance sabar ikhlas keluarga',
  gelisah: 'gelisah cemas takut panik overthinking resah anxiety fear calm peace tawakal aman perlindungan zikir',
  hidayah: 'hidayah hijrah taubat iman spiritual journey redemption faith guidance prayer islam berubah memperbaiki diri',
  bahagia: 'bahagia senang syukur joy gratitude family friendship comedy warm uplifting nikmat berbagi',
  marah: 'marah kesal emosi anger rage conflict revenge justice forgiveness self control patience memaafkan',
  rindu: 'rindu kangen kehilangan jauh longing memory home romance family distance reunion love nostalgia doa',
  tenang: 'tenang damai aman refleksi calm peace family faith hope gratitude'
};

const FILM_GENRE_AFFINITY = {
  sedih: { drama: 1, family: 0.62, romance: 0.42, documentary: 0.34 },
  gelisah: { drama: 0.78, mystery: 0.5, thriller: 0.35, family: 0.28, documentary: 0.28 },
  hidayah: { drama: 0.88, documentary: 0.62, history: 0.52, family: 0.46, adventure: 0.3 },
  bahagia: { comedy: 0.95, family: 0.9, animation: 0.68, romance: 0.38, adventure: 0.34 },
  marah: { drama: 0.72, crime: 0.68, action: 0.42, thriller: 0.38, history: 0.25 },
  rindu: { romance: 0.84, family: 0.78, drama: 0.7, music: 0.28 },
  tenang: { drama: 0.5, family: 0.48, documentary: 0.38 }
};

const MOOD_PROFILES = {
  sedih: {
    keywords: ['sedih','galau','down','nangis','menangis','kecewa','hancur','capek','lelah','sendiri','sepi','patah','terpuruk','sakit hati'],
    rag: ['sabar','kesedihan','rahmat','jangan bersedih','pertolongan allah','tenang']
  },
  gelisah: {
    keywords: ['gelisah','cemas','takut','khawatir','overthinking','panik','stress','stres','resah','pikiran','tak tenang','tidak tenang'],
    rag: ['zikir','hati tenang','tawakal','takut','cemas','perlindungan']
  },
  hidayah: {
    keywords: ['hidayah','hijrah','taubat','tobat','dosa','berubah','dekat allah','shalat','ibadah','iman','bingung arah'],
    rag: ['ampunan','taubat','petunjuk','hidayah','rahmat','kembali']
  },
  bahagia: {
    keywords: ['bahagia','senang','happy','syukur','alhamdulillah','lega','bersyukur','nikmat','tenang'],
    rag: ['syukur','nikmat','alhamdulillah','karunia','kebaikan']
  },
  marah: {
    keywords: ['marah','kesal','emosi','benci','jengkel','dongkol','muak','tersinggung','sakit hati'],
    rag: ['menahan marah','sabar','memaafkan','lemah lembut','amarah']
  },
  rindu: {
    keywords: ['rindu','kangen','kehilangan','jauh','ditinggal','angen','kangen banget'],
    rag: ['doa','cinta','pertemuan','sabar','kehilangan']
  }
};

function normalize(s = '') {
  return String(s)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function escapeHtml(s = '') {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function tokensOf(text) {
  return normalize(text)
    .split(' ')
    .filter((w) => w.length > 2 && !STOPWORDS.has(w))
    .slice(0, 28);
}

function tokensFull(text) {
  return normalize(text)
    .split(' ')
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));
}

function cosineFromTokens(aTokens = [], bTokens = []) {
  const a = new Map();
  const b = new Map();
  aTokens.forEach((token) => a.set(token, (a.get(token) || 0) + 1));
  bTokens.forEach((token) => b.set(token, (b.get(token) || 0) + 1));
  let dot = 0;
  let normA = 0;
  let normB = 0;
  a.forEach((value, token) => {
    normA += value * value;
    dot += value * (b.get(token) || 0);
  });
  b.forEach((value) => {
    normB += value * value;
  });
  if (!normA || !normB) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

function bm25TermScore(docText = '', queryTokens = [], avgLength = 120) {
  const docTokens = tokensFull(docText);
  const lengthNorm = Math.max(0.35, docTokens.length / avgLength);
  const counts = new Map();
  docTokens.forEach((token) => counts.set(token, (counts.get(token) || 0) + 1));
  const k1 = 1.45;
  const b = 0.72;
  return queryTokens.reduce((score, token) => {
    const tf = counts.get(token) || 0;
    if (!tf) return score;
    return score + ((tf * (k1 + 1)) / (tf + k1 * (1 - b + b * lengthNorm)));
  }, 0);
}

function tryCppRecommendedFilms(mood, limit = 3) {
  if (process.env.IIM_DISABLE_CPP_RANKER === '1' || cppRankerUnavailable) return null;
  if (!fs.existsSync(CPP_RANKER_PATH)) {
    cppRankerUnavailable = true;
    return null;
  }
  try {
    const output = execFileSync(CPP_RANKER_PATH, ['--csv', csvPath, '--mood', mood, '--limit', String(limit)], {
      cwd: __dirname,
      encoding: 'utf8',
      timeout: 1200,
      windowsHide: true,
      maxBuffer: 1024 * 1024
    });
    const parsed = JSON.parse(output);
    return Array.isArray(parsed) && parsed.length ? parsed : null;
  } catch (e) {
    cppRankerUnavailable = true;
    console.warn('[WARN] C++ ranker fallback ke JS:', e.message);
    return null;
  }
}

function detectMood(message = '') {
  const n = normalize(message);
  let best = { mood: 'tenang', score: 0 };
  for (const [mood, profile] of Object.entries(MOOD_PROFILES)) {
    let score = 0;
    for (const kw of profile.keywords) {
      if (n.includes(normalize(kw))) score += kw.includes(' ') ? 3 : 1;
    }
    if (score > best.score) best = { mood, score };
  }
  return best.mood;
}

function moodIntensity(message = '') {
  const n = normalize(message);
  let score = 1;
  if (/banget|bgt|parah|hancur|tak kuat|ga kuat|gak kuat|cape banget|capek banget/.test(n)) score += 1;
  if (/nangis|panik|takut|sendiri|kosong|putus asa/.test(n)) score += 1;
  return Math.min(score, 3);
}

function isCrisis(message = '') {
  const n = normalize(message);
  return /(bunuh diri|mengakhiri hidup|akhiri hidup|pengen mati|ingin mati|mau mati|self harm|nyakitin diri|menyakiti diri|hidup ga ada arti|hidup gak ada arti)/.test(n);
}

function isDalilIntent(message = '') {
  const n = normalize(message);
  return /(dalil|ayat|quran|alquran|al quran|surat|surah|hadis|hadits|hadith|sabda|doa|dzikir|zikir|hukum islam|pandangan islam)/.test(n);
}

function isHadithIntent(message = '') {
  const n = normalize(message);
  return /(hadis|hadits|hadith|sabda|rasul|nabi)/.test(n);
}

function buildDalilReferenceBlock(ragDocs = []) {
  if (!ragDocs.length) return 'Belum ada dalil yang cocok dari basis data RAG.';
  return ragDocs.map((d, i) => {
    const label = d.type === 'hadith' ? 'Hadits' : d.type === 'quran' ? 'Ayat' : 'Referensi';
    return `${i + 1}. ${label}: ${d.ref || '-'}\nArab: ${d.arab || '-'}\nArti/teks: ${d.text || '-'}`;
  }).join('\n\n');
}

function retrieveRag(message = '', mood = 'tenang', limit = 5) {
  if (!RAG_DOCS.length) return [];
  const baseTokens = tokensOf(message);
  const moodTerms = MOOD_PROFILES[mood]?.rag || [];
  const expanded = [...new Set([...baseTokens, ...moodTerms.map(normalize).flatMap((x) => x.split(' ')).filter(Boolean)])]
    .filter((w) => w.length > 2 && !STOPWORDS.has(w))
    .slice(0, 34);

  const scored = [];
  for (const doc of RAG_DOCS) {
    let score = bm25TermScore(doc.search, expanded, 90);
    for (const t of expanded) {
      if (doc.search.includes(t)) score += 1;
    }
    if (mood === 'gelisah' && /(tenang|tenteram|tawakal|zikir|takut)/.test(doc.search)) score += 2;
    if (mood === 'sedih' && /(sedih|sabar|rahmat|pertolongan|jangan bersedih)/.test(doc.search)) score += 2;
    if (mood === 'hidayah' && /(taubat|ampunan|petunjuk|hidayah|kembali)/.test(doc.search)) score += 2;
    if (mood === 'marah' && /(marah|sabar|memaafkan|menahan)/.test(doc.search)) score += 2;
    const anchors = RAG_ANCHORS[mood] || [];
    const anchorIndex = anchors.indexOf(doc.ref);
    if (anchorIndex !== -1) score += 80 - anchorIndex;
    if (doc.type === 'quran') score += 2;
    if (isDalilIntent(message) && doc.type === 'quran') score += 3;
    if (isHadithIntent(message) && doc.type === 'hadith') score += 10;
    if (score > 0) scored.push({ doc, score });
  }

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ doc }) => ({
      ref: doc.ref,
      type: doc.type,
      arab: doc.arab,
      text: doc.text.length > 420 ? `${doc.text.slice(0, 420)}...` : doc.text
    }));
}

function recommendedFilms(mood) {
  const cppFilms = tryCppRecommendedFilms(mood, 3);
  if (cppFilms) return cppFilms;

  const related = {
    sedih: ['sedih', 'hidayah', 'rindu'],
    gelisah: ['gelisah', 'hidayah', 'sedih'],
    hidayah: ['hidayah', 'sedih', 'gelisah'],
    bahagia: ['bahagia', 'hidayah'],
    marah: ['marah', 'hidayah', 'gelisah'],
    rindu: ['rindu', 'sedih', 'hidayah'],
    tenang: ['hidayah', 'bahagia', 'sedih']
  }[mood] || ['hidayah'];
  const profileTokens = tokensFull(`${MOOD_SEMANTIC_PROFILES[mood] || MOOD_SEMANTIC_PROFILES.tenang} ${(MOOD_PROFILES[mood]?.rag || []).join(' ')}`);
  const genreAffinity = FILM_GENRE_AFFINITY[mood] || FILM_GENRE_AFFINITY.tenang;

  return FILMS
    .map((f) => {
      const fm = normalize(f.mood || '');
      const text = `${f.title} ${f.title_en || ''} ${f.genres || ''} ${f.overview || ''} ${f.cast || ''} ${f.reason || ''}`;
      const semantic = cosineFromTokens(tokensFull(text), profileTokens);
      const genres = String(f.genres || '').toLowerCase().split(/[|,]/).map((g) => g.trim()).filter(Boolean);
      const affinity = genres.length
        ? genres.reduce((score, genre) => score + (genreAffinity[genre] || 0), 0) / genres.length
        : 0;
      const moodScore = related.some((r) => fm.includes(r)) ? 3 : fm.includes(mood) ? 4 : 0;
      const rating = Math.min(Number(f.rating || f.tmdb_vote_average || 0), 10);
      const votes = Math.max(0, Number(f.vote_count || 0));
      const bayesian = ((votes / (votes + 120)) * rating) + ((120 / (votes + 120)) * 6.7);
      const ratingScore = bayesian / 10;
      const posterScore = f.poster ? 0.35 : -0.35;
      const overviewScore = f.overview ? Math.min(0.5, f.overview.length / 800) : -0.15;
      return { ...f, _score: moodScore + (semantic * 5) + (affinity * 2.2) + ratingScore + posterScore + overviewScore };
    })
    .filter((f) => f._score > 0)
    .sort((a, b) => b._score - a._score)
    .slice(0, 3)
    .map(({ _score, ...f }) => f);
}

function buildFallbackReply(message, mood, ragDocs, films) {
  const opener = {
    sedih: 'Aku dengerin, ya. Sedih itu nggak harus buru-buru hilang. Kadang hati cuma butuh ditemani dulu sebelum bisa kuat lagi.',
    gelisah: 'Aku paham. Kalau pikiran lagi rame, semuanya bisa terasa numpuk. Kita pelanin dulu, satu napas demi satu napas.',
    hidayah: 'MasyaAllah, keinginan buat berubah itu sudah langkah yang berharga. Nggak harus langsung sempurna, yang penting mulai pelan-pelan.',
    bahagia: 'Alhamdulillah, ikut senang dengernya. Rasa bahagia juga bisa jadi pintu syukur kalau kita sadar dari mana nikmat itu datang.',
    marah: 'Wajar kalau emosi naik. Tapi sebelum bereaksi, kita kasih jeda dulu supaya keputusanmu nggak dikendalikan amarah.',
    rindu: 'Rindu memang bisa terasa hangat sekaligus nyesek. Kadang ia datang karena ada hal yang pernah sangat berarti buat kita.',
    tenang: 'Aku di sini. Cerita aja pelan-pelan, nggak perlu dirapikan dulu.'
  }[mood] || 'Aku di sini. Cerita aja pelan-pelan.';

  const dalil = ragDocs[0]
    ? `\n\nYang bisa jadi penguat: ${ragDocs[0].ref} — ${ragDocs[0].text}`
    : '';

  const step = {
    gelisah: 'Untuk sekarang, coba tarik napas pelan, sebut satu hal yang paling mengganggu pikiranmu, lalu pisahkan mana yang bisa kamu lakukan hari ini dan mana yang perlu kamu serahkan dulu.',
    marah: 'Untuk sekarang, jangan balas apa pun dulu. Ambil jeda sebentar, minum air, lalu tanya ke diri sendiri: respons apa yang tetap bikin aku tenang setelah ini?',
    sedih: 'Untuk sekarang, cukup lakukan satu hal kecil yang membuat tubuhmu sedikit lebih aman: minum, duduk, atau hubungi satu orang yang kamu percaya.',
    hidayah: 'Untuk sekarang, pilih satu langkah kecil yang realistis: shalat tepat waktu, baca satu ayat, atau minta maaf pada satu hal yang selama ini tertunda.',
    bahagia: 'Untuk sekarang, coba ucapkan syukur dengan sadar, lalu bagikan sedikit kebaikan dari rasa lapang itu.',
    rindu: 'Untuk sekarang, jadikan rindu sebagai doa. Sebut nama yang kamu rindukan, lalu titipkan rasa itu kepada Allah.'
  }[mood] || 'Untuk sekarang, mulai dari satu langkah kecil yang bisa kamu lakukan tanpa memaksa diri.';

  const filmLine = films[0]
    ? `\n\nKalau kamu mau lanjut lewat tontonan, aku kepikiran ${films[0].title}. Film itu bisa jadi teman refleksi untuk mood kamu sekarang.`
    : '';

  return `${opener}${dalil}\n\n${step}${filmLine}`;
}

async function askGroq({ message, mood, intensity, ragDocs, films, history = [], mode = 'chat' }) {
  if (!GROQ_KEY) return null;

  const safeHistory = Array.isArray(history)
    ? history.slice(-8).map((h) => ({
        role: h.role === 'assistant' ? 'assistant' : 'user',
        content: String(h.content || '').slice(0, 600)
      }))
    : [];

  const ragContext = ragDocs.length
    ? ragDocs.map((d, i) => `${i + 1}. ${d.ref} [${d.type}]\nArab: ${d.arab || '-'}\nMakna/teks: ${d.text}`).join('\n\n')
    : 'Tidak ada konteks RAG yang relevan.';

  const filmContext = films.length
    ? films.map((f, i) => `${i + 1}. ${f.title} (${f.year || '-'}) mood=${f.mood || '-'} alasan=${f.reason || '-'}`).join('\n')
    : 'Belum ada film yang cocok.';

  const dalilIntent = isDalilIntent(message);
  const hadithIntent = isHadithIntent(message);
  const dalilReferenceBlock = buildDalilReferenceBlock(ragDocs);

  const isVoiceMode = mode === 'voice';
  const voiceRules = isVoiceMode ? `

MODE VOICE CALL:
- Jawab pendek, tapi harus selesai utuh: 2 sampai 4 kalimat lengkap.
- Jangan berhenti di tengah kata atau tengah kalimat. Tutup respons dengan tanda titik atau tanda tanya.
- Untuk curhat: validasi singkat, beri satu langkah kecil, lalu tanya balik.
- Lebih objektif, langsung ke inti, lalu akhiri dengan 1 pertanyaan balik yang natural.
- Jangan menampilkan teks Arab panjang. Kalau user minta dalil/hadits, cukup sebut rujukannya, bacakan arti/maknanya dalam bahasa Indonesia, lalu beri penjelasan singkat.
- Jangan membuat struktur panjang dengan banyak heading.
- Hindari ceramah panjang, pembuka berlebihan, dan pengulangan. Prioritaskan percakapan dua arah.
- Jangan pakai emoji.
` : '';

  const system = `Kamu adalah AIMAN, teman ngobrol Islami dari web app IMAN IN MOTION.
Gaya bicara: bahasa Indonesia santai, hangat, responsif, seperti teman refleksi yang memahami dakwah. Boleh pakai "aku" dan "kamu". Jangan terdengar seperti template atau mesin.

Tugas utama:
1) Validasi perasaan user dulu, jangan langsung menggurui.
2) Jawab natural, rapi, dan mudah dipahami.
3) Gunakan konteks RAG hanya jika relevan. Jangan mengarang nomor ayat, hadits, atau lafaz Arab. Kalau menyebut dalil, ambil dari konteks RAG.
4) Beri pemahaman dakwah: jelaskan bagaimana ayat/hadits itu mengajak pada kebaikan, perubahan sikap, akhlak, kesabaran, syukur, tawakal, atau pengendalian diri.
5) Kalau cocok, rekomendasikan 1 film dari konteks film sebagai ruang refleksi, bukan sebagai dalil.
6) Jangan memberi fatwa berat. Untuk hukum detail, sarankan bertanya ke ustadz/ahli.
7) Kalau user menunjukkan niat menyakiti diri, utamakan keselamatan dan minta user menghubungi orang terdekat/layanan darurat.

ATURAN KHUSUS KETIKA USER MEMINTA DALIL/AYAT/HADITS/DOA/DZIKIR/PANDANGAN ISLAM:
- Wajib tampilkan jawaban dengan struktur berikut:
  **Dalil yang nyambung**
  **Ayat Arab / Hadits Arab**
  **Arti**
  **Penjelasan singkat**
  **Pemahaman dakwah**
  **Langkah kecil**
- Pada bagian "Penjelasan singkat" dan "Pemahaman dakwah", perluas makna dalil: jelaskan konteks hati user, nilai iman yang diajarkan, sikap yang perlu dibangun, dan contoh penerapannya dalam kehidupan sehari-hari.
- Jika user meminta hadits, utamakan hadits bila tersedia. Jika user meminta ayat, utamakan ayat. Bila keduanya relevan, ayat boleh menjadi penguat utama dan hadits sebagai pelengkap.
- Kalau konteks berisi ayat Arab, tampilkan lafaz Arabnya.
- Kalau konteks berisi hadits, boleh jadikan penguat setelah ayat.
- Kalau tidak ada hadits yang tepat, jangan mengarang. Cukup bilang bahwa penguat utama yang tersedia adalah ayat tersebut.
- Penjelasan jangan terlalu kaku: hubungkan dalil dengan kondisi hati user.${voiceRules}

Mood terdeteksi: ${mood}. Intensitas: ${intensity}/3.
User sedang minta dalil/teks Islam: ${dalilIntent ? 'ya' : 'tidak'}. User sedang minta hadits: ${hadithIntent ? 'ya' : 'tidak'}.

Konteks dalil RAG yang boleh digunakan:
${dalilReferenceBlock}

Konteks film:
${filmContext}

Akhiri respons dengan tag metadata persis: [MOOD:${mood}] [FILM:${films[0]?.title || ''}]`;

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${GROQ_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: process.env.GROQ_MODEL || 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: system },
        ...safeHistory,
        { role: 'user', content: message }
      ],
      temperature: 0.82,
      top_p: 0.9,
      max_tokens: mode === 'voice' ? 240 : 650
    })
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Groq ${response.status}: ${text.slice(0, 120)}`);
  }
  const data = await response.json();
  return data.choices?.[0]?.message?.content || null;
}


function buildFullDalilReply(ragDocs, mood, films) {
  const main = ragDocs[0];
  const hadith = ragDocs.find((d) => d.type === 'hadith');
  const hadithLine = hadith && hadith.ref !== main.ref
    ? `\n\n**Penguat hadits**\n${hadith.ref}\n${hadith.arab || ''}\n${hadith.text || ''}`
    : '';
  return `**Dalil yang nyambung**\n${main.ref}\n\n**Ayat Arab / Hadits Arab**\n${main.arab || '-'}\n\n**Arti**\n${main.text || '-'}\n\n**Penjelasan singkat**\nDalil ini mengarahkan hati untuk melihat keadaan yang kamu ceritakan dengan lebih tenang. Islam tidak hanya memberi nasihat, tapi juga mengajak kita mengelola rasa dengan iman, sabar, syukur, tawakal, dan akhlak yang baik.\n\n**Pemahaman dakwah**\nDalam dakwah, dalil seperti ini menjadi pengingat yang lembut: hati tidak perlu dipaksa langsung kuat, tetapi dituntun pelan-pelan agar kembali dekat kepada Allah dan tindakan kita tetap terarah.\n\n**Langkah kecil**\nAmbil satu langkah yang ringan dulu: tenangkan napas, baca ulang maknanya, lalu pilih satu amal kecil yang bisa kamu lakukan hari ini.${hadithLine} [MOOD:${mood}] [FILM:${films[0]?.title || ''}]`;
}

// =========================
// Routes
// =========================
function sendFrontend(req, res) {
  const reactIndex = path.join(distPath, 'index.html');
  if (fs.existsSync(reactIndex)) return res.sendFile(reactIndex);
  return res.sendFile(path.join(publicPath, 'index.html'));
}

app.get('/', sendFrontend);
app.get('/aiman', sendFrontend);
app.get('/aiman.html', (req, res) => res.redirect('/aiman'));
app.get('/api/movies', (req, res) => res.json(FILMS));
app.get('/api/ml/diagnostics', (req, res) => {
  const mood = detectMood(String(req.query.q || ''));
  res.json({
    ok: true,
    engine: 'hybrid-semantic-bm25-bayesian-v3',
    native: {
      cppRankerConfigured: fs.existsSync(CPP_RANKER_PATH),
      cppRankerPath: CPP_RANKER_PATH,
      cppRankerActive: fs.existsSync(CPP_RANKER_PATH) && process.env.IIM_DISABLE_CPP_RANKER !== '1' && !cppRankerUnavailable
    },
    features: ['optional-cpp-ranker', 'mood-intent-detection', 'semantic-film-ranking', 'bm25-rag-retrieval', 'bayesian-quality-score', 'genre-affinity'],
    films: FILMS.length,
    rag: RAG_DOCS.length,
    detectedMood: mood,
    sampleFilms: recommendedFilms(mood).map((film) => ({ title: film.title, mood: film.mood, rating: film.rating }))
  });
});
app.get('/api/rag/search', (req, res) => {
  const q = String(req.query.q || '');
  const mood = detectMood(q);
  res.json({ mood, results: retrieveRag(q, mood, 8) });
});
app.get('/health', (req, res) => res.json({ status: 'ok', films: FILMS.length, rag: RAG_DOCS.length, groq: !!GROQ_KEY }));

// AIMAN chat v2
app.post('/api/chat', async (req, res) => {
  const { message, history, mode } = req.body || {};
  const cleanMessage = String(message || '').trim().slice(0, 2000);
  if (!cleanMessage) return res.status(400).json({ reply: 'Pesan kosong', mood: 'tenang', films: [] });

  const mood = detectMood(cleanMessage);
  const intensity = moodIntensity(cleanMessage);
  const ragDocs = retrieveRag(cleanMessage, mood, 5);
  const films = recommendedFilms(mood);

  if (isCrisis(cleanMessage)) {
    return res.json({
      mood,
      intensity,
      rag: ragDocs,
      films,
      reply: `Aku serius dengerin kamu, dan aku nggak mau kamu sendirian di titik ini. Tolong hubungi orang terdekat sekarang, misalnya keluarga, teman, guru, atau ustadz yang bisa datang/telepon kamu. Kalau ada risiko kamu menyakiti diri, segera hubungi layanan darurat setempat atau pergi ke IGD terdekat.\n\nSambil nunggu bantuan, jauhkan dulu benda yang bisa membahayakan, duduk di tempat yang ramai/terang, dan kirim satu pesan singkat ke orang terdekat: “Aku lagi nggak aman sendirian, tolong temani aku sekarang.” Aku tetap di sini nemenin kamu ngobrol pelan-pelan. [MOOD:${mood}] [FILM:]`
    });
  }

  let reply = '';
  try {
    reply = await askGroq({ message: cleanMessage, mood, intensity, ragDocs, films, history, mode });
  } catch (e) {
    console.error('[WARN] Groq fallback:', e.message);
  }

  if (mode === 'voice' && isDalilIntent(cleanMessage) && ragDocs.length) {
    // Voice mode tetap menyimpan jawaban lengkap ke chat.
    // Komponen call akan membuat versi singkat khusus untuk dibacakan.
    reply = buildFullDalilReply(ragDocs, mood, films);
  }

  if (!reply) {
    if (isDalilIntent(cleanMessage) && ragDocs.length) {
      const main = ragDocs[0];
      const hadith = ragDocs.find((d) => d.type === 'hadith');
      const hadithLine = hadith && hadith.ref !== main.ref
        ? `\n\n**Penguat hadits**\n${hadith.ref}\n${hadith.arab || ''}\n${hadith.text || ''}`
        : '';
      if (mode === 'voice') {
        reply = `Rujukannya ${main.ref}. Artinya: ${main.text || '-'}. Intinya, Islam menuntun rasa ini supaya diarahkan dengan sabar, tawakal, dan langkah kecil yang baik. Mau aku bantu hubungkan dalil ini dengan keadaan kamu sekarang? [MOOD:${mood}] [FILM:${films[0]?.title || ''}]`;
      } else {
        reply = `**Dalil yang nyambung**\n${main.ref}\n\n**Ayat Arab / Hadits Arab**\n${main.arab || '-'}\n\n**Arti**\n${main.text || '-'}\n\n**Penjelasan singkat**\nDalil ini mengarahkan hati untuk melihat keadaan yang kamu ceritakan dengan lebih tenang. Islam tidak hanya memberi nasihat, tapi juga mengajak kita mengelola rasa dengan iman, sabar, syukur, tawakal, dan akhlak yang baik.\n\n**Pemahaman dakwah**\nDalam dakwah, dalil seperti ini bisa menjadi jembatan: bukan memaksa orang langsung kuat, tapi menuntun pelan-pelan agar hati kembali dekat kepada Allah dan tindakan kita tetap terarah.\n\n**Langkah kecil**\nAmbil satu langkah yang ringan dulu: tenangkan napas, baca ulang maknanya, lalu pilih satu amal kecil yang bisa kamu lakukan hari ini.${hadithLine} [MOOD:${mood}] [FILM:${films[0]?.title || ''}]`;
      }
    } else {
      if (mode === 'voice') {
        const opener = {
          sedih: 'Aku paham, kamu lagi berat.',
          gelisah: 'Oke, kita pelanin dulu.',
          hidayah: 'Keinginan berubah itu awal yang baik.',
          bahagia: 'Alhamdulillah, itu rasa yang patut disyukuri.',
          marah: 'Kita ambil jeda dulu sebelum bereaksi.',
          rindu: 'Rindu itu wajar, apalagi kalau ada yang sangat berarti.'
        }[mood] || 'Aku dengerin.';
        reply = `${opener} Intinya, mulai dari satu langkah kecil yang bisa kamu lakukan sekarang. Kamu mau aku bantu arahkan ke dalil, film, atau langkah praktis dulu? [MOOD:${mood}] [FILM:${films[0]?.title || ''}]`;
      } else {
        reply = `${buildFallbackReply(cleanMessage, mood, ragDocs, films)} [MOOD:${mood}] [FILM:${films[0]?.title || ''}]`;
      }
    }
  }

  res.json({
    reply,
    mood,
    intensity,
    rag: ragDocs,
    films
  });
});

// React SPA fallback. API routes above stay untouched.
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/') || req.path === '/health') return next();
  return sendFrontend(req, res);
});

app.listen(PORT, () => {
  console.log(`Server jalan di port ${PORT}`);
  console.log(`[OK] Groq ready: ${!!GROQ_KEY}`);
});
