# TMDB Rating Update

Versi ini menambahkan sinkronisasi rating film dari TMDB memakai `tmdbId`.

## Yang ditambahkan

- Script Python: `scripts/enrich_tmdb.py`
- NPM script:
  - `npm run ratings` untuk update rating dari TMDB
  - `npm run trailers` untuk update trailer direct YouTube embed
  - `npm run enrich:tmdb` untuk update rating dan trailer sekaligus
- Backend endpoint:
  - `GET /api/rating/:tmdbId`
- Cache backend:
  - `data/tmdb-rating-cache.json`
- UI rating baru:
  - Film card menampilkan `★ x.x TMDB`
  - Detail film menampilkan `★ x.x/10 TMDB`
  - Vote count ditampilkan jika ada
  - Jika vote kecil, UI memberi tanda `Data vote masih terbatas`
  - Jika TMDB rating 0, fallback ke rating lama atau tampil `Belum ada rating`

## Env yang dibutuhkan

Gunakan salah satu:

```env
TMDB_API_KEY=isi_api_key_kamu
```

atau:

```env
TMDB_READ_TOKEN=isi_read_access_token_kamu
```

Bisa juga:

```env
TMDB_BEARER_TOKEN=isi_read_access_token_kamu
```

Jangan commit `.env` ke GitHub.

## Cara jalanin

```bash
npm install
npm run ratings
npm run build
npm start
```

Kalau mau rating + trailer sekaligus:

```bash
npm run enrich:tmdb
npm run build
npm start
```

## Field baru di data film

```js
{
  rating: 7.4,
  vote_count: 823,
  rating_source: "TMDB",
  rating_updated_at: "2026-05-18",
  tmdb_vote_average: 7.4,
  tmdb_popularity: 22.104,
  tmdb_status: "Released"
}
```
