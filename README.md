# IMAN IN MOTION

IMAN IN MOTION adalah web app rekomendasi film berbasis mood dengan konteks refleksi Islami. Frontend utama memakai React, Vite, dan Tailwind CSS. Backend Express dipakai untuk AIMAN chat, rekomendasi, RAG dalil, sinkronisasi rating TMDB, trailer, dan endpoint pendukung.

Project ini bukan tempat streaming film. Aplikasi membantu pengguna menemukan tontonan yang relevan dengan suasana hati, membaca detail film, menyimpan favorit, membuka artikel reflektif, dan bertanya ke AIMAN.

## Fitur Utama

- Rekomendasi film berdasarkan mood.
- Halaman film lengkap dengan filter, sort, detail film, rating, poster, trailer, dan favorit.
- AIMAN chat berbasis backend Express dan Groq.
- RAG dalil dan basis pengetahuan project.
- Login/register dengan Firebase.
- Statistik mood dan riwayat aktivitas akun.
- Artikel reflektif berbasis film.
- Fallback halaman statis di `public/`.
- Script enrichment untuk rating TMDB dan trailer.
- Pipeline tambahan untuk ML, scheduler, monitoring, dan deployment.

## Tech Stack

- Frontend: React 18, Vite, Tailwind CSS, AOS, Lucide React.
- Backend: Node.js, Express, CORS, csv-parser, Groq SDK.
- Auth dan data user: Firebase client config.
- Data film: `src/data/movies.js`, `public/js/movies.js`, dan `df_processed.csv`.
- Deployment: Vercel/Railway/Docker ready.

## Struktur File

```text
iim_react_work/
|-- README.md                         # Dokumentasi utama project
|-- package.json                      # Script npm dan dependency
|-- vite.config.mjs                   # Konfigurasi Vite
|-- tailwind.config.cjs               # Konfigurasi Tailwind
|-- postcss.config.cjs                # Konfigurasi PostCSS
|-- app.js                            # Backend Express utama dan static server production
|-- index.html                        # Entry HTML untuk Vite React
|-- df_processed.csv                  # Dataset film CSV
|-- Dockerfile                        # Build image aplikasi
|-- docker-compose.yml                # Compose untuk service pendukung
|-- vercel.json                       # Konfigurasi deploy Vercel
|-- railway.json                      # Konfigurasi deploy Railway
|
|-- src/
|   |-- main.jsx                      # Entry React, routing hash, navbar, splash, layout app
|   |-- components/                   # Komponen UI reusable
|   |-- components/account/           # Komponen halaman akun
|   |-- data/                         # Data film dan artikel versi React
|   |-- hooks/                        # Hook auth, favorit, mood analytics
|   |-- pages/                        # Halaman Home, Mood, Film, Detail, Artikel, AIMAN, Info, Account
|   |-- services/                     # API client, rekomendasi, RAG, mood engine
|   |-- styles/                       # CSS global dan override responsif
|   `-- utils/                        # Helper asset, Firebase, i18n, rating, trailer, storage
|
|-- public/
|   |-- index.html                    # Fallback static page lama
|   |-- film.html                     # Fallback static halaman film
|   |-- mood.html                     # Fallback static halaman mood
|   |-- artikel.html                  # Fallback static artikel
|   |-- aiman.html                    # Fallback static AIMAN
|   |-- info.html                     # Fallback static info
|   |-- js/                           # Data/script public lama
|   |-- *.css                         # CSS fallback/mobile legacy
|   |-- logo.png                      # Logo aplikasi
|   `-- sertifikat-hak-cipta-iman-in-motion.pdf
|
|-- backend/
|   |-- knowledge/                    # Basis pengetahuan AIMAN/RAG
|   |-- lib/                          # Helper backend
|   |-- ml/                           # Modul machine learning backend
|   `-- services/                     # Service rekomendasi, RAG, scheduler
|
|-- api/                              # Adapter endpoint/serverless
|-- data/                             # Cache dan data runtime
|-- scripts/                          # Script sinkron data, TMDB, trailer, audit, C++ ranker
|-- mlops/                            # Training, validasi, cache, rollback, watchdog model
|-- monitoring/                       # Monitoring runtime
|-- deploy/                           # File pendukung deployment
|-- docs/                             # Dokumentasi tambahan
|-- dist/                             # Output build Vite, hasil `npm run build`
|-- logs/                             # Log lokal/runtime
`-- node_modules/                     # Dependency lokal, tidak diedit manual
```

## File Penting

- `src/pages/Film.jsx`: halaman daftar film React.
- `src/components/FilmCard.jsx`: kartu film.
- `src/pages/FilmDetail.jsx`: halaman detail film.
- `src/pages/Aiman.jsx`: halaman chat AIMAN.
- `src/services/recommendationService.js`: logika filter, mood, data film, dan rekomendasi.
- `src/services/api.js`: client API frontend.
- `src/styles/index.css`: styling global dan override responsif.
- `app.js`: server Express, endpoint AIMAN, endpoint film, endpoint trailer/rating, dan serve `dist/`.
- `scripts/enrich_tmdb.py`: update metadata/rating TMDB.
- `scripts/add_trailer_urls.py`: update trailer.
- `scripts/sync_movies_data.mjs`: sinkron data film.

## Persiapan Environment

Salin `.env.example` menjadi `.env` untuk lokal.

```bash
copy .env.example .env
```

Isi variabel sesuai kebutuhan:

```env
VITE_API_BASE_URL=
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=

GROQ_API_KEY=
GROQ_MODEL=llama-3.1-70b-versatile
TMDB_API_KEY=
TMDB_READ_TOKEN=
TMDB_BEARER_TOKEN=
PORT=8080
```

Catatan:

- Kosongkan `VITE_API_BASE_URL` jika frontend dan backend berada pada domain yang sama.
- Isi `VITE_API_BASE_URL` jika frontend static memakai backend terpisah.
- Jangan commit `.env`, `.env.local`, atau secret API key.

## Cara Install

```bash
npm install
```

## Cara Menjalankan Lokal

Untuk frontend React:

```bash
npm run dev
```

Buka:

```text
http://localhost:5173
```

Untuk backend Express AIMAN/API:

```bash
npm start
```

Default backend memakai `PORT=8080` jika diisi di `.env`.

Mode development umum:

1. Terminal 1: `npm start`
2. Terminal 2: `npm run dev`
3. Buka `http://localhost:5173`

## Cara Build Production

```bash
npm run build
npm start
```

Setelah build, Vite menulis output ke `dist/`. Server `app.js` akan serve React app dari `dist/` dan tetap menyediakan fallback file lama dari `public/`.

## Script NPM

```text
npm run dev                  # Jalankan frontend Vite
npm run build                # Build frontend ke dist/
npm run preview              # Preview hasil build Vite
npm start                    # Jalankan backend Express app.js
npm run start:api            # Alias untuk node app.js
npm run start:recommendation # Jalankan service rekomendasi
npm run start:rag            # Jalankan service RAG
npm run start:scheduler      # Jalankan scheduler backend
npm run ratings              # Enrich rating film dari TMDB
npm run trailers             # Enrich trailer YouTube
npm run enrich:tmdb          # Rating + trailer sekaligus
npm run sync:movies          # Sinkron data film
npm run audit:data           # Audit data media
npm run build:cpp            # Build C++ ranker opsional
npm run ml:train             # Train model ML dan promote
npm run ml:validate          # Validasi model ML
npm run ml:rollback          # Rollback model ML
npm run ml:backup            # Backup model/data ML
npm run ml:health            # Health check ML
npm run ml:cache             # Refresh cache ML
npm run ml:watchdog          # Watchdog ML
```

## Cara Update Data Film, Rating, dan Trailer

Update data dari CSV ke sumber JS:

```bash
npm run sync:movies
```

Update rating TMDB:

```bash
npm run ratings
```

Update trailer:

```bash
npm run trailers
```

Update rating dan trailer sekaligus:

```bash
npm run enrich:tmdb
```

Lalu build ulang:

```bash
npm run build
```

## Cara Deploy

Railway atau server Node:

```bash
npm install
npm run build
npm start
```

Vercel:

- Build command: `npm run build`
- Output directory: `dist`
- Pastikan environment variable frontend `VITE_*` tersedia saat build.
- Jika butuh backend Express penuh, gunakan hosting Node terpisah atau konfigurasi adapter di `api/`.

Docker:

```bash
docker build -t iman-in-motion .
docker run --env-file .env -p 8080:8080 iman-in-motion
```

Docker Compose:

```bash
docker compose up --build
```

## Alur Pengembangan

1. Edit halaman React di `src/pages/`.
2. Edit komponen di `src/components/`.
3. Edit logika data/rekomendasi di `src/services/`.
4. Edit style global di `src/styles/index.css`.
5. Jalankan `npm run dev` untuk cek cepat.
6. Jalankan `npm run build` sebelum deploy.

## Catatan Penting

- Jangan edit file di `node_modules/`.
- Jangan edit output `dist/` sebagai sumber utama. Edit `src/`, lalu build.
- `public/` masih dipakai untuk asset dan fallback legacy.
- File `README_*.md` adalah catatan fitur/update khusus.
- Secret API key hanya disimpan di `.env` lokal atau environment hosting.
