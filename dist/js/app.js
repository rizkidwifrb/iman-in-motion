import { filterAndSortMovies, movieCardTemplate, skeletonTemplate, emptyTemplate } from './recommendation.js';
import { initAimanWidget } from './aiman-widget.js';
import { initUiMotion, initActiveSectionState } from './ui-motion.js';

const MOODS = [
  { key: 'sedih', label: 'Sedih', icon: 'Sedih', desc: 'Reflektif dan menenangkan' },
  { key: 'gelisah', label: 'Gelisah', icon: 'Gelisah', desc: 'Pelan, teduh, dan stabil' },
  { key: 'hidayah', label: 'Hidayah', icon: 'Hidayah', desc: 'Iman, taubat, dan petunjuk' },
  { key: 'bahagia', label: 'Bahagia', icon: 'Bahagia', desc: 'Syukur, hangat, dan ringan' },
  { key: 'marah', label: 'Marah', icon: 'Marah', desc: 'Reda, adil, dan terkendali' },
  { key: 'rindu', label: 'Rindu', icon: 'Rindu', desc: 'Kenangan, cinta, dan pulang' }
];

let selectedMood = 'sedih';
let allMovies = [];

const byId = (id) => document.getElementById(id);
const escapeHtml = (value = '') => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

function moodLabel(key) {
  return MOODS.find((m) => m.key === key)?.label || key;
}

function canonicalMood(input = '') {
  const m = String(input).toLowerCase().trim();
  if (MOODS.some((x) => x.key === m)) return m;
  if (m === 'mencari-hidayah' || m === 'inspiratif') return 'hidayah';
  if (m === 'semangat') return 'bahagia';
  if (m === 'tenang') return 'gelisah';
  return 'sedih';
}

function toast(message) {
  const root = byId('toastContainer');
  if (!root) return;
  const node = document.createElement('div');
  node.className = 'toast';
  node.textContent = message;
  root.appendChild(node);
  setTimeout(() => node.remove(), 2200);
}
window.toast = window.toast || toast;

function updateMoodButtons() {
  document.querySelectorAll('[data-mood]').forEach((btn) => {
    const active = btn.dataset.mood === selectedMood;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-pressed', active ? 'true' : 'false');
  });
}

function renderMoodMessage() {
  const info = byId('reco-heading');
  if (info) info.textContent = `Mood terdeteksi: ${moodLabel(selectedMood)}. Ini rekomendasi film yang bisa menemani dan menenangkan hati.`;
}


function toYoutubeEmbedUrl(url = '') {
  const value = String(url || '').trim();
  if (!value) return '';
  const watchMatch = value.match(/[?&]v=([^&]+)/);
  const shortMatch = value.match(/youtu\.be\/([^?&/]+)/);
  const embedMatch = value.match(/youtube\.com\/embed\/([^?&/]+)/);
  const key = watchMatch?.[1] || shortMatch?.[1] || embedMatch?.[1] || '';
  return key ? `https://www.youtube.com/embed/${key}` : '';
}

async function getDirectTrailer(movie) {
  if (movie.trailer_url || movie.trailer) {
    const url = movie.trailer_url || movie.trailer;
    return { trailer_url: url, trailer_embed_url: movie.trailer_embed_url || toYoutubeEmbedUrl(url) };
  }
  const tmdbId = movie.tmdbId || movie.tmdb_id || movie.tmdb;
  if (!tmdbId) return null;
  const params = new URLSearchParams({ title: movie.title_asli || movie.title || '', year: movie.year || '' });
  const response = await fetch(`/api/trailer/${encodeURIComponent(tmdbId)}?${params.toString()}`);
  if (!response.ok) return null;
  return response.json();
}

function getRatingInfo(movie = {}) {
  const rating = Number(movie.rating || movie.vote_average || movie.tmdb_vote_average || 0);
  const voteCount = Number(movie.vote_count || movie.voteCount || 0);
  const source = String(movie.rating_source || movie.ratingSource || '').trim();
  const isTmdb = source.toLowerCase() === 'tmdb' || Number(movie.tmdb_vote_average || 0) > 0;
  if (!Number.isFinite(rating) || rating <= 0) {
    return { hasRating: false, label: 'Belum ada rating', meta: '' };
  }
  const label = `★ ${rating.toFixed(1)}/10${isTmdb ? ' TMDB' : ''}`;
  const meta = voteCount > 0 ? `${voteCount.toLocaleString('id-ID')} vote${voteCount < 25 ? ' · data terbatas' : ''}` : '';
  return { hasRating: true, label, meta };
}

async function getTmdbRating(movie) {
  const tmdbId = movie.tmdbId || movie.tmdb_id || movie.tmdb;
  if (!tmdbId) return null;
  if (String(movie.rating_source || '').toLowerCase() === 'tmdb' && movie.vote_count) return null;
  const response = await fetch(`/api/rating/${encodeURIComponent(tmdbId)}`);
  if (!response.ok) return null;
  return response.json();
}

function openModal(id) { byId(id)?.classList.remove('hidden'); }
function closeModal(id) { byId(id)?.classList.add('hidden'); }

function renderMovies() {
  const grid = byId('movieGrid');
  if (!grid) return;

  const search = byId('searchInput')?.value || '';
  const sort = byId('sortSelect')?.value || 'score';
  grid.innerHTML = skeletonTemplate(8);

  const movies = filterAndSortMovies(allMovies, selectedMood, search, sort).slice(0, 24);
  if (!movies.length) {
    grid.innerHTML = emptyTemplate();
    return;
  }

  grid.innerHTML = movies.map((m) => movieCardTemplate(m, moodLabel(selectedMood))).join('');
  grid.querySelectorAll('.movie-card').forEach((card, idx) => {
    const movie = movies[idx];
    card.addEventListener('click', () => openDetail(movie));
    card.addEventListener('keydown', (e) => { if (e.key === 'Enter') openDetail(movie); });
  });
}

function openDetail(movie) {
  const body = byId('detailBody');
  if (!body) return;

  const title = movie.title_asli || movie.title || 'Tanpa Judul';
  const poster = movie.poster_url || movie.poster || 'https://placehold.co/400x600/0d1413/b9d4ce?text=Poster';
  const ratingInfo = getRatingInfo(movie);
  const meta = [movie.year || '-', movie.genres || movie.genre || 'Drama', ratingInfo.label].join(' | ');

  body.innerHTML = `
    <div class="detail-grid">
      <img src="${escapeHtml(poster)}" alt="Poster ${escapeHtml(title)}" loading="lazy">
      <div>
        <h3 style="margin:0 0 8px">${escapeHtml(title)}</h3>
        <p style="margin:0 0 10px;color:var(--muted)">${escapeHtml(meta)}</p>
        <p id="ratingLiveMeta" style="margin:-4px 0 12px;color:var(--muted);font-size:12px;font-weight:700">${escapeHtml(ratingInfo.meta || (movie.tmdbId || movie.tmdb_id || movie.tmdb ? 'Sinkron rating TMDB...' : ''))}</p>
        <p style="line-height:1.65">${escapeHtml(movie.overview || 'Belum ada sinopsis.')}</p>
        <div id="trailerBox" style="margin:14px 0"><button class="btn" type="button" disabled>Mencari trailer...</button></div>
        <p class="reason"><strong>Kenapa direkomendasikan?</strong> ${escapeHtml(movie.reason || `Temanya sesuai dengan suasana ${moodLabel(selectedMood)} dan cocok untuk refleksi.`)}</p>
      </div>
    </div>
  `;
  openModal('detailModal');
  getTmdbRating(movie).then((data) => {
    if (!data?.rating) return;
    Object.assign(movie, data);
    const ratingLiveMeta = byId('ratingLiveMeta');
    const live = getRatingInfo(movie);
    if (ratingLiveMeta) ratingLiveMeta.textContent = live.meta || 'Rating disinkronkan dari TMDB.';
  });
  getDirectTrailer(movie).then((data) => {
    const box = byId('trailerBox');
    if (!box) return;
    if (data?.trailer_embed_url) {
      box.innerHTML = `
        <div class="trailer-inline" style="overflow:hidden;border-radius:18px;background:#000;aspect-ratio:16/9;box-shadow:0 18px 40px rgba(0,0,0,.24)">
          <iframe title="Trailer ${escapeHtml(title)}" src="${escapeHtml(data.trailer_embed_url)}" style="width:100%;height:100%;border:0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>
        </div>
        <p style="margin:8px 0 0;color:var(--muted);font-size:12px;font-weight:700">Trailer diputar langsung di IMAN IN MOTION.</p>
      `;
    } else if (data?.trailer_url) {
      box.innerHTML = `<button class="btn secondary" type="button" disabled>Trailer ditemukan, tapi embed belum tersedia</button>`;
    } else {
      box.innerHTML = '<button class="btn secondary" type="button" disabled>Trailer belum tersedia</button>';
    }
  });
}

async function loadMovies() {
  try {
    const r = await fetch('/api/movies');
    if (!r.ok) throw new Error('api unavailable');
    allMovies = await r.json();
  } catch (e) {
    allMovies = window.MOVIES_DATA || [];
    toast('Mode offline: memakai dataset lokal.');
  }
  renderMovies();
}

function initMoodUI() {
  const box = byId('quickMood');
  if (!box) return;
  box.innerHTML = MOODS.map((m) => `
    <button type="button" data-mood="${m.key}" aria-label="Pilih mood ${m.label}">
      <div style="font-weight:700">${m.icon}</div>
      <span class="mood-desc">${m.desc}</span>
    </button>
  `).join('');
  box.querySelectorAll('button').forEach((btn) => {
    btn.addEventListener('click', () => {
      selectedMood = btn.dataset.mood;
      updateMoodButtons();
      renderMoodMessage();
      renderMovies();
    });
  });
  updateMoodButtons();
}

function initSettings() {
  byId('settingsBtn')?.addEventListener('click', () => openModal('settingsModal'));
  byId('themeToggle')?.addEventListener('change', (e) => {
    document.documentElement.dataset.theme = e.target.checked ? 'light' : 'dark';
  });
  byId('fontSize')?.addEventListener('change', (e) => {
    document.documentElement.dataset.font = e.target.value;
  });
}

function initAuthModalHelpers() {
  window.closeAuth = () => closeModal('authModal');
  byId('loginEmail')?.addEventListener('click', () => openModal('authModal'));
}

function initModalClose() {
  document.querySelectorAll('[data-close-modal]').forEach((btn) => {
    btn.addEventListener('click', () => closeModal(btn.dataset.closeModal));
  });
  document.querySelectorAll('.modal').forEach((modal) => {
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.add('hidden'); });
  });
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') document.querySelectorAll('.modal:not(.hidden)').forEach((modal) => modal.classList.add('hidden'));
  });
}

function initSearchSort() {
  byId('searchInput')?.addEventListener('input', renderMovies);
  byId('sortSelect')?.addEventListener('change', renderMovies);
}

function initMoodQuery() {
  const moodParam = new URLSearchParams(window.location.search).get('mood');
  if (moodParam) selectedMood = canonicalMood(moodParam);
}

function initA11y() {
  byId('miniChatInput')?.setAttribute('aria-label', 'Input chat AIMAN');
  byId('searchInput')?.setAttribute('aria-label', 'Cari film');
  byId('menuToggle')?.setAttribute('aria-label', 'Buka navigasi');
}

document.addEventListener('DOMContentLoaded', () => {
  if (window.__IMAN_MODULAR_APP_READY__) return;
  window.__IMAN_MODULAR_APP_READY__ = true;

  initMoodQuery();
  initUiMotion();
  initActiveSectionState();
  initMoodUI();
  initSettings();
  initAuthModalHelpers();
  initModalClose();
  initSearchSort();
  initA11y();
  renderMoodMessage();
  initAimanWidget({
    onMoodDetected: (detectedMood) => {
      selectedMood = canonicalMood(detectedMood);
      updateMoodButtons();
      renderMoodMessage();
      renderMovies();
    }
  });
  loadMovies();
});