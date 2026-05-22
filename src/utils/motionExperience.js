let cleanupFns = [];

export function initMotionExperience() {
  if (typeof window === 'undefined') return () => {};
  cleanupMotionExperience();

  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
    return () => {};
  }

  const revealTargets = Array.from(document.querySelectorAll('[data-scroll-reveal], .premium-card, .film-card, .article-card'));
  if (!('IntersectionObserver' in window)) {
    revealTargets.forEach((el) => el.classList.add('is-revealed'));
    return () => {};
  }

  revealTargets.forEach((el) => el.classList.add('iim-reveal-ready'));

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-revealed');
      observer.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

  revealTargets.forEach((el) => observer.observe(el));
  cleanupFns = [() => observer.disconnect()];
  return cleanupMotionExperience;
}

export function cleanupMotionExperience() {
  cleanupFns.forEach((fn) => {
    try { fn(); } catch (error) {}
  });
  cleanupFns = [];
}
