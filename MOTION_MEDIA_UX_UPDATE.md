# Motion, Media, UX Update

Update ini menambahkan progressive enhancement untuk pengalaman desktop dan mobile:

## Media performance
- Poster dan image yang sudah memakai `loading=lazy` tetap dipertahankan.
- CSS `content-visibility: auto` ditambahkan ke card berat agar browser tidak merender bagian yang belum terlihat.
- Image team memakai `loading="lazy"` dan `decoding="async"`.
- Vite manual chunks memisahkan Firebase, motion library, icons, dan React agar bundle lebih terpecah.

Catatan: belum ada upload ke layanan media eksternal karena tidak ada akses/API ke layanan tersebut dari project ini. Untuk produksi yang lebih serius, gambar bisa dipindahkan ke Firebase Storage atau CDN image service, lalu tetap dipanggil dari komponen LazyPoster.

## Scroll trigger
- GSAP + ScrollTrigger dipakai untuk reveal card, artikel, film, dan section secara halus saat masuk viewport.
- Animasi otomatis mati ketika user memakai `prefers-reduced-motion: reduce`.

## Anime.js
- Anime.js dipakai untuk micro-interaction ringan pada navigasi dan tombol.

## Three.js
- Three.js dipakai sebagai cinematic aura/canvas ringan di hero desktop. Mobile dimatikan agar performa tetap aman.

## Barba.js
- Barba.js disiapkan sebagai progressive transition layer. React hash routing tetap menjadi routing utama, sehingga Barba hanya aktif jika ada container Barba valid.

## Shadcn-style UI primitives
- Ditambahkan komponen primitive mirip shadcn:
  - `src/components/ui/Button.jsx`
  - `src/components/ui/Card.jsx`
- Dipakai di halaman Info/Team agar konsisten dan reusable.

## About Team
- `Uwiberani Project` diganti menjadi `UIKA-Berani Team`.
- Rizki Dwi Febriansyah tetap ditampilkan sebagai pengembang utama fullstack.
- Faris All Farizki ditambahkan sebagai anggota team dengan foto `/faris.jpg`.
