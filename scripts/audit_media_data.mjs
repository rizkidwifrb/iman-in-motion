import movies from '../src/data/movies.js';

function validRating(movie) {
  const value = Number(movie.tmdb_vote_average || movie.rating);
  return Number.isFinite(value) && value > 0;
}

function validEmbed(url = '') {
  return /^https:\/\/www\.youtube\.com\/embed\/[a-zA-Z0-9_-]+/.test(String(url || ''));
}

const audit = movies.reduce((acc, movie) => {
  acc.total += 1;
  if (validRating(movie)) acc.validRating += 1;
  else acc.missingRating += 1;
  if (movie.rating === 0 || movie.rating === '0' || movie.tmdb_vote_average === 0 || movie.tmdb_vote_average === '0') acc.zeroRating += 1;
  if (String(movie.rating_source || '').toUpperCase() === 'TMDB') acc.tmdbRating += 1;
  if (Number(movie.vote_count || 0) > 0) acc.withVoteCount += 1;

  const trailerUrl = String(movie.trailer_url || '');
  const embedUrl = String(movie.trailer_embed_url || '');
  if (validEmbed(embedUrl)) acc.validTrailer += 1;
  else if (!trailerUrl && !embedUrl) acc.missingTrailer += 1;
  else acc.invalidTrailer += 1;
  if (trailerUrl.includes('search_query') || trailerUrl.includes('/results')) acc.searchUrls += 1;
  return acc;
}, {
  total: 0,
  validRating: 0,
  missingRating: 0,
  tmdbRating: 0,
  withVoteCount: 0,
  zeroRating: 0,
  validTrailer: 0,
  missingTrailer: 0,
  invalidTrailer: 0,
  searchUrls: 0,
});

console.table(audit);
