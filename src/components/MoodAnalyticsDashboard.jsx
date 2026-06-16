/**
 * Enhanced Mood Analytics Dashboard Component
 * Displays mood patterns, trends, and personalization insights
 */

import React, { useMemo } from 'react';
import { useMoodAnalytics } from '../hooks/useMoodAnalytics';
import { useAuthUser } from '../hooks/useAuthUser';

const MoodAnalyticsDashboard = () => {
  const { user } = useAuthUser();
  const {
    moodStats,
    emotionalPattern,
    personalizationData,
    getMoodStats,
    getRecommendations
  } = useMoodAnalytics(user?.uid);

  const stats = getMoodStats();
  const insights = getRecommendations();

  // Calculate mood percentages
  const moodPercentages = useMemo(() => {
    if (stats.totalMoods === 0) return {};
    const percentages = {};
    Object.entries(stats.moods).forEach(([mood, count]) => {
      percentages[mood] = ((count / stats.totalMoods) * 100).toFixed(1);
    });
    return percentages;
  }, [stats]);

  // Mood colors
  const moodColors = {
    sedih: 'from-purple-600 to-pink-500',
    gelisah: 'from-red-500 to-orange-400',
    hidayah: 'from-green-500 to-emerald-400',
    bahagia: 'from-yellow-400 to-orange-300',
    marah: 'from-red-700 to-red-500',
    rindu: 'from-slate-700 to-slate-500'
  };

  const moodEmoji = {
    sedih: '💔',
    gelisah: '😰',
    hidayah: '✨',
    bahagia: '😊',
    marah: '😠',
    rindu: '🌙'
  };

  const moodLabels = {
    sedih: 'Sedih',
    gelisah: 'Gelisah',
    hidayah: 'Hidayah',
    bahagia: 'Bahagia',
    marah: 'Marah',
    rindu: 'Rindu'
  };

  if (stats.totalMoods === 0) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center backdrop-blur-sm">
        <div className="text-4xl mb-4">📊</div>
        <h3 className="text-xl font-bold text-white mb-2">
          Mulai Mood Journey-mu
        </h3>
        <p className="text-gray-400 mb-6">
          Setiap kali kamu memilih mood, analytics mu akan muncul di sini
        </p>
        <a
          href="#/mood-pro"
          className="inline-block px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-lg font-semibold transition"
        >
          Mulai Sekarang
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div>
        <h2 className="text-3xl font-bold text-white mb-2">📊 Mood Analytics</h2>
        <p className="text-gray-400">
          Memahami pola emosi dan tren mood-mu
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Moods */}
        <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-400/20 rounded-xl p-6 backdrop-blur-sm">
          <div className="text-sm text-blue-300 mb-2">Total Mood Entries</div>
          <div className="text-4xl font-bold text-white mb-2">
            {stats.totalMoods}
          </div>
          <div className="text-xs text-gray-400">
            Tracked mood selections
          </div>
        </div>

        {/* Top Mood */}
        {stats.topMood && (
          <div
            className={`bg-gradient-to-br ${moodColors[stats.topMood]}/10 border border-${moodColors[stats.topMood].split(' ')[1]}/20 rounded-xl p-6 backdrop-blur-sm`}
          >
            <div className="text-sm text-gray-300 mb-2">Top Mood</div>
            <div className="text-3xl mb-2">{moodEmoji[stats.topMood]}</div>
            <div className="text-2xl font-bold text-white">
              {moodLabels[stats.topMood]}
            </div>
            <div className="text-xs text-gray-400 mt-2">
              {stats.moods[stats.topMood]} times ({moodPercentages[stats.topMood]}%)
            </div>
          </div>
        )}

        {/* Last Mood */}
        {stats.lastMood && (
          <div className="bg-gradient-to-br from-white/5 to-white/10 border border-white/20 rounded-xl p-6 backdrop-blur-sm">
            <div className="text-sm text-gray-300 mb-2">Last Mood</div>
            <div className="text-3xl mb-2">{moodEmoji[stats.lastMood]}</div>
            <div className="text-2xl font-bold text-white">
              {moodLabels[stats.lastMood]}
            </div>
            {stats.lastMoodTime && (
              <div className="text-xs text-gray-400 mt-2">
                {new Date(stats.lastMoodTime).toLocaleDateString('id-ID')}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Mood Distribution */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
        <h3 className="text-xl font-bold text-white mb-6">Mood Distribution</h3>

        <div className="space-y-4">
          {['sedih', 'gelisah', 'hidayah', 'bahagia', 'marah', 'rindu'].map(
            (mood) => {
              const count = stats.moods[mood] || 0;
              const percentage = moodPercentages[mood] || 0;

              return (
                <div key={mood}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{moodEmoji[mood]}</span>
                      <span className="font-semibold text-white capitalize">
                        {moodLabels[mood]}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-white">{count}</div>
                      <div className="text-xs text-gray-400">{percentage}%</div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="h-3 bg-white/5 rounded-full overflow-hidden border border-white/10">
                    <div
                      className={`h-full bg-gradient-to-r ${moodColors[mood]} transition-all duration-500`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            }
          )}
        </div>
      </div>

      {/* Intensity Trends */}
      {emotionalPattern && (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
          <h3 className="text-xl font-bold text-white mb-6">Emotional Trends</h3>

          <div className="space-y-4">
            {/* Volatility */}
            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <div className="flex items-center justify-between mb-3">
                <div className="font-semibold text-white">Emotional Volatility</div>
                <div className="text-2xl">
                  {emotionalPattern.volatility > 0.6
                    ? '🌊'
                    : emotionalPattern.volatility > 0.3
                    ? '~'
                    : '😌'}
                </div>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-yellow-400 via-orange-400 to-red-500"
                  style={{
                    width: `${emotionalPattern.volatility * 100}%`
                  }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-3">
                {emotionalPattern.volatility > 0.6
                  ? 'Emosi kamu cukup fluktuatif. Coba ambil istirahat dan praktik mindfulness.'
                  : emotionalPattern.volatility > 0.3
                  ? 'Emosi kamu lumayan stabil dengan beberapa variasi.'
                  : 'Emosi kamu sangat stabil dan terukur. Bagus!'}
              </p>
            </div>

            {/* Top Transitions */}
            {emotionalPattern.topTransitions && (
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <div className="font-semibold text-white mb-3">
                  Mood Transitions
                </div>
                <div className="space-y-2">
                  {emotionalPattern.topTransitions.map((transition, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 text-sm text-gray-300"
                    >
                      <span>#{idx + 1}</span>
                      <span>{transition}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Insights & Recommendations */}
      {insights && insights.length > 0 && (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
          <h3 className="text-xl font-bold text-white mb-6">💡 AI Insights</h3>

          <div className="space-y-4">
            {insights.map((insight, idx) => (
              <div
                key={idx}
                className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-400/20 rounded-lg p-4"
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">
                    {insight.type === 'top_mood'
                      ? '🎯'
                      : insight.type === 'intensity_trend'
                      ? '📈'
                      : '⚠️'}
                  </span>
                  <div className="flex-1">
                    <h4 className="font-semibold text-white mb-1">
                      {insight.title}
                    </h4>
                    <p className="text-sm text-gray-300 mb-2">
                      {insight.description}
                    </p>
                    {insight.recommendation && (
                      <p className="text-xs text-amber-300 italic">
                        💭 {insight.recommendation}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Emotional Trend Timeline */}
      {stats.emotionalTrend && (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
          <h3 className="text-xl font-bold text-white mb-4">Recent Mood Flow</h3>

          <div className="flex items-center gap-2 overflow-x-auto pb-4">
            {stats.emotionalTrend.split(' → ').map((mood, idx) => (
              <React.Fragment key={idx}>
                <div className="flex flex-col items-center gap-2">
                  <div className={`bg-gradient-to-br ${moodColors[mood]} rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold shadow-lg`}>
                    {moodEmoji[mood]}
                  </div>
                  <span className="text-xs text-gray-400 whitespace-nowrap">
                    {idx + 1}
                  </span>
                </div>
                {idx < stats.emotionalTrend.split(' → ').length - 1 && (
                  <div className="text-gray-600 text-xl">→</div>
                )}
              </React.Fragment>
            ))}
          </div>

          <p className="text-xs text-gray-400 mt-4">
            7 mood entries terbaru - menunjukkan pola emosi-mu dalam beberapa hari terakhir
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4">
        <a
          href="#/mood-pro"
          className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-lg font-semibold text-center transition"
        >
          🎭 Continue Mood Journey
        </a>
        <button
          onClick={() => {
            if (window.confirm('Hapus semua mood history? Tindakan ini tidak bisa dibatalkan.')) {
              localStorage.removeItem(`mood_history_${user?.uid}`);
              window.location.reload();
            }
          }}
          className="px-6 py-3 bg-red-600/20 hover:bg-red-600/30 text-red-300 rounded-lg font-semibold border border-red-600/30 transition"
        >
          🗑️ Clear History
        </button>
      </div>
    </div>
  );
};

export default MoodAnalyticsDashboard;
