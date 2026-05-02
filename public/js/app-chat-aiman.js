// app-chat-iman.js v5.1 â€” IMAN IN MOTION (clean)
let MOVIES = [];
const $ = s => document.querySelector(s);

async function loadMovies(){
  const local = window.MOVIES_DATA || [];
  MOVIES = local.slice(0,200).map(m=>({
    title: m.title_asli,
    poster: m.poster_url || `https://via.placeholder.com/300x450/0f172a/94a3b8?text=${encodeURIComponent(m.title_asli)}`,
    year: m.year,
    mood: (m.mood||'tenang').toLowerCase(),
    genre: m.genres,
    overview: m.overview||''
  }));
  window.MOVIES = MOVIES;
  renderMovies(MOVIES.slice(0,24));
  console.log('âœ“ Loaded', MOVIES.length, 'films');
}

function renderMovies(list){
  const grid = $('#movieGrid') || $('#moviesGrid');
  if(!grid) return;
  grid.innerHTML = list.map(m=>`
    <div class="movie-card" onclick='openDetail(${JSON.stringify(m).replace(/'/g,"&#39;")})'>
      <img src="${m.poster}" alt="${m.title}" loading="lazy" onerror="this.src='logo.png'">
      <div class="movie-info"><h4>${m.title}</h4><p>${m.year}</p></div>
    </div>`).join('') || `<p style="padding:40px;text-align:center;color:var(--muted)">Film belum ada</p>`;
}

function openDetail(m){
  const modal = $('#detailModal'), body = $('#detailBody');
  if(!modal) return;
  body.innerHTML = `
    <div class="detail-grid">
      <img src="${m.poster}">
      <div>
        <h2>${m.title} (${m.year})</h2>
        <p style="color:var(--muted)">${m.genre} â€¢ Mood: ${m.mood}</p>
        <p>${m.overview}</p>
        <button class="btn-primary" onclick="closeDetail()">Tutup</button>
      </div>
    </div>`;
  modal.classList.remove('hidden');
}
const closeDetail = ()=> $('#detailModal')?.classList.add('hidden');

// Mood mapping
const MOOD_MAP = {
  sedih:'tenang', gelisah:'tenang', 'mencari hidayah':'tenang',
  bahagia:'semangat', marah:'tenang', rindu:'tenang'
};

function filterByMood(mood){
  const tag = MOOD_MAP[mood] || 'tenang';
  const filtered = MOVIES.filter(m=>m.mood===tag);
  renderMovies(filtered);
  $('#mood-heading') && ($('#mood-heading').textContent = `Film untuk: ${mood}`);
}

function setupMood(){
  document.querySelectorAll('.mood-card').forEach(btn=>{
    btn.onclick = ()=>{
      const mood = btn.dataset.mood.toLowerCase();
      localStorage.setItem('iman_last_mood', mood);
      if(!location.pathname.includes('mood.html')){
        location.href = `mood.html?mood=${encodeURIComponent(mood)}`;
      } else filterByMood(mood);
    };
  });
}

// Search
let searchTimer;
$('#searchInput')?.addEventListener('input', e=>{
  clearTimeout(searchTimer);
  searchTimer = setTimeout(()=>{
    const q = e.target.value.toLowerCase();
    renderMovies(MOVIES.filter(m=>m.title.toLowerCase().includes(q)).slice(0,48));
  },250);
});

document.addEventListener('DOMContentLoaded', async ()=>{
  await loadMovies();
  setupMood();
  const urlMood = new URLSearchParams(location.search).get('mood');
  if(urlMood && location.pathname.includes('mood')) {
    setTimeout(()=>filterByMood(urlMood.toLowerCase()),200);
  }
});
window.openDetail = openDetail;
window.closeDetail = closeDetail;

// === AIMAN CHAT PARSER ===
function parseAimanReply(text){
  const moodMatch = text.match(/\[MOOD:(.*?)\]/i);
  const filmMatch = text.match(/\[FILM:(.*?)\]/i);
  const cleanText = text.replace(/\[MOOD:.*?\]|\[FILM:.*?\]/gi,'').trim();

  let filmCard = '';
  if(filmMatch && window.MOVIES){
    const title = filmMatch[1].trim();
    const film = MOVIES.find(m => m.title.toLowerCase() === title.toLowerCase());
    if(film){
      filmCard = `
      <div class="aiman-film" onclick='openDetail(${JSON.stringify(film).replace(/'/g,"&#39;")})' style="margin-top:12px;display:flex;gap:10px;padding:10px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:12px;cursor:pointer">
        <img src="${film.poster}" style="width:48px;height:72px;object-fit:cover;border-radius:8px" onerror="this.src='logo.png'">
        <div><div style="font-weight:600;font-size:13px">${film.title}</div><div style="font-size:11px;color:var(--muted)">${film.year} â€¢ ${film.mood}</div><div style="font-size:11px;color:var(--accent)">â–¶ Tonton sekarang</div></div>
      </div>`;
    }
  }
  return {cleanText, mood: moodMatch?.[1], filmCard};
}

function mdToHtml(txt){
  return txt
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/_(.*?)_/g, '<em>$1</em>')
    .replace(/
/g, '<br>');
}

function renderAimanBubble(reply){
  const {cleanText, mood, filmCard} = parseAimanReply(reply);
  const bubble = document.createElement('div');
  bubble.className = 'chat-bubble aiman';
  bubble.innerHTML = `<p>${mdToHtml(cleanText)}</p>${filmCard}`;
  const box = document.querySelector('#chatBox');
  if(box) box.appendChild(bubble);
  if(mood) localStorage.setItem('iman_last_mood', mood.toLowerCase());
  bubble.scrollIntoView({behavior:'smooth'});
}

// expose untuk dipakai di chat.js kamu
window.renderAimanBubble = renderAimanBubble;