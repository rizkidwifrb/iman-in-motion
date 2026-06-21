import { buildReason } from '../services/recommendationService';
import FavoriteButton from './FavoriteButton';
import LazyPoster from './LazyPoster';
import { getDisplayRating } from '../utils/rating';

export default function FilmCard({ movie, mood, animationDelay = 0 }) {
  const ratingInfo = getDisplayRating(movie);

  return (
    <a
      href={`#/film/${encodeURIComponent(movie.id)}${mood ? `?mood=${mood}` : ''}`}
      className="film-card film-card-readable premium-card group flex flex-col overflow-hidden"
      data-aos="fade-left"
      data-aos-delay={animationDelay}
    >
      <LazyPoster
        src={movie.poster}
        alt={movie.title}
        className="film-poster-hover film-poster-a4 relative overflow-hidden bg-iim-sand/30"
        imgClassName="transition duration-700 ease-out group-hover:scale-110"
      >
        <div className="film-poster-shine" aria-hidden="true" />
        <div className="film-rating absolute left-2 top-2 rounded-full bg-black/65 px-2.5 py-1 text-[11px] font-extrabold text-white backdrop-blur">{ratingInfo.hasRating ? `${ratingInfo.compact}${ratingInfo.sourceLabel ? ` ${ratingInfo.sourceLabel}` : ''}` : ratingInfo.compact}</div>
        <FavoriteButton movie={movie} mood={mood || movie.mood} className="absolute right-2 top-2" />
        {movie.mood && <div className="film-mood absolute bottom-2 left-2 rounded-full bg-iim-gold px-2.5 py-1 text-[10px] font-extrabold text-iim-charcoal">{movie.mood}</div>}
        {movie.hasTrailer && <div className="absolute bottom-2 right-2 rounded-full bg-black/65 px-2.5 py-1 text-[10px] font-extrabold text-white backdrop-blur">Trailer</div>}
      </LazyPoster>
      <div className="film-card-body film-card-readable-body flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="film-title line-clamp-2 text-base font-extrabold text-iim-coffee dark:text-iim-cream">{movie.title}</h3>
          <span className="film-year shrink-0 text-xs font-bold text-iim-brown dark:text-iim-sand">{movie.year || '-'}</span>
        </div>
        <p className="film-genre mt-2 line-clamp-2 text-xs font-semibold text-iim-brown dark:text-iim-sand">{movie.genres || 'Drama'}</p>
        {ratingInfo.hasRating && ratingInfo.lowVote && <p className="mt-2 text-[11px] font-bold text-iim-brown/70 dark:text-iim-sand/75">Data vote masih terbatas</p>}
        <p className="film-reason mt-3 line-clamp-3 text-sm leading-6 text-iim-brown/85 dark:text-iim-sand/85">{buildReason(movie, mood || movie.mood)}</p>
      </div>
    </a>
  );
}
