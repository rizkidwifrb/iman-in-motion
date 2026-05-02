// public/js/chat.js
const messages = document.getElementById('messages');
const form = document.getElementById('chatForm');
const input = document.getElementById('promptInput');
const sendBtn = document.getElementById('sendBtn');

function md(txt){
  return txt.replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>')
          .replace(/\*(.*?)\*/g,'<em>$1</em>')
          .replace(/\n/g,'<br>');
}
function addBubble(who, html){
  const wrap = document.createElement('div');
  wrap.className = 'max-w-3xl mx-auto';
  wrap.innerHTML = who==='user'
  ? `<div class="flex gap-4 justify-end"><div class="bg-gold/20 border border-gold/30 rounded- rounded-tr- px-5 py-3 max-w-[80%]"><p class="text-">${html}</p></div></div>`
   : `<div class="chat-bubble flex gap-4"><div class="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#0a2e22] to-black grid place-items-center shrink-0 mt-1 border border-gold/20"><img src="logo.png" class="w-6 h-6"></div><div class="flex-1"><div class="bg-white/5 border border-white/10 rounded- rounded-tl- px-6 py-5">${html}</div></div></div>`;
  messages.appendChild(wrap);
  messages.scrollTop = messages.scrollHeight;
}

async function sendChat(msg){
  addBubble('user', md(msg));
  input.value=''; input.style.height='auto'; sendBtn.disabled=true;

  const typing = document.createElement('div');
  typing.innerHTML=`<div class="max-w-3xl mx-auto"><div class="flex gap-4"><div class="w-10 h-10 rounded-2xl bg-black/40 grid place-items-center">...</div><div class="bg-white/5 px-5 py-3 rounded-2xl text-white/60 text-sm">AIMAN mengetik</div></div></div>`;
  messages.appendChild(typing);

  try{
    const r = await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:msg})});
    const data = await r.json();
    typing.remove();

    let reply = data.reply || 'Maaf, lagi error.';
    const mood = (reply.match(/\[MOOD:(.*?)\]/i)||[])[1];
    const film = (reply.match(/\[FILM:(.*?)\]/i)||[])[1];
    reply = reply.replace(/\[MOOD:.*?\]|\[FILM:.*?\]/gi,'').trim();

    let filmCard='';
    if(film && window.MOVIES){
      const f = window.MOVIES.find(m=>m.title.toLowerCase()===film.toLowerCase());
      if(f) filmCard = `<div onclick="location.href='mood.html?mood=${mood||'tenang'}'" class="mt-3 flex gap-3 p-3 bg-black/40 border border-white/10 rounded-xl cursor-pointer hover:border-gold/40"><img src="${f.poster}" class="w-12 h- object-cover rounded-lg"><div><div class="text- font-semibold">${f.title}</div><div class="text- text-white/50">${f.year}</div><div class="text- text-gold mt-1">▶ Lihat film</div></div></div>`;
    }

    addBubble('aiman', `<p class="leading-relaxed text-">${md(reply)}</p>${filmCard}`);
    if(mood) localStorage.setItem('iman_last_mood', mood.toLowerCase());

  }catch(e){ typing.remove(); addBubble('aiman','<p class="text-red-400">Koneksi putus, coba lagi.</p>'); }
  sendBtn.disabled=false;
}

form.onsubmit = e=>{e.preventDefault(); const v=input.value.trim(); if(v) sendChat(v);};
input.addEventListener('input',()=>{input.style.height='auto';input.style.height=input.scrollHeight+'px'});
document.querySelectorAll('.quick-btn').forEach(b=>b.onclick=()=>sendChat(b.dataset.quick));