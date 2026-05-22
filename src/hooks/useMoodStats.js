import { useCallback, useEffect, useMemo, useState } from 'react';
import useAuthUser from './useAuthUser';
import { addActivity, loadUserScoped, readUserScoped, writeUserScoped } from '../utils/accountStorage';

export default function useMoodStats() {
  const user = useAuthUser();
  const [stats, setStats] = useState({ counts: {}, total: 0, lastMood: '' });

  const refresh = useCallback(() => {
    const fallback = { counts: {}, total: 0, lastMood: '' };
    if (!user) {
      setStats(fallback);
      return;
    }
    setStats(readUserScoped('iim_mood_stats', fallback, user));
    loadUserScoped('iim_mood_stats', fallback, user).then(setStats);
  }, [user]);

  useEffect(() => {
    refresh();
    window.addEventListener('iim-account-data-change', refresh);
    return () => window.removeEventListener('iim-account-data-change', refresh);
  }, [refresh]);

  const trackMood = useCallback(async (mood, extra = {}) => {
    if (!user || !mood) return;
    const key = String(mood).toLowerCase();
    const current = await loadUserScoped('iim_mood_stats', { counts: {}, total: 0, lastMood: '' }, user);
    const next = {
      ...current,
      counts: { ...(current.counts || {}), [key]: Number(current.counts?.[key] || 0) + 1 },
      total: Number(current.total || 0) + 1,
      lastMood: key,
      updatedAt: new Date().toISOString()
    };
    await writeUserScoped('iim_mood_stats', next, user);
    await addActivity('mood_selected', { mood: key, ...extra }, user);
    setStats(next);
  }, [user]);

  const topMood = useMemo(() => {
    const entries = Object.entries(stats.counts || {});
    return entries.sort((a, b) => b[1] - a[1])[0]?.[0] || '';
  }, [stats]);

  return { user, stats, topMood, trackMood };
}
