import { useEffect, useMemo, useState } from 'react';
import { BadgeCheck, ChevronDown, Copy, FileText, Instagram, ShieldCheck, UserRound } from 'lucide-react';
import SectionTitle from '../components/SectionTitle';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { assetUrl } from '../utils/assetUrl';

const educationLine = 'Komunikasi dan Penyiaran Islam • Fakultas Agama Islam • UIKA Bogor';

const projectAdvisors = [
  {
    name: 'Prof. Dr. H.E. Mujahidin',
    role: 'Pembimbing Project',
    title: 'Rektor UIKA Bogor',
    image: assetUrl('mujahidin.png')
  },
  {
    name: 'Dr. Rofiah, M.Si.',
    role: 'Pembimbing Project',
    title: 'Kaprodi KPI UIKA Bogor',
    image: assetUrl('rofiah.png')
  }
];

const teamMembers = [
  {
    name: 'Rizki Dwi Febriansyah',
    shortName: 'Dwi',
    label: 'Founder • Fullstack Developer • UI/UX Designer • Creative Media',
    image: assetUrl('dwi.jpg'),
    imagePosition: 'center 20%',
    badge: 'Project Lead',
    instagram: '@uwiberani',
    instagramUrl: 'https://www.instagram.com/uwiberani/',
    summary: 'Dwi mengerjakan IMAN IN MOTION dari 0: konsep, branding, UI/UX, frontend React, Firebase, Firestore, fitur akun, favorite, statistik mood, AIMAN, dan sistem rekomendasi berbasis mood.',
    story: 'Rizki Dwi Febriansyah, yang biasa dipanggil Dwi, berasal dari latar belakang media kreatif dan graphic design. Berangkat dari dunia visual, Dwi terbiasa menyusun identitas, komposisi, warna, dan pengalaman yang enak dilihat. Dari sana, ketertarikannya berkembang ke UI/UX, fullstack web development, dan pemanfaatan AI untuk membuat pengalaman digital yang lebih personal.',
    journey: 'Melalui proses belajar mandiri dan program PIJAK by Dicoding, Dwi membangun IMAN IN MOTION sebagai project fullstack yang utuh. Project ini dikerjakan dari nol, mulai dari riset konsep, desain tampilan, struktur data film, rekomendasi, integrasi Firebase, responsive layout, sampai personalisasi pengguna.'
  },
  {
    name: 'Faris All Farizki',
    shortName: 'Faris',
    label: 'Media Center • Layout & Function Arrangement',
    image: assetUrl('faris.jpg'),
    imagePosition: 'center 28%',
    badge: 'Media Center',
    instagram: '',
    instagramUrl: '',
    summary: 'Faris All Farizki berperan sebagai Media Center di UIKA-Berani Team, membantu pengaturan penataan letak, alur fungsi, dan kerapian pengalaman visual IMAN IN MOTION.',
    story: 'Faris All Farizki berperan sebagai Media Center yang membantu menjaga penataan letak, keterbacaan tampilan, dan konsistensi fungsi antarmuka. Perannya memastikan elemen visual, susunan konten, dan arah penggunaan aplikasi tetap rapi, mudah dipahami, dan selaras dengan identitas IMAN IN MOTION.',
    journey: 'Dalam UIKA-Berani Team, Faris mendukung sisi media dan tata letak agar aplikasi tidak hanya berjalan secara teknis, tetapi juga nyaman dilihat dan mudah digunakan. Dwi tetap menjadi fullstack developer utama, sementara Faris memperkuat sisi penataan visual, fungsi, dan media center project.'
  }
];

const founderHighlights = [
  ['Built from Zero', 'Fondasi aplikasi disusun dari ide awal, struktur halaman, visual identity, pengalaman pengguna, hingga integrasi data.'],
  ['Fullstack Ownership', 'Mengelola frontend React, data flow, Firebase Auth, Firestore, akun, favorite, statistik mood, dan fitur AI.'],
  ['Creative Media DNA', 'Latar graphic design membuat IMAN IN MOTION punya rasa visual yang cinematic, emosional, dan mudah dikenali.'],
  ['PIJAK by Dicoding', 'Proses teknis diperkuat dari program PIJAK by Dicoding, lalu diterapkan langsung menjadi web app nyata.']
];

const founderSkills = [
  'Fullstack Development', 'React JS', 'Firebase Auth', 'Cloud Firestore', 'UI/UX Design', 'Graphic Design',
  'Creative Branding', 'Recommendation System', 'AI-assisted Development', 'Responsive Web',
  'Emotional Experience Design', 'Digital Dakwah Product'
];

const copyrightDetails = [
  ['Nomor Pencatatan', '001241778'],
  ['Nomor Permohonan', 'EC002026069338'],
  ['Jenis Ciptaan', 'Program Komputer'],
  ['Tanggal Permohonan', '21 Mei 2026'],
  ['Pertama Diumumkan', '19 Mei 2026, Kota Bogor']
];

const copyrightCertificatePath = assetUrl('sertifikat-hak-cipta-iman-in-motion.pdf');

const tabs = [
  ['about', 'Tentang IMAN IN MOTION'],
  ['team', 'About Team'],
  ['copyright', 'Hak Cipta'],
  ['help', 'Bantuan']
];

function getTab() {
  const params = new URLSearchParams(window.location.hash.split('?')[1] || '');
  const value = params.get('tab') || 'about';
  return tabs.some(([key]) => key === value) ? value : 'about';
}

function copyText(text, setCopied) {
  navigator.clipboard?.writeText(text).then(() => {
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }).catch(() => setCopied(false));
}

export default function Info() {
  const [activeTab, setActiveTab] = useState(getTab());
  const [copied, setCopied] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);

  useEffect(() => {
    const sync = () => setActiveTab(getTab());
    window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
  }, []);

  const title = useMemo(() => tabs.find(([key]) => key === activeTab)?.[1] || 'Tentang IMAN IN MOTION', [activeTab]);

  function setTab(tab) {
    setActiveTab(tab);
    window.history.replaceState(null, '', `#/info?tab=${tab}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <section className="info-page container-page py-12 md:py-16" data-page="info">
      <SectionTitle eyebrow="Info Project" title={title} description="Pusat informasi IMAN IN MOTION: konsep aplikasi, team, catatan hak cipta, dan bantuan penggunaan." />

      <div className="info-mobile-picker mb-8 md:hidden">
        <p className="mb-2 text-[11px] font-black uppercase tracking-[0.22em] text-iim-brown dark:text-iim-gold">Pilih informasi</p>
        <div className="info-select-shell">
          <select value={activeTab} onChange={(e) => setTab(e.target.value)} aria-label="Pilih informasi IMAN IN MOTION">
            <option value="about">Tentang</option>
            <option value="team">Team</option>
            <option value="copyright">Hak Cipta</option>
            <option value="help">Bantuan</option>
          </select>
          <ChevronDown size={18} className="info-select-icon" />
        </div>
      </div>

      <div className="info-desktop-tabs mb-8 hidden gap-2 overflow-x-auto rounded-[1.5rem] border border-iim-brown/10 bg-white/50 p-2 dark:border-white/10 dark:bg-white/10 md:flex">
        {tabs.map(([key, label]) => (
          <button key={key} type="button" onClick={() => setTab(key)} className={`shrink-0 rounded-xl px-4 py-3 text-sm font-black transition ${activeTab === key ? 'bg-iim-coffee text-iim-cream dark:bg-iim-gold dark:text-iim-charcoal' : 'text-iim-coffee hover:bg-white/70 dark:text-iim-cream dark:hover:bg-white/10'}`}>
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'about' && (
        <div className="space-y-6" data-scroll-reveal>
          <div className="grid gap-5 lg:grid-cols-2">
            <Card className="rounded-[2rem]"><CardContent className="p-6 md:p-8"><h2 className="text-2xl font-black">Apa itu IMAN IN MOTION?</h2><p className="mt-4 leading-8 text-iim-brown dark:text-iim-sand">IMAN IN MOTION adalah aplikasi rekomendasi film dakwah berbasis mood yang membantu pengguna menemukan tontonan sesuai kondisi hati. Aplikasi ini tidak hanya menyajikan daftar film, tetapi juga menghubungkan film dengan dalil, artikel reflektif, dan percakapan AIMAN sebagai ruang pemahaman dakwah yang lebih personal.</p></CardContent></Card>
            <Card className="rounded-[2rem]"><CardContent className="p-6 md:p-8"><h2 className="text-2xl font-black">Tujuan aplikasi</h2><p className="mt-4 leading-8 text-iim-brown dark:text-iim-sand">Tujuan utama IMAN IN MOTION adalah menghadirkan literasi dakwah dalam bentuk yang dekat dengan kebiasaan audiens digital. Pengguna memulai dari mood, lalu diarahkan pada film, nilai pesan, artikel, dan percakapan yang membantu membaca makna di balik cerita.</p></CardContent></Card>
          </div>

          <Card className="rounded-[2rem]"><CardContent className="p-6 md:p-8"><h2 className="text-2xl font-black">Model literasi dakwah berbasis mood</h2><div className="mt-5 grid gap-4 md:grid-cols-5">{[['1','Mood','Pengguna memilih kondisi hati yang paling dekat.'],['2','Film','Sistem menampilkan film yang sesuai dengan mood.'],['3','Dalil','Penguatan nilai Islam diberikan sesuai konteks rasa.'],['4','Artikel','Cerita film dibaca sebagai bahan refleksi dakwah.'],['5','AIMAN','Chat membantu pengguna memahami rasa secara lebih personal.']].map(([num, head, desc]) => <div key={num} className="rounded-2xl bg-white/60 p-4 dark:bg-white/10"><div className="grid h-10 w-10 place-items-center rounded-xl bg-iim-gold text-sm font-black text-iim-charcoal">{num}</div><h3 className="mt-4 font-black">{head}</h3><p className="mt-2 text-sm leading-6 text-iim-brown dark:text-iim-sand">{desc}</p></div>)}</div></CardContent></Card>

          <div className="grid gap-5 lg:grid-cols-3">{[['Komunikasi Interpersonal','Aplikasi menyapa pengguna dari kondisi perasaan sehingga pengalaman terasa lebih dekat dan tidak menghakimi.'],['Komunikasi Dakwah','Pesan dakwah disampaikan secara lembut melalui cerita, refleksi, dan dalil yang relevan dengan suasana hati.'],['Komunikasi Digital','Film, artikel, dan chat AI dipadukan agar dakwah hadir dalam format yang akrab dengan kebiasaan audiens muda.']].map(([head, desc]) => <Card key={head} className="rounded-[2rem] h-full"><CardContent className="p-6"><h3 className="text-xl font-black">{head}</h3><p className="mt-3 leading-7 text-iim-brown dark:text-iim-sand">{desc}</p></CardContent></Card>)}</div>
        </div>
      )}

      {activeTab === 'team' && (
        <section className="space-y-6" data-scroll-reveal>
          <SectionTitle centered eyebrow="About Team" title="UIKA-Berani Team" description="IMAN IN MOTION dikembangkan dalam semangat UIKA-Berani Team, dengan Rizki Dwi Febriansyah sebagai pengembang utama fullstack yang mengerjakan project dari nol dan Faris All Farizki sebagai Media Center yang membantu penataan letak dan fungsi." />

          <div className="rounded-[2rem] border border-iim-brown/10 bg-white/55 p-5 shadow-[0_18px_60px_rgba(43,33,24,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.055] md:p-6">
            <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="section-eyebrow">Academic Guidance</p>
                <h2 className="mt-2 text-2xl font-black tracking-[-0.03em] text-iim-coffee dark:text-iim-cream md:text-3xl">Pembimbing Project</h2>
              </div>
              <p className="max-w-xl text-sm font-semibold leading-6 text-iim-brown/78 dark:text-iim-sand/78">Dukungan akademik untuk menjaga arah, nilai, dan kualitas pengembangan IMAN IN MOTION.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {projectAdvisors.map((advisor) => (
                <Card key={advisor.name} className="overflow-hidden rounded-2xl border border-iim-brown/10 bg-white/80 shadow-[0_12px_34px_rgba(0,0,0,0.08)] dark:border-white/10 dark:bg-white/[0.07]">
                  <CardContent className="flex items-center gap-4 p-4 sm:p-5">
                    <img
                      src={advisor.image}
                      alt={advisor.name}
                      loading="lazy"
                      decoding="async"
                      className="h-20 w-20 shrink-0 rounded-2xl border border-iim-gold/25 object-cover shadow-sm sm:h-24 sm:w-24"
                    />
                    <div className="min-w-0">
                      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-iim-brown dark:text-iim-gold">{advisor.role}</p>
                      <h3 className="mt-2 text-lg font-black leading-tight text-iim-coffee dark:text-iim-cream sm:text-xl">{advisor.name}</h3>
                      <p className="mt-2 text-sm font-bold leading-6 text-iim-brown/78 dark:text-iim-sand">{advisor.title}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {teamMembers.map((member) => (
              <Card key={member.name} className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/75 p-0 shadow-[0_16px_50px_rgba(0,0,0,0.14)] dark:bg-white/[0.06]">
                <div className="relative aspect-square overflow-hidden border-b border-white/10 bg-iim-coffee/20 dark:bg-black/30">
                  <img
                    src={member.image}
                    alt={member.name}
                    loading="lazy"
                    decoding="async"
                    className="absolute inset-0 h-full w-full object-cover"
                    style={{ objectPosition: member.imagePosition }}
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/72 via-black/18 to-transparent" />
                  <div className="absolute left-5 top-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/35 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-iim-gold backdrop-blur-xl"><UserRound size={14} /> {member.badge}</div>
                  <div className="absolute inset-x-0 bottom-0 p-6 md:p-7">
                    <p className="section-eyebrow text-iim-gold">UIKA-Berani Team</p>
                    <h2 className="mt-2 text-4xl font-black text-white md:text-[3.25rem]">{member.shortName}</h2>
                    <p className="mt-2 text-sm font-bold text-iim-cream/90">{member.name}</p>
                  </div>
                </div>

                <CardContent className="p-6 md:p-7">
                  <p className="section-eyebrow">{member.name === 'Rizki Dwi Febriansyah' ? 'Built independently with passion & purpose' : 'Media Center'}</p>
                  <h3 className="mt-3 text-[1.85rem] font-black leading-tight text-iim-coffee dark:text-iim-cream">{member.label}</h3>
                  <div className="mt-4 rounded-2xl border border-iim-gold/10 bg-white/55 px-4 py-3 text-sm font-bold leading-6 text-iim-brown dark:border-white/10 dark:bg-white/10 dark:text-iim-sand">
                    {member.name === 'Rizki Dwi Febriansyah' ? educationLine : 'Media Center • Penataan Letak & Fungsi'}
                  </div>
                  <p className="mt-5 line-clamp-3 leading-8 text-iim-brown dark:text-iim-sand">{member.story}</p>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <Button type="button" onClick={() => setSelectedMember(member)}>Lihat detail</Button>
                    {member.instagramUrl && <Button as="a" href={member.instagramUrl} target="_blank" rel="noreferrer" variant="secondary"><Instagram size={16} /> {member.instagram}</Button>}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {founderHighlights.map(([head, desc]) => (
              <Card key={head} className="h-full rounded-[2rem]">
                <CardContent className="p-6">
                  <h3 className="text-xl font-black text-iim-coffee dark:text-iim-cream">{head}</h3>
                  <p className="mt-3 text-sm leading-7 text-iim-brown dark:text-iim-sand">{desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
            <Card className="rounded-[2rem]"><CardContent className="p-6 md:p-8"><p className="section-eyebrow">Founder Story</p><h3 className="mt-3 text-2xl font-black">Dikerjakan sendiri dari 0</h3><p className="mt-4 leading-8 text-iim-brown dark:text-iim-sand">IMAN IN MOTION bukan sekadar tampilan web, tetapi project yang dirancang sebagai produk digital utuh. Dwi menyusun konsep mood, arah visual, pengalaman pengguna, struktur halaman, sistem film, rekomendasi, artikel, AIMAN, login, akun, favorite, statistik mood, hingga database Firestore secara mandiri.</p><p className="mt-4 leading-8 text-iim-brown dark:text-iim-sand">Background media dan graphic design menjadi kekuatan utama dalam membangun identitas visual yang rapi, sementara proses belajar di PIJAK by Dicoding membantu Dwi mengubah kemampuan kreatif tersebut menjadi kemampuan teknis fullstack untuk membangun web app yang benar-benar bisa digunakan.</p></CardContent></Card>
            <Card className="rounded-[2rem]"><CardContent className="p-6 md:p-8"><p className="section-eyebrow">Skill Stack</p><h3 className="mt-3 text-2xl font-black">Creative, technical, and product thinking</h3><div className="mt-5 flex flex-wrap gap-2">{founderSkills.map((skill) => <span key={skill} className="rounded-full border border-iim-gold/25 bg-iim-gold/10 px-4 py-2 text-sm font-black text-iim-coffee dark:text-iim-cream">{skill}</span>)}</div></CardContent></Card>
          </div>

          <Card className="rounded-[2rem] text-center"><CardContent className="p-6 md:p-8"><p className="section-eyebrow">Project Vision</p><h3 className="mt-3 text-3xl font-black">Why IMAN IN MOTION exists</h3><p className="mx-auto mt-4 max-w-3xl leading-8 text-iim-brown dark:text-iim-sand">IMAN IN MOTION dibuat untuk menghadirkan pengalaman menonton yang lebih personal, emosional, dan bermakna. Platform ini tidak hanya memberi rekomendasi film berdasarkan suasana hati, tetapi juga mencoba menghadirkan refleksi, nilai, dan literasi dakwah melalui media digital modern.</p><p className="mt-6 text-sm font-black text-iim-brown dark:text-iim-gold">Built by Rizki Dwi Febriansyah with UIKA-Berani Team spirit.</p></CardContent></Card>
        </section>
      )}

      {activeTab === 'copyright' && (
        <Card className="overflow-hidden rounded-[2rem] border border-iim-brown/10 bg-white/75 shadow-[0_18px_60px_rgba(43,33,24,0.1)] dark:border-white/10 dark:bg-white/[0.065]" data-scroll-reveal>
          <CardContent className="p-6 md:p-8">
            <div className="grid gap-7 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-iim-gold/30 bg-iim-gold/12 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-iim-brown dark:text-iim-gold">
                  <ShieldCheck size={15} />
                  Pencatatan Ciptaan Resmi
                </div>
                <h2 className="mt-5 text-3xl font-black tracking-[-0.04em] text-iim-coffee dark:text-iim-cream md:text-4xl">Hak Cipta</h2>
                <p className="mt-4 max-w-2xl leading-8 text-iim-brown dark:text-iim-sand">
                  IMAN IN MOTION telah tercatat sebagai Program Komputer pada Kementerian Hukum Republik Indonesia dengan Nomor Pencatatan 001241778. Ciptaan ini pertama kali diumumkan pada 19 Mei 2026 di Kota Bogor dan memperoleh pelindungan Hak Cipta selama 50 tahun sejak pertama kali diumumkan.
                </p>
                <div className="mt-5 rounded-2xl border border-iim-brown/10 bg-white/58 p-4 dark:border-white/10 dark:bg-white/10">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-iim-brown dark:text-iim-gold">Pencipta / Pemegang Hak Cipta</p>
                  <p className="mt-2 font-black text-iim-coffee dark:text-iim-cream">Rizki Dwi Febriansyah, Prof. Dr. H.E. Mujahidin, Dr. Rofiah, M.Si.</p>
                </div>
              </div>

              <div className="rounded-2xl border border-iim-brown/10 bg-white/58 p-4 dark:border-white/10 dark:bg-white/10 md:p-5">
                <div className="mb-4 flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-iim-gold/20 text-iim-brown dark:text-iim-gold"><BadgeCheck size={20} /></span>
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-iim-brown dark:text-iim-gold">Detail Legal</p>
                    <p className="text-sm font-bold text-iim-brown/75 dark:text-iim-sand">Iman In Motion</p>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {copyrightDetails.map(([label, value]) => (
                    <div key={label} className="rounded-2xl border border-iim-brown/10 bg-white/62 p-4 dark:border-white/10 dark:bg-black/10">
                      <p className="text-[11px] font-black uppercase tracking-[0.14em] text-iim-brown/72 dark:text-iim-sand/80">{label}</p>
                      <p className="mt-2 text-sm font-black leading-6 text-iim-coffee dark:text-iim-cream">{value}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                  <Button as="a" href={copyrightCertificatePath} target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto">
                    <FileText size={16} /> Lihat Sertifikat Lengkap
                  </Button>
                  <Button as="a" href={copyrightCertificatePath} download variant="ghost" className="w-full border border-iim-brown/10 bg-white/55 sm:w-auto dark:border-white/10 dark:bg-white/10">
                    Unduh Sertifikat
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'help' && (
        <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]" data-scroll-reveal>
          <Card className="rounded-[2rem]"><CardContent className="p-6 md:p-8"><h2 className="text-2xl font-black">Bantuan penggunaan</h2><div className="mt-5 grid gap-3">{[['Pilih mood','Mulai dari suasana hati yang paling dekat, lalu aplikasi akan menampilkan dalil dan film yang sesuai.'],['Cari film','Gunakan menu Film untuk mencari judul, genre, tahun, rating, dan rekomendasi berdasarkan mood.'],['Baca artikel','Artikel membantu menghubungkan cerita film dengan pesan moral, refleksi, dan nilai dakwah.'],['Gunakan AIMAN','Ceritakan kondisi hati, minta dalil, atau minta rekomendasi film yang lebih personal.']].map(([head, desc]) => <div key={head} className="rounded-2xl bg-white/60 p-4 dark:bg-white/10"><p className="font-black">{head}</p><p className="mt-1 text-sm leading-6 text-iim-brown dark:text-iim-sand">{desc}</p></div>)}</div></CardContent></Card>
          <Card className="rounded-[2rem]"><CardContent className="p-6 md:p-8"><h2 className="text-2xl font-black">Kontak</h2><div className="mt-5 rounded-2xl bg-iim-gold/15 p-5"><p className="text-sm font-bold text-iim-brown dark:text-iim-sand">Nama</p><p className="mt-1 text-xl font-black">Dwi</p><p className="mt-4 text-sm font-bold text-iim-brown dark:text-iim-sand">WhatsApp</p><p className="mt-1 text-xl font-black">+62 896 8221 8382</p><Button type="button" onClick={() => copyText('+62 896 8221 8382', setCopied)} variant="secondary" className="mt-5 bg-iim-coffee text-iim-cream dark:bg-iim-gold dark:text-iim-charcoal"><Copy size={16} /> {copied ? 'Nomor tersalin' : 'Salin nomor'}</Button></div></CardContent></Card>
        </div>
      )}

      {selectedMember && (
        <div className="fixed inset-0 z-[110] grid place-items-center bg-black/60 p-4 backdrop-blur-sm" onMouseDown={(event) => event.target === event.currentTarget && setSelectedMember(null)}>
          <div className="max-h-[86vh] w-full max-w-2xl overflow-y-auto rounded-[2rem] border border-white/10 bg-iim-cream p-5 shadow-premium dark:bg-[#19140f] md:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="section-eyebrow">{selectedMember.badge}</p>
                <h2 className="mt-2 text-3xl font-black">{selectedMember.name}</h2>
                <p className="mt-2 text-sm font-bold text-iim-brown dark:text-iim-sand">{selectedMember.label}</p>
              </div>
              <button type="button" onClick={() => setSelectedMember(null)} className="grid h-10 w-10 place-items-center rounded-2xl border border-iim-brown/15 dark:border-white/10">X</button>
            </div>
            <p className="mt-6 leading-8 text-iim-brown dark:text-iim-sand">{selectedMember.story}</p>
            <p className="mt-4 leading-8 text-iim-brown dark:text-iim-sand">{selectedMember.journey}</p>
            {selectedMember.instagramUrl && <Button as="a" href={selectedMember.instagramUrl} target="_blank" rel="noreferrer" className="mt-6"><Instagram size={16} /> {selectedMember.instagram}</Button>}
          </div>
        </div>
      )}
    </section>
  );
}
