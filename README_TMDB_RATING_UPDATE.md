# TMDB Rating dan Trailer Update

Dokumen ini menjelaskan cara memperbarui rating, metadata TMDB, dan trailer film.

## Struktur File

```text
scripts/
|-- enrich_tmdb.py         # Ambil rating dan metadata TMDB
|-- add_trailer_urls.py    # Ambil/sinkron trailer
|-- sync_movies_data.mjs   # Sinkron data film ke src/public
`-- audit_media_data.mjs   # Audit kelengkapan data media

src/data/
`-- movies.js              # Data film untuk React

public/js/
`-- movies.js              # Data film untuk fallback static

data/
`-- tmdb-rating-cache.json # Cache rating TMDB jika tersedia
```

Backend terkait:

```text
app.js                     # Endpoint rating/trailer dan loader film
```

## Environment

Gunakan salah satu key TMDB:

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

Jangan commit `.env`.

## Cara Penggunaan

Install dependency:

```bash
npm install
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

Sinkron data film:

```bash
npm run sync:movies
```

Build ulang:

```bash
npm run build
```

## Field Data Film

Contoh field hasil enrichment:

```js
{
  rating: 7.4,
  vote_count: 823,
  rating_source: "TMDB",
  rating_updated_at: "2026-05-18",
  tmdb_vote_average: 7.4,
  tmdb_popularity: 22.104,
  tmdb_status: "Released",
  trailer_url: "https://www.youtube.com/watch?v=..."
}
```

## Catatan

- Script membaca `df_processed.csv` dan menulis data ke `src/data/movies.js` serta `public/js/movies.js`.
- Jika rating atau trailer kosong, UI akan memakai fallback yang tersedia.
- Setelah update data, selalu cek halaman film dan detail film.
