// login.js — Firebase Auth PRO (Modal + No Flicker)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword,
  createUserWithEmailAndPassword, updateProfile, onAuthStateChanged, signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDi3zOmx6tf9MSCMp7HDlCk4-5QY4nZK7E",
  authDomain: "uwiberani-project.firebaseapp.com",
  projectId: "uwiberani-project",
  storageBucket: "uwiberani-project.appspot.com",
  messagingSenderId: "735078024592",
  appId: "1:735078024592:web:8e15bb85b0448402425f15"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: 'select_account' });

// Elements
const btnGoogle = document.getElementById('loginGoogle');
const btnEmail = document.getElementById('loginEmail');
const modal = document.getElementById('authModal');
const form = document.getElementById('authForm');
const inputName = document.getElementById('authName');
const inputEmail = document.getElementById('authEmail');
const inputPass = document.getElementById('authPass');
const errorEl = document.getElementById('authError');
const tabMasuk = document.getElementById('tabMasuk');
const tabDaftar = document.getElementById('tabDaftar');
const googleModalBtn = document.getElementById('authGoogleBtn');

let isDaftar = false;
let authReady = false;

// ——— UI Helpers ———
const toast = (msg) => window.toast? window.toast(msg) : alert(msg);

function setLoading(loading){
  const btn = form.querySelector('button[type="submit"]');
  btn.disabled = loading;
  btn.textContent = loading? 'Memproses...' : 'Lanjutkan';
}

function showError(msg){
  errorEl.textContent = msg;
  errorEl.animate([{transform:'translateX(-4px)'},{transform:'translateX(4px)'},{transform:'translateX(0)'}], {duration:250});
}

function switchTab(daftar){
  isDaftar = daftar;
  tabMasuk.classList.toggle('active',!daftar);
  tabDaftar.classList.toggle('active', daftar);
  tabMasuk.setAttribute('aria-selected', String(!daftar));
  tabDaftar.setAttribute('aria-selected', String(daftar));
  inputName.style.display = daftar? 'block' : 'none';
  inputName.required = daftar;
  inputPass.autocomplete = daftar? 'new-password' : 'current-password';
  errorEl.textContent = '';
  inputEmail.focus();
}

tabMasuk?.addEventListener('click', ()=>switchTab(false));
tabDaftar?.addEventListener('click', ()=>switchTab(true));

// ——— Auth Actions ———
async function handleGoogle(){
  try{
    setLoading(true);
    const res = await signInWithPopup(auth, provider);
    window.closeAuth?.();
    toast(`Waalaikumsalam, ${res.user.displayName?.split(' ')[0] || 'Kak'}!`);
  }catch(e){
    if(e.code!== 'auth/popup-closed-by-user' && e.code!== 'auth/cancelled-popup-request'){
      showError('Login Google gagal. Coba lagi.');
    }
  }finally{ setLoading(false); }
}

async function handleEmailSubmit(e){
  e.preventDefault();
  errorEl.textContent = '';
  const email = inputEmail.value.trim();
  const pass = inputPass.value;
  const name = inputName.value.trim();

  if(!email ||!pass || (isDaftar && pass.length < 6)){
    return showError('Email & password (min 6) wajib diisi');
  }
  if(isDaftar &&!name) return showError('Nama lengkap wajib diisi');

  try{
    setLoading(true);
    let cred;
    if(isDaftar){
      cred = await createUserWithEmailAndPassword(auth, email, pass);
      await updateProfile(cred.user, { displayName: name });
      toast(`Akun berhasil dibuat, ${name}!`);
    }else{
      cred = await signInWithEmailAndPassword(auth, email, pass);
      toast(`Selamat datang kembali!`);
    }
    form.reset();
    window.closeAuth?.();
  }catch(err){
    const map = {
      'auth/email-already-in-use': 'Email sudah terdaftar. Silakan masuk.',
      'auth/invalid-email': 'Format email tidak valid.',
      'auth/weak-password': 'Password minimal 6 karakter.',
      'auth/user-not-found': 'Akun tidak ditemukan. Daftar dulu yuk.',
      'auth/wrong-password': 'Password salah.',
      'auth/invalid-credential': 'Email atau password salah.'
    };
    showError(map[err.code] || 'Terjadi kesalahan. Coba lagi.');
  }finally{ setLoading(false); }
}

form?.addEventListener('submit', handleEmailSubmit);
btnGoogle?.addEventListener('click', handleGoogle);
googleModalBtn?.addEventListener('click', handleGoogle);

// ——— Auth State (NO FLICKER) ———
// Sembunyikan tombol dulu sampai auth siap
btnGoogle.style.visibility = 'hidden';
btnEmail.style.visibility = 'hidden';

onAuthStateChanged(auth, (user) => {
  authReady = true;
  btnGoogle.style.visibility = 'visible';
  btnEmail.style.visibility = 'visible';

  if(user){
    // Logged in
    const name = user.displayName?.split(' ')[0] || user.email?.split('@')[0] || 'Akun';
    const photo = user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=14b8a6&color=000`;

    btnGoogle.innerHTML = `<img src="${photo}" alt="" style="width:22px;height:22px;border-radius:50%;object-fit:cover"> <span>${name}</span>`;
    btnGoogle.onclick = null;
    btnGoogle.title = user.email;

    btnEmail.textContent = 'Keluar';
    btnEmail.onclick = async () => {
      await signOut(auth);
      toast('Sampai jumpa lagi!');
    };

    // Simpan untuk chat-backend
    window.IMAN_AUTH = { currentUser: user };
    localStorage.setItem('iman_user', JSON.stringify({uid:user.uid, name}));

  }else{
    // Logged out
    btnGoogle.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M21.35 11.1h-9.18v2.96h5.27c-.23 1.42-1.6 4.16-5.27 4.16-3.17 0-5.76-2.63-5.76-5.87s2.59-5.87 5.76-5.87c1.81 0 3.02.77 3.71 1.43l2.53-2.44C16.9 3.5 14.68 2.4 12.17 2.4 6.7 2.4 2.4 6.7 2.4 12.23s4.3 9.83 9.77 9.83c5.64 0 9.38-3.96 9.38-9.54 0-.64-.07-1.12-.2-1.42z"/></svg> <span>Google</span>`;
    btnGoogle.onclick = handleGoogle;

    btnEmail.textContent = 'Masuk';
    btnEmail.onclick = () => {
      switchTab(false);
      modal?.classList.remove('hidden');
      setTimeout(()=>inputEmail.focus(), 100);
    };

    window.IMAN_AUTH = { currentUser: null };
    localStorage.removeItem('iman_user');
  }
});

// Buka modal dari header
btnEmail?.addEventListener('click', (e)=>{
  if(!auth.currentUser) e.stopPropagation(); // biar onAuthStateChanged yang handle
});

// Tutup modal klik luar
modal?.addEventListener('click', (e)=>{ if(e.target===modal) window.closeAuth?.() });

// ESC tutup
window.addEventListener('keydown', e=>{ if(e.key==='Escape' &&!modal.classList.contains('hidden')) window.closeAuth?.() });

// Expose
window.IMAN_AUTH = auth;