import useAuthUser from '../hooks/useAuthUser';
import useMoodStats from '../hooks/useMoodStats';
import ProfileCard from '../components/account/ProfileCard';
import MoodStats from '../components/account/MoodStats';
import FavoriteFilms from '../components/account/FavoriteFilms';
import ActivityHistory from '../components/account/ActivityHistory';
import ChangePasswordForm from '../components/account/ChangePasswordForm';
import { useLanguageCopy } from '../utils/i18n';

export default function Account() {
  const user = useAuthUser();
  const { stats, topMood } = useMoodStats();
  const { text } = useLanguageCopy();
  const ui = text.ui;

  if (!user) {
    return (
      <section className="container-page py-16 md:py-24">
        <div className="premium-card mx-auto max-w-2xl p-8 text-center">
          <p className="section-eyebrow">{ui.accountLabel}</p>
          <h1 className="mt-3 text-4xl font-black tracking-[-0.04em]">{ui.loginFirstTitle}</h1>
          <p className="mt-4 text-iim-brown dark:text-iim-sand">{ui.loginFirstDesc}</p>
          <a href="#/" className="btn-primary mt-6 inline-flex">{ui.backHome}</a>
        </div>
      </section>
    );
  }

  return (
    <section className="account-page container-page py-10 md:py-14">
      <ProfileCard user={user} />
      <div className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <MoodStats stats={stats} topMood={topMood} />
        <ChangePasswordForm user={user} />
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <FavoriteFilms />
        <ActivityHistory />
      </div>
    </section>
  );
}
