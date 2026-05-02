const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Load films
let filmsData = [];
const csvPath = path.join(__dirname, 'df_processed.csv');
if (fs.existsSync(csvPath)) {
  fs.createReadStream(csvPath)
    .pipe(csv())
    .on('data', (r) => {
      if (r.poster_url) {
        filmsData.push({
          title: r.title_asli || '',
          poster: r.poster_url,
          year: parseInt(r.year) || 2020,
          mood_tag: (r.mood || '').toLowerCase(),
          genre: r.genres || '',
          sinopsis: r.overview || '',
          trailer: r.trailer_url || ''
        });
      }
    })
    .on('end', () => console.log(`âœ“ ${filmsData.length} film loaded`));
}

// Groq
let groq = null;
try {
  const Groq = require('groq-sdk');
  if (process.env.GROQ_API_KEY) {
    groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    console.log('âœ“ Groq ready');
  }
} catch(e) { console.log('Groq skip:', e.message); }

const MOOD_KEYWORDS = {
  sedih: ['sedih','sakit hati','patah','kecewa','capek','down','nangis','galau'],
  gelisah: ['cemas','khawatir','anxious','overthinking','takut','gelisah'],
  bahagia: ['senang','bahagia','syukur','alhamdulillah'],
  marah: ['marah','kesel','sebel','benci'],
  rindu: ['rindu','kangen'],
  'mencari hidayah': ['hijrah','taubat','hidayah'],
  bingung: ['bingung','bimbang','ragu'],
  insecure: ['insecure','minder']
};
function detectMood(text='') {
  const tl = text.toLowerCase();
  for (const [m, kws] of Object.entries(MOOD_KEYWORDS)) {
    if (kws.some(k => tl.includes(k))) return m;
  }
  return 'netral';
}

const SYSTEM_PROMPT = `Kamu Aiman, teman dakwah digital 24 tahun untuk anak muda Indonesia. Pakai aku-kamu, hangat, validasi dulu baru solusi. WAJIB kutip Quran/Hadits dengan format: "Arab" (QS... ) Artinya:... Jangan ngarang dalil. Jawab 50-200 kata, akhiri aksi kecil.`;

app.get('/health', (req,res) => res.json({status:'ok', films: filmsData.length, groq: !!groq}));

app.post('/api/chat', async (req,res) => {
  const msg = (req.body.message || '').trim();
  if (!msg) return res.json({reply:'Ketik dulu ya', mood:'netral', films:[]});
  
  const mood = detectMood(msg);
  const tag = mood === 'bahagia' ? 'semangat' : 'tenang';
  const filtered = filmsData.filter(f => f.mood_tag === tag);
  const films = filtered.sort(() => 0.5 - Math.random()).slice(0,3);

  let reply = 'Maaf, AIMAN lagi istirahat.';
  if (groq) {
    try {
      const completion = await groq.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [
          {role:'system', content: SYSTEM_PROMPT},
          {role:'user', content: msg}
        ],
        temperature: 0.7,
        max_tokens: 800
      });
      reply = completion.choices[0].message.content;
    } catch(e) {
      console.error('Groq error:', e.message);
      reply = 'Error Groq: ' + e.message;
    }
  } else {
    reply = 'Set GROQ_API_KEY di Railway Variables dulu.';
  }

  if (!reply.includes('[MOOD:')) reply += `\n\n[MOOD:${mood}]`;
  res.json({reply, mood, films});
});

app.get('/api/movies', (req,res) => {
  const mood = req.query.mood;
  const limit = parseInt(req.query.limit) || 50;
  let data = filmsData;
  if (mood) data = data.filter(f => f.mood_tag === mood.toLowerCase());
  res.json(data.slice(0, limit));
});

app.get('/aiman', (req,res) => res.sendFile(path.join(__dirname,'public','aiman.html')));
app.get('/mood', (req,res) => res.sendFile(path.join(__dirname,'public','mood.html')));
app.get('*', (req,res) => {
  const index = path.join(__dirname,'public','index.html');
  if (fs.existsSync(index)) res.sendFile(index);
  else res.json({message:'IMAN IN MOTION API'});
});

app.listen(PORT, '0.0.0.0', () => console.log(`Server jalan di port ${PORT}`));