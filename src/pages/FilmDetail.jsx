import { useEffect, useState } from 'react';
import FavoriteButton from '../components/FavoriteButton';
import { addActivity } from '../utils/accountStorage';
import { buildDalilNote, buildReason, getMovieById, getMoodByKey } from '../services/recommendationService';
import { fetchTmdbRating, fetchTrailerUrl } from '../services/api';
import { getDisplayRating } from '../utils/rating';
import { normalizeTrailer } from '../utils/trailer';

export default function FilmDetail({ path }) {
  const [rawId, search = ''] = path.replace('/film/', '').split('?');
  const params = new URLSearchParams(search);
  const moodKey = params.get('mood') || '';
  const movie = getMovieById(decodeURIComponent(rawId || ''));
  const mood = getMoodByKey(moodKey || movie?.mood);
  const [trailer, setTrailer] = useState(null);
  const [trailerStatus, setTrailerStatus] = useState('idle');
  const [liveRating, setLiveRating] = useState(null);
  const [ratingStatus, setRatingStatus] = useState('idle');

  useEffect(() => {
    if (movie) addActivity('film_opened', { movieId: movie.id, title: movie.title, mood: mood.key });
  }, [movie?.id]);

  useEffect(() => {
    let active = true;
    setTrailer(null);
    setTrailerStatus('idle');
    if (!movie) return undefined;

    async function loadTrailer() {
      try {
        setTrailerStatus('loading');
        const data = await fetchTrailerUrl(movie);
        if (!active) return;
        setTrailer(data);
        setTrailerStatus('ready');
      } catch {
        if (!active) return;
        setTrailerStatus('missing');
      }
    }

    loadTrailer();
    return () => {
      active = false;
    };
  }, [movie?.id]);

  useEffect(() => {
    let active = true;
    setLiveRating(null);
    setRatingStatus('idle');
    if (!movie?.tmdbId) return undefined;

    async function loadRating() {
      try {
        setRatingStatus('loading');
        const data = await fetchTmdbRating(movie);
        if (!active) return;
        setLiveRating(data);
        setRatingStatus('ready');
      } catch {
        if (!active) return;
        setRatingStatus('fallback');
      }
    }

    if (movie.rating_source === 'TMDB' && movie.vote_count) {
      setRatingStatus('ready');
      return undefined;
    }

    loadRating();
    return () => {
      active = false;
    };
  }, [movie?.id, movie?.tmdbId]);

  if (!movie) {
    return (
      <section className="container-page py-16">
        <div className="premium-card p-8 text-center">
          <h1 className="text-3xl font-black">Film tidak ditemukan</h1>
          <a href="#/film" className="btn-primary mt-6">Kembali ke Film</a>
        </div>
      </section>
    );
  }

  const ratingInfo = getDisplayRating(liveRating ? { ...movie, ...liveRating } : movie);
  const trailerInfo = normalizeTrailer(trailer || movie);
  const genres = (movie.genreList?.length ? movie.genreList : String(movie.genres || '').split(/[|,]/)).map((item) => String(item).trim()).filter(Boolean);
  const cast = Array.isArray(movie.caster) ? movie.caster.join(', ') : movie.caster;

  return (
    <section className="container-page py-12 md:py-16">
      <div className="relative mb-8 overflow-hidden rounded-[2rem] border border-white/10 bg-iim-charcoal/85 p-6 text-iim-cream shadow-premium md:p-8">
        {movie.backdrop && <img src={movie.backdrop} alt="" className="absolute inset-0 h-full w-full object-cover opacity-28" />}
        <div className="absolute inset-0 bg-gradient-to-r from-iim-charcoal via-iim-charcoal/90 to-iim-charcoal/45" />
        <div className="relative max-w-4xl">
          <p className="section-eyebrow text-iim-gold">Detail film</p>
          <h1 className="mt-4 text-4xl font-black leading-tight md:text-6xl">{movie.title}</h1>
          <p className="mt-4 max-w-3xl text-sm font-semibold leading-7 text-iim-sand md:text-base">{buildReason(movie, mood.key)}</p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[0.78fr_1.22fr]">
        <div className="premium-card overflow-hidden p-3">
          {movie.poster ? (
            <img src={movie.poster} alt={movie.title} className="h-full min-h-[520px] w-full rounded-[1.6rem] object-cover" />
          ) : (
            <div className="grid min-h-[520px] place-items-center rounded-[1.6rem] bg-iim-coffee/10 text-sm font-black">Poster belum tersedia</div>
          )}
        </div>

        <div>
          <div className="flex flex-wrap gap-3">
            {movie.year && <span className="rounded-full bg-white/60 px-4 py-2 text-sm font-extrabold text-iim-brown dark:bg-white/10 dark:text-iim-sand">{movie.year}</span>}
            <span className="rounded-full bg-iim-gold px-4 py-2 text-sm font-extrabold text-iim-charcoal">{ratingInfo.label}</span>
            <span className="rounded-full bg-white/60 px-4 py-2 text-sm font-extrabold text-iim-brown dark:bg-white/10 dark:text-iim-sand">{mood.label}</span>
            {trailerInfo.hasTrailer && <span className="rounded-full bg-emerald-500/15 px-4 py-2 text-sm font-extrabold text-emerald-700 dark:text-emerald-200">Trailer tersedia</span>}
            <FavoriteButton movie={movie} mood={mood.key} className="static h-10 w-10" />
          </div>

          <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold text-iim-brown/70 dark:text-iim-sand/80">
            {ratingInfo.hasRating && ratingInfo.voteLabel && <span>{ratingInfo.voteLabel}</span>}
            {ratingInfo.hasRating && ratingInfo.lowVote && <span>Data vote masih terbatas</span>}
            {ratingStatus === 'loading' && <span>Sinkron rating TMDB...</span>}
            {movie.tmdbId && <span>TMDB ID: {movie.tmdbId}</span>}
          </div>

          <div className="premium-card mt-7 p-6">
            <h2 className="text-xl font-black">Sinopsis</h2>
            <p className="mt-3 leading-8 text-iim-brown dark:text-iim-sand">{movie.overview}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {genres.slice(0, 5).map((genre) => (
                <span key={genre} className="rounded-full border border-iim-gold/20 bg-iim-gold/10 px-3 py-1 text-xs font-black text-iim-brown dark:text-iim-sand">{genre}</span>
              ))}
            </div>
            {cast && (
              <div className="mt-5">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-iim-brown dark:text-iim-gold">Pemeran</p>
                <p className="mt-2 text-sm font-semibold leading-7 text-iim-brown dark:text-iim-sand">{cast}</p>
              </div>
            )}
            <div className="mt-5 flex flex-wrap items-center gap-3">
              {trailerInfo.hasTrailer ? (
                <button
                  type="button"
                  onClick={() => {
                    addActivity('trailer_played_inline', { movieId: movie.id, title: movie.title, trailer: trailerInfo.trailer_url });
                    document.getElementById('filmTrailerPlayer')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }}
                  className="btn-primary"
                >
                  Putar Trailer di Web
                </button>
              ) : (
                <button type="button" disabled className="btn-secondary cursor-not-allowed opacity-70">
                  {trailerStatus === 'loading' ? 'Mencari trailer...' : 'Trailer belum tersedia'}
                </button>
              )}
              {trailerInfo.hasTrailer && trailerInfo.trailer_url && (
                <a href={trailerInfo.trailer_url} target="_blank" rel="noreferrer" className="text-xs font-black text-iim-brown underline-offset-4 hover:underline dark:text-iim-gold">Buka di YouTube</a>
              )}
            </div>
          </div>

          {trailerInfo.hasTrailer ? (
            <div id="filmTrailerPlayer" className="premium-card mt-5 overflow-hidden p-3">
              <div className="aspect-video overflow-hidden rounded-[1.4rem] bg-black">
                <iframe
                  title={`Trailer ${movie.title}`}
                  src={trailerInfo.trailer_embed_url}
                  className="h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="strict-origin-when-cross-origin"
                />
              </div>
            </div>
          ) : (
            <div className="premium-card mt-5 p-6 text-center">
              <h2 className="text-xl font-black">Trailer belum tersedia untuk film ini.</h2>
              <p className="mt-2 text-sm font-semibold text-iim-brown dark:text-iim-sand">
                {trailerStatus === 'loading' ? 'Sedang mengecek data trailer...' : 'Tidak ada iframe kosong yang ditampilkan.'}
              </p>
            </div>
          )}

          <div className="premium-card mt-5 p-6">
            <h2 className="text-xl font-black">Alasan rekomendasi</h2>
            <p className="mt-3 leading-8 font-semibold">{buildReason(movie, mood.key)}</p>
            <div className="mt-5 rounded-3xl bg-iim-gold/15 p-5">
              <p className="text-sm font-extrabold text-iim-brown dark:text-iim-gold">Dalil/refleksi mood {mood.label}</p>
              <p className="mt-2 leading-7 font-bold">{buildDalilNote(mood.key)}</p>
              <p className="mt-2 text-sm leading-7 text-iim-brown dark:text-iim-sand">{mood.reflection}</p>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <a href={`#/aiman?film=${encodeURIComponent(movie.title)}&mood=${mood.key}`} className="btn-primary">Tanya AIMAN tentang film ini</a>
            <a href="#/film" className="btn-secondary">Kembali ke daftar film</a>
          </div>
        </div>
      </div>
    </section>
  );
}
