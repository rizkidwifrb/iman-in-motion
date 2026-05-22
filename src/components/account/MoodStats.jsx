import { MOODS } from '../../services/recommendationService';
import { useLanguageCopy } from '../../utils/i18n';

export default function MoodStats({ stats, topMood }) {
  const total = Number(stats?.total || 0);
  const { text } = useLanguageCopy();
  const ui = text.ui;
  const top = MOODS.find((item) => item.key === topMood);
  return (
    <section className="premium-card p-5 md:p-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="section-eyebrow">{ui.moodInsight}</p>
          <h2 className="mt-2 text-2xl font-black">{ui.moodStatsTitle}</h2>
        </div>
        <div className="rounded-2xl bg-iim-gold/20 px-4 py-3 text-sm font-black text-iim-coffee dark:text-iim-gold">
          {ui.totalInteractions.replace('{count}', total)}
        </div>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {MOODS.map((mood) => {
          const count = Number(stats?.counts?.[mood.key] || 0);
          const pct = total ? Math.round((count / total) * 100) : 0;
          return (
            <div key={mood.key} className="account-stat-card">
              <div className="flex items-center justify-between gap-3">
                <span className="text-2xl">{mood.icon}</span>
                <span className="text-xl font-black">{count}x</span>
              </div>
              <p className="mt-3 font-black">{mood.label}</p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-iim-brown/10 dark:bg-white/10">
                <span className="block h-full rounded-full bg-iim-gold" style={{ width: `${pct}%` }} />
              </div>
              <p className="mt-2 text-xs font-bold text-iim-brown dark:text-iim-sand">{ui.moodChoicePercent.replace('{pct}', pct)}</p>
            </div>
          );
        })}
      </div>
      <p className="mt-5 rounded-3xl bg-white/60 p-4 text-sm font-bold leading-7 text-iim-brown dark:bg-white/10 dark:text-iim-sand">
        {ui.dominantMood}: <span className="font-black text-iim-coffee dark:text-iim-gold">{top ? `${top.icon} ${top.label}` : ui.noData}</span>. {ui.statsPersonalize}
      </p>
    </section>
  );
}
