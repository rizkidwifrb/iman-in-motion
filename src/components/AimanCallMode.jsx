import { useEffect, useMemo, useRef, useState } from 'react';
import { Loader2, MessageCircle, Mic, MicOff, PhoneCall, PhoneOff, RotateCcw, Save, Square, X } from 'lucide-react';
import { createPortal } from 'react-dom';

const SpeechRecognitionApi = typeof window !== 'undefined'
  ? window.SpeechRecognition || window.webkitSpeechRecognition
  : null;

const MOOD_STYLES = {
  sedih: { label: 'Sedih', color: '#4F8FEA', soft: 'rgba(79,143,234,.28)' },
  gelisah: { label: 'Gelisah', color: '#9B6BFF', soft: 'rgba(155,107,255,.28)' },
  hidayah: { label: 'Hidayah', color: '#46C083', soft: 'rgba(70,192,131,.28)' },
  bahagia: { label: 'Bahagia', color: '#D7A948', soft: 'rgba(215,169,72,.30)' },
  marah: { label: 'Marah', color: '#E36B5B', soft: 'rgba(227,107,91,.26)' },
  rindu: { label: 'Rindu', color: '#29B7A9', soft: 'rgba(41,183,169,.28)' },
  tenang: { label: 'Tenang', color: '#C99648', soft: 'rgba(201,150,72,.28)' }
};

function getVoice() {
  if (typeof window === 'undefined' || !window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices?.() || [];
  return (
    voices.find((voice) => /id-ID|indonesian|bahasa/i.test(`${voice.lang} ${voice.name}`)) ||
    voices.find((voice) => /en-US|en-GB/i.test(voice.lang)) ||
    voices[0] ||
    null
  );
}

function hasArabic(text = '') {
  return /[\u0600-\u06FF]/.test(String(text));
}

function stripMeta(text = '') {
  return String(text || '')
    .replace(/\[MOOD:[^\]]*\]/gi, '')
    .replace(/\[FILM:[^\]]*\]/gi, '')
    .trim();
}

function cleanForSpeech(text = '') {
  const headingRe = /^(Dalil yang nyambung|Ayat Arab|Hadits Arab|Ayat Arab \/ Hadits Arab|Penguat hadits)$/i;
  const sectionRe = /^(Arti|Penjelasan singkat|Pemahaman dakwah|Langkah kecil)$/i;
  const lines = stripMeta(text)
    .replace(/\*\*/g, '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !hasArabic(line))
    .filter((line) => !headingRe.test(line));

  const selected = [];
  let capture = false;
  for (const line of lines) {
    if (sectionRe.test(line)) {
      capture = true;
      continue;
    }
    if (capture || selected.length < 3) selected.push(line);
    if (selected.join(' ').length > 360) break;
  }

  const joined = (selected.length ? selected : lines).join(' ')
    .replace(/\s+/g, ' ')
    .trim();

  const sentences = joined.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [joined];
  const tooLong = joined.length > 360 || sentences.length > 3;
  let limited = sentences.slice(0, tooLong ? 2 : 3).join(' ').trim();

  if (limited.length > 360) {
    const sliced = limited.slice(0, 360);
    const lastStop = Math.max(sliced.lastIndexOf('.'), sliced.lastIndexOf('!'), sliced.lastIndexOf('?'));
    limited = lastStop > 120 ? sliced.slice(0, lastStop + 1) : sliced.slice(0, Math.max(0, sliced.lastIndexOf(' '))).trim();
  }

  if (limited && !/[.!?]$/.test(limited)) limited += '.';
  const isDalilFormat = /Dalil yang nyambung|Ayat Arab|Hadits Arab|Arti|Pemahaman dakwah/i.test(stripMeta(text));
  if (tooLong || isDalilFormat) {
    limited = `${limited} Kalau mau lebih lengkap, tanya via chat yaa. Ada yang mau kamu tahu lagi?`;
  }
  return limited;
}

function summarizeText(text = '', maxSentences = 2) {
  const clean = stripMeta(text).replace(/\*\*/g, '').replace(/\s+/g, ' ').trim();
  const sentences = clean.match(/[^.!?]+[.!?]?/g) || [clean];
  return sentences.slice(0, maxSentences).join(' ').trim();
}

function speakText(text, onStart, onEnd) {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    onEnd?.();
    return null;
  }

  const clean = cleanForSpeech(text);
  if (!clean) {
    onEnd?.();
    return null;
  }

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(clean);
  utterance.lang = 'id-ID';
  utterance.rate = 1.02;
  utterance.pitch = 1.03;
  utterance.volume = 1;
  const voice = getVoice();
  if (voice) utterance.voice = voice;
  utterance.onstart = () => onStart?.();
  utterance.onend = () => onEnd?.();
  utterance.onerror = () => onEnd?.();
  window.speechSynthesis.speak(utterance);
  return utterance;
}

function normalizePayload(result) {
  if (typeof result === 'string') return { reply: result, mood: 'tenang', films: [], rag: [] };
  return {
    reply: result?.reply || result?.text || '',
    mood: result?.mood || 'tenang',
    films: result?.films || [],
    rag: result?.rag || []
  };
}

function extractDalil(rag = []) {
  const first = Array.isArray(rag) ? rag[0] : null;
  if (!first) return null;
  return {
    ref: first.ref || 'Dalil terkait',
    text: summarizeText(first.text || '', 2)
  };
}

function saveReflection(summary) {
  try {
    const existing = JSON.parse(localStorage.getItem('aiman_call_reflections') || '[]');
    const next = [{ ...summary, savedAt: new Date().toISOString() }, ...existing].slice(0, 20);
    localStorage.setItem('aiman_call_reflections', JSON.stringify(next));
    return true;
  } catch {
    return false;
  }
}

export default function AimanCallMode({ open, onClose, onSendVoice }) {
  const supported = useMemo(() => Boolean(SpeechRecognitionApi), []);
  const recognitionRef = useRef(null);
  const finalTranscriptRef = useRef('');
  const interimTranscriptRef = useRef('');
  const activeRef = useRef(false);
  const openRef = useRef(false);
  const autoTimerRef = useRef(null);
  const [status, setStatus] = useState('ready');
  const [interim, setInterim] = useState('');
  const [lastText, setLastText] = useState('');
  const [lastReply, setLastReply] = useState('');
  const [error, setError] = useState('');
  const [handsFree, setHandsFree] = useState(true);
  const [turns, setTurns] = useState([]);
  const [mood, setMood] = useState('tenang');
  const [suggestedFilm, setSuggestedFilm] = useState(null);
  const [dalil, setDalil] = useState(null);
  const [showSummary, setShowSummary] = useState(false);
  const [saved, setSaved] = useState(false);

  const moodStyle = MOOD_STYLES[mood] || MOOD_STYLES.tenang;

  const statusText = {
    ready: handsFree ? 'Siap ngobrol otomatis' : 'Siap mendengarkan',
    listening: 'AIMAN mendengarkan',
    thinking: 'AIMAN memahami',
    speaking: 'AIMAN berbicara',
    handoff: 'Giliran kamu bicara',
    unsupported: 'Voice belum didukung',
    error: 'Voice Belum Siap'
  }[status] || 'Siap mendengarkan';

  const guideText = supported
    ? handsFree
      ? 'Mode hands-free aktif. Setelah AIMAN selesai bicara, mic akan aktif lagi otomatis.'
      : 'Mode manual aktif. Tekan mic setiap kali kamu ingin bicara.'
    : 'Gunakan Chrome atau Edge untuk memakai voice mode.';

  const summary = useMemo(() => {
    const userTurns = turns.filter((turn) => turn.role === 'user').map((turn) => turn.content);
    const assistantTurns = turns.filter((turn) => turn.role === 'assistant').map((turn) => turn.content);
    return {
      mood,
      moodLabel: moodStyle.label,
      mainPoint: userTurns[0] ? summarizeText(userTurns[userTurns.length - 1], 1) : 'Belum ada percakapan suara yang tersimpan.',
      aimanPoint: assistantTurns[0] ? summarizeText(assistantTurns[assistantTurns.length - 1], 2) : 'AIMAN belum memberi respons suara.',
      film: suggestedFilm,
      dalil,
      turns
    };
  }, [turns, mood, moodStyle.label, suggestedFilm, dalil]);

  function clearAutoTimer() {
    if (autoTimerRef.current) window.clearTimeout(autoTimerRef.current);
    autoTimerRef.current = null;
  }

  useEffect(() => {
    openRef.current = open;
    if (!open) return undefined;
    setError('');
    setInterim('');
    setLastText('');
    setLastReply('');
    setTurns([]);
    setMood('tenang');
    setSuggestedFilm(null);
    setDalil(null);
    setShowSummary(false);
    setSaved(false);
    setStatus(supported ? 'ready' : 'unsupported');
    return () => {
      openRef.current = false;
      clearAutoTimer();
      activeRef.current = false;
      recognitionRef.current?.abort?.();
      window.speechSynthesis?.cancel?.();
    };
  }, [open, supported]);

  if (!open) return null;

  function stopListening() {
    activeRef.current = false;
    recognitionRef.current?.stop?.();
    setStatus('ready');
  }

  function scheduleAutoListen() {
    clearAutoTimer();
    if (!handsFree || !openRef.current || !supported || showSummary) {
      setStatus('ready');
      return;
    }
    setStatus('handoff');
    autoTimerRef.current = window.setTimeout(() => {
      if (!openRef.current || activeRef.current || showSummary) return;
      startListening();
    }, 850);
  }

  async function processTranscript(text) {
    const clean = text.trim();
    if (!clean) {
      scheduleAutoListen();
      return;
    }
    setLastText(clean);
    setTurns((current) => [...current, { role: 'user', content: clean }]);
    setInterim('');
    setStatus('thinking');
    try {
      const payload = normalizePayload(await onSendVoice(clean));
      const spokenReply = cleanForSpeech(payload.reply);
      const nextMood = payload.mood || 'tenang';
      setMood(nextMood);
      setSuggestedFilm(payload.films?.[0] || null);
      setDalil(extractDalil(payload.rag));
      setTurns((current) => [...current, { role: 'assistant', content: payload.reply, mood: nextMood }]);
      setLastReply(spokenReply || 'AIMAN sudah menjawab di chat.');
      setStatus('speaking');
      speakText(
        payload.reply,
        () => setStatus('speaking'),
        () => scheduleAutoListen()
      );
    } catch (err) {
      setError(err?.message || 'AIMAN belum bisa menjawab lewat voice. Coba lagi sebentar lagi.');
      setStatus('error');
    }
  }

  function startListening() {
    if (!supported) {
      setStatus('unsupported');
      return;
    }

    clearAutoTimer();
    window.speechSynthesis?.cancel?.();
    setError('');
    setSaved(false);
    setShowSummary(false);
    setInterim('');
    finalTranscriptRef.current = '';
    interimTranscriptRef.current = '';
    activeRef.current = true;

    const recognition = new SpeechRecognitionApi();
    recognition.lang = 'id-ID';
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setStatus('listening');
    recognition.onresult = (event) => {
      let interimText = '';
      let finalText = '';
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const transcript = event.results[i][0]?.transcript || '';
        if (event.results[i].isFinal) finalText += transcript;
        else interimText += transcript;
      }
      if (finalText) finalTranscriptRef.current += ` ${finalText}`;
      interimTranscriptRef.current = interimText;
      setInterim((finalTranscriptRef.current + ' ' + interimText).trim());
    };
    recognition.onerror = (event) => {
      activeRef.current = false;
      const message = event?.error === 'not-allowed'
        ? 'Izin mikrofon belum aktif. Izinkan akses mic di browser.'
        : 'Suara belum tertangkap. Coba ulangi lebih dekat ke mic.';
      setError(message);
      setStatus('error');
    };
    recognition.onend = () => {
      if (!activeRef.current) return;
      activeRef.current = false;
      const transcript = (finalTranscriptRef.current || interimTranscriptRef.current || '').trim();
      processTranscript(transcript);
    };

    recognitionRef.current = recognition;
    recognition.start();
  }

  function stopVoice() {
    window.speechSynthesis?.cancel?.();
    scheduleAutoListen();
  }

  function finishCall() {
    clearAutoTimer();
    activeRef.current = false;
    recognitionRef.current?.abort?.();
    window.speechSynthesis?.cancel?.();
    if (turns.length > 0 || lastText || lastReply) {
      setShowSummary(true);
      setStatus('ready');
    } else {
      closeCall();
    }
  }

  function closeCall() {
    openRef.current = false;
    clearAutoTimer();
    activeRef.current = false;
    recognitionRef.current?.abort?.();
    window.speechSynthesis?.cancel?.();
    onClose?.();
  }

  function restartCall() {
    clearAutoTimer();
    activeRef.current = false;
    recognitionRef.current?.abort?.();
    window.speechSynthesis?.cancel?.();
    setTurns([]);
    setLastText('');
    setLastReply('');
    setInterim('');
    setError('');
    setSuggestedFilm(null);
    setDalil(null);
    setShowSummary(false);
    setSaved(false);
    setStatus(supported ? 'ready' : 'unsupported');
  }

  function handleSaveReflection() {
    setSaved(saveReflection(summary));
  }

  const isListening = status === 'listening';
  const isThinking = status === 'thinking';
  const isSpeaking = status === 'speaking';
  const isHandoff = status === 'handoff';

  const overlayContent = (
    <div
      className={`aiman-call-overlay mood-${mood}`}
      role="dialog"
      aria-modal="true"
      aria-label="AIMAN Call Mode"
      style={{ '--aiman-call-accent': moodStyle.color, '--aiman-call-soft': moodStyle.soft }}
    >
      <div className="aiman-call-bg" />
      <button type="button" className="aiman-call-close" onClick={showSummary ? closeCall : finishCall} aria-label="Tutup call">
        <X size={18} />
      </button>

      <div className={`aiman-call-stage ${showSummary ? 'summary-mode' : ''}`}>
        {showSummary ? (
          <div className="aiman-call-summary">
            <div className="aiman-call-summary-head">
              <img src="/aiman-character.png" alt="Karakter AIMAN" />
              <div>
                <p className="aiman-call-eyebrow">Ringkasan Call</p>
                <h2>Refleksi selesai</h2>
                <span>Mood terdeteksi: {summary.moodLabel}</span>
              </div>
            </div>

            <div className="aiman-call-summary-grid">
              <div>
                <span>Inti obrolan</span>
                <p>{summary.mainPoint}</p>
              </div>
              <div>
                <span>Respons AIMAN</span>
                <p>{summary.aimanPoint}</p>
              </div>
              <div>
                <span>Saran film</span>
                <p>{summary.film?.title ? `${summary.film.title}${summary.film.year ? ` (${summary.film.year})` : ''}` : 'Belum ada saran film khusus dari call ini.'}</p>
              </div>
              <div>
                <span>Dalil atau arti singkat</span>
                <p>{summary.dalil ? `${summary.dalil.ref}: ${summary.dalil.text}` : 'Belum ada dalil khusus yang muncul dalam call ini.'}</p>
              </div>
            </div>

            <div className="aiman-call-summary-actions">
              <button type="button" onClick={closeCall} className="aiman-call-summary-btn primary">
                <MessageCircle size={17} />
                <span>Lanjut chat</span>
              </button>
              <button type="button" onClick={handleSaveReflection} className="aiman-call-summary-btn">
                <Save size={17} />
                <span>{saved ? 'Tersimpan' : 'Simpan refleksi'}</span>
              </button>
              <button type="button" onClick={restartCall} className="aiman-call-summary-btn">
                <RotateCcw size={17} />
                <span>Telepon lagi</span>
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className={`aiman-call-character ${isListening ? 'listening' : ''} ${isThinking ? 'thinking' : ''} ${isSpeaking ? 'speaking' : ''} ${isHandoff ? 'handoff' : ''}`}>
              <span className="aiman-call-ring one" />
              <span className="aiman-call-ring two" />
              <img src="/aiman-character.png" alt="Karakter AIMAN" />
            </div>

            <div className="aiman-call-copy">
              <p className="aiman-call-eyebrow">AIMAN Call v2.0</p>
              <h2>{statusText}</h2>
              <p>{guideText}</p>
            </div>

            <div className="aiman-call-toggle" aria-label="Mode call">
              <button type="button" className={handsFree ? 'active' : ''} onClick={() => setHandsFree(true)}>Hands-free</button>
              <button type="button" className={!handsFree ? 'active' : ''} onClick={() => setHandsFree(false)}>Manual</button>
            </div>

            <div className="aiman-call-transcript">
              <span className="aiman-call-transcript-label">Kamu</span>
              <p>{interim || lastText || 'Belum ada suara yang tertangkap.'}</p>
            </div>

            {(isSpeaking || isHandoff || lastReply) && (
              <div className="aiman-call-subtitle">
                <span className="aiman-call-transcript-label">AIMAN</span>
                <p>{lastReply || 'AIMAN sedang menyiapkan jawaban.'}</p>
              </div>
            )}

            {error && <p className="aiman-call-error">{error}</p>}

            <div className={`aiman-call-wave ${isListening || isSpeaking || isThinking ? 'active' : ''}`} aria-hidden="true">
              <span /><span /><span /><span /><span />
            </div>

            <div className="aiman-call-actions">
              <button
                type="button"
                className={`aiman-call-action secondary ${isSpeaking ? 'active' : ''}`}
                onClick={stopVoice}
                aria-label="Hentikan suara AIMAN"
              >
                <Square size={21} />
              </button>
              <button
                type="button"
                className={`aiman-call-action primary ${isListening || isThinking || isHandoff ? 'active' : ''}`}
                onClick={isListening ? stopListening : startListening}
                disabled={!supported || isThinking || isSpeaking}
                aria-label={isListening ? 'Berhenti mendengarkan' : 'Mulai bicara'}
              >
                {isThinking ? <Loader2 size={26} className="animate-spin" /> : isListening ? <MicOff size={28} /> : <Mic size={28} />}
              </button>
              <button type="button" className="aiman-call-action danger" onClick={finishCall} aria-label="Akhiri call">
                <PhoneOff size={23} />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );

  return createPortal(overlayContent, document.body);
}
