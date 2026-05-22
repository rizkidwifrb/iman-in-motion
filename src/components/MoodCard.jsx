export default function MoodCard({ mood, compact = false, mini = false }) {
  const href = `#/mood?mood=${mood.key}`;

  if (mini) {
    return (
      <a
        href={href}
        className="group flex min-h-[58px] items-center justify-between gap-2 overflow-hidden rounded-2xl bg-white/[0.075] px-3 py-2 text-left transition hover:-translate-y-0.5 hover:bg-white/15"
        data-aos="fade-left"
      >
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-iim-gold/18 text-lg">{mood.icon}</span>
          <div className="min-w-0">
            <p className="text-sm font-extrabold leading-tight text-iim-cream">{mood.label}</p>
            <p className="mini-mood-desc mt-1 hidden text-[9px] font-semibold leading-4 text-iim-sand/80">{mood.description}</p>
          </div>
        </div>
      </a>
    );
  }

  return (
    <a
      href={href}
      className={`premium-card group relative overflow-hidden hover:-translate-y-1 hover:shadow-glow ${compact ? 'min-h-[142px] p-4' : 'min-h-[220px] p-5'}`}
      data-aos="fade-left"
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${mood.accent} opacity-80`} />
      <div className="relative z-10">
        <div className="flex items-start justify-between gap-3">
          <span className={`${compact ? 'h-11 w-11 text-2xl' : 'h-14 w-14 text-3xl'} grid place-items-center rounded-2xl bg-white/70 shadow-sm dark:bg-white/10`}>{mood.icon}</span>
          <span className="rounded-full bg-iim-coffee/10 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-iim-brown dark:bg-white/10 dark:text-iim-sand">Mood</span>
        </div>
        <h3 className={`${compact ? 'mt-4 text-xl' : 'mt-5 text-2xl'} font-extrabold text-iim-coffee dark:text-iim-cream`}>{mood.label}</h3>
        <p className={`${compact ? 'mt-2 line-clamp-2 text-xs leading-6' : 'mt-3 text-sm leading-7'} text-iim-brown dark:text-iim-sand`}>{mood.description}</p>
        {!compact && (
          <div className="mt-5 space-y-3">
            <p className="rounded-2xl bg-white/55 p-4 text-sm font-semibold leading-7 text-iim-coffee dark:bg-white/10 dark:text-iim-cream">{mood.message}</p>
            <p className="rounded-2xl border border-iim-gold/30 bg-iim-gold/10 p-4 text-xs font-bold leading-6 text-iim-coffee dark:text-iim-cream">
              <span className="text-iim-brown dark:text-iim-gold">Dalil:</span> {mood.dalil} — “{mood.dalilText}”
            </p>
          </div>
        )}
      </div>
    </a>
  );
}
