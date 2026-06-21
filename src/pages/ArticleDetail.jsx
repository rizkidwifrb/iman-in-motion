import articles from '../data/articles';
import ArticleCard, { makeArticleCopy } from '../components/ArticleCard';

const moodCopy = {
  sedih: {
    label: 'Sedih',
    dalil: 'QS. At-Taubah: 40',
    ayat: 'Janganlah engkau bersedih, sesungguhnya Allah bersama kita.',
    fokus: 'sabar, penerimaan, dan kekuatan untuk tetap berjalan pelan-pelan'
  },
  gelisah: {
    label: 'Gelisah',
    dalil: 'QS. Ar-Ra’d: 28',
    ayat: 'Ingatlah, hanya dengan mengingat Allah hati menjadi tenteram.',
    fokus: 'ketenangan, tawakal, dan kemampuan menata pikiran'
  },
  hidayah: {
    label: 'Hidayah',
    dalil: 'QS. Al-Baqarah: 213',
    ayat: 'Allah memberi petunjuk kepada siapa yang Dia kehendaki menuju jalan yang lurus.',
    fokus: 'perubahan diri, keberanian kembali, dan kemauan memperbaiki arah hidup'
  },
  bahagia: {
    label: 'Bahagia',
    dalil: 'QS. Ibrahim: 7',
    ayat: 'Jika kamu bersyukur, niscaya Aku akan menambah nikmat kepadamu.',
    fokus: 'syukur, kehangatan, dan kesadaran bahwa kebahagiaan juga perlu dijaga'
  },
  marah: {
    label: 'Marah',
    dalil: 'QS. Ali Imran: 134',
    ayat: 'Orang-orang yang menahan amarahnya dan memaafkan manusia.',
    fokus: 'pengendalian diri, jeda, dan keberanian memilih respons yang lebih baik'
  },
  rindu: {
    label: 'Rindu',
    dalil: 'QS. Al-Baqarah: 152',
    ayat: 'Maka ingatlah kepada-Ku, Aku pun akan ingat kepadamu.',
    fokus: 'makna pulang, doa, kehilangan, dan hubungan yang tetap hidup dalam ingatan'
  }
};

function splitGenres(genres = '') {
  return String(genres).split(/[,|]/).map((item) => item.trim()).filter(Boolean);
}

const articleVoices = [
  {
    intro: 'personal dan hangat',
    reader: 'penonton yang ingin memahami rasa tanpa merasa digurui',
    close: 'sebagai catatan kecil untuk dibawa setelah layar selesai menyala'
  },
  {
    intro: 'analitis tetapi tetap ringan',
    reader: 'pembaca yang suka melihat hubungan antara alur, emosi, dan nilai',
    close: 'sebagai bahan diskusi setelah menonton bersama teman'
  },
  {
    intro: 'kontemplatif',
    reader: 'siapa pun yang sedang mencari jeda di tengah hari yang ramai',
    close: 'sebagai ruang untuk merapikan pikiran sebelum kembali bergerak'
  },
  {
    intro: 'naratif dan dekat dengan pengalaman sehari-hari',
    reader: 'penonton muda yang memilih film berdasarkan suasana hati',
    close: 'sebagai pengingat bahwa hiburan juga bisa menyimpan arah'
  },
  {
    intro: 'singkat, tajam, dan reflektif',
    reader: 'pengguna yang ingin rekomendasi terasa lebih personal',
    close: 'sebagai jembatan antara tontonan, emosi, dan nilai kebaikan'
  }
];

const sectionPools = {
  opening: [
    ({ title, year, genreText, voice }) => ({
      heading: `${title}: membuka percakapan dengan diri sendiri`,
      body: `${title} (${year}) tidak perlu dibaca hanya sebagai tontonan ${genreText}. Film ini juga bisa menjadi pintu untuk melihat cara manusia merespons keadaan, menata pilihan, dan mengakui perasaan yang sering disimpan diam-diam. Dengan nada ${voice.intro}, artikel ini mencoba menempatkan film sebagai ruang refleksi yang dekat dengan keseharian penonton.`
    }),
    ({ title, year, mood, genreText }) => ({
      heading: `Kenapa ${title} cocok dibaca lewat mood ${mood.label.toLowerCase()}?`,
      body: `Ada film yang terasa kuat karena alurnya, ada pula yang tinggal lebih lama karena suasana batinnya. ${title} (${year}) bergerak dalam warna ${genreText}, tetapi daya tariknya dapat dibaca lebih jauh melalui mood ${mood.label.toLowerCase()}. Pendekatan ini membuat film tidak berhenti sebagai daftar rekomendasi, melainkan menjadi bahan untuk bertanya: perasaan apa yang sedang ingin ditemani?`
    }),
    ({ title, year, genreText, ratingText }) => ({
      heading: `Mengenal ${title} dari rasa yang ditinggalkan`,
      body: `Membicarakan ${title} (${year}) bukan cuma soal genre ${genreText}.${ratingText} Yang lebih menarik adalah bagaimana film ini meninggalkan jejak rasa setelah ditonton. Jejak itu bisa berupa tenang, gelisah, haru, keberanian, atau dorongan kecil untuk memperbaiki cara memandang hidup.`
    }),
    ({ title, mood, voice }) => ({
      heading: `Catatan awal untuk penonton ${mood.label.toLowerCase()}`,
      body: `Saat seseorang memilih mood ${mood.label.toLowerCase()}, ia sebenarnya sedang memberi sinyal bahwa hatinya butuh ditemani dengan cara tertentu. ${title} masuk sebagai salah satu kemungkinan teman menonton: bukan untuk menyelesaikan semua masalah, tetapi untuk memberi ruang jeda. Karena itu, pembahasan ini ditulis untuk ${voice.reader}.`
    })
  ],
  story: [
    ({ overview, title }) => ({
      heading: 'Arah cerita yang bisa diikuti pelan-pelan',
      body: `${overview} Dari titik cerita tersebut, ${title} membuka peluang untuk membaca konflik sebagai sesuatu yang lebih manusiawi. Penonton bisa melihat bagaimana tokoh bergerak, ragu, bertahan, atau berubah ketika keadaan tidak selalu sesuai harapan.`
    }),
    ({ overview }) => ({
      heading: 'Cerita sebagai cermin kecil',
      body: `${overview} Sinopsis itu dapat menjadi cermin kecil untuk melihat bahwa manusia sering berada di antara keinginan, ketakutan, dan konsekuensi. Ketika film didekati seperti ini, penonton tidak hanya mengikuti alur, tetapi juga belajar membaca tanda-tanda emosi yang muncul selama menonton.`
    }),
    ({ overview, title }) => ({
      heading: `Lapisan konflik dalam ${title}`,
      body: `${overview} Konflik dalam film seperti ini tidak selalu harus dibaca secara besar dan berat. Kadang yang penting justru detail kecil: tatapan tokoh, keputusan yang terlambat, percakapan yang tidak selesai, atau keberanian untuk tetap berjalan meskipun belum tahu hasilnya.`
    }),
    ({ overview }) => ({
      heading: 'Yang bergerak di balik alur',
      body: `${overview} Di balik alur tersebut, ada pertanyaan yang lebih dekat dengan kehidupan: bagaimana seseorang bertahan ketika dunianya berubah? Apa yang ia pilih saat tidak semua jalan tampak mudah? Pertanyaan semacam ini membuat film terasa relevan untuk dibaca secara reflektif.`
    })
  ],
  mood: [
    ({ title, mood }) => ({
      heading: `Mood ${mood.label.toLowerCase()} sebagai pintu masuk`,
      body: `${title} dapat dikaitkan dengan mood ${mood.label.toLowerCase()} karena nuansa ceritanya dekat dengan ${mood.fokus}. Mood di sini bukan sekadar kategori aplikasi, tetapi cara untuk memahami kebutuhan batin penonton sebelum memilih tontonan.`
    }),
    ({ mood }) => ({
      heading: 'Ketika perasaan menjadi navigasi',
      body: `Memilih film lewat mood ${mood.label.toLowerCase()} membuat pengalaman menonton terasa lebih personal. Penonton tidak dipaksa memulai dari genre atau rating, melainkan dari keadaan hatinya sendiri. Dari sana, rekomendasi film bisa menjadi lebih komunikatif dan tidak terasa acak.`
    }),
    ({ title, mood }) => ({
      heading: `${title} dan kebutuhan emosional penonton`,
      body: `Dalam konteks mood ${mood.label.toLowerCase()}, ${title} dapat menjadi ruang untuk mengenali emosi tanpa harus buru-buru menghakimi diri. Ada perasaan yang perlu ditenangkan, ada yang perlu diterima, ada pula yang perlu diarahkan agar tidak berubah menjadi keputusan yang keliru.`
    }),
    ({ mood }) => ({
      heading: 'Rasa yang tidak harus disembunyikan',
      body: `Mood ${mood.label.toLowerCase()} menunjukkan bahwa perasaan manusia punya bentuk yang beragam. Film membantu memberi bahasa pada perasaan itu. Ia menghadirkan tokoh, suasana, dan konflik yang membuat penonton merasa: ternyata rasa seperti ini juga bisa dipahami.`
    })
  ],
  dakwah: [
    ({ title }) => ({
      heading: 'Nilai dakwah yang hadir secara halus',
      body: `Nilai dakwah dalam ${title} tidak harus selalu muncul melalui simbol yang terang-terangan. Ia bisa dibaca melalui kesabaran tokoh, keberanian mengakui salah, pilihan untuk memaafkan, atau kemampuan menahan diri ketika keadaan memancing respons yang buruk.`
    }),
    ({ title }) => ({
      heading: 'Dakwah lewat pengalaman, bukan ceramah',
      body: `${title} memperlihatkan bahwa pesan kebaikan dapat hadir lewat pengalaman cerita. Penonton tidak hanya diberi nasihat, tetapi diajak melihat akibat dari pilihan, luka dari keputusan, dan harapan yang muncul ketika seseorang berani berubah.`
    }),
    ({ title }) => ({
      heading: 'Membaca tanda kebaikan dalam cerita',
      body: `Setiap film memiliki cara sendiri untuk menyimpan nilai. Dalam ${title}, nilai itu dapat muncul dari relasi antar tokoh, cara konflik diselesaikan, atau keberanian untuk tetap memilih jalan yang lebih baik. Di sinilah film dapat menjadi media literasi dakwah yang lembut.`
    }),
    ({ title }) => ({
      heading: 'Ruang etis di balik hiburan',
      body: `Hiburan tidak selalu kosong dari makna. ${title} dapat mengajak penonton melihat ruang etis di balik cerita: apa yang benar, apa yang perlu ditahan, apa yang harus diperbaiki, dan bagaimana manusia belajar dari konsekuensi pilihannya.`
    })
  ],
  dalil: [
    ({ mood }) => ({
      heading: 'Dalil sebagai penuntun rasa',
      body: `Untuk mood ${mood.label.toLowerCase()}, refleksi ini dikuatkan dengan ${mood.dalil}: “${mood.ayat}” Ayat ini menjadi pengingat bahwa perasaan manusia tetap bisa diarahkan. Sedih, bahagia, marah, rindu, gelisah, dan pencarian hidayah semuanya punya ruang untuk kembali kepada Allah.`
    }),
    ({ mood }) => ({
      heading: `Penguat refleksi: ${mood.dalil}`,
      body: `${mood.dalil} mengingatkan: “${mood.ayat}” Dalam konteks menonton, dalil ini bukan ditempel sebagai hiasan, melainkan menjadi kompas kecil agar pengalaman emosional tidak berhenti pada rasa, tetapi bergerak menuju pemahaman dan perbaikan diri.`
    }),
    ({ mood }) => ({
      heading: 'Menghubungkan tontonan dengan ingatan kepada Allah',
      body: `Ketika mood ${mood.label.toLowerCase()} muncul, penonton dapat mengingat ${mood.dalil}: “${mood.ayat}” Dari sini, film menjadi pemantik, sementara nilai agama menjadi arah. Keduanya bertemu dalam pengalaman reflektif yang lebih lembut dan tidak memaksa.`
    })
  ],
  literacy: [
    ({ title }) => ({
      heading: 'Film sebagai latihan literasi dakwah',
      body: `Literasi dakwah melalui ${title} berarti melatih kemampuan membaca pesan, bukan hanya membaca teks. Penonton belajar menangkap nilai, memahami konteks, lalu menghubungkannya dengan kehidupan sendiri.`
    }),
    ({ title }) => ({
      heading: 'Dari menonton menjadi memahami',
      body: `${title} dapat menjadi contoh bagaimana menonton bisa berkembang menjadi proses memahami. Setelah film selesai, penonton masih dapat membawa pulang pertanyaan, catatan, dan nilai yang mungkin berguna dalam kehidupan sehari-hari.`
    }),
    ({ title }) => ({
      heading: 'Mengapa pendekatan mood terasa relevan?',
      body: `Pendekatan mood membuat ${title} lebih mudah didekati oleh penonton digital. Banyak orang memilih tontonan berdasarkan keadaan hati. IMAN IN MOTION memanfaatkan kebiasaan itu untuk mengarahkan penonton kepada refleksi yang lebih bermakna.`
    })
  ],
  young: [
    ({ voice }) => ({
      heading: 'Relevansi untuk penonton muda',
      body: `Bagi penonton muda, pengalaman digital perlu terasa cepat, personal, dan dekat dengan kebutuhan emosional. Karena itu, artikel seperti ini ditulis untuk ${voice.reader}. Harapannya, pengguna tidak hanya menemukan film, tetapi juga menemukan alasan untuk merenung setelah menonton.`
    }),
    ({ title }) => ({
      heading: 'Dekat dengan budaya rekomendasi hari ini',
      body: `Di tengah banjir konten, ${title} tidak cukup hanya ditampilkan sebagai judul film. Ia perlu diberi konteks: mood apa yang cocok, nilai apa yang bisa dibaca, dan kenapa film itu relevan bagi penonton yang sedang berada dalam keadaan tertentu.`
    }),
    ({ title }) => ({
      heading: 'Lebih dari sekadar daftar tontonan',
      body: `${title} menunjukkan bahwa rekomendasi film bisa dibuat lebih manusiawi. Sistem tidak hanya menyodorkan judul, tetapi juga membantu pengguna memahami alasan emosional dan reflektif di balik pilihan tersebut.`
    })
  ],
  closing: [
    ({ title, voice }) => ({
      heading: 'Penutup',
      body: `Pada akhirnya, ${title} dapat dibaca ${voice.close}. Film mungkin tidak memberi jawaban final, tetapi ia bisa membuka jalan untuk memahami diri, menata rasa, dan mengambil nilai yang lebih baik setelah menonton.`
    }),
    ({ title, mood }) => ({
      heading: 'Apa yang bisa dibawa pulang?',
      body: `Dari ${title}, penonton dapat membawa pulang satu hal sederhana: mood ${mood.label.toLowerCase()} tidak harus berhenti sebagai perasaan. Ia bisa menjadi awal untuk berdoa, berpikir, memperbaiki respons, dan melihat kembali arah hidup.`
    }),
    ({ title }) => ({
      heading: 'Setelah layar padam',
      body: `Setelah ${title} selesai, yang tersisa bukan hanya ingatan pada adegan, tetapi juga kemungkinan untuk membaca diri. Di titik itu, film menjalankan fungsi yang lebih luas: menghibur, menemani, dan membuka ruang refleksi.`
    })
  ]
};

function pickBySeed(pool, seed) {
  return pool[Math.abs(seed) % pool.length];
}

function buildLongArticle(article) {
  const moodKey = String(article.mood || 'hidayah').toLowerCase();
  const mood = moodCopy[moodKey] || moodCopy.hidayah;
  const title = article.movieTitle || article.title || 'film ini';
  const year = article.year || '-';
  const genres = splitGenres(article.genres).slice(0, 4);
  const genreText = genres.length ? genres.join(', ') : 'drama dan refleksi kehidupan';
  const ratingText = article.rating ? ` Rating ${article.rating} dapat dibaca sebagai salah satu sinyal bahwa film ini punya daya tarik bagi sebagian penonton, meski nilai utamanya tetap bergantung pada pengalaman menonton masing-masing.` : '';
  const overview = article.overview && article.overview !== 'Sinopsis belum tersedia di dataset.'
    ? article.overview
    : 'Cerita film ini dapat dibaca sebagai ruang untuk melihat manusia ketika berhadapan dengan pilihan, kehilangan, harapan, dan konsekuensi dari tindakan yang ia ambil.';
  const seed = Number(article.id || article.movieId || title.length) || 1;
  const voice = pickBySeed(articleVoices, seed);
  const ctx = { article, mood, title, year, genreText, ratingText, overview, voice };
  const orderOptions = [
    ['opening', 'story', 'mood', 'dakwah', 'dalil', 'literacy', 'young', 'closing'],
    ['opening', 'mood', 'story', 'dalil', 'dakwah', 'young', 'literacy', 'closing'],
    ['opening', 'story', 'dakwah', 'mood', 'literacy', 'dalil', 'young', 'closing'],
    ['opening', 'mood', 'dalil', 'story', 'dakwah', 'literacy', 'young', 'closing'],
    ['opening', 'story', 'young', 'mood', 'dakwah', 'dalil', 'literacy', 'closing']
  ];
  const order = pickBySeed(orderOptions, seed);
  return order.map((key, index) => pickBySeed(sectionPools[key], seed + index * 7)(ctx));
}

export default function ArticleDetail({ path }) {
  const id = decodeURIComponent(path.replace('/article/', ''));
  const article = articles.find((item) => String(item.id || item.movieId || item.title) === String(id));

  if (!article) {
    return (
      <section className="container-page py-16">
        <div className="premium-card p-10 text-center">
          <h1 className="text-3xl font-black">Artikel tidak ditemukan</h1>
          <a href="#/articles" className="btn-primary mt-6">Kembali ke Artikel</a>
        </div>
      </section>
    );
  }

  const copy = makeArticleCopy(article);
  const paragraphs = buildLongArticle(article);
  const moodKey = String(article.mood || 'hidayah').toLowerCase();
  const mood = moodCopy[moodKey] || moodCopy.hidayah;
  const relatedCandidates = articles
    .filter((item) => String(item.id || item.movieId || item.title) !== String(id))
    .filter((item) => String(item.mood || '').toLowerCase() === moodKey || String(item.genres || '').toLowerCase().includes(String(article.genres || '').split(/[|,]/)[0]?.trim().toLowerCase()))
    .slice(0, 3);
  const related = relatedCandidates.length ? relatedCandidates : articles
    .filter((item) => String(item.id || item.movieId || item.title) !== String(id))
    .slice(0, 3);

  return (
    <section className="container-page max-w-6xl py-10 md:py-14">
      <a href="#/articles" className="btn-secondary mb-6">← Kembali ke Artikel</a>
      <article className="premium-card overflow-hidden">
        <div className="grid gap-0 lg:grid-cols-[320px_1fr]">
          <aside className="border-b border-iim-brown/10 p-5 dark:border-white/10 lg:border-b-0 lg:border-r">
            {article.poster && (
              <img src={article.poster} alt={copy.title} className="mx-auto aspect-[210/297] w-full max-w-[250px] rounded-3xl object-cover shadow-premium" />
            )}
            <div className="mt-5 space-y-3 text-sm leading-7 text-iim-brown dark:text-iim-sand">
              <p><b className="text-iim-coffee dark:text-iim-cream">Film:</b> {article.movieTitle || article.title}</p>
              <p><b className="text-iim-coffee dark:text-iim-cream">Tahun:</b> {article.year || '-'}</p>
              <p><b className="text-iim-coffee dark:text-iim-cream">Genre:</b> {article.genres || '-'}</p>
              <p><b className="text-iim-coffee dark:text-iim-cream">Mood:</b> {mood.label}</p>
              <p><b className="text-iim-coffee dark:text-iim-cream">Dalil:</b> {mood.dalil}</p>
            </div>
          </aside>

          <div className="p-6 md:p-10">
            <p className="section-eyebrow">{mood.label} • {article.date || 'Artikel IMAN IN MOTION'}</p>
            <h1 className="mt-4 text-3xl font-black leading-tight tracking-tight md:text-5xl">{copy.title}</h1>
            <p className="mt-5 max-w-3xl text-base font-semibold leading-8 text-iim-brown dark:text-iim-sand">{copy.excerpt}</p>

            <div className="mt-7 rounded-3xl border border-iim-gold/20 bg-iim-gold/10 p-5">
              <p className="text-sm font-extrabold uppercase tracking-widest text-iim-brown dark:text-iim-gold">Penguat refleksi</p>
              <p className="mt-3 text-lg font-semibold leading-8">{mood.dalil}: “{mood.ayat}”</p>
            </div>

            <div className="article-body mt-9 space-y-8">
              {paragraphs.map((section) => (
                <section key={section.heading}>
                  <h2>{section.heading}</h2>
                  <p>{section.body}</p>
                </section>
              ))}
            </div>

            <div className="mt-10 flex flex-wrap gap-2">
              {(article.tags || []).slice(0, 12).map((tag) => <span key={tag} className="rounded-full bg-iim-gold/20 px-3 py-1 text-xs font-bold text-iim-brown dark:text-iim-sand">#{tag}</span>)}
            </div>
          </div>
        </div>
      </article>

      {related.length > 0 && (
        <section className="mt-10">
          <p className="section-eyebrow">Baca juga</p>
          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            {related.map((item) => <ArticleCard key={item.id || item.movieId || item.title} article={item} />)}
          </div>
        </section>
      )}
    </section>
  );
}
