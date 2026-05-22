# AIMAN Call Pro v1

AIMAN Call Pro menambahkan jalur suara:

Mic browser -> Deepgram STT -> Groq AIMAN -> Deepgram TTS -> suara balik ke browser.

## ENV yang dibutuhkan

Tambahkan di Railway Variables atau .env lokal:

```env
GROQ_API_KEY=isi_key_groq
GROQ_MODEL=llama-3.1-8b-instant
LLM_TEMPERATURE=0.45

DEEPGRAM_API_KEY=isi_key_deepgram
DEEPGRAM_STT_MODEL=nova-3
DEEPGRAM_STT_LANGUAGE=id
DEEPGRAM_TTS_MODEL=aura-2-thalia-en
DEEPGRAM_TTS_SPEED=1.05
```

## Cara pakai

1. Jalankan backend: `npm start`
2. Jalankan frontend dev: `npm run dev`
3. Buka halaman AIMAN
4. Klik `Telepon AIMAN Pro`

Kalau Pro gagal, pakai tombol Lite sebagai fallback.
