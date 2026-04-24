// IMAN IN MOTION — app.js v2 (PRO)
'use strict';

// === DATA DALIL (fallback offline) ===
const DALIL = {
  "Sedih": { arab:"فَإِنَّ مَعَ الْعُسْرِ يُسْرًا", arti:"Maka sesungguhnya bersama kesulitan ada kemudahan.", sumber:"QS. Al-Insyirah 94:5-6", keywords:["sedih","berat"] },
  "Gelisah": { arab:"أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ", arti:"Ingatlah, hanya dengan mengingat Allah hati menjadi tenteram.", sumber:"QS. Ar-Ra'd 13:28", keywords:["gelisah","tenang"] },
  "Mencari Hidayah": { arab:"ذَٰلِكَ الْكِتَابُ لَا رَيْبَ فِيهِ هُدًى لِلْمُتَّقِينَ", arti:"Kitab ini tidak ada keraguan padanya; petunjuk bagi yang bertakwa.", sumber:"QS. Al-Baqarah 2:2", keywords:["hidayah","iman"] },
  "Bahagia": { arab:"لَئِن شَكَرْتُمْ لَأَزِيدَنَّكُمْ", arti:"Jika kamu bersyukur, niscaya Aku akan tambah nikmat-Ku.", sumber:"QS. Ibrahim 14:7", keywords:["bahagia","syukur"] },
  "Marah": { arab:"وَالْكَاظِمِينَ الْغَيْظَ وَالْعَافِينَ عَنِ النَّاسِ", arti:"Orang yang menahan amarah dan memaafkan.", sumber:"QS. Ali Imran 3:134", keywords:["marah","sabar"] },
  "Rindu": { arab:"وَجَعَلَ بَيْنَكُم مَّوَدَّةً وَرَحْمَةً", arti:"Dijadikan di antara kamu rasa kasih dan sayang.", sumber:"QS. Ar-Rum 30:21", keywords:["rindu","cinta"] }
};

// === UTILITIES ===
const $ = (s, el=document) => el.querySelector(s);
const $$ = (s, el=document) => [...el.querySelectorAll(s)];
const debounce = (fn, ms=250) => { let t; return (...a)=>{ clearTimeout(t); t=setTimeout(()=>fn(...a),ms) } };
const toast = (msg) => window.toast? window.toast(msg) : console.log(msg);

// === RENDER MOVIES ===
const grid = $('#movieGrid');
const MOVIES = window.MOVIES || [];

function createCard(m){
  const card = document.createElement('article');
  card.className = 'movie-card';
  card.tabIndex = 0;
  card.setAttribute('role','button');
  card.setAttribute('aria-label', `Buka detail ${m.title}`);

  const img = document.createElement('img');
  img.loading = 'lazy';
  img.decoding = 'async';
  img.src = m.poster || 'https://via.placeholder.com/300x450?text=No+Image';
  img.alt = m.title;
  img.onerror = () => img.src = 'https://via.placeholder.com/300x450?text=No+Image';

  card.innerHTML = `
    <div class="movie-info">
      <h4>${m.title}</h4>
      <p>${m.year || ''} • ${(m.genres||'').split('|')[0] || 'Drama'}</p>
    </div>`;
  card.prepend(img);

  const open = () => openDetail(m);
  card.onclick = open;
  card.onkeydown = e => { if(e.key==='Enter'||e.key===' ') { e.preventDefault(); open(); } };

  return card;
}

function renderMovies(list){
  if(!grid) return;
  grid.innerHTML = '';
  const frag = document.createDocumentFragment();
  list.slice(0, 24).forEach(m => frag.appendChild(createCard(m)));
  grid.appendChild(frag);

  // simpan last render
  localStorage.setItem('iman_last_count', String(list.length));
}

// Initial render dengan skeleton fade
window.addEventListener('DOMContentLoaded', () => {
  setTimeout(()=> renderMovies(MOVIES), 300);
});

// === MOOD CLICK ===
$$('.mood-card').forEach(btn => {
  btn.addEventListener('click', () => {
    const mood = btn.dataset.mood;
    // simpan mood terakhir
    localStorage.setItem('iman_last_mood', mood);
    // animasi active
    $$('.mood-card').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    // haptic feedback
    navigator.vibrate?.(10);
    // pindah dengan transisi
    document.body.style.opacity = '0.96';
    setTimeout(()=> location.href = `mood.html?mood=${encodeURIComponent(mood)}`, 120);
  });
});

// restore last mood highlight
const lastMood = localStorage.getItem('iman_last_mood');
if(lastMood){ $(`.mood-card[data-mood="${lastMood}"]`)?.classList.add('active'); }

// === SEARCH (debounced) ===
const searchInput = $('#searchInput');
if(searchInput){
  const doSearch = debounce(() => {
    const q = searchInput.value.trim().toLowerCase();
    if(!q) return renderMovies(MOVIES);
    const filtered = MOVIES.filter(m =>
      m.title.toLowerCase().includes(q) ||
      (m.overview||'').toLowerCase().includes(q) ||
      (m.genres||'').toLowerCase().includes(q)
    );
    renderMovies(filtered);
    if(filtered.length === 0) toast('Film tidak ditemukan');
  }, 250);

  searchInput.addEventListener('input', doSearch);
  // shortcut "/" untuk fokus search
  window.addEventListener('keydown', e => {
    if(e.key === '/' && document.activeElement!== searchInput){
      e.preventDefault(); searchInput.focus();
    }
  });
}

// === CHAT WIDGET ===
window.toggleChat = function(){
  const w = $('#chatWidget');
  const isCollapsed = w.classList.toggle('collapsed');
  $('.chat-header')?.setAttribute('aria-expanded', String(!isCollapsed));
  localStorage.setItem('iman_chat_open', String(!isCollapsed));
};

// restore chat state
if(localStorage.getItem('iman_chat_open') === 'true'){
  $('#chatWidget')?.classList.remove('collapsed');
}

// addMsg dipakai oleh chat-backend.js
window.addMsg = function(t, cls='bot'){
  const wrap = $('#chatMessages');
  if(!wrap) return;
  const div = document.createElement('div');
  div.className = `msg ${cls}`;
  div.textContent = t;
  wrap.appendChild(div);
  const body = $('#chatBody');
  body.scrollTop = body.scrollHeight;
  // animasi kecil
  div.animate([{opacity:0, transform:'translateY(4px)'},{opacity:1, transform:'none'}], {duration:180, easing:'ease-out'});
};

// === DETAIL MODAL ===
window.openDetail = function(m){
  if(!m) m = MOVIES[Math.floor(Math.random()*MOVIES.length)];
  const body = $('#detailBody');
  if(!body) return;

  const netflix = m.netflix || {available:false, url:`https://www.netflix.com/search?q=${encodeURIComponent(m.title)}`};

  body.innerHTML = `
    <div class="detail-grid">
      <img src="${m.poster}" alt="${m.title}" loading="lazy" onerror="this.src='https://via.placeholder.com/300x450'">
      <div>
        <h2 id="detailTitle" style="margin:0 0 8px">${m.title} <span style="color:var(--muted);font-weight:500">(${m.year||''})</span></h2>
        <div style="color:var(--muted);font-size:14px;margin-bottom:12px">${m.genres||'Drama'} • ⭐ ${m.rating||'-'}</div>
        <p style="line-height:1.7;color:var(--text-2)">${m.overview || 'Film dakwah pilihan untuk menguatkan iman dan menenangkan hati.'}</p>

        <div class="netflix-box">
          <h4 style="margin:0 0 6px">Nonton Legal</h4>
          <p style="margin:0;color:var(--muted);font-size:13px">IMAN IN MOTION hanya merekomendasikan, bukan streaming.</p>
          ${netflix.available
           ? `<a href="${netflix.url}" target="_blank" rel="noopener" class="btn-watch" style="margin-top:12px">Buka di Netflix</a>`
            : `<a href="${netflix.url}" target="_blank" rel="noopener" class="btn-ghost" style="margin-top:12px">Cari di Platform</a>`
          }
        </div>
        <div style="display:flex;gap:8px;margin-top:18px">
          <button class="btn-ghost" onclick="closeDetail()">Tutup</button>
          <button class="btn-primary" onclick="navigator.share? navigator.share({title:'${m.title}',url:location.href}) : toast('Link disalin')">Bagikan</button>
        </div>
      </div>
    </div>`;

  $('#detailModal').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
};

window.closeDetail = function(){
  $('#detailModal')?.classList.add('hidden');
  document.body.style.overflow = '';
};

// tutup modal pakai ESC
window.addEventListener('keydown', e => {
  if(e.key === 'Escape') closeDetail();
});

// === HERO RANDOMIZER (biar nggak bosen) ===
function randomHero(){
  if(!MOVIES.length) return;
  const pick = MOVIES.filter(m=>m.rating>6).sort(()=>.5-Math.random())[0] || MOVIES[0];
  const title = $('#heroTitle'), poster = $('#heroPoster'), overview = $('.overview');
  if(title) title.textContent = pick.title;
  if(poster) poster.src = pick.poster;
  if(overview) overview.textContent = (pick.overview||'').slice(0,140) + '...';
  const btn = $('.btn-watch'); if(btn) btn.onclick = ()=>openDetail(pick);
}
setTimeout(randomHero, 800);

// === INIT ===
if(window.innerWidth < 700 &&!localStorage.getItem('iman_chat_open')){
  $('#chatWidget')?.classList.add('collapsed');
}

// expose untuk debug
window.IMAN = { DALIL, renderMovies, openDetail };