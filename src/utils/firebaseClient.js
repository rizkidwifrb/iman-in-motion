const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || ''
};

let appCache = null;
let authCache = null;
let firestoreCache = null;
let authSdkCache = null;
let firestoreSdkCache = null;

async function loadAppSdk() {
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId || !firebaseConfig.appId) {
    throw new Error('Firebase belum dikonfigurasi. Isi VITE_FIREBASE_* di file .env.production sebelum build.');
  }
  const appSdk = await import(/* @vite-ignore */ 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js');
  appCache = appSdk.getApps?.()?.[0] || appCache || appSdk.initializeApp(firebaseConfig);
  return { app: appCache, appSdk };
}

export async function loadFirebaseAuthClient() {
  if (authCache && authSdkCache) return { auth: authCache, ...authSdkCache };
  const { app } = await loadAppSdk();
  const authSdk = await import(/* @vite-ignore */ 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js');
  authCache = authSdk.getAuth(app);
  const provider = new authSdk.GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  authSdkCache = { ...authSdk, provider };
  return { auth: authCache, ...authSdkCache };
}

export async function loadFirestoreClient() {
  if (firestoreCache && firestoreSdkCache) return { db: firestoreCache, ...firestoreSdkCache };
  const { app } = await loadAppSdk();
  const firestoreSdk = await import(/* @vite-ignore */ 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');
  firestoreCache = firestoreSdk.getFirestore(app);
  firestoreSdkCache = firestoreSdk;
  return { db: firestoreCache, ...firestoreSdk };
}
