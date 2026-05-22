# Mobile Landing + Lightweight Bundle Fix

Perubahan utama:
- Mobile landing diperbaiki ulang dengan override final di bawah CSS.
- Tombol Film/Artikel sekarang masuk grid yang sejajar dengan blok headline, bukan absolute floating.
- Mood grid dinaikkan dan dibuat lebih compact.
- Deskripsi mood mobile tetap disembunyikan.
- Motion stack berat dihapus dari runtime utama: GSAP, anime.js, barba.js, three.js.
- Scroll reveal diganti IntersectionObserver native agar lebih ringan.
- Home route dibuat lazy-load supaya bundle awal jauh lebih kecil.
- Vite build tetap minify via esbuild dan CSS minify.

Catatan:
Jalankan ulang `npm install` setelah extract ZIP karena package.json/package-lock berubah.
