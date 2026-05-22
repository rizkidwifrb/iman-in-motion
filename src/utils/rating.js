function toFiniteNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  const normalized = typeof value === 'string' ? value.replace(',', '.').trim() : value;
  const number = Number(normalized);
  return Number.isFinite(number) ? number : null;
}

export function normalizeRatingValue(movie = {}) {
  const tmdbRating = toFiniteNumber(movie.tmdb_vote_average ?? movie.vote_average);
  if (tmdbRating && tmdbRating > 0) return Number(tmdbRating.toFixed(1));

  const rating = toFiniteNumber(movie.rating);
  if (rating && rating > 0) return Number(rating.toFixed(1));

  return null;
}

export function normalizeVoteCount(movie = {}) {
  const voteCount = toFiniteNumber(movie.vote_count ?? movie.voteCount ?? movie.rating_count);
  return voteCount && voteCount > 0 ? Math.round(voteCount) : 0;
}

export function getRatingConfidence(movie = {}) {
  const voteCount = normalizeVoteCount(movie);
  if (!voteCount) return 0;
  return Math.min(1, Math.log10(voteCount + 1) / 4);
}

export function getDisplayRating(movie = {}) {
  const value = normalizeRatingValue(movie);
  const voteCount = normalizeVoteCount(movie);
  const source = String(movie.rating_source || movie.ratingSource || '').trim();
  const isTmdb = source.toLowerCase() === 'tmdb' || toFiniteNumber(movie.tmdb_vote_average ?? movie.vote_average) > 0;

  if (!value) {
    return {
      hasRating: false,
      value: null,
      rating: '',
      label: 'Belum ada rating',
      compact: 'Belum ada rating',
      sourceLabel: '',
      voteLabel: '',
      lowVote: false,
      confidence: 0,
    };
  }

  const rating = value.toFixed(1);

  return {
    hasRating: true,
    value,
    rating,
    label: `★ ${rating}/10${isTmdb ? ' TMDB' : ''}`,
    compact: `★ ${rating}`,
    sourceLabel: isTmdb ? 'TMDB' : (source || 'Data'),
    voteLabel: voteCount > 0 ? `${voteCount.toLocaleString('id-ID')} vote` : '',
    lowVote: voteCount > 0 && voteCount < 25,
    confidence: getRatingConfidence(movie),
  };
}
