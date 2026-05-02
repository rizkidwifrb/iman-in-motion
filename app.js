// app.js - IMAN IN MOTION Node version
const express = require('express');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

const app = express();
const PORT = process.env.PORT || 8080;
const GROQ_KEY = process.env.GROQ_API_KEY;

app.use(express.json());
app.use(express.static('public'));

// Load film database
let FILMS = [];
fs.createReadStream('df_processed.csv')
 .pipe(csv())
 .on('data', (row) => {
    if(row.title) FILMS.push({
      title: row.title,
      year: row.year || '',
      poster: row.poster_url || row.poster || '',
      mood: (row.mood || '').toLowerCase(),
      reason: row.reason || 'Film yang menenangkan hati'
    });
  })
 .on('end', () => console.log(`✓ ${FILMS.length} film loaded`));

// Routes
app.get('/', (req,res) => res.sendFile(path.join(__dirname,'public','index.html')));
app.get('/aiman', (req,res) => res.sendFile(path.join(__dirname,'public','aiman.html')));
app.get('/aiman.html', (req,res) => res.redirect('/aiman'));

app.get('/api/movies', (req,res) => res.json(FILMS));
app.get('/health', (req,res) => res.json({status:'ok', films:FILMS.length, groq:!!GROQ_KEY}));

// AIMAN Groq endpoint
app.post('/api/chat', async (req,res) => {
  const {message} = req.body;
  if(!message) return res.json({reply:'Pesan kosong'});

  // deteksi mood sederhana
  const m = message.toLowerCase();
  let mood = 'tenang';
  if(/sedih|galau|down|nangis|sakit/.test(m)) mood='sedih';
  else if(/gelisah|cemas|takut|khawatir|stress/.test(m)) mood='gelisah';
  else if(/bahagia|senang|happy|syukur|alhamdulillah/.test(m)) mood='bahagia';
  else if(/marah|kesal|emosi/.test(m)) mood='marah';

  // cari film
  const films = FILMS.filter(f=>f.mood.includes(mood)).slice(0,3);

  // panggil Groq
  let reply = '';
  try{
    const r = await fetch('https://api.groq.com/openai/v1/chat/completions',{
      method:'POST',
      headers:{
        'Authorization':`Bearer ${GROQ_KEY}`,
        'Content-Type':'application/json'
      },
      body: JSON.stringify({
        model:'llama-3.1-8b-instant',
        messages:[
          {role:'system', content:`Kamu AIMAN, asisten IMAN IN MOTION. Jawab dengan hangat, singkat, pakai bahasa Indonesia sehari-hari. Selalu sertakan 1 dalil Qur'an dengan teks Arab singkat + terjemah. Akhiri jawaban dengan tag [MOOD:${mood}] [FILM:${films[0]?.title||''}]`},
          {role:'user', content: message}
        ],
        temperature:0.7,
        max_tokens:400
      })
    });
    const data = await r.json();
    reply = data.choices?.[0]?.message?.content || 'Aku di sini buat kamu.';
  }catch(e){
    reply = 'MasyaAllah, aku lagi susah konek. Coba lagi ya. [MOOD:'+mood+']';
  }

  res.json({reply, mood, films});
});

app.listen(PORT, ()=>console.log(`Server jalan di port ${PORT}\n✓ Groq ready`));