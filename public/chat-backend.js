// chat-backend.js — IMAN IN MOTION v2
// PRO features: typing effect, mood detect, offline fallback, auto dalil box
'use strict';

const API_URL = '/api/chat';
const chatInput = document.getElementById('chatInput');
const chatBody = document.getElementById('chatBody');
let isSending = false;

// Mood detector pintar
const MOOD_KEYWORDS = {
  sedih: ['sedih','sedih','nangis','down','berat','kecewa','patah'],
  gelisah: ['gelisah','cemas','anxiety','khawatir','takut','was-was','resah'],
  bahagia: ['senang','bahagia','syukur','alhamdulillah','happy','bersyukur'],
  marah: ['marah','kesal','emosi','benci','sebel','murka'],
  rindu: ['rindu','kangen','kangen','rindu','cinta'],
  hidayah: ['hidayah','hijrah','tobat','iman','islam','dekat allah','mencari']
};

function detectMood(text=''){
  const t = text.toLowerCase();
  for(const [mood, keys] of Object.entries(MOOD_KEYWORDS)){
    if(keys.some(k => t.includes(k))) return mood;
  }
  return document.querySelector('.mood-card.active')?.dataset.mood?.toLowerCase() || '';
}

// Typing effect kayak ChatGPT
async function typeWriter(element, text, speed=18){
  element.textContent = '';
  const chars = [...text];
  for(let i=0;i<chars.length;i++){
    element.textContent += chars[i];
    chatBody.scrollTop = chatBody.scrollHeight;
    if(i % 3 === 0) await new Promise(r => setTimeout(r, speed));
  }
}

// Dots animation saat loading
function startDots(el){
  let dots = 0;
  el.dataset.dots = '1';
  const id = setInterval(()=>{
    if(el.dataset.dots!== '1') return clearInterval(id);
    dots = (dots+1)%4;
    el.textContent = '.'.repeat(dots||3);
  }, 320);
  return ()=>{ el.dataset.dots='0'; clearInterval(id); };
}

// Override sendChat (dipakai app.js)
window.sendChat = async function(){
  if(isSending) return;
  const txt = chatInput.value.trim();
  if(!txt) return;

  isSending = true;
  chatInput.disabled = true;

  // tampilkan pesan user
  window.addMsg(txt, 'user');
  chatInput.value = '';

  // buat bubble bot kosong
  window.addMsg('', 'bot');
  const lastBot = document.querySelector('#chatMessages.msg.bot:last-child');
  const stopDots = startDots(lastBot);

  try {
    const mood = detectMood(txt);
    const user = window.IMAN_AUTH?.currentUser;

    const controller = new AbortController();
    const timeout = setTimeout(()=>controller.abort(), 12000);

    const res = await fetch(API_URL, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({
        message: txt,
        mood,
        userId: user?.uid || 'guest'
      }),
      signal: controller.signal
    });
    clearTimeout(timeout);

    if(!res.ok) throw new Error('server');
    const data = await res.json();

    stopDots();

    // typing effect
    await typeWriter(lastBot, data.reply || 'Maaf, aku belum paham.');

    // update dalil box di homepage
    if(data.dalil){
      const box = document.getElementById('dalilBox');
      if(box){
        document.getElementById('dalilArab').textContent = data.dalil.arab;
        document.getElementById('dalilArti').textContent = data.dalil.arti;
        document.getElementById('dalilSumber').textContent = data.dalil.sumber;
        document.getElementById('dalilMood').textContent = `Untuk perasaan ${mood || 'kamu'}`;
        box.classList.remove('hidden');
        box.scrollIntoView({behavior:'smooth', block:'nearest'});
      }
    }

    // simpan history
    const hist = JSON.parse(localStorage.getItem('iman_chat')||'[]');
    hist.push({q:txt, a:data.reply, t:Date.now()});
    localStorage.setItem('iman_chat', JSON.stringify(hist.slice(-20)));

  } catch(e){
    stopDots();
    // OFFLINE FALLBACK pakai DALIL lokal dari app.js
    const mood = detectMood(txt);
    const local = window.IMAN?.DALIL?.[mood.charAt(0).toUpperCase()+mood.slice(1)]
               || window.IMAN?.DALIL?.['Gelisah'];

    const fallback = local
     ? `${local.arab}\n"${local.arti}"\n— ${local.sumber}\n\n(Mode offline)`
      : 'Aduh koneksi putus. Coba lagi nanti ya.';

    await typeWriter(lastBot, fallback);
    window.toast?.('Mode offline aktif');
  } finally {
    isSending = false;
    chatInput.disabled = false;
    chatInput.focus();
    chatBody.scrollTop = chatBody.scrollHeight;
  }
};

// Enter untuk kirim, Shift+Enter untuk newline
chatInput?.addEventListener('keydown', e => {
  if(e.key === 'Enter' &&!e.shiftKey){
    e.preventDefault();
    window.sendChat();
  }
});

// Quick replies dari mood
document.addEventListener('click', e => {
  const card = e.target.closest('.mood-card');
  if(card && window.innerWidth < 900){
    setTimeout(()=>{
      chatInput.value = `Aku lagi ${card.dataset.mood.toLowerCase()}`;
      chatInput.focus();
    }, 300);
  }
});

// Auto-focus saat chat dibuka
const observer = new MutationObserver(()=>{
  const widget = document.getElementById('chatWidget');
  if(widget &&!widget.classList.contains('collapsed')){
    setTimeout(()=>chatInput?.focus(), 200);
  }
});
observer.observe(document.getElementById('chatWidget'), {attributes:true});

// Welcome message dinamis
window.addEventListener('load', ()=>{
  const hour = new Date().getHours();
  const greet = hour < 11? 'Selamat pagi' : hour < 15? 'Selamat siang' : hour < 19? 'Selamat sore' : 'Selamat malam';
  const firstBot = document.querySelector('#chatMessages.msg.bot');
  if(firstBot && firstBot.textContent.includes('Assalamualaikum')){
    firstBot.textContent = `${greet}! Ada yang bisa aku bantu dengan dalil hari ini?`;
  }
});