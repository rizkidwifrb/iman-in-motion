import { useEffect, useMemo, useState } from 'react';
import ArticleCard, { makeArticleCopy } from '../components/ArticleCard';
import { ArticleGridSkeleton } from '../components/Skeletons';
import SectionTitle from '../components/SectionTitle';
import articles from '../data/articles';
import { MOODS } from '../services/recommendationService';
import { useLanguageCopy } from '../utils/i18n';

export default function Articles() {
  const [query, setQuery] = useState('');
  const [mood, setMood] = useState('');
  const [visible, setVisible] = useState(12);
  const [gridLoading, setGridLoading] = useState(true);
  const { text } = useLanguageCopy();
  const ui = text.ui;

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return articles.filter((article) => {
      const copy = makeArticleCopy(article);
      const text = `${copy.title} ${copy.excerpt} ${article.overview} ${article.movieTitle} ${article.tags?.join(' ')}`.toLowerCase();
      return (!q || text.includes(q)) && (!mood || String(article.mood || '').toLowerCase() === mood);
    });
  }, [query, mood]);

  const shown = filtered.slice(0, visible);

  useEffect(() => {
    setGridLoading(true);
    const timer = window.setTimeout(() => setGridLoading(false), 220);
    return () => window.clearTimeout(timer);
  }, [query, mood, visible]);

  function updateQuery(value) {
    setQuery(value);
    setVisible(12);
  }

  function updateMood(value) {
    setMood(value);
    setVisible(12);
  }

  return (
    <section className="container-page py-10 md:py-14">
      <SectionTitle eyebrow={ui.articlesEyebrow} title={ui.articlesTitle} description={ui.articlesDesc} />

      <div className="premium-card mb-6 grid gap-3 p-4 md:grid-cols-[1fr_260px]">
        <input className="input-premium" placeholder={ui.searchArticle} value={query} onChange={(e) => updateQuery(e.target.value)} />
        <select className="input-premium select-premium" value={mood} onChange={(e) => updateMood(e.target.value)}>
          <option value="">{ui.allMood}</option>
          {MOODS.map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}
        </select>
      </div>

      <div className="mb-5 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
        <p className="text-sm font-bold text-iim-brown dark:text-iim-sand">{ui.showingArticles.replace('{shown}', shown.length).replace('{total}', filtered.length)}</p>
        <a href="#/mood" className="text-sm font-extrabold text-iim-brown underline-offset-4 hover:underline dark:text-iim-gold">{ui.searchByMood}</a>
      </div>

      {gridLoading ? (
        <ArticleGridSkeleton count={Math.min(6, Math.max(4, shown.length || 6))} />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {shown.map((article) => <ArticleCard key={article.id || article.title} article={article} />)}
        </div>
      )}

      {!gridLoading && shown.length < filtered.length && (
        <div className="mt-8 text-center">
          <button type="button" className="btn-primary" onClick={() => setVisible((value) => value + 12)}>{ui.loadMore}</button>
        </div>
      )}

      {!gridLoading && !filtered.length && (
        <div className="premium-card p-10 text-center">
          <h3 className="text-2xl font-black">{ui.articleNotFound}</h3>
          <p className="mt-3 text-iim-brown dark:text-iim-sand">{ui.tryOtherArticle}</p>
        </div>
      )}
    </section>
  );
}
