import { useState } from 'react';

export default function LazyPoster({ src, alt, className = '', imgClassName = '', fallback = null, children }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  return (
    <div className={`lazy-poster-wrap ${className}`}>
      {!loaded && !failed && <div className="poster-skeleton" aria-hidden="true" />}
      {src && !failed ? (
        <img
          src={src}
          alt={alt || ''}
          loading="lazy"
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          className={`lazy-poster-img ${loaded ? 'is-loaded' : ''} ${imgClassName}`}
        />
      ) : (
        fallback || <div className="grid h-full place-items-center p-4 text-center text-xs font-bold text-iim-brown dark:text-iim-sand">Poster belum tersedia</div>
      )}
      {children}
    </div>
  );
}
