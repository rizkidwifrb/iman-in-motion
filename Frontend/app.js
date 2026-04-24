// data mood -> dalil
const DALIL = {
  "Sedih": {
    arab: "ÙÙŽØ¥ÙÙ†ÙŽÙ‘ Ù…ÙŽØ¹ÙŽ Ø§Ù„Ù’Ø¹ÙØ³Ù’Ø±Ù ÙŠÙØ³Ù’Ø±Ù‹Ø§",
    arti: "Maka sesungguhnya bersama kesulitan ada kemudahan.",
    sumber: "QS. Al-Insyirah 94:5-6",
    keywords: ["sedih","berat","drama"]
  },
  "Gelisah": {
    arab: "Ø£ÙŽÙ„ÙŽØ§ Ø¨ÙØ°ÙÙƒÙ’Ø±Ù Ø§Ù„Ù„ÙŽÙ‘Ù‡Ù ØªÙŽØ·Ù’Ù…ÙŽØ¦ÙÙ†ÙÙ‘ Ø§Ù„Ù’Ù‚ÙÙ„ÙÙˆØ¨Ù",
    arti: "Ingatlah, hanya dengan mengingat Allah hati menjadi tenteram.",
    sumber: "QS. Ar-Ra'd 13:28",
    keywords: ["gelisah","tenang","religious"]
  },
  "Mencari Hidayah": {
    arab: "Ø°ÙŽÙ°Ù„ÙÙƒÙŽ Ø§Ù„Ù’ÙƒÙØªÙŽØ§Ø¨Ù Ù„ÙŽØ§ Ø±ÙŽÙŠÙ’Ø¨ÙŽ Û› ÙÙÙŠÙ‡Ù Û› Ù‡ÙØ¯Ù‹Ù‰ Ù„ÙÙ‘Ù„Ù’Ù…ÙØªÙŽÙ‘Ù‚ÙÙŠÙ†ÙŽ",
    arti: "Kitab (Al-Qur'an) ini tidak ada keraguan padanya; petunjuk bagi mereka yang bertakwa.",
    sumber: "QS. Al-Baqarah 2:2",
    keywords: ["hidayah","islam","iman","religious"]
  },
  "Bahagia": {
    arab: "Ù„ÙŽØ¦ÙÙ† Ø´ÙŽÙƒÙŽØ±Ù’ØªÙÙ…Ù’ Ù„ÙŽØ£ÙŽØ²ÙÙŠØ¯ÙŽÙ†ÙŽÙ‘ÙƒÙÙ…Ù’",
    arti: "Sesungguhnya jika kamu bersyukur, niscaya Aku akan menambah (nikmat) kepadamu.",
    sumber: "QS. Ibrahim 14:7",
    keywords: ["bahagia","syukur","family","love"]
  },
  "Marah": {
    arab: "ÙˆÙŽØ§Ù„Ù’ÙƒÙŽØ§Ø¸ÙÙ…ÙÙŠÙ†ÙŽ Ø§Ù„Ù’ØºÙŽÙŠÙ’Ø¸ÙŽ ÙˆÙŽØ§Ù„Ù’Ø¹ÙŽØ§ÙÙÙŠÙ†ÙŽ Ø¹ÙŽÙ†Ù Ø§Ù„Ù†ÙŽÙ‘Ø§Ø³Ù",
    arti: "Dan orang-orang yang menahan amarahnya dan memaafkan (kesalahan) orang lain.",
    sumber: "QS. Ali Imran 3:134",
    keywords: ["marah","sabar","history","war"]
  },
  "Rindu": {
    arab: "ÙˆÙŽÙ…ÙÙ†Ù’ Ø¢ÙŠÙŽØ§ØªÙÙ‡Ù Ø£ÙŽÙ†Ù’ Ø®ÙŽÙ„ÙŽÙ‚ÙŽ Ù„ÙŽÙƒÙÙ… Ù…ÙÙ‘Ù†Ù’ Ø£ÙŽÙ†ÙÙØ³ÙÙƒÙÙ…Ù’ Ø£ÙŽØ²Ù’ÙˆÙŽØ§Ø¬Ù‹Ø§ Ù„ÙÙ‘ØªÙŽØ³Ù’ÙƒÙÙ†ÙÙˆØ§ Ø¥ÙÙ„ÙŽÙŠÙ’Ù‡ÙŽØ§",
    arti: "Dan di antara tanda-tanda-Nya ialah Dia menciptakan pasangan-pasangan untukmu agar kamu merasa tenteram kepadanya.",
    sumber: "QS. Ar-Rum 30:21",
    keywords: ["rindu","cinta","romance","love"]
  }
};

// render movies
const grid = document.getElementById('movieGrid');
function renderMovies(list){
  grid.innerHTML = '';
  list.slice(0,24).forEach(m=>{
    const card = document.createElement('div');
    card.className='movie-card';
    card.innerHTML = `
      <img src="${m.poster}" alt="${m.title}" onerror="this.src='https://via.placeholder.com/300x450?text=No+Image'">
      <div class="movie-info">
        <h4>${m.title}</h4>
        <p>${m.year} â€¢ ${m.genres.split('|')[0]}</p>
      </div>`;
    card.onclick = ()=> openDetail(m);
    grid.appendChild(card);
  });
}
renderMovies(window.MOVIES || []);

// mood click
document.querySelectorAll('.mood-card').forEach(btn=>{
  btn.addEventListener('click',()=>{
    document.querySelectorAll('.mood-card').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    const mood = btn.dataset.mood;
    const d = DALIL[mood];
    document.getElementById('dalilMood').textContent = mood;
    document.getElementById('dalilArab').textContent = d.arab;
    document.getElementById('dalilArti').textContent = d.arti;
    document.getElementById('dalilSumber').textContent = d.sumber;
    document.getElementById('dalilBox').classList.remove('hidden');

    // filter film
    const filtered = (window.MOVIES||[]).filter(m=>{
      const text = (m.genres + ' ' + m.overview + ' ' + m.title).toLowerCase();
      return d.keywords.some(k=> text.includes(k));
    });
    renderMovies(filtered.length? filtered : window.MOVIES);
    document.getElementById('rekomendasi').scrollIntoView({behavior:'smooth'});

    // update hero
    if(filtered[0]){
      document.getElementById('heroTitle').textContent = filtered[0].title;
      document.getElementById('heroPoster').src = filtered[0].poster;
    }
  });
});

// search
document.getElementById('searchInput').addEventListener('input', e=>{
  const q = e.target.value.toLowerCase();
  const filtered = (window.MOVIES||[]).filter(m=> m.title.toLowerCase().includes(q) || m.overview.toLowerCase().includes(q));
  renderMovies(filtered);
});

// chat
function toggleChat(){
  document.getElementById('chatWidget').classList.toggle('collapsed');
}
function sendChat(){
  const input = document.getElementById('chatInput');
  const txt = input.value.trim();
  if(!txt) return;
  addMsg(txt,'user');
  input.value='';
  setTimeout(()=>{
    const reply = generateReply(txt);
    addMsg(reply,'bot');
  },600);
}
function addMsg(t,cls){
  const div = document.createElement('div');
  div.className = 'msg '+cls;
  div.textContent = t;
  document.getElementById('chatMessages').appendChild(div);
  document.getElementById('chatBody').scrollTop = 9999;
}
function generateReply(q){
  q = q.toLowerCase();
  if(q.includes('dalil') && q.includes('sedih')) return DALIL.Sedih.arab + " â€” " + DALIL.Sedih.arti + " ("+DALIL.Sedih.sumber+")";
  if(q.includes('gelisah')||q.includes('cemas')) return DALIL.Gelisah.arab + " â€” " + DALIL.Gelisah.arti + " ("+DALIL.Gelisah.sumber+")";
  if(q.includes('hidayah')) return DALIL["Mencari Hidayah"].arti + " ("+DALIL["Mencari Hidayah"].sumber+")";
  if(q.includes('marah')) return DALIL.Marah.arti + " ("+DALIL.Marah.sumber+")";
  if(q.includes('syukur')||q.includes('bahagia')) return DALIL.Bahagia.arti + " ("+DALIL.Bahagia.sumber+")";
  if(q.includes('film')||q.includes('rekomendasi')){
    const mood = Object.keys(DALIL).find(m=> q.includes(m.toLowerCase())) || "Mencari Hidayah";
    const rec = (window.MOVIES||[]).filter(m=> m.title.toLowerCase().includes('cinta')||m.genres.toLowerCase().includes('drama')).slice(0,3).map(m=>m.title).join(', ');
    return `Untuk mood ${mood}, coba tonton: ${rec}. Semuanya ada di dataset IMAN IN MOTION. Mau dalilnya juga?`;
  }
  return "Wa'alaikumsalam. Aku bisa bantu carikan dalil sesuai perasaanmu atau rekomendasikan film dakwah dari dataset. Coba ketik 'dalil saat sedih' atau 'film tentang sabar'.";
}

// detail modal
function openDetail(m){
  if(!m) m = window.MOVIES[0];
  const body = document.getElementById('detailBody');
  const netflix = m.netflix || {available:false, url:`https://www.netflix.com/search?q=${encodeURIComponent(m.title)}`, note:''};
  
  body.innerHTML = `
    <div class="detail-grid">
      <img src="${m.poster}" alt="" onerror="this.src='https://via.placeholder.com/300x450?text=No+Image'">
      <div>
        <h2>${m.title} (${m.year})</h2>
        <div class="detail-meta">${m.genres} â€¢ Rating ${m.rating||'-'}</div>
        <p class="detail-overview">${m.overview||'Film dakwah pilihan untuk menguatkan iman.'}</p>
        
        <div class="netflix-box">
          <h4>Nonton Legal</h4>
          <p>IMAN IN MOTION cuma rekomendasi ala IMDB, kita nggak streaming filmnya ya.</p>
          ${netflix.available ? 
            `<a href="${netflix.url}" target="_blank" class="btn-watch" style="display:inline-flex;align-items:center;gap:8px;text-decoration:none;margin-top:8px">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M5.4 2.7h2.9l3.2 8.4 3.2-8.4h2.9v14.6h-1.9V7.9l-3.4 9.4h-1.6l-3.4-9.4v9.4H5.4z"/></svg>
              Buka di Netflix
            </a>
            <p class="netflix-note">${netflix.note || 'Tersedia di Netflix Indonesia'}</p>` :
            `<p class="netflix-note" style="margin-top:8px;color:#ffb4b4"><b>Tidak tersedia di Netflix</b>${netflix.note ? ' â€” '+netflix.note : ''}. Coba cek di Vidio atau Disney+ Hotstar.</p>
             <a href="${netflix.url}" target="_blank" class="btn-ghost" style="display:inline-block;margin-top:8px;text-decoration:none">Cek manual di Netflix</a>`
          }
        </div>

        <button class="btn-ghost" style="margin-top:16px" onclick="closeDetail()">Tutup</button>
      </div>
    </div>`;
  document.getElementById('detailModal').classList.remove('hidden');
}
function closeDetail(){ document.getElementById('detailModal').classList.add('hidden'); }

// login dummy
document.getElementById('loginGoogle').onclick = ()=> alert('Login Google akan terhubung ke Firebase Auth (backend nanti).');
document.getElementById('loginEmail').onclick = ()=> {
  const email = prompt('Masukkan email untuk daftar:');
  if(email) alert('Terima kasih! Akun '+email+' akan dibuat di backend.');
};

// init chat collapsed on mobile
if(window.innerWidth<700) toggleChat();