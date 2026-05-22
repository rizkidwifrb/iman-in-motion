import { useState } from 'react';
import { loadFirebaseAuthClient } from '../../utils/firebaseClient';
import { useLanguageCopy } from '../../utils/i18n';

export default function ChangePasswordForm({ user }) {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const { text } = useLanguageCopy();
  const ui = text.ui;

  async function submit(event) {
    event.preventDefault();
    setMessage('');
    if (newPassword.length < 8) return setMessage('Password baru minimal 8 karakter.');
    if (newPassword !== confirm) return setMessage('Konfirmasi password belum sama.');
    setLoading(true);
    try {
      const { auth, EmailAuthProvider, reauthenticateWithCredential, updatePassword } = await loadFirebaseAuthClient();
      const current = auth.currentUser;
      if (!current?.email) throw new Error('Akun Firebase belum aktif. Login ulang dulu.');
      const credential = EmailAuthProvider.credential(current.email, oldPassword);
      await reauthenticateWithCredential(current, credential);
      await updatePassword(current, newPassword);
      setOldPassword(''); setNewPassword(''); setConfirm('');
      setMessage('Password berhasil diganti.');
    } catch (error) {
      const code = error?.code || '';
      setMessage(code === 'auth/wrong-password' || code === 'auth/invalid-credential'
        ? 'Password lama salah.'
        : 'Belum bisa mengganti password. Untuk akun Google, ubah password lewat akun Google.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="premium-card p-5 md:p-6">
      <p className="section-eyebrow">{ui.securityTitle}</p>
      <h2 className="mt-2 text-2xl font-black">{ui.changePassword}</h2>
      <form onSubmit={submit} className="mt-5 grid gap-3">
        <input className="input-premium" type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} placeholder={ui.oldPassword} required />
        <input className="input-premium" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder={ui.newPassword} required minLength={8} />
        <input className="input-premium" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder={ui.confirmPassword} required minLength={8} />
        {message && <p className="rounded-2xl bg-iim-gold/15 px-4 py-3 text-sm font-bold text-iim-brown dark:text-iim-sand">{message}</p>}
        <button type="submit" disabled={loading} className="btn-primary disabled:cursor-wait disabled:opacity-60">{loading ? ui.processing : ui.saveNewPassword}</button>
      </form>
      <p className="mt-3 text-xs font-bold leading-6 text-iim-brown dark:text-iim-sand">{ui.googlePasswordNote}</p>
    </section>
  );
}
