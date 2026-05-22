import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const srcPath = path.join(root, 'src', 'data', 'movies.js');
const publicPath = path.join(root, 'public', 'js', 'movies.js');
const csvPath = path.join(root, 'df_processed.csv');

const moodMap = {
  sedih: 'sedih',
  gelisah: 'gelisah',
  tenang: 'gelisah',
  hidayah: 'hidayah',
  inspiratif: 'hidayah',
  semangat: 'hidayah',
  bahagia: 'bahagia',
  marah: 'marah',
  rindu: 'rindu',
};

const fields = [
  'tmdbId',
  'title_asli',
  'title',
  'title_en',
  'year',
  'genres',
  'keywords',
  'caster',
  'cast',
  'country',
  'original_language',
  'poster_url',
  'backdrop_url',
  'overview',
  'rating',
  'rating_count',
  'vote_count',
  'rating_source',
  'rating_updated_at',
  'tmdb_vote_average',
  'tmdb_popularity',
  'tmdb_status',
  'mood',
  'trailer_url',
  'trailer_embed_url',
  'trailer_key',
  'trailer_name',
];

function numberOrNull(value) {
  if (value === null || value === undefined || value === '') return null;
  const number = Number(String(value).replace(',', '.'));
  return Number.isFinite(number) && number > 0 ? Number(number.toFixed(1)) : null;
}

function intOrZero(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? Math.round(number) : 0;
}

function extractYouTubeKey(value = '') {
  const url = String(value || '').trim();
  if (!url || url.includes('search_query') || url.includes('/results')) return '';
  const key = url.match(/[?&]v=([^&]+)/)?.[1] || url.match(/youtu\.be\/([^?&/]+)/)?.[1] || url.match(/youtube\.com\/embed\/([^?&/]+)/)?.[1] || '';
  return /^[a-zA-Z0-9_-]{6,}$/.test(key) ? key : '';
}

function normalizeMovie(movie) {
  const title = String(movie.title_asli || movie.title || movie.title_en || 'Tanpa Judul').trim();
  const mood = moodMap[String(movie.mood || '').toLowerCase().trim()] || 'hidayah';
  const rating = numberOrNull(movie.tmdb_vote_average) || numberOrNull(movie.rating);
  const key = String(movie.trailer_key || '').trim() || extractYouTubeKey(movie.trailer_embed_url || movie.trailer_url);

  return {
    ...movie,
    title_asli: title,
    title: movie.title || title,
    year: movie.year ? Number(movie.year) || null : null,
    genres: movie.genres || '',
    poster_url: movie.poster_url || movie.poster || '',
    backdrop_url: movie.backdrop_url || movie.backdrop || movie.poster_url || movie.poster || '',
    overview: movie.overview || 'Sinopsis belum tersedia.',
    rating,
    vote_count: intOrZero(movie.vote_count || movie.rating_count),
    rating_source: rating && String(movie.rating_source || '').toUpperCase() === 'TMDB' ? 'TMDB' : (rating ? (movie.rating_source || 'fallback') : ''),
    rating_updated_at: movie.rating_updated_at || '',
    tmdb_vote_average: numberOrNull(movie.tmdb_vote_average),
    tmdb_popularity: Number(movie.tmdb_popularity || 0) || 0,
    tmdb_status: movie.tmdb_status || '',
    tmdbId: movie.tmdbId || movie.tmdb_id || movie.tmdb || '',
    mood,
    trailer_url: key ? `https://www.youtube.com/watch?v=${key}` : '',
    trailer_embed_url: key ? `https://www.youtube.com/embed/${key}` : '',
    trailer_key: key,
    trailer_name: key ? (movie.trailer_name || 'Official Trailer') : '',
    caster: movie.caster || movie.cast || '',
  };
}

function csvEscape(value) {
  if (value === null || value === undefined) return '';
  const text = Array.isArray(value) ? value.join(', ') : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

const moduleUrl = `${pathToFileURL(srcPath).href}?t=${Date.now()}`;
const imported = await import(moduleUrl);
const sourceMovies = imported.default || imported.movies || [];
const seen = new Set();
const movies = sourceMovies.map(normalizeMovie).filter((movie) => {
  const key = `${movie.title_asli.toLowerCase()}|${movie.year || ''}`;
  if (seen.has(key)) return false;
  seen.add(key);
  return true;
});

const json = JSON.stringify(movies, null, 2);
fs.writeFileSync(srcPath, `export const movies = ${json};\nexport default movies;\n`);
fs.writeFileSync(publicPath, `window.MOVIES_DATA = ${json};\n`);
fs.writeFileSync(csvPath, `${fields.join(',')}\n${movies.map((movie) => fields.map((field) => csvEscape(movie[field])).join(',')).join('\n')}\n`);

console.log(`Synced ${movies.length} movies.`);
console.log(`Source: ${path.relative(root, srcPath)}`);
console.log(`Updated: ${path.relative(root, publicPath)}, ${path.relative(root, csvPath)}`);
