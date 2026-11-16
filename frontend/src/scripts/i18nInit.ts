import { applyI18n, type Lang } from './i18n';

function init() {
  const langBtn = document.getElementById('lang-toggle');
  const lang: Lang = 'en';
  try { localStorage.setItem('itzamna-lang', 'en'); } catch {}
  applyI18n(lang);

  // English-only site: keep toggle inert to avoid ES/EN confusion.
  langBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    applyI18n('en');
  });
}

if ('requestIdleCallback' in window) {
  (window as any).requestIdleCallback(init, { timeout: 1500 });
} else {
  setTimeout(init, 0);
}
