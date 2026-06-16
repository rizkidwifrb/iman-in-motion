import { useMemo, useState, useRef } from 'react';
import SectionTitle from '../components/SectionTitle';
import MoodCard from '../components/MoodCard';
import FilmCard from '../components/FilmCard';
import ArticleCard from '../components/ArticleCard';
import { MOODS, buildReason, recommendMovies, scoreMovie, searchMovies } from '../services/recommendationService';
import articles from '../data/articles';
import { useLanguageCopy } from '../utils/i18n';
import { assetUrl } from '../utils/assetUrl';

const moodJourneyOptions = {
  sedih: [
    { key: 'lelah', label: 'Tired heart', keywords: ['healing', 'hope', 'family', 'sabar'], copy: 'a calmer story that gives your heart room to breathe.' },
    { key: 'kehilangan', label: 'Missing someone', keywords: ['loss', 'memory', 'home', 'mother', 'father'], copy: 'a reflective story about loss, patience, and returning to meaning.' },
    { key: 'kecewa', label: 'Disappointed', keywords: ['forgiveness', 'mercy', 'truth', 'healing'], copy: 'a story that helps reframe pain into forgiveness and strength.' },
    { key: 'sendiri', label: 'Feeling alone', keywords: ['friendship', 'family', 'kindness', 'hope'], copy: 'a warmer film that reminds you that support can arrive slowly.' }
  ],
  gelisah: [
    { key: 'overthinking', label: 'Overthinking', keywords: ['calm', 'peace', 'prayer', 'faith'], copy: 'a grounded film that gives your thoughts a softer place to land.' },
    { key: 'takut', label: 'Afraid', keywords: ['safety', 'trust', 'courage', 'faith'], copy: 'a story about courage, trust, and choosing clarity over fear.' },
    { key: 'bingung', label: 'Confused', keywords: ['truth', 'journey', 'teacher', 'wisdom'], copy: 'a film about finding direction when everything feels unclear.' },
    { key: 'butuh-tenang', label: 'Need calm', keywords: ['calm', 'family', 'warm', 'spiritual'], copy: 'a calmer recommendation with a softer emotional rhythm.' }
  ],
  hidayah: [
    { key: 'ingin-berubah', label: 'Want to change', keywords: ['hidayah', 'faith', 'taubat', 'redemption'], copy: 'a story about turning back to goodness and choosing a better path.' },
    { key: 'belajar', label: 'Want to learn', keywords: ['teacher', 'school', 'quran', 'education'], copy: 'a film that puts learning, faith, and growth near the center.' },
    { key: 'mencari-arah', label: 'Looking for direction', keywords: ['journey', 'truth', 'spiritual', 'islam'], copy: 'a journey film that connects searching with faith and reflection.' },
    { key: 'butuh-dikuatkan', label: 'Need strength', keywords: ['inspirational', 'courage', 'hope', 'faith'], copy: 'a stronger pick for rebuilding intention and courage.' }
  ],
  bahagia: [
    { key: 'bersyukur', label: 'Grateful', keywords: ['gratitude', 'family', 'warm', 'kindness'], copy: 'a warm film that keeps gratitude and kindness close.' },
    { key: 'ringan', label: 'Light mood', keywords: ['comedy', 'family', 'friendship', 'uplifting'], copy: 'a lighter film to keep the mood gentle and positive.' },
    { key: 'hangat', label: 'Warm inside', keywords: ['family', 'friendship', 'mother', 'father'], copy: 'a family-leaning story with a warm emotional center.' },
    { key: 'ingin-berbagi', label: 'Want to share', keywords: ['charity', 'community', 'kindness', 'friendship'], copy: 'a story about goodness that moves outward to other people.' }
  ],
  marah: [
    { key: 'butuh-jeda', label: 'Need a pause', keywords: ['forgive', 'control', 'calm', 'mercy'], copy: 'a film that helps anger slow down before becoming a decision.' },
    { key: 'merasa-dizalimi', label: 'Feel wronged', keywords: ['justice', 'truth', 'forgiveness', 'patience'], copy: 'a reflective story about justice without losing yourself.' },
    { key: 'ingin-memaafkan', label: 'Trying to forgive', keywords: ['forgiveness', 'mercy', 'healing', 'family'], copy: 'a story that keeps forgiveness possible, even when it is hard.' },
    { key: 'emosi-penuh', label: 'Emotion is full', keywords: ['control', 'conflict', 'courage', 'peace'], copy: 'a controlled, reflective pick for reading conflict more clearly.' }
  ],
  rindu: [
    { key: 'keluarga', label: 'Family', keywords: ['family', 'home', 'mother', 'father'], copy: 'a film with family and home close to the emotional center.' },
    { key: 'pulang', label: 'Longing for home', keywords: ['home', 'journey', 'memory', 'return'], copy: 'a story about returning, remembering, and making peace with distance.' },
    { key: 'kehilangan', label: 'Someone absent', keywords: ['loss', 'memory', 'healing', 'hope'], copy: 'a reflective pick for longing that still needs tenderness.' },
    { key: 'cinta-baik', label: 'Good love', keywords: ['romance', 'family', 'kindness', 'faith'], copy: 'a softer story about love, memory, and keeping goodness intact.' }
  ]
};

function getJourneyRecommendation(moodKey, detail, note) {
  if (!moodKey) return null;
  const candidates = searchMovies({ mood: moodKey, sort: 'recommended' });
  const keywords = detail?.keywords || [];
  const modelQuery = [...keywords, note].filter(Boolean).join(' ');
  const noteWords = String(note || '')
    .toLowerCase()
    .split(/\s+/)
    .map((word) => word.replace(/[^a-z0-9]/g, ''))
    .filter((word) => word.length > 3)
    .slice(0, 6);

  const scored = candidates.map((movie) => {
    const haystack = `${movie.title} ${movie.genres} ${movie.overview} ${movie.mood}`.toLowerCase();
    const keywordBoost = keywords.reduce((score, keyword) => score + (haystack.includes(keyword) ? 12 : 0), 0);
    const noteBoost = noteWords.reduce((score, word) => score + (haystack.includes(word) ? 3 : 0), 0);
    const modelScore = scoreMovie(movie, moodKey, { query: modelQuery });
    return { movie, score: modelScore + keywordBoost + noteBoost };
  });

  return scored.sort((a, b) => b.score - a.score)[0]?.movie || recommendMovies(moodKey, 1)[0] || null;
}

export default function Home() {
  const [journeyOpen, setJourneyOpen] = useState(false);
  const [journeyStep, setJourneyStep] = useState('mood');
  const [selectedMoodKey, setSelectedMoodKey] = useState('');
  const [selectedDetailKey, setSelectedDetailKey] = useState('');
  const [moodNote, setMoodNote] = useState('');
  const featured = recommendMovies('hidayah', 6);
  const featuredArticles = articles.slice(0, 3);
  const { text } = useLanguageCopy();
  const t = text.home;
  const mobileJourneyRef = useRef(null);
  const selectedMood = MOODS.find((mood) => mood.key === selectedMoodKey);
  const selectedOptions = selectedMoodKey ? moodJourneyOptions[selectedMoodKey] || [] : [];
  const selectedDetail = selectedOptions.find((item) => item.key === selectedDetailKey);
  const journeyMovie = useMemo(
    () => getJourneyRecommendation(selectedMoodKey, selectedDetail, moodNote),
    [selectedMoodKey, selectedDetail, moodNote]
  );

  function startJourney() {
    setJourneyOpen(true);
    setJourneyStep('mood');
    // Smooth-scroll mobile mood journey into view for better UX
    setTimeout(() => {
      try {
        mobileJourneyRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } catch (e) {
        // ignore if scroll fails
      }
    }, 60);
  }

  function chooseMood(key) {
    setSelectedMoodKey(key);
    setSelectedDetailKey('');
    setMoodNote('');
    setJourneyStep('detail');
  }

  function chooseDetail(key) {
    setSelectedDetailKey(key);
    setJourneyStep('note');
  }

  function resetJourney() {
    setJourneyStep('mood');
    setSelectedMoodKey('');
    setSelectedDetailKey('');
    setMoodNote('');
  }

  return (
    <div className="relative z-10">
      <section className="home-hero container-page grid md:grid-cols-1 items-center gap-8 py-10 lg:grid-cols-[1.05fr_0.95fr] lg:py-14 md:place-items-center md:text-center" data-scroll-reveal>
        <div className="md:w-full md:max-w-2xl md:mx-auto">
          <p className="section-eyebrow">{t.eyebrow}</p>
          <h1 className="home-hero-title mt-5 max-w-4xl text-5xl font-black leading-tight tracking-[-0.04em] text-iim-coffee dark:text-iim-cream md:text-7xl">
            <span className="home-hero-title-line">How Do You</span>{' '}
            <span className="home-hero-title-line">Feel?</span>
          </h1>
          <p className="home-hero-copy mt-6 max-w-2xl text-lg leading-9 text-iim-brown dark:text-iim-sand">
            Find your next favorite movie
          </p>
          <div className="home-hero-actions mt-8 flex flex-col gap-3 sm:flex-row">
            <a href="#/mood" className="btn-primary desktop-start-mood-link">{t.ctaMood}</a>
            <button type="button" className="btn-primary mobile-start-mood-btn" onClick={startJourney}>Start with Mood</button>
            <a href="#/film" className="btn-secondary">{t.ctaFilm}</a>
          </div>
          <div className="home-stats mt-8 grid gap-3 sm:grid-cols-3">
            {[t.statFilms, t.statMoods, t.statAiman].map((item) => (
              <div key={item} className="rounded-3xl border border-iim-brown/10 bg-white/50 p-4 text-sm font-extrabold text-iim-coffee dark:border-white/10 dark:bg-white/10 dark:text-iim-cream">{item}</div>
            ))}
          </div>

          <div ref={mobileJourneyRef} className={`mobile-mood-journey ${journeyOpen ? 'is-open' : ''}`} aria-live="polite">
            {!journeyOpen && (
              <p className="mobile-mood-journey-hint">Answer three quick prompts and get one film that fits your heart right now.</p>
            )}

            {journeyOpen && (
              <>
                <div className="mobile-journey-topline">
                  <span>Personal mood match</span>
                  <button type="button" onClick={resetJourney}>Reset</button>
                </div>

                {journeyStep === 'mood' && (
                  <div className="mobile-journey-panel">
                    <p className="mobile-journey-kicker">Step 1 of 3</p>
                    <h2>Choose your mood</h2>
                    <div className="mobile-journey-choice-grid">
                      {MOODS.map((mood) => (
                        <button
                          key={mood.key}
                          type="button"
                          style={{ '--mood-card-color': mood.color, '--mood-card-glow': mood.glow }}
                          className="mobile-journey-mood"
                          onClick={() => chooseMood(mood.key)}
                        >
                          <span>{mood.label}</span>
                          <small>{mood.description}</small>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {journeyStep === 'detail' && selectedMood && (
                  <div className="mobile-journey-panel">
                    <p className="mobile-journey-kicker">Step 2 of 3</p>
                    <h2>What kind of {selectedMood.label.toLowerCase()}?</h2>
                    <div className="mobile-journey-option-list">
                      {selectedOptions.map((option) => (
                        <button key={option.key} type="button" onClick={() => chooseDetail(option.key)}>
                          <span>{option.label}</span>
                          <small>{option.copy}</small>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {journeyStep === 'note' && selectedMood && selectedDetail && (
                  <div className="mobile-journey-panel">
                    <p className="mobile-journey-kicker">Step 3 of 3</p>
                    <h2>Tell it shortly</h2>
                    <p className="mobile-journey-copy">Max 50 characters. Keep it simple; the film will follow your mood and detail.</p>
                    <textarea
                      value={moodNote}
                      maxLength={50}
                      onChange={(event) => setMoodNote(event.target.value)}
                      placeholder="Type here..."
                      rows={2}
                    />
                    <div className="mobile-journey-note-actions">
                      <span>{moodNote.length}/50</span>
                      <button type="button" className="btn-primary" onClick={() => setJourneyStep('result')}>Find My Film</button>
                    </div>
                  </div>
                )}

                {journeyStep === 'result' && selectedMood && journeyMovie && (
                  <div className="mobile-journey-result" style={{ '--mood-card-color': selectedMood.color, '--mood-card-glow': selectedMood.glow }}>
                    <div className="mobile-journey-poster">
                      <img src={journeyMovie.poster} alt={journeyMovie.title} />
                    </div>
                    <div className="mobile-journey-result-copy">
                      <p className="mobile-journey-kicker">Your film match</p>
                      <h2>{journeyMovie.title}</h2>
                      <p>{selectedDetail?.copy || buildReason(journeyMovie, selectedMood.key)}</p>
                      <div className="mobile-journey-dalil">
                        <strong>{selectedMood.dalil}</strong>
                        <span>{selectedMood.dalilText}</span>
                      </div>
                      <div className="mobile-journey-result-actions">
                        <a href={`#/film/${encodeURIComponent(journeyMovie.id)}?mood=${selectedMood.key}`} className="btn-primary">Open Film</a>
                        <a href={`#/mood?mood=${selectedMood.key}`} className="btn-secondary">See More</a>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <div className="home-preview-card premium-card relative overflow-hidden p-3 lg:p-4 md:mx-auto md:max-w-md md:justify-self-center" data-scroll-reveal>
          <div className="cinematic-vibe-canvas" aria-hidden="true" />
          <div className="absolute inset-0 bg-gradient-to-br from-iim-gold/25 via-transparent to-iim-brown/20" />
          <div className="relative z-10 rounded-[1.75rem] bg-iim-charcoal p-4 text-iim-cream shadow-premium md:p-5">
            <div className="flex items-center gap-4">
              <img src={assetUrl('logo.png')} alt="Logo" className="h-14 w-14 shrink-0 rounded-3xl bg-iim-cream object-contain p-1 shadow-glow" />
              <div>
                <p className="text-xs font-extrabold tracking-[0.24em] text-iim-gold">{t.previewBrand}</p>
                <p className="mt-1 text-lg font-black md:text-xl">{t.moodTitle}</p>
              </div>
            </div>

            <div className="mt-5 rounded-3xl bg-white/5 p-3">
              <p className="mb-3 px-1 text-xs font-extrabold uppercase tracking-[0.24em] text-iim-gold">{t.moodTitle}</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {MOODS.map((mood, index) => <MoodCard key={mood.key} mood={mood} mini index={index} />)}
              </div>
            </div>

            <div className="mt-4 rounded-3xl border border-iim-gold/20 bg-iim-gold/10 p-4">
              <p className="text-sm font-extrabold text-iim-gold">{t.dalilTitle}</p>
              <p className="mt-2 text-xs leading-6 text-iim-sand">{t.dalilCopy}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="container-page py-10" data-scroll-reveal>
        <SectionTitle eyebrow={t.modelEyebrow} title={t.modelTitle} description={t.modelDesc} />
        <div className="grid gap-5 md:grid-cols-4">
          {[
            ['1', 'Mood Mapping', 'Pengguna memilih kondisi emosi awal sebagai pintu masuk literasi.'],
            ['2', 'Film Matching', 'Sistem mencocokkan mood dengan genre, sinopsis, rating, dan tag film.'],
            ['3', 'Dalil & Nilai', 'Setiap mood diberi penguatan pesan dakwah dan dalil singkat.'],
            ['4', 'Dakwah Reflection', 'Artikel dan AIMAN membantu pengguna membaca makna di balik tontonan.']
          ].map(([num, title, desc]) => (
            <div key={num} className="premium-card p-6">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-iim-coffee text-lg font-black text-iim-cream dark:bg-iim-gold dark:text-iim-charcoal">{num}</div>
              <h3 className="mt-5 text-xl font-extrabold">{title}</h3>
              <p className="mt-3 leading-7 text-iim-brown dark:text-iim-sand">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container-page py-10" data-scroll-reveal>
        <SectionTitle eyebrow={t.moodEyebrow} title={t.moodSectionTitle} description={t.moodSectionDesc} />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {MOODS.map((mood, index) => <MoodCard key={mood.key} mood={mood} compact index={index} />)}
        </div>
      </section>

      <section className="container-page py-10" data-scroll-reveal>
        <SectionTitle eyebrow={t.recEyebrow} title={t.recTitle} description={t.recDesc} />
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {featured.map((movie) => <FilmCard key={movie.id} movie={movie} mood="hidayah" />)}
        </div>
      </section>

      <section className="container-page py-10" data-scroll-reveal>
        <SectionTitle eyebrow={t.articleEyebrow} title={t.articleTitle} description={t.articleDesc} />
        <div className="grid gap-4 md:grid-cols-3">
          {featuredArticles.map((article) => <ArticleCard key={article.id} article={article} />)}
        </div>
        <div className="mt-6 text-center">
          <a href="#/articles" className="btn-secondary">{t.seeMore}</a>
        </div>
      </section>
    </div>
  );
}
