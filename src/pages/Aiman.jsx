import { useEffect, useMemo, useRef, useState } from 'react';
import { Copy, ExternalLink, PhoneCall, Send } from 'lucide-react';
import { sendAimanMessage } from '../services/api';
import AimanCallMode from '../components/AimanCallMode';
import { assetUrl } from '../utils/assetUrl';

function readParams() {
  return new URLSearchParams(window.location.hash.split('?')[1] || '');
}

function cleanReply(text = '') {
  return String(text)
    .replace(/\[MOOD:[^\]]*\]/gi, '')
    .replace(/\[FILM:[^\]]*\]/gi, '')
    .trim();
}

function looksArabic(text = '') {
  return /[\u0600-\u06FF]/.test(text);
}

function formatContent(text = '') {
  const cleaned = cleanReply(text);
  return cleaned.split('\n').filter(Boolean).map((line, index) => {
    const simple = line.replace(/\*\*/g, '').trim();
    const isHeading = /^(Dalil yang nyambung|Dalil Al-Qur'an|Ayat Arab \/ Hadits Arab|Hadis terkait|Arti|Sumber|Status|Maknanya|Penjelasan singkat|Pemahaman dakwah|Langkah kecil|Penguat hadits)$/i.test(simple);
    const arabic = looksArabic(simple);
    return (
      <p
        key={index}
        className={`mb-3 last:mb-0 ${isHeading ? 'font-black text-iim-gold tracking-tight' : ''} ${arabic ? 'text-right font-semibold leading-10 md:text-[1.18rem]' : ''}`}
        dir={arabic ? 'rtl' : 'ltr'}
      >
        {simple}
      </p>
    );
  });
}

function resolveAssetPath(value = '') {
  if (!value) return '';
  if (/^https?:\/\//i.test(value) || value.startsWith('#')) return value;
  return assetUrl(value.replace(/^\/+/, ''));
}

function initials(value = '') {
  return String(value || 'AIMAN')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join('') || 'AI';
}

function copyToClipboard(text = '') {
  if (!text) return;
  navigator.clipboard?.writeText(text).catch(() => {});
}

function AimanMetaCard({ card }) {
  const image = resolveAssetPath(card.image || '');
  return (
    <article className="aiman-meta-card">
      {image ? (
        <img src={image} alt={card.title || 'AIMAN card'} className="aiman-meta-image" loading="lazy" />
      ) : (
        <div className="aiman-meta-fallback">{initials(card.title)}</div>
      )}
      <div className="min-w-0 flex-1">
        <p className="aiman-meta-type">{card.type || 'Info'}</p>
        <h3>{card.title}</h3>
        {card.subtitle && <p className="aiman-meta-subtitle">{card.subtitle}</p>}
        {card.description && <p className="aiman-meta-desc">{card.description}</p>}
        {card.links?.length ? (
          <div className="aiman-meta-links">
            {card.links.map((link) => (
              <a key={`${card.title}-${link.label}`} href={resolveAssetPath(link.url)} target={link.url?.startsWith('http') ? '_blank' : undefined} rel={link.url?.startsWith('http') ? 'noopener noreferrer' : undefined}>
                {link.label}
                <ExternalLink size={12} />
              </a>
            ))}
          </div>
        ) : null}
      </div>
    </article>
  );
}

function DalilCard({ card }) {
  const copyText = [card.title, card.arabic, card.transliteration, card.translation, card.source, card.grade, card.explanation].filter(Boolean).join('\n');
  return (
    <article className={`aiman-dalil-card ${card.type === 'hadith' ? 'hadith' : 'quran'}`}>
      <div className="aiman-dalil-head">
        <div>
          <p>{card.label || (card.type === 'hadith' ? 'Hadis' : "Al-Qur'an")}</p>
          <h3>{card.title || card.source}</h3>
        </div>
        <button type="button" onClick={() => copyToClipboard(copyText)} aria-label="Salin dalil">
          <Copy size={14} />
        </button>
      </div>
      {card.arabic && <p className="aiman-dalil-arabic" dir="rtl">{card.arabic}</p>}
      {card.transliteration && <p className="aiman-dalil-translit">{card.transliteration}</p>}
      {card.translation && <p className="aiman-dalil-translation">{card.translation}</p>}
      <div className="aiman-dalil-foot">
        {card.source && <span>Sumber: {card.source}</span>}
        {card.grade && <span>Status: {card.grade}</span>}
      </div>
      {card.explanation && <p className="aiman-dalil-explanation">{card.explanation}</p>}
    </article>
  );
}

function SourceLinks({ sources = [] }) {
  if (!sources.length) return null;
  return (
    <div className="aiman-source-links">
      <span>Sumber:</span>
      {sources.map((source) => (
        <a key={`${source.label}-${source.url}`} href={resolveAssetPath(source.url)} target={source.url?.startsWith('http') ? '_blank' : undefined} rel={source.url?.startsWith('http') ? 'noopener noreferrer' : undefined}>
          {source.label}
        </a>
      ))}
    </div>
  );
}

const characterAvatar = assetUrl('aiman-character.png');
const defaultIntro = 'Assalamualaikum. Aku AIMAN. Ceritain aja pelan-pelan kondisi hati kamu. Kalau kamu minta dalil, aku usahakan kasih ayat atau hadits Arab, artinya, lalu penjelasan dan pemahaman dakwahnya dengan bahasa yang mudah dipahami.';
const defaultFollowUp = 'Hai! Apa yang sedang terjadi dalam hati kamu? Kamu ingin berbicara tentang sesuatu?';

export default function Aiman() {
  const params = useMemo(() => readParams(), []);
  const mood = params.get('mood') || '';
  const film = params.get('film') || '';
  const initial = film ? `Aku mau refleksi tentang film ${film}${mood ? ` untuk mood ${mood}` : ''}.` : '';
  const [messages, setMessages] = useState([
    { role: 'assistant', content: defaultIntro },
    { role: 'user', content: 'Hai aiman' },
    { role: 'assistant', content: defaultFollowUp }
  ]);
  const [input, setInput] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [callOpen, setCallOpen] = useState(false);
  const boxRef = useRef(null);
  const endRef = useRef(null);
  const textareaRef = useRef(null);

  function scrollToLatest(behavior = 'smooth') {
    requestAnimationFrame(() => {
      if (boxRef.current) {
        boxRef.current.scrollTo({ top: boxRef.current.scrollHeight + 9999, behavior });
      }
      endRef.current?.scrollIntoView({ behavior, block: 'end' });
    });
  }

  useEffect(() => {
    scrollToLatest('auto');
    const timer = setTimeout(() => scrollToLatest('auto'), 180);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    scrollToLatest('smooth');
    const timer = setTimeout(() => scrollToLatest('auto'), 120);
    return () => clearTimeout(timer);
  }, [messages, loading]);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  async function sendToAiman(text, { clearInput = false, voiceMode = false } = {}) {
    const clean = text.trim();
    if (!clean || loading) return '';
    const next = [...messages, { role: 'user', content: clean }];
    setMessages(next);
    if (clearInput) setInput('');
    setLoading(true);
    scrollToLatest('auto');
    try {
      const data = await sendAimanMessage(clean, next.slice(-8), voiceMode ? { mode: 'voice' } : {});
      const reply = data.reply || data.answer || data.text || 'Aku dengerin. Coba ceritain sedikit lagi biar aku bisa nangkep konteksnya.';
      const cleanText = cleanReply(reply);
      setMessages((current) => [...current, {
        role: 'assistant',
        content: cleanText,
        films: data.films || [],
        mood: data.mood,
        cards: data.cards || [],
        dalilCards: data.dalilCards || [],
        sources: data.sources || [],
        intent: data.intent || ''
      }]);
      return { reply: cleanText, mood: data.mood, films: data.films || [], rag: data.rag || [], cards: data.cards || [], dalilCards: data.dalilCards || [] };
    } catch (error) {
      const errorText = error.message || 'AIMAN belum bisa terhubung. Pastikan backend sudah jalan dengan npm start dan GROQ_API_KEY sudah ada di .env.';
      setMessages((current) => [...current, { role: 'assistant', content: errorText }]);
      throw new Error(errorText);
    } finally {
      setLoading(false);
    }
  }

  async function handleSend(e) {
    e?.preventDefault?.();
    const text = input.trim();
    if (!text || loading) return;
    await sendToAiman(text, { clearInput: true });
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  }

  const quickPrompts = [
    'Aiman, kampus Islam yang bagus buat belajar dakwah di mana?',
    'Aiman, siapa yang buat kamu?',
    'Siapa dosen pembimbing project ini?',
    'Kasih aku dalil tentang sabar lengkap arab dan artinya.'
  ];

  return (
    <section className="aiman-page">
      <div className="aiman-shell">
        <aside className="aiman-side">
          <a href="#/" className="flex items-center gap-3">
            <img src={characterAvatar} alt="Karakter AIMAN" className="h-14 w-14 rounded-[1.15rem] object-contain p-1.5 shadow-glow" />
            <div>
              <p className="text-sm font-black tracking-[0.18em] text-white">AIMAN</p>
              <p className="text-xs font-semibold text-white/55">Teman ngobrol reflektif</p>
            </div>
          </a>

          <button
            type="button"
            onClick={() => setCallOpen(true)}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-3xl border border-iim-gold/30 bg-iim-gold px-4 py-3 text-sm font-black text-iim-charcoal shadow-glow transition hover:-translate-y-0.5"
          >
            <PhoneCall size={17} />
            <span>Telepon AIMAN</span>
          </button>

          <div className="mt-4 rounded-3xl border border-white/10 bg-white/[0.06] p-5">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-iim-gold">Mulai ngobrol</p>
            <div className="mt-4 grid gap-2">
              {quickPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => {
                    setInput(prompt);
                    textareaRef.current?.focus();
                  }}
                  className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-left text-sm font-semibold leading-6 text-white/80 transition hover:border-iim-gold hover:text-iim-gold"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 rounded-3xl border border-iim-gold/20 bg-iim-gold/10 p-5 text-sm leading-7 text-white/70">
            <p className="font-extrabold text-iim-gold">Catatan aman</p>
            <p className="mt-2">Kalau kondisi terasa sangat berat atau tidak aman, hubungi orang terdekat atau bantuan profesional. AIMAN menemani refleksi, bukan menggantikan ahli.</p>
          </div>
        </aside>

        <main className="aiman-chat-panel">
          <header className="aiman-chat-header">
            <div className="flex min-w-0 items-center gap-3">
              <img src={characterAvatar} alt="AIMAN" className="h-11 w-11 rounded-2xl object-contain p-1" />
              <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-[0.26em] text-iim-gold">AIMAN Chat</p>
                <h1 className="mt-1 truncate text-2xl font-black text-white md:text-3xl">Ruang ngobrol yang tenang.</h1>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setCallOpen(true)}
              className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-xs font-bold text-white/80 transition hover:border-iim-gold hover:text-iim-gold sm:inline-flex"
            >
              <PhoneCall size={14} />
              <span>Telepon AIMAN</span>
            </button>
          </header>

          <div ref={boxRef} className="aiman-messages">
            {messages.map((message, index) => (
              <div key={index} className={`aiman-row ${message.role === 'user' ? 'user' : 'assistant'}`}>
                {message.role === 'assistant' && (
                  <div className="aiman-avatar"><img src={characterAvatar} alt="AIMAN" /></div>
                )}
                <div className="aiman-bubble">
                  <div className="text-sm leading-7 md:text-[15px]">{formatContent(message.content)}</div>
                  {message.dalilCards?.length ? (
                    <div className="aiman-dalil-grid">
                      {message.dalilCards.map((card, cardIndex) => (
                        <DalilCard key={`${card.title || card.source}-${cardIndex}`} card={card} />
                      ))}
                    </div>
                  ) : null}
                  {message.cards?.length ? (
                    <div className="aiman-meta-grid">
                      {message.cards.map((card, cardIndex) => (
                        <AimanMetaCard key={`${card.title}-${cardIndex}`} card={card} />
                      ))}
                    </div>
                  ) : null}
                  <SourceLinks sources={message.sources || []} />
                  {message.films?.length ? (
                    <div className="mt-4 grid gap-2 sm:grid-cols-2">
                      {message.films.slice(0, 2).map((filmItem) => (
                        <a key={filmItem.title} href={`#/film?mood=${message.mood || ''}`} className="rounded-2xl border border-iim-gold/20 bg-iim-gold/10 p-3 text-xs font-bold text-iim-cream transition hover:border-iim-gold">
                          {filmItem.title} {filmItem.year ? `(${filmItem.year})` : ''}
                        </a>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
            {loading && (
              <div className="aiman-row assistant">
                <div className="aiman-avatar"><img src={characterAvatar} alt="AIMAN" /></div>
                <div className="aiman-bubble typing"><span /> <span /> <span /></div>
              </div>
            )}
            <div ref={endRef} className="h-1" aria-hidden="true" />
          </div>

          <form onSubmit={handleSend} className="aiman-input-wrap">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Tulis perasaan kamu di sini..."
              rows={1}
            />
            <button type="submit" disabled={loading || !input.trim()} aria-label="Kirim pesan">
              <Send size={18} />
            </button>
          </form>
        </main>
      </div>

      <button type="button" className="aiman-mobile-call-button" onClick={() => setCallOpen(true)}>
        <PhoneCall size={17} />
        <span>Telepon AIMAN</span>
      </button>

      <AimanCallMode open={callOpen} onClose={() => setCallOpen(false)} onSendVoice={(text) => sendToAiman(text, { voiceMode: true })} />
    </section>
  );
}
