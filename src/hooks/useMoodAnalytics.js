/**
 * Enhanced Mood Analytics Hook
 * Tracks mood patterns, emotional trends, and personalization data
 */

import { useState, useEffect, useCallback } from 'react';

export const useMoodAnalytics = (userId) => {
  const [moodStats, setMoodStats] = useState({
    totalMoods: 0,
    moods: {},
    trends: {},
    topMood: null,
    emotionalTrend: null,
    lastMood: null,
    lastMoodTime: null
  });

  const [emotionalPattern, setEmotionalPattern] = useState(null);
  const [personalizationData, setPersonalizationData] = useState(null);

  /**
   * Load mood history from storage
   */
  const loadMoodHistory = useCallback(() => {
    try {
      const stored = localStorage.getItem(`mood_history_${userId}`);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading mood history:', error);
      return [];
    }
  }, [userId]);

  /**
   * Calculate mood statistics
   */
  const calculateStats = useCallback((history) => {
    if (history.length === 0) {
      return {
        totalMoods: 0,
        moods: {},
        trends: {},
        topMood: null,
        emotionalTrend: null,
        lastMood: null,
        lastMoodTime: null
      };
    }

    const moods = {};
    const mooodIntensities = {};
    let lastMood = null;
    let lastMoodTime = null;

    history.forEach((entry, index) => {
      moods[entry.mood] = (moods[entry.mood] || 0) + 1;
      
      if (index === 0) {
        lastMood = entry.mood;
        lastMoodTime = entry.timestamp;
      }

      // Track intensity trends
      if (!mooodIntensities[entry.mood]) {
        mooodIntensities[entry.mood] = [];
      }
      mooodIntensities[entry.mood].push(entry.intensity || 0.5);
    });

    // Calculate top mood
    const topMood = Object.entries(moods).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

    // Calculate emotional trend (last 7 entries)
    const recentHistory = history.slice(0, 7);
    const trendMoods = recentHistory.map(h => h.mood);
    const emotionalTrend = trendMoods.join(' → ');

    // Calculate mood intensity trends
    const trends = {};
    Object.entries(mooodIntensities).forEach(([mood, intensities]) => {
      const avgIntensity = intensities.reduce((a, b) => a + b, 0) / intensities.length;
      const trend = intensities.length > 1 
        ? intensities[0] > intensities[intensities.length - 1] ? 'decreasing' : 'increasing'
        : 'stable';
      
      trends[mood] = {
        average: avgIntensity,
        trend,
        count: intensities.length
      };
    });

    return {
      totalMoods: history.length,
      moods,
      trends,
      topMood,
      emotionalTrend,
      lastMood,
      lastMoodTime
    };
  }, []);

  /**
   * Analyze emotional patterns
   */
  const analyzePatterns = useCallback((history) => {
    if (history.length < 3) return null;

    const recentHistory = history.slice(0, 30);
    const moodSequences = {};

    // Find mood transitions
    for (let i = 0; i < recentHistory.length - 1; i++) {
      const from = recentHistory[i].mood;
      const to = recentHistory[i + 1].mood;
      const sequence = `${from} → ${to}`;
      moodSequences[sequence] = (moodSequences[sequence] || 0) + 1;
    }

    // Get most common transitions
    const topTransitions = Object.entries(moodSequences)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([sequence, count]) => sequence);

    // Detect patterns
    const emotionalCycles = detectCycles(recentHistory);
    const volatility = calculateVolatility(recentHistory);

    return {
      topTransitions,
      emotionalCycles,
      volatility,
      averageSessionLength: Math.ceil(recentHistory.length / 7) // Assuming 7-day period
    };
  }, []);

  /**
   * Detect emotional cycles
   */
  const detectCycles = (history) => {
    const moods = history.map(h => h.mood);
    const cycles = [];

    for (let i = 0; i < moods.length - 3; i++) {
      // Check for repeating 3+ mood sequences
      const pattern = moods.slice(i, i + 3).join('-');
      const nextPattern = moods.slice(i + 3, i + 6).join('-');
      
      if (pattern === nextPattern && pattern !== '---') {
        cycles.push({ pattern, startIndex: i });
      }
    }

    return cycles;
  };

  /**
   * Calculate emotional volatility (0 = stable, 1 = highly volatile)
   */
  const calculateVolatility = (history) => {
    if (history.length < 2) return 0;

    const intensities = history.map(h => h.intensity || 0.5);
    const mean = intensities.reduce((a, b) => a + b) / intensities.length;
    const variance = intensities.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / intensities.length;
    const stdDev = Math.sqrt(variance);

    // Normalize to 0-1
    return Math.min(1, stdDev);
  };

  /**
   * Generate personalization insights
   */
  const generateInsights = useCallback((history) => {
    if (history.length === 0) return null;

    const recentDays = 7;
    const dayInMs = 24 * 60 * 60 * 1000;
    const recentHistory = history.filter(h => {
      const entryDate = new Date(h.timestamp);
      const daysSince = (Date.now() - entryDate.getTime()) / dayInMs;
      return daysSince <= recentDays;
    });

    const insights = [];

    // Insight 1: Most frequent mood
    const moodCounts = {};
    recentHistory.forEach(h => {
      moodCounts[h.mood] = (moodCounts[h.mood] || 0) + 1;
    });
    const topMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0];
    if (topMood) {
      insights.push({
        type: 'top_mood',
        title: `Kamu sering merasa ${topMood[0]}`,
        description: `${topMood[1]} kali dalam ${recentDays} hari terakhir`,
        mood: topMood[0],
        confidence: topMood[1] / recentHistory.length
      });
    }

    // Insight 2: Intensity trend
    if (recentHistory.length >= 2) {
      const oldIntensity = recentHistory[recentHistory.length - 1].intensity || 0.5;
      const newIntensity = recentHistory[0].intensity || 0.5;
      const intensityChange = newIntensity - oldIntensity;

      if (Math.abs(intensityChange) > 0.2) {
        insights.push({
          type: 'intensity_trend',
          title: intensityChange > 0 ? 'Perasaan semakin kuat' : 'Perasaan semakin tenang',
          description: `Intensitas emosi ${intensityChange > 0 ? 'meningkat' : 'menurun'} dalam beberapa hari terakhir`,
          change: intensityChange,
          confidence: Math.abs(intensityChange)
        });
      }
    }

    // Insight 3: Mood volatility
    const volatility = calculateVolatility(recentHistory);
    if (volatility > 0.6) {
      insights.push({
        type: 'volatility_warning',
        title: 'Emosi kamu cukup fluktuatif',
        description: 'Pertimbangkan untuk mengambil waktu istirahat dan menenangkan diri',
        volatility,
        recommendation: 'Coba film yang menenangkan seperti yang bertema "bahagia" atau "hidayah"'
      });
    }

    return insights;
  }, []);

  /**
   * Initialize and update stats
   */
  useEffect(() => {
    if (!userId) return;

    const history = loadMoodHistory();
    const stats = calculateStats(history);
    const patterns = analyzePatterns(history);
    const insights = generateInsights(history);

    setMoodStats(stats);
    setEmotionalPattern(patterns);
    setPersonalizationData(insights);
  }, [userId, loadMoodHistory, calculateStats, analyzePatterns, generateInsights]);

  /**
   * Record new mood entry
   */
  const recordMood = useCallback((moodData) => {
    try {
      const history = loadMoodHistory();
      const newEntry = {
        mood: moodData.mood,
        intensity: moodData.intensity || 0.5,
        subEmotion: moodData.subEmotion,
        timestamp: new Date().toISOString()
      };

      const updatedHistory = [newEntry, ...history].slice(0, 500); // Keep last 500
      localStorage.setItem(`mood_history_${userId}`, JSON.stringify(updatedHistory));

      // Update stats
      const stats = calculateStats(updatedHistory);
      const patterns = analyzePatterns(updatedHistory);
      const insights = generateInsights(updatedHistory);

      setMoodStats(stats);
      setEmotionalPattern(patterns);
      setPersonalizationData(insights);

      return true;
    } catch (error) {
      console.error('Error recording mood:', error);
      return false;
    }
  }, [userId, loadMoodHistory, calculateStats, analyzePatterns, generateInsights]);

  /**
   * Get mood statistics for display
   */
  const getMoodStats = useCallback(() => {
    return moodStats;
  }, [moodStats]);

  /**
   * Get personalization recommendations
   */
  const getRecommendations = useCallback(() => {
    return personalizationData || [];
  }, [personalizationData]);

  return {
    moodStats,
    emotionalPattern,
    personalizationData,
    recordMood,
    getMoodStats,
    getRecommendations
  };
};

export default useMoodAnalytics;
