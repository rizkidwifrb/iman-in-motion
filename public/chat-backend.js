const API_BASE = 'https://iman-in-motion-production.up.railway.app';

async function sendChat(){
  const input = document.getElementById('chatInput');
  const msg = input.value.trim();
  if(!msg) return;

  const box = document.getElementById('chatMessages');
  box.innerHTML += `<div class="msg user">${escapeHtml(msg)}</div>`;
  input.value = '';
  box.scrollTop = box.scrollHeight;

  // typing indicator
  const typingId = 'typing-' + Date.now();
  box.innerHTML += `<div id="${typingId}" class="msg bot typing">...</div>`;

  try {
    // ambil token kalau user udah login
    const token = window.currentUser? await window.currentUser.getIdToken() : null;

    const r = await fetch(`${API_BASE}/api/chat`,{
      method:'POST',
      headers:{
        'Content-Type':'application/json',
       ...(token && {'Authorization': `Bearer ${token}`})
      },
      body:JSON.stringify({
        message: msg,
        history: [] // bisa diisi kalau mau context
      })
    });

    const d = await r.json();
    document.getElementById(typingId)?.remove();

    // render jawaban lengkap
    let html = `<div class="msg bot">`;

    // 1. reply utama
    html += `<div class="reply">${(d.reply || '').replace(/\n/g,'<br>')}</div>`;

    // 2. dalil kalau ada
    if(d.dalil && d.dalil.arab){
      html += `<div class="dalil-box">
        <div class="arab" style="font-size:1.4em;text-align:right;direction:rtl;margin:8px 0;">${d.dalil.arab}</div>
        <div class="arti"><i>"${d.dalil.arti}"</i> — ${d.dalil.sumber}</div>
      </div>`;
    }

    // 3. film rekomendasi
    if(d.films && d.films.length){
      html += `<div class="films" style="margin-top:10px;">`;
      d.films.slice(0,2).forEach(f => {
        html += `<div style="display:flex;gap:8px;margin:6px 0;align-items:center;">
          <img src="${f.poster_url}" style="width:45px;height:68px;object-fit:cover;border-radius:4px;">
          <div><b>${f.title}</b> (${f.year})<br><small style="opacity:.7">${f.genres}</small></div>
        </div>`;
      });
      html += `</div>`;
    }

    html += `</div>`;
    box.innerHTML += html;

  } catch(e) {
    document.getElementById(typingId)?.remove();
    console.error(e);
    box.innerHTML += `<div class="msg bot">Server offline, coba lagi nanti.</div>`;
  }
  box.scrollTop = box.scrollHeight;
}

function escapeHtml(s){
  return s.replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}

function toggleChat(){
  document.getElementById('chatWidget').classList.toggle('collapsed');
}

// Enter to send
document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('chatInput');
  if(input){
    input.addEventListener('keypress', e => {
      if(e.key === 'Enter'){ e.preventDefault(); sendChat(); }
    });
  }
});