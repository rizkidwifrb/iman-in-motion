# Skeleton Loader + Lazy Loading Update

Update ini menggabungkan lazy loading dan skeleton loader supaya halaman terasa lebih cepat tanpa menghapus fitur lama.

## Yang ditambahkan

- `src/components/LazyPoster.jsx`
  - Poster film/artikel/favorite memakai `loading="lazy"` dan `decoding="async"`.
  - Saat gambar belum selesai dimuat, muncul skeleton shimmer.
  - Jika gambar gagal, fallback poster tetap muncul.

- `src/components/Skeletons.jsx`
  - `PageSkeleton`
  - `FilmGridSkeleton`
  - `MoodFilmGridSkeleton`
  - `ArticleGridSkeleton`
  - `FavoriteGridSkeleton`

- Route lazy loading di `src/main.jsx`
  - Mood, Film, FilmDetail, Articles, ArticleDetail, Aiman, Info, dan Account diload saat dibuka.
  - Home tetap eager supaya landing tidak blank.

- Skeleton grid di:
  - Film page
  - Artikel page
  - Mood recommendation result
  - Favorite film di akun saat ambil data Firestore

## Catatan

Skeleton tidak dipasang ke hero/landing utama supaya elemen above-the-fold tetap langsung terlihat dan tidak terasa loncat.
