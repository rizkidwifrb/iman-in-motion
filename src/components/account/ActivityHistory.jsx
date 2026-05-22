import { useEffect, useState } from 'react';
import useAuthUser from '../../hooks/useAuthUser';
import { loadUserScoped, readUserScoped } from '../../utils/accountStorage';
import { useLanguageCopy } from '../../utils/i18n';

const labels = {
  mood_selected: 'Memilih mood',
  favorite_added: 'Menambahkan favorit',
  favorite_removed: 'Menghapus favorit',
  film_opened: 'Membuka detail film'
};

export default function ActivityHistory() {
  const user = useAuthUser();
  const [limit, setLimit] = useState(10);
  const [items, setItems] = useState([]);
  const { text } = useLanguageCopy();
  const ui = text.ui;

  useEffect(() => {
    const refresh = () => {
      if (!user) {
        setItems([]);
        return;
      }
      setItems(readUserScoped('iim_activity', [], user));
      loadUserScoped('iim_activity', [], user).then(setItems);
    };
    refresh();
    window.addEventListener('iim-account-data-change', refresh);
    return () => window.removeEventListener('iim-account-data-change', refresh);
  }, [user]);

  const shown = items.slice(0, limit);

  return (
    <section className="premium-card p-5 md:p-6">
      <p className="section-eyebrow">{ui.recentActivity}</p>
      <h2 className="mt-2 text-2xl font-black">{ui.activityTitle}</h2>
      {shown.length ? (
        <div className="mt-5 space-y-3">
          {shown.map((item) => (
            <div key={item.id} className="account-activity-row">
              <div>
                <p className="font-black">{labels[item.type] || 'Aktivitas'}</p>
                <p className="mt-1 text-xs font-bold text-iim-brown dark:text-iim-sand">{item.title || item.movieTitle || item.mood || 'IMAN IN MOTION'}</p>
              </div>
              <time className="text-right text-xs font-bold text-iim-brown dark:text-iim-sand">{new Date(item.at).toLocaleString('id-ID')}</time>
            </div>
          ))}
          {items.length > limit && <button type="button" onClick={() => setLimit((value) => value + 10)} className="btn-secondary w-full">{ui.loadMore}</button>}
        </div>
      ) : (
        <p className="mt-5 rounded-3xl bg-white/60 p-5 text-sm font-bold text-iim-brown dark:bg-white/10 dark:text-iim-sand">{ui.noActivity}</p>
      )}
    </section>
  );
}
