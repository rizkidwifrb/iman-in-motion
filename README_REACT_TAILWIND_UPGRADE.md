# React + Tailwind Upgrade

Dokumen ini menjelaskan bagian React + Tailwind dari IMAN IN MOTION. Frontend utama sekarang berjalan melalui Vite, sementara backend Express lama tetap dipakai untuk API AIMAN dan serve production.

## Struktur File

```text
src/
|-- main.jsx              # Entry React, hash router, navbar, splash, layout
|-- components/           # Komponen kartu film, poster lazy, button, skeleton, mood card
|-- components/account/   # Komponen akun, favorit, statistik mood, histori aktivitas
|-- data/                 # movies.js dan articles.js untuk frontend React
|-- hooks/                # useAuthUser, useFavorites, useMoodStats, useMoodAnalytics
|-- pages/                # Home, Mood, Film, FilmDetail, Articles, ArticleDetail, Aiman, Info, Account
|-- services/             # API client, recommendationService, RAG service, mood engine
|-- styles/index.css      # Tailwind entry + CSS global + override responsif
`-- utils/                # assetUrl, Firebase client, i18n, rating, trailer, account storage
```

File pendukung:

```text
index.html                # HTML entry Vite
vite.config.mjs           # Konfigurasi Vite dan proxy dev
tailwind.config.cjs       # Tema Tailwind
postcss.config.cjs        # Pipeline PostCSS
app.js                    # Express server production dan API backend
public/                   # Asset dan fallback static lama
dist/                     # Hasil build
```

## Cara Penggunaan

Install dependency:

```bash
npm install
```

Jalankan frontend React:

```bash
npm run dev
```

Buka:

```text
http://localhost:5173
```

Jalankan backend AIMAN/API di terminal lain:

```bash
npm start
```

Build production:

```bash
npm run build
npm start
```

## Catatan Development

- Edit UI React di `src/`, bukan di `dist/`.
- File lama di `public/` tetap ada sebagai fallback dan asset.
- Jika API backend beda domain, isi `VITE_API_BASE_URL` di `.env`.
- Setelah perubahan besar CSS atau data, jalankan `npm run build`.
