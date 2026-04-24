const API_BASE = 'https://GANTI-DENGAN-URL-RAILWAY-LU.up.railway.app';

async function sendChat(){
  const input = document.getElementById('chatInput');
  const msg = input.value.trim();
  if(!msg) return;
  
  const box = document.getElementById('chatMessages');
  box.innerHTML += `<div class="msg user">${msg}</div>`;
  input.value = '';
  
  try {
    const r = await fetch(`${API_BASE}/api/chat`,{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({message:msg})
    });
    const d = await r.json();
    box.innerHTML += `<div class="msg bot">${d.response}</div>`;
  } catch {
    box.innerHTML += `<div class="msg bot">Server offline, coba lagi nanti.</div>`;
  }
  box.scrollTop = box.scrollHeight;
}

function toggleChat(){
  document.getElementById('chatWidget').classList.toggle('collapsed');
}