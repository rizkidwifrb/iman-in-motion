# 🕌 IMAN IN MOTION
### Rekomendasi Film Dakwah Berdasarkan Mood dengan Pendekatan UX Islami

> **Film untuk hati, dalil untuk jiwa.**

IMAN IN MOTION adalah web app seperti IMDB khusus film dakwah Indonesia. Bukan tempat streaming, tapi asisten pribadi yang merekomendasikan film sesuai perasaanmu hari ini — lengkap dengan dalil Al-Qur'an penguat hati, link Netflix legal, dan chat AI Islami.

Dibuat sebagai **Tugas Akhir** Program Studi Komunikasi dan Penyiaran Islam.

---

## ✨ Fitur Utama

### 🎭 1. Rekomendasi Berdasarkan Mood (UX Core)
Pilih perasaanmu, kami kasih obatnya:
- 😢 **Sedih** → QS. Al-Insyirah 94:5-6
- 😔 **Gelisah** → QS. Ar-Ra'd 13:28
- 🤲 **Mencari Hidayah** → QS. Al-Baqarah 2:2
- 😊 **Bahagia** → QS. Ibrahim 14:7
- 😤 **Marah** → QS. Ali Imran 3:134
- 💚 **Rindu** → QS. Ar-Rum 30:21

> Setiap mood otomatis filter 30+ film dakwah dari dataset.

### 🎬 2. Detail Film Ala IMDB + Link Netflix
- Poster, tahun, genre, sinopsis, rating
- **Status Netflix per film** (bukan tebak-tebakan):
  - ✅ Habibie & Ainun, Rudy Habibie, Filosofi Kopi → Tersedia
  - ❌ Dilan 1990 → Tidak tersedia (terakhir Agustus 2025)
- Tombol "Buka di Netflix" langsung ke pencarian

### 🤖 3. Chat AI Asisten IMAN
- Backend Node.js + AI (OpenAI/Gemini)
- Jawab dalil dari database (tidak ngarang)
- Rekomendasi film kontekstual
- Support multi-bahasa

### 🔐 4. Autentikasi Lengkap
- Login Google (Firebase Auth)
- Daftar Email/Password
- **Lupa Sandi** → kirim email reset otomatis
- Hapus akun

### 📤 5. Share ke Story IG/TikTok
- Generate template 1080×1920 otomatis
- Design aesthetic: gradient logo + poster film + dalil Arab
- 1 klik share via Web Share API

### 🌐 6. Multi Bahasa & Pengaturan
- Indonesia / English / العربية
- Pengaturan akun di modal ⚙️

---

## 🖼️ Preview
![Hero](logo.png)

> **Live Demo:** `https://username.github.io/iman-in-motion` (setelah deploy)

---

## 🛠️ Tech Stack

**Frontend:**
- HTML5, CSS3 (Glassmorphism + Gen Z gradients)
- Vanilla JavaScript (no framework, biar ringan)
- Firebase Auth v10

**Backend:**
- Node.js + Express
- Firebase Functions (opsional)
- OpenAI API / Gemini

**Database:**
- `dataset_dakwah_final.csv` → 30 film Indonesia
- Firestore (untuk user & mood history)

---

## 📁 Struktur Folder

```
IMAN-IN-MOTION/
├── backend/
│   ├── login.js          # Firebase Auth (Google + Email)
│   └── server.js         # API Chat AI + Dalil
│
├── Frontend/
│   ├── index.html        # Halaman utama
│   ├── style.css         # Tema hijau-hitam Gen Z
│   ├── app.js            # Logic mood & Netflix
│   ├── chat-backend.js   # Connector ke server.js
│   ├── share.js          # Generate story IG/TikTok
│   ├── movies.js         # Dataset + status Netflix
│   └── logo.png          # Logo resmi
│
└── README.md
```

---

## 🚀 Cara Install (5 Menit)

### 1. Clone Repo
```bash
git clone https://github.com/username/iman-in-motion.git
cd iman-in-motion/Frontend
```

### 2. Jalankan Frontend
Buka `index.html` langsung di browser (atau pakai Live Server VS Code).

### 3. Setup Firebase (untuk Login)
1. Buka [console.firebase.google.com](https://console.firebase.google.com)
2. Buat project `iman-in-motion`
3. Authentication → Enable **Google** & **Email/Password**
4. Copy config ke `backend/login.js`:
```js
const firebaseConfig = {
  apiKey: "ISI_PUNYAMU",
  authDomain: "iman-in-motion.firebaseapp.com",
  projectId: "iman-in-motion",
  // ...
};
```

### 4. Jalankan Backend Chat AI
```bash
cd backend
npm install express cors dotenv node-fetch
```
Buat file `.env`:
```
AI_API_KEY=sk-xxxx (dari OpenAI/Gemini)
PORT=3001
```
Jalankan:
```bash
node server.js
```
Ganti `API_URL` di `Frontend/chat-backend.js` ke `http://localhost:3001/api/chat`

---

## 👨‍💻 Tim Pengembang

**Tugas Akhir - Universitas Ibn Khaldun Bogor**  
Fakultas Agama Islam  
Program Studi Komunikasi dan Penyiaran Islam

- **Rizki Dwi Febriansyah**
- **Faris All Farizki**

Dosen Pembimbing: *(isi nama dosen)*

---

## 📜 Lisensi
MIT License - Bebas digunakan untuk dakwah dan pendidikan.

> **Catatan:** IMAN IN MOTION tidak menyimpan film. Semua link mengarah ke platform legal (Netflix, Vidio, Disney+ Hotstar).

---

## 🤝 Kontribusi
Pull request welcome! Fokus pengembangan selanjutnya:
- [ ] Integrasi JustWatch API (auto cek Netflix)
- [ ] Mode gelap/terang
- [ ] Playlist mood mingguan
- [ ] PWA (install ke HP)

---

**Barakallahu fiikum!** Semoga jadi amal jariyah. 🌙
