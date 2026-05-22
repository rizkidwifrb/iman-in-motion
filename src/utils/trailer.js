const YOUTUBE_KEY_PATTERN = /^[a-zA-Z0-9_-]{6,}$/;

export function extractYouTubeKey(value = '') {
  const url = String(value || '').trim();
  if (!url || url.includes('search_query') || url.includes('/results')) return '';

  const watchMatch = url.match(/[?&]v=([^&]+)/);
  const shortMatch = url.match(/youtu\.be\/([^?&/]+)/);
  const embedMatch = url.match(/youtube\.com\/embed\/([^?&/]+)/);
  const key = decodeURIComponent(watchMatch?.[1] || shortMatch?.[1] || embedMatch?.[1] || '').trim();

  return YOUTUBE_KEY_PATTERN.test(key) ? key : '';
}

export function isValidYouTubeWatchUrl(value = '') {
  const url = String(value || '').trim();
  return /^https:\/\/(www\.)?youtube\.com\/watch\?/.test(url) && Boolean(extractYouTubeKey(url));
}

export function isValidYouTubeEmbedUrl(value = '') {
  const url = String(value || '').trim();
  return /^https:\/\/www\.youtube\.com\/embed\/[a-zA-Z0-9_-]+/.test(url) && Boolean(extractYouTubeKey(url));
}

export function normalizeTrailer(movie = {}) {
  const key = String(movie.trailer_key || movie.trailerKey || '').trim() || extractYouTubeKey(movie.trailer_embed_url || movie.trailer_url || movie.trailer || movie.trailerUrl);
  if (!key) {
    return {
      hasTrailer: false,
      trailer_url: '',
      trailer_embed_url: '',
      trailer_key: '',
      trailer_name: '',
    };
  }

  return {
    hasTrailer: true,
    trailer_url: `https://www.youtube.com/watch?v=${key}`,
    trailer_embed_url: `https://www.youtube.com/embed/${key}`,
    trailer_key: key,
    trailer_name: movie.trailer_name || movie.trailerName || 'Official Trailer',
  };
}
