export type Lang = 'en' | 'es';

// Site is English-only. Keep structure simple and avoid swapped ES/EN toggle confusion.
export const translations: Record<Lang, Record<string, string>> = {
  en: {
    'nav.explore': 'Explore',
    'nav.vision': 'Vision',
    'nav.about': 'About',
    'nav.openMenu': 'Open menu',
    'nav.closeMenu': 'Close menu',
    'nav.main': 'Main navigation',
    'nav.mobile': 'Mobile navigation',
    'nav.toggleTheme': 'Toggle theme',
    'nav.toLight': 'Switch to light theme',
    'nav.toDark': 'Switch to dark theme',
    'nav.lang': 'Language',
    'hero.kicker': 'Scientific exploration · Terrestrial analogs',
    'hero.title': 'Exploring Earth to understand other worlds.',
    'hero.subtitle': 'Itzamná identifies terrestrial regions with characteristics comparable to environments on the Moon and Mars through geospatial analysis and scientific criteria.',
    'hero.cta': 'Explore Itzamná',
    'safety.title': 'SAFETY AND PRIVATE PROPERTY NOTICE',
    'safety.text1': 'By continuing, you agree that you must respect local laws and private property boundaries.',
    'safety.text2': 'Entering land, homes, or enclosed spaces to interact with game elements is strictly prohibited. The developer is not responsible for legal penalties, accidents, or damages resulting from unauthorized access to any property.',
    'safety.accept': 'I accept and understand',
    'home.viewContent': 'View content',
    'home.aboutProject': 'About the project',
    'content.hero.kicker': 'Itzamná · Mission and context',
    'content.hero.title': "From Earth's surface to planetary exploration",
    'content.hero.subtitle': 'Learn about the purpose, analysis, and technology behind the platform in short sections, one at a time.',
    'content.next': 'Next',
    'content.prev': 'Previous',
    'content.exploreNow': 'Explore now',
    'content.goExplore': 'Go to explorer',
    'content.img1.alt': 'Earth from space',
    'content.s1.kicker': 'Platform',
    'content.s1.title': 'What is Itzamná?',
    'content.s1.p1': '<strong>Itzamná (Integrated Terrestrial-Zonal Analog &amp; Multi-factor Nearest Atlas)</strong> is a platform that helps locate and compare regions on Earth with features similar to areas on the Moon and Mars.',
    'content.s1.p2': 'From a geographic point, a radius, and selected characteristics, it calculates analog candidates and presents georeferenced information, similarity by criteria, and supporting data for exploration and analysis.',
    'content.img2.alt': 'Mars surface at Gale Crater',
    'content.s2.kicker': 'Purpose',
    'content.s2.title': 'Our purpose',
    'content.s2.p1': 'Finding terrestrial analogs makes it possible to study, on our own planet, conditions and landscapes comparable to extraterrestrial environments. This helps prepare observations, training, and analysis in accessible places before considering lunar or Martian scenarios.',
    'content.s2.p2': 'Itzamná aims to make that comparison clearer: bringing together location, environmental context, and similarity criteria in a single view to support decision-making and learning.',
    'content.img3.alt': 'Lunar surface with craters and basaltic maria',
    'content.s3.kicker': 'Geospatial analysis',
    'content.s3.title': 'Exploration and analysis',
    'content.s3.p1': 'The platform lets you select a planet and an area of interest, choose a point on the map, and define a search radius. With these parameters it generates calculated candidates in the area and shows their similarity, distance, and correlation by field.',
    'content.s3.p2': 'Results combine query data (when sources respond) with local estimates marked as such, offering a transparent reading between retrieved data and calculated values.',
    'content.img4.alt': 'Topographic map representing surface analysis',
    'content.s4.kicker': 'Architecture',
    'content.s4.title': 'Technology',
    'content.s4.intro': 'Itzamná integrates web and scientific computing components, each with a defined responsibility:',
    'content.s4.t1': '<strong>Astro:</strong> static/modular web interface and view composition.',
    'content.s4.t2': '<strong>TypeScript:</strong> interaction logic, typing, and explorer utilities.',
    'content.s4.t3': '<strong>Tailwind CSS:</strong> styling and responsive visual system.',
    'content.s4.t4': '<strong>ASP.NET Core (.NET):</strong> API gateway/proxy and health/search endpoints.',
    'content.s4.t5': '<strong>Python (FastAPI):</strong> scientific search engine and analog calculation.',
    'content.img5.alt': 'Planetary exploration concept and rocky terrain',
    'content.s5.kicker': 'Evolution',
    'content.s5.title': 'Looking ahead',
    'content.s5.p1': "The project's vision is to strengthen the accuracy and usefulness of comparisons by progressively incorporating better data sources and documented analysis criteria, making the tool increasingly useful in educational and exploratory planning contexts.",
    'content.s5.p2': 'Any new capability will be incorporated gradually and verifiably, maintaining a clear distinction between calculated results, estimates, and data from external sources.',
    'explorer.title': "Explore terrestrial analogs",
    'explorer.confirm': "Confirm and search",
    'explorer.confirmSub': "Generate analog candidates in the area",
    'explorer.viewResults': "View results",
    'explorer.searchByFeatures': "Search by characteristics",
    'explorer.exportCsv': "Export CSV",
    'explorer.exportPdf': "Export PDF",
    'explorer.onlyEarth': "Earth only",
    'explorer.onlyZone': "Planet only",
    'explorer.infoGeneral': "General information",
    'explorer.infoAdvanced': "Advanced information · Both",
    'explorer.infoGeneralHint': "Select Earth or Moon/Mars to view its information",
    'explorer.infoAdvancedHint': "Shows both (Earth and Moon/Mars) with technical detail, sources, methodology, and formulas",
    'explorer.showAdvanced': "Show advanced information",
    'explorer.back': "Back",
    'explorer.home': "Home",
    'explorer.content': "Content",

    'vision.kicker': 'Vision',
    'vision.h1': 'A clear way to understand Earth as a laboratory for other worlds',
    'vision.lead': 'Itzamná aims to bring together, in a single view, the terrestrial landscapes that most closely resemble lunar and Martian environments, to facilitate comparison, learning, and analysis.',
    'vision.img1.alt': 'Rocky landscape evoking planetary exploration terrain',
    'vision.s1.kicker': 'Analog atlas',
    'vision.s1.h2': 'An atlas of analogs for exploration',
    'vision.s1.p': 'The proposal is for observation to move from fragmented to a tool for comparing terrains and contexts with scientific criteria, supporting activities such as scenario study and analysis preparation.',
    'vision.img2.alt': 'Topographic and geospatial representation',
    'vision.s2.kicker': 'Learn and design',
    'vision.s2.h2': 'Designed to learn and compare',
    'vision.s2.p': 'Each comparison is presented in accessible language for students, researchers, and teams interested in understanding which conditions on Earth are most similar to those expected on the Moon or Mars, while keeping the origin of data and estimates visible.',
    'vision.c1.kicker': 'Audience',
    'vision.c1.h3': 'Who can it serve?',
    'vision.c1.p': 'Researchers, educators, students, and people interested in space who want to explore comparisons between terrestrial landscapes and lunar or Martian environments.',
    'vision.c2.kicker': 'Approach',
    'vision.c2.h3': 'Clarity and traceability',
    'vision.c2.p': 'The vision prioritizes a comprehensible experience, where similarity and displayed fields make it possible to distinguish between queried, calculated, and estimated information when applicable.',

    'about.kicker': 'Project',
    'about.h1': 'About Itzamná',
    'about.lead': 'Itzamná (Integrated Terrestrial-Zonal Analog & Multi-factor Nearest Atlas) is a platform to identify and compare regions on Earth with characteristics comparable to environments on the Moon and Mars, supported by geospatial analysis and scientific criteria.',
    'about.nav.intro': 'Introduction',
    'about.nav.problem': 'Problem',
    'about.nav.mission': 'Mission',
    'about.nav.vision': 'Vision',
    'about.nav.values': 'Values',
    'about.nav.team': 'Team',
    'about.nav.tech': 'Technologies',
    'about.nav.goals': 'Goals',
    'about.s1.kicker': 'Introduction',
    'about.s1.h2': 'An atlas of analogs between Earth and other worlds',
    'about.s1.p1': 'Itzamná brings together, in a single experience, selecting a point on Earth, a search radius, and characteristics of interest to find analog candidates for lunar or Martian zones.',
    'about.s1.p2': 'Its goal is to facilitate comparison between terrestrial landscapes and planetary environments through a clear interface and results with supporting information.',
    'about.img2.alt': 'Martian terrain from orbit',
    'about.s2.kicker': 'Context',
    'about.s2.h2': 'What problem it aims to address',
    'about.s2.p1': 'Studying environments similar to the Moon or Mars often requires identifying places on Earth that share relevant traits. That search can be fragmented and hard to compare when geographic, environmental, and similarity information is not integrated.',
    'about.s2.p2': 'Itzamná addresses this need by offering a way to explore candidates in a defined area and visualize, in a unified way, their location, similarity, and associated descriptive fields.',
    'about.mission.kicker': 'Mission',
    'about.mission.h2': 'Make Earth and other worlds comparable',
    'about.mission.p': 'Facilitate the identification and understanding of terrestrial regions analogous to environments on the Moon and Mars, presenting geospatial information and similarity criteria clearly and usefully for learning and exploration.',
    'about.mission.card.h3': 'In practice',
    'about.mission.li1': 'Allow selection of location, radius, and characteristics of interest.',
    'about.mission.li2': 'Calculate and display comparable candidates in the indicated area.',
    'about.mission.li3': 'Communicate similarity and fields with traceability when they come from external sources or local estimates.',
    'about.vision.kicker': 'Vision',
    'about.vision.h2': 'A clear reference for planetary comparison',
    'about.vision.p': 'We aspire for Itzamná to evolve as an increasingly precise and transparent tool for exploring terrestrial analogs, progressively integrating better data and documented criteria that support educational and exploratory planning contexts.',
    'about.values.kicker': 'Values',
    'about.values.h2': 'Project principles',
    'about.v1.t': 'Scientific clarity',
    'about.v1.d': 'Distinguish queried data, estimates, and calculated results.',
    'about.v2.t': 'Usefulness',
    'about.v2.d': 'Present understandable comparisons for exploration and learning.',
    'about.v3.t': 'Progressive rigor',
    'about.v3.d': 'Improve criteria and sources in a verifiable, documented way.',
    'about.v4.t': 'Accessibility',
    'about.v4.d': 'Make geospatial information easier to explore and understand.',
    'about.team.kicker': 'Team',
    'about.team.h2': 'Development team',
    'about.team.p': 'Space prepared to document the people who contribute to the project. (No invented names, photos, or roles.)',
    'about.team.member1': 'Member 1',
    'about.team.member2': 'Member 2',
    'about.team.member3': 'Member 3',
    'about.team.namePending': 'Name to be added',
    'about.team.rolePending': 'Role / contribution to be documented',
    'about.tech.kicker': 'Technologies',
    'about.tech.h2': 'Project stack',
    'about.tech.p': 'Technologies currently used and their responsibility within Itzamná:',
    'about.tech.li1': '<strong>Astro:</strong> Frontend and fast page generation.',
    'about.tech.li2': '<strong>TypeScript:</strong> Typing and client-side logic.',
    'about.tech.li3': '<strong>Tailwind CSS:</strong> Styling and responsive design.',
    'about.tech.li4': '<strong>ASP.NET Core:</strong> API/backend that orchestrates queries.',
    'about.tech.li5': '<strong>Python:</strong> Processing and computation in the scientific engine.',
    'about.tech.li6': '<strong>FastAPI:</strong> Scientific service for analog search and analysis.',
    'about.goals.kicker': 'Goals and evolution',
    'about.goals.h2': 'Continuous and verifiable improvement',
    'about.goals.p': 'The project seeks to gradually improve data quality, comparison criteria, and the exploration experience, prioritizing transparency about the origin of information (external sources, calculations, or estimates) and maintaining existing capabilities while incorporating documented improvements.',
  },
  es: {
    // Kept for type compatibility; site runs in English-only mode.
  }
};

export function getLang(): Lang {
  return 'en';
}

export function t(lang: Lang, key: string): string {
  return translations.en[key] ?? key;
}

export function applyI18n(_lang: Lang): void {
  const lang: Lang = 'en';
  document.documentElement.lang = 'en';
  try { localStorage.setItem('itzamna-lang', 'en'); } catch {}
  document.querySelectorAll<HTMLElement>('[data-i18n]').forEach((el) => {
    const key = el.dataset.i18n;
    if (key) el.textContent = t(lang, key);
  });
  document.querySelectorAll<HTMLElement>('[data-i18n-html]').forEach((el) => {
    const key = el.dataset.i18nHtml;
    if (key) el.innerHTML = t(lang, key);
  });
  document.querySelectorAll<HTMLElement>('[data-i18n-aria]').forEach((el) => {
    const key = el.dataset.i18nAria;
    if (key) el.setAttribute('aria-label', t(lang, key));
  });
  document.querySelectorAll<HTMLElement>('[data-i18n-placeholder]').forEach((el) => {
    const key = el.dataset.i18nPlaceholder;
    if (key) (el as HTMLInputElement).placeholder = t(lang, key);
  });
  const langBtn = document.getElementById('lang-toggle');
  if (langBtn) {
    langBtn.textContent = 'EN';
    langBtn.setAttribute('aria-label', 'Language: English');
    langBtn.title = 'English';
  }
  window.dispatchEvent(new CustomEvent('itzamna:lang', { detail: { lang } }));
}
