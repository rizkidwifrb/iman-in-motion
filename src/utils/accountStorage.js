import { loadFirestoreClient } from './firebaseClient';

const USER_KEY = 'iman_user';
const ACCOUNT_DATA_COLLECTION = 'accountData';
const FIRESTORE_ENABLED_KEY = 'iim_firestore_enabled';

export function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) || 'null');
  } catch {
    return null;
  }
}

export function getUserId(user = getStoredUser()) {
  return String(user?.uid || user?.email || user?.name || 'guest').replace(/[^a-zA-Z0-9_-]/g, '_');
}

export function initialsFromUser(user) {
  const source = user?.name || user?.displayName || user?.email || 'I M';
  const parts = String(source).replace(/@.*/, '').split(/[\s._-]+/).filter(Boolean);
  return (parts[0]?.[0] || 'I').toUpperCase() + (parts[1]?.[0] || parts[0]?.[1] || 'M').toUpperCase();
}

function scopedLocalKey(key, user = getStoredUser()) {
  return `${key}_${getUserId(user)}`;
}

export function readUserScoped(key, fallback, user = getStoredUser()) {
  try {
    const value = localStorage.getItem(scopedLocalKey(key, user));
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function writeLocalUserScoped(key, value, user = getStoredUser()) {
  localStorage.setItem(scopedLocalKey(key, user), JSON.stringify(value));
}

function dispatchAccountChange(key, status = 'synced') {
  window.dispatchEvent(new CustomEvent('iim-account-data-change', { detail: { key, status } }));
}

function firestoreDisabled() {
  return localStorage.getItem(FIRESTORE_ENABLED_KEY) === 'false';
}

async function accountDataDoc(key, user = getStoredUser()) {
  if (!user || firestoreDisabled()) return null;
  const { db, doc } = await loadFirestoreClient();
  return doc(db, 'users', getUserId(user), ACCOUNT_DATA_COLLECTION, key);
}

export async function loadUserScoped(key, fallback, user = getStoredUser()) {
  if (!user) return fallback;
  const cached = readUserScoped(key, fallback, user);
  if (firestoreDisabled()) return cached;

  try {
    const { getDoc } = await loadFirestoreClient();
    const ref = await accountDataDoc(key, user);
    if (!ref) return cached;
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      // First-run migration: copy the old localStorage value into Firestore.
      if (cached !== fallback && cached !== undefined) await writeUserScoped(key, cached, user, { silent: true });
      return cached;
    }
    const cloudValue = snap.data()?.value ?? fallback;
    writeLocalUserScoped(key, cloudValue, user);
    return cloudValue;
  } catch (error) {
    console.warn('[IIM] Firestore read fallback to localStorage:', key, error?.message || error);
    return cached;
  }
}

export async function writeUserScoped(key, value, user = getStoredUser(), options = {}) {
  if (!user) return value;
  writeLocalUserScoped(key, value, user);
  if (!options.silent) dispatchAccountChange(key, 'local');

  if (firestoreDisabled()) return value;
  try {
    const { setDoc, serverTimestamp } = await loadFirestoreClient();
    const ref = await accountDataDoc(key, user);
    if (!ref) return value;
    await setDoc(ref, {
      value,
      updatedAt: serverTimestamp(),
      userId: getUserId(user),
      schemaVersion: 1
    });
    if (!options.silent) dispatchAccountChange(key, 'cloud');
  } catch (error) {
    console.warn('[IIM] Firestore write failed, local cache kept:', key, error?.message || error);
    if (!options.silent) dispatchAccountChange(key, 'offline');
  }
  return value;
}

export async function addActivity(type, payload = {}, user = getStoredUser()) {
  if (!user) return;
  const current = await loadUserScoped('iim_activity', [], user);
  const next = [
    { id: `${Date.now()}-${Math.random().toString(16).slice(2)}`, type, at: new Date().toISOString(), ...payload },
    ...current
  ].slice(0, 80);
  await writeUserScoped('iim_activity', next, user);
}

export async function saveProfilePatch(patch, user = getStoredUser()) {
  if (!user) return null;
  const current = await loadUserScoped('iim_profile', {}, user);
  const next = { ...current, ...patch, updatedAt: new Date().toISOString() };
  await writeUserScoped('iim_profile', next, user);

  const mergedUser = { ...user, name: next.name || user.name, photoURL: next.photoURL ?? user.photoURL };
  localStorage.setItem(USER_KEY, JSON.stringify(mergedUser));
  window.dispatchEvent(new Event('iman-auth-change'));
  return next;
}

export async function migrateLocalAccountDataToFirestore(user = getStoredUser()) {
  if (!user || firestoreDisabled()) return false;
  const keys = ['iim_profile', 'iim_favorites', 'iim_mood_stats', 'iim_activity'];
  await Promise.all(keys.map(async (key) => {
    const value = readUserScoped(key, key === 'iim_mood_stats' ? { counts: {}, total: 0, lastMood: '' } : key === 'iim_profile' ? {} : [], user);
    await writeUserScoped(key, value, user, { silent: true });
  }));
  dispatchAccountChange('all', 'migrated');
  return true;
}
