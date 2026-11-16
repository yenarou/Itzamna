import type { Lang } from './i18n';

function init() {
  const langBtn = document.getElementById('lang-toggle');
  const lang: Lang = 'en';
  try { localStorage.setItem('itzamna-lang', 'en'); } catch {}
  document.documentElement.lang = 'en';
  // Site is English-only and markup is already in English; skip expensive DOM i18n rewrites on init.
  langBtn?.addEventListener('click', (e) => {
    e.preventDefault();
  });
}

if ('requestIdleCallback' in window) {
  (window as any).requestIdleCallback(init, { timeout: 2000 });
} else {
  setTimeout(init, 0);
}
