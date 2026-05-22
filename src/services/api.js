import { normalizeTrailer } from '../utils/trailer';

export async function sendAimanMessage(message, history = [], options = {}) {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, history, ...options })
  });

  if (!response.ok) {
    throw new Error('AIMAN sedang tidak bisa dihubungi. Coba lagi sebentar lagi.');
  }

  return response.json();
}

export async function fetchTrailerUrl(movie) {
  const direct = normalizeTrailer({
    trailer_url: movie?.trailer_url || movie?.trailerUrl || movie?.raw?.trailer_url || movie?.raw?.trailer,
    trailer_embed_url: movie?.trailer_embed_url || movie?.trailerEmbedUrl || movie?.raw?.trailer_embed_url,
    trailer_key: movie?.trailer_key || movie?.raw?.trailer_key,
    trailer_name: movie?.trailer_name || movie?.raw?.trailer_name,
  });
  if (direct.hasTrailer) {
    return { ok: true, ...direct, source: 'data' };
  }

  const tmdbId = movie?.tmdbId || movie?.raw?.tmdbId || movie?.raw?.tmdb_id || movie?.raw?.tmdb;
  if (!tmdbId) {
    throw new Error('Trailer belum tersedia karena film ini belum punya tmdbId di data.');
  }

  const params = new URLSearchParams({
    title: movie?.title || movie?.raw?.title_asli || '',
    year: movie?.year || movie?.raw?.year || ''
  });
  const response = await fetch(`/api/trailer/${encodeURIComponent(tmdbId)}?${params.toString()}`);
  const data = await response.json().catch(() => ({}));
  const normalized = normalizeTrailer(data);
  if (!response.ok || !normalized.hasTrailer) {
    throw new Error(data.message || 'Trailer direct belum ditemukan.');
  }
  return { ...data, ...normalized };
}

export async function fetchTmdbRating(movie) {
  const tmdbId = movie?.tmdbId || movie?.raw?.tmdbId || movie?.raw?.tmdb_id || movie?.raw?.tmdb;
  if (!tmdbId) {
    throw new Error('Rating TMDB belum tersedia karena film ini belum punya tmdbId di data.');
  }

  const response = await fetch(`/api/rating/${encodeURIComponent(tmdbId)}`);
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.rating) {
    throw new Error(data.message || 'Rating TMDB belum ditemukan.');
  }
  return data;
}
