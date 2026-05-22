import { useEffect, useState } from 'react';
import { Camera, LogOut, Save } from 'lucide-react';
import { initialsFromUser, loadUserScoped, readUserScoped, saveProfilePatch } from '../../utils/accountStorage';
import { useLanguageCopy } from '../../utils/i18n';

export default function ProfileCard({ user }) {
  const [profile, setProfile] = useState(() => readUserScoped('iim_profile', {}, user));
  const { text } = useLanguageCopy();
  const ui = text.ui;
  const [name, setName] = useState(profile.name || user?.name || '');
  const photo = profile.photoURL ?? user?.photoURL;

  useEffect(() => {
    const cached = readUserScoped('iim_profile', {}, user);
    setProfile(cached);
    setName(cached.name || user?.name || '');
    loadUserScoped('iim_profile', {}, user).then((next) => {
      setProfile(next);
      setName(next.name || user?.name || '');
    });
  }, [user]);

  function uploadPhoto(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const next = await saveProfilePatch({ photoURL: reader.result, name }, user);
      setProfile(next || {});
    };
    reader.readAsDataURL(file);
  }

  async function saveProfile() {
    const next = await saveProfilePatch({ name: name.trim() || user?.name || 'Kak IMAN' }, user);
    setProfile(next || {});
  }

  async function logout() {
    try {
      const { loadFirebaseAuthClient } = await import('../../utils/firebaseClient');
      const { auth, signOut } = await loadFirebaseAuthClient();
      await signOut(auth);
    } catch {}
    localStorage.removeItem('iman_user');
    window.dispatchEvent(new Event('iman-auth-change'));
    window.location.hash = '#/';
  }

  return (
    <section className="account-hero premium-card p-5 md:p-7">
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <div className="account-avatar">
            {photo ? <img src={photo} alt={name || user?.email} /> : <span>{initialsFromUser({ ...user, name })}</span>}
            <label className="account-avatar-upload" title={ui.changePhoto}>
              <Camera size={14} />
              <input type="file" accept="image/*" onChange={uploadPhoto} />
            </label>
          </div>
          <div className="min-w-0">
            <p className="section-eyebrow">{ui.accountLabel}</p>
            <h1 className="mt-2 truncate text-3xl font-black tracking-[-0.04em] md:text-5xl">{name || user?.name || 'Kak IMAN'}</h1>
            <p className="mt-2 truncate text-sm font-bold text-iim-brown dark:text-iim-sand">{user?.email || ui.noEmail}</p>
          </div>
        </div>
        <button type="button" onClick={logout} className="btn-secondary inline-flex items-center justify-center gap-2"><LogOut size={16} /> {ui.logout}</button>
      </div>
      <div className="mt-6 grid gap-3 md:grid-cols-[1fr_auto]">
        <input className="input-premium" value={name} onChange={(event) => setName(event.target.value)} placeholder={ui.displayName} />
        <button type="button" onClick={saveProfile} className="btn-primary inline-flex items-center justify-center gap-2"><Save size={16} /> {ui.saveProfile}</button>
      </div>
    </section>
  );
}
