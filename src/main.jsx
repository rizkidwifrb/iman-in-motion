import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import AOS from 'aos';
import 'aos/dist/aos.css';
import './styles/index.css';
import { BookOpen, ChevronRight, Copyright, Film as FilmIcon, HelpCircle, Home as HomeIcon, Info as InfoIcon, Languages, LogOut, Menu, MessageCircle, Moon, Palette, Settings, ShieldCheck, SmilePlus, Sun, Trash2, UserRound, X } from 'lucide-react';
import { PageSkeleton } from './components/Skeletons';

const Home = React.lazy(() => import('./pages/Home'));
const Mood = React.lazy(() => import('./pages/Mood'));
const Film = React.lazy(() => import('./pages/Film'));
const FilmDetail = React.lazy(() => import('./pages/FilmDetail'));
const Articles = React.lazy(() => import('./pages/Articles'));
const ArticleDetail = React.lazy(() => import('./pages/ArticleDetail'));
const Aiman = React.lazy(() => import('./pages/Aiman'));
const Info = React.lazy(() => import('./pages/Info'));
const Account = React.lazy(() => import('./pages/Account'));

import { initialsFromUser, migrateLocalAccountDataToFirestore } from './utils/accountStorage';
import { loadFirebaseAuthClient } from './utils/firebaseClient';
import { getCopy, languageOptions } from './utils/i18n';
import { initMotionExperience } from './utils/motionExperience';
import { assetUrl } from './utils/assetUrl';


async function loadFirebaseAuth() {
  return loadFirebaseAuthClient();
}

function storeFirebaseUser(user) {
  if (!user) {
    localStorage.removeItem('iman_user');
    window.IMAN_AUTH = { currentUser: null };
    window.dispatchEvent(new Event('iman-auth-change'));
    return null;
  }
  const name = user.displayName || user.email?.split('@')[0] || 'Kak';
  const payload = {
    uid: user.uid,
    name,
    email: user.email || '',
    photoURL: user.photoURL || ''
  };
  localStorage.setItem('iman_user', JSON.stringify(payload));
  window.IMAN_AUTH = { currentUser: user };
  window.dispatchEvent(new Event('iman-auth-change'));
  migrateLocalAccountDataToFirestore(payload).catch(() => {});
  return payload;
}

const routes = {
  '/': Home,
  '/mood': Mood,
  '/film': Film,
  '/articles': Articles,
  '/artikel': Articles,
  '/aiman': Aiman,
  '/info': Info,
  '/account': Account,
  '/akun': Account
};

// Mobile swipe order follows the bottom navigation order.
// It lets users move between the main menus with a horizontal swipe,
// like adjacent panels, without changing the desktop experience.
const mobileSwipeRoutes = ['/', '/mood', '/film', '/articles', '/aiman'];

function getPath() {
  const hash = window.location.hash.replace('#', '');
  if (hash) {
    const cleanHash = hash.split('?')[0];
    return cleanHash.startsWith('/') ? cleanHash : `/${cleanHash}`;
  }

  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  let rawPath = window.location.pathname || '/';
  if (base && rawPath.startsWith(base)) {
    rawPath = rawPath.slice(base.length) || '/';
  }
  const clean = rawPath.split('?')[0];
  return clean.startsWith('/') ? clean : `/${clean}`;
}

function Link({ to, children, className = '', onClick }) {
  return <a href={`#${to}`} onClick={onClick} className={className}>{children}</a>;
}

function ThemeToggle({ theme, setTheme }) {
  const isDark = theme === 'dark';
  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-iim-brown/15 bg-white/65 text-iim-coffee transition hover:-translate-y-0.5 hover:border-iim-gold dark:border-white/10 dark:bg-white/10 dark:text-iim-cream"
      aria-label="Ganti tema"
    >
      {isDark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}

function authErrorMessage(err) {
  const code = err?.code || '';
  const rawMessage = String(err?.message || err || '');
  if (rawMessage.includes('Firebase belum dikonfigurasi')) {
    return 'Firebase belum dikonfigurasi. Isi VITE_FIREBASE_* di file .env.production lalu build ulang.';
  }
  if (rawMessage.includes('API_KEY_HTTP_REFERRER_BLOCKED')) {
    return 'Login Google ditolak karena domain belum diizinkan di pembatasan API key Google Cloud. Tambahkan domain hosting ke HTTP referrers.';
  }
  const map = {
    'auth/email-already-in-use': 'Email sudah terdaftar. Silakan masuk.',
    'auth/invalid-email': 'Format email belum valid.',
    'auth/weak-password': 'Password minimal 6 karakter.',
    'auth/user-not-found': 'Akun tidak ditemukan. Coba daftar terlebih dahulu.',
    'auth/wrong-password': 'Password salah.',
    'auth/invalid-credential': 'Email atau password salah.',
    'auth/popup-blocked': 'Popup Google diblokir browser. Izinkan popup lalu coba lagi.',
    'auth/unauthorized-domain': 'Domain ini belum diizinkan di Firebase Authentication. Tambahkan domain hosting di Authorized domains Firebase.',
    'auth/invalid-api-key': 'Firebase API key tidak valid. Periksa VITE_FIREBASE_API_KEY di .env.production sebelum build.'
  };
  return map[code] || 'Login belum berhasil. Coba beberapa saat lagi.';
}

function AuthModal({ mode, setMode, close, theme, setTheme }) {
  const [tab, setTab] = useState('masuk');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [savedUser, setSavedUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('iman_user') || 'null'); } catch { return null; }
  });
  const [language, setLanguage] = useState(() => localStorage.getItem('iim-language') || 'id');
  const [closing, setClosing] = useState(false);
  const tSettings = getCopy(language).settings;

  function changeLanguage(code) {
    setLanguage(code);
    localStorage.setItem('iim-language', code);
    document.documentElement.lang = code;
    document.documentElement.dir = code === 'ar' ? 'rtl' : 'ltr';
    window.dispatchEvent(new CustomEvent('iim-language-change'));
    const settingsCopy = getCopy(code).settings;
    window.dispatchEvent(new CustomEvent('iim-toast', { detail: `${settingsCopy.changed} ${languageOptions.find((item) => item.code === code)?.label || code}.` }));
  }

  useEffect(() => {
    if (mode === 'auth') {
      setTab('masuk');
      setError('');
    }
    if (mode) setClosing(false);
  }, [mode]);

  useEffect(() => {
    let active = true;
    let unsubscribe = () => {};
    loadFirebaseAuth().then(({ auth, onAuthStateChanged }) => {
      if (!active) return;
      unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
        const stored = storeFirebaseUser(firebaseUser);
        setSavedUser(stored);
      });
    }).catch(() => {});
    return () => { active = false; unsubscribe(); };
  }, []);

  if (!mode) return null;

  function requestClose() {
    if (closing) return;
    setClosing(true);
    window.setTimeout(() => close(), 220);
  }

  function readableError(err) {
    return authErrorMessage(err);
  }

  async function loginWithGoogle() {
    setError('');
    setLoading(true);
    try {
      const { auth, signInWithPopup, provider } = await loadFirebaseAuth();
      const result = await signInWithPopup(auth, provider);
      storeFirebaseUser(result.user);
      requestClose();
    } catch (err) {
      if (!['auth/popup-closed-by-user', 'auth/cancelled-popup-request'].includes(err?.code)) {
        setError(readableError(err));
      }
    } finally {
      setLoading(false);
    }
  }

  async function submitEmail(e) {
    e.preventDefault();
    setError('');
    if (tab === 'daftar' && !name.trim()) {
      setError('Nama lengkap wajib diisi.');
      return;
    }
    if (!email.trim() || password.length < 6) {
      setError('Email dan password minimal 6 karakter wajib diisi.');
      return;
    }
    setLoading(true);
    try {
      let credential;
      if (tab === 'daftar') {
        const { auth, createUserWithEmailAndPassword, updateProfile } = await loadFirebaseAuth();
        credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
        await updateProfile(credential.user, { displayName: name.trim() });
      } else {
        const { auth, signInWithEmailAndPassword } = await loadFirebaseAuth();
        credential = await signInWithEmailAndPassword(auth, email.trim(), password);
      }
      storeFirebaseUser(credential.user);
      requestClose();
    } catch (err) {
      setError(readableError(err));
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    setLoading(true);
    try {
      const { auth, signOut } = await loadFirebaseAuth();
      await signOut(auth);
      storeFirebaseUser(null);
      setSavedUser(null);
      requestClose();
    } finally {
      setLoading(false);
    }
  }

  function goInfo(tab) {
    window.location.hash = `#/info?tab=${tab}`;
    requestClose();
  }

  function openAccount() {
    if (savedUser) {
      window.location.hash = '#/account';
      requestClose();
      return;
    }
    setMode('auth');
  }

  function clearHistory() {
    localStorage.removeItem('iman_last_mood');
    localStorage.removeItem('iman_chat_history');
    window.dispatchEvent(new CustomEvent('iim-toast', { detail: 'Riwayat lokal dibersihkan.' }));
  }

  const settingMenus = [
    { title: 'Akun', icon: UserRound, action: openAccount, actionLabel: savedUser ? 'Buka' : 'Masuk' },
    { title: 'Tentang', icon: InfoIcon, action: () => goInfo('about'), actionLabel: 'Info' },
    { title: 'Bantuan', icon: HelpCircle, action: () => goInfo('help'), actionLabel: 'Kontak' }
  ];

  return (
    <div className={`modal-backdrop-premium fixed inset-0 z-[100] grid place-items-center bg-black/60 p-4 backdrop-blur-sm ${closing ? 'is-closing' : ''}`} onMouseDown={(e) => e.target === e.currentTarget && requestClose()}>
      <div className={`modal-panel-premium max-h-[86vh] w-full max-w-md overflow-y-auto rounded-[1.75rem] border border-white/10 bg-iim-cream p-4 shadow-premium dark:bg-[#19140f] sm:p-5 ${mode === 'settings' ? 'settings-panel' : ''} ${closing ? 'is-closing' : ''}`}>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="section-eyebrow">{mode === 'settings' ? tSettings.eyebrow : 'Akun IMAN'}</p>
            <h2 className="mt-1 text-xl font-black text-iim-coffee dark:text-iim-cream sm:text-2xl">{mode === 'settings' ? tSettings.title : 'Masuk atau daftar'}</h2>
          </div>
          <button className="grid h-11 w-11 place-items-center rounded-2xl border border-iim-brown/15 transition hover:-translate-y-0.5 hover:border-iim-gold dark:border-white/10" onClick={requestClose} aria-label="Tutup"><X size={18} /></button>
        </div>

        {mode === 'settings' ? (
          <div className="settings-menu mt-5 space-y-2.5">
            {settingMenus.map((item, index) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.title}
                  type="button"
                  onClick={item.action}
                  className="settings-row"
                  style={{ '--settings-delay': `${index * 0.035}s` }}
                >
                  <span className="settings-row-main">
                    <span className="settings-row-icon"><Icon size={17} /></span>
                    <span className="truncate text-sm font-black text-iim-coffee dark:text-iim-cream">{item.title}</span>
                  </span>
                  <span className="settings-row-action">{item.actionLabel}<ChevronRight size={14} /></span>
                </button>
              );
            })}

            <label className="settings-row" style={{ '--settings-delay': '0.105s' }}>
              <span className="settings-row-main">
                <span className="settings-row-icon"><Languages size={17} /></span>
                <span className="text-sm font-black text-iim-coffee dark:text-iim-cream">Bahasa</span>
              </span>
              <select
                className="settings-select"
                value={language}
                onChange={(event) => changeLanguage(event.target.value)}
                aria-label="Bahasa"
              >
                {languageOptions.map((item) => (
                  <option key={item.code} value={item.code}>{item.label}</option>
                ))}
              </select>
            </label>

            <button type="button" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="settings-row" style={{ '--settings-delay': '0.14s' }}>
              <span className="settings-row-main">
                <span className="settings-row-icon"><Palette size={17} /></span>
                <span className="text-sm font-black text-iim-coffee dark:text-iim-cream">Tema</span>
              </span>
              <span className="settings-toggle" aria-hidden="true">
                <span className={theme === 'dark' ? 'translate-x-5' : ''} />
              </span>
            </button>

            <div className="settings-secondary-row">
              <button type="button" onClick={clearHistory} className="settings-secondary-action">
                <Trash2 size={13} />
                Hapus riwayat
              </button>
            </div>

            {savedUser && (
              <button type="button" disabled={loading} onClick={logout} className="settings-logout">
                <LogOut size={16} />
                Keluar
              </button>
            )}
          </div>
        ) : (
          <div className="mt-6">
            <div className="grid grid-cols-2 rounded-2xl bg-white/65 p-1 dark:bg-white/10">
              <button className={`rounded-xl px-4 py-3 text-sm font-extrabold ${tab === 'masuk' ? 'bg-iim-coffee text-iim-cream dark:bg-iim-gold dark:text-iim-charcoal' : ''}`} onClick={() => { setTab('masuk'); setError(''); }}>Masuk</button>
              <button className={`rounded-xl px-4 py-3 text-sm font-extrabold ${tab === 'daftar' ? 'bg-iim-coffee text-iim-cream dark:bg-iim-gold dark:text-iim-charcoal' : ''}`} onClick={() => { setTab('daftar'); setError(''); }}>Daftar</button>
            </div>

            <button id="authGoogleBtn" type="button" disabled={loading} onClick={loginWithGoogle} className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-iim-brown/15 bg-white px-4 py-3 font-extrabold text-iim-coffee shadow-sm transition hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-60 dark:border-white/10 dark:bg-white/10 dark:text-iim-cream">
              <span className="grid h-6 w-6 place-items-center rounded-full bg-white text-sm text-iim-coffee">G</span>
              {loading ? 'Memproses...' : 'Masuk dengan Google'}
            </button>

            <div className="my-4 flex items-center gap-3 text-xs font-bold uppercase tracking-widest text-iim-brown/70 dark:text-iim-sand/70"><span className="h-px flex-1 bg-iim-brown/15 dark:bg-white/10" />atau email<span className="h-px flex-1 bg-iim-brown/15 dark:bg-white/10" /></div>

            <form onSubmit={submitEmail} className="space-y-3">
              {tab === 'daftar' && <input className="input-premium" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama lengkap" required />}
              <input className="input-premium" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required />
              <input className="input-premium" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" required minLength={6} />
              {error && <p className="rounded-2xl border border-red-300/40 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-700 dark:text-red-200">{error}</p>}
              <button type="submit" disabled={loading} className="btn-primary w-full disabled:cursor-wait disabled:opacity-60">{loading ? 'Memproses...' : tab === 'daftar' ? 'Buat Akun' : 'Masuk'}</button>
            </form>
            <p className="mt-4 text-center text-xs leading-6 text-iim-brown dark:text-iim-sand">Akun digunakan untuk menyimpan preferensi mood dan pengalaman membaca di IMAN IN MOTION.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function Navbar({ path, theme, setTheme }) {
  const [modal, setModal] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [language, setLanguage] = useState(() => localStorage.getItem('iim-language') || 'id');
  const t = getCopy(language);
  const [toast, setToast] = useState('');
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('iman_user') || 'null'); } catch { return null; }
  });
  const desktopLinks = [
    ['/', t.nav.home, HomeIcon],
    ['/mood', t.nav.mood, SmilePlus],
    ['/film', t.nav.film, FilmIcon],
    ['/articles', t.nav.articles, BookOpen],
    ['/aiman', t.nav.aiman, MessageCircle],
    ['/info', t.nav.info, InfoIcon],
    ...(user ? [['/account', t.nav.account, UserRound]] : [])
  ];
  const mobileLinks = [
    ['/', t.nav.home, HomeIcon],
    ['/mood', t.nav.mood, SmilePlus],
    ['/film', t.nav.film, FilmIcon],
    ['/articles', t.nav.articles, BookOpen],
    ['/aiman', t.nav.aiman, MessageCircle],
    ['/info', t.nav.info, InfoIcon],
    ...(user ? [['/account', t.nav.account, UserRound]] : [])
  ];
  const isActive = (to) => path === to || (to === '/account' && path === '/akun') || (to === '/articles' && path.startsWith('/article/')) || (to === '/film' && path.startsWith('/film/'));

  async function handleGoogleNav() {
    if (user) {
      window.location.hash = '#/account';
      return;
    }
    try {
      const { auth, signInWithPopup, provider } = await loadFirebaseAuth();
      const result = await signInWithPopup(auth, provider);
      setUser(storeFirebaseUser(result.user));
    } catch (err) {
      if (!['auth/popup-closed-by-user', 'auth/cancelled-popup-request'].includes(err?.code)) {
        setModal('auth');
        setToast(authErrorMessage(err));
      }
    }
  }

  useEffect(() => {
    const showToast = (event) => {
      setToast(event.detail || 'Aksi berhasil.');
      window.clearTimeout(window.__iimToastTimer);
      window.__iimToastTimer = window.setTimeout(() => setToast(''), 2600);
    };
    window.addEventListener('iim-toast', showToast);
    return () => window.removeEventListener('iim-toast', showToast);
  }, []);

  useEffect(() => {
    const refresh = () => { try { setUser(JSON.parse(localStorage.getItem('iman_user') || 'null')); } catch { setUser(null); } };
    window.addEventListener('storage', refresh);
    window.addEventListener('iman-auth-change', refresh);
    let unsub = () => {};
    loadFirebaseAuth().then(({ auth, onAuthStateChanged }) => {
      unsub = onAuthStateChanged(auth, (firebaseUser) => setUser(storeFirebaseUser(firebaseUser)));
    }).catch(() => {});
    return () => { window.removeEventListener('storage', refresh); window.removeEventListener('iman-auth-change', refresh); unsub(); };
  }, []);

  useEffect(() => {
    const syncLanguage = () => setLanguage(localStorage.getItem('iim-language') || 'id');
    window.addEventListener('storage', syncLanguage);
    window.addEventListener('iim-language-change', syncLanguage);
    return () => { window.removeEventListener('storage', syncLanguage); window.removeEventListener('iim-language-change', syncLanguage); };
  }, []);

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-iim-brown/10 bg-iim-cream/86 backdrop-blur-2xl dark:border-white/10 dark:bg-iim-charcoal/86">
        <div className="desktop-header-grid container-page hidden h-20 items-center justify-between gap-3 md:grid">
          <Link to="/" className="desktop-brand flex items-center gap-3">
            <img src={assetUrl('logo.png')} alt="IMAN IN MOTION" className="h-12 w-12 rounded-2xl object-contain shadow-glow" />
            <div>
              <p className="text-sm font-extrabold tracking-[0.22em] text-iim-coffee dark:text-iim-cream">IMAN IN MOTION</p>
              <p className="text-xs font-semibold text-iim-brown dark:text-iim-sand">{t.home.eyebrow}</p>
            </div>
          </Link>

          <nav className="desktop-menu hidden items-center gap-1 md:flex">
            {desktopLinks.map(([to, label]) => (
              <Link
                key={to}
                to={to}
                className={`desktop-menu-link rounded-2xl px-4 py-2 text-sm font-bold transition ${isActive(to) ? 'bg-iim-coffee text-iim-cream shadow-glow dark:bg-iim-gold dark:text-iim-charcoal' : 'text-iim-coffee hover:bg-white/60 dark:text-iim-cream dark:hover:bg-white/10'}`}
              >
                {label}
              </Link>
            ))}
          </nav>

          <div className="desktop-actions flex items-center gap-2">
            <ThemeToggle theme={theme} setTheme={setTheme} />
            <button type="button" id="settingsBtn" onClick={() => setModal('settings')} className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-iim-brown/15 bg-white/65 text-iim-coffee transition hover:-translate-y-0.5 hover:border-iim-gold dark:border-white/10 dark:bg-white/10 dark:text-iim-cream" aria-label={t.nav.settings}><Settings size={18} /></button>
            <button type="button" id="loginGoogle" onClick={handleGoogleNav} className="inline-flex h-11 items-center justify-center gap-2 whitespace-nowrap rounded-2xl bg-iim-gold px-4 text-sm font-extrabold leading-none text-iim-charcoal transition hover:-translate-y-0.5">
              {user?.photoURL ? <img src={user.photoURL} alt={user.name || 'Akun'} className="h-6 w-6 rounded-full object-cover" /> : <span className="grid h-6 w-6 place-items-center rounded-full bg-iim-charcoal/10 text-[10px] font-black">{user ? initialsFromUser(user) : <UserRound size={16} />}</span>}
              <span>{user?.name?.split(' ')[0] || 'Google'}</span>
            </button>
            <button type="button" id="loginEmail" onClick={() => user ? (window.location.hash = '#/account') : setModal('auth')} className="inline-flex h-11 items-center justify-center rounded-2xl border border-iim-brown/15 bg-white/65 px-4 text-sm font-extrabold leading-none text-iim-coffee transition hover:-translate-y-0.5 hover:border-iim-gold dark:border-white/10 dark:bg-white/10 dark:text-iim-cream">
              {user ? t.nav.account : t.nav.login}
            </button>
          </div>
        </div>

        <div className="mobile-app-topbar md:hidden">
          <button type="button" onClick={() => setMobileOpen((value) => !value)} className="mobile-hamburger-btn" aria-label="Buka menu">
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
          <Link to="/" className="mobile-brand-lockup" aria-label="IMAN IN MOTION Home">
            <img src={assetUrl('logo.png')} alt="IMAN IN MOTION" />
            <div>
              <p><span>IMAN IN</span><span>MOTION</span></p>
            </div>
          </Link>
          <div className="mobile-account-actions">
            <button type="button" onClick={handleGoogleNav} className="mobile-google-btn" aria-label="Login Google">
              G
            </button>
            <button type="button" onClick={() => user ? (window.location.hash = '#/account') : setModal('auth')} className="mobile-login-btn">
              {user ? t.nav.account : t.nav.login}
            </button>
            <button type="button" onClick={() => setModal('settings')} className="mobile-setting-btn" aria-label={t.nav.settings}>
              <Settings size={16} />
            </button>
          </div>
        </div>
        {mobileOpen && (
          <div className="mobile-nav-panel md:hidden">
            <nav className="mobile-nav-card grid gap-2">
              {mobileLinks.map(([to, label, Icon]) => (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setMobileOpen(false)}
                  className={`flex min-h-11 items-center gap-3 rounded-2xl px-4 py-3 text-sm font-black transition ${isActive(to) ? 'bg-iim-gold text-iim-charcoal' : 'text-iim-coffee hover:bg-white dark:text-iim-cream dark:hover:bg-white/10'}`}
                >
                  <Icon size={18} />
                  <span>{label}</span>
                </Link>
              ))}
              <button type="button" onClick={() => { setMobileOpen(false); setModal('settings'); }} className="flex min-h-11 items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-black text-iim-coffee hover:bg-white dark:text-iim-cream dark:hover:bg-white/10">
                <Settings size={18} />
                <span>{t.nav.settings}</span>
              </button>
            </nav>
          </div>
        )}
      </header>

      <nav className="mobile-bottom-nav md:hidden" aria-label="Navigasi utama mobile">
        {mobileLinks.map(([to, label, Icon]) => (
          <Link
            key={to}
            to={to}
            className={`mobile-bottom-nav-item ${isActive(to) ? 'active' : ''}`}
            aria-label={label}
            title={label}
          >
            <Icon size={20} strokeWidth={2.2} />
            <span>{label}</span>
          </Link>
        ))}
      </nav>
      {toast && <div className="iim-toast">{toast}</div>}
      <AuthModal mode={modal} setMode={setModal} close={() => setModal(null)} theme={theme} setTheme={setTheme} />
    </>
  );
}

function SplashScreen({ onDone }) {
  const [leaving, setLeaving] = useState(false);
  const finishRef = React.useRef(false);

  function finish() {
    if (finishRef.current) return;
    finishRef.current = true;
    setLeaving(true);
    window.setTimeout(() => {
      onDone?.();
    }, 180);
  }

  useEffect(() => {
    const keyHandler = (event) => {
      if (event.key === 'Enter' || event.key === ' ' || event.key === 'Escape') finish();
    };
    // Splash appears on every refresh and stays until user clicks/taps or presses Enter/Space/Escape.
    window.addEventListener('keydown', keyHandler);
    return () => {
      window.removeEventListener('keydown', keyHandler);
    };
  }, []);

  return (
    <button
      type="button"
      className={`splash-screen splash-screen-lite ${leaving ? 'leaving' : ''}`}
      onClick={finish}
      aria-label="Masuk ke IMAN IN MOTION"
    >
      <span className="splash-orb splash-orb-one" aria-hidden="true" />
      <span className="splash-orb splash-orb-two" aria-hidden="true" />
      <span className="splash-spark spark-a" aria-hidden="true">✦</span>
      <span className="splash-spark spark-b" aria-hidden="true">✧</span>
      <span className="splash-center splash-center-lite">
        <span className="splash-logo-wrap splash-logo-wrap-lite">
          <img src={assetUrl('logo.png')} alt="IMAN IN MOTION" className="splash-logo" decoding="async" fetchpriority="high" />
        </span>
        <span className="splash-copy splash-copy-lite">
          <span className="splash-title splash-title-lite">IMAN IN MOTION</span>
          <span className="splash-tap-hint">Tap dimana saja</span>
        </span>
      </span>
    </button>
  );
}

function App() {
  const [path, setPath] = useState(getPath());
  const [theme, setThemeState] = useState(() => localStorage.getItem('iim-theme') || 'dark');
  const [language, setLanguage] = useState(() => localStorage.getItem('iim-language') || 'id');
  const swipeRef = React.useRef({ x: 0, y: 0, t: 0 });
  // Always show splash on every full page refresh/reload.
  // It only closes for the current React session after the user clicks/presses a key.
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const handler = () => setPath(getPath());
    window.addEventListener('hashchange', handler);
    if (!window.location.hash && window.location.pathname === '/') window.location.hash = '/';
    return () => window.removeEventListener('hashchange', handler);
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [path]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('iim-theme', theme);
  }, [theme]);

  useEffect(() => {
    const applyLanguage = () => setLanguage(localStorage.getItem('iim-language') || 'id');
    window.addEventListener('storage', applyLanguage);
    window.addEventListener('iim-language-change', applyLanguage);
    return () => { window.removeEventListener('storage', applyLanguage); window.removeEventListener('iim-language-change', applyLanguage); };
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  }, [language]);

  const Page = useMemo(() => {
    if (path.startsWith('/film/')) return FilmDetail;
    if (path.startsWith('/article/')) return ArticleDetail;
    return routes[path] || Home;
  }, [path]);

  const isAimanRoute = path === '/aiman';

  useEffect(() => {
    AOS.init({
      duration: 720,
      easing: 'ease-out-cubic',
      once: false,
      mirror: false,
      offset: 72
    });
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => AOS.refreshHard(), 120);
    return () => window.clearTimeout(timer);
  }, [path, theme, language]);

  useEffect(() => {
    let cleanup = () => {};
    const timer = window.setTimeout(() => {
      const result = initMotionExperience();
      if (result && typeof result.then === 'function') {
        result.then((fn) => { cleanup = typeof fn === 'function' ? fn : cleanup; });
      } else {
        cleanup = typeof result === 'function' ? result : cleanup;
      }
    }, 80);
    return () => {
      window.clearTimeout(timer);
      cleanup();
    };
  }, [path, theme, language]);

  useEffect(() => {
    document.body.classList.toggle('route-aiman', isAimanRoute);
    document.body.classList.toggle('route-not-aiman', !isAimanRoute);
    return () => {
      document.body.classList.remove('route-aiman', 'route-not-aiman');
    };
  }, [isAimanRoute]);

  function canonicalSwipePath(value) {
    if (value === '/artikel' || value.startsWith('/article/')) return '/articles';
    if (value.startsWith('/film/')) return '/film';
    if (value === '/akun') return '/account';
    return value;
  }

  function goMobileSwipe(direction) {
    if (typeof window === 'undefined') return;
    if (window.innerWidth >= 768) return;
    const current = canonicalSwipePath(path);
    const index = mobileSwipeRoutes.indexOf(current);
    if (index < 0) return;
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= mobileSwipeRoutes.length) return;
    window.location.hash = `#${mobileSwipeRoutes[nextIndex]}`;
  }

  function handleTouchStart(event) {
    if (isAimanRoute) return;
    const touch = event.touches?.[0];
    if (!touch) return;
    swipeRef.current = { x: touch.clientX, y: touch.clientY, t: Date.now() };
  }

  function handleTouchEnd(event) {
    if (isAimanRoute) return;
    const touch = event.changedTouches?.[0];
    if (!touch) return;
    const start = swipeRef.current;
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    const dt = Date.now() - start.t;

    // Only trigger when the gesture is clearly horizontal, so normal vertical
    // page scrolling and card tapping stay safe.
    if (Math.abs(dx) < 74) return;
    if (Math.abs(dx) < Math.abs(dy) * 1.45) return;
    if (dt > 850) return;

    goMobileSwipe(dx < 0 ? 1 : -1);
  }

  return (
    <>
      {showSplash && <SplashScreen onDone={() => setShowSplash(false)} />}
      <div className={`min-h-screen text-iim-coffee dark:text-iim-cream ${isAimanRoute ? 'is-aiman-route' : ''}`}>
      <Navbar path={path} theme={theme} setTheme={setThemeState} />
      <main
        key={path}
        className="fade-in page-transition mobile-swipe-stage"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <Suspense fallback={<PageSkeleton />}>
          <Page path={path} />
        </Suspense>
      </main>
      {!isAimanRoute && <footer className="mt-16 border-t border-iim-brown/10 py-8 dark:border-white/10">
        <div className="container-page flex flex-col gap-4 text-sm text-iim-brown dark:text-iim-sand">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <p className="font-semibold">© {new Date().getFullYear()} IMAN IN MOTION. {getCopy(language).footer.left}</p>
            <p>{getCopy(language).footer.right}</p>
          </div>
          <div className="flex flex-col gap-3 rounded-2xl border border-iim-brown/10 bg-white/48 px-4 py-3 text-xs font-bold leading-6 shadow-sm dark:border-white/10 dark:bg-white/[0.055] sm:flex-row sm:items-center sm:justify-between">
            <p className="flex min-w-0 items-start gap-2">
              <ShieldCheck size={16} className="mt-0.5 shrink-0 text-iim-brown dark:text-iim-gold" />
              <span>Terdaftar Hak Cipta sebagai Program Komputer pada Kementerian Hukum Republik Indonesia. No. Pencatatan: <strong className="text-iim-coffee dark:text-iim-cream">001241778</strong>.</span>
            </p>
            <a
              href={assetUrl('sertifikat-hak-cipta-iman-in-motion.pdf')}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-9 shrink-0 items-center justify-center gap-2 rounded-xl border border-iim-gold/30 bg-iim-gold/15 px-3 py-2 font-black text-iim-coffee transition hover:-translate-y-0.5 hover:bg-iim-gold/25 dark:text-iim-cream"
            >
              <Copyright size={14} />
              Lihat Sertifikat
            </a>
          </div>
        </div>
      </footer>}
      </div>
    </>
  );
}

createRoot(document.getElementById('root')).render(<App />);
