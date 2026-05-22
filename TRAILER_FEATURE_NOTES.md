# Trailer Direct URL + Inline Player Feature

Fitur ini menambahkan trailer film ke IMAN IN MOTION dengan mode utama **tetap di dalam web**, bukan redirect ke YouTube.

## Cara kerja

1. Data film punya `tmdbId`.
2. Backend Express membaca `TMDB_API_KEY`, `TMDB_READ_TOKEN`, atau `TMDB_BEARER_TOKEN` dari `.env` / Railway Variables.
3. Endpoint `/api/trailer/:tmdbId` mengambil daftar video dari TMDB.
4. Sistem memilih trailer YouTube terbaik, lalu membuat dua URL:
   - `trailer_url`: `https://www.youtube.com/watch?v=VIDEO_KEY`
   - `trailer_embed_url`: `https://www.youtube.com/embed/VIDEO_KEY`
5. Web memakai `trailer_embed_url` untuk memutar trailer langsung dalam halaman detail film.
6. Hasil disimpan di `data/trailer-cache.json` supaya tidak fetch berulang.

## Tampilan di web

- Halaman detail film React menampilkan tombol **Putar Trailer di Web**.
- Trailer muncul sebagai iframe embed di halaman detail film.
- Halaman public/static juga menampilkan trailer embed di modal detail film.
- Tidak memakai YouTube search URL.
- Tidak wajib membuka tab YouTube.

## Isi trailer_url permanen ke data

Windows PowerShell:

```powershell
$env:TMDB_API_KEY="isi_api_key_tmdb_kamu"
npm run trailers
```

Windows CMD:

```bat
set TMDB_API_KEY=isi_api_key_tmdb_kamu
npm run trailers
```

Linux/macOS:

```bash
export TMDB_API_KEY="isi_api_key_tmdb_kamu"
npm run trailers
```

Kalau ingin pakai Read Access Token:

```bash
export TMDB_READ_TOKEN="isi_read_access_token_tmdb_kamu"
npm run trailers
```

Script akan memperbarui:

- `df_processed.csv`
- `src/data/movies.js`
- `public/js/movies.js`

Field yang ditambahkan:

- `tmdbId`
- `trailer_url`
- `trailer_embed_url`
- `trailer_key`
- `trailer_name`

## Railway Variables

Tambahkan salah satu atau beberapa variable berikut:

```env
TMDB_API_KEY=...
TMDB_READ_TOKEN=...
TMDB_BEARER_TOKEN=...
```

Jangan masukkan key/token ke file frontend seperti `movies.js` atau ke GitHub.
