// server.js - Backend Chat AI untuk IMAN IN MOTION
// Jalankan: npm install express cors dotenv node-fetch
// node server.js

import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import 'dotenv/config';

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;

// GANTI dengan API key kamu (bisa pakai OpenAI, Gemini, atau Meta AI)
const AI_API_KEY = process.env.AI_API_KEY;
const AI_URL = 'https://api.openai.com/v1/chat/completions'; // contoh

// Database dalil (biar tetap Islami, tidak ngarang)
const DALIL_DB = {
  sedih: { arab: "ÙÙŽØ¥ÙÙ†ÙŽÙ‘ Ù…ÙŽØ¹ÙŽ Ø§Ù„Ù’Ø¹ÙØ³Ù’Ø±Ù ÙŠÙØ³Ù’Ø±Ù‹Ø§", arti: "Sesungguhnya bersama kesulitan ada kemudahan.", sumber: "QS Al-Insyirah 94:5-6" },
  gelisah: { arab: "Ø£ÙŽÙ„ÙŽØ§ Ø¨ÙØ°ÙÙƒÙ’Ø±Ù Ø§Ù„Ù„ÙŽÙ‘Ù‡Ù ØªÙŽØ·Ù’Ù…ÙŽØ¦ÙÙ†ÙÙ‘ Ø§Ù„Ù’Ù‚ÙÙ„ÙÙˆØ¨Ù", arti: "Hanya dengan mengingat Allah hati menjadi tenteram.", sumber: "QS Ar-Ra'd 13:28" },
  marah: { arab: "ÙˆÙŽØ§Ù„Ù’ÙƒÙŽØ§Ø¸ÙÙ…ÙÙŠÙ†ÙŽ Ø§Ù„Ù’ØºÙŽÙŠÙ’Ø¸ÙŽ", arti: "Orang yang menahan amarah", sumber: "QS Ali Imran 3:134" }
};

app.post('/api/chat', async (req, res) => {
  const { message, userId, mood } = req.body;
  
  // 1. Cek apakah pertanyaan tentang dalil (prioritaskan database)
  const lower = message.toLowerCase();
  let dalil = null;
  if(lower.includes('sedih')) dalil = DALIL_DB.sedih;
  if(lower.includes('gelisah') || lower.includes('cemas')) dalil = DALIL_DB.gelisah;
  if(lower.includes('marah')) dalil = DALIL_DB.marah;
  
  if(dalil){
    return res.json({
      reply: `${dalil.arab}

Artinya: "${dalil.arti}"
(${dalil.sumber})

Mau rekomendasi film untuk mood ini?`,
      source: 'database',
      dalil
    });
  }

  // 2. Kalau bukan dalil, lempar ke AI
  try {
    const prompt = `Kamu adalah Asisten IMAN, AI Islami Gen Z yang membantu rekomendasi film dakwah. Jawab singkat, hangat, pakai bahasa Indonesia gaul tapi sopan. User bertanya: "${message}". Mood user: ${mood||'netral'}. Jika ditanya film, rekomendasikan dari list: Ayat-Ayat Cinta, Habibie & Ainun, Perempuan Berkalung Sorban, Dilan 1990. Jangan ngarang dalil.`;

    const aiRes = await fetch(AI_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{role:'system', content: prompt}],
        max_tokens: 200,
        temperature: 0.8
      })
    });
    
    const data = await aiRes.json();
    const reply = data.choices?.[0]?.message?.content || "Maaf, aku lagi sibuk dzikir dulu. Coba lagi ya!";
    
    res.json({ reply, source: 'ai' });
  } catch (e) {
    console.error(e);
    res.json({ reply: "Waah server lagi istighfar dulu. Coba tanya dalil manual ya: ketik 'dalil sedih'", source: 'error' });
  }
});

app.listen(PORT, () => console.log(`âœ… IMAN backend jalan di http://localhost:${PORT}`));