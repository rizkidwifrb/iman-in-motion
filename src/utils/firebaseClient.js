const firebaseConfig = {
  apiKey: 'AIzaSyDi3zOmx6tf9MSCMp7HDlCk4-5QY4nZK7E',
  authDomain: 'uwiberani-project.firebaseapp.com',
  projectId: 'uwiberani-project',
  storageBucket: 'uwiberani-project.appspot.com',
  messagingSenderId: '735078024592',
  appId: '1:735078024592:web:8e15bb85b0448402425f15'
};

let appCache = null;
let authCache = null;
let firestoreCache = null;
let authSdkCache = null;
let firestoreSdkCache = null;

async function loadAppSdk() {
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
