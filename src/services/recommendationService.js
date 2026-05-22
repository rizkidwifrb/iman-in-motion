import movies from '../data/movies';
import { getDisplayRating, getRatingConfidence, normalizeRatingValue, normalizeVoteCount } from '../utils/rating';
import { normalizeTrailer } from '../utils/trailer';

export const MOODS = [
  {
    key: 'sedih',
    label: 'Sedih',
    title: 'Saat Sedih',
    icon: '☁',
    accent: 'from-blue-500/20 to-slate-500/10',
    color: '#60a5fa',
    color2: '#3b82f6',
    glow: 'rgba(96,165,250,.18)',
    description: 'Untuk hati yang sedang lelah, kecewa, atau butuh dikuatkan pelan-pelan.',
    message: 'Pelan-pelan, Allah tidak meninggalkan hamba-Nya.',
    arabic: 'لَا تَحْزَنْ إِنَّ اللَّهَ مَعَنَا',
    dalil: 'QS. At-Taubah: 40',
    dalilText: 'Janganlah engkau bersedih, sesungguhnya Allah bersama kita.',
    reflection: 'Mood sedih diarahkan ke film yang menenangkan, menguatkan sabar, dan membuka ruang penerimaan.'
  },
  {
    key: 'gelisah',
    label: 'Gelisah',
    title: 'Saat Gelisah',
    icon: '☾',
    accent: 'from-indigo-500/20 to-sky-500/10',
    color: '#c084fc',
    color2: '#9333ea',
    glow: 'rgba(192,132,252,.18)',
    description: 'Untuk pikiran yang ramai, overthinking, dan ingin kembali tenang.',
    message: 'Tenangkan napas. Hati yang mengingat Allah akan menemukan ruang untuk reda.',
    arabic: 'أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ',
    dalil: 'QS. Ar-Ra’d: 28',
    dalilText: 'Ingatlah, hanya dengan mengingat Allah hati menjadi tenteram.',
    reflection: 'Mood gelisah diarahkan ke tontonan yang memberi jeda, rasa aman, dan cara melihat masalah dengan lebih jernih.'
  },
  {
    key: 'hidayah',
    label: 'Hidayah',
    title: 'Mencari Hidayah',
    icon: '✦',
    accent: 'from-emerald-400/20 to-green-200/10',
    color: '#4ade80',
    color2: '#22c55e',
    glow: 'rgba(74,222,128,.18)',
    description: 'Untuk momen ingin berubah, belajar, dan mendekat kepada kebaikan.',
    message: 'Setiap langkah menuju kebaikan adalah awal yang indah.',
    arabic: 'وَاللَّهُ يَهْدِي مَنْ يَشَاءُ إِلَىٰ صِرَاطٍ مُسْتَقِيمٍ',
    dalil: 'QS. Al-Baqarah: 213',
    dalilText: 'Allah memberi petunjuk kepada siapa yang Dia kehendaki menuju jalan yang lurus.',
    reflection: 'Mood hidayah diarahkan ke film bertema perubahan diri, perjalanan iman, dan keputusan untuk menjadi lebih baik.'
  },
  {
    key: 'bahagia',
    label: 'Bahagia',
    title: 'Saat Bahagia',
    icon: '☀',
    accent: 'from-yellow-400/25 to-orange-300/10',
    color: '#fbbf24',
    color2: '#f59e0b',
    glow: 'rgba(251,191,36,.18)',
    description: 'Untuk rasa syukur, hangat, ringan, dan ingin menikmati kebaikan.',
    message: 'Syukuri rasa lapang hari ini dengan tontonan yang hangat dan uplifting.',
    arabic: 'لَئِنْ شَكَرْتُمْ لَأَزِيدَنَّكُمْ',
    dalil: 'QS. Ibrahim: 7',
    dalilText: 'Jika kamu bersyukur, niscaya Aku akan menambah nikmat kepadamu.',
    reflection: 'Mood bahagia diarahkan ke film keluarga, persahabatan, komedi hangat, dan cerita yang menguatkan rasa syukur.'
  },
  {
    key: 'marah',
    label: 'Marah',
    title: 'Saat Marah',
    icon: '◆',
    accent: 'from-red-500/20 to-orange-400/10',
    color: '#f87171',
    color2: '#ef4444',
    glow: 'rgba(248,113,113,.18)',
    description: 'Untuk emosi yang perlu jeda, kontrol diri, dan ruang menenangkan diri.',
    message: 'Ambil jeda. Cerita yang tepat bisa membantu hati kembali jernih.',
    arabic: 'وَالْكَاظِمِينَ الْغَيْظَ وَالْعَافِينَ عَنِ النَّاسِ',
    dalil: 'QS. Ali Imran: 134',
    dalilText: 'Orang-orang yang menahan amarahnya dan memaafkan manusia.',
    reflection: 'Mood marah diarahkan ke film yang membantu membaca konflik, konsekuensi pilihan, dan pentingnya pengendalian diri.'
  },
  {
    key: 'rindu',
    label: 'Rindu',
    title: 'Saat Rindu',
    icon: '◌',
    accent: 'from-teal-400/20 to-cyan-200/10',
    color: '#2dd4bf',
    color2: '#14b8a6',
    glow: 'rgba(45,212,191,.18)',
    description: 'Untuk rasa kangen, kehilangan, pulang, keluarga, atau memori yang masih hangat.',
    message: 'Rindu bisa menjadi ruang refleksi. Cari film yang hangat dan dekat di hati.',
    arabic: 'فَاذْكُرُونِي أَذْكُرْكُمْ',
    dalil: 'QS. Al-Baqarah: 152',
    dalilText: 'Maka ingatlah kepada-Ku, Aku pun akan ingat kepadamu.',
    reflection: 'Mood rindu diarahkan ke film tentang keluarga, cinta yang baik, kehilangan, dan makna pulang secara batin.'
  }
];

const moodAliases = {
  sedih: 'sedih',
  sad: 'sedih',
  gelisah: 'gelisah',
  cemas: 'gelisah',
  anxious: 'gelisah',
  hidayah: 'hidayah',
  inspiratif: 'hidayah',
  semangat: 'hidayah',
  bahagia: 'bahagia',
  happy: 'bahagia',
  tenang: 'gelisah',
  marah: 'marah',
  angry: 'marah',
  rindu: 'rindu'
};

const moodKeywords = {
  sedih: ['sedih', 'sad', 'grief', 'loss', 'depression', 'sabar', 'healing', 'forgiveness', 'mercy', 'hope'],
  gelisah: ['gelisah', 'anxiety', 'fear', 'overthinking', 'calm', 'peace', 'tenang', 'tawakal', 'faith', 'spiritual'],
  hidayah: ['hidayah', 'faith', 'religion', 'spiritual', 'islam', 'taubat', 'repent', 'journey', 'truth', 'inspirational'],
  bahagia: ['bahagia', 'happy', 'family', 'comedy', 'friendship', 'syukur', 'gratitude', 'warm', 'uplifting'],
  marah: ['marah', 'anger', 'revenge', 'conflict', 'crime', 'justice', 'forgive', 'control', 'rage'],
  rindu: ['rindu', 'love', 'romance', 'family', 'memory', 'missing', 'home', 'loss', 'mother', 'father']
};

const positiveThemeKeywords = [
  'faith', 'spiritual', 'islam', 'muslim', 'religion', 'prayer', 'forgiveness', 'mercy',
  'hope', 'family', 'friendship', 'charity', 'truth', 'justice', 'sacrifice', 'healing',
  'redemption', 'gratitude', 'teacher', 'journey', 'inspire', 'inspirational', 'kindness'
];

const semanticMoodProfiles = {
  sedih: 'grief loss lonely sadness depression tears healing patience mercy hope acceptance family forgiveness kehilangan kecewa lelah sendiri sabar ikhlas pulih menerima ditenangkan dikuatkan',
  gelisah: 'anxiety fear panic overthinking uncertainty calm peace trust safety prayer surrender cemas takut resah pikiran ramai tenang tawakal aman perlindungan',
  hidayah: 'faith repentance redemption spiritual journey truth change guidance prayer islam conscience taubat hijrah iman petunjuk berubah memperbaiki diri dakwah kebenaran',
  bahagia: 'joy gratitude family friendship comedy warm uplifting celebration kindness togetherness bahagia syukur ringan hangat keluarga persahabatan komedi nikmat berbagi',
  marah: 'anger rage conflict revenge justice forgiveness self control patience consequences crime marah emosi konflik dendam menahan memaafkan adil sabar akibat',
  rindu: 'longing memory home romance family distance missing reunion love loss nostalgia rindu kangen pulang kenangan keluarga cinta kehilangan jarak doa'
};

const moodGenreAffinity = {
  sedih: { Drama: 1, Family: 0.62, Romance: 0.42, Documentary: 0.34 },
  gelisah: { Drama: 0.78, Mystery: 0.5, Thriller: 0.35, Family: 0.28, Documentary: 0.28 },
  hidayah: { Drama: 0.88, Documentary: 0.62, History: 0.52, Family: 0.46, Adventure: 0.3 },
  bahagia: { Comedy: 0.95, Family: 0.9, Animation: 0.68, Romance: 0.38, Adventure: 0.34 },
  marah: { Drama: 0.72, Crime: 0.68, Action: 0.42, Thriller: 0.38, History: 0.25 },
  rindu: { Romance: 0.84, Family: 0.78, Drama: 0.7, Music: 0.28 }
};

const semanticStopwords = new Set([
  'the','and','for','with','from','that','this','into','about','after','before','when','while','their','there','they',
  'yang','dan','atau','dari','untuk','dengan','karena','dalam','pada','sebuah','seorang','akan','telah','saat'
]);

function splitList(value = '') {
  if (Array.isArray(value)) return value.map(String).map((item) => item.trim()).filter(Boolean);
  return String(value).split(/[|,]/).map((item) => item.trim()).filter(Boolean);
}

function normalizeText(value = '') {
  return String(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenizeSemantic(value = '') {
  return normalizeText(value)
    .split(' ')
    .filter((token) => token.length > 2 && !semanticStopwords.has(token));
}

function normalizeMoodKey(value = '') {
  const first = String(value || '').toLowerCase().split(/[|,]/)[0]?.trim();
  return moodAliases[first] || (MOODS.some((mood) => mood.key === first) ? first : 'hidayah');
}

function stableNoise(value = '') {
  let hash = 0;
  for (const char of String(value)) hash = ((hash << 5) - hash + char.charCodeAt(0)) | 0;
  return (Math.abs(hash) % 100) / 1000;
}

export function normalizeMovie(movie) {
  const title = movie.title_asli || movie.title || movie.title_en || 'Tanpa Judul';
  const year = Number(movie.year) || null;
  const rating = normalizeRatingValue(movie);
  const trailer = normalizeTrailer(movie);
  const mood = normalizeMoodKey(movie.mood);

  return {
    id: movie.id || movie.movieId || movie.tmdbId || movie.tmdb_id || `${title}-${year || 'na'}`,
    title,
    title_asli: title,
    year,
    genres: movie.genres || movie.genre || '',
    genreList: splitList(movie.genres || movie.genre),
    poster: movie.poster_url || movie.poster || '',
    poster_url: movie.poster_url || movie.poster || '',
    backdrop: movie.backdrop_url || movie.backdrop || movie.poster_url || movie.poster || '',
    backdrop_url: movie.backdrop_url || movie.backdrop || movie.poster_url || movie.poster || '',
    overview: movie.overview || movie.description || 'Sinopsis belum tersedia.',
    rating,
    vote_count: normalizeVoteCount(movie),
    rating_source: movie.rating_source || movie.ratingSource || '',
    rating_updated_at: movie.rating_updated_at || movie.ratingUpdatedAt || '',
    tmdb_vote_average: normalizeRatingValue({ tmdb_vote_average: movie.tmdb_vote_average ?? movie.vote_average }),
    tmdb_popularity: Number(movie.tmdb_popularity || movie.popularity || 0) || 0,
    tmdb_status: movie.tmdb_status || '',
    mood,
    originalMood: movie.mood || '',
    tmdbId: movie.tmdbId || movie.tmdb_id || movie.tmdb || '',
    trailer_url: trailer.trailer_url,
    trailer_embed_url: trailer.trailer_embed_url,
    trailer_key: trailer.trailer_key,
    trailer_name: trailer.trailer_name,
    hasTrailer: trailer.hasTrailer,
    caster: movie.caster || movie.cast || '',
    castList: splitList(movie.caster || movie.cast),
    raw: movie
  };
}

export const allMovies = movies.map(normalizeMovie);

let semanticModel = null;

function getSemanticModel() {
  if (semanticModel) return semanticModel;
  const docs = allMovies.map((movie) => tokenizeSemantic(`${movie.title} ${movie.genres} ${movie.overview} ${movie.caster} ${movie.mood}`));
  const df = new Map();
  docs.forEach((tokens) => {
    new Set(tokens).forEach((token) => df.set(token, (df.get(token) || 0) + 1));
  });
  const totalDocs = Math.max(1, docs.length);
  const idf = new Map(Array.from(df.entries()).map(([token, count]) => [token, Math.log(1 + totalDocs / (1 + count))]));
  const vectors = new Map();
  allMovies.forEach((movie, index) => vectors.set(movie.id, vectorizeTokens(docs[index], idf)));
  semanticModel = { idf, vectors };
  return semanticModel;
}

function vectorizeTokens(tokens = [], idf = new Map()) {
  const counts = new Map();
  tokens.forEach((token) => counts.set(token, (counts.get(token) || 0) + 1));
  const length = Math.max(1, tokens.length);
  const vector = new Map();
  counts.forEach((count, token) => {
    const tf = count / length;
    vector.set(token, tf * (idf.get(token) || 0.75));
  });
  return vector;
}

function cosineSimilarity(a = new Map(), b = new Map()) {
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

function semanticScore(movie, mood, query = '') {
  const model = getSemanticModel();
  const profile = `${semanticMoodProfiles[mood] || ''} ${query}`;
  const profileVector = vectorizeTokens(tokenizeSemantic(profile), model.idf);
  const movieVector = model.vectors.get(movie.id);
  return cosineSimilarity(movieVector, profileVector);
}

function genreAffinityScore(movie, mood) {
  const affinity = moodGenreAffinity[mood] || {};
  if (!movie.genreList.length) return 0;
  return movie.genreList.reduce((score, genre) => score + (affinity[genre] || 0), 0) / movie.genreList.length;
}

function bayesianQualityScore(movie) {
  const rating = getDisplayRating(movie);
  if (!rating.hasRating) return 0.35;
  const votes = Math.max(0, normalizeVoteCount(movie));
  const globalMean = 6.7;
  const confidenceVotes = 120;
  const weighted = ((votes / (votes + confidenceVotes)) * rating.value) + ((confidenceVotes / (votes + confidenceVotes)) * globalMean);
  return Math.max(0, Math.min(1, weighted / 10));
}

export function getMoodByKey(key) {
  return MOODS.find((mood) => mood.key === normalizeMoodKey(key)) || MOODS[0];
}

export function getMovieById(id) {
  return allMovies.find((movie) => String(movie.id) === String(id));
}

export function getGenres() {
  const set = new Set();
  allMovies.forEach((movie) => movie.genreList.forEach((genre) => set.add(genre)));
  return Array.from(set).sort().slice(0, 60);
}

export function getCasters() {
  const counts = new Map();
  allMovies.forEach((movie) => movie.castList.forEach((name) => counts.set(name, (counts.get(name) || 0) + 1)));
  return Array.from(counts.entries()).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 80).map(([name]) => name);
}

export function getYears() {
  return Array.from(new Set(allMovies.map((movie) => movie.year).filter(Boolean))).sort((a, b) => b - a);
}

function getActiveAccountSignals() {
  try {
    const user = JSON.parse(localStorage.getItem('iman_user') || 'null');
    if (!user) return { topMood: '', favorites: [] };
    const userId = String(user.uid || user.email || user.name || 'guest').replace(/[^a-zA-Z0-9_-]/g, '_');
    const stats = JSON.parse(localStorage.getItem(`iim_mood_stats_${userId}`) || '{"counts":{}}');
    const favorites = JSON.parse(localStorage.getItem(`iim_favorites_${userId}`) || '[]');
    const topMood = Object.entries(stats.counts || {}).sort((a, b) => b[1] - a[1])[0]?.[0] || '';
    return { topMood: normalizeMoodKey(topMood), favorites };
  } catch {
    return { topMood: '', favorites: [] };
  }
}

function keywordScore(text, keywords = [], weight = 1) {
  return keywords.reduce((score, keyword) => score + (text.includes(keyword) ? weight : 0), 0);
}

function personalizeScore(movie, selectedMood = '') {
  const { topMood, favorites } = getActiveAccountSignals();
  let score = 0;
  if (!selectedMood && topMood && movie.mood === topMood) score += 7;
  if (topMood && selectedMood && topMood === selectedMood && movie.mood === topMood) score += 4;
  const favoriteText = favorites.map((item) => `${item.genres || ''} ${item.mood || ''}`).join(' ').toLowerCase();
  movie.genreList.forEach((genre) => {
    if (favoriteText.includes(genre.toLowerCase())) score += 1.5;
  });
  if (favorites.some((item) => String(item.id) === String(movie.id))) score -= 8;
  return score;
}

export function scoreMovie(movie, selectedMood = '', options = {}) {
  const mood = normalizeMoodKey(selectedMood || movie.mood);
  const text = `${movie.title} ${movie.genres} ${movie.overview} ${movie.mood} ${movie.caster}`.toLowerCase();
  const rating = getDisplayRating(movie);
  const ratingValue = rating.hasRating ? rating.value / 10 : 0;
  const bayesianQuality = bayesianQualityScore(movie);
  const semantic = semanticScore(movie, mood, options.query || '');
  const genreAffinity = genreAffinityScore(movie, mood);
  const confidence = getRatingConfidence(movie);
  const year = Number(movie.year || 0);
  const recency = year ? Math.max(0, Math.min(1, (year - 1970) / 55)) : 0;
  const popularity = Math.min(1, Math.log10((movie.tmdb_popularity || 0) + 1) / 3);

  let score = 0;
  if (!selectedMood) score += 5;
  if (movie.mood === mood) score += 42;
  if (String(movie.originalMood || '').toLowerCase().includes(mood)) score += 12;
  score += keywordScore(text, moodKeywords[mood], 4.5);
  score += keywordScore(text, positiveThemeKeywords, 2.1);
  score += semantic * 28;
  score += genreAffinity * 12;
  score += bayesianQuality * 18;
  score += ratingValue * 8;
  score += confidence * 11;
  score += recency * 5;
  score += popularity * 5;
  score += movie.poster ? 3 : -7;
  score += movie.backdrop ? 1.5 : -2;
  score += movie.hasTrailer ? 2 : -1.5;
  score += movie.overview && movie.overview.length > 80 ? 3 : -3;
  score += personalizeScore(movie, selectedMood);

  if (options.genre && movie.genres.toLowerCase().includes(String(options.genre).toLowerCase())) score += 10;
  if (options.caster && movie.caster.toLowerCase().includes(String(options.caster).toLowerCase())) score += 10;
  if (options.year && Number(movie.year) === Number(options.year)) score += 8;
  if (options.minRating && (!rating.hasRating || rating.value < Number(options.minRating))) score -= 100;
  if (options.query) score += semanticScore(movie, mood, options.query) * 18;

  return Number((score + stableNoise(movie.id)).toFixed(3));
}

export function buildReason(movie, selectedMood) {
  if (!movie) return '';
  const mood = getMoodByKey(selectedMood || movie.mood);
  const rating = getDisplayRating(movie);
  const quality = rating.hasRating ? `ratingnya ${rating.rating}/10${rating.sourceLabel ? ` dari ${rating.sourceLabel}` : ''}` : 'datanya tetap relevan meski belum punya rating publik';
  const genre = movie.genreList?.slice(0, 2).join(' dan ') || movie.genres || 'ceritanya';
  const trailer = movie.hasTrailer ? 'trailer tersedia untuk membantu mengecek nuansanya' : 'sinopsisnya memberi gambaran yang cukup jelas';
  return `Cocok untuk mood ${mood.label.toLowerCase()} karena sinyal temanya dekat dengan ${genre}, ${quality}, dan ${trailer}. Model rekomendasi juga membaca kemiripan semantik cerita ini dengan kebutuhan mood kamu.`;
}

export function diversifyRecommendations(items, limit = 24) {
  const picked = [];
  const seenTitle = new Set();
  const genreCount = new Map();

  for (const item of items) {
    const titleKey = String(item.movie?.title || item.title || '').toLowerCase();
    if (seenTitle.has(titleKey)) continue;

    const genreKey = (item.movie?.genreList || item.genreList || ['lainnya'])[0] || 'lainnya';
    const count = genreCount.get(genreKey) || 0;
    const diversityPenalty = Math.max(0, count - 1) * 4;
    const next = { ...item, score: Number((item.score - diversityPenalty).toFixed(3)) };

    if (count < 3 || picked.length < Math.ceil(limit / 2)) {
      picked.push(next);
      seenTitle.add(titleKey);
      genreCount.set(genreKey, count + 1);
    }

    if (picked.length >= limit) break;
  }

  return picked.sort((a, b) => b.score - a.score).slice(0, limit);
}

export function recommendMovies(selectedMood, limit = 24) {
  const scored = allMovies
    .map((movie) => {
      const score = scoreMovie(movie, selectedMood);
      const confidence = getRatingConfidence(movie);
      return {
        ...movie,
        movie,
        score,
        reason: buildReason(movie, selectedMood),
        matchedMood: getMoodByKey(selectedMood || movie.mood).key,
        confidence,
        tags: [movie.mood, ...movie.genreList.slice(0, 3), movie.hasTrailer ? 'trailer tersedia' : 'tanpa trailer'].filter(Boolean)
      };
    })
    .filter((item) => item.score > 8)
    .sort((a, b) => b.score - a.score || (b.rating || 0) - (a.rating || 0));

  return diversifyRecommendations(scored, limit);
}

export function searchMovies({ query = '', mood = '', genre = '', caster = '', year = '', minRating = '', sort = 'recommended' } = {}) {
  const q = query.trim().toLowerCase();
  const normalizedMood = mood ? normalizeMoodKey(mood) : '';
  const results = allMovies
    .map((movie) => ({ ...movie, score: scoreMovie(movie, normalizedMood, { genre, caster, year, minRating, query: q }) }))
    .filter((movie) => {
      const text = `${movie.title} ${movie.genres} ${movie.overview} ${movie.mood} ${movie.caster}`.toLowerCase();
      const queryMatch = !q || text.includes(q);
      const moodMatch = !normalizedMood || movie.mood === normalizedMood || scoreMovie(movie, normalizedMood) > 24;
      const genreMatch = !genre || movie.genres.toLowerCase().includes(genre.toLowerCase());
      const casterMatch = !caster || movie.caster.toLowerCase().includes(caster.toLowerCase());
      const yearMatch = !year || Number(movie.year) === Number(year);
      const ratingMatch = !minRating || (getDisplayRating(movie).hasRating && getDisplayRating(movie).value >= Number(minRating));
      return queryMatch && moodMatch && genreMatch && casterMatch && yearMatch && ratingMatch;
    });

  if (sort === 'rating') return results.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  if (sort === 'year') return results.sort((a, b) => Number(b.year || 0) - Number(a.year || 0));
  if (sort === 'title') return results.sort((a, b) => a.title.localeCompare(b.title));
  if (sort === 'popular') return results.sort((a, b) => (b.tmdb_popularity || b.vote_count || 0) - (a.tmdb_popularity || a.vote_count || 0));
  return results.sort((a, b) => b.score - a.score || (b.rating || 0) - (a.rating || 0));
}

export function buildDalilNote(selectedMood) {
  const mood = getMoodByKey(selectedMood);
  return `${mood.dalil}: "${mood.dalilText}"`;
}

export { normalizeMoodKey };
