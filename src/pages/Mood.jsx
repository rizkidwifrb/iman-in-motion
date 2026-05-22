import { useEffect, useMemo, useRef, useState } from 'react';
import FilmCard from '../components/FilmCard';
import { MoodFilmGridSkeleton } from '../components/Skeletons';
import { MOODS, getGenres, getMoodByKey, searchMovies } from '../services/recommendationService';
import useMoodStats from '../hooks/useMoodStats';
import { useLanguageCopy } from '../utils/i18n';

function getInitialMood() {
  const params = new URLSearchParams(window.location.hash.split('?')[1] || '');
  return (params.get('mood') || localStorage.getItem('iman_last_mood') || 'sedih').toLowerCase();
}

export default function Mood() {
  const [currentMood, setCurrentMood] = useState(getInitialMood());
  const [query, setQuery] = useState('');
  const [genre, setGenre] = useState('');
  const [sort, setSort] = useState('recommended');
  const [menuOpen, setMenuOpen] = useState(false);
  const [gridLoading, setGridLoading] = useState(true);
  const [page, setPage] = useState(1);
  const perPage = 18;
  const { text } = useLanguageCopy();
  const ui = text.ui;
  const genres = useMemo(() => getGenres(), []);
  const { trackMood } = useMoodStats();
  const trackedInitial = useRef('');
  const mood = getMoodByKey(currentMood);

  useEffect(() => {
    const syncFromHash = () => {
      const next = getInitialMood();
      if (next && next !== currentMood) setCurrentMood(next);
    };
    window.addEventListener('hashchange', syncFromHash);
    return () => window.removeEventListener('hashchange', syncFromHash);
  }, [currentMood]);

  const moodStyle = {
    '--mood-accent': mood.color,
    '--mood-accent-2': mood.color2,
    '--mood-soft': mood.glow,
    '--mood-bg': `radial-gradient(900px 520px at 20% -10%, ${mood.color}55, transparent 62%), radial-gradient(760px 480px at 96% 6%, ${mood.color2}22, transparent 58%), #030505`
  };

  const movies = useMemo(() => {
    return searchMovies({ query, mood: currentMood, genre, sort });
  }, [query, currentMood, genre, sort]);

  const totalPages = Math.max(1, Math.ceil(movies.length / perPage));
  const visibleMovies = useMemo(() => {
    const start = (page - 1) * perPage;
    return movies.slice(start, start + perPage);
  }, [movies, page, perPage]);

  useEffect(() => {
    setPage(1);
    setGridLoading(true);
    const timer = window.setTimeout(() => setGridLoading(false), 240);
    return () => window.clearTimeout(timer);
  }, [query, currentMood, genre, sort]);

  useEffect(() => {
    if (trackedInitial.current === currentMood) return;
    trackedInitial.current = currentMood;
    trackMood(currentMood, { movieCount: movies.length });
  }, [currentMood, movies.length, trackMood]);

  function chooseMood(key) {
    setCurrentMood(key);
    setMenuOpen(false);
    localStorage.setItem('iman_last_mood', key);
    window.history.replaceState(null, '', `#/mood?mood=${encodeURIComponent(key)}`);
  }

  return (
    <section className="mood-shell" style={moodStyle}>
      <aside className="mood-sidebar">
        <div className="mood-sidebar-top">
          <div className="flex items-center gap-2 text-sm font-extrabold text-white/70">
            <a href="#/" className="rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 transition hover:border-[var(--mood-accent)] hover:text-[var(--mood-accent)]">{ui.moodBack}</a>
            <a href="#/articles" className="rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 transition hover:border-[var(--mood-accent)] hover:text-[var(--mood-accent)]">Artikel</a>
          </div>

          <div className="mt-5 flex items-center gap-3">
            <button
              type="button"
              className="mood-menu-button"
              onClick={() => setMenuOpen((value) => !value)}
              aria-label="Mood menu"
            >
              {menuOpen ? '×' : '☰'}
            </button>
            <a href="#/" className="flex min-w-0 items-center gap-3">
              <img src="/logo.png" alt="IMAN IN MOTION" className="h-11 w-11 rounded-2xl bg-white object-contain p-1" />
              <div className="min-w-0">
                <p className="truncate text-sm font-black tracking-[0.18em] text-white">IMAN IN MOTION</p>
                <p className="truncate text-xs font-semibold text-white/55">{ui.moodToFilm}</p>
              </div>
            </a>
          </div>
        </div>

        <div className={`mood-button-list ${menuOpen ? 'open' : ''}`}>
          {MOODS.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => chooseMood(item.key)}
              className={`mood-side-button ${item.key === currentMood ? 'active' : ''}`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="mood-button-copy">
                <strong>{item.label}</strong>
                <small>{item.message}</small>
              </span>
            </button>
          ))}
        </div>
      </aside>

      <main className="mood-main">
        <section className="mood-dalil-box" data-aos="fade-left">
          <span className="mood-badge">{ui.dalilForYou}</span>
          <h1>{mood.title}</h1>
          <p className="max-w-3xl text-base font-semibold leading-8 text-white/62">{mood.description}</p>
          <div className="mood-arabic">{mood.arabic}</div>
          <p className="mt-4 max-w-4xl text-lg font-semibold leading-8 text-white/72">
            {mood.dalilText} <span className="font-black text-[var(--mood-accent)]">({mood.dalil})</span>
          </p>
        </section>

        <section className="mood-toolbar" data-aos="fade-left" data-aos-delay="80">
          <input value={query} onChange={(e) => setQuery(e.target.value)} type="search" placeholder={ui.searchFilm} />
          <select className="select-premium" value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="recommended">{ui.bestRecommendation}</option>
            <option value="rating">{ui.topRating}</option>
            <option value="year">{ui.newest}</option>
            <option value="title">{ui.titleAZ}</option>
            <option value="popular">Popularitas</option>
          </select>
          <select className="select-premium" value={genre} onChange={(e) => setGenre(e.target.value)}>
            <option value="">{ui.allGenre}</option>
            {genres.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <a href={`#/aiman?mood=${currentMood}`} className="mood-aiman-link">{ui.askAiman}</a>
        </section>

        <div className="mb-5 flex flex-col justify-between gap-2 sm:flex-row sm:items-end" data-aos="fade-left" data-aos-delay="120">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.28em] text-[var(--mood-accent)]">{ui.filmRecommendations}</p>
            <h2 className="mt-2 text-3xl font-black tracking-[-0.04em] text-white md:text-4xl">{ui.forMood.replace('{mood}', mood.label)}</h2>
          </div>
          <p className="text-sm font-bold text-white/55">{ui.showingFilms.replace('{count}', visibleMovies.length)} dari {movies.length}</p>
        </div>

        {gridLoading ? (
          <MoodFilmGridSkeleton count={12} />
        ) : movies.length ? (
          <>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
              {visibleMovies.map((movie, index) => <FilmCard key={movie.id} movie={movie} mood={currentMood} animationDelay={(index % 10) * 35} />)}
            </div>
            {totalPages > 1 && (
              <div className="iim-pagination mood-pagination">
                <button type="button" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page === 1}>Sebelumnya</button>
                <span>Halaman {page} / {totalPages}</span>
                <button type="button" onClick={() => setPage((value) => Math.min(totalPages, value + 1))} disabled={page === totalPages}>Berikutnya</button>
              </div>
            )}
          </>
        ) : (
          <div className="mood-empty">
            <h3>{ui.filmNotFound}</h3>
            <p>{ui.tryOtherFilm}</p>
          </div>
        )}
      </main>
    </section>
  );
}
