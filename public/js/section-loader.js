// Lightweight section loader + hash router to preserve SPA animations

const SECTION_PARTIALS = {
  // Start by loading sections we have extracted
  'home': 'sections/home.html',
  'player-search': 'sections/player-search.html',
  'match-search': 'sections/match-search.html',
  'item-stats': 'sections/item-stats.html',
  'hero-stats': 'sections/hero-stats.html',
  // Add the rest incrementally as they are extracted:
  // 'home': '/sections/home.html',
  // 'player-search': '/sections/player-search.html',
  // 'hero-stats': '/sections/hero-stats.html',
};

const loadedSections = new Set();

async function loadSectionView(sectionId) {
  if (loadedSections.has(sectionId)) return;
  const el = document.getElementById(sectionId);
  if (!el) return;

  const url = SECTION_PARTIALS[sectionId];
  if (!url) {
    // No external partial configured; treat as already present
    loadedSections.add(sectionId);
    return;
  }

  try {
    const res = await fetch(url, { cache: 'no-cache' });
    if (!res.ok) throw new Error(`Failed to load ${url}: ${res.status}`);
    const html = await res.text();
    el.innerHTML = html;
    loadedSections.add(sectionId);
  } catch (err) {
    console.error('Section load failed:', err);
  }
}

function onReady(fn) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fn, { once: true });
  } else {
    fn();
  }
}

function resolveSectionFromUrl() {
  // Support hash-based routing: #home, #hero-stats, etc.
  const hash = (window.location.hash || '').replace(/^#/, '').trim();
  if (hash) return hash;

  // Optional subdomain mapping (non-breaking; no navigation). Example:
  // heroes.example.com -> hero-stats, items.example.com -> item-stats
  const hostPrefix = window.location.hostname.split('.')[0];
  const map = {
    heroes: 'hero-stats',
    items: 'item-stats',
    match: 'match-search',
    player: 'player-search',
    home: 'home',
  };
  return map[hostPrefix];
}

onReady(() => {
  // Navigate to section indicated by URL if present
  const initial = resolveSectionFromUrl();
  if (initial && typeof window.switchSection === 'function') {
    // Defer slightly to ensure inline scripts fully registered
    setTimeout(() => window.switchSection(initial), 0);
  }

  // If you later want back/forward support, you can add:
  // window.addEventListener('hashchange', () => {
  //   const s = resolveSectionFromUrl();
  //   if (s && typeof window.switchSection === 'function') window.switchSection(s);
  // });
});

// Expose for index inline script
window.loadSectionView = loadSectionView;
