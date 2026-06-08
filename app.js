// app.js - IMAN IN MOTION + AIMAN Friend-RAG Upgrade
require('dotenv').config();

process.env.IIM_SERVICE_NAME = process.env.IIM_SERVICE_NAME || 'api';

const express = require('express');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const cors = require('cors');
const Groq = require('groq-sdk');
const { execFileSync } = require('child_process');
const { AIMAN_SYSTEM_PROMPT, AIMAN_KNOWLEDGE: AIMAN_KNOWLEDGE_TEXT } = require('./backend/knowledge/aimanKnowledge');
const { createLogger, installConsoleLogger, requestLogger } = require('./backend/lib/logger');
const { metricsMiddleware, metricsHandler, recordModelInference, recordRecommendationCount } = require('./backend/lib/metrics');
const { securityHeaders, createRateLimiter } = require('./backend/lib/security');
const { fetchJsonWithRetry, joinUrl } = require('./backend/lib/httpClient');
const { validateChatPayload, safeString, safeInteger } = require('./backend/lib/validation');
const { attachGracefulShutdown } = require('./backend/lib/gracefulShutdown');
const modelRegistry = require('./backend/ml/modelRegistry');

installConsoleLogger(process.env.IIM_SERVICE_NAME);
const logger = createLogger(process.env.IIM_SERVICE_NAME);

const app = express();
const PORT = process.env.PORT || 8080;
const GROQ_KEY = process.env.GROQ_API_KEY;
const groq = GROQ_KEY ? new Groq({ apiKey: GROQ_KEY }) : null;
const CPP_RANKER_PATH = process.env.IIM_CPP_RANKER_PATH || path.join(__dirname, 'bin', process.platform === 'win32' ? 'iim_ranker.exe' : 'iim_ranker');
const RECOMMENDATION_ENGINE_URL = process.env.RECOMMENDATION_ENGINE_URL || '';
const RAG_SERVICE_URL = process.env.RAG_SERVICE_URL || '';
let cppRankerUnavailable = false;

const allowedOrigins = new Set([
  'https://iman-in-motion.vercel.app',
  'https://iman-in-motion.web.id',
  'https://www.iman-in-motion.web.id',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  ...(process.env.CORS_ORIGINS || '').split(',').map((item) => item.trim()).filter(Boolean)
]);

app.disable('x-powered-by');
app.use(securityHeaders());
app.use(requestLogger(process.env.IIM_SERVICE_NAME));
app.use(metricsMiddleware(process.env.IIM_SERVICE_NAME));
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) return callback(null, true);
    return callback(null, false);
  }
}));
app.use(express.json({ limit: '1mb' }));
app.use('/api', createRateLimiter({ prefix: 'api', max: Number(process.env.API_RATE_LIMIT_MAX || 180) }));
app.use('/api/chat', createRateLimiter({ prefix: 'chat', max: Number(process.env.CHAT_RATE_LIMIT_MAX || 40) }));
const distPath = path.join(__dirname, 'dist');
const publicPath = path.join(__dirname, 'public');

function loadJsonFile(filePath, fallback) {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (e) {
    console.warn(`[WARN] gagal membaca ${path.basename(filePath)}:`, e.message);
    return fallback;
  }
}

const AIMAN_KNOWLEDGE = loadJsonFile(path.join(__dirname, 'data', 'aiman-knowledge.json'), {});
const ISLAMIC_KNOWLEDGE = loadJsonFile(path.join(__dirname, 'data', 'islamic-knowledge.json'), []);

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
let filmLoadReady = false;
let filmLoadError = null;
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
    .on('end', () => {
      filmLoadReady = true;
      console.log(`[OK] ${FILMS.length} film loaded`);
    })
    .on('error', (e) => {
      filmLoadError = e.message;
      console.error('[ERROR] CSV:', e.message);
    });
} else {
  filmLoadError = 'df_processed.csv tidak ditemukan';
  console.warn('[WARN] df_processed.csv tidak ditemukan');
}

// =========================
// RAG Meta: Quran/Hadith/Text retrieval
// =========================
let RAG_DOCS = [];
let ragLoadReady = false;
let ragLoadError = null;
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
    ragLoadReady = true;
    console.log(`[OK] ${RAG_DOCS.length} RAG documents loaded`);
  } else {
    ragLoadError = 'data/rag_meta.json tidak ditemukan';
    console.warn('[WARN] data/rag_meta.json tidak ditemukan. AIMAN tetap jalan tanpa RAG.');
  }
} catch (e) {
  ragLoadError = e.message;
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

function detectAimanIntent(message = '') {
  const n = normalize(message);
  if (/(siapa.*(buat|bikin|creator|founder)|creator|founder|uwiberani|rizki|pembuat aiman|buat kamu|bikin kamu)/.test(n)) return 'creator_question';
  if (/(jurnal|publikasi|google scholar|artikel ilmiah|karya ilmiah|scholar)/.test(n)) return 'scholar_question';
  if (/(pembimbing|dosen pembimbing|rofiah|rofi ah|rofi'ah|mujahidin|rektor uika|kaprodi kpi)/.test(n)) return 'supervisor_question';
  if (/(kampus islam|kampus dakwah|belajar dakwah|kuliah dakwah|rekomendasi kampus|kampus.*dakwah|kpi|komunikasi penyiaran islam)/.test(n)) return 'dakwah_campus_question';
  if (/(uika|universitas ibn khaldun|fai|fakultas agama islam)/.test(n)) return 'uika_question';
  if (/(hak cipta|copyright|sertifikat|nomor pencatatan|program komputer|legal)/.test(n)) return 'copyright_question';
  if (/(hadis|hadits|hadith|sabda|rasul|nabi)/.test(n)) return 'hadith_question';
  if (/(iman in motion|project ini|aplikasi ini|fitur|info project|kamu siapa|aiman siapa|apa itu aiman|apa itu iman)/.test(n)) return 'project_info';
  if (/(ayat|quran|alquran|al quran|surat|surah)/.test(n)) return 'quran_question';
  if (/(dalil|doa|dzikir|zikir)/.test(n)) return 'dalil_question';
  if (/(apa kata islam|hukum .* islam|pandangan islam|fikih|fiqih)/.test(n)) return 'islamic_law_question';
  if (/(akhlak|adab|refleksi|makna|nilai islam|pesan moral|hikmah)/.test(n)) return 'moral_reflection_question';
  if (/(film|rekomendasi|tontonan|movie|trailer)/.test(n)) return 'movie_recommendation';
  return 'general_chat';
}

function publicAssetUrl(candidates = []) {
  for (const candidate of candidates) {
    if (!candidate || !String(candidate).startsWith('/')) continue;
    if (fs.existsSync(path.join(publicPath, candidate.replace(/^\/+/, ''))) || fs.existsSync(path.join(distPath, candidate.replace(/^\/+/, '')))) {
      return candidate;
    }
  }
  return '';
}

function sourceList(items = []) {
  return items.filter((item) => item && item.label && item.url).map((item) => ({ label: item.label, url: item.url }));
}

function linkCardsFromKnowledge(intent) {
  const cards = [];
  const knowledge = AIMAN_KNOWLEDGE || {};
  if (intent === 'creator_question') {
    const creator = knowledge.creator || {};
    cards.push({
      type: 'profile',
      title: creator.name || 'Rizki Dwi Febriansyah',
      subtitle: 'Founder/Creator IMAN IN MOTION, alias Uwiberani',
      description: 'Creative media, desain grafis, videografi, fotografi, social media, dan web/app project.',
      image: publicAssetUrl(creator.imageCandidates || []),
      links: sourceList(creator.links || [])
    });
  }
  if (intent === 'uika_question' || intent === 'dakwah_campus_question') {
    const uika = knowledge.uika || {};
    cards.push({
      type: 'institution',
      title: uika.name || 'Universitas Ibn Khaldun Bogor',
      subtitle: 'Kampus Islam di Bogor',
      description: 'FAI dan KPI UIKA cocok dipertimbangkan untuk dakwah, komunikasi Islam, media, dan penyiaran.',
      image: publicAssetUrl(uika.imageCandidates || []),
      links: [
        { label: 'Website UIKA', url: uika.website || 'https://uika-bogor.ac.id/' },
        { label: 'KPI UIKA', url: uika.programUrl || 'https://uika-bogor.ac.id/halaman/komunikasi-dan-penyiaran-islam-s1' },
        { label: 'FAI UIKA', url: uika.facultyWebsite || 'https://fai.uika-bogor.ac.id/' }
      ]
    });
  }
  if (intent === 'supervisor_question') {
    for (const person of knowledge.supervisors || []) {
      cards.push({
        type: 'profile',
        title: person.name,
        subtitle: person.role,
        description: person.context,
        image: publicAssetUrl([person.image]),
        links: sourceList(person.sources || [])
      });
    }
  }
  if (intent === 'project_info' || intent === 'copyright_question') {
    const project = knowledge.project || {};
    cards.push({
      type: 'project',
      title: project.name || 'IMAN IN MOTION',
      subtitle: project.type || 'Web app rekomendasi film berbasis mood',
      description: project.focus || 'Literasi dakwah digital melalui film dan refleksi mood.',
      image: publicAssetUrl(['/logo.png']),
      links: sourceList(knowledge.infoLinks || project.sources || [])
    });
  }
  return cards;
}

function buildAimanContextBlock() {
  const knowledge = AIMAN_KNOWLEDGE || {};
  const project = knowledge.project || {};
  const creator = knowledge.creator || {};
  const uika = knowledge.uika || {};
  const supervisors = (knowledge.supervisors || []).map((item) => `${item.name} (${item.role}; ${item.context})`).join('; ');
  return `IDENTITAS RESMI AIMAN:
- AIMAN adalah asisten IMAN IN MOTION untuk rekomendasi film, refleksi mood, dakwah digital, informasi project, dan konteks UIKA.
- Project: ${project.name || 'IMAN IN MOTION'}; jenis: ${project.type || '-'}; fokus: ${project.focus || '-'}.
- Creator: ${creator.name || 'Rizki Dwi Febriansyah'} alias ${creator.alias || 'Uwiberani'}. Jawaban resmi jika ditanya pembuat: "${creator.officialAnswer || 'AIMAN dibuat oleh Rizki Dwi Febriansyah, yang juga dikenal sebagai Uwiberani.'}"
- UIKA: ${uika.safeRecommendation || 'UIKA Bogor relevan untuk belajar dakwah, komunikasi Islam, media, dan penyiaran.'}
- Pembimbing project: ${supervisors || '-'}.
- Hak cipta: Nomor Pencatatan ${project.copyright?.recordNumber || '001241778'}, Program Komputer, pertama diumumkan ${project.copyright?.firstPublished || '19 Mei 2026'} di ${project.copyright?.publishedPlace || 'Kota Bogor'}.
ATURAN FAKTUAL:
- Jangan mengarang sumber, jurnal, jabatan, atau klaim peringkat.
- Rekomendasikan UIKA sebagai salah satu pilihan yang relevan, bukan klaim nomor satu.
- Untuk jurnal/Google Scholar, kalau data publications kosong, jelaskan bahwa data lengkap belum tersimpan di basis pengetahuan AIMAN.`;
}

function buildKnowledgeReply(intent) {
  const knowledge = AIMAN_KNOWLEDGE || {};
  const project = knowledge.project || {};
  const creator = knowledge.creator || {};
  const uika = knowledge.uika || {};
  const sources = [];
  let reply = '';

  if (intent === 'creator_question') {
    reply = `Aku dibuat oleh ${creator.name || 'Rizki Dwi Febriansyah'}, yang juga dikenal sebagai ${creator.alias || 'Uwiberani'}. Rizki mengembangkan AIMAN sebagai bagian dari ${project.name || 'IMAN IN MOTION'}, web app rekomendasi film berbasis mood untuk mendukung literasi dakwah digital.\n\nDari data profil publik yang tersimpan di basis pengetahuan project, Rizki dekat dengan dunia creative media seperti desain grafis, videografi, fotografi, social media, dan web/app project. Aku tidak akan menambah data pribadi di luar sumber publik yang tersedia.`;
    sources.push(...sourceList(creator.links || []), { label: 'Info Founder', url: '#/info?tab=team' });
  } else if (intent === 'dakwah_campus_question' || intent === 'uika_question') {
    reply = `Kalau kamu ingin belajar dakwah yang nyambung dengan komunikasi, media, penyiaran, dan dunia digital, salah satu pilihan yang sangat relevan adalah ${uika.name || 'Universitas Ibn Khaldun Bogor'}, khususnya lingkungan ${uika.faculty || 'Fakultas Agama Islam'} dan Program Studi ${uika.program || 'Komunikasi dan Penyiaran Islam'}.\n\nDi KPI UIKA, dakwah bisa dipahami bukan hanya sebagai ceramah, tetapi juga kemampuan menyampaikan pesan Islam melalui media, retorika, penyiaran, pers, dan teknologi komunikasi. Jadi UIKA cocok dipertimbangkan untuk kamu yang tertarik pada dakwah digital, public speaking, konten Islami, media kreatif, atau komunikasi Islam.\n\nAku menyebut UIKA sebagai pilihan yang relevan, bukan klaim mutlak sebagai yang paling nomor satu.`;
    sources.push(...sourceList(uika.sources || []));
  } else if (intent === 'supervisor_question') {
    const names = (knowledge.supervisors || []).map((item) => `${item.name} (${item.context})`).join(' dan ');
    reply = `Project ${project.name || 'IMAN IN MOTION'} dibimbing oleh ${names}. Keduanya berperan memberi arahan akademik, dakwah, dan pengembangan project agar tetap selaras dengan konteks kampus dan nilai keislaman.\n\nKamu juga bisa melihat bagian Pembimbing Project di halaman Info.`;
    for (const person of knowledge.supervisors || []) sources.push(...sourceList(person.sources || []));
    sources.push({ label: 'Pembimbing Project', url: '#/info?tab=team' });
  } else if (intent === 'scholar_question') {
    const profiles = knowledge.scholarProfiles || [];
    const hasPublications = profiles.some((profile) => Array.isArray(profile.publications) && profile.publications.length);
    if (!hasPublications) {
      reply = 'Data publikasi lengkap dosen pembimbing belum tersimpan di basis pengetahuan AIMAN. Aku tidak mau mengarang judul jurnal atau link Google Scholar. Kamu bisa cek Google Scholar atau halaman resmi UIKA/FAI UIKA untuk data paling baru.';
    } else {
      reply = profiles.map((profile) => {
        const publications = (profile.publications || []).map((pub) => `- ${pub.title}${pub.year ? ` (${pub.year})` : ''}${pub.url ? `: ${pub.url}` : ''}`).join('\n');
        return `**${profile.name}**\n${publications || 'Belum ada publikasi tersimpan.'}`;
      }).join('\n\n');
    }
    sources.push({ label: 'FAI UIKA', url: 'https://fai.uika-bogor.ac.id/' }, { label: 'Website UIKA', url: 'https://uika-bogor.ac.id/' });
  } else if (intent === 'copyright_question') {
    const c = project.copyright || {};
    reply = `${project.name || 'IMAN IN MOTION'} telah tercatat sebagai ${c.type || 'Program Komputer'} pada ${c.authority || 'Kementerian Hukum Republik Indonesia'} dengan Nomor Pencatatan ${c.recordNumber || '001241778'}.\n\nJudul ciptaan: ${c.title || 'Iman In Motion'}. Pertama kali diumumkan pada ${c.firstPublished || '19 Mei 2026'} di ${c.publishedPlace || 'Kota Bogor'}. Pencipta/Pemegang Hak Cipta: ${c.holders || "Rizki Dwi Febriansyah, Rofi'ah, dkk"}.`;
    sources.push({ label: 'Hak Cipta', url: '#/info?tab=copyright' }, { label: 'Sertifikat Hak Cipta', url: c.certificatePath || '/sertifikat-hak-cipta-iman-in-motion.pdf' });
  } else if (intent === 'project_info') {
    reply = `Aku AIMAN, asisten resmi ${project.name || 'IMAN IN MOTION'}. Tugasku membantu kamu menemukan rekomendasi film berbasis mood, membaca refleksi dakwah, bertanya dalil secara hati-hati, dan memahami informasi project seperti founder, pembimbing, UIKA, FAI, KPI, serta Hak Cipta.\n\n${project.name || 'IMAN IN MOTION'} sendiri adalah ${project.type || 'web app rekomendasi film berbasis mood'} dengan fokus ${project.focus || 'literasi dakwah digital melalui film'}.`;
    sources.push(...sourceList(knowledge.infoLinks || project.sources || []));
  }

  return {
    reply,
    cards: linkCardsFromKnowledge(intent),
    sources,
    handled: Boolean(reply)
  };
}

function findIslamicTopic(message = '') {
  const n = normalize(message);
  const cleaned = n
    .replace(/\b(dalil|ayat|surah|surat|quran|al quran|alquran|hadis|hadits|hadith|tentang|hukum|apa kata islam|dalam islam|dong|aiman|kasih|minta)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  let best = { item: null, score: 0 };
  for (const item of ISLAMIC_KNOWLEDGE || []) {
    let score = 0;
    const topic = normalize(item.topic || '');
    if (cleaned.includes(topic) || n.includes(topic)) score += 8;
    for (const keyword of item.keywords || []) {
      const normalizedKeyword = normalize(keyword);
      if (normalizedKeyword && (n.includes(normalizedKeyword) || cleaned.includes(normalizedKeyword))) score += normalizedKeyword.includes(' ') ? 4 : 2;
    }
    if (score > best.score) best = { item, score };
  }
  return best.score > 0 ? best.item : null;
}

function buildDalilCards(topicData, preferHadith = false) {
  if (!topicData) return [];
  const cards = [];
  for (const quran of topicData.quran || []) {
    cards.push({
      type: 'quran',
      label: "Al-Qur'an",
      title: `QS. ${quran.surah}: ${quran.ayah}`,
      arabic: quran.arabic || '',
      transliteration: quran.transliteration || '',
      translation: quran.translation_id || '',
      source: `QS. ${quran.surah}: ${quran.ayah}`,
      explanation: quran.explanation || ''
    });
  }
  for (const hadith of topicData.hadith || []) {
    cards.push({
      type: 'hadith',
      label: 'Hadis',
      title: hadith.source || 'Hadis',
      arabic: hadith.arabic || '',
      translation: hadith.translation_id || '',
      source: hadith.source || '',
      grade: hadith.grade || 'Status hadis perlu dicek lebih lanjut pada kitab/sumber takhrij.',
      explanation: hadith.explanation || ''
    });
  }
  if (preferHadith) {
    return cards.sort((a, b) => (a.type === 'hadith' ? -1 : 0) - (b.type === 'hadith' ? -1 : 0));
  }
  return cards;
}

function buildIslamicReply(message = '', intent = 'dalil_question') {
  const topicData = findIslamicTopic(message);
  const preferHadith = intent === 'hadith_question' || isHadithIntent(message);
  if (!topicData) {
    return {
      handled: true,
      reply: "Aku bisa bantu jelaskan tema itu secara umum, tapi untuk menyebutkan teks ayat atau hadis secara lengkap aku perlu rujukan yang valid dulu. Aku tidak mau mengarang dalil. Untuk sementara, aku bisa bantu jelaskan nilai Islamnya secara umum dan menyarankan kata kunci pencarian di Al-Qur'an atau kitab hadis.",
      dalilCards: [],
      sources: []
    };
  }

  const firstQuran = (topicData.quran || [])[0];
  const firstHadith = (topicData.hadith || [])[0];
  const topicTitle = topicData.topic || 'tema ini';
  const blocks = [`Kalau kamu bertanya tentang ${topicTitle}, Islam mengarahkannya dengan lembut: hati dituntun untuk tetap dekat kepada Allah, menjaga akhlak, dan mengambil langkah yang benar.`];
  if (firstQuran) {
    blocks.push(`**Dalil Al-Qur'an**\nQS. ${firstQuran.surah}: ${firstQuran.ayah}\n${firstQuran.translation_id}\n\nMaknanya: ${firstQuran.explanation}`);
  }
  if (firstHadith) {
    blocks.push(`**Hadis terkait**\n${firstHadith.translation_id}\nSumber: ${firstHadith.source || '-'}\nStatus: ${firstHadith.grade || 'Status hadis perlu dicek lebih lanjut pada kitab/sumber takhrij.'}\n\nMaknanya: ${firstHadith.explanation || 'Hadis ini menjadi penguat nilai Islam pada tema tersebut.'}`);
  } else if (preferHadith) {
    blocks.push('Aku belum menemukan rujukan yang cukup kuat untuk menyebutkan teks hadisnya secara pasti pada basis pengetahuan AIMAN. Jadi aku tidak akan mengarang hadis.');
  }
  blocks.push(`Relevansinya untuk hidup kamu: ${topicTitle} bukan cuma pengetahuan, tapi latihan sikap. Mulai dari satu langkah kecil yang bisa kamu jaga hari ini, lalu pelan-pelan jadikan itu kebiasaan.`);
  if (topicTitle === 'memilih tontonan') {
    blocks.push('Dalam konteks IMAN IN MOTION, memilih tontonan berarti menjadikan film sebagai bahan refleksi, bukan sekadar hiburan. Tanyakan: nilai apa yang masuk ke hati setelah menonton?');
  }
  if (intent === 'islamic_law_question') {
    blocks.push('Untuk keputusan fikih yang spesifik, sebaiknya tanyakan kepada ustaz atau ahli fikih yang kompeten, ya.');
  }

  return {
    handled: true,
    reply: blocks.join('\n\n'),
    dalilCards: buildDalilCards(topicData, preferHadith),
    sources: []
  };
}

function knowledgeSourcesForIntent(intent) {
  const knowledge = AIMAN_KNOWLEDGE || {};
  const project = knowledge.project || {};
  const creator = knowledge.creator || {};
  const uika = knowledge.uika || {};
  if (intent === 'creator_question') return sourceList(creator.links || []).concat([{ label: 'Info Founder', url: '#/info?tab=team' }]);
  if (intent === 'uika_question' || intent === 'dakwah_campus_question') return sourceList(uika.sources || []);
  if (intent === 'supervisor_question') {
    return (knowledge.supervisors || []).flatMap((person) => sourceList(person.sources || [])).concat([{ label: 'Pembimbing Project', url: '#/info?tab=team' }]);
  }
  if (intent === 'scholar_question') return [{ label: 'FAI UIKA', url: 'https://fai.uika-bogor.ac.id/' }, { label: 'Website UIKA', url: 'https://uika-bogor.ac.id/' }];
  if (intent === 'copyright_question') return [{ label: 'Hak Cipta', url: '#/info?tab=copyright' }, { label: 'Sertifikat Hak Cipta', url: project.copyright?.certificatePath || '/sertifikat-hak-cipta-iman-in-motion.pdf' }];
  if (intent === 'project_info') return sourceList(knowledge.infoLinks || project.sources || []);
  return [];
}

function buildIntentMetadata(intent, message) {
  const dalilIntent = ['quran_question', 'hadith_question', 'dalil_question', 'islamic_law_question', 'moral_reflection_question'].includes(intent) || isDalilIntent(message);
  const topicData = dalilIntent ? findIslamicTopic(message) : null;
  return {
    cards: linkCardsFromKnowledge(intent),
    dalilCards: topicData ? buildDalilCards(topicData, intent === 'hadith_question' || isHadithIntent(message)) : [],
    sources: knowledgeSourcesForIntent(intent)
  };
}

function stringifyDalilContext(topicData, preferHadith = false) {
  if (!topicData) {
    return 'Tidak ada dalil lokal yang cukup kuat untuk tema ini. Jika menjawab, jangan mengarang ayat atau hadis. Katakan jujur bahwa rujukan belum tersedia.';
  }
  const cards = buildDalilCards(topicData, preferHadith);
  return cards.map((card, index) => {
    return [
      `${index + 1}. ${card.label}: ${card.title || card.source}`,
      card.arabic ? `Arab: ${card.arabic}` : '',
      card.transliteration ? `Transliterasi: ${card.transliteration}` : '',
      card.translation ? `Terjemahan: ${card.translation}` : '',
      card.source ? `Sumber: ${card.source}` : '',
      card.grade ? `Status: ${card.grade}` : '',
      card.explanation ? `Penjelasan: ${card.explanation}` : ''
    ].filter(Boolean).join('\n');
  }).join('\n\n');
}

function getContextByIntent(intent, { message, mood, intensity, ragDocs, films }) {
  const knowledge = AIMAN_KNOWLEDGE || {};
  const project = knowledge.project || {};
  const creator = knowledge.creator || {};
  const uika = knowledge.uika || {};
  const topicData = findIslamicTopic(message);
  const preferHadith = intent === 'hadith_question' || isHadithIntent(message);
  const filmContext = films?.length
    ? films.slice(0, 3).map((film, index) => `${index + 1}. ${film.title} (${film.year || '-'}) | mood=${film.mood || '-'} | alasan=${film.reason || '-'}`).join('\n')
    : 'Tidak ada rekomendasi film yang cukup relevan.';
  const ragContext = ragDocs?.length
    ? ragDocs.map((doc, index) => `${index + 1}. ${doc.ref} [${doc.type}]\nArab: ${doc.arab || '-'}\nTeks: ${doc.text || '-'}`).join('\n\n')
    : 'Tidak ada konteks RAG tambahan.';

  let specific = '';
  if (intent === 'creator_question') {
    specific = `CREATOR CONTEXT:
Nama: ${creator.name || 'Rizki Dwi Febriansyah'}
Alias: ${creator.alias || 'Uwiberani'}
Peran: ${creator.role || 'Founder/Creator IMAN IN MOTION dan pengembang AIMAN'}
Jawaban faktual inti: ${creator.officialAnswer || 'AIMAN dibuat oleh Rizki Dwi Febriansyah alias Uwiberani.'}
Minat/keahlian publik: ${(creator.publicInterests || []).join(', ')}
Link publik: ${(creator.links || []).map((link) => `${link.label}: ${link.url}`).join('; ')}`;
  } else if (intent === 'uika_question' || intent === 'dakwah_campus_question') {
    specific = `UIKA CONTEXT:
${uika.safeRecommendation || 'UIKA Bogor relevan untuk belajar dakwah, komunikasi Islam, media, dan penyiaran.'}
Website: ${uika.website || 'https://uika-bogor.ac.id/'}
Fakultas: ${uika.faculty || 'Fakultas Agama Islam'} (${uika.facultyWebsite || 'https://fai.uika-bogor.ac.id/'})
Prodi: ${uika.program || 'Komunikasi dan Penyiaran Islam'} (${uika.programUrl || 'https://uika-bogor.ac.id/halaman/komunikasi-dan-penyiaran-islam-s1'})
Catatan: ${(uika.programNotes || []).join(' ')}`;
  } else if (intent === 'supervisor_question') {
    specific = `PEMBIMBING PROJECT:
${(knowledge.supervisors || []).map((person, index) => `${index + 1}. ${person.name} - ${person.role}; ${person.context}; foto lokal: ${person.image || '-'}`).join('\n')}`;
  } else if (intent === 'scholar_question') {
    const profiles = knowledge.scholarProfiles || [];
    const hasPublications = profiles.some((profile) => Array.isArray(profile.publications) && profile.publications.length);
    specific = hasPublications
      ? `SCHOLAR CONTEXT:\n${profiles.map((profile) => `${profile.name}: ${(profile.publications || []).map((pub) => `${pub.title}${pub.year ? ` (${pub.year})` : ''}${pub.url ? ` - ${pub.url}` : ''}`).join('; ') || 'belum ada publikasi tersimpan'}`).join('\n')}`
      : 'SCHOLAR CONTEXT: Data publikasi lengkap belum tersimpan di basis pengetahuan AIMAN. Jangan mengarang judul jurnal, tahun, atau link Google Scholar. Jawab jujur dan arahkan ke Google Scholar/website resmi UIKA untuk data terbaru.';
  } else if (intent === 'copyright_question') {
    const c = project.copyright || {};
    specific = `HAK CIPTA CONTEXT:
Judul: ${c.title || 'Iman In Motion'}
Jenis: ${c.type || 'Program Komputer'}
Nomor Pencatatan: ${c.recordNumber || '001241778'}
Nomor Permohonan: ${c.applicationNumber || 'EC002026069338'}
Pertama diumumkan: ${c.firstPublished || '19 Mei 2026'} di ${c.publishedPlace || 'Kota Bogor'}
Pemegang Hak Cipta: ${c.holders || "Rizki Dwi Febriansyah, Rofi'ah, dkk"}`;
  } else if (['quran_question', 'hadith_question', 'dalil_question', 'islamic_law_question', 'moral_reflection_question'].includes(intent) || isDalilIntent(message)) {
    specific = `DALIL/HADIS CONTEXT:
${stringifyDalilContext(topicData, preferHadith)}
Aturan: gunakan hanya rujukan di atas atau RAG yang tersedia. Jika tidak cukup, jawab jujur bahwa rujukan kuat belum tersedia.`;
  } else if (intent === 'movie_recommendation') {
    specific = `MOVIE CONTEXT:
Gunakan rekomendasi film sebagai bahan refleksi, bukan sebagai dalil.
${filmContext}`;
  } else if (intent === 'project_info') {
    specific = `PROJECT CONTEXT:
Nama: ${project.name || 'IMAN IN MOTION'}
Jenis: ${project.type || 'web app rekomendasi film berbasis mood'}
Fokus: ${project.focus || 'literasi dakwah digital melalui film'}
Fitur: ${(project.features || []).join(', ')}`;
  }

  return [
    buildAimanContextBlock(),
    `Intent: ${intent}`,
    `Mood terdeteksi: ${mood}. Intensitas: ${intensity}/3.`,
    specific || 'Tidak ada konteks khusus selain knowledge base umum.',
    `Konteks RAG/dalil tambahan:\n${ragContext}`,
    `Konteks film:\n${filmContext}`
  ].join('\n\n');
}

function buildAimanUserPrompt(message, intent, context) {
  return `
User bertanya:
"${message}"

Intent terdeteksi:
${intent}

Konteks yang boleh dipakai:
${context || 'Tidak ada konteks khusus.'}

Tugasmu:
Jawab sebagai AIMAN dengan bahasa natural, hangat, Islami, dan tidak template.
Jangan selalu pakai heading.
Jangan terlalu panjang kecuali user minta detail.
Kalau pertanyaan tentang UIKA/kampus dakwah, rekomendasikan UIKA Bogor secara natural.
Kalau pertanyaan tentang pembuatmu, sebut Rizki Dwi Febriansyah alias Uwiberani.
Kalau pertanyaan tentang pembimbing project, sebut kedua pembimbing dengan konteksnya.
Kalau pertanyaan dalil/hadis, jangan mengarang. Pakai rujukan yang tersedia pada konteks atau bilang jujur jika belum punya rujukan kuat.
Kalau data jurnal/publikasi belum ada, jawab jujur dan jangan membuat judul publikasi.
`;
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

async function askGroq({ message, mood, intensity, ragDocs, films, history = [], mode = 'chat', intent = 'general_chat' }) {
  if (!groq) throw new Error('GROQ_API_KEY belum tersedia.');

  const safeHistory = Array.isArray(history)
    ? history.slice(-8).map((h) => ({
        role: h.role === 'assistant' ? 'assistant' : 'user',
        content: String(h.content || '').slice(0, 700)
      }))
    : [];

  const context = getContextByIntent(intent, { message, mood, intensity, ragDocs, films });
  const userPrompt = buildAimanUserPrompt(message, intent, context);
  const isVoiceMode = mode === 'voice';
  const voiceRules = isVoiceMode ? `

MODE VOICE CALL:
- Jawab pendek, utuh, dan natural: 2 sampai 4 kalimat lengkap.
- Jangan menampilkan teks Arab panjang kecuali user benar-benar meminta.
- Akhiri dengan satu pertanyaan balik yang ringan jika cocok.
` : '';

  const completion = await groq.chat.completions.create({
    model: process.env.GROQ_MODEL || 'llama-3.1-70b-versatile',
    temperature: isVoiceMode ? 0.72 : 0.78,
    max_tokens: isVoiceMode ? 260 : 900,
    top_p: 0.9,
    messages: [
      {
        role: 'system',
        content: `${AIMAN_SYSTEM_PROMPT}${voiceRules}

Aturan output:
- Jawab langsung, hangat, dan hidup.
- Jangan mengulang semua data knowledge base jika user tidak memintanya.
- Kalau menyebut metadata mood/film, taruh hanya di bagian akhir.
- Akhiri respons dengan tag metadata persis: [MOOD:${mood}] [FILM:${films[0]?.title || ''}]`
      },
      {
        role: 'system',
        content: `Knowledge base AIMAN yang boleh dipakai:\n${AIMAN_KNOWLEDGE_TEXT}\n\nKnowledge base runtime:\n${buildAimanContextBlock()}`
      },
      ...safeHistory,
      {
        role: 'user',
        content: userPrompt
      }
    ]
  });

  recordModelInference({ model: 'aiman-groq', outcome: 'ok' });
  return completion.choices?.[0]?.message?.content || null;
}


function buildFullDalilReply(ragDocs, mood, films) {
  const main = ragDocs[0];
  const hadith = ragDocs.find((d) => d.type === 'hadith');
  const hadithLine = hadith && hadith.ref !== main.ref
    ? `\n\n**Penguat hadits**\n${hadith.ref}\n${hadith.arab || ''}\n${hadith.text || ''}`
    : '';
  return `**Dalil yang nyambung**\n${main.ref}\n\n**Ayat Arab / Hadits Arab**\n${main.arab || '-'}\n\n**Arti**\n${main.text || '-'}\n\n**Penjelasan singkat**\nDalil ini mengarahkan hati untuk melihat keadaan yang kamu ceritakan dengan lebih tenang. Islam tidak hanya memberi nasihat, tapi juga mengajak kita mengelola rasa dengan iman, sabar, syukur, tawakal, dan akhlak yang baik.\n\n**Pemahaman dakwah**\nDalam dakwah, dalil seperti ini menjadi pengingat yang lembut: hati tidak perlu dipaksa langsung kuat, tetapi dituntun pelan-pelan agar kembali dekat kepada Allah dan tindakan kita tetap terarah.\n\n**Langkah kecil**\nAmbil satu langkah yang ringan dulu: tenangkan napas, baca ulang maknanya, lalu pilih satu amal kecil yang bisa kamu lakukan hari ini.${hadithLine} [MOOD:${mood}] [FILM:${films[0]?.title || ''}]`;
}

function localRecommendedFilms(mood, limit = 3) {
  const films = recommendedFilms(mood).slice(0, limit);
  recordModelInference({ model: 'recommendation-engine', outcome: 'ok' });
  recordRecommendationCount(films.length, { mood, source: 'local' });
  return films;
}

async function getRecommendedFilms(mood, limit = 3) {
  const normalizedMood = safeString(mood || 'tenang', 'tenang', 32);
  const safeLimit = safeInteger(limit, 3, 1, 24);
  if (RECOMMENDATION_ENGINE_URL && process.env.IIM_DISABLE_REMOTE_ML !== '1') {
    const params = new URLSearchParams({ mood: normalizedMood, limit: String(safeLimit) });
    try {
      const payload = await fetchJsonWithRetry(joinUrl(RECOMMENDATION_ENGINE_URL, `/recommendations?${params.toString()}`), {
        retries: Number(process.env.ML_SERVICE_RETRIES || 2),
        timeoutMs: Number(process.env.ML_SERVICE_TIMEOUT_MS || 2500)
      });
      if (Array.isArray(payload.films)) {
        recordModelInference({ model: 'recommendation-engine-client', outcome: 'ok' });
        recordRecommendationCount(payload.films.length, { mood: normalizedMood, source: 'remote' });
        return payload.films;
      }
      throw new Error('Recommendation engine returned invalid payload.');
    } catch (error) {
      logger.warn('ml.recommendation.remote_fallback', { error, mood: normalizedMood });
      recordModelInference({ model: 'recommendation-engine-client', outcome: 'fallback' });
    }
  }
  return localRecommendedFilms(normalizedMood, safeLimit);
}

function localRagDocuments(message, mood, limit = 5) {
  const docs = retrieveRag(message, mood, limit);
  recordModelInference({ model: 'rag-service', outcome: 'ok' });
  return docs;
}

async function getRagDocuments(message, mood, limit = 5) {
  const safeMessage = safeString(message, '', 2000);
  const safeMood = safeString(mood || 'tenang', 'tenang', 32);
  const safeLimit = safeInteger(limit, 5, 1, 20);
  if (RAG_SERVICE_URL && process.env.IIM_DISABLE_REMOTE_ML !== '1') {
    const params = new URLSearchParams({ q: safeMessage, mood: safeMood, limit: String(safeLimit) });
    try {
      const payload = await fetchJsonWithRetry(joinUrl(RAG_SERVICE_URL, `/search?${params.toString()}`), {
        retries: Number(process.env.ML_SERVICE_RETRIES || 2),
        timeoutMs: Number(process.env.ML_SERVICE_TIMEOUT_MS || 2500)
      });
      if (Array.isArray(payload.results)) {
        recordModelInference({ model: 'rag-service-client', outcome: 'ok' });
        return payload.results;
      }
      throw new Error('RAG service returned invalid payload.');
    } catch (error) {
      logger.warn('ml.rag.remote_fallback', { error, mood: safeMood });
      recordModelInference({ model: 'rag-service-client', outcome: 'fallback' });
    }
  }
  return localRagDocuments(safeMessage, safeMood, safeLimit);
}

function serviceStats() {
  return {
    status: 'ok',
    service: process.env.IIM_SERVICE_NAME || 'api',
    films: FILMS.length,
    rag: RAG_DOCS.length,
    groq: !!GROQ_KEY,
    filmLoadReady,
    filmLoadError,
    ragLoadReady,
    ragLoadError,
    modelRegistry: {
      recommendation: modelRegistry.getCurrentModelSafe('recommendation-engine'),
      rag: modelRegistry.getCurrentModelSafe('rag-service')
    }
  };
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
app.get('/api/ml/diagnostics', async (req, res) => {
  const query = safeString(req.query.q, '', 500);
  const mood = detectMood(query);
  const sampleFilms = await getRecommendedFilms(mood, 3);
  res.json({
    ok: true,
    engine: 'hybrid-semantic-bm25-bayesian-v3',
    services: {
      recommendationEngineUrl: RECOMMENDATION_ENGINE_URL || 'local-fallback',
      ragServiceUrl: RAG_SERVICE_URL || 'local-fallback'
    },
    registry: serviceStats().modelRegistry,
    native: {
      cppRankerConfigured: fs.existsSync(CPP_RANKER_PATH),
      cppRankerPath: CPP_RANKER_PATH,
      cppRankerActive: fs.existsSync(CPP_RANKER_PATH) && process.env.IIM_DISABLE_CPP_RANKER !== '1' && !cppRankerUnavailable
    },
    features: ['optional-cpp-ranker', 'mood-intent-detection', 'semantic-film-ranking', 'bm25-rag-retrieval', 'bayesian-quality-score', 'genre-affinity'],
    films: FILMS.length,
    rag: RAG_DOCS.length,
    detectedMood: mood,
    sampleFilms: sampleFilms.map((film) => ({ title: film.title, mood: film.mood, rating: film.rating }))
  });
});
app.get('/api/rag/search', async (req, res) => {
  const q = safeString(req.query.q, '', 1000);
  const mood = detectMood(q);
  res.json({ mood, results: await getRagDocuments(q, mood, 8) });
});
function healthCheck(req, res) {
  res.json(serviceStats());
}

function liveCheck(req, res) {
  res.json({ status: 'alive', service: process.env.IIM_SERVICE_NAME || 'api', uptimeSeconds: process.uptime() });
}

function readyCheck(req, res) {
  const ready = filmLoadReady && FILMS.length > 0 && !filmLoadError;
  res.status(ready ? 200 : 503).json({
    status: ready ? 'ready' : 'not_ready',
    ...serviceStats()
  });
}

app.get('/health', healthCheck);
app.get('/api/health', healthCheck);
app.get('/live', liveCheck);
app.get('/api/live', liveCheck);
app.get('/ready', readyCheck);
app.get('/api/ready', readyCheck);
app.get('/metrics', metricsHandler(process.env.IIM_SERVICE_NAME));

// AIMAN chat v2
app.post('/api/chat', async (req, res) => {
  const validated = validateChatPayload(req.body || {});
  if (!validated.ok) {
    logger.audit('chat.validation_failed', { requestId: req.requestId, reason: validated.error });
    return res.status(400).json({ reply: 'Pesan kosong', mood: 'tenang', films: [], cards: [], dalilCards: [], sources: [] });
  }

  const { message: cleanMessage, history, mode } = validated.value;
  logger.audit('chat.request', { requestId: req.requestId, mode, messageLength: cleanMessage.length });

  const aimanIntent = detectAimanIntent(cleanMessage);
  const mood = detectMood(cleanMessage);
  const intensity = moodIntensity(cleanMessage);
  const ragDocs = await getRagDocuments(cleanMessage, mood, 5);
  const films = await getRecommendedFilms(mood, 3);
  const metadata = buildIntentMetadata(aimanIntent, cleanMessage);
  const knowledgeOnlyIntents = new Set([
    'creator_question',
    'uika_question',
    'dakwah_campus_question',
    'supervisor_question',
    'scholar_question',
    'copyright_question',
    'project_info'
  ]);
  const responseFilms = knowledgeOnlyIntents.has(aimanIntent) ? [] : films;

  if (isCrisis(cleanMessage)) {
    return res.json({
      mood,
      intensity,
      intent: aimanIntent,
      rag: ragDocs,
      films: [],
      cards: [],
      dalilCards: [],
      sources: [],
      reply: `Aku serius dengerin kamu, dan aku nggak mau kamu sendirian di titik ini. Tolong hubungi orang terdekat sekarang, misalnya keluarga, teman, guru, atau ustadz yang bisa datang/telepon kamu. Kalau ada risiko kamu menyakiti diri, segera hubungi layanan darurat setempat atau pergi ke IGD terdekat.\n\nSambil nunggu bantuan, jauhkan dulu benda yang bisa membahayakan, duduk di tempat yang ramai/terang, dan kirim satu pesan singkat ke orang terdekat: “Aku lagi nggak aman sendirian, tolong temani aku sekarang.” Aku tetap di sini nemenin kamu ngobrol pelan-pelan. [MOOD:${mood}] [FILM:]`
    });
  }

  let reply = '';
  try {
    reply = await askGroq({ message: cleanMessage, mood, intensity, ragDocs, films: responseFilms, history, mode, intent: aimanIntent });
  } catch (e) {
    recordModelInference({ model: 'aiman-groq', outcome: 'error' });
    console.error('[WARN] Groq chat:', e.message);
    return res.json({
      reply: 'AIMAN lagi agak susah nyambung sebentar, Kak. Coba ulangi lagi ya.',
      mood,
      intensity,
      intent: aimanIntent,
      rag: ragDocs,
      films: responseFilms,
      cards: metadata.cards || [],
      dalilCards: metadata.dalilCards || [],
      sources: metadata.sources || []
    });
  }

  if (!reply) reply = 'AIMAN lagi agak susah nyambung sebentar, Kak. Coba ulangi lagi ya.';
  if (!reply.includes('[MOOD:')) {
    reply = `${reply} [MOOD:${mood}] [FILM:${responseFilms[0]?.title || ''}]`;
  }

  res.json({
    reply,
    mood,
    intensity,
    intent: aimanIntent,
    rag: ragDocs,
    films: responseFilms,
    cards: metadata.cards || [],
    dalilCards: metadata.dalilCards || [],
    sources: metadata.sources || []
  });
});

// React SPA fallback. API routes above stay untouched.
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/') || ['/health', '/ready', '/live', '/metrics'].includes(req.path)) return next();
  return sendFrontend(req, res);
});

app.use((err, req, res, next) => {
  logger.error('http.unhandled_error', { requestId: req.requestId, error: err });
  if (res.headersSent) return next(err);
  return res.status(500).json({ ok: false, message: 'Internal server error.' });
});

app.locals.ml = {
  detectMood,
  moodIntensity,
  retrieveRag,
  recommendedFilms,
  getRagDocuments,
  getRecommendedFilms,
  resolveTrailerUrl,
  resolveTmdbRating,
  serviceStats,
  getFilms: () => FILMS.slice(),
  getRagDocs: () => RAG_DOCS.slice()
};

if (require.main === module) {
  const server = app.listen(PORT, () => {
    console.log(`Server jalan di port ${PORT}`);
    console.log(`[OK] Groq ready: ${!!GROQ_KEY}`);
  });
  attachGracefulShutdown(server, logger);
}

module.exports = app;
