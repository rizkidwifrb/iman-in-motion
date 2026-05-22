const FALLBACK_POSTER = 'https://placehold.co/400x600/0d1413/b9d4ce?text=No+Poster';

export const SUPPORTED_MOODS = ['sedih', 'gelisah', 'hidayah', 'bahagia', 'marah', 'rindu'];

// Legacy dataset labels are normalized here so the UI only exposes six moods.
const INTERNAL_MOOD_MAP = {
  sedih: ['sedih', 'tenang'],
  gelisah: ['gelisah', 'tenang'],
  hidayah: ['hidayah', 'inspiratif', 'mencari-hidayah'],
  bahagia: ['bahagia', 'semangat'],
  marah: ['marah'],
  rindu: ['rindu', 'tenang']
};

const MOOD_TERMS = {
  sedih: ['sedih', 'kehilangan', 'duka', 'sabar', 'harapan', 'luka'],
  gelisah: ['gelisah', 'takut', 'cemas', 'tenang', 'konflik', 'perjalanan'],
  hidayah: ['hidayah', 'iman', 'taubat', 'petunjuk', 'quran', 'faith'],
  bahagia: ['bahagia', 'syukur', 'keluarga', 'komedi', 'hope', 'joy'],
  marah: ['marah', 'adil', 'perjuangan', 'ketidakadilan', 'war', 'crime'],
  rindu: ['rindu', 'cinta', 'keluarga', 'romance', 'memory', 'home']
};

const canonicalMood = (mood = '') => {
  const value = String(mood || '').toLowerCase().trim();
  if (SUPPORTED_MOODS.includes(value)) return value;
  if (value === 'inspiratif' || value === 'mencari-hidayah') return 'hidayah';
  if (value === 'semangat') return 'bahagia';
  if (value === 'tenang') return 'gelisah';
  return value || 'gelisah';
};

const escapeHtml = (value = '') => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const searchableText = (movie) => [
  movie.title_asli,
  movie.title,
  movie.genres,
  movie.overview,
  movie.reason,
  movie.mood,
  movie.category,
  ...(Array.isArray(movie.tags) ? movie.tags : [])
].filter(Boolean).join(' ').toLowerCase();

export function scoreMovie(movie, selectedMood, query = '') {
  const mood = canonicalMood(selectedMood);
  const aliases = INTERNAL_MOOD_MAP[mood] || [mood];
  const rawMood = String(movie.mood || movie.category || '').toLowerCase().trim();
  const text = searchableText(movie);
  const queryText = String(query || '').toLowerCase().trim();

  const directMoodHit = canonicalMood(rawMood) === mood;
  const aliasHit = aliases.includes(rawMood);
  const termHits = (MOOD_TERMS[mood] || []).filter((term) => text.includes(term)).length;
  const rating = Math.min(Number(movie.rating || 0) / 10, 1) || 0;
  const year = Number(movie.year || 0);
  const yearScore = year ? Math.min(Math.max((year - 1990) / 40, 0), 1) : 0.2;
  const queryScore = queryText && text.includes(queryText) ? 1 : 0;

  return (directMoodHit ? 0.46 : 0)
    + (aliasHit && !directMoodHit ? 0.32 : 0)
    + Math.min(termHits * 0.055, 0.18)
    + (rating * 0.22)
    + (yearScore * 0.09)
    + (queryScore * 0.18);
}

export function filterAndSortMovies(movies, selectedMood, query, sortBy = 'score') {
  const normalizedQuery = String(query || '').toLowerCase().trim();
  const mood = canonicalMood(selectedMood);
  const aliases = INTERNAL_MOOD_MAP[mood] || [mood];

  let filtered = movies.filter((movie) => {
    const rawMood = String(movie.mood || movie.category || '').toLowerCase().trim();
    const text = searchableText(movie);
    const moodMatch = canonicalMood(rawMood) === mood || aliases.includes(rawMood);
    const textMatch = !normalizedQuery || text.includes(normalizedQuery);
    return moodMatch && textMatch;
  });

  filtered = filtered.map((movie) => ({ ...movie, __score: scoreMovie(movie, mood, normalizedQuery) }));
  if (sortBy === 'rating') filtered.sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0));
  else if (sortBy === 'year') filtered.sort((a, b) => Number(b.year || 0) - Number(a.year || 0));
  else filtered.sort((a, b) => b.__score - a.__score);
  return filtered;
}

export function movieCardTemplate(movie, selectedMood) {
  const title = movie.title_asli || movie.title || 'Tanpa Judul';
  const poster = movie.poster_url || movie.poster || FALLBACK_POSTER;
  const year = movie.year || '-';
  const genres = movie.genres || movie.genre || 'Drama';
  const rating = Number(movie.rating || movie.vote_average || movie.tmdb_vote_average || 0) || 0;
  const ratingSource = String(movie.rating_source || '').toLowerCase() === 'tmdb' || Number(movie.tmdb_vote_average || 0) > 0 ? ' TMDB' : '';
  const ratingLabel = rating > 0 ? `★ ${rating.toFixed(1)}/10${ratingSource}` : 'Belum ada rating';
  const reason = movie.reason || `Cocok untuk fase ${selectedMood} dengan tema yang reflektif.`;

  return `
    <article class="movie-card" tabindex="0" role="button" aria-label="Lihat detail ${escapeHtml(title)}">
      <img class="movie-poster" src="${escapeHtml(poster)}" alt="Poster ${escapeHtml(title)}" loading="lazy" onerror="this.src='${FALLBACK_POSTER}'">
      <div class="movie-info">
        <h3 class="movie-title">${escapeHtml(title)}</h3>
        <div class="movie-meta">
          <span>${escapeHtml(year)}</span>
          <span>${escapeHtml(String(genres).split('|')[0].trim())}</span>
          <span>${escapeHtml(ratingLabel)}</span>
        </div>
        <div class="movie-meta" style="margin-top:6px">
          <span class="chip">Mood: ${escapeHtml(selectedMood)}</span>
        </div>
        <p class="reason">${escapeHtml(reason)}</p>
      </div>
    </article>
  `;
}

export function skeletonTemplate(count = 8) {
  return Array.from({ length: count }).map(() => '<div class="skeleton" aria-hidden="true"></div>').join('');
}

export function emptyTemplate() {
  return `
    <div style="grid-column:1/-1;padding:26px;border:1px dashed var(--border);border-radius:16px;text-align:center;color:var(--muted)">
      <p style="margin:0 0 6px;font-weight:700">Belum ada film yang cocok.</p>
      <p style="margin:0">Coba ubah mood, kata kunci, atau urutan sortir.</p>
    </div>
  `;
}