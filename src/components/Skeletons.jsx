export function FilmCardSkeleton() {
  return (
    <div className="skeleton-card skeleton-film-card" aria-hidden="true">
      <div className="skeleton-shape skeleton-poster" />
      <div className="skeleton-content-stack">
        <div className="skeleton-shape skeleton-line skeleton-title-wide" />
        <div className="skeleton-shape skeleton-line skeleton-line-short" />
        <div className="skeleton-shape skeleton-line skeleton-line-mid" />
      </div>
    </div>
  );
}

export function FilmGridSkeleton({ count = 12, className = '' }) {
  return (
    <div className={`grid grid-cols-3 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 ${className}`} aria-label="Memuat film">
      {Array.from({ length: count }).map((_, index) => <FilmCardSkeleton key={index} />)}
    </div>
  );
}

export function MoodFilmGridSkeleton({ count = 12 }) {
  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5" aria-label="Memuat rekomendasi film">
      {Array.from({ length: count }).map((_, index) => <FilmCardSkeleton key={index} />)}
    </div>
  );
}

export function ArticleCardSkeleton() {
  return (
    <article className="skeleton-card skeleton-article-card" aria-hidden="true">
      <div className="skeleton-shape skeleton-article-thumb" />
      <div className="skeleton-article-copy">
        <div className="skeleton-row">
          <div className="skeleton-shape skeleton-chip" />
          <div className="skeleton-shape skeleton-date" />
        </div>
        <div className="skeleton-shape skeleton-line skeleton-title-wide" />
        <div className="skeleton-shape skeleton-line" />
        <div className="skeleton-shape skeleton-line skeleton-line-mid" />
        <div className="skeleton-shape skeleton-line skeleton-line-short" />
      </div>
    </article>
  );
}

export function ArticleGridSkeleton({ count = 6 }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2" aria-label="Memuat artikel">
      {Array.from({ length: count }).map((_, index) => <ArticleCardSkeleton key={index} />)}
    </div>
  );
}

export function FavoriteGridSkeleton({ count = 4 }) {
  return (
    <div className="account-favorites-grid mt-5 grid gap-4" aria-label="Memuat film favorit">
      {Array.from({ length: count }).map((_, index) => (
        <article key={index} className="account-favorite-card skeleton-card skeleton-favorite-card" aria-hidden="true">
          <div className="skeleton-shape skeleton-favorite-poster" />
          <div className="min-w-0 flex-1">
            <div className="skeleton-shape skeleton-line skeleton-title-wide" />
            <div className="skeleton-shape skeleton-line skeleton-line-short mt-3" />
            <div className="mt-4 flex gap-2">
              <div className="skeleton-shape skeleton-chip" />
              <div className="skeleton-shape skeleton-chip" />
            </div>
            <div className="mt-4 flex gap-2">
              <div className="skeleton-shape skeleton-button" />
              <div className="skeleton-shape skeleton-button-small" />
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

export function PageSkeleton() {
  return (
    <section className="container-page py-10 md:py-14" aria-label="Memuat halaman">
      <div className="page-skeleton-head">
        <div className="skeleton-shape skeleton-kicker" />
        <div className="skeleton-shape skeleton-page-title" />
        <div className="skeleton-shape skeleton-page-desc" />
      </div>
      <FilmGridSkeleton count={12} />
    </section>
  );
}
