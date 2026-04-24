// chat-backend.js - hubungkan frontend ke server.js
// Tambahkan <script type="module" src="chat-backend.js"></script> di index.html SETELAH app.js

const API_URL = 'http://localhost:3001/api/chat'; // ganti ke URL Firebase Functions kamu nanti

// override fungsi sendChat di app.js
window.sendChat = async function(){
  const input = document.getElementById('chatInput');
  const txt = input.value.trim();
  if(!txt) return;
  
  addMsg(txt,'user');
  input.value='';
  addMsg('...','bot');
  
  const lastBot = document.querySelector('#chatMessages .msg.bot:last-child');
  
  try {
    const user = window.IMAN_AUTH?.currentUser;
    const mood = document.querySelector('.mood-card.active')?.dataset.mood || '';
    
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ message: txt, userId: user?.uid||'guest', mood })
    });
    
    const data = await res.json();
    lastBot.textContent = data.reply;
    
    // kalau ada dalil, tampilkan juga di box utama
    if(data.dalil){
      document.getElementById('dalilArab').textContent = data.dalil.arab;
      document.getElementById('dalilArti').textContent = data.dalil.arti;
      document.getElementById('dalilSumber').textContent = data.dalil.sumber;
      document.getElementById('dalilBox').classList.remove('hidden');
    }
    
  } catch(e){
    lastBot.textContent = 'Aduh koneksi ke server putus. Coba lagi, atau pakai mode offline: ketik "dalil sedih"';
  }
  
  document.getElementById('chatBody').scrollTop = 9999;
}

function addMsg(t,cls){
  const div = document.createElement('div');
  div.className = 'msg '+cls;
  div.textContent = t;
  document.getElementById('chatMessages').appendChild(div);
}