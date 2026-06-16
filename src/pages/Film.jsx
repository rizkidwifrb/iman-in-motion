import { useMemo, useEffect, useRef, useState } from 'react';
import FilmCard from '../components/FilmCard';
import { FilmGridSkeleton } from '../components/Skeletons';
import SectionTitle from '../components/SectionTitle';
import { MOODS, buildDalilNote, getCasters, getGenres, getMoodByKey, getYears, searchMovies } from '../services/recommendationService';
import useMoodStats from '../hooks/useMoodStats';
import { useLanguageCopy } from '../utils/i18n';

function getInitialMood() {
  const params = new URLSearchParams(window.location.hash.split('?')[1] || '');
  return params.get('mood') || '';
}

export default function Film() {
  const [query, setQuery] = useState('');
  const [mood, setMood] = useState(getInitialMood());
  const [genre, setGenre] = useState('');
  const [caster, setCaster] = useState('');
  const [year, setYear] = useState('');
  const [minRating, setMinRating] = useState('');
  const [sort, setSort] = useState('recommended');
  const [gridLoading, setGridLoading] = useState(true);
  const [page, setPage] = useState(1);
  const perPage = 24;
  const { text } = useLanguageCopy();
  const ui = text.ui;
  const genres = useMemo(() => getGenres(), []);
  const casters = useMemo(() => getCasters(), []);
  const years = useMemo(() => getYears(), []);
  const { trackMood } = useMoodStats();
  const lastTrackedMood = useRef('');
  const movies = useMemo(() => searchMovies({ query, mood, genre, caster, year, minRating, sort }), [query, mood, genre, caster, year, minRating, sort]);
  const totalPages = Math.max(1, Math.ceil(movies.length / perPage));
  const visibleMovies = useMemo(() => {
    const start = (page - 1) * perPage;
    return movies.slice(start, start + perPage);
  }, [movies, page, perPage]);
  const selectedMood = mood ? getMoodByKey(mood) : null;

  useEffect(() => {
    setPage(1);
    setGridLoading(true);
    const timer = window.setTimeout(() => setGridLoading(false), 220);
    return () => window.clearTimeout(timer);
  }, [query, mood, genre, caster, year, minRating, sort]);

  useEffect(() => {
    if (!mood || lastTrackedMood.current === mood) return;
    lastTrackedMood.current = mood;
    trackMood(mood, { source: 'film_filter', movieCount: movies.length });
  }, [mood, movies.length, trackMood]);

  return (
    <section className="container-page py-12 md:py-16">
      <SectionTitle eyebrow={ui.filmEyebrow} title={ui.filmTitle} description={ui.filmDesc} />

      <div className="film-filter-card premium-card mb-8 grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-[1.35fr_0.82fr_0.9fr_0.9fr_0.72fr_0.72fr_0.78fr]" data-aos="fade-left">
        <input className="input-premium" placeholder={ui.searchFilm} value={query} onChange={(e) => setQuery(e.target.value)} />
        <select className="input-premium select-premium" value={mood} onChange={(e) => setMood(e.target.value)}>
          <option value="">{ui.allMood}</option>
          {MOODS.map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}
        </select>
        <select className="input-premium select-premium" value={genre} onChange={(e) => setGenre(e.target.value)}>
          <option value="">{ui.allGenre}</option>
          {genres.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select className="input-premium select-premium" value={caster} onChange={(e) => setCaster(e.target.value)}>
          <option value="">Semua pemeran</option>
          {casters.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select className="input-premium select-premium" value={year} onChange={(e) => setYear(e.target.value)}>
          <option value="">Semua tahun</option>
          {years.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select className="input-premium select-premium" value={minRating} onChange={(e) => setMinRating(e.target.value)}>
          <option value="">Semua rating</option>
          <option value="8">8.0+</option>
          <option value="7">7.0+</option>
          <option value="6">6.0+</option>
        </select>
        <select className="input-premium select-premium" value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="recommended">{ui.recommended}</option>
          <option value="rating">{ui.rating}</option>
          <option value="year">{ui.year}</option>
          <option value="title">{ui.titleSort}</option>
          <option value="popular">Popularitas</option>
        </select>
      </div>

      {selectedMood && (
        <div className="film-mood-note premium-card mb-8 grid gap-4 p-5 md:grid-cols-[auto_1fr_auto] md:items-center" data-aos="fade-left">
          <div className="grid h-14 w-14 place-items-center rounded-3xl bg-iim-gold/20 text-3xl">{selectedMood.icon}</div>
          <div>
            <p className="text-sm font-extrabold uppercase tracking-[0.22em] text-iim-brown dark:text-iim-gold">Mood {selectedMood.label}</p>
            <p className="mt-2 font-bold leading-7">{buildDalilNote(selectedMood.key)}</p>
            <p className="mt-1 text-sm leading-7 text-iim-brown dark:text-iim-sand">{selectedMood.reflection}</p>
          </div>
          <a href={`#/aiman?mood=${selectedMood.key}`} className="btn-primary">{ui.askAiman}</a>
        </div>
      )}

      <div className="film-result-bar mb-6 flex items-center justify-between gap-3">
        <p className="text-sm font-bold text-iim-brown dark:text-iim-sand">{ui.showingFilms.replace('{count}', visibleMovies.length)} dari {movies.length}</p>
        {mood && <a href={`#/mood`} className="btn-secondary">{ui.changeMood}</a>}
      </div>

      {gridLoading ? (
        <FilmGridSkeleton count={12} />
      ) : movies.length ? (
        <>
          <div className="film-library-grid grid grid-cols-4 gap-2 md:gap-4">
            {visibleMovies.map((movie, index) => <FilmCard key={movie.id} movie={movie} mood={mood} animationDelay={(index % 12) * 35} />)}
          </div>
          {totalPages > 1 && (
            <div className="iim-pagination">
              <button type="button" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page === 1}>Sebelumnya</button>
              <span>Halaman {page} / {totalPages}</span>
              <button type="button" onClick={() => setPage((value) => Math.min(totalPages, value + 1))} disabled={page === totalPages}>Berikutnya</button>
            </div>
          )}
        </>
      ) : (
        <div className="premium-card p-10 text-center">
          <p className="text-2xl font-extrabold">{ui.filmNotFound}</p>
          <p className="mt-3 text-iim-brown dark:text-iim-sand">{ui.tryOtherFilm}</p>
        </div>
      )}
    </section>
  );
}
