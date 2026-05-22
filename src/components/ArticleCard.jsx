import LazyPoster from './LazyPoster';

function splitGenres(genres = '') {
  return String(genres).split(/[,|]/).map((item) => item.trim()).filter(Boolean);
}

function prettyMood(mood = '') {
  const normalized = String(mood || '').toLowerCase();
  const labels = {
    sedih: 'Sedih',
    gelisah: 'Gelisah',
    hidayah: 'Hidayah',
    bahagia: 'Bahagia',
    marah: 'Marah',
    rindu: 'Rindu',
    tenang: 'Tenang'
  };
  return labels[normalized] || (normalized ? normalized.charAt(0).toUpperCase() + normalized.slice(1) : 'Refleksi');
}

const moodAngles = {
  sedih: ['ruang pelan untuk menerima rasa', 'cara cerita menemani hati yang sedang berat', 'refleksi tentang luka yang tidak harus disangkal'],
  gelisah: ['jeda untuk menata napas dan pikiran', 'cara film merapikan rasa yang berisik', 'pengingat bahwa tenang bisa dimulai dari hal kecil'],
  hidayah: ['perjalanan tokoh menuju arah yang lebih jernih', 'momen balik arah yang terasa manusiawi', 'titik ketika pilihan hidup mulai dipertanyakan'],
  bahagia: ['syukur kecil yang sering luput dari perhatian', 'kehangatan cerita yang bisa dibawa pulang', 'cara film merayakan kebaikan sederhana'],
  marah: ['latihan menahan respons sebelum meledak', 'cara konflik membuka ruang pengendalian diri', 'renungan tentang energi marah agar tidak salah arah'],
  rindu: ['ingatan yang tetap hidup tanpa harus menggenggam', 'makna pulang, doa, dan jarak', 'cara cerita memeluk kehilangan dengan lembut'],
  tenang: ['tempo cerita yang memberi ruang bernapas', 'perenungan ringan setelah hari yang panjang', 'film sebagai jeda yang tidak buru-buru']
};

const titlePatterns = [
  ({ title, mood }) => `${title}: bacaan ${mood.toLowerCase()} yang tidak terasa menggurui`,
  ({ title }) => `Mengapa ${title} menarik dibaca lewat suasana hati?`,
  ({ title, primaryGenre }) => `${title} dan cara ${primaryGenre.toLowerCase()} menyimpan pesan batin`,
  ({ title, year }) => `${title} (${year}): tontonan, rasa, dan ruang refleksi`,
  ({ title, mood }) => `Saat mood ${mood.toLowerCase()} bertemu cerita ${title}`,
  ({ title }) => `${title}: bukan cuma alur, tapi pengalaman rasa`,
  ({ title, primaryGenre }) => `Membaca lapisan ${primaryGenre.toLowerCase()} dalam ${title}`,
  ({ title }) => `Catatan reflektif setelah menonton ${title}`,
  ({ title, mood }) => `${title} sebagai teman untuk mood ${mood.toLowerCase()}`,
  ({ title }) => `Hal kecil dari ${title} yang bisa dibawa setelah menonton`,
  ({ title, primaryGenre }) => `${title}: ketika ${primaryGenre.toLowerCase()} jadi pintu renungan`,
  ({ title }) => `Apa yang bisa dipetik dari ${title}?`,
  ({ title, mood }) => `Rekomendasi mood ${mood.toLowerCase()}: menyelami ${title}`,
  ({ title }) => `${title} dan pertanyaan batin yang ditinggalkannya`,
  ({ title, year }) => `Menonton ulang makna ${title} dari sudut ${year}`,
  ({ title }) => `${title}: cerita yang pelan-pelan mengajak berpikir`
];

const excerptPatterns = [
  ({ title, mood, genres, angle }) => `${title} bisa dibaca sebagai tontonan ${genres} yang membuka ${angle}. Cocok untuk penonton yang ingin memilih film lewat rasa, bukan hanya lewat genre.`,
  ({ title, mood, year, angle }) => `Dirilis pada ${year}, ${title} memberi ruang untuk ${angle}. Artikel ini mengajak pembaca melihat film sebagai teman refleksi ketika mood ${mood.toLowerCase()} sedang terasa dekat.`,
  ({ title, genres, country, angle }) => `Dengan nuansa ${genres}${country ? ` dan latar produksi ${country}` : ''}, ${title} menawarkan ${angle}. Bukan sekadar fakta film, tetapi pintu kecil menuju literasi dakwah yang lebih akrab.`,
  ({ title, mood, primaryGenre }) => `Lewat bahasa ${primaryGenre.toLowerCase()}, ${title} dapat menemani mood ${mood.toLowerCase()} tanpa harus terasa berat. Ceritanya bisa menjadi bahan untuk membaca ulang respons, pilihan, dan arah hati.`,
  ({ title, rating, angle }) => `${title}${rating ? ` punya rating ${rating}` : ''} dan menyimpan ${angle}. Dari sini, film dapat dipakai sebagai jembatan antara hiburan, emosi, dan nilai kebaikan.`,
  ({ title, mood, language }) => `${title}${language ? ` dengan bahasa ${language}` : ''} menghadirkan pengalaman yang bisa didekati lewat mood ${mood.toLowerCase()}. Pembahasannya dibuat ringan agar pembaca tidak merasa sedang membaca template data.`,
  ({ title, genres, angle }) => `Artikel ini melihat ${title} dari sisi ${angle}, dengan warna ${genres}. Fokusnya bukan cuma "film ini tentang apa", tapi "rasa apa yang tertinggal setelah menonton".`,
  ({ title, mood, angle }) => `Untuk mood ${mood.toLowerCase()}, ${title} dapat menjadi titik mulai untuk ${angle}. Cerita film diposisikan sebagai ruang bertanya, bukan jawaban yang dipaksakan.`
];

function pick(list, seed) {
  return list[Math.abs(seed) % list.length];
}

function makeArticleCopy(article) {
  const title = article.movieTitle || article.title || 'Film pilihan';
  const mood = prettyMood(article.mood);
  const genresArray = splitGenres(article.genres).slice(0, 3);
  const genres = genresArray.join(', ') || 'drama kehidupan';
  const primaryGenre = genresArray[0] || 'cerita';
  const seed = Number(article.id || article.movieId || title.length) || 1;
  const angle = pick(moodAngles[String(article.mood || '').toLowerCase()] || moodAngles.tenang, seed + 3);
  const context = {
    title,
    mood,
    genres,
    primaryGenre,
    year: article.year || 'tahun rilisnya',
    rating: article.rating,
    country: article.country,
    language: article.language,
    angle
  };

  return {
    title: pick(titlePatterns, seed)(context),
    excerpt: pick(excerptPatterns, Math.floor(seed / 2))(context)
  };
}

export { makeArticleCopy, prettyMood };

export default function ArticleCard({ article }) {
  const id = article.id || article.movieId || article.title;
  const copy = makeArticleCopy(article);

  return (
    <article className="premium-card group overflow-hidden p-3 transition hover:-translate-y-1 hover:shadow-glow">
      <div className="flex gap-4">
        <a href={`#/article/${encodeURIComponent(id)}`} className="block h-28 w-24 shrink-0 overflow-hidden rounded-2xl bg-iim-sand/30 sm:h-32 sm:w-28">
          <LazyPoster
            src={article.poster}
            alt={copy.title}
            className="h-full w-full"
            imgClassName="transition duration-500 group-hover:scale-105"
            fallback={<div className="grid h-full place-items-center text-xs font-black">Poster</div>}
          />
        </a>
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-iim-gold/20 px-2.5 py-1 text-[10px] font-extrabold uppercase text-iim-brown dark:text-iim-gold">{prettyMood(article.mood)}</span>
            <span className="text-[11px] font-bold uppercase tracking-widest text-iim-brown/70 dark:text-iim-sand/75">{article.date || 'Artikel IMAN'}</span>
          </div>
          <a href={`#/article/${encodeURIComponent(id)}`}>
            <h3 className="line-clamp-2 text-lg font-black leading-snug text-iim-coffee dark:text-iim-cream">{copy.title}</h3>
          </a>
          <p className="mt-2 line-clamp-3 text-sm leading-6 text-iim-brown/80 dark:text-iim-sand/80">{copy.excerpt}</p>
          <a href={`#/article/${encodeURIComponent(id)}`} className="mt-3 inline-flex text-xs font-extrabold text-iim-brown underline-offset-4 hover:underline dark:text-iim-gold">Lihat Fakta</a>
        </div>
      </div>
    </article>
  );
}
