# Revisi UI dan Layout

Dokumen ini mencatat area UI yang sering disentuh saat revisi visual IMAN IN MOTION.

## Struktur File Terkait

```text
src/
|-- pages/
|   |-- Home.jsx          # Landing, mood journey, preview konten
|   |-- Mood.jsx          # Halaman mood dan rekomendasi
|   |-- Film.jsx          # Grid film, filter, pagination
|   |-- FilmDetail.jsx    # Detail film, poster, sinopsis, trailer
|   |-- Articles.jsx      # Daftar artikel
|   |-- ArticleDetail.jsx # Detail artikel
|   |-- Aiman.jsx         # Chat AIMAN
|   `-- Info.jsx          # Tentang project dan tim
|
|-- components/
|   |-- FilmCard.jsx      # Card film
|   |-- LazyPoster.jsx    # Poster lazy loading
|   |-- FavoriteButton.jsx
|   |-- Skeletons.jsx
|   `-- SectionTitle.jsx
|
`-- styles/index.css      # Semua override responsif dan polish visual
```

Fallback static:

```text
public/
|-- film.html
|-- mood.html
|-- artikel.html
|-- aiman.html
|-- info.html
|-- iim-mobile-fix.css
|-- iim-mobile-clean.css
|-- iim-mobile-final.css
`-- iim-nav-sync.css
```

## Cara Penggunaan

Jalankan mode development:

```bash
npm run dev
```

Buka:

```text
http://localhost:5173
```

Untuk cek backend/chat:

```bash
npm start
```

Untuk build final:

```bash
npm run build
```

## Checklist Revisi UI

1. Cek desktop dan mobile.
2. Pastikan teks tidak overlap dengan gambar.
3. Pastikan poster dan media punya rasio konsisten.
4. Pastikan tombol bisa diklik dan tidak terlalu kecil di mobile.
5. Pastikan perubahan CSS tidak kalah oleh override lama di bagian bawah `src/styles/index.css`.
6. Jalankan `npm run build`.

## Catatan

- Untuk layout React, sumber utama ada di `src/`.
- Untuk fallback static lama, sumber ada di `public/`.
- Jangan ubah `dist/` manual. Build ulang dari source.
