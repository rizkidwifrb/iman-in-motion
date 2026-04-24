// login.js - Firebase Auth (Google + Email) - FIX NO FLICKER
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDi3zOmx6tf9MSCMp7HDlCk4-5QY4nZK7E",
  authDomain: "uwiberani-project.firebaseapp.com",
  projectId: "uwiberani-project",
  storageBucket: "uwiberani-project.firebasestorage.app",
  messagingSenderId: "735078024592",
  appId: "1:735078024592:web:8e15bb85b0448402425f15",
  measurementId: "G-DYW0J99V75"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

const btnGoogle = document.getElementById('loginGoogle');
const btnEmail = document.getElementById('loginEmail');

btnGoogle?.addEventListener('click', async () => {
  try {
    const result = await signInWithPopup(auth, provider);
    toast(`Assalamualaikum, ${result.user.displayName}!`);
  } catch (e) { alert('Login gagal: ' + e.message); }
});

btnEmail?.addEventListener('click', async () => {
  const email = prompt('Email kamu:');
  if(!email) return;
  const password = prompt('Password (min 6):');
  if(!password) return;
  try {
    const userCred = await signInWithEmailAndPassword(auth, email, password)
      .catch(() => createUserWithEmailAndPassword(auth, email, password));
    toast(`Berhasil masuk!`);
  } catch(e){ alert('Error: ' + e.message); }
});

onAuthStateChanged(auth, (user) => {
  if(user){
    btnGoogle.innerHTML = `<img src="${user.photoURL||'logo.png'}" style="width:20px;height:20px;border-radius:50%"> ${user.displayName||'Akun'}`;
    btnEmail.textContent = 'Logout';
    btnEmail.onclick = () => signOut(auth);
  } else {
    btnGoogle.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24"><path fill="currentColor" d="M21.35 11.1h-9.18v2.96h5.27c-.23 1.42-1.6 4.16-5.27 4.16-3.17 0-5.76-2.63-5.76-5.87s2.59-5.87 5.76-5.87c1.81 0 3.02.77 3.71 1.43l2.53-2.44C16.9 3.5 14.68 2.4 12.17 2.4 6.7 2.4 2.4 6.7 2.4 12.23s4.3 9.83 9.77 9.83c5.64 0 9.38-3.96 9.38-9.54 0-.64-.07-1.12-.2-1.42z"/></svg> Login Google`;
    btnEmail.textContent = 'Daftar Email';
    btnEmail.onclick = null;
  }
});

function toast(msg){
  const t = document.createElement('div');
  t.textContent = msg;
  t.style.cssText = 'position:fixed;bottom:100px;left:50%;transform:translateX(-50%);background:linear-gradient(90deg,#14b8a6,#c9763a);color:#000;padding:12px 20px;border-radius:12px;font-weight:700;z-index:9999';
  document.body.appendChild(t);
  setTimeout(()=>t.remove(),3000);
}
window.IMAN_AUTH = auth;
