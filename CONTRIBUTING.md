# Contributing to IMAN IN MOTION

Bismillah, terima kasih sudah mau kontribusi untuk dakwah digital! 🙏

Kami sangat terbuka untuk mahasiswa, developer, dan dai yang ingin mengembangkan platform rekomendasi film Islami ini.

## 🌟 Cara Kontribusi

### 1. Fork & Clone
```bash
git clone https://github.com/rizkidwifrb/iman-in-motion.git
cd iman-in-motion
```

### 2. Buat Branch Baru
Gunakan format:
- `feature/nama-fitur` → untuk fitur baru
- `fix/nama-bug` → untuk perbaikan
- `docs/...` → untuk dokumentasi

```bash
git checkout -b feature/tambah-filter-netflix
```

### 3. Coding Standards

**Frontend (Vanilla JS):**
- Gunakan `const`/`let`, hindari `var`
- Nama fungsi: `camelCase` → `openDetail()`, `renderMovies()`
- CSS: gunakan variabel di `:root` (`--green`, `--orange`)
- Commit message bahasa Indonesia, jelas: `feat: tambah tombol share story`

**Backend (Node.js):**
- Gunakan ES Modules (`import`)
- Jangan commit `.env` (sudah di .gitignore)
- Validasi input user sebelum ke AI

**Islami Guideline:**
- Dalil WAJIB dari database, jangan generate AI
- Tidak ada konten musik haram di rekomendasi
- UI tetap sopan, tidak ada gambar tidak senonoh

### 4. Test Lokal
```bash
# Frontend
cd Frontend
# buka index.html dengan Live Server

# Backend
cd backend
npm install
node server.js
```

### 5. Pull Request
- Jelaskan perubahan dengan jelas
- Sertakan screenshot jika ubah UI
- Tag reviewer: @RizkiDwi @FarisAll

## 📋 Roadmap Kontribusi

**Good First Issues:**
- [ ] Tambah 10 film dakwah baru ke `movies.js`
- [ ] Translate ke bahasa Arab
- [ ] Perbaiki responsive di HP kecil
- [ ] Tambah filter "Hanya di Netflix"

**Medium:**
- [ ] Integrasi JustWatch API
- [ ] Mode offline (PWA)
- [ ] Dashboard admin

**Advanced:**
- [ ] Rekomendasi AI berdasarkan history
- [ ] Fitur komunitas (review film)

## 🐛 Lapor Bug
Buka Issue dengan template:
```
**Deskripsi:** ...
**Langkah reproduksi:**
1. ...
**Expected:** ...
**Screenshot:**
```

## 📜 Code of Conduct
- Niat lillahi ta'ala
- Hargai sesama kontributor
- Tidak ada debat mazhab di PR
- Fokus ke manfaat umat

## 💬 Diskusi
Join Telegram: t.me/imaninmotion_dev (buat nanti)

---

Jazakumullah khairan! Semoga jadi amal jariyah.
