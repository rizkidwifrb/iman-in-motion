import { useEffect, useState } from 'react';

export const languageOptions = [
  { code: 'id', label: 'Indonesia', native: 'Bahasa Indonesia' },
  { code: 'en', label: 'English', native: 'English' },
  { code: 'ms', label: 'Melayu', native: 'Bahasa Melayu' },
  { code: 'ar', label: 'Arab', native: 'العربية' }
];

export const copy = {
  id: {
    nav: { home: 'Home', mood: 'Mood', film: 'Film', articles: 'Artikel', aiman: 'AIMAN', info: 'Info', account: 'Akun', login: 'Masuk', settings: 'Pengaturan' },
    settings: { eyebrow: 'Menu', title: 'IMAN IN MOTION', language: 'Bahasa', chooseLanguage: 'Pilih bahasa tampilan', changeDisplayLanguage: 'Ubah bahasa tampilan', changed: 'Bahasa diubah ke', clearHistory: 'Hapus riwayat', account: 'Akun', open: 'Buka', signIn: 'Masuk', aboutApp: 'Tentang IMAN IN MOTION', aboutFounder: 'About Founder', copyright: 'Hak Cipta', help: 'Bantuan', view: 'Lihat', soon: 'Soon', contact: 'Kontak', logout: 'Keluar akun' },
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
      seeMore: 'Lihat selengkapnya'
    },
    footer: { left: 'Model literasi dakwah berbasis mood.', right: 'Because we move with iman, story, and reflection.' },
    ui: { backHome: 'Kembali ke Home', loginFirstTitle: 'Login dulu ya.', loginFirstDesc: 'Akun dipakai untuk menyimpan film favorit, statistik mood, dan riwayat rekomendasi personal.', filmEyebrow: 'Rekomendasi Film', filmTitle: 'Temukan film yang cocok dengan suasana hatimu.', filmDesc: 'Cari film, filter mood, dan lihat alasan kenapa film tersebut bisa menjadi bahan refleksi dakwah.', searchFilm: 'Cari judul, genre, atau sinopsis...', allMood: 'Semua mood', allGenre: 'Semua genre', recommended: 'Rekomendasi', rating: 'Rating', year: 'Tahun', titleSort: 'Judul', askAiman: 'Tanya AIMAN', showingFilms: 'Menampilkan {count} film', changeMood: 'Ganti mood', filmNotFound: 'Film tidak ditemukan.', tryOtherFilm: 'Coba ubah kata kunci, mood, atau genre.', articlesEyebrow: 'Artikel Literasi', articlesTitle: 'Bacaan reflektif dari film dan mood.', articlesDesc: 'Kumpulan bacaan yang menghubungkan film, suasana hati, dan nilai dakwah dalam bahasa yang ringan, reflektif, dan mudah dipahami.', searchArticle: 'Cari judul film, tema refleksi, mood, atau tag...', showingArticles: 'Menampilkan {shown} dari {total} artikel', searchByMood: 'Cari berdasarkan mood', loadMore: 'Lihat selengkapnya', articleNotFound: 'Artikel tidak ditemukan', tryOtherArticle: 'Coba ubah keyword atau filter mood.', favorite: 'Favorite', myFavorites: 'Film favorit saya', emptyFavoriteTitle: 'Belum ada film favorit.', emptyFavoriteDesc: 'Sukai film dari rekomendasi untuk menyimpannya di sini.', findRecommendation: 'Cari rekomendasi', detail: 'Detail', remove: 'Hapus', moodInsight: 'Mood Insight', moodStatsTitle: 'Statistik suasana hati', totalInteractions: 'Total: {count} interaksi', moodChoicePercent: '{pct}% dari pilihan mood', dominantMood: 'Mood dominan', noData: 'Belum ada data', statsPersonalize: 'Data ini dipakai untuk mem-personalisasi skor rekomendasi film berikutnya.', activityTitle: 'Aktivitas akun', recentActivity: 'Riwayat terbaru', noActivity: 'Belum ada aktivitas.', securityTitle: 'Keamanan akun', changePassword: 'Ganti password', oldPassword: 'Password lama', newPassword: 'Password baru minimal 8 karakter', confirmPassword: 'Konfirmasi password baru', saveNewPassword: 'Simpan password baru', processing: 'Memproses...', googlePasswordNote: 'Catatan: akun Google memakai pengaturan password Google, bukan password di aplikasi.', accountLabel: 'Akun IMAN', displayName: 'Nama tampilan', saveProfile: 'Simpan profil', logout: 'Keluar', noEmail: 'Email belum tersedia', changePhoto: 'Ganti foto profil', moodBack: '← Kembali', moodToFilm: 'Mood → Dalil → Film', dalilForYou: 'Dalil Untukmu', bestRecommendation: 'Rekomendasi terbaik', topRating: 'Rating tertinggi', newest: 'Terbaru', titleAZ: 'Judul A-Z', filmRecommendations: 'Rekomendasi Film', forMood: 'Untuk mood {mood}' }
  },
  en: {
    nav: { home: 'Home', mood: 'Mood', film: 'Films', articles: 'Articles', aiman: 'AIMAN', info: 'Info', account: 'Account', login: 'Sign in', settings: 'Settings' },
    settings: { eyebrow: 'Menu', title: 'IMAN IN MOTION', language: 'Language', chooseLanguage: 'Choose display language', changeDisplayLanguage: 'Change display language', changed: 'Language changed to', clearHistory: 'Clear history', account: 'Account', open: 'Open', signIn: 'Sign in', aboutApp: 'About IMAN IN MOTION', aboutFounder: 'About Founder', copyright: 'Copyright', help: 'Help', view: 'View', soon: 'Soon', contact: 'Contact', logout: 'Sign out' },
    home: {
      eyebrow: 'Film Recommendations By Mood',
      title: 'How are you today?',
      subtitle: 'Choose the feeling closest to your day, then discover films, reflection, and conversations that match your mood.',
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
      seeMore: 'See more'
    },
    footer: { left: 'Mood-based dakwah literacy model.', right: 'Because we move with iman, story, and reflection.' },
    ui: { backHome: 'Back to Home', loginFirstTitle: 'Please sign in first.', loginFirstDesc: 'Your account saves favorite films, mood statistics, and personal recommendation history.', filmEyebrow: 'Film Recommendation', filmTitle: 'Find films that match your mood.', filmDesc: 'Search films, filter by mood, and see why each film can become a dakwah reflection.', searchFilm: 'Search title, genre, or synopsis...', allMood: 'All moods', allGenre: 'All genres', recommended: 'Recommended', rating: 'Rating', year: 'Year', titleSort: 'Title', askAiman: 'Ask AIMAN', showingFilms: 'Showing {count} films', changeMood: 'Change mood', filmNotFound: 'Film not found.', tryOtherFilm: 'Try another keyword, mood, or genre.', articlesEyebrow: 'Literacy Articles', articlesTitle: 'Reflective readings from films and moods.', articlesDesc: 'A collection of readings that connect films, emotions, and dakwah values in a light, reflective, easy-to-understand language.', searchArticle: 'Search film title, reflection theme, mood, or tag...', showingArticles: 'Showing {shown} of {total} articles', searchByMood: 'Search by mood', loadMore: 'See more', articleNotFound: 'Article not found', tryOtherArticle: 'Try another keyword or mood filter.', favorite: 'Favorite', myFavorites: 'My favorite films', emptyFavoriteTitle: 'No favorite films yet.', emptyFavoriteDesc: 'Like films from recommendations to save them here.', findRecommendation: 'Find recommendations', detail: 'Detail', remove: 'Remove', moodInsight: 'Mood Insight', moodStatsTitle: 'Mood statistics', totalInteractions: 'Total: {count} interactions', moodChoicePercent: '{pct}% of mood choices', dominantMood: 'Dominant mood', noData: 'No data yet', statsPersonalize: 'This data helps personalize your next film recommendation score.', activityTitle: 'Account activity', recentActivity: 'Recent history', noActivity: 'No activity yet.', securityTitle: 'Account security', changePassword: 'Change password', oldPassword: 'Old password', newPassword: 'New password, minimum 8 characters', confirmPassword: 'Confirm new password', saveNewPassword: 'Save new password', processing: 'Processing...', googlePasswordNote: 'Note: Google accounts use Google password settings, not the app password.', accountLabel: 'IMAN Account', displayName: 'Display name', saveProfile: 'Save profile', logout: 'Sign out', noEmail: 'Email unavailable', changePhoto: 'Change profile photo', moodBack: '← Back', moodToFilm: 'Mood → Dalil → Film', dalilForYou: 'Dalil for you', bestRecommendation: 'Best recommendations', topRating: 'Top rating', newest: 'Newest', titleAZ: 'Title A-Z', filmRecommendations: 'Film Recommendations', forMood: 'For {mood} mood' }
  },
  ms: {
    nav: { home: 'Laman', mood: 'Mood', film: 'Filem', articles: 'Artikel', aiman: 'AIMAN', info: 'Info', account: 'Akaun', login: 'Log masuk', settings: 'Tetapan' },
    settings: { eyebrow: 'Menu', title: 'IMAN IN MOTION', language: 'Bahasa', chooseLanguage: 'Pilih bahasa paparan', changeDisplayLanguage: 'Tukar bahasa paparan', changed: 'Bahasa ditukar kepada', clearHistory: 'Padam sejarah', account: 'Akaun', open: 'Buka', signIn: 'Log masuk', aboutApp: 'Tentang IMAN IN MOTION', aboutFounder: 'Tentang Founder', copyright: 'Hak Cipta', help: 'Bantuan', view: 'Lihat', soon: 'Akan datang', contact: 'Hubungi', logout: 'Log keluar' },
    home: {
      eyebrow: 'Cadangan Filem By Mood',
      title: 'Bagaimana harimu?',
      subtitle: 'Pilih suasana hati yang paling dekat, kemudian temukan filem, refleksi, dan ruang percakapan yang sesuai dengan harimu.',
      previewBrand: 'IMAN IN MOTION',
      moodTitle: 'Pilih Moodmu',
      ctaMood: 'Mula dari Mood',
      ctaFilm: 'Buka Cadangan Filem',
      statFilms: '696+ data filem',
      statMoods: '6 mood akhir',
      statAiman: 'Dalil + AIMAN chat',
      dalilTitle: 'Mod dalil aktif',
      dalilCopy: 'Pilih suasana hati, lalu temukan dalil ringkas, ruang refleksi, dan filem yang lebih sesuai dengan keadaan kamu.',
      modelEyebrow: 'Model literasi dakwah',
      modelTitle: 'Bukan sekadar cadangan, tetapi perjalanan memahami makna.',
      modelDesc: 'Aplikasi ini menghubungkan emosi pengguna dengan filem, artikel reflektif, dalil, dan AIMAN agar literasi dakwah terasa dekat dengan kehidupan harian.',
      moodEyebrow: 'Pilih suasana hati',
      moodSectionTitle: 'Mula dari keadaan hati yang paling dekat.',
      moodSectionDesc: 'Setiap mood menghubungkan kamu dengan dalil, refleksi, dan cadangan filem yang sesuai.',
      recEyebrow: 'Cadangan awal',
      recTitle: 'Filem pilihan untuk membuka refleksi.',
      recDesc: 'Pratonton ini diambil daripada cadangan mood hidayah. Pilih mood lain untuk hasil yang lebih personal.',
      articleEyebrow: 'Artikel literasi',
      articleTitle: 'Baca makna di sebalik tontonan.',
      articleDesc: 'Tulisan reflektif yang menghubungkan cerita filem dengan nilai dakwah dan pengalaman harian.',
      seeMore: 'Lihat selengkapnya'
    },
    footer: { left: 'Model literasi dakwah berasaskan mood.', right: 'Because we move with iman, story, and reflection.' },
    ui: { backHome: 'Kembali ke Laman', loginFirstTitle: 'Sila log masuk dahulu.', loginFirstDesc: 'Akaun digunakan untuk menyimpan filem kegemaran, statistik mood, dan sejarah cadangan peribadi.', filmEyebrow: 'Cadangan Filem', filmTitle: 'Temukan filem yang sesuai dengan suasana hatimu.', filmDesc: 'Cari filem, tapis mood, dan lihat sebab filem itu sesuai sebagai refleksi dakwah.', searchFilm: 'Cari tajuk, genre, atau sinopsis...', allMood: 'Semua mood', allGenre: 'Semua genre', recommended: 'Cadangan', rating: 'Rating', year: 'Tahun', titleSort: 'Tajuk', askAiman: 'Tanya AIMAN', showingFilms: 'Memaparkan {count} filem', changeMood: 'Tukar mood', filmNotFound: 'Filem tidak ditemukan.', tryOtherFilm: 'Cuba ubah kata kunci, mood, atau genre.', articlesEyebrow: 'Artikel Literasi', articlesTitle: 'Bacaan reflektif daripada filem dan mood.', articlesDesc: 'Koleksi bacaan yang menghubungkan filem, suasana hati, dan nilai dakwah dengan bahasa yang ringan dan mudah difahami.', searchArticle: 'Cari tajuk filem, tema refleksi, mood, atau tag...', showingArticles: 'Memaparkan {shown} daripada {total} artikel', searchByMood: 'Cari berdasarkan mood', loadMore: 'Lihat selanjutnya', articleNotFound: 'Artikel tidak ditemukan', tryOtherArticle: 'Cuba ubah keyword atau filter mood.', favorite: 'Kegemaran', myFavorites: 'Filem kegemaran saya', emptyFavoriteTitle: 'Belum ada filem kegemaran.', emptyFavoriteDesc: 'Sukai filem daripada cadangan untuk menyimpannya di sini.', findRecommendation: 'Cari cadangan', detail: 'Detail', remove: 'Hapus', moodInsight: 'Mood Insight', moodStatsTitle: 'Statistik suasana hati', totalInteractions: 'Total: {count} interaksi', moodChoicePercent: '{pct}% daripada pilihan mood', dominantMood: 'Mood dominan', noData: 'Belum ada data', statsPersonalize: 'Data ini digunakan untuk memperibadikan skor cadangan filem berikutnya.', activityTitle: 'Aktiviti akaun', recentActivity: 'Sejarah terbaru', noActivity: 'Belum ada aktiviti.', securityTitle: 'Keselamatan akaun', changePassword: 'Tukar password', oldPassword: 'Password lama', newPassword: 'Password baru minimum 8 karakter', confirmPassword: 'Sahkan password baru', saveNewPassword: 'Simpan password baru', processing: 'Memproses...', googlePasswordNote: 'Nota: akaun Google menggunakan tetapan password Google, bukan password aplikasi.', accountLabel: 'Akaun IMAN', displayName: 'Nama paparan', saveProfile: 'Simpan profil', logout: 'Log keluar', noEmail: 'Email belum tersedia', changePhoto: 'Tukar foto profil', moodBack: '← Kembali', moodToFilm: 'Mood → Dalil → Filem', dalilForYou: 'Dalil untukmu', bestRecommendation: 'Cadangan terbaik', topRating: 'Rating tertinggi', newest: 'Terbaru', titleAZ: 'Tajuk A-Z', filmRecommendations: 'Cadangan Filem', forMood: 'Untuk mood {mood}' }
  },
  ar: {
    nav: { home: 'الرئيسية', mood: 'المزاج', film: 'الأفلام', articles: 'المقالات', aiman: 'AIMAN', info: 'حول', account: 'الحساب', login: 'دخول', settings: 'الإعدادات' },
    settings: { eyebrow: 'القائمة', title: 'IMAN IN MOTION', language: 'اللغة', chooseLanguage: 'اختر لغة العرض', changeDisplayLanguage: 'تغيير لغة العرض', changed: 'تم تغيير اللغة إلى', clearHistory: 'مسح السجل', account: 'الحساب', open: 'فتح', signIn: 'تسجيل الدخول', aboutApp: 'حول IMAN IN MOTION', aboutFounder: 'حول المؤسس', copyright: 'حقوق النشر', help: 'مساعدة', view: 'عرض', soon: 'قريبًا', contact: 'تواصل', logout: 'تسجيل الخروج' },
    home: {
      eyebrow: 'توصيات أفلام حسب المزاج',
      title: 'كيف حالك اليوم؟',
      subtitle: 'اختر الشعور الأقرب ليومك، ثم اكتشف أفلامًا وتأملات وحوارًا يناسب حالتك.',
      previewBrand: 'IMAN IN MOTION',
      moodTitle: 'اختر مزاجك',
      ctaMood: 'ابدأ من المزاج',
      ctaFilm: 'افتح توصيات الأفلام',
      statFilms: '+696 بيانات أفلام',
      statMoods: '6 حالات مزاجية',
      statAiman: 'دليل + محادثة AIMAN',
      dalilTitle: 'وضع الدليل مفعل',
      dalilCopy: 'اختر حالتك لتجد دليلًا قصيرًا ومساحة للتأمل وأفلامًا أقرب إلى شعورك.',
      modelEyebrow: 'نموذج معرفة دعوية',
      modelTitle: 'ليس مجرد توصية، بل رحلة لفهم المعنى.',
      modelDesc: 'يربط التطبيق الحالة الشعورية بالأفلام والمقالات التأملية والدليل و AIMAN لتصبح المعرفة الدعوية أقرب للحياة اليومية.',
      moodEyebrow: 'اختر مزاجك',
      moodSectionTitle: 'ابدأ من الشعور الأقرب إلى قلبك.',
      moodSectionDesc: 'كل مزاج يربطك بدليل وتأمل وتوصيات أفلام مناسبة.',
      recEyebrow: 'توصيات أولية',
      recTitle: 'أفلام مختارة لفتح باب التأمل.',
      recDesc: 'هذه المعاينة مأخوذة من توصيات الهداية. اختر مزاجًا آخر لنتائج أكثر شخصية.',
      articleEyebrow: 'مقالات معرفية',
      articleTitle: 'اقرأ المعنى خلف المشاهدة.',
      articleDesc: 'كتابات تأملية تربط قصص الأفلام بالقيم الدعوية والتجربة اليومية.',
      seeMore: 'شاهد المزيد'
    },
    footer: { left: 'نموذج معرفة دعوية قائم على المزاج.', right: 'Because we move with iman, story, and reflection.' },
    ui: { backHome: 'العودة للرئيسية', loginFirstTitle: 'سجّل الدخول أولًا.', loginFirstDesc: 'يحفظ الحساب الأفلام المفضلة وإحصاءات المزاج وسجل التوصيات الشخصية.', filmEyebrow: 'توصيات الأفلام', filmTitle: 'اعثر على أفلام تناسب حالتك.', filmDesc: 'ابحث عن الأفلام وصفّها حسب المزاج واعرف لماذا يمكن أن تكون مادة للتأمل الدعوي.', searchFilm: 'ابحث عن العنوان أو النوع أو الملخص...', allMood: 'كل الحالات', allGenre: 'كل الأنواع', recommended: 'موصى به', rating: 'التقييم', year: 'السنة', titleSort: 'العنوان', askAiman: 'اسأل AIMAN', showingFilms: 'عرض {count} فيلمًا', changeMood: 'تغيير المزاج', filmNotFound: 'لم يتم العثور على الفيلم.', tryOtherFilm: 'جرّب كلمة أو مزاجًا أو نوعًا آخر.', articlesEyebrow: 'مقالات معرفية', articlesTitle: 'قراءات تأملية من الأفلام والمزاج.', articlesDesc: 'مجموعة قراءات تربط الأفلام والمشاعر والقيم الدعوية بلغة خفيفة وتأملية.', searchArticle: 'ابحث عن عنوان الفيلم أو موضوع التأمل أو المزاج أو الوسم...', showingArticles: 'عرض {shown} من {total} مقالة', searchByMood: 'البحث حسب المزاج', loadMore: 'شاهد المزيد', articleNotFound: 'لم يتم العثور على مقالات', tryOtherArticle: 'جرّب كلمة أو فلتر مزاج آخر.', favorite: 'المفضلة', myFavorites: 'أفلامي المفضلة', emptyFavoriteTitle: 'لا توجد أفلام مفضلة بعد.', emptyFavoriteDesc: 'أعجب بالأفلام من التوصيات لحفظها هنا.', findRecommendation: 'ابحث عن توصيات', detail: 'تفاصيل', remove: 'حذف', moodInsight: 'رؤى المزاج', moodStatsTitle: 'إحصاءات المزاج', totalInteractions: 'المجموع: {count} تفاعل', moodChoicePercent: '{pct}% من اختيارات المزاج', dominantMood: 'المزاج الغالب', noData: 'لا توجد بيانات بعد', statsPersonalize: 'تُستخدم هذه البيانات لتخصيص نتيجة التوصيات التالية.', activityTitle: 'نشاط الحساب', recentActivity: 'السجل الأخير', noActivity: 'لا يوجد نشاط بعد.', securityTitle: 'أمان الحساب', changePassword: 'تغيير كلمة المرور', oldPassword: 'كلمة المرور القديمة', newPassword: 'كلمة مرور جديدة، 8 أحرف على الأقل', confirmPassword: 'تأكيد كلمة المرور الجديدة', saveNewPassword: 'حفظ كلمة المرور الجديدة', processing: 'جاري المعالجة...', googlePasswordNote: 'ملاحظة: حسابات Google تستخدم إعدادات كلمة مرور Google وليس كلمة مرور التطبيق.', accountLabel: 'حساب IMAN', displayName: 'اسم العرض', saveProfile: 'حفظ الملف الشخصي', logout: 'تسجيل الخروج', noEmail: 'البريد غير متاح', changePhoto: 'تغيير صورة الملف الشخصي', moodBack: '← رجوع', moodToFilm: 'المزاج → الدليل → الفيلم', dalilForYou: 'دليل لك', bestRecommendation: 'أفضل التوصيات', topRating: 'أعلى تقييم', newest: 'الأحدث', titleAZ: 'العنوان A-Z', filmRecommendations: 'توصيات الأفلام', forMood: 'لمزاج {mood}' }
  }
};

export function getLanguage() {
  if (typeof window === 'undefined') return 'id';
  return localStorage.getItem('iim-language') || 'id';
}

export function getCopy(language = getLanguage()) {
  return copy[language] || copy.id;
}

export function useLanguageCopy() {
  const [language, setLanguage] = useState(getLanguage);

  useEffect(() => {
    const sync = () => setLanguage(getLanguage());
    window.addEventListener('storage', sync);
    window.addEventListener('iim-language-change', sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener('iim-language-change', sync);
    };
  }, []);

  return { language, text: getCopy(language) };
}
