import { applyI18n, type Lang } from './i18n';

const langBtn = document.getElementById('lang-toggle');
const lang: Lang = 'en';
try { localStorage.setItem('itzamna-lang', 'en'); } catch {}
applyI18n(lang);

// English-only site: keep toggle inert to avoid ES/EN confusion.
langBtn?.addEventListener('click', (e) => {
  e.preventDefault();
  applyI18n('en');
});
