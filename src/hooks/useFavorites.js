import { useCallback, useEffect, useMemo, useState } from 'react';
import useAuthUser from './useAuthUser';
import { addActivity, loadUserScoped, readUserScoped, writeUserScoped } from '../utils/accountStorage';

function packMovie(movie, mood) {
  return {
    id: movie.id,
    title: movie.title,
    year: movie.year || '',
    genres: movie.genres || '',
    mood: mood || movie.mood || '',
    rating: movie.rating || 0,
    poster: movie.poster || '',
    overview: movie.overview || '',
    savedAt: new Date().toISOString()
  };
}

export default function useFavorites() {
  const user = useAuthUser();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    if (!user) {
      setFavorites([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setFavorites(readUserScoped('iim_favorites', [], user));
    loadUserScoped('iim_favorites', [], user)
      .then(setFavorites)
      .finally(() => setLoading(false));
  }, [user]);

  useEffect(() => {
    refresh();
    window.addEventListener('iim-account-data-change', refresh);
    return () => window.removeEventListener('iim-account-data-change', refresh);
  }, [refresh]);

  const ids = useMemo(() => new Set(favorites.map((item) => String(item.id))), [favorites]);

  const isFavorite = useCallback((movieId) => ids.has(String(movieId)), [ids]);

  const toggleFavorite = useCallback(async (movie, mood) => {
    if (!user) {
      window.dispatchEvent(new CustomEvent('iim-toast', { detail: 'Login dulu untuk menyimpan film favorit.' }));
      return { ok: false, needsLogin: true };
    }
    const current = await loadUserScoped('iim_favorites', [], user);
    const exists = current.some((item) => String(item.id) === String(movie.id));
    const next = exists ? current.filter((item) => String(item.id) !== String(movie.id)) : [packMovie(movie, mood), ...current];
    await writeUserScoped('iim_favorites', next, user);
    await addActivity(exists ? 'favorite_removed' : 'favorite_added', { movieId: movie.id, title: movie.title, mood: mood || movie.mood }, user);
    setFavorites(next);
    return { ok: true, active: !exists };
  }, [user]);

  return { user, favorites, isFavorite, toggleFavorite, loading };
}
