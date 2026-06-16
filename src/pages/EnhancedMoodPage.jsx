/**
 * Enhanced Mood Page with Neural Recommendation Engine
 * - Integrated mood detection ML
 * - Neural network recommendations
 * - Enhanced UX with mood journey
 * - Real-time suggestions and personalization
 */

import React, { useState, useEffect, useCallback } from 'react';
import FilmCard from '../components/FilmCard';
import { MoodFilmGridSkeleton } from '../components/Skeletons';
import EnhancedMoodSelector from '../components/EnhancedMoodSelector';
import { detectMoodML } from '../services/moodDetectionML';
import { NeuralRecommender } from '../services/neuralRecommendationEngine';
import useAuthUser from '../hooks/useAuthUser';
import useFavorites from '../hooks/useFavorites';
import allMovies from '../data/movies';

const EnhancedMoodPage = () => {
  const user = useAuthUser();
  const { favorites } = useFavorites();
  
  // State management
  const [currentMood, setCurrentMood] = useState(null);
  const [moodContext, setMoodContext] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showMoodSelector, setShowMoodSelector] = useState(false);
  const [userMoodHistory, setUserMoodHistory] = useState([]);
  const [selectedSort, setSelectedSort] = useState('recommended');
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [stats, setStats] = useState({
    total: 0,
    byMood: {}
  });

  // Initialize neural recommender
  const [recommender] = useState(() => new NeuralRecommender(allMovies));

  // Get unique genres from all movies
  const genres = Array.from(
    new Set(
      allMovies
        .flatMap(m => m.genres?.split('|').map(g => g.trim()) || [])
        .filter(Boolean)
    )
  ).sort();

  // Load user mood history from Firestore/localStorage
  useEffect(() => {
    const loadUserHistory = async () => {
      try {
        if (user?.uid) {
          // Try to load from localStorage first (for demo)
          const stored = localStorage.getItem(`mood_history_${user.uid}`);
          if (stored) {
            setUserMoodHistory(JSON.parse(stored));
          }
        }
      } catch (error) {
        console.error('Error loading user history:', error);
      }
    };

    loadUserHistory();
  }, [user]);

  /**
   * Generate recommendations using neural engine
   */
  const generateRecommendations = useCallback(async () => {
    setIsLoading(true);

    try {
      // Get recommendations from neural recommender
      const recs = recommender.recommendMovies(
        user?.uid || 'anonymous',
        moodContext,
        userMoodHistory,
        50 // Get more for filtering
      );

      // Apply genre filter
      let filtered = recs;
      if (selectedGenre !== 'all') {
        filtered = recs.filter(movie =>
          movie.genres?.split('|').map(g => g.trim()).includes(selectedGenre)
        );
      }

      // Apply sorting
      let sorted = [...filtered];
      switch (selectedSort) {
        case 'rating':
          sorted.sort((a, b) => b.rating - a.rating);
          break;
        case 'year':
          sorted.sort((a, b) => b.year - a.year);
          break;
        case 'title':
          sorted.sort((a, b) => a.title.localeCompare(b.title));
          break;
        case 'popularity':
          sorted.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
          break;
        case 'recommended':
        default:
          sorted.sort((a, b) => b.recommendationScore - a.recommendationScore);
      }

      setRecommendations(sorted);
      
      // Update stats
      const stats = {
        total: sorted.length,
        byMood: {}
      };
      sorted.forEach(m => {
        stats.byMood[m.mood] = (stats.byMood[m.mood] || 0) + 1;
      });
      setStats(stats);
      
      setCurrentPage(1);
    } catch (error) {
      console.error('Error generating recommendations:', error);
    } finally {
      setIsLoading(false);
    }
  }, [moodContext, userMoodHistory, selectedGenre, selectedSort, recommender, user?.uid]);

  // Get recommendations when mood changes
  useEffect(() => {
    if (currentMood && moodContext) {
      generateRecommendations();
    }
  }, [currentMood, moodContext, selectedGenre, selectedSort, generateRecommendations]);

  /**
   * Handle mood selection from enhanced selector
   */
  const handleMoodSelect = async (moodData) => {
    setMoodContext(moodData);
    setCurrentMood(moodData.mood);
    setShowMoodSelector(false);

    // Save to user history
    if (user?.uid) {
      const newHistory = [
        {
          mood: moodData.mood,
          timestamp: new Date(),
          intensity: moodData.intensity,
          subEmotion: moodData.subEmotion
        },
        ...userMoodHistory
      ].slice(0, 50); // Keep last 50

      setUserMoodHistory(newHistory);
      localStorage.setItem(`mood_history_${user.uid}`, JSON.stringify(newHistory));
    }
  };

  /**
   * Pagination
   */
  const itemsPerPage = 18;
  const totalPages = Math.ceil(recommendations.length / itemsPerPage);
  const paginatedRecs = recommendations.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Enhanced Mood Selector Modal */}
      {showMoodSelector && (
        <EnhancedMoodSelector
          onMoodSelect={handleMoodSelect}
          onClose={() => setShowMoodSelector(false)}
          isLoading={isLoading}
        />
      )}

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-4xl font-bold text-white">
              Mood Journey 🎬
            </h1>
            <button
              onClick={() => { window.location.hash = '#/'; }}
              className="text-gray-400 hover:text-white transition p-2"
            >
              ← Kembali
            </button>
          </div>

          {/* Current Mood Display */}
          {currentMood ? (
            <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-400/30 rounded-2xl p-6 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-purple-300 mb-2">Suasana Hati Saat Ini</div>
                  <h2 className="text-3xl font-bold text-white mb-2">
                    {currentMood.charAt(0).toUpperCase() + currentMood.slice(1)}
                    {moodContext?.subEmotion && ` - ${moodContext.subEmotion}`}
                  </h2>
                  <p className="text-gray-300">
                    Intensitas: {moodContext?.intensity ? 
                      ['Ringan', 'Sedang', 'Kuat'][
                        moodContext.intensity < 0.33 ? 0 : 
                        moodContext.intensity < 0.66 ? 1 : 2
                      ] : 'N/A'
                    }
                  </p>
                </div>
                <button
                  onClick={() => setShowMoodSelector(true)}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-semibold transition transform hover:scale-105"
                >
                  Ubah Mood
                </button>
              </div>

              {/* Stats Bar */}
              {stats.total > 0 && (
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white/5 rounded-lg p-3">
                    <div className="text-sm text-gray-400">Total Film</div>
                    <div className="text-2xl font-bold text-white">{stats.total}</div>
                  </div>
                  {Object.entries(stats.byMood).slice(0, 3).map(([mood, count]) => (
                    <div key={mood} className="bg-white/5 rounded-lg p-3">
                      <div className="text-sm text-gray-400 capitalize">{mood}</div>
                      <div className="text-2xl font-bold text-white">{count}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-400/30 rounded-2xl p-8 backdrop-blur-sm text-center">
              <h3 className="text-2xl font-bold text-white mb-4">
                Mulai Mood Journey-mu
              </h3>
              <p className="text-gray-300 mb-6">
                Ceritakan perasaanmu dan kami akan merekomendasikan film yang sempurna untuk suasana hatimu.
              </p>
              <button
                onClick={() => setShowMoodSelector(true)}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-xl font-bold text-lg transition transform hover:scale-105 inline-flex items-center gap-3"
              >
                <span>🎬</span>
                Pilih Suasana Hati
              </button>
            </div>
          )}
        </div>

        {/* Controls Section */}
        {currentMood && (
          <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Genre Filter */}
            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <label className="text-sm font-semibold text-gray-300 mb-3 block">
                Filter Genre
              </label>
              <select
                value={selectedGenre}
                onChange={(e) => setSelectedGenre(e.target.value)}
                className="w-full bg-white/10 border border-white/20 text-white rounded-lg p-2 focus:border-purple-500 focus:outline-none"
              >
                <option value="all">Semua Genre</option>
                {genres.map(genre => (
                  <option key={genre} value={genre}>
                    {genre}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Options */}
            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <label className="text-sm font-semibold text-gray-300 mb-3 block">
                Urutkan Berdasarkan
              </label>
              <select
                value={selectedSort}
                onChange={(e) => setSelectedSort(e.target.value)}
                className="w-full bg-white/10 border border-white/20 text-white rounded-lg p-2 focus:border-purple-500 focus:outline-none"
              >
                <option value="recommended">Rekomendasi Terbaik</option>
                <option value="rating">Rating Tertinggi</option>
                <option value="year">Terbaru</option>
                <option value="title">Judul (A-Z)</option>
                <option value="popularity">Populer</option>
              </select>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && currentMood && (
          <MoodFilmGridSkeleton count={18} />
        )}

        {/* Results Grid */}
        {!isLoading && currentMood && recommendations.length > 0 && (
          <>
            <div className="mb-8">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {paginatedRecs.map(film => (
                  <div key={film.id} className="group cursor-pointer">
                    <FilmCard 
                      film={film}
                      isFavorite={favorites.some(f => f.id === film.id)}
                      showMood={true}
                      recommendationScore={film.recommendationScore}
                      recommendationReason={film.reason}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mb-8">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg disabled:opacity-50"
                >
                  ← Sebelumnya
                </button>
                
                <div className="flex gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = currentPage <= 3 ? i + 1 : currentPage - 2 + i;
                    if (page > totalPages) return null;
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-10 h-10 rounded-lg font-semibold transition ${
                          currentPage === page
                            ? 'bg-purple-600 text-white'
                            : 'bg-white/10 text-white hover:bg-white/20'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg disabled:opacity-50"
                >
                  Selanjutnya →
                </button>
              </div>
            )}
          </>
        )}

        {/* Empty State */}
        {!isLoading && currentMood && recommendations.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg mb-4">
              Tidak ada film yang cocok dengan filter saat ini
            </p>
            <button
              onClick={() => setSelectedGenre('all')}
              className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition"
            >
              Reset Filter
            </button>
          </div>
        )}

        {/* User History Stats */}
        {user && userMoodHistory.length > 0 && (
          <div className="mt-12 bg-white/5 rounded-2xl p-6 border border-white/10">
            <h3 className="text-xl font-bold text-white mb-4">
              📊 Statistik Mood Mu
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {['sedih', 'gelisah', 'hidayah', 'bahagia', 'marah', 'rindu'].map(mood => {
                const count = userMoodHistory.filter(h => h.mood === mood).length;
                const percentage = (count / userMoodHistory.length * 100).toFixed(0);
                return (
                  <div key={mood} className="bg-white/5 rounded-lg p-4 border border-white/10">
                    <div className="text-sm text-gray-400 capitalize mb-2">{mood}</div>
                    <div className="text-2xl font-bold text-white mb-2">{count}</div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div className="text-xs text-gray-500 mt-2">{percentage}%</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedMoodPage;
