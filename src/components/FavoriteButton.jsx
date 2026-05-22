import { Heart } from 'lucide-react';
import useFavorites from '../hooks/useFavorites';

export default function FavoriteButton({ movie, mood, className = '' }) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const active = isFavorite(movie?.id);

  function onClick(event) {
    event.preventDefault();
    event.stopPropagation();
    toggleFavorite(movie, mood);
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`favorite-button ${active ? 'active' : ''} ${className}`}
      aria-label={active ? 'Hapus dari favorit' : 'Simpan ke favorit'}
      title={active ? 'Hapus dari favorit' : 'Simpan ke favorit'}
    >
      <Heart size={17} fill={active ? 'currentColor' : 'none'} />
    </button>
  );
}
