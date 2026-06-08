// login.js â€” Firebase Auth v2 (clean, no flicker)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword,
  createUserWithEmailAndPassword, updateProfile, onAuthStateChanged, signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// ==================== CONFIG ====================
const firebaseConfig = window.IIM_FIREBASE_CONFIG || {};

const app = firebaseConfig.apiKey ? initializeApp(firebaseConfig) : null;
const auth = app ? getAuth(app) : null;
const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: 'select_account' });

// ==================== ELEMENTS ====================
const $ = s => document.getElementById(s);
const btnGoogle = $('loginGoogle');
const btnEmail = $('loginEmail');
const modal = $('authModal');
const form = $('authForm');
const inputName = $('authName');
const inputEmail = $('authEmail');
const inputPass = $('authPass');
const errorEl = $('authError');
const tabMasuk = $('tabMasuk');
const tabDaftar = $('tabDaftar');
const googleModalBtn = $('authGoogleBtn');

let isDaftar = false;

// ==================== HELPERS ====================
const toast = msg => window.toast ? window.toast(msg) : alert(msg);

function readableAuthError(err) {
  const code = err?.code || '';
  const rawMessage = String(err?.message || err || '');
  if (rawMessage.includes('API_KEY_HTTP_REFERRER_BLOCKED')) {
    return 'Login Google ditolak karena domain belum diizinkan di pembatasan API key Google Cloud.';
  }
  const map = {
    'auth/email-already-in-use': 'Email sudah terdaftar. Silakan masuk.',
    'auth/invalid-email': 'Format email tidak valid.',
    'auth/weak-password': 'Password minimal 6 karakter.',
    'auth/user-not-found': 'Akun tidak ditemukan. Daftar dulu yuk.',
    'auth/wrong-password': 'Password salah.',
    'auth/invalid-credential': 'Email atau password salah.',
    'auth/popup-blocked': 'Popup Google diblokir browser. Izinkan popup lalu coba lagi.',
    'auth/unauthorized-domain': 'Domain ini belum diizinkan di Firebase Authentication.',
    'auth/invalid-api-key': 'Firebase API key tidak valid. Periksa konfigurasi VITE_FIREBASE_API_KEY.'
  };
  return map[code] || 'Terjadi kesalahan. Coba lagi.';
}

function setLoading(loading) {
  const btn = form?.querySelector('button[type="submit"]');
  if (!btn) return;
  btn.disabled = loading;
  btn.textContent = loading ? 'Memproses...' : 'Lanjutkan';
}

function showError(msg) {
  if (!errorEl) return;
  errorEl.textContent = msg;
  errorEl.animate(
    [{ transform: 'translateX(-4px)' }, { transform: 'translateX(4px)' }, { transform: 'translateX(0)' }],
    { duration: 250 }
  );
}

function switchTab(daftar) {
  isDaftar = daftar;
  tabMasuk?.classList.toggle('active', !daftar);
  tabDaftar?.classList.toggle('active', daftar);
  tabMasuk?.setAttribute('aria-selected', String(!daftar));
  tabDaftar?.setAttribute('aria-selected', String(daftar));
  if (inputName) {
    inputName.style.display = daftar ? 'block' : 'none';
    inputName.required = daftar;
  }
  if (inputPass) inputPass.autocomplete = daftar ? 'new-password' : 'current-password';
  if (errorEl) errorEl.textContent = '';
  inputEmail?.focus();
}

// ==================== AUTH ACTIONS ====================
async function handleGoogle() {
  if (!auth) return showError('Firebase belum dikonfigurasi untuk login.');
  try {
    setLoading(true);
    const res = await signInWithPopup(auth, provider);
    window.closeAuth?.();
    toast(`Waalaikumsalam, ${res.user.displayName?.split(' ')[0] || 'Kak'}!`);
  } catch (e) {
    if (e.code !== 'auth/popup-closed-by-user' && e.code !== 'auth/cancelled-popup-request') {
      showError(readableAuthError(e));
    }
  } finally {
    setLoading(false);
  }
}

async function handleEmailSubmit(e) {
  e.preventDefault();
  const email = inputEmail.value.trim();
  const pass = inputPass.value;
  const name = inputName.value.trim();
  if (!auth) return showError('Firebase belum dikonfigurasi untuk login.');

  if (!email || !pass || (isDaftar && pass.length < 6)) {
    return showError('Email & password (min 6) wajib diisi');
  }
  if (isDaftar && !name) return showError('Nama lengkap wajib diisi');

  try {
    setLoading(true);
    let cred;
    if (isDaftar) {
      cred = await createUserWithEmailAndPassword(auth, email, pass);
      await updateProfile(cred.user, { displayName: name });
      toast(`Akun berhasil dibuat, ${name}!`);
    } else {
      cred = await signInWithEmailAndPassword(auth, email, pass);
      toast('Selamat datang kembali!');
    }
    form.reset();
    window.closeAuth?.();
  } catch (err) {
    showError(readableAuthError(err));
  } finally {
    setLoading(false);
  }
}

// ==================== INIT EVENTS ====================
tabMasuk?.addEventListener('click', () => switchTab(false));
tabDaftar?.addEventListener('click', () => switchTab(true));
form?.addEventListener('submit', handleEmailSubmit);
btnGoogle?.addEventListener('click', handleGoogle);
googleModalBtn?.addEventListener('click', handleGoogle);

// ==================== AUTH STATE (NO FLICKER) ====================
if (btnGoogle) btnGoogle.style.visibility = 'hidden';
if (btnEmail) btnEmail.style.visibility = 'hidden';

if (!auth) {
  if (btnGoogle) btnGoogle.style.visibility = 'visible';
  if (btnEmail) btnEmail.style.visibility = 'visible';
} else {
  onAuthStateChanged(auth, (user) => {
    if (btnGoogle) btnGoogle.style.visibility = 'visible';
    if (btnEmail) btnEmail.style.visibility = 'visible';

    if (user) {
      const name = user.displayName?.split(' ')[0] || user.email?.split('@')[0] || 'Akun';
      const photo = user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=14b8a6&color=000`;

      if (btnGoogle) {
        btnGoogle.innerHTML = `<img src="${photo}" alt="" style="width:22px;height:22px;border-radius:50%;object-fit:cover"> <span>${name}</span>`;
        btnGoogle.onclick = null;
        btnGoogle.title = user.email;
      }
      if (btnEmail) {
        btnEmail.textContent = 'Keluar';
        btnEmail.onclick = async () => { await signOut(auth); toast('Sampai jumpa lagi!'); };
      }
      window.IMAN_AUTH = { currentUser: user };
      localStorage.setItem('iman_user', JSON.stringify({ uid: user.uid, name }));
    } else {
      if (btnGoogle) {
        btnGoogle.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24"><path fill="currentColor" d="M21.35 11.1h-9.18v2.96h5.27c-.23 1.42-1.6 4.16-5.27 4.16-3.17 0-5.76-2.63-5.76-5.87s2.59-5.87 5.76-5.87c1.81 0 3.02.77 3.71 1.43l2.53-2.44C16.9 3.5 14.68 2.4 12.17 2.4 6.7 2.4 2.4 6.7 2.4 12.23s4.3 9.83 9.77 9.83c5.64 0 9.38-3.96 9.38-9.54 0-.64-.07-1.12-.2-1.42z"/></svg> <span>Google</span>`;
        btnGoogle.onclick = handleGoogle;
      }
      if (btnEmail) {
        btnEmail.textContent = 'Masuk';
        btnEmail.onclick = () => { switchTab(false); modal?.classList.remove('hidden'); setTimeout(() => inputEmail?.focus(), 100); };
      }
      window.IMAN_AUTH = { currentUser: null };
      localStorage.removeItem('iman_user');
    }
  });
}

// Close modal
modal?.addEventListener('click', e => { if (e.target === modal) window.closeAuth?.(); });
window.addEventListener('keydown', e => { if (e.key === 'Escape' && !modal?.classList.contains('hidden')) window.closeAuth?.(); });

// Expose
window.IMAN_AUTH = window.IMAN_AUTH || { currentUser: null };
