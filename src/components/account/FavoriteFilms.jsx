import useFavorites from '../../hooks/useFavorites';
import LazyPoster from '../LazyPoster';
import { FavoriteGridSkeleton } from '../Skeletons';
import { useLanguageCopy } from '../../utils/i18n';
import { getDisplayRating } from '../../utils/rating';

export default function FavoriteFilms() {
  const { favorites, toggleFavorite, loading } = useFavorites();
  const { text } = useLanguageCopy();
  const ui = text.ui;

  return (
    <section className="premium-card p-5 md:p-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="section-eyebrow">{ui.favorite}</p>
          <h2 className="mt-2 text-2xl font-black">{ui.myFavorites}</h2>
        </div>
        <span className="rounded-2xl bg-iim-gold/20 px-4 py-2 text-sm font-black">{favorites.length} film</span>
      </div>
      {loading && !favorites.length ? (
        <FavoriteGridSkeleton count={4} />
      ) : favorites.length ? (
        <div className="account-favorites-grid mt-5 grid gap-4">
          {favorites.map((movie) => {
            const ratingInfo = getDisplayRating(movie);
            return (
            <article key={movie.id} className="account-favorite-card">
              <a href={`#/film/${encodeURIComponent(movie.id)}${movie.mood ? `?mood=${movie.mood}` : ''}`} className="block overflow-hidden rounded-3xl bg-iim-sand/30">
                <LazyPoster
                  src={movie.poster}
                  alt={movie.title}
                  className="aspect-[2/3]"
                  fallback={<div className="grid aspect-[2/3] place-items-center text-4xl">🎬</div>}
                />
              </a>
              <div className="min-w-0 flex-1">
                <h3 className="line-clamp-2 text-lg font-black">{movie.title}</h3>
                <p className="mt-1 line-clamp-1 text-xs font-bold text-iim-brown dark:text-iim-sand">{movie.genres || 'Drama'} • {movie.year || '-'}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {movie.mood && <span className="rounded-full bg-iim-gold px-3 py-1 text-[11px] font-black text-iim-charcoal">{movie.mood}</span>}
                  {ratingInfo.hasRating && <span className="rounded-full bg-white/70 px-3 py-1 text-[11px] font-black text-iim-coffee dark:bg-white/10 dark:text-iim-cream">{ratingInfo.label}</span>}
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <a href={`#/film/${encodeURIComponent(movie.id)}${movie.mood ? `?mood=${movie.mood}` : ''}`} className="btn-primary min-w-[84px] flex-1 px-3 py-2 text-center text-xs">{ui.detail}</a>
                  <button type="button" onClick={() => toggleFavorite(movie, movie.mood)} className="btn-secondary min-w-[72px] px-3 py-2 text-xs">{ui.remove}</button>
                </div>
              </div>
            </article>
            );
          })}
        </div>
      ) : (
        <div className="mt-5 rounded-[1.5rem] border border-dashed border-iim-brown/20 bg-white/50 p-8 text-center dark:border-white/10 dark:bg-white/5">
          <p className="text-xl font-black">{ui.emptyFavoriteTitle}</p>
          <p className="mt-2 text-sm font-bold text-iim-brown dark:text-iim-sand">{ui.emptyFavoriteDesc}</p>
          <a href="#/mood" className="btn-primary mt-5 inline-flex">{ui.findRecommendation}</a>
        </div>
      )}
    </section>
  );
}
