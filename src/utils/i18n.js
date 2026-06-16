import { useEffect, useState } from 'react';

export const languageOptions = [
  { code: 'id', label: 'Indonesia', native: 'Bahasa Indonesia' }
];

export const copy = {
  id: {
    nav: { home: 'Home', mood: 'Mood', film: 'Film', articles: 'Artikel', aiman: 'AIMAN', info: 'Info', account: 'Akun', login: 'Masuk', settings: 'Pengaturan' },
    settings: { eyebrow: 'Menu', title: 'IMAN IN MOTION', language: 'Bahasa', chooseLanguage: 'Pilih bahasa tampilan', changeDisplayLanguage: 'Ubah bahasa tampilan', changed: 'Bahasa diubah ke', clearHistory: 'Hapus riwayat', account: 'Akun', open: 'Buka', signIn: 'Masuk', aboutApp: 'Tentang', aboutFounder: 'Tentang Founder', copyright: 'Hak Cipta', help: 'Bantuan', view: 'Lihat', soon: 'Segera', contact: 'Kontak', logout: 'Keluar akun', theme: 'Tema', signInWithGoogle: 'Masuk dengan Google', orEmail: 'atau email', namePlaceholder: 'Nama lengkap', emailPlaceholder: 'Email', passwordPlaceholder: 'Password', authProcessing: 'Memproses...', authAccountNote: 'Akun digunakan untuk menyimpan preferensi mood dan pengalaman membaca di IMAN IN MOTION.', close: 'Tutup', historyCleared: 'Riwayat lokal dibersihkan.' },
    home: {
      eyebrow: 'Rekomendasi Film By Mood',
      title: 'Bagaimana Perasaanmu?',
      subtitle: 'Pilih suasana hati yang paling dekat, lalu temukan film, refleksi, dan ruang percakapan yang lebih nyambung dengan harimu.',
      previewBrand: 'IMAN IN MOTION',
      moodTitle: 'Pilih Moodmu',
      ctaMood: 'Mulai dari Mood',
      ctaFilm: 'Buka Rekomendasi Film',
      statFilms: '696+ data film',
      statMoods: '6 mood final',
      statAiman: 'Dalil + AIMAN chat',
      dalilTitle: 'Dalil mode aktif',
      dalilCopy: 'Pilih suasana hati, lalu temukan dalil singkat, ruang refleksi, dan film yang lebih nyambung dengan kondisi kamu.',
      modelEyebrow: 'Model literasi dakwah',
      modelTitle: 'Bukan sekadar rekomendasi, tapi perjalanan memahami pesan.',
      modelDesc: 'Aplikasi ini menghubungkan kondisi emosional pengguna dengan pilihan film, artikel reflektif, dalil, dan AIMAN agar literasi dakwah terasa lebih dekat dengan pengalaman sehari-hari.',
      moodEyebrow: 'Pilih suasana hati',
      moodSectionTitle: 'Mulai dari kondisi hati yang paling dekat.',
      moodSectionDesc: 'Setiap mood menghubungkan kamu dengan dalil, refleksi, dan rekomendasi film yang sesuai.',
      recEyebrow: 'Rekomendasi awal',
      recTitle: 'Film pilihan untuk membuka refleksi.',
      recDesc: 'Preview ini diambil dari rekomendasi mood hidayah. Pilih mood lain untuk hasil yang lebih personal.',
      articleEyebrow: 'Artikel literasi',
      articleTitle: 'Baca makna di balik tontonan.',
      articleDesc: 'Tulisan reflektif yang membantu menghubungkan cerita film dengan nilai dakwah dan pengalaman sehari-hari.',
      seeMore: 'Lihat selengkapnya',
      heroLine1: 'Bagaimana Perasaanmu',
      heroLine2: 'Hari ini?',
      heroDescription: 'Temukan film, refleksi, dan ruang percakapan yang cocok dengan suasana hatimu.',
      journeyHint: 'Jawab tiga pertanyaan singkat lalu dapatkan film yang cocok dengan hatimu sekarang.',
      journeyPersonalMatch: 'Personal mood match',
      journeyReset: 'Reset',
      journeyStep1: 'Langkah 1 dari 3',
      journeyStep2: 'Langkah 2 dari 3',
      journeyStep3: 'Langkah 3 dari 3',
      chooseYourMood: 'Pilih moodmu',
      whatKindMood: 'Apa jenis {mood} yang paling dekat?',
      tellItShortly: 'Ceritakan secara singkat',
      noteHint: 'Maksimal 50 karakter. Cukup tulis sedikit, film akan mengikuti mood dan detailmu.',
      findMyFilm: 'Temukan Film Saya',
      yourFilmMatch: 'Film yang cocok untukmu',
      openFilm: 'Buka Film',
      seeMoreButton: 'Lihat selengkapnya'
    },
    footer: { left: 'Model literasi dakwah berbasis mood.', right: 'Because we move with iman, story, and reflection.' },
    ui: { backHome: 'Kembali ke Home', loginFirstTitle: 'Login dulu ya.', loginFirstDesc: 'Akun dipakai untuk menyimpan film favorit, statistik mood, dan riwayat rekomendasi personal.', filmEyebrow: 'Rekomendasi Film', filmTitle: 'Temukan film yang cocok dengan suasana hatimu.', filmDesc: 'Cari film, filter mood, dan lihat alasan kenapa film tersebut bisa menjadi bahan refleksi dakwah.', searchFilm: 'Cari judul, genre, atau sinopsis...', allMood: 'Semua mood', allGenre: 'Semua genre', allCast: 'Semua pemeran', allYears: 'Semua tahun', popular: 'Popularitas', previousPage: 'Sebelumnya', nextPage: 'Berikutnya', resetFilter: 'Reset Filter', noMatchingMovies: 'Tidak ada film yang cocok dengan filter saat ini', recommended: 'Rekomendasi', rating: 'Rating', year: 'Tahun', titleSort: 'Judul', askAiman: 'Tanya AIMAN', showingFilms: 'Menampilkan {count} film', changeMood: 'Ganti mood', filmNotFound: 'Film tidak ditemukan.', tryOtherFilm: 'Coba ubah kata kunci, mood, atau genre.', articlesEyebrow: 'Artikel Literasi', articlesTitle: 'Bacaan reflektif dari film dan mood.', articlesDesc: 'Kumpulan bacaan yang menghubungkan film, suasana hati, dan nilai dakwah dalam bahasa yang ringan, reflektif, dan mudah dipahami.', searchArticle: 'Cari judul film, tema refleksi, mood, atau tag...', showingArticles: 'Menampilkan {shown} dari {total} artikel', searchByMood: 'Cari berdasarkan mood', loadMore: 'Lihat selengkapnya', articleNotFound: 'Artikel tidak ditemukan', tryOtherArticle: 'Coba ubah keyword atau filter mood.', favorite: 'Favorite', myFavorites: 'Film favorit saya', emptyFavoriteTitle: 'Belum ada film favorit.', emptyFavoriteDesc: 'Sukai film dari rekomendasi untuk menyimpannya di sini.', findRecommendation: 'Cari rekomendasi', detail: 'Detail', remove: 'Hapus', moodInsight: 'Mood Insight', moodStatsTitle: 'Statistik suasana hati', totalInteractions: 'Total: {count} interaksi', moodChoicePercent: '{pct}% dari pilihan mood', dominantMood: 'Mood dominan', noData: 'Belum ada data', statsPersonalize: 'Data ini dipakai untuk mem-personalisasi skor rekomendasi film berikutnya.', activityTitle: 'Aktivitas akun', recentActivity: 'Riwayat terbaru', noActivity: 'Belum ada aktivitas.', securityTitle: 'Keamanan akun', changePassword: 'Ganti password', oldPassword: 'Password lama', newPassword: 'Password baru minimal 8 karakter', confirmPassword: 'Konfirmasi password baru', saveNewPassword: 'Simpan password baru', processing: 'Memproses...', googlePasswordNote: 'Catatan: akun Google memakai pengaturan password Google, bukan password di aplikasi.', accountLabel: 'Akun IMAN', displayName: 'Nama tampilan', saveProfile: 'Simpan profil', logout: 'Keluar', noEmail: 'Email belum tersedia', changePhoto: 'Ganti foto profil', moodBack: '← Kembali', moodToFilm: 'Mood → Dalil → Film', dalilForYou: 'Dalil Untukmu', bestRecommendation: 'Rekomendasi terbaik', topRating: 'Rating tertinggi', newest: 'Terbaru', titleAZ: 'Judul A-Z', filmRecommendations: 'Rekomendasi Film', forMood: 'Untuk mood {mood}' }
  },
  en: {
    nav: { home: 'Home', mood: 'Mood', film: 'Films', articles: 'Articles', aiman: 'AIMAN', info: 'Info', account: 'Account', login: 'Sign in', settings: 'Settings' },
    settings: { eyebrow: 'Menu', title: 'IMAN IN MOTION', language: 'Language', chooseLanguage: 'Choose display language', changeDisplayLanguage: 'Change display language', changed: 'Language changed to', clearHistory: 'Clear history', account: 'Account', open: 'Open', signIn: 'Sign in', aboutApp: 'About', aboutFounder: 'About Founder', copyright: 'Copyright', help: 'Help', view: 'View', soon: 'Soon', contact: 'Contact', logout: 'Sign out', theme: 'Theme', signInWithGoogle: 'Sign in with Google', orEmail: 'or email', namePlaceholder: 'Full name', emailPlaceholder: 'Email', passwordPlaceholder: 'Password', authProcessing: 'Processing...', authAccountNote: 'Account saves your mood preferences and reading experience in IMAN IN MOTION.', close: 'Close', historyCleared: 'Local history cleared.' },
    home: {
      eyebrow: 'Film Recommendations By Mood',
      title: 'How are you today?',
      subtitle: 'Choose the feeling closest to your day, then discover films, reflections, and conversations that match your mood.',
      previewBrand: 'IMAN IN MOTION',
      moodTitle: 'Choose Your Mood',
      ctaMood: 'Start with Mood',
      ctaFilm: 'Open Film Recommendations',
      statFilms: '696+ film data',
      statMoods: '6 final moods',
      statAiman: 'Dalil + AIMAN chat',
      dalilTitle: 'Dalil mode active',
      dalilCopy: 'Pick a mood to find a short dalil, reflection space, and films that connect with your condition.',
      modelEyebrow: 'Dakwah literacy model',
      modelTitle: 'More than recommendations, a journey to understand meaning.',
      modelDesc: 'This app connects emotional states with films, reflective articles, dalil, and AIMAN so dakwah literacy feels closer to daily life.',
      moodEyebrow: 'Choose your mood',
      moodSectionTitle: 'Start from the feeling closest to your heart.',
      moodSectionDesc: 'Each mood connects you with dalil, reflection, and suitable film recommendations.',
      recEyebrow: 'First recommendations',
      recTitle: 'Selected films to open reflection.',
      recDesc: 'This preview is taken from hidayah recommendations. Choose another mood for more personal results.',
      articleEyebrow: 'Literacy articles',
      articleTitle: 'Read the meaning behind the story.',
      articleDesc: 'Reflective writing that links film stories with dakwah values and daily experience.',
      seeMore: 'See more',
      heroLine1: 'How Do You',
      heroLine2: 'Feel Today?',
      heroDescription: 'Find films, reflections, and conversations that match your mood and day.',
      journeyHint: 'Answer three quick prompts and get a film that fits your heart right now.',
      journeyPersonalMatch: 'Personal mood match',
      journeyReset: 'Reset',
      journeyStep1: 'Step 1 of 3',
      journeyStep2: 'Step 2 of 3',
      journeyStep3: 'Step 3 of 3',
      chooseYourMood: 'Choose your mood',
      whatKindMood: 'What kind of {mood}?',
      tellItShortly: 'Tell it shortly',
      noteHint: 'Max 50 characters. Keep it simple; the film will follow your mood and detail.',
      findMyFilm: 'Find My Film',
      yourFilmMatch: 'Your film match',
      openFilm: 'Open Film',
      seeMoreButton: 'See more'
    },
    footer: { left: 'Mood-based dakwah literacy model.', right: 'Because we move with iman, story, and reflection.' },
    ui: { backHome: 'Back to Home', loginFirstTitle: 'Please sign in first.', loginFirstDesc: 'Your account saves favorite films, mood statistics, and personal recommendation history.', filmEyebrow: 'Film Recommendation', filmTitle: 'Find films that match your mood.', filmDesc: 'Search films, filter by mood, and see why each film can become a dakwah reflection.', searchFilm: 'Search title, genre, or synopsis...', allMood: 'All moods', allGenre: 'All genres', allCast: 'All cast', allYears: 'All years', popular: 'Popularity', previousPage: 'Previous', nextPage: 'Next', resetFilter: 'Reset filter', noMatchingMovies: 'No movies match the current filters', recommended: 'Recommended', rating: 'Rating', year: 'Year', titleSort: 'Title', askAiman: 'Ask AIMAN', showingFilms: 'Showing {count} films', changeMood: 'Change mood', filmNotFound: 'Film not found.', tryOtherFilm: 'Try another keyword, mood, or genre.', articlesEyebrow: 'Literacy Articles', articlesTitle: 'Reflective readings from films and moods.', articlesDesc: 'A collection of readings that connect films, emotions, and dakwah values in a light, reflective, easy-to-understand language.', searchArticle: 'Search film title, reflection theme, mood, or tag...', showingArticles: 'Showing {shown} of {total} articles', searchByMood: 'Search by mood', loadMore: 'See more', articleNotFound: 'Article not found', tryOtherArticle: 'Try another keyword or mood filter.', favorite: 'Favorite', myFavorites: 'My favorite films', emptyFavoriteTitle: 'No favorite films yet.', emptyFavoriteDesc: 'Like films from recommendations to save them here.', findRecommendation: 'Find recommendations', detail: 'Detail', remove: 'Remove', moodInsight: 'Mood Insight', moodStatsTitle: 'Mood statistics', totalInteractions: 'Total: {count} interactions', moodChoicePercent: '{pct}% of mood choices', dominantMood: 'Dominant mood', noData: 'No data yet', statsPersonalize: 'This data helps personalize your next film recommendation score.', activityTitle: 'Account activity', recentActivity: 'Recent history', noActivity: 'No activity yet.', securityTitle: 'Account security', changePassword: 'Change password', oldPassword: 'Old password', newPassword: 'New password, minimum 8 characters', confirmPassword: 'Confirm new password', saveNewPassword: 'Save new password', processing: 'Processing...', googlePasswordNote: 'Note: Google accounts use Google password settings, not the app password.', accountLabel: 'IMAN Account', displayName: 'Display name', saveProfile: 'Save profile', logout: 'Sign out', noEmail: 'Email unavailable', changePhoto: 'Change profile photo', moodBack: '← Back', moodToFilm: 'Mood → Dalil → Film', dalilForYou: 'Dalil for you', bestRecommendation: 'Best recommendations', topRating: 'Top rating', newest: 'Newest', titleAZ: 'Title A-Z', filmRecommendations: 'Film Recommendations', forMood: 'For {mood} mood' }
  },
  ms: {
    nav: { home: 'Laman', mood: 'Mood', film: 'Filem', articles: 'Artikel', aiman: 'AIMAN', info: 'Info', account: 'Akaun', login: 'Log masuk', settings: 'Tetapan' },
    settings: { eyebrow: 'Menu', title: 'IMAN IN MOTION', language: 'Bahasa', chooseLanguage: 'Pilih bahasa paparan', changeDisplayLanguage: 'Tukar bahasa paparan', changed: 'Bahasa ditukar kepada', clearHistory: 'Padam sejarah', account: 'Akaun', open: 'Buka', signIn: 'Log masuk', aboutApp: 'Tentang', aboutFounder: 'Tentang Pengasas', copyright: 'Hak Cipta', help: 'Bantuan', view: 'Lihat', soon: 'Segera', contact: 'Hubungi', logout: 'Log keluar akaun', theme: 'Tema', signInWithGoogle: 'Log masuk dengan Google', orEmail: 'atau emel', namePlaceholder: 'Nama penuh', emailPlaceholder: 'Emel', passwordPlaceholder: 'Kata laluan', authProcessing: 'Memproses...', authAccountNote: 'Akaun menyimpan keutamaan mood dan pengalaman bacaan anda di IMAN IN MOTION.', close: 'Tutup', historyCleared: 'Sejarah tempatan dihapuskan.' },
    home: {
      eyebrow: 'Cadangan Filem By Mood',
      title: 'Bagaimana harimu?',
      subtitle: 'Pilih suasana hati yang paling dekat, kemudian temui filem, refleksi, dan ruang perbualan yang sesuai dengan harimu.',
      previewBrand: 'IMAN IN MOTION',
      moodTitle: 'Pilih Moodmu',
      ctaMood: 'Mula dari Mood',
      ctaFilm: 'Buka Cadangan Filem',
      statFilms: '696+ data filem',
      statMoods: '6 mood akhir',
      statAiman: 'Dalil + AIMAN chat',
      dalilTitle: 'Mod dalil aktif',
      dalilCopy: 'Pilih suasana hati, lalu temui dalil ringkas, ruang refleksi, dan filem yang lebih sesuai dengan keadaan anda.',
      modelEyebrow: 'Model literasi dakwah',
      modelTitle: 'Bukan sekadar cadangan, tetapi perjalanan memahami makna.',
      modelDesc: 'Aplikasi ini menghubungkan emosi pengguna dengan filem, artikel reflektif, dalil, dan AIMAN agar literasi dakwah terasa dekat dengan kehidupan harian.',
      moodEyebrow: 'Pilih suasana hati',
      moodSectionTitle: 'Mula dari keadaan hati yang paling dekat.',
      moodSectionDesc: 'Setiap mood menghubungkan anda dengan dalil, refleksi, dan cadangan filem yang sesuai.',
      recEyebrow: 'Cadangan awal',
      recTitle: 'Filem pilihan untuk membuka refleksi.',
      recDesc: 'Pratonton ini diambil daripada cadangan mood hidayah. Pilih mood lain untuk hasil yang lebih personal.',
      articleEyebrow: 'Artikel literasi',
      articleTitle: 'Baca makna di sebalik tontonan.',
      articleDesc: 'Tulisan reflektif yang menghubungkan cerita filem dengan nilai dakwah dan pengalaman harian.',
      seeMore: 'Lihat selengkapnya',
      heroLine1: 'Bagaimana Perasaan Anda',
      heroLine2: 'Hari Ini?',
      heroDescription: 'Temui filem, refleksi, dan ruang perbualan yang sesuai dengan suasana hati anda.',
      journeyHint: 'Jawab tiga pertanyaan ringkas lalu dapatkan filem yang sesuai dengan hati anda sekarang.',
      journeyPersonalMatch: 'Padanan mood peribadi',
      journeyReset: 'Set semula',
      journeyStep1: 'Langkah 1 dari 3',
      journeyStep2: 'Langkah 2 dari 3',
      journeyStep3: 'Langkah 3 dari 3',
      chooseYourMood: 'Pilih mood anda',
      whatKindMood: 'Apa jenis {mood} yang paling dekat?',
      tellItShortly: 'Ceritakan secara ringkas',
      noteHint: 'Maksimum 50 aksara. Tulis ringkas, filem akan mengikuti mood dan butiran anda.',
      findMyFilm: 'Temui Filem Saya',
      yourFilmMatch: 'Padanan filem anda',
      openFilm: 'Buka Filem',
      seeMoreButton: 'Lihat selanjutnya'
    },
    footer: { left: 'Model literasi dakwah berasaskan mood.', right: 'Because we move with iman, story, and reflection.' },
    ui: { backHome: 'Kembali ke Laman', loginFirstTitle: 'Sila log masuk dahulu.', loginFirstDesc: 'Akaun digunakan untuk menyimpan filem kegemaran, statistik mood, dan sejarah cadangan peribadi.', filmEyebrow: 'Cadangan Filem', filmTitle: 'Temui filem yang sesuai dengan suasana hati anda.', filmDesc: 'Cari filem, tapis mengikut mood, dan lihat mengapa filem itu sesuai sebagai refleksi dakwah.', searchFilm: 'Cari tajuk, genre, atau sinopsis...', allMood: 'Semua mood', allGenre: 'Semua genre', allCast: 'Semua pelakon', allYears: 'Semua tahun', popular: 'Populariti', previousPage: 'Sebelum', nextPage: 'Seterusnya', resetFilter: 'Tetapkan semula penapis', noMatchingMovies: 'Tiada filem padan dengan penapis semasa', recommended: 'Cadangan', rating: 'Rating', year: 'Tahun', titleSort: 'Tajuk', askAiman: 'Tanya AIMAN', showingFilms: 'Memaparkan {count} filem', changeMood: 'Tukar mood', filmNotFound: 'Filem tidak dijumpai.', tryOtherFilm: 'Cuba kata kunci, mood, atau genre lain.', articlesEyebrow: 'Artikel Literasi', articlesTitle: 'Bacaan reflektif daripada filem dan mood.', articlesDesc: 'Koleksi bacaan yang menghubungkan filem, suasana hati, dan nilai dakwah dengan bahasa yang ringan dan mudah difahami.', searchArticle: 'Cari tajuk filem, tema refleksi, mood, atau tag...', showingArticles: 'Memaparkan {shown} daripada {total} artikel', searchByMood: 'Cari berdasarkan mood', loadMore: 'Lihat selanjutnya', articleNotFound: 'Artikel tidak dijumpai', tryOtherArticle: 'Cuba ubah kata kunci atau penapis mood.', favorite: 'Kegemaran', myFavorites: 'Filem kegemaran saya', emptyFavoriteTitle: 'Tiada filem kegemaran lagi.', emptyFavoriteDesc: 'Sukai filem daripada cadangan untuk menyimpannya di sini.', findRecommendation: 'Cari cadangan', detail: 'Perincian', remove: 'Buang', moodInsight: 'Mood Insight', moodStatsTitle: 'Statistik suasana hati', totalInteractions: 'Jumlah: {count} interaksi', moodChoicePercent: '{pct}% daripada pilihan mood', dominantMood: 'Mood dominan', noData: 'Tiada data lagi', statsPersonalize: 'Data ini membantu memperibadikan skor cadangan filem anda seterusnya.', activityTitle: 'Aktiviti akaun', recentActivity: 'Sejarah terkini', noActivity: 'Tiada aktiviti lagi.', securityTitle: 'Keselamatan akaun', changePassword: 'Tukar kata laluan', oldPassword: 'Kata laluan lama', newPassword: 'Kata laluan baru minimum 8 aksara', confirmPassword: 'Sahkan kata laluan baru', saveNewPassword: 'Simpan kata laluan baru', processing: 'Memproses...', googlePasswordNote: 'Nota: akaun Google menggunakan tetapan kata laluan Google, bukan kata laluan aplikasi.', accountLabel: 'Akaun IMAN', displayName: 'Nama paparan', saveProfile: 'Simpan profil', logout: 'Log keluar', noEmail: 'Emel belum tersedia', changePhoto: 'Tukar foto profil', moodBack: '← Kembali', moodToFilm: 'Mood → Dalil → Filem', dalilForYou: 'Dalil untukmu', bestRecommendation: 'Cadangan terbaik', topRating: 'Rating tertinggi', newest: 'Terbaru', titleAZ: 'Tajuk A-Z', filmRecommendations: 'Cadangan Filem', forMood: 'Untuk mood {mood}' }
  }
};

export function getLanguage() {
  return 'id';
}

export function getCopy(language = getLanguage()) {
  return copy[language] || copy.en;
}

export function useLanguageCopy() {
  const [language] = useState(getLanguage);
  return { language, text: getCopy(language) };
}
