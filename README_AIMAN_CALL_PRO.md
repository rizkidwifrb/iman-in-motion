# AIMAN Call Pro

AIMAN Call Pro adalah jalur percakapan suara untuk AIMAN.

Alur:

```text
Mic browser -> Deepgram STT -> Groq AIMAN -> Deepgram TTS -> audio kembali ke browser
```

## Struktur File Terkait

```text
src/pages/
`-- Aiman.jsx                  # UI chat AIMAN dan tombol mode panggilan

src/components/
`-- AimanCallMode.jsx          # Komponen mode panggilan AIMAN

src/services/
`-- api.js                     # Client request ke backend

app.js                         # Backend Express AIMAN/chat
backend/
|-- knowledge/                 # Basis pengetahuan AIMAN
|-- lib/                       # Helper backend
`-- services/                  # Service backend pendukung
```

## Environment

Tambahkan ke `.env` lokal atau variables hosting:

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

## Cara Penggunaan

Install dependency:

```bash
npm install
```

Jalankan backend:

```bash
npm start
```

Jalankan frontend:

```bash
npm run dev
```

Buka halaman AIMAN:

```text
http://localhost:5173/#/aiman
```

Klik tombol panggilan AIMAN jika tersedia. Jika mode Pro gagal, gunakan mode Lite sebagai fallback.

## Catatan

- Browser harus mengizinkan akses mikrofon.
- Pastikan backend dapat membaca `GROQ_API_KEY` dan `DEEPGRAM_API_KEY`.
- Untuk production static-only, isi `VITE_API_BASE_URL` agar frontend tahu alamat backend.
